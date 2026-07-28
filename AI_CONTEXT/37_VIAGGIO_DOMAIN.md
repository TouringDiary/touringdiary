# 37 — Viaggio Domain (Source of Truth)

> **SSOT strutturale del dominio Viaggio** — Aggregate Root del patrimonio personale.
> Regole permanenti → `34A_DOMAIN_DESIGN_RULES.md`.
> Visione MySpace / MyWorld → `35_MYSPACE_PRODUCT_VISION.md`.
> Collaborazione → `28_COLLABORATION_WORKSPACE_SYSTEM.md`.
> Packing → `31_PACKING_SUITCASE_SYSTEM.md`.
> **Non** contiene roadmap, Workflow, schema DB, API, RLS né piano di implementazione.
> Implementazione dominio base → `AI_DEV_WORKFLOW/MASTERPLANS/MP_01_VIAGGIO_DOMAIN_IMPLEMENTATION.md` (**concluso**).  
> Allineamento UX MySpace post–MP-01 → `AI_DEV_WORKFLOW/MASTERPLANS/MP_02_MYSPACE_UX_REALIGNMENT.md`.

**Versione:** 1.4.0  
**Data:** 2026-07-28  
**Stato:** Congelato — Source of Truth del dominio  
**Origine:** Decisioni PO + review architetturale finale (chiusa 2026-07-26); aggiornamenti MySpace/Ricordi/Mappa 2026-07-27; Ricordami UI/scheduling 2026-07-28; chiarimenti filtro Resource / Strumenti catalogo globale / associazione Diario⇄Viaggio 2026-07-28; creazione/associazione Resource, cardinalità un-Diario-un-Viaggio, Salva con nome esteso, Valigie gemelle 2026-07-28

---

## 1. Principio

Il **Viaggio** è l’**Aggregate Root** del patrimonio personale.

Il **Diario** non è il Viaggio. Il Diario è una risorsa del Viaggio.

```text
📂 Viaggio                         ← Aggregate Root (identità e metadati)
├── 📖 Diario[]                    ← Resource · 0..N · al più un «Diario attivo»
│     └── genera → Roadbook artifacts (snapshot) → libreria sotto
├── 🧳 Valigia[]                   ← Resource · packing di quel Viaggio
├── 📷 Ricordi                     ← Resource container
│     ├── Foto                     ← owned by Viaggio
│     ├── Video                    ← owned by Viaggio
│     └── Note (per giorno)        ← ricordo testuale del giorno
├── 📎 Allegati[]                  ← Resource
├── 🗺️ Roadbook                   ← Library di snapshot persistenti
├── 📍 Mappa                       ← View (unione geolocalizzata)
└── 📊 Riepilogo                   ← View (calcolata + annotazioni leggere)
```

---

## 2. Identità del Viaggio

Appartengono al **Viaggio** (non al Diario):

- titolo
- destinazione
- periodo
- **copertina** — **una sola**; solo **manuale** (carica / sostituisci / elimina); **non** generata automaticamente
- preferenza **Ricordami** (abilitato + scheduling: intervallo mesi **oppure** data specifica one-shot **oppure** data annuale ricorrente) — metadato di prodotto sul Viaggio; UI sulla **riga catalogo** «I miei Viaggi» (sinistra cover — DOC 35 §6.5), con selettore unico modalità e accesso a configurazione personalizzata, non nella cartella e non nella Resource Ricordi
- proprietario
- metadati futuri di identità

Il Diario **descrive** il viaggio (piano / narrazione).  
Il Viaggio **identifica** il patrimonio.

Un Viaggio può esistere **senza** alcuna risorsa (empty) — dati e UI devono ammetterlo.

**UI cover:** preview primaria nel catalogo «I miei Viaggi»; chrome cartella **senza** fascia cover alta (DOC 35 §6).

---

## 3. Stereotipi delle sezioni

| Sezione | Stereotipo | Note |
|---------|------------|------|
| Diario | Resource | 0..N |
| Valigia | Resource | 0..N; ≠ Strumenti |
| Ricordi (Foto, Video, Note-giorno) | Resource | Ownership media sul Viaggio |
| Allegati | Resource | Personali del Viaggio |
| Roadbook | Library | Indice di artefatti snapshot |
| Mappa | View | Non entità CRUD |
| Riepilogo | View | Calcolato + annotazioni leggere |

Definizioni stereotipo → `34A_DOMAIN_DESIGN_RULES.md` §3.

---

## 4. Diario

### 4.0 Ambito della sezione Diario nel dettaglio Viaggio (congelato)

La sezione **Diario** del dettaglio Viaggio **NON** mostra tutti i diari dell’utente.

Mostra **solamente** i diari **associati a quel Viaggio**.

Esempio:

- Viaggio: **Napoli**
- Diari associati: **Tour Napoli**, **Weekend Napoli**
- Nella sezione devono comparire **soltanto** quelli.

Se non esiste alcun diario associato:

- la schermata deve risultare **vuota** (empty state);
- con una CTA per **creare** o **associare** un Diario al Viaggio.

Un Viaggio può avere **N** diari.

I diari **non** associati a un Viaggio appartengono al catalogo globale **MySpace → Strumenti → Diari di Viaggio** (DOC 35 §9), non a questa sezione.

### 4.0.1 Associazione Diario ⇄ Viaggio (congelato)

L’associazione Diario ⇄ Viaggio è una **relazione esplicita** del dominio.

I diari di test presenti prima del go-live **non** devono essere considerati automaticamente associati ai Viaggi.

### 4.0.2 Cardinalità di associazione: un Diario ↔ un solo Viaggio (congelato — Source of Truth)

Un Diario può appartenere ad **un solo** Viaggio.

Mai a due Viaggi contemporaneamente.

Se l’utente desidera riutilizzare un Diario in un altro Viaggio deve utilizzare la funzione **Duplica**.

Il duplicato nasce **senza** associazione.

Successivamente può essere associato ad un altro Viaggio.

### 4.0.3 Crea Diario dal dettaglio Viaggio (congelato — Source of Truth)

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

Flussi gemelli (creazione da Strumenti, Salva con nome esteso, Valigie) → DOC 35 §9.4–§9.9.

### 4.1 Cardinalità

- Un Viaggio ha **0..N Diari**.
- Il modello dati non impone un massimo.
- L’UI permette di gestire più Diari.

### 4.2 Diario attivo

- Al più un **Diario attivo** per Viaggio.
- È il riferimento operativo per: Home, pianificazione, generazione Roadbook, Ricordi basati su Diario, AI operativa futura.
- Non limita il numero totale di Diari.
- Se il Diario attivo viene eliminato: **nessuna auto-promozione**; sceglie l’utente.
- Se non c’è Diario attivo: le funzioni operative che lo richiedono restano in stato vuoto / CTA di scelta (policy UX).

### 4.3 Ruolo

Il Diario è la **narrazione / piano** del viaggio.  
Non è l’archivio multimedia (→ Ricordi).  
Non è l’identità del patrimonio (→ Viaggio).

### 4.4 Persistenza (filosofia invariata; Salva con nome esteso)

Il sistema di salvataggio del Diario resta quello già prodotto: **Salva**, **Salva con nome**, **Auto Save** (toggle).  
Nessuna cronologia versioni.

La **filosofia** di Salva con nome **non** cambia. Vengono soltanto aggiunte nuove possibilità di associazione al Viaggio:

- lasciare il Diario indipendente;
- associarlo ad un Viaggio esistente;
- creare un nuovo Viaggio e salvare contemporaneamente il Diario al suo interno.

Dettaglio prodotto → DOC 35 §9.6. Nessuna modifica architetturale alla filosofia di salvataggio esistente oltre a questa estensione.

---

## 5. Roadbook (Library)

Nella sezione Roadbook del dettaglio Viaggio: mostra **esclusivamente** i Roadbook **associati al Viaggio corrente**.

| Aspetto | Regola |
|---------|--------|
| Generazione | Sempre da un **Diario** |
| Artefatto | Snapshot **persistente e immutabile** rispetto a successive modifiche del Diario |
| Collocazione UX | Sezione **Roadbook** del Viaggio = libreria di tutti gli artefatti del Viaggio |
| Ownership patrimonio | Artefatto del patrimonio del Viaggio (recuperabile nel tempo; contenuto a pagamento / crediti) |
| Metadati minimi | Riferimento Diario sorgente · riferimento Viaggio · nome · data creazione · dati utili al recupero |

Cardinalità tipica: N artefatti per Viaggio; più artefatti possono derivare dallo stesso Diario.

Policy su delete Diario con Roadbook esistenti e regole di rigenerazione/crediti → specifica implementativa (non dominio).

---

## 6. Ricordi

Nella sezione Ricordi del dettaglio Viaggio: mostra **esclusivamente** foto e video (e note-giorno) **associati al Viaggio**.

### 6.1 Contenuto

- **Foto** e **Video** — appartengono al **Viaggio**.
- **Note per giorno** — ricordo testuale di quel giorno nella struttura Ricordi.
- Il Diario resta la narrazione strutturata; Ricordi è il patrimonio multimediale organizzato nel tempo.

### 6.2 Struttura dei giorni (due modalità)

| Modalità | Sorgente struttura |
|----------|-------------------|
| Ricordi del Viaggio | Periodo del Viaggio → un giorno per ciascuna data del periodo |
| Ricordi basati su un Diario | Timeline del Diario selezionato |

In entrambi i casi:

- Foto/Video restano owned by Viaggio;
- il Diario, se usato, è solo **riferimento temporale**;
- ownership non cambia.

### 6.3 Libreria viaggio ∪ libreria giorno (UX canonica)

Senza giorno selezionato: colonna giorni + cartelle **FOTO** / **VIDEO** = **tutto** il media del Viaggio.  
Con giorno selezionato: cartelle **FOTO – Giorno X** / **VIDEO – Giorno X** = solo quel giorno.  
Un solo sistema Resource; due ambiti di filtro (viaggio vs giorno).

### 6.4 Gestione media (definitiva)

- Foto e Video appartengono **sempre** al **Viaggio**. L’associazione a uno o più giorni è solo un **collegamento logico** di organizzazione; il contenuto resta **unico** nel patrimonio del Viaggio.
- Foto e Video sono gestiti **liberamente** dall’utente.
- Lo stesso elemento può appartenere a **più giorni** contemporaneamente.
- Foto e Video possono essere **spostati** da un giorno a un altro.
- L’eliminazione di un contenuto rimuove il contenuto **soltanto dal Viaggio** (patrimonio TouringDiary).
- **Non** è prevista eliminazione automatica dal telefono, da Google Foto, iCloud, Dropbox, OneDrive o altri cloud esterni. TouringDiary gestisce **esclusivamente** i propri dati; l’originale dell’utente resta dove l’utente lo ha salvato.

---

## 7. Allegati

File personali legati al Viaggio.  
Nella sezione Allegati del dettaglio Viaggio: mostra **esclusivamente** gli allegati **associati al Viaggio**.  
Distinti dagli **Allegati Workspace** (gruppo).  
Non esistono come sezione root di MySpace.

---

## 8. Valigia (del Viaggio)

Packing list appartenente a **quel** Viaggio.  
Nella sezione Valigia del dettaglio Viaggio: mostra **esclusivamente** le valigie **associate al Viaggio corrente**.  
Se non ne esistono: **empty state**.  
Distinta dalle valigie / template permanenti in MySpace → **Strumenti** (catalogo globale, DOC 35 §9).  
Dettaglio packing → `31_PACKING_SUITCASE_SYSTEM.md`.

### 8.1 Stesse regole di creazione / associazione / Salva con nome del Diario (congelato — Source of Truth)

Le **stesse identiche regole** del Diario devono valere per le **Valigie**:

- Creazione dal dettaglio Viaggio (modale Design System; associazione automatica al Viaggio corrente; popolamento; apertura immediata — DOC 35 §6.4.4).
- Creazione da Strumenti (senza Viaggio / Viaggio esistente / nuovo Viaggio — DOC 35 §9.5 / §9.8).
- Salva con nome esteso (indipendente / associa esistente / crea nuovo Viaggio — DOC 35 §9.6 / §9.8).
- Creazione contestuale del Viaggio.
- Associazione ad un Viaggio esistente.
- Creazione senza alcuna associazione.

### 8.2 Regola di dominio: una Resource personale ↔ un solo Viaggio (congelato)

Una Resource personale (Diario o Valigia) **non** può appartenere contemporaneamente a due Viaggi.

Se l’utente tenta di associare una Resource già associata ad un altro Viaggio, oppure ad un contesto incompatibile, il sistema **non** riutilizza l’originale: propone una **copia**; l’originale resta invariato; la copia viene associata al nuovo Viaggio (DOC 35 §9.7).

### 8.3 Valigie già associate ai Diari (congelato)

L’attuale possibilità di associare una Valigia ad un **Diario** **NON** deve cambiare.

Tuttavia: se una Valigia risulta già associata ad un Diario oppure ad un altro Viaggio, e l’utente tenta di associarla ad un **nuovo Viaggio**, il sistema deve proporre la creazione di una **copia**, con modale che spiega chiaramente il motivo (DOC 35 §9.9).

Obiettivo: evitare che modifiche future si propaghino involontariamente su più contesti.

---

## 9. Mappa (View)

Vista geografica **interattiva** del patrimonio del Viaggio.

Nella sezione Mappa del dettaglio Viaggio: mostra **esclusivamente**:

- POI
- PIN
- Mappa

associati al **Viaggio corrente**.

**Prodotto:** mappa **Google Maps embedded** (come nelle città), con:

- pin sugli elementi geolocalizzati;
- con molti POI: **clustering** dei marker (zoom basso → gruppi; zoom crescente → cluster che si dividono; zoom opportuno → pin singoli). Il clustering è **esclusivamente** una tecnica di **visualizzazione** (legibilità/prestazioni): **non** crea nuove entità, **non** modifica i POI, **non** modifica il dominio, **non** introduce strutture dati dedicate, **non** altera la navigazione;
- click sul **pin singolo** → apertura della **pagina completa del POI**.

Unisce **tutti** gli elementi geolocalizzati del Viaggio, ad esempio:

- POI presenti nei Diari;
- Foto / Video con coordinate GPS;
- future risorse geolocalizzate.

Qualità grafica e navigazione sono requisiti di prodotto fondamentali.

---

## 10. Riepilogo (View)

Sostituisce la precedente etichetta «Statistiche».

Nella sezione Riepilogo del dettaglio Viaggio: mostra il riepilogo di **tutte** le Resource **associate al Viaggio**.

| Livello | Natura |
|---------|--------|
| Generale | Vista aggregata del Viaggio (giorni, periodo, km, POI, categorie, città, …) + annotazioni utente (luogo preferito, note) |
| Per giorno | Dettaglio giornaliero calcolato + annotazioni del giorno |

Le annotazioni utente **non** trasformano il Riepilogo in Resource CRUD peer delle altre sezioni.

---

## 11. AI

L’AI **non** è una sezione del Viaggio.  
È capacità trasversale. Gli artefatti prodotti diventano Resource (o Library items) nella sezione appropriata.

---

## 12. Fuori dal Viaggio

| Elemento | Collocazione |
|----------|--------------|
| Preferiti | MySpace root — stato globale dell’oggetto |
| **Strumenti** | MySpace root — **catalogo globale** personale **non filtrato** per Viaggio: **Diari di Viaggio** (tutti i diari) · **Valigie** (tutte) · **Template** (tutti). Layout: tre card affiancate (desktop/tablet); tre card verticali (mobile). Apertura Resource = **diretta** (nessuna schermata intermedia). Creazione / Salva con nome / associazione → DOC 35 §9.4–§9.9. |
| Account / Supporto / Wallet | Account |
| Community pubblica | Pubblicazione tipicamente da un **Diario**, non share del Viaggio |
| Workspace | Copie collaborative — mai il Viaggio originale |

**Regola di distinzione (congelata):**

- **Strumenti** = catalogo personale globale.
- **Dettaglio del Viaggio** = catalogo contestuale filtrato sulle Resource associate a quel Viaggio.

---

## 13. Collaborazione (confine)

- Share per risorsa (Diario, Valigia, Template, …) resta ammesso.
- Creazione Workspace **da un Viaggio**: selezione risorse → **sole copie** → shell con la stessa struttura logica del Viaggio; sezioni non copiate = vuote.
- Il Viaggio originale non viene mai condiviso.
- MySpace = originali; Workspace = copie.
- **Le modifiche agli originali non aggiornano le copie Workspace.**
- **L’eliminazione dell’originale non elimina la copia Workspace** (e viceversa).

Dettaglio → `28_COLLABORATION_WORKSPACE_SYSTEM.md`.

---

## 14. Lifecycle (concettuale)

| Evento | Effetto |
|--------|---------|
| Crea Viaggio | Nasce Aggregate Root; può essere empty |
| Aggiungi / rimuovi Resource | Non altera l’identità del Viaggio |
| Elimina Diario attivo | Attivo → nessuno; utente sceglie |
| Elimina Viaggio | Elimina il patrimonio personale di quel Viaggio (dopo conferma esplicita DOC 35), inclusa la preferenza Ricordami di quel Viaggio; **non** elimina copie Workspace; **non** elimina automaticamente città visitate in Esploratore |
| Elimina Foto/Video Ricordi | Solo dal Viaggio; non da telefono/cloud esterni |
| Genera Roadbook | Nuovo snapshot in libreria; Diario non viene mutato dall’artifact |

---

## 15. Glossario di dominio

| Termine | Significato |
|---------|-------------|
| **Viaggio** | Aggregate Root del patrimonio personale |
| **Diario** | Resource di narrazione/piano del Viaggio |
| **Diario attivo** | Diario di riferimento operativo del Viaggio |
| **Valigia (viaggio)** | Packing list del Viaggio |
| **Strumenti** | Catalogo globale MySpace: Diari · Valigie · Template **non** filtrati per Viaggio (≠ Valigia del Viaggio) |
| **Ricordi** | Patrimonio multimedia + note/giorno |
| **Note Ricordi** | Testo del giorno in Ricordi (≠ note Diario ≠ annotazioni Riepilogo) |
| **Note Diario** | Contenuto narrativo/piano nel Diario |
| **Annotazioni Riepilogo** | Campi leggeri utente sulla View Riepilogo |
| **Roadbook (artifact)** | Snapshot immutabile generato da un Diario |
| **Roadbook (sezione)** | Library degli artifact del Viaggio |
| **Mappa** | View geografica del patrimonio |
| **Riepilogo** | View aggregata + annotazioni |
| **MySpace** | Casa degli originali |
| **Workspace** | Banco delle copie collaborative |
| **Resource / Library / View** | Stereotipi di sezione — vedi DOC 34A |

---

## 16. Decision Log di dominio (congelato)

| ID | Decisione | Stato |
|----|-----------|-------|
| VD-001 | Viaggio = Aggregate Root; metadati sul Viaggio | Congelato |
| VD-002 | Diario ≠ Viaggio; Diario = Resource | Congelato |
| VD-003 | Diari 0..N; Diario attivo; no auto-promote su delete | Congelato |
| VD-004 | Empty Viaggio ammesso (dati + UI) | Congelato |
| VD-005 | Roadbook: gen da Diario; snapshot/libreria sul Viaggio; immutabile | Congelato |
| VD-006 | Ricordi = Foto + Video + Note/giorno; due modalità struttura giorni | Congelato |
| VD-007 | Riepilogo = View + annotazioni leggere (ex Statistiche) | Congelato |
| VD-008 | Mappa = View unione geolocalizzato | Congelato |
| VD-009 | AI non è sezione | Congelato |
| VD-010 | WS: legacy share risorse + estensione da Viaggio (shell, copie) | Congelato |
| VD-011 | Terminologia funzionale: «Viaggio» (non «Trip») | Congelato |
| VD-012 | Stereotipi Resource · Library · View | Congelato |
| VD-013 | Strumenti ≠ Valigia del Viaggio | Congelato (riaffermazione) |
| VD-014 | Community publish tipicamente da Diario | Congelato (confine) |
| VD-015 | Cover unica, solo manuale; UI primaria catalogo | Congelato 2026-07-27 |
| VD-016 | Ricordami = preferenza su Viaggio (UI catalogo, non Resource Ricordi / non cartella) | Congelato 2026-07-27; UI catalogo 2026-07-28 |
| VD-017 | Mappa = Google Maps embedded + pin/POI | Congelato 2026-07-27 · **raffinato** da VD-019 |
| VD-018 | Ricordi: libreria viaggio ∪ filtro giorno (FOTO/VIDEO) | Congelato 2026-07-27 |
| VD-019 | Mappa: clustering marker (solo view); pin singolo → pagina completa POI. Non crea entità né strutture dati dedicate | Congelato 2026-07-27 · precisato 1.2.1 |
| VD-020 | Ricordi media: multi-giorno; spostamento; delete solo da Viaggio (non telefono/cloud). Giorni = link logici; contenuto unico sul Viaggio | Congelato 2026-07-27 · precisato 1.2.1 |
| VD-021 | Diario: Salva / Salva con nome / Auto Save; no version history. **Filosofia** invariata; **estensione** associazione Viaggio → VD-030 | Congelato 2026-07-27 · esteso 2026-07-28 |
| VD-022 | Originali ↛ sync copie WS; delete originale ↛ delete copia | Congelato 2026-07-27 (riaffermazione) |
| VD-023 | Delete Viaggio → elimina anche preferenza Ricordami di quel Viaggio | Congelato 2026-07-27 |
| VD-024 | Sezioni del dettaglio Viaggio = filtro esclusivo sulle Resource associate a quel Viaggio (Diario/Valigia/Ricordi/Allegati/Roadbook/Mappa/Riepilogo) | Congelato 2026-07-28 |
| VD-025 | Associazione Diario ⇄ Viaggio = relazione esplicita; dati di test non auto-associati | Congelato 2026-07-28 |
| VD-026 | Strumenti = catalogo globale (Diari · Valigie · Template) ≠ dettaglio Viaggio filtrato; layout 3 card | Congelato 2026-07-28 |
| VD-027 | Catalogo «I miei Viaggi» = solo Viaggi (Aggregate Root), non lista diari | Congelato 2026-07-28 |
| VD-028 | Un Diario ↔ un solo Viaggio; riuso su altro Viaggio solo via Duplica (duplicato senza associazione) | Congelato 2026-07-28 |
| VD-029 | Crea Diario dal dettaglio Viaggio: modale DS (nome, dal, al); associa; popola; apre — non editor diretto | Congelato 2026-07-28 |
| VD-030 | Salva con nome: filosofia invariata; opzioni indipendente / Viaggio esistente / nuovo Viaggio | Congelato 2026-07-28 |
| VD-031 | Stesse regole creazione/associazione/Salva con nome per Valigie; Valigia⇄Diario invariata | Congelato 2026-07-28 |
| VD-032 | Resource personale non su due Viaggi; conflitto → proposta copia; originale invariato | Congelato 2026-07-28 |
| VD-033 | Apertura Resource da Strumenti = diretta (Diario · Valigia · Template) | Congelato 2026-07-28 |

Audit funzionale migrazione Account → MyWorld/MySpace/Workspace (evidenze codice) → `35_MYSPACE_PRODUCT_VISION.md` **§15**.  
Audit creazione/associazione/Salva con nome (dominio + codice) → `35_MYSPACE_PRODUCT_VISION.md` **§16**.

---

## 17. Diagramma MySpace → Viaggio

```text
MyWorld
├── MySpace
│     ├── I miei Viaggi          ← solo catalogo Viaggi (non tutti i diari)
│     │     └── [Viaggio]        ← sezioni filtrate su quel Viaggio
│     │           ├── Diario[] (+ attivo)
│     │           ├── Valigia[]
│     │           ├── Ricordi (Foto · Video · Note/giorno)
│     │           ├── Allegati[]
│     │           ├── Roadbook (library)
│     │           ├── Mappa (view)
│     │           └── Riepilogo (view)
│     └── Strumenti              ← catalogo globale: Diari · Valigie · Template
│                                 (apertura Resource diretta — DOC 35 §9.4)
└── Workspace   ← sole copie (mai il Viaggio originale)
```

---

## Cronologia

| Versione | Data | Note |
|----------|------|------|
| 1.0.0 | 2026-07-26 | SoT iniziale post-freeze review architetturale |
| 1.1.0 | 2026-07-27 | Cover manuale unica; Ricordami su Viaggio; Ricordi libreria viaggio/giorno; Mappa embedded |
| 1.2.0 | 2026-07-27 | Ricordi multi-giorno + delete solo TD; Mappa clustering; Diario save as-is; WS no-sync (VD-019…022) |
| 1.2.1 | 2026-07-27 | Media: giorni = link logici; clustering non-entità; delete→Ricordami (VD-019/020 precisati, VD-023) |
| 1.2.2 | 2026-07-28 | Ricordami UI: catalogo (sx cover), non cartella (allinea DOC 35 v2.2.2 / VD-016) |
| 1.2.3 | 2026-07-28 | Ricordami scheduling: intervallo ricorrente, data specifica one-shot oppure ricorrenza annuale (allinea DOC 35 v2.2.3) |
| 1.3.0 | 2026-07-28 | Filtro Resource per Viaggio; associazione Diario⇄Viaggio esplicita; Strumenti = catalogo globale 3 card (VD-024…027); allinea DOC 35 v2.3.0 |
| 1.4.0 | 2026-07-28 | Cardinalità un-Diario-un-Viaggio; create modale; Salva con nome esteso; Valigie gemelle; copia su conflitto (VD-028…033); allinea DOC 35 v2.4.0 |
