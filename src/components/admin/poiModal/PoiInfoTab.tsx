
import React, { useMemo } from 'react';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { PointOfInterest } from '../../../types/index';
import { AiFieldHelper } from '../AiFieldHelper';
import { getCachedSetting, SETTINGS_KEYS } from '../../../services/settingsService';

export interface PoiInfoTabProps {
    formData: PointOfInterest;
    updateField: (field: keyof PointOfInterest, value: any) => void;
}

export const PoiInfoTab = ({ formData, updateField }: PoiInfoTabProps) => {

    const toggleDay = (day: string) => {
        const currentDays = formData.openingHours?.days || [];
        let newDays;
        if (currentDays.includes(day)) {
            newDays = currentDays.filter(d => d !== day);
        } else {
            // Keep correct sort order
            const fullWeek = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
            newDays = fullWeek.filter(d => currentDays.includes(d) || d === day);
        }
        updateField('openingHours', { ...formData.openingHours, days: newDays });
    };

    const updateTime = (key: 'morning' | 'afternoon', val: string) => {
        updateField('openingHours', { ...formData.openingHours, [key]: val });
    };

    // CALCOLO REATTIVO CATEGORIE DA CACHE DB
    const categories = useMemo(() => {
        return getCachedSetting<any[]>(SETTINGS_KEYS.POI_CATEGORIES_CONFIG) || [
            { value: 'monument', label: 'Destinazioni' },
            { value: 'food', label: 'Cibo' },
            { value: 'hotel', label: 'Hotel' },
            { value: 'nature', label: 'Natura' },
            { value: 'leisure', label: 'Svago' },
            { value: 'shop', label: 'Shopping' },
            { value: 'discovery', label: 'Novità' }
        ];
    }, []);

    // CALCOLO REATTIVO SOTTOCATEGORIE DA CACHE DB
    const availableSubCats = useMemo(() => {
        const catKey = (formData.category || 'discovery').toLowerCase();
        // Lettura dinamica dalla cache caricata all'avvio
        const structure = getCachedSetting<Record<string, { value: string, label: string }[]>>(SETTINGS_KEYS.POI_STRUCTURE);
        // Usa una struttura flat per il mapping semplice valore->label se la struttura complessa non matcha
        // Qui assumiamo che structure sia già un array di oggetti {value, label} per semplicità, o adattiamo.
        // Nel DB, la struttura è complessa { label: "...", items: [...] }. Dobbiamo appiattirla.
        
        const advancedStructure = getCachedSetting<Record<string, any[]>>(SETTINGS_KEYS.POI_ADVANCED_STRUCTURE);
        if (advancedStructure && advancedStructure[catKey]) {
            // Appiattisci i gruppi per ottenere una lista semplice di opzioni
            const flatOptions: {value: string, label: string}[] = [];
            advancedStructure[catKey].forEach(group => {
                group.items.forEach((item: string) => {
                    flatOptions.push({ value: item, label: item.replace(/_/g, ' ') }); // Fallback label semplice
                });
            });
            return flatOptions;
        }

        return structure ? (structure[catKey] || []) : [];
    }, [formData.category]);
    
    const renderDayButton = (day: string) => {
        const isActive = (formData.openingHours?.days || []).includes(day);
        return (
            <button 
                key={day} 
                onClick={() => toggleDay(day)}
                className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all flex-1 ${isActive ? 'bg-indigo-600 text-white shadow' : 'bg-slate-950 text-slate-500 border border-slate-700 hover:bg-slate-800'}`}
            >
                {day}
            </button>
        );
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nome Luogo</label>
                    <input 
                        type="text" 
                        value={formData.name} 
                        onChange={e => updateField('name', e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Categoria</label>
                    <select 
                        value={formData.category} 
                        onChange={e => { updateField('category', e.target.value); updateField('subCategory', ''); }} 
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none"
                    >
                        <option value="">Seleziona...</option>
                        {categories.map((c: any) => <option key={c.id || c.value} value={c.id || c.value}>{c.label}</option>)}
                    </select>
                </div>
            </div>
            
            {/* NEW: Tourism Interest Field */}
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 animate-in fade-in">
                 <div className="flex justify-between items-center mb-2">
                     <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-fuchsia-500"/> Livello Interesse Turistico
                    </label>
                    <span className="text-[10px] text-slate-600 italic">Proporzionale alla città</span>
                 </div>
                 <div className="flex gap-2">
                     <button 
                        onClick={() => updateField('tourismInterest', 'high')} 
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${formData.tourismInterest === 'high' ? 'bg-fuchsia-600 text-white shadow-lg' : 'bg-slate-950 text-slate-500 border border-slate-700'}`}
                    >
                        Alto (Top 10)
                    </button>
                    <button 
                        onClick={() => updateField('tourismInterest', 'medium')} 
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${formData.tourismInterest === 'medium' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-950 text-slate-500 border border-slate-700'}`}
                    >
                        Medio (Popolare)
                    </button>
                    <button 
                        onClick={() => updateField('tourismInterest', 'low')} 
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${formData.tourismInterest === 'low' ? 'bg-slate-600 text-white shadow-lg' : 'bg-slate-950 text-slate-500 border border-slate-700'}`}
                    >
                        Basso (Nicchia)
                    </button>
                 </div>
            </div>
            
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 animate-in fade-in">
                <label className="text-xs font-bold text-indigo-400 uppercase block mb-2">Sottocategoria (Obbligatoria)</label>
                
                {availableSubCats.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                        {availableSubCats.map((sub: any) => (
                            <button 
                                key={sub.value} 
                                onClick={() => updateField('subCategory', sub.value)} 
                                className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase text-left transition-all border ${formData.subCategory === sub.value ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                            >
                                {sub.label}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="p-4 text-center border-2 border-dashed border-slate-700 rounded-lg text-slate-500 text-xs italic">
                        {formData.category ? 'Nessuna sottocategoria disponibile per questa selezione.' : 'Seleziona prima una Categoria.'}
                    </div>
                )}
                
                {!formData.subCategory && availableSubCats.length > 0 && (
                    <p className="text-red-500 text-[10px] mt-2 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Seleziona una sottocategoria.</p>
                )}
            </div>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <label className="text-xs font-bold text-slate-500 uppercase block mb-3">Orari di Apertura</label>
                
                <div className="flex flex-col gap-2 mb-4">
                     <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-500 uppercase w-12 text-right">Feriali</span>
                        <div className="flex gap-1 flex-1">
                            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven'].map(day => renderDayButton(day))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-500 uppercase w-12 text-right">Weekend</span>
                        <div className="flex gap-1 flex-1">
                            {['Sab', 'Dom'].map(day => renderDayButton(day))}
                            <div className="flex-1 opacity-0"></div> 
                            <div className="flex-1 opacity-0"></div>
                            <div className="flex-1 opacity-0"></div>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t border-slate-800/50 pt-4">
                     <div>
                        <label className="text-[10px] text-slate-500 font-bold block mb-1">Mattina / Continuato</label>
                        <input 
                            type="text" 
                            placeholder="Es. 09:00 - 13:00" 
                            value={formData.openingHours?.morning || ''} 
                            onChange={e => updateTime('morning', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold block mb-1">Pomeriggio</label>
                        <input 
                            type="text" 
                            placeholder="Es. 16:00 - 20:00" 
                            value={formData.openingHours?.afternoon || ''} 
                            onChange={e => updateTime('afternoon', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono"
                        />
                    </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 italic">Per orario continuato, compila solo il primo campo.</p>
            </div>

            <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Descrizione</label>
                <textarea 
                    value={formData.description} 
                    onChange={e => updateField('description', e.target.value)} 
                    rows={4} 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none resize-none" 
                />
                <AiFieldHelper 
                    contextLabel="descrizione turistica" 
                    onApply={(val) => updateField('description', val)} 
                    currentValue={formData.description} 
                />
            </div>
        </div>
    );
};
