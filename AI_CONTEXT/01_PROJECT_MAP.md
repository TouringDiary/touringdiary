# 🗺️ DOC 01: PROJECT MAP (ARCHITETTURA v6.0)

> **Mappa concettuale** del sistema TouringDiary.  
> Serve all’orientamento: quali domini esistono e come si collegano a runtime.  
> **Non** è Source of Truth di dominio e **non** sostituisce gli SSOT in `AI_CONTEXT/`  
> (es. DOC 34A, DOC 37, DOC 28, DOC 31, …). Per regole e modelli ufficiali usare sempre quei documenti.

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

# 3. 📂 DOMINIO VIAGGIO (patrimonio personale)

Dominio ufficiale (congelato):

```text
Viaggio                          ← Aggregate Root
├── Diario                       ← Resource (narrazione / piano)
├── Valigia                      ← Resource
├── Ricordi                      ← Resource (Foto · Video · Note/giorno)
├── Allegati                     ← Resource
├── Roadbook                     ← Library (snapshot)
├── Mappa                        ← View
└── Riepilogo                    ← View
```

> **Nota:** il modello ufficiale del dominio Viaggio è definito esclusivamente in  
> `34A_DOMAIN_DESIGN_RULES.md` (regole) e `37_VIAGGIO_DOMAIN.md` (struttura / lifecycle).  
> Questa sezione è solo una sintesi di orientamento.

**SoT:** `AI_CONTEXT/34A_DOMAIN_DESIGN_RULES.md` · `AI_CONTEXT/37_VIAGGIO_DOMAIN.md`  
**Implementazione (conclusa):** `AI_DEV_WORKFLOW/MASTERPLANS/MP_01_VIAGGIO_DOMAIN_IMPLEMENTATION.md` (MP-01 · MP-02 · WF-13)

Il **Diario** non è il Viaggio: è una risorsa del Viaggio (0..N; Diario attivo).

Componente runtime del Diario (UI operativa, non Aggregate Root):

TravelDiary.tsx

Gestisce (sul Diario attivo del Viaggio):

• timeline giornaliera
• tappe POI
• memo testuali

Pipeline runtime:

User interaction
→ `ItineraryContext` (stato Diario operativo)
→ sync cloud (`ItineraryStorageManager` → `saveUserDraft` crea/collega il Viaggio Aggregate Root)

> **Nota:** il dominio di prodotto vigente è Viaggio Aggregate Root (DOC 34A / DOC 37). `TravelDiary` è il componente runtime del Diario; non è il centro del modello.

DESCRIZIONE SEMPLICE

Il Viaggio è il patrimonio. Il Diario costruisce piano e racconto giorno per giorno all’interno del Viaggio.


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

Modello ID trasversale (territorio text / piattaforma UUID) — registrazione, non Workflow:

AI_CONTEXT/33_ID_MODEL_DUAL_FAMILY.md


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

# 12. 📄 DOMINIO ROADBOOK / EXPORT PDF

Generazione PDF/DOCX itinerario (guida stampabile).

Componenti:

• `ExportModal.tsx` — UI export + anteprima WYSIWYG A4
• `TravelDocument.tsx` — layout PDF itinerario
• `RoadbookDocument.tsx` — layout PDF Roadbook
• `exportGenerators.ts` — DOCX
• `ExportLogo.tsx` / `useLogoRasterizer.ts` — logo (viewBox condivisi)
• `heroCoverCollagePlan.ts` — collage copertina condiviso PDF/DOCX/Preview


Pipeline:

TravelDiary / ExportModal
→ `prepareItineraryForPdf` (SoT immagini, una sola prepare)
→ layout PDF | DOCX | Preview HTML
→ esportazione


Note architetturali (export itinerario):

• Logo: viewBox icona/completo allineati; rasterizzazione icona senza stretch
• Copertina multi-città: `buildHeroCoverCollagePlan` + `HERO_COVER_STACK_GAP` condivisi
• Preview HTML: stesso preparedDoc del PDF, footer editoriale «Pagina X di Y»
• Distanze: SoT unica `itineraryDistance.ts` (Diario + `prepareItineraryForPdf`); marker distanza in testa alla tappa di arrivo


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

Permette di collaborare su **copie** di Diario, Valigia e Template (e, in target, Workspace da Viaggio). Il Viaggio originale non si condivide. Dominio patrimonio: DOC 34A / DOC 37.