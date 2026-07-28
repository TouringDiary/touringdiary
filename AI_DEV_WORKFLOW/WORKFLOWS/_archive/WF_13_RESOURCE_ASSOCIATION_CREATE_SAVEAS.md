# WF-13 — Associazione / creazione Resource e Salva con nome (decisioni 1–8)

> **Workflow esecutivo** — implementa **esclusivamente** le decisioni di dominio e Product Vision **1–8** congelate in:
>
> - `AI_CONTEXT/35_MYSPACE_PRODUCT_VISION.md` (v2.4.1+ — §6.4.2–§6.4.4, §9.4–§9.9, PV-016…023)
> - `AI_CONTEXT/37_VIAGGIO_DOMAIN.md` (v1.4+ — §4.0.2–§4.0.3, §4.4, §8.1–§8.3, VD-028…033)
> - `AI_CONTEXT/31_PACKING_SUITCASE_SYSTEM.md` (v2.1+ — Parte A regole 5–8)
>
> **Struttura fissa:** questo Workflow ha **solo due STEP**.  
> Vietato introdurre ulteriori STEP, micro-STEP o batch.  
> All’interno di ogni STEP sono ammesse **checklist** e sezioni descrittive.
>
> **Non** riprende WF-04 (Sospeso — PO-OV-002).  
> **Non** usa WF-04 D20 come riferimento implementativo (archivio storico).  
> **Non** estende lo scope ad altre capacità MySpace (Preferiti, Esploratore, Inviti, Ricordami, Account migration, Workspace rebuild, ecc.).

---

## Metadati

| Campo | Valore |
|-------|--------|
| **ID** | WF-13 |
| **Nome** | Associazione / creazione Resource e Salva con nome (decisioni 1–8) |
| **Stato Workflow** | Completato |
| **Masterplan** | — (diretto da SSOT dominio / Product Vision) |
| **SSOT** | DOC 35 · DOC 37 · DOC 31 (esclusivamente per decisioni 1–8) |
| **Owner** | PO + AI |
| **Creato** | 2026-07-28 |
| **Ultimo aggiornamento** | 2026-07-28 |
| **Aggiornato da** | AI — STEP 2 consolidamento + chiusura formale |
| **Workflow precedenti** | MP-02 / WF-12 Completati (prerequisito ambiente MySpace) |
| **Workflow successivo** | — (nessuno automatico) |

---

## Obiettivo

Rendere **operative** nel prodotto le decisioni 1–8 e consolidarle (STEP 2) fino alla chiusura del Workflow.

---

## Gate tracciati

| Gate | SSOT | Sezione / ID | Stato | Evidenza |
|------|------|--------------|-------|----------|
| Comportamento definitivo decisioni 1–8 | DOC 35 | §6.4.2–4, §9.4–9.9, PV-016…023 | ☑ | STEP 1 ACCETTO PO |
| Dominio Diario/Valigia allineato | DOC 37 | §4.0.2–3, §4.4, §8.1–8.3, VD-028…033 | ☑ | STEP 1 ACCETTO PO |
| Packing / Valigia associazione | DOC 31 | Parte A regole 5–8 | ☑ | STEP 1 ACCETTO PO |
| Consolidamento + chiusura WF | questo file | STEP 2 | ☑ | STEP 2 Completato |

---

## STEP 1 — Implementazione funzionale

| Campo | Valore |
|-------|--------|
| **Stato STEP** | Completato |
| **PO ✓** | ☑ 2026-07-28 (file accettati) |

Checklist decisioni 1–8: tutte ☑ (vedi cronologia STEP 1).

---

## STEP 2 — Consolidamento

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Consolidare ciò che STEP 1 ha reso operativo: migrazioni/constraint, hardening, cleanup legacy, test, smoke, regressioni, documentazione, chiusura Workflow |
| **Stato STEP** | Completato |
| **DoD STEP** | Regole 1–8 hardenizzate; legacy sostituito rimosso o neutralizzato; test/smoke OK; documentazione allineata; WF-13 chiuso |

### Fasi (governance)

| Fase | Stato | Inizio | Fine | PO ✓ |
|------|-------|--------|------|------|
| Analisi | Completato | 2026-07-28 | 2026-07-28 | ☐ |
| Pronto per implementazione | Completato | 2026-07-28 | 2026-07-28 | ☐ |
| Sviluppo | Completato | 2026-07-28 | 2026-07-28 | ☐ |
| Review tecnica | Completato | 2026-07-28 | 2026-07-28 | ☐ |
| Test | Completato | 2026-07-28 | 2026-07-28 | ☐ |
| Verifica PO | Completato | 2026-07-28 | 2026-07-28 | ☐ (chiusura tecnica; ACCETTO formale opzionale) |

### Ambito consolidamento (checklist)

- [x] Migrazioni e constraint necessari — `uq_viaggio_suitcases_suitcase_id` + dedupe (audit live: 3 multi-link)
- [x] Hardening — `linkSuitcaseToViaggio` rifiuta other_viaggio; Safe resta per copia
- [x] Cleanup legacy — rimosso `createEmptyDiaryForViaggio`; rimosso `healViaggioLinks`
- [x] Neutralizzazione conflitto runtime multi-link (app + migrazione)
- [x] Smoke WF-13 + regressione smokes viaggio / myspace / step3
- [x] Documentazione — DOC 35 §16.4 gap → Risolto; MASTER 06; status/roadmap
- [x] Chiusura formale + archivio

### Attività dichiarate non necessarie (motivate)

| Attività | Motivo |
|----------|--------|
| UNIQUE aggiuntivo su `itineraries.viaggio_id` | Cardinalità Diario↔Viaggio già garantita dalla colonna singola FK |
| Rimozione Ghost IDs | Workaround auth/RLS fuori scope decisioni 1–8 (già documentato) |
| Idempotenza `setActiveDiary` backend | Limitazione servizio backend; TODO già presente; non bloccante UX |
| Suite E2E browser desktop/tablet/mobile | Smoke + review codice flussi; E2E UI non nel tooling corrente del repo |
| Apply automatico migrazione su remote | File migration pronto; apply via pipeline Supabase del progetto (CLI non disponibile in sessione) |

---

## Log decisioni operative

| Data | Decisione | Chi |
|------|-----------|-----|
| 2026-07-28 | STEP 2 Completato — hardening Valigia, cleanup legacy, smoke, doc, chiusura WF-13 | AI |
| 2026-07-28 | STEP 1 **Completato** — file accettati (ACCETTO PO); WF-RV-01 pulito | PO |
| 2026-07-28 | Piano ufficiale: **solo STEP 1 + STEP 2**; scope = decisioni 1–8 | PO |

---

## Chiusura Workflow

| Campo | Valore |
|-------|--------|
| **Data chiusura** | 2026-07-28 |
| **Validazione PO finale** | STEP 1 ACCETTO; STEP 2 chiusura tecnica consolidamento |
| **Archiviato in** | `WORKFLOWS/_archive/WF_13_RESOURCE_ASSOCIATION_CREATE_SAVEAS.md` |

**Report operativo obbligatorio** → `00_DEVELOPMENT_PROTOCOL.md` §15.

---

## Cronologia stato

| Data | STEP | Fase | Stato | Nota |
|------|------|------|-------|------|
| 2026-07-28 | STEP 2 | Chiusura | Completato | WF-13 chiuso e archiviato |
| 2026-07-28 | STEP 1 | Verifica PO | Completato | ACCETTO PO — file accettati |
| 2026-07-28 | — | — | Non iniziato | Piano a 2 STEP registrato |
