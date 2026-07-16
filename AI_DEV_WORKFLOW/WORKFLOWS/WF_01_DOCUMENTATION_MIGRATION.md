# WF-01 — Migrazione documentale completa

## Metadati

| Campo | Valore |
|-------|--------|
| **ID** | WF-01 |
| **Nome** | Migrazione documentale completa |
| **Stato Workflow** | Attivo |
| **SSOT** | `AI_CONTEXT/` (domini), `AI_CONTEXT_MASTER/` (vista consolidata) |
| **Owner** | PO + AI |
| **Creato** | 2026-07-13 |
| **Ultimo aggiornamento** | 2026-07-13 |
| **Aggiornato da** | Migrazione WF-01 |

---

## Obiettivo

Consolidare tutto il patrimonio documentale storico (`docs/`, root) nei tre layer ufficiali (`AI_CONTEXT`, `AI_CONTEXT_MASTER`, `AI_DEV_WORKFLOW`), certificato sul codice reale, senza perdita informativa.

---

## Motivazione

Documentazione storica frammentata in `docs/` con SSOT duplicati e riferimenti a file inesistenti (es. Specifica Funzionale). Un'unica migrazione strutturata evita drift e garantisce una fonte di verità per dominio.

---

## STEP-1 — Collaborazione e Workspace

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Certificare collaborazione v1 in `AI_CONTEXT/28` |
| **Stato STEP** | Completato |
| **DoD STEP** | DOC 28 v2.0 include regole funzionali, hub UI, wizard; `docs/collaboration/*` archiviati |

### Fasi

| Fase | Stato | PO ✓ |
|------|-------|------|
| Analisi | Completato | ☑ |
| Certificazione codice | Completato | ☑ |
| Scrittura SSOT | Completato | ☑ |
| Archivio storico | Completato | ☑ |

**Sorgenti migrate:** `PIANO_DI_SVILUPPO.md`, `GLOBAL_WORKSPACE_PANEL.md`, `WORKSPACE_WIZARD_MACROPHASE.md`

---

## STEP-2 — Packing / Valigia

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Creare `AI_CONTEXT/31_PACKING_SUITCASE_SYSTEM.md` |
| **Stato STEP** | Completato |
| **DoD STEP** | DOC 31 certificato post-macrofase C; `docs/packing/*` archiviati |

**Sorgenti migrate:** `PRE_MACROFASE_A_SNAPSHOT.md`, `MACROFASE_A_EXCEPTIONS.md`, `MACROFASE_C_MIGRATION_CONSTRAINTS.sql`

---

## STEP-3 — Design System Foundation

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Creare `AI_CONTEXT/32_DESIGN_SYSTEM_FOUNDATION.md` |
| **Stato STEP** | Completato |
| **DoD STEP** | DOC 32 include Foundation, layering, focus; WIP e modal-layering archiviati |

**Sorgenti migrate:** `FOUNDATION_CONSTITUTION_WIP.md`, `modal-layering.md`

---

## STEP-4 — Media / Foto editoriali

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Integrare governance `is_official` in DOC 16 |
| **Stato STEP** | Completato |
| **DoD STEP** | DOC 16 v2.0; `implementationplan_foto.md` archiviato |

---

## STEP-5 — Allineamento layer e chiusura

| Campo | Valore |
|-------|--------|
| **Obiettivo** | MASTER, coverage map, riferimenti incrociati, chiusura WF |
| **Stato STEP** | In verifica PO |
| **DoD STEP** | Nessun riferimento a `docs/collaboration` o path obsoleti in SSOT attivi; validazione PO finale registrata |

### Fasi

| Fase | Stato | PO ✓ |
|------|-------|------|
| Allineamento layer | Completato | ☐ |
| Verifica PO | In verifica PO | ☐ |

---

## Log decisioni operative

| Data | Decisione | Chi |
|------|-----------|-----|
| 2026-07-13 | Regole funzionali collaborazione ricostruite da codice + piano storico (Specifica Funzionale assente nel repo) | WF-01 |
| 2026-07-13 | DOC 31 Packing, DOC 32 Design System — nuovi SSOT dedicati | WF-01 |
| 2026-07-13 | Storico sempre in `docs/_archive/` con README indice | WF-01 |

---

## Chiusura Workflow

| Campo | Valore |
|-------|--------|
| **Data chiusura** | — *(dopo validazione PO finale)* |
| **Validazione PO finale** | In attesa |
| **Archiviato in** | File WF resta in `WORKFLOWS/` (riferimento storico processo) |

---

## Cronologia stato

| Data | STEP | Fase | Stato | Nota |
|------|------|------|-------|------|
| 2026-07-13 | 1–4 | Certificazione | Completato | Migrazione documentale STEP 1–4 |
| 2026-07-13 | 5 | Verifica PO | In verifica PO | Attesa validazione PO finale |
