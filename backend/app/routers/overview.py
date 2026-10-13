import io
import re
from typing import Any, Dict, List, Optional, Tuple, Union
from fastapi import APIRouter, Body, Depends, File, HTTPException, Query, Response, UploadFile, status
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

try:
    from ..database import get_db
    from ..models import Dataset, Metric
    from ..schemas import (
        AOVResponse,
        KPISummary,
        OverviewKPIRequest,
        RegionRevenue,
        RevenueByRegionResponse,
        RevenueOverTimeResponse,
        SessionStatusResponse,
        TimeSeriesRevenue,
        TotalRevenueResponse,
    )
    from ..services.session_store import (
        clear_active_dataset,
        get_active_dataset,
        get_session_info,
        set_active_dataset,
    )
    from ..services.cleaner import parse_file_to_dataframe
except (ImportError, ValueError):
    from app.database import get_db
    from app.models import Dataset, Metric
    from app.schemas import (
        AOVResponse,
        KPISummary,
        OverviewKPIRequest,
        RegionRevenue,
        RevenueByRegionResponse,
        RevenueOverTimeResponse,
        SessionStatusResponse,
        TimeSeriesRevenue,
        TotalRevenueResponse,
    )
    from app.services.session_store import (
        clear_active_dataset,
        get_active_dataset,
        get_session_info,
        set_active_dataset,
    )
    from app.services.cleaner import parse_file_to_dataframe

router = APIRouter()

# ---------------- Column Auto-Detection Heuristics ---------------- #

REVENUE_EXACT_CANDIDATES = [
    "total_revenue", "revenue", "sales", "total_sales", "sales_amount",
    "amount", "total_amount", "order_total", "grand_total",
    "total", "net_sales", "turnover", "subtotal", "line_total", "item_total",
    "gross_sales", "value", "extended_price"
]

REVENUE_KEYWORD_PATTERNS = ["revenue", "sales", "amount", "total", "turnover"]

REGION_EXACT_CANDIDATES = [
    "region", "sales_region", "country", "state", "territory",
    "location", "market", "area", "zone", "city", "geography",
    "province", "district", "store_location", "cust_state", "shipping_state"
]

REGION_KEYWORD_PATTERNS = ["region", "state", "location", "country", "territory", "market", "zone", "city", "area"]

DATE_EXACT_CANDIDATES = [
    "order_date", "invoice_date", "date", "timestamp", "created_at",
    "transaction_date", "time", "period", "order date", "sales_date",
    "purchase_date", "datetime", "day"
]

DATE_KEYWORD_PATTERNS = ["date", "time", "timestamp", "created", "period"]

ORDER_ID_EXACT_CANDIDATES = [
    "order_id", "orderid", "transaction_id", "invoice_id", "order_number",
    "order_no", "id", "receipt_id", "bill_id"
]

ORDER_ID_KEYWORD_PATTERNS = ["order_id", "orderid", "transaction_id", "invoice_id", "order_no", "order_num"]


def _clean_key(name: str) -> str:
    """Normalizes string for comparison: strips punctuation, spaces, and lowercases."""
    return re.sub(r"[^a-zA-Z0-9]", "", str(name).lower())


def resolve_column(
    columns: List[str],
    explicit_col: Optional[str],
    exact_candidates: List[str],
    keyword_patterns: Optional[List[str]] = None
) -> Optional[str]:
    """
    Robust column detection logic:
    1. Check explicit column preference if provided
    2. Check exact matches (case-insensitive & normalized)
    3. Check keyword substring matches
    """
    if not columns:
        return None

    norm_map = {_clean_key(c): c for c in columns}
    lower_map = {c.lower().strip(): c for c in columns}

    # 1. Explicit column lookup
    if explicit_col:
        if explicit_col in columns:
            return explicit_col
        exp_clean = _clean_key(explicit_col)
        if exp_clean in norm_map:
            return norm_map[exp_clean]
        if explicit_col.lower().strip() in lower_map:
            return lower_map[explicit_col.lower().strip()]

    # 2. Exact candidates matching
    for cand in exact_candidates:
        cand_clean = _clean_key(cand)
        if cand_clean in norm_map:
            return norm_map[cand_clean]
        if cand.lower().strip() in lower_map:
            return lower_map[cand.lower().strip()]

    # 3. Substring keyword heuristics
    if keyword_patterns:
        for col in columns:
            col_clean = _clean_key(col)
            for kw in keyword_patterns:
                kw_clean = _clean_key(kw)
                if kw_clean in col_clean:
                    # Avoid false positives like "order_count" or "customer_id" for revenue
                    if kw in ["revenue", "sales", "amount", "total"] and any(
                        skip in col_clean for skip in ["id", "count", "num", "tax", "discount"]
                    ) and "amount" not in col_clean and "total" not in col_clean:
                        continue
                    return col

    return None


def clean_numeric_series(series: pd.Series) -> pd.Series:
    """Cleans numeric series, stripping currency symbols, commas, and converting invalid to 0.0."""
    if series.empty:
        return series
    # If text/object, strip currency symbols and thousand commas
    if series.dtype == object or isinstance(series.iloc[0], str):
        cleaned = series.astype(str).str.replace(r"[$,€£¥₹\s]", "", regex=True)
        return pd.to_numeric(cleaned, errors="coerce").fillna(0.0)
    return pd.to_numeric(series, errors="coerce").fillna(0.0)


# ---------------- Core KPI Analytics Processor ---------------- #

def process_dataframe_kpis(
    df: pd.DataFrame,
    rev_col_pref: Optional[str] = None,
    reg_col_pref: Optional[str] = None,
    date_col_pref: Optional[str] = None,
    order_col_pref: Optional[str] = None
) -> Tuple[KPISummary, Dict[str, Optional[str]]]:
    """
    Computes business intelligence KPIs from a Pandas DataFrame with robust column detection
    and zero-division protections.
    """
    if df.empty:
        detected = {
            "revenue_column": None,
            "region_column": None,
            "date_column": None,
            "order_id_column": None
        }
        return KPISummary(
            total_revenue=0.0,
            average_order_value=0.0,
            total_orders=0,
            revenue_by_region=[],
            revenue_over_time=[],
            detected_columns=detected
        ), detected

    working_df = df.copy()

    # 1. Total Revenue Detection & Calculation
    clean_cols = {_clean_key(c): c for c in working_df.columns}
    qty_col = clean_cols.get("quantity") or clean_cols.get("qty") or clean_cols.get("units")
    price_col = (
        clean_cols.get("price")
        or clean_cols.get("unitprice")
        or clean_cols.get("rate")
        or clean_cols.get("unitcost")
    )

    rev_col = resolve_column(list(working_df.columns), rev_col_pref, REVENUE_EXACT_CANDIDATES, REVENUE_KEYWORD_PATTERNS)

    if not rev_col:
        # Check if synthesized revenue can be created from quantity * price
        if qty_col and price_col:
            q_num = clean_numeric_series(working_df[qty_col])
            p_num = clean_numeric_series(working_df[price_col])
            working_df["computed_revenue"] = q_num * p_num
            rev_col = "computed_revenue"
        elif price_col and not qty_col:
            rev_col = price_col
        else:
            # Fallback to first available numeric column (not id or date or zip)
            numeric_cols = [
                c for c in working_df.select_dtypes(include=[np.number]).columns
                if not any(skip in _clean_key(c) for skip in ["id", "zip", "year", "code"])
            ]
            if len(numeric_cols) > 0:
                rev_col = numeric_cols[0]
            else:
                # If no numeric column is found, attempt to clean first non-id column
                for col in working_df.columns:
                    col_clean = _clean_key(col)
                    if not any(skip in col_clean for skip in ["id", "date", "name", "email", "address"]):
                        converted = clean_numeric_series(working_df[col])
                        if converted.sum() > 0:
                            working_df[col] = converted
                            rev_col = col
                            break

    if rev_col and rev_col in working_df.columns:
        working_df[rev_col] = clean_numeric_series(working_df[rev_col])
        total_revenue = float(working_df[rev_col].sum())
    else:
        total_revenue = 0.0

    total_revenue_rounded = round(total_revenue, 2)

    # 2. Average Order Value (AOV) & Total Orders
    order_col = resolve_column(list(working_df.columns), order_col_pref, ORDER_ID_EXACT_CANDIDATES, ORDER_ID_KEYWORD_PATTERNS)
    if order_col and order_col in working_df.columns:
        valid_orders = working_df[order_col].dropna().astype(str).str.strip()
        valid_orders = valid_orders[~valid_orders.str.lower().isin(["", "nan", "none", "null"])]
        total_orders = int(valid_orders.nunique())
        if total_orders == 0:
            total_orders = len(working_df)
    else:
        total_orders = len(working_df)

    # Zero-division protection
    average_order_value = round(total_revenue / total_orders, 2) if total_orders > 0 else 0.0

    # 3. Revenue by Region
    reg_col = resolve_column(list(working_df.columns), reg_col_pref, REGION_EXACT_CANDIDATES, REGION_KEYWORD_PATTERNS)
    revenue_by_region: List[RegionRevenue] = []

    if reg_col and reg_col in working_df.columns and rev_col:
        working_df[reg_col] = working_df[reg_col].fillna("Unknown").astype(str).str.strip()
        working_df[reg_col] = working_df[reg_col].replace(["", "nan", "NaN", "None", "null", "NULL"], "Unknown")

        region_agg = working_df.groupby(reg_col).agg(
            revenue=(rev_col, "sum"),
            order_count=(order_col if order_col else rev_col, "nunique" if order_col else "count")
        ).reset_index()

        region_agg = region_agg.sort_values(by="revenue", ascending=False)
        for _, row in region_agg.iterrows():
            r_rev = round(float(row["revenue"]), 2)
            pct = round((r_rev / total_revenue) * 100, 2) if total_revenue > 0 else 0.0
            revenue_by_region.append(RegionRevenue(
                region=str(row[reg_col]),
                revenue=r_rev,
                percentage=pct,
                order_count=int(row["order_count"])
            ))
    else:
        revenue_by_region.append(RegionRevenue(
            region="All Regions",
            revenue=total_revenue_rounded,
            percentage=100.0,
            order_count=total_orders
        ))

    # 4. Revenue over Time
    date_col = resolve_column(list(working_df.columns), date_col_pref, DATE_EXACT_CANDIDATES, DATE_KEYWORD_PATTERNS)
    revenue_over_time: List[TimeSeriesRevenue] = []

    if date_col and date_col in working_df.columns and rev_col:
        working_df["_parsed_dt"] = pd.to_datetime(working_df[date_col], errors="coerce", format="mixed")
        valid_dates = working_df.dropna(subset=["_parsed_dt"]).copy()

        if not valid_dates.empty:
            valid_dates = valid_dates.sort_values(by="_parsed_dt")
            valid_dates["_date_str"] = valid_dates["_parsed_dt"].dt.strftime("%Y-%m-%d")

            time_agg = valid_dates.groupby("_date_str").agg(
                revenue=(rev_col, "sum"),
                order_count=(order_col if order_col else rev_col, "nunique" if order_col else "count")
            ).reset_index()

            for _, row in time_agg.iterrows():
                revenue_over_time.append(TimeSeriesRevenue(
                    date=str(row["_date_str"]),
                    revenue=round(float(row["revenue"]), 2),
                    order_count=int(row["order_count"])
                ))

    if not revenue_over_time:
        revenue_over_time.append(TimeSeriesRevenue(
            date="Total",
            revenue=total_revenue_rounded,
            order_count=total_orders
        ))

    detected_cols = {
        "revenue_column": rev_col,
        "region_column": reg_col,
        "date_column": date_col,
        "order_id_column": order_col
    }

    summary = KPISummary(
        total_revenue=total_revenue_rounded,
        average_order_value=average_order_value,
        total_orders=total_orders,
        revenue_by_region=revenue_by_region,
        revenue_over_time=revenue_over_time,
        detected_columns=detected_cols
    )

    return summary, detected_cols


def _persist_metrics_if_requested(
    dataset_id: Optional[int],
    total_revenue: float,
    average_order_value: float,
    db: Session
) -> None:
    """Helper to persist computed metric into SQLite database if dataset_id exists."""
    if dataset_id is not None:
        try:
            metric_entry = Metric(
                dataset_id=dataset_id,
                total_revenue=total_revenue,
                average_order_value=average_order_value
            )
            db.add(metric_entry)
            db.commit()
            db.refresh(metric_entry)
        except Exception:
            db.rollback()


def resolve_target_dataframe(dataset_id: Optional[int] = None) -> Optional[pd.DataFrame]:
    """Helper to safely fetch dataset without ambiguous truth value error in Pandas."""
    if dataset_id is not None:
        target_df = get_active_dataset(dataset_id=dataset_id)
        if target_df is not None:
            return target_df
    return get_active_dataset()


# ---------------- Router Endpoints ---------------- #

@router.get(
    "",
    response_model=KPISummary,
    status_code=status.HTTP_200_OK,
    summary="Get Overview KPIs from active session or database dataset",
    description="Calculates core KPIs (Total Revenue, AOV, Regional Breakdown, Time-Series) from the active session dataset or dataset_id."
)
@router.get(
    "/",
    response_model=KPISummary,
    status_code=status.HTTP_200_OK,
    include_in_schema=False
)
def get_overview_kpis(
    dataset_id: Optional[int] = Query(None, description="Optional ID of saved dataset"),
    revenue_column: Optional[str] = Query(None, description="Optional override for revenue column"),
    region_column: Optional[str] = Query(None, description="Optional override for region column"),
    date_column: Optional[str] = Query(None, description="Optional override for date column"),
    order_id_column: Optional[str] = Query(None, description="Optional override for order ID column"),
    db: Session = Depends(get_db)
):
    df = resolve_target_dataframe(dataset_id=dataset_id)

    if df is None or df.empty:
        # Check if database has record
        if dataset_id is not None:
            dataset_rec = db.query(Dataset).filter(Dataset.id == dataset_id).first()
            if not dataset_rec:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Dataset with ID {dataset_id} not found."
                )

        # Return empty KPI summary
        return KPISummary(
            total_revenue=0.0,
            average_order_value=0.0,
            total_orders=0,
            revenue_by_region=[],
            revenue_over_time=[],
            detected_columns=None
        )

    summary, _ = process_dataframe_kpis(
        df=df,
        rev_col_pref=revenue_column,
        reg_col_pref=region_column,
        date_col_pref=date_column,
        order_col_pref=order_id_column
    )

    _persist_metrics_if_requested(
        dataset_id=dataset_id,
        total_revenue=summary.total_revenue,
        average_order_value=summary.average_order_value,
        db=db
    )

    return summary


@router.post(
    "",
    response_model=KPISummary,
    status_code=status.HTTP_200_OK,
    summary="Compute Overview KPIs from dataset records payload",
    description="Processes uploaded JSON records or OverviewKPIRequest to return Total Revenue, AOV, and chart breakdowns."
)
@router.post(
    "/",
    response_model=KPISummary,
    status_code=status.HTTP_200_OK,
    include_in_schema=False
)
@router.post(
    "/kpis",
    response_model=KPISummary,
    status_code=status.HTTP_200_OK,
    summary="Legacy /kpis endpoint for frontend backward compatibility",
    description="Processes dataset records payload and returns calculated business intelligence KPIs."
)
def compute_kpis(
    payload: Union[OverviewKPIRequest, List[Dict[str, Any]]] = Body(
        ...,
        description="Dataset payload as an OverviewKPIRequest object or list of records"
    ),
    db: Session = Depends(get_db)
):
    if isinstance(payload, list):
        records = payload
        rev_col_pref = None
        reg_col_pref = None
        date_col_pref = None
        order_col_pref = None
        dataset_id = None
    else:
        records = payload.data
        rev_col_pref = payload.revenue_column
        reg_col_pref = payload.region_column
        date_col_pref = payload.date_column
        order_col_pref = payload.order_id_column
        dataset_id = payload.dataset_id

    if not records:
        return KPISummary(
            total_revenue=0.0,
            average_order_value=0.0,
            total_orders=0,
            revenue_by_region=[],
            revenue_over_time=[],
            detected_columns=None
        )

    df = pd.DataFrame(records)

    # Store in session store for subsequent GET requests
    set_active_dataset(df, dataset_id=dataset_id)

    summary, _ = process_dataframe_kpis(
        df=df,
        rev_col_pref=rev_col_pref,
        reg_col_pref=reg_col_pref,
        date_col_pref=date_col_pref,
        order_col_pref=order_col_pref
    )

    _persist_metrics_if_requested(
        dataset_id=dataset_id,
        total_revenue=summary.total_revenue,
        average_order_value=summary.average_order_value,
        db=db
    )

    return summary


@router.post(
    "/upload",
    response_model=KPISummary,
    status_code=status.HTTP_200_OK,
    summary="Upload CSV/Excel file directly to compute Overview KPIs",
    description="Parses an uploaded CSV or Excel file, sets it as active session dataset, and computes overview KPIs."
)
async def upload_and_compute_overview(
    file: UploadFile = File(..., description="CSV or Excel file to process"),
    revenue_column: Optional[str] = Query(None, description="Optional override for revenue column"),
    region_column: Optional[str] = Query(None, description="Optional override for region column"),
    date_column: Optional[str] = Query(None, description="Optional override for date column"),
    order_id_column: Optional[str] = Query(None, description="Optional override for order ID column"),
    db: Session = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid filename."
        )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    try:
        df = parse_file_to_dataframe(file_bytes=file_bytes, filename=file.filename)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse uploaded file: {str(exc)}"
        )

    # Store in active session
    set_active_dataset(df)

    summary, _ = process_dataframe_kpis(
        df=df,
        rev_col_pref=revenue_column,
        reg_col_pref=region_column,
        date_col_pref=date_column,
        order_col_pref=order_id_column
    )

    return summary


# ---------------- Supporting Metric Routes ---------------- #

@router.get(
    "/total-revenue",
    response_model=TotalRevenueResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Total Revenue metric calculation from active session"
)
def get_total_revenue(
    dataset_id: Optional[int] = Query(None),
    revenue_column: Optional[str] = Query(None)
):
    df = resolve_target_dataframe(dataset_id=dataset_id)
    if df is None or df.empty:
        return TotalRevenueResponse(total_revenue=0.0, revenue_column_used=None)

    summary, detected = process_dataframe_kpis(df=df, rev_col_pref=revenue_column)
    return TotalRevenueResponse(
        total_revenue=summary.total_revenue,
        revenue_column_used=detected.get("revenue_column")
    )


@router.post(
    "/total-revenue",
    response_model=TotalRevenueResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate Total Revenue metric from dataset payload"
)
def post_total_revenue(
    payload: Union[OverviewKPIRequest, List[Dict[str, Any]]] = Body(...),
    revenue_column: Optional[str] = Query(None)
):
    records = payload if isinstance(payload, list) else payload.data
    df = pd.DataFrame(records)
    rev_col = revenue_column or (payload.revenue_column if isinstance(payload, OverviewKPIRequest) else None)

    if df.empty:
        return TotalRevenueResponse(total_revenue=0.0, revenue_column_used=None)

    summary, detected = process_dataframe_kpis(df=df, rev_col_pref=rev_col)
    return TotalRevenueResponse(
        total_revenue=summary.total_revenue,
        revenue_column_used=detected.get("revenue_column")
    )


@router.get(
    "/aov",
    response_model=AOVResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Average Order Value (AOV) metric calculation from active session"
)
def get_average_order_value(
    dataset_id: Optional[int] = Query(None),
    revenue_column: Optional[str] = Query(None),
    order_id_column: Optional[str] = Query(None)
):
    df = resolve_target_dataframe(dataset_id=dataset_id)
    if df is None or df.empty:
        return AOVResponse(average_order_value=0.0, total_revenue=0.0, total_orders=0)

    summary, detected = process_dataframe_kpis(df=df, rev_col_pref=revenue_column, order_col_pref=order_id_column)
    return AOVResponse(
        average_order_value=summary.average_order_value,
        total_revenue=summary.total_revenue,
        total_orders=summary.total_orders,
        order_id_column_used=detected.get("order_id_column")
    )


@router.post(
    "/aov",
    response_model=AOVResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate Average Order Value (AOV) metric from dataset payload"
)
def post_average_order_value(
    payload: Union[OverviewKPIRequest, List[Dict[str, Any]]] = Body(...),
    revenue_column: Optional[str] = Query(None),
    order_id_column: Optional[str] = Query(None)
):
    records = payload if isinstance(payload, list) else payload.data
    df = pd.DataFrame(records)
    rev_col = revenue_column or (payload.revenue_column if isinstance(payload, OverviewKPIRequest) else None)
    ord_col = order_id_column or (payload.order_id_column if isinstance(payload, OverviewKPIRequest) else None)

    if df.empty:
        return AOVResponse(average_order_value=0.0, total_revenue=0.0, total_orders=0)

    summary, detected = process_dataframe_kpis(df=df, rev_col_pref=rev_col, order_col_pref=ord_col)
    return AOVResponse(
        average_order_value=summary.average_order_value,
        total_revenue=summary.total_revenue,
        total_orders=summary.total_orders,
        order_id_column_used=detected.get("order_id_column")
    )


@router.get(
    "/revenue-over-time",
    response_model=RevenueOverTimeResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Revenue over Time series aggregation from active session"
)
def get_revenue_over_time(
    dataset_id: Optional[int] = Query(None),
    revenue_column: Optional[str] = Query(None),
    date_column: Optional[str] = Query(None)
):
    df = resolve_target_dataframe(dataset_id=dataset_id)
    if df is None or df.empty:
        return RevenueOverTimeResponse(total_revenue=0.0, date_column_used=None, revenue_over_time=[])

    summary, detected = process_dataframe_kpis(df=df, rev_col_pref=revenue_column, date_col_pref=date_column)
    return RevenueOverTimeResponse(
        total_revenue=summary.total_revenue,
        date_column_used=detected.get("date_column"),
        revenue_over_time=summary.revenue_over_time
    )


@router.post(
    "/revenue-over-time",
    response_model=RevenueOverTimeResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate Revenue over Time series aggregation from payload"
)
def post_revenue_over_time(
    payload: Union[OverviewKPIRequest, List[Dict[str, Any]]] = Body(...),
    revenue_column: Optional[str] = Query(None),
    date_column: Optional[str] = Query(None)
):
    records = payload if isinstance(payload, list) else payload.data
    df = pd.DataFrame(records)
    rev_col = revenue_column or (payload.revenue_column if isinstance(payload, OverviewKPIRequest) else None)
    dt_col = date_column or (payload.date_column if isinstance(payload, OverviewKPIRequest) else None)

    if df.empty:
        return RevenueOverTimeResponse(total_revenue=0.0, date_column_used=None, revenue_over_time=[])

    summary, detected = process_dataframe_kpis(df=df, rev_col_pref=rev_col, date_col_pref=dt_col)
    return RevenueOverTimeResponse(
        total_revenue=summary.total_revenue,
        date_column_used=detected.get("date_column"),
        revenue_over_time=summary.revenue_over_time
    )


@router.get(
    "/revenue-by-region",
    response_model=RevenueByRegionResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Revenue by Region categorical aggregation from active session"
)
def get_revenue_by_region(
    dataset_id: Optional[int] = Query(None),
    revenue_column: Optional[str] = Query(None),
    region_column: Optional[str] = Query(None)
):
    df = resolve_target_dataframe(dataset_id=dataset_id)
    if df is None or df.empty:
        return RevenueByRegionResponse(total_revenue=0.0, region_column_used=None, revenue_by_region=[])

    summary, detected = process_dataframe_kpis(df=df, rev_col_pref=revenue_column, reg_col_pref=region_column)
    return RevenueByRegionResponse(
        total_revenue=summary.total_revenue,
        region_column_used=detected.get("region_column"),
        revenue_by_region=summary.revenue_by_region
    )


@router.post(
    "/revenue-by-region",
    response_model=RevenueByRegionResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate Revenue by Region categorical aggregation from payload"
)
def post_revenue_by_region(
    payload: Union[OverviewKPIRequest, List[Dict[str, Any]]] = Body(...),
    revenue_column: Optional[str] = Query(None),
    region_column: Optional[str] = Query(None)
):
    records = payload if isinstance(payload, list) else payload.data
    df = pd.DataFrame(records)
    rev_col = revenue_column or (payload.revenue_column if isinstance(payload, OverviewKPIRequest) else None)
    reg_col = region_column or (payload.region_column if isinstance(payload, OverviewKPIRequest) else None)

    if df.empty:
        return RevenueByRegionResponse(total_revenue=0.0, region_column_used=None, revenue_by_region=[])

    summary, detected = process_dataframe_kpis(df=df, rev_col_pref=rev_col, reg_col_pref=reg_col)
    return RevenueByRegionResponse(
        total_revenue=summary.total_revenue,
        region_column_used=detected.get("region_column"),
        revenue_by_region=summary.revenue_by_region
    )


# ---------------- Session Management Endpoints ---------------- #

@router.get(
    "/session",
    response_model=SessionStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current active session dataset information"
)
def get_session_status():
    info = get_session_info()
    return SessionStatusResponse(**info)


@router.delete(
    "/session",
    status_code=status.HTTP_200_OK,
    summary="Clear active session dataset"
)
def clear_session(dataset_id: Optional[int] = Query(None)):
    clear_active_dataset(dataset_id=dataset_id)
    return {"message": "Active session dataset cleared successfully."}
