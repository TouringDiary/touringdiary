import type { PlatformAudience, FeatureFlagEvaluationContext } from '@/types/platformControl';
import type { UserRole } from '@/types/users';

/** Maps app roles to platform audience identifiers (DOC 30). */
export function resolveAudiencesForContext(ctx: FeatureFlagEvaluationContext): PlatformAudience[] {
    const audiences: PlatformAudience[] = [];

    if (!ctx.isAuthenticated) {
        audiences.push('public');
        return audiences;
    }

    audiences.push('registered');

    switch (ctx.userRole) {
        case 'admin_all':
            audiences.push('admin_all', 'admin_limited', 'business');
            break;
        case 'admin_limited':
            audiences.push('admin_limited');
            break;
        case 'business':
            audiences.push('business');
            break;
        default:
            break;
    }

    return audiences;
}

export function isAdminAllExempt(userRole: UserRole | null): boolean {
    return userRole === 'admin_all';
}

export function isAudienceBlocked(
    flagAudiences: PlatformAudience[],
    blockedAudiences: PlatformAudience[],
    ctx: FeatureFlagEvaluationContext
): boolean {
    if (isAdminAllExempt(ctx.userRole)) {
        return false;
    }

    const userAudiences = resolveAudiencesForContext(ctx);

    if (flagAudiences.length > 0) {
        const allowed = flagAudiences.some((a) => userAudiences.includes(a));
        if (!allowed) {
            return true;
        }
    }

    if (blockedAudiences.length > 0) {
        return blockedAudiences.some((a) => userAudiences.includes(a));
    }

    return false;
}
