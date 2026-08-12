import { memo } from 'react';

import { Divider, XStack } from '@onekeyhq/components';
import { useUSMarketStatus } from '@onekeyhq/kit/src/hooks/useUSMarketStatus';
import { StockMarketStatusDot } from '@onekeyhq/kit/src/views/Market/components/PerpsBadges';
import { resolveUSMarketStatusVariant } from '@onekeyhq/shared/src/utils/tradingHoursUtils';

/**
 * Page-level US market status for the Stocks tab (Figma 25507:18322).
 *
 * Same dot-and-label chip the detail page's chart header uses, so the session
 * reads identically on both sides of a row press. It states a fact about the
 * US market and never asserts tradability: with both a 24/5 and a 24/7 issuer
 * listed, "tradable" would always be true and the chip would carry no
 * information. Per-variant tradability lives on the detail page's variant
 * dropdown and in the swap flow instead.
 */
function MarketStockMarketStatusChipImpl() {
  const status = useUSMarketStatus();

  // No guessing on an unavailable or failed status: the chip disappears
  // rather than claiming the market is open or closed. The page speaks for the
  // US session, so it resolves against the session-following issuer.
  const variant = resolveUSMarketStatusVariant({
    source: 'ondo',
    isOpen: true,
    isPaused: false,
    status,
  });

  if (!status || status.unavailable || !variant) {
    return null;
  }

  // The rule belongs to the chip, not to the bar: an unavailable status makes
  // the whole thing disappear, and a lone divider would be left behind.
  return (
    <XStack alignItems="center" gap="$2.5" flexShrink={0}>
      <StockMarketStatusDot variant={variant} />
      <Divider vertical h={16} />
    </XStack>
  );
}

export const MarketStockMarketStatusChip = memo(
  MarketStockMarketStatusChipImpl,
);
