
import { PointOfInterest } from './City';
import { Review } from '../shared';

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
  
  // --- DIARY 2.0 FIELDS ---
  // Se true, l'item non appare nella timeline verticale ma nella sezione "Risorse & Contatti" (Footer)
  isResource?: boolean; 
  
  // Tipo di item nel diario: 'standard' (tappa), 'memo' (promemoria volante)
  type?: 'standard' | 'memo';
  
  // Se è un memo collegato a una risorsa (es. "Chiama Mario"), questo ID punta alla risorsa nel footer
  linkedResourceId?: string;
}

export interface Itinerary {
  id: string;
  userId?: string; // NEW: Traccia il proprietario anche nel LocalStorage
  name: string;
  startDate: string | null;
  endDate: string | null;
  items: ItineraryItem[];
  createdAt: number;
  updatedAt?: number;
  dayStyles?: Record<number, string>; 
  roadbook?: RoadbookDay[]; 
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
