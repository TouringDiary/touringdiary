import type { PoiFormData } from '../../../types/write/poiForm';
import { usePoiModalSurface } from './usePoiModalSurface';

interface PoiMarketingTabProps {
  formData: PoiFormData;
  updateField: <K extends keyof PoiFormData>(field: K, value: PoiFormData[K]) => void;
}

export const PoiMarketingTab = ({ formData, updateField }: PoiMarketingTabProps) => {
  const { cardSurface, sectionTitle, sectionDescription, cardLabel } = usePoiModalSurface();
  // Type Guard per SponsorTier
  const isValidTier = (val: string): val is PoiFormData['tier'] => {
    return ['gold', 'silver', 'standard', ''].includes(val);
  };

  return (
    <div className="space-y-6 min-w-0 w-full">
      <div
        className={`${cardSurface} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}
      >
        <div className="min-w-0">
          <h4 className={sectionTitle}>Sponsorizzato</h4>
          <p className={sectionDescription}>Metti in evidenza questo luogo</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isSponsored}
            onChange={(e) => updateField('isSponsored', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
        </label>
      </div>

      {formData.isSponsored && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-0">
          <div>
            <label
              htmlFor="fld-admin-poimodal-poimarketingtab-tsx-l35"
              className={`${cardLabel} block mb-1`}
            >
              Livello Sponsor
            </label>
            <select
              id="fld-admin-poimodal-poimarketingtab-tsx-l35"
              value={formData.tier}
              onChange={(e) => {
                const val = e.target.value;
                if (isValidTier(val)) updateField('tier', val);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
            >
              <option value="standard">Standard</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="fld-admin-poimodal-poimarketingtab-tsx-l52"
              className={`${cardLabel} block mb-1`}
            >
              Scadenza
            </label>
            <input
              id="fld-admin-poimodal-poimarketingtab-tsx-l52"
              type="date"
              value={formData.showcaseExpiry || ''}
              onChange={(e) => updateField('showcaseExpiry', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};
