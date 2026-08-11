import { useEffect, useMemo } from 'react';
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

import { useMarketTokenList } from './hooks/useMarketTokenList';
import { type IMarketToken } from './MarketTokenData';
import { MarketTokenListBase } from './MarketTokenListBase';
import { shouldUseStockMetadataColumnsForTokens } from './utils/tokenListHelpers';

import type { IMarketTokenListLiveOverride } from './MarketTokenListBase';
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

  // One stock, one row. Paging still happens against the raw token list; only
  // what gets rendered is collapsed, so scroll and websocket updates are
  // untouched.
  const result = useMemo(() => {
    if (!isStockData && !isStockList) {
      return normalResult;
    }
    return {
      ...normalResult,
      data: collapseStockEntityRows(normalResult.data),
    };
  }, [isStockData, isStockList, normalResult]);

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
