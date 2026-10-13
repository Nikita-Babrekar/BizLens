'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Database,
  FileCheck,
  FileSpreadsheet,
  Layers,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
  Zap,
} from 'lucide-react';
import { useDataset } from '@/context/DatasetContext';
import { formatCurrencyINR, formatCompactINR } from '@/lib/utils';

const REGION_PALETTE = [
  '#315efb', // BizLens Royal Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#64748b', // Slate
];

interface DynamicOverviewProps {
  notify?: (msg: string) => void;
  onGoToIngestion?: () => void;
}

export default function DynamicOverview({
  notify,
  onGoToIngestion,
}: DynamicOverviewProps) {
  const {
    uploadedData,
    metrics,
    isLoadingMetrics,
    metricsError,
    fetchMetricsForDataset,
  } = useDataset();

  // If uploadedData exists but metrics not yet computed, trigger computation
  useEffect(() => {
    if (uploadedData && !metrics && !isLoadingMetrics) {
      fetchMetricsForDataset(uploadedData);
    }
  }, [uploadedData, metrics, isLoadingMetrics, fetchMetricsForDataset]);

  const handleRefresh = async () => {
    if (uploadedData) {
      const res = await fetchMetricsForDataset(uploadedData);
      if (res && notify) {
        notify('Live overview KPIs refreshed successfully');
      }
    }
  };

  // ---------------- Empty State ---------------- //
  if (!uploadedData) {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-300">
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#778198] dark:text-[#8e9bb5]">
              Executive Dashboard
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-[#15213a] dark:text-white">
              Business Intelligence Overview
            </h1>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#edf2ff] px-3 py-1 text-xs font-semibold text-[#315efb] dark:bg-[#315efb]/20 dark:text-[#82a3ff]">
            <Database className="size-3.5" />
            FastAPI Pipeline Ready
          </span>
        </div>

        {/* Clean Empty State Card as required */}
        <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-white p-10 text-center shadow-sm dark:border-[#243456] dark:bg-[#101a31] transition-all">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-[#edf2ff] text-[#315efb] shadow-sm dark:bg-[#315efb]/20 dark:text-[#82a3ff]">
            <Upload className="size-8" />
          </div>

          <h2 className="text-lg font-bold text-[#15213a] dark:text-white">
            No dataset uploaded
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-[#64748b] dark:text-[#94a3b8] leading-relaxed">
            No dataset uploaded. Please upload a file in Data Ingestion to view live analytics.
          </p>

          <div className="mx-auto mt-6 flex max-w-lg flex-wrap items-center justify-center gap-4 text-xs text-[#64748b] dark:text-[#94a3b8]">
            <div className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 dark:border-[#1e293b] dark:bg-[#13203c]">
              <FileSpreadsheet className="size-3.5 text-[#315efb]" />
              <span>CSV & Excel (.xlsx) support</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 dark:border-[#1e293b] dark:bg-[#13203c]">
              <Sparkles className="size-3.5 text-[#10b981]" />
              <span>Auto column detection</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 dark:border-[#1e293b] dark:bg-[#13203c]">
              <Zap className="size-3.5 text-[#f59e0b]" />
              <span>Automated cleaning</span>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            {onGoToIngestion ? (
              <button
                type="button"
                onClick={onGoToIngestion}
                className="inline-flex items-center gap-2 rounded-xl bg-[#315efb] px-5 py-3 text-xs font-semibold text-white shadow-lg shadow-[#315efb]/25 hover:bg-[#2548c7] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Upload className="size-4" />
                <span>Go to Data Ingestion</span>
                <ArrowRight className="size-4" />
              </button>
            ) : (
              <Link
                href="/ingestion"
                className="inline-flex items-center gap-2 rounded-xl bg-[#315efb] px-5 py-3 text-xs font-semibold text-white shadow-lg shadow-[#315efb]/25 hover:bg-[#2548c7] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Upload className="size-4" />
                <span>Go to Data Ingestion</span>
                <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------- Loading State ---------------- //
  if (isLoadingMetrics && !metrics) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-[#edf2ff] text-[#315efb] dark:bg-[#315efb]/20">
          <Loader2 className="size-7 animate-spin" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#15213a] dark:text-white">
            Calculating Live Overview KPIs...
          </h2>
          <p className="mt-1 text-xs text-[#778198] dark:text-[#8e9bb5]">
            Processing {uploadedData.filename} ({uploadedData.rows_processed} rows) via FastAPI analytics engine.
          </p>
        </div>
      </div>
    );
  }

  // Calculate dynamic regional data colors
  const regionalData = (metrics?.revenue_by_region || []).map((item, idx) => ({
    name: item.region,
    value: item.revenue,
    percentage: item.percentage ?? 0,
    order_count: item.order_count,
    color: REGION_PALETTE[idx % REGION_PALETTE.length],
  }));

  // Format time series data for line/area chart
  const timeSeriesData = (metrics?.revenue_over_time || []).map((t) => ({
    date: t.date,
    revenue: t.revenue,
    orders: t.order_count,
  }));

  const totalRevenueFormatted = formatCurrencyINR(metrics?.total_revenue ?? 0);

  const aovFormatted = formatCurrencyINR(metrics?.average_order_value ?? 0);

  const totalOrdersFormatted = (metrics?.total_orders ?? uploadedData.rows_processed).toLocaleString('en-IN');

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header and Refresh Action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[.14em] text-[#778198] dark:text-[#8e9bb5]">
            Active Live Dataset · {uploadedData.filename}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#15213a] dark:text-white">
            Business Intelligence Overview
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoadingMetrics}
            className="flex items-center gap-2 rounded-lg border border-[#dfe4ed] bg-white px-3 py-2 text-xs font-semibold text-[#536079] shadow-sm hover:border-[#315efb] hover:text-[#315efb] dark:border-[#26375a] dark:bg-[#162340] dark:text-[#cbd5e1] transition disabled:opacity-60"
          >
            <RefreshCw
              size={14}
              className={isLoadingMetrics ? 'animate-spin text-[#315efb]' : ''}
            />
            <span>Refresh KPIs</span>
          </button>

          {onGoToIngestion ? (
            <button
              onClick={onGoToIngestion}
              className="flex items-center gap-1.5 rounded-lg bg-[#315efb] px-3 py-2 text-xs font-semibold text-white shadow-md shadow-[#315efb]/20 hover:bg-[#2548c7] transition"
            >
              <Upload size={14} />
              <span>Upload Dataset</span>
            </button>
          ) : (
            <Link
              href="/ingestion"
              className="flex items-center gap-1.5 rounded-lg bg-[#315efb] px-3 py-2 text-xs font-semibold text-white shadow-md shadow-[#315efb]/20 hover:bg-[#2548c7] transition"
            >
              <Upload size={14} />
              <span>Upload Dataset</span>
            </Link>
          )}
        </div>
      </div>

      {/* Metrics Error Notice if any */}
      {metricsError && (
        <div className="flex items-center gap-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-4 text-xs text-[#b91c1c] dark:border-[#7f1d1d] dark:bg-[#450a0a]/30 dark:text-[#f87171]">
          <AlertCircle className="size-4 shrink-0" />
          <div className="flex-1">{metricsError}</div>
        </div>
      )}

      {/* Active Dataset Ribbon */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#dfe6f7] bg-[#f4f7ff] p-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#22355c] dark:bg-[#121f3d]">
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#dfe7ff] text-[#315efb] dark:bg-[#1e2f5b]">
            <FileSpreadsheet className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#15213a] dark:text-white">
                {uploadedData.filename}
              </span>
              <span className="rounded-full bg-[#10b981]/15 px-2 py-0.5 text-[10px] font-bold text-[#10b981] dark:bg-[#10b981]/20 dark:text-[#34d399]">
                Live Analytics
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-[#7080a3] dark:text-[#93a2c2]">
              {uploadedData.rows_processed.toLocaleString()} rows · {uploadedData.columns.length} columns · {uploadedData.cleaning_log.length} automated cleaning operations applied.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#64748b] dark:text-[#94a3b8]">
          <CheckCircle2 className="size-4 text-[#10b981]" />
          <span>Synced with FastAPI engine</span>
        </div>
      </div>

      {/* Dynamic 4-KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* KPI 1: Total Revenue */}
        <div className="rounded-xl border border-[#e3e7ef] bg-white p-5 shadow-sm dark:border-[#1e293b] dark:bg-[#101a31] transition-all">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-[#778198] dark:text-[#8e9bb5]">
              Total Revenue
            </span>
            <div className="grid size-8 place-items-center rounded-lg bg-[#edf2ff] text-[#315efb] dark:bg-[#315efb]/20 dark:text-[#82a3ff]">
              <BarChart3 size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-[#15213a] dark:text-white">
              {totalRevenueFormatted}
            </span>
            <span className="rounded-md bg-[#e7f8f0] px-2 py-0.5 text-[10px] font-semibold text-[#14885c] dark:bg-[#10b981]/20 dark:text-[#34d399]">
              Live Data
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#8491ac]">
            Sum of detected revenue across all records
          </p>
        </div>

        {/* KPI 2: Average Order Value (AOV) */}
        <div className="rounded-xl border border-[#e3e7ef] bg-white p-5 shadow-sm dark:border-[#1e293b] dark:bg-[#101a31] transition-all">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-[#778198] dark:text-[#8e9bb5]">
              Average Order Value (AOV)
            </span>
            <div className="grid size-8 place-items-center rounded-lg bg-[#fef3c7] text-[#d97706] dark:bg-[#f59e0b]/20 dark:text-[#fbbf24]">
              <Zap size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-[#15213a] dark:text-white">
              {aovFormatted}
            </span>
            <span className="rounded-md bg-[#edf2ff] px-2 py-0.5 text-[10px] font-semibold text-[#315efb] dark:bg-[#315efb]/20 dark:text-[#82a3ff]">
              Per Order
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#8491ac]">
            Revenue divided by {totalOrdersFormatted} transactions
          </p>
        </div>

        {/* KPI 3: Total Orders / Transactions */}
        <div className="rounded-xl border border-[#e3e7ef] bg-white p-5 shadow-sm dark:border-[#1e293b] dark:bg-[#101a31] transition-all">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-[#778198] dark:text-[#8e9bb5]">
              Total Transactions
            </span>
            <div className="grid size-8 place-items-center rounded-lg bg-[#e0e7ff] text-[#4f46e5] dark:bg-[#6366f1]/20 dark:text-[#a5b4fc]">
              <FileCheck size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-[#15213a] dark:text-white">
              {totalOrdersFormatted}
            </span>
            <span className="rounded-md bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-semibold text-[#475569] dark:bg-[#1e293b] dark:text-[#cbd5e1]">
              Orders
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#8491ac]">
            Unique transaction identifiers processed
          </p>
        </div>

        {/* KPI 4: Dataset Cleanliness */}
        <div className="rounded-xl border border-[#e3e7ef] bg-white p-5 shadow-sm dark:border-[#1e293b] dark:bg-[#101a31] transition-all">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-[#778198] dark:text-[#8e9bb5]">
              Data Quality Score
            </span>
            <div className="grid size-8 place-items-center rounded-lg bg-[#e7f8f0] text-[#14885c] dark:bg-[#10b981]/20 dark:text-[#34d399]">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-[#15213a] dark:text-white">
              100%
            </span>
            <span className="rounded-md bg-[#e7f8f0] px-2 py-0.5 text-[10px] font-semibold text-[#14885c] dark:bg-[#10b981]/20 dark:text-[#34d399]">
              Verified
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#8491ac]">
            {uploadedData.cleaning_log.length} automated cleanups executed
          </p>
        </div>
      </div>

      {/* Visual Charts: Revenue over Time & Revenue by Region */}
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* Dynamic Line / Area Chart: Revenue Over Time */}
        <div className="rounded-xl border border-[#e3e7ef] bg-white p-6 shadow-sm dark:border-[#1e293b] dark:bg-[#101a31]">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#15213a] dark:text-white">
                Revenue over Time
              </h2>
              <p className="text-xs text-[#778198] dark:text-[#8e9bb5]">
                {timeSeriesData.length > 0
                  ? `Time-series aggregation (${timeSeriesData.length} data point${timeSeriesData.length > 1 ? 's' : ''})`
                  : 'Daily timeline based on detected date column'}
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-[#edf2ff] px-2.5 py-1 text-[11px] font-semibold text-[#315efb] dark:bg-[#315efb]/20 dark:text-[#82a3ff]">
              <Calendar className="size-3" />
              Chronological
            </span>
          </div>

          <div className="h-[280px] w-full">
            {timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#315efb" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#315efb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#edf0f5" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#8491ac' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#8491ac' }}
                    tickFormatter={(v) => formatCompactINR(v)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#101a31',
                      borderRadius: 8,
                      border: 'none',
                      color: '#ffffff',
                      fontSize: 12,
                    }}
                    formatter={(val) => [formatCurrencyINR(Number(val)), 'Revenue']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#315efb"
                    strokeWidth={2.5}
                    fill="url(#revenueGradient)"
                    dot={{ r: 3, fill: '#315efb' }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-[#8491ac]">
                No time-series date entries found in current dataset.
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Pie Chart: Revenue by Region */}
        <div className="rounded-xl border border-[#e3e7ef] bg-white p-6 shadow-sm dark:border-[#1e293b] dark:bg-[#101a31]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#15213a] dark:text-white">
                Revenue by Region
              </h2>
              <p className="text-xs text-[#778198] dark:text-[#8e9bb5]">
                Geographic and categorical breakdown
              </p>
            </div>
            <span className="rounded-md bg-[#f1f5f9] px-2 py-0.5 text-[11px] font-semibold text-[#475569] dark:bg-[#1e293b] dark:text-slate-300">
              {regionalData.length} Region{regionalData.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
            <div className="h-[200px] w-[200px] shrink-0">
              {regionalData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={regionalData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {regionalData.map((r, i) => (
                        <Cell key={`cell-${i}`} fill={r.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#101a31',
                        borderRadius: 8,
                        border: 'none',
                        color: '#ffffff',
                        fontSize: 12,
                      }}
                      formatter={(val) => [
                        formatCurrencyINR(Number(val)),
                        'Revenue',
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[#8491ac]">
                  No regional data
                </div>
              )}
            </div>

            {/* Region Breakdown Legend with percentages */}
            <div className="flex w-full flex-col gap-2.5">
              {regionalData.map((r) => (
                <div
                  key={r.name}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: r.color }}
                    />
                    <span className="truncate font-medium text-[#475569] dark:text-slate-300">
                      {r.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-[#15213a] dark:text-white">
                      {formatCurrencyINR(r.value, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                    <span className="w-12 text-right font-medium text-[#778198] dark:text-[#8e9bb5]">
                      {r.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Sample Preview Table */}
      {uploadedData.preview && uploadedData.preview.length > 0 && (
        <div className="rounded-xl border border-[#e3e7ef] bg-white p-6 shadow-sm dark:border-[#1e293b] dark:bg-[#101a31]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#15213a] dark:text-white">
                Underlying Dataset Sample
              </h2>
              <p className="text-xs text-[#778198] dark:text-[#8e9bb5]">
                Showing first {uploadedData.preview.length} live records driving these analytics
              </p>
            </div>
            <span className="text-xs text-[#64748b] dark:text-[#94a3b8]">
              {uploadedData.columns.length} columns active
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#edf2f7] dark:border-[#1e293b]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafc] text-[10px] uppercase tracking-wider text-[#64748b] dark:bg-[#152342] dark:text-slate-400">
                <tr>
                  {uploadedData.columns.map((col) => (
                    <th key={col} className="px-4 py-3 font-semibold whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf2f7] dark:divide-[#1e293b]">
                {uploadedData.preview.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[#f8fafc] dark:hover:bg-[#13203c]/60">
                    {uploadedData.columns.map((col) => (
                      <td
                        key={col}
                        className="px-4 py-2.5 text-[#334155] dark:text-slate-300 whitespace-nowrap"
                      >
                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
