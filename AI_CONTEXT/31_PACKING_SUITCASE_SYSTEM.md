# 31 — Packing & Suitcase System

> **SSOT packing / Valigia** allineato al dominio Viaggio congelato.
> Dominio Viaggio → `37_VIAGGIO_DOMAIN.md`.  
> MySpace / Strumenti → `35_MYSPACE_PRODUCT_VISION.md`.  
> Collaborazione → `28_COLLABORATION_WORKSPACE_SYSTEM.md`.
>
> **Parte A** = regole di dominio (SoT prodotto).  
> **Parte B** = runtime packing certificato sul codice (motore catalogo / item) — non ridefinisce l’appartenenza al Viaggio.

**Versione:** 2.0.0  
**Data:** 2026-07-26  
**Stato:** Dominio prodotto congelato · motore packing as-is

---

## DESCRIZIONE SEMPLICE

Il sistema gestisce packing list (valigie), template TouringDiary e template utente.  
Nel mondo MySpace esistono **due case** distinte:

1. **Valigia del Viaggio** — appartiene a un Viaggio (patrimonio).  
2. **Strumenti** — valigie e template **permanenti** dell’utente, senza appartenere a un Viaggio.

---

# PARTE A — Target di dominio

## A1. Due case packing

| Casa | Collocazione | Appartenenza |
|------|--------------|--------------|
| **Valigia del Viaggio** | MySpace → I miei Viaggi → [Viaggio] → Valigia | Aggregate Root = **Viaggio** |
| **Strumenti** | MySpace → Strumenti → Le mie Valigie / I miei Template | Utente; **fuori** dal Viaggio |

Regole:

1. Una valigia del viaggio **non** è uno strumento permanente.
2. Uno strumento permanente **non** diventa automaticamente valigia di un viaggio senza un atto esplicito di copia/associazione (policy Save — implementazione).
3. Cardinalità: un Viaggio può avere **0..N** Valigie (DOC 37).
4. Empty Viaggio senza Valigia è legittimo.

## A2. Collaborazione

- Kind condividibile: Valigia (`suitcase`) — share per risorsa resta.
- In Workspace-da-Viaggio: la sezione Valigia della shell può ricevere la copia selezionata o restare vuota.
- Mai condividere il Viaggio originale per “portare la valigia”.

## A3. Template

| Tipo | Ruolo prodotto |
|------|----------------|
| Template TD | Cataloghi ufficiali TouringDiary (non patrimonio Viaggio) |
| Template utente | In **Strumenti**; riusabili; non sono sezioni del Viaggio |

## A4. Confine anti–debito

Vietato collassare Valigia-viaggio e Strumenti in un’unica lista senza contesto.  
Vietato usare la Valigia come Aggregate Root al posto del Viaggio.

---

# PARTE B — Runtime packing (as-is certificato)

> Motore item/categorie/AI packing — verificato su codice e migration (giugno–luglio 2026).  
> L’as-is oggi lega spesso le valigie a itinerari/diari (`itinerary_suitcases`): è **debito** rispetto alla Parte A fino alla migrazione sul Viaggio.

### B1. Entità (`suitcaseDomain.ts`)

| Tipo | Condizione | Storage item |
|------|------------|--------------|
| Template TD | `user_id IS NULL` | Nessun `suitcase_items` — composizione runtime da catalogo |
| Template utente | `user_id` + `is_user_template` | `suitcase_items` |
| Valigia utente | `user_id` + non template | `suitcase_items` |

### B2. Tabelle catalogo

| Tabella | Ruolo |
|---------|--------|
| `packing_standard_items` | Item standard; `tier`: `core` \| `additional` \| `additional_ai_only` |
| `packing_template_items` | Item specifici template TD |
| `packing_ai_catalog` | Catalogo AI |

**Categorie:** solo frontend — SSOT `src/domain/packing/packingCategories.ts`.

### B3. Template TD canonici

7 template: Mare, Fiumi & Laghi, Montagna, Cultura, Business, Weekend, Famiglia.

### B4. Composizione e AI

1. `fetchGlobalTemplatesAsync()` → `composeTdTemplateItemsFromCatalog()`
2. Seed utente: `packingSeedService.ts`
3. Suggerimenti AI: `fetchActiveAiCatalogAsync()` + `buildCatalogExclusions()` in `aiSuggestions.ts`

### B5. Servizi principali

| File | Ruolo |
|------|--------|
| `packingCatalogService.ts` | Catalogo |
| `packingCompositionService.ts` | Composizione TD |
| `packingSeedService.ts` | Seed |
| `suitcaseTemplateService.ts` | Template / clone |
| `suitcaseCoreService.ts` | CRUD valigie, ui_state |
| `suitcaseItemsService.ts` | Item |
| `suitcaseRejectionsService.ts` | Rifiuti AI |

Hub: `useSuitcaseSystem.ts` · Panel: `SuitcaseFloatingPanel/` · Save collaborativo: `useSuitcaseDocumentSave.ts`

### B6. Admin editoriale

`AffiliateEditorialCenter.tsx` — Standard / Template-specific / AI catalog / Template library.

### B7. Focus UI

Focus Valigia: chiave modal `packingList` (vedi DOC 32).  
Integrazione collaborazione: `shared_resource_kind: suitcase` → DOC 28.

---

## Cronologia

| Versione | Data | Note |
|----------|------|------|
| 1.0 | 2026-07-13 | SSOT packing post-macrofase C |
| 2.0.0 | 2026-07-26 | Riscrittura: Valigia-viaggio vs Strumenti; runtime in Parte B |
