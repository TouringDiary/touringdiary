# S-CARD-ROW — HISTORY (registro storico chiuso)

> **Ruolo:** storico completo dell’audit / decisioni PO / contratto §11 / consuntivo bonifica.  
> **Non è il documento operativo.** Il lavoro ancora aperto è in [`S-CARD-ROW_OPEN_DELTA.md`](./S-CARD-ROW_OPEN_DELTA.md).  
> **Hub SoT / alias:** [`AUDIT_S_CARD_ROW_32.md`](./AUDIT_S_CARD_ROW_32.md).  
> **SoT numerica Biome:** [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md).  
> **Census cluster:** `scripts/_tmp_static101_manual_class.cjs` (macro `S-CARD-ROW`).  
> **Review correlata:** [`BIOME_101_FOLLOWUP_AUDIT_CARD_STOPPROP_SPECIALS.md`](./BIOME_101_FOLLOWUP_AUDIT_CARD_STOPPROP_SPECIALS.md).

**Separazione 2026-08-20:** questo file conserva **tutto lo storico** (CARD chiuse, congelate, dead code, pattern, §11, changelog). Il delta operativo non duplica le schede chiuse.

---

## 1. Snapshot (storico — stato al consuntivo 2026-08-20)

| Campo | Valore |
|-------|--------|
| **Regola** | `lint/a11y/noStaticElementInteractions` |
| **Hit live complessivi (regola, tutti i cluster)** | **85** (contesto audit 2026-08-16 — storico census) |
| **Hit nel cluster S-CARD-ROW (census iniziale)** | **32** |
| **File distinti nel cluster** | **30** (`ShowcaseCards.tsx` ×2, `Sidebar.tsx` ×3) |
| **Data / contesto** | 2026-08-16 creato · 2026-08-18 decisioni PO chiuse · 2026-08-19 contratto §11 + **implementazione bonifica** · **2026-08-20 consuntivo documentale post-implementazione** |
| **Stato cluster** | **STORICO CHIUSO.** Contratto §11 implementato e consolidato. Lavoro operativo residuo → [`S-CARD-ROW_OPEN_DELTA.md`](./S-CARD-ROW_OPEN_DELTA.md) (solo CARD-32 + smoke consigliati). |
| **Scopo attuale** | Archivio permanente: percorsi UI, decisioni PO, pattern, motivazioni di chiusura, consuntivo §11.7. **Non** aggiungere qui nuovi task aperti. |

**Residuo Biome (cluster):** l’unico hit intenzionale residuo oggetto della bonifica è `SuitcaseItemRow` (CARD-19) sullo shell drop-target HTML5 (`onDragOver` / `onDragLeave` / `onDrop`). **Non** dichiarare «Biome = 0» sul cluster intero. Hit su CARD-27/28 (congelate) e CARD-32 (deferred) restano fuori dal ciclo di bonifica.

**Nota su numerazione CARD:** CARD-01…CARD-32 è la numerazione **prodotto/PO** usata in questa discussione. Non coincide 1:1 con i codici C01…C32 del documento follow-up 101 (ordine diverso). Qui vale sempre la mappa file/riga sotto ogni CARD.

---

## 2. Regole metodologiche

1. Ogni CARD deve essere ricondotta alla **UI reale** dell’app (percorso passo-passo).
2. Non sono ammesse descrizioni astratte del tipo «si trova nello Shop» senza percorso.
3. Ogni percorso deve partire da un punto d’ingresso riconoscibile (Home, menu, Admin, mobile nav, ecc.).
4. Se il percorso non è verificabile dal codice/UI, si scrive **PERCORSO UI NON VERIFICABILE** e si documenta il gap.
5. Nessun fix applicativo salvo dove il PO autorizza esplicitamente (es. CARD-20/21 in giro 2026-08-17).
6. Le **decisioni PO** sono separate dai **fatti** rilevati nel codice.
7. I fatti tecnici **non** diventano automaticamente decisioni prodotto.
8. Distinzione obbligatoria:
   - **FATTO** — verificato in codice / mount / handler
   - **DECISIONE PO** — comportamento desiderato dichiarato dal PO
   - **DUBBIO** — non ancora chiarito
   - **IPOTESI** — interpretazione non verificata
9. Nomenclatura interna del codice (es. «snap», «lightbox») solo **dopo** aver descritto cosa vede l’utente.
10. Questo file si **aggiorna** a ogni giro di audit: non cancellare decisioni/dubbi precedenti; quando un dubbio si risolve, aggiornare lo stato e annotare che il dubbio è stato risolto.

---

## 2bis. REGOLA GENERALE PO — S-CARD-ROW (2026-08-18)

> Ogni controllo visibile che ha una **propria funzione** deve essere cliccabile e deve eseguire **esclusivamente** quella funzione.  
> La **superficie restante** della card/riga esegue l’**azione principale** dell’oggetto.  
> Il click su un controllo interno **non** deve propagare l’azione principale.

Esempio card POI: MAPS / 3D / DA QUI / ADD / 👍 / VALUTA / preferito / ⋮⋮ / ✏️ Admin = solo la loro funzione; superficie libera = apre il POI.

Stessa logica per card città, sponsor, Shop e card analoghe. **Non** introdurre eccezioni arbitrarie se il comportamento è riconducibile a questa regola.

**Implicazione Biome:** la soluzione strutturale deve rappresentare questa gerarchia (superficie principale + controlli indipendenti), non solo far sparire il warning.

---

## 2ter. Snapshot REVIEW — POST-IMPLEMENTAZIONE (aggiornato 2026-08-20)

> Snapshot **storico 2026-08-19 (pre-implementazione)** sostituito da questa classificazione finale. La cronologia resta in §7 Changelog e in §11.7.

| Gruppo | CARD | Stato finale | Note |
|--------|------|--------------|------|
| **Bonifica implementata** | 01, 02, 03, 04, 05, 06, 09, 12, 13, 14, 15, 16, 18, 19, 22, 23, 24, 26, 29, 31 | **IMPLEMENTATO** | Contratto §11 applicato (P-SURFACE / P-SIMPLE / micro-delta / funzionale 18) |
| **Verify-only conformi** | 07, 08, 10, 11, 17, 20, 21, 25 | **VERIFY OK** | Già conformi; verificati in bonifica, nessun fix richiesto |
| **Prodotto congelato** | 27, 28 | **RIMANDATA** | Strategia città/comuni — **non** bonificare |
| **Dead code rimosso** | 30 | **CHIUSA** | `CityHistory` eliminato; non ripristinare |
| **Deferred** | 32 | **DEFERRED** | `ImageWithFallback` — fine audit; non affrontata in questo ciclo |

### Residuo Biome CARD-19 (strutturale — non “problema aperto”)

CARD-19 mantiene un hit `noStaticElementInteractions` sullo shell `SuitcaseItemRow` **esclusivamente** per `onDragOver` / `onDragLeave` / `onDrop`.

Questo **NON** è un residuo accidentale della vecchia surface:
- la **surface** è ora un `<button type="button">` (select);
- lo **shell** `div` deve rimanere **drop target** HTML5;
- gli eventi drag/drop devono continuare a funzionare (bubble verso controlli `pointer-events-auto`);
- l’hit è un **fatto strutturale** del drop target HTML5;
- **non** va silenziato con `biome-ignore`, né convertendo lo shell in button, né spostando i drag handler sulla surface.

**Domande PO aperte:** nessuna.

**Prossimo capitolo operativo (fuori da questo consuntivo):** solo CARD-32, quando esplicitamente avviata.

---

## 3. Registro CARD-01 … CARD-32

> **Nota consuntivo 2026-08-20:** le sottosezioni sotto restano il registro storico (percorsi UI, decisioni PO, evidenze). Dove lo «STATO AUDIT» parlava ancora di bonifica da progettare, lo **Stato finale** è quello di §2ter / §11.7 (**IMPLEMENTATO** / **VERIFY OK** / **RIMANDATA** / **CHIUSA** / **DEFERRED**). Non è una riscrittura retroattiva della storia.

---

### CARD-01 — Card città (griglia Home)

**File:** `src/components/city/CityCard.tsx`  
**Riga/hit:** 142  
**Componente:** `CityCard`

#### A. DOVE SI TROVA NELL’UI

**FATTO:** sulla **Home** (`/`), nelle sezioni orizzontali **In Evidenza** e **Le Più Visitate**: rettangolo verticale con foto della città, nome, zona, stelle e (in alto a destra nell’area testo) un **cuore preferiti**.

**FATTO (uso secondario):** anche nell’editor Admin città (anteprima Media) — non è il percorso utente principale.

#### B. PERCORSO UI PRECISO

1. Aprire l’app → Home.
2. Scorrere fino alla sezione **In Evidenza** (slider orizzontale) **oppure** **Le Più Visitate**.
3. Nella striscia compare la card città (foto + nome).
4. Cliccare **sulla superficie della card** (non sul cuore).

**Condizioni:** catalogo città disponibile. Preferiti: se guest, il cuore tipicamente richiede autenticazione (comportamento del bottone preferiti, non della card).

#### C. COSA VEDE L’UTENTE

Una card città “alta” con immagine di copertina, nome, eventuale badge di sezione, rating; cuore in overlay.

#### D. COSA SUCCEDE OGGI

**FATTO:** `onClick` sulla card → `onClick(city.id)` → navigazione al dettaglio città.  
**FATTO:** cuore = `FavoriteBookmarkButton` con isolamento dal click della card (non apre la città).

#### E. DECISIONE PO

**CONFERMATA (2026-08-17):**

- L’intera card continua ad aprire il dettaglio della città.
- Il cuore continua a gestire il preferito **senza** aprire il dettaglio.

#### F. DUBBI / DOMANDE APERTE

- *(Risolto in questo giro)* Dove compare in Home: **In Evidenza** e **Le Più Visitate** (call-site in `HomeContent.tsx`).
- Differenza prodotto rispetto a CARD-02: vedi CARD-02 §F.

#### G. EVIDENZA DA CODICE

- Hit: `CityCard.tsx` ~142 `div.onClick={() => onClick(city.id)}`
- Mount pubblico: `HomeContent.tsx` (In Evidenza / Più Visitate)
- Preferito nested: stesso file, area cuore con stopPropagation

#### H. STATO AUDIT

**DECISO** (comportamento) · percorso UI **verificato** (Home)

---

### CARD-02 — Mini tile città («Ispirazioni di Viaggio»)

**File:** `src/components/home/CuratedGridSection.tsx`  
**Riga/hit:** 17  
**Componente:** `MiniCityCard` (locale, non esportato)

#### A. DOVE SI TROVA NELL’UI

**FATTO:** Home → blocco **Ispirazioni di Viaggio** → griglie tematiche (es. Destinazioni Top, Eventi in Arrivo, Ideale Stagione, Trend del Mese, Scelta Editoriale). Tile **quadrate** più piccole: solo foto + nome, **senza cuore**.

#### B. PERCORSO UI PRECISO

1. Home.
2. Scorrere sotto In Evidenza / Partner fino a **Ispirazioni di Viaggio**.
3. Nella griglia della sottosezione, cliccare la mini-tile città.

**Condizioni:** `cityManifest` con città per le griglie curated.

#### C. COSA VEDE L’UTENTE

Riquadro quadrato compatto: foto città + nome. Nessun cuore preferiti sulla tile.

#### D. COSA SUCCEDE OGGI

**FATTO:** click → `onCityClick(city.id)` — **stesso tipo di navigazione** del dettaglio città di CARD-01.

#### E. DECISIONE PO

- La mini-tile deve continuare ad aprire la città.
- È semplicemente una **variante visiva** più compatta della card città, in altra sezione.
- **NON** modificarla.
- *(Dubbio precedente sull’unificazione funzionale con CARD-01: **RISOLTO** — non serve più discuterlo.)*

#### F. DUBBI / DOMANDE APERTE

Nessuno.

#### G. EVIDENZA DA CODICE

- `CuratedGridSection.tsx` MiniCityCard ~17
- Solo call-site: `HomeContent.tsx` → `CuratedGridSection`

#### H. STATO AUDIT

**DECISO** · percorso UI **verificato**

---

### CARD-03 — Card itinerario (Community → Itinerari)

**File:** `src/components/itineraries/ItinerariesList.tsx`  
**Riga/hit:** 53  
**Componente:** `ItinerariesList`

#### A. DOVE SI TROVA NELL’UI

Schermata a tutto schermo **Community Hub** → tab **Itinerari** → colonna/lista di itinerari a sinistra (cover, titolo, badge tipo).

#### B. PERCORSO UI PRECISO

1. Home (o qualsiasi schermata con Sidebar aperta).
2. Nella colonna Diario (Sidebar desktop) cliccare **Community**  
   **oppure** su mobile barra inferiore **Social**.
3. Si apre **Community Hub**.
4. Tab **Itinerari**.
5. Nella lista, cliccare la card dell’itinerario.

**Condizioni:** elenco itinerari community disponibile. Like richiede utente non-guest.

#### C. COSA VEDE L’UTENTE

Card itinerario con immagine di copertina, titolo, eventuali badge (es. Touring Diary / Community / Smart Trends), cuore like.

#### D. COSA SUCCEDE OGGI

**FATTO:** click card → `onSelect(itinerary)` → selezione nell’explorer (dettaglio a destra / pannello).  
**FATTO:** cuore → like con isolamento dal click card.

#### E. DECISIONE PO

- Click sulla card = selezione dell’itinerario.
- Cuore = like.
- Like indipendente dalla selezione.

#### F. DUBBI / DOMANDE APERTE

Nessuno sul comportamento primario.

#### G. EVIDENZA DA CODICE

- `ItinerariesList.tsx` ~53
- Parent: `ItinerariesExplorer` ← `GlobalSectionView` tab `diari` (label UI **Itinerari**)

#### H. STATO AUDIT

**DECISO** · percorso UI **verificato**

---

### CARD-04 — Card bottega (Shop)

**File:** `src/components/shop/ShopCard.tsx`  
**Riga/hit:** 39  
**Componente:** `ShopCard`

#### A. DOVE SI TROVA NELL’UI

Overlay **Shop** → vista categoria (es. Gusto, Cantina, …) → lista/griglia di botteghe.

#### B. PERCORSO UI PRECISO

1. Home → aprire una **città**.
2. Nell’header città, se lo shop pubblico è abilitato, cliccare l’icona **carrello** (apre Shop).
3. Nella home Shop scegliere una **categoria**.
4. Nella lista categoria compare la card bottega.
5. Cliccare la card (non il cuore).

**Condizioni:** feature/flag shop pubblico; botteghe nella categoria.  
**IPOTESI:** altri entry (POI shop, Around Me) possono aprire lo stesso overlay — da verificare caso per caso se serve al PO.

#### C. COSA VEDE L’UTENTE

Card bottega (foto, nome, rating, eventuali chip prodotto, cuore preferito).

#### D. COSA SUCCEDE OGGI

**FATTO:** click → `onOpen(shop)` → dettaglio bottega.  
**FATTO:** cuore preferito isolato.

#### E. DECISIONE PO

- Click card = apertura della bottega.
- Cuore = preferito senza cambiare destinazione.

#### F. DUBBI / DOMANDE APERTE

Elenco completo di **tutti** gli entry point verso Shop (se rilevante per smoke test).

#### G. EVIDENZA DA CODICE

- `ShopCard.tsx` ~39
- Parent: `ShopCategoryView` ← `ShopPage`

#### H. STATO AUDIT

**DECISO** · percorso primario **verificato** · entry multipli **PARZIALE**

---

### CARD-05 — Foto galleria città

**File:** `src/components/city/gallery/GalleryGrid.tsx`  
**Riga/hit:** 50  
**Componente:** `PhotoCard` (in `GalleryGrid`)

#### A. DOVE SI TROVA NELL’UI

Pagina **dettaglio città** → tab **Galleria** → griglia/slider di foto community.

#### B. PERCORSO UI PRECISO

1. Home → cliccare una città (CARD-01/02 o altro).
2. Nella pagina città, aprire il tab **Galleria**.
3. Nella griglia, cliccare una **foto** (non il cuore).

**Condizioni:** città con foto caricate.

#### C. COSA VEDE L’UTENTE

Tile fotografica; cuore like in overlay.

#### D. COSA SUCCEDE OGGI

**FATTO:** click foto → apre la visualizzazione ingrandita della foto (nel codice: lightbox galleria via `onOpenLightbox`).  
**FATTO:** cuore → like isolato (guest → auth).

#### E. DECISIONE PO

- Click foto = apertura della foto.
- Cuore = like.

#### F. DUBBI / DOMANDE APERTE

*(Risolto)* Percorso: città → tab **Galleria**.  
Differenza vs CARD-12: vedi CARD-12 §F.

#### G. EVIDENZA DA CODICE

- `GalleryGrid.tsx` ~50
- Parent: `CityGallery` ← `CityDetailContent` tab galleria

#### H. STATO AUDIT

**DECISO** · percorso UI **verificato**

---

### CARD-06 — Card POI orizzontale (Vetrina città — TOP 5)

**File:** `src/components/city/ShowcaseCards.tsx`  
**Riga/hit:** 138  
**Componente:** `UniversalCard` variante orizzontale (`HorizontalCard`)

#### A. DOVE SI TROVA NELL’UI

**FATTO fondamentale:** compare in una **lista di POI sulla pagina città**, **prima** di aprire il dettaglio POI. Non è un controllo “dentro” il dettaglio POI già aperto.

Sezione tipica: tab **Vetrina** → sottosezioni **TOP 5 | COMMUNITY** / **TOP 5 | NATURA** — card larghe a tutta foto.

#### B. PERCORSO UI PRECISO

1. Home → aprire una città.
2. Tab **Vetrina**.
3. Sottotab / sezione **TOP 5** (Community o Natura).
4. Nella lista TOP 5 compare la card POI orizzontale.
5. Cliccare la **superficie della card** → si apre il dettaglio POI (finestra/modale dettaglio).
6. **Dopo** che il dettaglio è aperto, like / + / drag **non** sono “riaprire il POI”: sono azioni sul POI (like, aggiungi al diario, trascina nel diario). Sulla card in lista, gli stessi controlli nested restano isolati dal click che apre il dettaglio.

**Condizioni:** POI presenti nella categoria/TOP 5 della città.

#### C. COSA VEDE L’UTENTE

Card orizzontale grande con foto del luogo, nome; in basso/azioni: cuore like, pulsante **+** (aggiungi al diario), su desktop anche maniglia di trascinamento.

#### D. COSA SUCCEDE OGGI

**FATTO (pre-2026-08-18):** `draggable` sulla superficie card → drag partiva dalla card intera; grip spesso solo decorativo.  
**FATTO (post-fix 2026-08-18):** superficie = solo `onOpenDetail`; grip `⋮⋮` = unico `draggable` + payload JSON POI (`ShowcaseCards` ActionRow; `CityGuide` grip button).

**Chiarimento comportamento prodotto (non più ambiguo):**  
in lista, click card = apri POI; click controlli = le loro funzioni; i controlli **non** devono anche aprire il POI; drag **solo** dal grip.

#### E. DECISIONE PO

**CONFERMATA (2026-08-17) + DRAG DEFINITIVO (2026-08-18):**

- superficie libera → apre il dettaglio POI;
- like → like;
- + → aggiunge al Diario;
- drag handle `⋮⋮` → **esclusivamente** trascinamento nel Diario;
- trascinando dalla restante superficie → **non** parte il drag;
- matita Admin (dove presente, tipicamente lista CityGuide) → solo modifica POI (non apre anche il dettaglio).

#### F. DUBBI / DOMANDE APERTE

Nessuno.

#### G. EVIDENZA DA CODICE

- `ShowcaseCards.tsx` ActionRow grip `draggable={!isMobile}` (orizzontale); superficie senza `draggable`
- `CityGuide.tsx` grip button + superficie button solo open detail
- Parent tipico: `CityShowcaseTab` (TOP 5)

#### H. STATO AUDIT

**DECISO** · drag grip-only **verificato in codice (2026-08-18 REVIEW)** ·  
**Nota:** la matita Admin **non** è sulla card orizzontale TOP 5 (`UniversalCard`); è sulla **riga lista Guida città** (`CityGuide`) — stesso contratto prodotto «matita = solo modifica».  
Biome: hit ancora su `ShowcaseCards` (superficie `div` + ActionRow wrapper). CityGuide: Biome 0.

---

### CARD-07 — Card POI verticale / Shop PARTNER (standardizzata su sponsor Home)

**File hit Biome (storico):** `ShowcaseCards.tsx` (`UniversalCard` verticale)  
**Riferimento prodotto Shop PARTNER:** `SponsorSideCard` (stesso di CARD-08 Home)  
**Montaggio Shop:** `ShopCategoryView` → `ShopPartnerColumn` → `SponsorSideCard`

#### E. DECISIONE PO (2026-08-18) — CONFERMATA

- superficie libera → apre dettaglio POI;
- controlli interni → solo le rispettive funzioni (nessuna doppia apertura POI);
- **standardizzazione obbligatoria** con CARD-08: stessa tipologia card sponsor Home↔Shop PARTNER → stesso componente/pattern (`SponsorSideCard`);
- non eliminare controlli della card standard Home: devono essere presenti anche in Shop PARTNER;
- layout Shop: **PARTNER | LISTA | PARTNER** (sempre 3 colonne); colonne PARTNER = larghezza card standard; lista centrale = spazio restante.

#### IMPLEMENTAZIONE

**Card condivisa:** `SponsorSideCard` (Home + `ShopPartnerColumn`).  
Contratto: superficie → POI; grip desktop → drag; + → Diario; **nessun like** (come Home).  
**Layout:** `lg:grid-cols-[19rem_minmax(0,1fr)_19rem]` PARTNER|LISTA|PARTNER.

#### H. STATO AUDIT

**DECISO** · standardizzazione + layout **implementati** · **VERIFY OK** su `SponsorSideCard` (bonifica §11)

**Stato finale (post-bonifica §11.7):** **VERIFY OK**

---

### CARD-08 — Sponsor POI in Home (area PARTNER) — RIFERIMENTO per CARD-07

**File:** `src/components/common/SponsorSideCard.tsx` (ex `HomeSideSponsorCard` in HomeContent)  
**Riga/hit (storico):** HomeContent  
**Componente:** `SponsorSideCard`

#### A. DOVE SI TROVA NELL’UI

Home → area **PARTNER** (affianco a In Evidenza e/o griglia partner in basso): card sponsor con foto, badge SPONSOR, nome POI.

#### B. PERCORSO UI PRECISO

1. Home.
2. Individuare la colonna/area etichettata **PARTNER**.
3. Se c’è uno sponsor gold caricato, compare la card (altrimenti slot tratteggiato = CARD-31).
4. Cliccare la card → dettaglio POI sponsor.
5. Pulsante **+** = aggiungi al diario; maniglia drag (desktop) = trascina nel diario — **non** sono “riaprire il POI”.

**Condizioni:** POI sponsor risolti; altrimenti AdPlaceholder.

#### REGOLA PRODOTTO — UNIQUE SPONSOR PER HOME (2026-08-19)

**CONFERMATA / VINCOLO:** nella Home, **uno stesso sponsor** (identità = `ResolvedSponsor.id` contratto) può occupare **al massimo un solo slot PARTNER** contemporaneamente.

- Slot liberi → `AdPlaceholder` cliccabile (flusso sottoscrizione, CARD-31).
- Vietato ripetere lo stesso sponsor su tutti gli slot via wrap modulo.
- Selezione Gold: allineata al percorso città (`tier === 'gold'` e/o `type === REGIONAL_ACTIVITY`), non solo colonna `type` grezza.

#### VERIFICA REGRESSIONE HOME PARTNER — 2026-08-19

**FATTO (diff bonifica):**
- `AdPlaceholder`: root `div` → `<button type="button">` senza `w-full` → geometria slot tratteggiata alterata (button non block-full come il div).
- `SponsorSideCard` (estratto da `HomeSideSponsorCard`): layer media / z-index / `cursor-default` / `w-full h-full` sul media non più allineati a HEAD → proporzioni card percepibili diverse.
- Colonne Home (`md:w-72`, `h-[280px] md:h-[240px]`, gap) **non** toccate dalla bonifica.

**REGRESSIONE VISIVA:** box PARTNER Home sembravano cambiati di forma/dimensione.

**CAUSA:** classi geometriche card/placeholder alterate per il passaggio a button/surface, non il grid Home.

**CORREZIONE:**
- `SponsorSideCard`: ripristinate classi layout HEAD (`cursor-default`, media `absolute inset-0 w-full h-full`, `z-home-card-overlay`); surface button semantica **mantenuta**.
- `AdPlaceholder`: aggiunto `w-full` alle baseStyles; call-site Home passano `h-full w-full`.

**SPONSOR GOLD ASSENTE IN HOME:**
- Percorso città: `fetchSponsorsByCityAsync(cityId)` → filter UI `tier === 'gold'`.
- Percorso Home (prima): `fetchActiveSponsorsResolvedAsync()` → filter `type === REGIONAL_ACTIVITY` **solo**.
- `mapDbSponsorToApp` / `mapResolvedSponsor`: `tier` da `pricing_versions.plans.type` (SoT); `type` da colonna `sponsors.type` (default LOCAL se assente).
- **Punto di perdita:** sponsor Gold con pricing REGIONAL ma `type` colonna non REGIONAL → escluso da Home, incluso in città.

**CORREZIONE GOLD:** Home filtra **`tier === 'gold'`** (stesso contratto città / runtime post-resolver). L’OR `|| type === REGIONAL_ACTIVITY` è stato rimosso: troppo permissivo se colonna `type` e pricing divergono. Unicità: `ResolvedSponsor.id` + griglia bassa esclude id già in area superiore.

**SLOT UNICI (intera Home):** dedupe su `ResolvedSponsor.id` in fetch; area superiore (`sponsorsToDisplay`) senza wrap modulo; griglia inferiore (`goldGridSlots`) = sponsor **non** già presenti nell’area superiore → slot restanti `AdPlaceholder`. Un id contratto → al massimo **un** rendering contemporaneo in tutta la Home.

#### C. COSA VEDE L’UTENTE

Card fotografica sponsor con badge; azioni + e drag in basso a destra. **Nessuna matita Admin** (verifica PO).

#### D. COSA SUCCEDE OGGI

**FATTO:** click superficie → `onOpenDetail(poi)` → `poiDetail`.  
**FATTO:** + / grip isolati.

#### E. DECISIONE PO

**CONFERMATA** — riferimento reale per standardizzare CARD-07:

- superficie libera → apre POI sponsor;
- + → Diario;
- drag (dove presente) → Diario;
- **non** introdurre matita Admin su questa card.

#### F. DUBBI / DOMANDE APERTE

Nessuno.

#### G. EVIDENZA DA CODICE

- `SponsorSideCard.tsx`; mount Home (`HomeContent`) + Shop (`ShopPartnerColumn`)

#### H. STATO AUDIT

**DECISO** · **riferimento standard** CARD-07 · **VERIFY OK** (bonifica §11)

**Stato finale (post-bonifica §11.7):** **VERIFY OK**

---

### CARD-09 — Sponsor «Partner d'Eccellenza» (Diario mobile fullscreen)

**File:** `src/components/layout/Sidebar.tsx` (~352)  
**Mount:** branch `mobileDiaryFullScreen` / keepDiaryMountedDuringTransition  
**Componente:** markup **inline** (non `SponsorSideCard`)

#### PERCORSO UI

1. Viewport **mobile**.
2. Barra inferiore → **Diario** a schermo intero.
3. Sotto la timeline → striscia **Partner d'Eccellenza** (foto piccola + label + nome + **+**).
4. Click area libera / foto / nome → dettaglio POI sponsor.
5. Click **+** → flusso aggiungi al Diario (non apre il dettaglio).
6. **Nessuna** maniglia `⋮⋮` in questo layout (non va aggiunta artificialmente).

#### DECISIONE PO (2026-08-18 sera2) — CHIUSA

Uniformare il **contratto interattivo** a CARD-08 (riferimento comportamentale).  
**NON** uniformare dimensione, densità, layout o componente visuale. Layout mobile proprio = legittimo.

Contratto:
1. superficie principale → apre POI sponsor;
2. **+** → aggiunge al Diario;
3. drag handle solo se presente nel layout; qui **assente** → OK;
4. controlli interni indipendenti dalla superficie.

#### FATTO TECNICO (codice attuale)

- Superficie: `<div onClick={() => openModal('poiDetail', { poi: sponsorPoi })}>`.
- **+**: `<button>` con `stopPropagation` → `openModal('add', { poi: sponsorPoi })`.
- Grip: assente.
- Non usa `SponsorSideCard` (Home/Shop).

#### DISCREPANZA DA BONIFICARE

- **Prodotto vs contratto:** comportamento click allineato a CARD-08 (superficie / +). Nessuna discrepanza prodotto su azioni.
- **Tecnico / Biome:** superficie = `div` + `onClick` → hit `noStaticElementInteractions` su Sidebar; struttura diversa da `SponsorSideCard` (surface `button` sibling). Eventuale condivisione di **handler/contratto** in bonifica futura **senza** forzare stesso layout.

#### H. STATO AUDIT

**DECISO (contratto)** · layout mobile proprio **legittimo** · **IMPLEMENTATO** surface Sidebar (§11.7) · nessuna domanda PO

**Stato finale (post-bonifica §11.7):** **IMPLEMENTATO**

---

### CARD-10 — Sponsor companion Diario (desktop + Valigia)

**File:** `src/components/layout/Sidebar.tsx` (~676 companion portaled)  
**Mount:** `isCompanionPortaled` (workspace `packingList` + Sidebar aperta) via `createPortal`  
**Componente:** markup **inline** (non `SponsorSideCard`)

#### PERCORSO UI

1. Desktop → colonna Diario aperta.
2. Apri **Valigia** (focus packingList).
3. Diario resta in striscia companion a sinistra; sotto compare card sponsor (o AdPlaceholder).
4. Click superficie → `poiDetail`.
5. Click **+** → `openModal('add')`.
6. Maniglia `⋮⋮` (desktop hover) → **solo** drag (`draggable`; `onClick` = solo `stopPropagation`).

#### DECISIONE PO (2026-08-18 sera2) — CHIUSA

Stesso **contratto** CARD-08; layout companion proprio (dimensioni/densità diverse = OK).  
Grip, se presente: esclusivamente drag; click sul grip **non** esegue +.

#### FATTO TECNICO (codice attuale)

- Superficie: `<div onClick → poiDetail>`.
- **+**: button → `add` + `stopPropagation`.
- Grip: `button` `draggable="true"`; `onDragStart` setta `text/plain` JSON POI; `onClick={(e) => e.stopPropagation()}` (click→add **già rimosso** in review precedente).
- Markup duplicato vs CARD-08/`SponsorSideCard`.

#### DISCREPANZA DA BONIFICARE

- Contratto prodotto: **allineato** (superficie / + / grip-only).
- Tecnico: `div` surface → Biome hit; tre markup Sidebar vs un `SponsorSideCard`. Bonifica futura: allineare semantica a11y / event isolation **mantenendo** layout companion.

#### H. STATO AUDIT

**DECISO (contratto)** · grip solo-drag **verificato** · **VERIFY OK** companion (§11.7) · nessuna domanda PO

**Stato finale (post-bonifica §11.7):** **VERIFY OK**

---

### CARD-11 — Sponsor colonna Diario desktop (`#tour-sponsor-box`)

**File:** `src/components/layout/Sidebar.tsx` (~772)  
**Mount:** Sidebar desktop **non** portaled (Valigia non in companion)  
**Componente:** markup **inline** (non `SponsorSideCard`)

#### PERCORSO UI

1. Desktop → Diario aperto, Valigia **non** in focus companion.
2. Fondo colonna Diario → box sponsor.
3. Superficie → POI; **+** → add; `⋮⋮` → solo drag.

#### DECISIONE PO (2026-08-18 sera2) — CHIUSA

Stesso contratto CARD-08; layout Sidebar proprio. Differenze visuali vs Home/Shop = legittime.

#### FATTO TECNICO / DISCREPANZA

Identico profilo di CARD-10 (stesso pattern inline Sidebar). Contratto OK; Biome hit su surface `div`; struttura ≠ `SponsorSideCard`.

#### H. STATO AUDIT

**DECISO (contratto)** · layout proprio OK · **VERIFY OK** `#tour-sponsor-box` (§11.7) · nessuna domanda PO

**Stato finale (post-bonifica §11.7):** **VERIFY OK**

---

### 3bis. Contratto trasversale — Sponsor POI (CARD-08 / 09 / 10 / 11)

**DECISIONE PO (2026-08-17) — unica regola prodotto:**

> Ogni box/card che rappresenta lo sponsor:

| Azione | Comportamento |
|--------|----------------|
| Click sulla card | Apre il **POI sponsor** (dettaglio) |
| Pulsante **+** (se presente) | Aggiunge il POI al diario |
| Drag/grip (se presente) | Consente di trascinarlo nel diario |

**Montaggi (solo differenze di layout UI, non di prodotto):**

| CARD | Contesto UI |
|------|-------------|
| 08 | Home → area PARTNER |
| 09 | Mobile → Diario fullscreen → Partner d'Eccellenza |
| 10 | Desktop → Valigia focus → Diario companion → sponsor |
| 11 | Desktop → Sidebar Diario standard → `#tour-sponsor-box` |

**FATTO:** tutti usano lo stesso `sponsorPoi` derivato da `sidebarSponsor` / conversione POI, e aprono `poiDetail` (tranne placeholder = CARD-31).

---

### CARD-12 — Foto classifiche complete

**File:** `src/components/rankings/PhotoGrid.tsx`  
**Riga/hit:** 29  
**Componente:** `PhotoGridItem` / `PhotoGrid`

#### A. DOVE SI TROVA NELL’UI

Finestra **Classifiche** (titolo «Classifiche» / «Il meglio della Campania») → tab **Foto** → griglia foto ranked.

**Importante:** **non** è il tab «Classifiche» dentro Community Hub (`RankingTab` XP travelers). Sono due UI diverse.

#### B. PERCORSO UI PRECISO

1. Sidebar (Home, senza città attiva tipicamente mostra widget TOP 5).
2. Nel box classifiche laterale, cliccare la **freccetta** in alto a destra del blocco TOP 5 («Apri classifiche complete»).
3. Si apre la finestra **Classifiche**.
4. Tab **Foto**.
5. Cliccare una tile foto.

**Condizioni:** modal `fullRankings` aperta; dati foto ranked.

#### C. COSA VEDE L’UTENTE

Griglia di foto con numero di rank; cuore like.

#### D. COSA SUCCEDE OGGI

**FATTO:** click → `openGalleryPhoto` → visualizzazione ingrandita. Cuore like nested.

#### E. DECISIONE PO

- Click foto = apertura foto.
- Cuore = like.

#### F. DUBBI / DOMANDE APERTE

*(Risolto)* Percorso: Sidebar TOP 5 → freccia → Classifiche → tab Foto.  
**Differenza vs CARD-05:** CARD-05 = galleria **della città** (tab Galleria della pagina città). CARD-12 = classifica **globale** foto community nella modal Classifiche. Stesso tipo di gesto (apri foto + like), **contesto diverso**.

#### G. EVIDENZA DA CODICE

- `PhotoGrid.tsx` ~29
- Parent: `FullRankingsModal` tab `gallery`
- Entry: `Sidebar` `onOpenFullRankings` → `openModal('fullRankings')`

#### H. STATO AUDIT

**DECISO** · percorso UI **verificato**

---

### CARD-13 — Riga POI classifiche complete

**File:** `src/components/rankings/PoiList.tsx`  
**Riga/hit:** 15  
**Componente:** `PoiList` (rankings — distinto dall’omonimo admin)

#### A. DOVE SI TROVA NELL’UI

Stessa finestra **Classifiche** di CARD-12 → tab **Luoghi** → lista POI ranked.

#### B. PERCORSO UI PRECISO

1. Come CARD-12 fino alla finestra Classifiche.
2. Tab **Luoghi** (non «Foto», non «Città»).
3. Cliccare la riga del POI.

**Condizioni:** come CARD-12.

#### C. COSA VEDE L’UTENTE

Riga lista con rank, nome luogo, voti/metriche.

#### D. COSA SUCCEDE OGGI

**FATTO:** click → `onOpenPoi(poi)` → dettaglio POI.

#### E. DECISIONE PO

- Click riga = apertura del POI.

#### F. DUBBI / DOMANDE APERTE

*(Risolto)* Percorso raggiungibile via Classifiche complete → Luoghi.  
Non è orphan.

#### G. EVIDENZA DA CODICE

- `rankings/PoiList.tsx` ~15
- `FullRankingsModal` tab `pois` + `RankingFilters` label **Luoghi**

#### H. STATO AUDIT

**DECISO** · percorso UI **verificato**

---

### CARD-14 — Foto grande bottega (hero shop)

**File:** `src/components/shop/ShopHero.tsx`  
**Riga/hit:** 52  
**Componente:** `ShopHero`

#### A. DOVE SI TROVA NELL’UI

Dentro una **bottega aperta**: fascia superiore a tutta larghezza con carosello di foto della bottega.

#### B. PERCORSO UI PRECISO

1. Come CARD-04 fino ad aprire una bottega (click su ShopCard).
2. In alto nella pagina dettaglio bottega compare il carosello foto.
3. Cliccare la **foto corrente** del carosello (non le frecce laterali).

#### C. COSA VEDE L’UTENTE

Grande immagine/slider della bottega; frecce prev/next; eventuale testo bio a lato.

#### D. COSA SUCCEDE OGGI

**FATTO:** click slide → `onOpenLightbox(img)` → foto a schermo intero/overlay. Frecce = scorrimento carosello, indipendenti.

#### E. DECISIONE PO

- Click foto = apertura foto/overlay.
- Nessun altro comportamento prodotto da alterare.

#### F. DUBBI / DOMANDE APERTE

Nessuno sul percorso primario.

#### G. EVIDENZA DA CODICE

- `ShopHero.tsx` ~52
- Parent: `ShopDetailView`

#### H. STATO AUDIT

**DECISO** · percorso UI **verificato**

---

### CARD-15 — Card prodotto bottega

**File:** `src/components/shop/ShopProducts.tsx`  
**Riga/hit:** 64  
**Componente:** `ShopProducts`

#### A. DOVE SI TROVA NELL’UI

Dettaglio bottega → sezione prodotti («I nostri prodotti» / marketplace) → card prodotto nel carosello.

#### B. PERCORSO UI PRECISO

1. Aprire una bottega (CARD-04).
2. Scorrere alla sezione prodotti.
3. Cliccare la card di un prodotto.

**Condizioni:** bottega con prodotti.

#### C. COSA VEDE L’UTENTE

Card prodotto con prezzo/nome; frecce del carosello a parte.

#### D. COSA SUCCEDE OGGI

**FATTO:** click → `onSelectProduct(product)` → selezione/apertura overlay dettaglio prodotto.

#### E. DECISIONE PO

- Click card prodotto = selezione/apertura del prodotto.

#### F. DUBBI / DOMANDE APERTE

Nessuno primario.

#### G. EVIDENZA DA CODICE

- `ShopProducts.tsx` ~64 ← `ShopDetailView`

#### H. STATO AUDIT

**DECISO** · percorso UI **verificato**

---

### CARD-16 — Miniatura foto Live Feed (Community)

**File:** `src/components/community/liveFeed/LiveFeedCarousel.tsx`  
**Riga/hit:** 40  
**Componente:** `LiveFeedCarousel`

#### A. DOVE SI TROVA NELL’UI

**Community Hub** → tab **Live Feed**: in alto una foto grande “in evidenza”; sotto, una **striscia orizzontale di miniature** foto community.

Nel codice le miniature sono chiamate `snaps` (`PhotoSubmission`). L’overlay a tutto schermo della foto è `GalleryLightbox` (qui: “finestra foto a tutto schermo”).

#### B. PERCORSO UI PRECISO

1. Sidebar → **Community** (o mobile **Social**).
2. Community Hub → tab **Live Feed**.
3. Nella striscia sotto la foto grande, cliccare una miniatura.

**Condizioni:** foto community (`snaps`) caricate.

#### C. COSA VEDE L’UTENTE

Miniature quadrate; quella attiva ha bordo evidenziato; le altre sono più opache. Hover mostra cuore/conteggio (display, non toggle sul click della tile).

#### D. COSA SUCCEDE OGGI

**FATTO (doppio comportamento):**

1. Se la miniatura **non** è quella attiva → diventa la foto grande (`onSelect(idx)`).
2. Se la miniatura **è già** quella attiva → apre la finestra foto a tutto schermo (`onOpenLightbox(snap.id)`).

#### E. DECISIONE PO

**CONFERMATA ESATTAMENTE COME È ORA (2026-08-17):**

- click miniatura **non** attiva → seleziona e porta in foto principale;
- click miniatura **già** attiva → apre foto a tutto schermo.

NON semplificare. NON unificare in un solo comportamento.

#### F. DUBBI / DOMANDE APERTE

Nessuno.

#### G. EVIDENZA DA CODICE

- `LiveFeedCarousel.tsx` ~48–50
- Parent: `LiveFeedTab` ← `GlobalSectionView` tab `live`

#### H. STATO AUDIT

**DECISO** · percorso UI **verificato**

---

### CARD-17 — Card domanda Q&A Local

**File:** `src/components/community/QaForumTab.tsx`  
**Hit Biome storico:** superato · **contratto prodotto 2026-08-18** (aggiornato sera2)

#### PERCORSO UI

1. Community Hub → tab **Q&A Local** → lista domande.
2. Riga domanda: avatar, nome, città, testo, Segui, blocco Risposte.

#### DECISIONE PO — CHIUSA / RICONFERMATA (sera2)

- Nessuna superficie principale che apre il thread.
- Nome utente → profilo utente (dettaglio).
- Città → pagina città (+ ritorno Q&A via `qaCityReturnMemory`).
- **Risposte = controllo interattivo** (icona + numero + label) → apre il thread delle risposte.
- Segui/Seguito → propria funzione.
- Testo domanda → nessuna azione.

**Storico superato:** formulazioni «Risposte = span non cliccabile» / «card → apre thread».  
Nota tecnica: il label testuale «Risposte» può essere un `<span>` *dentro* un `<button>`; lo span non è il controllo — il **button** è il controllo.

#### FATTO TECNICO (codice attuale)

- `<article>` senza `onClick` sulla riga.
- Autore: `<button onClick={() => openAuthorDetail(post)}>`.
- Città: `<button onClick={() => openCityFromPost(post)}>`.
- Risposte: `<button type="button" onClick={() => setSelectedPost(post)} aria-label="Apri risposte…">` + icona + count + `<span>Risposte</span>` (solo label).
- Follow: `renderFollowButton` indipendente.
- Biome `noStaticElementInteractions` su QaForumTab: **0**.

#### DISCREPANZA

Nessuna rispetto al contratto PO. Eventuale bonifica futura = solo polish a11y/semantica se emergono altri hit, non cambio prodotto.

#### H. STATO AUDIT

**DECISO** · codice **conforme** · Biome 0 · domanda «Risposte = span» **chiusa/superata**

---

### CARD-18 — Guide Turistiche / Tour Operator nel Diario (+ hit storico Memo)

**File hit Biome (storico):** `DiaryMemoCard.tsx`  
**UI riga:** `DiaryResourceCard` · matita → `onEditResource` → `handleOpenMemoConfig` → `AddToItineraryModal` · confirm → `handleConfirmAddMemo`

#### PERCORSO UI

1. Diario → giorno → guida/TO già in Diario.
2. Matita **Modifica** → schermata (`AddToItineraryModal`, CTA «Salva Contatto»).
3. Utente cambia giorno → Salva Contatto.

#### DECISIONI PO GIÀ CHIUSE (invariate)

Matita / tooltip Modifica / cestino / superficie → mini-card / preferito / Undo / SwipeToDelete = confermate.

#### DECISIONE PO DEFINITIVA — cambio giorno (2026-08-18 sera2) — CHIUSA

La domanda A/B/C è **chiusa**.

> Dopo matita → modifica giorno → **Salva Contatto**:
>
> - la guida/TO deve essere **spostata** nel nuovo giorno;
> - rimossa dal giorno precedente;
> - **non** creare Nota/Memo;
> - **non** duplicare il contatto;
> - **non** lasciare il contatto anche nel giorno precedente.
>
> Dopo il salvataggio: **modale/messaggio di conferma** di modifica riuscita, adeguato allo standard conferme dell’app, **non auto-dismiss** (resta finché interazione prevista dallo standard).

Il comportamento «crea Nota collegata» è **superato** come decisione prodotto.

#### FATTO TECNICO — STATO CODICE (2026-08-19 implementazione)

`handleConfirmAddMemo` (`useDiaryLogic.ts`) ora:
- chiude `memoTargetItem` e, se il giorno è cambiato, invoca `onDayDropProp` con payload `MOVE_ITEM` (stesso path di drag / `MobileMoveModal`);
- registra `pendingMoveActionRef` per undo come `handleDayDrop`;
- **non** crea memo/Nota; **non** duplica;
- conferma: `setToastMessage` **senza** timeout → dialog success in `DiaryModals` (Ok / ESC / overlay), non auto-dismiss XP toast.

Wiring invariato: `TravelDiary` `onEditResource={actions.toggleItemType}` (= `handleOpenMemoConfig`); `DiaryModals` `onConfirm → handleConfirmAddMemo`.

#### DISCREPANZA — CHIUSA (prodotto ↔ codice)

| Aspetto | Decisione PO | Codice dopo fix |
|---------|--------------|-----------------|
| Esito Salva Contatto | **Sposta** guida/TO | `MOVE_ITEM` aggiorna `dayIndex` |
| Giorno precedente | Contatto rimosso | Stesso item, nuovo giorno |
| Duplicazione | Vietata | Nessun nuovo item |
| Conferma post-save | Modale standard **non** auto-dismiss | `toastMessage` persistente in `DiaryModals` |

#### H. STATO AUDIT

**DECISO (prodotto: sposta + conferma)** · **DISCREPANZA codice chiusa** (2026-08-19) · Biome 0 su `DiaryResourceCard` · A/B/C **chiusa**

**Stato finale (post-bonifica §11.7):** **IMPLEMENTATO** — Salva Contatto = sposta giorno + conferma non auto-dismiss

---

### CARD-19 — Riga oggetto Valigia

**File:** `src/components/features/diary/packing_list/suitcase/SuitcaseItemRow.tsx`  
**Riga/hit:** 113  
**Componente:** `SuitcaseItemRow`

#### A. DOVE SI TROVA NELL'UI

Pannello **Valigia** (editor per categoria): riga di un oggetto.

#### B. PERCORSO UI PRECISO

1. Aprire Valigia (Diario / Dashboard Valigie / MySpace → `packingList`).
2. Editor → categoria → riga oggetto.
3. Click superficie riga (non grip/checkbox/quantità).

#### C–D. COMPORTAMENTO

Click → toggle `selectedItemName`. Grip / checkbox / quantità indipendenti.

#### E. DECISIONE PO

**CONFERMATA** — REGOLA GENERALE: superficie = select/deselect; checkbox / quantità / grip = solo le loro funzioni. Futura Biome deve preservare grip-only drag.

#### PATTERN vs CARD-06 (REVIEW)

**FATTO:** condivide il **principio** «grip = solo drag; superficie non draggable».  
**FATTO:** **non** condivide la stessa struttura UI/semantica di una card POI (qui la superficie **seleziona** una riga Valigia, non apre un dettaglio).  
→ Stesso **P2 (grip-only)**, **non** lo stesso componente né lo stesso P1 “apri dettaglio”.

#### F. VERIFICA CONFORMITÀ CODICE (2026-08-17)

| Requisito | FATTO | OK |
|-----------|-------|----|
| Toggle | `CategoryItemsGrid` `onSelectItem(null/name)` | Sì |
| Suggerimenti item | `CategorySuggestionPanel` + `itemMap` se `selectedItem` | Sì |
| Generici | `finalProduct` senza selected = globali | Sì |
| Grip | draggable + stopPropagation | Sì |

Nessuna regressione rilevata (sola lettura).

#### H. STATO AUDIT

**DECISO** · conforme · percorso verificato

**Stato finale (post-bonifica §11.7):** **IMPLEMENTATO** — surface + grip; residuo Biome drop-target shell **legittimo**

---

### CARD-20 — Riga Eventi Locali

**File:** `src/components/modals/cityInfo/CityEventsTab.tsx`  
**Hit pre-fix:** ~133 (header `onClick`)  
**Componente:** `CityEventsTab`

#### B. PERCORSO UI PRECISO

Home → città → **Eventi** → **Eventi Locali** → riga evento.

#### DECISIONE PO + FIX (2026-08-17)

- La riga intera **NON** espande.
- Solo il **bottone freccia** espande/chiude.
- **AGGIUNGI** resta indipendente.

**FATTO post-fix:** header senza `onClick`; freccia = `button` con toggle + aria; Biome a11y su file = **0**.

#### H. STATO AUDIT

**DECISO** · fix applicato · Biome OK

---

### CARD-21 — Card servizio

**File:** `src/components/modals/cityInfo/ServicesCategoryList.tsx`  
**Hit pre-fix:** ~194  
**Componente:** `ServicesCategoryList`

#### B. PERCORSO UI PRECISO

Home → città → **Servizi** → categoria → card servizio.

#### DECISIONE PO + FIX (2026-08-17) — RICONFERMATA 2026-08-18

- freccia → espande/chiude;
- Chiama / Web / Aggiungi → solo le rispettive funzioni;
- **superficie libera → NON fa nulla** (non espande).

**FATTO:** Biome a11y su file = **0** (fix già applicato).

#### H. STATO AUDIT

**DECISO** · comportamento confermato · Biome OK · file definitivo rivisto 2026-08-17

---

### CARD-22 — Gallery Preview

**File:** `src/components/modals/sectionPreview/PreviewGallery.tsx`  
**Riga/hit:** 123  
**Componente:** `PreviewGallery`

#### B. PERCORSO UI UTENTE

Home → sezione → **Esplora** → Preview → gallery → click foto → foto ingrandita.

#### B2. ENTRY ADMIN PRECISO (2026-08-17) — FATTO

1. Admin → **Manager POI** → edit città.
2. Tab **Generale** (`TabGeneral`).
3. Sezione **«Descrizione Card»**.
4. Pulsante **«Anteprima»** → `triggerPreview('card')`.
5. `AdminCityEditor` monta `SectionPreviewModal` → stessa `PreviewGallery`.

Altri «Anteprima» Admin (Storia / Cultura / Servizi / Eventi / Rating…) **non** montano questo hit.  
`EditorGeneral.tsx` ha lo stesso bottone ma **non è importato** (legacy non montato).

Click foto: identico al percorso utente. In Admin `onCitySelect={() => {}}`.

#### E. DECISIONE PO

**CONFERMATA (2026-08-17):** click foto → apre la foto ingrandita (anche nel percorso Admin).  
*(Precedente «DA CHIARIRE» / formulazione da confermare: **RISOLTO**.)*

#### H. STATO AUDIT

**DECISO** · percorsi utente+Admin **verificati** · **IMPLEMENTATO** (§11.7)

**Stato finale (post-bonifica §11.7):** **IMPLEMENTATO**

---

### CARD-23 — Sidebar Preview

**File:** `src/components/modals/sectionPreview/PreviewSidebar.tsx`  
**Riga/hit:** 55  
**Componente:** `PreviewSidebar`

#### E. DECISIONE PO

**CONFERMATA (2026-08-17):** click riga cambia item nella Preview; non esce; non naviga automaticamente alla città.

#### H. STATO AUDIT

**DECISO** · percorso verificato

---

### CARD-24 — Promo Gold Shop (slot sponsor vuoto)

**File:** `src/components/shop/ShopHomeView.tsx`  
**Riga/hit:** 99  
**Componente:** area empty-state in `ShopHomeView`

#### A. DOVE SI TROVA NELL’UI

Home dello **Shop** (nessuna categoria/bottega ancora selezionata): se **non** ci sono shop gold in vetrina, compare un grande riquadro tratteggiato promozionale (icona premio, titolo, CTA).

**«Gold»:** tier sponsor premium dello Shop (vetrina in evidenza). Se ci sono shop gold, invece della promo si vede il carosello sponsor.

#### B. PERCORSO UI PRECISO

1. Aprire Shop (come CARD-04 passo carrello).
2. Restare sulla **home Shop** (non entrare in categoria).
3. Se `premiumShops` è vuoto → compare la promo.
4. Cliccare **l’area intera** della promo (non solo il testo CTA interno).

#### C. COSA VEDE L’UTENTE

Box dashed con icona Award, titolo `goldPromo.title`, pill CTA `goldPromo.body`.

#### D. COSA SUCCEDE OGGI

**FATTO:** `onClick={onOpenShopSponsor}` sull’intero contenitore → apre flusso sponsor shop.

#### E. DECISIONE PO

- Tutta l’area/card resta cliccabile.
- Non restringere il click solo alla CTA interna.

#### F. DUBBI / DOMANDE APERTE

Nessuno sul requisito click area.

#### G. EVIDENZA DA CODICE

- `ShopHomeView.tsx` ~99–114

#### H. STATO AUDIT

**DECISO** · percorso **verificato** (condizionato a nessun gold shop)

---

### CARD-25 — Riga notifica + pallino «Segna da leggere»

**File:** `src/components/user/dashboard/UserNotificationsTab.tsx`  
**Riga/hit:** ~237  

#### PERCORSO UI

Account/Dashboard → Centro Notifiche → lista notifiche.

#### E. DECISIONI PO (2026-08-18) — CONFERMATE / RICONFERMATE

- Marcatura grafica riga **invariata**.
- ● = non letta; ○ = letta; pallino **sempre** visibile e cliccabile.
- Tooltip ● → «Segna come letta»; ○ → «Segna da leggere».
- Click **pallino** → solo toggle letta/non letta; **non** apre il dettaglio.
- Click **restante riga** → apre la notifica (e marca letta se non letta).
- Conteggio Header aggiornato via sistema esistente (`NOTIFICATIONS_CHANGED_EVENT` / unread count).

#### IMPLEMENTAZIONE

- `markAsUnread` + markAsRead; riga = button principale + button pallino indipendenti.

#### H. STATO AUDIT

**DECISO** · feature **implementata** · Biome struttura già allineata (2 button)

---

### CARD-26 — Riga template Social Studio (Admin)

**File:** `src/components/admin/AdminSocialStudio.tsx`  
**Riga/hit:** 181  
**Componente:** `AdminSocialStudio`

#### A–B. PERCORSO UI PRECISO

1. Admin → **Social Studio**.
2. Tab templates → **I Tuoi Template**.
3. Click riga template → seleziona e carica nel canvas.
4. Cestino → elimina.

**FATTO:** non è un template Valigia — è template grafico Social (`SocialTemplate`).

#### E. DECISIONE PO

**CONFERMATA (2026-08-17).** Mantieni così.

#### H. STATO AUDIT

**DECISO** · percorso verificato · natura template chiarita

---

### CARD-27 — Card città in Analisi Regionale AI (Admin)

**File:** `src/components/admin/cities/RegionalAnalysisModal.tsx`  
**Riga/hit:** 725  
**Componente:** tile città in `RegionalAnalysisModal`

#### B. PERCORSO UI PRECISO (stato attuale, soggetto a rivalutazione)

1. Admin → Manager POI → **Aree Geografiche**.
2. **Analisi Regionale AI**.
3. Nella modale risultati → click card città → toggle selezione.

#### NOTA DI PROGETTO PERMANENTE (2026-08-17) — OBBLIGATORIA

> In origine l'AI dell'Analisi Regionale cercava città/comuni su criteri.
> Ora il progetto ha recuperato **tutti i comuni d'Italia** già presenti in Supabase.
> Il PO **non** intende necessariamente creare/pubblicare online una città per ogni comune.
> La strategia di creazione/pubblicazione città **sarà rivista** in una modifica progettuale successiva.
>
> Quindi:
> - **NON** classificare CARD-27 come «problema Biome» da risolvere automaticamente nei conteggi futuri;
> - **NON** proporre bonifica tecnica basata sull'attuale comportamento prodotto;
> - **NON** modificare ora la logica dell'Analisi Regionale;
> - mantenere lo stato: **DA RIVALUTARE NEL CONTESTO DELLA NUOVA STRATEGIA DI CREAZIONE CITTÀ**.

#### E. DECISIONE PO

Sospesa — rivalutazione strategica, non keep-toggle banale.

#### H. STATO AUDIT

**DA RIVALUTARE NEL CONTESTO DELLA NUOVA STRATEGIA DI CREAZIONE CITTÀ**

**Stato finale (post-bonifica §11.7):** **RIMANDATA — prodotto congelato** (NON bonificare ora)

---

### CARD-28 — Riga città in ZoneCard (Aree Geografiche)

**File:** `src/components/admin/cities/ZoneCard.tsx`  
**Riga/hit:** 312  
**Componente:** `ZoneCard` (riga città)

#### B. PERCORSO UI PRECISO (stato attuale, soggetto a rivalutazione)

1. Admin → Manager POI → **Aree Geografiche**.
2. Card zona strategica → elenco città (ONLINE / MANCANTE).
3. Click riga → edit città reale **oppure** magic generate se mancante.

#### NOTA DI PROGETTO PERMANENTE (2026-08-17) — OBBLIGATORIA

> Stessa regola di CARD-27: la logica Aree Geografiche / elenco città zona è destinata a rivalutazione perché la strategia di creazione/pubblicazione città sta cambiando.
>
> - **NON** è un problema da correggere ora;
> - **NON** deve essere conteggiata come problema Biome da risolvere automaticamente;
> - **NON** fare modifiche superficiali adesso;
> - rivalutare quando sarà definita la nuova logica comuni/città.

#### H. STATO AUDIT

**DA RIVALUTARE NEL CONTESTO DELLA NUOVA STRATEGIA DI CREAZIONE CITTÀ**

**Stato finale (post-bonifica §11.7):** **RIMANDATA — prodotto congelato** (NON bonificare ora)

---

### CARD-29 — Card anomalia Osservatorio (Admin)

**File:** `src/components/admin/observatory/AnomalyInspector.tsx`  
**Riga/hit:** 369  
**Componente:** card in `AnomalyInspector`

#### B. PERCORSO UI PRECISO

1. Admin → Manager POI → **Osservatorio Dati**.
2. Lista priorità anomalie → card POI.
3. Click card → apre edit POI.
4. Matita = parte visiva della card (non button separato).

#### E. DECISIONE PO (2026-08-18) — CONFERMATA

- Click **riga** → apre/modifica anomalia.
- La **matita** è un’**affordance visiva** (icona in overlay): **non** è un secondo bottone con azione propria.
- Un solo gesto utente: click sulla riga → stessa azione (edit).

#### FATTO CODICE (REVIEW)

Matita = `<div>` decorativo con icona Edit; **nessun** `onClick` sulla matita. L’intera riga ha l’unico `onClick` → edit.

#### H. STATO AUDIT

**DECISO** · matita = solo indicazione visiva · **IMPLEMENTATO** P-SIMPLE + matita aria-hidden (§11.7) · **non** creare un secondo controllo solo per Biome

**Stato finale (post-bonifica §11.7):** **IMPLEMENTATO**

---

### CARD-30 — `CityHistory` — DEAD CODE RIMOSSO

**File rimosso:** `src/components/city/CityHistory.tsx` (hit storico ~16)

#### Verifica finale pre-cancellazione

Nessun import/lazy/barrel/route/modal/registry. Live = `HistoryModal` + `CultureCornerModal`. Tipi AI `CityHistoryAiResult` restano (non UI).

#### Azione

Eliminato solo il file componente. Nessun import da ripulire. Hit Biome eliminato alla radice. Live invariato.

#### H. STATO AUDIT

**DEAD CODE RIMOSSO** (2026-08-17 sera)

**Stato finale (post-bonifica §11.7):** **CHIUSA** — non ripristinare

---

### CARD-31 — Slot pubblicitario vuoto (`AdPlaceholder`)

**File:** `src/components/common/AdPlaceholder.tsx`  
**Riga/hit:** 44  
**Componente:** `AdPlaceholder`

#### DECISIONE PO (2026-08-17)

**TUTTI gli 8 call-site** devono avere **lo stesso comportamento prodotto**:  
click sull'area placeholder sponsor → apre il flusso sponsor previsto.

#### INVENTARIO CALL-SITE + VERIFICA CONTRATO (2026-08-17)

| # | File | onClick | Flusso | Deviazione? |
|---|------|---------|--------|-------------|
| 1 | HomeContent ~461 | `onOpenSponsor('gold')` | sponsor | No |
| 2 | HomeContent ~697 | `onOpenSponsor('gold')` | sponsor | No |
| 3 | Sidebar ~742 | `onOpenSponsor` | sponsor | No |
| 4 | Sidebar ~834 | `onOpenSponsor` | sponsor | No |
| 5 | CityShowcaseTab ~149 | `onOpenSponsor(tier)` | sponsor | No |
| 6 | CityCategoryTab ~255 | `onOpenSponsor(tier)` | sponsor | No |
| 7 | CategorySponsorColumn ~67 | `onOpenSponsor(gold/silver)` | sponsor | No |
| 8 | ShopSponsorColumn ~58 | `onOpenSponsor('shop')` | sponsor | No |

**FATTO:** tutti i 8 passano `onClick` verso flusso sponsor (argomento tipo diverso = stesso contratto prodotto).  
**Nessuna DEVIAZIONE DAL CONTRATTO PO** rilevata in questo giro.  
Nessuna modifica codice.

#### H. STATO AUDIT

**DECISO** · **IMPLEMENTATO** AdPlaceholder P-SIMPLE (§11.7)

**Stato finale (post-bonifica §11.7):** **IMPLEMENTATO**

---

### CARD-32 — `ImageWithFallback` (utility condivisa)

**File:** `src/components/common/ImageWithFallback.tsx`  
**Riga/hit:** 108  

#### E. DECISIONE PO

**DA LASCIARE PER FINE AUDIT.**  
Non analizzare ora. Non modificare. Non decidere.  
Sarà analizzata **dopo** la conclusione delle altre CARD.

#### H. STATO AUDIT

**DA LASCIARE PER FINE**

**Stato finale (post-bonifica §11.7):** **DEFERRED** — non analizzare ora; unico capitolo operativo successivo

---

## 4. Decisioni PO consolidate

> Tabella di **prodotto**. Decisioni PO **chiuse**; **nessuna domanda PO aperta**. Colonna «Stato implementazione» = esito bonifica §11.7 (non altera il significato della decisione PO).

| CARD | Comportamento confermato | Dubbi risolti | Dubbi aperti | Percorso UI | Stato implementazione |
|------|--------------------------|---------------|--------------|-------------|------------------------|
| 01 | Card apre città; cuore isolato | Dove in Home | — | Sì | **IMPLEMENTATO** |
| 02 | Mini-tile apre città (variante visiva) | Differenza vs 01 chiusa | — | Sì | **IMPLEMENTATO** |
| 03 | Select itinerario; like isolato | — | — | Sì | **IMPLEMENTATO** |
| 04 | Apre bottega; cuore isolato | — | — | Sì | **IMPLEMENTATO** |
| 05 | Apre foto; like | — | — | Sì | **IMPLEMENTATO** |
| 06 | Apre POI; like/+ /drag | Lista pre-dettaglio | — | Sì | **IMPLEMENTATO** |
| 07 | Shop PARTNER apre POI + layout PARTNER\|LISTA\|PARTNER | A + CategorySponsorColumn | — | Sì | **VERIFY OK** |
| 08–11 | **Contratto sponsor = CARD-08**; layout 09/10/11 propri | Markup Sidebar ≠ SponsorSideCard | — | Sì | **08/10/11 VERIFY OK · 09 IMPLEMENTATO** |
| 12 | Foto classifica + like | — | — | Sì | **IMPLEMENTATO** |
| 13 | Riga POI classifica | — | — | Sì | **IMPLEMENTATO** |
| 14 | Foto hero shop | — | — | Sì | **IMPLEMENTATO** |
| 15 | Select prodotto | — | — | Sì | **IMPLEMENTATO** |
| 16 | Select / lightbox doppio | Conferma doppio comportamento | — | Sì | **IMPLEMENTATO** |
| 17 | Multi-controllo; **Risposte = button → thread** | Conforme · Biome 0 | — | Sì | **VERIFY OK** |
| 18 | Matita/cestino/swipe/undo; **Salva Contatto = sposta giorno + conferma non auto-dismiss** | UI riga OK; move `MOVE_ITEM` + conferma persistente | — | Sì | **IMPLEMENTATO** |
| 19 | Select → e-commerce item/generici; grip-only drag; shell drop | Conformità verificata | — | Sì | **IMPLEMENTATO** (hit Biome drop-target legittimo) |
| 20 | Solo freccia expand | Fix fatto · Biome 0 | — | Sì | **VERIFY OK** |
| 21 | Solo freccia expand | Fix fatto · Biome 0 | — | Sì | **VERIFY OK** |
| 22 | Click foto → ingrandita (Home+Admin) | Formalizzazione chiusa | — | Sì | **IMPLEMENTATO** |
| 23 | Select in preview | — | — | Sì | **IMPLEMENTATO** |
| 24 | Area gold promo cliccabile | — | — | Sì | **IMPLEMENTATO** |
| 25 | Pallino ●/○; ○ = Segna da leggere; header sync | Feature implementata | — | Sì | **VERIFY OK** |
| 26 | Select template Social Studio | Non è valigia | — | Sì | **IMPLEMENTATO** |
| 27 | Sospesa strategia città | Nota permanente | Rivalutazione progetto (futura) | Sì path | **RIMANDATA — prodotto congelato** |
| 28 | Sospesa strategia città | Nota permanente | Rivalutazione progetto (futura) | Sì path | **RIMANDATA — prodotto congelato** |
| 29 | Click → edit POI; matita visuale | — | — | Sì | **IMPLEMENTATO** |
| 30 | **DEAD CODE RIMOSSO** | File eliminato 2026-08-17 sera | — | N/A | **CHIUSA** |
| 31 | 8 call-site stesso contratto sponsor | Nessuna deviazione | — | Sì | **IMPLEMENTATO** |
| 32 | Rimandata a fine | — | Analisi fine audit | N/A | **DEFERRED** |

## 5. Raggruppamento per comportamento reale

> Solo dopo verifica UI. Raggruppamento per **gesto utente**, non per nome componente.

| Gruppo prodotto | CARD | Comportamento utente |
|-----------------|------|----------------------|
| Apre dettaglio città | 01, 02 | Click → pagina città (varianti visuali diverse) |
| Seleziona itinerario | 03 | Click → selezione in explorer + like nested |
| Apre bottega / prodotto | 04, 15 | Shop commerce |
| Apre media (foto) | 05, 12, 14, 16*, 22 | *16 anche “seleziona hero” se non attiva |
| Apre dettaglio POI da lista | 06, 07, 08, 09, 10, 11, 13 | Lista → poiDetail; nested azioni su 06–11 |
| CTA sponsor vuoto | 24, 31 | Apre flusso sponsor / placeholder |
| Espande riga info città | 20, 21 | Solo freccia (fix applicato) |
| Seleziona in lista/tool | 18*, 19, 23, 26, 27* | *18 Guida/TO = sposta nel nuovo giorno + conferma persistente/non auto-dismiss (discrepanza codice **chiusa** 2026-08-19); *27 sospesa |
| Q&A multi-controllo (no main surface) | 17 | Autore / città / **Risposte (button)** / Segui |
| Notifica | 25 | Open + mark read/unread via pallino |
| Admin zone/anomaly | 28*, 29 | *28 sospesa; 29 edit POI |
| Dead code / utility | 30, 32 | 30 rimosso; 32 fine audit |

---

## 6. Pattern strutturali — ADOTTATI nella bonifica 2026-08-19/20

> **Storico:** sezione nata il 2026-08-18 come «proposta rivista, NON implementata massivamente».  
> **Stato finale:** pattern strutturali **adottati** nella bonifica (vedi §11 / §11.7).

> Distinguere sempre: (1) stesso comportamento prodotto · (2) stessa UI · (3) stessa semantica · (4) stesso pattern tecnico · (5) stesso componente.  
> Non sono equivalenti. **Non** è stato introdotto un componente unico per tutte le card; i pattern tecnici sono stati riutilizzati solo dove il DOM e il comportamento lo consentivano.

| Pattern | Cosa significa in UI | CARD dove è **realmente** condiviso | Cosa NON forzare insieme | Stato |
|---------|----------------------|--------------------------------------|---------------------------|-------|
| **P-SURFACE-BUTTON** | Shell non interattivo + button `inset-0` + pe-none / pe-auto | 01, 03, 04, 05, 09, 12, 19, 26, … | Non wrappare nested button in un solo button | **ADOTTATO** |
| **P-SIMPLE-BUTTON** | Radice / slide = `<button type="button">` | 02, 13, 14, 15, 16, 22, 23, 24, 29, 31 | Non forzare surface dove non serve | **ADOTTATO** |
| **P-GRIP-ONLY** | Solo la maniglia `⋮⋮` avvia il drag | 06, 08, 10, 11, 19 | 19 condivide il **principio**, non la card POI | **ADOTTATO** |
| **P-CHEVRON-ONLY** | Solo la freccia espande | 20, 21 | — | **CONFORME** (già implementato pre-bonifica) |
| **P-NO-MAIN-SURFACE** | Solo controlli espliciti | 17 | — | **CONFORME** |
| **P-VISUAL-SAME-ACTION** | Icona solo disegno; click sulla riga/button | 29 (+ demote chip/footer 04) | Non creare secondo bottone stessa azione | **ADOTTATO / CONFORME** |
| **P-STOPPROP-LEGACY** | Rimuovere stopPropagation legacy inutili | 06 ActionRow; 19 qty wrapper | Non usare stopProp come modello | **RIMOSSO DOVE ERA LEGACY** |
| **Sospesi / fine** | — | 27, 28, 32 | — | Congelate / deferred |

**Sidebar 09/10/11 vs `SponsorSideCard`:**  
**DECISIONE PO:** stesso **contratto interattivo** di CARD-08; layout/dimensioni/densità **restano diversi** per contesto.  
**NON** è richiesta unificazione visuale/componente unico.  
Riuso di handler/semantica in bonifica = scelta tecnica già applicata dove pertinente, non nuova domanda PO.

---

## 8. Domande PO aperte — aggiornato 2026-08-20

**NESSUNA.**

Stato ufficiale dell’audit: **nessuna domanda PO aperta** su S-CARD-ROW.

*(Storico — chiuse in 2026-08-18 sera2: CARD-09/10/11 contratto vs layout; CARD-17 Risposte = controllo interattivo; CARD-18 A/B/C → **sposta** + conferma non auto-dismiss.)*

*(Storico — chiuse in giri precedenti: REGOLA GENERALE; CARD-06 drag; CARD-07; CARD-20/21; CARD-25; ecc.)*

---

## 9. CONSUNTIVO BONIFICA BIOME

> **Storico titolo (pre-implementazione):** «Pronto per progettare Biome / bonifica codice».  
> **Stato attuale:** non siamo più in fase di progettazione.

- §11 era il **contratto tecnico** di bonifica (ricognizione 2026-08-19).
- Il contratto è stato **validato** e **implementato** (2026-08-19; deep-dive CARD-19 2026-08-19/20).
- La bonifica è **conclusa** per tutte le CARD in scope (implementate o verify-only).
- I verify-only (07, 08, 10, 11, 17, 20, 21, 25) sono stati **verificati** conformi.
- 27/28 restano **congelate** (decisione strategica città).
- 30 è **rimossa** (dead code).
- 32 è **deferred** intenzionalmente (fine audit).
- Residuo Biome strutturale: solo shell drop-target CARD-19 (vedi §2ter / §11.7) — **legittimo / non da silenziare**.

**Non** sono previsti ulteriori fix applicativi S-CARD-ROW in questo giro documentale.

---

## 10. Documentazione da aggiornare (post-bonifica)

> Distinguere cosa aggiornare **davvero** vs cosa non toccare per puro markup interno.

### A. Sicuramente da aggiornare (cita dead code rimosso)

| File | Motivo |
|------|--------|
| `AI_CONTEXT/21_CITY_HISTORY_SYSTEM.md` | Cita ancora CityHistory.tsx |
| `AI_CONTEXT_MASTER/04_TERRITORIAL_ENGINE.md` | Cita CityHistoryTab |
| eventuali altri riferimenti reali a `CityHistory.tsx` / `CityHistoryTab` | Cleanup citazioni |

### B. Documentazione Biome/a11y da riallineare alla baseline post-bonifica

| File | Motivo |
|------|--------|
| `AI_QUALITY/biome/BIOME_101_FOLLOWUP_AUDIT_CARD_STOPPROP_SPECIALS.md` | Baseline storica (es. C06 orphan) vs stato post-§11 |
| `AI_QUALITY/biome/B_a11y_click_and_static_interactions.md` + schede A/AB pertinenti | Baseline storica CityHistory / surface |

### C. Non aggiornare solo perché è cambiato il markup interno

**Regola:** non aggiornare AI_CONTEXT / MASTER per puro refactoring HTML/semantico se il **contratto architetturale** non è cambiato. Vedi anche §11.4.

*(Storico 2026-08-17: elenco simile compilato pre-bonifica — mantenuto come riferimento in changelog.)*

---

## 11. CONTRATTO TECNICO DI BONIFICA BIOME — CONSUNTIVO

> **Storico titolo:** «CONTRATTO TECNICO DI BONIFICA BIOME — S-CARD-ROW» (piano pre-implementazione).  
> Conservato integralmente come storia tecnica; stato aggiornato sotto.

### 11.0 Premessa

1. Le decisioni marcate DECISIONE PO / CHIUSA / CONFERMATA / DECISO costituiscono il **requisito funzionale**.
2. Ricognizione codice reale: **2026-08-19**. Contratto **validato** e **implementazione completata** (2026-08-19; CARD-19 deep-dive 2026-08-19/20).
3. La matrice §11.3 è il **piano tecnico applicato**; §11.7 è il **consuntivo**. Gli stati «PRONTO PER IMPLEMENTAZIONE» sotto le CARD sono **storici** e aggiornati allo stato finale.
4. La bonifica deve **far rispettare** quelle decisioni (semantica HTML, event handling, a11y, touch, type safety) e solo poi azzerare Biome dove possibile senza rompere contratti strutturali (es. drop-target CARD-19).
5. **Vietato** il metodo meccanico «`div onClick` → sempre `<button>` wrapper».
6. Criterio obbligatorio (§2bis): superficie = azione principale; controllo interno = **solo** la propria azione.
7. Qualsiasi problema **nuovo** emerso in implementazione può richiedere review **solo** se è un fatto di codice, non una preferenza.
8. **Priorità:** correttezza funzionale → semantica → type safety → a11y → robustezza → mobile-first → Biome → manutenibilità.
9. **Vietato in implementazione:** `biome-ignore` di default; `any`; cast fragili; placeholder; hack; regressioni prodotto.
10. **Non** cancellare le descrizioni tecniche ancora corrette: aggiornare solo lo stato.

> **Storico blocco (pre-implementazione 2026-08-19):** «Scope: solo documentazione… Scopo: piano tecnico autosufficiente per la futura implementazione unica» — superato dall’implementazione; conservato nel changelog.
### 11.1 Pattern tecnici documentali (non componenti forzati)

| ID | Significato | Quando applicarlo | Non forzare |
|----|-------------|-------------------|-------------|
| **P-SURFACE-BUTTON** | Shell `div` non interattivo + `<button type="button">` assoluto `inset-0` (azione principale) + contenuto `pointer-events-none` + controlli `pointer-events-auto` | Card con nested controls | Non wrappare tutta la card in un solo `<button>` se contiene altri button |
| **P-SIMPLE-BUTTON** | L’intera superficie **è** il controllo principale (nessun nested interattivo) → `<button>` (o elemento nativo appropriato) | Tile/riga senza controlli nested | Non inventare nested |
| **P-GRIP-ONLY** | `draggable` solo sul grip; MIME coerente col consumer (`application/json` preferito da `useDiaryLogic`, `effectAllowed='copy'` dove già usato) | Drag POI/sponsor/item | Non drag sull’hit-area |
| **P-CHEVRON-ONLY** | Solo freccia espande | Eventi/servizi | — |
| **P-NO-MAIN-SURFACE** | Nessuna grande area cliccabile | Q&A lista | — |
| **P-VISUAL-SAME-ACTION** | Icona decorativa; click sulla riga | Anomaly matita | Non secondo button duplicato |
| **P-STOPPROP-LEGACY** | `onClick={stopPropagation}` su **wrapper `div`** non interattivo | Da rimuovere se i figli button già isolano | Non aggiungere stopPropagation «per Biome» |

**Riferimenti codice già allineati (modello, non unificare layout):**  
`SponsorSideCard.tsx`, ShowcaseCards surface button, Sidebar companion / `#tour-sponsor-box`, CityGuide surface button, `QaForumTab` lista, `CityEventsTab` / `ServicesCategoryList` chevron, `UserNotificationsTab`.

### 11.2 Event isolation — regole

| Situazione | Approccio |
|------------|-----------|
| Controlli sibling sopra surface button | Preferire `pointer-events` + button nativi; `stopPropagation` sui click dei controlli **solo se** ancora necessario verso antenati |
| Wrapper `div` con **solo** `stopPropagation` | **Legacy:** rimuovere l’handler dal div (hit Biome) |
| Riga = select + nested delete/like | Surface button + nested button; stopPropagation sul nested se serve |
| Nessuna superficie principale | Nessun isolation verso una “card click” |

### 11.3 Matrice CARD-01 → CARD-32

> **REVISIONE TECNICA §11 — 2026-08-19 (scope):** verifica DOM approfondita su CARD **01, 03, 04, 05, 06, 09, 14, 19, 26, 31**. Decisioni PO invariate. Piano aggiornato dove il DOM imponeva correzione (**04** demote same-action chip/footer; **14** univoco P-SIMPLE-BUTTON; **26** univoco P-SURFACE-BUTTON).  
> **CONSUNTIVO 2026-08-20:** ogni CARD sotto ha **Stato finale** allineato a §11.7. Le righe «Stato piano tecnico (storico): PRONTO…» sono la storia del piano, non il lavoro ancora da fare.
---

#### CARD-01 — Card città (Home)

**File/componenti reali:** `src/components/city/CityCard.tsx` · mount `HomeContent.tsx`  
**Hit Biome attuale:** L142 shell `div onClick`; L179 wrapper cuore `div onClick={stopPropagation}`  
**Azione principale:** apri dettaglio città (`onClick(city.id)`)  
**Controlli interni indipendenti:** `FavoriteBookmarkButton` (solo preferito) — **unico** nested interattivo reale  

**REVISIONE TECNICA §11 — 2026-08-19 (DOM reale)**  
- Shell: un solo `div` relative flex-col con `onClick` + `group`/`hover:` CSS.  
- Cuore: sibling del titolo dentro la fascia testo (`flex justify-between`), **non** dentro un secondo surface; wrapper `div.shrink-0` esiste **solo** per `stopPropagation`.  
- Nessun altro button/link. Badge/DNA/stelle = decorativi.  
- **P-SURFACE-BUTTON applicabile:** shell senza onClick; `<button type="button" aria-label={Apri …}>` `absolute inset-0 z-0`; contenuto `pointer-events-none`; cuore in `relative z-[1] pointer-events-auto` **senza** wrapper onClick.  
- `group-hover` resta sullo shell `div` (non sul button) → hover CSS preservabile.  
- Tab order: surface poi cuore. Enter/Space sul surface = città; cuore = solo preferito.  
- Nessun nested button. Nessun `any` / biome-ignore / aria fittizia richiesti.

**Soluzione tecnica prevista (CONFERMATA):** P-SURFACE-BUTTON come sopra  
**Pattern tecnico da adottare:** P-SURFACE-BUTTON  
**Event isolation necessario:** strutturale; eliminare wrapper stopPropagation  
**A11y / keyboard / touch:** focus-visible surface; cuore già button + min target  
**Rischi/regressioni da evitare:** non wrappare cuore nella surface; non cambiare `onClick(city.id)`  
**Stato piano tecnico (storico):** PRONTO PER IMPLEMENTAZIONE

**Stato finale:** **IMPLEMENTATO** (consuntivo §11.7)

---


#### CARD-02 — Mini tile città (Ispirazioni)

**File/componenti reali:** `CuratedGridSection.tsx` → `MiniCityCard` · mount `HomeContent.tsx`  
**Hit Biome attuale:** L17 `div onClick`  
**Azione principale:** apri città  
**Controlli interni indipendenti:** nessuno  
**Struttura attuale:** tile sola  
**Soluzione tecnica prevista:** P-SIMPLE-BUTTON — `<button type="button">` stesso layout; `aria-label` città  
**Pattern tecnico da adottare:** P-SIMPLE-BUTTON  
**Event isolation necessario:** n/a  
**A11y / keyboard / touch:** button nativo; focus-visible; area tile = target  
**Rischi/regressioni da evitare:** non unificare componente con CityCard  
**Stato piano tecnico (storico):** PRONTO PER IMPLEMENTAZIONE

**Stato finale:** **IMPLEMENTATO** (consuntivo §11.7)

---

#### CARD-03 — Card itinerario

**File/componenti reali:** `src/components/itineraries/ItinerariesList.tsx`  
**Hit Biome attuale:** L53 `div onClick` select  
**Azione principale:** seleziona itinerario (`onSelect`)  
**Controlli interni indipendenti:** Like `<button>` L80 (`handleLike` + `stopPropagation`) — **unico** nested interattivo  

**REVISIONE TECNICA §11 — 2026-08-19 (DOM reale)**  
- Like è `absolute top-2 right-2` **dentro** lo shell cliccabile (figlio DOM dello shell, non della futura surface button).  
- Badge/durata/difficoltà = span decorativi.  
- **P-SURFACE-BUTTON applicabile** senza nested button: shell non interattivo; surface button sibling `inset-0 z-0`; like `z-dropdown pointer-events-auto` sibling sopra; resto `pointer-events-none`.  
- Con pattern sibling lo stopPropagation verso surface non serve (like non è discendente del surface button); può restare se esistono antenati con click.  
- Nessun `any` / biome-ignore / aria fittizia.

**Soluzione tecnica prevista (CONFERMATA):** P-SURFACE-BUTTON  
**Pattern tecnico da adottare:** P-SURFACE-BUTTON  
**Event isolation necessario:** strutturale; like non deve chiamare `onSelect`  
**A11y / keyboard / touch:** `aria-label` select; like `aria-pressed`/`aria-label`  
**Rischi/regressioni da evitare:** like non seleziona itinerario; stato selected/ring invariato  
**Stato piano tecnico (storico):** PRONTO PER IMPLEMENTAZIONE

**Stato finale:** **IMPLEMENTATO** (consuntivo §11.7)

---


#### CARD-04 — Card bottega (Shop)

**File/componenti reali:** `src/components/shop/ShopCard.tsx`  
**Hit Biome attuale:** L39 shell `div onClick`; L73 wrapper fav `stopPropagation`  
**Azione principale:** apri bottega (`onOpen(shop)`)  

**Controlli — classificazione DOM reale (CORREZIONE §11):**  
| Elemento | Tipo reale | Azione | Indipendente? |
|----------|------------|--------|---------------|
| `FavoriteBookmarkButton` | button | preferito | **Sì** |
| Chip prodotto L97–114 | `<button>` | `onOpen(shop)` (**stessa** azione principale) | **No** — duplicato della surface |
| Footer «Vedi Bottega» L127–133 | `<button>` | `onOpen(shop)` (**stessa** azione) | **No** — duplicato; oggi senza stopPropagation → rischio doppio `onOpen` via bubble |
| Rating box | div | nessuno | Visuale |

**REVISIONE TECNICA §11 — 2026-08-19**  
- P-SURFACE-BUTTON **sì**, ma **non** lasciare chip/footer come button nested sopra la surface.  
- Piano corretto: shell non cliccabile; surface `<button aria-label={Apri bottega …}>` `inset-0`; preferito `pointer-events-auto` indipendente; chip e CTA footer → **elementi non interattivi** (span/div) con stesso look (**P-VISUAL-SAME-ACTION** / demote same-action).  
- Comportamento PO invariato: click area libera → apre bottega via surface; cuore → solo preferito.  
- Nessun `any` / biome-ignore; un solo controllo principale per «apri».

**Soluzione tecnica prevista (CORRETTA):** P-SURFACE-BUTTON + demote chip/footer a non-interattivi stessa-azione; solo preferito indipendente  
**Pattern tecnico da adottare:** P-SURFACE-BUTTON + P-VISUAL-SAME-ACTION (chip/footer)  
**Event isolation necessario:** strutturale sul preferito; rimuovere wrapper stopPropagation  
**A11y / keyboard / touch:** un solo controllo principale per «apri»; focus-visible surface; cuore isolato  
**Rischi/regressioni da evitare:** nested button; doppio `onOpen`; non inventare azione diversa per i chip  
**Stato piano tecnico (storico):** PRONTO PER IMPLEMENTAZIONE

**Stato finale:** **IMPLEMENTATO** (consuntivo §11.7)

---


#### CARD-05 — Foto galleria città

**File/componenti reali:** `src/components/city/gallery/GalleryGrid.tsx` (`PhotoCard`)  
**Hit Biome attuale:** L50 `div onClick` → lightbox  
**Azione principale:** apri lightbox  
**Controlli interni indipendenti:** Like `<button>` L72 (`stopPropagation` + heart)  

**REVISIONE TECNICA §11 — 2026-08-19 (DOM reale)**  
- Overlay caption/Maximize2 già `pointer-events-none`.  
- Immagine `draggable={false}`.  
- Like absolute top-right, figlio dello shell.  
- **P-SURFACE-BUTTON applicabile:** surface button sibling; like `pointer-events-auto` z-local-overlay; overlay info restano pointer-events-none.  
- Lightbox data payload invariato. Nessun workaround TS/Biome.

**Soluzione tecnica prevista (CONFERMATA):** P-SURFACE-BUTTON  
**Pattern tecnico da adottare:** P-SURFACE-BUTTON  
**Event isolation necessario:** strutturale; like non apre lightbox  
**A11y / keyboard / touch:** aria-label foto; like aria  
**Rischi/regressioni da evitare:** non rompere `onOpenLightbox` payload; pending badge resta visuale  
**Stato piano tecnico (storico):** PRONTO PER IMPLEMENTAZIONE

**Stato finale:** **IMPLEMENTATO** (consuntivo §11.7)

---


#### CARD-06 — Card POI Showcase / lista (TOP5 + CityGuide)

**File/componenti reali:** `ShowcaseCards.tsx` (`UniversalCard` + `ActionRow`); `CityGuide.tsx`  
**Hit Biome attuale:** Showcase `ActionRow` L63 `div`+`onClick={stopPropagation}`; surface già `<button>`. CityGuide surface già button.  

**REVISIONE TECNICA §11 — 2026-08-19 — risposte esplicite**  
1. **Surface e ActionRow sono sibling?** **Sì.** Shell → surface `button` z-0 → content `pointer-events-none` → `ActionRow` (`pointer-events-auto`). ActionRow non è figlio del surface button.  
2. **Controlli figli del button?** **No.**  
3. **Nested interactive nel surface button?** **No** (button vuoto).  
4. **Dove c’è stopPropagation?** Wrapper ActionRow L65; grip/like/add button. CityGuide: stopPropagation su side controls + grip.  
5. **Quale è necessario?** Click sui button ActionRow **non** raggiungono il surface button (non discendenti). StopPropagation sul **wrapper ActionRow** = **legacy**.  
6. **Legacy:** `onClick={stopPropagation}` sul `div` ActionRow (hit Biome).  
7. **Drag solo dal grip?** **Sì** (`draggable` solo sul grip; `hidden lg:flex`).  
8. **Drag accidentale dalla surface?** **No.**  
9. **Payload invariato?** Showcase: `application/json` + `text/plain`; CityGuide: `application/json` + `effectAllowed='copy'`.  
10. **Rimuovere handler wrapper ActionRow?** **Sì, sicuro.**  
11. **CityGuide vs Showcase?** Stesso **contratto** prodotto; **DOM diverso** (CityGuide rail laterale + FavoriteBookmark). Non unificare componenti.  

**Soluzione tecnica prevista (CONFERMATA):** micro-delta ActionRow — togliere onClick dal wrapper; CityGuide verify-only  
**Pattern tecnico da adottare:** P-SURFACE-BUTTON + P-GRIP-ONLY + P-STOPPROP-LEGACY  
**Event isolation necessario:** strutturale già OK; rimuovere isolation legacy sul wrapper  
**A11y / keyboard / touch:** focus-visible surface; touch like/add; grip desktop-only  
**Rischi/regressioni da evitare:** non ripristinare drag sull’hit-area; MIME diario  
**Stato piano tecnico (storico):** PRONTO PER IMPLEMENTAZIONE (micro-delta)

**Stato finale:** **IMPLEMENTATO** (consuntivo §11.7)

---


#### CARD-07 — Shop PARTNER (`SponsorSideCard`)

**File/componenti reali:** `SponsorSideCard.tsx` · mount `ShopPartnerColumn.tsx`  
**Hit Biome attuale:** 0 surface  
**Azione principale:** apri POI sponsor  
**Controlli interni indipendenti:** grip + add  
**Struttura attuale:** sibling surface button (riferimento)  
**Soluzione tecnica prevista:** verify-only / nessun cambio strutturale obbligatorio  
**Pattern tecnico da adottare:** P-SURFACE-BUTTON + P-GRIP-ONLY  
**Event isolation necessario:** già strutturale  
**A11y / keyboard / touch:** mantenere focus-visible / add touch  
**Rischi/regressioni da evitare:** non unificare layout Shop≠Home  
**Stato piano tecnico (storico):** PRONTO PER IMPLEMENTAZIONE (verify-only)

**Stato finale:** **VERIFY OK** (consuntivo §11.7)

---

#### CARD-08 — Sponsor Home PARTNER (`SponsorSideCard`)

**File/componenti reali:** stesso `SponsorSideCard.tsx` · mount `HomeContent.tsx`  
**Hit Biome attuale:** 0 surface  
**Azione principale / controlli / soluzione:** identici a CARD-07 — **riferimento contratto**  
**Stato piano tecnico (storico):** PRONTO PER IMPLEMENTAZIONE (verify-only)

**Stato finale:** **VERIFY OK** (consuntivo §11.7)

---

#### CARD-09 — Sponsor Partner d'Eccellenza (Diario mobile)

**File/componenti reali:** `Sidebar.tsx` ~L350–396 (strip fullscreen mobile)  
**Hit Biome attuale:** L352 `div onClick` → `poiDetail`  
**Azione principale:** apri POI sponsor  
**Controlli interni indipendenti:** Add `<button>` L377 (`stopPropagation` + `openModal('add')`); **nessun grip**  

**REVISIONE TECNICA §11 — 2026-08-19 (DOM reale)**  
- Layout orizzontale: thumb + testo + Add come flex children dello shell cliccabile.  
- **P-SURFACE-BUTTON applicabile** senza cambiare densità: shell relative; surface button `inset-0 z-0`; contenuto testo/img `pointer-events-none`; Add `relative z-[1] pointer-events-auto`.  
- **Non** migrare a `SponsorSideCard`; **non** introdurre grip. Layout mobile resta quello attuale.  
- Nessun cast/biome-ignore.

**Soluzione tecnica prevista (CONFERMATA):** P-SURFACE-BUTTON layout proprio  
**Pattern tecnico da adottare:** P-SURFACE-BUTTON  
**Event isolation necessario:** strutturale; stopPropagation Add può restare difensivo  
**A11y / keyboard / touch:** aria-label surface + Add; Add sempre visibile  
**Rischi/regressioni da evitare:** unificazione visuale con CARD-08; drag  
**Stato piano tecnico (storico):** PRONTO PER IMPLEMENTAZIONE

**Stato finale:** **IMPLEMENTATO** (consuntivo §11.7)

---


#### CARD-10 — Sponsor companion Diario

**File/componenti reali:** `Sidebar.tsx` portal companion  
**Hit Biome attuale:** 0 surface (già sibling button)  
**Azione principale:** poiDetail  
**Controlli interni indipendenti:** grip lg+; add  
**Soluzione tecnica prevista:** verify-only  
**Pattern tecnico da adottare:** P-SURFACE-BUTTON + P-GRIP-ONLY  
**Stato piano tecnico (storico):** PRONTO PER IMPLEMENTAZIONE (verify-only)

**Stato finale:** **VERIFY OK** (consuntivo §11.7)

---

#### CARD-11 — Sponsor `#tour-sponsor-box`

**File/componenti reali:** `Sidebar.tsx` `#tour-sponsor-box`  
**Hit / soluzione / stato:** come CARD-10  
**Stato piano tecnico (storico):** PRONTO PER IMPLEMENTAZIONE (verify-only)

**Stato finale:** **VERIFY OK** (consuntivo §11.7)

---

#### CARD-12 — Foto classifiche

**File/componenti reali:** `src/components/rankings/PhotoGrid.tsx`  
**Hit Biome attuale:** L29 `div onClick`  
**Azione principale:** apri foto  
**Controlli interni indipendenti:** Like  
**Soluzione tecnica prevista:** P-SURFACE-BUTTON (batch gallery 05/14/22)  
**Pattern tecnico da adottare:** P-SURFACE-BUTTON  
**Stato piano tecnico (storico):** PRONTO PER IMPLEMENTAZIONE

**Stato finale:** **IMPLEMENTATO** (consuntivo §11.7)

---

#### CARD-13 — Riga POI classifiche

**File/componenti reali:** `src/components/rankings/PoiList.tsx`  
**Hit Biome attuale:** L15 `div onClick`  
**Azione principale:** apri/seleziona POI ranked  
**Controlli interni indipendenti:** nessuno  
**Soluzione tecnica prevista:** P-SIMPLE-BUTTON  
**Pattern tecnico da adottare:** P-SIMPLE-BUTTON  
**Stato piano tecnico (storico):** PRONTO PER IMPLEMENTAZIONE

**Stato finale:** **IMPLEMENTATO** (consuntivo §11.7)

---

#### CARD-14 — Hero foto bottega

**File/componenti reali:** `src/components/shop/ShopHero.tsx` + `DraggableSlider`  
**Hit Biome attuale:** L52 slide `div onClick` → `onOpenLightbox(img)`  

**REVISIONE TECNICA §11 — 2026-08-19 — determinazione pattern**  
- Ogni slide = nessun controllo nested (solo `ImageWithFallback` + gradient).  
- Prev/next = **sibling assoluti** del `DraggableSlider`, non figli della slide. Dots = div decorativi non interattivi.  
- `DraggableSlider` attacca drag-scroll al **contenitore**; i children restano cliccabili.  
- CTA «LEGGI LA STORIA» è nella colonna info sibling, fuori dalle slide.  
- **P-SURFACE-BUTTON non necessario** (nessun nested interattivo sulla slide).  
- **Pattern univoco: P-SIMPLE-BUTTON** — ogni slide `<button type="button">` con stesso layout/`onClick` lightbox.

**Soluzione tecnica prevista (CORRETTA / UNIVOCA):** P-SIMPLE-BUTTON per slide  
**Pattern tecnico da adottare:** P-SIMPLE-BUTTON (**non** P-SURFACE-BUTTON)  
**Event isolation necessario:** n/a sulla slide; prev/next restano button sibling  
**A11y / keyboard / touch:** Enter/Space apre lightbox; swipe sul container  
**Rischi/regressioni da evitare:** non mettere prev/next dentro la slide-button  
**Stato piano tecnico (storico):** PRONTO PER IMPLEMENTAZIONE

**Stato finale:** **IMPLEMENTATO** (consuntivo §11.7)

---


#### CARD-15 — Card prodotto bottega

**File/componenti reali:** `src/components/shop/ShopProducts.tsx`  
**Hit Biome attuale:** L64 `div onClick`  
**Azione principale:** select prodotto  
**Controlli interni indipendenti:** Plus decorativo (non azione propria)  
**Soluzione tecnica prevista:** P-SIMPLE-BUTTON; Plus visuale/aria-hidden  
**Pattern tecnico da adottare:** P-SIMPLE-BUTTON  
**Stato piano tecnico (storico):** PRONTO PER IMPLEMENTAZIONE

**Stato finale:** **IMPLEMENTATO** (consuntivo §11.7)

---

#### CARD-16 — Miniatura Live Feed

**File/componenti reali:** `src/components/community/liveFeed/LiveFeedCarousel.tsx`  
**Hit Biome attuale:** L40 thumb `div onClick`  
**Azione principale:** select hero / lightbox (doppio comportamento PO confermato)  
**Controlli interni indipendenti:** cuore display-only; «Carica altre» sibling  
**Soluzione tecnica prevista:** P-SIMPLE-BUTTON sulla thumb; cuore non falso controllo  
**Pattern tecnico da adottare:** P-SIMPLE-BUTTON  
**Stato piano tecnico (storico):** PRONTO PER IMPLEMENTAZIONE

**Stato finale:** **IMPLEMENTATO** (consuntivo §11.7)

---

#### CARD-17 — Card domanda Q&A Local

**File/componenti reali:** `QaForumTab.tsx` · `qaCityReturnMemory.ts` · `NavigationContext.tsx`  
**Hit Biome attuale:** 0 lista  
**Azione principale:** nessuna (P-NoMainSurface)  
**Controlli interni indipendenti:** autore (overlay + CloseButton Escape LIFO); città (save+navigate); Risposte; Segui  
**Soluzione tecnica prevista:** nessuna bonifica surface; preservare return città + overlay autore  
**Pattern tecnico da adottare:** P-NO-MAIN-SURFACE  
**File aggiuntivi:** NavigationContext / FeatureModals / GlobalSectionView solo se regressione restore  
**Stato piano tecnico (storico):** PRONTO PER IMPLEMENTAZIONE (verify-only)

**Stato finale:** **VERIFY OK** (consuntivo §11.7)

---

#### CARD-18 — Guide/TO Diario + Salva Contatto

**File/componenti reali (surface):** `DiaryResourceCard.tsx` — già button surface  
**Hit Biome attuale:** 0  
**Azione principale:** apri mini-card  
**Controlli interni indipendenti:** web, eye, pencil, trash, phone, swipe  
**Soluzione Biome surface:** nessuna  
**Allineamento funzionale PO (2026-08-19):**  
- Prima: `handleConfirmAddMemo` crea `memo` + toast XP auto  
- Dopo: `MOVE_ITEM` via `onDayDropProp` (+ undo `pendingMoveActionRef`); conferma `toastMessage` senza auto-dismiss  
**Pattern tecnico da adottare:** surface già OK; fix funzionale **implementato**  
**Stato piano tecnico:** IMPLEMENTATO (funzionale + verify)

**Stato finale:** **IMPLEMENTATO** (consuntivo §11.7)

---

#### CARD-19 — Riga oggetto Valigia

> **CONTRATTO IMPLEMENTATO / VINCOLI VERIFICATI** (deep-dive 2026-08-19/20 → codice 2026-08-19).  
> Residuo Biome shell drop-target = **LEGITTIMO / STRUTTURALE / NON DA SILENZIARE** (vedi §2ter / §11.7).

**File/componenti reali:** `src/components/features/diary/packing_list/suitcase/SuitcaseItemRow.tsx`  
**Consumer:** `CategoryItemsGrid.tsx` (wrap `SwipeToDelete`) · drag handlers `SuitcaseEditorView.tsx`  
**Hit Biome (storico pre-bonifica):** L113 outer `div onClick={onSelect}`; L237 qty group `div onClick={stopPropagation}`  
**Hit Biome (post-bonifica):** shell `div` con `onDragOver` / `onDragLeave` / `onDrop` — **legittimo HTML5 drop-target**; surface = button select.  

**REVISIONE TECNICA §11 — 2026-08-19 (densità controlli)** — superata dalla deep-dive sotto.

**REVISIONE TECNICA §11 — 2026-08-19/20 (deep-dive CARD-19, solo documento)**

##### Evidenze codice reali

| Area | Evidenza |
|------|----------|
| Shell | `div` L113–131: `onClick={onSelect}` + `onDragOver`/`onDragLeave`/`onDrop` se `reorderEnabled`; `ref={rowRef}`; **non** `draggable` |
| Grip | `button` L134–169: **unico** `draggable`; `setDragImage(rowRef.current)` (anteprima = riga intera); `onDragStart`/`onDragEnd` → props parent; `stopPropagation` su click/drag |
| Payload MIME | `SuitcaseEditorView.handleItemDragStart`: `effectAllowed='move'`; **`setData('text/plain', itemId)`** — **non** `application/json` (diverso dal drag POI diario) |
| Drop target | Stessi handler sulla **shell**; `preventDefault` + `dropEffect='move'` in `handleItemDragOver`; leave con `relatedTarget`/`contains` |
| Select prodotto | `CategoryItemsGrid`: toggle `selectedItemName` via `onSelectItem(name\|null)` |
| Swipe mobile | `SwipeToDelete` **padre** della row (`!readOnly && !is_ai_suggestion`); pointer su wrapper translateX; `touch-action: pan-y`; click post-swipe swallowed in capture |
| Popover | `MoveItemCategoryPopover` → trigger `button` + `AnchoredPopover` **portal su `document.body`** (`pointer-events-auto`, `stopPropagation` sul pannello) |

##### Inventario controlli interattivi (chi riceve il click / isolation)

| Elemento | Tipo | Azione | Surface può intercettare? | `pointer-events-auto` + z≥1 | `stopPropagation` oggi | Dopo P-SURFACE |
|----------|------|--------|---------------------------|----------------------------|-------------------------|----------------|
| Superficie libera / nome | shell click → surface | toggle select | — (è la surface) | nome in zona `pointer-events-none` | n/a | surface riceve click |
| Grip | `button`+`draggable` | solo reorder | No se sopra surface | **Obbligatorio** | sì (click) | resta; **non** draggable sulla surface |
| Checkbox (RW) | `button` | toggle `is_checked` | No se pe-auto | **Obbligatorio** | sì | isolation strutturale; stopProp opzionale |
| Checkbox (RO) | `button` disabled | nessuno | pe-auto consigliato | sì | sì | invariato |
| Qty − / + | `button` | `adjustQuantity` | No se pe-auto sul group | **Obbligatorio sul group** | group L237 | **legacy**: rimuovere onClick dal `div` group |
| Qty `<input>` | text/numeric | commit blur/Enter | **Critico** — deve restare focusabile/editabile | pe-auto sul group | via group | invariato comportamento; niente surface sopra l’input |
| Amazon `<a>` | link | affiliate + nuova tab | No se pe-auto | **Obbligatorio** | sì | strutturale; stopProp opzionale |
| Move category trigger | `button` | open popover | No se pe-auto | **Obbligatorio** | sì | strutturale |
| Opzioni popover | `button` in portal | `onMoveToCategory` | **No** (fuori DOM riga) | n/a (portal) | sì | invariato |
| AI accept / reject | `button` | update / delete | No se pe-auto | **Obbligatorio** | sì | strutturale |
| Delete desktop `lg+` | `button` | `onDelete` | No se pe-auto | **Obbligatorio** | sì | strutturale |
| Badge «AI» | div+span | nessuno | click → select (oggi bubble shell) | lasciare pe-none | n/a | stessa azione surface OK |
| Nome item | `span` | nessuno | deve passare alla surface | pe-none | n/a | select via surface |

##### Risposte ai 12 punti di verifica

1. **Shell non interattiva vs drag/drop?** **Sì.** Drop non richiede `onClick`. Rimuovere solo `onClick={onSelect}`; tenere `onDragOver`/`Leave`/`Drop` + `rowRef` sulla shell `div`.
2. **Surface button assoluta + drop target?** **Sì, con bubble.** Hit-test può colpire la surface (`z-0`); `dragover`/`drop` **bubblano** alla shell che fa `preventDefault`. Surface **senza** handler drag e **senza** `stopPropagation` sui drag events. Surface **non** `draggable`.
3. **Controlli:** vedi tabella — tutti i controlli reali = sibling sopra surface con `pointer-events-auto`; nessun controllo figlio della surface button.
4. **Qty / Amazon / popover / AI:** input e link restano nativi sopra la surface; popover options fuori riga (portal); AI buttons indipendenti.
5. **Touch/mobile:** tap area libera → surface → select; swipe resta sul **padre** `SwipeToDelete` (eventi bubble dal figlio); non mettere `touch-action` che blocchi pan-y del wrapper; grip `touch-manipulation` invariato.
6. **Keyboard/focus:** surface `type="button"` + `aria-label` (es. seleziona/deseleziona oggetto) riceve Tab/Enter/Space — **migliora** l’a11y rispetto al `div onClick`. Tab order consigliato: surface (prima in DOM) → grip → checkbox → qty → Amazon → move → AI/delete. Input qty resta nel tab cycle.
7. **Grip-only drag?** **Sì** — unico `draggable` oggi; surface e shell restano non-draggable.
8. **Payload/MIME invariati?** **Obbligatorio:** solo `text/plain` + `itemId`; `effectAllowed='move'`; `setDragImage` su `rowRef` shell. Non migrare a JSON «per allineamento» ad altre CARD.
9. **Nested interactive?** Evitati se surface è **vuota** e sibling; **vietato** wrappare la riga intera in un `<button>`.
10. **Select su superficie libera?** Sì via surface sotto zone `pointer-events-none` (nome, padding, badge AI).
11. **Controlli secondari non selezionano?** Sì se tutti hanno `pointer-events-auto` e z-index sopra la surface (non sono discendenti del surface button).
12. **Alternativa migliore a P-SURFACE-BUTTON?** Valutate e **scartate** per questa riga: (a) solo nome-as-button → riduce hit-area vs PO «superficie riga»; (b) shell `role="button"`/`tabIndex` → non risolve Biome static-interaction in modo pulito; (c) un solo `<button>` wrapping → nested button illegali. **P-SURFACE-BUTTON resta la soluzione corretta**, allineata a Showcase/Sponsor ma con vincoli Valigia (drop + swipe + MIME propri).

##### Vincoli obbligatori in implementazione

1. Shell resta `div` relative: drop handlers + `rowRef`; **no** `onClick`.
2. Surface: `<button type="button" aria-label=… className="absolute inset-0 z-0 …">` **vuoto**; `onClick={onSelect}`; non draggable; non catturare drag con stopPropagation.
3. Wrapper contenuto: `relative z-[1] pointer-events-none`; ogni controllo reale (grip incluso) `pointer-events-auto`.
4. Rimuovere `onClick={stopPropagation}` dal **div** qty (P-STOPPROP-LEGACY / hit Biome).
5. Non cambiare MIME, swap logic, SwipeToDelete, altezze `suitcaseLayoutConstants`.
6. Nessun `any` / cast fragile / `biome-ignore` / aria fittizia: HTML button nativo + label.
7. `stopPropagation` sui button/link può restare difensivo verso antenati (Swipe capture escluso); non è la isolation primaria verso la surface.

##### Rischi residui (mitigati dal piano, da smoke-test in implementazione)

- Dimenticare `pointer-events-auto` su **un** controllo → click mangia select o controllo morto.
- `preventDefault` dragover deve continuare a girare sulla shell (bubble) — non spostare i soli handler sulla surface senza replica.
- Dopo swipe, `SwipeToDelete` già swallow click: non regressione attesa.
- Hover `group-hover` resta sulla shell `div` (come oggi).

##### Verdetto

**P-SURFACE-BUTTON è CONFERMATO SICURO** per CARD-19, purché i vincoli sopra siano rispettati alla lettera. Non forzare altri pattern.

**Soluzione tecnica prevista (CONFERMATA deep-dive 2026-08-19/20):** P-SURFACE-BUTTON + P-GRIP-ONLY + P-STOPPROP-LEGACY (qty wrapper)  
**Pattern tecnico da adottare:** P-SURFACE-BUTTON + P-GRIP-ONLY  
**Event isolation necessario:** strutturale (`pointer-events` + z-index); drop via bubble sulla shell  
**A11y / keyboard / touch:** surface focusabile; swipe padre invariato; min targets checkbox già OK  
**Rischi/regressioni da evitare:** pe-auto incompleto; MIME diverso; surface draggable; nested button; rompere SwipeToDelete  
**Stato piano tecnico:** IMPLEMENTATO (deep-dive 2026-08-19/20)

**Stato finale:** **IMPLEMENTATO** (consuntivo §11.7)
**Hit Biome residuo:** `noStaticElementInteractions` su shell solo per `onDragOver`/`Leave`/`Drop` (drop-target HTML5 legittimo; non ignorato)

---

#### CARD-20 — Eventi Locali (expand)

**File/componenti reali:** `CityEventsTab.tsx`  
**Hit Biome attuale:** 0  
**Azione principale:** nessuna sulla superficie libera  
**Controlli interni indipendenti:** chevron expand; AGGIUNGI  
**Soluzione tecnica prevista:** verify-only P-CHEVRON-ONLY  
**Stato piano tecnico (storico):** PRONTO PER IMPLEMENTAZIONE (verify-only)

**Stato finale:** **VERIFY OK** (consuntivo §11.7)

---

#### CARD-21 — Card servizio (expand)

**File/componenti reali:** `ServicesCategoryList.tsx`  
**Hit Biome attuale:** 0  
**Soluzione tecnica prevista:** verify-only P-CHEVRON-ONLY  
**Stato piano tecnico (storico):** PRONTO PER IMPLEMENTAZIONE (verify-only)

**Stato finale:** **VERIFY OK** (consuntivo §11.7)

---

#### CARD-22 — Gallery Preview

**File/componenti reali:** `PreviewGallery.tsx`  
**Hit Biome attuale:** L123 tile `div onClick`  
**Azione principale:** apri lightbox  
**Controlli interni indipendenti:** slider sibling  
**Soluzione tecnica prevista:** P-SIMPLE-BUTTON tile (batch gallery)  
**Stato piano tecnico (storico):** PRONTO PER IMPLEMENTAZIONE

**Stato finale:** **IMPLEMENTATO** (consuntivo §11.7)

---

#### CARD-23 — Sidebar Preview

**File/componenti reali:** `PreviewSidebar.tsx`  
**Hit Biome attuale:** L55 `div onClick` → `onSelectCity` (**solo preview**, non navigate)  
**Azione principale:** select città in preview  
**Soluzione tecnica prevista:** P-SIMPLE-BUTTON  
**Rischi/regressioni da evitare:** non trasformare in `navigateToCity`  
**Stato piano tecnico (storico):** PRONTO PER IMPLEMENTAZIONE

**Stato finale:** **IMPLEMENTATO** (consuntivo §11.7)

---

#### CARD-24 — Promo Gold Shop (slot vuoto)

**File/componenti reali:** `ShopHomeView.tsx`  
**Hit Biome attuale:** L99 `div onClick={onOpenShopSponsor}`  
**Azione principale:** apri flusso sponsor (intera area)  
**Controlli interni indipendenti:** CTA `<span>` stessa azione  
**Soluzione tecnica prevista:** un solo P-SIMPLE-BUTTON full-bleed; non due controlli stessa azione  
**Stato piano tecnico (storico):** PRONTO PER IMPLEMENTAZIONE

**Stato finale:** **IMPLEMENTATO** (consuntivo §11.7)

---

#### CARD-25 — Notifica + pallino

**File/componenti reali:** `UserNotificationsTab.tsx`  
**Hit Biome attuale:** 0  
**Azione principale:** open notifica (button)  
**Controlli interni indipendenti:** pallino read/unread  
**Soluzione tecnica prevista:** verify-only  
**Stato piano tecnico (storico):** PRONTO PER IMPLEMENTAZIONE (verify-only)

**Stato finale:** **VERIFY OK** (consuntivo §11.7)

---

#### CARD-26 — Template Social Studio (Admin)

**File/componenti reali:** `AdminSocialStudio.tsx` L181–199  
**Hit Biome attuale:** L181 row `div onClick` select  
**Azione principale:** select template  
**Controlli interni indipendenti:** Trash `<button>` + `stopPropagation`  

**REVISIONE TECNICA §11 — 2026-08-19**  
- DOM: row flex + nome (span) + trash button. Nessun altro nested interattivo sulla row.  
- **P-SURFACE-BUTTON univoco** (non slash ambiguo con P-SIMPLE-BUTTON): surface per select; trash sibling `pointer-events-auto`.  
- Trash non deve selezionare il template (PO invariato).

**Soluzione tecnica prevista (CORRETTA / UNIVOCA):** P-SURFACE-BUTTON; trash indipendente  
**Pattern tecnico da adottare:** P-SURFACE-BUTTON  
**Event isolation necessario:** strutturale; trash non seleziona  
**A11y / keyboard / touch:** aria-label select/delete  
**Rischi/regressioni da evitare:** trash che seleziona template  
**Stato piano tecnico:** IMPLEMENTATO (2026-08-19) — shell senza onClick; surface `inset-0 z-0`; nome `pointer-events-none`; trash `relative z-[1] pointer-events-auto`

**Stato finale:** **IMPLEMENTATO** (consuntivo §11.7)

---


#### CARD-27 — Card città Analisi Regionale AI (Admin)

**File/componenti reali:** `RegionalAnalysisModal.tsx` ~L725  
**Hit Biome attuale:** presente (`toggleCitySelection`)  
**Nota prodotto:** **SOSPESA** strategia creazione città — **non** progettare bonifica comportamento  
**Soluzione tecnica prevista:** nessuna in questo piano; documentare solo ubicazione hit  
**Stato piano tecnico:** RIMANDATA (prodotto congelato)

**Stato finale:** **RIMANDATA — prodotto congelato** (consuntivo §11.7)

---

#### CARD-28 — Riga città ZoneCard (Admin)

**File/componenti reali:** `ZoneCard.tsx` ~L312  
**Hit Biome attuale:** presente  
**Nota prodotto:** **SOSPESA** come CARD-27  
**Soluzione tecnica prevista:** nessuna in questo piano  
**Stato piano tecnico:** RIMANDATA (prodotto congelato)

**Stato finale:** **RIMANDATA — prodotto congelato** (consuntivo §11.7)

---

#### CARD-29 — Anomalia Osservatorio (Admin)

**File/componenti reali:** `AnomalyInspector.tsx`  
**Hit Biome attuale:** L369 `div onClick` → `handleEdit(poi)`  
**Azione principale:** edit POI  
**Controlli interni indipendenti:** matita **solo visuale** (non split)  
**Soluzione tecnica prevista:** P-SIMPLE-BUTTON; matita `aria-hidden`  
**Pattern tecnico da adottare:** P-VISUAL-SAME-ACTION + P-SIMPLE-BUTTON  
**Stato piano tecnico (storico):** PRONTO PER IMPLEMENTAZIONE

**Stato finale:** **IMPLEMENTATO** (consuntivo §11.7)

---

#### CARD-30 — CityHistory

**File:** rimosso (glob 0)  
**Hit Biome attuale:** nessuno sul componente  
**Soluzione tecnica prevista:** non ripristinare; cleanup citazioni doc = §10 / §11.4  
**Stato piano tecnico:** CHIUSA (dead code)

**Stato finale:** **CHIUSA — dead code rimosso** (consuntivo §11.7)

---

#### CARD-31 — `AdPlaceholder`

**File/componenti reali:** `src/components/common/AdPlaceholder.tsx` L44  
**Call-site verificati (8) — nessuno passa children interattivi:**  
HomeContent×2, Sidebar×2, CityShowcaseTab, CityCategoryTab, CategorySponsorColumn, ShopPartnerColumn. Solo props `onClick`/`className`/`vertical`/`variant`/`label`.  

**REVISIONE TECNICA §11 — 2026-08-19**  
- Nessun ref sul root; nessun button/link figlio; CSS via className trasferibile a `<button type="button">` (mantenere `group` per hover).  
- Tutti e 8 i call-site passano `onClick` (contratto opzionale invariato).  
- Contenuto interno = solo span/div non interattivi.  
- **P-SIMPLE-BUTTON nel componente condiviso è sicuro** su tutti i call-site.  
- Nessun `any` / cast / biome-ignore.

**Soluzione tecnica prevista (CONFERMATA):** P-SIMPLE-BUTTON in `AdPlaceholder`  
**Pattern tecnico da adottare:** P-SIMPLE-BUTTON  
**Event isolation necessario:** n/a  
**A11y / keyboard / touch:** aria-label da label/testo display; type=button  
**Rischi/regressioni da evitare:** cambiare contratto `onClick`; rompere sizing className  
**Stato piano tecnico (storico):** PRONTO PER IMPLEMENTAZIONE

**Stato finale:** **IMPLEMENTATO** (consuntivo §11.7)

---


#### CARD-32 — `ImageWithFallback`

**File:** `ImageWithFallback.tsx` ~L108  
**Hit Biome attuale:** wrapper `div` + optional `onClick`  
**Soluzione tecnica prevista:** **nessuna ora** — DA LASCIARE PER FINE AUDIT  
**Stato piano tecnico:** DEFERRED (fine audit)

**Stato finale:** **DEFERRED — fine audit** (consuntivo §11.7)

---

### 11.4 Documentazione da aggiornare **dopo** la bonifica codice

| File | Quando |
|------|--------|
| `AI_CONTEXT/21_CITY_HISTORY_SYSTEM.md` | Se ancora cita CityHistory.tsx |
| `AI_CONTEXT_MASTER/04_TERRITORIAL_ENGINE.md` | Idem CityHistoryTab |
| `AI_CONTEXT/03_PROJECT_LOGIC_MAP.md` | Solo se CARD-18 move-day o Q&A return rendono incompleto un contratto documentato |
| Follow-up Biome 101 / schede a11y | Allineare baseline post-bonifica |

**Non** aggiornare AI_CONTEXT solo per markup interno.

### 11.5 Ordine storico di implementazione

> **Storico titolo:** «Ordine consigliato di implementazione (post-validazione)».  
> Quelle attività **sono già state eseguite** (vedi §11.7). Elenco conservato come cronologia operativa.

1. Micro-delta: CARD-06 ActionRow wrapper; verify 07/08/10/11/17/20/21/25  
2. Batch P-SIMPLE / CTA: 02, 13, 15, 23, 24, 29, 31  
3. Batch P-SURFACE + nested: 01, 03, 04 (+ demote chip/footer), 09  
4. Batch gallery/media: 05, 12 (surface+like); 14, 16, 22 (P-SIMPLE)  
5. Suitcase: 19 (surface + grip-only + pointer-events su tutti i controlli)  
6. Admin non congelati: 26 (P-SURFACE univoco) (+ 29 se non già in batch 2)  
7. Funzionale CARD-18 move-day + conferma  
8. Skip: 27, 28, 30, 32  

### 11.6 Esito validazione del piano

Il criterio di validazione del piano §11 è stato **soddisfatto** per tutte le CARD in scope:

| Classe | Esito |
|--------|--------|
| CARD implementate (01–06, 09, 12–16, 18–19, 22–24, 26, 29, 31) | Piano §11 **applicato** |
| Verify-only (07, 08, 10, 11, 17, 20, 21, 25) | **Conformità verificata** |
| 27, 28 | **Escluse** per congelamento prodotto |
| 30 | **Chiusa** tramite rimozione dead code |
| 32 | **Deferred** intenzionalmente |

*(Storico pre-implementazione: «Per ogni CARD PRONTO PER IMPLEMENTAZIONE è noto: file, struttura…» — requisito soddisfatto e poi eseguito.)*

### 11.7 Registro implementazione / CONSUNTIVO — 2026-08-19 (aggiornato documentale 2026-08-20)

Bonifica codice eseguita secondo §11 (ordine storico §11.5). Decisioni PO invariate. Nessun `biome-ignore` / `any` / cast fragile.  
Questo §11.7 è il **consuntivo ufficiale** della bonifica S-CARD-ROW.
#### Esito per CARD

| CARD | Pattern | Stato codice | Note |
|------|---------|--------------|------|
| 01 | P-SURFACE-BUTTON | **IMPLEMENTATO** | CityCard; favorite pe-auto |
| 02 | P-SIMPLE-BUTTON | **IMPLEMENTATO** | MiniCityCard |
| 03 | P-SURFACE-BUTTON | **IMPLEMENTATO** | ItinerariesList; like indipendente |
| 04 | P-SURFACE + demote | **IMPLEMENTATO** | chip/footer visuali; solo surface apre; preferito indipendente |
| 05 | P-SURFACE-BUTTON | **IMPLEMENTATO** | GalleryGrid PhotoCard |
| 06 | micro-delta | **IMPLEMENTATO** | rimosso onClick stopProp da ActionRow wrapper; grip/MIME invariati |
| 07–08 | verify-only | **VERIFY OK** | SponsorSideCard già conforme |
| 09 | P-SURFACE-BUTTON | **IMPLEMENTATO** | Sidebar strip mobile; no grip |
| 10–11 | verify-only | **VERIFY OK** | companion / #tour-sponsor-box |
| 12 | P-SURFACE-BUTTON | **IMPLEMENTATO** | rankings PhotoGrid |
| 13 | P-SIMPLE-BUTTON | **IMPLEMENTATO** | rankings PoiList |
| 14 | P-SIMPLE-BUTTON | **IMPLEMENTATO** | ShopHero slide button; prev/next sibling |
| 15 | P-SIMPLE-BUTTON | **IMPLEMENTATO** | ShopProducts; Plus aria-hidden |
| 16 | P-SIMPLE-BUTTON | **IMPLEMENTATO** | LiveFeedCarousel thumb |
| 17 | verify-only | **VERIFY OK** | Q&A no main surface |
| 18 | funzionale MOVE | **IMPLEMENTATO** | `handleConfirmAddMemo` → `MOVE_ITEM`; conferma DiaryModals non auto-dismiss; banner TravelDiary solo se `xp > 0` |
| 19 | P-SURFACE + grip | **IMPLEMENTATO** | deep-dive rispettata; MIME `text/plain`+itemId; SwipeToDelete padre |
| 20–21 | verify-only | **VERIFY OK** | chevron-only |
| 22 | P-SIMPLE-BUTTON | **IMPLEMENTATO** | PreviewGallery |
| 23 | P-SIMPLE-BUTTON | **IMPLEMENTATO** | PreviewSidebar (solo onSelectCity) |
| 24 | P-SIMPLE-BUTTON | **IMPLEMENTATO** | ShopHomeView gold promo |
| 25 | verify-only | **VERIFY OK** | notifiche |
| 26 | P-SURFACE-BUTTON | **IMPLEMENTATO** | trash pe-auto non seleziona |
| 27–28 | — | **NON TOCCATE** | prodotto congelato |
| 29 | P-SIMPLE + visual | **IMPLEMENTATO** | AnomalyInspector; matita aria-hidden |
| 30 | — | **CHIUSA** | dead code |
| 31 | P-SIMPLE-BUTTON | **IMPLEMENTATO** | AdPlaceholder condiviso (8 call-site) |
| 32 | — | **DEFERRED** | non affrontata |

#### Hit Biome residui (cluster S-CARD-ROW / a11y click-static)

L’**unico hit residuo del cluster oggetto della bonifica** è `SuitcaseItemRow` sullo shell di drop target HTML5 per `onDragOver` / `onDragLeave` / `onDrop`.

È **intenzionale e necessario**. La surface interattiva **non** è più un `div onClick`. Non esiste un problema di a11y sulla superficie da risolvere.

**Non** proporre: `biome-ignore`; `role=button` sullo shell; conversione dello shell in button; spostamento artificiale dei drag handler sulla surface; eliminazione del drop target.

| File | Hit | Motivazione |
|------|-----|-------------|
| `SuitcaseItemRow.tsx` shell | `noStaticElementInteractions` su `onDragOver`/`Leave`/`Drop` | **LEGITTIMO / STRUTTURALE / NON DA SILENZIARE**: shell `div` deve restare antenato dei controlli pe-auto (bubble). Surface gestisce solo select. |
| Altri file del batch in scope | nessun `noStaticElementInteractions` / `useKeyWithClickEvents` residuo sulla superficie cliccabile oggetto di §11 | Preesistenti fuori scope: `noArrayIndexKey`, exhaustive-deps, label admin, ecc. |
| CARD-27 / 28 | hit eventuali su Admin città | **Congelate** — fuori ciclo |
| CARD-32 | hit utility `ImageWithFallback` | **Deferred** — fuori ciclo |

#### Typecheck

Non risultano nuovi errori TypeScript **attribuiti alla bonifica S-CARD-ROW**, secondo la verifica eseguita. Errori typecheck **preesistenti** in admin cityEditor / RegionalAnalysis / document-save restano **fuori scope**. **Non** dichiarare che l’intero repository è type-safe.

#### Smoke test (checklist)

**A. Verifiche tecniche già effettuate (implementazione):**

- [x] Pattern surface/simple applicati per CARD in scope  
- [x] CARD-04 demote chip/footer  
- [x] CARD-06 ActionRow legacy rimosso  
- [x] CARD-14 slide = button, prev/next sibling  
- [x] CARD-18 MOVE_ITEM + modal non auto-dismiss; no banner +0 XP  
- [x] CARD-19 vincoli deep-dive (shell drop, MIME, pe-auto, qty legacy rimosso, role=checkbox)  

**B. Smoke UI manuale PO — consigliato, NON ancora certificato come eseguito in questo registro:**

- [ ] Valigia reorder / swipe / qty / Amazon  
- [ ] Diario Salva Contatto  
- [ ] Gallery like  
- [ ] Favorite CityCard  

#### Discrepanze residue

- CARD-19: hit Biome drop-target su shell (vedi tabella) — **accettato strutturalmente**, non “problema aperto”.  
- CARD-27/28/32: fuori scope.  
- Typecheck repo: debito preesistente admin/save (fuori scope).

---

## 7. Changelog audit

| Data | Nota |
|------|------|
| 2026-08-20 (split History/Delta) | **Solo documento.** Separazione: storico → `S-CARD-ROW_HISTORY.md`; operativo → `S-CARD-ROW_OPEN_DELTA.md`; hub → `AUDIT_S_CARD_ROW_32.md`. Nessuna modifica decisioni PO / codice. |
| 2026-08-20 (consuntivo doc) | **Solo documento.** Consuntivo S-CARD-ROW post-implementazione: contratto §11 applicato; CARD in scope implementate/verificate; CARD-19 mantiene esclusivamente il residuo Biome strutturale del drop target HTML5; 27/28 congelate; 30 rimossa; 32 deferred. Snapshot §1/§2ter, §6/§9/§11 trasformati da piano a POST-AUDIT REGISTER. Nessun codice applicativo. |
| 2026-08-19 (Home Gold filter SoT) | **Codice.** Verifica architetturale: Gold UI = `ResolvedSponsor.tier === 'gold'` (pricing→resolvePlanTier), allineato città. Rimosso OR su `type===REGIONAL` (falso positivo se type/pricing divergono). Unicità upper∩lower=∅ preservata. |
| 2026-08-19 (Home PARTNER unique+AdPlaceholder) | **Codice.** Unique sponsor su **tutta** la Home: griglia bassa esclude id già in area In Evidenza. `AdPlaceholder`: rimossa prop legacy `vertical` (mai usata); `onClick={onClick}`; call-site ripuliti. |
| 2026-08-19 (Home PARTNER fix) | **Codice.** Regressione layout PARTNER: ripristino classi `SponsorSideCard`/`AdPlaceholder` w-full. Gold assente: Home filtrava solo `type===REGIONAL` vs città `tier===gold` — allineato + unique id per slot + placeholder. Audit CARD-08 aggiornato. |
| 2026-08-19 (impl completa) | **Codice.** Bonifica S-CARD-ROW §11: CARD 01–06, 09, 12–16, 18–19, 22–24, 26, 29, 31; verify 07/08/10/11/17/20/21/25; skip 27/28/30/32. CARD-18 MOVE_ITEM + conferma; TravelDiary toast solo xp>0. §11.7 registro. |
| 2026-08-19 (impl CARD-18/26) | **Codice.** CARD-26: P-SURFACE-BUTTON su riga template Social Studio. CARD-18: `handleConfirmAddMemo` → `MOVE_ITEM` + conferma `toastMessage` non auto-dismiss; discrepanza memo chiusa. |
| 2026-08-19/20 (CARD-19 deep) | **Solo documento.** Deep-dive §11 CARD-19 SuitcaseItemRow: drop shell+bubble vs surface; MIME `text/plain`; SwipeToDelete padre; popover portal; inventario controlli; P-SURFACE-BUTTON confermato con vincoli; alternative scartate. Nessun codice applicativo. |
| 2026-08-19 (rev-DOM) | **Solo documento.** Revisione tecnica mirata §11 su CARD 01/03/04/05/06/09/14/19/26/31 vs DOM reale; corretti piani 04/14/26; 06 risposte sibling/legacy stopPropagation; 31 call-site OK. Nessun codice applicativo. |
| 2026-08-19 | **Solo documento.** §11 Contratto tecnico bonifica Biome: ricognizione codice reale CARD-01…32; decisioni PO invariate; pattern P-*; matrice implementabile; §2ter aggiornato a hit live; nessuna modifica applicativa. |
| 2026-08-18 (sera2) | **Solo audit.** CARD-09/10/11: contratto = CARD-08, layout propri (no unificazione visuale). CARD-17: Risposte = controllo interattivo (span-label storico superato). CARD-18: A/B/C chiusa → **sposta** giorno + conferma non auto-dismiss; **DISCREPANZA** codice `handleConfirmAddMemo` ancora crea memo. Domande PO aperte = 0. Nessun file applicativo modificato. |
| 2026-08-18 (REVIEW) | Riallineamento codice↔documento tutte le 32 CARD; §2ter snapshot Biome; grip Sidebar 10/11 solo-drag (REGOLA GENERALE); CARD-18 FATTO=crea Nota + domanda A/B/C UI; CARD-19≠CARD-06 come componente; CARD-29 matita solo visiva; pattern rinominati (no P1 forzato); domande PO ripulite. |
| 2026-08-18 (sera) | REGOLA GENERALE §2bis; CARD-06 grip-only drag; CARD-17 contratto multi-controllo + ritorno città; CARD-10 percorso UI click-per-click; proposta pattern Biome P1–P5; preferito BusinessView `resolveResourceType`; audit 08/19/21/25/29 aggiornati. |
| 2026-08-18 (review) | CARD-07: layout sempre 3 col; `SponsorSideCard` condivisa Home↔Shop; no nested scroll; ShopPage `onRemove` reale. CARD-18: superficie button + `onEditResource`; preferito BusinessView. CARD-25: riga semantica 2 button; service error Supabase. |
| 2026-08-18 | CARD-07 A + layout PARTNER\|LISTA\|PARTNER + riuso CategorySponsorColumn (rimosso ShopSponsorColumn); CARD-18 matita/Modifica + swipe tappe + undo + onRemove modale; **STOP** su Conferma giorno; CARD-25 pallino ●/○ + markAsUnread; Biome non affrontato. |
| 2026-08-17 (sera) | CARD-22 DECISO; CARD-25 feature + domanda UI; CARD-07 percorso Shop + A/B/C; CARD-18 percorso Memo + Q1/Q2; **CARD-30 rimozione** CityHistory.tsx; sezioni 8–10; 27/28/31/32 invariati. |
| 2026-08-17 | Consolidamento decisioni PO 01–16/19/23–26/29/31; §3bis sponsor; audit CARD-07 ShopSponsorColumn (deviazione); CARD-10 packingList companion; CARD-17 re-audit (Biome hit superato); CARD-18 ≠ Nota Giorno; CARD-19 conformità e-commerce; **fix** CARD-20/21 expand esplicito; CARD-22 entry Admin Descrizione Card; CARD-27/28 note strategia città; CARD-30 concluso dead code vs HistoryModal+CultureCornerModal; CARD-32 rimandata. |
| 2026-08-16 | Creazione registro: ricostruzione percorsi UI CARD-01…32; decisioni PO già note registrate; CARD-30 dichiarato non raggiungibile; CARD-32 rimandato; chiariti 06/07 (lista pre-dettaglio) e 08–11 (stesso pattern sponsor, 4 mount); inventariato CARD-31. |

---

## Stato trasferito al DELTA

| CARD | Stato |
|------|-------|
| 01–26 | **CHIUSA** (IMPLEMENTATO o VERIFY OK — dettaglio nelle schede §3 / §11.7) |
| 27 | **ESCLUSA / CONGELATA** — strategia città/comuni |
| 28 | **ESCLUSA / CONGELATA** — strategia città/comuni |
| 29 | **CHIUSA** (IMPLEMENTATO) |
| 30 | **CHIUSA / DEAD CODE RIMOSSO** |
| 31 | **CHIUSA** (IMPLEMENTATO) |
| 32 | **DEFERRED** — trasferita al documento operativo [`S-CARD-ROW_OPEN_DELTA.md`](./S-CARD-ROW_OPEN_DELTA.md) |

**Residuo Biome accettato (non trasferito come lavoro aperto):** CARD-19 shell HTML5 drop-target (`onDragOver` / `onDragLeave` / `onDrop`) — legittimo / strutturale / non da silenziare. Dettaglio: §2ter, §11.7.

---

*Fine HISTORY — non usare questo file per nuovi task operativi. Aggiornare [`S-CARD-ROW_OPEN_DELTA.md`](./S-CARD-ROW_OPEN_DELTA.md) per il lavoro residuo.*
