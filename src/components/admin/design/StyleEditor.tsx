import React, { useEffect, useMemo, useState } from 'react';
import type { StyleRule } from '../../../types/designSystem';
import {
    FONT_TOKENS,
    SIZE_TOKENS,
    WEIGHT_TOKENS,
    LINE_HEIGHT_TOKENS,
    TRANSFORM_TOKENS,
    TRACKING_TOKENS,
    COLOR_TOKENS,
    EFFECT_TOKENS,
    UTILITY_CSS_PRESETS,
} from '../../../data/system/designTokens';
import { sanitizeUtilityCssClass, validateUtilityCssClass } from './utilityCssValidation';

// --- Props ---

interface StyleEditorProps {
    rule: StyleRule;
    onChange: (updatedRule: StyleRule) => void;
}

// --- SelectControl ---
//
// Rimane sempre controllato. Se il valore corrente non è nel registry registrato
// (token custom, valore legacy, token fuori standard), viene aggiunto dinamicamente
// come prima opzione con un indicatore visivo esplicito sul label.
// Il valore è preservato intatto: nessuna coercizione, nessun blocco del save.

interface SelectControlProps {
    label: string;
    value: string;
    options: readonly string[];
    onChange: (value: string) => void;
}

const SelectControl: React.FC<SelectControlProps> = ({ label, value, options, onChange }) => {
    const isCustom = Boolean(value && !options.includes(value));

    return (
        <div>
            <div className="flex items-center gap-1.5 mb-1">
                <label className="text-xs font-semibold text-slate-400 uppercase">{label}</label>
                {isCustom && (
                    <span
                        className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-400 border border-amber-700/50"
                        title={`"${value}" non è nel registry standard dei token`}
                    >
                        custom
                    </span>
                )}
            </div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
            >
                {isCustom && (
                    <option value={value}>{value}</option>
                )}
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </div>
    );
};

// --- StyleEditor (pure form component) ---
//
// Responsabilità: modificare i token di uno StyleRule tramite form controls.
// NON gestisce preview — la preview live è responsabilità di ComponentPreviewHost,
// orchestrata da SideEditorPanel in DesignSystemSettings.

const StyleEditor: React.FC<StyleEditorProps> = ({ rule, onChange }) => {
    const [utilityDraft, setUtilityDraft] = useState(rule?.css_class ?? '');
    const [utilityError, setUtilityError] = useState<string | null>(null);

    useEffect(() => {
        setUtilityDraft(rule?.css_class ?? '');
        setUtilityError(null);
    }, [rule?.component_key, rule?.css_class]);

    const utilityClasses = useMemo(
        () => (rule?.css_class ?? '').trim().split(/\s+/).filter(Boolean),
        [rule?.css_class],
    );

    if (!rule) {
        return (
            <div className="p-6 text-center text-slate-400">
                Seleziona un componente da modificare.
            </div>
        );
    }

    const handleFieldChange = (field: keyof StyleRule, value: string) => {
        onChange({ ...rule, [field]: value });
    };

    // Comportamento intenzionale: draft invalido su blur → ripristina il valore persistito (rule.css_class),
    // senza propagare onChange. Non rimuovere: evita regressioni UX (commit parziale / valore corrotto).
    const commitUtilityDraft = (raw: string) => {
        const sanitized = sanitizeUtilityCssClass(raw);
        const validation = validateUtilityCssClass(sanitized);
        if (!validation.valid) {
            setUtilityError(validation.message ?? 'Utility non valida');
            setUtilityDraft(rule.css_class ?? '');
            return;
        }
        setUtilityError(null);
        setUtilityDraft(sanitized);
        handleFieldChange('css_class', sanitized);
    };

    const applyUtilityClasses = (classes: string[]) => {
        commitUtilityDraft(classes.join(' '));
    };

    const handleUtilityInput = (value: string) => {
        setUtilityDraft(value);
        const validation = validateUtilityCssClass(value);
        setUtilityError(validation.valid ? null : (validation.message ?? 'Utility non valida'));
    };

    const toggleUtilityPreset = (preset: string) => {
        const next = utilityClasses.includes(preset)
            ? utilityClasses.filter(c => c !== preset)
            : [...utilityClasses, preset];
        applyUtilityClasses(next);
    };

    return (
        <div className="bg-slate-900 p-6 rounded-lg space-y-8">
            <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-4 border-b border-slate-700 pb-2">
                    Typography
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <SelectControl
                        label="Font Family"
                        value={rule.font_family ?? ''}
                        options={FONT_TOKENS}
                        onChange={v => handleFieldChange('font_family', v)}
                    />
                    <SelectControl
                        label="Text Size"
                        value={rule.text_size ?? ''}
                        options={SIZE_TOKENS}
                        onChange={v => handleFieldChange('text_size', v)}
                    />
                    <SelectControl
                        label="Font Weight"
                        value={rule.font_weight ?? ''}
                        options={WEIGHT_TOKENS}
                        onChange={v => handleFieldChange('font_weight', v)}
                    />
                    <SelectControl
                        label="Line Height"
                        value={rule.line_height ?? ''}
                        options={LINE_HEIGHT_TOKENS}
                        onChange={v => handleFieldChange('line_height', v)}
                    />
                    <SelectControl
                        label="Transform"
                        value={rule.text_transform ?? ''}
                        options={TRANSFORM_TOKENS}
                        onChange={v => handleFieldChange('text_transform', v)}
                    />
                    <SelectControl
                        label="Letter Spacing"
                        value={rule.tracking ?? ''}
                        options={TRACKING_TOKENS}
                        onChange={v => handleFieldChange('tracking', v)}
                    />
                    <SelectControl
                        label="Color"
                        value={rule.color_class ?? ''}
                        options={COLOR_TOKENS}
                        onChange={v => handleFieldChange('color_class', v)}
                    />
                    <SelectControl
                        label="Effect"
                        value={rule.effect_class ?? ''}
                        options={EFFECT_TOKENS}
                        onChange={v => handleFieldChange('effect_class', v)}
                    />
                </div>
            </div>

            <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-4 border-b border-slate-700 pb-2">
                    Utility Classes (css_class)
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                    Layout, spacing, sizing e radius. Non usare i campi typography per utility Tailwind.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                    {UTILITY_CSS_PRESETS.map(preset => {
                        const active = utilityClasses.includes(preset);
                        return (
                            <button
                                key={preset}
                                type="button"
                                onClick={() => toggleUtilityPreset(preset)}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-colors ${active ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                            >
                                {preset}
                            </button>
                        );
                    })}
                </div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                    css_class
                </label>
                <input
                    type="text"
                    value={utilityDraft}
                    onChange={(e) => handleUtilityInput(e.target.value)}
                    onBlur={(e) => commitUtilityDraft(e.target.value)}
                    placeholder="es. shrink-0 mb-2 p-3 rounded-xl w-8 h-8"
                    className={`w-full bg-slate-800 border rounded-md p-2 text-sm text-slate-200 font-mono placeholder-slate-500 focus:ring-indigo-500 focus:border-indigo-500 ${utilityError ? 'border-red-500' : 'border-slate-700'}`}
                />
                {utilityError ? (
                    <p className="text-xs text-red-400 mt-1">{utilityError}</p>
                ) : (
                    <p className="text-[10px] text-slate-500 mt-1">
                        Bloccati: position, z-index, overflow, transform, valori arbitrari [...]
                    </p>
                )}
            </div>

            <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                    Preview Text
                </label>
                <input
                    type="text"
                    value={rule.preview_text ?? ''}
                    onChange={(e) => handleFieldChange('preview_text', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-sm text-slate-200 placeholder-slate-500 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Testo per l'anteprima..."
                />
            </div>
        </div>
    );
};

export default StyleEditor;
