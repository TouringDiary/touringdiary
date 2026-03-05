
# 🗺️ DOC 00: PROJECT MAP (ARCHITETTURA v4.0)
*Mappa Concettuale dell'Applicazione*

## 1. 🏠 CORE & NAVIGAZIONE
*   **Shell:** `AppShell` gestisce il layout responsivo (Header, Sidebar Sx, Content Dx).
*   **Mobile:** Navigazione inferiore (`MobileNavBar`) con logica a scomparsa e FAB.
*   **Router:** `AppRouter` gestisce lo switch tra Home, Città, Shop e Admin.

## 2. 🏛️ DOMINIO "CITTÀ" (City)
*   **Visualizzazione:** Header animato, Tab di navigazione (Vetrina, Liste, Media).
*   **Logica Dati:** Separazione tra `cityReadService` (Cache) e `cityWriteService` (DB).
*   **AI Integration:** Generazione automatica di Storia, Patrono, Statistiche e POI mancanti.

## 3. 📒 DOMINIO "DIARIO" (Itinerary)
*   **Struttura:** Drag & Drop su timeline verticale.
*   **Tipi Item:**
    *   **Standard:** Tappe con orario (Monumenti, Ristoranti).
    *   **Risorse:** Contatti utili (Guide, Hotel) nel footer del giorno.
    *   **Memo:** Note volanti testuali.
*   **Smart Features:** Calcolo distanze, avvisi meteo, conflitti orari.

## 4. 💼 DOMINIO "BUSINESS" (B2B)
*   **Sponsor:** Gestione livelli (Gold/Silver) e visibilità prioritaria.
*   **Bottega:** E-commerce integrato per i partner (`ShopPage`, `BusinessShopManager`).
*   **CRM:** Chat diretta tra Admin e Partner (`UserMessagesTab`).

## 5. 🛠️ DOMINIO "ADMIN" (Backoffice Esteso)
Il pannello di controllo è ora modulare:
*   **Territorio:** `CitiesManager` (CRUD), `ImportDashboard` (OSM Staging), `GlobalEvents`.
*   **Marketing:** `SponsorManager` (Contratti), `SocialStudio` (Creazione Post Virali).
*   **Community:** `SuggestionManager` (Segnalazioni), `PhotoModeration`.
*   **Sistema:** `AdminDesignSystem` (Stili), `AdminCommunications` (Notifiche/Email).

## 6. 🧠 DOMINIO "AI" (Intelligence)
*   **Client:** Wrapper unico `aiClient.ts` per Google Gemini.
*   **Task Runner:** Sistema a step (`useAiTaskRunner`) per operazioni lunghe (es. Rigenerazione Città).
*   **Generatori:** Moduli specifici per testi, immagini, analisi dati e itinerari (`aiPlanner`).

## 7. 🎨 DESIGN SYSTEM
*   **Dinamico:** Colori, Font e Testi sono caricati dal DB (`useDynamicStyles`).
*   **Responsive:** Configurazione separata Desktop/Mobile per ogni elemento UI.
