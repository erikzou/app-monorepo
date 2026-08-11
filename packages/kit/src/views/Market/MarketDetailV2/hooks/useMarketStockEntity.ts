import { useMemo } from 'react';

import backgroundApiProxy from '@onekeyhq/kit/src/background/instance/backgroundApiProxy';
import { usePromiseResult } from '@onekeyhq/kit/src/hooks/usePromiseResult';
import type {
  IMarketStockEntity,
  IMarketStockInstrument,
} from '@onekeyhq/shared/types/marketV2';

import { useTokenDetail } from './useTokenDetail';

/**
 * Resolves the stock entity behind the currently routed token, so the page can
 * present itself as the stock (AAPL) rather than the variant it was opened
 * with (AAPLon on BSC). The routed token stays the selected variant.
 */
export function useMarketStockEntity(): {
  entity?: IMarketStockEntity;
  instruments: IMarketStockInstrument[];
  selectedInstrument?: IMarketStockInstrument;
  isLoading: boolean;
} {
  const { networkId, tokenAddress, tokenDetail } = useTokenDetail();
  const contractAddress = tokenDetail?.address || tokenAddress;

  // Stock identity comes from the instruments table, not from the token
  // detail's `stock` field: that field is only populated for Ondo variants
  // today, so keying off it would drop the whole entity page whenever the user
  // switched to an xStock variant.
  const { result: entity, isLoading } = usePromiseResult(
    async () => {
      if (!networkId || !contractAddress) {
        return undefined;
      }
      return backgroundApiProxy.serviceMarketV2.fetchMarketStockEntityByInstrument(
        {
          networkId,
          contractAddress,
        },
      );
    },
    [networkId, contractAddress],
    { watchLoading: true },
  );

  const instruments = useMemo(() => entity?.instruments ?? [], [entity]);

  const selectedInstrument = useMemo(
    () =>
      instruments.find(
        (item) =>
          item.networkId === networkId &&
          item.contractAddress.toLowerCase() ===
            (contractAddress ?? '').toLowerCase(),
      ),
    [contractAddress, instruments, networkId],
  );

  return {
    entity,
    instruments,
    selectedInstrument,
    isLoading: Boolean(isLoading),
  };
}
