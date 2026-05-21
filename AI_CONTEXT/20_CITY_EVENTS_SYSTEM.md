# 📅 DOC 20: CITY EVENTS SYSTEM (v1.0 — CERTIFIED)

Questo documento descrive il sistema di gestione degli eventi locali e delle manifestazioni periodiche.

---

## DESCRIZIONE SEMPLICE
È il calendario degli eventi della città: sagre, festival, mostre e ricorrenze religiose, completo di date, descrizioni e luoghi.

## DESCRIZIONE TECNICA
Il sistema utilizza la tabella `city_events` relazionata a `cities`. Gli eventi sono classificati per categoria e data, supportando metadati JSON per configurazioni specifiche (es. link biglietteria).

---

## PIPELINE RUNTIME
1. **Trigger**: L'utente accede alla sezione "Eventi" della città.
2. **Service**: `entitiesService.ts` esegue `getCityEvents(cityId)`.
3. **Query Database**: Select su tabella `city_events` ordinata cronologicamente o per `order_index`.
4. **Risposta UI**: Visualizzazione elenco eventi nel componente `CityCategoryTab.tsx`.

---

## COMPONENTI ARCHITETTURALI
*   **Tabelle Database**: `city_events`.
*   **Services**: `entitiesService.ts`.
*   **Componenti UI**: `CityCategoryTab.tsx`, `EventCard.tsx`.

## ENTITÀ DATI (city_events)
*   `id`: UUID.
*   `city_id`: Riferimento alla città.
*   `name`: Titolo dell'evento.
*   `date`: Data di svolgimento (ISO string).
*   `category`: Tipo di evento (es. 'food', 'music', 'religious').
*   `description`: Dettagli dell'evento.
*   `location`: Nome del luogo.
*   `coords_lat / coords_lng`: Coordinate per visualizzazione mappa.
*   `image_url`: Immagine di copertina dell'evento.
