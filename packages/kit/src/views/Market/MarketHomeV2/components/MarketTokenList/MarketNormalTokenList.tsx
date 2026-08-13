import { useCallback, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';

import platformEnv from '@onekeyhq/shared/src/platformEnv';

import {
  markMarketReactPerf,
  useMarketRenderCommitProbe,
} from '../../../utils/marketReactPerf';
import {
  collapseStockEntityRows,
  hasAlwaysOnStockVariant,
} from '../../utils/marketStockEntityRow';
import {
  applyMarketTrendingFilter,
  useMarketTrendingFilter,
} from '../MarketTrendingToolbar';

import { useMarketTokenList } from './hooks/useMarketTokenList';
import { type IMarketToken } from './MarketTokenData';
import { MarketTokenListBase } from './MarketTokenListBase';
import { shouldUseStockMetadataColumnsForTokens } from './utils/tokenListHelpers';

import type {
  IMarketListLocalSort,
  IMarketTokenListLiveOverride,
} from './MarketTokenListBase';
import type { IMarketTimeRangeValue } from '../../types';

type IMarketNormalTokenListProps = {
  networkId?: string;
  selectedCategory?: string;
  stockCategory?: string;
  /**
   * The Stocks tab. Told by the caller rather than derived from the payload:
   * the "All" category sends no category param, and a single row without stock
   * metadata must not drop the tab back to the crypto presentation.
   */
  isStockList?: boolean;
  /**
   * The Trending tab. Its toolbar owns the filter conditions and the sort, so
   * the list reads both off the shared provider rather than keeping copies.
   */
  isTrendingList?: boolean;
  timeRange?: IMarketTimeRangeValue;
  sortBy?: string;
  sortType?: 'asc' | 'desc';
  onItemPress?: (item: IMarketToken) => void;
  toolbar?: ReactNode;
  tabIntegrated?: boolean;
  tabName?: string;
  listContainerProps?: {
    paddingBottom: number;
  };
  hiddenDesktopColumns?: readonly string[];
  liveTokenOverride?: IMarketTokenListLiveOverride;
  enableWebSocket?: boolean;
  pollingInterval?: number;
  rowBg?: string;
  onStockDataChange?: (categoryId: string, isStockData: boolean) => void;
  onStockAlwaysOnVariantsChange?: (hasAlwaysOnVariants: boolean) => void;
};

function MarketNormalTokenList({
  networkId = 'sol--101',
  selectedCategory,
  stockCategory,
  timeRange,
  sortBy: initialSortBy,
  sortType: initialSortType,
  onItemPress,
  toolbar,
  tabIntegrated,
  tabName,
  listContainerProps,
  hiddenDesktopColumns,
  liveTokenOverride,
  enableWebSocket,
  pollingInterval,
  rowBg,
  onStockDataChange,
  onStockAlwaysOnVariantsChange,
  isStockList,
  isTrendingList,
}: IMarketNormalTokenListProps) {
  useMarketRenderCommitProbe('MarketNormalTokenList', {
    networkId,
    selectedCategory,
    stockCategory,
    timeRange,
  });
  const normalResult = useMarketTokenList({
    networkId,
    initialSortBy,
    initialSortType,
    pageSize: 20,
    type: selectedCategory,
    category: stockCategory,
    timeRange,
    pollingInterval,
  });

  const isStockData = useMemo(
    () => shouldUseStockMetadataColumnsForTokens(normalResult.data),
    [normalResult.data],
  );

  const { conditions, sortState, setSortState } = useMarketTrendingFilter();

  // One stock, one row. Paging still happens against the raw token list; only
  // what gets rendered is collapsed, so scroll and websocket updates are
  // untouched.
  const result = useMemo(() => {
    if (isTrendingList) {
      // The trending payload arrives as one pool, so filtering it here filters
      // the whole list — and unlike a server-side filter it does not refetch.
      return {
        ...normalResult,
        data: applyMarketTrendingFilter(normalResult.data, conditions),
      };
    }
    if (!isStockData && !isStockList) {
      return normalResult;
    }
    return {
      ...normalResult,
      data: collapseStockEntityRows(normalResult.data),
    };
  }, [conditions, isStockData, isStockList, isTrendingList, normalResult]);

  // The provider stores the sort the way the toolbar shortcuts express it
  // (sortBy/sortType); the table wants a key/order pair.
  const localSort = useMemo<IMarketListLocalSort>(
    () =>
      sortState.sortBy && sortState.sortType
        ? { key: sortState.sortBy, order: sortState.sortType }
        : null,
    [sortState.sortBy, sortState.sortType],
  );
  const handleLocalSortChange = useCallback(
    (next: IMarketListLocalSort) => {
      setSortState(next ? { sortBy: next.key, sortType: next.order } : {});
    },
    [setSortState],
  );

  useEffect(() => {
    if (selectedCategory) {
      onStockDataChange?.(selectedCategory, isStockData);
    }
  }, [isStockData, onStockDataChange, selectedCategory]);

  useEffect(() => {
    if (!isStockData) {
      return;
    }
    onStockAlwaysOnVariantsChange?.(hasAlwaysOnStockVariant(normalResult.data));
  }, [isStockData, normalResult.data, onStockAlwaysOnVariantsChange]);

  useEffect(() => {
    if (!platformEnv.isWeb || normalResult.data.length === 0) {
      return;
    }
    const perfGlobal = globalThis as typeof globalThis & {
      __onekeyMarketListReadyAt?: number;
      __onekeyMarketListReadyCount?: number;
    };
    perfGlobal.__onekeyMarketListReadyAt ??= performance.now();
    perfGlobal.__onekeyMarketListReadyCount = normalResult.data.length;
    markMarketReactPerf({
      name: 'MarketNormalTokenList.readyEffect',
      phase: 'measure',
      detail: {
        count: normalResult.data.length,
        selectedCategory,
      },
    });
  }, [normalResult.data.length, selectedCategory]);

  return (
    <MarketTokenListBase
      testID="market-normal-token-list"
      networkId={networkId}
      onItemPress={onItemPress}
      toolbar={toolbar}
      isStockList={isStockList}
      isTrendingList={isTrendingList}
      localSort={isTrendingList ? localSort : undefined}
      onLocalSortChange={isTrendingList ? handleLocalSortChange : undefined}
      result={result}
      isWatchlistMode={false}
      showEndReachedIndicator
      tabIntegrated={tabIntegrated}
      tabName={tabName}
      listContainerProps={listContainerProps}
      showStockSubtitle="auto"
      hiddenDesktopColumns={hiddenDesktopColumns}
      liveTokenOverride={liveTokenOverride}
      enableWebSocket={enableWebSocket}
      rowBg={rowBg}
    />
  );
}

export { MarketNormalTokenList };
