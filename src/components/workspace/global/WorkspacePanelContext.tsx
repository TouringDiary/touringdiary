import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Workspace } from '@/domain/collaboration';
import type { WorkspaceAttachmentCategory } from '@/domain/collaboration/workspaceAttachment';
import { getWorkspace } from '@/services/collaboration';
import { useUser } from '@/context/UserContext';
import {
  WORKSPACE_OPERATIONAL_SECTIONS,
  WORKSPACE_SECTION_REQUIRES_ACTIVE,
  type WorkspaceActiveRole,
  type WorkspacePanelSection,
} from './globalWorkspacePresentation';

export interface WorkspacePanelStateValue {
  activeSection: WorkspacePanelSection;
  activeWorkspaceId: string | null;
  activeWorkspace: Workspace | null;
  activeWorkspaceRole: WorkspaceActiveRole | null;
  setActiveSection: (section: WorkspacePanelSection) => void;
  /** Selezione utente: imposta attivo + naviga a Condivisione. */
  selectWorkspace: (workspace: Workspace, role: WorkspaceActiveRole) => void;
  /** Deep link / fetch async: imposta attivo senza cambiare sezione. */
  hydrateActiveWorkspace: (workspace: Workspace, role: WorkspaceActiveRole) => void;
  clearActiveWorkspace: () => void;
  navigateToSection: (section: WorkspacePanelSection) => void;
  allegatiCategory: WorkspaceAttachmentCategory;
  setAllegatiCategory: (category: WorkspaceAttachmentCategory) => void;
}

const WorkspacePanelContext = createContext<WorkspacePanelStateValue | null>(null);

export interface WorkspacePanelProviderProps {
  children: ReactNode;
  /** Pannello Workspace visibile: abilita il consumo degli intent di ingresso. */
  isPanelOpen?: boolean;
  initialWorkspaceId?: string;
  initialSection?: WorkspacePanelSection;
}

export const WorkspacePanelProvider: React.FC<WorkspacePanelProviderProps> = ({
  children,
  isPanelOpen = false,
  initialWorkspaceId,
  initialSection,
}) => {
  const { user } = useUser();
  const [activeSection, setActiveSectionState] = useState<WorkspacePanelSection>(
    initialWorkspaceId ? (initialSection ?? 'condivisione') : 'workspace'
  );
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    initialWorkspaceId ?? null
  );
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [activeWorkspaceRole, setActiveWorkspaceRole] = useState<WorkspaceActiveRole | null>(null);
  const [allegatiCategory, setAllegatiCategoryState] = useState<WorkspaceAttachmentCategory>('documents');
  const wasPanelOpenRef = useRef(false);
  /** Workspace a cui è legata la categoria Allegati corrente; null = nessun binding (es. post-clear). */
  const allegatiCategoryWorkspaceIdRef = useRef<string | null>(activeWorkspaceId);

  useEffect(() => {
    if (activeWorkspaceId === allegatiCategoryWorkspaceIdRef.current) return;

    if (activeWorkspaceId !== null) {
      setAllegatiCategoryState('documents');
      allegatiCategoryWorkspaceIdRef.current = activeWorkspaceId;
    } else {
      allegatiCategoryWorkspaceIdRef.current = null;
    }
  }, [activeWorkspaceId]);

  const setAllegatiCategory = useCallback((category: WorkspaceAttachmentCategory) => {
    setAllegatiCategoryState(category);
    allegatiCategoryWorkspaceIdRef.current = activeWorkspaceId;
  }, [activeWorkspaceId]);

  const clearActiveWorkspace = useCallback(() => {
    setActiveWorkspaceId(null);
    setActiveWorkspace(null);
    setActiveWorkspaceRole(null);
    setActiveSectionState('workspace');
  }, []);

  const hydrateActiveWorkspace = useCallback((workspace: Workspace, role: WorkspaceActiveRole) => {
    setActiveWorkspaceId(workspace.id);
    setActiveWorkspace(workspace);
    setActiveWorkspaceRole(role);
  }, []);

  const selectWorkspace = useCallback((workspace: Workspace, role: WorkspaceActiveRole) => {
    hydrateActiveWorkspace(workspace, role);
    setActiveSectionState('condivisione');
  }, [hydrateActiveWorkspace]);

  const navigateToSection = useCallback(
    (section: WorkspacePanelSection) => {
      if (WORKSPACE_SECTION_REQUIRES_ACTIVE[section] && !activeWorkspaceId) {
        setActiveSectionState('workspace');
        return;
      }
      setActiveSectionState(section);
    },
    [activeWorkspaceId]
  );

  const setActiveSection = useCallback(
    (section: WorkspacePanelSection) => {
      navigateToSection(section);
    },
    [navigateToSection]
  );

  // 1. Intent esterni = evento di ingresso al pannello (deep link), non stato di sessione.
  useEffect(() => {
    const isOpening = isPanelOpen && !wasPanelOpenRef.current;
    wasPanelOpenRef.current = isPanelOpen;

    if (!isOpening || !initialWorkspaceId) return;

    setActiveWorkspaceId(initialWorkspaceId);
    setActiveSectionState(initialSection ?? 'condivisione');
  }, [isPanelOpen, initialWorkspaceId, initialSection]);

  // 2. Hydration globale del workspace attivo (persiste anche a pannello chiuso)
  useEffect(() => {
    if (!activeWorkspaceId || activeWorkspace || !user || user.role === 'guest') return;

    const requestedId = activeWorkspaceId;
    let cancelled = false;

    void getWorkspace(requestedId).then((loaded) => {
      if (cancelled || !loaded || loaded.id !== requestedId) return;
      const role = loaded.ownerId === user.id ? 'owner' : 'member';
      hydrateActiveWorkspace(loaded, role);
    });

    return () => {
      cancelled = true;
    };
  }, [activeWorkspaceId, activeWorkspace, user, hydrateActiveWorkspace]);

  const value = useMemo<WorkspacePanelStateValue>(
    () => ({
      activeSection,
      activeWorkspaceId,
      activeWorkspace,
      activeWorkspaceRole,
      setActiveSection,
      selectWorkspace,
      hydrateActiveWorkspace,
      clearActiveWorkspace,
      navigateToSection,
      allegatiCategory,
      setAllegatiCategory,
    }),
    [
      activeSection,
      activeWorkspaceId,
      activeWorkspace,
      activeWorkspaceRole,
      setActiveSection,
      selectWorkspace,
      hydrateActiveWorkspace,
      clearActiveWorkspace,
      navigateToSection,
      allegatiCategory,
    ]
  );

  return (
    <WorkspacePanelContext.Provider value={value}>{children}</WorkspacePanelContext.Provider>
  );
};

export function useWorkspacePanelState(): WorkspacePanelStateValue {
  const ctx = useContext(WorkspacePanelContext);
  if (!ctx) {
    throw new Error('useWorkspacePanelState must be used within WorkspacePanelProvider');
  }
  return ctx;
}

export { WORKSPACE_OPERATIONAL_SECTIONS };
