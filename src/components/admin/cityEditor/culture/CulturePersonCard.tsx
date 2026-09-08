import {
  AlertTriangle,
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Save,
  Sparkles,
  Square,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  getPrimarySpecific,
  SPECIFIC_WARNING_THRESHOLD,
} from '@/domain/city/famousPersonCategories';
import {
  type FamousPersonRequiredField,
  getMissingFamousPersonFields,
  isFamousPersonComplete,
} from '@/domain/city/famousPersonCompleteness';
import { buildLifespanDisplay } from '@/domain/city/famousPersonDates';
import type {
  FamousPersonMasterDto,
  FamousPersonSpecificDto,
} from '@/services/city/famousPersonCategoryService';
import type { FamousPerson, FamousPersonCategoryRef } from '@/types/index';
import { ImageWithFallback } from '../../../common/ImageWithFallback';
import { AiFieldHelper } from '../../AiFieldHelper';

interface CulturePersonCardProps {
  person: FamousPerson;
  idx: number;
  isExpanded: boolean;
  toggleExpanded: () => void;
  isSelected: boolean;
  toggleSelection: (id: string) => void;
  isProcessingThis: boolean;
  orderDraftValue: string | undefined;
  setOrderDraftValue: (value: string) => void;
  commitOrderDraft: () => void;
  handleOpenPreview: (personId: string) => void;
  handleDeleteRequest: (person: FamousPerson) => void;
  handleRefineRequest: (person: FamousPerson) => void;
  handleToggleStatus: (person: FamousPerson) => void;
  updatePersonLocal: <K extends keyof FamousPerson>(
    personId: string,
    field: K,
    value: FamousPerson[K],
  ) => void;
  savePersonChanges: (person: FamousPerson) => Promise<boolean>;
  regeneratePortrait: (person: FamousPerson) => Promise<boolean>;
  completeMissingFieldWithAi: (
    person: FamousPerson,
    field: FamousPersonRequiredField,
  ) => Promise<FamousPerson | null>;
  recoverPersonDatesWithAi: (person: FamousPerson) => Promise<FamousPerson | null>;
  fieldGenerating: { personId: string; field: string } | null;
  aiBlocked: boolean;
  blockMessage?: string;
  guardAiAction: () => boolean;
  masters: FamousPersonMasterDto[];
  specifics: FamousPersonSpecificDto[];
}

function toSortableCategories(person: FamousPerson) {
  return (person.categories ?? []).map((c) => ({
    label: c.specificLabel,
    slug: c.specificSlug,
    orderIndex: c.specificOrderIndex,
    masterOrderIndex: c.masterOrderIndex,
    masterSlug: c.masterSlug,
  }));
}

function primaryCategoryLabel(person: FamousPerson): string {
  const primary = getPrimarySpecific(toSortableCategories(person));
  return primary?.label ?? 'Senza categoria';
}

function categoryRefFromTaxonomy(
  specific: FamousPersonSpecificDto,
  master: FamousPersonMasterDto,
): FamousPersonCategoryRef {
  return {
    specificId: specific.id,
    specificSlug: specific.slug,
    specificLabel: specific.label,
    masterId: master.id,
    masterSlug: master.slug,
    masterLabel: master.label,
    specificOrderIndex: specific.orderIndex,
    masterOrderIndex: master.orderIndex,
    isActive: specific.isActive && !specific.deletedAt && master.isActive && !master.deletedAt,
  };
}

function parseOptionalYear(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^-?\d+$/.test(trimmed)) return null;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : null;
}

export const CulturePersonCard: React.FC<CulturePersonCardProps> = ({
  person,
  idx,
  isExpanded,
  toggleExpanded,
  isSelected,
  toggleSelection,
  isProcessingThis,
  orderDraftValue,
  setOrderDraftValue,
  commitOrderDraft,
  handleOpenPreview,
  handleDeleteRequest,
  handleRefineRequest,
  handleToggleStatus,
  updatePersonLocal,
  savePersonChanges,
  regeneratePortrait,
  completeMissingFieldWithAi,
  recoverPersonDatesWithAi,
  fieldGenerating,
  aiBlocked,
  blockMessage,
  guardAiAction,
  masters,
  specifics,
}) => {
  const personId = person.id ?? '';

  const [pickerMasterId, setPickerMasterId] = useState<string>('');

  const isPublished = person.status === 'published';
  const hasFullBio = person.fullBio && person.fullBio.trim().length > 50;

  // Logical correction: use structured fields as source of truth, not lifespanDisplay
  const hasDates =
    typeof person.birthYear === 'number' &&
    (person.isLiving === true ||
      (person.isLiving === false && typeof person.deathYear === 'number'));

  const enrichmentQuality = hasFullBio && hasDates ? 'high' : 'low';
  const isComplete = isFamousPersonComplete(person);
  const missingRequired = getMissingFamousPersonFields(person);
  const personPanelId = `person-card-${personId}`;
  const fullBioFieldId = `fld-admin-cityeditor-culture-fullbio-${personId}`;
  const categories = person.categories ?? [];
  const showCategoryWarning = categories.length >= SPECIFIC_WARNING_THRESHOLD;

  const activeMasters = useMemo(() => masters.filter((m) => m.isActive && !m.deletedAt), [masters]);

  const masterById = useMemo(() => {
    const map = new Map<string, FamousPersonMasterDto>();
    for (const m of masters) map.set(m.id, m);
    return map;
  }, [masters]);

  const assignableSpecifics = useMemo(() => {
    return specifics.filter(
      (s) =>
        s.masterId === pickerMasterId &&
        s.isActive &&
        !s.deletedAt &&
        !categories.some((c) => c.specificId === s.id),
    );
  }, [specifics, pickerMasterId, categories]);

  // Logical correction: isLiving semantics (undefined is not silently converted to true)
  const isLiving = person.isLiving === true;

  const applyDateFields = useCallback(
    (
      patch: Partial<
        Pick<FamousPerson, 'birthYear' | 'birthDate' | 'isLiving' | 'deathYear' | 'deathDate'>
      >,
    ) => {
      const nextIsLiving = patch.isLiving !== undefined ? patch.isLiving : person.isLiving;
      const birthYear = patch.birthYear !== undefined ? patch.birthYear : person.birthYear;
      const birthDate = patch.birthDate !== undefined ? patch.birthDate : person.birthDate;
      const deathYear =
        nextIsLiving === true
          ? null
          : patch.deathYear !== undefined
            ? patch.deathYear
            : person.deathYear;
      const deathDate =
        nextIsLiving === true
          ? null
          : patch.deathDate !== undefined
            ? patch.deathDate
            : person.deathDate;

      const lifespanDisplay = buildLifespanDisplay({
        birthYear,
        birthDate,
        isLiving: nextIsLiving === true,
        deathYear,
        deathDate,
      });

      updatePersonLocal(personId, 'birthYear', birthYear ?? null);
      updatePersonLocal(personId, 'birthDate', birthDate ?? null);
      updatePersonLocal(personId, 'isLiving', nextIsLiving);
      updatePersonLocal(personId, 'deathYear', deathYear ?? null);
      updatePersonLocal(personId, 'deathDate', deathDate ?? null);
      updatePersonLocal(personId, 'lifespanDisplay', lifespanDisplay);
    },
    [personId, person, updatePersonLocal],
  );

  const addSpecificCategory = (specificId: string) => {
    const specific = specifics.find((s) => s.id === specificId);
    if (!specific?.isActive || specific.deletedAt) return;
    const master = masterById.get(specific.masterId);
    if (!master?.isActive || master.deletedAt) return;
    const existing = person.categories ?? [];
    if (existing.some((c) => c.specificId === specificId)) return;
    const next = [...existing, categoryRefFromTaxonomy(specific, master)];
    updatePersonLocal(personId, 'categories', next);
  };

  const removeSpecificCategory = (specificId: string) => {
    const next = (person.categories ?? []).filter((c) => c.specificId !== specificId);
    updatePersonLocal(personId, 'categories', next);
  };

  const handleRecoverDates = async () => {
    if (!guardAiAction()) return;
    const updated = await recoverPersonDatesWithAi(person);
    if (!updated) {
      alert("Impossibile recuperare le date con l'AI.");
    }
  };

  const lifespanPreview = buildLifespanDisplay({
    birthYear: person.birthYear,
    birthDate: person.birthDate,
    isLiving,
    deathYear: person.deathYear,
    deathDate: person.deathDate,
  });

  const recoveringDates =
    fieldGenerating?.personId === personId && fieldGenerating.field === 'dates';

  return (
    <div
      className={`bg-slate-900 rounded-xl border transition-all ${isProcessingThis ? 'border-yellow-400 ring-2 ring-yellow-400/50 scale-[1.01] z-floating-panel' : isSelected ? 'border-indigo-500 ring-1 ring-indigo-500/50 bg-indigo-900/10' : 'border-slate-800 hover:border-slate-700'}`}
    >
      <div className="p-3 md:p-4 flex flex-col gap-3 sm:flex-row sm:items-center group">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSelection(personId);
            }}
            className={`inline-flex items-center justify-center min-h-11 min-w-11 p-2 rounded hover:bg-slate-800 transition-colors shrink-0 ${isSelected ? 'text-indigo-500' : 'text-slate-600'}`}
            aria-label={isSelected ? `Deseleziona ${person.name}` : `Seleziona ${person.name}`}
          >
            {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
          </button>

          <div className="w-12 shrink-0">
            <input
              type="number"
              min="1"
              inputMode="numeric"
              aria-label={`Ordine di ${person.name}`}
              value={orderDraftValue ?? String(person.orderIndex || idx + 1)}
              onChange={(e) => {
                setOrderDraftValue(e.target.value);
              }}
              onBlur={commitOrderDraft}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              className="w-full min-h-11 bg-slate-950 border-2 border-slate-700 rounded-lg text-center text-white text-base font-black py-1 focus:border-indigo-500 outline-none shadow-inner"
            />
          </div>

          <button
            type="button"
            className="flex gap-3 items-center flex-1 min-w-0 text-left cursor-pointer bg-transparent border-0 p-0"
            aria-expanded={isExpanded}
            aria-controls={personPanelId}
            onClick={toggleExpanded}
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border border-slate-700 shrink-0">
              <ImageWithFallback
                src={person.imageUrl}
                alt={person.name}
                className={`w-full h-full object-cover ${!isPublished ? 'grayscale opacity-60' : ''}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-white text-sm truncate">{person.name}</h4>
                {isPublished ? (
                  <span className="text-[9px] bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                    Online
                  </span>
                ) : (
                  <span className="text-[9px] bg-amber-900/30 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                    Bozza
                  </span>
                )}
                {isProcessingThis && (
                  <span className="text-[9px] bg-yellow-500 text-black px-2 py-0.5 rounded-full font-black uppercase flex items-center gap-1 animate-pulse border border-yellow-300 shrink-0">
                    <Loader2 className="w-3 h-3 animate-spin" /> LAVORAZIONE...
                  </span>
                )}
                {!isProcessingThis && !isComplete && (
                  <span className="text-[9px] text-amber-400 font-bold uppercase shrink-0">
                    Non pubblicabile
                  </span>
                )}
                {!isProcessingThis && isComplete && enrichmentQuality === 'low' && (
                  <span className="text-[9px] text-slate-500 font-bold uppercase shrink-0">
                    Arricchimento opzionale
                  </span>
                )}
              </div>
              <p className="text-[10px] md:text-xs text-slate-400 truncate">
                {primaryCategoryLabel(person)}
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenPreview(personId);
            }}
            className="inline-flex items-center justify-center min-h-11 min-w-11 p-2 text-indigo-400 hover:text-white hover:bg-indigo-600 rounded transition-colors"
            title="Anteprima Utente"
            aria-label={`Anteprima ${person.name}`}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteRequest(person);
            }}
            className="inline-flex items-center justify-center min-h-11 min-w-11 p-2 text-slate-600 hover:text-red-500 hover:bg-slate-900 rounded"
            title="Elimina personaggio"
            aria-label={`Elimina ${person.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center min-h-11 min-w-11 p-2 shrink-0 rounded"
            aria-expanded={isExpanded}
            aria-controls={personPanelId}
            aria-label={isExpanded ? 'Comprimi persona' : 'Espandi persona'}
            onClick={toggleExpanded}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-indigo-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && !isProcessingThis && (
        <div
          id={personPanelId}
          className="px-3 md:px-4 pb-4 border-t border-slate-800/50 pt-4 space-y-4 bg-slate-900/50 rounded-b-xl animate-in slide-in-from-top-2"
        >
          <div className="flex justify-between items-center mb-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => handleRefineRequest(person)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] font-bold uppercase flex items-center gap-1 shadow-md transition-all active:scale-95"
              title="Riscrivi Dati (Bio e Date)"
            >
              <Wand2 className="w-3 h-3" /> Magic Fix (Dati)
            </button>
            <button
              type="button"
              onClick={() => handleToggleStatus(person)}
              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-colors ${isPublished ? 'bg-emerald-600 text-white hover:bg-emerald-500' : isComplete ? 'bg-amber-600 text-white hover:bg-amber-500' : 'bg-slate-700 text-amber-200 hover:bg-slate-600'}`}
              aria-label={
                isPublished
                  ? 'Imposta come bozza'
                  : isComplete
                    ? 'Pubblica personaggio'
                    : 'Personaggio incompleto, non pubblicabile'
              }
            >
              {isPublished ? 'PUBBLICATO' : isComplete ? 'BOZZA (NASCOSTO)' : 'INCOMPLETO'}
            </button>
          </div>

          <div>
            <label
              htmlFor={`fld-person-name-${personId}`}
              className="text-[10px] font-bold text-slate-500 uppercase block mb-1"
            >
              Nome
            </label>
            <input
              id={`fld-person-name-${personId}`}
              value={person.name}
              onChange={(e) => updatePersonLocal(personId, 'name', e.target.value)}
              className={`bg-slate-900 border rounded px-3 py-2 text-white text-sm w-full ${missingRequired.includes('name') ? 'border-amber-500' : 'border-slate-700'}`}
              placeholder="Nome Completo"
              aria-invalid={missingRequired.includes('name')}
            />
          </div>

          {/* CATEGORIES */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Categorie Specific
              </span>
              {missingRequired.includes('categories') && (
                <span className="text-[9px] text-amber-400 font-bold uppercase">
                  Almeno 1 obbligatoria
                </span>
              )}
            </div>

            {showCategoryWarning && (
              <div
                role="status"
                className="flex items-start gap-2 bg-amber-900/20 border border-amber-500/40 text-amber-200 text-[11px] p-2 rounded-lg"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                <span>
                  Attenzione: {categories.length} categorie assegnate (soglia consigliata{' '}
                  {SPECIFIC_WARNING_THRESHOLD}). Non blocca il salvataggio.
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 min-h-[2rem]">
              {categories.map((cat) => {
                const inactive = cat.isActive === false;
                return (
                  <span
                    key={cat.specificId}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border ${
                      inactive
                        ? 'bg-slate-950 border-slate-700 text-slate-500'
                        : 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
                    }`}
                  >
                    <span>
                      {cat.masterLabel} · {cat.specificLabel}
                      {inactive ? ' (storica)' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSpecificCategory(cat.specificId)}
                      className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      aria-label={`Rimuovi categoria ${cat.specificLabel}`}
                    >
                      <span className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 inline-flex items-center justify-center">
                        <X className="w-3 h-3" aria-hidden />
                      </span>
                    </button>
                  </span>
                );
              })}
              {categories.length === 0 && (
                <span className="text-[11px] text-slate-600 italic">
                  Nessuna categoria assegnata
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={pickerMasterId}
                onChange={(e) => setPickerMasterId(e.target.value)}
                aria-label={`Master per ${person.name}`}
                className="flex-1 min-h-11 bg-slate-900 border border-slate-700 rounded-lg px-3 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="">Seleziona Master…</option>
                {activeMasters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value=""
                disabled={!pickerMasterId}
                onChange={(e) => {
                  const specificId = e.target.value;
                  if (specificId) addSpecificCategory(specificId);
                }}
                aria-label={`Aggiungi Specific per ${person.name}`}
                className="flex-1 min-h-11 bg-slate-900 border border-slate-700 rounded-lg px-3 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-50"
              >
                <option value="">
                  {pickerMasterId ? 'Aggiungi Specific…' : 'Scegli prima un Master'}
                </option>
                {assignableSpecifics.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DATES */}
          <div className="space-y-3 p-3 rounded-xl border border-slate-800 bg-slate-950/40">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" aria-hidden /> Date
              </span>
              <button
                type="button"
                onClick={() => void handleRecoverDates()}
                disabled={aiBlocked || recoveringDates}
                title={aiBlocked ? blockMessage : 'Recupera date con AI'}
                className="inline-flex items-center gap-1.5 min-h-11 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase disabled:opacity-50"
                aria-label={`Recupera date con AI per ${person.name}`}
              >
                {recoveringDates ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" aria-hidden />
                )}
                Recupera date con AI
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor={`fld-person-birthyear-${personId}`}
                  className="text-[10px] font-bold text-slate-500 uppercase block mb-1"
                >
                  Anno nascita *
                </label>
                <input
                  id={`fld-person-birthyear-${personId}`}
                  type="number"
                  value={person.birthYear ?? ''}
                  onChange={(e) =>
                    applyDateFields({
                      birthYear: parseOptionalYear(e.target.value),
                    })
                  }
                  className={`bg-slate-900 border rounded px-3 py-2 text-white text-sm w-full ${missingRequired.includes('dates') ? 'border-amber-500' : 'border-slate-700'}`}
                  placeholder="es. 1452"
                  aria-invalid={missingRequired.includes('dates')}
                />
              </div>
              <div>
                <label
                  htmlFor={`fld-person-birthdate-${personId}`}
                  className="text-[10px] font-bold text-slate-500 uppercase block mb-1"
                >
                  Data nascita (opz.)
                </label>
                <input
                  id={`fld-person-birthdate-${personId}`}
                  type="date"
                  value={person.birthDate ?? ''}
                  onChange={(e) =>
                    applyDateFields({
                      birthDate: e.target.value || null,
                    })
                  }
                  className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm w-full"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor={`fld-person-living-${personId}`}
                className="text-[10px] font-bold text-slate-500 uppercase block mb-1"
              >
                Stato in vita *
              </label>
              <select
                id={`fld-person-living-${personId}`}
                value={person.isLiving === true ? 'true' : person.isLiving === false ? 'false' : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  applyDateFields({
                    isLiving: val === 'true' ? true : val === 'false' ? false : undefined,
                  });
                }}
                className={`bg-slate-900 border rounded px-3 py-2 text-white text-sm w-full min-h-11 ${missingRequired.includes('dates') && person.isLiving === undefined ? 'border-amber-500' : 'border-slate-700'}`}
              >
                <option value="">Non specificato</option>
                <option value="true">Vivente</option>
                <option value="false">Deceduto (Non vivente)</option>
              </select>
            </div>

            {person.isLiving === false && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor={`fld-person-deathyear-${personId}`}
                    className="text-[10px] font-bold text-slate-500 uppercase block mb-1"
                  >
                    Anno morte *
                  </label>
                  <input
                    id={`fld-person-deathyear-${personId}`}
                    type="number"
                    value={person.deathYear ?? ''}
                    onChange={(e) =>
                      applyDateFields({
                        deathYear: parseOptionalYear(e.target.value),
                      })
                    }
                    className={`bg-slate-900 border rounded px-3 py-2 text-white text-sm w-full ${missingRequired.includes('dates') ? 'border-amber-500' : 'border-slate-700'}`}
                    placeholder="es. 1519"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`fld-person-deathdate-${personId}`}
                    className="text-[10px] font-bold text-slate-500 uppercase block mb-1"
                  >
                    Data morte (opz.)
                  </label>
                  <input
                    id={`fld-person-deathdate-${personId}`}
                    type="date"
                    value={person.deathDate ?? ''}
                    onChange={(e) =>
                      applyDateFields({
                        deathDate: e.target.value || null,
                      })
                    }
                    className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm w-full"
                  />
                </div>
              </div>
            )}

            <p className="text-[11px] text-slate-400">
              Anteprima lifespan:{' '}
              <span className="text-white font-medium">{lifespanPreview || '—'}</span>
            </p>
          </div>

          <div>
            <label
              htmlFor={`fld-person-image-${personId}`}
              className="text-[10px] font-bold text-slate-500 uppercase block mb-1"
            >
              URL Immagine
            </label>
            <div className="flex gap-1">
              <input
                id={`fld-person-image-${personId}`}
                value={person.imageUrl ?? ''}
                onChange={(e) => updatePersonLocal(personId, 'imageUrl', e.target.value)}
                className={`bg-slate-900 border rounded px-3 py-2 text-slate-300 text-xs w-full ${missingRequired.includes('imageUrl') ? 'border-amber-500' : 'border-slate-700'}`}
                placeholder="URL Immagine"
                aria-invalid={missingRequired.includes('imageUrl')}
              />
              <button
                type="button"
                onClick={() => {
                  if (!guardAiAction()) return;
                  regeneratePortrait(person);
                }}
                disabled={aiBlocked}
                className="inline-flex items-center justify-center min-h-11 min-w-11 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded border border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title={aiBlocked ? blockMessage : 'Genera Ritratto AI'}
                aria-label={`Genera ritratto AI per ${person.name}`}
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor={`fld-person-bio-${personId}`}
                className="text-[10px] font-bold text-slate-500 uppercase"
              >
                Biografia breve
              </label>
              {missingRequired.includes('bio') && (
                <button
                  type="button"
                  disabled={aiBlocked || fieldGenerating?.personId === personId}
                  title={aiBlocked ? blockMessage : 'Genera biografia con AI'}
                  onClick={() => {
                    if (!guardAiAction()) return;
                    void completeMissingFieldWithAi(person, 'bio');
                  }}
                  className="text-[9px] font-bold uppercase text-indigo-300 hover:text-indigo-200 disabled:opacity-50"
                >
                  Genera AI
                </button>
              )}
            </div>
            <textarea
              id={`fld-person-bio-${personId}`}
              rows={2}
              value={person.bio ?? ''}
              onChange={(e) => updatePersonLocal(personId, 'bio', e.target.value)}
              className={`w-full bg-slate-900 border rounded p-3 text-slate-300 text-xs resize-none ${missingRequired.includes('bio') ? 'border-amber-500' : 'border-slate-700'}`}
              placeholder="Bio breve..."
              aria-invalid={missingRequired.includes('bio')}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor={fullBioFieldId}
                className="text-[10px] font-bold text-slate-500 uppercase"
              >
                Biografia Completa (Estesa)
              </label>
              <span className="text-[9px] text-amber-500 bg-amber-900/10 px-2 rounded border border-amber-500/20">
                Usa "TITOLO: Nome" per i paragrafi
              </span>
            </div>
            <textarea
              id={fullBioFieldId}
              rows={6}
              value={person.fullBio || ''}
              onChange={(e) => updatePersonLocal(personId, 'fullBio', e.target.value)}
              className={`w-full bg-slate-900 border rounded p-3 text-white text-xs resize-none font-serif ${!hasFullBio ? 'border-slate-600' : 'border-slate-700'}`}
              placeholder="Biografia estesa (obbligatoria)..."
            />
            <AiFieldHelper
              contextLabel={`biografia estesa di ${person.name}`}
              onApply={(val) => updatePersonLocal(personId, 'fullBio', val)}
              currentValue={person.fullBio}
              compact={true}
              fieldId={`bio_extended_${personId}`}
            />
          </div>

          <div className="mt-4 border-t border-slate-800 pt-4">
            <h5 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" /> Luoghi Correlati (Auto-Generati)
            </h5>
            {!person.relatedPlaces || person.relatedPlaces.length === 0 ? (
              <p className="text-xs text-slate-600 italic">
                Nessun luogo collegato. Usa Magic Fix.
              </p>
            ) : (
              <div className="space-y-2">
                {person.relatedPlaces.map((place) => (
                  <div
                    key={place.id}
                    className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center group/place hover:border-slate-700"
                  >
                    <div>
                      <div className="font-bold text-white text-xs">{place.name}</div>
                      <div className="text-[10px] text-slate-500">{place.address}</div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      {typeof place.priceLevel === 'number' && place.priceLevel > 0 ? (
                        <div className="text-[10px] font-bold text-amber-500 bg-amber-900/10 px-1.5 rounded border border-amber-500/20">
                          {Array.from({ length: place.priceLevel }, () => '€').join('')}
                        </div>
                      ) : null}
                      <div className="text-[9px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {place.visitDuration}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => void savePersonChanges(person)}
              disabled={isProcessingThis}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 min-h-11 rounded-lg text-xs font-bold uppercase flex items-center gap-1 shadow-lg disabled:opacity-50"
            >
              <Save className="w-3 h-3" /> Salva Modifiche
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
