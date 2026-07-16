# 🧳 DOC 31: PACKING & SUITCASE SYSTEM (v1.0 — CERTIFIED)

> **Single source of truth** per il dominio Valigia / packing list post-macrofase C.
> Verificato su codice e migration Supabase (giugno–luglio 2026).
> Storico pre-refactor: `docs/_archive/packing/`

---

## DESCRIZIONE SEMPLICE

Il sistema gestisce valigie di viaggio, template TouringDiary (TD) e template utente, con catalogo standard condiviso, item specifici per template, suggerimenti AI da database e categorie unificate. Le valigie utente persistono su `suitcase_items`; i template TD sono composti a runtime da tabelle catalogo dedicate.

---

## MODELLO DATI

### Entità (`suitcaseDomain.ts`)

| Tipo | Condizione | Storage item |
|------|------------|--------------|
| **Template TD** | `user_id IS NULL` | **Nessun** `suitcase_items` — composizione runtime da catalogo |
| **Template utente** | `user_id` + `is_user_template` | `suitcase_items` |
| **Valigia utente** | `user_id` + non template | `suitcase_items` |

### Tabelle catalogo (macrofase A/C)

| Tabella | Ruolo |
|---------|--------|
| `packing_standard_items` | Item standard per categoria; `tier`: `core` \| `additional` \| `additional_ai_only` |
| `packing_template_items` | Item specifici per template TD (`template_id → suitcases`) |
| `packing_ai_catalog` | Catalogo AI (`tags[]`, `category`, `name`) |

**Categorie:** solo frontend — **nessuna** tabella `categories` DB.

**RLS:** authenticated read active; admin full; anon read active (guest).

### Template TD canonici (macrofase C)

7 template: Mare, Fiumi & Laghi, Montagna, Cultura, Business, Weekend, Famiglia — metadata in `suitcases` + `ui_state.category_setup`.

---

## SISTEMA CATEGORIE

**SSOT:** `src/domain/packing/packingCategories.ts`

| Export | Contenuto |
|--------|-----------|
| `CORE_CATEGORY_NAMES` | 7 core: Abbigliamento, Igiene, Documenti, Elettronica, Farmaci, Accessori, Extra |
| `ADDITIONAL_CATEGORY_NAMES` | Bambini, Animali |
| `CATEGORY_ORDER` | Core + additional (9 totali) |
| `CATEGORY_ID_MAP` | Nome IT → slug (`clothing`, `hygiene`, …) |
| `LEGACY_CATEGORY_ALIASES` | `Accessori & Organizzazione` → Accessori; `Salute` → Farmaci; ecc. |

`SuitcaseUtils.tsx` re-esporta helper — **non** definisce ordine proprio.

### `ui_state` (`SuitcaseUiState`)

| Campo | Ruolo |
|-------|--------|
| `hidden_category_ids` | Nasconde categoria in UI |
| `category_setup` | Per categoria: `{ enabled, seeded }` — quali standard items applicare |
| `dismissed_category_ids` | Categorie dismissate |
| `category_display_order` / `item_display_order` | Ordinamento UI |

---

## COMPOSIZIONE TEMPLATE TD (runtime)

1. `fetchGlobalTemplatesAsync()` → righe `suitcases` TD
2. `composeTdTemplateItemsFromCatalog()` (`packingTemplateComposition.ts`)
3. Item ephemeral con id `composed-{suitcaseId}-{n}` — **non** persistiti in `suitcase_items`

**Seed utente:** `packingSeedService.ts` scrive standard items su `suitcase_items` secondo `category_setup`.

---

## MOTORE AI SUGGERIMENTI

**Sorgente runtime:** `fetchActiveAiCatalogAsync()` → `packing_ai_catalog` (DB).

**Formula esclusione (macrofase C):**
```
Catalogo AI − (Standard seed [category_setup] + Template specifici + Esistenti + Rifiuti)
```
Implementata in `aiSuggestions.ts` → `buildCatalogExclusions()`.

**Legacy (non runtime):** `packingAiSeedSource.ts` (`TAG_ITEM_MAP`, `UNIVERSAL_DEFAULTS`) — solo riferimento admin/seed.

**Riferimento dominio congelato:** `packingDomainCatalog.ts` — validazione e generazione migration, non fetch runtime.

---

## SERVIZI PRINCIPALI

| File | Ruolo |
|------|--------|
| `packingCatalogService.ts` | CRUD/fetch 3 tabelle catalogo |
| `packingCompositionService.ts` | Composizione TD runtime |
| `packingSeedService.ts` | Seed standard su valigie utente |
| `suitcaseTemplateService.ts` | Fetch template, clone, city-type map |
| `suitcaseEditorialService.ts` | Admin TD → `packing_template_items` |
| `suitcaseCoreService.ts` | CRUD valigie, ui_state |
| `suitcaseItemsService.ts` | Persistenza `suitcase_items` |
| `suitcaseRejectionsService.ts` | Blacklist suggerimenti AI rifiutati |

**Hub hook:** `useSuitcaseSystem.ts` · **Panel:** `SuitcaseFloatingPanel/` · **Save collaborativo:** `useSuitcaseDocumentSave.ts`

---

## ADMIN EDITORIALE

`AffiliateEditorialCenter.tsx` — tab:
- `StandardItemsTab` → `packing_standard_items`
- `TemplateSpecificItemsTab` → `packing_template_items`
- `AiCatalogTab` → `packing_ai_catalog`
- `TemplateLibraryTab` → metadata template TD

---

## MIGRATION TIMELINE (riferimento)

| Migration | Scopo |
|-----------|--------|
| `20260616120000_create_packing_catalog_tables.sql` | CREATE 3 tabelle + RLS |
| `20260616120100_seed_packing_catalog.sql` | Seed + migrazione TD legacy → `packing_template_items` + DELETE TD `suitcase_items` |
| `20260622120000`–`20260622120400` (macrofase C) | Allineamento catalogo congelato, 7 template, AI catalog |

Script verifica vincoli pre-migration: `docs/packing/MACROFASE_C_MIGRATION_CONSTRAINTS.sql`

---

## INTEGRAZIONE COLLABORAZIONE

Valigie sono `shared_resource_kind: suitcase` — vedi `AI_CONTEXT/28_COLLABORATION_WORKSPACE_SYSTEM.md`.
Focus UI Valigia: `packingList` modal key → `UIMode.workspace` (vedi DOC 32 § Focus).

---

## CRONOLOGIA

| Versione | Data | Modifiche |
|----------|------|-----------|
| 1.0 | 2026-07-13 | Creazione SSOT WF-01; assorbimento `docs/packing/` |
