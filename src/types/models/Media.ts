import { SuggestionType } from '../index';

import { Database } from '../supabase';
export type MediaStatus = Database['public']['Enums']['media_status'];

export interface MediaAsset {
    url: string;
    mediaStatus: MediaStatus;
    credit?: string;
    license?: 'own' | 'cc' | 'public' | 'copyright';
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
    cityId?: string; // ADDED: ID Città per collegamento robusto
    isOfficial: boolean; 
    mediaStatus: MediaStatus;
}

export interface NewsTickerItem {
    id: string;
    text: string;
    icon: 'globe' | 'map' | 'sun' | 'camera' | 'users' | 'alert' | 'info' | 'calendar' | 'gift' | 'clock' | 'car' | 'megaphone';
    active: boolean;
    order?: number; // ADDED
}


export interface CommunityReply {
    id: string;
    authorName: string;
    authorRole?: string;
    text: string;
    date: string;
    likes: number;
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

export type NotificationType = 'system' | 'reply_qa' | 'suggestion_approved' | 'reward_unlocked' | 'system_alert' | 'info';

export interface AppNotification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    date: string;
    isRead: boolean;
    linkData?: {
        section: 'community' | 'trips' | 'rewards' | 'profile' | 'city';
        tab?: string;
        targetId?: string;
        poiId?: string;
    };
}

// Suggestion Request (Moved here as it relates to community feedback)
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
        category: 'monument' | 'food' | 'hotel' | 'nature' | 'leisure';
        description: string;
        address: string;
        website?: string;
        openingHours?: string;
        coords?: { lat: number, lng: number };
    };
    adminNotes?: string; 
}
