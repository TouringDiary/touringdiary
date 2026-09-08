# AUDIT / GUIDA TECNICA — Angolo Cultura Timeline

> **Tipo:** Audit architetturale, logico, UX/UI e tecnico (sola lettura sul codice applicativo) + specifica della futura evoluzione.  
> **Data:** 2026-08-27 (Fase 1–5) · **Fase 6 (estensione UI + community + Admin hub):** 2026-08-27  
> **Scope:** Runtime Angolo Cultura; requisiti UX; contratto date; **tabelle dedicate** standard Master/Specific; **multi-classificazione** personaggio; eliminazione `role`; riuso pattern POI (non tabelle POI); impact primitive; **estensione timeline dinamica / CTA / azioni community / Admin Personaggio famoso**.  
> **Regola audit Fasi 1–4:** sola lettura. **Fase 5:** implementazione Timeline base. **Fase 6:** audit estensione (implementazione feature F6 **non** avviata in questa fase).  
> **Dati di test:** `city_people` bonificati in migration cutover (16 record test verificati su DB reale pre-cutover).  
> **SoT tecnico vigente:** questo file. DOC 17 / MASTER 04 / 03 allineati in Fase 5; FASE 6 estende il contratto UX/community.  
> **Readiness:** gate feature base **§F5.3 IMPLEMENTATO**; gate estensione **§F6.12** (audit — non implementare F6 prima del GO).  
> **Obbligatorio:** rispettare FASE 3–5 (incl. PO-Q, PO-R, §F4.2) + requisiti FASE 6 senza riaprire decisioni chiuse.

---

## Legenda stati (obbligatoria)

| Etichetta | Significato |
|-----------|-------------|
| **ESISTENTE E VERIFICATO** | Trovato nel repository e analizzato |
| **ESISTENTE MA DA GENERALIZZARE** | Esiste, ma API/semantica non coprono il nuovo caso senza adattamento |
| **NON ESISTENTE** | Cercato nel repository, non individuato |
| **DA VALUTARE** | Esiste un vincolo o un’opzione; decisione in fase di implementazione |
| **REQUISITO APPROVATO** | Comportamento deciso (sezioni 23–30); non è una proposta |
| **PROPOSTA TECNICA** | Scelta architetturale suggerita per l’implementazione futura |

---

## 1. Obiettivo

Trasformare l’attuale Angolo Cultura (griglia di personaggi nel modale) in una sezione composta da:

1. fascia/timeline orizzontale scrollabile (cronologica per anno di nascita);
2. una sola fila orizzontale di card (stessa grandezza attuale, scrollabile);
3. filtri combinabili (categorie + intervallo temporale su anno di nascita);
4. indicatore di posizione/quantità nello stile concettuale `_ _ _ - _ _`;
5. navigazione e sincronizzazione timeline ↔ card **solo via selezione**, non via scroll continuo;
6. ingresso al dettaglio/storia del personaggio con il meccanismo già esistente;
7. ripristino della posizione utile al ritorno dal dettaglio.

Questo documento fotografa **cosa esiste oggi**, cosa riusare, cosa modificare, cosa non toccare, vincoli e criteri di accettazione.

---

## 2. Stato attuale di Angolo Cultura

### 2.1 Entry point utente (pagina Città)

| Azione | Dove | Effetto |
|--------|------|---------|
| Pulsante desktop «Angolo Cultura» | `CityHeader.tsx` (barra inferiore desktop) | `onOpenCulture()` |
| Pulsante mobile libro | `CityHeader.tsx` (cluster azioni) | `onOpenCulture()`, `aria-label="Apri Angolo Cultura"` |
| Host stato modale | `CityDetailContent.tsx` | `activeModal === 'culture'` apre il modale |

Flusso verificato:

```
CityHeader.onOpenCulture
  → CityDetailContent.setActiveModal('culture')
  → CultureCornerModal isOpen={activeModal === 'culture'}
```

`CityDetailContent` **non** passa `initialPersonId` al modale pubblico.

### 2.2 UI attuale (verificata in `CultureCornerModal.tsx`)

Due livelli nello stesso componente:

1. **Lista / griglia** (nessun personaggio selezionato):
   - header «Angolo Cultura» + sottotitolo «I Grandi Personaggi di {city.name}»;
   - `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8`;
   - ogni personaggio = `<button>` full-card `h-[400px]`, foto grayscale → colore on hover;
   - overlay: `role`, `name`, quote/bio (hover), CTA testuale **«Scopri Storia»** (non un secondo controllo separato: l’intera card è il click target).
2. **Dettaglio personaggio** (`selectedPersonId` valorizzato):
   - secondo portal a `Z_MODAL_NESTED`;
   - hero immagine + nome + badge `role` + `lifespan`;
   - bio (`fullBio` || `bio`) con parser `renderSmartContent` (titoli `TITOLO:`);
   - `careerStats`, `relatedPlaces` (mappa + aggiungi itinerario).

### 2.3 Cosa NON c’è oggi (verificato)

- Timeline orizzontale: **NON ESISTENTE** in Angolo Cultura.
- Rail orizzontale di card: **NON ESISTENTE** (è griglia responsive).
- Filtri categoria/periodo: **NON ESISTENTE** nel modale pubblico.
- Indicatore `_ _ _ - _ _` nel modale: **NON ESISTENTE**.
- Frecce di navigazione nel modale: **NON ESISTENTE**.
- Ordinamento cronologico per nascita: **NON ESISTENTE** (ordine = `orderIndex`).
- Componente dedicato `FamousPersonCard.tsx`: **NON ESISTENTE** (card inline nel modale).
- Campi strutturati `birthYear` / `deathYear`: **NON ESISTENTE** (solo stringa `lifespan`).

### 2.4 Preview Admin

`CulturePeople.tsx` apre lo stesso `CultureCornerModal` in anteprima e passa `initialPersonId={previewInitialId}` → **ESISTENTE E VERIFICATO** il deep-link al dettaglio.

---

## 3. File coinvolti

### Runtime pubblico (obbligatori per la foto attuale)

| Path | Ruolo |
|------|--------|
| `src/components/modals/CultureCornerModal.tsx` | Unico UI host pubblico Angolo Cultura (griglia + dettaglio) |
| `src/components/city/CityDetailContent.tsx` | Apertura/chiusura modale `culture` |
| `src/components/city/CityHeader.tsx` | CTA «Angolo Cultura» / icona libro |
| `src/types/models/City.ts` | Interface `FamousPerson`, `CityDetails.details.famousPeople` |
| `src/services/city/cityReadService.ts` | Assembla `famousPeople` in `CityDetails` |
| `src/services/city/entitiesService.ts` | `getCityPeople` / `getCityPeopleByCityIds` / save |
| `src/services/city/parsers/entities/parsePerson.ts` | Mapping DB → `FamousPerson` |
| `src/services/city/parsers/entities/famousPersonAudience.ts` | Filtro audience `public` vs `admin` |
| `src/domain/city/famousPersonCompleteness.ts` | Regole completezza/pubblicabilità |
| `src/hooks/useGlobalModalEscape.ts` | ESC sul modale |
| `src/components/ui/controls/CloseButton.tsx` | Chiusura |
| `src/components/common/ImageWithFallback.tsx` | Immagini |
| `src/constants/zIndex.ts` | `Z_OVERLAY`, `Z_MODAL`, `Z_MODAL_NESTED` |

### Admin / generazione dati (contesto, non UI pubblica)

| Path | Ruolo |
|------|--------|
| `src/components/admin/cityEditor/culture/CulturePeople.tsx` | CRUD personaggi + preview modale |
| `src/hooks/admin/people/usePeopleData.ts` | Stato lista / orderIndex |
| `src/hooks/admin/people/usePeopleAI.ts` | AI import/enrich |
| `src/data/ai/prompts.ts` | Prompt date `YYYY - YYYY` |
| `src/types/supabase.ts` | Schema TypeScript `city_people` |

### Pattern riusabili (fuori dal modale Cultura)

| Path | Ruolo |
|------|--------|
| `src/components/common/DraggableSlider.tsx` | Horizontal scroll + drag + `scroll(left\|right)` |
| `src/components/ui/CarouselPositionIndicator.tsx` | Track punti + thumb ambra (progress 0–1) |
| `src/components/home/HomeContent.tsx` | Pattern frecce Chevron + `ExploreButton` |
| `src/components/modals/PatronFestGalleryStrip.tsx` | Rail + frecce laterali su `DraggableSlider` |
| `src/components/city/gallery/GalleryGrid.tsx` | Frecce + `DraggableSlider` |
| `src/components/modals/ProvinceModal.tsx` | Rail card + frecce desktop |
| `src/components/common/SmartFilterDrawer.tsx` | Filtri multipli (POI; dominio diverso) |
| `src/components/common/AnchoredPopover.tsx` | Popover ancorato |
| `src/components/ui/header/HeaderPopover.tsx` | Popover header (singleton) |
| `src/community/qaCityReturnMemory.ts` | Pattern ripristino scroll lista (QA) |
| `src/components/community/QaForumTab.tsx` | Consumo `listScrollTop` |

### Documentazione di dominio (da non trattare come SoT UI corrente)

| Path | Nota |
|------|------|
| `AI_CONTEXT/17_CITY_CULTURE_SYSTEM.md` | Descrive `FamousPersonCard` / `CityCategoryTab` — **non allineato** al runtime |
| `AI_CONTEXT_MASTER/04_TERRITORIAL_ENGINE.md` | Cita `CityCultureTab.tsx` — **non trovato** come host attuale |

---

## 4. Componenti coinvolti

| Componente | Path | Stato |
|------------|------|--------|
| `CultureCornerModal` | `src/components/modals/CultureCornerModal.tsx` | Host unico UI pubblica |
| `CityDetailContent` | `src/components/city/CityDetailContent.tsx` | Orchestrazione modale |
| `CityHeader` | `src/components/city/CityHeader.tsx` | Entry CTA |
| Card personaggio | Inline in `CultureCornerModal` | Nessun file dedicato |
| Dettaglio personaggio | Stesso file, ramo `if (selectedPerson)` | Nested modal |
| `FamousPersonCard` | — | **NON ESISTENTE** |
| `CityCultureTab` / tab Cultura in city tabs | — | **NON ESISTENTE** (tabs città = vetrina/POI/galleria) |

---

## 5. Modello dati

### 5.1 Type applicativo — `FamousPerson` (`src/types/models/City.ts`)

Campi rilevanti verificati:

| Campo | Tipo | Note |
|-------|------|------|
| `id` | `string` | UUID |
| `name` | `string` | Nome completo (nessuno split nome/cognome strutturato) |
| `role` | `string` | Tipologia libera (es. «Pittore»), non enum |
| `bio` / `fullBio` | `string` | Snippet / bio estesa |
| `imageUrl` | `string` | Ritratto |
| `quote` | `string?` | |
| `lifespan` | `string?` | Unica rappresentazione temporale |
| `careerStats` | `{label,value}[]?` | |
| `relatedPlaces` | array oggetti luogo | |
| `status` | `'published' \| 'draft'?` | Audience pubblica = solo published |
| `orderIndex` | `number?` | Ordinamento editoriale |

**Assenti:** `birthYear`, `deathYear`, `firstName`, `lastName`, `categoryId`, tassonomia tipologica normalizzata.

### 5.2 Tabella DB — `city_people` (`src/types/supabase.ts`)

Colonne allineate al parser: `name`, `role`, `bio`, `full_bio`, `image_url`, `quote`, `lifespan`, `famous_works`, `awards`, `private_life`, `related_places`, `career_stats`, `status`, `order_index`, `city_id`, …

### 5.3 Completezza

`famousPersonCompleteness.ts`: obbligatori per pubblicazione = `name`, `role`, `bio`, `imageUrl`.  
`lifespan` è **opzionale** e **non** blocca la pubblicazione.

---

## 6. Flusso dati

```
getCityDetails / cityReadService
  → getCityPeople(cityId, peopleAudience)
      → supabase city_people ORDER BY order_index ASC
      → parsePerson
      → filterFamousPeopleByAudience (public → status === 'published')
  → sort locale (orderIndex)
  → CityDetails.details.famousPeople
  → CultureCornerModal riceve city.details.famousPeople
```

Audience pubblica di default nel percorso dettaglio città: solo personaggi `published`.

Around Me / merge: `getCityPeopleByCityIds` aggrega personaggi di più città (stesso modello).

---

## 7. Ordinamento attuale

| Contesto | Ordinamento | Dove |
|----------|-------------|------|
| Query DB | `order_index` ASC | `entitiesService.getCityPeople` |
| Post-load | `(a.orderIndex \|\| 0) - (b.orderIndex \|\| 0)` | `cityReadService` |
| UI modale | Ordine array ricevuto | `CultureCornerModal` — nessun sort aggiuntivo |
| Cronologico nascita | — | **NON ESISTENTE** |

**Implicazione futura (REQUISITO APPROVATO):** la timeline dovrà ordinare per anno di nascita crescente; la rail filtrata dovrà condividere lo stesso ordinamento. L’`orderIndex` resta rilevante per admin/editoriale, ma non è la chiave della nuova UX timeline.

---

## 8. Categorie / tipologie

| Aspetto | Stato |
|---------|--------|
| Campo | `role: string` libero |
| Enum / lookup tipologiche | **NON ESISTENTE** |
| Filtro UI per ruolo | **NON ESISTENTE** nel modale |
| Admin | input testo libero su `role` (`CulturePeople.tsx`) |

> **SUPERSEDED (Fase 2):** non derivare filtri da `unique(role)`. Lo standard è **globale** Master → Specifica (§46–§53). `role` libero resta fotografia runtime attuale, non contratto futuro.

---

## 9. Gestione date

| Aspetto | Evidenza |
|---------|----------|
| Storage | `lifespan?: string` |
| Prompt AI | Formato obbligatorio `"YYYY - YYYY"` (`buildSuggestPeoplePrompt` in `prompts.ts`) |
| Admin check soft | `lifespan && lifespan.length > 5` (`CulturePeople.tsx`) |
| Parser strutturato nascita/morte | **NON ESISTENTE** |
| Validazione rigorosa formato | **NON ESISTENTE** lato dominio pubblico |

**Implicazione (REQUISITO APPROVATO + vincolo tecnico):**

- Il filtro temporale futuro usa **solo anno di nascita**.
- Serve un parser di dominio (non solo UI) — specifica completa §45.
- Assunzione: dati conformi al contratto futuro; i dati di test attuali **non** sono riferimento di qualità (§44).
- Violazioni = bug pipeline, non feature UI.

---

## 10. Gestione card

| Proprietà | Valore attuale |
|-----------|----------------|
| Layout | CSS Grid 1/2/3 colonne |
| Altezza | `h-[400px]` |
| Interazione | Intera card = `button` → apre dettaglio |
| CTA | Testo «Scopri Storia» + `ChevronRight` (solo visuale hover; non control separato) |
| Foto | `ImageWithFallback`, grayscale → color on hover |
| Tipografia | `font-display`, indigo/amber accents, tema scuro `#020617` / slate |

**REQUISITO APPROVATO futuro:** mantenere grandezza card attuale in **una sola fila** orizzontale scrollabile; non ridurre per farne entrare di più.

---

## 11. Gestione apertura dettaglio

### Meccanismo attuale — **ESISTENTE E VERIFICATO**

1. Click card → `setSelectedPersonId(person.id)`.
2. Early-return del componente: smonta la griglia, monta portal dettaglio nested.
3. Chiusura dettaglio: `setSelectedPersonId(null)` (CloseButton o click overlay) → ritorna alla griglia.
4. Chiusura totale modale: `onClose` da `CityDetailContent` → `setActiveModal('none')`.
5. Prop `initialPersonId`: se presente all’open, apre direttamente il dettaglio (`useEffect` su `[isOpen, initialPersonId]`).

**Non** esiste route dedicata `/person/...`.  
**Non** esiste drawer separato.  
Tutto è stato locale al modale.

**REQUISITO APPROVATO:** riusare questo meccanismo per «Scopri la storia»; non creare una seconda navigazione parallela.

---

## 12. Gestione scroll

| Superficie | Comportamento attuale |
|------------|------------------------|
| Griglia | `overflow-y-auto` sul body del modale |
| Dettaglio | colonna destra `overflow-y-auto` |
| Horizontal scroll personaggi | **NON ESISTENTE** |
| Preservazione scroll griglia al ritorno dal dettaglio | **NON PRESERVATA**: early-return smonta la griglia → al ritorno il body lista riparte dall’inizio |
| Preservazione selezione al ritorno | Solo se si resta nel dettaglio nested; chiudendo il dettaglio `selectedPersonId` torna `null` |

Questo gap è centrale per il requisito di ripristino posizione (sez. 27).

---

## 13. Componenti di horizontal scroll riutilizzabili

| Componente | Path | Stato | Note |
|------------|------|-------|------|
| `DraggableSlider` | `src/components/common/DraggableSlider.tsx` | **ESISTENTE E VERIFICATO** | `overflow-x-auto`, drag mouse/touch, `ref.scroll('left'\|'right')`, snap; `hide-scrollbar`; espone `onScroll` |
| ProvinceModal rail | inline | Pattern simile (duplicato, non astratto) | |
| GalleryGrid / PreviewGallery | + `DraggableSlider` | **ESISTENTE E VERIFICATO** | |
| PatronFestGalleryStrip | + `DraggableSlider` | **ESISTENTE E VERIFICATO** | Pattern rail + frecce laterali più pulito |
| LiveFeedCarousel | `LiveFeedCarousel.tsx` | Scroll nativo + selezione attiva | Dominio community |
| DiaryTimeline / AiPlannerTimeline | altri domini | Timeline verticali/planner — **non** adatte come drop-in per personaggi |

**Priorità riuso:** `DraggableSlider` per entrambe le superfici (timeline e card), come due istanze **indipendenti**.

---

## 14. Componenti freccia riutilizzabili

| Pattern | Path | Stato |
|---------|------|--------|
| Frecce Home sezioni | `HomeContent.tsx` → `SectionHeaderWithAction` | Pair `ChevronLeft`/`ChevronRight` in box `bg-slate-900 border border-slate-800`, `aria-label` «Scorri a sinistra/destra» |
| Frecce Patron gallery | `PatronFestGalleryStrip.tsx` | Pulsanti laterali `min-h-11 min-w-11`, chiamano `sliderRef.scroll` |
| Frecce GalleryGrid | `GalleryGrid.tsx` | Stile compatto `p-1` border slate |
| Frecce ProvinceModal | `ProvinceModal.tsx` | Alte come le card, `hidden md:flex` |
| Componente condiviso `CarouselArrow` / `ScrollArrowButton` | — | **NON ESISTENTE** |

**PROPOSTA TECNICA:** riuso del **pattern grafico** di `PatronFestGalleryStrip` o `HomeContent` (coerente scuro + amber hover), eventualmente estraendo un piccolo controllo condiviso solo se servono ≥2 consumer nuovi senza duplicare markup. Non reinventare icone/stile.

---

## 15. Logica Home → Esplora dell’indicatore `_ _ _ - _ _`

### Ricerca effettuata

Cercati: `CarouselPositionIndicator`, thumb/dot track, progress indicator, uso su Home/`ExploreButton`/`SectionPreviewModal`/`CuratedGridSection`.

### Risultato verificato

| Claim | Verdetto |
|-------|----------|
| Indicatore stile punti + trattino/thumb ambra | **ESISTENTE E VERIFICATO** come `CarouselPositionIndicator` in `src/components/ui/CarouselPositionIndicator.tsx` |
| Usato sui pulsanti «Esplora» della Home | **NON ESISTENTE** — Home `ExploreButton` non monta l’indicatore; apre `SectionPreviewModal` / explore section senza quel widget |
| Consumer attuale | **ESISTENTE E VERIFICATO** in Valigia: `SuitcaseDashboard.tsx` + stato da `TemplatePreview.onCarouselStateChange` (`progress`, `count`) |

### Semantica attuale del componente

```ts
CarouselPositionIndicatorProps {
  count: number;      // numero di “slot”/dots
  progress: number;   // 0 → 1, scroll progress CONTINUO
}
```

- Disegna `count` punti `h-1 w-1 bg-slate-800`.
- Thumb `h-1 w-6 bg-amber-500` traslato in base a `progress` (non a un indice discreto selezionato).
- `aria-hidden` — puramente decorativo.
- Se `count <= 1` → `null`.

### Adattamento al requisito Angolo Cultura

Il requisito vuole un indicatore dove il trattino rappresenta l’**elemento attualmente selezionato/focalizzato** (indice discreto), aggiornato anche dopo i filtri.

| Criterio | Stato |
|----------|--------|
| Riuso diretto senza modifiche | **ESISTENTE MA DA GENERALIZZARE** — API è progress-based, non `activeIndex` |
| Estrarre modalità `mode: 'progress' \| 'index'` | **PROPOSTA TECNICA** preferita: estendere il primitive UI senza rompere Suitcase |
| Seconda implementazione equivalente | Vietata senza prima tentare il riuso/generalizzazione |

**Nota sulla formulazione «Home → Esplora»:** l’associazione mentale utente punta al linguaggio visivo “carosello Home”; il codice verificato colloca il widget omonimo nella Valigia. La guida tecnica di riuso resta `CarouselPositionIndicator`.

---

## 16. Componenti / utility di filtro riutilizzabili

| Elemento | Path | Dominio | Adatto ad Angolo Cultura? |
|----------|------|---------|---------------------------|
| `SmartFilterDrawer` | `src/components/common/SmartFilterDrawer.tsx` | POI (status, category, subCategory[], rating, price…) | Pattern multi-select sì; modello dati **diverso** — non riuso diretto dei campi |
| `AnchoredPopover` | `src/components/common/AnchoredPopover.tsx` | Generico | **Sì** come shell per filtro in testata timeline |
| `HeaderPopover` | `src/components/ui/header/HeaderPopover.tsx` | Header app | Meno adatto (singleton header) |
| `CategoryStatusFilterDropdown` | suitcase | Enum singolo all/incomplete/complete | Pattern dropdown, non multi-categoria+range |
| Filtro temporale nascita personaggi | — | — | **NON ESISTENTE** |

---

## 17. Pattern di filtro multiplo esistenti

**ESISTENTE E VERIFICATO:** `SmartFilterDrawer` — `subCategory: string[]`, `priceLevel?: number[]`, toggle multipli, apply batched.

**ESISTENTE E VERIFICATO:** Hero filtri città (`HeroFilterModule`) — categorie/stagione/zona (dominio Home, non culture).

**NON ESISTENTE:** filtro multi-ruolo su `FamousPerson.role` in UI pubblica.

---

## 18. Pattern di filtro temporale esistenti

| Area | Cosa esiste | Nascita personaggi |
|------|-------------|--------------------|
| Affiliate analytics | range `year`/`month` su metriche | No |
| Diary / Viaggio | date viaggio | No |
| SmartFilterDrawer | no year range | No |
| Culture | — | **NON ESISTENTE** |

Il filtro `nascita ∈ [from, to]` andrà implementato ex novo sul dataset già in memoria (`famousPeople`), senza nuova API.

---

## 19. Pattern di ripristino dello scroll

| Pattern | Path | Meccanismo |
|---------|------|------------|
| QA Forum return | `qaCityReturnMemory.ts` + `QaForumTab` + `NavigationContext` | Persiste `listScrollTop` (e flag) e lo riapplica a `scrollTop` |
| TravelDiary notes | `TravelDiary.tsx` | `notesScrollTopRef` |
| CultureCorner dettaglio → lista | — | **NON ESISTENTE** (smontaggio completo) |

**PROPOSTA TECNICA per Angolo Cultura (stesso modale, nested detail):**

1. Non smontare la rail/timeline quando si apre il dettaglio **oppure**
2. Prima di entrare nel dettaglio, salvare in ref/state: `{ selectedPersonId, cardScrollLeft, timelineScrollLeft, filters }`;
3. Al ritorno (`selectedPersonId` clear o Close detail), ripristinare scrollLeft + selezione.

Il pattern QA (persistenza cross-route) è overkill se si resta nello stesso modale; è riferimento utile se in futuro il dettaglio uscisse dal tree.

`initialPersonId` già permette di riaprire sul personaggio corretto se il parent lo passa — oggi `CityDetailContent` non lo fa.

---

## 20. Design System rilevante

| Elemento | Evidenza |
|----------|----------|
| Tema Angolo Cultura | Scuro `#020617` / `#0b0f1a`, indigo CTA, amber accenti, `font-display`, `font-serif` per bio |
| Close / z-index | `CloseButton`, `Z_OVERLAY` / `Z_MODAL` / `Z_MODAL_NESTED` |
| Tipografia sezioni Home | `useDynamicStyles('section_title')`, `btn_explore` — **non** usati oggi da CultureCorner (classi inline) |
| Foundation | Shell modali nuovi; CultureCorner è ancora **legacy custom portal** (come molti modali) |
| Primitive UI | Solo 4 file in `src/components/ui/` (incluso `CarouselPositionIndicator`) |

**REQUISITO APPROVATO / direzione:** premium, elegante, culturale, coerente col tema scuro attuale e con Angolo Cultura; evitare esteticha videogame, glow eccessivi, colori fuori palette slate/indigo/amber già in uso.

Header contestuale attuale (riusabile come linguaggio):

- Icon box indigo + titolo uppercase `font-display` «Angolo Cultura»
- Sottotitolo slate uppercase «I Grandi Personaggi di {city}»

---

## 21. Accessibilità

### Stato attuale (verificato / documentato in audit qualità)

| Tema | Stato |
|------|--------|
| Card lista | `<button type="button">` — corretto semanticamente |
| Overlay dismiss | button full-bleed `aria-hidden` + `tabIndex={-1}` |
| ESC | `useGlobalModalEscape` |
| Baseline Biome a11y | `CultureCornerModal.tsx` segnalato in `AI_QUALITY/biome/B_a11y_click_and_static_interactions.md` (hit storici Livello B — **non corretti in questa fase**) |
| Indicatore posizione | `CarouselPositionIndicator` è `aria-hidden` (decorativo) |

### Requisiti futuri (da rispettare in implementazione)

- Controlli freccia = `<button>` con `aria-label` chiari.
- Timeline markers / card = elementi interattivi reali (no `div` clickable senza ruolo).
- Focus-visible coerente (già pattern amber ring in Patron gallery).
- Filtri: nome accessibile, stato selezione annunciabile.
- «Scopri la storia»: control dedicato distinto dalla sola selezione (vedi sez. 26).
- Indicatore: se resta decorativo, `aria-hidden` + testo accessibile tipo «Personaggio 7 di 30» altrove; se diventa navigabile, aggiornare modello a11y.

**Questa fase non corregge** i debito a11y esistenti; vanno considerati nella PR futura sul file.

---

## 22. Responsive / mobile

| Aspetto attuale | Comportamento |
|-----------------|---------------|
| Griglia | 1 col mobile → 2 sm → 3 lg |
| Card height | fissa 400px anche mobile |
| Modale | fullscreen-ish mobile (`!p-0` / `h-full`), rounded desktop |
| Dettaglio | stack verticale mobile (hero 40vh + content), split desktop |

**REQUISITI FUTURI:**

- Una sola fila card anche su mobile; overflow-x / touch scroll.
- Non ridurre le card solo per “farle stare”.
- Frecce: valutare `hidden` su viewport strette (pattern ProvinceModal) affidandosi al touch, oppure frecce compatte (pattern Patron).
- Filtri in testata timeline: UI compatta (popover) per non schiacciare la fascia wow.
- Verificare ritorno dal dettaglio + restore scroll anche su touch.

---

## 23. Requisiti UX approvati

*(REQUISITO APPROVATO — non negoziabili in implementazione salvo nuovo mandato prodotto)*

1. Timeline orizzontale sopra le card, scrollabile, cronologica per **anno di nascita crescente**, elementi compatti (non seconda fila di card fotografiche).
2. Card in **una sola fila** orizzontale scrollabile, grandezza ≈ attuale.
3. Timeline e card = **due superfici di scroll indipendenti** (niente sync continuo).
4. Sync solo su **selezione** personaggio.
5. Click timeline → seleziona + porta rail card sul personaggio + highlight.
6. Click card → seleziona + porta timeline sul personaggio.
7. «Scopri la storia» → selezione + sync + apre dettaglio esistente.
8. Al ritorno dal dettaglio: posizione utile sul personaggio (non reset arbitrario).
9. Filtri combinabili in testata timeline; aggiornano timeline, card, count, indicatore, selezione.
10. Indicatore posizione stile `_ _ _ - _ _` aggiornato post-filtro.
11. Frecce: riuso pattern esistenti.
12. Testata contestuale Angolo Cultura coerente.
13. Direzione visiva premium / tema scuro / no videogame.
14. Mobile coerente coi principi sopra.
15. Quality gate TypeScript/Biome rigoroso (sez. 40).

---

## 24. Regole di sincronizzazione timeline / card

| Evento | Effetto consentito | Vietato |
|--------|--------------------|---------|
| Scroll timeline | Muove solo timeline | Muovere continuamente le card |
| Scroll card | Muove solo card | Muovere continuamente la timeline |
| Selezione (da timeline o card o CTA storia) | Evidenzia item; `scrollIntoView` / `scrollTo` **una tantum** sull’altra superficie | Listener scroll che ricalcola continuamente l’altra superficie |

Implementazione tipica: flag `isProgrammaticScroll` o sync solo in handler di selezione.

---

## 25. Regole di selezione

- Uno stato `selectedPersonId: string | null` (già presente nel modale — riuso).
- Highlight timeline + card coerenti sullo stesso id.
- Dopo filtro: se il selezionato non è più nel subset → **DA VALUTARE** (selezionare il primo filtrato vs clear). Documentare scelta in PR; default suggerito: selezionare il primo del risultato filtrato e allineare scroll.

---

## 26. Regole «Scopri la storia»

| Step | Azione |
|------|--------|
| 1 | Imposta `selectedPersonId` |
| 2 | Sync timeline sul personaggio |
| 3 | Apri dettaglio con meccanismo esistente (`selectedPersonId` → ramo dettaglio **oppure** `initialPersonId` se si ridefinisce il flusso) |
| 4 | Non introdurre route/modale paralleli |

**Gap attuale:** CTA «Scopri Storia» non è un controllo separato — l’intera card apre il dettaglio.  
**REQUISITO APPROVATO futuro:** distinzione tra **selezione** (click card/body) e **apertura storia** (CTA esplicita). La card dovrà supportare entrambi i gesture senza conflitti (stopPropagation sulla CTA).

---

## 27. Regole di ritorno dal dettaglio

**REQUISITO APPROVATO:** con N personaggi, utente sullo slot k, apre storia, torna → ritrova rail in posizione utile su k; mantiene selezione e filtri.

**Strategia esplicita (PROPOSTA TECNICA):**

```
persistBeforeDetail = {
  selectedPersonId,
  filters,
  cardScrollLeft,
  timelineScrollLeft,
}
// open detail (nested)
// on close detail:
restore filters (già in state se non smontati)
setSelectedPersonId(persist.selectedPersonId)
requestAnimationFrame → apply scrollLeft / scrollIntoView(person)
```

Evitare di smontare le due rails se possibile (css hide / overlay dettaglio), così lo scroll DOM resta naturale.

---

## 28. Regole dei filtri combinabili

```
visiblePeople =
  people
    .filter(audience già applicata a load)
    .filter(masterCategoryId ∈ selectedMasters OR selectedMasters vuoto)
    .filter(specificCategoryId ∈ selectedSpecifics OR selectedSpecifics vuoto)
    .filter(birthYear ∈ [from, to] OR range non impostato)
    .sort(by birthYear ASC)
```

Logica tra **gruppi**: AND.  
All’interno dello stesso livello (master multi / specific multi): OR.  
Un solo motore filtro: niente filtri duplicati timeline vs card.

> **Fase 2:** non filtrare su `role` libero — vedi §53.

---

## 29. Regola del filtro temporale per anno di nascita

- Intervallo inclusivo sull’**anno di nascita** estratto da `lifespan`.
- Esempio: 1800–1900 → nati dal 1800 al 1900 inclusi.
- Anno di morte **non** entra nel predicato di filtro (può restare visualizzato in timeline).

---

## 30. Regole dell’indicatore di posizione

- Rappresenta quantità/posizione sul set **filtrato**.
- Trattino / thumb = elemento **selezionato/focalizzato** (semantica indice), non mero progress di scroll — salvo decisione di usare progress *in più*; il requisito concettuale è selezione.
- Aggiornamento immediato su filtro e su cambio selezione.
- Riuso: generalizzare `CarouselPositionIndicator` (sez. 15).

---

## 31. Architettura proposta

*(PROPOSTA TECNICA — massimizza riuso, evita rewrite)*

```
CultureCornerModal (shell + header + open/close + detail nested)
  ├── CultureCornerHeader (contestuale + count)
  ├── CultureTimelineSection
  │     ├── CulturePeopleFilters (popover categorie + range nascita)
  │     ├── DraggableSlider (timeline markers)
  │     └── arrow controls (pattern esistente)
  ├── CulturePeopleRail
  │     ├── DraggableSlider (cards, fixed size)
  │     ├── card UI (estratta dall’attuale markup griglia)
  │     └── arrow controls
  ├── CarouselPositionIndicator (esteso) + testo “k di N”
  └── PersonDetailView (ramo attuale selectedPerson — preferibilmente estratto)
```

Stato consigliato in un hook dedicato es. `useCultureCornerState` (filtri, selection, scroll refs, sync handlers) **solo se** il file modale supera soglia leggibilità; altrimenti stato locale nel modale come oggi.

**Non** introdurre nuovo service API: dataset già su `city.details.famousPeople`.

---

## 32. Componenti da riutilizzare

| Elemento | Uso |
|----------|-----|
| `CultureCornerModal` shell / portal / z-index / escape | Host |
| Markup/stile card attuale | Base visuale rail |
| Ramo dettaglio personaggio | «Scopri la storia» |
| `DraggableSlider` | Timeline + card rail |
| Pattern frecce Patron/Home | Navigazione |
| `CarouselPositionIndicator` | Indicatore (dopo generalizzazione) |
| `CloseButton`, `ImageWithFallback` | Invariati |
| `AnchoredPopover` | Shell filtri |
| Header tipografico attuale Angolo Cultura | Testata contestuale |
| `parsePerson` / `getCityPeople` / audience filter | Dati invariati |

---

## 33. Componenti da modificare

| File | Motivo |
|------|--------|
| `src/components/modals/CultureCornerModal.tsx` | Sostituire griglia con timeline+rail+filtri; distinguere select vs «Scopri la storia»; restore scroll |
| `src/components/ui/CarouselPositionIndicator.tsx` | Opzionale ma raccomandato: supporto indice discreto senza rompere Suitcase |
| Eventuale estrazione sotto-file in `src/components/modals/cultureCorner/` | Solo se necessario per leggibilità |

`CityDetailContent` / `CityHeader`: modifica **solo** se serve passare `initialPersonId` o stato restore — non obbligatorio se tutto resta interno al modale.

---

## 34. Componenti eventualmente da estrarre / generalizzare

| Candidato | Motivo | Priorità |
|-----------|--------|----------|
| `CarouselPositionIndicator` → progress \| index | Semantica requisito | Alta |
| Card personaggio lista | Riuso rail + eventuale admin preview | Media |
| `PersonDetailPanel` | Separare lista/timeline da dettaglio | Media |
| `ScrollArrowPair` | Evitare 3° duplicato frecce | Bassa (solo se conviene) |
| `parseLifespanYears(lifespan)` utility dominio | Filtro + sort + timeline labels | Alta (nuova utility piccola) |

---

## 35. Nuovi componenti realmente necessari

| Nuovo | Perché non esiste |
|-------|-------------------|
| Timeline markers UI | Nessuna timeline personaggi |
| Culture filters UI (categorie + year range) | Nessun filtro culture |
| Utility parse `lifespan` → birth/death year | Nessun parser |
| (Opz.) Hook stato Culture Corner | Organizzazione |

**Non necessari:** nuovo sistema modali, nuovo data layer, nuove frecce grafiche da zero, secondo indicatore parallelo.

---

## 36. File da modificare nella futura implementazione

Elenco previsto (implementazione successiva — non questa fase):

1. `src/components/modals/CultureCornerModal.tsx` (**principale**)
2. Possibili nuovi: `src/components/modals/cultureCorner/*` (timeline, rail, filters, detail)
3. `src/components/ui/CarouselPositionIndicator.tsx` (generalizzazione)
4. Possibile: `src/domain/city/parseFamousPersonLifespan.ts` (o sotto `utils/`)
5. Aggiornamento doc: questo file + allineamento successivo di `17_CITY_CULTURE_SYSTEM.md` (attività documentale separata)
6. Test smoke/parser se introdotti

---

## 37. File che NON devono essere modificati

Salvo esplicita necessità dimostrata:

- Pipeline AI generazione personaggi (`peopleGenerator`, completeness pipeline) — fuori scope UI timeline
- Schema DB `city_people` (v1 senza migration anni strutturati)
- `SmartFilterDrawer` (non forzare il dominio POI)
- Home `ExploreButton` / `SectionPreviewModal` (non sono l’indicatore)
- Suitcase consumer di `CarouselPositionIndicator` — non rompere il progress mode
- Tab città (`CityCategoryTab`, gallery, showcase) — Angolo Cultura non vive lì
- `AI_CONTEXT_MASTER` / altri SSOT non culture — non in scope implementazione UI
- Comportamento pubblico corrente: **non alterato in questa fase audit**

---

## 38. Rischi

| Rischio | Impatto | Mitigazione |
|---------|---------|-------------|
| `lifespan` free-text / mancante | Filtro e sort cronologici fragili | Parser + policy espliciti; audit dati admin |
| `role` non normalizzato | Filtri duplicati («Pittore» vs «pittore») | Normalizzazione display + match policy |
| Smontaggio dettaglio resetta scroll | Violazione requisito ritorno | Persistenza ref / non-unmount rails |
| Sync scroll continuo accidentale | UX vietata | Sync solo onSelect |
| Card ridotte su mobile «per stare» | Violazione size | Overflow-x obbligatorio |
| Due indicatori / due arrow styles | Incoerenza DS | Riuso primitive |
| Debito a11y Biome su CultureCorner | Gate qualità | Correggere nel refactor, non sopprimere |
| DOC 17 obsoleto | Agenti futuri fuorviati | Questo audit come SoT UI; aggiornare DOC 17 dopo ship |

---

## 39. Possibili regressioni

- Preview Admin con `initialPersonId` deve continuare ad aprire il dettaglio.
- Aggiungi luogo correlato → itinerario.
- ESC / overlay close / z-index nested.
- Audience: solo `published` in pubblico.
- Around Me: lista people aggregata ancora mostrabile.
- Suitcase `CarouselPositionIndicator` progress mode.
- Altezza/aspetto card percepito dagli utenti abituati alla griglia.

---

## 40. Quality Gate

La futura implementazione **deve**:

- passare `npm run check` (SoT qualità: `WF_QUAL_01`);
- `npm run typecheck` senza errori;
- Biome conforme (`npm run lint`);
- `npm run lint:layers` se tocca layering/z-index;
- type-safe, no `any` di aggiramento, no cast fragili, no `@ts-ignore` / `@ts-expect-error` non motivati dalle regole progetto;
- no disable Biome per nascondere problemi;
- no dead code / duplicazioni evitabili;
- accessibilità: controlli nativi, label, focus-visible.

**Debito già presente (documentato, non corretto ora):** hit a11y storici su `CultureCornerModal`; hit qualità su `CarouselPositionIndicator` nelle schede Biome (`noArrayIndexKey`, ecc.). La PR timeline dovrà gestirli se tocca quei file — **senza** soppressioni.

---

## 41. Piano di implementazione suggerito

> **Aggiornato Fase 2.** L’ordine sotto vale **solo dopo** il gate §65. Non avviare se il gate è NO-GO.

### Pre-requisiti (fuori dalla sola UI pubblica — bloccanti se non approvati)

P0. **Approvazione PO** architettura SoT categorie (§48–§49) + eventuale migration (§52).  
P1. Seed minimo standard categorie (lista definitiva = decisione prodotto; non inventata qui).  
P2. Contratto date elevato a gate pipeline/admin (§44–§45).  
P3. Allineamento prompt AI allo standard (§51).

### Implementazione UI / dominio (dopo P0–P3)

1. Utility dominio `parseFamousPersonLifespan` + filter/sort helpers + smoke.  
2. Generalizzare `CarouselPositionIndicator` (progress + index) senza rompere Suitcase.  
3. Refactor interno `CultureCornerModal`: card + detail panel senza cambiare UX pubblica.  
4. Rail card su `DraggableSlider` (una fila) + frecce pattern Patron.  
5. Timeline markers + sync **solo onSelect**.  
6. Filtri Master/Specific/periodo (un motore).  
7. CTA «Scopri la storia» semantica corretta + restore lifecycle Soluzione A.  
8. Preselezione keyed by `cityId` (session).  
9. a11y + responsive + `npm run check`.  
10. Aggiornamento DOC 17 / MASTER 04 (§62) post-ship.

---

## 42. Criteri di accettazione

- [ ] Timeline sopra le card, orizzontale, scrollabile, ordinata per anno di nascita crescente.
- [ ] Elementi timeline compatti (non doppione fotografico delle card).
- [ ] Card in una sola fila, scroll orizzontale, dimensione ≈ `h-[400px]` attuale.
- [ ] Scroll timeline e scroll card indipendenti (nessun sync continuo).
- [ ] Scroll **non** seleziona; selezione solo click card / timeline / «Scopri la storia».
- [ ] Click timeline → select + card rail sul personaggio + highlight.
- [ ] Click card → select + timeline sul personaggio (**senza** aprire dettaglio).
- [ ] «Scopri la storia» → select + sync + dettaglio via meccanismo esistente (no button-in-button).
- [ ] Ritorno dal dettaglio: personaggio, rail, timeline, filtri, indicatore preservati.
- [ ] Filtri Master (OR) AND Specific (OR) AND birthYear range inclusivo; un solo motore.
- [ ] Categorie da **standard globale** (non `unique(role)` locale).
- [ ] Indicatore su set filtrato; semantica indice; CPI generalizzato.
- [ ] Frecce coerenti con pattern Patron/Home.
- [ ] Header contestuale Angolo Cultura presente.
- [ ] Desktop + tablet + mobile: una fila, touch scroll, senza ridurre arbitrariamente le card.
- [ ] a11y: controlli nativi, label, keyboard/focus/focus restore.
- [ ] `npm run check` verde; niente soppressioni/typing workaround.
- [ ] Preview admin `initialPersonId` funzionante.
- [ ] Nessuna regressione itinerario related places / escape / z-index.
- [ ] Personaggio fuori contratto date/categorie = errore pipeline (non workaround UI).

---

## 43. Questioni aperte (solo reali — post Fase 2)

| # | Tema | Stato |
|---|------|--------|
| A | **Lista definitiva** Master/Specific dello standard | **APERTA — decisione prodotto** (non inventare in audit) |
| B | **Approvazione architettura SoT** categorie (`global_settings` vs tabella dedicata) | **RICHIEDE APPROVAZIONE PO** (§48) |
| C | **Migration DB** campi personaggio (categorie strutturate; opz. anni) | **RICHIEDE APPROVAZIONE PO** (§52) |
| D | Elevare `lifespan` a requisito di **pubblicazione** (oggi optional in completeness) | **RICHIEDE APPROVAZIONE PO** (§44) |
| E | Selezione dopo filtro se id corrente esce dal subset | **CONGELATA default Fase 2:** selezionare il primo del risultato filtrato + sync scroll (§54) |
| F | Frecce su mobile | **CONGELATA default Fase 2:** nascoste sotto soglia/touch-first come Province; opz. compatte Patron se overflow (§59) |
| G | Indicatore: solo indice vs indice+progress | **CONGELATA:** solo indice discreto per Cultura; progress resta Suitcase (§57) |
| H | Aggiornamento DOC 17 / MASTER 04 | **Pianificato post-ship** (§62) — non bloccante per codice se SoT = questo audit |
| I | Normalizzazione `role` free-text | **SUPERSEDED** — sostituito da standard Master/Specific |

Le voci A–D sono i **blocker** del gate §65.

---

# FASE 2 — APPROFONDIMENTI PRE-SVILUPPO

## 44. Audit contratto futuro delle date

### 44.1 Principio (REQUISITO APPROVATO)

```
DATI VALIDATI → UI semplice
NON: DATI SPORCHI → UI piena di workaround
```

Assunzioni di prodotto (Fase 2):

| Regola | Contratto |
|--------|-----------|
| Nascita | Ogni personaggio **deve** avere un anno di nascita |
| Deceduto | Deve avere anche anno di morte |
| Vivente | Formato esplicito coerente (vedi §45) |
| UI timeline/filter | **Non** compensa dati mancanti/corrotti |
| Violazione | **Errore di dati / bug** di pipeline creazione o validazione |

I personaggi attuali in DB sono **dati di test** da cancellare: **nessuna** analisi quantitativa di qualità sul dataset odierno.

### 44.2 Fotografia runtime (ESISTENTE E VERIFICATO)

| Aspetto | Evidenza |
|---------|----------|
| Storage | `FamousPerson.lifespan?: string` + colonna `city_people.lifespan` |
| Campi strutturati | `birthYear` / `deathYear` **NON ESISTENTI** |
| Produzione AI | Prompt fallback: `REGOLA DATE: Formato "YYYY - YYYY" obbligatorio` (`buildSuggestPeoplePrompt`) |
| Enrich | `buildEnrichPersonPrompt` chiede «Date esatte» ma senza schema machine-check |
| Mapping | `parsePerson` → `ensureString(raw.lifespan)` (nessuna validazione formato) |
| Completezza pubblicazione | `lifespan` **non** è in `FAMOUS_PERSON_REQUIRED_FIELDS` (`famousPersonCompleteness.ts`) |
| Admin UI | Input testo libero; check soft `lifespan.length > 5` (solo hint visivo) |
| Save | `entitiesService.saveCityPerson` persiste `lifespan` as-is |

### 44.3 Gap vs contratto futuro

| Gap | Impatto |
|-----|---------|
| `lifespan` optional in publish gate | Si possono pubblicare personaggi senza nascita → viola contratto futuro |
| Nessun parser/validatore dominio | Nessun fail-fast su formato |
| Solo stringa | Filtro/sort timeline devono derivare anni via parsing |

### 44.4 Decisione tecnica congelata (PROPOSTA TECNICA vincolata al requisito)

1. **Formato canonico di persistenza (v1 senza colonne anno):** continuare a usare `lifespan: string` come wire format, ma **con validazione rigorosa** prima di save/publish.  
2. **Derivazione runtime:** utility dominio → `{ birthYear, deathYear }` (deathYear `null` se vivente).  
3. **Colonne DB `birth_year`/`death_year`:** opzionali in v1; utili dopo, non obbligatorie se il parser + gate sono solidi.  
4. **UI pubblica:** assume personaggi **già validi**; se parse fallisce → trattare come bug (log + esclusione dal set filtrabile / empty-state di errore admin, **non** UI “best effort”).

**RICHIEDE APPROVAZIONE PO:** elevare validità lifespan a blocco pubblicazione (`canPublishFamousPerson`).

---

## 45. Specifica parser `lifespan` (NON implementare ora)

### 45.1 Firma concettuale

```ts
type FamousPersonLifespanParsed = {
  birthYear: number;       // int, incluso
  deathYear: number | null; // null = vivente
  isLiving: boolean;
  canonical: string;        // forma normalizzata da ripersistere
};

type ParseLifespanResult =
  | { ok: true; value: FamousPersonLifespanParsed }
  | { ok: false; reason: LifespanParseErrorCode };
```

### 45.2 Formato atteso (canonico)

| Caso | Forma canonica | Significato |
|------|----------------|-------------|
| Deceduto | `YYYY - YYYY` | nascita e morte (spazi attorno a `-` obbligatori in forma canonica) |
| Vivente | `YYYY - presente` | nascita nota; ancora in vita (**contratto esplicito**) |

Alias di input ammessi in parse (normalizzati verso canonico):

- `YYYY-YYYY`, `YYYY – YYYY` (en-dash), `YYYY/YYYY` → deceduto  
- `YYYY - ` / `YYYY - oggi` / `YYYY - vivente` / `YYYY - present` → vivente (normalizzare a `YYYY - presente`)

### 45.3 Validazione

- Anni: interi `1000…2100` (range **DA VALUTARE** se PO vuole BC / secoli).  
- `deathYear >= birthYear` se non null.  
- Vietato: stringa vuota, un solo anno senza marcatore vivente, testo libero, tre date, solo morte.

### 45.4 Casi non ammessi → `ok: false`

Esempi: `""`, `"XIX secolo"`, `"nato nel 1800"`, `"1800"`, `"? - 1900"`, `"1800 - 1700"`.

### 45.5 Comportamento errore

| Layer | Responsabilità |
|-------|----------------|
| **Pipeline AI** | Deve emettere solo formato canonico; post-parse fail → retry/recovery o scarto (come incompleti oggi) |
| **Admin save/publish** | Blocca salvataggio/pubblicazione se `!ok` (**dopo approvazione PO** sul gate) |
| **UI pubblica timeline** | Non “aggiusta”: se arriva invalido = bug dati; esclusione + eventuale log DEV; nessun bucket “sconosciuto” come feature UX |
| **Filtro temporale** | Opera solo su `birthYear` di record `ok: true` |

### 45.6 Dove collocare l’utility

| Opzione | Verdetto |
|---------|----------|
| Parser solo nella UI modal | **Rifiutato** — duplicazione e UI compensativa |
| Utility dominio `src/domain/city/parseFamousPersonLifespan.ts` | **PROPOSTA TECNICA preferita** (allineata a `famousPersonCompleteness.ts`) |
| Utility generica date esistente | **NON ESISTENTE** dopo ricerca: `CustomCalendar.parseDateString` è per date ISO UI; `date-fns` usato altrove ma **nessun** parser anno lifespan; nessun zod schema lifespan |

### 45.7 Punti pipeline che possono garantire il contratto

1. `peopleGenerator.suggestCityPeople` / `enrichPersonData` — post-parse JSON.  
2. `ensureFamousPersonCompletenessWithAi` / import in `usePeopleAI`.  
3. `canPublishFamousPerson` / `saveCityPerson` gate.  
4. Prompt: aggiornare `SYSTEM_PEOPLE_HEADER` + template `PROMPT_PEOPLE_SUGGEST` (settings) con regola vivente/deceduto.

---

## 46. Audit tassonomia globale categorie

### 46.1 Decisione prodotto (REQUISITO APPROVATO)

- **Non** usare più `role: string` libero come unico riferimento tassonomico futuro.  
- Struttura: **CATEGORIA MASTER → CATEGORIA SPECIFICA**.  
- **Uno standard globale** per tutte le città (non liste per-città).  
- Lista definitiva **non** inventata in questa audit (esempi Medico/Scrittore/… solo illustrativi).

### 46.2 Pattern esistenti nel progetto (ESISTENTE E VERIFICATO)

| Pattern | Path / artefatto | Analogia |
|---------|------------------|----------|
| Struttura POI cat→sub in settings | `SETTINGS_KEYS.POI_STRUCTURE` in `global_settings` | Master→specific JSON globale |
| Config categorie POI in Manager | `SettingsPage` tab `poi_categories_config` + `GlobalSettingsPanel` | CRUD config globale |
| Mapping sinonimi → cat/sub | tabella `taxonomy_mappings` + `taxonomyService.ts` + `AdminTaxonomyManager` | Dizionario editabile |
| Inject AI da cache | `generateAllowedCategoriesPromptString()` in `taxonomyUtils.ts` usato da `poiGenerator` / `listGenerator` | **SoT unica → prompt dinamico** |
| Eventi canonici | `EVENT_CANONICAL_LIST` in settings | Lista globale |
| Packing catalog | tabelle + script build/validate | Catalogo pesante DB-driven (overkill per v1 culture) |

### 46.3 Cosa NON esiste per personaggi famosi

- Settings key culture categories: **NON ESISTENTE**  
- Tabella dedicata: **NON ESISTENTE**  
- Manager UI culture taxonomy: **NON ESISTENTE**  
- Inject AI people da standard: **NON ESISTENTE** (solo `role` libero)

---

## 47. Modello Categoria Master / Categoria Specifica

### Concetto

```
MasterCategory { id, label, orderIndex, active }
  └── SpecificCategory { id, masterId, label, orderIndex, active }
```

Relazione: ogni Specifica appartiene a **esattamente un** Master.  
Semantica filtro: appartenere a Specifica implica Master (cardinalità 1).

### Rappresentazione sul personaggio (vedi §52)

Preferenza architetturale: **ID (o slug stabile)** verso lo standard, non label libere duplicate.

---

## 48. Source of Truth dello standard categorie

### Obiettivo

**UNA** SoT: Manager + City Editor download + AI + UI filtri + validazione save.

### Opzioni valutate

| Opzione | Descrizione | Pro | Contro | Verdetto |
|---------|-------------|-----|--------|----------|
| **A** | `global_settings` key es. `famous_people_category_structure` | Allineata a `POI_STRUCTURE`; cache bootstrap; `getCachedSetting`; Settings UI riusabile | Editing JSON tree via `GlobalSettingsPanel` può essere scomodo per alberi grandi | **PROPOSTA preferita v1** |
| **B** | Nuove tabelle `famous_person_master_categories` + `famous_person_specific_categories` | CRUD tipizzato, indici, FK | Migration; più codice admin | **Alternativa se PO vuole CRUD tabellare** |
| **C** | Estendere `taxonomy_mappings` con `context: 'people'` | Riuso service | Tabella pensata per sinonimi term→cat, non albero master/specific pulito | **Non preferita** come SoT primaria |
| **D** | Hardcode in prompt/frontend | Facile | Viola “una SoT”; drift garantito | **Rifiutata** |

### PROPOSTA — RICHIEDE APPROVAZIONE PO (Opzione A)

**Key:** `famous_people_category_structure` in `global_settings`  
**Shape JSON (esempio schema, non lista definitiva):**

```json
{
  "version": 1,
  "masters": [
    {
      "id": "medico",
      "label": "Medico",
      "active": true,
      "orderIndex": 1,
      "specifics": [
        { "id": "cardiologo", "label": "Cardiologo", "active": true, "orderIndex": 1 }
      ]
    }
  ]
}
```

**Vincoli logici:** `id` slug univoci; specific.id univoco globalmente o per-master (**DA VALUTARE** — preferenza: univoco globale); `active: false` = nascosto a AI/UI ma retro-compat lettura.  
**Indici:** N/A (JSON settings).  
**Impatto:** nuova `SETTINGS_KEYS`; seed migration settings (anche seed JSON è “migration/settings change” → **approvazione**); Manager tab; AI inject; City Editor download.

Se PO sceglie **B**, documentare FK da `city_people` verso specific id.

---

## 49. Audit Manager / gestione standard

### Dove collocarlo (PROPOSTA TECNICA)

| Collocazione | Motivazione |
|--------------|-------------|
| **Impostazioni Globali** → nuova tab «Categorie Personaggi» | Stesso pattern di `poi_categories_config` (`SettingsPage.tsx`) |
| Oppure overlay stile `AdminTaxonomyManager` | Se serve CRUD riga-per-riga più ricco |

### Pattern riusabili (ESISTENTE E VERIFICATO)

- `SettingsPage` + `GlobalSettingsPanel` + `FieldRenderer` + `ConfigContext.updateSetting`  
- `AdminTaxonomyManager`: search, add/edit/delete, `DeleteConfirmationModal`, export CSV (`useAdminExport.exportTaxonomyCsv`)  
- Permessi: area Admin (stesso gate delle Impostazioni Globali) — **nessun** ACL granulare dedicato taxonomy people oggi  
- Audit log dedicato taxonomy: **NON ESISTENTE** (save settings senza history panel specifico culture)  
- Ordinamento: via `orderIndex` nel JSON (come packing/POI patterns)  
- Attivazione: flag `active`

### Proposta UI Manager

1. Lista Master (ordinabile).  
2. Drill-down Specifiche.  
3. Save esplicito.  
4. Export/download dello standard (stesso payload del City Editor).  
5. Validazione: no orphan specific; no id duplicati; label non vuote.

---

## 50. Audit City Editor / download standard

### Fotografia

- Host: `CulturePeople.tsx` sotto Storia / Personaggi famosi (`TabCulture` / `EditorCulture`).  
- Campo attuale categorie: input libero `role`.  
- Download standard culture: **NON ESISTENTE**.

### Pattern download esistenti (ESISTENTE E VERIFICATO)

| Pattern | Path |
|---------|------|
| CSV Blob + `<a download>` | `useAdminExport.ts`, `CityStatsGrid`, `AuditHistoryPanel` |
| FileSaver | `exportGenerators.ts`, `ExportModal`, `RoadbookModal` |
| Taxonomy CSV | `exportTaxonomyCsv` in `useAdminExport` |

### PROPOSTA TECNICA — pulsante «Scarica standard categorie»

- Visibile in `CulturePeople` header (ogni città → **stesso** file globale).  
- Sorgente: SoT §48 (`getCachedSetting` / `getSetting`).  
- **Formato raccomandato: JSON** (struttura ad albero, versionabile, identico a ciò che consuma AI/validatori).  
- CSV secondario opzionale (flatten master,specific) per Excel — non SoT.  
- Markdown: utile doc umana, non macchina.  
- Implementazione: `Blob` + download attribute (come `useAdminExport.downloadCsv`) o FileSaver.

---

## 51. Audit AI / utilizzo dello standard categorie

### Flusso attuale (ESISTENTE E VERIFICATO)

```
Admin CulturePeople
  → usePeopleAI.runDiscovery / wipeAndRewritePerson / importDiscoveryPerson
  → suggestCityPeople / enrichPersonData (peopleGenerator.ts)
  → buildSuggestPeoplePrompt / buildEnrichPersonPrompt (prompts.ts)
  → aiGateway.generateLegacy (JSON)
  → ensureFamousPersonCompletenessWithAi (name/role/bio/image)
  → saveCityPerson (role libero, lifespan as-is)
```

- Template people: `SETTINGS_KEYS.PROMPT_PEOPLE_SUGGEST` con fallback hardcoded.  
- **Nessun** inject di tassonomia people (diverso dai POI che usano `generateAllowedCategoriesPromptString`).

### Convenzione AI già nel progetto (da replicare)

**Opzione B+A combinata (verificata su POI):**  
recuperare standard dalla cache settings (`getCachedSetting`) **prima** della chiamata → incorporare stringa dinamica nel prompt (`generateAllowedCategoriesPromptString` pattern).

| Approccio | Verdetto |
|-----------|----------|
| A solo hardcode lista nel prompt | Drift SoT — **rifiutato** |
| B recupero DB/settings pre-call + inject | **PROPOSTA preferita** (già usata) |
| Validazione post-AI su id master/specific | **Obbligatoria** in pipeline (fail → recovery/scarto) |

### Contratto output AI futuro

JSON personaggio deve includere campi standard (slug), non solo `role` libero.  
`role` può restare **label display** derivata da specific.label per retrocompat UI legacy, oppure deprecato (§52).

---

## 52. Modello dati futuro FamousPerson

### Attuale

`role: string` libero; `lifespan?: string`.

### Futuro proposto (PROPOSTA TECNICA)

```ts
interface FamousPerson {
  // ...campi esistenti
  /** @deprecated display/legacy — preferire specificCategoryId */
  role: string;
  masterCategoryId: string;
  specificCategoryId: string;
  lifespan: string; // wire format validato
}
```

Derivati runtime (non necessariamente persistiti): `birthYear`, `deathYear` via parser.

### DB — RICHIEDE APPROVAZIONE PO

**Opzione minima (consigliata con SoT settings A):**

| Colonna | Tipo | Note |
|---------|------|------|
| `master_category_id` | `text not null` (dopo cutover) | slug SoT |
| `specific_category_id` | `text not null` | slug SoT |
| `lifespan` | `text` | resta; validato app-side |
| `role` | `text` | legacy label; sync da specific.label |

**Opzione strutturata anni (opzionale):** `birth_year int`, `death_year int null`.

**Indici:** `(city_id, specific_category_id)`, `(city_id, order_index)`.  
**FK:** solo se SoT tabellare (opzione B §48); con JSON settings → check applicativo.

### Impatto

| Area | Impatto |
|------|---------|
| TypeScript / parsePerson | Alto |
| Admin CulturePeople | Select Master→Specific al posto di input role |
| AI | Output vincolato + validazione |
| Pubblico filtri | Su id, non stringhe libere |
| Retrocompat | Dati test da cancellare → cutover semplificato; altrimenti migration mapping `role`→specific **non** affidabile |

### Vantaggi / svantaggi

- **Pro:** filtri precisi; AI guidata; uno standard.  
- **Contro:** richiede approvazione DB + seed lista; lavoro admin UI.

---

## 53. Semantica filtri Master + Specific

### REQUISITO APPROVATO

```
(Master ∈ selectedMasters  OR  selectedMasters vuoto)
AND
(Specific ∈ selectedSpecifics  OR  selectedSpecifics vuoto)
AND
(birthYear ∈ [from, to] inclusivo  OR  range non impostato)
```

- Stesso livello (multi-select): **OR**.  
- Livelli diversi: **AND**.  
- Specifica implica Master: un Cardiologo matcha filtro Master=Medico anche senza selezionare Cardiologo, **se** selectedSpecifics è vuoto; se selectedSpecifics non vuoto, deve matchare una specifica selezionata.  
- UI: specifiche disponibili = union delle specifiche dei master selezionati (se nessun master → tutte le active specifics, **oppure** richiedere master prima — **DA VALUTARE UX**; default tecnico: tutte le active se masters vuoto).

### Filtro temporale

- Solo `birthYear`.  
- Estremi inclusivi.  
- Viventi: filtrati solo sulla nascita (morte null irrilevante).  
- Invalid lifespan: non nel predicato (bug dati).

---

## 54. Audit selezione e preselezione

### REQUISITO APPROVATO — selezione

- Scroll **non** seleziona.  
- Select solo: click card, click timeline marker, click «Scopri la storia».  
- On select: sync one-shot altre superfici + update indicatore (`activeIndex`).

### Stato robusto (PROPOSTA TECNICA)

```ts
selectedPersonId: string | null  // già in CultureCornerModal
// NON derivare selected da IntersectionObserver / scroll position
```

Dopo filtro: se `selectedPersonId` ∉ filtered → **default congelato:** `selectedPersonId = filtered[0]?.id ?? null` + sync scroll.

### Preselezione all’apertura successiva (REQUISITO APPROVATO + vincolo città)

| Meccanismo | Verdetto |
|------------|----------|
| Solo state React nel modal | Perso alla chiusura completa |
| Parent `CityDetailContent` | Perso al cambio città se non keyed |
| `sessionStorage` keyed by cityId | **PROPOSTA preferita** (pattern `qaCityReturnMemory` + `storageService.setSessionItem`) |
| `localStorage` / `usePersistedState` | Troppo lungo; rischio cross-session confusion |
| Context globale senza cityId | **Vietato** (contaminazione Leopardi su città B) |

**Schema memoria:**

```ts
// key: `td.cultureCorner.lastSelected`
// value: Record<cityId, personId>  oppure chiave per-città
```

All’open: se `memory[city.id]` ∈ people → `selectedPersonId` + scrollIntoView; altrimenti nessuno / primo.  
Aggiornare memoria ad ogni select e su «Scopri la storia».

**Decisione residua:** reset memoria al logout? Non critico; sessionStorage muore con tab.

---

## 55. Audit CTA «Scopri la storia»

### Gap attuale

Intera card = `<button>` che apre dettaglio; testo «Scopri Storia» non è controllo separato.

### Struttura semantica corretta (PROPOSTA TECNICA — no button-in-button)

```html
<article> <!-- o <li> in listbox/rail -->
  <div role="group" …>  <!-- superficie card -->
    <button type="button" aria-pressed={selected} onClick={selectOnly}>
      <!-- media + nome + ruolo: SELEZIONE -->
    </button>
    <button type="button" onClick={selectAndOpenStory}>
      Scopri la storia
    </button>
  </div>
</article>
```

Alternative ammesse:

- Card come `<div>` non interattivo + due `<button>` distinti (select / story).  
- Pattern “card selezionabile” Foundation se presente — oggi **non** c’è primitive card culture.

**Vietato:** `<button>` wrapping another `<button>`; `div onClick` senza ruolo; `stopPropagation` per mascherare nesting illegale.

Keyboard: Tab tra select-target e CTA; Enter/Space su ciascuno; focus-visible amber già nel DS Patron.

---

## 56. Audit lifecycle / restore

### Lifecycle attuale (ESISTENTE E VERIFICATO)

`CultureCornerModal`:

1. `isOpen=false` → `return null` (smonta tutto).  
2. `selectedPersonId` set → **early return** portal dettaglio; **smonta** griglia.  
3. Clear selection → rimonta griglia da zero → **scroll lista perso**.  
4. Due portal (`Z_OVERLAY` lista / `Z_MODAL_NESTED` detail).  
5. `useEffect([isOpen, initialPersonId])` resetta selection all’open.

### Confronto soluzioni

| | Soluzione A — keep mounted | Soluzione B — unmount + restore |
|--|---------------------------|----------------------------------|
| Idea | Timeline/rail restano montate; detail overlay sopra (nested) | Salva scrollLeft/filtri/id; smonta; al ritorno reimposta |
| Robustezza scroll | **Alta** (DOM scroll nativo intatto) | Media (timing rAF, immagini async, layout shift) |
| Mobile | Meno flicker | Rischio race restore |
| Memoria | Due superfici vive | Più leggero |
| Complessità | CSS hide / conditional overlay | Refs + effetti + retry |

**Verdetto: Soluzione A preferita** per requisito non negoziabile di restore.  
Implementazione: non usare early-return che smonta le rails; render detail come layer nested mantenendo rails in DOM (`hidden`/`inert`/`aria-hidden` sulla lista quando detail aperto).  
Persistenza aggiuntiva di `scrollLeft` comunque utile se l’intero modal si chiude e riapre con preselezione.

Focus: al close detail, `focus()` sul CTA o sulla card del personaggio (focus restoration).

---

## 57. Impact audit `CarouselPositionIndicator`

### Consumer (ESISTENTE E VERIFICATO)

| File | Uso |
|------|-----|
| `SuitcaseDashboard.tsx` | Unico mount UI (`count`, `progress` da `TemplatePreview`) |
| `TemplatePreview.tsx` | Produce stato via `onCarouselStateChange` |
| Docs fondazione | Elencato tra primitive UI |

### API attuale

`count: number`, `progress: number` (0..1), `className?`, `aria-hidden`.

### Test dedicati

**NON ESISTENTI** (nessun test file sul componente).

### Generalizzazione (PROPOSTA TECNICA)

```ts
type CarouselPositionIndicatorProps =
  | { mode?: 'progress'; count: number; progress: number; className?: string }
  | { mode: 'index'; count: number; activeIndex: number; className?: string };
```

- Default `mode: 'progress'` → Suitcase invariato.  
- Cultura usa `mode: 'index'`.  
- Rischio regressione: basso se default preservato.  
- a11y: resta decorativo **oppure** aggiungere `aria-valuenow` in mode index + testo «k di N» sibling (preferito).  
- Biome debito `noArrayIndexKey` sui dots: correggere in stessa PR se si tocca il file (key stabile `dot-${idx}` accettabile solo con commento; meglio `Array.from` con id).

**Non** creare secondo widget clone.

---

## 58. Impact audit `DraggableSlider`

### API (ESISTENTE E VERIFICATO)

- Props: `children`, `className`, `onScroll?`  
- Handle: `scroll('left' | 'right')` (~80% viewport)  
- Drag mouse + touch; `touchAction: 'pan-y'`; snap; hide scrollbar  
- `biome-ignore` intenzionale `noStaticElementInteractions`

### Consumer verificati

`HomeContent`, `PatronFestGalleryStrip`, `GalleryGrid`, `PreviewGallery`, `ShopHero`, `ShopProducts`, `AroundMeWizard`, `UserOverviewTab`, `UserReferralTab`, `TemplatePreview`, (+ ref in `BusinessShopManager`).

### Due istanze indipendenti

**Sì — supportato:** ogni istanza ha il proprio `ref` DOM; nessuna singleton state. Home già monta `featuredRef` + `visitedRef` in parallelo.

### Rischi in Culture modal

- Nested scroll (modal vertical + due horizontal): pattern già in gallery/modals; usare `touch-action` esistente.  
- Sync continuo vietato: **non** collegare `onScroll` delle due istanze tra loro.  
- `onScroll` utile solo per UI locale (disabilitare frecce ai bordi), non per selection.

---

## 59. Impact audit frecce

| Pattern | Note | Adatto Culture? |
|---------|------|-----------------|
| **PatronFestGalleryStrip** | Laterali, `min-h-11`, chiamano `sliderRef.scroll`, soglia min items | **Preferito** (rail in modal) |
| Home `SectionHeaderWithAction` | Pair compatto in header | Buono per header timeline |
| GalleryGrid | Più piccoli | Secondario |
| ProvinceModal | Alte come card, `hidden md:flex` | Riferimento mobile hide |

**Primitive `ScrollArrowPair`:** **NON ESISTENTE**. Estrarre solo se si evita terzo duplicato; altrimenti copiare markup Patron (coerenza > astrazione prematura).

**Mobile (default congelato):** frecce nascoste su viewport strette se touch scroll sufficiente; mostrare se overflow e/o `count` alto (soglia tipo Patron `>= 6`).

---

## 60. Audit accessibilità

### Debito preesistente

`CultureCornerModal`: 5 hit baseline in `B_a11y_click_and_static_interactions.md` (Livello B — da correggere).  
**Non sopprimere** con disable nella PR timeline.

### Coinvolti obbligatoriamente dal refactor

| Superficie | Requisito |
|------------|-----------|
| Timeline markers | `<button>` / `role="option"` in toolbar; nome accessibile (nome + anni) |
| Card select vs CTA | Due controlli (§55) |
| Filtri multi-select | `aria-pressed` / checkbox group; label «Categorie master» |
| Year range | `input type="number"` o spinbutton con `min`/`max`/`aria-valuetext` |
| Frecce | `aria-label` già nel pattern Home/Patron |
| Indicatore | decorativo + testo «k di N» |
| Nested detail | focus trap/restore; ESC gerarchico già via `useGlobalModalEscape` |
| Lista inert quando detail aperto | `inert` o `aria-hidden` coerente |

---

## 61. Audit responsive / mobile

### Pattern rail mobile esistenti

`DraggableSlider` + `overflow-x-auto` + snap: Home, Patron, Gallery, Shop — **coerenti** con una sola fila card.

### Regole Culture

- Una fila anche su mobile; `h-[400px]` mantenuta (scroll orizzontale).  
- Timeline: marker più stretti, testo compatto; possibile overflow-x.  
- Filtri: `AnchoredPopover` / bottom-sheet-like se necessario (SmartFilterDrawer è heavy — riuso popover più leggero).  
- Stessa UX desktop/mobile salvo frecce (§59).  
- Restore Soluzione A critica su mobile (evitare remount).

---

## 62. Audit documentazione obsoleta

| Documento | Problema | Azione | Fase |
|-----------|----------|--------|------|
| `AI_CONTEXT/17_CITY_CULTURE_SYSTEM.md` | Cita `FamousPersonCard`, `CityCategoryTab` | Riscrivere pipeline/UI verso `CultureCornerModal` + standard categorie | **Post-ship** o subito dopo approvazione modello |
| `AI_CONTEXT_MASTER/04_TERRITORIAL_ENGINE.md` | Cita `CityCultureTab.tsx` | Allineare a runtime | Post-ship |
| Questo audit | SoT tecnico attuale | Mantenere fino a merge UI + update DOC 17 | Ongoing |

**Nuovo SoT:** runtime code + questo file fino all’aggiornamento di DOC 17; poi DOC 17 ridiventa SSOT di dominio culture.

In questa fase **non** si aggiornano DOC 17 / MASTER 04 (regola documenti pre-assetto / scope).

---

## 63. Quality Gate definitivo

Comandi **verificati** in `package.json` / WF-QUAL-01:

| Comando | Ruolo |
|---------|--------|
| `npm run check` | **Unico verdetto ufficiale** = `typecheck` + `lint` + `lint:layers` |
| `npm run typecheck` | `tsc -p tsconfig.app.json --noEmit` |
| `npm run lint` | `biome check .` |
| `npm run lint:layers` | `tsx scripts/check-layers.ts` |

Regole implementazione futura:

- Type-safe; no `any` workaround; no cast fragili; no `@ts-ignore`; no `@ts-expect-error` ingiustificati.  
- No disable Biome per nascondere problemi.  
- No dead code / duplicazioni evitabili.  
- Debito a11y/CPI: correggere se file toccati, non zittire.  
- Errore **non** risolto se soppresso.

---

## 64. Piano di implementazione aggiornato

Vedi anche §41. Sequenza gate-aware:

```
[PO] Approva SoT categorie (§48) + migration personaggio (§52) + lifespan publish gate (§44)
  → Seed standard (lista prodotto)
  → Settings key / Manager tab / download City Editor / AI inject + validate
  → Domain lifespan parser + completeness update
  → UI CultureCorner (Soluzione A restore) …
  → npm run check
  → Update DOC 17 / MASTER 04
```

**Vietato:** iniziare filtri Master/Specific in UI pubblica **prima** che esista SoT popolata e campi personaggio concordati.

---

## 65. DEVELOPMENT READINESS GATE

### Checklist

| # | Voce | Stato |
|---|------|--------|
| 1 | UX congelata (timeline/rail/filtri/CTA) | **OK** |
| 2 | Comportamento timeline definito | **OK** |
| 3 | Comportamento rail definito | **OK** |
| 4 | Scroll indipendenti definito | **OK** |
| 5 | Selezione definita (no scroll-select) | **OK** |
| 6 | Preselezione definita (per cityId) | **OK** |
| 7 | «Scopri la storia» definito (semantica HTML) | **OK** |
| 8 | Restore definito (Soluzione A) | **OK** |
| 9 | Filtro master definito | **OK** (semantica) |
| 10 | Filtro specifico definito | **OK** (semantica) |
| 11 | Filtro temporale definito | **OK** |
| 12 | Semantica combinazione filtri definita | **OK** |
| 13 | Contratto date definito | **OK** (spec) |
| 14 | Parser definito | **OK** (spec; non implementato) |
| 15 | Tassonomia definita **architetturalmente** | **PARZIALE** — proposta A/B, **manca approvazione PO** |
| 16 | Source of Truth categorie definita | **PARZIALE** — proposta; **manca approvazione + seed lista** |
| 17 | Admin/Manager definito | **OK** come proposta tecnica |
| 18 | City Editor download definito | **OK** come proposta |
| 19 | AI integration definita | **OK** (pattern POI da replicare) |
| 20 | DB impact analizzato | **OK** — **RICHIEDE APPROVAZIONE** per eseguire |
| 21 | CPI impact analizzato | **OK** |
| 22 | DraggableSlider impact analizzato | **OK** |
| 23 | Frecce definite | **OK** |
| 24 | a11y definita | **OK** |
| 25 | Mobile definito | **OK** |
| 26 | Documentazione da aggiornare identificata | **OK** |
| 27 | Quality Gate definito | **OK** |
| 28 | File da modificare identificati | **OK** |
| 29 | File da NON modificare identificati | **OK** |

### Verdetto

# **GO CONDIZIONATO** *(storico Fase 2 — vedi supersede sotto)*

### Motivazione

La UX pubblica, la semantica filtri/selezione/restore, l’impact sui primitive (`DraggableSlider`, `CarouselPositionIndicator`, frecce), il contratto date/parser e il piano qualità sono **sufficientemente definiti** per non richiedere ulteriori indagini architetturali generiche.

Restano **condizioni bloccanti** prima dello sviluppo completo (in particolare filtri categorie + AI + admin):

1. **Approvazione PO** della SoT categorie (§48 Opzione A vs B).  
2. **Lista seed** Master/Specific (decisione prodotto — fuori scope inventiva audit).  
3. **Approvazione migration** campi `master_category_id` / `specific_category_id` (e opz. anni) su `city_people`.  
4. **Approvazione** elevazione validazione `lifespan` a gate di pubblicazione.

> **SUPERSEDED dalla FASE 3:** decisioni PO su tabelle dedicate, N:M, date strutturate, eliminazione `role`. Gate vigente = **§F3.21**.

Finché 1–4 non sono chiusi: è ammesso solo lavoro **non bloccante** (es. spike locale parser/CPI in branch isolato), **non** l’implementazione della nuova UI Angolo Cultura come feature completa.

**NO-GO** sarebbe eccessivo: le audit architetturali richieste da questa fase sono chiuse; mancano decisioni di prodotto/DB esplicite, non nuova esplorazione codice.

**GO pieno** solo dopo chiusura condizioni 1–4 e presenza di SoT popolata.

---

## Appendice A — Inventario ricerche (Fase 1 + Fase 2)

| Cercato | Esito |
|--------|--------|
| `FamousPersonCard` | Non trovato |
| `CityCultureTab` | Non trovato come UI runtime |
| `birthYear` / `deathYear` fields | Non trovati |
| Parser lifespan dedicato | Non trovato |
| Utility generica parse anno culture | Non trovata (`CustomCalendar` ≠ lifespan) |
| Filtro temporale culture | Non trovato |
| `CarouselPositionIndicator` su Home Esplora | Non montato; consumer = Suitcase |
| Componente freccia condiviso unico | Non trovato |
| `DraggableSlider` multi-istanza | Verificato (Home 2 ref) |
| Restore scroll CultureCorner | Non trovato (early-return smonta) |
| SoT categorie people | Non trovata |
| Pattern SoT analoghi | `POI_STRUCTURE`, `taxonomy_mappings`, `generateAllowedCategoriesPromptString` |
| Download culture standard | Non trovato; export CSV admin sì |
| session memory keyed | `qaCityReturnMemory`, `storageService` session helpers |

---

## Appendice B — Distinzione requisiti vs proposte

| Sezioni | Natura |
|---------|--------|
| 23–30, 42, parti 44–45/53–56 | **REQUISITI APPROVATI** / contratto |
| 31–35, 45–52, 54–59, strategie | **PROPOSTE TECNICHE** |
| 2–22, 44.2, 51 flusso attuale | **FOTOGRAFIA** runtime |
| 48, 52 DB, 44 publish gate | **RICHIEDE APPROVAZIONE** |
| 43 A–D, 65 condizioni | **DA VALUTARE / BLOCCANTI PO** |

---

## Appendice C — File applicativi analizzati (Fase 2, aggiuntivi)

`taxonomyUtils.ts`, `taxonomyService.ts`, `AdminTaxonomyManager.tsx`, `settingsService.ts` (`SETTINGS_KEYS`), `SettingsPage.tsx`, `GlobalSettingsPanel.tsx`, `peopleGenerator.ts`, `usePeopleAI.ts`, `prompts.ts` (people), `famousPersonCompleteness.ts`, `parsePerson.ts`, `entitiesService.ts`, `useAdminExport.ts`, `exportGenerators.ts`, `qaCityReturnMemory.ts`, `storageService.ts`, `usePersistedState.ts`, `CarouselPositionIndicator.tsx`, `TemplatePreview.tsx`, `SuitcaseDashboard.tsx`, `DraggableSlider.tsx` (+ consumer list), `PatronFestGalleryStrip.tsx`, `CultureCornerModal.tsx`, `CulturePeople.tsx`, `package.json` / WF-QUAL-01, audit a11y Biome schede.

---

> **Nota storica Fase 2:** la chiusura «prossima attività = decisioni PO» è stata eseguita in **FASE 3**. Le proposte §48 Opzione A (`global_settings`) e colonne singole `master_category_id`/`specific_category_id` (§52) sono **SUPERSEDED** dalle decisioni PO e dal verdetto N:M in FASE 3.

---

# FASE 3 — AUDIT FINALE PRE-SVILUPPO

> **Data:** 2026-08-27  
> **Scopo:** chiudere le decisioni tecniche residue; verificare supporto architetturale al modello PO definitivo; produrre proposta lista categorie; aggiornare il gate.  
> **Vincolo:** nessuna implementazione, nessuna migration, nessun DB change, nessun fix dati test.

---

## F3.1 Decisioni PO recepite (APPROVATE — non rimettere in discussione)

| ID | Decisione |
|----|-----------|
| PO-A | **Una** SoT globale categorie Personaggi Famosi, uguale per tutte le città |
| PO-B | SoT usata da: Admin Manager, City Editor, filtri pubblici, AI, validazione |
| PO-C | Gestione standard riservata a **`admin_all` e `admin_limited`** |
| PO-D | Preferenza PO: **tabelle dedicate** (non `global_settings`/settings misti) |
| PO-E | **Non** riusare le tabelle tassonomia POI (`taxonomy_mappings`, `POI_STRUCTURE`) come DB categorie personaggi |
| PO-F | Modello Master → Specific; ogni Specific ha **un solo** Master |
| PO-G | Un **Personaggio** può avere **più** Master e **più** Specific (multi-classificazione) |
| PO-H | Contratto date arricchito: data esatta se reperibile, altrimenti almeno anno; vivente senza morte; nascita obbligatoria per publish; morte obbligatoria se deceduto |
| PO-I | Filtro temporale pubblico = **solo anno di nascita** (estremi inclusivi) |
| PO-J | Eliminare **completamente** `role` (niente legacy; dati test da bonificare) |
| PO-K | Scroll non seleziona; select solo click; CTA distinta; keep-mounted restore; CPI index mode; due `DraggableSlider` indipendenti |
| PO-M | Lista Master/Specific **§F3.3 APPROVATA INTEGRALMENTE** come seed definitivo (FASE 4) |
| PO-N | Lifecycle: disattiva = `is_active=false` + `deleted_at=now()`; restore = `is_active=true` + `deleted_at=null` (FASE 4) |
| PO-O | Nessun hard cap Specific; warning Admin non bloccante se numero elevato (FASE 4) |
| PO-P | State machine selezione/filtri/memoria **§F4.2** (supersede ogni “sempre primo a destra”) (FASE 4) |
| PO-Q | Filtro Specific: senza Master selezionati → **tutte** le Specific attive; con Master → solo Specific di quei Master (FASE 5) |
| PO-R | **Nessun hard delete** categorie via app; solo soft-deactivate / restore (FASE 5; supersede hard delete “se zero link”) |

> **Nota PO-K storico:** la riga originale “post-filtro → primo o nessuno” è **superseded** da **PO-P / §F4.2** (primo filtro vs filtri successivi + memoria + restore dettaglio).

**Correzione rispetto a Fase 2:**

| Decisione Fase 2 | Problema | Nuova direzione Fase 3 |
|------------------|----------|-------------------------|
| SoT in `global_settings` (Opzione A preferita) | PO vuole tabelle dedicate | Tabelle dedicate (§F3.5) |
| Colonne `master_category_id` + `specific_category_id` | Non supporta multi-classificazione | Junction N:M (§F3.5) |
| Conservare `role` come label legacy | PO: eliminare | Rimozione completa (§F3.7) |
| Lifespan `YYYY - YYYY` / `YYYY - presente` come unico wire | PO vuole date esatte quando disponibili | Campi strutturati + display derivato (§F3.6) |

---

## F3.2 Modello categorie definitivo (architettura)

```
famous_person_master_categories
  id (uuid PK)
  slug (text UNIQUE, stabile)
  label (text)
  order_index (int)
  is_active (bool)
  deleted_at (timestamptz NULL)
  created_at / updated_at

famous_person_specific_categories
  id (uuid PK)
  master_id (FK → master ON DELETE RESTRICT)
  slug (text UNIQUE globale, stabile)
  label (text)
  order_index (int)
  is_active (bool)
  deleted_at (timestamptz NULL)
  created_at / updated_at

city_person_category_links   -- junction N:M
  person_id (FK → city_people ON DELETE CASCADE)
  specific_category_id (FK → specific ON DELETE RESTRICT)
  PRIMARY KEY (person_id, specific_category_id)
```

**Regole:**

- Specific → Master: **N:1** (vincolo FK).  
- Person → Specific: **N:M** (junction).  
- Master sul personaggio = **derivato** dall’insieme delle Specific assegnate (non duplicare master sulla junction, evita incoerenza).  
- Publish richiede **≥ 1** Specific (Master implicito); nessuna Specific **attiva** richiesta per *visualizzare* link storici a categorie disattivate.  
- Nuove assegnazioni / filtri pubblici / AI: solo categorie con `is_active=true` e `deleted_at IS NULL`.  
- Nessun hard cap sul numero di Specific per personaggio (warning Admin non bloccante se elevato).  
- UI Admin: pick Master → lista Specific di quel Master → add chip; ripetibile per altri Master.

**PROPOSTA — RICHIEDE MIGRATION (approvata concettualmente dal PO; esecuzione in fase implementazione):** creare le tre tabelle + drop colonna `role` + colonne date (§F3.6) + truncate/bonifica test data.

---

## F3.3 LISTA Master / Specific — **APPROVATA INTEGRALMENTE DAL PO** (seed definitivo)

> **REQUISITO APPROVATO (PO-M / FASE 4).**  
> Questa tabella è la **LISTA DEFINITIVA** dello standard categorie Personaggi Famosi.  
> Deve essere usata per il **seed**. Non è più una proposta. Non va revisionata, ridotta o estesa in sede di implementazione senza nuova deliberazione PO.  
> Ammessa solo normalizzazione tecnica degli **slug** (snake_case), senza cambiare label/significato di prodotto.

### Master → Specific

| Master (`slug`) | Specifiche (`label` → slug tecnici in seed) |
|-----------------|-----------------------------------------------|
| **Arte** (`arte`) | Pittore, Scultore, Architetto, Incisore, Illustratore, Fotografo |
| **Letteratura** (`letteratura`) | Poeta, Romanziere, Drammaturgo, Saggista, Giornalista |
| **Musica** (`musica`) | Compositore, Cantante, Musicista strumentista, Direttore d'orchestra, Cantautore |
| **Teatro e cinema** (`teatro_cinema`) | Attore, Regista, Sceneggiatore, Comico |
| **Filosofia** (`filosofia`) | Filosofo, Epistemologo, Etica *(label: «Filosofo morale / etica»)* |
| **Scienze** (`scienze`) | Matematico, Fisico, Chimico, Biologo, Astronomo, Naturalista, Informatico |
| **Medicina** (`medicina`) | Medico, Chirurgo, Anatomista, Cardiologo, Neurologo, Pediatra, Farmacologo |
| **Diritto** (`diritto`) | Giurista, Avvocato, Magistrato |
| **Politica e Stato** (`politica`) | Politico, Statista, Diplomatico, Rivoluzionario |
| **Storia e antichità** (`storia`) | Storico, Archeologo, Umanista, Epigrafista |
| **Religione** (`religione`) | Teologo, Religioso, Predicatore, Vescovo |
| **Militare** (`militare`) | Condottiero, Generale, Ammiraglio, Stratega |
| **Invenzione e tecnica** (`tecnica`) | Inventore, Ingegnere, Esploratore tecnico |
| **Esplorazione** (`esplorazione`) | Esploratore, Navigatore, Cartografo |
| **Economia e impresa** (`economia`) | Economista, Imprenditore, Banchiere |
| **Educazione** (`educazione`) | Pedagogista, Educatore, Accademico |
| **Sport** (`sport`) | Calciatore, Tennista, Atleta, Pugile, Pilota, Allenatore |
| **Gastronomia** (`gastronomia`) | Chef, Gastronomo, Enologo |
| **Design e moda** (`design_moda`) | Designer, Stilista, Artigiano d'arte |

### Note storiche (non operative)

Le note AI sotto sono **archiviate**: il PO ha approvato la lista **integrale** senza modifiche. Non usarle per alterare il seed.

| Tema | Nota (storica) |
|------|----------------|
| Contesto | Lista pensata per personaggi illustri urbani (Italia / Campania e analoghi) |
| Santo/Beato | Non in lista — Patrono = sistema città separato |
| Multi-Master | Previsto dal modello N:M (es. Leonardo Arte+Scienze+Tecnica) |

**Azione seed:** usare questa tabella così com’è.

---

## F3.4 Audit riuso tassonomia POI

### Verdetto esecutivo

> **Non conviene riutilizzare direttamente il codice/tabelle POI come SoT personaggi.**  
> **Conviene replicare/generalizzare solo i pattern** elencati sotto come «utile solo come pattern» o «generalizzabile con modifica minima» (prompt-inject, CRUD Admin, export Blob, validazione post-AI).  
> **Non riusare:** `taxonomy_mappings`, `POI_STRUCTURE`, `getCorrectCategory`, euristiche nome→categoria POI.

### Scheda candidati

| Elemento | File | Cosa fa oggi | Classificazione | Perché / modifica | Rischio regressione | Verdetto |
|----------|------|--------------|-----------------|-------------------|---------------------|----------|
| Tabella `taxonomy_mappings` | DB + `taxonomyService.ts` | Sinonimi term→cat/sub POI/event | **4 — da non riusare** | Dominio POI; shape diversa; PO vieta riuso tabelle | Alto se si mescolano context | **NON RIUSARE** |
| `POI_STRUCTURE` / settings | `settingsService` | Albero cat→sub POI in JSON | **4** | PO vuole tabelle dedicate people | Contaminazione settings | **NON RIUSARE** |
| `getCorrectCategory` | `taxonomyUtils.ts` | Euristiche + map POI | **4** | Accoppiato a `PoiCategory` / food/nature | Alto | **NON RIUSARE** |
| `normalizeSubCategory` | `taxonomyUtils.ts` | Slugify sub | **3 — pattern** | Utile idea slug; riscrivere per people | Basso se copia | Solo pattern |
| `generateAllowedCategoriesPromptString` | `taxonomyUtils.ts` | Serializza struttura per prompt | **2 — generalizzabile** | Stesso meccanismo su tabelle people | Basso se nuova fn `generateFamousPeopleCategoriesPromptString` | **NUOVA fn gemella**, non refactor forzato della POI |
| `getTaxonomyDictionary` | `taxonomyService.ts` | Dict per AI | **3 — pattern** | Dict specific slug→master | — | Pattern |
| `AdminTaxonomyManager` | componente | CRUD rules + export CSV | **3 — pattern UI** | CRUD master/specific diverso (albero, non synonym rules) | Alto se si estende il file | **Nuovo Manager**; ispirazione UI |
| `useAdminExport.exportTaxonomyCsv` | hook | CSV download | **2 / 3** | Export JSON/CSV dello standard people | Basso | Riuso helper `downloadCsv` / Blob |
| Inject in `poiGenerator` | generators | Prompt + post `getCorrectCategory` | **3 — pattern pipeline** | People: inject + **validate IDs** post-AI (obbligatorio) | — | Replicare pattern |
| Cache `getCachedSetting` | settings | Bootstrap settings | **3** | Per people: cache service dedicato tabelle **oppure** load on demand | — | Non forzare settings |
| Junction `viaggio_ricordi_media_day_links` | migrations | N:M tipizzato | **3 — pattern DB** | Modello junction pulito già in repo | — | Ispirazione schema |

### Conclusione riuso

**Possiamo riutilizzare (direttamente o con copia minima):** pattern prompt-inject, pattern validazione post-AI, helper download Blob/CSV, pattern Admin CRUD (layout), pattern junction DB esistente nel dominio Viaggio.  

**Non conviene riusare direttamente:** codice/tabelle tassonomia POI, `AdminTaxonomyManager` as-is, `getCorrectCategory`.

**Non creare astrazioni condivise POI↔People** solo per ridurre file: i domini divergono (sinonimi vs albero master/specific + N:M person).

---

## F3.5 Modello dati consigliato per categorie multiple

### Confronto soluzioni

| Soluzione | Pro | Contro | Integrità | Filtro | Admin | AI | Scalabilità | Incoerenza |
|-----------|-----|--------|-----------|--------|-------|-----|-------------|------------|
| **A. Colonne singole** `master_id`+`specific_id` | Semplice | **Non** multi-classificazione | Debole vs PO-G | Limitato | Semplice | Semplice | Bassa | Alta se si forzano più ruoli in una stringa |
| **B. JSON array su `city_people`** | No junction | No FK; validazione solo app; query filtri più brutte | Media | Possibile ma fragile | OK | OK | Media | Media (slug orfani) |
| **C. Junction N:M** `city_person_category_links` | Normalizzato; FK; multi OK | Più tabelle/query | **Alta** | Join / `.in()` / contains | Chip multi | Array slug in JSON AI → validate → write links | Alta | Bassa con RESTRICT |
| **D. Due array colonne** masters[]+specifics[] | — | Master ridondante vs specific; drift | Bassa | — | — | — | — | Alta |

### VERDETTO TECNICO

**Soluzione C — tabella ponte N:M** è l’unica coerente con PO-G + tabelle dedicate + integrità.

Query filtro (concettuale):

```
person matches IF
  (no master filter OR EXISTS link→specific.master_id IN selectedMasters)
AND
  (no specific filter OR EXISTS link.specific_id IN selectedSpecifics)
AND
  birth_year BETWEEN from AND to (inclusive)
```

### Policy lifecycle categorie (**REQUISITO APPROVATO — PO-N / FASE 4**)

| Evento | Policy |
|--------|--------|
| **Disattiva** | `is_active=false` **e** `deleted_at=now()` — non disponibile per nuovi assign; non nei filtri pubblici; non usata dall’AI; link storici restano; label storica ancora mostrabile sul personaggio |
| **Ripristina** | `is_active=true` **e** `deleted_at=null` |
| **Modifica label** | OK (slug immutabile dopo seed) |
| **Modifica slug** | **Vietato** dopo seed (o migration controllata) |
| **Hard delete** | **VIETATO in app (PO-R).** Solo soft-deactivate. FK `ON DELETE RESTRICT` resta come rete di sicurezza DB. Admin non espone DELETE. |

---

## F3.6 Modello date definitivo

### REQUISITO APPROVATO (PO-H / PO-I)

| Regola | Contratto |
|--------|-----------|
| Nascita | Obbligatoria per publish: **data esatta** se reperibile, altrimenti **almeno anno** |
| Deceduto | Morte obbligatoria: data esatta se reperibile, altrimenti almeno anno |
| Vivente | Nessuna morte; flag/stato vivente esplicito |
| Filtro pubblico | Solo `birth_year` inclusivo |
| Invalidi | NON pubblicabili |

### Confronto A/B/C

| | A. Solo `lifespan` display | B. Solo campi strutturati | C. Strutturati + display derivato |
|--|---------------------------|---------------------------|----------------------------------|
| Qualità | Bassa | Alta | Alta |
| Filtro | Parse fragile | Diretto su `birth_year` | Diretto |
| AI | Stringa ambigua | Schema chiaro | Schema chiaro + format UI |
| Admin | Un campo | Form date/year + toggle vivente | Idem + preview stringa |
| Scalabilità | Scarsa | Buona | Buona |

### VERDETTO: **C**

**Campi consigliati su `city_people` (PROPOSTA — RICHIEDE MIGRATION):**

| Campo | Tipo | Note |
|-------|------|------|
| `birth_year` | `int NOT NULL` (a publish) | Sempre valorizzato; SoT filtro |
| `birth_date` | `date NULL` | Se nota; deve essere coerente con `birth_year` |
| `is_living` | `bool NOT NULL` | true = vivente |
| `death_year` | `int NULL` | Obbligatorio se `is_living=false` |
| `death_date` | `date NULL` | Opzionale; coerente con `death_year` |
| `lifespan_display` | `text NULL` | **Derivato** in save/UI (es. `15 mar 1452 – 2 mag 1519` / `1970 – presente`); non SoT |

**Check:** `NOT is_living ⇒ death_year IS NOT NULL`; `death_year/date ≥ birth`; se `birth_date` set ⇒ `extract(year)=birth_year`.

**Parser:** da AI/admin input → normalizza in strutturati; utility dominio (non UI).  
**Validazione:** `famousPersonCompleteness` + `assertFamousPersonPublishable` + save gate (come oggi per publish).  
**UI pubblica:** mostra `lifespan_display`; **non** richiede date esatte per filtrare.

**Admin:** edit manuale + azione esplicita «Recupera date con AI» (non auto-silente).

---

## F3.7 Eliminazione `role`

### REQUISITO APPROVATO (PO-J)

Rimuovere `role` da type, DB, AI, UI. Nessuna retrocompatibilità sui dati test.

### Consumer FamousPerson.role (ESISTENTE E VERIFICATO — da eliminare/sostituire)

| Area | File | Azione |
|------|------|--------|
| Type | `City.ts` `FamousPerson.role` | Eliminare |
| DB | `city_people.role` | Drop in migration |
| Parser | `parsePerson.ts` | Eliminare mapping |
| Completeness | `famousPersonCompleteness` required `role` | Sostituire con «≥1 specific link» |
| Prompts | `buildCompletePersonFieldsPrompt` role | Rimuovere; categorie via standard |
| Pipeline | `peopleCompletenessPipeline.ts` | Rimuovere role; portrait usa label specific primaria |
| AI hooks | `usePeopleAI`, `useAiMagicCity`, `useAiCompleteCity` | Sostituire |
| Save | `entitiesService.saveCityPerson` | Non scrivere role |
| Admin UI | `CulturePeople.tsx` input Ruolo | Master/Specific multi-select |
| Pubblico | `CultureCornerModal` badge `role` | Mostrare Specific (o lista chips); es. primary = prima per order |
| Vision | `generateHistoricalPortrait(..., role, ...)` | Parametro → `categoryLabel` da specific primaria |

Display pubblico: **non** reintrodurre un campo `role`; derivare testo da categorie assegnate.

---

## F3.8 Impatto AI

### Flusso target

```
Load standard (masters+specifics active) from dedicated tables
  → generateFamousPeopleCategoriesPromptString()
  → prompt discovery/enrich/date-recovery include ONLY allowed slugs
  → AI JSON: { specificCategorySlugs: string[], birth..., death..., isLiving }
  → validateSlugs ⊆ active standard (fail → retry/scarto + errore Admin)
  → validate dates contract
  → save person + replace junction links
```

### Obblighi

- Inject standard **dinamico** (pattern POI, nuova fn).  
- **Validazione post-AI obbligatoria** (prompt da solo non basta).  
- Multi-specific ammesse se tutte valide.  
- Non inventare slug.  
- Azione Admin dedicata recupero date.  
- Portrait: label da categorie, non `role`.

---

## F3.9 Impatto Admin

### Flussi

1. **Manager categorie globali** (CRUD Master/Specific, order, active) — accessibile a `admin_all` **e** `admin_limited`.  
2. City Editor → Storia → Personaggi: multi Master/Specific, date, AI date, publish gate.  
3. Download JSON standard (stessa SoT).

### Criticità permessi (NUOVA — ESISTENTE E VERIFICATO)

`AdminSidebar`: voce **Impostazioni Globali** è **solo `admin_all`** (`isSuperAdmin`).  

Quindi **non** collocare il Manager categorie personaggi esclusivamente sotto Settings, altrimenti `admin_limited` resta fuori → viola PO-C.

**PROPOSTA TECNICA congelabile:** nuova sezione Admin (es. sotto Territorio / Cultura) **visibile a entrambi i ruoli**, sullo stile di accesso a Taxonomy via POI Manager / Editor (non gated `admin_all`-only).

Gate Admin ingresso già: `AdminModals` consente `admin_all || admin_limited` — sufficiente a livello shell; manca solo placement UI Manager.

---

## F3.10 Impatto DB

**RICHIEDE MIGRATION (fase implementazione, non ora):**

1. Create `famous_person_master_categories`, `famous_person_specific_categories`, `city_person_category_links`.  
2. Add date columns; backfill N/A (test data → truncate/delete).  
3. Drop `city_people.role`.  
4. RLS: admin read/write standard; public read active categories; links via city_people policies.  
5. Seed lista **dopo** revisione PO (§F3.3).  
6. Indici: `specific(master_id)`, `links(specific_category_id)`, `links(person_id)`, `city_people(birth_year)`.

**Bonifica dati:** documentata, **non eseguita** — DELETE/TRUNCATE personaggi test in fase cutover.

---

## F3.11 Impatto filtri (semantica formale)

```
(selectedMasters = ∅ OR person has some specific with master ∈ selectedMasters)
AND
(selectedSpecifics = ∅ OR person has some specific ∈ selectedSpecifics)
AND
(no range OR birth_year ∈ [from, to] inclusive)
```

- OR intra-livello; AND inter-livello.  
- Specific implica Master via FK.  
- **PO-Q:** UI Specific — se `selectedMasters=∅` mostra **tutte** le Specific attive; se Master selezionati, limita le opzioni a quelle dei Master.  
- Morte non entra nel predicato.  
- Un solo motore per timeline+rail.

---

## F3.12 Impatto UI pubblica

| Tema | Decisione |
|------|----------|
| Badge tipologia | Chips/label da Specific (no `role`) |
| Timeline compact | Nome + specific primaria + anni da strutturati/display |
| Filtri | Master multi + Specific multi + year range |
| Selezione / CTA / restore | Confermato PO-K/L; Soluzione A keep-mounted |
| Apertura | Memoria `cityId→personId`; else primo |
| Post-filtro | Primo del result o nessuna selezione |

---

## F3.13 Impatto accessibility

Invariato rispetto Fase 2 + multi-select categorie (gruppi checkbox/`aria-pressed`) + form date Admin. Debito a11y `CultureCornerModal` da correggere nella PR, non sopprimere. Focus restore su CTA/card al ritorno dettaglio.

---

## F3.14 Impatto mobile

Nessuna criticità **nuova** dal multi-categoria oltre densità filtri (popover/chips wrap). Rail unica + touch `DraggableSlider` confermati. Frecce touch-first.

---

## F3.15 Impatto `CarouselPositionIndicator`

Confermato: Cultura = **index mode**; Suitcase = **progress** invariato; un solo componente esteso; no clone.

---

## F3.16 Impatto `DraggableSlider`

Confermato: due istanze indipendenti; no sync continuo; sync onSelect. Multi-categoria non altera lo slider.

---

## F3.17 Rischi

| Rischio | Mitigazione |
|---------|-------------|
| AI inventa slug | Validate hard fail |
| Hard delete categorie con link | RESTRICT + soft-delete |
| Manager solo in Settings | Placement per entrambi i ruoli |
| Display senza `role` vuoto | Richiedere ≥1 specific |
| Date esatte vs solo anno in UI | UI pubblica year-centric; Admin mostra precisione |
| Lista seed | **CHIUSA** — §F3.3 approvata integralmente (PO-M) |
| DOC 17 ancora cita `role` | Update post-ship |

---

## F3.18 Nuove criticità scoperte

1. **`admin_limited` escluso da Impostazioni Globali** → placement Manager obbligatorio fuori Settings-only.  
2. **`generateHistoricalPortrait` dipende da `role: string`** → firma da aggiornare.  
3. **Completezza oggi richiede `role`** → gate publish da riscrivere su categorie+date.  
4. Colonne singole Fase 2 **tecnicamente incompatibili** con multi-classificazione PO.

---

## F3.19 Decisioni che richiedono ancora PO

> **SUPERSEDED (FASE 4).** Le voci 1–4 sotto erano aperte a fine Fase 3; sono **tutte chiuse** da PO-M / PO-N / PO-O / PO-P.  
> Vedi **§F4.1**. Nessuna ulteriore decisione PO su categorie / lifecycle / cap Specific / state machine.

| # | Decisione (storica Fase 3) | Stato FASE 4 |
|---|----------------------------|--------------|
| 1 | Revisione/approvazione lista §F3.3 | **CHIUSA** — approvata integralmente |
| 2 | Soft-delete + `deleted_at` | **CHIUSA** — PO-N |
| 3 | Specificità Medicina/Sport | **CHIUSA** — lista F3.3 invariata |
| 4 | Max numero Specific | **CHIUSA** — nessun hard cap; warning non bloccante (PO-O) |

---

## F3.20 Blocker definitivi

| ID | Blocker (storico Fase 3) | Stato FASE 4 |
|----|--------------------------|--------------|
| B1 | Approvazione seed §F3.3 | **RISOLTO** (PO-M) |
| B2 | Migration tabelle+date+drop `role` | Lavoro implementazione (non indagine) |
| B3 | Placement Manager per `admin_limited` | Lavoro implementazione (vincolo congelato) |

**Nessun blocker di contenuto pre-dev residuo.**

---

## F3.21 DEVELOPMENT READINESS GATE (Fase 3) — **STORICO**

> **SUPERSEDED da §F4.5.** Il verdetto “GO CONDIZIONATO” di Fase 3 non è più vigente.

### Checklist (storica)

| Voce | Stato a fine Fase 3 |
|------|---------------------|
| Seed lista categorie | era PENDING PO → **ora APPROVATA** (§F3.3 / PO-M) |

### Verdetto storico Fase 3

# ~~GO CONDIZIONATO~~ → vedi **§F4.5**

---

## Appendice D — File analizzati Fase 3 (aggiuntivi)

`AdminSidebar.tsx` (gate Settings), `aiVision.ts` (`generateHistoricalPortrait`), `peopleCompletenessPipeline.ts`, consumer `FamousPerson.role` elencati in §F3.7, `viaggio_ricordi_media_day_links` (pattern junction), `AI_CONTEXT/17_CITY_CULTURE_SYSTEM.md`, `AI_CONTEXT_MASTER/04_TERRITORIAL_ENGINE.md`.

---

## Appendice E — DOC obsolete (post-implementazione)

| Documento | Da aggiornare |
|-----------|---------------|
| `AI_CONTEXT/17_CITY_CULTURE_SYSTEM.md` | UI host `CultureCornerModal`; rimuovere `FamousPersonCard`/`CityCategoryTab`; rimuovere `role`; documentare tabelle categorie + date + N:M; pipeline AI |
| `AI_CONTEXT_MASTER/04_TERRITORIAL_ENGINE.md` | Sostituire `CityCultureTab.tsx` con runtime reale |
| `AI_CONTEXT_MASTER/03_DATABASE_SCHEMA.md` | Colonne date, junction, drop `role` |

**Aggiornamento documenti applicativi:** post-ship. Banner “PENDING PO” di questo SoT: aggiornati in FASE 4.

---

# FASE 4 — RECEPIMENTO DECISIONI PO DEFINITIVE (NON RIAPRIBILI)

> **Data:** 2026-08-27  
> **Scopo:** congelare nel SoT audit le deliberazioni PO su (1) lista seed §F3.3, (2) lifecycle categorie, (3) nessun hard cap Specific, (4) state machine selezione/filtri/memoria.  
> **Vincolo:** non riproporre, rivalutare o chiedere conferma su questi punti.  
> **Implementazione:** ammessa dopo questo recepimento; seguire §F4.5.

---

## F4.1 Decisioni PO aggiuntive — CHIUSE

| ID | Decisione | Stato |
|----|-----------|--------|
| PO-M | Lista Master→Specific **§F3.3 approvata integralmente** = seed definitivo | **CHIUSA** |
| PO-N | Disattiva: `is_active=false` + `deleted_at=now()`; restore: `is_active=true` + `deleted_at=null`; disattivate fuori da assign/filtri/AI; visibili su personaggi storici | **CHIUSA** |
| PO-O | Nessun limite tecnico Specific; N:M; warning Admin **non bloccante** se eccessivo | **CHIUSA** |
| PO-P | State machine §F4.2 (A–H) | **CHIUSA** |

**NESSUNA ULTERIORE DECISIONE DI PRODOTTO** su queste quattro aree.

---

## F4.2 State machine selezione / filtri / memoria (**REQUISITO APPROVATO**)

Principio (H): il “primo a destra” (personaggio più recente / RIGHTMOST nell’ordinamento cronologico nascita crescente = più recente a destra) si usa **solo** per inizializzare una nuova situazione. Dopo una selezione utente valida, quella selezione va **preservata**.

| | Evento | Comportamento |
|---|--------|----------------|
| **A** | **Prima apertura** (nessuna memoria valida per `cityId`) | Se set pieno non vuoto → selezionare **RIGHTMOST**; se vuoto → nessuna selezione |
| **B** | **Primo filtro** applicato | Se nuovo set non vuoto → **RIGHTMOST** del nuovo set; se vuoto → none. **Non** usare la memoria precedente per scegliere |
| **C** | **Selezione esplicita** (click) | Diventa selezione corrente; mantenuta finché valida; non sostituita arbitrariamente da RIGHTMOST |
| **D** | **Filtri successivi** (dopo il primo) | Se selected ∈ nuovo set → **mantenere**; se esce → RIGHTMOST del nuovo set; se vuoto → none |
| **E** | **Apertura dettaglio / storia** | Selezione e filtri invariati; timeline/rail non perdono posizione utile; superfici **keep-mounted** sotto il dettaglio |
| **F** | **Ritorno dal dettaglio** | Stesso personaggio, stessi filtri, stesse posizioni utili; **nessun** reset a RIGHTMOST / primo risultato |
| **G** | **Chiusura e riapertura** modale | Se snapshot valido per `cityId` → ripristinare almeno `selectedPersonId` + filtri + posizioni utili dello snapshot; altrimenti regola **A** |
| **H** | **Principio** | Non “ogni cambio → RIGHTMOST”; RIGHTMOST solo per inizializzare (A o B / ingresso in set quando serve) |

Snapshot memoria keyed by `cityId` (minimo): `{ selectedPersonId, filters, scrollTimeline, scrollRail }`.

**Vietato:** memoria che sovrascrive la selezione durante il primo filtro (B); ricalcolo RIGHTMOST su ritorno dettaglio (F).

---

## F4.3 Numero Specific e warning

- Relazione N:M senza hard cap.  
- Warning UX Admin se numero elevato (soglia tecnica implementativa suggerita: **≥ 6**): **non** blocca save, assign, publish.

---

## F4.4 Correzioni di coerenza interna del documento

| Punto precedente | Correzione FASE 4 |
|------------------|-------------------|
| §F3.3 “PROPOSTA / DA REVISIONARE” | **APPROVATA INTEGRALMENTE** |
| §F3.19 decisioni aperte 1–4 | **CHIUSE** |
| §F3.20 B1 | **RISOLTO** |
| §F3.21 GO CONDIZIONATO | **SUPERSEDED** da §F4.5 |
| PO-K “post-filtro → primo” semplificato | **SUPERSEDED** da §F4.2 |

---

## F4.5 DEVELOPMENT READINESS GATE (vigente)

### Checklist

| Voce | Stato |
|------|--------|
| UX timeline/rail/scroll/select/CTA/restore | **OK** |
| State machine selezione/filtri/memoria §F4.2 | **OK — CHIUSA** |
| Filtri Master/Specific OR/AND + birth year | **OK** |
| Multi-classificazione N:M | **OK** |
| Tabelle dedicate + `deleted_at` | **OK** |
| Seed lista §F3.3 | **OK — APPROVATA** |
| Lifecycle categorie PO-N | **OK — CHIUSO** |
| Nessun hard cap Specific + warning | **OK — CHIUSO** |
| No riuso tabelle POI | **OK** |
| Eliminazione `role` mappata | **OK** |
| Date strutturate | **OK** |
| AI inject + validate | **OK** |
| Admin entrambi i ruoli (placement) | **OK** |
| CPI / DraggableSlider | **OK** |
| Quality `npm run check` | **OK** |
| Fix tecnici implementativi (cityId runtime, keepPeople≠null, split select/detail, cutover role, …) | **Obbligatori in PR** — non blocker di prodotto |

### Verdetto vigente

# **GO CON FIX OBBLIGATORI** — **SUPERSEDED da §F5.3** dopo implementazione

Architettura e decisioni PO **chiuse**. Nessun blocker di contenuto.  
Storico: prossima attività era implementazione (migration+seed §F3.3 → domain → AI → Admin → UI).

**Non** riaprire: lista categorie, lifecycle, cap Specific, state machine.

---

# FASE 5 — IMPLEMENTAZIONE + PRE-FLIGHT FINALE

> **Data:** 2026-08-27  
> **Scopo:** recepire PO-Q / PO-R; implementare Angolo Cultura Timeline end-to-end; aggiornare gate.

---

## F5.1 Decisioni PO aggiuntive — CHIUSE

| ID | Decisione | Stato |
|----|-----------|--------|
| PO-Q | Specific filter: no Master → tutte Specific attive; con Master → solo quelle dei Master selezionati | **CHIUSA** |
| PO-R | Nessun hard delete categorie in UI/service; solo `is_active=false` + `deleted_at=now()` / restore | **CHIUSA** |

---

## F5.2 Audit pre-flight (eseguito) + esito implementazione

| Area | Verifica | Esito |
|------|----------|--------|
| A. city_people consumers | parser, entities, API, AI, admin, UI | Aggiornati; `role` rimosso |
| B. role FamousPerson | type/DB/AI/UI/portrait/completeness | Eliminato (migration drop + codice) |
| C. Categorie N:M | tabelle + junction + Admin Manager | Implementato |
| D. Date | campi strutturati + gate publish | Implementato |
| E. AI | taxonomy inject + validate slug | Implementato |
| F. RLS | policy nuove tabelle + is_td_admin | In migration |
| G. Admin | Manager `people_categories` entrambi i ruoli | Implementato |
| H. CultureCorner | timeline/rail/filtri/§F4.2/keep-mounted | Implementato |
| I. CPI / DraggableSlider | index mode + scroll APIs | Implementato |
| J. State machine §F4.2 | first vs subsequent filter | Implementato in selection domain + modal |

**Problemi risolti in implementazione:** cityId in parser; keepPeople non nulla più city_id; split select/detail; drop role; soft-delete only; warning ≥6.

---

## F5.3 DEVELOPMENT READINESS GATE (post-implementazione)

| Voce | Stato |
|------|--------|
| Migration + seed §F3.3 | **IMPLEMENTATO** (`20260827120000_famous_person_categories_and_dates.sql`) |
| Domain / filter / selection / dates / completeness | **IMPLEMENTATO** |
| AI senza role + validate slug | **IMPLEMENTATO** |
| Admin Manager + CulturePeople | **IMPLEMENTATO** |
| CultureCorner timeline/rail/filtri/restore | **IMPLEMENTATO** |
| PO-Q / PO-R | **RECEPITI** |
| `role` eliminato | **SÌ** (codice + migration) |
| DOC 17 / MASTER 04 / 03 | **AGGIORNATI** |

### Verdetto

# **IMPLEMENTATO**

Feature Angolo Cultura Timeline consegnata secondo contratto FASE 3–5.  
Applicare la migration sul DB remoto/local prima dell’uso runtime.

**Correzione migration (stesso file, pre-apply):** CHECK lifecycle categorie e date rafforzati (vedi §F6.0) — `is_active`/`deleted_at` XOR stretto; deceduto ⇒ `death_year NOT NULL`; `death_year >= birth_year`; `death_date >= birth_date` se entrambe presenti.

---

# FASE 6 — ESTENSIONE UI + COMMUNITY + ADMIN HUB (AUDIT)

> **Data:** 2026-08-27  
> **Tipo:** Audit architetturale / UX / DB / riuso Patron — **nessuna implementazione F6 in questa fase**.  
> **Vincolo:** non riaprire decisioni F3–F5; distinguere requisito PO / pattern verificato / proposta tecnica / da verificare / blocker.

---

## F6.0 Correzione vincoli migration (ESEGUITA NEL FILE SQL)

File: `supabase/migrations/20260827120000_famous_person_categories_and_dates.sql`

Verifiche DB reali (pre-revisione, fornite dal PO): 16 record test in `city_people`; nessuna FK in entrata; nessuna dipendenza colonna `role`; `is_td_admin` / `is_service_role` presenti. Cutover `DELETE` + `DROP role` **confermato** — non rimosso.

| Vincolo | Contratto | CHECK |
|---------|-----------|--------|
| Categoria attiva | `is_active=true` ∧ `deleted_at IS NULL` | master/specific `*_active_deleted_chk` |
| Categoria disattivata | `is_active=false` ∧ `deleted_at IS NOT NULL` | idem (vietato `false`+`NULL`) |
| Vivente | `is_living=true` ⇒ morte assente | `city_people_dates_living_chk` |
| Deceduto | `is_living=false` ⇒ `death_year IS NOT NULL` (`death_date` opzionale) | idem |
| Anni | `death_year >= birth_year` se entrambi valorizzati | `city_people_death_year_ge_birth_year_chk` |
| Date | `death_date >= birth_date` se entrambe valorizzate | `city_people_death_date_ge_birth_date_chk` |
| Anno↔data | EXTRACT year coerente | vincoli già presenti, mantenuti |

**Stato:** corretto nel file migration; applicare sul DB prima dell’uso.

---

## F6.1 Requisiti PO (nuova richiesta) — NON implementati

### R1 — Periodo temporale dinamico (timeline / inquadramento)

| Campo | Contenuto |
|-------|-----------|
| **Requisito** | In prossimità freccia SX → anno **min** dei personaggi attualmente inquadrati; freccia DX → anno **max**; aggiornamento dinamico allo scroll |
| **Base temporale** | `birth_year` (coerente con filtro pubblico e ordinamento cronologico già chiusi) |
| **Stato** | **REQUISITO PO** — da implementare dopo definizione tecnica “viewport” (§F6.3) |

### R2 — Frecce rail alte quanto la card

| Campo | Contenuto |
|-------|-----------|
| **Requisito** | Controlli L/R della rail card grandi: altezza ≈ card; touch-friendly; no overflow; no copertura contenuti critici |
| **Stato** | **REQUISITO PO** |

### R3 — Card più alte + CTA sotto la foto

| Campo | Contenuto |
|-------|-----------|
| **Requisito** | Maggiore uso verticale; layout: immagine → **SCOPRI LA STORIA** immediatamente sotto; SELECT card ≠ CTA (contratto F4 invariato) |
| **Runtime oggi** | Card `h-[400px]`; CTA già separata ma nel blocco testo in basso sull’overlay (`CultureCornerModal`) |
| **Stato** | **REQUISITO PO** |

### R4 — Azioni pubbliche (pattern Patron)

| Azione | Requisito |
|--------|-----------|
| Consiglia un personaggio famoso | Nuovo flusso community |
| Suggerisci foto | Allineare qualità/workflow a Patron foto |
| Segnala abuso | Allineare qualità/workflow a Patron abuse |
| **Nota su «Consiglia personaggio»** | **OBBLIGATORIA** (trim; no placeholder; blocca submit se vuota) — **differenza esplicita vs Patron** |

### R5 — Admin Territorio → «Personaggio famoso»

| Campo | Contenuto |
|-------|-----------|
| **Requisito** | Voce dedicata sotto Territorio; gestione paragonabile a Santo Patrono (elenco, moderazione suggestion/foto/abuso, stati) |
| **Permessi** | `admin_all` **e** `admin_limited` (coerente PO-C; non Settings-only) |
| **Distinzione** | Esiste già `people_categories` (tassonomia) ≠ hub moderazione/community |

---

## F6.2 Runtime Angolo Cultura (verificato post-F5)

| Elemento | Evidenza |
|----------|----------|
| Host | `CultureCornerModal.tsx` |
| Entry | `CityHeader` → `CityDetailContent` `activeModal==='culture'` |
| Timeline + rail | Due `DraggableSlider` indipendenti; sync solo onSelect |
| Card rail | `w-[280px]/sm:w-[300px]`, `h-[400px]`; select surface + CTA button distinti |
| Frecce | Pulsanti `min-h-11 min-w-11` (pattern Patron strip) — **non** full-height |
| CPI | `mode="index"` |
| Filtri | Master/Specific/year; PO-Q |
| Memoria | sessionStorage keyed `cityId` (§F4.2) |
| Azioni community | **ASSENTI** |
| Foto multi | Solo `image_url` singolo su `city_people` |

---

## F6.3 Definizione tecnica «card inquadrate» (periodo min/max)

### Stato attuale (verificato)

- `DraggableSlider`: track `overflow-x-auto`, snap-x, `onScroll` opzionale; API `getScrollLeft` / `scrollToChild`.
- CultureCorner **non** calcola oggi l’insieme degli elementi intersecanti il viewport.
- CPI index mode = indice del **selezionato**, non del viewport.

### Ambiguità

«Card inquadrate» ≠ «personaggio selezionato» ≠ «tutto il set filtrato».

### PROPOSTA TECNICA (non decisione PO)

Definire **viewport-visible set** della **rail card** (superficie primaria delle card grandi):

1. Su `scroll` (rail) + `resize`: per ogni child, IntersectionObserver (o geometria `getBoundingClientRect` vs track) con soglia es. `intersectionRatio >= 0.5` **oppure** centro card entro bounds del track.
2. `minYear` / `maxYear` = min/max di `birth_year` tra i personaggi nel viewport-visible set (ignorare null).
3. Mostrare anni accanto alle frecce **della stessa superficie** usata per il calcolo (raccomandazione: **rail**; allineare timeline label solo se si adotta la stessa metrica — evitare due min/max divergenti).
4. Debounce scroll (~50–100ms); `aria-live="polite"` per annunciare intervallo.
5. Se viewport vuoto (transizione): mantenere ultimo intervallo valido o «—».

**DA VERIFICARE in implementazione:** soglia intersection (0.5 vs “any pixel”); se timeline e rail devono condividere lo stesso periodo (PO ha parlato di frecce timeline e di card — chiarire in UI che il periodo è della **rail** se non specificato altrimenti).

**Impatto decisioni chiuse:** nessuno su §F4.2 (scroll ≠ select). Il periodo è **derivato dallo scroll**, non seleziona.

---

## F6.4 Patron — pattern verificato (riuso)

### Esiste (Santo Patrono)

| Flusso | UI | Service | Tabelle |
|--------|-----|---------|---------|
| Suggerisci foto | `SuggestPatronPhotoModal` | `patronPhotoSuggestionService` + RPC `submit_patron_photo_suggestion` | `patron_photo_suggestions`, `patron_photo_suggestion_items` |
| Segnala abuso | `ReportPatronPhotoAbuseModal` | `patronPhotoReportService` | `patron_photo_reports` |
| Gallery ufficiale | `PatronFestGalleryStrip` | `cityPatronGalleryService` | `city_patron_gallery` |
| Admin hub | `AdminPatronSaintManager` view `patron_saint` | counts + moderation | stati pending/in_review/accepted/rejected; report photo_blocked |

Migrations: `20260819120000_*`, `20260820163000_*`, `20260820180000_*`.

### NON esiste su Patron

- «Consiglia un Santo Patrono» come suggestion community di **entità** (il patrono è JSON su `cities`).

### Note obbligatorie

| Flusso Patron | Note |
|---------------|------|
| Suggerisci foto | **Facoltative** |
| Segnala abuso | **Facoltative** (reason enum obbligatorio) |

→ Per Famous Person «Consiglia personaggio»: note **obbligatorie** = **nuova regola di prodotto**, non copia Patron.

### Condivisibile vs nuovo

| Pattern | Verdetto |
|---------|----------|
| Upload `uploadPublicMediaDetailed` (folder dedicata) | **Riusabile** |
| Shell modal Foundation / ESC / focus | **Pattern UI** |
| `is_td_admin` RLS | **Riusabile** |
| State machine pending→in_review→terminal | **Pattern** |
| Tabelle/RPC Patron | **NON riusare come SoT People** (dominio diverso) |
| Framework suggestion Community (`suggestions` / `history_culture`) | **Non** sufficiente per `city_people` tipizzato + foto + abuse |

**PROPOSTA TECNICA:** stack parallelo `famous_person_*` (suggestion entity + photo suggestions + reports + eventuale gallery) ispirato 1:1 al Patron, **senza** merge tabelle Patron.  
**DA VERIFICARE su DB live** prima della migration F6: assenza tabelle people-community (atteso: assenti); naming finale; storage paths.

---

## F6.5 Impatti DB (F6) — da verificare prima di scrivere migration

### Già presenti (F5)

`city_people`, categorie, junction, date, soft-delete.

### Mancanti per R4–R5 (repo: **non trovate**)

Nessuna tabella `*famous*suggestion*`, `*person*photo*report*`, gallery people oltre `image_url`.

### Query read-only consigliate (live) prima di progettare schema

```sql
-- Esistenza tabelle candidate
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name ILIKE '%patron%' OR table_name ILIKE '%people%' OR table_name ILIKE '%famous%';

-- Colonne image su city_people
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'city_people'
ORDER BY ordinal_position;
```

**Non inventare** colonne/enum finché non verify live + disegno esplicito in PR migration F6.

### Decisioni DB ancora aperte (prodotto / tecnica)

| # | Questione | Perché |
|---|-----------|--------|
| D1 | Gallery multi-foto per personaggio (come Patron) vs solo replace `image_url` | Impatta storage + Admin + abuse target |
| D2 | «Consiglia personaggio» crea draft `city_people` o coda suggestion separata? | Integrità publish gate / categorie |
| D3 | Abuse su foto suggestion vs solo foto pubblicata | Allineamento Patron (abuse su gallery pubblicata) |

Queste **non** sono chiuse dal PO in questo prompt → restano **DA DECIDERE / DA CONFERMARE** prima dell’implementazione DB F6.

---

## F6.6 Admin «Personaggio famoso»

| Aspetto | Verificato |
|---------|------------|
| Voce oggi | `people_categories` = solo tassonomia |
| Target | Nuova view es. `famous_people` / `personaggio_famoso` sotto Territorio (accanto `patron_saint`) |
| Permessi UI | Come `patron_saint`: entrambi i ruoli; **non** sotto Settings |
| Funzioni attese | Elenco suggestion, foto, abuse; stati; azioni approve/reject/block; badge count pending |
| RLS | Pattern `is_td_admin` |

**Non** fondere Manager categorie con hub moderazione (due job diversi).

---

## F6.7 UI / responsive / a11y (impatti F6)

| Tema | Note |
|------|------|
| Periodo min/max | Target touch ≥44px; contrasto; `aria-live` |
| Frecce full-height | PROPOSTA: colonna laterale `self-stretch` / `h-full` allineata alla card, hit area larga ma overlay non opaco sul contenuto; su mobile valutare frecce sotto o gesture-first (Patron nasconde frecce sotto soglia) |
| Card height | Aumentare oltre 400px solo dopo misura `max-h` modale (`md:max-h-[85vh]`); evitare doppio scroll verticale+orizzontale ingombrante |
| CTA sotto foto | Due controlli: (1) bottone select sull’immagine/area; (2) CTA sotto media — **no** button-in-button; focus-visible; restore focus post-dettaglio |
| Area azioni bottom | Tre CTA coerenti con Patron (icone + label); guest gate come Patron |
| Biome | Nessuna suppress; correggere debito solo nei file toccati |

---

## F6.8 Coerenza con decisioni già chiuse

| Decisione chiusa | Impatto F6 |
|------------------|------------|
| §F4.2 selection | Invariata; periodo viewport ≠ selezione |
| SELECT ≠ CTA | Rafforzata da R3 |
| no `role` | Invariato |
| N:M categorie | Suggestion personaggio dovrà assegnare Specific in Admin approve (PROPOSTA) |
| soft-delete categorie | Invariato |
| CPI index | Invariato (periodo è UX aggiuntiva, non sostituto CPI) |
| Manager limited | Nuova voce Territorio deve restare visibile a limited |

---

## F6.9 Rischi

| Rischio | Gravità | Mitigazione |
|---------|---------|-------------|
| Periodo min/max “inventato” senza IntersectionObserver | Alta UX | Definire viewport (§F6.3) prima del codice |
| Copia tabelle Patron in People | Contaminazione dominio | Stack dedicato + pattern only |
| Note obbligatorie bypassate | Alta prodotto | Validazione UI + service + DB CHECK/NOT NULL sulla suggestion |
| Card troppo alte su mobile | Media | Prototype height + safe-area |
| Abuse senza gallery multi | Media | Chiudere D1 prima |
| Doppio Admin (categorie vs hub) confuso | Bassa | Label chiare in sidebar |

---

## F6.10 Piano di implementazione ordinato (post-GO F6)

1. Chiudere D1–D3 (prodotto) se necessarie.  
2. Verify SQL live (§F6.5).  
3. Migration community Famous Person (+ RLS + storage paths).  
4. Domain validation note obbligatoria suggestion.  
5. Services mirror Patron (suggestion / photo / report).  
6. Public UI: azioni bottom + modali.  
7. Admin view Territorio + badge counts.  
8. UI polish: viewport years, frecce full-height, card/CTA layout.  
9. a11y + responsive pass.  
10. `npm run typecheck` + biome file toccati; update DOC 17.

**Non** mescolare polish UI (R1–R3) e stack community (R4–R5) nella stessa PR se aumenta rischio — preferire PR A (UI) / PR B (community+Admin) dopo schema.

---

## F6.11 Blocker / da verificare

| ID | Tipo | Descrizione |
|----|------|-------------|
| B-F6-1 | **DA VERIFICARE DB** | Confermare assenza tabelle people-community; colonne `city_people` post-migration F5 |
| B-F6-2 | **DECISIONE PRODOTTO** | D1 gallery multi vs single image |
| B-F6-3 | **DECISIONE PRODOTTO** | D2 coda suggestion vs insert draft people |
| B-F6-4 | **DECISIONE PRODOTTO** | D3 scope abuse |
| B-F6-5 | **TECNICO** | Soglia “inquadrato” (intersection) — chiudibile in implementazione se PO accetta §F6.3 |

**Nessun blocker** sulla feature F5 già implementata.

---

## F6.12 DEVELOPMENT READINESS GATE (estensione F6)

| Voce | Stato |
|------|--------|
| Requisiti R1–R5 documentati | **OK** |
| Runtime Culture verificato | **OK** |
| Pattern Patron mappato | **OK** |
| Nota obbligatoria suggestion person | **OK** (requisito) |
| Schema community People | **NON ESISTE** — da progettare dopo D1–D3 + verify DB |
| Implementazione F6 | **NON AVVIATA** |
| Decisioni F3–F5 | **INVARIATE** |
| Migration F5 CHECK rafforzati | **OK** (file SQL) |

### Verdetto F6

# **AUDIT COMPLETATA — NON IMPLEMENTARE F6 FINO A CHIUSURA D1–D3 (+ verify DB)**

Implementabile subito in parallelo **solo** se si spezza lo scope:
- **PR UI-only (R1–R3):** fattibile sul runtime attuale senza DB community (periodo viewport + frecce + layout CTA).  
- **PR Community+Admin (R4–R5):** **NO-GO** finché D1–D3 e verify schema non sono chiusi.

---

*Fine guida (Fasi 1–6). SoT vigente: questo file. Feature base = F5; estensione = F6 audit.*
