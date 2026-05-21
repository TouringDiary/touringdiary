export interface StyleRule {
    component_key: string;
    element_name?: string;
    section?: string | null;
    css_class?: string | null;
    font_family?: string | null;
    text_size?: string | null;
    font_weight?: string | null;
    text_transform?: string | null;
    tracking?: string | null;
    color_class?: string | null;
    effect_class?: string | null;
    preview_text?: string | null;


    // --- Editor & Preview Enhancements ---
    /** 
     * Determines the type of preview to render in the admin editor.
     * 'text': Renders a simple 'Sample' text (default).
     * 'html': Renders a block of HTML content, useful for typography previews.
     * @default 'text'
     */
    preview_type?: 'text' | 'html';

    /**
     * The HTML content to be used for 'html' type previews.
     * Ignored if preview_type is 'text'.
     */
    preview_content?: string;

    /**
     * Defines the size of the preview container in the editor.
     * 'small': A compact, single-line height (default).
     * 'large': A taller container for multi-line or complex HTML previews.
     * @default 'small'
     */
    preview_size?: 'small' | 'large';
}
