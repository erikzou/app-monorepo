import { Dialog, SizableText, YStack } from '@onekeyhq/components';
import type { IEarnMarketInfoActionIcon } from '@onekeyhq/shared/types/staking';

type IMarketInfoData = IEarnMarketInfoActionIcon['data'];

const FIELD_ROWS: Array<{
  key: keyof Omit<IMarketInfoData, 'description'>;
  label: string;
}> = [
  { key: 'riskInvolved', label: 'Risk Involved' },
  { key: 'importantQuirks', label: 'Important Quirks' },
  { key: 'initiatedBy', label: 'Initiated by' },
  { key: 'provider', label: 'Provider' },
];

function MarketInfoDialogContent({ data }: { data: IMarketInfoData }) {
  const description = data.description?.trim();
  const rows = FIELD_ROWS.filter((row) => data[row.key]?.trim());

  return (
    <YStack px="$5" pb="$5" gap="$5">
      {description ? (
        <SizableText size="$bodyMd" color="$text">
          {description}
        </SizableText>
      ) : null}
      {rows.map((row) => (
        <YStack key={row.key} gap="$0.5">
          <SizableText size="$bodySm" color="$textSubdued">
            {row.label}
          </SizableText>
          <SizableText size="$bodyMd" color="$text">
            {data[row.key]}
          </SizableText>
        </YStack>
      ))}
    </YStack>
  );
}

export function showMarketInfoDialog(data: IMarketInfoData) {
  Dialog.show({
    title: 'Market Info',
    contentContainerProps: {
      px: '$0',
      pb: '$0',
    },
    floatingPanelProps: {
      width: 400,
    },
    renderContent: <MarketInfoDialogContent data={data} />,
    onConfirmText: 'Got it!',
    confirmButtonProps: {
      variant: 'secondary',
    },
    showCancelButton: false,
  });
}
