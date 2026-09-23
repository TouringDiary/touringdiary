/**
 * Applica un file SQL al DB Postgres (DDL/RPC). Richiede SUPABASE_DB_URL o DATABASE_URL
 * (URI Session mode da Supabase Dashboard → Database → Connection string).
 * Non committare credenziali; uso operativo FASE 1.
 */
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const EXIT = {
  OK: 0,
  USAGE: 1,
  MISSING_DB_URL: 2,
  MISSING_POSTGRES_PKG: 3,
  FILE_NOT_FOUND: 4,
  PATH_NOT_ALLOWED: 5,
  APPLY_FAILED: 6,
  SELF_TEST_FAILED: 7,
};

function isAllowedMigrationPath(resolvedPath, repoRoot) {
  const migrationsDir = path.join(repoRoot, 'supabase', 'migrations');
  const relative = path.relative(migrationsDir, resolvedPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return false;
  return relative.endsWith('.sql');
}

function skipWhitespace(sql, i) {
  let pos = i;
  const n = sql.length;
  while (pos < n && /\s/.test(sql[pos])) pos += 1;
  return pos;
}

function readSqlIdentifier(sql, i) {
  if (!/[A-Za-z_]/.test(sql[i])) return null;
  let pos = i;
  const start = pos;
  while (pos < sql.length && /[A-Za-z0-9_]/.test(sql[pos])) pos += 1;
  return { word: sql.slice(start, pos).toUpperCase(), next: pos };
}

/** Legge parole SQL fino a `;` (solo whitespace tra le parole). */
function readStatementKeywordSequence(sql, startIdx) {
  const keywords = [];
  let i = skipWhitespace(sql, startIdx);
  while (i < sql.length) {
    if (sql[i] === ';') return { keywords, end: i + 1 };
    const ident = readSqlIdentifier(sql, i);
    if (!ident) return null;
    keywords.push(ident.word);
    i = skipWhitespace(sql, ident.next);
  }
  return null;
}

function classifyTransactionStatement(keywords) {
  if (keywords.length === 0) return null;
  if (keywords[0] === 'BEGIN') {
    if (keywords.length === 1) return 'open';
    if (keywords.length === 2 && (keywords[1] === 'WORK' || keywords[1] === 'TRANSACTION')) {
      return 'open';
    }
    return null;
  }
  if (keywords[0] === 'START' && keywords.length === 2 && keywords[1] === 'TRANSACTION') {
    return 'open';
  }
  if (keywords[0] === 'COMMIT') {
    if (keywords.length === 1) return 'close';
    if (keywords.length === 2 && (keywords[1] === 'WORK' || keywords[1] === 'TRANSACTION')) {
      return 'close';
    }
    return null;
  }
  if (keywords[0] === 'ROLLBACK') {
    if (keywords.length === 1) return 'close';
    if (keywords.length === 2 && (keywords[1] === 'WORK' || keywords[1] === 'TRANSACTION')) {
      return 'close';
    }
    return null;
  }
  if (keywords[0] === 'END') {
    if (keywords.length === 1) return 'close';
    if (keywords.length === 2 && (keywords[1] === 'WORK' || keywords[1] === 'TRANSACTION')) {
      return 'close';
    }
    return null;
  }
  return null;
}

/**
 * Scanner lessicale: eventi open/close transaction file-level
 * (esclude commenti, stringhe '...', corpi dollar-quoted).
 */
function scanFileLevelTransactionEvents(sqlBody) {
  const events = [];
  let i = 0;
  const n = sqlBody.length;

  while (i < n) {
    const ch = sqlBody[i];

    if (ch === '-' && sqlBody[i + 1] === '-') {
      i += 2;
      while (i < n && sqlBody[i] !== '\n' && sqlBody[i] !== '\r') i += 1;
      continue;
    }

    if (ch === '/' && sqlBody[i + 1] === '*') {
      i += 2;
      while (i < n - 1 && !(sqlBody[i] === '*' && sqlBody[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }

    if (ch === "'") {
      i += 1;
      while (i < n) {
        if (sqlBody[i] === "'") {
          if (sqlBody[i + 1] === "'") {
            i += 2;
            continue;
          }
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }

    if (ch === '$') {
      const tagStart = i;
      i += 1;
      while (i < n && /[A-Za-z0-9_]/.test(sqlBody[i])) i += 1;
      if (sqlBody[i] !== '$') {
        i = tagStart + 1;
        continue;
      }
      const tag = sqlBody.slice(tagStart, i + 1);
      i += 1;
      const closeIdx = sqlBody.indexOf(tag, i);
      if (closeIdx === -1) break;
      i = closeIdx + tag.length;
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      const seq = readStatementKeywordSequence(sqlBody, i);
      if (seq && seq.keywords.length > 0) {
        const kind = classifyTransactionStatement(seq.keywords);
        if (kind) events.push({ kind, at: i });
        i = seq.end;
        continue;
      }
    }

    i += 1;
  }

  return events;
}

function hasValidExplicitFileLevelTransaction(sqlBody) {
  const events = scanFileLevelTransactionEvents(sqlBody);
  let seenOpen = false;
  for (const event of events) {
    if (event.kind === 'open') {
      seenOpen = true;
      continue;
    }
    if (event.kind === 'close') {
      if (seenOpen) return true;
      return false;
    }
  }
  return false;
}

function migrationHasExplicitFileTransaction(sqlBody) {
  return hasValidExplicitFileLevelTransaction(sqlBody);
}

function wrapMigrationInTransaction(sqlBody) {
  const trimmed = sqlBody.trim();
  if (migrationHasExplicitFileTransaction(sqlBody)) {
    return trimmed;
  }
  return `BEGIN;\n${trimmed}\nCOMMIT;`;
}

function expectWrapResult(tc) {
  const wrapped = wrapMigrationInTransaction(tc.sql);
  const isWrapped = wrapped.startsWith('BEGIN;') && wrapped.endsWith('COMMIT;');
  const unchanged = wrapped === tc.sql.trim();
  if (tc.expectWrap) return isWrapped && !unchanged;
  return unchanged;
}

function runTransactionDetectionSelfTests() {
  const cases = [
    {
      name: 'plain DDL without transaction',
      sql: 'CREATE TABLE foo (id int);',
      expectWrap: true,
    },
    {
      name: 'explicit file-level BEGIN/COMMIT',
      sql: 'BEGIN;\nCREATE TABLE foo (id int);\nCOMMIT;',
      expectWrap: false,
    },
    {
      name: 'BEGIN WORK / COMMIT WORK',
      sql: 'BEGIN WORK;\nCREATE TABLE foo (id int);\nCOMMIT WORK;',
      expectWrap: false,
    },
    {
      name: 'BEGIN TRANSACTION / COMMIT TRANSACTION',
      sql: 'BEGIN TRANSACTION;\nCREATE TABLE foo (id int);\nCOMMIT TRANSACTION;',
      expectWrap: false,
    },
    {
      name: 'START TRANSACTION / COMMIT',
      sql: 'START TRANSACTION;\nCREATE TABLE foo (id int);\nCOMMIT;',
      expectWrap: false,
    },
    {
      name: 'COMMIT before BEGIN (invalid explicit transaction)',
      sql: 'COMMIT;\nCREATE TABLE foo (id int);\nBEGIN;',
      expectWrap: true,
    },
    {
      name: 'only BEGIN without COMMIT',
      sql: 'BEGIN;\nCREATE TABLE foo (id int);',
      expectWrap: true,
    },
    {
      name: 'BEGIN; ... ROLLBACK;',
      sql: 'BEGIN;\nCREATE TABLE foo (id int);\nROLLBACK;',
      expectWrap: false,
    },
    {
      name: 'BEGIN WORK; ... ROLLBACK;',
      sql: 'BEGIN WORK;\nCREATE TABLE foo (id int);\nROLLBACK;',
      expectWrap: false,
    },
    {
      name: 'BEGIN; ... END;',
      sql: 'BEGIN;\nCREATE TABLE foo (id int);\nEND;',
      expectWrap: false,
    },
    {
      name: 'BEGIN; ... END TRANSACTION;',
      sql: 'BEGIN;\nCREATE TABLE foo (id int);\nEND TRANSACTION;',
      expectWrap: false,
    },
    {
      name: 'plpgsql function internal BEGIN/END only',
      sql: `CREATE FUNCTION f() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  NULL;
END;
$$;`,
      expectWrap: true,
    },
    {
      name: 'custom dollar tag function body',
      sql: `CREATE FUNCTION f() RETURNS void LANGUAGE plpgsql AS $body$
BEGIN
  NULL;
END;
$body$;`,
      expectWrap: true,
    },
    {
      name: 'BEGIN/COMMIT inside line comment',
      sql: `-- BEGIN; fake\nCREATE TABLE foo (id int);\n-- COMMIT;`,
      expectWrap: true,
    },
    {
      name: 'BEGIN/COMMIT inside single-quoted string',
      sql: "SELECT 'BEGIN;' AS a, 'COMMIT;' AS b;\nCREATE TABLE foo (id int);",
      expectWrap: true,
    },
    {
      name: 'multiple functions same migration',
      sql: `CREATE FUNCTION a() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  NULL;
END;
$$;
CREATE FUNCTION b() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  NULL;
END;
$$;`,
      expectWrap: true,
    },
  ];

  for (const tc of cases) {
    if (!expectWrapResult(tc)) {
      throw new Error(`self-test failed: ${tc.name}`);
    }
  }

  const repoRoot = path.join(__dirname, '..');
  const poiMigration = path.join(
    repoRoot,
    'supabase/migrations/20260923153000_poi_d90_save_with_image_assignment.sql',
  );
  if (fs.existsSync(poiMigration)) {
    const body = fs.readFileSync(poiMigration, 'utf8');
    const wrapped = wrapMigrationInTransaction(body);
    if (!wrapped.startsWith('BEGIN;') || !wrapped.endsWith('COMMIT;')) {
      throw new Error('self-test failed: POI D90 migration should be auto-wrapped');
    }
  }
}

async function main() {
  if (process.argv[2] === '--self-test-transaction-wrap') {
    try {
      runTransactionDetectionSelfTests();
      console.log('[apply] transaction wrap self-test OK');
      process.exit(EXIT.OK);
    } catch (err) {
      console.error('[apply] transaction wrap self-test FAILED', err.message || err);
      process.exit(EXIT.SELF_TEST_FAILED);
    }
  }

  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('Usage: node scripts/f1_apply_sql_migration.cjs <path-to.sql>');
    process.exit(EXIT.USAGE);
  }

  const repoRoot = path.join(__dirname, '..');
  const filePath = path.resolve(fileArg);
  if (!fs.existsSync(filePath)) {
    console.error(`[apply] file not found: ${filePath}`);
    process.exit(EXIT.FILE_NOT_FOUND);
  }
  if (!isAllowedMigrationPath(filePath, repoRoot)) {
    console.error(
      '[apply] perimetro negato: consentiti solo file .sql in supabase/migrations/ del repository.',
    );
    process.exit(EXIT.PATH_NOT_ALLOWED);
  }

  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('Missing SUPABASE_DB_URL or DATABASE_URL — cannot apply SQL locally.');
    process.exit(EXIT.MISSING_DB_URL);
  }

  let postgres;
  try {
    postgres = (await import('postgres')).default;
  } catch {
    console.error('Install postgres package: npm install postgres');
    process.exit(EXIT.MISSING_POSTGRES_PKG);
  }

  const body = fs.readFileSync(filePath, 'utf8');
  console.log(`[apply] ${path.basename(filePath)} (${body.length} bytes)`);

  const sql = postgres(dbUrl, { max: 1, idle_timeout: 5 });
  let exitCode = EXIT.OK;
  try {
    const payload = wrapMigrationInTransaction(body);
    await sql.unsafe(payload);
    console.log('[apply] OK');
  } catch (err) {
    console.error('[apply] FAILED', err.message || err);
    exitCode = EXIT.APPLY_FAILED;
  } finally {
    await sql.end({ timeout: 5 });
  }
  process.exit(exitCode);
}

main().catch((err) => {
  console.error('[apply] FAILED', err.message || err);
  process.exit(EXIT.APPLY_FAILED);
});
