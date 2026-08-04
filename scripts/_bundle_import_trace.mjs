/**
 * DOC-38 §S.3 / §9.5 — Bundle import trace (temporaneo, rimovibile).
 *
 * Grafo import STATICI da src/index.tsx (profondità configurabile).
 * Solo testo. Non segue import().
 *
 * Uso:
 *   node scripts/_bundle_import_trace.mjs
 *   node scripts/_bundle_import_trace.mjs --entry=src/index.tsx --depth=12
 *   node scripts/_bundle_import_trace.mjs --out=path.txt
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');

function parseArgs(argv) {
  let entry = 'src/index.tsx';
  let depth = 12;
  let out = null;
  for (const a of argv) {
    if (a.startsWith('--entry=')) entry = a.slice('--entry='.length);
    if (a.startsWith('--depth=')) depth = Math.max(0, Number(a.slice('--depth='.length)) || 12);
    if (a.startsWith('--out=')) out = a.slice('--out='.length);
  }
  return { entry, depth, out };
}

const EXT_CANDIDATES = ['.tsx', '.ts', '.jsx', '.js', '.css', '.json', ''];

function resolveExisting(base) {
  const normalized = base.replace(/\\/g, '/');
  for (const ext of EXT_CANDIDATES) {
    const candidate = normalized.endsWith(ext) && ext !== '' ? normalized : normalized + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return { kind: 'file', id: path.relative(ROOT, candidate).replace(/\\/g, '/'), abs: candidate };
    }
  }
  for (const ext of ['.tsx', '.ts', '.jsx', '.js']) {
    const idx = path.join(normalized, 'index' + ext);
    if (fs.existsSync(idx) && fs.statSync(idx).isFile()) {
      return { kind: 'file', id: path.relative(ROOT, idx).replace(/\\/g, '/'), abs: idx };
    }
  }
  return { kind: 'unresolved', id: path.relative(ROOT, base).replace(/\\/g, '/'), abs: null };
}

function resolveImport(fromFile, spec) {
  if (spec.startsWith('@/')) {
    return resolveExisting(path.join(SRC, spec.slice(2)));
  }
  if (spec.startsWith('.')) {
    return resolveExisting(path.resolve(path.dirname(fromFile), spec));
  }
  // Bare specifier → foglia esterna (non espansa in node_modules)
  return { kind: 'external', id: spec, abs: null };
}

/**
 * Estrae solo import/export-from statici (non type-only, non dynamic import()).
 * @param {string} source
 * @returns {string[]}
 */
function extractStaticSpecifiers(source) {
  /** @type {string[]} */
  const specs = [];
  const cleaned = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  const fromRe =
    /(?:^|\n)\s*(?:import\s+(?!type\b)[\s\S]*?\s+from\s+|export\s+(?!type\b)[\s\S]*?\s+from\s+)['"]([^'"]+)['"]/g;
  let m;
  while ((m = fromRe.exec(cleaned))) {
    specs.push(m[1]);
  }

  const sideRe = /(?:^|\n)\s*import\s+['"]([^'"]+)['"]/g;
  while ((m = sideRe.exec(cleaned))) {
    specs.push(m[1]);
  }

  return [...new Set(specs)];
}

/**
 * @typedef {{
 *   file: string,
 *   importers: string[],
 *   pathFromEntry: string,
 *   inBootstrapStatic: boolean,
 *   depth: number,
 *   kind: 'file' | 'external' | 'unresolved'
 * }} TraceNode
 */

function main() {
  const { entry, depth, out } = parseArgs(process.argv.slice(2));
  /** @type {string[]} */
  const lines = [];
  const log = (s = '') => lines.push(s);

  const entryAbs = path.resolve(ROOT, entry);
  if (!fs.existsSync(entryAbs)) {
    console.error(`ERRORE: entry non trovata: ${entry}`);
    process.exit(1);
  }

  log('=== bundle_import_trace ===');
  log(`entry: ${entry}`);
  log(`max_depth: ${depth}`);
  log(`generated_at: ${new Date().toISOString()}`);
  log('');
  log('Legenda:');
  log('  bootstrap_statico: SI = raggiungibile da entry solo con import statici');
  log('  import() dinamici NON seguiti — NON DIMOSTRABILE come sync bootstrap');
  log('');

  /** @type {Map<string, TraceNode>} */
  const nodes = new Map();
  /** @type {Array<{ from: string, to: string }>} */
  const edges = [];
  /** @type {Set<string>} */
  const visiting = new Set();

  /**
   * @param {string} abs
   * @param {string} importerRel
   * @param {string[]} chain
   * @param {number} d
   */
  function walk(abs, importerRel, chain, d) {
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
    const pathFromEntry = [...chain, rel].join(' → ');

    if (!nodes.has(rel)) {
      nodes.set(rel, {
        file: rel,
        importers: importerRel ? [importerRel] : [],
        pathFromEntry,
        inBootstrapStatic: true,
        depth: d,
        kind: 'file',
      });
    } else {
      const n = nodes.get(rel);
      if (importerRel && !n.importers.includes(importerRel)) n.importers.push(importerRel);
      if (d < n.depth) {
        n.depth = d;
        n.pathFromEntry = pathFromEntry;
      }
    }

    if (d >= depth) return;
    if (visiting.has(rel)) return;
    visiting.add(rel);

    const ext = path.extname(abs);
    if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      visiting.delete(rel);
      return;
    }

    let source;
    try {
      source = fs.readFileSync(abs, 'utf8');
    } catch {
      visiting.delete(rel);
      return;
    }

    for (const spec of extractStaticSpecifiers(source)) {
      const resolved = resolveImport(abs, spec);
      edges.push({ from: rel, to: resolved.id });

      if (resolved.kind !== 'file' || !resolved.abs) {
        if (!nodes.has(resolved.id)) {
          nodes.set(resolved.id, {
            file: resolved.id,
            importers: [rel],
            pathFromEntry: `${pathFromEntry} → ${resolved.id}`,
            inBootstrapStatic: true,
            depth: d + 1,
            kind: resolved.kind,
          });
        } else {
          const n = nodes.get(resolved.id);
          if (!n.importers.includes(rel)) n.importers.push(rel);
        }
        continue;
      }

      walk(resolved.abs, rel, [...chain, rel], d + 1);
    }

    visiting.delete(rel);
  }

  walk(entryAbs, '', [], 0);

  const sorted = [...nodes.values()].sort((a, b) => a.depth - b.depth || a.file.localeCompare(b.file));

  log('## Albero import statici');
  log('');
  for (const n of sorted) {
    log(`file: ${n.file}`);
    log(`↓`);
    log(`chi_importa: ${n.importers.length ? n.importers.join(' | ') : '(ENTRY)'}`);
    log(`↓`);
    log(`percorso: ${n.pathFromEntry}`);
    log(`↓`);
    log(`bootstrap_statico: ${n.inBootstrapStatic ? 'SI' : 'NO'} (kind=${n.kind}, depth=${n.depth})`);
    log('');
  }

  log('## Riepilogo');
  log(`nodes: ${nodes.size}`);
  log(`edges: ${edges.length}`);
  log(`files_src: ${sorted.filter((n) => n.kind === 'file' && n.file.startsWith('src/')).length}`);
  log(`external: ${sorted.filter((n) => n.kind === 'external').length}`);
  log(`unresolved: ${sorted.filter((n) => n.kind === 'unresolved').length}`);
  log('');
  log('## Edge list (from → to)');
  for (const e of edges) {
    log(`${e.from} → ${e.to}`);
  }

  const text = lines.join('\n');
  if (out) {
    const absOut = path.resolve(ROOT, out);
    fs.mkdirSync(path.dirname(absOut), { recursive: true });
    fs.writeFileSync(absOut, text, 'utf8');
    console.log(`[bundle_import_trace] written: ${absOut}`);
  }
  console.log(text);
}

main();
