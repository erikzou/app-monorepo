import type {
  IMarketStockDetail,
  IMarketStockEntity,
  IMarketStockInfo,
  IMarketStockInstrument,
} from '@onekeyhq/shared/types/marketV2';

export interface IMarketStockUnderlyingMetaApiData {
  averageVolume1y?: string;
  underlyingPrice?: string;
  priceChange24H?: string;
  debtToEquityRatioTTM?: string;
  dividendPerShareTTM?: string;
  dividendYieldTTM?: string;
  introduction?: string;
  marketCap?: string;
  netProfitMarginTTM?: string;
  peRatioTTM?: string;
  priceToBookRatioTTM?: string;
  priceToSalesRatioTTM?: string;
  returnOnAssetsTTM?: string;
  returnOnEquityTTM?: string;
  sharesOutstanding?: string;
  turnoverRate24h?: string;
  volume24h?: string;
  volumeShares?: string;
  weekHigh52?: string;
  weekLow52?: string;
}

export interface IMarketStockInstrumentApiData {
  instrumentId: string;
  instrumentType?: string;
  issuer?: string;
  tokenSymbol?: string;
  tokenName?: string;
  networkId?: string;
  chainName?: string;
  rawContractAddress?: string;
  logoUrl?: string;
  status?: string;
  source?: string;
  tokenToAssetRatio?: string;
  tradingHours?: {
    days?: string;
    isMarketOpen?: boolean;
    session?: string;
  };
  tradingLimit?: {
    minTradeUsd?: string;
    maxTradeUsd?: string;
    tradingEnabled?: boolean;
  };
  marketMeta?: {
    price?: string;
    priceChange24H?: string;
    volume24h?: string;
    liquidityUsd?: string;
  };
}

export interface IMarketStockAssetApiData {
  ticker: string;
  name: string;
  logoUrl?: string;
  subtitles?: Record<string, string>;
  category?: string[];
  underlyingMeta?: IMarketStockUnderlyingMetaApiData;
  underlyingUpdatedAt?: string;
  instruments?: IMarketStockInstrumentApiData[];
}

export function buildMarketStockDetail(
  data: IMarketStockAssetApiData,
): IMarketStockDetail {
  const meta = data.underlyingMeta;
  const stock: IMarketStockInfo = {
    title: data.ticker,
    subtitle: data.name,
    sourceLogoUri: data.logoUrl ?? '',
    assetAnalysis: {
      volume24h: meta?.volume24h,
      volumeShares: meta?.volumeShares,
      turnoverRate: meta?.turnoverRate24h,
      avgDailyVolume1y: meta?.averageVolume1y,
      weekHigh52: meta?.weekHigh52,
      weekLow52: meta?.weekLow52,
    },
    tradingActivity: {
      peRatio: meta?.peRatioTTM,
      pbRatio: meta?.priceToBookRatioTTM,
      psRatio: meta?.priceToSalesRatioTTM,
      roe: meta?.returnOnEquityTTM,
      roa: meta?.returnOnAssetsTTM,
      netProfitMargin: meta?.netProfitMarginTTM,
      debtToEquity: meta?.debtToEquityRatioTTM,
      dividendYield: meta?.dividendYieldTTM,
    },
    dividendPerShare: meta?.dividendPerShareTTM,
    marketCap: meta?.marketCap,
    sharesOutstanding: meta?.sharesOutstanding,
    underlyingAssetTicker: data.ticker,
    underlyingAssetName: data.name,
  };

  return {
    ticker: data.ticker,
    name: data.name,
    logoUrl: data.logoUrl,
    introduction: meta?.introduction,
    underlyingUpdatedAt: data.underlyingUpdatedAt,
    stock,
  };
}

// Perp instruments ride along in the same array but carry no chain, contract or
// on-chain quote, so they are not selectable variants.
const TRADABLE_INSTRUMENT_TYPE = 'spot_token';
const DELISTED_INSTRUMENT_STATUS = 'delisted';

export function buildMarketStockInstruments(
  data: IMarketStockAssetApiData,
): IMarketStockInstrument[] {
  return (data.instruments ?? [])
    .filter(
      (item) =>
        item.instrumentType === TRADABLE_INSTRUMENT_TYPE &&
        item.status !== DELISTED_INSTRUMENT_STATUS &&
        Boolean(item.networkId) &&
        Boolean(item.rawContractAddress),
    )
    .map((item) => ({
      instrumentId: item.instrumentId,
      // `source` carries unnormalized upstream values (`okx_rwa`), so issuer is
      // the only field safe to branch on.
      issuer: item.issuer ?? '',
      tokenSymbol: item.tokenSymbol ?? '',
      tokenName: item.tokenName,
      networkId: item.networkId ?? '',
      chainName: item.chainName,
      contractAddress: item.rawContractAddress ?? '',
      logoUrl: item.logoUrl,
      tokenToAssetRatio: item.tokenToAssetRatio,
      tradingDays: item.tradingHours?.days,
      isMarketOpen: item.tradingHours?.isMarketOpen,
      minTradeUsd: item.tradingLimit?.minTradeUsd,
      maxTradeUsd: item.tradingLimit?.maxTradeUsd,
      price: item.marketMeta?.price,
      priceChange24H: item.marketMeta?.priceChange24H,
      volume24h: item.marketMeta?.volume24h,
      liquidityUsd: item.marketMeta?.liquidityUsd,
    }));
}

export function buildMarketStockEntity(
  data: IMarketStockAssetApiData,
): IMarketStockEntity {
  const detail = buildMarketStockDetail(data);
  return {
    ...detail,
    category: data.category,
    underlyingPrice: data.underlyingMeta?.underlyingPrice,
    underlyingPriceChange24H: data.underlyingMeta?.priceChange24H,
    instruments: buildMarketStockInstruments(data),
  };
}
