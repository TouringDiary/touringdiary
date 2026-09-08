# DOC 17: CITY CULTURE SYSTEM

Questo documento descrive il sistema Angolo Cultura / Personaggi Famosi di TouringDiary.

> SoT implementativo dettagliato: `AI_CONTEXT/AUDIT_ANGOLO_CULTURA_TIMELINE.md` (Fasi 3–5).

---

## DESCRIZIONE SEMPLICE

Modulo che racconta la città attraverso personaggi famosi: timeline cronologica, card, filtri Master/Specific e anno di nascita, dettaglio biografico e luoghi correlati.

## DESCRIZIONE TECNICA

- Tabella personaggi: `city_people` (date strutturate, `lifespan_display`, **senza** `role`).
- Tassonomia globale: `famous_person_master_categories` → `famous_person_specific_categories`.
- Relazione N:M: `city_person_category_links` (Person ↔ Specific; Master derivato).
- Soft-delete categorie: `is_active` + `deleted_at` (nessun hard delete applicativo).

---

## PIPELINE RUNTIME

1. Entry: `CityHeader` → `CityDetailContent` (`activeModal === 'culture'`).
2. Load: `getCityPeople` / `getCityPeopleByCityIds` (+ embed categorie).
3. UI: `CultureCornerModal` — HEADER → timeline → rail → indicatore index → dettaglio keep-mounted.
4. Filtri: un motore (`famousPersonFilter`) — Master OR ∧ Specific OR ∧ birth_year inclusivo.
5. Selezione: state machine §F4.2 (`famousPersonSelection` + sessionStorage keyed by `cityId`).

---

## COMPONENTI

| Ruolo | Path |
|-------|------|
| UI pubblica | `CultureCornerModal.tsx` |
| Entry città | `CityHeader.tsx`, `CityDetailContent.tsx` |
| Admin editor | `CulturePeople.tsx` |
| Admin taxonomy | `AdminFamousPeopleCategoriesManager.tsx` |
| Services | `entitiesService.ts`, `famousPersonCategoryService.ts` |
| Domain | `famousPersonCompleteness`, `famousPersonDates`, `famousPersonFilter`, `famousPersonSelection`, `famousPersonCategories` |

## ENTITÀ `city_people` (campi chiave)

- `city_id`, `name`, `bio`, `full_bio`, `image_url`
- `birth_year`, `birth_date`, `is_living`, `death_year`, `death_date`, `lifespan_display`
- `status`, `order_index`, related places / works / stats
- **Non esiste** `role` (sostituito dalle Specific)

## ADMIN

- Manager categorie: sidebar **Categorie Personaggi** (`admin_all` e `admin_limited`).
- City Editor: multi Specific, date, recovery AI date, publish gate, warning ≥6 Specific.

## AI DISCOVERY (CulturePeople)

- Tassonomia runtime: `loadFamousPersonTaxonomy({ activeOnly: true })` → inject nel prompt (`STANDARD CATEGORIE`).
- Template configurabile: `global_settings.prompt_people_suggest` (`SETTINGS_KEYS.PROMPT_PEOPLE_SUGGEST`).
- Placeholder obbligatori del contratto: `{categoriesBlock}`, `{schemaHint}` (oltre a `{cityName}`, `{count}`, `{contextStr}`, `{exclusionStr}`).
- `mergePeopleSuggestPromptContract`: contratto Production = placeholder `{categoriesBlock}` / `{schemaHint}` (injection runtime garantita). Legacy **delimitato** (categorie → schema → `OUTPUT JSON ARRAY` a inizio riga): strip integrale + canonico. Legacy **non** delimitabile: testo intatto, **nessun** append del canonico per quello slot (evita due contratti nel prompt); normalizzazione completa = migrare al template con placeholder. Mai EOF. Validazione import: `validateAiSpecificSlugs`.
- Import: `validateAiSpecificSlugs` prima di foto/enrichment/save; nessuna accettazione di slug inventati.
