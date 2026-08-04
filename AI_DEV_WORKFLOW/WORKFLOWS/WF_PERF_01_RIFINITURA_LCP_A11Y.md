# WF-PERF-01 — Rifinitura LCP / Accessibility / Fonts / Viewport

> Documento dedicato alla fase di rifinitura a basso rischio emersa dall’audit Lighthouse/DevTools.  
> Non apre un nuovo Workflow: è allegato operativo a **WF-PERF-01**.  
> Non modifica Design System, UX o architettura applicativa.

| Campo | Valore |
|-------|--------|
| **Data** | 2026-08-01 |
| **Workflow padre** | WF-PERF-01 |
| **Stato documento** | Parziale — LCP + Accessibility = **IMPLEMENTATO**; Google Fonts = **ANALIZZATO** / **IN DECISIONE PO** / **NON IMPLEMENTATO**; Viewport/User-scalable = **ANALIZZATO** / **IN DECISIONE PO** / **NON IMPLEMENTATO** |

### Legenda stati (terminologia obbligatoria in questo documento)

| Stato | Significato |
|-------|-------------|
| **IMPLEMENTATO** | Modifica codice già applicata |
| **ANALIZZATO** | Audit/evidenza completati; nessuna modifica codice da questa sezione |
| **RACCOMANDATO** | Indicazione tecnica per il PO; non è approvazione né piano di implementazione |
| **IN DECISIONE PO** | Serve scelta esplicita del PO prima di qualsiasi implementazione |
| **NON IMPLEMENTATO** | Nessuna modifica codice effettuata (e nessuna implementazione avviata) |

**Sintesi uniforme**

- **LCP** + **Accessibility** → **IMPLEMENTATO**
- **Google Fonts (trim zero-uso)** → **IMPLEMENTATO** in **WF-PERF-02** (second-pass); Lato 500/URL minimo esteso restano decisioni separate
- **Viewport / User-scalable** → soltanto **ANALIZZATO** → **IN DECISIONE PO** → **NON IMPLEMENTATO**

---

## 1. Cosa è stato analizzato

| Area | Stato | Esito analisi |
|------|-------|----------------|
| LCP immagini `priority` | **ANALIZZATO** → poi **IMPLEMENTATO** (sez. 2.1) | Confermata regressione: `opacity-0` fino a `onLoad` ritarda il candidato LCP |
| Accessibility icon-only | **ANALIZZATO** → poi **IMPLEMENTATO** (sez. 2.2) | Confermati pulsanti senza nome accessibile / senza `aria-expanded` |
| User-scalable / viewport zoom | **ANALIZZATO** — **NON IMPLEMENTATO** — **IN DECISIONE PO** | Audit definitivo completato (solo analisi; nessuna modifica a `index.html`) |
| Google Fonts (tutta la UI) | **ANALIZZATO** — **NON IMPLEMENTATO** — **IN DECISIONE PO** | Audit completo famiglie/pesi + percorsi UI (solo analisi; nessuna modifica a `index.html`) |
| CLS card/skeleton | **ANALIZZATO** — nessun intervento | Già contenuti da box CSS — nessun intervento in questo lotto |
| Cache / SW / bundle / bootstrap | Fuori scope | Esclusi esplicitamente |

---

## 2. Problemi confermati e modifiche implementate

### 2.1 LCP — **IMPLEMENTATO**

| Problema | Causa | Fix |
|----------|--------|-----|
| Immagini `priority` invisibili al first paint | `opacity-0` + fade 500ms fino a `onLoad` | Se `priority`: sempre `opacity-100`, niente fade |
| Non-priority | — | **Invariato** (fade + `decoding="async"`) |

**`decoding` — decisione (verifica MDN / best practice, 2026-08-01)**

| Opzione | Esito |
|---------|--------|
| `decoding="sync"` su priority | **Non mantenuto** |
| Motivazione | MDN (`<img>` / `HTMLImageElement.decoding`): su `<img>` statici l’effetto sync/async è spesso **impercettibile**; `sync` può **ritardare altri paint** sul main thread. Il guadagno LCP reale in questo codice era l’eliminazione di `opacity-0`, non il decode mode. Tunetheweb (analisi dedicata): micro-ottimizzazione rispetto a `loading` / `fetchpriority`. |
| Scelta adottata | Priority: **nessun attributo** (`auto`, decide il browser). Non-priority: `async` (evita contesa decode con above-the-fold). |

**File modificato**

| File | Componente | Motivo |
|------|------------|--------|
| `src/components/common/ImageWithFallback.tsx` | `ImageWithFallback` | Migliorare LCP senza alterare il path non-priority |

**Beneficio atteso:** LCP più precoce su Home (card featured `priority`) e City (`CityHeader` hero), senza forzare jank da decode sync.

**Smoke test consigliati**

- Home mobile: prime card “In Evidenza” appaiono subito (eventuale spinner sopra, senza fade-in LCP)
- City detail: hero city visibile senza fade
- Card lazy (non-priority): fade-in invariato

---

### 2.2 Accessibility — **IMPLEMENTATO**

Solo attributi ARIA / `aria-label`. Nessuna rimozione icone, nessun cambio UI, nessun sostituzione componenti.

| File | Componente | Attributi aggiunti | Motivo |
|------|------------|-------------------|--------|
| `src/components/layout/Header.tsx` | Back mobile | `aria-label="Indietro"` | Pulsante icon-only |
| `src/components/layout/Header.tsx` | Toggle Diario sidebar | `aria-label` dinamico | Testo nascosto sotto `lg` |
| `src/components/layout/Header.tsx` | Meteo mobile | `aria-label`, `aria-pressed` | Icon-only |
| `src/components/layout/Header.tsx` | GPS | `aria-label`, `aria-pressed` | Icon-only (`title` non basta) |
| `src/components/layout/Header.tsx` | Accedi / Account | `aria-label` | Icon-only desktop |
| `src/components/layout/Header.tsx` | Menu hamburger | `aria-label`, `aria-expanded`, `aria-haspopup="true"` | Icon-only + disclosure nav (non Menu) |

**Header popup — `role="menu"` / `role="menuitem"` (verifica WAI-ARIA APG)**

| Scelta | **Non introdotti**; `aria-haspopup` corretto a `"true"` (ex `"menu"`) |
|--------|-------------------------------------|
| Motivo | Il pannello è un disclosure `<nav>` (link/azioni di navigazione app), non un Menu applicativo. APG / MDN: `role="menu"` richiede gestione focus/frecce tipica dei menu desktop; senza quella implementazione i ruoli sono **scorretti**. Pattern corretto: disclosure con `aria-expanded` + `aria-haspopup="true"`. |
| `src/components/layout/MobileNavBar.tsx` | FAB Diario | `aria-label="Apri Diario"` | Label “Diario” è sibling, non nel button |
| `src/components/city/CityHeader.tsx` | Share / Shop / Culture | `aria-label` | Cluster icon-only mobile |
| `src/components/home/HomeContent.tsx` | Chevron scroll sezioni + In Evidenza | `aria-label` | Icon-only |
| `src/components/layout/modals/CoreModals.tsx` | Close reviewSuccess | `aria-label="Chiudi"` | Allineo a `CloseButton` |
| `src/components/layout/Sidebar.tsx` | Close meteo | `aria-label="Chiudi meteo"` | Icon-only |
| `src/components/layout/Sidebar.tsx` | Expand rankings | `aria-label="Apri classifiche complete"` | Icon-only |
| `src/components/layout/Sidebar.tsx` | Add partner itinerario | `aria-label` dinamico | Icon-only Plus/Check |
| `src/components/home/hero/components/FilterSelect.tsx` | Reset filtro | `aria-label` | Icon-only X |
| `src/components/home/hero/components/MultiFilterSelect.tsx` | Reset tipologia | `aria-label` | Icon-only X |
| `src/components/home/hero/components/SearchBar.tsx` | Clear search (compact + default) | `aria-label="Cancella ricerca"` | Icon-only X |
| `src/components/home/hero/components/SearchBar.tsx` | Input ricerca | `aria-label="Cerca una città"` | Label accessibile (placeholder invariato) |
| `src/components/home/hero/HeroFilterModule.tsx` | Reset / Tipologia / Ispirazione / Shortlist AI | `aria-label`, `aria-pressed` dove toggle | Icon-only |
| `src/components/layout/Sidebar.tsx` | Griglia azioni + sponsor +/- | `aria-label` (desktop/mobile allineati) | Icon-only |
| `src/components/home/HomeContent.tsx` | Plus/Check itinerario | `aria-label` dinamico | Icon-only |
| `src/components/features/diary/header/DiaryHeaderToolbar.tsx` | Azioni toolbar | `aria-label` | Icon-only |
| `src/components/features/diary/DiaryResourceCard.tsx` | Eye / Pin / Trash + link icon-only | `aria-label` / nome accessibile | Icon-only |
| `src/components/modals/AuthModal.tsx` | Form + avatar | `htmlFor`/`id`, `alt` | Label/input + immagini |
| `src/components/community/RankingTab.tsx` | Avatar | `alt` | Immagini senza testo alternativo |
| `src/components/shop/ShopHeader.tsx` / `ShopHero.tsx` / `ShopProducts.tsx` / `BottegaSponsorCard.tsx` | Pulsanti icon-only | `aria-label` | Icon-only |

**Favicon amministrabile (Asset Globali)** — **IMPLEMENTATO**; stessa infrastruttura, non sistema parallelo:

| Pezzo | Dettaglio |
|-------|-----------|
| SoT | `global_settings.favicon_image` (+ registry Placeholder) |
| Admin | Asset Globali → Favicon (`AdminPhotoInspector` condiviso) |
| Runtime | `GET /favicon.ico` Express (sempre 200) + proxy Vite; `index.html` `<link rel="icon" href="/favicon.ico" sizes="any" />` |

**Beneficio atteso:** miglioramento audit Lighthouse Accessibility (button-name / ARIA / labels / alt), screen reader su chrome Home/City/Shop/Diary; favicon non più 404.

**Smoke test consigliati**

- Header: menu expand/collapse, GPS, meteo, back city
- Mobile nav: FAB Diario apre Diario
- City mobile: Share / Shop / Culture
- Hero: reset filtri / clear search
- Sidebar: classifiche + add partner

### 2.3 Micro-fix filtri hero (2026-08-01) — **IMPLEMENTATO**

| File | Modifica | Motivo |
|------|----------|--------|
| `FilterSelect.tsx` | `onChange: (value: string) => void` (niente cast `ChangeEvent` fittizio); `useMobileDetect` | Type-safe + breakpoint centralizzato (`LAYOUT.BREAKPOINTS.LG`) |
| `useHeroLogic.ts` / `HeroFilterModule.tsx` | Handler allineati a `(value: string)` | Compatibilità chiamanti con nuova API |
| `MultiFilterSelect.tsx` | `useMobileDetect`; dropdown `w-full min-w-[140px] left-0 right-0` (come `FilterSelect`) | Stesso breakpoint; evita overflow/`w-48` fisso vs contenitore |

AI_CONTEXT / AI_CONTEXT_MASTER: **non aggiornati** — nessun contratto dominio/DS documentato per questi componenti.

---

## 3. Sezione aperta — User-scalable (**ANALIZZATO** · **NON IMPLEMENTATO** · **IN DECISIONE PO**)

> Nessuna modifica viewport è stata applicata. Quanto segue è solo esito di analisi; qualsiasi intervento resta **IN DECISIONE PO** e **NON IMPLEMENTATO**.

### 3.1 Verificato (**ANALIZZATO**)

Viewport attuale (`index.html`):

```html
maximum-scale=1, user-scalable=0
```

insieme a `viewport-fit=cover` e `interactive-widget=resizes-content`.

### 3.2 Evidenza concreta (non probabilistica) — **ANALIZZATO**

| Area | File | Dipendenza |
|------|------|------------|
| Diario mobile overlay | `useMobileDiaryOverlayGeometry.ts` | Usa `visualViewport.height` / `offsetTop` per riscrivere altezza overlay. `keyboardLikelyOpen = visualHeight < innerHeight * 0.85` **senza** controllo `visualViewport.scale`. Pinch-zoom riduce `visualViewport.height` come la tastiera → path di resize errato. |
| Keyboard detector | `useVirtualKeyboardOpen.ts` | Stessa euristica di shrink visual vs layout; nessun guard su `scale`. |
| Modal footer | `CommunityPhotoPublishModal.tsx` | Nasconde footer quando il detector dice “keyboard open” → false positive sotto zoom. |
| Shell app | `AppShell.tsx` + `index.css` `body { overflow: hidden }` | Modello app a schermo fisso non scrollabile; zoom utente rompe l’allineamento dei pannelli `fixed`. |
| Overlay fixed | Diario, Weather, Focus, `td-modal-overlay` | Banda `top-[var(--header-height)]` … `bottom: 0` calibrata su scale=1. |
| Popover ancorati | `useAnchoredPortalPosition.ts`, `HeaderPopover.tsx` | Mix `innerWidth`/`innerHeight` (layout) con `getBoundingClientRect` (visual) → clamp errato sotto zoom. |
| Mappe | `ViaggioMappaGoogleEmbed.tsx` | `gestureHandling="auto"`: pinch pagina vs pinch mappa in conflitto. |

Nessun uso di `visualViewport.scale` nel codice. Il lock meta è l’unica protezione.

### 3.3 Conclusione netta (**ANALIZZATO** — non è un piano di implementazione)

**B) Esistono rischi concreti.**

La rimozione di `maximum-scale=1` / `user-scalable=0` **non** è sicura allo stato attuale.  
Motivo decisivo: codice attivo che muta geometria overlay e stato “tastiera” sulla base dello shrink del `visualViewport`, indistinguibile da un pinch-zoom senza guard su `scale`.

Stato: **NON IMPLEMENTATO**. Nessuna rimozione del lock è approvata o avviata.

### 3.4 Cosa resta da decidere (**IN DECISIONE PO**)

| Opzione | Natura | Implicazione |
|---------|--------|--------------|
| **Mantenere il lock** | **RACCOMANDATO** (indicazione tecnica, non decisione) | Nessun intervento; a11y zoom resta fallita in Lighthouse (trade-off consapevole app-shell) |
| **Rimuovere il lock solo dopo fix** | Alternativa in decisione PO | Minimo: ignorare geometry/keyboard quando `visualViewport.scale !== 1`; rivalutare shell scrollabile vs zoom |

**NON IMPLEMENTATO** finché il PO non sceglie esplicitamente. Le opzioni sopra non costituiscono approvazione né pianificazione di implementazione.

---

## 4. Sezione aperta — Google Fonts (**ANALIZZATO** · **NON IMPLEMENTATO** · **IN DECISIONE PO**)

> Nessuna modifica ai font in `index.html` è stata applicata. Matrici e trim proposti sotto sono solo **ANALIZZATO** / **RACCOMANDATO**; restano **IN DECISIONE PO** e **NON IMPLEMENTATO**.

### 4.1 Caricamento attuale (`index.html`) — **ANALIZZATO**

| Famiglia | Pesi caricati |
|----------|----------------|
| Lato | 300, 400, 700, 900 |
| Playfair Display | 400, 500, 600, 700, 800, 900 + italic 400 |
| Caveat | 400, 500, 600, 700 |

Token CSS (`index.css`): `--font-sans`→Lato, `--font-display`→Playfair, `--font-handwriting`→Caveat.  
Tutti gli `h1–h6` usano Playfair. `font-serif` = serif browser (non Playfair).  
PDF/react-pdf: Helvetica/Times (indipendenti). Export logo raster: Playfair 900 + Caveat 700 in browser.

### 4.2 Matrice d’uso (intera UI) — **ANALIZZATO**

#### Lato (`font-sans` / body)

| Peso | Caricato? | Occorrenze effettive | Necessario? |
|------|-----------|----------------------|-------------|
| 100 thin | No | 1 override UI | Raro — unificabile |
| 200 | No | 0 | No |
| 300 light | Sì | ~5 UI | Raro — unificabile a 400 |
| 400 normal | Sì | Ubiquo (body + regole DS) | **Sì** |
| 500 medium | **No** | ~80+ file TSX + ~21 regole DS | Usato ma **non caricato** (sintesi browser) |
| 600 semibold | **No** | ~50 file TSX (MySpace/Workspace/collab) | Usato ma non caricato; unificabile a 700 |
| 700 bold | Sì | Ubiquo | **Sì** |
| 900 black | Sì | Ubiquo (badge/label caps) | **Sì** |

#### Playfair Display (`font-display` + headings)

| Peso | Caricato? | Occorrenze | Necessario? |
|------|-----------|------------|-------------|
| 400 | Sì | ~0 intenzionali | Eliminabile dal load |
| 500 | Sì | **0** | **Eliminare** |
| 600 | Sì | **0** | **Eliminare** |
| 700 bold | Sì | Primario (titoli Home/City/Admin/Modali + DS) | **Sì** |
| 800 | Sì | **0** | **Eliminare** |
| 900 black | Sì | ~15–20 superfici brand/emphasis | **Sì** (brand) |
| italic 400 | Sì | Quote diario vuole bold+italic → sintesi 700 italic | Mismatch; rarissimo |

#### Caveat (`font-handwriting`)

| Peso | Caricato? | Occorrenze | Necessario? |
|------|-----------|------------|-------------|
| 400 | Sì | 1 (label senza weight) | Raro |
| 500 | Sì | **0** | **Eliminare** |
| 600 | Sì | **0** | **Eliminare** |
| 700 bold | Sì | Tutti gli altri usi DS + UI (~8 regole + ~10 TSX) | **Sì** |

### 4.3 Percorsi UI — pesi rari (ogni occorrenza raggiungibile) — **ANALIZZATO**

#### Lato 100 (`font-thin`) — 1 caso

1. Apri l’app → guarda il **Narrative Compass** nell’header (fasi del viaggio) → i divisori `|` tra le fasi usano `font-thin` (sopra la regola DS `journey_divider` che è light).

#### Lato 300 (`font-light`) — tutti i casi

1. Apri l’app → Narrative Compass → divisori `|` (`journey_divider` = Lato light).
2. Apri Home → entra in una città → scrolla la riga **Nearby Cities** → i `|` tra i chip città.
3. Apri Home → apri il modal **Province / raggio** → testo “Raggio d'azione…”.
4. Apri **Auth** (Login/Register) → paragrafo body sotto il titolo (welcome copy).

#### Playfair 500 / 600 / 800

- **Nessun percorso UI** — zero usi nel codice e nelle design rules.

#### Playfair 400 regular

- Nessun uso intenzionale `font-display` + `font-normal`. I titoli usano bold/black.

#### Playfair italic 400 vs uso reale

1. Apri **Diario** (sidebar o fullscreen mobile) in stato **vuoto** → citazione ispirazionale sotto il badge GRATIS → regola `diary_quote` / `diary_quote_mobile` = Playfair **bold + italic**. Il file italic caricato è solo 400 → il browser sintetizza.

#### Playfair 900 — superfici (tutte)

**Design system**

1. Header → logo **TOURING** (`header_logo` / mobile).
2. Header → logo **DIARY** (`header_logo_accent` / mobile) — Playfair 900, non Caveat.
3. Apri Diario vuoto (desktop) → CTA **“ANNOTA QUI IL TUO SOGNO!”** (`diary_cta`).

**UI esplicita**

4. Diario → Export → logo **TOURING** nel modal export.
5. Export PDF/DOCX che rasterizza il logo → canvas TOURING.
6. Home → Magic Planner / AI form → badge numerico step indigo.
7. Community → apri un itinerario → numero giorno.
8. Onboarding first-run → titoli step (fallback).
9. Admin → Onboarding Visual Editor → anteprima titoli.
10. Città → modal **Storia e Origini** → titolo sezione.
11. Admin → Stats Dashboard → numeri grandi Guide / Città senza guide.
12. Magic Planner → modali errori/crediti/warning → titoli.
13. User Dashboard → Wallet → titolo coupon attivo.
14. User Dashboard → Referral → headline.
15. Città → modal **Santo Patrono** → titolo.
16. Città → **Angolo Cultura** → valori stats persona + sezione “I Luoghi di …”.

#### Caveat 400 — 1 caso

1. Apri Diario → apri **Valigia** → box onboarding → label **“Diario di Viaggio”** in Caveat senza `font-bold` (default 400).

#### Caveat 500 / 600

- **Nessun percorso UI**.

#### Caveat 700 — superfici tipiche (necessarie)

1. Diario sidebar → titolo “Diario di Viaggio”.
2. Diario timeline → label giorno / orario / nome tappa.
3. Città → nome Patrono (handwriting amber).
4. “Nascondi Diario” / drawer e-Commerce Valigia.
5. Export → parola **“Diary”** (Caveat bold italic sintetizzato).

### 4.4 Dati raccolti — opzioni **RACCOMANDATE** (non approvate, non pianificate)

> Tabella di supporto alla decisione PO. Nessuna riga è un piano di implementazione né un ACCETTO. Stato complessivo Fonts: **ANALIZZATO** / **NON IMPLEMENTATO** / **IN DECISIONE PO**.

| Opzione (**RACCOMANDATO**) | Azione tipica *se* il PO approvasse | Rischio |
|-----------|---------------|---------|
| Trim “zero-uso” | Togliere Playfair 500/600/800 e Caveat 500/600 dall’URL | Nessuno |
| Trim Playfair 400 + italic 400 | OK se si accetta sintesi italic sulla quote oppure si cambia quote | Basso |
| Caveat solo 700 | Aggiungere `font-bold` al label onboarding Valigia, poi togliere 400 | Basso |
| Lato 300 | Unificare light → normal, poi togliere 300 | Basso |
| Lato 500 | **Aggiungere** 500 all’URL *oppure* mappare `font-medium`→400/700 | Medio se ignorato (oggi già sintetizzato) |
| Lato 600 | Unificare `font-semibold`→`font-bold` | Basso–medio |
| URL minimo (proposta tecnica) | `Lato@400;500;700;900` + `Playfair@700;900` + `Caveat@700` (+ italic 700 opzionale per diary quote) | **IN DECISIONE PO** — non approvato |

### 4.5 Cosa resta da decidere (**IN DECISIONE PO**)

1. Approvare trim “zero-uso” (Playfair 500/600/800, Caveat 500/600)?
2. Tenere o unificare Lato 300 / Caveat 400?
3. Aggiungere Lato 500 al load oppure uniformare `font-medium`?
4. Gestione diary quote italic (caricare italic 700 vs cambiare stile)?

**NON IMPLEMENTATO:** nessuna modifica a `index.html` font finché il PO non sceglie esplicitamente. Le opzioni della sez. 4.4 non sono un piano di lavoro approvato.

---

## 5. File toccati in questo intervento (codice) — ambito **IMPLEMENTATO** (LCP + A11y + micro-fix hero)

1. `src/components/common/ImageWithFallback.tsx`
2. `src/components/layout/Header.tsx`
3. `src/components/layout/MobileNavBar.tsx`
4. `src/components/city/CityHeader.tsx`
5. `src/components/home/HomeContent.tsx`
6. `src/components/layout/modals/CoreModals.tsx`
7. `src/components/layout/Sidebar.tsx`
8. `src/components/home/hero/components/FilterSelect.tsx`
9. `src/components/home/hero/components/MultiFilterSelect.tsx`
10. `src/components/home/hero/components/SearchBar.tsx`
11. Questo documento

**Non toccati** (Fonts/Viewport restano NON IMPLEMENTATO): `index.html` (viewport + fonts), Design System tokens, layout/UX.

---

## 6. Prossimi passi (**RACCOMANDATO** / **IN DECISIONE PO** — non un piano di implementazione)

1. Smoke LCP + Accessibility già **IMPLEMENTATO** (sezione 2).
2. **IN DECISIONE PO** su **User-scalable** (oggi solo **ANALIZZATO** / **NON IMPLEMENTATO**). Indicazione tecnica **RACCOMANDATA**: mantenere il lock finché non si fixano gli hook VV — non è approvazione.
3. **IN DECISIONE PO** su **Google Fonts** (oggi solo **ANALIZZATO** / **NON IMPLEMENTATO**). Indicazione tecnica **RACCOMANDATA**: trim zero-uso + URL minimo — non è approvazione né scheduling.
4. Eventuale implementazione fonts e/o viewport: ammessa **solo se** il PO decide e ACCETTA esplicitamente; fino ad allora resta **NON IMPLEMENTATO** (lotti separati, non avviati).
