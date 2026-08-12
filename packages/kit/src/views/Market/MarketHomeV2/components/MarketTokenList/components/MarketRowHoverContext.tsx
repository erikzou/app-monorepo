import { createContext, useContext } from 'react';

/**
 * Which row the pointer is on, so a cell can react to a hover anywhere on its
 * row (the stock list swaps the company name for what the row collapses —
 * Figma 25463:83146).
 *
 * A context rather than Tamagui's `group`: the shared Table renders its rows
 * through a memoised component that drops the group prop, and a context update
 * only re-renders the cells that read it instead of the whole list.
 */
export const MarketRowHoverContext = createContext<string | null>(null);

export function useIsMarketRowHovered(rowId: string | undefined) {
  const hoveredRowId = useContext(MarketRowHoverContext);
  return Boolean(rowId) && hoveredRowId === rowId;
}
