import { useMemo } from 'react';

import BigNumber from 'bignumber.js';

import type { IMarketTokenDetail } from '@onekeyhq/shared/types/marketV2';

import { STAT_FALLBACK_VALUE, normalizeStatValue } from '../../utils/statValue';

export interface ITopCoinStat {
  key: string;
  label: string;
  value: string | number;
  /** Rendered as a small badge after the value (market-cap rank). */
  badge?: string;
}

export interface ITopCoinPerformanceItem {
  key: string;
  label: string;
  changePercent?: string;
  price?: string;
}

/**
 * DEMO WHITELIST — market-cap rank has no source on the detail payload. The two
 * whitelisted majors carry their well-known ranks so the badge can be reviewed;
 * drop this the moment the payload carries `rank`.
 */
const DEMO_RANK_BY_SYMBOL: Record<string, string> = {
  BTC: '#1',
  ETH: '#2',
};

/**
 * DEMO VALUES — the detail payload stops at 24h, so the windows below and the
 * 24h high/low have no source. They are derived from the live price, which
 * keeps them plausible and moving instead of frozen, and they are formatted
 * like the real thing. Replace with the historical series.
 */
const DEMO_PERFORMANCE_WINDOWS: {
  key: string;
  label: string;
  changePercent: number;
}[] = [
  { key: '7d', label: '7D', changePercent: -1.95 },
  { key: '30d', label: '30D', changePercent: -2.66 },
  { key: '3m', label: '3M', changePercent: -13.74 },
  { key: '1y', label: '1Y', changePercent: -59.29 },
  { key: 'ath', label: 'All Time High', changePercent: -62.1 },
];

const DEMO_24H_RANGE_SPREAD = 0.012;

function priceAtChange(price: BigNumber, changePercent: number) {
  const ratio = new BigNumber(changePercent).dividedBy(100).plus(1);
  if (ratio.isZero() || !ratio.isFinite()) {
    return undefined;
  }
  return price.dividedBy(ratio).toFixed();
}

export function useTopCoinOverviewData(tokenDetail?: IMarketTokenDetail) {
  return useMemo(() => {
    const priceBN = new BigNumber(tokenDetail?.price ?? '0');
    const hasPrice = priceBN.isFinite() && priceBN.gt(0);
    const symbol = tokenDetail?.symbol ?? '';

    // TODO(i18n): demo copy, hardcoded English.
    const stats: ITopCoinStat[] = [
      {
        key: 'marketCap',
        label: 'Market cap',
        value:
          normalizeStatValue(tokenDetail?.marketCap) ?? STAT_FALLBACK_VALUE,
        badge: DEMO_RANK_BY_SYMBOL[symbol.toUpperCase()],
      },
      {
        key: 'volume24h',
        label: '24h Volume',
        value:
          normalizeStatValue(tokenDetail?.volume24h) ?? STAT_FALLBACK_VALUE,
      },
      {
        key: 'circulatingSupply',
        label: 'Circulation Supply',
        value:
          normalizeStatValue(tokenDetail?.circulatingSupply) ??
          STAT_FALLBACK_VALUE,
      },
      {
        key: 'fdv',
        label: 'FDV',
        value: normalizeStatValue(tokenDetail?.fdv) ?? STAT_FALLBACK_VALUE,
      },
      // No source on the detail payload yet — the design shows the same for
      // max supply, so the gap stays visible rather than invented.
      { key: 'totalSupply', label: 'Total supply', value: STAT_FALLBACK_VALUE },
      { key: 'maxSupply', label: 'Max supply', value: STAT_FALLBACK_VALUE },
    ];

    const range = hasPrice
      ? {
          high: priceBN.multipliedBy(1 + DEMO_24H_RANGE_SPREAD).toFixed(),
          low: priceBN.multipliedBy(1 - DEMO_24H_RANGE_SPREAD).toFixed(),
        }
      : undefined;

    const performance: ITopCoinPerformanceItem[] = DEMO_PERFORMANCE_WINDOWS.map(
      (item) => ({
        key: item.key,
        label: item.label,
        changePercent: String(item.changePercent),
        price: hasPrice
          ? priceAtChange(priceBN, item.changePercent)
          : undefined,
      }),
    );

    return { stats, range, performance, symbol };
  }, [tokenDetail]);
}
