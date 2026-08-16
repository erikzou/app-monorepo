import type { IMarketTokenChart } from '@onekeyhq/shared/types/market';

/**
 * DEMO ONLY. The market kline endpoint is pool-based, so a major coin traded on
 * centralized venues (BTC, ETH) has no pool to read and the Lite chart comes
 * back empty. Until the top-coin candle source lands, this borrows OKX's public
 * spot candles so the assembly can be reviewed with a real, correctly shaped
 * series instead of an empty state.
 *
 * Delete this file together with the fallback in useMarketLiteChartData once
 * the server serves candles for majors.
 */

const OKX_CANDLES_ENDPOINT = 'https://www.okx.com/api/v5/market/candles';

// Our range intervals expressed in OKX's `bar` vocabulary. OKX uses uppercase
// letters for day-and-above buckets and lowercase minutes below that.
const OKX_BAR_BY_INTERVAL: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1H': '1H',
  '4H': '4H',
  '1D': '1D',
  '1W': '1W',
};

// Majors the demo whitelist covers. Quoted in USDT because that is OKX's
// deepest spot book, and the resulting price tracks USD closely enough for a
// visual review.
const OKX_INST_ID_BY_SYMBOL: Record<string, string> = {
  BTC: 'BTC-USDT',
  ETH: 'ETH-USDT',
};

export function getOkxDemoInstId(symbol?: string) {
  if (!symbol) {
    return undefined;
  }
  return OKX_INST_ID_BY_SYMBOL[symbol.toUpperCase()];
}

export async function fetchOkxDemoKline({
  symbol,
  interval,
  limit = 300,
}: {
  symbol?: string;
  interval: string;
  limit?: number;
}): Promise<IMarketTokenChart> {
  const instId = getOkxDemoInstId(symbol);
  const bar = OKX_BAR_BY_INTERVAL[interval];
  if (!instId || !bar) {
    return [];
  }
  const query = new URLSearchParams({
    instId,
    bar,
    limit: String(limit),
  }).toString();
  const response = await fetch(`${OKX_CANDLES_ENDPOINT}?${query}`);
  if (!response.ok) {
    return [];
  }
  const payload = (await response.json()) as {
    code?: string;
    data?: string[][];
  };
  if (payload.code !== '0' || !Array.isArray(payload.data)) {
    return [];
  }
  // OKX rows are [ts, open, high, low, close, ...] with ts in milliseconds and
  // newest first; the chart wants [seconds, close] oldest first.
  return payload.data
    .map((row) => {
      const timestamp = Number(row[0]);
      const close = Number(row[4]);
      return [Math.floor(timestamp / 1000), close] as [number, number];
    })
    .filter(([timestamp, close]) => timestamp > 0 && Number.isFinite(close))
    .toSorted((a, b) => a[0] - b[0]);
}
