import { useCallback, useState } from 'react';

import {
  Badge,
  Dialog,
  Divider,
  Icon,
  SegmentControl,
  SizableText,
  Switch,
  XStack,
  YStack,
} from '@onekeyhq/components';

/**
 * DEMO UI. The Trade page's real dialog is `SwapSettingsDialogContent`
 * (`views/Swap/pages/components/SwapHeaderRightActionContainer.tsx`), which
 * reads and writes the swap settings atoms through a `SwapProviderMirror`.
 * This panel has no swap store, and mounting the real one here would edit the
 * user's actual swap settings from a demo surface — so the layout is mirrored
 * with local state instead. Swap in the real content once the panel is wired
 * to the quote flow; the entry point below does not have to change.
 */

const SLIPPAGE_AUTO = 'auto';
const SLIPPAGE_CUSTOM = 'custom';

function SettingToggleRow({
  title,
  description,
  badgeText,
  value,
  onChange,
  testID,
}: {
  title: string;
  description: string;
  badgeText?: string;
  value: boolean;
  onChange: (next: boolean) => void;
  testID: string;
}) {
  return (
    <XStack justifyContent="space-between" alignItems="center" gap="$4">
      <YStack flex={1} minWidth={0} gap="$0.5">
        <XStack alignItems="center" gap="$1.5">
          <SizableText size="$bodyLgMedium">{title}</SizableText>
          {badgeText ? (
            <Badge badgeSize="sm" badgeType="success">
              {badgeText}
            </Badge>
          ) : null}
        </XStack>
        <SizableText size="$bodyMd" color="$textSubdued">
          {description}
        </SizableText>
      </YStack>
      <Switch value={value} onChange={onChange} testID={testID} />
    </XStack>
  );
}

function StockAdvancedSettingsContent() {
  const [slippageMode, setSlippageMode] = useState<string | number>(
    SLIPPAGE_AUTO,
  );
  const [smartMode, setSmartMode] = useState(true);
  const [customRecipient, setCustomRecipient] = useState(false);

  return (
    <YStack gap="$5">
      <XStack justifyContent="space-between" alignItems="center" gap="$4">
        <SizableText size="$bodyLgMedium">Slippage</SizableText>
        <SegmentControl
          value={slippageMode}
          onChange={setSlippageMode}
          options={[
            {
              value: SLIPPAGE_AUTO,
              label: (
                <XStack alignItems="center" gap="$1.5">
                  <Icon name="Ai3StarOutline" size="$5" />
                  <SizableText size="$bodyLgMedium">Auto</SizableText>
                </XStack>
              ),
            },
            { value: SLIPPAGE_CUSTOM, label: 'Custom' },
          ]}
        />
      </XStack>

      <Divider />

      <SettingToggleRow
        title="Smart mode"
        badgeText="Beta"
        description="Provide a better trading experience and ensure the security of your approval"
        value={smartMode}
        onChange={setSmartMode}
        testID="market-stock-trade-smart-mode"
      />

      <SettingToggleRow
        title="Custom recipient"
        description="Allows you to choose a destination address for the swap other than the connected one"
        value={customRecipient}
        onChange={setCustomRecipient}
        testID="market-stock-trade-custom-recipient"
      />
    </YStack>
  );
}

export function useShowStockAdvancedSettings() {
  return useCallback(() => {
    Dialog.show({
      // TODO(i18n): the Trade dialog's own keys once this is wired up.
      title: 'Advanced settings',
      disableDrag: true,
      showFooter: true,
      showConfirmButton: false,
      showCancelButton: true,
      onCancelText: 'Close',
      renderContent: <StockAdvancedSettingsContent />,
    });
  }, []);
}
