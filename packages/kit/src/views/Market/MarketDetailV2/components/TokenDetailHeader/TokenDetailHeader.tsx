import type { ComponentProps } from 'react';
import { useCallback, useMemo, useState } from 'react';

import {
  GradientMask,
  ScrollView,
  XStack,
  useMedia,
} from '@onekeyhq/components';
import { EWatchlistFrom } from '@onekeyhq/shared/src/logger/scopes/dex';
import platformEnv from '@onekeyhq/shared/src/platformEnv';
import networkUtils from '@onekeyhq/shared/src/utils/networkUtils';

import { MarketStarV2 } from '../../../components/MarketStarV2';
import { useMarketDetailHeaderDisplayData } from '../../hooks/useMarketDetailDisplayData';

import { ShareButton } from './ShareButton';
import { TokenDetailHeaderLeft } from './TokenDetailHeaderLeft';
import { TokenDetailHeaderRight } from './TokenDetailHeaderRight';

import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';

const SCROLL_THRESHOLD = 2;

export function TokenDetailHeader({
  showStats = true,
  showMediaAndSecurity = true,
  showFavoriteButton = true,
  stockEntityIdentity,
  isStockLayout = false,
  isTopCoinLayout = false,
  containerProps,
}: {
  showStats?: boolean;
  showMediaAndSecurity?: boolean;
  showFavoriteButton?: boolean;
  stockEntityIdentity?: { ticker: string; name: string };
  // True on both stock layers (entity page and variant page): the contract,
  // audit and social links all live in the trust block there.
  isStockLayout?: boolean;
  // The top-coin assembly reuses the stock header shape with a different
  // switcher and its own badges.
  isTopCoinLayout?: boolean;
  containerProps?: ComponentProps<typeof XStack>;
}) {
  const { lg, md } = useMedia();
  const {
    tokenDetail,
    networkId,
    isNative,
    isPreviewTokenDetail,
    isStockToken,
  } = useMarketDetailHeaderDisplayData();
  const [scrollX, setScrollX] = useState(0);
  const [scrollViewWidth, setScrollViewWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  const networkData = useMemo(() => {
    return networkId ? networkUtils.getLocalNetworkInfo(networkId) : undefined;
  }, [networkId]);

  const shouldShowRightGradient = useMemo(() => {
    return (
      contentWidth > scrollViewWidth &&
      scrollX < contentWidth - scrollViewWidth - SCROLL_THRESHOLD
    );
  }, [contentWidth, scrollViewWidth, scrollX]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setScrollX(event.nativeEvent.contentOffset.x);
    },
    [],
  );

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setScrollViewWidth(event.nativeEvent.layout.width);
  }, []);

  const handleContentSizeChange = useCallback((width: number) => {
    setContentWidth(width);
  }, []);

  // The stock header carries no price/stats block, and the token header drops
  // it on narrow native screens when stats are off.
  const showHeaderRight =
    !stockEntityIdentity &&
    !(showStats === false && platformEnv.isNative && md);

  // Stock headers are short and their actions must sit flush right, so they
  // skip the horizontal scroller the token header needs — inside it the row
  // would shrink to its content and never reach the edge.
  const useHorizontalScroller = !isStockLayout && !platformEnv.isNative && !md;

  const renderHeaderContent = () => (
    <XStack
      position="relative"
      width={lg ? '90%' : '100%'}
      px="$5"
      py={isStockLayout ? '$3' : '$4'}
      // The entity trigger is two lines tall, so the fixed single-line height
      // would clip its name + status row.
      h={stockEntityIdentity ? undefined : 54}
      minHeight={isStockLayout ? 72 : 54}
      jc="flex-start"
      ai="center"
      gap={isStockLayout ? '$5' : '$6'}
      {...containerProps}
    >
      <TokenDetailHeaderLeft
        tokenDetail={tokenDetail}
        networkId={networkId}
        networkLogoUri={networkData?.logoURI}
        showMediaAndSecurity={showMediaAndSecurity}
        isNative={isNative}
        showFavoriteButton={showFavoriteButton}
        stockEntityIdentity={stockEntityIdentity}
        hideContractAddress={isStockLayout}
        isTopCoinLayout={isTopCoinLayout}
      />

      {showHeaderRight ? (
        <TokenDetailHeaderRight
          tokenDetail={tokenDetail}
          networkId={networkId}
          isNative={isNative}
          showStats={showStats}
          isPreviewTokenDetail={isPreviewTokenDetail}
          isStockToken={isStockToken}
          hidePrice={isStockLayout}
        />
      ) : null}

      {/* Star and share sit together on the right (Figma 25277:10360). */}
      {isStockLayout && !platformEnv.isNative && !md ? (
        <XStack gap="$4" alignItems="center">
          {showFavoriteButton && networkId ? (
            <MarketStarV2
              chainId={networkId}
              contractAddress={tokenDetail?.address ?? ''}
              size="small"
              customIconSize="$5"
              from={EWatchlistFrom.Detail}
              tokenSymbol={tokenDetail?.symbol ?? ''}
              isNative={isNative}
            />
          ) : null}
          {networkId ? (
            <ShareButton
              networkId={networkId}
              address={tokenDetail?.address ?? ''}
              isNative={isNative}
              useIconButton
              size="small"
            />
          ) : null}
        </XStack>
      ) : null}
    </XStack>
  );

  return (
    <XStack
      position="relative"
      // The stock header renders without the horizontal scroller, so it needs
      // an explicit full width to stretch across the column — otherwise it
      // shrinks to its content and the trailing metrics never reach the edge.
      width={isStockLayout ? '100%' : undefined}
      // The stock header runs straight into the price block, with no rule
      // between them.
      borderBottomWidth={isStockLayout ? 0 : '$px'}
      borderBottomColor="$borderSubdued"
    >
      {useHorizontalScroller ? (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onLayout={handleLayout}
            onContentSizeChange={handleContentSizeChange}
          >
            {renderHeaderContent()}
          </ScrollView>

          <GradientMask
            opacity={scrollX > SCROLL_THRESHOLD ? 1 : 0}
            position="left"
          />
          <GradientMask
            opacity={shouldShowRightGradient ? 1 : 0}
            position="right"
          />
        </>
      ) : (
        renderHeaderContent()
      )}
    </XStack>
  );
}
