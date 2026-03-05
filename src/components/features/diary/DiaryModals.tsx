
import React from 'react';
import { createPortal } from 'react-dom';
import { DateChangeWarningModal } from '../../modals/DateChangeWarningModal';
import { SaveAsModal } from '../../modals/SaveAsModal';
import { ConfirmClearModal } from '../../modals/ConfirmClearModal';
import { MobileMoveModal } from '../../modals/MobileMoveModal';
import { AddToItineraryModal } from '../../modals/AddToItineraryModal';
import { Itinerary, ItineraryItem } from '../../../types/index';
import { useSystemMessage } from '../../../hooks/useSystemMessage'; 
import { CheckCircle, Trophy, X, Save, Check } from 'lucide-react';

interface DiaryModalsProps {
    state: {
        itemToMove: ItineraryItem | null;
        saveAsModalOpen: boolean;
        clearModalOpen: boolean;
        warningModal: { isOpen: boolean; type: 'startDate' | 'endDate'; value: string; lostCount: number } | null;
        memoTargetItem: ItineraryItem | null;
        toastMessage: {title: string, xp: number} | null;
    };
    setters: {
        setItemToMove: (item: ItineraryItem | null) => void;
        setSaveAsModalOpen: (v: boolean) => void;
        setClearModalOpen: (v: boolean) => void;
        setWarningModal: (val: any) => void;
        setItinerary: React.Dispatch<React.SetStateAction<Itinerary>>;
        setToastMessage: (msg: {title: string, xp: number} | null) => void;
        setMemoTargetItem: (item: ItineraryItem | null) => void;
    };
    actions: {
        saveProject: (name?: string, isSaveAs?: boolean) => Promise<boolean>;
        clearItinerary: () => void;
        confirmDateChange: () => void;
        handleConfirmAddMemo: (day: number, time: string) => void;
    };
    itinerary: Itinerary;
    days: Date[];
    onDayDrop: (dayIndex: number, data: string, targetTime?: string) => void;
}

export const DiaryModals: React.FC<DiaryModalsProps> = ({ 
    state, 
    setters, 
    actions, 
    itinerary, 
    days, 
    onDayDrop 
}) => {
    
    const { getText: getSuccessMsg } = useSystemMessage('toast_save_success');

    const handleSaveConfirm = async (name: string) => {
        // La logica di toastMessage è ora gestita dentro actions.saveProject nel hook useDiaryLogic
        // che invocherà setters.setToastMessage in caso di successo.
        const success = await actions.saveProject(name, true); // Pass true for isSaveAs
        if (success) {
            setters.setSaveAsModalOpen(false);
        }
    };

    return (
        <>
            {state.itemToMove && (
                <MobileMoveModal 
                    isOpen={true} 
                    onClose={() => setters.setItemToMove(null)} 
                    onConfirm={(nd, nt, forceSwap) => { 
                        if (state.itemToMove) {
                            onDayDrop(nd, JSON.stringify({ type: 'MOVE_ITEM', id: state.itemToMove.id, forceSwap }), nt); 
                        }
                        setters.setItemToMove(null); 
                    }} 
                    item={state.itemToMove} 
                    days={days} 
                    allItems={itinerary.items} 
                />
            )}
            
            {state.memoTargetItem && (
                <AddToItineraryModal 
                    isOpen={true} 
                    onClose={() => setters.setMemoTargetItem(null)} 
                    onConfirm={(day, time) => actions.handleConfirmAddMemo(day, time)} 
                    onRemove={() => {}} 
                    poi={state.memoTargetItem.poi} 
                    startDate={itinerary.startDate} 
                    endDate={itinerary.endDate} 
                    existingItems={itinerary.items} 
                    onDateSet={(s, e) => setters.setItinerary(prev => ({...prev, startDate: s, endDate: e}))} 
                />
            )}

            {state.warningModal && (
                <DateChangeWarningModal 
                    isOpen={state.warningModal.isOpen} 
                    onClose={() => setters.setWarningModal(null)} 
                    onConfirm={actions.confirmDateChange} 
                    lostDaysCount={state.warningModal.lostCount} 
                />
            )}

            {state.saveAsModalOpen && (
                <SaveAsModal 
                    isOpen={state.saveAsModalOpen} 
                    onClose={() => setters.setSaveAsModalOpen(false)} 
                    onConfirm={handleSaveConfirm} 
                    currentName={itinerary.name} 
                />
            )}

            {state.clearModalOpen && (
                <ConfirmClearModal 
                    isOpen={state.clearModalOpen} 
                    onClose={() => setters.setClearModalOpen(false)} 
                    onConfirm={actions.clearItinerary} 
                />
            )}

            {/* MODALE DI SUCCESSO VERO E PROPRIO (BLOCCANTE) */}
            {state.toastMessage && createPortal(
                <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
                    <div className="bg-slate-900 border border-emerald-500/50 p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-600"></div>
                        <button onClick={() => setters.setToastMessage(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white p-2"><X className="w-5 h-5"/></button>
                        
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                            {state.toastMessage.xp > 0 ? (
                                <Trophy className="w-10 h-10 text-emerald-500 animate-bounce"/>
                            ) : (
                                <Save className="w-10 h-10 text-emerald-500"/>
                            )}
                        </div>
                        
                        <h3 className="text-2xl font-display font-bold text-white mb-2">{state.toastMessage.title}</h3>
                        
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                            {state.toastMessage.xp > 0 ? (
                                <>
                                    <strong className="text-white block mt-2 text-lg">+{state.toastMessage.xp} XP</strong> 
                                    <span className="text-xs font-normal opacity-70">Aggiunti al tuo profilo</span>
                                </>
                            ) : (
                                "Le modifiche sono state salvate nel cloud in modo sicuro."
                            )}
                        </p>

                        <button 
                            onClick={() => setters.setToastMessage(null)} 
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Check className="w-4 h-4"/> Ok
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};
