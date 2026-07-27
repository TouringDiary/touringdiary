# Macrofase Workspace Wizard — Documento di progetto ufficiale

**Progetto:** TouringDiary  
**Versione documento:** 1.0  
**Stato:** In attesa di approvazione — **FASE 4 completata** (macrofase wizard chiusa in implementazione)  
**Data:** 10 luglio 2026  
**Ambito:** Wizard di creazione Workspace, wizard di condivisione (adattamenti mirati), aggiunta elementi post-create, azione «Salva una copia»

> **Aggiornamento dominio (PO 2026-07-25) — supersede parziale**  
> La SSOT prodotto attiva è: **MySpace = solo originali · Workspace = solo copie** (DOC 35 §2.3, DOC 28 § Dominio ufficiale, WF-04).  
> **`share_current` / «Condividi Originale» è eliminato dal prodotto.** Le sezioni storiche sotto che descrivono Originale/Duplicato come scelta UX restano come **cronaca implementativa** del luglio 2026, non come regola futura. Il flusso UX ammesso è un solo **Condividi** (copia interna → Workspace).

---

## Come usare questo documento

Questo documento è il **riferimento ufficiale** della macrofase «Workspace Wizard & composizione». È pensato per essere riaperto **mesi dopo**, in una **nuova chat** o da un altro sviluppatore, senza perdere il contesto accumulato durante l’analisi progettuale (luglio 2026).

### Documenti correlati (non sostitutivi)

| Documento | Contenuto |
|-----------|-----------|
| `docs/collaboration/PIANO_DI_SVILUPPO.md` | Piano generale collaborazione v1 (fasi 1–10 concluse) |
| `docs/collaboration/GLOBAL_WORKSPACE_PANEL.md` | Hub Workspace globale (shell UI, sezioni, layout fisso) |
| `AI_CONTEXT/28_COLLABORATION_WORKSPACE_SYSTEM.md` | Indice tecnico runtime collaborazione |

### Convenzioni nel testo

- **Elemento** = concetto utente (Diario, Valigia, Template utente). In codice restano `SharedResource`, `WorkspaceResource`, `SharedResourceKind`, ecc.
- **Pipeline** = sequenza di operazioni di business per collegare o copiare elementi (non «wizard UI»).
- **Wizard** = interfaccia modale guidata (`CollaborationShareModal` e componenti figli).

### Principio architetturale fondamentale: un solo Wizard

TouringDiary ha **un unico Wizard di collaborazione**, non tre wizard separati.

| Cosa vede l’utente | Cosa c’è in architettura |
|--------------------|---------------------------|
| «Condividi» su un elemento | Stesso modale (`CollaborationShareModal`) |
| «Crea Workspace» dall’hub | Stesso modale |
| «Aggiungi elemento» (FASE 3) | Stesso modale |

Il concetto progettuale è **uno**: un flusso guidato che orchestra condivisione, composizione Workspace, dettagli e inviti. I diversi punti di ingresso (Condividi, Crea Workspace, Aggiungi elemento) sono **contesti di apertura**, non prodotti UI distinti.

In implementazione, `WizardEntryMode` (`share` \| `create_workspace` \| `add_element_to_workspace`) è un **dettaglio tecnico** che adatta step, header e finalize allo stesso guscio modale. Non va interpretato come tre wizard paralleli: è il parametro che dice al **unico** orchestratore quale sequenza mostrare.

Componenti condivisi da tutti i contesti: `CollaborationShareWizard`, `WorkspaceShareWizardSteps`, `CollaborationWizardFooter`, `WizardStepIndicator`, `collaborationSharePresentation` (step graph e label).

---

# 1. Stato attuale

## 1.1 Panoramica

Il sistema di collaborazione Workspace è già operativo (fasi 1–10 del piano collaborazione). L’utente può:

- creare Workspace e collegarvi elementi;
- condividere singoli elementi (Diario, Valigia, Template) tramite wizard;
- gestire membri, inviti e permessi dal hub Workspace globale;
- aggiungere un elemento a un Workspace esistente **solo** partendo dal flusso «Condividi» su quell’elemento.

L’architettura attuale espone **un unico wizard** (`CollaborationShareModal`) apribile da contesti diversi. Oggi i contesti attivi sono Condividi (da elemento) e Crea Workspace (da hub); in passato il create dall’hub riutilizzava erroneamente il flusso Condividi — corretto in FASE 1.

All’interno del contesto **Condividi**, i percorsi restano differenziati tramite `SharePath` e `WizardStep`. Il contesto **Crea Workspace** usa un ordine step dedicato, sempre sullo stesso modale.

## 1.2 Componenti UI principali

| Componente | Ruolo |
|------------|-------|
| `CollaborationShareModal.tsx` | **Orchestratore** del wizard unico: stato, lifecycle, finalize, apertura/chiusura |
| `CollaborationShareWizard.tsx` | Rendering step (path, mode, intent, invite, setup, composition, select) |
| `WorkspaceShareWizardSteps.tsx` | Step Setup, Composizione, Select, Inviti workspace |
| `CollaborationWizardFooter.tsx` | Pulsanti Avanti / Indietro / Annulla |
| `WizardStepIndicator.tsx` | Indicatori step (usa `getWizardSteps`) |
| `collaborationSharePresentation.ts` | Tipi `SharePath`, `WizardStep`, label step, `getWizardSteps()` |

### Entry point attuali

| Azione utente | Apertura modale | Parametri |
|---------------|-----------------|-----------|
| «Condividi» su Diario / Valigia / Template | `openModal('collaborationShare', { kind, resourceId, resourceTitle })` via `useOpenCollaborationShare` | Risorsa seed obbligatoria |
| «Crea Workspace» da hub (`WorkspaceSection`) | `openCreateWorkspace()` → stesso modale con `entryMode: 'create_workspace'` | Contesto create dedicato (FASE 1) |

Il modale adatta header e step al contesto: **«Condividi»** + nome elemento, oppure **«Crea Workspace»**.

## 1.3 Wizard di condivisione — percorsi attuali

`getWizardSteps(params)` definisce gli step effettivi. Accetta una **union discriminata** (`GetWizardStepsParams`): il ramo `create_workspace` non richiede `sharePath`/`sharingMode`; il ramo `share` sì.

### Percorso `simple` (Condivisione semplice)

```
Percorso → Modalità → [Dettagli se collaborative] → Inviti
```

- **Percorso:** Condividi senza Workspace / Crea Workspace / Aggiungi a Workspace esistente.
- **Modalità:** Collaborativa vs Personale (solo simple).
- **Dettagli (`share_intent`):** Duplica e condividi vs Condividi originale.
- **Inviti:** ricerca utenti, ruolo predefinito (`CollaborativeMemberRole`: Collaboratore / Visualizzatore).

### Percorso `create_workspace` (da wizard Condividi)

```
Percorso → Dettagli → Setup → Risorse → Inviti
```

- **Dettagli** prima di **Setup** (ordine invertito rispetto al create desiderato).
- **Risorse (`workspace_composition`):** composizione **seed-centrica** tramite `resolveWorkspaceCompositionBlueprint({ seed })` — non catalogo completo.
- **Inviti workspace:** permessi fissati a `collaborator` per ogni elemento selezionato; testo UI che lo annuncia.

### Percorso `add_workspace` (Aggiungi a Workspace esistente)

```
Percorso → Dettagli → Workspace (select)
```

- Dopo Dettagli: `resolveShareTargetResourceId()` (applica duplica/originale su **un solo** elemento seed).
- `addResourceToExistingWorkspace(workspaceId, actorId, { kind, resourceId })`.

## 1.4 Composizione — stato attuale

### Resolver seed (`resolveWorkspaceCompositionBlueprint`)

- Input: `{ seed: { kind, resourceId }, selectedDiaryId? }`.
- Output: `WorkspaceCompositionBlueprint` con candidati per sezione (diario, valigie, template) e `edges` (archi `diary_suitcase`, `suitcase_template`).
- Logica: espande il **grafo** collegato al seed (es. diario seed → valigie collegate; valigia seed → diari collegati + espansione opzionale).

### Draft (`WorkspaceCompositionDraft`)

- `selectedDiaryId: string | null`
- `selectedSuitcaseIds: Set<string>`
- `selectedUserTemplateIds: Set<string>`

### Validazione attuale

`validateWorkspaceCompositionDraft` **rifiuta** composizione vuota:

> «Seleziona almeno una risorsa per il Workspace.»

`createWorkspaceWithComposition` **rifiuta** `resources: []` con lo stesso messaggio.

### Materializzazione (`materializeWorkspaceComposition`)

Usata nel finalize **create** quando `shareIntent === 'duplicate_and_share'`:

1. Duplica ogni elemento selezionato (`duplicateSharedResourceForOwner`).
2. Ricrea collegamenti **solo tra copie** se entrambi gli endpoint sono nel draft.
3. Su valigie copiate senza template selezionato: `source_template_id = null` sulla **copia**.
4. **Non modifica mai** gli originali.

Se `shareIntent === 'share_current'`: restituisce gli ID originali senza duplicazione.

### Finalize create attuale (`handleCreateWorkspace`)

```
materializeWorkspaceComposition(...)
  → createWorkspaceWithComposition({ resources })
  → per ogni invito: sendWorkspaceInvite(..., permissions con accessLevel: 'collaborator')
```

## 1.5 Inviti — stato attuale

### Condivisione semplice (`invite`)

- `PendingInvite` con `role: CollaborativeMemberRole` (scelta utente tramite select «Ruolo predefinito»).
- `sendResourceInvite` con ruolo scelto.

### Workspace (`workspace_invite`)

- `WorkspacePendingInvite` con `permissions: WorkspaceResourcePermissionEntry[]`.
- All’aggiunta invito: `buildWorkspaceInvitePermissions()` imposta **sempre** `accessLevel: 'collaborator'` per ogni elemento in composizione.
- UI (`WorkspaceInviteStep`): testo che annuncia livello Collaboratore fisso.
- Testo introduttivo: **hardcoded** `text-xs text-slate-400` (≈9px effettivi con `html { font-size: 12px }` su desktop) — **non** Foundation `bodyText` (`text-[13px]`).

## 1.6 Gestione elementi nel Workspace

### Hub globale (`GlobalWorkspacePanel`)

- Tab **Condivisione** (`CondivisioneSection` → `WorkspaceResourcesSection`): griglia elementi collegati, azione «Apri».
- **Nessun** pulsante «Aggiungi elemento» dedicato oggi.
- **Nessuna** azione «Salva una copia».

### Aggiunta post-create

Solo tramite flusso Condividi → «Aggiungi ad un Workspace esistente» sull’elemento desiderato.

### Primitive di linking

| Funzione | Uso |
|----------|-----|
| `addWorkspaceResource(workspaceId, actorId, { kind, resourceId })` | Insert in `workspace_resources` |
| `addResourceToExistingWorkspace(...)` | Wrapper: add + aggiornamento permessi membri |
| `createWorkspace` + loop `addWorkspaceResource` | Create con composizione |
| `duplicateSharedResourceForOwner` | Duplica per owner (wizard Dettagli) |
| `duplicateSharedResourceForInvitee` | Copia personale per destinatario (modalità personale inviti) |

## 1.7 Pipeline attuali (riepilogo)

```
PIPELINE A — Aggiungi 1 elemento a Workspace esistente (da Condividi)
  share_intent → resolveShareTargetResourceId (1 elemento)
  → addResourceToExistingWorkspace → addWorkspaceResource

PIPELINE B — Crea Workspace con composizione (da Condividi → Crea Workspace)
  share_intent → materializeWorkspaceComposition (N elementi + archi)
  → createWorkspaceWithComposition → addWorkspaceResource × N

PIPELINE C — Condivisione semplice
  share_intent → ensureShareableResource → sendResourceInvite

PIPELINE D — Copia personale (invito personale / duplica pre-share)
  duplicateSharedResourceForInvitee / duplicateSharedResourceForOwner
```

## 1.8 Navigazione Indietro — bug attuale

`handleWizardBack` usa catene `if/else` manuali. In particolare:

- Da `workspace_setup` nel percorso create → torna a **`path`**, saltando `share_intent`.
- Comportamento non allineato all’ordine effettivo degli step.

## 1.9 Terminologia UI attuale

- Step indicator: label **«Risorse»** per `workspace_composition`.
- Copy sparse con «risorsa/risorse» (es. step composizione, `WorkspaceResourcesSection`, tab hub).
- Titolo step composizione: «Composizione risorse» (`getWizardStepTitle`).

---

# 2. Problemi individuati

## 2.1 Creazione Workspace confusa con Condivisione

**Problema:** «Crea Workspace» dal hub apre il wizard Condividi con un diario come seed. L’utente deve passare da Percorso e Dettagli (duplica/originale) **prima** di nominare lo Workspace, come se stesse condividendo quel diario.

**Motivo progettuale:** Creare un contenitore e condividere un elemento sono **intenzioni diverse**. Il create deve **anticipare** operazioni che oggi l’utente farebbe dopo (aggiungere elementi, invitare), non replicare il flusso «parto da un elemento e decido cosa farne».

## 2.2 Composizione seed-centrica inadeguata per il create

**Problema:** Lo step Risorse mostra solo il sotto-grafo del seed, non l’inventario personale completo.

**Motivo:** In creazione l’utente deve **comporre liberamente** il Workspace da tutti i propri Diari, Valigie e Template, con regole chiare (0/1 diario, 0..N valigie/template). Il resolver seed resta corretto per «Condividi → Crea Workspace e Condividi» (per ora mantenuto).

## 2.3 Impossibilità di creare Workspace vuoto

**Problema:** Validazione dominio e servizio impongono almeno un elemento.

**Motivo:** Un Workspace è un **contenitore**. L’utente può voler creare la struttura collaborativa prima di popolarla. Gli inviti devono essere possibili anche senza elementi.

## 2.4 Dettagli (Originale/Duplicato) nel create — ordine e percezione

**Problema attuale:** Dettagli precede Setup; inoltre, senza catalogo prima della scelta, l’utente decide duplica/originale **prima** di sapere cosa includerà.

**Motivo della nuova ordine:** Prima si sceglie **cosa** mettere nel Workspace (CONDIVISIONE/COMPOSIZIONE), poi **come** collegare quegli elementi (Dettagli, una sola volta per tutti). La scelta non appartiene al Workspace ma agli **elementi** — il contenitore non duplica, duplicano/collegano gli elementi.

## 2.5 Tre pipeline percepite dal utente (create multi-elemento)

**Problema:** Senza orchestrazione interna, selezionare Diario + Valigia + Template potrebbe essere interpretato come tre flussi Condividi separati.

**Motivo:** Un solo finalize con `shareIntent` unico applicato a tutti gli elementi selezionati (`materialize` + `addWorkspaceResource`), **una** UI.

## 2.6 Inviti workspace con ruolo fisso

**Problema:** Testo e codice impongono Collaboratore; nessuna scelta nel wizard.

**Motivo:** I permessi workspace sono **per elemento** (`WorkspaceResourceAccess`: none / viewer / collaborator). L’utente deve poter decidere già in wizard; la gestione fine resta nel hub Utenti.

## 2.7 Terminologia «Risorse»

**Problema:** Termine tecnico incomprensibile («risorsa»).

**Motivo UX:** «Elemento/Elementi» nel copy utente; tipi codice invariati.

## 2.8 Navigazione Indietro errata

**Problema:** Salto allo step iniziale invece del precedente.

**Motivo:** Coerenza cognitiva e manutenibilità (`getWizardSteps` come unica fonte di verità).

## 2.9 Tipografia step Inviti

**Problema:** Testo troppo piccolo (hardcoded `text-xs`).

**Motivo:** Leggibilità e allineamento al Design System (`foundation_body_text`, 13px).

## 2.10 Nessuna aggiunta elemento da hub

**Problema:** Dopo la creazione, aggiungere elementi richiede di uscire, trovare l’elemento, Condividi, Aggiungi a Workspace.

**Motivo:** Coerenza operativa — stessa pipeline, entry point dedicato nel Workspace.

## 2.11 Nessuna «Salva una copia»

**Problema:** Membri non possono portare nel proprio spazio personale una copia autonoma di un elemento visto nel Workspace.

**Motivo:** Collaborazione senza perdere autonomia personale; copia **single-element**, senza grafo workspace.

## 2.12 Due percorsi di creazione (debito temporaneo)

**Problema futuro:** «Crea Workspace» (hub) vs «Crea Workspace e Condividi» (wizard share) con UX diverse (catalogo vs seed).

**Motivo della mantenenza temporanea:** Non rompere flussi esistenti; rimozione valutata dopo implementazione create dedicato.

---

# 3. Decisioni definitive

Questo capitolo è il **contratto progettuale** della macrofase. Ogni voce è approvata salvo diversa indicazione esplicita in revisione.

## 3.1 Principi architetturali

| ID | Decisione |
|----|-----------|
| P-01 | **Nessuna nuova pipeline** di business per linking o copia elementi. |
| P-02 | **Riutilizzare** primitive esistenti: `addWorkspaceResource`, `addResourceToExistingWorkspace`, `materializeWorkspaceComposition`, `duplicateSharedResourceForOwner` / `duplicateSharedResourceForInvitee`, `createWorkspace`, `sendWorkspaceInvite`. |
| P-03 | Il wizard di **creazione Workspace anticipa** operazioni che oggi l’utente esegue dopo (composizione, dettagli, inviti, aggiunte). |
| P-04 | **Separazione concettuale** tra Creazione Workspace, Condivisione elemento, Aggiunta elemento a Workspace esistente — **stessa infrastruttura modale**, contesti (`entryMode`) diversi. |
| P-05 | Il **Workspace è solo un contenitore**; Originale/Duplicato appartiene agli **elementi**, non al Workspace. |
| P-06 | Nel create, la scelta Originale/Duplicato è **una sola volta** e si applica a **tutti** gli elementi selezionati nella stessa operazione. |
| P-07 | L’utente **non deve vedere** pipeline multiple consecutive; orchestrazione **interna** unica. |

## 3.2 Entry point e contesti wizard

| ID | Decisione |
|----|-----------|
| E-01 | Due (poi tre) modalità di apertura dello **stesso** wizard (`CollaborationShareModal`): **Creazione Workspace**, **Condivisione**, **Aggiunta elemento** (post-create). |
| E-02 | `entryMode` (o equivalente) determina **quali step** sono visibili e il **loro ordine**. |
| E-03 | **Creazione Workspace** dal hub: nuovo hook/apertura dedicata (es. `openCreateWorkspace({ preselectedDiaryId? })`), **non** `openShare` con diario fittizio. |
| E-04 | **Condivisione** da elemento: comportamento wizard **invariato** (percorsi `simple`, `add_workspace`, `create_workspace` da Condividi). |
| E-05 | **Mantenere temporaneamente** «Crea Workspace e Condividi» nel wizard Condividi; valutazione rimozione **dopo** implementazione create dedicato. |
| E-06 | Header modale **contestuale**: «Crea Workspace» vs «Condividi [elemento]» vs «Aggiungi elemento» (copy da definire in implementazione). |

## 3.3 Ordine step — Creazione Workspace (`entryMode: create_workspace`)

Ordine **definitivo**:

```
Setup
  ↓
CONDIVISIONE
  ↓
Dettagli
  ↓
Inviti
```

| ID | Decisione |
|----|-----------|
| S-01 | Step **Setup**: nome (obbligatorio) e descrizione (opzionale) — invariato nel contenuto. |
| S-02 | Step **CONDIVISIONE**: nome dello step nel wizard (step indicator, label breve). |
| S-03 | Titolo operativo **interno** allo step: **COMPOSIZIONE**. |
| S-04 | Testo introduttivo COMPOSIZIONE: **«Scegli quali elementi includere nel Workspace.»** — con impaginazione e a capo curati per leggibilità. |
| S-05 | Step **Dettagli**: Originale / Duplicato (stesso componente `share_intent` del wizard share). |
| S-06 | Step **Inviti**: invariato nella **posizione** rispetto agli altri wizard workspace (dopo composizione/dettagli). |
| S-07 | Se **nessun elemento** selezionato: step **Dettagli** saltato automaticamente (nessuna decisione da prendere sugli elementi). |
| S-08 | Navigazione **Indietro**: sempre step `steps[currentIndex - 1]` da `getWizardSteps(entryMode, ...)`. **Mai** salto allo step iniziale arbitrario. |

## 3.4 Catalogo — solo create

| ID | Decisione |
|----|-----------|
| C-01 | Catalogo personale **completo** **solo** nel wizard **Creazione Workspace**. |
| C-02 | Wizard **Condividi**: **nessun** catalogo completo; composizione seed-centrica **invariata** per percorso `create_workspace` da Condividi. |
| C-03 | Tre sezioni UI: **Diario di viaggio**, **Valigie**, **Template utente**. |
| C-04 | Ogni riga elemento mostra almeno: **data creazione**, **data ultima modifica/salvataggio**. |
| C-05 | Diario: **0 o 1** selezionabile (`single_optional` sempre; **mai** `fixed` nel catalogo). |
| C-06 | Valigie: **da 0 fino a tutte** (toggle; opzionale azione bulk «Seleziona tutte» in UX). |
| C-07 | Template: **da 0 fino a tutti**. |
| C-08 | Se il wizard parte con un **Diario aperto**: quel Diario **preselezionato** ma **deselezionabile** e sostituibile. |
| C-09 | **Workspace vuoto** consentito: zero elementi selezionati → create senza `materialize`. |

## 3.5 Workspace vuoto e inviti

| ID | Decisione |
|----|-----------|
| W-01 | Creazione Workspace **senza elementi** consentita. |
| W-02 | Elementi aggiungibili **successivamente** (hub + pipeline aggiunta). |
| W-03 | **Inviti consentiti** su Workspace vuoto (`permissions` possono essere array vuoto). |

## 3.6 Dettagli (Originale / Duplicato)

| ID | Decisione |
|----|-----------|
| D-01 | Scelta **una volta** per operazione create, applicata a **tutti** gli elementi selezionati. |
| D-02 | Implementazione interna: `materializeWorkspaceComposition` se Duplica; pass-through ID se Originale; poi `addWorkspaceResource` per ciascuno. |
| D-03 | Per **aggiunta singolo elemento** post-create: stessa logica di oggi (`resolveShareTargetResourceId` + `addResourceToExistingWorkspace`) — Dettagli **per quell’elemento**. |
| D-04 | La scelta **non** è proprietà del Workspace; è proprietà del **collegamento degli elementi** al Workspace. |

## 3.7 Regola di duplicazione (decisione di dominio — testo ufficiale)

> **Durante una duplicazione vengono ricreati esclusivamente i collegamenti tra gli elementi inclusi nella stessa operazione. Qualunque collegamento verso elementi non inclusi viene rimosso dagli elementi duplicati, mai dagli elementi originali.**

| ID | Decisione |
|----|-----------|
| R-01 | Questa regola è **funzionale del dominio**, non un dettaglio implementativo. |
| R-02 | È **già riflessa** in `materializeWorkspaceComposition` (luglio 2026); va **documentata** in codice dominio e **verificata** con catalogo che fornisce `edges` completi. |
| R-03 | Esempio approvato: Diario→Valigia→Template; se si duplicano solo Diario+Valigia: nuovo Diario collegato a nuova Valigia; nuova Valigia **senza** Template; Template originale **invariato**; originali **mai** modificati. |

## 3.8 Inviti — copy, permessi, tipografia

| ID | Decisione |
|----|-----------|
| I-01 | **Rimuovere** testo che annuncia Collaboratore fisso per tutte le risorse. |
| I-02 | Nuovo testo introduttivo (senza promessa di ruolo): spiegare che gli invitati potranno essere **gestiti successivamente dal Workspace** (copy esatto da approvare in UI, senza riferimento a Collaboratore obbligatorio). |
| I-03 | L’utente sceglie nel wizard il **livello di accesso** per invitato (per elemento: `WorkspaceResourcePermissionSelect` / `none` \| `viewer` \| `collaborator`). |
| I-04 | **Non** assegnare automaticamente `collaborator`. |
| I-05 | Se composizione cambia tornando indietro: **risincronizzare** permessi inviti pendenti preservando scelte utente su elementi ancora presenti. |
| I-06 | Tipografia intro Inviti: oggi **hardcoded** `text-xs` in `WorkspaceInviteStep` — **non** Foundation. Portare a ~**+2px** effettivi o usare `foundation_body_text` (`foundation_body_text` / `text-[13px]`). **Non** modificare token Foundation globali solo per questo. |
| I-07 | Coerenza **massima** tra tutti i wizard (stessi componenti step dove possibile). |

## 3.9 Terminologia UX

| ID | Decisione |
|----|-----------|
| T-01 | In UI sostituire progressivamente **«Risorsa/e»** con **«Elemento/i»** dove rivolto all’utente. |
| T-02 | In codice: mantenere `SharedResource`, `WorkspaceResource`, `SharedResourceKind`, nomi tabelle, ecc. |
| T-03 | Nome step wizard create: **CONDIVISIONE** (non «Risorse», non «Elementi» come nome step). |
| T-04 | Titolo interno step: **COMPOSIZIONE**. |
| T-05 | Aggiornare `getWizardStepShortLabel` / titoli sezione hub correlati nella macrofase dove toccati dai file wizard (hub tab «Condivisione» può restare; sottosezioni «risorse» → «elementi» dove visibile all’utente). |

## 3.10 Aggiunta elementi post-create

| ID | Decisione |
|----|-----------|
| A-01 | Da Workspace esistente: azione **«Aggiungi elemento»** (o equivalente) nell’hub (tab Condivisione primario). |
| A-02 | Utente sceglie tipo e elemento (sottoinsieme catalogo o picker). |
| A-03 | `entryMode: add_element_to_workspace` con `workspaceId` noto. |
| A-04 | Step: selezione elemento → **Dettagli** → link (nessuno step «scegli workspace»). |
| A-05 | Finalize: **stessa pipeline** di Condividi → Aggiungi a Workspace (`resolveShareTargetResourceId` + `addResourceToExistingWorkspace`). |
| A-06 | **Nessuna** nuova logica di business. |

## 3.11 Salva una copia

| ID | Decisione |
|----|-----------|
| K-01 | Azione **«Salva una copia»** su elementi presenti nel Workspace (hub Condivisione / card elemento). |
| K-02 | **Chiunque** sia membro del Workspace può usarla (con accesso sufficiente all’elemento — vedi dominio). |
| K-03 | Copia **solo** l’elemento su cui si agisce: **nessun** collegamento workspace copiato automaticamente. |
| K-04 | Se l’utente ha già una copia personale, **creare comunque** una nuova copia autonoma. |
| K-05 | Modale di conferma: spiegare che si crea una **copia personale indipendente** dal Workspace. |
| K-06 | Implementazione: riuso `duplicateSharedResourceForInvitee` (o equivalente) con `targetUserId = utente corrente`; diario già senza pivot valigie in `duplicateDiaryCopy`. |
| K-07 | `source_template_id` sulla copia template/valigia: **mantenuto** come **metadato di provenienza**, non come collegamento workspace. |

## 3.12 Wizard Condividi — invarianza

| ID | Decisione |
|----|-----------|
| V-01 | Percorsi `simple`, `add_workspace`, `create_workspace` da Condividi: **comportamento invariato** (ordine step, seed, validazioni). |
| V-02 | **Nessun** catalogo completo nel wizard Condividi. |
| V-03 | Modifiche ammesse: riuso pipeline tramite helper interni, fix Indietro **anche** per percorsi share (beneficio trasversale), terminologia UX dove già in scope file wizard. |

## 3.13 Coerenza trasversale wizard

| ID | Decisione |
|----|-----------|
| X-01 | `getWizardSteps` unica fonte per indicator, Indietro, Avanti. |
| X-02 | Stessi componenti per Dettagli (`share_intent`), Inviti (search + lista), COMPOSIZIONE (righe selezionabili condivise tra create catalogo e add_element pick). |
| X-03 | Footer wizard: stessi pattern pulsanti (Annulla, Indietro, Continua, Più tardi su inviti). |

## 3.14 Decisioni UX hub Workspace (contesto parallelo, già analizzate)

Queste decisioni riguardano il **pannello hub** (`GlobalWorkspacePanel`), non il wizard. Sono documentate per completezza; implementazione può essere parallela o successiva. Riferimento layout: `GLOBAL_WORKSPACE_PANEL.md`, costanti `workspacePanelLayout.ts`.

| ID | Decisione |
|----|-----------|
| H-01 | Pannello hub ad **altezza fissa**; scroll **delegato** alle sezioni (`WORKSPACE_HUB_TABPANEL_CLASS`, nessuno scroll sul body hub). |
| H-02 | Placeholder stati vuoti uniformati (`WORKSPACE_SECTION_PLACEHOLDER_CLASS` dove applicabile). |
| H-03 | `binderPanelMaxHeightClass` / `binderPanelMinHeightClass` separati semanticamente. |
| H-04 | Revisione tipografia/densità hub (FASE UI polish) documentata in analisi UX luglio 2026 — **non** bloccante per wizard macrofase. |

## 3.15 Fix associazione valigia (contesto esterno alla macrofase)

Durante la stessa sessione di analisi è stato corretto un bug (valigia ASSOCIA da dashboard) per `suitcase-active` controller assente. **Non** fa parte di questa macrofase wizard; citato per evitare confusione tra branch di lavoro.

---

# 4. Regole di dominio

Regole **funzionali**, indipendenti dalla presentazione UI.

## 4.1 Workspace come contenitore

- Un **Workspace** ha nome, descrizione, owner, membri; **non** «duplica» e **non** ha `shareIntent`.
- Gli **elementi** (Diario, Valigia, Template utente) sono collegati tramite `workspace_resources` (`kind` + `resource_id`).
- Un Workspace può esistere con **zero** elementi collegati.

## 4.2 Composizione e selezione (create)

| Regola | Enunciato |
|--------|-----------|
| DOM-C-01 | Al massimo **un** Diario per Workspace. |
| DOM-C-02 | Valigie e Template: quantità arbitraria tra 0 e tutti quelli del catalogo personale. |
| DOM-C-03 | Composizione vuota **valida** per create. |
| DOM-C-04 | Catalogo create = **tutti** gli elementi personali dell’utente eleggibili (non grafo seed). |

## 4.3 Originale / Duplicato

> **Stato regole (2026-07-25):** DOM-D-01 **obsoleta come prodotto**. Dominio ufficiale = sempre copia (equivalente a DOM-D-02 obbligatorio). Vedi banner in testa al documento.

| Regola | Enunciato |
|--------|-----------|
| DOM-D-01 | ~~`share_current` (Originale)~~ — **RIMOSSO DAL PRODOTTO** (PO 2026-07-25). |
| DOM-D-02 | `duplicate_and_share` / flusso **Condividi**: per ogni elemento selezionato si crea una **copia** di proprietà dell’operatore; gli originali restano **inalterati**. **Unico path ammesso.** |
| DOM-D-03 | ~~Una sola decisione Originale/Duplicato~~ — **non più scelta UX**; la copia è sempre implicita. |
| DOM-D-04 | Aggiunta singolo elemento post-create: **sempre** copia per quell’elemento (nessuna opzione Originale). |

## 4.4 Duplicazione e collegamenti

| Regola | Enunciato |
|--------|-----------|
| DOM-L-01 | **Testo ufficiale:** vedi sezione 3.7 (R-01). |
| DOM-L-02 | Archi di dominio: `diary_suitcase` (pivot itinerario–valigia), `suitcase_template` (`source_template_id` su valigia). |
| DOM-L-03 | Ricreazione archi solo su **copie**, mai su originali. |
| DOM-L-04 | Collegamento verso elemento non incluso: **assente** sulla copia (es. `source_template_id = null` se template non selezionato). |
| DOM-L-05 | Il blueprint per `materialize` deve includere gli **archi** necessari tra candidati del catalogo. |

## 4.5 Inviti e permessi workspace

| Regola | Enunciato |
|--------|-----------|
| DOM-I-01 | Permesso workspace = tripla (`kind`, `resourceId`, `accessLevel`) con `none` \| `viewer` \| `collaborator`. |
| DOM-I-02 | Invito workspace memorizza permessi **per elemento** in `workspace_invite` / tabelle correlate. |
| DOM-I-03 | Nessun livello **predefinito obbligatorio** a `collaborator` in wizard. |
| DOM-I-04 | Inviti su Workspace vuoto: permessi invito possono essere **vuoti**; membership valida senza accesso a elementi finché non se ne aggiungono. |
| DOM-I-05 | Modifica composizione con inviti pendenti: permessi devono **riflettere** la composizione corrente senza perdere scelte esplicite dell’utente su elementi ancora validi. |

## 4.6 Salva una copia

| Regola | Enunciato |
|--------|-----------|
| DOM-K-01 | Operazione **per singolo elemento**; nessuna espansione automatica a elementi collegati nel Workspace. |
| DOM-K-02 | La copia appartiene allo **spazio personale** del richiedente (`user_id` destinatario = utente corrente). |
| DOM-K-03 | **Sempre** nuova istanza, anche se esiste già copia personale dello stesso contenuto. |
| DOM-K-04 | Diario copiato: **senza** pivot valigie (`duplicateDiaryCopy`). |
| DOM-K-05 | Valigia/Template copiati: clone entità; **nessun** inserimento automatico in `workspace_resources` del richiedente. |
| DOM-K-06 | `source_template_id` sulla copia: **provenienza**, non membership workspace. |
| DOM-K-07 | Richiedente deve essere **membro** del Workspace e avere diritto di **visualizzare** l’elemento (policy: almeno `viewer` su quell’elemento nel workspace). |

## 4.7 Limiti business esistenti

| Regola | Enunciato |
|--------|-----------|
| DOM-B-01 | Massimo **2** Workspace di proprietà per utente (`MAX_OWNED_WORKSPACES_PER_USER`) — invariato. |
| DOM-B-02 | `addWorkspaceResource` rifiuta duplicati: stesso elemento già nel Workspace. |

## 4.8 Riuso pipeline (vietato duplicare logica)

| Operazione | Pipeline canonica |
|------------|-------------------|
| Collegare N elementi al create (dopo Dettagli) | `materialize?` → `createWorkspace` → `addWorkspaceResource` × N |
| Collegare 1 elemento a Workspace esistente | `resolveTargetId(shareIntent)` → `addResourceToExistingWorkspace` |
| Copia personale Salva una copia | `duplicateSharedResourceForInvitee` (o wrapper sottile) |
| Inviti workspace | `sendWorkspaceInvite` con `WorkspaceResourcePermissionEntry[]` |

---

# 5. Architettura proposta

## 5.1 Principio organizzativo: un solo Wizard, contesti multipli

Il cuore UI è **un solo** `CollaborationShareModal`. Non esistono modali paralleli per Condividi / Crea / Aggiungi: esiste un orchestratore che, in base al contesto di apertura, monta la stessa infrastruttura wizard con step e header diversi.

`WizardEntryMode` è il **dettaglio implementativo** che seleziona il ramo dello step graph. È subordinato al concetto unico di Wizard:

```text
type WizardEntryMode =
  | 'share'                    // contesto: Condividi da elemento
  | 'create_workspace'         // contesto: Crea Workspace da hub
  | 'add_element_to_workspace' // contesto: Aggiungi da hub (FASE 3)
```

`getWizardSteps(params: GetWizardStepsParams)` restituisce l’array ordinato di `WizardStep`. La firma usa una **union discriminata**: il ramo `create_workspace` non accetta `sharePath`/`sharingMode`; il ramo `share` li richiede. Evita parametri privi di significato nel create dedicato.

La navigazione (Indietro / Avanti / indicator) è estratta in `useCollaborationWizardNavigation` — logica coesa, senza frammentare il resto dell’orchestratore fino a quando non serve (FASE 2+).

### Mapping step per entry mode

| entryMode | Step (in ordine) |
|-----------|------------------|
| `create_workspace` | `workspace_setup` → `workspace_composition` (catalogo) → `share_intent` → `workspace_invite` |
| `share` + `simple` | `path` → `mode` → [`share_intent`] → `invite` |
| `share` + `add_workspace` | `path` → `share_intent` → `workspace_select` |
| `share` + `create_workspace` | **Invariato:** `path` → `share_intent` → `workspace_setup` → `workspace_composition` (seed) → `workspace_invite` |
| `add_element_to_workspace` | `pick_element` (nuovo step UI) → `share_intent` → finalize |

Label step indicator: `workspace_composition` → **CONDIVISIONE** (create); seed path da Condividi può restare label storica fino a deprecazione percorso.

## 5.2 Cosa riutilizzare (nessuna riscrittura)

| Asset | Uso |
|-------|-----|
| `CollaborationShareModal` | Shell, stato, finalize |
| `CollaborationShareWizard` + `WorkspaceShareWizardSteps` | Step UI |
| `materializeWorkspaceComposition` | Duplicazione multi-elemento create |
| `addWorkspaceResource` | Link elementi ↔ workspace |
| `addResourceToExistingWorkspace` | Add singolo post-create / share add |
| `duplicateSharedResourceForOwner` | Parte di materialize / resolve target |
| `duplicateSharedResourceForInvitee` | Salva una copia |
| `sendWorkspaceInvite` | Inviti |
| `WorkspaceResourcePermissionSelect` | Permessi in step Inviti |
| `OptionCard` / step `share_intent` | Dettagli |
| `CompositionSelectableRow` | Righe catalogo e pick element |

## 5.3 Cosa modificare

| Area | Modifica |
|------|----------|
| `collaborationSharePresentation.ts` | `WizardEntryMode`, `getWizardSteps` esteso, label CONDIVISIONE |
| `CollaborationShareModal.tsx` | Init per entryMode, navigazione index-based, finalize create, skip Dettagli se vuoto, sync permessi inviti |
| `WorkspaceShareWizardSteps.tsx` | Catalogo UI, date, copy COMPOSIZIONE, Inviti permessi + tipografia |
| `CollaborationWizardFooter.tsx` | Indietro da `getWizardSteps` |
| `workspaceComposition.ts` (domain) | Validazione vuoto; commenti regola DOM-L |
| `workspaceCompositionService.ts` | `createWorkspaceWithComposition` accetta `resources: []` |
| Nuovo resolver catalogo | `resolveWorkspaceCompositionCatalog` |
| `WorkspaceSection.tsx` | `openCreateWorkspace` invece di `openShare` |
| `CondivisioneSection` / `WorkspaceResourcesSection` | «Aggiungi elemento», «Salva una copia» |
| `ModalManager` / hooks | Props `entryMode`, `workspaceId`, `preselectedDiaryId` |
| `useOpenCollaborationShare.ts` + nuovo `useOpenCreateWorkspace` | Entry point distinti |

## 5.4 Cosa NON modificare

| Area | Motivo |
|------|--------|
| Schema DB `workspace_resources`, inviti, permessi | Modello già adeguato |
| Percorso share `simple` e `add_workspace` (logica) | Invarianza V-01 |
| `resolveWorkspaceCompositionBlueprint` (seed) | Usato da Condividi → create_workspace |
| Hub layout shell (`GlobalWorkspacePanel` geometria) | Fuori scope salvo pulsanti in Condivisione |
| Token Foundation globali | Tipografia Inviti: consumer locale |

## 5.5 Nuovi componenti logici (non nuove pipeline)

| Nome proposto | Tipo | Responsabilità |
|---------------|------|----------------|
| `resolveWorkspaceCompositionCatalog` | Service read | Lista elementi personali + date + edges catalogo |
| `linkCompositionToWorkspace` | Helper interno | `materialize?` + loop `addWorkspaceResource` + rollback su errore |
| `resolveWizardPreviousStep` / `resolveWizardNextStep` | Helper | Index su `getWizardSteps` |
| `openCreateWorkspace` | Hook | Apre modale con `entryMode: create_workspace` |
| `openAddElementToWorkspace` | Hook | `entryMode: add_element_to_workspace` + `workspaceId` |
| `savePersonalCopyFromWorkspace` | Thin wrapper | Permesso + `duplicateSharedResourceForInvitee` |

## 5.6 Gestione errori e rollback

- Create: se `addWorkspaceResource` fallisce a metà loop, oggi `createWorkspaceWithComposition` elimina il workspace — **mantenere** pattern; se `materialize` ha creato copie, usare `rollbackDuplicatedCompositionResources`.
- Salva copia: operazione atomica singola; toast errore se fallisce.

## 5.7 Diagramma architetturale

```text
                    ┌──────────────────────────────────────┐
                    │     CollaborationShareModal          │
                    │     wizardEntryMode                  │
                    └──────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
 create_workspace                  share (invariato)     add_element_to_workspace
        │                             │                             │
        ▼                             │                             ▼
 resolveWorkspaceCompositionCatalog  │                    pick_element (catalogo)
        │                             │                             │
        ▼                             ▼                             ▼
   draft selezione              flussi esistenti              share_intent ×1
        │                             │                             │
        ▼                             │                             ▼
   share_intent ×1                    │              addResourceToExistingWorkspace
        │                             │
        ▼                             │
 materializeWorkspaceComposition      │
 (solo se duplicate & non vuoto)      │
        │                             │
        ▼                             ▼
 createWorkspace + addWorkspaceResource × N          (primitive condivise)

 Hub post-create:
   «Salva una copia» → duplicateSharedResourceForInvitee (singolo elemento)
```

---

# 6. Piano di implementazione

**Quattro macrofasi** sequenziali. Non iniziare fase N+1 senza verifiche di uscita della fase N.

## Regola generale della macrofase (obbligatoria)

Al termine di **ogni** macrofase (FASE 1, 2, 3 e 4) devono essere eseguiti **obbligatoriamente**, nell’ordine:

1. **Build completa** del progetto (`npm run build`).
2. **Verifica TypeScript** senza errori (`npm run lint`, equivalente a `tsc --noEmit`).
3. **Verifica assenza di regressioni** nei flussi di condivisione esistenti (percorsi `simple`, `add_workspace`, `create_workspace` da Condividi).
4. **Verifica funzionamento** delle nuove funzionalità introdotte nella fase appena completata (checklist di uscita della fase).

**Solo dopo** il superamento di tutti questi controlli:

- l’implementazione della fase si considera **conclusa**;
- va redatto un **report dettagliato** del lavoro svolto;
- si **attende l’OK esplicito** del product owner prima di iniziare la macrofase successiva.

Nessuna macrofase successiva va avviata senza autorizzazione esplicita.

---

## FASE 1 — Fondamenta wizard: entry mode, step graph, navigazione, create scaffold

### Obiettivi

- Introdurre `WizardEntryMode` e `getWizardSteps` unificato.
- Implementare entry **Creazione Workspace** con ordine Setup → CONDIVISIONE → Dettagli → Inviti.
- Navigazione Indietro/Avanti basata su indice step.
- Header modale contestuale per create.
- Skip automatico Dettagli se composizione vuota (con create vuoto funzionante a livello dominio).

### File principali

- `collaborationSharePresentation.ts`
- `CollaborationShareModal.tsx`
- `CollaborationWizardFooter.tsx`
- `WizardStepIndicator.tsx`
- `useOpenCreateWorkspace.ts` (nuovo) + `WorkspaceSection.tsx`
- `ModalManager.tsx` / `ModalContext` (props)
- `workspaceComposition.ts`, `workspaceCompositionService.ts` (workspace vuoto)

### Dipendenze

- Nessuna (prima fase).

### Rischi

- Regressione navigazione su percorsi share → mitigare con tabella step per `entryMode: share` identica all’attuale.
- Doppio percorso create (hub vs Condividi) confuso in test manuali.

### Verifiche prima di FASE 2

- [x] Condividi → simple / add_workspace / create_workspace: step e ordine **identici** a prima.
- [x] Crea Workspace da hub: ordine Setup → CONDIVISIONE* → Dettagli → Inviti.
- [x] Indietro: da Inviti → Dettagli → CONDIVISIONE* → Setup (create); mai salto a Percorso.
- [x] Workspace vuoto creabile con nome; nessun crash su Dettagli skipped.
- [x] Header create mostra «Crea Workspace» (non «Condividi»).

\* Label step indicator «Risorse» invariata in FASE 1; rename **CONDIVISIONE** previsto in FASE 2.

### Note implementative FASE 1 (10 luglio 2026)

| Nota | Dettaglio |
|------|-----------|
| `WizardEntryMode` | Introdotto in `collaborationSharePresentation.ts`; valori attivi: `share`, `create_workspace`. `add_element_to_workspace` riservato a FASE 3. |
| `getWizardSteps` | Firma a union discriminata (`GetWizardStepsParams`); niente `sharePath`/`sharingMode` nel ramo create. |
| Navigazione | Hook locale `useCollaborationWizardNavigation.ts` — step graph, Indietro, Avanti, `skipShareIntent`. |
| Entry hub | `useOpenCreateWorkspace` → `openModal('collaborationShare', { entryMode: 'create_workspace', preselectedDiaryId? })`. |
| Blueprint vuoto | Rimosso in FASE 2 — sostituito da `resolveWorkspaceCompositionCatalog`. |
| Skip Dettagli | `skipShareIntent` nel ramo `create_workspace` di `getWizardSteps` quando composizione vuota. |
| Navigazione share-create | Fix trasversale: Indietro da Setup → Dettagli, non Percorso. |
| `CollaborationShareModal` | Resta orchestratore unico (~1000 righe); composizione/inviti/finalize non estratti (accoppiamento stato/refs — vedi nota sotto). |
| Workspace vuoto | `validateWorkspaceCompositionDraft({ allowEmpty })` + `createWorkspaceWithComposition` accetta `resources: []`; finalize salta `materialize` se vuoto. |
| Annulla | Visibile sul **primo step effettivo** del contesto (Setup nel create, Percorso nel share). |
| Non implementato (FASE 2+) | Catalogo completo, copy COMPOSIZIONE/CONDIVISIONE, permessi inviti, tipografia Inviti. |

**Nota manutenibilità (post-review FASE 1):** composizione Workspace, inviti e finalize restano in `CollaborationShareModal` perché condividono `isAsyncStale`, generation refs, `runSubmittingAction` e `setActionError`. Un’estrazione più ampia in hook separati richiederebbe un oggetto dipendenze esteso senza ridurre la complessità cognitiva; valutare nuovo hook composizione in FASE 2 quando il catalogo formerà un modulo coeso.

---

## FASE 2 — Catalogo composizione, materialize, finalize create, copy UX

### Obiettivi

- `resolveWorkspaceCompositionCatalog` con date e edges.
- UI COMPOSIZIONE: tre sezioni, regole selezione, preselect diario aperto.
- Copy: titolo COMPOSIZIONE, testo ufficiale, step label CONDIVISIONE.
- Finalize create: `linkCompositionToWorkspace` (materialize + add).
- Terminologia Elemento/i nei file toccati.
- Regola dominio duplicazione verificata con test manuali (Diario+Valigia senza Template).

### File principali

- `services/collaboration/workspaceComposition/resolveWorkspaceCompositionCatalog.ts` (nuovo)
- `workspaceCompositionGraph.ts` (estensioni query se necessarie)
- `WorkspaceShareWizardSteps.tsx` (`WorkspaceCompositionStep`)
- `CollaborationShareModal.tsx` (`handleCreateWorkspace`)
- `domain/collaboration/workspaceComposition.ts` (candidate dates, validazione)
- `materializeWorkspaceComposition.ts` (commenti dominio)

### Dipendenze

- FASE 1 completata.

### Rischi

- Performance catalogo utenti con molti elementi → loading state.
- Blueprint edges incompleti → duplicazione non ricollega; test con grafo Diario–Valigia–Template.

### Verifiche prima di FASE 3

- [x] Catalogo mostra tutti gli elementi personali con date.
- [x] Selezione 0/1 diario, multi valigie/template (incl. deselezione diario preselezionato).
- [ ] Create con Originale: elementi nel workspace sono originali (test manuale).
- [ ] Create con Duplicato: regola DOM-L-01 verificata su caso esempio ufficiale (test manuale).
- [x] Create vuoto + create pieno stabili (logica invariata da FASE 1).
- [x] Wizard Condividi: **nessun** catalogo completo (`resolveWorkspaceCompositionBlueprint` invariato).

### Implementazione FASE 2 (10 luglio 2026)

| Area | Stato |
|------|-------|
| `resolveWorkspaceCompositionCatalog` | Inventario personale (diari `type=personal`, valigie operative, template user) + edges `diary_suitcase` / `suitcase_template` |
| Rimozione ponti FASE 1 | `createEmptyCompositionBlueprint`, `bootstrapEmptyCreateComposition`, init seed nel create |
| `createDefaultCompositionDraft` | Preselect solo se ID ∈ candidati blueprint |
| `handleSelectCompositionDiary` | Create: update sincrono draft; share: espansione seed invariata |
| Copy UX | Titolo COMPOSIZIONE, label CONDIVISIONE, testo ufficiale, date su righe catalogo |
| `WorkspaceCompositionCandidate` | `createdAt` / `updatedAt` opzionali |

---

## FASE 3 — Inviti con permessi, tipografia, aggiunta elemento post-create

### Obiettivi

- Step Inviti: scelta permessi per invitato; copy senza Collaboratore fisso.
- Tipografia Inviti (~bodyText / +2px).
- Risincronizzazione permessi se si torna indietro dalla composizione.
- `entryMode: add_element_to_workspace` + UI «Aggiungi elemento» in hub.
- Pipeline add identica a share → add existing.

### File principali

- `WorkspaceShareWizardSteps.tsx` (`WorkspaceInviteStep`, pick element)
- `CollaborationShareWizard.tsx`
- `CollaborationShareModal.tsx`
- `CondivisioneSection.tsx`, `WorkspaceResourcesSection.tsx`
- `useOpenAddElementToWorkspace.ts` (nuovo)

### Dipendenze

- FASE 2 (composizione e create stabili).

### Rischi

- UI permessi affollata su mobile → layout compatto, scroll modale.
- Permessi stale su inviti pendenti → test torna indietro e cambia selezione.

### Verifiche prima di FASE 4

- [x] Inviti con permessi viewer/collaborator/none per elemento (`WorkspaceResourcePermissionSelect`).
- [x] Testo Inviti senza riferimento Collaboratore obbligatorio.
- [x] Tipografia intro Inviti via `foundation_body_text` (consumer locale).
- [x] `entryMode: add_element_to_workspace` + pulsante «Aggiungi elemento» in hub Condivisione.
- [x] Pipeline add: `resolveShareTargetResourceId` → `addResourceToExistingWorkspace`.
- [x] Sync permessi inviti pendenti su cambio composizione (`syncWorkspacePendingInvitePermissions`).
- [ ] Aggiungi elemento da hub: test manuale Diario, Valigia, Template.
- [ ] Duplicato già nel workspace: messaggio errore esistente (test manuale).

### Implementazione FASE 3 (10 luglio 2026)

| Area | Stato |
|------|-------|
| Step Inviti | `WorkspaceResourcePermissionSelect` per elemento/invitato; default `none` |
| Copy / tipografia | Testo neutro; `bodyText` Foundation |
| Sync permessi | `syncWorkspacePendingInvitePermissions` + effect su `selectedComposition` |
| `add_element_to_workspace` | Step `pick_element` → `share_intent` → finalize |
| Hub | `useOpenAddElementToWorkspace` + pulsante in `CondivisioneSection` |
| Inviti vuoti workspace | `sendWorkspaceInvite` accetta `permissions: []` (DOM-I-04) |

---

## FASE 4 — Salva una copia, hardening, documentazione runtime

### Obiettivi

- Pulsante «Salva una copia» + modale conferma.
- Gate permessi membro + viewer.
- Aggiornamento `AI_CONTEXT/28_COLLABORATION_WORKSPACE_SYSTEM.md` e riferimento incrociato in `GLOBAL_WORKSPACE_PANEL.md`.
- Test regressione completa; deprecazione futura percorso «Crea Workspace e Condividi» documentata come follow-up.

### File principali

- `WorkspaceResourcesSection.tsx` (azione card)
- `CondivisioneSection.tsx` (modale conferma)
- `personalShareService.ts` (`savePersonalCopyFromWorkspace`)
- `workspaceMemberAclSync.ts` (export `resolveResourceOwnerId`)
- Documentazione AI_CONTEXT

### Dipendenze

- FASE 3.

### Rischi

- Membro senza `canView` tenta copia → messaggio chiaro.
- Copia diario condiviso di altro owner: verificare `ownerId` sorgente corretto.

### Verifiche di chiusura macrofase

- [x] Salva copia: solo elemento cliccato, nuova copia personale.
- [x] Seconda copia consentita anche se ne esiste già una.
- [ ] Tutti i percorsi share invariati (checklist FASE 1 ripetuta — test manuale).
- [x] Documento AI_CONTEXT aggiornato.
- [x] Nessuna nuova pipeline oltre quelle in sezione 4.8.

### Implementazione FASE 4 (10 luglio 2026)

| Area | Stato |
|------|-------|
| `savePersonalCopyFromWorkspace` | Gate `isWorkspaceMember` + `getWorkspaceResourceAccessForUser` ≥ viewer; delega a `duplicateSharedResourceForInvitee` |
| Hub Condivisione | Pulsante «Salva una copia» su ogni card; `DeleteConfirmationModal` variant `info` |
| Permessi | Riutilizzo lookup esistenti; nessun nuovo sistema permessi |
| Documentazione | `AI_CONTEXT/28`, `GLOBAL_WORKSPACE_PANEL.md` §7.2 |

---

# 7. Considerazioni finali

## 7.1 Decisioni consolidate (non rivalutare in implementazione)

- Nessuna nuova pipeline di linking/copia.
- Catalogo completo **solo** create entry.
- Ordine step create: Setup → CONDIVISIONE → Dettagli → Inviti.
- Workspace vuoto e inviti vuoti **consentiti**.
- Regola duplicazione DOM-L-01 (testo ufficiale sezione 3.7).
- Originale/Duplicato una volta per operazione create multi-elemento.
- Salva una copia: singolo elemento, tutti i membri, sempre nuova istanza.
- Wizard Condividi: comportamento invariato (catalogo no).
- Terminologia UX Elemento/i; step CONDIVISIONE; titolo COMPOSIZIONE.
- Indietro = step precedente da `getWizardSteps`.
- Permessi inviti scelti in wizard, non collaborator fisso.
- Tipografia Inviti: fix locale, non token Foundation globali.

## 7.2 Criticità ancora aperte (bassa gravità)

| # | Punto | Nota |
|---|-------|------|
| 1 | **Rimozione** «Crea Workspace e Condividi» | Dopo validazione create hub; non bloccante |
| 2 | **Copy esatto** step Inviti in italiano | Bozza in 3.8 I-02; approvazione finale in PR UI |
| 3 | **Permesso minimo** Salva copia | Consolidato: membro + viewer; verificare edge case owner |
| 4 | **Azione bulk** «Seleziona tutte» valigie/template | UX opzionale FASE 2, non obbligatoria |
| 5 | **Hub UI polish** (tipografia pannello, placeholder) | Parallelo; doc `GLOBAL_WORKSPACE_PANEL` |

## 7.3 Motivazioni delle scelte principali

| Scelta | Motivazione |
|--------|-------------|
| Stesso modale, entryMode | Evita duplicazione UI e stato; anni di manutenzione |
| materialize per create multi-duplica | Già implementa regola dominio archi; non reinventare |
| Catalogo solo create | Condividi è «parto da un elemento»; create è «compongo da inventario» |
| Dettagli dopo COMPOSIZIONE | Decido cosa includo, poi come lo collego |
| addResourceToExisting per post-create | Una pipeline canonica già validata in produzione |
| duplicateSharedResourceForInvitee per Salva copia | Diario senza pivot; allineato a «copia personale indipendente» |

## 7.4 Punti da rivalutare solo dopo implementazione

1. Deprecare percorso `create_workspace` dal wizard Condividi.
2. Unificare ordine step create e share-create (se il percorso share sopravvive).
3. Estensione catalogo ad altri moduli futuri (Documenti, Spese, …) — fuori v1.
4. Workspace Foundation leggera (token hub) — analisi UX luglio 2026, non bloccante wizard.

## 7.5 Riferimento rapido file codice (ripresa lavoro)

| Concetto | Path |
|----------|------|
| Modale orchestrazione | `src/components/collaboration/CollaborationShareModal.tsx` |
| Step UI | `src/components/collaboration/CollaborationShareWizard.tsx`, `WorkspaceShareWizardSteps.tsx` |
| Step graph | `src/components/collaboration/collaborationSharePresentation.ts` |
| Materialize | `src/services/collaboration/workspaceComposition/materializeWorkspaceComposition.ts` |
| Blueprint seed | `src/services/collaboration/workspaceComposition/resolveWorkspaceCompositionBlueprint.ts` |
| Create + add | `src/services/collaboration/workspaceCompositionService.ts` |
| Copia personale | `src/services/collaboration/personalShareService.ts` |
| Hub Condivisione | `src/components/workspace/global/sections/CondivisioneSection.tsx` |
| Crea Workspace button | `src/components/workspace/global/sections/WorkspaceSection.tsx` |
| Open share | `src/hooks/useOpenCollaborationShare.ts` |

---

## Stato approvazione

| Campo | Valore |
|-------|--------|
| Documento | `docs/collaboration/WORKSPACE_WIZARD_MACROPHASE.md` |
| Versione | 1.0 (+ regola generale macrofasi) |
| **FASE 1** | **Completata** — 10 luglio 2026 |
| **FASE 2** | **Completata** — 10 luglio 2026 — catalogo, copy UX, rimozione ponti FASE 1 |
| **FASE 3** | **Completata** — 10 luglio 2026 — inviti permessi, add elemento, sync |
| **FASE 4** | **Completata** — 10 luglio 2026 — Salva una copia, documentazione |
| Macrofase | **Chiusa** — verifiche manuali share da ripetere in QA |

---

*Fine documento.*
