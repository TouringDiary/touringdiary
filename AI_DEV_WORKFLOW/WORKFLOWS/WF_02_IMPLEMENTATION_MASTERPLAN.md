# WF-02 — Implementation Masterplan

> **Piano operativo di sviluppo** — traccia avanzamento, STEP, Fasi e gate.
> **Non** duplica architettura, Gate né DoD di dominio. Verità tecnica → SSOT in `AI_CONTEXT/`.

---

## Metadati

| Campo | Valore |
|-------|--------|
| **ID** | WF-02 |
| **Nome** | Implementation Masterplan |
| **Stato Workflow** | Attivo |
| **SSOT** | `AI_CONTEXT/29_SPONSOR_SECURITY_MASTERPLAN.md` · `AI_CONTEXT/30_PLATFORM_SETTINGS_MASTERPLAN.md` · `AI_CONTEXT/31_PACKING_SUITCASE_SYSTEM.md` (vincoli integrazione) · `AI_CONTEXT/32_DESIGN_SYSTEM_FOUNDATION.md` (vincoli UI/layering) |
| **Owner** | PO + AI |
| **Creato** | 2026-07-14 |
| **Ultimo aggiornamento** | 2026-07-23 |
| **Aggiornato da** | PO — collaudi Centro di Controllo / Audit B chiusi; STEP-4 non avviato (hold attività PO) |

---

## Obiettivo

Eseguire in ordine progressivo le implementazioni approvate negli SSOT dominio **Sponsor** (DOC 29) e **Centro di Controllo** (DOC 30), rispettando gate, architettura congelata e sequenza G-MSG-1, fino a stabilizzazione e chiusura formale del Workflow.

**Fuori perimetro WF-02:** dominio Messaggistica unificato (DOC 29 Fase 7 / G-MSG-1 step 5); **Privacy avanzata** (compliance estesa — WF-03, DL-P09 DOC 30).

---

## Motivazione

- DOC 29 in stato **Pronto per Implementazione** (v0.10.0 — STEP-1 chiuso 2026-07-14).
- DOC 30: gate **G-CC-1** ☑; decisioni DOC 30 chiuse (DL-P10–P11).
- WF-01 ha consolidato la documentazione; il passo successivo è tradurre le decisioni approvate in implementazione verificabile.
- DOC 31 e DOC 32 sono **certificati** — non richiedono STEP dedicati; impongono vincoli di integrazione e UI sui lavori di questo WF.

---

## Prerequisiti

| Prerequisito | Stato | Nota |
|--------------|-------|------|
| WF-01 chiuso formalmente | ☑ | Assunto PO 2026-07-14 |
| SSOT DOC 29, 30, 31, 32 letti e linkati | ☑ | Confermato chiusura STEP-1 2026-07-14 |
| `06_CHANGE_IMPACT_RULES.md` letto | ☑ | Prerequisito codice — confermato STEP-1 2026-07-14 |
| `03_PROJECT_STATUS.md` allineato | ☑ | Aggiornato all'apertura WF-02 2026-07-14 |

---

## Gate tracciati (definizione solo negli SSOT)

| Gate | SSOT | Sezione / ID | Stato | Evidenza (1 riga) |
|------|------|--------------|-------|-------------------|
| Pronto per Implementazione DOC 29 | DOC 29 | DoD-1–DoD-9 | ☑ | DoD-1–9 ☑; v0.10.0; WF-02 STEP-1 chiuso 2026-07-14 |
| **G-CC-1** | DOC 30 | Gate progettuali | ☑ | DoD-P1–P8 ☑ (2026-07-14 review PO) |
| **G-MSG-1 step 1–2** | DOC 29 / DOC 30 | D24 / Gate progettuali | ☑ | STEP-2 chiuso 2026-07-17 |
| **G-MSG-1 step 3–5** | DOC 29 / DOC 30 | D24 / Gate progettuali | ☐ | Step 3–4 in STEP-4; step 5 fuori WF-02 |
| **G-AI-SEP** | DOC 30 | DL-P08 | ☑ | AI Control Center ≠ Centro di Controllo |
| Gate Fase 1 Sponsor (implementazione) | DOC 29 | Piano migrazione | ☑ | DOC 29 *Pronto per Implementazione* |
| Fase 7 Messaggistica | DOC 29 | Piano migrazione | ⛔ | Bloccata da G-MSG-1 — fuori WF-02 |

---

## Rischi evidenziati (riferimento SSOT — non ridefiniti qui)

| Rischio | SSOT | Mitigazione registrata |
|---------|------|------------------------|
| Implementazione parziale Sponsor | DOC 29 § Rischi | Gate masterplan; implementazione unica (D5/DL-004) |
| RPC attivazione invocabile da non-admin | DOC 29 § Rischi | Fase 1 contenimento (P0 B9) |
| Gap repo/remoto | DOC 29 § Rischi | SQL Pack Fase 0 (DoD-1 ☑) |
| Doppio CRM / messaggi legacy | DOC 29 § O2 | Contenimento B8 Fase 5; consolidamento post G-MSG-1 |
| Shop/city bypass sicurezza | DOC 29 § Rischi | Fase 4 + F10 |
| Overlap AI Control Center | DOC 30 DL-P08 | **Risolto** — G-AI-SEP: strumenti separati |
| Manutenzione vs News Ticker | DOC 30 DL-P06 | Messaggio fisso in News Bar; altre news scorrono |
| Regressioni UI modali/layering | DOC 32 § Rischi | Foundation + `lint:layers` su superfici toccate |

---

## Dipendenze

| Da | Verso | Tipo | SSOT |
|----|-------|------|------|
| WF-01 | WF-02 | Sequenza Workflow | `02_GOVERNANCE.md` §3 |
| STEP-1 | STEP-2 | Gate implementazione Sponsor | DOC 29 DoD + gate Fase 1 |
| STEP-2 | STEP-3 | Sequenza G-MSG-1 step 2 | DOC 29 D24 / DOC 30 G-MSG-1 |
| STEP-1 (G-CC-1) | STEP-3 | Gate Centro di Controllo | DOC 30 G-CC-1 |
| DOC 30 Configuration Source | DOC 29 runtime | Consumer flag/soglie | DOC 30 § Sez. 3; DOC 29 O2/D17 |
| DOC 32 Foundation/layering | STEP-2, STEP-3 UI | Vincolo trasversale | DOC 32 § Foundation, § Focus |

---

## Definition of Done — Workflow (finale)

| # | Criterio | Verifica |
|---|----------|----------|
| **DoD-WF-1** | Tutti gli STEP 1–4 = **Completato** con validazione PO | Tabella stato STEP |
| **DoD-WF-2** | DOC 29 → stato **Implementato**; checklist *Implementazioni da eseguire* Fasi 1–6 ☑ | DOC 29 § Implementazioni |
| **DoD-WF-3** | DOC 30 Centro di Controllo operativo secondo sezioni in scope; G-CC-1 soddisfatto a inizio e mantenuto | DOC 30 § In scope |
| **DoD-WF-4** | G-MSG-1 step 1–4 completati; step 5 **non** avviato in questo WF | Gate tracciati |
| **DoD-WF-5** | Nessun gate tracciato ☐ senza deroga PO documentata | Tabella gate |
| **DoD-WF-6** | `03_PROJECT_STATUS.md` e `01_EXECUTION_ROADMAP.md` aggiornati | Chiusura formale |
| **DoD-WF-7** | Validazione PO finale registrata | Sezione Chiusura Workflow |

---

## Stato avanzamento (ricostruzione rapida)

> Indicare **Workflow → STEP → Fase** per riprendere i lavori senza rileggere gli SSOT.

| Campo | Valore corrente |
|-------|-----------------|
| **Workflow** | WF-02 — Attivo |
| **STEP** | STEP-3 — Centro di Controllo (DOC 30) |
| **Fase** | Post-3.4 — **pronto al passaggio successivo** (Audit B chiuso; STEP-4 non avviato) |
| **% convenzionale** | 99 % |

---

# STEP-1 — Prontezza SSOT e gate di implementazione

### Prerequisiti per iniziare lo STEP

- [x] WF-01 chiuso formalmente
- [x] SSOT DOC 29, 30, 31, 32 letti e linkati nel WF
- [x] `06_CHANGE_IMPACT_RULES.md` letto
- [x] `03_PROJECT_STATUS.md` allineato all'apertura WF-02

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Portare DOC 29 a *Pronto per Implementazione*; confermare G-CC-1 ☑ DOC 30 |
| **Motivazione** | G-CC-1 ☑ (review PO 2026-07-14); gate analitico Sponsor prima del codice |
| **Dipendenze** | WF-01 chiuso; prerequisiti lettura SSOT |
| **Stato STEP** | **Completato** |
| **Deliverable** | DOC 29 e DOC 30 aggiornati con DoD ☑; gate tracciati STEP-1 ☑; autorizzazione PO a codificare |
| **DoD STEP** | DOC 29 = *Pronto per Implementazione*; DOC 30 G-CC-1 ☑ (DoD-P1–P8); validazione PO STEP-1 registrata |
| **Validazione PO** | **Approvato** — 2026-07-14 |

## Fasi STEP-1

### Fase 1.1 — Chiusura analisi DOC 29

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Soddisfare DoD-2 e DoD-8 (solo verifiche **pre-implementazione**); confermare DoD-3/5/6/7/9 |
| **Stato Fase** | **Completato** |
| **PO ✓** | ☑ |

**Attività previste:**
- Riclassificare § *Verifiche pre-implementazione* vs § *Verifiche ed evidenze — implementazione* (DoD-2)
- Confermare piano B1–B10 accettato (DoD-3 ☑ — DL-031)
- Architettura F1–F10 e famiglia RPC target (DoD-5 ☑)
- Piano migrazione Fasi 0–6 + tab Sponsor Scollegati (DoD-6 ☑)
- Decision Log DL-027–031 (DoD-7 ☑)
- Documentare Q1–Q9 — gate *Pronto* vs *Implementato* (DoD-8 ☑)
- Checklist implementazione (DoD-9 ☑)
- Aggiornare stato documento DOC 29 → *Pronto per Implementazione*

**Criteri di completamento (DoD Fase):**
- DoD-2 ☑ — solo verifiche pre-impl; voci implementative spostate in § dedicato DOC 29
- DoD-8 ☑ — Q1–Q9 documentate; **non** richiedono Sì pre-codice
- DoD-3/5/6/7/9 ☑ in DOC 29
- Gate «Pronto per Implementazione DOC 29» = ☑ in tabella gate WF-02

---

### Fase 1.2 — Chiusura analisi DOC 30

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Confermare G-CC-1 ☑; inventario chiavi vs Configuration Source |
| **Stato Fase** | Completato (macro) |
| **PO ✓** | ☑ (review 2026-07-14) |

**Attività previste:**
- Validazione PO catalogo Feature Flags v1 macro-struttura (DoD-P2 ☑ — DL-P07)
- Matrice permessi Centro di Controllo (DoD-P3 ☑)
- Regola manutenzione: messaggio **fisso** in News Bar, altre news scorrono (DoD-P6 ☑ — DL-P06)
- Separazione AI Control Center / Centro di Controllo (DoD-P8 ☑ — G-AI-SEP, DL-P08)
- Inventario chiavi vs Configuration Source / Message Template Source — prosegue in preparazione STEP-3 (non blocca STEP-2)

**Criteri di completamento (DoD Fase):**
- DoD-P2, DoD-P3, DoD-P6, DoD-P8 = ☑ in DOC 30
- Gate **G-CC-1** = ☑ in tabella gate WF-02
- Checkpoint PO §12 completato

---

### Fase 1.3 — Verifica PO e autorizzazione implementazione

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Validazione PO formale di prontezza e ordine di esecuzione STEP-2→4 |
| **Stato Fase** | **Completato** |
| **PO ✓** | ☑ |

**Attività previste:**
- Review sintetica gate aperti/chiusi
- Conferma esplicita: nessuna implementazione chat unificata in WF-02 (G-MSG-1); Privacy avanzata in WF-03 (DL-P09)
- Aggiornare `03_PROJECT_STATUS.md` e stato STEP-1

**Criteri di completamento (DoD Fase):**
- Validazione PO STEP-1: **Approvato** — 2026-07-14
- Stato STEP-1 → **Completato**

---

## Autorizzazione implementazione STEP-2

| Campo | Valore |
|-------|--------|
| **Validazione PO STEP-1** | **Approvato** — 2026-07-14 |
| **Gate DOC 29** | *Pronto per Implementazione* ☑ (v0.10.0) |
| **Autorizzazione** | **Concessa** — avvio WF-02 **STEP-2** · **Fase 2.1** (contenimento critico P0) |
| **Vincolo** | Nessun codice/migration fuori piano Fasi 1–6 DOC 29; G-MSG-1 step 5 ⛔ |

---

# STEP-2 — Implementazione dominio Sponsor (DOC 29)

### Prerequisiti per iniziare lo STEP

- [x] STEP-1 **Completato**
- [x] Validazione PO STEP-1 registrata (Approvato — 2026-07-14)
- [x] DOC 29 = *Pronto per Implementazione*
- [x] Gate «Pronto per Implementazione DOC 29» ☑
- [x] `06_CHANGE_IMPACT_RULES.md` letto

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Eseguire *Piano di migrazione* Fasi 1–6; portare DOC 29 verso *Implementato* |
| **Motivazione** | Gap sicurezza P0 (403, RPC gateway, B8); architettura Write Gateway congelata (F1–F10); G-MSG-1 step 1–2 |
| **Dipendenze** | STEP-1 Completato; DOC 29 *Pronto per Implementazione*; `06_CHANGE_IMPACT_RULES.md` |
| **Stato STEP** | **Completato** |
| **Deliverable** | RPC gateway Sponsor; pipeline admin funzionante; flusso O1/O11; audit O8; contenimento B8; UI allineata matrice permessi O4 |
| **DoD STEP** | Fasi 1–6 DOC 29 completate; Q1–Q9 post-deploy **Sì**; checklist *Implementazioni da eseguire* Fasi 1–6 ☑; G-MSG-1 step 1–2 ☑; validazione PO STEP-2 |

**Vincoli trasversali (DOC 32):** nuove superfici UI Sponsor adottano Foundation dove applicabile; rispetto `layerRegistry` / `focusModeRegistry`; `npm run lint:layers` su file toccati.

## Fasi STEP-2

### Fase 2.1 — Fase 1: Contenimento critico

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Mitigare rischi P0: RPC esistente, messages, INSERT anon |
| **Stato Fase** | **Completato** |
| **PO ✓** | ☑ (review architetturale 2026-07-14) |
| **Riferimento SSOT** | DOC 29 Piano migrazione Fase 1; Priorità P0 (B9, B2, B7, B1, B6, B8, B5, A11) |

**Attività previste:**
- Hardening `activate_sponsor_with_resource` (REVOKE PUBLIC, guard admin, search_path)
- Contenimento `sponsor_messages` / policy admin (`admin_limited`, `is_td_admin`)
- Restringere INSERT anon su `sponsor_requests` in vista O1

#### Nota operativa — bonifica RLS legacy `admin_city` (B5 / DL-027)

Durante l'implementazione di questa fase è **obbligatoria** la bonifica del residuo legacy `admin_city` sul database remoto:

| Azione | Dettaglio |
|--------|-----------|
| **Verificare** | Policy RLS su `public.sponsor_messages` denominata **`Admins can manage all sponsor messages`** |
| **Eliminare** | Ogni riferimento al ruolo legacy **`admin_city`** |
| **Allineare** | Modello autorizzativo ufficiale del progetto — helper **`is_td_admin(auth.uid())`** (o logica equivalente già approvata) per **`admin_all`** e **`admin_limited`** |
| **Coerenza SSOT ruoli** | Ruoli piattaforma ammessi: `user`, `business`, `admin_limited`, `admin_all`. **`guest`** resta ruolo frontend non persistito in `profiles` |

**Esito verifica remota Supabase** (`supabase db query --linked`, 2026-07-14, read-only — registrato in DOC 29 V20):

| Controllo | Esito |
|-----------|-------|
| Profili con `profiles.role = 'admin_city'` | **0** (5 profili totali: `user`×2, `admin_all`×1, `admin_limited`×1, `business`×1) |
| Valori anomali in `profiles.role` | **Nessuno** (nessun NULL) |
| Riferimenti residui a `admin_city` | **1** — policy RLS `public.sponsor_messages` · `Admins can manage all sponsor messages` (USING: `profiles.role = ANY (ARRAY['admin_all','admin_city'])`) |
| Altri oggetti DB (funzioni, trigger, view, enum, CHECK, default) | **Nessun riferimento** |

La bonifica va eseguita **in implementazione** (migration/SQL Pack Fase 2.1); questa nota è solo tracciabilità documentale.

**Criteri di completamento (DoD Fase):**
- Voci P0 Fase 1 implementate con evidenza in DOC 29
- Policy `sponsor_messages` allineata a `is_td_admin` / DL-027 — **senza** `admin_city`
- Review tecnica + test smoke pipeline critica
- Checkpoint PO §12; G-MSG-1 step 1 ☑ (approvazione risolta)

---

### Fase 2.2 — Fase 2: RPC gateway richieste

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Sostituire CRUD diretto su `sponsor_requests` con RPC admin (O3/D8) |
| **Stato Fase** | **Completato** |
| **PO ✓** | ☑ (review architetturale 2026-07-14) |
| **Riferimento SSOT** | DOC 29 Fase 2; famiglia RPC `approve_sponsor_request`, `reject_sponsor_request`, `update_sponsor_request_admin_notes`, `delete_sponsor_request` |

**Attività previste:**
- Migration RPC + GRANT EXECUTE
- Refactor `sponsorService` / `SponsorManager` consumer RPC
- Pipeline tab invariata (O5/D9)

**Criteri di completamento (DoD Fase):**
- Approvazione/Rifiuto/Note/Delete via RPC; nessun PATCH diretto su `sponsor_requests`
- Matrice permessi O4 rispettata in UI
- Review + test percorso admin Nuove Richieste → Attesa Pagamenti

---

### Fase 2.3 — Fase 3: Unificazione attivazione

| Campo | Valore |
|-------|--------|
| **Obiettivo** | RPC atomica `activate_sponsor_from_request` (DL-017); deprecare percorsi paralleli |
| **Stato Fase** | **Completato** |
| **PO ✓** | ☑ (review architetturale 2026-07-14) |
| **Riferimento SSOT** | DOC 29 Fase 3; Priorità P1 B3/B4 |

**Attività previste:**
- Implementare `activate_sponsor_from_request`
- Migrare frontend da `createSponsorFromRequest` + `activate_sponsor_with_resource`
- Applicare policy eliminazione RPC legacy O9 dove consentito

**Criteri di completamento (DoD Fase):**
- Un solo percorso attivazione; `activate_sponsor_with_resource` non invocabile dal client post-migrazione
- State machine `waiting_payment` → `converted` enforceata in RPC

---

### Fase 2.4 — Fase 4: RPC contratti, shop e city lifecycle

| Campo | Valore |
|-------|--------|
| **Obiettivo** | RPC contratto, shop sync O6, city lifecycle O7/DL-022 |
| **Stato Fase** | **Completato** |
| **PO ✓** | ☑ (review architetturale 2026-07-16) |
| **Riferimento SSOT** | DOC 29 Fase 4; RPC `cancel_sponsor_contract`, `extend_sponsor_contract`, `extend_sponsors_bulk`, `sync_sponsor_profile_from_shop` |

**Attività previste:**
- Implementare estensione singola/massiva unificata O10/DL-023
- Migrare `shopService` sync su RPC partner-scoped
- Allineare `cityLifecycleService` → tab **Sponsor Scollegati** (DL-029): stato **Da ricollegare**, ultima città, ricollegamento → Sponsor Attivi
- Estensione massiva **solo checkbox** (DL-028)

**Criteri di completamento (DoD Fase):**
- Mutazioni contratto e shop solo via Write Gateway
- Comportamento eliminazione/ricreazione città conforme DL-022
- Test smoke estensione, cancellazione, sync shop, city delete/reclaim

---

### Fase 2.5 — Fase 5: Contenimento messaggi legacy (B8)

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Contenimento sicurezza B8 — **non** consolidamento motore messaggi |
| **Stato Fase** | **Completato** |
| **PO ✓** | ☐ (report tecnico 2026-07-17 — validazione PO in attesa) |
| **Riferimento SSOT** | DOC 29 Fase 5; strategia migrazione O2; G-MSG-1; requisiti UX futuri **DL-037** (implementazione UI post step 4, non in questa fase) |
| **Migration** | `20260717120000_sponsor_phase5_messages_containment.sql` |

**Attività previste:**
- REVOKE CRUD client su `sponsor_messages` dove previsto
- Stub/minimo contenimento UI messaggi legacy
- Flag consumer `feature.comms.user_sponsor` preparato per DOC 30 (chat Utente↔Sponsor OFF fase 1, D17)

**Criteri di completamento (DoD Fase):**
- Nessun consolidamento `partner_logs` / motore unificato (vietato pre G-MSG-1 step 5)
- B8 contenuto con evidenza; nessuna escalation sicurezza messaggi

---

### Fase 2.6 — Fase 6: Governance e audit Sponsor (O8)

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Audit log amministrativo strutturato; flusso Diventa Sponsor O1/O11; rating alert consumer soglia DOC 30 |
| **Stato Fase** | **Completato** |
| **PO ✓** | ☑ (2026-07-17 — STEP-2 chiuso formalmente) |
| **Riferimento SSOT** | DOC 29 Fase 6; O8, O1, O11, DL-021 Rating |
| **Migration** | `20260717140000_sponsor_phase6_governance_audit.sql` |

**Attività previste:**
- Audit log su ogni RPC admin (O8/C3)
- Flusso signup obbligatorio all'invio candidatura (O1/O11)
- Calcolo rating + evidenziazione + filtro «Solo sotto soglia» in Sponsor Attivi (DL-030; **no** sospensione automatica)
- Allineamento `admin_limited` vs `admin_all` per DL-027 (Utenti & Ruoli)

**Criteri di completamento (DoD Fase):**
- Ogni azione admin tracciata in audit Sponsor
- Flusso UX Diventa Sponsor conforme sezione Masterplan
- Rating alert solo notifica umana (DL-021); G-MSG-1 step 2 ☑
- DOC 29 aggiornabile verso *Implementato*

---

# STEP-3 — Implementazione Centro di Controllo (DOC 30)

### Prerequisiti per iniziare lo STEP

- [x] STEP-2 **Completato**
- [x] Validazione PO STEP-2 registrata
- [x] G-MSG-1 step 1–2 ☑
- [x] G-CC-1 ☑ (da STEP-1)

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Realizzare Centro di Controllo e Feature Flag Engine secondo DOC 30 |
| **Motivazione** | Hub operativo per flag, testi, soglie, manutenzione, audit; consumer per Sponsor e futura Messaggistica |
| **Dipendenze** | STEP-2 Completato (G-MSG-1 step 2); G-CC-1 ☑ da STEP-1 |
| **Stato STEP** | **In corso** |
| **Deliverable** | UI Centro di Controllo (footer Admin); macro-sezioni DL-P07; Feature Flag Engine; audit; runtime consumer |
| **DoD STEP** | Sezioni in scope operative; **G-AI-SEP** rispettato (nessuna unificazione AI); consumer Sponsor collegati; validazione PO STEP-3 |

**Vincoli trasversali (DOC 32):** shell admin via Foundation; manutenzione solo via News Bar esistente (DL-P06); **AI Control Center resta strumento separato** (DL-P08).

## Fasi STEP-3

### Fase 3.1 — Infrastruttura Configuration Source e audit

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Feature Flag Engine, audit stream, API/hook `evaluateFeatureFlag` |
| **Stato Fase** | **Completato** |
| **PO ✓** | ☑ (review architetturale 2026-07-17) |

**Attività previste:**
- Modello flag: default, override manuale, schedule, audience
- Tabella/stream `platform_control_audit`
- Hook/service lettura centralizzata per consumer
- Navigazione footer Admin: voce **Centro di Controllo** (DL-P02)

**Criteri di completamento (DoD Fase):**
- Ogni mutazione Centro di Controllo produce audit obbligatorio
- `admin_all` mai bloccato da audience (DL-P04)
- Test unitari/smoke su risoluzione `manual_override ?? schedule ?? default`

---

### Fase 3.2 — Sezioni operative core (1–4)

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Macro-sezioni AI, Comunicazioni, Sponsor, Moderazione (configurazione — **non** merge AI Control Center) |
| **Stato Fase** | **Completato** |
| **PO ✓** | ☐ (report tecnico 2026-07-17 — validazione PO in attesa) |
| **Riferimento SSOT** | DOC 30 macro-sezioni; catalogo Feature Flags; G-AI-SEP (DL-P08) |

**Attività previste:**
- Sotto-sezioni AI con flag indipendenti (Utente / Admin All / Admin Limited — DL-P07)
- Sezione Comunicazioni: flag `feature.comms.*`; template messaggi disabilitazione
- Sezione Sponsor: candidature, soglia rating, messaggi pausa
- Sezione Moderazione: flag `feature.moderation.*`
- **Non** unificare UI con AI Control Center (on/off operativo resta lì)
- Collegare runtime consumer DOC 29 (submit candidatura, alert rating, ecc.)

**Criteri di completamento (DoD Fase):**
- G-AI-SEP rispettato — due strumenti distinti
- Flag e soglie Sponsor letti da consumer runtime verificati
- Permessi sezione conformi matrice DoD-P3

---

### Fase 3.3 — Testi, legali e manutenzione (5–7)

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Editor testi operativi, manutenzione News Bar; Privacy avanzata **fuori scope** (WF-03) |
| **Stato Fase** | **Completato** |
| **PO ✓** | ☐ (report tecnico 2026-07-17 — validazione PO in attesa) |
| **Riferimento SSOT** | DOC 30 § Testi e messaggi; DL-P06; Appendice A |

**Attività previste:**
- Message Template Source / `useSystemMessage` integration
- Testi disclosure CRM Sponsor (D18) — editabili senza deploy
- Manutenzione: messaggio **fisso** in News Bar; altre news continuano a scorrere (DL-P06)
- **Escluso WF-02:** sezione Privacy avanzata / compliance estesa (DL-P09 → WF-03)

**Criteri di completamento (DoD Fase):**
- Manutenzione ON/OFF orchestrata da Centro di Controllo via News Bar
- Testi disclosure CRM editabili con audit
- DoD-P6 ☑ in DOC 30

---

### Fase 3.4 — Programmazione automatica e verifica consumer

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Scheduling flag; UI card autosufficienti; DS admin; storico audit; verifica smoke consumer già collegati |
| **Stato Fase** | **Completato** |
| **PO ✓** | ☑ — Approvato 2026-07-18 (DoD soddisfatto; smoke consumer collegati OK) |
| **Riferimento SSOT** | DOC 30 § Sez. 9; Runtime Integration; decisioni PO 2026-07-17 (card inline, pausa/disattiva schedule, DS) |
| **Migration** | `20260717180000_platform_control_phase34_schedule_pause.sql` |

**Attività previste:**
- UI schedule per flag con `supports_schedule: true` (finestre assolute; no ricorrenze/cron)
- Pausa globale programmazioni (finestre salvate ma non applicate) + disattivazione per flag (svuota schedule)
- Priorità runtime: override manuale > programmazione > default (DL-P04)
- Card Feature Flag autosufficienti (toggle + messaggio inline + salva)
- Allineamento Design System (`AdminSectionCard` / `admin_*`)
- Storico modifiche consultabile + export CSV
- Smoke su consumer **già collegati** (AI kill, candidature, chat user↔sponsor, manutenzione, moderazione)
- **Non** collegare automaticamente i consumer ancora mancanti in questa fase

**Criteri di completamento (DoD Fase):**
- Override manuale prioritario su schedule (DL-P04)
- Pausa globale e disattivazione schedule operative in UI
- Storico audit leggibile + export (admin_all)
- Smoke consumer collegati OK
- Checkpoint PO §12; STEP-3 pronto per chiusura **dopo** attività post-fase sotto

**Attività successiva obbligatoria (post chiusura Fase 3.4 — tracciata fino a esecuzione):**

> **Audit della copertura dei Feature Flag e verifica dei consumer ancora mancanti.**
>
> Eseguire **dopo** la chiusura formale della Fase 3.4. Il PO decide quali consumer ulteriori collegare solo a valle di questo audit.
>
> **Stato corretto:** ricognizione / audit tecnico **completati**; piano batch 1–3 **completati**; Batch 4 **eliminato** (DL-P12). **Audit B (collaudi Centro di Controllo) CHIUSO** (PO 2026-07-23). L’**attività post-3.4 resta aperta** fino ad Audit A (DOC 28) e alla Validazione PO formale STEP-3. **STEP-4 non avviato.**

| Campo | Valore |
|-------|--------|
| **Stato attività** | **Aperta (hold)** — sviluppo CC ✓ · wiring Batch 1–3 ✓ · Photo dual-family ✓ · **Audit B / collaudi CC CHIUSI** (PO 2026-07-23) · provider AI POSTICIPATO · **Audit A** non avviato · Validazione formale STEP-3 non registrata · STEP-4 **non** iniziato |
| **PO ✓** | ☐ chiusura formale STEP-3 (dopo Audit A + Validazione PO); **hold** esplicito su avvio STEP-4 per attività aggiuntive PO |
| **Nota** | Collaudi/verifiche CC previsti per questa fase **completati** 2026-07-23. Workflow fermo in *pronto al passaggio successivo* — non anticipare STEP-4. |

### Backlog Post-3.4 / rifiniture (obbligatorio tracciare)

| ID | Voce | Tipo | Stato |
|----|------|------|-------|
| **MSG-SOT** | Migrazione messaggi utente → Message Template DB unica SoT (DL-P13) | Sviluppo | **Implementato** 2026-07-20 |
| **SCH-AUDIT-02** | Audit forense approfondito Scheduler (runtime, evaluation, cache, refresh, polling, override, timezone, attivazione/disattivazione) | Audit → fix | **Diagnosi + fix** 2026-07-20 |
| **SCH-STATUS-UI** | Stato per riga programmazione (In attesa/Attiva/Eseguita/In pausa/Disabilitata/Errore) auto-aggiornato (DL-P14); storico sempre visibile | Sviluppo Scheduler | **Implementato** 2026-07-20 (label aggiornate 2026-07-22) |
| **AI-GATE-COLLAUDO** | Collaudo runtime gating AI (FF / Emergency Stop / blocco preventivo / UI) | Collaudo PO | **COMPLETATO** 2026-07-21 |
| **AI-PROVIDER-COLLAUDO** | Test funzionali provider (Gemini/OpenAI, qualità, prompt, retry, API Key) | Collaudo | **POSTICIPATO** — collaudo finale post API Key |
| **AUDIT-A** | Audit architetturale Collaboration DOC 28 | Solo analisi | Piano prodotto; **non avviato** (non è collaudo CC) |

---

## Decisioni PO post Audit B (2026-07-20)

| ID | Decisione | Impatto WF-02 |
|----|-----------|---------------|
| **DL-P13** | Tutti i messaggi utente governati **solo** dal Centro di Controllo (Message Template → DB). Catalogo TS non è SoT. Hardcoded solo log/debug/commenti/errori tecnici (+ bootstrap minimo). | MSG-SOT obbligatorio prima chiusura STEP-3 |
| **DL-P14** | Ogni riga programmazione mostra stato runtime (In attesa/Attiva/Eseguita/In pausa/Disabilitata/Errore); storico sempre visibile. | SCH-STATUS-UI **implementato** |
| **SCH-FILONE** | Audit Scheduler + fix start/end + tick UI + clear override su save schedule. | Completato lato codice 2026-07-20 — collaudo PO incluso in chiusura Audit B 2026-07-23 |

*Riferimenti SSOT: DOC 30 DL-P13/P14; SoT collaudo `WF_02_AUDIT_B_CENTRO_CONTROLLO.md`.*


### Piano wiring consumer (PO 2026-07-19) — batch deliberati

| Batch | Feature Flag | Stato |
|-------|--------------|-------|
| **1** | `feature.economy.credit_purchase`, `feature.economy.subscriptions`, `feature.moderation.reviews` (UX) | **Completato** (2026-07-19) |
| **2** | `feature.comms.admin_partner`, `feature.comms.notifications` | **Completato** (2026-07-19) |
| **3** | `feature.sponsor.shop_public`, `feature.platform.registration`, `feature.platform.onboarding` | **Completato** (2026-07-19) |
| **4** | ~~`feature.platform.collaboration_live`~~ | **Eliminato** (PO 2026-07-20 — DL-P12): collaborazione = capacità strutturale; **nessun** toggle CC; **nessun** wiring |

### Attività post-3.4 residue (prima della chiusura formale STEP-3)

| # | Attività | Tipo | Stato | Obiettivo |
|---|----------|------|-------|-----------|
| **B** | Collaudi / Audit completo Centro di Controllo | Collaudo | **COMPLETATO** (PO 2026-07-23) | Verificare Feature Flag ↔ comportamento app. SoT: `WF_02_AUDIT_B_CENTRO_CONTROLLO.md` |
| **A** | Audit architetturale finale dominio Collaboration (DOC 28) | Solo documentazione / analisi | **Aperto** | Verificare coerenza Workspace / condivisione / ruoli / realtime / lock / presenza / sync / ownership / UX. **Non** Feature Flag. Nessuna implementazione. |
| — | Validazione PO formale chiusura STEP-3 | PO | **Aperto** | Dopo Audit A + assenza criticità |
| — | Avvio STEP-4 | Sequenza | **Non avviato** — **hold PO** | Attività aggiuntive PO prima del passaggio; **non** anticipare |

**Gate chiusura STEP-3:** Audit B ☑ · Audit A + Validazione PO → poi autorizzazione esplicita ad avviare STEP-4.  
**Nota PO 2026-07-23:** collaudi CC conclusi; workflow resta in *pronto al passaggio successivo* senza entrare in STEP-4.

---

# STEP-4 — Stabilizzazione, checkpoint G-MSG-1 e chiusura WF

### Prerequisiti per iniziare lo STEP

- [ ] STEP-2 e STEP-3 **Completati**
- [ ] Validazione PO STEP-2 e STEP-3 registrate
- [ ] DOC 29 verso *Implementato*; Centro di Controllo operativo

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Completare G-MSG-1 step 3–4; stabilizzare; chiudere WF-02 senza avviare Messaggistica |
| **Motivazione** | Sequenza obbligatoria D24/DL-026; separazione dominio Messaggistica da Sponsor |
| **Dipendenze** | STEP-2 e STEP-3 Completati |
| **Stato STEP** | Non iniziato |
| **Deliverable** | G-MSG-1 step 3–4 documentati; DOC 29/30/06/09 aggiornati post-impl; WF-02 chiuso |
| **DoD STEP** | DoD-WF-1–DoD-WF-7 soddisfatti; G-MSG-1 step 5 **non** avviato |

## Fasi STEP-4

### Fase 4.1 — Stop e verifica post-implementazione (G-MSG-1 step 3)

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Stop formale; nessun lavoro chat unificata; verifica Q1–Q9 e regressioni |
| **Stato Fase** | Non iniziato |
| **PO ✓** | ☐ |
| **Riferimento SSOT** | DOC 29 G-MSG-1 step 3; § Post-implementazione |

**Attività previste:**
- Smoke regressioni Sponsor + Centro di Controllo
- Conferma Q1–Q9 DOC 29 post-deploy
- Aggiornare DOC 29 → *Implementato*; DOC 15/06/09 come da checklist post-impl

**Criteri di completamento (DoD Fase):**
- G-MSG-1 step 3 ☑ registrato
- Nessuna PR/migration motore messaggi unificato avviata

---

### Fase 4.2 — Review UI messaggistica con PO (G-MSG-1 step 4)

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Wireframe/review UI admin + partner approvati — **senza implementazione** |
| **Stato Fase** | Non iniziato |
| **PO ✓** | ☐ |
| **Riferimento SSOT** | DOC 29 G-MSG-1 step 4; strategia migrazione O2; **DL-037** (requisiti UX Sponsor-centric) |

**Attività previste:**
- Sessione review UI CRM con PO
- Registrare esito e eventuali note nel Decision Log SSOT appropriato
- Confermare che step 5 rimanda a futuro SSOT Messaggistica / WF dedicato

**Criteri di completamento (DoD Fase):**
- G-MSG-1 step 4 ☑ con approvazione PO wireframe/review
- Gate G-MSG-1 aggiornato (step 5 esplicitamente fuori WF-02)

---

### Fase 4.3 — Stabilizzazione documentazione e gate

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Allineare layer documentali; chiudere gate tracciati |
| **Stato Fase** | Non iniziato |
| **PO ✓** | ☐ |

**Attività previste:**
- Verificare matrice aggiornamento `AI_DEV_WORKFLOW/README.md`
- Aggiornare `AI_CONTEXT_MASTER` se sintesi cross-dominio richiede certificazione
- Consolidamento `types/supabase.ts` vs RPC/policy reali (P2 C5/A15 — backlog DOC 29)
- Migration repo: allineamento policy `sponsors` e stato RPC remoto (C5)
- Tabella gate WF-02: tutti applicabili ☑
- Aggiornare percentuale WF

**Criteri di completamento (DoD Fase):**
- DoD-WF-5 ☑
- Documentazione operativa e SSOT coerenti

---

### Fase 4.4 — Chiusura Workflow

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Validazione PO finale e chiusura formale WF-02 |
| **Stato Fase** | Non iniziato |
| **PO ✓** | ☐ |

**Attività previste:**
- Review DoD-WF-1–DoD-WF-7
- Validazione PO finale
- Aggiornare `03_PROJECT_STATUS.md`, `01_EXECUTION_ROADMAP.md`
- Valutare spostamento in `WORKFLOWS/_archive/`

**Criteri di completamento (DoD Fase):**
- Tutti STEP Completati
- Sezione Chiusura Workflow compilata
- Report operativo §15 emesso

---

## Ordine consigliato delle attività

1. **STEP-1** Fase 1.1 → 1.2 → 1.3 (sequenziale; gate prima del codice)
2. **STEP-2** Fase 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 (ordine *Piano di migrazione* DOC 29)
3. **STEP-3** Fase 3.1 → 3.2 → 3.3 → 3.4 (infrastruttura prima delle sezioni UI)
4. **STEP-4** Fase 4.1 → 4.2 → 4.3 → 4.4 (stop → review → docs → chiusura)

**Parallelo vietato:** STEP-3 implementazione codice prima di STEP-2 Completato (G-MSG-1 step 2).

**Fuori ordine WF-02:** G-MSG-1 step 5 (motore Messaggistica) — richiede nuovo Workflow.

---

## Criteri di chiusura del Workflow

Il Workflow WF-02 si considera **Completato** quando:

1. STEP-1 … STEP-4 = **Completato** con validazione PO su ciascuno
2. **DoD-WF-1** … **DoD-WF-7** soddisfatti
3. DOC 29 = *Implementato*; DOC 30 operativo con G-CC-1 mantenuto
4. G-MSG-1 step 1–4 ☑; step 5 **non** eseguito in questo WF
5. Fase 7 Messaggistica DOC 29 resta ⛔ / posticipata
6. `03_PROJECT_STATUS.md` e `01_EXECUTION_ROADMAP.md` aggiornati
7. Validazione PO finale registrata in sezione Chiusura Workflow

---

## Log decisioni operative

| Data | Decisione | Chi |
|------|-----------|-----|
| 2026-07-17 | Architettura CRM Sponsor-centric registrata (DOC 29 DL-037); audit dual-stack messaggistica; G-MSG-1 step 4 input | PO |
| 2026-07-16 | Fix RPC `pois.category` via `resolve_poi_category_for_sponsor_activation` (mirror TS); DL-036 attach-or-create registrata come anticipazione non approvata — futura evoluzione da coordinare con Claim POI («Segnala / Rivendica») | PO / AI |
| 2026-07-16 | Soluzione A implementata (migration `20260716162000_…`): RPC valorizza id text pois/shops; ID Governance resta non approvata | AI |
| 2026-07-16 | Ricognizione ID dual-family documentata (DOC 33 / DL-035); **ID Governance non approvata** (nuova ricognizione obbligatoria prima di avvio); priorità sprint = bug fix attivazione Sponsor (soluzione A), poi ripresa Fase 2.5 | PO |
| 2026-07-17 | Chiusura implementazione Fase 2.5 (B8/A10); DL-037 §3 integrato (storico contratti); progettazione messaggistica Sponsor conclusa | PO |
| 2026-07-16 | Chiusura formale Fase 2.4; lint residuo dichiarato fuori scope; autorizzazione avvio Fase 2.5 | PO |
| 2026-07-14 | Chiusura STEP-1; DOC 29 *Pronto per Implementazione*; autorizzazione avvio STEP-2 Fase 2.1 | PO |
| 2026-07-14 | Chiusura decisioni PO DEC-A12/SUX/TERM e DEC-CC-SCOPE/CATALOG | PO |
| 2026-07-14 | Apertura ufficiale WF-02; 4 STEP; Messaggistica unificata esclusa dal perimetro | PO |
| 2026-07-14 | DOC 31/32 come vincoli trasversali, non STEP dedicati (SSOT certificati) | WF-02 |

*Decisioni architetturali → Decision Log dei Masterplan SSOT.*

---

## Chiusura Workflow

| Campo | Valore |
|-------|--------|
| **Data chiusura** | — |
| **Validazione PO finale** | In attesa |
| **Archiviato in** | `WORKFLOWS/_archive/` (dopo stabilizzazione) |

---

## Cronologia stato

| Data | STEP | Fase | Stato | Nota |
|------|------|------|-------|------|
| 2026-07-23 | 3 | Post-3.4 | Hold / pronto passaggio | Audit B / collaudi CC **CHIUSI** (PO); STEP-3 non chiuso formalmente; STEP-4 **non** avviato |
| 2026-07-18 | 3 | 3.4 | Completato | Schedule/pausa/card/DS/audit; smoke consumer OK; PO ✓ 2026-07-18 |
| 2026-07-17 | 3 | 3.3 | Completato | Message Template Source editor; disclosure CRM D18; manutenzione News Bar DL-P06 |
| 2026-07-17 | 3 | 3.2 | Completato | Macro-sezioni AI/Comms/Sponsor/Moderation; consumer candidature/rating/AI/moderation; G-AI-SEP |
| 2026-07-17 | 3 | 3.1 | Completato | Migration `20260717160000`; Feature Flag Engine; audit; hook `evaluateFeatureFlag`; nav Centro di Controllo |
| 2026-07-17 | 2 | 2.6 | Completato | Audit O8; signup O1/O11; rating DL-030; DL-027 UI; migration `20260717140000`; G-MSG-1 step 2 ☑ |
| 2026-07-17 | 2 | 2.5 | Completato | B8/A10 REVOKE + RPC gateway; flag `feature.comms.user_sponsor` OFF; migration `20260717120000`; smoke runtime pending deploy |
| 2026-07-16 | 2 | 2.4 | Completato | RPC contratti/shop/city; migration `20260714180000`; lint residuo fuori scope |
| 2026-07-14 | 2 | 2.3 | Completato | `activate_sponsor_from_request`; migration 20260714173000 |
| 2026-07-14 | 2 | 2.2 | Completato | RPC gateway richieste; migration 20260714170000 |
| 2026-07-14 | 2 | 2.1 | Completato | Fase 2.1 contenimento P0; migration 20260714160000 |
| 2026-07-14 | 1 | 1.1–1.3 | Completato | DOC 29 Pronto; Validazione PO Approvato; autorizzazione STEP-2 |
| 2026-07-14 | — | — | Attivo | Apertura ufficiale WF-02 |
| 2026-07-14 | 1 | — | Non iniziato | Focus iniziale |

---

## Stato dopo questa sessione

> Aggiornare **obbligatoriamente** a fine ogni sessione di lavoro su WF-02. Serve a riprendere i lavori senza rileggere l'intero documento.

| Campo | Valore |
|-------|--------|
| **Workflow corrente** | WF-02 — Implementation Masterplan |
| **STEP corrente** | STEP-3 — Centro di Controllo (DOC 30) |
| **Fase corrente** | Post-3.4 — **pronto al passaggio successivo** |
| **Stato della fase** | Sviluppo CC **completato** · Collaudi CC / Audit B **chiusi** (PO 2026-07-23) · Audit A e Validazione formale STEP-3 **ancora aperti** · STEP-4 **non** avviato (hold PO) |
| **Prossima fase da eseguire** | Attività aggiuntive PO → poi Audit A / Validazione STEP-3 → **solo dopo autorizzazione PO** avvio STEP-4 |
| **STEP completato in questa sessione** | — (STEP-3 non ancora chiuso formalmente) |
| **Fase completata in questa sessione** | Collaudi/verifiche Centro di Controllo (Audit B) — **chiusi** |
| **Workflow completato** | No |

---

## Report Operativo

> Checklist riassuntiva — compilare a fine sessione (Gemini / AI IDE). Non duplicare il dettaglio degli STEP.

### Attività completate

- [x] Chiusura decisioni PO: DEC-A12 (DL-032), DEC-SUX (DL-033), DEC-TERM (DL-034), DEC-CC-SCOPE (DL-P10), DEC-CC-CATALOG (DL-P11)
- [x] DOC 29 v0.9.0 — tassonomia ruoli, pipeline Diventa Sponsor, matrice permessi
- [x] DOC 30 v0.3.1 — pianificazione flag per Workflow
- [x] `02_GOVERNANCE.md` §11 operazioni irreversibili
- [x] Verifica remota read-only ruoli/`admin_city` — esito in DOC 29 V20; nota operativa bonifica in Fase 2.1
- [x] Riclassificazione DoD-2/DoD-8 DOC 29; v0.10.0 *Pronto per Implementazione*
- [x] STEP-1 Fase 1.1, 1.2, 1.3 — **Completato**; Validazione PO **Approvato** 2026-07-14
- [x] Autorizzazione formale avvio STEP-2 Fase 2.1
- [x] **STEP-2 Fase 2.1** — migration `20260714160000`; hardening RPC; policy messages; INSERT anon; VT-SPONSOR-PUBLIC-READ
- [x] **STEP-2 Fase 2.2** — migration `20260714170000`; RPC gateway richieste; refactor `sponsorRequestsService`
- [x] **Review architetturale Fase 2.2** — PO ✓ 2026-07-14
- [x] **STEP-2 Fase 2.3** — migration `20260714173000`; `activate_sponsor_from_request`; revoke client legacy RPC
- [x] **Review architetturale Fase 2.3** — PO ✓ 2026-07-14
- [x] **STEP-2 Fase 2.4** — migration `20260714180000`; RPC contratti/shop/city; UI Sponsor Scollegati; review architetturale PO ✓ 2026-07-16
- [x] Lint Fase 2.4: nessun errore TS residuo nello scope; residui progetto dichiarati fuori scope

### Attività rimaste aperte

- [x] **STEP-2 Fase 2.5** — migration `20260717120000`; REVOKE CRUD `sponsor_messages`; RPC `insert_sponsor_message` / `mark_sponsor_messages_read`; flag `feature.comms.user_sponsor` prepared OFF; contenimento UI `UserMessagesTab`
- [x] **STEP-2 Fase 2.6** — migration `20260717140000`; audit O8; signup O1/O11; rating DL-030; matrice DL-027
- [x] STEP-3 Fase 3.1 — migration `20260717160000`; Feature Flag Engine; audit; hook; nav Centro di Controllo
- [x] STEP-3 Fase 3.2 — Sezioni operative core (AI, Comunicazioni, Sponsor, Moderazione) + consumer runtime
- [x] STEP-3 Fase 3.3 — Message Template Source; disclosure CRM; manutenzione News Bar (DL-P06)
- [x] STEP-3 Fase 3.4 — Programmazione automatica; card inline; DS; storico audit; smoke consumer collegati — PO ✓ 2026-07-18
- [x] **Post-3.4 — ricognizione / audit tecnico:** report copertura Feature Flag / consumer — 2026-07-18 (non chiude l’attività)
- [x] **Post-3.4 — piano batch PO:** Batch 1–3 definiti e completati (2026-07-19); Batch 4 **eliminato** (DL-P12, 2026-07-20)
- [x] **Post-3.4 — Batch 1:** `credit_purchase`, `subscriptions`, `moderation.reviews` (UX) — 2026-07-19
- [x] **Post-3.4 — Batch 2:** `admin_partner`, `notifications` — 2026-07-19
- [x] **Post-3.4 — Batch 3:** `shop_public`, `registration`, `onboarding` — 2026-07-19
- [x] **Post-3.4 — decisione PO DL-P12:** nessun Feature Flag `collaboration_live`; collaborazione = capacità strutturale — 2026-07-20
- [x] **Post-3.4 — Audit B:** collaudi / verifiche Centro di Controllo — **CHIUSO** (PO 2026-07-23; esito positivo)
- [ ] **Post-3.4 — Audit A:** audit architetturale finale dominio Collaboration (DOC 28) — solo analisi
- [ ] **Post-3.4 — Validazione formale PO chiusura STEP-3**
- [ ] **STEP-4** — **non avviato** (hold PO: attività aggiuntive prima del passaggio)

### Gate cambiati in questa sessione

| Gate | Prima | Dopo |
|------|-------|------|
| — | — | Nessun gate G-MSG / DoD cambiato in questa sessione |

### Avanzamento processo

| Elemento | Esito sessione |
|----------|----------------|
| **Fasi completate** | STEP-1 Fase 1.1–1.3; STEP-2 Fase 2.1–2.6; STEP-3 Fase 3.1–3.4; **collaudi CC / Audit B** |
| **STEP completati** | STEP-1, STEP-2 (**STEP-3 non ancora chiuso formalmente**) |
| **Workflow completato** | No |
| **Punto esatto raggiunto** | WF-02 Attivo · STEP-3 · Post-3.4 **pronto al passaggio** · Audit B ☑ · Audit A ☐ · STEP-4 **non** iniziato (hold PO) |

### Prossimo checkpoint previsto

Attività aggiuntive PO → **Audit A (DOC 28)** → Validazione formale PO STEP-3 → **solo con autorizzazione PO** avvio STEP-4. **Non** anticipare STEP-4.
