import { useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { NumberSizeableText, XStack, YStack } from '@onekeyhq/components';

/**
 * Price block above the chart. Stays mounted in both Lite and Pro so the price
 * remains visible after switching to the Pro chart, which does not render it.
 */
export function MarketChartPriceBar({
  price,
  priceChangePercent,
}: {
  price?: string;
  priceChangePercent?: string;
}) {
  // The API only carries the percentage; derive the absolute move so the header
  // can show "$ and %" side by side as the stock spec requires.
  const priceChangeValue = useMemo(() => {
    if (price === undefined || priceChangePercent === undefined) {
      return undefined;
    }
    const priceBN = new BigNumber(price);
    const percentBN = new BigNumber(priceChangePercent);
    if (!priceBN.isFinite() || !percentBN.isFinite()) {
      return undefined;
    }
    const ratio = percentBN.dividedBy(100).plus(1);
    if (ratio.isZero() || !ratio.isFinite()) {
      return undefined;
    }
    return priceBN.minus(priceBN.dividedBy(ratio));
  }, [price, priceChangePercent]);

  const isUp = priceChangeValue ? !priceChangeValue.isNegative() : true;

  return (
    <YStack px="$5" pt="$4" pb="$2" gap="$1">
      <NumberSizeableText
        size="$heading4xl"
        color="$text"
        formatter="price"
        formatterOptions={{ currency: '$' }}
      >
        {price ?? '-'}
      </NumberSizeableText>
      <XStack gap="$2" alignItems="center">
        {priceChangeValue ? (
          <NumberSizeableText
            size="$bodyMdMedium"
            color="$text"
            formatter="price"
            formatterOptions={{ currency: '$', showPlusMinusSigns: true }}
          >
            {priceChangeValue.toFixed()}
          </NumberSizeableText>
        ) : null}
        <NumberSizeableText
          size="$bodyMdMedium"
          color={isUp ? '$textSuccess' : '$textCritical'}
          formatter="priceChange"
          formatterOptions={{ showPlusMinusSigns: true }}
        >
          {priceChangePercent ?? '-'}
        </NumberSizeableText>
      </XStack>
    </YStack>
  );
}
