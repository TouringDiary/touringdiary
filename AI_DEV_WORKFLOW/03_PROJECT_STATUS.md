# 03 — Project Status (Dashboard)

> **Sintesi operativa** — lettura target **< 10 secondi**.
> **Nessun dettaglio** STEP/Fasi/checklist (→ `WORKFLOWS/WF_XX_*.md` / `MASTERPLANS/`).
> **Nessuna definizione Gate** (→ SSOT in `AI_CONTEXT`).

**Ultimo aggiornamento:** 2026-07-28 — **Aggiornato da:** AI — **WF-13 Completato** (archiviato)

---

## In sintesi

- **MP-01:** **Completato** (STEP-1…5).
- **MP-02:** **Completato** (STEP-1…3 — WF-10…WF-12 archiviati).
- **WF-13…WF-05:** **Completati** (archiviati).
- **WF-02:** Attivo — hold STEP-4; **PO-OV-001**.
- **WF-04:** **Sospeso** (`PO-OV-002`).
- **WF-03:** **Completato**.

**Prossima attività:** Nessuna ripresa automatica MySpace; nuovo Workflow solo su decisione PO. Hold WF-02 STEP-4 resta.  
**SoT:** `03_PROJECT_STATUS.md` · `01_EXECUTION_ROADMAP.md` · DOC 35 / 37 / 31

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
| WF-08 | MP-01 STEP-4 Collaborazione allineata | Completato | — | — | 100 | Archiviato |
| WF-09 | MP-01 STEP-5 Ricordi · Allegati · Mappa · Riepilogo | Completato | — | — | 100 | Archiviato |
| WF-10 | MP-02 STEP-1 MySpace shell | Completato | — | — | 100 | Archiviato |
| WF-11 | MP-02 STEP-2 Sezioni Viaggio | Completato | — | — | 100 | Archiviato |
| WF-12 | MP-02 STEP-3 Root MySpace | Completato | — | — | 100 | Archiviato |
| WF-13 | Associazione / creazione Resource e Salva con nome (decisioni 1–8) | Completato | — | — | 100 | Archiviato |

---

## Gate aperti (riferimento)

| Gate | SoT | Owner WF | Stato |
|------|-----|----------|-------|
| Gate MP-01 STEP-5 / chiusura MP-01 | MP-01 / WF-09 | WF-09 | ☑ Completato |
| Gate MP-02 STEP-1 / WF-10 | MP-02 / DOC 35 | WF-10 | ☑ Completato (ACCETTO PO) |
| Gate MP-02 STEP-2 / WF-11 | MP-02 / DOC 37 | WF-11 | ☑ Completato (ACCETTO PO) |
| Gate MP-02 STEP-3 / WF-12 | MP-02 / DOC 35 | WF-12 | ☑ Completato (review codice) |
| Gate chiusura formale STEP-3 WF-02 | WF-02 / DOC 28–30 | WF-02 | ☐ Audit A + Validazione |
| Gate avvio STEP-4 WF-02 | WF-02 | WF-02 | ☐ hold PO |
| Gate STEP 1 WF-13 | DOC 35/37/31 · WF-13 | WF-13 | ☑ Completato (ACCETTO PO) |
| Gate chiusura WF-13 (STEP 2) | WF-13 | WF-13 | ☑ Completato |

---

## Dipendenze / blocchi

| Da | A | Motivo | Stato |
|----|---|--------|-------|
| WF-12 | Chiusura MP-02 | Sequenza | **Risolta** — WF-12 Completato; **MP-02 concluso** |
| Ambiente MySpace (post MP-02) | WF-13 | Prerequisito funzionale create/associa | **Risolta** — WF-13 Completato |
| WF-11 | WF-12 | Sequenza MP-02 | **Risolta** — WF-11 Completato |
| WF-10 | WF-11 | Sequenza MP-02 | **Risolta** — WF-10 Completato |
| WF-09 | Chiusura MP-01 | Sequenza | **Risolta** — MP-01 concluso |
| WF-02 Audit A | Chiusura formale STEP-3 WF-02 | Sequenza | Aperta (hold) |

---

## Overrule PO attivi

| ID | Tipo | Nota |
|----|------|------|
| PO-OV-001 | hold | WF-02 hold STEP-4 |
| PO-OV-002 | `suspend` | WF-04 sospeso; non riprendere sull’alias Diario≡Viaggio (MP-01 concluso) |

---

## Cronologia breve

| Data | Nota |
|------|------|
| 2026-07-28 | **WF-13 Completato** (STEP 2 consolidamento + archivio) |
| 2026-07-28 | **WF-13 STEP 1 Completato** (ACCETTO PO — file accettati) |
| 2026-07-28 | **WF-13 STEP 1** implementato → **In verifica PO** (decisioni 1–8) |
| 2026-07-28 | Apertura piano **WF-13** (decisioni 1–8 create/associa/Salva con nome) — **solo 2 STEP** |
| 2026-07-28 | WF-12 **Completato** (archiviato); **MP-02 concluso** |
| 2026-07-27 | WF-10 / WF-11 / allineamento DOC MySpace + MP-02 |
| 2026-07-26 | WF-07 **Completato**; apertura WF-08 |
