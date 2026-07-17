-- =============================================================================
-- Seed tipografia Centro di Controllo (admin_cc_*) — Design System dinamico
-- Runtime: design_system_rules. Catalogo editoriale: designRules.ts (allineato).
-- Allineamento regole admin condivise (subtitle/btn/table) → 20260717190100.
--
-- AUDIT COERENZA DS Admin (pre-approvazione, 20260717)
-- Obiettivo: riusare regole Admin esistenti; creare admin_cc_* solo se indispensabili.
--
-- --- Già riutilizzate dal Centro di Controllo (NON seedate qui) ---
--   admin_btn_primary (+ _mobile)           → pulsante primario Salva
--   admin_section_card_subtitle (+ _mobile) → sottotitoli sezione / helper di contesto
--   admin_page_subtitle (+ _mobile)         → sottotitolo pagina / loading copy
--   admin_table_head (+ _mobile)            → intestazioni tabella audit
--   admin_table_cell (+ _mobile)            → celle tabella audit
--   admin_section_card_title / admin_page_* → titoli sezione/pagina via AdminSectionCard /
--                                             AdminPageHeader (componenti condivisi)
--
-- --- Candidati a consolidamento futuro (remap hook fuori scope di questa review) ---
--   admin_cc_stat_label ≈ admin_table_head (stessi token tipografici)
--   admin_cc_card_description / admin_cc_helper ≈ admin_section_card_subtitle
--   Remap richiederebbe cambio di usePlatformControlTypography → vietato qui
--   (nessuna modifica React / nessun cambio grafico in questa review).
--
-- --- Nuove component_key seedate qui (indispensabili o senza equivalente Admin) ---
--   admin_cc_card_title       titolo card flag (text-base, normal-case ≠ section title)
--   admin_cc_card_description descrizione card (token vicini a subtitle; ruolo UI distinto
--                             finché non si remappa l'hook)
--   admin_cc_field_label      label campo form CC (assente in Admin)
--   admin_cc_input            testo input/textarea (assente in Admin)
--   admin_cc_helper           testo secondario inline card (in attesa consolidamento subtitle)
--   admin_cc_mono_key         chiave tecnica monospace (assente in Admin)
--   admin_cc_action_link      azione testuale "Default" (≠ sidebar_link per size/transform)
--   admin_cc_success / error  feedback stato colorati (assenti in Admin)
--   admin_cc_tab              tab navigazione CC (≠ sidebar_link per transform/color)
--   admin_cc_badge            badge header "Solo lettura" (assente in Admin)
--   admin_cc_btn_secondary    bottone secondario (assente; primary già riusato)
--   admin_cc_value_emphasis   valore evidenziato (soglie, amber) (assente in Admin)
--   admin_cc_stat_label/value stats header CC (label ≈ table_head ma key dedicata finché
--                             non si remappa; value ≠ section_card_title per transform)
--   + varianti _mobile per ogni chiave (convenzione DS Admin esistente)
-- =============================================================================

INSERT INTO public.design_system_rules (
    section, element_name, component_key,
    font_family, text_size, font_weight, text_transform, tracking, color_class, effect_class, preview_text
) VALUES
    ('admin', 'CC — Titolo card flag', 'admin_cc_card_title', 'font-sans', 'text-base', 'font-bold', 'normal-case', 'tracking-normal', 'text-white', 'none', 'AI Utente'),
    ('admin', 'CC — Descrizione card', 'admin_cc_card_description', 'font-sans', 'text-sm', 'font-normal', 'normal-case', 'tracking-normal', 'text-slate-500', 'none', 'Controllo operativo piattaforma'),
    ('admin', 'CC — Etichetta campo', 'admin_cc_field_label', 'font-sans', 'text-xs', 'font-bold', 'uppercase', 'tracking-wider', 'text-slate-500', 'none', 'Messaggio utente'),
    ('admin', 'CC — Input / Textarea', 'admin_cc_input', 'font-sans', 'text-sm', 'font-normal', 'normal-case', 'tracking-normal', 'text-white', 'none', 'Testo messaggio…'),
    ('admin', 'CC — Helper / secondario', 'admin_cc_helper', 'font-sans', 'text-sm', 'font-normal', 'normal-case', 'tracking-normal', 'text-slate-500', 'none', 'Fonte: default'),
    ('admin', 'CC — Chiave tecnica', 'admin_cc_mono_key', 'font-mono', 'text-xs', 'font-normal', 'normal-case', 'tracking-normal', 'text-slate-600', 'none', 'feature.ai.users'),
    ('admin', 'CC — Azione link (Default)', 'admin_cc_action_link', 'font-sans', 'text-xs', 'font-bold', 'uppercase', 'tracking-wide', 'text-slate-400', 'none', 'Default'),
    ('admin', 'CC — Stato successo', 'admin_cc_success', 'font-sans', 'text-sm', 'font-medium', 'normal-case', 'tracking-normal', 'text-emerald-400', 'none', 'Salvato'),
    ('admin', 'CC — Stato errore', 'admin_cc_error', 'font-sans', 'text-sm', 'font-medium', 'normal-case', 'tracking-normal', 'text-rose-400', 'none', 'Salvataggio fallito'),
    ('admin', 'CC — Tab navigazione', 'admin_cc_tab', 'font-sans', 'text-sm', 'font-bold', 'uppercase', 'tracking-wide', 'text-slate-500', 'none', 'Manutenzione'),
    ('admin', 'CC — Badge header', 'admin_cc_badge', 'font-sans', 'text-xs', 'font-bold', 'uppercase', 'tracking-wider', 'text-amber-400', 'none', 'Solo lettura'),
    ('admin', 'CC — Bottone secondario', 'admin_cc_btn_secondary', 'font-sans', 'text-sm', 'font-bold', 'uppercase', 'tracking-wide', 'text-slate-300', 'none', 'Aggiorna'),
    ('admin', 'CC — Valore evidenziato', 'admin_cc_value_emphasis', 'font-sans', 'text-base', 'font-black', 'normal-case', 'tracking-normal', 'text-amber-300', 'none', '3★'),
    ('admin', 'CC — Stat label', 'admin_cc_stat_label', 'font-sans', 'text-xs', 'font-black', 'uppercase', 'tracking-widest', 'text-slate-500', 'none', 'Flag caricati'),
    ('admin', 'CC — Stat valore', 'admin_cc_stat_value', 'font-sans', 'text-lg', 'font-bold', 'normal-case', 'tracking-tight', 'text-white', 'none', '18'),
    ('admin', 'CC — Titolo card flag (Mobile)', 'admin_cc_card_title_mobile', 'font-sans', 'text-sm', 'font-bold', 'normal-case', 'tracking-normal', 'text-white', 'none', 'AI Utente'),
    ('admin', 'CC — Descrizione card (Mobile)', 'admin_cc_card_description_mobile', 'font-sans', 'text-xs', 'font-normal', 'normal-case', 'tracking-normal', 'text-slate-500', 'none', 'Controllo operativo'),
    ('admin', 'CC — Etichetta campo (Mobile)', 'admin_cc_field_label_mobile', 'font-sans', 'text-xs', 'font-bold', 'uppercase', 'tracking-wider', 'text-slate-500', 'none', 'Messaggio utente'),
    ('admin', 'CC — Input / Textarea (Mobile)', 'admin_cc_input_mobile', 'font-sans', 'text-sm', 'font-normal', 'normal-case', 'tracking-normal', 'text-white', 'none', 'Testo messaggio…'),
    ('admin', 'CC — Helper / secondario (Mobile)', 'admin_cc_helper_mobile', 'font-sans', 'text-xs', 'font-normal', 'normal-case', 'tracking-normal', 'text-slate-500', 'none', 'Fonte: default'),
    ('admin', 'CC — Chiave tecnica (Mobile)', 'admin_cc_mono_key_mobile', 'font-mono', 'text-xs', 'font-normal', 'normal-case', 'tracking-normal', 'text-slate-600', 'none', 'feature.ai.users'),
    ('admin', 'CC — Azione link (Mobile)', 'admin_cc_action_link_mobile', 'font-sans', 'text-xs', 'font-bold', 'uppercase', 'tracking-wide', 'text-slate-400', 'none', 'Default'),
    ('admin', 'CC — Stato successo (Mobile)', 'admin_cc_success_mobile', 'font-sans', 'text-sm', 'font-medium', 'normal-case', 'tracking-normal', 'text-emerald-400', 'none', 'Salvato'),
    ('admin', 'CC — Stato errore (Mobile)', 'admin_cc_error_mobile', 'font-sans', 'text-sm', 'font-medium', 'normal-case', 'tracking-normal', 'text-rose-400', 'none', 'Errore'),
    ('admin', 'CC — Tab navigazione (Mobile)', 'admin_cc_tab_mobile', 'font-sans', 'text-xs', 'font-bold', 'uppercase', 'tracking-wide', 'text-slate-500', 'none', 'Manutenzione'),
    ('admin', 'CC — Badge header (Mobile)', 'admin_cc_badge_mobile', 'font-sans', 'text-xs', 'font-bold', 'uppercase', 'tracking-wider', 'text-amber-400', 'none', 'Solo lettura'),
    ('admin', 'CC — Bottone secondario (Mobile)', 'admin_cc_btn_secondary_mobile', 'font-sans', 'text-xs', 'font-bold', 'uppercase', 'tracking-wide', 'text-slate-300', 'none', 'Aggiorna'),
    ('admin', 'CC — Valore evidenziato (Mobile)', 'admin_cc_value_emphasis_mobile', 'font-sans', 'text-sm', 'font-black', 'normal-case', 'tracking-normal', 'text-amber-300', 'none', '3★'),
    ('admin', 'CC — Stat label (Mobile)', 'admin_cc_stat_label_mobile', 'font-sans', 'text-xs', 'font-black', 'uppercase', 'tracking-widest', 'text-slate-500', 'none', 'Flag caricati'),
    ('admin', 'CC — Stat valore (Mobile)', 'admin_cc_stat_value_mobile', 'font-sans', 'text-base', 'font-bold', 'normal-case', 'tracking-tight', 'text-white', 'none', '18')
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
    updated_at = NOW();
