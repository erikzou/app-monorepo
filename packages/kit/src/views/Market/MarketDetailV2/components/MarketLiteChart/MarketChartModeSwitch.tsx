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
 *
 * By default it reads and writes the persisted preference. An assembly whose
 * default differs from that preference (the crypto page opens on Pro) passes
 * its own value and setter instead.
 */
export function MarketChartModeSwitch({
  mode: controlledMode,
  onModeChange,
}: {
  mode?: IMarketChartMode;
  onModeChange?: (mode: IMarketChartMode) => void;
} = {}) {
  const [{ mode: persistedMode }, setChartMode] = useMarketChartModeAtom();
  const mode = controlledMode ?? persistedMode;

  const handleChange = useCallback(
    (value: string | number) => {
      const nextMode = value as IMarketChartMode;
      if (onModeChange) {
        onModeChange(nextMode);
        return;
      }
      setChartMode({ mode: nextMode });
    },
    [onModeChange, setChartMode],
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
