
import React, { useState } from 'react';
import { Loader2, RefreshCw, CheckCircle, Bot, Sparkles, Database, X } from 'lucide-react';
import { useCityEditor } from '@/context/CityEditorContext';
import { useSystemMessage } from '../../../../hooks/useSystemMessage'; 
import { AdminTaxonomyManager } from '../../AdminTaxonomyManager'; 
import { User } from '../../../../types/users';

// IMPORT SUB-COMPONENTS
import { ServiceGuides } from '../services/ServiceGuides';
import { ServiceEvents } from '../services/ServiceEvents';
import { ServiceOperators } from '../services/ServiceOperators';
import { ServiceGeneric } from '../services/ServiceGeneric';
import { EditorInfo } from '../services/EditorInfo';

export const TabServices = ({ currentUser }: { currentUser: User }) => {
    const { city, reloadCurrentCity } = useCityEditor();
    
    // STATES FOR MASSIVE REGENERATION
    const [generating, setGenerating] = useState(false);
    const [genStatus, setGenStatus] = useState<string>('');
    const [showConfirmRegen, setShowConfirmRegen] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    
    // STATE FOR TAXONOMY MODAL
    const [isTaxonomyOpen, setIsTaxonomyOpen] = useState(false);

    const { getText: getRegenMessage } = useSystemMessage('city_regen_merge');
    const regenMsg = getRegenMessage();

    if (!city) return null;

    // --- DELEGATED TO EDITORINFO BUT KEPT HERE FOR LAYOUT ---
    // The previous implementation had regeneration logic here, but EditorInfo also has it.
    // To avoid duplication and bugs, we should use EditorInfo which contains the specific logic for services regeneration.
    // However, the original structure used TabServices as a wrapper.
    // Let's use EditorInfo directly inside here.

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in relative">
             
             {/* MODALE TASSONOMIA (OVERLAY) */}
             {isTaxonomyOpen && (
                <div className="fixed inset-0 z-[3000] bg-slate-950 flex flex-col animate-in fade-in">
                     <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#0f172a] shrink-0">
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-indigo-600 rounded-lg"><Database className="w-5 h-5 text-white"/></div>
                             <h2 className="text-lg font-bold text-white uppercase tracking-wide">Gestione Tassonomia</h2>
                         </div>
                         <button onClick={() => setIsTaxonomyOpen(false)} className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors"><X className="w-6 h-6"/></button>
                     </div>
                     <div className="flex-1 overflow-hidden">
                         <AdminTaxonomyManager />
                     </div>
                </div>
            )}
            
            {/* The EditorInfo component handles the top regeneration bar and the grids */}
            <EditorInfo currentUser={currentUser} onOpenTaxonomy={() => setIsTaxonomyOpen(true)} />
            
        </div>
    );
};
