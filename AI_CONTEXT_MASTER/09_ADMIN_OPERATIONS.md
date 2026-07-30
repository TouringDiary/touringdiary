# 🛠️ MASTER 09: ADMIN OPERATIONS

## DESCRIZIONE SEMPLICE
Il modulo Admin Operations fornisce gli strumenti necessari alla redazione e agli sviluppatori per gestire l'intero ecosistema TouringDiary. Include la gestione dei dati (Import/Export), la moderazione dei contenuti community e la configurazione economica della piattaforma.

---

## MODULI DEL SISTEMA

### 1. Admin Dashboard (Control Center)
*   **Funzioni**: Monitoraggio utenti, gestione abbonamenti, ricarica crediti.
*   **Componente**: `AdminControlCenter.tsx`.
*   **Service**: `aiAdminService.ts`.

### 2. Import & Staging Pipeline
*   **Logica**: Acquisizione dati da OpenStreetMap (OSM) o CSV.
*   **Pipeline**: `ImportManager.tsx` -> `stagingService.ts` -> `importService.ts`.
*   **Staging Area**: Permette la validazione dei dati prima del "Push to Live".

### 3. Settings System (Global Config)
*   **Logica**: Modifica parametri runtime (es. Manutenzione on/off, configurazione Onboarding, **motore Workspace**).
*   **Tabella**: `global_settings`, `system_messages`.
*   **UI**: `SettingsPage.tsx` (tab **Workspace** → `WorkspaceEngineSettingsPanel.tsx` per engine, lock live e `storage_limits`).
*   **Dettaglio collaborazione**: `AI_CONTEXT/28_COLLABORATION_WORKSPACE_SYSTEM.md` § Admin.

### 4. Export System
*   **Funzioni**: Generazione report in CSV, JSON o PDF per utenti e admin; export itinerario utente (PDF/DOCX/TXT) da `ExportModal`.
*   **Componente**: `ExportModal.tsx` (itinerario: preparedDoc condiviso PDF/DOCX/Preview; logo via `useLogoRasterizer`; collage via `heroCoverCollagePlan`; preview WYSIWYG con footer editoriale).
*   **Hook**: `useAdminExport.ts` (export admin).

### 5. Moderation Reviews
*   **Logica**: Approvazione o rifiuto delle recensioni utente pendenti.
*   **Pipeline**: `communityService.updateUnifiedReviewStatus`.
*   **UI**: `ModerationPanel.tsx`.

---

## PIPELINE RUNTIME (Push to Live)
1.  **Stage**: I dati vengono importati tramite `importService` nell'area di staging (`pois_staging`).
2.  **Verify**: L'admin corregge nomi, categorie e immagini nel pannello Staging.
3.  **Promote**: La funzione `promoteToLive` (`stagingService.ts`) arricchisce il POI via AI e lo inserisce direttamente nella tabella di produzione `pois`, aggiornando poi lo stato in staging a `imported`.
4.  **Notify**: Invio notifica automatica tramite `notificationService`.

## COMPONENTI ARCHITETTURALI
*   **Admin UI**: `AdminDashboard.tsx`, `PartnerManager.tsx`, `MarketingManager.tsx`.
*   **Services**: `stagingService.ts`, `importService.ts`, `aiAdminService.ts`.
*   **RPC**: `get_ai_economics_stats_v4`.

## TABELLE DATABASE COINVOLTE
*   `cities`, `pois`, `reviews`, `global_settings`, `system_messages`, `sponsors`.
