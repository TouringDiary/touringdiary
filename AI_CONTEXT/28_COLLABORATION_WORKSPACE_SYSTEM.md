# 🤝 DOC 28: COLLABORATION & WORKSPACE SYSTEM (v1.0 — CERTIFIED, Fase 10)

Questo documento descrive l'architettura del **Sistema di Collaborazione e Workspace v1** di TouringDiary, verificata sul codice post-Fase 10.

> **Specifica funzionale e roadmap**: `docs/collaboration/PIANO_DI_SVILUPPO.md` (fasi 1–10 concluse).  
> **Pannello Workspace globale (hub UI)**: `docs/collaboration/GLOBAL_WORKSPACE_PANEL.md` — single source of truth per shell, sezioni e sessione hub.  
> Questo documento è la **single source of truth** architetturale dati/servizi in `AI_CONTEXT`.

---

## DESCRIZIONE SEMPLICE

Gli utenti possono condividere Diario, Valigia e Template con altri collaboratori, organizzare risorse in **Workspace**, invitare partecipanti, vedere attività recenti, allegare file al workspace, gestire amicizie e preferenze notifiche. La configurazione globale del motore (limiti storage, tipi risorsa abilitati, presenza live) è centralizzata nell'Admin Panel.

---

## MODELLO ARCHITETTURALE (Scenario A)

Il Workspace collega la **stessa istanza** di risorsa (`workspace_resources.resource_id` = entità reale). Non esiste fork separato del dato.

Il wizard di condivisione (`CollaborationShareModal`) espone esplicitamente:
- **Duplica e condividi** (consigliato): copia personale invariata + condivisione della copia (`personalShareService.duplicateSharedResourceForOwner`).
- **Condividi questa risorsa**: collaborazione sulla risorsa corrente.

---

## MODULI PRINCIPALI

### 1. Shared Resource & ACL (Fasi 2–6)
*   **Tabelle**: `shared_resources`, `shared_resource_members`, `resource_invites`.
*   **Servizi**: `sharedResourceService.ts`, `sharedResourceAclService.ts`, `resourceInviteService.ts`, `permissionService.ts`.
*   **Kind supportati v1**: `diary`, `suitcase`, `user_template` (enum `shared_resource_kind`).

### 2. Workspace (Fasi 7–8)
*   **Tabelle**: `workspaces`, `workspace_members`, `workspace_resources`, `workspace_resource_permissions`, `workspace_invites`, `workspace_invite_permissions`.
*   **Servizi**: `workspaceService.ts`, `workspaceCompositionService.ts`, `workspaceInviteService.ts`, `workspaceResourceService.ts`.
*   **Helper RLS SQL**: `user_can_access_workspace`, `user_owns_workspace` (migration Fase 7).

### 3. Live collaboration & Lock (Fase 9)
*   **Config**: `global_settings.collaboration_live_config` → `collaborationLiveConfig.ts`.
*   **Hook**: `useCollaborationLiveSession.ts` (presenza, lock edit; rispetta `livePresenceEnabled` da `workspace_engine_config`).
*   **Servizi**: `sharedResourceLockService.ts`, `diaryLockService.ts`.

### 4. Profilo Condivisione (§9.1 — Fase 10)
*   **UI**: `UserSharingTab.tsx` (tab dashboard `condivisione`).
*   **Service**: `collaborationProfileService.ts` → `loadSharingProfileOverview` (risorse owned/member, workspace, inviti in/out con azioni accetta/rifiuta).

### 5. Sistema Amici (§9.2 — Fase 10)
*   **Tabelle dedicate** (distinte da `user_blocks`): `user_friend_requests`, `user_friends`.
*   **Enum**: `friend_request_status` (`pending`, `accepted`, `rejected`).
*   **Service**: `friendService.ts` (richiesta, accettazione, rifiuto, lista, ricerca).
*   **UI**: `UserFriendsTab.tsx` (tab `amici`: ricevute, inviate, amici, bloccati con sblocco).
*   **Blocchi utenti**: `user_blocks` + `userBlockService.ts` — **solo** blocco; non gestisce amicizie.

### 6. Motore eventi dominio (§20 — Fase 10)
*   **Tabella**: `collaboration_domain_events` (estendibile oltre il feed attività).
*   **Service**: `domainEventService.ts` (`recordCollaborationDomainEvent`, liste per workspace/risorsa).
*   **UI**: `CollaborationActivityFeed.tsx` nel pannello workspace.
*   **Trigger attuali**: salvataggio Diario/Valigia (`useDiaryDocumentSave`, `useSuitcaseDocumentSave`); upload allegati.

### 7. Allegati Workspace (§12.6 — Fase 10 + hub globale Fase 5)
*   **Tabella**: `workspace_attachments` con colonna `category` (`workspace_attachment_category`: documents, tickets, bookings, expenses, misc).
*   **Bucket Storage**: `workspace-attachments` (**privato**).
*   **Path storage**: gestito internamente da `workspaceAttachmentService` (bucket privato `workspace-attachments`; dettaglio implementativo non parte del contratto UI).
*   **Service**: `workspaceAttachmentService.ts` (list/upload per categoria, validazione MIME/firma, quote, URL firmati).
*   **UI hub**: `AllegatiSection.tsx` + `AllegatiCategoryPanel.tsx` nel pannello globale (`docs/collaboration/GLOBAL_WORKSPACE_PANEL.md`).
*   **RLS delete allineata**: uploader, owner workspace, admin.

### 8. Notifiche collaborative (§19 — Fase 10)
*   **Service**: `collaborationNotificationService.ts`, `workspaceNotificationHelper.ts`.
*   **Preferenze**: colonna `profiles.collaboration_notification_preferences` + `collaborationNotificationPrefsService.ts`.
*   **UI preferenze**: `UserSettingsTab.tsx` (sezione «Notifiche collaborazione»).
*   **UI consumo**: `UserNotificationsTab.tsx` — link workspace (`intent: 'workspace'`), polling 30s sospeso in background tab.

### 9. Informazioni autore (§21 — Fase 10)
*   **Tracking dati**: `diaryAuthorTracking.ts`, `last_modified_by` su `itineraries`/`suitcases`.
*   **UI**: `CollaborationLastEditorLine.tsx` (Valigia collaborativa live).

### 10. Admin — Motore Workspace (Fase 10)
*   **UI**: `SettingsPage.tsx` → tab **Workspace** (`WorkspaceEngineSettingsPanel.tsx`).
*   **Config via** `global_settings` + `ConfigContext` (nessun servizio config dedicato):
    *   `workspace_engine_config` — collaborazione attiva, presenza live, kind abilitati, categorie notifiche default.
    *   `collaboration_live_config` — timeout lock, heartbeat.
    *   `storage_limits` — `maxAttachmentBytes`, `maxAccountBytes`, `maxWorkspaceBytes`.
*   **Service lettura**: `workspaceEngineConfigService.ts`, `resolveStorageLimitsConfig()` in `workspaceAttachmentService.ts`.

---

## PIPELINE RUNTIME: CONDIVISIONE SEMPLICE

1. **Trigger**: Utente apre condivisione da Diario/Valigia (`useOpenCollaborationShare` → `CollaborationShareModal`).
2. **Gate**: username obbligatorio; motore abilitato (`isCollaborationEngineEnabled`, `isSharedResourceKindEnabled`).
3. **Wizard**: path → mode → share intent (duplica/condividi) → inviti.
4. **Persistenza**: `ensureShareableResource` + `sendResourceInvite` / gestione membri.
5. **Notifiche**: `collaborationNotificationService` filtra per preferenze utente.

---

## PIPELINE RUNTIME: WORKSPACE + ALLEGATI

1. **Creazione/collegamento**: `createWorkspaceWithComposition` / `addResourceToExistingWorkspace`.
2. **Inviti workspace**: `workspaceInviteService` + sync ACL (`workspaceMemberAclSync.ts`).
3. **Upload allegato**: validazione file → quota workspace → insert `workspace_attachments` + Storage bucket privato.
4. **Delete allegato**: check service (uploader | owner workspace) → delete riga → `storage.remove`.
5. **Attività**: eventi dominio visibili nel feed workspace.

---

## COMPONENTI UI CRITICI

| Componente | Ruolo |
| :--- | :--- |
| `CollaborationShareModal.tsx` | Wizard condivisione + gestione collaboratori |
| `GlobalWorkspacePanel` / `GlobalWorkspacePanelBody` | Hub workspace globale (~95% width, 6 sezioni) — vedi `GLOBAL_WORKSPACE_PANEL.md` |
| `WorkspacePanelContext.tsx` | Stato sessione hub (`WorkspacePanelProvider`) |
| `UserSharingTab.tsx` | Profilo → Condivisione |
| `UserFriendsTab.tsx` | Profilo → Amici |
| `UserDashboard.tsx` | Routing tab dashboard (`useAppRouter`) |
| `WorkspaceEngineSettingsPanel.tsx` | Admin → Impostazioni Globali → Workspace |

---

## TABELLE DATABASE (v1)

| Tabella | Scopo |
| :--- | :--- |
| `shared_resources` / `shared_resource_members` / `resource_invites` | ACL risorsa singola |
| `workspaces` + membri/risorse/permessi/inviti | Composizione workspace |
| `user_friend_requests` / `user_friends` | Amicizie |
| `user_blocks` | Solo blocco utenti |
| `collaboration_domain_events` | Motore eventi |
| `workspace_attachments` | Metadati allegati |

**Colonna profili**: `collaboration_notification_preferences` (jsonb).

**Enum aggiuntivi Fase 10**: `friend_request_status`.

---

## GLOBAL SETTINGS (chiavi)

| Chiave | Consumatori |
| :--- | :--- |
| `workspace_engine_config` | `workspaceEngineConfigService`, Admin tab Workspace |
| `storage_limits` | `workspaceAttachmentService`, Admin tab Workspace |
| `collaboration_live_config` | `collaborationLiveConfig.ts`, live session |

---

## RIFERIMENTI CODICE

*   **Services**: `src/services/collaboration/` (barrel `index.ts`).
*   **Domain types**: `src/domain/collaboration/`.
*   **Migrations Fase 10**: `supabase/migrations/20260710120000_collaboration_phase10_profile_events_attachments.sql`.
*   **Types Supabase**: `src/types/supabase.ts` (tabelle/enum sopra).

---

## FUORI SCOPE v1 (non implementato)

Lock granulare Diario oltre lock intero, admin workspace, trasferimento proprietà, allegati video, moduli Documenti/Biglietti/Prenotazioni, commenti collaborativi. Vedi chiusura in `PIANO_DI_SVILUPPO.md`.
