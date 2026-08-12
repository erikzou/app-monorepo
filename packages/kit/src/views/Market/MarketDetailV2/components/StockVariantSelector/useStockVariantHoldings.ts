import { useMemo } from 'react';

import backgroundApiProxy from '@onekeyhq/kit/src/background/instance/backgroundApiProxy';
import { usePromiseResult } from '@onekeyhq/kit/src/hooks/usePromiseResult';
import { useActiveAccount } from '@onekeyhq/kit/src/states/jotai/contexts/accountSelector';
import type { IMarketStockInstrument } from '@onekeyhq/shared/types/marketV2';

const EMPTY_HOLDINGS: Record<string, string> = {};

/**
 * Holding per tokenized variant, for the variant dropdown's row subtitle.
 *
 * The portfolio endpoint is keyed by (network, token, account), so one call per
 * variant is the only way to cover a ticker that is tokenized on several
 * chains — the page's own position data covers the routed variant alone. Each
 * variant also needs its own network account, which is why the derive type is
 * resolved per network here.
 *
 * Gated on `enabled` (the dropdown being open) and deliberately not polled: a
 * ticker with eight variants would otherwise fan out eight requests every few
 * seconds behind a closed popover. A ticker-level portfolio endpoint would
 * collapse this into one call.
 */
export function useStockVariantHoldings({
  instruments,
  enabled,
}: {
  instruments: IMarketStockInstrument[];
  enabled: boolean;
}) {
  const { activeAccount } = useActiveAccount({ num: 0 });
  const indexedAccountId = activeAccount?.indexedAccount?.id;
  const accountId = indexedAccountId ? undefined : activeAccount?.account?.id;

  // Stable dependency: the hook only fetches again when the variant set
  // changes, not on every re-render of the parent.
  const instrumentsKey = useMemo(
    () =>
      instruments
        .map(
          (item) =>
            `${item.instrumentId}:${item.networkId}:${item.contractAddress}`,
        )
        .join(','),
    [instruments],
  );

  const { result } = usePromiseResult(
    async () => {
      if (!enabled || !instrumentsKey || (!indexedAccountId && !accountId)) {
        return EMPTY_HOLDINGS;
      }

      const entries = await Promise.all(
        instruments.map(async (instrument) => {
          try {
            const deriveType =
              await backgroundApiProxy.serviceNetwork.getGlobalDeriveTypeOfNetwork(
                { networkId: instrument.networkId },
              );
            const account =
              await backgroundApiProxy.serviceAccount.getNetworkAccount({
                accountId,
                indexedAccountId,
                networkId: instrument.networkId,
                deriveType: deriveType ?? 'default',
              });
            if (!account?.address) {
              return undefined;
            }
            const portfolio =
              await backgroundApiProxy.serviceMarketV2.fetchMarketAccountPortfolio(
                {
                  accountAddress: account.address,
                  networkId: instrument.networkId,
                  tokenAddress: instrument.contractAddress,
                },
              );
            const amount = portfolio?.list?.[0]?.amount;
            return amount
              ? ([instrument.instrumentId, amount] as const)
              : undefined;
          } catch {
            // A chain the wallet cannot derive an account for just has no
            // holding to show; it must not take the other rows down with it.
            return undefined;
          }
        }),
      );

      return Object.fromEntries(
        entries.filter((entry): entry is [string, string] => Boolean(entry)),
      );
    },
    [accountId, enabled, indexedAccountId, instruments, instrumentsKey],
    { initResult: EMPTY_HOLDINGS },
  );

  return result;
}
