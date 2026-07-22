import React, { useState, useMemo, useEffect } from 'react';
import { CityDetails, User as UserType, CitySummary } from '../../../types/index';
import { useCityGallery } from '../../../hooks/useCityGallery';
import { GalleryLightbox, LightboxData } from '../gallery/GalleryLightbox';
import { GallerySuccessModal } from '../gallery/GallerySuccessModal';
import { GalleryGrid } from '../gallery/GalleryGrid';
import { useFeatureFlag } from '@/context/PlatformControlContext';
import { PLATFORM_FEATURE_FLAG_KEYS } from '@/constants/platformFeatureFlags';
import { FeatureFlagPausedBanner } from '@/components/platform/FeatureFlagPausedBanner';
import { useCommunityPhotoPublish } from '@/hooks/photos/useCommunityPhotoPublish';
import { CommunityPhotoWorkflow } from '@/components/photos/CommunityPhotoWorkflow';
import { getFullManifestAsync } from '@/services/cityService';

interface Props {
    city: CityDetails;
    user: UserType;
    onOpenAuth: () => void;
}

export const CityGallery = ({ city, user, onOpenAuth }: Props) => {
    const {
        photos,
        officialPhotos,
        communityPhotos,
        topOfficial,
        topCommunity,
        defaultTab,
        visiblePhotos,
        isUploading: galleryBusy,
        uploadError,
        setUploadError,
        pagination,
        updatePhotoLikes,
        refresh,
    } = useCityGallery(city, user);

    const photosFlag = useFeatureFlag(PLATFORM_FEATURE_FLAG_KEYS.MODERATION_PHOTOS);
    const photosEnabled = photosFlag?.enabled === true;

    const [activeTab, setActiveTab] = useState<'official' | 'community'>('community');
    const [cityManifest, setCityManifest] = useState<CitySummary[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    useEffect(() => {
        if (defaultTab) setActiveTab(defaultTab);
    }, [defaultTab]);

    useEffect(() => {
        void getFullManifestAsync().then(setCityManifest);
    }, []);

    useEffect(() => {
        return () => setLightboxIndex(null);
    }, []);

    const photo = useCommunityPhotoPublish({
        user,
        entryPoint: 'gallery',
        lockedCityId: city.id,
        cityManifest: cityManifest.length
            ? cityManifest
            : [
                  {
                      id: city.id,
                      slug: city.slug,
                      name: city.name,
                      continent: city.continent || '',
                      nation: city.nation || '',
                      adminRegion: city.adminRegion || '',
                      zone: city.zone || '',
                      description: '',
                      imageUrl: city.imageUrl || '',
                      rating: 0,
                      visitors: 0,
                      isFeatured: false,
                      coords: city.coords || { lat: 0, lng: 0 },
                      status: city.status || 'published',
                  } as CitySummary,
              ],
        preferSuccessUi: true,
        onUploaded: () => {
            void refresh();
        },
    });

    const currentPhotos = useMemo(() => {
        return activeTab === 'official' ? officialPhotos : communityPhotos;
    }, [activeTab, officialPhotos, communityPhotos]);

    const lightboxData: LightboxData | null = useMemo(() => {
        if (lightboxIndex === null || !currentPhotos[lightboxIndex]) return null;
        const p = currentPhotos[lightboxIndex];
        return {
            id: p.id,
            url: p.url,
            user: p.user,
            likes: p.likes || 0,
            caption: p.description,
            date: p.date,
            likedByUser: p.likedByUser,
        };
    }, [lightboxIndex, currentPhotos]);

    const handleAddClick = () => {
        if (galleryBusy || photo.isUploading) return;
        if (user.role === 'guest') {
            onOpenAuth();
            return;
        }
        if (!photosEnabled) return;
        setUploadError(null);
        photo.startPublish();
    };

    const handleOpenLightbox = (data: LightboxData) => {
        const idx = currentPhotos.findIndex((p) => p.id === data.id);
        if (idx !== -1) setLightboxIndex(idx);
    };

    const handleNextPhoto = () => {
        if (lightboxIndex !== null && lightboxIndex < currentPhotos.length - 1) {
            setLightboxIndex(lightboxIndex + 1);
        }
    };

    const handlePrevPhoto = () => {
        if (lightboxIndex !== null && lightboxIndex > 0) {
            setLightboxIndex(lightboxIndex - 1);
        }
    };

    return (
        <div className="flex flex-col animate-in fade-in select-none relative w-full h-auto">
            <CommunityPhotoWorkflow workflow={photo} />

            {lightboxData && (
                <GalleryLightbox
                    data={lightboxData}
                    onClose={() => setLightboxIndex(null)}
                    onNext={handleNextPhoto}
                    onPrev={handlePrevPhoto}
                    hasNext={lightboxIndex !== null && lightboxIndex < currentPhotos.length - 1}
                    hasPrev={lightboxIndex !== null && lightboxIndex > 0}
                    allPhotos={currentPhotos}
                    currentIndex={lightboxIndex ?? 0}
                    onGoToPhoto={(idx) => setLightboxIndex(idx)}
                />
            )}

            {photo.showSuccessModal && (
                <GallerySuccessModal onClose={() => photo.setShowSuccessModal(false)} />
            )}

            <FeatureFlagPausedBanner
                flagKey={PLATFORM_FEATURE_FLAG_KEYS.MODERATION_PHOTOS}
                className="mx-4 mb-3"
            />

            {photosEnabled && uploadError && (
                <div className="mx-4 mb-3 p-3 rounded-xl border border-red-500/40 bg-red-950/40 text-red-200 text-xs font-bold">
                    {uploadError}
                </div>
            )}

            <GalleryGrid
                photos={photos}
                officialPhotos={officialPhotos}
                communityPhotos={communityPhotos}
                topOfficial={topOfficial}
                topCommunity={topCommunity}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                visiblePhotos={visiblePhotos}
                pagination={pagination}
                isUploading={photo.isUploading || galleryBusy}
                photosEnabled={photosEnabled}
                onAddClick={handleAddClick}
                onOpenLightbox={handleOpenLightbox}
                onOpenAuth={onOpenAuth}
                onLikeUpdate={updatePhotoLikes}
            />
        </div>
    );
};
