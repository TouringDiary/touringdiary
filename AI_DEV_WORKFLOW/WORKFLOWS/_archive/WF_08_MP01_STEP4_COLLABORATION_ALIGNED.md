# WF-08 — MP-01 STEP-4: Collaborazione allineata

> **Workflow esecutivo** — esegue **esclusivamente** lo **STEP-4** di MP-01.
> Masterplan → `AI_DEV_WORKFLOW/MASTERPLANS/MP_01_VIAGGIO_DOMAIN_IMPLEMENTATION.md` § STEP-4.
> SoT dominio → `AI_CONTEXT/34A_DOMAIN_DESIGN_RULES.md` · `AI_CONTEXT/37_VIAGGIO_DOMAIN.md` § Collaborazione.
> Collaborazione target → `AI_CONTEXT/28_COLLABORATION_WORKSPACE_SYSTEM.md` **Parte A**.
> Visione / capacità → `AI_CONTEXT/35_MYSPACE_PRODUCT_VISION.md` · `AI_CONTEXT/36_MYSPACE_PRODUCT_MASTERPLAN.md` **C4**.
> Prerequisito chiuso → `WORKFLOWS/_archive/WF_07_MP01_STEP3_VIAGGIO_OPERATIVE_RESOURCES.md` (MP-01 STEP-3 Completato).
>
> **Governance:** lo STEP ufficiale è **MP-01 STEP-4**. Checklist T* = solo organizzazione interna.
>
> **Archiviato** in `WORKFLOWS/_archive/` — 2026-07-27.  
> **Non** eseguire. Storico ufficiale di MP-01 STEP-4.
>
> **Non** esegue MP-01 STEP-5. **Non** riprende WF-04 (Sospeso — PO-OV-002).  
> Successore esecutivo STEP-5 → `WORKFLOWS/_archive/WF_09_MP01_STEP5_RICORDI_ALLEGATI_MAPPA_RIEPILOGO.md` (Completato; **MP-01 concluso**).

---

## Metadati

| Campo | Valore |
|-------|--------|
| **ID** | WF-08 |
| **Nome** | MP-01 STEP-4 — Collaborazione allineata |
| **Stato Workflow** | **Completato** |
| **Masterplan** | `MASTERPLANS/MP_01_VIAGGIO_DOMAIN_IMPLEMENTATION.md` — **STEP-4** |
| **SSOT dominio** | DOC 34A · DOC 37 § Collaborazione · DOC 28 **Parte A** · DOC 35 · DOC 36 **C4** |
| **Owner** | PO + AI |
| **Creato** | 2026-07-26 |
| **Ultimo aggiornamento** | 2026-07-27 |
| **Aggiornato da** | PO — STEP-4 approvato; chiusura formale + archiviazione |
| **Capacità prodotto** | DOC 36 **C4** |
| **Workflow precedenti** | WF-07 Completato (archiviato) · WF-06…WF-05 Completati |
| **Workflow successivi MP-01** | **WF-09** (STEP-5) |

---

## Stato avanzamento (ricostruzione rapida)

| Campo | Valore corrente |
|-------|-----------------|
| **Workflow** | WF-08 — **Completato** (archiviato) |
| **STEP** | **MP-01 STEP-4** — Collaborazione allineata |
| **Fase** | **Completata** (Verifica PO ☑) |
| **% convenzionale** | 100 % |
| **Progresso operativo interno** | T1…T8 ☑ |
| **Codice applicativo** | Copy-only; WS-da-Viaggio; shell hub; legacy share invariato |

**Chiusura:** PO 2026-07-27 — gate MP-01 STEP-4 soddisfatto.

---

## Obiettivo

Allineare Workspace al dominio (DOC 28 Parte A): sole **copie**; introdurre **Workspace da Viaggio** (shell isomorfa DOC 37); mantenere share per risorsa; nessun share del Viaggio originale (DOC 34A).

---

## Gate uscita WF-08 (= MP-01 STEP-4)

- [x] Nessun share del Viaggio originale
- [x] Share risorse = sempre copia (nuovo ID)
- [x] WS-da-Viaggio: selezione → copie → shell struttura DOC 37; sezioni non copiate = vuote
- [x] Legacy share Diario / Valigia / Template ancora funzionante
- [x] Delete MySpace ↛ delete copie WS (e viceversa) rispettato
- [x] **Validazione PO finale**

| Gate | Stato |
|------|-------|
| Verifica PO finale | ☑ **Approvato** |
| Gate STEP-4 | ☑ **Completato** |
| Workflow | ☑ **Completato** |

---

## As-built

| Area | Deliverable |
|------|-------------|
| Copy-only | Rimosso `share_current` / «Condividi Originale»; materialize solo `duplicate_and_share` |
| Kind | `SHARED_RESOURCE_KINDS` senza `viaggio` |
| WS-da-Viaggio | Hook `useOpenWorkspaceFromViaggio`; CTA cartella; catalogo `resolveWorkspaceCompositionCatalogFromViaggio`; settings `viaggio_shell` |
| Hub | `WorkspaceViaggioShellNav` su Condivisione se morphologia shell; hub flat legacy invariato |
| Delete isolation | Diary copy con `viaggio_id: null` |
| Allegati UX | Nota ownership Workspace ≠ Allegati Viaggio |
| Smoke | `npm run collaboration:step4:smoke` |

---

## Checklist operativa interna

| Voce | Stato |
|------|-------|
| **T1**…**T8** | ☑ |

---

# STEP — MP-01 STEP-4

| Campo | Valore |
|-------|--------|
| **Stato STEP** | **Completato** |
| **DoD STEP** | Gate uscita ☑; T* ☑; Verifica PO ☑ |

### Fasi

| Fase | Stato | Inizio | Fine | PO ✓ |
|------|-------|--------|------|------|
| Analisi | Completata | 2026-07-26 | 2026-07-26 | ☑ |
| Pronto per implementazione | Completata | 2026-07-26 | 2026-07-27 | ☑ (`Avvia WF-08`) |
| Sviluppo | Completata | 2026-07-27 | 2026-07-27 | — |
| Review tecnica | Completata | 2026-07-27 | 2026-07-27 | — |
| Test | Completata | 2026-07-27 | 2026-07-27 | — |
| Verifica PO | **Completata** | 2026-07-27 | 2026-07-27 | ☑ |

---

## Log decisioni operative

| Data | Decisione | Chi |
|------|-----------|-----|
| 2026-07-26 | Apertura WF-08 post-chiusura WF-07; WF-04 non ripreso | PO |
| 2026-07-26 | Stessa governance STEP precedenti: un solo STEP = MP-01 STEP-4; no micro-STOP; checklist interna T1…T8 | PO |
| 2026-07-27 | `Avvia WF-08` — esecuzione continua T1…T8 → Verifica PO | PO |
| 2026-07-27 | Morphologia WS in `workspaces.settings` (`viaggio_shell`); nessuna migrazione schema | AI |
| 2026-07-27 | **Verifica PO approvata** — chiusura formale + archivio; apertura doc WF-09 | PO |

---

## Report finale

| Campo | Valore |
|-------|--------|
| **Risultato** | MP-01 STEP-4 / DOC 36 C4 soddisfatto |
| **Dominio** | Nessuna modifica SSOT (34A / 37 / 28 Parte A / 35 / 36) |
| **Smoke** | `collaboration:step4:smoke` OK |
| **Successore** | **WF-09** — MP-01 STEP-5 (doc aperta; Pronto per implementazione) |

---

## Chiusura Workflow

| Campo | Valore |
|-------|--------|
| **Data chiusura** | 2026-07-27 |
| **Validazione PO finale** | **Approvato** |
| **Gate MP-01 STEP-4** | ☑ Completato |
| **Workflow** | ☑ Completato |
| **Archiviato in** | `WORKFLOWS/_archive/WF_08_MP01_STEP4_COLLABORATION_ALIGNED.md` |
| **Successivo** | **WF-09** — MP-01 STEP-5 |

**Report operativo obbligatorio** → `00_DEVELOPMENT_PROTOCOL.md` §15.

---

## Cronologia stato

| Data | STEP | Fase | Stato | Nota |
|------|------|------|-------|------|
| 2026-07-26 | — | — | Non iniziato | File creato |
| 2026-07-26 | MP-01 STEP-4 | Pronto per implementazione | Attivo | Doc avvio; attesa `Avvia WF-08` |
| 2026-07-27 | MP-01 STEP-4 | Sviluppo → Review → Test | Attivo | Esecuzione continua T1…T8 |
| 2026-07-27 | MP-01 STEP-4 | In verifica PO | Attivo | Smoke OK |
| 2026-07-27 | MP-01 STEP-4 | Completata | Completato | PO approvato; archiviato |
