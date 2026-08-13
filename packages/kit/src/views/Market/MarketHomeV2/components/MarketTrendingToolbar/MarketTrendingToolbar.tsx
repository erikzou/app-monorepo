import { memo, useCallback } from 'react';

import {
  GradientMask,
  Icon,
  ScrollView,
  SizableText,
  Stack,
  XStack,
} from '@onekeyhq/components';

import { useNetworkFilterScroll } from '../../hooks/useNetworkFilterScroll';

import {
  MARKET_FILTER_SHORTCUTS,
  findActiveMarketFilterShortcut,
} from './marketTrendingFilterConfig';
import { useMarketTrendingFilter } from './MarketTrendingFilterContext';
import { useShowMarketTrendingFilters } from './MarketTrendingFiltersDialog';

import type { IMarketFilterShortcut } from './marketTrendingFilterTypes';
import type { IMarketTimeRangeValue } from '../../types';

const TIME_RANGE_OPTIONS: IMarketTimeRangeValue[] = ['5m', '1h', '4h', '24h'];

// Figma 25362:43023. Every control in the bar is 30 tall: 20px line box, 4px
// of vertical padding and the 1px transparent ring that the selected state
// swaps for a real border.
const TOOLBAR_ITEM_MIN_WIDTH = 36;
const TOOLBAR_DIVIDER_HEIGHT = 16;
const SHORTCUT_ICON_SIZE = '$4.5';

const TOOLBAR_ITEM_PROPS = {
  alignItems: 'center',
  justifyContent: 'center',
  py: '$1',
  borderRadius: '$2.5',
  borderCurve: 'continuous',
  borderWidth: 1,
  borderColor: '$transparent',
  userSelect: 'none',
  cursor: 'pointer',
  role: 'button',
} as const;

function TimeRangeButton({
  value,
  isSelected,
  onPress,
}: {
  value: IMarketTimeRangeValue;
  isSelected: boolean;
  onPress: (value: IMarketTimeRangeValue) => void;
}) {
  const handlePress = useCallback(() => onPress(value), [onPress, value]);
  return (
    <XStack
      {...TOOLBAR_ITEM_PROPS}
      px="$1.5"
      minWidth={TOOLBAR_ITEM_MIN_WIDTH}
      bg={isSelected ? '$bgActive' : '$transparent'}
      {...(isSelected ? undefined : { hoverStyle: { bg: '$bgHover' } })}
      pressStyle={{ bg: '$bgActive' }}
      onPress={handlePress}
      testID={`market-trending-time-range-${value}`}
    >
      <SizableText
        size="$bodyMdMedium"
        color={isSelected ? '$text' : '$textSubdued'}
      >
        {value}
      </SizableText>
    </XStack>
  );
}

function ShortcutButton({
  shortcut,
  isSelected,
  onPress,
}: {
  shortcut: IMarketFilterShortcut;
  isSelected: boolean;
  onPress: (shortcut: IMarketFilterShortcut) => void;
}) {
  const handlePress = useCallback(() => onPress(shortcut), [onPress, shortcut]);
  return (
    <XStack
      {...TOOLBAR_ITEM_PROPS}
      px="$2.5"
      gap="$2"
      flexShrink={0}
      bg={isSelected ? '$bgActive' : '$transparent'}
      {...(isSelected ? undefined : { hoverStyle: { bg: '$bgHover' } })}
      pressStyle={{ bg: '$bgActive' }}
      onPress={handlePress}
      testID={`market-trending-shortcut-${shortcut.id}`}
    >
      <Icon
        name={shortcut.icon}
        size={SHORTCUT_ICON_SIZE}
        color={isSelected ? '$icon' : '$iconSubdued'}
      />
      <SizableText
        size="$bodyMd"
        color={isSelected ? '$text' : '$textSubdued'}
        numberOfLines={1}
      >
        {shortcut.label}
      </SizableText>
    </XStack>
  );
}

function FiltersCountBadge({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }
  return (
    <XStack
      minWidth={18}
      px="$1"
      py="$px"
      borderRadius="$full"
      bg="$bgInfo"
      alignItems="center"
      justifyContent="center"
    >
      <SizableText size="$bodySmMedium" color="$textInfo">
        {count}
      </SizableText>
    </XStack>
  );
}

/**
 * The Trending sub-header (Figma 25366:45107): the time frame on the left, the
 * shortcut presets next to it behind a scroll fade, and the Filters entry
 * pinned right. It sits in the same 20/16/20 box as the Stocks category bar, so
 * the table header below lands on the same line on both tabs.
 */
function MarketTrendingToolbarImpl({
  timeRange,
  onTimeRangeChange,
}: {
  timeRange: IMarketTimeRangeValue;
  onTimeRangeChange: (value: IMarketTimeRangeValue) => void;
}) {
  const { conditions, sortState, applyConditions, activeConditionCount } =
    useMarketTrendingFilter();
  const showFilters = useShowMarketTrendingFilters({
    timeRange,
    onTimeRangeChange,
  });
  const {
    scrollViewRef,
    shouldShowRightGradient,
    handleLayout,
    handleContentSizeChange,
    handleScroll,
  } = useNetworkFilterScroll();

  const activeShortcut = findActiveMarketFilterShortcut(conditions, sortState);

  const handleShortcutPress = useCallback(
    (shortcut: IMarketFilterShortcut) => {
      // Pressing the lit shortcut clears it, which is the only way back to the
      // unfiltered list without opening the dialog.
      if (activeShortcut?.id === shortcut.id) {
        applyConditions({});
        return;
      }
      applyConditions(shortcut.conditions, { sort: shortcut.sort });
      if (shortcut.timeRange && shortcut.timeRange !== timeRange) {
        onTimeRangeChange(shortcut.timeRange);
      }
    },
    [activeShortcut?.id, applyConditions, onTimeRangeChange, timeRange],
  );

  return (
    <XStack px="$5" pt="$4" pb="$5" gap="$0.5" alignItems="center">
      <XStack flex={1} minWidth={0} gap="$2.5" alignItems="center">
        <XStack gap="$0.5" flexShrink={0}>
          {TIME_RANGE_OPTIONS.map((option) => (
            <TimeRangeButton
              key={option}
              value={option}
              isSelected={option === timeRange}
              onPress={onTimeRangeChange}
            />
          ))}
        </XStack>

        <Stack
          w="$px"
          h={TOOLBAR_DIVIDER_HEIGHT}
          bg="$borderSubdued"
          flexShrink={0}
        />

        <XStack flex={1} minWidth={0} position="relative">
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
              {MARKET_FILTER_SHORTCUTS.map((shortcut) => (
                <ShortcutButton
                  key={shortcut.id}
                  shortcut={shortcut}
                  isSelected={activeShortcut?.id === shortcut.id}
                  onPress={handleShortcutPress}
                />
              ))}
            </XStack>
          </ScrollView>
          <GradientMask
            opacity={shouldShowRightGradient ? 1 : 0}
            position="right"
          />
        </XStack>
      </XStack>

      <XStack
        {...TOOLBAR_ITEM_PROPS}
        pl="$2.5"
        pr="$1.5"
        gap="$2"
        flexShrink={0}
        hoverStyle={{ bg: '$bgHover' }}
        pressStyle={{ bg: '$bgActive' }}
        onPress={showFilters}
        testID="market-trending-filters-trigger"
      >
        {/* TODO(i18n): demo copy, hardcoded English. */}
        <SizableText size="$bodyMd" color="$textSubdued">
          Filters
        </SizableText>
        <FiltersCountBadge count={activeConditionCount} />
        <Icon name="ChevronDownSmallOutline" size="$4" color="$iconSubdued" />
      </XStack>
    </XStack>
  );
}

export const MarketTrendingToolbar = memo(MarketTrendingToolbarImpl);
