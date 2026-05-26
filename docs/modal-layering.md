# Modal & Layering Architecture — Touring Diary

> Last updated: 2026-05-24  
> Layer registry: `src/layering/layerRegistry.ts`  
> Focus mode policy: `src/focus/focusModeRegistry.ts`  
> Numeric values: `src/constants/zIndex.ts`

---

## UI Modes (Focus System)

Application focus is derived by `deriveFocusState()` — **no hardcoded modal exceptions**.

| UIMode | Trigger | Overlay | Primary owner |
|---|---|---|---|
| `home` | Default app | none | — |
| `workspace` | `WORKSPACE_REGISTRY.modalKey` (e.g. `packingList`) | `workspaceDim` @ Z_FOCUS_DIM | `WorkspaceHost` |
| `modal` | Any other `activeModal` | `modalDim` @ Z_OVERLAY | `ModalManager` |
| `preview` | `activePreview.isOpen` | `modalDim` @ Z_OVERLAY | `FeatureModals` |
| `immersive` | Reserved | TBD | Future maps/editors |

Provider: `FocusModeProvider` (`src/focus/FocusModeContext.tsx`)  
Visual overlay: `FocusOverlay` (`src/focus/FocusOverlay.tsx`)  
Workspace panels: `WorkspaceHost` (`src/focus/WorkspaceHost.tsx`)

---

## Focus Surfaces (Semantic, not z-index)

| Surface | Workspace mode | Modal mode |
|---|---|---|
| `globalChrome` (news, header) | visible | visible |
| `focusCompanion` (diary, sponsor) | visible | dimmed |
| `focusActive` (Valigia panel) | visible | dimmed |
| `dimmedBackground` (hero, sidebar widgets) | dimmed | dimmed |
| `baseContent` | dimmed | dimmed |

Mark up: `data-focus-surface="…"` (see `FOCUS_SURFACE_ATTR`).

---

## Z-index Tier Map

### Focus workspace stack (9000–9399)

| Tier | Value | CSS / style | Owner | Portal |
|---|---|---|---|---|
| focusDim | 9 000 | `Z_FOCUS_DIM` | `FocusOverlay` (workspace) | body |
| focusCompanion | 9 100 | `z-focus-companion` | `Sidebar.tsx` diary + sponsor | body |
| globalChrome | 9 200 | `Z_GLOBAL_CHROME` | `AppShell.tsx` news + header | inline |
| focusActive | 9 300 | `Z_FOCUS_ACTIVE` | `WorkspaceHost` → Valigia | body |

### Consumer stack (10000+)

| Tier | Value | CSS class | Owner | Portal |
|---|---|---|---|---|
| dropdown | 10 000 | `z-dropdown` | Header menus | body |
| popover | 10 500 | `z-popover` | AnchoredPopover, hero filters | inline/body |
| modal | 11 000 | `z-modal` | Classic fullscreen modals | body |
| modalNested | 12 000 | `z-modal-nested` | Nested confirms | body |
| adminModal | 13 000 | — | Admin panels | body |
| overlay | 14 000 | — | `FocusOverlay` (modal/preview) | body |
| lightbox | 15 000+ | — | GalleryLightbox | body |
| toast | 16 000 | — | GlobalAlert | body |

**Note:** `SuitcaseFloatingPanel` is **focusActive**, NOT `modal`. Classic modals stay on the 11000/14000 stack.

---

## Valigia / Workspace Focus Flow

```
User opens Valigia
  → openModal('packingList')          // transport key only
  → deriveFocusState → mode=workspace
  → FocusOverlay renders workspaceDim @ 9000
  → Sidebar portals diary+sponsor @ 9100 (focusCompanion)
  → WorkspaceHost mounts SuitcaseFloatingPanel @ 9300
  → Inline dimmedBackground (hero, TOP/MIX) sits below overlay → dimmed
  → globalChrome (news, header) above overlay top edge + tier 9200
```

Click workspace dim overlay or ESC → `closeFocus()` → `closeModal()`.

---

## Modal / Preview Flow (unchanged contract)

```
openModal('itineraries') / activePreview.isOpen
  → mode=modal | preview
  → FocusOverlay modalDim @ 14000
  → BaseFullscreenModalShell: td-modal-overlay + content @ 11000
  → backdrop-blur ONLY on active overlay (mount/unmount per mode)
```

---

## Sidebar LEVEL Semantics

| Level | Surface | Workspace behaviour |
|---|---|---|
| LEVEL 3 | `dimmedBackground` | TOP/MIX, global buttons — dimmed |
| LEVEL 2 | `focusCompanion` | Diary + sponsor — portaled above dim |

---

## Adding a New Workspace

1. Add entry to `WORKSPACE_REGISTRY` in `src/focus/focusModeRegistry.ts`
2. Add case in `WorkspaceHost.tsx`
3. Use `Z_FOCUS_ACTIVE` for the panel portal
4. No changes to `FocusOverlay` unless new overlay geometry is needed

---

## Anti-patterns (removed)

- ~~`activeModal !== 'packingList'`~~ in overlay logic
- ~~`Z_FLOATING_PANEL` (9000) below sidebar shell (10000)~~
- ~~Hero modules using `z-floating-panel` for local stacking~~
- ~~`aside` with document-level z-index blocking companion portals~~

`Z_FLOATING_PANEL` is deprecated alias → `Z_FOCUS_COMPANION`.

---

## ESC Ownership

Single LIFO stack in `src/hooks/useCloseOnEscape.ts`.  
Workspace panels register via `useGlobalModalEscape` in `SuitcaseFloatingPanel`.

---

## Portal Policy

| Component | Mount | Tier |
|---|---|---|
| Workspace companion (diary) | `document.body` | focusCompanion |
| Workspace active (Valigia) | `document.body` | focusActive |
| Classic modals | `document.body` | modal inside overlay |
| Header menu | `document.body` | dropdown |
