import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';

import {
  Button,
  Dialog,
  ScrollView,
  SizableText,
  XStack,
  YStack,
} from '@onekeyhq/components';

import { MARKET_FILTER_DIMENSIONS } from './marketTrendingFilterConfig';
import { useMarketTrendingFilter } from './MarketTrendingFilterContext';
import { TierPill } from './TierPill';

import type {
  IMarketFilterConditions,
  IMarketFilterDimensionConfig,
} from './marketTrendingFilterTypes';
import type { IMarketTimeRangeValue } from '../../types';

const TIME_RANGE_OPTIONS: IMarketTimeRangeValue[] = ['5m', '1h', '4h', '24h'];

// The row label takes the remaining width on the left; the controls sit in a
// fixed column that wraps. Three pills per row, or 2x2 for a four-tier row.
const CONTROL_COLUMN_WIDTH = 232;
const ROW_LABEL_HEIGHT = 30;
const TIER_COLUMNS_DEFAULT = 3;
const TIER_COLUMNS_FOR_FOUR_OPTIONS = 2;
const TIER_MIN_WIDTH_DEFAULT = 72;
const TIER_MIN_WIDTH_WIDE = 80;
const TIME_RANGE_PILL_MIN_WIDTH = 40;
const DIALOG_SCROLL_MAX_HEIGHT = 460;

function getTierColumns(optionCount: number) {
  return optionCount === 4
    ? TIER_COLUMNS_FOR_FOUR_OPTIONS
    : TIER_COLUMNS_DEFAULT;
}

// Equal-width pills on a fixed column grid so every row lines up.
function TierGrid({
  items,
  columns,
}: {
  items: {
    key: string;
    label: string;
    selected?: boolean;
    disabled?: boolean;
    onPress?: () => void;
    testID: string;
  }[];
  columns: number;
}) {
  const rows: (typeof items)[] = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }
  const minWidth =
    columns === TIER_COLUMNS_FOR_FOUR_OPTIONS
      ? TIER_MIN_WIDTH_WIDE
      : TIER_MIN_WIDTH_DEFAULT;
  return (
    <YStack width={CONTROL_COLUMN_WIDTH} gap="$1.5" flexShrink={0}>
      {rows.map((row) => (
        <XStack key={row[0].key} gap="$1.5">
          {row.map((item) => (
            <TierPill
              key={item.key}
              grow
              minWidth={minWidth}
              label={item.label}
              selected={item.selected}
              disabled={item.disabled}
              onPress={item.onPress}
              testID={item.testID}
            />
          ))}
          {row.length < columns
            ? Array.from({ length: columns - row.length }).map((_, index) => (
                <XStack
                  // eslint-disable-next-line react/no-array-index-key
                  key={`spacer-${index}`}
                  flexGrow={1}
                  flexBasis={0}
                />
              ))
            : null}
        </XStack>
      ))}
    </YStack>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <XStack gap="$3" alignItems="flex-start" width="100%">
      <YStack
        flex={1}
        minWidth={0}
        minHeight={ROW_LABEL_HEIGHT}
        pr="$1"
        justifyContent="center"
      >
        <SizableText size="$bodyMd" color="$text">
          {label}
        </SizableText>
      </YStack>
      {children}
    </XStack>
  );
}

function DimensionRow({
  dimension,
  selectedOptionId,
  onSelect,
}: {
  dimension: IMarketFilterDimensionConfig;
  selectedOptionId?: string;
  onSelect: (optionId: string | undefined) => void;
}) {
  return (
    <FilterRow
      label={
        dimension.unit
          ? `${dimension.label} (${dimension.unit})`
          : dimension.label
      }
    >
      <TierGrid
        columns={getTierColumns(dimension.options.length)}
        items={dimension.options.map((option) => ({
          key: option.id,
          label: option.label,
          selected: option.id === selectedOptionId,
          onPress: () =>
            onSelect(option.id === selectedOptionId ? undefined : option.id),
          testID: `market-trending-filter-${dimension.id}-${option.id}`,
        }))}
      />
    </FilterRow>
  );
}

/**
 * Dialog body. It receives the committed state as a snapshot instead of reading
 * the filter context: Dialog portals render outside the Market provider
 * subtree, so context would resolve to the empty default there.
 */
function MarketTrendingFiltersContent({
  initialConditions,
  initialTimeRange,
  onApply,
  onApplyTimeRange,
  onClose,
}: {
  initialConditions: IMarketFilterConditions;
  initialTimeRange: IMarketTimeRangeValue;
  onApply: (next: IMarketFilterConditions) => void;
  onApplyTimeRange: (value: IMarketTimeRangeValue) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<IMarketFilterConditions>({
    ...initialConditions,
  });
  // The time frame is drafted alongside the conditions and committed together,
  // so the dialog never half-applies while the user is still choosing.
  const [draftTimeRange, setDraftTimeRange] =
    useState<IMarketTimeRangeValue>(initialTimeRange);

  const handleSelect = useCallback(
    (dimension: IMarketFilterDimensionConfig, optionId: string | undefined) => {
      setDraft((prev) => {
        const next = { ...prev };
        if (optionId === undefined) {
          delete next[dimension.id];
        } else {
          next[dimension.id] = optionId;
        }
        return next;
      });
    },
    [],
  );

  const handleReset = useCallback(() => setDraft({}), []);
  const handleConfirm = useCallback(() => {
    if (draftTimeRange !== initialTimeRange) {
      onApplyTimeRange(draftTimeRange);
    }
    onApply(draft);
    onClose();
  }, [
    draft,
    draftTimeRange,
    initialTimeRange,
    onApply,
    onApplyTimeRange,
    onClose,
  ]);

  return (
    <YStack gap="$5">
      {/* The Dialog frame has no scroll of its own; cap the section list so a
          long stack scrolls internally and the footer stays pinned. */}
      <ScrollView
        maxHeight={DIALOG_SCROLL_MAX_HEIGHT}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$6">
          <FilterRow label="Time frame">
            <XStack width={CONTROL_COLUMN_WIDTH} gap="$1" flexShrink={0}>
              {TIME_RANGE_OPTIONS.map((option) => (
                <TierPill
                  key={option}
                  grow
                  variant="plain"
                  minWidth={TIME_RANGE_PILL_MIN_WIDTH}
                  label={option}
                  selected={option === draftTimeRange}
                  onPress={() => setDraftTimeRange(option)}
                  testID={`market-trending-filter-time-range-${option}`}
                />
              ))}
            </XStack>
          </FilterRow>
          {MARKET_FILTER_DIMENSIONS.map((dimension) => (
            <DimensionRow
              key={dimension.id}
              dimension={dimension}
              selectedOptionId={draft[dimension.id]}
              onSelect={(optionId) => handleSelect(dimension, optionId)}
            />
          ))}
        </YStack>
      </ScrollView>
      {/* Two equal-width actions: secondary Reset, primary Confirm. The
          dialog's own close button covers dismissal. */}
      <XStack gap="$2.5">
        <Button
          flex={1}
          size="medium"
          onPress={handleReset}
          testID="market-trending-filters-reset"
        >
          Reset
        </Button>
        <Button
          flex={1}
          size="medium"
          variant="primary"
          onPress={handleConfirm}
          testID="market-trending-filters-confirm"
        >
          Confirm
        </Button>
      </XStack>
    </YStack>
  );
}

/**
 * Opens the filter dialog. Must be called from inside the Market provider
 * subtree: Dialog portals render outside it, so the current state and the
 * setters are snapshotted here and handed to the content as props. Desktop
 * renders it as a centered modal, native as a bottom sheet — that is Dialog's
 * own platform behavior, so both entry points share this one path.
 */
export function useShowMarketTrendingFilters({
  timeRange,
  onTimeRangeChange,
}: {
  timeRange: IMarketTimeRangeValue;
  onTimeRangeChange: (value: IMarketTimeRangeValue) => void;
}) {
  const { conditions, applyConditions } = useMarketTrendingFilter();
  return useCallback(() => {
    const dialog = Dialog.show({
      // TODO(i18n): demo copy, hardcoded English.
      title: 'Filters',
      showFooter: false,
      renderContent: (
        <MarketTrendingFiltersContent
          initialConditions={conditions}
          initialTimeRange={timeRange}
          onApply={applyConditions}
          onApplyTimeRange={onTimeRangeChange}
          onClose={() => {
            void dialog.close();
          }}
        />
      ),
    });
  }, [applyConditions, conditions, onTimeRangeChange, timeRange]);
}
