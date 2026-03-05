
import React from 'react';
import { Sparkles, Globe, Ticket, Eye, Utensils, Search, ExternalLink } from 'lucide-react';
import { PointOfInterest, AffiliateLinks } from '../../../types/index';

interface PoiLinksTabProps {
    formData: PointOfInterest;
    updateAffiliate: (key: keyof AffiliateLinks, value: string) => void;
    cityName?: string;
}

const LinkRow = ({ label, value, onChange, brandBg, icon, onSmartSearch }: any) => (
    <div className="flex flex-col gap-2 mb-4 p-3 rounded-xl bg-slate-950 border border-slate-800 shadow-sm group hover:border-slate-600">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
            <div className={`h-10 md:h-11 flex items-center px-3 gap-2 font-bold text-xs uppercase rounded-lg text-white shadow-md w-full md:w-40 shrink-0 ${brandBg}`}>
                {icon} <span className="truncate">{label}</span>
            </div>
            <div className="flex-1 flex gap-2 w-full min-w-0">
                <input 
                    type="text" 
                    value={value} 
                    onChange={e => onChange(e.target.value)} 
                    className="flex-1 min-w-0 h-10 md:h-11 bg-slate-900 border border-slate-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono truncate" 
                    placeholder="Incolla URL..." 
                />
                <div className="flex gap-1 h-10 md:h-11 shrink-0">
                    <button 
                        onClick={(e) => { e.preventDefault(); onSmartSearch(); }} 
                        className="w-10 md:w-11 h-full flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg border border-indigo-400"
                    >
                        <Search className="w-4 h-4"/>
                    </button>
                    {value && (
                        <a 
                            href={value} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="w-10 md:w-11 h-full flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:text-white"
                        >
                            <ExternalLink className="w-4 h-4"/>
                        </a>
                    )}
                </div>
            </div>
        </div>
    </div>
);

export const PoiLinksTab = ({ formData, updateAffiliate, cityName }: PoiLinksTabProps) => {
    
    const performSmartSearch = (platform: string) => {
        if (!formData.name) { alert("Nome mancante."); return; }
        const q = `${formData.name} ${cityName || (formData.address ? formData.address.split(',').pop() : "Campania")} ${platform}`;
        window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank');
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 mb-6 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"/>
                <p className="text-xs text-slate-300 leading-relaxed">
                    I link di affiliazione vengono generati automaticamente. Inserisci solo ID o link diretti se necessario.
                </p>
            </div>
            
            <LinkRow label="Sito Ufficiale" value={formData.affiliate?.website || ''} onChange={(v: string) => updateAffiliate('website', v)} brandBg="bg-slate-700" icon={<Globe className="w-4 h-4"/>} onSmartSearch={() => performSmartSearch('site official')} />
            <LinkRow label="Booking.com" value={formData.affiliate?.booking || ''} onChange={(v: string) => updateAffiliate('booking', v)} brandBg="bg-[#003580]" icon={<Ticket className="w-4 h-4"/>} onSmartSearch={() => performSmartSearch('booking.com')} />
            <LinkRow label="TripAdvisor" value={formData.affiliate?.tripadvisor || ''} onChange={(v: string) => updateAffiliate('tripadvisor', v)} brandBg="bg-[#00AA6C]" icon={<Eye className="w-4 h-4"/>} onSmartSearch={() => performSmartSearch('tripadvisor')} />
            <LinkRow label="TheFork" value={formData.affiliate?.thefork || ''} onChange={(v: string) => updateAffiliate('thefork', v)} brandBg="bg-[#58902d]" icon={<Utensils className="w-4 h-4"/>} onSmartSearch={() => performSmartSearch('thefork')} />
            <LinkRow label="GetYourGuide" value={formData.affiliate?.getyourguide || ''} onChange={(v: string) => updateAffiliate('getyourguide', v)} brandBg="bg-[#FF5533]" icon={<Ticket className="w-4 h-4"/>} onSmartSearch={() => performSmartSearch('getyourguide')} />
        </div>
    );
};
