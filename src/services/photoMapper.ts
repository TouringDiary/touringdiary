import { PhotoSubmission } from '../types/index';

/**
 * Mapper autoritativo per PhotoSubmission.
 * Centralizza il boundary tra DB e Dominio Photo.
 */
export const mapDbPhotoSubmission = (p: any): PhotoSubmission => {
    return {
        id: p.id,
        userId: p.user_id,
        user: p.user_name,
        locationName: p.location_name,
        description: p.description || undefined,
        url: p.image_url,
        status: p.status as 'pending' | 'approved' | 'rejected' | 'city_deleted',
        date: p.created_at,
        likes: p.likes || 0,
        updatedAt: p.updated_at || p.created_at,
        publishedAt: p.published_at,
        cityId: p.city_id || undefined,
        isOfficial: p.is_official ?? (p.user_id === '00000000-0000-0000-0000-000000000000'),
        mediaStatus: p.media_status ?? (p.image_url ? 'real' : 'missing')
    };
};
