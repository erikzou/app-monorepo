# Market stocks UI/UX — handoff notes

Scope of this branch: the **desktop** UI of the Market → Stocks list and the
stock token detail page, rebuilt 1:1 from Figma
([list](https://www.figma.com/design/Z7xLtKOKlj9EZSxC0fccUr/?node-id=25473-87700),
[detail](https://www.figma.com/design/Z7xLtKOKlj9EZSxC0fccUr/?node-id=25206-9303)).

It is a **demo**: every layout, state and interaction is real, and the data is
real wherever an endpoint already exists. Where it does not, the UI renders
placeholder values rather than hiding the cell — a visible gap is the point, so
the missing field stays reviewable. This file lists every one of those gaps.

Nothing here is stock-specific by accident. The same frame, table geometry and
row behaviour are meant to carry over to the other asset pages (see
[Reusing this on other asset pages](#reusing-this-on-other-asset-pages)).

## What is real

Instrument list and prices, the collapsed entity mapping, market cap / 24h
volume / 52-week range, the US market session, the pay-token list, positions,
the trading-hours panel, and both charts (Lite and Pro).

## What is demo or placeholder

| Where | What | Replace with |
| --- | --- | --- |
| `MarketHomeV2/…/components/StockPriceRangeCell.tsx` | `buildDemoSeries()` — the "24h price range" sparkline. Deterministic (seeded by symbol, drifts with the row's 24h change), so rows stay stable across re-renders and websocket updates | the intraday series, once the list payload carries one |
| `MarketDetailV2/…/StockEntityTabs/StockEvents.tsx` | `MOCK_EVENTS` — the whole earnings/dividend calendar | the events feed. The section is meant to disappear for tickers with no events |
| `MarketDetailV2/…/StockTrustPanel/StockProtectionsDialog.tsx` | the six protection rows and `STOCK_PROTECTION_COUNT` | the protections payload |
| `MarketDetailV2/…/StockTradePanel/StockTradePanel.tsx` | `DEMO_BALANCE` (balance line + Max), `DEMO_PROVIDER_LABEL`, the static provider row, and output/rate computed straight off the instrument price with no quote, fees, slippage or price impact. Review and settings have no handler | the swap quote flow. See the file's own header comment |
| `MarketDetailV2/…/StockEntityTabs/useStockEntityStats.ts` | cells whose source does not exist yet render `--` (day high/low, shares per token, and several ratios) | the stock index fields as they land |

Grep markers: `TODO(data)`, `MOCK`, `DEMO`, `buildDemoSeries`.

## Copy that still needs i18n

Generated locale files are off-limits in this branch, so a handful of strings
are hardcoded English (plus one Chinese disclaimer pending PM sign-off). They
are all marked `TODO(i18n)`:

```
git grep -n "TODO(i18n)" packages/kit/src/views/Market
```

Covers: `Show more/less`, `View More/Less`, `Est received`, `Sell for`,
`Review`, `Enter amount`, `24h price range`, the Overview disclaimer, and the
`Today's High/Low` labels in `useStockEntityStats.ts`.

## Known data gaps worth raising with backend

- **Company logo.** The list payload (`IMarketTokenListItem`) only carries the
  token logo, so a collapsed company row shows the first variant's token image.
  The company logo exists on the detail endpoints
  (`IMarketStockEntity.logoUrl`); the list needs the same field.
- **Ticker.** `deriveStockTicker()` prefers `stock.underlyingAssetTicker` and
  falls back to stripping a known issuer suffix (`AAPLon` → `AAPL`). The
  fallback only runs when the payload carries no issuer at all — see
  `MarketHomeV2/utils/marketStockEntityRow.ts` and its tests.
- **Sorting.** The stock table sorts locally over the loaded pages, because the
  server sorts by the *token's* market cap/liquidity while these cells show the
  *stock index* figures. Server-side sort keys for the stock fields would let
  this move back to the API (`MarketTokenListBase.tsx`,
  `STOCK_SORT_VALUE_GETTERS`).

## Reusing this on other asset pages

The pieces that are not stock-specific:

- **Page frame** — `MarketHomeV2/utils/marketHomeLayout.ts`. One 1140 centred
  frame for banner, tabs, toolbar and table, with the table inset 12 and its
  cells 8 so the first column lands on the same 20px line as everything else.
  The detail page uses the same numbers (`STOCK_LAYOUT` in
  `MarketDetailV2/layouts/DesktopLayout.tsx`), which is what makes the list and
  the detail page read as one page.
- **Row geometry** — 36px header, 72px rows, values in `$bodyMdMedium`, the
  name column taking the slack the numeric columns leave over, and the trailing
  chart column right-aligned with 32px of trailing space.
- **Row hover** — `MarketRowHoverContext`. The row reports hover, a cell reads
  it; only the cells that read it re-render. Tamagui's `group` is not an option
  here because the shared `Table` renders rows through a memoised component
  that drops the prop.
- **Collapsed entity row** — `collapseStockEntityRows()` plus the entity mode
  of `TokenIdentityItem` (bigger avatar, no chain badge, no issuer logo, no
  contract address, and the subtitle that slides up into "N tokens" on hover).
  The collapse key is the only stock-specific part.
- **Chart block** — Lite/Pro switch (`marketChartModeAtom`, persisted) and the
  share/token price source (`marketPriceSourceAtom`, session-only). The toolbar
  inset is owned by the page via `desktopPaddingHorizontal`, so the chart lines
  up with the column on any page that embeds it.
