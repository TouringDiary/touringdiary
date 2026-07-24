import { Z_MODAL_NESTED } from '@/constants/zIndex';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Trophy } from 'lucide-react';
import { PhotoSubmission, User as UserType } from '../../types/index';
import { listPhotographs, deletePhotoSubmissionInDb, updatePhotoData } from '../../services/photoService';
import { useInteraction } from '../../context/InteractionContext';
import { useNavigation } from '../../context/useNavigation';
import { useGps } from '@/context/GpsContext';
import { useUser } from '@/context/UserContext';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { GalleryLightbox, LightboxData } from '../city/gallery/GalleryLightbox';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { PLATFORM_FEATURE_FLAG_KEYS } from '../../constants/platformFeatureFlags';
import { FeatureFlagPausedBanner } from '@/components/platform/FeatureFlagPausedBanner';
import { useCommunityPhotoPublish } from '@/hooks/photos/useCommunityPhotoPublish';
import { CommunityPhotoWorkflow } from '@/components/photos/CommunityPhotoWorkflow';
import { LiveFeedToolbar } from './liveFeed/LiveFeedToolbar';
import { LiveFeedHero } from './liveFeed/LiveFeedHero';
import { LiveFeedCarousel } from './liveFeed/LiveFeedCarousel';
import { useAreRewardsEnabled } from '@/hooks/useAreRewardsEnabled';
import { RewardsFreezeNotice } from '@/components/gamification/RewardsFreezeNotice';

interface LiveFeedTabProps {
    user: UserType;
    onUserUpdate?: (user: UserType) => void;
    onOpenAuth?: () => void;
}

export const LiveFeedTab = ({ user, onUserUpdate, onOpenAuth }: LiveFeedTabProps) => {
    const { activeCityId } = useNavigation();
    const { userLocation } = useGps();
    const { cityManifest } = useUser();
    const { togglePhotoHeart, getPhotoStatus } = useInteraction();
    const rewardsEnabled = useAreRewardsEnabled();

    const [liveSnaps, setLiveSnaps] = useState<PhotoSubmission[]>([]);
    const [visibleSnapsCount, setVisibleSnapsCount] = useState(15);
    const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
    const [heroIndex, setHeroIndex] = useState(0);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; caption: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const thumbScrollRef = useRef<HTMLDivElement>(null);
    const isAdmin = user.role === 'admin_all' || user.role === 'admin_limited';

    const refreshSnaps = useCallback(async () => {
        const snaps = await listPhotographs({ status: 'approved', withLikes: true });
        setLiveSnaps(snaps);
    }, []);

    const photo = useCommunityPhotoPublish({
        user,
        entryPoint: 'liveFeed',
        activeCityId,
        userLocation,
        cityManifest,
        onUserUpdate,
        onUploaded: (snap) => {
            setLiveSnaps((prev) => [snap, ...prev]);
            setHeroIndex(0);
        },
        onPromoted: () => {
            void refreshSnaps();
        },
    });

    useEffect(() => {
        void refreshSnaps();
    }, [user, refreshSnaps]);

    const filteredSnaps = useMemo(() => {
        return liveSnaps.filter((s) => {
            if (isAdmin) return true;
            if (user && s.userId === user.id) return true;
            return s.status === 'approved' || !s.status;
        });
    }, [liveSnaps, user, isAdmin]);

    const lightboxData: LightboxData | null = useMemo(() => {
        if (activeLightboxIndex === null || !filteredSnaps[activeLightboxIndex]) return null;
        const s = filteredSnaps[activeLightboxIndex];
        return {
            id: s.id,
            url: s.url,
            user: s.user,
            likes: s.likes ?? 0,
            caption: s.description,
            date: s.date,
            likedByUser: s.likedByUser,
        };
    }, [activeLightboxIndex, filteredSnaps]);

    useGlobalModalEscape(
        activeLightboxIndex !== null ||
            (photo.step !== 'idle' && !photo.isUploading && photo.step !== 'edit'),
        (e) => {
            e?.stopPropagation?.();
            if (activeLightboxIndex !== null) setActiveLightboxIndex(null);
            else if (photo.step === 'acquire') photo.closeAcquire();
            else if (photo.step === 'compose' && !photo.isUploading) photo.closeWorkflow();
        }
    );

    useEffect(() => {
        if (!thumbScrollRef.current) return;
        const activeThumb = thumbScrollRef.current.querySelector(`[data-index="${heroIndex}"]`);
        activeThumb?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, [heroIndex]);

    const nextHero = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (filteredSnaps.length === 0) return;
        setHeroIndex((prev) => (prev + 1) % filteredSnaps.length);
    };

    const prevHero = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (filteredSnaps.length === 0) return;
        setHeroIndex((prev) => (prev - 1 + filteredSnaps.length) % filteredSnaps.length);
    };

    const openLightbox = (snapId: string) => {
        const index = filteredSnaps.findIndex((s) => s.id === snapId);
        if (index !== -1) setActiveLightboxIndex(index);
    };

    const handleToggleOfficialFromFeed = async (snap: PhotoSubmission) => {
        if (snap.isOfficial) {
            await updatePhotoData(snap.id, { isOfficial: false });
            await refreshSnaps();
            return;
        }
        photo.openPromoteModal(snap);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await deletePhotoSubmissionInDb(deleteTarget.id);
            setLiveSnaps((prev) => prev.filter((s) => s.id !== deleteTarget.id));
            setDeleteTarget(null);
            if (heroIndex >= liveSnaps.length - 1) setHeroIndex(0);
        } catch (e) {
            console.error(e);
            alert("Errore durante l'eliminazione.");
        } finally {
            setIsDeleting(false);
        }
    };

    const heroSnap = filteredSnaps[heroIndex];
    const heroStatus = heroSnap ? getPhotoStatus(heroSnap) : null;
    const gridSnaps = filteredSnaps.slice(0, visibleSnapsCount);
    const hasMore = filteredSnaps.length > visibleSnapsCount;

    return (
        <div className="flex flex-col h-full relative">
            {lightboxData && (
                <GalleryLightbox
                    data={lightboxData}
                    onClose={() => setActiveLightboxIndex(null)}
                    onNext={() =>
                        setActiveLightboxIndex((i) =>
                            i !== null && i < filteredSnaps.length - 1 ? i + 1 : i
                        )
                    }
                    onPrev={() =>
                        setActiveLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i))
                    }
                    hasNext={
                        activeLightboxIndex !== null &&
                        activeLightboxIndex < filteredSnaps.length - 1
                    }
                    hasPrev={activeLightboxIndex !== null && activeLightboxIndex > 0}
                />
            )}

            <CommunityPhotoWorkflow workflow={photo} />

            {photo.showRewardModal && (
                <div
                    className="absolute inset-0 flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-md animate-in fade-in zoom-in-95"
                    style={{ zIndex: Z_MODAL_NESTED }}
                >
                    <div className="flex flex-col items-center text-center space-y-6 max-w-sm w-full">
                        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center border-4 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.5)] animate-bounce">
                            <Trophy className="w-12 h-12 text-emerald-400 fill-emerald-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black text-white uppercase tracking-wide">
                                Grande Scatto!
                            </h3>
                            <p className="text-slate-400">Hai appena guadagnato</p>
                            <div className="text-5xl font-black text-amber-500 drop-shadow-lg">
                                +{photo.earnedXp} XP
                            </div>
                        </div>
                        {!rewardsEnabled && (
                            <RewardsFreezeNotice variant="compact" className="w-full" />
                        )}
                        <button
                            type="button"
                            onClick={() => photo.setShowRewardModal(false)}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl uppercase tracking-widest transition-all shadow-xl border border-slate-700"
                        >
                            Continua
                        </button>
                    </div>
                </div>
            )}

            <DeleteConfirmationModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Eliminare Snap?"
                message={`Stai per cancellare definitivamente la foto "${deleteTarget?.caption}".`}
                isDeleting={isDeleting}
            />

            <FeatureFlagPausedBanner
                flagKey={PLATFORM_FEATURE_FLAG_KEYS.MODERATION_PHOTOS}
                className="mx-4 md:mx-8 mt-3 mb-1"
            />

            <LiveFeedToolbar
                photosEnabled={photo.photosEnabled}
                isUploading={photo.isUploading}
                onPublishPhoto={() => {
                    if (photo.isGuest) {
                        onOpenAuth?.();
                        return;
                    }
                    photo.startPublish();
                }}
            />

            <div className="flex-1 flex flex-col pb-10 px-4 md:px-8">
                {heroSnap && (
                    <LiveFeedHero
                        heroSnap={heroSnap}
                        heroStatus={heroStatus}
                        snapCount={filteredSnaps.length}
                        isAdmin={isAdmin}
                        onOpenLightbox={openLightbox}
                        onPrev={prevHero}
                        onNext={nextHero}
                        onDelete={(snap) =>
                            setDeleteTarget({
                                id: snap.id,
                                caption: snap.description || 'Senza titolo',
                            })
                        }
                        onToggleOfficial={(snap) => void handleToggleOfficialFromFeed(snap)}
                        onToggleLike={(id) => void togglePhotoHeart(id)}
                    />
                )}

                <LiveFeedCarousel
                    snaps={gridSnaps}
                    heroIndex={heroIndex}
                    scrollRef={thumbScrollRef}
                    getStatus={getPhotoStatus}
                    onSelect={setHeroIndex}
                    onOpenLightbox={openLightbox}
                    hasMore={hasMore}
                    onLoadMore={() => setVisibleSnapsCount((c) => c + 15)}
                />

                {filteredSnaps.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-600 py-16">
                        <p className="text-xs font-bold uppercase tracking-widest">
                            Nessuno scatto ancora. Sii il primo!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
