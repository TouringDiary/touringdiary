import type { User } from '@/types/users';
import { ReportAbuseModal } from './ReportAbuseModal';

export type CommunityPhotoAbuseContext = 'community_live' | 'city_gallery';

export type CommunityPhotoAbuseTarget = {
  /** photo_submission.id — entity_id canonico nel content_report MF2. */
  photoId: string;
  /** entity_image_assignments.id reale; non sostituibile con photoId, URL o storagePath. */
  assignmentId: string | null;
  cityId: string;
  cityName: string;
  imageUrl: string;
  storageBucket?: string | null;
  storagePath?: string | null;
  caption?: string | null;
};

type CommunityPhotoAbuseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  target: CommunityPhotoAbuseTarget | null;
  context: CommunityPhotoAbuseContext;
  user: User | null;
  onOpenAuth?: () => void;
};

export const CommunityPhotoAbuseModal = ({
  isOpen,
  onClose,
  target,
  context,
  user,
  onOpenAuth,
}: CommunityPhotoAbuseModalProps) => {
  return (
    <ReportAbuseModal
      isOpen={isOpen}
      onClose={onClose}
      user={user}
      onOpenAuth={onOpenAuth}
      allowEntityAbuse={false}
      allowImageAbuse
      subtitle={
        context === 'community_live'
          ? 'Foto Community — Live Feed'
          : 'Foto Community — Galleria città'
      }
      target={
        target
          ? {
              entityType: 'photo_submission',
              entityId: target.photoId,
              cityId: target.cityId,
              entityName: target.caption?.trim() || target.cityName,
              imageUrl: target.imageUrl,
              storageBucket: target.storageBucket ?? 'community-photos',
              storagePath: target.storagePath ?? null,
              sourceContext: context,
              assignmentId: target.assignmentId ?? null,
            }
          : null
      }
    />
  );
};
