import { useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import {
  NumberSizeableText,
  SizableText,
  XStack,
  YStack,
} from '@onekeyhq/components';
import type { IMarketStockInfo } from '@onekeyhq/shared/types/marketV2';

import { StockMarketStatusBadge } from '../../../components/PerpsBadges';

/** Which price series the chart header describes (Figma 25476:89067). */
export type IMarketPriceSource = 'share' | 'token';

const PRICE_SOURCE_OPTIONS: { value: IMarketPriceSource; label: string }[] = [
  // No translation keys yet — demo copy straight from the design.
  { value: 'share', label: 'Share Price' },
  { value: 'token', label: 'Token Price' },
];

function PriceSourceButton({
  option,
  isActive,
  onPress,
}: {
  option: { value: IMarketPriceSource; label: string };
  isActive: boolean;
  onPress: (value: IMarketPriceSource) => void;
}) {
  const handlePress = useCallback(
    () => onPress(option.value),
    [onPress, option.value],
  );

  return (
    <XStack
      alignItems="center"
      justifyContent="center"
      px={11}
      py={5}
      borderRadius="$full"
      borderCurve="continuous"
      bg={isActive ? '$bgStrong' : '$transparent'}
      cursor="pointer"
      userSelect="none"
      hoverStyle={isActive ? undefined : { bg: '$bgHover' }}
      pressStyle={{ bg: '$bgActive' }}
      onPress={handlePress}
      testID={`market-price-source-${option.value}`}
    >
      <SizableText
        size="$bodyMdMedium"
        color={isActive ? '$text' : '$textSubdued'}
      >
        {option.label}
      </SizableText>
    </XStack>
  );
}

/**
 * Price block above the chart (Figma 25227:67441). Stays mounted in both Lite
 * and Pro so the price remains visible after switching to the Pro chart, which
 * does not render it. Owns no state: the price source lives with the layout so
 * the trade panel's chart button can drive the same toggle.
 */
export function MarketChartPriceBar({
  price,
  priceChangePercent,
  stock,
  priceSource = 'share',
  onPriceSourceChange,
}: {
  price?: string;
  priceChangePercent?: string;
  stock?: IMarketStockInfo;
  priceSource?: IMarketPriceSource;
  onPriceSourceChange?: (value: IMarketPriceSource) => void;
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
  const changeColor = isUp ? '$textSuccess' : '$textCritical';

  return (
    <XStack px="$5" pt="$5" pb="$6" gap="$2" alignItems="flex-start">
      <YStack flex={1} minWidth={0} gap="$2">
        <XStack gap={14} alignItems="baseline">
          <NumberSizeableText
            size="$heading4xl"
            color="$text"
            formatter="price"
            formatterOptions={{ currency: '$' }}
          >
            {price ?? '-'}
          </NumberSizeableText>
          <XStack gap="$1.5" alignItems="center">
            {priceChangeValue ? (
              <NumberSizeableText
                size="$bodyLgMedium"
                color={changeColor}
                formatter="price"
                formatterOptions={{ currency: '$', showPlusMinusSigns: true }}
              >
                {priceChangeValue.toFixed()}
              </NumberSizeableText>
            ) : null}
            <XStack alignItems="center">
              <SizableText size="$bodyLgMedium" color={changeColor}>
                (
              </SizableText>
              <NumberSizeableText
                size="$bodyLgMedium"
                color={changeColor}
                formatter="priceChange"
                formatterOptions={{ showPlusMinusSigns: true }}
              >
                {priceChangePercent ?? '-'}
              </NumberSizeableText>
              <SizableText size="$bodyLgMedium" color={changeColor}>
                )
              </SizableText>
            </XStack>
          </XStack>
        </XStack>
        <StockMarketStatusBadge stock={stock} size="dot" />
      </YStack>

      {onPriceSourceChange ? (
        <XStack
          py="$1"
          gap="$0.5"
          alignItems="center"
          justifyContent="flex-end"
        >
          {PRICE_SOURCE_OPTIONS.map((option) => (
            <PriceSourceButton
              key={option.value}
              option={option}
              isActive={option.value === priceSource}
              onPress={onPriceSourceChange}
            />
          ))}
        </XStack>
      ) : null}
    </XStack>
  );
}
