from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field


# ---------------- Ingestion Schemas ---------------- #

class CleaningLogEntry(BaseModel):
    action: str
    message: str
    column: Optional[str] = None
    count: Optional[int] = None
    fill_value: Optional[Any] = None


class IngestionResponse(BaseModel):
    dataset_id: Optional[int] = None
    filename: str
    workspace_id: Optional[int] = None
    row_count: int
    rows_processed: Optional[int] = None
    columns: List[str]
    cleaning_log: List[CleaningLogEntry]
    cleaned_at: datetime
    preview: Optional[List[Dict[str, Any]]] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------- KPI & Overview Schemas ---------------- #

class RegionRevenue(BaseModel):
    region: str
    revenue: float
    percentage: Optional[float] = None
    order_count: Optional[int] = None


class TimeSeriesRevenue(BaseModel):
    date: str
    revenue: float
    order_count: Optional[int] = None


class KPISummary(BaseModel):
    total_revenue: float
    average_order_value: float
    total_orders: int
    revenue_by_region: List[RegionRevenue]
    revenue_over_time: List[TimeSeriesRevenue]
    detected_columns: Optional[Dict[str, Optional[str]]] = None


class TotalRevenueResponse(BaseModel):
    total_revenue: float
    revenue_column_used: Optional[str] = None
    currency: Optional[str] = "USD"


class AOVResponse(BaseModel):
    average_order_value: float
    total_revenue: float
    total_orders: int
    order_id_column_used: Optional[str] = None


class RevenueByRegionResponse(BaseModel):
    total_revenue: float
    region_column_used: Optional[str] = None
    revenue_by_region: List[RegionRevenue]


class RevenueOverTimeResponse(BaseModel):
    total_revenue: float
    date_column_used: Optional[str] = None
    revenue_over_time: List[TimeSeriesRevenue]


class SessionStatusResponse(BaseModel):
    active_dataset: bool
    dataset_id: Optional[int] = None
    row_count: int
    columns: List[str]


class OverviewKPIRequest(BaseModel):
    """
    Flexible dataset payload supporting either:
    1. A raw list of records in `data`: [{"revenue": 100, "region": "North", "date": "2024-01-01"}, ...]
    2. Optional explicit column mappings if column names differ from standard names.
    """
    data: List[Dict[str, Any]] = Field(..., description="List of row objects/records")
    revenue_column: Optional[str] = Field(None, description="Explicit name of the revenue/sales column")
    region_column: Optional[str] = Field(None, description="Explicit name of the region/location column")
    date_column: Optional[str] = Field(None, description="Explicit name of the date/time column")
    order_id_column: Optional[str] = Field(None, description="Explicit name of the order/transaction ID column")
    dataset_id: Optional[int] = Field(None, description="Optional ID of saved dataset to persist metrics for")


# ---------------- Reports & Exports Schemas ---------------- #

class PDFReportRequest(BaseModel):
    """Request body for generating a PDF business report."""
    workspace_name: Optional[str] = Field("My Coffee Shop", description="Display name of the workspace / business")
    included_modules: List[str] = Field(
        ...,
        description=(
            "List of report sections to include. "
            "Valid values: 'kpi_summary', 'anomaly_logs', 'evidence_graphs', 'forecasts'"
        ),
        example=["kpi_summary", "anomaly_logs", "forecasts"],
    )
    dataset_id: Optional[int] = Field(None, description="Optional dataset ID to scope report")


class ExcelExportRequest(BaseModel):
    """Request body for generating a multi-sheet Excel export."""
    workspace_name: Optional[str] = Field("My Coffee Shop", description="Display name of the workspace / business")
    included_modules: List[str] = Field(
        ...,
        description="Modules to export as separate Excel sheets.",
        example=["kpi_summary", "anomaly_logs"],
    )
    dataset_id: Optional[int] = Field(None, description="Optional dataset ID to scope report")


class ShareLinkResponse(BaseModel):
    """Response containing a shareable pre-signed or token-based URL."""
    share_url: str = Field(..., description="Publicly accessible URL for the exported report")
    expires_at: Optional[str] = Field(None, description="ISO-8601 timestamp when the link expires (None = permanent)")


class CSVExportRequest(BaseModel):
    """Request body for generating a CSV dataset export."""
    dataset_id: Optional[int] = Field(None, description="Optional dataset ID to export")



# ---------------- AI Co-pilot / Chatbot Schemas ---------------- #

class CopilotMessage(BaseModel):
    """A single turn in the copilot conversation history."""
    role: str = Field(..., description="Either 'user' or 'assistant'")
    content: str = Field(..., description="Message text")


class CopilotRequest(BaseModel):
    """Request body for the AI Co-pilot chat endpoint."""
    message: str = Field(..., description="The user's latest question or command")
    conversation_history: Optional[List[CopilotMessage]] = Field(
        default_factory=list,
        description="Prior turns sent by the client for multi-turn context",
    )
    dataset_id: Optional[int] = Field(None, description="Dataset ID to scope analysis to")
    workspace_name: Optional[str] = Field("My Business", description="Workspace context label")


class CopilotResponse(BaseModel):
    """Response from the AI Co-pilot."""
    reply: str = Field(..., description="The assistant's response text")
    insight_type: Optional[str] = Field(
        None,
        description="Detected intent: 'kpi', 'anomaly', 'forecast', 'general', etc.",
    )
    data_snippet: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Optional structured data extracted from the analysis (e.g. top anomalies)",
    )
    follow_up_suggestions: Optional[List[str]] = Field(
        None,
        description="Proactive follow-up questions the user might want to ask",
    )

