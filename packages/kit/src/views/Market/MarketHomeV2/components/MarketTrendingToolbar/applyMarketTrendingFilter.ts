import {
  MARKET_FILTER_DIMENSION_MAP,
  getMarketFilterOption,
} from './marketTrendingFilterConfig';

import type {
  EMarketFilterDimension,
  IMarketFilterConditions,
} from './marketTrendingFilterTypes';
import type { IMarketToken } from '../MarketTokenList/MarketTokenData';

/**
 * Applies the selected tiers to the page already in hand. The trending payload
 * arrives as one pool, so filtering it locally equals filtering the whole
 * trending list; dimensions without a `localField` are skipped rather than
 * emptying the table.
 */
export function applyMarketTrendingFilter(
  tokens: IMarketToken[],
  conditions: IMarketFilterConditions,
  nowMs: number = Date.now(),
): IMarketToken[] {
  const entries = Object.entries(conditions).filter(([dimensionId]) => {
    const dimension = MARKET_FILTER_DIMENSION_MAP.get(
      dimensionId as EMarketFilterDimension,
    );
    return dimension?.localField !== undefined;
  }) as [EMarketFilterDimension, string][];
  if (entries.length === 0) {
    return tokens;
  }
  return tokens.filter((token) =>
    entries.every(([dimensionId, optionId]) => {
      const dimension = MARKET_FILTER_DIMENSION_MAP.get(dimensionId);
      const option = getMarketFilterOption(dimensionId, optionId);
      if (!dimension?.localField || !option) {
        return true;
      }
      const raw = token[dimension.localField] as number | undefined;
      if (raw === undefined || raw === null || Number.isNaN(raw)) {
        return false;
      }
      // Age dimensions store a ms epoch timestamp (same clock as Date.now());
      // convert to an age before comparing against the option range.
      const value = dimension.isAge ? nowMs - raw : raw;
      if (option.min !== undefined && value < option.min) {
        return false;
      }
      if (option.max !== undefined && value > option.max) {
        return false;
      }
      return true;
    }),
  );
}
