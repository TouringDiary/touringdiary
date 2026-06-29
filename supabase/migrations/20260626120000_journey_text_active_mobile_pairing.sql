-- =============================================================================
-- MIGRATION: 20260626120000_journey_text_active_mobile_pairing.sql
-- DESCRIZIONE: Uniforma "Testo Fase (Attivo)" al pattern Desktop/Mobile del
--              Design System. Crea journey_text_active_mobile come coppia di
--              journey_text_active (stessi valori di journey_text_mobile),
--              così l'Admin mostra/abilita il Mobile sulla stessa riga.
-- SICUREZZA:   UPSERT su component_key — non distruttivo.
--              journey_text_mobile NON viene rimosso: resta per
--              retrocompatibilità durante la migrazione (client in cache).
--              La sua rimozione è un cleanup opzionale successivo.
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
    effect_class,
    preview_text
)
VALUES
    (
        'journey',
        'Testo Fase (Attivo) (Mobile)',
        'journey_text_active_mobile',
        'font-sans',
        'text-xs',
        'font-black',
        'uppercase',
        'tracking-widest',
        'text-white',
        'drop-shadow-md',
        'SCOPERTA'
    )
ON CONFLICT (component_key) DO UPDATE SET
    section = EXCLUDED.section,
    element_name = EXCLUDED.element_name,
    font_family = EXCLUDED.font_family,
    text_size = EXCLUDED.text_size,
    font_weight = EXCLUDED.font_weight,
    text_transform = EXCLUDED.text_transform,
    tracking = EXCLUDED.tracking,
    color_class = EXCLUDED.color_class,
    effect_class = EXCLUDED.effect_class,
    preview_text = EXCLUDED.preview_text,
    updated_at = now();
