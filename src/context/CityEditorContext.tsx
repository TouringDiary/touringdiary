import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAdminData } from '../hooks/useAdminData';
import { resolveCanonicalCityId } from '../services/city/cityIdService';
import { evaluateAndUpdateCityStatus } from '../services/city/cityUpdateService';
import type { CityInfoPreviewTab } from '../types/cityPreview';
import type {
  CityDetails,
  CityEvent,
  CityGuide,
  CityService,
  CitySummary,
  CityTourOperator,
} from '../types/index';

// Definizione della struttura base per una nuova città
const EMPTY_CITY: CityDetails = {
  id: '',
  slug: '',
  name: '',
  zone: '',
  adminRegion: 'Campania',
  nation: 'Italia',
  continent: 'Europa',
  description: '',
  imageUrl: '',
  image_status: 'placeholder',
  heroImage: '',
  hero_status: 'placeholder',
  rating: 0,
  visitors: 0,
  isFeatured: false,
  coords: { lat: 0, lng: 0 },
  status: 'draft',
  tags: [],
  details: {
    subtitle: '',
    heroImage: '',
    hero_status: 'placeholder',
    historySnippet: '',
    historyFull: '',
    historySections: [],
    historyGallery: [],
    topAttractions: [],
    allPois: [],
    foodSpots: [],
    hotels: [],
    newDiscoveries: [],
    leisureSpots: [],
    ratings: {
      cultura: 50,
      monumenti: 50,
      musei_arte: 50,
      tradizione: 50,
      architettura: 50,
      natura: 50,
      mare_spiagge: 50,
      paesaggi: 50,
      clima: 50,
      sostenibilita: 50,
      gusto: 50,
      cucina: 50,
      vita_notturna: 50,
      caffe_bar: 50,
      mercati: 50,
      viaggiatore: 50,
      mobilita: 50,
      accoglienza: 50,
      costo: 50,
      sicurezza: 50,
    },
    seasonalVisitors: { spring: 0, summer: 0, autumn: 0, winter: 0 },
    services: [],
    events: [],
    famousPeople: [],
    guides: [],
    generationLogs: [],
    patron: '',
    gallery: [],
  },
};

// Tipi per la richiesta di anteprima
export type PreviewType =
  | 'none'
  | 'history'
  | 'patron'
  | 'snippet'
  | 'ratings'
  | 'header'
  | 'card'
  | 'weather'
  | 'list'
  | CityInfoPreviewTab;

/** Liste tipizzate per anteprima tab Info & Guide / card-list. */
export type PreviewItems =
  | CityGuide[]
  | CityEvent[]
  | CityService[]
  | CityTourOperator[]
  | CityDetails[];

export type PreviewRequest =
  | { type: 'guides'; title?: string; items?: CityGuide[] }
  | { type: 'events'; title?: string; items?: CityEvent[] }
  | { type: 'services'; title?: string; items?: CityService[] }
  | { type: 'tour_operators'; title?: string; items?: CityTourOperator[] }
  | { type: 'card' | 'list'; title?: string; items?: CityDetails[] }
  | {
      type: Exclude<PreviewType, CityInfoPreviewTab | 'card' | 'list'>;
      title?: string;
    };

export interface CityEditorContextType {
  // Stato Dati
  city: CityDetails | null;
  isLoading: boolean;
  isSaving: boolean;
  manifest: CitySummary[];
  isDirty: boolean; // NEW: Indica se ci sono modifiche non salvate

  // Stato UI
  previewRequest: PreviewRequest;

  // Azioni Modifica
  updateField: <K extends keyof CityDetails>(field: K, value: CityDetails[K]) => void;
  updateDetailField: <K extends keyof CityDetails['details']>(
    field: K,
    value: CityDetails['details'][K],
  ) => void;
  updateCoord: (type: 'lat' | 'lng', value: string | number) => void;
  setCityDirectly: (newCity: CityDetails | null) => void;

  // Azioni Sistema
  saveCity: (status?: 'published' | 'draft', customSuccessMessage?: string) => Promise<boolean>;
  triggerPreview: {
    (type: 'guides', title?: string, items?: CityGuide[]): void;
    (type: 'events', title?: string, items?: CityEvent[]): void;
    (type: 'services', title?: string, items?: CityService[]): void;
    (type: 'tour_operators', title?: string, items?: CityTourOperator[]): void;
    (type: 'card' | 'list', title?: string, items?: CityDetails[]): void;
    (type: Exclude<PreviewType, CityInfoPreviewTab | 'card' | 'list'>, title?: string): void;
  };
  clearPreviewRequest: () => void;
  refreshData: () => Promise<void>;
  reloadCurrentCity: () => Promise<void>;
}

const CityEditorContext = createContext<CityEditorContextType | undefined>(undefined);

interface ProviderProps {
  children?: ReactNode;
  cityId: string;
  onSaveSuccess?: (msg: string) => void;
  onSaveError?: (msg: string) => void;
}

export const CityEditorProvider = ({
  children,
  cityId,
  onSaveSuccess,
  onSaveError,
}: ProviderProps) => {
  const { getFullCity, saveFullCity, cities, refreshManifest } = useAdminData();

  const [city, setCity] = useState<CityDetails | null>(null);
  const [originalCity, setOriginalCity] = useState<string>(''); // Salviamo come stringa JSON per confronto facile

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewRequest, setPreviewRequest] = useState<PreviewRequest>({ type: 'none' });

  // getFullCity da useAdminData non è memoizzato: ref evita re-fetch a ogni render.
  const getFullCityRef = useRef(getFullCity);
  const onSaveErrorRef = useRef(onSaveError);
  getFullCityRef.current = getFullCity;
  onSaveErrorRef.current = onSaveError;

  // Caricamento Iniziale
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        if (cityId === 'new') {
          if (isMounted) {
            // Usiamo un placeholder invece di un timestamp per forzare la risoluzione al primo salvataggio
            const empty = {
              ...JSON.parse(JSON.stringify(EMPTY_CITY)),
              id: 'NEW_UNREGISTERED_CITY',
            };
            setCity(empty);
            setOriginalCity(JSON.stringify(empty));
          }
        } else {
          const data = await getFullCityRef.current(cityId);
          if (isMounted) {
            if (data) {
              setCity(data);
              setOriginalCity(JSON.stringify(data));
            } else {
              onSaveErrorRef.current?.('Città non trovata.');
            }
          }
        }
      } catch (e: unknown) {
        console.error('CityEditor load error:', e);
        if (isMounted) {
          const message = e instanceof Error ? e.message : 'Errore caricamento città.';
          onSaveErrorRef.current?.(message);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [cityId]);

  // Calcolo isDirty
  const isDirty = useMemo(() => {
    if (!city) return false;
    return JSON.stringify(city) !== originalCity;
  }, [city, originalCity]);

  // Actions
  const updateField = useCallback(
    <K extends keyof CityDetails>(field: K, value: CityDetails[K]) => {
      setCity((prev) => (prev ? { ...prev, [field]: value } : null));
    },
    [],
  );

  const updateDetailField = useCallback(
    <K extends keyof CityDetails['details']>(field: K, value: CityDetails['details'][K]) => {
      setCity((prev) => (prev ? { ...prev, details: { ...prev.details, [field]: value } } : null));
    },
    [],
  );

  const updateCoord = useCallback((type: 'lat' | 'lng', value: string | number) => {
    const numVal = typeof value === 'string' ? parseFloat(value) : value;
    setCity((prev) => (prev ? { ...prev, coords: { ...prev.coords, [type]: numVal } } : null));
  }, []);

  const setCityDirectly = useCallback((newCity: CityDetails | null) => {
    setCity(newCity);
  }, []);

  const reloadCurrentCity = useCallback(async () => {
    if (!cityId || cityId === 'new') return;
    setIsLoading(true);
    try {
      const data = await getFullCity(cityId);
      if (data) {
        setCity(data);
        setOriginalCity(JSON.stringify(data)); // Reset dirty state on reload
      }
    } catch (e) {
      console.error('Reload error', e);
    } finally {
      setIsLoading(false);
    }
  }, [cityId, getFullCity]);

  const saveCity = useCallback(
    async (status?: 'published' | 'draft', customSuccessMessage?: string): Promise<boolean> => {
      if (!city) return false;

      const cityToSave = { ...city };
      let requestedStatus: CityDetails['status'] = cityToSave.status;

      setIsSaving(true);
      try {
        if (cityToSave.id === 'NEW_UNREGISTERED_CITY') {
          if (!cityToSave.name) throw new Error('Inserisci il nome del Comune prima di salvare.');

          try {
            const canonicalId = await resolveCanonicalCityId(
              cityToSave.name,
              cityToSave.adminRegion,
            );
            cityToSave.id = canonicalId;
          } catch {
            throw new Error(
              `Impossibile registrare la città: il Comune "${cityToSave.name}" non è presente nel registro ufficiale (cities_registry).`,
            );
          }
        }

        requestedStatus = status ?? cityToSave.status;
        await saveFullCity({ ...cityToSave, status: requestedStatus });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Errore salvataggio.';
        console.error('Save error:', e);
        if (onSaveError) onSaveError(message);
        return false;
      } finally {
        setIsSaving(false);
      }

      let finalStatus: CityDetails['status'] = requestedStatus;
      try {
        finalStatus = await evaluateAndUpdateCityStatus(cityToSave.id);
      } catch (evalError) {
        console.warn('Impossibile ricalcolare lo stato, uso quello richiesto:', evalError);
      }

      const updatedCity = { ...cityToSave, status: finalStatus };
      setCity(updatedCity);
      setOriginalCity(JSON.stringify(updatedCity));

      if (onSaveSuccess) {
        if (customSuccessMessage) {
          onSaveSuccess(customSuccessMessage);
        } else if (requestedStatus === 'published' && finalStatus !== 'published') {
          onSaveSuccess('Città salvata. (Non pubblicabile: mancano POI o info base)');
        } else {
          onSaveSuccess(finalStatus === 'published' ? 'Città pubblicata!' : 'Città salvata.');
        }
      }
      return true;
    },
    [city, saveFullCity, onSaveSuccess, onSaveError],
  );

  const triggerPreview = useCallback((type: PreviewType, title?: string, items?: PreviewItems) => {
    switch (type) {
      case 'guides':
        setPreviewRequest({ type, title, items: items as CityGuide[] | undefined });
        return;
      case 'events':
        setPreviewRequest({ type, title, items: items as CityEvent[] | undefined });
        return;
      case 'services':
        setPreviewRequest({ type, title, items: items as CityService[] | undefined });
        return;
      case 'tour_operators':
        setPreviewRequest({ type, title, items: items as CityTourOperator[] | undefined });
        return;
      case 'card':
      case 'list':
        setPreviewRequest({ type, title, items: items as CityDetails[] | undefined });
        return;
      default:
        setPreviewRequest({ type, title });
    }
  }, []) as CityEditorContextType['triggerPreview'];

  const clearPreviewRequest = useCallback(() => {
    setPreviewRequest({ type: 'none' });
  }, []);

  return (
    <CityEditorContext.Provider
      value={{
        city,
        isLoading,
        isSaving,
        isDirty,
        manifest: cities,
        previewRequest,
        updateField,
        updateDetailField,
        updateCoord,
        setCityDirectly,
        saveCity,
        triggerPreview,
        clearPreviewRequest,
        refreshData: refreshManifest,
        reloadCurrentCity,
      }}
    >
      {children}
    </CityEditorContext.Provider>
  );
};

export const useCityEditor = () => {
  const context = useContext(CityEditorContext);
  if (!context) {
    throw new Error('useCityEditor must be used within a CityEditorProvider');
  }
  return context;
};
