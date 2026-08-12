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

/**
 * Intraday swing, (high − low) ÷ previous close. Derived rather than fetched:
 * once the day's OHLC arrives this needs no extra field.
 */
function deriveAmplitude(
  dayHigh?: string,
  dayLow?: string,
  previousClose?: string,
) {
  if (!dayHigh || !dayLow || !previousClose) {
    return undefined;
  }
  const highBN = new BigNumber(dayHigh);
  const lowBN = new BigNumber(dayLow);
  const closeBN = new BigNumber(previousClose);
  if (!highBN.isFinite() || !lowBN.isFinite() || !closeBN.isFinite()) {
    return undefined;
  }
  if (closeBN.lte(0)) {
    return undefined;
  }
  return highBN.minus(lowBN).dividedBy(closeBN).times(100).toFixed();
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
    const amplitude = deriveAmplitude(
      analysis?.dayHigh,
      analysis?.dayLow,
      analysis?.previousClose,
    );

    /**
     * Key Data: a 3x2 block — the day's range and volume over size and the
     * 52-week band.
     *
     * Crypto-native venues (Bitget's collapsed strip, Binance's Stats order)
     * lead with the day's price and volume because that matches what our users
     * already read on a token page; a stock-native venue like Futu leads with
     * valuation. This page serves the former, so the valuation ratios sit in
     * the expander below rather than in the collapsed block.
     *
     * The day's high/low have no source yet (spike G3) and render `--`. That
     * is deliberate: a visible gap in the most prominent row is the point.
     */
    // TODO(i18n): the English labels below (Today's High/Low, Open, Prev.
    // Close, Amplitude, Avg. Vol, EPS, Shares Outstanding, Dividend TTM, EV,
    // EV/EBITDA, FCF) still need translation keys.
    const keyData: IStockStatItem[] = [
      {
        key: 'dayHigh',
        label: "Today's High",
        value: formatCurrencyStatValue(analysis?.dayHigh),
      },
      {
        key: 'dayLow',
        label: "Today's Low",
        value: formatCurrencyStatValue(analysis?.dayLow),
      },
      {
        key: 'volume24h',
        label: intl.formatMessage({
          id: ETranslations.dexmarket_stock_24h_volume,
        }),
        value: formatCurrencyStatValue(analysis?.volume24h),
      },
      {
        key: 'marketCap',
        label: intl.formatMessage({ id: ETranslations.dexmarket_market_cap }),
        value: formatCurrencyStatValue(stock?.marketCap),
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
    ];

    /**
     * The "More" expander, 14 cells. The cap is 20 cells for the whole of
     * Overview — 6 core plus 14 here, matching what Binance shows in one
     * screen. The two valuation ratios lead: they are the first thing someone
     * expands this for.
     *
     * Ordered day → volume → valuation → capital. Turnover rate leads the
     * volume group so that share volume and average volume land side by side
     * in the 4-column grid: the pair only reads as a ratio ("today ran at 1.8x
     * normal") when both are visible at once.
     *
     * Cells without a source render `--` rather than disappearing, so the gap
     * stays visible and reviewable.
     */
    const financials: IStockStatItem[] = [
      {
        key: 'peRatio',
        label: intl.formatMessage({ id: ETranslations.dexmarket_stock_pe_ttm }),
        value: isPeUsable ? formatRatioValue(peRatio) : STAT_FALLBACK_VALUE,
        tooltip: intl.formatMessage({
          id: ETranslations.dexmarket_stock_pe_ttm_desc,
        }),
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
        key: 'dayOpen',
        label: 'Open',
        value: formatCurrencyStatValue(analysis?.dayOpen),
      },
      {
        key: 'previousClose',
        label: 'Prev. Close',
        value: formatCurrencyStatValue(analysis?.previousClose),
      },
      {
        key: 'amplitude',
        label: 'Amplitude',
        value: formatPercentPointValue(amplitude),
      },
      {
        // Already in percentage points — see `formatPercentPointValue`.
        key: 'turnoverRate',
        label: intl.formatMessage({
          id: ETranslations.dexmarket_stock_turnover_rate,
        }),
        value: formatPercentPointValue(analysis?.turnoverRate),
      },
      {
        key: 'volumeShares',
        label: intl.formatMessage({
          id: ETranslations.dexmarket_stock_volume_shares,
        }),
        value: formatMarketCapValue(analysis?.volumeShares),
      },
      {
        key: 'avgDailyVolume',
        label: 'Avg. Vol',
        value: formatMarketCapValue(analysis?.avgDailyVolume1y),
      },
      {
        key: 'eps',
        label: 'EPS',
        value: eps ? formatCurrencyStatValue(eps) : STAT_FALLBACK_VALUE,
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
        key: 'sharesOutstanding',
        label: 'Shares Outstanding',
        value: formatMarketCapValue(stock?.sharesOutstanding),
      },
      {
        key: 'dividendPerShare',
        label: 'Dividend TTM',
        value: formatCurrencyStatValue(stock?.dividendPerShare),
      },
      {
        key: 'debtToEquity',
        label: intl.formatMessage({ id: ETranslations.dexmarket_stock_de }),
        value: formatRatioValue(activity?.debtToEquity),
        tooltip: intl.formatMessage({
          id: ETranslations.dexmarket_stock_de_desc,
        }),
      },
    ];

    /**
     * Built but not rendered. Profitability and advanced valuation are what
     * someone reads when they go digging through the statements, so they are
     * the Financials tab's first batch rather than expander filler — and three
     * of them would sit at `--` until the key-metrics source lands.
     *
     * Kept here so the tab is a wiring change rather than a rewrite; the
     * percentage conventions in particular are easy to get wrong twice.
     */
    const financialStatementStats: IStockStatItem[] = [
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
        key: 'enterpriseValue',
        label: 'EV',
        value: formatCurrencyStatValue(activity?.enterpriseValue),
      },
      {
        key: 'evToEbitda',
        label: 'EV/EBITDA',
        value: formatRatioValue(activity?.evToEbitda),
      },
      {
        key: 'freeCashFlow',
        label: 'FCF',
        value: formatCurrencyStatValue(activity?.freeCashFlow),
      },
    ];

    return { keyData, financials, financialStatementStats };
  }, [entity, intl]);
}
