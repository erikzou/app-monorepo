import { useMemo } from 'react';

import { useIntl } from 'react-intl';

import {
  NumberSizeableText,
  SizableText,
  Skeleton,
  Stack,
  XStack,
  YStack,
} from '@onekeyhq/components';
import type { ITableColumn } from '@onekeyhq/components';
import { MarketStarV2 } from '@onekeyhq/kit/src/views/Market/components/MarketStarV2';
import { ETranslations } from '@onekeyhq/shared/src/locale';
import {
  ECopyFrom,
  EWatchlistFrom,
} from '@onekeyhq/shared/src/logger/scopes/dex';
import { getTokenPriceChangeStyle } from '@onekeyhq/shared/src/utils/tokenUtils';

import { TokenIdentityItem } from '../../components/TokenIdentityItem';
import { Txns } from '../../components/Txns';
import { getTokenAgeInfo } from '../../utils/tokenListHelpers';

import type { IMarketToken } from '../../MarketTokenData';

const TOKEN_AGE_TRANSLATION_MAP = {
  hour: ETranslations.dexmarket_token_age_h,
  day: ETranslations.dexmarket_token_age_d,
  month: ETranslations.dexmarket_token_age_m,
  year: ETranslations.dexmarket_token_age_y,
} as const;

const EMPTY_MARKET_VALUE = '--';

/**
 * Figma 25366:45108. The table is inset 12 and every cell carries 8, so the
 * first column lands on the same 20px line as the toolbar above it.
 *
 * The left block is fixed at 256: 8 (cell) + 24 (star) + 6 (gap) puts the
 * avatar at 38, and the name column takes the remaining 218. The six numeric
 * columns then split the 960 that is left, 160 each.
 */
const STAR_COLUMN_WIDTH = 38;
const NAME_COLUMN_WIDTH = 218;
const STAR_HEADER_WIDTH = 24;

// Figma 25366:45123: the sort glyph sits 2px after the label and is 14, not the
// table's default 16.
const NUMERIC_COLUMN_PROPS = { flex: 1, px: '$2', gap: '$0.5' } as const;
const SORT_ICON_SIZE = '$3.5' as const;

/**
 * Two-line numeric cell (Figma 25366:45129): the value on top, a qualifier
 * under it. Used by MCap/Change; Txns builds the same shape from its own parts.
 */
function StackedValueCell({
  value,
  secondary,
}: {
  value: React.ReactNode;
  secondary?: React.ReactNode;
}) {
  return (
    <YStack gap="$1" minWidth={0}>
      {value}
      {secondary}
    </YStack>
  );
}

function renderLightweightCell(value: React.ReactNode) {
  return (
    <SizableText size="$bodyMdMedium" numberOfLines={1} ellipsizeMode="tail">
      {value}
    </SizableText>
  );
}

/**
 * Desktop column set for the Trending tab (Figma 25366:45077). Kept apart from
 * the crypto/stock set in `useColumnsDesktop`: the trending table merges
 * name+age and market cap+change into single cells, so sharing one column builder
 * would mean threading a flag through every branch of it.
 */
export const useTrendingColumnsDesktop = (
  networkId?: string,
  deferRichRowAfterIndex?: number,
): ITableColumn<IMarketToken>[] => {
  const intl = useIntl();

  return useMemo<ITableColumn<IMarketToken>[]>(() => {
    const shouldRenderRichCell = (index?: number) =>
      deferRichRowAfterIndex === undefined ||
      (index ?? 0) < deferRichRowAfterIndex;

    return [
      {
        title: (
          <SizableText
            width={STAR_HEADER_WIDTH}
            textAlign="center"
            size="$bodySmMedium"
            color="$textSubdued"
          >
            #
          </SizableText>
        ) as any,
        dataIndex: 'star',
        columnWidth: STAR_COLUMN_WIDTH,
        columnProps: { pl: '$2' },
        render: (_: unknown, record: IMarketToken, index?: number) => {
          if (!shouldRenderRichCell(index)) {
            return <Stack width={24} height={24} />;
          }
          return (
            <MarketStarV2
              chainId={record.chainId || networkId || ''}
              contractAddress={record.address}
              from={EWatchlistFrom.Homepage}
              tokenSymbol={record.symbol}
              size="small"
              isNative={record.isNative}
            />
          );
        },
        renderSkeleton: () => (
          <Skeleton width={24} height={24} borderRadius="$full" />
        ),
      },
      {
        // TODO(i18n): needs a translation key for the merged column.
        title: 'Name/Token Age',
        dataIndex: 'name',
        columnWidth: NAME_COLUMN_WIDTH,
        columnProps: { pr: '$2' },
        render: (_: unknown, record: IMarketToken, index?: number) => {
          const ageInfo = getTokenAgeInfo(record.firstTradeTime);
          const ageLabel = ageInfo
            ? intl.formatMessage(
                { id: TOKEN_AGE_TRANSLATION_MAP[ageInfo.unit] },
                { amount: ageInfo.amount },
              )
            : EMPTY_MARKET_VALUE;

          if (!shouldRenderRichCell(index)) {
            return (
              <XStack alignItems="center" gap="$3.5" minWidth={0}>
                <Stack
                  width={40}
                  height={40}
                  borderRadius="$full"
                  bg="$bgStrong"
                />
                <YStack flex={1} minWidth={0} gap="$1">
                  <SizableText size="$bodyLgMedium" numberOfLines={1}>
                    {record.symbol}
                  </SizableText>
                  <SizableText size="$bodySmMedium" numberOfLines={1}>
                    {ageLabel}
                  </SizableText>
                </YStack>
              </XStack>
            );
          }

          return (
            <TokenIdentityItem
              tokenLogoURI={record.tokenImageUri}
              tokenLogoURIs={record.tokenImageUris}
              networkLogoURI={record.networkLogoUri}
              networkId={record.networkId}
              symbol={record.symbol}
              address={record.address}
              tokenAge={ageLabel}
              showCopyButton
              copyFrom={ECopyFrom.Homepage}
              communityRecognized={record.communityRecognized}
              showStockSubtitle={false}
              rowId={record.id}
            />
          );
        },
        renderSkeleton: () => (
          <XStack alignItems="center" gap="$3.5">
            <Skeleton width={40} height={40} borderRadius="$full" />
            <YStack gap="$1">
              <Skeleton width={80} height={16} />
              <Skeleton width={40} height={12} />
            </YStack>
          </XStack>
        ),
      },
      {
        // TODO(i18n): needs a translation key for the merged column.
        title: 'MCap/Change',
        dataIndex: 'marketCap',
        columnProps: NUMERIC_COLUMN_PROPS,
        sortIconSize: SORT_ICON_SIZE,
        render: (text: number, record: IMarketToken, index?: number) => {
          const marketCap = text === 0 ? EMPTY_MARKET_VALUE : text;
          if (!shouldRenderRichCell(index)) {
            return renderLightweightCell(marketCap);
          }

          const hasChange = record.priceChangeRaw !== '-';
          const { changeColor, showPlusMinusSigns } = getTokenPriceChangeStyle({
            priceChange: record.change24h,
          });
          return (
            <StackedValueCell
              value={
                <NumberSizeableText
                  size="$bodyMdMedium"
                  formatter="marketCap"
                  formatterOptions={{ currency: '$', capAtMaxT: true }}
                >
                  {marketCap}
                </NumberSizeableText>
              }
              secondary={
                hasChange ? (
                  <NumberSizeableText
                    size="$bodySmMedium"
                    formatter="priceChange"
                    color={changeColor}
                    formatterOptions={{ showPlusMinusSigns }}
                  >
                    {record.change24h}
                  </NumberSizeableText>
                ) : (
                  <SizableText size="$bodySmMedium" color="$textSubdued">
                    {EMPTY_MARKET_VALUE}
                  </SizableText>
                )
              }
            />
          );
        },
        renderSkeleton: () => (
          <YStack gap="$1">
            <Skeleton width={80} height={20} />
            <Skeleton width={50} height={16} />
          </YStack>
        ),
      },
      {
        title: intl.formatMessage({ id: ETranslations.global_price }),
        dataIndex: 'price',
        columnProps: NUMERIC_COLUMN_PROPS,
        sortIconSize: SORT_ICON_SIZE,
        render: (text: string, _record: IMarketToken, index?: number) =>
          shouldRenderRichCell(index) ? (
            <NumberSizeableText
              size="$bodyMdMedium"
              formatter={Number(text) > 1_000_000 ? 'marketCap' : 'price'}
              formatterOptions={{ currency: '$', capAtMaxT: true }}
            >
              {text}
            </NumberSizeableText>
          ) : (
            renderLightweightCell(text)
          ),
        renderSkeleton: () => <Skeleton width={70} height={20} />,
      },
      {
        title: intl.formatMessage({ id: ETranslations.global_liquidity }),
        dataIndex: 'liquidity',
        columnProps: NUMERIC_COLUMN_PROPS,
        sortIconSize: SORT_ICON_SIZE,
        render: (text: number, _record: IMarketToken, index?: number) => {
          const value = text === 0 ? EMPTY_MARKET_VALUE : text;
          return shouldRenderRichCell(index) ? (
            <NumberSizeableText
              size="$bodyMdMedium"
              formatter="marketCap"
              formatterOptions={{ currency: '$' }}
            >
              {value}
            </NumberSizeableText>
          ) : (
            renderLightweightCell(value)
          );
        },
        renderSkeleton: () => <Skeleton width={80} height={20} />,
      },
      {
        title: intl.formatMessage({ id: ETranslations.dexmarket_txns }),
        dataIndex: 'transactions',
        columnProps: NUMERIC_COLUMN_PROPS,
        sortIconSize: SORT_ICON_SIZE,
        render: (text: number, record: IMarketToken, index?: number) =>
          shouldRenderRichCell(index) ? (
            <Txns
              transactions={text}
              walletInfo={record.walletInfo}
              valueSize="$bodyMdMedium"
              gap="$1"
            />
          ) : (
            renderLightweightCell(text)
          ),
        renderSkeleton: () => (
          <YStack gap="$1">
            <Skeleton width={60} height={20} />
            <Skeleton width={80} height={16} />
          </YStack>
        ),
      },
      {
        title: intl.formatMessage({ id: ETranslations.dexmarket_holders }),
        dataIndex: 'holders',
        columnProps: NUMERIC_COLUMN_PROPS,
        sortIconSize: SORT_ICON_SIZE,
        render: (text: number, _record: IMarketToken, index?: number) => {
          const value = text === 0 ? EMPTY_MARKET_VALUE : text;
          return shouldRenderRichCell(index) ? (
            <NumberSizeableText size="$bodyMdMedium" formatter="marketCap">
              {value}
            </NumberSizeableText>
          ) : (
            renderLightweightCell(value)
          );
        },
        renderSkeleton: () => <Skeleton width={60} height={20} />,
      },
      {
        title: intl.formatMessage({ id: ETranslations.dexmarket_turnover }),
        dataIndex: 'turnover',
        columnProps: NUMERIC_COLUMN_PROPS,
        sortIconSize: SORT_ICON_SIZE,
        render: (text: number, _record: IMarketToken, index?: number) => {
          const value = text === 0 ? EMPTY_MARKET_VALUE : text;
          return shouldRenderRichCell(index) ? (
            <NumberSizeableText
              size="$bodyMdMedium"
              formatter="marketCap"
              formatterOptions={{ currency: '$' }}
            >
              {value}
            </NumberSizeableText>
          ) : (
            renderLightweightCell(value)
          );
        },
        renderSkeleton: () => <Skeleton width={80} height={20} />,
      },
    ];
  }, [deferRichRowAfterIndex, intl, networkId]);
};
