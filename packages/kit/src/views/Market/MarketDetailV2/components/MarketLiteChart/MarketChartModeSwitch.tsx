import { useCallback } from 'react';

import { SegmentControl } from '@onekeyhq/components';
import { useMarketChartModeAtom } from '@onekeyhq/kit-bg/src/states/jotai/atoms';
import type { IMarketChartMode } from '@onekeyhq/kit-bg/src/states/jotai/atoms';

import { MARKET_CHART_TOOLBAR_SEGMENT_STYLE } from './constants';

const CHART_MODE_OPTIONS: { label: string; value: IMarketChartMode }[] = [
  { label: 'Lite', value: 'lite' },
  { label: 'Pro', value: 'pro' },
];

/**
 * Lite/Pro switch. Self-contained so the same element can be dropped into the
 * Pro (TradingView) toolbar slot and into the Lite toolbar without either side
 * owning the state.
 */
export function MarketChartModeSwitch() {
  const [{ mode }, setChartMode] = useMarketChartModeAtom();

  const handleChange = useCallback(
    (value: string | number) => {
      setChartMode({ mode: value as IMarketChartMode });
    },
    [setChartMode],
  );

  return (
    <SegmentControl
      testID="market-chart-mode-switch"
      value={mode}
      options={CHART_MODE_OPTIONS}
      onChange={handleChange}
      {...MARKET_CHART_TOOLBAR_SEGMENT_STYLE}
    />
  );
}
