import React from 'react';
import type { WorkspaceInvite } from '@/domain/collaboration';
import type { WorkspaceResourceLabel } from '@/services/collaboration';
import { WorkspaceInvitesSection } from '@/components/collaboration/workspace/WorkspaceInvitesSection';

interface Props {
  invites: WorkspaceInvite[];
  inviteeProfiles: Record<string, { name: string; slug?: string }>;
  resourceLabels: WorkspaceResourceLabel[];
  isSubmitting: boolean;
  onResendInvite: (inviteId: string) => void;
}

export const WorkspaceBlockedUsersSubsection: React.FC<Props> = ({
  invites,
  inviteeProfiles,
  resourceLabels,
  isSubmitting,
  onResendInvite,
}) => {
  const blockedInvites = invites.filter((invite) => invite.status === 'revoked');

  if (blockedInvites.length === 0) {
    return (
      <section className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Utenti Bloccati
        </h3>
        <p className="text-sm text-slate-500">Nessun utente bloccato per questo workspace.</p>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Utenti Bloccati</h3>
      <WorkspaceInvitesSection
        invites={blockedInvites}
        inviteeProfiles={inviteeProfiles}
        resourceLabels={resourceLabels}
        isSubmitting={isSubmitting}
        onResendInvite={onResendInvite}
      />
    </section>
  );
};
