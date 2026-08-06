import { MARKET_DETAIL_LAYOUT } from '../../layouts/marketDetailLayoutConsts';

// Geometry of the stock detail desktop page, mirrored from the Figma frame
// (Market / 25206:9303). Values are kept here so the layout shell and the
// individual sections cannot drift apart.
export const STOCK_DETAIL_LAYOUT = {
  // Outer content frame: 1140 = 772 (left) + 24 (gap) + 344 (right).
  contentMaxWidth: 1140,
  rightColumnWidth: 344,
  columnGap: 24,
  // Chart block outer box: pt 20 + price header 62 + gap 20 + chart area
  // + pb 32. The chart area intentionally keeps the existing 550 height
  // (MARKET_DETAIL_LAYOUT.chartHeight) rather than the design's 360, so the
  // block measures 684 instead of 494. The embedded chart keeps its own
  // toolbar and axes and simply fills `chartAreaHeight`.
  chartPanelHeight: 684,
  chartAreaHeight: MARKET_DETAIL_LAYOUT.chartHeight,
  headerHeight: 52,
  tabsHeight: 44,
} as const;
