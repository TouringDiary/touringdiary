import { PointOfInterest, ItineraryItem, User, CitySummary } from '../../types/index';

export interface ModalManagerExternalProps {
    user: User;
    itinerary: any;
    userLocation: { lat: number; lng: number } | null;
    activeCityId: string | null;
    activeCitySummary: any;
    visibleAllPois: PointOfInterest[];
    activeCityDetails: any;
    cityManifest: CitySummary[];
    onAuthSuccess: (user: User) => void;
    onConfirmGps: () => void;
    onCloseLevelUp: () => void; 
    onNavigateToCity: (id: string) => void;
    onToggleItinerary: (poi: PointOfInterest) => void; 
    onConfirmAdd: (poi: PointOfInterest, day: number, time: string) => void;
    onRemoveItem: (id: string) => void;
    onSetItineraryDates: (s: string, e: string) => void;
    onResolveConflict: (item: ItineraryItem, dayIdx: number, conflictingItem: ItineraryItem, action: 'changeTime' | 'swap', time?: string) => void;
    onResolveDuplicate: (poi: PointOfInterest, dayIdx: number, timeSlot: string, existingItem: ItineraryItem, action: 'add' | 'replace') => void;
    onRemoveSingle: (id: string) => void;
    onRemoveAll: (items: ItineraryItem[]) => void;
    onUserUpdate: (user: User) => void;
    onNavigateGlobal: (section: any, tab?: string, id?: string, extra?: any) => void;
    onOpenShop?: (poi: PointOfInterest) => void;
    activePreview: any;
    onClosePreview: () => void;
    onLogout: () => void;
    onAroundMeTrigger: (config: { type: 'gps' | 'manual', cityId?: string, radius: number }) => void;
}
