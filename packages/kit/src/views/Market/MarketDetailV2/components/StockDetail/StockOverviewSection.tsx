import { useCallback, useMemo, useState } from 'react';

import { useIntl } from 'react-intl';

import {
  Button,
  DashText,
  SizableText,
  Skeleton,
  XStack,
  YStack,
} from '@onekeyhq/components';
import { ETranslations } from '@onekeyhq/shared/src/locale';

import { useStockSecurityStats } from '../../hooks/useStockSecurityStats';
import { useTokenDetail } from '../../hooks/useTokenDetail';

import { StockDetailSection } from './StockDetailSection';

import type { IStatItem } from '../TokenOverview/components/StatCard';

const COLLAPSED_ITEM_COUNT = 8;
const GRID_COLUMN_WIDTH = '25%';

// No translation key exists for this note yet — the string ships in English
// until the copy is added to the locale pipeline.
const TRADING_DATA_DISCLAIMER =
  "Trading data above covers pre-market / market-open / post-market periods only. If the market is closed or trading is halted, the most recent trading day's data is shown.";

function StatGridItem({ item }: { item: IStatItem }) {
  return (
    <YStack width={GRID_COLUMN_WIDTH} pr="$2.5" gap="$1">
      {item.tooltip ? (
        <DashText
          size="$bodyMd"
          color="$textSubdued"
          dashThickness={0.5}
          tooltip={item.tooltip}
          tooltipTitle={item.label}
        >
          {item.label}
        </DashText>
      ) : (
        <SizableText size="$bodyMd" color="$textSubdued" numberOfLines={1}>
          {item.label}
        </SizableText>
      )}
      <SizableText size="$bodyLgMedium" color="$text" numberOfLines={1}>
        {item.value}
      </SizableText>
    </YStack>
  );
}

function StatGridSkeleton() {
  return (
    <XStack flexWrap="wrap" rowGap="$6">
      {Array.from({ length: COLLAPSED_ITEM_COUNT }).map((_, index) => (
        <YStack
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          width={GRID_COLUMN_WIDTH}
          pr="$2.5"
          gap="$1"
        >
          <Skeleton w={80} h={20} />
          <Skeleton w={64} h={24} />
        </YStack>
      ))}
    </XStack>
  );
}

/**
 * Overview tab body (Figma 25314:8898): a four-column stat grid that collapses
 * to two rows, the Show more toggle and the trading-data note.
 */
export function StockOverviewSection() {
  const intl = useIntl();
  const { tokenDetail } = useTokenDetail();
  const { assetAnalysisRows, tradingActivityRows } = useStockSecurityStats(
    tokenDetail?.stock,
  );
  const [isExpanded, setIsExpanded] = useState(false);

  const items = useMemo(
    () => [...assetAnalysisRows.flat(), ...tradingActivityRows.flat()],
    [assetAnalysisRows, tradingActivityRows],
  );

  const visibleItems = isExpanded
    ? items
    : items.slice(0, COLLAPSED_ITEM_COUNT);
  const canExpand = items.length > COLLAPSED_ITEM_COUNT;

  const handleToggle = useCallback(() => setIsExpanded((prev) => !prev), []);

  return (
    <StockDetailSection>
      {items.length === 0 ? (
        <StatGridSkeleton />
      ) : (
        <XStack flexWrap="wrap" rowGap="$6">
          {visibleItems.map((item) => (
            <StatGridItem key={item.label} item={item} />
          ))}
        </XStack>
      )}

      {canExpand ? (
        <XStack>
          <Button
            testID="market-stock-overview-show-more"
            variant="tertiary"
            size="small"
            iconAfter={
              isExpanded ? 'ChevronTopSmallOutline' : 'ChevronDownSmallOutline'
            }
            onPress={handleToggle}
          >
            {intl.formatMessage({
              id: isExpanded
                ? ETranslations.global_show_less
                : ETranslations.global_show_more,
            })}
          </Button>
        </XStack>
      ) : null}

      <SizableText size="$bodySm" color="$textDisabled">
        {TRADING_DATA_DISCLAIMER}
      </SizableText>
    </StockDetailSection>
  );
}
