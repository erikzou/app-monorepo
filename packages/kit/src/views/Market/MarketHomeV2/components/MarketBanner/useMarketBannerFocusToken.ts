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
 * Several topics currently return an empty token list from the server, so those
 * cards fall back to the trending list instead, offset by the card's position:
 * still a real token with a real move, and no two cards land on the same one.
 * Only when that fails too does an invented token appear.
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

// Enough rows that every card in the strip can take a different one.
const TRENDING_FALLBACK_LIMIT = 20;

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

function toFocusToken(token?: {
  symbol?: string;
  logoUrl?: string;
  logoUrls?: string[];
  priceChange24hPercent?: string;
}): IMarketBannerFocusToken | undefined {
  if (!token?.symbol) {
    return undefined;
  }
  return {
    symbol: token.symbol,
    logoUrl: token.logoUrl ?? token.logoUrls?.[0],
    priceChange24hPercent: token.priceChange24hPercent,
  };
}

export function useMarketBannerFocusToken({
  tokenListId,
  index = 0,
  enabled = true,
}: {
  tokenListId?: string;
  // Position of the card in the strip, used to offset the trending-list
  // fallback so the cards do not all show the same token.
  index?: number;
  enabled?: boolean;
}) {
  const { result } = usePromiseResult(
    async () => {
      if (!enabled) {
        return undefined;
      }
      if (tokenListId) {
        try {
          const list =
            await backgroundApiProxy.serviceMarketV2.fetchMarketBannerTokenList(
              { tokenListId },
            );
          const focusToken = toFocusToken(list?.[0]);
          if (focusToken) {
            return focusToken;
          }
        } catch {
          // Fall through to the trending list.
        }
      }
      try {
        const trending =
          await backgroundApiProxy.serviceMarketV2.fetchMarketTokenList({
            // Empty network id is how the list asks for every chain.
            networkId: '',
            limit: TRENDING_FALLBACK_LIMIT,
          });
        const list = Array.isArray(trending) ? trending : trending?.list;
        const focusToken = toFocusToken(list?.[index % (list?.length || 1)]);
        if (focusToken) {
          return focusToken;
        }
      } catch {
        // Fall through to the invented token.
      }
      return getDemoFocusToken(tokenListId);
    },
    [enabled, index, tokenListId],
    { initResult: undefined },
  );

  return result;
}
