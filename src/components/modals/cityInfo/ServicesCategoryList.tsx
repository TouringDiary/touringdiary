
import React from 'react';
import { Plus, Info, MapPin, ArrowLeft, Phone, Globe, Check, Box, Lightbulb, Pencil, Ban, Flame, Shield, ShieldAlert, HeartPulse, TrainFront, LandPlot } from 'lucide-react';
import { CityService, SuggestionType } from '../../../types/index';
import { getServicesConfig } from '../../../constants/services';

interface ServicesCategoryListProps {
    servicesList: CityService[];
    activeServiceCategory: string;
    expandedServiceId: string | null;
    onToggleExpand: (id: string) => void;
    isItemInItinerary: (id: string) => boolean;
    onAddToItinerary: (e: React.MouseEvent, service: CityService) => void;
    onOpenSuggestion: (type: SuggestionType, prefilledName?: string) => void;
}

export const ServicesCategoryList = ({ 
    servicesList, activeServiceCategory, expandedServiceId, onToggleExpand,
    isItemInItinerary, onAddToItinerary, onOpenSuggestion
}: ServicesCategoryListProps) => {

    // Recupera configurazione dinamica
    const SERVICES_CATEGORIES = getServicesConfig();
    const activeCatInfo = SERVICES_CATEGORIES.find(c => c.id === activeServiceCategory);
    
    const renderHeaderIcon = () => {
        if (activeServiceCategory === 'pharmacy') {
            return (
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                    <Plus className="w-10 h-10 text-emerald-600 fill-current" strokeWidth={4} />
                </div>
            );
        }
        return <span className="text-5xl">{activeCatInfo?.emoji}</span>;
    };

    // Helper per icone specifiche (No Copyright - Solo Lucide)
    const getSpecificIcon = (service: CityService) => {
        const nameLower = service.name.toLowerCase();
        const typeLower = service.type.toLowerCase();

        // --- EMERGENZA ---
        if (activeServiceCategory === 'emergency') {
            if (nameLower.includes('polizia') || typeLower === 'police') {
                return <Shield className="w-8 h-8 text-blue-500 fill-blue-900/20"/>; // Polizia (Blu)
            }
            if (nameLower.includes('carabinieri')) {
                return <ShieldAlert className="w-8 h-8 text-red-600 fill-blue-900"/>; // Carabinieri (Rosso/Blu)
            }
            if (nameLower.includes('vigili') || nameLower.includes('fuoco') || typeLower === 'fire') {
                return <Flame className="w-8 h-8 text-orange-500 fill-red-600"/>; // Pompieri
            }
            if (nameLower.includes('ospedale') || nameLower.includes('pronto') || typeLower === 'hospital') {
                return <HeartPulse className="w-8 h-8 text-red-500"/>; // Ospedale
            }
            if (nameLower.includes('guardia')) {
                return <Plus className="w-8 h-8 text-emerald-500"/>; // Guardia Medica
            }
        }

        // --- TRENI & METRO ---
        if (activeServiceCategory === 'train') {
            if (nameLower.includes('fs') || nameLower.includes('ferrovi') || nameLower.includes('rfi')) {
                // FS - Treno Frontale (No Logo, icona generica verde/oro)
                return <TrainFront className="w-8 h-8 text-emerald-600 fill-slate-800"/>; 
            }
            if (nameLower.includes('circum') || nameLower.includes('vesuviana') || nameLower.includes('eav')) {
                // Vesuviana - Treno rosso
                return <TrainFront className="w-8 h-8 text-red-600 fill-slate-800"/>;
            }
            if (nameLower.includes('metro')) {
                 return <div className="w-8 h-8 bg-red-600 text-white rounded font-black flex items-center justify-center text-xl">M</div>;
            }
        }

        // Default: Icona della categoria principale (Se disponibile nell'oggetto unito)
        const SpecificIcon = activeCatInfo?.icon || Box;
        return <SpecificIcon className="w-8 h-8"/>;
    };

    return (
        <>
             {/* HEADER CONTRIBUISCI */}
            <div className="w-full flex items-center justify-between gap-2 md:gap-4 mb-6 bg-slate-900/80 p-2 rounded-xl border border-slate-700/50 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-2 px-2 border-r border-slate-700/50 mr-1">
                    <Lightbulb className="w-4 h-4 text-amber-400"/>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest hidden md:inline">Contribuisci</span>
                </div>
                <div className="flex-1 flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 italic hidden md:block">Manca un servizio? Segnalalo!</span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => onOpenSuggestion('new_place')} 
                            className="px-3 py-1.5 hover:bg-indigo-600 rounded-lg text-indigo-400 hover:text-white transition-all active:scale-95 flex items-center gap-2 bg-slate-950 border border-slate-800"
                        >
                            <Plus className="w-3.5 h-3.5"/> 
                            <span className="text-[10px] font-bold uppercase">+ AGGIUNGI SERVIZIO</span>
                        </button>
                        <button 
                            onClick={() => onOpenSuggestion('edit_info')} 
                            className="px-3 py-1.5 hover:bg-amber-600 rounded-lg text-amber-500 hover:text-white transition-all active:scale-95 flex items-center gap-2 bg-slate-950 border border-slate-800"
                        >
                            <Pencil className="w-3.5 h-3.5"/>
                            <span className="text-[10px] font-bold uppercase">Segnala Errore</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-5 mb-8 pb-4 border-b border-slate-800">
                {renderHeaderIcon()}
                <h3 className={`text-3xl font-display font-bold uppercase tracking-wide ${activeCatInfo?.color}`}>
                    {activeCatInfo?.label}
                </h3>
                <span className="ml-auto text-xs font-bold bg-slate-800 text-slate-400 px-3 py-1 rounded-full">{servicesList.length} Risultati</span>
            </div>

            {servicesList.length === 0 ? (
                <div className="text-center py-20 text-slate-500 italic bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed mb-6">
                    Nessun servizio registrato in questa categoria. <br/>
                    <button onClick={() => onOpenSuggestion('new_place')} className="text-indigo-400 underline mt-2 hover:text-white transition-colors">Sii il primo ad aggiungerne uno!</button>
                </div>
            ) : (
                <div className="space-y-4 mb-6">
                     {servicesList.map(service => {
                        const hasPhone = service.contact && (service.contact.startsWith('+') || service.contact.startsWith('0') || service.contact.startsWith('3') || service.contact.startsWith('8') || service.contact.length >= 3);
                        const isExpanded = expandedServiceId === service.id;
                        const isAdded = service.id ? isItemInItinerary(service.id) : false;
                        const hasUrl = !!service.url;
                        const isEmergency = activeServiceCategory === 'emergency';
                        
                        return (
                            <div key={service.id} className={`bg-slate-900 border rounded-2xl p-5 transition-all shadow-lg group cursor-pointer ${isExpanded ? 'border-indigo-500 ring-1 ring-indigo-500/30' : 'border-slate-800 hover:border-slate-600'}`} onClick={() => onToggleExpand(service.id!)}>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl bg-slate-950 border border-slate-800 ${activeCatInfo?.color}`}>
                                            {getSpecificIcon(service)}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">{service.name}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 uppercase font-bold">{service.category || activeCatInfo?.label}</span>
                                                {!isExpanded && <span className="text-[10px] text-slate-500 italic flex items-center gap-1"><Info className="w-3 h-3"/> Clicca per info</span>}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 w-full md:w-auto" onClick={e => e.stopPropagation()}>
                                        {hasPhone && (
                                            <a href={`tel:${service.contact}`} className={`flex-1 md:flex-none flex items-center justify-center gap-2 text-white px-5 py-3 rounded-xl font-bold uppercase text-[10px] shadow-lg transition-transform active:scale-95 ${isEmergency ? 'bg-red-600 hover:bg-red-500 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                                                <Phone className="w-4 h-4"/> Chiama
                                            </a>
                                        )}
                                        
                                        {hasUrl ? (
                                            <a href={service.url} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-bold uppercase text-[10px] shadow-lg transition-transform active:scale-95">
                                                <Globe className="w-4 h-4"/> Web
                                            </a>
                                        ) : (
                                            <button disabled className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 text-slate-600 border border-slate-700 px-5 py-3 rounded-xl font-bold uppercase text-[10px] cursor-not-allowed opacity-70 relative overflow-hidden group/disabled">
                                                <div className="relative">
                                                     <Globe className="w-4 h-4 opacity-50"/>
                                                     <div className="absolute inset-0 flex items-center justify-center">
                                                         <div className="w-full h-0.5 bg-slate-500 rotate-45 transform scale-125"></div>
                                                     </div>
                                                </div>
                                                Web
                                            </button>
                                        )}
                                        
                                        {!isEmergency && (
                                            <button 
                                                onClick={(e) => onAddToItinerary(e, service)}
                                                className={`px-3 py-2 rounded-xl border transition-all flex items-center gap-1 uppercase font-bold text-[10px] tracking-wide ${isAdded ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-amber-600 border-amber-500 text-white hover:bg-amber-500'}`}
                                                title={isAdded ? "Già nel diario" : "Aggiungi al diario"}
                                            >
                                                {isAdded ? <Check className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
                                                {isAdded ? 'AGGIUNTO' : 'AGGIUNGI'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-slate-800 animate-in slide-in-from-top-2">
                                        {service.description && (
                                            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 mb-3">
                                                <div className="flex gap-2 items-start">
                                                    <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5"/>
                                                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                                        {service.description}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {service.address && (
                                            <div className="flex justify-start">
                                                <a 
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(service.address)}`} 
                                                    target="_blank" 
                                                    rel="noreferrer" 
                                                    className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 hover:border-amber-500/50 transition-all group/addr"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <MapPin className="w-3.5 h-3.5 text-amber-500 group-hover/addr:animate-bounce"/> 
                                                    {service.address}
                                                    <ArrowLeft className="w-3 h-3 rotate-180 opacity-50"/>
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
};
