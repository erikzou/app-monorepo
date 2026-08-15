import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useIntl } from 'react-intl';

import { Tabs, YStack } from '@onekeyhq/components';
import type { ITabContainerRef } from '@onekeyhq/components';
import { ETranslations } from '@onekeyhq/shared/src/locale';
import platformEnv from '@onekeyhq/shared/src/platformEnv';
import type { IMarketAccountPortfolioItem } from '@onekeyhq/shared/types/marketV2';

import { useTokenDetail } from '../../hooks/useTokenDetail';
import { Portfolio } from '../InformationTabs/components/Portfolio';
import { TransactionsHistory } from '../InformationTabs/components/TransactionsHistory';
import { useNetworkAccountAddress } from '../InformationTabs/hooks/useNetworkAccountAddress';
import { useMarketDetailTabsController } from '../InformationTabs/MarketDetailTabsController';

import { TopCoinOverview } from './TopCoinOverview';

/**
 * Main-column tabs of the top-coin assembly (Figma 25703:19139). Three tabs,
 * Overview first — a major is read before it is traded, which is the opposite
 * of the meme configuration where the tape leads.
 *
 * The tab bodies themselves are the shipped ones; only the set and their order
 * are configuration.
 */
export function TopCoinTabs({
  portfolioData,
  isRefreshing,
  tokenLogoUrl,
}: {
  portfolioData: IMarketAccountPortfolioItem[];
  isRefreshing?: boolean;
  tokenLogoUrl?: string;
}) {
  const intl = useIntl();
  const { tokenAddress, networkId, tokenDetail } = useTokenDetail();
  const { accountAddress } = useNetworkAccountAddress(networkId);
  const { registerTabs } = useMarketDetailTabsController();
  const tabsRef = useRef<ITabContainerRef>(
    null,
  ) as React.RefObject<ITabContainerRef>;

  const positionTabName = intl.formatMessage({
    id: ETranslations.dexmarket_details_myposition,
  });

  useEffect(() => {
    registerTabs(tabsRef.current, positionTabName);
    return () => registerTabs(null, '');
  }, [positionTabName, registerTabs]);

  const tabs = useMemo(
    () => [
      <Tabs.Tab
        key="overview"
        name={intl.formatMessage({ id: ETranslations.global_overview })}
      >
        <Tabs.ScrollView>
          <TopCoinOverview tokenDetail={tokenDetail} />
        </Tabs.ScrollView>
      </Tabs.Tab>,
      <Tabs.Tab
        key="transactions"
        name={intl.formatMessage({
          id: ETranslations.dexmarket_details_transactions,
        })}
      >
        <TransactionsHistory
          tokenAddress={tokenAddress}
          networkId={networkId}
        />
      </Tabs.Tab>,
      <Tabs.Tab key="portfolio" name={positionTabName}>
        <Portfolio
          portfolioData={portfolioData}
          isRefreshing={isRefreshing}
          accountAddress={accountAddress}
          tokenLogoUrl={tokenLogoUrl}
        />
      </Tabs.Tab>,
    ],
    [
      accountAddress,
      intl,
      isRefreshing,
      networkId,
      portfolioData,
      positionTabName,
      tokenAddress,
      tokenDetail,
      tokenLogoUrl,
    ],
  );

  const renderTabBar = useCallback(
    (props: any) => (
      <YStack bg="$bgApp">
        <Tabs.TabBar {...props} textSize="$bodyMdMedium" divider={false} />
      </YStack>
    ),
    [],
  );

  if (!networkId) {
    return null;
  }

  return (
    <Tabs.Container
      ref={tabsRef}
      renderTabBar={renderTabBar}
      disableScroll={!platformEnv.isNative}
    >
      {tabs}
    </Tabs.Container>
  );
}
