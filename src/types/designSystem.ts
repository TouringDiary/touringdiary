export interface StyleRule {
    section?: string;
    component_key?: string;

    base?: any;
    hover?: any;

    font_family: string;
    text_size: string;
    font_weight: string;
    text_transform: string;
    tracking: string;
    color_class: string;
    effect_class: string;
    preview_text: string;
    css_class?: string;

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
