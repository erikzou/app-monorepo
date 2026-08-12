import { useCallback, useState } from 'react';

import {
  Button,
  Icon,
  SizableText,
  Stack,
  XStack,
  YStack,
} from '@onekeyhq/components';

import { MarketTestIDs } from '../../../testIDs';

import { StockSection } from './StockSection';

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
  {
    key: 'shareholders',
    day: '26',
    month: 'Feb',
    title: 'Annual Shareholders Meeting',
    detail: 'Proxy voting closes 2027-02-24',
  },
  {
    key: 'split',
    day: '14',
    month: 'May',
    title: 'Stock Split Record Date',
    detail: 'Ratio to be confirmed',
  },
];

// Figma 25317:8530: two rows, the rest behind the expander.
const COLLAPSED_EVENT_COUNT = 2;

export function StockEvents() {
  const [showAllEvents, setShowAllEvents] = useState(false);
  const handleToggleEvents = useCallback(
    () => setShowAllEvents((prev) => !prev),
    [],
  );
  const visibleEvents = showAllEvents
    ? MOCK_EVENTS
    : MOCK_EVENTS.slice(0, COLLAPSED_EVENT_COUNT);
  const canExpand = MOCK_EVENTS.length > COLLAPSED_EVENT_COUNT;

  return (
    <StockSection title="Events">
      {/* Figma 25319:8582: 56px calendar tile, 16 between it and the copy,
          48-tall rows 8 apart, and a trailing chevron. */}
      <YStack gap="$2">
        {visibleEvents.map((event) => (
          <XStack
            key={event.key}
            py="$2"
            minHeight={48}
            gap="$4"
            alignItems="center"
          >
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
              <SizableText size="$bodyLgMedium" color="$text">
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

      {canExpand ? (
        <Stack alignSelf="flex-start">
          <Button
            testID={MarketTestIDs.stockEventsToggle}
            size="small"
            variant="tertiary"
            iconAfter={
              showAllEvents
                ? 'ChevronTopSmallOutline'
                : 'ChevronDownSmallOutline'
            }
            onPress={handleToggleEvents}
          >
            {/* TODO(i18n): needs a translation key. */}
            {showAllEvents ? 'Show less' : 'Show more'}
          </Button>
        </Stack>
      ) : null}
    </StockSection>
  );
}
