"""
export_service.py
-----------------
Generates PDF and Excel reports from BizLens session data.

Supported modules (passed via `included_modules` list):
  - "kpi_summary"      -> Revenue KPIs table
  - "anomaly_logs"     -> Anomaly detection records
  - "evidence_graphs"  -> Placeholder section (charts require a running session)
  - "forecasts"        -> Forecast data table
"""

from __future__ import annotations

import io
import secrets
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

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
# In-memory share-link store  (replace with Redis / DB in production)          #
# --------------------------------------------------------------------------- #
_share_links: Dict[str, Dict[str, Any]] = {}
_LINK_TTL_HOURS = 72


def _build_share_url(token: str) -> str:
    """Build the public-facing share URL."""
    base = "http://localhost:8000"
    return f"{base}/api/export/share/{token}"


# --------------------------------------------------------------------------- #
# Helpers - extract data from session or fallback to demo data                 #
# --------------------------------------------------------------------------- #

def _get_df(dataset_id: Optional[int] = None) -> Optional[pd.DataFrame]:
    """Returns the active DataFrame from the session store (if available)."""
    try:
        from app.services.session_store import get_active_dataset
        return get_active_dataset(dataset_id)
    except Exception:
        try:
            from ..services.session_store import get_active_dataset
            return get_active_dataset(dataset_id)
        except Exception:
            return None


def _detect_rev_col(df: pd.DataFrame) -> Optional[str]:
    return next(
        (c for c in df.columns if any(k in c.lower() for k in ("revenue", "sales", "amount", "total"))),
        None,
    )


def _detect_order_col(df: pd.DataFrame) -> Optional[str]:
    return next(
        (c for c in df.columns if any(k in c.lower() for k in ("order_id", "order", "id", "transaction"))),
        None,
    )


def _kpi_rows(df: Optional[pd.DataFrame]) -> List[List[str]]:
    """Return table rows for KPI summary section."""
    if df is None or df.empty:
        return [
            ["Metric", "Value"],
            ["Total Revenue", "N/A (no active dataset)"],
            ["Total Orders", "N/A"],
            ["Average Order Value", "N/A"],
        ]
    rev_col = _detect_rev_col(df)
    order_col = _detect_order_col(df)
    total_rev = float(df[rev_col].sum()) if rev_col else 0.0
    total_orders = int(df[order_col].nunique()) if order_col else len(df)
    aov = (total_rev / total_orders) if total_orders else 0.0

    return [
        ["Metric", "Value"],
        ["Total Revenue", f"${total_rev:,.2f}"],
        ["Total Orders", f"{total_orders:,}"],
        ["Average Order Value", f"${aov:,.2f}"],
        ["Dataset Rows", f"{len(df):,}"],
        ["Dataset Columns", f"{len(df.columns):,}"],
    ]


def _anomaly_rows(df: Optional[pd.DataFrame]) -> List[List[str]]:
    """Return table rows for anomaly log section."""
    if df is None or df.empty:
        return [
            ["#", "Description", "Severity", "Detected At"],
            ["1", "No active dataset loaded", "-", "-"],
        ]
    rev_col = _detect_rev_col(df)
    if rev_col is None:
        return [["#", "Column", "Note"], ["-", "-", "No numeric revenue column found"]]

    series = df[rev_col].dropna()
    mean, std = series.mean(), series.std()
    if std == 0 or pd.isna(std):
        return [["#", "Note"], ["-", "No anomalies detected (zero variance)"]]

    anomalies = df[(df[rev_col] - mean).abs() > 2 * std][[rev_col]].head(10)
    rows: List[List[str]] = [["#", rev_col, "Z-Score", "Anomaly Type"]]
    for i, (_, row) in enumerate(anomalies.iterrows(), 1):
        val = float(row[rev_col])
        z = (val - mean) / std
        kind = "High Spike" if val > mean else "Low Dip"
        rows.append([str(i), f"{val:.2f}", f"{z:.2f}", kind])
    return rows if len(rows) > 1 else [["#", "Note"], ["-", "No anomalies detected"]]


def _forecast_rows(df: Optional[pd.DataFrame]) -> List[List[str]]:
    """Return simple forecast rows (replace with actual model output)."""
    now = datetime.now(tz=timezone.utc)
    rows: List[List[str]] = [["Period", "Forecasted Revenue", "Confidence"]]
    if df is not None and not df.empty:
        rev_col = _detect_rev_col(df)
        if rev_col:
            baseline = float(df[rev_col].mean())
            for i in range(1, 7):
                period = (now + timedelta(days=30 * i)).strftime("%b %Y")
                trend = baseline * (1 + 0.02 * i)
                conf = max(50, 95 - i * 5)
                rows.append([period, f"${trend:,.2f}", f"{conf}%"])
            return rows
    for i in range(1, 7):
        period = (now + timedelta(days=30 * i)).strftime("%b %Y")
        rows.append([period, "N/A (no dataset)", "-"])
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
    Generate an in-memory PDF report and return raw bytes.

    Raises:
        RuntimeError: if ReportLab is not installed.
    """
    if not _REPORTLAB_AVAILABLE:
        raise RuntimeError(
            "reportlab is not installed. Run: pip install reportlab"
        )

    df = _get_df(dataset_id)
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
        fontSize=22,
        textColor=colors.HexColor("#1a1a2e"),
        spaceAfter=6,
    )
    heading_style = ParagraphStyle(
        "BizLensHeading",
        parent=styles["Heading2"],
        fontSize=14,
        textColor=colors.HexColor("#16213e"),
        spaceBefore=14,
        spaceAfter=4,
    )
    body_style = styles["BodyText"]

    def _table_style(header_hex: str = "#0f3460") -> TableStyle:
        return TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(header_hex)),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 10),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
            ("TOPPADDING", (0, 0), (-1, 0), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f8f9fa"), colors.white]),
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 1), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
            ("TOPPADDING", (0, 1), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dee2e6")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ])

    story = []

    # Cover / Header
    story.append(Paragraph("BizLens Business Report", title_style))
    story.append(Paragraph(
        f"<font size='11' color='#555'>{workspace_name}</font>",
        body_style,
    ))
    story.append(Paragraph(
        f"<font size='9' color='#888'>Generated: {datetime.now().strftime('%d %B %Y, %H:%M UTC')}</font>",
        body_style,
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#dee2e6"), spaceAfter=16))

    module_set = {m.lower().strip() for m in included_modules}

    if "kpi_summary" in module_set:
        story.append(Paragraph("KPI Summary", heading_style))
        rows = _kpi_rows(df)
        t = Table(rows, colWidths=[9 * cm, 7 * cm])
        t.setStyle(_table_style())
        story.append(t)
        story.append(Spacer(1, 0.4 * cm))

    if "anomaly_logs" in module_set:
        story.append(Paragraph("Anomaly Detection Log", heading_style))
        rows = _anomaly_rows(df)
        col_w = [2 * cm] + [5 * cm] * (len(rows[0]) - 1)
        t = Table(rows, colWidths=col_w)
        t.setStyle(_table_style("#c0392b"))
        story.append(t)
        story.append(Spacer(1, 0.4 * cm))

    if "evidence_graphs" in module_set:
        story.append(Paragraph("Evidence Graphs", heading_style))
        story.append(Paragraph(
            "Chart exports are generated in the interactive dashboard. "
            "This section will include revenue trend charts, regional breakdowns, "
            "and anomaly scatter plots when exported from the live UI.",
            body_style,
        ))
        story.append(Spacer(1, 0.4 * cm))

    if "forecasts" in module_set:
        story.append(Paragraph("6-Month Revenue Forecast", heading_style))
        rows = _forecast_rows(df)
        t = Table(rows, colWidths=[5 * cm, 7 * cm, 4 * cm])
        t.setStyle(_table_style("#1a6b3c"))
        story.append(t)
        story.append(Spacer(1, 0.4 * cm))

    story.append(Spacer(1, 0.6 * cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#dee2e6"), spaceBefore=8))
    story.append(Paragraph(
        "<font size='8' color='#aaa'>Confidential - Generated by BizLens Analytics Platform</font>",
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

    Raises:
        RuntimeError: if openpyxl is not installed.
    """
    if not _OPENPYXL_AVAILABLE:
        raise RuntimeError("openpyxl is not installed. Run: pip install openpyxl")

    df = _get_df(dataset_id)
    wb = openpyxl.Workbook()
    wb.remove(wb.active)  # Remove default empty sheet

    HEADER_FILL = PatternFill(start_color="0f3460", end_color="0f3460", fill_type="solid")
    HEADER_FONT = Font(color="FFFFFF", bold=True, size=11)
    ALT_FILL = PatternFill(start_color="F0F4FF", end_color="F0F4FF", fill_type="solid")
    CENTER = Alignment(horizontal="center", vertical="center", wrap_text=True)
    THIN = Side(border_style="thin", color="DEE2E6")
    BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

    def _write_sheet(title: str, rows: List[List[str]]) -> None:
        ws = wb.create_sheet(title=title[:31])
        ws.append([f"BizLens Export - {workspace_name}"])
        ws["A1"].font = Font(bold=True, size=13, color="1a1a2e")
        ws.append([f"Generated: {datetime.now().strftime('%d %B %Y %H:%M')}"])
        ws["A2"].font = Font(italic=True, size=9, color="888888")
        ws.append([])

        start_row = 4
        for ri, row in enumerate(rows):
            ws.append(row)
            excel_row = start_row + ri
            for ci in range(1, len(row) + 1):
                cell = ws.cell(row=excel_row, column=ci)
                cell.border = BORDER
                cell.alignment = CENTER
                if ri == 0:
                    cell.fill = HEADER_FILL
                    cell.font = HEADER_FONT
                elif ri % 2 == 0:
                    cell.fill = ALT_FILL

        for col in ws.columns:
            max_len = max((len(str(c.value or "")) for c in col), default=10)
            ws.column_dimensions[get_column_letter(col[0].column)].width = min(max_len + 4, 40)

    module_set = {m.lower().strip() for m in included_modules}

    if "kpi_summary" in module_set:
        _write_sheet("KPI Summary", _kpi_rows(df))

    if "anomaly_logs" in module_set:
        _write_sheet("Anomaly Logs", _anomaly_rows(df))

    if "forecasts" in module_set:
        _write_sheet("Forecasts", _forecast_rows(df))

    if "evidence_graphs" in module_set:
        _write_sheet("Evidence Graphs", [
            ["Note"],
            ["Chart data exports are available from the interactive BizLens dashboard."],
        ])

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
    if df is None or df.empty:
        # Fallback to realistic demo dataset if no dataset is active in memory
        demo_data = {
            "date": ["2024-09-01", "2024-09-02", "2024-09-03", "2024-09-04", "2024-09-05", "2024-09-06", "2024-09-07"],
            "order_id": ["ORD-1001", "ORD-1002", "ORD-1003", "ORD-1004", "ORD-1005", "ORD-1006", "ORD-1007"],
            "product": ["Espresso", "Cappuccino", "Cold Brew", "Latte", "Pastry", "Mocha", "Americano"],
            "category": ["Hot Coffee", "Hot Coffee", "Cold Coffee", "Hot Coffee", "Bakery", "Hot Coffee", "Hot Coffee"],
            "region": ["North America", "North America", "Europe", "Asia Pacific", "North America", "Europe", "North America"],
            "quantity": [2, 1, 3, 2, 4, 1, 2],
            "unit_price": [3.50, 4.50, 5.00, 4.75, 3.25, 5.25, 3.75],
            "revenue": [7.00, 4.50, 15.00, 9.50, 13.00, 5.25, 7.50],
        }
        df = pd.DataFrame(demo_data)

    buf = io.BytesIO()
    df.to_csv(buf, index=False, encoding="utf-8")
    buf.seek(0)
    return buf


# --------------------------------------------------------------------------- #
# Share-link helpers                                                            #
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
