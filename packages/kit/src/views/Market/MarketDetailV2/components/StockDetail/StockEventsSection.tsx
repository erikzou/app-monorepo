import { useIntl } from 'react-intl';

import { Icon, SizableText, XStack, YStack } from '@onekeyhq/components';
import { ETranslations } from '@onekeyhq/shared/src/locale';

import { StockDetailSection } from './StockDetailSection';

export interface IStockEventItem {
  id: string;
  /** Day of month, e.g. "10". */
  day: string;
  /** Short month, e.g. "Aug". */
  month: string;
  title: string;
  description: string;
  onPress?: () => void;
}

// TODO(data): sample rows so the section is reviewable before the events feed
// exists. Delete once `events` is wired to the API.
const PLACEHOLDER_EVENTS: IStockEventItem[] = [
  {
    id: 'placeholder-1',
    day: '10',
    month: 'Aug',
    title: 'Cash Dividends',
    description: 'Eligibility cutoff: 2026-08-10',
  },
  {
    id: 'placeholder-2',
    day: '10',
    month: 'Aug',
    title: 'Cash Dividends',
    description: 'Eligibility cutoff: 2026-08-10',
  },
];

function EventDateChip({ children }: { children: React.ReactNode }) {
  return (
    <YStack
      w={56}
      bg="$bgSubdued"
      borderRadius="$2"
      borderCurve="continuous"
      pt={6}
      pb="$2"
      px="$4"
      alignItems="center"
      justifyContent="center"
    >
      {children}
    </YStack>
  );
}

function EventRow({ item }: { item: IStockEventItem }) {
  return (
    <XStack
      minHeight={48}
      py="$2"
      gap="$4"
      alignItems="center"
      cursor={item.onPress ? 'pointer' : undefined}
      onPress={item.onPress}
    >
      <EventDateChip>
        <SizableText size="$headingMd" color="$text">
          {item.day}
        </SizableText>
        <SizableText size="$bodyMdMedium" color="$textSubdued">
          {item.month}
        </SizableText>
      </EventDateChip>
      <YStack flex={1} minWidth={0} gap="$1">
        <SizableText size="$bodyLgMedium" color="$text" numberOfLines={1}>
          {item.title}
        </SizableText>
        <SizableText size="$bodyMd" color="$textSubdued">
          {item.description}
        </SizableText>
      </YStack>
      <Icon name="ChevronRightSmallOutline" size="$5" color="$iconSubdued" />
    </XStack>
  );
}

/**
 * Corporate events list (Figma 25317:8530). The backend does not expose an
 * events feed yet, so the section renders sample rows and takes the data
 * through `events` once it is available.
 */
export function StockEventsSection({
  events = PLACEHOLDER_EVENTS,
}: {
  events?: IStockEventItem[];
}) {
  const intl = useIntl();

  return (
    <StockDetailSection
      gap="$4"
      title={intl.formatMessage({
        id: ETranslations.market_chart_settings__events,
      })}
    >
      <YStack gap="$2">
        {events.map((item) => (
          <EventRow key={item.id} item={item} />
        ))}
      </YStack>
    </StockDetailSection>
  );
}
