# DOC 29: Sponsor Security Masterplan (SSOT)

> **Single Source of Truth (SSOT)** dell'intero dominio Sponsor.
> Ogni analisi, verifica SQL, decisione architetturale e modifica roadmap deve essere registrata **solo qui**.
> **Nessuna implementazione inizia finché lo stato non è *Pronto per Implementazione*.**

---

## Ownership del dominio Sponsor

Questo documento è il **proprietario esclusivo** del dominio Sponsor.

| Principio | Regola |
|-----------|--------|
| **Proprietà** | Lifecycle contratti, pipeline admin, sicurezza (`sponsor_requests`, `sponsors`, subscriptions correlate), RPC gateway Sponsor, city lifecycle impatto sponsor, requisiti UI CRM Sponsor, audit operazioni admin Sponsor — **solo qui** |
| **Riferimenti ammessi** | Centro di Controllo (DOC 30), Messaggistica futura, AI, Community — **solo come consumer o dipendenze**, con link al SSOT proprietario |
| **Anti-pattern** | Vietato duplicare in questo file: ownership Feature Flags, storage messaggistica, configurazione AI globale, moderazione community — salvo **requisiti** che il dominio Sponsor impone ai consumer |
| **Trasferimento responsabilità** | Se una responsabilità esce dal perimetro Sponsor (es. motore messaggi → dominio Messaggistica), resta traccia nel Decision Log con puntamento al nuovo SSOT — vedi regole Decision Log |

Altri domini **non sostituiscono** questo documento per nulla che riguardi il contratto e la sicurezza Sponsor.

---

## Stato del documento

| Campo | Valore |
|-------|--------|
| **Versione** | 0.11.0 |
| **Ultima revisione** | 2026-07-14 |
| **Stato** | Implementazione in Corso |
| **Percorso SSOT** | `AI_CONTEXT/29_SPONSOR_SECURITY_MASTERPLAN.md` |
| **Prossimo passo** | WF-02 **STEP-2** — Fase 2.2 (RPC gateway richieste) |

### Perché *Pronto per Implementazione* (non è una contraddizione)

Questo documento elenca **gap tecnici reali** (B1–B10, voto sicurezza 3/10, Q1–Q9 in stato pre-fix). Lo stato ***Pronto per Implementazione*** indica che **analisi e governo del progetto sono completi**, non che il codice o il database siano già allineati al modello target.

| Condizione soddisfatta | Evidenza |
|------------------------|----------|
| Audit concluso | SQL Pack V1–V20; § *Verifiche pre-implementazione* ☑ |
| Progetto approvato | Decisioni PO chiuse; F1–F10 e piano Fasi 0–6 congelati; DL-031 |
| Debito implementativo accettato | B1–B10 coperti dal piano Fasi 1–6 — § *Problemi confermati* |
| Implementazione autorizzata | WF-02 STEP-1 chiuso; avvio STEP-2 Fase 2.1 |

I gap in tabella **non** invalidano questo stato: sono **input pianificati** dell'implementazione, da chiudere prima del passaggio a ***Implementato***.

### Legenda stati documento

| Stato | Significato |
|-------|-------------|
| **In Analisi** | Verifiche pre-implementazione o decisioni ancora aperte |
| **Pronto per Implementazione** | Verifiche **pre-implementazione** chiuse; decisioni approvate; architettura e piano congelati; Q1–Q9 documentate (stato pre-fix accettato) |
| **Implementazione in Corso** | Gate superato; lavoro in corso secondo checklist |
| **Implementato** | Dominio allineato al modello target; checklist completata |

### Regole di manutenzione

1. Aggiornare **Ultima revisione** e incrementare **Versione** ad ogni modifica significativa.
2. Spostare elementi da *Verifiche pre-implementazione* → *Verifiche completate* con data e esito; tracciare evidenze implementative in § *Verifiche ed evidenze — implementazione*.
3. Spostare elementi da *Decisioni ancora aperte* → *Decisioni già approvate* solo dopo approvazione esplicita.
4. Non iniziare implementazione finché dipendenze e verifiche non sono chiuse qui.
5. **Vietati workaround** (es. `GRANT UPDATE` per far funzionare il frontend attuale).
6. **Nessuna decisione solo in chat** — tutto passa da questo file.
7. Ogni decisione architetturale importante va registrata nel **Decision Log** (voce immutabile). Se una decisione cambia, si aggiunge una nuova voce che la sostituisce — non si modifica il testo delle voci precedenti.

---

## Metodologia SSOT (obbligatoria)

Da **2026-07-13**, questo documento è l'unica fonte di verità del dominio Sponsor.

| Regola | Descrizione |
|--------|-------------|
| Memoria permanente | Ogni scoperta, verifica, decisione, risoluzione problema |
| Gate implementazione | Stato = *Pronto per Implementazione* prima di qualsiasi codice/migration |
| Implementazione unica | Una sola ondata coerente; no fix parziali |
| No duplicazioni | Non replicare il contenuto in altri doc; solo riferimenti |
| Aggiornamento continuo | Ogni sessione di analisi termina con sezione *Aggiornamenti al Masterplan* |

### Formato obbligatorio fine analisi

Ogni futura analisi sul dominio Sponsor **deve terminare** con:

#### Aggiornamenti al Masterplan

- **Verifiche completate:** …
- **Verifiche ancora aperte:** …
- **Decisioni approvate:** …
- **Decisioni ancora aperte:** …
- **Problemi risolti:** …
- **Nuovi problemi individuati:** …
- **Checklist aggiornata:** …
- **Modifiche roadmap:** …

---

## Glossario

Termini ricorrenti in questo documento. Definizioni stabili per lettura a distanza di mesi.

| Termine | Definizione |
|--------|-------------|
| **SSOT** | *Single Source of Truth* — unica fonte ufficiale di verità. Per il dominio Sponsor: questo file (`29_SPONSOR_SECURITY_MASTERPLAN.md`). |
| **RPC Gateway** | Modello in cui le mutazioni sensibili non usano CRUD diretto su tabelle, ma funzioni SQL (`SECURITY DEFINER`) invocate via `supabase.rpc()`, con guard e validazioni interne. |
| **CRUD** | Create, Read, Update, Delete — operazioni PostgREST esposte da Supabase su tabelle (`select`, `insert`, `update`, `delete`). |
| **RLS** | *Row Level Security* — policy PostgreSQL che filtrano righe per ruolo/utente; si applica dopo i GRANT tabella. |
| **GRANT** | Privilegio PostgreSQL a livello tabella o funzione (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `EXECUTE`). |
| **SECURITY DEFINER** | Funzione SQL eseguita con i privilegi del proprietario, non del chiamante; bypassa RLS sulle tabelle toccate internamente. Richiede guard esplicite. |
| **SECURITY INVOKER** | Funzione SQL eseguita con i privilegi del chiamante; RLS si applica normalmente. |
| **EXECUTE** | Privilegio per invocare una funzione/RPC. Distinto dai GRANT su tabelle. |
| **State Machine** | Insieme di stati ammessi e transizioni valide (es. `pending` → `waiting_payment` → `converted`). Qui enforceata nelle RPC, non nel client. |
| **Partner Scoped** | Operazione consentita solo al partner proprietario del record (es. `profile_id = auth.uid()`), con `WITH CHECK` su INSERT. |
| **Gate** | Condizione oggettiva che blocca l'avanzamento (es. passaggio a *Pronto per Implementazione* solo se Definition of Done soddisfatta). |
| **SQL Pack** | Query di sola lettura in Appendice B (etichette **B1–B7**), da eseguire su Supabase remoto per verificare grants, RLS, policy, RPC. *Distinto dagli ID problema **B1–B10** in Problemi confermati.* |
| **Write Gateway** | Sinonimo operativo di RPC Gateway nel perimetro Sponsor: unico canale per mutazioni admin/business. |
| **Minimo privilegio** | Principio: ogni ruolo/client ha solo i permessi strettamente necessari; no `GRANT UPDATE` “per comodità”. |
| **Decision Log (DL-xxx)** | Registro cronologico immutabile delle decisioni architetturali; voci sostituite solo da nuove voci, mai riscritte. |
| **Perimetro Sponsor** | Ambito del masterplan: `sponsor_requests`, `sponsors`, `sponsor_messages`, subscriptions correlate, RPC/trigger sponsor, cross-write shop/city che toccano sponsor. |
| **Motore messaggistica unificato** | Dominio **autonomo** riutilizzabile da tutta la piattaforma. Sponsor **consuma** il servizio — non lo possiede. Una conversazione per Sponsor; UI diversa admin vs partner. Vedi O2, DL-018, DL-024, Gate G-MSG-1. |
| **Centro di Controllo** | Hub operativo piattaforma (DOC 30) — feature flags, testi, soglie. Distinto da Impostazioni Globali (design/infrastruttura). |
| **Da ricollegare** | Stato contratto Sponsor dopo eliminazione città collegata: il contratto resta attivo ma privo di `city_id` valido fino a ricreazione/ricollegamento. Vedi O7 / DL-022. |
| **Rating Sponsor** | Media recensioni pubbliche utenti sullo Sponsor; sotto soglia (default 3 stelle) → **solo alert admin**, nessuna azione automatica. Vedi DL-021. |

---

## Fuori Perimetro

Questo Masterplan governa **solo il dominio Sponsor** e le sue dipendenze dirette di sicurezza. I seguenti domini **non** sono oggetto di questo documento, salvo dove un loro componente **impatta direttamente** il perimetro Sponsor (in tal caso si documenta solo l'intersezione).

| Dominio / sistema | Fuori perimetro | Eccezione (solo se impatta Sponsor) |
|-------------------|-----------------|-------------------------------------|
| **AI Credit Engine** | Sì | — |
| **Stripe / pagamenti utente** | Sì | Subscription sponsor collegate in attivazione RPC |
| **Collaboration & Workspace** | Sì | Candidato audit log (O8) — non progettazione workspace |
| **Travel Diary / Itineraries** | Sì | — |
| **Marketplace generale (shop prodotti)** | Parziale | `shopService` sync verso `sponsors` (A8, A9, O6) |
| **Gamification** | Sì | — |
| **Community / Photo / Live Snaps** | Sì | — |
| **City Editor (POI, cultura, eventi…)** | Parziale | `cityLifecycleService` mutazioni su `sponsors` (B4, O7) |
| **Observatory / Analytics** | Sì | Metriche sponsor in dashboard — read only |
| **Auth / profili (generale)** | Parziale | `is_td_admin()`, `profiles.role` per guard RPC |
| **Notification System** | Parziale | Notifiche post-messaggio CRM partner |
| **Pricing & Plans (generale)** | Parziale | `pricing_versions` in attivazione sponsor |
| **Edge Functions (Gemini, ecc.)** | Sì | — |
| **Design System / UI shell** | Sì | — |

**Regola:** se un'analisi riguarda un dominio fuori perimetro, il risultato va nel documento AI_CONTEXT dedicato a quel dominio. Qui si registra solo ciò che modifica sicurezza, permessi o architettura **Sponsor**.

---

## Architettura congelata

Decisioni **approvate e non rinegoziabili** senza revisione esplicita di questo documento. Ogni nuova proposta deve rispettarle.

| # | Principio |
|---|-----------|
| **F1** | Nessun `UPDATE` / `DELETE` diretto dal browser per mutazioni **amministrative** o **di business** su pipeline sponsor |
| **F2** | **Sponsor Write Gateway**: mutazioni sensibili solo tramite RPC `SECURITY DEFINER` esposte al client |
| **F3** | **Minimo privilegio**: no `GRANT UPDATE/DELETE` su tabelle pipeline per `authenticated`; solo `EXECUTE` su RPC autorizzate |
| **F4** | Il browser **non usa mai** `service_role` |
| **F5** | **State machine lato SQL** nelle RPC: transizioni di stato validate nel database, non nel client |
| **F6** | **Implementazione unica finale** dell'intero dominio; vietati workaround temporanei |
| **F7** | **CRUD PostgREST diretto** consentito solo per: `SELECT` (RLS) e `INSERT` partner scoped (`WITH CHECK` rigoroso) |
| **F8** | Ogni RPC admin: `SET search_path = public, pg_temp`, guard `is_td_admin(auth.uid())`, `REVOKE ALL FROM PUBLIC`, `GRANT EXECUTE` selettivo |
| **F9** | Side effect multi-tabella **solo** dentro RPC atomiche |
| **F10** | Perimetro completo: `sponsor_requests`, `sponsors`, `sponsor_messages`, subscriptions, shop/city cross-writes, RPC esistenti |

*Violazione di F1–F10 in qualsiasi PR va bloccata finché non si aggiorna prima questo masterplan.*

---

## Domande a cui il Masterplan deve rispondere (Q1–Q9)

### Tre livelli di stato — audit · progetto · implementazione

| Livello | Cosa misura | Stato attuale | Dove verificarlo |
|---------|-------------|---------------|------------------|
| **Audit** | Evidenze raccolte su remoto, codice e documentazione (SQL Pack, V1–V20) | **Concluso** | § *Verifiche pre-implementazione* · § *Verifiche completate* |
| **Progetto** | Decisioni PO, architettura congelata, piano mitigazione, gate *Pronto* (DoD-1–9) | **Approvato** | § *Decisioni PO* · § *Definition of Done* · DL-031 |
| **Implementazione** | Migration, RPC, hardening, smoke runtime, chiusura gap B1–B10 | **In corso** — Fase 2.1 ☑ (2026-07-14) | § *Verifiche ed evidenze — implementazione* · WF-02 STEP-2 Fasi 1–6 |

> **Lettura rapida:** l'audit è **finito**; il progetto è **approvato**; l'implementazione **deve ancora iniziare** (prima voce: Fase 2.1 contenimento P0).

Due gate distinti sulle domande Q1–Q9 — **non** confondere *Pronto per Implementazione* con *Implementato*.

| # | Domanda | Stato attuale (audit) | Gate ***Pronto per Implementazione*** | Gate ***Implementato*** |
|---|---------|----------------------|----------------------------------------|-------------------------|
| **Q1** | Il dominio Sponsor è realmente sicuro? | **No** — voto 3/10 (V18); gap B1–B10 | **No accettato** — gap documentati; mitigazione DL-031 + Fasi 1–6 | **Sì** |
| **Q2** | Esistono escalation di privilegi? | **Sì** — B9 (V17) | **Sì accettato** — gap noto; contenimento Fase 1 | **No** |
| **Q3** | Esistono bypass dei permessi? | **Sì** — B3, B4, B9 | **Sì accettato** — gap noto; Write Gateway pianificato | **No** |
| **Q4** | Tutte le RPC sono sicure? | **No** — V17 | **No accettato** — hardening Fasi 1–3 | **Sì** |
| **Q5** | Tutte le policy RLS sono corrette? | **No** — B5, B6, A11; read pubblica intenzionale (DL-032) | **Parziale accettato** — vetrina pubblica DL-032; VT-SPONSOR-PUBLIC-READ in Fase 1 | **Sì** (Parziale ammesso solo read pubbliche) |
| **Q6** | Tutti i GRANT rispettano minimo privilegio? | **No** — V12/V15 | **No accettato** — REVOKE in Fasi 1–5 | **Sì** |
| **Q7** | Tutte le mutazioni admin passano da un unico gateway? | **No** — modello ibrido | **No accettato** — RPC gateway Fasi 2–4 | **Sì** |
| **Q8** | Frontend e database sono coerenti? | **Parziale** — 403 su requests; sponsors via RLS | **Parziale accettato** — 403 atteso pre-RPC; piano Fase 2 | **Sì** |
| **Q9** | Possiamo andare in produzione con ragionevole sicurezza? | **No** | **No accettato** — implementazione WF-02 STEP-2 obbligatoria | **Sì** |

**Regola gate *Pronto per Implementazione* (DoD-8):** Q1–Q9 **documentate** con No / Sì (gap noti) / Parziale **giustificato** e coperti da DL-031 + piano Fasi 1–6. **Non** richiedono risposta **Sì** prima del codice.

**Regola gate *Implementato*:** Q1–Q9 tutte **Sì**, salvo **Parziale** giustificato **solo** per read pubbliche sponsor (DL-032); evidenza post-deploy registrata (r.1549).

---

## Obiettivo finale

Progettare e — in una **sola implementazione finale coerente** — allineare l'intero dominio Sponsor al modello definito in *Architettura congelata*.

---

## Decisioni già approvate

*Vedi anche **Architettura congelata** (F1–F10). Non implementare ancora.*

### D1 — Non concedere UPDATE/DELETE diretto su `sponsor_requests`

Il 403 su approvazione è **comportamento corretto**, non un bug da aggirare.

### D2 — Modello target: Sponsor Write Gateway (RPC-driven per admin)

### D3 — Soluzione B (RPC) come architettura definitiva

### D4 — CRUD diretto solo per SELECT e INSERT partner scoped

### D5 — Implementazione unica e completa

### D6 — Bonifica dell'intero perimetro Sponsor

### D7 — SSOT in `AI_CONTEXT/29_SPONSOR_SECURITY_MASTERPLAN.md`

Una sola versione del masterplan; nessuna copia in `docs/architecture`.

### D8 — O3: una azione admin = una RPC dedicata (PO, 2026-07-13)

Ogni pulsante/azione amministrativa nel pannello Sponsor (Approva, Rifiuta, Attiva, Estendi, …) corrisponderà a **una singola funzione RPC** atomica. Validazione audit: concordi; oggi **non** implementato (CRUD diretto).

### D9 — O5: pipeline funzionale (PO, 2026-07-13; agg. 2026-07-14)

Tab pipeline admin: **Nuove Richieste** → **Attesa Pagamenti** → **Sponsor Attivi** → **Sponsor Scollegati** (DL-029) → **Scaduti** → **Rifiutati** → **Annullati**. Il Write Gateway cambia solo **chi esegue** le mutazioni (RPC al posto del CRUD browser), non l'esperienza funzionale delle tab approvate.

### D10 — O6: sync Shop → Sponsor automatico (PO, 2026-07-13)

Le modifiche del Partner nell'area Shop devono propagarsi ai dati Sponsor collegati. Validazione audit: concordi; già implementato in `shopService.saveShop` / `saveProduct` (da migrare su RPC in implementazione finale).

### D11 — O8: audit log amministrativo obbligatorio (PO, 2026-07-13)

Storico completo delle operazioni admin sul dominio Sponsor. Validazione audit: concordi come requisito; **non** implementato oggi (C3).

### D12 — O1: registrazione obbligatoria prima dell'invio candidatura (PO, 2026-07-13; pipeline DL-033)

Il visitatore può **aprire** «Diventa Partner» senza login. All'invio: registrazione completa (username univoco, email con conferma) → login → candidatura → conferma. **Gap attuale:** non implementato (vedi *Flusso UX — Diventa Sponsor*).

### D13 — O4: aderenza esatta alla matrice permessi Admin Panel (PO, 2026-07-13; dettaglio 2026-07-14)

Il dominio Sponsor deve rispettare **integralmente** `admin_all` / `admin_limited` come nel resto dell'Admin Panel — allineato a **Utenti & Ruoli**, senza reinventare la gestione ruoli (DL-027). **Gap implementativo:** UI/policy ancora da allineare al target documentato in *Matrice permessi target*.

### D14 — O9: criterio eliminazione RPC legacy (PO, 2026-07-13)

Eliminazione consentita **solo** se dimostrato assenza uso da: frontend, altre RPC, trigger, scheduler, database. Se un solo punto non è dimostrabile → **non eliminare**. Vedi *Policy eliminazione RPC legacy*.

### D15 — O11: flusso UX «Diventa Sponsor» documentato nel Masterplan (PO, 2026-07-13)

Il Masterplan include il percorso utente completo, non solo sicurezza. Vedi sezione dedicata *Flusso UX — Diventa Sponsor*.

### D16 — O2: motore messaggistica unico (PO, 2026-07-13)

Un solo motore tecnico per tutte le conversazioni Sponsor (CRM Admin↔Sponsor, Utente↔Sponsor, tipologie future). Non due sistemi paralleli (`partner_logs` JSON vs `sponsor_messages` tabella). Differenze solo per tipo, partecipanti, permessi, UI. Vedi *O2 — Sistema messaggistica*.

### D17 — O2: chat Utente↔Sponsor disattivata in fase 1, non eliminata (PO, 2026-07-13)

La conversazione Utente↔Sponsor resta nel modello architetturale ma è **funzionalmente OFF** nella prima release. L'implementazione deve prevederla senza riprogettazione futura. Toggle e messaggio configurabile → DOC 30.

### D18 — O2: privacy CRM — amministratori possono leggere conversazioni Sponsor (PO, 2026-07-13)

Gli admin possono consultare le conversazioni CRM Sponsor. Obbligo di informativa in privacy, termini e testi UI — **non hardcoded**, modificabili da admin via **Centro di Controllo** (DOC 30). *Privacy avanzata / compliance estesa → WF-03 (DL-P09); in WF-02 restano solo testi disclosure operativi.*

### D22 — O2: una conversazione per Sponsor (PO, 2026-07-13)

Ogni contratto Sponsor ha **un thread conversazionale dedicato**. Partner multi-sponsor: una conversazione distinta per ciascuno. Admin: contesto Sponsor sempre visibile. CRM Admin e chat Partner **convergono** sullo stesso thread (UI diversa).

### D23 — Messaggistica: dominio autonomo, Sponsor consumer (PO + audit, 2026-07-13)

Il motore conversazioni **non è** proprietà del dominio Sponsor. Sponsor definisce **requisiti** (permessi, contesto contratto, integrazione CRM UI); il **motore** sarà un servizio piattaforma riutilizzabile (Admin↔Utente, ticket futuri). **Non creare ancora DOC dedicato** — valutazione in questa sezione e DOC 30.

### D24 — Gate G-MSG-1: ordine obbligatorio prima della chat unificata (PO, 2026-07-13)

1. Risolvere approvazione Sponsor. 2. Completare dominio Sponsor. 3. Stop. 4. Review UI messaggistica con PO. 5. Solo dopo → sviluppo motore. **Vietato** implementare chat unificata prima di G-MSG-1.

### D19 — O7: impatto City Lifecycle su Sponsor (PO, 2026-07-13)

Rinomina città / cambio slug → nessuna azione Sponsor. Eliminazione città → Sponsor in stato **Da ricollegare**. Ricreazione città → ricollegamento automatico. Merge città → fuori perimetro. Vedi *O7 — City Lifecycle*.

### D20 — O10: estensione contratto singola e massiva — stessa funzione (PO, 2026-07-13; selezione 2026-07-14)

Estensione massiva ≠ funzione diversa: stessa operazione di business con selezione multipla. **Estensione massiva:** solo sponsor selezionati manualmente via **checkbox** — **non** i filtri della lista (DL-028). Entrambe aumentano scadenza, storicizzano nel CRM contratto (chi, quando, giorni, motivazione).

### D21 — Rating Sponsor: alert umano, nessuna automazione punitiva (PO, 2026-07-13; UI 2026-07-14)

Media recensioni pubbliche sotto soglia configurabile (default 3★) → **evidenziazione** in tab **Sponsor Attivi** + filtro **«Solo sotto soglia»** (DL-030). **Vietato:** sospensione automatica, mancato rinnovo automatico. Ogni provvedimento è decisione umana.

### D25 — Write Gateway e RPC confermati (PO, 2026-07-14)

Conferma esplicita: **Write Gateway** + **RPC come unico punto di scrittura** admin/business (DL-031). Nessun workaround CRUD.

### D26 — Tab Sponsor Scollegati (PO, 2026-07-14)

Eliminazione città → sponsor **non eliminato** → tab dedicata **Sponsor Scollegati** con stato **Da ricollegare**, ultima città associata, modifica città e dati; ricollegamento → ritorno automatico in **Sponsor Attivi** (DL-029).

### D27 — Visibilità pubblica Sponsor (PO, 2026-07-14)

Vetrina Sponsor, Shop e POI sponsorizzati **pubblici** per visitatori non autenticati. Vedi DL-032.

### D28 — Pipeline signup Diventa Sponsor (PO, 2026-07-14)

Pipeline registrazione → candidatura → attivazione con ruolo assegnato dal sistema. Vedi DL-033.

### D29 — Terminazione contratto solo admin_all (PO, 2026-07-14)

Operazione irreversibile riservata a super-admin. Vedi DL-034.

*Riepilogo sintetico. Lo storico decisionale completo e immutabile è nel **Decision Log** sotto.*

---

## Decision Log

Registro cronologico delle decisioni architetturali prese durante l'audit.

**Regole:**

- Ogni voce è **immutabile** dopo la pubblicazione.
- Se una decisione viene superata, si aggiunge una **nuova voce** (es. DL-008) che la sostituisce e ne spiega il motivo.
- Non modificare retroattivamente il testo delle voci esistenti.
- Ogni voce deve avere: ID, Data, Decisione, Motivazione, Impatto.
- **Trasferimento di dominio:** quando una responsabilità documentata in questo SSOT viene **spostata** verso un altro documento (es. Messaggistica, Centro di Controllo), la voce DL originale **non si cancella**. Si aggiunge una nuova voce (o nota in coda alla voce) con: *«Responsabilità trasferita a `<percorso SSOT>` — proprietario da data X»*. Il nuovo SSOT diventa unica fonte operativa; qui resta solo lo **storico decisionale** e i **requisiti consumer** ancora pertinenti al Sponsor.

---

### DL-001

**Data:** 2026-07-13

**Decisione:** Il dominio Sponsor adotterà definitivamente un modello **RPC-driven** per tutte le mutazioni amministrative e di business.

**Motivazione:** Il CRUD diretto dal browser (`supabase.from().update()` / `.delete()`) è incompatibile con il principio del minimo privilegio, non consente state machine enforceable né audit affidabile. Il progetto usa già questo pattern in altri domini (AI credits, community publish, collaboration ACL).

**Impatto:** Tutte le future implementazioni sul dominio Sponsor devono passare da RPC gateway `SECURITY DEFINER`. Vietato concedere `GRANT UPDATE/DELETE` su tabelle pipeline come workaround.

---

### DL-002

**Data:** 2026-07-13

**Decisione:** Il 403 su approvazione sponsor (`permission denied for table sponsor_requests`) **non va corretto** con `GRANT UPDATE`.

**Motivazione:** Verifica SQL: `authenticated` e `anon` non possiedono UPDATE su `sponsor_requests`; esistono solo policy SELECT e INSERT. Il database sta applicando il modello corretto; il frontend è quello non allineato.

**Impatto:** Nessuna migration o grant per “sbloccare” l'approvazione via PATCH. L'approvazione sarà implementata solo tramite RPC dedicata.

---

### DL-003

**Data:** 2026-07-13

**Decisione:** Scelta architetturale **Soluzione B** (RPC gateway) invece di **Soluzione A** (GRANT UPDATE + policy RLS UPDATE + CRUD diretto).

**Motivazione:** Soluzione A espone superficie PostgREST ampia, non garantisce whitelist colonne né transizioni di stato, e diverge dal pattern `activate_sponsor_with_resource` già presente. Soluzione B è coerente, auditabile e scalabile.

**Impatto:** Famiglia RPC admin da progettare e implementare in un'unica ondata. Architettura congelata F1–F10.

---

### DL-004

**Data:** 2026-07-13

**Decisione:** **Una sola implementazione finale** dell'intero dominio Sponsor; vietati fix parziali.

**Motivazione:** Il dominio è ibrido (CRUD + RPC); fix puntuali (es. solo `approve_sponsor_request`) perpetuerebbero incoerenze su reject, delete, attivazione, shop sync, city lifecycle.

**Impatto:** Gate implementazione: stato documento = *Pronto per Implementazione* prima di qualsiasi codice. Checklist unificata in questo masterplan.

---

### DL-005

**Data:** 2026-07-13

**Decisione:** Il perimetro dell'audit e dell'implementazione include **l'intero dominio Sponsor**, non solo `sponsor_requests`.

**Motivazione:** Scritture dirette su `sponsors`, `sponsor_messages`, subscriptions, `shopService`, `cityLifecycleService` e RPC esistenti (`activate_sponsor_with_resource`) presentano rischi equivalenti o maggiori.

**Impatto:** Bonifica obbligatoria di tutti i moduli elencati in Appendice A. Principio F10 in Architettura congelata.

---

### DL-006

**Data:** 2026-07-13

**Decisione:** `AI_CONTEXT/29_SPONSOR_SECURITY_MASTERPLAN.md` è la **Single Source of Truth (SSOT)** del dominio Sponsor.

**Motivazione:** Evitare duplicazioni (`docs/architecture/`), perdita di contesto tra sessioni e due fonti di verità. `AI_CONTEXT` è il contesto tecnico permanente del progetto.

**Impatto:** Ogni analisi, verifica, decisione e modifica roadmap si registrano solo qui. Altri documenti (`01`, `09`, `06`, …) contengono solo riferimenti, non duplicati del contenuto.

---

### DL-007

**Data:** 2026-07-13

**Decisione:** Il browser **non deve mai** usare `service_role` per operazioni sponsor; lettura bootstrap sponsor via server (`/api/bootstrap/sponsors`) resta ammessa.

**Motivazione:** `service_role` dal client bypasserebbe RLS e annullerebbe il modello di sicurezza. Il pattern server-side con `supabaseAdmin` per read bootstrap è corretto.

**Impatto:** Principio F4 in Architettura congelata. Mutazioni admin solo via RPC con JWT `authenticated` + guard `is_td_admin()`.

---

### DL-008

**Data:** 2026-07-13

**Decisione:** CRUD PostgREST diretto dal browser resta consentito **solo** per `SELECT` (RLS) e `INSERT` partner scoped; tutto il resto passa da RPC.

**Motivazione:** Separazione netta tra operazioni di submission/lettura (partner, pubblico, admin read) e mutazioni di business (transizioni stato, attivazione, cancellazione, note admin).

**Impatto:** Principio F7. `submitSponsorRequest` (INSERT) può restare diretto se policy `WITH CHECK` è rigorosa (O1 ☑ — DL-033).

---

### DL-009

**Data:** 2026-07-13

**Decisione (O3 — PO):** Ogni azione amministrativa sul dominio Sponsor corrisponde a **una singola RPC** dedicata (granularità 1:1 azione↔funzione).

**Motivazione:** Auditabilità, minimo privilegio, state machine per transizione. Allineato a F2/F9.

**Impatto:** Famiglia RPC target in *Architettura target*; vietato RPC “multi-azione” o CRUD diretto post-implementazione.

---

### DL-010

**Data:** 2026-07-13

**Decisione (O5 — PO):** La **pipeline funzionale** Sponsor (tab e stati in Admin) resta **invariata**; il Write Gateway non modifica flusso business né UI admin.

**Motivazione:** Il Product Owner non vuole riorganizzare il processo operativo; solo rendere sicura l'esecuzione.

**Impatto:** Implementazione = sostituire il motore sotto i pulsanti esistenti (RPC), non ridisegnare `SponsorManager`.

---

### DL-011

**Data:** 2026-07-13

**Decisione (O6 — PO):** Le modifiche del Partner nell'area Shop **devono** aggiornare automaticamente i record Sponsor collegati (sync dati anagrafici / attivazione subscription shop).

**Motivazione:** Coerenza dati tra vetrina shop e contratto sponsor; un'unica fonte per il partner.

**Impatto:** `sync_sponsor_profile_from_shop` (o equivalente) in famiglia RPC target; oggi sync via CRUD in `shopService`.

---

### DL-012

**Data:** 2026-07-13

**Decisione (O8 — PO):** Il sistema deve mantenere uno **storico completo** (audit log) delle operazioni amministrative sul dominio Sponsor.

**Motivazione:** Accountability, debug, conformità; oggi assente (C3).

**Impatto:** Ogni RPC admin dovrà registrare evento strutturato; da progettare in fase implementazione (non blocca audit DB ma blocca DoD se non definito).

---

### DL-013

**Data:** 2026-07-13

**Decisione (O1 — PO, revisione):** Per diventare Sponsor l'utente deve essere **registrato e autenticato** al momento dell'invio. Il visitatore può aprire il modulo senza login; al click **Invia Candidatura Partner**: (1) creazione account TD, (2) login automatico, (3) INSERT richiesta con `profile_id = auth.uid()`, (4) schermata conferma. **Vietate** richieste con `profile_id` nullo / invio come `anon`.

**Motivazione:** Tracciabilità partner, CRM, pagamenti, coerenza con area personale e messaggi.

**Impatto:** Implementazione: orchestrazione signup in `useSponsorFormLogic` (pipeline DL-033); revoca policy INSERT `anon` su `sponsor_requests`; UX O11. Ruolo `profiles.role` assegnato **solo dal sistema** all'attivazione Sponsor (→ `business`).

---

### DL-014

**Data:** 2026-07-13

**Decisione (O4 — PO):** Il dominio Sponsor deve rispettare **esattamente** la matrice permessi dell'Admin Panel (`ROLE_PERMISSIONS` in `userService`). Nessuna eccezione «locale» al dominio Sponsor.

**Motivazione:** Coerenza operativa; `admin_limited` non deve avere poteri di `admin_all`; permessi devono essere prevedibili per tutti i moduli admin.

**Impatto:** Ogni RPC admin e policy RLS devono mappare `admin_all` / `admin_limited` come nel resto del pannello; gap attuali in V14 e UI da colmare in implementazione unica.

---

### DL-015

**Data:** 2026-07-13

**Decisione (O9 — PO):** Le RPC legacy si **eliminano solo** se dimostrato matematicamente assenza di utilizzo da: frontend, altre RPC, trigger, scheduler, database (incluso RLS/policy che le invocano). **Un solo punto non dimostrabile → non eliminare.**

**Motivazione:** Evitare rotture silenziose (scadenze automatiche, RLS, job esterni).

**Impatto:** Matrice eliminabilità in *Policy eliminazione RPC legacy*; `can_manage_sponsor` **non eliminabile** (RLS); `approve_sponsor_with_subscription` eliminabile solo da repo (assente su remoto).

---

### DL-016

**Data:** 2026-07-13

**Decisione (O11 — PO):** Il Masterplan documenta ufficialmente il **flusso UX completo** «Diventa Sponsor» (percorso UI, stati, messaggi, prerequisiti login).

**Motivazione:** Il dominio Sponsor non è solo sicurezza DB; il PO deve poter validare l'esperienza end-to-end senza leggere codice.

**Impatto:** Sezione *Flusso UX — Diventa Sponsor* obbligatoria per *Pronto per Implementazione*.

---

### DL-017

**Data:** 2026-07-13

**Decisione (O5 — chiarimento tecnico, non PO):** L'attivazione sponsor («Registra Incasso») sarà implementata con **una sola RPC atomica** (`activate_sponsor_from_request`). Sostituisce e **depreca** il flusso split `createSponsorFromRequest` + `activate_sponsor_with_resource`. **Nessuna funzione parallela** né versione «bis».

**Motivazione:** PO (O5): stessa pipeline UI; audit: eliminare doppioni e superficie EXECUTE su RPC legacy non guarded.

**Impatto:** Famiglia RPC target aggiornata; `activate_sponsor_with_resource` da rimuovere/sostituire post-migrazione, non mantenere in parallelo.

---

### DL-018

**Data:** 2026-07-13

**Decisione (O2 — PO):** Un **unico motore di messaggistica** per tutto il dominio conversazioni Sponsor (e tipologie future). Vietato mantenere due stack tecnici paralleli. Le differenze sono solo: tipo conversazione, partecipanti, permessi, UI.

**Motivazione:** Manutenzione su un solo sistema; evoluzione verso CRM Sponsor↔Admin e altre tipologie senza duplicazione.

**Impatto:** Migrazione/consolidamento `partner_logs` (JSON su request/sponsor) e `sponsor_messages` (tabella) verso modello unificato in Fase 5; RPC messaggi allineate a DL-018; risolve direzione A1/C6.

---

### DL-019

**Data:** 2026-07-13

**Decisione (O2 — PO):** La chat **Utente ↔ Sponsor** non viene eliminata. È **disattivata funzionalmente in fase 1** (feature flag DOC 30), ma l'architettura del motore unificato deve supportarla fin da subito.

**Motivazione:** Evitare riprogettazione costosa in release successive; UI partner già presente (`UserMessagesTab`).

**Impatto:** Toggle `feature.comms.user_sponsor` nel **Centro di Controllo** (DOC 30); messaggio sostitutivo configurabile; **nessuna implementazione chat** fino a Gate G-MSG-1.

---

### DL-024

**Data:** 2026-07-13

**Decisione (O2 — PO + audit):** Il motore messaggistica diventa **dominio autonomo** della piattaforma. Il dominio Sponsor **consuma** il servizio tramite `conversation_context` (es. `sponsor_id`) — non progetta «Chat Sponsor» come sottosistema proprietario.

**Motivazione:** Estensibilità verso Admin↔Utente, ticket, moderazione; manutenibilità; evita accoppiamento sicurezza Sponsor ↔ messaggi.

**Impatto:** RPC messaggi fuori perimetro implementazione Sponsor Fase 1–4; DOC 29 definisce requisiti UI/permessi Sponsor; schema DB messaggistica in futuro SSOT dedicato (post G-MSG-1 step 4). `15_CRM_MESSAGING.md` da riallineare.

---

### DL-025

**Data:** 2026-07-13

**Decisione (O2 — PO):** **Una conversazione per Sponsor.** Partner multi-sponsor vede N conversazioni. Admin vede contesto Sponsor su ogni thread. `PartnerDetailModal` (ricco) e `UserMessagesTab` (semplificato) sono **due viste** sullo stesso thread.

**Motivazione:** Chiarezza operativa; audit per contratto.

**Impatto:** Modello dati: `conversation` ancorata a `sponsor_id` (o `sponsor_request_id` in fase pending); non thread per `profile_id` generico.

---

### DL-026

**Data:** 2026-07-13

**Decisione (Gate G-MSG-1 — PO):** Ordine obbligatorio prima della chat unificata: (1) fix approvazione Sponsor, (2) completamento dominio Sponsor, (3) stop, (4) review UI messaggistica con PO, (5) sviluppo motore.

**Motivazione:** Evitare costruire messaggistica su fondamenta Sponsor instabili; allineare UX prima del codice.

**Impatto:** Fase 5 piano migrazione **rinominata e gated**; implementazione `partner_logs`/`sponsor_messages` consolidation **post** G-MSG-1.

---

### DL-020

**Data:** 2026-07-13

**Decisione (O2 — PO):** Gli amministratori **possono consultare** le conversazioni CRM Sponsor. L'utente deve essere informato tramite privacy policy, termini di utilizzo e testi in-app — **modificabili dagli admin**, non hardcoded (DOC 30 / `system_messages`).

**Motivazione:** Trasparenza legale e operativa; coerenza con moderazione admin esistente.

**Impatto:** Chiavi testo dedicate in DOC 30; disclosure obbligatoria prima di abilitare CRM in produzione.

---

### DL-021

**Data:** 2026-07-13

**Decisione (Rating Sponsor — PO):** Le recensioni pubbliche utenti generano una **media**. Se la media scende sotto la soglia configurabile (default **3 stelle**): generare **solo alert** agli amministratori. **Vietato:** sospensione automatica, mancato rinnovo automatico. Ogni provvedimento è **esclusivamente umana**.

**Motivazione:** Protezione reputazionale senza automazioni punitive non controllate.

**Impatto:** Soglia in DOC 30; alert in pipeline admin (notifiche/badge); collegamento futuro al sistema recensioni (DOC 27); oggi UI mostra «N/A» (`getSponsorRating` stub).

---

### DL-022

**Data:** 2026-07-13

**Decisione (O7 — PO):** Regole City Lifecycle → Sponsor:

| Evento città | Azione Sponsor |
|--------------|----------------|
| Cambio nome | Nessuna |
| Cambio slug | Nessuna |
| Eliminazione città | Sponsor → stato **Da ricollegare** (`city_id` null, contratto non terminato) |
| Ricreazione città (stesso nome/territorio) | Ricollegamento automatico sponsor orfani |
| Merge città | **Fuori perimetro** |

**Motivazione:** Separare mutazioni cosmetiche da perdita legame territoriale; evitare cancellazione involontaria contratti.

**Impatto:** `cityLifecycleService` / RPC Fase 4 devono **sostituire** delete sponsor su `deleteCity`; introdurre stato/governance «Da ricollegare» in UI admin (tab o filtro dedicato); `reclaimOrphanedItems` già parzialmente allineato al ricollegamento.

---

### DL-023

**Data:** 2026-07-13

**Decisione (O10 — PO):** **Estensione massiva** e **estensione singola** sono la **stessa funzione di business** (`extend_sponsor_contract` / variante bulk). La massiva aggiunge solo selezione multipla Sponsor. Entrambe: aumentano data scadenza; storicizzano nel CRM contratto (**chi**, **quando**, **giorni**, **motivazione**). Caso d'uso principale: compensazioni commerciali (es. blackout piattaforma).

**Motivazione:** Coerenza audit (O8); evitare due logiche divergenti negli stub attuali.

**Impatto:** RPC `extend_sponsor_contract` + `extend_sponsors_bulk` (parametro `ids[]` da checkbox); Appendice C aggiornata; stub C-1/C-2 convergono su stesso backend. **Aggiornamento DL-028 (2026-07-14):** massiva **solo** su checkbox esplicite, non su filtri lista.

---

### DL-027

**Data:** 2026-07-14

**Decisione (O4 — PO):** Permessi **`admin_limited`** nel dominio Sponsor (allineati al sistema **Utenti & Ruoli**, senza reinventare gestione ruoli):

| Consentito | Negato |
|------------|--------|
| Approvare, rifiutare, attivare richieste/contratti | Modificare propri privilegi |
| Estendere contratti (singolo e massivo su checkbox) | Trasformarsi in `admin_all` |
| CRM Sponsor: leggere e scrivere messaggi | Modificare o rimuovere privilegi di un `admin_all` |
| Accedere Attività & Sponsor | Operazioni che compromettono controllo piattaforma |
| | Terminare / cancellare contratto (irreversibile — solo `admin_all`, DL-034) |
| | Elimina singolo/bulk (resta **solo `admin_all`**) |

**Motivazione:** Delega operativa coerente con Admin Panel; `admin_all` resta unico ruolo con pieno controllo.

**Impatto:** Matrice permessi target aggiornata; policy `sponsor_messages` deve includere `admin_limited` e rimuovere `admin_city`; RPC guard distingue `admin_all` vs `admin_limited` dove richiesto (es. delete bulk).

---

### DL-028

**Data:** 2026-07-14

**Decisione (O10 — PO):** **Estensione massiva** opera **esclusivamente** sugli sponsor selezionati manualmente tramite **checkbox** nella tab **Sponsor Attivi**. **Vietato** estendere «tutti i filtrati» o l'intera lista visibile per effetto filtri.

**Motivazione:** Evitare estensioni involontarie su insiemi non intenzionali.

**Impatto:** `extend_sponsors_bulk` riceve solo `ids[]` da selezione UI; C-1 aggiornato; sostituisce ambiguità «tutti attivi filtrati» in DL-023.

---

### DL-029

**Data:** 2026-07-14

**Decisione (O7 — PO):** Nuova tab pipeline admin **Sponsor Scollegati**. Eliminazione città → sponsor **non eliminato** → entra in tab **Sponsor Scollegati** con stato **Da ricollegare**, **ultima città associata** visibile, possibilità di **modificare città** e aggiornare dati necessari. Ricollegamento completato → ritorno automatico in tab **Sponsor Attivi**.

**Motivazione:** Visibilità operativa su contratti attivi privi di città valida (DL-022).

**Impatto:** O5 esteso con tab dedicata; `cityLifecycleService` / RPC Fase 4; UI filtro sostituito da tab.

---

### DL-030

**Data:** 2026-07-14

**Decisione (Rating — PO):** Sponsor sotto soglia (default 3★, configurabile DOC 30): **evidenziazione visiva** in tab **Sponsor Attivi** + filtro dedicato **«Solo sotto soglia»**. **Solo avvisi** — nessuna sospensione automatica (conferma DL-021).

**Motivazione:** Alert evidente senza automazioni punitive.

**Impatto:** UI `SponsorTable`; consumer `threshold.sponsor_rating_alert_stars` (DOC 30); calcolo rating da implementare.

---

### DL-031

**Data:** 2026-07-14

**Decisione (PO):** Conferma esplicita architettura **Write Gateway** + **RPC come unico punto di scrittura** per mutazioni admin/business Sponsor (F1–F2, D2–D3). Piano mitigazione B1–B10 accettato come **implementazione unica** — non deroga, risoluzione in ondata WF-02 STEP-2.

**Motivazione:** Review PO 2026-07-14; nessun workaround GRANT.

**Impatto:** DoD-3: B1–B10 → risoluzione pianificata (non ☐ deroga); gate implementazione invariato.

---

### DL-032

**Data:** 2026-07-14

**Decisione (DEC-A12 — PO):** **Visibilità pubblica Sponsor confermata.** La piattaforma nasce per dare visibilità agli Sponsor. Visitatori non autenticati possono vedere: scheda Sponsor, negozio digitale Sponsor, POI sponsorizzati. Il comportamento attuale del sistema è **quello desiderato** — **nessun cambiamento funzionale** richiesto.

**Motivazione:** Modello commerciale e vetrina territoriale.

**Impatto:** Policy `Public Read Sponsors` accettata come scelta di prodotto. A12 non è gap decisionale. *Verifica tecnica* VT-SPONSOR-PUBLIC-READ (colonnesensibili via API) resta in implementazione — vedi § Verifiche.

---

### DL-033

**Data:** 2026-07-14

**Decisione (DEC-SUX — PO):** Pipeline definitiva **Diventa Sponsor**:

```
Registrazione → username obbligatorio → username univoco → email obbligatoria
→ conferma email → login → invio candidatura Sponsor → approvazione amministratore
→ attivazione Sponsor → assegnazione automatica ruolo da sistema
```

**Regole:**

- L'utente **non sceglie mai** il proprio ruolo piattaforma.
- Il ruolo viene assegnato **automaticamente** dal sistema in base agli eventi (es. attivazione Sponsor → `profiles.role = 'business'`).
- L'acquisto crediti AI **non** modifica la tipologia utenza.

**Motivazione:** Coerenza identità, sicurezza, percorso unico verificabile.

**Impatto:** § *Flusso UX — Diventa Sponsor*; § *Tassonomia ruoli*; Fase 6 WF-02; revoca INSERT anon su `sponsor_requests`.

---

### DL-034

**Data:** 2026-07-14

**Decisione (DEC-TERM — PO):** **Terminazione contratto Sponsor** = operazione **irreversibile** → **esclusivamente `admin_all`**. `admin_limited` **non** può terminare/cancellare contratti Sponsor.

**Motivazione:** Allineamento a operazioni critiche; coerenza con regola generale operazioni irreversibili (`02_GOVERNANCE.md` §11).

**Impatto:** Matrice permessi O4; RPC `cancel_sponsor_contract` guard; UI pulsante «Termina» visibile solo a `admin_all`; DL-027 aggiornato.

---

### DL-035

**Data:** 2026-07-16

**Decisione (ricognizione ID — PO):** In sede di analisi del bug `activate_sponsor_from_request` (INSERT `pois` senza `id` → 23502) è stata confermata la coerenza del **modello dual-family** degli ID (territorio = PK **text**; piattaforma = PK **uuid**). **Non** è approvata una migrazione verso un modello unico di ID. Una possibile futura macrofase «ID Governance» (solo regole/governance, non cambio modello dati) è **registrata ma non approvata**; richiede nuova ricognizione congiunta prima di qualsiasi avvio.

**Motivazione:** Preservare l’analisi senza interrompere WF-02; evitare unificazione forzata incompatibile con registry città / OSM / write path POI.

**Impatto:** SSOT trasversale `AI_CONTEXT/33_ID_MODEL_DUAL_FAMILY.md`; bug fix immediato = soluzione A (RPC valorizza id text); nessun STEP/attività implementativa ID Governance in WF-02. Anticipazione non ufficiale in `01_EXECUTION_ROADMAP.md` §6.

---

## Problemi confermati

> **Nota — debito implementativo noto (B1–B10, A*, C*):** le voci sotto descrivono lo **stato attuale del sistema**, non un'analisi incompleta. Sono **debito implementativo accettato dal Product Owner** (DL-031), **coperto integralmente** dal piano Fasi 1–6 (§ *Implementazioni*) e **non impediscono** lo stato documento ***Pronto per Implementazione***. Restano obiettivo di chiusura del passaggio a ***Implementato***.

*Legenda **Fonte evidenza:** Codice = `src/`; Migration = `supabase/migrations/`; Database remoto = query SQL Pack / `supabase db query --linked`; Runtime = test manuale / log applicativo.*

*Legenda **Confidence:** **100%** = verificato su remoto; **Alta** = codice + migration concordi; **Media** = codice senza conferma runtime; **Ipotesi** = inferenza non ancora testata.*

### Bloccanti

| ID | Problema | Evidenza | Fonte evidenza | Confidence |
|----|----------|----------|----------------|------------|
| **B1** | Frontend UPDATE admin su `sponsor_requests`; DB nega | 403; grant UPDATE assente (V12) | Codice, Database remoto, Runtime | **100%** |
| **B2** | `activate_sponsor_with_resource`: SECURITY DEFINER senza `is_td_admin()` nel corpo | V17: corpo remoto senza guard; crea POI `published` | Migration, Database remoto | **100%** |
| **B3** | Attivazione split: INSERT `createSponsorFromRequest` + RPC | `useSponsorOperations`, `sponsorContractsService` | Codice | **Alta** |
| **B4** | UPDATE `sponsors` da shop/city lifecycle senza RPC Gateway | V14–V15: policy `can_manage_sponsor`/`is_td_admin` permette CRUD partner/admin | Codice, Database remoto | **100%** |
| **B5** | Policy admin `sponsor_messages` usa `admin_city` (inesistente in `UserRole`) | V14 + **V20**: unico residuo su remoto = policy RLS; 0 profili con `admin_city` | Database remoto (V20), Migration, Codice (`types/users.ts`) | **100%** |
| **B6** | INSERT `sponsor_requests` con `WITH CHECK true` (authenticated **e** anon) | V14: due policy INSERT entrambe `WITH CHECK true` | Database remoto | **100%** |
| **B7** | RPC attivazione crea risorse `published`/attive senza validazione stato request | V17: nessun check `waiting_payment`; side effect multi-tabella | Migration, Database remoto | **100%** |
| **B8** | `sponsor_messages`: GRANT tabella CRUD completo per `authenticated` e `anon` | V12 B1 | Database remoto | **100%** |
| **B9** | `activate_sponsor_with_resource`: EXECUTE su **PUBLIC**, `anon`, `authenticated` senza guard nella RPC | V17 B5: grant EXECUTE + corpo senza `auth.uid()` check | Database remoto | **100%** |
| **B10** | RPC sponsor ausiliarie (`can_manage_sponsor`, expiry): EXECUTE su PUBLIC/anon | V17: stesso pattern EXECUTE di B9 | Database remoto | **100%** |

### Alte

| ID | Problema | Evidenza | Fonte evidenza | Confidence |
|----|----------|----------|----------------|------------|
| **A1** | Doppio CRM: `partner_logs` vs `sponsor_messages` | `PartnerDetailModal` (logs JSON) vs `sponsor_messages` (badge unread admin) vs `addSponsorMessageAsync` non wired | Codice | **Alta** — **Direzione PO:** DL-018 unificazione |
| **A2** | `createSponsorFromRequest` → `status: 'approved'` pre-RPC | `sponsorContractsService.ts` | Codice | **Alta** |
| **A3** | `activate_sponsor_with_resource` senza `SET search_path` | V17: corpo remoto; vs pattern `20260530120000` | Migration, Database remoto | **100%** |
| **A4** | RPC legacy `approve_sponsor_with_subscription` in `update_rpc.sql` | V17 B6: **assente** su remoto | Migration (root), Database remoto | **100%** |
| **A5** | Nessuna state machine DB per transizioni intermedie | — | Migration, Codice | **Alta** |
| **A6** | `can_manage_sponsor`, `mark_expired_sponsors`, `update_expired_sponsors` in types, non in migration repo sponsor | V17; **non usate dal frontend** ma `can_manage_sponsor` in RLS `sponsors` | Codice, Database remoto | **100%** |
| **A7** | Grants `sponsors`: UPDATE client + RLS partner/admin | V12 + V14 | Database remoto | **100%** |
| **A8** | Shop sync per `vat_number`; `owner_id` opzionale | `shopService.ts` | Codice | **Alta** |
| **A9** | `startShopSubscription` imposta date/status sponsor da save prodotto shop | `shopService.saveProduct` | Codice | **Alta** |
| **A10** | GRANT default CRUD completo su `sponsor_messages` per client | V12 B1 | Database remoto | **100%** |
| **A11** | `admin_limited` assente da policy admin `sponsor_messages` e da SELECT `sponsor_requests` (solo `admin_all`+`admin_limited` su requests — ok requests; **messages no**) | V14 | Database remoto | **100%** |
| **A12** | Policy `Public Read Sponsors` (`SELECT true`) — **chiuso DEC-A12 (DL-032):** vetrina pubblica intenzionale. *Verifica tecnica* VT-SPONSOR-PUBLIC-READ: hardening colonne sensibili in implementazione | V14 | Database remoto | **100%** |
| **A13** | Policy RLS `sponsors` (`Admins manage…`, `Partners manage…`, `Public Read…`) **assenti** da migration repo | V14; grep repo negativo | Database remoto, Migration | **100%** |
| **A14** | `sponsor_subscriptions` assente su remoto; migration `20260418103000` ancora dual-write | V12, V17; solo `subscriptions` su remoto | Migration, Database remoto | **100%** |
| **A15** | Corpo remoto `activate_sponsor_with_resource` diverge da migration repo (owner injection, no `sponsor_subscriptions`, ordine parametri) | V17 vs `20260418103000` | Migration, Database remoto, Codice | **100%** |

### Consigliate

| ID | Problema | Evidenza | Fonte evidenza | Confidence |
|----|----------|----------|----------------|------------|
| **C1** | Stub admin (extension, bulk delete) | `sponsorAdminStubs.ts`; UI in `SponsorManager` | Codice | **Alta** |
| **C2** | `types/write` documenta upsert sponsor | `src/types/write/index.ts` | Codice | **Alta** |
| **C3** | Nessun audit log strutturato | — | Codice | **Media** |
| **C4** | `admin_limited` vs `admin_all` solo in UI | `SponsorManager`; V14 conferma gap su messages | Codice, Database remoto | **100%** |
| **C5** | Gap migration repo vs SSOT remoto (policy sponsors, RPC evolve, `sponsor_subscriptions`) | A13, A14, A15 | Migration, Database remoto | **100%** |
| **C6** | DOC 15 CRM cita `partner_logs` su `sponsors`; non allineato a `sponsor_messages` | `15_CRM_MESSAGING.md` | Codice (doc) | **Alta** |

---

## Priorità implementazione

*Popolata progressivamente dall'audit. **P0** = rischio escalation immediato; **P3** = debito non bloccante.*

| Priorità | ID problema | Azione target (implementazione finale) |
|----------|-------------|----------------------------------------|
| **P0** | B9, B2, B7 | Hardening `activate_sponsor_with_resource`: `REVOKE EXECUTE FROM PUBLIC`, guard `is_td_admin()`, `SET search_path`, state machine |
| **P0** | B1, B6 | RPC admin per transizioni `sponsor_requests`; revoca/restringi INSERT `WITH CHECK true` |
| **P0** | B8, B5, A11 | `sponsor_messages`: REVOKE CRUD client + RPC messaggi; fix policy admin (`is_td_admin`, includere `admin_limited`) |
| **P1** | B3, B4, A2 | Unificare attivazione in RPC atomica; migrare shop/city write su RPC partner-scoped |
| **P1** | B10, A3 | REVOKE EXECUTE PUBLIC su RPC ausiliarie; `search_path` su tutte le RPC sponsor |
| **P1** | A7 | `sponsors`: REVOKE UPDATE client; mantenere policy read pubblica (DL-032); write solo RPC |
| **P2** | A1, A8, A9, O6 | Allineare CRM e shop sync al Write Gateway |
| **P2** | C5, A14, A15 | Consolidare migration repo = stato remoto post-implementazione |
| **P2** | C1, O10 | Stub estensione: implementare via RPC unificata DL-023 (singola + massiva + audit CRM) |
| **P3** | C3, O8 | Audit log strutturato |
| **P3** | C6 | Allineamento DOC 15 post-implementazione |

---

## Verifiche completate

### V1 — Causa 403 su Approva (2026-07-13)

Flusso: `SponsorTable` → `handleInitialApproval` → `updateSponsorStatus` → PATCH `sponsor_requests`.
Client: browser `supabaseClient` (anon + JWT). Non service_role / API / edge.

### V2 — Privilegi `sponsor_requests` (2026-07-13)

| Ruolo | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `authenticated` | ✅ | ✅ | ❌ | ❌ |
| `anon` | ✅ | ✅ | ❌ | ❌ |

### V3 — Policy RLS `sponsor_requests` (2026-07-13)

Presenti: SELECT admin, INSERT authenticated, INSERT anon.
Assenti: UPDATE, DELETE, ALL.

### V4 — Inventario scritture frontend (2026-07-13)

Vedi Appendice A. RPC client: solo `activate_sponsor_with_resource`. Nessun upsert runtime.

### V5 — Due modelli architetturali (2026-07-13)

CRUD diretto vs RPC. **Valutazione sicurezza: 4/10** (rivista a **3/10** in V19 post SQL Pack).

### V6 — Soluzione A vs B (2026-07-13)

Adottata Soluzione B (D3).

### V7 — Policy `sponsor_messages` da migration repo (2026-07-13)

| Policy | Comando | Condizione |
|--------|---------|------------|
| Admins can manage all | ALL | `role IN ('admin_all', 'admin_city')` |
| Partners view own | SELECT | `partner_id = auth.uid()` |
| Partners send | INSERT | `partner_id = auth.uid() AND direction = 'partner'` |

**Gap:** `admin_limited` non incluso; `admin_city` non esiste in `UserRole`. Nessuna policy UPDATE separata per partner (admin ALL copre admin). Nessun GRANT in migration.

### V8 — Analisi statica `activate_sponsor_with_resource` (2026-07-13)

Da migration repo (`20260418103000`):

| Controllo | Esito |
|-----------|-------|
| SECURITY DEFINER | Sì |
| SET search_path | **No** |
| is_td_admin / auth.uid | **No** |
| Validazione stato request | **No** (non richiede `waiting_payment`) |
| Validazione sponsor↔request | **No** |
| Side effects | INSERT pois/shops/guides/operators; INSERT subscriptions ×2; UPDATE sponsors, sponsor_requests |
| REVOKE/GRANT EXECUTE in repo | **Non presente** |

### V9 — Inventario RPC sponsor in `types/supabase.ts` (2026-07-13)

| RPC | Usata da frontend |
|-----|-------------------|
| `activate_sponsor_with_resource` | Sì |
| `can_manage_sponsor` | **No** |
| `mark_expired_sponsors` | **No** |
| `update_expired_sponsors` | **No** |

`approve_sponsor_with_subscription`: presente solo in `update_rpc.sql` (root), **non** in types.

### V10 — UI che invoca stub / write a rischio (2026-07-13)

| UI | Operazione | Effetto reale oggi |
|----|------------|-------------------|
| `SponsorManager` → Approva/Rifiuta | UPDATE request | **403** |
| `SponsorManager` → Attivazione | INSERT sponsor + RPC | INSERT sponsors: **grant OK** (V12); effetto reale = RLS |
| `SponsorManager` → Estensione massiva/singola | stub | Nessuna scrittura DB |
| `SponsorManager` → Bulk delete (super admin) | stub | Nessuna scrittura DB |
| `PartnerDetailModal` → messaggio CRM | UPDATE `partner_logs` | **403 atteso** su requests |
| `PartnerDetailModal` → note admin | UPDATE | **403 atteso** |
| `shopService.saveShop` | UPDATE sponsors | **grant+RLS OK** se partner owner o admin (V14–V15); test runtime aperto |
| `shopService.saveProduct` | `startShopSubscription` UPDATE | idem |
| `cityLifecycleService` | UPDATE/DELETE sponsors | UPDATE: grant+RLS; DELETE: **grant assente** client → fallimento atteso |

### V11 — `can_manage_sponsor` non integrata (2026-07-13)

Funzione presente in types remoto ma **zero riferimenti** in `src/`. ACL sponsor non applicata nel codice.

### V12 — Privilegi tabella dominio Sponsor (B1 remoto, 2026-07-13)

Eseguito su Supabase remoto (`supabase db query --linked`). Tabelle nel perimetro B1: cinque nominate; **`sponsor_subscriptions` non esiste** su remoto (solo `subscriptions`; esiste anche `subscription` senza grant ai ruoli client).

#### `sponsor_requests` (conferma V2)

| Ruolo | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `authenticated` | ✅ | ✅ | ❌ | ❌ |
| `anon` | ✅ | ✅ | ❌ | ❌ |
| `service_role` | ✅ | ✅ | ✅ | ✅ |

#### `sponsors` (nuovo — grant tabella)

| Ruolo | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `authenticated` | ✅ | ✅ | ✅ | ❌ |
| `anon` | ✅ | ✅ | ✅ | ❌ |
| `service_role` | ✅ | ✅ | ✅ | ✅ |

**Implicazione:** `createSponsorFromRequest`, `cancelSponsor`, `shopService`, `cityLifecycleService` non sono bloccati a livello GRANT per UPDATE/INSERT su `authenticated`/`anon`. Il vincolo effettivo è RLS (da verificare B2–B3). DELETE client assente.

#### `sponsor_messages` (nuovo — critico)

| Ruolo | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `authenticated` | ✅ | ✅ | ✅ | ✅ |
| `anon` | ✅ | ✅ | ✅ | ✅ |
| `service_role` | ✅ | ✅ | ✅ | ✅ |

**Implicazione:** superficie di attacco massima a livello tabella; dipendenza totale da RLS. Conferma escalation B8.

#### `subscriptions`

| Ruolo | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `authenticated` | ✅ | ❌ | ❌ | ❌ |
| `anon` | ✅ | ❌ | ❌ | ❌ |
| `service_role` | ✅ | ✅ | ✅ | ✅ |

**Implicazione:** write subscription solo via `service_role` o RPC SECURITY DEFINER — allineato al modello target per questa tabella.

### V13 — RLS abilitata (SQL Pack B2, 2026-07-13)

| Tabella | `relrowsecurity` | `relforcerowsecurity` |
|---------|------------------|------------------------|
| `sponsor_requests` | ✅ true | false |
| `sponsors` | ✅ true | false |
| `sponsor_messages` | ✅ true | false |
| `subscriptions` | ✅ true | false |

**Implicazione:** RLS attiva su tutte le tabelle del perimetro; nessuna forzatura per table owner. I GRANT tabella (V12) si combinano con policy (V14).

### V14 — Policy RLS complete su remoto (SQL Pack B3, 2026-07-13)

#### `sponsor_requests` (3 policy)

| Policy | Cmd | USING / WITH CHECK |
|--------|-----|-------------------|
| Allow admin roles to read sponsor requests | SELECT | `profiles.role IN ('admin_all','admin_limited')` |
| Allow authenticated users to insert sponsor requests | INSERT | `WITH CHECK (true)` |
| public_insert_sponsor_requests | INSERT | `WITH CHECK (true)` |

**Discrepanze:** INSERT authenticated permissivo (non solo anon). SELECT usa ruoli espliciti, non `is_td_admin()`.

#### `sponsors` (3 policy — **non in migration repo**, vedi A13)

| Policy | Cmd | USING / WITH CHECK |
|--------|-----|-------------------|
| Admins manage sponsors secure | ALL | `is_td_admin(auth.uid())` |
| Partners manage own sponsors | ALL | `can_manage_sponsor(id)` |
| Public Read Sponsors | SELECT | `true` |

#### `sponsor_messages` (3 policy — **identiche a migration repo** V7)

| Policy | Cmd | USING / WITH CHECK |
|--------|-----|-------------------|
| Admins can manage all sponsor messages | ALL | `profiles.role IN ('admin_all','admin_city')` |
| Partners can view their own messages | SELECT | `partner_id = auth.uid()` |
| Partners can send messages | INSERT | `partner_id = auth.uid() AND direction = 'partner'` |

#### `subscriptions` (1 policy)

| Policy | Cmd | USING |
|--------|-----|-------|
| Users can view own subscriptions | SELECT | `auth.uid() = user_id OR is_td_admin(auth.uid())` |

**Implicazione B4/city:** DELETE `sponsors` da client bloccato a livello GRANT (V12); UPDATE possibile se RLS `can_manage_sponsor` o `is_td_admin` passa.

### V15 — `has_table_privilege('authenticated')` (SQL Pack B4, 2026-07-13)

Conferma V12: `sponsor_messages` sel/ins/upd/del = true; `sponsor_requests` upd/del = false; `sponsors` upd = true, del = false; `subscriptions` sel only.

### V16 — RPC sponsor: EXECUTE e SECURITY (SQL Pack B5 + supplementare, 2026-07-13)

| RPC | SECURITY DEFINER | EXECUTE concesso a |
|-----|------------------|-------------------|
| `activate_sponsor_with_resource` | ✅ | **PUBLIC**, postgres, anon, authenticated, service_role |
| `can_manage_sponsor` | ✅ | **PUBLIC**, postgres, anon, authenticated, service_role |
| `mark_expired_sponsors` | ❌ (INVOKER) | **PUBLIC**, postgres, anon, authenticated, service_role |
| `update_expired_sponsors` | ❌ (INVOKER) | **PUBLIC**, postgres, anon, authenticated, service_role |
| `check_and_expire_subscriptions` | ✅ | **PUBLIC**, postgres, anon, authenticated, service_role |

**Discrepanza migration repo:** nessuna migration definisce REVOKE EXECUTE su queste RPC.

### V17 — Corpo RPC remoto e legacy (SQL Pack B6 + `pg_get_functiondef`, 2026-07-13)

- **`approve_sponsor_with_subscription`:** **assente** su remoto (conferma A4; chiude parzialmente O9).
- **`activate_sponsor_with_resource` (remoto):** nessun `is_td_admin()`; nessun `SET search_path`; nessun check stato request; crea POI/shop/guide/operator + INSERT `subscriptions` + UPDATE `sponsors`/`sponsor_requests`. **Non** scrive su `sponsor_subscriptions` (diverso da `20260418103000`).
- **`can_manage_sponsor` (remoto):** `owner_id OR profile_id = auth.uid() OR is_td_admin(auth.uid())` — usata in RLS `sponsors`, non dal frontend.

### V18 — Owner tabelle (SQL Pack B7, 2026-07-13)

| Tabella | Owner |
|---------|-------|
| `sponsor_requests` | postgres |
| `sponsors` | postgres |
| `sponsor_messages` | postgres |
| `subscriptions` | postgres |

**Nota:** query B7 originale aveva precedenza operatori errata; corretta in Appendice B.

### V19 — Valutazione sicurezza post SQL Pack (2026-07-13)

Dopo B1–B7: modello ibrido CRUD+RPC con **EXECUTE PUBLIC** su RPC critiche e GRANT CRUD su `sponsor_messages`. **Valutazione: 3/10** (da 4/10 pre-pack).

### V20 — Verifica remota ruoli piattaforma e residuo `admin_city` (2026-07-14)

Eseguita **esclusivamente** su database Supabase remoto (`supabase db query --linked`, read-only). Nessuna analisi migration/repo.

#### `public.profiles.role` — valori distinti

| `role` | Righe |
|--------|------:|
| `user` | 2 |
| `admin_all` | 1 |
| `admin_limited` | 1 |
| `business` | 1 |

**Totale profili:** 5 · **`role` NULL:** 0 · **Valori anomali** (incluso `admin_city`, `guest`): **0**

#### Riferimenti a `admin_city` su remoto

| Tipo | Schema | Oggetto | Esito |
|------|--------|---------|-------|
| **RLS policy** | `public` | `sponsor_messages` → **`Admins can manage all sponsor messages`** (cmd `ALL`) | **Presente** — USING: `auth.uid() IN (SELECT profiles.id FROM profiles WHERE profiles.role = ANY (ARRAY['admin_all'::text, 'admin_city'::text]))` |
| Funzioni SQL | — | — | **Assente** |
| Trigger | — | — | **Assente** |
| View / materialized view | — | — | **Assente** |
| Enum PostgreSQL | — | — | **Assente** |
| CHECK constraint | — | — | **Assente** |
| Default value (colonne) | — | — | **Assente** |

**Conclusione:** l'unico residuo `admin_city` sul remoto è la policy RLS su `sponsor_messages`. Bonifica obbligatoria in WF-02 **Fase 2.1** (allineamento a `is_td_admin` / DL-027).

---

## Verifiche pre-implementazione

> **Stato audit:** **concluso** (DoD-2 ☑). Questa sezione non va confusa con il lavoro implementativo ancora da eseguire.

*SQL Pack B1–B7 + audit statico remoto: **completato** (V1–V20). DoD-2 ☑ (2026-07-14).*

Tutte le voci sotto sono **chiuse** — evidenza in § *Verifiche completate*.

### Database — `sponsor_requests`

- [x] Privilegi authenticated/anon (V2, V12)
- [x] Policy presenti/assenti (V3, V14)
- [x] Owner tabella (V18 — postgres)
- [x] Testo esatto policy INSERT authenticated (`WITH CHECK true`) (V14)
- [x] Testo esatto policy INSERT anon (`public_insert_sponsor_requests`, `WITH CHECK true`) (V14)
- [x] Testo esatto policy SELECT admin (`admin_all` + `admin_limited`, non `is_td_admin`) (V14)

### Database — `sponsors`

- [x] Privilegi authenticated / anon / service_role (V12)
- [x] RLS abilitata (V13)
- [x] Elenco policy complete (V14)

### Database — `sponsor_messages`

- [x] Privilegi tabella (V12)
- [x] Testo policy su remoto (= V7 migration repo) (V14)
- [x] Verifica remota `profiles.role`: nessun `admin_city`, nessun valore anomalo (V20)
- [x] Unico riferimento `admin_city` su remoto = policy **`Admins can manage all sponsor messages`** (V20)

### Database — `subscriptions` / `sponsor_subscriptions`

- [x] Privilegi `subscriptions` (V12)
- [x] RLS `subscriptions` (V13, V14)
- [x] Assenza `sponsor_subscriptions` su remoto (V12, V17)
- [x] Nessun write client-side su `subscriptions` (V12, V15)

### RPC e funzioni SQL (remoto)

- [x] EXECUTE su `activate_sponsor_with_resource` (V16 — PUBLIC/anon/authenticated)
- [x] Guard su remoto: **assenti** in corpo RPC (V17)
- [x] `approve_sponsor_with_subscription` su remoto: **assente** (V17 B6)
- [x] Definizione + EXECUTE: `can_manage_sponsor`, `mark_expired_sponsors`, `update_expired_sponsors` (V16–V17)
- [x] EXECUTE: `check_and_expire_subscriptions` (V16)
- [x] Elenco `pg_proc` LIKE `%sponsor%` (V16 — 4 funzioni)

### Coerenza documentale pre-impl (DoD-8)

- [x] Q1–Q9 documentate con gate *Pronto* vs *Implementato* (§ Q1–Q9)
- [x] Gap B1–B10 accettati con piano DL-031 (DoD-3 ☑)
- [x] Delta repo vs remoto documentato (V14–V17, C5 tracciato in implementazione)
- [x] Riferimenti SSOT incrociati: DOC 29 proprietario dominio Sponsor; DOC 15 gap noto (C6 → post-impl)

---

## Verifiche ed evidenze — implementazione (STEP-2 / post-implementazione)

> **Stato implementazione:** **in corso** — Fasi 2.1–2.3 completate (PO ✓). Fase 2.4: codice/migration presenti; chiusura bloccata da `npm run lint` non pulito.

*Non bloccano il gate **Pronto per Implementazione**. Tracciate in WF-02 STEP-2 e checklist § *Implementazioni*.*

### Database — `sponsors`

- [x] **VT-SPONSOR-PUBLIC-READ** — `REVOKE SELECT` colonne sensibili da `anon` + `SPONSOR_PUBLIC_VITRINE_SELECT` client + bootstrap API — **Fase 2.1** ☑ 2026-07-14
- [x] **UPDATE `cancelSponsor` / shop sync** — RPC `cancel_sponsor_contract`, `sync_sponsor_profile_from_shop`; client refactor — **Fase 2.4** ☑ 2026-07-16

### Database — `sponsor_messages`

- [x] **Bonifica policy** — `is_td_admin(auth.uid())`; rimosso `admin_city` — **Fase 2.1** ☑ 2026-07-14
- [ ] **Admin `admin_all` INSERT/UPDATE messaggi** — smoke runtime post-bonifica → **Fase 2.5**
- [x] **`admin_limited` su messages** — incluso via `is_td_admin` — **Fase 2.1** ☑ 2026-07-14

### Database — `sponsor_requests` / RPC attivazione

- [x] **INSERT anon revocato** — policy `public_insert_sponsor_requests` eliminata; INSERT authenticated scoped `profile_id = auth.uid()` — **Fase 2.1** ☑ 2026-07-14
- [x] **`activate_sponsor_with_resource` hardened** — `is_td_admin`, `SET search_path`, state machine `waiting_payment`, `REVOKE PUBLIC/anon`, `GRANT authenticated/service_role` — **Fase 2.1** ☑ 2026-07-14
- [x] **B1 approvazione admin** — RPC gateway `approve_sponsor_request`, … — **Fase 2.2** ☑ 2026-07-14
- [x] **`activate_sponsor_from_request`** — percorso atomico unico; `activate_sponsor_with_resource` revocato da client — **Fase 2.3** ☑ 2026-07-14 (review PO)

### Frontend / integrazione

- [ ] **JWT admin = `authenticated`** durante operazioni sponsor — smoke STEP-2
- [ ] **Esito reale `confirmActivation`** — smoke post-deploy Fase 2.3
- [ ] **Test manuale stub UI** (extension no-op) — chiusura post Fase 2.4 / 2.6

### Documentazione e repo

- [ ] **Allineare DOC 15** e righe Sponsor in `09_SYSTEM_COVERAGE_MAP` → **WF-02 STEP-4** (P3 C6)
- [ ] **`types/supabase.ts` vs RPC reali** — consolidamento post-migration → **STEP-2** (P2 C5/A15)
- [ ] **Migration repo: importare policy `sponsors` e stato RPC reale** (C5) → **STEP-2**

---

## Decisioni PO — stato

*Tutte le decisioni progettuali del dominio Sponsor sono **chiuse** (ultima chiusura: DL-032–034, 2026-07-14). Restano **evidenze implementative** (§ *Verifiche ed evidenze — implementazione*) in WF-02 STEP-2.*

---

## O2 — Sistema messaggistica (decisione PO)

### Principio

| Aspetto | Decisione |
|---------|-----------|
| Motore tecnico | **Uno solo** — dominio **autonomo** piattaforma (DL-024), non sottosistema Sponsor |
| Sponsor | **Consumer** — definisce requisiti UI/permessi; non possiede il motore |
| Differenze tra viste | **UI** (admin CRM ricco vs partner semplificato); permessi e contesto sono del motore |
| Thread | **Una conversazione per Sponsor** (DL-025); partner multi-sponsor → N thread |
| Convergenza UI | `PartnerDetailModal` + `UserMessagesTab` = **due viste stesso thread** |
| Tipologie fase 1 | CRM **Admin ↔ Partner** (post G-MSG-1) |
| Tipologie fase 1 OFF | Chat **Utente ↔ Sponsor** (flag Centro di Controllo) |
| Tipologie future | Admin↔Utente, ticket, supporto, moderazione — stesso motore |

### Gate G-MSG-1 (obbligatorio — DL-026)

| Step | Azione | Stato |
|------|--------|-------|
| 1 | Risolvere approvazione Sponsor (403 → RPC gateway) | ☑ |
| 2 | Completare implementazione dominio Sponsor (DOC 29) | ☐ |
| 3 | **STOP** — nessun lavoro su chat unificata | — |
| 4 | Review UI messaggistica completa con PO | ☐ |
| 5 | Avvio sviluppo dominio Messaggistica | ☐ |

**Vietato:** implementare consolidamento `partner_logs` / `sponsor_messages` prima dello step 5.

**Trasferimento responsabilità (chiarimento):** il completamento del Gate G-MSG-1 **non** trasferisce automaticamente ownership dal dominio Sponsor al dominio Messaggistica. Fino a che un nuovo SSOT Messaggistica **non documenta esplicitamente** le responsabilità assunte, restano valide le definizioni di questo documento per il perimetro Sponsor (requisiti UI, consumer, contenimento B8). Il trasferimento avviene **solo** con voce esplicita nel Decision Log del nuovo SSOT e riferimento incrociato qui.

### Valutazione estensibilità (audit — senza implementazione)

| Requisito futuro | Modello proposto | Fattibile? |
|------------------|------------------|------------|
| Tipi conversazione diversi | `conversation_type` enum estensibile | ✅ |
| Partecipanti variabili | Tabella `conversation_participants` | ✅ |
| Contesto dominio | `context_type` + `context_id` (sponsor, user, ticket) | ✅ |
| Permessi per tipo | Policy + RPC guard per `conversation_type` | ✅ |
| UI diversa per ruolo | Stesso API read; componenti UI per ruolo | ✅ |
| Read receipts / unread | Stato per partecipante (già parzialmente in `sponsor_messages`) | ✅ |

**Conclusione audit:** ✅ Il modello **dominio autonomo** è realmente estensibile. Contestazione alla formulazione PO «cambierà esclusivamente la UI»: **permessi e modello contesto** sono parte del motore, non solo presentazione. Accettabile se si intende «un solo backend, più UI».

### Stato oggi (evidenza codice — gap verso target)

| Canale | Storage oggi | UI oggi | Note |
|--------|--------------|---------|------|
| CRM Admin → Partner | `partner_logs` JSON su `sponsor_requests` / `sponsors` | `PartnerDetailModal` — Invia funzionante (`addPartnerLogAsync`) | Admin CRM attivo |
| Partner → Admin | stesso `partner_logs` | `UserMessagesTab` — Invia **stub** (`sendUserMessage`) | Partner vede thread ma invio non persiste |
| Badge unread admin | `sponsor_messages` tabella | `SponsorTable` badge, filtro «SOLO NON LETTI» | **Non allineato** a `partner_logs` |
| `sponsor_messages` service | tabella DB | `addSponsorMessageAsync` — **zero wiring UI** | CRUD client pericoloso (B8) |

**Conclusione audit:** due stack convivono; consolidamento **post G-MSG-1** nel dominio Messaggistica autonomo (DL-024).

### Chat Utente ↔ Sponsor (fase 1)

- **NON eliminata** dal modello.
- **Disattivata** tramite feature flag `feature.comms.user_sponsor` — **Centro di Controllo** (DOC 30).
- Quando OFF: messaggio configurabile al posto dell'invio.
- Implementazione: **solo dopo G-MSG-1 step 5**.

### Privacy e disclosure (CRM)

Gli amministratori possono leggere le conversazioni CRM Sponsor.

| Dove comunicare | Gestione testi |
|-----------------|----------------|
| Informativa privacy | Centro di Controllo → Privacy e Termini (DOC 30) |
| Termini di utilizzo | Centro di Controllo (DOC 30) |
| Testi in-app chat | Centro di Controllo → Testi informativi |

### Requisiti Sponsor per il dominio Messaggistica (non RPC Sponsor)

| Requisito | Owner |
|-----------|-------|
| Thread ancorato a `sponsor_id` | Messaggistica (schema); Sponsor (business rule) |
| Vista admin: contratto, storico, rating, note nel CRM | Sponsor UI — `PartnerDetailModal` |
| Vista partner semplificata | Sponsor UI — `UserMessagesTab` |
| Invio/lettura messaggi | **RPC dominio Messaggistica** — non `send_sponsor_message` in perimetro Sponsor |
| Feature flag chat | Centro di Controllo (DOC 30) |

### Separazione responsabilità Sponsor ↔ Messaggistica

| Responsabilità | Sponsor (DOC 29) | Messaggistica (futuro SSOT) |
|----------------|------------------|----------------------------|
| Pipeline contratto, stati, approvazione | ✅ | ❌ |
| Permessi business «chi può parlare con chi» | Definisce regole | Enforcea via RPC |
| Storage messaggi, thread, read state | ❌ | ✅ |
| UI CRM integrata | ✅ (consumer) | Fornisce API/hook |
| Sicurezza GRANT `sponsor_messages` | Bonifica fino a migrazione | ✅ post-migrazione |
| Audit messaggi | ❌ | ✅ (+ audit Sponsor per azioni contratto) |

### Strategia migrazione (proposta audit)

| Fase | Azione |
|------|--------|
| **Sponsor Fase 1–4** | Bonifica sicurezza; **non** consolidare messaggi; stub/minimo contenimento B8 |
| **G-MSG-1 step 4** | Wireframe UI admin + partner approvati da PO |
| **Post step 5** | Nuovo dominio: schema `conversations` + `messages`; migrazione dati da `partner_logs` JSON |
| **Deprecazione** | `sponsor_messages` tabella legacy → redirect; rimuovere `partner_logs` JSON |
| **Sponsor UI** | Refactor `PartnerDetailModal` / `UserMessagesTab` come consumer |

### Collegamenti SSOT

- Centro di Controllo / feature flags: `AI_CONTEXT/30_PLATFORM_SETTINGS_MASTERPLAN.md`
- Messaggistica legacy parziale: `AI_CONTEXT/15_CRM_MESSAGING.md` (da riallineare post G-MSG-1)
- **Futuro:** `31_MESSAGING_MASTERPLAN.md` (o simile) — **solo dopo** G-MSG-1 step 4, non ora

---

## O7 — City Lifecycle e Sponsor (decisione PO)

### Matrice eventi

| Evento | Azione sul dominio Sponsor |
|--------|---------------------------|
| **Cambio nome città** | Nessuna |
| **Cambio slug città** | Nessuna |
| **Eliminazione città** | Sponsor interessati → stato **Da ricollegare** |
| **Ricreazione città** | Sponsor orfani → **ricollegamento automatico** |
| **Merge città** | Fuori perimetro masterplan |

### Stato «Da ricollegare»

| Campo | Significato |
|-------|-------------|
| Contratto | Resta attivo (non scaduto / non cancellato) |
| `city_id` | `null` o riferimento invalido |
| Visibilità territoriale | Sponsor non associato a città fino a ricollegamento |
| UI admin | Tab dedicata **Sponsor Scollegati** (DL-029): stato **Da ricollegare**, ultima città associata, modifica città/dati; ricollegamento → **Sponsor Attivi** |

### Gap oggi (evidenza `cityLifecycleService.ts`)

- `deleteCity` con `keepShops: true` imposta `city_id: null` su sponsors — **parzialmente allineato** ma senza stato esplicito «Da ricollegare» né UI.
- `deleteCity` con `keepShops: false` **elimina** sponsors — **in contrasto** con DL-022.
- `reclaimOrphanedItems` ricollega sponsor per match `address` ILIKE nome città — **allineato** al ricollegamento automatico su ricreazione.

### Implementazione target (Fase 4)

RPC `handle_city_deleted_for_sponsors` (o side effect atomico in RPC delete city): transizione a **Da ricollegare**, mai delete involontario contratto. Ricollegamento in `reclaimOrphanedItems` o RPC dedicata.

---

## Rating Sponsor — regola funzionale (decisione PO)

### Regola

1. Le **recensioni pubbliche** degli utenti sullo Sponsor (o risorsa collegata) generano una **media**.
2. Soglia default: **3 stelle** (configurabile — DOC 30).
3. Media **sotto soglia** → **alert amministratori** (notifica / badge pipeline Sponsor).
4. **Vietato:** sospensione automatica; mancato rinnovo automatico; qualsiasi azione senza intervento umano.

### Flusso decisionale umano (post-alert)

L'amministratore può, a sua discrezione:

- leggere conversazioni CRM;
- verificare recensioni;
- prendere provvedimenti manuali (estensione, terminazione, contatto partner, ecc.).

### Stato oggi (evidenza codice)

| Elemento | Stato |
|----------|-------|
| Campo Rating in `SponsorTable` | Presente — valore sempre **N/A** |
| `getSponsorRating` | **Stub** — ritorna `null` |
| Sistema recensioni generale | DOC 27 — POI, itinerari, shop, guide — **non collegato** al rating Sponsor in UI |
| Alert sotto soglia | **Non implementato** — target: evidenziazione + filtro «Solo sotto soglia» in Sponsor Attivi (DL-030) |

**Conclusione:** calcolo rating + UI alert da implementare; regola PO congelata in DL-021/DL-030.

---

## Tassonomia ruoli e identità utente

*Chiarimento terminologico (DEC-SUX / DL-033). Il termine «business» nei report precedenti si riferiva al **ruolo piattaforma** `business` in `profiles.role` — **non** a un concetto Auth separato, **non** al tier Sponsor Gold/Silver.*

### Ruoli piattaforma (`profiles.role`)

Definiti in `src/types/users.ts` (`UserRole`), persistiti in **`profiles.role`**, usati da RLS (`profiles.role IN (...)`), guard RPC (`is_td_admin()`), UI (`UserTable`, `AdminSidebar`) e `ROLE_PERMISSIONS` in `src/services/userService.ts`.

| Ruolo | Significato PO | Assegnazione |
|-------|----------------|--------------|
| **`user`** | Utente registrato (turista) | Default alla registrazione |
| **`business`** | Partner / Sponsor attivo (Silver e Gold — stesso ruolo piattaforma) | **Solo sistema** all'attivazione Sponsor (post approvazione admin) |
| **`admin_limited`** | Amministratore con permessi delegati | Solo `admin_all` via **Utenti & Ruoli** |
| **`admin_all`** | Super amministratore — controllo completo | Solo `admin_all` via **Utenti & Ruoli** |
| **`guest`** | Visitatore non autenticato | **Solo frontend/sessione** — non persistito in `profiles` |

**Regola PO:** l'utente **non sceglie mai** il proprio ruolo. Nessun campo «ruolo» nel form registrazione o candidatura.

### Stati account (`profiles.status` — `UserStatus`)

**Non sono ruoli.** Stati del profilo: `active`, `inactive`, `suspended`, `pending`. Gestiscono accesso/account lifecycle, non permessi Sponsor.

### Dominio Sponsor (non ruoli utente)

| Campo / concetto | Tabella | Significato |
|------------------|---------|-------------|
| **`tier`** (`gold` / `silver`) | `sponsors.tier` | Piano commerciale Sponsor — **non** `profiles.role` |
| **`plan`**, **`type`** | `sponsors` | Metadati contratto/commerciale |
| **`status`** contratto | `sponsors.status` | Stato pipeline contratto (attivo, scaduto, …) — distinto da `profiles.status` |

### Audience Feature Flag (DOC 30)

Valori come `business`, `registered`, `public` nel Centro di Controllo mappano a **tipologie utenza** per i toggle — `business` = utenti con `profiles.role = 'business'`. Non creano ruoli aggiuntivi.

### Acquisto crediti AI

**Non modifica** `profiles.role`. Resta `user` o `business` indipendentemente dal wallet crediti.

### Altri concetti «business» nel repo (non ruoli utente)

| Contesto | Dove | Nota |
|----------|------|------|
| `city_type = 'business'` | Packing / catalogo valigia | Categoria territoriale — irrilevante per ruoli |
| «mutazioni di business» | Architettura F1 | Significa operazioni di dominio commerciale, non il ruolo `business` |

---

## Flusso UX — Diventa Sponsor (O11 / DL-033)

*Percorso ufficiale target. Stato oggi indicato come **GAP** dove diverge.*

### Pipeline definitiva (PO)

```
Registrazione
    → username obbligatorio
    → username univoco
    → email obbligatoria
    → conferma email
    → login
    → invio candidatura Sponsor
    → approvazione amministratore
    → attivazione Sponsor
    → assegnazione automatica ruolo `business` (sistema)
```

### Punti di ingresso UI (invariati)

| # | Percorso utente |
|---|-----------------|
| 1 | **Homepage** → placeholder / banner Partner → modale **Diventa Partner** |
| 2 | **Pagina Città** → header → pulsante tier sponsor (gold/silver) → modale |
| 3 | **Shop pubblico** → header → **Diventa Partner Shopping** → modale |
| 4 | **Sidebar diario** → placeholder sponsor → modale |
| 5 | **Dettaglio POI** → suggerimento modifica / claim → **PoiClaimModal** (stesso form sponsor) |

**Prerequisiti ingresso modale:** nessuno (apribile senza login). **Prerequisiti invio:** account registrato e autenticato (DL-033).

### Flusso target dettagliato

```
Apri modale → Scegli tipo partner → Scegli piano/prezzo → Compila form
    │
    ├─ [Già loggato] ──► Invia Candidatura ──► Richiesta creata ──► Conferma
    │
    └─ [Non loggato] ──► Form registrazione (username, email, password)
              │
              ▼
         Conferma email (obbligatoria)
              │
              ▼
         Login
              │
              ▼
         Invia Candidatura ──► Richiesta (profile_id = auth.uid()) ──► Conferma
              │
              ▼
    [Admin] Approva → Attiva ──► profiles.role := 'business' (automatico)
```

**Messaggio conferma:** ringraziamento + attesa valutazione admin. **Vietate** richieste anonime (`profile_id` null).

### Flusso oggi (GAP — audit codice)

```
Apri modale → … → Invia Candidatura
    │
    ├─ [Loggato] ──► INSERT con profile_id (parziale verso target)
    │
    └─ [Non loggato] ──► INSERT senza account (profile_id null) ──► GAP O1/DL-033
              └── Form non raccoglie username; conferma email non orchestrata
```

### Verifiche implementative (non decisioni PO)

| ID | Verifica |
|----|----------|
| VT-SUX-01 | Form raccolge username obbligatorio e univoco |
| VT-SUX-02 | Flusso conferma email Supabase prima dell'invio candidatura |
| VT-SUX-03 | RPC attivazione imposta `profiles.role = 'business'` automaticamente |

---

## Matrice permessi target — Sponsor (O4)

*Allineamento obbligatorio a `ROLE_PERMISSIONS` e pannello **Utenti & Ruoli** (DL-027). Implementazione deve colmare gap UI/policy.*

| Capacità | `admin_all` | `admin_limited` | `business` (`profiles.role`) | Utente registrato (`user`) |
|----------|-------------|-----------------|------------------------------|----------------------------|
| Accedere Admin → Attività & Sponsor | ✅ | ✅ | ❌ | ❌ |
| Leggere richieste / contratti | ✅ | ✅ | Solo propri | Solo propri |
| Approva / Rifiuta / Attiva | ✅ | ✅ | ❌ | ❌ |
| Estendi contratto (singolo / massivo checkbox) | ✅ | ✅ | ❌ | ❌ |
| Termina / cancella contratto | ✅ **solo** (DL-034) | ❌ | ❌ | ❌ |
| Elimina (singolo / bulk) | ✅ | ❌ | ❌ | ❌ |
| CRM messaggi (admin): leggere e scrivere | ✅ | ✅ | ❌ | ❌ |
| Messaggi (partner) | ❌ | ❌ | ✅ (propri) | ❌ |
| Invio candidatura Sponsor | ❌ | ❌ | ✅ | ✅ (post DL-033) |
| Gestione Shop → sync sponsor | ❌ | ❌ | ✅ | ❌ |
| Modificare privilegi / ruoli | ✅ (Utenti & Ruoli) | ❌ | ❌ | ❌ |

**Gap implementativo oggi:** UI mostra pulsanti non ancora allineati; policy `sponsor_messages` esclude ancora `admin_limited` e usa `admin_city` fantasma (B5) — target DL-027.

---

## Policy eliminazione RPC legacy (O9)

| RPC | Frontend | Altre RPC | Trigger | Scheduler | DB (RLS/funzioni) | **Eliminabile?** |
|-----|----------|-----------|---------|-----------|-------------------|------------------|
| `approve_sponsor_with_subscription` | ❌ | ❌ | ❌ | N/D | ❌ (assente remoto) | ✅ **Solo da repo** (`update_rpc.sql`) |
| `activate_sponsor_with_resource` | ✅ | ❌ | ❌ | N/D | ❌ | ❌ **Sostituire** con `activate_sponsor_from_request` (DL-017), poi rimuovere |
| `can_manage_sponsor` | ❌ diretto | ❌ | ❌ | N/D | ✅ **RLS sponsors** | ❌ **Mantenere** (o inlined in policy post-refactor) |
| `mark_expired_sponsors` | ❌ | ❌ | ❌ | **Non dimostrabile** | ❌ | ❌ **Non eliminare** finché scheduler non verificato |
| `update_expired_sponsors` | ❌ | ❌ | ❌ | **Non dimostrabile** | ❌ | ❌ idem |
| `check_and_expire_subscriptions` | ❌ | ❌ | ❌ | **Non dimostrabile** | ❌ | ❌ idem |

**Regola PO:** finché scheduler esterno / `pg_cron` non è auditato, le tre RPC di scadenza **restano**.

---

## Architettura target

(Vedi v0.1.0 — invariata salvo decisioni O1–O11)

### Principi

Allineati a **Architettura congelata** F1–F10.

### Diagramma logico

```
Browser (authenticated + JWT; anon solo READ bootstrap)
├─ READ ──────────────► SELECT via RLS
├─ PARTNER SUBMIT ────► signup (se guest) + INSERT scoped request (O1)
└─ ADMIN/BUSINESS ────► RPC gateway (EXECUTE only)
```

### State machine target

`pending` → (`approve`) → `waiting_payment` → (`activate`) → `converted` + `sponsors.approved`
`pending` → (`reject`) → `rejected`
`sponsors` → (`cancel` / `expire`) → `cancelled` / `expired`

*Tab UI admin (O5 / DL-010, DL-029): Nuove Richieste → Attesa Pagamenti → Sponsor Attivi → **Sponsor Scollegati** → Scaduti → Rifiutati → Annullati.*

### Famiglia RPC target (definitiva — nessun parallelo)

| Fase | RPC | Sostituisce |
|------|-----|-------------|
| Richiesta | `approve_sponsor_request`, `reject_sponsor_request`, `update_sponsor_request_admin_notes`, `delete_sponsor_request` | CRUD diretto requests |
| Attivazione | **`activate_sponsor_from_request`** (unica, atomica) | `createSponsorFromRequest` + **`activate_sponsor_with_resource`** (deprecare) |
| Contratto | `cancel_sponsor_contract`, `extend_sponsor_contract`, `extend_sponsors_bulk` | CRUD/stub sponsors; audit CRM DL-023 |
| Partner/shop | `sync_sponsor_profile_from_shop` | `shopService` UPDATE diretto (O6) |
| Messaggi | *(dominio Messaggistica — post G-MSG-1)* | `partner_logs`, `sponsor_messages`, CRUD B8 |
| Audit | ogni RPC admin scrive audit log (O8) | — |

**Vietato:** mantenere `activate_sponsor_with_resource` in parallelo dopo migrazione (DL-017).

---

## Piano di migrazione

| Fase | Nome |
|------|------|
| **0** | Inventario remoto (SQL Pack) |
| **1** | Contenimento critico (RPC esistente, messages, INSERT anon) |
| **2** | RPC gateway richieste |
| **3** | Unificazione attivazione |
| **4** | RPC contratti + shop + city |
| **5** | Contenimento messaggi legacy (B8) — **non** consolidamento |
| **6** | Governance, audit Sponsor |
| **7** | Dominio Messaggistica — **solo post Gate G-MSG-1** |

**Gate Fase 1:** stato *Pronto per Implementazione*.

**Gate G-MSG-1:** blocca Fase 7 fino a completamento step 1–4. Lo step 5 abilita sviluppo Messaggistica; **non** implica da solo trasferimento ownership — vedi chiarimento in sezione O2.

---

## Definition of Done

> **Promemoria gate documento:** i DoD sotto certificano che il **progetto** è pronto ad avviare l'implementazione. I gap B1–B10 restano **debito implementativo** da chiudere nelle Fasi 1–6 — coerente con *Pronto per Implementazione*, non con *Implementato*.

Criteri **oggettivi** per passare da **In Analisi** a **Pronto per Implementazione**. Tutti devono essere **soddisfatti**; nessuna valutazione soggettiva.

| # | Criterio | Verifica oggettiva | Stato |
|---|----------|-------------------|-------|
| **DoD-1** | SQL Pack completato | Tutte le query Appendice B (B1–B7) eseguite su remoto; esiti registrati in *Verifiche completate* | ☑ |
| **DoD-2** | Verifiche pre-implementazione concluse | Tutte le voci in § *Verifiche pre-implementazione* ☑; evidenze implementative tracciate in § *Verifiche ed evidenze — implementazione* | ☑ |
| **DoD-3** | Nessun problema bloccante aperto | Sezione *Problemi confermati → Bloccanti* (B1–B10): tutti risolti o accettati con DL di deroga esplicita | ☑ |
| **DoD-4** | Decisioni O1–O11 chiuse | Tutte le decisioni PO registrate; nessuna voce in *Decisioni PO — stato* aperta | ☑ |
| **DoD-5** | Architettura congelata confermata | F1–F10 invariate; famiglia RPC target con nomi definitivi; state machine documentata senza ambiguità | ☑ |
| **DoD-6** | Roadmap congelata | *Piano di migrazione* Fasi 0–6 approvate (PO 2026-07-14); tab Sponsor Scollegati; checklist § Implementazioni | ☑ |
| **DoD-7** | Decision Log aggiornato | DL-027–DL-031 registrati; decisioni PO review 2026-07-14 | ☑ |
| **DoD-8** | Documentazione coerente (gate *Pronto*) | Q1–Q9 documentate con No/Sì/Parziale **accettati** per gate *Pronto* (§ Q1–Q9); riferimenti SSOT coerenti; delta repo documentato in B1–B10 + DL-031 | ☑ |
| **DoD-9** | Implementazione pianificata | Checklist implementazione completa, ordinata, con dipendenze esplicite tra voci; gate *Implementazione in Corso* definito | ☑ |

**Gate *Implementazione in Corso* (DoD-9):** stato documento = *Pronto per Implementazione* + approvazione PO esplicita avvio WF-02 STEP-2 + prima migration/RPC avviata.

**Procedura di transizione stato:**

1. Revisore (umano o AI con approvazione esplicita) compila la colonna *Stato* marcando ogni DoD.
2. Se **tutti** ☐ → ☑, aggiornare tabella *Stato del documento* → **Pronto per Implementazione**, versione e cronologia.
3. Se anche un solo DoD non è soddisfatto, lo stato resta **In Analisi**.

*Passaggio a **Implementazione in Corso**:* tutti i DoD soddisfatti + approvazione esplicita di inizio lavori + prima voce checklist implementazione avviata.

*Passaggio a **Implementato**:* checklist *Implementazioni da eseguire* Fasi 1–6 ☑ + Q1–Q9 gate ***Implementato*** (§ Q1–Q9) confermate post-deploy + audit finale registrato.

---

## Implementazioni da eseguire

### Pre-implementazione

- [x] Verifiche pre-implementazione chiuse (DoD-2 ☑ — 2026-07-14)
- [x] Tutte le decisioni O1–O11 chiuse (v0.6.0)
- [x] Decisioni PO review 2026-07-14 (DL-027–031)
- [x] Piano mitigazione B1–B10 accettato (DL-031)
- [x] Q1–Q9 documentate — gate *Pronto* soddisfatto (DoD-8 ☑)
- [x] Stato → **Pronto per Implementazione** (2026-07-14 — WF-02 STEP-1 chiuso)

### Implementazione (ordine vincolante — Fasi 0–6)

- [x] **Fase 1** — Contenimento critico (P0: B9, B2, B7, B1, B6, B8, B5) — migration `20260714160000` ☑ 2026-07-14
- [x] **Fase 2** — RPC gateway richieste (`approve_sponsor_request`, …) — migration `20260714170000` ☑ 2026-07-14
- [x] **Fase 3** — `activate_sponsor_from_request` unificata (DL-017) — migration `20260714173000` ☑ 2026-07-14
- [ ] **Fase 4** — RPC contratti, shop sync, city lifecycle + tab Sponsor Scollegati (DL-029) — migration `20260714180000` presente; chiusura pending lint/review
- [ ] **Fase 5** — Contenimento messaggi legacy B8 (non consolidamento)
- [ ] **Fase 6** — Governance: audit O8, signup O1/O11, rating UI DL-030, matrice O4/DL-027

**Dipendenze:** Fase N+1 dopo Fase N salvo contenimento P0 parallelo documentato. Fase 7 → solo post G-MSG-1.

### Post-implementazione

- [ ] Stato → **Implementato**
- [ ] Q1–Q9 gate ***Implementato*** confermate post-deploy (§ Q1–Q9)
- [ ] Aggiornare DOC 15, `06_CHANGE_IMPACT_RULES`, `09_SYSTEM_COVERAGE_MAP`

---

## Rischi

| Rischio | Mitigazione |
|---------|-------------|
| Implementazione parziale | Gate masterplan |
| RPC attivazione invocabile da non-admin | Fase 1 contenimento |
| Gap repo/remoto | SQL Pack Fase 0 |
| Doppio CRM | O2 / DL-018 (motore unificato) |
| Shop/city bypass | Fase 4 + F10 |

---

## Dipendenze

`profiles` / `is_td_admin`, `pricing_versions`, risorse POI/shop/guide/operator, `subscriptions`, `cities`, `notificationService`, `shopService`, `server/supabaseAdmin` (read bootstrap OK).

---

## Note

### File codice rilevanti

Vedi v0.1.0 — path invariati.

### Stati sponsor (governance)

Pipeline richiesta: `pending`, `waiting_payment`, `converted`, `approved`, `rejected`, `cancelled`.

Contratto attivo: `expired` (runtime su scadenza).

**Da ricollegare** (O7 / DL-022): contratto non terminato con legame città perso dopo eliminazione città — distinto da `expired` / `cancelled`.

### Cronologia documento

| Versione | Data | Modifiche |
|----------|------|-----------|
| 0.1.0 | 2026-07-13 | Creazione iniziale (`docs/architecture/`) |
| 0.2.0 | 2026-07-13 | Spostamento SSOT in `AI_CONTEXT/`; Architettura congelata; metodologia; Q1–Q9; V7–V11; stati doc estesi |
| 0.2.1 | 2026-07-13 | Decision Log (DL-001–DL-008); regole storico immutabile |
| 0.3.0 | 2026-07-13 | Glossario; Fuori Perimetro; Definition of Done (DoD-1–DoD-9) |
| 0.3.1 | 2026-07-13 | V12 B1 remoto: matrice GRANT dominio Sponsor; B8; aggiornamento Q6/Q8, A7, A10 |
| 0.4.0 | 2026-07-13 | SQL Pack B2–B7 completato (V13–V18); B9–B10, A11–A15; Priorità implementazione; Fonte evidenza/Confidence; DoD-1 ☑; voto 3/10 |
| 0.4.1 | 2026-07-13 | Validazione decisioni PO: approvati O3/O5/O6/O8 (DL-009–012); O1/O4/O9 restano aperte con evidenze |
| 0.5.0 | 2026-07-13 | Chiusura PO: O1, O4, O9, O11 (DL-013–016); DL-017 attivazione unica; Flusso UX; Matrice permessi; Appendice C stub |
| 0.6.0 | 2026-07-13 | Chiusura PO: O2 (DL-018–020), O7 (DL-022), O10 (DL-023), Rating (DL-021); DoD-4 ☑ |
| 0.7.0 | 2026-07-13 | Centro di Controllo; Messaggistica dominio autonomo (DL-024–026); Gate G-MSG-1; thread per Sponsor |
| 0.7.1 | 2026-07-13 | Ownership dominio Sponsor; regola DL trasferimento responsabilità; chiarimento G-MSG-1 vs ownership Messaggistica |
| 0.8.0 | 2026-07-14 | Review PO: DL-027–031; tab Sponsor Scollegati; rating UI; Write Gateway |
| 0.9.0 | 2026-07-14 | Chiusura DEC-A12/SUX/TERM: DL-032–034; tassonomia ruoli; pipeline Diventa Sponsor; VT-SPONSOR-PUBLIC-READ |
| 0.9.1 | 2026-07-14 | V20: verifica remota read-only `profiles.role` e residuo `admin_city`; bonifica tracciata in WF-02 Fase 2.1 |
| 0.10.0 | 2026-07-14 | Riclassificazione verifiche pre-impl vs implementazione; DoD-2/DoD-8 ☑; Q1–Q9 gate *Pronto* vs *Implementato*; stato **Pronto per Implementazione**; WF-02 STEP-1 chiuso |
| 0.10.1 | 2026-07-14 | Chiarezza audit vs progetto vs implementazione; nota debito B1–B10; § *Perché Pronto per Implementazione* |
| 0.11.0 | 2026-07-14 | WF-02 Fase 2.1 implementata: contenimento P0 (RPC hardening, policy messages, INSERT anon, VT-SPONSOR-PUBLIC-READ); stato **Implementazione in Corso** |
| 0.11.1 | 2026-07-16 | DL-035: ricognizione ID dual-family; puntamento a DOC 33; ID Governance non approvata |

---

## Aggiornamenti al Masterplan

*Sessione 2026-07-14 — implementazione WF-02 Fase 2.1*

- **Migration:** `20260714160000_sponsor_phase1_critical_containment.sql`
- **Chiusi:** B9, B2, B7, B6, B5, A11 (policy messages); VT-SPONSOR-PUBLIC-READ (anon); guard client submit O1 (parziale — signup UX in Fase 2.6)
- **Aperti:** B1 (Fase 2.2), B8 REVOKE CRUD messages (Fase 2.5), B10 (P1)
- **Stato documento:** *Implementazione in Corso* (v0.11.0)

*Sessione 2026-07-14 — rifinitura chiarezza v0.10.1*

- **Tre livelli:** audit concluso · progetto approvato · implementazione da avviare
- **Nota debito:** B1–B10/A*/C* = debito implementativo PO-accettato (DL-031), non blocco gate *Pronto*

*Sessione 2026-07-14 — chiusura WF-02 STEP-1 / gate Pronto*

- **Riclassificazione:** 11 voci spostate in § *Verifiche ed evidenze — implementazione*; DoD-2 ristretto a pre-impl
- **DoD-2, DoD-8:** ☑ — gate *Pronto per Implementazione* soddisfatto
- **Stato documento:** *Pronto per Implementazione* (v0.10.0)
- **Autorizzazione:** avvio WF-02 STEP-2 Fase 2.1 — Validazione PO STEP-1 Approvato 2026-07-14

*Sessione 2026-07-14 — chiusura decisioni PO*

- **Decisioni chiuse:** DL-032 (DEC-A12 visibilità pubblica), DL-033 (DEC-SUX pipeline signup), DL-034 (DEC-TERM solo admin_all)
- **Tassonomia ruoli:** chiarimento `business` = `profiles.role`; tier Gold/Silver = `sponsors.tier`
- **Verifica tecnica:** VT-SPONSOR-PUBLIC-READ (colonne sensibili API) — non decisione PO
- **Decisioni PO aperte:** nessuna

*Sessione 2026-07-14 — verifica remota ruoli / `admin_city`*

- **V20:** interrogazione diretta DB remoto (read-only) — 0 profili `admin_city`; unico residuo = policy RLS `sponsor_messages`
- **WF-02:** nota operativa bonifica in Fase 2.1 (B5 / DL-027); nessun codice/migration in questa attività

*Sessione 2026-07-14 — review PO con ChatGPT*

- **Decisioni approvate:** DL-027–031
- **DoD:** 3, 5, 6, 7, 9 → ☑; restano DoD-2 (verifiche runtime), DoD-8 (Q post-impl)
- **Modifiche roadmap:** tab **Sponsor Scollegati** in pipeline O5

---

## Appendice A — Matrice operazioni (snapshot)

| Operazione | Service | Metodo | Tabella | Rischio | Target |
|------------|---------|--------|---------|---------|--------|
| Invio richiesta | `submitSponsorRequest` | INSERT | `sponsor_requests` | M | INSERT scoped |
| Approvazione | `updateSponsorStatus` | UPDATE ❌ | `sponsor_requests` | B | RPC |
| Rifiuto | `rejectSponsor` | UPDATE ❌ | `sponsor_requests` | B | RPC |
| Note admin | `updateSponsorInternalNotes` | UPDATE ❌ | requests/sponsors | B | RPC |
| Partner log | `addPartnerLogAsync` | UPDATE ❌ | `sponsor_requests` | A | RPC / messages |
| Delete richiesta | `deleteSponsor` | DELETE ❌ | `sponsor_requests` | B | RPC |
| Pre-attivazione | `createSponsorFromRequest` | INSERT | `sponsors` | B | **Deprecare** → `activate_sponsor_from_request` |
| Attivazione | `activateSponsorWithResourceAsync` | RPC | multi | B | **Sostituire** → `activate_sponsor_from_request` (DL-017) |
| Cancellazione | `cancelSponsor` | UPDATE | `sponsors` | B | RPC |
| Estensione | stub | — | `sponsors` | A | RPC |
| Shop sync | `shopService` | UPDATE | `sponsors` | A/B | RPC partner |
| City lifecycle | `cityLifecycleService` | UPDATE/DEL | `sponsors` | B | RPC/backend |
| Messaggi | `sponsorMessagesService` | INSERT/UPD | `sponsor_messages` | A | RPC / policy fix |
| Liste/read | vari | SELECT | varie | L | RLS |

---

## Appendice B — SQL Pack (solo lettura, remoto)

Eseguire via `supabase db query --linked` o SQL Editor. Registrare esiti in *Verifiche completate*.

### Avanzamento SQL Pack

| Query | Descrizione | Stato | Verifica |
|-------|-------------|-------|----------|
| **B1** | Privilegi tabella dominio Sponsor | ✅ Completata | V12 |
| **B2** | RLS enabled | ✅ Completata | V13 |
| **B3** | Policy complete (testo USING/WITH CHECK) | ✅ Completata | V14 |
| **B4** | `has_table_privilege` summary | ✅ Completata | V15 |
| **B5** | RPC sponsor: SECURITY DEFINER + EXECUTE | ✅ Completata | V16 |
| **B6** | `approve_sponsor_with_subscription` esiste? | ✅ Completata | V17 (assente) |
| **B7** | Owner tabelle | ✅ Completata | V18 |

```sql
-- B1 Privilegi tabelle sponsor domain
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('sponsor_requests','sponsors','sponsor_messages','subscriptions')
  -- Nota V12: sponsor_subscriptions non esiste su remoto; tabella subscription (sing.) senza grant client
  AND grantee IN ('authenticated','anon','service_role')
ORDER BY table_name, grantee, privilege_type;

-- B2 RLS enabled
SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('sponsor_requests','sponsors','sponsor_messages','subscriptions');

-- B3 Policy complete
SELECT c.relname, pol.polname, pol.polcmd,
       pg_get_expr(pol.polqual, pol.polrelid) AS using_expr,
       pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check_expr
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('sponsor_requests','sponsors','sponsor_messages','subscriptions')
ORDER BY c.relname, pol.polname;

-- B4 has_table_privilege summary
SELECT t.tablename,
       has_table_privilege('authenticated', 'public.'||t.tablename, 'SELECT') AS auth_sel,
       has_table_privilege('authenticated', 'public.'||t.tablename, 'INSERT') AS auth_ins,
       has_table_privilege('authenticated', 'public.'||t.tablename, 'UPDATE') AS auth_upd,
       has_table_privilege('authenticated', 'public.'||t.tablename, 'DELETE') AS auth_del
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename IN ('sponsor_requests','sponsors','sponsor_messages','subscriptions');

-- B5 RPC sponsor: definizione e EXECUTE
SELECT p.proname,
       p.prosecdef AS security_definer,
       pg_get_function_identity_arguments(p.oid) AS args,
       array_agg(DISTINCT acl.privilege_type || ':' || acl.grantee::text) AS grants
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
LEFT JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) AS acl ON true
WHERE n.nspname = 'public'
  AND p.proname LIKE '%sponsor%'
GROUP BY p.oid, p.proname, p.prosecdef
ORDER BY p.proname;

-- B6 approve_sponsor_with_subscription esiste?
SELECT proname FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND proname = 'approve_sponsor_with_subscription';

-- B7 Owner tabelle (parentesi corrette)
SELECT tablename, tableowner FROM pg_tables
WHERE schemaname = 'public'
  AND (tablename LIKE 'sponsor%' OR tablename = 'subscriptions')
ORDER BY tablename;
```

---

## Appendice C — Stub UI (O10)

*Stato decisione PO: **chiusa** (DL-023). Inventario e target implementazione.*

| # | Pulsante / funzione | Percorso UI | Decisione PO / target |
|---|---------------------|-------------|------------------------|
| C-1 | **Estensione** (toolbar massiva) | Admin → **Pannello Admin** → Attività & Sponsor → tab **SPONSOR ATTIVI** → seleziona card con **checkbox** → toolbar → **Estensione** | ✅ Solo sponsor **checkbox selezionati** (DL-028); stessa RPC C-2 con `ids[]`; audit CRM obbligatorio |
| C-2 | **Estendi / Rinnova** (singola) | Admin → … → SPONSOR ATTIVI → card contratto → **Estendi** / **Rinnova** | ✅ `extend_sponsor_contract` — chi, quando, giorni, motivazione |
| C-3 | **Elimina (N)** bulk | Admin → … → checkbox card → **Elimina (N)** (solo `admin_all`) | ✅ RPC bulk delete + audit (O8) |
| C-4 | **Ignora** alert storico | Admin → … → banner rosso «Partner con storico negativo» → **Ignora** | ✅ Persistenza preferenza admin (`getDismissedAlerts` oggi stub) |
| C-5 | **Rating** in card | Admin → … → SPONSOR ATTIVI → campo **Rating** (stelle) | ✅ Implementare calcolo + alert DL-021 (oggi sempre N/A) |
| C-6 | **Invia** messaggio partner | Profilo → **Business Dashboard** → sidebar **Supporto Partner** → conversazione → **Invia** | ✅ Motore unificato DL-018; rispettare toggle chat fase 1 (DL-019) |
| C-7 | Segna letti (partner) | Stessa schermata C-6 — apertura conversazione | ✅ `mark_sponsor_messages_read` (oggi `markUserLogsAsRead` stub) |
| C-8 | `togglePartnerLogReadStatus` | *(nessun pulsante UI)* | ✅ **Codice morto** — eliminare in cleanup (nessun import nel codebase) |
| C-9 | `getDismissedAlerts` | Interno `SponsorTable` — logica banner C-4 | ✅ Implementare persistenza (oggi ritorna `[]`) |

### Estensione contratto — specifica PO (DL-023)

| Campo audit CRM | Obbligatorio |
|-----------------|--------------|
| Operatore (chi) | Sì |
| Timestamp (quando) | Sì |
| Giorni aggiunti | Sì |
| Motivazione | Sì (es. compensazione blackout) |

**Caso d'uso principale:** compensazioni commerciali (es. blackout piattaforma).

**Nota:** pulsante **Elimina** singolo (super admin) **non** è stub — usa `deleteSponsor` reale (oggi su `sponsor_requests`; da allineare a RPC).

---

## Aggiornamenti al Masterplan (cronologia sessioni)

*Sessione 2026-07-14 — review PO:* vedi blocco sopra (v0.8.0).

*Sessione 2026-07-13 — v0.7.1:* Ownership dominio Sponsor; G-MSG-1 vs ownership Messaggistica.
