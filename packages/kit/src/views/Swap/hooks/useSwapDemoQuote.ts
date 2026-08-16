import { useEffect } from 'react';

import BigNumber from 'bignumber.js';

import type { IFetchQuoteResult } from '@onekeyhq/shared/types/swap/types';
import {
  useSwapFromTokenAmountAtom,
  useSwapQuoteCurrentEventProviderKeysAtom,
  useSwapQuoteEventCompletedAtom,
  useSwapQuoteEventTotalCountAtom,
  useSwapQuoteFetchingAtom,
  useSwapQuoteListAtom,
  useSwapSelectFromTokenAtom,
  useSwapSelectToTokenAtom,
} from '../../../states/jotai/contexts/swap';
import { buildSwapQuoteProviderKey } from '../../../states/jotai/contexts/swap/quoteProgress';

/**
 * DEMO ONLY. The market detail pages embed the Swap card so a reviewer can walk
 * the real flow, but the demo environment has no provider behind it — the quote
 * stream comes back empty and the card stops at "Failed to fetch the quote",
 * which is where the walkthrough ends.
 *
 * This fills that gap at the quote layer rather than at the button: a synthetic
 * quote is written into the same atom a real one would land in, so the amount
 * out, the rate, the Review button and the confirmation dialog all read one set
 * of numbers instead of each inventing its own.
 *
 * The numbers are derived from the two tokens' own prices, so they are wrong
 * only in the way a stale quote is wrong — the shape, the units and the
 * decimals are real.
 *
 * Delete this hook and its `demoQuote` prop once the demo talks to a provider.
 */

const DEMO_PROVIDER = {
  provider: 'onekey-demo',
  providerName: 'OneKey Demo',
};

// The demo owns one event stream, so its id is constant.
const DEMO_EVENT_ID = 'onekey-demo-quote-event';

// A plausible spread so the rate does not read as a perfect mid-market price.
const DEMO_SPREAD = 0.003;

export function useSwapDemoQuote(enabled?: boolean) {
  const [fromToken] = useSwapSelectFromTokenAtom();
  const [toToken] = useSwapSelectToTokenAtom();
  const [fromTokenAmount] = useSwapFromTokenAmountAtom();
  const [quoteList, setQuoteList] = useSwapQuoteListAtom();
  const [quoteFetching] = useSwapQuoteFetchingAtom();
  const [, setQuoteEventTotalCount] = useSwapQuoteEventTotalCountAtom();
  const [, setQuoteEventCompleted] = useSwapQuoteEventCompletedAtom();
  const [, setCurrentEventProviderKeys] =
    useSwapQuoteCurrentEventProviderKeysAtom();

  useEffect(() => {
    if (!enabled || quoteFetching) {
      return;
    }
    const amountBN = new BigNumber(fromTokenAmount?.value ?? '');
    if (!fromToken || !toToken || !amountBN.isFinite() || amountBN.lte(0)) {
      return;
    }
    // A real quote arrived, or a previous demo quote already covers this input.
    const existing = quoteList[0];
    if (existing && existing.info.provider !== DEMO_PROVIDER.provider) {
      return;
    }
    if (existing?.fromAmount === amountBN.toFixed()) {
      return;
    }
    const fromPrice = new BigNumber(fromToken.price ?? '');
    const toPrice = new BigNumber(toToken.price ?? '');
    if (
      !fromPrice.isFinite() ||
      !toPrice.isFinite() ||
      fromPrice.lte(0) ||
      toPrice.lte(0)
    ) {
      return;
    }
    const rate = fromPrice.dividedBy(toPrice).multipliedBy(1 - DEMO_SPREAD);
    const toAmount = amountBN.multipliedBy(rate);
    const demoQuote: IFetchQuoteResult = {
      quoteId: `demo-${fromToken.networkId}-${toToken.networkId}`,
      eventId: DEMO_EVENT_ID,
      info: DEMO_PROVIDER,
      fromAmount: amountBN.toFixed(),
      toAmount: toAmount.toFixed(toToken.decimals ?? 6),
      // Slippage is not modelled; the minimum received simply trails the quote.
      minToAmount: toAmount.multipliedBy(0.995).toFixed(toToken.decimals ?? 6),
      instantRate: rate.toFixed(),
      estimatedTime: '30',
      isBest: true,
      fromTokenInfo: fromToken,
      toTokenInfo: toToken,
    };
    // The card only treats a quote as usable once the event stream says it is
    // done, so the demo has to close the stream as well as fill it.
    setQuoteEventTotalCount({
      count: 1,
      totalQuoteCountReceived: true,
      eventId: demoQuote.eventId,
    });
    // The card reads the quote through the current event's provider list, so
    // the demo provider has to be announced there too or its quote is filtered
    // straight back out.
    setCurrentEventProviderKeys([buildSwapQuoteProviderKey(demoQuote)]);
    setQuoteList([demoQuote]);
    setQuoteEventCompleted(true);
  }, [
    enabled,
    fromToken,
    fromTokenAmount?.value,
    quoteFetching,
    quoteList,
    setCurrentEventProviderKeys,
    setQuoteEventCompleted,
    setQuoteEventTotalCount,
    setQuoteList,
    toToken,
  ]);
}
