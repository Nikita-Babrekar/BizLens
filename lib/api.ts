/**
 * BizLens API Client Utility
 * Provides typed interaction with the FastAPI backend services.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface CleaningLogEntry {
  action: string;
  message: string;
  column?: string | null;
  count?: number | null;
  fill_value?: any;
}

export interface IngestionResponse {
  dataset_id?: number | null;
  filename: string;
  workspace_id?: number | null;
  row_count: number;
  rows_processed: number;
  columns: string[];
  cleaning_log: CleaningLogEntry[];
  cleaned_at: string;
  preview?: Record<string, any>[] | null;
}

export interface RegionRevenue {
  region: string;
  revenue: number;
  percentage?: number;
  order_count?: number;
}

export interface TimeSeriesRevenue {
  date: string;
  revenue: number;
  order_count?: number;
}

export interface KPISummary {
  total_revenue: number;
  average_order_value: number;
  total_orders: number;
  revenue_by_region: RegionRevenue[];
  revenue_over_time: TimeSeriesRevenue[];
}

export interface KPIPayload {
  data: Record<string, any>[];
  revenue_column?: string;
  region_column?: string;
  date_column?: string;
  order_id_column?: string;
  dataset_id?: number;
}

/**
 * Uploads a CSV or Excel dataset to the FastAPI backend ingestion pipeline.
 * Wraps the file into FormData and executes automated cleaning.
 *
 * @param file - File object (.csv, .xlsx, or .xls)
 * @param workspaceId - Optional workspace identifier
 * @returns IngestionResponse containing row count, columns, cleaning log, and preview
 */
export async function uploadDataset(
  file: File,
  workspaceId?: number
): Promise<IngestionResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (workspaceId !== undefined && workspaceId !== null) {
    formData.append("workspace_id", workspaceId.toString());
  }

  const response = await fetch(`${API_BASE_URL}/api/ingest/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `Upload failed with HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) {
        errorMessage =
          typeof errorJson.detail === "string"
            ? errorJson.detail
            : JSON.stringify(errorJson.detail);
      }
    } catch {
      // response wasn't JSON, retain status message
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  // Normalize rows_processed and row_count guarantees
  return {
    ...data,
    rows_processed: data.rows_processed ?? data.row_count ?? 0,
    row_count: data.row_count ?? data.rows_processed ?? 0,
    columns: data.columns || [],
    cleaning_log: data.cleaning_log || [],
  };
}

/**
 * Fetches calculated core KPIs (Total Revenue, AOV, Regional, Time Series)
 * for a dataset payload.
 */
export async function fetchOverviewKPIs(
  payload: KPIPayload | Record<string, any>[]
): Promise<KPISummary> {
  const response = await fetch(`${API_BASE_URL}/api/overview/kpis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `Failed to compute KPIs (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson?.detail) {
        errorMessage =
          typeof errorJson.detail === "string"
            ? errorJson.detail
            : JSON.stringify(errorJson.detail);
      }
    } catch {
      // retain generic error
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}

/**
 * Fetches calculated core KPIs directly from the active backend session dataset
 * or by dataset ID via GET /api/overview.
 */
export async function fetchActiveOverviewKPIs(
  datasetId?: number
): Promise<KPISummary> {
  const url = datasetId
    ? `${API_BASE_URL}/api/overview?dataset_id=${datasetId}`
    : `${API_BASE_URL}/api/overview`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    let errorMessage = `Failed to fetch active KPIs (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson?.detail) {
        errorMessage =
          typeof errorJson.detail === "string"
            ? errorJson.detail
            : JSON.stringify(errorJson.detail);
      }
    } catch {
      // retain generic error
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}

// ---------------- Root Cause Analysis Schemas ---------------- //

export interface RootCauseNode {
  id: string;
  x: number;
  y: number;
  label: string;
  sub: string;
  dimension: string;
  contribution: number;
  confidence?: number | null;
  tone: 'red' | 'amber' | 'green' | 'blue' | 'gray';
  impact_amount?: number | null;
}

export interface RootCauseEdge {
  from: string;
  to: string;
}

export interface RootCauseLinePoint {
  date: string;
  actual: number;
  baseline?: number | null;
  is_anomaly: boolean;
}

export interface RootCauseSummary {
  title: string;
  severity: 'Critical anomaly' | 'Major anomaly' | 'Moderate deviation' | 'Stable';
  drop_or_spike_percentage: number;
  period_start?: string | null;
  period_end?: string | null;
  confidence: number;
  explanation: string;
}

export interface RootCauseResponse {
  summary: RootCauseSummary;
  nodes: RootCauseNode[];
  edges: RootCauseEdge[];
  line_graph: RootCauseLinePoint[];
  analyzed_dimensions: string[];
  total_revenue_impact: number;
  meta: Record<string, any>;
}

export interface RootCausePayload {
  data?: Record<string, any>[];
  dataset_id?: number;
  revenue_column?: string;
  date_column?: string;
  product_column?: string;
  region_column?: string;
  stock_column?: string;
}

/**
 * Fetches dynamic root cause insights & evidence graph from active backend session
 * or by dataset ID.
 */
export async function fetchActiveRootCause(
  datasetId?: number
): Promise<RootCauseResponse> {
  const url = datasetId
    ? `${API_BASE_URL}/api/root-cause?dataset_id=${datasetId}`
    : `${API_BASE_URL}/api/root-cause`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    let errorMessage = `Failed to fetch root cause analysis (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson?.detail) {
        errorMessage =
          typeof errorJson.detail === "string"
            ? errorJson.detail
            : JSON.stringify(errorJson.detail);
      }
    } catch {
      // retain generic
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}

/**
 * Posts dataset payload to compute dynamic root-cause insights & evidence graph.
 */
export async function fetchRootCause(
  payload: RootCausePayload | Record<string, any>[]
): Promise<RootCauseResponse> {
  const body = Array.isArray(payload) ? { data: payload } : payload;
  const response = await fetch(`${API_BASE_URL}/api/root-cause`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorMessage = `Failed to compute root cause analysis (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson?.detail) {
        errorMessage =
          typeof errorJson.detail === "string"
            ? errorJson.detail
            : JSON.stringify(errorJson.detail);
      }
    } catch {
      // retain generic
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}
