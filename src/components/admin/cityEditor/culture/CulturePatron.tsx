
import React, { useState } from 'react';
import { Award, Sparkles, Eye, Loader2 } from 'lucide-react';
import { CityDetails } from '../../../../types/index';
import { AiFieldHelper } from '../../AiFieldHelper';
import { generateCitySection } from '../../../../services/ai';

const DEFAULT_MASTER_PATRON = "https://upload.wikimedia.org/wikipedia/commons/7/79/Croce_del_campo1.jpg";

interface CulturePatronProps {
    city: CityDetails;
    updateDetailField: (field: keyof CityDetails['details'], value: any) => void;
    triggerPreview: (type: 'patron', title: string) => void;
}

export const CulturePatron: React.FC<CulturePatronProps> = ({ 
    city, 
    updateDetailField, 
    triggerPreview
}) => {
    // Stato locale spostato dal genitore
    const [generating, setGenerating] = useState(false);
    const [patronStrategy, setPatronStrategy] = useState('');

    const handleRegeneratePatron = async (instructions: string) => {
        if (!city.name) return;
        setGenerating(true);
        try {
            const data = await generateCitySection(city.name, 'patron', instructions);
            if (data.patron && data.patron.name) {
                const newPatronDetails = {
                    ...data.patron,
                    imageUrl: city.details.patronDetails?.imageUrl || DEFAULT_MASTER_PATRON
                };
                updateDetailField('patronDetails', newPatronDetails);
                updateDetailField('patron', data.patron.name);
            }
        } catch (e) {
            alert("Errore generazione Patron AI.");
        } finally {
            setGenerating(false);
        }
    };
    
    const handleNameChange = (newValue: string) => {
        updateDetailField('patron', newValue);
        const currentDetails = city.details.patronDetails || { name: '', date: '', history: '', imageUrl: '' };
        updateDetailField('patronDetails', { ...currentDetails, name: newValue });
    };

    const handleDateChange = (newValue: string) => {
        const currentDetails = city.details.patronDetails || { name: '', date: '', history: '', imageUrl: '' };
        updateDetailField('patronDetails', { ...currentDetails, date: newValue });
    };

    const handleHistoryChange = (newValue: string) => {
        const currentDetails = city.details.patronDetails || { name: '', date: '', history: '', imageUrl: '' };
        updateDetailField('patronDetails', { ...currentDetails, history: newValue });
    };

    return (
        <div className="bg-slate-900 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-slate-800 shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                <h3 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2">
                    <Award className="w-5 h-5 md:w-6 md:h-6 text-amber-500"/> Santo Patrono
                </h3>
                 <div className="flex gap-2">
                     <button 
                        onClick={() => handleRegeneratePatron(patronStrategy)} 
                        disabled={generating} 
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center gap-2 shadow-lg transition-all"
                    >
                        {generating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
                        Genera Contenuto (Pro)
                    </button>
                    <button 
                        onClick={() => triggerPreview('patron', 'Santo Patrono')} 
                        className="bg-slate-800 p-2 rounded-lg text-white hover:bg-slate-700 transition-colors"
                        title="Anteprima Modale"
                    >
                        <Eye className="w-4 h-4"/>
                    </button>
                 </div>
            </div>
            
            {/* AI STRATEGY CONFIG */}
            <div className="mb-4">
                <AiFieldHelper 
                    contextLabel="storia del santo patrono" 
                    onApply={(val) => setPatronStrategy(val)} 
                    mode="text" 
                    currentValue={patronStrategy} 
                    initialPrompt="Scrivi come un romanziere storico: avvincente, non scolastico. Focalizzati sui miracoli e sulla devozione popolare."
                    defaultPrompts={['Scrivi come un romanziere storico: avvincente, non scolastico. Focalizzati sui miracoli e sulla devozione popolare.']}
                    fieldId="patron_strategy" 
                    isStrategyConfig={true}
                />
            </div>
            
            <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nome Santo</label>
                        <input 
                            value={city.details.patronDetails?.name || city.details.patron || ''} 
                            onChange={e => handleNameChange(e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none" 
                            placeholder="Es. San Gennaro"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Data Celebrazione</label>
                        <input 
                            value={city.details.patronDetails?.date || ''} 
                            onChange={e => handleDateChange(e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none" 
                            placeholder="19 Settembre"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Storia / Culto</label>
                    <textarea 
                        rows={6} 
                        value={city.details.patronDetails?.history || ''} 
                        onChange={e => handleHistoryChange(e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm leading-relaxed resize-y focus:border-amber-500 outline-none" 
                        placeholder="Breve storia del culto..."
                    />
                    <div className="mt-2">
                        <AiFieldHelper 
                            contextLabel={`storia culto di ${city.details.patron || 'Santo Patrono'}`}
                            onApply={val => handleHistoryChange(val)}
                            currentValue={city.details.patronDetails?.history}
                            compact={true}
                            fieldId="patron_history_ai"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
