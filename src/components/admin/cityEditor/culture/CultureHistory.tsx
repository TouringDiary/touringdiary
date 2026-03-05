
import React from 'react';
import { ScrollText, FileText, Eye } from 'lucide-react';
import { CityDetails } from '../../../../types/index';
import { AiFieldHelper } from '../../AiFieldHelper';

interface CultureHistoryProps {
    city: CityDetails;
    updateDetailField: (field: keyof CityDetails['details'], value: any) => void;
    triggerPreview: (type: 'snippet' | 'history', title: string) => void;
}

export const CultureHistory: React.FC<CultureHistoryProps> = ({ 
    city, 
    updateDetailField, 
    triggerPreview 
}) => {
    return (
        <div className="space-y-6 md:space-y-8">
            {/* STORIA IN BREVE */}
            <div className="bg-slate-900 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-slate-800 shadow-2xl">
                <div className="flex justify-between items-center mb-4 md:mb-6 border-b border-slate-800 pb-4">
                    <h3 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2">
                        <ScrollText className="w-5 h-5 md:w-6 md:h-6 text-indigo-500"/> Storia Breve
                    </h3>
                    <button 
                        onClick={() => triggerPreview('snippet', 'Anteprima Intro')} 
                        className="bg-slate-800 p-2 rounded-lg text-white hover:bg-slate-700 transition-colors"
                    >
                        <Eye className="w-4 h-4"/>
                    </button>
                </div>
                <p className="text-xs md:text-sm text-slate-400 mb-4 italic">Snippet introduttivo (2-3 frasi) usato come "Intro" nella pagina storia.</p>
                <textarea 
                    rows={4} 
                    value={city.details.historySnippet} 
                    onChange={e => updateDetailField('historySnippet', e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 md:p-4 text-white text-sm resize-none"
                />
                <AiFieldHelper 
                    contextLabel={`storia brevissima di ${city.name}`}
                    onApply={t => updateDetailField('historySnippet', t)}
                    currentValue={city.details.historySnippet} 
                    fieldId="city_history_short"
                />
            </div>

            {/* STORIA COMPLETA */}
            <div className="bg-slate-900 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-slate-800 shadow-2xl">
                <div className="flex justify-between items-center mb-4 md:mb-6 border-b border-slate-800 pb-4">
                    <h3 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 md:w-6 md:h-6 text-indigo-500"/> Storia Completa
                    </h3>
                    <button 
                        onClick={() => triggerPreview('history', 'Storia Completa')} 
                        className="bg-slate-800 p-2 rounded-lg text-white hover:bg-slate-700 transition-colors"
                    >
                        <Eye className="w-4 h-4"/>
                    </button>
                </div>
                <p className="text-xs md:text-sm text-slate-400 mb-4 italic">Testo lungo e dettagliato, sarà formattato automaticamente.</p>
                <textarea 
                    rows={12} 
                    value={city.details.historyFull} 
                    onChange={e => updateDetailField('historyFull', e.target.value)} 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 md:p-4 text-white text-sm resize-none"
                />
                <AiFieldHelper 
                    contextLabel={`storia completa di ${city.name}`}
                    onApply={t => updateDetailField('historyFull', t)}
                    currentValue={city.details.historyFull} 
                    fieldId="city_history_full"
                />
            </div>
        </div>
    );
};
