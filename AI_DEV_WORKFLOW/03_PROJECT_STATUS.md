# 03 — Project Status (Dashboard)

> **Sintesi operativa** — lettura target **< 10 secondi**.
> **Nessun dettaglio** STEP/Fasi/checklist (→ `WORKFLOWS/WF_XX_*.md`).
> **Nessuna definizione Gate** (→ SSOT in `AI_CONTEXT`).

**Ultimo aggiornamento:** 2026-07-16 — **Aggiornato da:** Soluzione A migration id text in activate RPC; DOC 33 già registrato

---

## In sintesi

- **Focus attuale:** WF-02 STEP-2 — **bug fix attivazione Sponsor** (soluzione A in migration — smoke PO richiesto), poi ripresa **Fase 2.5** (B8).
- **Prossimo:** Applicare migration `20260716162000_activate_sponsor_resource_text_ids.sql` → smoke «Conferma e attiva» (activity/shop) → Fase 2.5.
- **Blocco:** Nessuno sul percorso WF-02. Anticipazione **ID Governance** registrata ma **non approvata** (DOC 33).

---

## Workflow

| WF | Nome | Stato WF | STEP corrente | Fase corrente | % | Blocco |
|----|------|----------|---------------|---------------|---|--------|
| WF-02 | Implementation Masterplan | Attivo | STEP-2 | Fase 2.5 (in coda) · bug fix attivazione prioritario | 55 | — |

---

## Gate aperti (solo tracciamento — definizione negli SSOT)

| Gate | Definito in | WF | Stato |
|------|-------------|-----|-------|
| Pronto per Implementazione DOC 29 | DOC 29 DoD-1–9 | WF-02 | ☑ |
| G-CC-1 | DOC 30 DoD-P1–P8 | WF-02 | ☑ |
| G-MSG-1 | DOC 29 / DOC 30 | WF-02 | ☐ |
| G-AI-SEP | DOC 30 DL-P08 | WF-02 | ☑ |

---

## Completati di recente

| WF | Chiuso il | Validazione PO |
|----|-----------|-----------------|
| WF-01 | 2026-07-14 | Approvato (assunto PO) |

*WF-02 STEP-1 completato 2026-07-14 — Validazione PO: Approvato.*  
*WF-02 STEP-2 Fase 2.4 completata 2026-07-16 — Validazione PO: Approvato (review architetturale).*

---

## Dipendenze critiche

| Da | Verso | Tipo | Stato |
|----|-------|------|-------|
| WF-01 | WF-02 | Sequenza Workflow | Risolta |
| STEP-1 | STEP-2 | Gate implementazione Sponsor | Risolta |

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
| 2026-07-16 | Bugfix | Migration soluzione A (id text in activate RPC); smoke PO in attesa |
| 2026-07-16 | Docs | DOC 33 dual-family ID; ID Governance **non** approvata; priorità bug fix attivazione |
| 2026-07-16 | WF-02 | Fase 2.4 chiusa (PO ✓); avvio autorizzato Fase 2.5 |
| 2026-07-14 | WF-02 | Fase 2.3 chiusa (PO ✓) |
| 2026-07-14 | WF-02 | Fase 2.2 chiusa (PO ✓); Fase 2.3 implementata |
| 2026-07-14 | WF-02 | Fase 2.1 chiusura definitiva (review PO) |
