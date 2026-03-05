
import React, { useState } from 'react';
import { Database, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import { FULL_SYSTEM_RULES } from '../../../data/system/designRules';
import { DeleteConfirmationModal } from '../../common/DeleteConfirmationModal';

export const MobileStylesSeeder = ({ onComplete }: { onComplete: () => void }) => {
    const [seeding, setSeeding] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSeed = () => {
        setShowConfirm(true);
    };

    const executeSeed = async () => {
        setShowConfirm(false);
        setSeeding(true);
        try {
            for (const rule of FULL_SYSTEM_RULES) {
                await supabase.from('design_system_rules').upsert({
                    ...rule,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'component_key' });
            }
            alert("Design System ripristinato completamente! (Desktop, Mobile & Guida)");
            onComplete();
        } catch (e) {
            alert("Errore ripristino DB.");
        } finally {
            setSeeding(false);
        }
    };

    return (
        <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between mb-6 shadow-lg">
            <DeleteConfirmationModal 
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={executeSeed}
                title="Ripristino Design System"
                message="Attenzione: Questo sovrascriverà eventuali modifiche manuali al Design System con i valori di default. Continuare?"
                confirmLabel="Ripristina"
                variant="info"
            />
            <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500"><Database className="w-5 h-5"/></div>
                <div>
                    <h4 className="text-sm font-bold text-white">Ripristino Design System Completo</h4>
                    <p className="text-xs text-slate-400">Ricrea tutte le regole (inclusa la nuova sezione Guida) nel database.</p>
                </div>
            </div>
            <button 
                onClick={handleSeed} 
                disabled={seeding}
                className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all"
            >
                {seeding ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4"/>}
                Ripristina Tutto
            </button>
        </div>
    );
};
