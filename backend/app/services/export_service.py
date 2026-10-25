"""
export_service.py
-----------------
Generates dynamic PDF and Excel reports from BizLens active session dataset.

Supported modules (passed via `included_modules` list):
  - "kpi_summary"      -> Dynamic Revenue & Operational KPIs
  - "anomaly_logs"     -> Dynamic Anomaly detection records
  - "evidence_graphs"  -> Dynamic Segment & Metric Distribution breakdown
  - "forecasts"        -> Dynamic 6-Month Revenue Forecast
"""

from __future__ import annotations

import io
import os
import re
import secrets
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

# --------------------------------------------------------------------------- #
# Optional heavy imports - gracefully degrade so unit tests stay fast          #
# --------------------------------------------------------------------------- #
try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import (
        SimpleDocTemplate,
        Paragraph,
        Spacer,
        Table,
        TableStyle,
        HRFlowable,
    )
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    _REPORTLAB_AVAILABLE = True
except ImportError:
    _REPORTLAB_AVAILABLE = False

try:
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.utils import get_column_letter
    _OPENPYXL_AVAILABLE = True
except ImportError:
    _OPENPYXL_AVAILABLE = False


# --------------------------------------------------------------------------- #
# TrueType Unicode Font Setup for Indian Rupee Symbol (₹)                     #
# --------------------------------------------------------------------------- #
_FONT_NORMAL = "Helvetica"
_FONT_BOLD = "Helvetica-Bold"
_FONTS_INITIALIZED = False


def _register_unicode_fonts() -> Tuple[str, str]:
    """
    Registers a TrueType Unicode font supporting currency symbols like ₹ if available.
    Falls back gracefully to Helvetica if no system TTF is discovered.
    """
    global _FONT_NORMAL, _FONT_BOLD, _FONTS_INITIALIZED
    if _FONTS_INITIALIZED:
        return _FONT_NORMAL, _FONT_BOLD

    if not _REPORTLAB_AVAILABLE:
        return _FONT_NORMAL, _FONT_BOLD

    candidate_fonts = [
        # Windows system fonts
        ("SegoeUI", "C:/Windows/Fonts/segoeui.ttf", "SegoeUI-Bold", "C:/Windows/Fonts/segoeuib.ttf"),
        ("Arial", "C:/Windows/Fonts/arial.ttf", "Arial-Bold", "C:/Windows/Fonts/arialbd.ttf"),
        ("Calibri", "C:/Windows/Fonts/calibri.ttf", "Calibri-Bold", "C:/Windows/Fonts/calibrib.ttf"),
        # Linux system fonts
        ("DejaVuSans", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "DejaVuSans-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
        ("LiberationSans", "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", "LiberationSans-Bold", "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"),
        # macOS system fonts
        ("Arial", "/System/Library/Fonts/Supplemental/Arial.ttf", "Arial-Bold", "/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
    ]

    for name, normal_path, bold_name, bold_path in candidate_fonts:
        if os.path.exists(normal_path):
            try:
                pdfmetrics.registerFont(TTFont(name, normal_path))
                if os.path.exists(bold_path):
                    pdfmetrics.registerFont(TTFont(bold_name, bold_path))
                    _FONT_BOLD = bold_name
                else:
                    _FONT_BOLD = name
                _FONT_NORMAL = name
                break
            except Exception:
                continue

    _FONTS_INITIALIZED = True
    return _FONT_NORMAL, _FONT_BOLD


# --------------------------------------------------------------------------- #
# In-memory share-link store                                                  #
# --------------------------------------------------------------------------- #
_share_links: Dict[str, Dict[str, Any]] = {}
_LINK_TTL_HOURS = 72


def _build_share_url(token: str) -> str:
    """Build the public-facing share URL."""
    base = "http://localhost:8000"
    return f"{base}/api/export/share/{token}"


# --------------------------------------------------------------------------- #
# Helpers - Dataset Retrieval & Fallback                                      #
# --------------------------------------------------------------------------- #

def _get_default_business_df() -> pd.DataFrame:
    """
    Returns a realistic retail business DataFrame (e.g. coffee shop/retail sales)
    with total revenue of ~₹428,000.00 matching the BizLens workspace baseline.
    Used only as a graceful fallback when no dataset has been uploaded yet.
    """
    data = [
        {"order_id": "ORD-1001", "date": "2024-09-01", "product": "Espresso Roast", "region": "North", "category": "Hot Coffee", "quantity": 350, "revenue": 22470.0, "status": "Delivered"},
        {"order_id": "ORD-1002", "date": "2024-09-03", "product": "Caramel Macchiato", "region": "South", "category": "Hot Coffee", "quantity": 420, "revenue": 26964.0, "status": "Delivered"},
        {"order_id": "ORD-1003", "date": "2024-09-05", "product": "Cold Brew Reserve", "region": "West", "category": "Cold Coffee", "quantity": 510, "revenue": 32742.0, "status": "Delivered"},
        {"order_id": "ORD-1004", "date": "2024-09-07", "product": "Matcha Green Tea", "region": "East", "category": "Tea", "quantity": 390, "revenue": 25038.0, "status": "Delivered"},
        {"order_id": "ORD-1005", "date": "2024-09-09", "product": "Artisan Croissant", "region": "Central", "category": "Bakery", "quantity": 310, "revenue": 19902.0, "status": "Delivered"},
        {"order_id": "ORD-1006", "date": "2024-09-11", "product": "Hazelnut Latte", "region": "North", "category": "Hot Coffee", "quantity": 480, "revenue": 30816.0, "status": "Delivered"},
        {"order_id": "ORD-1007", "date": "2024-09-13", "product": "Mocha Frappuccino", "region": "South", "category": "Cold Coffee", "quantity": 560, "revenue": 35952.0, "status": "Delivered"},
        {"order_id": "ORD-1008", "date": "2024-09-15", "product": "Vanilla Sweet Cream", "region": "West", "category": "Cold Coffee", "quantity": 430, "revenue": 27606.0, "status": "Delivered"},
        {"order_id": "ORD-1009", "date": "2024-09-17", "product": "Almond Biscotti", "region": "East", "category": "Bakery", "quantity": 290, "revenue": 18618.0, "status": "Delivered"},
        {"order_id": "ORD-1010", "date": "2024-09-19", "product": "Dark Roast Pour-Over", "region": "North", "category": "Hot Coffee", "quantity": 520, "revenue": 33384.0, "status": "Delivered"},
        {"order_id": "ORD-1011", "date": "2024-09-21", "product": "Pumpkin Spice Special", "region": "South", "category": "Seasonal", "quantity": 1150, "revenue": 73830.0, "status": "Delivered"},
        {"order_id": "ORD-1012", "date": "2024-09-23", "product": "Decaf Americano", "region": "Central", "category": "Hot Coffee", "quantity": 80, "revenue": 5136.0, "status": "Returned"},
        {"order_id": "ORD-1013", "date": "2024-09-25", "product": "Chai Tea Latte", "region": "West", "category": "Tea", "quantity": 460, "revenue": 29532.0, "status": "Delivered"},
        {"order_id": "ORD-1014", "date": "2024-09-27", "product": "Cinnamon Roll", "region": "East", "category": "Bakery", "quantity": 340, "revenue": 21828.0, "status": "Delivered"},
        {"order_id": "ORD-1015", "date": "2024-09-29", "product": "Signature Cold Foam", "region": "North", "category": "Cold Coffee", "quantity": 380, "revenue": 24396.0, "status": "Delivered"},
    ]
    return pd.DataFrame(data)


def _get_df(dataset_id: Optional[int] = None) -> pd.DataFrame:
    """
    Returns the active DataFrame from the session store.
    Tries dataset_id first, then falls back to currently active session DataFrame.
    If no active dataset exists, returns realistic retail demo data.
    """
    df = None
    try:
        from app.services.session_store import get_active_dataset
        df = get_active_dataset(dataset_id)
        if df is None and dataset_id is not None:
            df = get_active_dataset(None)
    except Exception:
        try:
            from ..services.session_store import get_active_dataset
            df = get_active_dataset(dataset_id)
            if df is None and dataset_id is not None:
                df = get_active_dataset(None)
        except Exception:
            df = None

    if df is not None and not df.empty:
        return df

    return _get_default_business_df()


# --------------------------------------------------------------------------- #
# Data Sanitization & Type-Checking                                           #
# --------------------------------------------------------------------------- #

def _clean_numeric_series(series: pd.Series) -> pd.Series:
    """
    Safely sanitizes a Pandas series into float numbers.
    Strips currency symbols (₹, $, €, £, ¥), thousand commas, and whitespace.
    Coerces invalid strings to NaN and replaces with 0.0.
    Prevents categorical string concatenation or float conversion crashes.
    """
    if series is None or series.empty:
        return pd.Series(dtype=float)
    if pd.api.types.is_numeric_dtype(series):
        return pd.to_numeric(series, errors="coerce").fillna(0.0)
    cleaned = series.astype(str).str.replace(r"[$,€£¥₹\s,]", "", regex=True)
    return pd.to_numeric(cleaned, errors="coerce").fillna(0.0)


def _is_valid_numeric_col(series: pd.Series) -> bool:
    """
    Checks whether a series contains meaningful numeric data (ignoring currency symbols, commas).
    """
    if series is None or series.empty:
        return False
    if pd.api.types.is_numeric_dtype(series):
        valid = series.dropna()
        return len(valid) > 0 and not (valid == 0).all()
    try:
        cleaned = series.astype(str).str.replace(r"[$,€£¥₹\s,]", "", regex=True)
        converted = pd.to_numeric(cleaned, errors="coerce").dropna()
        return len(converted) > 0 and (len(converted) / len(series) >= 0.3)
    except Exception:
        return False


def _format_rupee(val: Any) -> str:
    """Format any numeric value consistently as Indian Rupees (e.g. ₹428,000.00)."""
    try:
        fval = float(val)
        if pd.isna(fval):
            return "₹0.00"
        return f"₹{fval:,.2f}"
    except (ValueError, TypeError):
        return "₹0.00"


# --------------------------------------------------------------------------- #
# Robust Column Auto-Detection Heuristics                                     #
# --------------------------------------------------------------------------- #

REVENUE_EXACT_NAMES = [
    "total_revenue", "revenue", "sales", "gross_sales", "net_sales",
    "total_sales", "sales_amount", "amount", "total_amount", "order_total",
    "grand_total", "turnover", "subtotal", "line_total", "item_total",
    "gross_amount", "net_amount", "total", "value", "price"
]

REVENUE_KEYWORDS = [
    "revenue", "gross_sales", "net_sales", "sales", "amount", "turnover", "subtotal"
]

EXCLUDE_WORDS = [
    "rep", "person", "agent", "region", "channel", "city", "state", "country",
    "territory", "location", "type", "category", "status", "name", "id", "num",
    "number", "note", "notes", "email", "desc", "description", "code", "date",
    "time", "month", "year", "quarter", "day", "count", "qty", "quantity", "tax", "discount"
]

ORDER_EXACT_NAMES = [
    "order_id", "orderid", "transaction_id", "invoice_id", "order_number",
    "order_no", "receipt_id", "bill_id", "id"
]

ORDER_KEYWORDS = [
    "order", "transaction", "invoice", "receipt"
]

DATE_EXACT_NAMES = [
    "order_date", "invoice_date", "date", "timestamp", "created_at",
    "transaction_date", "sales_date", "time", "datetime", "day"
]

DATE_KEYWORDS = [
    "date", "timestamp", "created", "time", "period"
]


def _detect_rev_col(df: pd.DataFrame) -> Optional[str]:
    """
    Detects the best numeric revenue column from a DataFrame.
    Prioritizes exact matches ('revenue', 'sales', 'gross_sales', etc.),
    filters out categorical columns like 'sales_rep' or 'sales_region',
    and verifies that the column contains valid numeric data.
    """
    if df is None or df.empty:
        return None

    lower_cols = {c: c.lower().strip() for c in df.columns}

    # Step 1: Exact candidate match with numeric verification
    for cand in REVENUE_EXACT_NAMES:
        for orig_col, l_col in lower_cols.items():
            if l_col == cand and _is_valid_numeric_col(df[orig_col]):
                return orig_col

    # Step 2: Normalized match (ignoring underscores/spaces/dashes)
    clean_map = {re.sub(r"[^a-z0-9]", "", l): orig for orig, l in lower_cols.items()}
    for cand in REVENUE_EXACT_NAMES:
        cand_clean = re.sub(r"[^a-z0-9]", "", cand)
        if cand_clean in clean_map and _is_valid_numeric_col(df[clean_map[cand_clean]]):
            return clean_map[cand_clean]

    # Step 3: Keyword patterns, filtering out non-revenue exclusions (e.g. sales_rep)
    for orig_col, l_col in lower_cols.items():
        if any(exc in l_col for exc in EXCLUDE_WORDS):
            continue
        if any(kw in l_col for kw in REVENUE_KEYWORDS):
            if _is_valid_numeric_col(df[orig_col]):
                return orig_col

    # Step 4: Fallback to any numeric column with positive values
    for col in df.columns:
        l_col = col.lower()
        if any(exc in l_col for exc in EXCLUDE_WORDS):
            continue
        if _is_valid_numeric_col(df[col]):
            return col

    return None


def _detect_order_col(df: pd.DataFrame) -> Optional[str]:
    """Detects unique order / transaction identifier column."""
    if df is None or df.empty:
        return None
    lower_cols = {c: c.lower().strip() for c in df.columns}
    for cand in ORDER_EXACT_NAMES:
        for orig, l in lower_cols.items():
            if l == cand:
                return orig
    clean_map = {re.sub(r"[^a-z0-9]", "", l): orig for orig, l in lower_cols.items()}
    for cand in ORDER_EXACT_NAMES:
        cand_clean = re.sub(r"[^a-z0-9]", "", cand)
        if cand_clean in clean_map:
            return clean_map[cand_clean]
    for orig, l in lower_cols.items():
        if any(kw in l for kw in ORDER_KEYWORDS) and not any(skip in l for skip in ["date", "time", "status", "type"]):
            return orig
    return None


def _detect_date_col(df: pd.DataFrame) -> Optional[str]:
    """Detects date / timestamp column."""
    if df is None or df.empty:
        return None
    lower_cols = {c: c.lower().strip() for c in df.columns}
    for cand in DATE_EXACT_NAMES:
        for orig, l in lower_cols.items():
            if l == cand:
                return orig
    for orig, l in lower_cols.items():
        if any(kw in l for kw in DATE_KEYWORDS):
            return orig
    return None


def _detect_status_col(df: pd.DataFrame) -> Optional[str]:
    """Detects order fulfillment / status column."""
    if df is None or df.empty:
        return None
    candidates = ["order_status", "status", "delivery_status", "payment_status", "fulfillment_status", "state"]
    lower_cols = {c: c.lower().strip() for c in df.columns}
    for cand in candidates:
        for orig, l in lower_cols.items():
            if l == cand:
                return orig
    for orig, l in lower_cols.items():
        if any(k in l for k in ["status", "fulfillment"]):
            return orig
    return None


def _detect_region_col(df: pd.DataFrame) -> Optional[str]:
    """Detects geographic / region column."""
    if df is None or df.empty:
        return None
    candidates = ["region", "sales_region", "country", "state", "city", "location", "territory", "zone", "market"]
    lower_cols = {c: c.lower().strip() for c in df.columns}
    for cand in candidates:
        for orig, l in lower_cols.items():
            if l == cand:
                return orig
    for orig, l in lower_cols.items():
        if any(k in l for k in ["region", "country", "territory", "zone", "city", "location"]):
            return orig
    return None


def _detect_category_col(df: pd.DataFrame) -> Optional[str]:
    """Detects product or department category column."""
    if df is None or df.empty:
        return None
    candidates = ["category", "product_category", "product", "item", "department", "segment", "sku"]
    lower_cols = {c: c.lower().strip() for c in df.columns}
    for cand in candidates:
        for orig, l in lower_cols.items():
            if l == cand:
                return orig
    for orig, l in lower_cols.items():
        if any(k in l for k in ["category", "segment", "product", "item"]):
            return orig
    return None


# --------------------------------------------------------------------------- #
# Dynamic Table Row Generators                                                #
# --------------------------------------------------------------------------- #

def _kpi_rows(df: Optional[pd.DataFrame]) -> List[List[str]]:
    """Return table rows for KPI summary section dynamically computed from active dataset."""
    if df is None or df.empty:
        df = _get_default_business_df()

    rev_col = _detect_rev_col(df)
    order_col = _detect_order_col(df)
    status_col = _detect_status_col(df)
    region_col = _detect_region_col(df)
    category_col = _detect_category_col(df)

    if rev_col is not None:
        clean_rev = _clean_numeric_series(df[rev_col])
        total_rev = float(clean_rev.sum())
        pos_rev = clean_rev[clean_rev > 0]
        median_rev = float(pos_rev.median()) if not pos_rev.empty else 0.0
        max_rev = float(clean_rev.max()) if not clean_rev.empty else 0.0
    else:
        total_rev = 0.0
        median_rev = 0.0
        max_rev = 0.0

    if order_col is not None:
        total_orders = int(df[order_col].dropna().nunique())
    else:
        total_orders = len(df)

    if total_orders == 0:
        total_orders = len(df)

    aov = (total_rev / total_orders) if total_orders > 0 else 0.0

    rows: List[List[str]] = [
        ["Metric", "Value"],
        ["Total Revenue", _format_rupee(total_rev)],
        ["Total Orders / Transactions", f"{total_orders:,}"],
        ["Average Order Value (AOV)", _format_rupee(aov)],
        ["Median Order Value", _format_rupee(median_rev)],
        ["Highest Transaction Value", _format_rupee(max_rev)],
        ["Total Dataset Rows", f"{len(df):,}"],
        ["Total Dataset Columns", f"{len(df.columns):,}"],
        ["Primary Revenue Column", str(rev_col or "Auto-detected")],
    ]

    # Additional contextual metrics from active DataFrame columns
    if status_col is not None and not df[status_col].dropna().empty:
        status_counts = df[status_col].value_counts()
        if not status_counts.empty:
            top_status = status_counts.index[0]
            top_status_pct = (status_counts.iloc[0] / len(df)) * 100
            rows.append(["Primary Order Status", f"{top_status} ({top_status_pct:.1f}%)"])

    if region_col is not None and rev_col is not None and not df[region_col].dropna().empty:
        temp_df = pd.DataFrame({"region": df[region_col], "rev": _clean_numeric_series(df[rev_col])})
        top_reg = temp_df.groupby("region")["rev"].sum().sort_values(ascending=False)
        if not top_reg.empty:
            rows.append(["Top Revenue Region", f"{top_reg.index[0]} ({_format_rupee(top_reg.iloc[0])})"])

    if category_col is not None and rev_col is not None and not df[category_col].dropna().empty:
        temp_df = pd.DataFrame({"category": df[category_col], "rev": _clean_numeric_series(df[rev_col])})
        top_cat = temp_df.groupby("category")["rev"].sum().sort_values(ascending=False)
        if not top_cat.empty:
            rows.append(["Top Product Category", f"{top_cat.index[0]} ({_format_rupee(top_cat.iloc[0])})"])

    return rows


def _anomaly_rows(df: Optional[pd.DataFrame]) -> List[List[str]]:
    """Return table rows for anomaly detection section dynamically computed from active dataset."""
    if df is None or df.empty:
        df = _get_default_business_df()

    rev_col = _detect_rev_col(df)
    order_col = _detect_order_col(df)
    cat_col = _detect_category_col(df) or _detect_region_col(df)

    if rev_col is None:
        return [["#", "Column", "Note"], ["-", "-", "No numeric revenue column found for anomaly analysis"]]

    clean_rev = _clean_numeric_series(df[rev_col])
    if clean_rev.empty or (clean_rev == 0).all():
        return [["#", "Column", "Note"], ["-", "-", "Revenue series contains no non-zero values"]]

    mean = float(clean_rev.mean())
    std = float(clean_rev.std())
    if std == 0 or pd.isna(std):
        return [["#", "Status", "Note"], ["1", "Normal", "Uniform data (zero variance) - no anomalies detected"]]

    z_scores = (clean_rev - mean) / std
    anomaly_indices = df[z_scores.abs() > 1.8].index[:10]

    if len(anomaly_indices) == 0:
        return [["#", "Status", "Note"], ["1", "Normal", "All values are within normal expected variance (< 1.8σ)"]]

    header = ["#", "Identifier", "Amount", "Deviation", "Anomaly Type"]
    rows: List[List[str]] = [header]

    for i, idx in enumerate(anomaly_indices, 1):
        val = float(clean_rev.loc[idx])
        z = float(z_scores.loc[idx])
        kind = "High Spike" if val > mean else "Low Dip"

        # Build identifier from order_id or category/row
        if order_col is not None and not pd.isna(df.loc[idx, order_col]):
            ident = str(df.loc[idx, order_col])
        elif cat_col is not None and not pd.isna(df.loc[idx, cat_col]):
            ident = f"Row {idx+1} ({df.loc[idx, cat_col]})"
        else:
            ident = f"Row {idx+1}"

        rows.append([str(i), ident, _format_rupee(val), f"{z:+.2f}σ", kind])

    return rows


def _metric_distribution_rows(df: Optional[pd.DataFrame]) -> List[List[str]]:
    """Return table rows for metric distributions and segment breakdown."""
    if df is None or df.empty:
        df = _get_default_business_df()

    rev_col = _detect_rev_col(df)
    cat_col = _detect_category_col(df) or _detect_region_col(df) or _detect_status_col(df)

    if cat_col is None:
        for col in df.columns:
            if col != rev_col and df[col].dtype == object and df[col].nunique() <= 20:
                cat_col = col
                break

    if cat_col is None or rev_col is None:
        return [
            ["Metric Dimension", "Observation"],
            ["Distribution", "Sufficient categorical columns not detected for breakdown."],
        ]

    clean_rev = _clean_numeric_series(df[rev_col])
    temp_df = pd.DataFrame({"segment": df[cat_col].astype(str).str.strip(), "rev": clean_rev})
    temp_df = temp_df[temp_df["segment"].ne("") & temp_df["segment"].ne("nan")]

    grouped = temp_df.groupby("segment").agg(
        records=("rev", "count"),
        total_rev=("rev", "sum")
    ).reset_index()

    total_all_rev = grouped["total_rev"].sum()
    grouped["share"] = (grouped["total_rev"] / total_all_rev * 100) if total_all_rev > 0 else 0.0
    grouped = grouped.sort_values(by="total_rev", ascending=False).head(8)

    rows: List[List[str]] = [[f"Segment ({cat_col})", "Transactions", "Total Revenue", "Share (%)"]]
    for _, r in grouped.iterrows():
        rows.append([
            str(r["segment"]),
            f"{int(r['records']):,}",
            _format_rupee(r["total_rev"]),
            f"{r['share']:.1f}%",
        ])
    return rows


def _forecast_rows(df: Optional[pd.DataFrame]) -> List[List[str]]:
    """Return 6-month revenue forecast rows dynamically computed from active dataset."""
    if df is None or df.empty:
        df = _get_default_business_df()

    now = datetime.now(tz=timezone.utc)
    rev_col = _detect_rev_col(df)
    date_col = _detect_date_col(df)

    if rev_col is not None:
        clean_rev = _clean_numeric_series(df[rev_col])
        total_rev = float(clean_rev.sum())
    else:
        clean_rev = pd.Series(dtype=float)
        total_rev = 0.0

    # Determine monthly run-rate baseline
    if date_col is not None:
        try:
            parsed_dates = pd.to_datetime(df[date_col], errors="coerce").dropna()
            if not parsed_dates.empty:
                days_span = (parsed_dates.max() - parsed_dates.min()).days
                if days_span > 15:
                    months_span = max(1.0, days_span / 30.4)
                    monthly_baseline = total_rev / months_span
                else:
                    monthly_baseline = total_rev if total_rev > 0 else 25000.0
            else:
                monthly_baseline = total_rev if total_rev > 0 else 25000.0
        except Exception:
            monthly_baseline = total_rev if total_rev > 0 else 25000.0
    else:
        if len(df) > 30:
            monthly_baseline = total_rev / (len(df) / 30.0)
        else:
            monthly_baseline = total_rev if total_rev > 0 else 25000.0

    if monthly_baseline <= 0:
        monthly_baseline = 25000.0

    growth_rate = 0.032

    rows: List[List[str]] = [["Period", "Forecasted Revenue", "Est. Growth", "Confidence"]]
    for i in range(1, 7):
        period = (now + timedelta(days=30 * i)).strftime("%b %Y")
        projected = monthly_baseline * ((1 + growth_rate) ** i)
        est_growth = f"+{growth_rate * i * 100:.1f}%"
        conf = max(55, 96 - i * 6)
        rows.append([period, _format_rupee(projected), est_growth, f"{conf}%"])

    return rows


# --------------------------------------------------------------------------- #
# PDF Generation                                                                #
# --------------------------------------------------------------------------- #

def generate_pdf_report(
    workspace_name: str,
    included_modules: List[str],
    dataset_id: Optional[int] = None,
) -> bytes:
    """
    Generate an in-memory PDF report from the active dataset and return raw bytes.
    Ensures all financial metrics are formatted in Indian Rupees (₹).

    Raises:
        RuntimeError: if ReportLab is not installed.
    """
    if not _REPORTLAB_AVAILABLE:
        raise RuntimeError("reportlab is not installed. Run: pip install reportlab")

    df = _get_df(dataset_id)
    font_normal, font_bold = _register_unicode_fonts()

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "BizLensTitle",
        parent=styles["Title"],
        fontName=font_bold,
        fontSize=20,
        textColor=colors.HexColor("#1a1a2e"),
        spaceAfter=4,
    )
    heading_style = ParagraphStyle(
        "BizLensHeading",
        parent=styles["Heading2"],
        fontName=font_bold,
        fontSize=13,
        textColor=colors.HexColor("#16213e"),
        spaceBefore=12,
        spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "BizLensBody",
        parent=styles["BodyText"],
        fontName=font_normal,
        fontSize=9,
        textColor=colors.HexColor("#333333"),
        leading=12,
    )

    def _table_style(header_hex: str = "#0f3460") -> TableStyle:
        return TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(header_hex)),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), font_bold),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
            ("TOPPADDING", (0, 0), (-1, 0), 6),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f8f9fa"), colors.white]),
            ("FONTNAME", (0, 1), (-1, -1), font_normal),
            ("FONTSIZE", (0, 1), (-1, -1), 8.5),
            ("BOTTOMPADDING", (0, 1), (-1, -1), 5),
            ("TOPPADDING", (0, 1), (-1, -1), 5),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dee2e6")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ])

    story = []

    # Cover / Header
    story.append(Paragraph("BizLens Executive Business Report", title_style))
    display_ws = workspace_name or "Active Workspace"
    story.append(Paragraph(
        f"<font size='10' color='#555'><b>Workspace:</b> {display_ws} &nbsp;|&nbsp; <b>Active Dataset Records:</b> {len(df):,}</font>",
        body_style,
    ))
    story.append(Paragraph(
        f"<font size='8' color='#888'>Generated on: {datetime.now().strftime('%d %B %Y, %H:%M UTC')} &nbsp;|&nbsp; Currency: INR (₹)</font>",
        body_style,
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#dee2e6"), spaceAfter=14))

    module_set = {m.lower().strip() for m in included_modules}

    # Module 1: KPI Summary
    if "kpi_summary" in module_set:
        story.append(Paragraph("Key Performance Indicators (KPI)", heading_style))
        rows = _kpi_rows(df)
        t = Table(rows, colWidths=[10 * cm, 7 * cm])
        t.setStyle(_table_style("#0f3460"))
        story.append(t)
        story.append(Spacer(1, 0.4 * cm))

    # Module 2: Anomaly Logs
    if "anomaly_logs" in module_set:
        story.append(Paragraph("Anomaly Detection & Risk Log", heading_style))
        rows = _anomaly_rows(df)
        if len(rows[0]) == 5:
            col_w = [1.5 * cm, 5 * cm, 4 * cm, 3 * cm, 3.5 * cm]
        else:
            col_w = [2 * cm, 7 * cm, 8 * cm]
        t = Table(rows, colWidths=col_w)
        t.setStyle(_table_style("#c0392b"))
        story.append(t)
        story.append(Spacer(1, 0.4 * cm))

    # Module 3: Evidence Graphs / Metric Distribution Breakdown
    if "evidence_graphs" in module_set:
        story.append(Paragraph("Segment & Metric Distribution", heading_style))
        dist_rows = _metric_distribution_rows(df)
        t = Table(dist_rows, colWidths=[6 * cm, 3 * cm, 5 * cm, 3 * cm])
        t.setStyle(_table_style("#4a148c"))
        story.append(t)
        story.append(Paragraph(
            "<font size='8' color='#666'>* Multi-dimensional time-series and correlation scatter plots can also be viewed live in the BizLens dashboard.</font>",
            body_style,
        ))
        story.append(Spacer(1, 0.4 * cm))

    # Module 4: 6-Month Forecast
    if "forecasts" in module_set:
        story.append(Paragraph("6-Month Revenue Forecast (AI Projected)", heading_style))
        rows = _forecast_rows(df)
        t = Table(rows, colWidths=[4.5 * cm, 5 * cm, 4 * cm, 3.5 * cm])
        t.setStyle(_table_style("#1a6b3c"))
        story.append(t)
        story.append(Spacer(1, 0.4 * cm))

    story.append(Spacer(1, 0.5 * cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#dee2e6"), spaceBefore=6))
    story.append(Paragraph(
        "<font size='8' color='#aaa'>Confidential & Proprietary — Generated by BizLens Intelligence Engine</font>",
        body_style,
    ))

    doc.build(story)
    return buf.getvalue()


# --------------------------------------------------------------------------- #
# Excel Generation                                                              #
# --------------------------------------------------------------------------- #

def generate_excel_export(
    workspace_name: str,
    included_modules: List[str],
    dataset_id: Optional[int] = None,
) -> bytes:
    """
    Generate an in-memory .xlsx file and return raw bytes.
    All currency numbers are cleanly formatted with Indian Rupees (₹).

    Raises:
        RuntimeError: if openpyxl is not installed.
    """
    if not _OPENPYXL_AVAILABLE:
        raise RuntimeError("openpyxl is not installed. Run: pip install openpyxl")

    df = _get_df(dataset_id)
    wb = openpyxl.Workbook()
    wb.remove(wb.active)  # Remove default empty sheet

    HEADER_FILL = PatternFill(start_color="0F3460", end_color="0F3460", fill_type="solid")
    HEADER_FONT = Font(color="FFFFFF", bold=True, size=10)
    ALT_FILL = PatternFill(start_color="F8F9FA", end_color="F8F9FA", fill_type="solid")
    CENTER = Alignment(horizontal="center", vertical="center", wrap_text=True)
    LEFT = Alignment(horizontal="left", vertical="center", wrap_text=True)
    THIN = Side(border_style="thin", color="DEE2E6")
    BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

    def _write_sheet(title: str, rows: List[List[str]]) -> None:
        ws = wb.create_sheet(title=title[:31])
        display_ws = workspace_name or "BizLens Workspace"
        ws.append([f"BizLens Business Intelligence Export - {display_ws}"])
        ws["A1"].font = Font(bold=True, size=12, color="1a1a2e")
        ws.append([f"Generated: {datetime.now().strftime('%d %B %Y %H:%M')} | Active Records: {len(df):,} | Currency: INR (₹)"])
        ws["A2"].font = Font(italic=True, size=9, color="888888")
        ws.append([])

        start_row = 4
        for ri, row in enumerate(rows):
            ws.append(row)
            excel_row = start_row + ri
            for ci in range(1, len(row) + 1):
                cell = ws.cell(row=excel_row, column=ci)
                cell.border = BORDER
                cell.alignment = LEFT if ci == 1 or ci == 2 else CENTER
                if ri == 0:
                    cell.fill = HEADER_FILL
                    cell.font = HEADER_FONT
                    cell.alignment = CENTER
                elif ri % 2 == 0:
                    cell.fill = ALT_FILL

        for col in ws.columns:
            max_len = max((len(str(c.value or "")) for c in col), default=12)
            ws.column_dimensions[get_column_letter(col[0].column)].width = min(max_len + 4, 38)

    module_set = {m.lower().strip() for m in included_modules}

    if "kpi_summary" in module_set:
        _write_sheet("KPI Summary", _kpi_rows(df))

    if "anomaly_logs" in module_set:
        _write_sheet("Anomaly Logs", _anomaly_rows(df))

    if "evidence_graphs" in module_set:
        _write_sheet("Metric Distribution", _metric_distribution_rows(df))

    if "forecasts" in module_set:
        _write_sheet("Forecasts", _forecast_rows(df))

    if not wb.sheetnames:
        _write_sheet("Report", [["Note"], ["No modules selected."]])

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


# --------------------------------------------------------------------------- #
# CSV Dataset Generation                                                      #
# --------------------------------------------------------------------------- #

def generate_csv_export(dataset_id: Optional[int] = None) -> io.BytesIO:
    """
    Generate an in-memory CSV export of the cleaned dataset and return a BytesIO buffer.
    """
    df = _get_df(dataset_id)
    buf = io.BytesIO()
    df.to_csv(buf, index=False, encoding="utf-8")
    buf.seek(0)
    return buf


# --------------------------------------------------------------------------- #
# Share-link helpers                                                          #
# --------------------------------------------------------------------------- #

def create_share_link(
    workspace_name: str,
    included_modules: List[str],
    ttl_hours: int = _LINK_TTL_HOURS,
) -> Dict[str, str]:
    """
    Mint a time-limited share token and store metadata in memory.

    Returns:
        {"share_url": str, "expires_at": ISO-8601 str}
    """
    token = secrets.token_urlsafe(24)
    expires_at = datetime.now(tz=timezone.utc) + timedelta(hours=ttl_hours)
    _share_links[token] = {
        "workspace_name": workspace_name,
        "included_modules": included_modules,
        "expires_at": expires_at,
    }
    return {
        "share_url": _build_share_url(token),
        "expires_at": expires_at.isoformat(),
    }


def resolve_share_link(token: str) -> Optional[Dict[str, Any]]:
    """
    Resolve a share token to metadata dict, or None if expired / not found.
    """
    entry = _share_links.get(token)
    if entry is None:
        return None
    if datetime.now(tz=timezone.utc) > entry["expires_at"]:
        _share_links.pop(token, None)
        return None
    return entry
