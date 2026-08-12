import { SizableText, Stack, XStack, YStack } from '@onekeyhq/components';

import { StockSection } from './StockSection';

interface IAnalystRatingBar {
  key: string;
  label: string;
  /** Share of the ratings, 0–100. */
  percent: number;
  color: string;
}

/**
 * MOCK DATA — the analyst consensus has no wired source yet, so the section
 * renders the design's figures (Figma 25583:17996) to lock the layout down.
 * Swap `MOCK_RATINGS`, `MOCK_CONSENSUS` and `MOCK_UPDATED_AT` for the feed;
 * the section is meant to disappear entirely for tickers with no coverage.
 */
const MOCK_RATINGS: IAnalystRatingBar[] = [
  { key: 'buy', label: 'Buy', percent: 70, color: '$bgSuccessStrong' },
  { key: 'hold', label: 'Hold', percent: 20, color: '$bgInverse' },
  { key: 'sell', label: 'Sell', percent: 10, color: '$bgCriticalStrong' },
];
const MOCK_CONSENSUS = { label: 'Buy', count: 47 };
const MOCK_UPDATED_AT = 'Aug 12, 2026';

const CONSENSUS_SIZE = 96;
const BAR_LABEL_WIDTH = 32;
const BAR_VALUE_WIDTH = 48;
const BAR_TRACK_HEIGHT = 4;

function RatingBar({ bar }: { bar: IAnalystRatingBar }) {
  return (
    <XStack gap="$3" alignItems="center" h={32}>
      <SizableText size="$bodyMdMedium" color="$text" w={BAR_LABEL_WIDTH}>
        {bar.label}
      </SizableText>
      <Stack
        flex={1}
        minWidth={0}
        h={BAR_TRACK_HEIGHT}
        borderRadius="$full"
        bg="$neutral5"
      >
        <Stack
          w={`${bar.percent}%`}
          h={BAR_TRACK_HEIGHT}
          borderRadius="$full"
          bg={bar.color}
        />
      </Stack>
      <SizableText
        size="$bodyMdMedium"
        color="$textSubdued"
        minWidth={BAR_VALUE_WIDTH}
        textAlign="right"
        numberOfLines={1}
      >
        {`${bar.percent.toFixed(2)}%`}
      </SizableText>
    </XStack>
  );
}

export function StockAnalystRatings() {
  return (
    <StockSection title="Analyst ratings">
      <XStack gap="$6" alignItems="center" minHeight={48} pr="$2" py="$2">
        <YStack
          w={CONSENSUS_SIZE}
          h={CONSENSUS_SIZE}
          borderRadius="$full"
          bg="$bgSuccessSubdued"
          alignItems="center"
          justifyContent="center"
        >
          <SizableText size="$headingMd" color="$textSuccess">
            {MOCK_CONSENSUS.label}
          </SizableText>
          <SizableText size="$bodySmMedium" color="$textSubdued">
            {`${MOCK_CONSENSUS.count} ratings`}
          </SizableText>
        </YStack>

        <YStack flex={1} minWidth={0} justifyContent="center">
          {MOCK_RATINGS.map((bar) => (
            <RatingBar key={bar.key} bar={bar} />
          ))}
        </YStack>
      </XStack>

      {/* TODO(i18n): needs a translation key. */}
      <SizableText size="$bodySm" color="$textDisabled">
        {`Last Updated: ${MOCK_UPDATED_AT}`}
      </SizableText>
    </StockSection>
  );
}
