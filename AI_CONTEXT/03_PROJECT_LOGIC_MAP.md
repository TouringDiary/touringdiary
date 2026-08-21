# 🧠 DOC 03: PROJECT LOGIC MAP (v45.0 — EXECUTION PIPELINES CERTIFICATE)

Questo documento descrive la logica operativa reale del sistema TouringDiary.

Include:

• pipeline AI
• pipeline crediti
• pipeline sponsor
• pipeline pricing
• pipeline gamification
• pipeline social
• pipeline ranking
• pipeline staging POI
• pipeline diario
• pipeline Roadbook


---

# AI EXECUTION FLOW (CERTIFICATO)

Pipeline reale verificata da codice:

Frontend
→ Edge Function
→ RPC consume_ai_credits
→ Gemini API
→ RPC log_ai_usage_tokens
→ risposta frontend


DESCRIZIONE SEMPLICE

Prima vengono scalati i crediti.

Solo dopo viene eseguita la richiesta AI.


---

# CREDIT PURCHASE FLOW (CERTIFICATO)

Pipeline:

utente acquista crediti
→ purchase-extra-credits Edge Function
→ Stripe Checkout
→ stripe-webhook Edge Function
→ insert credit_transactions
→ insert user_ai_credits
→ crediti disponibili


DESCRIZIONE SEMPLICE

Stripe conferma il pagamento automaticamente e aggiorna il saldo crediti.


---

# CREDIT STORAGE MODEL (CERTIFICATO)

Tabelle coinvolte:

user_ai_credits
credit_transactions
ai_global_usage
extra_credit_packages


Responsabilità:

gestione saldo
storico acquisti
monitoraggio utilizzo
limiti giornalieri/mensili


DESCRIZIONE SEMPLICE

I crediti non sono salvati in un solo campo.

Sono gestiti come pacchetti separati con scadenza.


---

# PRICING VERSIONING FLOW (CERTIFICATO)

Pipeline:

creazione pricing_versions
→ associazione campaigns
→ configurazione limiti AI
→ collegamento subscriptions
→ attivazione versione pricing


DESCRIZIONE SEMPLICE

Permette di cambiare i prezzi senza modificare il codice.


---

# SUBSCRIPTION LIMIT ENGINE (CERTIFICATO)

Pipeline:

lettura subscriptions
→ lettura pricing_versions
→ aggregazione ai_global_usage
→ calcolo limiti residui


Servizio coinvolto:

subscriptionService


DESCRIZIONE SEMPLICE

Calcola quanti crediti restano disponibili.


---

# SPONSOR ACTIVATION FLOW (CERTIFICATO)

Pipeline:

richiesta sponsor
→ record sponsor_requests
→ approvazione admin
→ attivazione sponsorActivationService
→ creazione subscription sponsor
→ stato sponsor attivo


DESCRIZIONE SEMPLICE

Lo sponsor diventa visibile solo dopo attivazione.


---

# GAMIFICATION FLOW (CERTIFICATO)

Pipeline:

azione utente
→ gamificationService.addXp()
→ update profiles.xp
→ verifica badges
→ verifica rewards_catalog


Tabelle coinvolte:

xp_actions
badges
rewards_catalog


DESCRIZIONE SEMPLICE

Ogni azione genera esperienza e premi.


---

# COMMUNITY SOCIAL FLOW (CERTIFICATO)

Pipeline:

upload contenuto
→ photoService
→ insert community_posts
→ insert live_snaps
→ gestione photo_likes


DESCRIZIONE SEMPLICE

Gli utenti possono pubblicare contenuti e ricevere interazioni.


---

# Q&A LOCAL FLOW (CERTIFICATO)

Pipeline:

creazione domanda (`community_posts`, id da `gen_random_uuid()`)
→ trigger auto-follow owner (`user_interactions` follow)
→ risposte persistenti (`community_replies` via RPC `add_community_reply`)
→ identità autore da `auth.uid()` + `profiles`
→ owner: vietata root reply; consentite nested reply
→ trigger after reply: `replies_count` + notifiche ai follower attivi
→ deep-link notifica: `section=community`, `tab=qa`, `targetId=postId`

Contratto:
- `community_posts.replies` jsonb = legacy (non write path nuove reply)
- guest → AuthModal standard (`openModal('auth')` / `onOpenAuth`, come diario e Live Feed)
- Segui ≠ like: `interaction_type='follow'`
- Ritorno città: click città nella lista → `navigateToCity` + memoria session (`qaCityReturnMemory`: cityId/postId/filtro/scroll); Back dalla stessa città consuma la memoria, torna Home path e riapre Community Hub tab Q&A **dopo** il cleanup pathname (evita che `closeModal` dell'effect cancelli il hub); restore filtro/scroll; postId ancora logica opzionale (non apre automaticamente il thread); memoria ignorata se cityId ≠ città attiva
- Dettaglio autore Q&A: overlay locale (pattern dialog A1 + `CloseButton` / Escape LIFO); non chiude Community Hub e non altera la browser history


DESCRIZIONE SEMPLICE

Q&A Local: domande persistenti, follow, thread di risposte e notifiche follower.
Click città → pagina città; Indietro → ritorno al Q&A nello stesso punto lista.


---

# RANKING FLOW (CERTIFICATO)

Pipeline:

raccolta attività utente
→ rankingService
→ useRankingsLogic
→ rendering leaderboard


DESCRIZIONE SEMPLICE

Genera classifiche dinamiche utenti.


---

# STAGING IMPORT POI FLOW (CERTIFICATO)

Pipeline:

importService scarica dati
→ insert pois_staging
→ stagingService valida dati
→ migrazione POI definitivi


DESCRIZIONE SEMPLICE

Permette import controllato da fonti esterne.


---

# DIARIO SALVATAGGIO FLOW

Pipeline:

modifica itinerario
→ useDiaryLogic
→ update stato locale
→ sync Supabase


DESCRIZIONE SEMPLICE

Il diario salva automaticamente le modifiche.


---

# JOURNEY PHASE DETECTION FLOW (CERTIFICATO)

Pipeline:

lettura stato viaggio
→ useJourneyPhase
→ classificazione fase:

planning
travel
memory


DESCRIZIONE SEMPLICE

Capisce in quale fase del viaggio si trova l’utente.


---

# SUITCASE SYSTEM FLOW (CERTIFICATO)

Pipeline:

inizializzazione lista
→ useSuitcaseSystem
→ aggiornamento dinamico contenuti


DESCRIZIONE SEMPLICE

Gestisce automaticamente la packing list.


---

# ROADBOOK GENERATION FLOW (CERTIFICATO)

Pipeline:

TravelDiary
→ raccolta dati itinerario
→ RoadbookDocument.tsx
→ PdfStyles.ts
→ export PDF


DESCRIZIONE SEMPLICE

Genera la guida stampabile del viaggio.