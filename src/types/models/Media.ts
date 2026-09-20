import type { MediaOriginTypeDb } from '@/constants/governance';
import type { Database } from '../supabase';
export type MediaStatus = Database['public']['Enums']['media_status'];

export interface MediaAsset {
  url: string;
  mediaStatus: MediaStatus;
  credit?: string;
  license?: 'own' | 'cc' | 'public' | 'copyright';
  /** MF3 — da media_assets.generated_by_ai / provenance (non euristica URL). */
  generatedByAi?: boolean;
  isPlaceholder?: boolean;
  originType?: MediaOriginTypeDb;
}

export interface PhotoSubmission {
  id: string;
  url: string;
  userId?: string;
  user: string;
  description?: string;
  locationName: string;
  date: string; // Created At (Ricezione)
  updatedAt?: string;
  publishedAt?: string; // NEW: Data Pubblicazione
  status: 'pending' | 'approved' | 'rejected' | 'city_deleted';
  likes?: number;
  /** Like dell'utente corrente (non aggregato). Popolato dai fetch community/ranking. */
  likedByUser?: boolean;
  cityId?: string; // ADDED: ID Città per collegamento robusto
  /** entity_image_assignments.id quando l'associazione MF2 è già materializzata. */
  assignmentId?: string | null;
  /** Bucket Storage sorgente (es. community-photos, public-media) — evidenza D70 / dual-write. */
  storageBucket?: string | null;
  /** Path Storage sorgente — evidenza D70 / dual-write. */
  storagePath?: string | null;
  isOfficial: boolean;
  mediaStatus: MediaStatus;
}

export interface NewsTickerItem {
  id: string;
  text: string;
  icon:
    | 'globe'
    | 'map'
    | 'sun'
    | 'camera'
    | 'users'
    | 'alert'
    | 'info'
    | 'calendar'
    | 'gift'
    | 'clock'
    | 'car'
    | 'megaphone';
  active: boolean;
  order?: number; // ADDED
}

export interface CommunityReply {
  id: string;
  authorId?: string;
  authorName: string;
  authorRole?: string;
  text: string;
  date: string;
  /**
   * Null/undefined = risposta diretta alla domanda (`community_posts`).
   * Valorizzato = risposta a un'altra `CommunityReply` sullo stesso post
   * (nesting illimitato via `parent_reply_id`; nessun tetto di profondità di dominio).
   */
  parentReplyId?: string | null;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
  authorAvatar?: string;
  text: string;
  cityId: string;
  cityName: string;
  date: string;
  likes: number;
  repliesCount: number;
  replies?: CommunityReply[];
}

export type NotificationType =
  | 'system'
  | 'reply_qa'
  | 'suggestion_approved'
  | 'reward_unlocked'
  | 'system_alert'
  | 'info'
  | 'collaboration';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  linkData?: {
    section: 'community' | 'trips' | 'rewards' | 'profile' | 'city' | 'collaboration';
    tab?: string;
    targetId?: string;
    poiId?: string;
    inviteId?: string;
    intent?: 'workspace' | 'myspace_viaggio';
    workspaceId?: string;
    /** Kind della Risorsa Condivisibile (notifiche collaborazione). */
    resourceKind?: 'diary' | 'suitcase' | 'user_template';
  };
}

// Suggestion Request (Moved here as it relates to community feedback)
import type { SuggestionType } from '../shared';

export type { SuggestionType } from '../shared';

export interface SuggestionRequest {
  id: string;
  userId: string;
  userName: string;
  cityId: string;
  cityName: string;
  poiId?: string;
  type: SuggestionType;
  status: 'pending' | 'processing' | 'approved' | 'rejected';
  date: string;
  lastUpdate?: string;
  closedAt?: string;
  details: {
    title: string;
    category: 'monument' | 'food' | 'hotel' | 'nature' | 'leisure' | 'discovery';
    description: string;
    address: string;
    website?: string;
    openingHours?: string;
    coords?: { lat: number; lng: number };
  };
  adminNotes?: string;
}
