import { EMarketFilterDimension } from './marketTrendingFilterTypes';

import type {
  IMarketFilterConditions,
  IMarketFilterDimensionConfig,
  IMarketFilterOption,
  IMarketFilterShortcut,
  IMarketListSortState,
} from './marketTrendingFilterTypes';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function formatUsd(value: number) {
  if (value >= 1_000_000) {
    return `${value / 1_000_000}M`;
  }
  return `${value / 1000}K`;
}

function formatCount(value: number) {
  return value >= 1000 ? `${value / 1000}K` : `${value}`;
}

// Floor tiers ("at least X"). The dialog row title carries the unit, so the
// pill itself stays short.
function usdFloors(values: number[]): IMarketFilterOption[] {
  return values.map((value) => ({
    id: `min-${value}`,
    label: `${formatUsd(value)}+`,
    min: value,
  }));
}

function countFloors(values: number[]): IMarketFilterOption[] {
  return values.map((value) => ({
    id: `min-${value}`,
    label: `${formatCount(value)}+`,
    min: value,
  }));
}

/**
 * Tier ladders. Values are centralized here because they are meant to become
 * server-configurable: each tier has to move the view enough to be worth a tap,
 * so tiers that barely change the list (or empty it) were left out. Param names
 * track hot-token v6, which is what the server passthrough will send.
 *
 * Row order puts the "is this substantial?" levers first (market cap /
 * liquidity / holders), then the metrics the selected time frame rewrites
 * (turnover / change / txns), then token age.
 */
export const MARKET_FILTER_DIMENSIONS: IMarketFilterDimensionConfig[] = [
  {
    id: EMarketFilterDimension.MarketCap,
    label: 'Market cap',
    unit: '$',
    minParam: 'marketCapMin',
    maxParam: 'marketCapMax',
    localField: 'marketCap',
    options: usdFloors([500_000, 1_000_000, 10_000_000, 100_000_000]),
  },
  {
    id: EMarketFilterDimension.Liquidity,
    label: 'Liquidity',
    unit: '$',
    minParam: 'liquidityMin',
    maxParam: 'liquidityMax',
    localField: 'liquidity',
    options: usdFloors([10_000, 50_000, 500_000]),
  },
  {
    id: EMarketFilterDimension.Holders,
    label: 'Holders',
    minParam: 'holdersMin',
    maxParam: 'holdersMax',
    localField: 'holders',
    options: countFloors([1000, 10_000, 100_000]),
  },
  {
    id: EMarketFilterDimension.Turnover,
    label: 'Turnover',
    unit: '$',
    minParam: 'volumeMin',
    maxParam: 'volumeMax',
    localField: 'turnover',
    options: usdFloors([10_000, 50_000, 100_000]),
  },
  {
    id: EMarketFilterDimension.Change,
    label: 'Change',
    minParam: 'priceChangePercentMin',
    maxParam: 'priceChangePercentMax',
    localField: 'change24h',
    options: [10, 50, 100].map((value) => ({
      id: `min-${value}`,
      label: `${value}%+`,
      min: value,
    })),
  },
  {
    id: EMarketFilterDimension.Txns,
    label: 'Txns',
    minParam: 'txsMin',
    maxParam: 'txsMax',
    localField: 'transactions',
    options: countFloors([100, 500, 2000]),
  },
  {
    id: EMarketFilterDimension.TokenAge,
    label: 'Token age',
    // No server-side age param exists, so this row filters the slice already
    // fetched rather than the upstream pool.
    localField: 'firstTradeTime',
    isAge: true,
    options: [
      { id: 'under-48h', label: '≤ 48h', max: 2 * DAY },
      { id: 'under-7d', label: '≤ 7d', max: 7 * DAY },
      { id: 'under-30d', label: '≤ 30d', max: 30 * DAY },
    ],
  },
];

export const MARKET_FILTER_DIMENSION_MAP = new Map(
  MARKET_FILTER_DIMENSIONS.map((dimension) => [dimension.id, dimension]),
);

export function getMarketFilterOption(
  dimensionId: EMarketFilterDimension,
  optionId: string | undefined,
): IMarketFilterOption | undefined {
  if (!optionId) {
    return undefined;
  }
  return MARKET_FILTER_DIMENSION_MAP.get(dimensionId)?.options.find(
    (option) => option.id === optionId,
  );
}

/**
 * Expands the selected tiers into the flat hot-token v6 param object the future
 * server passthrough will send. Unused while the demo filters locally — it
 * exists so the swap to server-side filtering stays mechanical.
 */
export function buildHotTokenFilterParams(
  conditions: IMarketFilterConditions,
): Record<string, number> {
  const params: Record<string, number> = {};
  Object.entries(conditions).forEach(([dimensionId, optionId]) => {
    const dimension = MARKET_FILTER_DIMENSION_MAP.get(
      dimensionId as EMarketFilterDimension,
    );
    const option = getMarketFilterOption(
      dimensionId as EMarketFilterDimension,
      optionId,
    );
    if (!dimension || !option) {
      return;
    }
    if (dimension.minParam && option.min !== undefined) {
      params[dimension.minParam] = option.min;
    }
    if (dimension.maxParam && option.max !== undefined) {
      params[dimension.maxParam] = option.max;
    }
  });
  return params;
}

/**
 * The toolbar shortcuts (Figma 25362:42982). Each one is a named preset of the
 * same tiers the Filters dialog exposes, so nothing here can filter on a
 * threshold the user cannot also reach by hand. Every shortcut anchors the time
 * frame to 1h; the dialog stays unanchored so self-serve filtering keeps free
 * choice of window.
 */
export const MARKET_FILTER_SHORTCUTS: IMarketFilterShortcut[] = [
  {
    // A quality floor plus an in-pool turnover sort — the sort half runs
    // through the same state the column header writes, so the shortcut and the
    // header arrow can never disagree.
    id: 'topTurnover',
    label: 'Top turnover',
    icon: 'ChartColumnarOutline',
    conditions: {
      [EMarketFilterDimension.Holders]: 'min-1000',
    },
    sort: { sortBy: 'turnover', sortType: 'desc' },
    timeRange: '1h',
  },
  {
    id: 'midCap',
    label: 'Mid-cap tokens',
    icon: 'WorldOutline',
    conditions: {
      [EMarketFilterDimension.MarketCap]: 'min-500000',
      [EMarketFilterDimension.Liquidity]: 'min-10000',
      [EMarketFilterDimension.Turnover]: 'min-50000',
    },
    timeRange: '1h',
  },
  {
    id: 'largeCap',
    label: 'Large-cap tokens',
    icon: 'GalaxyOutline',
    conditions: {
      [EMarketFilterDimension.MarketCap]: 'min-1000000',
      [EMarketFilterDimension.Liquidity]: 'min-50000',
      [EMarketFilterDimension.Turnover]: 'min-100000',
    },
    timeRange: '1h',
  },
];

function sameConditions(
  a: IMarketFilterConditions,
  b: IMarketFilterConditions,
) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  return aKeys.every(
    (key) =>
      a[key as EMarketFilterDimension] === b[key as EMarketFilterDimension],
  );
}

/**
 * Shortcut selection is derived, never stored: a shortcut is lit exactly when
 * the live condition set (plus sort, where it carries one) equals what that
 * shortcut applies. Assembling the same combination by hand in the dialog
 * therefore lights it, and nudging any tier dissolves the preset back into
 * plain conditions — one truth, three presentations.
 */
export function findActiveMarketFilterShortcut(
  conditions: IMarketFilterConditions,
  sortState: IMarketListSortState,
): IMarketFilterShortcut | undefined {
  return MARKET_FILTER_SHORTCUTS.find((shortcut) => {
    if (!sameConditions(shortcut.conditions, conditions)) {
      return false;
    }
    if (!shortcut.sort) {
      return true;
    }
    return (
      shortcut.sort.sortBy === sortState.sortBy &&
      shortcut.sort.sortType === sortState.sortType
    );
  });
}
