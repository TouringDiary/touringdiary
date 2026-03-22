
# 🧠 CRITICAL FILES MAP — TouringDiary

Questo documento identifica i file più critici dell'architettura TouringDiary.
Modifiche a questi file possono avere impatti su più parti del sistema.

Prima di modificare uno di questi file è consigliato analizzare:

• dipendenze
• contesto architetturale
• flussi applicativi collegati

---

## src/components/layout/AppCoordinator.tsx

**Ruolo nel sistema**
Orchestratore principale dell'applicazione. Gestisce l'inizializzazione, il caricamento dei dati essenziali e la coordinazione dei componenti di layout principali.

**Dipendenze principali**
`useAppInitialization`, `AppShell`, `ModalManager`, `GlobalAlert`.

**Livello criticità**
ALTA

**Impatto modifiche**
Può compromettere l'avvio dell'intera applicazione, il caricamento dati e la visualizzazione del layout base.

**Note tecniche**
È il punto di ingresso logico dell'UI. Modifiche qui hanno effetto globale.

---

## src/components/layout/AppRouter.tsx

**Ruolo nel sistema**
Gestisce il routing delle pagine principali dell'applicazione (Home, City, Shop, Admin, etc.).

**Dipendenze principali**
`react-router-dom`, `MainLayout`.

**Livello criticità**
ALTA

**Impatto modifiche**
Può bloccare la navigazione tra le sezioni principali, impedendo l'accesso a intere funzionalità.

**Note tecniche**
Contiene la logica di base per decidere quale vista principale mostrare all'utente.

---

## src/components/layout/ModalManager.tsx

**Ruolo nel sistema**
Gestore centralizzato per la visualizzazione di tutti i modali dell'applicazione.

**Dipendenze principali**
`ModalContext`, tutti i componenti modali (es. `PoiDetailModal`, `AuthModal`).

**Livello criticità**
ALTA

**Impatto modifiche**
Un errore qui può impedire l'apertura o la chiusura di qualsiasi modale nell'app, bloccando molti flussi utente.

**Note tecniche**
Utilizza un approccio a "render map" per caricare dinamicamente i modali richiesti.

---

## src/context/AppProviders.tsx

**Ruolo nel sistema**
Componente che raggruppa tutti i provider di context globali (Stato Utente, UI, Modali, Itinerario).

**Dipendenze principali**
`UserContext`, `UIContext`, `ModalContext`, `ItineraryContext`.

**Livello criticità**
ALTA

**Impatto modifiche**
Può causare la perdita di stato globale in tutta l'applicazione, con crash a cascata.

**Note tecniche**
È il wrapper più esterno dell'app, fondamentale per il funzionamento dello stato condiviso.

---

## src/context/UserContext.tsx

**Ruolo nel sistema**
Gestisce lo stato di autenticazione, i dati dell'utente e i permessi (ruoli).

**Dipendenze principali**
`supabaseClient`, `userService`.

**Livello criticità**
ALTA

**Impatto modifiche**
Può rompere la logica di login, la gestione dei permessi e la personalizzazione dell'esperienza utente.

**Note tecniche**
Interagisce direttamente con Supabase per l'autenticazione.

---

## src/context/ConfigContext.tsx

**Ruolo nel sistema**
Provider per la gestione delle configurazioni globali del sistema (feature flags, design system, configurazioni di marketing, etc.).

**Dipendenze principali**
`settingsService`.

**Livello criticità**
ALTA

**Impatto modifiche**
Un errore qui può impedire il corretto funzionamento di moduli dipendenti dalle configurazioni remote, causando crash o loading infiniti.

**NOTE — ConfigProvider Mapping**
Il valore restituito da `getCachedSetting(key)` è già il JSON della configurazione salvata nella colonna `value` della tabella `global_settings`.

Il provider deve quindi assegnare direttamente il valore:

`configs[key] = setting`

Non deve accedere a `setting.value`.

---

## src/context/ItineraryContext.tsx

**Ruolo nel sistema**
Gestisce lo stato completo dell'itinerario di viaggio attivo, incluse tappe, date e metadati.

**Dipendenze principali**
`TravelDiary`, `DiaryHeader`, `itineraryStorageManager`.

**Livello criticità**
ALTA

**Impatto modifiche**
Può compromettere la creazione, modifica, salvataggio e caricamento degli itinerari, cuore del prodotto.

**Note tecniche**
Contiene la logica di "hydrating" (caricamento) dello stato da diverse fonti (cloud, locale).

---

## src/components/features/diary/TravelDiary.tsx

**Ruolo nel sistema**
Componente principale del Diario di Viaggio. Gestisce la visualizzazione della timeline, le interazioni drag-and-drop e la struttura dei giorni.

**Dipendenze principali**
`ItineraryContext`, `DiaryInteractionContext`, `react-beautiful-dnd`.

**Livello criticità**
ALTA

**Impatto modifiche**
Può rompere l'intera UI del diario, la riorganizzazione delle tappe e la visualizzazione dell'itinerario.

**Note tecniche**
La logica di drag-and-drop è complessa e sensibile a modifiche.

---

## src/services/supabaseClient.ts

**Ruolo nel sistema**
Crea e esporta il client singleton di Supabase per l'interazione con il database e l'autenticazione.

**Dipendenze principali**
`@supabase/supabase-js`. Utilizzato da quasi tutti i servizi.

**Livello criticità**
ALTA

**Impatto modifiche**
Un errore di configurazione qui disconnette l'intera applicazione dal suo backend.

**Note tecniche**
Contiene le chiavi di accesso API a Supabase. Non modificare senza motivo.

---

## src/types/supabase.ts

**Ruolo nel sistema**
Definisce i tipi TypeScript per l'intero schema del database Supabase, generati automaticamente.

**Dipendenze principali**
Utilizzato in tutto il codice che interagisce con il database per garantire la type-safety.

**Livello criticità**
ALTA

**Impatto modifiche**
Modifiche manuali errate possono causare discrepanze tra il frontend e lo schema del DB, portando a errori di runtime.

**Note tecniche**
Questo file dovrebbe essere aggiornato solo tramite i comandi CLI di Supabase dopo una migrazione del DB.

---

## src/services/ai/aiPlanner.ts

**Ruolo nel sistema**
Servizio core che orchestra la generazione di itinerari tramite intelligenza artificiale.

**Dipendenze principali**
`aiClient`, `listGenerator`, `poiGenerator`, `cityService`.

**Livello criticità**
ALTA

**Impatto modifiche**
Può bloccare la funzionalità "Magic Planner", una delle feature principali basate su AI.

**Note tecniche**
Contiene la logica complessa di suddivisione dei task e di dialogo con i modelli AI.

---

## src/services/ai/aiClient.ts

**Ruolo nel sistema**
Client astratto per comunicare con i modelli di linguaggio (Gemini). Gestisce chiamate, formattazione e gestione errori.

**Dipendenze principali**
Invocato da tutti i servizi AI (es. `aiPlanner`, `aiText`).

**Livello criticità**
MEDIA

**Impatto modifiche**
Può interrompere tutte le funzionalità AI se la logica di chiamata o di gestione della risposta viene alterata.

**Note tecniche**
È il punto unico di contatto con le API esterne di Google AI.

---

## src/services/city/cityReadService.ts

**Ruolo nel sistema**
Gestisce la lettura dei dati delle città, con un focus sulla gestione della cache per ottimizzare le performance.

**Dipendenze principali**
`supabaseClient`, `cityCache`.

**Livello criticità**
ALTA

**Impatto modifiche**
Può causare caricamenti lenti, dati non aggiornati o errori nel recupero delle informazioni delle città.

**Note tecniche**
La logica di caching (stale-while-revalidate) è fondamentale per l'esperienza utente.

---

## src/services/city/cityWriteService.ts

**Ruolo nel sistema**
Gestisce tutte le operazioni di scrittura (creazione, aggiornamento, eliminazione) relative ai dati delle città.

**Dipendenze principali**
`supabaseClient`, `AdminCityEditor`.

**Livello criticità**
MEDIA

**Impatto modifiche**
Può impedire agli amministratori di aggiornare i contenuti delle città, causando dati obsoleti o errati.

**Note tecniche**
Contiene logiche critiche per la validazione e la pulizia dei dati prima dell'inserimento nel DB.

---

## src/components/admin/AdminCityEditor.tsx

**Ruolo nel sistema**
Interfaccia di amministrazione principale per la modifica completa di un'entità "città".

**Dipendenze principali**
`useAdminCityEditorLogic`, `cityWriteService`, numerosi sotto-componenti per le varie sezioni (media, POI, cultura).

**Livello criticità**
MEDIA

**Impatto modifiche**
Può bloccare il flusso di lavoro degli amministratori, impedendo la gestione dei contenuti del portale.

**Note tecniche**
È un componente "smart" con molta logica di stato e interazione con i servizi.

---

## src/components/modals/PoiDetailModal.tsx

**Ruolo nel sistema**
Modale universale per la visualizzazione dei dettagli di un Punto di Interesse (POI).

**Dipendenze principali**
`InteractionContext`, `poiService`, `ReviewModal`.

**Livello criticità**
ALTA

**Impatto modifiche**
Può impedire agli utenti di visualizzare informazioni cruciali sui POI, una delle interazioni più comuni.

**Note tecniche**
Gestisce diverse varianti di visualizzazione (es. standard, business, con sponsor).

---

## src/hooks/core/useAppInitialization.ts

**Ruolo nel sistema**
Hook che gestisce la logica di inizializzazione dell'applicazione al primo caricamento.

**Dipendenze principali**
`UserContext`, `NavigationContext`.

**Livello criticità**
ALTA

**Impatto modifiche**
Può impedire il corretto avvio dell'app, bloccando il caricamento di dati utente o di navigazione essenziali.

**Note tecniche**
Viene eseguito una sola volta e il suo output determina lo stato iniziale di molte parti dell'UI.

---

## src/services/sponsorService.ts

**Ruolo nel sistema**
Servizio centrale per tutte le operazioni legate al mondo sponsor. Gestisce sia le richieste (`sponsor_requests`) sia gli sponsor attivi (`sponsors`).

**Dipendenze principali**
`supabaseClient`, `useUserDashboardData`.

**Livello criticità**
ALTA

**Impatto modifiche**
Un errore qui può bloccare il flusso di richiesta sponsor, l'attivazione di sottoscrizioni e la visualizzazione degli sponsor nell'app.

**Note tecniche**
Contiene la logica di mappatura tra `sponsor` e `PointOfInterest`, cruciale per la visualizzazione.

---

## src/hooks/useUserDashboardData.ts

**Ruolo nel sistema**
Hook responsabile di caricare tutti i dati necessari per la dashboard utente e business.

**Dipendenze principali**
`sponsorService`, `rewardService`, `notificationService`.

**Livello criticità**
MEDIA

**Impatto modifiche**
Può impedire il caricamento di una o più sezioni della dashboard, degradando l'esperienza utente.

**Note tecniche**
Orchestra chiamate a molteplici servizi per aggregare i dati in un unico punto.

---

## src/components/user/UserDashboard.tsx

**Ruolo nel sistema**
Componente UI che presenta la dashboard all'utente, mostrando tab e dati in base al ruolo (user/business).

**Dipendenze principali**
`useUserDashboardData`, vari sotto-componenti di tab (es. `UserWalletTab`, `BusinessShopManager`).

**Livello criticità**
MEDIA

**Impatto modifiche**
Può causare crash o malfunzionamenti nella visualizzazione del profilo utente e del pannello di gestione business.

**Note tecniche**
È un componente complesso che gestisce molta logica di visualizzazione condizionale.

---
## src/components/admin/design/DesignRuleEditor.tsx

**Ruolo nel sistema**
Componente universale per l'editing e la preview delle regole del Design System.

**Dipendenze principali**
src/types/designSystem.ts

**Livello criticità**
HIGH

**Impatto modifiche**
Un bug qui può impedire la modifica delle regole di stile globali e compromettere la configurabilità dell'interfaccia amministrativa.

**Note tecniche**
Supporta preview dinamiche tramite le proprietà opzionali della StyleRule:
preview_type, preview_size, preview_content.

---
