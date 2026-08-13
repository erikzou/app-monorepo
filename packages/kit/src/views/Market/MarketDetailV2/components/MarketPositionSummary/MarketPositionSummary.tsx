import { useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import {
  Icon,
  NumberSizeableText,
  SizableText,
  Stack,
  XStack,
  YStack,
} from '@onekeyhq/components';
import type { IMarketAccountPortfolioItem } from '@onekeyhq/shared/types/marketV2';

import { useMarketDetailTabsController } from '../InformationTabs/MarketDetailTabsController';

const DIVIDER_HEIGHT = 24;

function sumField(
  items: IMarketAccountPortfolioItem[],
  read: (item: IMarketAccountPortfolioItem) => string | undefined,
) {
  return items.reduce((total, item) => {
    const value = new BigNumber(read(item) ?? '0');
    return value.isFinite() ? total.plus(value) : total;
  }, new BigNumber(0));
}

function SummaryItem({
  label,
  children,
  showDivider,
}: {
  label: string;
  children: React.ReactNode;
  showDivider: boolean;
}) {
  return (
    <XStack gap="$4" alignItems="center" pl="$0.5" flexShrink={0}>
      <YStack gap="$1">
        <SizableText size="$bodySm" color="$textSubdued">
          {label}
        </SizableText>
        {children}
      </YStack>
      {showDivider ? (
        <Stack w="$px" h={DIVIDER_HEIGHT} bg="$borderSubdued" />
      ) : null}
    </XStack>
  );
}

function PnlValue({ usd, percent }: { usd: BigNumber; percent: BigNumber }) {
  const color = usd.isNegative() ? '$textCritical' : '$textSuccess';
  return (
    <XStack alignItems="center">
      <NumberSizeableText
        size="$bodySmMedium"
        color={color}
        formatter="price"
        formatterOptions={{ currency: '$' }}
      >
        {usd.toFixed()}
      </NumberSizeableText>
      <SizableText size="$bodySmMedium" color={color}>
        {' ('}
      </SizableText>
      <NumberSizeableText
        size="$bodySmMedium"
        color={color}
        formatter="priceChange"
        formatterOptions={{ showPlusMinusSigns: true }}
      >
        {percent.toFixed()}
      </NumberSizeableText>
      <SizableText size="$bodySmMedium" color={color}>
        )
      </SizableText>
    </XStack>
  );
}

/**
 * Position summary above the sentiment block (Figma 25671:53629): what the
 * account holds in this token and how it is doing, with a chevron into the
 * My position tab.
 *
 * The whole row disappears when there is no position (Figma 25671:53214) —
 * an empty PnL strip would read as a flat position rather than as no position
 * at all.
 */
export function MarketPositionSummary({
  portfolioData,
}: {
  portfolioData: IMarketAccountPortfolioItem[];
}) {
  const { jumpToPositionTab } = useMarketDetailTabsController();

  const summary = useMemo(() => {
    const held = portfolioData.filter((item) =>
      new BigNumber(item.amount ?? '0').gt(0),
    );
    if (held.length === 0) {
      return undefined;
    }
    const holding = sumField(held, (item) => item.totalPrice);
    const totalPnl = sumField(held, (item) => item.pnl?.totalPnlUsd);
    const unrealizedPnl = sumField(held, (item) => item.pnl?.unrealizedPnlUsd);
    // Percentages are per position; with one position per page in practice the
    // first row's figure is the position's figure.
    const totalPnlPercent = new BigNumber(held[0].pnl?.totalPnlPercent ?? '0');
    const unrealizedPnlPercent = new BigNumber(
      held[0].pnl?.unrealizedPnlPercent ?? '0',
    );
    return {
      holding,
      totalPnl,
      unrealizedPnl,
      totalPnlPercent,
      unrealizedPnlPercent,
    };
  }, [portfolioData]);

  const handlePress = useCallback(() => {
    jumpToPositionTab();
  }, [jumpToPositionTab]);

  if (!summary) {
    return null;
  }

  return (
    <XStack
      px="$5"
      py="$3"
      gap="$3.5"
      alignItems="center"
      borderRadius="$2.5"
      borderCurve="continuous"
      cursor="pointer"
      userSelect="none"
      hoverStyle={{ bg: '$bgHover' }}
      pressStyle={{ bg: '$bgActive' }}
      onPress={handlePress}
      role="button"
      testID="market-detail-position-summary"
    >
      <XStack flex={1} minWidth={0} gap="$3.5" alignItems="center">
        {/* TODO(i18n): demo copy, hardcoded English. */}
        <SummaryItem label="Holding" showDivider>
          <NumberSizeableText
            size="$bodySmMedium"
            color="$text"
            formatter="price"
            formatterOptions={{ currency: '$' }}
          >
            {summary.holding.toFixed()}
          </NumberSizeableText>
        </SummaryItem>
        <SummaryItem label="Total PnL" showDivider>
          <PnlValue usd={summary.totalPnl} percent={summary.totalPnlPercent} />
        </SummaryItem>
        <SummaryItem label="Unrealized PnL" showDivider={false}>
          <PnlValue
            usd={summary.unrealizedPnl}
            percent={summary.unrealizedPnlPercent}
          />
        </SummaryItem>
      </XStack>
      <Icon name="ChevronRightSmallOutline" size="$5" color="$iconSubdued" />
    </XStack>
  );
}
