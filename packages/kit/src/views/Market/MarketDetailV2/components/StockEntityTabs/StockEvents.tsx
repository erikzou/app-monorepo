import { SizableText, Stack, XStack, YStack } from '@onekeyhq/components';

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
      <SizableText size="$headingMd" color="$text">
        Events
      </SizableText>
      <YStack gap="$3">
        {MOCK_EVENTS.map((event) => (
          <XStack key={event.key} gap="$3" alignItems="center">
            <Stack
              width="$12"
              py="$1.5"
              alignItems="center"
              bg="$bgSubdued"
              borderRadius="$2"
              borderCurve="continuous"
            >
              <SizableText size="$headingSm" color="$text">
                {event.day}
              </SizableText>
              <SizableText size="$bodySm" color="$textSubdued">
                {event.month}
              </SizableText>
            </Stack>
            <YStack flex={1} minWidth={0} gap="$0.5">
              <SizableText size="$bodyMdMedium" color="$text">
                {event.title}
              </SizableText>
              <SizableText size="$bodySm" color="$textSubdued">
                {event.detail}
              </SizableText>
            </YStack>
          </XStack>
        ))}
      </YStack>
    </YStack>
  );
}
