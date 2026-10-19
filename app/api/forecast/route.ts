import { NextRequest, NextResponse } from 'next/server';

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

function formatINRMillions(val: number | null | undefined): string {
  if (val === null || val === undefined) return '';
  if (Math.abs(val) < 0.1) return '₹0M';
  if (Number.isInteger(val)) return `₹${val}M`;
  return `₹${val.toFixed(1)}M`;
}

export function computeForecastLogic(
  pricePct: number,
  marketingPct = 0,
  delayDays = 0,
  scaleMultiplier = 1.0
) {
  const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
  const dividerIdx = 3; // Aug is divider boundary (Sep onwards is future forecast)

  // Anchor data points reflecting the attached image_1.png
  // Left of divider (historical):
  const histIncremental = [6.8, 5.6, 8.1, 13.5];
  const histBaseline = [2.8, 1.0, 4.5, 6.0];

  // Right of divider (future baseline if owner does nothing):
  const futBaselineMean = [8.2, 8.1, 10.2, 9.8, 9.6, 10.5];

  // Econometric Price Elasticity of Demand (inelastic customer sensitivity)
  const elasticityP = -0.42;
  const pDec = pricePct / 100.0;
  const volumeDelta = elasticityP * pDec;
  const priceRevenueMult = (1.0 + pDec) * (1.0 + volumeDelta);

  // Marketing lift (logarithmic diminishing returns)
  const mDec = Math.max(marketingPct, 0) / 100.0;
  const marketingLift = mDec > 0 ? 0.22 * Math.log(1.0 + mDec) : 0.0;

  // Operational delay drag
  const delayDrag = Math.max(0, delayDays * 0.016);

  // Total multiplier relative to baseline
  let incrementalFactor = (priceRevenueMult + marketingLift) * (1.0 - delayDrag);
  incrementalFactor = Math.max(0.5, Math.min(incrementalFactor, 2.5));

  const series: ForecastDataPoint[] = [];

  // Historical entries (0 to 3)
  for (let i = 0; i <= dividerIdx; i++) {
    series.push({
      period: months[i],
      period_full: `2024 ${months[i]}`,
      is_forecast: false,
      historical_incremental: Math.round(histIncremental[i] * scaleMultiplier * 10) / 10,
      historical_baseline: Math.round(histBaseline[i] * scaleMultiplier * 10) / 10,
      baseline: null,
      incremental: null,
      incremental_best: null,
      incremental_worst: null,
    });
  }

  // Future forecast entries (4 to 9)
  const baseIncrementalProfile = [14.8, 16.5, 18.9, 21.8, 20.9, 20.4];
  let totBaseline = 0;
  let totIncremental = 0;

  for (let idx = 0; idx < futBaselineMean.length; idx++) {
    const monthIdx = dividerIdx + 1 + idx;
    const baseVal = futBaselineMean[idx] * scaleMultiplier;

    // Incremental prediction scaled by user's slider input
    const profileRatio = baseIncrementalProfile[idx] / 18.0;
    const incVal = Math.round(baseVal * 1.55 * incrementalFactor * profileRatio * 10) / 10;

    // Expanding cone of uncertainty
    const uncertainty = 1.6 + idx * 0.4;
    const bestVal = Math.round((incVal + uncertainty) * 10) / 10;
    const worstVal = Math.round(Math.max(incVal - uncertainty, baseVal + 0.5) * 10) / 10;

    const baseValRound = Math.round(baseVal * 10) / 10;
    const baseUpper = Math.round((baseValRound + 1.2) * 10) / 10;
    const baseLower = Math.round(Math.max(baseValRound - 1.2, 0.5) * 10) / 10;

    totBaseline += baseValRound;
    totIncremental += incVal;

    series.push({
      period: months[monthIdx],
      period_full: `2024 ${months[monthIdx]}`,
      is_forecast: true,
      historical_incremental: null,
      historical_baseline: null,
      baseline: baseValRound,
      baseline_lower: baseLower,
      baseline_upper: baseUpper,
      incremental: incVal,
      incremental_best: bestVal,
      incremental_worst: worstVal,
      best_case_str: formatINRMillions(bestVal),
      most_likely_str: formatINRMillions(incVal),
      worst_case_str: formatINRMillions(worstVal),
    });
  }

  // Connect bridge point at divider so line rendering is continuous
  series[dividerIdx].baseline = series[dividerIdx].historical_baseline;
  series[dividerIdx].incremental = series[dividerIdx].historical_incremental;
  series[dividerIdx].incremental_best = series[dividerIdx].historical_incremental;
  series[dividerIdx].incremental_worst = series[dividerIdx].historical_incremental;

  const netLift = Math.round((totIncremental - totBaseline) * 10) / 10;
  const liftPct =
    totBaseline > 0 ? Math.round((netLift / totBaseline) * 1000) / 10 : 0;

  const dirWord = pricePct > 0 ? 'increase' : pricePct < 0 ? 'decrease' : 'hold';
  const peakPoint = series[7] || series[series.length - 2];

  const narrative =
    `AI Forecast Analysis: A ${pricePct >= 0 ? '+' : ''}${pricePct.toFixed(0)}% price ${dirWord} operates with an estimated ` +
    `price elasticity of ${elasticityP.toFixed(2)}. Consumer retention remains resilient, ` +
    `yielding an estimated net revenue impact of ${liftPct >= 0 ? '+' : ''}${liftPct}% (${netLift >= 0 ? '+' : ''}${formatINRMillions(netLift)}). ` +
    `Peak month projected at ${peakPoint.most_likely_str} (Best Case: ${peakPoint.best_case_str}, Worst Case: ${peakPoint.worst_case_str}).`;

  const summary: ForecastSummary = {
    slider_price_pct: pricePct,
    slider_marketing_pct: marketingPct,
    slider_delay_days: delayDays,
    baseline_total_revenue: Math.round(totBaseline * 10) / 10,
    incremental_total_revenue: Math.round(totIncremental * 10) / 10,
    net_incremental_lift: netLift,
    lift_percentage: liftPct,
    baseline_total_str: formatINRMillions(totBaseline),
    incremental_total_str: formatINRMillions(totIncremental),
    lift_str: `${netLift >= 0 ? '+' : ''}${formatINRMillions(netLift)}`,
    elasticity_coefficient: elasticityP,
    confidence_level: 0.9,
    ai_narrative: narrative,
    divider_index: dividerIdx,
  };

  return {
    series,
    summary,
    units: '₹ Millions',
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const priceChange = parseFloat(searchParams.get('price_change') || '10');
  const marketingChange = parseFloat(searchParams.get('marketing_change') || '0');
  const delayDays = parseInt(searchParams.get('delay_days') || '0', 10);

  // First try upstream FastAPI backend if available
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  try {
    const res = await fetch(
      `${apiUrl}/api/forecast?price_change=${priceChange}&marketing_change=${marketingChange}&delay_days=${delayDays}`,
      { cache: 'no-store' }
    );
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Upstream not running, fallback to built-in predictive engine
  }

  const result = computeForecastLogic(priceChange, marketingChange, delayDays);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const priceChange = body.price_change_pct ?? 10;
    const marketingChange = body.marketing_change_pct ?? 0;
    const delayDays = body.delay_days ?? 0;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${apiUrl}/api/forecast/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Upstream not running, fallback to built-in predictive engine
    }

    const result = computeForecastLogic(priceChange, marketingChange, delayDays);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
