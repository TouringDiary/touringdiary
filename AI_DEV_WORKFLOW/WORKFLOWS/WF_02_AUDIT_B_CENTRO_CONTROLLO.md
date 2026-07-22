# Audit B — Collaudo funzionale Centro di Controllo  
## Source of Truth del collaudo (WF-02 · STEP-3 · Post-3.4)

> **Stato documento:** ATTIVO — aggiornare a ogni sessione di test PO.  
> **Ultimo aggiornamento:** 2026-07-22 (Decisioni PO definitive T20 / Programmazioni UX + layout Manutenzione — §19; T14/T15/CROSS-P SUPERATI)  
> **Owner:** Product Owner + AI sviluppo  
> **Regola:** nessuna decisione di collaudo deve restare solo in chat; va registrata qui.  
> **Codice:** fix UX/BUG ✓ · MSG-SOT + Scheduler ✓ · T02-B gating ✓ · overlay Segnalazioni ✓ · Programmazioni UX T20 ✓ (2026-07-22).

Collegamenti: `WF_02_IMPLEMENTATION_MASTERPLAN.md` · `03_PROJECT_STATUS.md` · DOC 30 (catalogo flag · DL-P13/P14).

---

## 1. Sintesi esecutiva

| Voce | Valore |
|------|--------|
| **Collaudo** | Audit B — Feature Flag ↔ comportamento app |
| **Avanzamento** | Runtime gating AI **COMPLETATO** (T01–T04) · T14/T15 **SUPERATI** · CROSS-P Persistenza **SUPERATO** · provider AI **POSTICIPATO** · residui: T16 / T20 Programmazioni / AUDIT-05 / T12 + Audit A |
| **Implementazione** | MSG-SOT + Scheduler + T02-B UI/gateway ✓ |
| **Chiusura Audit B** | Residui non-AI (T12/T16/T20/AUDIT-05) + Audit A + assenza criticità |

---

## 2. Registro test (stato ufficiale)

Legenda: `SUPERATO` · `APERTO` · `BLOCCATO` · `NON ESEGUIBILE` · `UX` · `AUDIT` · `POSTICIPATO`

### 2.1 SUPERATI (non ripeterli salvo regressione)

| # | Feature Flag (nome UI) | TAB | Esito | Data | Note PO |
|---|------------------------|-----|-------|------|---------|
| T01 | AI Utente | AI | **SUPERATO** | 2026-07-20 | Gating OK; UX-01 banner OK |
| T02 | AI Admin All | AI | **SUPERATO** | 2026-07-21 | PO: gating + UI disabled/banner OK post T02-B; blocco preventivo OK |
| T03 | AI Admin Limited | AI | **SUPERATO** | 2026-07-21 | Stesso perimetro gating di T02 (ruolo Limited) |
| T04 | Stop emergenza AI | AI | **SUPERATO** | 2026-07-21 | Emergency Stop priorità assoluta; UI + blocco preventivo OK |
| T05 | Acquisto crediti AI | AI | **SUPERATO** | 2026-07-20 | Flag OK; resta audit pagamento (→ AUDIT-04) |
| T06 | Abbonamenti premium | AI | **SUPERATO** | 2026-07-20 | — |
| T07 | Chat Admin↔Partner | Comunicazioni | **SUPERATO** | 2026-07-20 | — |
| T08 | Chat Utente↔Sponsor | Comunicazioni | **SUPERATO** | 2026-07-20 | — |
| T09 | Notifiche in-app | Comunicazioni | **SUPERATO** | 2026-07-20 | — |
| T10 | Nuove candidature Sponsor | Sponsor | **SUPERATO** | 2026-07-20 | — |
| T11 | Shop partner pubblici | Sponsor | **SUPERATO** | 2026-07-20 | — |
| T13 | Recensioni utenti | Moderazione | **SUPERATO** | 2026-07-20 | Piano click-by-click aggiornato §9.2 (smoke opzionale) |
| T14 | Upload foto | Moderazione | **SUPERATO** | 2026-07-22 | OFF/ON, blocco caricamento, riabilitazione — nessuna anomalia |
| T15 | Segnalazioni utenti | Moderazione | **SUPERATO** | 2026-07-22 | OFF/ON, blocco invio, riabilitazione; overlay UI allineato Foundation |
| T17 | Modalità manutenzione | Manutenzione | **SUPERATO** | 2026-07-20 | — |
| T18 | Registrazione nuovi utenti | Manutenzione | **SUPERATO** | 2026-07-20 | — |
| T19 | Onboarding guidato | Manutenzione | **SUPERATO** | 2026-07-20 | — |
| CROSS-P | Persistenza Feature Flag (trasversale) | — | **SUPERATO** | 2026-07-22 | Salvataggio + refresh + nuova sessione + logout/login + coerenza consumer. **Non** sostituisce T20 (Programmazioni). |

### 2.1-bis Runtime gating AI — chiusura collaudo (PO 2026-07-21)

| Voce | Esito |
|------|-------|
| Feature Flag AI (Utente / Admin All / Admin Limited) | **COMPLETATO** |
| Emergency Stop | **COMPLETATO** |
| Blocco preventivo chiamate AI (prima del layer provider / API Key) | **COMPLETATO** |
| UI (banner, disabled, modali, tooltip) | **COMPLETATO** |
| Runtime gating Centro di Controllo | **COMPLETATO** |

**Provider AI (Gemini/OpenAI)** — generazione contenuti, qualità output, prompt, parsing, retry, funzionalità dipendenti da API Key reali: **POSTICIPATO** al collaudo finale post-configurazione API Key. Non blocca la chiusura del collaudo gating STEP-3.

### 2.2 APERTI / BLOCCATI / NON ESEGUIBILI / POSTICIPATI

| # | Feature Flag | Stato | Motivo |
|---|--------------|-------|--------|
| — | Test funzionali provider AI (Gemini/OpenAI) | **POSTICIPATO** | Collaudo finale dopo API Key reali (decisione PO 2026-07-21) |
| T12 | Soglia rating alert | **NON ESEGUIBILE** | Nessuno shop con recensioni disponibili |
| T16 | Post community | **APERTO** + **AUDIT-05** | Collaudo operativo autonomo (documento + chat PO); decisione PO rinomina ancora aperta |
| T20 | Programmazioni in pausa | **APERTO** | Collaudo operativo autonomo (documento + chat PO). Distinto da CROSS-P Persistenza (già SUPERATO) |

---

## 3. Bug — stato fix

### BUG-01 — AI Admin All/Limited: Feature Flag assente sui path Admin editor — **FIX IMPLEMENTATO** (poi **T02-B**)
- **Sintomo PO:** con flag OFF il processo AI parte e arriva a errori API Key.
- **Causa dimostrata (§13):** i consumer Admin (TabGeneral/Media/Culture/Ratings, Magic City, aiGateway diretto) **non chiamavano** `getAiRuntimeStatus` prima dell’Edge.
- **Fix v1 (2026-07-20):** `assertAiRuntimeAvailable()` in `supabaseProvider.generate`; contesto ruolo sync via `setAiRuntimeEvaluationContext`.
- **Collaudo T02 FALLITO (2026-07-21):** pulsanti ancora cliccabili; blocco solo a `API_KEY_MISSING` / `[AI Safety]`.
- **Causa dimostrata T02-B:** `withRetry()` in `aiUtils.ts` controllava `VITE_USE_AI` / API Key **prima** di chiamare `fn()` → `assertAiRuntimeAvailable` nel provider **non veniva mai raggiunto** quando la key client era assente. Inoltre UI editor senza `disabled`/banner.
- **Fix T02-B (2026-07-21):**
  1. `assertAiRuntimeAvailable()` **prima** del check API Key in `withRetry`;
  2. assert anche in `aiGateway.generateLegacy` / `generateText` / `generateChat`;
  3. hook `useAiRuntimeGate` + banner `AdminAiRuntimeBanner` in editor città;
  4. pulsanti Rigenera / AiFieldHelper / Culture / Servizi / AdminImageInput disabilitati + messaggio CC.
- **Stato fix:** implementato 2026-07-21 — **collaudo gating PO SUPERATO** (T02/T03/T04, 2026-07-21). Provider AI **POSTICIPATO** (API Key).

### BUG-02 — Upload foto: copertura non uniforme — **FIX IMPLEMENTATO**
- **Causa dimostrata:** Live Feed controllava solo `feature.moderation.community_posts`; Galleria controllava `feature.moderation.photos` solo a conferma (fail-open `if (flag && !flag.enabled)`); `uploadCommunityPhoto` **senza** guard.
- **Fix:** guard in `uploadCommunityPhoto`; fail-closed; early UI Galleria + Live Feed (Scatta + confirm); Live Feed verifica anche PHOTOS.
- **Stato fix:** implementato 2026-07-20 — rieseguire T14.

### BUG-03 — Segnalazioni: Feature Flag non blocca il modulo — **FIX IMPLEMENTATO**
- **Causa dimostrata:** unico check in `handleSubmit` (dopo compilazione form); `addSuggestion` senza guard; pattern fail-open.
- **Fix:** `useFeatureFlag` all’apertura → UI “Segnalazioni sospese”; fail-closed submit; guard in `suggestionService.addSuggestion`; shell `BaseFullscreenModalShell`.
- **Stato fix:** implementato 2026-07-20 — rieseguire T15.

---

## 4. Miglioramenti UX — stato

### UX-01 — Magic Planner banner in alto — **FIX IMPLEMENTATO**
- Banner `AiRuntimeBanner` spostato **sopra** la sezione 1 del form; `getAiRuntimeStatus` riceve ruolo utente da `useUser`.
- **Stato:** implementato 2026-07-20 — smoke consigliato.

### UX-02 — Standardizzare Segnalazioni + Roadbook — **FIX IMPLEMENTATO**
- Entrambi usano `BaseFullscreenModalShell` (CloseButton standard, ESC, portal, z-index registry).
- **Stato:** implementato 2026-07-20 — smoke consigliato.

---

## 5. Audit aperti / chiusi

| ID | Titolo | Richiede codice? | Stato |
|----|--------|------------------|-------|
| AUDIT-01 | Percorsi click-by-click AI Admin All / Limited | Indagine sì; fix dopo | **COMPLETATO §13** + **BUG-01 fixato** (gateway) |
| AUDIT-02 | (riservato) | — | — |
| AUDIT-03 | Messaggi Feature Flag: SoT vs hardcoded (tutti i flag CC) | Solo audit | **COMPLETATO §14** |
| AUDIT-04 | Acquisto crediti senza pagamento reale | Solo audit | **COMPLETATO §7** |
| AUDIT-05 | Post community vs Upload foto | Solo audit / proposta | **COMPLETATO forense §13** — decisione PO rinomina ancora aperta |
| AUDIT-06 | Guida Programmazioni per PO | Documentazione | **COMPLETATO §8** |
| AUDIT-07 | Programmazioni: anticipo / messaggio Admin / sticky OFF | Solo audit | **COMPLETATO §15** (SCH-01/02/03) |
| AUDIT-08 | Scheduler approfondito (SCH-AUDIT-02) | Audit → fix | **COMPLETATO diagnosi §16/§18** · fix in implementazione |
| — | MSG-SOT / DL-P13 | Implementazione | Autorizzato PO |

---

## 6. Decisioni Product Owner (immutabili in questo collaudo)

1. I 12 test SUPERATI **non** si ripetono salvo regressione.  
2. ~~Nessuna implementazione finché gli audit aperti non sono chiusi~~ **Aggiornato 2026-07-20:** priorità fix UX/BUG; poi migrazione messaggi + Scheduler autorizzati.  
3. Collaboration Live **non** è un Feature Flag (DL-P12) — fuori Audit B.  
4. Per ogni Feature Flag AI Admin: piano di test **solo** click-by-click (vietato “prova una funzione AI”).  
5. Segnalazioni: fix funzionale + standard UI (+ Roadbook) — **eseguito**.  
6. Post community: decisione rinomina ancora aperta (AUDIT-05) — non blocca MSG-SOT.  
7. Soglia rating: lasciare **NON ESEGUIBILE** finché non esistono shop con recensioni.  
8. **Regola permanente audit:** conclusioni solo con pipeline codice dimostrata; vietate ipotesi (vedi `02_GOVERNANCE.md` §12).  
9. **DL-P13 (definitiva):** tutti i messaggi destinati agli utenti provengono **esclusivamente** dal Centro di Controllo (Message Template → DB). I cataloghi TypeScript **non** sono Source of Truth. Hardcoded ammessi solo per log, debug, commenti, errori tecnici; fallback bootstrap solo se riga DB assente.  
10. **Filone Scheduler (PO):** audit approfondito (runtime, cache, refresh, timezone, override, evaluation, start/stop) poi fix + **SCH-STATUS-UI** (stati riga: In attesa / Attiva / Eseguita / In pausa / Disabilitata / Errore).  

---

## 7. Risposte audit (senza modifiche al codice)

### AUDIT-04 — Acquisto crediti senza pagamento reale — **RISPOSTA**

**Comportamento previsto dell’ambiente attuale**

Esiste una **modalità sviluppo / locale** del pagamento:

- In configurazione tipica di sviluppo, la modalità Stripe è impostata su **local** (non produzione).
- In modalità **local**, un Admin che avvia “Ricarica Crediti” **non** passa da un pagamento Stripe reale: viene creata una sessione **simulata (mock)** e si viene portati alla pagina di successo checkout con parametro di mock.
- Un utente **non Admin**, in modalità local, **non** può completare la simulazione (messaggio del tipo “Simulazione acquisto disabilitata per utenti non admin”).
- In modalità **test** o **prod** (quando configurata), il flusso punta a Stripe Checkout reale (con Price ID di test o produzione).

**Cosa ha visto il PO**

Se il collaudo è stato fatto da **Admin All** su ambiente **local**, è **normale** aver “acquistato” crediti senza carta: è il bypass di sviluppo, non un bug del Feature Flag “Acquisto crediti” (il flag OFF/ON è già SUPERATO).

**Cosa non è**

- Non è che il Feature Flag sia rotto.
- Non significa che in produzione chiunque ottenga crediti gratis (a meno di lasciare Stripe in local per errore).

**Verifica consigliata in collaudo (senza codice)**

1. In Admin → **AI Control Center**, leggere l’indicatore **Stripe:** (LOCAL / TEST / PROD).  
2. Se vedi **LOCAL** e sei Admin → mock atteso.  
3. Prova con utente non Admin in LOCAL → simulazione negata.  
4. Solo con Stripe TEST/PROD configurato si collauda il pagamento “vero”.

---

### AUDIT-03 — Messaggi hardcoded vs Source of Truth — **ESITO PRELIMINARE**

**Problema osservato dal PO**

- Catalogo / card Centro di Controllo (Stop emergenza):  
  *“I servizi AI sono sospesi per emergenza operativa.”*
- Magic Planner (runtime):  
  *“I servizi AI sono temporaneamente sospesi per emergenza (Centro di Controllo).”*

**Causa (analisi, senza fix)**

Esistono **due fonti** di testo:

1. **Source of Truth prevista** — catalogo messaggi del Centro di Controllo (modificabile dalle card / Info dove previsto), con testo di default per lo stop emergenza.
2. **Testi fissi nel comportamento runtime AI** — messaggi scritti direttamente nel percorso che decide se l’AI è disponibile (emergenza ACC storica, emergenza CC, AI disattivata, profilo bloccato). Questi **non** leggono sempre il catalogo messaggi del Centro di Controllo.

Quindi la discordanza è **reale**: non è un’impressione.

**Ambito audit completo ancora da chiudere (checklist operativa)**

Per **ogni** Feature Flag del Centro di Controllo verificare in collaudo:

| Domanda | Come |
|---------|------|
| Il messaggio OFF/ON si può modificare dalla card / Info Globali? | Modifica testo → ricarica consumer → il testo nuovo compare? |
| Compare ancora un testo diverso da quello salvato? | Segnare “hardcoded / non collegato” |
| Se non c’è messaggio in catalogo, cosa vede l’utente? | Annotare il testo esatto |

**Flag da includere obbligatoriamente nell’audit messaggi:** tutti quelli con messaggio utente (AI ×4, crediti, abbonamenti, chat×2, candidature, recensioni, manutenzione, registrazione) + verifica che flag **senza** messaggio catalogo non mostrino testi “fantasma” incoerenti.

**Stato:** esito preliminare **chiuso come diagnosi**; **checklist collaudo messaggi** ancora da eseguire riga per riga (resto di AUDIT-03).

---

### AUDIT-05 — Post community vs Upload foto vs Diario — **ESITO PRELIMINARE**

**Cosa fa oggi (comportamento osservabile)**

| Interruttore | Cosa governa oggi |
|--------------|-------------------|
| **Upload foto** | Caricamento foto (percorso galleria/community foto) |
| **Post community** | Conferma pubblicazione snap/post nel **Live Feed** Social/Community |
| **Pubblica in Community** (Diario) | Percorso separato del Diario (“Pubblica in Community”) — **non** è collegato a “Post community” nel collaudo attuale |

**Valutazione per il PO**

- Non sono lo stesso bottone, ma sono **vicini** (entrambi riguardano contenuti community basati su foto/live).  
- L’aspettativa PO (“controlla la pubblicazione del Diario in Community”) **non** corrisponde al comportamento attuale di **Post community**.  
- Quindi il flag **non è solo un duplicato etichettato male**: ha un consumer (Live Feed), ma il **nome/aspettativa** non combacia con “Pubblica Diario”.

**Proposta (solo decisione, niente implementazione)**

1. Tenere **Upload foto** = tutti i caricamenti foto utente (Galleria + feed), con copertura uniforme (dopo BUG-02).  
2. Rinominare / riposizionare **Post community** → **Pubblica Diario Community** e collegarlo al flusso Diario “Pubblica in Community”.  
3. Oppure: eliminare la ridondanza se, dopo BUG-02, Upload foto basta per foto+feed e il Diario resta un terzo controllo esplicito.

**Stato:** audit preliminare completato; **attesa decisione PO** tra le opzioni 1–3 prima di qualsiasi fix.

---

### AUDIT-01 — AI Admin All / Limited — **COSA VERRÀ VERIFICATO** (indagine)

1. Elenco percorsi Admin che chiamano generazione AI (es. Manager Città → editor → **Rigenera** su Generali / Media / Cultura / Valutazioni; generatori città; altri).  
2. Per ciascuno: il Feature Flag viene letto **prima** di qualsiasi chiamata AI / controllo chiave?  
3. Piano di test click-by-click (bozza sotto §9) da validare col PO in sessione.  
4. Solo dopo: proposta di fix (fuori scope di questa sessione documentale).

---

## 8. Guida Programmazioni (per il Product Owner) — AUDIT-06

### Cos’è una programmazione?

È un **appuntamento automatico** su un interruttore.

Esempio in italiano:  
«Da lunedì 10:00 a lunedì 12:00 spegni la Registrazione» — senza che tu debba ricordarti di entrare e spegnere a mano.

### Quando serve?

- Manutenzioni programmate.  
- Pause temporanee (es. candidature chiuse solo nel weekend).  
- Test controllati “tra le 15:00 e le 15:10 spegni X”.

### Dove si trova?

1. Accedi come Admin All.  
2. Menu profilo → **Pannello Admin**.  
3. **Centro di Controllo**.  
4. TAB **Manutenzione**.  
5. Nella stessa area trovi:  
   - **card superiori** (grid): Manutenzione / Registrazione / Onboarding / **Programmazioni in pausa**;  
   - sotto, a tutta larghezza: **Programmazione automatica** (finestre orarie).

> **Nota storica (pre–2026-07-22):** la guida originale collocava «Programmazioni in pausa» *dentro* la card Programmazione automatica. Layout aggiornato con decisione PO T20 (§19).

### Come se ne crea una (passi)

1. Nella sezione **Programmazione automatica**, scegli **quale interruttore** programmare (es. Registrazione).  
2. Aggiungi una riga / finestra.  
3. Imposta **inizio** e **fine** (data e ora).  
4. Imposta lo **Stato programmato** desiderato in quella finestra (ON oppure OFF — vedi §19).  
5. Salva la programmazione.  
6. Non serve spegnere subito l’interruttore a mano: nella finestra oraria il sistema dovrebbe applicare da solo lo stato programmato.

### Come provarla in 10 minuti

1. Crea una programmazione su **Registrazione** che inizi **tra 1 minuto** e finisca **tra 10 minuti**, valore OFF.  
2. Resta fuori dalla finestra: Registrazione ancora ON → puoi ancora vedere Registrati.  
3. Quando entra la finestra: apri una finestra privata → Accedi → Registrati → deve risultare chiusa.  
4. Quando la finestra scade: Registrati torna disponibile (se l’interruttore manuale non è lasciato OFF).

### Cos’è “Programmazioni in pausa”?

Interruttore di emergenza operativa:

- **ON** = tutte le finestre orarie restano **salvate** ma **ignorate**. Conta solo ciò che hai impostato a mano (o il default).  
- **OFF** = le finestre tornano ad applicarsi.

Analogia: “metti in pausa la sveglia” — la sveglia è ancora impostata, ma non suona.

### Come collaudare “Programmazioni in pausa”

1. Con una programmazione **attiva adesso** che spegne qualcosa di visibile (es. Registrazione OFF).  
2. Verifica che l’effetto si veda in app.  
3. Accendi **Programmazioni in pausa**.  
4. Ricarica l’app utente: l’effetto della programmazione deve **sparire** (torna lo stato manuale/default).  
5. Spegni la pausa: se sei ancora nella finestra oraria, l’effetto programmato torna.

---

## 9. Piano test click-by-click (bozza obbligatoria) — AI Admin

> Da usare nelle prossime sessioni. **Non** sostituisce ancora il SUPERATO/KO: T02/T03 restano APERTI.

### Premesse

- Account **Admin All** (per T02) oppure **Admin Limited** (per T03).  
- Centro di Controllo: spegnere **solo** il flag sotto test; **Stop emergenza AI** deve essere OFF.  
- Due finestre: Admin CC + editor città.

### Percorso A — Rigenera Pagina Generali (editor città)

1. Centro di Controllo → TAB **AI** → spegni **AI Admin All** (o Limited). Compila motivazione se richiesta.  
2. Menu Admin → **Manager POI** / gestione **Città** (voce reale del menu laterale Admin).  
3. Apri una città esistente (editor città).  
4. Vai alla scheda / TAB **Generali** (o equivalente “dati generali”).  
5. Clicca il pulsante di **Rigenera** / **Rigenerare** dati generali.  
6. Se compare conferma (**Sì, Rigenera**): cliccala.  

**Atteso (dopo fix BUG-01):**  
- blocco immediato con messaggio chiaro;  
- **nessuna** attesa lunga;  
- **nessun** errore legato ad API Key / servizi AI.

**Attuale (bug):** può partire il processo e fallire più tardi (API Key / servizio).

### Percorso B — Rigenera Media

1. Stesso flag OFF.  
2. Stessa città → TAB **Media**.  
3. Clicca **Rigenera Media** → conferma.  
4. Stesso atteso di blocco immediato.

### Percorso C — Rigenera Cultura

1. Flag OFF.  
2. TAB **Cultura** / Storia & Cultura.  
3. Clicca **Rigenera** / **Rigenera Tutto** → conferma.  
4. Stesso atteso.

### Percorso D — Rigenera Valutazioni

1. Flag OFF.  
2. TAB **Valutazioni**.  
3. Clicca **Rigenera Valutazioni** → conferma.  
4. Stesso atteso.

### Percorso E — Generazione nuova città (se presente)

1. Flag OFF.  
2. Elenco città → azione generazione AI / “Magic” / modale creazione città con AI.  
3. Avvia generazione.  
4. Stesso atteso di blocco immediato.

### Riaccensione

1. Riaccendi il flag Admin corrispondente.  
2. Ripeti **un solo** percorso (es. Generali): la rigenerazione deve completarsi (se AI/servizi configurati).

---

## 9.1 Collaudo operativo T16 — Post community (autonomo)

### Obiettivo
Verificare che il Feature Flag **Post community** (TAB Moderazione) blocchi e riabiliti la **conferma di pubblicazione** di una foto nel **Live Feed** della Community, lasciando **Upload foto** acceso (isolamento da T14).

### Preparazione
1. Accedi con un account **Admin All**.
2. Prepara anche un account utente **registrato** (non guest), oppure usa lo stesso Admin All come utente app.
3. Apri due contesti (due finestre/schede del browser, oppure Admin e poi torna in app):
   - Centro di Controllo
   - App utente (Home)
4. Assicurati di avere a disposizione **un’immagine** sul dispositivo (JPG/PNG) per il caricamento da galleria.

---

### Parte 1 — Baseline con Post community ON

1. Nell’app, apri il menu profilo (icona utente in alto).
2. Clicca **Pannello Admin**.
3. Nella sidebar Admin, sotto **Utenti & Ruoli**, clicca **Centro di Controllo**.
4. Nella barra TAB in alto, clicca **Moderazione**.
5. Individua la card **Post community**.
6. Se l’interruttore è **spento**, cliccalo per accenderlo (deve risultare acceso / verde).
7. Individua la card **Upload foto**.
8. Se **Upload foto** è spento, cliccalo per accenderlo (deve restare **ON** per tutto il test).
9. Esci dal Pannello Admin e torna alla Home dell’app (o usa la seconda scheda già sulla Home).
10. Da desktop: nella sidebar sinistra clicca il pulsante **Community**.  
    Da mobile: nella barra in basso clicca **Social**.
11. Si apre **Community Hub**. Nella riga delle TAB interne clicca **Live Feed** (se non è già selezionata).
12. In alto a destra del Live Feed clicca il pulsante **Pubblica Foto**.
13. Nella modale **Pubblica Foto** (scelta modalità) clicca **Scegli dalla galleria**.
14. Seleziona un’immagine dal dispositivo e conferma la selezione del file.
15. Se compare uno step di modifica/ritaglio, completa e prosegui fino alla scheda con città e didascalia (titolo modale ancora **Pubblica Foto**).
16. Nel campo città, seleziona una città dall’elenco (obbligatorio).
17. Nel campo didascalia, digita un testo breve (es. `Test T16 ON`).
18. Clicca il pulsante primario **Pubblica Foto** in fondo alla modale.

**PASS Parte 1**
- La pubblicazione viene accettata (upload avviato/completato, oppure messaggio di successo).
- Non compare un alert del tipo: *«I post community sono temporaneamente disabilitati.»*

**FAIL Parte 1**
- Compare l’alert di post community disabilitati nonostante il flag ON.
- Il pulsante **Pubblica Foto** del Live Feed è disabilitato solo perché **Upload foto** è OFF (in quel caso hai violato la preparazione: Upload foto deve essere ON).

---

### Parte 2 — Post community OFF → blocco alla conferma

1. Torna in **Pannello Admin** → **Centro di Controllo** → TAB **Moderazione**.
2. Sulla card **Post community**, clicca l’interruttore per **spegnerlo** (non serve motivazione obbligatoria su questo flag).
3. Attendi che il salvataggio finisca (spinner sull’interruttore scompare).
4. Verifica a occhio che **Upload foto** sia ancora **ON**.
5. Torna in app → **Community** / **Social** → TAB **Live Feed**.
6. Clicca di nuovo **Pubblica Foto**.
7. Clicca **Scegli dalla galleria**, seleziona un’immagine, completa eventuali step di modifica.
8. Seleziona di nuovo una città e digita una didascalia (es. `Test T16 OFF`).
9. Clicca il pulsante primario **Pubblica Foto**.

**PASS Parte 2**
- Compare un **alert/blocco** con messaggio di post community sospesi (es. *«I post community sono temporaneamente disabilitati.»* o il testo salvato sulla card del flag).
- La foto **non** viene pubblicata nel Live Feed.
- **Upload foto** è rimasto ON per tutto il percorso.

**FAIL Parte 2**
- La pubblicazione va a buon fine con Post community OFF.
- Non compare alcun messaggio di blocco.
- Il blocco è solo quello di Upload foto (se Upload foto era stato spento per errore).

---

### Parte 3 — Riabilitazione ON

1. Torna in **Centro di Controllo** → TAB **Moderazione**.
2. Sulla card **Post community**, clicca l’interruttore per **riaccenderlo**.
3. Attendi fine salvataggio.
4. Torna in app → **Community** / **Social** → **Live Feed**.
5. Ripeti il flusso: **Pubblica Foto** → **Scegli dalla galleria** → città + didascalia → **Pubblica Foto**.

**PASS Parte 3**
- La pubblicazione torna consentita come in Parte 1.
- Non compare l’alert di post community disabilitati.

**FAIL Parte 3**
- Il blocco resta attivo dopo la riaccensione del flag.
- Compare ancora il messaggio di sospensione.

---

### Esito complessivo T16
- **PASS** se Parte 1 + Parte 2 + Parte 3 sono tutte PASS.
- **FAIL** se anche una sola Parte è FAIL.

---

## 9.2 Piano test T13 — Recensioni utenti (click-by-click)

> **Flag UI:** Centro di Controllo → TAB **Moderazione** → **Recensioni utenti**  
> **Key:** `feature.moderation.reviews`  
> **Consumer:** `ReviewModal` (+ guard submit in `InteractionContext`)  
> **Stato registro:** già **SUPERATO** 2026-07-20 — questo piano serve per **riesecuzione / smoke** o onboarding collaudatori.

### Premesse

- Utente **registrato**.  
- Un POI con azione **Scrivi recensione** / **Modifica recensione** raggiungibile (dettaglio luogo).  
- Spegnere **solo** **Recensioni utenti**; altri flag Moderazione ON.

### A — Baseline ON

1. CC → Moderazione → **Recensioni utenti** = **ON**.  
2. App → apri un POI → apri modale recensione.  

**Atteso:** form stelle / testo compilabile; submit disponibile.

### B — Flag OFF → blocco all’apertura

1. CC → spegni **Recensioni utenti**.  
2. App → riapri la modale recensione sullo stesso POI.  

**Atteso:**  
- **non** compare il form di scrittura;  
- UI di sospensione (titolo/body da template `moderation_reviews_paused`, es. *«Recensioni sospese»*);  
- pulsante Chiudi;  
- tentativo di invio non possibile.

### C — Riabilitazione ON

1. CC → riaccendi **Recensioni utenti**.  
2. App → riapri modale.  

**Atteso:** form di nuovo disponibile; submit funzionante (persistenza review = comportamento dominio, fuori scope flag salvo errore blocco).

### Esito da registrare (se rieseguito)

| Voce | Risultato |
|------|-----------|
| OFF mostra stato sospeso subito | ☐ |
| ON ripristina form | ☐ |
| Nessuna anomalia | ☐ |

---

## 9.3 Chiarimento nomenclatura Moderazione (2026-07-22)

| Concetto | Esiste in UI? | Note |
|----------|---------------|------|
| TAB / macro-sezione **Moderazione** | **Sì** | Contenitore CC |
| Feature Flag unico **«Moderazione Contenuti»** | **No** | Non esiste — eventuale riferimento storico/ambiguo al contenitore o a DOC 27 workflow |
| Recensioni utenti | **Sì** | T13 |
| Upload foto | **Sì** | T14 |
| Segnalazioni utenti | **Sì** | T15 |
| Post community | **Sì** | **T16** (questo è il flag a cui corrisponde il collaudo “moderazione contenuti” se inteso come post/bacheca) |

**Risposta operativa:** il T16 del piano ufficiale **è già** «Post community». Non va “sostituito”: va **eseguito** sul flag reale **Post community** con il collaudo operativo autonomo sopra (stessa procedura consegnata al PO in chat).

---

## 9.4 Collaudo operativo T20 — Programmazioni in pausa (autonomo)

> **Allineamento procedura (2026-07-22):** dopo le decisioni PO del collaudo T20 (§19), **Programmazioni in pausa** è una card nella **grid superiore** del TAB Manutenzione (non più dentro «Programmazione automatica»). Label tendina = **Stato programmato**. Stati riga e storico: §19.

### Obiettivo
Verificare che l’interruttore **Programmazioni in pausa** (card superiore del TAB **Manutenzione**) faccia **ignorare** le finestre orarie salvate senza cancellarle, e che spegnendo la pausa le programmazioni tornino ad applicarsi.

**Flag usato per osservare l’effetto in app:** **Registrazione nuovi utenti** (effetto visibile nella modale Accedi → scheda Registrati).

### Preparazione
1. Accedi con account **Admin All**.
2. Usa una seconda scheda in **navigazione privata** (o logout) per collaudare la registrazione come utente non autenticato.
3. Prepara orologio: ti serviranno data/ora **Inizio** e **Fine** di una finestra che includa **adesso** (es. inizio = 5 minuti fa, fine = tra 30 minuti).

---

### Parte 1 — Crea una programmazione attiva che spegne la Registrazione

1. Menu profilo → **Pannello Admin**.
2. Sidebar → **Utenti & Ruoli** → **Centro di Controllo**.
3. TAB **Manutenzione**.
4. Nella parte alta del TAB vedi la **grid di card**: **Modalità manutenzione**, **Registrazione nuovi utenti**, **Onboarding guidato**, **Programmazioni in pausa**.
5. Sulla card **Registrazione nuovi utenti**, assicurati che l’interruttore sia **ON** (acceso). Se è OFF, cliccalo per accenderlo.  
   Se compare il link per azzerare l’override manuale e preferisci il default, puoi usarlo: l’importante è che **senza programmazione** la registrazione risulti aperta.
6. Sulla card **Programmazioni in pausa** (sempre nella grid superiore), assicurati che sia **OFF** (spento). Se è acceso, cliccalo per spegnerlo.
7. Scorri sotto fino alla sezione a tutta larghezza **Programmazione automatica**.
8. Nel campo etichettato **Feature Flag**, apri il menu a tendina.
9. Seleziona **Registrazione nuovi utenti** (vedrai anche il conteggio finestre accanto al nome).
10. Clicca **Aggiungi finestra**.
11. Compila la riga creata:
    - **Inizio:** data/ora di circa **5 minuti fa** (così la finestra è già attiva).
    - **Fine:** data/ora di circa **30 minuti nel futuro**.
    - **Stato programmato:** seleziona **OFF** (= durante la finestra il Feature Flag sarà OFF).
12. Controlla la colonna **Stato**: deve mostrare **Attiva** (non In attesa / Eseguita).
13. Clicca **Salva programmazioni**.
14. Attendi il messaggio **Programmazioni salvate**.
15. Apri una scheda in navigazione privata (o esci dall’account) e vai sulla Home.
16. Clicca **Accedi** (icona login in header, oppure voce **Accedi o Registrati** nel menu).
17. Nella modale auth, clicca la scheda / pulsante **Registrati**.

**PASS Parte 1**
- Compare lo stato di registrazioni chiuse (titolo tipo *«Registrazioni chiuse»* e messaggio correlato), **oppure** il form di registrazione non è utilizzabile.
- Nella riga programmazione, **Stato** = **Attiva**.
- **Programmazioni in pausa** era OFF.

**FAIL Parte 1**
- Il form **Registrati** è ancora pienamente compilabile/inviabile mentre la finestra OFF è Attiva e la pausa è OFF.
- Dopo **Salva programmazioni** non compare conferma e la finestra non resta salvata.
- Lo **Stato** resta **In attesa** perché l’Inizio è ancora nel futuro (in quel caso ripeti regolando Inizio al passato).

---

### Parte 2 — Attiva Programmazioni in pausa (le finestre restano salvate ma ignorate)

1. Torna in **Centro di Controllo** → TAB **Manutenzione**.
2. Nella **grid superiore**, sulla card **Programmazioni in pausa**, clicca l’interruttore per **accenderlo** (ON).
3. Attendi fine salvataggio.
4. Verifica il testo sotto la card: indica che le finestre restano salvate ma non vengono applicate.
5. Nella sezione **Programmazione automatica** sotto, deve comparire un **banner informativo** che la pausa è attiva (finestre salvate/visibili ma non applicate).
6. Nella tendina **Feature Flag**, riseleziona **Registrazione nuovi utenti** se serve.
7. Controlla che la finestra creata in Parte 1 **sia ancora presente** (non cancellata) e resti nello **storico** (non nascosta).
8. La colonna **Stato** della riga deve mostrare **In pausa** (perché la pausa globale è attiva).
9. Torna alla scheda utente non autenticata (o ricarica la Home in navigazione privata).
10. Apri di nuovo **Accedi** → scheda **Registrati**.

**PASS Parte 2**
- Il form **Registrati** è di nuovo disponibile (registrazione riaperta secondo override/default manuale ON).
- La finestra oraria è **ancora salvata** in Programmazione automatica (non è sparita).
- **Programmazioni in pausa** è ON; banner informativo visibile.

**FAIL Parte 2**
- Le registrazioni restano chiuse anche con la pausa ON (la programmazione non è stata messa in pausa).
- La finestra oraria è stata **eliminata** invece che solo ignorata.
- Compare errore / flag pausa non presente («Flag pausa programmazioni non in cache»).

---

### Parte 3 — Disattiva la pausa → la programmazione torna ad applicarsi; poi cleanup

1. Torna in **Centro di Controllo** → TAB **Manutenzione**.
2. Nella **grid superiore**, sulla card **Programmazioni in pausa**, clicca l’interruttore per **spegnerlo** (OFF).
3. Attendi fine salvataggio; il banner informativo in Programmazione automatica deve sparire.
4. Controlla la riga su **Registrazione nuovi utenti**: se sei ancora dentro Inizio–Fine, **Stato** deve tornare **Attiva**.
5. Nella scheda utente non autenticata, ricarica e apri **Accedi** → **Registrati**.

**PASS Parte 3 (riattivazione)**
- Le registrazioni risultano di nuovo **chiuse** (effetto della programmazione OFF attivo).
- La finestra è ancora presente.

6. **Cleanup obbligatorio a fine test** (ripristino ambiente):
   7. Centro di Controllo → Manutenzione → Programmazione automatica.
   8. Tendina **Feature Flag** → **Registrazione nuovi utenti**.
   9. Clicca **Disattiva programmazioni** (svuota le finestre di questo flag) **oppure** usa il **cestino** su ciascuna riga (eliminazione immediata + salvataggio DB + toast).
   10. Conferma che non restano finestre e che compare eventuale feedback di salvataggio/toast.
   11. Verifica che **Programmazioni in pausa** (grid superiore) sia **OFF**.
   12. Verifica che **Registrazione nuovi utenti** sia **ON**.
   13. In navigazione privata: **Accedi** → **Registrati** deve di nuovo mostrare il form aperto.

**PASS Parte 3 (cleanup)**
- Ambiente ripristinato: nessuna finestra residua su Registrazione; registrazione aperta; pausa OFF.

**FAIL Parte 3**
- Con pausa OFF e finestra ancora nel range orario, Registrati resta aperto (programmazione non riparte).
- Dopo cleanup, Registrati resta chiuso o restano finestre attive non volute.
- Dopo cestino, la riga **ricompare** cambiando Feature Flag (persistenza fallita).

---

### Esito complessivo T20
- **PASS** se Parte 1 + Parte 2 + Parte 3 (riattivazione + cleanup) sono tutte PASS.
- **FAIL** se anche una sola Parte è FAIL.

> Decisioni UX/layout emerse durante il collaudo T20 e rese definitive dal PO: **§19** (non sostituiscono il motore DL-P04).

---

## 10. Domande ancora aperte al Product Owner

| ID | Domanda | Serve per |
|----|---------|-----------|
| Q1 | Confermi che in collaudo crediti eri in Stripe **LOCAL** da Admin? | Chiudere mentalmente AUDIT-04 |
| Q2 | Su Post community: preferisci opzione 1, 2 o 3 di AUDIT-05? | Priorità fix Moderazione |
| Q3 | Per AI Admin: i percorsi A–E coprono ciò che intendevi, o manca qualche pulsante? | Chiudere piano T02/T03 |
| Q4 | Soglia rating: quando avremo shop con recensioni di prova? | Sbloccare T12 |
| Q5 | Priorità fix dopo audit: BUG-01, BUG-02, BUG-03, UX-01, UX-02 — ordine desiderato? | Pianificare implementazione |

---

## 11. Checklist chiusura Audit B

> **Ambito di questa checklist:** solo **Audit B** (collaudo funzionale Centro di Controllo).  
> **Non** include Audit A. **Non** equivale alla chiusura formale dello STEP-3.

### 11.1 Distinzione chiusure (obbligatoria)

| Chiusura | Cosa chiude | Dipende da Audit A? | Criterio |
|----------|-------------|---------------------|----------|
| **Audit B** | Collaudo Feature Flag ↔ comportamento app (questo documento) | **No** | Residui **propri** di Audit B chiusi o esplicitamente rinviati dal PO (vedi checklist sotto) |
| **Audit A** | Audit architetturale Collaboration (DOC 28) — solo analisi | — (iniziativa separata) | Report Audit A senza criticità bloccanti (o con deroga PO) |
| **STEP-3** | Validazione PO formale STEP-3 / Post-3.4 | Sì (insieme ad Audit B chiuso) | **Audit B chiuso** **e** **Audit A concluso** **e** assenza criticità bloccanti → Validazione PO STEP-3 |

**Significato corretto:** Audit B può chiudersi **senza** Audit A. Lo STEP-3 **non** può chiudersi finché non sono conclusi **anche** Audit A e le verifiche residue di Audit B.

### 11.2 Checklist — solo Audit B

- [ ] Tutti i SUPERATI senza regressioni note  
- [x] BUG-01/02/03 risolti (2026-07-20)  
- [x] UX-01/02 risolti (2026-07-20)  
- [x] AUDIT-03 checklist messaggi completata (§14)  
- [x] AUDIT-07 Programmazioni SCH-01/02/03 (§15) — fix non ancora prioritizzati  
- [ ] AUDIT-05 decisione PO registrata  
- [x] T02/T03/T04 rieseguiti dopo fix T02-B — **SUPERATO** (PO 2026-07-21); provider AI **POSTICIPATO**  
- [x] T14/T15 riesaminati dopo fix — **SUPERATO** (PO 2026-07-22)  
- [x] CROSS-P Persistenza Feature Flag — **SUPERATO** (PO 2026-07-22; distinto da T20)  
- [ ] T16 Post community collaudato (procedura operativa autonoma) + decisione AUDIT-05  
- [ ] T20 Programmazioni in pausa collaudato (procedura operativa autonoma)  
- [ ] T12 eseguito o esplicitamente rinviato oltre STEP-3  
- [ ] **Validazione PO chiusura Audit B** (residui T12/T16/T20/AUDIT-05 gestiti) — **indipendente da Audit A**

### 11.3 Fuori checklist Audit B (tracciati altrove)

| Voce | Dove | Nota |
|------|------|------|
| Audit A (DOC 28) | Masterplan Post-3.4 / `03_PROJECT_STATUS` | Non è prerequisito di Audit B |
| Validazione PO STEP-3 | Masterplan STEP-3 | Richiede Audit B **chiuso** + Audit A **concluso** |
| Collaudo provider AI (API Key) | §2.1-bis / §2.2 **POSTICIPATO** | Non blocca chiusura Audit B gating; collaudo finale separato |

---

## 12. Cronologia aggiornamenti documento

| Data | Autore | Modifica |
|------|--------|----------|
| 2026-07-22 | PO + AI | **§19 Decisioni PO definitive T20** (Programmazioni UX/layout); procedura §9.4 allineata al nuovo layout; guida §8 aggiornata con nota storica |
| 2026-07-22 | PO + AI | DOC 30 / Audit B / Masterplan **APPROVATI** PO; T16+T20 procedure click-by-click autonome (senza rimandi a capitoli); T14/T15/CROSS-P SUPERATI |
| 2026-07-22 | PO + AI | T14/T15 **SUPERATI**; CROSS-P Persistenza **SUPERATO**; chiarimento T16 = Post community; piano smoke T13 |
| 2026-07-21 | PO | Collaudo runtime gating AI **COMPLETATO** (T02/T03/T04 SUPERATI); provider AI **POSTICIPATO** al collaudo finale API Key |
| 2026-07-20 | PO + AI | Creazione SoT Audit B: 12 SUPERATI, bug, UX, audit, guida programmazioni, piani AI click-by-click |
| 2026-07-21 | AI | T02 FALLITO (PO): API Key prima di FF; fix T02-B `withRetry` + UI gate editor città |
| 2026-07-20 | AI | Fix UX-01/UX-02/BUG-02/BUG-03; audit forense §13 (AI Admin, messaggi, upload, segnalazioni) |
| 2026-07-20 | AI | BUG-01 fix: `assertAiRuntimeAvailable` in `supabaseProvider.generate` + sync contesto ruolo |
| 2026-07-20 | AI | AUDIT-03 completo §14; audit Programmazioni SCH-01/02/03 §15 |

---

## 13. Audit forense sul codice (2026-07-20)

Regola: ogni conclusione segue la pipeline UI → Componente → Hook → Service → Guard → Feature Flag → Esito. Vietate ipotesi.

### 13.1 AI Admin All / AI Admin Limited — consumer reali

**Unico punto che legge i flag ruolo AI:** `getAiRuntimeStatus` in `src/services/ai/aiRuntimeStatus.ts` → `aiFlagKeyForRole` → `evaluateCachedFeatureFlag(AI_ADMIN_ALL | AI_ADMIN_LIMITED | AI_USERS)`.

**Call site dimostrati di `getAiRuntimeStatus` (grep codebase):**

| File | Passa `userRole`? | Flag Admin valutato se ruolo admin? |
|------|-------------------|-------------------------------------|
| `hooks/useAiGeneration.ts` | Sì | Sì (Magic Planner generate) |
| `components/aiPlanner/AiPlannerForm.tsx` | Sì (post-fix) | Sì (banner) |
| `components/aiPlanner/AiPlannerTimeline.tsx` | Sì (post-fix) | Sì |
| `components/modals/RoadbookModal.tsx` | Sì (post-fix) | Sì |
| `hooks/ui/useHeroLogic.ts` | Sì (post-fix) | Sì (Hero chat) |

**`aiGateway` / `generateCitySection` / `generateSingleField` / `suggestCityItems`:** **nessuna** chiamata a `getAiRuntimeStatus` (grep `src/services/ai`).

#### Consumer Admin **senza** Feature Flag (BUG-01)

| Percorso click-by-click | UI | Componente | Funzione | Service | Guard FF | Esito |
|-------------------------|----|------------|----------|---------|----------|-------|
| Admin → Città → Editor → TAB Generali → Rigenera → conferma | `AdminCityEditor` | `TabGeneral.tsx` | `executeRegeneration` | `generateCitySection` → `aiGateway` | **NESSUN controllo Feature Flag** | **BUG** — processo parte; fallimento solo lato Edge/API |
| Generali → gen singola (website/coords/subtitle/hierarchy) | idem | `TabGeneral.tsx` | `handleSingleGen` | `generateSingleField` → `aiGateway` | **NESSUN** | **BUG** |
| TAB Media → Rigenera | idem | `TabMedia.tsx` | handler regenerate | `generateCitySection` | **NESSUN** | **BUG** |
| TAB Cultura → Rigenera | idem | `TabCulture.tsx` | regenerate + `generateHistoricalPortrait` | `services/ai` + `aiVision` | **NESSUN** | **BUG** |
| TAB Valutazioni → Rigenera | idem | `TabRatings.tsx` | regenerate | `generateCitySection` | **NESSUN** | **BUG** |
| TAB Servizi → suggest AI | idem | `ServiceGeneric/Operators/Guides/Events.tsx` | suggest handlers | `suggestCityItems` | **NESSUN** | **BUG** |
| Elenco città → Magic Add AI | `CitiesListTab` / `CitiesManager` | `CityGeneratorModal` → `handleMagicAdd` | `useCityGenerator.executeMagicAdd` → `useAiMagicCity` | `generateCitySection` / `suggestCityItems` / vision | **NESSUN** | **BUG** |
| Completa città AI | `CitiesListTab` | `handleCompleteCity` | `executeCompleteCity` | moduli AI admin | **NESSUN** | **BUG** |
| Admin AI assistant / field helper / image input / SafeArt / itinerary editor / comms AiChat | rispettivi pannelli | `AdminAiAssistant`, `AiFieldHelper`, `AdminImageInput`, `SafeArtPanel`, `AdminItineraryEditor`, `AiChatAssistant` | submit/generate | `aiGateway.generateLegacy` | **NESSUN** | **BUG** |

**Legacy duplicate paths (stesso gap):** `EditorGeneral.tsx`, `EditorMedia.tsx`, `EditorCulture.tsx`, `EditorRatings.tsx`, `CulturePatron.tsx` — chiamano gli stessi generator senza FF. `AdminCityEditor` monta i `Tab*` (percorso UI attivo dimostrato in `AdminCityEditor.tsx`).

#### Consumer Admin **con** Feature Flag (quando ruolo passato)

| Percorso | Pipeline | Punto FF | Timing |
|----------|----------|----------|--------|
| Admin apre Magic Planner → Genera | UI `AiItineraryModal` → `AiPlannerForm` / `useAiGeneration.generatePlan` → `getAiRuntimeStatus({userRole})` | `aiRuntimeStatus.ts` L69–78 | Banner in alto (post UX-01); submit anche gated in `useAiGeneration` **prima** della chiamata AI |
| Admin Hero chat | `HeroSection` → `useHeroLogic.handleAiSubmit` → `getAiRuntimeStatus` | idem | Prima di `generateChatReply` |
| Admin Roadbook AI | `RoadbookModal` → banner + `handleGenerateAiRoadbook` early return se `aiBlocked` | idem | Prima di `generateRoadbook` |

**Conclusione dimostrata:** per T02/T03 il sintomo “troppo tardi / API Key” sui path editor città è dovuto a **assenza totale** del controllo Feature Flag su quei path, non a un controllo collocato dopo la chiamata AI.

**Punto esatto dove va inserito il check (fix BUG-01, non ancora fatto):**
1. Preferibile: inizio di `getAiRuntimeStatus` invocato da ogni entry Admin **oppure** guard centrale in `aiGateway.generateLegacy` / `generateText` con contesto ruolo;  
2. Minimo per Percorso A: prima riga di `TabGeneral.executeRegeneration` (e analoghi) → `if (!isAiRuntimeAvailable({userRole})) return`.

---

### 13.2 Messaggi Feature Flag — tabella completa

| Flag key | Label UI | messageKey catalog | Consumer messaggio utente | Legge CC (`useSystemMessage` / catalog runtime)? | Hardcoded? | File · funzione |
|----------|----------|--------------------|---------------------------|--------------------------------------------------|------------|-----------------|
| `feature.ai.users` | AI Utente | `ai_disabled_user` | Magic Planner / Hero / Roadbook via `getAiRuntimeStatus` | **Parziale:** `findMessageCatalogByKey` → `defaultBody` catalogo (non template DB live sync) | Fallback string se catalog vuoto | `aiRuntimeStatus.ts` · `getAiRuntimeStatus` |
| `feature.ai.admin_all` | AI Admin All | `ai_disabled_admin` | Solo se path chiama `getAiRuntimeStatus` con ruolo admin_all | Parziale (come sopra) | Fallback | idem |
| `feature.ai.admin_limited` | AI Admin Limited | `ai_disabled_admin_limited` | Solo path con `getAiRuntimeStatus` + admin_limited | Parziale | Fallback | idem |
| `feature.ai.emergency` | Stop emergenza AI | `ai_emergency_notice` | `getAiRuntimeStatus` se `ccEmergency.enabled` | Parziale catalog defaultBody | ACC `ai_emergency_stop` ha messaggio separato hardcoded manutenzione/emergenza ACC | `aiRuntimeStatus.ts` |
| `feature.economy.credit_purchase` | Acquisto crediti | `credits_purchase_paused` | `BuyCreditsModal`, `QuotaExceededModal` | **Sì** `useSystemMessage` | Solo fallback UI | `BuyCreditsModal.tsx` / `QuotaExceededModal.tsx` |
| `feature.economy.subscriptions` | Abbonamenti | `subscriptions_paused` | `UserUpgradeModal` | **Sì** | Fallback | `UserUpgradeModal.tsx` |
| `feature.comms.admin_partner` | Chat Admin↔Partner | `comms_partner_chat_disabled` | `PartnerDetailModal` | **Sì** | Fallback | `PartnerDetailModal.tsx` |
| `feature.comms.user_sponsor` | Chat Utente↔Sponsor | `comms_user_sponsor_disabled` | `UserMessagesTab` | **Sì** | Fallback | `UserMessagesTab.tsx` |
| `feature.comms.notifications` | Notifiche | *(nessun messageKey in fallback mapper)* | `UserNotificationsTab` / Header | **No** template CC | **Sì** copy UI “Notifiche sospese” | `UserNotificationsTab.tsx` |
| `feature.sponsor.applications` | Candidature | `sponsor_applications_paused` | `SponsorModal` | **Sì** | Fallback | `SponsorModal.tsx` |
| `feature.sponsor.shop_public` | Shop pubblici | *(null)* | hide/disable navigazione | **No** messaggio dedicato | N/A (nasconde UI) | `CityHeader` / `CityGuide` / `PoiDetailModal` / `useAppRouter` |
| `threshold.sponsor_rating_alert_stars` | Soglia rating | *(number)* | Admin sponsor table | N/A | N/A | `useSponsorLogic.ts` |
| `feature.moderation.reviews` | Recensioni | `moderation_reviews_paused` | `ReviewModal` | **Sì** | Fallback | `ReviewModal.tsx` |
| `feature.moderation.photos` | Upload foto | *(null in mapper)* | Galleria / Live Feed / `uploadCommunityPhoto` | **No** | **Sì** “Il caricamento foto è temporaneamente disabilitato.” | `CityGallery`, `LiveFeedTab`, `useCityGallery`, `photoService` |
| `feature.moderation.suggestions` | Segnalazioni | *(null)* | `SuggestionModal` | **No** | **Sì** “Le segnalazioni sono temporaneamente disabilitate.” | `SuggestionModal.tsx`, `suggestionService.ts` |
| `feature.moderation.community_posts` | Post community | *(null)* | `LiveFeedTab` | **No** | **Sì** alert post disabilitati | `LiveFeedTab.tsx` |
| `feature.platform.maintenance` | Manutenzione | `maintenance_ticker_message` | `NewsTicker` | **Sì** | Fallback | `NewsTicker.tsx` |
| `feature.platform.registration` | Registrazione | `registration_closed` | `AuthModal` | **Sì** | Fallback | `AuthModal.tsx` |
| `feature.platform.onboarding` | Onboarding | *(null)* | Header / MainLayout gate | **No** messaggio | N/A (non avvia tour) | `Header.tsx`, `MainLayout.tsx` |
| `feature.platform.schedules_paused` | Programmazioni in pausa | *(null)* | engine `evaluateFeatureFlag` | N/A | N/A | `platformFlagCache.ts` |

**Nota ACC legacy:** `ai_enabled` / `ai_emergency_stop` in `global_settings` restano path separati in `getAiRuntimeStatus` con messaggi non legati alle card CC.

---

### 13.3 Upload foto — tutti i consumer `uploadCommunityPhoto`

| Consumer | UI entry | Guard `MODERATION_PHOTOS` (pre-fix) | Guard (post-fix) |
|----------|----------|--------------------------------------|-------------------|
| Galleria città | `CityGallery` → `useCityGallery.uploadPhoto` | Sì a conferma; fail-open; **no** early su “+” | Early su Add/FileSelect + fail-closed + service |
| Live Feed | `LiveFeedTab` Scatta → confirm | **No** (solo `COMMUNITY_POSTS`) | PHOTOS + COMMUNITY_POSTS su click e confirm + service |
| Admin moderazione foto | `usePhotoModeration` upload manuale | **No** | Sì via `uploadCommunityPhoto` |

**Altri upload immagine NON passano da `uploadCommunityPhoto`** (fuori scope flag “Upload foto” per definizione help CC — asset admin/profile/sponsor/workspace):

| Area | File | Note |
|------|------|------|
| Header/media admin | `AdminHeaderManager.tsx` | storage pubblico / settings |
| Admin image field | `AdminImageInput.tsx` | |
| Sponsor cover | `SponsorForm.tsx` | |
| Shop prodotti | `BusinessShopManager.tsx` | |
| Profile avatar | `ProfileIdentityFields.tsx` | |
| Workspace allegati | `AllegatiCategoryPanel.tsx` | |
| Onboarding BG | `OnboardingVisualEditor.tsx` | |
| Comms logo | `CommsComposer.tsx` | |
| AI background social | `AiBackgroundPanel.tsx` | |

**Spiegazione sintomo PO “Community sì / Galleria no”:** con il codice **pre-fix**, spegnendo **solo** Upload foto (`MODERATION_PHOTOS`) la pipeline Live Feed **non** valutava quel flag (valutava `COMMUNITY_POSTS`). La Galleria invece lo valutava a conferma. Il sintomo osservato dal PO (Community bloccata, Galleria no) **non coincide** con lo spegnimento isolato di Upload foto sul codice pre-fix; coincide con spegnimento di **Post community** e/o con UX Galleria ancora compilabile fino a conferma. Post-fix entrambi i path utente community sono gated su PHOTOS.

---

### 13.4 Segnalazioni — perché il flag non bloccava

**Pipeline pre-fix (dimostrata):**

1. UI apre `SuggestionModal` (CityDetail / Services / FeatureModals) — **nessun** check flag  
2. Utente compila form completo  
3. `handleSubmit` → `evaluateCachedFeatureFlag(MODERATION_SUGGESTIONS)`  
4. Pattern `if (suggestionsFlag && !suggestionsFlag.enabled)` (fail-open se null)  
5. Se passa → `addSuggestion` in `suggestionService.ts` → insert Supabase — **NESSUN** Feature Flag  

**Esito:** modulo **utilizzabile**; al massimo errore a fine submit. Diverso da Recensioni (`ReviewModal` usa `useFeatureFlag` e mostra stato sospeso **prima** del form).

**Pipeline post-fix:**

UI → `SuggestionModal` → `useFeatureFlag(MODERATION_SUGGESTIONS)` → se OFF UI bloccata → (submit) fail-closed → `addSuggestion` guard service → insert o throw.

---

### 13.5 Decisioni PO successive

- Fix UX-01/02 + BUG-02/03 eseguiti; BUG-01 fixato via `assertAiRuntimeAvailable` in gateway.
- AUDIT-03 esteso §14; Programmazioni SCH-01/02/03 in §15 (nessun fix scheduler ancora).

---

## 14. AUDIT-03 — Messaggi di TUTTI i Feature Flag (2026-07-20)

Pipeline usata: UI → Component → Hook → Guard → Source of Truth → messaggio.

**Due canali SoT messaggi dimostrati:**

| Canale | Persistenza | Lettura consumer tipica |
|--------|-------------|-------------------------|
| A — System Message Template | DB `system_messages` via `MessageTemplateEditor` → `saveAuditedSystemMessage` → `communicationService` | `useSystemMessage(key)` → `getText().title/body` |
| B — Catalogo statico `PLATFORM_*_MESSAGE_CATALOG` | Costanti TS in `platformFeatureFlags.ts` | `findMessageCatalogByKey` → **solo `defaultBody`** (usato da `getAiRuntimeStatus.catalogBody`) |

**Regola:** se il CC mostra `MessageTemplateEditor` ma il consumer usa solo B, le modifiche CC **non** arrivano all’utente runtime.

### 14.1 Tabella per flag

| # | Flag key | Label | Messaggio utente quando OFF (testo dimostrato) | Origine | Modificabile in CC? | Consumer SoT corretta? |
|---|----------|-------|-----------------------------------------------|---------|---------------------|------------------------|
| 1 | `feature.ai.users` | AI Utente | Catalog default: «I servizi AI per gli utenti sono temporaneamente disattivati.» (via `AiRuntimeBanner` ← `getAiRuntimeStatus`) | **B** `findMessageCatalogByKey(ai_disabled_user).defaultBody` — **non** DB live | Editor sì (`MessageTemplateEditor`) | **NO** — consumer non usa `useSystemMessage` |
| 2 | `feature.ai.admin_all` | AI Admin All | Catalog default: «Gli strumenti AI per Admin All sono temporaneamente disattivati.» | **B** `ai_disabled_admin` defaultBody | Editor sì | **NO** — stessa pipeline AI |
| 3 | `feature.ai.admin_limited` | AI Admin Limited | Catalog default: «Gli strumenti AI per Admin Limited sono temporaneamente disattivati.» | **B** `ai_disabled_admin_limited` | Editor sì | **NO** |
| 4 | `feature.ai.emergency` | Stop emergenza AI | Catalog default: «I servizi AI sono sospesi per emergenza operativa.» (se `ccEmergency.enabled`) | **B** via `ccEmergency.messageKey` / `AI_EMERGENCY_NOTICE` | Editor sì | **NO** (stesso `catalogBody`) |
| 4b | *(ACC legacy)* `ai_emergency_stop` / `ai_enabled` | AI Control Center settings | Hardcoded in `getAiRuntimeStatus`: emergenza ACC / «…disattivati per manutenzione.» | **Hardcoded** stringhe in `aiRuntimeStatus.ts` | No (non card CC messaggio) | N/A — SoT ACC settings |
| 5 | `feature.economy.credit_purchase` | Acquisto crediti | Title/body da template; fallback «Acquisto crediti sospeso» / «…non disponibile.» | **A** `useSystemMessage(credits_purchase_paused)` | Sì | **SÌ** |
| 6 | `feature.economy.subscriptions` | Abbonamenti | Template + fallback «Abbonamenti sospesi» | **A** `subscriptions_paused` | Sì | **SÌ** |
| 7 | `feature.comms.admin_partner` | Chat Admin↔Partner | Template + fallback «Chat non disponibile» / body partner | **A** `comms_partner_chat_disabled` | Sì | **SÌ** (`PartnerDetailModal`) |
| 8 | `feature.comms.user_sponsor` | Chat Utente↔Sponsor | Template body; fallback «…non è al momento disponibile.» | **A** `comms_user_sponsor_disabled` | Sì | **SÌ** (`UserMessagesTab`) |
| 9 | `feature.comms.notifications` | Notifiche in-app | «Notifiche sospese» + «Il centro notifiche in-app è temporaneamente non disponibile.» | **Hardcoded** in `UserNotificationsTab.tsx` | **No** (`messageKey: null` nel mapper → nessun editor) | **NO** — nessun template |
| 10 | `feature.sponsor.applications` | Candidature | Template + fallback candidature sospese | **A** `sponsor_applications_paused` | Sì | **SÌ** (`SponsorModal`) |
| 11 | `feature.sponsor.shop_public` | Shop pubblici | **Nessun messaggio** — UI nascosta/disabilitata | N/A | No (`messageKey: null`) | N/A (gate silenzioso) |
| 12 | `threshold.sponsor_rating_alert_stars` | Soglia rating | **Nessun messaggio OFF** — soglia numerica Admin | N/A | No | N/A |
| 13 | `feature.moderation.reviews` | Recensioni | Template + fallback «Recensioni sospese» | **A** `moderation_reviews_paused` | Sì | **SÌ** (`ReviewModal`) |
| 14 | `feature.moderation.photos` | Upload foto | «Il caricamento foto è temporaneamente disabilitato.» | **Hardcoded** (`CityGallery`, `LiveFeedTab`, `useCityGallery`, `photoService`) | **No** (`messageKey: null`) | **NO** |
| 15 | `feature.moderation.suggestions` | Segnalazioni | «Segnalazioni sospese» / «Le segnalazioni sono temporaneamente disabilitate.» | **Hardcoded** (`SuggestionModal`, `suggestionService`) | **No** | **NO** |
| 16 | `feature.moderation.community_posts` | Post community | «I post community sono temporaneamente disabilitati.» | **Hardcoded** (`LiveFeedTab` via `getLiveFeedUploadBlockReason`) | **No** | **NO** |
| 17 | `feature.platform.maintenance` | Manutenzione | Title/body template News Bar | **A** `maintenance_ticker_message` | Sì (card Manutenzione) | **SÌ** (`NewsTicker`) |
| 18 | `feature.platform.registration` | Registrazione | Template + fallback «Registrazioni chiuse» | **A** `registration_closed` | Sì (Info Globali / card) | **SÌ** (`AuthModal`) |
| 19 | `feature.platform.onboarding` | Onboarding | **Nessun messaggio** — tour non parte / voce menu gated | N/A | No (`messageKey: null`) | N/A |
| 20 | `feature.platform.schedules_paused` | Programmazioni in pausa | **Nessun messaggio utente app** — effetto engine | N/A | No | N/A |

### 14.2 Hardcoded — dettaglio (proposta correzione)

| File | Componente | Percorso UI | Motivo (dimostrato) | Proposta |
|------|------------|-------------|---------------------|----------|
| `aiRuntimeStatus.ts` | `getAiRuntimeStatus` → `AiRuntimeBanner` / assert | Magic Planner, Roadbook, Hero, gateway AI | Usa `defaultBody` catalogo, non DB | Far leggere template via cache sync/`getSystemMessages` o allineare consumer a `useSystemMessage` dove React |
| `aiRuntimeStatus.ts` L90–96 | ACC `ai_enabled` | Qualsiasi AI | Stringa fissa manutenzione | Collegare a template dedicato o ACC message SoT |
| `UserNotificationsTab.tsx` L102–104 | Centro Notifiche | Dashboard → Notifiche | `messageKey: null` | Aggiungere template + `useSystemMessage` |
| `CityGallery.tsx` / `useCityGallery.ts` / `photoService.ts` / `LiveFeedTab.tsx` | Galleria / Live Feed | Città → Galleria; Community → Live | `messageKey: null` | Template `moderation_photos_paused` + lettura SoT |
| `SuggestionModal.tsx` / `suggestionService.ts` | Segnalazioni | Città → Segnala | `messageKey: null` | Template `moderation_suggestions_paused` |
| `LiveFeedTab.tsx` | Post community alert | Community → Scatta | `messageKey: null` | Template `moderation_community_posts_paused` |

### 14.3 Pipeline AI messaggio (dimostrata) — spiega AUDIT-03 PO + SCH-02

```
UI Magic Planner
→ AiPlannerForm / useAiGeneration
→ getAiRuntimeStatus({ userRole })
→ aiFlagKeyForRole(role)  // admin_all → feature.ai.admin_all
→ evaluateCachedFeatureFlag(roleKey)
→ catalogBody(roleFlag.messageKey)  // SOLO defaultBody statico
→ AiRuntimeBanner.message
```

---

## 15. Audit Programmazioni — SCH-01 / SCH-02 / SCH-03 (2026-07-20)

Pipeline: UI SchedulePanel → onSaveSchedules → mutateFlag({schedules}) → refreshFlags → setPlatformFlagCache → evaluateFeatureFlag(getActiveScheduleValue) → consumer.

### SCH-01 — Blocco già alle 15:21 con finestra 15:22–15:23

**Valutazione orario (codice):**

- Persistenza: `fromLocalInputValue` → `new Date(local).toISOString()` (`SchedulePanel.tsx` L28–32).
- Runtime: `getActiveScheduleValue`: `nowMs >= startMs && nowMs < endMs` (`evaluateFeatureFlag.ts` L41–46).
- `now = new Date()` al momento della valutazione (`evaluateCachedFeatureFlag` / `evaluateFeatureFlag`).
- **Nessun** arrotondamento; **nessun** anticipo intenzionale; fine esclusiva (`< endMs`).

**Timezone:** input `datetime-local` (locale browser) convertito in ISO UTC; confronto in epoch ms. Coerente se client clock = orologio usato dal PO.

**Causa dimostrata del sintomo osservato (con account Admin + messaggio Admin All):**  
NON DIMOSTRABILE che lo START sia stato anticipato dal motore schedule.  
DIMOSTRABILE invece che un Admin **non** valuta `feature.ai.users`: valuta `feature.ai.admin_all` (`aiRuntimeStatus.ts` `aiFlagKeyForRole`). Il messaggio esatto «Gli strumenti AI per Admin All sono temporaneamente disattivati.» è il `defaultBody` di `ai_disabled_admin` — quindi il flag **effettivamente** OFF al momento del blocco era **AI Admin All** (manual override e/o schedule su quel key), non «solo AI Utente».

**Esito:** anticipo schedule **non confermato** dal codice. Sintomo allineato a **SCH-02** (ruolo/flag sbagliato rispetto all’intento PO) e/o stato preesistente di `feature.ai.admin_all` OFF.  
Orari esatti salvati in DB per quella sessione: **NON DIMOSTRABILE CON IL CODICE ATTUALE** (serve dump `schedules` della riga flag).

**File:** `SchedulePanel.tsx`, `evaluateFeatureFlag.ts`, `aiRuntimeStatus.ts`, `AiPlannerForm.tsx`.

---

### SCH-02 — Spento solo «AI Utente» ma messaggio Admin All (test da Admin)

**Pipeline dimostrata:**

1. Account Admin → `user.role === 'admin_all'` (o limited).
2. `setAiRuntimeEvaluationContext` / `getAiRuntimeStatus({userRole})`.
3. `aiFlagKeyForRole('admin_all')` → `feature.ai.admin_all`.
4. Se quel flag `enabled === false` → `catalogBody('ai_disabled_admin')` → **«Gli strumenti AI per Admin All sono temporaneamente disattivati.»**

**Flag realmente valutato:** `feature.ai.admin_all` (non `feature.ai.users`).  
**Messaggio:** catalogo statico Admin All (non il template AI Utente).  
**Autorizzazione:** comportamento **previsto** dal codice — Admin non è gated da AI Utente.  
**Testo:** corretto per il flag valutato; **scorretto rispetto all’aspettativa PO** «ho spento solo AI Utente».

**Esito:** **bug di prodotto/UX di collaudo**, non mismatch catalogo tra due template sullo stesso flag. Se AI Utente era l’unico OFF e Admin All era ON, Magic Planner Admin **non** dovrebbe bloccarsi — se si è bloccato, Admin All era OFF (altro meccanismo).

**File:** `aiRuntimeStatus.ts`, `platformFeatureFlags.ts` (defaultBody), `AiRuntimeBanner.tsx`.  
**Percorso UI:** Centro Controllo → AI → toggle; App → Magic Planner.

---

### SCH-03 — Fine alle 15:23, ancora bloccato alle 15:27

**Refresh scheduler:**

- `PlatformControlProvider.refreshFlags`: solo **mount** + dopo `mutateFlag` (`PlatformControlContext.tsx` L74–77, L122).
- **Nessun** `setInterval` / poll dimostrato.
- Per **scadenza temporale** di una finestra già in cache: **non** serve refresh DB — `evaluateFeatureFlag(..., new Date())` ricalcola `getActiveScheduleValue` a ogni chiamata; scaduta la finestra, `scheduled === null` → `manual ?? default`.

**Se alle 15:27 resta bloccato, cause dimostrabili dal codice (una o più):**

1. `manualOverride === false` ancora attivo sul flag ruolo (toggle manuale, non solo schedule).
2. Flag valutato ancora OFF (es. `feature.ai.admin_all`) per motivo diverso dalla finestra AI Utente.
3. ACC `ai_enabled` / `ai_emergency_stop` / `feature.ai.emergency`.
4. Cache flag **senza** la schedule aggiornata (salvataggio non andato a buon fine / altra sessione) — allora non è «sticky schedule» ma stato diverso.

**Invalidazione cache schedule su scadenza:** non esiste timer dedicato; non serve se i dati schedule in memoria sono corretti.

**Esito:** sticky post-END **non** spiegato da mancanza di poll (il tempo avanza comunque). Sticky spiegabile da **override manuale** o **altro flag/ACC ancora OFF**. Quale dei due nella sessione PO: **NON DIMOSTRABILE CON IL CODICE ATTUALE** senza snapshot flag cache / DB a 15:27.

**File:** `PlatformControlContext.tsx`, `platformFlagCache.ts`, `evaluateFeatureFlag.ts`, `aiRuntimeStatus.ts`.

---

## 16. AUDIT Scheduler approfondito + backlog SCH-STATUS-UI (2026-07-20)

> **Regola:** nessun fix Scheduler in questa sessione. Solo diagnosi + registrazione backlog DL-P14.

### 16.1 Pipeline dimostrata

```
SchedulePanel (datetime-local)
  → fromLocalInputValue → Date(local) → toISOString() (UTC)
  → mutateFlag({ schedules }) → DB
  → refreshFlags → setPlatformFlagCache(flags)
Consumer / useFeatureFlag / evaluateCachedFeatureFlag
  → evaluateFeatureFlag(flag, ctx, new Date(), { schedulesSuspended })
  → getActiveScheduleValue: nowMs >= startMs && nowMs < endMs  (fine esclusiva)
  → effective = manual_override ?? scheduled ?? default
```

### 16.2 Punti che influenzano attivazione/disattivazione (checklist forense)

| Area | File | Comportamento dimostrato | Impatto su “non parte / non finisce” |
|------|------|--------------------------|-------------------------------------|
| **Evaluation** | `evaluateFeatureFlag.ts` | Finestra attiva solo se `now ∈ [start, end)` | A `end` esatto la schedule **cessa** (corretto). Nessun anticipo. |
| **Override** | stesso | `manual != null` **vince sempre** sulla schedule | Se toggle lasciato OFF a mano, a fine finestra resta OFF (SCH-03). |
| **Pausa globale** | `platformFlagCache.isSchedulesSuspendedFromCache` + Context | Legge solo `manualOverride`/`default` del flag pausa — **non** valuta schedule sul flag pausa | Coerente (`supports_schedule: false` sul pausa). |
| **Refresh DB** | `PlatformControlContext` | Solo mount + post-mutate | Altra sessione/tab che salva schedule: questa sessione **non** vede finché non refresh/reload. |
| **Polling** | — | **Assente** | Non blocca la scadenza se i dati sono già in cache: `new Date()` a ogni eval. |
| **Re-render UI** | `useFeatureFlag` | Rivaluta a ogni render del componente | Se l’UI resta idle senza re-render al bordo orario, l’utente può vedere stato “vecchio” finché non interagisce/naviga. **Candidato causa “non parte/non finisce in UI”.** |
| **Timezone** | `SchedulePanel` `fromLocalInputValue` / `toLocalInputValue` | Input locale browser → ISO UTC; display di nuovo locale | Coerente su un solo client. Secondi **non** editabili in UI (`datetime-local` senza secondi) → arrotondamento al minuto. |
| **Cache fallback** | `PLATFORM_FEATURE_FLAG_FALLBACKS` | Se fetch fallisce, schedule DB assenti | Programmazioni “spariscono” fino a fetch OK. |
| **Overlapping** | DOC 30 / engine | Prima finestra in array vince | Ordine lista ≠ ordine cronologico. |
| **Card flag vs schedule** | `FeatureFlagBooleanRow` | Mostra `evaluation.source` (default/schedule/override) | Admin può confondere “spento da schedule” vs “override”. |

### 16.3 Backlog obbligatorio — SCH-STATUS-UI (DL-P14)

| Campo | Valore |
|-------|--------|
| **ID** | SCH-STATUS-UI |
| **Richiesta PO** | Ogni riga della tabella programmazioni mostra stato: In attesa · Attiva · Eseguita · In pausa · Disabilitata · Errore; auto-aggiornato da runtime; storico sempre visibile |
| **Quando** | Durante implementazione fix/evoluzione Scheduler (dopo chiusura SCH-AUDIT-02) |
| **Dove tracciato** | DOC 30 DL-P14 · WF-02 Post-3.4 backlog · questa §16 |
| **Stato** | **Implementato** (label 2026-07-22: In attesa / Eseguita; storico sempre visibile) |

### 16.4 Esito audit (sintesi)

Cause **dimostrabili** di scostamento percepito rispetto all’orologio:

1. Override manuale che maschera start/end schedule.  
2. Assenza di timer/re-render al confine della finestra (UI stale).  
3. Fine esclusiva (`< endMs`) vs aspettativa “fino a include minuto di fine”.  
4. Cache non aggiornata dopo salvataggio da altra sessione.  
5. Test AI schedule con account Admin (valuta altro flag) — già SCH-02.

**Nessun fix applicato** in questa sessione.

---

## 17. Decisione PO DL-P13 — Message Template unica SoT

**Decisione definitiva:** Centro di Controllo → Message Template → **Database** = unica Source of Truth dei messaggi utente. Catalogo TS non accettato come SoT. Hardcoded solo log/debug/commenti/errori tecnici (+ bootstrap).

**Stato:** implementazione MSG-SOT autorizzata (sessione 2026-07-20).

---

## 18. AUDIT-08 — Filone Scheduler (SCH-AUDIT-02)

| Campo | Valore |
|-------|--------|
| **Motivazione** | PO: programmazione non sempre parte/termina all’orario percepito; comportamento non ancora soddisfacente (§15 SCH-01/02/03). |
| **Obiettivi** | Diagnosi completa runtime/evaluation/cache/refresh/polling/override/timezone/scheduling; poi fix start/end esatti + coerenza senza interventi manuali; eliminare sticky incoerente. |
| **Punti da verificare** | Come §16.2 + re-render al confine · clear override su save schedule · status UI |
| **Stato audit** | Diagnosi §16 **completata**; fix implementati: timer al prossimo boundary (no poll 15s) + clear override su save + SCH-STATUS-UI |
| **Risultato atteso** | Start/end all’orario salvato; UI aggiornata senza click manuale; override non maschera silenziosamente la finestra; ogni riga mostra stato runtime |
| **Backlog SCH-STATUS-UI** | In attesa · Attiva · Eseguita · In pausa · Disabilitata · Errore (storico sempre visibile) |

---

## 19. Decisioni PO definitive — collaudo T20 / Programmazioni (2026-07-22)

Registro storico delle decisioni del Product Owner emerse durante il collaudo T20 (Programmazioni).  
**Non** modificano il motore `evaluateFeatureFlag` né la priorità DL-P04 (manual → schedule → default).  
Sono vincolanti per UI, persistenza cestino e layout TAB Manutenzione.

| Campo | Valore |
|-------|--------|
| **Data** | 2026-07-22 |
| **Contesto** | Collaudo T20 + rifiniture UX Programmazioni (Post-3.4) |
| **Ambito** | Solo UX / layout / persistenza cestino / stati riga UI |
| **Fuori ambito** | DL-P04 · priorità Default/Override/Schedule · engine runtime Feature Flag |

### 19.1 Label tendina — «Programmazione» (ex «Stato programmato» / «Valore»)

| Prima (cronologia) | Decisione PO definitiva |
|--------------------|-------------------------|
| Label **«Valore»** poi **«Stato programmato»** (ON/OFF = valore del Feature Flag in finestra) | Semantica **cambiata** (2026-07-22): ON/OFF = stato della **programmazione di fermo**, non del Feature Flag |

### 19.2 Significato ON / OFF (programmazione di fermo — definitivo)

| Opzione | Significato definitivo PO |
|---------|---------------------------|
| **ON** | Questa programmazione è **attiva**. All’orario previsto la funzionalità viene **temporaneamente fermata**. |
| **OFF** | Questa programmazione è **disattivata**. Resta salvata ma **non viene eseguita** finché non la riattivi. |

Runtime (invariato DL-P04): programmazione ON in finestra → strato schedule applica fermo (`value: false`); programmazione OFF → voce ignorata (`enabled: false`).

### 19.3 Stati UI delle programmazioni

Stati richiesti e ufficiali per la colonna **Stato** di ogni riga:

1. **In attesa** — inizio nel futuro  
2. **Attiva** — istante corrente dentro la finestra (fine esclusiva, come engine)  
3. **In pausa** — pausa globale `feature.platform.schedules_paused` attiva  
4. **Eseguita** — fine già trascorsa (la riga resta visibile)  
5. **Errore** — timestamp invalidi o inizio ≥ fine  

> **Cronologia naming:** in precedenza (SCH-STATUS-UI / DL-P14 2026-07-20) i label usati erano *Programmata* / *Terminata*. Dal 2026-07-22 i label ufficiali PO sono **In attesa** / **Eseguita**. Le sezioni §16 / §18 restano come audit storico; questa §19 è la SoT dei label UI vigenti.

Ordinamento di visualizzazione consigliato (solo UI; **non** altera l’ordine persistito usato per overlap):

**Attiva → In attesa → In pausa → Eseguite** (poi Errore / Disabilitata se presenti).

### 19.4 Storico sempre visibile

Le programmazioni **non** devono sparire automaticamente a fine finestra.  
Le finestre **Eseguite** restano nell’elenco (storico). Nessuna auto-hide.

### 19.5 Cestino — eliminazione persistente

Bug collaudato: il cestino rimuoveva solo il draft React; la riga ricompariva cambiando Feature Flag.

**Decisione PO definitiva:**

- eliminazione **immediata**;  
- salvataggio **immediato** nel DB;  
- aggiornamento dello stato locale;  
- **toast** di conferma;  
- niente draft inconsistenti.

### 19.6 Banner informativo — Programmazioni in pausa ON

Quando **Programmazioni in pausa** è attivo, in **Programmazione automatica** deve comparire un **banner informativo** che comunica che le finestre restano salvate/visibili ma non vengono applicate.

### 19.7 Layout TAB Manutenzione

| Breakpoint | Layout |
|------------|--------|
| Desktop | Card superiori (Manutenzione · Registrazione · Onboarding); **Programmazione automatica** full-width con **Programmazioni in pausa** a destra del titolo |
| Tablet | Come desktop se c’è spazio; altrimenti pausa sotto il titolo |
| Mobile | 1 colonna; titolo Programmazione sopra, pausa sotto |

Elenco finestre: verticale; **sempre** dallo stato persistito (In attesa / Attiva restano visibili al cambio TAB).  
Nessun cambiamento del motore DL-P04.

### 19.8 Conferme di non-regressione (obbligatorie)

- Motore DL-P04 / `evaluateFeatureFlag`: **invariato**  
- Priorità Default / Override / Schedule: **invariata**  
- Comportamento runtime Feature Flag: **invariato**

---

## Cronologia (append)

| Data | Autore | Modifica |
|------|--------|----------|
| 2026-07-22 | PO + AI | §19 Decisioni PO definitive T20; §9.4/§8 allineati layout e label |
| 2026-07-20 | AI | AUDIT-03 completo §14; audit Programmazioni SCH-01/02/03 §15 |
| 2026-07-20 | AI | §16 Scheduler; §17 DL-P13; §18 SCH-AUDIT-02; decisioni PO 9–10 |
