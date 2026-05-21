# 🧠 AI BOOT DOCUMENT — TouringDiary (v45.0 — CERTIFIED ARCHITECTURE ENTRY POINT)

Questo documento è il punto di ingresso ufficiale per qualsiasi AI che lavori sul progetto TouringDiary.

Serve per:

• comprendere architettura reale sistema
• leggere correttamente la documentazione tecnica
• evitare regressioni
• mantenere coerenza tra codice e documentazione


---

# ORDINE DI LETTURA OBBLIGATORIO

Prima di analizzare il codice leggere:

AI_CONTEXT/00_AI_RULES.md  
AI_CONTEXT/01_PROJECT_MAP.md  
AI_CONTEXT/02_PROJECT_TECH_MAP.md  
AI_CONTEXT/03_PROJECT_LOGIC_MAP.md
AI_CONTEXT/04_PROJECT_PRICING_MAP.md  
AI_CONTEXT/05_CRITICAL_FILES_MAP.md  
AI_CONTEXT/06_CHANGE_IMPACT_RULES.md  
AI_CONTEXT/07_AI_WORKFLOW.md  


---

# REGOLA EVIDENZA DOCUMENTALE

AI_CONTEXT può essere aggiornato solo con evidenze verificabili da:

• file codice
• Edge Functions
• schema Supabase
• RPC database
• types Supabase
• services runtime


DESCRIZIONE SEMPLICE

Se qualcosa non è dimostrato dal codice, non deve entrare nella documentazione.


---

# ARCHITETTURA GENERALE SISTEMA

TouringDiary utilizza:

Frontend:

React  
Vite  
TypeScript  


Backend:

Supabase

Include:

PostgreSQL  
Auth  
Storage  
Edge Functions  


AI Engine:

Gemini tramite Edge Functions


Credit Engine:

user_ai_credits  
credit_transactions  
ai_global_usage  
extra_credit_packages  


RPC AI:

consume_ai_credits  
log_ai_usage_tokens  


Pagamenti:

Stripe  
purchase-extra-credits  
stripe-webhook  


Sponsor Engine:

sponsor_requests  
sponsors  
subscriptions  
sponsorActivationService  


Gamification Engine:

gamificationService  
xp_actions  
badges  
rewards_catalog  


Community Engine:

photoService  
community_posts  
live_snaps  
photo_likes  


Ranking Engine:

rankingService  
useRankingsLogic  


Staging Import Engine:

importService  
stagingService  
pois_staging  


PDF Engine:

RoadbookDocument.tsx


---

# PIPELINE PRINCIPALI SISTEMA


AI pipeline

Frontend  
→ Edge Function  
→ RPC consume_ai_credits  
→ Gemini  
→ RPC log_ai_usage_tokens  


credit purchase pipeline

utente paga  
→ purchase-extra-credits  
→ Stripe  
→ stripe-webhook  
→ credit_transactions  
→ user_ai_credits  


sponsor activation pipeline

richiesta sponsor  
→ approvazione admin  
→ sponsorActivationService  
→ subscriptions  
→ sponsor attivo  


staging import pipeline

importService  
→ pois_staging  
→ stagingService  
→ POI definitivi  


roadbook pipeline

TravelDiary  
→ RoadbookDocument.tsx  
→ export PDF


---

# REGOLA MODIFICHE SICURE

Prima di modificare codice:

analizzare impatto  
verificare types Supabase  
verificare policy RLS  
consultare PROJECT_LOGIC_MAP.md  
consultare CHANGE_IMPACT_RULES.md  


---

# OBIETTIVO DOCUMENTAZIONE AI_CONTEXT

fornire contesto alle AI  
ridurre regressioni  
mantenere allineamento codice-documentazione  
supportare evoluzione controllata del sistema