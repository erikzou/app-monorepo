import type { IMarketStockInstrument } from '@onekeyhq/shared/types/marketV2';

import {
  findTradableAlternative,
  isVariantTradableNow,
} from './variantTradability';

function buildInstrument(
  overrides: Partial<IMarketStockInstrument> = {},
): IMarketStockInstrument {
  return {
    instrumentId: 'spot_token:ondo:evm--1:0x1',
    issuer: 'ondo',
    tokenSymbol: 'AAPLon',
    networkId: 'evm--1',
    contractAddress: '0x1',
    ...overrides,
  };
}

describe('isVariantTradableNow', () => {
  it('keeps 24/7 issuers tradable while the US market is closed', () => {
    expect(
      isVariantTradableNow({
        instrument: buildInstrument({ issuer: 'xstock' }),
        isUsMarketOpen: false,
      }),
    ).toBe(true);
  });

  it('marks 24/5 issuers untradable while the US market is closed', () => {
    expect(
      isVariantTradableNow({
        instrument: buildInstrument({ issuer: 'ondo' }),
        isUsMarketOpen: false,
      }),
    ).toBe(false);
  });

  it('leaves every variant tradable during the US session', () => {
    expect(
      isVariantTradableNow({
        instrument: buildInstrument({ issuer: 'ondo' }),
        isUsMarketOpen: true,
      }),
    ).toBe(true);
  });

  it('honours a per-instrument halt even for 24/7 issuers', () => {
    expect(
      isVariantTradableNow({
        instrument: buildInstrument({ issuer: 'xstock', isMarketOpen: false }),
        isUsMarketOpen: true,
      }),
    ).toBe(false);
  });

  it('falls back to tradable when the global status is unknown', () => {
    expect(
      isVariantTradableNow({
        instrument: buildInstrument({ issuer: 'ondo' }),
        isUsMarketOpen: undefined,
      }),
    ).toBe(true);
  });
});

describe('findTradableAlternative', () => {
  const ondo = buildInstrument({ instrumentId: 'ondo-1', issuer: 'ondo' });
  const xstock = buildInstrument({
    instrumentId: 'xstock-1',
    issuer: 'xstock',
    tokenSymbol: 'AAPLx',
  });

  it('suggests the 24/7 variant when the US market is closed', () => {
    expect(
      findTradableAlternative({
        instruments: [ondo, xstock],
        excludeInstrumentId: ondo.instrumentId,
        isUsMarketOpen: false,
      })?.instrumentId,
    ).toBe('xstock-1');
  });

  it('returns nothing when no other variant can trade', () => {
    expect(
      findTradableAlternative({
        instruments: [ondo],
        excludeInstrumentId: ondo.instrumentId,
        isUsMarketOpen: false,
      }),
    ).toBeUndefined();
  });
});
