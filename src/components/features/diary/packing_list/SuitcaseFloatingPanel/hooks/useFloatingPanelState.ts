import { useState, useEffect } from 'react';

export const useFloatingPanelState = (
  initialViewMode: 'selector' | 'editor' = 'selector',
  defaultTab: 'trip' | 'saved' | 'default' = 'default'
) => {
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'selector' | 'editor'>(initialViewMode);
  const [sourceTab, setSourceTab] = useState<'trip' | 'saved' | 'default'>(defaultTab);
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [highlightItemId, setHighlightItemId] = useState<string | null>(null);
  const [autoOpenNewCategory, setAutoOpenNewCategory] = useState(false);
  const [isNewSuitcaseSession, setIsNewSuitcaseSession] = useState(false);
  const [newSuitcaseId, setNewSuitcaseId] = useState<string | null>(null);
  
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    activeTabId, setActiveTabId,
    viewMode, setViewMode,
    sourceTab, setSourceTab,
    selectedItemName, setSelectedItemName,
    hoveredItemId, setHoveredItemId,
    highlightItemId, setHighlightItemId,
    autoOpenNewCategory, setAutoOpenNewCategory,
    isNewSuitcaseSession, setIsNewSuitcaseSession,
    newSuitcaseId, setNewSuitcaseId,
    isMobile
  };
};
