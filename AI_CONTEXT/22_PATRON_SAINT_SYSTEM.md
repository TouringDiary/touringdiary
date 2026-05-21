# ⛪ DOC 22: PATRON SAINT SYSTEM (v1.0 — CERTIFIED)

Questo documento descrive il sistema di gestione del Santo Patrono e delle tradizioni religiose.

---

## DESCRIZIONE SEMPLICE
È il modulo che presenta il Santo Patrono della città, la data della festività e i dettagli storici o leggendari legati al culto locale.

## DESCRIZIONE TECNICA
I dettagli del patrono sono memorizzati come oggetto JSON strutturato (`patron_details`) all'interno della tabella `cities`. Questo permette flessibilità nell'aggiungere attributi (es. iconografia, miracoli, date fiera) senza modificare lo schema.

---

## PIPELINE RUNTIME
1. **Trigger**: L'utente visualizza l'intestazione o la sezione "Tradizioni" della città.
2. **Data Model**: Il service `cityReadService.ts` mappa il JSON `patron_details` nell'oggetto `details.patronDetails`.
3. **UI Logic**: Se il campo è popolato, viene mostrato un widget dedicato o una sezione nel tab Cultura.
4. **Risposta UI**: Rendering del nome del santo, immagine e data della festività.

---

## COMPONENTI ARCHITETTURALI
*   **Tabelle Database**: `cities` (campo `patron_details`).
*   **Services**: `cityReadService.ts`.
*   **Componenti UI**: `CityHeader.tsx`, `PatronWidget.tsx` (interno a CityDetails).

## ENTITÀ DATI (patron_details JSON)
*   `name`: Nome del Santo.
*   `date`: Giorno della festività (es. "19 Settembre").
*   `description`: Storia o leggenda.
*   `imageUrl`: Iconografia o immagine del busto/statua.
