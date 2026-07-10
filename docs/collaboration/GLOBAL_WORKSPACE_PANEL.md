# Pannello Workspace Globale — Documento tecnico/funzionale

**Progetto:** TouringDiary  
**Versione documento:** 1.4  
**Stato:** Ufficiale — single source of truth (allineato al codice)  
**Data:** 9 luglio 2026  
**Ultimo allineamento codice:** 9 luglio 2026  
**Precede:** `AI_CONTEXT/28_COLLABORATION_WORKSPACE_SYSTEM.md`, `docs/collaboration/PIANO_DI_SVILUPPO.md` (Fasi 1–10 concluse)

---

## Come usare questo documento

Questo documento è la **single source of truth** per l'evoluzione del Workspace da modale + pannello laterale a **Pannello Workspace globale**.

Per avviare l'implementazione:

> **Procedi con la Fase N** (vedi §16)

Prima di ogni fase:

1. Rileggere questo documento integralmente.
2. Verificare che le fasi precedenti siano completate (criteri di completamento soddisfatti).
3. Implementare **solo** quanto previsto nella fase indicata.

### Stato implementazione

Tutte le fasi **0–6** sono **completate** (9 luglio 2026).

Per obiettivi, file coinvolti, criteri di completamento e note per ogni fase → **§16 Piano di sviluppo — FASI** (unica fonte di dettaglio; evitare duplicazioni in altre sezioni).

---

## 1. Obiettivo generale della revisione

Trasformare l'accesso al Workspace da un flusso a due livelli (modale lista → pannello laterale) in un **Hub operativo globale** sempre disponibile nell'applicazione, percepito come estensione naturale dell'interfaccia — non come pagina, modale o finestra sovrapposta.

### Obiettivi misurabili

| # | Obiettivo |
|---|-----------|
| O1 | Eliminare completamente `WorkspacesModal` e il passaggio intermedio modale |
| O2 | Aprire il pannello direttamente da qualsiasi entry point (desktop linguetta, mobile bottom nav) |
| O3 | Desktop: linguetta fisica nella posizione Home (sidebar sinistra); pannello ~95% larghezza; espansione top-origin dal binder |
| O10 | Layout Home invariato: nessuna nuova barra nav; Community e Around Me restano dove sono oggi |
| O11 | Hub operativo: sezioni multi-colonna, scroll verticale minimizzato, densità informativa alta |
| O4 | Riorganizzare le sezioni interne secondo il nuovo schema a 6 macro-aree |
| O5 | Tablet/mobile: stesso pannello, bottom nav sempre disponibile e corretta |
| O6 | Mantenere architettura focus workspace esistente (`WorkspaceHost`, focus mode, servizi collaboration) |
| O7 | Pipeline definitiva: selezione workspace → ingresso automatico in Condivisione |
| O8 | Contesto workspace attivo sempre visibile nelle sezioni operative |
| O9 | Tutte le 5 sotto-sezioni Allegati operative fin dalla prima implementazione |

---

## 2. Filosofia del nuovo Workspace

### Principi

1. **Il Workspace non è navigazione.** Community e Around Me sono sezioni dell'app. Il Workspace è l'**area di lavoro personale** dell'utente.
2. **Il Workspace non è un pulsante.** Non usa affordance da tab o button. È una **linguetta fisica** (maniglia del raccoglitore).
3. **Il pannello nasce dalla linguetta.** Linguetta e pannello sono **un unico elemento** durante tutta l'animazione.
4. **Il contenuto sottostante resta contestuale.** Il pannello si estende sopra il contenuto corrente senza cambiare route o interrompere il flusso.
5. **Hub operativo, non pannello stretto.** Il pannello sfrutta ~95% della larghezza disponibile. Ogni sezione usa layout **dashboard multi-colonna** per massimizzare le informazioni visibili e ridurre lo scroll verticale.
6. **Il layout Home non cambia.** Workspace, Community e Around Me restano nelle **posizioni attuali** (griglia superiore della sidebar desktop). Non si introduce alcuna nuova riga o barra dedicata. L'unica trasformazione: il pulsante Workspace diventa la **linguetta/maniglia** del pannello; Community e Around Me restano invariati.
7. **Click su un workspace = ingresso nell'area di lavoro.** La selezione non è un'azione neutra: apre immediatamente la sezione Condivisione.
8. **Cambio workspace vs uscita definitiva.** Selezionare un'altra card nella sezione Workspace **cambia** il workspace attivo. **Abbandona** significa uscire **definitivamente** da quel workspace (solo membri).

### Metafora visiva

```
HEADER (invariato)
──────────────────────────────────────────────────────────────
SIDEBAR (top)          │  MAIN (Home — invariato)
┌──────────────────┐   │
│ WS ▼ │ Comm │ AM  │   │   ← stessa griglia 3 colonne di oggi
└────────┬─────────┘   │      WS = linguetta; Comm/AM invariati
         │              │
         │  pannello nasce sotto header, si espande verso il basso
         ▼              │
┌────────────────────────────────────────────────────────────┐
│              PANNELLO WORKSPACE (~95% viewport width)       │
│  [ Workspace │ Condivisione │ Allegati │ Attività │ … ]     │
│  ┌─────────── contenuto multi-colonna (hub dashboard) ───┐  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

**Chiuso:** nella sidebar, solo la linguetta Workspace (▼) al posto del vecchio pulsante; Community e Around Me visibili come oggi.  
**Aperto:** linguetta (▲) resta agganciata sotto l'header (sidebar); il pannello si espande **immediatamente sotto l'header** verso il basso — effetto raccoglitore, **non** slide dal fondo pagina.

---

## 3. Paradigma di utilizzo

### Desktop (`lg+`, ≥1024px)

| Azione | Comportamento |
|--------|---------------|
| Click linguetta (chiuso) | Il pannello si espande **verso il basso** da subito sotto l'header (top-origin); la linguetta resta in sidebar |
| Click linguetta (aperto) | Il pannello si richiude verso l'alto; la linguetta torna a ▼ |
| Click fuori pannello | Chiusura shell (`FocusOverlay` workspaceDim); **workspace attivo resta in memoria** (D27) |
| ESC | Chiusura shell; **workspace attivo resta in memoria** (D27) |
| Click Community / Around Me | Comportamento invariato (modali esistenti); chiude il pannello workspace se aperto |

La **linguetta non esiste su tablet/mobile.**

### Tablet e mobile (`< lg`)

| Azione | Comportamento |
|--------|---------------|
| Click Workspace (bottom nav) | Stesso pannello globale, layout adattato |
| Bottom nav | Sempre disponibile; il pannello non la copre |
| Linguetta | Assente |

### Pipeline definitiva di apertura e selezione

```
Click linguetta Workspace (o entry point mobile)
  ↓
Gate auth/username (useOpenCollaborationWorkspace — invariato)
  ↓
openModal('collaborationWorkspace')
  ↓
Pannello si apre → sezione **Workspace** (se nessun workspace in memoria) oppure ultima sezione operativa / **Condivisione** (se workspace già attivo in memoria — D27)
  ↓
Utente vede: Workspace Proprietario · Workspace Membro · Crea Workspace
  ↓
Click su una card Workspace
  ↓
Workspace diventa Workspace attivo
  ↓
Pannello passa AUTOMATICAMENTE alla sezione Condivisione
```

**Eccezione deep link:** se l'apertura avviene con `workspaceId` esplicito (notifica, profilo, diary toolbar), il workspace viene impostato come attivo e il pannello apre direttamente su **Condivisione**.

### Workspace attivo

Una volta selezionato un workspace, **tutte le sezioni operative** (Condivisione, Allegati, Attività, Utenti) lavorano **esclusivamente** su quel workspace:

| Sezione | Dati mostrati |
|---------|---------------|
| Condivisione | Solo risorse condivise del workspace attivo |
| Allegati | Solo allegati del workspace attivo |
| Attività | Solo cronologia del workspace attivo |
| Utenti | Solo membri, invitati e utenti bloccati del workspace attivo |

Il workspace attivo persiste fino a:

- **`clearActiveWorkspace()`** — **Abbandona** (membro) o **Elimina** (owner): nessun workspace attivo, sezione Workspace
- **Logout** (sessione utente terminata)

**Non** termina alla chiusura del pannello (linguetta, ESC, overlay): la shell si chiude ma `activeWorkspaceId` resta in memoria (D27).

**Cambio workspace** — flusso ufficiale:

```
Sezione operativa (qualsiasi)
  ↓
Navigazione alla sezione Workspace
  ↓
Click su un'altra card workspace
  ↓
Nuovo workspace attivo → Condivisione (automatico)
```

**Abbandona** — flusso distinto (non è cambio workspace):

```
Sezione Workspace (card workspace attivo, solo membro)
  ↓
Comando "Abbandona" + conferma
  ↓
Perdita appartenenza definitiva → sezione Workspace, nessun workspace attivo
```

### Stato di sessione del pannello

Due layer distinti: **visibilità pannello** (ModalContext / focus) e **contesto operativo** (`WorkspacePanelProvider`).

```typescript
// ModalContext — apertura/chiusura shell (focus session)
activeModal: 'collaborationWorkspace' | null
modalProps: {
  workspaceId?: string       // intent ingresso (consume-once all'apertura)
  initialSection?: WorkspacePanelSection
}

// WorkspacePanelProvider (AppCoordinator) — useWorkspacePanelState()
// File: src/components/workspace/global/WorkspacePanelContext.tsx
activeSection: WorkspacePanelSection
activeWorkspaceId: string | null
activeWorkspace: Workspace | null          // record idratato
activeWorkspaceRole: 'owner' | 'member' | null

// API pubblica
selectWorkspace(workspace, role)           // click card → attivo + sezione Condivisione
hydrateActiveWorkspace(workspace, role)    // deep link / fetch async, senza forzare sezione
clearActiveWorkspace()                     // Abbandona / Elimina → sezione Workspace, nessun attivo
navigateToSection(section)                 // redirect a Workspace se sezione operativa senza attivo
```

**Ownership:** `WorkspacePanelProvider` è montato in `AppCoordinator`, **sopra** `MainLayout` e `WorkspaceHost`. Lo stato sopravvive alla chiusura del pannello.

**Consume-once degli intent:** `modalProps.workspaceId` e `initialSection` vengono applicati **solo** al transito `isPanelOpen: false → true`. Non sono stato di sessione persistente in `ModalContext`.

**Teardown sessione focus:** `workspaceSessionRegistry` + `useWorkspaceSessionEnd` in `WorkspaceHost` registrano `closeModal`. La shell animata invoca `endWorkspaceSession()` a fine transizione di chiusura (`useFloatingPanelShellLifecycle`).

**Persistenza workspace attivo (D27):** la chiusura del pannello (linguetta, ESC, overlay) **non** azzera `activeWorkspaceId`. Il workspace attivo resta in memoria fino a `clearActiveWorkspace()` (Abbandona, Elimina) o logout. Alla riapertura: se c'era un workspace attivo → Stato **C**/**D** con ultima sezione navigabile; altrimenti → Stato **B**.

**Regole di navigazione sezioni:**

| Sezione | Richiede workspace attivo? |
|---------|---------------------------|
| Workspace | No |
| Condivisione | Sì — redirect a Workspace se assente |
| Allegati | Sì — redirect a Workspace se assente |
| Attività | Sì — redirect a Workspace se assente |
| Utenti | Sì — redirect a Workspace se assente |
| Inviti | No (user-scoped: inviti ricevuti) |

---

## 4. STATI DEL PANNELLO

Questa sezione descrive il **comportamento dell'interfaccia** nei momenti di utilizzo. Non descrive implementazione codice.

---

### Stato A — Pannello chiuso

**Cosa vede l'utente**

- Desktop: griglia sidebar `#tour-sidebar-buttons` invariata — **Workspace** (linguetta ▼) · **Community** · **Around Me** nelle stesse posizioni di oggi. Nessuna nuova barra sotto l'header.
- Mobile/tablet: bottom nav normale; nessun pannello workspace visibile.
- Il pannello non è visibile; **il workspace attivo può comunque restare in memoria** (D27) fino ad Abbandona/Elimina/logout.

**Cosa può fare**

- Aprire il pannello (click linguetta / tap Workspace in bottom nav)
- Usare normalmente il resto dell'app

**Transizione**

| Azione | Stato successivo |
|--------|------------------|
| Click linguetta / Workspace nav | **B** (nessun workspace in memoria) · **C**/**D** (workspace già attivo in memoria) · **C** (deep link con `workspaceId` al primo open) |

---

### Stato B — Pannello aperto, nessun workspace attivo

**Cosa vede l'utente**

- Pannello espanso (~95% width desktop)
- Linguetta `▲` nello **slot sidebar** col 1 (`#tour-sidebar-buttons`), styling binder collegato al pannello
- Barra sezioni con **Workspace** evidenziata
- Contenuto sezione Workspace:
  - **Workspace Proprietario** (lista o empty state)
  - **Workspace Membro** (lista o empty state)
  - Pulsante **Crea Workspace**
- **Nessun** riquadro "Workspace attivo" (non c'è contesto operativo)
- Sezioni operative (Condivisione, Allegati, Attività, Utenti) navigabili ma **reindirizzano** a Workspace se cliccate senza workspace attivo

**Cosa può fare**

- Sfogliare workspace proprietari e membro
- Creare un nuovo workspace (flusso esistente)
- Selezionare un workspace (card) → ingresso area lavoro
- Aprire sezione Inviti (inviti ricevuti, indipendente dal workspace attivo)
- Chiudere il pannello

**Transizione**

| Azione | Stato successivo |
|--------|------------------|
| Click card workspace | **C** |
| Click linguetta / ESC / overlay | **A** |
| Crea Workspace (completato) | Resta in **B** o **C** se il flusso seleziona il nuovo workspace |

---

### Stato C — Workspace attivo selezionato

**Cosa vede l'utente**

- Pannello aperto, sezione **Condivisione** attiva (ingresso automatico post-selezione)
- Riquadro **Workspace attivo** sempre visibile nelle sezioni operative:
  - Etichetta: "Workspace attivo"
  - Nome workspace
  - Ruolo: Owner / Membro
- Barra sezioni: Condivisione evidenziata
- Contenuto: risorse IN CONDIVISIONE del workspace attivo

**Cosa può fare**

- Navigare tra Condivisione, Allegati, Attività, Utenti (contesto invariato sul workspace attivo)
- Tornare alla sezione Workspace e **selezionare un'altra card** per cambiare workspace
- Aprire sezione Inviti (inviti ricevuti; workspace attivo resta in memoria)
- **Owner:** Eliminare workspace (Blocco B)
- **Membro:** **Abbandona** — solo per uscire definitivamente (Blocco B), non per cambiare workspace
- Tornare a sezione Workspace per vedere la card attiva evidenziata
- Chiudere il pannello

**Transizione**

| Azione | Stato successivo |
|--------|------------------|
| Navigazione tab Condivisione/Allegati/Attività/Utenti | Resta in **C** (stesso workspace) |
| Tab Inviti | **C*** (workspace attivo in memoria, UI inviti user-scoped) |
| Tab Workspace | **C′** (lista workspace, card attiva evidenziata) |
| Click altra card workspace | **C** (nuovo workspace attivo, Condivisione) |
| Abbandona (membro, confermato) | **B** (uscita definitiva — Blocco B) |
| Elimina (owner, confermato) | **B** |
| Chiusura pannello | **A** (solo shell chiusa; workspace attivo **resta in memoria** — D27) |

---

### Stato C′ — Workspace attivo, sezione Workspace

**Cosa vede l'utente**

- Sezione Workspace con liste Owner/Member
- La card del workspace attivo ha **stato grafico dedicato** (bordo, colore, badge — Design System)
- Comandi contestuali sulla card attiva:
  - Owner: **Elimina**
  - Membro: **Abbandona**

**Cosa può fare**

- Selezionare un **altro** workspace (altra card) → **C** su Condivisione
- Crea Workspace
- Navigare ad altre sezioni (resta in **C** sullo stesso workspace finché non si seleziona un'altra card)

**Transizione**

| Azione | Stato successivo |
|--------|------------------|
| Click altra card workspace | **C** (nuovo workspace, Condivisione) |
| Abbandona (Blocco B) | **B** (uscita definitiva, non cambio workspace) |
| Elimina | **B** |

---

### Stato C* — Workspace attivo, sezione Inviti

**Cosa vede l'utente**

- Lista inviti workspace **ricevuti** dall'utente loggato
- Nessun riquadro workspace attivo obbligatorio (sezione user-scoped)
- Il workspace attivo **resta in memoria** fino ad **Abbandona** / **Elimina** / logout (D27) — **non** fino alla chiusura del pannello

**Cosa può fare**

- Accettare / Rifiutare inviti ricevuti
- Tornare alle sezioni operative (contesto workspace attivo ripristinato in UI)

**Transizione**

| Azione | Stato successivo |
|--------|------------------|
| Accetta invito | Può portare a **C** se l'invito è per un workspace da aprire |
| Rifiuta invito | Resta in **C*** |
| Navigazione a Condivisione/… | **C** |

---

### Stato D — Navigazione nelle sezioni operative

**Cosa vede l'utente**

- Riquadro workspace attivo **sempre presente** in: Condivisione, Allegati, Attività, Utenti
- Contenuto specifico della sezione per il workspace attivo
- Barra sezioni con indicatore robusto sulla sezione corrente

**Cosa può fare**

- Operare nel contesto del workspace (risorse, file, attività, utenti)
- **Cambiare workspace:** tornare alla sezione Workspace e selezionare un'altra card
- **Abbandona** (Blocco B): uscita definitiva dal workspace attivo — non è un cambio workspace

**Transizione**

- Qualsiasi cambio sezione operativa: resta in **D** / **C**
- Abbandona (Blocco B): **B** — uscita definitiva
- Chiusura shell: **A** (pannello non visibile; workspace attivo in memoria se presente — D27)

---

### Stato E — Ritorno alla sezione Workspace

**Cosa vede l'utente**

- Come **C′** se workspace ancora attivo in memoria
- Come **B** solo dopo **Abbandona** / **Elimina** (`clearActiveWorkspace`)

**Transizione**

- Selezione altra card workspace → **C**
- Abbandona (Blocco B) → **B**

---

### Stato F — Chiusura del pannello

**Cosa vede l'utente**

- Pannello animato verso l'alto (`max-height: 0`); linguetta torna a `▼` nello slot sidebar
- App sottostante ripristinata (overlay `workspaceDim` rimosso)

**Effetto sullo stato**

- `activeModal` → `null` (sessione focus chiusa via `endWorkspaceSession`)
- **`activeWorkspaceId` resta in memoria** nel `WorkspacePanelProvider` (D27)
- `activeSection` resta l'ultima sezione navigata

**Transizione**

| Azione | Stato successivo |
|--------|------------------|
| Riapertura pannello | **B** (nessun workspace in memoria) · **C**/**D** (workspace ancora attivo) |
| Deep link con `workspaceId` al open | **C** (intent consume-once imposta attivo + Condivisione) |

---

## 5. Differenze rispetto all'implementazione attuale

| Aspetto | Attuale | Nuovo |
|---------|---------|-------|
| Entry nav principale | `openModal('workspaces')` → modale lista | `openModal('collaborationWorkspace')` → pannello diretto |
| UI lista workspace | `WorkspacesModal` + `WorkspaceQuickAccess` verticale | Sezione Workspace con Owner/Member, card ricche |
| Post-selezione workspace | Resta in lista o apre pannello laterale | **Auto-navigazione a Condivisione** |
| Cambio workspace | Non definito | Sezione Workspace → selezione altra card → Condivisione |
| Contesto attivo | Header nome workspace nel pannello stretto | Riquadro persistente in sezioni operative |
| Shell pannello | Right rail 28rem desktop | Hub ~95% width, **espansione top-origin** (raccoglitore) |
| Posizione controlli globali | Griglia sidebar Home | **Invariata** — nessuna `GlobalAppNavStrip` |
| Linguetta | Pulsante sidebar | Stesso slot del pulsante Workspace; styling maniglia binder |
| Tab interne | 5 tab piccole | 6 sezioni nav robusta (Outlook/Notion) |
| Inviti inviati | Tab dedicata | Utenti → Invitati al Workspace |
| Inviti ricevuti | Solo profilo | Tab Inviti nel pannello |
| Moduli futuri | In Condivisione ("In arrivo") | Allegati — tutte le 5 sotto-sezioni operative |
| Allegati | Lista flat senza categoria | 5 categorie DB: documents, tickets, bookings, expenses, misc |
| Uscita membro | Non esposta | Comando **Abbandona** con conferma Foundation |
| Eliminazione owner | `deleteWorkspace` esistente | Modale testo esatto Foundation |
| Focus companion diario | Portalato | Disabilitato per `collaborationWorkspace` |

---

## 6. Struttura completa del nuovo pannello

### 6.1 Anatomia del componente

```
GlobalWorkspacePanel (portal body, Z_FOCUS_ACTIVE)
├── WorkspaceBinderTab                    ← in Sidebar (#tour-sidebar-buttons, col 1); non in una barra dedicata
└── GlobalWorkspacePanelBody
    ├── WorkspaceSectionNav               ← barra 6 sezioni; griglia su desktop largo
    ├── WorkspaceActiveContextBar         ← inline con nav su xl+; sotto nav su mobile
    └── WorkspaceSectionContent           ← layout dashboard multi-colonna per sezione
        ├── WorkspaceSection              (sezione 1 — 2 colonne Owner | Member)
        ├── CondivisioneSection           (sezione 2 — griglia risorse 2–4 colonne)
        ├── AllegatiSection               (sezione 3)
        ├── AttivitaSection               (sezione 4 — griglia eventi multi-colonna)
        ├── UtentiSection                 (sezione 5)
        └── InvitiSection                 (sezione 6)
```

### 6.2 Dimensioni

| Proprietà | Desktop | Mobile/Tablet |
|-----------|---------|---------------|
| Larghezza | ~95% viewport, centrato | 100% |
| Altezza | Costante `WORKSPACE_GLOBAL_PANEL_HEIGHT` | `calc(100dvh - header - mobileNav)` |
| Z-index | `Z_FOCUS_ACTIVE` (9300) | Idem |
| Top (desktop) | `var(--header-height)` — immediatamente sotto header | `var(--header-height)` |
| Animazione | `max-height` top-origin (0 → altezza pannello) | Idem; altezza = viewport − header − bottom nav |
| Bottom nav reserve | N/A | `bottom: var(--mobile-nav-height)` |

### 6.3 Posizione controlli globali (desktop)

**Regola vincolante:** il layout Home **non cambia**.

- `#tour-sidebar-buttons`: griglia 3 colonne esistente in `Sidebar.tsx`
  - Col 1: **Workspace** → `WorkspaceBinderTab` (linguetta/maniglia)
  - Col 2: **Community** → invariato (`onOpenGlobal('community')`)
  - Col 3: **Around Me** → invariato (`openModal('aroundMe')`)
- **Non** introdurre `GlobalAppNavStrip`, `workspaceChrome` o righe dedicate sotto l'header
- Il pannello portaled è un overlay sotto l'header; la linguetta resta ancorata nella sidebar

### 6.4 Animazione pannello (raccoglitore)

Riferimento comportamentale: pannello Valigia (lifecycle condiviso), ma con **origine verticale in alto**:

| Fase | Comportamento |
|------|---------------|
| Chiusura | `max-height: 0`; overflow hidden |
| Apertura | Espansione verso il basso da `top: var(--header-height)` |
| Linguetta | Resta visibile in sidebar; ▼ chiuso / ▲ aperto |
| Vietato | `translate-y-full` dal fondo viewport; comparsa a metà pagina |

Proprietà CSS: `transition-[max-height] duration-500`, `overflow-hidden`, `transform-origin: top`.

### 6.5 Filosofia layout Hub Operativo (contenuti)

Il pannello ~95% width **non** è un pannello laterale allargato. Ogni sezione deve:

| Principio | Implementazione |
|-----------|-----------------|
| Densità informativa | Più dati visibili senza scroll |
| Multi-colonna | `grid` responsive (1 col mobile → 2–4 col desktop) |
| Dashboard | Sezioni affiancate dove possibile (es. Owner \| Member) |
| Scroll contenuto | Solo area body interna; header nav fisso |

**Layout per sezione (target):**

| Sezione | Layout dashboard |
|---------|------------------|
| Workspace | 2 colonne: Proprietario \| Membro; card in griglia compatta |
| Condivisione | Griglia risorse 2–4 colonne; tile compatti |
| Allegati | Nav categorie orizzontale + griglia file multi-colonna |
| Attività | Griglia eventi 2–3 colonne |
| Utenti | Sotto-sezioni a colonne o pannelli affiancati |
| Inviti | Lista/griglia compatta inviti ricevuti |

### 6.6 Ordine sezioni (definitivo)

1. Workspace  
2. Condivisione  
3. Allegati  
4. Attività  
5. Utenti  
6. Inviti  

### 6.7 Riquadro Workspace attivo (`WorkspaceActiveContextBar`)

Visibile in: **Condivisione**, **Allegati**, **Attività**, **Utenti**.

Contenuto minimo:

```
Workspace attivo
[Nome Workspace]
[Ruolo: Owner / Membro]
```

Opzionale nella sezione Workspace (contestualizzato dalle card evidenziate).

---

## 7. Descrizione dettagliata di ogni sezione

### 7.1 Workspace

**Scopo:** gestione e selezione dei workspace. **Non** mostra contenuto operativo.

#### Workspace Proprietario

- Elenco card dei workspace di cui l'utente è proprietario
- **Empty state:**  
  *"Non hai creato ancora Workspace. Crea un Workspace per condividere e modificare i documenti con altri utenti."*

#### Workspace Membro

- Elenco card dei workspace in cui l'utente è membro accettato (non owner)
- **Empty state:**  
  *"Non sei membro di nessun Workspace."*

#### Card workspace — informazioni obbligatorie

| Campo | Formato |
|-------|---------|
| Nome workspace | Testo |
| Badge ruolo | Owner / Membro |
| Numero membri | Conteggio |
| Data creazione | `📅 Creato` — `gg/mm/aaaa hh:mm` |
| Ultima attività | `🕒 Ultima attività` — formato dinamico: `oggi hh:mm` · `ieri hh:mm` · `2 giorni fa hh:mm` · `N giorni fa hh:mm` |

**Ultima attività:** basata su `updated_at` del workspace o ultimo evento dominio — **non** "Ultimo salvataggio".

#### Evidenziazione workspace attivo

La card del workspace attualmente aperto deve avere stato grafico dedicato (bordo evidenziato, colore, badge o indicatore Design System).

#### Azioni sulla sezione

| Azione | Chi | Comportamento |
|--------|-----|---------------|
| Click card | Tutti | Workspace attivo → **navigazione automatica a Condivisione** |
| **Crea Workspace** | Tutti (autenticati) | Flusso esistente `CollaborationShareModal` / wizard |
| **Abbandona** | Solo membri | Conferma Foundation → rimuove membership → sezione Workspace, nessun workspace attivo |
| **Elimina** | Solo owner | Conferma Foundation (testo esatto §7.1.1) → `deleteWorkspace` |

#### 7.1.1 Modale Elimina (testo esatto)

**Corpo:**

> Eliminando il Workspace verranno eliminate definitivamente tutti gli elementi condivisi (Diari, Valigie, Allegati e altri contenuti).
>
> Questa operazione è irreversibile e coinvolgerà anche tutti i membri del Workspace.

**Pulsanti:** `Annulla` · `Conferma`

**Vincoli business (invariati):** il proprietario può possedere al massimo **due** workspace; l'eliminazione libera uno slot.

#### 7.1.2 Modale Abbandona

- Disponibile **solo per membri** (non owner)
- Conferma conforme al Foundation (`DeleteConfirmationModal` o equivalente)
- Effetto: utente esce dal workspace, perde appartenenza; rientro solo con nuovo invito
- Service: nuova funzione `leaveWorkspace(workspaceId, userId)` (wrapper su rimozione membership self-service) o estensione di `removeWorkspaceMember` con actor = self

**Fonte dati liste:** `listWorkspacesForUser` con split client `ownerId === userId` / `ownerId !== userId`.  
**Metadati card:** estensione query o helper `getWorkspaceCardMetadata` (member count, last activity).

---

### 7.2 Condivisione

**Scopo:** risorse condivise del **workspace attivo**.

- Titolo area: **IN CONDIVISIONE**
- Contenuto: Diari, Valigie, Template, future risorse
- **Nessun** blocco Moduli futuri
- Riquadro workspace attivo visibile
- Componente base: refactor `WorkspaceResourcesSection`, layout hub orizzontale

---

### 7.3 Allegati

**Scopo:** gestione file del **workspace attivo** per categoria.

**Tutte le sotto-sezioni sono operative fin dalla prima implementazione** — nessun placeholder, nessuna area disabilitata.

| Sotto-sezione | Categoria DB | Operazioni |
|---------------|--------------|------------|
| Documenti | `documents` | upload · visualizzazione · eliminazione |
| Biglietti | `tickets` | upload · visualizzazione · eliminazione |
| Prenotazioni | `bookings` | upload · visualizzazione · eliminazione |
| Spese | `expenses` | upload · visualizzazione · eliminazione |
| Varie | `misc` | upload · visualizzazione · eliminazione |

**Regole:**

- Categoria assegnata automaticamente in base alla sotto-sezione di upload
- Architettura invariata: `workspace_attachments`, bucket privato, `workspaceAttachmentService` (path storage interno al service), MIME, quote, RLS, eventi dominio
- **NON** sotto-sezione chiamata "Allegati"
- **NON** dicitura "In arrivo"
- Migration obbligatoria: colonna `category` enum su `workspace_attachments`
- Riquadro workspace attivo visibile

---

### 7.4 Attività

**Scopo:** cronologia del **workspace attivo**.

- `CollaborationActivityFeed` — comportamento invariato
- Riquadro workspace attivo visibile

---

### 7.5 Utenti

**Scopo:** gestione utenti del **workspace attivo**.

| Sotto-sezione | Contenuto |
|---------------|-----------|
| **Proprietario** | Card owner |
| **Membri** | Lista + permessi risorsa |
| **Invita Utente** | Ricerca + invio (`sendWorkspaceInvite` + notifica — **invariato**) |
| **Invitati al Workspace** | Inviti inviati; owner può revocare |
| **Utenti Bloccati** | Accesso revocato **solo per questo workspace**; riabilitazione + nuovo invito |

**Utenti Bloccati — modello dati (confermato):**

- **NON** è blocco globale utente (`user_blocks`)
- Stesso utente può essere membro di altri workspace
- Implementazione preferita: **estendere il modello inviti esistente** (`workspace_invites`)
  - Utenti con invito `revoked` o ex-membri rimossi dall'owner → lista Utenti Bloccati
  - Riabilitazione: `resendWorkspaceInvite` / nuovo invito
- Evitare nuova tabella dedicata salvo vincoli tecnici emersi in implementazione

**Dicitura definitiva:** **Utenti Bloccati**

- Riquadro workspace attivo visibile

---

### 7.6 Inviti

**Scopo:** inviti workspace **ricevuti** dall'utente loggato.

- `listPendingWorkspaceInvitesForUser`
- Azioni: **Accetta** · **Rifiuta**
- Post-rifiuto: accesso solo con nuovo invito
- **Non** richiede workspace attivo
- Pattern UI: `UserSharingTab.tsx`

---

## 8. Componenti da riutilizzare

| Componente / Hook / Service | Uso |
|-----------------------------|-----|
| `WorkspaceHost` | Mount point |
| `FocusModeProvider` / `FocusOverlay` | workspaceDim |
| `useFloatingPanelShellLifecycle` | Lifecycle + animazione; chiusura → `endWorkspaceSession` |
| `useOpenCollaborationWorkspace` | Gate auth + apertura |
| `WorkspacePanelProvider` / `useWorkspacePanelState` | Stato hub (AppCoordinator) |
| `useWorkspaceDashboard` | Dati workspace attivo |
| `useWorkspaceResourceNavigation` | Apri risorsa da Condivisione |
| `CollaborationActivityFeed` | Attività |
| `WorkspaceResourcesSection` | Base Condivisione |
| `WorkspaceMembersSection` | Base Utenti |
| `WorkspaceInvitesSection` | Invitati al Workspace |
| `AllegatiCategoryPanel` | Upload/list/delete per categoria allegati |
| `workspaceAttachmentService` | Upload/list/delete per categoria |
| `listWorkspacesForUser` / `getWorkspaceMemberCounts` | Liste Owner/Member + conteggio membri card |
| `deleteWorkspace` | Elimina (owner) |
| `sendWorkspaceInvite` / notifiche | Invita Utente (invariato) |
| `acceptWorkspaceInvite` / `rejectWorkspaceInvite` | Tab Inviti |
| `revokeWorkspaceInvite` / `resendWorkspaceInvite` | Invitati / Utenti Bloccati |
| `DeleteConfirmationModal` | Abbandona + Elimina (Foundation) |
| `UserSharingTab` (pattern) | Inviti ricevuti |

---

## 9. Componenti da modificare

Vedi §11 per elenco file completo. Modifiche principali:

- `CollaborationWorkspacePanel` → re-export alias di `GlobalWorkspacePanel` (compatibilità; rimozione in Fase 6)
- `CollaborationWorkspacePanelBody` — **eliminato** (Fase 6)
- `WorkspaceAttachmentsSection` — **eliminato**; sostituito da `AllegatiCategoryPanel`
- `workspacePresentation.ts` → tab legacy pannello stretto; **hub** usa `globalWorkspacePresentation.ts`
- Entry point navigazione, `FeatureModals`, `Sidebar`, `AppShell`, `focusModeRegistry`
- `guestGate` / `ModalManager` → `returnTo: collaborationWorkspace`

---

## 10. Componenti da eliminare

| File | Motivo |
|------|--------|
| `WorkspacesModal.tsx` | Sostituito dal pannello globale |

---

## 11. Nuovi componenti

| Componente | Percorso | Responsabilità |
|------------|----------|----------------|
| `GlobalWorkspacePanel` | `src/components/workspace/global/GlobalWorkspacePanel.tsx` | Shell portaled: geometry, animazione binder top-origin |
| `WorkspaceBinderTab` | `src/components/workspace/global/WorkspaceBinderTab.tsx` | Maniglia ▼/▲ — slot sidebar col 1 |
| `WorkspaceSectionNav` | `src/components/workspace/global/WorkspaceSectionNav.tsx` | Barra 6 sezioni Outlook/Notion |
| `WorkspaceActiveContextBar` | `src/components/workspace/global/WorkspaceActiveContextBar.tsx` | Riquadro workspace attivo |
| `WorkspaceSection` | `.../sections/WorkspaceSection.tsx` | Liste Owner/Member, card, Crea/Abbandona/Elimina |
| `WorkspaceCard` | `.../sections/WorkspaceCard.tsx` | Card con metadati e stato selezionato |
| `CondivisioneSection` | `.../sections/CondivisioneSection.tsx` | IN CONDIVISIONE |
| `AllegatiSection` | `.../sections/AllegatiSection.tsx` | Nav 5 categorie |
| `AllegatiCategoryPanel` | `.../sections/AllegatiCategoryPanel.tsx` | Upload/list/delete per categoria |
| `AttivitaSection` | `.../sections/AttivitaSection.tsx` | Feed |
| `UtentiSection` | `.../sections/UtentiSection.tsx` | 5 sotto-sezioni |
| `InvitiSection` | `.../sections/InvitiSection.tsx` | Inviti ricevuti |
| `WorkspaceBlockedUsersSubsection` | `.../sections/WorkspaceBlockedUsersSubsection.tsx` | Utenti Bloccati |
| `resolveGlobalWorkspacePanelGeometry` | `src/layering/resolveGlobalWorkspacePanelGeometry.ts` | Geometry |
| `WorkspacePanelProvider` / `useWorkspacePanelState` | `src/components/workspace/global/WorkspacePanelContext.tsx` | Stato hub + API navigazione |
| `globalWorkspacePresentation` | `src/components/workspace/global/globalWorkspacePresentation.ts` | 6 sezioni, label, regole redirect |
| `workspaceSessionRegistry` | `src/focus/workspaceSessionRegistry.ts` | Teardown sessione focus |
| `leaveWorkspace` | `src/services/collaboration/workspaceMemberService.ts` | Abbandona |

---

## 12. Decisioni architetturali approvate

| # | Decisione |
|---|-----------|
| D1 | Evolvere focus workspace esistente (`WorkspaceHost`, focus mode) |
| D2 | `collaborationWorkspace` resta chiave `activeModal` |
| D3 | Eliminare `WorkspacesModal` |
| D4 | Linguetta = maniglia, non nav/tab/button |
| D5 | Community/Around Me **restano in Sidebar** (`#tour-sidebar-buttons`); nessuna barra nav dedicata |
| D6 | Pannello ~95% width; animazione **top-origin** (`max-height`), effetto raccoglitore — non slide dal basso viewport |
| D26 | Hub operativo: ogni sezione usa layout multi-colonna dashboard; scroll verticale minimizzato |
| D7 | Altezza pannello = costante misurata una volta |
| D8 | 6 sezioni nav robusta, ordine §6.4 |
| D9 | Click workspace → auto-navigazione **Condivisione** |
| D10 | Sezioni operative richiedono workspace attivo |
| D11 | `WorkspaceActiveContextBar` in Condivisione, Allegati, Attività, Utenti |
| D12 | Cambio workspace: sezione Workspace → click altra card → Condivisione. **Abbandona** = uscita definitiva (non cambio) |
| D13 | Apertura senza workspace in memoria: sezione Workspace; con workspace in memoria: ripristino contesto (ultima sezione / Condivisione) |
| D14 | Deep link con `workspaceId`: workspace attivo + Condivisione |
| D15 | Tab Inviti user-scoped, indipendente da workspace attivo |
| D16 | Disabilitare companion portal diario per `collaborationWorkspace` |
| D17 | Allegati: **tutte** le 5 categorie operative; migration `category` obbligatoria |
| D18 | Utenti Bloccati: scope workspace, via modello inviti esteso (no `user_blocks`) |
| D19 | Comando membro: **Abbandona** = uscita definitiva dal workspace (non "Disconnetti", non cambio workspace) |
| D20 | Elimina: testo modale esatto §7.1.1; max 2 workspace owner |
| D21 | Flusso invito e notifiche invariati |
| D22 | Crea Workspace via flusso esistente |
| D23 | Card workspace: metadati completi + evidenziazione attivo |
| D24 | Chiusura pannello **non** azzera workspace attivo; reset solo su Abbandona/Elimina/`clearActiveWorkspace` |
| D25 | Overlay `workspaceDim` invariato |
| D27 | `WorkspacePanelProvider` in `AppCoordinator`; stato sopravvive a chiusura shell |
| D28 | Intent `modalProps` consume-once all'ingresso (`isPanelOpen: false → true`) |
| D29 | `selectWorkspace` vs `hydrateActiveWorkspace`: navigazione utente vs hydration async |
| D30 | Teardown focus: `workspaceSessionRegistry` + `endWorkspaceSession` → `closeModal` |
| D31 | Presentazione hub: `globalWorkspacePresentation.ts` (convivenza temporanea con `workspacePresentation.ts` legacy) |
| D32 | Metadati card: `getWorkspaceMemberCounts` + campi `Workspace`; `formatRelativeActivity` su `updatedAt` |

---

## 13. Criticità note

| # | Criticità | Mitigazione |
|---|-----------|-------------|
| C1 | Migration `category` su `workspace_attachments` obbligatoria prima Allegati | Fase 5 — migration + backfill `misc` per record esistenti |
| C2 | `leaveWorkspace` non esiste | ✅ Risolto — `workspaceMemberService.leaveWorkspace` |
| C3 | Ultima attività: campo da definire (`updated_at` vs eventi dominio) | ✅ v1: `updated_at` + `formatRelativeActivity` |
| C4 | Member count per card: query aggiuntiva | ✅ `getWorkspaceMemberCounts` batch |
| C5 | Utenti Bloccati da inviti revocati + ex-membri senza storico | ✅ `removeWorkspaceMember` crea/aggiorna invito `revoked` |
| C6 | Bottom nav tablet z-index | Fase 2 |
| C7 | Sezioni operative senza workspace attivo | Redirect automatico a Workspace |
| C8 | `activeModal` singolo | Community chiude workspace — atteso |
| C9 | Allegati pre-migration in produzione | Backfill category = `misc` |

---

## 14. Decisioni ancora aperte

### 14.1 Intensità workspaceDim

Mantenere 60% + blur attuale o attenuare in Fase 6 polish?  
**Default:** invariato.

### 14.2 Fonte "Ultima attività" sulla card

`workspaces.updated_at` vs ultimo record `collaboration_domain_events` per workspace.  
**Default proposto:** `updated_at` in v1; eventi dominio in evoluzione successiva.

---

## 15. Elenco file coinvolti

### 15.1 Nuovi file

```
docs/collaboration/GLOBAL_WORKSPACE_PANEL.md
src/components/workspace/global/GlobalWorkspacePanel.tsx
src/components/workspace/global/GlobalWorkspacePanelBody.tsx
src/components/workspace/global/WorkspaceBinderTab.tsx
src/components/workspace/global/WorkspaceSectionNav.tsx
src/components/workspace/global/WorkspaceActiveContextBar.tsx
src/components/workspace/global/WorkspacePanelContext.tsx
src/components/workspace/global/globalWorkspacePresentation.ts
src/components/workspace/global/sections/WorkspaceSection.tsx
src/components/workspace/global/sections/WorkspaceCard.tsx
src/components/workspace/global/sections/CondivisioneSection.tsx
src/components/workspace/global/sections/AllegatiSection.tsx
src/components/workspace/global/sections/AllegatiCategoryPanel.tsx
src/components/workspace/global/sections/AttivitaSection.tsx
src/components/workspace/global/sections/UtentiSection.tsx
src/components/workspace/global/sections/InvitiSection.tsx
src/components/workspace/global/sections/WorkspaceBlockedUsersSubsection.tsx
src/components/workspace/global/index.ts
src/layering/resolveGlobalWorkspacePanelGeometry.ts
src/focus/workspaceSessionRegistry.ts
src/focus/useWorkspaceSessionEnd.ts
src/constants/workspacePanelLayout.ts
src/utils/formatRelativeActivity.ts
supabase/migrations/20260709180000_workspace_attachment_category.sql
src/services/collaboration/workspaceMemberService.ts
```

### 15.2 File modificati

```
src/focus/WorkspaceHost.tsx
src/focus/focusModeRegistry.ts
src/components/collaboration/workspace/CollaborationWorkspacePanel.tsx
src/components/collaboration/workspace/WorkspaceResourcesSection.tsx
src/components/collaboration/workspace/WorkspaceMembersSection.tsx
src/components/collaboration/workspace/WorkspaceInvitesSection.tsx
src/components/collaboration/workspace/WorkspaceQuickAccess.tsx
src/components/collaboration/workspace/workspacePresentation.ts
src/services/collaboration/workspaceAttachmentService.ts
src/domain/collaboration/workspaceAttachment.ts
src/services/collaboration/workspaceInviteService.ts
src/services/collaboration/workspaceService.ts
src/components/layout/AppShell.tsx
src/components/layout/MainLayout.tsx
src/components/layout/Sidebar.tsx
src/components/layout/MobileNavBar.tsx
src/components/layout/modals/FeatureModals.tsx
src/context/NavigationContext.tsx
src/hooks/features/useNavigationController.ts
src/hooks/useOpenCollaborationWorkspace.ts
src/hooks/useJourneyPhase.ts
src/constants/layout.ts
src/index.css
src/collaboration/guestGate.ts
src/components/layout/ModalManager.tsx
```

### 15.3 File eliminati

```
src/components/modals/WorkspacesModal.tsx
src/components/collaboration/workspace/CollaborationWorkspacePanelBody.tsx
src/components/collaboration/workspace/WorkspaceAttachmentsSection.tsx
src/components/workspace/global/sections/WorkspaceSectionPlaceholder.tsx
```

---

## 16. Piano di sviluppo — FASI

> **Fonte unica** dello stato di avanzamento per fase (obiettivi, completamento, criteri). La sezione «Stato implementazione» in testa al documento rimanda qui.

---

### FASE 0 — Documentazione e preparazione

**Stato:** ✅ **COMPLETATA** (9 luglio 2026)

**Obiettivo:** Costanti layout e baseline documentale.

**File coinvolti:**
- `docs/collaboration/GLOBAL_WORKSPACE_PANEL.md`
- `src/constants/workspacePanelLayout.ts`
- `src/index.css` (CSS vars `--workspace-panel-height`, `--workspace-binder-tab-height`, `--mobile-nav-height`)

**Completato:**
1. Documento approvato e mantenuto come SSOT.
2. Costanti: `WORKSPACE_GLOBAL_PANEL_HEIGHT = '17.5rem'`, `WORKSPACE_GLOBAL_PANEL_WIDTH_RATIO = 0.95`, `WORKSPACE_BINDER_TAB_HEIGHT`.
3. CSS vars in `:root` allineate a `workspacePanelLayout.ts`.

**Note:** `layout.ts` non duplica le costanti workspace (SSOT = `workspacePanelLayout.ts`).

**Criteri di completamento:**
- [x] Costanti layout definite
- [x] CSS vars verificabili in DevTools
- [x] Documento committato e versionato

---

### FASE 1 — Infrastruttura pannello e rimozione modale

**Stato:** ✅ **COMPLETATA** (9 luglio 2026)

**Obiettivo:** Apertura diretta del pannello; eliminazione `WorkspacesModal`; stato hub via `WorkspacePanelProvider`.

**Completato:**
1. `GlobalWorkspacePanel`: portal, geometry 95%, lifecycle binder, `max-height` top-origin.
2. `WorkspacePanelProvider` + `useWorkspacePanelState` in `WorkspacePanelContext.tsx` (montato in `AppCoordinator`).
3. Deep link consume-once: `modalProps.workspaceId` → attivo + `condivisione`.
4. `WorkspaceHost`: `collaborationWorkspace` senza `workspaceId` obbligatorio.
5. `WorkspacesModal` eliminata; entry point → `openModal('collaborationWorkspace')`.
6. `workspaceUsesCompanionPortal()` → `false` per `collaborationWorkspace`.
7. `workspaceSessionRegistry` + `useWorkspaceSessionEnd`: chiusura animata → `closeModal`.
8. Persistenza workspace attivo tra chiusure pannello (D27).

**Criteri di completamento:**
- [x] Flusso modale rimosso
- [x] Shell apre/chiude correttamente
- [x] Stato workspace attivo gestito (con persistenza documentata)

---

### FASE 2 — Linguetta sidebar, animazione binder e bottom nav tablet

**Stato:** ✅ **COMPLETATA** (9 luglio 2026)

**Obiettivo:** Linguetta nello slot Workspace della sidebar; animazione raccoglitore top-origin; fix bottom nav tablet.

**Completato:**
1. `WorkspaceBinderTab` in `#tour-sidebar-buttons` col 1.
2. Community e Around Me invariati (col 2–3).
3. `GlobalAppNavStrip` / `workspaceChrome` assenti.
4. Animazione: `binderPanelMaxHeightClass` + `BINDER_PANEL_TRANSITION_CLASS` (no `translate-y-full`).
5. Tablet/mobile: `bottom: var(--mobile-nav-height)`, `isUiVisible` forzato con pannello aperto.

**Criteri di completamento:**
- [x] Layout Home invariato (nessuna nuova barra)
- [x] Metafora raccoglitore rispettata
- [x] Bottom nav tablet corretta

---

### FASE 3 — Sezione Workspace, navigazione e ingresso in Condivisione

**Stato:** ✅ **COMPLETATA** (9 luglio 2026)

**Obiettivo:** Barra sezioni; tab Workspace completa; auto-navigazione a Condivisione; context bar; Condivisione e Attività.

**Completato:**
1. `WorkspaceSectionNav`: 6 voci; redirect sezioni operative senza workspace attivo.
2. `WorkspaceSection` + `WorkspaceCard`: Owner/Member, empty state, metadati, evidenziazione attivo, Crea Workspace.
3. Click card → `selectWorkspace` → Condivisione automatica.
4. `WorkspaceActiveContextBar` in sezioni operative.
5. `CondivisioneSection` (hub, no moduli futuri) + `AttivitaSection` (feed hub).
6. `formatRelativeActivity` su `updatedAt`.

**Criteri di completamento:**
- [x] Pipeline §3 rispettata
- [x] Tab Workspace, Condivisione, Attività funzionali
- [x] Context bar operativo

---

### FASE 4 — Utenti, Inviti, Abbandona, Elimina, Utenti Bloccati

**Stato:** ✅ **COMPLETATA** (9 luglio 2026)

**Obiettivo:** Tab Utenti completa; tab Inviti; comandi Abbandona/Elimina; Utenti Bloccati via inviti.

**Completato:**
1. `UtentiSection`: Proprietario, Membri, Invita, Invitati, Utenti Bloccati (via `revoked`).
2. `leaveWorkspace` + modale Abbandona; `deleteWorkspace` + testo modale §7.1.1.
3. `InvitiSection`: lista pending, accetta/rifiuta; **accetta** → `selectWorkspace` + Condivisione.
4. `removeWorkspaceMember` traccia ex-membri come inviti `revoked` (C5).
5. Cambio workspace: altra card → Condivisione.

**Criteri di completamento:**
- [x] Tab Utenti e Inviti funzionali
- [x] Abbandona ed Elimina conformi
- [x] Utenti Bloccati via modello inviti
- [x] Post-accettazione invito con ingresso area lavoro

---

### FASE 5 — Allegati (5 categorie operative)

**Stato:** ✅ **COMPLETATA** (9 luglio 2026)

**Obiettivo:** Tutte le sotto-sezioni allegati operative con categoria DB.

**Completato:**
1. Migration `20260709180000_workspace_attachment_category.sql`: enum + colonna + backfill `misc`.
2. `workspaceAttachmentService`: `listWorkspaceAttachments(workspaceId, category?)`, `uploadWorkspaceAttachment(..., category)`.
3. `AllegatiSection` + `AllegatiCategoryPanel`: 5 categorie con upload/list/delete/download.
4. Context bar workspace attivo visibile (via `GlobalWorkspacePanelBody`).
5. `WORKSPACE_FUTURE_MODULES` rimosso da `workspacePresentation.ts`.

**Criteri di completamento:**
- [x] 5 sotto-sezioni pienamente operative
- [x] Migration applicata
- [x] §7.3 rispettato

---

### FASE 6 — Polish, accessibilità e cleanup

**Stato:** ✅ **COMPLETATA** (9 luglio 2026)

**Obiettivo:** Refinement visivo; cleanup codice legacy; aggiornamento AI_CONTEXT.

**Completato:**
1. Nav sezioni e linguetta: a11y (`aria-expanded`, `role="tablist"`, ESC via focus layer).
2. Card workspace: evidenziazione attivo (bordo, ring, badge Design System).
3. `CollaborationWorkspacePanelBody` e `WorkspaceAttachmentsSection` legacy **eliminati**; `CollaborationWorkspacePanel` = alias `GlobalWorkspacePanel`.
4. `AI_CONTEXT/28_COLLABORATION_WORKSPACE_SYSTEM.md` aggiornato con link a questo documento.
5. `WorkspaceSectionPlaceholder` rimosso; nessun placeholder Allegati.
6. `workspaceDim` (§14.1): **invariato** (60% + blur).

**Criteri di completamento:**
- [x] Nessun dead code panel vecchio
- [x] Tutti gli stati UX §4 coperti (con persistenza D27)
- [x] AI_CONTEXT aggiornato

---

## Appendice A — Mappa tab attuale → nuova

| Tab attuale | Nuova destinazione |
|-------------|-------------------|
| `resources` | **Condivisione** |
| `members` | **Utenti** → Membri |
| `invites` (inviati) | **Utenti** → Invitati al Workspace |
| `activity` | **Attività** |
| `attachments` | **Allegati** → 5 categorie |
| — | **Workspace** (gestione/selezione) |
| — | **Inviti** (ricevuti) |
| Moduli futuri | **Allegati** (categorie) |

---

## Appendice B — Comando di ripresa sviluppo

```
Procedi con la Fase N del documento docs/collaboration/GLOBAL_WORKSPACE_PANEL.md
```

Sostituire `N` con 0–6. Verificare criteri di completamento fase N-1.

---

*Fine documento — v1.4*
