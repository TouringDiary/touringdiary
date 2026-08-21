/**
 * @deprecated Use `useCommunityPhotoPublish` from `@/hooks/photos/useCommunityPhotoPublish`.
 * Kept as a thin re-export for transitional imports.
 */
export {
  type CommunityPhotoMode as LiveFeedUploadMode,
  type CommunityPhotoPreview as LiveFeedUploadPreview,
  useCommunityPhotoPublish as useLiveFeedUpload,
} from '@/hooks/photos/useCommunityPhotoPublish';
