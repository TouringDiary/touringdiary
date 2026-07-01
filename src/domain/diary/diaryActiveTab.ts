/** Tab attivo nella barra del Diario di Viaggio. */
export type DiaryActiveTab = 'all' | 'notes' | number;

export function isDayTab(tab: DiaryActiveTab): tab is number {
  return typeof tab === 'number';
}

export function isNotesTab(tab: DiaryActiveTab): tab is 'notes' {
  return tab === 'notes';
}

export function isAllTab(tab: DiaryActiveTab): tab is 'all' {
  return tab === 'all';
}
