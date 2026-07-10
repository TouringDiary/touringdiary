import { supabase } from '@/services/supabaseClient';
import { getWorkspace, isWorkspaceMember } from './workspaceService';

/**
 * Uscita volontaria di un membro da un workspace.
 * Il proprietario non può abbandonare; deve eliminare il workspace.
 */
export async function leaveWorkspace(
  workspaceId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const workspace = await getWorkspace(workspaceId);
  if (!workspace) {
    return { success: false, error: 'Workspace non trovato.' };
  }
  if (workspace.ownerId === userId) {
    return { success: false, error: 'Il proprietario non può abbandonare il workspace.' };
  }
  if (!(await isWorkspaceMember(workspaceId, userId))) {
    return { success: false, error: 'Non sei membro di questo workspace.' };
  }

  const { error: permError } = await supabase
    .from('workspace_resource_permissions')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);

  if (permError) {
    console.error('[workspaceMemberService] leaveWorkspace permissions:', permError.message);
    return { success: false, error: 'Impossibile rimuovere i permessi.' };
  }

  const { data, error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .select('id');

  if (error) {
    console.error('[workspaceMemberService] leaveWorkspace:', error.message);
    return { success: false, error: 'Impossibile abbandonare il workspace.' };
  }
  if (!data?.length) {
    return { success: false, error: 'Membro non trovato.' };
  }

  // Pulizia post-uscita: rimuove l'invito accettato per permettere futuri reinviti.
  // L'appartenenza è già terminata; un fallimento qui non annulla l'uscita.
  const { error: inviteError } = await supabase
    .from('workspace_invites')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('invitee_id', userId)
    .eq('status', 'accepted');

  if (inviteError) {
    console.error('[workspaceMemberService] leaveWorkspace invite cleanup:', inviteError.message);
  }

  return { success: true };
}
