import type { IMarketToken } from '../components/MarketTokenList/MarketTokenData';

/**
 * Token symbol suffix each issuer appends to the underlying ticker
 * (`AAPL` -> `AAPLon` / `AAPLx`). The list payload carries no ticker of its
 * own, so the collapse key is derived from the symbol — but only for issuers
 * we know the convention for, and only via `stock.source`. Stripping a bare
 * trailing `on`/`x` from any symbol would corrupt tickers that legitimately
 * end that way.
 */
const ISSUER_TOKEN_SUFFIX: Record<string, string> = {
  ondo: 'on',
  xstock: 'x',
};

/** Issuers whose tokens trade around the clock, independent of the US session. */
const ALWAYS_ON_ISSUERS = new Set(['xstock']);

export function isAlwaysOnStockIssuer(source: string | undefined) {
  return ALWAYS_ON_ISSUERS.has((source ?? '').toLowerCase());
}

/**
 * `AAPLon` + `ondo` -> `AAPL`. Returns the symbol unchanged for unknown
 * issuers or when the suffix is absent, so an unexpected payload degrades to
 * today's behavior instead of showing a truncated ticker.
 */
export function deriveStockTicker(
  symbol: string | undefined,
  source: string | undefined,
): string {
  const raw = (symbol ?? '').trim();
  if (!raw) {
    return '';
  }
  const suffix = ISSUER_TOKEN_SUFFIX[(source ?? '').toLowerCase()];
  if (!suffix) {
    return raw;
  }
  if (raw.length <= suffix.length) {
    return raw;
  }
  if (raw.slice(-suffix.length).toLowerCase() !== suffix) {
    return raw;
  }
  return raw.slice(0, -suffix.length);
}

/**
 * One stock, one row: every issuer/chain tokenization of the same ticker
 * collapses onto the first one seen. The list arrives sorted by 24h volume, so
 * first-seen is also the deepest variant — which is what the row should link
 * to. Rows without stock metadata (the injected BTC row, plain tokens) pass
 * through untouched and keep their position.
 */
export function collapseStockEntityRows(items: IMarketToken[]): IMarketToken[] {
  const result: IMarketToken[] = [];
  const slotByTicker = new Map<string, number>();

  items.forEach((item) => {
    const ticker = item.stock
      ? deriveStockTicker(item.symbol, item.stock.source)
      : '';

    if (!ticker) {
      result.push(item);
      return;
    }

    const slot = slotByTicker.get(ticker);
    if (slot === undefined) {
      slotByTicker.set(ticker, result.length);
      result.push({ ...item, stockTicker: ticker, stockVariantCount: 1 });
      return;
    }

    const existing = result[slot];
    result[slot] = {
      ...existing,
      stockVariantCount: (existing.stockVariantCount ?? 1) + 1,
    };
  });

  return result;
}

export function hasAlwaysOnStockVariant(items: IMarketToken[]): boolean {
  return items.some((item) => isAlwaysOnStockIssuer(item.stock?.source));
}
