# 03 — Project Status (Dashboard)

> **Sintesi operativa** — lettura target **< 10 secondi**.
> **Nessun dettaglio** STEP/Fasi/checklist (→ `WORKFLOWS/WF_XX_*.md`).
> **Nessuna definizione Gate** (→ SSOT in `AI_CONTEXT`).

**Ultimo aggiornamento:** 2026-07-20 — **Aggiornato da:** MSG-SOT + Scheduler fix/status (post DL-P13/P14)

---

## In sintesi

- **Focus attuale:** WF-02 **STEP-3 Post-3.4** — codice MSG-SOT + Scheduler pronto; restano smoke PO (T02+) e Audit A.
- **Prossimo:** Validazione PO sulle modifiche di questa sessione → collaudo completo.
- **Blocco:** Chiusura STEP-3 dopo smoke + Audit A + assenza criticità.

**SoT collaudo:** `AI_DEV_WORKFLOW/WORKFLOWS/WF_02_AUDIT_B_CENTRO_CONTROLLO.md`

---

## Workflow

| WF | Nome | Stato WF | STEP corrente | Fase corrente | % | Blocco |
|----|------|----------|---------------|---------------|---|--------|
| WF-02 | Implementation Masterplan | Attivo | STEP-3 | Post-3.4 — Audit B (forense ✓, fix ✓, smoke residuo) | 97 | Smoke/decisioni PO + Audit A |

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
| WF-01 | 2026-07-14 | **Approvato** (conferma PO 2026-07-20; archiviato) |

*WF-02 STEP-2 completato 2026-07-17 — Fasi 2.1–2.6 (Sponsor DOC 29).*  
*WF-02 STEP-3 Fase 3.4 validazione PO: Approvato 2026-07-18; Post-3.4 Batch 1–3 wiring 2026-07-19.*  
*WF-02 Post-3.4 DL-P12 (2026-07-20): collaboration_live revocato.*  
*WF-02 Audit B (2026-07-20): SoT collaudo creato; 12 SUPERATI; bug/UX/audit registrati.*  
*WF-02 Audit B fix (2026-07-20): UX-01, UX-02, BUG-02, BUG-03 implementati; AUDIT-01/03 forensi in §13; BUG-01 aperto.*  
*WF-02 BUG-01 (2026-07-20): guard `assertAiRuntimeAvailable` in `supabaseProvider.generate`.*

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
**Collaudo CC:** aggiornare prima `WF_02_AUDIT_B_CENTRO_CONTROLLO.md`, poi questa dashboard.

---

## Cronologia snapshot (opzionale, max 5 righe)

| Data | Focus | Nota |
|------|-------|------|
| 2026-07-20 | WF-02 | Audit B SoT: 12 SUPERATI; BUG-01/02/03; UX; audit crediti/messaggi |
| 2026-07-20 | WF-02 | DL-P12: revoca collaboration_live; Batch 4 eliminato; Audit A/B |
| 2026-07-19 | WF-02 | Post-3.4 Batch 3 completato |
| 2026-07-19 | WF-02 | Post-3.4 Batch 2 completato |
| 2026-07-19 | WF-02 | Post-3.4 Batch 1 completato |
