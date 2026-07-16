# 🧠 CHANGE IMPACT RULES — TouringDiary (v45.0 — CERTIFIED SAFE MODIFICATION PROTOCOL)

Questo documento definisce il processo obbligatorio da seguire prima di effettuare qualsiasi modifica al codice del progetto TouringDiary.

Serve per:

• evitare regressioni
• proteggere il sistema crediti AI
• proteggere pipeline Stripe
• proteggere sponsor lifecycle
• mantenere coerenza architetturale


---

# REGOLA FONDAMENTALE

Nessuna modifica al codice deve essere effettuata senza:

analisi impatto tecnica  
verifica pipeline coinvolte  
allineamento tra:

Utente  
ChatGPT  
Gemini


DESCRIZIONE SEMPLICE

Prima si analizza.

Poi si decide.

Solo dopo si modifica.


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

Se non è dimostrato dal codice, non entra nella documentazione.


---

# MODELLO ID (DUAL-FAMILY)

Prima di introdurre DEFAULT, cambiare tipo di PK, o “unificare” gli ID:

1. Leggere `AI_CONTEXT/33_ID_MODEL_DUAL_FAMILY.md`.
2. Ricordare: **territorio** → PK **text** (spesso senza DEFAULT, generate in app/RPC); **piattaforma** → PK **uuid** (spesso DEFAULT DB / `randomUUID`).
3. **Non** migrare verso un modello unico senza decisione PO formale.
4. Una macrofase «ID Governance» è solo **anticipata** (non approvata) — vedi DOC 33 e `01_EXECUTION_ROADMAP.md` §6.


---

# PROCESSO OBBLIGATORIO

Prima di modificare qualsiasi file devono essere dichiarati:


## 1 — PROBLEMA

Descrizione chiara della modifica richiesta.

Esempi:

bug UI  
errore runtime  
refactoring  
nuova feature  
ottimizzazione performance  
miglioria architetturale


---

## 2 — FILE POTENZIALMENTE IMPATTATI

Devono essere identificati:

componenti React  
hooks  
context  
services  
types  
Edge Functions  
RPC Supabase  
tabelle database


---

## 3 — RISCHI

Possibili effetti collaterali:

rottura layout  
rottura routing  
rottura sincronizzazione itinerario  
errori crediti AI  
errori Stripe  
errori sponsor activation  
errori gamification  
errori ranking  
errori community media


---

## 4 — STRATEGIA DI MODIFICA

Deve indicare:

quali file cambiano  
perché cambiano  
pipeline coinvolte  
tabelle coinvolte  
Edge Functions coinvolte  
RPC coinvolte


---

## 5 — VALIDAZIONE

Le modifiche possono essere applicate solo dopo conferma:

Utente  
ChatGPT  
Gemini


---

# VERIFICHE OBBLIGATORIE STANDARD

Prima di ogni modifica verificare:


### 1 — Analisi codice

Analizzare:

componenti  
hooks  
services  
context


---

### 2 — Verifica Types Supabase

Controllare:

src/types/supabase.ts


Serve per evitare mismatch schema.


---

### 3 — Analisi policy RLS

Verificare sempre:

authenticated  
anon


DESCRIZIONE SEMPLICE

Se manca una policy, Supabase blocca la query.


---

### 4 — Impatto UI

Verificare:

layout  
routing  
modali  
dashboard  
diario


---

### 5 — Coerenza documentazione

Verificare compatibilità con:

PROJECT_MAP.md  
PROJECT_TECH_MAP.md  
PROJECT_LOGIC_MAP.md  
CRITICAL_FILES_MAP.md


---

# VERIFICHE OBBLIGATORIE EDGE FUNCTIONS + CREDIT ENGINE

Prima di modificare:

AI planner  
Gemini chat  
Stripe  
credit packs  
sponsor activation


verificare sempre:


### Edge Functions coinvolte

cartella:

supabase/functions/


Funzioni critiche:

gemini-chat  
gemini-task  
purchase-extra-credits  
stripe-webhook


---

### RPC coinvolte

consume_ai_credits  
log_ai_usage_tokens


---

### Tabelle coinvolte

user_ai_credits  
credit_transactions  
ai_global_usage  
extra_credit_packages  
subscriptions  
pricing_versions


---

# VERIFICHE OBBLIGATORIE SPONSOR SYSTEM

Prima di modificare sponsor consultare e aggiornare:

AI_CONTEXT/29_SPONSOR_SECURITY_MASTERPLAN.md

Per **metodo di sviluppo e stato avanzamento** consultare:

AI_DEV_WORKFLOW/00_DEVELOPMENT_PROTOCOL.md  
AI_DEV_WORKFLOW/03_PROJECT_STATUS.md

Verificare anche:

sponsor_requests  
sponsors  
subscriptions  
sponsorActivationService


---

# VERIFICHE OBBLIGATORIE PLATFORM SETTINGS / CENTRO DI CONTROLLO

Prima di modificare feature flag globali, testi piattaforma, soglie o Centro di Controllo:

AI_CONTEXT/30_PLATFORM_SETTINGS_MASTERPLAN.md

Verificare anche:

global_settings
system_messages
settingsService
communicationService
ConfigContext


---

# VERIFICHE OBBLIGATORIE GAMIFICATION SYSTEM

Verificare:

gamificationService  
xp_actions  
badges  
rewards_catalog


---

# VERIFICHE OBBLIGATORIE COMMUNITY SYSTEM

Verificare:

photoService  
community_posts  
live_snaps  
photo_likes


---

# VERIFICHE OBBLIGATORIE STAGING IMPORT SYSTEM

Verificare:

importService  
stagingService  
pois_staging


---

# AGGIORNAMENTO DOCUMENTAZIONE A FINE SVILUPPO

Al termine di ogni sviluppo (Fase, STEP, Workflow o modifica significativa al codice), verificare **esplicitamente** se aggiornare:

| Layer | Percorso | Quando aggiornare |
|-------|----------|-------------------|
| **AI_CONTEXT** | `AI_CONTEXT/` | Architettura, dominio, SSOT, gate, DoD di dominio, evidenze da codice/DB |
| **AI_CONTEXT_MASTER** | `AI_CONTEXT_MASTER/` | Sintesi consolidata certificata da riallineare al codice |
| **AI_DEV_WORKFLOW** | `AI_DEV_WORKFLOW/` | Stato avanzamento, roadmap, Workflow, report operativo |

**Regola:** non aggiornare un layer se non necessario; dichiarare nel **report operativo finale** (`00_DEVELOPMENT_PROTOCOL.md` §15) — ultima sezione di ogni risposta operativa — cosa è stato aggiornato e cosa no (con motivazione).

Matrice dettagliata per tipo di modifica → `AI_DEV_WORKFLOW/README.md` (sezione *Aggiornamento documentale a fine sviluppo*).

---

# OBIETTIVO

Ridurre:

bug non intenzionali  
regressioni architetturali  
rotture pipeline economiche  
rotture AI pipeline  
rotture sponsor lifecycle


Garantire:

modifiche consapevoli  
coerenza sistemica  
stabilità evolutiva piattaforma