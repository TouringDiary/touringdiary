/**
 * DOC-38 §S.3 / §9.5 — Bundle audit (temporaneo, rimovibile).
 *
 * Esegue build produzione ripetibile e conferma `dist/`.
 * Nessun HTML. Nessuna modifica al codice applicativo.
 *
 * Uso: node scripts/_bundle_audit_build.mjs
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

function main() {
  console.log('=== bundle_audit_build ===');
  console.log(`root: ${ROOT}`);
  console.log('command: npx vite build --manifest');
  console.log('(flag --manifest solo diagnostica; non altera vite.config.ts)');
  console.log('');

  const result = spawnSync('npx', ['vite', 'build', '--manifest'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  const code = result.status ?? 1;
  console.log('');
  console.log(`exit_code: ${code}`);

  if (!fs.existsSync(DIST)) {
    console.error(`dist_missing: ${DIST}`);
    process.exit(code || 1);
  }

  console.log(`dist_ok: ${DIST}`);

  const entries = fs.readdirSync(DIST, { withFileTypes: true }).map((d) => {
    const full = path.join(DIST, d.name);
    if (d.isDirectory()) return `dir\t${d.name}/`;
    const st = fs.statSync(full);
    return `file\t${d.name}\t${st.size}`;
  });
  console.log('dist_top_level:');
  for (const line of entries) console.log(`  ${line}`);

  const manifestCandidates = [
    path.join(DIST, '.vite', 'manifest.json'),
    path.join(DIST, 'manifest.json'),
  ];
  const manifest = manifestCandidates.find((p) => fs.existsSync(p));
  console.log(`manifest: ${manifest ?? 'NON_TROVATO'}`);

  process.exit(code);
}

main();
