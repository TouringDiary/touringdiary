import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Briefcase, Loader2, FolderPlus, Trash2 } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { CATEGORY_ID_MAP, getCategoryEmoji, SystemCategoryName } from '@/domain/packing/packingCategories';
import type { CategorySetupMap } from '@/domain/packing/categorySetupTypes';
import {
  CONFIGURATION_MODAL_OPTIONAL_NAMES,
  CONFIGURATION_MODAL_STANDARD_NAMES,
  getCategorySetupDefaultsForConfigurationModal,
  setCategoryEnabled,
  setCategorySeeded,
} from '@/domain/packing/categorySetupUx';
import { SuitcaseCategory } from '@/types/suitcase';
import { CategoryIconPicker } from './CategoryIconPicker';
import { AnchoredPopover } from '@/components/common/AnchoredPopover';
import { getIconByName } from './SuitcaseUtils';

export interface CategorySetupConfigurationResult {
  categorySetup: CategorySetupMap;
  customCategories: SuitcaseCategory[];
}

interface PendingCustomCategory {
  tempId: string;
  name: string;
  icon_key: string;
}

interface CategorySetupConfigurationModalProps {
  isOpen: boolean;
  title: string;
  isSubmitting?: boolean;
  onConfirm: (result: CategorySetupConfigurationResult) => void;
  onClose: () => void;
}

const STATE_PILL_ON =
  'bg-emerald-500/25 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/35';
const STATE_PILL_OFF =
  'bg-red-500/15 text-red-300/90 border-red-500/25 hover:bg-red-500/20';

/** Token tipografici allineati a designRules `suitcase_*` — responsive solo Tailwind. */
const MODAL_TITLE_CLASS =
  'font-sans text-xl font-bold text-white tracking-normal leading-tight';
const MODAL_SUBTITLE_CLASS =
  'font-sans text-sm font-medium text-slate-200 leading-snug';
const SECTION_LABEL_CLASS =
  'font-sans text-xs sm:text-[12px] font-black uppercase tracking-widest sm:tracking-[0.16em] text-slate-300';
const CATEGORY_NAME_CLASS =
  'font-sans text-[15px] sm:text-base font-bold text-white leading-none';
const FOOTER_BTN_CLASS =
  'font-sans text-[10px] font-black uppercase tracking-widest';

const IosToggle: React.FC<{
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
}> = ({ checked, disabled = false, onChange, ariaLabel }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={`
      relative inline-flex h-[22px] w-[40px] shrink-0 rounded-full p-0 border-0
      transition-colors duration-200 ease-out
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
      ${disabled ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer active:opacity-90'}
      ${checked ? 'bg-indigo-500' : 'bg-slate-600'}
    `}
  >
    <span
      aria-hidden
      className={`
        pointer-events-none absolute top-[2px] left-[2px] h-[18px] w-[18px] rounded-full bg-white
        shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-transform duration-200 ease-out
        ${checked ? 'translate-x-[18px]' : 'translate-x-0'}
      `}
    />
  </button>
);

const StatePill: React.FC<{
  on: boolean;
  disabled?: boolean;
  onToggle: () => void;
  ariaLabel: string;
}> = ({ on, disabled = false, onToggle, ariaLabel }) => (
  <button
    type="button"
    aria-label={ariaLabel}
    aria-pressed={on}
    disabled={disabled}
    onClick={onToggle}
    className={`
      shrink-0 rounded-md border transition-colors duration-150
      min-w-[40px] px-2 py-0.5 text-[11px] font-bold tracking-wide
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
      ${disabled ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer active:scale-[0.97]'}
      ${on ? STATE_PILL_ON : STATE_PILL_OFF}
    `}
  >
    {on ? 'ON' : 'OFF'}
  </button>
);

const SettingsSectionHeader: React.FC<{
  title: string;
  count: number;
}> = ({ title, count }) => (
  <h3 className={`${SECTION_LABEL_CLASS} mb-2.5 px-0.5`}>
    {title}
    <span className="ml-1.5 text-indigo-400/90 tabular-nums">({count})</span>
  </h3>
);

const SettingsGroup: React.FC<{ children: React.ReactNode; clip?: boolean }> = ({
  children,
  clip = true,
}) => (
  <div
    className={`
      rounded-2xl border border-white/[0.08] bg-slate-800/35 backdrop-blur-sm
      shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
      ${clip ? 'overflow-hidden' : 'overflow-visible'}
    `}
  >
    {children}
  </div>
);

const SettingsDivider: React.FC = () => <div className="h-px bg-white/[0.06] mx-4" />;

const CategorySettingsItem: React.FC<{
  name: SystemCategoryName;
  enabled: boolean;
  seeded: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  onToggleSeeded: (seeded: boolean) => void;
  isLast?: boolean;
}> = ({
  name,
  enabled,
  seeded,
  onToggleEnabled,
  onToggleSeeded,
  isLast = false,
}) => (
  <div className={!isLast ? 'border-b border-white/[0.05]' : ''}>
    <div
      className={`
        flex items-center gap-3 min-h-[48px] px-4 py-2.5 transition-colors duration-150
        ${enabled ? '' : 'opacity-45'}
      `}
    >
      <span
        className={`text-base leading-none shrink-0 ${enabled ? '' : 'grayscale'}`}
        aria-hidden
      >
        {getCategoryEmoji(name)}
      </span>
      <span
        className={`flex-1 min-w-0 truncate ${CATEGORY_NAME_CLASS} ${enabled ? '' : '!text-slate-500'}`}
      >
        {name}
      </span>
      <IosToggle
        checked={enabled}
        onChange={onToggleEnabled}
        ariaLabel={`Categoria ${name}: ${enabled ? 'attiva' : 'non attiva'}`}
      />
    </div>

    <div
      className={`
        grid transition-[grid-template-rows] duration-200 ease-out
        ${enabled ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}
      `}
    >
      <div className="overflow-hidden">
        <div className="flex items-center gap-3 min-h-[38px] pl-10 pr-4 py-2 border-t border-white/[0.05] bg-black/20">
          <span className="flex-1 text-xs text-slate-400 font-medium">Oggetti standard</span>
          <StatePill
            on={seeded}
            onToggle={() => onToggleSeeded(!seeded)}
            ariaLabel={`Oggetti standard per ${name}: ${seeded ? 'attivi' : 'disattivi'}`}
          />
        </div>
      </div>
    </div>
  </div>
);

const SystemCategorySection: React.FC<{
  title: string;
  names: readonly SystemCategoryName[];
  categorySetup: CategorySetupMap;
  onToggleEnabled: (categoryId: string, enabled: boolean) => void;
  onToggleSeeded: (categoryId: string, seeded: boolean) => void;
}> = ({
  title,
  names,
  categorySetup,
  onToggleEnabled,
  onToggleSeeded,
}) => {
  const activeCount = useMemo(
    () =>
      names.filter((name) => {
        const id = CATEGORY_ID_MAP[name];
        return categorySetup[id]?.enabled;
      }).length,
    [names, categorySetup]
  );

  return (
    <section>
      <SettingsSectionHeader title={title} count={activeCount} />
      <SettingsGroup>
        {names.map((name, index) => {
          const categoryId = CATEGORY_ID_MAP[name];
          const entry = categorySetup[categoryId] ?? { enabled: false, seeded: false };
          return (
            <CategorySettingsItem
              key={categoryId}
              name={name}
              enabled={entry.enabled}
              seeded={entry.seeded}
              onToggleEnabled={(enabled) => onToggleEnabled(categoryId, enabled)}
              onToggleSeeded={(seeded) => onToggleSeeded(categoryId, seeded)}
              isLast={index === names.length - 1}
            />
          );
        })}
      </SettingsGroup>
    </section>
  );
};

export const CategorySetupConfigurationModal: React.FC<CategorySetupConfigurationModalProps> = ({
  isOpen,
  title,
  isSubmitting = false,
  onConfirm,
  onClose,
}) => {
  const [categorySetup, setCategorySetup] = useState<CategorySetupMap>(
    getCategorySetupDefaultsForConfigurationModal
  );
  const [customCategories, setCustomCategories] = useState<PendingCustomCategory[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Package');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const iconTriggerRef = useRef<HTMLButtonElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dialogPanelRef = useRef<HTMLDivElement>(null);

  useGlobalModalEscape(isOpen, onClose);

  useLayoutEffect(() => {
    if (!isOpen) return;

    setShowIconPicker(false);
    setShowAddForm(false);
    scrollContainerRef.current.scrollTop = 0;
    dialogPanelRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setCategorySetup(getCategorySetupDefaultsForConfigurationModal());
      setCustomCategories([]);
      setNewCatName('');
      setNewCatIcon('Package');
      setShowIconPicker(false);
      setShowAddForm(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleEnabled = (categoryId: string, enabled: boolean) => {
    setCategorySetup((prev) => setCategoryEnabled(prev, categoryId, enabled));
  };

  const handleToggleSeeded = (categoryId: string, seeded: boolean) => {
    setCategorySetup((prev) => setCategorySeeded(prev, categoryId, seeded));
  };

  const handleAddCustomCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    const duplicate = customCategories.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) return;

    setCustomCategories((prev) => [
      ...prev,
      {
        tempId: `pending-${Date.now()}-${prev.length}`,
        name: trimmed,
        icon_key: newCatIcon,
      },
    ]);
    setNewCatName('');
    setNewCatIcon('Package');
    setShowIconPicker(false);
    setShowAddForm(false);
  };

  const handleRemoveCustom = (tempId: string) => {
    setCustomCategories((prev) => prev.filter((c) => c.tempId !== tempId));
  };

  const handleConfirm = () => {
    const baseTs = Date.now();
    const resolvedCustom: SuitcaseCategory[] = customCategories.map((cat, index) => ({
      id: `custom_${baseTs}_${index}`,
      name: cat.name,
      icon_key: cat.icon_key,
    }));

    onConfirm({
      categorySetup,
      customCategories: resolvedCustom,
    });
  };

  return createPortal(
    <div
      className="td-modal-overlay flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300"
      style={{ zIndex: Z_OVERLAY }}
      onClick={onClose}
    >
      <div
        ref={dialogPanelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-setup-title"
        className="relative w-full max-w-3xl bg-slate-900 border border-white/10 rounded-t-[2rem] sm:rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.75)] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 flex flex-col max-h-[calc(100dvh-var(--header-height)-env(safe-area-inset-bottom,0px)-0.5rem)] sm:max-h-[calc(100dvh-var(--header-height)-2rem)] overflow-hidden outline-none pb-safe sm:pb-0"
        style={{ zIndex: Z_MODAL }}
        onClick={(e) => e.stopPropagation()}
      >
        <CloseButton
          onClose={onClose}
          variant="primary"
          position="absolute"
          withEscape={false}
          className="top-5 right-5 sm:top-6 sm:right-6 z-local-overlay"
        />

        <div className="flex items-center gap-4 px-6 sm:px-8 py-5 sm:py-6 border-b border-white/5 shrink-0 pr-14">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/25 shrink-0">
            <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <h2 id="category-setup-title" className={`${MODAL_TITLE_CLASS} truncate`}>
              {title}
            </h2>
            <p className={`${MODAL_SUBTITLE_CLASS} mt-1.5`}>
              Attiva le categorie e scegli se precompilarle con gli oggetti consigliati.
            </p>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 sm:py-6 custom-scrollbar space-y-6 min-h-0"
        >
          <SystemCategorySection
            title="Standard"
            names={CONFIGURATION_MODAL_STANDARD_NAMES}
            categorySetup={categorySetup}
            onToggleEnabled={handleToggleEnabled}
            onToggleSeeded={handleToggleSeeded}
          />

          <SystemCategorySection
            title="Opzionali"
            names={CONFIGURATION_MODAL_OPTIONAL_NAMES}
            categorySetup={categorySetup}
            onToggleEnabled={handleToggleEnabled}
            onToggleSeeded={handleToggleSeeded}
          />

          <section>
            <SettingsSectionHeader
              title="Personalizzate"
              count={customCategories.length}
            />
            <SettingsGroup clip={false}>
              {customCategories.map((cat, index) => (
                <React.Fragment key={cat.tempId}>
                  {index > 0 && <SettingsDivider />}
                  <div className="flex items-center gap-3 min-h-[44px] px-4 py-2">
                    <span className="text-indigo-400 shrink-0">
                      {getIconByName(cat.icon_key, 'w-[18px] h-[18px]')}
                    </span>
                    <span className={`flex-1 min-w-0 truncate ${CATEGORY_NAME_CLASS}`}>
                      {cat.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustom(cat.tempId)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      aria-label={`Rimuovi ${cat.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </React.Fragment>
              ))}

              {customCategories.length > 0 && showAddForm && <SettingsDivider />}

              <div
                className={`
                  grid transition-[grid-template-rows] duration-200 ease-out
                  ${showAddForm ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}
                `}
              >
                <div className="overflow-hidden">
                  <div className="px-4 py-3 border-t border-white/[0.05] bg-black/15">
                    <div className="flex items-center gap-2">
                      <button
                        ref={iconTriggerRef}
                        type="button"
                        onClick={() => setShowIconPicker((v) => !v)}
                        className={`
                          shrink-0 p-2 rounded-xl border transition-colors
                          ${showIconPicker
                            ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                            : 'bg-slate-800/80 border-white/10 text-indigo-400 hover:border-indigo-500/30'}
                        `}
                        aria-label="Scegli icona"
                        aria-expanded={showIconPicker}
                      >
                        {getIconByName(newCatIcon, 'w-[18px] h-[18px]')}
                      </button>
                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddCustomCategory();
                          if (e.key === 'Escape') {
                            setShowAddForm(false);
                            setShowIconPicker(false);
                          }
                        }}
                        placeholder="Nome categoria"
                        autoFocus
                        className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-800/60 border border-white/[0.08] text-[15px] text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/40"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomCategory}
                        disabled={!newCatName.trim()}
                        className="shrink-0 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                      >
                        OK
                      </button>
                    </div>
                    <AnchoredPopover
                      isOpen={showIconPicker}
                      onClose={() => setShowIconPicker(false)}
                      anchorRef={iconTriggerRef}
                      align="left"
                      className="w-[min(400px,calc(100vw-24px))]"
                    >
                      <CategoryIconPicker
                        onSelect={(key) => {
                          setNewCatIcon(key);
                          setShowIconPicker(false);
                        }}
                        onClose={() => setShowIconPicker(false)}
                      />
                    </AnchoredPopover>
                  </div>
                </div>
              </div>

              {!showAddForm && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(true);
                    setShowIconPicker(true);
                  }}
                  className="flex items-center gap-2 w-full min-h-[44px] px-4 py-2 text-sm font-semibold text-indigo-400 hover:bg-white/[0.03] transition-colors"
                >
                  <FolderPlus className="w-4 h-4 shrink-0 text-emerald-500" />
                  Aggiungi categoria
                </button>
              )}
            </SettingsGroup>
          </section>
        </div>

        <div className="px-6 sm:px-8 py-4 sm:py-5 border-t border-white/5 bg-slate-900/80 shrink-0 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={`px-5 py-2.5 rounded-xl ${FOOTER_BTN_CLASS} text-slate-400 hover:text-white transition-colors disabled:opacity-50`}
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white ${FOOTER_BTN_CLASS} shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Attendere...
              </>
            ) : (
              'Conferma'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
