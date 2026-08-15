import { getNetworkIdsMap } from '@onekeyhq/shared/src/config/networkIds';

/**
 * Which configuration of the detail skeleton a token renders as. One page, one
 * frame, three sets of blocks:
 *
 * - `topCoin`  — majors (Figma 25703:18900): Overview-first, Lite chart, and
 *                the Trade module in the right column.
 * - `stock`    — tokenized equities.
 * - `crypto`   — everything else, the meme configuration.
 */
export type IMarketDetailAssembly = 'topCoin' | 'stock' | 'crypto';

/**
 * DEMO WHITELIST — the majors list is still being decided, so the assembly is
 * keyed off two hardcoded native coins. Swap this for the server-driven list
 * (or a flag on the detail payload) once it exists; nothing else in the page
 * needs to change.
 */
export function isTopCoinToken({
  networkId,
  isNative,
}: {
  networkId?: string;
  isNative?: boolean;
}) {
  if (!networkId || !isNative) {
    return false;
  }
  const networkIds = getNetworkIdsMap();
  return networkId === networkIds.eth || networkId === networkIds.btc;
}
