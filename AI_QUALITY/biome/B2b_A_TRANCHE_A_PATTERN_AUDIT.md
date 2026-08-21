# B2b — Tranche A — Pattern Audit

Questo file è l’**audit/piano operativo della Tranche A** (inventario di classificazione A). **Non** è la dashboard numerica live di progetto né il residuo B2b corrente.

- Inventario Tranche A (hit/loc/file A): **123 / 69 / …** — numeri di **questo** documento.
- Residuo B2b **corrente** e snapshot progetto: **solo** [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md).
- Audit originario classificazione A: **2026-08-08**.
- Checkpoint **nominato** Tranche A (post-esecuzione low-risk): **2026-08-09** · progetto **1316** · B2b **431**.
- **ACCETTO PO tranche low-risk A:** **2026-08-15** (A2–A7* esclusi attempt; **114** hit già in codice — nessuna ripresa codice).
- Snapshot live **corrente** (**2026-08-13**): progetto **1213** · B2b **389** · E**745** / W**468** · file **414** · categorie vive **27** — cifre della SoT, **non** dell’inventario A. Non è una nuova Tranche A.
- Scope: classe **A** (e riclassificazioni emerse in affinamento)
- Totale hit A iniziali (classificazione rischio 2026-08-08): **123**
- Stato: **A1 ACCETTATO PO** · **tranche B2b low-risk A ACCETTATA PO / CHIUSA** (2026-08-15) · **A5-attempt ESEGUITO — attende ACCETTO PO** (`AdminPoiModal`) · **A7-attempt ESEGUITO — attende ACCETTO PO** (`ReviewModal`)
- Fonte inventario: Biome + rilettura codice al 2026-08-08 (classificazione); esecuzione low-risk 2026-08-09; ACCETTO PO low-risk 2026-08-15; esecuzione A5/A7-attempt 2026-08-15 (attende ACCETTO PO file)
- **Nota «Tranche A»:** la **low-risk A** (A1 + A2–A7* esclusi attempt) è **ACCETTATA PO e chiusa**. A5/A7-attempt sono lavorazione **successiva/collegata**: codice **ESEGUITO**, **non** ancora ACCETTATO PO. Residuo B2b numerico ufficiale = SoT [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md) snapshot **389** (non questo file).
- Cluster: B2b click/static · B2b labels · (ARIA/semantic: 0 hit A)
- Schede `B_a11y_*` accettate: **non modificate**.

### Stato esecuzione micro-batch

| Micro-batch | Stato | Note |
|----|----|----|
| A1 shell | **ACCETTATO PO** | Overlay bonificato; **2 hit residui** sul panel `stopPropagation` = debito B2b **fuori contratto A1** (non corretti) |
| A2 · A3 · A4 · A5-auth · A6 | **ACCETTATO PO** (2026-08-15) | Contratti congelati già in codice; nessuna ripresa |
| A7-presentation · A7-direct · A7-busy · A7-days · A7-target | **ACCETTATO PO** (2026-08-15) | 0 eccezioni di pattern; A7-direct **84 hit / 42 loc / 40 file** |
| A5-attempt | **ESEGUITO** (2026-08-15) | `AdminPoiModal.tsx` — DOM A1 + `handleCloseAttempt`; **attende ACCETTO PO** file definitivo |
| A7-attempt | **ESEGUITO** (2026-08-15) | `ReviewModal.tsx` — DOM A1 + handler attempt; **attende ACCETTO PO** file definitivo |
| PreviewHero / A→B | **Non eseguiti** | Fuori A |

---

## 0. Controllo riconciliazione (hit Biome)

| Metrica | Valore |
|----|---:|
| A iniziali | **123** |
| A ancora A (in micro-batch sotto) | **120** |
| A → B (riclassificati) | **3** |
| A → C | **0** |
| A → D | **0** |
| Hit senza classificazione | **0** |
| Somma check | 120 + 3 = **123** |

`A ancora A` = restano classificazione **A** nell’inventario (non riclassificati). **Non** significa «ancora da eseguire»: A1 overlay **2** (ACCETTATO PO) + low-risk eseguiti **114** + attempt inventario **4** = **120**. Degli attempt: A5 (**2**) e A7 (**2**) = **ESEGUITI — attende ACCETTO PO** (codice già in tree; non «da implementare»).

### Locazioni

| Metrica | Valore |
|----|---:|
| Locazioni A iniziali | **69** |
| Locazioni ancora A | **66** |
| Locazioni A→B | **3** |
| Somma check loc | 66 + 3 = **69** |
| Pair key+static (set A iniziale) | **54** |

### Riclassificazioni esplicite

| File | Riga | Cat. | Vecchia | Nuova | Motivo |
|----|---:|----|----|----|----|
| `src/components/admin/import/ImportOsmModal.tsx` | 225 | labels | A | **B** | Label su griglia `<button>` categorie — non controllo nativo |
| `src/components/aiPlanner/AiPlannerForm.tsx` | 355 | labels | A | **B** | Label “Durata Viaggio” su chip `<button>` — non nativo |
| `src/components/modals/sectionPreview/PreviewHero.tsx` | 91 | key | A | **B** | `<p onClick>` duplica Info `<button>` sibling: scegliere se mantenere doppio controllo o rimuovere click sul testo è decisione UI/UX |

---

## Definizione operativa di «basso rischio»

Un micro-batch è **basso rischio** solo se:

- intento già inequivocabile;
- nessuna nuova interazione / nessun cambio UX;
- nessun cambio stato/layout/z-index/timing/propagazione oltre la forma DOM del nodo dismiss;
- nessun cambio business logic (stesso handler);
- nessuna decisione di prodotto;
- smoke test semplice prima/dopo.

---

## CONTRATTO DI BONIFICA CONGELATO — A1 (shell)

**File:** `src/components/modals/shell/BaseFullscreenModalShell.tsx` · overlay riga **79**.

### Contesto PRE-A1 (storico) vs codice live POST-ACCETTO

**Prima di A1** l’overlay aveva `onClick={closeOnOverlayClick ? onClose : undefined}` sul `<div>`.

**Codice live dopo ACCETTO PO A1 (2026-08-09)** — allineato al contratto sotto:

- Overlay: `<div className="td-modal-overlay …" style={{ zIndex: Z_OVERLAY }} role="presentation">` — **senza** `onClick`
- Se `closeOnOverlayClick`: primo figlio = `<button type="button" tabIndex={-1} aria-hidden="true" className="absolute inset-0 …" onClick={onClose} />`
- Panel figlio: `onClick={(e) => e.stopPropagation()}` · `zIndex: Z_MODAL` — **fuori scope A1** (shield = D; **2 hit** key+static residui, non corretti da A1)
- ESC: `useGlobalModalEscape(isOpen, onEscape ?? onClose)` — invariato
- CloseButton: `withEscape={false}` — ESC solo dallo stack globale
- Panel: **nessun** `role="dialog"` — **non** introdotto da A1
- Focus trap / ModalManager / FocusOverlay / z-index registry: **non** toccati

### Perché non basta `role="presentation"` da solo

Alcuni modal live hanno già `role="presentation"` sull’overlay **e** restano segnalati da `noStaticElementInteractions` (es. `RecommendedSuitcaseModal.tsx:258`). Quindi presentation da sola **non** è una soluzione Biome-completa né un contratto sufficiente.

### Soluzione unica congelata (semanticamente motivata)

Il dismiss-by-click sul backdrop è un’agevolazione **mouse-only**. La via tastiera/SR resta **ESC** + **CloseButton** (già nello shell). Il backdrop non deve diventare un controllo nel tab order.

**Modifica esatta sull’overlay shell:**

1. **Rimuovere** `onClick={…}` dal `<div>` overlay.
2. **Aggiungere** `role="presentation"` sul `<div>` overlay (contenitore presentazionale / layout flex).
3. **Se** `closeOnOverlayClick === true`, **inserire come primo figlio** dell’overlay (sibling del panel, sotto di esso nello stacking):

```tsx
<button
  type="button"
  tabIndex={-1}
  aria-hidden="true"
  className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent p-0"
  onClick={onClose}
/>
```

4. Il panel mantiene `className` con `relative` (già presente) e `style={{ zIndex: Z_MODAL }}` così resta **sopra** il button dismiss.
5. Se `closeOnOverlayClick === false`: **nessun** button dismiss (come oggi: nessun onClick).

### Attributi / nodi da NON modificare

- Panel: markup, `stopPropagation`, z-index, children, CloseButton
- `useGlobalModalEscape` / `onEscape`
- `padding`, `overlayClassName`, `MAX_WIDTH_*`, portal target
- z-index registry (`Z_OVERLAY` / `Z_MODAL`)
- Nessun nuovo `role="dialog"` sul panel in questo micro-batch
- Nessun `tabIndex={0}` sul dismiss (vietato: creerebbe focus keyboard sul backdrop)
- Nessun `onKeyDown` sul backdrop (ESC è già globale)

### Comportamenti da preservare

| Comportamento | Preservato come |
|----|----|
| Click area dimmer (fuori panel) | `button` dismiss → `onClose` |
| Click panel | panel sopra il button; `stopPropagation` invariato |
| ESC | `useGlobalModalEscape` invariato |
| `closeOnOverlayClick={false}` | nessun button dismiss |
| Aspetto visuale | button trasparente `absolute inset-0`; nessun cambio className overlay oltre eventuale `relative` se necessario al containing block |

### Perché non introduce una nuova interazione

- `tabIndex={-1}` + `aria-hidden="true"`: fuori tab order e nascosto ad AT
- Stesso `onClose` già usato dall’overlay
- Nessun nuovo shortcut tastiera

### Perché rischio basso

- Un solo file; contratto riusabile; smoke chiaro; nessuna business logic.

### Hit A1

| Hit | Loc | File |
|---:|---:|---:|
| 2 (key+static) | 1 | 1 |

**Decisione A1:** **ACCETTATO PO** (2026-08-09) — codice definitivo mantenuto. Residuo panel (key+static) **non** incluso nell’ACCETTO A1.

---

## Micro-batch A2 — Label native `htmlFor` / `id`

**Autorizzabilità storica del pattern:** AUTORIZZABILE — BASSO RISCHIO.  
**Stato operativo corrente:** **ACCETTATO PO** (2026-08-15; parte di low-risk A).

Tutti e 5 i casi rimanenti sono: label nativa + controllo nativo + associazione meccanica. Nessun altro codice obbligatorio oltre id/htmlFor.

| Locazione | id proposto | Controllo | Rischio id duplicato | Altro codice |
|----|----|----|----|----|
| `NewsTickerManager.tsx:327` | `fld-news-ticker-speed` | `<input type="range">` | Basso (pagina admin isolata) | Solo id/htmlFor |
| `SponsorModals.tsx:295` | `fld-sponsor-extension-days` | `<input type="number">` sotto i chip (chip restano button indipendenti) | Basso | Solo id/htmlFor sulla label “Giorni da aggiungere” |
| `AiPlannerForm.tsx:358` | `fld-ai-planner-custom-days` | `<input type="number">` “ALTRO” | Basso | Solo id/htmlFor (label Durata Viaggio resta B) |
| `SponsorForm.tsx:473` | `fld-sponsor-form-description` | `<textarea>` descrizione | Basso | Solo id/htmlFor |
| `SponsorForm.tsx:507` | `fld-sponsor-form-cover` | `<input type="file" className="hidden">` dentro dropzone | Basso | Solo id/htmlFor; dropzone `onClick` **non** toccato in A2 |

| Hit | Loc | File |
|---:|---:|---:|
| 5 | 5 | 4 |

---

## Micro-batch A3 — Static → button (solo PoiList)

**Autorizzabilità storica del pattern:** AUTORIZZABILE — BASSO RISCHIO.  
**Stato operativo corrente:** **ACCETTATO PO** (2026-08-15; parte di low-risk A).

### A3 — `PoiList.tsx:242`

- Attuale: `<h4 className="… cursor-pointer …" onClick={() => actions.onEdit(poi)}>`
- Modifica congelata: sostituire con `<button type="button" className={stesse classi + reset utili se servono} onClick={…}>` — stesso handler.
- Nessun nested control nel nodo.
- Hit: **1** · Loc: **1** · File: **1**

### PreviewHero — RICLASSIFICATO FUORI A (B)

Vedi tabella riclassificazioni. Non fa parte di alcun micro-batch A autorizzabile.

---

## Micro-batch A4 — Drawer backdrop sibling

Applicazione del **contratto A1 adattato** a backdrop **sibling** (non parent del panel):

**Modifica congelata:** sostituire il `<div … onClick={onClose}>` backdrop con:

```tsx
<button
  type="button"
  tabIndex={-1}
  aria-hidden="true"
  className={/* stesse className del div attuale */}
  onClick={onClose}
/>
```

- Panel drawer: **invariato**
- Nessun wrapper aggiuntivo obbligatorio (il backdrop è già un singolo nodo)
- Dipende da A1 solo come **specifica del contratto** (stessi attributi dismiss mouse-only)

| Locazione | Note |
|----|----|
| `AdminSidebar.tsx:117` | `md:hidden` mobile drawer |
| `ObservatoryFilterDrawer.tsx:99` | opacity/pointer-events già gestiti da `isOpen` — **invariati** sulle className |

| Hit | Loc | File | Autorizzabilità storica | Stato operativo |
|---:|---:|---:|----|----|
| 4 | 2 | 2 | AUTORIZZABILE — BASSO RISCHIO (dopo ACCETTO A1) | **ACCETTATO PO** (2026-08-15) |

---

## Micro-batch A5 — Sibling `absolute inset-0`

Stesso contratto dismiss mouse-only sul **nodo che oggi ha onClick**, non sul wrapper.

### A5-auth — autorizzabilità storica: AUTORIZZABILE — BASSO RISCHIO

**Stato operativo corrente:** **ACCETTATO PO** (2026-08-15; parte di low-risk A).

| Loc | Handler | Modifica |
|----|----|----|
| `AuthModal.tsx:314` | `onClose` | Sostituire `<div className="absolute inset-0" onClick={onClose}>` con `<button type="button" tabIndex={-1} aria-hidden="true" className="absolute inset-0 …" onClick={onClose}>` |

Wrapper overlay e panel: invariati. Hit: **2** · Loc: **1**

### A5-attempt — ESEGUITO (2026-08-15; attende ACCETTO PO)

| Loc | Handler | Note |
|----|----|----|
| `AdminPoiModal.tsx` (ex :139) | `handleCloseAttempt` | Definitivo proposto: `<button type="button" tabIndex={-1} aria-label="Chiudi finestra" … onClick={handleCloseAttempt} />`; classi visuali dimmer preservate; logica dirty/clean/confirm **invariata**; Biome **0** diagnostiche sul file |

Hit inventario: **2** · Loc: **1** · File: **1**. Codice **ESEGUITO** — **attende ACCETTO PO** (non «da riscrivere»).

---

## Micro-batch A6 — Lightbox dismiss

**Autorizzabilità storica del pattern:** AUTORIZZABILE — BASSO RISCHIO (dopo A1).  
**Stato operativo corrente:** **ACCETTATO PO** (2026-08-15; parte di low-risk A).

| Loc | Modifica congelata |
|----|----|
| `GalleryLightbox.tsx:103` | Applicare **contratto A1** sul root lightbox: wrapper `role="presentation"` senza onClick; button dismiss mouse-only `absolute inset-0` con `onClick={onClose}`; aree media/footer con `stopPropagation` **non toccate** (D) |

CloseButton / frecce: invariati. Hit: **2** · Loc: **1** · Autorizzabilità storica: AUTORIZZABILE dopo A1.

---

## A7 — Suddivisione obbligatoria (non un unico batch)

Totale A7: **100 hit · 53 loc · 51 file**.  
`51` file = file **unici** A7 dei cinque sotto-pattern (40+6+3+1+1); nessuna sovrapposizione tra sotto-pattern. A7-direct: **40** file perché AiItineraryModal e PoiDetailModal hanno 2 locazioni ciascuno (42 loc − 2 duplicati). A7-attempt escluso da questo totale (**2** hit · **1** loc · **1** file).  
Ogni sotto-pattern applica il **contratto A1** (wrapper presentation + dismiss button), con la sola differenza di **quando** il button esiste / quale handler invoca.

### A7-direct — autorizzabilità storica: AUTORIZZABILE — BASSO RISCHIO

**Stato operativo corrente:** **ACCETTATO PO** (2026-08-15; parte di low-risk A).

- Handler: `onClose` | `handleClose` | `closeEditModal` | `handleCloseXpToast` (riferimento funzione diretta di chiusura)
- Modifica: contratto A1; `onClick` del button = **stesso** riferimento
- Uniformità: alta (stesso intent dismiss)
- Hit **84** · Loc **42** · File **40** (AiItinerary×2, PoiDetail×2)

Locazioni:

```text
ItineraryManager.tsx:314
CollaborationShareModal.tsx:411
DeleteConfirmationModal.tsx:101
DiaryModals.tsx:162
DiaryHeaderInvalidDateModal.tsx:37
BlacklistModal.tsx:50
CategoryMobileDialog.tsx:66
CategorySetupConfigurationModal.tsx:346
ItemDeleteConfirmationModal.tsx:68
AiCatalogTab.tsx:187
StandardItemsTab.tsx:175
TemplateSpecificItemsTab.tsx:208
AiItineraryModal.tsx:81
AiItineraryModal.tsx:129
CityInfoModal.tsx:125
ConfirmClearModal.tsx:35
CultureCornerModal.tsx:356
DateChangeWarningModal.tsx:41
DuplicateResolutionModal.tsx:55
EmptyDiaryModal.tsx:39
FullRankingsModal.tsx:150
GpsAlertModal.tsx:20
GpsErrorModal.tsx:28
HistoryModal.tsx:77
LevelUpModal.tsx:26
MobileMoveModal.tsx:71
PatronSaintModal.tsx:74
PoiClaimModal.tsx:110
PoiDetailModal.tsx:183
PoiDetailModal.tsx:369
ProvinceModal.tsx:165
QuotaExceededModal.tsx:39
RemoveItemModal.tsx:44
SaveAsModal.tsx:109
SectionPreviewModal.tsx:138
ShareModal.tsx:87
SponsorModal.tsx:85
SuggestionReviewModal.tsx:248
TimeConflictModal.tsx:134
ProductDetailOverlay.tsx:24
ShopBioOverlay.tsx:18
UserDashboard.tsx:172
```

Smoke campione: DeleteConfirmation, ShareModal, BlacklistModal, PoiDetail (entrambe le surface), UserDashboard — overlay chiude, panel no, ESC/Close se presenti.

---

### A7-presentation — autorizzabilità storica: AUTORIZZABILE — BASSO RISCHIO

**Stato operativo corrente:** **ACCETTATO PO** (2026-08-15; parte di low-risk A).

- Già `role="presentation"` + `onClick={onClose}` (oggi spesso solo static rule)
- Modifica: **mantenere** `role="presentation"` sul wrapper; **spostare** dismiss sul button A1; rimuovere onClick dal wrapper
- Hit **6** · Loc **6** · File **6**

```text
RecommendedSuitcaseModal.tsx:258
MySpaceCityPickModal.tsx:21
RicordamiConfigModal.tsx:286
SuitcaseDiariesModal.tsx:46
CommunityPhotoPublishModal.tsx:128
PhotoAcquireDialog.tsx:46
```

---

### A7-busy — autorizzabilità storica: AUTORIZZABILE — BASSO RISCHIO

**Stato operativo corrente:** **ACCETTATO PO** (2026-08-15; parte di low-risk A).

- Attuale: `onClick={busy ? undefined : onClose}`
- Modifica congelata: contratto A1 con button dismiss **solo se** `!busy` (equivalente funzionale: nessun dismiss click quando busy)
- Hit **6** · Loc **3** · File **3**

```text
CreateDiaryModal.tsx:133
CreateSuitcaseModal.tsx:128
ResourceConflictCopyModal.tsx:45
```

Smoke: durante submit/busy il click overlay **non** chiude; a riposo chiude.

---

### A7-days — autorizzabilità storica: AUTORIZZABILE — BASSO RISCHIO

**Stato operativo corrente:** **ACCETTATO PO** (2026-08-15; parte di low-risk A).

- Attuale: `onClick={days.length > 0 ? onClose : undefined}`
- Modifica: button dismiss solo se `days.length > 0`
- Hit **2** · Loc **1** · File **1** — `AddToItineraryModal.tsx:220`
- Smoke: senza giorni configurati overlay non chiude; con giorni chiude.

---

### A7-target — autorizzabilità storica: AUTORIZZABILE — BASSO RISCHIO (dopo A1)

**Stato operativo corrente:** **ACCETTATO PO** (2026-08-15; parte di low-risk A).

- Attuale: `onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}` — `BuyCreditsModal.tsx:137`
- Con contratto A1 (button sibling sotto panel) il guard `target===currentTarget` **diventa ridondante**
- Modifica congelata: applicare A1 con `onClick={onClose}` sul dismiss button; **rimuovere** il guard (non più necessario)
- Hit **2** · Loc **1** · File **1**
- Smoke: click dimmer chiude; click contenuto pacchetti non chiude.

---

### A7-attempt — ESEGUITO (2026-08-15; attende ACCETTO PO)

- `ReviewModal.tsx` — backdrop principale già in forma A1 (`button` + `onClick={handleCloseAttempt}`); nested confirm backdrop resta `onClick={() => setShowConfirmClose(false)}`
- Verifica live Biome 2026-08-15: **0** hit `useKeyWithClickEvents` / `noStaticElementInteractions` su questo file
- Hit inventario: **2** · Loc **1** · File **1**
- Comportamenti PO congelati preservati (dirty confirm / nested dismiss / submitting no-op)
- Codice **ESEGUITO** — **attende ACCETTO PO** file definitivo

---

## Tabella riepilogativa pattern / micro-batch

| Micro-batch | Hit | Loc | File | Modifica congelata | Rischio | Uniformità | Stato operativo |
|----|---:|---:|---:|----|----|----|----|
| A1 shell | 2 | 1 | 1 | Sì — dismiss button mouse-only | Basso | Alto | **ACCETTATO PO** |
| A2 labels | 5 | 5 | 4 | Sì — htmlFor/id | Basso | Alto | **ACCETTATO PO** (2026-08-15) |
| A3 PoiList | 1 | 1 | 1 | Sì — h4→button | Basso | Alto | **ACCETTATO PO** (2026-08-15) |
| A4 drawers | 4 | 2 | 2 | Sì — A1 adattato sibling | Basso | Alto | **ACCETTATO PO** (2026-08-15) |
| A5-auth | 2 | 1 | 1 | Sì — A1 su absolute sibling | Basso | Alto | **ACCETTATO PO** (2026-08-15) |
| A5-attempt | 2 | 1 | 1 | Forma A1 + handleCloseAttempt | Medio | Medio | **ESEGUITO** (2026-08-15; attende ACCETTO PO) |
| A6 lightbox | 2 | 1 | 1 | Sì — A1 su root lightbox | Basso | Alto | **ACCETTATO PO** (2026-08-15) |
| A7-direct | 84 | 42 | 40 | Sì — A1 + handler diretto | Basso | Alto | **ACCETTATO PO** (2026-08-15) |
| A7-presentation | 6 | 6 | 6 | Sì — A1 su wrapper già presentation | Basso | Alto | **ACCETTATO PO** (2026-08-15) |
| A7-busy | 6 | 3 | 3 | Sì — A1 gated `!busy` | Basso | Alto | **ACCETTATO PO** (2026-08-15) |
| A7-days | 2 | 1 | 1 | Sì — A1 gated days | Basso | Alto | **ACCETTATO PO** (2026-08-15) |
| A7-target | 2 | 1 | 1 | Sì — A1 (drop guard) | Basso | Alto | **ACCETTATO PO** (2026-08-15) |
| A7-attempt | 2 | 1 | 1 | Forma A1 + dirty confirm | Medio | Basso | **ESEGUITO** (2026-08-15; attende ACCETTO PO) |
| Fuori A (B) | 3 | 3 | 3 | — | — | — | **FUORI A** (non residuo A) |
| **Totale** | **123** | **69** | — | | | | |

Verifica hit: 2+5+1+4+2+2+2+84+6+6+2+2+2+3 = **123**.  
Verifica loc: 1+5+1+2+1+1+1+42+6+3+1+1+1+3 = **69**.  
A7-direct: **84 hit** = 42 locazioni × 2 regole (key+static); **40 file** (AiItineraryModal e PoiDetailModal hanno 2 locazioni ciascuno).

---

## Autorizzabilità storica vs stato operativo

La colonna **Autorizzabilità storica** è l’esito dell’audit di pattern (2026-08-08): non implica che il batch sia ancora da autorizzare.  
La colonna **Stato operativo** è lo stato corrente della bonifica.

| Micro-batch | Hit | Locazioni | Rischio | Modifica congelata | Autorizzabilità storica | Stato operativo |
|----|---:|---:|----|----|----|----|
| A1 shell | 2 | 1 | Basso | Sì | era AUTORIZZABILE — BASSO RISCHIO | **ACCETTATO PO** (2026-08-09) |
| A2 labels | 5 | 5 | Basso | Sì | AUTORIZZABILE — BASSO RISCHIO | **ACCETTATO PO** (2026-08-15) |
| A3 PoiList | 1 | 1 | Basso | Sì | AUTORIZZABILE — BASSO RISCHIO | **ACCETTATO PO** (2026-08-15) |
| A4 drawers | 4 | 2 | Basso | Sì | AUTORIZZABILE — BASSO RISCHIO | **ACCETTATO PO** (2026-08-15) |
| A5-auth | 2 | 1 | Basso | Sì | AUTORIZZABILE — BASSO RISCHIO | **ACCETTATO PO** (2026-08-15) |
| A5-attempt AdminPoi | 2 | 1 | Medio | Sì (forma) | **RICHIEDE REVIEW** (era) | **ESEGUITO** (2026-08-15; attende ACCETTO PO) |
| A6 lightbox | 2 | 1 | Basso | Sì | AUTORIZZABILE — BASSO RISCHIO | **ACCETTATO PO** (2026-08-15) |
| A7-direct | 84 | 42 | Basso | Sì | AUTORIZZABILE — BASSO RISCHIO | **ACCETTATO PO** (2026-08-15) |
| A7-presentation | 6 | 6 | Basso | Sì | AUTORIZZABILE — BASSO RISCHIO | **ACCETTATO PO** (2026-08-15) |
| A7-busy | 6 | 3 | Basso | Sì | AUTORIZZABILE — BASSO RISCHIO | **ACCETTATO PO** (2026-08-15) |
| A7-days | 2 | 1 | Basso | Sì | AUTORIZZABILE — BASSO RISCHIO | **ACCETTATO PO** (2026-08-15) |
| A7-target | 2 | 1 | Basso | Sì | AUTORIZZABILE — BASSO RISCHIO | **ACCETTATO PO** (2026-08-15) |
| A7-attempt ReviewModal | 2 | 1 | Medio | Sì (forma) | **RICHIEDE REVIEW** (era) | **ESEGUITO** (2026-08-15; attende ACCETTO PO) |
| ImportOsm label | 1 | 1 | — | — | **RICLASSIFICATO FUORI A** (B) | fuori A — non residuo A |
| AiPlanner Durata label | 1 | 1 | — | — | **RICLASSIFICATO FUORI A** (B) | fuori A — non residuo A |
| PreviewHero `<p>` | 1 | 1 | — | — | **RICLASSIFICATO FUORI A** (B) | fuori A — non residuo A |

**Somma hit tabella:** 2+5+1+4+2+2+2+84+6+6+2+2+2+1+1+1 = **123**.

---

## Ordine del piano (storico) vs stato esecuzione

L’ordine sotto è il **piano di esecuzione** deciso in audit. Non implica che i passi 1–9 siano ancora da fare.

| # | Micro-batch | Stato esecuzione |
|---:|----|----|
| 1 | **A1** shell | **ACCETTATO PO** — chiuso |
| 2 | **A2** labels | **ACCETTATO PO** (2026-08-15) |
| 3 | **A3** PoiList | **ACCETTATO PO** (2026-08-15) |
| 4 | **A4** drawers | **ACCETTATO PO** (2026-08-15) |
| 5 | **A5-auth** | **ACCETTATO PO** (2026-08-15) |
| 6 | **A6** lightbox | **ACCETTATO PO** (2026-08-15) |
| 7 | **A7-presentation** | **ACCETTATO PO** (2026-08-15) |
| 8 | **A7-direct** | **ACCETTATO PO** (2026-08-15) |
| 9 | **A7-busy** · **A7-days** · **A7-target** | **ACCETTATO PO** (2026-08-15) |
| 10a | **A5-attempt** | **ESEGUITO** (2026-08-15) — attende ACCETTO PO su `AdminPoiModal.tsx` |
| 10b | **A7-attempt** | **ESEGUITO** (2026-08-15) — attende ACCETTO PO su `ReviewModal.tsx` |

**Prossimo gate Tranche A (attempt):** ACCETTO PO su A5/A7-attempt (file definitivi). La **low-risk A** è già **ACCETTATA PO e chiusa**. «Tranche A COMPLETAMENTE CHIUSA» = chiusura della **low-risk A** (+ A1); **non** implica ACCETTO degli attempt. Residuo B2b SoT = [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md) (**389** snapshot). **Non** aprire B2c qui.

---

## Dichiarazioni stato

- Codice applicativo modificato: **SÌ** (storico: A1 + tranche low-risk A + A5-attempt AdminPoiModal) — **nessuna ripresa codice** all’ACCETTO PO low-risk 2026-08-15
- Schede B2b accettate modificate: **NO**
- Audit persistente aggiornato: **SÌ**
- File: `AI_QUALITY/biome/B2b_A_TRANCHE_A_PATTERN_AUDIT.md`
- ACCETTO PO sul blocco low-risk post-A1: **SÌ** — **2026-08-15** (A2–A7* esclusi attempt; **114** hit)
- ACCETTO PO A5-attempt (`AdminPoiModal.tsx`): **NO** — **ESEGUITO**, attende ACCETTO PO
- ACCETTO PO A7-attempt (`ReviewModal.tsx`): **NO** — **ESEGUITO**, attende ACCETTO PO

**Tranche low-risk A: ACCETTATA PO — CHIUSA.** A5-attempt / A7-attempt: **ESEGUITI — attende ACCETTO PO** (lavorazione successiva/collegata; codice non «da rifare»).

### Chiusura low-risk A (lessico)

- A1 shell: **CHIUSO** (ACCETTATO PO)
- Tranche low-risk A (A2–A7* esclusi attempt): **CHIUSA** (ACCETTATA PO)
- A5-attempt / A7-attempt: **non** chiusi in ACCETTO — solo **ESEGUITI** in attesa di ACCETTO PO
- Residuo B2b ufficiale: snapshot SoT **389** / progetto **1213** fino a nuovo snapshot Biome
