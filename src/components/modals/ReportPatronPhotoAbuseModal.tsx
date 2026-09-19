import type { CityPatronGalleryPhoto } from '@/types/models/patronGallery';
import type { User } from '@/types/users';
import { ReportAbuseModal } from './ReportAbuseModal';

type ReportPatronPhotoAbuseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  photo: CityPatronGalleryPhoto | null;
  cityId: string;
  cityName: string;
  patronName: string;
  user: User | null;
  onOpenAuth?: () => void;
};

/** Wrapper legacy → modale unificato MF2 */
export const ReportPatronPhotoAbuseModal = ({
  isOpen,
  onClose,
  photo,
  cityId,
  cityName,
  patronName,
  user,
  onOpenAuth,
}: ReportPatronPhotoAbuseModalProps) => {
  if (!photo) return null;

  return (
    <ReportAbuseModal
      isOpen={isOpen}
      onClose={onClose}
      user={user}
      onOpenAuth={onOpenAuth}
      subtitle={`${patronName} · ${cityName}`}
      allowEntityAbuse
      allowImageAbuse
      target={{
        entityType: 'patron',
        // D72: per Patrono entity_id canonico coincide con city_id.
        entityId: cityId,
        cityId,
        entityName: patronName,
        imageUrl: photo.imageUrl,
        storageBucket: 'public-media',
        storagePath: photo.storagePath ?? null,
        sourceContext: 'patron_gallery',
        assignmentId: photo.assignmentId ?? null,
      }}
    />
  );
};
