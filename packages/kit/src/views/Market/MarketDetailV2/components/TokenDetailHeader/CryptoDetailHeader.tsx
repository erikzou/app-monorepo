import {
  Divider,
  InteractiveIcon,
  SizableText,
  XStack,
} from '@onekeyhq/components';
import { EWatchlistFrom } from '@onekeyhq/shared/src/logger/scopes/dex';
import accountUtils from '@onekeyhq/shared/src/utils/accountUtils';

import { CommunityRecognizedBadge } from '../../../components/CommunityRecognizedBadge';
import { MarketStarV2 } from '../../../components/MarketStarV2';
import { useMarketDetailHeaderDisplayData } from '../../hooks/useMarketDetailDisplayData';
import { TokenSecurityAlert } from '../TokenSecurityAlert';
import { MarketTokenSelector } from '../TokenSelector/MarketTokenSelector';

import { useTokenDetailHeaderLeftActions } from './hooks/useTokenDetailHeaderLeftActions';
import { ShareButton } from './ShareButton';

const HEADER_DIVIDER_HEIGHT = 12;

/**
 * Identity row of the crypto (meme) detail assembly (Figma 25593:18401):
 * the 48px logo + symbol + switcher on the left, the contract address, the
 * security counter and the social links in the middle, and star + share pinned
 * right.
 *
 * Unlike the stock assembly, the contract address and the social links stay in
 * the header — verifying the CA is the first thing a meme trader does, so it
 * does not move into a trust block. The security counter (TokenSecurityAlert)
 * is the page's only risk entry point; there is no rating badge.
 *
 * Composed from the same parts the other assemblies use rather than forked, so
 * the switcher, the security dialog and the share sheet all behave identically
 * across pages.
 */
export function CryptoDetailHeader({
  showFavoriteButton = true,
}: {
  showFavoriteButton?: boolean;
}) {
  const { tokenDetail, networkId, isNative } =
    useMarketDetailHeaderDisplayData();
  const {
    handleCopyAddress,
    handleOpenWebsite,
    handleOpenTwitter,
    handleOpenXSearch,
  } = useTokenDetailHeaderLeftActions({ tokenDetail });

  const {
    symbol = '',
    address = '',
    extraData,
    communityRecognized,
  } = tokenDetail || {};
  const { website, twitter } = extraData || {};
  const hasSocialLinks = Boolean(website || twitter || address);

  return (
    <XStack px="$5" py="$3" gap="$5" alignItems="center" minHeight={72}>
      <XStack flexShrink={0}>
        <MarketTokenSelector
          largeTrigger
          titleSuffix={
            communityRecognized ? <CommunityRecognizedBadge /> : undefined
          }
        />
      </XStack>

      <XStack flex={1} minWidth={0} alignItems="center" gap="$2" py="$0.5">
        {address ? (
          <XStack alignItems="center" gap="$0.5">
            <SizableText
              size="$bodySm"
              color="$textSubdued"
              cursor="pointer"
              numberOfLines={1}
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
              testID="market-detail-copy-address"
              icon="Copy3Outline"
              size="$3.5"
              onPress={handleCopyAddress}
            />
          </XStack>
        ) : null}

        {address && networkId ? (
          <TokenSecurityAlert showLeadingDivider />
        ) : null}

        {hasSocialLinks ? (
          <>
            <Divider
              vertical
              backgroundColor="$borderSubdued"
              h={HEADER_DIVIDER_HEIGHT}
            />
            <XStack gap="$2" alignItems="center">
              {website ? (
                <InteractiveIcon
                  testID="market-detail-website"
                  icon="GlobusOutline"
                  size="$4"
                  onPress={handleOpenWebsite}
                />
              ) : null}
              {twitter ? (
                <InteractiveIcon
                  testID="market-detail-twitter"
                  icon="Xbrand"
                  size="$4"
                  onPress={handleOpenTwitter}
                />
              ) : null}
              {address ? (
                <InteractiveIcon
                  testID="market-detail-x-search"
                  icon="SearchOutline"
                  size="$4"
                  onPress={handleOpenXSearch}
                />
              ) : null}
            </XStack>
          </>
        ) : null}
      </XStack>

      <XStack gap="$4" alignItems="center" flexShrink={0}>
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
        {networkId ? (
          <ShareButton
            networkId={networkId}
            address={address}
            isNative={isNative}
            useIconButton
            size="small"
          />
        ) : null}
      </XStack>
    </XStack>
  );
}
