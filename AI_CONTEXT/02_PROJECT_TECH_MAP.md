# 🗺️ DOC 02: PROJECT TECH MAP (v45.0 — EDGE FUNCTIONS + CREDIT ENGINE CERTIFICATO)

Questo documento descrive l’architettura tecnica reale del sistema TouringDiary.


Serve per comprendere:

• backend Supabase
• Edge Functions
• credit engine AI
• pricing engine
• sponsor lifecycle
• pipeline servizi core


---

# STACK TECNOLOGICO PRINCIPALE

Frontend

React + Vite + TypeScript


Backend

Supabase

Include:

• PostgreSQL database
• Auth
• Storage
• Edge Functions


Styling

TailwindCSS


AI Engine

Gemini tramite Edge Functions


DESCRIZIONE SEMPLICE

Il browser comunica sempre con Supabase prima dell’AI.


---

# EDGE FUNCTIONS LAYER

Funzioni verificate:

• gemini-chat
• gemini-task
• purchase-extra-credits
• stripe-webhook


Responsabilità:

• validazione prompt
• verifica crediti
• logging token usage
• gestione pagamenti Stripe


---

# PIPELINE AI CERTIFICATA

Pipeline reale:

Frontend
→ Edge Function
→ RPC consume_ai_credits
→ Gemini API
→ RPC log_ai_usage_tokens
→ risposta frontend


DESCRIZIONE SEMPLICE

I crediti vengono scalati prima della chiamata AI.


---

# CREDIT ENGINE LAYER

Sistema gestione crediti verificato.

Tabelle:

• user_ai_credits
• credit_transactions
• ai_global_usage
• extra_credit_packages


RPC:

• consume_ai_credits
• log_ai_usage_tokens


Responsabilità:

• verifica saldo
• decremento crediti
• logging token
• storico transazioni


---

# PRICING ENGINE LAYER

Sistema versioning prezzi verificato.

Tabelle:

• pricing_versions
• campaigns
• subscriptions
• extra_credit_packages


Responsabilità:

• definizione piani
• gestione limiti AI
• attivazione versioni pricing


---

# SUBSCRIPTION ENGINE

Gestito tramite:

subscriptionService


Responsabilità:

• calcolo limiti residui
• collegamento pricing_versions
• collegamento sponsor_id


---

# SPONSOR ACTIVATION ENGINE

Servizio verificato:

sponsorActivationService


Responsabilità:

• attivazione sponsor
• collegamento subscription
• gestione stato sponsor


---

# GAMIFICATION ENGINE

Servizio verificato:

gamificationService


Tabelle:

• xp_actions
• badges
• rewards_catalog


Responsabilità:

• gestione XP
• assegnazione badge
• gestione reward


---

# COMMUNITY MEDIA ENGINE

Servizio verificato:

photoService


Tabelle:

• community_posts
• live_snaps
• photo_likes


Responsabilità:

• upload contenuti
• moderazione
• interazioni social


---

# RANKING ENGINE

Servizio verificato:

rankingService


Hook:

useRankingsLogic


Responsabilità:

• calcolo leaderboard
• aggregazione attività utenti


---

# STAGING IMPORT ENGINE

Servizi verificati:

• importService
• stagingService


Tabella:

pois_staging


Responsabilità:

• import dati esterni
• validazione staging
• inserimento definitivo POI


---

# TYPES SAFETY LAYER

File principale:

src/types/supabase.ts


Responsabilità:

• mapping schema DB
• type safety frontend
• validazione query