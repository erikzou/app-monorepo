import {
  Badge,
  Icon,
  NumberSizeableText,
  SizableText,
  XStack,
  YStack,
} from '@onekeyhq/components';
import type { IMarketTokenDetail } from '@onekeyhq/shared/types/marketV2';

import { StockSection } from '../StockEntityTabs/StockSection';

import { useTopCoinOverviewData } from './useTopCoinOverviewData';

import type {
  ITopCoinPerformanceItem,
  ITopCoinStat,
} from './useTopCoinOverviewData';

const STAT_COLUMNS = 3;
const PLACEHOLDER = '--';

/**
 * DEMO COPY — the staking entry has no APY source wired here. The row is real
 * UI (it is how the design surfaces Earn from the coin page); the numbers are
 * placeholders until the Earn quote is read.
 */
const DEMO_EARN_APY = '1.61';
const DEMO_EARN_YEARLY = '0.26';

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

function StatCell({ item }: { item: ITopCoinStat }) {
  return (
    <YStack
      gap="$1.5"
      pr="$2.5"
      flexGrow={1}
      flexShrink={1}
      flexBasis={0}
      minWidth={0}
    >
      <SizableText size="$bodyMd" color="$textSubdued">
        {item.label}
      </SizableText>
      <XStack alignItems="center" gap="$2">
        <NumberSizeableText
          size="$headingXl"
          color="$text"
          formatter="marketCap"
          formatterOptions={
            item.key === 'circulatingSupply' || item.key === 'totalSupply'
              ? undefined
              : { currency: '$', capAtMaxT: true }
          }
        >
          {item.value}
        </NumberSizeableText>
        {item.badge ? (
          <Badge badgeSize="sm" badgeType="default">
            {item.badge}
          </Badge>
        ) : null}
      </XStack>
    </YStack>
  );
}

function PerformanceCell({ item }: { item: ITopCoinPerformanceItem }) {
  const isDown = Number(item.changePercent) < 0;
  return (
    <YStack
      gap="$1.5"
      pr="$2.5"
      flexGrow={1}
      flexShrink={1}
      flexBasis={0}
      minWidth={0}
    >
      <SizableText size="$bodyMd" color="$textSubdued">
        {item.label}
      </SizableText>
      {item.changePercent === undefined ? (
        <SizableText size="$bodyLgMedium" color="$textSubdued">
          {PLACEHOLDER}
        </SizableText>
      ) : (
        <NumberSizeableText
          size="$bodyLgMedium"
          color={isDown ? '$textCritical' : '$textSuccess'}
          formatter="priceChange"
          formatterOptions={{ showPlusMinusSigns: true }}
        >
          {item.changePercent}
        </NumberSizeableText>
      )}
      {item.price ? (
        <NumberSizeableText
          size="$bodyMd"
          color="$textSubdued"
          formatter="price"
          formatterOptions={{ currency: '$' }}
        >
          {item.price}
        </NumberSizeableText>
      ) : (
        <SizableText size="$bodyMd" color="$textSubdued">
          {PLACEHOLDER}
        </SizableText>
      )}
    </YStack>
  );
}

/**
 * Overview tab of the top-coin assembly (Figma 25703:19144): the headline
 * figures, the 24h range, longer-window performance, the Earn entry and the
 * description — in that order, each in the same section shell the stock
 * Overview uses.
 */
export function TopCoinOverview({
  tokenDetail,
}: {
  tokenDetail?: IMarketTokenDetail;
}) {
  const { stats, range, performance, symbol } =
    useTopCoinOverviewData(tokenDetail);
  const priceChange24h = tokenDetail?.priceChange24hPercent;
  const isDown24h = Number(priceChange24h ?? 0) < 0;

  return (
    <YStack px="$5" pb="$8">
      <StockSection>
        <YStack gap="$6">
          {chunk(stats, STAT_COLUMNS).map((row) => (
            <XStack key={row[0].key}>
              {row.map((item) => (
                <StatCell key={item.key} item={item} />
              ))}
            </XStack>
          ))}
        </YStack>
      </StockSection>

      {/* TODO(i18n): demo copy, hardcoded English. */}
      <StockSection title="24h Range">
        <XStack>
          <YStack
            gap="$1.5"
            flexGrow={1}
            flexShrink={1}
            flexBasis={0}
            minWidth={0}
          >
            <SizableText size="$bodyMd" color="$textSubdued">
              24h High
            </SizableText>
            {range ? (
              <NumberSizeableText
                size="$headingXl"
                color="$text"
                formatter="price"
                formatterOptions={{ currency: '$' }}
              >
                {range.high}
              </NumberSizeableText>
            ) : (
              <SizableText size="$headingXl">{PLACEHOLDER}</SizableText>
            )}
          </YStack>
          <YStack
            gap="$1.5"
            flexGrow={1}
            flexShrink={1}
            flexBasis={0}
            minWidth={0}
          >
            <SizableText size="$bodyMd" color="$textSubdued">
              24h Low
            </SizableText>
            {range ? (
              <NumberSizeableText
                size="$headingXl"
                color="$text"
                formatter="price"
                formatterOptions={{ currency: '$' }}
              >
                {range.low}
              </NumberSizeableText>
            ) : (
              <SizableText size="$headingXl">{PLACEHOLDER}</SizableText>
            )}
          </YStack>
          <YStack
            gap="$1.5"
            flexGrow={1}
            flexShrink={1}
            flexBasis={0}
            minWidth={0}
          >
            <SizableText size="$bodyMd" color="$textSubdued">
              24h Change
            </SizableText>
            {priceChange24h === undefined ? (
              <SizableText size="$headingXl">{PLACEHOLDER}</SizableText>
            ) : (
              <NumberSizeableText
                size="$headingXl"
                color={isDown24h ? '$textCritical' : '$textSuccess'}
                formatter="priceChange"
                formatterOptions={{ showPlusMinusSigns: true }}
              >
                {priceChange24h}
              </NumberSizeableText>
            )}
          </YStack>
        </XStack>
      </StockSection>

      <StockSection title="Performance">
        <XStack>
          {performance.map((item) => (
            <PerformanceCell key={item.key} item={item} />
          ))}
        </XStack>
      </StockSection>

      <StockSection title={symbol ? `Earn ${symbol}` : 'Earn'}>
        <XStack
          gap="$4"
          alignItems="center"
          px="$2"
          mx="$-2"
          py="$2"
          borderRadius="$3"
          borderCurve="continuous"
          // Hover only until the row has somewhere to go: the Earn entry is
          // not wired in this demo, and a pointer cursor on a dead row is
          // worse than none.
          hoverStyle={{ bg: '$bgHover' }}
        >
          <Icon name="ChartTrendingUpOutline" size="$10" color="$iconSuccess" />
          <YStack flex={1} minWidth={0} gap="$1">
            <SizableText size="$bodyLgMedium" color="$text">
              {`Earn ${DEMO_EARN_APY}% APY on your ${symbol}`}
            </SizableText>
            <SizableText size="$bodyMd" color="$textSubdued">
              {`Your balance could earn up to $${DEMO_EARN_YEARLY} /yr`}
            </SizableText>
          </YStack>
          <Icon
            name="ChevronRightSmallOutline"
            size="$5"
            color="$iconSubdued"
            flexShrink={0}
          />
        </XStack>
      </StockSection>

      <StockSection title={symbol ? `About ${symbol}` : 'About'}>
        <SizableText size="$bodyMd" color="$textSubdued">
          {tokenDetail?.name
            ? `${tokenDetail.name} is one of the assets tracked by this market. A full description is not carried on the detail payload yet.`
            : PLACEHOLDER}
        </SizableText>
      </StockSection>
    </YStack>
  );
}
