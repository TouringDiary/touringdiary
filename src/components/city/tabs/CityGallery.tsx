import { useEffect, useMemo, useState } from 'react';
import {
  CommunityPhotoAbuseModal,
  type CommunityPhotoAbuseTarget,
} from '@/components/modals/CommunityPhotoAbuseModal';
import { CommunityPhotoWorkflow } from '@/components/photos/CommunityPhotoWorkflow';
import { FeatureFlagPausedBanner } from '@/components/platform/FeatureFlagPausedBanner';
import { PLATFORM_FEATURE_FLAG_KEYS } from '@/constants/platformFeatureFlags';
import { useFeatureFlag } from '@/context/PlatformControlContext';
import { useCommunityPhotoPublish } from '@/hooks/photos/useCommunityPhotoPublish';
import { getFullManifestAsync } from '@/services/cityService';
import { useCityGallery } from '../../../hooks/useCityGallery';
import type { CityDetails, CitySummary, User as UserType } from '../../../types/index';
import { GalleryGrid } from '../gallery/GalleryGrid';
import { GalleryLightbox, type LightboxData } from '../gallery/GalleryLightbox';
import { GallerySuccessModal } from '../gallery/GallerySuccessModal';

interface Props {
  city: CityDetails;
  user: UserType;
  onOpenAuth: () => void;
}

export const CityGallery = ({ city, user, onOpenAuth }: Props) => {
  const {
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
    refresh,
  } = useCityGallery(city, user);

  const photosFlag = useFeatureFlag(PLATFORM_FEATURE_FLAG_KEYS.MODERATION_PHOTOS);
  const photosEnabled = photosFlag?.enabled === true;

  const [activeTab, setActiveTab] = useState<'official' | 'community'>('community');
  const [cityManifest, setCityManifest] = useState<CitySummary[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [abuseTarget, setAbuseTarget] = useState<CommunityPhotoAbuseTarget | null>(null);
  const [isAbuseModalOpen, setIsAbuseModalOpen] = useState(false);

  useEffect(() => {
    if (!defaultTab) return;
    setLightboxIndex(null);
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    let cancelled = false;
    void getFullManifestAsync()
      .then((manifest) => {
        if (!cancelled) setCityManifest(manifest);
      })
      .catch(() => {
        // Nessun dato artificiale: resta cityManifest vuoto e si usa `city` reale sotto.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleTabChange = (tab: 'official' | 'community') => {
    setLightboxIndex(null);
    setActiveTab(tab);
  };

  // CityDetails extends CitySummary (types/models/City.ts): dati reali della città, non un faux object.
  const publishManifest: CitySummary[] = cityManifest.length > 0 ? cityManifest : [city];

  const photo = useCommunityPhotoPublish({
    user,
    entryPoint: 'gallery',
    lockedCityId: city.id,
    cityManifest: publishManifest,
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

  const openAbuseFromLightbox = () => {
    if (lightboxIndex === null) return;
    const photoItem = currentPhotos[lightboxIndex];
    if (!photoItem) return;
    setAbuseTarget({
      photoId: photoItem.id,
      assignmentId: photoItem.assignmentId ?? null,
      cityId: city.id,
      cityName: city.name,
      imageUrl: photoItem.url,
      storageBucket: photoItem.storageBucket ?? null,
      storagePath: photoItem.storagePath ?? null,
      caption: photoItem.description ?? null,
    });
    setIsAbuseModalOpen(true);
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
          onReportAbuse={activeTab === 'community' ? openAbuseFromLightbox : undefined}
        />
      )}

      <CommunityPhotoAbuseModal
        isOpen={isAbuseModalOpen}
        onClose={() => {
          setIsAbuseModalOpen(false);
          setAbuseTarget(null);
        }}
        target={abuseTarget}
        context="city_gallery"
        user={user}
      />

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
        officialPhotos={officialPhotos}
        communityPhotos={communityPhotos}
        topOfficial={topOfficial}
        topCommunity={topCommunity}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        visiblePhotos={visiblePhotos}
        pagination={pagination}
        isUploading={photo.isUploading || galleryBusy}
        photosEnabled={photosEnabled}
        onAddClick={handleAddClick}
        onOpenLightbox={handleOpenLightbox}
        onOpenAuth={onOpenAuth}
      />
    </div>
  );
};
