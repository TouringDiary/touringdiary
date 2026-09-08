/**
 * Smoke verification for FamousPerson completeness domain (no AI calls).
 * Run: npx tsx scripts/smoke-famous-person-completeness.ts
 */
import assert from 'node:assert/strict';
import {
  assertFamousPersonPublishable,
  canPublishFamousPerson,
  FamousPersonPublishBlockedError,
  getMissingFamousPersonFields,
  isFamousPersonComplete,
} from '../src/domain/city/famousPersonCompleteness.ts';

const complete = {
  name: 'Ada Lovelace',
  bio: 'Pioniera dell’informatica.',
  imageUrl: 'https://example.com/ada.jpg',
  specificCategoryIds: ['matematico'],
  birthYear: 1815,
  isLiving: false,
  deathYear: 1852,
};

const incompleteMissingExtras = {
  name: 'Ada Lovelace',
  bio: 'Pioniera dell’informatica.',
  imageUrl: 'https://example.com/ada.jpg',
};

assert.equal(isFamousPersonComplete(complete), true);
assert.equal(canPublishFamousPerson(complete), true);
assert.deepEqual(getMissingFamousPersonFields(incompleteMissingExtras).sort(), [
  'categories',
  'dates',
]);
assert.equal(isFamousPersonComplete(incompleteMissingExtras), false);
assert.equal(canPublishFamousPerson(incompleteMissingExtras), false);

assert.throws(
  () => assertFamousPersonPublishable(incompleteMissingExtras),
  (err: unknown) =>
    err instanceof FamousPersonPublishBlockedError &&
    err.missingFields.includes('categories') &&
    err.missingFields.includes('dates'),
);

assert.doesNotThrow(() => assertFamousPersonPublishable(complete));

// Empty / whitespace = missing
assert.deepEqual(
  getMissingFamousPersonFields({
    name: '  ',
    bio: 'y',
    imageUrl: 'z',
    specificCategoryIds: ['poeta'],
    birthYear: 1900,
    isLiving: true,
  }),
  ['name'],
);

// Living with death → dates gap
assert.ok(
  getMissingFamousPersonFields({
    name: 'X',
    bio: 'Y',
    imageUrl: 'Z',
    specificCategoryIds: ['poeta'],
    birthYear: 1970,
    isLiving: true,
    deathYear: 2000,
  }).includes('dates'),
);

// categories via categories array length
assert.equal(
  isFamousPersonComplete({
    name: 'X',
    bio: 'Y',
    imageUrl: 'Z',
    categories: [
      {
        specificId: 's1',
        specificSlug: 'poeta',
        specificLabel: 'Poeta',
        masterId: 'm1',
        masterSlug: 'letteratura',
        masterLabel: 'Letteratura',
        specificOrderIndex: 1,
        masterOrderIndex: 1,
        isActive: true,
      },
    ],
    birthYear: 1800,
    isLiving: true,
  }),
  true,
);

console.log('smoke-famous-person-completeness: OK');
