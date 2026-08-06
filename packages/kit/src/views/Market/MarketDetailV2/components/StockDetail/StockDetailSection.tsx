import type { ReactNode } from 'react';

import { SizableText, YStack } from '@onekeyhq/components';
import type { IStackProps } from '@onekeyhq/components';

/**
 * Shared frame for the stacked sections in the left column
 * (Figma 25314:8898 / 25317:8530 / 25319:8651): 20px side padding on the
 * section, 24px vertical padding on the inner wrapper.
 */
export function StockDetailSection({
  title,
  gap = '$6',
  children,
}: {
  title?: string;
  gap?: IStackProps['gap'];
  children: ReactNode;
}) {
  return (
    <YStack px="$5">
      <YStack py="$6" gap={gap}>
        {title ? (
          <SizableText size="$headingLg" color="$text">
            {title}
          </SizableText>
        ) : null}
        {children}
      </YStack>
    </YStack>
  );
}
