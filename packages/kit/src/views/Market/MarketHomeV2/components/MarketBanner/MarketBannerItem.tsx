import { memo, useCallback } from 'react';

import { StyleSheet } from 'react-native';

import {
  Icon,
  Image,
  NumberSizeableText,
  SizableText,
  Stack,
  XStack,
  YStack,
} from '@onekeyhq/components';
import { ANIMATE_ONLY_BORDER_COLOR } from '@onekeyhq/components/src/utils/animationConstants';
import { LeverageBadge } from '@onekeyhq/kit/src/views/Market/components/PerpsBadges';
import {
  EMarketBannerType,
  type IMarketBannerItem,
} from '@onekeyhq/shared/types/marketV2';

import { MarketTestIDs } from '../../testIDs';

import { useMarketBannerFocusToken } from './useMarketBannerFocusToken';

import type { IMarketBannerFocusToken } from './useMarketBannerFocusToken';

type IMarketBannerItemProps = {
  item: IMarketBannerItem;
  isSmallScreen?: boolean;
  onPress?: (item: IMarketBannerItem) => void;
};

function BannerTokenGroupComponent({ tokenLogos }: { tokenLogos?: string[] }) {
  if (!tokenLogos?.length) return null;

  const visibleTokens = tokenLogos.slice(0, 3);

  return (
    <XStack>
      {visibleTokens.map((url, index) => (
        <Stack
          key={url || index}
          borderRadius="$full"
          borderWidth={StyleSheet.hairlineWidth}
          borderColor="$neutral3"
          bg="$bgStrong"
          overflow="hidden"
          {...(index !== 0 && { ml: '$-1.5' })}
        >
          <Image
            size="$5"
            borderRadius="$full"
            source={{ uri: url }}
            fallback={
              <Stack
                w="$5"
                h="$5"
                bg="$gray5"
                borderRadius="$full"
                alignItems="center"
                justifyContent="center"
              >
                <Icon size="$4" name="CryptoCoinOutline" color="$iconSubdued" />
              </Stack>
            }
          />
        </Stack>
      ))}
    </XStack>
  );
}

const BannerTokenGroup = memo(BannerTokenGroupComponent);

/**
 * The topic's talking point (Figma 25756:29808): one token, named, with its
 * 24h move. The three logos below say what the topic contains; this says why
 * it is worth a look today.
 */
function BannerFocusTokenComponent({
  focusToken,
}: {
  focusToken?: IMarketBannerFocusToken;
}) {
  if (!focusToken?.symbol) {
    return null;
  }
  const changePercent = focusToken.priceChange24hPercent;
  const isDown = Number(changePercent) < 0;
  return (
    <XStack gap="$1.5" alignItems="center" width="100%" minWidth={0}>
      <Stack
        w="$6"
        h="$6"
        borderRadius="$full"
        borderWidth={StyleSheet.hairlineWidth}
        borderColor="$borderSubdued"
        bg="$bgStrong"
        overflow="hidden"
        flexShrink={0}
      >
        <Image
          size="$6"
          borderRadius="$full"
          source={{ uri: focusToken.logoUrl }}
          fallback={
            <Stack
              w="$6"
              h="$6"
              alignItems="center"
              justifyContent="center"
              bg="$bgStrong"
            >
              <Icon size="$4" name="CryptoCoinOutline" color="$iconSubdued" />
            </Stack>
          }
        />
      </Stack>
      <XStack
        flex={1}
        minWidth={0}
        gap="$1.5"
        alignItems="baseline"
        overflow="hidden"
      >
        <SizableText size="$headingSm" color="$text" numberOfLines={1}>
          {focusToken.symbol}
        </SizableText>
        {changePercent === undefined ? null : (
          <NumberSizeableText
            size="$bodySmMedium"
            color={isDown ? '$textCritical' : '$textSuccess'}
            formatter="priceChange"
            formatterOptions={{ showPlusMinusSigns: true }}
            numberOfLines={1}
          >
            {changePercent}
          </NumberSizeableText>
        )}
      </XStack>
    </XStack>
  );
}

const BannerFocusToken = memo(BannerFocusTokenComponent);

function MarketBannerItemComponent({
  item,
  isSmallScreen,
  onPress,
}: IMarketBannerItemProps) {
  const { title, tokenLogos } = item;
  const isPerps = item.type === EMarketBannerType.Perps;
  const focusToken = useMarketBannerFocusToken({
    tokenListId: item.tokenListId,
  });

  const handlePress = useCallback(() => {
    onPress?.(item);
  }, [onPress, item]);

  return (
    <Stack
      flexDirection="column"
      // One background for every topic (Figma 25756:29808). The per-topic tint
      // the payload carries is ignored: five differently coloured cards read as
      // five states rather than one strip.
      bg="$bgSubdued"
      borderRadius="$3"
      borderCurve="continuous"
      px="$3"
      py="$3.5"
      width="$32"
      alignItems="flex-start"
      justifyContent="center"
      onPress={handlePress}
      animation="quick"
      animateOnly={ANIMATE_ONLY_BORDER_COLOR}
      borderWidth={StyleSheet.hairlineWidth}
      borderColor="$borderDisabled"
      hoverStyle={{ borderColor: '$neutral4' }}
      pressStyle={{ borderColor: '$neutral5' }}
      h={118}
      userSelect="none"
      $gtMd={{
        flex: 1,
        flexBasis: 0,
        minWidth: 180,
        maxWidth: 256,
        width: 'auto',
        h: 'auto',
        minHeight: 120,
        p: '$4',
        gap: '$3',
      }}
    >
      <YStack
        testID={MarketTestIDs.bannerItem}
        gap="$0.5"
        flex={1}
        minWidth={0}
        width="100%"
        $gtMd={{ flex: 0, width: '100%', gap: '$3' }}
      >
        <XStack alignItems="flex-start" gap="$1" minWidth={0} maxWidth="100%">
          <SizableText
            size="$bodyMdMedium"
            color="$textSubdued"
            numberOfLines={isPerps && !isSmallScreen ? 1 : 2}
            flexShrink={1}
            minWidth={0}
            ellipsizeMode="tail"
          >
            {title}
          </SizableText>
          {isPerps ? (
            <Stack flexShrink={0}>
              <LeverageBadge leverage={10} />
            </Stack>
          ) : null}
        </XStack>
        <BannerFocusToken focusToken={focusToken} />
      </YStack>
      <BannerTokenGroup tokenLogos={tokenLogos} />
    </Stack>
  );
}

export const MarketBannerItem = memo(MarketBannerItemComponent);
