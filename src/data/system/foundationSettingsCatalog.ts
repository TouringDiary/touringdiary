/**
 * Catalogo editor Admin — gruppi logici per il tab Foundation.
 * Ogni item referenzia un component_key base (coppia _mobile opzionale).
 */

export interface FoundationSettingsItem {
  baseKey: string;
  /** Etichetta breve nella lista (fallback: element_name dal DB). */
  label?: string;
}

export interface FoundationSettingsGroup {
  id: string;
  label: string;
  description: string;
  items: FoundationSettingsItem[];
}

export const FOUNDATION_SETTINGS_GROUPS: FoundationSettingsGroup[] = [
  {
    id: 'shell',
    label: 'Shell modale',
    description: 'Overlay visivo, contenitore, aree strutturali e posizione del pulsante di chiusura.',
    items: [
      { baseKey: 'foundation_modal_overlay' },
      { baseKey: 'foundation_modal_container' },
      { baseKey: 'foundation_modal_header' },
      { baseKey: 'foundation_modal_body' },
      { baseKey: 'foundation_modal_footer' },
      { baseKey: 'foundation_modal_footer_actions' },
      { baseKey: 'foundation_modal_close_offset' },
    ],
  },
  {
    id: 'header',
    label: 'Header',
    description: 'Icona, titolo principale e sottotitolo della modale.',
    items: [
      { baseKey: 'foundation_modal_header_icon_box' },
      { baseKey: 'foundation_modal_header_icon_glyph' },
      { baseKey: 'foundation_modal_title' },
      { baseKey: 'foundation_modal_subtitle' },
    ],
  },
  {
    id: 'sections',
    label: 'Sezioni contenuto',
    description: 'Intestazioni e descrizioni delle sezioni nel corpo modale.',
    items: [
      { baseKey: 'foundation_section_title' },
      { baseKey: 'foundation_section_title_icon' },
      { baseKey: 'foundation_section_description' },
    ],
  },
  {
    id: 'body',
    label: 'Testi e card statiche',
    description: 'Paragrafi descrittivi e riquadri informativi nel corpo.',
    items: [
      { baseKey: 'foundation_body_text' },
      { baseKey: 'foundation_card_surface' },
      { baseKey: 'foundation_card_label' },
    ],
  },
  {
    id: 'selectable_cards',
    label: 'Card selezionabili',
    description: 'Opzioni a scelta singola con badge, stati selezionato/non selezionato e gerarchia tipografica.',
    items: [
      { baseKey: 'foundation_selectable_card_base' },
      { baseKey: 'foundation_selectable_card_selected' },
      { baseKey: 'foundation_selectable_card_unselected' },
      { baseKey: 'foundation_selectable_card_header_row' },
      { baseKey: 'foundation_selectable_badge_base' },
      { baseKey: 'foundation_selectable_badge_selected' },
      { baseKey: 'foundation_selectable_badge_unselected' },
      { baseKey: 'foundation_selectable_check_icon' },
      { baseKey: 'foundation_selectable_icon_box_base' },
      { baseKey: 'foundation_selectable_icon_box_selected' },
      { baseKey: 'foundation_selectable_icon_box_unselected' },
      { baseKey: 'foundation_selectable_card_title' },
      { baseKey: 'foundation_selectable_card_description' },
    ],
  },
  {
    id: 'actions',
    label: 'Pulsanti footer',
    description: 'Azioni primarie e secondarie (Annulla / Conferma) nel footer modale.',
    items: [
      { baseKey: 'foundation_btn_cancel' },
      { baseKey: 'foundation_btn_primary' },
    ],
  },
];

/** Chiavi Foundation esposte al runtime — per migrazione modali future. */
export const FOUNDATION_STYLE_KEYS = {
  modalOverlay: 'foundation_modal_overlay',
  modalContainer: 'foundation_modal_container',
  modalHeader: 'foundation_modal_header',
  modalBody: 'foundation_modal_body',
  modalFooter: 'foundation_modal_footer',
  modalFooterActions: 'foundation_modal_footer_actions',
  modalCloseOffset: 'foundation_modal_close_offset',
  modalHeaderIconBox: 'foundation_modal_header_icon_box',
  modalHeaderIconGlyph: 'foundation_modal_header_icon_glyph',
  modalTitle: 'foundation_modal_title',
  modalSubtitle: 'foundation_modal_subtitle',
  sectionTitle: 'foundation_section_title',
  sectionTitleIcon: 'foundation_section_title_icon',
  sectionDescription: 'foundation_section_description',
  bodyText: 'foundation_body_text',
  cardSurface: 'foundation_card_surface',
  cardLabel: 'foundation_card_label',
  selectableCardBase: 'foundation_selectable_card_base',
  selectableCardSelected: 'foundation_selectable_card_selected',
  selectableCardUnselected: 'foundation_selectable_card_unselected',
  selectableCardHeaderRow: 'foundation_selectable_card_header_row',
  selectableBadgeBase: 'foundation_selectable_badge_base',
  selectableBadgeSelected: 'foundation_selectable_badge_selected',
  selectableBadgeUnselected: 'foundation_selectable_badge_unselected',
  selectableCheckIcon: 'foundation_selectable_check_icon',
  selectableIconBoxBase: 'foundation_selectable_icon_box_base',
  selectableIconBoxSelected: 'foundation_selectable_icon_box_selected',
  selectableIconBoxUnselected: 'foundation_selectable_icon_box_unselected',
  selectableCardTitle: 'foundation_selectable_card_title',
  selectableCardDescription: 'foundation_selectable_card_description',
  btnCancel: 'foundation_btn_cancel',
  btnPrimary: 'foundation_btn_primary',
} as const;

export type FoundationStyleKey =
  (typeof FOUNDATION_STYLE_KEYS)[keyof typeof FOUNDATION_STYLE_KEYS];
