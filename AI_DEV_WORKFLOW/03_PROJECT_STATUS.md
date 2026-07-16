# 03 — Project Status (Dashboard)

> **Sintesi operativa** — lettura target **< 10 secondi**.
> **Nessun dettaglio** STEP/Fasi/checklist (→ `WORKFLOWS/WF_XX_*.md`).
> **Nessuna definizione Gate** (→ SSOT in `AI_CONTEXT`).

**Ultimo aggiornamento:** 2026-07-14 — **Aggiornato da:** Chiusura WF-02 STEP-2 Fase 2.2; implementazione Fase 2.3

---

## In sintesi

- **Focus attuale:** WF-02 — Implementation Masterplan, **STEP-2** (implementazione dominio Sponsor).
- **Prossimo:** Review architetturale **Fase 2.3** · poi **Fase 2.4** (RPC contratti / shop / city lifecycle).
- **Blocco:** Nessuno.

---

## Workflow

| WF | Nome | Stato WF | STEP corrente | Fase corrente | % | Blocco |
|----|------|----------|---------------|---------------|---|--------|
| WF-02 | Implementation Masterplan | Attivo | STEP-2 | Fase 2.3 — Review | 40 | — |

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

---

## Dipendenze critiche

| Da | Verso | Tipo | Stato |
|----|-------|------|-------|
| WF-01 | WF-02 | Sequenza Workflow | Risolta |
| STEP-1 | STEP-2 | Gate implementazione Sponsor | Risolta |

*Vedi `01_EXECUTION_ROADMAP.md` per dipendenze pianificate.*

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
| 2026-07-14 | WF-02 | Fase 2.2 chiusa (PO ✓); Fase 2.3 implementata — review |
| 2026-07-14 | WF-02 | Fase 2.1 chiusura definitiva (review PO); prossima Fase 2.2 |
| 2026-07-14 | WF-02 | STEP-1 chiuso; DOC 29 Pronto; autorizzazione STEP-2 |
| 2026-07-14 | WF-02 | V20 remoto: 0 `admin_city` in profiles; bonifica policy tracciata Fase 2.1 |
| 2026-07-14 | WF-02 | Chiusura tutte le decisioni PO; DOC 29/30 aggiornati |
| 2026-07-14 | WF-02 | Review PO: decisioni DOC 29/30; G-CC-1 ☑ |
| 2026-07-14 | WF-02 | Apertura Implementation Masterplan |
