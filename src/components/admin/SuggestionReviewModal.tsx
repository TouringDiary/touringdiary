
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, CheckCircle, XCircle, Clock, MapPin, AlertCircle, Loader2, Award, ShieldAlert, Edit3, Wand2, AlertOctagon, UserX, PenTool, Plus, AlertTriangle, Link as LinkIcon, Pencil, Calendar } from 'lucide-react';
import { SuggestionRequest, PointOfInterest, User } from '../../types/index';
import { getCityDetails } from '../../services/cityService';
import { applySuggestion, updateSuggestionStatus } from '../../services/communityService';
import { getAiClient } from '../../services/ai/aiClient';
import { cleanJsonOutput } from '../../services/ai';
import { ImageWithFallback } from '../common/ImageWithFallback';

// ... (INTERFACES & CONSTANTS)

export const SuggestionReviewModal = ({ suggestion, onClose, onUpdate, onUserUpdate }: any) => {
    // ... (STATE)
    const [isAiChecking, setIsAiChecking] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [editData, setEditData] = useState<any>({ ...suggestion.details });
    const [allCityPois, setAllCityPois] = useState<any[]>([]);

    // ... (EFFECTS)

    const handleAiDeepCheck = async () => {
        setIsAiChecking(true);
        setLocalError(null);
        try {
            const aiClient = getAiClient();
            const prompt = `Sei un verificatore di dati turistici per Touring Diary.
            Verifica: "${editData.title}" a ${suggestion.cityName}.
            Indirizzo: "${editData.address}".

            RISPONDI SOLO JSON: { "found": true, "title": "...", "category": "...", "address": "...", "openingHours": "...", "description": "...", "lat": 0.0, "lng": 0.0 }`;

            const response = await aiClient.models.generateContent({ model: 'gemini-3.1-pro-preview', contents: prompt });
            const result = JSON.parse(cleanJsonOutput(response.text || "{}"));
            
            if (result.found === false) {
                setLocalError("L'AI non ha trovato riscontri reali per questo luogo.");
                return;
            }

            setEditData((prev: any) => ({
                ...prev,
                title: result.title || prev.title,
                category: result.category || prev.category,
                address: result.address || prev.address,
                openingHours: result.openingHours || prev.openingHours,
                description: result.description || prev.description,
                coords: { lat: result.lat || prev.coords.lat, lng: result.lng || prev.coords.lng }
            }));

        } catch (e) {
            setLocalError("Errore controllo AI.");
        } finally {
            setIsAiChecking(false);
        }
    };

    // ... (RENDER)
    return (
         <div className="fixed top-24 bottom-0 left-0 right-0 z-[600] flex items-center justify-center p-4">
             {/* ... */}
             <button onClick={handleAiDeepCheck} disabled={isAiChecking} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all transform active:scale-95">
                {isAiChecking ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>} AI Deep Check
             </button>
             {localError && <div className="text-red-400 text-xs mt-2">{localError}</div>}
             {/* ... */}
         </div>
    );
};
