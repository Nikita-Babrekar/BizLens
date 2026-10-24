"""
Anomaly Detection Router — /api/anomaly

Detects unusual spikes or severe dips in sales/revenue/inventory data using:
  - Isolation Forest (ML-based, model="isolation_forest")
  - IQR statistical rule  (model="iqr", default fallback when data < 10 rows)

Returns a JSON payload with:
  - anomaly_score  (0–100, higher = more anomalous overall dataset)
  - is_anomaly     (boolean)
  - anomalies      (list of detected anomalous data points with metadata)
"""

import re
from typing import Any, Dict, List, Literal, Optional, Union

import numpy as np
import pandas as pd
from fastapi import APIRouter, Body, File, HTTPException, Query, UploadFile, status
from pydantic import BaseModel, Field

try:
    from sklearn.ensemble import IsolationForest
    _SKLEARN_AVAILABLE = True
except ImportError:
    _SKLEARN_AVAILABLE = False

try:
    from ..services.session_store import get_active_dataset
    from ..services.cleaner import parse_file_to_dataframe
except (ImportError, ValueError):
    from app.services.session_store import get_active_dataset
    from app.services.cleaner import parse_file_to_dataframe


router = APIRouter()

# ──────────────────────────────────────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────────────────────────────────────

class AnomalyPoint(BaseModel):
    """A single anomalous data point with contextual metadata."""
    index: int = Field(..., description="Row index in the dataset (0-based)")
    value: float = Field(..., description="Numeric value of the anomalous point")
    z_score: Optional[float] = Field(None, description="Z-score of the value (standardised deviation)")
    direction: Literal["spike", "dip", "outlier"] = Field(
        ..., description="'spike' = unusually high, 'dip' = unusually low, 'outlier' = model-flagged"
    )
    label: Optional[str] = Field(None, description="Date / label for the data point if available")
    isolation_score: Optional[float] = Field(
        None, description="Raw Isolation Forest score (-1 anomaly, +1 normal)"
    )


class AnomalyRequest(BaseModel):
    """
    Flexible anomaly detection request.

    Supply either:
      - ``data``: a list of row dicts (same shape as OverviewKPIRequest)
      - Or omit ``data`` and rely on the active session dataset set via /api/ingest

    The ``value_column`` (and optionally ``date_column``) can be provided
    explicitly or will be auto-detected from common column name heuristics.
    """
    data: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="List of row-level records. If omitted, the active session dataset is used."
    )
    value_column: Optional[str] = Field(
        None,
        description="Column to analyse (revenue, sales, inventory…). Auto-detected if omitted."
    )
    date_column: Optional[str] = Field(
        None,
        description="Optional date/time column for labelling anomaly points."
    )
    model: Optional[Literal["isolation_forest", "iqr", "auto"]] = Field(
        "auto",
        description=(
            "'isolation_forest' — ML model (requires ≥10 rows). "
            "'iqr' — interquartile range statistical rule. "
            "'auto' — Isolation Forest when ≥10 rows, else IQR."
        )
    )
    contamination: Optional[float] = Field(
        0.1,
        ge=0.01,
        le=0.5,
        description="Expected proportion of anomalies (Isolation Forest only). Default 0.1 (10%)."
    )
    iqr_multiplier: Optional[float] = Field(
        1.5,
        ge=0.5,
        le=5.0,
        description="IQR fence multiplier. 1.5 = standard outliers, 3.0 = extreme outliers."
    )
    dataset_id: Optional[int] = Field(
        None,
        description="ID of a previously ingested dataset to analyse."
    )


class AnomalyResponse(BaseModel):
    """Anomaly detection result payload."""
    anomaly_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Overall anomaly severity score on a 0–100 scale (higher = more anomalous)."
    )
    is_anomaly: bool = Field(
        ...,
        description="True if the dataset contains at least one statistically significant anomaly."
    )
    anomalies: List[AnomalyPoint] = Field(
        ...,
        description="List of individual anomalous data points detected."
    )
    method_used: Literal["isolation_forest", "iqr"] = Field(
        ...,
        description="Detection algorithm that was applied."
    )
    value_column_used: Optional[str] = Field(
        None,
        description="Name of the numeric column that was analysed."
    )
    date_column_used: Optional[str] = Field(
        None,
        description="Name of the date column used for labelling (if any)."
    )
    total_points: int = Field(..., description="Total number of data points analysed.")
    anomaly_count: int = Field(..., description="Number of anomalous points detected.")
    stats: Dict[str, Any] = Field(
        ...,
        description="Descriptive statistics of the analysed series (mean, std, min, max, IQR fences)."
    )


# ──────────────────────────────────────────────────────────────────────────────
# Column auto-detection helpers (reuse heuristics consistent with overview.py)
# ──────────────────────────────────────────────────────────────────────────────

_VALUE_EXACT_CANDIDATES = [
    "revenue", "total_revenue", "sales", "total_sales", "sales_amount",
    "amount", "total_amount", "order_total", "grand_total", "net_sales",
    "turnover", "subtotal", "gross_sales", "value", "extended_price",
    "inventory", "stock", "quantity", "qty", "units_sold", "units",
    "profit", "margin", "cost",
]
_VALUE_KEYWORD_PATTERNS = ["revenue", "sales", "amount", "total", "inventory", "stock", "qty", "quantity"]

_DATE_EXACT_CANDIDATES = [
    "order_date", "invoice_date", "date", "timestamp", "created_at",
    "transaction_date", "time", "period", "sales_date", "purchase_date", "datetime", "day"
]
_DATE_KEYWORD_PATTERNS = ["date", "time", "timestamp", "created", "period"]


def _clean_key(name: str) -> str:
    return re.sub(r"[^a-zA-Z0-9]", "", str(name).lower())


def _resolve_column(
    columns: List[str],
    explicit: Optional[str],
    exact_candidates: List[str],
    keyword_patterns: Optional[List[str]] = None,
) -> Optional[str]:
    """Robust column detection: explicit → exact match → keyword heuristic."""
    if not columns:
        return None

    norm_map = {_clean_key(c): c for c in columns}
    lower_map = {c.lower().strip(): c for c in columns}

    if explicit:
        if explicit in columns:
            return explicit
        k = _clean_key(explicit)
        if k in norm_map:
            return norm_map[k]
        if explicit.lower().strip() in lower_map:
            return lower_map[explicit.lower().strip()]

    for cand in exact_candidates:
        k = _clean_key(cand)
        if k in norm_map:
            return norm_map[k]
        if cand.lower().strip() in lower_map:
            return lower_map[cand.lower().strip()]

    if keyword_patterns:
        for col in columns:
            col_clean = _clean_key(col)
            for kw in keyword_patterns:
                if _clean_key(kw) in col_clean:
                    return col
    return None


def _clean_numeric(series: pd.Series) -> pd.Series:
    """Strips currency symbols / commas; coerces to float."""
    if series.dtype == object or (not series.empty and isinstance(series.iloc[0], str)):
        cleaned = series.astype(str).str.replace(r"[$,€£¥₹\s]", "", regex=True)
        return pd.to_numeric(cleaned, errors="coerce")
    return pd.to_numeric(series, errors="coerce")


# ──────────────────────────────────────────────────────────────────────────────
# Detection engines
# ──────────────────────────────────────────────────────────────────────────────

def _compute_z_scores(values: np.ndarray) -> np.ndarray:
    """Returns z-scores; guards against zero std-dev."""
    std = values.std()
    if std == 0:
        return np.zeros_like(values, dtype=float)
    return (values - values.mean()) / std


def _direction(value: float, mean: float) -> Literal["spike", "dip", "outlier"]:
    """Classify anomaly direction relative to mean."""
    if value > mean:
        return "spike"
    if value < mean:
        return "dip"
    return "outlier"


def _detect_iqr(
    values: np.ndarray,
    labels: Optional[List[Any]],
    multiplier: float,
) -> List[AnomalyPoint]:
    """IQR fence method: flags points outside [Q1 - k·IQR, Q3 + k·IQR]."""
    q1, q3 = np.percentile(values, 25), np.percentile(values, 75)
    iqr = q3 - q1
    lower_fence = q1 - multiplier * iqr
    upper_fence = q3 + multiplier * iqr
    mean = float(values.mean())
    z_scores = _compute_z_scores(values)

    anomalies: List[AnomalyPoint] = []
    for i, v in enumerate(values):
        if v < lower_fence or v > upper_fence:
            anomalies.append(AnomalyPoint(
                index=int(i),
                value=float(v),
                z_score=round(float(z_scores[i]), 4),
                direction=_direction(float(v), mean),
                label=str(labels[i]) if labels is not None else None,
                isolation_score=None,
            ))
    return anomalies


def _detect_isolation_forest(
    values: np.ndarray,
    labels: Optional[List[Any]],
    contamination: float,
) -> List[AnomalyPoint]:
    """Isolation Forest: returns anomalies flagged as -1 by the model."""
    X = values.reshape(-1, 1)
    model = IsolationForest(
        contamination=contamination,
        random_state=42,
        n_estimators=100,
    )
    preds = model.fit_predict(X)           # -1 = anomaly, +1 = normal
    scores = model.decision_function(X)    # more negative → more anomalous

    mean = float(values.mean())
    z_scores = _compute_z_scores(values)

    anomalies: List[AnomalyPoint] = []
    for i, (pred, score) in enumerate(zip(preds, scores)):
        if pred == -1:
            anomalies.append(AnomalyPoint(
                index=int(i),
                value=float(values[i]),
                z_score=round(float(z_scores[i]), 4),
                direction=_direction(float(values[i]), mean),
                label=str(labels[i]) if labels is not None else None,
                isolation_score=round(float(score), 6),
            ))
    return anomalies


# ──────────────────────────────────────────────────────────────────────────────
# Core analysis function
# ──────────────────────────────────────────────────────────────────────────────

def run_anomaly_detection(
    df: pd.DataFrame,
    value_col_pref: Optional[str] = None,
    date_col_pref: Optional[str] = None,
    model: str = "auto",
    contamination: float = 0.1,
    iqr_multiplier: float = 1.5,
) -> AnomalyResponse:
    """
    Core anomaly detection logic. Accepts a DataFrame, resolves numeric and
    date columns, runs the selected algorithm and returns an AnomalyResponse.
    """
    if df.empty:
        return AnomalyResponse(
            anomaly_score=0.0,
            is_anomaly=False,
            anomalies=[],
            method_used="iqr",
            value_column_used=None,
            date_column_used=None,
            total_points=0,
            anomaly_count=0,
            stats={},
        )

    cols = list(df.columns)

    # ── Resolve numeric column ─────────────────────────────────────────────
    val_col = _resolve_column(cols, value_col_pref, _VALUE_EXACT_CANDIDATES, _VALUE_KEYWORD_PATTERNS)

    if val_col is None:
        # Fall back to the first numeric column that isn't an ID / date / zip
        skip_words = ["id", "zip", "code", "year", "month", "day"]
        numeric_cols = [
            c for c in df.select_dtypes(include=[np.number]).columns
            if not any(s in _clean_key(c) for s in skip_words)
        ]
        if numeric_cols:
            val_col = numeric_cols[0]

    if val_col is None or val_col not in df.columns:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "No numeric column found for anomaly detection. "
                "Please provide 'value_column' explicitly or include a revenue/sales/inventory column."
            ),
        )

    # Clean and drop NaN values
    series = _clean_numeric(df[val_col]).dropna()
    if len(series) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Column '{val_col}' has fewer than 2 valid numeric values — cannot detect anomalies.",
        )

    values = series.values.astype(float)
    valid_indices = series.index.tolist()

    # ── Resolve date / label column ────────────────────────────────────────
    date_col = _resolve_column(cols, date_col_pref, _DATE_EXACT_CANDIDATES, _DATE_KEYWORD_PATTERNS)
    labels: Optional[List[Any]] = None

    if date_col and date_col in df.columns:
        raw_labels = df.loc[valid_indices, date_col]
        parsed = pd.to_datetime(raw_labels, errors="coerce", format="mixed")
        # Use formatted date string where parseable, else raw string
        labels = [
            dt.strftime("%Y-%m-%d") if pd.notna(dt) else str(raw)
            for dt, raw in zip(parsed, raw_labels)
        ]
    else:
        date_col = None

    # ── Select algorithm ───────────────────────────────────────────────────
    use_if = (
        model == "isolation_forest"
        or (model == "auto" and len(values) >= 10 and _SKLEARN_AVAILABLE)
    )

    if use_if and not _SKLEARN_AVAILABLE:
        # Graceful degradation
        use_if = False

    if use_if:
        method_used: Literal["isolation_forest", "iqr"] = "isolation_forest"
        anomalies = _detect_isolation_forest(values, labels, contamination)
    else:
        method_used = "iqr"
        anomalies = _detect_iqr(values, labels, iqr_multiplier)

    # ── Compute overall anomaly_score (0–100) ──────────────────────────────
    #   Score = proportion of anomalous points × max(|z-score|) / expected_max_z
    #   Clamped to [0, 100].
    anomaly_count = len(anomalies)
    total_points = len(values)

    if anomaly_count == 0:
        anomaly_score = 0.0
    else:
        proportion = anomaly_count / total_points
        z_scores = np.abs(_compute_z_scores(values))
        anomaly_indices = [a.index for a in anomalies]
        # Use the z-scores of detected anomalous points
        anomalous_z = z_scores[[valid_indices.index(i) for i in anomaly_indices if i in valid_indices]]
        max_z = float(anomalous_z.max()) if len(anomalous_z) > 0 else 0.0
        # Normalise: z=3 maps to ~60, z=5 maps to ~100
        z_factor = min(max_z / 5.0, 1.0)
        raw_score = (0.5 * proportion + 0.5 * z_factor) * 100.0
        anomaly_score = round(min(raw_score, 100.0), 2)

    is_anomaly = anomaly_count > 0

    # ── Descriptive statistics ─────────────────────────────────────────────
    q1, q3 = float(np.percentile(values, 25)), float(np.percentile(values, 75))
    iqr_val = q3 - q1
    stats: Dict[str, Any] = {
        "mean": round(float(values.mean()), 4),
        "std": round(float(values.std()), 4),
        "min": round(float(values.min()), 4),
        "max": round(float(values.max()), 4),
        "median": round(float(np.median(values)), 4),
        "q1": round(q1, 4),
        "q3": round(q3, 4),
        "iqr": round(iqr_val, 4),
        "iqr_lower_fence": round(q1 - iqr_multiplier * iqr_val, 4),
        "iqr_upper_fence": round(q3 + iqr_multiplier * iqr_val, 4),
    }

    return AnomalyResponse(
        anomaly_score=anomaly_score,
        is_anomaly=is_anomaly,
        anomalies=anomalies,
        method_used=method_used,
        value_column_used=val_col,
        date_column_used=date_col,
        total_points=total_points,
        anomaly_count=anomaly_count,
        stats=stats,
    )


# ──────────────────────────────────────────────────────────────────────────────
# Router endpoints
# ──────────────────────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=AnomalyResponse,
    status_code=status.HTTP_200_OK,
    summary="Detect anomalies in active session dataset",
    description=(
        "Runs anomaly detection on the currently active session dataset "
        "(loaded via /api/ingest or /api/overview/upload). "
        "Analyses sales/revenue/inventory columns automatically."
    ),
)
@router.get("/", response_model=AnomalyResponse, status_code=status.HTTP_200_OK, include_in_schema=False)
def get_anomalies(
    dataset_id: Optional[int] = Query(None, description="Optional ID of a saved dataset"),
    value_column: Optional[str] = Query(None, description="Column to analyse (auto-detected if omitted)"),
    date_column: Optional[str] = Query(None, description="Date column for labelling anomaly points"),
    model: Literal["isolation_forest", "iqr", "auto"] = Query(
        "auto", description="Detection algorithm: 'isolation_forest', 'iqr', or 'auto'"
    ),
    contamination: float = Query(0.1, ge=0.01, le=0.5, description="Isolation Forest contamination rate"),
    iqr_multiplier: float = Query(1.5, ge=0.5, le=5.0, description="IQR fence multiplier"),
):
    if dataset_id is not None:
        df = get_active_dataset(dataset_id=dataset_id)
    else:
        df = get_active_dataset()

    if df is None or df.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "No active dataset found. "
                "Upload data first via POST /api/anomaly, "
                "or ingest a file via /api/ingest."
            ),
        )

    return run_anomaly_detection(
        df=df,
        value_col_pref=value_column,
        date_col_pref=date_column,
        model=model,
        contamination=contamination,
        iqr_multiplier=iqr_multiplier,
    )


@router.post(
    "",
    response_model=AnomalyResponse,
    status_code=status.HTTP_200_OK,
    summary="Detect anomalies in a submitted dataset payload",
    description=(
        "Accepts a JSON payload with records and runs anomaly detection on the "
        "specified (or auto-detected) numeric column using Isolation Forest or IQR."
    ),
)
@router.post("/", response_model=AnomalyResponse, status_code=status.HTTP_200_OK, include_in_schema=False)
def post_anomalies(
    payload: Union[AnomalyRequest, List[Dict[str, Any]]] = Body(
        ...,
        description="AnomalyRequest object or a raw list of row records",
        examples={
            "sales_data": {
                "summary": "Basic sales payload",
                "value": {
                    "data": [
                        {"date": "2024-01-01", "revenue": 5000},
                        {"date": "2024-01-02", "revenue": 4800},
                        {"date": "2024-01-03", "revenue": 50000},
                        {"date": "2024-01-04", "revenue": 4900},
                        {"date": "2024-01-05", "revenue": 100},
                    ],
                    "model": "auto",
                }
            }
        },
    ),
):
    if isinstance(payload, list):
        records = payload
        value_col_pref = None
        date_col_pref = None
        model_choice = "auto"
        contamination = 0.1
        iqr_multiplier = 1.5
        df = pd.DataFrame(records)
    else:
        records = payload.data or []
        value_col_pref = payload.value_column
        date_col_pref = payload.date_column
        model_choice = payload.model or "auto"
        contamination = payload.contamination if payload.contamination is not None else 0.1
        iqr_multiplier = payload.iqr_multiplier if payload.iqr_multiplier is not None else 1.5

        # If no inline data, fall back to session
        if not records:
            df = get_active_dataset(dataset_id=payload.dataset_id) if payload.dataset_id else get_active_dataset()
            if df is None or df.empty:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="No data provided and no active session dataset found.",
                )
        else:
            df = pd.DataFrame(records)

    if df.empty:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provided dataset is empty.",
        )

    return run_anomaly_detection(
        df=df,
        value_col_pref=value_col_pref,
        date_col_pref=date_col_pref,
        model=model_choice,
        contamination=contamination,
        iqr_multiplier=iqr_multiplier,
    )


@router.post(
    "/upload",
    response_model=AnomalyResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload CSV/Excel file and run anomaly detection",
    description="Parses an uploaded CSV or Excel file and performs anomaly detection on the numeric column.",
)
async def upload_and_detect_anomalies(
    file: UploadFile = File(..., description="CSV or Excel file"),
    value_column: Optional[str] = Query(None, description="Column to analyse (auto-detected if omitted)"),
    date_column: Optional[str] = Query(None, description="Date column for labelling anomaly points"),
    model: Literal["isolation_forest", "iqr", "auto"] = Query("auto", description="Detection algorithm"),
    contamination: float = Query(0.1, ge=0.01, le=0.5, description="Isolation Forest contamination rate"),
    iqr_multiplier: float = Query(1.5, ge=0.5, le=5.0, description="IQR fence multiplier"),
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid filename.",
        )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    try:
        df = parse_file_to_dataframe(file_bytes=file_bytes, filename=file.filename)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse uploaded file: {exc}",
        )

    return run_anomaly_detection(
        df=df,
        value_col_pref=value_column,
        date_col_pref=date_column,
        model=model,
        contamination=contamination,
        iqr_multiplier=iqr_multiplier,
    )
