import {
  collapseStockEntityRows,
  deriveStockTicker,
  hasAlwaysOnStockVariant,
} from './marketStockEntityRow';

import type { IMarketToken } from '../components/MarketTokenList/MarketTokenData';

function buildToken(
  overrides: Partial<IMarketToken> & { symbol: string },
): IMarketToken {
  return {
    id: overrides.symbol,
    name: overrides.symbol,
    address: `0x${overrides.symbol}`,
    decimals: 18,
    price: 1,
    change24h: 0,
    marketCap: 0,
    liquidity: 0,
    transactions: 0,
    uniqueTraders: 0,
    holders: 0,
    turnover: 0,
    tokenImageUri: '',
    networkLogoUri: '',
    networkId: 'evm--1',
    ...overrides,
  } as IMarketToken;
}

function buildStockToken(symbol: string, source: string, networkId = 'evm--1') {
  return buildToken({
    symbol,
    networkId,
    stock: { subtitle: 'Apple', sourceLogoUri: '', source },
  });
}

describe('deriveStockTicker', () => {
  it('strips the issuer suffix', () => {
    expect(deriveStockTicker('AAPLon', 'ondo')).toBe('AAPL');
    expect(deriveStockTicker('AAPLx', 'xstock')).toBe('AAPL');
  });

  it('is case insensitive on the suffix', () => {
    expect(deriveStockTicker('IBITON', 'ondo')).toBe('IBIT');
  });

  it('keeps tickers that legitimately end in the suffix letters', () => {
    // A real ticker can end in the suffix letters; only the issuer suffix may be stripped.
    expect(deriveStockTicker('ONDSON', 'ondo')).toBe('ONDS');
    expect(deriveStockTicker('ONDS', undefined)).toBe('ONDS');
  });

  it('leaves unknown issuers alone', () => {
    expect(deriveStockTicker('AAPLon', 'okx_rwa')).toBe('AAPLon');
  });

  it('falls back to the known suffixes when the payload carries no issuer', () => {
    expect(deriveStockTicker('AAPLon', undefined)).toBe('AAPL');
    expect(deriveStockTicker('TSLAx', '')).toBe('TSLA');
    expect(deriveStockTicker('IBIT', undefined)).toBe('IBIT');
  });
});

describe('collapseStockEntityRows', () => {
  it('collapses every variant of a ticker onto one row', () => {
    const rows = collapseStockEntityRows([
      buildStockToken('AAPLon', 'ondo', 'evm--56'),
      buildStockToken('AAPLx', 'xstock', 'sol--101'),
      buildStockToken('NVDAon', 'ondo'),
    ]);

    expect(rows.map((row) => row.stockTicker)).toEqual(['AAPL', 'NVDA']);
    expect(rows[0].stockVariantCount).toBe(2);
    expect(rows[1].stockVariantCount).toBe(1);
  });

  it('keeps the first (deepest-volume) variant as the row target', () => {
    const rows = collapseStockEntityRows([
      buildStockToken('AAPLon', 'ondo', 'evm--56'),
      buildStockToken('AAPLx', 'xstock', 'sol--101'),
    ]);

    expect(rows[0].networkId).toBe('evm--56');
    expect(rows[0].symbol).toBe('AAPLon');
  });

  it('passes non-stock rows through in place', () => {
    const rows = collapseStockEntityRows([
      buildToken({ symbol: 'BTC' }),
      buildStockToken('AAPLon', 'ondo'),
      buildStockToken('AAPLx', 'xstock'),
    ]);

    expect(rows.map((row) => row.symbol)).toEqual(['BTC', 'AAPLon']);
    expect(rows[0].stockTicker).toBeUndefined();
  });
});

describe('hasAlwaysOnStockVariant', () => {
  it('is true only when a 24/7 issuer is listed', () => {
    expect(hasAlwaysOnStockVariant([buildStockToken('AAPLon', 'ondo')])).toBe(
      false,
    );
    expect(
      hasAlwaysOnStockVariant([
        buildStockToken('AAPLon', 'ondo'),
        buildStockToken('AAPLx', 'xstock'),
      ]),
    ).toBe(true);
  });
});
