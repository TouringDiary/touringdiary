# 🌐 MASTER 01: SYSTEM OVERVIEW

## DESCRIZIONE SEMPLICE
TouringDiary è una piattaforma avanzata per la pianificazione di viaggi e la scoperta territoriale. Combina l'intelligenza artificiale (Gemini) per la generazione di itinerari personalizzati con un motore territoriale certificato che aggrega punti di interesse (POI), eventi, storie locali e servizi professionali (Guide e Tour Operator). La piattaforma supporta un modello economico basato su crediti AI e un ecosistema business per sponsor e marketplace locali (Botteghe).

## DESCRIZIONE TECNICA
L'architettura è basata su uno stack moderno:
*   **Frontend**: React + Vite + Tailwind CSS, ottimizzato per un'esperienza "App-like" su mobile.
*   **Backend & DB**: Supabase (PostgreSQL) con logica distribuita tra Row Level Security (RLS) e RPC.
*   **AI Layer**: Google Gemini integrato tramite Supabase Edge Functions per garantire sicurezza e scalabilità.
*   **Infrastruttura**: Architettura serverless con gestione degli asset tramite Supabase Storage.

## TIPOLOGIE UTENTI
1.  **Guest**: Accesso in sola lettura a città e POI; AI limitata.
2.  **Registered**: Accesso completo al Diario di Viaggio, Gamification e AI Planner (quota base).
3.  **Pro/Premium**: Utenti con abbonamenti attivi, limiti AI estesi e funzionalità avanzate (es. Export PDF).
4.  **Partner/Sponsor**: Entità territoriali (Botteghe, Guide) con visibilità premium e strumenti CRM.
5.  **Admin**: Controllo totale su pricing, moderazione, importazione dati e observatory BI.

## LAYER ARCHITETTURALI
*   **Territorial Engine**: Gestisce la gerarchia geografica (Nazione -> Regione -> Zona -> Città) e le entità collegate (Cultura, Eventi, Servizi).
*   **AI Engine**: Orchestrazione prompt, gestione token, log di utilizzo e consumo crediti in tempo reale.
*   **Business Engine**: Gestione abbonamenti (Stripe), sponsorizzazioni, marketplace e tracciamento affiliazioni.
*   **Community & Gamification**: Sistema di XP, badge, recensioni certificate e condivisione media.

## COMPONENTI ARCHITETTURALI
*   **Services**: `cityService.ts`, `aiService.ts`, `sponsorService.ts`, `trackingService.ts`.
*   **Hooks**: `useAppInitialization.ts`, `useAiGeneration.ts`, `useInteraction.ts`.
*   **Edge Functions**: `gemini-chat`, `gemini-task`, `stripe-webhook`.

## TABELLE DATABASE COINVOLTE
*   `profiles`, `cities`, `pois`, `sponsors`, `subscriptions`, `user_ai_credits`, `global_settings`.
