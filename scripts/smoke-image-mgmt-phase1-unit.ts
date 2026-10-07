/**

 * FASE 1 Image Management — unit smoke (D-22, toggle, city hero)

 * Eseguire: npx tsx --tsconfig tsconfig.app.json scripts/smoke-image-mgmt-phase1-unit.ts

 */

import { isPublicUsableImageAssetStatus } from '../src/constants/governance.ts';
import { resolveCityHeroDisplayUrl } from '../src/domain/city/resolveCityHeroDisplayUrl.ts';
import { isAssetEligibleForPublicUse } from '../src/domain/media/imagePublicationPolicy.ts';

import {
  poiHasHigherPriorityThanWikimedia,
  resolvePoiPublicImageByD22,
} from '../src/domain/poi/poiImageD22Resolver.ts';

const issues: string[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) issues.push(message);
}

assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: false,

    category: 'monument',

    assignments: [
      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'wikimedia',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/wm.jpg',
      },
    ],

    categoryPlaceholders: { monument: 'https://example.com/ph.png' },
  }).tier === 'placeholder',

  'toggle OFF → Wikimedia ignorato, placeholder',
);

assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: true,

    category: 'monument',

    assignments: [
      {
        assignmentRole: 'primary',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'admin',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/admin.jpg',
      },

      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'wikimedia',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/wm.jpg',
      },
    ],
  }).url === 'https://example.com/admin.jpg',

  'D-22 Admin batte Wikimedia',
);

assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: true,

    category: 'monument',

    assignments: [
      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'sponsor',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/sp.jpg',
      },

      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'wikimedia',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/wm.jpg',
      },
    ],
  }).url === 'https://example.com/sp.jpg',

  'D-22 Sponsor batte Wikimedia',
);

assert(
  poiHasHigherPriorityThanWikimedia({
    wikimediaPublicEnabled: true,

    category: 'monument',

    assignments: [
      {
        assignmentRole: 'primary',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'admin',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/a.jpg',
      },
    ],
  }),

  'guard orchestrator: admin presente',
);

assert(
  poiHasHigherPriorityThanWikimedia({
    wikimediaPublicEnabled: true,

    category: 'monument',

    assignments: [
      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'sponsor',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/sp-guard.jpg',
      },
    ],
  }),

  'guard poiHasHigherPriorityThanWikimedia: Sponsor active/current → true',
);

assert(
  !poiHasHigherPriorityThanWikimedia({
    wikimediaPublicEnabled: true,

    category: 'monument',

    assignments: [
      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'wikimedia',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/wm.jpg',
      },
    ],
  }),

  'guard: solo Wikimedia non blocca manual_api',
);

assert(
  resolveCityHeroDisplayUrl({
    adminHeroUrl: 'https://example.com/hero-admin.jpg',

    wikimediaHeroPublicEnabled: true,

    adminCandidates: [
      {
        originType: 'admin',
        isCurrent: true,
        assignmentStatus: 'active',
        assetStatus: 'active',
        wikimediaValidated: null,
        adminBlocked: false,
        publicUrl: 'https://example.com/hero-admin.jpg',
        stableId: 'admin-hero',
      },
    ],

    wikimediaGalleryCandidates: [
      {
        originType: 'wikimedia',
        isCurrent: true,
        assignmentStatus: 'active',
        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/wm.jpg',
      },
    ],
  }).tier === 'admin',

  'City hero: admin tier first',
);

assert(
  resolveCityHeroDisplayUrl({
    adminHeroUrl: 'https://example.com/raw-admin.jpg',
    wikimediaHeroPublicEnabled: true,
    wikimediaGalleryCandidates: [
      {
        originType: 'wikimedia',
        isCurrent: true,
        assignmentStatus: 'active',
        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,
        publicUrl: 'https://example.com/wm-after-raw.jpg',
      },
    ],
  }).url === 'https://example.com/wm-after-raw.jpg',
  'City hero: URL Admin grezzo senza candidato eleggibile non vince',
);

assert(
  resolveCityHeroDisplayUrl({
    adminHeroUrl: 'https://example.com/column-admin.jpg',
    adminColumnUrl: 'https://example.com/column-admin.jpg',
    wikimediaHeroPublicEnabled: true,
    wikimediaGalleryCandidates: [
      {
        originType: 'wikimedia',
        isCurrent: true,
        assignmentStatus: 'active',
        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,
        publicUrl: 'https://example.com/wm-under-column.jpg',
      },
    ],
  }).url === 'https://example.com/column-admin.jpg',
  'City hero: colonna hero_status real senza assignment vince su Wikimedia',
);

assert(
  resolveCityHeroDisplayUrl({
    adminHeroUrl: '',
    wikimediaHeroPublicEnabled: false,
    wikimediaGalleryCandidates: [],
    communityCandidates: [
      {
        originType: 'wikimedia',
        isCurrent: true,
        assignmentStatus: 'active',
        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,
        publicUrl: 'https://example.com/wm-as-community.jpg',
      },
    ],
    platformPlaceholderUrl: 'https://example.com/ph-bypass.png',
  }).tier === 'placeholder',
  'City hero: Wikimedia nel gruppo Community non aggira il toggle',
);

assert(
  resolveCityHeroDisplayUrl({
    adminHeroUrl: '',

    wikimediaHeroPublicEnabled: true,

    wikimediaGalleryCandidates: [
      {
        originType: 'wikimedia',
        isCurrent: true,
        assignmentStatus: 'active',
        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/wm.jpg',
      },
    ],
  }).tier === 'real_wikimedia',

  'City: nessun admin + WM ON → real_wikimedia',
);

assert(
  resolveCityHeroDisplayUrl({
    adminHeroUrl: '',

    wikimediaHeroPublicEnabled: false,

    wikimediaGalleryCandidates: [
      {
        originType: 'wikimedia',
        isCurrent: true,
        assignmentStatus: 'active',
        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/wm.jpg',
      },
    ],

    platformPlaceholderUrl: 'https://example.com/ph.png',
  }).tier === 'placeholder',

  'City toggle OFF → no WM hero',
);

assert(
  resolveCityHeroDisplayUrl({
    adminHeroUrl: '',

    wikimediaHeroPublicEnabled: false,

    wikimediaGalleryCandidates: [
      {
        originType: 'verified_real',
        isCurrent: true,
        assignmentStatus: 'active',
        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/vr.jpg',
      },

      {
        originType: 'wikimedia',
        isCurrent: true,
        assignmentStatus: 'active',
        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/wm.jpg',
      },
    ],
  }).url === 'https://example.com/vr.jpg',

  'City toggle OFF non esclude verified_real',
);

assert(
  resolveCityHeroDisplayUrl({
    adminHeroUrl: '',

    wikimediaHeroPublicEnabled: true,

    wikimediaGalleryCandidates: [
      {
        originType: 'wikimedia',

        isCurrent: true,
        assignmentStatus: 'suspended',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/wm.jpg',
      },
    ],

    platformPlaceholderUrl: 'https://example.com/ph.png',
  }).tier === 'placeholder',

  'City assignment inactive escluso',
);

assert(
  resolveCityHeroDisplayUrl({
    adminHeroUrl: '',

    wikimediaHeroPublicEnabled: true,

    wikimediaGalleryCandidates: [
      {
        originType: 'wikimedia',
        isCurrent: true,
        assignmentStatus: 'active',
        assetStatus: 'removed',
        wikimediaValidated: null,
        adminBlocked: false,

        publicUrl: 'https://example.com/wm.jpg',
      },
    ],

    platformPlaceholderUrl: 'https://example.com/ph.png',
  }).tier === 'placeholder',

  'City asset removed escluso',
);

assert(
  resolveCityHeroDisplayUrl({
    adminHeroUrl: '',

    wikimediaHeroPublicEnabled: true,

    wikimediaGalleryCandidates: [],

    platformPlaceholderUrl: null,
  }).tier === 'none',

  'City card imageUrl non usata come placeholder (none senza fonte)',
);

assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: true,

    category: 'monument',

    assignments: [
      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'wikimedia',

        assetStatus: 'removed',
        wikimediaValidated: null,
        adminBlocked: false,

        publicUrl: 'https://example.com/wm.jpg',
      },
    ],

    categoryPlaceholders: { monument: 'https://example.com/ph.png' },
  }).tier === 'placeholder',

  'POI asset non utilizzabile escluso',
);

assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: true,

    category: 'monument',

    assignments: [
      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'wikimedia',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/wm-a.jpg',

        stableId: 'asset-a',
      },

      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'wikimedia',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/wm-b.jpg',

        stableId: 'asset-b',
      },
    ],
  }).url === 'https://example.com/wm-a.jpg',

  'POI tie-break deterministico (stableId)',
);

assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: true,

    category: 'monument',

    assignments: [
      {
        assignmentRole: 'primary',

        assignmentStatus: 'active',

        isCurrent: false,

        originType: 'admin',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/stale.jpg',
      },

      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',

        isCurrent: true,

        originType: 'wikimedia',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/wm-current.jpg',
      },
    ],
  }).url === 'https://example.com/wm-current.jpg',

  'POI assignment non-current escluso',
);

assert(
  resolveCityHeroDisplayUrl({
    adminHeroUrl: '',

    wikimediaHeroPublicEnabled: false,

    wikimediaGalleryCandidates: [],

    communityCandidates: [
      {
        originType: 'community',
        isCurrent: true,
        assignmentStatus: 'active',
        assetStatus: 'active',
        wikimediaValidated: null,
        adminBlocked: false,
        publicUrl: 'https://example.com/community.jpg',
      },
    ],

    aiCandidates: [
      {
        originType: 'ai',
        isCurrent: true,
        assignmentStatus: 'active',
        assetStatus: 'active',
        wikimediaValidated: null,
        adminBlocked: false,
        publicUrl: 'https://example.com/ai.jpg',
      },
    ],
  }).tier === 'community',

  'City hero: Community sopra AI',
);

assert(
  resolveCityHeroDisplayUrl({
    adminHeroUrl: '',

    wikimediaHeroPublicEnabled: false,

    wikimediaGalleryCandidates: [],

    aiCandidates: [
      {
        originType: 'ai',
        isCurrent: true,
        assignmentStatus: 'active',
        assetStatus: 'active',
        wikimediaValidated: null,
        adminBlocked: false,
        publicUrl: 'https://example.com/ai.jpg',
      },
    ],

    platformPlaceholderUrl: 'https://example.com/ph.png',
  }).tier === 'ai',

  'City hero: AI sopra Placeholder',
);

assert(
  resolveCityHeroDisplayUrl({
    adminHeroUrl: '',

    wikimediaHeroPublicEnabled: true,

    wikimediaGalleryCandidates: [
      {
        originType: 'wikimedia',

        isCurrent: false,

        assignmentStatus: 'active',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/wm-stale.jpg',
      },
    ],

    platformPlaceholderUrl: 'https://example.com/ph.png',
  }).tier === 'placeholder',

  'City hero: isCurrent=false escluso',
);

assert(
  !poiHasHigherPriorityThanWikimedia({
    wikimediaPublicEnabled: true,

    category: 'monument',

    assignments: [
      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'sponsor',

        assetStatus: 'removed',
        wikimediaValidated: null,
        adminBlocked: false,

        publicUrl: 'https://example.com/sp-stale.jpg',
      },
    ],
  }),

  'Sponsor non utilizzabile non blocca Wikimedia (guard false)',
);

assert(
  !poiHasHigherPriorityThanWikimedia({
    wikimediaPublicEnabled: true,

    category: 'monument',

    assignments: [
      {
        assignmentRole: 'primary',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'admin',

        assetStatus: 'removed',
        wikimediaValidated: null,
        adminBlocked: false,

        publicUrl: 'https://example.com/admin-stale.jpg',
      },
    ],
  }),

  'Admin non utilizzabile non blocca Wikimedia (guard false)',
);

assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: false,

    category: 'monument',

    assignments: [
      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'verified_real',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/vr-poi.jpg',
      },

      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'wikimedia',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/wm.jpg',
      },
    ],

    categoryPlaceholders: { monument: 'https://example.com/ph.png' },
  }).url === 'https://example.com/vr-poi.jpg',

  'POI Wikimedia OFF + verified_real → verified_real resta utilizzabile',
);

assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: false,

    category: 'monument',

    assignments: [
      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'wikimedia',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/wm-only.jpg',
      },
    ],

    categoryPlaceholders: { monument: 'https://example.com/ph-poi.png' },
  }).tier === 'placeholder',

  'POI Wikimedia OFF + solo Wikimedia → fallback placeholder',
);

assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: true,

    category: 'monument',

    assignments: [
      {
        assignmentRole: 'gallery',

        assignmentStatus: 'suspended',
        isCurrent: true,
        originType: 'wikimedia',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/wm-susp.jpg',
      },
    ],

    categoryPlaceholders: { monument: 'https://example.com/ph.png' },
  }).tier === 'placeholder',

  'POI assignment suspended escluso',
);

assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: true,

    category: 'monument',

    assignments: [
      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'community',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/comm.jpg',
      },

      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'ai',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/ai.jpg',
      },
    ],

    categoryPlaceholders: { monument: 'https://example.com/ph.png' },
  }).url === 'https://example.com/comm.jpg',

  'POI Community → AI (gerarchia)',
);

assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: true,

    category: 'monument',

    assignments: [
      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'ai',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/ai-only.jpg',
      },
    ],

    categoryPlaceholders: { monument: 'https://example.com/ph-poi.png' },
  }).tier === 'ai',

  'POI AI sopra Placeholder quando assignment AI utilizzabile',
);

assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: true,

    category: 'monument',

    assignments: [],

    categoryPlaceholders: { monument: 'https://example.com/ph-poi.png' },
  }).tier === 'placeholder',

  'POI nessuna fonte → Placeholder',
);

assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: true,

    category: 'monument',

    assignments: [
      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'sponsor',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/sp-over-admin.jpg',
      },

      {
        assignmentRole: 'primary',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'admin',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/admin-under-sp.jpg',
      },
    ],
  }).url === 'https://example.com/sp-over-admin.jpg',

  'POI gerarchia: Sponsor sopra Admin',
);

assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: true,

    category: 'monument',

    assignments: [
      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'verified_real',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/vr-over-wm.jpg',
      },

      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'wikimedia',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/wm-under-vr.jpg',
      },
    ],
  }).url === 'https://example.com/vr-over-wm.jpg',

  'POI gerarchia: verified_real sopra Wikimedia',
);

assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: true,

    category: 'monument',

    assignments: [
      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'wikimedia',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/wm-over-comm.jpg',
      },

      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'community',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/comm-under-wm.jpg',
      },
    ],
  }).url === 'https://example.com/wm-over-comm.jpg',

  'POI gerarchia: Wikimedia sopra Community',
);

assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: true,

    category: 'monument',

    assignments: [
      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'sponsor',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/sp-over-vr.jpg',
      },

      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'verified_real',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/vr-under-sp.jpg',
      },
    ],
  }).url === 'https://example.com/sp-over-vr.jpg',

  'POI gerarchia: Sponsor sopra verified_real',
);

assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: true,

    category: 'monument',

    assignments: [
      {
        assignmentRole: 'primary',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'admin',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/admin-over-vr.jpg',
      },

      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'verified_real',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/vr-under-admin.jpg',
      },
    ],
  }).url === 'https://example.com/admin-over-vr.jpg',

  'POI gerarchia: Admin sopra verified_real',
);

assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: true,

    category: 'monument',

    assignments: [
      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'verified_real',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/vr-over-comm.jpg',
      },

      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'community',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/comm-under-vr.jpg',
      },
    ],
  }).url === 'https://example.com/vr-over-comm.jpg',

  'POI gerarchia: verified_real sopra Community',
);

assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: true,

    category: 'monument',

    assignments: [
      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'verified_real',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/vr-over-ai.jpg',
      },

      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'ai',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/ai-under-vr.jpg',
      },
    ],
  }).url === 'https://example.com/vr-over-ai.jpg',

  'POI gerarchia: verified_real sopra AI',
);

assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: true,

    category: 'monument',

    assignments: [
      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'verified_real',

        assetStatus: 'removed',
        wikimediaValidated: null,
        adminBlocked: false,

        publicUrl: 'https://example.com/vr-stale.jpg',
      },

      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'community',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/comm-after-vr.jpg',
      },
    ],

    categoryPlaceholders: { monument: 'https://example.com/ph.png' },
  }).url === 'https://example.com/comm-after-vr.jpg',

  'POI verified_real non utilizzabile → cascata Community',
);

assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: true,

    category: 'monument',

    assignments: [
      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'verified_real',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/vr-on.jpg',
      },

      {
        assignmentRole: 'gallery',

        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'wikimedia',

        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/wm-on.jpg',
      },
    ],
  }).url === 'https://example.com/vr-on.jpg',

  'POI Wikimedia ON: verified_real sopra Wikimedia',
);

assert(
  resolveCityHeroDisplayUrl({
    adminHeroUrl: 'https://example.com/admin-hero.jpg',

    wikimediaHeroPublicEnabled: true,

    adminCandidates: [
      {
        originType: 'admin',
        isCurrent: true,
        assignmentStatus: 'active',
        assetStatus: 'active',
        wikimediaValidated: null,
        adminBlocked: false,
        publicUrl: 'https://example.com/admin-hero.jpg',
        stableId: 'admin-over-vr',
      },
    ],

    wikimediaGalleryCandidates: [
      {
        originType: 'verified_real',
        isCurrent: true,
        assignmentStatus: 'active',
        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/vr-hero.jpg',
      },
    ],
  }).tier === 'admin',

  'City hero: Admin sopra verified_real',
);

assert(
  resolveCityHeroDisplayUrl({
    adminHeroUrl: 'https://example.com/admin-over-wm.jpg',

    wikimediaHeroPublicEnabled: true,

    adminCandidates: [
      {
        originType: 'admin_upload',
        isCurrent: true,
        assignmentStatus: 'restored',
        assetStatus: 'restored',
        wikimediaValidated: null,
        adminBlocked: false,
        publicUrl: 'https://example.com/admin-over-wm.jpg',
        stableId: 'admin-over-wm',
      },
    ],

    wikimediaGalleryCandidates: [
      {
        originType: 'wikimedia',
        isCurrent: true,
        assignmentStatus: 'active',
        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/wm-hero.jpg',
      },
    ],
  }).url === 'https://example.com/admin-over-wm.jpg',

  'City hero: Admin sopra Wikimedia',
);

assert(
  resolveCityHeroDisplayUrl({
    adminHeroUrl: '',

    wikimediaHeroPublicEnabled: true,

    wikimediaGalleryCandidates: [
      {
        originType: 'verified_real',
        isCurrent: true,
        assignmentStatus: 'active',
        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/vr-over-wm-hero.jpg',
      },

      {
        originType: 'wikimedia',
        isCurrent: true,
        assignmentStatus: 'active',
        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/wm-under-vr-hero.jpg',
      },
    ],
  }).url === 'https://example.com/vr-over-wm-hero.jpg',

  'City hero: verified_real sopra Wikimedia (toggle ON)',
);

assert(
  resolveCityHeroDisplayUrl({
    adminHeroUrl: '',

    wikimediaHeroPublicEnabled: true,

    wikimediaGalleryCandidates: [
      {
        originType: 'verified_real',
        isCurrent: true,
        assignmentStatus: 'active',
        assetStatus: 'removed',
        wikimediaValidated: null,
        adminBlocked: false,

        publicUrl: 'https://example.com/vr-stale-hero.jpg',
      },
    ],

    communityCandidates: [
      {
        originType: 'community',
        isCurrent: true,
        assignmentStatus: 'active',
        assetStatus: 'active',
        wikimediaValidated: null,
        adminBlocked: false,
        publicUrl: 'https://example.com/community-fallback.jpg',
      },
    ],

    platformPlaceholderUrl: 'https://example.com/ph.png',
  }).url === 'https://example.com/community-fallback.jpg',

  'City hero: verified_real non utilizzabile → Community',
);

assert(
  resolveCityHeroDisplayUrl({
    adminHeroUrl: '',

    wikimediaHeroPublicEnabled: true,

    wikimediaGalleryCandidates: [
      {
        originType: 'verified_real',
        isCurrent: false,
        assignmentStatus: 'active',
        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/vr-stale-current.jpg',
      },

      {
        originType: 'wikimedia',
        isCurrent: true,
        assignmentStatus: 'active',
        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,

        publicUrl: 'https://example.com/wm-current-hero.jpg',
      },
    ],
  }).url === 'https://example.com/wm-current-hero.jpg',

  'City hero: assignment non-current escluso',
);

// Policy applicativa: origin, wikimediaValidated e adminBlocked. Non è il gate SQL is_media_asset_publicly_usable.
assert(
  isAssetEligibleForPublicUse({
    originType: 'admin',
    assetStatus: 'active',
    wikimediaValidated: null,
    adminBlocked: false,
  }),
  'admin active senza flag wikimedia',
);
assert(
  !isAssetEligibleForPublicUse({
    originType: 'wikimedia',
    assetStatus: 'active',
    wikimediaValidated: false,
    adminBlocked: false,
  }),
  'wikimedia active non validata',
);
assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: true,
    category: 'monument',
    assignments: [
      {
        assignmentRole: 'gallery',
        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'wikimedia',
        assetStatus: 'active',
        wikimediaValidated: false,
        adminBlocked: false,
        publicUrl: 'https://example.com/pending.jpg',
      },
    ],
  }).url !== 'https://example.com/pending.jpg',
  'D-22 non pubblica Wikimedia non validata anche con toggle ON',
);
assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: true,
    category: 'monument',
    assignments: [
      {
        assignmentRole: 'gallery',
        assignmentStatus: 'restored',
        isCurrent: true,
        originType: 'admin',
        assetStatus: 'active',
        wikimediaValidated: null,
        adminBlocked: false,
        publicUrl: 'https://example.com/restored.jpg',
      },
    ],
  }).url === 'https://example.com/restored.jpg',
  'D-22 pubblica assignment RIPRISTINATO',
);
assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: true,
    category: 'monument',
    assignments: [
      {
        assignmentRole: 'gallery',
        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'admin',
        assetStatus: 'active',
        wikimediaValidated: null,
        adminBlocked: true,
        publicUrl: 'https://example.com/blocked.jpg',
      },
    ],
  }).url !== 'https://example.com/blocked.jpg',
  'D-22 nasconde il file con blocco Admin',
);
assert(
  !isAssetEligibleForPublicUse({
    originType: 'wikimedia',
    assetStatus: 'active',
    wikimediaValidated: true,
    adminBlocked: true,
  }),
  'blocco Admin esclude anche Wikimedia validata',
);
assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: true,
    category: 'monument',
    categoryPlaceholders: null,
    assignments: [
      {
        assignmentRole: 'primary',
        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'wikimedia',
        assetStatus: 'active',
        wikimediaValidated: true,
        adminBlocked: false,
        publicUrl: '',
      },
    ],
  }).tier !== 'real_wikimedia',
  'D-22 non pubblica Wikimedia con publicUrl vuoto',
);
assert(
  isPublicUsableImageAssetStatus('restored'),
  'assetStatus restored è pubblicamente utilizzabile',
);
assert(
  resolvePoiPublicImageByD22({
    wikimediaPublicEnabled: true,
    category: 'monument',
    assignments: [
      {
        assignmentRole: 'primary',
        assignmentStatus: 'active',
        isCurrent: true,
        originType: 'wikimedia',
        assetStatus: 'restored',
        wikimediaValidated: true,
        adminBlocked: false,
        publicUrl: 'https://example.com/wm-asset-restored.jpg',
      },
    ],
  }).url === 'https://example.com/wm-asset-restored.jpg',
  'D-22 pubblica assetStatus restored con assignment active',
);
assert(
  resolveCityHeroDisplayUrl({
    adminHeroUrl: '',
    wikimediaHeroPublicEnabled: true,
    wikimediaGalleryCandidates: [
      {
        originType: 'wikimedia',
        isCurrent: true,
        assignmentStatus: 'active',
        assetStatus: 'restored',
        wikimediaValidated: true,
        adminBlocked: false,
        publicUrl: 'https://example.com/hero-wm-restored.jpg',
      },
    ],
  }).url === 'https://example.com/hero-wm-restored.jpg',
  'City hero pubblica Wikimedia con assetStatus restored',
);

if (issues.length > 0) {
  console.error('smoke-image-mgmt-phase1-unit FAIL');

  for (const issue of issues) console.error(` - ${issue}`);

  process.exit(1);
}

console.log('smoke-image-mgmt-phase1-unit PASS');
