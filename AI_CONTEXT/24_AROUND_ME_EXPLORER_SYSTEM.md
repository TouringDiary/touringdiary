# 📍 DOC 24: AROUND ME EXPLORER SYSTEM (v1.1 — CERTIFIED)

Questo documento descrive il sistema di esplorazione territoriale basato sulla posizione (Around Me / GPS Explorer).

---

## DESCRIZIONE SEMPLICE
È lo strumento che permette all'utente di scoprire cosa c'è intorno a lui (tramite GPS) o intorno a una città selezionata, creando una "Città Virtuale" che aggrega i contenuti territoriali nel raggio scelto.

## DESCRIZIONE TECNICA
Il sistema non consulta una singola città ma esegue una ricerca spaziale su raggio (Haversine distance). Utilizza la funzione `buildVirtualCity` per aggregare dinamicamente i contenuti da più località (`cityIds`) in un unico oggetto `CityDetails` temporaneo (`virtualMode: 'around_me'`, `aggregatedCities`).

---

## PIPELINE RUNTIME
1. **Trigger**: L'utente clicca sul pulsante "Around Me" nella Sidebar o NavBar Mobile.
2. **UI Wizard**: Apertura di `AroundMeWizard.tsx` per selezionare il raggio (2-50km) e la modalità (GPS/Manuale).
3. **Location Resolution** (SoT = `GpsContext` / `useGpsManager.requestPosition`):
    *   **GPS**: `AroundMeWizard` acquisisce la posizione tramite `requestPosition` (stessa pipeline dell’Header). Conferma ed esplorazione richiedono `userLocation` reale. Se la posizione manca o fallisce, Around Me **non** viene costruito — nessun fallback a `GEO_CONFIG.DEFAULT_CENTER`.
    *   **Manuale**: Usa le coordinate della città scelta come centro.
4. **History sentinel**: se non si è già su `/`, si naviga a home con `replace` così il Back da una città drill-in ripristina Around Me senza impilare `/` sullo stack.
5. **Logic Service**: `cityReadService.ts` → `buildVirtualCity(coords, radius)`.
6. **Aggregation (batch O(1) in N)**:
    *   `getPoisByCityIds`, `getCityEventsByCityIds`, `getCityGuidesByCityIds`
    *   `getCityServicesByCityIds`, `getCityTourOperatorsByCityIds`, `getCityPeopleByCityIds(..., 'public')`
    *   Sponsor (UI): `fetchSponsorsByCityIdsAsync`
    *   Negozi Digitali (ShopPage): `getShopsByCityIds`
7. **Virtual Mapping**: `CityDetails` con ID `around-me-virtual`, `virtualMode: 'around_me'`, `aggregatedCities`.
8. **UI**: `CityHeader` mostra titolo + bandiera + lista città (no Preferiti / Storia / Patrono). Click città → città reale.
9. **Back**:
    *   Dalla città drill-in: history back al sentinella `/` → ripristino sessione (`aroundMeSessionRef`) senza rebuild.
    *   Dalla vista Around Me attiva: Back **semantico** → Home (`goHome`), non `navigate(-1)` (Around Me non ha route dedicata; `-1` poteva ripescare `/admin`).
    *   Realm Admin: enter/leave/nav sezioni con `replace`, così `/admin*` non contamina lo stack consumer.

---

## COMPONENTI ARCHITETTURALI
*   **Services**: `cityReadService.ts` (`buildVirtualCity`), `entitiesService.ts`, `tourOperatorService.ts`, `sponsorContractsService.ts`, `shopService.ts`, `geo.ts`.
*   **Componenti UI**: `AroundMeWizard.tsx`, `AppRouter.tsx`, `CityHeader.tsx`, `CityDetailContent.tsx`, `ShopPage` / `useShopNavigation`.
*   **Nav**: `NavigationContext` (suspend/restore Around Me).
*   **GPS SoT**: `GpsContext` / `useGpsManager` (Header toggle e wizard Around Me condividono `userLocation` + `requestPosition`).

## INTEGRAZIONE CON ALTRI SISTEMI
*   **Geo Hierarchy**: coordinate (`coords_lat/lng`) delle città nel manifest per il filtraggio iniziale.
*   **AI Planner**: la città virtuale può essere usata come base per itinerari multi-comune.
