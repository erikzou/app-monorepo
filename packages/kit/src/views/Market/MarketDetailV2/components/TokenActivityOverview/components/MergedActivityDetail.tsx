import {
  NumberSizeableText,
  SizableText,
  Skeleton,
  Stack,
  XStack,
} from '@onekeyhq/components';

const BAR_HEIGHT = 6;
const PLACEHOLDER = '--';

function Figures({
  count,
  volume,
}: {
  count: number | undefined;
  volume: number | undefined;
}) {
  if (count === undefined && volume === undefined) {
    return (
      <SizableText size="$bodySm" color="$textSubdued">
        {PLACEHOLDER}
      </SizableText>
    );
  }
  return (
    <XStack alignItems="center" gap="$1">
      <NumberSizeableText
        size="$bodySm"
        color="$textSubdued"
        formatter="marketCap"
      >
        {count ?? PLACEHOLDER}
      </NumberSizeableText>
      <SizableText size="$bodySm" color="$textSubdued">
        /
      </SizableText>
      <NumberSizeableText
        size="$bodySm"
        color="$textSubdued"
        formatter="marketCap"
        formatterOptions={{ currency: '$' }}
      >
        {volume ?? PLACEHOLDER}
      </NumberSizeableText>
    </XStack>
  );
}

/**
 * Merged buy/sell gauge (Figma 25671:53671). One bar carries what the previous
 * two carried: total volume and its net direction on top, the buy/sell split in
 * the bar, and counts with volumes underneath.
 *
 * The net figure is computed here rather than read from the payload — the API
 * carries the two sides, not their difference.
 */
export function MergedActivityDetail({
  rangeLabel,
  buys,
  sells,
  buyVolume,
  sellVolume,
  totalVolume,
  isLoading,
}: {
  rangeLabel: string;
  buys: number | undefined;
  sells: number | undefined;
  buyVolume: number | undefined;
  sellVolume: number | undefined;
  totalVolume: number | undefined;
  isLoading?: boolean;
}) {
  const hasSplit = buyVolume !== undefined && sellVolume !== undefined;
  const netVolume = hasSplit ? buyVolume - sellVolume : undefined;
  // Split on the two volumes' own sum, not on `totalVolume`: the payload's
  // total is its own figure and does not always equal vBuy + vSell, and using
  // it made the bar disagree with the Buy/Sell volumes printed right under it.
  const splitTotal = hasSplit ? buyVolume + sellVolume : 0;
  const buyPercentage =
    hasSplit && splitTotal > 0 ? (buyVolume / splitTotal) * 100 : 0;

  return (
    <Stack>
      <XStack px="$0.5" pb="$2" alignItems="center">
        <XStack flex={1} minWidth={0} gap="$1" alignItems="center">
          {/* TODO(i18n): demo copy, hardcoded English. The label follows the
              selected window, so it reads "5m total vol" / "1h total vol". */}
          <SizableText size="$bodyMd" color="$textSubdued">
            {`${rangeLabel} total vol`}
          </SizableText>
          {isLoading || totalVolume === undefined ? (
            <SizableText size="$bodyMdMedium" color="$text">
              {PLACEHOLDER}
            </SizableText>
          ) : (
            <NumberSizeableText
              size="$bodyMdMedium"
              color="$text"
              formatter="marketCap"
              formatterOptions={{ currency: '$' }}
            >
              {totalVolume}
            </NumberSizeableText>
          )}
        </XStack>
        <XStack
          flex={1}
          minWidth={0}
          gap="$1"
          alignItems="center"
          justifyContent="flex-end"
        >
          <SizableText size="$bodyMd" color="$textSubdued">
            Net vol
          </SizableText>
          {isLoading || netVolume === undefined ? (
            <SizableText size="$bodyMdMedium" color="$text">
              {PLACEHOLDER}
            </SizableText>
          ) : (
            <NumberSizeableText
              size="$bodyMdMedium"
              color={netVolume < 0 ? '$textCritical' : '$textSuccess'}
              formatter="marketCap"
              formatterOptions={{ currency: '$' }}
            >
              {netVolume}
            </NumberSizeableText>
          )}
        </XStack>
      </XStack>

      {isLoading || !hasSplit ? (
        <Skeleton width="100%" height={BAR_HEIGHT} borderRadius="$full" />
      ) : (
        <XStack gap="$1" borderRadius="$full" overflow="hidden">
          <Stack
            width={`${buyPercentage}%`}
            height={BAR_HEIGHT}
            bg="$bgSuccessStrong"
          />
          <Stack
            flex={1}
            minWidth={0}
            height={BAR_HEIGHT}
            bg="$bgCriticalStrong"
          />
        </XStack>
      )}

      <XStack px="$0.5" pt="$2" alignItems="center">
        <XStack flex={1} minWidth={0} gap="$1" alignItems="center">
          <SizableText size="$bodySmMedium" color="$textSuccess">
            Buy
          </SizableText>
          <Figures count={buys} volume={buyVolume} />
        </XStack>
        <XStack
          flex={1}
          minWidth={0}
          gap="$1"
          alignItems="center"
          justifyContent="flex-end"
        >
          <Figures count={sells} volume={sellVolume} />
          <SizableText size="$bodySmMedium" color="$textCritical">
            Sell
          </SizableText>
        </XStack>
      </XStack>
    </Stack>
  );
}
