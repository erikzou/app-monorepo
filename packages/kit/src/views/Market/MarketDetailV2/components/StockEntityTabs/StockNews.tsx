import { Icon, SizableText, Stack, XStack, YStack } from '@onekeyhq/components';

import { StockSection } from './StockSection';

interface IStockNewsItem {
  key: string;
  source: string;
  publishedAgo: string;
  title: string;
  summary: string;
}

/**
 * MOCK DATA — the news feed has no wired source yet, so the section renders
 * the design's rows (Figma 25579:17742) to lock the layout down. Swap
 * `MOCK_NEWS` for the feed and keep the cap: the design shows three, with the
 * rest living behind the (not yet designed) full list.
 */
const MOCK_NEWS: IStockNewsItem[] = [
  {
    key: 'leadership',
    source: 'Simply Wall St',
    publishedAgo: '2h',
    title: 'Apple Loses Apple Pay Chief Jennifer Bailey In Leadership Handover',
    summary:
      'Apple (NasdaqGS:AAPL) is undergoing a leadership change as Jennifer Bailey, longtime head of Apple Pay and Wallet, retires after more than two decades at the company.',
  },
  {
    key: 'services',
    source: 'Simply Wall St',
    publishedAgo: '5h',
    title: 'Services Revenue Keeps Setting Records As Hardware Cycle Slows',
    summary:
      'The services line has grown faster than devices for six straight quarters, and now carries a materially higher margin than the hardware it is attached to.',
  },
  {
    key: 'supply',
    source: 'Simply Wall St',
    publishedAgo: '1d',
    title: 'Supply Chain Shifts Continue As Assembly Moves Beyond China',
    summary:
      'Assembly partners are expanding capacity in India and Vietnam, a move that spreads tariff exposure but adds cost in the near term.',
  },
];

const MAX_NEWS_ITEMS = 3;
const ROW_HOVER_BLEED = 8;

function NewsRow({ item }: { item: IStockNewsItem }) {
  return (
    // Figma 25579:17747: the row's hover background runs 8px past the text on
    // both sides, so the negative margin pairs with matching padding.
    <XStack
      gap="$4"
      alignItems="center"
      minHeight={48}
      py="$2"
      px={ROW_HOVER_BLEED}
      mx={-ROW_HOVER_BLEED}
      borderRadius="$3"
      borderCurve="continuous"
      // Hover only until the row has somewhere to go: the article view is not
      // built yet, and a pointer cursor on a dead row is worse than none.
      hoverStyle={{ bg: '$bgHover' }}
    >
      <YStack flex={1} minWidth={0} gap="$2">
        <XStack gap="$2" alignItems="center">
          <SizableText size="$bodySm" color="$textSubdued">
            {item.source}
          </SizableText>
          <Stack w="$px" h={10} bg="$borderSubdued" />
          <SizableText size="$bodySm" color="$textSubdued">
            {item.publishedAgo}
          </SizableText>
        </XStack>
        <SizableText size="$bodyLgMedium" color="$text" numberOfLines={1}>
          {item.title}
        </SizableText>
        <SizableText size="$bodyMd" color="$textSubdued" numberOfLines={2}>
          {item.summary}
        </SizableText>
      </YStack>
      <Icon
        name="ChevronRightSmallOutline"
        size="$5"
        color="$iconSubdued"
        flexShrink={0}
      />
    </XStack>
  );
}

export function StockNews() {
  return (
    <StockSection title="News">
      {MOCK_NEWS.slice(0, MAX_NEWS_ITEMS).map((item) => (
        <NewsRow key={item.key} item={item} />
      ))}
    </StockSection>
  );
}
