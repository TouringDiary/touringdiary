
import React, { useState, useEffect } from 'react';
import { Award } from 'lucide-react';
import { PointOfInterest } from '../../../types/index';
import { AdPlaceholder } from '../../common/AdPlaceholder';
// UPDATE: Importa UniversalCard
import { UniversalCard } from '../ShowcaseCards'; 

interface CategorySponsorColumnProps {
    side: 'left' | 'right';
    offsetMultiplier: number;
    goldSponsors: PointOfInterest[];
    silverSponsors: PointOfInterest[];
    onAddToItinerary: (poi: PointOfInterest) => void;
    onOpenPoiDetail: (poi: PointOfInterest) => void;
    onOpenSponsor: (tier?: string) => void;
    onLike: (poi: PointOfInterest) => void;
    hasUserLiked: (id: string) => boolean;
    userLocation: { lat: number; lng: number } | null;
}

export const CategorySponsorColumn: React.FC<CategorySponsorColumnProps> = ({ 
    side, offsetMultiplier, goldSponsors, silverSponsors, 
    onAddToItinerary, onOpenPoiDetail, onOpenSponsor, onLike, hasUserLiked, userLocation
}) => {
    const [rotationIndex, setRotationIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setRotationIndex(prev => prev + 1), 15000); 
        return () => clearInterval(interval);
    }, []);

    const gold1Idx = (offsetMultiplier * 2 + rotationIndex) % (goldSponsors.length || 1);
    const gold1 = goldSponsors.length > 0 ? goldSponsors[gold1Idx] : undefined;
    const gold2Idx = (offsetMultiplier * 2 + 1 + rotationIndex) % (goldSponsors.length || 1);
    const gold2 = goldSponsors.length > 0 ? goldSponsors[gold2Idx] : undefined;
    const silverIdx = (offsetMultiplier + rotationIndex) % (silverSponsors.length || 1);
    const silver1 = silverSponsors.length > 0 ? silverSponsors[silverIdx] : undefined;

    const renderSlot = (sponsor: PointOfInterest | undefined, tier: 'gold' | 'silver', slotKey: string) => (
        <div key={slotKey} className="flex-1 w-full min-h-0 relative">
            {sponsor ? (
                <UniversalCard 
                    poi={sponsor} 
                    onOpenDetail={onOpenPoiDetail} 
                    onAddToItinerary={onAddToItinerary}
                    onLike={() => onLike(sponsor)}
                    isLiked={hasUserLiked(sponsor.id)} 
                    variant="vertical" // Usa variante verticale per sidebar
                    fluid={true}
                    verticalStretch={true}
                    userLocation={null}
                />
            ) : (
                <AdPlaceholder 
                    variant={tier} vertical 
                    label={`Partner ${tier === 'gold' ? 'Gold' : 'Silver'}`} 
                    className="h-full w-full" 
                    onClick={() => onOpenSponsor(tier === 'gold' ? 'gold' : 'silver')} 
                />
            )}
        </div>
    );

    return (
        <div className="flex flex-col h-full overflow-hidden px-2 py-3 bg-[#050b14] border-x border-slate-800/50 gap-2">
            <div className="flex items-center justify-center gap-2 mb-1 shrink-0 h-5">
                <div className="h-px flex-1 bg-amber-600/40"></div>
                <div className="flex items-center gap-1 px-1"><Award className="w-3 h-3 text-amber-500"/><span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">PARTNER</span></div>
                <div className="h-px flex-1 bg-amber-600/40"></div>
            </div>
            <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-hidden justify-between">
                {renderSlot(gold1, 'gold', `slot1-${side}`)}
                {renderSlot(gold2, 'gold', `slot2-${side}`)}
                {renderSlot(silver1, 'silver', `slot3-${side}`)}
            </div>
        </div>
    );
};
