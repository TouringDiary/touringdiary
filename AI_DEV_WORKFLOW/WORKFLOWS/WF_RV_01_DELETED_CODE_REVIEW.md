# WF-RV-01 — Deleted Code Review File

> **Tipo:** workflow di processo (permanente) — non è una macro-iniziativa di prodotto.
> **SoT operativa agent:** `.cursor/rules/wf-rv-01-deleted-code-review.mdc`
> **Artefatto:** `AI_DELETED_CODE_REVIEW.md` (root, gitignored)

## Scopo

Archivio temporaneo ufficiale del **solo codice rimosso/sostituito (versione vecchia)** ancora in review Cursor, per consentire una review completa senza il diff viewer.

Non è un diff, un changelog o una patch.

**Invariante:** il file contiene **sempre ed esclusivamente** i file ancora in review e il relativo codice eliminato. **Non** è uno storico permanente delle modifiche già accettate.

## Regole (sintesi)

| # | Regola |
|---|--------|
| 1 | Un solo `AI_DELETED_CODE_REVIEW.md` |
| 2 | Documento **incrementale** (non solo l’ultima modifica) |
| 3 | Blocchi rimossi solo quando il file è **accettato** → review **chiusa** + **pulizia automatica** |
| 4 | Formato obbligatorio: FILE → FUNZIONE/SEZIONE → CODICE RIMOSSO → MOTIVO |
| 5 | Ordine: per file, poi ordine di comparsa nel file |
| 6 | Scopo: review senza diff viewer |
| 7 | Nessuna perdita di informazione finché il file non è accettato |
| 8 | Compatibile col workflow esistente (consolidamento) |
| 9 | Si aggiornano solo workflow + generatore, non il codice applicativo |
| 10 | Ogni modifica all’archivio va **dichiarata** nel Report operativo |

## Chiusura della review (accettazione)

Quando l’utente, dopo la review (es. con ChatGPT) o in altro modo, **accetta** uno o più file (es. «ACCETTO», «accettati», conferma che quei file sono accettati), la review di quei path è **chiusa**.

Quei file **non** sono più «in review».

### Pulizia automatica (obbligatoria)

Subito dopo l’accettazione l’agent esegue il flusso `--accept` su **tutti** i path accettati e rimuove da `AI_DELETED_CODE_REVIEW.md` **tutti** i relativi blocchi.

L’utente **non** deve ricordare manualmente la pulizia.

Lasciare file accettati nel documento è una **regressione di workflow**.

## Formato blocco (obbligatorio)

```markdown
================================================================================

# FILE

src/path/File.tsx

## FUNZIONE / SEZIONE

NomeFunzione

## CODICE RIMOSSO

```tsx
// solo righe eliminate o sostituite (vecchia versione)
```

## MOTIVO

Perché è stato rimosso / quale comportamento sostituisce (max 3 righe).
```

Se la sezione non è identificabile: `Sezione non identificabile` (mai vuoto).

## Generatore

```bash
# Merge: aggiorna i file dirty (o --files=…) e conserva gli altri già in review
node scripts/_gen_deleted_code_review.js

# Aggiorna solo alcuni path
node scripts/_gen_deleted_code_review.js --files=src/a.tsx,src/b.ts

# File accettati → rimuovi solo quelle sezioni (uno o più path)
node scripts/_gen_deleted_code_review.js --accept=src/a.tsx
node scripts/_gen_deleted_code_review.js --accept=src/a.tsx,src/b.ts
```

Eseguire dalla **root** del repository (nessun path assoluto hardcoded).

## Report operativo

Ogni volta che si modifica `AI_DELETED_CODE_REVIEW.md` (generazione o pulizia), il Report operativo **deve** elencare:

- `AI_DELETED_CODE_REVIEW.md` — `aggiornato (nuove eliminazioni)` **oppure**
- `AI_DELETED_CODE_REVIEW.md` — `pulito dopo accettazione file (workflow WF-RV-01)`

Non omettere mai questo file dal report se è stato modificato.

## Policy repository

- Non committare `AI_DELETED_CODE_REVIEW.md`
- Non accettarlo come source di progetto nella review finale
- Dopo chiusura review complessiva: scartare il file
