# 📜 DOC 21: CITY HISTORY SYSTEM (v1.0 — CERTIFIED)

Questo documento descrive il sistema di gestione della narrazione storica (Storia e Origini) di TouringDiary.

---

## DESCRIZIONE SEMPLICE
È il modulo che racconta le origini della città, le sue epoche d'oro e gli eventi storici fondamentali che ne hanno plasmato l'identità attuale.

## DESCRIZIONE TECNICA
Il sistema non utilizza una tabella esterna ma integra il contenuto direttamente nella tabella `cities` tramite campi di testo esteso (`history_snippet` e `history_full`), ottimizzando il caricamento della scheda città principale.

---

## PIPELINE RUNTIME
1. **Trigger**: L'utente clicca su "Leggi Storia" o accede alla sezione dedicata nella scheda città.
2. **Service**: `cityReadService.ts` recupera l'intero oggetto city tramite `getCityDetails`.
3. **Data Retrieval**: Lettura dei campi `history_snippet` (per anteprima) e `history_full` (per lettura completa).
4. **Risposta UI**: Rendering nel componente dedicato `CityHistory.tsx` con formattazione tipografica avanzata.

---

## COMPONENTI ARCHITETTURALI
*   **Tabelle Database**: `cities` (campi `history_snippet`, `history_full`).
*   **Services**: `cityReadService.ts`.
*   **Componenti UI**: `CityHistory.tsx`.

## ENTITÀ DATI (cities - focus storia)
*   `history_snippet`: Testo breve per la sezione di introduzione.
*   `history_full`: Testo completo (Markdown supportato) per l'approfondimento storico.
