import { BookOpen, Calendar, Info, MessageSquarePlus, Pencil } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  ADMIN_CITY_TAB_STORIA,
  buildAdminCityEditTarget,
} from '@/components/admin/adminCityEditNav';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { isPatronPublicContentHidden } from '@/constants/governance';
import { Z_MODAL, Z_OVERLAY } from '@/constants/zIndex';
import { useCityPatronGallery } from '@/hooks/patron/useCityPatronGallery';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { resolvePatronPrimaryImageUrl } from '@/services/media/imageAssignmentVisibilityService';
import type { CityPatronGalleryPhoto } from '@/types/models/patronGallery';
import type { User } from '@/types/users';
import type { CityDetails } from '../../types/index';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { PatronFestGalleryStrip } from './PatronFestGalleryStrip';
import { ReportPatronPhotoAbuseModal } from './ReportPatronPhotoAbuseModal';
import { SuggestPatronPhotoModal } from './SuggestPatronPhotoModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  city: CityDetails;
  user: User;
  /** Consumer pubblici (guest). Opzionale se l’utente è già autenticato (es. preview Admin). */
  onOpenAuth?: () => void;
}

const isAdminUser = (user: User): boolean =>
  user.role === 'admin_all' || user.role === 'admin_limited';

const TITLE_CLASS =
  'text-amber-500 font-display font-bold text-xl md:text-2xl mt-6 mb-3 leading-tight tracking-wide uppercase border-b border-amber-500/20 pb-2';
const PARAGRAPH_CLASS = 'text-slate-300 font-serif text-lg leading-relaxed text-justify mb-4';

const stripTags = (value: string): string => {
  if (!value) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = value;
  return tmp.textContent || tmp.innerText || '';
};

const renderInlineBold = (text: string): ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  let boldOccurrence = 0;
  return parts.map((part) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const boldText = part.slice(2, -2);
      const key = `b-${boldOccurrence}`;
      boldOccurrence += 1;
      return (
        <strong key={key} className="text-white font-bold">
          {boldText}
        </strong>
      );
    }
    return part;
  });
};

const renderPatronContent = (text: string): ReactNode => {
  if (!text) return null;

  const processedText = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  const lines = processedText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const occurrence = new Map<string, number>();

  return lines.map((line) => {
    const n = occurrence.get(line) ?? 0;
    occurrence.set(line, n + 1);
    const key = `${line}#${n}`;

    const isMarkdownHeader = line.startsWith('#');
    const isExplicitTitle = line.toUpperCase().startsWith('TITOLO:');
    const isImplicitTitle =
      line.length > 3 && line.length < 80 && line === line.toUpperCase() && !line.endsWith('.');

    if (isMarkdownHeader || isExplicitTitle || isImplicitTitle) {
      const content = line
        .replace(/^#+\s*/, '')
        .replace(/^TITOLO:\s*/i, '')
        .replace(/\*\*/g, '')
        .trim();

      return (
        <h3 key={key} className={TITLE_CLASS}>
          {content}
        </h3>
      );
    }

    return (
      <p key={key} className={PARAGRAPH_CLASS}>
        {renderInlineBold(line)}
      </p>
    );
  });
};

export const PatronSaintModal = ({ isOpen, onClose, city, user, onOpenAuth }: Props) => {
  const navigate = useNavigate();
  const patron = city.details.patronDetails;
  const patronEditorialStatus = city.details.patronEditorialStatus;
  const isPatronGateActive = isPatronPublicContentHidden(patronEditorialStatus);
  const [visibleHeroImageUrl, setVisibleHeroImageUrl] = useState<string | null>(null);
  const [heroImageLoading, setHeroImageLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || isPatronGateActive) {
      setVisibleHeroImageUrl(null);
      setHeroImageLoading(false);
      return;
    }
    let cancelled = false;
    setHeroImageLoading(true);
    void resolvePatronPrimaryImageUrl(city.id)
      .then((url) => {
        if (cancelled) return;
        const trimmed = url?.trim() ?? '';
        setVisibleHeroImageUrl(trimmed.length > 0 ? trimmed : null);
      })
      .catch((err: unknown) => {
        console.warn('[PatronSaintModal] risoluzione foto primaria Patrono fallita:', err);
        if (!cancelled) setVisibleHeroImageUrl(null);
      })
      .finally(() => {
        if (!cancelled) setHeroImageLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, isPatronGateActive, city.id]);

  const { photos, isLoading, reload } = useCityPatronGallery(
    city.id,
    isOpen && !isPatronGateActive,
  );
  const patronDisplayName = stripTags(patron?.name ?? city.details.patron ?? '');

  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [reportPhoto, setReportPhoto] = useState<CityPatronGalleryPhoto | null>(null);
  const [isGalleryLightboxOpen, setIsGalleryLightboxOpen] = useState(false);

  const canEditInAdmin = isAdminUser(user) && !city.isVirtual && city.id !== 'around-me-virtual';

  // ESC LIFO: lightbox / suggest / report chiudono prima del modale Patrono.
  useGlobalModalEscape(
    isOpen && !showSuggestModal && !reportPhoto && !isGalleryLightboxOpen,
    onClose,
  );

  const handleAdminEditPatron = () => {
    if (!canEditInAdmin) return;
    const target = buildAdminCityEditTarget(city.id, ADMIN_CITY_TAB_STORIA);
    onClose();
    navigate(target.pathname, { replace: true, state: target.state });
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        className="td-modal-overlay bg-black/95 backdrop-blur-md flex items-center justify-center p-0 md:p-4 animate-in fade-in pointer-events-auto"
        style={{ zIndex: Z_OVERLAY }}
        role="presentation"
      >
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent p-0"
          onClick={onClose}
        />
        <div
          className="relative bg-[#020617] w-full max-w-4xl h-full md:max-h-[90vh] md:rounded-3xl border-0 md:border border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 pointer-events-auto"
          style={{ zIndex: Z_MODAL }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="patron-saint-title"
          aria-describedby="patron-saint-desc"
        >
          <div className="flex justify-between items-center px-6 py-5 border-b border-slate-800 bg-[#0f172a] shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-amber-500 shadow-lg">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h2
                  id="patron-saint-title"
                  className="text-xl md:text-2xl font-black text-white uppercase tracking-wider font-display"
                >
                  Santo Patrono
                </h2>
                <p
                  id="patron-saint-desc"
                  className="text-slate-500 text-xs font-bold uppercase tracking-widest"
                >
                  {city.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {canEditInAdmin ? (
                <button
                  type="button"
                  onClick={handleAdminEditPatron}
                  className="flex items-center justify-center p-2 rounded-full bg-slate-800 text-indigo-400 border border-slate-700 shadow-md transition-all duration-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                  title="Modifica Santo Patrono"
                  aria-label="Modifica Santo Patrono"
                >
                  <Pencil className="w-5 h-5" aria-hidden />
                </button>
              ) : null}
              <CloseButton onClose={onClose} variant="primary" withEscape={false} />
            </div>
          </div>

          {isPatronGateActive ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 md:py-24 text-center bg-[#020617]">
              <p className="text-slate-400 text-sm md:text-base max-w-md mb-8 leading-relaxed">
                Il contenuto del Santo Patrono non è al momento disponibile per{' '}
                <span className="text-white font-semibold">{city.name}</span>. Puoi suggerire
                informazioni o materiali alla community.
              </p>
              <button
                type="button"
                onClick={() => setShowSuggestModal(true)}
                className="inline-flex items-center justify-center gap-2 min-h-12 px-8 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black uppercase tracking-widest text-sm shadow-lg shadow-amber-900/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
              >
                <MessageSquarePlus className="w-5 h-5" aria-hidden />
                Suggerisci
              </button>
            </div>
          ) : patron ? (
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-[#020617]">
              <div className="px-6 md:px-12 py-6 md:py-8 relative">
                <div className="absolute top-10 right-10 opacity-[0.02] pointer-events-none select-none">
                  <BookOpen className="w-96 h-96 text-orange-500" />
                </div>

                <div className="max-w-3xl mx-auto relative z-floating-panel space-y-8">
                  <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-black">
                    {heroImageLoading ? (
                      <div className="absolute inset-0 bg-slate-900 animate-pulse" aria-hidden />
                    ) : (
                      <ImageWithFallback
                        src={visibleHeroImageUrl ?? undefined}
                        alt={patronDisplayName}
                        objectFit="cover"
                        className="absolute inset-0 h-full w-full"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-6 left-6 text-white pointer-events-none">
                      <div className="flex items-center gap-3 mb-1">
                        <Calendar className="w-5 h-5 text-amber-500" />
                        <span className="text-sm font-bold uppercase tracking-widest text-amber-400">
                          Ricorrenza
                        </span>
                      </div>
                      <div className="text-3xl font-display font-bold">
                        {stripTags(patron.date)}
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2 leading-none">
                      {patronDisplayName}
                    </h1>
                    <div className="h-1 w-24 bg-amber-500 mx-auto rounded-full" />
                  </div>

                  <div>{renderPatronContent(patron.history)}</div>

                  <PatronFestGalleryStrip
                    photos={photos}
                    patronName={patronDisplayName}
                    cityName={city.name}
                    isLoading={isLoading}
                    onSuggestPhoto={() => setShowSuggestModal(true)}
                    onReportAbuse={(photo) => setReportPhoto(photo)}
                    onLightboxOpenChange={setIsGalleryLightboxOpen}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500 italic">
              Dati non ancora disponibili per questa città.
            </div>
          )}
        </div>
      </div>

      <SuggestPatronPhotoModal
        isOpen={showSuggestModal}
        onClose={() => setShowSuggestModal(false)}
        cityId={city.id}
        cityName={city.name}
        patronName={patronDisplayName}
        user={user}
        onOpenAuth={onOpenAuth}
        onSuccess={() => void reload()}
      />

      <ReportPatronPhotoAbuseModal
        isOpen={reportPhoto !== null}
        onClose={() => setReportPhoto(null)}
        photo={reportPhoto}
        cityId={city.id}
        cityName={city.name}
        patronName={patronDisplayName}
        user={user}
        onOpenAuth={onOpenAuth}
      />
    </>,
    document.body,
  );
};
