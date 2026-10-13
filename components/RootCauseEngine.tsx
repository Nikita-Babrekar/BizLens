'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Database,
  Download,
  Layers,
  LineChart as LineChartIcon,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  TrendingDown,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useDataset } from '@/context/DatasetContext';
import {
  fetchActiveRootCause,
  fetchRootCause,
  RootCauseNode,
  RootCauseResponse,
} from '@/lib/api';

const TONE_COLORS: Record<string, { fill: string; stroke: string; dot: string; text: string }> = {
  red:   { fill: '#fff0ee', stroke: '#ef6357', dot: '#ef6357', text: '#c0392b' },
  amber: { fill: '#fffbeb', stroke: '#d59a2e', dot: '#d59a2e', text: '#92650a' },
  green: { fill: '#edfaf3', stroke: '#18a46a', dot: '#18a46a', text: '#0e7a4e' },
  blue:  { fill: '#edf2ff', stroke: '#315efb', dot: '#315efb', text: '#1a3fbf' },
  gray:  { fill: '#f5f7fa', stroke: '#b0bad0', dot: '#b0bad0', text: '#6b7a94' },
};

interface RootCauseEngineProps {
  notify: (s: string) => void;
  onGoToIngestion?: () => void;
}

export default function RootCauseEngine({ notify, onGoToIngestion }: RootCauseEngineProps) {
  const { uploadedData } = useDataset();
  const [data, setData] = useState<RootCauseResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeSegmentFilter, setActiveSegmentFilter] = useState<string>('All');

  // Load root cause data dynamically when component mounts or uploaded dataset changes
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        let result: RootCauseResponse | null = null;
        if (uploadedData) {
          try {
            // First attempt to read from active server session using dataset_id
            result = await fetchActiveRootCause(uploadedData.dataset_id ?? undefined);
          } catch {
            // Fallback: post preview rows if active dataset cache missed
            if (uploadedData.preview && uploadedData.preview.length > 0) {
              result = await fetchRootCause({
                data: uploadedData.preview,
                dataset_id: uploadedData.dataset_id ?? undefined,
              });
            }
          }
        } else {
          // If no uploaded dataset yet, attempt to get active backend session or fallback
          try {
            result = await fetchActiveRootCause();
          } catch {
            // Session empty; fall back to default demo simulation
            result = null;
          }
        }

        if (isMounted) {
          setData(result);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load dynamic root-cause insights');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [uploadedData]);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      let res: RootCauseResponse | null = null;
      if (uploadedData) {
        res = await fetchActiveRootCause(uploadedData.dataset_id ?? undefined);
      } else {
        res = await fetchActiveRootCause();
      }
      setData(res);
      notify('Root-cause analysis refreshed successfully');
    } catch (err: any) {
      setError(err?.message || 'Error refreshing root-cause data');
    } finally {
      setLoading(false);
    }
  };

  // Fallback default nodes if no dataset is active yet
  const displayData: RootCauseResponse = useMemo(() => {
    if (data) return data;
    return {
      summary: {
        title: 'Revenue dropped 24.5% between Aug 10 to Aug 17',
        severity: 'Critical anomaly',
        drop_or_spike_percentage: -24.5,
        period_start: 'Aug 10',
        period_end: 'Aug 17',
        confidence: 92.0,
        explanation:
          'BizLens traced the signal through 4 connected dimensions with 92% confidence.',
      },
      nodes: [
        { id: 'root', x: 620, y: 220, label: 'Revenue −24.5%', sub: 'Root anomaly', dimension: 'anomaly', contribution: 100, confidence: null, tone: 'red' },
        { id: 'region', x: 390, y: 120, label: 'North America', sub: 'Region dimension', dimension: 'region', contribution: 48, confidence: 94, tone: 'blue' },
        { id: 'product', x: 390, y: 280, label: 'Leather Jackets', sub: 'Inventory driver', dimension: 'product', contribution: 34, confidence: 91, tone: 'amber' },
        { id: 'other', x: 390, y: 420, label: 'Other Segments', sub: 'Minor contributors', dimension: 'general', contribution: 18, confidence: 76, tone: 'gray' },
        { id: 'stock', x: 155, y: 120, label: 'Out of Stock', sub: 'Inventory event', dimension: 'stock', contribution: 41, confidence: 93, tone: 'amber' },
        { id: 'supplier', x: 155, y: 300, label: 'Supplier Delay', sub: 'Root cause · 12 days', dimension: 'supplier', contribution: 72, confidence: 89, tone: 'green' },
      ],
      edges: [
        { from: 'region', to: 'root' },
        { from: 'product', to: 'root' },
        { from: 'other', to: 'root' },
        { from: 'stock', to: 'region' },
        { from: 'stock', to: 'product' },
        { from: 'supplier', to: 'stock' },
        { from: 'supplier', to: 'product' },
      ],
      line_graph: [
        { date: 'Jul 27', actual: 44000, baseline: 42000, is_anomaly: false },
        { date: 'Aug 03', actual: 46500, baseline: 44000, is_anomaly: false },
        { date: 'Aug 10', actual: 35100, baseline: 45000, is_anomaly: true },
        { date: 'Aug 17', actual: 34000, baseline: 45500, is_anomaly: true },
        { date: 'Aug 24', actual: 42000, baseline: 44000, is_anomaly: false },
        { date: 'Aug 31', actual: 48500, baseline: 45000, is_anomaly: false },
      ],
      analyzed_dimensions: ['Region', 'Product', 'Stock Level'],
      total_revenue_impact: 22400,
      meta: { simulated: true },
    };
  }, [data]);

  const nodes = displayData.nodes;
  const edges = displayData.edges;
  const nodeMap = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);
  const selNode = selectedNodeId ? nodeMap[selectedNodeId] : null;

  const W = 800;
  const H = 540;
  const NW = 158;
  const NH = 78;

  function edgePath(from: RootCauseNode, to: RootCauseNode) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const sx = from.x + (dx / len) * (NW / 2 + 4);
    const sy = from.y + (dy / len) * (NH / 2 + 2);
    const ex = to.x - (dx / len) * (NW / 2 + 8);
    const ey = to.y - (dy / len) * (NH / 2 + 2);
    const mx = (sx + ex) / 2;
    return `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ey}, ${ex} ${ey}`;
  }

  function isConnected(nodeId: string) {
    if (!selectedNodeId) return false;
    return edges.some(
      (e) =>
        (e.from === nodeId && e.to === selectedNodeId) ||
        (e.to === nodeId && e.from === selectedNodeId)
    );
  }

  const isRealData = Boolean(uploadedData && data);

  return (
    <div className="space-y-6">
      {/* ── Page Header Controls ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[.15em] text-[#728097] dark:text-[#8e9bb5]">
              Investigation workspace
            </span>
            {isRealData ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f8f0] px-2 py-0.5 text-[9px] font-semibold text-[#14885c] dark:bg-[#10b981]/20 dark:text-[#34d399]">
                <Zap size={10} /> Live Dataset: {uploadedData?.filename}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[9px] font-medium text-[#64748b] dark:bg-[#1e293b] dark:text-[#94a3b8]">
                Demo Baseline Simulation
              </span>
            )}
          </div>
          <h1 className="text-[25px] font-semibold tracking-[-.04em] text-[#15213a] dark:text-white">
            Root-cause engine
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onGoToIngestion && !uploadedData && (
            <button
              onClick={onGoToIngestion}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#315efb] bg-[#edf2ff] px-3 py-2 text-[11px] font-semibold text-[#315efb] hover:bg-[#dfe8ff] dark:bg-[#315efb]/20 dark:text-[#82a3ff] transition"
            >
              <Upload size={13} /> Upload your data
            </button>
          )}

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#e1e5ed] bg-white px-3 py-2 text-[11px] font-semibold text-[#69758c] hover:border-[#315efb] hover:text-[#315efb] dark:border-[#1e293b] dark:bg-[#101a31] dark:text-[#94a3b8] transition"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => notify('Investigation evidence graph exported')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#315efb] px-3 py-2 text-[11px] font-semibold text-white shadow-sm hover:bg-[#254edb] transition"
          >
            <Download size={13} />
            <span>Export evidence</span>
          </button>
        </div>
      </div>

      {/* ── Anomaly Alert Banner ── */}
      <div className="rounded-xl border border-[#f3c7c1] bg-[#fff8f7] p-5 dark:border-[#ef4444]/30 dark:bg-[#ef4444]/10 transition-colors">
        <div className="flex items-start gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#ffe4e0] text-[#df5d51] dark:bg-[#ef4444]/20 dark:text-[#f87171]">
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[14px] font-semibold text-[#1a2540] dark:text-white">
                {displayData.summary.title}
              </h2>
              <span className="inline-flex items-center rounded-md bg-[#fff0ee] px-2 py-0.5 text-[10px] font-semibold text-[#d65347] dark:bg-[#ef4444]/20 dark:text-[#f87171]">
                {displayData.summary.severity}
              </span>
              {loading && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[#315efb]">
                  <Loader2 size={12} className="animate-spin" /> Analyzing uploaded dataset...
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-[#8d7370] dark:text-[#cbd5e1]">
              {displayData.summary.explanation}
            </p>
          </div>
          <button
            onClick={() => notify('Dismissed banner notification')}
            className="text-[#a18a87] hover:text-[#1a2540] dark:text-[#94a3b8]"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Segment Quick Filters ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[11px] font-semibold text-[#728097] dark:text-[#8e9bb5]">
          Segment by
        </span>
        {['All', 'Region', 'Product', 'Stock'].map((segment) => (
          <button
            key={segment}
            onClick={() => setActiveSegmentFilter(segment)}
            className={`whitespace-nowrap rounded-md border px-3 py-1.5 text-[10px] font-semibold transition ${
              activeSegmentFilter === segment
                ? 'border-[#315efb] bg-[#edf2ff] text-[#315efb] dark:bg-[#315efb]/20 dark:text-[#82a3ff]'
                : 'border-[#e0e5ee] bg-white text-[#536079] hover:border-[#c2cce0] dark:border-[#1e293b] dark:bg-[#101a31] dark:text-[#94a3b8]'
            }`}
          >
            {segment}: Active
          </button>
        ))}
      </div>

      {/* ── Evidence Graph Card ── */}
      <section className="rounded-xl border border-[#e3e7ef] bg-white p-5 shadow-[0_1px_2px_rgba(24,35,58,.03)] dark:border-[#1e293b] dark:bg-[#101a31] transition-colors">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-[#15213a] dark:text-white">
                Evidence graph
              </h2>
              <span className="inline-flex items-center rounded-md bg-[#edf2ff] px-2 py-0.5 text-[10px] font-semibold text-[#315efb] dark:bg-[#315efb]/20 dark:text-[#82a3ff]">
                Dynamic Contribution Flow
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#8791a5] dark:text-[#94a3b8]">
              Traces actual data contributors (root cause factors, product lines, regional dips) directly into the anomaly.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-[#e7f8f0] px-2 py-1 text-[10px] font-semibold text-[#14885c] dark:bg-[#10b981]/20 dark:text-[#34d399]">
              {displayData.summary.confidence}% confidence
            </span>
          </div>
        </div>

        {/* ── SVG Directed Graph Canvas ── */}
        <div className="space-y-4">
          <div className="relative overflow-x-auto rounded-xl border border-[#e8ecf5] bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] dark:border-[#1e293b] dark:bg-[#0c1426] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)]">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full transition-all"
              style={{ minWidth: 640 }}
            >
              <defs>
                {Object.entries(TONE_COLORS).map(([tone, c]) => (
                  <marker
                    key={tone}
                    id={`arrow-${tone}`}
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L0,6 L8,3 z" fill={c.stroke} />
                  </marker>
                ))}
              </defs>

              {/* ── Edges ── */}
              {edges.map((e, i) => {
                const fn = nodeMap[e.from];
                const tn = nodeMap[e.to];
                if (!fn || !tn) return null;
                const tc = TONE_COLORS[fn.tone] || TONE_COLORS.gray;
                const active = selectedNodeId === e.from || selectedNodeId === e.to;
                const faded = Boolean(selectedNodeId && !active);
                return (
                  <path
                    key={i}
                    d={edgePath(fn, tn)}
                    fill="none"
                    stroke={active ? tc.stroke : '#cbd5e1'}
                    strokeWidth={active ? 2.4 : 1.6}
                    strokeDasharray={fn.dimension === 'supplier' || fn.dimension === 'stock' ? '5 3' : undefined}
                    markerEnd={`url(#arrow-${active ? fn.tone : 'gray'})`}
                    opacity={faded ? 0.25 : 1}
                    className="transition-all duration-200"
                  />
                );
              })}

              {/* ── Edge Contribution Badges ── */}
              {edges.map((e, i) => {
                const fn = nodeMap[e.from];
                const tn = nodeMap[e.to];
                if (!fn || !tn) return null;
                const mx = (fn.x + tn.x) / 2;
                const my = (fn.y + tn.y) / 2;
                const active = selectedNodeId === e.from || selectedNodeId === e.to;
                const faded = Boolean(selectedNodeId && !active);
                const tc = TONE_COLORS[fn.tone] || TONE_COLORS.gray;
                return (
                  <g
                    key={`lbl-${i}`}
                    opacity={faded ? 0.15 : 1}
                    className="transition-all duration-200"
                  >
                    <rect
                      x={mx - 17}
                      y={my - 9}
                      width={34}
                      height={17}
                      rx={4}
                      fill="white"
                      stroke="#dde3ef"
                      strokeWidth={0.8}
                    />
                    <text
                      x={mx}
                      y={my + 4}
                      textAnchor="middle"
                      fontSize={9}
                      fontWeight={700}
                      fill={tc.text}
                    >
                      {fn.contribution}%
                    </text>
                  </g>
                );
              })}

              {/* ── Nodes ── */}
              {nodes.map((n) => {
                const c = TONE_COLORS[n.tone] || TONE_COLORS.gray;
                const isSelected = selectedNodeId === n.id;
                const isConn = isConnected(n.id);
                const isFaded = Boolean(selectedNodeId && !isSelected && !isConn);
                const barW = NW - 22;

                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x - NW / 2}, ${n.y - NH / 2})`}
                    onClick={() => setSelectedNodeId(isSelected ? null : n.id)}
                    className="cursor-pointer select-none"
                    opacity={isFaded ? 0.35 : 1}
                    style={{ transition: 'opacity .2s' }}
                  >
                    {/* Shadow */}
                    <rect
                      x={2}
                      y={3}
                      width={NW}
                      height={NH}
                      rx={11}
                      fill="rgba(0,0,0,.08)"
                    />
                    {/* Card Container */}
                    <rect
                      width={NW}
                      height={NH}
                      rx={11}
                      fill={isSelected ? c.stroke : c.fill}
                      stroke={c.stroke}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                    {/* Dot */}
                    <circle
                      cx={14}
                      cy={17}
                      r={5}
                      fill={isSelected ? 'white' : c.dot}
                    />
                    {/* Main Label */}
                    <text
                      x={25}
                      y={21}
                      fontSize={11}
                      fontWeight={700}
                      fill={isSelected ? 'white' : '#1a2540'}
                    >
                      {n.label}
                    </text>
                    {/* Subtitle */}
                    <text
                      x={11}
                      y={36}
                      fontSize={9}
                      fill={isSelected ? 'rgba(255,255,255,.8)' : '#64748b'}
                    >
                      {n.sub}
                    </text>
                    {/* Divider */}
                    <line
                      x1={11}
                      y1={45}
                      x2={NW - 11}
                      y2={45}
                      stroke={isSelected ? 'rgba(255,255,255,.3)' : '#e2e8f0'}
                      strokeWidth={1}
                    />
                    {/* Progress Bar Track */}
                    <rect
                      x={11}
                      y={53}
                      width={barW}
                      height={5}
                      rx={2.5}
                      fill={isSelected ? 'rgba(255,255,255,.25)' : '#e2e8f0'}
                    />
                    {/* Progress Bar Fill */}
                    <rect
                      x={11}
                      y={53}
                      width={(barW * n.contribution) / 100}
                      height={5}
                      rx={2.5}
                      fill={isSelected ? 'white' : c.dot}
                    />
                    {/* Stat Meta */}
                    <text
                      x={11}
                      y={70}
                      fontSize={9}
                      fontWeight={700}
                      fill={isSelected ? 'rgba(255,255,255,.9)' : c.text}
                    >
                      {n.contribution}% contribution
                      {n.confidence ? ` · ${n.confidence}% conf.` : ''}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* ── Selected Node Detail Panel ── */}
          {selNode && (
            <div
              className="rounded-xl border p-4 transition-all"
              style={{
                borderColor: (TONE_COLORS[selNode.tone] || TONE_COLORS.gray).stroke,
                background: (TONE_COLORS[selNode.tone] || TONE_COLORS.gray).fill,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: (TONE_COLORS[selNode.tone] || TONE_COLORS.gray).text }}
                  >
                    {selNode.sub} · Dimension: {selNode.dimension}
                  </p>
                  <h3 className="mt-0.5 text-[16px] font-semibold text-[#1a2540]">
                    {selNode.label}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="text-[#94a3b8] hover:text-[#1a2540]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-white/80 p-2.5 dark:bg-black/20">
                  <p className="text-[9px] uppercase tracking-wider text-[#8791a5]">
                    Contribution
                  </p>
                  <p
                    className="mt-1 text-[17px] font-bold"
                    style={{ color: (TONE_COLORS[selNode.tone] || TONE_COLORS.gray).text }}
                  >
                    {selNode.contribution}%
                  </p>
                </div>

                {selNode.confidence && (
                  <div className="rounded-lg bg-white/80 p-2.5 dark:bg-black/20">
                    <p className="text-[9px] uppercase tracking-wider text-[#8791a5]">
                      Confidence
                    </p>
                    <p className="mt-1 text-[17px] font-bold text-[#1a2540] dark:text-white">
                      {selNode.confidence}%
                    </p>
                  </div>
                )}

                {selNode.impact_amount !== undefined && selNode.impact_amount !== null && (
                  <div className="rounded-lg bg-white/80 p-2.5 dark:bg-black/20">
                    <p className="text-[9px] uppercase tracking-wider text-[#8791a5]">
                      Estimated Impact
                    </p>
                    <p className="mt-1 text-[17px] font-bold text-[#ef4444]">
                      −₹{selNode.impact_amount.toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="rounded-lg bg-white/80 p-2.5 dark:bg-black/20">
                  <p className="text-[9px] uppercase tracking-wider text-[#8791a5]">
                    Connected To
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-[#1a2540] dark:text-white truncate">
                    {edges
                      .filter((e) => e.from === selNode.id)
                      .map((e) => nodeMap[e.to]?.label || e.to)
                      .join(', ') || 'Root Anomaly'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Legend ── */}
          <div className="flex flex-wrap items-center gap-4 text-[10px] text-[#7c89a3] dark:text-[#94a3b8]">
            <span className="font-semibold text-[#4f5c72] dark:text-white">Legend:</span>
            {[
              ['red', 'Root anomaly signal'],
              ['amber', 'Inventory / product driver'],
              ['blue', 'Regional dimension'],
              ['green', 'Upstream root cause'],
              ['gray', 'Secondary factor'],
            ].map(([t, l]) => (
              <span key={t} className="flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-full inline-block"
                  style={{ background: TONE_COLORS[t].dot }}
                />
                {l}
              </span>
            ))}
            <span className="ml-auto italic opacity-70">
              Click any node to isolate its causal path
            </span>
          </div>
        </div>
      </section>

      {/* ── Line Graph: Anomaly Timeline & Trend Analysis ── */}
      <section className="rounded-xl border border-[#e3e7ef] bg-white p-5 shadow-[0_1px_2px_rgba(24,35,58,.03)] dark:border-[#1e293b] dark:bg-[#101a31] transition-colors">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <LineChartIcon size={16} className="text-[#315efb]" />
              <h2 className="text-[15px] font-semibold text-[#15213a] dark:text-white">
                Revenue signal timeline & anomaly window
              </h2>
            </div>
            <p className="mt-1 text-[11px] text-[#8791a5] dark:text-[#94a3b8]">
              Line graph showing actual revenue trajectory against expected baseline. Shaded points indicate detected anomaly periods.
            </p>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-medium text-[#64748b] dark:text-[#94a3b8]">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#315efb]" /> Actual revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#94a3b8]" /> Expected baseline
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#ef4444]" /> Anomaly dip
            </span>
          </div>
        </div>

        <div className="h-[280px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={displayData.line_graph}
              margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid vertical={false} stroke="#edf0f5" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#8c98a9' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#8c98a9' }}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-[#e2e8f0] bg-white p-3 shadow-lg dark:border-[#1e293b] dark:bg-[#0c1426]">
                        <p className="text-[11px] font-bold text-[#15213a] dark:text-white">
                          {label}
                        </p>
                        <p className="mt-1 text-[11px] text-[#315efb]">
                          Actual Revenue: ₹{Number(row.actual).toLocaleString()}
                        </p>
                        {row.baseline && (
                          <p className="text-[11px] text-[#64748b]">
                            Expected Baseline: ₹{Number(row.baseline).toLocaleString()}
                          </p>
                        )}
                        {row.is_anomaly && (
                          <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[#ef4444]">
                            <AlertTriangle size={11} /> Flagged Anomaly Period
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Baseline curve */}
              <Line
                type="monotone"
                dataKey="baseline"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                name="Baseline"
              />
              {/* Actual revenue curve */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#315efb"
                strokeWidth={2.5}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.is_anomaly) {
                    return (
                      <circle
                        key={cx}
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill="#ef4444"
                        stroke="white"
                        strokeWidth={2}
                      />
                    );
                  }
                  return (
                    <circle
                      key={cx}
                      cx={cx}
                      cy={cy}
                      r={3.5}
                      fill="#315efb"
                    />
                  );
                }}
                name="Actual"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

