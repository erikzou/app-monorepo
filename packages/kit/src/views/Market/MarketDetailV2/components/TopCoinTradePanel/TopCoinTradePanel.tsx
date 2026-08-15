import { useMemo } from 'react';

import { EPageType, Stack } from '@onekeyhq/components';
import SwapMainLand from '@onekeyhq/kit/src/views/Swap/pages/components/SwapMainLand';
import {
  ESwapSource,
  ESwapTabSwitchType,
} from '@onekeyhq/shared/types/swap/types';
import type { ISwapToken } from '@onekeyhq/shared/types/swap/types';

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
  const swapInitParams = useMemo(
    () => ({
      importToToken: swapToken,
      importNetworkId: swapToken?.networkId,
      swapTabSwitchType: ESwapTabSwitchType.SWAP,
      swapSource: ESwapSource.WALLET_HOME_TOKEN_LIST,
    }),
    [swapToken],
  );

  if (!swapToken) {
    return null;
  }

  return (
    <Stack flex={1} minHeight={420}>
      <SwapMainLand
        hideTypeTabs
        pageType={EPageType.modal}
        swapInitParams={swapInitParams}
      />
    </Stack>
  );
}
