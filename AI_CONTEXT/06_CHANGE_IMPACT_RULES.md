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

Prima di modificare sponsor verificare:

sponsor_requests  
sponsors  
subscriptions  
sponsorActivationService


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