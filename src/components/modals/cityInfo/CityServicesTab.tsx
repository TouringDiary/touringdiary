
import React, { useState, useEffect, useMemo } from 'react';
import { CityDetails, CityService, PointOfInterest, SuggestionType, User } from '../../../types/index';
import { useItinerary } from '../../../context/ItineraryContext';
import { SERVICES_CATEGORIES } from '../../../constants/services';
import { getCachedPlaceholder } from '../../../services/settingsService'; // NEW

// Componenti Locali
import { ServiceSidebar } from './ServiceSidebar';
import { ServicesCategoryList } from './ServicesCategoryList';

// Componenti Modali (Percorso Corretto: ../ risale a src/components/modals/)
import { SuggestionModal } from '../SuggestionModal';

interface Props {
    city: CityDetails;
    onAddToItinerary: (poi: PointOfInterest) => void;
    isMobile: boolean;
    setMobileView: (view: 'menu' | 'content') => void;
    mobileView?: 'menu' | 'content'; 
    initialCategory?: string;
    user?: User;
    onOpenAuth?: () => void;
}

export const CityServicesTab = ({ 
    city, onAddToItinerary, isMobile, setMobileView, mobileView, initialCategory, user, onOpenAuth 
}: Props) => {
    const { itinerary } = useItinerary();
    
    // STATES
    // Default alla prima categoria disponibile (Aeroporto)
    const [activeServiceCategory, setActiveServiceCategory] = useState<string>(SERVICES_CATEGORIES[0]?.id || 'airport'); 
    const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
    const [servicesList, setServicesList] = useState<any[]>(city.details.services || []);
    
    // SUGGESTION MODAL STATE
    const [suggestionModal, setSuggestionModal] = useState<{ 
        isOpen: boolean; 
        type: SuggestionType; 
        prefilledName?: string 
    }>({ isOpen: false, type: 'new_place' });

    // SYNC with city details
    useEffect(() => {
        setServicesList(city.details.services || []);
    }, [city.details.services]);

    // Force selection if initialCategory is passed
    useEffect(() => {
        if (initialCategory) {
            setActiveServiceCategory(initialCategory);
            if (isMobile) setMobileView('content');
        }
    }, [initialCategory, isMobile, setMobileView]);

    const isItemInItinerary = (id: string) => itinerary.items.some(i => i.poi.id === id);

    // CALCOLO SERVIZI FILTRATI (Per la lista e per il modale di segnalazione)
    const filteredServices = useMemo(() => {
        return servicesList.filter(s => {
            if (activeServiceCategory === 'other') {
                // Filtro anti-musei: escludi se il nome contiene parole chiave culturali
                // Questo è un fix frontend per dati sporchi nel DB
                const nameLower = s.name.toLowerCase();
                if (nameLower.includes('museo') || nameLower.includes('museum') || nameLower.includes('scavi') || nameLower.includes('parco archeologico') || nameLower.includes('chiesa') || nameLower.includes('santuario')) {
                    return false; 
                }

                return !['tour_operator', 'airport', 'train', 'bus', 'taxi', 'maritime', 'emergency', 'pharmacy', 'hospital', 'police', 'fire'].includes(s.type);
            }
            if (activeServiceCategory === 'emergency') {
                return ['emergency', 'hospital', 'police', 'fire'].includes(s.type);
            }
            if (activeServiceCategory === 'tour_operator') {
                return s.type === 'tour_operator' || s.type === 'agency';
            }
            return s.type === activeServiceCategory;
        });
    }, [servicesList, activeServiceCategory]);

    // Mappatura servizi in POI per il SuggestionModal (che si aspetta PointOfInterest[])
    const currentCategoryPois = useMemo(() => {
        return filteredServices.map(s => ({
            id: s.id || `temp-${s.name}`,
            name: s.name,
            category: 'discovery', // Dummy category
            description: s.description || '',
            imageUrl: '',
            coords: { lat: 0, lng: 0 },
            rating: 0,
            votes: 0,
            address: s.address
        } as PointOfInterest));
    }, [filteredServices]);

    // --- ACTIONS ---

    const handleCategoryChange = (id: string) => {
        setActiveServiceCategory(id);
        setExpandedServiceId(null);
        setMobileView('content');
    };

    const handleAddToItineraryWrapper = (e: React.MouseEvent, service: CityService) => {
        e.stopPropagation();
        const activeCatInfo = SERVICES_CATEGORIES.find(c => c.id === activeServiceCategory);
        
        // CLEANUP: Usa stringa vuota o placeholder dalla cache, NO HARDCODED URL
        const placeholder = getCachedPlaceholder('service') || '';

        const poi: PointOfInterest = {
            id: service.id || `svc-${Date.now()}-${Math.random()}`,
            name: service.name,
            category: 'discovery',
            description: `Servizio: ${service.category || activeCatInfo?.label} - ${service.description || ''}`,
            imageUrl: placeholder, 
            coords: { lat: 0, lng: 0 },
            address: service.address || service.contact,
            rating: 0,
            votes: 0,
            
            // IMPORTANT: Identifica come risorsa
            resourceType: 'service',
            contactInfo: {
                phone: service.contact,
                website: service.url
            }
        };
        onAddToItinerary(poi);
    };

    // --- SUGGESTION HANDLERS ---
    
    const handleOpenSuggestion = (type: SuggestionType, prefilledName?: string) => {
        // Controllo robusto: Se utente manca o è guest, apri auth
        if (!user || user.role === 'guest') {
            if (onOpenAuth) {
                onOpenAuth();
            } else {
                console.warn("Auth handler missing in CityServicesTab");
                alert("Devi effettuare il login per contribuire.");
            }
            return;
        }
        setSuggestionModal({ isOpen: true, type, prefilledName });
    };

    return (
        <>
            {/* SIDEBAR (NAVIGAZIONE) */}
            <div className={`md:w-80 border-r border-slate-800 bg-[#0b0f1a] flex flex-col shrink-0 absolute md:relative inset-0 z-20 md:z-0 transition-transform duration-300 ${isMobile && mobileView === 'content' ? '-translate-x-full' : 'translate-x-0'}`}>
                <ServiceSidebar 
                    activeServiceCategory={activeServiceCategory} 
                    onCategoryChange={handleCategoryChange}
                />
            </div>
            
            {/* CONTENT AREA */}
            <div className={`flex-1 bg-[#020617] flex flex-col min-w-0 absolute md:relative inset-0 z-10 md:z-0 transition-transform duration-300 ${isMobile && mobileView !== 'content' ? 'translate-x-full' : 'translate-x-0'}`}>
                <div className="flex-1 md:overflow-hidden relative h-auto md:h-full">
                    {/* Mobile: h-auto overflow-visible for natural scrolling */}
                    <div className="md:h-full h-auto md:overflow-y-auto overflow-visible custom-scrollbar p-6 md:p-10 animate-in fade-in bg-[#020617]">
                        
                        {/* LISTA SERVIZI */}
                        <ServicesCategoryList 
                            servicesList={filteredServices} 
                            activeServiceCategory={activeServiceCategory}
                            expandedServiceId={expandedServiceId}
                            onToggleExpand={(id) => setExpandedServiceId(expandedServiceId === id ? null : id)}
                            isItemInItinerary={isItemInItinerary}
                            onAddToItinerary={handleAddToItineraryWrapper}
                            onOpenSuggestion={handleOpenSuggestion}
                        />
                    </div>
                </div>
            </div>

            {/* MODALE DI SEGNALAZIONE */}
            {suggestionModal.isOpen && user && (
                <SuggestionModal 
                    isOpen={true} 
                    onClose={() => setSuggestionModal({ ...suggestionModal, isOpen: false })} 
                    cityId={city.id} 
                    cityName={city.name} 
                    user={user} 
                    onOpenAuth={onOpenAuth} 
                    initialType={suggestionModal.type} 
                    prefilledName={suggestionModal.prefilledName} 
                    // Passiamo SOLO i servizi della categoria corrente convertiti in POI
                    // Così il dropdown mostrerà solo "Linea 1" se siamo in Metro, ecc.
                    existingPois={currentCategoryPois} 
                    isServiceContext={true} // Cambia le label in "Nuovo Servizio" ecc.
                />
            )}
        </>
    );
};
