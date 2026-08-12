import { Icon, SizableText, Stack, XStack, YStack } from '@onekeyhq/components';

interface IStockEvent {
  key: string;
  day: string;
  month: string;
  title: string;
  detail: string;
}

/**
 * MOCK DATA — the earnings/dividend calendar has no wired source yet, so the
 * section renders placeholder rows to lock the layout down. Swap this array for
 * the real feed once it lands; the section is meant to disappear entirely for
 * tickers with no events.
 */
const MOCK_EVENTS: IStockEvent[] = [
  {
    key: 'dividend',
    day: '10',
    month: 'Aug',
    title: 'Cash Dividends',
    detail: 'Eligibility cutoff: 2026-08-10',
  },
  {
    key: 'earnings',
    day: '28',
    month: 'Oct',
    title: 'Q4 Earnings Call',
    detail: 'Estimated EPS: $2.41',
  },
];

export function StockEvents() {
  return (
    <YStack gap="$4">
      <SizableText size="$headingLg" color="$text">
        Events
      </SizableText>
      {/* Figma 25319:8582: 56px calendar tile, 16 between it and the copy,
          8 of vertical padding per row, and a trailing chevron. */}
      <YStack>
        {MOCK_EVENTS.map((event) => (
          <XStack key={event.key} py="$2" gap="$4" alignItems="center">
            <Stack
              width={56}
              pt={6}
              pb="$2"
              alignItems="center"
              justifyContent="center"
              bg="$bgSubdued"
              borderRadius="$2"
              borderCurve="continuous"
            >
              <SizableText size="$headingMd" color="$text">
                {event.day}
              </SizableText>
              <SizableText size="$bodyMdMedium" color="$textSubdued">
                {event.month}
              </SizableText>
            </Stack>
            <YStack flex={1} minWidth={0} gap="$1">
              <SizableText size="$headingMd" color="$text">
                {event.title}
              </SizableText>
              <SizableText size="$bodyMd" color="$textSubdued">
                {event.detail}
              </SizableText>
            </YStack>
            <Icon
              name="ChevronRightSmallOutline"
              size="$5"
              color="$iconSubdued"
            />
          </XStack>
        ))}
      </YStack>
    </YStack>
  );
}
