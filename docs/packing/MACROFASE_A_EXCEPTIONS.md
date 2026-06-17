# MACROFASE A — Eccezione temporale documentata

## Motore AI (`aiSuggestions.ts`)

**Stato:** eccezione **documentata e intenzionale** fino a MACROFASE C.

| Aspetto | Sorgente attuale | Sorgente target (MACROFASE C) |
|---------|------------------|-------------------------------|
| Catalogo candidati | `TAG_ITEM_MAP` + `UNIVERSAL_DEFAULTS` hardcoded | `packing_ai_catalog` (DB) |
| Formula differenza | Non implementata | `Catalog − (Standard + Template + Esistenti + Rifiuti)` |

Il catalogo DB è già creato, popolato (~170 item) e modificabile da admin senza deploy.

## `suitcase_items` su template TD

**Rimosso come sorgente di verità** per template TD (`user_id IS NULL`).

I dati legacy sono stati migrati in `packing_template_items` e le righe TD in `suitcase_items` eliminate dalla migrazione seed.

Valigie utente e template USER continuano a usare `suitcase_items`.
