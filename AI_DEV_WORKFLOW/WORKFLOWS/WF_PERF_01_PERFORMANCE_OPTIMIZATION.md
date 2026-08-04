# WF-PERF-01 — Ottimizzazione performance applicativa

> **Workflow esecutivo** — Source of Truth dell’attività di ottimizzazione performance di TouringDiary.
>
> Derivato dall’audit architetturale performance (sessione 2026-07-28) e dal **piano di implementazione a 4 STEP** approvato dal PO.
>
> **Struttura fissa:** questo Workflow ha **esattamente 4 STEP**.  
> Vietato introdurre ulteriori STEP, micro-STEP o mischiare ambiti tra STEP.  
> Ogni STEP è autonomo, lascia il sito funzionante e deve essere testabile prima del successivo.
>
> **Non** è un Workflow di dominio prodotto (Viaggio / MySpace).  
> **Non** riprende WF-04 (Sospeso — PO-OV-002).  
> **Non** modifica gate di dominio SSOT.

---

## Conoscenza bootstrap (confine obbligatorio)

| Regola | Dettaglio |
|--------|-----------|
| **Riferimento ufficiale** | Tutta la conoscenza architetturale sul bootstrap (Vision, Principles, gate Config/Design/Manifest, decisioni PO, Design Snapshot, roadmap architetturale) vive **esclusivamente** in **`AI_CONTEXT/38_BOOTSTRAP_ARCHITECTURE_SOT.md` (DOC-38)**. |
| **Ruolo di questo Workflow** | Solo operativo: STEP, stato, deliverable di performance, esclusione ambiti. |
| **Vietato** | Duplicare, riassumere o evolvere in questo file decisioni/architettura bootstrap. Aggiornare DOC-38. |

---

## Metadati

| Campo | Valore |
|-------|--------|
| **ID** | WF-PERF-01 |
| **Nome** | Ottimizzazione performance applicativa |
| **Stato Workflow** | Attivo |
| **Masterplan** | — (piano approvato PO; audit performance 2026-07-28) |
| **SSOT tecnici (runtime/layer)** | `src/constants/zIndex.ts` · `src/layering/layerRegistry.ts` · `src/focus/*` · `src/context/*` |
| **SSOT bootstrap (architettura)** | **`AI_CONTEXT/38_BOOTSTRAP_ARCHITECTURE_SOT.md` (DOC-38)** — unica SoT; questo WF non la sostituisce |
| **Owner** | PO + AI |
| **Creato** | 2026-07-28 |
| **Ultimo aggiornamento** | 2026-07-30 |
| **Aggiornato da** | AI — Confine conoscenza: DOC-38 SoT bootstrap; WF-PERF-01 solo operativo. STEP 4 ancora In verifica PO |
| **Workflow precedenti** | Nessuno obbligatorio (parallelo a WF-02 hold) |
| **Workflow successivo** | — (nessuno automatico) |

---

## Obiettivo generale

Ridurre i costi di performance di TouringDiary (boot, re-render, bundle feature, runtime overlay, liste/immagini/rete) con interventi **architetturali**, misurabili e a basso rischio di regressione, rispettando Design System, Focus System e Provider tree esistenti.

---

## Ambito

| Incluso | Nota |
|---------|------|
| Stabilizzazione Context / Provider (re-render) | STEP 1 |
| Bundle / code splitting / entry / TipTap / Export deps | STEP 2 |
| Idle overlay / freeze sotto focus / Sidebar mobile / memo selettivo | STEP 3 |
| Virtualizzazione, immagini `sizes`, fetch/polling, cleanup, benchmark | STEP 4 |
| Rispetto z-index Design System e Focus System | Trasversale — nessuna pezza |

---

## Esclusioni (invarianti)

Restano **fuori scope per tutto il Workflow** (non devono comparire come deliverable):

- Google Maps / `@vis.gl` / clustering / cartografia
- `ViaggioMappaSection` e ottimizzazioni della mappa
- Pezze locali (`z-9999`, opacity/hidden puntuali, alzare `Z_FOCUS_DIM`)
- Redesign Provider tree con selector library (eventuale post-WF)
- Introduzione React Query/SWR globale (eventuale post-WF)
- Refactor CSS app-wide di `transition-all` / blur (solo fix mirati se in STEP)

---

## Prerequisiti

| Prerequisito | Stato | Nota |
|--------------|-------|------|
| Piano 4 STEP approvato dal PO | ☑ | 2026-07-28 |
| Audit performance completato (solo analisi) | ☑ | Baseline chunk/build nota |
| Design System / Focus System / layer registry vigenti | ☑ | Non alterare gerarchia globale z-index |
| `03_PROJECT_STATUS` allineato | ☑ | All’apertura WF |

---

## Roadmap (ordine di esecuzione)

```text
STEP 1  Stabilizzazione Context / Provider (re-render)
   ↓
STEP 2  Bundle e caricamento iniziale
   ↓
STEP 3  Runtime overlay / idle / rendering inutile sotto focus
   ↓
STEP 4  Virtualizzazione, immagini, fetch/polling, cleanup, benchmark
```

| STEP | Focus | Dipende da | Rischio |
|------|--------|------------|---------|
| **1** | Context identity & callbacks | — | Medio |
| **2** | Chunk/entry/TipTap/Export/deps | STEP 1 (ordine piano) | Medio-basso |
| **3** | Overlay idle + freeze + Sidebar | STEP 1 (forte); STEP 2 consigliato | Medio-alto |
| **4** | Lists/images/network/benchmark | STEP 1–3 (beneficio) | Basso-medio |

---

## Regole anti-regressione

1. Un solo STEP alla volta; non anticipare codice degli STEP successivi.
2. Nessuna pezza / workaround; solo cause architetturali nello scope dello STEP.
3. Mantenere API pubbliche dei Context (stessi campi esportati) salvo tipizzazione interna.
4. Non alterare token z-index globali né policy Focus (`focusModeRegistry`) fuori necessity documentata.
5. Ogni STEP deve lasciare l’app funzionante e smoke-testabile.
6. WF-RV-01 obbligatorio su file toccati in review.
7. Benchmark quantitativo obbligatorio solo a chiusura STEP 4 (baseline = audit 2026-07-28).

---

## Gate di esecuzione

| Gate | Dove | Stato | Evidenza |
|------|------|-------|----------|
| Piano 4 STEP approvato | questo file / PO | ☑ | Approvazione PO 2026-07-28 |
| Chiusura STEP 1 | questo file | ☐ | Implementato → In verifica PO |
| Chiusura STEP 2 | questo file | ☐ | Implementato → In verifica PO |
| Chiusura STEP 3 | questo file | ☑ | ACCETTO PO 2026-07-29 |
| Chiusura STEP 4 + benchmark | questo file | ☐ | Implementato → In verifica PO |
| Validazione PO finale WF | questo file | ☐ | |

---

## STEP 1 — Stabilizzazione Context / Provider (re-render)

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Eliminare il fan-out di re-render causato da value identity instabili nei Context ad alto churn, senza cambiare semantica di prodotto né ordine Provider |
| **Stato STEP** | In verifica PO |
| **DoD STEP** | Value stabili quando lo stato non cambia; azioni `useCallback` (o equivalenti); smoke layout/diario/overlay OK; nessun cambio contratto Context verso i consumer |

### Ambito STEP 1

- Stabilizzare value + azioni: `NavigationContext`, `ItineraryContext`, `UIContext`, `InteractionContext`
- Completare memo dove già tentato ma rotto: `UserContext`, `BusinessContext`
- Memo leggero: `ConfigContext`, `GpsContext`, `AiPlannerContext` (stesso pattern)
- **Non** in questo STEP: freeze overlay, ModalManager idle, `React.memo` di massa, bundle split, virtualizzazione

### Fasi

| Fase | Stato | Inizio | Fine | PO ✓ |
|------|-------|--------|------|------|
| Analisi | Completato | 2026-07-28 | 2026-07-28 | ☐ |
| Pronto per implementazione | Completato | 2026-07-28 | 2026-07-28 | ☐ |
| Sviluppo | Completato | 2026-07-28 | 2026-07-28 | ☐ |
| Review tecnica | Completato | 2026-07-28 | 2026-07-28 | ☐ |
| Test | Completato | 2026-07-28 | 2026-07-28 | ☐ |
| Verifica PO | In verifica PO | 2026-07-28 | | ☐ |

### Checklist implementazione STEP 1

- [x] `UIContext` — toggles `useCallback` + value `useMemo`
- [x] `NavigationContext` — actions `useCallback` + value `useMemo`
- [x] `ItineraryContext` — mutators `useCallback` + value `useMemo`
- [x] `InteractionContext` — toggles `useCallback` + value `useMemo`
- [x] `UserContext` — `handleLogout` `useCallback` (sblocca memo value)
- [x] `BusinessContext` — `fetchBusinesses` / `switchBusiness` `useCallback`
- [x] `ConfigContext` — refresh/update `useCallback` + value `useMemo`
- [x] `GpsContext` — value `useMemo`
- [x] `AiPlannerContext` — value `useMemo`

### Checklist test STEP 1

- [x] `tsc` sui file Context STEP 1 — nessun errore nuovo (errori preesistenti altrove invariati)
- [ ] Home → città → Diario → add POI *(smoke manuale PO)*
- [ ] MyWorld / MySpace open/close *(smoke manuale PO)*
- [ ] Valigia open/close *(smoke manuale PO)*
- [ ] 2–3 modali tipici (auth/poi/add) *(smoke manuale PO)*
- [ ] Scroll chrome hide/show senza regressioni UI *(smoke manuale PO)*

### Criteri chiusura STEP 1

- Context in ambito espongono `value` con identity stabile quando lo stato non cambia
- Azioni esportate stabili (`useCallback`)
- Smoke manuale OK
- Nessun lavoro STEP 2–4 introdotto

---

## STEP 2 — Bundle e caricamento iniziale

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Ridurre peso/parse del boot e dei chunk feature più pesanti senza alterare UX di route/overlay |
| **Stato STEP** | In verifica PO |
| **DoD STEP** | Entry e/o TravelDiary ridotti vs baseline; TipTap on-demand da Notes; Export `docx`/`qrcode` on-demand; deps morte rimosse / pin dove previsto; build OK |

### Ambito STEP 2

- `manualChunks` Vite (react, supabase, tiptap, …) — **senza** chunk cartografici
- Snellire entry / confine polyfills PDF-Word
- Dynamic TipTap/Notes; dynamic Export deps
- Cleanup dipendenze unused + pin `"latest"` critiche

### Fasi

| Fase | Stato | Inizio | Fine | PO ✓ |
|------|-------|--------|------|------|
| Analisi | Completato | 2026-07-29 | 2026-07-29 | ☐ |
| Pronto per implementazione | Completato | 2026-07-29 | 2026-07-29 | ☐ |
| Sviluppo | Completato | 2026-07-29 | 2026-07-29 | ☐ |
| Review tecnica | Completato | 2026-07-29 | 2026-07-29 | ☐ |
| Test | Completato | 2026-07-29 | 2026-07-29 | ☐ |
| Verifica PO | In verifica PO | 2026-07-29 | | ☐ |

### Checklist implementazione STEP 2

- [x] `manualChunks`: vendor-react, vendor-supabase, vendor-tiptap, vendor-docx, vendor-qrcode, vendor-react-pdf
- [x] TipTap: `DiaryNotesPanel` via `React.lazy` + `Suspense` (chunk separato)
- [x] `docx` dynamic import in `generateWordDocument`
- [x] `qrcode` dynamic import in `generateQr` (`pdfUtils`)
- [x] Polyfill Buffer/global on-demand (`ensureNodePdfPolyfills`) — rimosso da entry `index.tsx`
- [x] Rimosse deps morte: `react-qr-code`, `@google/genai` (client)
- [x] Pin versioni: `@react-pdf/renderer`, `docx`, `qrcode`, `clsx`, `file-saver`, `tailwind-merge`

### Baseline build (audit) → post STEP 2 (min / gzip)

| Chunk | Prima | Dopo |
|-------|------:|-----:|
| `index` | ~846 / 247 KB | ~498 / 144 KB |
| `TravelDiary` | ~597 / 186 KB | ~104 / 31 KB |
| `ExportModal` | ~390 / 113 KB | ~27 / 8 KB |
| TipTap | (in TravelDiary) | `vendor-tiptap` ~468 KB on-demand |
| docx | (in ExportModal) | `vendor-docx` ~368 KB on-demand |

### Checklist test STEP 2

- [x] `npm run build` — confronto chunk vs baseline audit OK
- [ ] Cold load Home *(smoke manuale PO)*
- [ ] Diario → tab Notes (TipTap on-demand) *(smoke manuale PO)*
- [ ] Export PDF / Word / QR al primo uso formato *(smoke manuale PO)*
- [ ] Smoke PDF Roadbook se tocca polyfills *(smoke manuale PO)*
---

## STEP 3 — Runtime overlay / idle / rendering inutile sotto focus

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Ridurre lavoro React/GPU con overlay workspace/modali aperti, rispettando Focus System e Design System |
| **Stato STEP** | Completato |
| **DoD STEP** | ModalManager idle sotto workspace; policy freeze/idle sotto dim coerente con registry; Valigia companion OK; Sidebar mobile coerente; smoke overlay desktop+mobile OK |

### Ambito STEP 3

- ModalManager idle path sotto workspace
- Content freeze / idle boundary sotto `workspaceDim`
- Dedup Sidebar mobile dove sicuro
- `React.memo` selettivo **solo dopo** STEP 1
- Nessun alzamento `Z_FOCUS_DIM`; nessuna pezza widget

### Fasi

| Fase | Stato | Inizio | Fine | PO ✓ |
|------|-------|--------|------|------|
| Analisi | Completato | 2026-07-29 | 2026-07-29 | ☑ |
| Pronto per implementazione | Completato | 2026-07-29 | 2026-07-29 | ☑ |
| Sviluppo | Completato | 2026-07-29 | 2026-07-29 | ☑ |
| Review tecnica | Completato | 2026-07-29 | 2026-07-29 | ☑ |
| Test | Completato | 2026-07-29 | 2026-07-29 | ☑ |
| Verifica PO | Completato | 2026-07-29 | 2026-07-29 | ☑ |

### Checklist implementazione STEP 3

- [x] ModalManager idle sotto `resolveWorkspaceId` + `ModalManagerClassic`
- [x] `FocusIdleBoundary` / `IdleGate` su aside+main (`baseContent`); companion Valigia escluso
- [x] ModalManager fuori da AppShell / freeze
- [x] Dedup Sidebar mobile (skip AppShell Sidebar se diary/weather overlay)
- [x] Nessun alzamento `Z_FOCUS_DIM`; memo di massa non necessario

### Checklist test STEP 3

- [x] MyWorld / MySpace open/close, ESC, click dim, chrome usabile *(ACCETTO PO)*
- [x] Valigia companion sopra dim *(ACCETTO PO)*
- [x] Collaboration workspace smoke *(ACCETTO PO)*
- [x] Mobile diary fullscreen + weather *(ACCETTO PO)*
- [x] Layering sponsor sotto dim (MySpace) *(ACCETTO PO)*

---

## STEP 4 — Virtualizzazione, immagini, fetch/polling, cleanup, benchmark

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Ottimizzazioni locali ad alto ROI + igiene rete + chiusura misurata del Workflow |
| **Stato STEP** | In verifica PO |
| **DoD STEP** | Almeno un path consumer + un path admin virtualizzati; `sizes` su `ImageWithFallback`; N+1 Around Me risolto o deferito motivato; polling ridotto; benchmark before/after vs audit |

### Ambito STEP 4

- `useVirtualWindow` su Suitcase + hot path admin
- `sizes` / priorità LCP immagini
- Batch Around Me events/guides; polling hygiene
- Cleanup minori; benchmark finale

### Fasi

| Fase | Stato | Inizio | Fine | PO ✓ |
|------|-------|--------|------|------|
| Analisi | Completato | 2026-07-29 | 2026-07-29 | ☐ |
| Pronto per implementazione | Completato | 2026-07-29 | 2026-07-29 | ☐ |
| Sviluppo | Completato | 2026-07-29 | 2026-07-29 | ☐ |
| Review tecnica | Completato | 2026-07-29 | 2026-07-29 | ☐ |
| Test | Completato | 2026-07-29 | 2026-07-29 | ☐ |
| Verifica PO | In verifica PO | 2026-07-29 | | ☐ |

### Checklist implementazione STEP 4

- [x] Consumer: `SuitcaseEditorView` — `CategoryItemsGrid` + `useVirtualWindow` (≥28 item/categoria)
- [x] Admin: `PoiList` virtualizzato in expanded mode (≥24 POI)
- [x] `ImageWithFallback`: props `sizes` / `fetchPriority`; Home hero + CityHeader LCP (`100vw` / `high`)
- [x] Around Me: `getCityEventsByCityIds` + `getCityGuidesByCityIds` in `buildVirtualCity` (no N+1)
- [x] Polling hygiene: Header 60s + event/visibility; UserNotificationsTab 120s; AdminDashboard 180s + visibility
- [x] `NOTIFICATIONS_CHANGED_EVENT` su mutazioni notificationService
- [x] Benchmark build vs audit / post–STEP 2 (chunk stabili; guadagni STEP 4 = runtime)

### Benchmark build (audit → post STEP 2 → post STEP 4)

| Chunk | Audit 2026-07-28 | Post STEP 2 | Post STEP 4 (2026-07-29) |
|-------|-----------------:|------------:|-------------------------:|
| `index` | ~846 / 247 KB | ~498 / 144 KB | ~499 / 145 KB |
| `TravelDiary` | ~597 / 186 KB | ~104 / 31 KB | ~104 / 31 KB |
| `ExportModal` | ~390 / 113 KB | ~27 / 8 KB | ~34 / 10 KB |
| TipTap / docx / pdf | inline | vendor on-demand | invariato (on-demand) |

**Nota:** STEP 4 non mira a ridurre i chunk (già chiusi in STEP 2). Guadagni attesi: DOM virtuale liste lunghe, meno round-trip Around Me, meno polling idle, hint LCP immagini.

### Checklist test STEP 4

- [x] `npm run build` — OK; tabella benchmark aggiornata
- [ ] Suitcase molti item: scroll + check *(smoke manuale PO)*
- [ ] Admin list grande (expanded) *(smoke manuale PO)*
- [ ] Home/City immagini / Network (sizes / fetchPriority) *(smoke manuale PO)*
- [ ] Around Me parity dati vs pre-batch *(smoke manuale PO)*
- [ ] Notifiche senza spam network *(smoke manuale PO)*
---

## Criteri di completamento Workflow

| # | Criterio | Stato |
|---|----------|-------|
| 1 | Tutti e 4 gli STEP Completati + PO ✓ | ☐ (STEP 1–2 e 4 In verifica PO; STEP 3 Completato) |
| 2 | Esclusioni cartografiche rispettate | ☑ (nessun tocco Maps) |
| 3 | Nessuna pezza z-index / overlay | ☑ |
| 4 | Benchmark STEP 4 prodotto e confrontato alla baseline | ☑ (tabella sopra; attesa PO) |
| 5 | `01_EXECUTION_ROADMAP` + `03_PROJECT_STATUS` aggiornati | ☑ |
| 6 | Validazione PO finale | ☐ |
| 7 | Archivio in `WORKFLOWS/_archive/` (se applicabile) | ☐ |

---

## Deliverable finali

1. Codice STEP 1–4 mergiato / accettato per STEP  
2. Chunk sizes e note build migliorati vs baseline audit (STEP 2+)  
3. Report benchmark chiusura (STEP 4)  
4. Workflow aggiornato + status/roadmap  
5. Nessun deliverable cartografico  

---

## Log decisioni operative

| Data | Decisione | Chi |
|------|-----------|-----|
| 2026-07-28 | Piano 4 STEP approvato; esclusioni cartografia; avvio WF-PERF-01 + STEP 1 | PO + AI |
| 2026-07-28 | STEP 1 implementato (Context value identity) → In verifica PO | AI |
| 2026-07-29 | STEP 2 implementato (bundle / TipTap / Export / deps) → In verifica PO | AI |
| 2026-07-29 | STEP 3 ACCETTO PO — Completato (idle ModalManager / FocusIdleBoundary / Sidebar mobile) | PO + AI |
| 2026-07-29 | STEP 4 implementato (virtual window Suitcase+PoiList, sizes/LCP, Around Me batch, polling) → In verifica PO | AI |
| 2026-07-30 | `ImageWithFallback`: DOM Priority Hints come `fetchpriority` (lowercase) — React 18.3 non riconosce camelCase `fetchPriority` (React 19+). API pubblica invariata. Logica auto-derivazione `priority→high` non cambiata; audit A/B/C pending decisione PO | AI |
| 2026-08-01 | Rifinitura LCP+a11y implementata; audit User-scalable (**B rischi concreti**) + Google Fonts completo in decisione PO. Doc: `WF_PERF_01_RIFINITURA_LCP_A11Y.md` | AI |

---

## Chiusura Workflow

| Campo | Valore |
|-------|--------|
| **Data chiusura** | |
| **Validazione PO finale** | |
| **Archiviato in** | `WORKFLOWS/_archive/` (se applicabile) |

**Report operativo obbligatorio** → `00_DEVELOPMENT_PROTOCOL.md` §15.

---

## Cronologia stato

| Data | STEP | Fase | Stato | Nota |
|------|------|------|-------|------|
| 2026-07-28 | — | — | Attivo | Apertura Workflow ufficiale |
| 2026-07-28 | STEP 1 | Sviluppo | Completato | Stabilizzazione Context |
| 2026-07-28 | STEP 1 | Verifica PO | In corso | In attesa ACCETTO PO |
| 2026-07-29 | STEP 2 | Verifica PO | In corso | Bundle split + TipTap/Export on-demand |
| 2026-07-29 | STEP 3 | Verifica PO | Completato | ACCETTO PO — overlay idle / freeze |
| 2026-07-29 | STEP 4 | Verifica PO | In corso | Virtualizzazione / immagini / fetch / polling / benchmark |
