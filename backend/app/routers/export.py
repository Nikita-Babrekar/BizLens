"""
export.py  (/api/export)
------------------------
FastAPI router for the Reports & Exports module.

Endpoints:
  POST /api/export/pdf          → Download a PDF report
  GET  /api/export/pdf          → Download a PDF report (GET fallback)
  POST /api/export/csv          → Download cleaned dataset CSV
  GET  /api/export/csv          → Download cleaned dataset CSV (GET fallback)
  POST /api/export/excel        → Download an Excel (.xlsx) file
  POST /api/export/share        → Generate a shareable link
  GET  /api/export/share/{token} → Resolve / preview a share link
"""

from __future__ import annotations

import io
import logging
from typing import List, Optional

from fastapi import APIRouter, Body, HTTPException, Query, status
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

try:
    from ..schemas import (
        CSVExportRequest,
        ExcelExportRequest,
        PDFReportRequest,
        ShareLinkResponse,
    )
    from ..services.export_service import (
        create_share_link,
        generate_csv_export,
        generate_excel_export,
        generate_pdf_report,
        resolve_share_link,
    )
except (ImportError, ValueError):
    from app.schemas import (
        CSVExportRequest,
        ExcelExportRequest,
        PDFReportRequest,
        ShareLinkResponse,
    )
    from app.services.export_service import (
        create_share_link,
        generate_csv_export,
        generate_excel_export,
        generate_pdf_report,
        resolve_share_link,
    )

router = APIRouter()

# Allowed module names guard
_VALID_MODULES = frozenset({"kpi_summary", "anomaly_logs", "evidence_graphs", "forecasts"})


def _validate_modules(modules: List[str]) -> None:
    invalid = [m for m in modules if m.lower().strip() not in _VALID_MODULES]
    if invalid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Invalid module(s): {invalid}. "
                f"Valid values are: {sorted(_VALID_MODULES)}"
            ),
        )


# --------------------------------------------------------------------------- #
# PDF                                                                         #
# --------------------------------------------------------------------------- #

@router.post(
    "/pdf",
    summary="Generate & download a PDF business report",
    response_class=StreamingResponse,
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "PDF file stream download",
        },
        422: {"description": "Invalid module selection"},
        500: {"description": "PDF generation failed"},
        503: {"description": "ReportLab not installed"},
    },
    tags=["Export"],
)
def download_pdf_report(
    payload: Optional[PDFReportRequest] = Body(None),
    dataset_id: Optional[int] = Query(None, description="Scope report to a specific dataset"),
) -> StreamingResponse:
    """
    Generate an in-memory PDF report for the requested modules and stream it
    back as a file download (`Content-Disposition: attachment`).
    """
    if payload is None:
        payload = PDFReportRequest(
            workspace_name="My Coffee Shop",
            included_modules=["kpi_summary", "anomaly_logs", "forecasts"],
        )
    _validate_modules(payload.included_modules)
    try:
        pdf_bytes = generate_pdf_report(
            workspace_name=payload.workspace_name or "My Coffee Shop",
            included_modules=payload.included_modules,
            dataset_id=dataset_id,
        )
        buf = io.BytesIO(pdf_bytes)
        buf.seek(0)
    except RuntimeError as exc:
        logger.error("PDF generation dependency missing: %s", exc, exc_info=True)
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Error generating PDF report: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating PDF report: {str(exc)}",
        ) from exc

    safe_name = "".join(
        c if c.isalnum() or c in ("-", "_") else "_" for c in (payload.workspace_name or "report")
    )
    filename = f"bizlens_report_{safe_name}.pdf"
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


@router.get(
    "/pdf",
    summary="Download a PDF business report via GET",
    response_class=StreamingResponse,
    tags=["Export"],
)
def get_pdf_report(
    workspace_name: str = Query("My Coffee Shop", description="Name of the workspace"),
    modules: Optional[List[str]] = Query(None, description="Selected modules to include"),
    dataset_id: Optional[int] = Query(None, description="Scope report to a specific dataset"),
) -> StreamingResponse:
    """GET fallback endpoint for PDF export."""
    selected = modules or ["kpi_summary", "anomaly_logs", "forecasts"]
    req = PDFReportRequest(workspace_name=workspace_name, included_modules=selected)
    return download_pdf_report(payload=req, dataset_id=dataset_id)


# --------------------------------------------------------------------------- #
# CSV Dataset Export                                                          #
# --------------------------------------------------------------------------- #

@router.post(
    "/csv",
    summary="Generate & download cleaned dataset as CSV",
    response_class=StreamingResponse,
    responses={
        200: {
            "content": {"text/csv": {}},
            "description": "Cleaned dataset CSV stream download",
        },
        500: {"description": "CSV generation failed"},
    },
    tags=["Export"],
)
def download_csv_export(
    payload: Optional[CSVExportRequest] = Body(None),
    dataset_id: Optional[int] = Query(None, description="Scope export to a specific dataset"),
) -> StreamingResponse:
    """
    Generate an in-memory CSV export of the cleaned dataset and stream it
    back as a file download (`Content-Disposition: attachment`).
    """
    target_id = dataset_id if dataset_id is not None else (payload.dataset_id if payload else None)
    try:
        buf = generate_csv_export(dataset_id=target_id)
    except Exception as exc:
        logger.error("Error generating CSV dataset export: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating CSV export: {str(exc)}",
        ) from exc

    filename = f"cleaned_dataset_{target_id or 'active'}.csv"
    return StreamingResponse(
        buf,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


@router.get(
    "/csv",
    summary="Download cleaned dataset as CSV via GET",
    response_class=StreamingResponse,
    tags=["Export"],
)
def get_csv_export(
    dataset_id: Optional[int] = Query(None, description="Scope export to a specific dataset"),
) -> StreamingResponse:
    """GET fallback endpoint for cleaned dataset CSV export."""
    return download_csv_export(payload=None, dataset_id=dataset_id)


# --------------------------------------------------------------------------- #
# Excel                                                                         #
# --------------------------------------------------------------------------- #

@router.post(
    "/excel",
    summary="Generate & download an Excel (.xlsx) export",
    response_class=StreamingResponse,
    responses={
        200: {
            "content": {
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {}
            },
            "description": "Excel file stream download",
        },
        422: {"description": "Invalid module selection"},
        500: {"description": "Excel generation failed"},
        503: {"description": "openpyxl not installed"},
    },
    tags=["Export"],
)
def download_excel_export(
    payload: Optional[ExcelExportRequest] = Body(None),
    dataset_id: Optional[int] = Query(None, description="Scope export to a specific dataset"),
) -> StreamingResponse:
    """
    Generate a multi-sheet Excel workbook for the requested modules and return
    it as a streaming file download.
    """
    if payload is None:
        payload = ExcelExportRequest(
            workspace_name="My Coffee Shop",
            included_modules=["kpi_summary", "anomaly_logs", "forecasts"],
        )
    _validate_modules(payload.included_modules)
    try:
        xlsx_bytes = generate_excel_export(
            workspace_name=payload.workspace_name or "My Coffee Shop",
            included_modules=payload.included_modules,
            dataset_id=dataset_id,
        )
        buf = io.BytesIO(xlsx_bytes)
        buf.seek(0)
    except RuntimeError as exc:
        logger.error("Excel generation dependency missing: %s", exc, exc_info=True)
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Error generating Excel export: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating Excel export: {str(exc)}",
        ) from exc

    safe_name = "".join(
        c if c.isalnum() or c in ("-", "_") else "_" for c in (payload.workspace_name or "export")
    )
    filename = f"bizlens_export_{safe_name}.xlsx"
    mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    return StreamingResponse(
        buf,
        media_type=mime,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


# --------------------------------------------------------------------------- #
# Share links                                                                   #
# --------------------------------------------------------------------------- #

@router.post(
    "/share",
    summary="Create a shareable link for a report",
    response_model=ShareLinkResponse,
    tags=["Export"],
)
def create_report_share_link(
    payload: PDFReportRequest = Body(...),
    ttl_hours: int = Query(72, ge=1, le=720, description="Link TTL in hours (1–720)"),
) -> ShareLinkResponse:
    """
    Mint a time-limited, token-based share URL for the requested report.
    The token encodes the workspace name and selected modules.
    """
    _validate_modules(payload.included_modules)
    result = create_share_link(
        workspace_name=payload.workspace_name or "My Coffee Shop",
        included_modules=payload.included_modules,
        ttl_hours=ttl_hours,
    )
    return ShareLinkResponse(
        share_url=result["share_url"],
        expires_at=result["expires_at"],
    )


@router.get(
    "/share/{token}",
    summary="Resolve / preview a share link",
    tags=["Export"],
)
def resolve_report_share_link(token: str) -> dict:
    """
    Validate a share token and return the report metadata it encodes.
    Returns 404 if the token is expired or unknown.
    """
    entry = resolve_share_link(token)
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share link not found or has expired.",
        )
    return {
        "valid": True,
        "workspace_name": entry["workspace_name"],
        "included_modules": entry["included_modules"],
        "expires_at": entry["expires_at"].isoformat(),
    }
