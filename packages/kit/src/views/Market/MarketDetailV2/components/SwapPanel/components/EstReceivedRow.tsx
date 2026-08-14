import { useMemo } from 'react';

import BigNumber from 'bignumber.js';

import {
  Icon,
  NumberSizeableText,
  SizableText,
  Skeleton,
  XStack,
  YStack,
} from '@onekeyhq/components';

const PLACEHOLDER = '--';
const EST_RECEIVED_ROW_HEIGHT = 40;

/**
 * DEMO VALUE — price impact has no source in the panel: the figure only exists
 * on a quote, and the crypto panel prices its output off the market rate. The
 * number is derived from the input so it moves as the user types instead of
 * sitting frozen, and it is formatted like the real thing (sign, color, two
 * decimals). Replace it with the quote's impact.
 */
function getDemoPriceImpact(amount: BigNumber) {
  if (!amount.isFinite() || amount.lte(0)) {
    return undefined;
  }
  const digits = amount.toFixed();
  let hash = 0;
  for (let i = 0; i < digits.length; i += 1) {
    hash = (hash * 31 + digits.charCodeAt(i)) % 997;
  }
  return new BigNumber(-((hash % 90) + 5)).dividedBy(1000);
}

/**
 * "Est received" row of the crypto trade panel (Figma 25671:53586). It holds
 * its place with a `--` placeholder before an amount is entered, so the action
 * button underneath never jumps when the estimate appears — the same shape the
 * stock panel uses.
 *
 * Rate, provider, slippage and fees are deliberately absent: they all live in
 * the Review order dialog, and repeating them here would give the panel two
 * places to disagree.
 */
export function EstReceivedRow({
  amount,
  rate,
  receiveTokenSymbol,
  receiveTokenPrice,
  loading,
}: {
  amount: BigNumber;
  rate?: number;
  receiveTokenSymbol?: string;
  // Priced on what arrives, not on what is paid — the row is about the output.
  receiveTokenPrice?: string;
  loading?: boolean;
}) {
  // Without an amount there is nothing to estimate, so the row shows its
  // placeholder rather than a spinner — a quote is only pending once the user
  // has typed something.
  const hasAmount = amount.isFinite() && amount.gt(0);
  const estimate = useMemo(() => {
    if (!amount.isFinite() || amount.lte(0) || !rate) {
      return undefined;
    }
    const receiveAmount = amount.multipliedBy(rate);
    if (!receiveAmount.isFinite()) {
      return undefined;
    }
    const priceBN = new BigNumber(receiveTokenPrice ?? '0');
    const fiatValue =
      priceBN.isFinite() && priceBN.gt(0)
        ? receiveAmount.multipliedBy(priceBN)
        : undefined;
    return {
      receiveAmount,
      fiatValue,
      impact: getDemoPriceImpact(amount),
    };
  }, [amount, rate, receiveTokenPrice]);

  return (
    // Fixed height: the value is one line before an amount is entered and two
    // after it, and the row must not grow when it changes — that would push the
    // action button down under the pointer (Figma 25672:55995).
    <XStack h={EST_RECEIVED_ROW_HEIGHT} alignItems="center" gap="$2">
      <XStack flex={1} minWidth={0} alignItems="center" gap="$1.5">
        <Icon name="HandCoinsOutline" size="$4" color="$iconSubdued" />
        {/* TODO(i18n): demo copy, hardcoded English. */}
        <SizableText size="$bodyMd" color="$textSubdued">
          Est received
        </SizableText>
      </XStack>

      {loading && hasAmount ? (
        <Skeleton width="$24" height="$5" />
      ) : (
        <YStack alignItems="flex-end" justifyContent="center" flexShrink={0}>
          {estimate ? (
            <>
              <NumberSizeableText
                size="$bodyMdMedium"
                color="$text"
                formatter="balance"
                formatterOptions={{ tokenSymbol: receiveTokenSymbol }}
              >
                {estimate.receiveAmount.toFixed()}
              </NumberSizeableText>
              <XStack alignItems="center" gap="$1">
                {estimate.fiatValue ? (
                  <NumberSizeableText
                    size="$bodySm"
                    color="$textSubdued"
                    formatter="value"
                    formatterOptions={{ currency: '$' }}
                  >
                    {estimate.fiatValue.toFixed()}
                  </NumberSizeableText>
                ) : null}
                {estimate.impact ? (
                  <XStack alignItems="center">
                    <SizableText size="$bodySm" color="$textSubdued">
                      (
                    </SizableText>
                    <NumberSizeableText
                      size="$bodySm"
                      color="$textSubdued"
                      formatter="priceChange"
                      formatterOptions={{ showPlusMinusSigns: true }}
                    >
                      {estimate.impact.toFixed(2)}
                    </NumberSizeableText>
                    <SizableText size="$bodySm" color="$textSubdued">
                      )
                    </SizableText>
                  </XStack>
                ) : null}
              </XStack>
            </>
          ) : (
            <SizableText size="$bodyMd" color="$textSubdued">
              {PLACEHOLDER}
            </SizableText>
          )}
        </YStack>
      )}
    </XStack>
  );
}
