import { AlertCircle, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { getCachedSetting, SETTINGS_KEYS } from '../../../services/settingsService';
import type { PointOfInterest } from '../../../types/index';
import { CANONICAL_POI_OPENING_DAYS, type PoiFormData } from '../../../types/write/poiForm';
import { AiFieldHelper } from '../AiFieldHelper';
import { usePoiModalSurface } from './usePoiModalSurface';

export interface PoiInfoTabProps {
  formData: PoiFormData;
  updateField: <K extends keyof PoiFormData>(field: K, value: PoiFormData[K]) => void;
}

type CanonicalOpeningDay = (typeof CANONICAL_POI_OPENING_DAYS)[number];

export const PoiInfoTab = ({ formData, updateField }: PoiInfoTabProps) => {
  const { cardSurface, sectionTitle, cardLabel } = usePoiModalSurface();
  const toggleDay = (day: CanonicalOpeningDay) => {
    const currentDays = formData.openingHours?.days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((item) => item !== day)
      : CANONICAL_POI_OPENING_DAYS.filter((item) => currentDays.includes(item) || item === day);
    updateField('openingHours', { ...formData.openingHours, days: [...newDays] });
  };

  const updateTime = (key: 'morning' | 'afternoon', val: string) => {
    updateField('openingHours', { ...formData.openingHours, [key]: val });
  };

  // CALCOLO REATTIVO CATEGORIE DA CACHE DB
  interface Option {
    value: string;
    label: string;
    id?: string;
  }

  const categories = useMemo<Option[]>(() => {
    return (
      getCachedSetting<Option[]>(SETTINGS_KEYS.POI_CATEGORIES_CONFIG) || [
        { value: 'monument', label: 'Destinazioni' },
        { value: 'food', label: 'Cibo' },
        { value: 'hotel', label: 'Hotel' },
        { value: 'nature', label: 'Natura' },
        { value: 'leisure', label: 'Svago' },
        { value: 'shop', label: 'Shopping' },
        { value: 'discovery', label: 'Novità' },
      ]
    );
  }, []);

  // CALCOLO REATTIVO SOTTOCATEGORIE DA CACHE DB
  const availableSubCats = useMemo<Option[]>(() => {
    const catKey = (formData.category || 'discovery').toLowerCase();
    // Lettura dinamica dalla cache caricata all'avvio
    const structure = getCachedSetting<Record<string, Option[]>>(SETTINGS_KEYS.POI_STRUCTURE);

    type PoiStructureGroup = { items: string[] };
    const advancedStructure = getCachedSetting<Record<string, PoiStructureGroup[]>>(
      SETTINGS_KEYS.POI_ADVANCED_STRUCTURE,
    );
    if (advancedStructure?.[catKey]) {
      // Appiattisci i gruppi per ottenere una lista semplice di opzioni
      const flatOptions: Option[] = [];
      advancedStructure[catKey].forEach((group) => {
        group.items.forEach((item) => {
          flatOptions.push({ value: item, label: item.replace(/_/g, ' ') });
        });
      });
      return flatOptions;
    }

    return structure ? structure[catKey] || [] : [];
  }, [formData.category]);

  const renderDayButton = (day: CanonicalOpeningDay) => {
    const isActive = (formData.openingHours?.days || []).includes(day);
    return (
      <button
        type="button"
        key={day}
        aria-pressed={isActive}
        onClick={() => toggleDay(day)}
        className={`min-h-11 w-full min-w-0 rounded-lg px-0.5 text-[10px] font-bold uppercase transition-all ${isActive ? 'bg-indigo-600 text-white shadow' : 'bg-slate-950 text-slate-500 border border-slate-700 hover:bg-slate-800'}`}
      >
        {day}
      </button>
    );
  };

  // Type Guard per PoiCategory
  const isValidCategory = (val: string): val is PointOfInterest['category'] => {
    const validCategories: string[] = [
      'monument',
      'food',
      'hotel',
      'nature',
      'discovery',
      'leisure',
      'shop',
      'all',
    ];
    return validCategories.includes(val);
  };

  return (
    <div className="space-y-6 min-w-0 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
        <div className="min-w-0">
          <label
            htmlFor="fld-admin-poimodal-poiinfotab-tsx-l109"
            className={`${cardLabel} block mb-1`}
          >
            Nome Luogo
          </label>
          <input
            id="fld-admin-poimodal-poiinfotab-tsx-l109"
            type="text"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none"
          />
        </div>
        <div className="min-w-0">
          <label
            htmlFor="fld-admin-poimodal-poiinfotab-tsx-l120"
            className={`${cardLabel} block mb-1`}
          >
            Categoria
          </label>
          <select
            id="fld-admin-poimodal-poiinfotab-tsx-l120"
            value={formData.category}
            onChange={(e) => {
              const val = e.target.value;
              if (isValidCategory(val)) {
                updateField('category', val);
                updateField('subCategory', '');
              }
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none"
          >
            <option value="">Seleziona...</option>
            {categories.map((c) => (
              <option key={c.id || c.value} value={c.id || c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* NEW: Tourism Interest Field */}
      <div className={`${cardSurface} min-w-0`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-2">
          <h3 className={`${sectionTitle} flex items-center gap-2`}>
            <TrendingUp className="w-4 h-4 text-fuchsia-500" /> Livello Interesse Turistico
          </h3>
          <span className="text-[10px] text-slate-600 italic">Proporzionale alla città</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => updateField('tourismInterest', 'high')}
            className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${formData.tourismInterest === 'high' ? 'bg-fuchsia-600 text-white shadow-lg' : 'bg-slate-950 text-slate-500 border border-slate-700'}`}
          >
            Alto (Top 10)
          </button>
          <button
            type="button"
            onClick={() => updateField('tourismInterest', 'medium')}
            className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${formData.tourismInterest === 'medium' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-950 text-slate-500 border border-slate-700'}`}
          >
            Medio (Popolare)
          </button>
          <button
            type="button"
            onClick={() => updateField('tourismInterest', 'low')}
            className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${formData.tourismInterest === 'low' ? 'bg-slate-600 text-white shadow-lg' : 'bg-slate-950 text-slate-500 border border-slate-700'}`}
          >
            Basso (Nicchia)
          </button>
        </div>
      </div>

      <div className={`${cardSurface} min-w-0`}>
        <h3 className={`${sectionTitle} block mb-2`}>Sottocategoria (Obbligatoria)</h3>

        {availableSubCats.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 max-h-40 overflow-y-auto custom-scrollbar min-w-0">
            {availableSubCats.map((sub) => (
              <button
                type="button"
                key={sub.value}
                onClick={() => updateField('subCategory', sub.value)}
                className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase text-left transition-all border ${formData.subCategory === sub.value ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center border-2 border-dashed border-slate-700 rounded-lg text-slate-500 text-xs italic">
            {formData.category
              ? 'Nessuna sottocategoria disponibile per questa selezione.'
              : 'Seleziona prima una Categoria.'}
          </div>
        )}

        {!formData.subCategory && availableSubCats.length > 0 && (
          <p className="text-red-500 text-[10px] mt-2 font-bold flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Seleziona una sottocategoria.
          </p>
        )}
      </div>

      <div className={`${cardSurface} min-w-0`}>
        <h3 className={`${sectionTitle} block mb-3`}>Orari di Apertura</h3>

        <div className="grid grid-cols-[4.75rem_repeat(5,minmax(0,1fr))] gap-x-1.5 gap-y-2 mb-4 items-center">
          <span className="text-[9px] font-black text-slate-500 uppercase text-right whitespace-nowrap">
            Feriali
          </span>
          {CANONICAL_POI_OPENING_DAYS.slice(0, 5).map((day) => renderDayButton(day))}
          <span className="text-[9px] font-black text-slate-500 uppercase text-right whitespace-nowrap">
            Weekend
          </span>
          {CANONICAL_POI_OPENING_DAYS.slice(5).map((day) => renderDayButton(day))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/10 pt-4 min-w-0">
          <div>
            <label
              htmlFor="fld-admin-poimodal-poiinfotab-tsx-l237"
              className={`${cardLabel} block mb-1`}
            >
              Mattina / Continuato
            </label>
            <input
              id="fld-admin-poimodal-poiinfotab-tsx-l237"
              type="text"
              placeholder="Es. 09:00 - 13:00"
              value={formData.openingHours?.morning || ''}
              onChange={(e) => updateTime('morning', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono"
            />
          </div>
          <div>
            <label
              htmlFor="fld-admin-poimodal-poiinfotab-tsx-l249"
              className={`${cardLabel} block mb-1`}
            >
              Pomeriggio
            </label>
            <input
              id="fld-admin-poimodal-poiinfotab-tsx-l249"
              type="text"
              placeholder="Es. 16:00 - 20:00"
              value={formData.openingHours?.afternoon || ''}
              onChange={(e) => updateTime('afternoon', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono"
            />
          </div>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 italic">
          Per orario continuato, compila solo il primo campo.
        </p>
      </div>

      <div>
        <label
          htmlFor="fld-admin-poimodal-poiinfotab-tsx-l265"
          className={`${cardLabel} block mb-1`}
        >
          Descrizione
        </label>
        <textarea
          id="fld-admin-poimodal-poiinfotab-tsx-l265"
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          rows={4}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none resize-none"
        />
        <AiFieldHelper
          contextLabel="descrizione turistica"
          onApply={(val) => updateField('description', val)}
          currentValue={formData.description}
        />
      </div>
    </div>
  );
};
