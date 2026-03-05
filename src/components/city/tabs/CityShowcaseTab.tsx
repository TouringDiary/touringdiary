
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Award, Sparkles, User, MapPin, Utensils, Bed, Waves, Mountain, Droplets, ArrowUpRight, CircleDashed, Plus, Pencil, ShoppingBag, PartyPopper, ChevronRight } from 'lucide-react';
import { PointOfInterest, CityDetails, User as UserType } from '../../../types/index';
// UPDATE: Importa UniversalCard invece delle carte specifiche
import { UniversalCard } from '../ShowcaseCards'; 
import { AdPlaceholder } from '../../common/AdPlaceholder';
import { isPoiNew } from '../../../utils/common';
import { useInteraction } from '../../../context/InteractionContext'; 
import { CategorySponsorColumn } from './CategorySponsorColumn';

type VetrinaSubTab = 'novita' | 'community' | 'natura';

interface Props {
    city: CityDetails;
    visibleAllPois: PointOfInterest[];
    activeSponsors: PointOfInterest[];
    onOpenPoiDetail: (poi: PointOfInterest) => void;
    onAddToItinerary: (poi: PointOfInterest) => void;
    onOpenSponsor: (tier?: 'gold' | 'silver') => void;
    onOpenSuggestion: (type: any) => void; 
    user?: UserType;
    onOpenAuth?: () => void;
    userLocation: { lat: number; lng: number } | null;
}

const getSortedTop5 = (items: PointOfInterest[]) => {
    return items.sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 5);
};

const ensureFiveItems = (items: PointOfInterest[], fallbackSource: PointOfInterest[] = []): (PointOfInterest | null)[] => {
    const sortedItems = getSortedTop5(items);
    let source = sortedItems.length > 0 ? sortedItems : getSortedTop5(fallbackSource);
    
    if (source.length === 0) return [null, null, null, null, null]; 
    
    let result: (PointOfInterest | null)[] = [...source];
    let i = 0;
    while (result.length < 5) {
        const itemToClone = source[i % source.length];
        result.push({ 
            ...itemToClone, 
            id: `${itemToClone.id}_clone_${result.length}` 
        });
        i++;
    }
    return result.slice(0, 5);
};

// CONFIGURAZIONE MENU CATEGORIE
const COMMUNITY_MENU = [
    { id: 'monument', label: 'Destinazioni', icon: MapPin, color: 'text-violet-400' },
    { id: 'food', label: 'Sapori', icon: Utensils, color: 'text-orange-400' },
    { id: 'hotel', label: 'Alloggi', icon: Bed, color: 'text-blue-400' },
    { id: 'shop', label: 'Shopping', icon: ShoppingBag, color: 'text-pink-400' },
    { id: 'leisure', label: 'Svago', icon: PartyPopper, color: 'text-cyan-400' },
];

const NATURE_MENU = [
    { id: 'sea', label: 'Mare / Spiagge', icon: Waves, color: 'text-cyan-400' },
    { id: 'mountain', label: 'Montagne / Borghi', icon: Mountain, color: 'text-stone-400' },
    { id: 'water', label: 'Fiumi / Laghi', icon: Droplets, color: 'text-blue-400' },
];

export const CityShowcaseTab = ({ city, visibleAllPois, activeSponsors, onOpenPoiDetail, onAddToItinerary, onOpenSponsor, onOpenSuggestion, user, onOpenAuth, userLocation }: Props) => {
    const { hasUserLiked, toggleLike } = useInteraction(); 
    const [vetrinaSubTab, setVetrinaSubTab] = useState<VetrinaSubTab>('novita');
    
    const [activeTopCategory, setActiveTopCategory] = useState<string>('monument'); 
    
    useEffect(() => {
        if (vetrinaSubTab === 'community') setActiveTopCategory('monument');
        if (vetrinaSubTab === 'natura') setActiveTopCategory('sea');
    }, [vetrinaSubTab]);

    const goldSponsors = useMemo(() => activeSponsors.filter(s => s.tier === 'gold'), [activeSponsors]);
    const silverSponsors = useMemo(() => activeSponsors.filter(s => s.tier === 'silver'), [activeSponsors]);

    const mobileGold1 = goldSponsors[0] || null;
    const mobileGold2 = goldSponsors[1] || null;
    const mobileSilver = silverSponsors[0] || null;

    const handleLike = (poi: PointOfInterest) => {
        if (!user || user.role === 'guest') {
            if(onOpenAuth) onOpenAuth();
            return;
        }
        toggleLike(poi.id);
    };
    
    const renderMobileSponsorCard = (sponsor: PointOfInterest | null, tier: 'gold' | 'silver') => {
        if (sponsor) {
             return (
                <div className="h-40 w-full">
                     <UniversalCard 
                        poi={sponsor} 
                        onOpenDetail={onOpenPoiDetail} 
                        onAddToItinerary={onAddToItinerary} 
                        onLike={() => handleLike(sponsor)} 
                        isLiked={hasUserLiked(sponsor.id)} 
                        variant="vertical"
                        fluid={true} 
                        verticalStretch={true} 
                        userLocation={userLocation}
                     />
                </div>
             );
        } else {
             return (
                <div className="h-40 w-full">
                    <AdPlaceholder 
                        variant={tier} 
                        vertical 
                        label={`Partner ${tier === 'gold' ? 'Gold' : 'Silver'}`} 
                        className="h-full w-full" 
                        onClick={() => onOpenSponsor(tier)} 
                    />
                </div>
             );
        }
    };

    const renderEditorialNovitaGrid = () => {
        const news = visibleAllPois.filter(p => {
            if (p.isSponsored) return false;
            if (p.tier === 'gold' || p.tier === 'silver') return false;
            if (!isPoiNew(p)) return false;
            const nameMatch = activeSponsors.some(s => s.name.trim().toLowerCase() === p.name.trim().toLowerCase());
            if (nameMatch) return false;
            return true;
        });
        
        if (news.length === 0) return <div className="text-slate-500 italic p-10 text-sm bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed text-center w-full col-span-2">Nessuna novità editoriale questo mese.</div>;
        
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
                {news.map(poi => (
                    <div key={poi.id} className="w-full h-40 md:h-48"> 
                        <UniversalCard 
                            poi={poi} 
                            onOpenDetail={onOpenPoiDetail} 
                            onAddToItinerary={onAddToItinerary}
                            onLike={() => handleLike(poi)}
                            isLiked={hasUserLiked(poi.id)}
                            variant="vertical"
                            fluid={true} 
                            verticalStretch={true}
                            userLocation={userLocation}
                        />
                    </div>
                ))}
            </div>
        );
    };
    
    const renderNovitaLayout = () => {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-[19rem_1fr_19rem] min-[1900px]:grid-cols-[19rem_19rem_1fr_19rem_19rem] h-full w-full overflow-hidden">
                <div className="hidden min-[1900px]:block h-full overflow-hidden border-r border-slate-800/50">
                    <CategorySponsorColumn side="left" offsetMultiplier={0} goldSponsors={goldSponsors} silverSponsors={silverSponsors} onAddToItinerary={onAddToItinerary} onOpenPoiDetail={onOpenPoiDetail} onOpenSponsor={onOpenSponsor} onLike={handleLike} hasUserLiked={hasUserLiked} userLocation={userLocation} />
                </div>
                <div className="hidden lg:block h-full overflow-hidden border-r border-slate-800/50">
                     <CategorySponsorColumn side="left" offsetMultiplier={1} goldSponsors={goldSponsors} silverSponsors={silverSponsors} onAddToItinerary={onAddToItinerary} onOpenPoiDetail={onOpenPoiDetail} onOpenSponsor={onOpenSponsor} onLike={handleLike} hasUserLiked={hasUserLiked} userLocation={userLocation} />
                </div>
                <div className="flex-1 md:px-6 py-4 min-w-0 h-auto md:h-full overflow-visible md:overflow-y-auto custom-scrollbar">
                     <div className="flex items-center gap-2 mb-6 px-1">
                        <Sparkles className="w-4 h-4 text-purple-500"/>
                        <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Ultime Novità</h4>
                    </div>
                    {renderEditorialNovitaGrid()}
                    <div className="lg:hidden md:px-0 mt-8 pb-20 border-t border-slate-800/50 pt-8">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <div className="h-px flex-1 bg-amber-600/40"></div>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">PARTNER</span>
                            <div className="h-px flex-1 bg-amber-600/40"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                             {renderMobileSponsorCard(mobileGold1, 'gold')}
                             {renderMobileSponsorCard(mobileGold2, 'gold')}
                        </div>
                        <div className="w-full">
                             {renderMobileSponsorCard(mobileSilver, 'silver')}
                        </div>
                    </div>
                </div>
                <div className="hidden lg:block h-full overflow-hidden border-l border-slate-800/50">
                     <CategorySponsorColumn side="right" offsetMultiplier={2} goldSponsors={goldSponsors} silverSponsors={silverSponsors} onAddToItinerary={onAddToItinerary} onOpenPoiDetail={onOpenPoiDetail} onOpenSponsor={onOpenSponsor} onLike={handleLike} hasUserLiked={hasUserLiked} userLocation={userLocation} />
                </div>
                <div className="hidden min-[1900px]:block h-full overflow-hidden border-l border-slate-800/50">
                     <CategorySponsorColumn side="right" offsetMultiplier={3} goldSponsors={goldSponsors} silverSponsors={silverSponsors} onAddToItinerary={onAddToItinerary} onOpenPoiDetail={onOpenPoiDetail} onOpenSponsor={onOpenSponsor} onLike={handleLike} hasUserLiked={hasUserLiked} userLocation={userLocation} />
                </div>
            </div>
        );
    };

    const getNatureItems = (subKey: string) => {
        if (subKey === 'sea') {
            return visibleAllPois.filter(p => {
                const sub = (p.subCategory || '').toLowerCase();
                return sub === 'beach' || sub === 'beach_club' || sub === 'beach_free' || (p.tags && p.tags.some(t => t.toLowerCase().includes('mare')));
            });
        }
        if (subKey === 'mountain') {
            return visibleAllPois.filter(p => {
                const sub = (p.subCategory || '').toLowerCase();
                return sub === 'mountain' || sub === 'village' || sub === 'hiking' || sub === 'viewpoint';
            });
        }
        if (subKey === 'water') {
            return visibleAllPois.filter(p => {
                const sub = (p.subCategory || '').toLowerCase();
                return sub === 'lake' || sub === 'river' || sub === 'waterfall';
            });
        }
        return [];
    };

    const renderMasterDetailLayout = (menuItems: typeof COMMUNITY_MENU, context: 'community' | 'natura') => {
        const activeItem = menuItems.find(m => m.id === activeTopCategory) || menuItems[0];
        
        let displayItems: PointOfInterest[] = [];
        
        if (context === 'community') {
            displayItems = visibleAllPois.filter(p => p.category === activeItem.id);
        } else {
            displayItems = getNatureItems(activeItem.id);
            if (displayItems.length === 0) displayItems = visibleAllPois.filter(p => p.category === 'nature');
        }

        const top5Items = ensureFiveItems(displayItems);

        return (
            <div className="grid grid-cols-1 lg:grid-cols-[16rem_1fr_19rem] min-[1900px]:grid-cols-[19rem_16rem_1fr_19rem] h-full w-full overflow-hidden">
                <div className="hidden min-[1900px]:block h-full overflow-hidden border-r border-slate-800/50">
                    <CategorySponsorColumn side="left" offsetMultiplier={0} goldSponsors={goldSponsors} silverSponsors={silverSponsors} onAddToItinerary={onAddToItinerary} onOpenPoiDetail={onOpenPoiDetail} onOpenSponsor={onOpenSponsor} onLike={handleLike} hasUserLiked={hasUserLiked} userLocation={userLocation} />
                </div>
                <div className="hidden lg:flex flex-col gap-2 overflow-hidden border-r border-slate-800/50 p-4 bg-[#020617]">
                    <div className="pb-2 border-b border-slate-800/50 mb-2 shrink-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">SELEZIONA CATEGORIA</span>
                    </div>
                    <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar">
                        {menuItems.map(item => {
                            const isActive = activeTopCategory === item.id;
                            const Icon = item.icon;
                            return (
                                <button key={item.id} onClick={() => setActiveTopCategory(item.id)} className={`flex items-center gap-3 p-3 rounded-xl border transition-all group shrink-0 ${isActive ? 'bg-slate-800 border-indigo-500 shadow-md ring-1 ring-indigo-500/20' : 'bg-slate-900 border-slate-800 hover:bg-slate-800 hover:border-slate-700'}`}>
                                    <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-500 group-hover:text-slate-300'}`}><Icon className="w-4 h-4"/></div>
                                    <span className={`text-xs font-bold uppercase tracking-wide truncate ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{item.label}</span>
                                    {isActive && <ChevronRight className="w-4 h-4 text-indigo-500 ml-auto"/>}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden relative border-r border-slate-800/50">
                    <div className="lg:hidden p-4 overflow-x-auto no-scrollbar flex gap-2 border-b border-slate-800/50 shrink-0 bg-[#020617] sticky top-0 z-30">
                        {menuItems.map(item => {
                            const isActive = activeTopCategory === item.id;
                            const Icon = item.icon;
                            return (
                                <button key={item.id} onClick={() => setActiveTopCategory(item.id)} className={`flex items-center gap-2 p-2 rounded-lg border transition-all whitespace-nowrap ${isActive ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-slate-900 text-slate-400 border-slate-800'}`}><Icon className="w-3.5 h-3.5"/><span className="text-[10px] font-bold uppercase tracking-wide">{item.label}</span></button>
                            );
                        })}
                    </div>
                    <div className="flex-1 md:overflow-y-auto overflow-visible custom-scrollbar md:px-6 py-4 min-w-0">
                         <div className="flex items-center justify-between mb-6 px-1">
                            <div className="flex items-center gap-2"><activeItem.icon className={`w-4 h-4 ${activeItem.color}`} /><h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest">{activeItem.label}</h4></div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded border border-slate-800">TOP 5</div>
                         </div>
                         <div className="flex flex-col gap-4 pb-20">
                            {top5Items.map((item, idx) => (
                                <div key={item?.id || `empty-slot-${activeItem.id}-${idx}`} className="animate-in slide-in-from-right-2" style={{animationDelay: `${idx * 50}ms`}}>
                                    {item ? (
                                        <UniversalCard 
                                            poi={item} 
                                            onOpenDetail={onOpenPoiDetail} 
                                            onAddToItinerary={onAddToItinerary}
                                            onLike={() => handleLike(item)}
                                            isLiked={hasUserLiked(item.id)}
                                            userLocation={userLocation}
                                            variant="horizontal" // Use Horizontal Variant for Top 5
                                        />
                                    ) : (
                                        <div className="h-32 md:h-44 w-full bg-slate-900/30 border-2 border-dashed border-slate-800/60 rounded-xl flex flex-col items-center justify-center gap-2 opacity-50">
                                            <CircleDashed className="w-5 h-5 text-slate-700 animate-spin-slow" />
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Slot Libero</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                             <div className="lg:hidden mt-8 px-0 border-t border-slate-800/50 pt-8">
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <div className="h-px flex-1 bg-amber-600/40"></div><span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">PARTNER</span><div className="h-px flex-1 bg-amber-600/40"></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                     {renderMobileSponsorCard(mobileGold1, 'gold')}
                                     {renderMobileSponsorCard(mobileGold2, 'gold')}
                                </div>
                                <div className="w-full">
                                     {renderMobileSponsorCard(mobileSilver, 'silver')}
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
                <div className="hidden lg:block h-full overflow-hidden border-l border-slate-800/50">
                    <CategorySponsorColumn side="right" offsetMultiplier={2} goldSponsors={goldSponsors} silverSponsors={silverSponsors} onAddToItinerary={onAddToItinerary} onOpenPoiDetail={onOpenPoiDetail} onOpenSponsor={onOpenSponsor} onLike={handleLike} hasUserLiked={hasUserLiked} userLocation={userLocation} />
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col md:h-full h-auto pt-2 md:overflow-y-auto overflow-visible custom-scrollbar">
            <div className="flex items-center justify-between px-1 bg-[#020617] py-2 border-b border-slate-800/50 shadow-lg shrink-0 sticky top-0 z-[40]">
                <div className="flex bg-[#0f172a] border border-slate-800 rounded-lg shadow-xl overflow-hidden h-8">
                    <button onClick={() => setVetrinaSubTab('novita')} className={`px-4 h-full text-[9px] font-bold uppercase tracking-wider transition-colors border-r border-slate-800 ${vetrinaSubTab === 'novita' ? 'bg-amber-600 text-white' : 'text-yellow-400 hover:text-orange-500 hover:bg-slate-800'}`}>NOVITÀ</button>
                    <button onClick={() => setVetrinaSubTab('community')} className={`px-4 h-full text-[9px] font-bold uppercase tracking-wider transition-colors border-r border-slate-800 ${vetrinaSubTab === 'community' ? 'bg-indigo-600 text-white' : 'text-yellow-400 hover:text-orange-500 hover:bg-slate-800'}`}>TOP 5 | COMMUNITY</button>
                    <button onClick={() => setVetrinaSubTab('natura')} className={`px-4 h-full text-[9px] font-bold uppercase tracking-wider transition-colors ${vetrinaSubTab === 'natura' ? 'bg-emerald-600 text-white' : 'text-yellow-400 hover:text-orange-500 hover:bg-slate-800'}`}>TOP 5 | NATURA</button>
                </div>
            </div>
            <div className="animate-in fade-in duration-300 flex-1 min-h-0 relative bg-[#020617]">
                {vetrinaSubTab === 'novita' && renderNovitaLayout()}
                {vetrinaSubTab === 'community' && renderMasterDetailLayout(COMMUNITY_MENU, 'community')}
                {vetrinaSubTab === 'natura' && renderMasterDetailLayout(NATURE_MENU, 'natura')}
            </div>
        </div>
    );
};
