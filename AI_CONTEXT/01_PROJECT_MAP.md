# 🗺️ DOC 01: PROJECT MAP (ARCHITETTURA v6.0)

Mappa concettuale completa del sistema TouringDiary.

Questo documento descrive:

• domini applicativi principali
• pipeline funzionali
• moduli logici verificati dal codice
• sistemi economici AI
• sistemi social e gamification
• sistemi sponsor e pricing


---

# 1. 🏠 CORE & NAVIGAZIONE

Shell principale:

AppShell


Gestisce:

• Header
• Sidebar
• Content area


Routing:

Gestito tramite NavigationContext (state-driven routing).


DESCRIZIONE SEMPLICE

L’app non cambia pagina.

Mostra contenuti diversi in base allo stato interno.


---

# 2. 🏛️ DOMINIO CITTÀ

Gestisce:

• cities
• POI
• servizi locali
• eventi
• media territoriali


Pipeline:

Database
→ cityReadService
→ cache locale
→ rendering UI


DESCRIZIONE SEMPLICE

Le città sono il cuore informativo della piattaforma.


---

# 3. 📒 DOMINIO DIARIO DI VIAGGIO

Componente principale:

TravelDiary.tsx


Gestisce:

• timeline giornaliera
• tappe POI
• memo testuali
• risorse viaggio


Pipeline:

User interaction
→ itinerary state
→ sync Supabase


DESCRIZIONE SEMPLICE

Permette di costruire il viaggio giorno per giorno.


---

# 4. 🧠 DOMINIO AI

Gestito tramite Edge Functions Supabase:

• gemini-chat
• gemini-task


Pipeline reale verificata:

Frontend
→ Edge Function
→ RPC consume_ai_credits
→ Gemini
→ RPC log_ai_usage_tokens
→ risposta frontend


DESCRIZIONE SEMPLICE

L’AI controlla i crediti prima di rispondere.


---

# 5. 💳 DOMINIO CREDITI AI

Sistema economico AI verificato da codice.

Tabelle:

• user_ai_credits
• credit_transactions
• ai_global_usage
• extra_credit_packages


RPC:

• consume_ai_credits
• log_ai_usage_tokens


Pipeline:

azione utente
→ verifica crediti
→ esecuzione AI
→ logging consumo


DESCRIZIONE SEMPLICE

Ogni funzione AI consuma crediti tracciati nel database.


---

# 6. 💰 DOMINIO PRICING & SUBSCRIPTIONS

Sistema versioning prezzi verificato da codice.

Tabelle:

• pricing_versions
• campaigns
• subscriptions
• extra_credit_packages


Responsabilità:

• gestione piani AI
• versioning offerte
• configurazione limiti
• collegamento sponsor ai piani


DESCRIZIONE SEMPLICE

Permette di cambiare prezzi senza modificare codice.


---

# 7. 💼 DOMINIO SPONSOR

Gestisce ciclo vita sponsor.

Entità:

• sponsor_requests
• sponsors
• subscriptions (relazione sponsor_id)


Servizio:

sponsorActivationService


Pipeline:

richiesta sponsor
→ approvazione admin
→ attivazione subscription
→ visibilità pubblica


DESCRIZIONE SEMPLICE

Lo sponsor diventa visibile solo dopo attivazione.


Sicurezza, audit e progettazione definitiva del dominio (SSOT):

AI_CONTEXT/29_SPONSOR_SECURITY_MASTERPLAN.md


---

# 7b. ⚙️ DOMINIO PLATFORM SETTINGS

Configurazione globale trasversale (non Sponsor):

• feature flag piattaforma (AI, chat, candidature)
• testi configurabili (`system_messages`)
• soglie globali (es. rating alert)
• sezione Admin Centro di Controllo (target)

SSOT:

AI_CONTEXT/30_PLATFORM_SETTINGS_MASTERPLAN.md

Storage esistente:

tabella global_settings
tabella system_messages
ConfigContext / settingsService


---

# 7c. 📋 LAYER SVILUPPO OPERATIVO (fuori AI_CONTEXT)

Metodo di sviluppo, roadmap esecutiva e stato avanzamento — **non** architettura di dominio:

AI_DEV_WORKFLOW/

Ingresso: README.md e 03_PROJECT_STATUS.md


---

# 8. 🎮 DOMINIO GAMIFICATION

Sistema XP verificato da codice.

Componenti:

• gamificationService
• xp_actions
• badges
• rewards_catalog


Pipeline:

azione utente
→ incremento XP
→ verifica badge
→ sblocco reward


DESCRIZIONE SEMPLICE

Le azioni dell’utente generano progressione.


---

# 9. 📸 DOMINIO COMMUNITY & SOCIAL

Sistema social verificato da codice.

Componenti:

• photoService
• community_posts
• live_snaps
• photo_likes


Pipeline:

upload contenuto
→ salvataggio database
→ interazioni utenti


DESCRIZIONE SEMPLICE

Gli utenti possono condividere contenuti.


---

# 10. 🏆 DOMINIO RANKING

Sistema classifiche verificato da codice.

Componenti:

• rankingService
• useRankingsLogic


Pipeline:

raccolta dati attività
→ calcolo ranking
→ visualizzazione leaderboard


DESCRIZIONE SEMPLICE

Mostra classifiche utenti o contenuti.


---

# 11. 📥 DOMINIO STAGING IMPORT POI

Sistema importazione dati territoriali verificato da codice.

Componenti:

• importService
• stagingService
• pois_staging


Pipeline:

import dati esterni
→ staging
→ validazione
→ inserimento definitivo


DESCRIZIONE SEMPLICE

Permette import controllato di nuovi POI.


---

# 12. 📄 DOMINIO ROADBOOK PDF

Generazione PDF itinerario.

Componenti:

• RoadbookDocument.tsx


Pipeline:

TravelDiary
→ raccolta dati
→ layout PDF
→ esportazione


DESCRIZIONE SEMPLICE

Trasforma il viaggio in guida stampabile.


---

# 13. 🎨 DESIGN SYSTEM DINAMICO

Origine:

tabella global_settings


Pipeline:

database
→ ConfigContext
→ UI rendering


DESCRIZIONE SEMPLICE

Permette modifiche UI senza deploy codice.


---

# 14. 🤝 DOMINIO COLLABORATION & WORKSPACE (v1 — Fase 10)

Sistema condivisione e workspace verificato da codice (Fasi 1–10 concluse).

Componenti:

• src/services/collaboration/
• CollaborationShareModal
• UserSharingTab / UserFriendsTab


Pipeline:

condivisione wizard
→ shared resource / workspace
→ inviti + notifiche + eventi dominio


Documentazione completa:

AI_CONTEXT/28_COLLABORATION_WORKSPACE_SYSTEM.md


DESCRIZIONE SEMPLICE

Permette di condividere Diario e Valigia con collaboratori, organizzare workspace e gestire amicizie.