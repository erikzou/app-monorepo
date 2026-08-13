import { Fragment, useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { Button, Icon, SizableText, Stack, XStack } from '@onekeyhq/components';
import type { ISwapNativeTokenReserveGas } from '@onekeyhq/shared/types/swap/types';

import { ESwapDirection, type ITradeType } from '../../hooks/useTradeType';

import type { ISwapPanelVariant } from '../../types';
import type { IAmountEnterSource } from '../../types/analytics';

// radius/2.5 in the design tokens.
const QUICK_AMOUNT_STOCK_RADIUS = 10;

export interface IQuickAmountSelectorProps {
  onSelect: (value: string) => void;
  onPresetSelect?: (source: IAmountEnterSource) => void;
  tradeType: ITradeType;
  buyAmounts: { label: string; value: number }[];
  balance?: BigNumber;
  selectedTokenDecimals?: number;
  selectedTokenNetworkId?: string;
  selectedTokenIsNative?: boolean;
  swapNativeTokenReserveGas: ISwapNativeTokenReserveGas[];
  panelVariant?: ISwapPanelVariant;
  // Crypto assembly: opens the custom-amount editor at the end of the grid.
  onEditAmounts?: () => void;
}

const sellPercentages = [
  { label: '25%', value: '0.25' },
  { label: '50%', value: '0.5' },
  { label: '75%', value: '0.75' },
  { label: '100%', value: '1' },
];

export function QuickAmountSelector({
  onSelect,
  onPresetSelect,
  buyAmounts,
  tradeType,
  balance,
  selectedTokenDecimals,
  swapNativeTokenReserveGas,
  selectedTokenNetworkId,
  selectedTokenIsNative,
  panelVariant = 'default',
  onEditAmounts,
}: IQuickAmountSelectorProps) {
  const amounts =
    tradeType === ESwapDirection.BUY ? buyAmounts : sellPercentages;

  const handleAmountSelect = useCallback(
    (amount: { label: string; value: string | number }, index: number) => {
      const sellBalance =
        tradeType === ESwapDirection.SELL ? balance : undefined;
      if (tradeType === ESwapDirection.SELL && !sellBalance) {
        return;
      }

      // Track preset selection in analytics
      if (onPresetSelect) {
        const presetType = `preset${index + 1}` as IAmountEnterSource;
        onPresetSelect(presetType);
      }

      if (sellBalance) {
        if (sellBalance.isZero()) {
          onSelect('0');
          return;
        }
        const percentageBN = new BigNumber(amount.value.toString());
        const reserveGas = swapNativeTokenReserveGas.find(
          (item) => item.networkId === selectedTokenNetworkId,
        )?.reserveGas;
        let calculatedAmountBN = sellBalance.multipliedBy(percentageBN);
        if (selectedTokenIsNative && reserveGas) {
          calculatedAmountBN = BigNumber.max(
            0,
            calculatedAmountBN.minus(new BigNumber(reserveGas)),
          );
        }
        if (selectedTokenDecimals) {
          const calculatedAmount = calculatedAmountBN
            .decimalPlaces(selectedTokenDecimals, BigNumber.ROUND_DOWN)
            .toFixed();
          onSelect(calculatedAmount);
        } else {
          onSelect(calculatedAmountBN.toFixed());
        }
      } else {
        onSelect(amount.value.toString());
      }
    },
    [
      onPresetSelect,
      tradeType,
      balance,
      swapNativeTokenReserveGas,
      selectedTokenIsNative,
      selectedTokenDecimals,
      onSelect,
      selectedTokenNetworkId,
    ],
  );
  const amountItems = useMemo(() => {
    if (amounts.length === 0) {
      return [
        { label: '0.1', value: '0.1' },
        { label: '0.5', value: '0.5' },
        { label: '1', value: '1' },
        { label: '10', value: '10' },
      ];
    }
    return amounts;
  }, [amounts]);
  const amountsLength = amountItems.length;
  const isDisabled = tradeType === ESwapDirection.SELL && !balance;

  // Stock (Figma 25314:9168) and crypto (Figma 25671:53545) detail designs:
  // the grid is attached under the amount input as one outlined block —
  // transparent cells, hairline dividers, and only the bottom corners rounded.
  // The crypto grid adds a trailing cell that opens the amount editor.
  if (panelVariant === 'stockDesktop' || panelVariant === 'memeDesktop') {
    return (
      <XStack
        borderWidth={1}
        borderColor="$borderDisabled"
        borderBottomLeftRadius={QUICK_AMOUNT_STOCK_RADIUS}
        borderBottomRightRadius={QUICK_AMOUNT_STOCK_RADIUS}
        borderCurve="continuous"
        overflow="hidden"
      >
        {amountItems.map((amount, index) => (
          <Fragment key={`item-${amount.value}`}>
            <Stack
              testID="market-amounts-length-btn"
              flex={1}
              alignItems="center"
              justifyContent="center"
              pt={6}
              pb={7}
              px={11}
              cursor={isDisabled ? undefined : 'pointer'}
              userSelect="none"
              disabled={isDisabled}
              hoverStyle={isDisabled ? undefined : { bg: '$bgHover' }}
              pressStyle={isDisabled ? undefined : { bg: '$bgActive' }}
              onPress={() => handleAmountSelect(amount, index)}
            >
              <SizableText
                size="$bodyMd"
                color={isDisabled ? '$textDisabled' : '$text'}
                textAlign="center"
              >
                {amount.label}
              </SizableText>
            </Stack>
            {index !== amountsLength - 1 || onEditAmounts ? (
              <Stack
                key={`divider-${index}`}
                w={1}
                bg="$borderDisabled"
                alignSelf="stretch"
              />
            ) : null}
          </Fragment>
        ))}
        {onEditAmounts ? (
          <Stack
            testID="market-amounts-edit-btn"
            alignItems="center"
            justifyContent="center"
            pt={6}
            pb={7}
            px={11}
            cursor="pointer"
            userSelect="none"
            hoverStyle={{ bg: '$bgHover' }}
            pressStyle={{ bg: '$bgActive' }}
            onPress={onEditAmounts}
          >
            <Icon name="EditOutline" size="$4" color="$iconSubdued" />
          </Stack>
        ) : null}
      </XStack>
    );
  }

  return (
    <XStack gap="$0" h="$8">
      {amountItems.map((amount, index) => (
        <Fragment key={`item-${amount.value}`}>
          <Button
            testID="market-amounts-length-btn"
            key={`button-${amount.value}`}
            flex={1}
            size="medium"
            variant="secondary"
            h="$8"
            borderWidth={0}
            bg="$bgStrong"
            borderTopRightRadius={0}
            borderBottomRightRadius={index !== amountsLength - 1 ? 0 : '$2'}
            borderTopLeftRadius={0}
            borderBottomLeftRadius={index !== 0 ? 0 : '$2'}
            disabled={isDisabled}
            onPress={() => handleAmountSelect(amount, index)}
          >
            <SizableText size="$bodyMdMedium" color="$textSubdued">
              {amount.label}
            </SizableText>
          </Button>
          {index !== amountsLength - 1 ? (
            <Stack key={`divider-${index}`} w={1.5} bg="$bgApp" />
          ) : null}
        </Fragment>
      ))}
    </XStack>
  );
}
