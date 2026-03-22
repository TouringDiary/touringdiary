
import React, { useState } from 'react';
import { BookOpen, RefreshCw, Loader2 } from 'lucide-react';
import { useCityEditor } from '@/context/CityEditorContext';
import { generateCitySection, suggestCityPeople } from '../../../../services/ai';
import { generateHistoricalPortrait } from '../../../../services/ai/aiVision'; // IMPORT
import { getCityPeople, deleteCityPerson, saveCityDetails, saveCityPerson } from '../../../../services/cityService';
import { DeleteConfirmationModal } from '../../../common/DeleteConfirmationModal';
import { User } from '../../../../types/users';

// Sub-Components Atomici
import { CultureHistory } from '../culture/CultureHistory';
import { CulturePatron } from '../culture/CulturePatron';
import { CulturePeople } from '../culture/CulturePeople';

const DEFAULT_MASTER_PATRON = "https://upload.wikimedia.org/wikipedia/commons/7/79/Croce_del_campo1.jpg";

export const TabCulture = ({ currentUser }: { currentUser?: User }) => {
    const { city, updateDetailField, setCityDirectly, reloadCurrentCity, triggerPreview } = useCityEditor();
    
    // UI STATES
    const [generating, setGenerating] = useState<string | null>(null);
    const [showRegenConfirm, setShowRegenConfirm] = useState(false); 
    
    if (!city) return null;

    // --- AI ACTIONS (RIGENERAZIONE COMPLETA TAB) ---

    const handleRegenerateClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!city.name) { 
            alert("Inserisci il nome della città!"); 
            return; 
        }
        
        setShowRegenConfirm(true);
    };

    const executeRegeneration = async () => {
        setShowRegenConfirm(false);
        setGenerating('full_page'); 
        
        try {
            // 1. Cancellazione Personaggi Esistenti (DB)
            const existingPeople = await getCityPeople(city.id);
            await Promise.all(existingPeople.map(p => deleteCityPerson(p.id!)));

            // 2. Chiamate AI Parallele (Flash per velocità come richiesto)
            const [historyData, patronData, peopleData] = await Promise.all([
                generateCitySection(city.name, 'history'), // Storia e Snippet
                generateCitySection(city.name, 'patron'),  // Santo Patrono
                suggestCityPeople(city.name, [], '', 4)    // 4 Personaggi (Flash)
            ]);

            // 3. Aggiornamento Oggetto City Details (Locale)
            const updatedDetails = { ...city.details };
            
            // Storia
            updatedDetails.historySnippet = historyData.historySnippet || '';
            updatedDetails.historyFull = historyData.historyFull || '';
            
            // Patrono
            if (patronData.patron) {
                 updatedDetails.patronDetails = { 
                     ...updatedDetails.patronDetails, 
                     ...patronData.patron, 
                     imageUrl: city.details.patronDetails?.imageUrl || DEFAULT_MASTER_PATRON 
                 };
                 updatedDetails.patron = patronData.patron.name;
            }

            // 4. Salvataggio City Details nel DB
            const newLog = `[${new Date().toISOString()}] ✅ Fine: Rigenerazione Pagina Storia & Cultura (in 0s)`;
            updatedDetails.generationLogs = [...(updatedDetails.generationLogs || []), newLog];
            
            const updatedCity = { ...city, details: updatedDetails };
            await saveCityDetails(updatedCity);

            // 5. Salvataggio Personaggi nel DB (CON GENERAZIONE FOTO)
            if (peopleData && peopleData.length > 0) {
                let orderIdx = 1;
                for (const p of peopleData) {
                    let imageUrl = p.imageUrl;
                    // Se non ha immagine valida, generala subito
                    if (!imageUrl || imageUrl.includes('unsplash') || imageUrl.includes('ui-avatars')) {
                        try {
                            // Generazione sincrona per evitare race conditions o blocchi eccessivi
                            const generated = await generateHistoricalPortrait(p.name, p.role, city.name);
                            if (generated) imageUrl = generated;
                        } catch (err) {
                            console.warn(`Fallita img per ${p.name} in regen`);
                        }
                    }

                    await saveCityPerson(city.id, {
                        ...p,
                        imageUrl: imageUrl || '',
                        status: 'draft', // Bozza, pronti per la bonifica Pro
                        orderIndex: orderIdx++
                    });
                }
            }

            // 6. Aggiornamento UI Finale
            setCityDirectly(updatedCity); 
            await reloadCurrentCity();

            alert(`Rigenerazione completata!\n- Storia aggiornata\n- Patrono aggiornato\n- Trovati ${peopleData.length} nuovi personaggi (con foto).`);

        } catch (e: any) {
             console.error("Errore Rigenerazione Cultura:", e);
             alert(`Errore durante la rigenerazione: ${e.message}`);
        } finally {
            setGenerating(null);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 animate-in fade-in">
             
             {showRegenConfirm && (
                <DeleteConfirmationModal
                    isOpen={true}
                    onClose={() => setShowRegenConfirm(false)}
                    onConfirm={executeRegeneration}
                    title="Rigenerare Cultura?"
                    message={`ATTENZIONE: Questa operazione CANCELLERÀ e RIGENERERÀ da zero:\n1. La storia completa\n2. Il Santo Patrono\n3. TUTTI i personaggi famosi esistenti.\n\nL'AI cercherà nuovi dati e genererà nuove immagini.`}
                    confirmLabel="Sì, Rigenera Tutto"
                    cancelLabel="Annulla"
                    variant="danger" 
                    icon={<RefreshCw className="w-8 h-8 text-rose-500 animate-spin-slow"/>}
                />
             )}

             <div className="col-span-1 lg:col-span-2 flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-900/20 rounded-lg text-amber-500"><BookOpen className="w-5 h-5"/></div>
                    <h2 className="text-lg md:text-xl font-bold text-white">Storia & Cultura</h2>
                </div>
                 <button 
                    onClick={handleRegenerateClick} 
                    disabled={generating === 'full_page'}
                    className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs tracking-widest border border-rose-500"
                >
                    {generating === 'full_page' ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>}
                    {generating === 'full_page' ? 'RIGENERAZIONE...' : 'RIGENERA PAGINA'}
                </button>
            </div>

            <CultureHistory 
                city={city} 
                updateDetailField={updateDetailField}
                triggerPreview={triggerPreview}
            />
            
            <CulturePatron 
                city={city}
                updateDetailField={updateDetailField}
                triggerPreview={triggerPreview}
            />

            <div className="col-span-1 lg:col-span-2">
                <CulturePeople 
                    cityId={city.id}
                    cityName={city.name}
                    currentUser={currentUser}
                />
            </div>
        </div>
    );
};
