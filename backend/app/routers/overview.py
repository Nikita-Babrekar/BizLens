from typing import Any, Dict, List, Optional, Union
from fastapi import APIRouter, Body, Depends, HTTPException, status
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

try:
    from ..database import get_db
    from ..models import Metric
    from ..schemas import KPISummary, OverviewKPIRequest, RegionRevenue, TimeSeriesRevenue
except (ImportError, ValueError):
    from app.database import get_db
    from app.models import Metric
    from app.schemas import KPISummary, OverviewKPIRequest, RegionRevenue, TimeSeriesRevenue

router = APIRouter()

# Candidate column names for automatic resolution (lowercased)
REVENUE_CANDIDATES = [
    "total_revenue", "revenue", "sales", "total_sales",
    "amount", "total_amount", "order_total", "grand_total",
    "price", "total", "net_sales"
]

REGION_CANDIDATES = [
    "region", "country", "state", "territory",
    "location", "market", "area", "zone", "city", "geography"
]

DATE_CANDIDATES = [
    "order_date", "invoice_date", "date", "timestamp",
    "created_at", "transaction_date", "time", "period"
]

ORDER_ID_CANDIDATES = [
    "order_id", "orderid", "transaction_id", "invoice_id",
    "order_number", "id"
]


def resolve_column(columns: List[str], explicit_col: Optional[str], candidates: List[str]) -> Optional[str]:
    """Finds matching column name either explicitly or through candidate heuristics."""
    col_map = {c.lower().strip(): c for c in columns}
    if explicit_col and explicit_col in columns:
        return explicit_col
    if explicit_col and explicit_col.lower().strip() in col_map:
        return col_map[explicit_col.lower().strip()]
    for cand in candidates:
        if cand in col_map:
            return col_map[cand]
    return None


@router.post(
    "/kpis",
    response_model=KPISummary,
    status_code=status.HTTP_200_OK,
    summary="Calculate Core Business KPIs from dataset payload",
    description="Computes Total Revenue, Average Order Value (AOV), Revenue by Region, and Revenue over Time from dataset records."
)
def compute_kpis(
    payload: Union[OverviewKPIRequest, List[Dict[str, Any]]] = Body(
        ...,
        description="Dataset payload as an OverviewKPIRequest object or direct list of records"
    ),
    db: Session = Depends(get_db)
):
    # Normalize input payload
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
            revenue_over_time=[]
        )

    df = pd.DataFrame(records)

    # 1. Identify or calculate Revenue column
    rev_col = resolve_column(list(df.columns), rev_col_pref, REVENUE_CANDIDATES)

    if not rev_col:
        # Check if quantity & unit_price / price can form revenue
        cols_lower = {c.lower(): c for c in df.columns}
        qty_col = cols_lower.get("quantity") or cols_lower.get("qty")
        price_col = cols_lower.get("price") or cols_lower.get("unit_price")

        if qty_col and price_col:
            df["computed_revenue"] = pd.to_numeric(df[qty_col], errors="coerce").fillna(0) * \
                                     pd.to_numeric(df[price_col], errors="coerce").fillna(0)
            rev_col = "computed_revenue"
        else:
            # Check for any single numeric column as fallback
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) > 0:
                rev_col = numeric_cols[0]
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Could not detect a revenue or numeric sales column. Please specify 'revenue_column'."
                )

    # Ensure numeric values
    df[rev_col] = pd.to_numeric(df[rev_col], errors="coerce").fillna(0.0)

    # Calculate Total Revenue
    total_revenue = float(df[rev_col].sum())

    # 2. Identify Order identifier and calculate Average Order Value (AOV)
    order_col = resolve_column(list(df.columns), order_col_pref, ORDER_ID_CANDIDATES)
    if order_col:
        total_orders = int(df[order_col].nunique())
    else:
        total_orders = len(df)

    average_order_value = round(total_revenue / total_orders, 2) if total_orders > 0 else 0.0
    total_revenue_rounded = round(total_revenue, 2)

    # 3. Calculate Revenue by Region
    reg_col = resolve_column(list(df.columns), reg_col_pref, REGION_CANDIDATES)
    revenue_by_region: List[RegionRevenue] = []

    if reg_col:
        df[reg_col] = df[reg_col].fillna("Unknown").astype(str)
        region_grp = df.groupby(reg_col).agg(
            revenue=(rev_col, "sum"),
            order_count=(order_col if order_col else rev_col, "nunique" if order_col else "count")
        ).reset_index()

        region_grp = region_grp.sort_values(by="revenue", ascending=False)
        for _, row in region_grp.iterrows():
            reg_rev = round(float(row["revenue"]), 2)
            pct = round((reg_rev / total_revenue) * 100, 2) if total_revenue > 0 else 0.0
            revenue_by_region.append(RegionRevenue(
                region=str(row[reg_col]),
                revenue=reg_rev,
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

    # 4. Calculate Revenue over Time
    date_col = resolve_column(list(df.columns), date_col_pref, DATE_CANDIDATES)
    revenue_over_time: List[TimeSeriesRevenue] = []

    if date_col:
        df["_parsed_dt"] = pd.to_datetime(df[date_col], errors="coerce")
        valid_dates_df = df.dropna(subset=["_parsed_dt"]).copy()

        if not valid_dates_df.empty:
            # Sort chronologically
            valid_dates_df = valid_dates_df.sort_values(by="_parsed_dt")
            
            # Format by Date (YYYY-MM-DD)
            valid_dates_df["_date_str"] = valid_dates_df["_parsed_dt"].dt.strftime("%Y-%m-%d")

            time_grp = valid_dates_df.groupby("_date_str").agg(
                revenue=(rev_col, "sum"),
                order_count=(order_col if order_col else rev_col, "nunique" if order_col else "count")
            ).reset_index()

            for _, row in time_grp.iterrows():
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

    # If dataset_id was provided, persist computed KPI metric in database
    if dataset_id is not None:
        try:
            metric_entry = Metric(
                dataset_id=dataset_id,
                total_revenue=total_revenue_rounded,
                average_order_value=average_order_value
            )
            db.add(metric_entry)
            db.commit()
            db.refresh(metric_entry)
        except Exception:
            db.rollback()

    return KPISummary(
        total_revenue=total_revenue_rounded,
        average_order_value=average_order_value,
        total_orders=total_orders,
        revenue_by_region=revenue_by_region,
        revenue_over_time=revenue_over_time
    )
