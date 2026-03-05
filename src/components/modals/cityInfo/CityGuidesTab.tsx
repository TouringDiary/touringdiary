
import React, { useState, useEffect } from 'react';
import { User, ChevronRight, Phone, Mail, Check, Plus, MessageSquare, PenTool, Bot, ShieldCheck, Flag } from 'lucide-react';
import { CityDetails, User as UserType, PointOfInterest } from '../../../types/index';
import { getActiveGuideSponsors } from '../../../services/sponsorService';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { StarRating } from '../../common/StarRating';
import { ReviewModal } from '../ReviewModal';
import { useItinerary } from '../../../context/ItineraryContext';

interface Props {
    city: CityDetails;
    onAddToItinerary: (poi: PointOfInterest) => void;
    user?: UserType;
    onOpenAuth?: () => void;
    isMobile: boolean;
    setMobileView: (view: 'menu' | 'content') => void;
    mobileView?: 'menu' | 'content'; 
    onSuggestEdit?: (name: string) => void; 
}

export const CityGuidesTab = ({ city, onAddToItinerary, user, onOpenAuth, isMobile, setMobileView, mobileView, onSuggestEdit }: Props) => {
    const { itinerary } = useItinerary();
    const [selectedGuide, setSelectedGuide] = useState<any>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [localReviews, setLocalReviews] = useState<any[]>([]);

    const getGuidesList = () => {
        const activeSponsors = getActiveGuideSponsors(city.id);
        const staticGuides = city.details.guides || [];
        return [...activeSponsors, ...staticGuides];
    };

    const guidesList = getGuidesList();

    // Auto-select first guide ONLY on desktop
    useEffect(() => {
        const isDesktop = window.innerWidth >= 768;
        if (isDesktop && guidesList.length > 0 && !selectedGuide) {
            setSelectedGuide(guidesList[0]);
        }
    }, []);

    const isItemInItinerary = (id: string) => itinerary.items.some(i => i.poi.id === id);

    const handleWriteReview = () => {
        if (!user || user.role === 'guest') {
            if (onOpenAuth) onOpenAuth();
            return;
        }
        setShowReviewModal(true);
    };

    const handleSubmitReview = (rating: number, criteria: any, text: string) => {
        if (!user) return;
        const newReview = {
            id: `new_${Date.now()}`,
            author: user.name,
            rating: rating,
            text: text,
            date: new Date().toISOString()
        };
        setLocalReviews(prev => [newReview, ...prev]);
        setShowReviewModal(false);
    };

    const renderGuideDetail = (guide: any) => {
        if (!guide) return <div className="h-full flex items-center justify-center text-slate-600 italic">Seleziona una guida</div>;
        
        const isAi = guide.id === 'guide-official-ai' || guide.name === 'Assistente Digitale Ufficiale';
        const reviews = [...localReviews, ...(guide.reviews || [])];
        const isAdded = isItemInItinerary(guide.id);

        const handleAddGuide = () => {
            const poi: PointOfInterest = {
                id: guide.id,
                name: guide.name,
                category: 'discovery',
                description: `Guida Turistica Ufficiale. ${guide.phone ? 'Tel: ' + guide.phone : ''}. Lingue: ${guide.languages?.join(', ') || 'IT'}.`,
                imageUrl: guide.imageUrl || '', // Lasciare vuoto per attivare placeholder
                coords: { lat: 0, lng: 0 },
                rating: guide.rating || 5,
                votes: reviews.length,
                address: guide.email || guide.website || 'Contatto Diretto',
                
                // IMPORTANT: Identifica come risorsa
                resourceType: 'guide',
                contactInfo: {
                    phone: guide.phone,
                    email: guide.email,
                    website: guide.website
                }
            };
            onAddToItinerary(poi);
        };

        return (
            <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-10 animate-in fade-in bg-[#020617] flex flex-col">
                <div className="flex flex-col md:flex-row gap-8 mb-10">
                    <div className="w-32 h-32 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-slate-800 shadow-2xl shrink-0 mx-auto md:mx-0 bg-slate-900">
                        {isAi ? (
                            <div className="w-full h-full bg-indigo-600 flex items-center justify-center"><Bot className="w-24 h-24 text-white animate-pulse"/></div>
                        ) : (
                            <ImageWithFallback 
                                src={guide.imageUrl} 
                                className="w-full h-full object-cover" 
                                alt={guide.name} 
                                category="guide" 
                            />
                        )}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3 justify-center md:justify-start">
                            <h2 className="text-3xl md:text-4xl font-display font-bold text-white">{guide.name}</h2>
                            {guide.isOfficial && <span className="bg-indigo-900/50 text-indigo-300 border border-indigo-500/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest w-fit mx-auto md:mx-0">Ufficiale</span>}
                        </div>
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-8">
                            <StarRating value={guide.rating || 5} size="w-5 h-5"/>
                            <span className="text-base font-bold text-slate-400">({reviews.length} recensioni)</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Lingue Parlate</h4>
                                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                    {(guide.languages || []).map((l: string) => <span key={l} className="bg-slate-950 text-slate-300 px-3 py-1.5 rounded-lg text-sm font-mono border border-slate-800">{l}</span>)}
                                </div>
                            </div>
                             <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Specialità</h4>
                                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                    {(guide.specialties || []).map((s: string) => <span key={s} className="bg-indigo-900/30 text-indigo-300 px-3 py-1.5 rounded-lg text-sm border border-indigo-500/20">{s}</span>)}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-6 justify-center md:justify-start">
                            {guide.phone && <a href={`tel:${guide.phone}`} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold uppercase text-sm tracking-wide shadow-lg transition-all active:scale-95">
                                <Phone className="w-5 h-5"/> Chiama
                            </a>}
                            {guide.email && <a href={`mailto:${guide.email}`} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold uppercase text-sm tracking-wide border border-slate-700 transition-all active:scale-95">
                                <Mail className="w-5 h-5"/> Email
                            </a>}
                            <button 
                                onClick={handleAddGuide}
                                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold uppercase text-sm tracking-wide border transition-all active:scale-95 shadow-lg ${isAdded ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-amber-600 hover:bg-amber-500 border-amber-500 text-white'}`}
                            >
                                {isAdded ? <Check className="w-5 h-5"/> : <Plus className="w-5 h-5"/>} {isAdded ? 'AGGIUNTO' : 'AGGIUNGI'}
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="border-t border-slate-800 pt-10 mb-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3"><MessageSquare className="w-6 h-6 text-amber-500"/> Dicono di {guide.name}</h3>
                        <button onClick={handleWriteReview} className="flex items-center gap-2 text-xs font-bold uppercase text-indigo-400 hover:text-white transition-colors bg-slate-900 px-6 py-3 rounded-xl border border-slate-800 hover:border-indigo-500 shadow-md">
                            <PenTool className="w-4 h-4"/> Scrivi Recensione
                        </button>
                    </div>
                    <div className="space-y-4">
                        {reviews.length > 0 ? reviews.map((rev: any, idx: number) => (
                            <div key={idx} className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-slate-400">{rev.author.charAt(0)}</div>
                                        <span className="font-bold text-slate-200 text-base">{rev.author}</span>
                                    </div>
                                    <StarRating value={rev.rating} size="w-3.5 h-3.5"/>
                                </div>
                                <p className="text-slate-400 text-sm italic leading-relaxed">"{rev.text}"</p>
                            </div>
                        )) : <div className="text-center py-16 text-slate-500 italic bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">Nessuna recensione ancora. Sii il primo!</div>}
                    </div>
                </div>

                {/* LEGAL DISCLAIMER FOOTER */}
                <div className="mt-auto pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500">
                    <div className="text-[10px] max-w-sm flex items-start gap-2 leading-snug">
                        <ShieldCheck className="w-4 h-4 shrink-0 opacity-50"/>
                        <p>
                            Scheda professionale creata tramite dati pubblici e contributi della community. 
                            Touring Diary non è affiliato con questa guida se non indicato come Partner Ufficiale.
                        </p>
                    </div>
                    
                    {!guide.isSponsored && onSuggestEdit && (
                        <button 
                            onClick={() => onSuggestEdit(guide.name)}
                            className="flex items-center gap-2 text-[10px] font-bold uppercase text-indigo-400 hover:text-white transition-colors border border-indigo-500/30 px-3 py-1.5 rounded-lg hover:bg-indigo-900/20"
                        >
                            <Flag className="w-3 h-3"/> Sei tu? Rivendica Profilo
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            <div className={`md:w-80 border-r border-slate-800 bg-[#0b0f1a] flex flex-col shrink-0 absolute md:relative inset-0 z-20 md:z-0 transition-transform duration-300 ${isMobile && mobileView === 'content' ? '-translate-x-full' : 'translate-x-0'}`}>
                <div className="h-full flex flex-col">
                     <div className="p-6 border-b border-slate-800 text-xs font-black uppercase tracking-widest text-slate-500">Guide Disponibili</div>
                     <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                        {guidesList.map(guide => (
                            <button 
                                key={guide.id}
                                onClick={() => { setSelectedGuide(guide); setMobileView('content'); }}
                                className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all ${selectedGuide?.id === guide.id ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
                            >
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0 bg-slate-900 flex items-center justify-center">
                                    {guide.id === 'guide-official-ai' ? <Bot className="w-6 h-6 text-indigo-400"/> : (
                                        <ImageWithFallback 
                                            src={guide.imageUrl} 
                                            className="w-full h-full object-cover" 
                                            alt={guide.name} 
                                            category="guide" 
                                        />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-sm truncate">{guide.name}</div>
                                    <div className={`text-[10px] uppercase font-bold truncate ${selectedGuide?.id === guide.id ? 'text-indigo-200' : 'text-slate-600'}`}>
                                        {guide.isOfficial ? 'Certificata' : 'Locale'}
                                    </div>
                                </div>
                                <ChevronRight className={`w-5 h-5 ml-auto opacity-50 ${selectedGuide?.id === guide.id ? 'text-white' : ''}`}/>
                            </button>
                        ))}
                    </div>
                 </div>
            </div>

            <div className={`flex-1 bg-[#020617] flex flex-col min-w-0 absolute md:relative inset-0 z-10 md:z-0 transition-transform duration-300 ${isMobile && mobileView !== 'content' ? 'translate-x-full' : 'translate-x-0'}`}>
                <div className="flex-1 overflow-hidden relative">
                    {renderGuideDetail(selectedGuide)}
                </div>
            </div>

            {showReviewModal && selectedGuide && (
                <ReviewModal 
                    isOpen={true} 
                    onClose={() => setShowReviewModal(false)} 
                    poi={{ id: selectedGuide.id, name: selectedGuide.name, category: 'monument', description: '', imageUrl: '', rating: selectedGuide.rating || 0, votes: 0, coords: {lat:0, lng:0}, address: '' }} 
                    onSubmit={handleSubmitReview} 
                />
            )}
        </>
    );
};
