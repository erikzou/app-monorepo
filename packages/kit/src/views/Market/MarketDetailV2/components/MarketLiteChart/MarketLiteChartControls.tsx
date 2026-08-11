import { useCallback, useMemo } from 'react';

import { SegmentControl, Stack, XStack } from '@onekeyhq/components';

import {
  MARKET_CHART_TOOLBAR_HEIGHT,
  MARKET_CHART_TOOLBAR_SEGMENT_STYLE,
  MARKET_LITE_CHART_RANGES,
} from './constants';
import { MarketChartModeSwitch } from './MarketChartModeSwitch';

import type { IMarketLiteChartRange } from './constants';

/**
 * Lite toolbar. Mirrors the Pro (TradingView) desktop toolbar layout — ranges
 * on the left, Lite/Pro switch on the right — minus everything Lite has no use
 * for: chart tools, undo/redo, the "more" intervals trigger and the
 * price/market-cap select.
 */
export function MarketLiteChartControls({
  range,
  onRangeChange,
  showRanges = true,
}: {
  range: IMarketLiteChartRange;
  onRangeChange: (range: IMarketLiteChartRange) => void;
  // Pro owns its own interval picker, but the Lite/Pro switch has to stay
  // reachable or the user cannot get back out of Pro.
  showRanges?: boolean;
}) {
  const rangeOptions = useMemo(
    () =>
      MARKET_LITE_CHART_RANGES.map((item) => ({
        label: item.label,
        value: item.label,
        testID: `market-lite-chart-range-${item.label}`,
      })),
    [],
  );

  const handleRangeChange = useCallback(
    (value: string | number) => {
      onRangeChange(value as IMarketLiteChartRange);
    },
    [onRangeChange],
  );

  return (
    <Stack
      bg="$bgApp"
      // Figma 25476:88858: the toolbar starts on the column's own 20px gutter,
      // with no inset of its own.
      px="$5"
      py="$1"
      h={MARKET_CHART_TOOLBAR_HEIGHT}
      justifyContent="center"
      zIndex={3}
    >
      <XStack alignItems="center" width="100%" gap="$2">
        <XStack flex={1} minWidth={0} alignItems="center">
          {showRanges ? (
            <SegmentControl
              value={range}
              options={rangeOptions}
              onChange={handleRangeChange}
              {...MARKET_CHART_TOOLBAR_SEGMENT_STYLE}
            />
          ) : null}
        </XStack>

        <XStack gap="$2" alignItems="center" flexShrink={0}>
          <MarketChartModeSwitch />
        </XStack>
      </XStack>
    </Stack>
  );
}
