import { useMemo } from 'react';

import { useIntl } from 'react-intl';

import {
  DashText,
  SizableText,
  Skeleton,
  XStack,
  YStack,
} from '@onekeyhq/components';
import { ETranslations } from '@onekeyhq/shared/src/locale';
import accountUtils from '@onekeyhq/shared/src/utils/accountUtils';

import { useTokenDetail } from '../../hooks/useTokenDetail';
import { useTokenDetailHeaderLeftActions } from '../TokenDetailHeader/hooks/useTokenDetailHeaderLeftActions';

// No translation keys exist for these two labels yet — they ship in English
// until the copy is added to the locale pipeline.
const ISSUER_LABEL = 'Issuer';
const SHARES_PER_TOKEN_LABEL = 'Shares Per Token';

// `stock.source` is a lowercase issuer id ("ondo"); the design shows the
// brand name, and `stock.title` is a full sentence rather than a name.
function formatIssuer(source?: string) {
  const trimmed = source?.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

interface IStockTradeInfoRow {
  key: string;
  label: string;
  value?: string;
  onPressValue?: () => void;
}

function InfoRow({ row }: { row: IStockTradeInfoRow }) {
  return (
    <XStack px="$0.5" gap="$2" alignItems="flex-start">
      <DashText size="$bodyMd" color="$textSubdued" dashThickness={0.5}>
        {row.label}
      </DashText>
      {row.value ? (
        <SizableText
          flex={1}
          minWidth={0}
          size="$bodyMdMedium"
          color="$text"
          textAlign="right"
          numberOfLines={1}
          cursor={row.onPressValue ? 'pointer' : undefined}
          onPress={row.onPressValue}
        >
          {row.value}
        </SizableText>
      ) : (
        <XStack flex={1} minWidth={0} justifyContent="flex-end">
          <Skeleton w={72} h={20} />
        </XStack>
      )}
    </XStack>
  );
}

/**
 * Tokenized-stock facts under the trading widget (Figma 25242:40725).
 */
export function StockTradeInfoList() {
  const intl = useIntl();
  const { tokenDetail } = useTokenDetail();
  const { handleCopyAddress } = useTokenDetailHeaderLeftActions({
    tokenDetail,
  });

  const rows = useMemo<IStockTradeInfoRow[]>(() => {
    const address = tokenDetail?.address;
    return [
      {
        key: 'assetTicker',
        label: intl.formatMessage({
          id: ETranslations.dexmarket_stock_underlying_asset_ticker,
        }),
        value: tokenDetail?.stock?.underlyingAssetTicker,
      },
      {
        key: 'issuer',
        label: ISSUER_LABEL,
        value: formatIssuer(tokenDetail?.stock?.source),
      },
      {
        // Not exposed by the API yet — keeps its slot until the field lands.
        key: 'sharesPerToken',
        label: SHARES_PER_TOKEN_LABEL,
      },
      {
        key: 'contractAddress',
        label: intl.formatMessage({
          id: ETranslations.global_contract_address,
        }),
        value: address
          ? accountUtils.shortenAddress({
              address,
              leadingLength: 6,
              trailingLength: 4,
            })
          : undefined,
        onPressValue: address ? handleCopyAddress : undefined,
      },
    ];
  }, [handleCopyAddress, intl, tokenDetail]);

  return (
    <YStack p="$5" gap="$3">
      {rows.map((row) => (
        <InfoRow key={row.key} row={row} />
      ))}
    </YStack>
  );
}
