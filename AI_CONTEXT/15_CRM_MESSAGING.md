# 💬 DOC 15: CRM & MESSAGING SYSTEM (v1.0 — CERTIFIED)

Questo documento descrive il sistema di comunicazione amministrativa e gestione messaggi (CRM).

---

## DESCRIZIONE TECNICA
Il sistema gestisce la comunicazione bidirezionale (in prospettiva) e unidirezionale verso utenti e partner. Include un motore di template per messaggi di sistema con configurazioni UI dinamiche (posizionamento mascotte, bolle di testo, target device).

## DESCRIZIONE SEMPLICE
TouringDiary usa questo sistema per parlare con gli utenti (tramite la mascotte e i fumetti) e per tenere traccia di tutte le email e gli avvisi inviati ai partner.

---

## PIPELINE RUNTIME: SYSTEM MESSAGING
1. **Trigger**: L'app si avvia o l'utente entra in una sezione specifica (es. Onboarding).
2. **Hook**: Un hook di messaggistica chiama `getSystemMessagesAsync`.
3. **Service**: `communicationService.ts` recupera i template da `system_messages` (con fallback API locale).
4. **Logic**: Il servizio seleziona il messaggio corretto in base alla `key` e al `deviceTarget` (desktop/mobile).
5. **UI Rendering**: La mascotte e il fumetto vengono posizionati secondo la `UiConfig` (coordinate X/Y, direzione freccia).
6. **Logging**: Ogni comunicazione inviata viene registrata in `communication_logs` tramite `logCommunicationAsync`.
7. **Risposta UI**: L'utente visualizza il messaggio contestuale con animazione della mascotte.

---

## COMPONENTI COINVOLTI
*   **File**: `communicationService.ts`, `MascotBubble.tsx`.
*   **Tabelle**: `system_messages`, `communication_logs`, `sponsors` (campo `partner_logs`).
*   **Modelli**: `SystemMessageTemplate`, `UiConfig`, `AdminMessageLog`.

## INTEGRAZIONE CON ALTRI SISTEMI
*   **Sponsor System**: Gestione dei log di comunicazione con i partner durante l'approvazione.
*   **Admin Dashboard**: Console per la creazione e modifica dei template dei messaggi di sistema.
*   **Notification System**: Alcuni log di comunicazione possono generare notifiche in-app.
