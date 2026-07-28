# WF-04 — MySpace Macrofase 2 (I miei Viaggi) — SOSPESO

> ## SOSPENSIONE UFFICIALE (2026-07-26)
>
> Questo Workflow è **Sospeso** (`PO-OV-002`).
>
> **Non riprendere** lo sviluppo su presupposto **Diario ≡ Viaggio** / alias `itineraries`.
> Dominio congelato → `AI_CONTEXT/34A_DOMAIN_DESIGN_RULES.md` · `AI_CONTEXT/37_VIAGGIO_DOMAIN.md`.
> Implementazione ufficiale → `AI_DEV_WORKFLOW/MASTERPLANS/MP_01_VIAGGIO_DOMAIN_IMPLEMENTATION.md`.
>
> Il contenuto sotto resta **archivio delle analisi STEP-1 / piano STEP-2 pre-freeze**.
> Non è Source of Truth del dominio né piano esecutivo vigente.

---

> ## Nota sul contenuto storico
>
> Tutte le sezioni successive che descrivono:
>
> - STEP
> - Fasi
> - Stato di avanzamento
> - Checklist operative
> - Piano batch
> - Prompt di ripresa
> - Definition of Done
> - Piano di test
> - Componenti da implementare
> - Report operativo
>
> rappresentano esclusivamente lo stato del Workflow al momento della sospensione.
>
> Non costituiscono un piano esecutivo vigente.
>
> In caso di futura implementazione del dominio Viaggio, fare riferimento esclusivamente a:
>
> - `AI_CONTEXT/34A_DOMAIN_DESIGN_RULES.md`
> - `AI_CONTEXT/37_VIAGGIO_DOMAIN.md`
> - `AI_CONTEXT/35_MYSPACE_PRODUCT_VISION.md`
> - `AI_CONTEXT/36_MYSPACE_PRODUCT_MASTERPLAN.md`
> - `AI_DEV_WORKFLOW/MASTERPLANS/MP_01_VIAGGIO_DOMAIN_IMPLEMENTATION.md`
>
> Eventuali nuovi Workflow dovranno essere creati partendo da MP-01 e non da questo documento.

---

> **Workflow operativo** — *storico* Macrofase 2 sul modello pre-freeze.
> SoT vigenti → DOC 34A · DOC 37 · DOC 35 v2 · DOC 36 v2 · MP-01.

---

## Metadati

| Campo | Valore |
|-------|--------|
| **ID** | WF-04 |
| **Nome** | MySpace Macrofase 2 — I miei Viaggi (cuore) |
| **Stato Workflow** | **Sospeso** |
| **SSOT / Masterplan (vigenti)** | DOC 34A · DOC 37 · DOC 35 v2 · DOC 36 v2 · MP-01 · DOC 28 v3 |
| **Owner** | PO + AI |
| **Creato** | 2026-07-25 |
| **Ultimo aggiornamento** | 2026-07-26 |
| **Aggiornato da** | PO — freeze dominio Viaggio; sospensione WF-04 (PO-OV-002); SoT riscritta |
| **Macrofase Masterplan** | *Superseduta* — ordine capacità DOC 36 v2 + implementazione MP-01 |
| **Prerequisito Macrofase** | WF-03 Completato — gate Macrofase 1 ☑ |
| **Override** | **PO-OV-002** `suspend` |

---

## Obiettivo *(storico — non eseguire)*

Rendere **I miei Viaggi** il cuore di MySpace sul modello allora vigente.

**Obiettivo vigente:** vedi MP-01 (STEP-1…5) e DOC 36 v2.  
Struttura Viaggio vigente: Diario[] · Valigia[] · Ricordi · Allegati · Roadbook · Mappa · Riepilogo (DOC 37).

---

## Motivazione

- Macrofase 1 (contenitore MyWorld / shell MySpace / root / breadcrumb root / Account) è **chiusa** (WF-03).
- Senza cuore **I miei Viaggi**, MySpace resta una shell con placeholder: la visione DOC 35 non è ancora abitabile.
- Macrofase 3 (Preferiti / Esploratore) e 4 (Strumenti / Inviti / ponti) dipendono da un modello viaggio stabile.
- Il codice as-is già offre catalogo Profilo, diario, packing link — Macrofase 2 **ricompone**, non reinventa da zero.

---

## Confini della macrofase

### Incluso

| # | Incluso |
|---|---------|
| I1 | Sezione root **I miei Viaggi** in MySpace con catalogo reale (riuso dominio itinerari) |
| I2 | **Cartella viaggio** (apertura, identità, copertina auto/manuale; carosello silenzioso) |
| I3 | Dimensioni: **Diario**, **Valigia del viaggio**, **Foto**, **Allegati del viaggio**, **Statistiche**, **Ricordi** |
| I4 | Breadcrumb cliccabile fino a viaggio e dimensione |
| I5 | Riuso diario operativo come dimensione Diario (senza duplicare una seconda casa) |
| I6 | Riuso linking packing esistente per Valigia del viaggio |
| I7 | Confine mentale allegati viaggio vs Workspace; Foto vs Community |
| I8 | Gestione tab Account **I Miei Viaggi** (migrazione mentale / ponte — senza mentire all’utente) |
| I9 | Smoke regressione diario + Workspace hub + shell MySpace root non-viaggi |
| I10 | Filosofia silenziosa (no feed/XP/classifiche nella cartella viaggio) |

### Escluso (esplicitamente)

| # | Escluso | Perché |
|---|---------|--------|
| E1 | Preferiti globali / Segnalibro / filtri POI | Macrofase 3 |
| E2 | Esploratore con aggregati reali sulla storia | Macrofase 3 (root resta placeholder) |
| E3 | Strumenti pieni (liste valigie permanenti / template) | Macrofase 4 |
| E4 | Inviti Workspace pieni in MySpace | Macrofase 4 |
| E5 | Messaggi “salvato → MySpace” / ponti UX salvataggio | Macrofase 4 |
| E6 | Modalità **Rivivere** come sezione dedicata | Desiderata / modalità di Ricordi — non sezione M2 |
| E7 | Ricordami / On This Day / Mappa personale | Desiderata DOC 35; fuori dalle 4 macrofasi obbligatorie |
| E8 | Tab proibite nel viaggio: Preferiti, POI visitati, Timeline, Rivivere | DOC 35 §5.3 |
| E9 | Migration DB / nuove tabelle Preferiti / Feature Flag Ricordami | Fuori Macrofase 2 salvo decisione PO esplicita in Analisi (default: **no**) |
| E10 | Rewrite completo UserDashboard / business / wallet | Solo impatto tab Viaggi e confini |
| E11 | Rifattorizzazione hub Workspace o Community likes | Confine; non riscrivere |
| E12 | Workflow Macrofase 3–4 | Vietato creare ora |

---

## Prerequisiti

| Prerequisito | Stato | Nota |
|--------------|-------|------|
| DOC 35 Product Vision (§5 I miei Viaggi) | ☑ | Dimensioni e anti–tab chiusi |
| DOC 36 Masterplan Macrofase 2 letto | ☑ | Gate §4.9 |
| WF-03 Macrofase 1 Completato (gate §3.9) | ☑ | Shell, 5 root, breadcrumb root, Account |
| Shell MySpace + root `trips` esistente in codice | ☑ | Placeholder STEP-3 M1 — da riempire |
| `06_CHANGE_IMPACT_RULES.md` da rileggere prima del codice | ☐ | Obbligatorio a STEP di implementazione |
| WF-02 chiuso **oppure** parallel MySpace autorizzato | ☑ | WF-02 hold; PO apre WF-04 (stesso principio PO-OV-001) |
| `03_PROJECT_STATUS.md` aggiornato all’apertura | ☑ | All’atto di creazione di questo file |
| Nessun Workflow Macrofase 3–4 creato | ☑ | Vincolo PO |

---

## Override PO

| ID | Data | Tipo | WF | Motivazione | Condizioni / rischi | Scadenza review | Approvato da |
|----|------|------|-----|-------------|---------------------|-----------------|--------------|
| **PO-OV-001** (principio) | 2026-07-24 | `parallel_start` | WF-02 + track MySpace | MySpace in parallelo a WF-02 hold STEP-4 | Non fondere scope CC/Sponsor con MySpace; WF-02 STEP-4 non avviato senza nuova decisione | 2026-08-24 | PO |
| **Apertura WF-04** | 2026-07-25 | Avvio Macrofase 2 | WF-04 | PO richiede Workflow M2 dopo chiusura M1 | Solo documentale all’apertura; codice solo post STEP-1 + Pronto per implementazione | — | PO (questa richiesta) |

*Registro override formale in `02_GOVERNANCE.md` se il PO richiede ID dedicato (es. PO-OV-002); principio parallelismo già vigente.*

---

## Gate tracciati

| Gate | Dove definito | Stato | Evidenza |
|------|---------------|-------|----------|
| Gate uscita Macrofase 1 | DOC 36 §3.9 / WF-03 | ☑ | Prerequisito soddisfatto |
| Gate uscita Macrofase 2 (prodotto) | DOC 36 §4.9 | ☐ | Compilare a chiusura WF-04 |
| Naming / dimensioni viaggio / anti–tab | DOC 35 §5 | ☑ | Vision chiusa — non rinegoziare in WF-04 |
| Gate esecuzione STEP-1 → codice | Questo WF — STEP-1 Completato | ☐ | Analisi congelata + PO ✓ |
| Nessuna migration non autorizzata | Questo WF — E9 | ☐ | Verifica a ogni STEP di sviluppo |

---

## Analisi del codice esistente (as-is tecnico)

### Shell MySpace (post Macrofase 1 — pronta)

| Elemento | Path / simbolo | Ruolo oggi |
|----------|----------------|------------|
| Root constants | `src/myspace/mySpaceRoots.ts` | `trips` = I miei Viaggi (default); placeholder copy |
| Shell | `src/components/myspace/MySpaceMinimalShell.tsx` | Focus `mySpace`; nav 5 root; breadcrumb MyWorld/MySpace/root |
| Root nav | `src/components/myspace/MySpaceRootNav.tsx` | Tab root |
| Placeholder | `src/components/myspace/MySpaceSectionPlaceholder.tsx` | Empty state silenzioso per `trips` e altre root |
| Chooser | `src/components/myworld/MyWorldChooserPanel.tsx` | MyWorld → MySpace \| Workspace |
| Breadcrumb | `src/components/myworld/MyWorldBreadcrumb.tsx` | Estendere a viaggio/dimensione in M2 |
| Focus | `focusModeRegistry.ts`, `WorkspaceHost.tsx` | Sessioni `myWorld` / `mySpace` |

### Catalogo viaggi (oggi in Account)

| Elemento | Path / simbolo | Ruolo |
|----------|----------------|-------|
| Tab Viaggi | `src/components/user/dashboard/UserTripsTab.tsx` | Lista itinerari salvati, apri, elimina |
| Dashboard | `src/components/user/UserDashboard.tsx` | Host tab Account |
| Sidebar Account | `src/components/user/dashboard/UserSidebar.tsx` | Voce «I Miei Viaggi» |
| Router tabs | `src/hooks/useAppRouter.ts` — `USER_DASHBOARD_TABS.trips` | URL dashboard |

### Diario / itinerari / packing

| Elemento | Path / area | Ruolo |
|----------|-------------|-------|
| Diario sidebar / overlay | `Sidebar`, diary packing suite | Pianificazione e vivere il viaggio |
| Save / progetti | `src/hooks/save/*`, contesti itinerary | Persistenza progetti salvati |
| Valigia ↔ viaggio | dominio packing / SuitcaseFloatingPanel | Linking esistente |
| Condivisione diario → WS | flussi collaboration | Ponte verso Workspace (non eliminare) |

### Media / allegati (confini)

| Elemento | Ruolo oggi | Attenzione M2 |
|----------|------------|---------------|
| Gallery città / Community photo | Foto prodotto non per-viaggio | Non confondere con **Foto** del viaggio |
| Allegati Workspace hub | Documenti di gruppo | Distinti da **Allegati del viaggio** |

### Cosa manca (target Macrofase 2)

- Catalogo **I miei Viaggi** dentro MySpace (sezione `trips` piena).
- Modello UI **cartella viaggio** + copertina + carosello silenzioso.
- Navigazione dimensioni canoniche + stato attivo dimensione.
- Breadcrumb livelli viaggio / dimensione.
- Distinzione UX Foto / Ricordi / Allegati personali.
- Strategia tab Account Viaggi (ponte / redirect / dual-entry temporaneo — da decidere in STEP-1).

---

## Componenti e sistemi da riutilizzare

| Sistema | Riuso obbligatorio | Vietato |
|---------|-------------------|---------|
| Shell MySpace / focus `mySpace` | Contenitore della sezione Viaggi | Nuova shell parallela / seconda “casa” |
| Dominio itinerari salvati + UserTripsTab logica | Materia prima catalogo | Reinventare persistenza senza motivo |
| Diario operativo | Dimensione **Diario** della cartella | Duplicare un secondo diario solo-MySpace |
| Linking packing | Dimensione **Valigia del viaggio** | Confondere con Strumenti (M4) |
| MyWorldBreadcrumb | Estendere livelli | Breadcrumb non cliccabile |
| Workspace allegati | Solo confine mentale | Fondere allegati personali nel hub WS |
| Community / likes | Nessun riuso come archivio viaggio | Usare like come “foto del viaggio” |
| Design Foundation / focus | Fascia focusActive | z-index ad hoc |

---

## File e cartelle coinvolti (previsione di impatto)

> Elenco **orientativo**. L’insieme esatto si congela in Analisi STEP-1; ogni aggiunta va motivata nel log WF.

### MySpace / MyWorld (estensione)

- `src/myspace/mySpaceRoots.ts` (copy/placeholder `trips` → contenuto reale)
- `src/components/myspace/MySpaceMinimalShell.tsx`
- `src/components/myspace/MySpaceRootNav.tsx`
- `src/components/myspace/MySpaceSectionPlaceholder.tsx` (sostituito/esteso per `trips`)
- Nuovi moduli previsti (nome definitivo in STEP-1): es. `src/components/myspace/trips/*` (catalogo, cartella, dimensioni)
- `src/components/myworld/MyWorldBreadcrumb.tsx`

### Account / catalogo legacy

- `src/components/user/dashboard/UserTripsTab.tsx`
- `src/components/user/UserDashboard.tsx` / `UserSidebar.tsx` (solo ponte/copy/entry)

### Diario / packing / save

- Contesti e hook itinerary / diary save (inventario preciso in STEP-1)
- Suitcase / packing link verso viaggio
- Sidebar diary entry points (regressione)

### Focus / foundation

- `src/focus/*` solo se servono sessioni nested o owner presentation nuovi

### Documentazione operativa

- Questo file WF-04
- `AI_DEV_WORKFLOW/03_PROJECT_STATUS.md`
- Eventuale nota DOC 28 **solo** se cambia contratto allegati WS (improbabile)

**Vietato toccare in Macrofase 2 (salvo bugblock o decisione PO in Analisi):** migration `supabase/` non motivate, Preferiti storage, Community feed, gamification, rewrite Workspace hub.

---

## Routing coinvolto

| Percorso oggi | Comportamento | Impatto Macrofase 2 |
|---------------|---------------|---------------------|
| Focus `mySpace` (nessuna URL dedicata M1) | Shell MySpace | Catalogo + cartella restano in focus salvo decisione STEP-1 |
| `/{slug}/dashboard/viaggi` | Tab Account Viaggi | Ponte / coesistenza / redirect mentale — **decisione STEP-1** |
| Deep link diario / progetto | Carica itinerario | Non rompere; mappare a cartella viaggio se possibile |
| Hub `collaborationWorkspace` | Allegati gruppo | Invariato |

**Vincolo M1 D4:** nessuna URL pubblica MySpace obbligatoria; se STEP-1 propone URL dedicate viaggio, documentare trade-off shareability vs breaking change.

---

## Navigazione coinvolta

| Entry | Oggi | Target Macrofase 2 |
|-------|------|---------------------|
| MySpace → I miei Viaggi | Placeholder | Catalogo reale |
| Apertura viaggio da catalogo | N/A in MySpace | Cartella + dimensioni |
| Breadcrumb | Fino a root | Fino a viaggio / dimensione |
| Account → I Miei Viaggi | Catalogo legacy | Ponte chiaro verso MySpace (senza due case confuse) |
| Diario sidebar | Operativo | Resta usabile; allineato mentalmente alla dimensione Diario |
| MyWorld / Workspace / altre root MySpace | Invariati | **Invariati** (no Preferiti/Esploratore/Strumenti pieni) |

**Breadcrumb target:**

- `MyWorld > MySpace > I miei Viaggi`
- `MyWorld > MySpace > I miei Viaggi > [Nome viaggio]`
- `MyWorld > MySpace > I miei Viaggi > [Nome viaggio] > [Dimensione]`
- Livelli **cliccabili** (DOC 35 §4.6)

---

## Dipendenze da Workspace, Dashboard e altri sistemi

| Sistema | Dipendenza Macrofase 2 | Note |
|---------|------------------------|------|
| **MySpace shell (M1)** | Forte — contenitore | Non riscrivere shell |
| **User Dashboard tab Viaggi** | Forte — sorgente catalogo / ponte | Evitare due case |
| **Diario operativo** | Forte — dimensione Diario | Regressione = fallimento gate |
| **Packing / Valigia** | Media — Valigia del viaggio | Distinta da Strumenti M4 |
| **Workspace allegati** | Confine | Non mescolare |
| **Community / gallery** | Confine | Non = Foto viaggio |
| **WF-02 / CC** | Nessuna feature condivisa | Parallelismo hold |
| **Macrofase 3–4** | Downstream | Non implementare |

---

## Definition of Done — Workflow (finale)

| # | Criterio | Verifica |
|---|----------|----------|
| **DoD-WF04-1** | Tutti gli STEP = Completato + validazione PO | Tabelle STEP |
| **DoD-WF04-2** | Gate uscita DOC 36 §4.9 soddisfatto | Checklist gate sotto |
| **DoD-WF04-3** | Nessuna migration DB non autorizzata da questo WF | Diff / review |
| **DoD-WF04-4** | Diario operativo non regresso in modo grave | Piano test |
| **DoD-WF04-5** | I miei Viaggi cuore navigabile in MySpace | UI PO |
| **DoD-WF04-6** | Cartella viaggio + dimensioni canoniche (profondità variabile ok; no tab proibite) | UI PO |
| **DoD-WF04-7** | Foto ≠ Ricordi; Allegati viaggio ≠ Workspace | UI PO |
| **DoD-WF04-8** | Breadcrumb fino a viaggio e dimensione | UI PO |
| **DoD-WF04-9** | `03_PROJECT_STATUS` + questo WF aggiornati; Macrofase 3 WF **non** creato finché PO non lo richiede post-gate | Docs |
| **DoD-WF04-10** | Validazione PO finale registrata | Chiusura WF |

### Checklist gate uscita Macrofase 2 (DOC 36 §4.9)

- [ ] I miei Viaggi è il cuore navigabile in MySpace
- [ ] Esiste il modello cartella viaggio con dimensioni canoniche (senza tab proibite)
- [ ] Foto e Ricordi sono concettualmente distinti in UX
- [ ] Allegati del viaggio sono distinti dal mentale Workspace
- [ ] Breadcrumb raggiunge viaggio e dimensione
- [ ] Nessuna regressione grave del diario operativo quotidiano

---

## Struttura ufficiale STEP (PO 2026-07-25)

| STEP | Nome | Contenuto |
|------|------|-----------|
| **STEP-1** | Analisi completa | Solo decisioni / mappa / rischi — **nessun codice** |
| **STEP-2** | Core «I miei Viaggi» | Catalogo + cartella + nav + breadcrumb + Diario + Valigia + copertina base — **un’unica implementazione coerente** |
| **STEP-3** | Completamento + gate | Foto + Ricordi + Allegati + Statistiche/metadati + rifiniture UX + bugfix + smoke + gate §4.9 |

*L’ordine concettuale DOC 36 §4.6 resta la guida di prodotto; gli STEP operativi sono 3 come sopra.*

---

## Stato avanzamento (ricostruzione rapida)

| Campo | Valore corrente |
|-------|-----------------|
| **Workflow** | WF-04 — **Attivo** |
| **STEP** | STEP-2 — Core «I miei Viaggi» |
| **Fase** | Analisi tecnica + piano batch completati — **Sviluppo non iniziato** |
| **% convenzionale** | 22 % |
| **STEP-1** | Completato — decisioni D0–D22 + dominio ufficiale **congelati** (PO 2026-07-25) |
| **Indice rapido** | [Decision Log](#decision-log-d0d22) · [Glossario](#glossario-wf-04) · [Decisioni congelate STEP-2](#decisioni-congelate--non-ridiscutere-in-step-2) · dettaglio D0–D22 sotto |

**Prompt ripresa:**  
`Avvia WF-04 STEP-2` — Core «I miei Viaggi». Scope STEP-2 = catalogo/cartella/Diario/Valigia+resume/breadcrumb/copertina base; **non** implementare ancora Save A/B/C, rimozione runtime `share_current`, né migrazione tab Account.

---

# STEP-1 — Analisi completa (nessun codice)

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Congelare l’architettura Macrofase 2 (core + perimetro STEP-3) prima di qualsiasi implementazione |
| **Stato STEP** | **Completato** |
| **DoD STEP** | Decisioni D0–D22 + dominio ufficiale documentati; mappa riuso/nuovo; piano STEP-2; rischi; Q chiuse; **zero codice feature** in STEP-1 |

### Fasi

| Fase | Stato | Inizio | Fine | PO ✓ |
|------|-------|--------|------|------|
| Analisi | Completato | 2026-07-25 | 2026-07-25 | ☑ |
| Pronto per implementazione | Completato | 2026-07-25 | 2026-07-25 | ☑ |
| Sviluppo | N/A | — | — | — |
| Review tecnica | Completato (solo doc/analisi) | 2026-07-25 | 2026-07-25 | ☑ |
| Test | N/A | — | — | — |
| Verifica PO | Completato | 2026-07-25 | 2026-07-25 | ☑ |

### Checklist (STEP-1)

- [x] Rileggere DOC 35 §5 e DOC 36 §4
- [x] Ispezionare as-is MySpace/MyWorld, UserTripsTab, ItineraryContext, diary, packing link, breadcrumb
- [x] Congelare decisioni D0–D22 + dominio ufficiale
- [x] Mappa componenti riuso / nuovi
- [x] Flussi navigazione target
- [x] Impatti MySpace / MyWorld / Diario / Valigia
- [x] Elenco implementazioni STEP-2
- [x] Rischi + punti aperti PO (Q chiuse)
- [x] Validazione PO: dominio + D0–D22 approvati; autorizzato STEP-2

---

## Analisi architetturale completa (STEP-1)

### As-is rilevante

| Area | Stato reale |
|------|-------------|
| **MySpace** | Shell focus `mySpace` con 5 root; `trips` = placeholder (`MySpaceSectionPlaceholder`) |
| **MyWorld** | Chooser → MySpace / Workspace; invariato come porta |
| **Catalogo viaggi** | Solo Account: `UserTripsTab` su `ItineraryContext.savedProjects` |
| **Open viaggio** | `loadProject(proj)` + chiude Dashboard; **non** apre forzato sidebar/diario |
| **Diario** | `TravelDiary` in Sidebar / overlay mobile; save via `useDiaryDocumentSave` |
| **Valigia↔viaggio** | `suitcaseLinkingService` + `SuitcaseFloatingPanel` via modal `packingList` + `itineraryId` |
| **Breadcrumb** | Fino a root; `MyWorldBreadcrumb` già supporta crumb generici + onClick |
| **Foto viaggio / Allegati viaggio / Ricordi** | **Assenti** come dominio viaggio |
| **Foto prodotto** | Community / city gallery (bucket `community-photos`) — **non** archivio viaggio |
| **Allegati WS** | Hub collaboration (`workspace-attachments`) — confine DOC 28 |

### Vincolo focus critico (Valigia)

`activeModal` è **singolo**. Aprire `packingList` **smonta** la sessione `mySpace`.  
**Decisione PO:** Valigia = pannello dedicato (`packingList`); MySpace resta sospeso; obbligatorio **resume snapshot** al ritorno (stesso viaggio / stessa dimensione Valigia). Nessuna UI Valigia “in-folder” come destinazione finale.

### Modello navigazione target (congelato)

```text
MyWorld (chooser)
  └─ MySpace (focus mySpace) — invariato
       └─ Root: I miei Viaggi
            ├─ Catalogo (lista da ItineraryContext.savedProjects)
            └─ Cartella viaggio [tripId]
                 ├─ Diario          ← STEP-2 (integrazione)
                 ├─ Valigia         ← STEP-2 (integrazione)
                 ├─ Foto            ← STEP-3
                 ├─ Allegati        ← STEP-3
                 ├─ Statistiche     ← STEP-3
                 └─ Ricordi         ← STEP-3
```

Stato UI interno a MySpace (no nuove route pubbliche M2):

- `tripsView: 'catalog' | 'folder'`
- `activeTripId: string | null`
- `activeDimension: TripDimension` (default `diary`)

---

## Decisioni congelate STEP-1 (PO 2026-07-25 — ufficiali)

### D0 — Dominio ufficiale MySpace ↔ Workspace (SSOT)

| Campo | Valore |
|-------|--------|
| **Decisione** | **MySpace = solo originali** (patrimonio personale). **Workspace = solo copie di lavoro** (nuovo ID). Mai lo stesso oggetto nei due mondi. Autosave / Realtime / Lock / ACL / RLS / collaborazione sulla copia. Delete MySpace ↛ delete copia WS; delete WS ↛ delete originale. UX: solo comando **Condividi** (copia = dettaglio interno). **«Condividi Originale» / `share_current` eliminato dal prodotto.** |
| **Motivazione** | Audit cross-domain 2026-07-25; allineamento DOC 35/28/36. |
| **Scope codice** | Allineamento Wizard/runtime Collaboration = **fuori STEP-2 Core** (debito esplicito); regole obbligatorie per ogni evoluzione Save/Share successiva. |

### D1 — SoT catalogo itinerari

| Campo | Valore |
|-------|--------|
| **Decisione** | **Unica SoT:** `ItineraryContext` (`savedProjects` / `loadProject` / `deleteProject` / storage manager). MySpace e Account leggono la stessa pipeline. |
| **Motivazione** | Evitare due liste divergenti; riuso immediato senza migration. |

### D2 — Superficie MySpace / nessun nuovo focus key per il viaggio

| Campo | Valore |
|-------|--------|
| **Decisione** | Catalogo + cartella vivono **dentro** la sessione focus `mySpace` (stato locale shell). **Non** introdurre `tripFolder` come nuova chiave `WORKSPACE_REGISTRY` in M2 salvo necessità emersa in STEP-2. |
| **Motivazione** | Continuità M1; meno churn focus; breadcrumb gestisce profondità. |

### D3 — Default dimensione all’apertura cartella

| Campo | Valore |
|-------|--------|
| **Decisione** | Default = **Diario**. |
| **Motivazione** | Cuore operativo del viaggio (DOC 35); allinea mental model “apri il viaggio = vai alla storia pianificata/vissuta”. |

### D4 — Integrazione Diario (STEP-2)

| Campo | Valore |
|-------|--------|
| **Decisione** | **Riuso obbligatorio** di `TravelDiary` / `ItineraryContext` — **non** forkare un secondo diario dentro il pannello. Dalla dimensione Diario: `loadProject` + assicurare superficie diario visibile/usabile (sidebar desktop / overlay mobile). La cartella MySpace resta chrome di orientamento (breadcrumb + nav dimensioni). |
| **Motivazione** | Zero regressione save/autosave; anti–duplicazione “due case”. |
| **Nota** | Migliorare rispetto a UserTripsTab odierno (che non forza l’apertura del diario). |

### D5 — Integrazione Valigia (STEP-2)

| Campo | Valore |
|-------|--------|
| **Decisione** | Entrando in Valigia da MySpace → viaggio → Valigia: aprire il **pannello dedicato** `packingList` (tutto lo spazio). MySpace **sospeso**. Alla chiusura / crumb di ritorno: **resume esatto** (`tripId` + dimensione Valigia + stato cartella), non root né sola lista viaggi. Breadcrumb desktop sul pannello Valigia: `MyWorld > MySpace > I miei Viaggi > [Viaggio] > Valigia > [Nome Valigia]` (tutti cliccabili). Mobile: `… > [Nome Valigia]` con ritorno al punto MySpace corretto. |
| **Motivazione** | Decisione PO post-revisione STEP-1; serve tutto lo spazio packing; orientamento via resume + breadcrumb. |
| **Nota** | Listing/associazione valigie del viaggio può vivere nella dimensione Valigia della cartella; l’editing operativo è il pannello dedicato. |

### D6 — Copertina cartella (STEP-2)

| Campo | Valore |
|-------|--------|
| **Decisione** | Cartella con **identità visiva silenziosa** in STEP-2: titolo + metadati date/POI; copertina automatica “best effort” da dati già presenti sull’itinerario/città se disponibili **senza** Community feed; sostituzione manuale se già fattibile senza migration, altrimenti stub silenzioso. Carosello ricco può completarsi in STEP-3 se manca fonte media. |
| **Motivazione** | Metafora cartella DOC 35; niente rumore; niente dipendenza Foto STEP-3 per sbloccare il core. |

### D7 — Breadcrumb

| Campo | Valore |
|-------|--------|
| **Decisione** | In cartella MySpace: `MyWorld > MySpace > I miei Viaggi > [Viaggio] > [Dimensione]`. Click: MyWorld→chooser; MySpace→root MySpace; I miei Viaggi→catalogo; Viaggio→folder; Dimensione→sezione. Sul pannello Valigia: crumb esteso fino a `[Nome Valigia]` (D5); mobile truncato `… > Nome`. |
| **Motivazione** | DOC 35 §4.6; decisione PO navigazione Valigia. |

### D8 — Ordine UI dimensioni (nav cartella)

| Campo | Valore |
|-------|--------|
| **Decisione** | Ordine canonico: Diario → Valigia → Foto → Allegati → Statistiche → Ricordi. In **STEP-2**: **nessun placeholder** / empty temporaneo per Foto, Ricordi, Allegati, Statistiche — quelle dimensioni si sviluppano in **STEP-3**. In STEP-2 la nav cartella espone **Diario + Valigia** (core); le altre voci **non** compaiono come UI da buttare. |
| **Motivazione** | PO: no UI temporanea; seguire Workflow. |

### D9 — Account Dashboard (Viaggi / Valigie / Condivisione)

| Campo | Valore |
|-------|--------|
| **Decisione** | **Non eliminare** ancora le tab Account «I miei Viaggi», «Le mie Valigie», «Condivisione». Prima: audit funzionale completo + migrazione senza regressioni verso MySpace e/o Workspace. Solo dopo l’audit/migrazione potranno essere rimosse. In M2: ponte copy su Viaggi ammesso; nessuna rimozione. |
| **Motivazione** | PO: zero perdita funzionalità. |

### D10 — Routing / deep link

| Campo | Valore |
|-------|--------|
| **Decisione** | **Nessuna** nuova URL pubblica MySpace/viaggio in M2 (allineamento M1 D4). Stato cartella solo in sessione focus. |
| **Motivazione** | Zero breaking URL; shareability non è obiettivo M2. |

### D11 — Journey

| Campo | Valore |
|-------|--------|
| **Decisione** | Nessun mapping forzato `RICORDA` / `PIANIFICA` su `mySpace` o apertura cartella. |
| **Motivazione** | Coerenza M1 D9; evitare flicker. |

### D12 — Anti–tab / esclusi nel viaggio

| Campo | Valore |
|-------|--------|
| **Decisione** | Vietato aggiungere Preferiti, POI visitati, Timeline, Rivivere come sezioni. Rivivere ≠ sezione (desiderata). |
| **Motivazione** | DOC 35 §5.3 / §5.6. |

### D13 — Confini Foto / Ricordi / Allegati (per STEP-3, congelati ora)

| Campo | Valore |
|-------|--------|
| **Decisione** | **Foto** = archivio fotografico del viaggio ≠ Community. **Ricordi** = narrativa/emozione ≠ gallery. **Allegati viaggio** ≠ allegati Workspace (bucket/ruoli diversi). Storage/dettaglio implementativo = STEP-3; default **no migration** finché Analisi STEP-3 non dimostra necessità. |
| **Motivazione** | DOC 35 §5.4–5.5; E9. |

### D14 — Split STEP-2 / STEP-3 (PO)

| Campo | Valore |
|-------|--------|
| **Decisione** | **STEP-2 Core:** catalogo, cartella, nav (Diario+Valigia), breadcrumb (+ Valigia dedicata), Diario, Valigia+resume, copertina base. **STEP-3:** Foto, Ricordi, Allegati, Statistiche/metadati, rifiniture, bugfix, smoke, gate §4.9. **Fuori Core (congelati, non STEP-2):** nuovo modello Save A/B/C; allineamento UI `share_current`; hub creazione MySpace completo; rimozione tab Account. |
| **Motivazione** | Decisione PO 2026-07-25 + freeze dominio/save. |

### D15 — MyWorld

| Campo | Valore |
|-------|--------|
| **Decisione** | Chooser e ramo Workspace **invariati**. Nessuna nuova card/entry. |
| **Motivazione** | Fuori perimetro cuore Viaggi. |

### D16 — Altre root MySpace

| Campo | Valore |
|-------|--------|
| **Decisione** | Esploratore / Preferiti / Strumenti / Inviti restano placeholder M1. |
| **Motivazione** | Macrofasi 3–4. |

### D17 — Migration / API / Supabase

| Campo | Valore |
|-------|--------|
| **Decisione** | STEP-2: **nessuna** migration, nessuna nuova API Supabase. STEP-3: default nessuna; eccezione solo con decisione PO dedicata. |
| **Motivazione** | Vincolo PO apertura M2; riuso dominio esistente. |

### D18 — Estrazione logica catalogo

| Campo | Valore |
|-------|--------|
| **Decisione** | Preferire **estrazione UI condivisa** (hook/presentational list) usata da MySpace e, se utile, da `UserTripsTab` — senza cambiare contratto storage. Vietato copiare-incollare due implementazioni lista. |
| **Motivazione** | DRY + SoT D1. |

### D19 — Eliminazione (due livelli)

| Campo | Valore |
|-------|--------|
| **Decisione** | Da MySpace: eliminabile **intero viaggio** oppure singolarmente Diario / Valigia / Foto / Allegato / Ricordo **senza** obbligare a cancellare il viaggio. Delete viaggio = solo patrimonio personale; copie Workspace restano. Modale delete viaggio dedicato: checkbox obbligatoria, conferma disabilitata finché non spuntata, testo irreversibilità (copy definitivo in seguito). |
| **Motivazione** | PO freeze. |
| **Scope** | Modale viaggio + delete Diario/Valigia dove già esistono flussi: STEP-2 se tocca catalogo/cartella. Foto/Allegati/Ricordi: con STEP-3. |

### D20 — Modello salvataggio (evoluzione dominio — non STEP-2)

> **TODO / REVIEW — DA RIVALUTARE — ARCHIVIO STORICO**  
> Documento (o sezione) redatto **prima** del dominio Viaggio congelato (SoT: DOC 34A / DOC 37) **e** prima delle decisioni Product Vision 2026-07-28 su creazione/associazione Resource e Salva con nome esteso.  
>  
> **Il comportamento documentato in D20 NON rappresenta più il modello vigente.**  
> Non usare questa sezione come Source of Truth del modello di salvataggio / associazione.  
>  
> **Source of Truth attuale — esclusivamente:**  
> - `AI_CONTEXT/35_MYSPACE_PRODUCT_VISION.md`  
> - `AI_CONTEXT/37_VIAGGIO_DOMAIN.md`  
> - `AI_CONTEXT/31_PACKING_SUITCASE_SYSTEM.md`  
>  
> **Principio vigente:**  
> - Resource **indipendente** → può essere associata **direttamente**;  
> - Resource **già associata** o in **contesto incompatibile** → **proposta di copia** (originale invariato).  
>  
> Il testo storico sotto (incluso **«sempre duplica»**) è mantenuto **solo come archivio** del vecchio ragionamento e **non** deve essere usato come riferimento implementativo.

| Campo | Valore |
|-------|--------|
| **Decisione (storica — superata)** | **Primo salvataggio:** Salva in MySpace/Strumenti · Salva + Crea Viaggio · Salva + Aggiungi al Viaggio (select **un** viaggio; **sempre duplica** — nuovo ID; mai stesso oggetto in due viaggi). **Dal secondo:** Salva · Salva con nome (riapre primo flusso). Stesso principio copie per Workspace (D0). |
| **Nota archivio** | Questa decisione è mantenuta **esclusivamente come archivio storico** e **non** deve essere utilizzata nello sviluppo. Il comportamento ufficiale è definito **esclusivamente** in DOC 35, DOC 37 e DOC 31. |
| **Motivazione** | PO freeze. |
| **Scope** | **Congelato come architettura. NON implementare in STEP-2.** |

### D21 — MySpace centro di creazione (backlog)

| Campo | Valore |
|-------|--------|
| **Decisione** | MySpace potrà creare Nuovo Viaggio / Nuovo Diario / Nuova Valigia. Modalità definitive negli STEP successivi. |
| **Motivazione** | PO freeze. |
| **Scope** | Backlog Workflow; non bloccante per Core STEP-2 catalogo/cartella. |

### D22 — Copertina

| Campo | Valore |
|-------|--------|
| **Decisione** | Copertina **base** in STEP-2 (come D6). Non anticipare media ricchi di STEP-3. |
| **Motivazione** | Seguire Workflow. |

---

## Decision Log (D0–D22)

> Sintesi a una pagina. Dettaglio completo: sezioni **D0–D22** sopra.  
> Dominio prodotto: DOC 35 §2 · DOC 28 § Dominio ufficiale.

| ID | Titolo | Sintesi |
|----|--------|---------|
| **D0** | Dominio MySpace ↔ Workspace | MySpace = solo **originali**; Workspace = solo **copie** (nuovo ID); Condividi senza «Originale»; isolamento stato/delete |
| **D1** | SoT catalogo | Unica SoT: `ItineraryContext` / `savedProjects` |
| **D2** | Superficie focus | Catalogo + cartella dentro focus `mySpace`; no nuovo focus key viaggio in M2 |
| **D3** | Default dimensione | Apertura cartella → **Diario** |
| **D4** | Diario | Riuso `TravelDiary` / load + superficie esistente; no secondo diario |
| **D5** | Valigia | Pannello dedicato `packingList` + **resume** esatto; breadcrumb Valigia desktop/mobile |
| **D6** | Copertina | Identità silenziosa + copertina base best-effort in STEP-2 |
| **D7** | Breadcrumb | MySpace fino a dimensione; Valigia fino a nome (mobile truncato) |
| **D8** | Nav dimensioni | Ordine canonico; STEP-2 solo Diario+Valigia; **no placeholder** STEP-3 |
| **D9** | Account Dashboard | Tab Viaggi/Valigie/Condivisione **restano** fino a audit+migrazione |
| **D10** | Routing | Nessuna nuova URL pubblica MySpace/viaggio in M2 |
| **D11** | Journey | Nessun mapping forzato RICORDA/PIANIFICA → MySpace |
| **D12** | Anti–tab | Vietate Preferiti/POI visitati/Timeline/Rivivere come sezioni |
| **D13** | Confini media | Foto≠Community; Ricordi≠gallery; Allegati viaggio≠WS (STEP-3) |
| **D14** | Split STEP | STEP-2 Core vs STEP-3 vs fuori-Core (Save/Share UI/creazione/Account) |
| **D15** | MyWorld | Chooser / ramo Workspace invariati |
| **D16** | Altre root | Esploratore/Preferiti/Strumenti/Inviti = placeholder M1 |
| **D17** | Migration | STEP-2: nessuna migration/API; STEP-3 default nessuna |
| **D18** | Catalogo UI | Estrazione condivisa MySpace↔Account; no doppia lista |
| **D19** | Eliminazione | Due livelli; delete viaggio = solo MySpace; modale checkbox |
| **D20** | Salvataggio | Modello A/B/C + sempre nuovo ID — **congelato, non STEP-2** |
| **D21** | Creazione MySpace | Nuovo Viaggio/Diario/Valigia — backlog, non bloccante Core |
| **D22** | Copertina scope | Base in STEP-2; media ricchi in STEP-3 |

---

## Glossario (WF-04)

| Termine | Significato in questo Workflow |
|---------|--------------------------------|
| **Originale** | Entità del patrimonio personale in **MySpace**. Mai collegata direttamente a un Workspace. |
| **Copia** (di lavoro) | Entità indipendente (nuovo ID) usata in **Workspace**. Non sincronizzata con l’originale. |
| **MySpace** | Casa del viaggiatore: **solo originali**. Focus `mySpace`. |
| **Workspace** | Ambiente collaborativo: **solo copie**. Hub `collaborationWorkspace`. |
| **Cartella Viaggio** | Vista MySpace di un viaggio (`folder`): chrome + nav dimensioni + copertina. |
| **Dimensione del Viaggio** | Sezione canonica dentro la cartella: Diario, Valigia, Foto, Allegati, Statistiche, Ricordi. |
| **Resume snapshot** | Stato MySpace salvato prima di aprire Valigia (`packingList`), ripristinato al ritorno. |
| **Condividi** | Unico comando UX verso collaborazione; la copia è dettaglio interno (vedi D0). |

Glossario di visione più ampio → DOC 35 §17.

---

## Decisioni congelate — non ridiscutere in STEP-2

Durante lo **sviluppo STEP-2** queste decisioni sono **chiuse**. Eventuali ripensamenti richiedono esplicita decisione PO (non “riapertura silenziosa” in implementazione).

### Dominio e condivisione
- MySpace = solo originali; Workspace = solo copie (D0)
- Nessun path prodotto «Condividi Originale» / `share_current` (D0) — allineamento runtime Collaboration **fuori** Core STEP-2, ma non negoziabile come regola
- Isolamento stato / autosave / lock / delete tra originale e copia (D0)

### Navigazione Core
- Catalogo + cartella dentro `mySpace` (D2); default dimensione **Diario** (D3)
- Diario = riuso `TravelDiary`, non fork (D4)
- Valigia = pannello dedicato + resume esatto + breadcrumb D5/D7
- Nav STEP-2 = **solo Diario + Valigia**; nessun placeholder Foto/Ricordi/Allegati/Stats (D8)
- Nessuna nuova URL pubblica (D10); nessun mapping Journey forzato (D11)
- Anti–tab invariato (D12)

### Account / altre root / infrastruttura
- Tab Account Viaggi / Valigie / Condivisione **non** si rimuovono in STEP-2 (D9)
- Altre root MySpace restano placeholder (D16); MyWorld invariato (D15)
- Nessuna migration/API in STEP-2 (D17)
- SoT catalogo unica + estrazione UI condivisa (D1, D18)

### Fuori scope STEP-2 (congelati come “non ora”)
- Modello Save A/B/C e anti multi-link (D20) — **non implementare**
- Hub creazione Nuovo Viaggio/Diario/Valigia completo (D21) — backlog
- Foto / Ricordi / Allegati / Statistiche (D13, D14) — STEP-3
- Copertina: solo base (D6, D22); media ricchi dopo

### Eliminazione (regola fissa; profondità per STEP)
- Due livelli + delete viaggio non tocca copie WS + modale checkbox (D19)
- In STEP-2: dove il catalogo/cartella espone delete viaggio/Diario/Valigia; media con STEP-3

---

## Componenti da riutilizzare

| Componente / sistema | Uso in M2 |
|----------------------|-----------|
| `ItineraryContext` + storage manager | SoT catalogo / load / delete |
| `UserTripsTab` (logica) | Base per lista; estrarre presentational |
| `MySpaceMinimalShell` / `MySpaceRootNav` | Host root `trips` |
| `MyWorldBreadcrumb` | Livelli viaggio/dimensione |
| `TravelDiary` + save stack | Dimensione Diario |
| `suitcaseLinkingService` + association UI | Dimensione Valigia |
| Focus `mySpace` / `WorkspaceHost` | Contenitore |
| `useUI` sidebar / mobile diary | Far emergere diario |

## Componenti nuovi da creare (previsti)

| Nuovo (nome orientativo) | STEP | Ruolo |
|--------------------------|------|-------|
| `src/components/myspace/trips/MySpaceTripsCatalog.tsx` | 2 | Lista viaggi in root |
| `src/components/myspace/trips/TripFolderShell.tsx` | 2 | Cartella + nav dimensioni + copertina |
| `src/components/myspace/trips/TripDimensionNav.tsx` | 2 | Tab dimensioni canoniche |
| `src/components/myspace/trips/dimensions/TripDiaryDimension.tsx` | 2 | Bridge → diario esistente |
| `src/components/myspace/trips/dimensions/TripSuitcaseDimension.tsx` | 2 | Entry Valigia → packingList + resume |
| Helper resume MySpace↔packingList | 2 | Snapshot trip/dimension prima di aprire Valigia |
| Breadcrumb Valigia (desktop/mobile) | 2 | Crumb sul pannello packing |
| `src/myspace/tripDimensions.ts` | 2 | Costanti ordine/label dimensioni |
| Hook es. `useMySpaceTripsNavigation.ts` | 2 | catalog/folder/dimension state |
| Dimensioni Foto / Allegati / Stats / Ricordi | 3 | Contenuti + confini |
| Eventuale cover picker | 2/3 | Manuale se fattibile senza migration |

---

## Flussi di navigazione (target)

1. Entry MyWorld → MySpace → root **I miei Viaggi** → catalogo (`savedProjects`).
2. Tap viaggio → cartella; breadcrumb aggiornato; dimensione default **Diario**.
3. Dimensione Diario → `loadProject` + apri/focus superficie `TravelDiary`.
4. Dimensione Valigia → salva resume snapshot → apre `packingList`; chiusura/crumb → ripristina MySpace allo stesso punto.
5. Breadcrumb Valigia (desktop) fino a Nome Valigia; mobile `… > Nome`.
6. Breadcrumb up MySpace: dimensione → viaggio → catalogo → MySpace → MyWorld.
7. Account → I Miei Viaggi: stessa lista + ponte copy; tab Valigie/Condivisione **restano**.

---

## Impatti per area

| Area | Impatto |
|------|---------|
| **MySpace** | Root `trips` diventa navigabile; stato nested folder; placeholder altre root invariati |
| **MyWorld** | Nessuno (chooser invariato) |
| **Diario** | Load da cartella; possibile auto-open sidebar/overlay; **no** fork save |
| **Valigia** | Pannello dedicato + resume + breadcrumb Valigia |
| **Account** | Ponte copy; tab restano fino a audit/migrazione (D9) |
| **Workspace** | Dominio copie (D0); allineamento UI `share_current` fuori STEP-2 Core |
| **Focus/Foundation** | Resume snapshot MySpace↔packingList |
| **AI_CONTEXT** | Aggiornato DOC 35/36/28 al freeze dominio (2026-07-25) |

---

## Elenco dettagliato implementazioni STEP-2 (post-approvazione)

1. Costanti `tripDimensions` + tipi navigazione MySpace trips (STEP-2: Diario + Valigia).  
2. `MySpaceTripsCatalog` su `savedProjects` (open → folder; delete viaggio con modale checkbox D19 se esposto).  
3. Sostituire placeholder root `trips` in shell con catalog/folder router.  
4. `TripFolderShell` + `TripDimensionNav` + copertina base (D6/D22).  
5. Breadcrumb MySpace fino a viaggio/dimensione.  
6. `TripDiaryDimension`: load + ensure diary surface.  
7. Resume snapshot + apertura `packingList` + breadcrumb Valigia desktop/mobile (D5/D7).  
8. Ponte copy in Account `UserTripsTab` (senza rimuovere tab).  
9. Smoke: catalogo ↔ cartella ↔ Diario ↔ Valigia+resume ↔ breadcrumb; regressione WS; mobile+desktop.  
10. TS/lint file toccati.  

**Fuori STEP-2:** Foto/Allegati/Ricordi/Statistiche; Save D20; hub creazione D21; rimozione `share_current` runtime; rimozione tab Account; gate formale Macrofase.

---

## Rischi architetturali

| # | Rischio | Severità | Mitigazione |
|---|---------|----------|-------------|
| R1 | Modal `packingList` distrugge sessione `mySpace` | Alta | D5 resume snapshot obbligatorio |
| R2 | Due case catalogo Account/MySpace | Alta | D1 + D18 estrazione condivisa |
| R3 | Embed diario nel pannello = doppio diario | Alta | D4 riuso companion esistente |
| R4 | Scope creep Preferiti/Esploratore / Save D20 | Media | D14 / D16 / D20 |
| R5 | Foto STEP-3 tenta riuso Community | Media | D13 |
| R6 | Open viaggio senza aprire diario (UX morta) | Media | D4 ensure surface |
| R7 | z-index MySpace vs diary overlay mobile | Media | Foundation + smoke mobile |
| R8 | Runtime ancora espone `share_current` | Alta (prodotto) | D0 — allineamento Collaboration fuori Core STEP-2 ma obbligatorio prima del gate M2 §4.9.7 |
| R9 | Copie Workspace ancora nel catalogo owner | Media | D0 — enforcement catalogo con allineamento Share/Save |

---

## Punti aperti PO — chiusi (2026-07-25)

| ID | Domanda | Decisione |
|----|---------|-----------|
| **Q1** | Valigia in-folder vs pannello dedicato? | **Pannello dedicato** + resume (D5) |
| **Q2** | Empty deferred in STEP-2? | **No placeholder** — dimensioni deferred solo in STEP-3 (D8) |
| **Q3** | Tab Account? | **Restano** fino ad audit/migrazione (D9) |
| **Q4** | Copertina? | Base in STEP-2 (D6/D22); media ricchi dopo |
| **Q5** | Delete viaggio? | Modale dedicato con checkbox obbligatoria (D19) |

---

# STEP-2 — Implementazione completa del Core «I miei Viaggi»

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Una sola delivery coerente: catalogo + cartella + nav Diario/Valigia + breadcrumb + Diario + Valigia (pannello+resume) + copertina base |
| **Stato STEP** | **In corso** — copertura dominio ☑; piano batch ☑; codice non ancora scritto |
| **DoD STEP** | Utente apre MySpace → I miei Viaggi → cartella → usa Diario e Valigia con resume; breadcrumb core + Valigia; nessuna feature M3/M4; no Save D20; no migration |

### Fasi

| Fase | Stato | Inizio | Fine | PO ✓ |
|------|-------|--------|------|------|
| Analisi | Completato (STEP-1 + copertura D0–D22 + piano tecnico) | 2026-07-25 | 2026-07-25 | ☑ |
| Pronto per implementazione | Completato | 2026-07-25 | 2026-07-25 | ☑ |
| Sviluppo | **Non iniziato** (attesa conferma piano / primo batch) | | | ☐ |
| Review tecnica | — | | | ☐ |
| Test | — | | | ☐ |
| Verifica PO | — | | | ☐ |

### Checklist operativa (alto livello)

- [ ] Catalogo reale root `trips` (SoT ItineraryContext)
- [ ] Cartella viaggio + nav Diario/Valigia + copertina base
- [ ] Breadcrumb MySpace fino a viaggio/dimensione
- [ ] Integrazione Diario (D4)
- [ ] Valigia pannello dedicato + resume + breadcrumb Valigia (D5/D7)
- [ ] Nessun placeholder Foto/Ricordi/Allegati/Stats (D8)
- [ ] Ponte Account (senza rimuovere tab) (D9)
- [ ] Delete viaggio: modale checkbox se esposto in catalogo (D19)
- [ ] Smoke core + regressione diario/WS
- [ ] TS/lint
- [ ] Validazione PO

---

# STEP-3 — Completamento Macrofase 2 + rifiniture + test + gate

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Foto, Ricordi, Allegati, Statistiche/metadati; rifiniture UX/UI; bugfix; smoke completo; gate DOC 36 §4.9; chiusura WF-04 |
| **Stato STEP** | Non iniziato |
| **DoD STEP** | Gate §4.9 ☑; T1–T12; DoD-WF04; nessun WF Macrofase 3 creato |

### Fasi

| Fase | Stato | Inizio | Fine | PO ✓ |
|------|-------|--------|------|------|
| Analisi | Non iniziato | | | ☐ |
| Pronto per implementazione | — | | | ☐ |
| Sviluppo | — | | | ☐ |
| Review tecnica | — | | | ☐ |
| Test | — | | | ☐ |
| Verifica PO | — | | | ☐ |

### Checklist operativa (alto livello)

- [ ] Foto viaggio (≠ Community)
- [ ] Ricordi (≠ gallery; no sezione Rivivere)
- [ ] Allegati viaggio (≠ Workspace)
- [ ] Statistiche / metadati viaggio
- [ ] Rifiniture copertina/carosello se dovute
- [ ] Bug fixing post-STEP-2
- [ ] Smoke T1–T12 + gate §4.9
- [ ] Aggiornare `03_PROJECT_STATUS` — M2 completata
- [ ] Nota: WF Macrofase 3 solo su ordine PO
- [ ] Validazione PO finale

---

## Analisi regressioni possibili

| Area | Rischio | Mitigazione |
|------|---------|-------------|
| Diario sidebar | Non apre / perde salvataggi | Smoke obbligatorio; riuso flussi save |
| Due case | Catalogo Profilo + MySpace divergenti | Una SoT lista; ponte D7 |
| Anti–tab | Nuove sezioni “comode” | Gate DOC 35 §5.3 / §5.6 |
| Ricordi = gallery | Confusione Foto | Copy e layout distinti; review PO |
| Allegati | Mix con Workspace | Label e storage separati |
| Community | Foto viaggio = feed | Vietato riuso like/feed |
| Focus / z-index | Overlay sotto modal sbagliati | Registry + Foundation |
| Scope creep | Preferiti / Esploratore / Strumenti | Esclusi E1–E5 |
| Performance catalogo | Liste grandi | Inventario STEP-1; virtualizzazione solo se già pattern |

---

## Piano di test

### Test esperienza / funzionali (obbligatori a chiusura)

| ID | Verifica |
|----|----------|
| T1 | MySpace → I miei Viaggi mostra i viaggi dell’utente |
| T2 | Ogni viaggio si apre come cartella riconoscibile (copertina) |
| T3 | In STEP-2: Diario + Valigia in nav; nessuna tab Preferiti / POI visitati / Timeline / Rivivere; nessun placeholder dimensioni STEP-3 |
| T4 | Foto ≠ Ricordi comprensibile (da STEP-3 in poi) |
| T5 | Allegati viaggio non confusi con allegati Workspace (STEP-3) |
| T6 | Breadcrumb `MyWorld > MySpace > I miei Viaggi > [Viaggio] > [Dimensione]` cliccabile |
| T7 | Diario del viaggio usabile per pianificare/vivere |
| T8 | Valigia: pannello dedicato; ritorno allo stesso punto MySpace; crumb desktop/mobile (D5) |
| T9 | Account: tab Viaggi/Valigie/Condivisione ancora presenti; ponte chiaro su Viaggi |
| T10 | Workspace hub: apri/chiudi invariato |
| T11 | Altre root MySpace (Esploratore/Preferiti/…) restano placeholder M1 |
| T12 | Nessuna migration/schema non autorizzata da WF-04 |
| T13 | Gate M2: nessun path prodotto «Condividi Originale» (allineamento Collaboration, prima chiusura M2) |

### Smoke tecnico (su file toccati)

- Lint/TS file modificati
- Smoke mobile + desktop: catalogo → cartella → dimensioni → breadcrumb up
- Smoke diario sidebar durante sessione MySpace aperta/chiusa

---

## Criteri di completamento (sintesi)

WF-04 / Macrofase 2 è **completato** quando:

1. DoD-WF04-1…10 soddisfatti  
2. Gate DOC 36 §4.9 tutti ☑  
3. Piano test T1–T12 superati (o debiti PO espliciti)  
4. Validazione PO finale registrata  
5. Nessun Workflow Macrofase 3–4 creato “in anticipo”

---

## Gate finale della macrofase

Allineato a DOC 36 §4.9 — vedi checklist sopra.  
**Solo dopo** questo gate il PO può richiedere la **creazione** del Workflow Macrofase 3 (Preferiti & Esploratore), basato sul codice reale post–Macrofase 2.

---

## Log decisioni operative

| Data | Decisione | Chi |
|------|-----------|-----|
| 2026-07-25 | Apertura WF-04 solo Macrofase 2; Macrofasi 3–4 senza Workflow fino a gate | PO |
| 2026-07-25 | STEP-1 = sola Analisi; nessun codice all’apertura | PO + AI |
| 2026-07-25 | Struttura ufficiale **3 STEP** (non 6): Analisi / Core Viaggi / Completamento+gate | PO |
| 2026-07-25 | STEP-1 Analisi eseguita — D1–D18 proposte; In verifica PO | AI |
| 2026-07-25 | Dominio ufficiale MySpace=originali / Workspace=copie; `share_current` rimosso dal prodotto; D0–D22; Q chiuse; STEP-1 chiuso; STEP-2 Pronto | PO + AI |

---

## Chiusura Workflow

| Campo | Valore |
|-------|--------|
| **Data chiusura** | |
| **Validazione PO finale** | |
| **Archiviato in** | `WORKFLOWS/_archive/` (se applicabile a chiusura) |
| **Successivo** | Creare WF Macrofase 3 **solo su ordine PO** dopo gate |

**Report operativo obbligatorio** a ogni chiusura Fase/STEP → `00_DEVELOPMENT_PROTOCOL.md` §15.

---

## Cronologia stato

| Data | STEP | Fase | Stato | Nota |
|------|------|------|-------|------|
| 2026-07-25 | — | — | WF Non iniziato | File creato |
| 2026-07-25 | STEP-1 | Analisi | WF Attivo | Struttura 3 STEP; analisi avviata |
| 2026-07-25 | STEP-1 | In verifica PO | WF Attivo | D1–D18 congelate; attesa approvazione; no STEP-2 |
| 2026-07-25 | STEP-1 → STEP-2 | Pronto per implementazione | WF Attivo | Dominio ufficiale + D0–D22; STEP-2 autorizzato (doc only) |
| 2026-07-25 | STEP-2 | Piano tecnico | WF Attivo | Copertura D0–D22 ☑; piano batch ☑; sviluppo non iniziato |

---

## Report operativo (freeze dominio + chiusura STEP-1)

| Campo | Valore |
|-------|--------|
| **Workflow corrente** | WF-04 — MySpace Macrofase 2 |
| **STEP corrente** | STEP-2 — Core «I miei Viaggi» |
| **Fase corrente** | Pronto per implementazione |
| **Stato corrente** | Attivo |
| **Avanzamento in questa attività** | STEP-1 concluso; dominio ufficiale congelato in doc |
| **Prossima fase da eseguire** | Sviluppo STEP-2 |
| **Prossima attività consigliata** | `Avvia WF-04 STEP-2` (solo Core; vedi D14 / fuori STEP-2) |

### Documentazione

- **AI_CONTEXT:** Aggiornato — DOC 35, DOC 36, DOC 28
- **AI_CONTEXT_MASTER:** Aggiornato — nota dominio in `06_USER_SYSTEMS.md` (se presente)
- **AI_DEV_WORKFLOW:** Aggiornato — questo file; `01_EXECUTION_ROADMAP.md`; `03_PROJECT_STATUS.md`
- **docs/collaboration:** Nota supersede in `WORKSPACE_WIZARD_MACROPHASE.md`
