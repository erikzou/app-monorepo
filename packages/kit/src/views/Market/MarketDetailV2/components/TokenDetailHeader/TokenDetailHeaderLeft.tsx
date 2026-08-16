import { useMemo } from 'react';

import { SUI_TYPE_ARG } from '@mysten/sui/utils';

import {
  Divider,
  InteractiveIcon,
  SizableText,
  XStack,
  YStack,
  useMedia,
} from '@onekeyhq/components';
import { Token } from '@onekeyhq/kit/src/components/Token';
import { useNetworkLogoUri } from '@onekeyhq/kit/src/hooks/useNetworkLogoUri';
import { EWatchlistFrom } from '@onekeyhq/shared/src/logger/scopes/dex';
import accountUtils from '@onekeyhq/shared/src/utils/accountUtils';
import type { IMarketTokenDetail } from '@onekeyhq/shared/types/marketV2';

import { CommunityRecognizedBadge } from '../../../components/CommunityRecognizedBadge';
import { MarketStarV2 } from '../../../components/MarketStarV2';
import {
  StockMarketStatusBadge,
  StockSourceLogo,
  SubtitleBadge,
} from '../../../components/PerpsBadges';
import { TokenTagsPopover } from '../../../components/TokenTagsPopover';
import { TokenSecurityAlert } from '../TokenSecurityAlert';
import { MarketTokenSelector } from '../TokenSelector/MarketTokenSelector';

import { useTokenDetailHeaderLeftActions } from './hooks/useTokenDetailHeaderLeftActions';
import { ShareButton } from './ShareButton';

interface ITokenDetailHeaderLeftProps {
  tokenDetail?: IMarketTokenDetail;
  networkId?: string;
  networkLogoUri?: string;
  showMediaAndSecurity?: boolean;
  isNative?: boolean;
  showFavoriteButton?: boolean;
  // When the page renders as a stock entity, the header identifies the stock
  // (AAPL / Apple Inc.) instead of the variant it was routed with (AAPLon),
  // and the contract address moves to the trust block.
  stockEntityIdentity?: { ticker: string; name: string };
  // Stock layers surface the contract address in the trust block instead.
  hideContractAddress?: boolean;
  /**
   * The top-coin assembly borrows the stock identity shape (ticker over name)
   * but is not a stock: its switcher browses the watchlist, it keeps its chain
   * badge, and it carries the community-recognized mark next to the ticker.
   */
  isTopCoinLayout?: boolean;
}

export function TokenDetailHeaderLeft({
  tokenDetail,
  networkId,
  networkLogoUri,
  showMediaAndSecurity = true,
  isNative = false,
  showFavoriteButton = true,
  stockEntityIdentity,
  hideContractAddress = false,
  isTopCoinLayout = false,
}: ITokenDetailHeaderLeftProps) {
  const { md } = useMedia();

  // Use hook to get network logo with async fallback
  const effectiveNetworkLogoUri = useNetworkLogoUri({
    logoUri: networkLogoUri,
    networkId,
  });

  const {
    handleCopyAddress,
    handleOpenWebsite,
    handleOpenTwitter,
    handleOpenXSearch,
  } = useTokenDetailHeaderLeftActions({
    tokenDetail,
  });

  const {
    symbol = '',
    address = '',
    logoUrl = '',
    logoUrls,
    extraData,
    communityRecognized,
    stock,
  } = tokenDetail || {};

  const { website, twitter } = extraData || {};

  // Company name sits under the ticker. Market status is not repeated here:
  // the chart header carries it as a status dot right below (Figma 25503:18072).
  const entitySubtitle = useMemo(
    () =>
      stockEntityIdentity ? (
        <XStack ai="center" gap="$2">
          <SizableText size="$bodyMd" color="$textSubdued" numberOfLines={1}>
            {stockEntityIdentity.name}
          </SizableText>
        </XStack>
      ) : undefined,
    [stockEntityIdentity],
  );

  const marketStar =
    showFavoriteButton && networkId ? (
      <MarketStarV2
        chainId={networkId}
        contractAddress={address}
        size="small"
        customIconSize="$4"
        from={EWatchlistFrom.Detail}
        tokenSymbol={symbol}
        isNative={isNative}
      />
    ) : null;

  const shareButton = networkId ? (
    <ShareButton
      networkId={networkId}
      address={address}
      isNative={isNative}
      useIconButton
    />
  ) : null;

  return (
    <XStack ai="center" flex={1} gap="$3" jc="space-between" minWidth={0}>
      <XStack gap="$3" ai="center" flex={1} minWidth={0}>
        {md ? (
          <Token
            size="md"
            tokenImageUri={logoUrl}
            tokenImageUris={logoUrls}
            networkImageUri={effectiveNetworkLogoUri}
            fallbackIcon="CryptoCoinOutline"
          />
        ) : (
          <>
            {/* Stock pages move the star into the right-hand cluster next to
                share (Figma 25277:10360). */}
            {stockEntityIdentity ? null : marketStar}
            <MarketTokenSelector
              titleOverride={stockEntityIdentity?.ticker}
              hideNetworkBadge={
                Boolean(stockEntityIdentity) && !isTopCoinLayout
              }
              stockSwitcher={Boolean(stockEntityIdentity) && !isTopCoinLayout}
              titleSuffix={
                isTopCoinLayout && communityRecognized ? (
                  <CommunityRecognizedBadge />
                ) : undefined
              }
              subtitleSlot={entitySubtitle}
            />
          </>
        )}

        <YStack flex={1} minWidth={0}>
          <XStack ai="center" gap="$1">
            {md ? (
              <SizableText
                size="$headingLg"
                color="$text"
                numberOfLines={1}
                ellipsizeMode="tail"
                maxWidth="$48"
                flexShrink={1}
              >
                {stockEntityIdentity?.ticker || symbol}
              </SizableText>
            ) : null}
            {md ? (
              <>
                <TokenTagsPopover
                  communityRecognized={communityRecognized}
                  stock={stock}
                  showAllInTrigger
                  noTruncateSubtitle
                />
                <StockMarketStatusBadge stock={stock} />
              </>
            ) : (
              <>
                {/* The entity trigger carries its own name + status line, so
                    nothing token-specific is repeated out here. */}
                {stockEntityIdentity ? null : (
                  <>
                    <StockSourceLogo stock={stock} />
                    {communityRecognized ? <CommunityRecognizedBadge /> : null}
                    {stock?.subtitle ? (
                      <SubtitleBadge subtitle={stock.subtitle} noTruncate />
                    ) : null}
                    <StockMarketStatusBadge stock={stock} />
                  </>
                )}
              </>
            )}
          </XStack>

          <XStack gap="$2" ai="center">
            {address && !stockEntityIdentity && !hideContractAddress ? (
              <XStack borderRadius="$1" ai="center" gap="$1">
                <SizableText
                  size="$bodySm"
                  color="$textSubdued"
                  cursor="pointer"
                  hoverStyle={{ opacity: 0.8 }}
                  pressStyle={{ opacity: 0.6 }}
                  onPress={handleCopyAddress}
                >
                  {accountUtils.shortenAddress({
                    address,
                    leadingLength: 6,
                    trailingLength: 4,
                  })}
                </SizableText>

                <InteractiveIcon
                  testID="market-icon"
                  icon="Copy3Outline"
                  size="$4"
                  onPress={handleCopyAddress}
                />
              </XStack>
            ) : null}

            {/* Social Links & Security */}
            {showMediaAndSecurity ? (
              <>
                {address && networkId ? (
                  <TokenSecurityAlert showLeadingDivider />
                ) : null}

                {website || twitter || address ? (
                  <>
                    <Divider vertical backgroundColor="$borderSubdued" h="$3" />

                    <XStack gap="$2" ai="center">
                      {website ? (
                        <InteractiveIcon
                          testID="market-icon"
                          icon="GlobusOutline"
                          onPress={handleOpenWebsite}
                          size="$4"
                        />
                      ) : null}

                      {twitter ? (
                        <InteractiveIcon
                          testID="market-icon"
                          icon="Xbrand"
                          onPress={handleOpenTwitter}
                          size="$4"
                        />
                      ) : null}

                      {address ? (
                        <InteractiveIcon
                          testID="market-icon"
                          icon="SearchOutline"
                          onPress={handleOpenXSearch}
                          size="$4"
                        />
                      ) : null}

                      {networkId && address && address !== SUI_TYPE_ARG ? (
                        <ShareButton
                          networkId={networkId}
                          address={address}
                          isNative={isNative}
                          size="$4"
                        />
                      ) : null}
                    </XStack>
                  </>
                ) : null}
              </>
            ) : null}
          </XStack>
        </YStack>
      </XStack>

      {md ? (
        <XStack gap="$3">
          {marketStar}
          {shareButton}
        </XStack>
      ) : null}
    </XStack>
  );
}
