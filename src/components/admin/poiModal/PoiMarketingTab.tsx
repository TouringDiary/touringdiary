
import React from 'react';
import { PointOfInterest } from '../../../types/index';

interface PoiMarketingTabProps {
    formData: PointOfInterest;
    updateField: (field: keyof PointOfInterest, value: any) => void;
}

export const PoiMarketingTab = ({ formData, updateField }: PoiMarketingTabProps) => {
    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-700">
                <div>
                    <h4 className="font-bold text-white">Sponsorizzato</h4>
                    <p className="text-xs text-slate-400">Metti in evidenza questo luogo</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={formData.isSponsored} 
                        onChange={e => updateField('isSponsored', e.target.checked)} 
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
            </div>
            
            {formData.isSponsored && (
                <div className="grid grid-cols-2 gap-6 animate-in fade-in">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Livello Sponsor</label>
                        <select 
                            value={formData.tier} 
                            onChange={e => updateField('tier', e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                        >
                            <option value="standard">Standard</option>
                            <option value="silver">Silver</option>
                            <option value="gold">Gold</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Scadenza</label>
                        <input 
                            type="date" 
                            value={formData.showcaseExpiry || ''} 
                            onChange={e => updateField('showcaseExpiry', e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
