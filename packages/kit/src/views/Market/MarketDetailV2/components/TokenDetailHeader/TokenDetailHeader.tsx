import type { ComponentProps } from 'react';
import { useCallback, useMemo, useState } from 'react';

import {
  GradientMask,
  IconButton,
  ScrollView,
  Stack,
  XStack,
  useMedia,
} from '@onekeyhq/components';
import platformEnv from '@onekeyhq/shared/src/platformEnv';
import networkUtils from '@onekeyhq/shared/src/utils/networkUtils';

import { MarketTestIDs } from '../../../testIDs';
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
  containerProps,
}: {
  showStats?: boolean;
  showMediaAndSecurity?: boolean;
  showFavoriteButton?: boolean;
  stockEntityIdentity?: { ticker: string; name: string };
  // True on both stock layers (entity page and variant page): the contract,
  // audit and social links all live in the trust block there.
  isStockLayout?: boolean;
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
      py="$4"
      // The entity trigger is two lines tall, so the fixed single-line height
      // would clip its name + status row.
      h={stockEntityIdentity ? undefined : 54}
      minHeight={54}
      jc="flex-start"
      ai="center"
      gap="$6"
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

      {/* Stock headers keep only share plus a placeholder overflow button;
          everything token-specific moved into the trust block. */}
      {isStockLayout && !platformEnv.isNative && !md ? (
        <>
          {networkId ? (
            <ShareButton
              networkId={networkId}
              address={tokenDetail?.address ?? ''}
              isNative={isNative}
              useIconButton
              size="$5"
            />
          ) : null}
          <IconButton
            testID={MarketTestIDs.detailMoreButton}
            size="small"
            variant="tertiary"
            icon="DotHorOutline"
            iconSize="$5"
            title="More"
          />
        </>
      ) : null}

      {/* Share button pushed to the right on desktop */}
      {!stockEntityIdentity &&
      !platformEnv.isNative &&
      !md &&
      networkId &&
      isNative ? (
        <>
          <Stack flex={1} />
          <ShareButton
            networkId={networkId}
            address={tokenDetail?.address ?? ''}
            isNative={isNative}
            useIconButton
          />
        </>
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
