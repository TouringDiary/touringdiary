# WF-RV-01 — Deleted Code Review File

> **Tipo:** workflow di processo (permanente) — non è una macro-iniziativa di prodotto.
> **SoT operativa agent:** `.cursor/rules/wf-rv-01-deleted-code-review.mdc`
> **Artefatto:** `AI_DELETED_CODE_REVIEW.md` (root, gitignored)
> **Sidecar accettati:** `AI_DELETED_CODE_REVIEW.accept` (root, gitignored)

## Scopo

Supporto temporaneo alla **review architetturale della review corrente**: elenco delle sole eliminazioni, così un reviewer (es. ChatGPT) può confrontare file definitivo proposto vs righe eliminate.

Non è uno storico delle eliminazioni, un audit, un diff, un changelog o una patch.

**Invariante:** il file contiene **sempre ed esclusivamente** i file della review corrente e il testo eliminato. I file di review precedenti **non** devono comparire.

## Regole (sintesi)

| # | Regola |
|---|--------|
| 1 | Un solo `AI_DELETED_CODE_REVIEW.md` |
| 2 | **Rigenerazione completa** a ogni run (no append, no storico); scope = `--files` dell’attività |
| 3 | File accettati → fuori dalla review + regenerate (`--accept`) |
| 4 | Formato minimo: path → `Righe X-Y` → testo eliminato → `Motivo:` (1 riga); merge blocchi consecutivi con stesso Motivo |
| 5 | Ordine: path, poi ordine diff (dopo merge Motivo) |
| 6 | Solo review corrente; target tipico **&lt; 300–500 righe** |
| 7 | Completezza sulla review corrente finché non accettato |
| 8 | Stesso naming; generazione = rewrite totale |
| 9 | Si aggiornano solo workflow + generatore, non il codice applicativo |
| 10 | Ogni modifica all’archivio va **dichiarata** nel Report operativo |

## Chiusura della review (accettazione)

Quando l’utente **accetta** uno o più file (es. «ACCETTO», «accettati»), la review di quei path è **chiusa**.

### Pulizia automatica (obbligatoria)

Subito dopo:

```bash
node scripts/_gen_deleted_code_review.js --accept=src/a.tsx,src/b.ts
```

I path sono registrati in `AI_DELETED_CODE_REVIEW.accept` e il documento è **rigenerato** senza di essi.

L’utente **non** deve ricordare manualmente la pulizia.

## Formato (obbligatorio — generazione)

```text
src/path/NomeFile.ext

Righe 145-152
<solo testo eliminato>
Motivo:
una sola riga di motivo
```

### Vietato nel documento generato

- `FILE`, separatori `====`, heading `#`
- `Riga` (usare solo `Righe`)
- code fence (`` ```ts `` / `` ```tsx `` / `` ```md `` / …)
- spiegazioni lunghe, commenti architetturali
- diff, codice nuovo, codice invariato
- ripetere lo stesso Motivo su blocchi consecutivi (unirli)

## Generatore

```bash
# Scope obbligatorio dopo un’attività: SOLO i file toccati in quella review
node scripts/_gen_deleted_code_review.js --files=src/a.tsx,src/b.ts

# Tutti i dirty (solo se la review intenzionalmente copre tutto il working tree)
node scripts/_gen_deleted_code_review.js

# Accettazione → esclusione + regenerate
node scripts/_gen_deleted_code_review.js --accept=src/a.tsx
node scripts/_gen_deleted_code_review.js --accept=src/a.tsx,src/b.ts
```

Eseguire dalla **root** del repository.

Comportamento standard: **rewrite totale** dello scope corrente; nessun merge incrementale con review precedenti.
Dopo ogni attività l’agent passa `--files=` con i soli path toccati, così il documento resta tipicamente sotto ~300–500 righe.

## Report operativo

Ogni volta che si modifica `AI_DELETED_CODE_REVIEW.md`, il Report operativo **deve** elencare:

- `AI_DELETED_CODE_REVIEW.md` — `aggiornato (nuove eliminazioni)` **oppure**
- `AI_DELETED_CODE_REVIEW.md` — `pulito dopo accettazione file (workflow WF-RV-01)`

## Policy repository

- Non committare `AI_DELETED_CODE_REVIEW.md` né `AI_DELETED_CODE_REVIEW.accept`
- Non accettarli come source di progetto nella review finale
- Dopo chiusura review complessiva: scartare i file
