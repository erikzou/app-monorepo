import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { useIntl } from 'react-intl';

import { Skeleton, Stack, XStack, YStack } from '@onekeyhq/components';
import { ETranslations } from '@onekeyhq/shared/src/locale';
import platformEnv from '@onekeyhq/shared/src/platformEnv';
import type { IMarketAccountPortfolioItem } from '@onekeyhq/shared/types/marketV2';
import type { ISwapToken } from '@onekeyhq/shared/types/swap/types';

import {
  STOCK_DETAIL_LAYOUT,
  StockAboutSection,
  StockDetailChartPanel,
  StockDetailHeader,
  StockDetailSection,
  StockDetailTabs,
  StockEventsSection,
  StockOverviewSection,
  StockTradeInfoList,
} from '../components/StockDetail';
import { SwapPanel } from '../components/SwapPanel/SwapPanel';

import {
  MARKET_CHART_FULLSCREEN_STYLE,
  MARKET_DETAIL_LAYOUT,
} from './marketDetailLayoutConsts';

enum EStockDetailTab {
  Overview = 'overview',
  MyPosition = 'myPosition',
}

export interface IStockDesktopLayoutProps {
  chart: ReactNode;
  isChartFullscreen: boolean;
  chartFullscreenZIndex?: number;
  swapToken: ISwapToken;
  portfolioData?: IMarketAccountPortfolioItem[];
  showFavoriteButton?: boolean;
}

/**
 * Desktop layout for tokenized stock detail pages (Figma 25206:9303).
 * Centered 1140 content frame: responsive left column plus a fixed 344 trade
 * column. Non-stock tokens keep using DesktopLayout.
 */
export function StockDesktopLayout({
  chart,
  isChartFullscreen,
  chartFullscreenZIndex,
  swapToken,
  portfolioData,
  showFavoriteButton = true,
}: IStockDesktopLayoutProps) {
  const intl = useIntl();
  const [activeTab, setActiveTab] = useState<string>(EStockDetailTab.Overview);

  const tabItems = useMemo(
    () => [
      {
        id: EStockDetailTab.Overview,
        label: intl.formatMessage({
          id: ETranslations.dexmarket_details_overview,
        }),
      },
      {
        id: EStockDetailTab.MyPosition,
        label: intl.formatMessage({
          id: ETranslations.dexmarket_details_myposition,
        }),
      },
    ],
    [intl],
  );

  const handleTabChange = useCallback((id: string) => setActiveTab(id), []);

  const chartBlock = (
    <Stack
      flex={1}
      overflow="hidden"
      bg="$bgApp"
      zIndex={isChartFullscreen ? chartFullscreenZIndex : undefined}
      style={isChartFullscreen ? MARKET_CHART_FULLSCREEN_STYLE : undefined}
    >
      {isChartFullscreen && platformEnv.isDesktop ? (
        <Stack
          h={MARKET_DETAIL_LAYOUT.chartFullscreenHeaderFillHeight}
          bg="$bgApp"
          flexShrink={0}
        />
      ) : null}
      {chart}
    </Stack>
  );

  return (
    <XStack justifyContent="center" pb={platformEnv.isWeb ? '$12' : undefined}>
      <YStack width="100%" maxWidth={STOCK_DETAIL_LAYOUT.contentMaxWidth}>
        <Stack pt="$5">
          <StockDetailHeader showFavoriteButton={showFavoriteButton} />
        </Stack>

        <XStack gap={STOCK_DETAIL_LAYOUT.columnGap} alignItems="flex-start">
          {/* Left column — responsive width */}
          <YStack flex={1} minWidth={0}>
            <StockDetailChartPanel chart={chartBlock} />

            <StockDetailTabs
              items={tabItems}
              value={activeTab}
              onChange={handleTabChange}
            />

            {activeTab === EStockDetailTab.Overview ? (
              <YStack>
                <StockOverviewSection />
                <StockEventsSection />
                <StockAboutSection />
              </YStack>
            ) : (
              // Position table is wired up in the data pass; the slot keeps
              // the tab switch usable in the meantime.
              <StockDetailSection gap="$3">
                <Skeleton w="100%" h={20} />
                <Skeleton w="100%" h={20} />
                <Skeleton w="60%" h={20} />
              </StockDetailSection>
            )}
          </YStack>

          {/* Right column — fixed trade panel */}
          <YStack width={STOCK_DETAIL_LAYOUT.rightColumnWidth}>
            <Stack px="$5" pt="$6" pb="$5">
              <SwapPanel
                swapToken={swapToken}
                portfolioData={portfolioData}
                panelVariant="stockDesktop"
              />
            </Stack>
            <StockTradeInfoList />
          </YStack>
        </XStack>
      </YStack>
    </XStack>
  );
}
