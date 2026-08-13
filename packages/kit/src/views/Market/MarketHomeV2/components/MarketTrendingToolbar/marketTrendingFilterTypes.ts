import type { IKeyOfIcons } from '@onekeyhq/components';

import type { IMarketTimeRangeValue } from '../../types';
import type { IMarketToken } from '../MarketTokenList/MarketTokenData';

// Filter dimensions shown to the user. Each dimension maps to a pair of
// hot-token v6 params (min/max) so tier options can pass ranges upstream once
// the server takes them.
export enum EMarketFilterDimension {
  TokenAge = 'tokenAge',
  MarketCap = 'marketCap',
  Liquidity = 'liquidity',
  Turnover = 'turnover',
  Holders = 'holders',
  Change = 'change',
  Txns = 'txns',
}

// A selectable tier. Threshold dimensions use only `min` (floor semantics,
// label like "$5K+"); token age uses only `max`, read as an age ceiling.
export type IMarketFilterOption = {
  id: string;
  label: string;
  min?: number;
  max?: number;
};

export type IMarketFilterDimensionConfig = {
  id: EMarketFilterDimension;
  // TODO(i18n): demo copy, hardcoded English.
  label: string;
  // Unit appended to the row title in the dialog.
  unit?: string;
  // hot-token v6 param names backing the future server passthrough.
  minParam?: string;
  maxParam?: string;
  // IMarketToken field backing the local demo filter; undefined = the
  // dimension is selectable but has no local data source and is skipped by
  // applyMarketTrendingFilter.
  localField?: keyof IMarketToken;
  // firstTradeTime is a timestamp; compare (now - value) against min/max.
  isAge?: boolean;
  options: IMarketFilterOption[];
};

// Selected tier option id per dimension.
export type IMarketFilterConditions = Partial<
  Record<EMarketFilterDimension, string>
>;

export type IMarketListSortState = {
  sortBy?: string;
  sortType?: 'asc' | 'desc';
};

// A toolbar shortcut button (Figma 25362:42984): a named preset of conditions,
// optionally carrying a sort and a time frame.
export type IMarketFilterShortcut = {
  id: string;
  // TODO(i18n): demo copy, hardcoded English.
  label: string;
  icon: IKeyOfIcons;
  conditions: IMarketFilterConditions;
  sort?: IMarketListSortState;
  timeRange?: IMarketTimeRangeValue;
};

export type IMarketTrendingFilterContextValue = {
  conditions: IMarketFilterConditions;
  sortState: IMarketListSortState;
  // Applies conditions. Sort resets unless `sort` is given, because switching
  // the filtered slice invalidates the ordering computed over the previous one.
  applyConditions: (
    conditions: IMarketFilterConditions,
    options?: { sort?: IMarketListSortState },
  ) => void;
  setSortState: (sort: IMarketListSortState) => void;
  activeConditionCount: number;
};
