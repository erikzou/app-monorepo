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
import { StockEvents } from './StockEvents';
import { StockPositionTable } from './StockPositionTable';
import { StockStatGrid } from './StockStatGrid';
import { useStockEntityStats } from './useStockEntityStats';

function StockOverviewTab({ entity }: { entity: IMarketStockEntity }) {
  const { keyData, financials } = useStockEntityStats(entity);
  // The remaining ratios sit behind a toggle: there is not enough financial
  // data yet to justify a tab of their own.
  const [showMoreStats, setShowMoreStats] = useState(false);
  const handleToggleStats = useCallback(
    () => setShowMoreStats((prev) => !prev),
    [],
  );

  return (
    <Tabs.ScrollView>
      <YStack px="$5" py="$6" gap="$10">
        <YStack gap="$6">
          <StockStatGrid items={keyData} />

          {showMoreStats ? <StockStatGrid items={financials} /> : null}

          {/* Wrapped so the button hugs its label instead of stretching, while
              the grids above still span the full column. */}
          <Stack alignSelf="flex-start">
            <Button
              testID={MarketTestIDs.stockStatsToggle}
              size="small"
              variant="tertiary"
              iconAfter={
                showMoreStats
                  ? 'ChevronTopSmallOutline'
                  : 'ChevronDownSmallOutline'
              }
              onPress={handleToggleStats}
            >
              {showMoreStats ? 'Show less' : 'Show more'}
            </Button>
          </Stack>

          {/*
            Our stock figures are hourly snapshots (quotes at :05, fundamentals
            at :35), so they can trail the realtime price on the trend and
            search pages by up to an hour. This line states how fresh the
            numbers are and which sessions they cover, so it stays visible at
            all times — a tooltip would hide exactly the caveat that matters.
            Copy is a placeholder pending PM sign-off, and still needs an i18n
            key (generated locale files are off-limits here).
          */}
          <SizableText size="$bodySm" color="$textDisabled">
            以上交易數據涵蓋盤前／盤中／盤後時段;休市或停牌時顯示最近一個交易日數據。
          </SizableText>
        </YStack>

        <StockEvents />

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
const TAB_BAR_CONTAINER_STYLE = { px: '$5' } as const;

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
      <Tabs.TabBar
        {...props}
        divider={false}
        textSize="$bodyLgMedium"
        containerStyle={TAB_BAR_CONTAINER_STYLE}
      />
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
          <YStack px="$5" py="$5">
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
