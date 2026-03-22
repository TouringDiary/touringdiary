import React from 'react';
import type { StyleRule } from '../../../types/designSystem';
import { constructClassName } from '../../../hooks/useDynamicStyles';

// --- Constanti per i controlli del Form ---
const FONTS = ['font-sans', 'font-serif', 'font-mono'];
const SIZES = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl'];
const WEIGHTS = ['font-thin', 'font-extralight', 'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold', 'font-black'];
const TRANSFORMS = ['normal-case', 'uppercase', 'lowercase', 'capitalize'];
const TRACKING = ['tracking-tighter', 'tracking-tight', 'tracking-normal', 'tracking-wide', 'tracking-wider', 'tracking-widest'];
const COLORS = ['text-transparent', 'text-black', 'text-white', 'text-slate-200', 'text-slate-300', 'text-slate-400', 'text-slate-500', 'text-gray-200', 'text-gray-500', 'text-gray-800', 'text-indigo-400', 'text-amber-500', 'text-red-500', 'text-green-500', 'text-yellow-500'];
const EFFECTS = ['none', 'effect-soft-glow', 'effect-hard-glow', 'effect-text-shadow'];

// --- Props del Componente ---
interface StyleEditorProps {
  rule: StyleRule;
  onChange: (updatedRule: StyleRule) => void;
}

// --- FIX 1: Componente Riutilizzabile per i menu a tendina (stile dark) ---
const SelectControl: React.FC<{ label: string; value: string; options: readonly string[]; onChange: (value: string) => void; }> = ({ label, value, options, onChange }) => (
    <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
        >
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

// --- Componente Principale ---
const StyleEditor: React.FC<StyleEditorProps> = ({ rule, onChange }) => {
    
    // Funzione generica per aggiornare un campo dello stile
    const handleFieldChange = (field: keyof StyleRule, value: string) => {
        onChange({ ...rule, [field]: value });
    };
    
    // Genera le classi CSS per l'anteprima in tempo reale
    const previewClassName = constructClassName(rule);

    if (!rule) {
        return <div className="p-6 text-center text-slate-400">Seleziona un componente da modificare.</div>;
    }

    // --- FIX 2: Funzione per renderizzare la preview corretta ---
    const renderPreview = () => {
        if (rule.section === 'typography') {
            const typographyContent = `
                <h1>Titolo pagina</h1>
                <h2>Sottotitolo sezione</h2>
                <p>Questo è un paragrafo di esempio per una pagina legale.</p>
                <ul>
                    <li>Voce elenco</li>
                    <li>Voce elenco</li>
                </ul>
            `;
            return (
                <div
                    className={`prose prose-invert max-w-none ${previewClassName}`}
                    dangerouslySetInnerHTML={{ __html: typographyContent }}
                />
            );
        }

        return (
            <span className={previewClassName}>
                {rule.preview_text || 'Sample Text'}
            </span>
        );
    };

    // --- FIX 1: Stile dark per il contenitore principale ---
    return (
        <div className="bg-slate-900 p-6 rounded-lg">
            
            {/* Sezione Anteprima Live */}
            <div className="mb-8">
                <h3 className="text-sm font-semibold text-slate-300 mb-2 border-b border-slate-700 pb-2">Live Preview</h3>
                <div className="bg-slate-800 p-8 rounded-lg flex items-center justify-center min-h-[150px] mt-4 border border-slate-700">
                    {renderPreview()}
                </div>
            </div>

            {/* Form per la Modifica delle Proprietà */}
            <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-4 border-b border-slate-700 pb-2">Style Properties</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Controlli Select (ora in stile dark) */}
                    <SelectControl label="Font Family" value={rule.font_family} options={FONTS} onChange={v => handleFieldChange('font_family', v)} />
                    <SelectControl label="Text Size" value={rule.text_size} options={SIZES} onChange={v => handleFieldChange('text_size', v)} />
                    <SelectControl label="Font Weight" value={rule.font_weight} options={WEIGHTS} onChange={v => handleFieldChange('font_weight', v)} />
                    <SelectControl label="Transform" value={rule.text_transform} options={TRANSFORMS} onChange={v => handleFieldChange('text_transform', v)} />
                    <SelectControl label="Spacing" value={rule.tracking} options={TRACKING} onChange={v => handleFieldChange('tracking', v)} />
                    <SelectControl label="Color Class" value={rule.color_class} options={COLORS} onChange={v => handleFieldChange('color_class', v)} />
                    <SelectControl label="Effect Class" value={rule.effect_class} options={EFFECTS} onChange={v => handleFieldChange('effect_class', v)} />

                    {/* Input per il testo di anteprima (ora in stile dark) */}
                    <div className="lg:col-span-3">
                         <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Preview Text</label>
                         <input
                            type="text"
                            value={rule.preview_text}
                            onChange={(e) => handleFieldChange('preview_text', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-sm text-slate-200 placeholder-slate-500 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Testo per l'anteprima..."
                         />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StyleEditor;
