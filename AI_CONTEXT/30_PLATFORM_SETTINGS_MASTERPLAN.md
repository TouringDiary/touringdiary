# DOC 30: Centro di Controllo — Platform Settings Masterplan (SSOT)

> **Single Source of Truth (SSOT)** per il **Centro di Controllo** e la configurazione operativa globale di TouringDiary.
> **Non appartiene al dominio Sponsor** né al futuro dominio Messaggistica — governa feature flags, testi, soglie, manutenzione e audit trasversali.
> **Nessuna implementazione inizia finché lo stato non è *Pronto per Implementazione*.**

---

## Ownership del Centro di Controllo

Questo documento è il **proprietario esclusivo** della configurazione operativa della piattaforma.

| Principio | Regola |
|-----------|--------|
| **Proprietà** | Feature Flags, soglie operative, testi configurabili gestiti dal Centro di Controllo, audit delle modifiche, programmazione toggle — **solo qui** |
| **Consumer** | Sponsor, AI, Community, Messaggistica (futura), Economia e ogni altro dominio **consumano** le configurazioni — non le possiedono |
| **Feature Flags** | **Nessun dominio** definisce o possiede direttamente le proprie flag; eventuali requisiti di dominio (es. «candidature sponsor sospese») si traducono in voci del registry **Centro di Controllo**. **Eccezione strutturale (DL-P12):** capacità di piattaforma non opzionali (es. Collaboration / Workspace) **non** diventano Feature Flag CC |
| **Anti-pattern** | Vietato duplicare in DOC 29 o in futuri SSOT di dominio la logica di ownership di flag, soglie o testi operativi globali |

I domini referenziano il Centro di Controllo per *cosa è abilitato*; restano proprietari di *come funziona* il proprio perimetro.

---

## Stato del documento

| Campo | Valore |
|-------|--------|
| **Versione** | 0.3.16 |
| **Ultima revisione** | 2026-07-22 |
| **Stato** | Implementazione in Corso |
| **Percorso SSOT** | `AI_CONTEXT/30_PLATFORM_SETTINGS_MASTERPLAN.md` |
| **UI Admin (nome definitivo PO)** | **Centro di Controllo** — **non rinominare** (DL-P02, conferma 2026-07-14) |
| **Prossimo passo** | Collaudo residui Audit B (T16 Post community, T20 Programmazioni) → Audit A → Validazione PO STEP-3 |

### Naming (decisione PO — DL-P02)

| Voce | Ruolo |
|------|-------|
| **Centro di Controllo** | Hub operativo: feature flags, testi, soglie, manutenzione, audit — footer Admin sotto **Utenti & Ruoli** |
| **Impostazioni Globali** | **Invariato** — gruppo Sistema: Design System, Foundation, Categorie POI, Integrazioni Partner, Workspace |

---

## Obiettivo

Definire **prima dell'implementazione**:

1. Il **Centro di Controllo** come hub di **configurazione operativa** (macro-sezioni con sotto-configurazioni indipendenti — DL-P07).
2. Un **sistema Feature Flags** scalabile (manuale, programmato, override, audience) — **non** solo booleani: anche testi, banner, avvisi, messaggi disabilitazione (DL-P07).
3. Manutenzione via **News Bar** esistente — messaggio fisso + altre news in scorrimento (DL-P06).
4. Audit completo di ogni modifica.
5. Separazione netta da DOC 29 (Sponsor), **AI Control Center** (on/off — DL-P08), futuro dominio Messaggistica.

---

## Perimetro e confini SSOT

### In scope (DOC 30)

| Area | Responsabilità DOC 30 |
|------|----------------------|
| Centro di Controllo UI | Macro-sezioni + sotto-sezioni configurabili indipendentemente (DL-P07) |
| Feature Flag Engine | Schema, categorie, scheduling, audience, default |
| Testi / banner / avvisi operativi | Message Template Source — messaggi disabilitazione funzioni, manutenzione, descrizioni |
| Soglie globali trasversali | Es. rating alert Sponsor (valore), non logica calcolo |
| Modalità manutenzione | Orchestrazione messaggio **fisso** in News Bar (DL-P06) |
| Audit modifiche Centro di Controllo | Chi, quando, prima/dopo |
| Programmazione automatica toggle | Window temporali + override manuale |

### Fuori scope (altri SSOT / Workflow)

| Area | Documento / Workflow |
|------|----------------------|
| Lifecycle, sicurezza, CRM layout Sponsor | `29_SPONSOR_SECURITY_MASTERPLAN.md` |
| Motore conversazioni | **Futuro WF + SSOT Messaggistica** (post G-MSG-1) — escluso WF-02 |
| **Privacy avanzata** (gestione compliance estesa) | **Futuro WF-03** — escluso WF-02 (DL-P09) |
| Design System, asset, taxonomy | **Impostazioni Globali** |
| **AI Control Center** — attiva/disattiva AI | **Strumento separato** — non unificato in Centro di Controllo (DL-P08) |
| Economia crediti AI, pricing dettaglio | `04_PROJECT_PRICING_MAP.md` + AI Control Center |
| Moderazione (macro CC: flag, non workflow) | `27_USER_REVIEW_SYSTEM.md` per workflow recensioni; CC espone **solo** i 4 flag sotto — **nessun** interruttore unico «Moderazione Contenuti» |

### Principio di separazione (audit architetturale)

```
Centro di Controllo (DOC 30)     →  COSA è configurato (flag, testi, soglie, schedule)
AI Control Center (separato)     →  Attiva / Disattiva AI (on/off operativo — DL-P08)
Dominio Sponsor (DOC 29)         →  COME funziona contratto, pipeline, permessi business
Dominio Messaggistica (futuro)   →  COME funzionano thread e messaggi
```

Il Centro di Controllo **non implementa** logica di dominio; **configura** e **governa** l'accesso.

### Configuration Source (astrazione architetturale)

Il documento **non dipende** dalla tabella `global_settings`. Le configurazioni strutturate (flag, soglie, schedule, metadati legali) sono modellate come **Configuration Source** — interfaccia logica indipendente dal backend.

| Aspetto | Descrizione |
|---------|-------------|
| **Implementazione attuale** | Tabella PostgreSQL `global_settings` (`key` → `value` JSON), accesso via `settingsService` / `ConfigContext` |
| **Evoluzioni possibili** | Registry dedicato `feature_flags`; store chiave-valore esterno; cache distribuita; API config dedicata — **senza** modificare il modello architetturale di questo SSOT |
| **Chiavi logiche** | Identificatori stabili (es. `feature.ai.users`, `threshold.sponsor_rating_alert_stars`) indipendenti dalla tabella fisica |

Analogamente, i testi UI configurabili usano **Message Template Source** (implementazione attuale: `system_messages` + `communicationService`); stessa regola di indipendenza dal dettaglio storage.

Nelle tabelle sezioni: colonna **Configuration Source** = chiavi logiche; colonna **Message Template Source** = chiavi messaggio.

---

## Gate progettuali

| ID | Gate | Condizione | Blocca |
|----|------|------------|--------|
| **G-CC-1** | Pronto per Implementazione DOC 30 | DoD-P1–P8 soddisfatti | Qualsiasi codice Centro di Controllo |
| **G-MSG-1** | Messaggistica unificata | Vedi DOC 29 — sequenza obbligatoria 1→5 | Implementazione motore chat (WF futuro) |
| **G-AI-SEP** | Separazione AI Control Center | PO: **non** unificare con Centro di Controllo (DL-P08) | ☑ Risolto — restano due strumenti |

**Nota:** il gate **G-AI-MERGE** (unificazione) è **superato** da DL-P08 (2026-07-14). Non applicare convergenza UI AI in WF-02.

**Sequenza G-MSG-1 (registrata anche in DOC 29):**

1. Risolvere approvazione Sponsor (403 / RPC gateway).
2. Completare dominio Sponsor (implementazione unica DOC 29).
3. **Stop** — nessun lavoro su chat unificata.
4. Review UI messaggistica completa con PO.
5. Solo dopo → sviluppo motore messaggistica (dominio autonomo).

---

## Centro di Controllo — struttura (macro-sezioni PO — DL-P07)

**Nome UI:** **Centro di Controllo** — immutabile (DL-P02).

**Posizione menu:**

```
Footer Admin Panel
├── Dashboard Generale
├── Utenti & Ruoli
├── Centro di Controllo
└── Torna all'App
```

**Principio organizzativo (PO 2026-07-14):** macro-sezioni con **sotto-configurazioni indipendenti**. **Vietato** un unico interruttore che spegne intere aree se esistono sotto-leve distinte (es. AI Guest vs AI Utente vs AI Admin All vs AI Admin Limited).

Il Centro di Controllo gestisce **booleani, testi, banner, avvisi, messaggi disabilitazione, descrizioni, manutenzione** — tutto editabile senza deployment.

**Organizzazione UI (PO 2026-07-17; layout banner 2026-07-19):** il Centro di Controllo **non** è una lunga pagina verticale. La shell operativa è:

1. **Header pagina** (titolo Centro di Controllo + riepilogo operativo)
2. **TAB di navigazione** (mobile-first, scroll orizzontale)
3. **Banner introduttivo della TAB** (icona + titolo + descrizione funzionale di **sezione**)
4. **Contenuto operativo della TAB** (card Feature Flag e/o pannelli dedicati)

| TAB UI | Contenuto operativo |
|--------|---------------------|
| **AI** | Card Feature Flag AI (+ messaggi sulla card) |
| **Comunicazioni** | Card Feature Flag chat/notifiche (+ messaggi sulla card) |
| **Sponsor** | Card Feature Flag/soglie sponsor (+ messaggi sulla card) |
| **Moderazione** | Card Feature Flag moderazione (+ messaggi sulla card) |
| **Manutenzione** | Card superiori in grid responsive (Manutenzione, Registrazione, Onboarding, **Programmazioni in pausa**) + **Programmazione automatica** a tutta larghezza sotto (non TAB separato) |
| **Info Globali** | Solo testi **globali** piattaforma (non messaggi di singolo flag) |
| **Storico Audit** | Lettura audit, export CSV, eliminazione singola e svuota storico (`admin_all`) |

**Responsabilità UI e Source of Truth (unica definizione):**

| Elemento | Cosa comunica | Dove vive il testo (SoT) |
|----------|---------------|---------------------------|
| **Banner TAB** | Descrizione funzionale dell’**intera sezione** | `PLATFORM_CONTROL_TAB_COPY` (solo admin UI) |
| **Card Feature Flag — help** | Descrizione amministrativa del **singolo interruttore** (effetto ON/OFF) | `PLATFORM_FEATURE_FLAG_ADMIN_HELP` (solo admin) |
| **Card Feature Flag — messaggio utente** | Testo visto dall’utente quando la funzione è OFF/bloccata | **Message Template → DB `system_messages`** (DL-P13) — unica SoT |
| **Pannelli** (Manutenzione, Info Globali, Storico Audit, Programmazione, …) | Controlli dell’area; testi globali / manutenzione | Controlli nel pannello; messaggi utente → **DB** |
| **Catalogo TS `PLATFORM_*_MESSAGE_CATALOG`** | Seed editor / chiavi note / bootstrap se DB assente | **Non** è SoT runtime. Solo fallback tecnico di bootstrap |

**Principio messaggi utente (DL-P13 — definitivo):**  
Centro di Controllo → Message Template → Database = **unica** Source of Truth per tutto ciò che l’utente vede. Vietato usare il catalogo TypeScript come sorgente runtime dei messaggi utente. Hardcoded ammessi solo per log, debug, commenti, errori tecnici interni, e fallback bootstrap minimo.

**Regole correlate:**
- **Card autosufficienti (PO 2026-07-17):** stato funzione, messaggio utente, motivazione e salvataggio messaggio si gestiscono **sulla card** — non in una sezione messaggi separata per quel flag.
- `PlatformMessageTemplateCatalogEntry.description` descrive **solo** lo scopo del **template messaggio**, non l’interruttore. **Non** riusarlo al posto di `PLATFORM_FEATURE_FLAG_ADMIN_HELP`.
- I testi SoT utente **non** vanno duplicati come stringhe runtime nei componenti UI (salvo fallback bootstrap).

### Matrice permessi Centro di Controllo (DoD-P3 — PO 2026-07-14)

| Macro-sezione | `admin_all` | `admin_limited` |
|---------------|-------------|-----------------|
| Tutte le macro-sezioni | Scrittura | Lettura (consultazione; no modifica configurazione globale) |
| Manutenzione ON/OFF | Scrittura | Lettura |
| Kill switch / emergenza AI (se esposto in CC) | Scrittura + motivazione | Lettura |
| Storico audit | Lettura + export + eliminazione / svuota | Lettura |

**Regola:** gestione ruoli (`admin_all` / `admin_limited`) resta in **Utenti & Ruoli** — non nel Centro di Controllo (allineamento DL-027 DOC 29).

---

### Macro-sezione — AI

**Nota:** **AI Control Center** (strumento separato — DL-P08) resta per **Attiva/Disattiva** rapido. Il Centro di Controllo configura **granularità e messaggi**.

| Sotto-sezione | Configurazioni indipendenti (esempio) | Configuration Source (logiche) |
|---------------|--------------------------------------|--------------------------------|
| **AI Acquisto** | Acquisto crediti ON/OFF; messaggio pausa | `feature.economy.credit_purchase`, … |
| **AI Utilizzo** | AI Guest ON/OFF; AI Utente ON/OFF; AI Admin All ON/OFF; AI Admin Limited ON/OFF | `feature.ai.guest`, `feature.ai.users`, `feature.ai.admin_all`, `feature.ai.admin_limited` |
| **AI Admin** | Rigenerazione city; tool admin-specifici | `feature.ai.admin.*` (registry estensibile) |

**Message Template Source:** `ai_disabled_guest`, `ai_disabled_user`, `ai_disabled_admin`, `ai_disabled_admin_limited`, `ai_emergency_notice`, …

---

### Macro-sezione — Comunicazioni (UI TAB; catalogo storico «Chat»)

| Sotto-sezione | Configurazioni | Note |
|---------------|----------------|------|
| Admin ↔ Partner | `feature.comms.admin_partner` | Consumer messaggistica futura |
| Utente ↔ Sponsor | `feature.comms.user_sponsor` | Fase 1 OFF (DOC 29 D17) |
| Notifiche | `feature.comms.notifications` | |

**Testi:** messaggi quando chat disabilitata → **sulla card** del Feature Flag. Disclosure privacy CRM → TAB **Info Globali** (testi operativi, non privacy avanzata WF-03).

---

### Macro-sezione — Monetizzazione

| Sotto-sezione | Configurazioni |
|---------------|----------------|
| Crediti / Stripe | Kill switch acquisto; messaggi pausa |
| Abbonamenti | Flag upgrade piano |

*Dettaglio pricing → `04_PROJECT_PRICING_MAP.md`.* *In UI TAB, i flag economia rilevanti vivono sotto **AI** / catalogo; non è un TAB top-level separato.*

---

### Macro-sezione — Feature Flag (registry)

Meta-gestione: categorie, `supports_schedule`, `supports_audience`, defaults globali. Non duplica toggle di dominio — li registra. *Non è un TAB top-level della UI operativa.*

---

### Macro-sezione — Sponsor (operativo)

| Configurazione | Key logica |
|----------------|------------|
| Nuove candidature ON/OFF | `feature.sponsor.applications` |
| Soglia rating alert (stelle) | `threshold.sponsor_rating_alert_stars` (default 3) |
| Shop pubblici | `feature.sponsor.shop_public` |

Logica alert UI → DOC 29 DL-030; soglia numerica → qui.

---

### Macro-sezione — Moderazione

TAB **Moderazione** del Centro di Controllo. **Non esiste** un Feature Flag singolo chiamato «Moderazione Contenuti».

Flag UI reali (tutti distinti):

| Nome UI | Key | Collaudo Audit B |
|---------|-----|------------------|
| Recensioni utenti | `feature.moderation.reviews` | T13 |
| Upload foto | `feature.moderation.photos` | T14 |
| Segnalazioni utenti | `feature.moderation.suggestions` | T15 |
| Post community | `feature.moderation.community_posts` | T16 |

Dettaglio audience/schedule/messaggi → catalogo § sotto.

---

### Macro-sezione — Info Globali (evoluzione di «Testi e messaggi»)

TAB **Info Globali**: contiene **esclusivamente** informazioni realmente globali della piattaforma (es. disclosure CRM, registrazione chiusa). Dove editare messaggi di flag vs globali → tabella in **Organizzazione UI** (e riga «Messaggio legato a un Feature Flag» sotto).

| Tipo messaggio | Dove si edita |
|----------------|---------------|
| Messaggio legato a un Feature Flag (disabilitazione funzione) | **Card** del flag (autosufficiente) |
| Messaggio / testo globale piattaforma | TAB **Info Globali** |

**Escluso:** privacy avanzata / compliance estesa → **WF-03**.

---

### Macro-sezione — Manutenzione (DL-P06)

| Aspetto | Regola PO |
|---------|-----------|
| **UI attivazione** | Centro di Controllo → TAB **Manutenzione** → ON/OFF + messaggio |
| **News Bar utente** | **Non sparisce**; messaggio manutenzione **fisso** dentro la barra |
| **Altre news** | Continuano a scorrere normalmente |
| **Vietato** | Nuovi banner; modalità esclusiva che sopprime tutte le news |
| **Programmazione automatica** | Integrata **nello stesso TAB Manutenzione** — **non** sezione/TAB autonoma del Centro di Controllo |

**Oggi CRUD ticker:** Admin → **Community** → **News Ticker** (`NewsTickerManager`) — resta per contenuti generali; CC orchestra solo item manutenzione prioritario/fisso.

#### Programmazione automatica (sotto Manutenzione)

Schedule per flag con `supports_schedule: true`; finestre temporali **assolute** (nessuna ricorrenza/cron). Priorità runtime: **override manuale → programmazione → default** (DL-P04). L'override manuale **mantiene sempre la priorità** sulla programmazione.

**Layout TAB Manutenzione:** card superiori in grid (Manutenzione · Registrazione · Onboarding) — 3 col desktop / 2 tablet / 1 mobile; sezione **Programmazione automatica** sotto a tutta larghezza con **Programmazioni in pausa** nell’header (titolo a sinistra, controllo a destra; su mobile il controllo sotto il titolo).

**Storico finestre:** le programmazioni **non spariscono** a fine finestra né al cambio TAB; restano sempre visibili finché non eliminate. Stati UI riga: **In attesa · Attiva · In pausa · Eseguita · Disabilitata · Errore**. Ordinamento a schermo: Attiva → In attesa → In pausa → Eseguite (non altera l’ordine persistito usato per overlap).

**Semantica ON/OFF (programmazione di fermo — PO 2026-07-22):** il campo ON/OFF della riga **non** è lo stato del Feature Flag. È lo stato della **programmazione**:
- **ON** = programmazione attiva → allo scattare della finestra la funzionalità viene **temporaneamente fermata** (il motore applica `value: false` sullo strato schedule, DL-P04 invariato);
- **OFF** = programmazione disattivata → resta salvata ma **ignorata** (`enabled: false`, saltata da `getActiveScheduleValue`).

Priorità runtime resta: **override manuale → programmazione (se abilitata e in finestra) → default** (DL-P04).

| Funzione | Comportamento |
|----------|---------------|
| **Programmazioni in pausa** (globale) | Tutte le programmazioni **restano salvate e visibili**; vengono **ignorate** finché la pausa è attiva |
| **Disattiva / elimina programmazioni** (per flag) | Svuota le finestre di quel flag |

---

### Macro-sezione — Storico Audit

Stream `platform_control_audit` (DL-P05). TAB UI dedicato **Storico Audit**.

| Capacità | Ruolo | Meccanismo |
|----------|-------|------------|
| Lettura tabella | `admin_all`, `admin_limited` | RLS `SELECT` (`platform_control_audit_admin_read`) |
| Export CSV | `admin_all` | Client (dati già letti) |
| Eliminazione singola voce | `admin_all` | RPC `delete_platform_control_audit_event(p_id)` |
| Svuota storico | `admin_all` | RPC `clear_platform_control_audit()` |

**Regola architetturale:** nessuna mutazione DELETE diretta dal client. Cancellazioni solo via RPC `SECURITY DEFINER` (stesso pattern di `mutate_platform_feature_flag`). La tabella resta senza policy DELETE lato `authenticated`.

---

### Sezioni Centro di Controllo — perimetro implementativo (DL-P10)

Tutte le **macro-sezioni già approvate** in questo SSOT (AI, Comunicazioni/Chat, Monetizzazione, Feature Flag registry, Sponsor operativo, Moderazione, Info Globali, Manutenzione con Programmazione, Storico Audit) sono **in scope** per **WF-02 STEP-3**. La **UI operativa** espone i TAB elencati sopra; Monetizzazione e registry restano concetti di catalogo/ownership senza TAB top-level dedicati.

**Nuove** macro-sezioni (es. Accesso, Workspace, Gamification, Territorio) si aggiungono **solo** quando nasce un nuovo dominio o esigenza progettuale — con nuovo SSOT/Workflow, non per espansione arbitraria v1.

| Sezione proposta (non ancora dominio) | Stato |
|---------------------------------------|-------|
| Accesso & Registrazione | Coperta da flag catalogo in macro **Piattaforma** — non sezione CC separata finché non richiesto |
| Collaborazione & Workspace | Dominio DOC 28 — capacità **strutturale** della piattaforma; **nessun** Feature Flag CC (DL-P12); fuori TAB dedicati CC v1 |
| Gamification | Dominio DOC 16/06 — fuori CC v1 dedicato |
| Territorio & Contenuti | Dominio territoriale — fuori CC v1 dedicato |

*Economia coperta da macro Monetizzazione.*

## Feature Flags — spiegazione funzionale (PO)

Una **Feature Flag** («interruttore di funzionalità») è un controllo centralizzato che permette agli amministratori di **accendere o spegnere** una parte della piattaforma **senza modificare il codice** e **senza pubblicare una nuova versione**.

| Concetto | Significato per il PO |
|----------|----------------------|
| **ON** | La funzionalità è disponibile per le audience configurate |
| **OFF** | La funzionalità è disattivata; l'utente vede un messaggio configurabile dove previsto |
| **Default** | Stato quando non c'è né programmazione attiva né override manuale |
| **Programmazione** | Finestre temporali assolute sul flag (es. spegni AI dalle 02:00 alle 04:00 di una data) |
| **Programmazioni in pausa** | Finestre salvate ma **non applicate** finché la pausa globale è attiva |
| **Override manuale** | «Accendi subito» anche se c'è una programmazione — **vince sempre** |
| **Audience** | A chi si applica: tutti, solo utenti registrati, solo partner, ecc. — **mai** `admin_all` |

**Perché un sistema unificato:** toggle sparsi creano incoerenza. Il **Centro di Controllo** configura granularità e messaggi; **AI Control Center** resta strumento separato on/off (DL-P08).

### Pianificazione Feature Flags per Workflow (DL-P11)

**Principio architetturale (catalogo evolutivo):** il catalogo Feature Flag rappresenta il **catalogo iniziale approvato** dal Product Owner. Nuovi Feature Flag potranno essere aggiunti **in qualsiasi momento** senza modificare la struttura del Centro di Controllo, senza modificare l'architettura del registry e **senza richiedere una revisione** del presente SSOT — salvo **modifiche strutturali** al modello (es. nuovo tipo di audience, cambio schema audit).

*In sintesi:* chiusa la **versione iniziale** approvata; **aperta** l'espansione continua — l'architettura è progettata per supportarla.

Catalogo v1 **approvato** — registry **estensibile**. Tutti i toggle sotto sono in perimetro implementativo WF-02.

| Key / gruppo | Workflow | STEP / nota |
|--------------|----------|-------------|
| `feature.ai.guest`, `feature.ai.users`, `feature.ai.admin_all`, `feature.ai.admin_limited`, `feature.ai.emergency` | **WF-02** | STEP-3 — macro AI (config CC); on/off rapido resta AI Control Center (DL-P08) |
| `feature.economy.credit_purchase`, `feature.economy.subscriptions` | **WF-02** | STEP-3 — Monetizzazione |
| `feature.comms.admin_partner`, `feature.comms.user_sponsor`, `feature.comms.notifications` | **WF-02** | STEP-3 — consumer chat; `user_sponsor` preparato OFF in STEP-2 Fase 5 |
| `feature.sponsor.applications`, `feature.sponsor.shop_public` | **WF-02** | STEP-3 + consumer DOC 29 |
| `threshold.sponsor_rating_alert_stars` | **WF-02** | STEP-3 — soglia; consumer STEP-2 Fase 6 |
| `feature.moderation.*` (reviews, photos, suggestions, community_posts) | **WF-02** | STEP-3 |
| `feature.platform.maintenance`, `registration`, `onboarding` | **WF-02** | STEP-3 |
| Message Template Source (`platform.*`, `sponsor.*`, `comms.*`, …) | **WF-02** | STEP-3 Fase 3.3 |
| Motore messaggistica unificato (consolidamento) | **WF futuro** | Post G-MSG-1 step 5 — non è un flag mancante |
| Privacy avanzata / compliance estesa | **WF-03** | DL-P09 — fuori WF-02 |

**Toggle approvati senza Workflow:** **nessuno** — tutti i flag del catalogo § sotto hanno destinazione WF-02 o WF-03 (privacy) o WF futuro messaggistica (dominio, non singolo flag).

### Decisioni PO — stato (DOC 30)

*Tutte le decisioni progettuali DOC 30 sono **chiuse**.*

---

### Dove vive la documentazione Feature Flags

| Fase | SSOT |
|------|------|
| **Ora → ~20 flag operativi** | **DOC 30** (sottosezione Feature Flag Engine) |
| **Futuro (>25 flag o team dedicato)** | Valutare `31_FEATURE_FLAGS_MASTERPLAN.md` — **non ora** |

**Raccomandazione:** registry estensibile in DOC 30 con categorie; estrarre DOC 31 solo quando il registry supera soglia o scheduling diventa dominio a sé.

---

## Feature Flag Engine — modello architetturale

### Schema logico (proposta — non implementare)

```json
{
  "key": "feature.ai.users",
  "category": "ai",
  "label": "AI per utenti registrati",
  "default": true,
  "supports_schedule": true,
  "supports_audience": true,
  "manual_override": null,
  "schedules": [],
  "audience": ["registered", "business"],
  "blocked_audiences": [],
  "message_key": "ai_disabled_user",
  "audit_required": true
}

**Runtime AI (PO 2026-07-22):** la selezione del flag non si basa sull’audience del record — `getAiRuntimeStatus` sceglie la chiave per profilo:

| Profilo | Feature Flag |
|---------|----------------|
| Non autenticato (utente guest) | `feature.ai.guest` |
| Utente registrato non-admin | `feature.ai.users` |
| Admin Limited | `feature.ai.admin_limited` |
| Admin All | `feature.ai.admin_all` |
```

### Risoluzione valore effettivo

```
effective = manual_override ?? (active_schedule?.value) ?? default
```

Se `user.audience` in `blocked_audiences` → flag valutato come OFF **eccetto** `admin_all` (sempre esente).

Quando `feature.platform.schedules_paused` è attivo, lo strato `active_schedule` è ignorato (le finestre restano salvate).

**Finestre di programmazione sovrapposte:** se più elementi di `schedules` contengono lo stesso istante, vince la **prima** finestra nell’ordine dell’array (nessun riordino cronologico). Runtime: `getActiveScheduleValue` in `evaluateFeatureFlag`.

### Audience — riutilizzabile

| Audience | Descrizione |
|----------|-------------|
| `public` | Visitatori non autenticati |
| `registered` | Utenti loggati (`user`) |
| `business` | Partner / business |
| `admin_limited` | Admin limitati |
| `admin_all` | Super admin — **mai bloccabile** |

**Raccomandazione:** framework audience **unico** per tutti i flag con `supports_audience: true`. Flag senza audience (es. manutenzione globale) si applicano a tutti tranne che per operazioni admin.

---

## Catalogo Feature Flags v1 (catalogo iniziale PO — DL-P11)

*Versione iniziale ☑. Vedi **Principio architetturale (catalogo evolutivo)** sopra — nuovi toggle ammessi senza revisione SSOT salvo modifiche strutturali.*

### Categoria — AI & Automazione (macro AI)

| Nome funzionale | Key | Macro | Note |
|-----------------|-----|-------|------|
| AI Guest | `feature.ai.guest` | AI → Utilizzo | Utenti guest non autenticati (`getAiRuntimeStatus`) |
| AI Utente | `feature.ai.users` | AI → Utilizzo | Utenti registrati non-admin |
| AI Admin All | `feature.ai.admin_all` | AI → Utilizzo | Tool admin super-admin |
| AI Admin Limited | `feature.ai.admin_limited` | AI → Utilizzo | Tool admin limitato |
| Acquisto crediti AI | `feature.economy.credit_purchase` | AI → Acquisto / Monetizzazione | |
| Stop emergenza AI | `feature.ai.emergency` | AI | Kill switch globale chiamate |

### Categoria — Comunicazione

| Nome funzionale | Key | Abilita/disabilita | Audience | Schedule | Override | Messaggio | Audit |
|-----------------|-----|-------------------|----------|----------|----------|-----------|-------|
| Chat Admin↔Partner | `feature.comms.admin_partner` | CRM messaggi sponsor | business, admin_* | Sì | Sì | `comms_partner_chat_disabled` | Sì |
| Chat Utente↔Sponsor | `feature.comms.user_sponsor` | Chat utente verso sponsor | registered | Sì | Sì | `comms_user_sponsor_disabled` | Sì |
| Notifiche in-app | `feature.comms.notifications` | Centro notifiche | registered | Sì | Sì | — | Sì |

### Categoria — Business & Sponsor

| Nome funzionale | Key | Abilita/disabilita | Audience | Schedule | Override | Messaggio | Audit |
|-----------------|-----|-------------------|----------|----------|----------|-----------|-------|
| Nuove candidature Sponsor | `feature.sponsor.applications` | Invio modulo Diventa Partner | public, registered | Sì | Sì | `sponsor_applications_paused` | Sì |
| Shop partner pubblici | `feature.sponsor.shop_public` | Vetrine shop in città | public | Sì | Sì | — | Sì |

### Categoria — Community & Moderazione

| Nome funzionale | Key | Abilita/disabilita | Audience | Schedule | Override | Messaggio | Audit |
|-----------------|-----|-------------------|----------|----------|----------|-----------|-------|
| Nuove recensioni *(label UI: Recensioni utenti)* | `feature.moderation.reviews` | Invio recensioni | registered | Sì | Sì | `moderation_reviews_paused` | Sì |
| Upload foto community *(label UI: Upload foto)* | `feature.moderation.photos` | Invio foto | registered | Sì | Sì | `moderation_uploads_paused` | Sì |
| Segnalazioni utenti | `feature.moderation.suggestions` | Modulo segnalazione POI | registered | Sì | Sì | — | Sì |
| Post community | `feature.moderation.community_posts` | Bacheca / live snaps | registered | Sì | Sì | — | Sì |

### Categoria — Piattaforma & Accesso

| Nome funzionale | Key | Abilita/disabilita | Audience | Schedule | Override | Messaggio | Audit |
|-----------------|-----|-------------------|----------|----------|----------|-----------|-------|
| Modalità manutenzione | `feature.platform.maintenance` | Messaggio **fisso** in News Bar + altre news scorrono (DL-P06) | tutti | Sì | Sì | `maintenance_ticker_message` | Sì + motivazione |
| Registrazione nuovi utenti | `feature.platform.registration` | Signup | public | Sì | Sì | `registration_closed` | Sì |
| Onboarding guidato | `feature.platform.onboarding` | Tour iniziale | registered | No | Sì | — | Sì |
| Premi Gamification | `feature.gamification.rewards` | Sblocco/riscatto premi catalogo (XP resta attivo; Export PDF fuori scope) | tutti | Sì | Sì | `gamification_rewards_frozen` | Sì |

### Categoria — Economia & Pagamenti

| Nome funzionale | Key | Abilita/disabilita | Audience | Schedule | Override | Messaggio | Audit |
|-----------------|-----|-------------------|----------|----------|----------|-----------|-------|
| Acquisto crediti AI | *(chiave unica — vedi AI → Acquisto)* | Checkout Stripe crediti | registered | Sì | Sì | `credits_purchase_paused` | Sì + motivazione |
| Abbonamenti premium | `feature.economy.subscriptions` | Upgrade piano | registered | Sì | Sì | — | Sì |

---

## Appendice A — Chiavi Message Template Source (v1 — approvato macro)

Vedi macro-sezioni sopra. Prefissi: `platform.*`, `sponsor.*`, `comms.*`, `ai.*`, `moderation.*`. *Testi legali/privacy avanzata → WF-03 (DL-P09).*

**Implementazione / SoT (DL-P13):** tabella **`system_messages`** (Database). Runtime e consumer leggono **solo** dal DB (via `useSystemMessage` / cache bootstrap). Il catalogo TypeScript (`PLATFORM_FLAG_MESSAGE_CATALOG`, `PLATFORM_GLOBAL_MESSAGE_CATALOG`) serve a: elenco chiavi note, seed editor, **fallback bootstrap** se la riga DB manca — **non** è Source of Truth equivalente al Database.

Help admin flag e copy TAB restano costanti TS (`PLATFORM_FEATURE_FLAG_ADMIN_HELP`, `PLATFORM_CONTROL_TAB_COPY`) — non sono messaggi utente.

Soglia rating (Configuration Source, non messaggio): chiave logica `threshold.sponsor_rating_alert_stars` (default `3`).

---

## Definition of Done

| ID | Criterio | Stato |
|----|----------|-------|
| **DoD-P1** | Naming Centro di Controllo validato PO | ☑ |
| **DoD-P2** | Catalogo Feature Flags v1 approvato PO | ☑ (DL-P07 macro + DL-P11 catalogo chiuso) |
| **DoD-P2b** | Messaggi utente: unica SoT Message Template → DB (DL-P13); catalogo TS non SoT runtime | ☑ (MSG-SOT 2026-07-20) |
| **DoD-P3** | Matrice permessi per sezione | ☑ (admin_all scrittura; admin_limited lettura — 2026-07-14) |
| **DoD-P4** | Modello scheduling + override documentato | ☑ |
| **DoD-P5** | Modello audience documentato | ☑ |
| **DoD-P6** | Regola manutenzione News Ticker approvata PO | ☑ (messaggio fisso + news scorrono — DL-P06) |
| **DoD-P7** | Schema audit definito | ☑ |
| **DoD-P8** | Gate G-AI-SEP / separazione AI Control Center | ☑ (DL-P08 — **non** unificare) |
| **DoD-P9** | Nessuna implementazione senza gate G-CC-1 | ☑ |

---

## Decision Log

**Regole di manutenzione (oltre a immutabilità voci):**

- Se una responsabilità documentata qui viene **trasferita** a un nuovo dominio SSOT, la voce DL **resta** nel Decision Log con nota: *«Responsabilità trasferita a `<path nuovo SSOT>` — vedi DL-xxx del documento destinatario»*. Non cancellare lo storico.

### DL-P01

**Data:** 2026-07-13 — **Decisione:** Creare SSOT DOC 30 separato da DOC 29.

### DL-P02

**Data:** 2026-07-13

**Decisione (PO):** La sezione operativa Admin si chiama **Centro di Controllo**. **Impostazioni Globali** resta invariata (Sistema).

**Motivazione:** Elimina ambiguità naming; hub operativo distinto da configurazione design/infrastruttura.

**Impatto:** Footer Admin; tutti i riferimenti «Impostazioni» operativi → Centro di Controllo.

### DL-P03

**Data:** 2026-07-13

**Decisione (PO):** Modalità manutenzione **senza nuovi banner** — riusa **News Ticker**.

**Motivazione:** Riutilizzo componente esistente; coerenza visiva.

**Impatto:** Orchestrazione da Centro di Controllo. *Regola modalità esclusiva (proposta audit 2026-07-13) **non adottata** — vedi DL-P06 (2026-07-14).*

### DL-P06

**Data:** 2026-07-14

**Decisione (PO):** In manutenzione: la **News Bar non sparisce**. Il messaggio manutenzione resta **fisso** all'interno della News Bar; le **altre news continuano a scorrere**. Nessun nuovo banner.

**Motivazione:** Visibilità manutenzione senza bloccare comunicazioni operative.

**Impatto:** Orchestratore ticker; sostituisce proposta «modalità esclusiva» pendente in DL-P03. DoD-P6 ☑.

### DL-P07

**Data:** 2026-07-14

**Decisione (PO):** **Centro di Controllo** organizzato in **macro-sezioni** (AI, Chat, Monetizzazione, Feature Flag, Sponsor, Moderazione, Testi, Manutenzione, …) con **sotto-configurazioni indipendenti**. Vietato interruttore unico che spegne intere aree se esistono sotto-leve (es. AI Guest / AI Utente / AI Admin All / AI Admin Limited separati). CC gestisce booleani **e** testi/banner/avvisi/messaggi disabilitazione **senza deployment**.

**Motivazione:** Granularità operativa; configurazione piattaforma centralizzata.

**Impatto:** Ristrutturazione § Centro di Controllo; DoD-P2 macro ☑.

### DL-P08

**Data:** 2026-07-14

**Decisione (PO):** **NON unificare** AI Control Center con Centro di Controllo. Restano **due strumenti**:

| Strumento | Ruolo |
|-----------|-------|
| **AI Control Center** | Attiva / Disattiva (on/off operativo) |
| **Centro di Controllo** | Gestione e configurazione piattaforma (flag granulari, testi, schedule) |

**Motivazione:** Separazione accensione rapida vs configurazione fine.

**Impatto:** Gate G-AI-MERGE **revocato**; G-AI-SEP ☑. WF-02 STEP-3: nessuna convergenza UI AI.

### DL-P09

**Data:** 2026-07-14

**Decisione (PO):** **Privacy avanzata** (gestione compliance estesa) **fuori WF-02** → anticipata **WF-03**. Messaggistica unificata resta fuori WF-02 (già G-MSG-1).

**Motivazione:** Perimetro WF-02 = Sponsor + Centro di Controllo operativo base.

**Impatto:** Sezione Privacy avanzata rimossa da scope implementazione WF-02; registrata in `01_EXECUTION_ROADMAP.md` §6 anticipazioni.

### DL-P10

**Data:** 2026-07-14

**Decisione (DEC-CC-SCOPE — PO):** Tutte le macro-sezioni **già approvate** in DOC 30 vanno implementate nel **Workflow previsto** (WF-02 STEP-3). Nuove sezioni CC solo con **nuovi domini/esigenze** progettuali — non espansione v1 arbitraria.

**Impatto:** § *Sezioni Centro di Controllo — perimetro implementativo*; WF-02 STEP-3 allineato.

### DL-P12

**Data:** 2026-07-20

**Decisione (PO — architetturale definitiva):** Il Feature Flag `feature.platform.collaboration_live` **non** deve essere implementato né cablato nel Centro di Controllo. La collaborazione (Workspace, condivisione, realtime, presenza, lock, sincronizzazione, ownership, UX) è una **capacità strutturale** della piattaforma, non una funzionalità opzionale attivabile/disattivabile dal CC.

**Motivazione:** Un toggle globale falserebbe il modello di dominio DOC 28 e confonderebbe ownership CC vs Collaboration.

**Impatto:**
- Flag rimosso dal catalogo Feature Flags v1 e dalla pianificazione WF-02 STEP-3;
- Batch 4 Post-3.4 (`collaboration_live`) **eliminato** — nessun wiring;
- La ricognizione DOC 28 resta obbligatoria come **audit architetturale finale** del dominio Collaboration (coerenza Workspace / condivisione / ruoli / realtime / lock / presenza / sync / ownership / UX) — **non** per decidere un Feature Flag;
- Successivo audit completo del Centro di Controllo (consumer ↔ flag realmente gestibili);
- Solo dopo entrambi gli audit, se senza criticità, chiusura STEP-3 → STEP-4.

**Nota:** `global_settings.collaboration_live_config` (timeout lock / heartbeat) resta Configuration Source di dominio DOC 28 / Impostazioni Globali Workspace — **non** è un Feature Flag CC.

### DL-P11

**Data:** 2026-07-14

**Decisione (DEC-CC-CATALOG — PO):** Tutti i Feature Flag e toggle **già approvati** fanno parte del perimetro implementativo. Catalogo **estensibile** per nuovi toggle senza ridisegnare architettura.

**Impatto:** § *Pianificazione Feature Flags per Workflow*; DoD-P2 ☑ definitivo. *Aggiornato 2026-07-20 (DL-P12):* `feature.platform.collaboration_live` **revocato** dal catalogo approvato.

### DL-P04

**Data:** 2026-07-13

**Decisione (PO):** Feature flags con: valore default, override manuale (prioritario), programmazione temporale, audience per tipologia utenza. `admin_all` mai bloccabile.

**Motivazione:** Flessibilità operativa senza deploy; sicurezza admin.

**Impatto:** Feature Flag Engine unificato; metadato `supports_schedule` / `supports_audience` per evitare rigidità.

### DL-P13

**Data:** 2026-07-20

**Decisione (PO — architetturale definitiva):** Tutti i messaggi destinati agli utenti sono governati dal Centro di Controllo tramite Message Template → Database come **unica Source of Truth**. I cataloghi TypeScript **non** sono Source of Truth runtime. Vietati messaggi utente hardcoded nel codice applicativo. Ammessi in codice solo: stringhe tecniche, log, errori interni, debug, commenti; fallback bootstrap solo se template DB assente.

**Impatto:** Consumer runtime → DB; catalogo TS = seed/editor/bootstrap; DoD-P2b; WF-02 MSG-SOT.

### DL-P14

**Data:** 2026-07-20

**Decisione (PO — Scheduler / SCH-STATUS-UI):** Ogni riga di programmazione nella UI mostra uno **stato runtime** aggiornato automaticamente: **In attesa · Attiva · In pausa · Eseguita · Disabilitata · Errore**. Le finestre terminate restano nello storico (non nascoste). ON/OFF riga = abilitazione della **programmazione di fermo** (non il valore del Feature Flag).

**Impatto:** SCH-STATUS-UI + semantica fermo; SoT collaudo `WF_02_AUDIT_B` §16 / §19 / T20.

### DL-P05

**Data:** 2026-07-13 · **Aggiornato:** 2026-07-22

**Decisione (audit):** Audit modifiche Centro di Controllo: obbligatori `actor`, `timestamp`, `value_before`, `value_after`. **Motivazione raccomandata** per: manutenzione, kill switch AI, modifiche legali.

**Gestione storico (PO 2026-07-22):** lo stream resta obbligatorio in scrittura sulle mutazioni di configurazione; l’amministratore `admin_all` può **eliminare** voci (singola o svuota totale) tramite RPC dedicate. Non è un soft-delete: la cancellazione è definitiva. `admin_limited` resta in sola lettura.

---

## Aggiornamenti al Masterplan

*Sessione 2026-07-14 — review PO:* DL-P06–P09; macro-sezioni CC; G-AI-SEP; DoD-P2/3/6/8 ☑.

*Sessione 2026-07-13 — v0.2.1:* Ownership; Configuration Source; Runtime Integration.

---

### Cronologia documento

| Versione | Data | Modifiche |
|----------|------|-----------|
| 0.3.16 | 2026-07-22 | Storico Audit gestibile: eliminazione singola + svuota via RPC admin_all; DL-P05 aggiornato; matrice permessi |
| 0.3.15 | 2026-07-22 | Programmazioni: semantica ON/OFF = abilitazione fermo (non valore FF); pausa in header Programmazione automatica; lista persistente al cambio TAB |
| 0.3.14 | 2026-07-22 | Programmazioni: stati UI (In attesa/Attiva/In pausa/Eseguita/Errore), storico sempre visibile, label «Stato programmato», cestino con persistenza immediata; layout grid TAB Manutenzione |
| 0.3.13 | 2026-07-22 | Moderazione: esplicito che non esiste FF unico «Moderazione Contenuti»; allineamento label UI (Recensioni utenti / Upload foto) vs catalogo |
| 0.3.12 | 2026-07-22 | Catalogo AI: `feature.ai.guest` (AI Guest) distinto da `feature.ai.users` (utenti registrati); runtime `getAiRuntimeStatus` |
| 0.3.11 | 2026-07-20 | DL-P13 rafforzato: catalogo TS ≠ SoT; DoD-P2b; Appendice A allineata |
| 0.3.10 | 2026-07-20 | DL-P13 Message Template unica SoT; DL-P14 stati riga Scheduler (backlog) |
| 0.3.9 | 2026-07-20 | DL-P12: revoca `feature.platform.collaboration_live` (collaborazione = capacità strutturale; nessun toggle CC) |
| 0.3.8 | 2026-07-19 | Rifinitura editoriale: responsabilità UI/SoT unificate in Organizzazione UI; Appendice A e Info Globali come riferimenti |
| 0.3.7 | 2026-07-19 | UI: banner introduttivo TAB; SoT descrizioni admin flag + copy TAB; distinzione help flag vs template messaggio; regola finestre schedule sovrapposte |
| 0.3.6 | 2026-07-17 | UI a TAB; card autosufficienti; Info Globali vs messaggi flag; Programmazione sotto Manutenzione; Programmazioni in pausa |
| 0.3.5 | 2026-07-17 | Fase 3.4: schedule assolute + pausa globale + disattiva; card flag con messaggio inline; DS AdminSectionCard; storico audit UI; post-3.4 audit consumer |
| 0.3.4 | 2026-07-17 | Prossimo passo → Fase 3.4; Message Template Source + manutenzione DL-P06 in STEP-3 Fase 3.3 |
| 0.3.3 | 2026-07-17 | Prossimo passo → Fase 3.3; stato Implementazione in Corso (post Fase 3.1–3.2) |
| 0.3.2 | 2026-07-14 | Principio catalogo evolutivo (espansione flag senza revisione SSOT) |
| 0.3.1 | 2026-07-14 | Chiusura DEC-CC-SCOPE/CATALOG: DL-P10–P11; pianificazione flag per WF |
| 0.3.0 | 2026-07-14 | Review PO: DL-P06–P09; macro-sezioni; AI separato; WF-03 privacy; DoD aggiornati |
| 0.2.1 | 2026-07-13 | Ownership; Configuration Source; Runtime Integration |
| 0.2.0 | 2026-07-13 | Centro di Controllo; sezioni complete; Feature Flag Engine; gate; manutenzione ticker |
| 0.1.0 | 2026-07-13 | Creazione SSOT |
