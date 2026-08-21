# AUDIT REGRESSIONI BIOME

Audit forense — **nessuna correzione applicata in questa fase**.  
Data: 2026-08-12. Ambiente di prova agente: Chrome headless via Playwright contro `http://localhost:5200/` (Vite DEV) e `http://localhost:4173/` (vite preview).

---

## 1. Stato iniziale noto

Prima delle bonifiche Biome/a11y (working tree non committato su `main`):

- I trigger città (Angolo Cultura, Tour operator, Guide, Servizi, Eventi, Storia, Patrono) aprivano modal locali via `CityDetailContent` → `setActiveModal(...)`.
- Community / Sponsor / POI aprivano modal tramite `ModalContext` + `ModalManager` / `FeatureModals` / `AdminModals`, con oscuramento `FocusOverlay` (`modalDim`).
- Around Me apriva `AroundMeWizard`; il click esterno **non** era cablato sull’overlay (anche in HEAD).
- Tempo di avvio percepito dichiarato dall’utente: ~2 s (ambiente non specificato: DEV vs preview vs produzione).

---

## 2. Stato attuale

### Dichiarato dall’utente (dopo rimozione `relative`)

- Pulsanti città + Rifiutati: **nessun effetto** (niente oscuramento).
- Community / Sponsor / POI: **oscuramento senza finestra**.
- La correzione `td-modal-overlay` − `relative` **non** ha risolto i sintomi.

### Misurato dall’agente (stesso working tree, 2026-08-12)

Su `localhost:5200` e `localhost:4173`, con Chrome headless:

| Flusso | Risultato runtime |
|--------|-------------------|
| Community | **PASS** — `Community Hub` presente; pannello ~960×827; `position:fixed`; `#focus-overlay` presente |
| Angolo Cultura | **PASS** — overlay con testo “Angolo Cultura…” |
| Tour operator | **PASS** — overlay “TOUR OPERATOR…” |
| Guide / Servizi / Eventi / Storia / Patrono | **PASS** |
| Sponsor città | **PASS** — overlay “Diventa Partner…” + `#focus-overlay` |
| Around Me click fuori | **PASS** — overlay sparisce dopo click a (20,120) |
| POI (click euristico) | **NON CONCLUSIVO** — il click automatico ha colpito “Indietro”, non un POI reale |

**Conclusione operativa:** le regressioni UI **ancora segnalate dall’utente non sono state riprodotte** nell’ambiente locale dell’agente sullo stesso codice.  
Questo non nega l’esperienza utente; dimostra che **manca ancora una prova che colleghi i sintomi residui a un difetto riproducibile in questo ambiente**.

---

## 3. Regressioni confermate

### Confermate dall’utente (osservazione umana)

1. City triggers senza effetto (Cultura, Tour Op, Guide, Servizi, Eventi, Storia, Patrono, Rifiutati).
2. Community / Sponsor / POI: solo oscuramento.
3. Around Me: click esterno non chiudeva (prima del fix backdrop; vedi §10).
4. Performance percepita 2 s → 7 s.

### Confermate da runtime agente (sul codice attuale)

1. **Teoria `relative` come causa esclusiva di invisibilità: FALSIFICATA** (vedi §13–14).
2. **Stacking `ModalLoading` sotto `FocusOverlay` durante Suspense: DIMOSTRATO nel codice** (può produrre “solo oscuramento” temporaneo).
3. **Guard `globalSection` in `FeatureModals`: DIMOSTRATO come percorso latente** “FocusOverlay senza contenuto” se `modalProps.section` non è valido.
4. **Vite DEV: ~11–12 MB JS / ~230–250 moduli** al first load — correlato al “~7 s” percepito in DEV.

### Non riprodotte dall’agente (sul codice attuale post-rimozione `relative`)

- City modal “non succede niente”.
- Community/Sponsor “solo oscuramento” persistente.
- Around Me click-outside (ora chiude in prova automatica).

---

## 4. Regression Map

### A) City — Angolo Cultura

| Step | Dettaglio |
|------|-----------|
| Trigger | `CityHeader` button desktop “Angolo Cultura” (`onClick={onOpenCulture}`) |
| Componente | `src/components/city/CityHeader.tsx` |
| Handler | `onOpenCulture` |
| Callback | `CityDetailContent`: `() => setActiveModal('culture')` |
| Stato | `activeModal: ActiveModal` locale (`'none' \| … \| 'culture'`) |
| Rendering | `<CultureCornerModal isOpen={activeModal === 'culture'} … />` |
| Modal | `CultureCornerModal` → `createPortal(..., document.body)` |
| Overlay | Locale (`td-modal-overlay`), **non** `FocusOverlay` |
| Risultato utente | “niente” |
| Risultato agente (DEV) | Modal montato, testo presente, `position:fixed`, h≈827 |

### B–F) Tour / Guide / Servizi / Eventi

| Step | Dettaglio |
|------|-----------|
| Trigger | Bottoni desktop in `CityHeader` → `onOpenInfo('tour_operators'\|'guides'\|'services'\|'events')` |
| Callback | `setActiveModal(t)` |
| Rendering | `isCityInfoTab(activeModal)` → `CityInfoModal` |
| Overlay | Locale, no FocusOverlay |
| Risultato agente | PASS per tutti e quattro |

### G–H) Storia / Patrono

| Step | Dettaglio |
|------|-----------|
| Trigger | Bottoni/label in `CityHeader` → `onOpenHistory` / `onOpenPatron` |
| Callback | `setActiveModal('history'\|'patron')` |
| Modal | `HistoryModal` / `PatronSaintModal` (portal body) |
| Nota | Patrono ha ancora un `div` con `onClick` (oltre al `button`) — non blocca il path del button |
| Risultato agente | PASS |

### I) Sponsor città

| Step | Dettaglio |
|------|-----------|
| Trigger | Button SPONSOR → `onOpenSponsor('gold')` |
| Callback | `AppRouter`: `openModal('sponsor', { sponsorTier: tier })` |
| Stato | `ModalContext.activeModal = 'sponsor'` |
| Focus | `FocusOverlay` `modalDim` (z=14000) |
| Rendering | `ModalManager` → `AdminModals` → `SponsorModal` |
| Risultato agente | PASS (hub testo “Diventa Partner…”, focus true) |

### J) POI

| Step | Dettaglio |
|------|-----------|
| Trigger | Click POI → tipicamente `openModal('poiDetail', { poi })` |
| Rendering | `FeatureModals`: `activeModal === 'poiDetail' && detailPoi` → `PoiDetailModal` portal |
| Focus | `FocusOverlay` presente |
| Risultato agente | **Non dimostrato** (click automatico non ha colpito un POI reale) |

### K) Rifiutati Valigia

| Step | Dettaglio |
|------|-----------|
| Trigger | `SuitcaseEditorToolbar` button → `onOpenBlacklist` |
| Callback | `useSuitcaseEditorLogic`: `modalState.setShowBlacklistModal(true)` |
| Rendering | `SuitcaseModals` → `BlacklistModal` |
| Condizione | `disabled={readOnly}` — in sola lettura il click non apre |
| Risultato agente | **Non eseguito** in questa sessione (richiede aprire Valigia + editor) |

### L) Community

Vedi §5.

### M) Around Me click-outside

Vedi §10.

---

## 5. Community

### Catena codice (DIMOSTRATA)

1. Click: `Sidebar` button Community → `onOpenGlobal('community')`  
   File: `src/components/layout/Sidebar.tsx`
2. Wiring desktop FocusIdle: `MainLayout` → `handleNavigateGlobal(section)`  
   File: `src/components/layout/MainLayout.tsx`
3. Navigation: `section === 'community'` → `modalContext.openModal('global', { section: 'community', tab, id })`  
   File: `src/context/NavigationContext.tsx`
4. Stato: `activeModal='global'`, `modalProps.section='community'`  
   File: `src/context/ModalContext.tsx`
5. Focus: `deriveFocusState` → mode `modal` → `FocusOverlay` `#focus-overlay` z=14000  
   File: `src/focus/FocusOverlay.tsx`
6. Manager: `ModalManager` non-workspace → portal `Suspense` → lazy `FeatureModals`  
   File: `src/components/layout/ModalManager.tsx`
7. Feature: `activeModal === 'global' && globalSection` → `GlobalSectionView`  
   File: `src/components/layout/modals/FeatureModals.tsx`  
   Guard: `isGlobalSection` accetta solo `community|sponsors|itineraries`
8. View: `GlobalSectionView` → `BaseFullscreenModalShell` → `createPortal` body  
   File: `src/components/modals/GlobalSectionView.tsx`, `.../shell/BaseFullscreenModalShell.tsx`

### Layer contemporanei (prova runtime DEV, Community aperta)

| Layer | z-index | position | Dimensioni | Note |
|-------|---------|----------|------------|------|
| `#focus-overlay` | 14000 | fixed | 1440×827 | Oscuramento |
| `.td-modal-overlay` (shell) | 14000 | fixed | 1440×827 | Trasparente + backdrop button full-size |
| Pannello interno | 11000 (locale) | relative | 960×827 | `bg rgb(2,6,23)`, opacity 1, visibility visible |
| Testo | — | — | — | `Community Hub` trovato nel DOM |

Ordine body: `#root` → (nodo Suspense) → `.td-modal-overlay`. Stesso z-index: vince il portal successivo.

### Domande audit → risposte

| # | Domanda | Risposta (ambiente agente) |
|---|---------|----------------------------|
| 1 | Chi riceve il click? | Button Community in Sidebar |
| 2 | Funzione? | `onOpenGlobal('community')` → `handleNavigateGlobal` → `openModal` |
| 3 | Stato? | `activeModal='global'`, section community |
| 4 | Cosa dovrebbe renderizzare? | `GlobalSectionView` in shell fullscreen |
| 5 | Viene renderizzato? | **Sì** (testo Hub presente) |
| 6 | Portal? | **Sì**, su `document.body` |
| 7 | Dove nel DOM? | Ultimo figlio di `body` con classe `td-modal-overlay` |
| 8–10 | Layer / conflitto FocusOverlay? | Entrambi z=14000; pannello misurato visibile sopra |
| 11 | Dimensioni effettive? | Overlay h=827, panel 960×827 — **non zero** |
| 12 | CSS che lo rende invisibile? | **Non trovato** nello stato attuale |

### Percorso latente “solo FocusOverlay” (codice, non riprodotto su Community sidebar)

Se `openModal('global', props)` senza `section` valida:

- `FocusOverlay` si accende comunque (`activeModal != null`);
- `FeatureModals` **non** monta `GlobalSectionView` (`globalSection === undefined`);
- Sintomo: oscuramento senza finestra.

Sul path Sidebar → Community la section è `'community'` → la guard **non** spiega il fallimento di quel path, salvo corruzione/props perse (non osservata).

---

## 6. City Modals

Percorso comune:

`CityHeader` (button) → prop callback → `CityDetailContent.setActiveModal` → modal locale portaled.

**Non** passano da `ModalManager` / `FocusOverlay`.

Quindi un sintomo “solo oscuramento” **non** è il pattern tipico di questi modal; il pattern tipico di fallimento totale è “niente” (nessun FocusOverlay).

Hit-test Cultura (DEV): `elementFromPoint` sul bottone → stesso albero del button (`same: true`).  
Quindi, nell’ambiente agente, il click **non** è intercettato da un overlay estraneo.

---

## 7. Sponsor

Path: `CityHeader` → `onOpenSponsor` → `AppRouter.openModal('sponsor', { sponsorTier })` → `AdminModals` → `SponsorModal`.

Nota: `AdminModals` passa `initialType={modalProps.sponsorType}`, mentre AppRouter imposta spesso `sponsorTier` (non `sponsorType`).  
Questo può influenzare il **tipo iniziale** del form, **non** l’apertura (`isOpen={true}` se `activeModal==='sponsor'`).

Runtime agente: modal aperto con contenuto “Diventa Partner…”.

---

## 8. POI

Path atteso: `openModal('poiDetail', { poi })` → `FeatureModals` richiede `detailPoi` (`modalProps.poi`).

Se `poi` assente: `activeModal='poiDetail'` → FocusOverlay **sì**, `PoiDetailModal` **no** → sintomo “solo oscuramento” (**percorso latente dimostrato in codice**, non ancora riprodotto con click POI reale in questa sessione).

---

## 9. Rifiutati Valigia

Path: toolbar → `onOpenBlacklist` → `setShowBlacklistModal(true)` → `BlacklistModal`.

Diff Biome: principalmente formattazione / tipi; wiring `onOpenBlacklist` presente.

Cause alternative da verificare manualmente:

- `readOnly === true` → button `disabled`;
- workspace Valigia non in editor;
- modal montato ma fuori viewport (da verificare con DevTools utente).

**CAUSA NON ANCORA DIMOSTRATA** per il “niente” utente.

---

## 10. Around Me

### HEAD (prima bonifica backdrop)

Overlay `td-modal-overlay` **senza** `onClick` di chiusura e **senza** backdrop button.  
`FocusOverlay` è sotto il portal (stesso z-index, portal dopo) → i click esterni **non** raggiungevano `closeFocus`.

### Stato attuale (working tree)

Aggiunto backdrop button `absolute inset-0` → `onClose` (senza `relative` sull’overlay).

### Prova runtime

`AROUND_OPEN` → overlay presente; click (20,120) → `AROUND_AFTER_OUTSIDE_CLICK` overlays=0, focus=false.

**CAUSA DIMOSTRATA (storica):** mancanza di handler click-outside sull’overlay di `AroundMeWizard`.  
**Stato corrente agente:** risolto nel working tree; da riconfermare dall’utente.

---

## 11. Performance Regression (2 s → 7 s)

### Misure agente (non inventate)

| Ambiente | wall → networkidle | DCL | FCP | #JS | JS transfer |
|----------|-------------------:|----:|----:|----:|------------:|
| Vite DEV `:5200` | ~3500 ms | ~1224 | ~2520 | ~247 | **~11.6 MB** |
| Preview `:4173` | ~3819 ms | ~393 | ~1820 | ~92 | **~0.49 MB** |
| DEV + wait 5s (altra prova) | wall settled **~6644 ms** | — | — | — | — |

### Interpretazione

- In **Vite DEV**, il browser scarica centinaia di moduli sorgente (~11 MB). Un “settled” ~6–7 s è **coerente** con la percezione utente di ~7 s **se** si testa con `npm run dev`.
- In **preview/build**, il transfer JS è ~25× più piccolo; FCP ~1.8 s — **non** è stato misurato un carico da 7 s.
- **Non** esiste in questa sessione una baseline Git “prima della bonifica” misurata sullo stesso hardware → non si può dimostrare che la bonifica abbia aggiunto +5 s in produzione.

### Cosa non è stato misurato

- Lighthouse completo pre/post commit.
- Tempo React commit/render con Profiler.
- Confronto `git checkout` HEAD vs working tree su build produzione.
- Ambiente esatto usato dall’utente (DEV / preview / tunnel / prod).

---

## 12. Modifiche Biome coinvolte (sospette)

Diff working tree vs `HEAD` (non un singolo commit — bonifica ancora sporca):

| Area | Modifica tipica | Impatto potenziale |
|------|-----------------|--------------------|
| Modal shell / molti modal | `onClick` su `div` → `role="presentation"` + `button` backdrop `absolute inset-0`; spesso aggiunto poi rimosso `relative` | Cambia hit-testing chiusura; stacking backdrop vs pannello |
| `FeatureModals` | Introdotta guard `isGlobalSection` / `detailPoi` | Percorsi “FocusOverlay senza contenuto” se props incomplete |
| `ModalContext` | `any` → `ModalPropsBag` | Runtime: `openModal` continua a settare le props passate (nessuno strip osservato) |
| `CityHeader` / city | `type="button"`, formattazione, aria | Wiring `onClick` dei trigger principali **conservato** |
| `FocusOverlay` / FocusMode | Quasi solo import type / formatting | Nessun cambio comportamentale dimostrato |
| Suitcase / Blacklist | Tipi + format | Wiring blacklist presente |
| Bundle DEV | Molti file toccati → più invalidazioni HMR / grafo moduli | Peggiora cold load **DEV** |

`ItineraryManager` split: **nessuna relazione** con i path UI sopra (admin reviews vs city/community).

---

## 13. Evidenze

### E1 — CSS `relative` vs `td-modal-overlay`

- Definizione: `src/index.css` `@utility td-modal-overlay { position: fixed; ... }`
- Build CSS: `.relative{position:relative}` compare **dopo** `.td-modal-overlay{...position:fixed}` → in caso di entrambe le classi, vince `relative`.
- Prova runtime: su Community già aperta, `classList.add('relative')` → `overlayPosition` diventa `relative`, altezze restano ~761, **`Community Hub` resta true**.
- **Quindi:** il conflitto CSS esiste, ma **non** è sufficiente da solo a spiegare l’invisibilità totale osservata storicamente dall’utente.

### E2 — Community montata e dimensionata (DEV + preview)

Log Playwright: `hub: 1`, panel `w:960 h:827`, `opacity:'1'`, `visibility:'visible'`, `position:'fixed'`, `parentHasRelativeClass: false`.

### E3 — City modal montati (DEV)

Dopo click: overlay con testi TOUR OPERATOR / GUIDE / SERVIZI / EVENTI / Storia / Santo Patrono.

### E4 — ModalLoading sotto FocusOverlay

- `ModalLoading`: `zIndex: Z_MODAL_NESTED` (12000)  
  File: `src/components/common/ModalLoading.tsx`
- `FocusOverlay` modalDim: `Z_OVERLAY` (14000)  
  File: `src/focus/FocusOverlay.tsx`
- Durante `Suspense` di `FeatureModals` / lazy nested, l’utente vede l’oscuramento Focus **senza** lo spinner (coperto).

### E5 — Guard GlobalSection

HEAD: `{activeModal === 'global' && ( <GlobalSectionView section={modalProps.section} …/> )}`  
Working: `{activeModal === 'global' && globalSection && ( … )}`  
File: `src/components/layout/modals/FeatureModals.tsx`

### E6 — Performance DEV vs preview

Vedi tabella §11 (misure Playwright).

---

## 14. Causa dimostrata / probabile / non dimostrata

### CAUSA DIMOSTRATA

1. **Teoria “solo `td-modal-overlay + relative` ⇒ modal invisibile”**: **FALSIFICATA** come spiegazione esclusiva (E1 + E2).
2. **Around Me click-outside (pre-fix)**: mancanza di backdrop/`onClose` sull’overlay (codice HEAD + comportamento).
3. **`ModalLoading` z-index < `FocusOverlay`**: stacking errato durante il lazy load (codice).
4. **Percorso latente FocusOverlay-without-content**: `activeModal` valorizzato ma guard contenuti (`globalSection` / `detailPoi`) falsi (codice).
5. **ItineraryManager split**: **non** è la causa dei path città/Community/Sponsor.

### CAUSA PROBABILE

1. **Percezione 7 s in `npm run dev`**: waterfall ~11 MB / 250 moduli JS (misurato); non prova una regressione produzione.
2. **“Solo oscuramento” intermittente**: finestra di Suspense in DEV lenta + E4 (spinner nascosto), interpretata come bug permanente.
3. **Test utente su build/HMR non allineata** allo stato che l’agente ha misurato (ipotesi operativa, non prova).

### IPOTESI NON DIMOSTRATA / CAUSA NON ANCORA DIMOSTRATA

1. Perché l’utente **continua** a vedere city-modal “niente” e Community “solo dim” **dopo** la rimozione di `relative`, mentre l’agente vede PASS sullo stesso tree.
2. Rifiutati Valigia “niente” (non eseguito end-to-end qui).
3. POI “solo dim” con click POI reale (non catturato).
4. Regressione performance **produzione** 2 s → 7 s attribuibile alla bonifica (manca baseline Git misurata).

---

## 15. Soluzione proposta

> **Non applicare finché non autorizzato.**  
> Priorità: chiudere il gap di riproduzione con l’utente, poi fix mirati sulle sole cause dimostrate.

### S1 — Allineamento ambiente (obbligatorio prima di altro codice)

- Far confermare URL esatto (`5200` vs `4173` vs tunnel).
- Hard refresh / riavvio `npm run dev` o rebuild preview.
- Se ancora FAIL: ripetere le stesse prove DOM (presenza `#focus-overlay`, `.td-modal-overlay`, testo “Community Hub”, `getBoundingClientRect` del pannello).

### S2 — Fix stacking Suspense (causa dimostrata E4)

- Portare `ModalLoading` a `Z_OVERLAY` (o superiore al dim), **oppure** non mostrare `FocusOverlay` finché il contenuto modal non è ready.
- File: `src/components/common/ModalLoading.tsx` e/o policy Focus.
- Ripristina: feedback di caricamento visibile; riduce falsi “solo dim”.
- Rischio: basso se si resta sui token z-index esistenti.

### S3 — Guard FeatureModals (causa latente E5)

- Per `global` / `poiDetail`: non lasciare `activeModal` “opaco” senza UI; fallback UI di errore o non aprire Focus finché props valide.
- File: `FeatureModals.tsx` (e eventualmente openModal callers).
- Rischio: medio (comportamento deep-link).

### S4 — Non reiterare fix `relative` come unica leva

- La rimozione può restare (è coerente con `position:fixed`), ma **non** va trattata come soluzione completa delle regressioni residue.

### S5 — Performance

- Misurare **solo preview/production build** prima/dopo.
- Non usare cold load Vite DEV come metrica di regressione prodotto.
- Se il problema è DEV: documentare; eventuale ottimizzazione import/lucide è altro filo.

---

## 16. Piano di correzione (da approvare)

1. Gate riproduzione con utente (S1) — **stop** se non allineati.
2. Se riprodotto: catturare DOM state (overlay count, z-index, rect, testo).
3. Applicare S2 (ModalLoading / Focus timing) come fix condiviso dimostrato.
4. Valutare S3 solo se si osserva `activeModal` senza contenuto.
5. Lasciare ItineraryManager fuori scope.
6. Rieseguire piano §17.
7. Solo allora discutere performance produzione con misure dedicate.

---

## 17. Piano di verifica

### Desktop

1. Community: finestra “Community Hub” visibile; chiusura X / ESC / click fuori.
2. Città Sorrento (o equivalente): Cultura, Tour Op, Guide, Servizi, Eventi, Storia, Patrono — ciascuno apre finestra con titolo atteso.
3. Sponsor: finestra “Diventa Partner” (o equivalente), non solo dim.
4. POI normale + sponsor: scheda POI visibile.
5. Valigia editor: Rifiutati apre lista/modal.
6. Around Me: click fuori chiude.

### Tablet / Smartphone

Stessi flussi in viewport ~768 e ~390: modal visibile, scroll interno, chiusura, tap fuori Around Me / Community.

### Performance

- Misurare su **preview** (`npm run build && npm run preview`): DCL / FCP / networkidle.
- Confrontare con DEV solo come diagnostica developer experience.
- Annotare URL e comando usati.

### Criterio di chiusura audit UI

Una regressione si considera “causa dimostrata” solo con: path codice + prova runtime (o FAIL utente sullo **stesso** URL/comando dell’agente).

---

## Appendice — ItineraryManager

- File: `src/components/admin/ItineraryManager.tsx` + `src/components/admin/itineraryManager/*`.
- Usa `PoiDetailModal` / `DeleteConfirmationModal` in ambito **admin reviews**.
- **Non** è nel path dei trigger città/Community/Sponsor della home.
- Relazione con le regressioni elenco utente: **nessuna dimostrata**.

---

## Appendice — Cosa manca per chiudere le cause residue

1. URL e comando esatti usati dall’utente nel FAIL post-fix.
2. Screenshot o conferma: compare “Community Hub” sì/no quando c’è il dim.
3. Per Rifiutati: Valigia in editor non read-only.
4. Per POI: click su card POI con DevTools Elements aperto (presenza `.td-modal-overlay` figlio panel).
5. Per performance 2→7: stesso ambiente (DEV vs preview) prima/dopo su commit noto.
