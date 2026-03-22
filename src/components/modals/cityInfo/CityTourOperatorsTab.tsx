
import React, { useState, useEffect } from 'react';
import { Bus, ChevronRight, Phone, Mail, Check, Plus, MessageSquare, PenTool, Globe, Star, ShieldCheck, Flag } from 'lucide-react';
import { CityDetails, User as UserType, PointOfInterest } from '@/types/index';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { StarRating } from '../../common/StarRating';
import { ReviewModal } from '../ReviewModal';
import { useItinerary } from '@/context/ItineraryContext';

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

export const CityTourOperatorsTab = ({ city, onAddToItinerary, user, onOpenAuth, isMobile, setMobileView, mobileView, onSuggestEdit }: Props) => {
    const { itinerary } = useItinerary();
    const [selectedOperator, setSelectedOperator] = useState<any>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [localReviews, setLocalReviews] = useState<any[]>([]);

    const getOperatorsList = () => {
        const services = city.details.services || [];
        return services.filter(s => 
            s.type === 'tour_operator' || 
            s.type === 'agency' || 
            s.category?.toLowerCase().includes('tour') || 
            s.category?.toLowerCase().includes('agenzia')
        ).map(s => ({
            ...s,
            rating: 4.8, 
            reviews: [],
            languages: ['IT', 'EN'], 
            specialties: [s.category || 'Tour Organizzati']
        }));
    };

    const operatorsList = getOperatorsList();

    useEffect(() => {
        const isDesktop = window.innerWidth >= 768;
        if (isDesktop && operatorsList.length > 0 && !selectedOperator) {
            setSelectedOperator(operatorsList[0]);
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

    const renderOperatorDetail = (operator: any) => {
        if (!operator) return <div className="h-full flex items-center justify-center text-slate-600 italic">Seleziona un operatore</div>;
        
        const reviews = [...localReviews, ...(operator.reviews || [])];
        const isAdded = operator.id ? isItemInItinerary(operator.id) : false;

        const handleAddOperator = () => {
            const poi: PointOfInterest = {
                id: operator.id || `op-${Date.now()}`,
                name: operator.name,
                category: 'leisure', 
                subCategory: 'agency',
                description: `Tour Operator: ${operator.description || 'Organizzazione viaggi e escursioni.'}`,
                imageUrl: operator.imageUrl,
                coords: { lat: 0, lng: 0 },
                rating: operator.rating || 0,
                votes: reviews.length,
                address: operator.address || operator.contact,
                
                resourceType: 'operator',
                contactInfo: {
                    phone: operator.contact,
                    website: operator.url
                }
            };
            onAddToItinerary(poi);
        };

        return (
            <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-10 animate-in fade-in bg-[#020617] flex flex-col">
                <div className="flex flex-col md:flex-row gap-8 mb-10">
                    <div className="w-32 h-32 md:w-56 md:h-56 rounded-2xl overflow-hidden border-4 border-slate-800 shadow-2xl shrink-0 mx-auto md:mx-0 bg-slate-900 flex items-center justify-center relative group">
                         {/* --- MODIFICA APPLICATA --- */}
                         <ImageWithFallback 
                             src={operator.imageUrl} 
                             className="w-full h-full object-cover" 
                             alt={operator.name} 
                             category={operator.type || 'tour_operator'} // Usa il tipo reale del servizio
                         />
                         <div className="absolute inset-0 bg-indigo-900/20 mix-blend-overlay"></div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3 justify-center md:justify-start">
                            <h2 className="text-3xl md:text-4xl font-display font-bold text-white">{operator.name}</h2>
                            <span className="bg-cyan-900/50 text-cyan-300 border border-cyan-500/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest w-fit mx-auto md:mx-0 flex items-center gap-1">
                                <Bus className="w-3 h-3"/> Agency
                            </span>
                        </div>
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-6">
                            <StarRating value={operator.rating || 5} size="w-5 h-5"/>
                            <span className="text-base font-bold text-slate-400">({reviews.length} feedback)</span>
                        </div>
                        
                        <p className="text-slate-300 text-sm leading-relaxed mb-6 max-w-2xl mx-auto md:mx-0 font-serif italic">
                            "{operator.description || "Specialisti in tour ed esperienze locali indimenticabili."}"
                        </p>

                        <div className="flex flex-wrap gap-4 mt-6 justify-center md:justify-start">
                            {operator.contact && (operator.contact.includes('+') || operator.contact.length > 5) && (
                                <a href={`tel:${operator.contact}`} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-wide border border-slate-700 transition-all active:scale-95">
                                    <Phone className="w-4 h-4"/> Chiama
                                </a>
                            )}
                            {operator.url && (
                                <a href={operator.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-wide border border-slate-700 transition-all active:scale-95">
                                    <Globe className="w-4 h-4"/> Sito Web
                                </a>
                            )}
                            <button 
                                onClick={handleAddOperator}
                                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold uppercase text-xs tracking-wide border transition-all active:scale-95 shadow-lg ${isAdded ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-cyan-600 hover:bg-cyan-500 border-cyan-500 text-white'}`}
                            >
                                {isAdded ? <Check className="w-5 h-5"/> : <Plus className="w-5 h-5"/>} {isAdded ? 'AGGIUNTO' : 'AGGIUNGI'}
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="border-t border-slate-800 pt-10 mb-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3"><MessageSquare className="w-6 h-6 text-cyan-500"/> Esperienze Clienti</h3>
                        <button onClick={handleWriteReview} className="flex items-center gap-2 text-xs font-bold uppercase text-cyan-400 hover:text-white transition-colors bg-slate-900 px-6 py-3 rounded-xl border border-slate-800 hover:border-cyan-500 shadow-md">
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
                        )) : <div className="text-center py-16 text-slate-500 italic bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">Nessuna recensione ancora.</div>}
                    </div>
                </div>

                <div className="mt-auto pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500">
                    <div className="text-[10px] max-w-sm flex items-start gap-2 leading-snug">
                        <ShieldCheck className="w-4 h-4 shrink-0 opacity-50"/>
                        <p>
                            Scheda professionale creata tramite dati pubblici e contributi della community. 
                            Touring Diary non è affiliato con questa attività se non indicato come Partner Ufficiale.
                        </p>
                    </div>
                    
                    {!operator.isSponsored && onSuggestEdit && (
                        <button 
                            onClick={() => onSuggestEdit(operator.name)}
                            className="flex items-center gap-2 text-[10px] font-bold uppercase text-indigo-400 hover:text-white transition-colors border border-indigo-500/30 px-3 py-1.5 rounded-lg hover:bg-indigo-900/20"
                        >
                            <Flag className="w-3 h-3"/> Sei il proprietario? Rivendica
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
                     <div className="p-6 border-b border-slate-800 text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Bus className="w-4 h-4"/> Operatori Disponibili
                     </div>
                     <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                        {operatorsList.length > 0 ? operatorsList.map(op => (
                            <button 
                                key={op.id || op.name}
                                onClick={() => { setSelectedOperator(op); setMobileView('content'); }}
                                className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all ${selectedOperator?.name === op.name ? 'bg-cyan-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
                            >
                                <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-slate-800 flex items-center justify-center">
                                    <Bus className="w-5 h-5"/>
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-sm truncate">{op.name}</div>
                                    <div className={`text-[10px] uppercase font-bold truncate ${selectedOperator?.name === op.name ? 'text-cyan-200' : 'text-slate-600'}`}>
                                        {op.category || 'Agenzia Viaggi'}
                                    </div>
                                </div>
                                <ChevronRight className={`w-5 h-5 ml-auto opacity-50 ${selectedOperator?.name === op.name ? 'text-white' : ''}`}/>
                            </button>
                        )) : (
                            <div className="p-4 text-center text-slate-500 italic text-xs">Nessun Tour Operator in questa città.</div>
                        )}
                    </div>
                 </div>
            </div>

            <div className={`flex-1 bg-[#020617] flex flex-col min-w-0 absolute md:relative inset-0 z-10 md:z-0 transition-transform duration-300 ${isMobile && mobileView !== 'content' ? 'translate-x-full' : 'translate-x-0'}`}>
                <div className="flex-1 overflow-hidden relative">
                    {renderOperatorDetail(selectedOperator)}
                </div>
            </div>

            {showReviewModal && selectedOperator && (
                <ReviewModal 
                    isOpen={true} 
                    onClose={() => setShowReviewModal(false)} 
                    poi={{ id: selectedOperator.id || 'temp', name: selectedOperator.name, category: 'leisure', description: '', imageUrl: '', rating: selectedOperator.rating || 0, votes: 0, coords: {lat:0, lng:0}, address: '' }} 
                    onSubmit={handleSubmitReview} 
                />
            )}
        </>
    );
};
