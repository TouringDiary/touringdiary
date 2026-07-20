# 🤝 DOC 28: COLLABORATION & WORKSPACE SYSTEM (v2.0 — CERTIFIED)

> **Single source of truth** per collaborazione e Workspace v1 — dati, servizi, regole funzionali, hub UI e wizard.
> Verificato sul codice post-Fase 10 + hub globale + macrofase wizard (luglio 2026).
> Storico implementativo: `docs/_archive/collaboration/`

### Decisione PO correlata (2026-07-20 — DL-P12 / DOC 30)

La collaborazione è una **capacità strutturale** della piattaforma. **Non** esiste (e non deve esistere) un Feature Flag Centro di Controllo del tipo `feature.platform.collaboration_live`.

**Audit architetturale finale (WF-02 Post-3.4 — Audit A):** verificare la coerenza di Workspace, condivisione, ruoli, realtime, lock, presenza, sincronizzazione, ownership e UX rispetto all’architettura complessiva. **Nessuna implementazione** in questo passo; **non** è una decisione su toggle CC.

`collaboration_live_config` in `global_settings` resta Configuration Source operativa (timeout lock / heartbeat), distinta da qualsiasi Feature Flag.

---

## DESCRIZIONE SEMPLICE

Gli utenti condividono Diario, Valigia e Template, organizzano risorse in **Workspace**, invitano collaboratori, allegano file, vedono attività e gestiscono amicizie e notifiche. L'hub Workspace globale è sempre disponibile dall'app; un unico wizard orchestra condivisione, creazione workspace e aggiunta elementi.

---

## REGOLE FUNZIONALI (v1 — certificate sul codice)

### Principi

| Regola | Implementazione |
|--------|-----------------|
| **Scenario A** | Workspace collega la **stessa istanza** (`workspace_resources.resource_id` = entità reale). Nessun fork. |
| **Risorse v1** | `diary`, `suitcase`, `user_template` (`shared_resource_kind`) |
| **Modalità** | `collaborative` \| `personal` per risorsa |
| **Ruoli risorsa** | Proprietario, Collaboratore, Visualizzatore (`CollaborativeMemberRole`) |
| **ACL workspace per risorsa** | `none` \| `viewer` \| `collaborator` (`WorkspaceResourceAccess`) |
| **Precedenza permessi (S2)** | Livello effettivo = **massimo** tra ACL risorsa e ACL workspace (`resolveEffectiveAccessLevel` in `permissions.ts`) |
| **Inviti** | Due flussi: **invito a risorsa** (ruolo su risorsa) e **invito a workspace** (matrice permessi per risorsa nel workspace) — motore unico |
| **Utenti bloccati** | `user_blocks` impedisce inviti/reciprocità (`userBlockService`) |
| **Nome utente** | Obbligatorio per collaborare; termine UI: «Nome utente» (slug profilo) |
| **Guest** | Flussi Condividi/Workspace bloccati → auth → ripresa intent dove possibile |
| **Limite workspace** | Max **2** workspace di proprietà per utente (`MAX_OWNED_WORKSPACES_PER_USER`) |
| **Community ≠ Condividi** | Percorsi UI distinti |

### Condivisione — intenti wizard

| Intent | Comportamento |
|--------|---------------|
| **Duplica e condividi** | Copia personale invariata + condivisione copia (`duplicateSharedResourceForOwner`) |
| **Condividi questa risorsa** | Collaborazione sulla risorsa corrente |
| **Salva una copia** (hub) | Copia singolo elemento da workspace → `savePersonalCopyFromWorkspace` — nessun link automatico al workspace del richiedente |

### Fuori scope v1

Lock granulare Diario oltre lock intero, admin workspace, trasferimento proprietà, allegati video, moduli Documenti/Biglietti/Prenotazioni come entità separate (categorie allegati workspace sì), commenti collaborativi.

---

## WIZARD UNICO DI COLLABORAZIONE

**Un solo orchestratore:** `CollaborationShareModal.tsx` — non tre wizard separati.

### Entry mode (`WizardEntryMode`)

| Mode | Apertura | Step iniziali |
|------|----------|---------------|
| `share` | Condividi su Diario/Valigia/Template (`useOpenCollaborationShare`) | `path` → … |
| `create_workspace` | Crea Workspace da hub (`useOpenCreateWorkspace`) | `workspace_setup` → `workspace_composition` → … |
| `add_element_to_workspace` | Aggiungi elemento (`useOpenAddElementToWorkspace`) | `pick_element` → `share_intent` |

### Grafo step (`getWizardSteps` / `collaborationSharePresentation.ts`)

| Contesto | Sequenza |
|----------|----------|
| `create_workspace` | setup → composition → [share_intent se elementi] → invite |
| `add_element_to_workspace` | pick_element → share_intent |
| `share` + simple + collaborative | path → mode → share_intent → invite |
| `share` + simple + personal | path → mode → invite |
| `share` + add_workspace | path → share_intent → workspace_select |
| `share` + create_workspace | path → share_intent → setup → composition → invite |

**Componenti:** `CollaborationShareWizard`, `WorkspaceShareWizardSteps`, `CollaborationWizardFooter`, `WizardStepIndicator`, `useCollaborationWizardNavigation`.

**Post-success:** apertura hub `openCollaborationWorkspace({ workspaceId })`.

---

## HUB WORKSPACE GLOBALE

`WorkspacesModal` **rimosso**. Hub = `GlobalWorkspacePanel` via `WorkspaceHost` quando `activeModal === 'collaborationWorkspace'`.

### Filosofia

- Workspace = **area di lavoro**, non navigazione (Community/Around Me restano invariati).
- Linguetta fisica sidebar (~95% larghezza desktop); pannello nasce dalla linguetta.
- Selezione card workspace → ingresso automatico sezione **Condivisione**.
- **D27:** chiusura pannello non azzera `activeWorkspaceId` (persiste fino ad Abbandona/Elimina/logout).

### Sei sezioni (`globalWorkspacePresentation.ts`)

| ID | Label | Componente | Richiede workspace attivo |
|----|-------|------------|----------------------------|
| `workspace` | Workspace | `WorkspaceSection.tsx` | No |
| `condivisione` | Condivisione | `CondivisioneSection.tsx` | Sì |
| `allegati` | Allegati | `AllegatiSection.tsx` | Sì |
| `attivita` | Attività | `AttivitaSection.tsx` | Sì |
| `utenti` | Utenti | `UtentiSection.tsx` | Sì |
| `inviti` | Inviti | `InvitiSection.tsx` | No (user-scoped) |

### Layout e motion

| Costante | File | Valore / ruolo |
|----------|------|----------------|
| `WORKSPACE_GLOBAL_PANEL_WIDTH_RATIO` | `workspacePanelLayout.ts` | `0.95` |
| `WORKSPACE_GLOBAL_PANEL_HEIGHT` | idem | `17.5rem` |
| Binder animation | `slidePanelMotion.ts` | `max-height` top-origin, non translate-y |
| Geometria | `resolveGlobalWorkspacePanelGeometry.ts` | Desktop centrato sotto header; mobile full width |

### Entry points

`useOpenCollaborationWorkspace`, `MainLayout.toggleWorkspacePanel`, `NavigationContext` (`section === 'workspace'`), deep link post-auth, `CollaborationShareModal` post-create.

### Sessione

`WorkspacePanelProvider` in `AppCoordinator`; `modalProps.workspaceId` / `initialSection` consume-once all'apertura; `useWorkspaceSessionEnd` + `workspaceSessionRegistry` per teardown.

---

## MODULI PRINCIPALI (dati e servizi)

### 1. Shared Resource & ACL
* **Tabelle:** `shared_resources`, `shared_resource_members`, `resource_invites`
* **Servizi:** `sharedResourceService`, `sharedResourceAclService`, `resourceInviteService`, `permissionService`

### 2. Workspace
* **Tabelle:** `workspaces`, `workspace_members`, `workspace_resources`, `workspace_resource_permissions`, `workspace_invites`, `workspace_invite_permissions`
* **Servizi:** `workspaceService`, `workspaceCompositionService`, `workspaceInviteService`, `workspaceResourceService`, `workspaceMemberAclSync`
* **Composizione:** `materializeWorkspaceComposition`, `resolveWorkspaceCompositionCatalog`, `resolveWorkspaceCompositionBlueprint`

### 3. Live & Lock
* **Config:** `global_settings.collaboration_live_config`, `workspace_engine_config`
* **Hook:** `useCollaborationLiveSession`
* **Servizi:** `sharedResourceLockService`, `diaryLockService`

### 4. Profilo, Amici, Eventi, Allegati, Notifiche, Autore, Admin
*(Invariato rispetto a v1.0 — vedi sezioni 4–10 sotto)*

### 4. Profilo Condivisione
* `UserSharingTab.tsx`, `collaborationProfileService.ts`

### 5. Sistema Amici
* `user_friend_requests`, `user_friends` (≠ `user_blocks`)
* `friendService.ts`, `UserFriendsTab.tsx`

### 6. Motore eventi dominio
* `collaboration_domain_events`, `domainEventService.ts`, `CollaborationActivityFeed.tsx`
* Trigger: `useDiaryDocumentSave`, `useSuitcaseDocumentSave`, upload allegati

### 7. Allegati Workspace
* `workspace_attachments`, bucket privato `workspace-attachments`
* `workspaceAttachmentService.ts`, `AllegatiSection.tsx`, categorie: documents, tickets, bookings, expenses, misc

### 8. Notifiche collaborative
* `collaborationNotificationService`, `profiles.collaboration_notification_preferences`

### 9. Informazioni autore
* `last_modified_by`, `CollaborationLastEditorLine.tsx`

### 10. Admin — Motore Workspace
* `WorkspaceEngineSettingsPanel.tsx` → `workspace_engine_config`, `storage_limits`, `collaboration_live_config`

---

## PIPELINE RUNTIME

### Condivisione semplice
1. `useOpenCollaborationShare` → gate username/engine/kind
2. Wizard path/mode/intent/invite
3. `ensureShareableResource` + inviti/membri
4. Notifiche filtrate per preferenze

### Workspace + allegati
1. `createWorkspaceWithComposition` / `addResourceToExistingWorkspace`
2. Inviti + sync ACL
3. Salva copia / upload allegati / eventi dominio

---

## COMPONENTI UI CRITICI

| Componente | Ruolo |
| :--- | :--- |
| `CollaborationShareModal.tsx` | Wizard unico |
| `GlobalWorkspacePanel` / `GlobalWorkspacePanelBody` | Hub globale |
| `WorkspacePanelContext.tsx` | Stato sessione hub |
| `CondivisioneSection.tsx` | Griglia elementi, Aggiungi, Salva copia |
| `UserSharingTab` / `UserFriendsTab` | Profilo |
| `WorkspaceEngineSettingsPanel.tsx` | Admin config |

---

## TABELLE DATABASE (v1)

`shared_resources`*, `workspaces`*, `user_friend_requests`, `user_friends`, `user_blocks`, `collaboration_domain_events`, `workspace_attachments`, `profiles.collaboration_notification_preferences`

---

## RIFERIMENTI CODICE

* **Services:** `src/services/collaboration/` (`index.ts`)
* **Domain:** `src/domain/collaboration/`
* **Hooks:** `useOpenCollaborationShare`, `useOpenCreateWorkspace`, `useOpenAddElementToWorkspace`, `useOpenCollaborationWorkspace`
* **UI hub:** `src/components/workspace/global/`
* **Migration Fase 10:** `supabase/migrations/20260710120000_collaboration_phase10_profile_events_attachments.sql`

---

## CRONOLOGIA

| Versione | Data | Modifiche |
|----------|------|-----------|
| 1.0 | 2026-07 | Certificazione post-Fase 10 |
| 2.0 | 2026-07-13 | WF-01: regole funzionali, hub UI, wizard unico; assorbimento `docs/collaboration/` |
