/**
 * Morphologia Workspace «da Viaggio» (DOC 28 Parte A · DOC 37).
 * Persistita in `workspaces.settings` — non altera lo schema fondazione.
 */
import type { SharedResourceKind } from './sharedResource';
import type { ViaggioFolderSectionId } from '../../myspace/viaggioFolderSections';
import { VIAGGIO_FOLDER_SECTION_IDS } from '../../myspace/viaggioFolderSections';

export const WORKSPACE_MORPHOLOGY_VIAGGIO_SHELL = 'viaggio_shell' as const;

export type WorkspaceMorphologyViaggioShell = typeof WORKSPACE_MORPHOLOGY_VIAGGIO_SHELL;

export interface WorkspaceViaggioShellSettings {
  morphology: WorkspaceMorphologyViaggioShell;
  sourceViaggioId: string;
  /** Sezioni DOC 37 con almeno una risorsa copiata collegata al WS. */
  populatedSections: ViaggioFolderSectionId[];
}

function isViaggioFolderSectionId(value: unknown): value is ViaggioFolderSectionId {
  if (typeof value !== 'string') return false;
  for (const sectionId of VIAGGIO_FOLDER_SECTION_IDS) {
    if (sectionId === value) return true;
  }
  return false;
}

export function isWorkspaceViaggioShellSettings(
  value: unknown,
): value is WorkspaceViaggioShellSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (
    !('morphology' in value) ||
    !('sourceViaggioId' in value) ||
    !('populatedSections' in value)
  ) {
    return false;
  }

  if (value.morphology !== WORKSPACE_MORPHOLOGY_VIAGGIO_SHELL) return false;
  if (typeof value.sourceViaggioId !== 'string' || !value.sourceViaggioId.trim()) {
    return false;
  }
  if (!Array.isArray(value.populatedSections)) return false;
  return value.populatedSections.every(isViaggioFolderSectionId);
}

/**
 * Serializza la morphologia tipizzata nel bag `workspaces.settings`
 * (`Record<string, unknown>`) senza cast: costruisce campi noti uno a uno.
 */
export function toWorkspaceSettingsBagViaggioShell(
  shell: WorkspaceViaggioShellSettings,
): Record<string, unknown> {
  const settings: Record<string, unknown> = {};
  settings.morphology = shell.morphology;
  settings.sourceViaggioId = shell.sourceViaggioId;
  settings.populatedSections = shell.populatedSections.slice();
  return settings;
}

/** Legge la morphologia viaggio_shell da `workspace.settings`, se presente. */
export function readWorkspaceViaggioShellSettings(
  settings: unknown,
): WorkspaceViaggioShellSettings | null {
  return isWorkspaceViaggioShellSettings(settings) ? settings : null;
}

/** Sezioni DOC 37 popolabili da kind shareable nello STEP-4 (Diario / Valigia). */
export function sectionIdForSharedResourceKind(
  kind: SharedResourceKind,
): ViaggioFolderSectionId | null {
  if (kind === 'diary') return 'diario';
  if (kind === 'suitcase') return 'valigia';
  return null;
}

export function resolvePopulatedSectionsFromResources(
  resources: Array<{ kind: SharedResourceKind }>,
): ViaggioFolderSectionId[] {
  const populated = new Set<ViaggioFolderSectionId>();
  for (const resource of resources) {
    const section = sectionIdForSharedResourceKind(resource.kind);
    if (section) populated.add(section);
  }
  return VIAGGIO_FOLDER_SECTION_IDS.filter((id) => populated.has(id));
}

export function buildWorkspaceViaggioShellSettings(input: {
  sourceViaggioId: string;
  resources: Array<{ kind: SharedResourceKind }>;
}): WorkspaceViaggioShellSettings {
  return {
    morphology: WORKSPACE_MORPHOLOGY_VIAGGIO_SHELL,
    sourceViaggioId: input.sourceViaggioId.trim(),
    populatedSections: resolvePopulatedSectionsFromResources(input.resources),
  };
}
