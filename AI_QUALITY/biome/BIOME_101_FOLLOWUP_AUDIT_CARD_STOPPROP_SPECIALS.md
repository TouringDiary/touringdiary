# Audit follow-up 101 static — CARD / stopPropagation / casi particolari

> **Documento finale della review** STEP C / D / E (2026-08-16).  
> **Scope:** registro delle **decisioni architetturali** della review — **non** dashboard numerica e **non** piano di lavoro automaticamente aperto.  
> **SoT numerica:** esclusivamente [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md).  
> **FP intenzionali (18):** [`D_policy_and_false_positives.md`](./D_policy_and_false_positives.md).  
> **Provenienza:** review manuale B2b del 2026-08-16 (classificazione qualitativa di location).  
> **Lingua:** percorsi UI in linguaggio semplice (come davanti al monitor).

**UX da non rompere (SoT prodotto):**

- Sulla **Home**, le **card città** restano **interamente cliccabili** e aprono il dettaglio.
- Il **cuore preferiti** sulla stessa card resta cliccabile **da solo**.
- Cliccando il cuore **non** deve aprirsi anche il dettaglio della card.

> «101 location» = census/review **qualitativa**. **Non** nuova baseline Biome. **Non** «101 problemi ancora aperti». I **18 FP** fanno parte dei 101 ma gli altri casi non sono automaticamente «83 fix obbligatori».

---

## Indice

1. [STEP C — S-CARD-ROW](#step-c--s-card-row)
2. [STEP D — S-SHIELD-NESTED (stopPropagation)](#step-d--s-shield-nested-stoppropagation)
3. [STEP E — Casi particolari](#step-e--casi-particolari)
4. [Stato finale della review](#stato-finale-della-review)

---

# STEP C — S-CARD-ROW

Per ogni caso: percorso UI → comportamento → problema Biome → soluzione → decisione.

### C01 — `AdminSocialStudio.tsx:181`

**PERCORSO UI**  
Admin → Social Studio → tab Template → lista «I Tuoi Template» → riga di un template.

**COMPORTAMENTO ATTUALE**  
- Click sulla riga → seleziona quel template.  
- Click sul cestino a destra → elimina (con `stopPropagation`).

**PROBLEMA BIOME/A11Y**  
Riga = `div` con `onClick` (controllo non semantico) + button nested.

**DECISIONE:** KEEP CARD CLICKABLE  
**SOLUZIONE:** Mantenere riga cliccabile per la selezione; cestino resta `button` con `stopPropagation`. Opzionale in un batch successivo: riga → `button`/`role="option"` senza annidare il cestino nello stesso nodo interattivo.

---

### C02 — `RegionalAnalysisModal.tsx:725`

**PERCORSO UI**  
Admin → analisi regionale (modal) → zona → card città suggerita (nome, visitatori, stato).

**COMPORTAMENTO ATTUALE**  
Click sulla card → toggle selezione città. Nessun controllo nested separato.

**PROBLEMA BIOME/A11Y**  
Card statica usata come toggle.

**DECISIONE:** KEEP CARD CLICKABLE  
**SOLUZIONE:** Intera card come controllo di selezione (`button` o `role="checkbox"`). Nessun cuore/nested da proteggere.

---

### C03 — `ZoneCard.tsx:312`

**PERCORSO UI**  
Admin → mappa strategica → card zona → riga città (reale o «mancante»).

**COMPORTAMENTO ATTUALE**  
- Click riga → apri edit oppure genera AI.  
- Pulsanti laterali (CERCA POI / COMPLETA / matita / cestino) con `stopPropagation`.

**DECISIONE:** KEEP CARD CLICKABLE  
**SOLUZIONE:** Come CityCard: corpo riga = azione primaria; azioni laterali restano `button` + shield.

---

### C04 — `AnomalyInspector.tsx:369`

**PERCORSO UI**  
Admin → Osservatorio → lista priorità anomalie POI → card anomalia.

**COMPORTAMENTO ATTUALE**  
Click ovunque sulla card (anche sull’icona matita decorativa) → apre edit.

**DECISIONE:** KEEP CARD CLICKABLE  
**SOLUZIONE:** Card = apri edit. Se si tiene l’icona Edit, renderla `button` con lo stesso handler (o solo decorazione senza sembrare un secondo controllo).

---

### C05 — `CityCard.tsx:142` (Home — riferimento prodotto)

**PERCORSO UI**  
Home (`/`) → sezioni in evidenza / più visitate (e usi affini) → **card città** con foto, nome, zona, stelle; in alto a destra nel testo c’è il **cuore**.

**COMPORTAMENTO ATTUALE**  
- Click sulla card → apre il dettaglio città.  
- Click sul cuore → preferito / togli preferito **senza** aprire la città (`stopPropagation` sul wrapper + `FavoriteBookmarkButton`).

**PROBLEMA BIOME/A11Y**  
Card = elemento statico con `onClick` + controllo nested.

**Cosa NON rompere:** card interamente cliccabile; cuore indipendente.

**DECISIONE:** KEEP CARD CLICKABLE  
**SOLUZIONE:** Conservare il pattern attuale. Bonifica a11y = semantica della superficie card (es. `button`/`role` sul contenitore click **oppure** link overlay) **senza** togliere il click sull’intera card e **senza** togliere il cuore. Lo shield sul preferito resta (vedi D01).

---

### C06 — `CityHistory.tsx:16`

**PERCORSO UI**  
Componente «Approfondimenti Storici» (header espandi + «Angolo Cultura»).  
**Nota:** nessun uso/import trovato nel tree live → probabilmente **orphan**.

**COMPORTAMENTO (se usato):** header espande; «Angolo Cultura» / «Suggerisci Modifica» con `stopPropagation`.

**DECISIONE:** CHANGE STRUCTURE (se reintrodotto) / escludere se orphan  
**SOLUZIONE:** Header expand = un `button`; azioni sibling fuori dal nodo expand. Se orphan: non priorità UI live.

---

### C07 — `GalleryGrid.tsx:50`

**PERCORSO UI**  
Pagina città → Gallery → tile foto.

**COMPORTAMENTO ATTUALE**  
- Click tile → lightbox.  
- Click cuore like → like (`stopPropagation`).

**DECISIONE:** KEEP CARD CLICKABLE  
**SOLUZIONE:** Identico CityCard (tile apre; cuore indipendente).

---

### C08 / C09 — `ShowcaseCards.tsx:138` / `:218`

**PERCORSO UI**  
Pagina città → Showcase / liste → card POI (orizzontale / verticale).

**COMPORTAMENTO ATTUALE**  
- Click card → dettaglio POI (anche drag desktop).  
- Like / aggiungi itinerario / grip → azioni proprie con shield.

**DECISIONE:** KEEP CARD CLICKABLE  
**SOLUZIONE:** Card apre dettaglio; ActionRow resta indipendente (D02). Grip: valutare handle dedicato in batch successivo.

---

### C10 — `AdPlaceholder.tsx:44`

**PERCORSO UI**  
Home / Sidebar / tab città / shop — tile tratteggiata «Clicca qui» (slot sponsor vuoto).

**COMPORTAMENTO ATTUALE**  
Click area → tipicamente apre flusso sponsor (`onClick` opzionale). Nessun nested.

**DECISIONE:** CHANGE STRUCTURE  
**SOLUZIONE:** `div` → `button type="button"` (o link) con stesso handler; area intera OK.

---

### C11 — `ImageWithFallback.tsx:108`

**PERCORSO UI**  
Utility immagini usata in molti posti; diventa cliccabile **solo** se il caller passa `onClick` (es. editor Santo Patrono in admin).

**DECISIONE:** other (utility, non card prodotto)  
**SOLUZIONE:** Se c’è `onClick` → wrapper semantico (`button`/role); se no → nessun ruolo. Non applicare il pattern CityCard in globale.

---

### C12 — `LiveFeedCarousel.tsx:40`

**PERCORSO UI**  
Community → Live Feed → carosello thumbs sotto l’hero.

**COMPORTAMENTO ATTUALE**  
Click thumb non attiva → seleziona nell’hero; click su attiva → lightbox. Nessun nested.

**DECISIONE:** KEEP CARD CLICKABLE  
**SOLUZIONE:** Tile = controllo selezione/lightbox (`button`/`role="option"`).

---

### C13 — `QaForumTab.tsx:454`

**PERCORSO UI**  
Community → Forum Q&A → card domanda.

**COMPORTAMENTO ATTUALE**  
- Click card → apre il post.  
- Like con `stopPropagation`.  
- «Risposte» è `button` senza azione propria (oggi apre comunque il post via bubbling).

**DECISIONE:** KEEP CARD CLICKABLE  
**SOLUZIONE:** Card apre thread; like indipendente; «Risposte» → span oppure stesso open esplicito (evitare button finto).

---

### C14 — `DiaryMemoCard.tsx:104`

**PERCORSO UI**  
Diario di viaggio → giorno → riga memo «Nota: …» collegata a una risorsa.

**COMPORTAMENTO ATTUALE**  
- Click corpo (se collegata) → apre risorsa.  
- Cestino → rimuove (`stopPropagation`).

**DECISIONE:** KEEP CARD CLICKABLE  
**SOLUZIONE:** Corpo apre; cestino indipendente. **Non** confondere con la nota editabile della tappa custom (E4).

---

### C15 — `SuitcaseItemRow.tsx:113`

**PERCORSO UI**  
Diario → Valigia → riga oggetto (grip, checkbox, nome, quantità).

**COMPORTAMENTO ATTUALE**  
Click riga → seleziona; controlli nested con `stopPropagation`.

**DECISIONE:** KEEP CARD CLICKABLE  
**SOLUZIONE:** Riga selezionabile; nested restano button + shield.

---

### C16 — `CuratedGridSection.tsx:17` (MiniCityCard)

**PERCORSO UI**  
Home → sezione ispirazione (es. destinazioni top) → mini tile città (foto + nome). **Senza cuore.**

**COMPORTAMENTO ATTUALE**  
Click tile → apre città.

**DECISIONE:** KEEP CARD CLICKABLE  
**SOLUZIONE:** Tile intera apre dettaglio. Se in futuro si aggiunge il cuore: stesso pattern di CityCard.

---

### C17 — `HomeContent.tsx:214` (sponsor Home)

**PERCORSO UI**  
Home → area sponsor → card POI sponsor (foto, badge, + diario, grip).

**COMPORTAMENTO ATTUALE**  
Click card → dettaglio; + / drag indipendenti.

**DECISIONE:** KEEP CARD CLICKABLE  
**SOLUZIONE:** Come CityCard; allineare cursore al fatto che la card è cliccabile.

---

### C18 — `ItinerariesList.tsx:53`

**PERCORSO UI**  
Sezione Itinerari → lista a sinistra → card itinerario (cover + cuore).

**COMPORTAMENTO ATTUALE**  
- Click card → seleziona itinerario.  
- Click cuore → like (`stopPropagation`).

**DECISIONE:** KEEP CARD CLICKABLE  
**SOLUZIONE:** Identico CityCard.

---

### C19 / C20 / C21 — `Sidebar.tsx:352` / `:676` / `:772`

**PERCORSO UI**  
- **352:** mobile Diario fullscreen → footer «Partner d'Eccellenza».  
- **676:** desktop sidebar companion (focus) → box sponsor.  
- **772:** desktop sidebar tour → box sponsor.

**COMPORTAMENTO ATTUALE**  
Click card → dettaglio POI; + (e grip dove presente) indipendenti.

**DECISIONE:** KEEP CARD CLICKABLE  
**SOLUZIONE:** Pattern CityCard / sponsor.

---

### C22 — `CityEventsTab.tsx:133`

**PERCORSO UI**  
Modal info città → tab Eventi → header riga evento (testo + AGGIUNGI + chevron).

**COMPORTAMENTO ATTUALE**  
Click header → espande; AGGIUNGI con stopProp; chevron senza handler (bubbla → expand).

**DECISIONE:** CHANGE STRUCTURE  
**SOLUZIONE:** Un solo `button` expand per l’header; AGGIUNGI **sibling** fuori da quel button. Chevron = icona nello stesso expand, non secondo button nested.

---

### C23 — `ServicesCategoryList.tsx:194`

**PERCORSO UI**  
Modal info città → tab Servizi → card servizio («Clicca per info» + Chiama / Web / Aggiungi).

**COMPORTAMENTO ATTUALE**  
Click card → espande; azioni con shield (D14).

**DECISIONE:** KEEP CARD CLICKABLE  
**SOLUZIONE:** Espandi sulla card; azioni indipendenti.

---

### C24 — `PreviewGallery.tsx:123`

**PERCORSO UI**  
Modal anteprima sezione → gallery → tile foto → lightbox.

**DECISIONE:** KEEP CARD CLICKABLE  
**SOLUZIONE:** Tile → controllo semantico zoom; area intera OK.

---

### C25 — `PreviewSidebar.tsx:55`

**PERCORSO UI**  
Stesso modal anteprima → sidebar → riga città/servizio selezionabile.

**DECISIONE:** KEEP CARD CLICKABLE  
**SOLUZIONE:** Riga = `button` / `role="option"`.

---

### C26 — `PhotoGrid.tsx:29`

**PERCORSO UI**  
Classifiche → tab foto → tile (rank, like).

**DECISIONE:** KEEP CARD CLICKABLE  
**SOLUZIONE:** Tile apre viewer; cuore indipendente.

---

### C27 — `PoiList.tsx:15`

**PERCORSO UI**  
Classifiche → tab POI → riga lista.

**DECISIONE:** KEEP CARD CLICKABLE  
**SOLUZIONE:** Riga apre dettaglio POI.

---

### C28 — `ShopCard.tsx:39`

**PERCORSO UI**  
Shop → categoria → card bottega (foto, rating, chip prodotti, **cuore**).

**COMPORTAMENTO ATTUALE**  
- Click card → apre bottega.  
- Cuore → preferito indipendente.  
- Chip prodotto → spesso riapre la stessa bottega con stopProp.

**DECISIONE:** KEEP CARD CLICKABLE  
**SOLUZIONE:** Card + cuore come CityCard. Chip: se fanno la stessa cosa della card, evitare button+stopProp ridondante; se aprono un prodotto, azione dedicata.

---

### C29 — `ShopHero.tsx:52`

**PERCORSO UI**  
Pagina bottega → hero gallery → click slide apre lightbox; frecce prev/next a parte.

**DECISIONE:** KEEP CARD CLICKABLE (slide)  
**SOLUZIONE:** Slide = apri lightbox; frecce restano button indipendenti.

---

### C30 — `ShopHomeView.tsx:99`

**PERCORSO UI**  
Shop home → slot gold vuoto → promo «diventa sponsor».

**DECISIONE:** CHANGE STRUCTURE  
**SOLUZIONE:** Un `button`/CTA unico sull’area; nessun nested.

---

### C31 — `ShopProducts.tsx:64`

**PERCORSO UI**  
Pagina bottega → prodotti → card prodotto.

**DECISIONE:** KEEP CARD CLICKABLE  
**SOLUZIONE:** Card seleziona prodotto.

---

### C32 — `UserNotificationsTab.tsx:237`

**PERCORSO UI**  
Dashboard utente → Centro Notifiche → riga notifica.

**DECISIONE:** KEEP CARD CLICKABLE  
**SOLUZIONE:** Riga = controllo che apre/segna letta (`button` o `role="link"`).

---

### Sintesi STEP C

| Famiglia | Decisione tipica |
|----------|------------------|
| CityCard, ShopCard, ItinerariesList, Gallery, Showcase, Sidebar/Home sponsor, memo, suitcase row, rankings foto | **KEEP CARD CLICKABLE** + nested indipendenti |
| MiniCity, Preview, PoiList, LiveFeed tile, prodotti, notifiche, RegionalAnalysis | **KEEP** (semantica button dove serve) |
| Eventi header, AdPlaceholder, Shop gold empty, CityHistory orphan | **CHANGE STRUCTURE** |
| `ImageWithFallback` | **other** (utility) |

---

# STEP D — S-SHIELD-NESTED (stopPropagation)

Principio: se il contenitore apre un dettaglio e il controllo interno fa altro (cuore, like, admin…), lo shield **serve**. Non eliminarlo «per Biome».

| ID | File:linea | Dove sei | Contenitore | Click contenitore | Controllo interno | Click interno | Decisione | Perché |
|----|------------|----------|-------------|-------------------|-------------------|---------------|-----------|--------|
| D01 | `CityCard.tsx:179` | Home → card città | Card | Apre città | Cuore | Preferito | **KEEP** | Senza shield il cuore aprirebbe la città |
| D02 | `ShowcaseCards.tsx:63` | Città → card POI | Card | Apre POI | Like / + / grip | Azioni proprie | **KEEP** | Stesso motivo |
| D03 | `LiveFeedHero.tsx:86` | Community → hero feed | Media hero | Lightbox | Admin Delete/Trophy | Azioni admin | **KEEP** | Altrimenti aprirebbero lightbox |
| D04 | `HeroAiModule.tsx:104` | Home → Consulente AI | Header expand | Toggle espansione | Banner runtime AI | Nessun toggle | **KEEP** | Banner non deve espandere/collassare |
| D05 | `HeroAiModule.tsx:123` | stesso | Header expand | Toggle | Chevron | **Stesso** toggle | **RESTRUCTURE** | Duplicato dello stesso controllo; stopProp non «salva» un’azione diversa |
| D06 | `HeroAiModule.tsx:135` | stesso (mobile banner) | Header | Toggle | Banner | — | **KEEP** | Come D04 |
| D07 | `HeroAiModule.tsx:152` | stesso (desktop) | Header | Toggle (anche se cursore default) | Chevron | Stesso toggle | **RESTRUCTURE** | Come D05 |
| D08 | `HeroFilterModule.tsx:185` | Home → Trova la meta | Header compact | Toggle | Chevron | Stesso toggle | **RESTRUCTURE** | Come D05 |
| D09 | `HeroFilterModule.tsx:257` | stesso | Header filter | Toggle | Summary chips | Non deve toggle | **KEEP** | Summary ≠ expand |
| D10 | `HeroFilterModule.tsx:264` | stesso | Header | Toggle | Chevron | Stesso toggle | **RESTRUCTURE** | Come D05 |
| D11 | `ShopCard.tsx:73` | Shop → card bottega | Card | Apre shop | Cuore | Preferito | **KEEP** | Come CityCard |
| D12 | `HeaderPopover.tsx:150` | Header → pannello portal | Panel | Nessun parent-card onClick | Chrome panel | — | **REMOVE** (o KEEP solo difensivo debole) | Chiusura via outside-click; non pattern card |
| D13 | `AnchoredPopover.tsx:88` | Popover ancorato | Panel portal | Idem | — | — | **REMOVE** / KEEP debole | Come D12 |
| D14 | `ServicesCategoryList.tsx:223` | Modal città → Servizi | Card expand | Espande | Chiama/Web/Aggiungi | Azioni | **KEEP** | Non devono toggle-expand |
| D15 | `Sidebar.tsx:704` | Sidebar sponsor | Card | Apre POI | Grip / + | Azioni | **KEEP** | Necessario |
| D16 | `Sidebar.tsx:796` | Sidebar tour sponsor | Card | Apre POI | Grip / + | Azioni | **KEEP** | Come D15 |
| D17 | `CityRow.tsx:53` | Classifiche → riga città | `<tr>` navigabile | Naviga | Thumb zoom | Zoom foto | **KEEP** | Zoom ≠ navigate |
| D18 | `SectionPreviewModal.tsx:366` | Preview → lightbox chrome | Chrome sotto | Dismiss è **button sibling** A1 | Chrome | — | **REMOVE** (quasi) | Backdrop già sibling; stopProp spesso ridondante — verificare like nested |
| D19 | `PreviewHero.tsx:146` (panel desc) | Preview hero → modal descrizione | Panel | Dismiss A1 sibling | Panel | — | **REMOVE** | Con contratto A1 sul dismiss, stopProp sul panel è ridondante |
| D20 | `ViaggioRicordamiControl.tsx:131` | MySpace → controllo Ricordami | Wrapper | **Nessun** onClick sulla card parent (open è sibling) | Controlli | — | **REMOVE** | Shield non protegge un parent cliccabile; tenere solo se riusato dentro card cliccabile |

---

# STEP E — Casi particolari

## E1 — Onboarding (`OnboardingWizard.tsx` 262 / 289 / 294)

### PERCORSO UI
→ App aperta con guida onboarding attiva (overlay da layout principale)  
→ Schermo intero con sfondo scuro  
→ Fumetto / UI della guida + **mascotte** cliccabile  

### Cosa vedi
Un layer fisso sopra l’app. Non è una card. Non è un modal A1 classico con solo dimmer.

### Elementi e click

| Linea | Elemento | Cosa succede al click |
|-------|----------|------------------------|
| **262** | Root `fixed inset-0` | Chiude **solo** se `e.target === e.currentTarget` (click sul root «vuoto»). I figli coprono quasi tutto → dismiss fragile/raro |
| **289** | Layer UI full-size + `stopPropagation` | Evita che i click sulla UI interna chiudano il root; gran parte è `pointer-events-none` (mascotte/bubble hanno `pointer-events-auto`) |
| **294** | Mascotte | **Avanti** (`handleNext`) — è un vero controllo di avanzamento, non solo decorazione. Il toggle «Guida Attiva» ha stopProp proprio |

### DUBBIO BIOME/A11Y
Biome vede superfici statiche con handler mouse. Non è chiaro cosa sia «backdrop dismiss» vs «avanti» vs «presentazione».

### DECISIONE
**RESTRUCTURE** (non trattare come dimmer A1 puro senza redesign del flusso).

### SOLUZIONE
1. Backdrop dismiss esplicito = button mouse-only `inset-0` (stile A1) **se** si vuole chiusura click-fuori chiara.  
2. Layer UI presentazionale senza dover «fingere» un controllo.  
3. Mascotte → `button type="button"` con nome accessibile tipo «Avanti» / «Prossimo passo».  
4. Non proporre di togliere l’avanzamento dalla mascotte senza decisione PO sul flusso guida.

**DECISIONE PO RICHIESTA (solo se si cambia UX):**  
- **A)** Click sullo sfondo chiude sempre la guida (backdrop A1).  
- **B)** Solo Controlli espliciti (Avanti / Salta / Chiudi) — lo sfondo non chiude.  

Oggi il comportamento reale è più vicino a B con un dismiss root fragile.

---

## E2 — Hero

### E2-A — `HeroAiModule.tsx` (113 / 141 / 303 + shield correlati)

**PERCORSO UI**  
→ Home  
→ Hero in alto  
→ Blocco **«Il Tuo Consulente»** (modulo AI)

| Hit | Cosa clicchi | Cosa succede |
|-----|--------------|--------------|
| **113** | Header compact (titolo + area) | Espande / collassa il modulo |
| **141** | Header desktop | Stesso toggle (anche con cursore «default» su lg) |
| **303** | Bolla testo «typing» anteprima | **Invia** quella query AI (`handleAiSubmit`) — non è expand |

Shield correlati: banner AI (KEEP), chevron nested (RESTRUCTURE — stesso toggle del parent).

**DECISIONE:** CHANGE STRUCTURE sull’header; KEEP semantico sulla bolla submit.  
**SOLUZIONE:** Un solo controllo expand (`button`) sull’header; banner fuori dal toggle; bolla typing → `button` «Usa questo suggerimento»; togliere chevron duplicato nested.

---

### E2-B — `HeroFilterModule.tsx` (177 / 237 / 248 + shield)

**PERCORSO UI**  
→ Home  
→ Hero  
→ Blocco **«Trova la tua meta»** (filtri destinazione)

| Hit | Cosa clicchi | Cosa succede |
|-----|--------------|--------------|
| **177** | Header compact | Expand/collapse |
| **237** / area summary | Zona summary / trailing | Non deve fare da solo il toggle (shield KEEP sul summary) |
| **248** | Header body filtri | Expand + summary + chevron + Reset |

**DECISIONE:** CHANGE STRUCTURE  
**SOLUZIONE:** Un expand control; summary KEEP o fuori; Reset già button OK; chevron nested → RESTRUCTURE come E2-A.

---

### E2-C — `LiveFeedHero.tsx:38` (+ shield admin `:86`)

**PERCORSO UI**  
→ Community  
→ Live Feed  
→ **Immagine/media grande** in hero

**AZIONE:** click sul media  
**COMPORTAMENTO ATTUALE:** apre la **lightbox**. Frecce prev/next e like/admin sono overlay.

**DECISIONE:** KEEP media cliccabile; KEEP shield admin/like (D03).  
**SOLUZIONE:** Media = controllo «apri lightbox» (button/role coerente); overlay indipendenti come il cuore sulle card.

---

## E3 — Calendario Dal / Al (`DiaryHeaderDateRange.tsx` 78 / 130)

**PERCORSO UI**  
→ Diario di viaggio (sidebar)  
→ Header date  
→ Campo **DAL** (testo + icona calendario) e campo **AL** (stesso schema)

**Comportamento funzionale (già verificato, non ritesare):**  
icona DAL apre calendario iniziale; icona AL apre calendario finale.

### Struttura a11y (oggetto di questo audit)

1. Sì: ciascuna icona è il controllo che apre il rispettivo calendario.  
2. Sì: stesso schema per AL.  
3. Elemento HTML attuale delle icone: **`div`** con `onClick` + `stopPropagation` (non `button`).  
4. Il wrapper del campo **non** ha un `onClick` proprio; c’è un `input` testo accanto.  
5. Click icona → toggle calendario; lo `stopPropagation` evita bubbling verso eventuali ancestor del Diario.  
6. Serve stopProp? **Probabile KEEP difensivo** finché non si dimostra che nessun ancestor reagisce; non è il caso «cuore dentro card».  
7. Senza stopProp: **solo se** un padre ascolta il click — da verificare nel tree Diario; non automatico.  
8. Sì: le icone devono diventare **`button type="button"`** («Apri calendario Dal/Al») con `aria-expanded`.  
9. Come: stessi className di posizione assoluta / aspetto; stesso handler; nessun cambio al flusso apertura DAL/AL.

**DECISIONE:** CHANGE STRUCTURE (solo semantica trigger)  
**SOLUZIONE:** `div` icona → `button type="button"`; aspetto e comportamento invariati. Biome si risolve perché non è più static+handler. Valutare stopProp dopo smoke sul Diario.

**Non è** «falso positivo regola»: la rilevazione è corretta; manca il controllo semantico.

---

## E4 — Nota modificabile (`ItineraryItemCard.tsx:605`)

**PERCORSO UI**  
→ Diario di viaggio  
→ Timeline di un giorno  
→ **Tappa personalizzata** (`item.isCustom`)  
→ Riga del **nome/nota della tappa** (icona StickyNote sul nodo)

**Cosa NON è**  
- Non è `DiaryMemoCard` (memo «Nota: …» collegata a risorsa — C14).  
- Non è una tab/sezione globale «Note del diario».

**COMPORTAMENTO ATTUALE**  
- Vedi testo della descrizione tappa o placeholder «Clicca per scrivere...».  
- Click → entra in **edit inline** (`setIsEditingNote(true)` → `input`).  
- Non apre un dettaglio card generico.

**DUBBIO BIOME/A11Y**  
Superficie statica usata come «click-to-edit».

**DECISIONE:** other (click-to-edit, non card-open)  
**SOLUZIONE:**  
- Superficie → `button type="button"` «Modifica nota» che attiva l’edit, **oppure**  
- `role="textbox"` / pattern read-only che al click (e tastiera) entra in edit.  
Non confondere con creazione memo né con tab note.

---

## E5 — Santo Patrono (`CityHeader.tsx:172`)

**PERCORSO UI**  
→ Pagina città  
→ Header hero  

### Desktop (`md+`, pannello sinistro)
1. Riga **`div` «SANTO PATRONO» + icona Info** con `onClick={onOpenPatron}` ← **hit 172** (non button).  
2. Sotto: **`button` con il nome del patrono** → stesso `onOpenPatron`.  
→ Sul desktop sono **due controlli contemporanei** che fanno la **stessa** cosa.

### Mobile (`md:hidden`)
Un solo `button` «Patrono» (icona User) → stesso handler.  
**Non** è duplicato del desktop: viewport diverso (`md:hidden` vs blocco desktop).

**DECISIONE:** CHANGE STRUCTURE **solo desktop**  
**SOLUZIONE:**  
- **Non** eliminare il controllo mobile.  
- Sul desktop: lasciare **un** controllo (preferibile il `button` col nome del santo); la label «SANTO PATRONO» diventa testo statico (o un’unica area button che include label+nome).  
- Non sono due versioni responsive dello stesso nodo: sul desktop c’è davvero doppio controllo.

**DECISIONE PO RICHIESTA (micro):**  
- **A)** Resta cliccabile solo il nome del patrono (label statica).  
- **B)** Un unico button che include label «SANTO PATRONO» + nome.  

Entrambe preservano l’apertura del pannello patrono; cambia solo cosa è cliccabile visivamente.

---

## Cosa NON fare (promemoria)

- Non rendere non cliccabile la card città in Home.  
- Non togliere il cuore / preferito.  
- Non rimuovere `stopPropagation` dove protegge cuore/like/admin dentro card cliccabile.  
- Non usare `biome-ignore` / suppressioni sparse.  
- Non aprire B2c / non mescolare questa review con batch non autorizzati.  
- Non trasformare questo documento in una nuova baseline numerica.

---

## Stato finale della review

STEP **C**, **D** ed **E** sono stati **analizzati** e le **decisioni** risultano **registrate** in questo documento (KEEP / REMOVE / RESTRUCTURE / CHANGE STRUCTURE / other, con soluzioni proposte dove applicabile).

| Cosa è questo documento | Cosa non è |
|----|----|
| Registro finale della review qualitativa | Dashboard SoT |
| Decisioni architetturali / di prodotto | Lista automatica di debito «ancora da fare» |
| Riferimento per valutare eventuali modifiche future | Obbligo di implementare ogni «SOLUZIONE» proposta |

**Distinzione obbligatoria:**

1. **Decisione architetturale** (es. KEEP CARD CLICKABLE) — vincolo di prodotto.  
2. **Soluzione proposta** — indicazione tecnica coerente con la decisione; **non** implica «già implementata» se non dimostrato altrove.  
3. **Implementazione** — solo se esplicitamente eseguita e accettata in un batch di codice separato.

Eventuali modifiche future al codice vanno **valutate contro** queste decisioni; **non** vanno presentate come debito aperto automaticamente solo perché compare una «SOLUZIONE» in questa review.

I **18 FP** (`S-FP-*`) non sono in scope di questo follow-up CARD/shield/specials: restano in [`D_policy_and_false_positives.md`](./D_policy_and_false_positives.md) come **KEEP intenzionale**.
