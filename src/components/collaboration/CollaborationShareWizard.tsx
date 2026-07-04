import React from 'react';
import { Copy, FolderPlus, Layers, Loader2, Search, Share2, UserPlus, Users, AlertTriangle } from 'lucide-react';
import type { CollaborativeMemberRole, SharingMode, Workspace } from '@/domain/collaboration';
import { COLLABORATIVE_MEMBER_ROLES } from '@/domain/collaboration';
import type { CollaborationUserSearchResult } from '@/domain/collaboration';
import type { WorkspaceCompositionResource } from '@/services/collaboration';
import type { WorkspaceResourceLabel } from '@/services/collaboration';
import { OptionCard } from './OptionCard';
import {
  MODE_LABELS,
  ROLE_LABELS,
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
  suggestedComposition: WorkspaceCompositionResource[];
  compositionLabels: WorkspaceResourceLabel[];
  selectedCompositionKeys: Set<string>;
  userWorkspaces: Workspace[];
  selectedWorkspaceId: string | null;
  workspacePendingInvites: WorkspacePendingInvite[];
  workspaceDefaultAccess: 'collaborator';
  onSharePathChange: (path: SharePath) => void;
  onSharingModeChange: (mode: SharingMode) => void;
  onShareIntentChange: (intent: ShareIntent) => void;
  onSelectedRoleChange: (role: CollaborativeMemberRole) => void;
  onSearchQueryChange: (query: string) => void;
  onAddPendingInvite: (result: CollaborationUserSearchResult) => void;
  onRemovePendingInvite: (userId: string) => void;
  onWorkspaceNameChange: (value: string) => void;
  onWorkspaceDescriptionChange: (value: string) => void;
  onToggleCompositionResource: (
    kind: WorkspaceCompositionResource['kind'],
    resourceId: string
  ) => void;
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
  suggestedComposition,
  compositionLabels,
  selectedCompositionKeys,
  userWorkspaces,
  selectedWorkspaceId,
  workspacePendingInvites,
  onSharePathChange,
  onSharingModeChange,
  onShareIntentChange,
  onSelectedRoleChange,
  onSearchQueryChange,
  onAddPendingInvite,
  onRemovePendingInvite,
  onWorkspaceNameChange,
  onWorkspaceDescriptionChange,
  onToggleCompositionResource,
  onSelectWorkspace,
  onAddWorkspacePendingInvite,
  onRemoveWorkspacePendingInvite,
}) => (
  <>
    {wizardStep === 'path' && (
      <div className="space-y-3">
        <OptionCard
          selected={sharePath === 'simple'}
          onSelect={() => onSharePathChange('simple')}
          title="Condivisione semplice"
          description="Condividi solo questa risorsa, senza associarla a un Workspace."
          icon={<Users className="w-5 h-5" />}
        />
        <OptionCard
          selected={sharePath === 'create_workspace'}
          onSelect={() => onSharePathChange('create_workspace')}
          title="Crea un nuovo Workspace"
          description="Usa questa risorsa come punto di partenza per un nuovo progetto condiviso."
          icon={<FolderPlus className="w-5 h-5" />}
        />
        <OptionCard
          selected={sharePath === 'add_workspace'}
          onSelect={() => onSharePathChange('add_workspace')}
          title="Aggiungi a un Workspace esistente"
          description="Collega la risorsa a un Workspace che hai già creato."
          icon={<Layers className="w-5 h-5" />}
        />
      </div>
    )}

    {wizardStep === 'share_intent' && (
      <div className="space-y-3">
        <p className="text-xs text-slate-400 leading-relaxed">
          Scegli se condividere la risorsa attuale o una copia dedicata alla collaborazione.
          La tua versione personale può restare invariata come archivio o modello.
        </p>
        <OptionCard
          selected={shareIntent === 'duplicate_and_share'}
          onSelect={() => onShareIntentChange('duplicate_and_share')}
          title="Duplica e condividi (consigliato)"
          description="Verrà creata una copia della risorsa. La tua risorsa personale rimarrà invariata e potrai continuare ad utilizzarla come modello personale."
          icon={<Copy className="w-5 h-5" />}
          recommended
        />
        <OptionCard
          selected={shareIntent === 'share_current'}
          onSelect={() => onShareIntentChange('share_current')}
          title="Condividi questa risorsa"
          description="Condividerai direttamente la risorsa attuale. Da questo momento tutte le modifiche effettuate dai collaboratori verranno applicate a questa stessa risorsa."
          icon={<Share2 className="w-5 h-5" />}
        />
        {shareIntent === 'share_current' && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-200/90">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
            <p>
              Attenzione: i collaboratori modificheranno la stessa risorsa che usi nel tuo spazio
              personale. Per tenerne una copia invariata, scegli «Duplica e condividi».
            </p>
          </div>
        )}
      </div>
    )}

    {wizardStep === 'mode' && (
      <div className="space-y-3">
        <OptionCard
          selected={sharingMode === 'collaborative'}
          onSelect={() => onSharingModeChange('collaborative')}
          title="Modalità Collaborativa"
          description="Un solo oggetto condiviso. Le modifiche sono visibili a tutti gli utenti autorizzati."
          icon={<Users className="w-5 h-5" />}
        />
        <OptionCard
          selected={sharingMode === 'personal'}
          onSelect={() => onSharingModeChange('personal')}
          title="Modalità Personale"
          description="Ogni destinatario riceve una copia completa e indipendente, senza sincronizzazione."
          icon={<UserPlus className="w-5 h-5" />}
        />
      </div>
    )}

    {wizardStep === 'invite' && (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-400">
          Modalità <span className="text-indigo-300 font-semibold">{MODE_LABELS[sharingMode]}</span>
          {sharingMode === 'personal' && (
            <span className="block mt-1">
              I destinatari riceveranno una copia personale al momento dell&apos;accettazione.
            </span>
          )}
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Email o Nome utente"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500"
            />
          </div>
          {isSearching && (
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Ricerca...
            </p>
          )}
          {searchResults.length > 0 && (
            <div className="rounded-xl border border-slate-700 overflow-hidden divide-y divide-slate-800">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => onAddPendingInvite(result)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-800/80 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-xs font-bold shrink-0">
                    {result.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{result.name}</div>
                    {result.slug && (
                      <div className="text-xs text-slate-400 truncate">@{result.slug}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
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
                    <div className="text-xs text-slate-400">
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
      <WorkspaceSetupStep
        workspaceName={workspaceName}
        workspaceDescription={workspaceDescription}
        onNameChange={onWorkspaceNameChange}
        onDescriptionChange={onWorkspaceDescriptionChange}
      />
    )}

    {wizardStep === 'workspace_composition' && (
      <WorkspaceCompositionStep
        suggestedComposition={suggestedComposition}
        resourceLabels={compositionLabels}
        selectedKeys={selectedCompositionKeys}
        onToggleResource={onToggleCompositionResource}
      />
    )}

    {wizardStep === 'workspace_select' && (
      <WorkspaceSelectStep
        workspaces={userWorkspaces}
        selectedWorkspaceId={selectedWorkspaceId}
        onSelect={onSelectWorkspace}
      />
    )}

    {wizardStep === 'workspace_invite' && (
      <div className="space-y-4">
        <WorkspaceInviteStep
          pendingInvites={workspacePendingInvites}
          defaultAccessLabel={WORKSPACE_ACCESS_LABELS.collaborator}
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
