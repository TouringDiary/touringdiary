# B2a Batch C1 — Audit di avvio (Product Owner)

> **Stato:** **ACCETTATO** — Batch C1 **concluso** (2026-08-07). Perimetro live **71** → **0**. Gate tecnici OK. Batch C **completo**.  
> Metodologia: SoT Parte 5 **§21 / §21.1 / §22**.  
> SoT: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md) · Indice C: [`B2a_BATCH_C_INDEX.md`](./B2a_BATCH_C_INDEX.md) · Dettaglio storico hit: [`B2a_C1_AI_AUDIT.md`](./B2a_C1_AI_AUDIT.md) · [`B2a_C1_AI_AUDIT_P2.md`](./B2a_C1_AI_AUDIT_P2.md)  
> Predecessore: **C6 — Utils** **ACCETTATO**. Successore: residui B / altri L2 (Batch C chiuso).

---

## Verdetto (dopo §22)

| Domanda | Risposta |
|----|----|
| **Punto di partenza** | **C1 — AI / Gemini** (contratti generatore città + UI AI correlate + facade) |
| **Suddivisione in mini-batch?** | **No** — unico batch omogeneo sul flusso AI |
| **Forma** | **Un unico batch** — perimetro live **71** `noExplicitAny` / **19** file |
| **Perché** | Stesso contratto end-to-end (facade → validation → generators → consumer AI). Spezzarlo lascerebbe boundary deboli e doppio ACCETTO sullo stesso flusso |
| **Ordine interno (non è suddivisione)** | DTO shared → generator boundary → `verifyDraftsBatch` → Magic/Complete → facade → rest UI. **Un solo** ACCETTO PO a fine batch |
| **Bonifica codice** | **Completata** — 71 → 0; typecheck OK; build OK; QD1–QD3 non necessari |

### Rivalutazione mini-batch (risposte esplicite)

1. **Esiste motivazione architetturale che obbliga a dividere C1?**  
   **No.** Magic / Complete / Flash / Validate / Targeted / People condividono runner, generator e facade. Analytics / Planner / Hunter sono nello stesso dominio «AI contracts» e restano nello stesso ACCETTO.

2. **C1 può essere un unico batch a rischio ancora accettabile?**  
   **Sì, con ordine boundary-first** (sezione B). Rischio complessivo **Alto** (Gemini + persistenza città), ma un solo ciclo review evita facade half-typed.

3. **Quando una suddivisione diventerebbe legittima?**  
   Solo se in implementazione emergesse un touch obbligatorio fuori dominio AI (es. rifattorizzare packing/undo) — **fermare e chiedere al PO**. Analytics V4 da solo **non** giustifica uno split: 8 hit ma stesso batch C1 storico.

4. **Cosa NON giustifica la frantumazione**  
   - «67 hit storici» senza facade (obsoleto: live operativo = **71**/19).  
   - Spezzare Magic vs Complete (stesso `verifyDraftsBatch` + generator).  
   - Tabella storica C1-M1…Mrest — **non** piano obbligatorio di esecuzione.

---

# A) Visione funzionale (UI e dominio)

## A.1 Di cosa stiamo parlando

L’Admin genera e completa contenuti città con **Gemini** (nuova città AI, completa città, bozze POI, validazione bozze, personaggi, hunter servizi). L’utente consumer usa il **Magic Planner AI**. La Control Tower mostra analytics AI.

Il gruppo **C1** tipizza i contratti in cui quel flusso usa ancora `any` — **senza** cambiare prompt, quote, UX, regole di generazione o layout.

## A.2 Dove si trova (superfici prodotto)

| Area prodotto | Voce / percorso (etichette UI reali) |
|----|----|
| Admin — Territorio | **Manager POI - DB** → lista / mappa → **+ Città (AI)** / **COMPLETA CITTÀ (AI)** |
| Admin — Editor città | Tab **Punti Interesse** → **NUOVO POI (AI)** / **Bonifica (N)** |
| Admin — Editor città | Tab **Storia** → **Personaggi Famosi** → **Deep Discovery** / **Suggerisci** |
| Admin — Editor città | Tab **Info & Guide** → **AI Hunter** |
| Admin — Business | **Control Tower** (`ai_economics`) → tab **Analytics & Margini** |
| Consumer — Diario | Toolbar → **Magic Planner AI** → genera itinerario |
| Suitcase | Flusso **Suggerimenti AI** via modal (il file `AiSuggestionsPanel` è orphan — vedi A.7) |

## A.3 Flusso completo (prodotto) — nucleo città AI

```text
[1] Admin apre Manager POI - DB
        ↓
[2a] ★ C1 ★ Magic Add (+ Città AI / Genera Tutto)
        → useCityGenerator → useAiMagicCity → generators + verifyDraftsBatch
[2b] ★ C1 ★ Complete City (1 città selezionata → Completa Città AI)
        → useCityGenerator → useAiCompleteCity → generators (+ optional deep scan)
[2c] ★ C1 ★ Flash + Bonifica bozze (tab Punti Interesse)
        → generateDraftsOnly / verifyDraftsBatch → poiGenerator
        ↓
[3] ProcessLogModal mostra step/log runner
        ↓
[4] Dati persistiti su città / POI / people / servizi (invariati a runtime)
```

## A.4 Impatto sul prodotto

| Se la bonifica è corretta | Se è errata |
|----|----|
| Magic / Complete / Flash / Bonifica invariati | Generazione fallisce o salva campi sbagliati |
| Stesse categorie POI / people | Cast `PoiCategory` rifiuta valori validi o scrive category errata |
| Planner consumer invariato | Itinerario non si genera / timeline vuota |
| Analytics KPI invariati | Dashboard economics vuota o NaN |

## A.5 Rischi di una modifica errata

| Rischio | Sintomo in UI |
|----|----|
| `verifyDraftsBatch` tipizzato troppo stretto | Bonifica / Magic validation crash o 0 aggiornati |
| Draft POI incompleto | Flash crea bozze senza name/category |
| Facade `config` / `cats` errati | Complete City / Flash non partono |
| Analytics DTO ≠ RPC | Tab Analytics vuota |
| Cast categoria forzato | POI salvati con category sbagliata |

## A.6 Dipendenze con gli altri gruppi C

| Gruppo | Relazione con C1 |
|----|----|
| **C3 (chiuso)** | Riuso `PointOfInterest`, `FamousPerson`, `PoiCategory`, tipi City — **obbligatorio** |
| **C2 / C4 / C5 / C6 (chiusi)** | **Fuori scope** — non riaprire |
| **Residuo B** packing (`useFloatingPanelOptimisticUpdates`) | **Fuori C1** |
| **Residuo B** `CampaignsPanel` | Marketing — **fuori C1** |
| Tipi AI già presenti | `src/types/ai/cityGeneration.ts`, `src/services/ai/types.ts` — **riuso** |

## A.7 Lacune dichiarate (§21.1)

| Cosa | Stato |
|----|----|
| Voce sidebar esatta **Manager POI - DB** / **Control Tower** | Verificare etichetta reale se rename recente |
| ZoneCard **COMPLETA CITTÀ (AI)** | Etichetta fuorviante: esegue **Magic Add**, non `executeCompleteCity` |
| `generateTargetedPois` | **Nessun caller UI** — API morta per QA; tipizzare comunque (facade) |
| `AiSuggestionsPanel.tsx` | **Orphan** (0 import); QA suitcase AI usa `AiSuggestionsModal`, non questo file |
| `eventTaxonomy.ts` | **Unused** (0 import); Eventi Globali legge settings direttamente |
| Ambiente Gemini / quote / admin role | Smoke richiede Admin autenticato + AI operativa |
| Guest su Planner | Blocco `guest_ai_block` — smoke con utente non-guest |

## A.8 Percorso QA primario — Magic Add (obbligatorio)

**Prerequisito:** Admin autenticato; AI Gemini disponibile; ambiente di test.

1. Aprire TouringDiary Admin.  
2. **Territorio → Manager POI - DB**.  
3. **+ Città (AI)** → modal **Nuova Città AI** → **Genera Tutto** (città di test).  
4. Attendere **Process Log** fino a completamento senza crash.  
5. Verificare che la città/bozze compaiano in lista (comportamento invariato rispetto al pre-bonifica).

## A.9 Percorsi QA secondari (obbligatori per ACCETTO dove raggiungibili)

| # | Percorso | Cosa verificare |
|---:|----|----|
| S1 | Lista: seleziona **1** città → **COMPLETA CITTÀ (AI)** → **Avvia Processo Completo** | Complete City completa senza crash |
| S2 | Apri città → **Punti Interesse** → **NUOVO POI (AI)** → **Avvia Ricerca Flash** | Bozze create |
| S3 | Seleziona bozze → **Bonifica (N)** | `verifyDraftsBatch` aggiorna bozze (non usare «Bonifica Pro Daily») |
| S4 | Tab **Storia** → Personaggi → **Suggerisci** / Deep Discovery | Discovery people senza crash |
| S5 | Tab **Info & Guide** → **AI Hunter** → Trova / Aggiungi | Hunter invariato |
| S6 | Consumer Diario → **Magic Planner AI** → genera itinerario | Timeline/itinerario invariati |
| S7 | Business → **Control Tower** → **Analytics & Margini** | KPI caricano (non usare AI Control Center limiti) |

**Non eseguibili (lacune A.7):** Targeted POIs; smoke diretto su `AiSuggestionsPanel` / `eventTaxonomy.ts` — tipizzazione in batch, smoke N/A; annotare in chiusura.

## A.10 Schermate coperte dal batch unico C1

| Superficie UI | File C1 principali |
|----|----|
| Facade + Magic / Complete / Flash / Validate | `useCityGenerator`, `useAiMagicCity`, `useAiCompleteCity`, `useAiFlashSearch`, `useAiValidation`, `useAiTaskRunner` |
| Generators | `listGenerator`, `peopleGenerator`, `poiGenerator`, `qualityGenerator`, `prompts` |
| People editor | `usePeopleAI` |
| Service Hunter | `ServiceAiHunter` |
| Planner consumer | `aiPlanner`, `AiPlannerTimeline` |
| Economics Analytics | `AdminAiAnalyticsV4` |
| Orphan / unused (tipizzare, smoke N/A) | `AiSuggestionsPanel`, `eventTaxonomy`, `useAiTargetedSearch` (API senza UI) |

---

# B) Visione tecnica (codice)

> Per implementatori. Il PO può ignorare questa sezione.

## B.1 Perché un solo batch è architetturalmente sano (§22)

| Criterio | Valutazione |
|----|----|
| Pattern | Contratti risposta Gemini / DTO generator / facade orchestration |
| Accoppiamento | Facade inietta `verifyDraftsBatch` in Magic/Complete; generators condivisi |
| Dipendenza interna | Tipi City/POI (C3) + `cityGeneration.ts` → generators → hooks → facade |
| Dimensione | **71** hit / **19** file — grande ma **un** dominio |
| Beneficio di spezzare | Nessuno dimostrabile senza lasciare boundary `any` |

## B.2 Perimetro batch unico **C1** (live, operativo)

Rivalidazione Biome `noExplicitAny` (2026-08-07): **71** hit / **19** file — **nessun drift** vs audit post-C6.

| File | Hit live | Origine classif. | Note |
|----|---:|----|----|
| `src/hooks/admin/useAiMagicCity.ts` | 16 | C | Orchestrator Magic |
| `src/components/admin/economics/AdminAiAnalyticsV4.tsx` | 8 | C | Analytics RPC |
| `src/services/ai/generators/poiGenerator.ts` | 8 | C | Suggest / verify POI |
| `src/services/ai/aiPlanner.ts` | 7 | C | Planner |
| `src/hooks/admin/useAiCompleteCity.ts` | 5 | C | Complete City |
| `src/services/ai/generators/listGenerator.ts` | 5 | C | Guide/event/service |
| `src/hooks/useCityGenerator.ts` | 4 | **B** leftover | **Incluso** — facade |
| `src/components/modals/cityInfo/ServiceAiHunter.tsx` | 2 | C | Hunter UI |
| `src/data/ai/prompts.ts` | 2 | C | Prompt builders |
| `src/hooks/admin/people/usePeopleAI.ts` | 2 | C | People discovery |
| `src/hooks/admin/useAiFlashSearch.ts` | 2 | C | Flash |
| `src/hooks/admin/useAiValidation.ts` | 2 | C | `verifyDraftsBatch` |
| `src/services/ai/generators/peopleGenerator.ts` | 2 | C | People AI |
| `src/components/aiPlanner/AiPlannerTimeline.tsx` | 1 | C | Timeline |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsPanel.tsx` | 1 | C | Orphan |
| `src/data/ai/eventTaxonomy.ts` | 1 | C | Unused module |
| `src/hooks/admin/useAiTargetedSearch.ts` | 1 | C | Nessun caller UI |
| `src/hooks/admin/useAiTaskRunner.ts` | 1 | C | Session storage |
| `src/services/ai/generators/qualityGenerator.ts` | 1 | C | Rating parse |
| **Totale** | **71** | | **19** file |

### Riconciliazione inventario storico

| Fonte | Occ. | File | Note |
|----|---:|---:|----|
| Classificazione C gruppo AI (`B2a_C1_AI_AUDIT`) | **67** | **18** | Invariata sui file AI |
| Leftover B facade `useCityGenerator` | **4** | **1** | Inclusione ufficiale (criterio C5 co-locato) |
| **Perimetro operativo C1** | **71** | **19** | Live Biome = somma |

**Drift conteggio hit/file:** nessuno.  
**Drift operativi emersi in audit:** 3 superfici non smoke-abili (Targeted senza UI; Panel orphan; eventTaxonomy unused) — restano **nel perimetro** per tipizzazione; lacune in A.7.

### Esclusi (esplicito)

| File / area | Hit | Motivo |
|----|---:|----|
| Resto `src/services/ai/**` (gateway, chat, vision, utils, …) | 0 | Nessun `noExplicitAny` |
| `CampaignsPanel.tsx` | 1 | Marketing — non contratto Gemini città |
| `useFloatingPanelOptimisticUpdates.ts` | 1 | Residuo **B** packing — sweep B post-C |
| `interactionService.ts` / altri residui B | — | Fuori C1 |
| C2–C6 chiusi | 0 | Non riaprire |

## B.3 Boundary di dominio e tipi da riusare

```text
Admin UI
  └─ useCityGenerator                    ← facade (boundary UI)
       ├─ useAiTaskRunner
       ├─ useAiValidation.verifyDraftsBatch ──┐
       ├─ useAiFlashSearch / useAiTargetedSearch
       ├─ useAiMagicCity(runner, verifyDraftsBatch)
       └─ useAiCompleteCity(runner, verifyDraftsBatch)
            └─ listGenerator / peopleGenerator / poiGenerator
                 (+ cityContentGenerator già tipizzato via cityGeneration.ts)
```

| Boundary | Problema attuale | SoT / tipo da usare |
|----|----|----|
| Facade ↔ Complete | `config: any` | `CompleteCityConfig` = `{ peopleCount; runPoiDeepScan }` (già nell’impl) |
| Facade ↔ Flash | `cats: any[]` | `{ id: string; label: string }[]` |
| Facade ↔ Validate | `as Promise<any>` | return reale `verifyDraftsBatch` |
| Magic/Complete inject | `verifyDraftsBatch: any` | `VerifyDraftsBatchFn` da Validation |
| list / people / poi generators | `Promise<any>` / `any[]` | DTO draft + tipi City/POI/FamousPerson |
| Sezioni città in Magic | locali `any` | `src/types/ai/cityGeneration.ts` |
| Planner | `availablePois`/`config` any | `services/ai/types.ts` + `PlannerPoiRef` |
| Analytics | `useState<any>` | DTO RPC `AiEconomicsStatsV4` |
| Hunter | `any[]` props | promuovere `ServiceAiResult` |
| Suitcase panel | `suggestions: any[]` | `AiSuggestion` (packing) |
| eventTaxonomy | `getCachedSetting<any[]>` | `{ value; label }[]` |

## B.4 Quality Delta proposti (solo dopo ACCETTO — non applicati)

| # | Delta | Rischio | Note |
|---:|----|----|----|
| QD1 | Tipizzare return `getAiEconomicsStatsV4` in `aiAdminService` | Basso | Necessario se Analytics non può tipizzare senza |
| QD2 | Export `ServiceAiResult` da `ServiceGeneric` | Basso | Solo export tipo |
| QD3 | Opzionale: stesso `CanonicalOption` in `GlobalEventsManager` | Basso | Fuori hit C1; solo se zero-cost |

**Vietato in bonifica:** suppressioni Biome; cast di fuga; cambiare prompt/UX/quote; toccare residui B packing; schema Zod obbligatorio dove basta DTO + narrow; tipizzare `CampaignsPanel`.

## B.5 Piano di lavoro (dopo ACCETTO perimetro) — boundary-first

### Tipi shared da introdurre prima (o come primo passo tipizzazione)

`VerifyDraftsBatchFn` + `ValidationOptions` · `CompleteCityConfig` · `FlashCategoryRef` · `SuggestedPoiDraft` · verify-result POI · `PersonDiscoveryResult` · bundle liste/servizi · `AiEconomicsStatsV4` · `PlannerPoiRef` · promozione `ServiceAiResult`.

### Ordine file

| # | File | Hit | Motivazione |
|---:|----|---:|----|
| 0 | Tipi shared / export firme | — | Sblocca il flusso |
| 1 | `listGenerator.ts` | 5 | Contratto liste → Magic/Complete |
| 2 | `peopleGenerator.ts` | 2 | Contratto people |
| 3 | `poiGenerator.ts` | 8 | Contratto POI → Flash/Targeted/Validation |
| 4 | `prompts.ts` | 2 | Parametri generator |
| 5 | `useAiValidation.ts` | 2 | Esporta `VerifyDraftsBatchFn` |
| 6 | `useAiMagicCity.ts` | 16 | Consuma generator + validation |
| 7 | `useAiCompleteCity.ts` | 5 | Stesso contratto |
| 8 | `useCityGenerator.ts` | 4 | **Facade** — chiude boundary UI |
| 9 | `useAiFlashSearch.ts` | 2 | Dipende da suggest tipizzato |
| 10 | `useAiTargetedSearch.ts` | 1 | Stesso contratto POI (anche senza UI) |
| 11 | `usePeopleAI.ts` | 2 | Dipende da peopleGenerator |
| 12 | `aiPlanner.ts` | 7 | Contratto planner |
| 13 | `AiPlannerTimeline.tsx` | 1 | Consumer planner |
| 14 | `AdminAiAnalyticsV4.tsx` | 8 | Isolato ma stesso batch |
| 15 | `ServiceAiHunter.tsx` | 2 | `ServiceAiResult` |
| 16 | `AiSuggestionsPanel.tsx` | 1 | Orphan — tipizzare props |
| 17 | `eventTaxonomy.ts` | 1 | Unused — tipizzare helper |
| 18 | `useAiTaskRunner.ts` | 1 | Sessione storage |
| 19 | `qualityGenerator.ts` | 1 | `RatedPoiResult` |

### Gate chiusura C1 (dopo bonifica)

1. `noExplicitAny` = **0** sui **19** file perimetro. ✅  
2. `tsc` = soli **3** save-hook baseline. ✅  
3. Smoke **A.8 + S1–S7** (lacune A.7 annotate). ✅  
4. SoT sync (−71 any sul perimetro; residuo progetto ricalcolato). ✅  
5. ACCETTO PO chiusura C1. ✅ — **C1 concluso**; Batch C **completo**.

## B.6 Chiusura tecnica (bonifica)

1. **ACCETTO perimetro** ricevuto — bonifica eseguita boundary-first.  
2. Gate: `noExplicitAny` = **0** sui 19 file; `tsc --noEmit` OK; `npm run build` OK.  
3. Quality Delta QD1–QD3: **non applicati** (tipizzazione locale sufficiente; nessun file fuori perimetro).  
4. **ACCETTO PO chiusura** ricevuto — Batch C1 **concluso**; Batch C **completo**.
