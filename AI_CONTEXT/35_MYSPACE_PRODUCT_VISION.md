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

**Versione:** 2.2.1  
**Data:** 2026-07-27  
**Stato:** Product Vision ufficiale — allineata al dominio Viaggio congelato + decisioni UX MySpace 2026-07-27

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

Qui l’utente conserva, organizza, riscopre e valorizza il proprio patrimonio.

MySpace **non** è: workspace rinominato, social, feed, hub di collaborazione, sostituto dell’Account.

MySpace è **privato per natura**. La condivisione è un atto consapevole che porta **copie** in Workspace. L’originale resta in MySpace.

### 2.1 MySpace ≠ Account

| Mondo | Contiene |
|-------|----------|
| **MySpace** | Viaggi, Preferiti, Strumenti, Inviti Workspace, Esploratore |
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
8. **Strumenti ≠ Valigia del Viaggio**.
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
| 4 | **Strumenti** | Elementi autonomi riutilizzabili (valigie, template, utility/AI…) |
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
│     ├── Preferiti            ← vista trasversale (filtri per tipo)
│     ├── Strumenti            ← valigie / template / utility autonome
│     └── Inviti Workspace     ← ricevuti / inviati / pendenti
└── Workspace
```

---

## 6. I miei Viaggi

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
2. **Titolo** e **periodo** del Viaggio.
3. **Preview orizzontale della cover** del Viaggio (sfrutta lo spazio orizzontale libero su desktop). Se la cover **manca**: riquadro con **«+»** molto evidente; al click apre **direttamente** il selettore immagini (**nessuna** finestra intermedia).

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

### 6.4 Sezioni

Aprendo un Viaggio si navigano le sezioni del dominio (DOC 37):

| Sezione | Stereotipo | Ruolo prodotto |
|---------|------------|----------------|
| Diario | Resource | Piano / narrazione (0..N; Diario attivo). **Salvataggio invariato:** Salva · Salva con nome · Auto Save con toggle. Nessuna cronologia versioni. Nessuna modifica architetturale al sistema di salvataggio. |
| Valigia | Resource | Packing di quel viaggio |
| Ricordi | Resource | Foto, Video, Note per giorno — libreria viaggio + libreria giorno (UX → DOC 37 §6) |
| Allegati | Resource | File personali del viaggio |
| Roadbook | Library | Snapshot AI acquistati / generati |
| Mappa | View | **Google Maps embedded**; pin con **clustering** a zoom basso; click sul pin singolo → **pagina completa del POI** (DOC 37 §9) |
| Riepilogo | View | Sintesi calcolata + annotazioni leggere |

### 6.5 Ricordami questo viaggio (ufficiale)

- **Filosofia:** lo scopo **non** è inviare notifiche insistenti. Serve a riportare periodicamente il viaggiatore nel proprio **archivio personale** e a fargli rivivere i propri viaggi.
- **Posizione:** chrome della **cartella** del Viaggio — **non** nella sezione Ricordi.
- Toggle «Ricordami questo viaggio»; se ON → intervallo in mesi (default **12**, default toggle **ON**).
- Salvataggio **immediato** (nessun pulsante Salva).
- Rispetta Centro di Controllo / `feature.comms.notifications`:
  - notifiche sito ON → toggle usabile normalmente;
  - notifiche sito OFF → sui **nuovi** Viaggi il toggle nasce OFF e non attivabile;
  - se l’utente aveva ON e l’admin spegne le notifiche globali → **il valore salvato resta ON**, ma UI in stato **sospeso** (stile distinto + tooltip: notifiche temporaneamente disabilitate dall’amministrazione); al ri-enable globale torna operativo senza perdere la preferenza.
- **Emissione:** ogni Viaggio con Ricordami attivo genera una **notifica indipendente** (N viaggi → N notifiche; **nessun** raggruppamento). La notifica contiene il **collegamento diretto alla cartella** di quel Viaggio (DOC 12).

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

1. **Città Preferite**
2. **Altri Preferiti**
3. **Recap statistico** dei POI preferiti — quantità aggregate per Continente · Nazione · Regione · Zona (aiuta a scoprire concentrazioni di interesse e futuri viaggi).

---

## 8. Esploratore

Esploratore ≠ Ricerca ≠ Scopri ≠ Feed ≠ Community.

È **esclusivamente** l’**archivio personale** del viaggiatore (nel tempo: città visitate/salvate, luoghi scoperti, raccolte, cronologia).  
Distinto dal **Riepilogo** del singolo Viaggio (DOC 37).

**Città visitate:** aggiunte **automaticamente**; rimozione **manuale** ammessa. L’eliminazione di un Viaggio **non** elimina automaticamente una città visitata.

---

## 9. Strumenti

Elementi **autonomi e riutilizzabili**: possono esistere **indipendentemente da qualsiasi Viaggio** (valigie permanenti, template, utility / AI tools futuri).  
La valigia di un viaggio vive **dentro** quel Viaggio (DOC 31 / DOC 37).

---

## 10. Inviti Workspace

Ponte verso Workspace: inviti ricevuti, inviati, richieste pendenti. L’invito si **risolve** nel mondo Workspace.

---

## 11. Linee guida UX

### Salvataggio

Messaggi di conferma di elementi importanti ricordano che l’elemento è ritrovabile in MySpace.

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
| PV-002 | Diario: Salva / Salva con nome / Auto Save; no cronologia versioni | Congelato 2026-07-27 (invariato as-is) |
| PV-003 | Preferiti: no cartelle; layout Città Preferite · Altri Preferiti · Recap POI (Continente/Nazione/Regione/Zona). **Sostituisce** la precedente organizzazione «POI Preferiti a filtri multipli (incl. Città/Categoria)» documentata fino a v2.1.1 | Congelato 2026-07-27 |
| PV-004 | Città Preferita ammissibile anche se non visitata | Congelato 2026-07-27 |
| PV-005 | Esploratore: città visitate auto + rimozione manuale; delete Viaggio ↛ delete città visitata | Congelato 2026-07-27 |
| PV-006 | Ricordami: N notifiche indipendenti + deep link cartella Viaggio | Congelato 2026-07-27 |
| PV-007 | Mappa Viaggio: clustering marker + pin → pagina completa POI (solo visualizzazione) | Congelato 2026-07-27 |
| PV-008 | Catalogo: ordinamento utente persistente; nascondi gruppi Prossimi/Passati vuoti; «+» cover → selettore diretto | Congelato 2026-07-27 |
| PV-009 | Delete Viaggio → elimina anche promemoria Ricordami di quel Viaggio | Congelato 2026-07-27 |
| PV-010 | Breadcrumb: ogni livello cliccabile | Congelato 2026-07-27 (riaffermazione) |

---

## Cronologia

| Versione | Data | Note |
|----------|------|------|
| 1.x | 2026-07-24/25 | Visioni precedenti MySpace (pre-freeze dominio) |
| 2.0.0 | 2026-07-26 | Riscrittura completa su dominio Viaggio congelato; no Diario≡Viaggio |
| 2.1.0 | 2026-07-27 | Cover manuale unica + catalogo; cartella compatta; Ricordami ufficiale; Preferiti vista; Esploratore archivio; memoria navigazione; Mappa embedded |
| 2.1.1 | 2026-07-27 | Rafforzamento: memoria percorso completo; cover ≠ Ricordo; filosofia Ricordami; Esploratore/Preferiti/Strumenti |
| 2.2.0 | 2026-07-27 | Catalogo Prossimi/Passati; delete checkbox; Preferiti layout+recap (PV-003); Esploratore città; Ricordami N notifiche; Mappa clustering |
| 2.2.1 | 2026-07-27 | Sort persistente; sezioni vuote nascoste; «+» diretto; delete→Ricordami; breadcrumb (PV-008…010) |
