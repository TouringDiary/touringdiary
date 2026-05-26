
import React from 'react';
import type { StyleRule } from '../../../types/designSystem';

import {
    FONT_TOKENS,
    SIZE_TOKENS,
    WEIGHT_TOKENS,
    TRACKING_TOKENS,
    COLOR_TOKENS,
    TRANSFORM_TOKENS,
    EFFECT_TOKENS,
} from '../../../data/system/designTokens';

interface Props {
    rule: StyleRule;
    onChange: (field: keyof StyleRule, value: string) => void;
}

export const StyleEditorForm = ({ rule, onChange }: Props) => {
    
    const SelectGroup = ({ label, value, options, field }: { label: string, value: string, options: readonly string[], field: keyof StyleRule }) => (
        <div>
            <label className="text-[10px] font-bold text-indigo-400 uppercase block mb-1.5">{label}</label>
            <select 
                value={value || ''} 
                onChange={e => onChange(field, e.target.value)} 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-indigo-500 transition-colors"
            >
                {options.map(o => (
      <option key={o} value={o}>
        {o}
       </option>
))}
            </select>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 grid grid-cols-2 md:grid-cols-3 gap-5">
                <SelectGroup label="Font Family" value={rule.font_family} options={FONT_TOKENS} field="font_family" />
                <SelectGroup label="Dimensione" value={rule.text_size || 'text-base'} options={SIZE_TOKENS} field="text_size" />
                <SelectGroup label="Peso (Boldness)" value={rule.font_weight || 'font-normal'} options={WEIGHT_TOKENS} field="font_weight" />
                <SelectGroup label="Spaziatura" value={rule.tracking || 'tracking-normal'} options={TRACKING_TOKENS} field="tracking" />
                <SelectGroup label="Colore" value={rule.color_class || 'text-white'} options={COLOR_TOKENS} field="color_class" />
                <SelectGroup label="Trasformazione" value={rule.text_transform || 'normal-case'} options={TRANSFORM_TOKENS} field="text_transform" />
                <SelectGroup label="Effetti" value={rule.effect_class || 'none'} options={EFFECT_TOKENS} field="effect_class" />
            </div>

            <div className="bg-indigo-900/10 border border-indigo-500/30 p-4 rounded-xl">
                <label className="text-[10px] font-black text-white uppercase block mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Contenuto Testuale (Salva nel DB)
                </label>
                <textarea 
                    rows={4}
                    value={rule.preview_text} 
                    onChange={e => onChange('preview_text', e.target.value)} 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500 resize-none leading-relaxed font-sans"
                    placeholder="Scrivi qui il testo che apparirà nel sito..."
                />
                <p className="text-[9px] text-slate-500 mt-2">
                    Modificando questo testo cambierai direttamente ciò che leggono gli utenti.
                </p>
            </div>
        </div>
    );
};
