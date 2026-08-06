import { useMemo } from 'react';

import { SizableText, Skeleton, XStack } from '@onekeyhq/components';
import type { INumberFormatProps } from '@onekeyhq/shared/src/utils/numberUtils';
import { numberFormat } from '@onekeyhq/shared/src/utils/numberUtils';

import type { ISwapPanelVariant } from '../types';

export interface IRateDisplayProps {
  rate?: number;
  fromTokenSymbol?: string;
  toTokenSymbol?: string;
  loading?: boolean;
  panelVariant?: ISwapPanelVariant;
}

// Truncate symbol if it exceeds 20 characters
function truncateSymbol(symbol?: string): string {
  if (!symbol) return '-';
  if (symbol.length > 20) {
    return `${symbol.slice(0, 17)}...`;
  }
  return symbol;
}

export function RateDisplay({
  rate,
  fromTokenSymbol,
  toTokenSymbol,
  loading,
  panelVariant = 'default',
}: IRateDisplayProps) {
  // The stock detail design puts the rate where "Est. Receive" sits
  // (Figma 25293:8391): 20px row, 2px side padding, bodyMd instead of bodySm.
  const isStockDesktop = panelVariant === 'stockDesktop';
  const truncatedFromSymbol = useMemo(
    () => truncateSymbol(fromTokenSymbol),
    [fromTokenSymbol],
  );
  const truncatedToSymbol = useMemo(
    () => truncateSymbol(toTokenSymbol),
    [toTokenSymbol],
  );

  const formatter: INumberFormatProps = useMemo(
    () => ({
      formatter: 'price',
      formatterOptions: {
        tokenSymbol: truncatedToSymbol === '-' ? '' : truncatedToSymbol,
      },
    }),
    [truncatedToSymbol],
  );
  const rateFormatted = useMemo(
    () => (rate ? numberFormat(rate.toString(), formatter) : '-'),
    [formatter, rate],
  );

  return (
    <XStack
      alignItems="center"
      height={isStockDesktop ? '$5' : '$4'}
      px={isStockDesktop ? '$0.5' : '$0'}
    >
      {loading ? (
        <Skeleton width="$32" height={isStockDesktop ? '$5' : '$4'} />
      ) : (
        <SizableText
          size={isStockDesktop ? '$bodyMd' : '$bodySm'}
          userSelect="none"
          color="$textSubdued"
        >
          {`1 ${truncatedFromSymbol} = ${rateFormatted}`}
        </SizableText>
      )}
    </XStack>
  );
}
