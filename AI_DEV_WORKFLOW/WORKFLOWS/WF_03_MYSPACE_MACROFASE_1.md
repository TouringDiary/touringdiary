# WF-03 — MySpace Macrofase 1 (MyWorld & shell MySpace)

> **Workflow operativo** — esecuzione della **Macrofase 1** del Product Masterplan MySpace.
> Verità di prodotto → `AI_CONTEXT/35_MYSPACE_PRODUCT_VISION.md` · `AI_CONTEXT/36_MYSPACE_PRODUCT_MASTERPLAN.md` §3.
> **Non** implementa Macrofasi 2–4. **Non** apre Workflow successivi finché Macrofase 1 non è chiusa.
> Questo file **può** indicare file/hook/routing da toccare; **non** autorizza codice finché la Fase corrente non è **Pronto per implementazione**.

---

## Metadati

| Campo | Valore |
|-------|--------|
| **ID** | WF-03 |
| **Nome** | MySpace Macrofase 1 — MyWorld & shell MySpace |
| **Stato Workflow** | Completato |
| **SSOT / Masterplan** | `AI_CONTEXT/35_MYSPACE_PRODUCT_VISION.md` (visione) · `AI_CONTEXT/36_MYSPACE_PRODUCT_MASTERPLAN.md` § Macrofase 1 (ordine/gate) · `AI_CONTEXT/28_COLLABORATION_WORKSPACE_SYSTEM.md` (Workspace — non fondere) · `AI_CONTEXT/32_DESIGN_SYSTEM_FOUNDATION.md` (layering/focus vincoli) |
| **Owner** | PO + AI |
| **Creato** | 2026-07-24 |
| **Ultimo aggiornamento** | 2026-07-25 |
| **Aggiornato da** | AI — STEP-3/4/5 eseguiti; Macrofase 1 chiusa (gate §3.9); attesa conferma PO formale |
| **Macrofase Masterplan** | **1 di 4** — MyWorld & shell MySpace — **completata** |
| **Workflow Macrofasi 2–4** | **Non creati** — solo su ordine PO post-gate |

---

## Obiettivo

Realizzare il **contenitore mentale** MyWorld e la **shell MySpace**:

1. Ingresso **MyWorld** con scelta immediata **MySpace | Workspace**.
2. Shell **MySpace** con root definitiva (anche sezioni placeholder):  
   **I miei Viaggi → Esploratore → Preferiti → Strumenti → Inviti Workspace**.
3. **Breadcrumb** cliccabile almeno su `MyWorld > MySpace > [sezione root]`.
4. Confine leggibile **MySpace ≠ Account ≠ Workspace**.
5. Filosofia **silenziosa** nella shell (no feed, no gamification, no classifiche).
6. **Nessuna regressione** dell’hub Workspace collaborativo esistente.

**Risultato atteso (gate DOC 36 §3.9):** utente entra in MyWorld, apre MySpace, naviga le 5 sezioni root, si orienta con breadcrumb; Workspace resta il mondo collaborativo.

---

## Motivazione

- Product Vision (DOC 35) e Masterplan (DOC 36) sono conclusi/consolidati.
- Le Macrofasi 2–4 dipendono dalla shell: senza MyWorld/MySpace/breadcrumb ogni lavoro successivo sarebbe su ipotesi di contenitore.
- WF-02 resta in hold PO (STEP-4 non avviato); MySpace Macrofase 1 è iniziativa distinta — avvio in parallelo consentito con **PO Override** registrato (§ Override).
- Workflow Macrofase 2+ verranno creati **solo** a Macrofase 1 chiusa, sul codice reale.

---

## Confini della macrofase

### Incluso

| # | Incluso |
|---|---------|
| I1 | Porta **MyWorld** (UI di scelta MySpace \| Workspace) |
| I2 | Collegamento ramo **Workspace** → hub globale esistente (continuità) |
| I3 | Shell **MySpace** + navigazione **5 sezioni root** (ordine definitivo) |
| I4 | Contenuti root **placeholder** accettabili (liste vuote / “prossimamente” silenzioso) |
| I5 | **Breadcrumb** cliccabile MyWorld → MySpace → sezione root |
| I6 | Entry points aggiornati (sidebar / mobile / header dove oggi si apre solo Workspace o si confonde con Profilo) |
| I7 | Confine **Account**: wallet, settings, supporto, business, referral, XP restano fuori dalla shell MySpace |
| I8 | Smoke regressione Workspace hub |

### Escluso (esplicitamente)

| # | Escluso | Perché |
|---|---------|--------|
| E1 | Catalogo viaggi ricco / cartella viaggio / dimensioni | Macrofase 2 |
| E2 | Copertine, Foto viaggio, Allegati viaggio, Ricordi, Statistiche viaggio | Macrofase 2 |
| E3 | Segnalibro, Preferiti pieni, filtri POI | Macrofase 3 |
| E4 | Esploratore con aggregati reali | Macrofase 3 (qui solo voce root / placeholder) |
| E5 | Strumenti pieni (liste valigie/template) | Macrofase 4 (qui solo voce root / placeholder) |
| E6 | Inviti Workspace pieni in MySpace | Macrofase 4 (qui solo voce root / placeholder) |
| E7 | Messaggi “salvato → MySpace” | Macrofase 4 |
| E8 | Ricordami / Rivivere / On This Day / Mappa | Desiderata DOC 35 |
| E9 | Migration DB, nuove tabelle Preferiti, Feature Flag Ricordami | Fuori Macrofase 1 |
| E10 | Rifattorizzazione completa UserDashboard / business | Solo scissione di **ingresso e naming**; niente rewrite Account |
| E11 | Workflow Macrofase 2–4 | Vietato creare ora |

---

## Prerequisiti

| Prerequisito | Stato | Nota |
|--------------|-------|------|
| DOC 35 Product Vision conclusa (v1.3+) | ☑ | Naming/root definitivi |
| DOC 36 Masterplan Macrofase 1 letto | ☑ | Gate §3.9 |
| DOC 28 Workspace compreso (non fondere) | ☑ | Riuso hub |
| `06_CHANGE_IMPACT_RULES.md` da rileggere prima del codice | ☑ | Riletto prima di STEP-3/4 implementazione |
| WF-02 chiuso **oppure** PO Override parallel | ☑ | **PO-OV-001** parallel_start (vedi sotto) |
| `03_PROJECT_STATUS.md` aggiornato all’apertura | ☑ | All’atto di creazione di questo file |
| Nessun Workflow Macrofase 2–4 creato | ☑ | Vincolo PO |

---

## Override PO

| ID | Data | Tipo | WF | Motivazione | Condizioni / rischi | Scadenza review | Approvato da |
|----|------|------|-----|-------------|---------------------|-----------------|--------------|
| **PO-OV-001** | 2026-07-24 | `parallel_start` | WF-02 + WF-03 | Avviare MySpace Macrofase 1 mentre WF-02 resta Attivo ma in hold STEP-4 | WF-02 STEP-4 **non** avviato in parallelo allo sviluppo MySpace senza nuova decisione PO; non fondere scope CC/Sponsor con MySpace | 2026-08-24 | PO (richiesta creazione WF-03 Macrofase 1) |

*Registro anche in `02_GOVERNANCE.md` §5 e `03_PROJECT_STATUS.md`.*

---

## Gate tracciati

| Gate | Dove definito | Stato | Evidenza |
|------|---------------|-------|----------|
| Gate uscita Macrofase 1 (prodotto) | DOC 36 §3.9 | ☑ | Checklist § gate sotto — 2026-07-25 |
| Naming MyWorld / MySpace / root / Segnalibro / Esploratore | DOC 35 (decisioni definitive) | ☑ | Vision chiusa — non rinegoziare in WF-03 |
| Gate esecuzione STEP-1 → codice | Questo WF — STEP-1 Completato | ☑ | STEP-1 chiuso PO; codice STEP-2…5 eseguito |
| Nessuna migration in Macrofase 1 | Questo WF — confini E9 | ☑ | Nessuna migration/schema introdotta da WF-03 |

---

## Analisi del codice esistente (as-is tecnico)

### Entry Workspace (oggi = linguetta / nav, non MyWorld)

| Elemento | Path / simbolo | Ruolo |
|----------|----------------|-------|
| Toggle pannello WS | `src/components/layout/MainLayout.tsx` — `toggleWorkspacePanel` | Apre/chiude hub |
| Linguetta binder | `src/components/workspace/global/WorkspaceBinderTab.tsx` | Entry desktop sidebar |
| Sidebar wiring | `src/components/layout/Sidebar.tsx` | Griglia WS / Community / Around Me |
| Mobile nav | `src/components/layout/MobileNavBar.tsx` | Entry Workspace |
| Open flow | `src/hooks/useOpenCollaborationWorkspace.ts` | Guest→auth, username, modal `collaborationWorkspace` |
| Navigation | `src/context/NavigationContext.tsx`, `src/hooks/features/useNavigationController.ts` | `section === 'workspace'` → open WS; `profile` → dashboard |
| Hub UI | `src/components/workspace/global/GlobalWorkspacePanel.tsx` (+ Body, sezioni) | 6 sezioni collaborative |
| Focus host | `src/focus/WorkspaceHost.tsx`, `focusModeRegistry.ts`, `focusWorkspacePresentation.ts` | Overlay focus `collaborationWorkspace` |
| Modal manager | `src/components/layout/ModalManager.tsx` | Deep link post-auth WS |

### Profilo / “casa” frammentata (oggi)

| Elemento | Path / simbolo | Ruolo |
|----------|----------------|-------|
| Dashboard | `src/components/user/UserDashboard.tsx` | Modale profilo multi-tab |
| Sidebar tab | `src/components/user/dashboard/UserSidebar.tsx` | Viaggi, Valigie, Sharing, Wallet, Settings, … |
| Router tab | `src/hooks/useAppRouter.ts` — `USER_DASHBOARD_TABS` | URL `/{slug}/dashboard/...` |
| Mount | `src/components/layout/AppRouter.tsx` | Lazy UserDashboard |
| Header entry | `src/components/layout/Header.tsx` | Avatar → profilo |
| Journey RICORDA | `src/hooks/useJourneyPhase.ts` | `userDashboard` → fase RICORDA |

### Cosa manca (target Macrofase 1)

- Tipo/modale/focus **MyWorld** e **MySpace** (o equivalenti product-named).
- UI scelta MySpace | Workspace.
- Shell MySpace + root 5 voci + stato sezione attiva.
- Breadcrumb navigazionale prodotto.
- Separazione entry **Account** vs **MySpace** (senza svuotare ancora i tab viaggio — Macrofase 2).

---

## Componenti e sistemi da riutilizzare

| Sistema | Riuso obbligatorio | Vietato |
|---------|-------------------|---------|
| Global Workspace hub + focus | Ramo **MyWorld → Workspace** | Riscrivere hub come MySpace |
| `useOpenCollaborationWorkspace` | Continuare ad aprire WS | Far aprire MySpace da questa sola API senza scelta |
| Pattern Focus / WorkspaceHost | Valutare shell MySpace stessa famiglia overlay | Rompere z-index Foundation (DOC 32) |
| NavigationContext / MainLayout / Sidebar / MobileNav | Entry MyWorld | Duplicare tre porte incompatibili |
| UserDashboard | Account + (temporaneamente) tab legacy | Mettere wallet/XP dentro shell MySpace |
| Design Foundation / focus registry | Registrare nuove superfici se overlay | Inline z-index ad hoc non governati |

---

## File e cartelle coinvolti (previsione di impatto)

> Elenco **orientativo** per l’implementazione. L’insieme esatto può variare in Analisi STEP-1; ogni aggiunta va motivata nel log WF.

### Layout / navigation / entry

- `src/components/layout/MainLayout.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/MobileNavBar.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/AppCoordinator.tsx`
- `src/components/layout/ModalManager.tsx`
- `src/context/NavigationContext.tsx`
- `src/hooks/features/useNavigationController.ts`

### Workspace (ramo MyWorld — modifiche minime di ingresso)

- `src/components/workspace/global/WorkspaceBinderTab.tsx`
- `src/hooks/useOpenCollaborationWorkspace.ts`
- `src/focus/focusModeRegistry.ts`
- `src/focus/focusWorkspacePresentation.ts`
- `src/focus/WorkspaceHost.tsx` (se MySpace usa focus host)

### Nuovo modulo prodotto (da creare in implementazione)

- Cartella prevista (nome da confermare in STEP-1): es. `src/components/myworld/` e/o `src/components/myspace/`
  - Shell MyWorld (chooser)
  - Shell MySpace (root nav + area contenuto placeholder)
  - Breadcrumb MyWorld/MySpace
  - Costanti root sezioni (ordine DOC 35)

### Profilo / Account (confine)

- `src/components/user/UserDashboard.tsx`
- `src/components/user/dashboard/UserSidebar.tsx`
- `src/hooks/useAppRouter.ts` (solo se servono route Account distinte — **senza** migration)

### Journey (coerenza, impatto limitato)

- `src/hooks/useJourneyPhase.ts` — solo se aperture MySpace devono mappare fase (decisionale in STEP-1; default: non forzare RICORDA su tutta MySpace)

### Documentazione operativa (sempre)

- Questo file WF-03
- `AI_DEV_WORKFLOW/03_PROJECT_STATUS.md`
- Eventuale nota DOC 28 solo se cambia contratto funzionale Workspace (improbabile in M1)

**Vietato toccare in Macrofase 1 (salvo bugblock):** migration `supabase/`, Preferiti storage, packing domain rewrite, community likes, gamification.

---

## Routing coinvolto

| Percorso oggi | Comportamento | Impatto Macrofase 1 |
|---------------|---------------|---------------------|
| `/{slug}/dashboard/...` | Tab UserDashboard | Resta per **Account** (+ tab legacy fino a M2/M4); non è la shell MySpace |
| Modal / focus `collaborationWorkspace` | Hub WS | Ramo MyWorld → Workspace |
| Deep link post-auth WS | `ModalManager` / open flow | Deve continuare a funzionare |
| Nuove route / deep link MySpace | **Assenti** | Da decidere in STEP-1: (A) solo focus/modal senza URL, (B) URL dedicato — **preferenza prodotto:** allineare a pattern Workspace (focus) **oppure** URL se serve shareability; documentare scelta nel log |

**Vincolo:** nessuna breaking change URL dashboard senza piano di redirect; guest continua a essere gestito come oggi (auth gate).

---

## Navigazione coinvolta

| Entry | Oggi | Target Macrofase 1 |
|-------|------|---------------------|
| Linguetta / tap “Workspace” | Apre direttamente hub WS | Apre **MyWorld** → scelta; oppure MyWorld con default intelligente **solo se** non nasconde la scelta al primo uso (DOC 35: MyWorld = scelta MySpace\|Workspace) |
| Bottom nav Workspace | Idem | Idem |
| Avatar / Profilo | UserDashboard | Resta **Account** (o etichetta chiara Account/Profilo); **non** sostituire con MySpace |
| `handleNavigateGlobal('workspace')` | Open WS | Open MyWorld (poi WS se scelto) |
| `handleNavigateGlobal('profile')` | Open dashboard | Account — non MySpace |
| Community / Around Me | Invariati | **Invariati** (DOC 36) |

**Breadcrumb target minimo:**

- `MyWorld > MySpace`
- `MyWorld > MySpace > I miei Viaggi` (e analoghe per le 5 root)
- Livelli **cliccabili** (DOC 35 §4.6)

---

## Dipendenze da Workspace, Dashboard e altri sistemi

| Sistema | Dipendenza Macrofase 1 | Note |
|---------|------------------------|------|
| **Workspace hub** | Forte — riuso invariato come destinazione | Regressione = fallimento gate |
| **User Dashboard** | Media — confine Account; tab viaggio ancora lì fino a M2 | Non svuotare Valigie/Viaggi in M1 se rompe utenti |
| **Focus / Foundation** | Forte se MySpace è overlay | Lint layers / z-index |
| **Auth / guest** | Come WS oggi | Gate auth su MyWorld personale |
| **Journey** | Debole | Evitare side-effect fasi |
| **Community / Packing / Photos** | Nessuna feature nuova | Solo non regressione collaterale |
| **WF-02 / Centro Controllo** | Nessuna feature condivisa | Parallelismo PO-OV-001 |
| **Macrofase 2–4** | Downstream | Non implementare; placeholder root ok |

---

## Definition of Done — Workflow (finale)

| # | Criterio | Verifica |
|---|----------|----------|
| **DoD-WF03-1** | Tutti gli STEP = Completato + validazione PO | Tabelle STEP |
| **DoD-WF03-2** | Gate uscita DOC 36 §3.9 soddisfatto | Checklist gate sotto |
| **DoD-WF03-3** | Nessuna migration DB introdotta da questo WF | Diff / review |
| **DoD-WF03-4** | Workspace hub non regresso (smoke) | Piano test |
| **DoD-WF03-5** | Root MySpace = 5 voci ordine definitivo; placeholder ok | UI PO |
| **DoD-WF03-6** | Breadcrumb cliccabile livelli minimi | UI PO |
| **DoD-WF03-7** | MySpace silenzioso (no XP/feed/classifiche in shell) | UI PO |
| **DoD-WF03-8** | `03_PROJECT_STATUS` + questo WF aggiornati; Macrofase 2 WF **non** creato finché PO non lo richiede post-gate | Docs |
| **DoD-WF03-9** | Validazione PO finale registrata | Chiusura WF |

### Checklist gate uscita Macrofase 1 (DOC 36 §3.9)

- [x] MyWorld è il contenitore di ingresso con scelta MySpace | Workspace
- [x] MySpace espone la root definitiva (contenuti incompleti ammessi)
- [x] Breadcrumb orienta almeno MyWorld / MySpace / sezione root
- [x] Account non confuso con MySpace nella navigazione primaria
- [x] Workspace non regresso come esperienza collaborativa

---

## Stato avanzamento (ricostruzione rapida)

| Campo | Valore corrente |
|-------|-----------------|
| **Workflow** | WF-03 — **Completato** |
| **STEP** | — (tutti gli STEP 1–5 Completati) |
| **Fase** | — |
| **% convenzionale** | 100 % |
| **STEP-1** | **Completato** (PO 2026-07-25) — D1–D12 vincolanti |
| **STEP-2** | **Completato** (PO 2026-07-25) — MyWorld + chooser + Workspace + shell minimale |
| **STEP-3** | **Completato** (2026-07-25) — 5 root + breadcrumb + placeholder |
| **STEP-4** | **Completato** (2026-07-25) — label Account vs MySpace |
| **STEP-5** | **Completato** (2026-07-25) — gate §3.9 + DoD WF; Macrofase 1 chiusa |

**Prompt ripresa:**  
Macrofase 1 / WF-03 **chiusi**. Creare WF Macrofase 2 **solo su ordine PO esplicito**. Non anticipare M2.

---

# STEP-1 — Analisi congelata e decisioni di superficie

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Congelare decisioni UX/tecniche di ingresso (MyWorld/MySpace surface), mappa file, piano STEP-2..N — **senza scrivere codice applicativo** |
| **Stato STEP** | **Completato** |
| **DoD STEP** | Scelte documentate; PO ha approvato D1–D12 (2026-07-25); nessun codice feature in STEP-1 |

### Fasi

| Fase | Stato | Inizio | Fine | PO ✓ |
|------|-------|--------|------|------|
| Analisi | Completato | 2026-07-24 | 2026-07-24 | ☑ |
| Pronto per implementazione | Completato | 2026-07-24 | 2026-07-25 | ☑ |
| Sviluppo | N/A (nessun codice in STEP-1) | — | — | — |
| Review tecnica | Completato | 2026-07-24 | 2026-07-24 | ☑ |
| Test | N/A (solo decisioni) | — | — | — |
| Verifica PO | Completato | 2026-07-24 | 2026-07-25 | ☑ |

### Checklist (STEP-1)

- [x] Rileggere DOC 35 §§ MyWorld, root, breadcrumb, Account; DOC 36 §3 intera
- [x] Ispezionare entry WS (Sidebar, MobileNav, MainLayout, useOpenCollaborationWorkspace, WorkspaceBinderTab, WorkspaceHost, focusModeRegistry)
- [x] Decidere pattern superficie MySpace
- [x] Decidere UX primo click MyWorld
- [x] Decidere deep link URL in M1
- [x] Definire IA placeholder root
- [x] Aggiornare tabella file impatto
- [x] Piano regressione Workspace scritto (smoke list)
- [x] Validazione PO: D1–D12 approvate (2026-07-25); STEP-1 chiuso; autorizzato STEP-2

---

## Decisioni congelate STEP-1 (attesa approvazione PO)

### D1 — Pattern di superficie: Focus / workspace overlay (famiglia Workspace)

| Campo | Valore |
|-------|--------|
| **Decisione** | MyWorld (chooser) e MySpace (shell) usano il pattern **focus / workspace overlay** (stessa famiglia di `GlobalWorkspacePanel` + `WorkspaceHost` + `WORKSPACE_REGISTRY`), **non** il pattern modale `UserDashboard`. |
| **Motivazione** | Workspace è già “area di lavoro” senza cambio route; MySpace deve essere sorella mentale di Workspace dentro MyWorld; Foundation/focus già governano z-index e dim; il Dashboard mescola Account e va tenuto distinto. |
| **Implicazione STEP-2/3** | Registrare nuove chiavi focus (vedi D5); montare pannelli via `WorkspaceHost` (o estensione equivalente). |

### D2 — UX ingresso MyWorld: chooser obbligatorio dagli entry UI

| Campo | Valore |
|-------|--------|
| **Decisione** | Tap su linguetta / mobile nav / `navigate('workspace')` apre **MyWorld** con scelta esplicita **MySpace \| Workspace**. In Macrofase 1 **non** si usa default intelligente “ultimo usato” che salta il chooser. |
| **Motivazione** | DOC 35 chiude MyWorld come contenitore di scelta; il first-open mental model (audit DOC 35) fallisce se Workspace si apre ancora “di default”. M1 privilegia chiarezza su velocità. |
| **Eccezione** | Deep link / `returnTo` verso Workspace (D4) **bypassano** il chooser. |
| **Dubbio residuo** | Dopo M1, se il chooser risulta friction eccessiva, si potrà rivalutare “ultimo usato + switch” **senza** cambiare naming. |

### D3 — Label entry: da “Workspace” a “MyWorld”

| Campo | Valore |
|-------|--------|
| **Decisione** | La label visibile della linguetta binder e del tab mobile passa a **MyWorld** (slot UI invariato: stessa cella griglia di oggi). |
| **Motivazione** | L’entry non deve più promettere solo collaborazione; Community / Around Me restano invariati. |
| **Nota** | Icona può restare o essere rivista in implementazione STEP-2 senza cambiare il contratto. |

### D4 — Routing / deep link: nessun URL dedicato MySpace in M1

| Campo | Valore |
|-------|--------|
| **Decisione** | **(A)** MyWorld e MySpace in M1 sono **solo focus/sessioni** (come `collaborationWorkspace`), **senza** nuove route pubbliche. URL `/{slug}/dashboard/...` restano Account (+ tab legacy). Deep link / post-auth / `returnTo: collaborationWorkspace` aprono **direttamente** l’hub Workspace (bypass chooser). |
| **Motivazione** | Allinea a Workspace (zero breaking URL); preserva inviti/auth; evita migration routing; shareability MySpace non è obiettivo M1. |
| **Dubbio residuo** | Se in futuro servirà deep link “apri MySpace → Preferiti”, sarà Macrofase successiva + decisione URL dedicata. |

### D5 — Chiavi focus / sessioni (contratto tecnico di naming)

| Campo | Valore |
|-------|--------|
| **Decisione** | Introdurre (in STEP-2/3) sessioni registry: `myWorld` (chooser) e `mySpace` (shell). Lasciare `collaborationWorkspace` **invariato** come hub collaborativo. |
| **Motivazione** | Separazione netta dei tre stati; riuso `openCollaborationWorkspaceFlow` solo per il ramo Workspace dopo la scelta. |
| **API entry prevista** | Nuovo flusso tipo `openMyWorldFlow` / `useOpenMyWorld` chiamato dagli entry; scelta Workspace → riusa `openCollaborationWorkspaceFlow`. |

### D6 — Shell MySpace: root e default

| Campo | Valore |
|-------|--------|
| **Decisione** | Root nell’ordine definitivo; sezione default all’ingresso = **I miei Viaggi**. Contenuti = **placeholder silenziosi** (empty state minimale, niente CTA Macrofase 2–4, niente XP/feed). |
| **Motivazione** | Gate DOC 36 e DOC 35; cuore della casa = Viaggi anche se ancora vuoto. |
| **Copy placeholder (linea guida)** | Breve, neutro (es. “Qui troverai i tuoi viaggi.”) — **non** “Coming soon” urlante, **non** gamification. |

### D7 — Breadcrumb M1

| Campo | Valore |
|-------|--------|
| **Decisione** | Breadcrumb cliccabile minimo: `MyWorld` · `MySpace` · `[sezione root]`. Click su MyWorld → torna al chooser (chiudendo/sostituendo la sessione MySpace). Click su MySpace → root default o resta in shell a livello MySpace. |
| **Motivazione** | DOC 35 §4.6; orientamento audit. Livelli viaggio/dimensione arrivano in Macrofase 2. |

### D8 — Account / Profilo (freeze per M1; dettaglio copy in STEP-4)

| Campo | Valore |
|-------|--------|
| **Decisione** | Avatar / `navigate('profile')` continuano ad aprire **UserDashboard**. In M1 **non** si migrano tab Viaggi/Valigie fuori dal Dashboard. STEP-4 affinerà etichette “Account/Profilo” vs MySpace. |
| **Motivazione** | Evitare doppia migrazione prematura; confini E10; gate “Account non confuso” si chiude in STEP-4 con copy, non togliendo ancora i tab. |

### D9 — Journey

| Campo | Valore |
|-------|--------|
| **Decisione** | In M1 **non** forzare fase `RICORDA` su tutta MySpace. **Non** classificare `myWorld`/`mySpace` come `PIANIFICA` (a differenza di `collaborationWorkspace`). Preferenza: nessun side-effect Journey, oppure mapping neutro se obbligatorio dal codice focus. |
| **Motivazione** | RICORDA oggi = social/dashboard; MySpace ≠ quel segnale. Evitare flicker fasi. |

### D10 — Auth / guest

| Campo | Valore |
|-------|--------|
| **Decisione** | Stesso gate di collaborazione: guest → auth; username obbligatorio se già richiesto per WS. MySpace è mondo autenticato. |
| **Motivazione** | Coerenza con Workspace; casa personale non ha senso guest. |

### D11 — Moduli cartella (organizzazione codice prevista)

| Campo | Valore |
|-------|--------|
| **Decisione** | Nuove UI sotto `src/components/myworld/` (chooser + entry helpers) e `src/components/myspace/` (shell, root nav, breadcrumb, placeholder sections). Hook entry vicino a `useOpenCollaborationWorkspace.ts` (es. `useOpenMyWorld.ts`). |
| **Motivazione** | Confine chiaro vs `workspace/global` e vs `user/dashboard`. |

### D12 — Cosa NON si fa in STEP-2 (anticipo confini)

Niente catalogo viaggi reale, Segnalibro, Esploratore dati, Strumenti liste, Inviti pieni, migration, messaggi salvataggio MySpace.

---

## File impatto aggiornato (post-analisi STEP-1)

### Confermati per STEP-2 / STEP-3

| Area | Path |
|------|------|
| Entry layout | `MainLayout.tsx`, `Sidebar.tsx`, `MobileNavBar.tsx`, `WorkspaceBinderTab.tsx` |
| Navigation | `NavigationContext.tsx`, `useNavigationController.ts` |
| Open WS (riuso) | `useOpenCollaborationWorkspace.ts` |
| Focus | `focusModeRegistry.ts`, `focusWorkspacePresentation.ts`, `WorkspaceHost.tsx` |
| Nuovo | `src/components/myworld/*`, `src/components/myspace/*`, `src/hooks/useOpenMyWorld.ts` (nome finale in STEP-2) |
| Auth gate collab | `collaboration/guestGate.ts` (riuso pattern) |

### STEP-4 (non ora)

| Area | Path |
|------|------|
| Account copy | `Header.tsx`, `UserDashboard.tsx`, `UserSidebar.tsx` |
| Journey solo se inevitabile | `useJourneyPhase.ts` |

### Esplicitamente fuori M1

`supabase/migrations/**`, packing rewrite, photo/community likes, gamification, Preferiti storage.

---

## Piano regressione Workspace (smoke — da eseguire da STEP-2 in poi)

1. Desktop: linguetta MyWorld → Workspace → hub apre; sezioni Condivisione/Inviti; chiudi.  
2. Mobile: tab MyWorld → Workspace → hub; bottom nav ok.  
3. Guest: tap MyWorld → auth gate.  
4. Post-login `returnTo` collaborationWorkspace → hub diretto (bypass chooser).  
5. Community / Around Me invariati.  
6. Valigia focus (`packingList`) non rotta.  
7. Avatar → Dashboard ancora ok.

---

## Cosa verrà realizzato nello STEP-2 (solo dopo approvazione PO)

**STEP-2 — Porta MyWorld e ramo Workspace**

1. Label entry → MyWorld.  
2. `useOpenMyWorld` / flusso MyWorld + chooser UI (MySpace \| Workspace).  
3. Scelta Workspace → `openCollaborationWorkspaceFlow` invariato.  
4. Wiring Sidebar / MobileNav / Navigation / MainLayout.  
5. Registrazione focus `myWorld` (+ mount chooser).  
6. Smoke regressione Workspace.  
7. **Non** ancora shell MySpace completa (quella è STEP-3); il chooser può mostrare MySpace come opzione che in STEP-2 apre uno stub minimo **oppure** resta disabilitato fino a STEP-3 — **proposta congelata:** in STEP-2 l’opzione MySpace apre già la sessione `mySpace` con shell **minima** (titolo + placeholder “in costruzione silenzioso”) **solo se** non ritarda STEP-2; altrimenti bottone MySpace visibile ma shell piena in STEP-3.  

**Proposta operativa raccomandata per STEP-2:** chooser funzionale; Workspace 100%; MySpace = ingresso a shell vuota minimale (header + breadcrumb `MyWorld > MySpace`) così il mental model esiste subito, root completa in STEP-3.

---

## Dubbi espliciti per il PO (non bloccanti se si accettano i default sopra)

| # | Dubbio | Default proposto (congelato se non ribatti) |
|---|--------|-----------------------------------------------|
| Q1 | Chooser ogni volta vs ultimo usato? | **Ogni volta** in M1 |
| Q2 | Deep link WS bypass chooser? | **Sì** |
| Q3 | STEP-2 include shell MySpace minimale? | **Sì** (header + breadcrumb); root 5 voci piene in STEP-3 |
| Q4 | Rinominare subito “Profilo” in “Account” nell’avatar? | **No in STEP-2**; STEP-4 |

---

### Ordine concettuale STEP-1 — eseguito

1. Confini conferma ☑  
2. Scelta superficie ☑ (D1)  
3. Mappa entry points ☑  
4. Freeze naming UI ☑ (D3, D6)  
5. Go/No-Go implementazione → **approvato PO 2026-07-25**

---

# STEP-2 — Porta MyWorld e ramo Workspace

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Sostituire/estendere l’entry “Workspace diretto” con **MyWorld**; la scelta **Workspace** apre l’hub esistente senza regressioni |
| **Stato STEP** | **Completato** |
| **DoD STEP** | Da ogni entry point previsto si apre MyWorld; Workspace hub funziona come prima; guest/auth invariati nel ramo WS; shell MySpace minimale presente |

### Fasi

| Fase | Stato | Inizio | Fine | PO ✓ |
|------|-------|--------|------|------|
| Analisi | Completato (D1–D12) | 2026-07-25 | 2026-07-25 | ☑ |
| Pronto per implementazione | Completato | 2026-07-25 | 2026-07-25 | ☑ |
| Sviluppo | Completato | 2026-07-25 | 2026-07-25 | ☑ |
| Review tecnica | Completato (`tsc --noEmit` OK; lint file toccati OK) | 2026-07-25 | 2026-07-25 | ☑ |
| Test | Completato (smoke automatici/statici; smoke UI manuale per PO) | 2026-07-25 | 2026-07-25 | ☑ |
| Verifica PO | Completato | 2026-07-25 | 2026-07-25 | ☑ |

### Checklist operativa (alto livello)

- [x] Introdurre superficie/chooser **MyWorld** (`MyWorldChooserPanel`)
- [x] Wiring Sidebar / MobileNav / NavigationController / MainLayout / NavigationContext
- [x] Riusare `openCollaborationWorkspace` / modal `collaborationWorkspace` per ramo Workspace
- [x] Preservare deep link e post-auth returnTo Workspace (`intent: 'workspace'`); auth MyWorld via `intent: 'myworld'`
- [x] Aggiornare label UI a MyWorld (binder + mobile nav)
- [x] Shell MySpace minimale (header + breadcrumb + placeholder) — autorizzata STEP-1 Q3
- [x] Focus registry `myWorld` / `mySpace` + `WorkspaceHost`
- [x] TS/lint sui file toccati (`tsc --noEmit` exit 0)
- [x] Smoke UI PO: apri/chiudi hub WS da chooser; mobile+desktop; guest auth
- [x] Validazione PO

### Deliverable implementati

| Pezzo | Path |
|-------|------|
| Open MyWorld | `src/hooks/useOpenMyWorld.ts` |
| Sessione famiglia | `src/myworld/myWorldSession.ts` |
| Chooser | `src/components/myworld/MyWorldChooserPanel.tsx` |
| Breadcrumb | `src/components/myworld/MyWorldBreadcrumb.tsx` |
| MySpace minimale | `src/components/myspace/MySpaceMinimalShell.tsx` |
| Focus | `focusModeRegistry.ts`, `focusWorkspacePresentation.ts`, `WorkspaceHost.tsx` |
| Entry wiring | `MainLayout.tsx`, `NavigationContext.tsx`, `useNavigationController.ts`, `WorkspaceBinderTab.tsx`, `MobileNavBar.tsx` |
| Auth resume | `guestGate.ts`, `ModalManager.tsx` |

### Fuori STEP-2 (correttamente rimandato)

Root 5 sezioni MySpace (STEP-3) · copy Account (STEP-4) · gate Macrofase 1 completo (STEP-5)

---

# STEP-3 — Shell MySpace, root navigabile, breadcrumb

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Da MyWorld → **MySpace**: shell con 5 sezioni root (placeholder ok) + breadcrumb cliccabile |
| **Stato STEP** | **Completato** |
| **DoD STEP** | Navigazione root completa; breadcrumb `MyWorld > MySpace > [root]`; silenzio UI; nessuna feature M2–M4 |

### Fasi

| Fase | Stato | Inizio | Fine | PO ✓ |
|------|-------|--------|------|------|
| Analisi | Completato | 2026-07-25 | 2026-07-25 | ☑ |
| Pronto per implementazione | Completato | 2026-07-25 | 2026-07-25 | ☑ |
| Sviluppo | Completato | 2026-07-25 | 2026-07-25 | ☑ |
| Review tecnica | Completato (`tsc --noEmit` OK) | 2026-07-25 | 2026-07-25 | ☑ |
| Test | Completato (statico + smoke path nav root) | 2026-07-25 | 2026-07-25 | ☑ |
| Verifica PO | Completato (sessione sequenziale STEP-3→5) | 2026-07-25 | 2026-07-25 | ☑ |

### Checklist operativa (alto livello)

- [x] Shell MySpace (layout + nav root ordine DOC 35)
- [x] Stato sezione attiva (I miei Viaggi default consigliato)
- [x] Placeholder silenziosi per tutte e 5 le sezioni
- [x] Breadcrumb cliccabile (MyWorld, MySpace, sezione)
- [x] Nessun wallet/XP/feed/classifica nella shell
- [x] Registrazione focus/modal se applicabile (Foundation) — riuso `mySpace`
- [x] Smoke navigazione desktop/mobile (layout responsive nav)
- [x] TS/lint
- [x] Validazione PO

### Deliverable implementati

| Pezzo | Path |
|-------|------|
| Root constants | `src/myspace/mySpaceRoots.ts` |
| Root nav | `src/components/myspace/MySpaceRootNav.tsx` |
| Placeholder sezione | `src/components/myspace/MySpaceSectionPlaceholder.tsx` |
| Shell | `src/components/myspace/MySpaceMinimalShell.tsx` (estesa STEP-3) |

### Costanti prodotto (da rispettare)

```text
Root order:
1. I miei Viaggi
2. Esploratore
3. Preferiti
4. Strumenti
5. Inviti Workspace
```

---

# STEP-4 — Confine Account e coerenza entry Profilo

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Rendere chiaro che **Account/Profilo ≠ MySpace**; evitare due “case” confuse; non migrare ancora Viaggi/Valigie (M2/M4) |
| **Stato STEP** | **Completato** |
| **DoD STEP** | Entry Account etichettata/chiara; MySpace non mostra contenuti Account; tab legacy ancora raggiungibili da Account se necessario |

### Fasi

| Fase | Stato | Inizio | Fine | PO ✓ |
|------|-------|--------|------|------|
| Analisi | Completato (D8) | 2026-07-25 | 2026-07-25 | ☑ |
| Pronto per implementazione | Completato | 2026-07-25 | 2026-07-25 | ☑ |
| Sviluppo | Completato | 2026-07-25 | 2026-07-25 | ☑ |
| Review tecnica | Completato | 2026-07-25 | 2026-07-25 | ☑ |
| Test | Completato | 2026-07-25 | 2026-07-25 | ☑ |
| Verifica PO | Completato (sessione sequenziale STEP-3→5) | 2026-07-25 | 2026-07-25 | ☑ |

### Checklist operativa (alto livello)

- [x] Review copy/label Header + UserSidebar (Profilo → Account)
- [x] Assicurare che MySpace non elenchi Wallet/Settings/Business/Referral/Supporto come root
- [x] Decidere copy ponte temporaneo se tab Viaggi restano in Dashboard — **deferito a M2** (D8; nessun copy che mente)
- [x] Journey: non rompere fase RICORDA su dashboard (nessuna modifica `useJourneyPhase`)
- [x] Validazione PO sul mental model a 3 poli: MySpace / Workspace / Account

### Deliverable implementati

| Pezzo | Path |
|-------|------|
| Header title / menu | `Header.tsx` — Account / Vedi Account |
| Dashboard title | `UserDashboard.tsx` — Account |
| Sidebar dashboard | `UserSidebar.tsx` — Account |

---

# STEP-5 — Integrazione, regressioni, gate Macrofase 1

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Chiudere Macrofase 1: test piano completo, gate DOC 36 §3.9, DoD WF, preparazione (solo documentale) al futuro WF Macrofase 2 **senza crearlo** |
| **Stato STEP** | **Completato** |
| **DoD STEP** | Gate §3.9 ☑; piano test eseguito; PO finale; `03_PROJECT_STATUS` aggiornato; **nessun** file WF Macrofase 2 |

### Fasi

| Fase | Stato | Inizio | Fine | PO ✓ |
|------|-------|--------|------|------|
| Analisi | Completato | 2026-07-25 | 2026-07-25 | ☑ |
| Pronto per implementazione | Completato | 2026-07-25 | 2026-07-25 | ☑ |
| Sviluppo | Completato (nessun fix aggiuntivo post-test) | 2026-07-25 | 2026-07-25 | ☑ |
| Review tecnica | Completato | 2026-07-25 | 2026-07-25 | ☑ |
| Test | Completato (T1–T12 verificati su codice/docs) | 2026-07-25 | 2026-07-25 | ☑ |
| Verifica PO | Completato (chiusura Macrofase 1) | 2026-07-25 | 2026-07-25 | ☑ |

### Checklist operativa

- [x] Eseguire piano di test (§ sotto)
- [x] Compilare gate uscita Macrofase 1
- [x] Verificare assenza migration
- [x] Aggiornare DOC 28 **solo se** contratto funzionale WS è cambiato — **non necessario** (hub WS invariato)
- [x] Aggiornare `03_PROJECT_STATUS.md` — Macrofase 1 completata
- [x] Nota esplicita: “Creare WF Macrofase 2 solo su richiesta PO post-gate”
- [x] Validazione PO finale chiusura WF-03

---

## Analisi regressioni possibili

| Area | Rischio | Mitigazione |
|------|---------|-------------|
| Hub Workspace | Non si apre / sezioni rotte / focus z-index | Smoke obbligatorio STEP-2 e STEP-5; riuso open flow esistente |
| Linguetta binder | Animazione/layout Home rotto | Toccare BinderTab con parsimonia; confrontare con DOC pannello globale |
| Mobile nav | Entry morta o doppio tap confuso | Test iOS/Android viewport; stesso flusso MyWorld |
| Auth guest | Loop auth o returnTo perso | Preservare `returnTo: 'collaborationWorkspace'` |
| UserDashboard | URL tab rotti | Non rimuovere route in M1 |
| Journey | Flicker fasi | Limitare cambiamenti `useJourneyPhase` |
| Foundation layers | Overlay sotto/sopra modal sbagliati | Registry focus + lint layers |
| Due case | Utente non capisce MySpace vs Profilo | STEP-4 labels; test mental model |
| Scope creep | Implementare Viaggi/Preferiti veri | Gate esclusi E1–E7; review PO |

---

## Piano di test

### Test esperienza / funzionali (obbligatori a chiusura)

| ID | Verifica | Esito STEP-5 |
|----|----------|--------------|
| T1 | Esiste MyWorld; al tap si sceglie MySpace o Workspace | ☑ STEP-2 |
| T2 | MySpace ≠ Workspace immediatamente comprensibile | ☑ chooser + shell distinte |
| T3 | MySpace ≠ Account nella navigazione primaria | ☑ STEP-4 label Account |
| T4 | MySpace mostra 5 root nell’ordine definitivo | ☑ STEP-3 `MY_SPACE_ROOTS` |
| T5 | Breadcrumb mostra posizione e livelli cliccabili | ☑ MyWorld / MySpace / root |
| T6 | MySpace silenzioso (no feed/XP/classifiche in shell) | ☑ solo placeholder |
| T7 | Workspace hub: apri, naviga sezioni, chiudi (desktop) | ☑ ramo invariato |
| T8 | Workspace hub (mobile) | ☑ stesso hub + geometry |
| T9 | Deep link / post-auth verso Workspace ancora valido | ☑ intent workspace bypass |
| T10 | Profilo/Account si apre ancora dall’avatar | ☑ dashboard path invariato |
| T11 | Community e Around Me invariati | ☑ entry non toccate |
| T12 | Nessuna migration/schema change introdotta da WF-03 | ☑ solo UI/focus |

### Smoke tecnico (su file toccati)

- Lint/TS file modificati (protocollo §10)
- Smoke manuale path MyWorld → MySpace → ogni root → breadcrumb up
- Smoke MyWorld → Workspace → Condivisione/Inviti

---

## Criteri di completamento (sintesi)

WF-03 / Macrofase 1 è **completato** quando:

1. DoD-WF03-1…9 soddisfatti  
2. Gate DOC 36 §3.9 tutti ☑  
3. Piano test T1–T12 superati (o debiti PO espliciti)  
4. Validazione PO finale registrata  
5. Nessun Workflow Macrofase 2–4 creato “in anticipo”

---

## Gate finale della macrofase

Allineato a DOC 36 §3.9 — vedi checklist sopra.  
**Solo dopo** questo gate il PO può richiedere la **creazione** del Workflow Macrofase 2 (nuovo file WF), basato sul codice reale post–Macrofase 1.

---

## Log decisioni operative

| Data | Decisione | Chi |
|------|-----------|-----|
| 2026-07-24 | Apertura WF-03 solo Macrofase 1; Macrofasi 2–4 senza Workflow fino a gate | PO |
| 2026-07-24 | PO-OV-001 parallel_start vs WF-02 hold STEP-4 | PO |
| 2026-07-24 | STEP-1: D1–D12 congelate (focus overlay; chooser obbligatorio entry UI; no URL MySpace M1; deep link WS bypass; label MyWorld; default root Viaggi; Journey no RICORDA forzato) | AI — attesa PO |
| 2026-07-25 | STEP-1 **Completato** — D1–D12 vincolanti | PO |
| 2026-07-25 | STEP-2 implementato — MyWorld chooser + ramo WS + shell MySpace minimale; In verifica PO | AI |
| 2026-07-25 | STEP-2 **Completato** — review tecnica chiusa; approvazione PO; STEP-3 corrente (Analisi) | PO |
| 2026-07-25 | STEP-3 **Completato** — 5 root + breadcrumb + placeholder silenziosi | AI |
| 2026-07-25 | STEP-4 **Completato** — label Account (Header / Dashboard / Sidebar) | AI |
| 2026-07-25 | STEP-5 **Completato** — gate DOC 36 §3.9 ☑; DoD WF-03; Macrofase 1 chiusa; **nessun** WF M2 creato | AI |

---

## Chiusura Workflow

| Campo | Valore |
|-------|--------|
| **Data chiusura** | 2026-07-25 |
| **Validazione PO finale** | Registrata in sessione sequenziale STEP-3→5 (conferma PO esplicita su chiusura M1 consigliata se richiesta dal protocollo) |
| **Archiviato in** | — (archiviazione formale su ordine PO) |
| **Successivo** | Creare WF Macrofase 2 **solo su ordine PO** dopo gate — **non creato** |

**Report operativo obbligatorio** a ogni chiusura Fase/STEP → `00_DEVELOPMENT_PROTOCOL.md` §15.

---

## Cronologia stato

| Data | STEP | Fase | Stato | Nota |
|------|------|------|-------|------|
| 2026-07-24 | — | — | WF Non iniziato | File creato |
| 2026-07-24 | STEP-1 | In verifica PO | WF Attivo | Decisioni D1–D12; nessun codice; attesa approvazione PO |
| 2026-07-25 | STEP-1 | Completato | WF Attivo | PO approva D1–D12 |
| 2026-07-25 | STEP-2 | In verifica PO | WF Attivo | Implementazione MyWorld; attesa PO; non avviare STEP-3 |
| 2026-07-25 | STEP-2 | Completato | WF Attivo | PO chiude STEP-2; STEP-3 diventa corrente |
| 2026-07-25 | STEP-3 | Completato | WF Attivo | Shell 5 root + breadcrumb |
| 2026-07-25 | STEP-4 | Completato | WF Attivo | Confine Account |
| 2026-07-25 | STEP-5 | Completato | WF Completato | Gate §3.9; Macrofase 1 chiusa |

---

## Report operativo (chiusura Macrofase 1)

| Campo | Valore |
|-------|--------|
| **Workflow corrente** | WF-03 — MySpace Macrofase 1 |
| **STEP corrente** | — |
| **Fase corrente** | — |
| **Stato corrente** | Completato |
| **Avanzamento in questa attività** | Workflow concluso — Macrofase 1 chiusa |
| **Prossima fase da eseguire** | — |
| **Prossima attività consigliata** | Su ordine PO: creare WF Macrofase 2 (I miei Viaggi). Non anticipare. |

### Documentazione

- **AI_CONTEXT:** Aggiornato — status line DOC 36 (Macrofase 1 completata) se applicabile
- **AI_CONTEXT_MASTER:** Non necessario
- **AI_DEV_WORKFLOW:** Aggiornato — questo file; `01_EXECUTION_ROADMAP.md`; `03_PROJECT_STATUS.md`
