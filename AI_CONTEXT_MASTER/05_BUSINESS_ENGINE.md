# 💼 MASTER 05: BUSINESS ENGINE

## DESCRIZIONE SEMPLICE
Il Business Engine gestisce la monetizzazione e le relazioni commerciali di TouringDiary. Include il sistema di abbonamenti per gli utenti, il marketplace per le botteghe locali, la gestione degli sponsor e il tracciamento delle affiliazioni esterne (e-commerce).

---

## MODULI DEL SISTEMA

### 1. Pricing & Subscription Engine
*   **Logica**: Gestisce le versioni di listino e i limiti AI.
*   **Pipeline**: `get_active_pricing_version_v2` -> `subscriptions` -> `ai_limits`.
*   **Tabelle**: `pricing_versions`, `subscriptions`.
*   **Edge Functions**: `stripe-webhook` (Sincronizzazione pagamenti).

### 2. Marketplace System (Le Botteghe)
*   **Contenuto**: Punti vendita locali con catalogo prodotti e sistema badge.
*   **Tabelle**: `shops`, `shop_products`.
*   **Service**: `shopService.ts`.
*   **UI**: `BotteghePanel.tsx`, `ShopDetailModal.tsx`.

### 3. Sponsor Lifecycle & CRM
*   **Logica**: Conversione da segnalazione (`pois.claim`) a sponsor attivo.
*   **Pipeline**: `PoiClaimModal` -> `activate_sponsor_with_resource` RPC.
*   **Tabelle**: `sponsors`.
*   **CRM**: `communicationService.ts` gestisce i log partner e le comunicazioni admin.

### 4. Affiliate Tracking System
*   **Logica**: Arricchimento link esterni con ID partner per commissioni.
*   **Partner**: Booking, TripAdvisor, Partner locali.
*   **Utility**: `affiliateNetwork.ts`.
*   **Tracking**: `trackingService.ts` (Click log locali).

### 5. Admin Credit Overrides
*   **Logica**: Permette agli admin di ricaricare manualmente crediti AI a utenti o partner.
*   **Tabelle**: `user_ai_credits`, `credit_transactions`.
*   **Service**: `aiAdminService.ts`.

---

## PIPELINE RUNTIME (Sponsor Activation)
1.  **Segnalazione**: L'utente o il proprietario richiede la gestione di un POI.
2.  **Validazione**: L'admin verifica la richiesta nel CRM.
3.  **Transazione**: L'RPC `activate_sponsor_with_resource` crea il record sponsor, assegna crediti AI iniziali e aggiorna lo stato del POI.
4.  **Premium UI**: Il POI appare ora con badge dorato e informazioni di contatto estese.

## COMPONENTI ARCHITETTURALI
*   **Services**: `subscriptionService.ts`, `sponsorService.ts`, `shopService.ts`.
*   **RPC**: `get_active_pricing_version_v2`, `activate_sponsor_with_resource`.
*   **Edge Functions**: `stripe-webhook`.

## TABELLE DATABASE COINVOLTE
*   `pricing_versions`, `subscriptions`, `sponsors`, `shops`, `shop_products`, `credit_transactions`.
