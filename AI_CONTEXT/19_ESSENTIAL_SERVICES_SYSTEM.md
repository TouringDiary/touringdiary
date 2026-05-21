# 🏥 DOC 19: ESSENTIAL SERVICES SYSTEM (v1.0 — CERTIFIED)

Questo documento descrive il sistema di gestione dei servizi di pubblica utilità (Servizi Essenziali) di TouringDiary.

---

## DESCRIZIONE SEMPLICE
È il modulo che fornisce informazioni pratiche immediate su ospedali, farmacie, uffici postali, stazioni e forze dell'ordine per ogni città.

## DESCRIZIONE TECNICA
Il sistema utilizza la tabella `city_services` per memorizzare punti di interesse puramente funzionali. A differenza dei POI turistici, questi record sono ottimizzati per il contatto rapido (telefono, indirizzo).

---

## PIPELINE RUNTIME
1. **Trigger**: L'utente clicca sul tab "Servizi" o "Utilità" nella scheda città.
2. **Hook**: `useCityData`.
3. **Service**: `entitiesService.ts` esegue `getCityServices(cityId)`.
4. **Query Database**: Select su tabella `city_services` ordinata per `order_index`.
5. **Risposta UI**: Rendering raggruppato per categoria (Salute, Trasporti, Sicurezza) nel componente `CityCategoryTab.tsx`.

---

## COMPONENTI ARCHITETTURALI
*   **Tabelle Database**: `city_services`.
*   **Services**: `entitiesService.ts`.
*   **Componenti UI**: `CityCategoryTab.tsx`, `ServiceItem.tsx`.

## ENTITÀ DATI (city_services)
*   `id`: UUID.
*   `city_id`: Riferimento alla città.
*   `type`: Tipologia (es. 'hospital', 'pharmacy', 'station').
*   `name`: Nome del servizio.
*   `contact`: Numero di telefono o email.
*   `address`: Indirizzo fisico.
*   `url`: Link al sito ufficiale (se disponibile).
*   `category`: Raggruppamento UI.
