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

# LAYER OPERATIVO SVILUPPO

Metodo di sviluppo, roadmap esecutiva e stato avanzamento **non** vivono in `AI_CONTEXT`.

Per *come sviluppiamo* e *dove siamo nel lavoro*:

AI_DEV_WORKFLOW/README.md  
AI_DEV_WORKFLOW/03_PROJECT_STATUS.md  


### Flusso di lettura operativo (dopo il boot architetturale)

Quando l'attività riguarda **sviluppo in corso** o **stato del progetto**, leggere in questo ordine:

```
AI_DEV_WORKFLOW/README.md
        ↓
AI_DEV_WORKFLOW/03_PROJECT_STATUS.md
        ↓
Workflow attivo (WORKFLOWS/WF_XX_*.md)
```

Poi — solo se serve decisione architetturale — gli SSOT di dominio in `AI_CONTEXT/`.

Per le convenzioni operative di sviluppo (incluso il report operativo finale), fare riferimento a `AI_DEV_WORKFLOW/00_DEVELOPMENT_PROTOCOL.md`.


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

Sponsor Security SSOT (audit, architettura, gate implementazione):

AI_CONTEXT/29_SPONSOR_SECURITY_MASTERPLAN.md

Platform Settings / Centro di Controllo SSOT (feature flag globali, testi configurabili, soglie):

AI_CONTEXT/30_PLATFORM_SETTINGS_MASTERPLAN.md


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


Collaboration & Workspace Engine (v1):

shared_resources  
workspaces  
collaboration_domain_events  
friendService  
workspaceAttachmentService  
CollaborationShareModal  
(DOC 28)


Packing & Suitcase Engine:

packing_standard_items  
packing_template_items  
packing_ai_catalog  
useSuitcaseSystem  
(DOC 31)


Design System Foundation:

design_system_rules  
useFoundationStyles  
FocusMode / layerRegistry  
(DOC 32)


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