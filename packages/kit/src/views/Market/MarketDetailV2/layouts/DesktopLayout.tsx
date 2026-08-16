import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentProps, RefObject } from 'react';

import {
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
import type {
  IMarketChartMode,
  IMarketPriceSource,
} from '@onekeyhq/kit-bg/src/states/jotai/atoms';
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
  MarketDetailTabsProvider,
  useMarketDetailTabsController,
} from '../components/InformationTabs/MarketDetailTabsController';
import {
  MARKET_CHART_TOOLBAR_HEIGHT,
  MARKET_LITE_CHART_DEFAULT_RANGE,
  MarketChartModeSwitch,
  MarketChartPriceBar,
  MarketLiteChart,
  MarketLiteChartControls,
} from '../components/MarketLiteChart';
import { MarketPositionSummary } from '../components/MarketPositionSummary/MarketPositionSummary';
import { MarketChartFullscreenHeader } from '../components/MarketTradingView/MarketChartFullscreenHeader';
import { PerpetualTradingBanner } from '../components/PerpetualTradingBanner/PerpetualTradingBanner';
import { StockEntityTabs } from '../components/StockEntityTabs/StockEntityTabs';
import { StockTradePanel } from '../components/StockTradePanel/StockTradePanel';
import { StockTrustPanel } from '../components/StockTrustPanel/StockTrustPanel';
import { SwapPanel } from '../components/SwapPanel/SwapPanel';
import { TokenActivityOverview } from '../components/TokenActivityOverview/TokenActivityOverview';
import { CryptoDetailHeader } from '../components/TokenDetailHeader/CryptoDetailHeader';
import { CryptoHeaderStats } from '../components/TokenDetailHeader/CryptoHeaderStats';
import { TokenDetailHeader } from '../components/TokenDetailHeader/TokenDetailHeader';
import { TokenSupplementaryInfo } from '../components/TokenSupplementaryInfo/TokenSupplementaryInfo';
import { TopCoinTabs } from '../components/TopCoinTabs/TopCoinTabs';
import { TopCoinTradePanel } from '../components/TopCoinTradePanel/TopCoinTradePanel';
import { useMarketStockEntity } from '../hooks/useMarketStockEntity';
import {
  useMarketTradingViewParams,
  useTokenDetail,
} from '../hooks/useTokenDetail';
import { useTradingViewNativeInMarketDetail } from '../hooks/useTradingViewNativeInMarketDetail';
import { getMarketDetailTradingViewNativeSource } from '../utils/getMarketDetailTradingViewNativeSource';
import { isTopCoinToken } from '../utils/marketDetailAssembly';

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
  // Both assemblies now sit the chart under a price bar, so both carry the
  // same trailing gap before the tabs.
  chartBlockPaddingBottom: 32,
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

// Content frame shared by both detail assemblies — stocks (Figma 25271:8054)
// and crypto (Figma 25593:18400) are laid out on the same grid. The frame is
// fixed, so the left column takes whatever the trade panel leaves:
// 1240 - 24 - 384 = 832.
const DETAIL_CONTENT_FRAME = {
  contentMaxWidth: 1240,
  contentPadding: 20,
  rightColumnWidth: 384,
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

export function DesktopLayout(props: IDesktopLayoutProps) {
  // The position summary in the right column drives the main column's tabs, so
  // the handle between them is provided above both.
  return (
    <MarketDetailTabsProvider>
      <DesktopLayoutContent {...props} />
    </MarketDetailTabsProvider>
  );
}

function DesktopLayoutContent({
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

  // Lite/Pro chart. The stock assembly remembers the choice in a persisted
  // atom and opens on Lite; the crypto assembly opens on Pro and keeps the
  // choice for the visit only (remembering it is out of scope for this demo).
  const [{ mode: stockChartMode }] = useMarketChartModeAtom();
  const [cryptoChartMode, setCryptoChartMode] =
    useState<IMarketChartMode>('pro');
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
  // Three configurations of one skeleton: majors, stocks, and everything else.
  const isTopCoinPage = !isStockPage && isTopCoinToken({ networkId, isNative });
  const isCryptoPage = !isStockPage && !isTopCoinPage;
  const showChartModeSwitch = !isChartFullscreen;
  // Majors and stocks are read on the line chart; the meme configuration opens
  // on the candles.
  const chartMode = isCryptoPage ? cryptoChartMode : stockChartMode;
  const showLiteChart = showChartModeSwitch && chartMode === 'lite';
  const chartHeight = isCryptoPage
    ? MARKET_DETAIL_LAYOUT.chartHeight
    : MARKET_DETAIL_LAYOUT.stockChartHeight;

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
  // The stock page swaps its whole toolbar between Lite and Pro. Dropping the
  // expand control there keeps the Lite/Pro switch as the last item in both
  // toolbars, so toggling doesn't shift it sideways. The crypto toolbar is the
  // live one and keeps its expand control (Figma 25593:18426).
  const chartFullscreenChangeHandler = isCryptoPage
    ? handleChartFullscreenChange
    : undefined;
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
  // Both assemblies share the centered frame; only the column widths inside it
  // differ, and those are fixed by the frame itself.
  const { registerSection: registerTabsSection } =
    useMarketDetailTabsController();
  const contentFrameProps = useMemo(
    () => ({
      width: '100%' as const,
      maxWidth:
        DETAIL_CONTENT_FRAME.contentMaxWidth +
        DETAIL_CONTENT_FRAME.contentPadding * 2,
      alignSelf: 'center' as const,
      px: '$5' as const,
    }),
    [],
  );
  // The share/token price source is a stock-only control, so the crypto
  // assembly always reads the token's own figures.
  const useUnderlyingPrice = isStockPage && priceSource !== 'token';
  const stockPriceForSource = useUnderlyingPrice
    ? stockEntity?.underlyingPrice
    : undefined;
  const stockPriceChangeForSource = useUnderlyingPrice
    ? stockEntity?.underlyingPriceChange24H
    : undefined;

  const chartModeSwitch = useMemo(
    () =>
      isCryptoPage ? (
        <MarketChartModeSwitch
          mode={cryptoChartMode}
          onModeChange={setCryptoChartMode}
        />
      ) : (
        <MarketChartModeSwitch />
      ),
    [cryptoChartMode, isCryptoPage],
  );
  const marketTradingView = useMemo(() => {
    if (useTradingViewNative) {
      return networkId ? (
        <TradingViewNative
          testID={MarketTestIDs.detailChart}
          source={tradingViewNativeSource}
          enableNativeChartSettings
          nativeControlsLayoutMode="desktop"
          nativeChartRightGroupTrailingControl={
            showChartModeSwitch ? chartModeSwitch : undefined
          }
          nativeChartControlsPaddingHorizontal={0}
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
        chartModeControl={showChartModeSwitch ? chartModeSwitch : undefined}
        chartControlsPaddingHorizontal={0}
        isNativeChartFullscreen={isChartFullscreen}
        showNativeIndicatorQuickBar={false}
        onNativeChartFullscreenChange={chartFullscreenChangeHandler}
      />
    );
  }, [
    chartFullscreenChangeHandler,
    chartModeSwitch,
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
      {/* Both assemblies follow the design's centered 1240 content frame
          (stocks: Figma 25366:45088, crypto: Figma 25593:18400), shared with
          the list page. The 20px side padding keeps the content off the window
          edge below that width, so the inner box is still exactly 1240 on a
          1440 viewport. */}
      <YStack {...contentFrameProps} pt="$5">
        {isCryptoPage ? (
          <CryptoDetailHeader showFavoriteButton={showFavoriteButton} />
        ) : (
          <TokenDetailHeader
            showFavoriteButton={showFavoriteButton}
            stockEntityIdentity={
              stockEntityIdentity ??
              (isTopCoinPage && tokenDetail
                ? { ticker: tokenDetail.symbol, name: tokenDetail.name }
                : undefined)
            }
            isStockLayout
            isTopCoinLayout={isTopCoinPage}
            showMediaAndSecurity={false}
          />
        )}
      </YStack>

      <XStack
        {...contentFrameProps}
        gap={DETAIL_CONTENT_FRAME.columnGap}
        alignItems="flex-start"
      >
        {/* Left column */}
        <YStack flex={1} minWidth={0}>
          {showChartModeSwitch ? (
            <MarketChartPriceBar
              price={stockPriceForSource ?? tokenDetail?.price}
              priceChangePercent={
                stockPriceChangeForSource ?? tokenDetail?.priceChange24hPercent
              }
              stock={tokenDetail?.stock}
              // Stocks pair the percentage with the absolute move and offer the
              // share/token source toggle; crypto shows the percentage alone
              // and fills the trailing slot with its header stats
              // (Figma 25593:18426).
              showPriceChangeValue={!isCryptoPage}
              priceSource={priceSource}
              onPriceSourceChange={
                isStockPage ? handlePriceSourceChange : undefined
              }
              /* Majors carry no header stats: the Overview tab right below
                 already leads with them (Figma 25703:19145). */
              trailingSlot={isCryptoPage ? <CryptoHeaderStats /> : undefined}
            />
          ) : null}

          <Stack
            h={
              isChartFullscreen
                ? undefined
                : chartHeight + MARKET_DETAIL_LAYOUT.chartBlockPaddingBottom
            }
            pb={
              isChartFullscreen
                ? undefined
                : MARKET_DETAIL_LAYOUT.chartBlockPaddingBottom
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
            {showLiteChart ? (
              <>
                <MarketLiteChartControls
                  range={liteChartRange}
                  onRangeChange={setLiteChartRange}
                  trailingControl={chartModeSwitch}
                />
                <MarketLiteChart
                  networkId={networkId}
                  tokenAddress={tokenAddress}
                  range={liteChartRange}
                  height={chartHeight - MARKET_CHART_TOOLBAR_HEIGHT}
                  symbol={isTopCoinPage ? tokenDetail?.symbol : undefined}
                />
              </>
            ) : (
              /*
                The Pro chart is mounted only while it is on screen. Keeping it
                alive behind the Lite chart avoided a cold start, but the hidden
                iframe never re-laid-out after the box changed and came back
                blank. Correctness wins here; owning the lifecycle properly
                (mount once, keep alive, resize on show) is the frontend team's
                call.

                The gutter lives here rather than inside the toolbar (hence the
                0 passed to the chart), so the toolbar row and the chart body
                sit on the same line as the price bar and the tabs.
              */
              <Stack
                flex={1}
                px={DETAIL_CONTENT_FRAME.contentPadding}
                pb="$4"
                minWidth={0}
              >
                {marketTradingView}
              </Stack>
            )}
          </Stack>

          <Stack
            ref={registerTabsSection as any}
            minHeight={MARKET_DETAIL_LAYOUT.infoTabsHeight}
          >
            {isTopCoinPage ? (
              <TopCoinTabs
                portfolioData={portfolioData}
                isRefreshing={isRefreshing}
                tokenLogoUrl={tokenDetail?.logoUrl}
              />
            ) : null}
            {isStockPage && stockEntity ? (
              <StockEntityTabs
                entity={stockEntity}
                portfolioData={portfolioData}
                isRefreshing={isRefreshing}
                tokenLogoUrl={tokenDetail?.logoUrl}
              />
            ) : null}
            {isCryptoPage ? (
              <LazyDesktopInformationTabs
                portfolioData={portfolioData}
                isRefreshing={isRefreshing}
                isBTCNetwork={isBTCNetwork}
                tokenLogoUrl={tokenDetail?.logoUrl}
              />
            ) : null}
          </Stack>
        </YStack>

        {/* Right column — the same 384 slot on both assemblies, holding a
            different stack of blocks (Figma 25671:53496). */}
        <Stack w={DETAIL_CONTENT_FRAME.rightColumnWidth}>
          <Stack
            w={DETAIL_CONTENT_FRAME.rightColumnWidth}
            pb={platformEnv.isWeb ? '$12' : undefined}
          >
            {isCryptoPage ? <PerpetualTradingBanner px="$5" /> : null}
            {isStockPage ? <StockTradePanel /> : null}
            {isTopCoinPage ? <TopCoinTradePanel swapToken={swapToken} /> : null}
            {isCryptoPage ? (
              // Figma 25651:52423: the widget opens 24 below the column top
              // and closes 20 above the position summary.
              <Stack px="$5" pt="$6" pb="$5">
                <SwapPanel swapToken={swapToken} panelVariant="memeDesktop" />
              </Stack>
            ) : null}

            {isStockPage && stockEntity ? (
              <StockTrustPanel
                entity={stockEntity}
                instrument={selectedInstrument}
              />
            ) : null}
            {isCryptoPage ? (
              <>
                <MarketPositionSummary portfolioData={portfolioData} />
                {isBTCMainnet ? null : (
                  <TokenActivityOverview px="$5" variant="merged" />
                )}
                <TokenSupplementaryInfo />
              </>
            ) : null}
          </Stack>
        </Stack>
      </XStack>
    </Stack>
  );
}
