import { useCallback, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';

import {
  Badge,
  Button,
  Icon,
  IconButton,
  Image,
  Input,
  SizableText,
  Stack,
  XStack,
  YStack,
} from '@onekeyhq/components';
import { Token } from '@onekeyhq/kit/src/components/Token';
import { useMarketPriceSourceAtom } from '@onekeyhq/kit-bg/src/states/jotai/atoms';
import type { IMarketStockInstrument } from '@onekeyhq/shared/types/marketV2';

import { useMarketStockEntity } from '../../hooks/useMarketStockEntity';
import { useTokenDetail } from '../../hooks/useTokenDetail';
import { StockVariantSelector } from '../StockVariantSelector/StockVariantSelector';
import { TokenSelectorPopover } from '../SwapPanel/components/TokenInputSection/TokenSelectorPopover';
import { TradeTypeSelector } from '../SwapPanel/components/TradeTypeSelector';
import { useSpeedSwapInit } from '../SwapPanel/hooks/useSpeedSwapInit';
import { ESwapDirection } from '../SwapPanel/hooks/useTradeType';

import type { IToken } from '../SwapPanel/types';

// TODO(data): demo figures until the panel is wired to the swap quote flow.
const DEMO_BALANCE = '10000.01';
const DEMO_PROVIDER_LABEL = 'Best';
const SIDE_SWITCH_WIDTH = 176;

// Stocks are quoted in dollars, so the panel opens on a stablecoin rather
// than whatever the chain's speed-config happens to list first (usually the
// native token).
const PREFERRED_PAY_SYMBOLS = ['USDC', 'USDT'];

function pickDefaultPayToken(tokens: IToken[]) {
  const bySymbol = (symbol: string) =>
    tokens.find((token) => token.symbol?.toUpperCase() === symbol);
  const preferred = PREFERRED_PAY_SYMBOLS.map(bySymbol).find(Boolean);
  const anyStable = tokens.find((token) =>
    token.symbol?.toUpperCase().includes('USD'),
  );
  return preferred ?? anyStable ?? tokens[0];
}

const AMOUNT_INPUT_CONTAINER_PROPS = {
  borderWidth: 0,
  bg: '$transparent',
} as const;

function AmountCard({
  amount,
  onAmountChange,
  onMaxPress,
  fiatValue,
  payToken,
  payTokens,
  onPayTokenChange,
}: {
  amount: string;
  onAmountChange: (value: string) => void;
  onMaxPress: () => void;
  fiatValue: string;
  payToken?: IToken;
  payTokens: IToken[];
  onPayTokenChange: (token: IToken) => void;
}) {
  const [isTokenListOpen, setIsTokenListOpen] = useState(false);
  const handleTokenPress = useCallback(
    (token: IToken) => {
      onPayTokenChange(token);
      setIsTokenListOpen(false);
    },
    [onPayTokenChange],
  );
  const handleOpenTokenList = useCallback(() => setIsTokenListOpen(true), []);

  return (
    <YStack bg="$bgSubdued" borderRadius="$3" borderCurve="continuous">
      <XStack pt="$2.5" px="$3.5">
        <SizableText size="$bodyMd" color="$textSubdued" flex={1}>
          Pay
        </SizableText>
      </XStack>

      <XStack alignItems="center">
        <Stack flex={1} minWidth={0}>
          <Input
            testID="market-stock-trade-amount"
            size="large"
            value={amount}
            onChangeText={onAmountChange}
            placeholder="0"
            keyboardType="decimal-pad"
            borderWidth={0}
            bg="$transparent"
            px="$3.5"
            py="$2.5"
            fontSize={28}
            fontWeight="600"
            containerProps={AMOUNT_INPUT_CONTAINER_PROPS}
          />
        </Stack>
        <XStack
          px="$3.5"
          py="$4"
          gap="$2"
          alignItems="center"
          cursor={payTokens.length > 1 ? 'pointer' : undefined}
          userSelect="none"
          onPress={payTokens.length > 1 ? handleOpenTokenList : undefined}
          testID="market-stock-trade-pay-token"
        >
          <Token
            size="sm"
            tokenImageUri={payToken?.logoURI}
            fallbackIcon="CryptoCoinOutline"
          />
          <SizableText size="$headingXl" color="$text">
            {payToken?.symbol ?? '--'}
          </SizableText>
          {payTokens.length > 1 ? (
            <Icon
              name="ChevronDownSmallOutline"
              size="$5"
              color="$iconSubdued"
            />
          ) : null}
        </XStack>
        <TokenSelectorPopover
          isOpen={isTokenListOpen}
          onOpenChange={setIsTokenListOpen}
          tokens={payTokens}
          onTokenPress={handleTokenPress}
        />
      </XStack>

      <XStack pb="$2" px="$3.5" alignItems="center">
        <SizableText size="$bodySm" color="$textSubdued" flex={1} minWidth={0}>
          {fiatValue}
        </SizableText>
        <XStack gap="$1" alignItems="center">
          <SizableText size="$bodySm" color="$textSubdued">
            {DEMO_BALANCE}
          </SizableText>
          <SizableText
            size="$bodySmMedium"
            color="$textInteractive"
            cursor="pointer"
            onPress={onMaxPress}
            testID="market-stock-trade-max"
          >
            Max
          </SizableText>
        </XStack>
      </XStack>
    </YStack>
  );
}

/**
 * Stock trade panel of the detail page (Figma 25497:17253). Mirrors the
 * Trade > Stocks panel: side switch and settings on top, the variant selector
 * with its price and chart toggle, the amount card, the estimated output and
 * the review action over the rate line.
 */
export function StockTradePanel() {
  const { tokenDetail } = useTokenDetail();
  const { entity, selectedInstrument } = useMarketStockEntity();
  const [{ source: priceSource }, setPriceSource] = useMarketPriceSourceAtom();
  const [side, setSide] = useState<ESwapDirection>(ESwapDirection.BUY);
  const [amount, setAmount] = useState('');

  const instruments = useMemo<IMarketStockInstrument[]>(
    () => entity?.instruments ?? [],
    [entity?.instruments],
  );
  const activeInstrument = selectedInstrument ?? instruments[0];
  const tokenSymbol =
    activeInstrument?.tokenSymbol ?? tokenDetail?.symbol ?? '';
  const tokenPrice = activeInstrument?.price ?? tokenDetail?.price;

  // Reuses the market panel's payment token list so the icon and the picker
  // match what the previous version of this input offered.
  const { defaultTokens } = useSpeedSwapInit(
    activeInstrument?.networkId ?? tokenDetail?.networkId ?? '',
    true,
  );
  const payTokens = useMemo(() => defaultTokens ?? [], [defaultTokens]);
  const [selectedPayToken, setSelectedPayToken] = useState<IToken | undefined>(
    undefined,
  );
  const payToken = selectedPayToken ?? pickDefaultPayToken(payTokens);

  const isTokenPriceSource = priceSource === 'token';
  const handleTogglePriceSource = useCallback(() => {
    setPriceSource({ source: isTokenPriceSource ? 'share' : 'token' });
  }, [isTokenPriceSource, setPriceSource]);

  const handleSideChange = useCallback((value?: ESwapDirection) => {
    if (value) {
      setSide(value);
    }
  }, []);
  const handleMaxPress = useCallback(() => setAmount(DEMO_BALANCE), []);

  const amountBN = new BigNumber(amount || '');
  const hasAmount = amountBN.isFinite() && amountBN.gt(0);
  const priceBN = new BigNumber(tokenPrice ?? '');
  const receiveAmount =
    hasAmount && priceBN.isFinite() && priceBN.gt(0)
      ? amountBN.dividedBy(priceBN)
      : undefined;
  const rate =
    priceBN.isFinite() && priceBN.gt(0)
      ? new BigNumber(1).dividedBy(priceBN)
      : undefined;

  return (
    <YStack bg="$bgApp" gap="$4">
      <XStack pt="$6" px="$5" gap="$4" alignItems="center">
        {/* Same control the Trade > Stocks panel uses. */}
        <Stack w={SIDE_SWITCH_WIDTH}>
          <TradeTypeSelector
            value={side}
            onChange={handleSideChange}
            size="small"
            preventTextWrap
          />
        </Stack>
        <XStack flex={1} minWidth={0} justifyContent="flex-end">
          <IconButton
            testID="market-stock-trade-settings"
            icon="SliderHorOutline"
            variant="tertiary"
            size="medium"
          />
        </XStack>
      </XStack>

      <YStack px="$5" gap="$4">
        <XStack pl="$1" py="$2" gap="$2" alignItems="center">
          <Stack flex={1} minWidth={0}>
            <StockVariantSelector
              instruments={instruments}
              selectedInstrument={selectedInstrument}
            />
          </Stack>
          {/* Same toggle as the chart header's Share / Token Price switch. */}
          <Stack
            testID="market-stock-price-source-chart"
            w="$8"
            h="$8"
            borderRadius="$2"
            borderCurve="continuous"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            userSelect="none"
            bg={isTokenPriceSource ? '$bgStrong' : '$transparent'}
            hoverStyle={{ bg: isTokenPriceSource ? '$bgStrong' : '$bgHover' }}
            pressStyle={{ bg: '$bgActive' }}
            onPress={handleTogglePriceSource}
          >
            <Icon
              name="TradingViewCandlesOutline"
              size="$5"
              color={isTokenPriceSource ? '$icon' : '$iconSubdued'}
            />
          </Stack>
        </XStack>

        <AmountCard
          amount={amount}
          onAmountChange={setAmount}
          onMaxPress={handleMaxPress}
          fiatValue={hasAmount ? `$${amountBN.toFixed(2)}` : '$0.00'}
          payToken={payToken}
          payTokens={payTokens}
          onPayTokenChange={setSelectedPayToken}
        />

        <XStack h={48} px="$0.5" gap="$2" alignItems="center">
          <XStack gap="$1" alignItems="center">
            <Icon name="HandCoinsOutline" size="$4.5" color="$iconSubdued" />
            <SizableText size="$bodyMd" color="$text">
              Est received
            </SizableText>
          </XStack>
          <YStack flex={1} minWidth={0} alignItems="flex-end">
            <SizableText size="$bodyMdMedium" color="$text">
              {receiveAmount
                ? `${receiveAmount.toFixed(4)} ${tokenSymbol}`
                : '--'}
            </SizableText>
            <SizableText size="$bodyMd" color="$textSubdued">
              {hasAmount ? `$${amountBN.toFixed(2)}` : '--'}
            </SizableText>
          </YStack>
        </XStack>
      </YStack>

      <YStack pb="$5" px="$5">
        <Button
          testID="market-stock-trade-review"
          size="large"
          variant="primary"
          disabled={!hasAmount}
        >
          {hasAmount ? 'Review' : 'Enter amount'}
        </Button>

        {/* Swap only surfaces the rate once there is an amount to price. */}
        {hasAmount ? (
          <XStack pt="$5" pl="$0.5" gap="$2" alignItems="center">
            <XStack gap="$1" alignItems="center" flexShrink={1} minWidth={0}>
              <Icon
                name="RotateClockwiseOutline"
                size="$4.5"
                color="$iconSubdued"
              />
              <SizableText size="$bodyMd" color="$text" numberOfLines={1}>
                {rate
                  ? `1 ${payToken?.symbol ?? '--'} = ${rate.toFixed(6)} ${tokenSymbol}`
                  : '--'}
              </SizableText>
            </XStack>
            <XStack flex={1} minWidth={0} gap="$1" justifyContent="flex-end">
              <Badge badgeType="success" badgeSize="sm">
                <Badge.Text>{DEMO_PROVIDER_LABEL}</Badge.Text>
              </Badge>
              {activeInstrument?.logoUrl ? (
                <Image
                  width={20}
                  height={20}
                  borderRadius="$1"
                  source={{ uri: activeInstrument.logoUrl }}
                />
              ) : null}
              <Icon
                name="ChevronDownSmallOutline"
                size="$5"
                color="$iconSubdued"
              />
            </XStack>
          </XStack>
        ) : null}
      </YStack>
    </YStack>
  );
}
