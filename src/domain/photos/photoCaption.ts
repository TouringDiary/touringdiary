/**
 * Live Feed stores optional street as: `${caption} (${street})`.
 * Split back for promote / edit prefill.
 */
export function splitCaptionAndStreet(description: string | undefined | null): {
    caption: string;
    street: string;
} {
    const raw = (description || '').trim();
    if (!raw) return { caption: '', street: '' };

    const match = raw.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    if (match) {
        return { caption: match[1].trim(), street: match[2].trim() };
    }
    return { caption: raw, street: '' };
}

export function joinCaptionAndStreet(caption: string, street: string): string {
    const c = caption.trim();
    const s = street.trim();
    return s ? `${c} (${s})` : c;
}
