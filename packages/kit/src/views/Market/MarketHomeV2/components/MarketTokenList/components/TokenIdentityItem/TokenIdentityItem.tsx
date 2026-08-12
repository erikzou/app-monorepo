import type { FC } from 'react';
import { memo, useMemo } from 'react';

import {
  Icon,
  Image,
  NATIVE_HIT_SLOP,
  NumberSizeableText,
  SizableText,
  Stack,
  XStack,
  useClipboard,
  useMedia,
} from '@onekeyhq/components';
import { LazyTooltip } from '@onekeyhq/components/src/actions/LazyTooltip';
import { Token } from '@onekeyhq/kit/src/components/Token';
import { useNetworkLogoUri } from '@onekeyhq/kit/src/hooks/useNetworkLogoUri';
import { CommunityRecognizedBadge } from '@onekeyhq/kit/src/views/Market/components/CommunityRecognizedBadge';
import {
  LeverageBadge,
  StockSourceLogo,
  SubtitleText,
} from '@onekeyhq/kit/src/views/Market/components/PerpsBadges';
import { TokenTagsPopover } from '@onekeyhq/kit/src/views/Market/components/TokenTagsPopover';
import { defaultLogger } from '@onekeyhq/shared/src/logger/logger';
import { ECopyFrom } from '@onekeyhq/shared/src/logger/scopes/dex';
import platformEnv from '@onekeyhq/shared/src/platformEnv';
import accountUtils from '@onekeyhq/shared/src/utils/accountUtils';
import type { IMarketStockInfo } from '@onekeyhq/shared/types/marketV2';

import { useIsMarketRowHovered } from '../MarketRowHoverContext';

import type { GestureResponderEvent } from 'react-native';

interface ITokenIdentityItemProps {
  /**
   * Token display symbol, e.g. `SOL`.
   */
  symbol: string;
  /**
   * Address represented by this token. Will be truncated for display but the
   * full value is preserved for copy action.
   */
  address: string;
  /**
   * Token logo URI.
   */
  tokenLogoURI?: string;
  /**
   * Token logo URIs for fallback loading.
   */
  tokenLogoURIs?: string[];
  /**
   * Network logo URI – mutually exclusive with `networkId`. If both are
   * provided `networkLogoURI` takes precedence.
   */
  networkLogoURI?: string;
  /**
   * Network id to resolve the network avatar from the built-in list.
   * Only used when `networkLogoURI` is not provided.
   */
  networkId?: string;
  /**
   * Callback fired after the copy button is pressed and the text has been
   * copied. Useful when the parent component needs to react.
   */
  onCopied?: (address: string) => void;
  /**
   * Whether to show the copy button. Defaults to false.
   */
  showCopyButton?: boolean;
  /**
   * Whether to show volume instead of address. Defaults to false.
   */
  showVolume?: boolean;
  /**
   * Volume value to display when showVolume is true.
   */
  volume?: number;
  /**
   * Where the copy action is triggered from.
   */
  copyFrom?: ECopyFrom;
  /**
   * Whether the token is community recognized.
   */
  communityRecognized?: boolean;
  /**
   * Stock info for tokenized real-world assets.
   */
  stock?: IMarketStockInfo;
  /**
   * Max leverage for perpetual tokens (e.g. 40 for "40x").
   */
  maxLeverage?: number;
  /**
   * Subtitle for perpetual tokens (e.g. Chinese name tag).
   */
  perpsSubtitle?: string;
  /**
   * Whether to show the stock subtitle. Defaults to true.
   */
  showStockSubtitle?: boolean;
  /**
   * Drop the contract address (and its copy button) from the second row. Stock
   * entity rows stand for the company, not for one tokenization, so the CA
   * belongs on the detail page's trust block instead.
   */
  hideAddress?: boolean;
  /**
   * Drop the chain badge and the issuer logo. A collapsed stock entity row
   * stands for the company, so anything identifying one particular
   * tokenization belongs on the detail page, not here.
   */
  hideVariantChrome?: boolean;
  /**
   * How many tokenizations this row stands for. A collapsed stock row hides
   * them behind the company, so hovering swaps the company name for the count
   * and the chains they live on (Figma 25463:83146).
   */
  stockVariantCount?: number;
  stockVariantLogos?: string[];
  /** Row key, so the cell can react to a hover anywhere on its row. */
  rowId?: string;
}

/**
 * The tokens a collapsed row stands for, 14px and overlapped 4px the way the
 * design stacks them (Figma 25507:18329). Caps at three; the count next to it
 * already carries the total.
 */
const STOCK_VARIANT_LOGO_LIMIT = 3;
const STOCK_VARIANT_LOGO_SIZE = 14;

function StockVariantLogos({ logos }: { logos?: string[] }) {
  const visible = (logos ?? []).slice(0, STOCK_VARIANT_LOGO_LIMIT);
  if (visible.length === 0) {
    return null;
  }
  return (
    <XStack alignItems="center">
      {visible.map((logo, index) => (
        <Stack
          key={logo}
          w={STOCK_VARIANT_LOGO_SIZE}
          h={STOCK_VARIANT_LOGO_SIZE}
          ml={index === 0 ? 0 : -4}
          borderRadius="$full"
          overflow="hidden"
          bg="$bgStrong"
          borderWidth="$px"
          borderColor="$bgApp"
        >
          <Image
            w={STOCK_VARIANT_LOGO_SIZE}
            h={STOCK_VARIANT_LOGO_SIZE}
            source={{ uri: logo }}
          />
        </Stack>
      ))}
    </XStack>
  );
}

const BasicTokenIdentityItem: FC<ITokenIdentityItemProps> = ({
  symbol,
  address,
  tokenLogoURI,
  tokenLogoURIs,
  networkLogoURI,
  networkId,
  onCopied,
  showCopyButton = false,
  showVolume = false,
  volume,
  copyFrom = ECopyFrom.Homepage,
  communityRecognized,
  stock,
  maxLeverage,
  perpsSubtitle,
  showStockSubtitle = true,
  hideAddress = false,
  hideVariantChrome = false,
  stockVariantCount,
  stockVariantLogos,
  rowId,
}) => {
  const isRowHovered = useIsMarketRowHovered(rowId);
  const { gtMd } = useMedia();
  const { copyText } = useClipboard();
  // Use hook to get network logo with async fallback
  const effectiveNetworkLogoUri = useNetworkLogoUri({
    logoUri: networkLogoURI,
    networkId,
  });

  const shortened = useMemo(
    () =>
      accountUtils.shortenAddress({
        address,
        leadingLength: 6,
        trailingLength: 4,
      }),
    [address],
  );

  const shouldShowVolume = showVolume && !!volume;
  const shouldShowAddress = !hideAddress && !showVolume && Boolean(address);
  const shouldShowCopyButton =
    !hideAddress && showCopyButton && Boolean(address);
  // Localized name shown as plain text on the second row, before volume/address.
  let localizedName: string | undefined;
  if (showStockSubtitle && stock?.subtitle) {
    localizedName = stock.subtitle;
  } else if (!stock?.subtitle && perpsSubtitle) {
    localizedName = perpsSubtitle;
  }
  const shouldShowSecondRow =
    shouldShowVolume || shouldShowAddress || !!localizedName;

  const handleCopy = (e: GestureResponderEvent) => {
    e.stopPropagation();
    copyText(address);
    onCopied?.(address);
    // Dex analytics
    defaultLogger.dex.actions.dexCopyCA({
      copyFrom,
      copiedContent: address,
    });
  };

  const getTokenImageUri = () => {
    if (!platformEnv.isNative || !tokenLogoURI) {
      return tokenLogoURI;
    }

    if (tokenLogoURI.toLowerCase().includes('svg')) {
      return undefined;
    }

    return tokenLogoURI;
  };

  const symbolText = (
    <SizableText
      size="$bodyLgMedium"
      numberOfLines={1}
      ellipsizeMode="tail"
      maxWidth="$32"
      flexShrink={1}
    >
      {symbol}
    </SizableText>
  );

  const symbolElement =
    !showStockSubtitle && stock?.subtitle ? (
      <LazyTooltip
        placement="top"
        renderTrigger={symbolText}
        renderContent={stock.subtitle}
      />
    ) : (
      symbolText
    );

  // Collapsed stock entity row (Figma 25473:87735): a company, not one
  // tokenization — bigger avatar, wider gap, and a second line that trades the
  // company name for what the row is hiding while the pointer is on it.
  const isStockEntityRow = hideVariantChrome;
  // Hovering anywhere on the row — not just this cell — trades the company
  // name for what the row collapses.
  const showVariantSummary =
    isStockEntityRow && isRowHovered && (stockVariantCount ?? 0) > 0;

  return (
    <XStack
      alignItems="center"
      gap={isStockEntityRow ? '$3.5' : '$3'}
      flex={isStockEntityRow ? 1 : undefined}
      minWidth={isStockEntityRow ? 0 : undefined}
      userSelect="none"
    >
      <Token
        tokenImageUri={getTokenImageUri()}
        tokenImageUris={tokenLogoURIs}
        networkImageUri={
          hideVariantChrome ? undefined : effectiveNetworkLogoUri
        }
        fallbackIcon="CryptoCoinOutline"
        size={isStockEntityRow ? 'lg' : 'md'}
      />

      <Stack flex={1} minWidth={0} gap={isStockEntityRow ? '$0.5' : undefined}>
        <XStack alignItems="center" gap="$1">
          {symbolElement}
          {maxLeverage ? <LeverageBadge leverage={maxLeverage} /> : null}
          {gtMd ? (
            <>
              {hideVariantChrome ? null : <StockSourceLogo stock={stock} />}
              {communityRecognized ? <CommunityRecognizedBadge /> : null}
            </>
          ) : (
            <TokenTagsPopover
              communityRecognized={communityRecognized}
              stock={hideVariantChrome ? undefined : stock}
            />
          )}
        </XStack>
        {showVariantSummary ? (
          <XStack alignItems="center" gap="$1.5" minWidth={0}>
            {/* Figma 25463:83575: 14/20 regular, not the 12/16 the company
                name uses. */}
            <SizableText size="$bodyMd" color="$textSubdued">
              {`${stockVariantCount ?? 0} ${
                (stockVariantCount ?? 0) > 1 ? 'tokens' : 'token'
              }`}
            </SizableText>
            <StockVariantLogos logos={stockVariantLogos} />
          </XStack>
        ) : null}
        {shouldShowSecondRow && !showVariantSummary ? (
          <XStack alignItems="center" gap="$1.5" minWidth={0}>
            {localizedName ? (
              <>
                {isStockEntityRow ? (
                  // Figma 25473:87735: the company line matches the hover
                  // summary at 14/20 regular, so nothing shifts on hover, and
                  // it truncates against the column instead of a fixed width.
                  <SizableText
                    size="$bodyMd"
                    color="$textSubdued"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    flexShrink={1}
                  >
                    {localizedName}
                  </SizableText>
                ) : (
                  // Cap the localized name so long names truncate with an
                  // ellipsis, e.g. "Circle Int...", keeping the row compact.
                  <SubtitleText subtitle={localizedName} maxWidth={66} />
                )}
              </>
            ) : null}
            {/* Divider only before the address (desktop); the name and
               volume (mobile) are separated by spacing alone. */}
            {localizedName && shouldShowAddress ? (
              <SizableText size="$bodySm" color="$textDisabled" flexShrink={0}>
                |
              </SizableText>
            ) : null}
            {shouldShowVolume ? (
              <NumberSizeableText
                size={gtMd ? '$bodySm' : '$bodyMd'}
                color="$textSubdued"
                numberOfLines={1}
                formatter="marketCap"
                formatterOptions={{ currency: '$' }}
              >
                {volume}
              </NumberSizeableText>
            ) : null}
            {shouldShowAddress ? (
              <SizableText
                size="$bodySm"
                color="$textSubdued"
                numberOfLines={1}
                flexShrink={0}
              >
                {shortened}
              </SizableText>
            ) : null}
            {shouldShowCopyButton ? (
              <Stack
                cursor="pointer"
                p="$1"
                borderRadius="$full"
                hoverStyle={{ bg: '$bgHover' }}
                pressStyle={{ bg: '$bgActive' }}
                hitSlop={NATIVE_HIT_SLOP}
                onPress={handleCopy}
              >
                <Icon name="Copy3Outline" size="$4" color="$iconSubdued" />
              </Stack>
            ) : null}
          </XStack>
        ) : null}
      </Stack>
    </XStack>
  );
};

export const TokenIdentityItem = memo(BasicTokenIdentityItem);
