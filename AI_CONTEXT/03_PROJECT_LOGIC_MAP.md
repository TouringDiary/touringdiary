
# 🧠 DOC 02: PROJECT LOGIC_MAP (v43.0 - UI UNIFICATION)

## 1. ARCHITETTURA STATE MANAGEMENT
...

## 10. UI COMPONENT STRATEGY (Unified System)
Per ridurre la duplicazione e migliorare la manutenibilità:

1.  **UniversalCard:** Un unico componente gestisce tutte le visualizzazioni dei POI (Griglie, Sidebar, Liste).
    *   **Variant 'horizontal':** Layout 1/3 immagine a sinistra, usato per liste Top 5.
    *   **Variant 'vertical':** Layout immagine in alto, usato per griglie e colonne sponsor.
    *   **Prop 'fluid':** Adatta la larghezza al contenitore padre (utile per le sidebar responsive).

2.  **UniversalPoiModal:** Un unico punto di ingresso per i dettagli dei luoghi.
    *   **Logic Branching:** Analizza `poi.resourceType` al mount.
    *   **Standard View:** Layout "Hero + Tabs" per monumenti, ristoranti, hotel.
    *   **Business View:** Layout "Card Profile" per guide, tour operator e servizi.

## 11. LOGICA DI NAVIGAZIONE (STATE-DRIVEN ROUTING)
L'applicazione non usa un routing basato su URL multipli. Un componente `MainContent` agisce come un controllore che mostra diverse viste in base a queste condizioni, in ordine di priorità:
1.  `activeShopId` (da `NavigationContext`) non è nullo -> Mostra `ShopPage`.
2.  `virtualCity` (da `NavigationContext`) non è nullo -> Mostra `CityDetailContent` (per "Around Me").
3.  `activeCityId` (da `NavigationContext`) non è nullo -> Mostra `CityDetailContent`.
4.  Default -> Mostra `HomeContent`.
Questa architettura centralizza la logica di navigazione ma crea un forte accoppiamento tra lo stato globale e la vista.

## 12. MAPPA RELAZIONALE DATABASE (SUPABASE)

Questa sezione descrive le relazioni principali tra le tabelle più importanti del database Supabase.

*   **Città e POI**:
    *   `cities.id` (PK) <--> `points_of_interest.city_id` (FK)

*   **Utenti e Ruoli**:
    *   `users.id` (PK, da `auth.users`) <--> `user_roles.user_id` (FK)
    *   `roles.id` (PK) <--> `user_roles.role_id` (FK)

*   **Contenuti Utente (UGC)**:
    *   `users.id` <--> `reviews.user_id`
    *   `users.id` <--> `photos.user_id`
    *   `points_of_interest.id` <--> `reviews.poi_id`
    *   `points_of_interest.id` <--> `photos.poi_id`

*   **Business & Sponsor**:
    *   `sponsors.id` (PK) <--> `contracts.sponsor_id` (FK)
    *   `sponsors.id` (PK) <--> `sponsor_subscriptions.sponsor_id` (FK)

*   **Botteghe (Shops) e Prodotti**:
    *   `cities.id` (PK) <--> `shops.city_id` (FK)
    *   `users.id` (PK, `auth.users`) <--> `shops.owner_id` (FK)
    *   `shops.id` (PK) <--> `shop_products.shop_id` (FK)

*   **Servizi Turistici e Cittadini**:
    *   `cities.id` (PK) <--> `tour_guides.city_id` (FK)
    *   `users.id` (PK, `auth.users`) <--> `tour_guides.user_id` (FK, opzionale)
    *   `cities.id` (PK) <--> `tour_operators.city_id` (FK)
    *   `cities.id` (PK) <--> `city_services.city_id` (FK)

*   **Eventi**:
    *   `cities.id` (PK) <--> `events.city_id` (FK)
    *   `points_of_interest.id` (PK) <--> `events.poi_id` (FK, nullable)

*   **Itinerari (Diario di Viaggio)**:
    *   `users.id` (PK, `auth.users`) <--> `itineraries.user_id` (FK)
    *   `itineraries.id` (PK) <--> `itinerary_items.itinerary_id` (FK)
    *   `points_of_interest.id` (PK) <--> `itinerary_items.poi_id` (FK, per tappe POI)
    *   `tour_guides.id` (PK) <--> `itinerary_items.resource_id` (FK, per risorse)

---

## 13. ARCHITETTURA DEL SISTEMA SPONSOR

Il sistema sponsor è progettato per separare il flusso di richiesta/approvazione dalla gestione degli sponsor attivi. Si basa su due tabelle distinte.

### Tabella 1: `sponsor_requests`

*   **Scopo**: Gestire il **workflow amministrativo** delle richieste di sponsorizzazione. Ogni nuova richiesta da un potenziale partner crea un record qui.
*   **Utilizzo**: Alimentazione del pannello di amministrazione (`SponsorManager`) per approvare o rifiutare le richieste.
*   **Status Principali**: `pending`, `approved`, `rejected`.

### Tabella 2: `sponsors`

*   **Scopo**: Contenere gli **sponsor attivi e approvati** che sono visibili nell'applicazione pubblica.
*   **Utilizzo**: Dati live per visualizzare gli sponsor nelle pagine delle città e sulla mappa.
*   **Status Principali**: `waiting_payment`, `approved`.

### Flusso di Conversione da Richiesta a Sponsor Attivo

Il passaggio da una tabella all'altra è un processo deliberato e controllato dall'amministratore.

1.  Un utente business invia una richiesta di sponsorizzazione → Viene creato un record in `sponsor_requests`.
2.  Un amministratore esamina la richiesta nel pannello di admin.
3.  Se approvata, l'amministratore avvia una funzione (es. `createSponsorFromRequest`).
4.  Questa funzione legge i dati dalla richiesta, crea un nuovo record nella tabella `sponsors` e imposta lo stato della richiesta originale su `approved`.

### Flusso di Visualizzazione: Sponsor come PointOfInterest (POI)

Per massimizzare il riutilizzo dei componenti UI, gli sponsor attivi vengono trattati come una variante dei Punti di Interesse (POI).

*   **Flusso**: `fetchSponsorsByCityAsync` → `convertSponsorToPoi` → `PointOfInterest[]`
*   **Logica**: La funzione `convertSponsorToPoi` agisce da **adattatore**, mappando i campi di un oggetto `Sponsor` a quelli di un `PointOfInterest`, e aggiungendo il flag `isSponsored: true`.
*   **Risultato**: Gli sponsor possono essere renderizzati dagli stessi componenti che gestiscono i POI standard (es. `UniversalCard`), semplificando l'interfaccia.


---
*Logica aggiornata al 19/12/2025*
