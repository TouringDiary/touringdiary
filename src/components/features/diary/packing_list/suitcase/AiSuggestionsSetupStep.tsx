import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Plus, Minus, LayoutGrid, Settings2, ListChecks, ChevronDown, Check, Hash, Layers } from 'lucide-react';
import { ItemCategoryIcon } from './SuitcaseUtils';
import { useDynamicStyles } from '@/hooks/useDynamicStyles';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { useCloseOnEscape } from '@/hooks/useCloseOnEscape';
import { getSystemCategoryOrderIndexExact, SystemCategoryName } from '@/domain/packing/packingCategories';
import { clampCategoryLimit } from '@/hooks/useSuitcaseSystem';

export type AiQuotaMode = 'uniform' | 'custom';

const UNIFORM_PRESETS = [3, 5, 10] as const;

const SECTION_HEADING_LAYOUT_CLASS = 'flex items-center gap-2';
const SECTION_COUNTER_CLASS = 'text-[10px] text-amber-500/75 font-bold';
const EMPTY_STATE_FALLBACK = 'text-[12px] text-slate-500 font-normal italic';
const CATEGORY_CHIP_FALLBACK = 'text-[12.5px] font-bold font-sans';
const DROPDOWN_PANEL_CLASS =
  'absolute top-full left-0 mt-2 w-64 max-w-[calc(100vw-3rem)] max-h-64 overflow-y-auto custom-scrollbar bg-slate-800 border border-white/10 rounded-2xl shadow-2xl z-local-flyout py-2 animate-in fade-in slide-in-from-top-2 duration-200';

interface AiSuggestionsSetupStepProps {
  selectedCategories: string[];
  removedCategories: string[];
  availableCategories: string[];
  showAddCategoryDropdown: boolean;
  mode: 'direct' | 'review';
  quotaMode: AiQuotaMode;
  uniformLimit: number;
  customLimits: Partial<Record<SystemCategoryName, number>>;
  onAddCategory: (cat: string) => void;
  onRemoveCategory: (cat: string) => void;
  onRestoreCategory: (cat: string) => void;
  onToggleDropdown: () => void;
  onSetMode: (mode: 'direct' | 'review') => void;
  onSetQuotaMode: (mode: AiQuotaMode) => void;
  onSetUniformLimit: (limit: number) => void;
  onSetCustomLimit: (category: SystemCategoryName, limit: number) => void;
}

export const AiSuggestionsSetupStep: React.FC<AiSuggestionsSetupStepProps> = ({
  selectedCategories,
  removedCategories,
  availableCategories,
  showAddCategoryDropdown,
  mode,
  quotaMode,
  uniformLimit,
  customLimits,
  onAddCategory,
  onRemoveCategory,
  onRestoreCategory,
  onToggleDropdown,
  onSetMode,
  onSetQuotaMode,
  onSetUniformLimit,
  onSetCustomLimit,
}) => {
  const isMobile = useMobileDetect();
  const itemPrimaryStyle = useDynamicStyles('suitcase_item_primary', isMobile);
  const emptyStateStyle = useDynamicStyles('suitcase_empty_state', isMobile);
  const categoryChipStyle = useDynamicStyles('suitcase_category_chip', isMobile);

  const sectionTitle = useFoundationStyles(FOUNDATION_STYLE_KEYS.sectionTitle, isMobile);
  const sectionTitleIcon = useFoundationStyles(FOUNDATION_STYLE_KEYS.sectionTitleIcon, isMobile);
  const sectionDescription = useFoundationStyles(FOUNDATION_STYLE_KEYS.sectionDescription, isMobile);
  const selectableCardBase = useFoundationStyles(FOUNDATION_STYLE_KEYS.selectableCardBase);
  const selectableCardSelected = useFoundationStyles(FOUNDATION_STYLE_KEYS.selectableCardSelected);
  const selectableCardUnselected = useFoundationStyles(FOUNDATION_STYLE_KEYS.selectableCardUnselected);
  const selectableCardHeaderRow = useFoundationStyles(FOUNDATION_STYLE_KEYS.selectableCardHeaderRow);
  const selectableBadgeBase = useFoundationStyles(FOUNDATION_STYLE_KEYS.selectableBadgeBase);
  const selectableBadgeSelected = useFoundationStyles(FOUNDATION_STYLE_KEYS.selectableBadgeSelected);
  const selectableBadgeUnselected = useFoundationStyles(FOUNDATION_STYLE_KEYS.selectableBadgeUnselected);
  const selectableCheckIcon = useFoundationStyles(FOUNDATION_STYLE_KEYS.selectableCheckIcon);
  const selectableIconBoxBase = useFoundationStyles(FOUNDATION_STYLE_KEYS.selectableIconBoxBase);
  const selectableIconBoxSelected = useFoundationStyles(FOUNDATION_STYLE_KEYS.selectableIconBoxSelected);
  const selectableIconBoxUnselected = useFoundationStyles(FOUNDATION_STYLE_KEYS.selectableIconBoxUnselected);
  const selectableCardTitle = useFoundationStyles(FOUNDATION_STYLE_KEYS.selectableCardTitle, isMobile);
  const selectableCardDescription = useFoundationStyles(FOUNDATION_STYLE_KEYS.selectableCardDescription, isMobile);

  const [showSelectedDropdown, setShowSelectedDropdown] = useState(false);
  const [showAvailableDropdown, setShowAvailableDropdown] = useState(false);

  const selectedDropdownRef = useRef<HTMLDivElement>(null);
  const addCategoryDropdownRef = useRef<HTMLDivElement>(null);
  const availableDropdownRef = useRef<HTMLDivElement>(null);

  // Chiusura coerente delle dropdown del componente: click esterno (stesso
  // pattern di FilterSelect) + ESC (hook condiviso useCloseOnEscape).
  useEffect(() => {
    if (!showSelectedDropdown && !showAddCategoryDropdown && !showAvailableDropdown) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        showSelectedDropdown &&
        selectedDropdownRef.current &&
        !selectedDropdownRef.current.contains(target)
      ) {
        setShowSelectedDropdown(false);
      }
      if (
        showAddCategoryDropdown &&
        addCategoryDropdownRef.current &&
        !addCategoryDropdownRef.current.contains(target)
      ) {
        onToggleDropdown();
      }
      if (
        showAvailableDropdown &&
        availableDropdownRef.current &&
        !availableDropdownRef.current.contains(target)
      ) {
        setShowAvailableDropdown(false);
      }
    };
    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [showSelectedDropdown, showAddCategoryDropdown, showAvailableDropdown, onToggleDropdown]);

  useCloseOnEscape(() => setShowSelectedDropdown(false), showSelectedDropdown);
  useCloseOnEscape(onToggleDropdown, showAddCategoryDropdown);
  useCloseOnEscape(() => setShowAvailableDropdown(false), showAvailableDropdown);

  // Apertura mutuamente esclusiva: aprendo una dropdown si chiudono le altre.
  const toggleSelectedDropdown = () => {
    const willOpen = !showSelectedDropdown;
    setShowSelectedDropdown(willOpen);
    if (willOpen) {
      setShowAvailableDropdown(false);
      if (showAddCategoryDropdown) onToggleDropdown();
    }
  };

  const toggleAddCategoryDropdown = () => {
    if (!showAddCategoryDropdown) {
      setShowSelectedDropdown(false);
      setShowAvailableDropdown(false);
    }
    onToggleDropdown();
  };

  const toggleAvailableDropdown = () => {
    const willOpen = !showAvailableDropdown;
    setShowAvailableDropdown(willOpen);
    if (willOpen) {
      setShowSelectedDropdown(false);
      if (showAddCategoryDropdown) onToggleDropdown();
    }
  };

  const emptyStateClassName = emptyStateStyle || EMPTY_STATE_FALLBACK;
  const categoryChipClassName = categoryChipStyle || CATEGORY_CHIP_FALLBACK;

  const sortedRemovedCategories = useMemo(() => {
    return [...removedCategories].sort((a, b) => {
      const indexA = getSystemCategoryOrderIndexExact(a);
      const indexB = getSystemCategoryOrderIndexExact(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [removedCategories]);

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className={SECTION_HEADING_LAYOUT_CLASS}>
              <LayoutGrid className={sectionTitleIcon} aria-hidden />{' '}
              <span className={sectionTitle}>Categorie Selezionate</span>
            </h4>
            <p className={sectionDescription}>
              Seleziona le categorie per cui desideri ricevere suggerimenti nella valigia.
            </p>
          </div>
          <span className={SECTION_COUNTER_CLASS}>{selectedCategories.length} attive</span>
        </div>

        <div className="flex flex-wrap items-start gap-2">
          <div className="relative" ref={selectedDropdownRef}>
            <button
              type="button"
              onClick={toggleSelectedDropdown}
              aria-expanded={showSelectedDropdown}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 border border-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 text-[13px] font-bold"
            >
              <LayoutGrid className="w-4 h-4" />
              Categorie selezionate ({selectedCategories.length})
              <ChevronDown className={`w-3 h-3 transition-transform ${showSelectedDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showSelectedDropdown && (
              <div className={DROPDOWN_PANEL_CLASS}>
                {selectedCategories.length > 0 ? (
                  selectedCategories.map(cat => (
                    <div
                      key={cat}
                      className="w-full px-4 py-2 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors"
                    >
                      <span className={`flex items-center gap-3 min-w-0 ${categoryChipClassName} text-slate-200`}>
                        <ItemCategoryIcon category={cat} className="w-4 h-4 shrink-0" />
                        <span className="truncate">{cat}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveCategory(cat)}
                        aria-label={`Rimuovi categoria ${cat}`}
                        className="flex shrink-0 items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className={`px-4 py-2 ${emptyStateClassName}`}>
                    Nessuna categoria selezionata.
                  </p>
                )}
              </div>
            )}
          </div>

          {availableCategories.length > 0 && (
            <div className="relative" ref={addCategoryDropdownRef}>
              <button
                onClick={toggleAddCategoryDropdown}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/5 text-slate-300 hover:border-white/10 hover:text-slate-200 transition-all text-[13px] font-bold"
              >
                <Plus className="w-4 h-4" />
                Aggiungi
                <ChevronDown className={`w-3 h-3 transition-transform ${showAddCategoryDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showAddCategoryDropdown && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl z-local-flyout py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {availableCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => onAddCategory(cat)}
                      className={`w-full px-4 py-2.5 text-left ${categoryChipClassName} text-slate-200 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors`}
                    >
                      <ItemCategoryIcon category={cat} className="w-4 h-4" />
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className={SECTION_HEADING_LAYOUT_CLASS}>
              <Layers className={sectionTitleIcon} aria-hidden />{' '}
              <span className={sectionTitle}>Categorie Disponibili</span>
            </h4>
            <p className={sectionDescription}>
              Categorie che puoi aggiungere ai suggerimenti. Clicca sul + per selezionarle.
            </p>
          </div>
          <span className={SECTION_COUNTER_CLASS}>{sortedRemovedCategories.length} disponibili</span>
        </div>

        {sortedRemovedCategories.length > 0 ? (
          <div className="relative" ref={availableDropdownRef}>
            <button
              type="button"
              onClick={toggleAvailableDropdown}
              aria-expanded={showAvailableDropdown}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/5 text-slate-300 hover:border-white/10 hover:text-slate-200 transition-all text-[13px] font-bold"
            >
              <Layers className="w-4 h-4" />
              Aggiungi categoria
              <ChevronDown className={`w-3 h-3 transition-transform ${showAvailableDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showAvailableDropdown && (
              <div className={DROPDOWN_PANEL_CLASS}>
                {sortedRemovedCategories.map(cat => (
                  <div
                    key={cat}
                    className="w-full px-4 py-2 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors"
                  >
                    <span className={`flex items-center gap-3 min-w-0 ${categoryChipClassName} text-slate-200`}>
                      <ItemCategoryIcon category={cat} className="w-4 h-4 opacity-70 shrink-0" />
                      <span className="truncate">{cat}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onRestoreCategory(cat)}
                      aria-label={`Aggiungi categoria ${cat}`}
                      className="flex shrink-0 items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className={emptyStateClassName}>
            Nessuna categoria disponibile.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <h4 className={SECTION_HEADING_LAYOUT_CLASS}>
            <Hash className={sectionTitleIcon} aria-hidden />{' '}
            <span className={sectionTitle}>Quantità suggerimenti</span>
          </h4>
          <p className={sectionDescription}>
            Quanti oggetti suggeriti ricevere per ogni categoria attiva. Se il catalogo ne offre meno, verranno mostrati solo quelli disponibili.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSetQuotaMode('uniform')}
            className={`px-4 py-2.5 rounded-2xl text-[13px] font-bold border transition-all ${
              quotaMode === 'uniform'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-white/5 border-white/5 text-slate-300 hover:border-white/10'
            }`}
          >
            Standard
          </button>
          <button
            type="button"
            onClick={() => onSetQuotaMode('custom')}
            className={`px-4 py-2.5 rounded-2xl text-[13px] font-bold border transition-all ${
              quotaMode === 'custom'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-white/5 border-white/5 text-slate-300 hover:border-white/10'
            }`}
          >
            Personalizzata
          </button>
        </div>

        {quotaMode === 'uniform' && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Oggetti per categoria
            </p>
            <div className="flex flex-wrap gap-2">
            {UNIFORM_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onSetUniformLimit(preset)}
                aria-label={`${preset} oggetti per categoria`}
                className={`min-w-[3rem] px-4 py-2 rounded-xl text-sm font-black tabular-nums border transition-all ${
                  uniformLimit === preset
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
            </div>
          </div>
        )}

        {quotaMode === 'custom' && selectedCategories.length > 0 && (
          <div className="space-y-2">
            {selectedCategories.map((cat) => {
              const catKey = cat as SystemCategoryName;
              const value = customLimits[catKey] ?? uniformLimit;
              return (
                <div
                  key={cat}
                  className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ItemCategoryIcon category={cat} className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className={`${itemPrimaryStyle || "text-[15px] font-bold text-white"} truncate`}>{cat}</span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={value}
                    onChange={(e) => onSetCustomLimit(catKey, clampCategoryLimit(Number(e.target.value)))}
                    className="w-20 px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-[15px] font-bold text-center focus:outline-none focus:border-indigo-500/50"
                    aria-label={`Quantità suggerimenti per ${cat}`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h4 className={SECTION_HEADING_LAYOUT_CLASS}>
          <Settings2 className={sectionTitleIcon} aria-hidden />{' '}
          <span className={sectionTitle}>Suggerimenti in valigia</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          <button
            type="button"
            onClick={() => onSetMode('review')}
            aria-pressed={mode === 'review'}
            className={`${selectableCardBase} ${
              mode === 'review' ? selectableCardSelected : selectableCardUnselected
            }`}
          >
            <div
              className={`${selectableBadgeBase} ${
                mode === 'review' ? selectableBadgeSelected : selectableBadgeUnselected
              }`}
            >
              {mode === 'review' && <Check className={selectableCheckIcon} aria-hidden />}
            </div>

            <div className={selectableCardHeaderRow}>
              <div
                className={`${selectableIconBoxBase} ${
                  mode === 'review' ? selectableIconBoxSelected : selectableIconBoxUnselected
                }`}
              >
                <ListChecks className="w-5 h-5" aria-hidden />
              </div>
              <span className={`${selectableCardTitle} ${mode === 'review' ? 'text-white' : 'text-slate-300'}`}>
                Valuta ed inserisci
              </span>
            </div>
            <p className={`${selectableCardDescription} leading-relaxed font-normal`}>
              Potrai valutare gli oggetti suggeriti prima di inserirli in valigia.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSetMode('direct')}
            aria-pressed={mode === 'direct'}
            className={`${selectableCardBase} ${
              mode === 'direct' ? selectableCardSelected : selectableCardUnselected
            }`}
          >
            <div
              className={`${selectableBadgeBase} ${
                mode === 'direct' ? selectableBadgeSelected : selectableBadgeUnselected
              }`}
            >
              {mode === 'direct' && <Check className={selectableCheckIcon} aria-hidden />}
            </div>

            <div className={selectableCardHeaderRow}>
              <div
                className={`${selectableIconBoxBase} ${
                  mode === 'direct' ? selectableIconBoxSelected : selectableIconBoxUnselected
                }`}
              >
                <Plus className="w-5 h-5" aria-hidden />
              </div>
              <span className={`${selectableCardTitle} ${mode === 'direct' ? 'text-white' : 'text-slate-300'}`}>
                Inserimento diretto
              </span>
            </div>
            <p className={`${selectableCardDescription} leading-relaxed font-normal`}>
              I suggerimenti verranno inseriti immediatamente in valigia.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
