/**
 * Layer System guard — enforces the z-index rules documented in
 * src/layering/layerRegistry.ts (ARCHITECTURAL_RULES).
 *
 * Forbidden in components:
 *   • numeric z-index utility classes:  z-10, z-50, z-[999]  (z-0 = base is allowed)
 *   • numeric inline z-index:           style={{ zIndex: 50 }}  (constants are fine)
 *
 * Strategy: BASELINE RATCHET.
 *   Existing legacy violations are recorded in scripts/layers-baseline.json so they
 *   don't break the build, while ANY NEW violation fails. This makes the system hard
 *   to misuse going forward without forcing an immediate legacy cleanup.
 *
 * Usage:
 *   npm run lint:layers                 → fail if new violations appear
 *   npx tsx scripts/check-layers.ts --update-baseline   → snapshot current violations
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPT_DIR, '..');
const SRC = join(ROOT, 'src');
const BASELINE_PATH = join(SCRIPT_DIR, 'layers-baseline.json');

// Files that DEFINE the system (allowed to contain numbers).
const ALLOWLIST = new Set(
  ['src/constants/zIndex.ts', 'src/layering/layerRegistry.ts'].map((p) => p.split('/').join(sep))
);

const CLASS_NUMERIC = /(?:^|[\s"'`{])-?z-(?:\[[^\]]*\]|[1-9]\d*)\b/;
const INLINE_NUMERIC = /\bzIndex\s*:\s*-?\d/;

type Violation = { file: string; line: number; text: string; kind: string };

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'dist') continue;
      walk(full, out);
    } else if (/\.(tsx|ts)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

function scan(): Violation[] {
  const violations: Violation[] = [];
  for (const file of walk(SRC)) {
    const rel = relative(ROOT, file);
    if (ALLOWLIST.has(rel)) continue;
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (CLASS_NUMERIC.test(line)) {
        violations.push({ file: rel, line: i + 1, text: line.trim(), kind: 'class-numeric-z' });
      }
      if (INLINE_NUMERIC.test(line)) {
        violations.push({ file: rel, line: i + 1, text: line.trim(), kind: 'inline-numeric-z' });
      }
    });
  }
  return violations;
}

/** Line-content signature (tolerant of line-number shifts). */
const sig = (v: Violation) => `${v.file.split(sep).join('/')} :: ${v.kind} :: ${v.text}`;

const violations = scan();
const current = new Map(violations.map((v) => [sig(v), v]));

if (process.argv.includes('--update-baseline')) {
  const signatures = [...current.keys()].sort();
  writeFileSync(BASELINE_PATH, JSON.stringify({ signatures }, null, 2) + '\n');
  console.log(`Layer baseline updated: ${signatures.length} known (legacy) violations recorded.`);
  process.exit(0);
}

const baseline: { signatures: string[] } = existsSync(BASELINE_PATH)
  ? JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
  : { signatures: [] };
const known = new Set(baseline.signatures);

const fresh = [...current.values()].filter((v) => !known.has(sig(v)));

if (fresh.length > 0) {
  console.error('\n✖ Layer System violation(s): numeric z-index is forbidden in components.');
  console.error('  Use a semantic token (z-local-*, z-popover, z-modal, …). See src/layering/layerRegistry.ts.\n');
  for (const v of fresh) {
    console.error(`  ${v.file}:${v.line}  [${v.kind}]`);
    console.error(`     ${v.text}`);
  }
  console.error(`\n  ${fresh.length} new violation(s). If intentional & legacy, run: npx tsx scripts/check-layers.ts --update-baseline\n`);
  process.exit(1);
}

const fixed = baseline.signatures.filter((s) => !current.has(s)).length;
console.log(
  `✓ Layer System OK — no new numeric z-index. ${current.size} legacy violation(s) tracked` +
    (fixed > 0 ? `, ${fixed} cleaned since baseline (consider --update-baseline).` : '.')
);
