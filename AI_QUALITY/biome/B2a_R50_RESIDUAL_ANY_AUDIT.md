# B2a — Residui live `noExplicitAny` (R50)

> Audit tecnico **post chiusura** Batch A+B+C (C1–C6).  
> Inventario hit-per-hit sotto = fotografia audit iniziale (**50**); **non** riscritto hit-per-hit dopo ogni mini-batch.  
> Snapshot audit: **2026-08-07** · `npx @biomejs/biome check` · categoria `lint/suspicious/noExplicitAny`  
> SoT numerica corrente: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md) (**0** `noExplicitAny` · progetto **1432**). Chiusura B2a storica: progetto **1660**.  
> Classificazione storica 446: [`B2a_noExplicitAny_AUDIT.md`](./B2a_noExplicitAny_AUDIT.md) · Inventario: [`B2a_noExplicitAny_INVENTORY_446.md`](./B2a_noExplicitAny_INVENTORY_446.md)  
> Stato esecuzione: **R1 + RP-Photo + RP-Pricing + RP-Mech + RP-Settings + RP-Residual ACCETTATI**; residuo live **0**; **B2a COMPLETATO**. Ultimo hit Roadbook tipizzato via `RoadbookSummary` (fix funzionale summary **fuori** roadmap Biome — **non** è residuo `noExplicitAny`). Prossimo L2 operativo = **B2b IN CORSO** (547; SoT progetto **1432**).

---

## 0. Stato esecuzione mini-batch (storico — post-chiusura B2a)

> Piano operativo rivisto (ACCETTO PO 2026-08-07): da 9 aperti (ex R2–R10) a **8** batch **RP-***.  
> **Fusione PO 2026-08-07:** i 4 aperti EventsAI+Undo+Core+CityRoad → un unico batch **RP-Residual**; Roadbook escluso dalla bonifica Residual, poi tipizzato in chiusura B2a.  
> Inventario hit-per-hit (§2) resta la fotografia iniziale R50 (**50**); **non** riscritto dopo ogni mini-batch.  
> **Stato finale:** tutti i mini-batch **ACCETTATI**; residuo live `noExplicitAny` = **0**; **B2a COMPLETATO**.

| Mini-batch | Occ. piano | Ex | Stato | Residuo after |
|----|---:|----|----|---:|
| **R1 — Service Regeneration** | 10 | R1 | **CHIUSO** (ACCETTO PO 2026-08-07) | 40 |
| **RP-Photo** | 6 | R4 | **CHIUSO** (ACCETTO PO 2026-08-07) | 34 |
| **RP-Pricing** | 6 | R2 | **CHIUSO** (ACCETTO PO 2026-08-07) | 28 |
| **RP-Mech** | 7 | R7 + 3 file da R10 | **CHIUSO** (ACCETTO PO 2026-08-07) | 21 |
| **RP-Settings** | 10 | R5+R3 | **CHIUSO** (ACCETTO PO 2026-08-07) | 11 |
| **RP-EventsAI** | 4 | R6 | **FUSO → RP-Residual** | — |
| **RP-Undo** | 2 | R8 | **FUSO → RP-Residual** | — |
| **RP-Core** | 2 | R9 | **FUSO → RP-Residual** | — |
| **RP-CityRoad** | 3 | parte R10 | **FUSO → RP-Residual** (Roadbook deferred fuori bonifica) | — |
| **RP-Residual** | 10 (+1 Roadbook tipizzato post-batch) | EventsAI+Undo+Core+CityRoad (−Roadbook in bonifica) | **CHIUSO** (ACCETTO PO 2026-08-07) | 0 |

| Metrica esecuzione | Valore |
|----|----:|
| Occorrenze audit iniziale R50 | **50** |
| Eliminate ACCETTATE (R1 + RP-Photo + RP-Pricing + RP-Mech + RP-Settings + RP-Residual + Roadbook tipizzato) | **50** (10+6+6+7+10+10+1) |
| Residuo SoT corrente (live) | **0** hit / **0** file |
| Bonifica scope **RP-Residual** | **10** hit / **8** file → **0** |
| Roadbook (deferred tipizzazione poi chiusa) | **1** hit tipizzato via `RoadbookSummary` (fix funzionale summary separato) |
| Mini-batch completati ACCETTATI | **6** (R1 + RP-Photo + RP-Pricing + RP-Mech + RP-Settings + RP-Residual) |
| Mini-batch aperti | **0** — **B2a COMPLETATO** |

> Conti SoT post-RP-Residual / B2a chiuso: progetto **1660** / `noExplicitAny` **0** (fotografia live Biome 2026-08-07; errors=**1157**, warnings=**503**; post-Settings **1671**/`11` → **1660**/`0`; −10 Residual + −1 Roadbook).

---

## 1. Perimetro (fotografia audit)

| Metrica | Valore |
|----|----:|
| Occorrenze live (audit) | **50** |
| File coinvolti (audit) | **28** |
| Fuori Batch C chiusi | **Sì** (nessun file del perimetro C1–C6 con hit residui) |
| Obiettivo | Mini-batch omogenei pronti per ACCETTO PO → bonifica |

> Verifica aritmetica audit: somma hit per file sotto = **50**.  
> Verifica Biome in audit: **50** diagnostiche `noExplicitAny`.

---

## 2. Inventario hit-per-hit (50 — fotografia audit)

| ID | File | Riga | Snippet | Motivo | Tipologia | Rischio | Dipendenze | Contratto condiviso? | Modo |
|----|----|---:|----|----|----|----|----|----|----|
| R50-01 | `server/routes/content.routes.ts` | 26 | `(data as any)?.value \|\| {}` | Row Supabase `global_settings` senza tipo value | Supabase / JSON settings | Medio | Express + supabaseAdmin | `Json` / PartnerIntegrations map | Architetturale leggero |
| R50-02 | `server/routes/content.routes.ts` | 30 | `reduce((acc: any, partner: any)` | Accumulator + item partner non tipizzati | Mapper JSON | Medio | Stesso handler | Partner record `{id,…}` | Meccanico+DTO locale |
| R50-03 | `server/routes/content.routes.ts` | 30 | *(secondo any sulla stessa riga)* | Parametro `partner` | Mapper JSON | Medio | Idem | Idem | Meccanico |
| R50-04 | `server/routes/content.routes.ts` | 73 | `(tickerConfigRes.data as any)?.value` | Settings row ticker_config | Supabase / JSON settings | Medio | Bootstrap content | TickerConfig / `Json` | Meccanico |
| R50-05 | `src/components/admin/AdminPhotoInspector.tsx` | 65 | `useState<any[]>([])` | Punti blur UI | React state | Basso | Locale al file | Tipo locale già in HistoryState | **Meccanico** |
| R50-06 | `src/components/admin/economics/PricingManager.tsx` | 27 | `useState<any[]>([])` | Lista versioni pricing | React state | Medio | `getPricingVersions` / dataService | `FormattedPricingVersion` | Meccanico (dopo R2 service) |
| R50-07 | `src/components/admin/economics/PricingManager.tsx` | 37 | `useState<any \| null>` | Draft editing | React state | Medio | Idem | Idem / Draft locale | Meccanico |
| R50-08 | `src/components/admin/GlobalEventsManager.tsx` | 31 | `useState<any[]>([])` | Eventi globali paginati | React state | Medio | getGlobalEventsPaginated | Export tipo riga eventi | Meccanico |
| R50-09 | `src/components/admin/GlobalEventsManager.tsx` | 36 | `getCachedSetting<any[]>` | Canonical event list | Settings JSON | Medio | settings cache | `CanonicalOption[]` (già in C1/eventTaxonomy) | Meccanico |
| R50-10 | `src/components/admin/LoadingTipsManager.tsx` | 351 | `e.target.value as any` | Cast select tip/status | Union cast UI | Basso | LoadingTip.type | Union locale | **Meccanico** |
| R50-11 | `src/components/admin/marketing/CampaignsPanel.tsx` | 32 | `useState<any[]>([])` | Campagne (tipo locale già definito) | React state | Basso | getCampaigns | `CampaignRow` locale | **Meccanico** |
| R50-12 | `src/components/admin/photos/PhotoFilters.tsx` | 76 | `s.id as any` | Cast status filter | Union cast UI | Basso | PhotoFiltersProps | Union status props | **Meccanico** |
| R50-13 | `src/components/admin/photos/PhotoFilters.tsx` | 88 | `e.target.value as any` | Cast origin filter | Union cast UI | Basso | Idem | Union origin props | **Meccanico** |
| R50-14 | `src/components/admin/settings/GlobalSettingsPanel.tsx` | 11 | `data: any` | Bag settings dinamico | Settings JSON | Medio | FieldRenderer | `Json` / `Record<string, Json>` | Architetturale |
| R50-15 | `src/components/admin/settings/GlobalSettingsPanel.tsx` | 31 | `useState<any>(data)` | Form state bag | React state / JSON | Medio | Idem | Idem | Architetturale |
| R50-16 | `src/components/admin/social/SocialPreviewConfig.tsx` | 20 | `getSetting<any>(…)` | Config OG social | Settings JSON | Basso | settingsService | DTO locale `{image,title,description}` | **Meccanico** |
| R50-17 | `src/components/common/SmartFilterDrawer.tsx` | 435 | `s.id as any` | Cast status filtro smart | Union cast UI | Basso | props.filters.status | Union già nelle props | **Meccanico** |
| R50-18 | `src/components/…/useFloatingPanelOptimisticUpdates.ts` | 10 | `(action: any, …)` | Undo action packing | Domain undo / packing | Medio | SuitcaseItem, undo stack | Union UndoAction packing | Architetturale (residuo B noto) |
| R50-19 | `src/components/layout/Sidebar.tsx` | 499 | `opt.id as any` | Ranking source cast | Union cast UI | Basso | state locale | `'mix'\|'ai'\|'users'` | **Meccanico** |
| R50-20 | `src/components/modals/cityInfo/CityServicesTab.tsx` | 43 | `useState<any[]>` | Lista servizi città | React state / domain | Basso | CityService | `CityService[]` (già importato) | **Meccanico** |
| R50-21 | `src/components/modals/SuggestionReviewModal.tsx` | 25 | `payload: any` | Legacy generateContent AI | Payload AI | Medio | AI gateway | `{model, contents}` / gateway shape | Meccanico+contratto |
| R50-22 | `src/components/modals/SuggestionReviewModal.tsx` | 427 | `category: … as any` | Select → PoiCategory | Union cast / domain drift | Medio | SuggestionRequest | Allineare union (attenzione `discovery`) | Architetturale leggero |
| R50-23 | `src/components/pdf/RoadbookDocument.tsx` | 259 | `summaryData: any` | Summary PDF; possibile mismatch caller | Domain model / PDF | **Alto** | Roadbook prep pipeline | Summary DTO + verifica caller | **Architetturale** |
| R50-24 | `src/hooks/admin/import/useImportData.ts` | 95 | `(status: any)` | Filter status import | Union cast | Basso | state statusFilter | Union staging status | **Meccanico** |
| R50-25 | `src/hooks/admin/usePhotoModeration.ts` | 130 | `let valA: any` | Sort indexer PhotoSubmission | Generic / sort | Basso | PhotoSubmission | `PhotoSubmission[SortKey]` | **Meccanico** |
| R50-26 | `src/hooks/admin/usePhotoModeration.ts` | 131 | `let valB: any` | Idem | Generic / sort | Basso | Idem | Idem | **Meccanico** |
| R50-27 | `src/hooks/admin/useServiceRegeneration.ts` | 37 | `guides: any[]` | State current entities | Domain / AI hybrid | Medio | getCityGuides… | `CityGuide[]` ecc. | Meccanico (tipi dominio) |
| R50-28 | `src/hooks/admin/useServiceRegeneration.ts` | 38 | `events: any[]` | Idem | Domain | Medio | Idem | `CityEvent[]` | Meccanico |
| R50-29 | `src/hooks/admin/useServiceRegeneration.ts` | 39 | `services: any[]` | Idem | Domain | Medio | Idem | `CityService[]` | Meccanico |
| R50-30 | `src/hooks/admin/useServiceRegeneration.ts` | 40 | `tourOperators: any[]` | Idem | Domain | Medio | Idem | `CityTourOperator[]` | Meccanico |
| R50-31 | `src/hooks/admin/useServiceRegeneration.ts` | 110 | `rawData: any` | Bundle grezzo AI+DB | AI / RefinedServicesBundle | Medio | suggestCityItems (C1) | `RefinedServicesBundle` | Meccanico (riuso C1) |
| R50-32 | `src/hooks/admin/useServiceRegeneration.ts` | 142 | `refinedData: any` | Output refineServiceData | AI bundle | Medio | refineServiceData | `RefinedServicesBundle` | Meccanico (riuso C1) |
| R50-33 | `src/hooks/admin/useServiceRegeneration.ts` | 176 | `Promise<any>[]` | Save promises | Generic Promise | Basso | saveCity* | `Promise<unknown>[]` | **Meccanico** |
| R50-34 | `src/hooks/admin/useServiceRegeneration.ts` | 179 | `(g: any, i)` | Guide refined | AI item / SaveCityGuideInput | Medio | saveCityGuide (cast C1-like) | `SuggestedCityItem` | Meccanico+cast necessario come Magic |
| R50-35 | `src/hooks/admin/useServiceRegeneration.ts` | 201 | `(op: any)` | Tour op refined | AI item | Medio | mapToTourOperatorInput | `SuggestedCityItem` | Meccanico |
| R50-36 | `src/hooks/admin/useServiceRegeneration.ts` | 209 | `(s: any, i)` | Service refined | AI item / SaveCityServiceInput | Medio | saveCityService | `SuggestedCityItem` | Meccanico+cast |
| R50-37 | `src/hooks/admin/useSocialTemplates.ts` | 67 | `const newTpl: any` | Nuovo template | Domain model | Basso | SocialTemplate | `SocialTemplate` (già importato) | **Meccanico** |
| R50-38 | `src/hooks/core/useAppInitialization.ts` | 38 | `session: any` | Sessione auth Supabase | Supabase Auth | Medio | getCurrentUserProfile | `Session` supabase-js | Meccanico |
| R50-39 | `src/hooks/core/useGpsManager.ts` | 45 | `configs: any` | Geo options da config | Config / utility | Medio | useConfig consumer | `{ geo_options?: … }` locale | Meccanico |
| R50-40 | `src/hooks/useDiaryLogic.ts` | 121 | `useUndoStack<any>` | Undo payload eterogeneo diario | Domain undo | Medio | useUndoStack | Union payload diario | Architetturale |
| R50-41 | `src/hooks/useUserDashboardData.ts` | 41 | `useState<any>(null)` | Business stats shop | React state / RPC | Basso | getBusinessStats | ReturnType getBusinessStats | **Meccanico** |
| R50-42 | `src/services/city/cityCache.ts` | 12 | `CacheEntry<any>` | Cache valori misti | Utility cache | Medio | city read paths | `CacheEntry<unknown>` + generic API | Architetturale leggero |
| R50-43 | `src/services/city/poi/poiRead.ts` | 34 | `query: any` | Builder PostgREST | Supabase query | Medio | applyComplexFilter | PostgrestFilterBuilder | Architetturale |
| R50-44 | `src/services/community/interactionService.ts` | 92 | `(row: any)` | Map target_id | Supabase row / mapper | Basso | user_interactions | Pick `{target_id}` / Row type | **Meccanico** |
| R50-45 | `src/services/dataService.ts` | 18 | `ai_limits: any` | Campo FormattedPricingVersion | Domain / JSON | Medio | Pricing UI | `AiLimits` / `Json` | **Condiviso sì** |
| R50-46 | `src/services/dataService.ts` | 75 | `promoData: any[]` | Righe pricing campagna | Supabase row | Medio | getPricingVersions | Row tipizzata select | Meccanico |
| R50-47 | `src/services/dataService.ts` | 106 | `(items: any[])` | processItems merge | Mapper | Medio | Idem | Stesso row type | Meccanico |
| R50-48 | `src/services/dataService.ts` | 149 | `oldLimits: any` | Merge AI limits | JSON utility | Medio | PricingManager | `AiLimits` | **Condiviso sì** |
| R50-49 | `src/services/photoMapper.ts` | 7 | `(p: any)` | Boundary DB→PhotoSubmission | Mapper / Supabase | Medio | PhotoSubmission | DbPhotoRow / Tables Row | Meccanico+DTO |
| R50-50 | `src/services/settingsService.ts` | 101 | `Map<string, any>` | Cache settings | Settings JSON | Medio | getCachedSetting* | `Map<string, Json>` | Architetturale leggero |

**Somma ID R50-01…50 = 50.** ✅

---

## 3. Raggruppamento per dominio

| Dominio | Hit | File | Note |
|----|---:|---:|----|
| Admin AI — service regeneration | 10 | 1 | Riuso diretto tipi C1 (`SuggestedCityItem`, `RefinedServicesBundle`, entity City*) |
| Pricing / economics | 6 | 2 | `dataService` + `PricingManager`; contratto `AiLimits` |
| Server content / settings HTTP | 4 | 1 | Express bootstrap + partner_integrations |
| Photo pipeline | 6 | 4 | Mapper + moderation sort + filters + inspector |
| Settings / admin config JSON | 6 | 5 | GlobalSettings, settingsCache, social, campaigns, templates |
| Events + suggestion review | 4 | 2 | GlobalEvents + SuggestionReviewModal |
| Union cast UI (filtri/rankings/tips/import) | 4 | 4 | Cast `as any` su union già note |
| Packing / diary undo | 2 | 2 | Residuo B packing + undo diario |
| Core app (auth/GPS) | 2 | 2 | Session + geo configs |
| City infra (cache/query) | 2 | 2 | cityCache + poiRead builder |
| City/community/UI residuali | 4 | 4 | CityServicesTab, interactionService, Roadbook, dashboard |

---

## 4. Raggruppamento per pattern tecnico

| Pattern | Hit (stima) | Esempi |
|----|---:|----|
| React `useState<any>` / props `any` | ~14 | Pricing, Campaigns, Events, ServicesTab, blurPoints |
| `as any` su union UI | ~8 | PhotoFilters, Sidebar, SmartFilter, LoadingTips, import status |
| AI / refine / SuggestedCityItem | 10 | useServiceRegeneration |
| Supabase row / settings JSON | ~10 | content.routes, settingsService, GlobalSettings, photoMapper |
| Generic Promise / sort indexer / cache | ~5 | Promise\<any\>, valA/valB, CacheEntry |
| Undo domain bag | 2 | floating panel, useDiaryLogic |
| Auth Session / config bag | 2 | AppInit, GpsManager |

---

## 5. Piano operativo mini-batch (perimetro vigente)

> Filosofia: stesso dominio + stessi tipi + stesso rischio; accorpamenti solo se non alzano il rischio di regressione.  
> Non spezzare `useServiceRegeneration` (già chiuso).  
> Tipi condivisi **solo** se usati da ≥2 file del batch (es. `AiLimits`, `Json`).  
> **Revisione piano (ACCETTO PO 2026-08-07):** etichette **RP-***; inventari §1–§2 e classificazioni audit **non** modificati.  
> Mappa storica: R1 chiuso; ex R2→**RP-Pricing**; ex R3+R5→**RP-Settings**; ex R4→**RP-Photo**; ex R6→**RP-EventsAI**; ex R7+3 file R10→**RP-Mech**; ex R8→**RP-Undo**; ex R9→**RP-Core**; cityCache+poiRead+Roadbook→**RP-CityRoad**.  
> **Fusione PO 2026-08-07:** EventsAI+Undo+Core+CityRoad → **RP-Residual** (bonifica **10**/8); `RoadbookDocument` allora deferred — tipizzato in chiusura B2a (vedi sotto).

### Ordine operativo vigente

| Ordine | Mini-batch | File | Occ. | Rischio | Dipendenze | Motivazione |
|---:|----|---:|---:|----|----|----|
| — | **R1 — Service Regeneration** | 1 | **10** | Medio | Tipi C1; saveCity* | **CHIUSO** |
| 1 | **RP-Photo** (ex R4) | 4 | **6** | Medio | `PhotoSubmission`; photoMapper | **CHIUSO** (ACCETTO PO) |
| 2 | **RP-Pricing** (ex R2) | 2 | **6** | Medio | pricing_versions; `PricingAiLimits` | **CHIUSO** (ACCETTO PO) |
| 3 | **RP-Mech** (ex R7 + 3 da R10) | 7 | **7** | **Basso** | Union locali; tipi dominio già presenti | **CHIUSO** (ACCETTO PO) |
| 4 | **RP-Settings** (ex R5+R3) | 6 | **10** | Medio | settingsService / `Json`; supabaseAdmin | **CHIUSO** (ACCETTO PO) |
| 5 | **RP-Residual** (fusione EventsAI+Undo+Core+CityRoad −Roadbook) | 8 | **10** | Medio | vedi dettaglio sotto | **CHIUSO** (ACCETTO PO 2026-08-07) → **0** |
| — | **RP-EventsAI / RP-Undo / RP-Core / RP-CityRoad** | — | — | — | — | **FUSI** in RP-Residual (non più batch separati) |

**Somma hit piano R50 (fotografia iniziale + esecuzione): 50 → eliminate 50 → residuo live `noExplicitAny` = 0.** ✅  
**Stato finale B2a:** nessun residuo `noExplicitAny` aperto (Roadbook tipizzato; eventuale audit funzionale PDF **separato**).

### Dettaglio perimetro file per mini-batch

#### R1 — Service Regeneration — **CHIUSO**

| File | Hit |
|----|---:|
| `src/hooks/admin/useServiceRegeneration.ts` | 10 → **0** |
| **Totale** | **10** eliminate |

- **Stato:** **ACCETTATO PO** / review architetturale conclusa / Quality Delta verificato (Object.assign + cast `SaveCity*` lasciati).  
- **Esito:** `noExplicitAny` SoT **50→40**; progetto **1714→1704**.

#### RP-Photo (ex R4) — ordine 1 — **CHIUSO** (ACCETTO PO)

| File | Hit |
|----|---:|
| `src/services/photoMapper.ts` | 1 → **0** |
| `src/hooks/admin/usePhotoModeration.ts` | 2 → **0** |
| `src/components/admin/photos/PhotoFilters.tsx` | 2 → **0** |
| `src/components/admin/AdminPhotoInspector.tsx` | 1 → **0** |
| **Totale** | **6** eliminate / **4** file |

- **Stato:** **ACCETTATO PO** — review architetturale/logica OK; QG OK; smoke OK; nessuna regressione; QD `PHOTO_FILTERS`.  
- **Contratti usati:** `DbPhotoSubmission`; `HistoryState['blurPoints']`; `PhotoFilterStatus` / `PhotoFilterOrigin` locali.  
- **Esito:** `noExplicitAny` SoT **40→34**; progetto **1704→1698**.

#### RP-Pricing (ex R2) — ordine 2 — **CHIUSO** (ACCETTO PO)

| File | Hit |
|----|---:|
| `src/services/dataService.ts` | 4 → **0** |
| `src/components/admin/economics/PricingManager.tsx` | 2 → **0** |
| **Totale** | **6** eliminate / **2** file |

- **Stato:** **ACCETTATO PO** — review/smoke/QG OK; QD `PLAN_TYPES`; ciclo validazione concluso.  
- **Contratti:** `PricingAiLimits` (dataService); `PricingManagerVersion` (Row + join plans).  
- **Esito:** `noExplicitAny` SoT **34→28**; progetto **1698→1692**.

#### RP-Mech (ex R7 + 3 file da ex R10) — ordine 3 — **CHIUSO** (ACCETTO PO)

| File | Hit |
|----|---:|
| `src/components/common/SmartFilterDrawer.tsx` | 1 → **0** |
| `src/components/layout/Sidebar.tsx` | 1 → **0** |
| `src/hooks/admin/import/useImportData.ts` | 1 → **0** |
| `src/components/admin/LoadingTipsManager.tsx` | 1 → **0** |
| `src/components/modals/cityInfo/CityServicesTab.tsx` | 1 → **0** |
| `src/services/community/interactionService.ts` | 1 → **0** |
| `src/hooks/useUserDashboardData.ts` | 1 → **0** |
| **Totale** | **7** eliminate / **7** file |

- **Stato:** **ACCETTATO PO** — review/smoke/QG OK; ciclo validazione concluso.  
- **Rischio:** **Basso** (pass meccanico omogeneo).  
- **Esito:** `noExplicitAny` SoT **28→21**; progetto **1692→1682** (live photograph; −3 drift pre-Mech assorbito).

#### RP-Settings (ex R5 + ex R3) — ordine 4 — **CHIUSO** (ACCETTO PO)

| File | Hit |
|----|---:|
| `src/components/admin/settings/GlobalSettingsPanel.tsx` | 2 → **0** |
| `src/services/settingsService.ts` | 1 → **0** |
| `src/components/admin/social/SocialPreviewConfig.tsx` | 1 → **0** |
| `src/components/admin/marketing/CampaignsPanel.tsx` | 1 → **0** |
| `src/hooks/admin/useSocialTemplates.ts` | 1 → **0** |
| `server/routes/content.routes.ts` | 4 → **0** |
| **Totale** | **10** eliminate / **6** file |

- **Stato:** **ACCETTATO PO** — review/smoke/QG OK; QD type guards `GlobalSettingsPanel`; ciclo validazione concluso.  
- **Rischio:** Medio (bag JSON + read server `global_settings`).  
- **Contratti:** `Json` cache/settings; DTO locali social/campaign; partner/ticker lato server.  
- **Esito:** `noExplicitAny` SoT **21→11**; progetto **1682→1671** (live photograph; errors=1157, warnings=514; −1 collaterale assorbito).  
- **Prossimo (superseduto):** fusione aperti → **RP-Residual** (vedi sotto).

#### RP-EventsAI / RP-Undo / RP-Core / RP-CityRoad — **FUSI → RP-Residual**

> Ex batch separati (ordine storico 5–8). **Non** più batch operativi autonomi.  
> Perimetro storico EventsAI (4/2) + Undo (2/2) + Core (2/2) + CityRoad cityCache/poiRead (2/2) = bonifica **RP-Residual** **10**/8.  
> `RoadbookDocument.tsx` (ex CityRoad, 1 hit) → **deferred** (vedi esclusione sotto).

#### RP-Residual — ordine 5 — **CHIUSO** (ACCETTO PO 2026-08-07)

| File | Hit | Ex batch |
|----|---:|----|
| `src/components/admin/GlobalEventsManager.tsx` | 2 → **0** | EventsAI |
| `src/components/modals/SuggestionReviewModal.tsx` | 2 → **0** | EventsAI |
| `src/components/…/useFloatingPanelOptimisticUpdates.ts` | 1 → **0** | Undo |
| `src/hooks/useDiaryLogic.ts` | 1 → **0** | Undo |
| `src/hooks/core/useAppInitialization.ts` | 1 → **0** | Core |
| `src/hooks/core/useGpsManager.ts` | 1 → **0** | Core |
| `src/services/city/cityCache.ts` | 1 → **0** | CityRoad |
| `src/services/city/poi/poiRead.ts` | 1 → **0** | CityRoad |
| **Totale bonifica** | **10** / **8** file → **0** | — |

- **Stato:** **ACCETTATO PO** — bonifica eseguita; review/QD Events/Suggestion OK; ciclo chiuso.  
- **Esito:** `noExplicitAny` SoT **11→0** sul perimetro Residual; progetto chiusura B2a storica **1671→1660** (−10 Residual + −1 Roadbook tipizzato).  
- **Rischio (storico):** Medio (union suggestion; undo packing; Session/geo; cache/query).  
- **Contratti usati:** `CanonicalOption`; payload AI minimo; union UndoAction; `Session`; config geo; `CacheEntry` / PostgREST builder.  
- **Nota packing:** `useFloatingPanelOptimisticUpdates` era escluso da C6 come residuo B — incluso e chiuso in Residual.  
- **B2a:** con questa chiusura + tipizzazione Roadbook → **COMPLETATO** (`noExplicitAny` **0**).

##### Roadbook — tipizzato in chiusura B2a (non residuo `noExplicitAny`)

| File | Hit storico | Nota finale |
|----|---:|----|
| `src/components/pdf/RoadbookDocument.tsx` | 1 (era L259 `summaryData: any`) | Tipizzato via `RoadbookSummary` in chiusura B2a |

- In fase di fusione RP-Residual era **escluso** dalla bonifica Residual (deferred).  
- In chiusura B2a l’hit `any` è stato **eliminato** (tipizzazione); eventuali fix funzionali summary PDF restano **fuori** roadmap Biome e **non** contano come residuo `noExplicitAny`.

---

## 6. Contratti condivisi consigliati (solo se utili cross-file)

| Contratto | Mini-batch | Perché |
|----|----|----|
| `PricingAiLimits` | RP-Pricing | Usato in `FormattedPricingVersion` + `safeMergeAiLimits` + UI PricingManager |
| Riuso `SuggestedCityItem` / `RefinedServicesBundle` | R1 (chiuso) | Già C1 — **non** ricreare |
| `Json` (già in types) | RP-Settings | Settings bag / cache client + read server |
| `CanonicalOption` | RP-Residual (ex EventsAI) | Event list (allineamento C1 eventTaxonomy) |
| `RoadbookSummary` | Chiusura B2a (Roadbook) | Tipizzazione hit residuale; fix funzionale PDF separato |

Nessun nuovo framework; vietato Zod obbligatorio dove basta DTO + narrowing.

---

## 7. Gate per ACCETTO PO (storico R50)

> Gate usato **durante** l’esecuzione dei mini-batch R50. Tutti i mini-batch risultano **ACCETTATI**; sezione conservata come tracciabilità.

Prima della bonifica di ciascun mini-batch (storico):

1. ACCETTO esplicito sul **perimetro file** del mini-batch (o ACCETTO dell’intero piano R1 + RP-*).  
2. Nessun file dei Batch C1–C6 chiusi da riaprire salvo regressione.  
3. Principi bonifica invariati: no cast ciechi; no `as any` nuovi; no suppressioni; runtime invariato; `npm run check` / typecheck come da WF-QUAL-01.  
4. Quality Delta solo se emersi in review, dentro perimetro.  
5. Per **RP-Residual** (storico): ACCETTO sul perimetro **10 hit / 8 file** — **eseguito e chiuso**.

### Verdetto piano operativo (stato finale)

| Domanda | Risposta |
|----|----|
| Totale live audit iniziale R50 = 50? | **Sì** (fotografia §1–§2 invariata) |
| Residuo SoT post-RP-Settings (snapshot intermedio) = 11? | **Sì** (storico 2026-08-07; progetto allora **1671**) |
| Piano RP-* ACCETTATO PO? | **Sì** (2026-08-07) |
| Batch aperti fusi in RP-Residual? | **Sì** (EventsAI+Undo+Core+CityRoad) |
| Bonifica scope RP-Residual = 10/8 → 0? | **Sì** |
| R1 + RP-Photo + RP-Pricing + RP-Mech + RP-Settings ACCETTATI? | **Sì** |
| RP-Residual ACCETTATO / CHIUSO? | **Sì** — **ACCETTO PO 2026-08-07** |
| Residuo live `noExplicitAny` finale? | **0** — **B2a COMPLETATO** |
| Roadbook ancora residuo `noExplicitAny`? | **No** — tipizzato in chiusura; audit funzionale PDF fuori Biome |
| SoT progetto corrente (2026-08-08)? | **1432** / E932 / W500 (`noExplicitAny` **0**) |

---

## 8. Prossima attività consigliata

1. **B2a chiuso** — non riaprire R50 / RP-Residual.  
2. **L2 corrente = B2b IN CORSO** (547 diagnostiche; tranche BASSO già bonificata).  
3. Prossimo sottoperimetro B2b: **modali / overlay / drawer** (dopo ACCETTO PO sul perimetro) — **non** aprire B2c.  
4. Eventuale audit funzionale Roadbook/PDF: **fuori** roadmap Biome `noExplicitAny`.
