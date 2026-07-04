import type { CollaborationNotificationCategoryPrefs } from '@/domain/collaboration/workspaceEngineConfig';
import { DEFAULT_COLLABORATION_NOTIFICATION_PREFS } from '@/domain/collaboration/workspaceEngineConfig';
import { supabase } from '@/services/supabaseClient';
import type { Json } from '@/types/supabase';

function parsePrefs(raw: unknown): CollaborationNotificationCategoryPrefs {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_COLLABORATION_NOTIFICATION_PREFS };
  }
  const record = raw as Record<string, unknown>;
  return {
    invites: record.invites !== false,
    resource_updates: record.resource_updates !== false,
    workspace_updates: record.workspace_updates !== false,
    friend_requests: record.friend_requests !== false,
  };
}

export async function getCollaborationNotificationPrefs(
  userId: string
): Promise<CollaborationNotificationCategoryPrefs> {
  const { data, error } = await supabase
    .from('profiles')
    .select('collaboration_notification_preferences')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return { ...DEFAULT_COLLABORATION_NOTIFICATION_PREFS };
  }

  return parsePrefs(data.collaboration_notification_preferences);
}

export async function updateCollaborationNotificationPrefs(
  userId: string,
  prefs: CollaborationNotificationCategoryPrefs
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('profiles')
    .update({ collaboration_notification_preferences: prefs as unknown as Json })
    .eq('id', userId);

  if (error) {
    console.error('[collaborationNotificationPrefsService] update:', error.message);
    return { success: false, error: 'Impossibile salvare le preferenze.' };
  }

  return { success: true };
}

export async function shouldDeliverCollaborationNotification(
  userId: string,
  category: keyof CollaborationNotificationCategoryPrefs
): Promise<boolean> {
  const prefs = await getCollaborationNotificationPrefs(userId);
  return prefs[category] !== false;
}
