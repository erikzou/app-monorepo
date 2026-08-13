import type { ISwapTokenBase } from '@onekeyhq/shared/types/swap/types';

export type IToken = ISwapTokenBase & {
  speedSwapDefaultAmount: number[];
};

/**
 * Per-assembly configurations of the one trade panel. Every other surface keeps
 * `default`.
 *
 * `stockDesktop` is the tokenized-stock detail panel on desktop
 * (Figma 25206:18422). Compared with `default` it adds the market token row
 * above the amount input, attaches the quick-amount grid to the input, moves
 * the preset summary under the action button without the quick-switch
 * buttons, and follows the design's spacing scale.
 *
 * `memeDesktop` is the crypto detail panel on desktop (Figma 25671:53497). It
 * keeps the live panel's order flow — quick amounts by payment token, the gas
 * pre-check and the Review order dialog — and changes only what the design
 * changes: the quick-amount grid attaches to the input with a trailing edit
 * cell, and the rate line becomes an "Est received" row that holds its place
 * with a `--` placeholder so the action button never jumps.
 */
export type ISwapPanelVariant = 'default' | 'stockDesktop' | 'memeDesktop';
