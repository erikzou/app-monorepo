import { useCallback, useMemo } from 'react';

import { useTheme } from '@tamagui/core';

import { SizableText, Spinner, Stack, YStack } from '@onekeyhq/components';
import { LightweightChart } from '@onekeyhq/kit/src/components/LightweightChart';
import { numberFormat } from '@onekeyhq/shared/src/utils/numberUtils';

import { withAlpha } from './colorUtils';
import {
  MARKET_LITE_CHART_AREA_BOTTOM_ALPHA,
  MARKET_LITE_CHART_AREA_TOP_ALPHA,
  MARKET_LITE_CHART_PRICE_SCALE_MARGINS,
  MARKET_LITE_CHART_PRICE_SCALE_MIN_WIDTH,
} from './constants';
import { useMarketLiteChartData } from './useMarketLiteChartData';

import type { IMarketLiteChartRange } from './constants';

export function MarketLiteChart({
  networkId,
  tokenAddress,
  range,
  height,
}: {
  networkId: string;
  tokenAddress: string;
  range: IMarketLiteChartRange;
  height: number;
}) {
  const theme = useTheme();
  const { data, isLoading } = useMarketLiteChartData({
    networkId,
    tokenAddress,
    range,
  });

  // Tint follows the direction of the range, matching how the header renders
  // gains and losses.
  const isUp = useMemo(() => {
    if (data.length < 2) {
      return true;
    }
    return data[data.length - 1][1] >= data[0][1];
  }, [data]);
  const lineColor = (
    isUp ? theme.textSuccess.val : theme.textCritical.val
  ) as string;
  const topColor = withAlpha(lineColor, MARKET_LITE_CHART_AREA_TOP_ALPHA);
  const bottomColor = withAlpha(lineColor, MARKET_LITE_CHART_AREA_BOTTOM_ALPHA);

  const priceFormatter = useCallback(
    (price: number) =>
      numberFormat(String(price), {
        formatter: 'price',
        formatterOptions: { currency: '$' },
      }) as string,
    [],
  );

  if (isLoading && data.length === 0) {
    return (
      <Stack h={height} alignItems="center" justifyContent="center">
        <Spinner size="large" />
      </Stack>
    );
  }

  if (data.length < 2) {
    return (
      <Stack h={height} alignItems="center" justifyContent="center">
        <SizableText size="$bodySm" color="$textSubdued">
          No chart data for this range
        </SizableText>
      </Stack>
    );
  }

  return (
    <YStack h={height} px="$5" pb="$4">
      <LightweightChart
        data={data}
        height={height - 16}
        lineColor={lineColor}
        topColor={topColor}
        bottomColor={bottomColor}
        lineWidth={2}
        seriesType="area"
        showPriceScale
        showTimeScale
        showHorzGridLines
        showLastPointMarker={false}
        pulseLastPoint
        preserveChartInstanceOnDataChange
        priceScaleMargins={MARKET_LITE_CHART_PRICE_SCALE_MARGINS}
        priceScaleEntireTextOnly
        priceScaleMinimumWidth={MARKET_LITE_CHART_PRICE_SCALE_MIN_WIDTH}
        priceFormatter={priceFormatter}
        fontSize={11}
        useTimeScaleTickMarkWithoutUnit
      />
    </YStack>
  );
}
