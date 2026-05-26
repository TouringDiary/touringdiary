/**
 * StyleRule mappa esattamente la tabella Supabase `design_system_rules`.
 * Ogni campo corrisponde a una colonna reale nel DB.
 *
 * Regole di questo file:
 * - Solo proprietà persistite nel DB
 * - Nessun metadato client-only (→ admin/design/editorTypes.ts)
 * - Nessun token array (→ data/system/designTokens.ts)
 * - Nessuna logica di rendering
 */
export interface StyleRule {
    // --- Identità ---
    component_key: string;
    element_name?: string;
    section?: string | null;

    /**
     * Utility / layout classes (alias concettuale: utility_class).
     * Padding, margin, sizing, radius, flex, shadow strutturali, ecc.
     * NON usare i campi typography per queste classi.
     * constructClassName: se valorizzato, combina css_class + color_class + effect_class.
     */
    css_class?: string | null;

    // --- Typography tokens ---
    font_family?: string | null;
    text_size?: string | null;
    font_weight?: string | null;
    /** leading-* tokens. Richiede migration DB: ALTER TABLE design_system_rules ADD COLUMN line_height text */
    line_height?: string | null;
    /** Valori sentinella: 'none' escluso dall'output CSS da constructClassName */
    text_transform?: string | null;
    tracking?: string | null;

    /**
     * Color token. Usato sia per text-* (caso standard) che per bg-* (journey_line_*).
     * La separazione semantica text-color / background-color richiede una migration DB futura.
     */
    color_class?: string | null;

    /** Valore sentinella 'none' = nessun effetto, escluso dall'output CSS da constructClassName */
    effect_class?: string | null;

    /** Testo mostrato come preview nell'editor. Unico campo preview persistito nel DB. */
    preview_text?: string | null;
}
