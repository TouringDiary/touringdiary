/**
 * Contract tests for mergePeopleSuggestPromptContract (CulturePeople discovery prompt).
 * Keep in sync with `mergePeopleSuggestPromptContract` in src/data/ai/prompts.ts.
 * Run: node scripts/_test_people_suggest_prompt_contract.mjs
 */

const PEOPLE_CATEGORIES_SENTINEL = '\u0000__PEOPLE_CATEGORIES_BLOCK__\u0000';
const PEOPLE_SCHEMA_SENTINEL = '\u0000__PEOPLE_SCHEMA_HINT__\u0000';
const PEOPLE_LEGACY_CATEGORIES_HEADERS = [
  'STANDARD CATEGORIE (slug ammessi):',
  'STANDARD CATEGORIE:',
];
const PEOPLE_LEGACY_SCHEMA_HEADER = 'SCHEMA JSON OBBLIGATORIO';
const PEOPLE_LEGACY_OUTPUT_CUE = 'OUTPUT JSON ARRAY';

function indexOfLineStartMarker(text, marker, from = 0) {
  let searchFrom = from;
  while (searchFrom <= text.length) {
    const idx = text.indexOf(marker, searchFrom);
    if (idx === -1) return -1;
    if (idx === 0 || text.charAt(idx - 1) === '\n') return idx;
    searchFrom = idx + marker.length;
  }
  return -1;
}

function findEarliestStop(text, from, stopMarkers) {
  let end = null;
  for (const stop of stopMarkers) {
    const idx = indexOfLineStartMarker(text, stop, from);
    if (idx !== -1 && (end === null || idx < end)) end = idx;
  }
  return end;
}

function hasUndelimitedLegacyContractBlock(text, headers, stopMarkers) {
  for (const header of headers) {
    let searchFrom = 0;
    for (let i = 0; i < 32; i++) {
      const start = indexOfLineStartMarker(text, header, searchFrom);
      if (start === -1) break;
      const blockEnd = findEarliestStop(text, start + header.length, stopMarkers);
      if (blockEnd === null) return true;
      searchFrom = start + header.length;
    }
  }
  return false;
}

function stripPeopleDiscoveryMarkedBlocks(text, startMarker, stopMarkers) {
  let result = text;
  let searchFrom = 0;
  for (let i = 0; i < 32; i++) {
    const start = indexOfLineStartMarker(result, startMarker, searchFrom);
    if (start === -1) break;
    const end = findEarliestStop(result, start + startMarker.length, stopMarkers);
    if (end === null) {
      searchFrom = start + startMarker.length;
      continue;
    }
    result = `${result.slice(0, start)}${result.slice(end)}`;
    searchFrom = start;
  }
  return result;
}

function stripLegacyPeopleCategoriesBlocks(text, stopMarkers) {
  let result = text;
  for (const header of PEOPLE_LEGACY_CATEGORIES_HEADERS) {
    result = stripPeopleDiscoveryMarkedBlocks(result, header, stopMarkers);
  }
  return result;
}

function mergePeopleSuggestPromptContract(params) {
  const categoriesBlock = params.categoriesBlock.trim();
  const schemaHint = params.schemaHint.trim();

  let tpl = params.template;
  const hadCategoriesPlaceholder = tpl.includes('{categoriesBlock}');
  const hadSchemaPlaceholder = tpl.includes('{schemaHint}');

  if (hadCategoriesPlaceholder) {
    tpl = tpl.replaceAll('{categoriesBlock}', PEOPLE_CATEGORIES_SENTINEL);
  }
  if (hadSchemaPlaceholder) {
    tpl = tpl.replaceAll('{schemaHint}', PEOPLE_SCHEMA_SENTINEL);
  }

  tpl = tpl
    .replaceAll('{cityName}', params.cityName)
    .replaceAll('{count}', String(params.count))
    .replaceAll('{contextStr}', params.contextStr)
    .replaceAll('{exclusionStr}', params.exclusionStr);

  const categoryStopMarkers = [
    PEOPLE_LEGACY_SCHEMA_HEADER,
    PEOPLE_LEGACY_OUTPUT_CUE,
    PEOPLE_SCHEMA_SENTINEL,
    PEOPLE_CATEGORIES_SENTINEL,
  ];
  const schemaStopMarkers = [
    ...PEOPLE_LEGACY_CATEGORIES_HEADERS,
    PEOPLE_LEGACY_OUTPUT_CUE,
    PEOPLE_CATEGORIES_SENTINEL,
    PEOPLE_SCHEMA_SENTINEL,
  ];

  tpl = stripLegacyPeopleCategoriesBlocks(tpl, categoryStopMarkers);
  tpl = stripPeopleDiscoveryMarkedBlocks(tpl, PEOPLE_LEGACY_SCHEMA_HEADER, schemaStopMarkers);

  const legacyCategoriesUndelimited = hasUndelimitedLegacyContractBlock(
    tpl,
    PEOPLE_LEGACY_CATEGORIES_HEADERS,
    categoryStopMarkers,
  );
  const legacySchemaUndelimited = hasUndelimitedLegacyContractBlock(
    tpl,
    [PEOPLE_LEGACY_SCHEMA_HEADER],
    schemaStopMarkers,
  );

  if (hadCategoriesPlaceholder) {
    tpl = tpl.replaceAll(PEOPLE_CATEGORIES_SENTINEL, categoriesBlock);
  } else if (!legacyCategoriesUndelimited && !tpl.includes(categoriesBlock)) {
    tpl = `${tpl.trimEnd()}\n\n${categoriesBlock}`;
  }

  if (hadSchemaPlaceholder) {
    tpl = tpl.replaceAll(PEOPLE_SCHEMA_SENTINEL, schemaHint);
  } else if (!legacySchemaUndelimited && !tpl.includes(schemaHint)) {
    tpl = `${tpl.trimEnd()}\n\n${schemaHint}`;
  }

  return tpl.replace(/\n{3,}/g, '\n\n').trim();
}

const categoriesBlock =
  'STANDARD CATEGORIE (slug ammessi):\nTeatro e cinema (teatro_cinema): Attore [attore], Regista [regista]';
const schemaHint = `
SCHEMA JSON OBBLIGATORIO (ogni personaggio):
{
  "name": "string",
  "bio": "string",
  "specificCategorySlugs": ["slug_specifica_attiva"]
}
REGOLE:
- Usa SOLO slug presenti nello STANDARD CATEGORIE sotto; non inventare slug.
`.trim();

/** Production (DB + fallback). */
const productionCurrent =
  'TASK: Trova {count} personaggi famosi storici o contemporanei legati a {cityName}. {contextStr}. ESCLUDI: {exclusionStr}. Regola Date: YYYY-YYYY.\n{categoriesBlock}\n{schemaHint}\nOUTPUT JSON ARRAY.';

const onlyCategoriesPh =
  'TASK: Trova {count} a {cityName}.\n{categoriesBlock}\nOUTPUT JSON ARRAY.';

const onlySchemaPh = 'TASK: Trova {count} a {cityName}.\n{schemaHint}\nOUTPUT JSON ARRAY.';

const conflictingLegacy = `TASK: Trova {count} personaggi legati a {cityName}. {contextStr} {exclusionStr}
STANDARD CATEGORIE (slug ammessi):
Cinema: cinema-e-spettacolo, produzione-cinematografica
SCHEMA JSON OBBLIGATORIO (ogni personaggio):
{ "role": "string", "name": "string" }
OUTPUT JSON ARRAY.`;

const malformedUndelimited = `TASK: Trova {count} personaggi a {cityName}. Istruzione A da preservare.
STANDARD CATEGORIE (slug ammessi):
Cinema: cinema-e-spettacolo
Istruzione B critica da non cancellare mai.`;

const criticalUndelimitedTaxonomy = `TASK: Trova {count} a {cityName}.
STANDARD CATEGORIE:
vecchia categoria A
vecchia categoria B`;

const outputJsonInsideBlock = `TASK: Trova {count} a {cityName}.
STANDARD CATEGORIE (slug ammessi):
Cinema: cinema-e-spettacolo
Nota interna: usa OUTPUT JSON per i campi numerici del blocco categorie.
Musica: produzione-cinematografica
SCHEMA JSON OBBLIGATORIO (ogni personaggio):
{ "role": "string" }
OUTPUT JSON ARRAY.`;

const proseMarkers =
  'TASK: Trova {count} a {cityName}. Rispetta lo STANDARD CATEGORIE ufficiale e lo SCHEMA JSON OBBLIGATORIO descritto in documentazione; il risultato è in OUTPUT JSON. OUTPUT JSON ARRAY.';

const productionLegacy =
  'TASK: Trova {count} personaggi famosi storici o contemporanei legati a {cityName}. {contextStr}. ESCLUDI: {exclusionStr}. Regola Date: YYYY-YYYY. OUTPUT JSON ARRAY.';

const legacySchemaDelimited = `TASK: Trova {count} a {cityName}.
SCHEMA JSON OBBLIGATORIO (ogni personaggio):
{ "role": "string", "name": "string" }
OUTPUT JSON ARRAY.`;

const duplicateLegacyHeaders = `TASK: {count} {cityName}
STANDARD CATEGORIE (slug ammessi):
old1
SCHEMA JSON OBBLIGATORIO (x):
{ "role": "a" }
STANDARD CATEGORIE:
old2
OUTPUT JSON ARRAY.`;

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    failed += 1;
  }
}

function countOccurrences(haystack, needle) {
  let n = 0;
  let i = 0;
  while (true) {
    const found = haystack.indexOf(needle, i);
    if (found === -1) return n;
    n += 1;
    i = found + needle.length;
  }
}

function assertVars(result, label, city, count, context, exclusion) {
  assert(result.includes(String(count)), `${label}: count substituted`);
  assert(result.includes(city), `${label}: cityName substituted`);
  if (context) assert(result.includes(context), `${label}: contextStr substituted`);
  if (exclusion) assert(result.includes(exclusion), `${label}: exclusionStr substituted`);
  assert(!result.includes('{cityName}'), `${label}: no {cityName}`);
  assert(!result.includes('{count}'), `${label}: no {count}`);
}

function assertCanonicalOnce(result, label) {
  assert(result.includes(categoriesBlock), `${label}: exact categoriesBlock`);
  assert(result.includes(schemaHint), `${label}: exact schemaHint`);
  assert(countOccurrences(result, categoriesBlock) === 1, `${label}: categoriesBlock once`);
  assert(countOccurrences(result, schemaHint) === 1, `${label}: schemaHint once`);
  assert(!result.includes('{categoriesBlock}'), `${label}: no categories ph`);
  assert(!result.includes('{schemaHint}'), `${label}: no schema ph`);
  assert(!result.includes('"role"'), `${label}: no legacy role field`);
}

function assertNoDualCategoriesContract(result, label) {
  const hasCanonical = result.includes(categoriesBlock);
  const hasLegacySlug =
    result.includes('cinema-e-spettacolo') ||
    result.includes('vecchia categoria A') ||
    result.includes('vecchia categoria B');
  assert(!(hasCanonical && hasLegacySlug), `${label}: no legacy slug + canonical categories together`);
}

// 1–3 moderno / placeholder singoli / entrambi
const fromBoth = mergePeopleSuggestPromptContract({
  template: productionCurrent,
  cityName: 'Torre del Greco',
  count: 3,
  contextStr: 'FOCUS UTENTE: "cinema"',
  exclusionStr: '',
  categoriesBlock,
  schemaHint,
});
assertCanonicalOnce(fromBoth, '1-both-placeholders');
assertVars(fromBoth, '1-both', 'Torre del Greco', 3, 'FOCUS UTENTE: "cinema"', '');

const fromCatPh = mergePeopleSuggestPromptContract({
  template: onlyCategoriesPh,
  cityName: 'Napoli',
  count: 2,
  contextStr: '',
  exclusionStr: '',
  categoriesBlock,
  schemaHint,
});
assert(fromCatPh.includes(categoriesBlock), '2-categories-ph');
assert(!fromCatPh.includes('{categoriesBlock}'), '2-categories-ph replaced');
assert(fromCatPh.includes(schemaHint), '2-schema appended');

const fromSchPh = mergePeopleSuggestPromptContract({
  template: onlySchemaPh,
  cityName: 'Napoli',
  count: 2,
  contextStr: '',
  exclusionStr: '',
  categoriesBlock,
  schemaHint,
});
assert(fromSchPh.includes(schemaHint), '3-schema-ph');
assert(fromSchPh.includes(categoriesBlock), '3-categories appended');

// 4 legacy delimitato
const fromDelimited = mergePeopleSuggestPromptContract({
  template: conflictingLegacy,
  cityName: 'Napoli',
  count: 2,
  contextStr: '',
  exclusionStr: '',
  categoriesBlock,
  schemaHint,
});
assertCanonicalOnce(fromDelimited, '4-delimited-legacy');
assert(!fromDelimited.includes('cinema-e-spettacolo'), '4: legacy slug removed');

// 5 legacy non delimitabile — nessun append canonico categorie, testo intatto
const fromUndelimited = mergePeopleSuggestPromptContract({
  template: malformedUndelimited,
  cityName: 'Caserta',
  count: 4,
  contextStr: '',
  exclusionStr: '',
  categoriesBlock,
  schemaHint,
});
assertVars(fromUndelimited, '5-undelimited', 'Caserta', 4, '', '');
assert(fromUndelimited.includes('Istruzione A da preservare'), '5: instruction A kept');
assert(fromUndelimited.includes('Istruzione B critica da non cancellare mai'), '5: instruction B kept');
assert(fromUndelimited.includes('STANDARD CATEGORIE (slug ammessi):\nCinema: cinema-e-spettacolo'), '5: legacy block intact');
assert(!fromUndelimited.includes(categoriesBlock), '5: canonical categories NOT appended (no dual contract)');
assert(!fromUndelimited.includes('[attore]'), '5: no runtime taxonomy slug');
assert(fromUndelimited.includes(schemaHint), '5: schema appended (schema legacy absent)');
assertNoDualCategoriesContract(fromUndelimited, '5-undelimited');

const fromCritical = mergePeopleSuggestPromptContract({
  template: criticalUndelimitedTaxonomy,
  cityName: 'Salerno',
  count: 1,
  contextStr: '',
  exclusionStr: '',
  categoriesBlock,
  schemaHint,
});
assert(fromCritical.includes('STANDARD CATEGORIE:\nvecchia categoria A'), '5b: legacy suffix intact');
assert(!fromCritical.includes(categoriesBlock), '5b: no canonical categories (undelimited)');
assert(fromCritical.includes(schemaHint), '5b: schema appended');
assertNoDualCategoriesContract(fromCritical, '5b-critical');

// 6 nessun blocco legacy
const fromPlain = mergePeopleSuggestPromptContract({
  template: productionLegacy,
  cityName: 'Torre del Greco',
  count: 3,
  contextStr: 'FOCUS UTENTE: "cinema"',
  exclusionStr: '',
  categoriesBlock,
  schemaHint,
});
assertCanonicalOnce(fromPlain, '6-no-legacy');

// 7 marker multipli delimitati
const fromDup = mergePeopleSuggestPromptContract({
  template: duplicateLegacyHeaders,
  cityName: 'X',
  count: 1,
  contextStr: '',
  exclusionStr: '',
  categoriesBlock,
  schemaHint,
});
assert(fromDup.includes(categoriesBlock), '7: canonical present');
assert(!fromDup.includes('old1'), '7: first legacy block removed');
assert(!fromDup.includes('old2'), '7: second legacy block removed');

// 8 prosa mid-line (non blocchi)
const fromProse = mergePeopleSuggestPromptContract({
  template: proseMarkers,
  cityName: 'Salerno',
  count: 1,
  contextStr: '',
  exclusionStr: '',
  categoriesBlock,
  schemaHint,
});
assertCanonicalOnce(fromProse, '8-prose');
assert(
  fromProse.includes(
    'Rispetta lo STANDARD CATEGORIE ufficiale e lo SCHEMA JSON OBBLIGATORIO descritto in documentazione',
  ),
  '8: prose preserved',
);

// 9 OUTPUT JSON mid-content non chiude prematuramente
const fromMidOutput = mergePeopleSuggestPromptContract({
  template: outputJsonInsideBlock,
  cityName: 'Salerno',
  count: 1,
  contextStr: '',
  exclusionStr: '',
  categoriesBlock,
  schemaHint,
});
assertCanonicalOnce(fromMidOutput, '9-mid-output-json');
assert(!fromMidOutput.includes('cinema-e-spettacolo'), '9: legacy removed via SCHEMA stop');
assert(!fromMidOutput.includes('produzione-cinematografica'), '9: no early OUTPUT JSON stop');

// schema legacy delimitato
const fromSchemaLegacy = mergePeopleSuggestPromptContract({
  template: legacySchemaDelimited,
  cityName: 'Napoli',
  count: 2,
  contextStr: '',
  exclusionStr: '',
  categoriesBlock,
  schemaHint,
});
assert(fromSchemaLegacy.includes(categoriesBlock), 'schema-legacy: categories appended');
assert(countOccurrences(fromSchemaLegacy, schemaHint) === 1, 'schema-legacy: schema once');

if (failed) {
  console.error(`FAILED: ${failed}`);
  process.exit(1);
}
console.log('OK: people suggest prompt contract (full merge matrix)');
