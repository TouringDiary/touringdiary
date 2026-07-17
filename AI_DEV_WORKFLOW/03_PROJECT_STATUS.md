# 03 — Project Status (Dashboard)

> **Sintesi operativa** — lettura target **< 10 secondi**.
> **Nessun dettaglio** STEP/Fasi/checklist (→ `WORKFLOWS/WF_XX_*.md`).
> **Nessuna definizione Gate** (→ SSOT in `AI_CONTEXT`).

**Ultimo aggiornamento:** 2026-07-17 — **Aggiornato da:** STEP-3 Fase 3.4 in sviluppo (schedule + card + DS + audit UI)

---

## In sintesi

- **Focus attuale:** WF-02 **STEP-3 Fase 3.4** — Programmazione automatica, card Feature Flag autosufficienti, DS admin, storico audit.
- **Prossimo:** Smoke 3.4 → PO ✓ → **Audit copertura Feature Flag / consumer mancanti** (attività post-3.4 tracciata in WF-02).
- **Blocco:** Nessuno. Deploy migration `20260717180000` (schedule pause) + `20260717160000` se pending.

---

## Workflow

| WF | Nome | Stato WF | STEP corrente | Fase corrente | % | Blocco |
|----|------|----------|---------------|---------------|---|--------|
| WF-02 | Implementation Masterplan | Attivo | STEP-3 | Fase 3.4 — Programmazione e consumer | 90 | — |

---

## Gate aperti (solo tracciamento — definizione negli SSOT)

| Gate | Definito in | WF | Stato |
|------|-------------|-----|-------|
| Pronto per Implementazione DOC 29 | DOC 29 DoD-1–9 | WF-02 | ☑ |
| G-CC-1 | DOC 30 DoD-P1–P8 | WF-02 | ☑ |
| G-MSG-1 step 1–2 | DOC 29 / DOC 30 | WF-02 | ☑ |
| G-MSG-1 step 3–5 | DOC 29 / DOC 30 | WF-02 | ☐ |
| G-AI-SEP | DOC 30 DL-P08 | WF-02 | ☑ |

---

## Completati di recente

| WF | Chiuso il | Validazione PO |
|----|-----------|-----------------|
| WF-01 | 2026-07-14 | Approvato (assunto PO) |

*WF-02 STEP-2 completato 2026-07-17 — Fasi 2.1–2.6 (Sponsor DOC 29).*  
*WF-02 STEP-2 Fase 2.5 validazione PO: Approvato 2026-07-17.*  
*WF-02 STEP-2 Fase 2.6 validazione PO: Approvato 2026-07-17 (chiusura formale STEP-2).*

---

## Dipendenze critiche

| Da | Verso | Tipo | Stato |
|----|-------|------|-------|
| WF-01 | WF-02 | Sequenza Workflow | Risolta |
| STEP-2 | STEP-3 | Gate dominio Sponsor | Risolta |

*Vedi `01_EXECUTION_ROADMAP.md` per dipendenze pianificate e anticipazioni non ufficiali (§6).*

---

## Override PO attivi

| ID | Tipo | WF | Scadenza review |
|----|------|-----|-----------------|
| — | — | — | — |

*Registro completo → `02_GOVERNANCE.md` §5.*

---

## Istruzioni aggiornamento (obbligatorie)

Aggiornare questo file **ogni volta** che cambia:

- Stato di un Workflow, STEP o Fase
- Gate ☐ → ☑ (o viceversa)
- Blocco o sua risoluzione
- Override PO
- Focus attuale / prossimo passo

**Ordine:** chiudere dettaglio nel file `WORKFLOWS/WF_XX` → poi aggiornare qui.

---

## Cronologia snapshot (opzionale, max 5 righe)

| Data | Focus | Nota |
|------|-------|------|
| 2026-07-17 | WF-02 | Fase 3.4 in sviluppo — schedule pause, card inline, DS, audit UI; post-3.4 audit consumer tracciato |
| 2026-07-17 | WF-02 | Fase 3.3 chiusa — Message Template Source + manutenzione News Bar DL-P06 |
| 2026-07-17 | WF-02 | Fase 3.2 chiusa — UI macro-sezioni + consumer Sponsor/AI/Moderation |
| 2026-07-17 | WF-02 | Avvio STEP-3 Fase 3.1 — Feature Flag Engine + audit + Centro di Controllo nav |
| 2026-07-17 | WF-02 | STEP-2 chiuso (Fase 2.6); audit O8; G-MSG-1 step 2 ☑; avvio STEP-3 |
