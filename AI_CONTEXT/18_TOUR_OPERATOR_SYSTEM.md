# 🎫 DOC 18: TOUR OPERATOR SYSTEM (v1.0 — CERTIFIED)

Questo documento descrive l'integrazione dei Tour Operator nel sistema TouringDiary.

---

## DESCRIZIONE SEMPLICE
È il modulo dedicato alle agenzie e ai professionisti che offrono tour organizzati ed esperienze nelle città, permettendo agli utenti di scoprire e prenotare attività professionali.

## DESCRIZIONE TECNICA
I Tour Operator sono gestiti come una risorsa sponsorizzata specifica. Il sistema utilizza la tabella `city_tour_operators` per i metadati e la tabella `sponsors` per la gestione del ciclo di vita commerciale e il posizionamento privilegiato.

---

## PIPELINE RUNTIME
1. **Trigger**: L'utente naviga nella sezione "Esperienze" o "Tour" della città.
2. **Service**: `sponsorResolvers.ts` risolve i dati tramite `operator_id`.
3. **Query Database**: Join tra `sponsors` e `city_tour_operators`.
4. **Logic**: Il resolver mappa i dati dell'operatore (nome, descrizione, contatti) nel formato `ResolvedSponsor`.
5. **Risposta UI**: Rendering di card sponsorizzate con link diretti alla prenotazione o contatto.

---

## COMPONENTI ARCHITETTURALI
*   **Tabelle Database**: `city_tour_operators`, `sponsors`.
*   **Services**: `sponsorResolvers.ts`, `sponsorService.ts`.
*   **Componenti UI**: `SponsorCard.tsx`, `TourOperatorDetail.tsx`.

## ENTITÀ DATI (city_tour_operators)
*   `id`: UUID.
*   `name`: Ragione sociale o nome commerciale.
*   `description`: Descrizione dei servizi/tour offerti.
*   `image_url`: Logo o immagine rappresentativa.
*   `address`: Sede fisica (opzionale).
*   `phone / email / website`: Canali di contatto.
*   `coords_lat / coords_lng`: Posizione per visualizzazione mappa.
