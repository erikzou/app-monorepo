import { useMemo } from 'react';

import { EPageType, Stack } from '@onekeyhq/components';
import SwapMainLand from '@onekeyhq/kit/src/views/Swap/pages/components/SwapMainLand';
import { swapDefaultSetTokens } from '@onekeyhq/shared/types/swap/SwapProvider.constants';
import {
  ESwapSource,
  ESwapTabSwitchType,
} from '@onekeyhq/shared/types/swap/types';
import type { ISwapToken } from '@onekeyhq/shared/types/swap/types';

// The all-networks entry in the shared default map; its pay token is the
// cross-chain default (USDC on Ethereum).
const ALL_NETWORK_DEFAULT_PAIR_ID = 'onekeyall--0';

/**
 * Seeding only the buy side leaves the pay box empty, because the module's
 * cold-start hydration bails as soon as either side is already set. So pick the
 * counterpart out of the same per-network default pair the Swap module uses
 * everywhere else, choosing whichever half of that pair is not the coin this
 * page is about.
 *
 * The market's swap token does not carry `isNative`, so the side is decided by
 * comparing the tokens themselves rather than by trusting that flag.
 */
function isSameToken(a?: ISwapToken, b?: ISwapToken) {
  return Boolean(
    a &&
    b &&
    a.networkId === b.networkId &&
    (a.contractAddress ?? '').toLowerCase() ===
      (b.contractAddress ?? '').toLowerCase(),
  );
}

function getDefaultPaymentToken(token?: ISwapToken) {
  if (!token?.networkId) {
    return undefined;
  }
  const defaultPair = swapDefaultSetTokens[token.networkId];
  const sameNetworkCounterpart = [
    defaultPair?.toToken,
    defaultPair?.fromToken,
  ].find((candidate) => candidate && !isSameToken(candidate, token));
  // Chains whose default entry carries only the native coin (BTC and the other
  // UTXO chains) have no same-chain counterpart, and majors there are bought by
  // bridging anyway, so fall back to the cross-chain default pay token the Swap
  // module already ships.
  const counterpart =
    sameNetworkCounterpart ??
    swapDefaultSetTokens[ALL_NETWORK_DEFAULT_PAIR_ID]?.toToken;
  return isSameToken(counterpart, token) ? undefined : counterpart;
}

/**
 * Right column of the top-coin assembly (Figma 25703:19313). Unlike the other
 * two assemblies, majors trade through the Swap module itself rather than
 * through the market's speed-swap panel: the design's card *is* the Trade >
 * Swap & Bridge card, down to the From/To boxes and the direction button.
 *
 * So this mounts that module rather than reproducing it. It runs on the modal
 * store, which keeps the embedded instance's tokens and amounts separate from
 * the Trade tab's own state, and it is seeded with the coin this page is about
 * as the buy side.
 */
export function TopCoinTradePanel({ swapToken }: { swapToken?: ISwapToken }) {
  const swapInitParams = useMemo(() => {
    const paymentToken = getDefaultPaymentToken(swapToken);
    return {
      importFromToken: paymentToken,
      importToToken: swapToken,
      importNetworkId: swapToken?.networkId,
      swapTabSwitchType: ESwapTabSwitchType.SWAP,
      swapSource: ESwapSource.WALLET_HOME_TOKEN_LIST,
    };
  }, [swapToken]);

  if (!swapToken) {
    return null;
  }

  return (
    <Stack flex={1} minHeight={420}>
      <SwapMainLand
        hideTypeTabs
        hideKLineButton
        compactActions={false}
        demoQuote
        pageType={EPageType.modal}
        swapInitParams={swapInitParams}
      />
    </Stack>
  );
}
