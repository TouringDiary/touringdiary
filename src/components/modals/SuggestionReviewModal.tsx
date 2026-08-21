import {
  AlertOctagon,
  Award,
  Clock,
  Edit3,
  Loader2,
  Pencil,
  PenTool,
  Plus,
  Wand2,
  XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_MODAL, Z_MODAL_NESTED, Z_OVERLAY } from '@/constants/zIndex';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { aiGateway } from '@/services/ai/aiGateway';
import { cleanJsonOutput } from '../../services/ai';
import { getCityDetails } from '../../services/cityService';
import { applySuggestion, updateSuggestionStatus } from '../../services/communityService';
import type { PointOfInterest, SuggestionRequest } from '../../types/index';
import { ImageWithFallback } from '../common/ImageWithFallback';

type SuggestionCategory = SuggestionRequest['details']['category'];

const SUGGESTION_CATEGORIES = [
  'monument',
  'food',
  'hotel',
  'nature',
  'leisure',
  'discovery',
] as const satisfies readonly SuggestionCategory[];

const isSuggestionCategory = (value: string): value is SuggestionCategory =>
  (SUGGESTION_CATEGORIES as readonly string[]).includes(value);

interface Props {
  suggestion: SuggestionRequest;
  onClose: () => void;
  onUpdate: () => void;
  isOpen?: boolean;
}

interface EditData {
  title: string;
  description: string;
  category: SuggestionCategory;
  address: string;
  openingHours: string;
  /** Assente = GPS non fornito / non plausibile (mai placeholder 0,0). */
  coords?: { lat: number; lng: number };
  adminNotes: string;
}

interface AiDeepCheckPayload {
  found: boolean;
  title?: string;
  category?: SuggestionCategory;
  address?: string;
  openingHours?: string;
  description?: string;
  lat?: number;
  lng?: number;
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isPlausibleCoord = (lat: number, lng: number): boolean =>
  lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !(lat === 0 && lng === 0);

const parseAiDeepCheckPayload = (raw: unknown): AiDeepCheckPayload | null => {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.found !== 'boolean') return null;

  const payload: AiDeepCheckPayload = { found: obj.found };

  if (obj.title !== undefined) {
    if (typeof obj.title !== 'string' || obj.title.trim().length === 0) return null;
    payload.title = obj.title.trim();
  }
  if (obj.category !== undefined) {
    if (typeof obj.category !== 'string' || !isSuggestionCategory(obj.category)) return null;
    payload.category = obj.category;
  }
  if (obj.address !== undefined) {
    if (typeof obj.address !== 'string') return null;
    payload.address = obj.address;
  }
  if (obj.openingHours !== undefined) {
    if (typeof obj.openingHours !== 'string') return null;
    payload.openingHours = obj.openingHours;
  }
  if (obj.description !== undefined) {
    if (typeof obj.description !== 'string') return null;
    payload.description = obj.description;
  }
  if (obj.lat !== undefined || obj.lng !== undefined) {
    if (!isFiniteNumber(obj.lat) || !isFiniteNumber(obj.lng)) return null;
    if (!isPlausibleCoord(obj.lat, obj.lng)) return null;
    payload.lat = obj.lat;
    payload.lng = obj.lng;
  }

  // found:true senza alcun campo verificato non è applicabile al form.
  if (payload.found) {
    const hasVerifiedData =
      payload.title !== undefined ||
      payload.category !== undefined ||
      payload.address !== undefined ||
      payload.openingHours !== undefined ||
      payload.description !== undefined ||
      (payload.lat !== undefined && payload.lng !== undefined);
    if (!hasVerifiedData) return null;
  }

  return payload;
};

const buildEditDataFromSuggestion = (suggestion: SuggestionRequest): EditData => {
  const rawCoords = suggestion.details.coords;
  const coords =
    rawCoords &&
    isFiniteNumber(rawCoords.lat) &&
    isFiniteNumber(rawCoords.lng) &&
    isPlausibleCoord(rawCoords.lat, rawCoords.lng)
      ? { lat: rawCoords.lat, lng: rawCoords.lng }
      : undefined;

  return {
    title: suggestion.details.title,
    description: suggestion.details.description,
    category: suggestion.details.category,
    address: suggestion.details.address,
    openingHours: suggestion.details.openingHours ?? '',
    ...(coords ? { coords } : {}),
    adminNotes: suggestion.adminNotes ?? '',
  };
};

const REJECTION_REASONS = [
  'Luogo già presente nel database',
  'Dati insufficienti o poco precisi',
  'Luogo inesistente o chiuso definitivamente',
  'Contenuto non appropriato',
  "Duplicato di un'altra segnalazione",
  'Altro (vedi nota)',
];

export const SuggestionReviewModal = ({ suggestion, onClose, onUpdate, isOpen = true }: Props) => {
  const [isApplying, setIsApplying] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isAiChecking, setIsAiChecking] = useState(false);

  const [localError, setLocalError] = useState<string | null>(null);
  const [duplicateFound, setDuplicateFound] = useState<{ name: string; id: string } | null>(null);
  const [showRejectionOverlay, setShowRejectionOverlay] = useState(false);

  const [rejectionReason, setRejectionReason] = useState(REJECTION_REASONS[0]);
  const [rejectionNote, setRejectionNote] = useState('');
  const [linkedPoiId, setLinkedPoiId] = useState<string | undefined>(suggestion.poiId);

  const [editData, setEditData] = useState<EditData>(() => buildEditDataFromSuggestion(suggestion));
  const [currentPoi, setCurrentPoi] = useState<PointOfInterest | null>(null);
  const [allCityPois, setAllCityPois] = useState<PointOfInterest[]>([]);
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const lastSyncedSuggestionIdRef = useRef<string | null>(null);
  /** Invalida risposte AI obsolete: generateLegacy non espone AbortSignal. */
  const aiCheckSeqRef = useRef(0);

  useGlobalModalEscape(isOpen, onClose);

  // Riallinea lo stato locale solo al cambio identità suggestion (non a ogni rerender dello stesso id).
  useEffect(() => {
    if (!isOpen) {
      lastSyncedSuggestionIdRef.current = null;
      aiCheckSeqRef.current += 1;
      setIsAiChecking(false);
      return;
    }
    if (lastSyncedSuggestionIdRef.current === suggestion.id) return;
    lastSyncedSuggestionIdRef.current = suggestion.id;
    aiCheckSeqRef.current += 1;
    setIsAiChecking(false);

    setLinkedPoiId(suggestion.poiId);
    setEditData(buildEditDataFromSuggestion(suggestion));
    setDuplicateFound(null);
    setLocalError(null);
    setShowRejectionOverlay(false);
    setRejectionReason(REJECTION_REASONS[0]);
    setRejectionNote('');
    setCurrentPoi(null);
  }, [isOpen, suggestion]);

  useEffect(() => {
    setLinkedPoiId(suggestion.poiId);
  }, [suggestion.poiId]);

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();
    const cityId = suggestion.cityId;
    const poiId = linkedPoiId;

    setLoadingCurrent(true);
    getCityDetails(cityId, controller.signal, { peopleAudience: 'admin' })
      .then((city) => {
        if (controller.signal.aborted) return;
        if (city) {
          const pois = city.details.allPois || [];
          setAllCityPois(pois);
          if (poiId) {
            const poi = pois.find((p) => p.id === poiId);
            setCurrentPoi(poi ?? null);
          } else {
            setCurrentPoi(null);
          }
        } else {
          setAllCityPois([]);
          setCurrentPoi(null);
        }
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        if (e instanceof Error && e.name === 'AbortError') return;
        setAllCityPois([]);
        setCurrentPoi(null);
        setLocalError(
          `Errore caricamento POI città: ${e instanceof Error ? e.message : String(e)}`,
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingCurrent(false);
      });

    return () => {
      controller.abort();
    };
  }, [isOpen, suggestion.cityId, linkedPoiId]);

  if (!isOpen) return null;

  const isNewPlace = suggestion.type === 'new_place';
  const isGpsValid =
    editData.coords !== undefined && isPlausibleCoord(editData.coords.lat, editData.coords.lng);
  const isTitleValid = editData.title.trim().length > 3;
  const isAlreadyApproved = suggestion.status === 'approved';

  const canApply =
    isGpsValid && isTitleValid && !isAlreadyApproved && (!isNewPlace || !duplicateFound);
  const canPending = !isAlreadyApproved;

  const handleAiDeepCheck = async () => {
    const seq = ++aiCheckSeqRef.current;
    setIsAiChecking(true);
    setLocalError(null);
    setDuplicateFound(null);
    try {
      const prompt = `Sei un verificatore di dati turistici per Touring Diary.
            L'utente ha segnalato questo luogo a ${suggestion.cityName}:
            Nome: "${editData.title}"
            Indirizzo: "${editData.address}"
            Descrizione: "${editData.description}"

            RISPONDI SOLO JSON:
            {
                "found": true,
                "title": "Nome Reale Corretto",
                "category": "monument/food/hotel/nature/leisure/discovery",
                "address": "Indirizzo completo",
                "openingHours": "09:00-20:00",
                "description": "Descrizione migliorata",
                "lat": 40.XXXX,
                "lng": 14.XXXX
            }`;

      // generateLegacy non accetta AbortSignal: invalidazione via aiCheckSeqRef.
      const response = await aiGateway.generateLegacy({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
      });
      if (seq !== aiCheckSeqRef.current) return;

      let parsed: unknown;
      try {
        parsed = JSON.parse(cleanJsonOutput(response.text || '{}'));
      } catch {
        setLocalError('Risposta AI non valida: JSON non interpretabile.');
        return;
      }

      const result = parseAiDeepCheckPayload(parsed);
      if (!result) {
        setLocalError('Risposta AI incompleta o malformata. Nessuna modifica applicata.');
        return;
      }

      if (result.found === false) {
        setLocalError("L'AI non ha trovato riscontri reali per questo luogo.");
        return;
      }

      if (seq !== aiCheckSeqRef.current) return;

      if (result.title) {
        const titleKey = result.title.toLowerCase().trim();
        const exists = allCityPois.find((p) => p.name.toLowerCase().trim() === titleKey);
        if (exists) {
          setDuplicateFound({ name: exists.name, id: exists.id });
          if (!linkedPoiId) {
            setLinkedPoiId(exists.id);
            setCurrentPoi(exists);
          }
        }
      }

      setEditData((prev) => ({
        ...prev,
        title: result.title ?? prev.title,
        category: result.category ?? prev.category,
        address: result.address ?? prev.address,
        openingHours: result.openingHours ?? prev.openingHours,
        description: result.description ?? prev.description,
        coords:
          result.lat !== undefined && result.lng !== undefined
            ? { lat: result.lat, lng: result.lng }
            : prev.coords,
      }));
    } catch (e: unknown) {
      if (seq !== aiCheckSeqRef.current) return;
      setLocalError(`Errore controllo AI: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      if (seq === aiCheckSeqRef.current) setIsAiChecking(false);
    }
  };

  const handleApply = async () => {
    if (!canApply) return;
    setLocalError(null);
    setIsApplying(true);
    try {
      await applySuggestion(suggestion.id, editData);
      onUpdate();
      onClose();
    } catch (e: unknown) {
      setLocalError(`Errore applicazione: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsApplying(false);
    }
  };

  const confirmRejection = async () => {
    setLocalError(null);
    setIsRejecting(true);
    try {
      await updateSuggestionStatus(suggestion.id, 'rejected', editData.adminNotes, editData, {
        reason: rejectionReason,
        adminMessage: rejectionNote,
      });
      setShowRejectionOverlay(false);
      onUpdate();
      onClose();
    } catch (e: unknown) {
      setLocalError(`Errore rifiuto: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleSetPending = async () => {
    if (!canPending) return;
    setLocalError(null);
    setIsPending(true);
    try {
      await updateSuggestionStatus(suggestion.id, 'processing', editData.adminNotes, editData);
      onUpdate();
      onClose();
    } catch (e: unknown) {
      setLocalError(`Errore impostazione pending: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsPending(false);
    }
  };

  return createPortal(
    <div
      className="td-modal-overlay bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
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
      {showRejectionOverlay && (
        <div
          className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 pointer-events-auto"
          style={{ zIndex: Z_MODAL_NESTED }}
        >
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent p-0"
            onClick={() => setShowRejectionOverlay(false)}
          />
          <div
            className="bg-slate-900 border border-red-500/50 p-6 rounded-[2rem] shadow-2xl max-w-md w-full animate-in zoom-in-95 pointer-events-auto"
            style={{ zIndex: Z_MODAL_NESTED }}
          >
            <div className="flex flex-col items-center text-center gap-4 mb-6">
              <div className="p-3 bg-red-900/30 rounded-full text-red-500">
                <AlertOctagon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white uppercase tracking-wider">
                Rifiuta Contributo
              </h3>
              <p className="text-xs text-slate-400">
                Specifica il motivo. Verrà inviata una notifica all'utente.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="space-y-1">
                <label
                  htmlFor="fld-modals-suggestionreviewmodal-tsx-l280"
                  className="text-[10px] font-bold text-slate-500 uppercase ml-1"
                >
                  Motivazione Principale
                </label>
                <select
                  id="fld-modals-suggestionreviewmodal-tsx-l280"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:border-red-500"
                >
                  {REJECTION_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="fld-modals-suggestionreviewmodal-tsx-l297"
                  className="text-[10px] font-bold text-slate-500 uppercase ml-1"
                >
                  Messaggio per l'utente
                </label>
                <textarea
                  id="fld-modals-suggestionreviewmodal-tsx-l297"
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="Es: Grazie del contributo! Purtroppo il luogo è già presente..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white text-sm focus:border-red-500 outline-none h-28 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowRejectionOverlay(false)}
                className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-all text-xs uppercase"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={confirmRejection}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg text-xs uppercase"
              >
                Rifiuta e Invia
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="relative bg-slate-900 w-full max-w-6xl h-full md:max-h-[90vh] md:rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 pointer-events-auto"
        style={{ zIndex: Z_MODAL }}
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-[#0f172a]">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-xl bg-slate-800 text-indigo-400`}>
              <PenTool className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white uppercase tracking-wider">
                  Revisione Contributo
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Inviato da <strong className="text-indigo-400">{suggestion.userName}</strong> il{' '}
                {new Date(suggestion.date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isNewPlace ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400' : 'bg-blue-900/30 border-blue-500/50 text-blue-400'}`}
            >
              {isNewPlace ? <Plus className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
              {isNewPlace ? 'Creazione Nuovo' : 'Correzione Dati'}
            </div>
            <CloseButton onClose={onClose} variant="primary" />
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          <div className="flex-1 border-r border-slate-800 bg-slate-950/50 p-6 overflow-y-auto custom-scrollbar">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">
              Database Attuale
            </h4>
            {loadingCurrent ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-slate-700" />
              </div>
            ) : currentPoi ? (
              <div className="space-y-6">
                <div className="aspect-video rounded-xl overflow-hidden border border-slate-800 relative grayscale opacity-50 shadow-inner">
                  <ImageWithFallback
                    src={currentPoi.imageUrl}
                    className="w-full h-full object-cover"
                    alt="Current POI"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-slate-600 font-bold uppercase">Nome</label>
                    <p className="text-slate-400 font-bold">{currentPoi.name}</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 font-bold uppercase">
                      Indirizzo
                    </label>
                    <p className="text-slate-400 text-sm">{currentPoi.address}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-10 bg-indigo-950/10 rounded-2xl border border-dashed border-indigo-900/30">
                <Plus className="w-16 h-16 text-indigo-900 mb-4" />
                <p className="text-indigo-300 font-bold uppercase tracking-widest text-xs">
                  Nuovo Luogo Proposto
                </p>
              </div>
            )}
          </div>

          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-900">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
                Dati Suggeriti (Modificabili)
              </h4>
              <button
                type="button"
                onClick={handleAiDeepCheck}
                disabled={isAiChecking || isAlreadyApproved}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all transform active:scale-95"
              >
                {isAiChecking ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Wand2 className="w-3 h-3" />
                )}{' '}
                AI Deep Check
              </button>
            </div>

            {localError ? (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-300"
              >
                {localError}
              </div>
            ) : null}

            {duplicateFound ? (
              <div
                role="status"
                className="mb-4 rounded-xl border border-amber-500/40 bg-amber-950/30 px-3 py-2 text-xs text-amber-200"
              >
                Possibile duplicato già in database: <strong>{duplicateFound.name}</strong>
              </div>
            ) : null}

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="fld-modals-suggestionreviewmodal-tsx-l426"
                  className={`text-[10px] font-bold uppercase mb-1 block ${!isTitleValid ? 'text-red-500' : 'text-slate-500'}`}
                >
                  Nome Luogo
                </label>
                <input
                  id="fld-modals-suggestionreviewmodal-tsx-l426"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className={`w-full bg-slate-950 border rounded-lg p-3 text-white focus:border-indigo-500 outline-none font-bold ${!isTitleValid ? 'border-red-500' : 'border-slate-700'}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="fld-modals-suggestionreviewmodal-tsx-l439"
                    className="text-[10px] text-slate-500 font-bold uppercase mb-1 block"
                  >
                    Categoria
                  </label>
                  <select
                    id="fld-modals-suggestionreviewmodal-tsx-l439"
                    value={editData.category}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (isSuggestionCategory(value)) {
                        setEditData({ ...editData, category: value });
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none text-xs font-bold uppercase"
                  >
                    <option value="monument">Monumenti</option>
                    <option value="food">Sapori</option>
                    <option value="hotel">Alloggi</option>
                    <option value="nature">Natura</option>
                    <option value="leisure">Svago</option>
                    <option value="discovery">Novità / Altro</option>
                  </select>
                </div>
                <div>
                  <div
                    className={`text-[10px] font-bold uppercase mb-1 flex justify-between ${!isGpsValid ? 'text-red-500' : 'text-slate-500'}`}
                  >
                    <span>GPS</span>
                    {!isGpsValid && <span className="animate-pulse">NON VALIDO</span>}
                  </div>
                  <div
                    className={`w-full bg-slate-950 border rounded-lg p-3 font-mono text-[10px] ${!isGpsValid ? 'border-red-500 text-red-400' : 'border-slate-700 text-emerald-400'}`}
                  >
                    {editData.coords
                      ? `${editData.coords.lat.toFixed(4)}, ${editData.coords.lng.toFixed(4)}`
                      : 'Coordinate assenti'}
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="fld-modals-suggestionreviewmodal-tsx-l475"
                  className="text-[10px] text-slate-500 font-bold uppercase mb-1 block"
                >
                  Indirizzo Verificato
                </label>
                <input
                  id="fld-modals-suggestionreviewmodal-tsx-l475"
                  value={editData.address}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="fld-modals-suggestionreviewmodal-tsx-l485"
                  className="text-[10px] text-slate-500 font-bold uppercase mb-1 block"
                >
                  Descrizione Editoriale
                </label>
                <textarea
                  id="fld-modals-suggestionreviewmodal-tsx-l485"
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white h-24 resize-none focus:border-indigo-500 outline-none text-sm leading-relaxed"
                />
              </div>
              <div className="pt-4 border-t border-slate-800">
                <label
                  htmlFor="fld-modals-suggestionreviewmodal-tsx-l495"
                  className="text-[10px] text-indigo-400 font-bold uppercase flex items-center gap-2 mb-2"
                >
                  <Edit3 className="w-4 h-4" /> Note Interne Admin
                </label>
                <textarea
                  id="fld-modals-suggestionreviewmodal-tsx-l495"
                  value={editData.adminNotes}
                  onChange={(e) => setEditData({ ...editData, adminNotes: e.target.value })}
                  placeholder="Annotazioni private..."
                  className="w-full bg-slate-950 border border-indigo-500/20 rounded-lg p-3 text-xs text-indigo-200 h-20 resize-none focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-950 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setShowRejectionOverlay(true)}
              disabled={isRejecting || isAlreadyApproved}
              className="flex-1 md:flex-none px-6 py-3 bg-red-900/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl font-bold text-xs uppercase transition-all border border-red-900/30 flex items-center justify-center gap-2"
            >
              {isRejecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}{' '}
              Rifiuta
            </button>
            <button
              type="button"
              onClick={handleSetPending}
              disabled={isPending || !canPending}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-xs uppercase transition-all border flex items-center justify-center gap-2 ${canPending ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'}`}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Clock className="w-4 h-4" />
              )}{' '}
              In Verifica
            </button>
          </div>
          <button
            type="button"
            onClick={handleApply}
            disabled={isApplying || !canApply}
            className={`w-full md:w-auto px-10 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 transform hover:scale-105 active:scale-95 ${canApply ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'}`}
          >
            {isApplying ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Award className="w-5 h-5 text-amber-300" />
            )}
            {isAlreadyApproved
              ? 'Già Applicato'
              : canApply
                ? 'Applica & Premia'
                : 'Dati Incompleti'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
