/**
 * MF3 — smoke statico governance + AI defaults
 * (no DB live, no path alias).
 * Eseguire: npm run mf3:smoke
 */

import {
  IMAGE_ASSET_STATUS_LABELS,
  isPublicUsableImageAssetStatus,
} from '../src/constants/governance';
import {
  AI_IMAGE_STEP_DEFAULT_BY_ENTITY,
  getDefaultAiImageStepForEntity,
  isAiImageGenerationAllowed,
} from '../src/services/ai/aiImageStepConfig';

const issues: string[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) issues.push(message);
}

assert(getDefaultAiImageStepForEntity('city_person') === 'yes', 'Personaggio default SI');
assert(getDefaultAiImageStepForEntity('patron') === 'no', 'Patrono default NO');
assert(getDefaultAiImageStepForEntity('poi') === 'no', 'POI default NO');
assert(
  isAiImageGenerationAllowed('patron', AI_IMAGE_STEP_DEFAULT_BY_ENTITY.patron) === false,
  'Patrono AI off by default',
);

assert(IMAGE_ASSET_STATUS_LABELS.verify_ai_image === 'VERIFICARE IMMAGINE AI', 'verify label');
assert(isPublicUsableImageAssetStatus('active'), 'active usable');
assert(isPublicUsableImageAssetStatus('restored'), 'restored usable');
assert(!isPublicUsableImageAssetStatus('suspended'), 'suspended not usable');
assert(!isPublicUsableImageAssetStatus('replaced'), 'replaced not usable');
assert(!isPublicUsableImageAssetStatus('removed'), 'removed not usable');
assert(!isPublicUsableImageAssetStatus('verify_ai_image'), 'verify_ai_image not public');

if (issues.length > 0) {
  console.error('[smoke-mf3-image-management] FAILED');
  for (const issue of issues) console.error(`  - ${issue}`);
  process.exit(1);
}

console.log('[smoke-mf3-image-management] OK — MF3 governance + AI step defaults');
