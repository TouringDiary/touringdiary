import React from 'react';
import { Search } from 'lucide-react';
import type { CollaborativeMemberRole, ResourceInvite, SharedResource, SharedResourceMemberWithProfile, SharingMode } from '@/domain/collaboration';
import { SHARING_MODES } from '@/domain/collaboration';
import { COLLABORATIVE_MEMBER_ROLES } from '@/domain/collaboration';
import type { CollaborationUserSearchResult } from '@/domain/collaboration';
import { INVITE_STATUS_LABELS, MODE_LABELS, ROLE_LABELS } from './collaborationSharePresentation';

export interface CollaborationManagementViewProps {
  sharedResource: SharedResource | null;
  members: SharedResourceMemberWithProfile[];
  invites: ResourceInvite[];
  selectedRole: CollaborativeMemberRole;
  searchQuery: string;
  searchResults: CollaborationUserSearchResult[];
  isSubmitting: boolean;
  canChangeSharingMode?: boolean;
  onSharingModeChange?: (mode: SharingMode) => void;
  onSelectedRoleChange: (role: CollaborativeMemberRole) => void;
  onSearchQueryChange: (query: string) => void;
  onRoleChange: (memberUserId: string, role: CollaborativeMemberRole) => void;
  onRevokeMember: (memberUserId: string) => void;
  onRevokeInvite: (inviteId: string) => void;
  onResendInvite: (inviteId: string) => void;
  onManagementInvite: (target: CollaborationUserSearchResult) => void;
}

export const CollaborationManagementView: React.FC<CollaborationManagementViewProps> = ({
  sharedResource,
  members,
  invites,
  selectedRole,
  searchQuery,
  searchResults,
  isSubmitting,
  canChangeSharingMode = false,
  onSharingModeChange,
  onSelectedRoleChange,
  onSearchQueryChange,
  onRoleChange,
  onRevokeMember,
  onRevokeInvite,
  onResendInvite,
  onManagementInvite,
}) => (
  <div className="space-y-5">
    {sharedResource && (
      <section className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Modalità</h3>
        {canChangeSharingMode && onSharingModeChange ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SHARING_MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                disabled={isSubmitting}
                onClick={() => onSharingModeChange(mode)}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition-all disabled:opacity-50 ${
                  sharedResource.sharingMode === mode
                    ? 'border-indigo-500/60 bg-indigo-500/10 text-white'
                    : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="font-semibold">{MODE_LABELS[mode]}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-400">
            Modalità{' '}
            <span className="text-indigo-300 font-semibold">
              {MODE_LABELS[sharedResource.sharingMode]}
            </span>
          </div>
        )}
        {sharedResource.sharingMode === 'personal' && (
          <p className="text-[11px] text-slate-500 leading-relaxed">
            In modalità Personale ogni destinatario riceve una copia indipendente. L&apos;istanza
            originale resta accessibile solo a te.
          </p>
        )}
      </section>
    )}

    <section className="space-y-2">
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Proprietario</h3>
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-white">
        Tu
      </div>
    </section>

    {members.length > 0 && (
      <section className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Collaboratori e visualizzatori
        </h3>
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{member.userName}</div>
                {member.userSlug && (
                  <div className="text-xs text-slate-400 truncate">@{member.userSlug}</div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={member.role}
                  disabled={isSubmitting}
                  onChange={(e) => onRoleChange(member.userId, e.target.value as CollaborativeMemberRole)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white"
                >
                  {COLLABORATIVE_MEMBER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => onRevokeMember(member.userId)}
                  className="text-xs text-red-400 hover:text-red-300 px-2 py-1.5"
                >
                  Revoca
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    )}

    {invites.length > 0 && (
      <section className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Inviti</h3>
        <div className="space-y-2">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white">
                  {ROLE_LABELS[invite.role]} · {INVITE_STATUS_LABELS[invite.status]}
                </div>
                <div className="text-xs text-slate-500 truncate">ID: {invite.inviteeId}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {invite.status === 'pending' && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => onRevokeInvite(invite.id)}
                    className="text-xs text-red-400 hover:text-red-300 px-2 py-1.5"
                  >
                    Revoca
                  </button>
                )}
                {(invite.status === 'rejected' || invite.status === 'revoked') && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => onResendInvite(invite.id)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1.5"
                  >
                    Reinvia
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    )}

    <section className="space-y-2 pt-2 border-t border-slate-800">
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
        Invita altri utenti
      </h3>
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
      {searchResults.length > 0 && (
        <div className="rounded-xl border border-slate-700 overflow-hidden divide-y divide-slate-800">
          {searchResults.map((result) => (
            <button
              key={result.id}
              type="button"
              disabled={isSubmitting}
              onClick={() => onManagementInvite(result)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-800/80 transition-colors disabled:opacity-50"
            >
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
    </section>
  </div>
);
