    # B2a - Audit specialistico `noExplicitAny`

    > Audit classificazione **CHIUSA** (fotografia 446 invariata; inventario hit-per-hit in appendice).
    > Categoria Biome: `lint/suspicious/noExplicitAny`
    > Snapshot classificazione: **446** occorrenze / **173** file / data **2026-08-04**
    > **Esecuzione (2026-08-05 → 2026-08-07):** Batch **A+B ACCETTATI**; Batch **C (C1–C6) ACCETTATO** / completo; **R50 R1+RP-Photo+RP-Pricing+RP-Mech+RP-Settings+RP-Residual ACCETTATI** — **B2a COMPLETATO** (`noExplicitAny` **0**; SoT progetto **1432**). Dettaglio R50: [`B2a_R50_RESIDUAL_ANY_AUDIT.md`](./B2a_R50_RESIDUAL_ANY_AUDIT.md).
    > SoT operativa: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md) | Inventario storico 446: [`B2a_noExplicitAny_INVENTORY_446.md`](./B2a_noExplicitAny_INVENTORY_446.md) | Baseline legacy: [`C_noExplicitAny.md`](./C_noExplicitAny.md)

    ---

    ## 1. Riepilogo esecutivo

    | Metrica | Valore |
    |----|----:|
    | Occorrenze totali (classificazione) | **446** |
    | File coinvolti | **173** |
    | Livello **A** (meccanico) | **123** / 76 file |
    | Livello **B** (review breve) | **180** / 81 file |
    | Livello **C** (review dominio) | **143** / 65 file |
    | Livello **D** (non correggere) | **0** / 0 file |
    | Debito reale | **446** |
    | Boundary esterno segnalato *(statistica audit iniziale)* | **6** |
    | Candidati `unknown` *(statistica audit iniziale)* | **165** |
    | Probabile nuovo tipo *(statistica audit iniziale)* | **206** |
    | Origine Supabase (tag) | **8** |
    | Origine Gemini/AI (tag) | **80** |
    | Origine JSON dinamico (tag) | **102** |
    | Origine React (tag) | **83** |
    | Origine librerie terze (tag) | **0** |

    > **Nota metriche analitiche:** *Boundary esterno*, *Candidati unknown* e *Probabile nuovo tipo* sono **statistiche della classificazione iniziale 446**. **Non** costituiscono backlog operativo né target di esecuzione corrente. Residuo live `noExplicitAny` = **0** (B2a chiuso; SoT progetto **1432**).

    **Nota D:** in questo audit **nessuna** occorrenza e stata classificata **D**. Non risultano boundary di libreria terza intenzionali tali da giustificare "non correggere". I boundary Supabase/AI restano **debito reale tipizzabile** (livello C), non D.

    ---

    ## 2. Riepilogo per livello A/B/C/D

    ### Livello A

    | Campo | Valore |
    |----|----|
    | **Titolo** | A - Correzione meccanica senza rischio |
    | **Occorrenze** | **123** |
    | **File coinvolti** | **76** |
    | **Motivazione** | Pattern ripetibili con sostituto tipizzato standard (`unknown`, eventi React, timer) senza decisione di dominio. |
    | **Strategia di bonifica** | Batch massivo per pattern; typecheck per file toccati; smoke minimo. |

    ### Livello B

    | Campo | Valore |
    |----|----|
    | **Titolo** | B - Richiede breve review del file |
    | **Occorrenze** | **180** |
    | **File coinvolti** | **81** |
    | **Motivazione** | Serve leggere il contesto locale (stato, prop, cast union, setting) ma senza ridefinire il modello di dominio. |
    | **Strategia di bonifica** | Sotto-batch per area UI/service; piccoli cluster omogenei o file singoli leggeri. |

    ### Livello C

    | Campo | Valore |
    |----|----|
    | **Titolo** | C - Richiede review architetturale del dominio |
    | **Occorrenze** | **143** |
    | **File coinvolti** | **65** |
    | **Motivazione** | Any su contratti shared, context, AI/Gemini, parsers City, tipi Sponsor/City, servizi geo/community. |
    | **Strategia di bonifica** | File-per-file o cluster dominio; introdurre/estendere tipi; vietato cast cieco; typecheck obbligatorio. Audit tematico: [`B2a_BATCH_C_INDEX.md`](./B2a_BATCH_C_INDEX.md). |

    ### Livello D

    | Campo | Valore |
    |----|----|
    | **Titolo** | D - Da non correggere |
    | **Occorrenze** | **0** |
    | **File coinvolti** | **0** |
    | **Motivazione** | Boundary intenzionale o limitazione tecnica non tipizzabile senza hack. |
    | **Strategia di bonifica** | Solo con decisione PO + Registro; oggi **0** occorrenze. |

    ---

    ## 3. Riepilogo per categoria di contesto (pattern)

    | Contesto | Livello | Occorrenze | File |
    |----|----|---:|---:|
    | parametro/variabile : any | B | 90 | 47 |
    | catch (error: any) | A | 72 | 46 |
    | parametro data/response : any | C | 48 | 13 |
    | parametro evento : any | A | 45 | 31 |
    | parametro hook : any | B | 18 | 9 |
    | as any generico | C | 15 | 12 |
    | useState<any…> | B | 12 | 10 |
    | as any su union/enum/status | B | 12 | 6 |
    | as any su union/enum/status | C | 12 | 9 |
    | parametro data/response : any | B | 12 | 9 |
    | generic Promise/Array/Record<any> | C | 11 | 6 |
    | parametro/servizio : any | B | 11 | 6 |
    | generic any su struttura JSON | C | 10 | 10 |
    | useState<any…> | C | 10 | 7 |
    | parametro/servizio : any | C | 10 | 8 |
    | as any generico | B | 8 | 5 |
    | tipo shared con any | C | 8 | 3 |
    | context value/param any | C | 7 | 3 |
    | generic Promise/Array/Record<any> | B | 6 | 6 |
    | as any su risposta AI/Gemini | C | 6 | 4 |
    | helper narrowing con any legacy | A | 5 | 3 |
    | Promise<any[]> geo service | C | 5 | 1 |
    | getCachedSetting<any…> | B | 4 | 4 |
    | param/body route server : any | B | 2 | 1 |
    | tuple [string, any] | B | 2 | 1 |
    | uso any residuo | B | 2 | 2 |
    | null as any | B | 1 | 1 |
    | getCachedSetting<any…> | C | 1 | 1 |
    | timer/timeout : any | A | 1 | 1 |

    ### Strategia per gruppo pattern

    | Gruppo | Livello | Massivo? | Strategia |
    |----|----|----|----|
    | catch (error: any) | A | **Sì** | `unknown` + narrowing locale |
    | parametro evento : any | A | **Sì** (per famiglia evento) | Tipi `React.*Event` |
    | parametro error : any | A | **Sì** | `unknown` |
    | helper narrowing (safeTypes/ensure*) | A | **Sì** | `unknown` + generics |
    | timer/timeout : any | A | **Sì** | `ReturnType<typeof setTimeout>` |
    | useState/useRef any | B/C | No | Tipo entity per schermata |
    | as any su union/enum/status | B/C | Parziale | Type guard / union esistente |
    | as any generico | B/C | No | Tipizzare sorgente |
    | as any AI/Gemini | C | No | Schema + parser |
    | parametro data/response | B/C | No | Tipo dominio |
    | tipi shared / context | C | No | Contratto dominio |
    | geo Promise<any[]> / supabase-ish | C | No | Tipi riga + Database |
    | getCachedSetting<any> | B | Parziale | Tipo setting |

    ---

    ## 4. Roadmap di bonifica B2a (post-audit)

    > **Piano T1–T8 (sotto): storico di classificazione.** Piano operativo vigente = **macro-batch A / B / C** (B suddiviso in B-1…B-4). Non riprendere T1–T8 come coda di esecuzione.

    ### Stato esecuzione (vigente)

    | Macro-batch | Perimetro | Occ. audit | Stato |
    |----|----|---:|----|
    | **A** | Livello A meccanico (catch, eventi, helper, timer) | **123** | **ACCETTATO** (2026-08-05) |
    | **B** | Livello B — sottobatch B-1…B-4 | **180** | **ACCETTATO** (2026-08-06) |
    | **B-1** | parametro/variabile `: any`, tuple, piccoli residui annotazione | ~94 | Incluso in B (**chiuso**) |
    | **B-2** | `useState<any>` + parametro hook | ~30 | Incluso in B (**chiuso**) |
    | **B-3** | `as any` / `null as any` | ~21 | Incluso in B (**chiuso**) |
    | **B-4** | data/response, getCachedSetting, generic, body, settingsCache/UndoAction | ~35 | Incluso in B (**chiuso**) |
    | **C** | Review dominio | **143** | **C1–C6 ACCETTATI** (Batch C completo; C1 live 71→0) |
    | **D** | Non correggere | **0** | — |

    **Collaterali (non B/C):** 7 bonifiche `noGlobalIsNan` (`isNaN`→`Number.isNaN`) accettate con Batch A — **non riproposte** nei batch successivi.

    **Conti:** classificazione iniziale **446**; Batch **A**, **B**, **C (C1–C6)** ACCETTATI; **R50 R1 + RP-* + RP-Residual ACCETTATI**; residuo ufficiale `noExplicitAny` / progetto → snapshot Biome in [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md) (corrente: **0** / **1432**; errors=932, warnings=500; chiusura B2a storica era **1660**). **B2a COMPLETATO**.

    > **Nota classificazione C:** il totale **143** è la fotografia storica congelata. Alcuni batch operativi possono avere cardinalità diversa dalla foto iniziale per riallineamenti di pianificazione (es. C1 **67→71**). Questo **non** modifica la classificazione storica.

    ### Roadmap storica T1–T8 (non più coda operativa)

    > Mantenuta solo come tracciabilità storica; **non** rappresenta più la roadmap operativa corrente (vigente = macro-batch A / B / C).

    | Tranche | Perimetro | Occ. | Modo | Dipendenze |
    |----|----|---:|----|----|
    | **B2a-T1** | Livello A — catch + error params + timer + safeTypes/ensure* | ~78 | **Massivo** | typecheck |
    | **B2a-T2** | Livello A — parametri evento React | ~45 | **Massivo per pattern** | smoke UI leggero |
    | **B2a-T3** | Livello B — server/settings/useState non-AI | parte B | Cluster file | review breve |
    | **B2a-T4** | Livello B — as any union/status UI | parte B | File-per-file leggero | union esistenti |
    | **B2a-T5** | Livello C — `src/types/*` + context | 17 | **File-per-file** | impatto a cascata |
    | **B2a-T6** | Livello C — services/parsers/geo/community | cluster C services | **File-per-file** | tipi City/Sponsor |
    | **B2a-T7** | Livello C — hooks/components AI/Gemini | 67 | **File-per-file** | schemi AI |
    | **B2a-T8** | Residui B/C admin non-AI | resto | Cluster o file-per-file | — |

    ### Cosa è massivo vs file-per-file

    | Modalità | Gruppi | Occ. |
    |----|----|---:|
    | **Correzione massiva** | A (catch, error, timer, helpers, eventi) | **123** |
    | **Cluster omogenei (semi-massivo)** | B settings/useState semplici, server body | parte di **180** |
    | **File-per-file obbligatorio** | C tipi/context/AI/parsers/services + as any strutturali | **143** |
    | **Non correggere** | D | **0** |

    ---

    ## 5. Inventario compatto (operativo)

    > L’elenco hit-per-hit delle **446** occorrenze è in [`B2a_noExplicitAny_INVENTORY_446.md`](./B2a_noExplicitAny_INVENTORY_446.md) (appendice storica).  
    > Qui restano solo riepiloghi consultabili in pochi minuti.

    ### 5.1 Riepilogo per cartella / prefisso

    | Prefisso | Occorrenze |
    |----|---:|
    | `src/components/admin` | 141 |
    | `src/hooks/admin` | 64 |
    | `src/components/modals` | 24 |
    | `src/services/ai` | 23 |
    | `src/services/city` | 15 |
    | `src/components/features` | 14 |
    | `src/hooks/useRankingsLogic.ts` | 10 |
    | `src/components/home` | 9 |
    | `src/services/community` | 9 |
    | `src/components/itineraries` | 8 |
    | `src/components/layout` | 7 |
    | `src/components/user` | 7 |
    | `src/context/CityEditorContext.tsx` | 7 |
    | `src/types/models` | 7 |
    | `server/routes/bootstrap.routes.ts` | 6 |
    | `server/routes/content.routes.ts` | 6 |
    | `src/hooks/useSponsorOperations.ts` | 6 |
    | `src/context/ConfigContext.tsx` | 5 |
    | `src/services/geo.ts` | 5 |
    | `src/components/city` | 4 |
    | `src/context/ModalContext.tsx` | 4 |
    | `src/hooks/useCityGenerator.ts` | 4 |
    | `src/services/dataService.ts` | 4 |
    | `src/services/globalEventsService.ts` | 4 |
    | `src/services/importService.ts` | 4 |
    | `src/components/shop` | 3 |
    | `src/constants/services.ts` | 3 |
    | `src/data/ai` | 3 |
    | `src/hooks/useUndoStack.ts` | 3 |
    | `src/utils/safeTypes.ts` | 3 |

    ### 5.2 Top concentrazione — fotografia classificazione 446

    | File | Occorrenze | Note |
    |----|---:|----|
    | `src/hooks/admin/useAiMagicCity.ts` | 20 | Vedi inventario storico / elenco §6 |
    | `src/components/admin/AdminStatsDashboard.tsx` | 15 | Vedi inventario storico / elenco §6 |
    | `src/hooks/admin/useServiceRegeneration.ts` | 12 | Vedi inventario storico / elenco §6 |
    | `src/hooks/useRankingsLogic.ts` | 10 | Vedi inventario storico / elenco §6 |
    | `src/components/admin/cities/CitiesListTab.tsx` | 9 | Vedi inventario storico / elenco §6 |
    | `src/components/admin/economics/AdminAiAnalyticsV4.tsx` | 8 | Vedi inventario storico / elenco §6 |
    | `src/components/itineraries/ItineraryDetail.tsx` | 8 | Vedi inventario storico / elenco §6 |
    | `src/services/ai/generators/poiGenerator.ts` | 8 | Vedi inventario storico / elenco §6 |
    | `src/services/community/suggestionService.ts` | 8 | Vedi inventario storico / elenco §6 |
    | `src/context/CityEditorContext.tsx` | 7 | Vedi inventario storico / elenco §6 |
    | `src/hooks/admin/useAiCompleteCity.ts` | 7 | Vedi inventario storico / elenco §6 |
    | `src/services/ai/aiPlanner.ts` | 7 | Vedi inventario storico / elenco §6 |
    | `server/routes/bootstrap.routes.ts` | 6 | Vedi inventario storico / elenco §6 |
    | `server/routes/content.routes.ts` | 6 | Vedi inventario storico / elenco §6 |
    | `src/components/admin/cities/RegionalAnalysisModal.tsx` | 6 | Vedi inventario storico / elenco §6 |
    | `src/components/admin/cityEditor/services/ServiceEvents.tsx` | 6 | Vedi inventario storico / elenco §6 |
    | `src/components/layout/modals/AdminModals.tsx` | 6 | Vedi inventario storico / elenco §6 |
    | `src/components/modals/FullRankingsModal.tsx` | 6 | Vedi inventario storico / elenco §6 |
    | `src/hooks/useSponsorOperations.ts` | 6 | Vedi inventario storico / elenco §6 |
    | `src/components/admin/cityEditor/services/ServiceGeneric.tsx` | 5 | Vedi inventario storico / elenco §6 |
    | `src/components/admin/cityEditor/services/ServiceGuides.tsx` | 5 | Vedi inventario storico / elenco §6 |
    | `src/components/admin/settings/GlobalSettingsPanel.tsx` | 5 | Vedi inventario storico / elenco §6 |
    | `src/components/home/HomeContent.tsx` | 5 | Vedi inventario storico / elenco §6 |
    | `src/context/ConfigContext.tsx` | 5 | Vedi inventario storico / elenco §6 |
    | `src/hooks/admin/usePhotoModeration.ts` | 5 | Vedi inventario storico / elenco §6 |

    ### 5.3 File più critici (classificazione)

    | Area | Segnale |
    |----|----|
    | AI / Gemini | Alta densità in `useAiMagicCity`, generatori, `AdminAiAnalyticsV4` → Batch C1 |
    | Domain types | `Sponsor.ts`, `City.ts`, context → Batch C3 |
    | Parsers City | `src/services/city/parsers/**` → Batch C2 |
    | Admin UI B | `AdminStatsDashboard`, rankings, itinerary (Batch B **chiuso**) |

    ### 5.4 Note architetturali

    - Classificazione A/B/C/D **congelata** sulla fotografia 446; non ricalcolare A/B/C dal residuo runtime.
    - Dopo A+B accettati, il residuo operativo `noExplicitAny` è nella SoT (snapshot Biome), non in questa tabella di classificazione.
    - Batch C: **C1–C6 ACCETTATI** (completo) — [`B2a_BATCH_C_INDEX.md`](./B2a_BATCH_C_INDEX.md) · PO C1 [`B2a_C1_START_PO_AUDIT.md`](./B2a_C1_START_PO_AUDIT.md).

    ---

    ## 6. Elenco file per livello

    ### File livello A (76)

    - `server/routes/admin.routes.ts` - **1**
    - `server/routes/auth.routes.ts` - **1**
    - `server/routes/bootstrap.routes.ts` - **6**
    - `server/routes/city.routes.ts` - **1**
    - `server/routes/content.routes.ts` - **2**
    - `server/routes/user.routes.ts` - **1**
    - `src/components/admin/AdminAiAssistant.tsx` - **1**
    - `src/components/admin/AdminGamification.tsx` - **3**
    - `src/components/admin/AdminItineraryEditor.tsx` - **3**
    - `src/components/admin/AdminUserManager.tsx` - **1**
    - `src/components/admin/AiFieldHelper.tsx` - **2**
    - `src/components/admin/GlobalEventsManager.tsx` - **1**
    - `src/components/admin/LoadingTipsManager.tsx` - **2**
    - `src/components/admin/cities/CitiesListTab.tsx` - **3**
    - `src/components/admin/cities/RegionalAnalysisModal.tsx` - **3**
    - `src/components/admin/cityEditor/EditorGeneral.tsx` - **1**
    - `src/components/admin/cityEditor/EditorRatings.tsx` - **1**
    - `src/components/admin/cityEditor/FormFieldHelper.tsx` - **1**
    - `src/components/admin/cityEditor/culture/CultureHistory.tsx` - **1**
    - `src/components/admin/cityEditor/culture/CulturePatron.tsx` - **1**
    - `src/components/admin/cityEditor/services/ServiceEvents.tsx` - **1**
    - `src/components/admin/cityEditor/services/ServiceGuides.tsx` - **1**
    - `src/components/admin/cityEditor/tabs/TabCulture.tsx` - **1**
    - `src/components/admin/cityEditor/tabs/TabGeneral.tsx` - **1**
    - `src/components/admin/cityEditor/tabs/TabRatings.tsx` - **1**
    - `src/components/admin/design/SafeArtPanel.tsx` - **1**
    - `src/components/admin/import/ImportOsmModal.tsx` - **1**
    - `src/components/admin/settings/ArrayRenderer.tsx` - **1**
    - `src/components/admin/settings/FieldRenderer.tsx` - **2**
    - `src/components/admin/settings/GlobalSettingsPanel.tsx` - **3**
    - `src/components/admin/settings/ObjectRenderer.tsx` - **1**
    - `src/components/admin/settings/PartnerIntegrationsPanel.tsx` - **1**
    - `src/components/admin/settings/inputs/BooleanToggle.tsx` - **1**
    - `src/components/admin/settings/inputs/NumberInput.tsx` - **1**
    - `src/components/admin/settings/inputs/StringInput.tsx` - **1**
    - `src/components/admin/userManager/CreateUserModal.tsx` - **1**
    - `src/components/city/tabs/CityShowcaseTab.tsx` - **1**
    - `src/components/features/diary/packing_list/SuitcaseFloatingPanel/components/SuitcaseModals.tsx` - **1**
    - `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseEditorLogic.ts` - **2**
    - `src/components/itineraries/ItineraryDetail.tsx` - **2**
    - `src/components/modals/CultureCornerModal.tsx` - **1**
    - `src/components/modals/ExportModal.tsx` - **3**
    - `src/components/modals/RoadbookModal.tsx` - **1**
    - `src/components/modals/SuggestionReviewModal.tsx` - **1**
    - `src/context/CityEditorContext.tsx` - **4**
    - `src/context/ConfigContext.tsx` - **4**
    - `src/hooks/admin/import/useImportActions.ts` - **2**
    - `src/hooks/admin/people/usePeopleAI.ts` - **1**
    - `src/hooks/admin/people/usePeopleData.ts` - **1**
    - `src/hooks/admin/useAiCompleteCity.ts` - **2**
    - `src/hooks/admin/useAiFlashSearch.ts` - **1**
    - `src/hooks/admin/useAiMagicCity.ts` - **4**
    - `src/hooks/admin/useAiTargetedSearch.ts` - **1**
    - `src/hooks/admin/useAiTaskRunner.ts` - **1**
    - `src/hooks/admin/useAiValidation.ts` - **1**
    - `src/hooks/admin/usePhotoModeration.ts` - **3**
    - `src/hooks/admin/useServiceRegeneration.ts` - **2**
    - `src/hooks/admin/useSocialCanvasLogic.ts` - **1**
    - `src/hooks/useAiGeneration.ts` - **1**
    - `src/hooks/useCityData.ts` - **1**
    - `src/hooks/useShare.ts` - **1**
    - `src/hooks/useSponsorOperations.ts` - **6**
    - `src/services/city/cityLifecycleService.ts` - **2**
    - `src/services/city/parsers/shared/ensureNumber.ts` - **1**
    - `src/services/city/parsers/shared/ensureString.ts` - **1**
    - `src/services/city/poi/poiRead.ts` - **1**
    - `src/services/community/suggestionService.ts` - **1**
    - `src/services/contentService.ts` - **1**
    - `src/services/globalEventsService.ts` - **1**
    - `src/services/importAutomationService.ts` - **2**
    - `src/services/importService.ts` - **2**
    - `src/services/mediaService.ts` - **1**
    - `src/services/socialMarketingService.ts` - **1**
    - `src/services/supabaseClient.ts` - **1**
    - `src/types/core.ts` - **1**
    - `src/utils/safeTypes.ts` - **3**

    ### File livello B (81)

    - `server/routes/content.routes.ts` - **4**
    - `src/components/admin/AdminPhotoInspector.tsx` - **2**
    - `src/components/admin/AdminPoiManager.tsx` - **1**
    - `src/components/admin/AdminSocialStudio.tsx` - **1**
    - `src/components/admin/AdminStatsDashboard.tsx` - **14**
    - `src/components/admin/AdminTaxonomyManager.tsx` - **1**
    - `src/components/admin/AiFieldHelper.tsx` - **1**
    - `src/components/admin/GlobalEventsManager.tsx` - **2**
    - `src/components/admin/LoadingTipsManager.tsx` - **1**
    - `src/components/admin/SponsorDashboardOverview.tsx` - **2**
    - `src/components/admin/cities/CitiesListTab.tsx` - **6**
    - `src/components/admin/cities/RegionalAnalysisModal.tsx` - **3**
    - `src/components/admin/cities/StrategicMapTab.tsx` - **1**
    - `src/components/admin/cities/ZoneCard.tsx` - **1**
    - `src/components/admin/cityEditor/FormFieldHelper.tsx` - **1**
    - `src/components/admin/cityEditor/services/ServiceEvents.tsx` - **3**
    - `src/components/admin/cityEditor/services/ServiceGeneric.tsx` - **3**
    - `src/components/admin/cityEditor/services/ServiceGuides.tsx` - **2**
    - `src/components/admin/cityEditor/tabs/TabLogs.tsx` - **1**
    - `src/components/admin/communications/CommsTemplates.tsx` - **1**
    - `src/components/admin/economics/PricingManager.tsx` - **2**
    - `src/components/admin/import/ImportDashboard.tsx` - **1**
    - `src/components/admin/marketing/CampaignsPanel.tsx` - **2**
    - `src/components/admin/observatory/CityStatsGrid.tsx` - **1**
    - `src/components/admin/photos/PhotoFilters.tsx` - **2**
    - `src/components/admin/poiModal/PoiLinksTab.tsx` - **1**
    - `src/components/admin/settings/ArrayRenderer.tsx` - **2**
    - `src/components/admin/settings/GlobalSettingsPanel.tsx` - **2**
    - `src/components/admin/settings/PartnerIntegrationsPanel.tsx` - **1**
    - `src/components/admin/social/SocialPreviewConfig.tsx` - **1**
    - `src/components/admin/userManager/UserToolbar.tsx` - **1**
    - `src/components/city/gallery/GalleryLightbox.tsx` - **1**
    - `src/components/city/tabs/CityCategoryTab.tsx` - **1**
    - `src/components/common/SmartFilterDrawer.tsx` - **1**
    - `src/components/features/diary/DiaryModals.tsx` - **1**
    - `src/components/features/diary/packing_list/SuitcaseFloatingPanel/components/SuitcaseModals.tsx` - **3**
    - `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelOptimisticUpdates.ts` - **1**
    - `src/components/features/diary/packing_list/suitcase/SavedSuitcasesSection.tsx` - **1**
    - `src/components/features/diary/packing_list/suitcase/TripSuitcaseSection.tsx` - **1**
    - `src/components/home/HomeContent.tsx` - **5**
    - `src/components/home/hero/HeroFilterModule.tsx` - **4**
    - `src/components/itineraries/ItineraryDetail.tsx` - **6**
    - `src/components/layout/Sidebar.tsx` - **1**
    - `src/components/layout/modals/AdminModals.tsx` - **6**
    - `src/components/modals/FullRankingsModal.tsx` - **6**
    - `src/components/modals/SectionPreviewModal.tsx` - **1**
    - `src/components/modals/SuggestionReviewModal.tsx` - **2**
    - `src/components/modals/cityInfo/CityEventsTab.tsx` - **2**
    - `src/components/modals/cityInfo/CityServicesTab.tsx` - **1**
    - `src/components/modals/sectionPreview/PreviewRatings.tsx` - **2**
    - `src/components/modals/sectionPreview/PreviewSidebar.tsx` - **1**
    - `src/components/pdf/RoadbookDocument.tsx` - **1**
    - `src/components/shop/ShopHeader.tsx` - **1**
    - `src/components/shop/ShopHomeView.tsx` - **1**
    - `src/components/shop/ShopPage.tsx` - **1**
    - `src/components/user/UserDashboard.tsx` - **2**
    - `src/components/user/dashboard/UserNotificationsTab.tsx` - **2**
    - `src/components/user/dashboard/UserOverviewTab.tsx` - **3**
    - `src/constants/services.ts` - **2**
    - `src/hooks/admin/import/useImportData.ts` - **1**
    - `src/hooks/admin/usePhotoModeration.ts` - **2**
    - `src/hooks/admin/useServiceRegeneration.ts` - **10**
    - `src/hooks/admin/useSocialTemplates.ts` - **1**
    - `src/hooks/core/useAppInitialization.ts` - **1**
    - `src/hooks/core/useGpsManager.ts` - **1**
    - `src/hooks/useCityGenerator.ts` - **4**
    - `src/hooks/useDiaryLogic.ts` - **1**
    - `src/hooks/useRankingsLogic.ts` - **7**
    - `src/hooks/useUndoStack.ts` - **3**
    - `src/hooks/useUserDashboardData.ts` - **1**
    - `src/index.tsx` - **1**
    - `src/services/city/cityCache.ts` - **1**
    - `src/services/city/poi/poiRead.ts` - **1**
    - `src/services/community/interactionService.ts` - **1**
    - `src/services/community/suggestionService.ts` - **6**
    - `src/services/dataService.ts` - **4**
    - `src/services/importService.ts` - **1**
    - `src/services/partnerIntegrationService.ts` - **1**
    - `src/services/photoMapper.ts` - **1**
    - `src/services/settingsService.ts` - **1**
    - `src/utils/seo.ts` - **3**

    ### File livello C (65)

    - `src/components/admin/AdminGamification.tsx` - **1**
    - `src/components/admin/AdminStatsDashboard.tsx` - **1**
    - `src/components/admin/AdminTaxonomyManager.tsx` - **1**
    - `src/components/admin/NewsTickerManager.tsx` - **2**
    - `src/components/admin/SponsorDashboardOverview.tsx` - **1**
    - `src/components/admin/cities/CityAuditModal.tsx` - **2**
    - `src/components/admin/cityEditor/EditorRatings.tsx` - **3**
    - `src/components/admin/cityEditor/services/ServiceEvents.tsx` - **2**
    - `src/components/admin/cityEditor/services/ServiceGeneric.tsx` - **2**
    - `src/components/admin/cityEditor/services/ServiceGuides.tsx` - **2**
    - `src/components/admin/cityEditor/services/ServiceOperators.tsx` - **1**
    - `src/components/admin/cityEditor/tabs/TabRatings.tsx` - **3**
    - `src/components/admin/economics/AdminAiAnalyticsV4.tsx` - **8**
    - `src/components/admin/import/components/ImportStatsBar.tsx` - **2**
    - `src/components/admin/observatory/AnomalyInspector.tsx` - **1**
    - `src/components/admin/poiModal/PoiInfoTab.tsx` - **1**
    - `src/components/admin/settings/ObjectRenderer.tsx` - **1**
    - `src/components/admin/userManager/CreateUserModal.tsx` - **1**
    - `src/components/aiPlanner/AiPlannerTimeline.tsx` - **1**
    - `src/components/city/tabs/CityCategoryTab.tsx` - **1**
    - `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts` - **1**
    - `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseEditorLogic.ts` - **1**
    - `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseUndoHandlers.ts` - **1**
    - `src/components/features/diary/packing_list/suitcase/AiSuggestionsPanel.tsx` - **1**
    - `src/components/modals/SuggestionModal.tsx` - **1**
    - `src/components/modals/cityInfo/ServiceAiHunter.tsx` - **2**
    - `src/constants/services.ts` - **1**
    - `src/context/BusinessContext.tsx` - **1**
    - `src/context/CityEditorContext.tsx` - **3**
    - `src/context/ConfigContext.tsx` - **1**
    - `src/context/ModalContext.tsx` - **4**
    - `src/data/ai/eventTaxonomy.ts` - **1**
    - `src/data/ai/prompts.ts` - **2**
    - `src/hooks/admin/import/useImportActions.ts` - **1**
    - `src/hooks/admin/people/usePeopleAI.ts` - **2**
    - `src/hooks/admin/useAiCompleteCity.ts` - **5**
    - `src/hooks/admin/useAiFlashSearch.ts` - **2**
    - `src/hooks/admin/useAiMagicCity.ts` - **16**
    - `src/hooks/admin/useAiTargetedSearch.ts` - **1**
    - `src/hooks/admin/useAiTaskRunner.ts` - **1**
    - `src/hooks/admin/useAiValidation.ts` - **2**
    - `src/hooks/useDiaryUndo.ts` - **1**
    - `src/hooks/useRankingsLogic.ts` - **3**
    - `src/services/affiliateTrackingService.ts` - **1**
    - `src/services/ai/aiPlanner.ts` - **7**
    - `src/services/ai/generators/listGenerator.ts` - **5**
    - `src/services/ai/generators/peopleGenerator.ts` - **2**
    - `src/services/ai/generators/poiGenerator.ts` - **8**
    - `src/services/ai/generators/qualityGenerator.ts` - **1**
    - `src/services/city/parsers/content/parseRatings.ts` - **1**
    - `src/services/city/parsers/entities/parseEvent.ts` - **1**
    - `src/services/city/parsers/entities/parseGuide.ts` - **1**
    - `src/services/city/parsers/entities/parseService.ts` - **1**
    - `src/services/city/parsers/entities/parseTourOperator.ts` - **1**
    - `src/services/city/parsers/media/parseGallery.ts` - **2**
    - `src/services/city/poi/poiMapper.ts` - **1**
    - `src/services/community/suggestionService.ts` - **1**
    - `src/services/geo.ts` - **5**
    - `src/services/globalEventsService.ts` - **3**
    - `src/services/importService.ts` - **1**
    - `src/services/partnerIntegrationService.ts` - **1**
    - `src/services/sponsors/sponsorStatsService.ts` - **1**
    - `src/types/models/City.ts` - **2**
    - `src/types/models/Sponsor.ts` - **5**
    - `src/types/subscriptions.ts` - **1**

    ### File livello D (0)

    _Nessuno._

    ---

    ## 7. Metodo di classificazione

    1. Snapshot Biome JSON: `npx biome check --reporter=json --max-diagnostics=100000 .`
    2. Estrazione di tutte le diagnostiche `lint/suspicious/noExplicitAny` con file, riga, snippet ±1.
    3. Classificazione per pattern sintattico + path + segnali di origine (Supabase / Gemini / JSON / React / terze).
    4. Livelli A/B/C/D secondo criteri B2a (meccanico / review breve / review dominio / non correggere).
    5. **Nessuna** proposta di workaround, cast aggiuntivo o suppressione Biome.

    ## 8. Vincoli permanenti di bonifica

    - Non modificare il comportamento runtime.
    - Non introdurre nuovi `as any` / cast di fuga.
    - Non introdurre suppressioni Biome.
    - Preferire tipi di dominio esistenti; `unknown` solo dove il dato è genuinamente sconosciuto in ingresso.
    - Ogni macro-batch richiede validazione post-bonifica (check · typecheck · build · smoke PO) prima dell’accettazione.
    - Le 7 bonifiche collaterali `noGlobalIsNan` già accettate **non** vanno riproposte.
    - Batch A/B/C **chiusi** — non riaprire salvo regressione documentata.

## Documentazione Batch C

Il Batch C è suddiviso in audit tematici. Metodologia SoT **§21 / §21.1 / §22** (UI/dominio, percorsi QA reali, no frammentazione ingiustificata).

| Documento | Ruolo |
|----|----|
| [`B2a_BATCH_C_INDEX.md`](./B2a_BATCH_C_INDEX.md) | Indice C1–C6 — **Batch C completo** (C1–C6 ACCETTATI) |
| [`B2a_C_START_PO_AUDIT.md`](./B2a_C_START_PO_AUDIT.md) | Avvio PO **C2** (storico) — **C2 ACCETTATO** |
| [`B2a_C3_START_PO_AUDIT.md`](./B2a_C3_START_PO_AUDIT.md) | **C3** unico batch — **ACCETTATO** (chiuso) |
| [`B2a_C4_SERVICES_AUDIT.md`](./B2a_C4_SERVICES_AUDIT.md) | **C4** Services — **ACCETTATO** (chiuso; 15→0) |
| [`B2a_C5_START_PO_AUDIT.md`](./B2a_C5_START_PO_AUDIT.md) | **C5** Community — **ACCETTATO** (chiuso; 8→0) |
| [`B2a_C5_COMMUNITY_AUDIT.md`](./B2a_C5_COMMUNITY_AUDIT.md) | Dettaglio tecnico C5 — **ACCETTATO** |
| [`B2a_C6_UTILS_AUDIT.md`](./B2a_C6_UTILS_AUDIT.md) | **C6** Utils — **ACCETTATO** (chiuso; 15→0) |
| [`B2a_C1_START_PO_AUDIT.md`](./B2a_C1_START_PO_AUDIT.md) | **C1** AI — **ACCETTATO** (chiuso; 71→0) |
| [`B2a_C1_AI_AUDIT.md`](./B2a_C1_AI_AUDIT.md) · [`B2a_C1_AI_AUDIT_P2.md`](./B2a_C1_AI_AUDIT_P2.md) | Dettaglio tecnico C1 (P1+P2) — **ACCETTATO** |

Bonifica codice Batch C: **C1–C6 ACCETTATI** (Batch C completo).

Residui live post-C: audit operativo [`B2a_R50_RESIDUAL_ANY_AUDIT.md`](./B2a_R50_RESIDUAL_ANY_AUDIT.md) — inventario storico **50**; **R1 + RP-* + RP-Residual ACCETTATI** (−50); residuo SoT corrente **0**; **B2a COMPLETATO**; L2 corrente = **B2b IN CORSO** (547; SoT progetto **1432**).