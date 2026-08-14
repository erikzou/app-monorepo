import { type ReactNode, memo, useMemo } from 'react';

import { useIntl } from 'react-intl';

import type { IKeyOfIcons } from '@onekeyhq/components';
import { IconButton, ScrollView, Stack, XStack } from '@onekeyhq/components';
import { ETranslations } from '@onekeyhq/shared/src/locale';

import { CalendarPanelPopover } from './calendarControls/CalendarPanelPopover';
import { ChartTypeSelect } from './chartType/ChartTypeSelect';
import { IndicatorPopover } from './indicatorSelector/NativeIndicatorSelector';
import { TradingViewNativeIntervalSelector } from './intervalSelector/NativeIntervalSelector';
import { PriceMarketCapSelect } from './priceMarketCap/PriceMarketCapSelect';
import { HEADER_ICON_BUTTON_STYLE_PROPS } from './utils/NativeChartControlsShared';

import type {
  ICalendarPanelAvailableTimeRange,
  ICalendarPanelSubmitPayload,
} from './calendarControls/CalendarPanelPopover';
import type { ITradingViewNativeIntervalControlMode } from './intervalSelector/NativeIntervalSelector';
import type {
  ITradingViewChartTypeOption,
  ITradingViewIndicatorOption,
  ITradingViewIntervalConfigData,
  ITradingViewNativeChartControlsConfigData,
  ITradingViewNativeControlsLayoutMode,
  ITradingViewPriceMarketCapMode,
} from './types';

type IPriceMarketCapConfig =
  ITradingViewNativeChartControlsConfigData['priceMarketCap'];

export interface ITradingViewChartControlsProps {
  intervalConfig: ITradingViewIntervalConfigData | null;
  activeChartType: number | undefined;
  activeIndicatorValues: Set<string>;
  chartSettingsTitle: string;
  chartStyleTitle: string;
  chartTypeToggleIcon: IKeyOfIcons;
  chartTypes: ITradingViewChartTypeOption[];
  hasVisibleControls: boolean;
  hasVisibleIndicators: boolean;
  hasVisibleIntervalSelector: boolean;
  indicators: ITradingViewIndicatorOption[];
  indicatorsTitle: string;
  nextChartTypeLabel: string;
  priceMarketCap: IPriceMarketCapConfig;
  settingsEnabled: boolean;
  showChartTypeSelect: boolean;
  showChartTypeToggle: boolean;
  showIndicatorPopover: boolean;
  showPriceMarketCapSelect: boolean;
  maxSubIndicatorCount?: number;
  isControlsReady: boolean;
  intervalControlMode: ITradingViewNativeIntervalControlMode;
  layoutMode: ITradingViewNativeControlsLayoutMode;
  chartTimezone: string;
  calendarAvailableTimeRange?: ICalendarPanelAvailableTimeRange;
  isFullscreen: boolean;
  fullscreenHeader?: ReactNode;
  // Slot rendered in the right-hand control group, immediately after the
  // price/market-cap select. Desktop layout only.
  rightGroupTrailingControl?: ReactNode;
  /**
   * Horizontal inset of the desktop toolbar. Pages that already place the
   * chart inside their own gutter pass 0 so the toolbar lines up with the rest
   * of the column instead of sitting one padding further in.
   */
  desktopPaddingHorizontal?: number | string;
  onIntervalChange: (interval: string) => void;
  onIndicatorPress: (indicator: ITradingViewIndicatorOption) => void;
  onShowIndicatorsDialog: () => void;
  onChartTypeChange: (chartType: number) => void;
  onChartTypeToggle: () => void;
  onPriceMarketCapModeChange: (mode: ITradingViewPriceMarketCapMode) => void;
  onCalendarPanelOpen?: () => void;
  onCalendarPanelSubmit?: (payload: ICalendarPanelSubmitPayload) => void;
  onSettingsPress: () => void;
  onControlInteraction?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onFullscreenToggle?: () => void;
}

function ToolbarSeparator() {
  return <Stack h="$6" w="$px" bg="$borderSubdued" flexShrink={0} />;
}

const DESKTOP_CONTROLS_HEIGHT = 38;
const DESKTOP_FULLSCREEN_CONTROLS_HEIGHT = 64;
export const TRADING_VIEW_CHART_CONTROLS_HEIGHT = 48;

export const TradingViewChartControls = memo(
  ({
    intervalConfig,
    activeChartType,
    activeIndicatorValues,
    chartSettingsTitle,
    chartStyleTitle,
    chartTypeToggleIcon,
    chartTypes,
    hasVisibleControls,
    hasVisibleIndicators,
    hasVisibleIntervalSelector,
    indicators,
    indicatorsTitle,
    nextChartTypeLabel,
    priceMarketCap,
    settingsEnabled,
    showChartTypeSelect,
    showChartTypeToggle,
    showIndicatorPopover,
    showPriceMarketCapSelect,
    maxSubIndicatorCount,
    isControlsReady,
    intervalControlMode,
    layoutMode,
    chartTimezone,
    calendarAvailableTimeRange,
    isFullscreen,
    fullscreenHeader,
    rightGroupTrailingControl,
    desktopPaddingHorizontal,
    onIntervalChange,
    onIndicatorPress,
    onShowIndicatorsDialog,
    onChartTypeChange,
    onChartTypeToggle,
    onPriceMarketCapModeChange,
    onCalendarPanelOpen,
    onCalendarPanelSubmit,
    onSettingsPress,
    onControlInteraction,
    onUndo,
    onRedo,
    onFullscreenToggle,
  }: ITradingViewChartControlsProps) => {
    const intl = useIntl();
    const isDesktopLayout = layoutMode === 'desktop';
    const hasCalendarControl = Boolean(
      isDesktopLayout && onCalendarPanelSubmit,
    );
    const hasFullscreenControl = Boolean(onFullscreenToggle);
    const hasHistoryControls = Boolean(isDesktopLayout && onUndo && onRedo);
    const desktopFullscreenHeader =
      isDesktopLayout && isFullscreen ? fullscreenHeader : null;

    const chartTypeControl = useMemo(() => {
      if (showChartTypeSelect) {
        return (
          <ChartTypeSelect
            title={chartStyleTitle}
            chartTypes={chartTypes}
            activeChartType={activeChartType}
            onChartTypeChange={onChartTypeChange}
            onControlInteraction={onControlInteraction}
          />
        );
      }

      if (showChartTypeToggle) {
        return (
          <IconButton
            testID="trading-view-native-chart-type-toggle"
            size="small"
            variant="tertiary"
            icon={chartTypeToggleIcon}
            iconSize="$5"
            title={nextChartTypeLabel}
            onPress={onChartTypeToggle}
            {...HEADER_ICON_BUTTON_STYLE_PROPS}
          />
        );
      }

      return null;
    }, [
      activeChartType,
      chartStyleTitle,
      chartTypeToggleIcon,
      chartTypes,
      nextChartTypeLabel,
      onChartTypeChange,
      onChartTypeToggle,
      onControlInteraction,
      showChartTypeSelect,
      showChartTypeToggle,
    ]);

    const indicatorControl = useMemo(() => {
      if (!hasVisibleIndicators) {
        return null;
      }

      if (showIndicatorPopover) {
        return (
          <IndicatorPopover
            title={indicatorsTitle}
            indicators={indicators}
            activeIndicatorValues={activeIndicatorValues}
            maxSubIndicatorCount={maxSubIndicatorCount}
            onIndicatorPress={onIndicatorPress}
            onControlInteraction={onControlInteraction}
          />
        );
      }

      return (
        <IconButton
          testID="trading-view-native-indicators-trigger"
          size="small"
          variant="tertiary"
          icon="FunctionCustom"
          iconSize="$5"
          title={indicatorsTitle}
          onPress={onShowIndicatorsDialog}
          {...HEADER_ICON_BUTTON_STYLE_PROPS}
        />
      );
    }, [
      activeIndicatorValues,
      hasVisibleIndicators,
      indicators,
      indicatorsTitle,
      maxSubIndicatorCount,
      onControlInteraction,
      onIndicatorPress,
      onShowIndicatorsDialog,
      showIndicatorPopover,
    ]);

    const priceMarketCapControl = useMemo(() => {
      if (!showPriceMarketCapSelect || !priceMarketCap) {
        return null;
      }

      return (
        <PriceMarketCapSelect
          priceMarketCap={priceMarketCap}
          onPriceMarketCapModeChange={onPriceMarketCapModeChange}
          onControlInteraction={onControlInteraction}
        />
      );
    }, [
      onControlInteraction,
      onPriceMarketCapModeChange,
      priceMarketCap,
      showPriceMarketCapSelect,
    ]);

    const calendarControl =
      hasCalendarControl && onCalendarPanelSubmit ? (
        <CalendarPanelPopover
          availableTimeRange={calendarAvailableTimeRange}
          chartTimezone={chartTimezone}
          onOpen={onCalendarPanelOpen}
          onSubmit={onCalendarPanelSubmit}
          onControlInteraction={onControlInteraction}
        />
      ) : null;

    const settingsControl = settingsEnabled ? (
      <IconButton
        testID="trading-view-native-chart-settings-trigger"
        size="small"
        variant="tertiary"
        icon="SliderHorOutline"
        iconSize="$5"
        title={chartSettingsTitle}
        onPress={onSettingsPress}
        {...HEADER_ICON_BUTTON_STYLE_PROPS}
      />
    ) : null;

    const fullscreenControl = hasFullscreenControl ? (
      <IconButton
        testID="trading-view-native-fullscreen-toggle"
        size="small"
        variant="tertiary"
        icon={
          isFullscreen
            ? 'TradingViewExitFullscreenCustom'
            : 'TradingViewFullscreenCustom'
        }
        iconSize="$5"
        title={intl.formatMessage({
          id: isFullscreen
            ? ETranslations.global_collapse
            : ETranslations.global_expand,
        })}
        onPress={onFullscreenToggle}
        {...HEADER_ICON_BUTTON_STYLE_PROPS}
      />
    ) : null;

    const undoRedoControls =
      hasHistoryControls && onUndo && onRedo ? (
        <XStack gap="$0.5" alignItems="center" flexShrink={0}>
          <IconButton
            testID="trading-view-native-undo"
            size="small"
            variant="tertiary"
            icon="UndoOutline"
            iconSize="$5"
            title={intl.formatMessage({ id: ETranslations.menu_undo })}
            onPress={onUndo}
            {...HEADER_ICON_BUTTON_STYLE_PROPS}
          />
          <IconButton
            testID="trading-view-native-redo"
            size="small"
            variant="tertiary"
            icon="UndoFlipHorOutline"
            iconSize="$5"
            title={intl.formatMessage({ id: ETranslations.menu_redo })}
            onPress={onRedo}
            {...HEADER_ICON_BUTTON_STYLE_PROPS}
          />
        </XStack>
      ) : null;

    if (
      isControlsReady &&
      !hasVisibleControls &&
      !hasCalendarControl &&
      !hasFullscreenControl &&
      !hasHistoryControls &&
      !desktopFullscreenHeader
    ) {
      return null;
    }

    const intervalSelector = hasVisibleIntervalSelector ? (
      <TradingViewNativeIntervalSelector
        intervalConfig={intervalConfig}
        intervalControlMode={intervalControlMode}
        onIntervalChange={onIntervalChange}
        onControlInteraction={onControlInteraction}
      />
    ) : null;
    const hasLeftChartTools = Boolean(
      chartTypeControl ||
      indicatorControl ||
      calendarControl ||
      settingsControl,
    );

    if (isDesktopLayout) {
      return (
        <Stack
          bg="$bgApp"
          px={
            desktopPaddingHorizontal ?? (desktopFullscreenHeader ? '$2' : '$4')
          }
          py="$1"
          h={
            desktopFullscreenHeader
              ? DESKTOP_FULLSCREEN_CONTROLS_HEIGHT
              : DESKTOP_CONTROLS_HEIGHT
          }
          justifyContent="center"
          zIndex={3}
        >
          <XStack alignItems="center" width="100%" gap="$2">
            {/* Everything the chart itself owns fades in with the chart, but
                the caller's trailing control does not: it can be the only way
                back out of this chart (the market Lite/Pro switch), so hiding
                it until the handshake lands would trap the user here whenever
                the chart is slow or fails to boot. */}
            <XStack
              flex={1}
              minWidth={0}
              alignItems="center"
              gap="$2"
              opacity={isControlsReady ? 1 : 0}
              pointerEvents={isControlsReady ? 'auto' : 'none'}
            >
              {desktopFullscreenHeader}

              <ScrollView
                horizontal
                flex={1}
                minWidth={0}
                showsHorizontalScrollIndicator={false}
              >
                <XStack alignItems="center" gap="$2" flexShrink={0}>
                  {intervalSelector}

                  {intervalSelector && hasLeftChartTools ? (
                    <ToolbarSeparator />
                  ) : null}

                  {hasLeftChartTools ? (
                    <XStack gap="$0.5" alignItems="center" flexShrink={0}>
                      {chartTypeControl}
                      {indicatorControl}
                      {calendarControl}
                      {settingsControl}
                    </XStack>
                  ) : null}

                  {(intervalSelector || hasLeftChartTools) &&
                  undoRedoControls ? (
                    <ToolbarSeparator />
                  ) : null}

                  {undoRedoControls}
                </XStack>
              </ScrollView>

              <XStack gap="$2" alignItems="center" flexShrink={0}>
                {priceMarketCapControl}
              </XStack>
            </XStack>

            {fullscreenControl ? (
              <XStack
                gap="$2"
                alignItems="center"
                flexShrink={0}
                opacity={isControlsReady ? 1 : 0}
                pointerEvents={isControlsReady ? 'auto' : 'none'}
              >
                {priceMarketCapControl ? <ToolbarSeparator /> : null}

                {fullscreenControl}
              </XStack>
            ) : null}

            {/* Last item, so the caller's control (the market Lite/Pro switch)
                sits flush right in this toolbar exactly as it does in the Lite
                one — otherwise it moves sideways every time the user toggles. */}
            {rightGroupTrailingControl ? (
              <XStack gap="$2" alignItems="center" flexShrink={0}>
                {priceMarketCapControl || fullscreenControl ? (
                  <ToolbarSeparator />
                ) : null}

                {rightGroupTrailingControl}
              </XStack>
            ) : null}
          </XStack>
        </Stack>
      );
    }

    return (
      <Stack bg="$bgApp" px="$2" py="$2" zIndex={3}>
        <XStack
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          gap="$2"
        >
          <XStack
            flex={1}
            minWidth={0}
            alignItems="center"
            opacity={isControlsReady ? 1 : 0}
            pointerEvents={isControlsReady ? 'auto' : 'none'}
          >
            {intervalSelector}
          </XStack>

          <XStack gap="$2" alignItems="center" justifyContent="flex-end">
            <XStack
              gap="$2"
              alignItems="center"
              opacity={isControlsReady ? 1 : 0}
              pointerEvents={isControlsReady ? 'auto' : 'none'}
            >
              {chartTypeControl}
              {priceMarketCapControl}
              {indicatorControl}
              {calendarControl}
              {settingsControl}
              {fullscreenControl}
            </XStack>

            {/* Same reasoning as the desktop layout: the caller's control has
                to survive a chart that never becomes ready. */}
            {rightGroupTrailingControl}
          </XStack>
        </XStack>
      </Stack>
    );
  },
);

TradingViewChartControls.displayName = 'TradingViewChartControls';
