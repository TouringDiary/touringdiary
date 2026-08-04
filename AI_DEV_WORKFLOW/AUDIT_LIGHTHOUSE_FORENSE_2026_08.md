# Audit Lighthouse Forense

| Campo | Valore |
|-------|--------|
| **Data prima stesura** | 2026-08-02 |
| **Ultimo aggiornamento** | 2026-08-02 — WF-PERF-02 STEP 1–2 + analisi Sponsor/Config |
| **Tipo** | Dossier forense definitivo — evidenze verificate + classificazione; nessuna ottimizzazione bootstrap proposta |
| **Ambito** | Lighthouse / DevTools + classificazione bootstrap + reflow + heroImage + remediation anomalie già dimostrate |
| **Fonte report Lighthouse grezzo** | Nessun file `.har` / `lighthouse.json` / report HTML presente nel repository |
| **Screenshot Performance Panel** | Dichiarati allegati dal PO; **non accessibili all’agente in questa sessione** (nessun file immagine nel workspace / messaggio tool) |

**Metodo:** ogni affermazione sotto «Evidenze» e «Causa verificata» è supportata da lettura del codice o del filesystem del repo. Dove manca una prova (trace Performance completo, coverage, Lighthouse JSON, HAR, screenshot accessibili), lo stato resta esplicitamente non dimostrato.

**Politica di revisione:** le sezioni 1–9 della prima stesura restano; nuove evidenze sono integrate sotto di esse o in sezioni 10+. Conclusioni smentite sono marcate **SUPERATA**, non cancellate.

---

## 1. Performance — Main Thread Work / TBT / JavaScript Execution / Long Tasks

### Stato
- **Analizzato** (mappa bootstrap e lavoro montato su `/`)
- **Causa verificata** per la composizione del lavoro iniziale sul main thread (catena di montaggio)
- Attribuzione quantitativa dei ms Lighthouse (TBT / Long Tasks) a una singola funzione: **CAUSA NON ANCORA DIMOSTRATA** (nessun Performance trace allegato al repo)

### Problema
Carico iniziale del main thread su Home `/`: parsing/valutazione JS, montaggio React, effetti di bootstrap, lavoro di layout sincrono su hero stacked.

### Evidenze

#### Catena di entry (verificata)
1. `index.html` → `<script type="module" src="/src/index.tsx">` (dev) / `/assets/index-NSYKCl42.js` (build in `dist/index.html`)
2. `src/index.tsx` → `createRoot` → `GlobalErrorBoundary` → `BrowserRouter` → `AppProviders`
3. `src/context/AppProviders.tsx` monta in ordine:  
   `UserProvider` → `PlatformControlProvider` → `BusinessProvider` → `ConfigProvider` → `GlobalErrorBoundary(application)` → `UIProvider` → `AiPlannerProvider` → `ModalProvider` → `GpsProvider` → `NavigationProvider` → `InteractionProvider` → `ItineraryProvider` → `DiaryInteractionProvider` → `AppCoordinator`
4. `AppCoordinator` avvolge `FocusModeProvider` e, fuori admin, monta `MainLayout`
5. `MainLayout` monta eager: `AppShell`, `Header`, `Sidebar`, `MobileNavBar`, `AppRouter`, `ModalManager`
6. `AppRouter` / `MainContent` su `/` monta **eager** `HomeContent` (non lazy)
7. `HomeContent` monta `HeroSection`, sezioni featured, `CuratedGridSection`, sponsor fetch

#### Import statici sul first paint Home (verificati)
- Eager: `HomeContent`, `HeroSection`, `HeroFilterModule`, `HeroAiModule`, `CuratedGridSection`, `CityCard`, shell layout
- Lazy (non sul cold `/` finché non aperti): `CityDetailContent`, `ShopPage`, `TravelDiary` (route), `UserDashboard`, `AdminDashboard`, `OnboardingWizard`, layer modali in `ModalManager`

#### Effetti / lavoro che partono al mount consumer (verificati nei file)
| Area | File | Cosa esegue al mount |
|------|------|----------------------|
| Auth / sessione | `src/hooks/core/useAppInitialization.ts` | `supabase.auth.onAuthStateChange`, `getSession`, `fetchLevelsAsync`, `checkConnection` |
| Catalogo città | stesso file | `getFullManifestAsync()` se `viewMode === 'app'` |
| Config / DS | `src/context/ConfigContext.tsx` | `loadConfig()` → cache settings + design rules |
| Platform flags / messaggi | `src/context/PlatformControlContext.tsx` | `ensureSystemMessagesLoaded()`, `refreshFlags()`, timer schedule, `visibilitychange` |
| Business | `src/context/BusinessContext.tsx` | `fetchBusinesses()` |
| Interaction | `src/context/InteractionContext.tsx` | load voti/like da storage (+ fetch foto likes se non guest) |
| Itinerary | `src/context/ItineraryContext.tsx` | `ItineraryStorageManager.loadProjects` |
| UI mobile | `src/hooks/ui/useMobileDetect.ts` | `innerWidth` + listener `resize` |
| Shell header height | `src/components/layout/AppShell.tsx` | `ResizeObserver` → `getBoundingClientRect().height` |
| Home sponsors | `src/components/home/HomeContent.tsx` | `fetchActiveSponsorsResolvedAsync`; `offsetWidth` + `ResizeObserver` su sponsor container |
| Hero settings | `src/hooks/ui/useHeroLogic.ts` | effect load settings / geo / inspirations |
| Supabase client | `src/services/supabaseClient.ts` | `createClient(...)` a **module scope** (valutato all’import) |

#### Bundle entry build misurati sul filesystem (`dist/`, 2026-08-02)
| Asset | Byte |
|-------|------|
| `dist/assets/index-NSYKCl42.js` | 426 157 |
| `dist/assets/vendor-react-B5HguGbH.js` | 257 162 |
| `dist/assets/vendor-supabase-zfXLf-1L.js` | 204 099 |
| `dist/assets/index-D51j_Csm.css` | 362 343 |

`dist/index.html` contiene `modulepreload` per `vendor-react` e `vendor-supabase` oltre allo script `index-*.js`.

### Causa verificata
Il main thread al primo caricamento di `/` esegue obbligatoriamente: valutazione del bundle entry + vendor React/Supabase, montaggio dell’intero albero provider elencato, montaggio shell (`MainLayout`/`AppShell`/`Header`/`Sidebar`/`AppRouter`) e montaggio eager di `HomeContent`/`HeroSection`, più gli effetti di bootstrap elencati.

**Non dimostrato** (manca trace Performance Lighthouse/DevTools nel repo): quale task specifico genera i Long Tasks / il TBT numerico del report esterno.

### File coinvolti
`index.html`, `dist/index.html`, `src/index.tsx`, `src/context/AppProviders.tsx`, `src/context/UserContext.tsx`, `src/context/ConfigContext.tsx`, `src/context/PlatformControlContext.tsx`, `src/context/BusinessContext.tsx`, `src/context/UIContext.tsx`, `src/context/NavigationContext.tsx`, `src/context/InteractionContext.tsx`, `src/context/ItineraryContext.tsx`, `src/hooks/core/useAppInitialization.ts`, `src/services/supabaseClient.ts`, `src/components/layout/AppCoordinator.tsx`, `src/components/layout/MainLayout.tsx`, `src/components/layout/AppShell.tsx`, `src/components/layout/AppRouter.tsx`, `src/components/home/HomeContent.tsx`, `src/components/home/HeroSection.tsx`, `vite.config.ts`

### Componenti coinvolti
`AppProviders`, `AppCoordinator`, `MainLayout`, `AppShell`, `Header`, `Sidebar`, `MobileNavBar`, `AppRouter`/`MainContent`, `HomeContent`, `HeroSection`, `HeroFilterModule`, `HeroAiModule`, `CuratedGridSection`, `CityCard`, `GlobalErrorBoundary`, `FocusModeProvider`

### Impatto
Tecnico: lavoro obbligatorio sul main thread prima/durante first paint Home; latenza di interattività correlata al volume di JS valutato e al montaggio React/effetti.

### Gravità
**Alta**

### Decisione PO

### Decisione tecnica

### Azioni

---

## 2. Render Blocking Requests

### Stato
- **Causa verificata** (risorse blocking dichiarate in HTML sorgente e build)

### Problema
Richieste che bloccano il rendering iniziale.

### Evidenze

#### `index.html` (sorgente)
| Risorsa | Attributi verificati |
|---------|----------------------|
| Google Fonts CSS | `rel="stylesheet"` verso `fonts.googleapis.com/css2?...&display=swap` — **senza** `media` / pattern async |
| preconnect | `fonts.googleapis.com`, `fonts.gstatic.com` (`crossorigin`) |
| Script entry | `type="module"` `src="/src/index.tsx"` |
| Nessun | `rel="preload"` immagine hero; nessun DNS-prefetch oltre i preconnect font |

#### `dist/index.html` (build)
| Risorsa | Attributi verificati |
|---------|----------------------|
| Stesso Google Fonts `rel="stylesheet"` | render-blocking |
| `assets/index-*.css` | `rel="stylesheet"` — render-blocking |
| `assets/index-*.js` | `type="module"` |
| `vendor-react-*.js`, `vendor-supabase-*.js` | `rel="modulepreload"` |

Fatto CSSOM: un `<link rel="stylesheet">` senza `media` che non matcha è render-blocking per la specifica HTML/CSS (risorsa stylesheet classica).

### Causa verificata
1. Stylesheet Google Fonts in `<head>` con `rel="stylesheet"`.
2. Stylesheet applicativo build `index-*.css` in `<head>` con `rel="stylesheet"`.
3. Lo script module entry non è classic parser-blocking come uno script sync senza `type="module"`, ma resta sulla critical path di bootstrap JS.

### File coinvolti
`index.html`, `dist/index.html`

### Componenti coinvolti
Nessun componente React: risorse HTML head.

### Impatto
Tecnico: ritardo first paint finché CSS fonts + CSS app non sono disponibili.

### Gravità
**Alta**

### Decisione PO

### Decisione tecnica

### Azioni

---

## 3. Largest Contentful Paint

### Stato
- **Analizzato**
- Path LCP “hero priority” progettato nel codice: **Causa verificata** (path morto / non montato)
- Elemento LCP effettivamente scelto dal browser nel report esterno: **CAUSA NON ANCORA DIMOSTRATA** (nessun LCP element dump / trace nel repo)

### Problema
LCP Home e breakdown discovery/request.

### Evidenze

#### Path hero “priority” (verificato morto → **dead wire eliminato**)
| Step | File | Fatto |
|------|------|-------|
| Stato | `useHeroLogic.ts` L89 | `heroImage` inizializzato a `''` *(evidenza pre-rimozione)* |
| Unica scrittura | `useHeroLogic.ts` L198 | `setHeroImage('')` nell’effect di load — **nessun** altro `setHeroImage` nel repo (`rg setHeroImage` → solo queste due occorrenze) *(evidenza pre-rimozione)* |
| Setting admin | `SETTINGS_KEYS.HERO_IMAGE` esiste in `settingsService` / AdminHeaderManager | **non** letto in `useHeroLogic` — **confermato post-rimozione** (Admin intatto) |
| Render | `HeroFilterModule.tsx` L528–537 | `{props.heroImage && ( <ImageWithFallback … priority={true} fetchPriority="high" /> )}` → con `heroImage === ''` il blocco **non monta** *(evidenza pre-rimozione)* |
| Image priority behavior | `ImageWithFallback.tsx` L99–121 | se montato con `priority`: `opacity-100`, `loading="eager"`, `fetchpriority` |
| Remediation codice | `useHeroLogic.ts`, `HeroSection.tsx`, `HeroFilterModule.tsx` | **2026-08-02 — dead wire eliminato**: state/prop/branch render rimossi; `SETTINGS_KEYS.HERO_IMAGE` / Admin / `details.heroImage` **non** toccati |

#### Altre immagini Home (verificate)
| Componente | priority | Note |
|------------|----------|------|
| `HeroAiModule` bg `getCachedSetting('ai_box')` | `priority={false}` | Condizionale a `bgImage` truthy |
| `HomeContent` → `CityCard` featured | `priority={false}` (L437) | |
| `CuratedGridSection` MiniCityCard | `priority={false}` | |

#### Discovery HTML
- Nessun `<link rel="preload">` per immagini in `index.html` / `dist/index.html`
- `#root` vuoto fino a JS React → qualsiasi LCP immagine dipende dal bootstrap JS

### Causa verificata
Il candidato LCP “hero filter” con `priority`/`fetchPriority=high` **non poteva** essere scoperto né richiesto: `heroImage` restava stringa vuota e l’`<img>` non veniva montato. **Ulteriormente verificata** con rimozione del dead wire (2026-08-02): il ramo non esiste più nel codice Home.

**CAUSA NON ANCORA DIMOSTRATA:** quale nodo DOM il browser ha marcato come LCP nel report Lighthouse esterno (testo brand, card, AI bg, altro).

### File coinvolti
`src/hooks/ui/useHeroLogic.ts`, `src/components/home/hero/HeroFilterModule.tsx`, `src/components/common/ImageWithFallback.tsx`, `src/components/home/hero/HeroAiModule.tsx`, `src/components/home/HomeContent.tsx`, `src/components/home/CuratedGridSection.tsx`, `src/services/settingsService.ts` (chiave), `index.html`

### Componenti coinvolti
`useHeroLogic`, `HeroFilterModule`, `ImageWithFallback`, `HeroAiModule`, `CityCard`, `CuratedGridSection`/`MiniCityCard`

### Impatto
Tecnico: il percorso LCP esplicitamente marcato `priority` sulla Home non partecipa alla LCP; LCP dipende da altri nodi post-JS.

### Gravità
**Alta**

### Decisione PO

### Decisione tecnica

### Azioni

---

## 4. Forced Reflow

### Stato
- **Causa verificata** per siti che forzano layout sul path Home (incl. commento esplicito “force reflow”)
- Correlazione 1:1 con il finding numerico DevTools “Forced reflow” del report esterno: **parzialmente dimostrata** (API e call site verificati; stack DevTools del report non presente nel repo)

### Problema
Letture geometriche che forzano layout / thrashing.

### Evidenze — path Home bootstrap (API eseguibili)

| File:riga | API | Contesto | Gate |
|-----------|-----|----------|------|
| `useFlipSwap.ts:49` | `getBoundingClientRect()` | `useLayoutEffect` | `enabled: isStackedLayout` (`useHeroStackedLayout` = `HERO_STACKED_QUERY`, sotto LG) |
| `useFlipSwap.ts:58` | `void el.offsetHeight` | `useLayoutEffect` | Commento nel codice: `// force reflow so the inverted state is committed` |
| `useFlipSwap.ts:92` | `getBoundingClientRect()` | snapshot layout | stesso hook |
| `HeroSection.tsx:149,158` | `getBoundingClientRect().top` | `useLayoutEffect` | `isStackedLayout` + expand filtri/AI |
| `AppShell.tsx:51` | `getBoundingClientRect().height` | callback `ResizeObserver` in `useEffect` | sempre su shell |
| `HomeContent.tsx:247` | `offsetWidth` | `useEffect` + `ResizeObserver` + invocazione immediata | sponsor container |
| `useMobileDetect.ts:8,13` | `window.innerWidth` | state init + `useEffect` | `UIProvider` / Home |
| `HeroCompactTypingField.tsx:46` | `scrollWidth` / `clientWidth` / write `scrollLeft` | `useLayoutEffect` | via hero compact |

`useHeroStackedLayout` (`src/hooks/ui/useHeroStackedLayout.ts`): `matchMedia(HERO_STACKED_QUERY)` — true sotto breakpoint LG → su viewport mobile/tablet Home, FLIP + scroll-stabilize sono attivi.

### Evidenze — esistono ma non sul cold Home diary-closed
Catalogo aggiuntivo (admin, modali, suitcase, diary overlay gated): vedi ricerca repo su `getBoundingClientRect` / `offset*` / `visualViewport` in `src/` (es. `useMobileDiaryOverlayGeometry.ts`, `DiaryTimeline.tsx`, admin canvas). Non ripetuti qui come causa cold `/`.

### Causa verificata
Sul path Home stacked (viewport &lt; LG):
1. `useFlipSwap` esegue **esplicitamente** un forced reflow (`void el.offsetHeight`) durante l’animazione FLIP.
2. `HeroSection` legge `getBoundingClientRect` in `useLayoutEffect` per compensare lo scroll.
3. `AppShell` e `HomeContent` leggono geometria via `ResizeObserver` al mount.

### File coinvolti
`src/hooks/ui/useFlipSwap.ts`, `src/components/home/HeroSection.tsx`, `src/hooks/ui/useHeroStackedLayout.ts`, `src/constants/breakpoints.ts`, `src/components/layout/AppShell.tsx`, `src/components/home/HomeContent.tsx`, `src/hooks/ui/useMobileDetect.ts`, `src/components/home/hero/components/HeroCompactTypingField.tsx`

### Componenti coinvolti
`HeroSection`, `useFlipSwap`, `AppShell`, `HomeContent`, `HeroCompactTypingField`, `UIProvider`/`useMobileDetect`

### Impatto
Tecnico: layout sincrono nel critical path Home stacked; contributo a Long Tasks / jank se interleaved con scritture DOM.

### Gravità
**Alta** (Home mobile/tablet stacked); **Media** se audit solo desktop ≥ LG (FLIP disabilitato)

### Decisione PO

### Decisione tecnica

### Azioni

---

## 5. Reduce JavaScript Execution

### Stato
- **Analizzato**
- **Causa verificata** per cosa viene valutato all’entry
- Costo CPU ms per modulo: **CAUSA NON ANCORA DIMOSTRATA** (serve Bottom-Up / Main trace)

### Problema
Ridurre l’esecuzione JS al bootstrap.

### Evidenze
1. Entry build valuta `index-NSYKCl42.js` (426 157 B) + modulepreload `vendor-react` (257 162 B) + `vendor-supabase` (204 099 B).
2. `supabaseClient.ts` crea il client a module scope → import Supabase sul grafo entry è lavoro reale, non solo download.
3. `HomeContent` è import statico in `AppRouter.tsx` → il grafo Home è nel chunk iniziale (non in un async chunk route).
4. Route pesanti (`TravelDiary`, `UserDashboard`, `CityDetailContent`, admin) sono `React.lazy` — non valutati finché non importati.
5. `vite.config.ts` `manualChunks` separa `vendor-react-pdf` (1 577 436 B), `vendor-tiptap` (467 830 B), `vendor-docx` (367 773 B), `vendor-qrcode` (25 783 B) — **non** presenti come `modulepreload` in `dist/index.html`.

### Causa verificata
L’esecuzione iniziale obbligatoria include il bundle `index` + React/router + Supabase client, più il grafo eager Home/shell. I vendor tip-tap/pdf/docx **non** sono nell’HTML entry preload.

### File coinvolti
`dist/index.html`, `dist/assets/index-*.js`, `dist/assets/vendor-react-*.js`, `dist/assets/vendor-supabase-*.js`, `src/index.tsx`, `src/components/layout/AppRouter.tsx`, `src/services/supabaseClient.ts`, `vite.config.ts`

### Componenti coinvolti
Stesso albero della sezione 1.

### Impatto
Tecnico: tempo di parse/compile/eval + esecuzione montaggio React su main thread.

### Gravità
**Alta**

### Decisione PO

### Decisione tecnica

### Azioni

---

## 6. Reduce Unused JavaScript

### Stato
- **Analizzato** (asset e strategia chunk)
- Percentuali / byte “unused” del finding Lighthouse: **CAUSA NON ANCORA DIMOSTRATA** (nessun coverage report nel repo)

### Problema
JS scaricato ma non usato nel bootstrap iniziale.

### Evidenze
1. Chunk vendor separati esistono su disco (`vendor-tiptap`, `vendor-react-pdf`, `vendor-docx`, `vendor-qrcode`) con dimensioni sopra.
2. `dist/index.html` **non** module-preload di tip-tap/pdf/docx/qrcode — quindi non sono scaricati dall’HTML entry per quel meccanismo.
3. `vendor-supabase` è module-preloaded ed è usato (client a module scope) → non è “scaricato e mai importato”.
4. All’interno di `index-*.js` (426 KB) può esistere codice non eseguito sul cold path; **senza Coverage/Lighthouse detail** non è dimostrabile quanto.

### Causa verificata
- Separazione chunk vendor tip-tap/pdf/docx/qrcode: verificata in `vite.config.ts` + filesystem `dist/assets`.
- Quali byte Lighthouse ha etichettato “Unused JavaScript” nel report esterno: **CAUSA NON ANCORA DIMOSTRATA**.

### File coinvolti
`vite.config.ts`, `dist/index.html`, `dist/assets/vendor-*`, `dist/assets/index-*.js`

### Componenti coinvolti
N/A a livello componente; infrastruttura build.

### Impatto
Tecnico: potenziale download di codice non eseguito se qualche import statico tira un vendor pesante nel grafo entry; non dimostrato per tip-tap/pdf sull’HTML entry corrente.

### Gravità
**Media** (fino a prova coverage); rischio **Alto** se un import entry tirasse `vendor-react-pdf` (~1.5 MB)

### Decisione PO

### Decisione tecnica

### Azioni

---

## 7. Accessibility — Buttons do not have accessible name

### Stato
- **Causa verificata** (prima stesura) per i pulsanti elencati sotto
- **Risolto** (2026-08-02) — vedi §14.1 remediation su `HeroAiModule`
- Elenco “tutti i pulsanti dell’intera app”: audit home/hero/shell completo sotto; resto app non esaustivo file-per-file → eventuali altri restano **da analizzare** fuori Home

### Problema
Pulsanti senza accessible name (icon-only senza `aria-label` / testo / `aria-labelledby`).

### Evidenze — Home / Hero (verificati)

| File:riga | Elemento | Contenuto | `aria-label` / testo / `title` |
|-----------|----------|-----------|--------------------------------|
| `HeroAiModule.tsx:222–229` | `<button type="button">` | solo `<Send />` | nessuno |
| `HeroAiModule.tsx:318–320` | `<button>` | solo `<Send />` | nessuno |

Controlli correlati Home/shell verificati **con** nome (non falliscono il criterio):
- Header icon buttons: `aria-label` presenti (`Header.tsx`)
- MobileNavBar FAB: `aria-label`
- HomeContent chevron / add itinerario: `aria-label`
- `ExploreButton`: testo `ESPLORA`
- `CloseButton`: `aria-label="Chiudi"`

### Causa verificata
I due pulsanti Submit AI in `HeroAiModule` (variante compact e variante expanded) sono icon-only senza nome accessibile.

### File coinvolti
`src/components/home/hero/HeroAiModule.tsx`

### Componenti coinvolti
`HeroAiModule`

### Impatto
Tecnico / a11y: fallimento audit `button-name`; screen reader senza nome azione “invia”.

### Gravità
**Media**

### Decisione PO

### Decisione tecnica

### Azioni

---

## 8. ARIA — Elements use prohibited ARIA attributes

### Stato
- **Causa verificata** (prima stesura) per gli elementi sotto
- **Risolto** (2026-08-02) per i casi dimostrati Home + `StarRating` — vedi §14.2

### Problema
Attributi ARIA non consentiti sul ruolo dell’elemento.

### Evidenze

#### Caso A — `aria-label` su `div` generico (Home)
| File:riga | Markup | Ruolo implicito |
|-----------|--------|-----------------|
| `HomeContent.tsx:165–175` | `<div draggable … aria-label="Trascina nel Diario">` | `generic` (nessun `role`) |
| `CityCard.tsx:41` | `<div … aria-label="DNA della città">` | `generic` — `CityDnaIcons`, usato da `CityCard` su Home |

#### Riferimento WAI-ARIA (verificato)
- WAI-ARIA: ruolo `generic` — naming **prohibited**; autori non devono usare `aria-label` / `aria-labelledby` ([MDN `generic` role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/generic_role); WAI-ARIA 1.2/1.3 “Roles which cannot be named”).
- Regola axe/Lighthouse correlata: `aria-prohibited-attr`.

#### Caso B — Header `aria-haspopup="true"`
| File:riga | Elemento | Attributi |
|-----------|----------|-----------|
| `Header.tsx:272–277` | `<button>` | `aria-haspopup="true"`, `aria-expanded`, `aria-label` |

Fatto: `aria-haspopup="true"` su `button` è un valore consentito dalla specifica ARIA (sinonimo legacy di menu). **Non** è dimostrabile da sola come violazione “prohibited attribute” senza il dump axe del report che punti a questo nodo.

#### Controlli con `role` valido + `aria-label` (non prohibited)
- `HeroAiModule.tsx:177–180` — `role="region"` + `aria-label`
- `HeroCompactTypingField.tsx:91–94` — `role="region"` + `aria-label`

### Causa verificata
`aria-label` applicato a `div` senza ruolo che supporti naming (`HomeContent` drag handle; `CityCard` DNA icons) viola il vincolo WAI-ARIA sul ruolo `generic`.

### File coinvolti
`src/components/home/HomeContent.tsx`, `src/components/city/CityCard.tsx`  
(riferimento normativo esterno: WAI-ARIA / MDN `generic`)

### Componenti coinvolti
`HomeContent` (drag handle card), `CityDnaIcons` / `CityCard`

### Impatto
Tecnico / a11y: finding Lighthouse/axe `aria-prohibited-attr`; naming inconsistente per AT.

### Gravità
**Media**

### Decisione PO

### Decisione tecnica

### Azioni

---

## 9. robots.txt interpretato come HTML

### Stato
- **Causa verificata** (prima stesura) per ambienti SPA Vite con file assente
- Comportamento Express production-only: verificato distinto (non HTML)
- **Risolto** (2026-08-02) con creazione `public/robots.txt` — vedi §14.3; conclusione “file assente” marcata **SUPERATA** post-remediation

### Problema
La richiesta `GET /robots.txt` riceve HTML invece di `text/plain` robots.

### Evidenze

#### Filesystem
| Path | Esito verifica 2026-08-02 |
|------|---------------------------|
| `public/robots.txt` | **Assente** (`public/` contiene solo `assets/`, `index.html`) |
| `dist/robots.txt` | **Assente** (`dist/` contiene `assets/`, `index.html`) |
| Match `robots*` nel repo | **Nessuno** |

#### Express — `server/index.ts`
| Ordine | Middleware | Comportamento su `/robots.txt` |
|--------|------------|--------------------------------|
| 1–5 | cors, OPTIONS, json, favicon, `/api/*` | Nessun handler `robots` |
| Dev (`NODE_ENV !== "production"`) | `createViteServer({ appType: "spa" })` + `vite.middlewares` | SPA Vite: path senza file → serve **HTML** `index.html` |
| Prod | `express.static("dist")` solo | File assente → **404** (nessun `sendFile(index.html)` catch-all in questo file) |

#### Altri hosting nel repo
| Config | Fatto |
|--------|-------|
| `firebase.json` | `"public": "public"`, **nessun** `rewrites`; nessun `robots.txt` in `public/` |
| `vite.config.ts` | nessun override `publicDir`; default `public` |

#### Favicon contrast (verificato)
Esiste route dedicata `GET /favicon.ico` (`server/routes/favicon.routes.ts`); **non** esiste equivalente per `robots.txt`.

### Causa verificata
1. **Non esiste** un `robots.txt` statico in `public/` né in `dist/`.
2. In **sviluppo** (Express + Vite `appType: "spa"`), Vite SPA fallback restituisce **`index.html` (HTML)** per `/robots.txt`.
3. Lo stesso meccanismo SPA di Vite vale per `vite` / `vite preview` quando il file manca.
4. In **produzione Express** come scritto in `server/index.ts`, `/robots.txt` assente produce **404**, non HTML — quindi se un audit production ha visto HTML, **quella** risposta HTML **non** è spiegata da `express.static("dist")` da solo; serve l’URL/hosting reale dell’audit (non presente nel repo) → per quell’hosting specifico: **CAUSA NON ANCORA DIMOSTRATA** oltre all’assenza del file.

### File coinvolti
`server/index.ts`, `public/` (assenza), `dist/` (assenza), `firebase.json`, `vite.config.ts`, `server/routes/favicon.routes.ts` (solo contrasto: favicon ha handler, robots no)

### Componenti coinvolti
Nessun componente React.

### Impatto
Tecnico / SEO: crawler o Lighthouse SEO che richiedono `/robots.txt` ricevono documento HTML (in ambienti SPA Vite) o 404 (Express prod static).

### Gravità
**Media** (SEO); **Bassa** per runtime UX utente autenticato

### Decisione PO

### Decisione tecnica

### Azioni

---

## Registro stato riepilogativo

| # | Problema | Stato |
|---|----------|-------|
| 1 | Main thread / TBT / Long Tasks | Analizzato + causa strutturale verificata; ms Lighthouse non attribuiti → vedi §10 classificazione |
| 2 | Render-blocking | **Causa verificata** |
| 3 | LCP | Path Home filter `heroImage` **dead wire eliminato** (2026-08-02); Asset Globali `hero_image` **vivo in Admin** → vedi §12 |
| 4 | Forced reflow | **Causa verificata** + classificazione necessità §11 |
| 5 | JS execution | **Causa verificata** (entry graph); CPU ms non misurati |
| 6 | Unused JS | Chunk strategy verificata; unused % Lighthouse **non dimostrata** |
| 7 | Button accessible name | **Causa verificata** → **Risolto** (remediation 2026-08-02) §14 |
| 8 | ARIA prohibited | **Causa verificata** → **Risolto** per i casi Home/StarRating dimostrati §14 |
| 9 | robots.txt HTML | **Causa verificata** → **Risolto** con `public/robots.txt` §14 |
| 10 | Classificazione bootstrap | **Analizzato** §10 |
| 11 | Reflow necessità | **Analizzato** §11 |
| 12 | heroImage eliminabilità | **Dead wire Home eliminato** §12 — setting Admin / city hero **intatti** |
| 13 | Performance screenshots | **CAUSA NON ANCORA DIMOSTRATA** §13 — artefatto non accessibile |

---

## Allegato — lacune di prova (esplicite)

Per chiudere le voci ancora «NON ANCORA DIMOSTRATA» servono artefatti esterni al codice, non presenti / non accessibili:

1. Export Lighthouse JSON / HAR dell’URL auditato  
2. Performance panel: **trace completo** (`.json` / `.gz`) con Long Task stack + Forced reflow stack — gli screenshot da soli non bastano (§13)  
3. Coverage: unused bytes per file sull’URL Home  
4. LCP element screenshot / `largest-contentful-paint-element` detail  
5. Conferma environment: URL esatto (dev Vite vs Express prod vs altro CDN)  
6. Screenshot Performance Panel **accessibili all’agente** (file immagine nel workspace o allegato tool)

---

## 10. Classificazione bootstrap (secondo audit)

### Stato
- **Analizzato** — classificazione timing su path cold Home `/` (`viewMode === 'app'`)
- Ulteriormente verificato rispetto a §1: `AppRouter` monta `HomeContent` senza attendere `isLoadingManifest` / `loadConfig` (gate solo su `citySlug` unresolved)

### Evidenze

#### Ancoraggi di non-blocco first paint (verificati)
| Claim | Prova |
|-------|--------|
| Config non gate shell | `AppCoordinator.tsx` commenti S.2; `ConfigContext` `isShellReady=true` sync; shell montata senza await `loadConfig` |
| Manifest non gate Home `/` | `useAppInitialization.ts` S.4; `AppRouter.tsx` ramo Home senza wait su `isLoadingManifest` |

#### Legenda classificazione
| Etichetta | Significato (solo se dimostrato dal codice) |
|-----------|---------------------------------------------|
| `INDISPENSABILE_FIRST_PAINT` | Senza questo provider/valore sync, `useX()` throw o layout first paint impossibile |
| `INDISPENSABILE_PRE_INTERACTION` | Necessario prima di click ma non per paint |
| `RIMANDABILE_IDLE` | Nessun await gate su Home first paint; risultato consumato in modo progressivo |
| `POST_INTERACTION` | Parte solo dopo azione utente dimostrata |
| `RETAGGIO_STORICO` | Scrive stato mai letto sul path Home, o assegnazione morta |
| `NON_CLASSIFICABILE` | Prove insufficienti |

#### Tabella classificazione (estratto verificato)

| Unità | File | Perché parte | Classificazione |
|-------|------|--------------|-----------------|
| `UserProvider` + guest sync | `UserContext.tsx` | Radice `AppProviders` | `INDISPENSABILE_FIRST_PAINT` |
| `PlatformControlProvider` presenza | `PlatformControlContext.tsx` | Flags Header/MainLayout | `INDISPENSABILE_FIRST_PAINT` (presenza) |
| `refreshFlags` / `ensureSystemMessagesLoaded` | stesso | Mount effects | `RIMANDABILE_IDLE` (fallback flags già in cache) |
| `BusinessProvider` su guest Home | `BusinessContext.tsx` | Ordine AppProviders | `RETAGGIO_STORICO` su Home — **SUPERATA** WF-PERF-02 STEP 1: non più in `AppProviders`; mount su `UserDashboard` |
| `ConfigProvider` presenza | `ConfigContext.tsx` | `useConfig` | `INDISPENSABILE_FIRST_PAINT` |
| `loadConfig` await | stesso | Mount | `RIMANDABILE_IDLE` |
| `isShellReady` export | stesso | Sempre `true` | `RETAGGIO_STORICO` — non letto da AppCoordinator/MainLayout |
| `UIProvider` / `useMobileDetect` sync | `useAppUI` / `useMobileDetect` | Layout classes | `INDISPENSABILE_FIRST_PAINT` |
| resize listener mobile | `useMobileDetect` | Mount | `RIMANDABILE_IDLE` |
| `AiPlannerProvider` | `AiPlannerContext.tsx` | AppProviders | `POST_INTERACTION` (sessione AI) |
| `ModalProvider` | `ModalContext.tsx` | Header/gate | `INDISPENSABILE_FIRST_PAINT` |
| `GpsProvider` presenza | `GpsContext.tsx` | Header/Home | `INDISPENSABILE_FIRST_PAINT` |
| GPS acquire | `useGpsManager` | Solo toggle/confirm | `POST_INTERACTION` |
| `NavigationProvider` filtri sync | `NavigationContext.tsx` | Home filters | `INDISPENSABILE_FIRST_PAINT` |
| Deep-link effect su `/` senza params | stesso | Mount | `RIMANDABILE_IDLE` (no-op) |
| `InteractionProvider` load storage | `InteractionContext.tsx` | Mount | `RIMANDABILE_IDLE` |
| `ItineraryProvider` + empty itinerary | `ItineraryContext.tsx` | Home cards `useItinerary` | `INDISPENSABILE_FIRST_PAINT` |
| `loadProjects` → `savedProjects` | stesso | Mount | `RETAGGIO_STORICO` su Home — `savedProjects` non letto |
| `DiaryInteractionProvider` | `DiaryInteractionContext.tsx` | MainLayout drop | `INDISPENSABILE_FIRST_PAINT` |
| `FocusModeProvider` | `FocusModeContext.tsx` | AppCoordinator | `INDISPENSABILE_FIRST_PAINT` |
| Auth `getSession` / onAuthStateChange | `useAppInitialization.ts` | UserProvider | `RIMANDABILE_IDLE` (parte da guest sync) |
| `getFullManifestAsync` | stesso | viewMode app | `RIMANDABILE_IDLE` |
| `showLevelUp` write | stesso | xp change | `RETAGGIO_STORICO` — zero consumer di `showLevelUp` |
| Onboarding `setTimeout(800)` | stesso | Mount check | `RIMANDABILE_IDLE` |
| `supabase.createClient` module scope | `supabaseClient.ts` | Import chain | `INDISPENSABILE_FIRST_PAINT` (throw se env mancante) |
| AppShell `--header-height` RO | `AppShell.tsx` | Mount | `RIMANDABILE_IDLE` — CSS default `--header-height: 64px` già in `index.css` |
| Home sponsors fetch | `HomeContent.tsx` | Mount | `RIMANDABILE_IDLE` |
| Sponsor `setInterval(8000)` | stesso | dopo ≥2 sponsor | `RIMANDABILE_IDLE` |
| Seasonal ranking | stesso | `selectedSeason` | `POST_INTERACTION` (`selectedSeason` iniziale `''`) |
| `useHeroLogic` loadSettings | `useHeroLogic.ts` | Hero mount | `RIMANDABILE_IDLE` |
| `setHeroImage('')` | stesso | loadSettings | `RETAGGIO_STORICO` (vedi §12) — **SUPERATA**: dead wire eliminato 2026-08-02 |
| Header unread `setInterval(60000)` | `Header.tsx` | Header mount | `RIMANDABILE_IDLE` |
| `useReferralTracking` | hook | AppCoordinator | `RIMANDABILE_IDLE` senza `?ref=` |
| `useAppExitProtection` | hook | AppCoordinator | `RIMANDABILE_IDLE` finché unload |
| UsernameRequiredGate guest | `UsernameRequiredGate.tsx` | AppCoordinator | `RIMANDABILE_IDLE` (no-op guest) |

### Causa verificata
Il bootstrap Home monta un albero provider ampio per dipendenze di contesto (`useX` throw), mentre la maggior parte del lavoro di rete/timer è `RIMANDABILE_IDLE` rispetto al first paint. Esistono unità `RETAGGIO_STORICO` sul path Home (`BusinessProvider` work, `savedProjects`, `showLevelUp`, `isShellReady` inutilizzato). La voce `setHeroImage('')` è **SUPERATA** (dead wire eliminato 2026-08-02, §12).

### Cause escluse
- Che `HomeContent` attenda `loadConfig` o `getFullManifestAsync` prima del mount — **escluso** dal codice AppRouter/AppCoordinator.
- Che GPS parta automaticamente al mount — **escluso** (`requestPosition` solo su azione).

### Cause NON ANCORA DIMOSTRATE
- Impatto ms di ogni unità sul TBT: manca **Performance Trace completo** (`.json`).
- Indispensabilità “di prodotto” di montare `BusinessProvider`/`AiPlannerProvider` a cold start: il codice prova solo il consumo corrente, non un vincolo di architettura documentato SoT.

### Impatto architetturale
Base certa per decisioni future di deferral: ciò che è `RIMANDABILE_IDLE` / `RETAGGIO_STORICO` può essere candidato a spostamento; ciò che è `INDISPENSABILE_FIRST_PAINT` no, senza redesign dei consumer.

### Priorità
**Critica** (come base decisionale); nessuna ottimizzazione autorizzata da questa sola sezione.

### Decisione PO

### Decisione tecnica

### Azioni future

---

## 11. Forced reflow — necessità architetturale (secondo audit)

### Stato
- **Analizzato** — ulteriormente verificato rispetto a §4
- Nessun sito Home etichettato `RETAGGIO` (morto): tutti i siti attivi risolvono un comportamento ancora nel codice

### Evidenze

| # | Sito | API | Perché esiste (dal codice) | Necessità | Cold Home esegue? |
|---|------|-----|----------------------------|-----------|-------------------|
| 1 | `useFlipSwap.ts` | GBCR + `void offsetHeight` (“force reflow”) | FLIP invert/play su swap ordine moduli hero | `NECESSARIO_PER_COMPORTAMENTO_CORRENTE` | Snapshot se &lt; LG; force reflow solo dopo reorder |
| 2 | `HeroSection.tsx` scroll stabilize | GBCR `.top` + `scrollTo` | Mantiene viewport fisso su expand/collapse stacked | `NECESSARIO_PER_COMPORTAMENTO_CORRENTE` | Solo &lt; LG |
| 3 | `AppShell.tsx` | RO → GBCR height → `--header-height` | Allinea overlay a header reale | `NECESSARIO_PER_COMPORTAMENTO_CORRENTE` | Sempre |
| 4 | `HomeContent.tsx` sponsor | `offsetWidth` + RO | Colonne partner 1–4 da larghezza container | `NECESSARIO_PER_COMPORTAMENTO_CORRENTE` | Sempre |
| 5 | `HeroCompactTypingField` | scrollWidth/clientWidth | Scroll testo typing a destra | `NECESSARIO_PER_COMPORTAMENTO_CORRENTE` | Solo &lt; MD + compact twin |
| 6 | `useMobileDetect` | `innerWidth` | Boolean &lt; LG per UI | `NECESSARIO` + **duplicazione di soglia** con stacked/belowLg | Sempre |
| 7 | `useHeroStackedLayout` | `matchMedia(HERO_STACKED_QUERY)` | Gate stacked hero | `NECESSARIO` + **duplicato di** `useBelowLg.ts` (stesso query) | Sempre (boolean) |
| 8 | Sidebar `syncCompanionTop` | GBCR | Allinea portal companion workspace | `GATEATO_NON_COLD_HOME` | No su Home idle |
| 9 | `DiaryTimeline` measure | `offsetWidth` | Truncation chip città | Condizionale: solo se TravelDiary lazy + `days.length > 0` | Non su itinerary vuoto |

### Causa verificata
Il forced reflow esplicito (`offsetHeight`) esiste solo in `useFlipSwap` per commit dell’invert FLIP. Gli altri sono letture geometriche per CSS var, colonne sponsor, scroll typing, o stabilize scroll — ancora cablate al comportamento corrente.

### Cause escluse
- Che `useFlipSwap` / scroll-stabilize siano dead code — **escluso** su viewport &lt; LG.
- Che Sidebar `syncCompanionTop` giri sul cold Home — **escluso** (`isWorkspace` false).

### Cause NON ANCORA DIMOSTRATE
- Quale call site appare nello stack “Forced reflow” del Performance Panel del PO: manca **trace completo** o screenshot **accessibile** con stack espanso (§13).

### Impatto architetturale
Qualsiasi rimozione di FLIP/scroll-stabilize cambia UX hero stacked; non è “cleanup gratis”. La duplicazione di breakpoint LG (`useMobileDetect` vs `matchMedia` stacked) è evidenza strutturale, non ancora una decisione di unificazione.

### Priorità
**Alta** (Home mobile/tablet); **Media** desktop ≥ LG per FLIP

### Decisione PO

### Decisione tecnica

### Azioni future

---

## 12. heroImage — audit di mortalità (secondo audit)

### Stato
- Path consumer Home filter: **dead wire eliminato** (2026-08-02)
- Funzionalità globale `SETTINGS_KEYS.HERO_IMAGE` / Asset Globali: **viva** (intatta)
- Campo città `details.heroImage`: **vivo** (intatto)
- Dichiarazione “interamente eliminabile”: **NON applicabile** all’intera funzionalità — **confermata**

### Evidenze

#### A) Path Home filter (`useHeroLogic` → `HeroFilterModule`) — RUNTIME MORTO → **DEAD WIRE ELIMINATO**
| Operazione | File | Fatto |
|------------|------|-------|
| Init | `useHeroLogic.ts:89` | `useState('')` *(pre-rimozione)* |
| Scritture | `rg setHeroImage` | **Solo** L89 init + L198 `setHeroImage('')` — **nessuna** lettura di `SETTINGS_KEYS.HERO_IMAGE` *(pre-rimozione)* |
| Export | `useHeroLogic.ts:454` | espone `heroImage` *(pre-rimozione)* |
| Pass-through | `HeroSection.tsx:46,171` | passa a `HeroFilterModule` *(pre-rimozione)* |
| Render | `HeroFilterModule.tsx:528–537` | monta `<img priority>` solo se truthy → **mai** *(pre-rimozione)* |
| Post-rimozione | `rg heroImage` in `useHeroLogic` / `HeroSection` / `HeroFilterModule` | **0** occorrenze; import `ImageWithFallback` rimosso da `HeroFilterModule` perché usato solo dal branch morto |

**Certezza:** alta (diff codice + `rg` post-modifica).

#### B) Asset Globali Admin — VIVO (ulteriore verifica post-rimozione)
| Operazione | File | Fatto |
|------------|------|-------|
| Chiave | `settingsService.ts` `HERO_IMAGE: 'hero_image'` | definita — **non toccata** |
| Lettura Admin | `AdminHeaderManager.tsx:84–94` | `configs[SETTINGS_KEYS.HERO_IMAGE]` → preview UI — **non toccata** |
| Scrittura Admin | `AdminHeaderManager.tsx:251–398` | salvataggio setting — **non toccata** |
| Placeholder origin | `platformPlaceholderOrigin.ts` | include `'hero_image'` — **non toccato** |
| SoT doc | `AI_CONTEXT/16_CITY_MEDIA_MANAGEMENT.md` | elenca `hero_image` tra Asset Globali attivi |

#### C) Hero città (DTO diverso) — VIVO (ulteriore verifica post-rimozione)
| Operazione | File | Fatto |
|------------|------|-------|
| DB/DTO | `cityReadService.ts`, `City.ts` `details.heroImage` | popolato da `cities.hero_image` — **non toccato** |
| UI | `CityHeader.tsx`, admin city editor, export/PDF | consumano hero **città** — **non toccati** |

### Causa verificata
1. Il wire consumer Home che doveva mostrare l’Asset Globale `hero_image` sullo sfondo filtri **non leggeva mai** la setting: state locale sempre `''` → path LCP priority Home filter morto.
2. La setting Admin `hero_image` **non** è morta: Admin la legge/scrive.
3. `details.heroImage` città è un altro campo, vivo.
4. **2026-08-02:** dead wire Home rimosso da `useHeroLogic` / `HeroSection` / `HeroFilterModule` senza alterare Admin né city hero.

### Cause escluse
- Che `SETTINGS_KEYS.HERO_IMAGE` sia codice morto eliminabile senza impatto Admin — **escluso**.
- Che `CityHeader` / city editor dipendano da `useHeroLogic.heroImage` — **escluso** (campi diversi).
- Che la rimozione del wire Home abbia rimosso Asset Globali — **escluso** (file Admin/settings non modificati).

### Cause NON ANCORA DIMOSTRATE
- Intento di prodotto: se Asset Globale `hero_image` doveva alimentare Home filter in futuro — **non** dimostrato da codice runtime; SoT AI_CONTEXT elenca l’asset come attivo Admin senza citare il wire Home filter.

### Impatto architetturale
Dead wire consumer Home **rimosso**. Asset Globali Admin e hero città restano SoT vigente. Un eventuale ripristino del wire Home richiederebbe nuova decisione PO + implementazione esplicita di lettura `SETTINGS_KEYS.HERO_IMAGE`.

### Priorità
**Alta** (LCP / coerenza Asset Globali) — azione sul dead wire Home: **eseguita**

### Decisione PO
Eliminare esclusivamente il dead wire Home (richiesta esplicita 2026-08-02).

### Decisione tecnica
Rimossi state `heroImage`, prop pass-through e branch render condizionale; Admin/`SETTINGS_KEYS.HERO_IMAGE`/`details.heroImage` invariati.

### Azioni future
- Nessuna sul wire Home (eliminato).
- Eventuale reconnect Home ↔ Asset Globale: solo su decisione PO esplicita.

---

## 13. Performance Trace — screenshot dichiarati dal PO

### Stato
- **CAUSA NON ANCORA DIMOSTRATA** per qualunque attributo di Long Task / Forced reflow stack / Bottom-Up dai “screenshot allegati”

### Evidenze
| Verifica | Esito |
|----------|--------|
| File immagine Performance nel workspace TouringDiary | **0** file `.png/.jpg/.webp` trovati |
| Allegato immagine accessibile al tool Read in questa sessione | **Assente** |
| Trace `.json` / `.gz` Performance | **Assente** nel repo |

### Cosa gli screenshot Performance **possono** dimostrare (quando accessibili)
- Timeline: presenza di Long Tasks (barre rosse) e fascia temporale
- Main thread: categorie aggregate (Scripting / Rendering / Painting) a livello visuale
- Network waterfalls se tab Network inclusa nello screenshot
- FPS / CPU meter se visibili

### Cosa gli screenshot Performance **NON** possono dimostrare (serve trace completo)
- Stack call esatto del Long Task (funzione → file → riga)
- Stack del “Forced reflow” warning (call site preciso)
- Bottom-Up / Call Tree con Self Time per modulo
- Correlazione certa task ↔ `useFlipSwap` / `loadConfig` / parse `index-*.js`
- Coverage unused bytes

### Causa verificata
Nessuna. Artefatto non accessibile all’agente.

### Cause escluse
Nessuna esclusione basata su screenshot (non letti).

### Cause NON ANCORA DIMOSTRATE
Tutto il contenuto analitico derivabile solo dal Performance Panel del PO — **manca file immagine accessibile e/o export trace `.json`**.

### Impatto architetturale
Blocca l’attribuzione quantitativa TBT ↔ call site.

### Priorità
**Critica** per chiudere §1/§4/§5 quantitativi

### Decisione PO

### Decisione tecnica

### Azioni future
Fornire: (1) export Performance Trace completo, e/o (2) screenshot salvati nel workspace con stack espansi.

---

## 14. Remediation anomalie già dimostrate (2026-08-02)

> Eccezione esplicita alla sola-analisi: richiesta PO di correggere subito a11y / ARIA / robots. Nessuna ottimizzazione bootstrap.

### Stato
- **Risolto** (codice applicato in repo)

### Evidenze — modifiche verificate

#### 14.1 Accessibility — Send buttons
| File | Modifica |
|------|----------|
| `HeroAiModule.tsx` (compact + expanded) | `aria-label="Invia domanda al consulente AI"`; `type="button"` sul secondo; `aria-hidden` su icona `Send` |

#### 14.2 ARIA — naming su ruoli ammessi
| File | Prima | Dopo | Base WAI-ARIA |
|------|-------|------|---------------|
| `HomeContent.tsx` drag handle | `<div aria-label>` (generic) | `<button type="button" aria-label>` | `button` ammette accessible name |
| `CityCard.tsx` `CityDnaIcons` | `<div aria-label>` (generic) | `<div role="img" aria-label>` + `aria-hidden` su glyph | `img` ammette accessible name |
| `StarRating.tsx` | `<div aria-label>` (generic) | `<div role="img" aria-label>` | idem (stesso anti-pattern dimostrato in repo) |

#### 14.3 robots.txt
| File | Fatto |
|------|-------|
| `public/robots.txt` | **Creato** — `Allow: /`; `Disallow: /api/`, `/admin`, `/admin/`; nota Sitemap assente (nessun `sitemap.xml` nel repo) |
| Serving | Vite copia `public/` in `dist/` al build; Express prod `express.static("dist")` servirà il file se presente in dist dopo build |

### Causa verificata (pre-fix, da §7–§9)
Invariata: i problemi esistevano; la remediation rimuove le cause dimostrate sul codice corrente.

### SUPERATA (parziale) — conclusione §9 “file assente”
| Precedente | Aggiornamento |
|------------|---------------|
| §9: `public/robots.txt` assente | **SUPERATA** dopo remediation: file creato. La causa storica (assenza + SPA Vite → HTML) resta vera per audit **pre**-fix. |

### Cause NON ANCORA DIMOSTRATE
- Che Lighthouse SEO sull’URL production veda già `text/plain` robots: serve **rebuild + deploy** e re-fetch HTTP (artefatto esterno).

### Impatto architetturale
A11y/ARIA/robots allineati alle evidenze §7–§9; nessun cambio bootstrap.

### Priorità
Eseguite come da richiesta PO.

### Decisione PO

### Decisione tecnica

### Azioni future
- Re-run Lighthouse Accessibility / SEO post-deploy
- Decisione PO su wire Asset Globale `hero_image` → Home filter (§12)
- Fornire Performance Trace completo (§13)

---

## Decisioni PO (in corso)

| Campo | Valore |
|-------|--------|
| **Ruolo** | Source of Truth delle decisioni del Product Owner emerse durante gli audit forensi |
| **Politica** | Ogni decisione PO futura su performance / bootstrap / a11y **deve** essere riportata anche in questa sezione, oltre che (se pertinente) nei campi «Decisione PO» delle sezioni tecniche sopra |
| **Vincolo** | Questa sezione **non** autorizza implementazioni da sola: le azioni di codice restano subordinate a richiesta esplicita successiva |

### Evidenze (meta)
Documento aggiornato 2026-08-02 su richiesta PO; le sottosezioni di audit sotto «Decisioni ancora aperte» citano file/linee del repository corrente.

---

### Decisioni già approvate

#### BOOTSTRAP

| Voce | Decisione PO | Collegamento classificazione §10 | Note |
|------|--------------|----------------------------------|------|
| Provider `INDISPENSABILE_FIRST_PAINT` | **Mantenerli nel bootstrap** | Righe tabella §10 con etichetta `INDISPENSABILE_FIRST_PAINT` | Nessuna rimozione/spostamento autorizzato |
| Componenti `POST_INTERACTION` | **Nessuna modifica** | Es. `AiPlannerProvider` (sessione AI), GPS acquire, seasonal ranking | Lasciare timing attuale |
| Sponsor Home | **Rimandare dopo first paint (idle)** se tecnicamente possibile **senza** alterare UX/comportamento | `HomeContent` fetch sponsor + `setInterval` → `RIMANDABILE_IDLE` | Solo decisione di intent; implementazione **non** avviata qui |
| Config dinamica (`loadConfig`) | **Candidata** al caricamento idle | `ConfigProvider` presenza = first paint; `loadConfig` await = `RIMANDABILE_IDLE` | Intent; no implementazione qui |
| Platform Messages (`ensureSystemMessagesLoaded`) | **Candidata** al caricamento idle | Accoppiata a effects `PlatformControlProvider` | Intent; no implementazione qui |
| `refreshFlags` | **Candidato** al caricamento idle | Stesso provider; fallback flags già in cache | Intent; no implementazione qui |
| resize listener (`useMobileDetect`) | **Candidato** al caricamento idle | Mount listener classificato `RIMANDABILE_IDLE`; sync initial width resta first-paint | Intent; no implementazione qui |
| unread notifications (Header) | **NON rimandare** | §10 aveva etichettato interval/check come `RIMANDABILE_IDLE` dal solo punto di vista paint | **Override di prodotto:** post-login l’utente deve vedere immediatamente il numero reale delle non lette. Classificazione timing §10 resta come fatto tecnico; la decisione PO vieta deferral di questo percorso |

##### Causa verificata (unread — vincolo PO)
- `Header.tsx`: `useEffect` su `[user, notificationsEnabled]` chiama `getUnreadCount(user.id)` per utenti non-guest e imposta badge; `setInterval(60000)` + listener `NOTIFICATIONS_CHANGED_EVENT`.
- Motivazione PO: visibilità immediata del conteggio dopo login → **non** deferibile.

##### Cause escluse
- Che «candidata idle» in §10 equivalga a autorizzazione a spostare le unread — **escluso** da questa decisione PO.

---

### Decisioni ancora aperte

#### BusinessProvider — audit architetturale

##### Stato
- **Analizzato** (solo evidenze) — poi **SUPERATA** da WF-PERF-02 STEP 1 (2026-08-02): Provider rimosso da `AppProviders`, montato su `UserDashboard`
- Decisione PO successiva (STEP 1): spostamento autorizzato ed eseguito; dominio Business invariato

##### Evidenze

| Domanda | Esito dimostrato | File / percorso |
|---------|------------------|-----------------|
| Chi consuma `useBusinessContext`? | **Solo** `UserDashboard.tsx`, `UserSidebar.tsx`, `useUserDashboardData.ts` | `rg useBusinessContext` → 3 consumer + definizione |
| Dove è montato il Provider? | Sempre, radice `AppProviders` sotto `PlatformControlProvider` | `AppProviders.tsx` |
| Consumato nell’albero Home cold `/`? | **No** — Home monta `HomeContent`/`HeroSection`/shell; nessuno di questi importa `useBusinessContext` | `AppRouter` ramo Home vs intercept dashboard |
| Quando montano i consumer? | Quando `AppRouter` intercetta `router.isDashboardPath` o path `/partner/` → lazy `UserDashboard` | `AppRouter.tsx` L67–82 |
| Lavoro al mount del Provider su Home guest / non-business? | `fetchBusinesses` early-return: se `!user?.id` o `user.role !== 'business'` → `setUserBusinesses([])`, `setIsLoading(false)`, **nessuna** chiamata `getSponsorsByOwner` | `BusinessContext.tsx` L39–59 |
| Indispensabile al first paint Home? | **No come consumer dati** — nessun `useBusinessContext` su Home. La **presenza** del Provider nell’albero è richiesta solo perché è wrapper globale; i consumer dashboard non sono sul cold Home | Evidenza consumer + early-return |
| Richiesto solo dopo interazione / navigazione dashboard? | **Consumo valori**: sì, path dashboard (lazy). **Mount Provider + effect**: sì al bootstrap globale, indipendente da click | AppProviders vs AppRouter |
| Può essere rimandato? | **NON DECISO** — fuori scope; serve decisione PO successiva. Dimostrato solo: su Home non-business il fetch rete è già no-op; i consumer sono post-navigazione dashboard | — |

##### Causa verificata
1. `BusinessProvider` è Foundation Fase 3 (commento codice) per identità multi-business.
2. Sul cold Home i valori del context **non** sono letti da componenti Home.
3. Per `role !== 'business'` il fetch ownership **non** parte.

##### Cause escluse
- Che Home legga `activeBusinessId` / `userBusinesses` — **escluso** (`rg` consumer).
- Che su guest Home parta `getSponsorsByOwner` — **escluso** (early-return).

##### Cause NON ANCORA DIMOSTRATE
- Costo ms del solo mount React del Provider (senza fetch) sul TBT: manca **Performance Trace**.
- Se un redesign «Provider solo sotto dashboard» è ammissibile rispetto a SoT Foundation: non dimostrato da runtime Home; richiede decisione architetturale/PO.

##### Impatto architetturale
Classificazione §10 `RETAGGIO_STORICO` su Home va intesa come «lavoro/consumer assenti sul path Home», **non** come «feature business morta globalmente».

##### Priorità
**Media** (aperta; nessuna azione codice)

##### Decisione PO
Nessuna modifica. Audit evidenze obbligatorio prima di ogni intervento futuro.

##### Decisione tecnica
Nessuna.

##### Azioni future
Attendere decisione PO esplicita post-audit; non proporre deferral/unmount da questo paragrafo.

---

#### Retaggio (`RETAGGIO_STORICO`) — audit completo (NESSUNA ELIMINAZIONE AUTORIZZATA)

##### Stato
- **Analizzato** per ogni voce ancora classificata retaggio in §10 (esclusa `setHeroImage` già **SUPERATA** / dead wire eliminato)
- Decisione PO: **non eliminare** codice retaggio senza dimostrazione + decisione successiva

##### Evidenze per voce

###### 1) `BusinessProvider` su Home
| Campo | Evidenza |
|-------|----------|
| Perché introdotto | Commento `BusinessContext.tsx`: «FOUNDATION FASE 3» — coordinamento identità business attiva, isolamento multi-business |
| Feature originaria | Dashboard partner / switch business / ownership sponsor |
| Morto oggi? | **No globalmente** — consumer vivi in dashboard. **Sì come consumo Home** |
| Regressione? | Non applicabile come feature morta; mismatch bootstrap globale vs consumer lazy |
| Consumer indiretti | Provider wrappa tutto l’albero; effect mount sempre; fetch condizionato a `role === 'business'` |

###### 2) `isShellReady` (`ConfigContext`)
| Campo | Evidenza |
|-------|----------|
| Perché introdotto | Commenti S.2 / DOC-38: distinguere shell montabile da config specialist fully loaded |
| Feature originaria | Contratto bootstrap «shell ready ≠ config fully loaded» |
| Morto oggi? | **Flag non letto** fuori `ConfigContext` (`rg isShellReady` → solo definizione/export). Sempre `useState(true)` |
| Regressione? | **Possibile gap documentale**: il contratto S.2 esiste nel provider ma nessun gate consumer usa il boolean; AppCoordinator monta shell senza leggerlo |
| Consumer indiretti | Nessuno sul boolean; `isConfigFullyLoaded` / `isLoading` restano usati (Admin) |

###### 3) `loadProjects` → `savedProjects` sul path Home
| Campo | Evidenza |
|-------|----------|
| Perché introdotto | Lista Diari accessibili in `ItineraryContext` (cloud/local) |
| Feature originaria | Carica/salva/elimina progetti diario, trip tab, association suitcase, publish community |
| Morto oggi? | **No** — consumer: `TravelDiary`, `DiaryHeader`, `useDiaryLogic`, `UserTripsTab`, save hooks, suitcase association, ecc. |
| Home legge `savedProjects`? | **No** — `HomeContent` / `Sidebar` / shell usano `useItinerary()` ma solo `itinerary` (e analoghi), non `savedProjects` |
| Regressione? | **No** — feature viva; il retaggio §10 è «caricamento al mount globale mentre Home non legge la lista» |
| Consumer indiretti | Persistenza/save path può toccare `savedProjects` anche da flussi aperti dalla shell; non dimostrato un consumer Home UI della lista |

###### 4) `showLevelUp` (`useAppInitialization` → `UserContext`)
| Campo | Evidenza |
|-------|----------|
| Perché introdotto | Gamification: detect salita livello da XP (`getCurrentLevel`) |
| Feature originaria | UI level-up; esiste ancora `LevelUpModal` lazy in `FeatureModals` quando `activeModal === 'levelUp'` |
| Morto oggi? | **Wire runtime interrotto**: `setShowLevelUp(true)` scrive lo state; `showLevelUp` è esportato da `UserContext` ma **nessun** componente lo legge (`rg showLevelUp` → solo init/export). **Nessuna** chiamata `openModal('levelUp')` nel repo |
| Regressione? | **Sì, evidenza di regressione di cablaggio**: detector + modal esistono, manca il ponte `showLevelUp → openModal('levelUp')` (o equivalente) |
| Consumer indiretti | `closeLevelUp` passato a `ModalManager` → `onCloseLevelUp` usato alla chiusura modal; senza apertura automatica il path resta inerte |

###### 5) `setHeroImage('')` — **SUPERATA**
Dead wire Home eliminato 2026-08-02 (§12). Non rientra più tra i retaggi attivi da auditare per eliminazione.

##### Causa verificata
Retaggio §10 mescola tre categorie distinte: (A) provider globale senza consumer Home, (B) flag contratto bootstrap non letto, (C) stato/feature ancora viva ma non usata sul path Home, (D) detector gamification scollegato dalla modal.

##### Cause escluse
- Che tutte le voci `RETAGGIO_STORICO` siano «codice morto eliminabile» — **escluso** (`savedProjects`, Business dashboard vivi).
- Autorizzazione PO a cancellare retaggio in questo aggiornamento — **escluso** (divieto esplicito).

##### Cause NON ANCORA DIMOSTRATE
- Momento storico esatto in cui il ponte `showLevelUp → levelUp modal` è stato rimosso (serve git archaeology / ticket — non eseguita qui).
- Se `isShellReady` doveva avere consumer futuri oltre al commento S.2.

##### Impatto architetturale
Qualsiasi cleanup retaggio richiede classificazione per-voce; eliminazioni indifferenziate non sono supportate.

##### Priorità
**Alta** per `showLevelUp` (regressione di cablaggio dimostrata); **Media** altre voci

##### Decisione PO
Non eliminare. Audit evidenze obbligatorio; decisioni di ripristino/cleanup **aperte**.

##### Decisione tecnica
Nessuna modifica codice in questa attività.

##### Azioni future
PO: decidere se ripristinare il ponte level-up (feature) oppure deprecare detector/modal; resto retaggio resta in osservazione.

---

#### Forced Reflow — classificazione PO (NESSUNA OTTIMIZZAZIONE AUTORIZZATA)

##### Stato
- Classificazione richiesta dal PO sui siti §4/§11
- **Nessuna** proposta di ottimizzazione in questa sezione

##### Evidenze + classificazione

| # | Sito | Classificazione PO | Motivo (dal codice) |
|---|------|--------------------|---------------------|
| 1 | `useFlipSwap` GBCR + `void offsetHeight` | **Inevitabile per comportamento corrente** | Commento esplicito «force reflow» per commit invert FLIP; senza flush layout l’animazione invert/play non ha base geometrica sincrona |
| 2 | `HeroSection` scroll-stabilize GBCR | **Inevitabile per comportamento corrente** | Compensa jump viewport su expand/collapse stacked; cablato a `isStackedLayout` |
| 3 | `AppShell` RO → GBCR → `--header-height` | **Rimandabile dopo first paint** *(come lavoro di misura)* | CSS ha già default `--header-height: 64px` (`index.css`); RO aggiorna altezza reale — allineamento overlay non richiede misura nel frame 0, ma il comportamento «header reale» sì dopo layout |
| 4 | `HomeContent` sponsor `offsetWidth` + RO | **Rimandabile dopo first paint** se allineato a decisione Sponsor idle | Colonne 1–4 dipendono da larghezza container sezione partner; se fetch sponsor è idle, la misura può seguire il mount sezione senza cambiare formula |
| 5 | `HeroCompactTypingField` scrollWidth/clientWidth | **Inevitabile per comportamento corrente** (quando il twin compact è attivo) | Serve a scroll testo typing; gate &lt; MD + compact |
| 6 | `useMobileDetect` `innerWidth` | **Inevitabile** per boolean layout sync; **evitabile come duplicazione di soglia** rispetto a stacked/`matchMedia` | Necessario un signal &lt; LG; la doppia sorgente di soglia è evidenza strutturale, non autorizzazione a refactor |
| 7 | `useHeroStackedLayout` `matchMedia` | **Inevitabile per comportamento corrente** | Gate stacked hero; stesso breakpoint LG di altre query |
| 8 | Sidebar `syncCompanionTop` GBCR | **Rimandabile / fuori cold Home** | Esegue solo con workspace companion; non cold Home idle |
| 9 | `DiaryTimeline` `offsetWidth` | **Rimandabile / fuori cold Home** | Solo con TravelDiary lazy + giorni presenti |

**Retaggio (reflow):** nessun sito Home della tabella §11 risulta dead code; nessuno classificato **retaggio** come lettura geometrica orfana.

##### Causa verificata
Unico forced reflow esplicito (`offsetHeight`) = FLIP. Gli altri sono letture layout per comportamenti ancora cablati.

##### Cause escluse
- Che FLIP/scroll-stabilize siano rimuovibili senza cambiare UX stacked — **escluso** dal cablaggio corrente.
- Autorizzazione a ottimizzare in questa attività — **escluso**.

##### Cause NON ANCORA DIMOSTRATE
- Quale sito appare nello stack Performance Panel del PO: manca trace/screenshot accessibile (§13).

##### Impatto architetturale
Classificazione guida priorità future; non autorizza patch.

##### Priorità
Come §11 (**Alta** mobile stacked; **Media** desktop FLIP)

##### Decisione PO
Solo classificazione; **nessuna** ottimizzazione.

##### Decisione tecnica
Nessuna.

##### Azioni future
Usare questa tabella quando PO autorizzerà interventi mirati.

---

#### Render Blocking / Font — verifica strategia progressiva (NESSUNA MODIFICA)

##### Stato
- **Analizzato** — solo evidenze
- Domanda PO: TouringDiary usa già una strategia di caricamento progressivo dei font?

##### Evidenze

| Aspetto | Esito dimostrato | File |
|---------|------------------|------|
| Caricamento font | Google Fonts CSS in `<head>` con `rel="stylesheet"` (render-blocking) | `index.html` L30; `dist/index.html` analogo (§2) |
| `font-display` | Query Google include **`display=swap`** (`&display=swap`) → CSS remoto Google emette `font-display: swap` per le `@font-face` servite | `index.html` L30 |
| Preconnect | `fonts.googleapis.com` + `fonts.gstatic.com` `crossorigin` | `index.html` L25–26 |
| Fallback locali (stack CSS) | Sì, generici: `"Lato", sans-serif`; `"Playfair Display", serif`; `"Caveat", cursive` — **non** file font self-hosted nel repo | `src/index.css` `@theme` + `body` / `.font-display` / `.font-handwriting` |
| Self-host / `@font-face` locali | **Assenti** in CSS app (`rg @font-face` su src css → nessuno applicativo; solo stack nome + generic) | `src/index.css` |
| Caricamento differito stylesheet font | **Assente** — nessuno `media="print"`+onload, nessun `rel="preload"` as font, nessun lazy link | `index.html` |
| Trim pesi | Commento in `index.html` (audit 2026-08-01): ridotti pesi inutilizzati; **non** è deferral | `index.html` L27–29 |
| `document.fonts` | Usato in export/canvas (`useLogoRasterizer`, `SocialCanvas`) per raster post-load — **non** strategia bootstrap Home | file citati |
| Differenze desktop / mobile / tablet | **Stesso** `<link>` fonts per tutti i viewport; **nessun** branch CSS/HTML condizionale per device sul load font | `index.html` unico |

##### Causa verificata
1. Esiste una forma di progressività **tipografica** via `display=swap` (testo visibile con fallback generic finché il webfont non arriva).
2. **Non** esiste una strategia di **non-blocking / deferred stylesheet** per i font: il CSS Google resta render-blocking classico (§2).
3. Fallback = famiglie generic di sistema/CSS, non font file locali.

##### Cause escluse
- Che l’app self-hosti Lato/Playfair/Caveat — **escluso**.
- Che esistano link font distinti per mobile vs desktop — **escluso**.

##### Cause NON ANCORA DIMOSTRATE
- Tempo reale di swap FOUT/FOIT sul device del PO: serve trace/filmstrip Lighthouse o Performance.
- Contenuto esatto del CSS Google servito in rete (oltre al parametro `display=swap` nella URL): artefatto di rete esterno.

##### Impatto architetturale
`display=swap` mitiga invisibilità testo; **non** rimuove il render-blocking del stylesheet font dimostrato in §2.

##### Priorità
**Alta** (tema §2); nessuna azione codice qui

##### Decisione PO
Solo evidenze; **nessuna** modifica.

##### Decisione tecnica
Nessuna.

##### Azioni future
Qualsiasi cambio strategia font richiede decisione PO esplicita post-evidenze.

---

### Registro decisioni PO (manutenzione)

| Data | Voce | Esito |
|------|------|-------|
| 2026-08-02 | Provider first-paint | Mantenerli |
| 2026-08-02 | POST_INTERACTION | Nessuna modifica |
| 2026-08-02 | Sponsor / config / platform messages / refreshFlags / resize | Idle candidati (sponsor: rimandare se no-UX-change) |
| 2026-08-02 | Unread notifications | **NON** rimandare |
| 2026-08-02 | BusinessProvider / Retaggio / Reflow opt / Font | Aperti — solo audit; no implementazione |
| 2026-08-02 | Dead wire Home heroImage | Eseguito (§12) — fuori bootstrap idle |
| 2026-08-02 | WF-PERF-02 STEP 1 BusinessProvider | **Eseguito** — rimosso da bootstrap globale; mount su UserDashboard |
| 2026-08-02 | WF-PERF-02 STEP 2 LevelUp | **Eseguito** — ripristinato cablaggio `showLevelUp` → `openModal('levelUp')` |
| 2026-08-02 | WF-PERF-02 analisi Sponsor Home | Solo analisi — vedi sotto; idle **fattibile** con vincoli UX |
| 2026-08-02 | WF-PERF-02 analisi ConfigProvider | Solo analisi — vedi sotto |

---

### WF-PERF-02 STEP 1 — BusinessProvider fuori bootstrap (eseguito)

#### Stato
- **SI** — spostamento dimostrato sicuro; **implementato**

#### Evidenze
| Verifica | Esito | Certezza |
|----------|-------|----------|
| Consumer `useBusinessContext` | Solo `UserDashboard.tsx`, `UserSidebar.tsx`, `useUserDashboardData.ts` | Alta (`rg`) |
| Header / Home / shell | Nessun import `useBusinessContext` | Alta |
| Mount runtime Dashboard | `AppRouter` intercept `isDashboardPath` / `/partner/` → lazy `UserDashboard` | Alta |
| Fetch su Home non-business | Early-return già in `BusinessContext.fetchBusinesses` | Alta |
| Dominio / Supabase | File `BusinessContext` invariato nella logica; solo sede del Provider | Alta |

#### Causa verificata
Nessun consumer indiretto su Home/shell; il Provider globale era solo wrapper. Mount su `UserDashboard` preserva URL normalizer + fetch ownership quando la Dashboard è aperta.

#### Cause escluse
- Dipendenza Header/Home dal context — **escluso**
- Necessità di lazy aggiuntivo — **escluso** (UserDashboard già lazy; Provider sync nel modulo Dashboard)

#### Impatto architetturale
`AppProviders` non monta più `BusinessProvider`. SoT bootstrap aggiornata in `AI_CONTEXT/38_BOOTSTRAP_ARCHITECTURE_SOT.md` (tabella provider).

#### Priorità
Eseguita (alta per bootstrap Home)

#### Decisione PO
Autorizzata da WF-PERF-02 STEP 1

#### Decisione tecnica
Wrapper `<BusinessProvider>` in `UserDashboard` export; rimosso da `AppProviders`

#### Azioni future
Nessuna sul dominio Business

---

### WF-PERF-02 STEP 2 — LevelUp wire (eseguito)

#### Stato
- **Regressione di cablaggio confermata** e **ripristinata**

#### Evidenze
| Pezzo | Pre-fix | Post-fix |
|-------|----------|------------|
| Detector XP | `useAppInitialization` → `setShowLevelUp(true)` | Invariato |
| State | `UserContext.showLevelUp` esportato, **zero letture UI** | Letto in `ModalManagerClassic` |
| Modal | `FeatureModals` `activeModal === 'levelUp'` → `LevelUpModal` | Invariato |
| Ponte | **Assente** (`rg openModal('levelUp')` = 0) | `useEffect`: `showLevelUp` → `openModal('levelUp')` |
| Close | `onCloseLevelUp` già su close modal | Invariato |

#### Causa verificata
Regressione: detector e modal vivi, manca il bridge runtime.

#### Cause escluse
- Dominio XP / `getCurrentLevel` corrotti — **escluso** (non modificati)
- Modal assente — **escluso**

#### Impatto architetturale
Nessun cambio SoT gamification; solo ripristino wiring UI esistente.

#### Priorità
Alta (UX gamification)

#### Decisione PO
WF-PERF-02 STEP 2 — ripristinare collegamento corretto

#### Decisione tecnica
Effect in `ModalManager.tsx` (prima degli early-return del portal)

#### Azioni future
Nessuna

---

### WF-PERF-02 ANALISI — Sponsor Home (nessuna modifica codice)

#### Stato
- **Analizzato**

#### Evidenze
| Aspetto | Dimostrato |
|---------|------------|
| Dipendenze | `HomeContent` mount → `useEffect([])` → `fetchActiveSponsorsResolvedAsync()` (`sponsorContractsService` → Supabase `sponsors` + join) → filter `PLAN_TYPES.REGIONAL_ACTIVITY` → `goldSponsors` |
| UI | Sezione `#tour-partners` sempre nel DOM Home; celle vuote via `renderSponsorCell(null)` finché array vuoto; `ResizeObserver` su `sponsorContainerRef` indipendente dal fetch |
| Immagini | Caricate solo quando sponsor risolti popolano le card (non priority LCP sulle card città `priority={false}`) |
| Timer | `setInterval(8000)` solo se `goldSponsors.length > 1` |
| SEO | Sezione partner sotto hero/featured; contenuto partner da rete — non nel HTML iniziale `#root` vuoto |
| Race | Un solo fetch mount; no cancel/AbortSignal — remount Home può ri-fetch; setState su unmount: **NON ANCORA DIMOSTRATO** se produce warning (manca test runtime) |
| Side effects | Nessun gate su Hero/first paint; stato locale a `HomeContent` |

#### Causa verificata
Il fetch sponsor **non** blocca first paint React; gareggia sul main/network dopo mount. La sezione partner può restare vuota/placeholder fino alla risposta.

#### Cause escluse
- Che il fetch sia await-ato da AppRouter prima di montare Home — **escluso**

#### Cause NON ANCORA DIMOSTRATE
- Impatto ms TBT del fetch/parse sul cold start (serve Performance Trace)
- Comportamento esatto SEO crawler su partner (serve fetch HTML + JS execution crawler)

#### Impatto architetturale / fattibilità idle
**Sì, rimandabile dopo first paint (idle)** senza cambiare il contratto UX se: stesso fetch, stessi filtri, stessa UI (placeholder → riempimento), stesso interval dopo ≥2 sponsor. Allineato a decisione PO già registrata. **Implementazione non in questo STEP.**

#### Priorità
Media (candidata idle)

#### Decisione PO
Intent idle già approvato; implementazione ancora da autorizzare esplicitamente

#### Decisione tecnica
Nessuna (solo analisi)

#### Azioni future
Implementare idle solo su richiesta PO successiva

---

### WF-PERF-02 ANALISI — ConfigProvider / `loadConfig` (nessuna modifica codice)

#### Stato
- **Analizzato**

#### Evidenze

| Domanda | Esito dimostrato |
|---------|------------------|
| `loadConfig` gate shell? | **No** — `isShellReady` sempre `true`; commenti S.2; AppCoordinator non attende Config per Home |
| Cosa fa `loadConfig` | `loadGlobalCache()` → Phase A snapshot/first-paint rules → Phase B tutti `SETTINGS_KEYS` → `isConfigFullyLoaded`; poi design remoto async |
| Chi usa `useConfig()` bootstrap-ish | `useDynamicStyles` / `useDynamicContent` (Home hero labels, section titles, Header diary btn, CityCard, …) leggono `configs.design_system_rules` — **vuoto/`''` finché Phase A non pubblica** |
| `getCachedSetting` parallelo | `HeroAiModule` `ai_box`, altri; legge cache settingsService anche fuori React state Config |
| Valori tipicamente **dopo** first paint | Phase B keys specialist (Admin, taxonomy, GPS options, …); design remoto override |
| Valori utili **prima**/subito post paint | Phase A: `DESIGN_SYSTEM_SNAPSHOT` / `design_system_rules` first-paint — già progettati come publish progressivo |
| Admin | `AdminHeaderManager` attende `!isLoading` (`!isConfigFullyLoaded`) — path non-Home |

#### Causa verificata
Presenza `ConfigProvider` = first paint (hook throw). Await `loadConfig` = **non** indispensabile al first paint layout; i consumer Home degradano a stringa vuota / fallback finché Phase A non arriva. Candidata idle PO riguarda il lavoro di rete/fill, non la rimozione del Provider.

#### Cause escluse
- Che Home attenda `isConfigFullyLoaded` — **escluso** (S.2 / codice Coordinator)

#### Cause NON ANCORA DIMOSTRATE
- Flash visivo misurato di stili default→snapshot (serve filmstrip)
- Elenco chiuso “chiavi lette nel primo frame Home” vs Phase B (serve coverage timing o log per-key)

#### Impatto architetturale
Allineato a decisione PO “config dinamica candidata idle”: deferibile il lavoro di load, non il mount del Provider.

#### Priorità
Alta (tema bootstrap)

#### Decisione PO
Candidata idle (già in registro); no implementazione in questo STEP

#### Decisione tecnica
Nessuna (solo analisi)

#### Azioni future
Implementazione idle Config solo su autorizzazione PO + rispetto vincolo unread notifications

---

Fine dossier aggiornato. Ottimizzazioni bootstrap **non** autorizzate da questo documento salvo decisione PO esplicita successiva; classificazione §10–§12 e sezione **Decisioni PO (in corso)** / WF-PERF-02 sono la base per le decisioni.
