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

export interface CausalFactor {
  category: 'inventory_stockout' | 'price_drop' | 'product_availability' | 'regional_dip' | 'general';
  factor_name: string;
  impact_percentage: number;
  explanation: string;
  metric_before?: number | null;
  metric_during?: number | null;
  duration_days?: number | null;
  confidence: number;
}

export interface AnomalyWindow {
  start_date: string;
  end_date: string;
  actual_revenue: number;
  baseline_revenue: number;
  drop_percentage: number;
  severity: 'Critical anomaly' | 'Major anomaly' | 'Moderate deviation';
}

export interface RootCauseResponse {
  primary_cause: string;
  root_causes: CausalFactor[];
  summary: RootCauseSummary;
  nodes: RootCauseNode[];
  edges: RootCauseEdge[];
  line_graph: RootCauseLinePoint[];
  anomaly_windows?: AnomalyWindow[];
  analyzed_dimensions: string[];
  total_revenue_impact: number;
  meta: Record<string, any>;
}

export interface RootCausePayload {
  data?: Record<string, any>[];
  dataset_id?: number;
  date_start?: string;
  date_end?: string;
  revenue_column?: string;
  date_column?: string;
  product_column?: string;
  region_column?: string;
  stock_column?: string;
  price_column?: string;
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

// ---------------- Sales Forecast & What-If Simulator Schemas ---------------- //

export interface ForecastDataPoint {
  period: string;
  period_full?: string;
  is_forecast: boolean;
  historical_incremental?: number | null;
  historical_baseline?: number | null;
  baseline?: number | null;
  baseline_lower?: number | null;
  baseline_upper?: number | null;
  incremental?: number | null;
  incremental_best?: number | null;
  incremental_worst?: number | null;
  best_case_str?: string;
  most_likely_str?: string;
  worst_case_str?: string;
}

export interface ForecastSummary {
  slider_price_pct: number;
  slider_marketing_pct: number;
  slider_delay_days: number;
  baseline_total_revenue: number;
  incremental_total_revenue: number;
  net_incremental_lift: number;
  lift_percentage: number;
  baseline_total_str: string;
  incremental_total_str: string;
  lift_str: string;
  elasticity_coefficient: number;
  confidence_level: number;
  ai_narrative: string;
  divider_index: number;
}

export interface ForecastResponse {
  series: ForecastDataPoint[];
  summary: ForecastSummary;
  units: string;
}

export interface ForecastSimulatePayload {
  price_change_pct: number;
  marketing_change_pct?: number;
  delay_days?: number;
  dataset_id?: number | null;
  data?: Record<string, any>[];
}

/**
 * Fetches dynamic sales forecast curves and What-If simulation from backend.
 * Falls back gracefully to the Next.js internal API route if backend is offline.
 */
export async function fetchForecastSimulation(
  payload: ForecastSimulatePayload
): Promise<ForecastResponse> {
  // Try Next.js route first which handles both FastAPI proxy and seamless fallback
  try {
    const res = await fetch("/api/forecast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // If Next.js internal route errored, try direct FastAPI backend
  }

  const directRes = await fetch(`${API_BASE_URL}/api/forecast/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!directRes.ok) {
    throw new Error(`Forecast calculation failed (${directRes.status})`);
  }

  return await directRes.json();
}

// ---------------- Reports & Exports API ---------------- //

export interface PDFExportOptions {
  workspaceName?: string;
  includedModules: string[];
  datasetId?: number;
}

export interface ShareLinkOptions {
  workspaceName?: string;
  includedModules: string[];
  ttlHours?: number;
}

export interface ShareLinkResult {
  share_url: string;
  expires_at?: string | null;
}

/**
 * Triggers a file download in the browser from a Blob.
 */
export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

/**
 * Downloads a generated PDF business report from the backend.
 */
export async function downloadPDFReport(options: PDFExportOptions): Promise<void> {
  const payload = {
    workspace_name: options.workspaceName || "My Coffee Shop",
    included_modules: options.includedModules,
  };
  const url = options.datasetId
    ? `${API_BASE_URL}/api/export/pdf?dataset_id=${options.datasetId}`
    : `${API_BASE_URL}/api/export/pdf`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = `Failed to generate PDF report (HTTP ${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson?.detail) {
        errorDetail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // response wasn't JSON
    }
    throw new Error(errorDetail);
  }

  // Extract filename from Content-Disposition if present
  let filename = `bizlens_report_${(options.workspaceName || "report").replace(/\s+/g, "_")}.pdf`;
  const disposition = response.headers.get("Content-Disposition");
  if (disposition && disposition.includes("filename=")) {
    const match = disposition.match(/filename=["']?([^"';]+)["']?/);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  const blob = await response.blob();
  triggerBrowserDownload(blob, filename);
}

/**
 * Downloads the cleaned dataset CSV from the backend.
 */
export async function downloadCleanedDatasetCSV(datasetId?: number): Promise<void> {
  const url = datasetId
    ? `${API_BASE_URL}/api/export/csv?dataset_id=${datasetId}`
    : `${API_BASE_URL}/api/export/csv`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ dataset_id: datasetId ?? null }),
  });

  if (!response.ok) {
    let errorDetail = `Failed to export cleaned dataset (HTTP ${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson?.detail) {
        errorDetail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // response wasn't JSON
    }
    throw new Error(errorDetail);
  }

  let filename = `cleaned_dataset_${datasetId || "active"}.csv`;
  const disposition = response.headers.get("Content-Disposition");
  if (disposition && disposition.includes("filename=")) {
    const match = disposition.match(/filename=["']?([^"';]+)["']?/);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  const blob = await response.blob();
  triggerBrowserDownload(blob, filename);
}

/**
 * Generates a shareable dashboard/report link.
 */
export async function createReportShareLink(options: ShareLinkOptions): Promise<ShareLinkResult> {
  const payload = {
    workspace_name: options.workspaceName || "My Coffee Shop",
    included_modules: options.includedModules,
  };
  const ttl = options.ttlHours || 72;
  const response = await fetch(`${API_BASE_URL}/api/export/share?ttl_hours=${ttl}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = `Failed to create share link (HTTP ${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson?.detail) {
        errorDetail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // response wasn't JSON
    }
    throw new Error(errorDetail);
  }

  return await response.json();
}

// ---------------- AI Co-pilot / Chatbot API ---------------- //

export interface CopilotMessagePayload {
  role: 'user' | 'assistant';
  content: string;
}

export interface CopilotChatPayload {
  message: string;
  conversation_history?: CopilotMessagePayload[];
  dataset_id?: number | null;
  workspace_name?: string;
}

export interface CopilotChatResponse {
  reply: string;
  insight_type?: string | null;
  data_snippet?: Record<string, any>[] | null;
  follow_up_suggestions?: string[] | null;
}

/**
 * Sends a query to the AI Co-pilot / Ask BizLens backend endpoint.
 */
export async function sendCopilotChat(
  payload: CopilotChatPayload
): Promise<CopilotChatResponse> {
  const url = payload.dataset_id
    ? `${API_BASE_URL}/api/copilot/chat?dataset_id=${payload.dataset_id}`
    : `${API_BASE_URL}/api/copilot/chat`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = `Co-pilot request failed (HTTP ${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson?.detail) {
        errorDetail =
          typeof errJson.detail === "string"
            ? errJson.detail
            : JSON.stringify(errJson.detail);
      }
    } catch {
      // response wasn't JSON
    }
    throw new Error(errorDetail);
  }

  return await response.json();
}



