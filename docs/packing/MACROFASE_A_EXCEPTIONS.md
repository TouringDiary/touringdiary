# MACROFASE A — Eccezione temporale documentata

## Motore AI (`aiSuggestions.ts`)

**Stato:** eccezione **risolta in MACROFASE C**.

| Aspetto | Prima (MACROFASE A) | Dopo (MACROFASE C) |
|---------|---------------------|---------------------|
| Catalogo candidati | `TAG_ITEM_MAP` + `UNIVERSAL_DEFAULTS` hardcoded | `packing_ai_catalog` (DB) via `fetchActiveAiCatalogAsync` |
| Formula differenza | Non implementata | `Catalog − (Standard seed + Template specifici + Esistenti + Rifiuti)` |

Il catalogo DB è la sorgente runtime; `packingAiSeedSource.ts` resta come riferimento legacy/admin.

## `suitcase_items` su template TD

**Rimosso come sorgente di verità** per template TD (`user_id IS NULL`).

I dati legacy sono stati migrati in `packing_template_items` e le righe TD in `suitcase_items` eliminate dalla migrazione seed.

Valigie utente e template USER continuano a usare `suitcase_items`.
