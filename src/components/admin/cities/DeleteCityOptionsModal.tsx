
import React, { useState } from 'react';
import { X, Trash2, ShieldCheck, AlertTriangle, Users, ShoppingCart, MapPin, Image, Info, Layers } from 'lucide-react';
import { CityDeleteOptions } from '../../../types/index';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (options: CityDeleteOptions) => void;
    cityName: string;
}

export const DeleteCityOptionsModal = ({ isOpen, onClose, onConfirm, cityName }: Props) => {
    const [options, setOptions] = useState<CityDeleteOptions>({
        keepUserPhotos: true, // Default: Mantieni i dati preziosi
        keepShops: true,
        keepPeople: true,
        keepPOIs: false // Default: Cancella i POI strutturali
    });

    const [isConfirming, setIsConfirming] = useState(false);

    if (!isOpen) return null;

    const toggleOption = (key: keyof CityDeleteOptions) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-red-500/30 shadow-2xl flex flex-col overflow-hidden relative">
                
                {/* HEADER */}
                <div className="p-6 border-b border-slate-800 bg-red-950/10 flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/30 text-red-500">
                            <Trash2 className="w-8 h-8"/>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white font-display uppercase tracking-wide">Elimina {cityName}</h3>
                            <p className="text-xs text-red-300 font-medium mt-1">Questa azione rimuoverà la città dal database.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-6 h-6"/></button>
                </div>

                {/* CONTENT */}
                <div className="p-6 space-y-6">
                    
                    <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl flex gap-3">
                        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5"/>
                        <p className="text-xs text-indigo-200 leading-relaxed">
                            <strong>Nota Dati Staging (OSM):</strong> Gli elementi presenti nell'area di Importazione (Staging) non vengono cancellati ma <strong>diventano orfani</strong>. Potrai recuperarli e riassegnarli se ricrei la città con lo stesso nome.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Cosa vuoi SALVARE?</h4>
                        
                        {/* OPTION: PHOTOS */}
                        <div 
                            onClick={() => toggleOption('keepUserPhotos')}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${options.keepUserPhotos ? 'bg-emerald-900/10 border-emerald-500/50' : 'bg-slate-950 border-slate-800 hover:border-red-500/30'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${options.keepUserPhotos ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-500'}`}>
                                    <Image className="w-5 h-5"/>
                                </div>
                                <div>
                                    <div className={`text-sm font-bold ${options.keepUserPhotos ? 'text-white' : 'text-slate-400'}`}>Foto Community & Media</div>
                                    <div className="text-[10px] text-slate-500">Upload utenti, Live Snaps, Galleria</div>
                                </div>
                            </div>
                            <div className={`text-[10px] font-black uppercase px-2 py-1 rounded ${options.keepUserPhotos ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-500'}`}>
                                {options.keepUserPhotos ? 'MANTIENI' : 'CANCELLA'}
                            </div>
                        </div>

                        {/* OPTION: SHOPS */}
                        <div 
                            onClick={() => toggleOption('keepShops')}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${options.keepShops ? 'bg-emerald-900/10 border-emerald-500/50' : 'bg-slate-950 border-slate-800 hover:border-red-500/30'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${options.keepShops ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-500'}`}>
                                    <ShoppingCart className="w-5 h-5"/>
                                </div>
                                <div>
                                    <div className={`text-sm font-bold ${options.keepShops ? 'text-white' : 'text-slate-400'}`}>Negozi & Partner</div>
                                    <div className="text-[10px] text-slate-500">Botteghe, Prodotti, Sponsor</div>
                                </div>
                            </div>
                            <div className={`text-[10px] font-black uppercase px-2 py-1 rounded ${options.keepShops ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-500'}`}>
                                {options.keepShops ? 'MANTIENI' : 'CANCELLA'}
                            </div>
                        </div>

                        {/* OPTION: PEOPLE */}
                        <div 
                            onClick={() => toggleOption('keepPeople')}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${options.keepPeople ? 'bg-emerald-900/10 border-emerald-500/50' : 'bg-slate-950 border-slate-800 hover:border-red-500/30'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${options.keepPeople ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-500'}`}>
                                    <Users className="w-5 h-5"/>
                                </div>
                                <div>
                                    <div className={`text-sm font-bold ${options.keepPeople ? 'text-white' : 'text-slate-400'}`}>Personaggi Famosi</div>
                                    <div className="text-[10px] text-slate-500">Biografie, Ritratti AI</div>
                                </div>
                            </div>
                            <div className={`text-[10px] font-black uppercase px-2 py-1 rounded ${options.keepPeople ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-500'}`}>
                                {options.keepPeople ? 'MANTIENI' : 'CANCELLA'}
                            </div>
                        </div>

                         {/* OPTION: POI (DANGEROUS) */}
                         <div 
                            onClick={() => toggleOption('keepPOIs')}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${options.keepPOIs ? 'bg-amber-900/10 border-amber-500/50' : 'bg-slate-950 border-slate-800 hover:border-red-500/30'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${options.keepPOIs ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-900 text-slate-500'}`}>
                                    <MapPin className="w-5 h-5"/>
                                </div>
                                <div>
                                    <div className={`text-sm font-bold ${options.keepPOIs ? 'text-white' : 'text-slate-400'}`}>Punti di Interesse Reali</div>
                                    <div className="text-[10px] text-slate-500">Monumenti, Ristoranti (Tabella POI live)</div>
                                </div>
                            </div>
                            <div className={`text-[10px] font-black uppercase px-2 py-1 rounded ${options.keepPOIs ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-500'}`}>
                                {options.keepPOIs ? 'MANTIENI' : 'CANCELLA'}
                            </div>
                        </div>

                    </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-3 rounded-xl font-bold uppercase text-xs text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors">
                        Annulla
                    </button>
                    {!isConfirming ? (
                        <button 
                            onClick={() => setIsConfirming(true)} 
                            className="px-6 py-3 rounded-xl font-bold uppercase text-xs text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/20 transition-all active:scale-95"
                        >
                            Procedi con Eliminazione
                        </button>
                    ) : (
                        <button 
                            onClick={() => onConfirm(options)} 
                            className="px-6 py-3 rounded-xl font-black uppercase text-xs text-white bg-red-600 hover:bg-red-500 shadow-lg animate-pulse flex items-center gap-2"
                        >
                            <AlertTriangle className="w-4 h-4"/> Conferma Definitiva
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
