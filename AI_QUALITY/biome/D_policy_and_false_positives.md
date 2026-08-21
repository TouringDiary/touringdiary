# Livello D — Policy, falsi positivi e decisioni di prodotto

> Documento di policy Biome (Livello D).  
> **Numeriche correnti (uniche):** [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md)  
> Indice qualità: [`../README.md`](../README.md)

## Scopo

Il **Livello D** raccoglie diagnostiche che **non vanno corrette** (o non ora), perché:

- falsi positivi rispetto al dominio / obiettivo della bonifica;
- warning discutibili / rumore;
- decisioni di prodotto consapevoli;
- pattern che oggi è corretto mantenere.

## Distinzione obbligatoria

| Livello | Significato |
|----|----|
| **Baseline storica** | Fotografia congelata (es. 2026-08-03) |
| **Review qualitativa** | Classificazione di location (es. review manuale B2b 2026-08-16) |
| **Decisione D** | «non correggere» / KEEP intenzionale |
| **Contatore SoT** | Totale live in `AI_BIOME_AUDIT.md` — **non** ricalcolato da questo file |

**D = non correggere** ≠ **rimuovere dal contatore**.

---

## Stato

| Campo | Valore |
|----|----|
| **Diagnostiche classificate D alla baseline (2026-08-03)** | **0** (nessuna categoria intera in D a priori) |
| **Decisioni D registrate dopo review** | **18** hit `noStaticElementInteractions` (FP intenzionali) |
| **Ultimo aggiornamento policy FP** | **2026-08-16** (stato documentale finale della review) |

---

## Candidati D (non ancora promossi)

> Tabella di **candidati / policy potenziali**. **Non** sono decisioni D registrate.

| Candidato | Categoria Biome | Motivo potenziale D |
|----|----|----|
| Key su slot dominio statici | `lint/suspicious/noArrayIndexKey` | Lista fissa non riordinabile; key=indice può essere accettabile se documentata |
| autofocus in modal critici | `lint/a11y/noAutofocus` | UX intenzionale accessibilità/prodotti |
| HTML trustato admin-only | `lint/security/noDangerouslySetInnerHtml` | Se sanitizzato e threat model accettato (altrimenti resta C) |

---

# Biome — False Positives analizzati

## Regola

`lint/a11y/noStaticElementInteractions`

## Versione

Biome **2.5.6** (`@biomejs/biome` pin di progetto; schema `biome.json`).

## Provenienza

Classificazione derivata dalla **review manuale B2b del 2026-08-16** (macro `S-FP-DRAG`, `S-FP-POINTER`, `S-FP-CONTENT`).  
Questo registro è **autosufficiente**: non dipende da artefatti temporanei di audit.

## Stato

I **18** hit sono stati analizzati e classificati come **falsi positivi rispetto all'obiettivo della bonifica**:

- non rappresentano controlli cliccabili da trasformare meccanicamente in `button`;
- non sono «lavoro dimenticato»;
- restano **visibili** in Biome check **di proposito**.

| Macro | Hit | Natura |
|----|---:|----|
| `S-FP-DRAG` | **6** | Superfici drag/drop |
| `S-FP-POINTER` | **11** | Pointer / hover / pan / drag-scroll |
| `S-FP-CONTENT` | **1** | `contentEditable` |
| **Totale** | **18** | FP intenzionali — **KEEP** |

## Categorie

### Drag/drop (`S-FP-DRAG` ×6)

Elementi con eventi **drag/drop** (riordino, drop zone, accettazione payload).  
**Non** sono click-control. Convertirli in `button` sarebbe semanticamente sbagliato.

Esempi tipici: riga POI trascinabile in Admin itinerari; drop zone giorno Diario; shell card con reorder; area scroll/empty-state che accetta drop.

### Pointer / hover / pan (`S-FP-POINTER` ×11)

Elementi con **mouse/pointer** per pan, hover preview, drag-scroll, posizionamento editor, o wrapper pointer intorno a button già esistenti.  
**Non** sono click-control primari.

Esempi tipici: canvas pan photo inspector; stage/handle editor onboarding; `DraggableSlider`; tooltip hover timeline; hover preview valigia; strip scroll ProvinceModal.

### contentEditable (`S-FP-CONTENT` ×1)

`NewsTickerManager`: superficie **rich-text** `contentEditable`, non click-to-activate.  
**Non** va trasformata in `button`.

## Perché i warning rimangono

La regola segnala elementi statici con handler nelle categorie hardcoded **focus / keyboard / mouse**.  
In **mouse** rientrano anche **drag/drop** e movimenti tipo **mousemove** / enter-leave, non solo `onClick`.  
In 2.5.6, `contentEditable` **non** è un’uscita anticipata di questa regola.

Quindi Biome continua a segnalare queste superfici anche quando, per TouringDiary, **non** sono “click control senza ruolo”.

## Perché NON abbiamo usato biome-ignore

1. non nascondere problemi reali sullo stesso file o hit futuri;  
2. non disseminare suppressioni nel codice;  
3. i casi sono analizzati e registrati **centralmente** qui;  
4. in Biome **2.5.6**, `NoStaticElementInteractionsOptions` è **vuoto**: non esiste un’esclusione selettiva «solo drag/hover/contentEditable» senza spegnere la regola o fare override file-wide.

**Vietato** per questi 18: `biome-ignore`; rule off; abbassare severity / override glob; hack «per Biome» su drag/pan/editing.

## Decisione

**KEEP intenzionale.** I **18** warning restano **attivi** e **motivati**.

Rivalutare solo se:

- Biome offrirà options più precise; **oppure**
- il progetto introdurrà un’analisi più specifica (senza spegnere i veri hit click); **oppure**
- uno dei casi cambierà strutturalmente e non sarà più FP (aggiornare allora questo registro).

### Nota contabile (obbligatoria)

I **18** FP **restano nel totale live** `noStaticElementInteractions` / B2b della SoT [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md).

| Significato | Non significa |
|----|----|
| «non correggere» (Livello D) | «sottrarre dal contatore SoT» |
| warning lasciati visibili | warning risolti / nascosti |

## Inventario path (registro permanente)

> Path relativi a `src/components/`. Le linee sono quelle della review 2026-08-16; se il file si sposta di poche righe resta valido il **pattern** + path.

| Macro | Path | Linee review |
|----|----|----|
| S-FP-DRAG | `admin/AdminItineraryEditor.tsx` | 620, 650 |
| S-FP-DRAG | `features/diary/ItineraryItemCard.tsx` | 313 |
| S-FP-DRAG | `features/diary/DiaryDay.tsx` | 284 |
| S-FP-DRAG | `features/diary/TravelDiary.tsx` | 393, 457 |
| S-FP-POINTER | `admin/AdminPhotoInspector.tsx` | 394 |
| S-FP-POINTER | `admin/onboarding/OnboardingVisualEditor.tsx` | 310, 347, 388, 403 |
| S-FP-POINTER | `common/DraggableSlider.tsx` | 128 |
| S-FP-POINTER | `features/diary/DiaryTimeline.tsx` | 216 |
| S-FP-POINTER | `features/diary/packing_list/suitcase/CategorySuggestionPanel.tsx` | 114 |
| S-FP-POINTER | `features/diary/packing_list/suitcase/SuitcaseCard.tsx` | 121 |
| S-FP-POINTER | `modals/ProvinceModal.tsx` | 352 |
| S-FP-POINTER | `features/diary/packing_list/suitcase/CategoryStatusFilter.tsx` | 131 |
| S-FP-CONTENT | `admin/NewsTickerManager.tsx` | 166 |

## Riferimenti correlati

| Documento | Ruolo |
|----|----|
| [`BIOME_101_FOLLOWUP_AUDIT_CARD_STOPPROP_SPECIALS.md`](./BIOME_101_FOLLOWUP_AUDIT_CARD_STOPPROP_SPECIALS.md) | Esito review STEP C/D/E (non sostituisce questo registro FP) |
| [`B_a11y_click_and_static_interactions.md`](./B_a11y_click_and_static_interactions.md) | Scheda click+static + sintesi review 101 |
| [`B2b_389_RESIDUAL_PATTERN_AUDIT.md`](./B2b_389_RESIDUAL_PATTERN_AUDIT.md) | Snapshot storico 389 (note P2f/P2k affini) |

---

## Registro decisioni D (append-only)

| Data | Ambito | Categoria | Occ. | Motivo | Decisione |
|----|----|----|---:|----|----|
| 2026-08-03 | Baseline | — | 0 | Nessun caso D alla baseline | — |
| 2026-08-16 | `S-FP-DRAG` + `S-FP-POINTER` + `S-FP-CONTENT` | `lint/a11y/noStaticElementInteractions` | **18** | Drag/drop, pointer/hover/pan, contentEditable — non click-control; Biome 2.5.6 senza options selettive | **KEEP intenzionale** (definitivo review) — warning restano attivi; no ignore / no rule off |

## Regola operativa

1. Default: correggere secondo il livello della categoria (A–C) / roadmap B2b.  
2. Solo dopo review esplicita un hit può passare a D (questo file).  
3. I FP **KEEP intenzionale** **non** si sottraggono dalla SoT: restano nel debito live.  
4. Vietato: `biome-ignore`, rule off, override file-wide su `noStaticElementInteractions` per questi 18.
