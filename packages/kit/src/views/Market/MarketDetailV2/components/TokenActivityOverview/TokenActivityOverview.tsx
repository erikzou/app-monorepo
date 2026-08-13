import { useEffect, useMemo, useState } from 'react';

import { useIntl } from 'react-intl';

import { Stack } from '@onekeyhq/components';
import { ETranslations } from '@onekeyhq/shared/src/locale';

import { useTokenDetail } from '../../hooks/useTokenDetail';

import { MergedActivityDetail } from './components/MergedActivityDetail';
import { TimeRangeSelector } from './components/TimeRangeSelector';
import { TransactionRow } from './components/TransactionRow';
import { VolumeRow } from './components/VolumeRow';
import { createTimeRangeOption } from './utils/createTimeRangeOption';
import { formatTokenActivityData } from './utils/formatTokenActivityData';

// Windows of the crypto detail assembly (Figma 25671:53654). It leads with 5m
// — the fastest window the payload carries — and drops 8h, which sat between
// two windows nobody switched to it from.
const MERGED_TIME_RANGE_CONFIGS = [
  { key: 'priceChange5mPercent', label: '5m', value: '5m' },
  { key: 'priceChange1hPercent', label: '1h', value: '1h' },
  { key: 'priceChange4hPercent', label: '4h', value: '4h' },
  { key: 'priceChange24hPercent', label: '24h', value: '24h' },
] as const;

const defaultTimeRangeConfigs: Array<{
  labelKey: string;
  value: string;
}> = [
  {
    labelKey: '1H',
    value: '1h',
  },
  {
    labelKey: '4H',
    value: '4h',
  },
  {
    labelKey: '8H',
    value: '8h',
  },
  {
    labelKey: '24H',
    value: '24h',
  },
];

export function TokenActivityOverview({
  pl,
  pr,
  px = '$5',
  variant = 'stacked',
}: {
  pl?: string;
  pr?: string;
  px?: string;
  // `merged` is the crypto desktop assembly: 5m/1h/4h/24h windows and a single
  // bar carrying both the transaction counts and the volumes
  // (Figma 25671:53653). `stacked` keeps the two-bar form everywhere else.
  variant?: 'stacked' | 'merged';
}) {
  const intl = useIntl();
  const isMerged = variant === 'merged';
  const [selectedTimeRange, setSelectedTimeRange] = useState(
    isMerged ? '5m' : '1h',
  );
  const { tokenDetail, isLoading } = useTokenDetail();
  // Only show loading on first load (no tokenDetail yet), not on subsequent refreshes
  const needShowLoading = isLoading && !tokenDetail;

  const timeRangeOptions = useMemo(() => {
    if (isMerged) {
      const mergedOptions = MERGED_TIME_RANGE_CONFIGS.map((config) =>
        createTimeRangeOption(
          tokenDetail,
          config.key,
          config.label,
          config.value,
        ),
      ).filter(Boolean);
      if (mergedOptions.length > 0) {
        return mergedOptions;
      }
      return MERGED_TIME_RANGE_CONFIGS.map((config) => ({
        label: config.label,
        value: config.value,
        percentageChange: '0.00%',
        isPositive: false,
      }));
    }

    const availableOptions = [
      createTimeRangeOption(tokenDetail, 'priceChange1hPercent', '1H', '1h'),
      createTimeRangeOption(tokenDetail, 'priceChange4hPercent', '4H', '4h'),
      createTimeRangeOption(tokenDetail, 'priceChange8hPercent', '8H', '8h'),
      createTimeRangeOption(tokenDetail, 'priceChange24hPercent', '24H', '24h'),
    ].filter(Boolean);

    if (availableOptions.length > 0) {
      return availableOptions;
    }

    return defaultTimeRangeConfigs.map((config) => ({
      label: config.labelKey,
      value: config.value,
      percentageChange: '0.00%',
      isPositive: false,
    }));
  }, [isMerged, tokenDetail]);

  useEffect(() => {
    const isCurrentSelectionValid = timeRangeOptions.some(
      (option) => option.value === selectedTimeRange,
    );

    if (!isCurrentSelectionValid && timeRangeOptions.length > 0) {
      setSelectedTimeRange(timeRangeOptions[0].value);
    }
  }, [timeRangeOptions, selectedTimeRange]);

  const { buys, sells, buyVolume, sellVolume, totalVolume } =
    formatTokenActivityData(tokenDetail, selectedTimeRange);

  const totalTransactions =
    buys !== undefined && sells !== undefined ? buys + sells : undefined;

  return (
    <Stack gap="$3" pl={pl ?? px} pr={pr ?? px} pt="$3" pb="$4">
      <TimeRangeSelector
        options={timeRangeOptions}
        value={selectedTimeRange}
        onChange={(value) => setSelectedTimeRange(value)}
        isLoading={needShowLoading}
      />
      {tokenDetail && isMerged ? (
        <MergedActivityDetail
          rangeLabel={
            timeRangeOptions.find(
              (option) => option.value === selectedTimeRange,
            )?.label ?? selectedTimeRange
          }
          buys={buys}
          sells={sells}
          buyVolume={buyVolume}
          sellVolume={sellVolume}
          totalVolume={totalVolume}
          isLoading={needShowLoading}
        />
      ) : null}
      {tokenDetail && !isMerged ? (
        <>
          <TransactionRow
            label={intl.formatMessage({
              id: ETranslations.dexmarket_details_transactions,
            })}
            buyCount={buys}
            sellCount={sells}
            totalCount={totalTransactions}
            isLoading={needShowLoading}
          />
          <VolumeRow
            label={intl
              .formatMessage({
                id: ETranslations.market_volume_percentage,
              })
              .replace('%', '')
              .trim()}
            buyVolume={buyVolume}
            sellVolume={sellVolume}
            totalVolume={totalVolume}
            isLoading={needShowLoading}
          />
        </>
      ) : null}
    </Stack>
  );
}
