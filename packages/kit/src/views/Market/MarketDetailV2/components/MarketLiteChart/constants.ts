export type IMarketLiteChartRange = '1H' | '1D' | '1W' | '1M' | '1Y' | 'All';

export interface IMarketLiteChartRangeItem {
  label: IMarketLiteChartRange;
  // Bucket size sent to the kline API.
  interval: string;
  // Lookback window in seconds.
  seconds: number;
}

const HOUR = 60 * 60;
const DAY = 24 * HOUR;

// Calendar-semantic ranges for the stock entity page, not crypto minute
// buckets. Each range picks a bucket size that keeps the point count in the
// 60-400 band so the line stays readable without over-fetching.
export const MARKET_LITE_CHART_RANGES: IMarketLiteChartRangeItem[] = [
  { label: '1H', interval: '1m', seconds: HOUR },
  { label: '1D', interval: '5m', seconds: DAY },
  { label: '1W', interval: '1H', seconds: 7 * DAY },
  { label: '1M', interval: '4H', seconds: 30 * DAY },
  { label: '1Y', interval: '1D', seconds: 365 * DAY },
  { label: 'All', interval: '1W', seconds: 5 * 365 * DAY },
];

export const MARKET_LITE_CHART_DEFAULT_RANGE: IMarketLiteChartRange = '1D';

export const MARKET_LITE_CHART_PRICE_SCALE_MARGINS = {
  top: 0.12,
  bottom: 0.1,
} as const;

export const MARKET_LITE_CHART_PRICE_SCALE_MIN_WIDTH = 64;

// Height of the Pro (TradingView) desktop toolbar, mirrored by the Lite
// toolbar so switching modes does not shift the chart.
export const MARKET_CHART_TOOLBAR_HEIGHT = 38;

// Copied from the Pro interval selector so the Lite range picker and the
// Lite/Pro switch sit flush with TradingView's own controls.
export const MARKET_CHART_TOOLBAR_SEGMENT_STYLE = {
  slotBackgroundColor: '$transparent',
  activeBackgroundColor: '$bgStrong',
  activeTextColor: '$text',
  inactiveTextColor: '$textSubdued',
  h: 30,
  p: '$0.5',
  segmentControlItemStyleProps: {
    minWidth: 42,
    px: '$2.5',
    py: '$1',
  },
} as const;

// The area fill has to follow the line color, otherwise a down range renders a
// red line over a green gradient. The fill fades to fully transparent.
export const MARKET_LITE_CHART_AREA_TOP_ALPHA = 0.2;
// The stretch of line past the cursor while scrubbing.
export const MARKET_LITE_CHART_DIMMED_LINE_ALPHA = 0.3;
export const MARKET_LITE_CHART_AREA_BOTTOM_ALPHA = 0;
