import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';
import React from 'react';
import { createPortal } from 'react-dom';
import { DateChangeWarningModal } from '../../modals/DateChangeWarningModal';
import { SaveAsModal } from '../../modals/SaveAsModal';
import { ConfirmClearModal } from '../../modals/ConfirmClearModal';
import { MobileMoveModal } from '../../modals/MobileMoveModal';
import { AddToItineraryModal } from '../../modals/AddToItineraryModal';
import { Itinerary, ItineraryItem } from '../../../types/index';
import { useSystemMessage } from '../../../hooks/useSystemMessage';
import { Trophy, Check } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { useAreRewardsEnabled } from '@/hooks/useAreRewardsEnabled';
import { RewardsFreezeNotice } from '@/components/gamification/RewardsFreezeNotice';

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
    const rewardsEnabled = useAreRewardsEnabled();

    const isMobile = useMobileDetect();
    const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
    const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
    const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
    const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
    const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
    const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);

    const xpToastOpen = state.toastMessage !== null;
    const handleCloseXpToast = () => setters.setToastMessage(null);
    useGlobalModalEscape(xpToastOpen, handleCloseXpToast);

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

            {state.toastMessage && createPortal(
                <div
                    className={`td-modal-overlay ${overlayShell} !items-center`}
                    style={{ zIndex: Z_OVERLAY }}
                    onClick={handleCloseXpToast}
                >
                    <div
                        className={`${containerShell} max-w-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 border-emerald-500/30`}
                        style={{ zIndex: Z_MODAL }}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="diary-xp-success-title"
                        aria-describedby="diary-xp-success-desc"
                    >
                        <CloseButton
                            onClose={handleCloseXpToast}
                            variant="primary"
                            position="absolute"
                            className={`${closeOffsetShell} z-local-overlay`}
                        />
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden />
                        <div className={`${bodyShell} flex flex-col items-center text-center gap-4 min-h-0`}>
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                <Trophy className="w-10 h-10 text-emerald-500" aria-hidden />
                            </div>
                            <h2 id="diary-xp-success-title" className={`${modalTitleShell} uppercase tracking-wider`}>
                                {state.toastMessage.title || getSuccessMsg().title || 'Ottimo Lavoro!'}
                            </h2>
                            <p id="diary-xp-success-desc" className={`${modalSubtitleShell} whitespace-pre-line`}>
                                {state.toastMessage.xp > 0 ? (
                                    <>
                                        Hai guadagnato punti esperienza per questa attività.
                                        <strong className="text-white block mt-2 text-lg">+{state.toastMessage.xp} XP</strong>
                                        <span className="text-xs font-normal opacity-70">Aggiunti al tuo profilo</span>
                                    </>
                                ) : (
                                    'Le modifiche sono state salvate nel cloud in modo sicuro.'
                                )}
                            </p>
                            {state.toastMessage.xp > 0 && !rewardsEnabled && (
                                <RewardsFreezeNotice variant="compact" className="w-full" />
                            )}
                            <button
                                type="button"
                                onClick={handleCloseXpToast}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Check className="w-4 h-4" aria-hidden /> Ok
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

