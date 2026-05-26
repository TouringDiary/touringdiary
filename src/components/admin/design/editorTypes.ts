import type { StyleRule } from '../../../types/designSystem';

/**
 * Metadati client-only per il rendering preview nell'editor admin.
 * NON corrispondono a colonne nel DB e NON vengono persistiti.
 * Vivono esclusivamente in designRules.ts come metadati di seed.
 *
 * Non importare questo modulo in codice runtime:
 * hooks, services, context, componenti non-admin.
 */
export interface StyleRuleEditorMeta {
    /**
     * 'text': preview testo semplice su span (default).
     * 'html': preview HTML strutturato, usato per sezioni composite/typography.
     */
    preview_type?: 'text' | 'html';

    /**
     * Semantica del renderer preview.
     * Determina quale preview component usare nell'editor.
     * 'typography': preview testo semplice su span (default).
     * 'html': preview HTML strutturato, usato per sezioni composite/typography.
     */
    preview_kind?: 'typography';
    /** HTML da renderizzare per preview_type === 'html'. */
    preview_content?: string;
    /**
     * 'small': contenitore compatto h-10 (default).
     * 'large': contenitore h-48 per preview multi-riga o HTML complesso.
     */
    preview_size?: 'small' | 'large';
}

/**
 * Tipo usato in designRules.ts per il seed iniziale:
 * regola DB completa + metadati editor opzionali.
 * Non usare come tipo di parametro in componenti runtime.
 */
export type StyleRuleWithMeta = StyleRule & StyleRuleEditorMeta;
