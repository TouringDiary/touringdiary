# 🔔 DOC 12: NOTIFICATION SYSTEM (v1.0 — CERTIFIED)

Questo documento descrive l'architettura del sistema di notifiche in-app di TouringDiary.

---

## DESCRIZIONE TECNICA
Il sistema gestisce notifiche persistenti salvate su database. Utilizza un pattern di cache locale (`notificationsCache`) per minimizzare le letture ridondanti e supporta diversi tipi di messaggi (System, Community, Achievement).

## DESCRIZIONE SEMPLICE
TouringDiary avvisa l'utente quando riceve un benvenuto, quando i suoi contenuti vengono approvati o quando ci sono aggiornamenti importanti sul suo viaggio.

---

## PIPELINE RUNTIME: NOTIFICATION FLOW
1. **Trigger**: Un'azione di sistema (es. registrazione, approvazione foto) chiama `addNotification`.
2. **Service**: `notificationService.ts` inserisce un record nella tabella `notifications`.
3. **Database**: La tabella memorizza `user_id`, `type`, `title`, `message`, `date` e `link_data`.
4. **Hook**: Al caricamento dell'app o login, un hook (es. `useNotifications`) chiama `fetchNotificationsAsync`.
5. **Logic**: Il sistema recupera i messaggi e aggiorna la cache locale.
6. **Risposta UI**: L'icona della campanella mostra il counter (unread count) e apre il pannello delle notifiche.
7. **Interazione**: L'utente clicca su una notifica, attivando `markAsRead` e il reindirizzamento tramite `link_data`.

---

## COMPONENTI COINVOLTI
*   **File**: `notificationService.ts`, `NotificationPanel.tsx`.
*   **Tabelle**: `notifications`.
*   **Tipi**: `AppNotification`, `NotificationType`.

## INTEGRAZIONE CON ALTRI SISTEMI
*   **Sponsor System**: Notifiche ai partner per l'approvazione delle richieste.
*   **Community Media**: Notifiche all'utente quando una sua foto viene approvata dagli admin.
*   **Admin Dashboard**: Strumenti per inviare notifiche massive (via `communicationService`).
