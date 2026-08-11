import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

import {
  Icon,
  IconButton,
  SizableText,
  XStack,
  YStack,
  useClipboard,
} from '@onekeyhq/components';
import accountUtils from '@onekeyhq/shared/src/utils/accountUtils';
import type {
  IMarketStockEntity,
  IMarketStockInstrument,
} from '@onekeyhq/shared/types/marketV2';

import { StockSourceLogo } from '../../../components/PerpsBadges';
import { MarketTestIDs } from '../../../testIDs';
import { useTokenDetail } from '../../hooks/useTokenDetail';
import { STAT_FALLBACK_VALUE } from '../../utils/statValue';

import {
  STOCK_PROTECTION_COUNT,
  showStockProtectionsDialog,
} from './StockProtectionsDialog';
import { TokenLinkRow } from './TokenLinkRow';

const ISSUER_LABELS: Record<string, string> = {
  ondo: 'Ondo',
  xstock: 'xStock',
};

interface ITrustRow {
  key: string;
  label: string;
  value: string;
  copyValue?: string;
  valuePrefix?: ReactNode;
}

function TrustRow({ row }: { row: ITrustRow }) {
  const { copyText } = useClipboard();
  const handleCopy = useCallback(() => {
    if (row.copyValue) {
      copyText(row.copyValue);
    }
  }, [copyText, row.copyValue]);

  return (
    <XStack alignItems="center" justifyContent="space-between" gap="$3">
      <SizableText size="$bodyMd" color="$textSubdued" numberOfLines={1}>
        {row.label}
      </SizableText>
      <XStack alignItems="center" gap="$1" flexShrink={1} minWidth={0}>
        {row.valuePrefix}
        <SizableText size="$bodyMdMedium" color="$text" numberOfLines={1}>
          {row.value}
        </SizableText>
        {row.copyValue ? (
          <IconButton
            testID={MarketTestIDs.stockCopyContractButton}
            size="small"
            variant="tertiary"
            icon="Copy3Outline"
            iconSize="$4"
            onPress={handleCopy}
          />
        ) : null}
      </XStack>
    </XStack>
  );
}

/**
 * Per-variant trust block. Swaps wholesale when the traded variant changes.
 *
 * The spec's holder-protection lines and audit-report link need legal-approved
 * copy that does not exist yet, so only the six data-backed rows render; the
 * block is not blocked on them.
 */
export function StockTrustPanel({
  entity,
  instrument,
}: {
  entity: IMarketStockEntity;
  instrument?: IMarketStockInstrument;
}) {
  const { tokenDetail } = useTokenDetail();

  const rows = useMemo<ITrustRow[]>(() => {
    if (!instrument) {
      return [];
    }
    const issuer =
      ISSUER_LABELS[instrument.issuer.toLowerCase()] ?? instrument.issuer;
    return [
      {
        key: 'issuer',
        label: 'Issuer',
        value: issuer || STAT_FALLBACK_VALUE,
        // Same source as the variant switcher's issuer mark. It renders
        // nothing when the token detail has no `stock` block, so the row
        // degrades to plain text rather than to a broken image.
        valuePrefix: <StockSourceLogo stock={tokenDetail?.stock} size={16} />,
      },
      {
        key: 'ratio',
        label: 'Shares Per Token',
        tooltip: `How much of ${entity.ticker} one token represents.`,
        value: instrument.tokenToAssetRatio
          ? `${instrument.tokenToAssetRatio} ${entity.ticker}`
          : STAT_FALLBACK_VALUE,
      },
      {
        key: 'tradingHours',
        label: 'Trading Hours',
        value: instrument.tradingDays || STAT_FALLBACK_VALUE,
      },
      {
        key: 'contract',
        label: 'Contract Address',
        value: instrument.contractAddress
          ? accountUtils.shortenAddress({
              address: instrument.contractAddress,
              leadingLength: 6,
              trailingLength: 4,
            })
          : STAT_FALLBACK_VALUE,
        copyValue: instrument.contractAddress || undefined,
      },
    ];
  }, [entity.ticker, instrument, tokenDetail?.stock]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <YStack p="$5" gap="$3.5">
      {rows.map((row) => (
        <TrustRow key={row.key} row={row} />
      ))}

      {/* Opens the protections breakdown (Figma 25497:17775). */}
      <XStack
        testID="market-stock-protections-row"
        px="$0.5"
        alignItems="center"
        gap="$2"
        cursor="pointer"
        hoverStyle={{ opacity: 0.8 }}
        onPress={showStockProtectionsDialog}
      >
        <SizableText size="$bodyMd" color="$textSubdued" flex={1} minWidth={0}>
          Tokenholder Protections
        </SizableText>
        <SizableText size="$bodyMdMedium" color="$textSubdued">
          {`${STOCK_PROTECTION_COUNT} items`}
        </SizableText>
        <Icon
          name="ChevronRightSmallOutline"
          size="$4.5"
          color="$iconSubdued"
        />
      </XStack>

      {/* The disclaimer lives in the page-level banner, not here. */}
      {instrument ? <TokenLinkRow instrument={instrument} /> : null}
    </YStack>
  );
}
