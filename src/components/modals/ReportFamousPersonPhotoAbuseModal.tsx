import type { User } from '@/types/users';
import { ReportAbuseModal } from './ReportAbuseModal';
import type { FamousPersonOfficialPhotoTarget } from './ReportFamousPersonPhotoAbuseModal.types';

export type { FamousPersonOfficialPhotoTarget } from './ReportFamousPersonPhotoAbuseModal.types';

type ReportFamousPersonPhotoAbuseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  photo: FamousPersonOfficialPhotoTarget | null;
  cityId: string;
  cityName: string;
  user: User | null;
  onOpenAuth?: () => void;
};

/** Wrapper legacy → modale unificato MF2 */
export const ReportFamousPersonPhotoAbuseModal = ({
  isOpen,
  onClose,
  photo,
  cityId,
  cityName,
  user,
  onOpenAuth,
}: ReportFamousPersonPhotoAbuseModalProps) => {
  if (!photo) return null;

  return (
    <ReportAbuseModal
      isOpen={isOpen}
      onClose={onClose}
      user={user}
      onOpenAuth={onOpenAuth}
      subtitle={cityName}
      allowEntityAbuse
      allowImageAbuse
      target={{
        entityType: 'city_person',
        entityId: photo.personId,
        cityId,
        entityName: photo.personName,
        imageUrl: photo.imageUrl,
        storageBucket: 'public-media',
        storagePath: photo.storagePath ?? null,
        sourceContext: 'official_photo',
        assignmentId: photo.assignmentId,
      }}
    />
  );
};
