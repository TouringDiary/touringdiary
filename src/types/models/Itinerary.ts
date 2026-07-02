
import { PointOfInterest } from './City';
import { Review } from '../shared';
import type { DiaryNotesState } from './DiaryNotes';

// Interface for Roadbook Data persistence
export interface RoadbookSegment {
    from: string;
    fromAddress?: string; 
    to: string;
    toAddress?: string;   
    transportMode: 'walk' | 'transit' | 'car';
    duration: string;
    instructions: string;
    tips?: string;
    transportCost?: string; // Costo del mezzo
    ticketCost?: string;    // Costo biglietto (Musei, etc.)
    foodCost?: string;      // Costo consumazione (Ristoranti, etc.)
}

export interface RoadbookDay {
    dayIndex: number;
    segments: RoadbookSegment[];
}

export interface ItineraryItem {
  id: string;
  poi: PointOfInterest;
  cityId: string;
  dayIndex: number;
  timeSlotStr: string;
  icon?: string;
  notes?: string;
  completed?: boolean;
  isCustom?: boolean;
  customIcon?: string;

  // --- TIMELINE 3.0 ---
  // Mezzo di trasporto scelto manualmente per il segmento che PORTA a questa tappa.
  // Es. 'walk' | 'bike' | 'scooter' | 'motorbike' | 'car' | 'taxi' | 'bus' | 'train'
  //     | 'subway' | 'tram' | 'ferry' | 'boat' | 'plane'. Se assente, segmento neutro.
  transportMode?: string;

  // --- DIARY 2.0 FIELDS ---
  // Se true, l'item non appare nella timeline verticale ma nella sezione "Risorse & Contatti" (Footer)
  isResource?: boolean; 
  
  // Tipo di item nel diario: 'standard' (tappa), 'memo' (promemoria volante)
  type?: 'standard' | 'memo';
  
  // Se è un memo collegato a una risorsa (es. "Chiama Mario"), questo ID punta alla risorsa nel footer
  linkedResourceId?: string;
}

export interface Itinerary {
  /** `null` finché il diario non ha un id persistito (bozza locale / mai salvato). */
  id: string | null;
  userId?: string; // NEW: Traccia il proprietario anche nel LocalStorage
  name: string;
  startDate: string | null;
  endDate: string | null;
  items: ItineraryItem[];
  createdAt: number;
  updatedAt?: number;
  dayStyles?: Record<number, string>; 
  roadbook?: RoadbookDay[];
  /** Area NOTE del diario — collezione di tab con documenti Tiptap/ProseMirror. */
  diaryNotes?: DiaryNotesState | null;
  suitcase_id?: string | null;
}

/** Stato iniziale vuoto del Diario — unico punto per evitare divergenze tra reset e mount. */
export function createEmptyItinerary(): Itinerary {
  return {
    id: null,
    name: '',
    startDate: null,
    endDate: null,
    items: [],
    createdAt: Date.now(),
    dayStyles: {},
    roadbook: [],
    diaryNotes: null,
  };
}

export interface PremadeItinerary {
    id: string;
    title: string;
    description: string;
    durationDays: number;
    coverImage: string;
    imageCredit?: string; 
    imageLicense?: 'own' | 'cc' | 'public' | 'copyright';
    
    status: 'published' | 'draft'; 

    tags: string[]; 
    difficulty: 'Relax' | 'Moderato' | 'Intenso';
    
    type: 'official' | 'community' | 'ai'; 
    author?: string; 
    
    rating: number;
    votes: number;
    reviews?: Review[]; 
    
    continent: string;
    nation: string;
    region: string;
    zone: string;
    mainCity: string;
    
    date?: string;

    items: {
        dayIndex: number;
        timeSlotStr: string;
        poiId: string; 
        cityId: string; 
        fallbackName?: string; 
        note?: string;
    }[];
}
