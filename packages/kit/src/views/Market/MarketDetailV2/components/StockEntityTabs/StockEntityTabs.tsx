import { useCallback, useMemo, useState } from 'react';

import { useIntl } from 'react-intl';

import { Button, SizableText, Stack, Tabs, YStack } from '@onekeyhq/components';
import { ETranslations } from '@onekeyhq/shared/src/locale';
import platformEnv from '@onekeyhq/shared/src/platformEnv';
import type {
  IMarketAccountPortfolioItem,
  IMarketStockEntity,
} from '@onekeyhq/shared/types/marketV2';

import { MarketTestIDs } from '../../../testIDs';
import { useTokenDetail } from '../../hooks/useTokenDetail';
import { useNetworkAccountAddress } from '../InformationTabs/hooks/useNetworkAccountAddress';

import { StockAbout } from './StockAbout';
import { StockAnalystRatings } from './StockAnalystRatings';
import { StockEvents } from './StockEvents';
import { StockNews } from './StockNews';
import { StockPositionTable } from './StockPositionTable';
import { StockSection } from './StockSection';
import { StockStatGrid } from './StockStatGrid';
import { useStockEntityStats } from './useStockEntityStats';

// Figma 25314:8898: three rows of three before the expander.
const COLLAPSED_STAT_COUNT = 9;

function StockOverviewTab({ entity }: { entity: IMarketStockEntity }) {
  const { keyData } = useStockEntityStats(entity);
  // Figma 25314:8898 / 25334:9342: nine cells collapsed, all eighteen plus the
  // freshness note expanded.
  const [showAllStats, setShowAllStats] = useState(false);
  const handleToggleStats = useCallback(
    () => setShowAllStats((prev) => !prev),
    [],
  );
  const visibleStats = showAllStats
    ? keyData
    : keyData.slice(0, COLLAPSED_STAT_COUNT);

  return (
    <Tabs.ScrollView>
      {/* Figma 25206:18271: the section list starts 8px under the tab row and
          every section carries its own 32px of vertical padding. The extra 32
          at the end keeps the last section off the bottom of the page. */}
      <YStack px="$5" pt="$2" pb="$8">
        <StockSection>
          <YStack gap="$6">
            <StockStatGrid items={visibleStats} />

            {/* The freshness note only belongs to the full set: our stock
                figures are hourly snapshots (quotes at :05, fundamentals at
                :35), so they can trail the realtime price by up to an hour.
                TODO(i18n): copy is a placeholder pending PM sign-off. */}
            {showAllStats ? (
              <SizableText size="$bodySm" color="$textDisabled">
                以上交易數據涵蓋盤前／盤中／盤後時段;休市或停牌時顯示最近一個交易日數據。
              </SizableText>
            ) : null}

            {/* Wrapped so the button hugs its label instead of stretching. */}
            <Stack alignSelf="flex-start">
              <Button
                testID={MarketTestIDs.stockStatsToggle}
                size="small"
                variant="tertiary"
                iconAfter={
                  showAllStats
                    ? 'ChevronTopSmallOutline'
                    : 'ChevronDownSmallOutline'
                }
                onPress={handleToggleStats}
              >
                {/* TODO(i18n): needs a translation key. */}
                {showAllStats ? 'Show less' : 'Show more'}
              </Button>
            </Stack>
          </YStack>
        </StockSection>

        <StockEvents />

        <StockAnalystRatings />

        <StockNews />

        <StockAbout entity={entity} />
      </YStack>
    </Tabs.ScrollView>
  );
}

/**
 * Main-column tabs for the stock page: Overview / My position. The Financials
 * tab stays hidden until the three financial statements have a source — its
 * ratios live in the Overview "More" expander meanwhile. On-chain tabs
 * (transactions, liquidity, holders list) are deliberately absent.
 */
export function StockEntityTabs({
  entity,
  portfolioData,
  isRefreshing,
  tokenLogoUrl,
}: {
  entity: IMarketStockEntity;
  portfolioData: IMarketAccountPortfolioItem[];
  isRefreshing?: boolean;
  tokenLogoUrl?: string;
}) {
  const intl = useIntl();
  const { networkId } = useTokenDetail();
  const { accountAddress } = useNetworkAccountAddress(networkId);

  // Positions light the tab up with a count, matching how the Holders tab
  // already advertises itself. (Spec offers "default-open or green dot"; the
  // count reuses an existing pattern and says more.)
  const positionCount = accountAddress ? portfolioData.length : 0;
  const positionTabName = useMemo(() => {
    const base = intl.formatMessage({
      id: ETranslations.dexmarket_details_myposition,
    });
    return positionCount > 0 ? `${base} (${positionCount})` : base;
  }, [intl, positionCount]);

  // Design's tab row (Figma 25233:40821): 16px medium labels, 20px side
  // padding, and no rule under the row — only the active item is underlined.
  const renderTabBar = useCallback(
    (props: any) => (
      <Tabs.TabBar {...props} divider={false} textSize="$bodyLgMedium" />
    ),
    [],
  );

  const tabs = useMemo(
    () => [
      <Tabs.Tab
        key="overview"
        name={intl.formatMessage({ id: ETranslations.global_overview })}
      >
        <StockOverviewTab entity={entity} />
      </Tabs.Tab>,
      <Tabs.Tab key="portfolio" name={positionTabName}>
        <Tabs.ScrollView>
          <YStack px="$5" pt={36} pb="$6">
            <StockPositionTable
              portfolioData={portfolioData}
              accountAddress={accountAddress}
              tokenLogoUrl={tokenLogoUrl}
              isRefreshing={isRefreshing}
            />
          </YStack>
        </Tabs.ScrollView>
      </Tabs.Tab>,
    ],
    [
      accountAddress,
      entity,
      intl,
      isRefreshing,
      portfolioData,
      positionTabName,
      tokenLogoUrl,
    ],
  );

  return (
    <Tabs.Container
      renderTabBar={renderTabBar}
      disableScroll={!platformEnv.isNative}
    >
      {tabs}
    </Tabs.Container>
  );
}
