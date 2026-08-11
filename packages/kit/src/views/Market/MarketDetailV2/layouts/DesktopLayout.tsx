import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentProps, RefObject } from 'react';

import {
  Divider,
  Spinner,
  Stack,
  XStack,
  YStack,
  useOverlayZIndex,
} from '@onekeyhq/components';
import { TradingViewNative } from '@onekeyhq/kit/src/components/TradingView/TradingViewNative';
import {
  useMarketChartModeAtom,
  useMarketPriceSourceAtom,
} from '@onekeyhq/kit-bg/src/states/jotai/atoms';
import type { IMarketPriceSource } from '@onekeyhq/kit-bg/src/states/jotai/atoms';
import {
  TRADING_VIEW_LOCALHOST_ORIGIN,
  TRADING_VIEW_URL,
  TRADING_VIEW_URL_TEST,
} from '@onekeyhq/shared/src/config/appConfig';
import LazyLoad from '@onekeyhq/shared/src/lazyLoad';
import platformEnv from '@onekeyhq/shared/src/platformEnv';
import networkUtils from '@onekeyhq/shared/src/utils/networkUtils';

import { MarketTestIDs } from '../../testIDs';
import { usePortfolioData } from '../components/InformationTabs/components/Portfolio/hooks/usePortfolioData';
import { useNetworkAccount } from '../components/InformationTabs/hooks/useNetworkAccount';
import {
  MARKET_CHART_TOOLBAR_HEIGHT,
  MARKET_LITE_CHART_DEFAULT_RANGE,
  MarketChartModeSwitch,
  MarketChartPriceBar,
  MarketLiteChart,
  MarketLiteChartControls,
} from '../components/MarketLiteChart';
import { MarketChartFullscreenHeader } from '../components/MarketTradingView/MarketChartFullscreenHeader';
import { PerpetualTradingBanner } from '../components/PerpetualTradingBanner/PerpetualTradingBanner';
import { StockDisclaimerBanner } from '../components/StockDisclaimerBanner/StockDisclaimerBanner';
import { StockEntityTabs } from '../components/StockEntityTabs/StockEntityTabs';
import { StockTradePanel } from '../components/StockTradePanel/StockTradePanel';
import { StockTrustPanel } from '../components/StockTrustPanel/StockTrustPanel';
import { SwapPanel } from '../components/SwapPanel/SwapPanel';
import { TokenActivityOverview } from '../components/TokenActivityOverview/TokenActivityOverview';
import { TokenDetailHeader } from '../components/TokenDetailHeader/TokenDetailHeader';
import { TokenSupplementaryInfo } from '../components/TokenSupplementaryInfo/TokenSupplementaryInfo';
import { useMarketStockEntity } from '../hooks/useMarketStockEntity';
import {
  useMarketTradingViewParams,
  useTokenDetail,
} from '../hooks/useTokenDetail';
import { useTradingViewNativeInMarketDetail } from '../hooks/useTradingViewNativeInMarketDetail';
import { getMarketDetailTradingViewNativeSource } from '../utils/getMarketDetailTradingViewNativeSource';

import type { DesktopInformationTabs } from '../components/InformationTabs/layout/DesktopInformationTabs';
import type { IMarketLiteChartRange } from '../components/MarketLiteChart';
import type { IMarketTradingViewProps } from '../components/MarketTradingView/MarketTradingView';

const MARKET_DETAIL_LAYOUT = {
  chartHeight: 550,
  // The stock page carries a price bar above the chart and denser tabs below
  // it, so it runs a shorter chart to keep Key Data closer to the fold.
  // Design's chart block is 506 tall: pt 20 + price header 70 + gap 24 +
  // this chart area + pb 32 (Figma 25227:67414).
  stockChartHeight: 360,
  stockChartBlockPaddingBottom: 32,
  chartFullscreenHeaderFillHeight: 48,
  infoTabsHeight: 480,
} as const;

const SCROLL_CONTAINER_STYLE = { overflowY: 'auto' } as const;
const MARKET_CHART_FULLSCREEN_STYLE = {
  position: 'fixed',
  left: 0,
  top: 0,
  right: 0,
  bottom: platformEnv.isWeb ? 40 : 0,
} as const;
const IFRAME_WHEEL_EVENT_TYPE = 'wheelEvent' as const;

// Content frame of the stock detail design (Figma 25271:8054).
const STOCK_LAYOUT = {
  contentMaxWidth: 1140,
  contentPadding: 20,
  rightColumnWidth: 344,
  columnGap: 24,
} as const;

type IDesktopInformationTabsProps = ComponentProps<
  typeof DesktopInformationTabs
>;

interface IIframeWheelEventMessage {
  type: typeof IFRAME_WHEEL_EVENT_TYPE;
  deltaY: number;
}

const ALLOWED_TRADING_VIEW_ORIGINS = new Set([
  new URL(TRADING_VIEW_URL).origin,
  new URL(TRADING_VIEW_URL_TEST).origin,
  ...(platformEnv.isDev ? [TRADING_VIEW_LOCALHOST_ORIGIN] : []),
]);

function ModuleLoadingFallback({ minHeight }: { minHeight?: number }) {
  return (
    <Stack
      minHeight={minHeight}
      flex={1}
      alignItems="center"
      justifyContent="center"
    >
      <Spinner size="large" />
    </Stack>
  );
}

const infoTabsLoadingFallback = (
  <ModuleLoadingFallback minHeight={MARKET_DETAIL_LAYOUT.infoTabsHeight} />
);

const chartLoadingFallback = (
  <ModuleLoadingFallback minHeight={MARKET_DETAIL_LAYOUT.chartHeight} />
);

const LazyMarketTradingView = LazyLoad<IMarketTradingViewProps>(
  () =>
    import(
      /* webpackChunkName: "market-detail-v2-tradingview" */ '../components/MarketTradingView/MarketTradingView'
    ).then(({ MarketTradingView }) => ({
      default: MarketTradingView,
    })),
  undefined,
  chartLoadingFallback,
);

const LazyDesktopInformationTabs = LazyLoad<IDesktopInformationTabsProps>(
  () =>
    import(
      /* webpackChunkName: "market-detail-v2-desktop-info-tabs" */ '../components/InformationTabs/layout/DesktopInformationTabs'
    ).then(({ DesktopInformationTabs }) => ({
      default: DesktopInformationTabs,
    })),
  undefined,
  infoTabsLoadingFallback,
);

// Listen for wheel events forwarded from TradingView iframe via postMessage.
// TradingView side needs: window.parent.postMessage({ type: 'wheelEvent', deltaY }, '*')
function useIframeWheelPassthrough({
  disabled,
  scrollRef,
}: {
  disabled: boolean;
  scrollRef: RefObject<HTMLElement | null>;
}) {
  useEffect(() => {
    if (platformEnv.isNative || disabled) {
      return;
    }
    const handleMessage = (e: MessageEvent) => {
      if (!ALLOWED_TRADING_VIEW_ORIGINS.has(e.origin)) {
        return;
      }
      const data = e.data as IIframeWheelEventMessage | undefined;
      if (
        data?.type === IFRAME_WHEEL_EVENT_TYPE &&
        typeof data.deltaY === 'number'
      ) {
        scrollRef.current?.scrollBy({ top: data.deltaY });
      }
    };
    globalThis.addEventListener('message', handleMessage);
    return () => {
      globalThis.removeEventListener('message', handleMessage);
    };
  }, [disabled, scrollRef]);
}

export interface IDesktopLayoutProps {
  isChartFullscreen: boolean;
  onChartFullscreenChange: (isFullscreen: boolean) => void;
  networkId: string;
  tokenAddress: string;
  showFavoriteButton?: boolean;
}

export function DesktopLayout({
  isChartFullscreen,
  onChartFullscreenChange,
  networkId: routeNetworkId,
  tokenAddress: routeTokenAddress,
  showFavoriteButton = true,
}: IDesktopLayoutProps) {
  const {
    tokenAddress: storeTokenAddress,
    networkId: storeNetworkId,
    tokenDetail,
    isNative,
    websocketConfig,
    perpsInfo,
  } = useTokenDetail();
  const useTradingViewNative = useTradingViewNativeInMarketDetail();
  const networkId = storeNetworkId || routeNetworkId;
  const tokenAddress = storeNetworkId ? storeTokenAddress : routeTokenAddress;

  const { accountAddress, xpub } = useNetworkAccount(networkId);
  const chartFullscreenZIndex = useOverlayZIndex(isChartFullscreen);

  const { portfolioData, isRefreshing } = usePortfolioData({
    tokenAddress,
    networkId,
    accountAddress,
    xpub,
  });

  const isBTCNetwork = networkUtils.isBTCNetwork(networkId);
  const isBTCMainnet = networkUtils.isBTCMainnet(networkId);
  const nativeHyperliquidCoin =
    isBTCMainnet && isNative ? (perpsInfo?.hlTicker ?? '') : '';

  const swapToken = useMemo(
    () => ({
      networkId,
      contractAddress: tokenDetail?.address || '',
      symbol: tokenDetail?.symbol || '',
      decimals: tokenDetail?.decimals || 0,
      logoURI: tokenDetail?.logoUrl,
      price: tokenDetail?.price,
    }),
    [
      networkId,
      tokenDetail?.address,
      tokenDetail?.symbol,
      tokenDetail?.decimals,
      tokenDetail?.logoUrl,
      tokenDetail?.price,
    ],
  );

  // Lite/Pro chart. Only the stock entity page carries it for now; crypto
  // pages keep the Pro chart until the skeleton is rolled back to them.
  const [{ mode: chartMode }] = useMarketChartModeAtom();
  // Share price is the underlying equity, token price is the tokenized
  // instrument. Only the token series is charted today; the toggle switches the
  // header figures and is mirrored by the trade panel's chart button, which is
  // why the selection lives in a shared atom.
  const [{ source: priceSource }, setPriceSource] = useMarketPriceSourceAtom();
  const handlePriceSourceChange = useCallback(
    (source: IMarketPriceSource) => setPriceSource({ source }),
    [setPriceSource],
  );
  const [liteChartRange, setLiteChartRange] = useState<IMarketLiteChartRange>(
    MARKET_LITE_CHART_DEFAULT_RANGE,
  );
  const { entity: stockEntity, selectedInstrument } = useMarketStockEntity();
  const stockEntityIdentity = useMemo(
    () =>
      stockEntity
        ? { ticker: stockEntity.ticker, name: stockEntity.name }
        : undefined,
    [stockEntity],
  );

  // Stock identity comes from the index, so the stock page lights up for every
  // tokenized variant. There is only one layer: variants are expressed through
  // the trade dropdown and the trust block, never a page of their own.
  const isStockPage = Boolean(stockEntity);
  const showChartModeSwitch = isStockPage && !isChartFullscreen;
  const showLiteChart = showChartModeSwitch && chartMode === 'lite';
  const chartHeight = isStockPage
    ? MARKET_DETAIL_LAYOUT.stockChartHeight
    : MARKET_DETAIL_LAYOUT.chartHeight;

  const scrollContainerRef = useRef<HTMLElement>(null);
  useIframeWheelPassthrough({
    disabled: isChartFullscreen || useTradingViewNative,
    scrollRef: scrollContainerRef,
  });
  const handleChartFullscreenChange = useCallback(
    (isFullscreen: boolean) => {
      onChartFullscreenChange(isFullscreen);
    },
    [onChartFullscreenChange],
  );
  // The stock page swaps its whole toolbar between Lite and Pro. Dropping the
  // expand control there keeps the Lite/Pro switch as the last item in both
  // toolbars, so toggling doesn't shift it sideways.
  const chartFullscreenChangeHandler = isStockPage
    ? undefined
    : handleChartFullscreenChange;
  const handleTradingViewTouchScroll = useCallback(
    (deltaY: number) => {
      if (!isChartFullscreen) {
        scrollContainerRef.current?.scrollBy({ top: deltaY });
      }
    },
    [isChartFullscreen],
  );
  const marketTradingViewParams = useMarketTradingViewParams({
    tokenAddress,
    networkId,
    tokenDetail,
    isNative,
    websocketConfig,
  });
  const tradingViewNativeSource = useMemo(
    () =>
      getMarketDetailTradingViewNativeSource({
        hyperliquidCoin: nativeHyperliquidCoin,
        isNative,
        marketDataSource: marketTradingViewParams?.dataSource,
        networkId,
        symbol: tokenDetail?.symbol ?? '',
        tokenAddress,
      }),
    [
      marketTradingViewParams?.dataSource,
      nativeHyperliquidCoin,
      isNative,
      networkId,
      tokenAddress,
      tokenDetail?.symbol,
    ],
  );
  const marketTradingView = useMemo(() => {
    if (useTradingViewNative) {
      return networkId ? (
        <TradingViewNative
          testID={MarketTestIDs.detailChart}
          source={tradingViewNativeSource}
          enableNativeChartSettings
          nativeControlsLayoutMode="desktop"
          isNativeChartFullscreen={isChartFullscreen}
          nativeChartFullscreenHeader={<MarketChartFullscreenHeader />}
          onNativeChartFullscreenChange={chartFullscreenChangeHandler}
        />
      ) : null;
    }

    if (!marketTradingViewParams) {
      return null;
    }

    return (
      <LazyMarketTradingView
        tokenAddress={marketTradingViewParams.tokenAddress}
        networkId={marketTradingViewParams.networkId}
        tokenSymbol={marketTradingViewParams.tokenSymbol}
        isNative={marketTradingViewParams.isNative}
        dataSource={marketTradingViewParams.dataSource}
        onTouchScroll={handleTradingViewTouchScroll}
        nativeChartTypeControlMode="select"
        nativeIndicatorControlMode="popover"
        nativeIntervalControlMode="popover"
        nativePriceMarketCapControlMode="select"
        nativeControlsLayoutMode="desktop"
        chartModeControl={
          showChartModeSwitch ? <MarketChartModeSwitch /> : undefined
        }
        isNativeChartFullscreen={isChartFullscreen}
        showNativeIndicatorQuickBar={false}
        onNativeChartFullscreenChange={chartFullscreenChangeHandler}
      />
    );
  }, [
    chartFullscreenChangeHandler,
    handleTradingViewTouchScroll,
    isChartFullscreen,
    marketTradingViewParams,
    networkId,
    showChartModeSwitch,
    tradingViewNativeSource,
    useTradingViewNative,
  ]);
  return (
    <Stack
      ref={scrollContainerRef as any}
      flex={1}
      style={SCROLL_CONTAINER_STYLE}
    >
      {/* Page-level, above both columns and above the chart's fullscreen
          layer, so it stays visible for the whole stock page. */}
      {isStockPage && !isChartFullscreen ? <StockDisclaimerBanner /> : null}

      {/* Stock pages follow the design's centered 1140 content frame
          (Figma 25271:8054: 772 + 24 + 344). The 20px side padding keeps the
          content off the window edge below that width, so the inner box is
          still exactly 1140 on a 1440 viewport. Crypto pages stay full-width. */}
      <XStack
        {...(isStockPage
          ? {
              width: '100%',
              maxWidth:
                STOCK_LAYOUT.contentMaxWidth + STOCK_LAYOUT.contentPadding * 2,
              alignSelf: 'center',
              px: '$5',
              gap: STOCK_LAYOUT.columnGap,
              alignItems: 'flex-start',
            }
          : undefined)}
      >
        {/* Left column */}
        <YStack
          flex={1}
          minWidth={0}
          {...(isStockPage
            ? undefined
            : {
                borderRightWidth: '$px',
                borderRightColor: '$borderSubdued',
              })}
        >
          <TokenDetailHeader
            showFavoriteButton={showFavoriteButton}
            stockEntityIdentity={stockEntityIdentity}
            isStockLayout={isStockPage}
            showMediaAndSecurity={!isStockPage}
          />

          {showChartModeSwitch ? (
            <MarketChartPriceBar
              price={
                priceSource === 'token'
                  ? tokenDetail?.price
                  : (stockEntity?.underlyingPrice ?? tokenDetail?.price)
              }
              priceChangePercent={
                priceSource === 'token'
                  ? tokenDetail?.priceChange24hPercent
                  : (stockEntity?.underlyingPriceChange24H ??
                    tokenDetail?.priceChange24hPercent)
              }
              stock={tokenDetail?.stock}
              priceSource={priceSource}
              onPriceSourceChange={handlePriceSourceChange}
            />
          ) : null}

          <Stack
            h={
              isChartFullscreen
                ? undefined
                : chartHeight +
                  (isStockPage
                    ? MARKET_DETAIL_LAYOUT.stockChartBlockPaddingBottom
                    : 0)
            }
            pb={
              isStockPage && !isChartFullscreen
                ? MARKET_DETAIL_LAYOUT.stockChartBlockPaddingBottom
                : undefined
            }
            overflow="hidden"
            bg="$bgApp"
            zIndex={isChartFullscreen ? chartFullscreenZIndex : undefined}
            style={
              isChartFullscreen ? MARKET_CHART_FULLSCREEN_STYLE : undefined
            }
          >
            {isChartFullscreen && platformEnv.isDesktop ? (
              <Stack
                h={MARKET_DETAIL_LAYOUT.chartFullscreenHeaderFillHeight}
                bg="$bgApp"
                flexShrink={0}
              />
            ) : null}
            {isStockPage ? (
              <>
                {showLiteChart ? (
                  <>
                    <MarketLiteChartControls
                      range={liteChartRange}
                      onRangeChange={setLiteChartRange}
                    />
                    <MarketLiteChart
                      networkId={networkId}
                      tokenAddress={tokenAddress}
                      range={liteChartRange}
                      height={chartHeight - MARKET_CHART_TOOLBAR_HEIGHT}
                    />
                  </>
                ) : null}
                {/*
                  DEMO ONLY. Unmounting the Pro chart made every Lite/Pro
                  toggle a cold start: new iframe document, charting library,
                  bridge handshake and a full history backfill. Keeping it
                  mounted and hidden makes switching instant.

                  It is hidden with opacity rather than `display: none` so the
                  iframe keeps its box: a 0x0 resize would make TradingView
                  re-lay-out every time it came back. The cost is that the Pro
                  chart also boots while the page sits in Lite. Owning that
                  lifecycle properly (mount on first Pro use, then keep alive)
                  is the frontend team's call.
                */}
                <Stack
                  position="absolute"
                  left={0}
                  right={0}
                  top={0}
                  bottom={0}
                  opacity={showLiteChart ? 0 : 1}
                  pointerEvents={showLiteChart ? 'none' : 'auto'}
                >
                  {marketTradingView}
                </Stack>
              </>
            ) : (
              marketTradingView
            )}
          </Stack>

          <Stack
            minHeight={MARKET_DETAIL_LAYOUT.infoTabsHeight}
            borderTopWidth="$px"
            borderTopColor="$borderSubdued"
          >
            {isStockPage && stockEntity ? (
              <StockEntityTabs
                entity={stockEntity}
                portfolioData={portfolioData}
                isRefreshing={isRefreshing}
                tokenLogoUrl={tokenDetail?.logoUrl}
              />
            ) : (
              <LazyDesktopInformationTabs
                portfolioData={portfolioData}
                isRefreshing={isRefreshing}
                isBTCNetwork={isBTCNetwork}
                tokenLogoUrl={tokenDetail?.logoUrl}
              />
            )}
          </Stack>
        </YStack>

        {/* Right column */}
        <Stack w={isStockPage ? STOCK_LAYOUT.rightColumnWidth : 340}>
          <Stack
            w={isStockPage ? STOCK_LAYOUT.rightColumnWidth : 340}
            pb={platformEnv.isWeb ? '$12' : undefined}
          >
            {isStockPage ? null : <PerpetualTradingBanner pl="$3" pr="$5" />}
            {isStockPage ? (
              <StockTradePanel />
            ) : (
              <Stack pl="$3" pr="$5" pt="$4" pb="$3">
                <SwapPanel swapToken={swapToken} />
              </Stack>
            )}

            <Divider my="$1" />

            {isStockPage && stockEntity ? (
              <StockTrustPanel
                entity={stockEntity}
                instrument={selectedInstrument}
              />
            ) : (
              <>
                {isBTCMainnet ? null : (
                  <>
                    <TokenActivityOverview pl="$3" pr="$5" />
                    <Divider />
                  </>
                )}
                <TokenSupplementaryInfo />
              </>
            )}
          </Stack>
        </Stack>
      </XStack>
    </Stack>
  );
}
