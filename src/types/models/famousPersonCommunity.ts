/** Community / moderazione Famous Person (stack dedicato, non Patron). */

export type FamousPersonModerationStatus = 'pending' | 'in_review' | 'accepted' | 'rejected';

export type FamousPersonPhotoReportStatus = 'pending' | 'in_review' | 'photo_blocked' | 'rejected';

export type FamousPersonPhotoReportReason = 'copyright' | 'other_rights' | 'unauthorized' | 'other';

export type FamousPersonSuggestion = {
  id: string;
  userId: string;
  userName: string;
  cityId: string;
  cityName: string;
  suggestedName: string;
  notes: string;
  status: FamousPersonModerationStatus;
  adminNotes: string | null;
  acceptedPersonId: string | null;
  /** Stato editoriale del personaggio ufficiale collegato (se accepted). */
  acceptedPersonStatus?: 'draft' | 'published' | null;
  acceptedPersonImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FamousPersonPhotoSuggestion = {
  id: string;
  userId: string;
  userName: string;
  cityId: string;
  cityName: string;
  personId: string;
  personName: string;
  notes: string | null;
  rightsConfirmed: boolean;
  imageUrl: string;
  storagePath: string;
  status: FamousPersonModerationStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FamousPersonPhotoReport = {
  id: string;
  personId: string;
  personImageUrl: string;
  personImageStoragePath: string | null;
  reporterUserId: string | null;
  reporterUserName: string | null;
  cityId: string;
  cityName: string;
  personName: string;
  reason: FamousPersonPhotoReportReason;
  notes: string | null;
  status: FamousPersonPhotoReportStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  /** URL corrente ufficiale se ancora presente sul personaggio. */
  currentOfficialImageUrl?: string | null;
};

export const FAMOUS_PERSON_PHOTO_REPORT_REASON_LABELS: Record<
  FamousPersonPhotoReportReason,
  string
> = {
  copyright: 'Violazione del copyright',
  other_rights: 'Violazione di altri diritti',
  unauthorized: 'Contenuto utilizzato senza autorizzazione',
  other: 'Altro',
};

export const FAMOUS_PERSON_MODERATION_STATUS_LABELS: Record<FamousPersonModerationStatus, string> =
  {
    pending: 'Da gestire',
    in_review: 'In revisione',
    accepted: 'Accettata',
    rejected: 'Rifiutata',
  };

export const FAMOUS_PERSON_PHOTO_REPORT_STATUS_LABELS: Record<
  FamousPersonPhotoReportStatus,
  string
> = {
  pending: 'Da gestire',
  in_review: 'In revisione',
  photo_blocked: 'Foto bloccata',
  rejected: 'Segnalazione rifiutata',
};
