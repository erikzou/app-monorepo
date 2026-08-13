import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { Ref } from 'react';

import { useIntl } from 'react-intl';

import { Icon, Input, SizableText, XStack, YStack } from '@onekeyhq/components';
import type { IInputRef, IYStackProps } from '@onekeyhq/components';
import { validateAmountInput } from '@onekeyhq/kit/src/utils/validateAmountInput';
import {
  EAppEventBusNames,
  appEventBus,
} from '@onekeyhq/shared/src/eventBus/appEventBus';
import { dismissKeyboard } from '@onekeyhq/shared/src/keyboard';
import { ETranslations } from '@onekeyhq/shared/src/locale';
import { equalTokenNoCaseSensitive } from '@onekeyhq/shared/src/utils/tokenUtils';
import type { ISwapNativeTokenReserveGas } from '@onekeyhq/shared/types/swap/types';

import { ESwapDirection, type ITradeType } from '../../hooks/useTradeType';

import { QuickAmountSelector } from './QuickAmountSelector';
import { TokenSelectorPopover } from './TokenSelectorPopover';

import type { ISwapPanelVariant, IToken } from '../../types';
import type { IAmountEnterSource } from '../../types/analytics';
import type BigNumber from 'bignumber.js';

export interface ITokenInputSectionRef {
  setValue: (value: string) => void;
}

// The stock detail design shows a numeric placeholder rather than a sentence
// (Figma 25314:9160), so it needs no translation key.
const STOCK_AMOUNT_PLACEHOLDER = '0.0';

export interface ITokenInputSectionProps {
  onChange: (value: string) => void;
  selectedToken?: IToken;
  selectableTokens: IToken[];
  onTokenChange: (token: IToken) => void;
  onPressTokenSelector?: () => void;
  tradeType: ITradeType;
  balance?: BigNumber;
  swapNativeTokenReserveGas: ISwapNativeTokenReserveGas[];
  onAmountEnterTypeChange?: (source: IAmountEnterSource) => void;
  style?: IYStackProps;
  disableNativeToken?: boolean;
  panelVariant?: ISwapPanelVariant;
  // Crypto assembly: opens the custom-amount editor from the grid's last cell.
  onEditAmounts?: () => void;
}

function TokenInputSectionComponent(
  {
    onChange,
    selectedToken,
    selectableTokens,
    onTokenChange,
    tradeType,
    balance,
    swapNativeTokenReserveGas,
    onAmountEnterTypeChange,
    style,
    disableNativeToken,
    panelVariant = 'default',
    onEditAmounts,
  }: ITokenInputSectionProps,
  ref: Ref<ITokenInputSectionRef>,
) {
  // Both detail assemblies attach the quick-amount grid to the input and use
  // the design's denser input treatment (stock: Figma 25314:9157, crypto:
  // Figma 25671:53545).
  const isStockDesktop =
    panelVariant === 'stockDesktop' || panelVariant === 'memeDesktop';
  const intl = useIntl();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [internalValue, setInternalValue] = useState('');
  const inputRef = useRef<IInputRef>(null);
  const isPresetSelectionRef = useRef(false);
  useImperativeHandle(
    ref,
    () => ({
      setValue: (newValue: string) => {
        setInternalValue(newValue);
        onChange(newValue);
      },
    }),
    [onChange],
  );

  const handleInternalChange = useCallback(
    (newValue: string) => {
      if (validateAmountInput(newValue, selectedToken?.decimals)) {
        setInternalValue(newValue);
        onChange(newValue);
        // Track manual input in analytics (only if not from preset selection)
        if (!isPresetSelectionRef.current) {
          onAmountEnterTypeChange?.('manual');
        }
        // Reset the preset selection flag
        isPresetSelectionRef.current = false;
      }
    },
    [onChange, selectedToken?.decimals, onAmountEnterTypeChange],
  );

  // Handler for preset amount selection with analytics tracking
  const handlePresetAmountSelect = useCallback(
    (value: string) => {
      isPresetSelectionRef.current = true;
      handleInternalChange(value);
    },
    [handleInternalChange],
  );

  const handleTokenSelect = useCallback(
    (token: IToken) => {
      onTokenChange(token);
      setIsPopoverOpen(false);
    },
    [onTokenChange],
  );

  const isTokenSelectorVisible =
    tradeType === ESwapDirection.BUY && selectableTokens.length > 1;

  const placeholderLabel =
    tradeType === ESwapDirection.BUY
      ? intl.formatMessage({ id: ETranslations.dexmarket_total })
      : intl.formatMessage({
          id: ETranslations.dexmarket_details_history_amount,
        });

  const placeholderText = (
    <SizableText
      // Design label is regular weight (Figma 25314:9157).
      size={isStockDesktop ? '$bodyMd' : '$bodyMdMedium'}
      color="$textSubdued"
      userSelect="none"
    >
      {placeholderLabel}
    </SizableText>
  );

  useEffect(() => {
    const handleSwapSpeedBuildTxSuccess = (data: {
      fromToken: import('@onekeyhq/shared/types/swap/types').ISwapTokenBase;
      toToken: import('@onekeyhq/shared/types/swap/types').ISwapTokenBase;
      fromAmount: string;
      toAmount: string;
    }) => {
      if (
        selectedToken &&
        equalTokenNoCaseSensitive({
          token1: selectedToken,
          token2: data.fromToken,
        })
      ) {
        setInternalValue('');
        onChange('');
      }
    };

    appEventBus.on(
      EAppEventBusNames.SwapSpeedBuildTxSuccess,
      handleSwapSpeedBuildTxSuccess,
    );

    return () => {
      appEventBus.off(
        EAppEventBusNames.SwapSpeedBuildTxSuccess,
        handleSwapSpeedBuildTxSuccess,
      );
    };
  }, [selectedToken, onChange]);

  // Listen for keyboard dismiss events
  useEffect(() => {
    const handleDismissKeyboard = () => {
      inputRef.current?.blur();
      dismissKeyboard();
    };

    appEventBus.on(
      EAppEventBusNames.SwapPanelDismissKeyboard,
      handleDismissKeyboard,
    );

    return () => {
      appEventBus.off(
        EAppEventBusNames.SwapPanelDismissKeyboard,
        handleDismissKeyboard,
      );
      dismissKeyboard();
    };
  }, []);

  return (
    <YStack {...style}>
      <YStack
        borderRadius={isStockDesktop ? 10 : '$2'}
        borderCurve="continuous"
        bg="$bgApp"
        gap={isStockDesktop ? 0 : '$px'}
        overflow="hidden"
      >
        <Input
          testID="market-handle-dismiss-keyboard-input"
          ref={inputRef}
          size="small"
          containerProps={{
            flex: 1,
            borderWidth: 0,
            // Design row is 12px padding around a 24px value line.
            h: isStockDesktop ? 48 : 44,
            alignItems: 'center',
            borderRadius: 0,
            bg: '$bgStrong',
          }}
          keyboardType="decimal-pad"
          value={internalValue}
          placeholder={
            isStockDesktop
              ? STOCK_AMOUNT_PLACEHOLDER
              : intl.formatMessage({
                  id: ETranslations.dexmarket_enter_amount,
                })
          }
          onChangeText={handleInternalChange}
          leftAddOnProps={{
            label: placeholderText,
            // Design pads the "Total" label by 12 (Figma 25314:9157).
            ...(isStockDesktop ? { px: '$3' } : undefined),
          }}
          // Value line is right-aligned 16px medium with 8px side padding.
          {...(isStockDesktop
            ? {
                fontSize: 16,
                fontWeight: '500',
                px: '$2',
                textAlign: 'right' as const,
              }
            : undefined)}
          addOnsContainerProps={{
            borderRadius: 0,
          }}
          addOns={[
            {
              renderContent: (
                <XStack
                  alignItems="center"
                  h={isStockDesktop ? 48 : 44}
                  gap="$1"
                  // Symbol sits 8 from the value, chevron 6 from the edge
                  // (Figma 25314:9162 / 25314:9163).
                  pl="$2"
                  pr={isStockDesktop ? 6 : '$2'}
                  {...(isTokenSelectorVisible && {
                    onPress: () => setIsPopoverOpen(true),
                    userSelect: 'none',
                    hoverStyle: { bg: '$bgHover' },
                    pressStyle: { bg: '$bgActive' },
                    borderCurve: 'continuous',
                  })}
                >
                  <SizableText
                    size={isStockDesktop ? '$bodyLg' : '$bodyMd'}
                    color="$text"
                    numberOfLines={1}
                    maxWidth="$16"
                  >
                    {selectedToken?.symbol}
                  </SizableText>
                  {isTokenSelectorVisible ? (
                    <Icon
                      name="ChevronDownSmallOutline"
                      size="$4"
                      color="$iconSubdued"
                    />
                  ) : null}
                </XStack>
              ),
            },
          ]}
        />
        <TokenSelectorPopover
          isOpen={isPopoverOpen}
          onOpenChange={setIsPopoverOpen}
          tokens={selectableTokens}
          onTokenPress={handleTokenSelect}
          disableNativeToken={disableNativeToken}
        />
        <QuickAmountSelector
          buyAmounts={
            selectedToken?.speedSwapDefaultAmount?.map((amount) => ({
              label: amount.toString(),
              value: amount,
            })) ?? []
          }
          selectedTokenDecimals={selectedToken?.decimals}
          selectedTokenNetworkId={selectedToken?.networkId}
          selectedTokenIsNative={selectedToken?.isNative}
          onSelect={handlePresetAmountSelect}
          onPresetSelect={onAmountEnterTypeChange}
          tradeType={tradeType}
          balance={balance}
          swapNativeTokenReserveGas={swapNativeTokenReserveGas}
          panelVariant={panelVariant}
          onEditAmounts={onEditAmounts}
        />
      </YStack>
    </YStack>
  );
}

export const TokenInputSection = forwardRef<
  ITokenInputSectionRef,
  ITokenInputSectionProps
>(TokenInputSectionComponent);
