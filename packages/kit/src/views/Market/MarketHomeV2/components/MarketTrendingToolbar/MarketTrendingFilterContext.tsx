import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import type {
  IMarketFilterConditions,
  IMarketListSortState,
  IMarketTrendingFilterContextValue,
} from './marketTrendingFilterTypes';

const EMPTY_CONDITIONS: IMarketFilterConditions = {};
const EMPTY_SORT: IMarketListSortState = {};

const EMPTY_CONTEXT: IMarketTrendingFilterContextValue = {
  conditions: EMPTY_CONDITIONS,
  sortState: EMPTY_SORT,
  applyConditions: () => undefined,
  setSortState: () => undefined,
  activeConditionCount: 0,
};

const MarketTrendingFilterContext =
  createContext<IMarketTrendingFilterContextValue>(EMPTY_CONTEXT);

/**
 * The single source of truth for "how you want to see this table". The
 * shortcut buttons, the Filters dialog's tier selection, the applied-count
 * badge and the table's sort all read off this one state, so none of them can
 * drift apart.
 */
export function MarketTrendingFilterProvider({ children }: PropsWithChildren) {
  const [conditions, setConditions] =
    useState<IMarketFilterConditions>(EMPTY_CONDITIONS);
  const [sortState, setSortState] = useState<IMarketListSortState>(EMPTY_SORT);

  const applyConditions = useCallback(
    (
      next: IMarketFilterConditions,
      options?: { sort?: IMarketListSortState },
    ) => {
      setConditions(next);
      // Changing the filtered slice invalidates the ordering computed over the
      // previous one, so sort resets — unless the caller applies both at once
      // (a shortcut that carries its own sort).
      setSortState(options?.sort ?? EMPTY_SORT);
    },
    [],
  );

  const value = useMemo<IMarketTrendingFilterContextValue>(
    () => ({
      conditions,
      sortState,
      applyConditions,
      setSortState,
      activeConditionCount: Object.keys(conditions).length,
    }),
    [conditions, sortState, applyConditions],
  );

  return (
    <MarketTrendingFilterContext.Provider value={value}>
      {children}
    </MarketTrendingFilterContext.Provider>
  );
}

export function useMarketTrendingFilter() {
  return useContext(MarketTrendingFilterContext);
}
