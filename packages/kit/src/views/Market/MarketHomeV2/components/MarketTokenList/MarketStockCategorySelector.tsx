import { memo } from 'react';
import type { ReactNode } from 'react';

import {
  GradientMask,
  ScrollView,
  XStack,
  useMedia,
} from '@onekeyhq/components';
import { ScrollableFilterBar } from '@onekeyhq/kit/src/components/ScrollableFilterBar';
import platformEnv from '@onekeyhq/shared/src/platformEnv';

import { useNetworkFilterScroll } from '../../hooks/useNetworkFilterScroll';
import {
  CategoryFilterItem,
  CategoryFilterItemWithLayout,
} from '../CategoryFilterItem';

import type { IMarketCategoryItem } from '../../types';

interface IMarketStockCategorySelectorProps {
  categories: IMarketCategoryItem[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  containerStyle?: Record<string, unknown>;
  /**
   * Rendered inside the bar, ahead of the category chips and separated by a
   * rule. The Stocks tab puts its market-status chip here so the page-level
   * state reads as part of the same control strip.
   */
  leading?: ReactNode;
}

function MarketStockCategorySelectorImpl({
  categories,
  selectedCategoryId,
  onSelectCategory,
  containerStyle,
  leading,
}: IMarketStockCategorySelectorProps) {
  const { md } = useMedia();
  const {
    scrollViewRef,
    shouldShowLeftGradient,
    shouldShowRightGradient,
    handleLayout,
    handleContentSizeChange,
    handleItemLayout,
    handleScroll,
  } = useNetworkFilterScroll();

  if (categories.length === 0) {
    return null;
  }

  if (!md && !platformEnv.isNative) {
    return (
      // Figma 25507:18231: no container chrome — the status label, a rule and
      // the category chips sit straight on the page, 16 above and 20 below.
      <XStack
        position="relative"
        px="$5"
        pt="$4"
        pb="$5"
        gap="$2.5"
        maxWidth="100%"
        overflow="hidden"
        alignItems="center"
      >
        {leading}
        <XStack flex={1} position="relative">
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onLayout={handleLayout}
            onContentSizeChange={handleContentSizeChange}
          >
            <XStack gap="$0.5">
              {categories.map((category) => (
                <CategoryFilterItem
                  key={category.id}
                  name={category.name}
                  isSelected={category.id === selectedCategoryId}
                  onPress={() => onSelectCategory(category.id)}
                  onLayout={(event) => handleItemLayout(category.id, event)}
                />
              ))}
            </XStack>
          </ScrollView>

          <GradientMask
            opacity={shouldShowLeftGradient ? 1 : 0}
            position="left"
          />
          <GradientMask
            opacity={shouldShowRightGradient ? 1 : 0}
            position="right"
          />
        </XStack>
      </XStack>
    );
  }

  return (
    <ScrollableFilterBar
      selectedItemId={selectedCategoryId}
      itemGap="$2"
      itemPr="$3"
      contentContainerStyle={containerStyle}
    >
      {categories.map((category) => (
        <CategoryFilterItemWithLayout
          key={category.id}
          id={category.id}
          name={category.name}
          isSelected={category.id === selectedCategoryId}
          onPress={() => onSelectCategory(category.id)}
        />
      ))}
    </ScrollableFilterBar>
  );
}

export const MarketStockCategorySelector = memo(
  MarketStockCategorySelectorImpl,
);
