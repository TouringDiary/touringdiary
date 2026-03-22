
# 🗺️ DOC 00: PROJECT MAP (ARCHITETTURA v4.0)
*Mappa Concettuale dell'Applicazione*

## 1. 🏠 CORE & NAVIGAZIONE
*   **Shell:** `AppShell` gestisce il layout responsivo (Header, Sidebar Sx, Content Dx).
*   **Mobile:** Navigazione inferiore (`MobileNavBar`) con logica a scomparsa e FAB.
*   **Router:** `AppRouter` utilizza un approccio a rotta singola ("/*"). La logica di "routing" è di fatto gestita dal componente MainContent, che renderizza condizionalmente le viste principali (Home, Città, Shop) in base allo stato del NavigationContext.

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
*   **Bottega:** Vetrina prodotti per partner locali con contatto diretto (non e-commerce).
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

## 8. 🏗️ ARCHITETTURA GENERALE E STRUTTURA CARTELLE
L'applicazione segue un'architettura a livelli per garantire una chiara separazione delle responsabilità (Separation of Concerns).

`Components (UI) → Hooks (Business Logic) → Services (Data Fetching)`

*   **`src/components`**: Contiene esclusivamente componenti React (UI). Questi componenti sono "stupidi" e si occupano solo della visualizzazione e di inoltrare gli eventi utente ai gestori (hooks). Sono suddivisi per dominio (es. `admin`, `city`, `user`).
*   **`src/hooks`**: Contiene i custom hooks di React. Questi hooks incapsulano la logica di business, la gestione dello stato e l'orchestrazione delle chiamate ai servizi. Funzionano come un ponte tra l'interfaccia utente e i dati.
*   **`src/services`**: Contiene moduli che gestiscono tutte le comunicazioni con sistemi esterni, principalmente il backend Supabase. Nessun componente o hook deve accedere direttamente a Supabase; deve invece chiamare una funzione da un servizio.
*   **`src/context`**: Fornisce lo stato globale o condiviso tra più parti dell'applicazione (es. utente autenticato, stato dei modali). Permette di evitare il "prop drilling".
