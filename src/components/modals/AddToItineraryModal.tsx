import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Trash2, Calendar, CheckCircle, Edit2, Briefcase } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { PointOfInterest, ItineraryItem } from '../../types/index';
import { getDaysArray } from '../../utils/common';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';

/** Slot orari a intervalli di 15 minuti — stessa griglia usata negli altri modali del Diario. */
const DIARY_TIME_SLOTS: string[] = (() => {
    const slots: string[] = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
            slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
    }
    return slots;
})();

function getLocalDateString(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

const MIN_DATE_STR = getLocalDateString();

interface AddToItineraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (dayIndex: number, time: string) => void;
    onRemove: (itemId: string) => void;
    poi: PointOfInterest | null;
    startDate: string | null;
    endDate: string | null;
    existingItems: ItineraryItem[];
    onDateSet: (start: string, end: string) => void; 
}

export const AddToItineraryModal = ({ isOpen, onClose, onConfirm, onRemove, poi, startDate, endDate, existingItems, onDateSet }: AddToItineraryModalProps) => {
    // Generate days array first to use it in initial state
    const days = useMemo(() => {
        if (!startDate || !endDate) return [];
        return getDaysArray(startDate, endDate);
    }, [startDate, endDate]);

    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('09:00');
    const [isRemoving, setIsRemoving] = useState(false);

    // ESC Handling
    useGlobalModalEscape(isOpen, onClose);

    const isMobile = useMobileDetect();
    const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
    const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
    const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
    const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
    const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
    const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);

    
    // NEW: Gestione manuale della vista date
    const [isEditingDates, setIsEditingDates] = useState(false);
    
    // Local state for date initialization
    const [initStart, setInitStart] = useState('');
    const [initEnd, setInitEnd] = useState('');
    
    // Determina se è una risorsa (Guida, Operatore, Servizio)
    const isResource = poi?.resourceType === 'guide' || poi?.resourceType === 'operator' || poi?.resourceType === 'service';

    // Check for existing instances of this POI
    const existingInstances = useMemo(() => {
        if (!poi) return [];
        return existingItems.filter(i => i.poi.id === poi.id).sort((a,b) => a.dayIndex - b.dayIndex || a.timeSlotStr.localeCompare(b.timeSlotStr));
    }, [existingItems, poi]);

    // Reset logic when modal opens
    useEffect(() => {
        if (isOpen) {
            // Se le date ci sono, pre-seleziona il primo giorno
            if (days.length > 0) {
                 setSelectedDate(days[0].toISOString().split('T')[0]);
                 setIsEditingDates(false);
            } else {
                 // Se non ci sono date, forza la vista date
                 setIsEditingDates(true);
            }
            
            // Inizializza i campi data con i valori attuali o default
            setInitStart(startDate || MIN_DATE_STR);
            setInitEnd(endDate || startDate || MIN_DATE_STR);
            
            setIsRemoving(false); 
        }
    }, [isOpen, startDate, endDate, days.length]); 



    if (!isOpen || !poi) return null;

    // Helper to get day index from selected date
    const getDayIndex = (dateStr: string) => {
        return days.findIndex(d => d.toISOString().split('T')[0] === dateStr);
    };

    // Helper to format date for display
    const getFormattedDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
    };

    const handleConfirm = () => {
        let targetDate = selectedDate;
        
        // Safety Fallback: If state is empty but we have days, force first day
        if (!targetDate && days.length > 0) {
             targetDate = days[0].toISOString().split('T')[0];
        }

        const idx = getDayIndex(targetDate);
        // Per risorse, l'orario è meno critico, ma passiamo comunque selectedTime per sort standard
        if (idx >= 0) {
            onConfirm(idx, selectedTime);
            // CHIUSURA IMMEDIATA SPOSTATA QUI SE IL PARENT NON LA GESTISCE
            // Nota: FeatureModals chiude il modale dopo onConfirm, ma per sicurezza...
        } else {
            console.warn("Date index not found, defaulting to Day 1");
            onConfirm(0, selectedTime);
        }
    };

    const handleRemoveInstance = (itemId: string) => {
        onRemove(itemId);
        if (existingInstances.length <= 1) {
             onClose();
        }
    };

    const handleSaveDates = () => {
        if (!initStart || !initEnd) return;
        onDateSet(initStart, initEnd);
        setIsEditingDates(false);
    };

    const currentDayIndex = getDayIndex(selectedDate);
    const tripStartLabel = startDate ?? '';
    const tripEndLabel = endDate ?? '';

    // --- RENDER CONTENT ---
    const modalContent = (
        <div 
            className={`td-modal-overlay ${overlayShell} !items-center`}
            onClick={days.length > 0 ? onClose : undefined}
            style={{ zIndex: Z_OVERLAY }}
        >
            
            {/* VIEW 1: DATE CONFIGURATION */}
            {(isEditingDates || days.length === 0) ? (
                <div 
                    className={`${containerShell} max-w-md outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900`}
                    style={{ zIndex: Z_MODAL }}
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="add-itinerary-dates-title"
                    aria-describedby="add-itinerary-dates-desc"
                >
                    <div className={`${bodyShell} flex flex-col items-center text-center gap-4 min-h-0`}>
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-8 h-8 text-amber-500" aria-hidden />
                        </div>
                        <h3 id="add-itinerary-dates-title" className={`${modalTitleShell} mb-2`}>Configura il tuo Viaggio</h3>
                        <p id="add-itinerary-dates-desc" className={modalSubtitleShell}>
                            Prima di aggiungere <strong className="text-white">{poi.name}</strong>, definisci le date del soggiorno.
                        </p>
                    </div>

                    <div className="space-y-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800 mb-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-500">Dal</label>
                                <input 
                                    type="date" 
                                    min={MIN_DATE_STR}
                                    value={initStart}
                                    onChange={(e) => setInitStart(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 focus:outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-500">Al</label>
                                <input 
                                    type="date" 
                                    min={initStart || MIN_DATE_STR}
                                    value={initEnd}
                                    onChange={(e) => setInitEnd(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {days.length > 0 ? (
                            <button onClick={() => setIsEditingDates(false)} className="px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-lg transition-colors border border-slate-700">
                                Indietro
                            </button>
                        ) : (
                             <button onClick={onClose} className="px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-lg transition-colors border border-slate-700">
                                Annulla
                            </button>
                        )}
                        
                        <button 
                            onClick={handleSaveDates} 
                            disabled={!initStart || !initEnd}
                            className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <CheckCircle className="w-4 h-4"/> Salva Date
                        </button>
                    </div>
                    </div>
                </div>
            ) : (
                // VIEW 2: STANDARD ADD TO ITINERARY (With Dates Pre-set)
                <div 
                    className={`${containerShell} max-w-md outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900`}
                    style={{ zIndex: Z_MODAL }}
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="add-itinerary-title"
                    aria-describedby="add-itinerary-desc"
                >
                    <div className={`${bodyShell} min-h-0`}>
                    <div className="flex justify-between items-start mb-6 border-b border-slate-800 pb-4">
                        <div>
                            <h3 id="add-itinerary-title" className={`${modalTitleShell} flex items-center gap-2`}>
                                 {isRemoving 
                                    ? 'Rimuovi Tappa' 
                                    : isResource ? (
                                        <>
                                            <Briefcase className="w-5 h-5 text-indigo-400" aria-hidden /> Salva Contatto
                                        </>
                                    ) : (
                                        'Aggiungi Tappa'
                                    )
                                 }
                            </h3>
                            <p id="add-itinerary-desc" className={`${modalSubtitleShell} mt-1`}>
                                {isRemoving 
                                    ? 'Seleziona quale istanza eliminare' 
                                    : isResource 
                                        ? 'Aggiungi questa risorsa al tuo diario di viaggio'
                                        : 'Scegli giorno e ora per la tua visita'
                                }
                            </p>
                        </div>
                        <CloseButton 
                            onClose={onClose}
                            variant="primary"
                            position="absolute"
                            className={`${closeOffsetShell} z-local-overlay`}
                        />
                    </div>

                    {/* TRIP DATES INFO BAR */}
                    {!isRemoving && tripStartLabel && tripEndLabel && (
                        <div className="flex justify-between items-center bg-indigo-900/20 border border-indigo-500/20 p-3 rounded-xl mb-4">
                            <div className="flex items-center gap-2 text-indigo-300">
                                <Calendar className="w-4 h-4" aria-hidden />
                                <span className="text-xs font-bold uppercase tracking-wide">
                                    Viaggio: {getFormattedDate(tripStartLabel)} - {getFormattedDate(tripEndLabel)}
                                </span>
                            </div>
                            <button 
                                onClick={() => setIsEditingDates(true)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700"
                                title="Modifica date viaggio"
                            >
                                <Edit2 className="w-3.5 h-3.5"/>
                            </button>
                        </div>
                    )}

                    <div className="flex items-start gap-4 mb-6 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <ImageWithFallback 
                            src={poi.imageUrl} 
                            alt={poi.name} 
                            category={poi.category}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                            <h4 className="text-white font-bold text-sm mb-1 break-words">{poi.name}</h4>
                            <div className="flex items-start gap-1 text-xs text-slate-400">
                                <MapPin className="w-3 h-3 text-amber-500 shrink-0 mt-0.5"/>
                                <span className="line-clamp-2 break-words leading-snug">{poi.address || "Indirizzo non disponibile"}</span>
                            </div>
                        </div>
                    </div>

                    {isRemoving ? (
                        <div className="space-y-3 animate-in fade-in slide-in-from-right-4">
                             {existingInstances.map(item => (
                                <div key={item.id} className="flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-700 hover:border-red-500/50 transition-colors">
                                    <div className="flex items-center gap-3 text-sm text-slate-300">
                                        <div className="bg-slate-900 p-1.5 rounded text-amber-500">
                                             <Calendar className="w-4 h-4"/>
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">Giorno {item.dayIndex + 1}</div>
                                            <div className="font-mono text-xs bg-slate-900 px-1.5 rounded inline-block text-slate-400">{item.timeSlotStr}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveInstance(item.id)}
                                        className="text-red-400 hover:text-white hover:bg-red-600 p-2 rounded-lg transition-colors border border-red-900/30"
                                        title="Elimina questa istanza"
                                    >
                                        <Trash2 className="w-4 h-4"/>
                                    </button>
                                </div>
                            ))}
                             <button onClick={() => setIsRemoving(false)} className="w-full mt-4 text-slate-500 text-xs uppercase font-bold hover:text-white py-2">Annulla e torna indietro</button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                {/* Per Risorse, i Time Slot sono meno rilevanti visivamente ma servono per il sort */}
                                {isResource ? (
                                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400">
                                        <p className="mb-3">A quale giorno vuoi associare questa risorsa?</p>
                                        <select 
                                            value={selectedDate} 
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none cursor-pointer font-bold"
                                        >
                                            {days.map((d, i) => {
                                                const val = d.toISOString().split('T')[0];
                                                return <option key={val} value={val}>Giorno {i + 1} ({getFormattedDate(val)})</option>
                                            })}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-slate-500">Data</label>
                                            <select 
                                                value={selectedDate} 
                                                onChange={(e) => setSelectedDate(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-amber-500 focus:outline-none cursor-pointer"
                                            >
                                                {days.map((d) => {
                                                    const val = d.toISOString().split('T')[0];
                                                    return <option key={val} value={val}>{getFormattedDate(val)}</option>
                                                })}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-slate-500">Ora</label>
                                            <select 
                                                value={selectedTime}
                                                onChange={(e) => setSelectedTime(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-amber-500 focus:outline-none cursor-pointer"
                                            >
                                                {DIARY_TIME_SLOTS.map(time => {
                                                    const conflict = existingItems.find(item => item.dayIndex === currentDayIndex && item.timeSlotStr === time);
                                                    const label = time + (conflict ? ` - Occupato` : '');
                                                    return (
                                                        <option key={time} value={time} className={conflict ? "text-amber-500 font-bold bg-slate-800" : "text-slate-300"}>
                                                            {label}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button onClick={onClose} className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-lg transition-colors border border-slate-700">
                                    Annulla
                                </button>
                                {existingInstances.length > 0 && (
                                    <button
                                        onClick={() => setIsRemoving(true)}
                                        className="px-4 bg-red-900/10 hover:bg-red-900/30 text-red-500 hover:text-red-400 font-bold py-3 rounded-lg transition-colors border border-red-900/30 flex items-center justify-center gap-2"
                                        title="Rimuovi dal diario"
                                    >
                                        <Trash2 className="w-4 h-4"/> 
                                    </button>
                                )}
                                <button onClick={handleConfirm} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2">
                                    <CheckCircle className="w-4 h-4"/> {isResource ? 'Salva Contatto' : 'Conferma Tappa'}
                                </button>
                            </div>
                        </>
                    )}
                    </div>
                </div>
            )}
        </div>
    );

    // USE PORTAL FOR HIGH Z-INDEX
    return createPortal(modalContent, document.body);
};



