import { Z_MODAL } from '@/constants/zIndex';
import React, { Suspense } from 'react';
import { createPortal } from 'react-dom';
import { DateChangeWarningModal } from '../../modals/DateChangeWarningModal';
import { SaveAsModal } from '../../modals/SaveAsModal';
import { ConfirmClearModal } from '../../modals/ConfirmClearModal';
import { MobileMoveModal } from '../../modals/MobileMoveModal';
import { AddToItineraryModal } from '../../modals/AddToItineraryModal';
import { Itinerary, ItineraryItem } from '../../../types/index';
import { useSystemMessage } from '../../../hooks/useSystemMessage'; 
import { CheckCircle, Trophy, Save, Check } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';


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
        saveProject: (name?: string, isSaveAs?: boolean) => Promise<string | null>;
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
        const savedId = await actions.saveProject(name, true);
        if (savedId) {
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
                <div className="fixed inset-0 pointer-events-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in text-center" style={{ zIndex: Z_MODAL }}>
                    <div className="w-full max-w-sm bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                        <CloseButton onClose={() => setters.setToastMessage(null)} variant="primary" position="absolute" className="top-4 right-4" />
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
                        <div className="relative">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                <Trophy className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h2 className="text-white font-black text-2xl uppercase tracking-wider mb-2">
                                {state.toastMessage.title || "Ottimo Lavoro!"}
                            </h2>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8 whitespace-pre-line">
                                {state.toastMessage.xp > 0 ? (
                                    <>
                                        Hai guadagnato punti esperienza per questa attività. 
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
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};



