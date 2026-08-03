import { useCallback, useMemo, useState } from 'react';

import {
  Badge,
  Button,
  SizableText,
  XStack,
  YStack,
} from '@onekeyhq/components';
import type { IMarketStockEntity } from '@onekeyhq/shared/types/marketV2';

import { useMarketBasicConfig } from '../../../hooks/useMarketBasicConfig';
import { MarketTestIDs } from '../../../testIDs';

const COLLAPSED_LINES = 4;

/**
 * Company profile from the stock index: name, categories and the FMP
 * introduction text (English only upstream, so it is not localized here).
 */
export function StockAbout({ entity }: { entity: IMarketStockEntity }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const handleToggle = useCallback(() => setIsExpanded((prev) => !prev), []);

  // Chips show the localized names from the categories endpoint (same source
  // as the Stocks tab filter bar), never the raw taxonomy key.
  const { stockCategories } = useMarketBasicConfig();
  const categoryNames = useMemo(() => {
    const nameByKey = new Map(
      stockCategories.map((item) => [item.category, item.name]),
    );
    return (entity.category ?? [])
      .map((key) => nameByKey.get(key))
      .filter((name): name is string => Boolean(name));
  }, [entity.category, stockCategories]);
  const introduction = entity.introduction?.trim();

  if (!entity.name && categoryNames.length === 0 && !introduction) {
    return null;
  }

  return (
    <YStack gap="$3">
      <SizableText size="$headingMd" color="$text">
        About
      </SizableText>

      {/* Company name and its categories share one line. */}
      <XStack flexWrap="wrap" alignItems="center" gap="$2">
        {entity.name ? (
          <SizableText size="$bodyMdMedium" color="$text">
            {entity.name}
          </SizableText>
        ) : null}
        {categoryNames.map((name) => (
          <Badge key={name} badgeType="default" badgeSize="sm">
            {name}
          </Badge>
        ))}
      </XStack>

      {introduction ? (
        <YStack gap="$2" alignItems="flex-start">
          <SizableText
            size="$bodyMd"
            color="$textSubdued"
            numberOfLines={isExpanded ? undefined : COLLAPSED_LINES}
          >
            {introduction}
          </SizableText>
          <Button
            testID={MarketTestIDs.stockAboutToggle}
            size="small"
            variant="tertiary"
            onPress={handleToggle}
          >
            {isExpanded ? 'View Less' : 'View More'}
          </Button>
        </YStack>
      ) : null}
    </YStack>
  );
}
