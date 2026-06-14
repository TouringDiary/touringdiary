-- =============================================================================
-- MIGRATION: 20260610120000_seed_suitcase_design_system_rules.sql
-- DESCRIZIONE: Seed additivo delle regole Design System per la sezione Valigia
--              (suitcase). Inserisce 4 token desktop + 4 token mobile.
-- SICUREZZA:   Solo INSERT. ON CONFLICT (component_key) DO NOTHING.
--              Nessuna modifica a righe esistenti.
-- =============================================================================

INSERT INTO public.design_system_rules (
    section,
    element_name,
    component_key,
    font_family,
    text_size,
    font_weight,
    text_transform,
    tracking,
    color_class,
    line_height,
    effect_class,
    preview_text
)
VALUES
    -- --- SUITCASE (DESKTOP) ---
    (
        'suitcase',
        'Titolo Modal AI',
        'suitcase_title',
        'font-sans',
        'text-xl',
        'font-bold',
        'normal-case',
        'tracking-normal',
        'text-white',
        'leading-none',
        'none',
        'Suggerimenti AI'
    ),
    (
        'suitcase',
        'Nome Oggetto Suggerito',
        'suitcase_item_primary',
        'font-sans',
        'text-base',
        'font-bold',
        'normal-case',
        'tracking-normal',
        'text-white',
        'leading-none',
        'none',
        'Infradito'
    ),
    (
        'suitcase',
        'Label Sezioni / Header',
        'suitcase_label_caps',
        'font-sans',
        'text-[11px]',
        'font-black',
        'uppercase',
        'tracking-widest',
        'text-slate-300',
        'leading-none',
        'none',
        'CATEGORIE SELEZIONATE'
    ),
    (
        'suitcase',
        'Testo Supporto / Microcopy',
        'suitcase_text_support',
        'font-sans',
        'text-[11px]',
        'font-medium',
        'normal-case',
        'tracking-normal',
        'text-slate-400',
        'leading-normal',
        'none',
        'Seleziona le categorie per cui desideri ricevere suggerimenti.'
    ),

    -- --- SUITCASE (MOBILE) ---
    (
        'suitcase',
        'Titolo Modal AI (Mob)',
        'suitcase_title_mobile',
        'font-sans',
        'text-xl',
        'font-bold',
        'normal-case',
        'tracking-normal',
        'text-white',
        'leading-none',
        'none',
        'Suggerimenti AI'
    ),
    (
        'suitcase',
        'Nome Oggetto (Mob)',
        'suitcase_item_primary_mobile',
        'font-sans',
        'text-base',
        'font-bold',
        'normal-case',
        'tracking-normal',
        'text-white',
        'leading-none',
        'none',
        'Infradito'
    ),
    (
        'suitcase',
        'Label Sezioni (Mob)',
        'suitcase_label_caps_mobile',
        'font-sans',
        'text-[11px]',
        'font-black',
        'uppercase',
        'tracking-widest',
        'text-slate-300',
        'leading-none',
        'none',
        'CATEGORIE SELEZIONATE'
    ),
    (
        'suitcase',
        'Testo Supporto (Mob)',
        'suitcase_text_support_mobile',
        'font-sans',
        'text-[11px]',
        'font-medium',
        'normal-case',
        'tracking-normal',
        'text-slate-400',
        'leading-normal',
        'none',
        'Seleziona le categorie...'
    )
ON CONFLICT (component_key) DO NOTHING;
