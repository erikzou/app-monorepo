import { memo, useContext, useMemo } from 'react';

import { useIntl } from 'react-intl';

import {
  ListEndIndicator,
  SizableText,
  Stack,
  Table,
  YStack,
  useMedia,
  useScrollContentTabBarOffset,
} from '@onekeyhq/components';
import { ETranslations } from '@onekeyhq/shared/src/locale';
import platformEnv from '@onekeyhq/shared/src/platformEnv';

import { usePerpsNavigation } from '../../../hooks/usePerpsNavigation';
import { DesktopStickyHeaderContext } from '../../layouts/DesktopStickyHeaderContext';
import {
  MARKET_HOME_TABLE_HEADER_HEIGHT,
  MARKET_HOME_TABLE_PADDING,
  MARKET_HOME_TABLE_ROW_HEIGHT,
} from '../../utils/marketHomeLayout';
import { StickyHeaderPortal } from '../StickyHeaderPortal';

import { useMarketPerpsTokenList } from './hooks/useMarketPerpsTokenList';
import { usePerpsColumns } from './hooks/usePerpsColumns';
import { useSyncedMarketPerpsCategory } from './hooks/useSyncedMarketPerpsCategory';
import { MarketPerpsCategorySelector } from './MarketPerpsCategorySelector';

import type { IMarketPerpsToken } from './hooks/useMarketPerpsTokenList';

// Demo alignment with the Stocks table (Figma 25473:87731): same 36 header,
// same 72 rows. Contents are untouched.
const PERPS_ROW_PROPS = { minHeight: MARKET_HOME_TABLE_ROW_HEIGHT } as const;
const PERPS_HEADER_ROW_PROPS = {
  minHeight: MARKET_HOME_TABLE_HEADER_HEIGHT,
  alignItems: 'center',
} as const;

type IMarketPerpsTokenListProps = {
  tabIntegrated?: boolean;
  tabName?: string;
  listContainerProps?: {
    paddingBottom: number;
  };
};

function MarketPerpsTokenListImpl({
  tabIntegrated,
  tabName,
  listContainerProps,
}: IMarketPerpsTokenListProps) {
  const { navigateToPerps } = usePerpsNavigation();
  const intl = useIntl();
  const { md } = useMedia();

  const {
    perpsCategories: categoryTabs,
    selectedCategoryId,
    handleSelectCategory,
  } = useSyncedMarketPerpsCategory();

  const { tokens, isLoading, hasRealTimeData } = useMarketPerpsTokenList({
    selectedCategoryId,
  });

  const perpsColumns = usePerpsColumns();

  const handleTokenPress = navigateToPerps;

  const CategorySelector = useMemo(
    () => (
      <MarketPerpsCategorySelector
        categories={categoryTabs}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={handleSelectCategory}
        containerStyle={{
          px: '$4',
          pt: '$3',
          pb: '$2',
        }}
      />
    ),
    [categoryTabs, handleSelectCategory, selectedCategoryId],
  );

  const showSkeleton = Boolean(isLoading) && tokens.length === 0;

  const tabBarHeight = useScrollContentTabBarOffset();

  const TableEmptyComponent = useMemo(() => {
    if (isLoading) return null;
    return (
      <Stack flex={1} alignItems="center" justifyContent="center" p="$8">
        <SizableText size="$bodyLg" color="$textSubdued">
          {intl.formatMessage({ id: ETranslations.global_no_data })}
        </SizableText>
      </Stack>
    );
  }, [isLoading, intl]);

  const TableFooterComponent = useMemo(() => {
    if (!isLoading && tokens.length > 0) {
      return <ListEndIndicator />;
    }
    return null;
  }, [isLoading, tokens.length]);

  const webTabIntegrated = tabIntegrated && !platformEnv.isNative;

  // Desktop sticky header: portal the category selector + column header
  // into the renderTabBar area so they stick when scrolling.
  const stickyHeaderCtx = useContext(DesktopStickyHeaderContext);
  const stickyPortalTarget = stickyHeaderCtx?.portalTarget ?? null;
  const isTabFocused = !tabName || stickyHeaderCtx?.activeTabName === tabName;
  const useDesktopPortal = webTabIntegrated && !!stickyPortalTarget && !md;

  const portalContent = useMemo(() => {
    if (!useDesktopPortal || !isTabFocused || !stickyPortalTarget) return null;
    return (
      <StickyHeaderPortal target={stickyPortalTarget}>
        <YStack bg="$bgApp">
          {/* Demo alignment with Stocks: the category strip carries its own
              padding and the header row sits on the table's own inset. */}
          <Stack width="100%">{CategorySelector}</Stack>
          <Stack px={MARKET_HOME_TABLE_PADDING}>
            <Table.HeaderRow
              columns={perpsColumns}
              headerRowProps={PERPS_HEADER_ROW_PROPS}
            />
          </Stack>
        </YStack>
      </StickyHeaderPortal>
    );
  }, [
    useDesktopPortal,
    isTabFocused,
    stickyPortalTarget,
    CategorySelector,
    perpsColumns,
  ]);

  let integratedContentPaddingBottom = tabBarHeight;
  if (platformEnv.isNativeAndroid) {
    integratedContentPaddingBottom = listContainerProps?.paddingBottom ?? 104;
  } else if (webTabIntegrated) {
    integratedContentPaddingBottom =
      listContainerProps?.paddingBottom ?? tabBarHeight;
  }

  const tableContentContainerStyle = tabIntegrated
    ? {
        paddingTop: 8 + (platformEnv.isNative ? 150 : 0),
        paddingBottom: integratedContentPaddingBottom,
      }
    : {
        paddingBottom: platformEnv.isNativeAndroid ? 104 : tabBarHeight,
      };

  return (
    <Stack flex={1} width="100%">
      {portalContent}
      {useDesktopPortal ? null : CategorySelector}
      <Stack
        flex={1}
        className="normal-scrollbar"
        style={{
          paddingTop: 4,
          overflowX: 'auto',
          ...(md ? { marginLeft: 8, marginRight: 8 } : {}),
        }}
      >
        <Stack flex={1} minHeight={platformEnv.isNative ? undefined : 400}>
          {showSkeleton ? (
            <Table.Skeleton
              columns={perpsColumns}
              count={20}
              rowProps={PERPS_ROW_PROPS}
            />
          ) : (
            <Table<IMarketPerpsToken>
              contentContainerStyle={tableContentContainerStyle}
              stickyHeader
              showHeader={!useDesktopPortal}
              tabIntegrated={tabIntegrated}
              scrollEnabled={!webTabIntegrated}
              columns={perpsColumns}
              dataSource={tokens}
              keyExtractor={(item) => item.name}
              estimatedItemSize={MARKET_HOME_TABLE_ROW_HEIGHT}
              rowProps={PERPS_ROW_PROPS}
              headerRowProps={PERPS_HEADER_ROW_PROPS}
              extraData={hasRealTimeData}
              TableEmptyComponent={TableEmptyComponent}
              TableFooterComponent={TableFooterComponent}
              onRow={(item) => ({
                onPress: () => handleTokenPress(item.name),
              })}
            />
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}

export const MarketPerpsTokenList = memo(MarketPerpsTokenListImpl);
export type { IMarketPerpsTokenListProps };
