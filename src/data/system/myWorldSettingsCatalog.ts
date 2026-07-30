/**
 * Catalogo editor Admin — sezione Design System «MyWorld Style».
 * Stessa SoT `design_system_rules`; section dedicata agli elementi esclusivi MyWorld
 * (MySpace + Workspace). Non è un Design System separato.
 */

export interface MyWorldSettingsItem {
  baseKey: string;
  label?: string;
}

export interface MyWorldSettingsGroup {
  id: string;
  label: string;
  description: string;
  items: MyWorldSettingsItem[];
}

export const MYWORLD_SETTINGS_GROUPS: MyWorldSettingsGroup[] = [
  {
    id: 'section_header',
    label: 'Header sezione',
    description: 'Intestazione condivisa delle root MySpace / superfici MyWorld (riferimento Valigia).',
    items: [
      { baseKey: 'myworld_section_header_bar' },
      { baseKey: 'myworld_section_title' },
      { baseKey: 'myworld_section_icon' },
      { baseKey: 'myworld_section_description' },
    ],
  },
  {
    id: 'panels',
    label: 'Pannelli e liste',
    description: 'Pannelli colonna, righe lista e meta (identità Valigia).',
    items: [
      { baseKey: 'myworld_section_panel' },
      { baseKey: 'myworld_panel_header' },
      { baseKey: 'myworld_list_row' },
      { baseKey: 'myworld_list_title' },
      { baseKey: 'myworld_list_meta' },
      { baseKey: 'myworld_chrome_btn' },
    ],
  },
];

/** Chiavi MyWorld Style esposte al runtime. */
export const MYWORLD_STYLE_KEYS = {
  sectionHeaderBar: 'myworld_section_header_bar',
  sectionTitle: 'myworld_section_title',
  sectionIcon: 'myworld_section_icon',
  sectionDescription: 'myworld_section_description',
  sectionPanel: 'myworld_section_panel',
  panelHeader: 'myworld_panel_header',
  listRow: 'myworld_list_row',
  listTitle: 'myworld_list_title',
  listMeta: 'myworld_list_meta',
  chromeBtn: 'myworld_chrome_btn',
} as const;

export type MyWorldStyleKey =
  (typeof MYWORLD_STYLE_KEYS)[keyof typeof MYWORLD_STYLE_KEYS];
