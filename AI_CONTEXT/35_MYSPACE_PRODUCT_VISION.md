# 35 — MySpace Product Vision (TouringDiary)

> **Single source of truth di prodotto** per **MyWorld / MySpace**.
> Dominio Viaggio (struttura, ownership, stereotipi) → `37_VIAGGIO_DOMAIN.md`.
> Regole permanenti di dominio → `34A_DOMAIN_DESIGN_RULES.md`.
> Collaborazione → `28_COLLABORATION_WORKSPACE_SYSTEM.md`.
> Packing → `31_PACKING_SUITCASE_SYSTEM.md`.
> Ordine capacità prodotto → `36_MYSPACE_PRODUCT_MASTERPLAN.md`.
> Implementazione → Masterplan in `AI_DEV_WORKFLOW/MASTERPLANS/`.
>
> **Non** è roadmap tecnica, Workflow, schema DB, API o RLS.
> **Non** autorizza implementazione da questo file.

**Versione:** 2.4.1  
**Data:** 2026-07-28  
**Stato:** Product Vision ufficiale — allineata al dominio Viaggio congelato + decisioni UX MySpace 2026-07-27/28 + creazione/associazione Resource e Salva con nome; gap codice §16.4 chiusi con WF-13

---

## 0. Scopo

Definisce **cosa** è MySpace / MyWorld per il viaggiatore: casa personale, confini con Workspace e Account, root, filosofia UX.

Il dettaglio strutturale del **Viaggio** non è duplicato qui: vive in DOC 37.

| Amesso | Vietato |
|--------|---------|
| Guida di visione e linguaggio prodotto | Backlog implementativo |
| Allineare UX copy e naming | Progettare schema, API, RLS |
| Desiderata WOW come ispirazione | Trattare desiderata come impegni |

---

## 1. MyWorld

Il contenitore di ingresso si chiama **MyWorld**.

```text
MyWorld
├── MySpace     ← casa del viaggiatore (originali)
└── Workspace   ← mondo collaborativo (copie)
```

Sono filosofie opposte e non confondibili.

---

## 2. MySpace = la casa

> **MySpace = la casa di tutto ciò che appartiene al viaggiatore.**

MySpace rappresenta **esclusivamente** il **patrimonio personale** dell’utente.

Qui l’utente conserva, organizza, riscopre e valorizza il proprio patrimonio.

### 2.0 Regole assolute (congelate)

- MySpace contiene **solo originali**.
- MySpace **non** contiene copie Workspace.
- MySpace **non** contiene elementi collaborativi vivi (nessun collaboratore, nessun realtime di gruppo, nessun hub di collaborazione).
- La collaborazione avviene **sempre** su **copie** in **Workspace**.
- L’originale resta in MySpace.

MySpace **non** è: workspace rinominato, social, feed, hub di collaborazione, sostituto dell’Account.

MySpace è **privato per natura**. La condivisione è un atto consapevole che porta **copie** in Workspace. L’originale resta in MySpace.

### 2.1 MySpace ≠ Account

| Mondo | Contiene |
|-------|----------|
| **MySpace** | Viaggi, Preferiti, Valigia, Inviti Workspace, Esploratore |
| **Account** | Identità, impostazioni, sicurezza, wallet, abbonamenti, supporto |

### 2.2 Promessa

> Il viaggio si pianifica nel prodotto.  
> Ciò che appartiene al viaggiatore resta in MySpace.  
> L’unità della storia è il **Viaggio**.

---

## 3. Principi di prodotto (MySpace)

1. **Personale ≠ Condiviso** — casa chiara: MySpace oppure Workspace.
2. **MySpace = solo originali** — mai copie Workspace vive.
3. **Workspace = solo copie** — nuovo ID; mai gli originali.
4. **Viaggio = cuore della storia** — Aggregate Root; dettaglio → DOC 37.
5. **Diario ≠ Viaggio** — il Diario è una risorsa del Viaggio.
6. **Preferito = stato globale** — non sezione dentro il Viaggio.
7. **Allegati viaggio ≠ Allegati Workspace**.
8. **Root Valigia ≠ Valigia del Viaggio**.
9. **Nessuna collaborazione implicita** in MySpace.
10. **Filosofia silenziosa** — no feed, no gamification, no classifiche in MySpace. Eccezione ufficiale: opt-in **«Ricordami questo viaggio»** (preferenza sul Viaggio; vedi §6.5).
11. **Anti–tab explosion** — nuove sezioni del Viaggio solo se superano il test di appartenenza (DOC 34A / DOC 37).
12. **Condividi (UX)** — l’utente vede «Condividi»; la copia è dettaglio interno. Vietato «Condividi Originale».
13. **Memoria di navigazione MySpace** — se l’utente apre una risorsa da MySpace e il pannello si chiude, la ripresa da MyWorld deve ripristinare l’**intero percorso** (breadcrumb completo), non solo la sezione né il catalogo (dettaglio → §11).

---

## 4. MySpace ↔ Workspace

| Aspetto | MySpace | Workspace |
|---------|---------|-----------|
| Ownership | Solo originali | Solo copie di lavoro |
| Collaboratori | Nessuno | Sì |
| Unità primaria | **Viaggio** | Workspace / risorse in collaborazione |
| Allegati | Del Viaggio | Di workspace |
| Autosave / Lock / Realtime / ACL | Sull’originale personale | Sulla copia |

**Ponte:** Condividi → crea sempre copia → collabora sulla copia.  
Eliminare in MySpace non elimina le copie WS; viceversa.  
**Le modifiche agli originali non aggiornano le copie Workspace.**

Estensione: creare Workspace **da un Viaggio** (selezione risorse → copie → shell isomorfa). Dettaglio → DOC 28.

---

## 5. Root MySpace (canonica)

| # | Sezione | Ruolo |
|---|---------|--------|
| 1 | **I miei Viaggi** | Cuore — catalogo dei Viaggi |
| 2 | **Esploratore** | Archivio personale dell’esploratore (non ricerca / non Scopri) |
| 3 | **Preferiti** | Vista trasversale (stato Preferito su domini compatibili) |
| 4 | **Valigia** | Catalogo globale personale: Diari · Valigie · Template (non filtrati per Viaggio) |
| 5 | **Inviti Workspace** | Ponte: ricevuti, inviati, richieste pendenti |

### Fuori dalla root

| Elemento | Dove |
|----------|------|
| Allegati personali come root | Non esistono — stanno nel Viaggio |
| Ricordi come root | Non esistono — sezione del Viaggio |
| Preferiti dentro il Viaggio | Non esistono |
| Supporto | Account |

```text
MyWorld
├── MySpace
│     ├── I miei Viaggi
│     │     └── [Viaggio]     ← struttura → DOC 37
│     ├── Esploratore          ← archivio (città, luoghi, raccolte, cronologia…)
│     ├── Preferiti            ← vista trasversale (filtro geo + box per tipo)
│     ├── Valigia               ← catalogo globale: Diari · Valigie · Template (non filtrati)
│     └── Inviti Workspace     ← ricevuti / inviati / pendenti
└── Workspace
```

---

## 6. I miei Viaggi

### 6.0 Identità del catalogo (congelato — correzione concettuale)

Il percorso:

```text
MyWorld
→ MySpace
→ I miei Viaggi
```

**NON** contiene tutti i diari dell’utente.

Contiene **esclusivamente** il **catalogo dei Viaggi**.

- Ogni riga rappresenta un **Viaggio**.
- Il **Viaggio** è l’**Aggregate Root**.
- Il **Diario** **non** è l’unità di riga del catalogo.
- I diari personali **non filtrati per Viaggio** vivono in **Valigia → Diari di Viaggio** (§9), non in questo catalogo.

### 6.1 Catalogo

**Ordinamento:** default **Ultima modifica** (più recente in alto); l’utente può scegliere un altro ordinamento. La scelta è **persistente** per l’utente e riutilizzata agli accessi successivi.

**Separazione:**

| Gruppo | Contenuto |
|--------|-----------|
| **Prossimi Viaggi** | Viaggi futuri / in corso (periodo) |
| **Viaggi Passati** | Viaggi conclusi |

Se un gruppo è **vuoto**, la relativa sezione **non** viene mostrata (nessuna intestazione vuota).

Desktop/Tablet: separazione sfruttando la **larghezza orizzontale**. Mobile: layout **verticale**.

Ogni riga del catalogo è composta da:

1. **Thumbnail città** (cliccabile) — una città → apre la città; più città → collage delle **prime 4** + selezione città.
2. Toggle **«Ricordami»** (sinistra della cover) — preferenza sul Viaggio (DOC 35 §6.5); **non** compare nella cartella.
3. **Preview orizzontale della cover** del Viaggio (sfrutta lo spazio orizzontale libero su desktop). Se la cover **manca**: riquadro con **«+»** molto evidente; al click apre **direttamente** il selettore immagini (**nessuna** finestra intermedia).
4. **Titolo** e **periodo** del Viaggio.

### 6.2 Cover (identità)

- La cover è parte dell’**identità** del Viaggio: **non** è un Ricordo, **non** è una foto del viaggio, **non** è contenuto multimediale. È una **scelta esplicita** dell’utente.
- Esiste **una sola** cover per Viaggio (metadato di identità — DOC 37).
- Solo **manuale**: caricamento, sostituzione, eliminazione. **Nessuna** generazione automatica.
- L’upload deve essere **evidente** in UI (catalogo: riquadro «+» se assente → selettore immagini diretto).
- La cover vive soprattutto nel **catalogo** (preview). Nella **cartella** del Viaggio **non** c’è la grossa fascia cover superiore.

### 6.3 Cartella (chrome)

All’apertura del Viaggio il chrome superiore è compatto:

- indietro · titolo · eventuale azione Workspace · tab sezioni (DOC 37)

Obiettivo: massimo spazio verticale alle sezioni.

### 6.3.1 Entrata nel dettaglio del Viaggio (congelato)

Entrando, ad esempio, nel viaggio **«Napoli»**, si entra nel **dettaglio del Viaggio**.

Da quel momento **tutte** le Resource (e Library / View) devono essere filtrate **esclusivamente** su quel Viaggio.

Il dettaglio del Viaggio deve contenere le sezioni:

- Diario
- Valigia
- Ricordi
- Allegati
- Roadbook
- Mappa
- Riepilogo

### 6.4 Sezioni (filtrate sul Viaggio corrente)

Aprendo un Viaggio si navigano le sezioni del dominio (DOC 37).  
Ogni sezione mostra **solo** quanto associato a **quel** Viaggio.

| Sezione | Stereotipo | Ruolo prodotto e filtro |
|---------|------------|-------------------------|
| **Diario** | Resource | Piano / narrazione. Mostra **solamente** i diari **associati a quel Viaggio** (0..N). **Non** mostra tutti i diari dell’utente. Esempio: Viaggio «Napoli» → solo «Tour Napoli», «Weekend Napoli». Se non esiste alcun diario associato: **empty state** con CTA per **creare** o **associare** un Diario al Viaggio (nel rispetto della regola «un Diario ↔ un solo Viaggio»; se la Resource è già associata altrove → proposta di **copia**, §6.4.2 / §9.7). **Salvataggio:** Salva · Salva con nome (esteso, §9.6) · Auto Save con toggle. Nessuna cronologia versioni. |
| **Valigia** | Resource | Packing di quel viaggio. Mostra **esclusivamente** le valigie **associate al Viaggio corrente**. Se non ne esistono: **empty state**. |
| **Ricordi** | Resource | Foto, Video, Note per giorno — libreria viaggio + libreria giorno (DOC 37 §6). Mostra **esclusivamente** foto e video (e note-giorno) **associati al Viaggio**. |
| **Allegati** | Resource | File personali del viaggio. Mostra **esclusivamente** gli allegati **associati al Viaggio**. |
| **Roadbook** | Library | Snapshot AI acquistati / generati. Mostra **esclusivamente** i Roadbook **associati al Viaggio**. |
| **Mappa** | View | **Google Maps embedded**; pin con **clustering** a zoom basso; click sul pin singolo → **pagina completa del POI** (DOC 37 §9). Mostra **esclusivamente** POI / PIN / mappa **associati al Viaggio**. |
| **Riepilogo** | View | Sintesi calcolata + annotazioni leggere. Mostra il riepilogo di **tutte** le Resource **associate al Viaggio**. |

### 6.4.1 Associazione Diario ⇄ Viaggio e dati di test (congelato)

Il sito **non** è ancora online. I diari oggi presenti sono **dati di test**.

**Non** devono essere considerati **automaticamente** associati ai Viaggi.

L’associazione **Diario ⇄ Viaggio** è una **relazione esplicita** del dominio (campo / legame `viaggio_id` sul Diario — dettaglio strutturale → DOC 37).

Un Diario senza associazione **non** compare nella sezione Diario del dettaglio Viaggio; può comparire nel catalogo globale **Valigia → Diari di Viaggio**.

### 6.4.2 Cardinalità di associazione Diario ⇄ Viaggio (congelato — Source of Truth)

Un Diario può appartenere ad **un solo** Viaggio.

Mai a due Viaggi contemporaneamente.

Se l’utente desidera riutilizzare un Diario in un altro Viaggio deve utilizzare la funzione **Duplica**.

Il duplicato nasce **senza** associazione.

Successivamente può essere associato ad un altro Viaggio.

### 6.4.3 Crea Diario dal dettaglio Viaggio (congelato — Source of Truth)

Quando l’utente si trova nel dettaglio di un Viaggio:

```text
Napoli
↓
Diario
↓
Nuovo Diario
```

**non** viene aperto direttamente l’editor.

Si apre un **modale ufficiale del Design System**.

Il modale deve mostrare chiaramente che il nuovo Diario sarà **associato al Viaggio corrente**.

Il modale richiede:

- nome del Diario
- data dal
- data al

Confermando:

- il Diario viene creato;
- viene automaticamente associato al Viaggio corrente;
- viene popolato con nome e periodo inseriti;
- viene immediatamente aperto.

### 6.4.4 Crea Valigia dal dettaglio Viaggio (congelato — Source of Truth)

Le **stesse identiche regole** del §6.4.3 valgono per le **Valigie** create dal dettaglio Viaggio (sezione Valigia → Nuova Valigia):

- **non** si apre direttamente l’editor;
- si apre un **modale ufficiale del Design System**;
- il modale mostra chiaramente che la nuova Valigia sarà **associata al Viaggio corrente**;
- il modale richiede i campi necessari alla creazione (allineati al prodotto packing — DOC 31);
- alla conferma: creazione, associazione automatica al Viaggio corrente, popolamento, apertura immediata.

### 6.5 Ricordami questo viaggio (ufficiale)

- **Filosofia:** lo scopo **non** è inviare notifiche insistenti. Serve a riportare periodicamente il viaggiatore nel proprio **archivio personale** e a fargli rivivere i propri viaggi.
- **Posizione:** riga del catalogo «I miei Viaggi», **alla sinistra della cover** — **non** nel chrome della cartella del Viaggio e **non** nella sezione Ricordi.
- Toggle «Ricordami questo viaggio»; se ON → frequenza a scelta:
  - intervallo ricorrente in mesi (**1..12**, default **12**);
  - oppure voce **"Personalizzato..."** nella stessa tendina, che apre il modale Design System **"Configura Ricordami"**:
    - **data specifica** one-shot (calendario oppure input manuale **gg/mm/aaaa**);
    - oppure **data annuale** ricorrente (input **gg/mm** senza anno; il sistema genera automaticamente la prossima occorrenza utile).
- Default toggle **ON**.
- Salvataggio **immediato** (nessun pulsante Salva).
- Rispetta Centro di Controllo / `feature.comms.notifications`:
  - notifiche sito ON → toggle usabile normalmente;
  - notifiche sito OFF → sui **nuovi** Viaggi il toggle nasce OFF e non attivabile;
  - se l’utente aveva ON e l’admin spegne le notifiche globali → **il valore salvato resta ON**, ma UI in stato **sospeso** (stile distinto + tooltip: notifiche temporaneamente disabilitate dall’amministrazione); al ri-enable globale torna operativo senza perdere la preferenza.
- **Emissione:** ogni Viaggio con Ricordami attivo genera una **notifica indipendente** (N viaggi → N notifiche; **nessun** raggruppamento). La notifica contiene il **collegamento diretto alla cartella** di quel Viaggio (DOC 12).
- Modalità **data specifica**: promemoria **one-shot**; dopo l’emissione la preferenza si spegne automaticamente.
- Modalità **data annuale**: ricorrenza annuale; dopo l’emissione viene calcolata automaticamente la prossima occorrenza.

### 6.6 Eliminazione Viaggio

Prima della cancellazione: **modale** con conferma esplicita. L’utente deve **spuntare** una checkbox in cui dichiara di essere consapevole che verranno eliminati: viaggio, diario, ricordi, foto, video, allegati, documenti e **tutti** i dati collegati al viaggio. Solo dopo la spunta è possibile confermare. L’eliminazione riguarda il patrimonio MySpace; **non** elimina copie Workspace (DOC 28 / DOC 37). Qualsiasi preferenza / promemoria **«Ricordami questo viaggio»** di quel Viaggio viene **eliminata automaticamente** insieme al Viaggio.

### 6.7 Breadcrumb

Breadcrumb con **ogni livello cliccabile**, es.:  
`MyWorld > MySpace > I miei Viaggi > Parigi 2026 > Ricordi`.

---

## 7. Preferiti

> Preferiti **non** è un dominio. È una **vista trasversale**.

Il Preferito è un **attributo trasversale**: non crea nuove entità, non crea copie, non crea raccolte. Serve esclusivamente a costruire **viste personali**. **Non esistono cartelle** nei Preferiti.

Una **città** può essere aggiunta ai Preferiti anche se **non** è mai stata visitata (promemoria personale).

Qualsiasi dominio compatibile può essere aggiunto ai Preferiti (Viaggi, Città, POI, Shop, Guide, Tour Operator, Personaggi famosi, Valigie, Template, …).

Marcatore canonico: **Segnalibro** (non cuore, non stella).  
Pulsante Preferito ovunque abbia senso (header città, card, POI, Shop, Guide, TO, personaggi, …).

Icone di categoria (prodotto):

| Tipo | Icona |
|------|--------|
| Città | 🏙️ |
| POI | 📍 |
| Shop | 🛍️ |
| Guide | 🗺️ |
| Tour Operator | 🎫 (evitare 🧳 — confligge con Valigia/packing) |
| Personaggi famosi | 🎭 |

**Organizzazione schermata** (invece di cartelle):

1. **Barra filtri geografici** in alto — Continente · Nazione · Regione · Zona turistica · Città. Filtra tutti i contenuti sottostanti; non mostra conteggi aggregati.
2. **Sei box affiancati** (ognuno scrollabile in modo indipendente), da sinistra a destra:
   - **Città**
   - **POI** non sponsor (suddivisi per categoria)
   - **Sponsor** (POI / entità con stato sponsor attuale)
   - **Negozio Digitale**
   - **Guide Turistiche**
   - **Tour Operator**
3. La **ricerca per aggiungere città** ai Preferiti rispetta lo stesso filtro geografico attivo (se presente), così ricercabile e visualizzato restano coerenti.
4. La vista Preferiti **non** dipende dai Feature Flag del Centro di Controllo: Sponsor e Negozi Digitali preferiti restano sempre mostrati se presenti tra i Preferiti dell’utente.

---

## 8. Esploratore

Esploratore ≠ Ricerca ≠ Scopri ≠ Feed ≠ Community.

È **esclusivamente** l’**archivio personale** del viaggiatore (nel tempo: città visitate/salvate, luoghi scoperti, raccolte, cronologia).  
Distinto dal **Riepilogo** del singolo Viaggio (DOC 37).

**Città visitate:** aggiunte **automaticamente**; rimozione **manuale** ammessa. L’eliminazione di un Viaggio **non** elimina automaticamente una città visitata.

---

## 9. Valigia

La sezione:

```text
MyWorld
→ MySpace
→ Valigia
```

deve rappresentare il **catalogo globale** delle risorse personali **NON filtrate per Viaggio**.

### 9.1 Distinzione fondamentale (congelata — Source of Truth)

| Superficie | Natura |
|------------|--------|
| **Valigia** | Catalogo **personale globale** — tutte le risorse dell’utente **senza** filtro per Viaggio |
| **Dettaglio del Viaggio** | Catalogo **contestuale filtrato** — solo le Resource **associate** a quel Viaggio |

Questa distinzione è **Source of Truth**.  
**Root Valigia ≠ Valigia del Viaggio** (DOC 37 / DOC 31).

### 9.2 Layout (congelato)

- **Desktop e tablet:** tre card **affiancate**.
- **Mobile:** tre card **verticali**.

### 9.3 Le tre card previste (congelate)

1. **Diari di Viaggio**  
   Contiene **TUTTI** i diari dell’utente, **indipendentemente** dal Viaggio.

2. **Valigie**  
   Contiene **TUTTE** le valigie dell’utente, **indipendentemente** dal Viaggio.

3. **Template**  
   Contiene **TUTTI** i template dell’utente, **indipendentemente** dal Viaggio.

Elementi autonomi e riutilizzabili: possono esistere **indipendentemente da qualsiasi Viaggio**.  
La valigia di un viaggio vive **dentro** quel Viaggio (DOC 31 / DOC 37).

### 9.4 Apertura delle Resource da Valigia (congelato — Source of Truth)

Quando l’utente apre una Resource da:

```text
MyWorld
→ MySpace
→ Valigia
```

quella Resource viene aperta **direttamente**.

Vale per:

- Diario
- Valigia
- Template

**Non** esistono schermate intermedie.

### 9.5 Crea Diario da Valigia (congelato — Source of Truth)

Quando l’utente crea un Diario da:

```text
MySpace
→ Valigia
→ Diari
```

si apre lo **stesso modale** ufficiale del Design System usato per la creazione contestuale (stesso pattern del §6.4.3, con campi aggiuntivi di associazione).

Il modale permette **tre** possibilità.

**A)** Creare il Diario **senza** associarlo ad alcun Viaggio.

**B)** Associare il nuovo Diario ad un **Viaggio esistente**.  
Il modale mostra una **tendina** con i Viaggi disponibili.

**C)** Creare contemporaneamente un **nuovo Viaggio**.

In tutti i casi il modale richiede:

- nome Diario
- data dal
- data al

Alla conferma:

- se è stato scelto un nuovo Viaggio, questo viene creato;
- se è stato scelto un Viaggio esistente, il Diario viene associato;
- se non è stato scelto alcun Viaggio il Diario resta indipendente;

Il Diario viene comunque creato, popolato ed **aperto**.

### 9.6 Salva con nome — Diario (congelato — Source of Truth)

L’attuale funzione **«Salva con nome»** **NON** viene modificata nella sua **filosofia**.

Vengono soltanto aggiunte **nuove possibilità**.

Durante il Salva con nome l’utente può:

- lasciare il Diario **indipendente**;
- associarlo ad un **Viaggio esistente**;
- creare un **nuovo Viaggio** e salvare contemporaneamente il Diario al suo interno.

Questa estensione deve essere prevista **senza** alterare il resto del comportamento del Salva con nome (nome, conferma se nome uguale, copia documento, Auto Save, ecc. restano come oggi nella loro filosofia — DOC 37).

### 9.7 Regola di dominio sulle associazioni Resource personali (congelato — Source of Truth)

Una **Resource personale** non può appartenere contemporaneamente a **due Viaggi**.

Questa è una **regola di dominio**.

Se l’utente tenta di associare una Resource già associata ad un altro Viaggio, oppure ad un contesto incompatibile, il sistema **non** riutilizza l’originale.

Viene proposta la creazione di una **copia**.

L’originale resta **invariato**.

La copia viene associata al nuovo Viaggio.

Questo evita sincronizzazioni indesiderate.

### 9.8 Stesse regole per le Valigie (congelato — Source of Truth)

Le **stesse identiche regole** devono valere per le **Valigie**.

- Creazione dal dettaglio Viaggio (§6.4.4).
- Creazione da Valigia (stesso pattern del §9.5: senza Viaggio / Viaggio esistente / nuovo Viaggio).
- Salva con nome (stesso pattern del §9.6: indipendente / associa esistente / crea nuovo Viaggio).
- Creazione contestuale del Viaggio.
- Associazione ad un Viaggio esistente.
- Creazione senza alcuna associazione.

### 9.9 Valigie già associate ai Diari (congelato — Source of Truth)

L’attuale possibilità di associare una Valigia ad un **Diario** **NON** deve cambiare.

Tuttavia:

se una Valigia risulta già associata ad un Diario oppure ad un altro Viaggio, e l’utente tenta di associarla ad un **nuovo Viaggio**, il sistema deve proporre la creazione di una **copia**.

Il modale deve spiegare chiaramente il motivo.

Ad esempio:

> «Questa valigia è già associata ad un altro Viaggio o Diario. Verrà creata una copia indipendente da associare al nuovo Viaggio.»

L’obiettivo è evitare che modifiche future si propaghino involontariamente su più contesti.

---

## 10. Inviti Workspace

Ponte verso Workspace: inviti ricevuti, inviati, richieste pendenti. L’invito si **risolve** nel mondo Workspace.

---

## 11. Linee guida UX

### Salvataggio

Messaggi di conferma di elementi importanti ricordano che l’elemento è ritrovabile in MySpace.

**Salva / Salva con nome / Auto Save** restano le azioni canoniche sul Diario e sulla Valigia.

La **filosofia** di Salva con nome **non** cambia; vengono aggiunte le possibilità di associazione Viaggio descritte in §9.6 e §9.8.

### Orientamento

Breadcrumb sempre presente e cliccabile nei livelli MyWorld / MySpace.

### Memoria di navigazione

Si memorizza l’**intero percorso** di navigazione (breadcrumb completo), non solo la sezione corrente.

Esempio: MySpace → Viaggio → Ricordi → Foto Giorno X.

Se l’utente apre una risorsa e MySpace si chiude, alla riapertura di MyWorld deve tornare **esattamente** nello stesso punto del percorso.

### Densità (desktop)

Sfruttare lo spazio orizzontale; ridurre chrome decorativo; contenuto prima. Tablet/mobile: coerenza touch e leggibilità.

### Operazioni di dominio (visione)

| Area | Regola |
|------|--------|
| Eliminazione | (A) elimina Viaggio intero → solo patrimonio personale, dopo modale + checkbox consapevolezza (§6.6); (B) elimina singole risorse senza cancellare il Viaggio |
| Creazione | MySpace è anche centro di creazione (Nuovo Viaggio / risorse) |
| Account Dashboard | Tab legacy restano finché migrazione funzionale completa senza regressioni |

---

## 12. Desiderata (non impegni)

Idee WOW residue da DOC 34 / appendici (es. modalità **Rivivere**, **On This Day** avanzato) restano **desiderata**: non obbligano sezioni nuove del Viaggio.  
**«Ricordami questo viaggio»** non è più desiderata: è capacità ufficiale (§6.5).

---

## 13. Riferimenti

| Documento | Responsabilità |
|-----------|----------------|
| `34A_DOMAIN_DESIGN_RULES.md` | Costituzione / regole permanenti |
| `37_VIAGGIO_DOMAIN.md` | Struttura e lifecycle del Viaggio |
| `36_MYSPACE_PRODUCT_MASTERPLAN.md` | Ordine capacità di prodotto |
| `28_COLLABORATION_WORKSPACE_SYSTEM.md` | Workspace e condivisione |
| `31_PACKING_SUITCASE_SYSTEM.md` | Packing |
| `12_NOTIFICATION_SYSTEM.md` / DOC 30 | Notifiche + `feature.comms.notifications` |
| `34_PRODUCT_VISION_FUTURE_IDEAS.md` | Patrimonio visionario generale |

---

## 14. Decision Log (prodotto)

| ID | Decisione | Stato |
|----|-----------|-------|
| PV-001 | Catalogo: sort default ultima modifica; Prossimi / Passati; cover «+»; collage max 4 città; delete con checkbox | Congelato 2026-07-27 |
| PV-002 | Diario: Salva / Salva con nome / Auto Save; no cronologia versioni. **Filosofia** Salva con nome invariata; **estensione** associazione Viaggio in PV-016 | Congelato 2026-07-27 · esteso 2026-07-28 |
| PV-003 | Preferiti: no cartelle; layout barra filtri geo + 6 box (Città · POI · Sponsor · Negozio Digitale · Guide · Tour Operator); ricerca città allineata al filtro geo. **Sostituisce** il layout «Città Preferite · Altri Preferiti · Recap POI» e la precedente organizzazione «POI Preferiti a filtri multipli» documentata fino a v2.1.1 | Aggiornato 2026-07-28 |
| PV-004 | Città Preferita ammissibile anche se non visitata | Congelato 2026-07-27 |
| PV-005 | Esploratore: città visitate auto + rimozione manuale; delete Viaggio ↛ delete città visitata | Congelato 2026-07-27 |
| PV-006 | Ricordami: N notifiche indipendenti + deep link cartella Viaggio | Congelato 2026-07-27 |
| PV-007 | Mappa Viaggio: clustering marker + pin → pagina completa POI (solo visualizzazione) | Congelato 2026-07-27 |
| PV-008 | Catalogo: ordinamento utente persistente; nascondi gruppi Prossimi/Passati vuoti; «+» cover → selettore diretto | Congelato 2026-07-27 |
| PV-009 | Delete Viaggio → elimina anche promemoria Ricordami di quel Viaggio | Congelato 2026-07-27 |
| PV-010 | Breadcrumb: ogni livello cliccabile | Congelato 2026-07-27 (riaffermazione) |
| PV-011 | MySpace = solo originali; mai copie; mai elementi collaborativi vivi | Congelato 2026-07-28 |
| PV-012 | Catalogo «I miei Viaggi» = solo Viaggi (Aggregate Root), non tutti i diari | Congelato 2026-07-28 |
| PV-013 | Dettaglio Viaggio: tutte le sezioni filtrate esclusivamente su quel Viaggio; empty state + CTA create/associa Diario | Congelato 2026-07-28 |
| PV-014 | Valigia = catalogo globale Diari · Valigie · Template (3 card; desktop affiancate, mobile verticali) ≠ dettaglio Viaggio filtrato | Congelato 2026-07-28 |
| PV-015 | Associazione Diario ⇄ Viaggio esplicita; diari di test non auto-associati | Congelato 2026-07-28 |
| PV-016 | Apertura Resource da Valigia = diretta (Diario · Valigia · Template); nessuna schermata intermedia | Congelato 2026-07-28 |
| PV-017 | Un Diario ↔ un solo Viaggio; riuso su altro Viaggio solo via Duplica (duplicato nasce senza associazione) | Congelato 2026-07-28 |
| PV-018 | Crea Diario dal dettaglio Viaggio: modale DS (nome, dal, al); associa automatico; popola; apre subito — non apre editor prima del modale | Congelato 2026-07-28 |
| PV-019 | Crea Diario da Valigia: stesso modale con A) indipendente · B) Viaggio esistente · C) nuovo Viaggio; crea/popola/apre | Congelato 2026-07-28 |
| PV-020 | Salva con nome: filosofia invariata; aggiunge indipendente / associa esistente / crea nuovo Viaggio | Congelato 2026-07-28 |
| PV-021 | Stesse regole creazione/associazione/Salva con nome per le Valigie | Congelato 2026-07-28 |
| PV-022 | Resource personale non può appartenere a due Viaggi; se già associata / contesto incompatibile → proposta copia; originale invariato | Congelato 2026-07-28 |
| PV-023 | Associazione Valigia⇄Diario invariata; se Valigia già su Diario/altro Viaggio e si associa a nuovo Viaggio → proposta copia con modale esplicativo | Congelato 2026-07-28 |

---

## 15. Audit migrazione Account → MyWorld / MySpace / Workspace (2026-07-28)

> **Source of Truth operativa** per pianificare la successiva macrofase di chiusura della migrazione.  
> Evidenze ricavate **esclusivamente dal codice** (nessuna ipotesi).  
> Dominio / visione aggiornati in questo documento (§2, §6, §9) e in DOC 37 v1.4.0.  
> Estensione creazione/associazione/Salva con nome → **§16** (DOC 35 v2.4.0).

### 15.1 Ambito confrontato

| Legacy Account | Destinazione Product Vision |
|----------------|-----------------------------|
| `UserSidebar` tab `trips` → `UserTripsTab` | MySpace → **I miei Viaggi** (`MySpaceTripsCatalog` + cartella / sezioni) |
| `UserSidebar` tab `suitcases` → `UserSuitcasesTab` | MySpace → **Valigia** → Valigie / Template |
| `UserSidebar` tab `sharing` → `UserSharingTab` | MySpace → **Inviti Workspace** + **Workspace** hub (`MySpaceInvitesRoot`, `GlobalWorkspacePanel` / sezioni) |
| `UserOverviewTab` → `WorkspaceQuickAccess` | Workspace (accesso rapido ancora montato in Account) |

File Account (legacy):

- `src/components/user/dashboard/UserSidebar.tsx`
- `src/components/user/dashboard/UserTripsTab.tsx`
- `src/components/user/dashboard/UserSuitcasesTab.tsx`
- `src/components/user/dashboard/UserSharingTab.tsx`
- `src/components/user/dashboard/UserOverviewTab.tsx`
- `src/hooks/useAppRouter.ts` (`USER_DASHBOARD_TABS`: `trips`, `suitcases`, `sharing`)

File destinazione MySpace / Workspace:

- `src/components/myspace/MySpaceTripsCatalog.tsx`
- `src/components/myspace/ViaggioFolderShell.tsx` + sezioni `Viaggio*Section.tsx`
- `src/components/myspace/MySpaceToolsRoot.tsx`
- `src/components/myspace/MySpaceInvitesRoot.tsx`
- `src/components/workspace/global/` (`CondivisioneSection.tsx`, `InvitiSection.tsx`, …)
- `src/components/collaboration/workspace/WorkspaceQuickAccess.tsx`

### 15.2 Confronto A — Account «I Miei Viaggi» vs MySpace «I miei Viaggi»

| Funzione | Dove esiste oggi (file) | Stato | Dove dovrebbe vivere (SoT) |
|----------|-------------------------|-------|----------------------------|
| Voce menu Account «I Miei Viaggi» | `UserSidebar.tsx` → `openUserTab('trips')` | **Presente** (legacy) | **Non** in Account; catalogo in MySpace |
| Lista diari personali (`savedProjects`) | `UserTripsTab.tsx` + `useItinerary().savedProjects` | **Completa** come lista **Diari**, **non** come catalogo **Viaggi** | SoT: i diari globali stanno in **Valigia → Diari di Viaggio**; il catalogo MySpace è **solo Viaggi** |
| Apri / modifica diario | `UserTripsTab.tsx` → `loadProject` + `onClose` | **Completa** | Apri diario: da sezione Diario del Viaggio **oppure** da Valigia → Diari |
| Elimina diario | `UserTripsTab.tsx` → `deleteProject` + `DeleteConfirmationModal` | **Completa** | Eliminazione Diario come Resource (non = delete Viaggio) |
| Catalogo **Viaggi** (`listViaggiByUser`) | `MySpaceTripsCatalog.tsx` | **Completa** | MySpace → I miei Viaggi |
| Crea Viaggio empty | `MySpaceTripsCatalog.tsx` → `createEmptyViaggio` | **Completa** | MySpace → I miei Viaggi |
| Elimina Viaggio (modale + checkbox) | `MySpaceTripsCatalog.tsx` + `MySpaceViaggioDeleteModal.tsx` | **Completa** | MySpace → I miei Viaggi |
| Cover / Ricordami / sort / Prossimi-Passati | `MySpaceTripsCatalog.tsx` + controlli correlati | **Completa** (allineamento MP-02) | MySpace → I miei Viaggi |
| Sezione Diario **filtrata** su Viaggio | `ViaggioDiarioSection.tsx` → `listDiariesByViaggio` | **Parziale**: lista filtrata + create + set attivo + open **presenti**; CTA **associa** diario esistente **assente** nel file | Dettaglio Viaggio → Diario |
| Sezione Valigia filtrata | `ViaggioValigiaSection.tsx` → `listSuitcasesByViaggio` + create/link/unlink/open | **Completa** per create/link/reopen/unlink contestuale | Dettaglio Viaggio → Valigia |
| Sezioni Ricordi / Allegati / Roadbook / Mappa / Riepilogo filtrate | `ViaggioRicordiSection.tsx`, `ViaggioAllegatiSection.tsx`, `ViaggioRoadbookSection.tsx`, `ViaggioMappaSection.tsx`, `ViaggioRiepilogoSection.tsx` | **Presenti** e scoped su `viaggioId` | Dettaglio Viaggio |

**Incoerenza Product Vision ↔ implementazione Account:**

- La tab Account si chiama «I Miei Viaggi» ma il titolo UI interno è «I Miei Diari» e i dati sono `Itinerary` via `savedProjects` (`UserTripsTab.tsx`).
- Questo **contraddice** §6.0 di questo documento: il catalogo Viaggi **non** è la lista di tutti i diari.

### 15.3 Confronto B — Account «Le mie Valigie» vs MySpace «Valigia»

| Funzione | Account `UserSuitcasesTab.tsx` | MySpace root Valigia | Stato migrazione | Destinazione SoT |
|----------|--------------------------------|----------------------|------------------|------------------|
| Lista Valigie | Sì (`isValigia`) | Sì (`fetchUserSuitcasesAsync`, non template) | Account **completa**; MySpace **lista+apri** | Valigia → Valigie |
| Lista Template | Sì (`isUserTemplate`) | Sì (`fetchUserOwnedTemplatesAsync`) | Account **completa**; MySpace **lista+apri** | Valigia → Template |
| Card «Diari di Viaggio» (tutti i diari) | **Assente** | **Assente** | **Manca** | Valigia → Diari di Viaggio (§9.3) |
| Layout 3 card affiancate / mobile verticali | Tab Valigie\|Template (non 3 card) | Due sezioni stacked (non 3 card) | **Manca** rispetto a §9.2–9.3 | Valigia |
| Crea Valigia | Sì (`initialAction: 'create-suitcase'`) | Sì | Presente in entrambi | Valigia |
| Crea Template | Sì | Sì | Presente in entrambi | Valigia |
| Apri / modifica editor packing | Sì (`openModal('packingList')`) | Sì | Presente in entrambi | Valigia |
| Duplica | Sì (`duplicateSuitcaseEntityAsync`) | **Assente** (nessun match `duplicate` nel root Valigia) | **Gap** | Valigia |
| Elimina | Sì (`deleteSuitcase` + modal + swipe) | **Assente** | **Gap** | Valigia |
| Condividi (wizard) | Sì (`useOpenCollaborationShare`) | **Assente** | **Gap** (azione collaborativa: avvia copia → Workspace; entry UX da catalogo originale ammessa) | Entry da Valigia / risorsa; collaborazione in Workspace |
| Indicatore «condiviso» | Sì (`SharedResourceIndicator` + `useSharedResourceIndicator`) | **Assente** | **Gap** | Valigia (indicatore su originale) |
| Apri Workspace collegato | Sì (`useResourceWorkspaces` + `useOpenCollaborationWorkspace`) | **Assente** | **Gap** | Ponte verso Workspace |

### 15.4 Confronto C — Account «Condivisione» vs MySpace Inviti vs Workspace

| Funzione | Account `UserSharingTab.tsx` | MySpace `MySpaceInvitesRoot.tsx` | Workspace hub | Stato | Destinazione SoT |
|----------|------------------------------|----------------------------------|---------------|-------|------------------|
| Overview risorse owned + member | Sì (`loadSharingProfileOverview`) | **Assente** | `CondivisioneSection.tsx` = risorse del **workspace attivo**, non overview globale utente | Overview Account **completa**; destinazione **non** equivalente | Redistribuire: overview collaborativa → Workspace / Inviti; **non** hub permanente in Account |
| Apri risorsa (diario / packing) | Sì | **Assente** | `onOpenResource` in hub | Presente in Account e in Workspace hub | Workspace / Valigia / dettaglio Viaggio a seconda del contesto |
| Condividi (owner) | Sì | **Assente** | «Aggiungi elemento» owner in `CondivisioneSection` | Presente in Account e in Workspace | Workspace + wizard share |
| Apri Workspace da riga | Sì | Accetta invito → `openModal('workspace')` | Hub nativo | Presente | Workspace |
| Inviti **risorsa** (accept/reject) | Sì (`acceptResourceInvite` / `rejectResourceInvite`) | **Assente** (solo `listIncomingWorkspaceInvitesForUser` / outgoing) | `InvitiSection.tsx` usa **solo** `listPendingWorkspaceInvitesForUser` | **Gap** in MySpace e in Workspace Inviti rispetto ad Account | Ponte Inviti: resource invites oggi **solo** in Account |
| Inviti **workspace** (accept/reject) | Sì (incoming) | Sì (pending/received) + revoke su sent | Sì (pending) | Presente in Account, MySpace, Workspace | MySpace → Inviti Workspace (§10) |
| Lista Workspace utente | Sì (sezione Workspace in tab) | **Assente** (solo inviti) | `WorkspaceSection` + quick access | Presente in Account overview (`WorkspaceQuickAccess` in `UserOverviewTab.tsx`) e in tab Condivisione | Workspace (MyWorld → Workspace); **non** root Account |

### 15.5 Funzionalità già migrate (evidenza codice)

- Catalogo **Viaggi** MySpace: list / create empty / delete con modale / cover / Ricordami / sort / Prossimi-Passati — `MySpaceTripsCatalog.tsx`.
- Cartella Viaggio e sezioni filtrate su `viaggioId` — `ViaggioFolderShell.tsx` + `Viaggio*Section.tsx`.
- Valigia del Viaggio: create / link / unlink / reopen — `ViaggioValigiaSection.tsx`.
- Root Valigia: lista Valigie + Template + create/open — `MySpaceToolsRoot.tsx` (**subset** rispetto ad Account).
- Root Inviti Workspace: received / sent / pending + accept/reject/revoke — `MySpaceInvitesRoot.tsx`.
- Hub Workspace: sezioni Condivisione / Inviti / Utenti / … — `src/components/workspace/global/`.
- Confine label Account vs MySpace (Macrofase 1) — `UserDashboard.tsx` / `UserSidebar.tsx` / Header.

### 15.6 Funzionalità ancora rimaste nel pannello Account (evidenza codice)

- Voce e route `trips` / `suitcases` / `sharing` — `UserSidebar.tsx`, `useAppRouter.ts`.
- Tab completa **Diari** (`UserTripsTab.tsx`): list / open / delete.
- Tab completa **Valigie+Template** (`UserSuitcasesTab.tsx`): list / create / edit / duplicate / delete / share / indicator / open Workspace.
- Tab **Condivisione** (`UserSharingTab.tsx`): overview risorse, resource invites, workspace invites, lista workspace.
- Blocco **I tuoi Workspace** in overview Account — `UserOverviewTab.tsx` → `WorkspaceQuickAccess.tsx`.

### 15.7 Gap reali (evidenza codice)

1. **Catalogo Account «I Miei Viaggi» ≠ catalogo MySpace Viaggi** — Account elenca Diari; MySpace elenca Viaggi. Due SoT di UI ancora vive.
2. **Valigia non implementa la terza card «Diari di Viaggio»** né il layout a tre card (§9).
3. **Parity Valigie/Template:** duplicate, delete, share, SharedResourceIndicator, open Workspace presenti in Account e **assenti** nel root Valigia (`MySpaceToolsRoot.tsx`).
4. **Inviti a risorsa** gestiti in Account (`UserSharingTab`) e **non** in `MySpaceInvitesRoot` né in `InvitiSection` Workspace (solo workspace invites).
5. **CTA «associa Diario esistente»** al Viaggio: **assente** in `ViaggioDiarioSection.tsx` (solo create empty + set active + open). SoT §6.4 richiede create **o** associa.
6. **Workspace quick access** ancora montato in Account overview — fuori dal confine Account = solo profilo/settings/wallet/supporto (§2.1).

### 15.8 Incoerenze Product Vision ↔ implementazione

| SoT | Codice attuale |
|-----|----------------|
| Catalogo «I miei Viaggi» = solo Viaggi | Account tab omonima = Diari (`UserTripsTab`) |
| Valigia = 3 card Diari · Valigie · Template | root Valigia (`MySpaceToolsRoot`) = solo Valigie + Template, layout sezioni stacked |
| Account senza patrimonio / collaborazione hub | Tab trips/suitcases/sharing + WorkspaceQuickAccess ancora attive |
| Inviti Workspace come ponte MySpace | Resource invites ancora solo in Account Condivisione |
| Empty Diario: CTA create **o** associa | Solo create in `ViaggioDiarioSection` |

### 15.9 Conclusioni finali

1. **Non** è possibile eliminare oggi le tre voci Account (`trips`, `suitcases`, `sharing`) senza perdita funzionale dimostrata dal codice.
2. La migrazione del **catalogo Viaggi** verso MySpace è **avanzata e operativa**; la tab Account «I Miei Viaggi» è **legacy semanticamente errata** (Diari, non Viaggi) e va trattata come debito da chiudere dopo aver esposto i Diari globali in **Valigia**.
3. **Le mie Valigie** Account resta **più completa** di MySpace Valigia: serve parity (e card Diari) prima della rimozione.
4. **Condivisione** Account resta l’unico posto con **resource invites** + overview risorse owned/member; MySpace Inviti e Workspace Inviti coprono **solo** workspace invites.
5. Prossima macrofase di manutenzione/sviluppo: chiudere i gap §15.7 in ordine anti-regressione (Valigia 3 card + parity → Inviti risorsa → rimozione tab Account + WorkspaceQuickAccess da overview), rispettando §11 «Account Dashboard — tab legacy restano finché migrazione funzionale completa».

---

## 16. Audit architetturale — creazione / associazione Resource e Salva con nome (2026-07-28)

> Audit **dopo** trascrizione SoT di §6.4.2–§6.4.4 e §9.4–§9.9 (e allineamenti DOC 37 / DOC 31).  
> Basato su **dominio documentato** + **codice esistente**. **Nessuna implementazione** in questa attività.

### 16.1 Coerenza con il dominio congelato

| Decisione | Coerenza |
|-----------|----------|
| Apertura diretta da Valigia | **Coerente** con Valigia = catalogo globale di Resource autonome (§9 / DOC 37 VD-013/026). |
| Un Diario ↔ un solo Viaggio | **Coerente** con Aggregate Root = Viaggio, Diario = Resource, relazione esplicita `viaggio_id` (DOC 37 VD-002/025). Il modello dati Diario ha **un** `viaggioId` (`Itinerary.viaggioId`) — non un multi-link. |
| Riuso solo via Duplica | **Coerente** con anti-sincronizzazione originali / no stesso oggetto in due contesti (allinea spirito DOC 28 / VD-022 e WF-04 D20 «sempre nuovo ID»). |
| Modale create dal dettaglio Viaggio | **Coerente** con empty state create/associa (§6.4) e con filtro sezioni sul Viaggio corrente. |
| Create da Valigia A/B/C | **Coerente** con Diari indipendenti in Valigia + associazione esplicita; opzione C (crea Viaggio contestuale) rafforza MySpace come centro di creazione (§11). |
| Salva con nome esteso | **Coerente** se si mantiene la filosofia copia/nuovo documento; le tre opzioni di associazione **non** contraddicono Diario ≠ Viaggio. |
| Stesse regole Valigie | **Coerente** con stereotipo Resource e DOC 31 Parte A (due case: Valigia del Viaggio vs root Valigia). |
| Proposta copia se già associata | **Coerente** e **necessaria** per evitare sync involontarie tra Viaggi. |
| Valigia⇄Diario invariata + copia se conflitto | **Coerente**: preserva debito/runtime `itinerary_suitcases` senza collassare Valigia-viaggio e link diario. |

### 16.2 Conflitti / tensioni con SSOT esistenti

| Fonte | Tensione | Risoluzione documentale |
|-------|----------|-------------------------|
| PV-002 / VD-021 («Salva con nome invariato as-is») | Le nuove possibilità **estendono** il modale/flusso | **Risolto in SoT:** filosofia invariata; estensione esplicita (PV-020 / VD-028). Non è un rollback della filosofia. |
| WF-04 D20 (modello Save A/B/C, «sempre duplica» su Aggiungi al Viaggio; congelato **non STEP-2**) | D20 anticipava un modello molto simile; le decisioni 2026-07-28 lo elevano a **Product Vision / dominio**. D20 diceva «sempre duplica» anche su add a viaggio; il SoT vigente distingue: Resource **indipendente** → associazione diretta ammissibile; Resource **già associata / incompatibile** → sola **copia** | WF-04 D20 va **rivalutato** (marker TODO) quando si riprende quel Workflow: non è più «solo evoluzione futura sospesa», ma allineamento a DOC 35/37. |
| DOC 31 Parte B (as-is `itinerary_suitcases`) | Dual membership Valigia↔Diario e Valigia↔Viaggio | **Non conflitto di prodotto:** §9.9 mantiene Valigia⇄Diario; impone copia quando si tenta un secondo Viaggio. |
| Eliminazione Viaggio (§6.6) elenca «diario» tra i dati collegati | Con 0..N diari e diari indipendenti in Valigia | **Chiarire in implementazione futura:** delete Viaggio elimina i Diari **associati** a quel Viaggio, non i Diari indipendenti in Valigia. SoT delete già dice «dati collegati al viaggio»; non richiede correzione strutturale ora, ma attenzione anti-regressione. |

### 16.3 Documentazione che richiedeva / richiede correzione

| Documento | Azione in questa attività |
|-----------|---------------------------|
| `35_MYSPACE_PRODUCT_VISION.md` | **Aggiornato** (§6.4.2–4, §9.4–9.9, PV-016…023, §16) |
| `37_VIAGGIO_DOMAIN.md` | **Aggiornato** (§4.0.2–3, §4.4, §8.1–8.3, VD-028…033) |
| `31_PACKING_SUITCASE_SYSTEM.md` | **Aggiornato** (Parte A regole 5–8) |
| `WF_04_MYSPACE_MACROFASE_2.md` (D20) | **Marker TODO / REVIEW** — non riscrittura automatica del Workflow |
| `36_MYSPACE_PRODUCT_MASTERPLAN.md` | Nessuna riscrittura obbligatoria in questa passata; eventuale riallineamento ordine capacità create/associa quando si pianifica l’implementazione |

### 16.4 Gap codice vs SoT (evidenze)

| Gap | Evidenza codice | SoT | Stato post WF-13 |
|-----|-----------------|-----|------------------|
| Create Diario da dettaglio: **nessun** modale nome/dal/al; **non** apre editor | era `createEmptyDiaryForViaggio` | §6.4.3 / PV-018 | **Risolto** — `CreateDiaryModal` + `createDiaryWithAssociation` |
| Create usa periodo del **Viaggio**, non input utente | era pack da `viaggio.period*` | §6.4.3 | **Risolto** — dal/al sul Diario |
| CTA **associa** Diario esistente | Assente | §6.4 | **Risolto** — pannello Collega + conflitto→copia |
| Valigia: **no** card Diari | root Valigia (`MySpaceToolsRoot`) | §9.3–9.5 | **Risolto** — 3 card + create/open |
| Salva con nome: solo **nome** | `SaveAsModal` | §9.6 | **Risolto** — A/B/C Viaggio |
| Link Valigia multi-Viaggio / heal | `linkSuitcaseToViaggio` + heal | §9.7 / §9.9 | **Risolto** — Safe + refuse other_viaggio; heal rimosso; migrazione UNIQUE `suitcase_id` |
| Create Valigia senza modale | create+link diretto | §6.4.4 | **Risolto** — `CreateSuitcaseModal` |
| Open Valigia richiede Diario attivo | gate `activeDiaryId` | apertura Resource | **Risolto** — open autonomo (hint soft) |
| Duplica Diario prodotto | Assente | PV-017 | **Risolto** — Duplica in sezione + Valigia |

### 16.5 Miglioramenti consigliati (documentali / di design, non codice)

1. Unificare in un **unico contratto di modale** «Crea Diario / Crea Valigia» con variante `context: viaggio | tools | saveAs` (`tools` = id tecnico del root Valigia) per non triplicare UI.
2. Definire campi minimi Valigia nel modale create (nome obbligatorio; periodo solo se prodotto packing lo richiede — oggi packing non usa dal/al come il Diario).
3. Precisare delete Viaggio: cascade solo su Resource con `viaggio_id` / link `viaggio_suitcases` di quel Viaggio.
4. Distinguere in glossario **Duplica** (copia indipendente in Valigia) vs **proposta copia su conflitto di associazione** (stesso meccanismo tecnico, trigger diverso).
5. Constraint DB futura: `suitcase_id` non ripetibile su più `viaggio_id` **oppure** enforcement solo applicativo + soft-check — da scegliere in implementazione.

### 16.6 Criticità future

1. **Multi-link Valigia** già possibile in DB/runtime → rischio dati di test multi-associati prima del go-live; serve migrazione/heal o blocco create-link.
2. **Heal** `listSuitcasesByViaggio(..., healViaggioLinks: true)` può propagare link diario→viaggio **senza** copia — va riallineato alla regola «se già su Diario/altro Viaggio → copia» quando si implementa.
3. **Salva con nome + crea Viaggio** tocca lifecycle Aggregate Root (metadati, Ricordami default, cover) — non solo il Diario.
4. **Template:** apertura diretta sì; creazione/associazione Viaggio **non** richiesta dalle decisioni 1–8 (Template restano fuori dal patrimonio Viaggio) — non estendere per analogia.
5. **Workspace:** le regole riguardano Resource **personali** MySpace; le copie collaborative restano DOC 28 (non mescolare «copia per conflitto associazione» con «copia per share»).

### 16.7 Verdetto

Le decisioni **1–8** sono **coerenti** con il dominio Viaggio congelato e con la Product Vision MySpace.  
Elevano a SoT un modello già abbozzato in WF-04 D20, con **raffinamento** (associazione diretta se indipendente; copia se conflitto).  
Il **conflitto principale col codice** è il link Valigia multi-Viaggio / heal senza copia.  
Il **debito UX principale** è assenza di modali create/associa e di estensione Salva con nome.  
**Nessuna** delle decisioni richiede di rimettere in discussione Aggregate Root, Diario ≠ Viaggio, o MySpace=originali.

---

## Cronologia

| Versione | Data | Note |
|----------|------|------|
| 1.x | 2026-07-24/25 | Visioni precedenti MySpace (pre-freeze dominio) |
| 2.0.0 | 2026-07-26 | Riscrittura completa su dominio Viaggio congelato; no Diario≡Viaggio |
| 2.1.0 | 2026-07-27 | Cover manuale unica + catalogo; cartella compatta; Ricordami ufficiale; Preferiti vista; Esploratore archivio; memoria navigazione; Mappa embedded |
| 2.1.1 | 2026-07-27 | Rafforzamento: memoria percorso completo; cover ≠ Ricordo; filosofia Ricordami; Esploratore/Preferiti/Valigia |
| 2.2.0 | 2026-07-27 | Catalogo Prossimi/Passati; delete checkbox; Preferiti layout+recap (PV-003); Esploratore città; Ricordami N notifiche; Mappa clustering |
| 2.2.1 | 2026-07-27 | Sort persistente; sezioni vuote nascoste; «+» diretto; delete→Ricordami; breadcrumb (PV-008…010) |
| 2.2.2 | 2026-07-28 | Ricordami: UI su riga catalogo (sx cover), non in cartella; Preferiti entry Città/Guide/TO; rientro MyWorld → ultima superficie |
| 2.2.3 | 2026-07-28 | Ricordami: frequenza 1..12 mesi oppure data specifica one-shot o ricorrenza annuale; controllo UI compatto senza label permanente |
| 2.3.0 | 2026-07-28 | Chiarimenti SoT: catalogo=solo Viaggi; filtro sezioni; Valigia 3 card; associazione Diario esplicita (PV-011…015); §15 Audit migrazione Account |
| 2.4.0 | 2026-07-28 | Apertura Valigia; un Diario↔un Viaggio; create modale; Salva con nome esteso; Valigie gemelle; copia su conflitto (PV-016…023); §16 Audit |
| 2.4.1 | 2026-07-28 | WF-13 chiuso: §16.4 gap codice → Risolto; multi-link Valigia hardenizzato (app + migrazione UNIQUE) |
| 2.4.2 | 2026-07-28 | Preferiti §7 / PV-003: barra filtri geo + 6 box; ricerca città coerente col filtro; indipendenza dai Feature Flag CC |
| 2.4.3 | 2026-07-28 | Terminologia root: Strumenti → Valigia (allineamento DOC 35 all’architettura vigente) |
| 2.4.4 | 2026-07-28 | Coerenza naming prodotto/tecnico in audit §15–§16 (root Valigia vs `MySpaceToolsRoot`) |
