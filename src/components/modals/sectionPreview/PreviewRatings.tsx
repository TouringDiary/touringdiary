
import React from 'react';
import { Landmark, Trees, Utensils, Briefcase } from 'lucide-react';
import { StarRating } from '../../common/StarRating';

interface PreviewRatingsProps {
    city: any; // Generic Object
}

const RATING_LABELS: Record<string, string> = {
    cultura: 'Cultura Generale', monumenti: 'Monumenti', musei_arte: 'Musei & Arte', tradizione: 'Storia & Tradizione', architettura: 'Architettura',
    natura: 'Natura', mare_spiagge: 'Mare & Spiagge', paesaggi: 'Paesaggi', clima: 'Clima', sostenibilita: 'Sostenibilità',
    gusto: 'Gusto', cucina: 'Cucina Locale', vita_notturna: 'Vita Notturna', caffe_bar: 'Caffè & Bar', mercati: 'Mercati',
    viaggiatore: 'Vibe Viaggiatore', mobilita: 'Mobilità', accoglienza: 'Accoglienza', costo: 'Qualità/Prezzo', sicurezza: 'Sicurezza'
};

const RATING_CATEGORIES = [
    { title: 'Cultura & Storia', icon: Landmark, color: 'text-amber-500', keys: ['cultura', 'monumenti', 'musei_arte', 'tradizione', 'architettura'] },
    { title: 'Natura & Paesaggio', icon: Trees, color: 'text-emerald-500', keys: ['natura', 'mare_spiagge', 'paesaggi', 'clima', 'sostenibilita'] },
    { title: 'Gusto & Vita', icon: Utensils, color: 'text-rose-500', keys: ['gusto', 'cucina', 'vita_notturna', 'caffe_bar', 'mercati'] },
    { title: 'Viaggio & Servizi', icon: Briefcase, color: 'text-blue-500', keys: ['viaggiatore', 'mobilita', 'accoglienza', 'costo', 'sicurezza'] }
];

const DetailRow: React.FC<{ labelKey: string, value?: number }> = ({ labelKey, value }) => (
    <div className="flex justify-between items-center py-0.5 border-b border-white/5 last:border-0">
        <span className="text-[9px] md:text-xs font-bold text-slate-400 truncate mr-1">{RATING_LABELS[labelKey] || labelKey}</span>
        <StarRating value={(value || 0) / 100 * 5} size="w-2 h-2 md:w-3 md:h-3" />
    </div>
);

export const PreviewRatings = ({ city }: PreviewRatingsProps) => {
    // FIX: Se non ci sono ratings dettagliati, mostra un messaggio o nascondi. NON INVENTARE DATI.
    if (!city.details?.ratings) {
        return (
            <div className="w-full h-full flex items-center justify-center p-8 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
                <span className="text-slate-500 text-xs italic">Dettagli valutativi non disponibili per questo elemento.</span>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/50">
                <div className="flex flex-col justify-center">
                    <h3 className="text-sm md:text-2xl font-bold text-white font-display mb-0.5">Valutazioni Esperienziali</h3>
                    <p className="text-[9px] md:text-[10px] text-slate-400 italic mb-2 leading-tight opacity-80 font-medium max-w-[200px] md:max-w-none">
                        *Generate automaticamente da AI.
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                        {city.details?.idealFor?.map((tag: string) => (
                            <span key={tag} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 text-[9px] font-bold uppercase tracking-wide">{tag}</span>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="flex flex-col items-end leading-none">
                        <span className="text-lg md:text-2xl font-bold text-white">{(city.rating || 0).toFixed(1)}</span>
                        <span className="text-[7px] text-slate-500 uppercase tracking-widest font-bold">Global</span>
                    </div>
                    <div className="h-6 w-px bg-slate-800"></div>
                    <StarRating value={city.rating || 0} size="w-3 h-3 md:w-3.5 md:h-3.5" activeColor="fill-amber-500 text-amber-500"/>
                </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-4 md:gap-x-8">
                {RATING_CATEGORIES.map((cat, idx) => (
                    <div key={idx} className="min-w-0">
                        <div className={`flex items-center gap-1.5 mb-1 font-bold text-[9px] md:text-xs uppercase tracking-wider ${cat.color}`}>
                            <cat.icon className="w-3 h-3 md:w-3.5 md:h-3.5"/> {cat.title}
                        </div>
                        <div className="space-y-0.5">
                            {cat.keys.map(key => (
                                <DetailRow key={key} labelKey={key} value={(city.details.ratings as any)[key]} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
