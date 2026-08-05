import { memo } from 'react';

import { SizableText, Stack, XStack } from '@onekeyhq/components';
import { useUSMarketStatus } from '@onekeyhq/kit/src/hooks/useUSMarketStatus';

type IStatusTone = 'open' | 'closed' | 'paused';

const TONE_STYLE: Record<
  IStatusTone,
  { bg: string; color: string; dot?: string }
> = {
  open: { bg: '$bgSuccessSubdued', color: '$textSuccess', dot: '$iconSuccess' },
  closed: { bg: '$bgSubdued', color: '$textSubdued' },
  paused: { bg: '$bgCautionSubdued', color: '$textCaution' },
};

/**
 * Page-level US market status for the Stocks tab.
 *
 * The chip states a fact about the US market and never asserts tradability:
 * with both a 24/5 and a 24/7 issuer listed, "tradable" would always be true
 * and the chip would carry no information. Per-variant tradability lives on
 * the detail page's variant dropdown and in the swap flow instead.
 *
 * Copy is placeholder pending PM sign-off and still needs i18n keys
 * (generated locale files are off-limits here).
 */
function MarketStockMarketStatusChipImpl({
  hasAlwaysOnVariants,
}: {
  // Drives the "24/7 tokens keep trading" half of the closed-state copy. With
  // no always-on issuer listed the sentence would be a lie, so it falls back
  // to the bare closed state.
  hasAlwaysOnVariants?: boolean;
}) {
  const status = useUSMarketStatus();

  // No guessing on an unavailable or failed status: the chip disappears
  // rather than claiming the market is open or closed.
  if (!status || status.unavailable) {
    return null;
  }

  let tone: IStatusTone;
  let label: string;
  if (status.open) {
    tone = 'open';
    label = '美股交易中';
  } else if ((status.reason ?? '').toUpperCase().includes('PAUSED')) {
    tone = 'paused';
    label = '美股暫停交易';
  } else {
    tone = 'closed';
    label = hasAlwaysOnVariants
      ? '美股已休市 · 24/7 代幣照常交易'
      : '美股已休市';
  }

  const { bg, color, dot } = TONE_STYLE[tone];

  return (
    <XStack
      alignItems="center"
      flexShrink={0}
      gap="$1.5"
      px="$2.5"
      py="$1"
      borderRadius="$2"
      borderCurve="continuous"
      bg={bg}
      testID="market-stock-market-status-chip"
    >
      {dot ? <Stack w="$1.5" h="$1.5" borderRadius="$full" bg={dot} /> : null}
      <SizableText size="$bodySmMedium" color={color}>
        {label}
      </SizableText>
    </XStack>
  );
}

export const MarketStockMarketStatusChip = memo(
  MarketStockMarketStatusChipImpl,
);
