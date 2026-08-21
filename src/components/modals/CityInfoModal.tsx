import { ArrowLeft, Building2, Bus, Calendar, Info, User } from 'lucide-react';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_MODAL, Z_OVERLAY } from '@/constants/zIndex';
import { useMobileCompact } from '@/hooks/ui/useMobileCompact';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import type { CityInfoPreviewTab } from '../../types/cityPreview';
import type { CityDetails, PointOfInterest, User as UserType } from '../../types/index';
import { CityEventsTab } from './cityInfo/CityEventsTab';
import { CityGuidesTab } from './cityInfo/CityGuidesTab';
import { CityServicesTab } from './cityInfo/CityServicesTab';
import { CityTourOperatorsTab } from './cityInfo/CityTourOperatorsTab';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  city: CityDetails;
  initialTab: CityInfoPreviewTab;
  onAddToItinerary: (poi: PointOfInterest) => void;
  user?: UserType;
  onOpenAuth?: () => void;
  onSuggestEdit?: (name: string) => void;
}

export const CityInfoModal = ({
  isOpen,
  onClose,
  city,
  initialTab,
  user,
  onOpenAuth,
  onAddToItinerary,
  onSuggestEdit,
}: Props) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  // Same MD threshold as before (`innerWidth < LAYOUT.BREAKPOINTS.MD` ≡ max-width MD-1).
  const isMobile = useMobileCompact();
  const [mobileView, setMobileView] = useState<'menu' | 'content'>('menu');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setMobileView('menu');
    }
  }, [isOpen, initialTab]);

  useGlobalModalEscape(isOpen, onClose);

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
            <button
              type="button"
              onClick={() => setMobileView('menu')}
              aria-label="Torna al menu"
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] bg-slate-800 rounded-lg text-white mr-2"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden />
            </button>
          )}

          <div className={`p-2 bg-slate-900 rounded-xl border border-slate-800 ${colorClass}`}>
            <Icon className="w-6 h-6" />
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
        <CloseButton onClose={onClose} variant="primary" />
      </div>
    );
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="td-modal-overlay bg-black/90 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-5 !p-0 md:!p-4 !items-end md:!items-center"
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
        className="relative bg-[#020617] w-full max-w-6xl h-full md:h-[85vh] md:rounded-3xl border-0 md:border border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 pointer-events-auto"
        style={{ zIndex: Z_MODAL }}
      >
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
    </div>,
    document.body,
  );
};
