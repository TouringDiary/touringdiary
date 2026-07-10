const MS_PER_DAY = 86_400_000;

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Formato dinamico per "Ultima attività" sulle card workspace.
 * Confronto per giorno di calendario (inizio giornata locale), non per arrotondamento orario.
 */
export function formatRelativeActivity(isoDate: string, now = new Date()): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';

  const time = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  const dayDiff = Math.floor(
    (startOfLocalDay(now).getTime() - startOfLocalDay(date).getTime()) / MS_PER_DAY
  );

  if (dayDiff < 0) {
    const ahead = -dayDiff;
    if (ahead === 1) return `domani ${time}`;
    return `tra ${ahead} giorni ${time}`;
  }
  if (dayDiff === 0) return `oggi ${time}`;
  if (dayDiff === 1) return `ieri ${time}`;
  if (dayDiff === 2) return `2 giorni fa ${time}`;
  return `${dayDiff} giorni fa ${time}`;
}

export function formatWorkspaceCreated(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
