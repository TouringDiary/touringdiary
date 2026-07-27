import type { CollaborativeMemberRole, ResourceInvite, SharingMode } from '@/domain/collaboration';
import type {
  SharedResourceKind,
  WorkspaceResourceAccess,
  WorkspaceResourcePermissionEntry,
} from '@/domain/collaboration';
import { getSharedResourceKindLabel, workspaceResourceKey } from '@/domain/collaboration';
import type { WorkspaceCompositionBlueprint } from '@/domain/collaboration/workspaceComposition';

export type SharePath = 'simple' | 'create_workspace' | 'add_workspace';
/** Unico intent prodotto (DOC 28 Parte A): sempre copia con nuovo ID. */
export type ShareIntent = 'duplicate_and_share';

/** Contesto di apertura del wizard collaborativo (stesso modale, flussi distinti). */
export type WizardEntryMode =
  | 'share'
  | 'create_workspace'
  | 'add_element_to_workspace'
  | 'workspace_from_viaggio';

/**
 * Entry mode che aprono il flusso «crea Workspace»
 * (`create_workspace` hub + `workspace_from_viaggio` MySpace — DOC 28 Parte A / STEP-4).
 */
export function isWorkspaceCreationEntryMode(
  entryMode: WizardEntryMode,
): entryMode is 'create_workspace' | 'workspace_from_viaggio' {
  return entryMode === 'create_workspace' || entryMode === 'workspace_from_viaggio';
}

/** Livello di accesso predefinito per nuovi elementi negli inviti workspace (DOM-I-03). */
export const DEFAULT_WORKSPACE_INVITE_ELEMENT_ACCESS: WorkspaceResourceAccess = 'none';

/**
 * Parametri per `getWizardSteps`.
 * Union discriminata: ogni `entryMode` espone solo i campi che influenzano lo step graph.
 */
export type GetWizardStepsParams =
  | {
      entryMode: 'create_workspace' | 'workspace_from_viaggio';
    }
  | {
      entryMode: 'add_element_to_workspace';
    }
  | {
      entryMode: 'share';
      sharePath: SharePath;
      sharingMode: SharingMode;
    };

export type WizardStep =
  | 'path'
  | 'mode'
  | 'share_intent'
  | 'invite'
  | 'workspace_setup'
  | 'workspace_composition'
  | 'workspace_select'
  | 'workspace_invite'
  | 'pick_element';
export type ModalView = 'wizard' | 'management';

export const ROLE_LABELS: Record<CollaborativeMemberRole, string> = {
  collaborator: 'Collaboratore',
  viewer: 'Visualizzatore',
};

export const MODE_LABELS: Record<SharingMode, string> = {
  collaborative: 'Collaborativa',
  personal: 'Personale',
};

export const INVITE_STATUS_LABELS: Record<ResourceInvite['status'], string> = {
  pending: 'In attesa',
  accepted: 'Accettato',
  rejected: 'Rifiutato',
  revoked: 'Revocato',
};

export interface PendingInvite {
  userId: string;
  name: string;
  slug?: string;
  role: CollaborativeMemberRole;
}

export interface WorkspacePendingInvite {
  userId: string;
  name: string;
  slug?: string;
  permissions: WorkspaceResourcePermissionEntry[];
}

export function getWizardStepTitle(
  wizardStep: WizardStep,
  options?: { sharePath?: SharePath; entryMode?: WizardEntryMode }
): string {
  const entryMode = options?.entryMode;

  if (wizardStep === 'path') return 'Come vuoi condividere?';
  if (wizardStep === 'mode') return 'Scegli la modalità';
  if (wizardStep === 'share_intent') return 'Elemento condiviso';
  if (wizardStep === 'invite') return 'Invita collaboratori';
  if (wizardStep === 'workspace_setup') return 'Configura il Workspace';
  if (wizardStep === 'workspace_composition') {
    if (entryMode && isWorkspaceCreationEntryMode(entryMode)) {
      return 'COMPOSIZIONE';
    }
    return 'Composizione risorse';
  }
  if (wizardStep === 'workspace_select') return 'Scegli un Workspace';
  if (wizardStep === 'workspace_invite') return 'Invita al Workspace';
  if (wizardStep === 'pick_element') return 'Scegli un elemento';
  return 'Workspace';
}

/** Etichette brevi per lo step indicator. */
export function getWizardStepShortLabel(step: WizardStep, entryMode?: WizardEntryMode): string {
  switch (step) {
    case 'path': return 'Percorso';
    case 'mode': return 'Modalità';
    case 'share_intent': return 'Dettagli';
    case 'invite': return 'Inviti';
    case 'workspace_setup': return 'Setup';
    case 'workspace_composition':
      return entryMode && isWorkspaceCreationEntryMode(entryMode) ? 'CONDIVISIONE' : 'Risorse';
    case 'workspace_select': return 'Workspace';
    case 'workspace_invite': return 'Inviti';
    case 'pick_element': return 'Elemento';
    default: return '';
  }
}

export function buildDefaultWorkspaceInvitePermissions(
  composition: Array<{ kind: SharedResourceKind; resourceId: string }>
): WorkspaceResourcePermissionEntry[] {
  return composition.map((resource) => ({
    kind: resource.kind,
    resourceId: resource.resourceId,
    accessLevel: DEFAULT_WORKSPACE_INVITE_ELEMENT_ACCESS,
  }));
}

/** Risincronizza permessi inviti pendenti dopo modifica composizione (DOM-I-05). */
export function syncWorkspacePendingInvitePermissions(
  invites: WorkspacePendingInvite[],
  composition: Array<{ kind: SharedResourceKind; resourceId: string }>
): WorkspacePendingInvite[] {
  const compositionKeys = new Set(
    composition.map((resource) => workspaceResourceKey(resource.kind, resource.resourceId))
  );

  return invites.map((invite) => {
    const preserved = new Map<string, WorkspaceResourceAccess>();
    for (const permission of invite.permissions) {
      const key = workspaceResourceKey(permission.kind, permission.resourceId);
      if (compositionKeys.has(key)) {
        preserved.set(key, permission.accessLevel);
      }
    }

    return {
      ...invite,
      permissions: composition.map((resource) => {
        const key = workspaceResourceKey(resource.kind, resource.resourceId);
        return {
          kind: resource.kind,
          resourceId: resource.resourceId,
          accessLevel: preserved.get(key) ?? DEFAULT_WORKSPACE_INVITE_ELEMENT_ACCESS,
        };
      }),
    };
  });
}

export function resolveCompositionResourceTitles(
  blueprint: WorkspaceCompositionBlueprint,
  composition: Array<{ kind: SharedResourceKind; resourceId: string }>
): Array<{ kind: SharedResourceKind; resourceId: string; title: string }> {
  return composition.map((resource) => {
    const candidates =
      resource.kind === 'diary'
        ? blueprint.diary.candidates
        : resource.kind === 'suitcase'
          ? blueprint.suitcases.candidates
          : blueprint.userTemplates.candidates;
    const candidate = candidates.find((entry) => entry.resourceId === resource.resourceId);

    return {
      kind: resource.kind,
      resourceId: resource.resourceId,
      title: candidate?.title ?? getSharedResourceKindLabel(resource.kind),
    };
  });
}

export function mapWorkspaceInvitePermissionsToMaterialized(
  permissions: WorkspaceResourcePermissionEntry[],
  originals: Array<{ kind: SharedResourceKind; resourceId: string }>,
  materialized: Array<{ kind: SharedResourceKind; resourceId: string }>
): WorkspaceResourcePermissionEntry[] {
  const materializedIdByKey = new Map<string, string>();
  for (let index = 0; index < originals.length; index += 1) {
    const original = originals[index];
    const next = materialized[index];
    if (!original || !next) continue;
    materializedIdByKey.set(
      workspaceResourceKey(original.kind, original.resourceId),
      next.resourceId
    );
  }

  return permissions
    .map((permission) => {
      const key = workspaceResourceKey(permission.kind, permission.resourceId);
      const materializedId = materializedIdByKey.get(key);
      if (!materializedId) return null;
      return {
        kind: permission.kind,
        resourceId: materializedId,
        accessLevel: permission.accessLevel,
      };
    })
    .filter((permission): permission is WorkspaceResourcePermissionEntry => permission !== null);
}

/**
 * Step effettivi del wizard in base al contesto di apertura.
 * Unica fonte di verità per indicator, Indietro e Avanti.
 * Nessuno step share_intent: copy-only automatico (DOC 28 Parte A).
 */
export function getWizardSteps(params: GetWizardStepsParams): WizardStep[] {
  if (isWorkspaceCreationEntryMode(params.entryMode)) {
    return ['workspace_setup', 'workspace_composition', 'workspace_invite'];
  }

  if (params.entryMode === 'add_element_to_workspace') {
    return ['pick_element'];
  }

  if (params.entryMode !== 'share') {
    return [];
  }

  const { sharePath, sharingMode } = params;

  if (sharePath === 'add_workspace') {
    return ['path', 'workspace_select'];
  }
  if (sharePath === 'create_workspace') {
    return ['path', 'workspace_setup', 'workspace_composition', 'workspace_invite'];
  }
  // simple — collaborative e personal: niente share_intent (sempre copia)
  void sharingMode;
  return ['path', 'mode', 'invite'];
}

export interface ResolveWizardStepsForContextInput {
  entryMode: WizardEntryMode;
  sharePath: SharePath;
  sharingMode: SharingMode;
}

/** Risolve i parametri `getWizardSteps` in base al contesto di apertura del wizard. */
export function resolveWizardStepsForContext(
  input: ResolveWizardStepsForContextInput
): WizardStep[] {
  if (isWorkspaceCreationEntryMode(input.entryMode)) {
    return getWizardSteps({ entryMode: input.entryMode });
  }
  if (input.entryMode === 'add_element_to_workspace') {
    return getWizardSteps({ entryMode: 'add_element_to_workspace' });
  }
  return getWizardSteps({
    entryMode: 'share',
    sharePath: input.sharePath,
    sharingMode: input.sharingMode,
  });
}

export function resolveWizardStepIndex(steps: WizardStep[], currentStep: WizardStep): number {
  return steps.indexOf(currentStep);
}

export function resolveWizardPreviousStep(
  steps: WizardStep[],
  currentStep: WizardStep,
): WizardStep | null {
  const index = resolveWizardStepIndex(steps, currentStep);
  if (index <= 0) return null;
  return steps[index - 1] ?? null;
}

export function resolveWizardNextStep(
  steps: WizardStep[],
  currentStep: WizardStep,
): WizardStep | null {
  const index = resolveWizardStepIndex(steps, currentStep);
  if (index < 0 || index >= steps.length - 1) return null;
  return steps[index + 1] ?? null;
}
