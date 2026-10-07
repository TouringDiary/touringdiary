import { Loader2, Search } from 'lucide-react';
import type { PoiFormData } from '../../../types/write/poiForm';
import { usePoiModalSurface } from './usePoiModalSurface';

interface PoiLogisticsTabProps {
  formData: PoiFormData;
  updateField: <K extends keyof PoiFormData>(field: K, value: PoiFormData[K]) => void;
  updateCoord: (type: 'lat' | 'lng', value: string) => void;
  handleAutoLocate: () => Promise<{ success?: boolean; error?: string }>;
  isLocating: boolean;
}

export const PoiLogisticsTab = ({
  formData,
  updateField,
  updateCoord,
  handleAutoLocate,
  isLocating,
}: PoiLogisticsTabProps) => {
  const { cardSurface, sectionTitle, cardLabel } = usePoiModalSurface();
  return (
    <div className="space-y-6 min-w-0 w-full">
      <div className={`${cardSurface} min-w-0`}>
        <label
          className={`${sectionTitle} block mb-1 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center`}
        >
          Coordinate GPS
          <button
            type="button"
            onClick={handleAutoLocate}
            disabled={isLocating}
            className="min-h-11 text-xs font-bold uppercase bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all"
          >
            {isLocating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Search className="w-3 h-3" />
            )}{' '}
            {isLocating ? 'Ricerca...' : 'Trova GPS con AI'}
          </button>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2 min-w-0">
          <div>
            <label
              htmlFor="fld-admin-poimodal-poilogisticstab-tsx-l40"
              className={`${cardLabel} block mb-1`}
            >
              Latitudine
            </label>
            <input
              id="fld-admin-poimodal-poilogisticstab-tsx-l40"
              type="number"
              value={formData.coords?.lat ?? ''}
              onChange={(e) => updateCoord('lat', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono"
            />
          </div>
          <div>
            <label
              htmlFor="fld-admin-poimodal-poilogisticstab-tsx-l49"
              className={`${cardLabel} block mb-1`}
            >
              Longitudine
            </label>
            <input
              id="fld-admin-poimodal-poilogisticstab-tsx-l49"
              type="number"
              value={formData.coords?.lng ?? ''}
              onChange={(e) => updateCoord('lng', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono"
            />
          </div>
        </div>
      </div>

      <div>
        <label
          htmlFor="fld-admin-poimodal-poilogisticstab-tsx-l61"
          className={`${cardLabel} block mb-1`}
        >
          Indirizzo
        </label>
        <input
          id="fld-admin-poimodal-poilogisticstab-tsx-l61"
          type="text"
          value={formData.address}
          onChange={(e) => updateField('address', e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-0">
        <div>
          <label
            htmlFor="fld-admin-poimodal-poilogisticstab-tsx-l72"
            className={`${cardLabel} block mb-1`}
          >
            Durata Visita
          </label>
          <input
            id="fld-admin-poimodal-poilogisticstab-tsx-l72"
            type="text"
            value={formData.visitDuration}
            onChange={(e) => updateField('visitDuration', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
          />
        </div>
        <div>
          <label
            htmlFor="fld-admin-poimodal-poilogisticstab-tsx-l83"
            className={`${cardLabel} block mb-1`}
          >
            Fascia Prezzo (1-4)
          </label>
          <input
            id="fld-admin-poimodal-poilogisticstab-tsx-l83"
            type="number"
            min="1"
            max="4"
            value={formData.priceLevel}
            onChange={(e) => updateField('priceLevel', parseInt(e.target.value, 10))}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
          />
        </div>
      </div>
    </div>
  );
};
