import { Crop, Loader2, Trash2, Upload, Users } from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  type FamousPersonSpecificDto,
  loadFamousPersonTaxonomy,
} from '@/services/city/famousPersonCategoryService';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { PlaceholderGrid } from '../design/PlaceholderGrid';
import { FAMOUS_PERSON_GENERIC_PLACEHOLDER_KEY } from './famousPersonPlaceholderConstants';
import type { AssetUploadTarget } from './types';

type FamousPersonPlaceholdersSectionProps = {
  categoryPlaceholders: Record<string, string>;
  generalPlaceholder: string;
  editPlaceholderCat: string;
  famousPersonPlaceholderInputRef: React.RefObject<HTMLInputElement | null>;
  famousPersonGeneralInputRef: React.RefObject<HTMLInputElement | null>;
  triggerFamousPersonPlaceholderUpload: (catId: string) => void;
  triggerFamousPersonGeneralUpload: () => void;
  openEditor: (url: string, target: AssetUploadTarget, cat?: string) => void;
  requestDeleteFamousPersonPlaceholder: (
    kind: 'famous_person_category' | 'famous_person_general',
    catId: string,
  ) => void;
  handleFileUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    target: AssetUploadTarget,
    phCat?: string,
  ) => void;
};

export const FamousPersonPlaceholdersSection = ({
  categoryPlaceholders,
  generalPlaceholder,
  editPlaceholderCat,
  famousPersonPlaceholderInputRef,
  famousPersonGeneralInputRef,
  triggerFamousPersonPlaceholderUpload,
  triggerFamousPersonGeneralUpload,
  openEditor,
  requestDeleteFamousPersonPlaceholder,
  handleFileUpload,
}: FamousPersonPlaceholdersSectionProps) => {
  const [specifics, setSpecifics] = useState<FamousPersonSpecificDto[]>([]);
  const [isLoadingTaxonomy, setIsLoadingTaxonomy] = useState(true);
  const [taxonomyError, setTaxonomyError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setIsLoadingTaxonomy(true);
      setTaxonomyError(null);
      try {
        const tree = await loadFamousPersonTaxonomy({ activeOnly: true });
        if (cancelled) return;
        setSpecifics(tree.specifics);
      } catch (error) {
        console.error('[FamousPersonPlaceholdersSection] taxonomy load failed', error);
        if (!cancelled) {
          setTaxonomyError('Impossibile caricare le categorie Personaggio.');
        }
      } finally {
        if (!cancelled) setIsLoadingTaxonomy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const gridCategories = useMemo(() => {
    const fromTaxonomy = specifics.map((s) => ({
      id: s.id,
      label: s.label,
    }));
    return [
      ...fromTaxonomy,
      { id: FAMOUS_PERSON_GENERIC_PLACEHOLDER_KEY, label: 'Personaggio Generico' },
    ];
  }, [specifics]);

  const canShowCategoryGrid = !isLoadingTaxonomy && !taxonomyError;

  return (
    <div className="space-y-6">
      {isLoadingTaxonomy ? (
        <p className="text-xs text-slate-500 flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
          Caricamento categorie…
        </p>
      ) : null}

      {taxonomyError ? (
        <div
          className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-4 space-y-1"
          role="alert"
        >
          <p className="text-xs text-rose-400 font-semibold">{taxonomyError}</p>
          <p className="text-xs text-slate-500">
            I placeholder per categoria non sono elencati finché la tassonomia non è disponibile. Il
            placeholder generale resta gestibile sotto.
          </p>
        </div>
      ) : null}

      {canShowCategoryGrid ? (
        <PlaceholderGrid
          title="Placeholder Personaggi Famosi (per categoria)"
          description="Specifico per categoria attiva + fallback «Personaggio Generico»"
          categories={gridCategories}
          placeholders={categoryPlaceholders}
          onUploadClick={triggerFamousPersonPlaceholderUpload}
          onEditClick={(url, catId) => openEditor(url, 'famous_person_placeholder', catId)}
          onDeleteClick={(catId) =>
            requestDeleteFamousPersonPlaceholder('famous_person_category', catId)
          }
        />
      ) : null}

      <input
        ref={famousPersonPlaceholderInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'famous_person_placeholder', editPlaceholderCat)}
      />

      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex flex-col gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-900/20 rounded-lg text-violet-400">
            <Users className="w-6 h-6" aria-hidden />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Placeholder generale Personaggi Famosi</h3>
            <p className="text-xs text-slate-400">
              Fallback globale se manca categoria specifica e Personaggio Generico
            </p>
          </div>
        </div>

        <div className="relative aspect-video max-w-md w-full rounded-xl overflow-hidden border border-slate-700 bg-black/20 group">
          <ImageWithFallback
            src={generalPlaceholder}
            alt="Placeholder generale Personaggi Famosi"
            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all"
          />
          <div className="absolute inset-0 bg-black/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
            <button
              type="button"
              onClick={triggerFamousPersonGeneralUpload}
              className="p-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 shadow-lg transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
              title="Carica placeholder generale"
              aria-label="Carica placeholder generale Personaggi Famosi"
            >
              <Upload className="w-4 h-4" aria-hidden />
            </button>
            {generalPlaceholder ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    openEditor(generalPlaceholder, 'famous_person_general', '__general__')
                  }
                  className="p-2 bg-slate-700 rounded-lg text-white hover:bg-slate-600 shadow-lg transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/50"
                  title="Modifica"
                  aria-label="Modifica placeholder generale Personaggi Famosi"
                >
                  <Crop className="w-4 h-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    requestDeleteFamousPersonPlaceholder('famous_person_general', '__general__')
                  }
                  className="p-2 bg-red-900/80 rounded-lg text-white hover:bg-red-700 shadow-lg transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                  title="Elimina"
                  aria-label="Elimina placeholder generale Personaggi Famosi"
                >
                  <Trash2 className="w-4 h-4" aria-hidden />
                </button>
              </>
            ) : null}
          </div>
        </div>

        <input
          ref={famousPersonGeneralInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileUpload(e, 'famous_person_general')}
        />
      </div>
    </div>
  );
};
