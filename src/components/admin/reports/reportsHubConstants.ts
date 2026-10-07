export const ADMIN_REPORTS_TABS = [
  { id: 'community', label: 'Community' },
  { id: 'patron', label: 'Santo Patrono' },
  { id: 'famous_person', label: 'Personaggio Famoso' },
  { id: 'ai', label: 'AI' },
  { id: 'wikimedia', label: 'Wikimedia' },
] as const;

export type AdminReportsTabId = (typeof ADMIN_REPORTS_TABS)[number]['id'];
