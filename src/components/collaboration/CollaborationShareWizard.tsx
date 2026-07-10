import React from 'react';
import { Copy, FolderPlus, Layers, Share2, UserPlus, Users, AlertTriangle } from 'lucide-react';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import type { CollaborativeMemberRole, SharingMode, Workspace } from '@/domain/collaboration';
import { COLLABORATIVE_MEMBER_ROLES } from '@/domain/collaboration';
import type { CollaborationUserSearchResult } from '@/domain/collaboration';
import type {
  WorkspaceCompositionBlueprint,
  WorkspaceCompositionDraft,
} from '@/domain/collaboration/workspaceComposition';
import { OptionCard } from './OptionCard';
import {
  MODE_LABELS,
  ROLE_LABELS,
  getWizardStepTitle,
  type PendingInvite,
  type ShareIntent,
  type SharePath,
  type WizardStep,
  type WorkspacePendingInvite,
} from './collaborationSharePresentation';
import {
  WorkspaceCompositionStep,
  WorkspaceInviteSearch,
  WorkspaceInviteStep,
  WorkspaceSelectStep,
  WorkspaceSetupStep,
} from './WorkspaceShareWizardSteps';
import { WORKSPACE_ACCESS_LABELS } from './workspace/workspacePresentation';
import { CollaborationUserInviteSearch } from './CollaborationUserInviteSearch';

export interface CollaborationShareWizardProps {
  wizardStep: WizardStep;
  sharePath: SharePath;
  sharingMode: SharingMode;
  shareIntent: ShareIntent;
  selectedRole: CollaborativeMemberRole;
  searchQuery: string;
  searchResults: CollaborationUserSearchResult[];
  isSearching: boolean;
  pendingInvites: PendingInvite[];
  workspaceName: string;
  workspaceDescription: string;
  compositionBlueprint: WorkspaceCompositionBlueprint | null;
  compositionDraft: WorkspaceCompositionDraft | null;
  isExpandingCompositionDiary?: boolean;
  userWorkspaces: Workspace[];
  selectedWorkspaceId: string | null;
  workspacePendingInvites: WorkspacePendingInvite[];
  workspaceDefaultAccess: 'collaborator';
  isSubmitting?: boolean;
  onSharePathChange: (path: SharePath) => void;
  onSharingModeChange: (mode: SharingMode) => void;
  onShareIntentChange: (intent: ShareIntent) => void;
  onSelectedRoleChange: (role: CollaborativeMemberRole) => void;
  onSearchQueryChange: (query: string) => void;
  onAddPendingInvite: (result: CollaborationUserSearchResult) => void;
  onRemovePendingInvite: (userId: string) => void;
  onWorkspaceNameChange: (value: string) => void;
  onWorkspaceDescriptionChange: (value: string) => void;
  onSelectCompositionDiary: (diaryId: string | null) => void;
  onToggleCompositionSuitcase: (suitcaseId: string) => void;
  onToggleCompositionUserTemplate: (templateId: string) => void;
  onSelectWorkspace: (workspaceId: string) => void;
  onAddWorkspacePendingInvite: (result: CollaborationUserSearchResult) => void;
  onRemoveWorkspacePendingInvite: (userId: string) => void;
}

export const CollaborationShareWizard: React.FC<CollaborationShareWizardProps> = ({
  wizardStep,
  sharePath,
  sharingMode,
  shareIntent,
  selectedRole,
  searchQuery,
  searchResults,
  isSearching,
  pendingInvites,
  workspaceName,
  workspaceDescription,
  compositionBlueprint,
  compositionDraft,
  isExpandingCompositionDiary = false,
  userWorkspaces,
  selectedWorkspaceId,
  workspacePendingInvites,
  workspaceDefaultAccess,
  onSharePathChange,
  onSharingModeChange,
  onShareIntentChange,
  onSelectedRoleChange,
  onSearchQueryChange,
  onAddPendingInvite,
  onRemovePendingInvite,
  onWorkspaceNameChange,
  onWorkspaceDescriptionChange,
  onSelectCompositionDiary,
  onToggleCompositionSuitcase,
  onToggleCompositionUserTemplate,
  onSelectWorkspace,
  onAddWorkspacePendingInvite,
  onRemoveWorkspacePendingInvite,
  isSubmitting = false,
}) => {
  const isMobile = useMobileDetect();
  const sectionTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.sectionTitle, isMobile);
  const bodyTextShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.bodyText, isMobile);
  const cardLabelShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.cardLabel, isMobile);
  const stepTitle = getWizardStepTitle(wizardStep, sharePath);

  return (
  <>
    {wizardStep === 'path' && (
      <div className="space-y-3">
        <h3 className={sectionTitleShell}>{stepTitle}</h3>
        <OptionCard
          selected={sharePath === 'simple'}
          onSelect={() => onSharePathChange('simple')}
          title="Condivisione Semplice"
          description="Condividi senza associarla a un Workspace."
          icon={<Users className="w-5 h-5" />}
        />
        <OptionCard
          selected={sharePath === 'create_workspace'}
          onSelect={() => onSharePathChange('create_workspace')}
          title="Crea Workspace e Condividi"
          description="Crea un nuovo Workspace e condividi."
          icon={<FolderPlus className="w-5 h-5" />}
        />
        <OptionCard
          selected={sharePath === 'add_workspace'}
          onSelect={() => onSharePathChange('add_workspace')}
          title="Aggiungi ad un Workspace esistente"
          description="Condividi in un Workspace già creato."
          icon={<Layers className="w-5 h-5" />}
        />
      </div>
    )}

    {wizardStep === 'share_intent' && (
      <div className="space-y-3">
        <h3 className={sectionTitleShell}>{stepTitle}</h3>
        <p className={bodyTextShell}>
          Scegli se condividere questo elemento o una copia dedicata. <br/>
        </p>
        <OptionCard
          selected={shareIntent === 'duplicate_and_share'}
          onSelect={() => onShareIntentChange('duplicate_and_share')}
          title="Condividi Duplicato"
          description={
            <>
              L&apos;elemento <strong>duplicato</strong> diventerà quello condiviso.
            </>
          }
          icon={<Copy className="w-5 h-5" />}
          recommended
        />
        <OptionCard
          selected={shareIntent === 'share_current'}
          onSelect={() => onShareIntentChange('share_current')}
          title="Condividi Originale"
          description={
            <>
              L&apos;elemento <strong>originale</strong> diventerà quello condiviso.
            </>
          }
          icon={<Share2 className="w-5 h-5" />}
        />
        {shareIntent === 'share_current' && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" aria-hidden />
            <p className={`${bodyTextShell} text-amber-200/90`}>
              Attenzione: sarà modificato l'elemento del tuo spazio
              personale. Per tenerne una copia invariata, scegli «Condividi Duplicato».
            </p>
          </div>
        )}
      </div>
    )}

    {wizardStep === 'mode' && (
      <div className="space-y-3">
        <h3 className={sectionTitleShell}>{stepTitle}</h3>
        <OptionCard
          selected={sharingMode === 'collaborative'}
          onSelect={() => onSharingModeChange('collaborative')}
          title="Modalità Condivisa"
          description="Lavoro condiviso* tra utenti."
          icon={<Users className="w-5 h-5" />}
        />
        <OptionCard
          selected={sharingMode === 'personal'}
          onSelect={() => onSharingModeChange('personal')}
          title="Modalità Personale"
          description="Ogni invitato riceve una copia personale."
          icon={<UserPlus className="w-5 h-5" />}
        />
        <p className={bodyTextShell}>
          * Le modifiche diventano visibili agli altri utenti dopo ogni salvataggio.
        </p>
      </div>
    )}

    {wizardStep === 'invite' && (
      <div className="space-y-4">
        <h3 className={sectionTitleShell}>{stepTitle}</h3>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <div className={bodyTextShell}>
            Modalità <span className="text-indigo-300 font-semibold">{MODE_LABELS[sharingMode]}</span>
            {sharingMode === 'personal' && (
              <span className="block mt-1">
                I destinatari riceveranno una copia personale al momento dell&apos;accettazione.
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Ruolo predefinito
          </label>
          <select
            value={selectedRole}
            onChange={(e) => onSelectedRoleChange(e.target.value as CollaborativeMemberRole)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            {COLLABORATIVE_MEMBER_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Cerca utente
          </label>
          <CollaborationUserInviteSearch
            searchQuery={searchQuery}
            onSearchQueryChange={onSearchQueryChange}
            searchResults={searchResults}
            isSearching={isSearching}
            isSubmitting={isSubmitting}
            onSelectUser={onAddPendingInvite}
          />
        </div>

        {pendingInvites.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Da invitare</p>
            <div className="space-y-2">
              {pendingInvites.map((pending) => (
                <div
                  key={pending.userId}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-white truncate">{pending.name}</div>
                    <div className={cardLabelShell}>
                      {ROLE_LABELS[pending.role]}
                      {pending.slug ? ` · @${pending.slug}` : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemovePendingInvite(pending.userId)}
                    className="text-xs text-slate-400 hover:text-red-400 shrink-0"
                  >
                    Rimuovi
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )}

    {wizardStep === 'workspace_setup' && (
      <div className="space-y-3">
        <h3 className={sectionTitleShell}>{stepTitle}</h3>
        <WorkspaceSetupStep
        workspaceName={workspaceName}
        workspaceDescription={workspaceDescription}
        onNameChange={onWorkspaceNameChange}
        onDescriptionChange={onWorkspaceDescriptionChange}
      />
      </div>
    )}

    {wizardStep === 'workspace_composition' && compositionBlueprint && compositionDraft && (
      <div className="space-y-3">
        <h3 className={sectionTitleShell}>{stepTitle}</h3>
        <WorkspaceCompositionStep
          blueprint={compositionBlueprint}
          draft={compositionDraft}
          isExpandingDiary={isExpandingCompositionDiary}
          onSelectDiary={onSelectCompositionDiary}
          onToggleSuitcase={onToggleCompositionSuitcase}
          onToggleUserTemplate={onToggleCompositionUserTemplate}
        />
      </div>
    )}

    {wizardStep === 'workspace_select' && (
      <div className="space-y-3">
        <h3 className={sectionTitleShell}>{stepTitle}</h3>
        <WorkspaceSelectStep
        workspaces={userWorkspaces}
        selectedWorkspaceId={selectedWorkspaceId}
        onSelect={onSelectWorkspace}
      />
      </div>
    )}

    {wizardStep === 'workspace_invite' && (
      <div className="space-y-4">
        <h3 className={sectionTitleShell}>{stepTitle}</h3>
        <WorkspaceInviteStep
          pendingInvites={workspacePendingInvites}
          defaultAccessLabel={WORKSPACE_ACCESS_LABELS[workspaceDefaultAccess]}
          onRemoveInvite={onRemoveWorkspacePendingInvite}
        />
        <WorkspaceInviteSearch
          searchQuery={searchQuery}
          searchResults={searchResults}
          isSearching={isSearching}
          onSearchQueryChange={onSearchQueryChange}
          onAddInvite={onAddWorkspacePendingInvite}
        />
      </div>
    )}
  </>
  );
};
