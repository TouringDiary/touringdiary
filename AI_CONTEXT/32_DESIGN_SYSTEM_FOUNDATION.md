# 🎨 DOC 32: DESIGN SYSTEM FOUNDATION (v1.0 — CERTIFIED)

> **Single source of truth** per Design System runtime, Foundation admin-editable e sistema layering/focus.
> Verificato sul codice (luglio 2026). Storico WIP: `docs/_archive/design-system/`

---

## Principi architetturali

TouringDiary non ha subito un refactor globale dello styling: l'app è **Tailwind-first** con centinaia di componenti che esprimono UI come classi inline, mentre un sottoinsieme crescente di superfici condivise (modali, controlli Foundation) converge verso primitive governate da database.

Per questo convivono **intenzionalmente** due track sullo stesso store `design_system_rules`:

| Track | Ruolo |
|-------|--------|
| **Legacy semantic** (`useDynamicStyles`) | Chiavi semantiche storiche (`admin_*`, `filter_*`, tipografia home/city) già cablate nell'app; migrazione massiva avrebbe alto rischio regressioni senza beneficio immediato proporzionale. |
| **Foundation** (`useFoundationStyles`) | Percorso evolutivo per shell modali, pulsanti e token condivisi; stessa tabella DB con `section: 'foundation'`, adozione progressiva sulle aree ad alto riuso. |

**Legacy semantic resta supportato** fino a migrazione completa area per area. **Foundation è la direzione architetturale** per nuove superfici condivise e per il debito modale/layering documentato in questo SSOT. Non sono due design system concorrenti: sono due consumatori dello stesso runtime, con perimetro e convenzioni distinti.

---

## DESCRIZIONE SEMPLICE

TouringDiary usa Tailwind inline su ~470+ componenti, affiancato da un Design System **runtime** in database (`design_system_rules`) per tipografia e, in crescita, **Foundation** per shell modali e controlli condivisi. Il sistema focus/layering governa Valigia, hub Workspace e modali senza conflitti z-index.

---

## ARCHITETTURA DUAL-TRACK

| Track | Hook | Copertura | Sorgente |
|-------|------|-----------|----------|
| **Legacy semantic** | `useDynamicStyles` | ~50+ file (home, city, admin keys `admin_*`, `filter_*`) | `design_system_rules` via `ConfigContext` |
| **Foundation** | `useFoundationStyles` | Modali collaborazione, valigia, diary (~35 file) | Stessa tabella, `section: 'foundation'` |

La migrazione da Legacy a Foundation è **incrementale** e guidata dal valore funzionale (aree ad alto riuso, riduzione duplicazioni, allineamento layering): non è un obiettivo di convertire l'intero codebase in un'unica passata.

### Pipeline dati

1. `settingsService.getDesignSystemRules()` → query `design_system_rules`
2. `ConfigContext` → `configs.design_system_rules` + `configs.design_system.components`
3. Hook costruiscono classi via `constructClassName` / chiavi `FOUNDATION_STYLE_KEYS`

### Admin

| UI | File | Filtro |
|----|------|--------|
| Design System (tipografia legacy) | `DesignSystemSettings` | esclude `section === 'foundation'` |
| Foundation | `FoundationSettingsPanel` | solo `section === 'foundation'` |

**Catalogo Foundation:** `foundationSettingsCatalog.ts`, seed `20260705120001_seed_foundation_design_system_rules.sql`, regole `foundationDesignRules.ts`.

---

## FOUNDATION — SCOPE v1

### In scope (certificato)

- Shell modali Foundation: `createPortal` + `td-modal-overlay` + `useFoundationStyles(FOUNDATION_STYLE_KEYS.*)`
- Pulsanti Foundation (varianti primary/secondary/danger, size)
- Token overlay/backdrop modale
- Editor admin con preview desktop/mobile

### Pattern shell

| Pattern | Adozione | Note |
|---------|----------|------|
| **Foundation portal modals** | Maggioranza modali nuovi (collaboration, suitcase, diary) | Shell hand-rolled + Foundation styles |
| **`BaseFullscreenModalShell`** | `GlobalSectionView`, `StaticPage` (2 file) | Registry owner tier `modal` |
| **Legacy custom** | `AroundMeWizard`, `FullRankingsModal`, `ExportModal`, … | Hardcoded Tailwind, da migrare |

I **nuovi componenti condivisi** (modali, shell, controlli riusati) devono adottare Foundation salvo motivazioni architetturali documentate nel Decision Log o nel file Workflow attivo.

### Keyboard / bottom sheet (mobile)

Con `interactive-widget=resizes-content` (`index.html`), l’overlay `td-modal-overlay` (fixed bottom) si riduce con la tastiera: un `foundation_modal_footer` `shrink-0` salirebbe nel viewport utile e sottrarrebbe spazio a input/selettori.

**Policy Foundation:** sui bottom sheet mobile con campi testo, nascondere il footer dalla flex-flow mentre la tastiera è aperta (`useVirtualKeyboardOpen`), e ripristinarlo alla chiusura. Il body resta l’unica area che cede spazio. Dropdown in container `overflow-hidden` devono usare `AnchoredPopover` (portal), non `absolute` interno.

Riferimento implementato: `CommunityPhotoPublishModal` + `CitySelector`.

### Fuori scope v1 (esplicito)

- Refactor estetico globale
- Unificazione card dominio (City, POI, Suitcase)
- Tipografia inline ovunque
- Librerie esterne (shadcn/Radix) come sostituto Tailwind

---

## SISTEMA FOCUS E LAYERING

**Numeric SSoT:** `src/constants/zIndex.ts`  
**Semantic SSoT:** `src/layering/layerRegistry.ts`  
**UI modes:** `src/focus/focusModeRegistry.ts`

### UI Modes (`deriveFocusState`)

| Mode | Trigger | Overlay |
|------|---------|---------|
| `home` | Default | none |
| `workspace` | `WORKSPACE_REGISTRY` key (es. `packingList`, `collaborationWorkspace`) | `workspaceDim` @ 9000 |
| `modal` | Altri `activeModal` | `modalDim` @ 14000 |
| `preview` | `activePreview.isOpen` | `modalDim` @ 14000 |

### Z-index tier (estratto)

| Tier | Value | Owner |
|------|-------|-------|
| `Z_FOCUS_DIM` | 9000 | `FocusOverlay` workspace |
| `Z_FOCUS_COMPANION` | 9100 | Sidebar diary + sponsor |
| `Z_GLOBAL_CHROME` | 9200 | Header, news |
| `Z_FOCUS_ACTIVE` | 9300 | `WorkspaceHost` (Valigia, hub) |
| `Z_MODAL` | 11000 | Modali classiche |
| `Z_OVERLAY` | 14000 | `FocusOverlay` modal/preview |
| `Z_TOAST` | 16000 | `GlobalAlert` |

**Valigia:** `SuitcaseFloatingPanel` = `focusActive` (9000–9300), **non** stack modale 11000.

### Focus surfaces

`globalChrome`, `focusCompanion`, `focusActive`, `dimmedBackground`, `baseContent` — markup `data-focus-surface`.

### Aggiungere workspace focus

1. Entry in `WORKSPACE_REGISTRY` (`focusModeRegistry.ts`)
2. Case in `WorkspaceHost.tsx`
3. Portal a `Z_FOCUS_ACTIVE`

### Anti-pattern rimossi

- Eccezioni hardcoded `activeModal !== 'packingList'` in overlay
- `Z_FLOATING_PANEL` sotto sidebar (deprecato → `Z_FOCUS_COMPANION`)
- Hero con `z-floating-panel` per stacking locale

**Lint:** `npm run lint:layers`

---

## RISCHI E DEBITO DOCUMENTATO

| Area | Stato |
|------|--------|
| Duplicazione bottoni «Annulla» con padding diversi | Parzialmente risolto in Foundation |
| `admin_btn_primary` definito ma non sempre applicato | Debito legacy track |
| Wizard collaborazione: alcuni step ancora `text-xs` hardcoded | Migrazione Foundation in corso |
| Numerose modali portal legacy bespoke | Migrazione graduale |

---

## RIFERIMENTI CODICE

* `src/hooks/useDynamicStyles.ts`, `useFoundationStyles.ts`
* `src/context/ConfigContext.tsx`
* `src/services/settingsService.ts`
* `src/focus/FocusModeContext.tsx`, `FocusOverlay.tsx`, `WorkspaceHost.tsx`
* `src/components/modals/shell/BaseFullscreenModalShell.tsx`

---

## CRONOLOGIA

| Versione | Data | Modifiche |
|----------|------|-----------|
| 1.1 | 2026-07-24 | Policy keyboard/bottom sheet mobile (`useVirtualKeyboardOpen` + footer fuori flow; `AnchoredPopover` per dropdown in `overflow-hidden`) |
| 1.0 | 2026-07-13 | Creazione SSOT WF-01; assorbimento Foundation WIP + `modal-layering.md` |
