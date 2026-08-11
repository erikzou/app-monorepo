import { memo, useMemo } from 'react';

import { Stack } from '@onekeyhq/components';
import { useThemeVariant } from '@onekeyhq/kit/src/hooks/useThemeVariant';
import SparklineChart from '@onekeyhq/kit/src/views/Market/components/SparklineChart';

const CHART_WIDTH = 100;
const CHART_HEIGHT = 40;
const DEMO_POINT_COUNT = 24;

const LINE_COLORS = ['#00B812', '#FF6259'];
const GRADIENT_COLORS = ['rgba(0, 184, 18, 0.2)', 'rgba(255, 98, 89, 0.2)'];
const DARK_GRADIENT_COLORS = [
  'rgba(0, 184, 18, 0.15)',
  'rgba(255, 98, 89, 0.15)',
];

/**
 * DEMO DATA. The list payload carries no intraday series yet, so the shape is
 * generated from the row itself — same symbol, same curve on every render, and
 * it ends on the right side of zero for the row's 24h change. Swap
 * `buildDemoSeries` for the real series once the endpoint lands; nothing else
 * here has to change.
 */
function buildDemoSeries(seed: string, change: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100_000;
  }
  const drift = change / DEMO_POINT_COUNT;
  const points: number[] = [];
  let value = 100;
  for (let i = 0; i < DEMO_POINT_COUNT; i += 1) {
    // Deterministic pseudo-noise: no Math.random, so rows stay stable across
    // re-renders and websocket updates.
    hash = (hash * 1_103_515_245 + 12_345) % 2_147_483_648;
    const noise = ((hash % 1000) / 1000 - 0.5) * 1.6;
    value += drift + noise;
    points.push(value);
  }
  return points;
}

function StockPriceRangeCellImpl({
  symbol,
  change24h,
}: {
  symbol: string;
  change24h?: number;
}) {
  const theme = useThemeVariant();
  const change = Number.isFinite(change24h) ? Number(change24h) : 0;
  const data = useMemo(() => buildDemoSeries(symbol, change), [symbol, change]);
  const isUp = change >= 0;
  const gradients = theme === 'dark' ? DARK_GRADIENT_COLORS : GRADIENT_COLORS;

  return (
    <Stack width={CHART_WIDTH} height={CHART_HEIGHT}>
      <SparklineChart
        data={data}
        width={CHART_WIDTH}
        height={CHART_HEIGHT}
        lineColor={isUp ? LINE_COLORS[0] : LINE_COLORS[1]}
        linearGradientColor={isUp ? gradients[0] : gradients[1]}
      />
    </Stack>
  );
}

export const StockPriceRangeCell = memo(StockPriceRangeCellImpl);
