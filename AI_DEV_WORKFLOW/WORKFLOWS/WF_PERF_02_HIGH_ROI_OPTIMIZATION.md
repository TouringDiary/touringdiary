# WF-PERF-02 — Ottimizzazioni alto ROI (Fonts / LCP Home / Touch / AI lazy / Breakpoints)

> Workflow di ottimizzazione **non** orientato al punteggio Lighthouse.  
> Obiettivo: rimuovere solo problemi **evidenziati**, **basso costo**, **basso rischio**, senza cambiare architettura, UX o Design System.

| Campo | Valore |
|-------|--------|
| **Data apertura** | 2026-08-01 |
| **Workflow padre / correlato** | WF-PERF-01 (rifinitura LCP/A11y/Fonts/Viewport) |
| **Stato** | STEP 1–2 **IMPLEMENTATI** → In verifica PO |
| **Fuori scope** | visualViewport / zoom unlock / AppShell / Provider / Context / PWA / SW |

---

## Legenda stati

| Stato | Significato |
|-------|-------------|
| **IMPLEMENTATO** | Modifica codice applicata |
| **ANALIZZATO** | Verifica completata; nessuna modifica o modifica differita |
| **IN DECISIONE PO** | Serve ACCETTO esplicito |
| **NON IMPLEMENTATO** | Non toccato in questo WF |

---

## STEP 1 — Costo basso

### 1.1 Google Fonts — second-pass (**IMPLEMENTATO** trim zero-uso)

**Metodo:** script di scansione su tutto `src/` + `index.html` (classi Tailwind, coppie DS `font_family|font_weight`, className con `font-display`/`font-handwriting`, canvas/`fonts.load`, export).

| Famiglia / peso | Esito second-pass | Azione |
|-----------------|-------------------|--------|
| Playfair 500 / 600 / 800 | **0** usi con `font-display` (TSX + seed DS) | **Rimosso** dall’URL |
| Caveat 500 / 600 | **0** usi | **Rimosso** |
| Playfair 400 + italic 400 | h1–h6 family; diary quote italic; possibile `font-normal` | **Mantenuto** |
| Playfair 700 / 900 | bold/black + canvas logo 900 | **Mantenuto** |
| Caveat 400 | `SuitcaseOnboardingBox` senza `font-bold` | **Mantenuto** |
| Caveat 700 | DS handwriting bold + canvas | **Mantenuto** |
| Lato 300/400/700/900 | usati | **Mantenuto** |
| Lato 500 / 600 | usati via `font-medium`/`semibold` ma **non caricati** (sintesi) | **Non aggiunto** in questo WF (aumenterebbe bytes) |

**URL risultante:**  
`Lato@300;400;700;900` + `Playfair ital 0,400;0,700;0,900;1,400` + `Caveat@400;700`

**Nota admin DS:** l’editor può teoricamente assegnare pesi arbitrari a `font-display`; i pesi trimmati non compaiono in alcun seed/runtime attuale. Nuove regole admin su 500/600/800 Playfair richiederebbero di riallargare l’URL.

### 1.2 Priority immagini Home (**IMPLEMENTATO**)

| Superficie | Prima | Dopo | Motivo |
|------------|-------|------|--------|
| Hero (`HeroFilterModule`) | `priority` + `fetchPriority=high` | **Invariato** | Vero candidato LCP |
| Featured (`HomeContent`) | `priority={idx < 2}` | `priority={false}` | Sotto hero; competizione LCP |
| Curated top / categorie | `cIdx < 4` / `priority={true}` | `priority={false}` | Below-the-fold |

### 1.3 Touch targets chrome (**IMPLEMENTATO**)

| Componente | Tecnica | UX visiva |
|------------|---------|-----------|
| `Header` square buttons | `::before` hit-area (−6px / md −2px) | Icone/bordi invariati |
| `MobileNavBar` tab | `min-h-[44px]` su celle già `h-full` | Layout barra invariato |
| FAB Diario | già 56×56 | Invariato |

---

## STEP 2 — Strutturale leggero

### 2.1 AI fuori chunk iniziale Home (**IMPLEMENTATO**)

| Evidenza | Fix |
|----------|-----|
| `useHeroLogic` importava staticamente `aiChat` → `aiGateway` | `import()` di `aiChat` / `aiEdgeErrors` solo in `handleAiSubmit` |
| `getAiRuntimeStatus` | **Rimasto** sync (modulo leggero, no gateway) — necessario al banner |

**Regressione evitata:** submit chat invariato; primo invio paga il carico del chunk AI.

### 2.2 Breakpoint unificati (**IMPLEMENTATO**)

| SoT | Valore |
|-----|--------|
| `LAYOUT.BREAKPOINTS.MD` | 768 |
| `LAYOUT.BREAKPOINTS.LG` | 1024 |
| `MOBILE_COMPACT_MAX_WIDTH_PX` | `MD - 1` |
| `HERO_STACKED_MAX_WIDTH_PX` | `LG - 1` |
| `DESKTOP_MIN_QUERY` | `min-width: LG` |

Magic number 768/1024 sostituiti con costanti (stesse soglie → **nessun cambio UX tablet**).  
`useIsMobile` = alias di `useMobileDetect`.

---

## File toccati (principali)

- `index.html`
- `src/components/home/HomeContent.tsx`
- `src/components/home/CuratedGridSection.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/MobileNavBar.tsx`
- `src/hooks/ui/useHeroLogic.ts`
- `src/hooks/ui/useIsMobile.ts`
- `src/constants/breakpoints.ts`
- + file con confronti viewport allineati a `LAYOUT` / `DESKTOP_MIN_QUERY`

---

## Smoke test

1. Home cold start: hero visibile; Network senza chunk `aiChat` finché non si invia un messaggio AI.
2. Home: featured/curated lazy (no `fetchpriority=high` di massa).
3. Font: titoli Playfair bold/black e Caveat bold OK; onboarding valigia Caveat default OK.
4. Header mobile: tap meteo/GPS/menu con hit area ≥44px senza icone più grandi.
5. Resize 767 / 768 / 1023 / 1024: stessi comportamenti di prima (shell / compact).

---

## Prossimi workflow (NON questo)

- Guard `visualViewport.scale` + decisione zoom  
- Context/Provider profiling  
- PWA/SW  
- Layout tablet dedicato  
