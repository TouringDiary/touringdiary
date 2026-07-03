import type { SharedResourceKind } from '@/domain/collaboration';
import { getSharedResourceKindLabel } from '@/domain/collaboration';

export function formatCollaborationLockDurationItalian(lockedAtIso: string | null): string | null {
  if (!lockedAtIso) return null;

  const lockedAt = Date.parse(lockedAtIso);
  if (Number.isNaN(lockedAt)) return null;

  const minutes = Math.max(1, Math.round((Date.now() - lockedAt) / 60_000));
  if (minutes === 1) return 'da circa 1 minuto';
  return `da circa ${minutes} minuti`;
}

export function buildCollaborationEditingStatusMessage(
  editorName: string,
  kind: SharedResourceKind,
  resourceTitle?: string | null
): string {
  if (kind === 'diary') {
    return `${editorName} sta modificando il Diario`;
  }

  const label = getSharedResourceKindLabel(kind);
  if (resourceTitle?.trim()) {
    return `${editorName} sta modificando ${label === 'Valigia' ? 'una Valigia' : 'un Template'} "${resourceTitle.trim()}"`;
  }

  return `${editorName} sta modificando ${label === 'Valigia' ? 'una Valigia' : 'un Template'}`;
}

export function buildCollaborationLockBlockedMessage(
  editorName: string,
  lockedAtIso: string | null
): string {
  const duration = formatCollaborationLockDurationItalian(lockedAtIso);
  if (duration) {
    return `${editorName} sta modificando questo contenuto ${duration}.`;
  }
  return `${editorName} sta modificando questo contenuto.`;
}
