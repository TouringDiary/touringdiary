/** Foto ufficiale Patrono / Festa Patronale (`city_patron_gallery`). */
export type CityPatronGalleryPhoto = {
  id: string;
  cityId: string;
  /** entity_image_assignments.id quando disponibile (dual-write §42.15). */
  assignmentId?: string | null;
  imageUrl: string;
  storagePath: string | null;
  /** Didascalia opzionale; `created_at` resta il timestamp di creazione/caricamento. */
  caption: string | null;
  sortOrder: number;
  createdAt: string;
  sourceSuggestionItemId?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
};

export type PatronPhotoSuggestionStatus = 'pending' | 'in_review' | 'accepted' | 'rejected';

/** Status per-item (moderazione singola foto). Distinto dalla suggestion. */
export type PatronPhotoSuggestionItemStatus = 'pending' | 'approved' | 'rejected';

export type PatronPhotoSuggestionItem = {
  id: string;
  suggestionId: string;
  imageUrl: string;
  storagePath: string;
  status: PatronPhotoSuggestionItemStatus;
  sortOrder: number;
  createdAt: string;
};

export type PatronPhotoSuggestion = {
  id: string;
  userId: string;
  userName: string;
  cityId: string;
  cityName: string;
  patronName: string;
  notes: string | null;
  rightsConfirmed: boolean;
  status: PatronPhotoSuggestionStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  items: PatronPhotoSuggestionItem[];
};

export type PatronPhotoReportReason = 'copyright' | 'other_rights' | 'unauthorized' | 'other';

export type PatronPhotoReportStatus = 'pending' | 'in_review' | 'photo_blocked' | 'rejected';

export type PatronPhotoReport = {
  id: string;
  galleryPhotoId: string | null;
  galleryImageUrl: string;
  galleryStoragePath: string | null;
  reporterUserId: string | null;
  reporterUserName: string | null;
  cityId: string;
  cityName: string;
  patronName: string;
  reason: PatronPhotoReportReason;
  notes: string | null;
  status: PatronPhotoReportStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  /** Populated in admin detail views when la foto gallery esiste ancora */
  galleryPhotoUrl?: string;
};

export const PATRON_PHOTO_REPORT_REASON_LABELS: Record<PatronPhotoReportReason, string> = {
  copyright: 'Violazione del copyright',
  other_rights: 'Violazione di altri diritti',
  unauthorized: 'Contenuto utilizzato senza autorizzazione',
  other: 'Altro',
};
