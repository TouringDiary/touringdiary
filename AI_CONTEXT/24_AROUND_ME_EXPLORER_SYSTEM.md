# 📍 DOC 24: AROUND ME EXPLORER SYSTEM (v1.0 — CERTIFIED)

Questo documento descrive il sistema di esplorazione territoriale basato sulla posizione (Around Me / GPS Explorer).

---

## DESCRIZIONE SEMPLICE
È lo strumento che permette all'utente di scoprire cosa c'è intorno a lui (tramite GPS) o intorno a una città selezionata, creando una "Città Virtuale" che aggrega i migliori punti di interesse nel raggio scelto.

## DESCRIZIONE TECNICA
Il sistema non consulta una singola città ma esegue una ricerca spaziale su raggio (Haversine distance). Utilizza la funzione `buildVirtualCity` per aggregare dinamicamente POI, Eventi e Guide da più località (`cityIds`) in un unico oggetto `CityDetails` temporaneo.

---

## PIPELINE RUNTIME
1. **Trigger**: L'utente clicca sul pulsante "Around Me" nella Sidebar o NavBar Mobile.
2. **UI Wizard**: Apertura di `AroundMeWizard.tsx` per selezionare il raggio (2-50km) e la modalità (GPS/Manuale).
3. **Location Resolution**:
    *   **GPS**: Ottiene coordinate reali dal browser.
    *   **Manuale**: Usa le coordinate della città scelta come centro.
4. **Logic Service**: `cityReadService.ts` → `buildVirtualCity(coords, radius)`.
5. **Aggregation**: Esegue query parallele `getPoisByCityIds`, `getCityEvents`, ecc., filtrando per distanza.
6. **Virtual Mapping**: Crea un oggetto `CityDetails` con ID `around-me-virtual`.
7. **Risposta UI**: L'App naviga verso la vista città virtuale, mostrando un mix di contenuti territoriali.

---

## COMPONENTI ARCHITETTURALI
*   **Services**: `cityReadService.ts`, `geo.ts`.
*   **Componenti UI**: `AroundMeWizard.tsx`, `AppRouter.tsx` (gestione rotta virtuale).
*   **Logic**: `calculateDistance` (Haversine formula).

## INTEGRAZIONE CON ALTRI SISTEMI
*   **Geo Hierarchy**: Utilizza le coordinate (`coords_lat/lng`) delle città nel manifest per il filtraggio iniziale.
*   **AI Planner**: La città virtuale può essere usata come base per generare itinerari che attraversano più comuni vicini.
