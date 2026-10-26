import { useState, useCallback } from 'react';
import { MainViewId } from '../types/navigation';
import { TabId } from '../types/dock';

interface UseAppNavigationOptions {
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  activeMainView: MainViewId;
  setActiveMainView: (view: MainViewId) => void;
  activeBottomTab: TabId;
  setActiveBottomTab: (tab: TabId) => void;
  setIsBottomOpen: (open: boolean) => void;
  setActiveChapterId: (id: string) => void;
  setActiveSearchTerm: (term: string | null) => void;
  persistViewFilters: boolean;
  setTimelineFilters: React.Dispatch<React.SetStateAction<{ storyline: string; character: string }>>;
  handleOpenSearchTab: () => void;
}

export function useAppNavigation({
  isDirty,
  setIsDirty,
  activeMainView,
  setActiveMainView,
  activeBottomTab,
  setActiveBottomTab,
  setIsBottomOpen,
  setActiveChapterId,
  setActiveSearchTerm,
  persistViewFilters,
  setTimelineFilters,
  handleOpenSearchTab,
}: UseAppNavigationOptions) {
  const [pendingNavigationAction, setPendingNavigationAction] = useState<(() => void) | null>(null);

  const handleSelectMainView = useCallback(
    (view: MainViewId) => {
      if (view === 'search') {
        handleOpenSearchTab();
        return;
      }
      if (isDirty && view !== activeMainView) {
        setPendingNavigationAction(() => () => {
          if (!persistViewFilters) {
            setTimelineFilters({ storyline: 'all', character: 'all' });
          }
          setActiveMainView(view);
        });
        return;
      }
      if (!persistViewFilters) {
        setTimelineFilters({ storyline: 'all', character: 'all' });
      }
      setActiveMainView(view);
    },
    [isDirty, activeMainView, persistViewFilters, handleOpenSearchTab, setTimelineFilters, setActiveMainView]
  );

  const handleSelectSearchResult = useCallback(
    (sceneId: string, searchTerm: string) => {
      setActiveMainView('write');
      setActiveChapterId(sceneId);
      setActiveSearchTerm(searchTerm);
    },
    [setActiveMainView, setActiveChapterId, setActiveSearchTerm]
  );

  const handleOpenTimelineBottom = useCallback(() => {
    setActiveBottomTab('timeline');
    setIsBottomOpen(true);
  }, [setActiveBottomTab, setIsBottomOpen]);

  const handleOpenRelationshipsBottom = useCallback(() => {
    setActiveBottomTab('relationships');
    setIsBottomOpen(true);
  }, [setActiveBottomTab, setIsBottomOpen]);

  const handleMaximizeBottom = useCallback(() => {
    setActiveMainView(activeBottomTab as MainViewId);
  }, [activeBottomTab, setActiveMainView]);

  const handleCancelPendingNavigation = useCallback(() => {
    setPendingNavigationAction(null);
  }, []);

  const handleConfirmPendingNavigation = useCallback(() => {
    const action = pendingNavigationAction;
    setPendingNavigationAction(null);
    setIsDirty(false);
    action?.();
  }, [pendingNavigationAction, setIsDirty]);

  return {
    pendingNavigationAction,
    setPendingNavigationAction,
    handleSelectMainView,
    handleSelectSearchResult,
    handleOpenTimelineBottom,
    handleOpenRelationshipsBottom,
    handleMaximizeBottom,
    handleCancelPendingNavigation,
    handleConfirmPendingNavigation,
  };
}
