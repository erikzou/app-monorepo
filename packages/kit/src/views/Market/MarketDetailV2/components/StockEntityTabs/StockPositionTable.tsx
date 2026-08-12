import {
  Empty,
  NumberSizeableText,
  SizableText,
  Spinner,
  Stack,
  XStack,
  YStack,
} from '@onekeyhq/components';
import { Token } from '@onekeyhq/kit/src/components/Token';
import { useNetworkLogoUri } from '@onekeyhq/kit/src/hooks/useNetworkLogoUri';
import type { IMarketAccountPortfolioItem } from '@onekeyhq/shared/types/marketV2';

import { formatPriceChangeDisplay } from '../../utils/statValue';

const COLUMNS = [
  { key: 'token', label: 'Token', align: 'flex-start' as const, grow: 1.4 },
  { key: 'balance', label: 'Balance', align: 'flex-end' as const, grow: 1 },
  {
    key: 'unrealized',
    label: 'Unrealized PnL',
    align: 'flex-end' as const,
    grow: 1,
  },
  { key: 'total', label: 'Total PnL', align: 'flex-end' as const, grow: 1 },
];

/**
 * Header and body cells have to land on the same grid, so every column sizes
 * from its share of the row (flexBasis 0) instead of from its own content —
 * otherwise "Unrealized PnL" alone widens its column and the labels drift off
 * the numbers below them.
 *
 * Alignment is left to the call site: `align` is the horizontal intent, which
 * is `alignItems` on a column cell but `justifyContent` on the row's token
 * cell — spreading it blindly there top-pinned the symbol instead of centering
 * it against the avatar.
 */
function cellProps(column: (typeof COLUMNS)[number]) {
  return {
    flexGrow: column.grow,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
  } as const;
}

function formatUsd(value: string | undefined) {
  if (!value) {
    return '--';
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return '--';
  }
  const sign = num < 0 ? '-' : '';
  return `${sign}$${Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPercent(value: string | undefined) {
  if (!value) {
    return '--';
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return '--';
  }
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
}

/**
 * Two-line cells: USD on top, quantity or percentage underneath. One row per
 * variant, so a ticker held through several issuers/chains shows several rows.
 */
function PnlCell({
  usd,
  percent,
}: {
  usd: string | undefined;
  percent: string | undefined;
}) {
  const { color } = formatPriceChangeDisplay(percent);
  return (
    <YStack alignItems="flex-end">
      <SizableText size="$bodyMdMedium" color={color}>
        {formatUsd(usd)}
      </SizableText>
      <SizableText size="$bodySm" color={color}>
        {formatPercent(percent)}
      </SizableText>
    </YStack>
  );
}

function PositionRow({
  item,
  tokenLogoUrl,
  networkLogoUri,
}: {
  item: IMarketAccountPortfolioItem;
  tokenLogoUrl?: string;
  networkLogoUri?: string;
}) {
  return (
    <XStack py="$3" alignItems="center" gap="$3">
      <XStack {...cellProps(COLUMNS[0])} alignItems="center" gap="$2.5">
        {/* A position is one tokenization on one chain — unlike the list's
            collapsed company row, the chain badge belongs here. */}
        <Token
          size="md"
          tokenImageUri={tokenLogoUrl}
          networkImageUri={networkLogoUri}
          fallbackIcon="CryptoCoinOutline"
        />
        <SizableText size="$bodyMdMedium" color="$text" numberOfLines={1}>
          {item.symbol}
        </SizableText>
      </XStack>

      <YStack {...cellProps(COLUMNS[1])} alignItems={COLUMNS[1].align}>
        <SizableText size="$bodyMdMedium" color="$text">
          {formatUsd(item.totalPrice)}
        </SizableText>
        {/* Raw on-chain amounts run to 18 decimals; left unformatted they wrap
            onto a third line and knock this column off the row's baseline. */}
        <NumberSizeableText
          size="$bodySm"
          color="$textSubdued"
          formatter="balance"
          formatterOptions={{ tokenSymbol: item.symbol }}
          numberOfLines={1}
        >
          {item.amount}
        </NumberSizeableText>
      </YStack>

      <Stack {...cellProps(COLUMNS[2])} alignItems={COLUMNS[2].align}>
        <PnlCell
          usd={item.pnl?.unrealizedPnlUsd}
          percent={item.pnl?.unrealizedPnlPercent}
        />
      </Stack>

      <Stack {...cellProps(COLUMNS[3])} alignItems={COLUMNS[3].align}>
        <PnlCell
          usd={item.pnl?.totalPnlUsd}
          percent={item.pnl?.totalPnlPercent}
        />
      </Stack>
    </XStack>
  );
}

export function StockPositionTable({
  portfolioData,
  accountAddress,
  tokenLogoUrl,
  networkId,
  isRefreshing,
}: {
  portfolioData: IMarketAccountPortfolioItem[];
  accountAddress?: string;
  tokenLogoUrl?: string;
  networkId?: string;
  isRefreshing?: boolean;
}) {
  // The portfolio endpoint is per (network, token), so every row on this page
  // sits on the routed variant's chain.
  const networkLogoUri = useNetworkLogoUri({ networkId });
  const rows = accountAddress ? portfolioData : [];

  if (rows.length === 0 && accountAddress && isRefreshing) {
    return (
      <Stack py="$10" alignItems="center">
        <Spinner size="large" />
      </Stack>
    );
  }

  if (rows.length === 0) {
    return (
      <Stack py="$10">
        <Empty icon="WalletOutline" title="No position" />
      </Stack>
    );
  }

  return (
    <YStack>
      <XStack
        pb="$2"
        gap="$3"
        borderBottomWidth="$px"
        borderBottomColor="$borderSubdued"
      >
        {COLUMNS.map((column) => (
          <Stack
            key={column.key}
            {...cellProps(column)}
            alignItems={column.align}
          >
            <SizableText size="$bodySm" color="$textSubdued">
              {column.label}
            </SizableText>
          </Stack>
        ))}
      </XStack>

      {rows.map((item) => (
        <PositionRow
          key={`${item.accountAddress}-${item.tokenAddress}`}
          item={item}
          tokenLogoUrl={tokenLogoUrl}
          networkLogoUri={networkLogoUri}
        />
      ))}
    </YStack>
  );
}
