# 🗺️ MASTER 04: TERRITORIAL ENGINE

## DESCRIZIONE SEMPLICE
Il Territorial Engine è il cuore della scoperta geografica di TouringDiary. Gestisce la gerarchia dei luoghi e arricchisce ogni destinazione con contenuti culturali, storici, religiosi e professionali. Permette di navigare tra città reali e di esplorare aree geografiche tramite il GPS.

---

## MODULI DEL SISTEMA

### 1. Culture System (Angolo Cultura)
*   **Contenuto**: Personaggi illustri nati o legati alla città.
*   **Tabella**: `city_people`.
*   **UI**: `CityCultureTab.tsx`.

### 2. History System (Storia e Origini)
*   **Contenuto**: Narrazione testuale della storia locale.
*   **Tabella**: `cities` (campo `history`).
*   **UI**: `CityHistoryTab.tsx`.

### 3. Patron Saint System (Santo Patrono)
*   **Contenuto**: Nome, data festività e dettagli iconografici del patrono.
*   **Tabella**: `cities` (campo JSON `patron_details`).
*   **UI**: `PatronSaintSection.tsx`.

### 4. Events System (Eventi Locali)
*   **Contenuto**: Calendario di eventi, feste e manifestazioni.
*   **Tabella**: `city_events`.
*   **UI**: `CityEventsTab.tsx`.

### 5. Essential Services System (Servizi Utili)
*   **Contenuto**: Punti di utilità pubblica (Farmacie, Info Point, Trasporti).
*   **Tabella**: `city_services`.
*   **UI**: `CityServicesTab.tsx`.

### 6. Guides & Tour Operators System
*   **Contenuto**: Professionisti certificati e agenzie di viaggio.
*   **Tabelle**: `city_guides`, `city_tour_operators`.
*   **UI**: `CityGuidesTab.tsx`, `CityTourOperatorsTab.tsx`.

### 7. Around-Me Explorer (GPS Explorer)
*   **Contenuto**: Esplorazione basata su raggio (km) e posizione.
*   **Logica**: `cityReadService.ts` -> `buildVirtualCity`.
*   **UI**: `AroundMeWizard.tsx`.

### 8. City Media Management
*   **Contenuto**: Gallerie fotografiche (City e POI) e video territoriali.
*   **Asset**: Tabelle `photo_submissions` (community) e campo JSON `gallery` in `cities` (ufficiali).
*   **Service**: `mediaService.ts`, `useCityGallery.ts` (merge dinamico degli asset).

---

## PIPELINE RUNTIME (Discovery)
1.  **Ingresso**: L'utente seleziona una città o usa il GPS.
2.  **Fetch**: `cityReadService` carica il `cityManifest` (POI, Eventi, Info base).
3.  **Modularità**: Al click sui tab territoriali, i sotto-servizi caricano i dati specifici (es. `city_people`).
4.  **Integrazione AI**: I dati territoriali vengono passati come contesto all'AI Chat per risposte pertinenti.

## COMPONENTI ARCHITETTURALI
*   **Service**: `cityReadService.ts`, `geo.ts` (Geolocalizzazione).
*   **Hooks**: `useCitySelection.ts`.
*   **Modals**: `CityInfoModal.tsx` (Contenitore principale dei tab territoriali).

## TABELLE DATABASE COINVOLTE
*   `cities`, `pois`, `city_people`, `city_events`, `city_services`, `photo_submissions`.
