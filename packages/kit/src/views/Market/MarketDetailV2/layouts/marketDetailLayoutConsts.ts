import platformEnv from '@onekeyhq/shared/src/platformEnv';

export const MARKET_DETAIL_LAYOUT = {
  chartHeight: 550,
  chartFullscreenHeaderFillHeight: 48,
  infoTabsHeight: 480,
} as const;

export const SCROLL_CONTAINER_STYLE = { overflowY: 'auto' } as const;

export const MARKET_CHART_FULLSCREEN_STYLE = {
  position: 'fixed',
  left: 0,
  top: 0,
  right: 0,
  bottom: platformEnv.isWeb ? 40 : 0,
} as const;
