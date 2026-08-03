import { useMemo } from 'react';

import backgroundApiProxy from '@onekeyhq/kit/src/background/instance/backgroundApiProxy';
import { usePromiseResult } from '@onekeyhq/kit/src/hooks/usePromiseResult';
import type { IMarketTokenChart } from '@onekeyhq/shared/types/market';

import { MARKET_LITE_CHART_RANGES } from './constants';

import type { IMarketLiteChartRange } from './constants';

const EMPTY_CHART_DATA: IMarketTokenChart = [];

export function useMarketLiteChartData({
  networkId,
  tokenAddress,
  range,
}: {
  networkId: string;
  tokenAddress: string;
  range: IMarketLiteChartRange;
}) {
  const rangeItem = useMemo(
    () => MARKET_LITE_CHART_RANGES.find((item) => item.label === range),
    [range],
  );

  const { result, isLoading } = usePromiseResult(
    async () => {
      if (!networkId || !tokenAddress || !rangeItem) {
        return EMPTY_CHART_DATA;
      }
      const timeTo = Math.floor(Date.now() / 1000);
      const timeFrom = timeTo - rangeItem.seconds;
      const response =
        await backgroundApiProxy.serviceMarketV2.fetchMarketTokenKline({
          tokenAddress,
          networkId,
          interval: rangeItem.interval,
          timeFrom,
          timeTo,
        });
      // LightweightChart consumes [time, value] pairs where time is a UTC
      // timestamp in seconds; the kline `t` field is already in seconds.
      return (response?.points ?? []).map(
        ({ t, c }) => [t, c] as [number, number],
      );
    },
    [networkId, tokenAddress, rangeItem],
    { watchLoading: true, initResult: EMPTY_CHART_DATA },
  );

  return {
    data: result,
    isLoading: Boolean(isLoading),
  };
}
