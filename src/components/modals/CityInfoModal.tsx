
import React, { useState, useEffect } from 'react';
import { User, Building2, Calendar, Info, ArrowLeft, Bus } from 'lucide-react';
import { CityDetails, User as UserType, PointOfInterest } from '../../types/index';
import { CityGuidesTab } from './cityInfo/CityGuidesTab';
import { CityServicesTab } from './cityInfo/CityServicesTab';
import { CityEventsTab } from './cityInfo/CityEventsTab';
import { CityTourOperatorsTab } from './cityInfo/CityTourOperatorsTab';
import { CloseButton } from '../common/CloseButton';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    city: CityDetails;
    initialTab: 'guides' | 'services' | 'events' | 'tour_operators';
    onAddToItinerary: (poi: PointOfInterest) => void;
    user?: UserType;
    onOpenAuth?: () => void;
    onSuggestEdit?: (name: string) => void; 
}

export const CityInfoModal = ({ isOpen, onClose, city, initialTab, user, onOpenAuth, onAddToItinerary, onSuggestEdit }: Props) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileView, setMobileView] = useState<'menu' | 'content'>('menu');

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
            setMobileView('menu');
        }
    }, [isOpen, initialTab]);

    // WRAPPER PER CHIUDERE IL MODALE SU AGGIUNTA
    const handleAddToItineraryAndClose = (poi: PointOfInterest) => {
        onAddToItinerary(poi);
        onClose();
    };

    const renderHeader = () => {
        let title = '';
        let Icon = Info;
        let colorClass = 'text-slate-500';

        switch (activeTab) {
            case 'guides':
                title = 'GUIDE TURISTICHE';
                Icon = User;
                colorClass = 'text-amber-500';
                break;
            case 'services':
                title = 'SERVIZI ESSENZIALI';
                Icon = Building2;
                colorClass = 'text-blue-500';
                break;
            case 'events':
                title = 'EVENTI LOCALI';
                Icon = Calendar;
                colorClass = 'text-rose-500';
                break;
            case 'tour_operators':
                title = 'TOUR OPERATOR';
                Icon = Bus;
                colorClass = 'text-cyan-500';
                break;
        }

        return (
            <div className="flex items-center justify-between px-6 py-5 bg-[#0f172a] border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                     {/* MOBILE BACK BUTTON (Visible only in content view on mobile) */}
                    {isMobile && mobileView === 'content' && (
                        <button onClick={() => setMobileView('menu')} className="p-2 bg-slate-800 rounded-lg text-white mr-2">
                            <ArrowLeft className="w-5 h-5"/>
                        </button>
                    )}
                    
                    <div className={`p-2 bg-slate-900 rounded-xl border border-slate-800 ${colorClass}`}>
                         <Icon className="w-6 h-6"/>
                    </div>
                    <div>
                        <h2 className="text-lg md:text-xl font-display font-bold text-white uppercase tracking-wide leading-none">
                            {title}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                            {city.name}
                        </p>
                    </div>
                </div>
                <CloseButton onClose={onClose} size="lg" />
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-[#020617] w-full max-w-6xl h-full md:h-[85vh] md:rounded-3xl border-0 md:border border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5">
                
                {renderHeader()}
                
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
                    {activeTab === 'guides' && (
                        <CityGuidesTab 
                            city={city} 
                            onAddToItinerary={handleAddToItineraryAndClose} 
                            user={user} 
                            onOpenAuth={onOpenAuth} 
                            isMobile={isMobile} 
                            setMobileView={setMobileView}
                            mobileView={mobileView} 
                            onSuggestEdit={onSuggestEdit}
                        />
                    )}
                    {activeTab === 'services' && (
                        <CityServicesTab 
                            city={city} 
                            onAddToItinerary={handleAddToItineraryAndClose} 
                            isMobile={isMobile} 
                            setMobileView={setMobileView}
                            mobileView={mobileView}
                            user={user}         
                            onOpenAuth={onOpenAuth} 
                        />
                    )}
                    {activeTab === 'tour_operators' && (
                         <CityTourOperatorsTab
                            city={city}
                            onAddToItinerary={handleAddToItineraryAndClose}
                            user={user}
                            onOpenAuth={onOpenAuth}
                            isMobile={isMobile}
                            setMobileView={setMobileView}
                            mobileView={mobileView}
                            onSuggestEdit={onSuggestEdit}
                         />
                    )}
                    {activeTab === 'events' && (
                        <CityEventsTab 
                            city={city} 
                            onAddToItinerary={handleAddToItineraryAndClose} 
                            isMobile={isMobile} 
                            setMobileView={setMobileView}
                            mobileView={mobileView}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
