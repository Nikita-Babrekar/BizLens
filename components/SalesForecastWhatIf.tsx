'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  BrainCircuit,
  Calendar,
  Check,
  ChevronRight,
  HelpCircle,
  Info,
  Loader2,
  RefreshCw,
  Sliders,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  ForecastDataPoint,
  ForecastResponse,
  ForecastSummary,
  fetchForecastSimulation,
} from '@/lib/api';
import { useDataset } from '@/context/DatasetContext';

interface SalesForecastWhatIfProps {
  onNotify?: (msg: string) => void;
  className?: string;
}

export default function SalesForecastWhatIf({
  onNotify,
  className = '',
}: SalesForecastWhatIfProps) {
  const { uploadedData } = useDataset();

  // Simulator controls
  const [priceChange, setPriceChange] = useState<number>(10);
  const [marketingSpend, setMarketingSpend] = useState<number>(0);
  const [supplierDelay, setSupplierDelay] = useState<number>(0);

  // Forecast state
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Active hover/selected point for the pin tooltip
  // Default to the peak month (index 7, typically Nov/Dec) matching the reference image!
  const [selectedPointIndex, setSelectedPointIndex] = useState<number>(7);

  // Debounced API fetch to update incremental forecast smoothly
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchForecast = async (
    price: number,
    marketing: number,
    delay: number,
    isInitial = false
  ) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setIsUpdating(true);
    }

    try {
      const response = await fetchForecastSimulation({
        price_change_pct: price,
        marketing_change_pct: marketing,
        delay_days: delay,
        dataset_id: uploadedData?.dataset_id,
        data: uploadedData?.preview || undefined,
      });

      setData(response);
    } catch (err) {
      console.error('Failed to load forecast simulation:', err);
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchForecast(priceChange, marketingSpend, supplierDelay, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedData]);

  // Handle slider change with debounced backend synchronization
  const handlePriceChange = (val: number) => {
    setPriceChange(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchForecast(val, marketingSpend, supplierDelay, false);
    }, 180);
  };

  const handleMarketingChange = (val: number) => {
    setMarketingSpend(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchForecast(priceChange, val, supplierDelay, false);
    }, 180);
  };

  const handleDelayChange = (val: number) => {
    setSupplierDelay(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchForecast(priceChange, marketingSpend, val, false);
    }, 180);
  };

  // Quick preset buttons
  const applyPreset = (price: number, marketing = 0, delay = 0) => {
    setPriceChange(price);
    setMarketingSpend(marketing);
    setSupplierDelay(delay);
    fetchForecast(price, marketing, delay, false);
    if (onNotify) {
      onNotify(`Applied scenario: ${price >= 0 ? '+' : ''}${price}% price adjustment`);
    }
  };

  // Formatted chart data combining historical & forecast points
  // Also calculate custom confidence envelope range for Recharts Area
  const chartData = useMemo(() => {
    if (!data?.series) return [];

    return data.series.map((pt, idx) => {
      // Area envelope for Incremental Forecast
      const incUpper = pt.incremental_best ?? null;
      const incLower = pt.incremental_worst ?? null;
      const incBand =
        incUpper !== null && incLower !== null ? [incLower, incUpper] : null;

      // Area envelope for Baseline Forecast
      const baseUpper = pt.baseline_upper ?? null;
      const baseLower = pt.baseline_lower ?? null;
      const baseBand =
        baseUpper !== null && baseLower !== null ? [baseLower, baseUpper] : null;

      return {
        ...pt,
        index: idx,
        // Area under historical incremental line
        histIncArea: pt.historical_incremental ?? null,
        // Shaded prediction band [lower, upper]
        incBand,
        baseBand,
      };
    });
  }, [data]);

  // Selected or peak point for the floating callout box
  const activePinPoint = useMemo(() => {
    if (!chartData || chartData.length === 0) return null;
    const targetIdx =
      selectedPointIndex >= 0 && selectedPointIndex < chartData.length
        ? selectedPointIndex
        : 7;
    return chartData[targetIdx] || chartData[chartData.length - 2];
  }, [chartData, selectedPointIndex]);

  const summary = data?.summary;
  const dividerIdx = summary?.divider_index ?? 3;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Grid: Forecast Visualizer Card + What-If Simulator Panel */}
      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        {/* ========================================================= */}
        {/* LEFT CARD: Sales Forecast Graph (Matching image_1.png)    */}
        {/* ========================================================= */}
        <section className="relative flex flex-col justify-between rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.04)] dark:border-[#1e293b] dark:bg-[#101a31] transition-all">
          {/* Header & Legend (As shown in image) */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[20px] font-bold tracking-[-0.03em] text-[#0f172a] dark:text-white">
                  Sales Forecast
                </h2>
                {isUpdating && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-[#315efb] dark:text-[#82a3ff]">
                    <Loader2 size={12} className="animate-spin" />
                    Calculating...
                  </span>
                )}
              </div>

              {/* Legend with exact colors from image */}
              <div className="mt-3 flex items-center gap-6 text-[12px] font-medium">
                <div className="flex items-center gap-2 text-[#0f172a] dark:text-[#e2e8f0]">
                  {/* Vibrant Blue Square */}
                  <span className="size-3 rounded-[3px] bg-[#0066FF] shadow-sm" />
                  <span>Incremental</span>
                </div>
                <div className="flex items-center gap-2 text-[#0f172a] dark:text-[#e2e8f0]">
                  {/* Dark Green Square */}
                  <span className="size-3 rounded-[3px] bg-[#094339] dark:bg-[#065f46] shadow-sm" />
                  <span>Baseline</span>
                </div>
              </div>
            </div>

            {/* AI Status Pill */}
            <div className="flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 text-[11px] font-semibold text-[#475569] dark:border-[#1e293b] dark:bg-[#162340] dark:text-[#94a3b8]">
              <Sparkles size={13} className="text-[#315efb]" />
              <span>AI Dual-Path Forecast</span>
              <span className="size-1.5 rounded-full bg-[#10b981]" />
            </div>
          </div>

          {/* Interactive Graph Canvas */}
          <div className="relative mt-6 h-[340px] w-full">
            {/* The Reference Pin Callout / Tooltip matching image_1.png */}
            {activePinPoint && activePinPoint.is_forecast && (
              <div
                className="pointer-events-none absolute z-20 transition-all duration-300 ease-out"
                style={{
                  // Position near the peak point on right side
                  right: '18%',
                  top: '6%',
                }}
              >
                {/* Floating Tooltip Card */}
                <div className="relative rounded-xl border border-[#e2e8f0]/80 bg-white/95 px-4 py-3 shadow-[0_12px_36px_rgba(15,23,42,0.14)] backdrop-blur-md dark:border-[#2d3d63] dark:bg-[#0c1426]/95">
                  <div className="space-y-1.5 text-[12px] font-medium">
                    {/* Best Case with bright Lime/Yellow highlight badge */}
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-block rounded-md bg-[#eef880] px-2 py-0.5 font-bold text-[#1a2e05] shadow-xs">
                        Best Case &rarr; {activePinPoint.best_case_str}
                      </span>
                    </div>

                    {/* Most Likely */}
                    <div className="flex items-center justify-between gap-3 text-[#334155] dark:text-[#cbd5e1] px-1">
                      <span>Most likely &rarr;</span>
                      <span className="font-bold text-[#0f172a] dark:text-white">
                        {activePinPoint.most_likely_str}
                      </span>
                    </div>

                    {/* Worst Case */}
                    <div className="flex items-center justify-between gap-3 text-[#64748b] dark:text-[#94a3b8] px-1">
                      <span>Worst case &rarr;</span>
                      <span className="font-semibold text-[#475569] dark:text-[#cbd5e1]">
                        {activePinPoint.worst_case_str}
                      </span>
                    </div>
                  </div>

                  {/* Vertical Hairline Pin pointing down to the data point */}
                  <div className="absolute -bottom-8 left-1/2 h-8 w-[1.5px] -translate-x-1/2 bg-[#0f172a] dark:bg-white" />
                  {/* Dot on the end of pin */}
                  <div className="absolute -bottom-8 left-1/2 size-2.5 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-white bg-[#0f172a] shadow-xs dark:border-[#0c1426] dark:bg-white" />
                </div>
              </div>
            )}

            {/* Recharts Dual-Line Chart */}
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 25, left: 0, bottom: 10 }}
                onClick={(e: any) => {
                  if (e && e.activeTooltipIndex !== undefined) {
                    const idx = Number(e.activeTooltipIndex);
                    if (idx > dividerIdx) {
                      setSelectedPointIndex(idx);
                    }
                  }
                }}
              >
                <defs>
                  {/* Subtle Blue Fill under historical Incremental curve */}
                  <linearGradient id="histBlueArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0066FF" stopOpacity={0.28} />
                    <stop offset="85%" stopColor="#0066FF" stopOpacity={0.03} />
                    <stop offset="100%" stopColor="#0066FF" stopOpacity={0.0} />
                  </linearGradient>

                  {/* Prediction Band Gradient (Blue to Pale Lime/Yellow as in reference image) */}
                  <linearGradient id="incPredictionBand" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#93c5fd" stopOpacity={0.45} />
                    <stop offset="50%" stopColor="#bae6fd" stopOpacity={0.4} />
                    <stop offset="85%" stopColor="#d9f99d" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#fef08a" stopOpacity={0.25} />
                  </linearGradient>

                  {/* Faint baseline confidence band */}
                  <linearGradient id="basePredictionBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#094339" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#094339" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                {/* Horizontal reference grid lines at ₹0M, ₹10M, ₹20M */}
                <CartesianGrid
                  vertical={false}
                  stroke="#e2e8f0"
                  strokeOpacity={0.7}
                  className="dark:stroke-[#1e293b]"
                />

                {/* X Axis with Month names */}
                <XAxis
                  dataKey="period"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                  dy={6}
                />

                {/* Y Axis with standard Rupee Notation: ₹0M, ₹10M, ₹20M, ₹30M */}
                <YAxis
                  domain={[0, 30]}
                  ticks={[0, 10, 20]}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val: number) => `₹${val}M`}
                  tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }}
                  width={50}
                />

                {/* Vertical Divider Line: Historical vs Forecast (At month 3 boundary) */}
                <ReferenceLine
                  x={chartData[dividerIdx]?.period || 'Aug'}
                  stroke="#475569"
                  strokeWidth={1.5}
                  label={{
                    value: 'TODAY | FORECAST',
                    position: 'top',
                    fill: '#64748b',
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                  }}
                />

                {/* 1. Historical Shaded Area underneath Incremental Line (Left of divider) */}
                <Area
                  type="monotone"
                  dataKey="histIncArea"
                  fill="url(#histBlueArea)"
                  stroke="none"
                  isAnimationActive={false}
                />

                {/* 2. Confidence Band for Incremental Forecast (Right of divider) */}
                <Area
                  type="monotone"
                  dataKey="incBand"
                  fill="url(#incPredictionBand)"
                  stroke="none"
                  isAnimationActive={false}
                />

                {/* 3. Faint confidence band for Baseline */}
                <Area
                  type="monotone"
                  dataKey="baseBand"
                  fill="url(#basePredictionBand)"
                  stroke="none"
                  isAnimationActive={false}
                />

                {/* ================= HISTORICAL LINES (SOLID) ================= */}
                {/* Historical Incremental: Solid Bold Blue Line */}
                <Line
                  type="monotone"
                  dataKey="historical_incremental"
                  stroke="#0066FF"
                  strokeWidth={3.8}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />

                {/* Historical Baseline: Solid Dark Green Line */}
                <Line
                  type="monotone"
                  dataKey="historical_baseline"
                  stroke="#094339"
                  strokeWidth={2.0}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />

                {/* ================= FORECAST LINES (DASHED) ================= */}
                {/* Forecast Incremental: Dashed Blue Line */}
                <Line
                  type="monotone"
                  dataKey="incremental"
                  stroke="#0066FF"
                  strokeWidth={2.4}
                  strokeDasharray="5 5"
                  dot={(props: any) => {
                    const { cx, cy, index } = props;
                    // Put prominent black dot on the active peak point
                    if (index === selectedPointIndex) {
                      return (
                        <circle
                          key={`dot-${index}`}
                          cx={cx}
                          cy={cy}
                          r={4.5}
                          fill="#0f172a"
                          stroke="#ffffff"
                          strokeWidth={2}
                          className="drop-shadow-sm cursor-pointer"
                        />
                      );
                    }
                    return null;
                  }}
                  isAnimationActive={false}
                />

                {/* Forecast Baseline: Dashed Dark Green Line */}
                <Line
                  type="monotone"
                  dataKey="baseline"
                  stroke="#094339"
                  strokeWidth={2.0}
                  strokeDasharray="5 5"
                  dot={false}
                  isAnimationActive={false}
                />

                {/* Interactive Tooltip on hover */}
                <Tooltip
                  cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const pt = payload[0]?.payload as ForecastDataPoint & { index: number };
                    if (!pt) return null;

                    return (
                      <div className="rounded-xl border border-[#e2e8f0] bg-white/95 p-3 text-[11px] shadow-xl backdrop-blur-md dark:border-[#2d3d63] dark:bg-[#0c1426]/95">
                        <div className="mb-1.5 flex items-center justify-between gap-4 font-bold text-[#0f172a] dark:text-white">
                          <span>{pt.period_full || pt.period}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider ${
                              pt.is_forecast
                                ? 'bg-[#edf2ff] text-[#0066FF] dark:bg-[#0066FF]/20 dark:text-[#82a3ff]'
                                : 'bg-[#f1f5f9] text-[#64748b] dark:bg-[#1e293b] dark:text-[#94a3b8]'
                            }`}
                          >
                            {pt.is_forecast ? 'AI Forecast' : 'Historical Actual'}
                          </span>
                        </div>

                        {pt.is_forecast ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-4 font-medium">
                              <span className="flex items-center gap-1.5 text-[#0066FF]">
                                <span className="size-2 rounded-full bg-[#0066FF]" />
                                Incremental (Simulated):
                              </span>
                              <strong className="text-[12px]">{pt.most_likely_str}</strong>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-[#64748b]">
                              <span>Best Case (Upper Bound):</span>
                              <span className="font-semibold text-[#166534]">
                                {pt.best_case_str}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-[#64748b]">
                              <span>Worst Case (Lower Bound):</span>
                              <span className="font-semibold text-[#991b1b]">
                                {pt.worst_case_str}
                              </span>
                            </div>
                            <div className="mt-1.5 border-t border-[#f1f5f9] pt-1.5 flex items-center justify-between gap-4 text-[#094339] dark:text-[#34d399] font-medium">
                              <span className="flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-[#094339]" />
                                Baseline (Do Nothing):
                              </span>
                              <strong>₹{pt.baseline}M</strong>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[#0066FF]">Incremental Revenue:</span>
                              <strong>₹{pt.historical_incremental}M</strong>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[#094339] dark:text-[#34d399]">
                                Baseline Revenue:
                              </span>
                              <strong>₹{pt.historical_baseline}M</strong>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom Card Summary Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[#f1f5f9] pt-4 text-[11px] text-[#64748b] dark:border-[#1e293b] dark:text-[#94a3b8]">
            <div className="flex items-center gap-4">
              <span>
                <strong className="text-[#0f172a] dark:text-white">Historical:</strong> May &ndash; Aug
              </span>
              <span>&bull;</span>
              <span>
                <strong className="text-[#0066FF]">Forecast Horizon:</strong> 6 Months (Sep &ndash; Feb)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#10b981]" />
              <span>90% Confidence Interval Envelopes</span>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* RIGHT CARD: What-If Simulator & Dynamic Controls          */}
        {/* ========================================================= */}
        <section className="flex flex-col justify-between rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.04)] dark:border-[#1e293b] dark:bg-[#101a31] transition-all">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[17px] font-bold tracking-[-0.02em] text-[#0f172a] dark:text-white flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-[#0066FF]" />
                  What-If Simulator
                </h2>
                <p className="mt-1 text-[11px] text-[#64748b] dark:text-[#94a3b8]">
                  Adjust parameters to simulate dynamic business performance.
                </p>
              </div>

              {/* Reset to 0% button */}
              <button
                onClick={() => applyPreset(0, 0, 0)}
                className="rounded-lg border border-[#e2e8f0] px-2.5 py-1 text-[10px] font-semibold text-[#64748b] hover:bg-[#f8fafc] dark:border-[#2d3d63] dark:text-[#94a3b8] dark:hover:bg-[#162340]"
                title="Reset simulation to baseline (0%)"
              >
                Reset
              </button>
            </div>

            {/* Quick Scenario Preset Chips */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {[
                { label: 'Baseline (0%)', price: 0, mkt: 0 },
                { label: 'Recommended (+10%)', price: 10, mkt: 0 },
                { label: 'Aggressive (+20%)', price: 20, mkt: 10 },
                { label: 'Discount (-10%)', price: -10, mkt: 15 },
              ].map((preset) => {
                const isActive =
                  priceChange === preset.price && marketingSpend === preset.mkt;
                return (
                  <button
                    key={preset.label}
                    onClick={() => applyPreset(preset.price, preset.mkt, 0)}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-all ${
                      isActive
                        ? 'bg-[#0066FF] text-white shadow-xs'
                        : 'border border-[#e2e8f0] bg-[#f8fafc] text-[#475569] hover:border-[#0066FF] hover:text-[#0066FF] dark:border-[#2d3d63] dark:bg-[#162340] dark:text-[#cbd5e1]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Sliders Container */}
            <div className="mt-6 space-y-5">
              {/* Primary Slider: Price Adjustment (-20% to +30%) */}
              <div className="rounded-xl border border-[#e2e8f0]/80 bg-[#f8fafc] p-4 dark:border-[#1e293b] dark:bg-[#0c1426]">
                <div className="mb-2 flex items-center justify-between text-[12px] font-semibold">
                  <span className="flex items-center gap-1.5 text-[#0f172a] dark:text-white">
                    <span>Price Adjustment</span>
                    <span className="text-[10px] font-normal text-[#64748b] dark:text-[#94a3b8]">
                      (Primary Driver)
                    </span>
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[12px] font-bold ${
                      priceChange > 0
                        ? 'bg-[#dcfce7] text-[#15803d]'
                        : priceChange < 0
                        ? 'bg-[#fee2e2] text-[#b91c1c]'
                        : 'bg-[#f1f5f9] text-[#475569]'
                    }`}
                  >
                    {priceChange > 0 ? '+' : ''}
                    {priceChange}%
                  </span>
                </div>

                <input
                  type="range"
                  min="-20"
                  max="30"
                  step="1"
                  value={priceChange}
                  onChange={(e) => handlePriceChange(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#e2e8f0] accent-[#0066FF] dark:bg-[#1e293b]"
                />

                <div className="mt-1.5 flex justify-between text-[10px] font-medium text-[#94a3b8]">
                  <span>-20% (Discount)</span>
                  <span className="font-semibold text-[#64748b]">0% (Baseline)</span>
                  <span>+30% (Premium)</span>
                </div>
              </div>

              {/* Secondary Slider: Marketing Spend Expansion (0% to +40%) */}
              <div>
                <div className="mb-2 flex items-center justify-between text-[12px] font-semibold">
                  <span className="text-[#334155] dark:text-[#cbd5e1]">
                    Marketing Spend Increase
                  </span>
                  <span className="text-[#0066FF] font-bold">+{marketingSpend}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="2"
                  value={marketingSpend}
                  onChange={(e) => handleMarketingChange(Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#e2e8f0] accent-[#0066FF] dark:bg-[#1e293b]"
                />
                <div className="mt-1 flex justify-between text-[9px] text-[#94a3b8]">
                  <span>0%</span>
                  <span>+40%</span>
                </div>
              </div>

              {/* Tertiary Slider: Operational / Supplier Delay (0 to 14 days) */}
              <div>
                <div className="mb-2 flex items-center justify-between text-[12px] font-semibold">
                  <span className="text-[#334155] dark:text-[#cbd5e1]">
                    Supplier Delay Buffer
                  </span>
                  <span
                    className={
                      supplierDelay > 0 ? 'text-[#b45309] font-bold' : 'text-[#64748b]'
                    }
                  >
                    {supplierDelay} days
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="14"
                  step="1"
                  value={supplierDelay}
                  onChange={(e) => handleDelayChange(Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#e2e8f0] accent-[#f59e0b] dark:bg-[#1e293b]"
                />
                <div className="mt-1 flex justify-between text-[9px] text-[#94a3b8]">
                  <span>0 days</span>
                  <span>14 days</span>
                </div>
              </div>
            </div>

            {/* Impact Metric Cards */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {/* Incremental Total Forecast */}
              <div className="rounded-xl border border-[#dbeafe] bg-[#eff6ff] p-3.5 dark:border-[#1e3a8a] dark:bg-[#172554]/40">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#1e40af] dark:text-[#93c5fd]">
                  Projected Revenue
                </p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-[22px] font-extrabold tracking-tight text-[#1e3a8a] dark:text-white">
                    {summary?.incremental_total_str || '₹68.2M'}
                  </span>
                  <span className="text-[10px] text-[#3b82f6]">6-mo total</span>
                </div>
              </div>

              {/* Net Incremental Lift */}
              <div
                className={`rounded-xl border p-3.5 ${
                  (summary?.net_incremental_lift ?? 0) >= 0
                    ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#166534] dark:border-[#166534] dark:bg-[#052e16]/40 dark:text-[#86efac]'
                    : 'border-[#fecaca] bg-[#fef2f2] text-[#991b1b] dark:border-[#991b1b] dark:bg-[#450a0a]/40 dark:text-[#fca5a5]'
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#15803d] dark:text-[#86efac]">
                  Incremental Lift
                </p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-[22px] font-extrabold tracking-tight">
                    {summary?.lift_str || '+₹11.8M'}
                  </span>
                  <span className="text-[10px] font-semibold">
                    ({(summary?.lift_percentage ?? 0) >= 0 ? '+' : ''}
                    {summary?.lift_percentage || 20.9}%)
                  </span>
                </div>
              </div>
            </div>

            {/* AI Narrative Intelligence Box */}
            <div className="mt-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 dark:border-[#1e293b] dark:bg-[#0c1426]">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0f172a] dark:text-white">
                <Bot size={14} className="text-[#0066FF]" />
                <span>AI Predictive Model Explanation</span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#475569] dark:text-[#94a3b8]">
                {summary?.ai_narrative ||
                  'Adjusting price drives incremental performance based on empirical price elasticity (-0.42). Dynamic model updates both the Incremental path and confidence intervals.'}
              </p>
            </div>
          </div>

          {/* Connected Backend Indicator */}
          <div className="mt-5 flex items-center justify-between border-t border-[#f1f5f9] pt-3 text-[10px] text-[#94a3b8] dark:border-[#1e293b]">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#10b981]" />
              FastAPI AI Predictive Engine
            </span>
            <span>Elasticity &epsilon; = -0.42</span>
          </div>
        </section>
      </div>
    </div>
  );
}
