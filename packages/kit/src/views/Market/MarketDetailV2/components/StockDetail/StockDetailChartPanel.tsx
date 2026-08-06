import { useMemo } from 'react';
import type { ReactNode } from 'react';

import BigNumber from 'bignumber.js';

import {
  NumberSizeableText,
  SizableText,
  Skeleton,
  Stack,
  XStack,
  YStack,
} from '@onekeyhq/components';
import { useCurrency } from '@onekeyhq/kit/src/components/Currency';

import { StockMarketStatusBadge } from '../../../components/PerpsBadges';
import { PriceChangePercentage } from '../../../components/PriceChangePercentage';
import { useTokenDetail } from '../../hooks/useTokenDetail';

import { STOCK_DETAIL_LAYOUT } from './constants';

// Absolute 24h change is not returned by the API — derive it from the current
// price and the percentage so the row can render real numbers instead of a
// placeholder. price = base * (1 + pct / 100)  =>  change = price - base.
function useAbsolutePriceChange(price?: string, changePercent?: string) {
  return useMemo(() => {
    const priceBN = new BigNumber(price ?? '');
    const percentBN = new BigNumber(changePercent ?? '');
    if (!priceBN.isFinite() || !percentBN.isFinite()) {
      return undefined;
    }
    const divisor = percentBN.dividedBy(100).plus(1);
    if (divisor.isZero() || !divisor.isFinite()) {
      return undefined;
    }
    return priceBN.minus(priceBN.dividedBy(divisor));
  }, [price, changePercent]);
}

function PriceChangeRow({
  price,
  changePercent,
  currencySymbol,
}: {
  price?: string;
  changePercent?: string;
  currencySymbol: string;
}) {
  const absoluteChange = useAbsolutePriceChange(price, changePercent);
  const percentBN = new BigNumber(changePercent ?? '');

  if (!percentBN.isFinite()) {
    return <Skeleton w={140} h={20} />;
  }

  return (
    <XStack gap="$1" alignItems="center">
      {absoluteChange ? (
        <XStack alignItems="center">
          <SizableText size="$bodyMdMedium" color="$textSubdued">
            {absoluteChange.isNegative() ? '-' : '+'}
          </SizableText>
          <NumberSizeableText
            size="$bodyMdMedium"
            color="$textSubdued"
            formatter="price"
            formatterOptions={{ currency: currencySymbol }}
          >
            {absoluteChange.abs().toFixed()}
          </NumberSizeableText>
        </XStack>
      ) : null}
      <PriceChangePercentage size="$bodyMdMedium">
        {changePercent}
      </PriceChangePercentage>
    </XStack>
  );
}

/**
 * Chart block of the stock detail page (Figma 25227:67414). Owns the price
 * header and the fixed geometry of the chart box; the chart itself is passed
 * in unchanged so the Lite/Pro data-source work can land separately.
 */
export function StockDetailChartPanel({ chart }: { chart: ReactNode }) {
  const { tokenDetail } = useTokenDetail();
  const currencyInfo = useCurrency();

  const showConverted =
    currencyInfo.id !== 'usd' && Boolean(tokenDetail?.priceConverted);
  const price = showConverted
    ? tokenDetail?.priceConverted
    : tokenDetail?.price;
  const currencySymbol = showConverted ? currencyInfo.symbol : '$';

  return (
    <YStack px="$5" pb="$8" gap="$5">
      <YStack pt="$5" gap="$0.5">
        <XStack gap={14} alignItems="center">
          {price ? (
            <NumberSizeableText
              size="$heading4xl"
              color="$text"
              formatter="price"
              formatterOptions={{ currency: currencySymbol }}
            >
              {price}
            </NumberSizeableText>
          ) : (
            <Skeleton w={160} h={40} />
          )}
          <StockMarketStatusBadge stock={tokenDetail?.stock} size="lg" />
        </XStack>
        <PriceChangeRow
          price={price}
          changePercent={tokenDetail?.priceChange24hPercent}
          currencySymbol={currencySymbol}
        />
      </YStack>

      <Stack h={STOCK_DETAIL_LAYOUT.chartAreaHeight} overflow="hidden">
        {chart}
      </Stack>
    </YStack>
  );
}
