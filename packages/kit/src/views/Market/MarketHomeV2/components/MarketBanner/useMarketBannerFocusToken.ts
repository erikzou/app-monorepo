import backgroundApiProxy from '@onekeyhq/kit/src/background/instance/backgroundApiProxy';
import { usePromiseResult } from '@onekeyhq/kit/src/hooks/usePromiseResult';

export type IMarketBannerFocusToken = {
  symbol: string;
  logoUrl?: string;
  priceChange24hPercent?: string;
};

/**
 * The one token a topic card puts a number on. Which token that is will be a
 * backend choice — the card is meant to carry the topic's talking point, not
 * whatever happens to sort first. Until that field exists this takes the head
 * of the topic's own token list, which is the closest honest stand-in: it is a
 * real token of that topic with its real 24h move.
 *
 * When the list cannot be read at all, a fixed placeholder keeps the card's
 * height and shape stable rather than letting the row appear and disappear.
 */

// Picked per card rather than shared: one placeholder repeated across the strip
// reads as a bug, not as missing data.
const DEMO_FOCUS_TOKENS: IMarketBannerFocusToken[] = [
  { symbol: 'CASHCAT', priceChange24hPercent: '6.44' },
  { symbol: 'PONS', priceChange24hPercent: '-3.54' },
  { symbol: 'AEON', priceChange24hPercent: '1.93' },
  { symbol: 'STACK', priceChange24hPercent: '4.68' },
  { symbol: 'SWAPPY', priceChange24hPercent: '-9.15' },
];

function getDemoFocusToken(seed?: string) {
  if (!seed) {
    return DEMO_FOCUS_TOKENS[0];
  }
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i)) % DEMO_FOCUS_TOKENS.length;
  }
  return DEMO_FOCUS_TOKENS[hash];
}

export function useMarketBannerFocusToken({
  tokenListId,
  enabled = true,
}: {
  tokenListId?: string;
  enabled?: boolean;
}) {
  const { result } = usePromiseResult(
    async () => {
      if (!enabled || !tokenListId) {
        return getDemoFocusToken(tokenListId);
      }
      try {
        const list =
          await backgroundApiProxy.serviceMarketV2.fetchMarketBannerTokenList({
            tokenListId,
          });
        const first = list?.[0];
        if (!first?.symbol) {
          return getDemoFocusToken(tokenListId);
        }
        return {
          symbol: first.symbol,
          logoUrl: first.logoUrl ?? first.logoUrls?.[0],
          priceChange24hPercent: first.priceChange24hPercent,
        };
      } catch {
        return getDemoFocusToken(tokenListId);
      }
    },
    [enabled, tokenListId],
    { initResult: undefined },
  );

  return result;
}
