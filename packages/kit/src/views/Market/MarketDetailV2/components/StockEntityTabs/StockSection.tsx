import type { ReactNode } from 'react';

import { SizableText, YStack } from '@onekeyhq/components';

/**
 * One Overview section. Every section owns its vertical rhythm (Figma
 * 25583:17997 and siblings: 32 above and below, 16 under the title), so the
 * list that stacks them needs no gap of its own.
 */
export function StockSection({
  title,
  gap = '$4',
  children,
}: {
  title?: string;
  gap?: '$4' | '$6';
  children: ReactNode;
}) {
  return (
    <YStack py="$8" gap={gap}>
      {title ? (
        <SizableText size="$headingXl" color="$text">
          {title}
        </SizableText>
      ) : null}
      {children}
    </YStack>
  );
}
