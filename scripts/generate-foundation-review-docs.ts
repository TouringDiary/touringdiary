/**
 * One-off generator for temp/review/*.md — Foundation migration review docs.
 * Run: npx tsx scripts/generate-foundation-review-docs.ts
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT_DIR = path.join(ROOT, 'temp', 'review');

type ReviewBatch = {
  outputFile: string;
  title: string;
  baseRef: string;
  files: Array<{ rel: string; motivazione: string }>;
};

function git(cmd: string): string {
  return execSync(`git ${cmd}`, { cwd: ROOT, encoding: 'utf8' }).trimEnd();
}

function readFile(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function fence(lang: string, content: string): string {
  return '```' + lang + '\n' + content.replace(/\r\n/g, '\n') + '\n```';
}

function buildBatch(batch: ReviewBatch): string {
  const lines: string[] = [
    `# ${batch.title}`,
    '',
    '# File modificati',
    '',
    ...batch.files.map((f) => `- \`${f.rel}\``),
    '',
    '---',
    '',
  ];

  for (const { rel, motivazione } of batch.files) {
    let diff = '';
    try {
      diff = git(`diff ${batch.baseRef} -- "${rel}"`);
    } catch {
      diff = '(diff non disponibile)';
    }
    if (!diff) diff = '(nessuna differenza rispetto alla base)';

    const finalContent = readFile(rel);

    lines.push(`## \`${rel}\``, '', motivazione, '', '### Diff', '', fence('diff', diff), '', '### File definitivo proposto', '', fence('tsx', finalContent), '', '---', '');
  }

  return lines.join('\n');
}

const batches: ReviewBatch[] = [
  {
    outputFile: 'Wave1_Review.md',
    title: 'Foundation Wave 1 — Review',
    baseRef: '9095365~1',
    files: [
      {
        rel: 'src/components/features/diary/packing_list/suitcase/AiSuggestionsModal.tsx',
        motivazione:
          'Migrazione shell Foundation completa (overlay, container, header, body, footer, bottoni). Footer review mantiene token dominio `FOOTER_REVIEW_*`. Shell senza `isMobile`; tipografia con `isMobile`.',
      },
      {
        rel: 'src/components/features/diary/packing_list/suitcase/AiSuggestionsSetupStep.tsx',
        motivazione:
          'Migrazione token Foundation per sezioni e card selezionabili (componente figlio del flusso AI, non modale shell). Tipografia responsive con `isMobile`.',
      },
      {
        rel: 'src/components/features/diary/packing_list/suitcase/CategorySetupConfigurationModal.tsx',
        motivazione:
          'Migrazione shell Foundation completa. Unico override larghezza dominio: `max-w-3xl`.',
      },
      {
        rel: 'src/components/features/diary/packing_list/suitcase/RecommendedSuitcaseModal.tsx',
        motivazione:
          'Migrazione shell Foundation completa. Override larghezza dominio: `max-w-lg`.',
      },
    ],
  },
  {
    outputFile: 'Batch1_Review.md',
    title: 'Foundation Wave 2 Batch 1 (Valigia) — Review',
    baseRef: '162c0b2~1',
    files: [
      {
        rel: 'src/components/features/diary/packing_list/suitcase/AssociationConfirmationModal.tsx',
        motivazione:
          'Pattern compatto Foundation (overlay, container, body, title/subtitle, close offset). Footer multi-azione dominio. Correzione collaudo: `!items-center` su overlay mobile; click overlay chiude via `handleDismiss`.',
      },
      {
        rel: 'src/components/features/diary/packing_list/suitcase/BlacklistModal.tsx',
        motivazione:
          'Shell Foundation completa (header/body/footer/btn_cancel). Override `max-w-2xl`. Mantiene bottom-sheet Foundation su mobile (nessun `!items-center`).',
      },
      {
        rel: 'src/components/features/diary/packing_list/suitcase/CategoryMobileDialog.tsx',
        motivazione:
          'Overlay/container/body Foundation per dialog mobile categorie (`lg:hidden`). Close offset dominio `-top-2 -right-2`. Correzione collaudo: `!items-center`; overlay click chiude.',
      },
      {
        rel: 'src/components/features/diary/packing_list/suitcase/ItemDeleteConfirmationModal.tsx',
        motivazione:
          'Pattern compatto Foundation con bordo variante amber/rose. Correzione collaudo: `!items-center`; aggiunti `onClick={onClose}` su overlay e `stopPropagation` sul container.',
      },
      {
        rel: 'src/components/features/diary/packing_list/suitcase/LinkSuitcaseModal.tsx',
        motivazione:
          'Pattern compatto Foundation con form input dominio. Correzione collaudo: `!items-center`; overlay click già presente (`onCancel`).',
      },
    ],
  },
  {
    outputFile: 'Batch2_Review.md',
    title: 'Foundation Wave 2 Batch 2 (Diario) — Review',
    baseRef: 'HEAD',
    files: [
      {
        rel: 'src/components/common/DeleteConfirmationModal.tsx',
        motivazione:
          'Primitiva condivisa migrata a Foundation (compact confirm). Beneficia automaticamente `PublishCommunityModal` e altri consumer.',
      },
      {
        rel: 'src/components/features/diary/header/DiaryHeaderInvalidDateModal.tsx',
        motivazione: 'Confirm compatto Foundation per date invalide nell\'header diario.',
      },
      {
        rel: 'src/components/modals/UnsavedChangesModal.tsx',
        motivazione: 'Confirm compatto Foundation per uscita con modifiche non salvate.',
      },
      {
        rel: 'src/components/modals/DateChangeWarningModal.tsx',
        motivazione: 'Confirm compatto Foundation per avviso riduzione range date.',
      },
      {
        rel: 'src/components/modals/ConfirmClearModal.tsx',
        motivazione: 'Confirm compatto Foundation per svuotamento diario.',
      },
      {
        rel: 'src/components/modals/EmptyDiaryModal.tsx',
        motivazione: 'Confirm compatto Foundation per diario vuoto; aggiunto `stopPropagation` sul container.',
      },
      {
        rel: 'src/components/modals/DuplicateResolutionModal.tsx',
        motivazione: 'Confirm compatto Foundation per risoluzione duplicati import.',
      },
      {
        rel: 'src/components/modals/MobileMoveModal.tsx',
        motivazione: 'Shell header/body Foundation per spostamento tappa su mobile.',
      },
      {
        rel: 'src/components/modals/TimeConflictModal.tsx',
        motivazione: 'Shell header/body/footer Foundation per conflitto orario con swap e cambio slot.',
      },
      {
        rel: 'src/components/modals/AddToItineraryModal.tsx',
        motivazione: 'Foundation per entrambe le viste (config date + aggiunta tappa); close offset shell.',
      },
      {
        rel: 'src/components/modals/SaveAsModal.tsx',
        motivazione: 'Confirm compatto Foundation con flow sovrascrittura nome.',
      },
      {
        rel: 'src/components/modals/RemoveItemModal.tsx',
        motivazione: 'Shell header/body/footer Foundation per rimozione istanze duplicate.',
      },
      {
        rel: 'src/components/modals/ReviewModal.tsx',
        motivazione: 'Foundation per modale recensione + nested confirm "dati non salvati". Sostituito `useDynamicStyles` con token Foundation.',
      },
      {
        rel: 'src/components/modals/ShareModal.tsx',
        motivazione: 'Confirm compatto Foundation per condivisione esperienza.',
      },
    ],
  },
];

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const batch of batches) {
  const content = buildBatch(batch);
  const outPath = path.join(OUT_DIR, batch.outputFile);
  fs.writeFileSync(outPath, content, 'utf8');
  const sizeKb = (Buffer.byteLength(content, 'utf8') / 1024).toFixed(1);
  console.log(`Wrote ${batch.outputFile} (${sizeKb} KB)`);
}

console.log(`\nDone. Files in ${OUT_DIR}`);
