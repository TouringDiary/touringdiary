# 🏛️ DOC 17: CITY CULTURE SYSTEM (v1.0 — CERTIFIED)

Questo documento descrive il sistema di gestione dei contenuti culturali (Personaggi Illustri / Angolo Cultura) di TouringDiary.

---

## DESCRIZIONE SEMPLICE
È il modulo che racconta la storia delle città attraverso i suoi personaggi più famosi (artisti, scienziati, leader), mostrando le loro biografie, opere e i luoghi a loro legati.

## DESCRIZIONE TECNICA
Il sistema utilizza un'entità dedicata `city_people` relazionata alla tabella `cities`. Gestisce biografie strutturate (snippet e full bio), citazioni, opere famose e collegamenti geografici interni.

---

## PIPELINE RUNTIME
1. **Trigger**: L'utente seleziona la categoria "Cultura" o "Personaggi" nella scheda città.
2. **Hook**: `useCityData` invoca il caricamento dei dettagli.
3. **Service**: `entitiesService.ts` esegue `getCityPeople(cityId)`.
4. **Query Database**: Select su tabella `city_people` filtrata per `city_id`.
5. **Risposta UI**: Rendering nel componente `CityCategoryTab.tsx` con card dedicate ai personaggi illustri.

---

## COMPONENTI ARCHITETTURALI
*   **Tabelle Database**: `city_people`.
*   **Services**: `entitiesService.ts`.
*   **Hooks**: `useCityData`.
*   **Componenti UI**: `CityCategoryTab.tsx`, `FamousPersonCard.tsx`.

## ENTITÀ DATI (city_people)
*   `id`: UUID.
*   `city_id`: Riferimento alla città.
*   `name`: Nome del personaggio.
*   `role`: Ruolo (es. Pittore, Scrittore).
*   `bio`: Breve biografia.
*   `full_bio`: Biografia estesa.
*   `image_url`: Asset ritratto.
*   `famous_works`: Array di opere principali.
*   `related_places`: JSON di luoghi legati al personaggio.
