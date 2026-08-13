import { useMemo } from 'react';

import type { ITableColumn } from '@onekeyhq/components';
import { useMedia } from '@onekeyhq/components';
import type {
  ECopyFrom,
  EWatchlistFrom,
} from '@onekeyhq/shared/src/logger/scopes/dex';

import { type IMarketToken } from '../../MarketTokenData';

import { useColumnsDesktop } from './useColumnsDesktop';
import { useColumnsMobile } from './useColumnsMobile';
import { useTrendingColumnsDesktop } from './useTrendingColumnsDesktop';

export const useMarketTokenColumns = (
  networkId?: string,
  isWatchlistMode?: boolean,
  hideTokenAge?: boolean,
  watchlistFrom?: EWatchlistFrom,
  copyFrom?: ECopyFrom,
  hasStock?: boolean,
  showStockSubtitle?: boolean,
  hiddenDesktopColumns?: readonly string[],
  change24hColumnTitle?: string,
  useStockMetadataColumns?: boolean,
  deferRichRowAfterIndex?: number,
  /**
   * The Trending tab, which has its own desktop column set (Figma
   * 25366:45077): name and token age share a cell, as do market cap and
   * change, and it adds Holders and Risk.
   */
  isTrendingList?: boolean,
): ITableColumn<IMarketToken>[] => {
  const desktopColumns = useColumnsDesktop(
    networkId,
    isWatchlistMode,
    hideTokenAge,
    watchlistFrom,
    copyFrom,
    hasStock,
    showStockSubtitle,
    hiddenDesktopColumns,
    change24hColumnTitle,
    useStockMetadataColumns,
    deferRichRowAfterIndex,
  );
  const mobileColumns = useColumnsMobile(
    showStockSubtitle,
    useStockMetadataColumns,
  );
  const trendingColumns = useTrendingColumnsDesktop(
    networkId,
    deferRichRowAfterIndex,
  );

  const media = useMedia();

  return useMemo(() => {
    if (!media.gtMd) {
      return mobileColumns;
    }
    return isTrendingList ? trendingColumns : desktopColumns;
  }, [
    desktopColumns,
    isTrendingList,
    media.gtMd,
    mobileColumns,
    trendingColumns,
  ]);
};
