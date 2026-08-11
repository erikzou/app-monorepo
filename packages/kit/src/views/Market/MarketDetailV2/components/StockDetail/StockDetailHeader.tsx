import { useMemo } from 'react';

import { useIntl } from 'react-intl';

import type { IActionListSection } from '@onekeyhq/components';
import { ActionList, IconButton, XStack } from '@onekeyhq/components';
import { ETranslations } from '@onekeyhq/shared/src/locale';
import { EWatchlistFrom } from '@onekeyhq/shared/src/logger/scopes/dex';

import { MarketStarV2 } from '../../../components/MarketStarV2';
import { useMarketDetailHeaderDisplayData } from '../../hooks/useMarketDetailDisplayData';
import { useTokenDetailHeaderLeftActions } from '../TokenDetailHeader/hooks/useTokenDetailHeaderLeftActions';
import { ShareButton } from '../TokenDetailHeader/ShareButton';
import { MarketTokenSelector } from '../TokenSelector/MarketTokenSelector';

import { STOCK_DETAIL_LAYOUT } from './constants';

export function StockDetailHeader({
  showFavoriteButton = true,
}: {
  showFavoriteButton?: boolean;
}) {
  const intl = useIntl();
  const { tokenDetail, networkId, isNative } =
    useMarketDetailHeaderDisplayData();
  const { address = '', symbol = '', extraData } = tokenDetail || {};
  const { website, twitter } = extraData || {};

  const { handleCopyAddress, handleOpenWebsite, handleOpenTwitter } =
    useTokenDetailHeaderLeftActions({ tokenDetail });

  const moreSections = useMemo<IActionListSection[]>(
    () => [
      {
        items: [
          ...(address
            ? [
                {
                  icon: 'Copy3Outline' as const,
                  label: intl.formatMessage({
                    id: ETranslations.global_copy_address,
                  }),
                  onPress: handleCopyAddress,
                },
              ]
            : []),
          ...(website
            ? [
                {
                  icon: 'GlobusOutline' as const,
                  label: intl.formatMessage({
                    id: ETranslations.global_website,
                  }),
                  onPress: handleOpenWebsite,
                },
              ]
            : []),
          ...(twitter
            ? [
                {
                  icon: 'Xbrand' as const,
                  label: 'X',
                  onPress: handleOpenTwitter,
                },
              ]
            : []),
        ],
      },
    ],
    [
      address,
      handleCopyAddress,
      handleOpenTwitter,
      handleOpenWebsite,
      intl,
      twitter,
      website,
    ],
  );

  const hasMoreActions = moreSections[0].items.length > 0;

  return (
    <XStack
      h={STOCK_DETAIL_LAYOUT.headerHeight}
      px="$5"
      py="$1"
      gap="$5"
      alignItems="center"
    >
      <XStack flex={1} minWidth={0} gap="$2.5" alignItems="center">
        {showFavoriteButton && networkId ? (
          <MarketStarV2
            chainId={networkId}
            contractAddress={address}
            size="small"
            customIconSize="$5"
            from={EWatchlistFrom.Detail}
            tokenSymbol={symbol}
            isNative={isNative}
          />
        ) : null}
        {/* TODO(design): the merged selector exposes showAddress/subtitleSlot
            instead of the trigger variants this header used; the header is
            being rebuilt against the updated Figma frame. */}
        <MarketTokenSelector />
      </XStack>

      <XStack gap="$5" alignItems="center">
        {networkId ? (
          <ShareButton
            networkId={networkId}
            address={address}
            isNative={isNative}
            useIconButton
          />
        ) : null}
        {hasMoreActions ? (
          <ActionList
            title={symbol}
            sections={moreSections}
            renderTrigger={
              <IconButton
                testID="market-stock-detail-more"
                icon="DotHorOutline"
                variant="tertiary"
                size="medium"
              />
            }
          />
        ) : null}
      </XStack>
    </XStack>
  );
}
