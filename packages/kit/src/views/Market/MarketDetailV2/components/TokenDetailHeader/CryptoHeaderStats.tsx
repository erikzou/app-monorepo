import { useIntl } from 'react-intl';

import {
  NumberSizeableText,
  SizableText,
  XStack,
  YStack,
} from '@onekeyhq/components';
import { ETranslations } from '@onekeyhq/shared/src/locale';

import { useTokenDetail } from '../../hooks/useTokenDetail';
import { STAT_FALLBACK_VALUE, normalizeStatValue } from '../../utils/statValue';

/**
 * The three header figures of the crypto assembly (Figma 25616:49287), sitting
 * opposite the price. Market cap / Liquidity / Holders — there is no risk
 * rating column: the security counter in the header row is the page's only risk
 * entry point.
 */
export function CryptoHeaderStats() {
  const intl = useIntl();
  const { tokenDetail } = useTokenDetail();

  const items = [
    {
      key: 'marketCap',
      label: intl.formatMessage({ id: ETranslations.dexmarket_market_cap }),
      value: normalizeStatValue(tokenDetail?.marketCap) ?? STAT_FALLBACK_VALUE,
      formatterOptions: { currency: '$', capAtMaxT: true },
    },
    {
      key: 'liquidity',
      label: intl.formatMessage({ id: ETranslations.dexmarket_liquidity }),
      value: normalizeStatValue(tokenDetail?.liquidity) ?? STAT_FALLBACK_VALUE,
      formatterOptions: { currency: '$' },
    },
    {
      key: 'holders',
      label: intl.formatMessage({ id: ETranslations.dexmarket_holders }),
      value: normalizeStatValue(tokenDetail?.holders) ?? STAT_FALLBACK_VALUE,
      formatterOptions: undefined,
    },
  ];

  return (
    <XStack gap="$5" alignItems="flex-start" flexShrink={0}>
      {items.map((item) => (
        <YStack key={item.key} gap="$1">
          <SizableText size="$bodySm" color="$textSubdued">
            {item.label}
          </SizableText>
          <NumberSizeableText
            size="$headingSm"
            color="$text"
            formatter="marketCap"
            formatterOptions={item.formatterOptions}
          >
            {item.value}
          </NumberSizeableText>
        </YStack>
      ))}
    </XStack>
  );
}
