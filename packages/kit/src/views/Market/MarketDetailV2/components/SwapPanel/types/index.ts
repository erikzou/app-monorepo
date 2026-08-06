import type { ISwapTokenBase } from '@onekeyhq/shared/types/swap/types';

export type IToken = ISwapTokenBase & {
  speedSwapDefaultAmount: number[];
};

/**
 * `stockDesktop` is the tokenized-stock detail panel on desktop
 * (Figma 25206:18422). Compared with `default` it adds the market token row
 * above the amount input, attaches the quick-amount grid to the input, moves
 * the preset summary under the action button without the quick-switch
 * buttons, and follows the design's spacing scale. Every other surface keeps
 * `default`.
 */
export type ISwapPanelVariant = 'default' | 'stockDesktop';
