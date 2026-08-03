import { useCallback, useMemo } from 'react';

import { useIntl } from 'react-intl';

import {
  Button,
  Icon,
  NumberSizeableText,
  Select,
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
import type { IMarketStockInstrument } from '@onekeyhq/shared/types/marketV2';

import { StockSourceLogo } from '../../../components/PerpsBadges';
import { MarketTestIDs } from '../../../testIDs';
import { useTokenDetail } from '../../hooks/useTokenDetail';
import { navigateToMarketTokenDetail } from '../TokenSelector/navigateToMarketTokenDetail';

import {
  findTradableAlternative,
  isVariantTradableNow,
} from './variantTradability';

const ISSUER_LABELS: Record<string, string> = {
  ondo: 'Ondo',
  xstock: 'xStock',
};

function formatIssuer(issuer: string) {
  return ISSUER_LABELS[issuer.toLowerCase()] ?? issuer;
}

function describeInstrument(instrument: IMarketStockInstrument) {
  return [instrument.chainName, formatIssuer(instrument.issuer)]
    .filter(Boolean)
    .join(' · ');
}

/**
 * Variant switcher for the stock entity page. The page is keyed by the stock,
 * so this picks which tokenized variant the trade panel acts on; selecting one
 * re-routes the page to that variant's token.
 */
export function StockVariantSelector({
  instruments,
  selectedInstrument,
}: {
  instruments: IMarketStockInstrument[];
  selectedInstrument?: IMarketStockInstrument;
}) {
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
  const items = useMemo(
    () =>
      instruments.map((instrument) => {
        const tradable = isVariantTradableNow({ instrument, isUsMarketOpen });
        return {
          label: instrument.tokenSymbol || instrument.instrumentId,
          value: instrument.instrumentId,
          // The issuer stays as text here: the index carries no per-instrument
          // issuer logo, and the only real source describes the selected token
          // rather than the other rows.
          description: tradable
            ? describeInstrument(instrument)
            : `${describeInstrument(instrument)} · Closed`,
          leading: (
            <Token
              size="md"
              tokenImageUri={instrument.logoUrl}
              networkImageUri={networkLogoUris?.[instrument.networkId]}
              fallbackIcon="CryptoCoinOutline"
            />
          ),
        };
      }),
    [instruments, isUsMarketOpen, networkLogoUris],
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

  const handleChange = useCallback(
    (instrumentId: string) => {
      selectVariant(
        instruments.find((item) => item.instrumentId === instrumentId),
      );
    },
    [instruments, selectVariant],
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

  const content = (
    <XStack gap="$2.5" alignItems="center" flex={1}>
      <Token
        size="md"
        tokenImageUri={active.logoUrl}
        networkImageUri={activeNetworkLogoUri}
        fallbackIcon="CryptoCoinOutline"
      />
      <YStack flex={1} minWidth={0}>
        <XStack gap="$1.5" alignItems="center">
          <SizableText size="$bodyMdMedium" color="$text" numberOfLines={1}>
            {active.tokenSymbol}
          </SizableText>
          {/* Issuer mark reads as a property of the token name, so it trails
              the symbol rather than sitting in the subtitle. */}
          <StockSourceLogo stock={tokenDetail?.stock} />
        </XStack>
        {/* Issuer is already shown as a logo above, so the trigger subtitle
            carries only the chain and stops truncating. */}
        <XStack gap="$1.5" alignItems="center">
          <SizableText size="$bodySm" color="$textSubdued" numberOfLines={1}>
            {active.chainName}
          </SizableText>
          {isActiveTradable ? null : (
            <SizableText size="$bodySm" color="$textCaution">
              Closed
            </SizableText>
          )}
        </XStack>
      </YStack>
      {active.price ? (
        <NumberSizeableText
          size="$bodyMdMedium"
          color="$text"
          formatter="price"
          formatterOptions={{ currency: '$' }}
        >
          {active.price}
        </NumberSizeableText>
      ) : null}
      {isSelectable ? (
        <Icon name="ChevronDownSmallOutline" size="$5" color="$iconSubdued" />
      ) : null}
    </XStack>
  );

  const frameProps = {
    px: '$3',
    py: '$2',
    borderRadius: '$3',
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '$borderSubdued',
    alignItems: 'center',
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
      <Select
        testID="market-stock-variant-selector"
        title={intl.formatMessage({ id: ETranslations.dexmarket_select_token })}
        items={items}
        value={active.instrumentId}
        onChange={handleChange}
        placement="bottom-end"
        floatingPanelProps={{ width: 300 }}
        renderTrigger={({ onPress, disabled }) => (
          <XStack
            testID="market-stock-variant-selector-trigger"
            {...frameProps}
            opacity={disabled ? 0.5 : 1}
            hoverStyle={{ bg: '$bgHover' }}
            pressStyle={{ bg: '$bgActive' }}
            cursor={disabled ? 'not-allowed' : 'pointer'}
            userSelect="none"
            onPress={onPress}
          >
            {content}
          </XStack>
        )}
      />
      {closedNotice}
    </YStack>
  );
}
