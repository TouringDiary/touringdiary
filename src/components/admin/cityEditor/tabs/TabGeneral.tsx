
import React, { useState } from 'react';
import { Globe, FileText, MapPin, Eye, Link, Sparkles, Loader2, RefreshCw, Award, Wand2, Search, ExternalLink } from 'lucide-react';
import { useCityEditor } from '@/context/CityEditorContext';
import { generateSingleField, generateCitySection } from '../../../../services/ai';
import { saveCityDetails } from '../../../../services/cityService';
import { AiFieldHelper } from '../../AiFieldHelper';
import { BadgeType } from '../../../../types/index';
import { openMap } from '../../../../utils/common';
import { DeleteConfirmationModal } from '../../../common/DeleteConfirmationModal';

const BADGE_OPTIONS: { value: BadgeType, label: string }[] = [
    { value: 'event', label: '🔥 EVENTI IN ARRIVO' },
    { value: 'trend', label: '📈 TREND DEL MESE' },
    { value: 'season', label: '☀️ STAGIONE IDEALE' },
    { value: 'editor', label: '💎 SCELTA EDITORIALE' },
    { value: 'destination', label: '🏆 DESTINAZIONE TOP' }
];

export const TabGeneral = () => {
    const { city, setCityDirectly, updateField, updateDetailField, updateCoord, triggerPreview, reloadCurrentCity } = useCityEditor();
    
    const [generating, setGenerating] = useState(false);
    const [fieldLoading, setFieldLoading] = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    if (!city) return null;

    const handleRegenerateClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!city.name) { 
            alert("ERRORE: Inserisci prima il nome della città!"); 
            return; 
        }
        
        setShowConfirmModal(true);
    };

    const executeRegeneration = async () => {
        setShowConfirmModal(false);
        setGenerating(true);
        
        try {
            const [generalData, statsData] = await Promise.all([
                generateCitySection(city.name, 'general'),
                generateCitySection(city.name, 'stats')
            ]);

            let updatedCity = { ...city };
            const newDetails = { ...updatedCity.details };

            if (generalData.subtitle) newDetails.subtitle = generalData.subtitle;
            if (generalData.description) updatedCity.description = generalData.description;
            if (generalData.lat && generalData.lng) updatedCity.coords = { lat: generalData.lat, lng: generalData.lng };
            if (generalData.zone) updatedCity.zone = generalData.zone;
            if (generalData.officialWebsite) newDetails.officialWebsite = generalData.officialWebsite;
            if (generalData.continent) updatedCity.continent = generalData.continent;
            if (generalData.nation) updatedCity.nation = generalData.nation;
            if (generalData.adminRegion) updatedCity.adminRegion = generalData.adminRegion;

            if (statsData.visitorsEstimate) updatedCity.visitors = statsData.visitorsEstimate;
            if (statsData.seasonalVisitors) newDetails.seasonalVisitors = statsData.seasonalVisitors;

            const newLog = `[${new Date().toISOString()}] ✅ Fine: Rigenerazione Pagina Generali (in 0s)`;
            newDetails.generationLogs = [...(newDetails.generationLogs || []), newLog];

            updatedCity.details = newDetails;
            
            await saveCityDetails(updatedCity);
            await new Promise(r => setTimeout(r, 1000));
            await reloadCurrentCity();
            
            alert("Pagina Generali rigenerata con successo! I dati sono aggiornati.");

        } catch (e: any) {
            console.error("ERRORE CRITICO RIGENERAZIONE:", e);
            alert(`Errore rigenerazione: ${e.message || e}`);
        } finally {
            setGenerating(false);
        }
    };

    const handleSingleGen = async (field: 'website' | 'coords' | 'hierarchy' | 'subtitle') => {
        if (!city.name) { alert("Inserisci nome città."); return; }
        setFieldLoading(field);
        try {
            const result = await generateSingleField(city.name, field);
            if (!result) throw new Error("No result");

            let updatedCity = { ...city };
            
            if (field === 'website') {
                updatedCity.details = { ...updatedCity.details, officialWebsite: result };
            } else if (field === 'coords') {
                updatedCity.coords = { lat: result.lat, lng: result.lng };
            } else if (field === 'subtitle') {
                updatedCity.details = { ...updatedCity.details, subtitle: result };
            } else if (field === 'hierarchy') {
                if (result.continent) updatedCity.continent = result.continent;
                if (result.nation) updatedCity.nation = result.nation;
                if (result.adminRegion) updatedCity.adminRegion = result.adminRegion;
                if (result.zone) updatedCity.zone = result.zone;
            }
            setCityDirectly(updatedCity);
            
        } catch (e) {
            alert("Errore AI Single Field.");
        } finally {
            setFieldLoading(null);
        }
    };

    // Safe accessors for nullable fields
    const description = city.description || '';
    const subtitle = city.details.subtitle || '';

    return (
        <div className="space-y-8 animate-in fade-in relative">
            <DeleteConfirmationModal 
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={executeRegeneration}
                title="Rigenerare Dati Generali?"
                message="ATTENZIONE: Questa operazione sovrascriverà i dati correnti (Descrizione, Statistiche, Coordinate, Sottotitolo) con nuovi contenuti generati dall'AI.\n\nSei sicuro di voler procedere?"
                confirmLabel="Sì, Rigenera"
                cancelLabel="Annulla"
                variant="info"
                icon={<RefreshCw className="w-8 h-8 text-indigo-500 animate-spin-slow"/>}
            />
            
            <div className="flex justify-end border-b border-slate-800 pb-4">
                <button 
                    onClick={handleRegenerateClick} 
                    disabled={generating}
                    className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs tracking-widest border border-rose-500"
                >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>}
                    {generating ? 'GENERAZIONE IN CORSO...' : 'RIGENERA PAGINA (GENERALI)'}
                </button>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl">
                <h4 className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Globe className="w-4 h-4"/> Nome e Gerarchia
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Nome Città</label>
                        <input 
                            value={city.name || ''} 
                            onChange={e => updateField('name', e.target.value)} 
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white text-lg font-bold focus:border-indigo-500 outline-none" 
                            placeholder="Es. Napoli"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5 flex justify-between">
                            Zona Turistica 
                            <button onClick={() => handleSingleGen('hierarchy')} disabled={!!fieldLoading} className="text-indigo-400 hover:text-white flex items-center gap-1">{fieldLoading === 'hierarchy' ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>} Auto-Detect</button>
                        </label>
                        <input 
                            value={city.zone || ''} 
                            onChange={e => updateField('zone', e.target.value)} 
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white font-bold focus:border-indigo-500 outline-none" 
                            placeholder="Es. Costiera Amalfitana"
                        />
                    </div>
                </div>

                <div className="mb-6 bg-slate-950/30 p-4 rounded-xl border border-slate-800/50">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5 flex justify-between items-center">
                        Slogan / Sottotitolo (Header)
                        <button onClick={() => handleSingleGen('subtitle')} disabled={!!fieldLoading} className="text-amber-500 hover:text-white flex items-center gap-1">{fieldLoading === 'subtitle' ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>} Genera</button>
                    </label>
                    <div className="relative">
                        <input 
                            value={subtitle} 
                            onChange={e => updateDetailField('subtitle', e.target.value)} 
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white text-base font-serif italic focus:border-amber-500 outline-none pr-10" 
                            placeholder="Es. Terra delle Sirene..."
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <AiFieldHelper 
                                contextLabel={`slogan turistico breve per ${city.name}`}
                                onApply={val => updateDetailField('subtitle', val)}
                                currentValue={subtitle}
                                compact={true}
                                fieldId="city_subtitle_ai"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Regione</label>
                        <input value={city.adminRegion || ''} onChange={e => updateField('adminRegion', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-300 text-sm focus:border-indigo-500 outline-none"/>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Nazione</label>
                        <input value={city.nation || ''} onChange={e => updateField('nation', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-300 text-sm focus:border-indigo-500 outline-none"/>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Continente</label>
                        <input value={city.continent || ''} onChange={e => updateField('continent', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-300 text-sm focus:border-indigo-500 outline-none"/>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl">
                <h4 className="text-sm font-black text-amber-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Award className="w-4 h-4"/> Visibilità & Badge
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-2">Badge Speciale (Home Page)</label>
                        <div className="relative">
                            <select 
                                value={city.specialBadge || ''} 
                                onChange={e => updateField('specialBadge', e.target.value || null)} 
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white appearance-none cursor-pointer focus:border-amber-500 outline-none font-bold uppercase"
                            >
                                <option value="">NESSUN BADGE</option>
                                {BADGE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 leading-relaxed italic">
                            Nota: I badge determinano in quale sezione della Home Page apparirà la città.
                        </p>
                    </div>

                    <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
                        <div>
                            <h5 className="font-bold text-white text-lg mb-1">In Evidenza (Featured)</h5>
                            <p className="text-slate-400 text-xs">Appare nei caroselli principali</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={city.isFeatured || false} onChange={e => updateField('isFeatured', e.target.checked)} className="sr-only peer"/>
                            <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl">
                 <h4 className="text-sm font-black text-emerald-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <MapPin className="w-4 h-4"/> Statistiche & Coordinate
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5 flex justify-between">
                            Posizione GPS
                            <div className="flex gap-2">
                                <button onClick={() => { if(city.coords.lat && city.coords.lng) openMap(city.coords.lat, city.coords.lng, city.name); }} className="text-indigo-400 hover:text-white flex items-center gap-1 border border-indigo-500/30 px-2 rounded"><ExternalLink className="w-3 h-3"/> Verifica Mappa</button>
                                <button onClick={() => handleSingleGen('coords')} disabled={!!fieldLoading} className="text-emerald-500 hover:text-white flex items-center gap-1">{fieldLoading === 'coords' ? <Loader2 className="w-3 h-3 animate-spin"/> : <Search className="w-3 h-3"/>} Trova GPS</button>
                            </div>
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="number" placeholder="Lat" value={city.coords.lat || ''} onChange={e => updateCoord('lat', e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono"/>
                            <input type="number" placeholder="Lng" value={city.coords.lng || ''} onChange={e => updateCoord('lng', e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono"/>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Visitatori Annuali (Stima)</label>
                        <input type="number" value={city.visitors || 0} onChange={e => updateField('visitors', parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono font-bold"/>
                        <p className="text-[10px] text-slate-500 mt-1">*Se vedi 0, usa "Compilazione Automatica" per stimare.</p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl">
                 <h4 className="text-sm font-black text-blue-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Link className="w-4 h-4"/> Sito Ufficiale
                </h4>
                 <div className="relative group">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors"/>
                    <input 
                        value={city.details.officialWebsite || ''} 
                        onChange={e => updateDetailField('officialWebsite', e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-12 pr-32 text-white focus:border-blue-500 outline-none"
                        placeholder="https://..."
                    />
                    <button 
                        onClick={() => handleSingleGen('website')} 
                        disabled={!!fieldLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-600 flex items-center gap-2"
                    >
                        {fieldLoading === 'website' ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>} Auto-Detect
                    </button>
                </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl">
                 <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-2">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <FileText className="w-4 h-4"/> Descrizione Card
                    </h4>
                    <button onClick={() => triggerPreview('card')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2"><Eye className="w-3 h-3"/> Anteprima</button>
                 </div>
                 
                 <p className="text-slate-500 text-xs mb-3">Breve testo che appare nelle card della home page (max 150 caratteri).</p>
                 
                 <textarea 
                    rows={3} 
                    value={description} 
                    onChange={e => updateField('description', e.target.value)} 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-sm focus:border-indigo-500 outline-none resize-none leading-relaxed"
                    maxLength={200}
                />
                
                <div className="flex justify-between items-center mt-2">
                    <span className={`text-[10px] font-bold ${description.length > 150 ? 'text-red-500' : 'text-slate-500'}`}>{description.length}/200</span>
                    <AiFieldHelper 
                        contextLabel={`descrizione breve per card di ${city.name}`}
                        onApply={val => updateField('description', val)}
                        currentValue={description}
                        compact={true}
                    />
                </div>
            </div>
        </div>
    );
};
