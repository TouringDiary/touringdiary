import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles } from 'lucide-react';
import { CORE_CATEGORY_NAMES, CATEGORY_ORDER } from '@/domain/packing/packingCategories';
import { AiSuggestion } from '../SuitcaseFloatingPanel/hooks/useSuitcaseSuggestions';
import { AiSuggestionsSetupStep } from './AiSuggestionsSetupStep';
import { AiSuggestionsReviewStep } from './AiSuggestionsReviewStep';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';
import { useDynamicStyles } from '@/hooks/useDynamicStyles';
import { ToastVariant } from '@/types/toast';

interface AiSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (categories: string[], mode: 'direct' | 'review') => void;
  onShowMore: () => void;
  onAccept: (name: string, category: string) => Promise<void>;
  onReject: (name: string, category: string) => Promise<void>;
  showToast?: (message: string, description?: string, variant?: ToastVariant) => void;
  isGenerating: boolean;
  initialCategories?: string[];
  suggestions: AiSuggestion[];
  hasMore: boolean;
}

export const AiSuggestionsModal: React.FC<AiSuggestionsModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  onShowMore,
  onAccept,
  onReject,
  showToast,
  isGenerating,
  initialCategories = [],
  suggestions,
  hasMore
}) => {
  const [step, setStep] = useState<'setup' | 'review'>('setup');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [mode, setMode] = useState<'direct' | 'review'>('review');
  const [showAddCategoryDropdown, setShowAddCategoryDropdown] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState<'accept-all' | 'reject-all' | null>(null);
  const [isBulkRunning, setIsBulkRunning] = useState(false);

  // Rilevamento Mobile per Design System
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Token Design System
  const titleStyle = useDynamicStyles('suitcase_title', isMobile);
  const subtitleStyle = useDynamicStyles('suitcase_text_support', isMobile);
  const btnLabelStyle = useDynamicStyles('suitcase_label_caps', isMobile);

  // Inizializzazione categorie basata su prop o default
  useEffect(() => {
    if (isOpen && selectedCategories.length === 0) {
      setSelectedCategories(initialCategories.length > 0 ? initialCategories : [...CORE_CATEGORY_NAMES].slice(0, 4));
    }
  }, [isOpen, initialCategories]);

  // Reset step alla chiusura
  useEffect(() => {
    if (!isOpen) {
      setStep('setup');
      setShowAddCategoryDropdown(false);
      setBulkConfirm(null);
      setIsBulkRunning(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const bulkDisabled = isGenerating || isBulkRunning || pendingSuggestions.length === 0;

  const handleDismiss = () => {
    if (isBulkRunning) return;
    onClose();
  };

  const runBulkAccept = async () => {
    const count = pendingSuggestions.length;
    if (count === 0) return;

    setIsBulkRunning(true);
    try {
      for (const s of pendingSuggestions) {
        await onAccept(s.name, s.category);
      }
      showToast?.(
        count === 1 ? 'Suggerimento accettato' : `${count} suggerimenti accettati`,
        'Gli oggetti sono stati aggiunti alla valigia.',
        'success'
      );
      onClose();
    } finally {
      setIsBulkRunning(false);
      setBulkConfirm(null);
    }
  };

  const runBulkReject = async () => {
    const count = pendingSuggestions.length;
    if (count === 0) return;

    setIsBulkRunning(true);
    try {
      for (const s of pendingSuggestions) {
        await onReject(s.name, s.category);
      }
      showToast?.(
        count === 1 ? 'Suggerimento rifiutato' : `${count} suggerimenti rifiutati`,
        'Gli oggetti non verranno più suggeriti per questa valigia.',
        'success'
      );
      onClose();
    } finally {
      setIsBulkRunning(false);
      setBulkConfirm(null);
    }
  };

  const removeCategory = (cat: string) => {
    setSelectedCategories(prev => prev.filter(c => c !== cat));
  };

  const addCategory = (cat: string) => {
    if (!selectedCategories.includes(cat)) {
      setSelectedCategories(prev => [...prev, cat]);
    }
    setShowAddCategoryDropdown(false);
  };

  const availableCategories = CATEGORY_ORDER.filter(c => !selectedCategories.includes(c));

  const handleGenerate = () => {
    if (mode === 'direct') {
      onGenerate(selectedCategories, 'direct');
      onClose();
    } else {
      setStep('review');
      onGenerate(selectedCategories, 'review');
    }
  };

  return createPortal(
    <div 
      className="td-modal-overlay bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300 flex items-center justify-center p-4 md:p-6"
      style={{ zIndex: Z_OVERLAY }}
      onClick={handleDismiss}
    >
      {/* Modal Content */}
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col max-h-[90vh]"
        style={{ zIndex: Z_MODAL }}
        onClick={(e) => e.stopPropagation()}
      >
        <CloseButton 
          onClose={handleDismiss}
          disableIfDirty={isBulkRunning}
          disabled={isBulkRunning}
          variant="primary"
          position="absolute"
          className="top-6 right-8"
        />
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
              <Sparkles className={`w-6 h-6 ${isGenerating ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className={`${titleStyle || "text-xl font-bold text-white"} leading-none mb-1`}>Suggerimenti AI</h3>
              <p className={`${subtitleStyle || "text-xs text-slate-400 font-medium"}`}>
                {step === 'setup' ? 'Configura la generazione intelligente' : 'Revisione suggerimenti'}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {step === 'setup' ? (
            <AiSuggestionsSetupStep
              selectedCategories={selectedCategories}
              availableCategories={availableCategories}
              showAddCategoryDropdown={showAddCategoryDropdown}
              mode={mode}
              onAddCategory={addCategory}
              onRemoveCategory={removeCategory}
              onToggleDropdown={() => setShowAddCategoryDropdown(!showAddCategoryDropdown)}
              onSetMode={setMode}
            />
          ) : (
            <AiSuggestionsReviewStep
              suggestions={suggestions}
              isGenerating={isGenerating}
              hasMore={hasMore}
              onShowMore={onShowMore}
              onAccept={onAccept}
              onReject={onReject}
              onBackToSetup={() => setStep('setup')}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-white/5 bg-slate-900/50 shrink-0 flex items-center justify-between gap-4">
          {step === 'setup' ? (
            <>
              <button
                onClick={onClose}
                className={`px-6 py-3 rounded-xl ${btnLabelStyle || "text-[10px] font-black text-slate-400 uppercase tracking-widest"} hover:text-white transition-colors`}
              >
                Annulla
              </button>
              <button
                onClick={handleGenerate}
                disabled={selectedCategories.length === 0 || isGenerating}
                className="px-8 py-4 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-3"
              >
                <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                Genera Suggerimenti
              </button>
            </>
          ) : bulkConfirm ? (
            <>
              <p className={`${subtitleStyle || "text-xs text-slate-400"} flex-1`}>
                {bulkConfirm === 'accept-all'
                  ? `Accettare ${pendingSuggestions.length} suggerimenti e aggiungerli alla valigia?`
                  : `Rifiutare ${pendingSuggestions.length} suggerimenti e inserirli in blacklist?`}
              </p>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setBulkConfirm(null)}
                  disabled={isBulkRunning}
                  className={`px-6 py-3 rounded-xl ${btnLabelStyle || "text-[10px] font-black text-slate-400 uppercase tracking-widest"} hover:text-white transition-colors disabled:opacity-50`}
                >
                  Annulla
                </button>
                <button
                  onClick={bulkConfirm === 'accept-all' ? runBulkAccept : runBulkReject}
                  disabled={isBulkRunning}
                  className={`px-8 py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                    bulkConfirm === 'accept-all'
                      ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
                      : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
                  }`}
                >
                  {isBulkRunning ? 'Elaborazione...' : 'Conferma'}
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={isBulkRunning}
                className={`px-6 py-3 rounded-xl ${btnLabelStyle || "text-[10px] font-black text-slate-400 uppercase tracking-widest"} hover:text-white transition-colors disabled:opacity-50`}
              >
                Chiudi
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setBulkConfirm('reject-all')}
                  disabled={bulkDisabled}
                  className="px-6 py-3 rounded-xl bg-rose-600/10 border border-rose-500/30 text-rose-400 text-[10px] font-black uppercase tracking-widest hover:bg-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Rifiuta Tutti
                </button>
                <button
                  onClick={() => setBulkConfirm('accept-all')}
                  disabled={bulkDisabled}
                  className="px-8 py-4 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
                >
                  Accetta Tutti
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

