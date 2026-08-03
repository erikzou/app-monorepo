import type { IMarketStockInstrument } from '@onekeyhq/shared/types/marketV2';

/**
 * Issuers whose tokens trade around the clock. Derived from the issuer, not
 * from `tradingHours.days`: that field is currently wrong for at least one
 * Ondo deployment (backend ticket ③), and the spec pins the rule to the issuer.
 */
const ALWAYS_ON_ISSUERS = new Set(['xstock']);

export function isAlwaysOnIssuer(issuer: string | undefined) {
  return ALWAYS_ON_ISSUERS.has((issuer ?? '').toLowerCase());
}

/**
 * Whether a variant can be traded right now.
 *
 * Rule = global US market status × issuer schedule, then the per-instrument
 * override. A 24/7 issuer ignores the US session; a 24/5 issuer follows it.
 * `isMarketOpen === false` on the instrument wins either way, which is how a
 * halted stock surfaces without a dedicated field.
 *
 * Unknown global status (request failed / `unavailable`) is treated as
 * tradable: marking everything unavailable on a network blip would be worse
 * than letting the trade attempt fail with a real error.
 */
export function isVariantTradableNow({
  instrument,
  isUsMarketOpen,
}: {
  instrument: Pick<IMarketStockInstrument, 'issuer' | 'isMarketOpen'>;
  isUsMarketOpen: boolean | undefined;
}): boolean {
  if (instrument.isMarketOpen === false) {
    return false;
  }
  if (isAlwaysOnIssuer(instrument.issuer)) {
    return true;
  }
  if (isUsMarketOpen === undefined) {
    return true;
  }
  return isUsMarketOpen;
}

/**
 * A variant the user can switch to when the selected one is closed. Prefers an
 * always-on issuer, which is the whole point of the suggestion.
 */
export function findTradableAlternative({
  instruments,
  excludeInstrumentId,
  isUsMarketOpen,
}: {
  instruments: IMarketStockInstrument[];
  excludeInstrumentId?: string;
  isUsMarketOpen: boolean | undefined;
}): IMarketStockInstrument | undefined {
  const candidates = instruments.filter(
    (item) =>
      item.instrumentId !== excludeInstrumentId &&
      isVariantTradableNow({ instrument: item, isUsMarketOpen }),
  );
  return (
    candidates.find((item) => isAlwaysOnIssuer(item.issuer)) ?? candidates[0]
  );
}
