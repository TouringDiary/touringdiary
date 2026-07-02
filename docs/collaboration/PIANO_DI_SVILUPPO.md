# Piano di Sviluppo — Sistema di Collaborazione e Workspace

**Progetto:** TouringDiary  
**Versione documento:** 1.0  
**Stato:** Ufficiale — congelato  
**Data:** 2 luglio 2026

---

## Scopo di questo documento

Questo Piano di Sviluppo è il **riferimento ufficiale** per l'implementazione del Sistema di Collaborazione e Workspace di TouringDiary.

È subordinato e coerente con la **Specifica Funzionale** (versione definitiva), che resta l'unica fonte per regole funzionali, comportamenti utente e principi architetturali.

### Come usare questo piano

Per avviare un'implementazione, è sufficiente indicare:

> **Procedi con la Fase X**

L'agente o lo sviluppatore deve:

1. Rileggere integralmente la Specifica Funzionale.
2. Rileggere la **Fase X** di questo documento (obiettivo, funzionalità, dipendenze, criteri di completamento).
3. Verificare che le fasi precedenti siano completate.
4. Implementare **solo** quanto previsto nella fase indicata, senza introdurre modelli alternativi di collaborazione.

### Moduli in scope per la v1

La Specifica Funzionale prevede moduli futuri (Documenti, Biglietti, Prenotazioni, Spese, ecc.).  
**In questa v1 del piano** i moduli collaborativi implementati sono:

- Diario di Viaggio (comprensivo del Tab Note)
- Valigie
- Template Utente

Il Workspace e il motore collaborativo devono essere progettati come **estensibili**, ma l'implementazione dei moduli futuri **non fa parte** di questo piano fino a nuova pianificazione.

### Riferimenti incrociati alla Specifica Funzionale

| Area | Sezioni |
|------|---------|
| Principi e modello | §1–§3 |
| Modalità e wizard | §4–§5 |
| Inviti e guest | §6–§6.1 |
| Ruoli e permessi | §7–§8 |
| Profilo utente | §9–§10 |
| Dashboard e Condividi | §11 |
| Workspace | §12 |
| Diario e Note | §13–§14 |
| Valigie e Template | §15–§16 |
| Presenza e lock | §17–§18 |
| Notifiche, attività, autore | §19–§21 |

---

## Segnalazioni pre-congelamento

Prima di congelare questo piano sono state rilevate le seguenti criticità nella Specifica Funzionale. **Non sono state corrette autonomamente.** Il piano le tiene conto nelle fasi interessate.

### S1 — Inviti: condivisione semplice vs Workspace (§6)

**Problema:** Il §6 descrive la creazione dell'invito facendo riferimento al ruolo nel Workspace e alle Risorse Condivisibili accessibili. Questo è chiaro per gli inviti al Workspace, ma **non distingue esplicitamente** il flusso di invito per la **condivisione semplice** (§5), dove esiste una sola risorsa e i ruoli sono quelli del §7 (Proprietario / Collaboratore / Visualizzatore sulla risorsa).

**Rischio:** Due implementazioni diverse dello stesso flusso inviti (con o senza matrice workspace).

**Soluzione proposta (da confermare nella Specifica):** Chiarire nel §6 che esistono due tipi di invito — **invito a risorsa** (condivisione semplice: ruolo sulla risorsa) e **invito a workspace** (ruolo per risorsa nel workspace: Nessun accesso / Visualizzatore / Collaboratore) — con flussi UI distinti ma motore unico.

**Impatto sul piano:** Fase 3 (inviti risorsa) e Fase 7 (inviti workspace). Procedibile se si adotta la distinzione sopra come regola interpretativa ufficiale fino ad aggiornamento del §6.

---

### S2 — Precedenza ACL risorsa + ACL workspace (§12.5)

**Problema:** Il §12.5 stabilisce che le due autorizzazioni sono **indipendenti** e che quelle del Workspace non modificano le condivisioni preesistenti. **Non definisce** il comportamento quando lo stesso utente ha accesso alla stessa risorsa tramite **entrambi** i canali con livelli diversi (es. Collaboratore via condivisione semplice, Visualizzatore via workspace).

**Rischio:** Implementazioni con unione dei permessi (livello più alto vince) vs canali separati (accesso dipende dal contesto di navigazione).

**Soluzione proposta (da confermare nella Specifica):** Adottare la regola: *il livello di permesso effettivo per un utente su una risorsa è sempre il più elevato tra ACL risorsa e ACL workspace* (Collaboratore > Visualizzatore > Nessun accesso), valutato al momento dell'accesso.

**Impatto sul piano:** Fase 2 (motore permessi) e Fase 7 (workspace ACL). La Fase 2 deve prevedere un punto di risoluzione permessi unificato.

---

### S3 — Terminologia «nickname» vs «Nome utente» (§9.2 vs §10.1)

**Problema:** §9.2 parla di ricerca tramite «nickname»; §10.1 definisce «Nome utente» come unico termine visibile all'utente.

**Rischio:** Incoerenza nelle etichette UI.

**Soluzione proposta:** Uniformare §9.2 a «Nome utente». Non blocca lo sviluppo; la Fase 1 e la Fase 10 useranno sempre «Nome utente» in UI.

---

### S4 — Utenti bloccati e inviti (§9.2 + §6)

**Problema:** Il blocco utenti è definito in §9.2 ma §6 non esplicita che utenti bloccati non possono inviare/ricevere inviti.

**Rischio:** Implementazione incoerente tra modulo Amici e modulo Inviti.

**Soluzione proposta:** Aggiungere al §6 una riga esplicita. In attesa, la Fase 3 e la Fase 10 implementeranno il blocco come regola trasversale del motore inviti.

---

### S5 — Moduli futuri nel Workspace (§12.4)

**Problema:** §12.4 elenca Documenti, Biglietti, Prenotazioni, Spese non ancora esistenti nell'applicazione.

**Rischio:** Confusione su cosa deve funzionare in v1.

**Soluzione adottata nel piano:** Il Workspace v1 espone solo Diario, Valigie e Template. L'interfaccia workspace deve essere **predisposta** per moduli aggiuntivi ma non li implementa. Nessuna modifica alla Specifica richiesta.

---

## Panoramica delle fasi

| Fase | Titolo | Dipende da |
|------|--------|------------|
| **1** | Identità utente e accesso collaborativo | — |
| **2** | Motore delle Risorse Condivisibili e permessi | 1 |
| **3** | Sistema inviti e notifiche collaborative iniziali | 2 |
| **4** | Wizard Condividi e gestione collaborazione | 3 |
| **5** | Collaborazione su Valigie e Template | 4 |
| **6** | Collaborazione su Diario e Tab Note | 4 |
| **7** | Workspace — modello, permessi e composizione | 4, 5 |
| **8** | Workspace — interfaccia e accesso multiplo | 7 |
| **9** | Lock, presenza live e collaborazione simultanea | 5, 6, 8 |
| **10** | Profilo collaborativo, attività, autore, allegati e Admin | 3, 8, 9 |

---

## Fase 1 — Identità utente e accesso collaborativo

### Obiettivo

Stabilire le fondamenta identitarie e di accesso necessarie prima di qualsiasi funzione collaborativa. Nessun utente può collaborare senza identità univoca e autenticazione.

### Funzionalità comprese

- **Nome utente univoco e obbligatorio** (§10.1)
  - Corrispondenza tecnica con lo `slug` esistente
  - Termine visibile all'utente: solo «Nome utente»
  - Verifica univocità in registrazione
  - Gestione utenti esistenti senza Nome utente (migrazione/obbligo al prossimo accesso)
- **Foto profilo** (§10.2)
  - Caricamento in registrazione e da profilo
  - Avatar generico se assente
  - Fortemente consigliata in registrazione
- **Gate utenti Guest** (§6.1)
  - Interruzione flussi Condividi / Workspace per utenti non autenticati
  - Reindirizzamento a login/registrazione
  - Ripresa del flusso dopo autenticazione (dove tecnicamente possibile)
- **Preparazione concettuale Community vs Collaborazione** (§11.2)
  - Nessuna modifica al flusso community esistente
  - Verifica che etichette e percorsi UI non confondano «Pubblica nella Community» con «Condividi»

### Dipendenze

Nessuna.

### Criterio di completamento

La fase è **terminata** quando:

- [x] Ogni nuovo utente registrato ha un Nome utente univoco
- [x] Gli utenti esistenti rilevanti hanno un percorso per impostare il Nome utente
- [x] La foto profilo è caricabile e l'avatar di default è visibile
- [x] Un utente Guest che tenta Condividi o Workspace viene bloccato e invitato ad autenticarsi
- [x] «Pubblica nella Community» e «Condividi» sono percorsi distinti e non ambigui in UI

---

## Fase 2 — Motore delle Risorse Condivisibili e permessi

### Obiettivo

Costruire il **motore collaborativo centrale** (§2.2, §3): astrazione Risorsa Condivisibile, ruoli collaborativi, ACL per condivisione semplice, separazione dai ruoli piattaforma.

### Funzionalità comprese

- **Registro delle Risorse Condivisibili** (§3)
  - Tipi iniziali: Diario, Valigia, Template Utente
  - Estensibilità per moduli futuri (senza implementarli)
- **Ruoli collaborativi** (§7)
  - Proprietario, Collaboratore, Visualizzatore per risorsa
  - Separazione esplicita dai ruoli piattaforma (Admin, Business, User)
  - Enforcement permessi: modifica, eliminazione risorsa, gestione collaboratori
- **ACL condivisione semplice** (§8)
  - Elenco utenti per risorsa (Proprietario, Collaboratori, Visualizzatori)
  - Operazioni proprietario: invita, modifica ruoli, revoca, rimuovi, reinvia invito rifiutato
- **Risoluzione permessi unificata** (§12.5 + segnalazione S2)
  - Punto centrale per calcolare il permesso effettivo su una risorsa
  - Regola interpretativa: livello più elevato tra ACL risorsa e ACL workspace (fino a conferma formale in Specifica)
- **Modalità Collaborativa / Personale** a livello di modello (§4)
  - Stato della modalità per risorsa
  - Nessuna UI wizard in questa fase (solo infrastruttura)
- **Indicatore risorsa condivisa** a livello dati (§11.1)
  - Stato «condiviso» derivabile per le card

### Dipendenze

- **Fase 1** completata

### Criterio di completamento

La fase è **terminata** quando:

- [x] Diario, Valigia e Template Utente sono registrabili come Risorse Condivisibili
- [x] I tre ruoli collaborativi sono applicabili e verificabili su ogni risorsa
- [x] Un Collaboratore non può eliminare la risorsa né gestire i permessi del Proprietario
- [x] Un Visualizzatore non può modificare il contenuto
- [x] I ruoli piattaforma non interferiscono con i ruoli collaborativi (salvo override admin documentato)
- [x] Esiste un servizio centrale di risoluzione permessi riusabile da tutti i moduli
- [x] Lo stato «condiviso» è determinabile per ogni risorsa

---

## Fase 3 — Sistema inviti e notifiche collaborative iniziali

### Obiettivo

Implementare il ciclo di vita degli **inviti** (§6) e le **notifiche** minime per supportare l'ingresso nella collaborazione.

### Funzionalità comprese

- **Inviti a risorsa** — condivisione semplice (§6, §8; segnalazione S1)
  - Invio tramite email, Nome utente, ricerca utenti
  - Assegnazione ruolo sulla risorsa: Collaboratore o Visualizzatore
  - Stati: In attesa, Accettato, Rifiutato, Revocato
  - Nessun accesso prima dell'accettazione
  - Reinvio dopo rifiuto
  - Revoca da parte del proprietario
- **Ricerca utenti** per inviti
  - Per email e Nome utente
  - Esclusione utenti bloccati (§9.2 + segnalazione S4)
- **Notifiche collaborative iniziali** (§19 — sottoinsieme)
  - «Marco ti ha invitato»
  - «Giulia ha accettato il tuo invito»
  - «[Nome] ha rifiutato il tuo invito» (implicito nel flusso)
  - Integrazione con il sistema notifiche esistente (nessun nuovo sistema)
- **Solo utenti registrati** (§6)
  - Nessun link pubblico

### Dipendenze

- **Fase 2** completata

### Criterio di completamento

La fase è **terminata** quando:

- [x] Un proprietario può invitare un utente a una risorsa con ruolo definito
- [x] Il destinatario riceve notifica, può accettare o rifiutare
- [x] Prima dell'accettazione il destinatario non ha accesso alla risorsa
- [x] Dopo l'accettazione il ruolo assegnato è effettivo
- [x] Inviti rifiutati possono essere reinviati; inviti possono essere revocati
- [x] Utenti bloccati non possono inviare né ricevere inviti
- [x] Le notifiche di invito sono visibili nel sistema notifiche esistente

---

## Fase 4 — Wizard Condividi e gestione collaborazione

### Obiettivo

Consegnare l'**esperienza utente principale** del motore collaborativo: pulsante Condividi, wizard guidato, gestione collaboratori, modalità di condivisione.

### Funzionalità comprese

- **Comportamento pulsante Condividi** (§11)
  - Risorsa non condivisa → wizard di condivisione
  - Risorsa già condivisa → gestione collaborazione
- **Wizard di condivisione** (§4, §5)
  - Scelta modalità: Collaborativa o Personale
  - Scelta percorso: Condivisione semplice / Crea nuovo Workspace / Aggiungi a Workspace esistente
  - Per «Crea Workspace» e «Aggiungi a Workspace»: solo avvio flusso (implementazione workspace in Fase 7–8)
  - Per Condivisione semplice: invito utenti e ruoli (integrazione Fase 3)
- **Modalità Personale** — flusso UI (§4.2)
  - Creazione copia completa al destinatario
  - Nessuna sincronizzazione successiva
  - Applicabile a Template, Valigie, Diari (con Note)
- **Modalità Collaborativa** — flusso UI (§4.1)
  - Un solo oggetto condiviso
  - Sincronizzazione modifiche tra utenti autorizzati
- **Gestione collaborazione** (§8)
  - Pannello Proprietario / Collaboratori / Visualizzatori
  - Modifica ruoli, revoca accesso, reinvio inviti
- **Indicatore grafico 👥** sulle card (§11.1)
  - Tooltip «Condiviso»
  - Un solo indicatore, nessun badge aggiuntivo
- **Pubblicazione Community** (§11.2)
  - Conferma separazione totale da Condividi collaborativo
  - Coesistenza sulla stessa risorsa senza interferenza

### Dipendenze

- **Fase 3** completata

### Criterio di completamento

La fase è **terminata** quando:

- [x] Il wizard guida l'utente attraverso modalità e tipo di condivisione
- [x] La condivisione semplice funziona end-to-end su almeno un tipo di risorsa (test con Valigia o Template)
- [x] La modalità Personale produce una copia indipendente
- [x] La modalità Collaborativa mantiene un'unica istanza
- [x] Il pulsante Condividi apre gestione se la risorsa è già condivisa
- [x] L'indicatore 👥 appare sulle risorse condivise
- [x] Community publish e Condividi sono flussi separati e coesistenti
- [x] Le opzioni Workspace nel wizard sono presenti ma possono rimandare a fasi successive se non ancora implementate (con messaggio chiaro all'utente)

---

## Fase 5 — Collaborazione su Valigie e Template

### Obiettivo

Integrare il motore collaborativo con i moduli **Valigie** (§15) e **Template Utente** (§16), più semplici del Diario per modello dati relazionale.

### Funzionalità comprese

- **Valigie — Modalità Collaborativa** (§15)
  - Una sola Valigia condivisa, modifiche sincronizzate
  - Default: Collaborativa
  - Proprietario può cambiare modalità Collaborativa ↔ Personale
- **Valigie — Modalità Personale** (§15, §4.2)
  - Copia indipendente per destinatario
- **Valigie — Visibilità Personale nel Workspace** (§12.5, §15)
  - Valigia Personale visibile in elenco workspace ma contenuto accessibile solo al proprietario (salvo permessi espliciti)
  - Proprietario workspace può solo rimuovere il collegamento
- **Template Utente** (§16)
  - Condivisione autonoma, duplicazione, punto di partenza workspace (collegamento a Fase 7)
  - Template di sistema esclusi da questa integrazione
- **Condivisione semplice** end-to-end su Valigie e Template
- **Informazioni autore** — inizio integrazione (§21)
  - Tracciamento creatore/modificatore a livello risorsa Valigia/Template
- **Notifiche** (§19 — sottoinsieme)
  - «Anna ha modificato la Valigia»
  - «Hai ricevuto un nuovo Template»

### Dipendenze

- **Fase 4** completata

### Criterio di completamento

La fase è **terminata** quando:

- [x] Una Valigia può essere condivisa in modalità Collaborativa e Personale end-to-end
- [x] Un Template Utente può essere condiviso, duplicato e ricevuto in modalità Personale
- [x] Il cambio Collaborativa ↔ Personale su Valigia è operativo
- [x] Le regole di visibilità Valigia Personale sono rispettate
- [x] Autore e ultima modifica sono conservati su Valigie e Template
- [x] Le notifiche di modifica Valigia e ricezione Template funzionano
- [x] I Template di sistema non entrano nel motore collaborativo

---

## Fase 6 — Collaborazione su Diario e Tab Note

### Obiettivo

Integrare il motore collaborativo con il **Diario di Viaggio** e il **Tab Note** (§13, §14), rispettando il lock sull'intero Diario in v1.

### Funzionalità comprese

- **Diario come Risorsa Condivisibile** (§13)
  - Condivisione dell'intero contenitore: Giorni, Itinerario, POI, Checklist, allegati futuri, Tab Note
- **Tab Note** (§14)
  - Eredità automatica dalla condivisione del Diario
  - Creazione, modifica, eliminazione Note da Collaboratori autorizzati
  - Nessuna condivisione autonoma delle Note
- **Modalità Collaborativa** sul Diario (§4.1, §13)
  - Un solo Diario, sincronizzazione modifiche
- **Modalità Personale** sul Diario (§4.2, §14)
  - Copia completa incluso Tab Note, evoluzione indipendente
- **Lock Diario v1** — integrazione base (§13)
  - In modalità modifica: intero Diario (compreso Tab Note) bloccato per altri
  - (Presenza live e timeout lock completi in Fase 9)
- **Informazioni autore** su elementi Diario (§21)
  - Creato da / Ultima modifica / POI aggiunto da / Nota creata da
- **Notifiche** (§19)
  - «Paolo ha aggiornato il Diario condiviso nel workspace [nome]» con link al workspace (quando workspace attivo; altrimenti notifica senza link workspace)

### Dipendenze

- **Fase 4** completata
- Consigliata **Fase 5** per pattern consolidati, ma non strettamente bloccante

### Criterio di completamento

La fase è **terminata** quando:

- [ ] Un Diario può essere condiviso in modalità Collaborativa e Personale end-to-end
- [ ] Le Note ereditano la condivisione del Diario senza flusso separato
- [ ] I Collaboratori possono creare/modificare/eliminare Note
- [ ] La modalità Personale duplica Diario e Note integralmente
- [ ] In modifica collaborativa, un solo utente alla volta può modificare il Diario (lock intero)
- [ ] Le informazioni autore sono conservate per elementi del Diario e Note
- [ ] Le notifiche di aggiornamento Diario funzionano

---

## Fase 7 — Workspace: modello, permessi e composizione

### Obiettivo

Implementare il **Workspace** come contenitore con propria ownership, composizione risorse e **matrice permessi** per risorsa (§12, §12.0, §12.5).

### Funzionalità comprese

- **Creazione Workspace** (§5, §12)
  - Da risorsa, da zero, o aggiunta a esistente
  - Nome, descrizione, utenti iniziali, impostazioni
- **Composizione Workspace** (§12.0)
  - Selezione risorse da includere (Diario con Note, Valigie, Template)
  - Configurazione predefinita suggerita, modificabile dal proprietario
  - Moduli futuri esclusi dalla v1 (segnalazione S5)
- **Ownership Workspace** (§12.5)
  - Proprietario workspace ≠ proprietario risorse
  - Scenario: workspace da Diario ricevuto in condivisione
- **Permessi Workspace per risorsa** (§12.5)
  - Per ogni utente e risorsa: Nessun accesso / Visualizzatore / Collaboratore
  - Definizione permessi in creazione workspace e aggiunta risorsa
  - Modifica successiva dal Proprietario workspace
  - Indipendenza dalle condivisioni preesistenti sulla risorsa
- **Inviti al Workspace** (§6, §12.5; segnalazione S1)
  - Ruolo per risorsa definito durante invito
  - Modifica successiva dalla gestione workspace
- **Gestione risorse nel Workspace** (§12.5)
  - Aggiunta/rimozione collegamenti (non eliminazione risorsa originale)
  - Utenti autorizzati possono aggiungere Valigie, Documenti futuri, ecc. (in v1: Valigie)
  - Notifica al proprietario workspace all'aggiunta Valigia (§15)
  - Rimozione collegamento opzionale da proprietario workspace
- **Valigie nel Workspace** (§15)
  - Collegamento immediato da partecipante autorizzato
  - Regole Personale/Collaborativa e visibilità (§12.5, §15)

### Dipendenze

- **Fase 4** completata (wizard con opzioni workspace)
- **Fase 5** completata (Valigie nel workspace)

### Criterio di completamento

La fase è **terminata** quando:

- [ ] Un Workspace può essere creato vuoto, da risorsa, o ricevendo risorse aggiuntive
- [ ] La composizione risorse è configurabile nel wizard
- [ ] Il proprietario workspace gestisce permessi per utente/risorsa (Nessun accesso / Visualizzatore / Collaboratore)
- [ ] Le condivisioni preesistenti sulla risorsa restano indipendenti
- [ ] Gli inviti al workspace assegnano permessi per risorsa
- [ ] Aggiunta/rimozione risorse non elimina le risorse originali
- [ ] Un partecipante autorizzato può aggiungere Valigie con notifica al proprietario workspace
- [ ] Le regole Valigia Personale nel workspace sono operative

---

## Fase 8 — Workspace: interfaccia e accesso multiplo

### Obiettivo

Consegnare la **dashboard Workspace** laterale e tutti i punti di accesso nell'applicazione (§12.1–§12.4).

### Funzionalità comprese

- **Dashboard Workspace laterale** (§12.3)
  - Apertura da destra, Diario/contesto principale sempre visibile
  - Non sostituisce il Diario
- **Contenuti Workspace v1** (§12.4; segnalazione S5)
  - Visualizzazione Diario, Valigie, Template
  - Gestione utenti autorizzati al Workspace
  - Gestione inviti al Workspace
  - Gestione condivisione risorse nel Workspace
  - Slot predisposti per moduli futuri (non implementati)
- **Accesso multiplo** (§12.1)
  - Dal Diario, Dashboard Valigie, sezione Condivisione profilo, Home Page, altre aree pertinenti
  - Stesso Workspace raggiungibile da ogni punto
- **Pulsante Workspace nel Diario** (§12.2)
  - Desktop: header Diario, accanto agli altri pulsanti
  - Mobile: posizione da definire in implementazione (Specifica: «studiata successivamente»)
- **Completamento wizard Fase 4**
  - Percorsi «Crea Workspace» e «Aggiungi a Workspace esistente» pienamente operativi

### Dipendenze

- **Fase 7** completata

### Criterio di completamento

La fase è **terminata** quando:

- [ ] Il Workspace si apre come pannello laterale senza sostituire il contesto principale
- [ ] Diario, Valigie e Template sono accessibili dal Workspace
- [ ] La gestione utenti, inviti e permessi risorse è operativa dall'interfaccia Workspace
- [ ] Il Workspace è raggiungibile da Diario, Valigie, profilo e Home
- [ ] Il pulsante Workspace è presente nel Diario (desktop)
- [ ] I flussi wizard workspace della Fase 4 sono completamente funzionanti

---

## Fase 9 — Lock, presenza live e collaborazione simultanea

### Obiettivo

Implementare **lock per risorsa**, **presenza live** e **collaborazione simultanea** (§17, §18), completando l'esperienza multi-utente in tempo reale.

### Funzionalità comprese

- **Lock per Risorsa Condivisibile** (§18)
  - Lock sul singolo contenuto in modifica, mai sull'intero Workspace
  - Diario: lock intero incluso Tab Note (§13)
  - Valigia: lock sulla singola Valigia
  - Altre risorse: lock sulla singola risorsa
- **Timeout lock** (§18.1)
  - Reset timer su attività utente (digitazione, mouse, click, modifiche, editor)
  - Inattività configurabile (~5 minuti in v1)
  - Al timeout: salvataggio automatico, rilascio lock, chiusura modalità modifica
- **Accesso a risorsa bloccata** (§18.2)
  - Messaggio informativo con durata modifica altrui
  - Blocco modifica sulla risorsa bloccata; altre risorse nel Workspace restano modificabili
- **Presenza live** (§17)
  - Indicatori utenti presenti (es. 👤 Paolo, 🟢 Giulia attivo)
  - Nessuna informazione tecnica esposta
- **Stato modifica** (§17.1)
  - Messaggi discreti: «Marco sta modificando il Diario», «Anna sta modificando una Valigia»
  - Solo finalità informative (coerenti con lock v1 su Diario intero)
- **Sincronizzazione modifiche** in modalità Collaborativa (§4.1)
  - Modifiche visibili agli altri utenti autorizzati

### Dipendenze

- **Fase 5** completata (lock Valigie)
- **Fase 6** completata (lock Diario)
- **Fase 8** completata (contesto workspace per presenza multi-risorsa)

### Criterio di completamento

La fase è **terminata** quando:

- [ ] Solo un utente alla volta può modificare una data risorsa (lock per risorsa)
- [ ] Il lock Diario copre l'intero Diario e Tab Note
- [ ] Il timeout con salvataggio automatico e rilascio lock funziona
- [ ] Un utente che tenta di modificare una risorsa bloccata vede un messaggio informativo
- [ ] Le altre risorse nel Workspace restano modificabili durante il lock su una risorsa
- [ ] La presenza utenti è visibile nelle risorse condivise
- [ ] I messaggi di stato modifica sono coerenti con il lock v1
- [ ] Le modifiche in modalità Collaborativa sono visibili agli altri utenti autorizzati

---

## Fase 10 — Profilo collaborativo, attività, autore, allegati e Admin

### Obiettivo

Completare le funzionalità satellite: **profilo Condivisione e Amici**, **registro attività**, **notifiche avanzate**, **allegati workspace**, **sezione Admin Ruoli Collaborativi**.

### Funzionalità comprese

- **Sezione Profilo «Condivisione»** (§9.1)
  - Risorse condivise, inviti ricevuti/inviati, collaborazioni attive
  - Accesso rapido ai Workspace
  - Righe con: nome risorsa/viaggio, icone presenza Diario/Note/Valigia/Template
  - Pulsanti Apri, Condividi, Workspace
  - Comportamento Condividi coerente con §11
- **Sezione Profilo «Amici»** (§9.2)
  - Ricerca per email e Nome utente (non «nickname» in UI — segnalazione S3)
  - Richiesta, accettazione, rifiuto amicizia
  - Blocco, elenco amici, elenco bloccati, sblocco
  - Integrazione con inviti (utenti bloccati esclusi)
- **Registro Attività** (§20)
  - Eventi leggibili: aggiunte, eliminazioni, modifiche su risorse condivise
  - Esempi: oggetto Valigia, Giorno 3, Nota «Ristoranti»
  - Non cronologia tecnica
- **Informazioni autore** — completamento UI (§21)
  - Visualizzazione dove previsto (posizione UI definita in implementazione)
  - Conservazione garantita su tutti i moduli v1
- **Notifiche collaborative complete** (§19)
  - Tutti gli esempi del §19 operativi
  - Preferenze per categoria nel profilo utente
- **Allegati Workspace** (§12.6)
  - Upload PDF, Office, fogli, presentazioni, immagini
  - Validazione MIME e firma file
  - Limiti configurabili: dimensione file, spazio workspace, spazio account
  - Quota addebitata al Proprietario workspace
  - Video esclusi in v1
- **Admin Panel — Ruoli Collaborativi** (§7)
  - Nuova sezione per gestione Ruoli Collaborativi
  - Separata dai ruoli piattaforma
  - Scopo: configurazione e governance del sistema collaborativo (non sostituisce ACL per risorsa)

### Dipendenze

- **Fase 3** completata (notifiche base)
- **Fase 8** completata (workspace per allegati e profilo)
- **Fase 9** completata (attività correlate a eventi live)

### Criterio di completamento

La fase è **terminata** quando:

- [ ] Le sezioni Condivisione e Amici sono operative nel profilo
- [ ] Il registro attività mostra eventi leggibili per Diario, Valigie, Template
- [ ] Le informazioni autore sono conservate e visualizzate dove implementato
- [ ] Tutte le notifiche del §19 sono supportate con preferenze per categoria
- [ ] Gli allegati workspace rispettano tipi, limiti e quote del §12.6
- [ ] La sezione Admin Ruoli Collaborativi è presente e separata dai ruoli piattaforma
- [ ] Il sistema collaborativo v1 è integrato end-to-end secondo la Specifica Funzionale

---

## Chiusura del progetto v1

Il **Sistema di Collaborazione e Workspace v1** si considera **completato** quando tutte le fasi da 1 a 10 hanno soddisfatto i rispettivi criteri di completamento.

### Fuori scope v1 (richiedono nuova pianificazione)

- Lock granulare sul Diario (oltre lock intero — §13)
- Amministratori Workspace (§12.5 — funzionalità futura)
- Trasferimento proprietà risorsa (§7.1 — funzionalità futura)
- Moduli collaborativi: Documenti, Biglietti, Prenotazioni, Spese, PDF standalone, Checklist
- Video negli allegati workspace
- Commenti collaborativi
- Posizione mobile pulsante Workspace (§12.2 — da studiare in implementazione)

---

## Regole per tutte le fasi

1. **Nessun modello alternativo** di collaborazione (§22).
2. **Condivisione sempre sul contenitore**, mai su sotto-elementi (§2.3).
3. **Collaborazione invisibile** all'utente: niente esposizione di termini tecnici (§2.4).
4. **Libertà di utilizzo**: nessun flusso obbligatorio imposto (§2.0).
5. **Guest esclusi** da ogni funzione collaborativa (§6.1).
6. **Community e Collaborazione** sempre indipendenti (§11.2).
7. Ogni fase deve **rileggere la Specifica Funzionale** prima dell'implementazione.

---

*Documento ufficiale — Piano di Sviluppo Sistema di Collaborazione e Workspace — TouringDiary v1.0*
