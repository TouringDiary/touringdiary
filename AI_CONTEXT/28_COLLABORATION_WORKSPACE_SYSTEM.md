# 28 — Collaboration & Workspace System

> **SSOT di collaborazione e Workspace** allineato al dominio Viaggio congelato.
> Regole di dominio → `34A_DOMAIN_DESIGN_RULES.md`.  
> Struttura Viaggio → `37_VIAGGIO_DOMAIN.md`.  
> Visione MySpace → `35_MYSPACE_PRODUCT_VISION.md`.
>
> La sezione **Target di dominio** è Source of Truth di prodotto.  
> La sezione **Runtime as-is** descrive il codice attuale e il debito di allineamento — non prevale sul target.

**Versione:** 3.1.0  
**Data:** 2026-07-26  
**Stato:** Target di dominio congelato · runtime in allineamento

---

## DESCRIZIONE SEMPLICE

Gli utenti collaborano su **copie** di risorse (Diario, Valigia, Template, …) dentro **Workspace**.  
MySpace conserva gli **originali**. Il **Viaggio originale non viene mai condiviso**.  
Oltre allo share per risorsa, è ammesso creare un Workspace **partendo da un Viaggio** (selezione → copie → shell isomorfa).

---

# PARTE A — Target di dominio (Source of Truth)

## A1. Invarianti

| Regola | Enunciato |
|--------|-----------|
| MySpace | Solo **originali** |
| Workspace | Solo **copie di lavoro** (nuovo ID) |
| Viaggio | Mai condiviso come originale |
| Condividi | Sempre crea copia → collabora/collega la copia |
| Isolamento | Originale ≠ copia (stato, autosave, lock, realtime, ACL) |
| Delete | Delete MySpace ↛ delete copie WS; delete WS ↛ delete originali |
| Terminologia | Usare **Viaggio** (non «Trip») nella documentazione funzionale |

**Rimosso dal prodotto:** «Condividi Originale» / collaborazione sull’istanza personale (`share_current`).

## A2. Due morfologie Workspace (estensione, non sostituzione)

### A2.1 Share per risorsa *(resta)*

Workspace collegati a risorse condividibili:

- Diario
- Valigia
- Template utente
- future risorse condividibili

Queste modalità **non** vengono eliminate.

### A2.2 Workspace da Viaggio *(estensione)*

Flusso:

```text
MySpace → seleziona Viaggio → crea Workspace
       → seleziona risorse da copiare → crea Workspace
```

| Regola | Valore |
|--------|--------|
| Contenuto | Solo **copie** delle risorse selezionate |
| Shell | Stessa **struttura logica** del Viaggio (DOC 37) |
| Sezioni non copiate | Presenti come **vuote** (slot per collaboratori) |
| Originale | Resta in MySpace, invariato |

Questa modalità **estende** A2.1; non la sostituisce.

## A3. Stereotipi in shell WS-da-Viaggio

La shell espone le sezioni del modello Viaggio:

| Sezione | In WS (su copie) |
|---------|------------------|
| Diario / Valigia / Ricordi / Allegati | Resource (se copiate; altrimenti vuote) |
| Roadbook | Library (se copiata / vuota) |
| Mappa / Riepilogo | View sulle copie presenti (possono risultare parziali) |

Autosave, lock, realtime, ACL operano sulle **copie**, mai sull’originale MySpace.

## A4. Ruoli e permessi (principio)

- Ruoli su risorsa: Proprietario · Collaboratore · Visualizzatore.
- ACL workspace per risorsa: none · viewer · collaborator.
- Livello effettivo = massimo tra ACL risorsa e ACL workspace (principio invariato).
- Inviti: a risorsa e/o a workspace.
- Guest: flussi Condividi/Workspace bloccati → auth.
- Community ≠ Condividi (percorsi distinti).
- Pubblicazione Community tipicamente da un **Diario**, non share del Viaggio.

## A5. Allegati

| Tipo | Appartenenza |
|------|--------------|
| Allegati del Viaggio | Patrimonio MySpace del Viaggio |
| Allegati Workspace | Gruppo / workspace |

Devono restare immediatamente distinguibili in UX.

## A6. Salva una copia

Da Workspace → nuova copia personale indipendente in MySpace (nessun link automatico al workspace del richiedente).

---

# PARTE B — Runtime as-is (fotografia codice)

> Verificato sul codice post-Fase 10 + hub globale + wizard (luglio 2026).  
> Descrive **cosa fa oggi il sistema**. Non prevale sulla Parte A.  
> Storico implementativo: `docs/_archive/collaboration/`.
>
> **Debito rispetto alla Parte A:** assente Workspace-da-Viaggio (shell isomorfa); eventuale residuo codice di percorsi non più di prodotto non va usato né documentato come comportamento ammesso.

---

## B1. Principi runtime (certificate sul codice)

| Regola | Implementazione as-is |
|--------|------------------------|
| **Scenario Workspace** | Workspace collega **copie** (`workspace_resources.resource_id` = ID della copia). Materializzazione via `duplicate_and_share` / `materializeWorkspaceComposition` + `duplicateSharedResourceForOwner`. |
| **Risorse v1** | `diary`, `suitcase`, `user_template` (`shared_resource_kind`) |
| **Modalità** | `collaborative` \| `personal` per risorsa |
| **Ruoli risorsa** | Proprietario, Collaboratore, Visualizzatore (`CollaborativeMemberRole`) |
| **ACL workspace per risorsa** | `none` \| `viewer` \| `collaborator` (`WorkspaceResourceAccess`) |
| **Precedenza permessi (S2)** | Livello effettivo = **massimo** tra ACL risorsa e ACL workspace (`resolveEffectiveAccessLevel` in `permissions.ts`) |
| **Inviti** | Due flussi: **invito a risorsa** (ruolo su risorsa) e **invito a workspace** (matrice permessi per risorsa) — motore unico |
| **Utenti bloccati** | `user_blocks` impedisce inviti/reciprocità (`userBlockService`) |
| **Nome utente** | Obbligatorio per collaborare; termine UI: «Nome utente» (slug profilo) |
| **Guest** | Flussi Condividi/Workspace bloccati → auth → ripresa intent dove possibile |
| **Limite workspace** | Max **2** workspace di proprietà per utente (`MAX_OWNED_WORKSPACES_PER_USER`) |
| **Community ≠ Condividi** | Percorsi UI distinti |

### Condivisione — intenti wizard (prodotto / runtime allineato)

| Intent | Comportamento |
|--------|---------------|
| **Condividi** (unico flusso UX) | Crea sempre una copia indipendente e collabora/collega **quella** (`duplicateSharedResourceForOwner` / materialize composizione). |
| **Salva una copia** (hub) | Copia singolo elemento da workspace → `savePersonalCopyFromWorkspace` — nessun link automatico al workspace del richiedente |

### Fuori scope v1 (runtime)

Lock granulare Diario oltre lock intero, admin workspace, trasferimento proprietà, allegati video, moduli Documenti/Biglietti/Prenotazioni come entità separate (categorie allegati workspace sì), commenti collaborativi.

### Configurazione (non Feature Flag)

La collaborazione è capacità strutturale. **Non** esiste Feature Flag `feature.platform.collaboration_live`.  
`collaboration_live_config` in `global_settings` = Configuration Source (timeout lock / heartbeat).  
Anche: `workspace_engine_config`, `storage_limits` (admin).

**Audit A** (coerenza Workspace vs architettura complessiva, WF-02 Post-3.4): distinto da Audit B CC (chiuso); resta tracciato in WF-02.

---

## B2. Wizard unico

**Un solo orchestratore:** `CollaborationShareModal.tsx` — non tre wizard separati.  
Moduli di supporto (estratti, stessa logica): `collaborationShareLoaders.ts`, `collaborationShareDraft.ts`, `collaborationSharePipeline.ts`, `collaborationSharePresentation.ts`.  
Hook locali (solo modal, stato resta nell’orchestratore): `useCollaborationShareBootstrap`, `useCollaborationShareCompositionHandlers`, `useCollaborationShareResourceHandlers`, `useCollaborationShareWizardActions`.

### Entry mode (`WizardEntryMode`)

| Mode | Apertura | Step iniziali |
|------|----------|---------------|
| `share` | Condividi su Diario/Valigia/Template (`useOpenCollaborationShare`) | `path` → … |
| `create_workspace` | Crea Workspace da hub (`useOpenCreateWorkspace`) | `workspace_setup` → `workspace_composition` → … |
| `workspace_from_viaggio` | Workspace da Viaggio MySpace (`useOpenWorkspaceFromViaggio`) | stesso grafo create (copie + shell) |
| `add_element_to_workspace` | Aggiungi elemento (`useOpenAddElementToWorkspace`) | `pick_element` |

`create_workspace` e `workspace_from_viaggio` condividono il grafo creazione (`isWorkspaceCreationEntryMode`).

### Grafo step (`getWizardSteps` / `collaborationSharePresentation.ts`)

| Contesto | Sequenza |
|----------|----------|
| `create_workspace` / `workspace_from_viaggio` | setup → composition → invite |
| `add_element_to_workspace` | pick_element |
| `share` + simple | path → mode → invite (copy-only; niente share_intent) |
| `share` + add_workspace | path → workspace_select |
| `share` + create_workspace | path → setup → composition → invite |

**Componenti wizard:** `CollaborationShareWizard`, `WorkspaceShareWizardSteps`, `CollaborationWizardFooter`, `WizardStepIndicator`, `useCollaborationWizardNavigation`.

**Post-success:** apertura hub `openCollaborationWorkspace({ workspaceId })`.

**Parte A (STEP-4):** entry «Workspace da Viaggio» presente; share sempre su copie; nessun share del Viaggio originale.
---

## B3. Hub Workspace globale

`WorkspacesModal` **rimosso**. Hub = `GlobalWorkspacePanel` via `WorkspaceHost` quando `activeModal === 'collaborationWorkspace'`.

### Filosofia UI

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

### Entry points hub

`useOpenCollaborationWorkspace`, `MainLayout.toggleWorkspacePanel`, `NavigationContext` (`section === 'workspace'`), deep link post-auth, `CollaborationShareModal` post-create.

### Sessione

`WorkspacePanelProvider` in `AppCoordinator`; `modalProps.workspaceId` / `initialSection` consume-once all'apertura; `useWorkspaceSessionEnd` + `workspaceSessionRegistry` per teardown.

---

## B4. Moduli dati e servizi

### 1. Shared Resource & ACL

- **Tabelle:** `shared_resources`, `shared_resource_members`, `resource_invites`
- **Servizi:** `sharedResourceService`, `sharedResourceAclService`, `resourceInviteService`, `permissionService`

### 2. Workspace

- **Tabelle:** `workspaces`, `workspace_members`, `workspace_resources`, `workspace_resource_permissions`, `workspace_invites`, `workspace_invite_permissions`
- **Servizi:** `workspaceService`, `workspaceCompositionService`, `workspaceInviteService`, `workspaceResourceService`, `workspaceMemberAclSync`
- **Composizione:** `materializeWorkspaceComposition`, `resolveWorkspaceCompositionCatalog`, `resolveWorkspaceCompositionBlueprint`

### 3. Live & Lock

- **Config:** `global_settings.collaboration_live_config`, `workspace_engine_config`
- **Hook:** `useCollaborationLiveSession`
- **Servizi:** `sharedResourceLockService`, `diaryLockService`

### 4. Profilo Condivisione

- `UserSharingTab.tsx`, `collaborationProfileService.ts`

### 5. Sistema Amici

- `user_friend_requests`, `user_friends` (≠ `user_blocks`)
- `friendService.ts`, `UserFriendsTab.tsx`

### 6. Motore eventi dominio

- `collaboration_domain_events`, `domainEventService.ts`, `CollaborationActivityFeed.tsx`
- Trigger: `useDiaryDocumentSave`, `useSuitcaseDocumentSave`, upload allegati

### 7. Allegati Workspace

- `workspace_attachments`, bucket privato `workspace-attachments`
- `workspaceAttachmentService.ts`, `AllegatiSection.tsx`
- Categorie: documents, tickets, bookings, expenses, misc

### 8. Notifiche collaborative

- `collaborationNotificationService`, `profiles.collaboration_notification_preferences`

### 9. Informazioni autore

- `last_modified_by`, `CollaborationLastEditorLine.tsx`

### 10. Admin — Motore Workspace

- `WorkspaceEngineSettingsPanel.tsx` → `workspace_engine_config`, `storage_limits`, `collaboration_live_config`

---

## B5. Pipeline runtime

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

## B6. Componenti UI critici

| Componente | Ruolo |
| :--- | :--- |
| `CollaborationShareModal.tsx` | Wizard unico (+ loaders/draft/pipeline) |
| `GlobalWorkspacePanel` / `GlobalWorkspacePanelBody` | Hub globale |
| `WorkspacePanelContext.tsx` | Stato sessione hub |
| `CondivisioneSection.tsx` | Griglia elementi, Aggiungi, Salva copia |
| `UserSharingTab` / `UserFriendsTab` | Profilo |
| `WorkspaceEngineSettingsPanel.tsx` | Admin config |

---

## B7. Tabelle database (v1)

`shared_resources`*, `workspaces`*, `user_friend_requests`, `user_friends`, `user_blocks`, `collaboration_domain_events`, `workspace_attachments`, `profiles.collaboration_notification_preferences`

\* e tabelle collegate elencate in B4 (members, resources, permissions, invites, attachments).

---

## B8. Riferimenti codice

* **Services:** `src/services/collaboration/` (`index.ts`)
* **Domain:** `src/domain/collaboration/`
* **Hooks:** `useOpenCollaborationShare`, `useOpenCreateWorkspace`, `useOpenAddElementToWorkspace`, `useOpenWorkspaceFromViaggio`, `useOpenCollaborationWorkspace`
* **UI hub:** `src/components/workspace/global/`
* **Wizard:** `CollaborationShareModal.tsx` · loaders/draft/pipeline/presentation · hook locali bootstrap/composition/resource/wizardActions
* **Migration Fase 10:** `supabase/migrations/20260710120000_collaboration_phase10_profile_events_attachments.sql`

---

## Cronologia

| Versione | Data | Note |
|----------|------|------|
| 1.0–2.0 | 2026-07 | Certificazione Fase 10 + hub/wizard |
| 2.x | 2026-07-25 | Dominio MySpace=originali / WS=copie |
| 3.0.0 | 2026-07-26 | Riscrittura: target dominio Viaggio + WS-da-Viaggio; as-is separato |
| 3.1.0 | 2026-07-26 | Parte B ripristinata a fotografia runtime completa (senza Scenario A / share originale) |
| 3.2.0 | 2026-07-27 | STEP-4: entry `workspace_from_viaggio`; moduli wizard estratti; grafo copy-only |
