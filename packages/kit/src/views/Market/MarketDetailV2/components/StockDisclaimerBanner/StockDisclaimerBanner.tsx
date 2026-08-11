import { Icon, SizableText, XStack } from '@onekeyhq/components';

/**
 * Page-level disclaimer for tokenized stocks. Always on, never collapsible and
 * never dismissible — it is the page's standing statement that the token is not
 * the share.
 *
 * Copy is a placeholder pending legal review; the position and the always-on
 * behavior are the parts that are already decided.
 */
export function StockDisclaimerBanner() {
  return (
    <XStack
      px="$5"
      py="$2.5"
      gap="$2"
      alignItems="center"
      bg="$bgSubdued"
      borderBottomWidth="$px"
      borderBottomColor="$borderSubdued"
    >
      <Icon name="InfoCircleOutline" size="$4" color="$iconSubdued" />
      <SizableText size="$bodySm" color="$textSubdued" flex={1} minWidth={0}>
        Tokenized securities do not carry the rights of the underlying stock and
        are subject to volatility risk. Please research before investing.
      </SizableText>
    </XStack>
  );
}
