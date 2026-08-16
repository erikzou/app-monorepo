import { useMemo } from 'react';

import { EPageType, Stack } from '@onekeyhq/components';
import SwapMainLand from '@onekeyhq/kit/src/views/Swap/pages/components/SwapMainLand';
import { swapDefaultSetTokens } from '@onekeyhq/shared/types/swap/SwapProvider.constants';
import {
  ESwapSource,
  ESwapTabSwitchType,
} from '@onekeyhq/shared/types/swap/types';
import type { ISwapToken } from '@onekeyhq/shared/types/swap/types';

/**
 * Seeding only the buy side leaves the pay box empty, because the module's
 * cold-start hydration bails as soon as either side is already set. So pick the
 * counterpart from the same per-network default pair the Swap module uses
 * everywhere else: for a native major the pay side is that network's default
 * stablecoin, and for anything else it is the native coin.
 */
function getDefaultPaymentToken(token?: ISwapToken) {
  if (!token?.networkId) {
    return undefined;
  }
  const defaultPair = swapDefaultSetTokens[token.networkId];
  // Same-network only, deliberately. A cross-chain pair seeds as BRIDGE, which
  // the module folds back into the merged Swap tab and then drops the pay token
  // again, so chains that carry no counterpart in the shared config (BTC and
  // the other UTXO coins) keep an empty pay box until a top-coin payment list
  // exists.
  const counterpart = token.isNative
    ? defaultPair?.toToken
    : defaultPair?.fromToken;
  if (
    !counterpart ||
    (counterpart.contractAddress === token.contractAddress &&
      counterpart.networkId === token.networkId)
  ) {
    return undefined;
  }
  return counterpart;
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
        pageType={EPageType.modal}
        swapInitParams={swapInitParams}
      />
    </Stack>
  );
}
