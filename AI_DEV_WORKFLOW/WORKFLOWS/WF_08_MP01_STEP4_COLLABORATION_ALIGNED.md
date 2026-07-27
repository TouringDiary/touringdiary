# WF-08 — MP-01 STEP-4: Collaborazione allineata

> **Workflow esecutivo** — esegue **esclusivamente** lo **STEP-4** di MP-01.
> Masterplan → `AI_DEV_WORKFLOW/MASTERPLANS/MP_01_VIAGGIO_DOMAIN_IMPLEMENTATION.md` § STEP-4.
> SoT dominio → `AI_CONTEXT/34A_DOMAIN_DESIGN_RULES.md` · `AI_CONTEXT/37_VIAGGIO_DOMAIN.md` § Collaborazione.
> Collaborazione target → `AI_CONTEXT/28_COLLABORATION_WORKSPACE_SYSTEM.md` **Parte A**.
> Visione / capacità → `AI_CONTEXT/35_MYSPACE_PRODUCT_VISION.md` · `AI_CONTEXT/36_MYSPACE_PRODUCT_MASTERPLAN.md` **C4**.
> Prerequisito chiuso → `WORKFLOWS/_archive/WF_07_MP01_STEP3_VIAGGIO_OPERATIVE_RESOURCES.md` (MP-01 STEP-3 Completato).
>
> **Governance:** lo STEP ufficiale è **MP-01 STEP-4**. Non esistono STEP WF intermedi.
> Checklist / batch tecnici = piano operativo interno (non unità di avanzamento, non STOP PO).
>
> **Non** esegue MP-01 STEP-5.  
> **Non** riprende WF-04 (Sospeso — PO-OV-002).  
> **Non** apre WF-09 finché il PO non chiude la Verifica PO di questo Workflow.

---

## Metadati

| Campo | Valore |
|-------|--------|
| **ID** | WF-08 |
| **Nome** | MP-01 STEP-4 — Collaborazione allineata |
| **Stato Workflow** | Attivo |
| **Masterplan** | `MASTERPLANS/MP_01_VIAGGIO_DOMAIN_IMPLEMENTATION.md` — **STEP-4** |
| **SSOT dominio** | DOC 34A · DOC 37 § Collaborazione · DOC 28 **Parte A** · DOC 35 · DOC 36 **C4** |
| **Owner** | PO + AI |
| **Creato** | 2026-07-26 |
| **Ultimo aggiornamento** | 2026-07-27 |
| **Aggiornato da** | AI — implementazione continua STEP-4 → Verifica PO |
| **Capacità prodotto** | DOC 36 **C4** |
| **Workflow precedenti** | WF-07 Completato (archiviato) · WF-06…WF-05 Completati |
| **Workflow successivi MP-01** | **Non** aperti — solo dopo gate STEP-4 + ordine PO |

---

## Stato avanzamento (ricostruzione rapida)

| Campo | Valore corrente |
|-------|-----------------|
| **Workflow** | WF-08 — **Attivo** |
| **STEP** | **MP-01 STEP-4** — Collaborazione allineata |
| **Fase** | **In verifica PO** |
| **% convenzionale** | 90 % |
| **Progresso operativo interno** | T1…T8 eseguiti; smoke `collaboration:step4:smoke` OK |
| **Codice applicativo** | Copy-only; WS-da-Viaggio; shell hub; legacy share invariato |

**Prompt ripresa (chiusura):** review PO / `ACCETTO` sui deliverable STEP-4  
**Attesa:** unica approvazione formale di chiusura (Verifica PO). **Non** aprire WF-09.

---

## Obiettivo

Allineare Workspace al dominio (DOC 28 Parte A): sole **copie**; introdurre **Workspace da Viaggio** (shell isomorfa DOC 37); mantenere share per risorsa; nessun share del Viaggio originale (DOC 34A).

Risultato atteso (criteri MP-01 STEP-4 / DOC 36 C4): nessun percorso «Condividi Originale» sul Viaggio; share risorse = sempre nuovo ID; WS-da-Viaggio con selezione → copie → shell; legacy share Diario/Valigia/Template ancora funzionante; delete MySpace ↛ delete copie WS (e viceversa).

---

## Motivazione

- STEP-1…3 hanno reso persistente il Viaggio, catalogo/cartella MySpace e risorse operative (Diario, Valigia, Roadbook).
- La collaborazione runtime (DOC 28 Parte B) non era allineata al target Parte A / dominio congelato.
- WF-04 resta sospeso; questo WF non lo riprende.

---

## Governance di questo Workflow

| Regola | Applicazione |
|--------|--------------|
| Unità di avanzamento | Solo **MP-01 STEP-4** |
| Fasi ufficiali | Analisi → Pronto → Sviluppo → Review → Test → **Verifica PO** |
| Checklist / batch tecnici | Piano operativo interno; **non** richiedono approvazione PO |
| STOP intermedi | **Non previsti** — esecuzione lineare dell’intero STEP-4, poi Verifica PO |
| Approvazione PO avvio codice | Ricevuta via `Avvia WF-08` (2026-07-27) |
| Approvazione PO chiusura | Solo in **Verifica PO** |
| Interruzione in Sviluppo | Solo: decisione architetturale non coperta · modifica SSOT · alternative equivalenti PO · blocco tecnico reale |

---

## Modalità di esecuzione dello STEP

1. **MP-01 STEP-4** = singola unità di lavoro ufficiale.
2. Le checklist **T1…T8** sono solo organizzazione interna.
3. Esecuzione continua dopo `Avvia WF-08` fino a Verifica PO.
4. **Non** creati stop artificiali tra T*.
5. Interruzione solo nei casi già previsti dalla governance — nessuno in questa esecuzione.

---

## Confini

### Incluso

| # | Incluso | Stato |
|---|---------|-------|
| I1 | Hardening modello copie (nessun share Viaggio originale) | ☑ |
| I2 | Share risorse = sempre copia (nuovo ID) | ☑ |
| I3 | Entry / wizard **Workspace da Viaggio** (selezione risorse → copie) | ☑ |
| I4 | Shell hub isomorfa DOC 37 per WS-da-Viaggio; sezioni non copiate = vuote | ☑ |
| I5 | Legacy share Diario / Valigia / Template ancora funzionante | ☑ |
| I6 | Delete MySpace ↛ delete copie WS (e viceversa) | ☑ (copie diary `viaggio_id: null`) |
| I7 | Chiarezza UX Allegati Workspace vs Allegati del Viaggio (ownership) | ☑ |
| I8 | Smoke collaborazione allineata al dominio | ☑ `npm run collaboration:step4:smoke` |

### Escluso (esplicitamente)

| # | Escluso | Dove vive |
|---|---------|-----------|
| E1 | Ricordi · Allegati · Mappa · Riepilogo **funzionali** (oltre chiarezza ownership) | MP-01 STEP-5 |
| E2 | Preferiti / Esploratore / Strumenti profondi | DOC 36 oltre C4 |
| E3 | Ripresa WF-04 | Vietato |
| E4 | Nuove sezioni dominio / nuova Product Vision | Vietato |
| E5 | Feature Flag collaborazione come toggle Centro di Controllo | Fuori MP-01 |
| E6 | Condivisione del Viaggio originale | Vietato (dominio) |
| E7 | Modifica schema fondazione Viaggio/Diario/Valigia/Roadbook salvo bug bloccante STEP-4 | STEP-1…3 chiusi |

---

## Prerequisiti

| Prerequisito | Stato | Nota |
|--------------|-------|------|
| MP-01 STEP-4 letto | ☑ | |
| DOC 34A / 37 / 28 Parte A / 35 / 36 C4 | ☑ | Congelati / target |
| WF-07 Completato (STEP-3) | ☑ | Archiviato |
| WF-04 non ripreso | ☑ | PO-OV-002 |
| `06_CHANGE_IMPACT_RULES.md` prima del codice | ☑ | Dichiarato in T1 |
| Autorizzazione PO ad avviare Sviluppo | ☑ | `Avvia WF-08` 2026-07-27 |

---

## Gate tracciati

| Gate | Dove definito | Stato | Evidenza |
|------|---------------|-------|----------|
| Criteri completamento MP-01 STEP-4 | MP-01 § STEP-4 | ☑ implementativi | Checklist Gate uscita |
| DOC 36 C4 | DOC 36 | ☑ implementativo | Collaborazione allineata |
| Dominio non riaperto | DOC 34A / 37 / 28 Parte A | ☑ | Nessuna modifica SSOT |
| Nessun anticipo MP-01 STEP-5 | Confini E* | ☑ | Solo ownership Allegati UX |
| Verifica PO finale STEP-4 | Chiusura WF-08 | ☐ | **In corso** |

### Gate uscita WF-08 (= MP-01 STEP-4)

- [x] Nessun share del Viaggio originale
- [x] Share risorse = sempre copia (nuovo ID)
- [x] WS-da-Viaggio: selezione → copie → shell struttura DOC 37; sezioni non copiate = vuote
- [x] Legacy share Diario / Valigia / Template ancora funzionante
- [x] Delete MySpace ↛ delete copie WS (e viceversa) rispettato
- [ ] **Validazione PO finale** (unica)

---

## Dichiarazione impatto (DOC 06) — T1

| Campo | Valore |
|-------|--------|
| **Problema** | Allineare collaborazione runtime a DOC 28 Parte A (copy-only + WS-da-Viaggio) |
| **Impattato** | Wizard share, materialize, hub Condivisione, entry MySpace cartella, settings WS |
| **Non impattato** | Stripe, packing core, schema fondazione Viaggio STEP-1…3, Ricordi/Mappa funzionali STEP-5 |
| **Nuove decisioni di dominio** | Nessuna |
| **Modifica SSOT** | Nessuna |

---

## Checklist operativa interna (ordine consigliato)

> **Non** sono STEP di workflow. **Non** richiedono approvazione PO.

| Voce | Contenuto | Criterio | Stato |
|------|-----------|----------|-------|
| **T1** | Lettura `06_CHANGE_IMPACT_RULES` + mappa collaboration / wizard / hub | Impatto chiaro | ☑ |
| **T2** | Hardening modello copie; blocco share Viaggio originale | Nessun share originale | ☑ |
| **T3** | Share risorse = sempre copia (nuovo ID) verificato end-to-end | Copy-only | ☑ |
| **T4** | Wizard / entry WS-da-Viaggio (selezione → copie) | Entry prodotto | ☑ |
| **T5** | Shell hub isomorfa DOC 37; slot vuoti per sezioni non copiate | Shell coerente | ☑ |
| **T6** | Legacy share Diario / Valigia / Template non regresso | Dual-entry collab ok | ☑ |
| **T7** | Smoke collaborazione + invarianti delete MySpace ↛ WS | Gate C4 praticabile | ☑ |
| **T8** | Aggiornamento status/roadmap → Verifica PO | Doc chiusura | ☑ |

---

# STEP — MP-01 STEP-4 — Collaborazione allineata

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Completare i criteri di MP-01 STEP-4 (collaborazione allineata al dominio) |
| **Stato STEP** | **Attivo** — implementato; **In verifica PO** |
| **DoD STEP** | Gate uscita WF-08 (implementativi ☑); checklist T1…T8 ☑; **Verifica PO** ☐ |

### Fasi

| Fase | Stato | Inizio | Fine | PO ✓ |
|------|-------|--------|------|------|
| Analisi | Completata | 2026-07-26 | 2026-07-26 | ☑ |
| Pronto per implementazione | Completata | 2026-07-26 | 2026-07-27 | ☑ (`Avvia WF-08`) |
| Sviluppo | Completata | 2026-07-27 | 2026-07-27 | — |
| Review tecnica | Completata | 2026-07-27 | 2026-07-27 | — |
| Test | Completata | 2026-07-27 | 2026-07-27 | — smoke OK |
| Verifica PO | **In corso** | 2026-07-27 | | ☐ |

### Deliverable tecnici (sintesi)

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

## Log decisioni operative

| Data | Decisione | Chi |
|------|-----------|-----|
| 2026-07-26 | Apertura WF-08 post-chiusura WF-07; WF-04 non ripreso | PO |
| 2026-07-26 | Stessa governance STEP precedenti: un solo STEP = MP-01 STEP-4; no micro-STOP; checklist interna T1…T8 | PO |
| 2026-07-26 | Nessun codice fino a review WF + esplicito `Avvia WF-08` | PO |
| 2026-07-27 | `Avvia WF-08` — esecuzione continua T1…T8 → Verifica PO; WF-09 non aperto | PO |
| 2026-07-27 | Morphologia WS in `workspaces.settings` (`viaggio_shell`); nessuna migrazione schema | AI (coperta da DOC 28 / createWorkspace settings) |

*Decisioni di dominio → DOC 34A / 37 / 28 Parte A / 35 / 36. Non riaprire Vision.*

---

## Review tecnica (sintesi)

- Nessuna contraddizione SSOT rilevata; nessun blocco tecnico.
- Percorsi share legacy (`entryMode: 'share' | 'create_workspace' | 'add_element_to_workspace'`) aggiornati a copy-only senza rimuovere entry points Diario/Valigia/Template.
- Dual-mode hub: flat se `settings` senza morphologia; shell DOC 37 se `morphology === 'viaggio_shell'`.
- Lint: nessun errore nuovo sui file STEP-4 (errori preesistenti fuori scope).

---

## Chiusura Workflow

| Campo | Valore |
|-------|--------|
| **Data chiusura** | |
| **Validazione PO finale** | **In attesa** |
| **Gate MP-01 STEP-4** | ☐ (implementativi ☑) |
| **Archiviato in** | `WORKFLOWS/_archive/` (dopo ACCETTO PO) |
| **Successivo** | Workflow MP-01 STEP-5 — **solo** su ordine PO |

**Report operativo obbligatorio** → `00_DEVELOPMENT_PROTOCOL.md` §15.

---

## Cronologia stato

| Data | STEP | Fase | Stato | Nota |
|------|------|------|-------|------|
| 2026-07-26 | — | — | Non iniziato | File creato |
| 2026-07-26 | MP-01 STEP-4 | Pronto per implementazione | Attivo | Doc avvio; attesa `Avvia WF-08` |
| 2026-07-27 | MP-01 STEP-4 | Sviluppo → Review → Test | Attivo | Esecuzione continua T1…T8 |
| 2026-07-27 | MP-01 STEP-4 | **In verifica PO** | Attivo | Smoke OK; WF-09 non aperto |
