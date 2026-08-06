import { useCallback, useState } from 'react';

import { useIntl } from 'react-intl';

import {
  Badge,
  SizableText,
  Skeleton,
  XStack,
  YStack,
} from '@onekeyhq/components';
import { ETranslations } from '@onekeyhq/shared/src/locale';

import { useTokenDetail } from '../../hooks/useTokenDetail';

import { StockDetailSection } from './StockDetailSection';

const COLLAPSED_LINE_COUNT = 3;

// TODO(data): sample copy so the section is reviewable before the company
// profile fields exist. Delete once `introduction` / `sector` are wired up.
const PLACEHOLDER_SECTOR = 'Consumer Tech';
const PLACEHOLDER_INTRODUCTION =
  'Company profile copy goes here. This paragraph is placeholder text that stands in for the issuer description returned by the API, and is long enough to show how the block wraps onto several lines before it is clamped and the More link appears.';

/**
 * Company profile block (Figma 25319:8651). The company introduction and the
 * sector tag are not part of the token detail payload yet, so both slots fall
 * back to placeholders until the fields land.
 */
export function StockAboutSection({
  introduction = PLACEHOLDER_INTRODUCTION,
  sector = PLACEHOLDER_SECTOR,
}: {
  introduction?: string;
  sector?: string;
}) {
  const intl = useIntl();
  const { tokenDetail } = useTokenDetail();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpand = useCallback(() => setIsExpanded(true), []);

  const companyName =
    tokenDetail?.stock?.underlyingAssetName || tokenDetail?.name;

  return (
    <StockDetailSection
      title={intl.formatMessage({ id: ETranslations.global_about })}
    >
      <YStack gap="$4">
        <XStack gap="$3" alignItems="center">
          {companyName ? (
            <SizableText size="$bodyLgMedium" color="$text">
              {companyName}
            </SizableText>
          ) : (
            <Skeleton w={120} h={24} />
          )}
          {sector ? (
            <Badge badgeType="default" badgeSize="sm">
              <Badge.Text>{sector}</Badge.Text>
            </Badge>
          ) : (
            <Skeleton w={88} h={20} />
          )}
        </XStack>

        {introduction ? (
          <YStack>
            <SizableText
              size="$bodyMd"
              color="$textSubdued"
              numberOfLines={isExpanded ? undefined : COLLAPSED_LINE_COUNT}
            >
              {introduction}
            </SizableText>
            {isExpanded ? null : (
              <SizableText
                size="$bodyMd"
                color="$textSubdued"
                textDecorationLine="underline"
                cursor="pointer"
                onPress={handleExpand}
              >
                {intl.formatMessage({ id: ETranslations.global_more })}
              </SizableText>
            )}
          </YStack>
        ) : (
          <YStack gap="$1">
            <Skeleton w="100%" h={20} />
            <Skeleton w="100%" h={20} />
            <Skeleton w="60%" h={20} />
          </YStack>
        )}
      </YStack>
    </StockDetailSection>
  );
}
