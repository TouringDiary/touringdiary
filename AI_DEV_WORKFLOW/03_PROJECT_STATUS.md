# 03 — Project Status (Dashboard)

> **Sintesi operativa** — lettura target **< 10 secondi**.
> **Nessun dettaglio** STEP/Fasi/checklist (→ `WORKFLOWS/WF_XX_*.md` / `MASTERPLANS/`).
> **Nessuna definizione Gate** (→ SSOT in `AI_CONTEXT`).

**Ultimo aggiornamento:** 2026-07-27 — **Aggiornato da:** AI — WF-08 STEP-4 implementato → **In verifica PO**

---

## In sintesi

- **WF-08:** **MP-01 STEP-4** — Fase **In verifica PO** (copy-only, WS-da-Viaggio, shell hub; smoke OK).
- **WF-07:** **Completato** (archiviato) — MP-01 STEP-3.
- **WF-06 / WF-05:** **Completati** (archiviati).
- **MP-01:** STEP-1…3 chiusi; STEP-4 in Verifica PO via WF-08; STEP-5 / WF-09 **non** aperti.
- **WF-04:** **Sospeso** (`PO-OV-002`).
- **WF-03:** **Completato**.
- **WF-02:** hold STEP-4; **PO-OV-001**.

**Prompt ripresa:** review PO / `ACCETTO` deliverable WF-08  
**SoT:** `WORKFLOWS/WF_08_MP01_STEP4_COLLABORATION_ALIGNED.md`

---

## Workflow

| WF | Nome | Stato WF | STEP corrente | Fase corrente | % | Blocco |
|----|------|----------|---------------|---------------|---|--------|
| WF-02 | Implementation Masterplan | Attivo | STEP-3 | Post-3.4 — hold | 99 | Audit A + Validazione STEP-3 |
| WF-03 | MySpace Macrofase 1 | Completato | — | — | 100 | — |
| WF-04 | MySpace Macrofase 2 | Sospeso | — | — | — | PO-OV-002 |
| WF-05 | MP-01 STEP-1 | Completato | — | — | 100 | Archiviato |
| WF-06 | MP-01 STEP-2 | Completato | — | — | 100 | Archiviato |
| WF-07 | MP-01 STEP-3 | Completato | — | — | 100 | Archiviato |
| WF-08 | MP-01 STEP-4 Collaborazione allineata | Attivo | **MP-01 STEP-4** | **In verifica PO** | 90 | Attesa ACCETTO PO |

---

## Gate aperti (riferimento)

| Gate | SoT | Owner WF | Stato |
|------|-----|----------|-------|
| Gate MP-01 STEP-4 | MP-01 / WF-08 | WF-08 | ☐ Verifica PO |
| Gate MP-01 STEP-5 | MP-01 | — | ☐ non aperto |

---

## Dipendenze / blocchi

| Da | A | Motivo | Stato |
|----|---|--------|-------|
| WF-07 | WF-08 | Prerequisito STEP-3 | **Risolta** |
| MP-01 STEP-4 | WF-08 | Esecuzione | **In verifica PO** |
| WF-08 gate | WF MP-01 STEP-5 (da creare) | Sequenza | Bloccata finché Verifica PO WF-08 aperta |

---

## Overrule PO attivi

| ID | Tipo | Nota |
|----|------|------|
| PO-OV-001 | hold | WF-02 hold STEP-4 |
| PO-OV-002 | `suspend` | WF-04 sospeso; piano = MP-01 e relativi Workflow esecutivi |

---

## Cronologia breve

| Data | Nota |
|------|------|
| 2026-07-27 | WF-08: STEP-4 implementato → **In verifica PO** (WF-09 non aperto) |
| 2026-07-26 | WF-07 **Completato** (archiviato); apertura **WF-08** (MP-01 STEP-4) — solo doc |
| 2026-07-26 | WF-07: STEP-3 → In verifica PO |
