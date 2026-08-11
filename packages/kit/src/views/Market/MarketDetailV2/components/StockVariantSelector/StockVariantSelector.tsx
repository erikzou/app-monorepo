import { useCallback, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';
import { useIntl } from 'react-intl';

import {
  Badge,
  Button,
  Icon,
  NumberSizeableText,
  Popover,
  SizableText,
  XStack,
  YStack,
} from '@onekeyhq/components';
import backgroundApiProxy from '@onekeyhq/kit/src/background/instance/backgroundApiProxy';
import { Token } from '@onekeyhq/kit/src/components/Token';
import { useNetworkLogoUri } from '@onekeyhq/kit/src/hooks/useNetworkLogoUri';
import { usePromiseResult } from '@onekeyhq/kit/src/hooks/usePromiseResult';
import { useUSMarketStatus } from '@onekeyhq/kit/src/hooks/useUSMarketStatus';
import { useTokenDetailActions } from '@onekeyhq/kit/src/states/jotai/contexts/marketV2';
import { ETranslations } from '@onekeyhq/shared/src/locale';
import type {
  IMarketStockInfo,
  IMarketStockInstrument,
} from '@onekeyhq/shared/types/marketV2';

import { StockSourceLogo } from '../../../components/PerpsBadges';
import { MarketTestIDs } from '../../../testIDs';
import { useTokenDetail } from '../../hooks/useTokenDetail';
import { navigateToMarketTokenDetail } from '../TokenSelector/navigateToMarketTokenDetail';

import {
  findTradableAlternative,
  isVariantTradableNow,
} from './variantTradability';

// No translation key yet — demo copy straight from the design.
const VARIANT_GROUP_LABEL = 'Tokenized stock';

function isAlwaysOnTradingDays(tradingDays?: string) {
  return Boolean(tradingDays && /7\s*[x×]\s*24/i.test(tradingDays));
}
const VARIANT_PANEL_PROPS = { width: 320 } as const;

type IStockVariantRow = {
  instrument: IMarketStockInstrument;
  tradable: boolean;
  networkLogoUri?: string;
  holding: string;
};

function StockVariantRow({
  row,
  isActive,
  issuerStock,
  onSelect,
}: {
  row: IStockVariantRow;
  isActive: boolean;
  issuerStock?: IMarketStockInfo;
  onSelect: (instrument: IMarketStockInstrument) => void;
}) {
  const { instrument, holding, networkLogoUri, tradable } = row;
  const handlePress = useCallback(
    () => onSelect(instrument),
    [instrument, onSelect],
  );
  const changeColor = new BigNumber(
    instrument.priceChange24H ?? '',
  ).isNegative()
    ? '$textCritical'
    : '$textSuccess';

  return (
    <XStack
      testID={`market-stock-variant-row-${instrument.instrumentId}`}
      p="$2.5"
      gap="$2"
      alignItems="center"
      borderRadius="$2"
      borderCurve="continuous"
      bg={isActive ? '$bgActive' : undefined}
      hoverStyle={{ bg: '$bgHover' }}
      pressStyle={{ bg: '$bgActive' }}
      cursor="pointer"
      userSelect="none"
      onPress={handlePress}
    >
      <XStack flex={1} minWidth={0} gap="$3" alignItems="center">
        <Token
          size="md"
          tokenImageUri={instrument.logoUrl}
          networkImageUri={networkLogoUri}
          fallbackIcon="CryptoCoinOutline"
        />
        <YStack flex={1} minWidth={0} gap="$0.5">
          <XStack gap="$1" alignItems="center">
            <SizableText size="$bodyMdMedium" color="$text" numberOfLines={1}>
              {instrument.tokenSymbol || instrument.instrumentId}
            </SizableText>
            <StockSourceLogo stock={issuerStock} size={16} />
            {/* Only 24/7 instruments get a badge: trading outside the US
                session is the exception worth calling out, while 5x24 is the
                default and would just add noise. */}
            {tradable && isAlwaysOnTradingDays(instrument.tradingDays) ? (
              <Badge badgeType="success" badgeSize="sm" px="$1.5">
                <Badge.Text>{instrument.tradingDays}</Badge.Text>
              </Badge>
            ) : null}
          </XStack>
          <SizableText size="$bodySm" color="$textSubdued" numberOfLines={1}>
            {holding}
          </SizableText>
        </YStack>
      </XStack>
      <YStack alignItems="flex-end" gap="$0.5">
        {instrument.price ? (
          <NumberSizeableText
            size="$bodyMdMedium"
            color="$text"
            formatter="price"
            formatterOptions={{ currency: '$' }}
          >
            {instrument.price}
          </NumberSizeableText>
        ) : (
          <SizableText size="$bodyMdMedium" color="$text">
            --
          </SizableText>
        )}
        {instrument.priceChange24H ? (
          <NumberSizeableText
            size="$bodySm"
            color={changeColor}
            formatter="priceChange"
            formatterOptions={{ showPlusMinusSigns: true }}
          >
            {instrument.priceChange24H}
          </NumberSizeableText>
        ) : null}
      </YStack>
    </XStack>
  );
}

/**
 * Variant switcher for the stock entity page. The page is keyed by the stock,
 * so this picks which tokenized variant the trade panel acts on; selecting one
 * re-routes the page to that variant's token.
 */
export function StockVariantSelector({
  instruments,
  selectedInstrument,
  holdingByInstrumentId,
}: {
  instruments: IMarketStockInstrument[];
  selectedInstrument?: IMarketStockInstrument;
  // Holding amount per variant, shown as the row subtitle. Falls back to 0
  // until the position data is wired in.
  holdingByInstrumentId?: Record<string, string>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const intl = useIntl();
  const tokenDetailActions = useTokenDetailActions();
  const { tokenDetail } = useTokenDetail();
  const activeInstrument = selectedInstrument ?? instruments[0];
  const activeNetworkLogoUri = useNetworkLogoUri({
    logoUri: undefined,
    networkId: activeInstrument?.networkId,
  });
  const usMarketStatus = useUSMarketStatus();
  const isUsMarketOpen = usMarketStatus?.unavailable
    ? undefined
    : usMarketStatus?.open;

  const isActiveTradable = activeInstrument
    ? isVariantTradableNow({
        instrument: activeInstrument,
        isUsMarketOpen,
      })
    : true;
  const alternative = useMemo(
    () =>
      isActiveTradable
        ? undefined
        : findTradableAlternative({
            instruments,
            excludeInstrumentId: activeInstrument?.instrumentId,
            isUsMarketOpen,
          }),
    [
      activeInstrument?.instrumentId,
      instruments,
      isActiveTradable,
      isUsMarketOpen,
    ],
  );

  // One lookup for every chain in the list, so each row can carry the same
  // chain badge the trigger has. `useNetworkLogoUri` is per-network and cannot
  // be called inside the map.
  const networkIdsKey = useMemo(
    () =>
      Array.from(
        new Set(instruments.map((item) => item.networkId).filter(Boolean)),
      )
        .toSorted()
        .join(','),
    [instruments],
  );
  const { result: networkLogoUris } = usePromiseResult(
    async () => {
      const networkIds = networkIdsKey ? networkIdsKey.split(',') : [];
      const entries = await Promise.all(
        networkIds.map(async (networkId) => {
          const network =
            await backgroundApiProxy.serviceNetwork.getNetworkSafe({
              networkId,
            });
          return [networkId, network?.logoURI ?? ''] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<string, string>;
    },
    [networkIdsKey],
    { initResult: {} as Record<string, string> },
  );

  // Closed variants stay selectable — the spec is "mark, don't block". During
  // the US session nothing is marked at all.
  // Rows of the dropdown (Figma 25497:17813): token avatar, symbol with the
  // issuer mark, holding amount underneath, price and 24h change on the right.
  // Closed variants stay selectable — the spec is "mark, don't block".
  const rows = useMemo(
    () =>
      instruments.map((instrument) => ({
        instrument,
        tradable: isVariantTradableNow({ instrument, isUsMarketOpen }),
        networkLogoUri: networkLogoUris?.[instrument.networkId],
        holding: holdingByInstrumentId?.[instrument.instrumentId] ?? '0',
      })),
    [holdingByInstrumentId, instruments, isUsMarketOpen, networkLogoUris],
  );

  const selectVariant = useCallback(
    (next: IMarketStockInstrument | undefined) => {
      if (!next || next.instrumentId === selectedInstrument?.instrumentId) {
        return;
      }
      navigateToMarketTokenDetail(
        {
          address: next.contractAddress,
          networkId: next.networkId,
          isNative: false,
        },
        { tokenDetailActions },
      );
    },
    [selectedInstrument?.instrumentId, tokenDetailActions],
  );

  const handleSelectRow = useCallback(
    (instrument: IMarketStockInstrument) => {
      setIsOpen(false);
      selectVariant(instrument);
    },
    [selectVariant],
  );

  const handleSwitchToAlternative = useCallback(() => {
    selectVariant(alternative);
  }, [alternative, selectVariant]);

  if (instruments.length === 0) {
    return null;
  }

  const active = activeInstrument;
  // A single-variant stock has nothing to pick between, so the control
  // degrades to a plain label rather than an empty dropdown.
  const isSelectable = instruments.length > 1;

  // Trigger of the trade panel's token row (Figma 25497:17271): a borderless
  // pill with the token, its symbol and the issuer mark. The price and the
  // chart button live outside it, so the row reads as one line.
  const content = (
    <XStack gap="$2.5" alignItems="center">
      <Token
        size="sm"
        tokenImageUri={active.logoUrl}
        networkImageUri={activeNetworkLogoUri}
        fallbackIcon="CryptoCoinOutline"
      />
      <XStack gap="$1" alignItems="center" minWidth={0}>
        <SizableText
          size="$headingMd"
          color="$text"
          numberOfLines={1}
          flexShrink={1}
        >
          {active.tokenSymbol}
        </SizableText>
        <StockSourceLogo stock={tokenDetail?.stock} size={16} />
      </XStack>
      {isSelectable ? (
        <Icon name="ChevronDownSmallOutline" size="$4.5" color="$iconSubdued" />
      ) : null}
    </XStack>
  );

  const frameProps = {
    px: '$2',
    py: '$1',
    mx: '$-2',
    borderRadius: '$full',
    borderCurve: 'continuous',
    alignItems: 'center',
    alignSelf: 'flex-start',
  } as const;

  const closedNotice = isActiveTradable ? null : (
    <XStack
      mt="$2"
      px="$3"
      py="$2"
      gap="$2"
      alignItems="center"
      borderRadius="$3"
      borderCurve="continuous"
      bg="$bgCautionSubdued"
    >
      <SizableText size="$bodySm" color="$textCaution" flex={1} minWidth={0}>
        US market closed — this token is not trading right now.
      </SizableText>
      {alternative ? (
        <Button
          testID={MarketTestIDs.stockVariantSwitchButton}
          size="small"
          variant="tertiary"
          onPress={handleSwitchToAlternative}
        >
          {`Switch to ${alternative.tokenSymbol}`}
        </Button>
      ) : null}
    </XStack>
  );

  if (!isSelectable) {
    return (
      <YStack>
        <XStack {...frameProps}>{content}</XStack>
        {closedNotice}
      </YStack>
    );
  }

  return (
    <YStack>
      <Popover
        title={intl.formatMessage({ id: ETranslations.dexmarket_select_token })}
        placement="bottom-end"
        floatingPanelProps={VARIANT_PANEL_PROPS}
        open={isOpen}
        onOpenChange={setIsOpen}
        renderTrigger={
          // eslint-disable-next-line props-checker/validator -- Popover injects the trigger press handler.
          <XStack
            testID="market-stock-variant-selector-trigger"
            {...frameProps}
            hoverStyle={{ bg: '$bgHover' }}
            pressStyle={{ bg: '$bgActive' }}
            cursor="pointer"
            userSelect="none"
          >
            {content}
          </XStack>
        }
        renderContent={
          <YStack p="$1" bg="$bg" borderRadius="$3" borderCurve="continuous">
            <XStack p="$2">
              <SizableText size="$bodySmMedium" color="$textSubdued" flex={1}>
                {VARIANT_GROUP_LABEL}
              </SizableText>
            </XStack>
            {rows.map((row) => (
              <StockVariantRow
                key={row.instrument.instrumentId}
                row={row}
                isActive={row.instrument.instrumentId === active.instrumentId}
                issuerStock={tokenDetail?.stock}
                onSelect={handleSelectRow}
              />
            ))}
          </YStack>
        }
      />
      {closedNotice}
    </YStack>
  );
}
