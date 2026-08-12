import { useCallback, useState } from 'react';

import { SizableText, Stack, XStack, YStack } from '@onekeyhq/components';
import type { IMarketStockEntity } from '@onekeyhq/shared/types/marketV2';

import { MarketTestIDs } from '../../../testIDs';

import { StockSection } from './StockSection';

const COLLAPSED_LINES = 2;

interface ICompanyFact {
  key: string;
  label: string;
  value: string;
}

/**
 * MOCK DATA — none of these four have a source in the stock index yet
 * (`IMarketStockEntity` carries ticker, name, logo, category and the
 * introduction only). The design's own values are used so the row can be
 * reviewed (Figma 25583:18046); they do not vary by ticker, which is exactly
 * why they must not ship. Replace with the company profile fields.
 */
const MOCK_COMPANY_FACTS: ICompanyFact[] = [
  { key: 'ceo', label: 'CEO', value: 'Timothy Donald Cook' },
  { key: 'employees', label: 'Employees', value: '166,000' },
  { key: 'exchange', label: 'Exchange', value: 'NASDAQ' },
  { key: 'founded', label: 'Founded', value: '1976' },
];

/**
 * Company profile from the stock index: title, the headline facts and the FMP
 * introduction text (English only upstream, so it is not localized here).
 */
export function StockAbout({ entity }: { entity: IMarketStockEntity }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const handleToggle = useCallback(() => setIsExpanded((prev) => !prev), []);

  const introduction = entity.introduction?.trim();
  // TODO(i18n): needs a translation key.
  const aboutToggle = (
    <SizableText
      testID={MarketTestIDs.stockAboutToggle}
      size="$bodyMdMedium"
      color="$text"
      textDecorationLine="underline"
      cursor="pointer"
      onPress={handleToggle}
    >
      {isExpanded ? 'Show Less' : 'Show More'}
    </SizableText>
  );
  const title = entity.ticker ? `About ${entity.ticker}` : 'About';

  if (!entity.name && !introduction) {
    return null;
  }

  return (
    <StockSection title={title} gap="$6">
      {/* Figma 25583:18046: four evenly split facts above the description. */}
      <XStack>
        {MOCK_COMPANY_FACTS.map((fact) => (
          <YStack
            key={fact.key}
            flexGrow={1}
            flexShrink={1}
            flexBasis={0}
            minWidth={0}
            pr="$2.5"
            gap="$1.5"
          >
            <SizableText size="$bodySm" color="$textSubdued">
              {fact.label}
            </SizableText>
            <SizableText size="$bodyMdMedium" color="$text" numberOfLines={1}>
              {fact.value}
            </SizableText>
          </YStack>
        ))}
      </XStack>

      {introduction ? (
        // The toggle sits on the last line of the clamped paragraph (Figma
        // 25319:8688). While collapsed it has to be positioned over the text
        // rather than appended to it — an inline node inside a clamped
        // paragraph is clipped away with the overflow.
        <Stack position="relative">
          <SizableText
            size="$bodyMd"
            color="$textSubdued"
            numberOfLines={isExpanded ? undefined : COLLAPSED_LINES}
          >
            {introduction}
            {isExpanded ? (
              <SizableText size="$bodyMd">{'  '}</SizableText>
            ) : null}
            {isExpanded ? aboutToggle : null}
          </SizableText>
          {isExpanded ? null : (
            <XStack
              position="absolute"
              right={0}
              bottom={0}
              bg="$bgApp"
              pl="$2"
            >
              {aboutToggle}
            </XStack>
          )}
        </Stack>
      ) : null}
    </StockSection>
  );
}
