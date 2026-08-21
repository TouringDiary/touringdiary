import { Award, Eye, Loader2, Sparkles } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useAiRuntimeGate } from '@/hooks/useAiRuntimeGate';
import { generateCitySection } from '../../../../services/ai';
import { mergePatronDetailsFromAi } from '../../../../services/city/parsers/content/mergePatronDetailsFromAi';
import type { CityDetails } from '../../../../types/index';
import { AiFieldHelper } from '../../AiFieldHelper';
import { CulturePatronFestGallerySection } from './CulturePatronFestGallerySection';
import { CulturePatronMainPhotoSection } from './CulturePatronMainPhotoSection';

interface CulturePatronProps {
  city: CityDetails;
  updateDetailField: (field: keyof CityDetails['details'], value: unknown) => void;
  triggerPreview: (type: 'patron', title: string) => void;
}

const emptyPatronDetails = (): NonNullable<CityDetails['details']['patronDetails']> => ({
  name: '',
  date: '',
  history: '',
  imageUrl: '',
  image_status: 'missing',
  imageAsset: { url: '', mediaStatus: 'missing' },
});

export const CulturePatron: React.FC<CulturePatronProps> = ({
  city,
  updateDetailField,
  triggerPreview,
}) => {
  const { aiBlocked, blockMessage, guardAiAction } = useAiRuntimeGate();
  const [generating, setGenerating] = useState(false);
  const [patronStrategy, setPatronStrategy] = useState('');

  const updatePatronDetails = (
    patch: Partial<NonNullable<CityDetails['details']['patronDetails']>>,
  ) => {
    const currentDetails = city.details.patronDetails || emptyPatronDetails();
    updateDetailField('patronDetails', { ...currentDetails, ...patch });
  };

  const handleRegeneratePatron = async (instructions: string) => {
    if (!guardAiAction()) return;
    if (!city.name) return;
    setGenerating(true);
    try {
      const data = await generateCitySection(city.name, 'patron', instructions);
      if (data.patron?.name) {
        const newPatronDetails = mergePatronDetailsFromAi(city.details.patronDetails, data.patron);
        updateDetailField('patronDetails', newPatronDetails);
        updateDetailField('patron', data.patron.name);
      }
    } catch {
      alert('Errore generazione Patron AI.');
    } finally {
      setGenerating(false);
    }
  };

  const handleNameChange = (newValue: string) => {
    updateDetailField('patron', newValue);
    updatePatronDetails({ name: newValue });
  };

  const handleDateChange = (newValue: string) => {
    updatePatronDetails({ date: newValue });
  };

  const handleHistoryChange = (newValue: string) => {
    updatePatronDetails({ history: newValue });
  };

  return (
    <div className="bg-slate-900 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-slate-800 shadow-2xl">
      <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <h3 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2">
          <Award className="w-5 h-5 md:w-6 md:h-6 text-amber-500" /> Santo Patrono
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleRegeneratePatron(patronStrategy)}
            disabled={generating || aiBlocked}
            title={aiBlocked ? blockMessage : undefined}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center gap-2 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {aiBlocked ? 'AI disabilitata' : 'Genera Contenuto (Pro)'}
          </button>
          <button
            type="button"
            onClick={() => triggerPreview('patron', 'Santo Patrono')}
            className="bg-slate-800 p-2 rounded-lg text-white hover:bg-slate-700 transition-colors"
            title="Anteprima Modale"
            aria-label="Anteprima modale Santo Patrono"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <AiFieldHelper
          contextLabel="storia del santo patrono"
          onApply={(val) => setPatronStrategy(val)}
          mode="text"
          currentValue={patronStrategy}
          initialPrompt="Scrivi come un romanziere storico: avvincente, non scolastico. Focalizzati sui miracoli e sulla devozione popolare."
          defaultPrompts={[
            'Scrivi come un romanziere storico: avvincente, non scolastico. Focalizzati sui miracoli e sulla devozione popolare.',
          ]}
          fieldId="patron_strategy"
          isStrategyConfig={true}
        />
      </div>

      <div className="space-y-4 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="fld-admin-cityeditor-culture-culturepatron-tsx-l131"
              className="text-xs font-bold text-slate-500 uppercase block mb-1"
            >
              Nome Santo
            </label>
            <input
              id="fld-admin-cityeditor-culture-culturepatron-tsx-l131"
              value={city.details.patronDetails?.name || city.details.patron || ''}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
              placeholder="Es. San Gennaro"
            />
          </div>
          <div>
            <label
              htmlFor="fld-admin-cityeditor-culture-culturepatron-tsx-l142"
              className="text-xs font-bold text-slate-500 uppercase block mb-1"
            >
              Data Celebrazione
            </label>
            <input
              id="fld-admin-cityeditor-culture-culturepatron-tsx-l142"
              value={city.details.patronDetails?.date || ''}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
              placeholder="19 Settembre"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="fld-admin-cityeditor-culture-culturepatron-tsx-l155"
            className="text-xs font-bold text-slate-500 uppercase block mb-1"
          >
            Storia / Culto
          </label>
          <textarea
            id="fld-admin-cityeditor-culture-culturepatron-tsx-l155"
            rows={6}
            value={city.details.patronDetails?.history || ''}
            onChange={(e) => handleHistoryChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm leading-relaxed resize-y focus:border-amber-500 outline-none"
            placeholder="Breve storia del culto..."
          />
          <div className="mt-2">
            <AiFieldHelper
              contextLabel={`storia culto di ${city.details.patron || 'Santo Patrono'}`}
              onApply={(val) => handleHistoryChange(val)}
              currentValue={city.details.patronDetails?.history}
              compact={true}
              fieldId="patron_history_ai"
            />
          </div>
        </div>
      </div>

      <CulturePatronMainPhotoSection city={city} updatePatronDetails={updatePatronDetails} />

      <CulturePatronFestGallerySection city={city} />
    </div>
  );
};
