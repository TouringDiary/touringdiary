# B2b — AUDIT DEI 389 RESIDUI

> **Solo classificazione** del residuo allo snapshot ufficiale **2026-08-13** (B2b **389**).  
> I conti sotto (**389**, **42** labels, ecc.) restano la fotografia SoT finché non esiste un **nuovo** snapshot Biome — **vietato** ricalcolare a mano.  
> **Eventi post-snapshot (codice/PO; NON nei contatori 389):**  
> - **2026-08-15** — low-risk A **ACCETTATA PO**; A5/A7-attempt **ESEGUITI** (attende ACCETTO PO).  
> - **2026-08-16** — C-P3a **ESEGUITO + ACCETTO PO** (3 label nativi htmlFor/id).  
> I contratti non ancora eseguiti restano **candidati**. C-P3a è **già eseguito/accettato** ma **non** riconciliato numericamente qui.  
> SoT operativa: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md). Tranche A: [`B2b_A_TRANCHE_A_PATTERN_AUDIT.md`](./B2b_A_TRANCHE_A_PATTERN_AUDIT.md).  
> Data lettura codice (classificazione): **2026-08-13**. Fonte hit: Biome live (`lint/a11y/*` B2b).

---

## 1. Baseline

Conferma live:

| Regola | Hit |
|----|---:|
| `lint/a11y/useKeyWithClickEvents` | **178** |
| `lint/a11y/noStaticElementInteractions` | **150** |
| `lint/a11y/noLabelWithoutControl` | **42** |
| `lint/a11y/noNoninteractiveElementToInteractiveRole` | **7** |
| `lint/a11y/useAriaPropsSupportedByRole` | **6** |
| `lint/a11y/useSemanticElements` | **6** |
| **Totale** | **389** |

178 + 150 + 42 + 7 + 6 + 6 = **389**.

File unici nel dump live: **167**. Molte locazioni emettono **due** hit (static + key) sullo stesso nodo: i numeri sotto sono **hit Biome**, non locazioni uniche.

---

## 2. Mappa dei pattern

Classificazione sul **nodo segnalato** (attributi dell’elemento alla riga Biome), non sulla sola regola. Due hit sulla stessa riga (static+key) restano due hit dello stesso pattern.

| Pattern | Hit | File | Regole Biome | Rischio | Uniformità | Decisione |
|---|---:|---:|---|---|---|---|
| P1 Modal panel `stopPropagation` | 105 | 64 | static 32 + key 73 | FALSE POSITIVE / LOW-RISK CON CONDIZIONE | Alta (dialog panel) | Non trasformare in button. Vedi contratto P1 |
| P2 Clickable static misto (da splittare) | 68 | 33 | static 36 + key 32 | — (aggregato) | Bassa | **Separare** → §5 / subs P2a–P2k |
| P3 Label senza controllo riconosciuto | 42 | 30 | `noLabelWithoutControl` 42 | MIX (native vs custom) | Bassa | Due contratti; non un unico batch |
| P4 Nested-control `stopPropagation` | 31 | 14 | static 15 + key 16 | REVIEW REQUIRED | Media (stesso handler, host diversi) | Preservare stopProp; non unire a P1 |
| P5 Card cliccabile (open/select) | 25 | 11 | static 12 + key 13 | ARCHITECTURAL / UX | Media | Decisione PO: card=`button` vs inner control |
| P6 Backdrop sibling / nested inset | 24 | 9 | key 12 + static 12 | LOW-RISK CON CONDIZIONE / nested | Media | Estensione A1 solo se overlay è dimmer |
| P7 Hero click / expand | 23 | 5 | static 11 + key 12 | REVIEW REQUIRED | Bassa (lightbox vs expand vs chevron) | Non un contratto unico |
| P8 Overlay root ancora `onClick` (non-A1) | 14 | 8 | static 8 + key 6 | LOW-RISK CON CONDIZIONE | Alta vs A1 | Candidato micro-batch A1-residuo |
| P9 Pointer / drag / hover surface | 13 | 9 | static 12 + key 1 | FALSE POSITIVE / ARCH | Bassa | Non convertire in button |
| P10 Filter-named misto | 9 | 5 | key 5 + static 4 | REVIEW (bucket rumoroso) | Bassa | Redistribuire in P2/P5/P11 |
| P11 List row / sponsor tile | 8 | 2 | static 4 + key 4 | ARCHITECTURAL / UX | Alta in-file | Stesso dilemma della card |
| P12 Role interattivo su host statico | 7 | 7 | `noNoninteractiveElementToInteractiveRole` | REVIEW / possibile intenzionalità | Alta (`nav`+`tablist`) | Non meccanico |
| P13 Dismiss dirty / attempt | 6 | 2 | static 3 + key 3 | ARCHITECTURAL / UX | Alta (A5/A7-attempt) | Classif. 2026-08-13; post-snapshot: attempt **ESEGUITI** (attende ACCETTO PO) — ancora nel **389** ufficiale |
| P14 ARIA props non supportate dal role | 6 | 5 | `useAriaPropsSupportedByRole` | REVIEW REQUIRED | Bassa | Per-file |
| P15 Semantic element (`role=group`/`button`) | 6 | 6 | `useSemanticElements` | REVIEW / FALSE POSITIVE | Media (`group` vs `button`) | Non unire group e button |
| P16 Popover trigger `div` | 2 | 1 | static 1 + key 1 | LOW-RISK CON CONDIZIONE | Unica | `button` se non rompe il ref |

**Somma tabella:** 105+68+42+31+25+24+23+14+13+9+8+7+6+6+6+2 = **389**.

---

## 3. Pattern dettagliati

### P1 — Modal panel `stopPropagation`

- **Regole:** `noStaticElementInteractions`, `useKeyWithClickEvents`
- **Hit / file:** 105 / 64
- **Struttura DOM comune:** overlay (`td-modal-overlay` o `fixed inset-0`) → **pannello** `div` con `onClick={(e) => e.stopPropagation()}` + spesso `role="dialog"` / `max-w-*` / `Z_MODAL*`
- **Handler:** solo `stopPropagation` (non chiude)
- **Comportamento:** click nel pannello **non** deve chiudere il modal
- **Nested:** sì — form, button, input dentro il panel
- **Keyboard già presente:** CloseButton / ESC via hook su molti consumer A1; **non** sul panel
- **Portal:** sì, nella maggioranza (`createPortal` / shell)
- **Uniformità:** alta sulla forma; **non** alta sul fatto che lo stopProp sia ancora load-bearing
- **Rischio meccanico:** se si trasforma il panel in `button`, submit/click/nested controls e semantica dialog si rompono. Se si **rimuove** stopProp su un overlay che ha ancora `onClick` sul parent, il click nel panel chiude il modal.

**Esempio reale — DeleteConfirmation (panel, non overlay):**

`src/components/common/DeleteConfirmationModal.tsx` riga **113** — il portal overlay è già A1 (sibling `<button>` dimmer). Lo stopProp sul dialog è **redundante** rispetto al sibling-button, ma Biome lo segnala comunque.

```113:117:src/components/common/DeleteConfirmationModal.tsx
      <div
        className={`${containerShell} max-w-sm ${MODAL_DIALOG_FOCUS} ${config.borderClass}`}
        style={{ zIndex: zIndex ?? Z_MODAL_NESTED }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
```

**Esempio reale — A1 shell (2 hit residui già noti fuori contratto A1):**

`src/components/modals/shell/BaseFullscreenModalShell.tsx` righe **93–102** — stesso panel stopProp; overlay dismiss è già sibling `<button>` (righe 85–91).

**Esempio reale — stopProp ancora load-bearing (overlay parent con onClick):**

`src/components/features/diary/packing_list/suitcase/AiSuggestionsModal.tsx` riga **308** (panel) + overlay riga **303** `onClick={handleDismiss}` — qui togliere lo stopProp **chiude** il modal al click nel panel.

**Classificazione:** **FALSE POSITIVE / INTENZIONALITÀ** quanto a “manca la tastiera sul panel”. **LOW-RISK MA CON CONDIZIONE** quanto a *rimozione* dello stopProp: solo se l’overlay è già A1 (sibling button, nessun `onClick` sul parent).

---

### P2 — Clickable static misto (68) — aggregato da splittare

Non è un pattern unico. Sottogruppi letti sul codice (somma **68**):

| Sub | Hit | File | Cosa fa | Classificazione |
|---|---:|---:|---|---|
| P2a Selectable surface | 20 | 10 | click riga/tile per select/edit/open | ARCH / UX |
| P2b DnD + click | 10 | 4 | riga con drag **e** onClick | ARCH / UX |
| P2c Media open | 8 | 4 | click thumb → lightbox/zoom | ARCH / UX |
| P2d Upload zone | 6 | 3 | dashed box → `input[type=file].click()` | LOW-RISK CON CONDIZIONE |
| P2e Expand/collapse | 6 | 3 | accordion header | LOW-RISK CON CONDIZIONE |
| P2f DnD only | 5 | 3 | drag/drop **senza** onClick | FALSE POSITIVE da verificare |
| P2g Conditional click | 4 | 2 | `aria-disabled` / readOnly title | LOW-RISK CON CONDIZIONE |
| P2h Icon stop-in-field | 4 | 1 | clear date in DiaryHeaderDateRange | REVIEW (nested in input) |
| P2i Sort header | 2 | 1 | click colonna sort | LOW-RISK CON CONDIZIONE |
| P2j Dropdown backdrop | 2 | 1 | ItinerariesExplorer menu dismiss | LOW-RISK CON CONDIZIONE (vicino P6) |
| P2k contentEditable | 1 | 1 | NewsTicker rich line | FALSE POSITIVE / intenzionale |

#### Esempi reali

**P2f DnD only** — `AdminItineraryEditor.tsx` **612**: `div` draggable, **nessun** onClick. Biome `noStaticElementInteractions` per `onDragStart`, non per un controllo click.

```612:616:src/components/admin/AdminItineraryEditor.tsx
                  <div
                    key={poi.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, poi)}
                    className="bg-slate-800 p-3 rounded-lg border border-slate-700 cursor-grab active:cursor-grabbing hover:border-indigo-500 transition-colors group"
```

**P2a Selectable** — `AdminSocialStudio.tsx` **181**: riga template `onClick={() => handleSelectTemplateWrapper(t)}` con highlight di selezione. Contiene controlli discendenti nel group.

**P2d Upload** — `EditorMedia.tsx` **430** / `SponsorForm.tsx` **517** / `BusinessShopManager.tsx` **238**: `div` dashed `onClick` → `fileInputRef.current.click()`, con guard busy su BusinessShop.

**P2g Conditional** — `AiFieldHelper.tsx` **140**: header `onClick={handleHeaderClick}` + `aria-disabled={aiBlocked}` + `cursor-not-allowed`. Trasformare in `button` senza preservare la guard cambia UX.

**P2k** — `NewsTickerManager.tsx` **166**: `div contentEditable` con `onKeyDown` già presente. Non è un click-control mancante di tastiera.

---

### P3 — Label senza controllo riconosciuto (42)

- **Regola:** `noLabelWithoutControl` only
- **File:** 30
- **Non è un unico comportamento.** Lettura contestuale:

**P3a — Label visivo + controllo nativo sibling senza `htmlFor`/`id`**  
Esempio (fotografia 2026-08-13): `AdminItineraryEditor.tsx` **546–552** (`<label>Autore</label>` poi `<input>` sibling). Stesso schema **558** textarea Descrizione.  
Meccanico: `htmlFor` + `id`. Non cambia UX se gli id sono stabili.  
**Post-snapshot (2026-08-16):** C-P3a **ESEGUITO + ACCETTO PO** su Autore/Descrizione + Preferred Partners (`GlobalSuggestionsTab`) — **ancora** nei **42** / **389** ufficiali fino a nuovo snapshot.

**P3b — Label usato come heading di un gruppo di `<button>`** (htmlFor non applicabile)  
Esempio: `AdminGamification.tsx` **702–709** “Tipo Partner” sopra due button Interno/Partner.  
Già riclassificati A→B in Tranche A: `ImportOsmModal.tsx` **225** (categorie), `AiPlannerForm.tsx` **355** (Durata Viaggio chips).  
Altri dello stesso tipo: `ExportModal.tsx` **923** / **940** (Formato / Opzioni), `PoiInfoTab.tsx` **155** (Livello Interesse Turistico → tre button).

**P3c — Label accanto a widget custom (non input)**  
- `BooleanToggle.tsx` **15–16**: `<label>{label}</label>` + `<button>` toggle sibling.  
- `FilterSelect.tsx` **58** / `MultiFilterSelect.tsx` **55**: label floating `pointer-events-none` sopra un `<button>` custom select (non `<select>` nativo).  
- `FormFieldHelper.tsx` **32**: label del field wrapper; il controllo è `children` più sotto, non discendente del `<label>`.  
- `NewsTickerManager.tsx` **406**: “Testo Notizia” + `RichTextInput` (non nativo).  
- `CollaborationShareWizard.tsx` **249**: “Cerca utente” + componente search custom.

**Classificazione:** P3a **LOW-RISK / STANDARDIZZABILE**. P3b/P3c **ARCHITECTURAL / UX** (fieldset/legend, `aria-labelledby`, o lasciare heading). **Non** unire in un batch htmlFor.

---

### P4 — Nested-control `stopPropagation` (non panel modal)

- **Hit / file:** 31 / 14
- **Struttura:** wrapper `div onClick={e => e.stopPropagation()}` intorno a badge, like, qty stepper, popover panel, trigger chrome — **dentro** una card/hero già cliccabile
- **Comportamento:** il click sul controllo interno **non** deve attivare l’open della card parent
- **Nested:** sì, per definizione
- **Uniformità:** stesso handler, host diversi (card city, hero, shop, suitcase qty, HeaderPopover)

**Esempio:** `CityCard.tsx` **179** — shield sul cluster azioni, mentre la card intera è cliccabile a riga **142**.

```179:179:src/components/city/CityCard.tsx
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
```

**Esempio:** `HeroAiModule.tsx` **104** e **135** — shield sul titolo/banner perché il parent **113** fa `toggleExpanded`.

**Esempio:** `AnchoredPopover.tsx` **88** — panel portaled `Z_POPOVER` + stopProp + `role={role}` + `aria-modal={false}` (quest’ultimo è anche P14).

**Esempio:** `HeaderPopover.tsx` **150** — panel stopProp (il trigger è P16 riga **165**).

**Classificazione:** **REVIEW REQUIRED**. Lo stopProp è load-bearing. Convertire lo shield in `button` è sbagliato. Rimuoverlo fa aprire la card. Un eventuale contratto è “inner controls = `button` nativi + stopProp sull’handler del button”, non sul wrapper.

---

### P5 — Card cliccabile

- **Hit / file:** 25 / 11
- **Struttura:** contenitore `div`/`h3`/`h4` `onClick` → naviga / apre dettaglio / seleziona
- **Nested:** spesso sì (P4 vive dentro queste card)
- **Esempi:**
  - `CityCard.tsx` **142** `onClick={() => onClick(city.id)}` — contiene ImageWithFallback, badge, e P4 shield
  - `ItinerariesList.tsx` **53** select itinerary
  - `ShopCard.tsx` **39** open shop + P4 su **73**
  - `ShowcaseCards.tsx` **138** / **218** — card **anche** `draggable` (P2b affine)
  - `DiaryResourceCard.tsx` **62** — `h4 onClick` nome POI
  - `ItineraryItemCard.tsx` **605** click-to-edit note vs **615** `h4` open detail — due hit, due intenti

**Classificazione:** **ARCHITECTURAL / UX DECISION REQUIRED**. `div`→`button` cambia CSS (`w-full` vs button UA), nesting (button-in-button vietato: CityCard ha inner buttons), drag, e semantica lista vs card.

---

### P6 — Backdrop sibling / nested inset dismiss

- **Hit / file:** 24 / 9
- **Struttura:** `absolute inset-0` o `fixed inset-0` con `onClick` close/toggle — **non** sempre `td-modal-overlay`
- **Comportamento:** click dimmer chiude nested overlay / lightbox / drawer
- **Nested modal:** sì (AiItineraryModal quota/warning/error; SuggestionReview rejection; PreviewHero desc)

**Esempi:**
- `AiItineraryModal.tsx` **185** / **244** / **285** — nested `absolute inset-0` `Z_MODAL_NESTED` chiude alert
- `ShopPage.tsx` **237** lightbox `Z_LIGHTBOX`; **299** planner dimmer mobile `Z_OVERLAY_BACKDROP`
- `CommsTemplates.tsx` **406** `fixed inset-0 z-admin-modal` preview dismiss
- `SuitcaseSidePanel.tsx` **60** — **non** è un dimmer modal: `onClick={onToggle}` su inset per aprire/chiudere side panel
- `OnboardingWizard.tsx` **262** — root `fixed inset-0` `Z_OVERLAY` con onClick condizionale

**Classificazione:** **LOW-RISK MA CON CONDIZIONE** per i dimmer nested (estendere A1: sibling `<button>`). **REVIEW** per SuitcaseSidePanel e Onboarding (non sono lo stesso contratto dismiss).

P2j (`ItinerariesExplorer.tsx` **81**, 2 hit) è lo stesso gesto (backdrop chiude menu) e va contato con P6 in un eventuale batch, **non** è già in questi 24.

---

### P7 — Hero click / expand

- **Hit / file:** 23 / 5 (`LiveFeedHero`, `HeroAiModule`, `HeroFilterModule`, `PreviewHero`, `ShopHero`)
- **Non uniforme:**
  - `LiveFeedHero.tsx` **38** — hero `cursor-zoom-in` apre lightbox; riga **86** è P4 shield
  - `HeroAiModule.tsx` **113** / **141** — `toggleExpanded`; **123** / **152** chevron con `stopPropagation` + stesso toggle
  - `PreviewHero.tsx` **91** — `<p onClick>` (già A→B in Tranche A: duplica Info button)
  - `ShopHero.tsx` **52** — surface click

**Classificazione:** **REVIEW REQUIRED**. Expand vs lightbox vs testo duplicato non condividono un contratto.

---

### P8 — Overlay root ancora `onClick` (A1 non applicato)

- **Hit / file:** 14 / 8
- **Struttura:** `td-modal-overlay` + `onClick={onCancel|handleDismiss|onStop}` sul **root**, non sul sibling button
- **Esempi:** `AiSuggestionsModal.tsx` **303**, `AssociationConfirmationModal.tsx` **59**, `LinkSuitcaseModal.tsx` **86**, `UnsavedChangesModal.tsx` **50**, `LimitWarningModal.tsx` **26**, `UserWalletTab.tsx` **96**, `UserPhotoEditor.tsx` **212** (`Z_POPOVER` — attenzione stacking), `InAppCameraCapture.tsx` **186**

**Classificazione:** **LOW-RISK MA CON CONDIZIONE** — è il contratto A1 già ACCETTATO, ma questi consumer non l’hanno ancora. Condizioni: dirty/busy (alcuni `handleDismiss`), z-index (`Z_POPOVER` vs `Z_OVERLAY`), nested confirm.

**Non** è P13: qui l’handler è close diretto, non `handleCloseAttempt`.

---

### P9 — Pointer / drag / hover surface

- **Hit / file:** 13 / 9
- **Handler:** `onMouseDown`/`Move`/`Wheel`/`Pointer`/`MouseEnter` — **non** un click-button
- **Esempi:** `AdminPhotoInspector.tsx` **394** pan/zoom; `DraggableSlider.tsx` **128**; `OnboardingVisualEditor.tsx` **310/347/388/403** drag target; `CategorySuggestionPanel.tsx` **114** hover keep-open; `SuitcaseCard.tsx` **121** `onMouseEnter={onSelect}`

**Classificazione:** **FALSE POSITIVE / INTENZIONALITÀ DA VERIFICARE**. Convertire in `button` rompe drag e hover-intent. Keyboard non è il gesto.

---

### P10 — Bucket “filter” rumoroso (9)

Il filename ha innescato il bucket. Comportamenti reali:

| File | Riga | Hit | Comportamento reale | Va con |
|---|---:|---:|---|---|
| `TabMedia.tsx` | 429 | 2 | upload dashed (clone di EditorMedia) | P2d |
| `SponsorTable.tsx` | 297 | 1 | `h3 onClick` titolo | P5 |
| `QaForumTab.tsx` | 454 | 2 | riga post → `setSelectedPost` | P2a / P5 |
| `CityEventsTab.tsx` | 133 | 2 | accordion expand | P2e |
| `UserNotificationsTab.tsx` | 237 | 2 | riga notifica | P2a |

**Classificazione:** non contrattualizzare come “filter chip”. Redistribuire prima del batch.

---

### P11 — List row / sponsor tile

- **Hit / file:** 8 / 2
- `Sidebar.tsx` **352 / 676 / 772** — tile sponsor `onClick={() => openModal('poiDetail', { poi: sponsorPoi })}` (3 loc × 2 regole = 6). Stesso file ha anche drag handle P2b (**704 / 796**).
- `PreviewSidebar.tsx` **55** — riga città `onSelectCity`

**Classificazione:** **ARCHITECTURAL / UX** (stesso dilemma P5). Uniforme **in-file** Sidebar, non con PreviewSidebar (select vs open modal).

---

### P12 — Role interattivo su host statico (7)

- **Regola:** `noNoninteractiveElementToInteractiveRole`
- **5/7** sono ` <nav role="tablist"> ` + figli `<button role="tab">`:
  - `MySpaceRootNav.tsx` **19**
  - `ViaggioFolderShell.tsx` **217**
  - `WorkspaceSectionNav.tsx` **23**
  - `WorkspaceViaggioShellNav.tsx` **61**
  - `AllegatiSection.tsx` **46**
- `WorkspacePickElementStep.tsx` **56**: `<ul role="radiogroup">` (i radio sono button in `CompositionSelectableRow`)
- `MySpaceFavoritesRoot.tsx` **570**: `role="listbox"` su container suggerimenti

**Esempio:**

```13:21:src/components/myspace/MySpaceRootNav.tsx
  <nav
    className="
      flex lg:grid lg:grid-cols-5
      border-b border-slate-800 bg-slate-950/80 shrink-0 overflow-x-auto lg:overflow-visible
      min-w-0
    "
    role="tablist"
    aria-label="Sezioni MySpace"
  >
```

Biome considera `nav`/`ul` non-interactive. Il pattern tabs è intenzionale (WAI-ARIA). Togliere `tablist` perde il composite; spostarlo su `div` è cosmetico a11y.

**Classificazione:** **FALSE POSITIVE / INTENZIONALITÀ DA VERIFICARE** per i 5 tablist; **REVIEW** per listbox/radiogroup.

---

### P13 — Dismiss dirty / attempt (6)

Inventario Tranche A: esclusi dalla **low-risk A**. Classificazione sotto = fotografia **2026-08-13** (ancora nei **389** ufficiali).

**Post-snapshot (2026-08-15):** A5-attempt / A7-attempt **ESEGUITI** in codice (forma A1 + handler attempt); **attende ACCETTO PO** file definitivi. **Non** sottrarre questi hit dal **389** finché non c’è un nuovo snapshot.

| File | Righe (snapshot) | Hit | Gesto (al 2026-08-13) |
|---|---|---:|---|
| `AdminPoiModal.tsx` | 137 | 2 | sibling `absolute inset-0` `onClick={handleCloseAttempt}` |
| `ReviewModal.tsx` | 210 | 2 | overlay root `onClick={handleCloseAttempt}` |
| `ReviewModal.tsx` | 216 | 2 | nested overlay `onClick={() => setShowConfirmClose(false)}` |

`ReviewModal.tsx` nested confirm (snapshot **216**): fuori contratto A1; comportamenti PO congelati preservati nell’esecuzione attempt.

**Classificazione (al momento audit):** **ARCHITECTURAL / UX**. Stato operativo attempt: **ESEGUITI — attende ACCETTO PO** (SoT: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md)).

---

### P14 — ARIA props non supportate dal role (6)

| File | Riga | Nodo | Issue reale |
|---|---:|---|---|
| `PlatformControlTabBanner.tsx` | 29 | `<header aria-labelledby=...>` | `aria-labelledby` su `header` |
| `compositionSelectableRow.tsx` | 53 | `<button role="radio\|checkbox" aria-checked>` | button+role widget |
| `AnchoredPopover.tsx` | 88 | `div` + `aria-modal={false}` | `aria-modal` non del role di default |
| `HorizontalScrollStrip.tsx` | 67 | `div role={tablist?}` + `aria-label` | role condizionale |
| `SuitcaseItemRow.tsx` | 175, 201 | `<button aria-checked>` | checkbox semantics su button |

**Classificazione:** **REVIEW REQUIRED**. Nessun contratto unico. `compositionSelectableRow` è legato a P12 radiogroup.

---

### P15 — `useSemanticElements` (6)

| File | Riga | Role | Note |
|---|---:|---|---|
| `CategorySection.tsx` | 87 | `role="group"` su div di 2 button up/down | candidato `fieldset` o lasciare |
| `SuitcaseToolbarGroup.tsx` | 32 | `role="group"` | idem |
| `SuitcaseItemRow.tsx` | 238 | `role="group"` qty | idem; wrapper ha anche stopProp (P4) |
| `ReviewModal.tsx` | 347 | `role="group"` stelle | button figli già nativi |
| `SuitcaseCard.tsx` | 234 | `role="button"` + tabIndex + onKeyDown | **già** keyboard; Biome chiede `<button>` nativo — inner overlay delete è `button` (nesting) |
| `TemplateRow.tsx` | 199 | stesso di SuitcaseCard | stesso vincolo nesting |

**Classificazione:** `group` → **LOW-RISK MA CON CONDIZIONE** o intenzionale. `role="button"` su card con inner buttons → **ARCHITECTURAL** (non si può fare `<button>` wrapping `<button>`).

---

### P16 — Popover trigger

`HeaderPopover.tsx` **165**: `<div ref={triggerRef} onClick={handleToggle} className="cursor-pointer">`.

**Classificazione:** **LOW-RISK MA CON CONDIZIONE** (`button` + preservare `ref`/aria-expanded). Non unire al panel P4 riga 150.

---

## 4. Contratti candidati di bonifica

**Non applicati.**

### Contratto C-P1 — Panel stopProp

- **Ammesso:** overlay A1 (sibling `<button>` dimmer) + `div role="dialog"` **senza** onClick.
- **Da trasformare:** solo *rimozione* di `onClick={e => e.stopPropagation()}` quando il parent overlay **non** ha onClick.
- **Preservare:** click nel panel non chiude; nested controls; ESC/CloseButton; z-index panel (`Z_MODAL` locale all’overlay).
- **NON:** `div`→`button`; nuovi z-index; togliere stopProp se l’overlay è ancora P8.

### Contratto C-P8 — A1 residuo overlay root

- Identico ad **A1 già ACCETTATO**: `td-modal-overlay` senza onClick; sibling `<button type="button" tabIndex={-1} aria-hidden>` `absolute inset-0` chiama lo stesso handler.
- Preservare handler (`onCancel` / `handleDismiss` / `onStop`), z-index esistente, portal.
- **NON** applicare a P13 (attempt/dirty) né a overlay con z-index fuori contratto senza review (`UserPhotoEditor` `Z_POPOVER`).

### Contratto C-P3a — Label nativo sibling

- Struttura da: `<label>X</label><input>`  
- Struttura a: `<label htmlFor={id}>` + `id` stabile sullo stesso input/textarea/select.
- **NON** applicare a button-group / custom widget / RichTextInput.
- **Stato (2026-08-16):** micro-batch C-P3a **ESEGUITO + ACCETTO PO** su 3 loc (Autore/Descrizione `AdminItineraryEditor`; Preferred Partners `GlobalSuggestionsTab`). **Ancora contato** nel **42** / **389** dello snapshot ufficiale fino a riconciliazione Biome.

### Contratto C-P2d — Upload zone

- `div` dashed → `<button type="button">` che chiama `inputRef.click()`, **oppure** `<label htmlFor={fileId}>` wrapping the zone + `input type="file" id hidden`.
- Preservare guard busy/uploading, accept, multiple.
- **NON** innestare button in label e anche onClick duplicato.

### Contratto C-P2e — Expand/collapse header

- Header accordion → `<button type="button" aria-expanded>` stesso handler.
- Preservare stato expanded; **NON** wrappare l’intera card se contiene inner buttons (P4).

### Contratto C-P2i — Sort header

- `div onClick={handleSort}` → `<button type="button">`.
- Preservare `sortKey` / `sortDir` / indicatori.

Nessun altro pattern ha un contratto comune abbastanza stretto da congelare senza PO.

---

## 5. Pattern da separare

| Non unire | Perché |
|---|---|
| P1 vs P4 vs P8 | P1 shield panel; P4 shield inner-control; P8 dismiss overlay. Stesso `onClick` Biome, tre gesti. |
| P6 vs P8 vs P13 | Dimmer nested vs overlay root vs dirty-attempt. |
| P5 vs P11 vs P2a | Card vs list vs “riga select” — nested controls e navigazione diversi. |
| P2b vs P2f vs P9 | Click+drag vs solo drag vs pan/hover. |
| P3a vs P3b/P3c | htmlFor funziona solo sul nativo. |
| P7 lightbox vs expand vs PreviewHero `<p>` | Tre UX. |
| P15 `group` vs `role=button` | fieldset ≠ native button; nesting. |
| P12 tablist vs listbox vs radiogroup | Tre ruoli. |
| P10 | Bucket strumentale, non comportamentale. |
| SuitcaseCard/TemplateRow vs CityCard | I primi hanno già keyboard+role=button; CityCard no, ma ha inner buttons. |

---

## 6. Pattern che richiedono PO / review

Solo quelli dove la correzione **cambia** UX/semantica/focus:

1. **P13** A5/A7-attempt — low-risk A esclusi; codice attempt **ESEGUITO** (2026-08-15), **attende ACCETTO PO**; ancora nel **389** ufficiale.
2. **P5 / P11 / P2a** — card/row cliccabile con inner buttons (button-in-button).
3. **P15** SuitcaseCard / TemplateRow — `role="button"` con delete overlay nativo.
4. **P3b / P3c** — label-heading su chip/button (incluso ImportOsm / AiPlanner già A→B).
5. **P7** PreviewHero `<p onClick>` (A→B) e hero expand vs lightbox.
6. **P12** se si vuole tabs nativi vs `role=tablist` su `nav`.
7. **P8** `UserPhotoEditor` / `InAppCameraCapture` a `Z_POPOVER` — stacking, non solo a11y.
8. **P2h** DiaryHeaderDateRange clear-icon nested in campo data.

---

## 7. Proposta di micro-batch (stato operativo)

> Contatori ufficiali restano **389** fino a nuovo snapshot. Non usare hit «stimati» come SoT.

| Batch | Scope | Stato | Note |
|---|---|----|----|
| **B2b C-P3a** | htmlFor+id su 3 label nativi | **ESEGUITO + ACCETTO PO** (2026-08-16) | **Non** riconciliato nel **389** / **42** |
| **A5/A7-attempt** (P13 subset) | AdminPoiModal / ReviewModal | **ESEGUITO** (2026-08-15); **attende ACCETTO PO** | **Non** riconciliato nel **389** |
| B2b-P8 | Overlay root → A1 (escludere P13 e z-popover) | candidato | Contratto C-P8 |
| B2b-P1-redundant | stopProp panel solo dove overlay già A1 | candidato | Verifica per-file |
| B2b-P3a residuo | altri label nativi P3a (oltre i 3 chiusi) | candidato | Solo dopo censimento post-snapshot |
| B2b-P2d | Upload dashed → label/button | candidato | C-P2d |
| B2b-P2e+P2i | Accordion + sort header | candidato | C-P2e/i |
| B2b-P13 nested / altro dirty | nested confirm / residui attempt | candidato | Solo dopo ACCETTO attempt + PO |
| B2b-card-row | P5/P11/P2a | candidato | Architettura card |
| B2b-aria | P12/P14/P15 | candidato | Non meccanico |

P9 / P2f / P2k: **non** mettere in un batch “click→button”. **Non** aprire B2c qui.

---

## 8. Residui non ancora contrattualizzabili

Elenco esplicito (hit già nel 389; **nessun** contratto comune):

- P2a selectable surface (20) — salvo decisione card
- P2b DnD+click (10)
- P2c media open (8)
- P2f DnD only (5)
- P2g conditional (4) — guard dedicata
- P2h DiaryHeaderDateRange (4)
- P2k contentEditable (1)
- P3b/P3c labels custom (resto di 42 snapshot; C-P3a 3 loc già eseguite ma non riconciliate)
- P4 nested stopProp (31) — serve redesign inner-as-button, non wrapper
- P5 cards (25)
- P6 non-dimmer (SuitcaseSidePanel, Onboarding) + nested alerts AiItinerary
- P7 hero (23)
- P9 pointer (13)
- P10 da redistribuire (9) — poi ricadono sopra
- P11 (8)
- P12 (7)
- P13 (6)
- P14 (6)
- P15 role=button cards (2 dei 6) + group (4) da decidere
- P16 (2) — contrattualizzabile in isolata ma 1 file

---

## 9. Riconciliazione finale

### Per regola Biome (SoT)

178 + 150 + 42 + 7 + 6 + 6 = **389**

### Per pattern tabella §2

105+68+42+31+25+24+23+14+13+9+8+7+6+6+6+2 = **389**

### Split interno P2 (68)

20+10+8+6+6+5+4+4+2+2+1 = **68**

### Contabilità ufficiale vs post-snapshot

I totali **389** sopra sono lo **snapshot SoT 2026-08-13**. Eventi successivi (A5/A7-attempt ESEGUITI; C-P3a ESEGUITO/ACCETTATO) **non** modificano questi conti finché non c’è un nuovo snapshot Biome. Questo file di audit **non** è una dashboard live e **non** inventa un residuo «dopo C-P3a».

La Parte A (overlay Delete Confirmation Admin) resta **fuori** dal perimetro classificato dei 389.

---

## Appendice — file P1 (105) nota operativa

P1 è il cluster più grande e coincide in larga parte con il debito **esplicitamente lasciato fuori da A1** (panel stopPropagation). Molti file P1 hanno **anche** P8 sullo stesso modal (overlay+panel = 2–4 hit). Un batch P8+P1-redundant sullo stesso file è più sicuro di due passaggi distanti, **ma** solo dopo verifica che l’overlay non sia P13.
