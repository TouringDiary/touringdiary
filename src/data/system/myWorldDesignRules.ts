import type { StyleRule } from '@/types/designSystem';

type MyWorldRuleSeed = StyleRule;

const shell = (
  element_name: string,
  component_key: string,
  css_class: string,
  preview_text: string,
): MyWorldRuleSeed => ({
  section: 'myworld',
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
  preview_text: string,
): MyWorldRuleSeed => ({
  section: 'myworld',
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
 * Seed sezione Design System «MyWorld Style» — valori dal riferimento Valigia (MySpaceToolsRoot).
 * Persistiti in design_system_rules con section: 'myworld' (stessa SoT del Design System).
 */
export const MYWORLD_DESIGN_RULES: MyWorldRuleSeed[] = [
  shell(
    'Barra header sezione',
    'myworld_section_header_bar',
    'shrink-0 rounded-xl border border-slate-800/80 bg-slate-950/40 px-3 py-2.5 mb-3',
    'Header sezione',
  ),
  typeRule(
    'Titolo sezione',
    'myworld_section_title',
    {
      font_family: 'font-sans',
      text_size: 'text-sm',
      font_weight: 'font-bold',
      color_class: 'text-white',
    },
    'Valigia',
  ),
  shell(
    'Icona titolo sezione',
    'myworld_section_icon',
    'w-4 h-4 text-indigo-300 shrink-0',
    'Icona',
  ),
  typeRule(
    'Descrizione sezione',
    'myworld_section_description',
    {
      css_class: 'text-[11px] text-slate-500 mt-1 leading-snug',
    },
    'Le tue valigie e i template, pronti da aprire quando ti servono.',
  ),
  shell(
    'Pannello sezione',
    'myworld_section_panel',
    'flex flex-col min-h-0 rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden',
    'Pannello',
  ),
  shell(
    'Header pannello colonna',
    'myworld_panel_header',
    'shrink-0 flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-800/80',
    'Header pannello',
  ),
  shell(
    'Riga lista',
    'myworld_list_row',
    'flex items-stretch gap-1 rounded-xl border border-slate-800 bg-slate-900/60',
    'Riga',
  ),
  typeRule(
    'Titolo riga lista',
    'myworld_list_title',
    {
      css_class: 'block text-sm font-semibold text-white truncate',
    },
    'Nome elemento',
  ),
  typeRule(
    'Meta riga lista',
    'myworld_list_meta',
    {
      css_class: 'block text-[10px] text-slate-500 mt-0.5',
    },
    'Apri valigia',
  ),
  shell(
    'Pulsante chrome (Nuova / azione)',
    'myworld_chrome_btn',
    'inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50',
    'Nuova',
  ),
];
