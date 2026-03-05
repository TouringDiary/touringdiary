
import React, { useState, useEffect, useMemo } from 'react';
import { Map, MessageSquare, Trash2, CheckCircle, XCircle, Award, Users, LayoutList, AlertTriangle, Loader2, X } from 'lucide-react';
import { getAllPremadeItinerariesAsync, getFilteredCommunityItinerariesAsync, getUnifiedReviews, updateUnifiedReviewStatus, deletePremadeItinerary, deleteItineraryReview, ItineraryFilters } from '../../services/communityService';
import { getFullManifestAsync } from '../../services/cityService';
import { Review, PremadeItinerary, CitySummary } from '../../types/index';
import { StarRating } from '../common/StarRating';
import { AdminItineraryEditor } from './AdminItineraryEditor';
import { SponsorFilters } from './SponsorFilters';
import { addNotification } from '../../services/notificationService';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { useAdminStyles } from '../../hooks/useAdminStyles'; // IMPORTATO STYLES

const ReviewDetailOverlay = ({ review, onClose }: { review: Review, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
             <div className="relative bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl p-8 flex flex-col gap-6 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5"/>
                </button>
                <div className="flex items-center gap-4">
                     <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center font-bold text-2xl text-slate-400 shadow-lg">{review.author.charAt(0)}</div>
                    <div>
                        <h3 className="text-2xl font-bold text-white">{review.author}</h3>
                        <p className="text-slate-500 text-sm">Recensore Community</p>
                    </div>
                </div>
                <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{review.itineraryId ? 'ITINERARIO' : 'POI / LUOGO'}</span>
                        <StarRating value={review.rating} size="w-4 h-4"/>
                     </div>
                     <h4 className="text-lg font-bold text-white mb-1">{review.poiName || review.itineraryId}</h4>
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                     <p className="text-slate-300 italic text-lg leading-relaxed">"{review.text}"</p>
                </div>
                {/* SHOW DETAILED CRITERIA IN MODAL TOO */}
                {review.criteria && (
                    <div className="grid grid-cols-3 gap-2 border-t border-slate-800 pt-4 mt-2">
                        {Object.entries(review.criteria).map(([key, val]) => (
                            <div key={key} className="text-center bg-slate-800 p-2 rounded-lg">
                                <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1 truncate">{key}</span>
                                <span className="text-amber-500 font-bold">{val}</span>
                            </div>
                        ))}
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-xs border-t border-slate-800 pt-4 mt-2">
                     <div><span className="text-slate-500 uppercase font-bold block mb-1">Ricevuta il</span><span className="text-white font-mono">{new Date(review.date).toLocaleString()}</span></div>
                     <div className="text-right">
                        <span className="text-slate-500 uppercase font-bold block mb-1">Status</span>
                        <span className={`font-bold uppercase ${review.status === 'approved' ? 'text-emerald-500' : review.status === 'rejected' ? 'text-red-500' : 'text-amber-500'}`}>
                            {review.status}
                        </span>
                     </div>
                </div>
                <div className="pt-2"><button onClick={onClose} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase tracking-widest transition-colors">Chiudi</button></div>
             </div>
        </div>
    );
};

export const ItineraryManager = () => {
    const [mainView, setMainView] = useState<'itineraries' | 'reviews'>('itineraries');
    const [itineraryStatus, setItineraryStatus] = useState<'published' | 'draft'>('published');
    const [reviewStatus, setReviewStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [reviews, setReviews] = useState<Review[]>([]);
    const [itineraries, setItineraries] = useState<PremadeItinerary[]>([]);
    const [manifest, setManifest] = useState<CitySummary[]>([]);
    const [editingItineraryId, setEditingItineraryId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: 'itinerary' | 'review', name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [filterContinent, setFilterContinent] = useState('');
    const [filterNation, setFilterNation] = useState('');
    const [filterAdminRegion, setFilterAdminRegion] = useState('');
    const [filterZone, setFilterZone] = useState('');
    const [filterCity, setFilterCity] = useState('');
    const [reviewSearch, setReviewSearch] = useState('');
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    
    const { styles } = useAdminStyles(); // STILI DINAMICI

    const [allOptions, setAllOptions] = useState<PremadeItinerary[]>([]);

    useEffect(() => { 
        refreshData(); 
        if (allOptions.length === 0) {
            getAllPremadeItinerariesAsync().then(setAllOptions);
        }
    }, [editingItineraryId, filterContinent, filterNation, filterAdminRegion, filterZone, filterCity, itineraryStatus]); 

    const refreshData = async () => {
        setIsInitialLoading(true);
        
        const filters: ItineraryFilters = {};
        if (filterContinent) filters.continent = filterContinent;
        if (filterNation) filters.nation = filterNation;
        if (filterAdminRegion) filters.region = filterAdminRegion;
        if (filterZone) filters.zone = filterZone;
        if (filterCity) filters.mainCity = filterCity;
        
        const data = await getFilteredCommunityItinerariesAsync(filters);
        
        // Client-side filtering for status
        const finalData = data.filter(it => it.status === itineraryStatus);
        
        setItineraries(finalData);
        const allReviews = await getUnifiedReviews();
        setReviews(allReviews.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        getFullManifestAsync().then(setManifest);
        setIsInitialLoading(false);
    };

    const handleEdit = (id: string) => setEditingItineraryId(id);
    const handleDeleteRequest = (id: string, type: 'itinerary' | 'review', name: string) => setDeleteTarget({ id, type, name });

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            if (deleteTarget.type === 'itinerary') await deletePremadeItinerary(deleteTarget.id);
            else await deleteItineraryReview(deleteTarget.id);
            refreshData(); setDeleteTarget(null); setSelectedReview(null);
        } catch (e) { alert("Errore cancellazione."); } finally { setIsDeleting(false); }
    };

    const handleContinentChange = (val: string) => { setFilterContinent(val); setFilterNation(''); setFilterAdminRegion(''); setFilterZone(''); setFilterCity(''); };
    const handleNationChange = (val: string) => { setFilterNation(val); setFilterAdminRegion('Campania'); setFilterZone(''); setFilterCity(''); };
    const handleAdminRegionChange = (val: string) => { setFilterAdminRegion(val); setFilterZone(''); setFilterCity(''); };
    const handleZoneChange = (val: string) => { setFilterZone(val); setFilterCity(''); };
    const handleCityChange = (val: string) => setFilterCity(val);

    const filterOptions = useMemo(() => {
        let list = allOptions;
        const continents = Array.from(new Set(list.map(c => c.continent || 'Europa'))).sort();
        if (filterContinent) list = list.filter(c => (c.continent || 'Europa') === filterContinent);
        const nations = Array.from(new Set(list.map(c => c.nation || 'Italia'))).sort();
        if (filterNation) list = list.filter(c => (c.nation || 'Italia') === filterNation);
        const adminRegions = Array.from(new Set(list.map(c => c.region || 'Campania'))).sort();
        if (filterAdminRegion) list = list.filter(c => (c.region || 'Campania') === filterAdminRegion);
        const zones = Array.from(new Set(list.map(c => c.zone))).sort();
        if (filterZone) list = list.filter(c => c.zone === filterZone);
        
        // We need to map this back to CitySummary format for the SponsorFilters component
        // which expects { name: string } for cities.
        const uniqueCityNames = Array.from(new Set(list.map(c => c.mainCity))).sort();
        const cities = uniqueCityNames.map(name => ({ name } as CitySummary));
        
        return { continents, nations, adminRegions, zones, cities };
    }, [allOptions, filterContinent, filterNation, filterAdminRegion, filterZone]);

    const displayedReviews = useMemo(() => {
        let filtered = reviews;
        if (reviewStatus !== 'all') filtered = filtered.filter(r => r.status === reviewStatus);
        if (reviewSearch.trim()) {
            const lower = reviewSearch.toLowerCase();
            filtered = filtered.filter(r => r.author.toLowerCase().includes(lower) || (r.poiName && r.poiName.toLowerCase().includes(lower)) || r.text.toLowerCase().includes(lower));
        }
        if (filterCity) filtered = filtered.filter(r => r.cityId === filterCity);
        return filtered;
    }, [reviews, reviewStatus, reviewSearch, filterCity]);

    const displayedItineraries = itineraries;

    const handleReviewAction = async (e: React.MouseEvent, review: Review, status: 'approved' | 'rejected') => {
        e.stopPropagation();
        await updateUnifiedReviewStatus(review.id, status);
        if (status === 'approved' && review.authorId) {
            // LOGICA AUTOMATICA XP:
            // 10 XP base per il voto.
            // 20 XP (totali) se la recensione ha testo valido (> 10 parole).
            const wordCount = review.text ? review.text.split(/\s+/).length : 0;
            const xpAmount = wordCount >= 10 ? 20 : 10;
            
            addNotification(
                review.authorId, 
                'reward_unlocked', 
                'Recensione Approvata!', 
                `La tua recensione su ${review.poiName || 'luogo'} è stata pubblicata. Hai guadagnato +${xpAmount} XP!`, 
                { section: 'community' }
            );
        }
        refreshData();
    };

    const pendingReviewsCount = reviews.filter(r => r.status === 'pending').length;

    if (editingItineraryId) return <AdminItineraryEditor itineraryId={editingItineraryId} onBack={() => setEditingItineraryId(null)} />;

    return (
        <div className="space-y-4 flex flex-col h-full animate-in fade-in relative">
            {selectedReview && <ReviewDetailOverlay review={selectedReview} onClose={() => setSelectedReview(null)} />}
            {deleteTarget && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-red-500/50 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative animate-in zoom-in-95">
                        <div className="flex flex-col items-center text-center gap-4">
                            <AlertTriangle className="w-12 h-12 text-red-500 animate-pulse"/>
                            <h3 className="text-xl font-bold text-white mb-2 font-display">Eliminare Definitivamente?</h3>
                            <p className="text-sm text-slate-300 leading-relaxed">Stai per cancellare: <br/><strong className="text-white">"{deleteTarget.name}"</strong>.</p>
                            <div className="flex gap-3 w-full mt-2">
                                <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors">Annulla</button>
                                <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2">{isDeleting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>} Elimina</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* HEADER CLEAN DESIGN */}
            <div className="flex justify-between items-center mb-2 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-600 rounded-xl shadow-lg"><Map className="w-8 h-8 text-white" /></div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className={styles.admin_page_title}>Itinerari & Recensioni</h2>
                             {pendingReviewsCount > 0 && (
                                <span className="bg-rose-600 text-white text-xs font-black px-2 py-1 rounded-full shadow-lg animate-pulse">
                                    {pendingReviewsCount} IN ATTESA
                                </span>
                            )}
                        </div>
                        <p className={styles.admin_page_subtitle}>Moderazione contenuti community</p>
                    </div>
                </div>
            </div>

            <div className="shrink-0 overflow-x-auto"><SponsorFilters filters={{ continent: filterContinent, nation: filterNation, adminRegion: filterAdminRegion, zone: filterZone, city: filterCity }} options={filterOptions} handlers={{ onContinentChange: handleContinentChange, onNationChange: handleNationChange, onAdminRegionChange: handleAdminRegionChange, onZoneChange: handleZoneChange, onCityChange: handleCityChange }} /></div>
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
                <button onClick={() => setMainView('itineraries')} className={`flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-3 transition-all ${mainView === 'itineraries' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}><LayoutList className="w-4 h-4"/> ITINERARI</button>
                <button onClick={() => setMainView('reviews')} className={`flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-3 transition-all ${mainView === 'reviews' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}>
                    <MessageSquare className="w-4 h-4"/> RECENSIONI
                     {pendingReviewsCount > 0 && <span className="bg-white text-black text-[10px] px-1.5 py-0.5 rounded-full">{pendingReviewsCount}</span>}
                </button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl">
                {isInitialLoading ? (
                    <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500"/></div>
                ) : mainView === 'itineraries' ? (
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {displayedItineraries.map(it => (
                                <div key={it.id} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden group hover:border-slate-600 transition-all shadow-lg flex flex-col h-full relative">
                                    <div className="h-48 relative shrink-0">
                                        <ImageWithFallback src={it.coverImage} alt={it.title} className="w-full h-full object-cover"/>
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                                    </div>
                                    <div className="p-5 flex flex-col flex-1">
                                        <h4 className="font-bold text-white text-xl leading-tight mb-2 line-clamp-2">{it.title}</h4>
                                        <div className="flex justify-between items-center pt-4 border-t border-slate-800 mt-auto"><button onClick={() => handleEdit(it.id)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold text-xs uppercase border border-slate-700">Modifica</button></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[1000px] table-fixed">
                            <thead className="sticky top-0 z-20 bg-[#0f172a] shadow-sm">
                                <tr className="text-slate-400 text-[10px] uppercase tracking-wider font-bold border-b border-slate-800">
                                    <th className="px-4 py-3 w-32 whitespace-nowrap">Autore</th>
                                    <th className="px-4 py-3 w-40 whitespace-nowrap">Oggetto</th>
                                    <th className="px-4 py-3">Snippet</th>
                                    
                                    {/* NUOVE COLONNE SPECIFICHE COMPATTE */}
                                    <th className="px-2 py-3 w-20 text-center text-[9px]">Interesse</th>
                                    <th className="px-2 py-3 w-20 text-center text-[9px]">Manutenz.</th>
                                    <th className="px-2 py-3 w-20 text-center text-[9px]">Accessib.</th>
                                    
                                    <th className="px-4 py-3 w-24 whitespace-nowrap text-center">Ricevuta</th>
                                    <th className="px-4 py-3 w-24 whitespace-nowrap text-center">Status</th>
                                    <th className="px-4 py-3 w-28 whitespace-nowrap text-right">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 bg-slate-900">
                                {displayedReviews.map(review => {
                                    // Map dynamic keys to the 3 columns (fallback logic if names vary)
                                    // Assuming DB structure uses standardized keys or we map them here
                                    const interest = review.criteria?.interest || review.criteria?.food || 0;
                                    const maint = review.criteria?.maintenance || review.criteria?.service || 0;
                                    const access = review.criteria?.access || review.criteria?.atmosphere || 0;

                                    return (
                                        <tr key={review.id} onClick={() => setSelectedReview(review)} className="hover:bg-slate-800/40 transition-colors cursor-pointer group">
                                            <td className="px-4 py-3 font-bold text-white text-sm truncate">{review.author}</td>
                                            <td className="px-4 py-3 font-bold text-white text-sm truncate">{review.poiName || 'Itinerario'}</td>
                                            <td className="px-4 py-3"><p className="text-xs text-slate-400 italic truncate max-w-xs">"{review.text}"</p></td>
                                            
                                            {/* SPECIFIC CRITERIA COLUMNS */}
                                            <td className="px-2 py-3 text-center font-bold text-amber-500 text-xs">{interest > 0 ? interest : '-'}</td>
                                            <td className="px-2 py-3 text-center font-bold text-blue-400 text-xs">{maint > 0 ? maint : '-'}</td>
                                            <td className="px-2 py-3 text-center font-bold text-emerald-400 text-xs">{access > 0 ? access : '-'}</td>
                                            
                                            <td className="px-4 py-3 text-center font-mono text-[10px] text-slate-500">{new Date(review.date).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${review.status === 'approved' ? 'bg-emerald-900/20 text-emerald-500 border-emerald-500/30' : review.status === 'rejected' ? 'bg-red-900/20 text-red-500 border-red-500/30' : 'bg-amber-900/20 text-amber-500 border-amber-500/30'}`}>{review.status}</span></td>
                                            <td className="px-4 py-3 text-right"><div className="flex gap-1 justify-end opacity-60 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>{review.status === 'pending' && (<><button onClick={(e) => handleReviewAction(e, review, 'approved')} className="p-1.5 hover:bg-emerald-900/30 rounded text-emerald-500"><CheckCircle className="w-4 h-4"/></button><button onClick={(e) => handleReviewAction(e, review, 'rejected')} className="p-1.5 hover:bg-red-900/30 rounded text-red-500"><XCircle className="w-4 h-4"/></button></>)}<button onClick={(e) => { e.stopPropagation(); handleDeleteRequest(review.id, 'review', `Recensione di ${review.author}`); }} className="p-1.5 hover:bg-red-900/20 rounded text-slate-500 hover:text-red-500 ml-1"><Trash2 className="w-4 h-4"/></button></div></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
