# 🤖 MASTER 07: AI ENGINE

## DESCRIZIONE SEMPLICE
L'AI Engine integra i modelli Google Gemini (Pro e Flash) all'interno dell'esperienza di viaggio. Gestisce la generazione di itinerari, la chat contestuale e l'arricchimento dei dati, monitorando costantemente il consumo di risorse e il sistema di crediti degli utenti.

---

## PIPELINE RUNTIME

### 1. Chat Contestuale (Gemini-Chat)
*   **Prompt**: L'utente chiede informazioni su una città o POI.
*   **Context**: Il frontend inietta dati dal `cityManifest` o `poiDetails`.
*   **Edge Function**: `gemini-chat` elabora con modello `gemini-1.5-flash` o `pro`.
*   **Economy**: Scalo crediti immediato tramite RPC `consume_ai_credits`.

### 2. Task Enrichment (Gemini-Task)
*   **Operazione**: Generazione itinerario o espansione descrizioni.
*   **Edge Function**: `gemini-task` (modalità `enrichment` o `planning`).
*   **Output**: JSON strutturato pronto per la visualizzazione o salvataggio.

---

## MONITORAGGIO & ECONOMIA

### 1. Credit Consumption RPC
*   **Funzione**: `consume_ai_credits`.
*   **Logica**: Verifica saldo extra (`user_ai_credits`) e quota giornaliera (`profiles.daily_ai_counter`).
*   **Sicurezza**: Eseguita lato server per prevenire abusi.

### 2. Token Logging
*   **Funzione**: `log_ai_usage_tokens`.
*   **Scopo**: Registra `prompt_tokens` e `completion_tokens` per analisi costi e BI.
*   **Persistenza**: Tabella `ai_global_usage`.

### 3. Model Routing
*   **Logica**: In base al piano utente (`free` vs `pro`), l'app seleziona automaticamente tra modelli Flash (veloci/economici) o Pro (avanzati/costosi).

---

## COMPONENTI ARCHITETTURALI
*   **Edge Functions**: `gemini-chat`, `gemini-task`.
*   **Service**: `aiGateway.ts` (Punto di ingresso unico per le chiamate AI).
*   **Hook**: `useAiGeneration.ts`.
*   **Service Admin**: `aiAdminService.ts`.

## TABELLE DATABASE COINVOLTE
*   `profiles`, `user_ai_credits`, `ai_global_usage`, `credit_transactions`, `pricing_versions`.
