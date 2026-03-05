
import React from 'react';
import { Loader2, Search } from 'lucide-react';
import { PointOfInterest } from '../../../types/index';

interface PoiLogisticsTabProps {
    formData: PointOfInterest;
    updateField: (field: keyof PointOfInterest, value: any) => void;
    updateCoord: (type: 'lat' | 'lng', value: string) => void;
    handleAutoLocate: () => Promise<void>;
    isLocating: boolean;
}

export const PoiLogisticsTab = ({ formData, updateField, updateCoord, handleAutoLocate, isLocating }: PoiLogisticsTabProps) => {
    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 mb-4">
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1 flex justify-between items-center">
                    Coordinate GPS 
                    <button 
                        onClick={handleAutoLocate} 
                        disabled={isLocating} 
                        className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded flex items-center gap-1.5 transition-all shadow-lg border border-indigo-400"
                    >
                        {isLocating ? <Loader2 className="w-3 h-3 animate-spin"/> : <Search className="w-3 h-3"/>} {isLocating ? 'Ricerca...' : 'Trova GPS con AI'}
                    </button>
                </label>
                <div className="grid grid-cols-2 gap-6 mt-2">
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold block mb-1">Latitudine</label>
                        <input 
                            type="number" 
                            value={formData.coords.lat} 
                            onChange={e => updateCoord('lat', e.target.value)} 
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold block mb-1">Longitudine</label>
                        <input 
                            type="number" 
                            value={formData.coords.lng} 
                            onChange={e => updateCoord('lng', e.target.value)} 
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono"
                        />
                    </div>
                </div>
            </div>
            
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Indirizzo</label>
                <input 
                    type="text" 
                    value={formData.address} 
                    onChange={e => updateField('address', e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
                />
            </div>
            
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Durata Visita</label>
                    <input 
                        type="text" 
                        value={formData.visitDuration} 
                        onChange={e => updateField('visitDuration', e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Fascia Prezzo (1-4)</label>
                    <input 
                        type="number" 
                        min="1" 
                        max="4" 
                        value={formData.priceLevel} 
                        onChange={e => updateField('priceLevel', parseInt(e.target.value))} 
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
                    />
                </div>
            </div>
        </div>
    );
};
