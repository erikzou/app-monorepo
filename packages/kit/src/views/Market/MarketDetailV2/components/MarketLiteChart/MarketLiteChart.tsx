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
  symbol,
  onHoverChange,
}: {
  networkId: string;
  tokenAddress: string;
  range: IMarketLiteChartRange;
  height: number;
  symbol?: string;
  // Reports the scrubbed point so the header above can follow the crosshair.
  // Called with undefined when the pointer leaves the plot.
  onHoverChange?: (
    point: { time: number; price: number; changePercent?: string } | undefined,
  ) => void;
}) {
  const theme = useTheme();
  const { data, isLoading } = useMarketLiteChartData({
    networkId,
    tokenAddress,
    range,
    symbol,
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

  // The scrubbed change is measured against the first point of the range, so
  // the header reads "what this range has done up to the point under the
  // cursor" rather than switching to an unrelated 24h figure.
  const handleHover = useCallback(
    (point: { time?: number; price?: number; x?: number; y?: number }) => {
      if (!onHoverChange) {
        return;
      }
      if (point.time === undefined || point.price === undefined) {
        onHoverChange(undefined);
        return;
      }
      const base = data[0]?.[1];
      const changePercent =
        base && Number.isFinite(base) && base !== 0
          ? (((point.price - base) / base) * 100).toString()
          : undefined;
      onHoverChange({
        time: point.time,
        price: point.price,
        changePercent,
      });
    },
    [data, onHoverChange],
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
        onHover={onHoverChange ? handleHover : undefined}
      />
    </YStack>
  );
}
