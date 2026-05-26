/**
 * Validazione conservativa per css_class nel Design System editor.
 * Solo editor admin — non importare in runtime hooks/services.
 */

const BLOCKED_PATTERNS: RegExp[] = [
    /\bfixed\b/,
    /\babsolute\b/,
    /\bsticky\b/,
    /\brelative\b/,
    /\binset-/,
    /\btop-/,
    /\bleft-/,
    /\bright-/,
    /\bbottom-/,
    /\bz-\[/,
    /\bz-\d/,
    /\boverflow-/,
    /\btranslate-/,
    /\bscale-/,
    /\brotate-/,
    /\bskew-/,
    /\btransform\b/,
    /\bopacity-/,
    /\bbackdrop-/,
    /\bblur-/,
    /\bfilter\b/,
    /\b\[/, // arbitrary values
];

const ALLOWED_CLASS = /^[a-z0-9:/_-]+$/;

export const validateUtilityCssClass = (raw: string): { valid: boolean; message?: string } => {
    const value = raw.trim();
    if (!value) {
        return { valid: true };
    }

    const classes = value.split(/\s+/).filter(Boolean);

    for (const cls of classes) {
        if (!ALLOWED_CLASS.test(cls)) {
            return { valid: false, message: `Classe non valida: "${cls}"` };
        }

        for (const pattern of BLOCKED_PATTERNS) {
            if (pattern.test(cls)) {
                return { valid: false, message: `Classe non permessa: "${cls}"` };
            }
        }
    }

    return { valid: true };
};

export const sanitizeUtilityCssClass = (raw: string): string =>
    raw.trim().split(/\s+/).filter(Boolean).join(' ');
