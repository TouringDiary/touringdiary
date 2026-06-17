import { useState, useEffect, useCallback } from 'react';
import type { SuitcasePanelViewMode } from '../types/panelViewMode';

export type { SuitcasePanelViewMode };

export const useFloatingPanelState = (
  initialViewMode: SuitcasePanelViewMode = 'selector',
  defaultTab: 'trip' | 'saved' | 'default' = 'default'
) => {
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<SuitcasePanelViewMode>(initialViewMode);
  const [sourceTab, setSourceTab] = useState<'trip' | 'saved' | 'default'>(defaultTab);
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [highlightItemId, setHighlightItemId] = useState<string | null>(null);
  const [autoOpenNewCategory, setAutoOpenNewCategory] = useState(false);
  const [isNewSuitcaseSession, setIsNewSuitcaseSession] = useState(false);
  const [newSuitcaseId, setNewSuitcaseId] = useState<string | null>(null);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /** Invariante: isNewSuitcaseSession ↔ newSuitcaseId ↔ activeTabId (in editor nuova sessione). */
  const beginNewSuitcaseSession = useCallback((suitcaseId: string) => {
    setIsNewSuitcaseSession(true);
    setNewSuitcaseId(suitcaseId);
    setActiveTabId(suitcaseId);
    setViewMode('editor');
  }, []);

  const clearNewSuitcaseSession = useCallback(() => {
    setIsNewSuitcaseSession(false);
    setNewSuitcaseId(null);
  }, []);

  return {
    activeTabId, setActiveTabId,
    viewMode, setViewMode,
    sourceTab, setSourceTab,
    selectedItemName, setSelectedItemName,
    hoveredItemId, setHoveredItemId,
    highlightItemId, setHighlightItemId,
    autoOpenNewCategory, setAutoOpenNewCategory,
    isNewSuitcaseSession,
    newSuitcaseId,
    beginNewSuitcaseSession,
    clearNewSuitcaseSession,
    isAddingNewCategory, setIsAddingNewCategory,
    isMobile
  };
};
