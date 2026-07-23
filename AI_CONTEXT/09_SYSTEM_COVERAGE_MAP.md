# 🗺️ DOC 09: SYSTEM COVERAGE MAP (v1.1 — CERTIFIED)

Questo documento fornisce un indice della copertura documentale rispetto al codice reale del progetto TouringDiary. Serve come strumento di audit per identificare moduli non ancora documentati o parzialmente allineati.

---

## INDICE COPERTURA

| Modulo / Area | Documentato | Parzialmente | Non Documentato | Note |
| :--- | :---: | :---: | :---: | :--- |
| **Core Architecture** | [x] | [ ] | [ ] | Allineato in `00_AI_RULES.md` |
| **AI Credit Engine** | [x] | [ ] | [ ] | RPC e tabelle verificate |
| **Pricing & Plans** | [x] | [ ] | [ ] | Gestito in `pricing_versions` |
| **Sponsor Lifecycle** | [x] | [ ] | [ ] | Dominio documentato (`01`, `03`, `10`, `18`, `23`, `05`…); audit sicurezza e modello target in corso → `29_SPONSOR_SECURITY_MASTERPLAN.md` |
| **Gamification** | [ ] | [x] | [ ] | XP e badge documentati solo in logica |
| **Community & Social** | [x] | [ ] | [ ] | Allineato in `16_CITY_MEDIA_MANAGEMENT.md` |
| **Staging & Import** | [x] | [ ] | [ ] | `stagingService` e `importService` allineati |
| **Geo Hierarchy** | [x] | [ ] | [ ] | Logica gerarchica in `geo.ts` allineata |
| **Suitcase System** | [x] | [ ] | [ ] | Allineato in `31_PACKING_SUITCASE_SYSTEM.md` |
| **Ranking System** | [x] | [ ] | [ ] | Allineato in `11_RANKING_SYSTEM.md` |
| **Edge Functions** | [x] | [ ] | [ ] | Stripe e Gemini verificate |
| **Design System** | [x] | [ ] | [ ] | Allineato in `32_DESIGN_SYSTEM_FOUNDATION.md` |
| **Roadbook Engine** | [x] | [ ] | [ ] | Verificato in `RoadbookDocument.tsx` |
| **Notification System**| [x] | [ ] | [ ] | Allineato in `12_NOTIFICATION_SYSTEM.md` |
| **Analytics System**   | [x] | [ ] | [ ] | Allineato in `13_ANALYTICS_PIPELINE.md` |
| **Observatory BI**     | [x] | [ ] | [ ] | Allineato in `14_OBSERVATORY_ENGINE.md` |
| **CRM Messaging**      | [x] | [ ] | [ ] | Allineato in `15_CRM_MESSAGING.md` |
| **Culture System**     | [x] | [ ] | [ ] | Allineato in `17_CITY_CULTURE_SYSTEM.md` |
| **Tour Operators**     | [x] | [ ] | [ ] | Allineato in `18_TOUR_OPERATOR_SYSTEM.md` |
| **Essential Services** | [x] | [ ] | [ ] | Allineato in `19_ESSENTIAL_SERVICES_SYSTEM.md` |
| **City Events**        | [x] | [ ] | [ ] | Allineato in `20_CITY_EVENTS_SYSTEM.md` |
| **City History**       | [x] | [ ] | [ ] | Allineato in `21_CITY_HISTORY_SYSTEM.md` |
| **Patron Saint**       | [x] | [ ] | [ ] | Allineato in `22_PATRON_SAINT_SYSTEM.md` |
| **Marketplace**        | [x] | [ ] | [ ] | Allineato in `23_CITY_MARKETPLACE_SYSTEM.md` |
| **Around Me Explorer** | [x] | [ ] | [ ] | Allineato in `24_AROUND_ME_EXPLORER_SYSTEM.md` |
| **User Onboarding**   | [x] | [ ] | [ ] | Allineato in `25_USER_ONBOARDING_SYSTEM.md` |
| **Affiliate System**   | [ ] | [x] | [ ] | Allineato in `26_AFFILIATE_TRACKING_SYSTEM.md` |
| **Review System**      | [x] | [x] | [x] | P0 2026-07-23: publish immediato, 1/utente, edit/delete, SoT `pois.rating`, alert coda — `27_USER_REVIEW_SYSTEM.md` v2.0 · `AUDIT_REVIEWS_AND_RATINGS.md` §18 |
| **Collaboration & Workspace** | [x] | [ ] | [ ] | Allineato in `28_COLLABORATION_WORKSPACE_SYSTEM.md` v2.0 (hub UI + wizard) |
| **Platform Settings / Centro di Controllo** | [x] | [ ] | [ ] | SSOT in `30_PLATFORM_SETTINGS_MASTERPLAN.md` (v0.2); Feature Flag Engine; codice parziale |
| **Development Workflow (layer operativo)** | [x] | [ ] | [ ] | Framework in `AI_DEV_WORKFLOW/`; WF-01 migrazione documentale completato |

---

## MODULI NON DOCUMENTATI (DA INTEGRARE)

I seguenti file/moduli sono presenti nel codice ma non hanno ancora una sezione di dettaglio tecnico in `AI_CONTEXT`:

### Services
*   `communicationService.ts`: [x] Documentato in DOC 15.
*   `notificationService.ts`: [x] Documentato in DOC 12.
*   `trackingService.ts`: [x] Documentato in DOC 13.
*   `zoneService.ts` / `taxonomyService.ts`: Gestione categorie e territori.
*   `observatoryService.ts`: [x] Documentato in DOC 14.

### Hooks
*   `usePoiManager.ts`: Gestione complessa dei punti di interesse.
*   `useAdminExport.ts`: Utility per export dati CSV/PDF.
*   `useCityGallery.ts`: [x] Documentato in DOC 16.

### Components (Critical)
*   `AdminControlCenterAI.tsx`: Dashboard economica v4.
*   `ImportDashboard.tsx`: Console di gestione Staging OSM.

---

## STATO ALLINEAMENTO SCHEMA DB

*   **Tabelle Documentate**: `profiles`, `cities`, `pois`, `itineraries`, `sponsors`, `sponsor_requests`, `subscriptions`, `pricing_versions`, `user_ai_credits`, `credit_transactions`, `ai_global_usage`, `xp_actions`, `rewards_catalog`, `badges`, `community_posts`, `live_snaps`, `pois_staging`, `notifications`, `communication_logs`, `system_messages`, `obs_poi_anomalies`, `shared_resources`, `workspaces`, `workspace_attachments`, `collaboration_domain_events`, `user_friends`, `user_friend_requests`, `user_blocks`.
*   **Tabelle NON Documentate**: `communication_logs` (partecipazione), `obs_city_quality_metrics`, dettaglio RLS per-tabella collaborazione (vedi DOC 28).

---

> [!NOTE]
> Questo documento deve essere aggiornato ogni volta che viene introdotto un nuovo servizio o una nuova tabella nel database per mantenere la "Living Documentation".
