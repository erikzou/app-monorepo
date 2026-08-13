import { useCallback, useState } from 'react';

import {
  Button,
  Dialog,
  Input,
  SizableText,
  XStack,
  YStack,
} from '@onekeyhq/components';

const AMOUNT_SLOTS = 4;

function parseAmounts(values: string[]) {
  return values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function QuickAmountsEditorContent({
  amounts,
  symbol,
  onApply,
  onClose,
}: {
  amounts: number[];
  symbol: string;
  onApply: (amounts: number[]) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<string[]>(() =>
    Array.from({ length: AMOUNT_SLOTS }, (_, index) =>
      amounts[index] === undefined ? '' : String(amounts[index]),
    ),
  );

  const handleChange = useCallback((index: number, value: string) => {
    setDraft((prev) => prev.map((item, i) => (i === index ? value : item)));
  }, []);

  const handleConfirm = useCallback(() => {
    const next = parseAmounts(draft);
    if (next.length > 0) {
      onApply(next);
    }
    onClose();
  }, [draft, onApply, onClose]);

  return (
    <YStack gap="$4">
      {/* TODO(i18n): demo copy, hardcoded English. */}
      <SizableText size="$bodyMd" color="$textSubdued">
        {`Shortcut amounts in ${symbol || 'the payment token'}. Applies to this visit only.`}
      </SizableText>
      <XStack gap="$2">
        {draft.map((value, index) => (
          <YStack
            // eslint-disable-next-line react/no-array-index-key
            key={`amount-${index}`}
            flex={1}
          >
            <Input
              value={value}
              keyboardType="decimal-pad"
              onChangeText={(next) => handleChange(index, next)}
              testID={`market-quick-amount-input-${index}`}
            />
          </YStack>
        ))}
      </XStack>
      <XStack gap="$2.5">
        <Button
          flex={1}
          size="medium"
          onPress={onClose}
          testID="market-quick-amounts-cancel"
        >
          Cancel
        </Button>
        <Button
          flex={1}
          size="medium"
          variant="primary"
          onPress={handleConfirm}
          testID="market-quick-amounts-confirm"
        >
          Confirm
        </Button>
      </XStack>
    </YStack>
  );
}

/**
 * Editor behind the quick-amount grid's pencil (Figma 25671:53545). The panel
 * ships the payment token's configured ladder; this lets the demo show a custom
 * one without a place to persist it.
 */
export function useShowQuickAmountsEditor() {
  return useCallback(
    ({
      amounts,
      symbol,
      onApply,
    }: {
      amounts: number[];
      symbol: string;
      onApply: (amounts: number[]) => void;
    }) => {
      const dialog = Dialog.show({
        // TODO(i18n): demo copy, hardcoded English.
        title: 'Edit amounts',
        showFooter: false,
        renderContent: (
          <QuickAmountsEditorContent
            amounts={amounts}
            symbol={symbol}
            onApply={onApply}
            onClose={() => {
              void dialog.close();
            }}
          />
        ),
      });
    },
    [],
  );
}
