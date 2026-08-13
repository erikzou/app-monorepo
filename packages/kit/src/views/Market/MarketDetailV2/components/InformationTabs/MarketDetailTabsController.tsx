import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';

import type { ITabContainerRef } from '@onekeyhq/components';

type IMarketDetailTabsController = {
  /** Called by the tab container once it mounts. */
  registerTabs: (ref: ITabContainerRef | null, positionTabName: string) => void;
  /** Called by the tabs section wrapper so a jump can scroll it into view. */
  registerSection: (node: unknown) => void;
  /** Opens the My position tab and brings the tab strip into view. */
  jumpToPositionTab: () => void;
  /** Whether a tab container has registered — the entry point hides until then. */
  hasPositionTab: () => boolean;
};

const NOOP_CONTROLLER: IMarketDetailTabsController = {
  registerTabs: () => undefined,
  registerSection: () => undefined,
  jumpToPositionTab: () => undefined,
  hasPositionTab: () => false,
};

const MarketDetailTabsContext =
  createContext<IMarketDetailTabsController>(NOOP_CONTROLLER);

/**
 * Lets a block in the right column drive the main column's tabs — the position
 * summary's chevron opens My position (Figma 25671:53646). The two are
 * siblings, so the handle lives above both rather than being threaded through
 * the layout as props.
 *
 * Everything is held in refs: registering a tab container must not re-render
 * the trade panel next to it.
 */
export function MarketDetailTabsProvider({ children }: PropsWithChildren) {
  const tabsRef = useRef<ITabContainerRef | null>(null);
  const positionTabNameRef = useRef<string>('');
  const sectionRef = useRef<unknown>(null);

  const registerTabs = useCallback(
    (ref: ITabContainerRef | null, positionTabName: string) => {
      tabsRef.current = ref;
      positionTabNameRef.current = positionTabName;
    },
    [],
  );

  const registerSection = useCallback((node: unknown) => {
    sectionRef.current = node;
  }, []);

  const jumpToPositionTab = useCallback(() => {
    if (!tabsRef.current || !positionTabNameRef.current) {
      return;
    }
    tabsRef.current.jumpToTab(positionTabNameRef.current);
    const node = sectionRef.current as
      | { scrollIntoView?: (options: unknown) => void }
      | undefined;
    node?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, []);

  const hasPositionTab = useCallback(
    () => Boolean(tabsRef.current && positionTabNameRef.current),
    [],
  );

  const value = useMemo<IMarketDetailTabsController>(
    () => ({
      registerTabs,
      registerSection,
      jumpToPositionTab,
      hasPositionTab,
    }),
    [hasPositionTab, jumpToPositionTab, registerSection, registerTabs],
  );

  return (
    <MarketDetailTabsContext.Provider value={value}>
      {children}
    </MarketDetailTabsContext.Provider>
  );
}

export function useMarketDetailTabsController() {
  return useContext(MarketDetailTabsContext);
}
