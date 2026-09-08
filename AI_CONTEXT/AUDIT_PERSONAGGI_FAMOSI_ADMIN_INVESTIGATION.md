# AUDIT — Personaggi famosi (Admin) — Investigation (ciclo 4)

> **Tipo:** Evidenze codice · flussi reali · correzioni al ciclo 3 · classificazione  
> **Data:** 2026-08-28  
> **Contratto:** [`AUDIT_PERSONAGGI_FAMOSI_ADMIN.md`](./AUDIT_PERSONAGGI_FAMOSI_ADMIN.md)  
> **Stato codice:** **NON MODIFICATO**

---

## Classificazione ciclo 4 (reale)

| # | Punto | Classificazione | Motivo sintetico |
|---|-------|-----------------|------------------|
| 1 | Coda discovery + scarti | **A — PRONTO / BASSO** | Flussi React-only verificati; schema unico + status `imported` persistito sufficiente |
| 2 | Pipeline one-click | **A — PRONTO / BASSO** | Pattern continue già in `fixPeopleBatch`; design F1–F4+checkpoint verificabile |
| 3 | Biografia + anti-invenzione | **A — PRONTO / BASSO** | Fallback inventivi individuati (`bio??fullBio`, completeness AI); regola e fix definiti |
| 4 | Modelli AI people | **A — PRONTO / BASSO** | ID testo/immagine **già presenti** nel repo; ritirata ipotesi `3.6-flash-image` |
| 5 | Mai delete automatico | **A — PRONTO / BASSO** | Inventario path completo (vedi §D4) |
| 6 | Count SoT | **A — PRONTO / BASSO** | Entry point enumerati |
| 7 | Fino a N | **A — PRONTO / BASSO** | Prompt oggi «Trova {count}»; fix chiaro |
| 8 | Esclusioni | **A — PRONTO / BASSO** | Oggi solo `peopleList` names; design exclusion list |
| 9 | Magic Fix (≠ Rigenera tutto) | **A — PRONTO / BASSO** | Flusso reale ricostruito §D6 |
| 10 | Save progressivo | **A — PRONTO / BASSO** | `saveCityPerson` non chiama AI |
| 11 | Bio breve | **A — PRONTO / BASSO** | Workaround da rimuovere; derive definita |
| 12 | Luoghi | **A — PRONTO / BASSO** | Correzione: **no** notes≥10 (ipotesi ciclo 3 ritirata) |
| 13 | Premi/opere | **A — PRONTO / BASSO** | Correzione: **no** max 2; colonne DB già esistono |
| 14 | Layout + careerStats | **A — PRONTO / BASSO** | careerStats **non** morto; placement deciso |
| 15 | Diagnostica publish | **A — PRONTO / BASSO** | Gate OK; UI amber/generica da portare a rosso+ARIA |
| 16 | AI JSON → dominio | **A — PRONTO / BASSO** | Cast e pass-through Json verificati |
| 17 | React key | **A — PRONTO / BASSO** | Causa `place.id` / stats |
| 18 | Immagini / 429 | **A — PRONTO / BASSO** | Swallow errori in vision verificato; Result tipizzato |
| 19 | Performance + ripresa | **A — PRONTO / BASSO** | Skip via gaps; continue-on-error |

**B — NON PRONTO:** nessuno.  
**C — DECISIONE PRODOTTO NECESSARIA:** nessuna bloccante.

**Checklist non bloccante pre-deploy:** confermare in ambiente live che enrich su `gemini-3.6-flash` (già usato in discovery) e portrait su `gemini-2.5-flash-image` restano OK con le API key di progetto.

---

# Correzioni rispetto al ciclo 3

| Ipotesi / decisione ciclo 3 | Esito verifica ciclo 4 |
|-----------------------------|-------------------------|
| Rinominare wipe → «Rigenera tutto (avanzato)» | **ERRATA** — confonde con `Genera Tutto` (Magic Add) e `RIGENERA PAGINA`. Magic Fix resta Magic Fix; wipe → gap-driven |
| `AI_MODEL_PEOPLE_IMAGE = gemini-3.6-flash-image` | **NON VERIFICATA** — ID assente nel repo. SoT immagine = `gemini-2.5-flash-image` (già in uso) |
| `notes.length >= 10` per luoghi | **RITIRATA** — criterio cosmetico vietato dal prodotto |
| `formatAwardsWorksLeftColumn` max 2 | **RITIRATA** — no limite dominio; UI scroll |
| «19/19 basso» senza verifica flusso Rigenera | **Sovra-dichiarato** — ciclo 4 ha ricostruito i flussi prima di riconfermare |
| careerStats «rimuovere dal layout» | **Incompleto** — campo vivo in DB/UI; placement deciso, non delete |

---

# D6 — Ricostruzione «Rigenera tutto» / Magic Fix / città (PRIORITARIA)

## Verdetto

**Non esiste** un unico pulsante Admin City Editor che esegue Generali → Valutazioni → Storia → Info → Media → POI → Log.

Esistono **cinque famiglie** distinte:

### 1) Magic Fix — **solo personaggio**

| | |
|--|--|
| UI | `CulturePeople.tsx`: «Magic Fix (Tutti/N)», «Magic Fix (Dati)» |
| Hook | `usePeopleAI.wipeAndRewritePerson` / `fixPeopleBatch` |
| Cosa fa | `enrichPersonData` → completeness → `saveCityPerson` (stesso `id`, status draft) |
| Delete people? | **No** |
| Label «Rigenera tutto»? | **No** nel codice |

Bulk già **continua** sulle persone successive dopo fallimento (`fixPeopleBatch` conta failed e prosegue).

### 2) RIGENERA PAGINA (Storia & Cultura)

| | |
|--|--|
| UI | `TabCulture.tsx` «RIGENERA PAGINA» |
| Helper | `editorCultureRegeneration.ts` |
| Ordine | history + patron + `suggestCityPeople(count=4)` → prepare complete → **insert nuovi** → save details → **`removeCityPeopleByIds(existingIds)`** |
| Delete people? | **Sì** (replace) se prepared>0 |
| Nota | `EditorCulture.tsx` è duplicato **non wired** in AdminCityEditor |

### 3) Completa Città (AI) — orchestrazione multi-dominio

| | |
|--|--|
| UI | `CitiesListTab` + `CompleteCityModal` «Avvia Processo Completo» |
| Hook | `useAiCompleteCity.executeCompleteCity` |
| Ordine | Setup → Generali/Stats → Valutazioni → Storia/Patrono → **Personaggi** → Servizi → Media check → POI opzionale → Log |
| Delete people? | **Sì** delete-all se prepared>0 (`useAiCompleteCity.ts` ~288–291) |
| È «Rigenera tutto» editor? | **No** — parte dalla **lista città** |

### 4) Genera Tutto / + Città (AI) — Magic Add («Magic City» in audit)

| | |
|--|--|
| UI | `CityGeneratorModal` bottone **«Genera Tutto»**; lista `+ Città (AI)` |
| Hook | `useAiMagicCity.executeMagicAdd` |
| Ordine | Analisi/creazione (general, stats, history, ratings, patron, services, people) → Flash POI ×6 → servizi → enrich draft people → Log |
| Delete people? | **No** (insert/enrich) |
| Label trap | ZoneCard può etichettare «COMPLETA CITTÀ» ma chiamare Magic Add |

### 5) RIGENERA PAGINA per-tab (non people)

- Generali: `TabGeneral`  
- Valutazioni: `TabRatings`  
- Info: `EditorInfo` MERGE & FIX (può cancellare **servizi**, non people)  
- Media: metadati  

**Indipendenti** — nessun orchestratore editor le concatena.

## Cosa deve continuare / cosa cambiare

| Comando | Continuare? | Modifica people |
|---------|-------------|-----------------|
| Magic Fix | Sì | Gap-driven; no wipe default |
| Completa Città | Sì (comando città) | **No delete**; count SoT; esclusioni+scarti; preferire pipeline/add |
| Genera Tutto / Magic Add | Sì | Esclusioni+scarti; count SoT; enrich gap-driven |
| RIGENERA PAGINA Storia | Sì (storia+patron) | **No** `removeCityPeopleByIds`; solo add nuovi validi esclusi |
| RIGENERA altri tab | Sì | Nessuna modifica people |

---

# Evidenze per punto

## D1 — Discovery state (coda attuale)

`usePeopleAI.ts`: `discoveryResults` = `useState` only.  
Import filtra **solo** il nome importato.  
X rimuove da state **senza** scarto persistito.  
Refresh → coda persa.  
**Schema `city_people_discovery_items` con `imported` persistito** è sufficiente e allineato al prodotto (storico + esclusione).

## D2 — Pipeline continue-on-error

`fixPeopleBatch` già: try/catch per persona → `failedCount++` → throttle → next.  
Target one-click: stesso pattern + checkpoint DB tra F2/F3/F4.

## D3 — Anti-invenzione — punti pericolosi oggi

| Punto | File | Rischio |
|-------|------|---------|
| `bio ?? fullBio` | `peopleCompletenessPipeline.ts` `toDraftFromInput` | Maschera bio mancante con fullBio → falso «completo» |
| Completeness AI | stesso file | Può generare bio/date per chiudere gate |
| Prompt enrich | `buildEnrichPersonPrompt` «Bonifica totale» | Incentiva riscrittura completa |
| Discovery fallback | `Trova {count}` | Spinge count esatto |

Fix: anti-invention rules + omettere se incerto + Magic Fix non inventa per publish.

## D4 — Tutti i delete `city_people`

| Path | File | Automatico AI? |
|------|------|----------------|
| Complete City delete-all | `useAiCompleteCity.ts` | **Sì — da rimuovere** |
| Rigenera Cultura cleanup | `TabCulture` / `EditorCulture` + `removeCityPeopleByIds` | **Sì — da rimuovere** |
| Rollback insert fallito | `editorCultureRegeneration` / TabCulture | Solo ID creati in run — OK |
| Manuale admin | `usePeopleData.deletePerson` | No — OK |
| Delete città | `cityLifecycleService.deleteCity` | Lifecycle — OK |
| Suggestion rollback | `famousPersonSuggestionService.ts` | Rollback accept — OK |
| reclaim orphans | `cityLifecycleService` | People **skipped** (comment L64-65) |

## D5 — Modelli

| Uso | ID nel codice | Prova |
|-----|---------------|-------|
| Discovery | `gemini-3.6-flash` | `peopleGenerator.ts` L59 |
| Enrich / completeness | `gemini-2.5-flash` | peopleGenerator L89; completeness L217/254 |
| Portrait | `gemini-2.5-flash-image` | `aiVision.ts` L80; anche SafeArt, socialMarketing |
| `gemini-3.6-flash-image` | — | **Assente** nel repo |

SoT ciclo 4: TEXT→3.6-flash; IMAGE→2.5-flash-image.

## D7 — Save senza AI

`entitiesService.saveCityPerson` / `saveCityPerson` = Supabase write only.  
Nessuna chiamata AI nel save path.  
Checkpoint = chiamare save **dopo** AI già completata.

## D8 — Luoghi / premi

- `related_places` Json pass-through in `parsePerson` (no validazione).  
- `awards` / `famous_works` colonne DB esistenti; schema prompt include `famousWorks` ma **non** `awards` né `careerStats`.  
- UI pubblica: awards/works **non** renderizzati; careerStats **sì** se length>0.

## D9 — careerStats

| Stage | Stato |
|-------|--------|
| DB `career_stats` | Vivo |
| parsePerson | Pass-through tipizzato debole |
| Prompt schema | **Non** incluso |
| CultureCornerModal | Render griglia |
| CulturePeople admin | Non editabile |

**Non è codice morto.** Placement contratto: fascia compatta tra quote e bio.

## D10 — Cast / parser

- `peopleGenerator.ts`: `(parsed as PersonEnrichmentResult)`  
- completeness: `parsed as Record<string, unknown>` poi pick campi  
- parsePerson: related_places / career_stats non sanitizzati  

## D11 — React key

`CultureCornerModal`: `key={place.id}`; `key={`${stat.label}:${stat.value}`}`.  
Discovery cards: key composita name+slugs — più robusta.

## D12 — Immagini / errori

`generateHistoricalPortrait`: catch → warn → `null` (perde classificazione).  
`withRetry`: 429|quota|resource_exhausted → `QUOTA_EXCEEDED_DAILY` (collassa rate limit e quota).  
`AiEdgeError` distingue `RATE_LIMIT` vs `QUOTA_EXCEEDED` sul path edge tipizzato — **riutilizzare** dove possibile; portrait oggi passa da `generateLegacy` e swallow locale.

`regeneratePortrait` in `usePeopleAI` + bottone CulturePeople: **esiste**; insufficiente il feedback errore.

## D13 — Count entry point

| File | Valore |
|------|--------|
| CulturePeople select | 1,3,5 |
| TabCulture | 4 |
| editorCultureRegeneration default | 5 |
| CompleteCityModal | 5,10,**15** |
| useAiMagicCity | 5 |

---

# Coerenza incrociata (ciclo 4)

| Vincolo | OK? |
|---------|-----|
| No delete AI people | Design fix Complete+Rigenera; Magic Fix ≠ delete |
| No perdita lavoro | Checkpoint + discovery_items |
| Esclusioni scarti/imported | Status persistiti |
| No inventare quantità/campi | Prompt+parser+no completeness inventiva |
| city_id | Già su city_people |
| Magic Fix ≠ Genera Tutto | Separati esplicitamente |
| Save ≠ AI call | Verificato |
| careerStats non perso | Placement + schema F2 opzionale |

---

# Questioni ancora aperte

**Nessuna decisione prodotto bloccante.**

Residui **non bloccanti** (pre-deploy / implementazione):

1. Smoke live modelli people (text 3.6, image 2.5) con chiavi progetto.  
2. Aggiornare setting Production `PROMPT_PEOPLE_SUGGEST` insieme al fallback codice.  
3. Dopo implementazione: test funzionali end-to-end (non in questo ciclo).

---

# Piano implementazione (invariato nell’ordine logico)

1. Migration discovery_items + service  
2. Dominio SoT (count, bio, places, gaps, exclusion)  
3. aiModelConfig + famousPersonAiParser  
4. Prompt anti-invention + F2/F3 + Production setting  
5. Pipeline one-click + gap Magic Fix  
6. Entry point count/esclusioni; **rimuovere** delete AI people  
7. UI CulturePeople + CultureCornerModal + diagnostica  
8. Vision Result tipizzato + inert + bootstrap  
9. Smoke + doc `17_CITY_CULTURE_SYSTEM.md`

---

# Changelog

| Data | Nota |
|------|------|
| 2026-08-28 | Ciclo 2–3 |
| 2026-08-28 | **Ciclo 4:** ricostruzione comandi città vs Magic Fix; inventario delete; correzione modelli/luoghi/premi/careerStats; classificazione A×19 |
