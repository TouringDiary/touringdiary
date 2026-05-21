# 🛡️ DOC 08: ADMIN CONTROL CENTER GUIDE (v2.0 — CERTIFIED)

Questa guida operativa definisce le procedure amministrative per la gestione di TouringDiary. È destinata esclusivamente agli utenti con ruolo `admin_all` o `admin_limited`.

---

## 1. ARCHITETTURA PANNELLO ADMIN

Il sistema di controllo amministrativo è centralizzato in `AdminDashboard.tsx` ed è strutturato come un hub modulare con caricamento asincrono (`React.lazy`).

### Struttura Principale:
*   **Sidebar Navigation**: Gestita in `AdminSidebar.tsx`. Permette il passaggio rapido tra le viste (Cities, Users, Sponsors, AI Economics, etc.).
*   **Main Hub**: `AdminDashboard.tsx` coordina le sezioni tramite lo stato `view`.
*   **Modulo AI Economics**: Centralizzato in `AdminControlCenterAI.tsx` (Torre di controllo).

---

## 2. GESTIONE AI & ECONOMICS (CERTIFICATO)

### Calcolo MRR vs Costi AI
Il sistema calcola la sostenibilità in tempo reale tramite la RPC `get_ai_economics_stats_v4` (verificata in `aiAdminService.ts:379`).
*   **Ricavi (MRR)**: Somma dei `price_paid` dalle `subscriptions` attive.
*   **Costi AI**: Aggregazione dei log in `ai_global_usage` moltiplicati per i costi definiti in `ai_model_prices`.

### Aggregazione Consumi (Single Source of Truth)
A differenza del saldo "statico", il calcolo del limite residuo per l'utente è **dinamico** ed eseguito in `subscriptionService.ts:getUserModelLimits`:
1.  Recupera la `pricing_version` collegata alla `subscription`.
2.  Aggrega i log di `ai_global_usage` dalla data di inizio periodo (`current_period_start`).
3.  Restituisce i crediti `flash` e `pro` effettivamente rimanenti.

### Struttura JSON `ai_limits`
Definita in `pricing_versions.ai_limits`:
```json
{
  "models": {
    "flash": 500,
    "pro": 50
  },
  "soft_daily_limit": 100,
  "burst_allowed": true
}
```

---

## 3. PIPELINE STRIPE & EXTRA CREDITS (CERTIFICATO)

### Flusso Transazionale:
1.  **Pending**: `purchase-extra-credits` (Edge Function) crea la sessione Stripe e inserisce il record in `credit_transactions` (`status: pending`).
2.  **Webhook Success**: `stripe-webhook` riceve `checkout.session.completed`.
3.  **Certificazione**: Il webhook verifica che la transazione non sia già stata processata (`if (tx.status === 'completed') return`).
4.  **Accredito**: Inserimento in `user_ai_credits` con scadenza 365 giorni e link alla transazione originale.

---

## 4. STAGING & IMPORT POI PIPELINE (CERTIFICATO)

Il processo di importazione è diviso in fasi atomiche per garantire la qualità dei dati territoriali.

1.  **Ingestione**: `importService.ts` interroga Overpass API e salva i dati grezzi in `pois_staging` (`status: new`).
2.  **AI Rating**: `stagingService.ts:updateStagingAiRatings` assegna un rating (high, medium, low) basato sui metadati OSM.
3.  **Deduplica Smart**: `deduplicateStagingData` utilizza coordinate (distanza < 20m) e similarità stringa (Levenshtein > 80%) per pulire i duplicati.
4.  **Promozione (Live)**: `promoteToLive` esegue l'arricchimento finale tramite Gemini AI e sposta il POI nella tabella `pois` con stato `draft`.

---

## 5. TROUBLESHOOTING AVANZATO (CERTIFICATO)

| Problema | Verifica Tecnica | Risoluzione |
| :--- | :--- | :--- |
| **Credito Duplicato** | Stato transazione in `credit_transactions` è già `completed`. | Nessuna azione. Il webhook di TouringDiary è idempotente (Riga 55 `stripe-webhook`). |
| **Credito Scaduto** | Campo `expires_at` in `user_ai_credits` è passato. | La RPC `consume_ai_credits` filtra automaticamente i record scaduti. Non è necessario intervento manuale. |
| **RPC Consume Fallita** | Errore `DAILY_LIMIT_EXCEEDED` o `INSUFFICIENT_FUNDS`. | Verificare `soft_daily_limit` in `pricing_versions` o il saldo in `user_ai_credits`. |
| **Webhook Signature Error** | Log Edge Function: "Missing stripe signature". | Verificare che `STRIPE_WEBHOOK_SECRET` sia correttamente impostato nei segreti Supabase. |
| **Subscription Orfana** | `subscriptions.pricing_version_id` è NULL. | Fallback manuale: Collegare l'utente a una versione valida tramite `activatePricingVersion`. |
| **Sponsor Inattivo** | Mancanza del record in `sponsors` nonostante pagamento. | Rieseguire `activate_sponsor_with_resource` tramite ID richiesta originale. |
| **Duplicati in Staging** | Presenza di più POI con stesso `osm_id`. | Avviare `deduplicateStagingData` dal pannello `ImportDashboard.tsx`. |
| **Mismatch Limiti AI** | Differenza tra saldo UI e saldo reale. | `subscriptionService` aggrega i log reali. Se c'è discrepanza, verificare eventuali log orfani in `ai_global_usage`. |

---

> [!IMPORTANT]
> L'amministratore deve monitorare periodicamente la `Ai Economics Dashboard` (Modulo `ai_economics`) per verificare che i costi di Google Vertex AI non superino l'MRR generato dalle sottoscrizioni.
