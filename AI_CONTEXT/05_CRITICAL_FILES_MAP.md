# 🧠 CRITICAL FILES MAP — TouringDiary (v45.0 — CERTIFIED FROM CODE EVIDENCE)

Questo documento identifica i file più critici dell’architettura TouringDiary.

Modifiche a questi file possono avere impatti su più parti del sistema.

Prima di modificare uno di questi file è obbligatorio:

• analizzare dipendenze
• verificare pipeline coinvolte
• consultare PROJECT_LOGIC_MAP.md
• applicare CHANGE_IMPACT_RULES.md
• allineare Utente + ChatGPT + Gemini


DESCRIZIONE SEMPLICE

Questi file controllano il funzionamento globale del sistema.

Modificarli senza analisi può causare regressioni.


---

# LAYER CORE NAVIGATION


## src/context/NavigationContext.tsx

Ruolo

Gestisce il routing state-driven dell’intera applicazione.

Controlla:

• activeCityId
• virtualCity
• activeShopId
• vista principale corrente


Impatto modifiche

Può bloccare:

navigazione
rendering contenuti
routing logico app


---

# LAYER APPLICATION COORDINATION


## src/components/layout/AppCoordinator.tsx

Ruolo

Orchestratore inizializzazione app.


Gestisce:

• bootstrap contesti globali
• configurazioni iniziali
• caricamento servizi core


Impatto modifiche

Può impedire l’avvio corretto dell’app.


---

## src/components/layout/AppRouter.tsx

Ruolo

Gestisce selezione viste principali.


Impatto modifiche

Può bloccare accesso a sezioni intere.


---

## src/components/layout/ModalManager.tsx

Ruolo

Gestione modali globali applicazione.


Impatto modifiche

Può bloccare:

login
POI detail
review
modali sponsor
modali admin


---

# LAYER STATE MANAGEMENT


## src/context/UserContext.tsx

Ruolo

Gestione autenticazione e sessione utente.


Impatto modifiche

Può rompere login e permessi.


---

## src/context/ConfigContext.tsx

Ruolo

Gestione configurazioni dinamiche UI.


Dipende da:

global_settings


Impatto modifiche

Può compromettere rendering UI dinamico.


---

## src/context/ItineraryContext.tsx

Ruolo

Gestione stato itinerario attivo.


Impatto modifiche

Può compromettere il cuore del prodotto.


---

# LAYER CORE EXPERIENCE


## src/components/features/diary/TravelDiary.tsx

Ruolo

Gestione timeline viaggio.


Include:

drag & drop
giorni
tappe
memo


Impatto modifiche

Può rompere esperienza principale utente.


---

## src/hooks/useDiaryLogic.ts

Ruolo

Gestione logica operativa itinerario.


Impatto modifiche

Può causare perdita sincronizzazione dati.


---

# LAYER AI SYSTEM


## src/services/aiUsageService.ts

Ruolo

Gestione consumo crediti AI tramite RPC:

consume_ai_credits  
log_ai_usage_tokens


Impatto modifiche

Può rompere:

AI planner
AI assistant
credit engine


---

## src/hooks/useAiGeneration.ts

Ruolo

Orchestrazione UI generazioni AI.


Gestisce:

errori
stato richiesta
consumo crediti


Impatto modifiche

Può bloccare tutte le funzioni AI frontend.


---

# LAYER CREDIT ENGINE


## src/services/subscriptionService.ts

Ruolo

Calcolo limiti residui utenti.


Dipende da:

subscriptions  
pricing_versions  
ai_global_usage


Impatto modifiche

Può alterare disponibilità crediti.


---

## src/services/aiAdminService.ts

Ruolo

Gestione pricing e limiti AI lato admin.


Impatto modifiche

Può compromettere configurazioni economiche piattaforma.


---

# LAYER SPONSOR SYSTEM


## src/services/sponsors/sponsorActivationService.ts

Ruolo

Attivazione sponsor verificata da codice.


Gestisce:

collegamento subscription  
stato sponsor  
visibilità piattaforma


Impatto modifiche

Può bloccare attivazione sponsor.


---

## src/services/sponsors/sponsorRequestsService.ts

Ruolo

Gestione workflow richieste sponsor.


Impatto modifiche

Può bloccare onboarding partner business.


---

# LAYER COMMUNITY SYSTEM


## src/services/photoService.ts

Ruolo

Gestione contenuti community:

community_posts  
live_snaps  
photo_likes


Impatto modifiche

Può rompere sistema social.


---

# LAYER GAMIFICATION


## src/services/gamificationService.ts

Ruolo

Gestione XP utenti.


Dipende da:

xp_actions  
badges  
rewards_catalog


Impatto modifiche

Può compromettere progressione utenti.


---

# LAYER RANKING SYSTEM


## src/services/rankingService.ts

Ruolo

Calcolo classifiche utenti.


Hook associato:

useRankingsLogic.ts


Impatto modifiche

Può compromettere leaderboard.


---

# LAYER STAGING IMPORT SYSTEM


## src/services/stagingService.ts

Ruolo

Validazione dati staging POI.


Dipende da:

pois_staging


Impatto modifiche

Può compromettere import dati territoriali.


---

## src/services/importService.ts

Ruolo

Import dati esterni POI.


Impatto modifiche

Può bloccare pipeline ingestione dati.


---

# LAYER PDF ENGINE


## src/components/pdf/RoadbookDocument.tsx

Ruolo

Rendering Roadbook PDF.


Dipende da:

PdfStyles.ts


Impatto modifiche

Può bloccare export guida viaggio.


---

# LAYER EDGE FUNCTIONS (SERVER-SIDE CRITICO)


supabase/functions/gemini-chat  
supabase/functions/gemini-task  
supabase/functions/purchase-extra-credits  
supabase/functions/stripe-webhook


Ruolo

Gestiscono:

pipeline AI  
credit engine  
Stripe checkout  
aggiornamento saldo crediti


Impatto modifiche

Può compromettere:

AI planner  
pagamenti  
sponsor activation  
credit system