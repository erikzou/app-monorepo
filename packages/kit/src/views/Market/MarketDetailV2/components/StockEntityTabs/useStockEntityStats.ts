import { useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { useIntl } from 'react-intl';

import { ETranslations } from '@onekeyhq/shared/src/locale';
import type { IMarketStockEntity } from '@onekeyhq/shared/types/marketV2';

import {
  STAT_FALLBACK_VALUE,
  formatCurrencyStatValue,
  formatMarketCapValue,
  formatPercentPointValue,
  formatPercentValue,
  formatRatioValue,
} from '../../utils/statValue';

import type { IStockStatItem } from './StockStatGrid';

/**
 * EPS has no field of its own; it is derived from price ÷ P/E. A non-positive
 * P/E makes the ratio meaningless, so both cells fall back to `--` together.
 */
function deriveEps(underlyingPrice?: string, peRatio?: string) {
  if (!underlyingPrice || !peRatio) {
    return undefined;
  }
  const priceBN = new BigNumber(underlyingPrice);
  const peBN = new BigNumber(peRatio);
  if (!priceBN.isFinite() || !peBN.isFinite() || peBN.lte(0)) {
    return undefined;
  }
  return priceBN.dividedBy(peBN).toFixed();
}

export function useStockEntityStats(entity: IMarketStockEntity | undefined) {
  const intl = useIntl();

  return useMemo(() => {
    const stock = entity?.stock;
    const analysis = stock?.assetAnalysis;
    const activity = stock?.tradingActivity;

    const peRatio = activity?.peRatio;
    const isPeUsable = Boolean(
      peRatio &&
      new BigNumber(peRatio).isFinite() &&
      new BigNumber(peRatio).gt(0),
    );
    const eps = deriveEps(entity?.underlyingPrice, peRatio);

    // The eight cells the spec pins to Overview. Everything else lives in the
    // Financials tab.
    const keyData: IStockStatItem[] = [
      {
        key: 'marketCap',
        label: intl.formatMessage({ id: ETranslations.dexmarket_market_cap }),
        value: formatCurrencyStatValue(stock?.marketCap),
      },
      {
        key: 'peRatio',
        label: intl.formatMessage({ id: ETranslations.dexmarket_stock_pe_ttm }),
        value: isPeUsable ? formatRatioValue(peRatio) : STAT_FALLBACK_VALUE,
        tooltip: intl.formatMessage({
          id: ETranslations.dexmarket_stock_pe_ttm_desc,
        }),
      },
      {
        key: 'eps',
        label: 'EPS',
        value: eps ? formatCurrencyStatValue(eps) : STAT_FALLBACK_VALUE,
      },
      {
        key: 'dividendYield',
        label: intl.formatMessage({
          id: ETranslations.dexmarket_stock_dividend_yield,
        }),
        value: formatPercentValue(activity?.dividendYield),
        tooltip: intl.formatMessage({
          id: ETranslations.dexmarket_stock_dividend_yield_desc,
        }),
      },
      {
        key: 'weekHigh52',
        label: intl.formatMessage({
          id: ETranslations.dexmarket_stock_52_week_high,
        }),
        value: formatCurrencyStatValue(analysis?.weekHigh52),
      },
      {
        key: 'weekLow52',
        label: intl.formatMessage({
          id: ETranslations.dexmarket_stock_52_week_low,
        }),
        value: formatCurrencyStatValue(analysis?.weekLow52),
      },
      {
        key: 'volume24h',
        label: intl.formatMessage({
          id: ETranslations.dexmarket_stock_24h_volume,
        }),
        value: formatCurrencyStatValue(analysis?.volume24h),
      },
      {
        key: 'volumeShares',
        label: intl.formatMessage({
          id: ETranslations.dexmarket_stock_volume_shares,
        }),
        value: formatMarketCapValue(analysis?.volumeShares),
      },
    ];

    const financials: IStockStatItem[] = [
      {
        // Already in percentage points — see `formatPercentPointValue`.
        key: 'turnoverRate',
        label: intl.formatMessage({
          id: ETranslations.dexmarket_stock_turnover_rate,
        }),
        value: formatPercentPointValue(analysis?.turnoverRate),
      },
      {
        key: 'pbRatio',
        label: intl.formatMessage({ id: ETranslations.dexmarket_stock_pb }),
        value: formatRatioValue(activity?.pbRatio),
        tooltip: intl.formatMessage({
          id: ETranslations.dexmarket_stock_pb_desc,
        }),
      },
      {
        key: 'psRatio',
        label: intl.formatMessage({ id: ETranslations.dexmarket_stock_ps }),
        value: formatRatioValue(activity?.psRatio),
        tooltip: intl.formatMessage({
          id: ETranslations.dexmarket_stock_ps_desc,
        }),
      },
      {
        key: 'roe',
        label: intl.formatMessage({ id: ETranslations.dexmarket_stock_roe }),
        value: formatPercentValue(activity?.roe),
        tooltip: intl.formatMessage({
          id: ETranslations.dexmarket_stock_roe_desc,
        }),
      },
      {
        key: 'roa',
        label: intl.formatMessage({ id: ETranslations.dexmarket_stock_roa }),
        value: formatPercentValue(activity?.roa),
        tooltip: intl.formatMessage({
          id: ETranslations.dexmarket_stock_roa_desc,
        }),
      },
      {
        key: 'profitMargin',
        label: intl.formatMessage({
          id: ETranslations.dexmarket_stock_profit_margin,
        }),
        value: formatPercentValue(activity?.netProfitMargin),
        tooltip: intl.formatMessage({
          id: ETranslations.dexmarket_stock_profit_margin_desc,
        }),
      },
      {
        key: 'debtToEquity',
        label: intl.formatMessage({ id: ETranslations.dexmarket_stock_de }),
        value: formatRatioValue(activity?.debtToEquity),
        tooltip: intl.formatMessage({
          id: ETranslations.dexmarket_stock_de_desc,
        }),
      },
      {
        // No API field yet (gated on the FMP capability pack, spike G3), so
        // this cell is permanently `--`. Kept rather than dropped so the gap
        // stays visible.
        key: 'avgDailyVolume1y',
        label: intl.formatMessage({
          id: ETranslations.dexmarket_stock_1y_avg_daily_vol,
        }),
        value: formatMarketCapValue(analysis?.avgDailyVolume1y),
      },
    ];

    return { keyData, financials };
  }, [entity, intl]);
}
