/**
 * DOC-38 §S.3 / §9.5 — Bundle audit report (temporaneo, rimovibile).
 *
 * Legge dist/, elenca chunk con byte + gzip offline, stampa sezioni markdown.
 * Nessun HTML / grafico. Nessuna modifica runtime.
 *
 * Uso:
 *   node scripts/_bundle_audit_report.mjs
 *   node scripts/_bundle_audit_report.mjs --out=path.txt
 *   node scripts/_bundle_audit_report.mjs --top=25
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

function parseArgs(argv) {
  let out = null;
  let top = 25;
  for (const a of argv) {
    if (a.startsWith('--out=')) out = a.slice('--out='.length);
    if (a.startsWith('--top=')) top = Math.max(1, Number(a.slice('--top='.length)) || 25);
  }
  return { out, top };
}

function walkFiles(dir, base = dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walkFiles(full, base, acc);
    else acc.push({ abs: full, rel: path.relative(base, full).replace(/\\/g, '/') });
  }
  return acc;
}

function loadManifest() {
  const candidates = [
    path.join(DIST, '.vite', 'manifest.json'),
    path.join(DIST, 'manifest.json'),
  ];
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    try {
      return { path: p, data: JSON.parse(fs.readFileSync(p, 'utf8')) };
    } catch {
      return { path: p, data: null };
    }
  }
  return { path: null, data: null };
}

/**
 * Classifica quando_caricato da manifest Vite (se presente).
 * @returns {Map<string, { quando: string, importers: string[], isEntry: boolean, evidence: string }>}
 */
function classifyFromManifest(manifest) {
  /** @type {Map<string, { quando: string, importers: string[], isEntry: boolean, evidence: string }>} */
  const map = new Map();
  if (!manifest || typeof manifest !== 'object') return map;

  /** @type {Set<string>} */
  const entryFiles = new Set();
  /** @type {Set<string>} */
  const dynamicFiles = new Set();
  /** @type {Map<string, string[]>} */
  const importedBy = new Map();
  /** @type {Map<string, string[]>} */
  const dynamicImportedBy = new Map();

  for (const [key, value] of Object.entries(manifest)) {
    if (!value || typeof value !== 'object') continue;
    const file = value.file;
    if (typeof file !== 'string') continue;

    if (value.isEntry) entryFiles.add(file);

    const imports = Array.isArray(value.imports) ? value.imports : [];
    for (const impKey of imports) {
      const imp = manifest[impKey];
      const impFile = imp?.file;
      if (!impFile) continue;
      if (!importedBy.has(impFile)) importedBy.set(impFile, []);
      importedBy.get(impFile).push(key);
    }

    const dyn = Array.isArray(value.dynamicImports) ? value.dynamicImports : [];
    for (const dynKey of dyn) {
      const d = manifest[dynKey];
      if (!d?.file) continue;
      dynamicFiles.add(d.file);
      if (!dynamicImportedBy.has(d.file)) dynamicImportedBy.set(d.file, []);
      dynamicImportedBy.get(d.file).push(key);
    }
  }

  /** Expand Rollup `imports` closure from a set of root files. */
  function expandImportsClosure(roots) {
    /** @type {Set<string>} */
    const closure = new Set(roots);
    let grew = true;
    while (grew) {
      grew = false;
      for (const value of Object.values(manifest)) {
        if (!value?.file || !closure.has(value.file)) continue;
        for (const impKey of value.imports || []) {
          const impFile = manifest[impKey]?.file;
          if (impFile && !closure.has(impFile)) {
            closure.add(impFile);
            grew = true;
          }
        }
      }
    }
    return closure;
  }

  const syncClosure = expandImportsClosure(entryFiles);
  const asyncClosure = expandImportsClosure(dynamicFiles);

  const allFiles = new Set([
    ...entryFiles,
    ...dynamicFiles,
    ...syncClosure,
    ...asyncClosure,
    ...Object.values(manifest)
      .map((v) => v?.file)
      .filter(Boolean),
  ]);

  for (const file of allFiles) {
    const inSync = entryFiles.has(file) || syncClosure.has(file);
    const inAsync = dynamicFiles.has(file) || asyncClosure.has(file);
    let quando = 'NON DIMOSTRABILE';
    if (inSync) quando = 'entry-sync';
    else if (inAsync) quando = 'dynamic-import';

    let importers;
    if (entryFiles.has(file)) {
      importers = ['ENTRY (index.html / isEntry)'];
    } else if (dynamicImportedBy.has(file)) {
      importers = dynamicImportedBy.get(file) ?? [];
    } else {
      importers = importedBy.get(file) ?? [];
    }

    map.set(file, {
      quando,
      importers,
      isEntry: entryFiles.has(file),
      evidence: 'DIMOSTRATA DAL BUILD',
    });
  }

  return map;
}

function emit(lines, text) {
  lines.push(text);
}

function main() {
  const { out, top } = parseArgs(process.argv.slice(2));
  /** @type {string[]} */
  const lines = [];
  const log = (s = '') => emit(lines, s);

  log('=== bundle_audit_report ===');
  log(`dist: ${DIST}`);
  log(`generated_at: ${new Date().toISOString()}`);
  log('');

  if (!fs.existsSync(DIST)) {
    log('ERRORE: dist/ assente. Eseguire prima: node scripts/_bundle_audit_build.mjs');
    const text = lines.join('\n');
    if (out) fs.writeFileSync(out, text, 'utf8');
    console.log(text);
    process.exit(1);
  }

  const { path: manifestPath, data: manifest } = loadManifest();
  log(`manifest: ${manifestPath ?? 'NON_TROVATO'}`);
  log('');

  const classMap = classifyFromManifest(manifest);
  const files = walkFiles(DIST).filter((f) => !f.rel.endsWith('manifest.json'));

  /** @type {{ rel: string, bytes: number, gzip: number, quando: string, importers: string[], isEntry: boolean, evidence: string }[]} */
  const rows = [];
  for (const f of files) {
    const buf = fs.readFileSync(f.abs);
    const bytes = buf.length;
    const gzip = zlib.gzipSync(buf).length;
    let matched = classMap.get(f.rel) ?? null;
    if (!matched) {
      for (const [k, v] of classMap) {
        if (k === f.rel || f.rel.endsWith(k) || k.endsWith(f.rel)) {
          matched = v;
          break;
        }
      }
    }
    rows.push({
      rel: f.rel,
      bytes,
      gzip,
      quando: matched?.quando ?? 'NON DIMOSTRABILE',
      importers: matched?.importers ?? [],
      isEntry: matched?.isEntry ?? false,
      evidence: matched ? matched.evidence : 'DIMOSTRATA DAL BUILD (size only)',
    });
  }

  rows.sort((a, b) => b.bytes - a.bytes);

  log('## Riepilogo');
  log(`file_count: ${rows.length}`);
  log(`total_bytes: ${rows.reduce((s, r) => s + r.bytes, 0)}`);
  log(`total_gzip_bytes: ${rows.reduce((s, r) => s + r.gzip, 0)}`);
  log('');
  log(`### Top ${Math.min(top, rows.length)} per dimensione_bytes`);
  log('rank\tbytes\tgzip\tquando_caricato\tpath');
  rows.slice(0, top).forEach((r, i) => {
    log(`${i + 1}\t${r.bytes}\t${r.gzip}\t${r.quando}\t${r.rel}`);
  });
  log('');
  log('### Entry vs resto (conteggio file classificato)');
  const byQuando = rows.reduce((acc, r) => {
    acc[r.quando] = (acc[r.quando] || 0) + 1;
    return acc;
  }, /** @type {Record<string, number>} */ ({}));
  for (const [k, v] of Object.entries(byQuando)) log(`${k}: ${v}`);
  log('');
  log('> Nota: dimensione per file SORGENTE non è dimostrabile da dist/ senza meta Rollup per-modulo.');
  log('> Le schede seguenti descrivono CHUNK/ASSET di build. Flag bootstrap = IPOTESI (DOC-38 §S.3.2).');
  log('');

  log('## Schede MODULO (formato DOC-38 §9.5)');
  log('');

  for (const r of rows) {
    const isEntryish = r.quando === 'entry-sync';
    const isDyn = r.quando === 'dynamic-import';
    const who =
      r.importers.length > 0
        ? r.importers.join(' | ')
        : r.isEntry
          ? 'ENTRY (index.html / isEntry)'
          : 'NON DIMOSTRABILE';
    log(`### MODULO: ${r.rel}`);
    log(`dimensione_bytes: ${r.bytes}`);
    log(`dimensione_gzip_bytes: ${r.gzip}`);
    log(`quando_caricato: ${r.quando}`);
    log(`chi_lo_importa: ${who}`);
    log(
      `perché_importato: ${
        r.isEntry
          ? 'Entry point HTML / Vite isEntry'
          : isEntryish
            ? 'Nella closure sync dell’entry (manifest.imports) | IPOTESI sul motivo di prodotto'
            : isDyn
              ? 'Riferito come dynamicImports nel manifest Vite'
              : 'NON DIMOSTRABILE'
      }`,
    );
    log(
      `necessario_bootstrap: ${
        r.isEntry ? 'SI' : isDyn ? 'NO' : 'IPOTESI DA VERIFICARE'
      }`,
    );
    log(`teoricamente_differibile: IPOTESI DA VERIFICARE`);
    log(`classificazione_evidenza: ${r.evidence}`);
    log('');
  }

  const text = lines.join('\n');
  if (out) {
    fs.mkdirSync(path.dirname(path.resolve(ROOT, out)), { recursive: true });
    fs.writeFileSync(path.resolve(ROOT, out), text, 'utf8');
    console.log(`[bundle_audit_report] written: ${path.resolve(ROOT, out)}`);
  }
  console.log(text);
}

main();
