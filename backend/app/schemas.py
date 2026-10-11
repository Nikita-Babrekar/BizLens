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
