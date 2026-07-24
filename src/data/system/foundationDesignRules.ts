import type { StyleRule } from '@/types/designSystem';

type FoundationRuleSeed = StyleRule;

const shell = (
  element_name: string,
  component_key: string,
  css_class: string,
  preview_text: string
): FoundationRuleSeed => ({
  section: 'foundation',
  element_name,
  component_key,
  css_class,
  font_family: '',
  text_size: null,
  font_weight: null,
  text_transform: 'none',
  tracking: null,
  color_class: null,
  line_height: null,
  effect_class: 'none',
  preview_text,
});

const typeRule = (
  element_name: string,
  component_key: string,
  fields: Partial<StyleRule>,
  preview_text: string
): FoundationRuleSeed => ({
  section: 'foundation',
  element_name,
  component_key,
  css_class: fields.css_class ?? null,
  font_family: fields.font_family ?? 'font-sans',
  text_size: fields.text_size ?? null,
  font_weight: fields.font_weight ?? null,
  text_transform: fields.text_transform ?? 'normal-case',
  tracking: fields.tracking ?? null,
  color_class: fields.color_class ?? null,
  line_height: fields.line_height ?? null,
  effect_class: fields.effect_class ?? 'none',
  preview_text,
});

/**
 * Seed ufficiale Foundation modali — valori dal prototipo approvato (AiSuggestionsModal).
 * Persistiti in design_system_rules con section: 'foundation'.
 */
export const FOUNDATION_DESIGN_RULES: FoundationRuleSeed[] = [
  // ── Shell modale ──────────────────────────────────────────────────────────
  // TODO(foundation-wave-3): valutare `foundation_modal_overlay_compact` (items-center su tutti i
  // breakpoint) per eliminare gli override `!items-center` nelle modali compatte.
  // TODO(foundation-wave-3): valutare centralizzazione delle chiamate shell (overlay/container/body/
  // title/subtitle) se la proliferazione di useFoundationStyles diventa difficile da mantenere.
  shell(
    'Overlay (aspetto visivo)',
    'foundation_modal_overlay',
    'bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6',
    'Overlay'
  ),
  shell(
    'Contenitore modale',
    'foundation_modal_container',
    // Shell grafica/layout only — il focus accessibile (outline-none, focus-visible:ring)
    // resta responsabilità del componente quando il container è focusabile (tabIndex={-1}).
    'relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-t-[2rem] sm:rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 fade-in duration-300 flex flex-col max-h-[calc(100dvh-var(--header-height)-env(safe-area-inset-bottom,0px)-0.5rem)] sm:max-h-[90vh] pb-safe sm:pb-0',
    'Contenitore'
  ),
  shell(
    'Barra header',
    'foundation_modal_header',
    'flex items-center justify-between px-8 py-6 border-b border-white/5 shrink-0',
    'Header'
  ),
  shell(
    'Corpo scrollabile',
    'foundation_modal_body',
    'flex-1 overflow-y-auto overscroll-contain p-8 custom-scrollbar',
    'Body'
  ),
  shell(
    'Barra footer',
    'foundation_modal_footer',
    // shrink-0 keeps the CTA row in the Foundation slot. On mobile bottom sheets with
    // interactive-widget=resizes-content, consumers should hide this footer while the
    // virtual keyboard is open (see useVirtualKeyboardOpen) so body/inputs keep space.
    'px-4 sm:px-8 py-6 border-t border-white/5 bg-slate-900/50 shrink-0 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between min-w-0',
    'Footer'
  ),
  shell(
    'Gruppo azioni footer',
    'foundation_modal_footer_actions',
    'flex items-center justify-center gap-3 w-full',
    'Azioni footer'
  ),
  shell(
    'Offset pulsante chiusura (X)',
    'foundation_modal_close_offset',
    'top-6 right-8',
    'Offset X'
  ),

  // ── Header ────────────────────────────────────────────────────────────────
  shell(
    'Contenitore icona header',
    'foundation_modal_header_icon_box',
    'w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shrink-0',
    'Icon box'
  ),
  shell(
    'Dimensione icona header',
    'foundation_modal_header_icon_glyph',
    'w-6 h-6',
    'Icona'
  ),
  typeRule(
    'Titolo modale',
    'foundation_modal_title',
    {
      font_family: 'font-display',
      text_size: 'text-xl',
      font_weight: 'font-bold',
      text_transform: 'uppercase',
      tracking: 'tracking-wide',
      color_class: 'text-white',
      line_height: 'leading-none',
    },
    'Anteprima Foundation'
  ),
  typeRule(
    'Titolo modale (Mobile)',
    'foundation_modal_title_mobile',
    {
      font_family: 'font-display',
      text_size: 'text-lg',
      font_weight: 'font-bold',
      text_transform: 'uppercase',
      tracking: 'tracking-wide',
      color_class: 'text-white',
      line_height: 'leading-none',
    },
    'Anteprima Foundation'
  ),
  typeRule(
    'Sottotitolo modale',
    'foundation_modal_subtitle',
    {
      css_class: 'text-[12px] font-medium text-slate-300/90',
    },
    'Mockup tecnico dello standard modale TouringDiary'
  ),
  typeRule(
    'Sottotitolo modale (Mobile)',
    'foundation_modal_subtitle_mobile',
    {
      css_class: 'text-[12px] font-medium text-slate-300/90',
    },
    'Mockup tecnico dello standard modale TouringDiary'
  ),

  // ── Sezioni contenuto ─────────────────────────────────────────────────────
  typeRule(
    'Titolo sezione',
    'foundation_section_title',
    {
      font_family: 'font-sans',
      text_size: 'text-[12px]',
      font_weight: 'font-black',
      text_transform: 'uppercase',
      tracking: 'tracking-[0.2em]',
      color_class: 'text-amber-500',
      line_height: 'leading-none',
    },
    'Titolo e testo'
  ),
  typeRule(
    'Titolo sezione (Mobile)',
    'foundation_section_title_mobile',
    {
      font_family: 'font-sans',
      text_size: 'text-[12px]',
      font_weight: 'font-black',
      text_transform: 'uppercase',
      tracking: 'tracking-[0.2em]',
      color_class: 'text-amber-500',
      line_height: 'leading-none',
    },
    'Titolo e testo'
  ),
  shell(
    'Icona titolo sezione',
    'foundation_section_title_icon',
    'w-4 h-4 text-amber-500 shrink-0',
    'Icona sezione'
  ),
  typeRule(
    'Descrizione sezione',
    'foundation_section_description',
    {
      css_class: 'text-[12px] text-slate-300/90 font-medium',
    },
    'Gerarchia tipografica del contenuto principale.'
  ),
  typeRule(
    'Descrizione sezione (Mobile)',
    'foundation_section_description_mobile',
    {
      css_class: 'text-[12px] text-slate-300/90 font-medium',
    },
    'Gerarchia tipografica del contenuto principale.'
  ),

  // ── Testi corpo ───────────────────────────────────────────────────────────
  typeRule(
    'Testo corpo',
    'foundation_body_text',
    {
      font_family: 'font-sans',
      text_size: 'text-[13px]',
      font_weight: 'font-medium',
      color_class: 'text-slate-300',
      line_height: 'leading-relaxed',
    },
    'Testo descrittivo nel corpo modale.'
  ),
  typeRule(
    'Testo corpo (Mobile)',
    'foundation_body_text_mobile',
    {
      font_family: 'font-sans',
      text_size: 'text-[13px]',
      font_weight: 'font-medium',
      color_class: 'text-slate-300',
      line_height: 'leading-relaxed',
    },
    'Testo descrittivo nel corpo modale.'
  ),
  shell(
    'Card statica (superficie)',
    'foundation_card_surface',
    'rounded-2xl border border-white/10 bg-slate-800/40 p-5 space-y-2',
    'Card'
  ),
  typeRule(
    'Etichetta card',
    'foundation_card_label',
    {
      font_family: 'font-sans',
      text_size: 'text-[12.5px]',
      font_weight: 'font-medium',
      color_class: 'text-slate-400',
    },
    'Card secondaria'
  ),
  typeRule(
    'Etichetta card (Mobile)',
    'foundation_card_label_mobile',
    {
      font_family: 'font-sans',
      text_size: 'text-[12.5px]',
      font_weight: 'font-medium',
      color_class: 'text-slate-400',
    },
    'Card secondaria'
  ),

  // ── Card selezionabili ────────────────────────────────────────────────────
  shell(
    'Card selezionabile (base)',
    'foundation_selectable_card_base',
    'p-5 rounded-3xl border text-left transition-all group relative flex flex-col h-full',
    'Card opzione'
  ),
  shell(
    'Card selezionabile (selezionata)',
    'foundation_selectable_card_selected',
    'bg-indigo-600/10 border-indigo-500/50 ring-1 ring-indigo-500/50',
    'Selezionata'
  ),
  shell(
    'Card selezionabile (non selezionata)',
    'foundation_selectable_card_unselected',
    'bg-white/5 border-white/5 hover:border-white/10',
    'Non selezionata'
  ),
  shell(
    'Riga header card selezionabile',
    'foundation_selectable_card_header_row',
    'flex items-center gap-3 mb-3 min-h-[3rem] pr-7',
    'Header card'
  ),
  shell(
    'Badge selezione (base)',
    'foundation_selectable_badge_base',
    'absolute top-5 right-5 w-5 h-5 rounded-full border flex items-center justify-center transition-all',
    'Badge'
  ),
  shell(
    'Badge selezione (attivo)',
    'foundation_selectable_badge_selected',
    'bg-indigo-500 border-indigo-500 shadow-lg shadow-indigo-500/40',
    'Badge attivo'
  ),
  shell(
    'Badge selezione (inattivo)',
    'foundation_selectable_badge_unselected',
    'border-white/10 bg-black/20',
    'Badge inattivo'
  ),
  shell(
    'Spunta badge selezione',
    'foundation_selectable_check_icon',
    'w-3 h-3 text-white stroke-[4]',
    'Spunta'
  ),
  shell(
    'Icon box card (base)',
    'foundation_selectable_icon_box_base',
    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
    'Icon box'
  ),
  shell(
    'Icon box card (selezionata)',
    'foundation_selectable_icon_box_selected',
    'bg-indigo-500 text-white',
    'Icon box attivo'
  ),
  shell(
    'Icon box card (non selezionata)',
    'foundation_selectable_icon_box_unselected',
    'bg-slate-800 text-slate-400 group-hover:text-slate-200',
    'Icon box inattivo'
  ),
  typeRule(
    'Titolo card selezionabile',
    'foundation_selectable_card_title',
    {
      font_family: 'font-sans',
      text_size: 'text-[14px]',
      font_weight: 'font-bold',
      line_height: 'leading-snug',
      color_class: 'text-white',
    },
    'Valuta ed inserisci'
  ),
  typeRule(
    'Titolo card selezionabile (Mobile)',
    'foundation_selectable_card_title_mobile',
    {
      font_family: 'font-sans',
      text_size: 'text-[14px]',
      font_weight: 'font-bold',
      line_height: 'leading-snug',
      color_class: 'text-white',
    },
    'Valuta ed inserisci'
  ),
  typeRule(
    'Descrizione card selezionabile',
    'foundation_selectable_card_description',
    {
      font_family: 'font-sans',
      text_size: 'text-[12.5px]',
      font_weight: 'font-medium',
      color_class: 'text-slate-400',
    },
    'Potrai valutare gli oggetti suggeriti prima di inserirli.'
  ),
  typeRule(
    'Descrizione card selezionabile (Mobile)',
    'foundation_selectable_card_description_mobile',
    {
      font_family: 'font-sans',
      text_size: 'text-[12.5px]',
      font_weight: 'font-medium',
      color_class: 'text-slate-400',
    },
    'Potrai valutare gli oggetti suggeriti prima di inserirli.'
  ),

  // ── Pulsanti footer ───────────────────────────────────────────────────────
  shell(
    'Pulsante Annulla / Indietro',
    'foundation_btn_cancel',
    'w-36 sm:w-40 px-6 py-4 rounded-xl border border-rose-500/15 bg-rose-500/5 text-[10px] font-black text-rose-300/80 uppercase tracking-widest hover:text-rose-200 hover:border-rose-400/25 hover:bg-rose-500/10 transition-colors',
    'Annulla'
  ),
  shell(
    'Pulsante primario (Conferma)',
    'foundation_btn_primary',
    'w-36 sm:w-40 px-6 py-4 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest whitespace-nowrap hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-3',
    'Conferma'
  ),
];
