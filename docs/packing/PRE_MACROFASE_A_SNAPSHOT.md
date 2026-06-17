# Snapshot pre-MACROFASE A — Dominio Valigia

Documento di riferimento storico generato **prima** dell'implementazione della MACROFASE A.  
Data: 2026-06-16.

---

## 1. Categorie (sorgenti di verità pre-refactor)

### Sorgente primaria UI
**File:** `src/components/features/diary/packing_list/suitcase/SuitcaseUtils.tsx`

```typescript
STABLE_CATEGORY_ORDER = [
  'Abbigliamento', 'Igiene', 'Documenti', 'Elettronica', 'Farmaci',
  'Bambini', 'Animali', 'Accessori & Organizzazione', 'Extra'
]

SYSTEM_CATEGORY_ID_MAP = {
  Abbigliamento → clothing, Igiene → hygiene, Documenti → documents,
  Elettronica → electronics, Farmaci → meds, Bambini → kids,
  Animali → pets, 'Accessori & Organizzazione' → accessories, Extra → extra
}
```

### Sorgenti duplicate / parallele
| File | Contenuto |
|------|-----------|
| `SuitcaseUtils.tsx` L149–159 | Switch emoji `ItemCategoryIcon` (9 case hardcoded) |
| `templateCategoryIcons.tsx` | `ITEM_CATEGORY_ICONS_MAP` (6 voci, **file orfano**) |
| `aiSuggestions.ts` L13 | Commento + stringhe categoria inline in `TAG_ITEM_MAP` |
| `TemplateLibraryTab.tsx` L199 | Dropdown admin: Documenti, Elettronica, **Salute**, Abbigliamento, **Accessori**, **Altro** |
| `AdminHeaderManager.tsx` L22–29 | `SUITCASE_PLACEHOLDER_CATS` (6 voci, no Farmaci/Bambini/Animali) |
| `SuitcaseUtils.tsx` L301–315 | `CATEGORY_MAP_TO_ADMIN` (mapping affiliate parziale) |
| `EditorialCenterTabs.tsx` L13–19 | `affinityMap` con `salute` invece di `farmaci` |

### Comportamento UI categorie
- `SuitcaseEditorView` e `TemplatePreview` renderizzano **sempre tutte e 9** le categorie system + custom.
- `ui_state.hidden_category_ids` = nascondere in UI, **non** assenza categoria.
- Nessun `category_setup` in `ui_state`.

### DB categorie
- **Nessuna tabella `categories`.**
- `suitcase_items.category` = testo libero (valori legacy possibili: `Salute`, `Altro`, `Accessori & Organizzazione`).

---

## 2. Template TD (sorgenti pre-refactor)

### Identificazione
`user_id IS NULL` → `isTdTemplate()` in `src/utils/suitcaseDomain.ts`

### Caricamento
- `fetchGlobalTemplatesAsync()` → `suitcases` + join `suitcase_items`
- File: `src/services/suitcase/suitcaseTemplateService.ts`

### Composizione contenuto
- **Unica sorgente:** righe in `suitcase_items` collegate al template TD.
- Nessun concetto Standard Core / Specifici Template nel codice.
- Admin: `TemplateLibraryTab.tsx` scrive direttamente su `suitcase_items` con dropdown legacy.

### Flussi clone/use
- `createDraftWorkspaceFromTemplate` copia `template.suitcase_items`
- RPC `clone_suitcase` copia `suitcase_items` WHERE `is_ai_suggestion = false`

---

## 3. Standard items (pre-refactor)

**Non esistevano come entità.**

Proxy impliciti:
- `UNIVERSAL_DEFAULTS` in `src/hooks/suitcase/aiSuggestions.ts` (9 item, usati dall'AI)
- Item sparsi in `TAG_ITEM_MAP` per categoria
- Dati in `suitcase_items` sui template TD (non strutturati)

---

## 4. Catalogo AI (pre-refactor)

**File:** `src/hooks/suitcase/aiSuggestions.ts`

- `TAG_ITEM_MAP`: ~17 chiavi tag, ~181 item totali (commento L12)
- `UNIVERSAL_DEFAULTS`: 9 item sempre candidati
- **Hardcoded** — ogni modifica richiede deploy
- Categorie usate: include `Accessori & Organizzazione`, `Contanti` sotto `Documenti`

### Flusso AI
```
candidates = UNIVERSAL_DEFAULTS + TAG_ITEM_MAP[tags]
           − duplicati − rejections − existingItems
           − filtro selectedCategories (UI)
```

**Non** implementa: `Catalogo − (Standard + Template + Esistenti + Rifiuti)`

### UI AI categorie
- `AiSuggestionsModal.tsx` usa `STABLE_CATEGORY_ORDER` (prime 4 default)

---

## 5. Schema DB rilevante (pre-MACROFASE A)

| Tabella | Ruolo |
|---------|-------|
| `suitcases` | Template TD, template USER, valigie |
| `suitcase_items` | Item su valigie **e** template TD |
| `suitcases.custom_categories` | JSONB categorie custom utente |
| `suitcases.ui_state` | `{ hidden_category_ids: string[] }` |
| `suitcase_rejections` | Blacklist AI |
| `city_template_map` | Suggerimento template per city_type |

**Assenti:** `packing_standard_items`, `packing_template_items`, `packing_ai_catalog`

---

## 6. Admin pre-refactor

**File:** `src/components/features/diary/packing_list/suitcase/AffiliateEditorialCenter.tsx`

| Tab | Funzione |
|-----|----------|
| overrides | Override affiliate per item template |
| global | Suggerimenti globali affiliate |
| library | TemplateLibraryTab — metadata + **item su suitcase_items** |

---

## 7. Disallineamenti noti (pre-refactor)

| Area | Problema |
|------|----------|
| Nome Accessori | `Accessori & Organizzazione` in codice vs `Accessori` nel dominio |
| Farmaci | Categoria system ma admin usa `Salute` |
| Bambini/Animali | Sempre in UI, dominio = aggiuntive OFF by default |
| Template TD | Item monolitici in `suitcase_items`, non Core+Specifici |
| AI | Suggerisce standard (`UNIVERSAL_DEFAULTS`), non per differenza |
| Standard items | Nessuna sorgente DB |

---

*Fine snapshot — lo stato del codice a partire da questo punto viene modificato dalla MACROFASE A.*
