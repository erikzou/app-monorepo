import { useCallback } from 'react';

import { Dialog, SizableText, XStack, YStack } from '@onekeyhq/components';

/**
 * DEMO ONLY. The review step is the part of the flow a reviewer most needs to
 * see, and the demo environment has no provider to price it, so this stands in
 * for it: one dialog, fixed numbers, no validation. It is deliberately not fed
 * from the panel's input — the point is to show the step exists and what it
 * looks like, not to compute it.
 *
 * Delete this together with the demo quote once a provider is wired up.
 */

// TODO(i18n): demo copy, hardcoded English.
const DEMO_REVIEW_ROWS: { label: string; value: string; hint?: string }[] = [
  { label: 'Pay', value: '1,000.00 USDC', hint: '$1,000.00' },
  { label: 'Receive', value: '0.01582 BTC', hint: '$998.42' },
  { label: 'Rate', value: '1 USDC = 0.00001582 BTC' },
  { label: 'Minimum received', value: '0.01574 BTC' },
  { label: 'Network fee', value: '$2.14' },
  { label: 'Provider', value: 'OneKey Demo' },
];

function ReviewRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <XStack gap="$4" alignItems="flex-start">
      <SizableText size="$bodyMd" color="$textSubdued" flexShrink={0}>
        {label}
      </SizableText>
      <YStack flex={1} minWidth={0} alignItems="flex-end">
        <SizableText size="$bodyMdMedium" color="$text" textAlign="right">
          {value}
        </SizableText>
        {hint ? (
          <SizableText size="$bodySm" color="$textSubdued" textAlign="right">
            {hint}
          </SizableText>
        ) : null}
      </YStack>
    </XStack>
  );
}

function TradeReviewContent() {
  return (
    <YStack gap="$3">
      {DEMO_REVIEW_ROWS.map((row) => (
        <ReviewRow key={row.label} {...row} />
      ))}
      <SizableText size="$bodySm" color="$textCaution" pt="$1">
        Demo data — no order is placed.
      </SizableText>
    </YStack>
  );
}

export function useShowTradeReviewDialog() {
  return useCallback(() => {
    Dialog.show({
      title: 'Review order',
      renderContent: <TradeReviewContent />,
      onConfirmText: 'Confirm',
      onConfirm: ({ close }) => close(),
      showCancelButton: true,
    });
  }, []);
}
