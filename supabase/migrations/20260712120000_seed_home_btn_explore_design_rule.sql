-- =============================================================================
-- MIGRATION: 20260712120000_seed_home_btn_explore_design_rule.sql
-- DESCRIZIONE: Seed runtime per btn_explore (Pulsante ESPLORA sezioni Home).
--              designRules.ts è documentazione editoriale — il runtime legge solo
--              design_system_rules in Supabase.
-- SICUREZZA:   ON CONFLICT (component_key) DO UPDATE — allinea css_class se assente
--              o obsoleto, senza toccare altre regole home.
-- =============================================================================

INSERT INTO public.design_system_rules (
    section,
    element_name,
    component_key,
    css_class,
    font_family,
    text_size,
    font_weight,
    text_transform,
    tracking,
    color_class,
    effect_class,
    preview_text
)
VALUES (
    'home',
    'Pulsante ESPLORA (sezioni)',
    'btn_explore',
    'text-[10px] bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-amber-600 active:border-amber-500 transition-colors inline-flex items-center justify-center gap-1.5 uppercase font-bold tracking-wide group shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-[0.98]',
    '',
    NULL,
    NULL,
    'none',
    NULL,
    NULL,
    'none',
    'ESPLORA'
)
ON CONFLICT (component_key) DO UPDATE SET
    section = EXCLUDED.section,
    element_name = EXCLUDED.element_name,
    css_class = EXCLUDED.css_class,
    preview_text = EXCLUDED.preview_text,
    updated_at = NOW();
