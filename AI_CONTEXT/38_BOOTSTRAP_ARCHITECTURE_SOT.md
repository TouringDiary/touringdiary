# 38 — Bootstrap Architecture — Source of Truth

| Campo | Valore |
|-------|--------|
| **ID documento** | DOC-38 |
| **Titolo** | Architettura del Bootstrap — Source of Truth |
| **Tipo** | Conoscenza architetturale (SoT) — **non** piano di implementazione |
| **Stato** | Attivo — memoria tecnica definitiva del bootstrap |
| **Creato** | 2026-07-30 |
| **Ultimo aggiornamento conoscenza** | 2026-08-01 (rev. K — motivazione architetturale nascita MP-03 sotto PO-BOOT-04) |
| **Workflow correlato** | `AI_DEV_WORKFLOW/WORKFLOWS/WF_PERF_01_PERFORMANCE_OPTIMIZATION.md` (solo operativo; **non** SoT architetturale) |
| **Masterplan implementativo correlato** | `AI_DEV_WORKFLOW/MASTERPLANS/MP_03_HOME_BOOTSTRAP_BARREL_OPTIMIZATION.md` (COME — rimozione barrel/import bootstrap Home; **non** sostituisce questo DOC) |
| **Owner** | PO + Architettura |

**Ordine di lettura consigliato:** §0 → **§V** → **§P** → **§R** → §1…§13 → **§S (piani)** → §14.

---

## 0. Protocollo di evoluzione del documento (obbligatorio)

Questo file è la **memoria tecnica definitiva** del bootstrap.  
Ogni futura analisi, misura, decisione PO o falsificazione **deve** aggiornare questo documento.  
**Vietato** ricominciare da zero in chat o in un nuovo file parallelo senza puntatore qui.

### 0.1 Regole di scrittura

| Regola | Dettaglio |
|--------|-----------|
| **Append-first** | Nuove evidenze si aggiungono in §Changelog e nelle sezioni pertinenti. Non cancellare scoperte passate senza registrare la **supersessione**. |
| **Supersessione esplicita** | Se una conclusione precedente risulta FALSA o superata, lasciare la riga storica e aggiungere `SUPERSEDED YYYY-MM-DD → [nuova classificazione + motivo]`. |
| **Classificazione obbligatoria** | Ogni affermazione rilevante porta **una** etichetta (vedi §0.2). Nessuna eccezione. |
| **Decisioni ≠ implementazioni** | Una **DECISIONE DEL PRODUCT OWNER** non implica codice già allineato. Stato implementativo va dichiarato esplicitamente. |
| **Niente patch in questo documento** | Vietati pseudocodice, scelte di formato file, API, lazy-loading come “soluzione”. Solo conoscenza, decisioni, piani di audit, progetti di strumentazione. |
| **Inventari in crescita** | Sezioni Bundle / schede ottimizzazione crescono per appendice; non sostituire un inventario intero senza changelog. |

### 0.2 Classificazioni ammesse (unica etichetta per affermazione)

| Etichetta | Significato |
|-----------|-------------|
| **DIMOSTRATA DAL CODICE** | Verificabile nel repository seguendo un percorso completo |
| **DIMOSTRATA DAL RUNTIME** | Verificabile da misure/log/TAC/build report prodotti in sessione |
| **DECISIONE DEL PRODUCT OWNER** | Vincolo di prodotto approvato (può non essere ancora implementato) |
| **IPOTESI DA VERIFICARE** | Aperta; non base di modifica |
| **NON DIMOSTRABILE** | Non ricavabile da codice/runtime/PO disponibili |

### 0.3 Come aggiungere un nuovo audit (checklist)

1. Aggiungere entry in **§Changelog conoscenza** (data, autore, ambito, sintesi).
2. Aggiornare sezioni colpite (Design, Manifest, Config, Bundle, …).
3. Se esiste decisione PO nuova → **§10 Decisioni PO** + stato implementativo `Non implementato` finché non c’è codice.
4. Se esistono nuove domande → **§11** (solo non dimostrate).
5. Se esistono nuove schede ottimizzazione → **§13** (append).
6. Aggiornare riga **Ultimo aggiornamento conoscenza** in testa.
7. Puntare da WF-PERF-01 / chat al **DOC-38**, non duplicare la SoT altrove.

### 0.4 Struttura capitoli (indice stabile)

| § | Capitolo | Ruolo |
|---|----------|-------|
| 0 | Protocollo evoluzione | Meta — come crescere senza perdere memoria |
| **V** | **Bootstrap Vision** | Filosofia pluriennale del bootstrap |
| **P** | **Bootstrap Principles** | Principi permanenti classificati |
| **R** | **Roadmap Architetturale** | Macro-direzioni (non implementative) |
| 1 | Contesto | Perché l’audit |
| 2 | Obiettivi | Domande poste |
| 3 | Metodologia | Come abbiamo verificato |
| 4 | Scoperte dimostrate | Catalogo fatti classificati |
| 5 | Config | SoT Config bootstrap |
| 6 | Design System (+ Snapshot) | Contratto + decisione Snapshot |
| 7 | Manifest | Contratto + decisione shelf futuro |
| 8 | Classificazione ampiezza Config | Indispensabile / differibile / on-demand |
| 9 | Bundle — conoscenza, piano audit, strumentazione | Pre-motore + audit plan |
| 10 | Decisioni PO | Registro ufficiale |
| 11 | Domande aperte | Solo non dimostrato |
| 12 | Allegato sintesi | Tabella problemi |
| 13 | Inventario ottimizzazioni a rischio nullo | Schede (cresce nel tempo) |
| **S** | **Piani di sviluppo definitivi** | Quattro interventi · ciascuno in **un solo STEP** · pre-approvazione PO |
| 14 | Changelog conoscenza | Append-only |

---

# V. Bootstrap Vision

> Filosofia del bootstrap di TouringDiary per i prossimi anni.  
> **Non** descrive implementazioni, formati, API o piani di coding.

## V.1 Promessa all’utente

Il bootstrap esiste per **aprire il negozio**, non per svuotare il magazzino in anticamera.

Nei prossimi anni, l’esperienza di ingresso (Home pubblica) deve significare:

1. **Presenza immediata** — la vetrina appare il prima possibile.
2. **Completezza progressiva** — stili, catalogo ampio, moduli specialistici arrivano quando servono, senza tenere chiusa la porta.
3. **Scalabilità di prodotto** — l’architettura di avvio è pensata per centinaia/migliaia di città e per un prodotto grande, non per un catalogo di prova.

**Classificazione dell’intento:** **DECISIONE DEL PRODUCT OWNER** (sintesi di PO-BOOT-01…05).

## V.2 Cosa il bootstrap è

| Il bootstrap è… | Nota |
|-----------------|------|
| Il personale che alza la saracinesca e sistema lo **scaffale in vetrina** | Metafora di prodotto |
| Un contratto di **minimo necessario al first paint funzionante** | Allineato a PO-BOOT-02 / PO-BOOT-03 |
| Un percorso che tollera il **raffinamento successivo** (Design remoto, resto catalogo, config specialistiche) | Allineato a PO-BOOT-01 / PO-BOOT-05 |

## V.3 Cosa il bootstrap non è

| Il bootstrap non è… | Nota |
|---------------------|------|
| Il camion dell’intero magazzino città | PO-BOOT-02 |
| Il punto in cui deve completarsi tutto il Design System remoto | PO-BOOT-01 / PO-BOOT-05 |
| Il contenitore di ogni configurazione AI / Admin / Workspace / Valigia | PO-BOOT-03 |
| Un obbligo di ottimizzare il pacchetto motore “a prescindere” | PO-BOOT-04 (solo valutazione effort/beneficio) |

## V.4 Orizzonte pluriennale (senza piano tecnico)

| Orizzonte | Visione |
|-----------|---------|
| Esperienza | Home utile e riconoscibile in tempi percepiti come “immediati”, poi arricchimento silenzioso |
| Dati | First paint su dataset minimo; catalogo e dettagli fuori dal cancello di avvio |
| Aspetto | Base stilistica immediata (Snapshot concettuale); SoT Design resta editoriale; override quando il remoto differisce |
| Governance | Ogni gate futuro deve giustificarsi; la conoscenza vive in DOC-38; i workflow operativi non sostituiscono questa SoT |

**Classificazione:** **DECISIONE DEL PRODUCT OWNER** (visione aggregata).  
Lo scostamento rispetto al codice attuale è dichiarato nelle sezioni §5–§7 (stato “Non implementato” delle decisioni).

---

# P. Bootstrap Principles

Principî **permanenti** emersi dall’audit.  
Ogni principio ha **una sola** classificazione ammissibile in questa lista:  
**DECISIONE DEL PRODUCT OWNER** oppure **DIMOSTRATA DAL CODICE**.

| ID | Principio | Classificazione | Ancoraggio |
|----|-----------|-----------------|------------|
| **BP-01** | La Home deve comparire il prima possibile. | **DECISIONE DEL PRODUCT OWNER** | PO-BOOT-01, Vision §V |
| **BP-02** | Nessuna dipendenza **estetica** può bloccare il rendering della Home. | **DECISIONE DEL PRODUCT OWNER** | PO-BOOT-01; compatibilità di fatto col render senza regole: vedi anche evidenza sotto |
| **BP-02b** | Con regole Design assenti/vuote, i componenti Home montano comunque (hook → stringa vuota; layout hardcoded). | **DIMOSTRATA DAL CODICE** | §6.3 |
| **BP-03** | Il bootstrap deve caricare solo ciò che è necessario al primo rendering funzionante. | **DECISIONE DEL PRODUCT OWNER** | PO-BOOT-03 |
| **BP-04** | Ogni gate verso la Home deve avere una motivazione dimostrabile (codice o decisione PO esplicita); non “perché è sempre stato così” senza prova. | **DECISIONE DEL PRODUCT OWNER** | Governance audit / Vision §V.4 |
| **BP-05** | Le configurazioni specialistiche (AI, Admin, taxonomy, valigia, workspace, …) devono essere caricate quando servono, non come prerequisito implicito della vetrina. | **DECISIONE DEL PRODUCT OWNER** | PO-BOOT-03 |
| **BP-06** | Il catalogo completo città non appartiene al bootstrap. | **DECISIONE DEL PRODUCT OWNER** | PO-BOOT-02 |
| **BP-07** | Il Design System remoto non è una dipendenza del bootstrap; il first paint si basa sul concetto di Design Snapshot, con eventuale override successivo. | **DECISIONE DEL PRODUCT OWNER** | PO-BOOT-05 |
| **BP-08** | Oggi esistono gate Config (`isLoading`) e Manifest (`isLoadingManifest`) che trattengono la Home. | **DIMOSTRATA DAL CODICE** | §4.1 |
| **BP-09** | Il gate Config attuale non valuta i valori delle singole chiavi settings: valuta il completamento di `loadConfig`. | **DIMOSTRATA DAL CODICE** | §4.2 / §5 |
| **BP-10** | Props derivate `featuredCities` e `destinationCities` non sono consumate da `HomeContent`. | **DIMOSTRATA DAL CODICE** | §7.3 |
| **BP-11** | L’ottimizzazione del pacchetto motore non è un mandato automatico: si valuta per effort/beneficio. | **DECISIONE DEL PRODUCT OWNER** | PO-BOOT-04 |
| **BP-12** | La conoscenza architetturale del bootstrap vive solo in DOC-38; i workflow operativi vi puntano senza duplicarla. | **DECISIONE DEL PRODUCT OWNER** | Protocollo §0 + WF-PERF-01 (ruolo) |

**Nota su BP-02 / BP-02b:** la decisione di prodotto (non bloccare per estetica) e il fatto di codice (render già tollerante) sono tenuti distinti di proposito.

---

# R. Roadmap Architetturale

> **Non** è una roadmap implementativa.  
> **Non** parla di STEP, ticket, patch o codice.  
> Individua solo le **macro-direzioni** emerse dall’audit.

## R.1 Bootstrap UX

| Campo | Contenuto |
|-------|-----------|
| **Obiettivo** | First paint Home immediato e utile; raffinamento estetico e di contenuto senza tenere chiusa la vetrina. |
| **Problema che risolve** | Attesa percepita causata da gate che uniscono completezza editoriale/dati ampi al permesso di mostrare la Home. |
| **Documenti coinvolti** | DOC-38 (§V, §P, §6, §10); `AI_CONTEXT/32_DESIGN_SYSTEM_FOUNDATION.md` (SoT Design di prodotto — senza assorbire PO-BOOT-05). |
| **Decisioni PO già presenti** | PO-BOOT-01, PO-BOOT-05; principi BP-01, BP-02, BP-07. |

## R.2 Bootstrap Data

| Campo | Contenuto |
|-------|-----------|
| **Obiettivo** | Contratto dati di avvio = **minimo necessario** alla Home; catalogo e config specialistiche fuori dal cancello di ingresso. |
| **Problema che risolve** | Bootstrap che porta cervello-prodotto intero (Config) e inventario città completo (Manifest) prima della vetrina; modello non adatto al futuro a grande scala. |
| **Documenti coinvolti** | DOC-38 (§5, §7, §8, §10); consumer map e scoperte §4. |
| **Decisioni PO già presenti** | PO-BOOT-02, PO-BOOT-03; principi BP-03, BP-05, BP-06. |

## R.3 Bootstrap Runtime

| Campo | Contenuto |
|-------|-----------|
| **Obiettivo** | Comprendere e governare il costo di avvio del motore (fase pre-vetrina / pacchetto applicazione) come responsabilità distinta dai gate dati. |
| **Problema che risolve** | Confondere “lentozza Home” solo con Config/Manifest, o al contrario solo con il bundle, senza misure e senza mandato chiaro. |
| **Documenti coinvolti** | DOC-38 (§9, §13, §3 TAC); WF-PERF-01 solo come contenitore operativo di eventuali attività di misura/ottimizzazione — **senza** ospitare la conoscenza. |
| **Decisioni PO già presenti** | PO-BOOT-04; principio BP-11. |

## R.4 Bootstrap Governance (trasversale)

| Campo | Contenuto |
|-------|-----------|
| **Obiettivo** | Una sola memoria tecnica (DOC-38); gate giustificati; decisioni PO separate dall’implementazione. |
| **Problema che risolve** | Conoscenza dispersa in chat/workflow; “legacy” non dimostrabile usato come scusa; ricominciare audit da zero. |
| **Documenti coinvolti** | DOC-38 (§0, §10, §11, §14); puntatore in `AI_CONTEXT/README_AI.md`; WF-PERF-01 come riferimento operativo a DOC-38. |
| **Decisioni PO già presenti** | Protocollo §0; BP-04, BP-12; registro §10. |

## R.5 Relazione tra le macro-aree (senza sequenza di delivery)

```text
Bootstrap UX          ← esperienza first paint / non-blocking estetico
        ↕
Bootstrap Data        ← minimo dati all’apertura / catalogo e config fuori gate
        ↕
Bootstrap Runtime     ← costo motore distinto; solo valutazione PO-BOOT-04
        ↕
Bootstrap Governance  ← DOC-38 unica SoT; gate motivati
```

Le frecce indicano **dipendenza concettuale**, non ordine di implementazione.

---

# 1. Contesto

## 1.1 Perché è nato questo audit

**DIMOSTRATA DAL CODICE** + contesto WF-PERF-01: interventi mirati (immagini, overlay, stabilizzazione) non spiegavano da soli l’attesa percepita fino alla Home pubblica.

La domanda architetturale divenne:

> Quali responsabilità devono completarsi prima che un visitatore veda una Home funzionante — e quali sono finite nel percorso critico per comodità storica?

Senza una SoT, ogni modifica al boot rischiava di restare patch locale.

## 1.2 Problema iniziale

All’apertura (Home in modalità app) l’utente non vede subito la vetrina. Esistono:

1. costi **pre-motore** (download/parse/esecuzione del pacchetto applicazione);
2. **gate di dati** post-motore prima della Home.

## 1.3 Sintomi osservati

| Sintomo | Classificazione |
|---------|-----------------|
| Spinner “Sincronizzazione Configurazioni…” a tutto schermo | **DIMOSTRATA DAL CODICE** (`AppCoordinator` + `Config.isLoading`) |
| Spinner “Caricamento Campania Cloud…” in zona contenuto | **DIMOSTRATA DAL CODICE** (pre-S.4) → rimosso su Home `/` in STEP S.4; sostituito da populate progressivo HomeShelf |
| Design caricato nello stesso `loadConfig` che governa il gate Config | **DIMOSTRATA DAL CODICE** |
| Catalogo città completo richiesto prima della vetrina | **DIMOSTRATA DAL CODICE** |
| Fase pre-React rilevante nel totale (~537 ms su ~1173 ms in una sessione TAC) | **DIMOSTRATA DAL RUNTIME** (sessione specifica; non SLA prod) |

## 1.4 Perché analizzare il bootstrap

Ottimizzare senza conoscere le responsabilità produce spostamenti di costo e regressioni su ingressi non-Home. L’obiettivo della fase audit è **conoscenza**, non implementazione.

---

# 2. Obiettivi dell’audit

Domande iniziali e derivate (elenco chiuso di intento; lo stato di risposta vive in §4 e §11):

1. Dove viene speso il tempo fino alla Home?
2. Quali gate esistono dopo l’avvio del motore?
3. Config e Manifest: chi termina per ultimo?
4. Il Design blocca la Home? Come (gate vs render)?
5. La Home può renderizzarsi senza regole Design?
6. Cosa carica Config? Chi legge cosa?
7. Il gate Config usa i **valori** delle chiavi o solo `isLoading`?
8. Cosa scarica il Manifest? Cosa legge la Home?
9. Quali props derivate sono morte?
10. Il modello Manifest scala al futuro (centinaia/migliaia di città)?
11. Quali accoppiamenti strutturali esistono (User↔Manifest, Design↔Config, AI↔fine Manifest)?
12. Quanto pesa il bundle/pre-motore e cosa manca per deciderne l’intervento?
13. Come deve evolvere Design senza essere dipendenza di bootstrap? → **Design Snapshot** (decisione PO 2026-07-30)
14. Come deve evolvere Manifest per il futuro, non per “4 città di oggi”?

---

# 3. Metodologia

## 3.1 Principi

- Separare **codice** · **runtime** · **decisioni di prodotto**.
- Vietato elevare ipotesi a fatti.
- Vietato etichettare “legacy/workaround” senza prova → altrimenti **NON DIMOSTRABILE**.
- Preferire percorsi: consumer → funzione → chiamata → utilizzo.
- Audit avversario: tentare di falsificare conclusioni precedenti.

## 3.2 Verifiche effettuate

| Metodo | Natura | Esito tipico |
|--------|--------|--------------|
| Bootstrap TAC | **DIMOSTRATA DAL RUNTIME** | Ordine/peso fasi in ambiente misurato |
| Analisi percorsi Config / Design / Manifest | **DIMOSTRATA DAL CODICE** | Gate, mapper, fallback |
| Dependency map provider (`AppProviders`) | **DIMOSTRATA DAL CODICE** | Chi inizializza / chi dipende |
| Consumer map Home + Settings keys | **DIMOSTRATA DAL CODICE** | Campi letti vs non letti; props morte |
| Revisione avversaria classificata | Meta-metodo | Falsificazione props `featuredCities` / `destinationCities` |
| Bundle audit con schede a rischio nullo | **Piano** — esecuzione inventario in §13 (in corso di avvio) | Vedi §9 |
| Dump payload prod / KB | Non eseguito in SoT iniziale | **IPOTESI DA VERIFICARE** finché non misurato |

---

# 4. Scoperte dimostrate (catalogo)

## 4.1 Gate

| Scoperta | Classificazione |
|----------|-----------------|
| Gate A = `Config.isLoading` blocca `MainLayout` | **DIMOSTRATA DAL CODICE** |
| `usePartnerIntegrations().loading` è alias di `Config.isLoading` | **DIMOSTRATA DAL CODICE** |
| Gate B = `isLoadingManifest` blocca `HomeContent` in `MainContent` | **DIMOSTRATA DAL CODICE** (pre-S.4) → **eliminato** STEP S.4 (2026-07-31); restano loading locali `citySlug` / `isBuildingVirtual` |
| In una sessione TAC, Config terminava dopo Manifest | **DIMOSTRATA DAL RUNTIME** |
| Pre-React ~537 ms; Home visible ~1173 ms (stessa sessione) | **DIMOSTRATA DAL RUNTIME** |

## 4.2 Config

| Scoperta | Classificazione |
|----------|-----------------|
| `loadConfig`: `loadGlobalCache` → copia `SETTINGS_KEYS` → `getDesignSystemRules` (serie) → `isLoading=false` | **DIMOSTRATA DAL CODICE** |
| Snapshot `/api/bootstrap/all` non popola cache Design (commento anti-overwrite) | **DIMOSTRATA DAL CODICE** |
| Il gate non valuta i valori delle chiavi settings | **DIMOSTRATA DAL CODICE** |
| Indispensabilità prodotto di ogni singola chiave alla Home | **IPOTESI DA VERIFICARE** / non dimostrata come necessità di render |

## 4.3 Design

| Scoperta | Classificazione |
|----------|-----------------|
| Design condivide il gate Config oggi | **DIMOSTRATA DAL CODICE** |
| Hook stili/contenuto: regole assenti → `''` / testo vuoto; nessun throw | **DIMOSTRATA DAL CODICE** |
| Home può renderizzarsi senza Design System | **DIMOSTRATA DAL CODICE** |
| Dipendenza Home↔Design = estetica, non strutturale | **DIMOSTRATA DAL CODICE** |
| Design non deve più essere dipendenza del bootstrap; introdurre Design Snapshot | **DECISIONE DEL PRODUCT OWNER** (PO-BOOT-01 rafforzata + PO-BOOT-05) |

## 4.4 Manifest

| Scoperta | Classificazione |
|----------|-----------------|
| Manifest completo caricato in mode `app` prima della Home | **DIMOSTRATA DAL CODICE** |
| Campi letti vs non letti dalla Home (tabella §7) | **DIMOSTRATA DAL CODICE** |
| Props `featuredCities` e `destinationCities` non usate in `HomeContent` | **DIMOSTRATA DAL CODICE** |
| Filtri/ricerca oggi operano sull’elenco completo in memoria | **DIMOSTRATA DAL CODICE** |
| Bootstrap non dovrà dipendere dall’intero catalogo; Home solo dataset minimo | **DECISIONE DEL PRODUCT OWNER** (PO-BOOT-02 rafforzata 2026-07-30) |
| “Con 4 città funziona quindi il modello va bene” | **SUPERSEDED** — non è criterio di progettazione (decisione PO: progettare per il futuro) |

## 4.5 Accoppiamenti

| Scoperta | Classificazione |
|----------|-----------------|
| `useUser` espone identità + `cityManifest` | **DIMOSTRATA DAL CODICE** |
| `refreshAiQuota` dopo `!isLoadingManifest` | **DIMOSTRATA DAL CODICE** |
| Etichetta “legacy/workaround” su questi accoppiamenti | **NON DIMOSTRABILE** (manca prova di intento) |

---

# 5. Config

## 5.1 Comportamento attuale

**DIMOSTRATA DAL CODICE:** ConfigProvider avvia `loadConfig` → cache settings globale → stato `configs` per `SETTINGS_KEYS` → Design in serie → abbassa `isLoading` → Coordinator monta layout.

## 5.2 Responsabilità che possiede oggi

- Magazzino impostazioni prodotto (AI, taxonomy, POI, eventi, servizi, partner, onboarding, storage, collaborazione, asset, …).
- Flag di caricamento usato come gate UI globale.
- Contenitore runtime delle regole Design (`design_system_rules`).

## 5.3 Distinzione architetturale (conoscenza)

| Possiede oggi | Distinzione emersa |
|---------------|-------------------|
| Gate Home | I **valori** non sono prerquisito di render Home (**DIMOSTRATA DAL CODICE**) |
| SoT tipografica first paint | Estetica; PO impone non-blocking + Snapshot (**DECISIONE DEL PRODUCT OWNER**) |
| Moduli specialistici | On demand per consumer (**DIMOSTRATA DAL CODICE** sui consumer tracciati) |

## 5.4 Dimostrato / non dimostrato

- Dimostrato: ordine load, ampiezza pacco, natura del gate.
- Non dimostrato: inventario chiavi extra-prod, KB payload, intento storico del gate.

## 5.5 Decisione PO collegata

Vedi **PO-BOOT-03** (§10): bootstrap Config solo per Home funzionante; resto al momento corretto.  
**Stato implementativo:** Non implementato.

---

# 6. Design System

## 6.1 Caricamento attuale

**DIMOSTRATA DAL CODICE:**

1. Possibile presenza Design nello snapshot `/api/bootstrap/all`.
2. Client ignora quello snapshot per la cache regole.
3. `getDesignSystemRules` (rete/SoT) in serie dentro `loadConfig`.
4. Esito in `configs` prima di `isLoading=false`.

## 6.2 Perché oggi blocca la Home

**DIMOSTRATA DAL CODICE:** blocco di **gate** (`isLoading`), non di render condizionato al Design nei componenti Home.

## 6.3 Contratto Home ↔ Design (fatti)

| Domanda | Risposta | Classificazione |
|---------|----------|-----------------|
| Throw se Design assente? | No | **DIMOSTRATA DAL CODICE** |
| Spinner Design in Home? | No | **DIMOSTRATA DAL CODICE** |
| Layout hardcoded sufficiente? | Sì | **DIMOSTRATA DAL CODICE** |
| Solo estetica? | Sì | **DIMOSTRATA DAL CODICE** |

## 6.4 Decisioni PO su Design (registro)

### PO-BOOT-01 — Non-blocking

> Il Design System **NON** deve bloccare la Home.  
> La Home deve renderizzarsi immediatamente.  
> Quando il Design termina il caricamento, la UI può aggiornarsi con gli stili definitivi.

**Classificazione:** **DECISIONE DEL PRODUCT OWNER**  
**Stato implementativo:** Implementato — STEP S.1 (Design Snapshot).

### PO-BOOT-05 — Design Snapshot (nuova, 2026-07-30)

> Il Design System **NON** dovrà più essere una dipendenza del bootstrap.  
> Si introduce il concetto di **Design Snapshot**.  
> Obiettivo: non eliminare il Design System; disaccoppiare il first paint dal fetch remoto completo.

**Classificazione:** **DECISIONE DEL PRODUCT OWNER**  
**Stato implementativo:** Implementato — STEP S.1 (Design Snapshot).  
**Mezzo (chiuso in STEP S.1):** `global_settings.design_system_snapshot`.

---

## 6.5 Sezione dedicata — Architettura Conceptual: Design Snapshot

> Questa sezione descrive **solo** il modello decisionale PO.  
> Non contiene scelte tecniche di persistenza o generazione.

### 6.5.1 Catena oggi (as-is)

```text
Admin
  → SoT Design (remoto)
    → Bootstrap (attende Design nel load Config)
      → Home
```

**DIMOSTRATA DAL CODICE** sul tratto Bootstrap→attesa Design→Home.

### 6.5.2 Catena voluta (to-be decisionale)

```text
Admin
  → Design System (SoT editoriale)
    → Generazione automatica Design Snapshot
      → Bootstrap legge immediatamente Design Snapshot
        → Home visibile
          → Arriva Design System remoto
            → Se esistono differenze → override della UI
```

**Classificazione della catena to-be:** **DECISIONE DEL PRODUCT OWNER** (PO-BOOT-05).  
Stato codice: **Implementato — STEP S.1 (Design Snapshot).**

### 6.5.3 Perché questo approccio elimina il gate del Design

| Motivo | Classificazione |
|--------|-----------------|
| Il first paint non aspetta più il round-trip remoto delle regole complete | **DECISIONE DEL PRODUCT OWNER**; eliminazione del wait Design remoto sul gate Config = **Implementato — STEP S.1** |
| Lo Snapshot è disponibile al bootstrap come base immediatamente applicabile (concetto) | **DECISIONE DEL PRODUCT OWNER** |
| Il remoto diventa **raffinamento/override**, non **chiave della porta** | **DECISIONE DEL PRODUCT OWNER** |
| Allineato al fatto già dimostrato che la Home renderizza anche senza regole | **DIMOSTRATA DAL CODICE** (compatibilità di principio col non-blocking) |

### 6.5.4 Vantaggi (decisionale / architetturale)

| Vantaggio | Nota | Classificazione |
|-----------|------|-----------------|
| Home visibile senza attendere Design remoto | Esperienza first paint | **DECISIONE DEL PRODUCT OWNER** |
| Design System resta SoT editoriale admin | Non si elimina il sistema | **DECISIONE DEL PRODUCT OWNER** |
| Override quando il remoto differisce dallo Snapshot | Coerenza progressiva UI | **DECISIONE DEL PRODUCT OWNER** |
| Compatibile col render già tollerante a regole vuote | Riduce rischio funzionale del non-blocking | **DIMOSTRATA DAL CODICE** (tolleranza attuale) |

### 6.5.5 Problemi che risolve

| Problema as-is | Risoluzione concettuale Snapshot |
|----------------|----------------------------------|
| Design dentro `loadConfig` → gate Home | Snapshot fuori dal “attendi remoto” |
| Freschezza admin vs hot path visitatore accoppiati | Remoto resta freschezza; Snapshot serve il boot |
| Paura di Home “senza stile” | Snapshot fornisce base immediata; override poi |

**Classificazione:** mappa problema→intento = **DECISIONE DEL PRODUCT OWNER**.  
Efficacia misurata post-implementazione = futuro **DIMOSTRATA DAL RUNTIME**.

### 6.5.6 Aspetti da progettare successivamente (solo elenco — niente soluzione qui)

| Aspetto | Stato |
|---------|--------|
| Forma dello Snapshot (mezzo di trasporto/persistenza) | **Da progettare** — vietato decidere in DOC-38 ora |
| Momento e trigger della “generazione automatica” post-Admin | **Da progettare** |
| Semantica di “differenza” e regole di override UI | **Da progettare** |
| Comportamento se Snapshot assente/corrotto | **Da progettare** |
| Relazione con cache Design attuale e anti-overwrite bootstrap | **Da progettare** (oggi anti-overwrite è **DIMOSTRATA DAL CODICE**) |
| Misura di successo (first paint senza gate Design) | **Da definire** in verifica PO post-lavoro |

---

# 7. Manifest

## 7.1 Comportamento attuale

**DIMOSTRATA DAL CODICE:** in mode `app`, caricamento inventario città ampio + zone → `CitySummary[]` → gate `isLoadingManifest` → Home.

## 7.2 Dati scaricati vs letti

- **Scaricati:** contratto ampia selezione / schede ricche (**DIMOSTRATA DAL CODICE** sul client; colonne prod esatte = **IPOTESI DA VERIFICARE** senza dump).
- **Letti dalla Home/filtri/ricerca:** id, name, imageUrl, visitors, isFeatured, specialBadge, homeOrder, zone, tourist_zone_id, region_id, cityTypes, description, rating, coords (se GPS), slug (key), adminRegion/nation/continent (allineamento filtri).
- **Mai letti dalla Home (perimetro auditato):** tags, image_* strutturati, hero* città, status, date, classificationExplainability, hasGeneratedContent, slug geo.

## 7.3 Props morte

| Prop | Esito | Classificazione |
|------|-------|-----------------|
| `featuredCities` | Passata a `HomeContent`, non usata nel body | **DIMOSTRATA DAL CODICE** |
| `destinationCities` | Idem | **DIMOSTRATA DAL CODICE** |

## 7.4 Criterio di progettazione — futuro, non “4 città”

**DECISIONE DEL PRODUCT OWNER (2026-07-30):**  
Non è accettabile basare l’architettura sul fatto che oggi il catalogo sia piccolo.  
TouringDiary **non** nasce per restare a poche città.  
Si progetta per il **futuro** (centinaia/migliaia).

## 7.5 Decisione PO Manifest (rafforzata)

### PO-BOOT-02

> Il bootstrap **NON** dovrà più dipendere dal caricamento dell’intero catalogo città.  
> La Home dovrà ricevere **esclusivamente** il dataset minimo necessario al primo rendering.  
> Tutto il resto dovrà arrivare successivamente.

**Classificazione:** **DECISIONE DEL PRODUCT OWNER**  
**Stato implementativo:** Non implementato.  
**Vietato in DOC-38 ora:** progettare API, lazy-loading, forma dello shelf, implementazione.

## 7.6 Scalabilità (conoscenza)

| Affermazione | Classificazione |
|--------------|-----------------|
| Il contratto attuale è “catalogo completo prima della vetrina” | **DIMOSTRATA DAL CODICE** |
| Quel contratto non è il target PO per il futuro | **DECISIONE DEL PRODUCT OWNER** |
| Soglie UX quantitative di rottura per device | **IPOTESI DA VERIFICARE** fino a misure |

---

# 8. Classificazione ampiezza Config (conoscenza)

Non è un piano di spostamento. Classifica solo.

| Classe | Significato in DOC-38 | Esempi / nota | Classificazione della classe |
|--------|----------------------|---------------|------------------------------|
| Indispensabile al **gate attuale** | Senza completare `loadConfig` la Home non monta oggi | Unità load settings+Design | **DIMOSTRATA DAL CODICE** |
| Indispensabile ai **valori** per render Home | Valore chiave richiesto dal JSX Home | Nessun valore dimostrato | **DIMOSTRATA DAL CODICE** (assenza) |
| Utile ma differibile | Arricchimento post-mount con fallback | typing AI, travel styles Hero | **DIMOSTRATA DAL CODICE** (timing) |
| On demand | Solo moduli/Admin/AI/workspace/valigia/GPS click | gran parte `SETTINGS_KEYS` | **DIMOSTRATA DAL CODICE** (consumer) |

**PO-BOOT-03:** bootstrap solo per Home funzionante; resto al momento corretto.  
**DECISIONE DEL PRODUCT OWNER** — Non implementato.

---

# 9. Bundle — conoscenza, piano audit, strumentazione

## 9.1 Ciò che sappiamo

| Fatto | Classificazione |
|-------|-----------------|
| Esiste fase pre-motore misurabile e rilevante | **DIMOSTRATA DAL RUNTIME** (sessione TAC) |
| I gate Config/Manifest sono un problema distinto dal peso motore | **DIMOSTRATA DAL CODICE** + **DIMOSTRATA DAL RUNTIME** |
| Esistono strumenti diagnostici temporanei Bundle Audit (S.3) rimovibili; nessuna ottimizzazione prodotto collegata | **DIMOSTRATA DAL CODICE** (script + npm `bundle:audit*`) |

## 9.2 Ciò che non sappiamo

| Lacuna | Classificazione |
|--------|-----------------|
| Breakdown del entry bundle per responsabilità | **IPOTESI DA VERIFICARE** — strumenti S.3 pronti (`npm run bundle:audit`); interpretazione umana ancora aperta |
| Inventario completo ottimizzazioni a rischio nullo | Strumenti creati (S.3); schede peso-modulo §13 ancora da popolare post-campagna misura |
| ROI effort/beneficio interventi bundle | **IPOTESI DA VERIFICARE** (PO-BOOT-04 — nessuna ottimizzazione in S.3) |

## 9.3 Decisione PO Bundle

### PO-BOOT-04

> L’ottimizzazione del bundle verrà valutata successivamente in funzione del rapporto effort/beneficio.  
> Non rappresenta attualmente una decisione approvata di intervento implementativo.

**DECISIONE DEL PRODUCT OWNER.**

#### Nota — nascita del Masterplan implementativo (MP-03)

Durante la campagna Bundle Audit è emerso che una parte del costo del bootstrap non deriva solo dal peso degli asset, ma anche da **dipendenze statiche** introdotte da barrel e import non necessari al first paint.

Questo ha reso necessario un **Masterplan implementativo dedicato** (`AI_DEV_WORKFLOW/MASTERPLANS/MP_03_HOME_BOOTSTRAP_BARREL_OPTIMIZATION.md`), che descrive esclusivamente il **COME** eliminare tali dipendenze dal path sync della Home, **senza** alterare Vision, Principles né le decisioni architetturali di questo documento.

| Ruolo | Documento |
|-------|-----------|
| **COSA** (architettura bootstrap) | DOC-38 (questo file) |
| **COME** (piano di implementazione) | MP-03 |

Dettaglio operativo, STEP e elenco interventi: solo in MP-03 — **non** duplicati qui.

## 9.4 Piano dell’audit Bundle (conoscenza + metodo — non implementazione prodotto)

Obiettivo dell’audit: produrre un **report testuale** copiabile in chat e schede §13 a **rischio eliminazione nullo/basso**, senza HTML/grafici.

### Fase B1 — Build analisi

1. Eseguire build di produzione Vite con metadati moduli (manifest/rollup).
2. Generare elenco moduli entry + chunk con dimensioni (byte grezzi e gzip se disponibile dal tool).
3. Output: file/log **solo testo** (TSV o sezioni markdown).

### Fase B2 — Grafo import verso bootstrap

1. Partire da entry (`index.html` → `src/index.tsx` → `AppProviders` → coordinator).
2. Per ogni modulo “pesante” o sospetto: chi lo importa, percorso di esecuzione, se è nel grafo sync del boot.
3. Classificare: necessario al bootstrap / teoricamente differibile (**senza** proporre come farlo).

### Fase B3 — Inventario rischio nullo

1. Compilare schede §13 **solo** con evidenza (grep/consumer/build/runtime).
2. Escludere schede basate su “sembra inutilizzato” → **NON DIMOSTRABILE** se manca prova.
3. Priorità: rischio eliminazione **nullo**, poi **basso**.

### Fase B4 — Consolidamento in DOC-38

1. Append changelog.
2. Append schede §13.
3. Aggiornare §9.1/9.2 con fatti **DIMOSTRATA DAL RUNTIME** / **DAL CODICE**.

**Stato piano:** strumenti diagnostici **creati** (STEP S.3, 2026-07-31). Campagna di misura / popolamento schede §13 = attività di conoscenza successiva. **Nessuna** ottimizzazione prodotto in S.3.

## 9.5 Strumentazione temporanea Bundle Audit

> **STEP S.3 implementato (2026-07-31).**  
> Strumenti creati e rimovibili. **Nessuna** ottimizzazione runtime di prodotto.  
> **Nessuna** modifica al comportamento applicativo (solo script diagnostici + npm script).

| ID strumento | Scopo | Input | Output testuale | Note |
|--------------|-------|-------|-----------------|------|
| `scripts/_bundle_audit_build.mjs` | Avviare `vite build --manifest` e confermare `dist/` | repo root | Log exit code + top-level `dist/` + path manifest | Temporaneo |
| `scripts/_bundle_audit_report.mjs` | Leggere `dist/`; byte + gzip offline; schede `### MODULO:` | `dist/` | Markdown/testo (§9.5) + top N | No HTML |
| `scripts/_bundle_import_trace.mjs` | Grafo import statici da `src/index.tsx` (profondità N) | entry TS/TSX | Albero: file → chi_importa → percorso → bootstrap_statico | Solo static import |
| npm `bundle:audit` (+ `:build` / `:report` / `:trace`) | Sequenza build → report → trace | — | Log concatenato stdout | Prefisso `bundle:audit*` |

**Istruzioni rimozione (fine campagna):** eliminare i tre script `_bundle_audit_*` / `_bundle_import_trace.mjs`, le quattro chiavi npm `bundle:audit*`, lasciare in DOC-38 solo risultati classificati. Non committare `dist/`.

### Formato report Bundle (obbligatorio, testuale)

Per ogni modulo rilevante del bootstrap:

```text
### MODULO: <id o path>
dimensione_bytes: …
dimensione_gzip_bytes: … | NON DIMOSTRABILE
quando_caricato: entry-sync | dynamic-import | NON DIMOSTRABILE
chi_lo_importa: …
perché_importato: … | NON DIMOSTRABILE
necessario_bootstrap: SI | NO | IPOTESI DA VERIFICARE
teoricamente_differibile: SI | NO | IPOTESI DA VERIFICARE
classificazione_evidenza: DIMOSTRATA DAL CODICE | DIMOSTRATA DAL RUNTIME | …
```

### Cosa la strumentazione NON deve fare

- Non modificare il comportamento utente in build normale.
- Non introdurre dipendenze di produzione permanenti senza PO.
- Non produrre HTML/immagini/grafici.
- Non implementare code splitting di prodotto.

---

# 10. Decisioni già approvate dal Product Owner

| ID | Decisione | Data | Stato codice |
|----|-----------|------|--------------|
| **PO-BOOT-01** | Design non blocca Home; render immediato; stili definitivi dopo | 2026-07-30 (audit) | **Implementato** STEP S.1 (2026-07-30) |
| **PO-BOOT-02** | Bootstrap non dipende da catalogo città intero; Home = dataset minimo; resto dopo | 2026-07-30 rafforzata | **Implementato** STEP S.4 (2026-07-31) — gate Manifest rimosso; HomeShelf client; CatalogRest non-blocking |
| **PO-BOOT-03** | Bootstrap Config solo per Home funzionante; resto al momento corretto | 2026-07-30 | **Implementato** STEP S.2 (2026-07-30) — gate Config fullscreen eliminato; `isShellReady` ≠ `isConfigFullyLoaded` |
| **PO-BOOT-04** | Bundle: solo valutazione effort/beneficio; nessun mandato automatico di ottimizzazione | 2026-07-30 | **Piano COME:** MP-03 (2026-08-01) — Pronto per ACCETTO PO; **nessuna** implementazione finché PO non accetta MP-03 e non apre WF esecutivo |
| **PO-BOOT-05** | Design Snapshot → Home → remoto → override | 2026-07-30 | **Implementato** STEP S.1 — mezzo `global_settings.design_system_snapshot` |
| **PO-BOOT-06** | Ricerca e Filtri server-side on-demand; no catalogo intero per ricerca/filtri | 2026-07-30 | Parziale S.4 — Hero usa CatalogRest progressivo (stesso fetch); endpoint query server dedicato **non** introdotto (evita doppia fetch / cambio API in questo STEP) |

Separazione netta: quanto sopra è **DECISIONE DEL PRODUCT OWNER**, non fatto di codice finché “Non implementato”.

---

# 11. Domande ancora aperte

Solo non dimostrato:

1. Inventario chiavi Config reali in produzione + KB.
2. Colonne reali vista/API Manifest per ambiente.
3. KB Manifest × N città in produzione.
4. Specifica UX del “dataset minimo” (conteggio/campi) — oltre ai campi già **letti** (quelli sono **DIMOSTRATA DAL CODICE**).
5. ~~Contratto filtri/ricerca a catalogo iniziale incompleto (prodotto).~~ → **CHIUSO** da **PO-BOOT-06** (server-side on-demand).
6. Mappa bootstrap per ingressi non-Home (deep link, admin, partner).
7. Accettabilità brand visuale Home pre-remoto con solo Snapshot (post-progetto Snapshot).
8. Intentione storica accoppiamenti User/Manifest/AI (**NON DIMOSTRABILE** oggi).
9. TAC/build report su production preview.
10. Contenuto completo §13 (schede rischio nullo) — in attesa esecuzione audit Bundle.
11. ~~Forma tecnica Design Snapshot — esplicitamente non da decidere ora.~~ → Mezzo chiuso in STEP S.1 (`design_system_snapshot` in settings).

---

# 12. Allegato sintesi

| Problema | Scoperta | Certezza | Decisione PO | Futuro intervento (solo nome) |
|----------|----------|----------|--------------|-------------------------------|
| Gate Config | Attende load intero incl. Design | Alta codice | PO-BOOT-01/03/05 | Design Snapshot + Config narrowing |
| Gate Manifest | Catalogo completo | Alta codice | PO-BOOT-02 | Home minimum dataset |
| Design estetico vs gate | Render ok senza regole | Alta codice | PO-BOOT-01/05 | Design Snapshot |
| Props morte Home | featured/destination unused | Alta codice | — | Dead props cleanup (nome solo) |
| Pre-motore | Fase ~0,5 s misurata in sessione | Media runtime | PO-BOOT-04 | Bundle effort/benefit review |
| Scalabilità città | Target futuro ≠ catalogo boot | Decisione PO | PO-BOOT-02 | Catalog growth model |

---

# 13. Inventario ottimizzazioni a rischio praticamente nullo

## 13.1 Template scheda (obbligatorio — non variare)

Ogni scheda futura deve usare **esattamente** questi campi:

```text
────────────────────────
Titolo:
Categoria: (import morto | codice morto | libreria inutilizzata | dipendenza duplicata | tree shaking | chunk | import eager | altro)
Percorso completo:
File di origine:
File che lo importa:
Percorso di esecuzione:
  Da dove parte:
  Dove arriva:
  In quale punto si interrompe:
  Perché:
Consumer:
Classificazione: (Codice morto | Sviluppo incompleto | Legacy | Regressione | Ancora utilizzato)
Come è stato dimostrato: (Codice | Runtime | Build | Consumer map | grep | altro)
Motivazione architetturale: … | NON DIMOSTRABILE
Rischio eliminazione: (nullo | basso | medio | alto)
Beneficio atteso:
Effort stimato:
────────────────────────
```

## 13.2 Stato inventario

| Stato | Dettaglio |
|-------|-----------|
| Rev. B (2026-07-30) | Template e piano definiti. **Nessuna scheda popolata** in questa revisione (strumentazione non ancora creata; audit Bundle non eseguito). |
| STEP S.3 (2026-07-31) | Strumenti §9.5 **creati** (`_bundle_audit_build/report`, `_bundle_import_trace`, npm `bundle:audit`). **Nessuna** ottimizzazione runtime. **Nessuna** nuova scheda peso-modulo popolata automaticamente (flag bootstrap restano IPOTESI — revisione umana). |
| Prossima azione conoscenza | Eseguire `npm run bundle:audit` → classificare evidenze → append schede peso-modulo qui solo se rischio nullo/basso **dimostrabile** |

### Scheda esempio strutturale già dimostrata (prop morta — non bundle byte)

────────────────────────  
**Titolo:** Prop `featuredCities` non consumata da HomeContent  
**Categoria:** codice morto (contratto dati UI)  
**Percorso completo:** `AppRouter` calcola `publicFeatured` → passa `featuredCities` → `HomeContent` destructuring senza uso body  
**File di origine:** `src/components/layout/AppRouter.tsx`  
**File che lo importa:** `src/components/home/HomeContent.tsx`  
**Percorso di esecuzione:**  
- Da dove parte: `MainContent` post-gate Manifest  
- Dove arriva: props `HomeContent`  
- In quale punto si interrompe: nessun riferimento nel body oltre destructuring  
- Perché: nessun identificatore `featuredCities` usato dopo i parametri  
**Consumer:** nessuno nel body HomeContent  
**Classificazione:** Codice morto  
**Come è stato dimostrato:** Codice + grep + consumer map  
**Motivazione architetturale:** NON DIMOSTRABILE (perché la prop fu introdotta)  
**Rischio eliminazione:** basso (rimuovere prop/calcolo; verificare TypeScript callers)  
**Beneficio atteso:** chiarezza contratto Home; riduzione lavoro filtro inutilizzato (byte trascurabili)  
**Effort stimato:** basso  
────────────────────────

────────────────────────  
**Titolo:** Prop `destinationCities` non consumata da HomeContent  
**Categoria:** codice morto (contratto dati UI)  
**Percorso completo:** `AppRouter` `publicDestinations` → `destinationCities` → `HomeContent` unused  
**File di origine:** `src/components/layout/AppRouter.tsx`  
**File che lo importa:** `src/components/home/HomeContent.tsx`  
**Percorso di esecuzione:** analogo a featuredCities  
**Consumer:** nessuno nel body  
**Classificazione:** Codice morto  
**Come è stato dimostrato:** Codice + grep  
**Motivazione architetturale:** NON DIMOSTRABILE  
**Rischio eliminazione:** basso  
**Beneficio atteso:** chiarezza; filtro badge destination ridondante rispetto a `CuratedGridSection`  
**Effort stimato:** basso  
────────────────────────

> Nota: queste due schede **non** sono ottimizzazioni di peso bundle; sono inventario “rischio basso” di chiarezza bootstrap/Home già dimostrato. Le schede peso-modulo arriveranno post-strumentazione.

---

# S. Piani di sviluppo definitivi (pre-approvazione PO)

> **Natura:** progetti architetturali completi, pronti per approvazione PO.  
> **Non** sono workflow esecutivi. **Non** autorizzano codice finché il PO non approva.  
> **Regola di delivery:** ogni intervento sotto, una volta approvato, sarà implementato in **un solo STEP** (vietati micro-STEP, STEP 1A, consegne parziali).  
> **Formato Snapshot / API shelf:** non fissati qui oltre al minimo necessario al contratto; scelte di mezzo (JSON/TS/asset/…) restano aperte in sede di STEP, senza spezzare l’intervento.

## S.0 Sequenza consigliata tra i quattro interventi

| Ordine consigliato | Intervento | Motivo di dipendenza concettuale |
|--------------------|------------|----------------------------------|
| 1 | **S.3 Bundle Audit** (strumenti) | Produce evidenze runtime/build **senza** cambiare comportamento utente; informa priorità ma non blocca gli altri |
| 2 | **S.1 Design Snapshot** | Rimuove Design dal gate; prerequisito concettuale del nuovo Bootstrap |
| 3 | **S.2 Bootstrap** | Ridefinisce gate e Config alla luce di Snapshot + PO-BOOT-03 |
| 4 | **S.4 Manifest** | Dataset minimo Home; può seguire Bootstrap o procedere in parallelo concettuale dopo Snapshot, ma conviene dopo che i gate Config sono già non-blocking |

La sequenza **non** spezza un intervento in sotto-STEP: ogni riga resta un’unità di implementazione intera.

---

## S.1 — DESIGN SYSTEM · Design Snapshot

### S.1.1 Obiettivo

Eliminare il Design System remoto come **dipendenza bloccante** del bootstrap, introducendo il modello **Design Snapshot**: base stilistica immediatamente disponibile all’avvio; Design remoto come raffinamento con **override** se differisce.  
Allineamento: **PO-BOOT-01**, **PO-BOOT-05**, **BP-02**, **BP-07**.

### S.1.2 Architettura proposta

#### Responsabilità

| Ruolo | Possiede | Non possiede |
|-------|----------|--------------|
| **SoT Design (remoto / admin)** | Regole canoniche editabili; verità editoriale | Gate della Home |
| **Generatore Snapshot** | Produce Snapshot coerente con SoT al momento della generazione | Decisione di blocco UI |
| **Snapshot** | Base tipografica/utilità per first paint | Autorità editoriale definitiva se remoto più fresco |
| **Runtime Design (app)** | Applica Snapshot subito; carica remoto; decide override | Caricare Snapshot come prerequisito di rete bloccante |
| **Bootstrap / Config gate** | Non attende più il fetch Design remoto per aprire il layout | Completeness stilistica admin |

#### Ciclo di vita

```text
Admin salva regola Design
  → SoT aggiornata
  → Generazione automatica Snapshot (stesso “momento di verità” del salvataggio)
  → Snapshot pubblicato/disponibile al client
  → Bootstrap legge Snapshot (locale/immediato — mezzo TBD in STEP)
  → Home visibile con stili Snapshot
  → Fetch Design remoto (non gate)
  → Confronto Snapshot vs remoto
  → Se differenze → override UI (stessi hook / stesso bag regole)
```

#### Generazione

- Trigger: ogni mutazione riuscita della SoT Design (salvataggio regola / rebuild cache admin).
- Output: Snapshot versionato (identificativo di generazione obbligatorio nel contratto; mezzo TBD).
- Invariante: Snapshot generato **dopo** persistenza SoT, mai da stato UI non salvato.

#### Invalidazione

- Nuova generazione invalida la generazione precedente (il runtime preferisce Snapshot più recente disponibile).
- Snapshot assente/corrotto: Home resta montabile (**BP-02b**); stili vuoti o fallback Snapshot di emergenza minimo (contratto da chiudere in STEP senza reintrodurre gate remoto).

#### Aggiornamento / Override remoto

- Remoto arriva in background.
- **Stessa forma semantica** delle regole già consumate da `useDynamicStyles` / `useDynamicContent` (mappa per `component_key`).
- Se remoto ≡ Snapshot (stesso contenuto rilevante): nessun flicker obbligatorio.
- Se remoto ≠ Snapshot: sostituzione del bag regole attivo → re-render estetico (comportamento invariato).

#### Bootstrap

- `loadConfig` **non** include più `await getDesignSystemRules()` nel percorso che tiene `isLoading=true`.
- Applicazione Snapshot: **prima** o **insieme** al first paint, senza spinner Config dipendente dal remoto.
- Opzione ammessa nel contratto: Snapshot già incluso nel pacchetto client o letto da canale locale; **non** “attendi remoto poi Snapshot”.

#### Punti di integrazione

| Punto | Ruolo |
|-------|--------|
| Salvataggio Design admin | Trigger generazione Snapshot |
| Runtime regole (`configs.design_system_rules` o equivalente) | Seed da Snapshot; poi merge/replace remoto |
| `useDynamicStyles` / `useDynamicContent` | Consumer invariati a livello di contratto (leggono bag attivo) |
| `loadGlobalCache` / commento anti-overwrite | Rivalutare: Snapshot e remoto hanno ruoli distinti; anti-overwrite admin non deve reintrodurre gate visitatore |

#### Fuori scope di questo intervento (esplicito)

- Redesign del Design System Foundation / editor.
- Cambio semantica delle `StyleRule`.
- ~~Scelta definitiva del mezzo Snapshot~~ → **Chiusa in STEP S.1:** persistenza in `global_settings` chiave `design_system_snapshot` (payload versionato).

### S.1.3 File che saranno coinvolti (previsione)

| Area | File / zone (indicativi) |
|------|---------------------------|
| Load Config | `src/context/ConfigContext.tsx`, `src/services/settingsService.ts` (`getDesignSystemRules`, cache Design, eventuale API bootstrap) |
| Admin Design save | pannelli Foundation / Design System settings, `updateDesignSystemRule` / `rebuildDesignSystemCache` |
| Consumer stili | `src/hooks/useDynamicStyles.ts`, `src/hooks/useDynamicContent.ts` (solo se serve segnale “fonte attiva”) |
| Server bootstrap | `server/routes/bootstrap.routes.ts` (se Snapshot o meta-generazione toccano lo sportello) |
| Documentazione | DOC-38, DOC-32 (riferimento Foundation senza contraddizione) |

### S.1.4 Modifiche previste (contratto, non patch)

1. Separare **ready-for-layout** da **Design remoto ready**.
2. Introdurre pipeline generazione Snapshot su save SoT.
3. Seed runtime da Snapshot; fetch remoto async; override su diff.
4. Rimuovere Design remoto dal percorso `isLoading` Config.
5. Aggiornare DOC-38 stato PO-BOOT-01/05 → implementato (post-STEP).

### S.1.5 Rischi

| Rischio | Gravità | Nota |
|---------|---------|------|
| Flicker stilistico Snapshot→remoto | Media | Mitigare con confronto e apply solo su diff |
| Snapshot stale vs SoT | Alta se generazione fallisce silenziosa | Generazione deve fallire in modo visibile in Admin |
| Doppia fonte confusa in Admin preview | Media | Preview admin resta su SoT remoto |
| Reintroduzione accidentale del gate | Alta | Test accettazione: layout senza rete Design |

### S.1.6 Regressioni da prevenire

- Admin non salva più regole / cache non si invalida.
- Home “salta” tipografia in loop.
- Timeout Design remoto che oggi apre il gate: non deve più essere sul critical path.
- `Promise.race` 3s Design non deve più trattenere Config loading.

### S.1.7 Motivazioni

- **DIMOSTRATA DAL CODICE:** Home renderizza senza regole; Design è nel gate solo per accoppiamento `loadConfig`.
- **DECISIONE DEL PRODUCT OWNER:** PO-BOOT-01, PO-BOOT-05.

### S.1.8 Piano definitivo di sviluppo (un solo STEP)

**Nome STEP:** Design Snapshot + Design non-blocking bootstrap.

**Deliverable unici (tutti nello stesso STEP):**

1. Contratto Snapshot (generazione, versione, invalidazione) operativo end-to-end.
2. Runtime: seed Snapshot + remoto async + override.
3. Config: Design remoto fuori da `isLoading`.
4. Trigger generazione su save Admin.
5. Verifica PO: Home monta senza attendere Design remoto; override avviene se remoto differisce.
6. Aggiornamento DOC-38 (stato decisioni).

**Criterio di fatto:** spinner “Sincronizzazione Configurazioni…” non dipende più dal fetch Design remoto.

**Stato:** Implementato 2026-07-30 (mezzo: `global_settings.design_system_snapshot`).

---

## S.2 — BOOTSTRAP · Nuovo flusso di avvio

### S.2.1 Obiettivo

Mostrare la Home **il prima possibile** con stabilità applicativa: gate solo dove dimostrabilmente necessari; Config ristretta al minimo; Design non bloccante (dipende da S.1 o lo include se STEP unico congiunto — vedi nota).  
Allineamento: **PO-BOOT-03**, **BP-01**, **BP-03**, **BP-04**, **BP-05**, Vision §V.

**Nota di composizione:** Se il PO approva S.1 e S.2 come due STEP distinti, S.2 assume S.1 già consegnato. Se il PO unisce S.1+S.2 in un unico STEP di delivery, il piano unificato deve comunque rispettare “un solo STEP” senza micro-fasi pubbliche — ma restano due piani approvabili separatamente.

### S.2.2 Architettura proposta

#### Nuovo flusso di avvio (logico)

```text
Motore applicativo pronto
  → Provider shell (Identità ospite immediata; Flags con fallback; …)
  → Snapshot Design applicato (non-gate rete)          [da S.1]
  → Config minima per stabilità shell (se ancora necessaria) 
        OPPURE abolition del gate Config a tutto schermo
  → MainLayout montato
  → Dataset Manifest minimo (gate solo su shelf Home)   [ideale post S.4; interim: Manifest attuale]
  → HomeContent
  → In parallelo / dopo: Config specialistica, Design remoto, catalogo resto, moduli
```

#### Ordine dei caricamenti (contratto)

| Fase | Cosa | Blocca MainLayout? | Blocca HomeContent? |
|------|------|--------------------|---------------------|
| A | Identità ospite + mount provider | No (locale) | No |
| B | Platform flags (con fallback) | No (oggi già soft) | No |
| C | Design Snapshot | No | No |
| D | Config **minima** (solo se PO conferma chiavi davvero necessarie alla stabilità shell) | Solo se dimostrate; default proposto: **gate Config a tutto schermo eliminato** | No |
| E | Design remoto | No | No |
| F | Config specialistica (resto `SETTINGS_KEYS`) | No | No |
| G | Manifest shelf / catalogo | No per layout | Sì solo finché manca shelf minimo (oggi intero catalogo — da S.4) |

#### Gate

| Gate | Destino |
|------|---------|
| Config `isLoading` → spinner `AppCoordinator` | **Eliminare** come gate a tutto schermo, oppure restringere a fallimento soft con UI degradabile |
| Alias `usePartnerIntegrations().loading` come cancello layout | **Eliminare** / non usare più come proxy del permesso Home |
| Manifest `isLoadingManifest` | **Eliminato** come gate Home (S.4); flag resta per resolve slug / deep link / quota |
| `isBuildingVirtual` | **Conservare** (azione utente) |

#### Dipendenze e responsabilità provider

| Provider | Responsabilità bootstrap to-be |
|----------|--------------------------------|
| User | Identità; **non** obbligare catalogo completo nel gate (vedi S.4) |
| PlatformControl | Flags non-blocking |
| Business | **Non nel bootstrap globale** (WF-PERF-02 STEP 1): `BusinessProvider` montato solo con `UserDashboard` (`src/components/user/UserDashboard.tsx`). Consumer: `UserDashboard` / `UserSidebar` / `useUserDashboardData`. No gate Home; logica dominio invariata |
| Config | Cache settings; **ready** shell ≠ “tutto caricato”; Design remoto fuori ready |
| Gps / Modal / AI / Interaction / Itinerary / Diary | On demand / background; no gate Home |
| Navigation | Routing; deep link tollera shelf incompleto post-S.4 |
| AppCoordinator | Non spinna su Config completa |

#### Punti di modifica (previsti)

- `AppCoordinator` — condizione `loading`
- `ConfigContext` — split ready / deferred load
- `usePartnerIntegrations` — smettere di esporre Config loading come gate layout (o Coordinator smette di usarlo)
- Eventuale caricamento differito settings non-Home
- Integrazione con S.1 (Snapshot) e preparazione a S.4

### S.2.3 File coinvolti (previsione)

`src/components/layout/AppCoordinator.tsx`, `src/context/ConfigContext.tsx`, `src/hooks/usePartnerIntegrations.ts`, `src/services/settingsService.ts`, eventualmente `src/context/AppProviders.tsx` (solo se cambia contratto di ready), DOC-38.

### S.2.4 Modifiche previste

1. Rimuovere spinner full-screen dipendente da Config completa (+ Design remoto).
2. Introdurre caricamento differito delle chiavi non-Home (contratto: elenco differibile da §8).
3. Conservare stabilità: Error boundary, flags fallback, sessione ospite.
4. Allineare messaggistica UX (niente “Sincronizzazione Configurazioni…” come porta della Home).

### S.2.5 Rischi

| Rischio | Gravità |
|---------|---------|
| Flash di default sbagliati su chiavi lette troppo presto | Media — mitigare con Snapshot + default hardcoded già esistenti |
| Admin/partner path che assumevano Config completa al mount | Media — verificare ingressi non-Home |
| Doppio fetch settings | Bassa |

### S.2.6 Regressioni

- GPS `geo_options` letto prima che settings differite arrivino (default già in codice).
- Onboarding `getSetting` timing.
- Affiliate/valigia che leggono partner troppo presto (già on demand UI).

### S.2.7 Motivazioni

- Gate Config non usa valori chiave (**DIMOSTRATA DAL CODICE**).
- PO-BOOT-03 / BP-01 / BP-03 / BP-05 (**DECISIONE DEL PRODUCT OWNER**).

### S.2.8 Piano definitivo di sviluppo (un solo STEP)

**Nome STEP (futuro):** Bootstrap non-blocking Config + ready shell.

**Deliverable unici:**

1. Eliminazione (o riduzione dimostrabile) del gate Config a tutto schermo.
2. Caricamento differito config specialistiche.
3. Integrazione con Design non-blocking (S.1 prerequisito o incluso per decisione PO).
4. Verifica ingressi Home + smoke non-Home (admin/login).
5. DOC-38: PO-BOOT-03 stato aggiornato.

**Criterio di fatto:** utente ospite raggiunge cornice Home senza attendere Design remoto né pacco settings completo.

**Stato:** Implementato 2026-07-30 — gate Config fullscreen rimosso; `isShellReady` / `isConfigFullyLoaded`; specialist keys non bloccano shell; S.1 Snapshot invariato; Manifest gate resta fino a S.4.

---

## S.3 — BUNDLE AUDIT · Sistema di audit temporaneo

### S.3.1 Obiettivo

Dotarsi di un **sistema diagnostico temporaneo** che produca un report **testuale** completo sul costo moduli del bootstrap, per alimentare §13 e decisioni PO-BOOT-04 — **senza** ottimizzare il prodotto in questo intervento.

### S.3.2 Architettura proposta

| Script (nome proposto) | Responsabilità | Input | Output |
|------------------------|----------------|-------|--------|
| `scripts/_bundle_audit_build.mjs` | Esegue build produzione in modo ripetibile; cattura exit code e path `dist` | repo root, `vite build` | log testo + conferma `dist/` |
| `scripts/_bundle_audit_report.mjs` | Elenca asset in `dist` con dimensioni byte (+ gzip se calcolabile offline) | `dist/` | TSV/sezioni markdown **solo testo** |
| `scripts/_bundle_import_trace.mjs` | Grafo import statici da entry (`src/index.tsx` → …) fino a profondità configurabile | entry TS/TSX | albero testo: file → importer |
| (opzionale, stesso STEP) wrapper `npm` script `bundle:audit` | Invoca build→report→trace in sequenza | — | un unico log concatenato |

**Non** fanno parte di questo intervento: code splitting di prodotto, rimozione dipendenze, HTML visualizer.

#### Informazioni raccolte

- Dimensione file/chunk.
- Appartenenza probabile a entry vs async (dove dimostrabile).
- Catena import statica verso bootstrap.
- Flag: `necessario_bootstrap` / `teoricamente_differibile` come **IPOTESI** da validare in revisione umana, non come verità automatica.

#### Formato report (obbligatorio)

Come in §9.5 DOC-38 (`### MODULO:` … campi fissi).  
Più sezione riepilogo: top N per size; entry vs resto.

#### Uso dei risultati

1. Incollare in chat / appendere sintesi in DOC-38 §9 e schede §13.
2. Informare PO-BOOT-04 (effort/beneficio) — **nessuna** ottimizzazione automatica.
3. Classificare solo con evidenza (Codice / Build / Runtime).

#### Rimozione a termine

| Azione | Quando |
|--------|--------|
| Eliminare script `_bundle_audit_*` e script npm collegati | Dopo chiusura campagna di misura / su ordine PO |
| Non committare `dist/` di audit come artefatto permanente | Sempre |
| Lasciare in DOC-38 solo i **risultati** classificati | Memoria; strumenti usa-e-getta |

### S.3.3 File coinvolti

`scripts/_bundle_audit_build.mjs`, `scripts/_bundle_audit_report.mjs`, `scripts/_bundle_import_trace.mjs`, eventualmente `package.json` (script npm temporanei), DOC-38 §9/§13.  
**Nessun** file runtime `src/` obbligatorio.

### S.3.4 Modifiche previste

Solo aggiunta strumenti + documentazione d’uso + (post-run) aggiornamento conoscenza DOC-38. Nessun cambio comportamento utente.

### S.3.5 Rischi

| Rischio | Gravità |
|---------|---------|
| Falsi positivi “differibile” dallo script | Media — etichetta IPOTESI obbligatoria |
| Build lenta in CI locale | Bassa |
| Script lasciati in repo per sempre | Media — checklist rimozione |

### S.3.6 Regressioni

Nessuna UX se gli script non entrano nel bundle client. Regressione possibile solo se `package.json` scripts rompono convenzioni — mitigare con prefisso `bundle:audit*`.

### S.3.7 Motivazioni

- Fase pre-React rilevante (**DIMOSTRATA DAL RUNTIME** in sessione TAC).
- PO-BOOT-04: valutare effort/beneficio (**DECISIONE DEL PRODUCT OWNER**).
- Inventario §13 incompleto senza build (**IPOTESI DA VERIFICARE** finché non eseguito).

### S.3.8 Piano definitivo di sviluppo (un solo STEP)

**Nome STEP (futuro):** Bundle audit tooling + prima campagna di report.

**Deliverable unici:**

1. Tre script + comando unico di lancio.
2. Un report testuale completo della build corrente.
3. Append DOC-38 (§9 fatti runtime/build; §13 schede dove rischio nullo/basso dimostrabile).
4. Istruzioni di rimozione strumenti.

**Criterio di fatto:** un operatore può rigenerare il report testo senza UI HTML e aggiornare DOC-38.

**Stato:** In attesa approvazione PO.

---

## S.4 — MANIFEST · Dataset minimo bootstrap

### S.4.1 Obiettivo

Eliminare il caricamento dell’**intero catalogo** città come prerequisito del bootstrap Home.  
La Home riceve solo il **dataset minimo** per il first rendering; il resto arriva dopo.  
Allineamento: **PO-BOOT-02**, **BP-06**, Vision §V; criterio “pochi dati oggi ⇒ modello ok” **rifiutato**.

### S.4.2 Architettura proposta

#### Nuovo contratto dati bootstrap

| Contratto | Contenuto |
|-----------|-----------|
| **HomeShelf** (nome logico) | Insieme minimo di `CitySummary` (o proiezione equivalente) sufficiente a: slot In Evidenza, carousel più visitate di primo livello, griglie ispirazioni di primo viewport. **Non** include il catalogo per ricerca/filtri. |
| **Campi per record shelf** | Al minimo i campi **DIMOSTRATI letti** dalla vetrina Home: id, name, imageUrl, visitors, isFeatured, specialBadge, homeOrder, zone, tourist_zone_id, region_id, cityTypes, description, rating, coords, slug |
| **Fuori shelf al boot** | Campi mai letti dalla Home; schede grasse; città non necessarie al first paint; **qualsiasi elenco usato solo per ricerca/filtri client-side** |
| **CatalogRest / Query server** | Ricerca e Filtri: **interrogazione server on-demand** (**PO-BOOT-06**). Deep link / dettaglio: fetch puntuale. |

#### Dataset minimo (definizione di prodotto + evidenza)

| Componente shelf | Regola di inclusione (contratto) |
|------------------|----------------------------------|
| Slot homeOrder 1–4 (+ fallback badge) | Città con `homeOrder` o badge di fallback usati oggi |
| Top visitate (N UI corrente, es. 10) | Ordinate per visitors |
| Griglie ispirazioni first paint | Città per badge + filler `isFeatured` come oggi in `CuratedGridSection` |
| Unione | Dedup per id |

**Policy Ricerca / Filtri — DECISIONE DEL PRODUCT OWNER (PO-BOOT-06, 2026-07-30):**

> La Home continua a ricevere **esclusivamente** HomeShelf.  
> Ricerca e Filtri **non** dipendono dal catalogo completo nel browser.  
> Entrambi **interrogano il server on-demand**.  
> Il browser **non** scarica l’intero catalogo città solo per ricerca/filtri.  
> Obiettivo: scala a centinaia/migliaia di città; UX assimilabile a Google Maps / Booking / Airbnb (bootstrap leggero, Home immediata, query server-side, dati solo quando servono).

**Stato:** policy **chiusa**. Non resta aperta alcuna alternativa client-side “ricerca sullo shelf” / “defer ricerca”.

#### Caricamenti successivi

| Momento | Dato |
|---------|------|
| Dopo first paint Home | Eventuali arricchimenti shelf non bloccanti (non catalogo completo per filtri) |
| Utente usa Ricerca o Filtri | Query **server-side on-demand** (PO-BOOT-06) |
| Entrata città / deep link | Dettaglio o record puntuale |
| Stagione selezionata | Ranking stagionale (già on demand) |

#### Consumer

| Consumer | HomeShelf | Server on-demand |
|----------|-----------|------------------|
| HomeContent / CityCard / CuratedGrid first paint | Sì | No |
| Ricerca / Filtri Hero | No (non sullo shelf come catalogo) | **Sì** (PO-BOOT-06) |
| Navigation deep link / resolve slug | Eventuale hit shelf | Fetch puntuale se assente |
| `useUser().cityManifest` | Semantica → shelf (non “tutto il catalogo”) | — |

#### Compatibilità

- Tipo `CitySummary` può restare; cambia **cardinalità e momento**.
- Props morte `featuredCities` / `destinationCities`: rimozione ammessa nello stesso STEP (chiarezza; basso rischio).

### S.4.3 File coinvolti (previsione)

`src/hooks/core/useAppInitialization.ts`, `src/context/UserContext.tsx`, `src/services/city/cityReadService.ts` (nuovo entry shelf vs full), `server/routes/bootstrap.routes.ts` (eventuale endpoint shelf), `src/components/layout/AppRouter.tsx`, `src/hooks/ui/useHeroLogic.ts`, `src/context/NavigationContext.tsx` (deep link), DOC-38.

### S.4.4 Modifiche previste

1. Introdurre caricamento **HomeShelf** come prerequisito gate Home.
2. Differire CatalogRest.
3. Adattare consumer che assumevano elenco completo al boot.
4. Definire UX filtri/ricerca/deep-link per catalogo parziale (una policy).
5. Rimuovere props morte se nel perimetro.

### S.4.5 Rischi

| Rischio | Gravità |
|---------|---------|
| Filtri/ricerca incompleti percepiti come bug | Alta — richiede policy PO esplicita |
| Deep link città fuori shelf fallisce | Alta — serve fetch puntuale |
| Shelf troppo piccolo → vetrina vuota | Media — regole inclusione da §S.4.2 |
| Doppia fonte shelf/full inconsistente | Media — versione/timestamp o invalidazione |

### S.4.6 Regressioni

- Around Me / merge città che leggono manifest ampio.
- Sidebar liste città.
- AI Hero che concatena nomi da filtered list.
- Admin mode che già salta manifest consumer.

### S.4.7 Motivazioni

- Letture Home dimostrate vs pacco completo (**DIMOSTRATA DAL CODICE**).
- PO-BOOT-02 / BP-06 / rifiuto criterio “poche città” (**DECISIONE DEL PRODUCT OWNER**).

### S.4.8 Piano definitivo di sviluppo (un solo STEP)

**Nome STEP (futuro):** HomeShelf Manifest + CatalogRest differito.

**Deliverable unici:**

1. Contratto HomeShelf operativo (client ± server).
2. Gate Home basato su shelf, non su catalogo intero.
3. CatalogRest post-paint.
4. Policy Ricerca/Filtri server-side (**PO-BOOT-06**) rispettata nel codice — **già decisa**; lo STEP implementa, non riapre.
5. Cleanup props morte (consigliato nello stesso STEP).
6. Verifica PO su vetrina + ricerca server + filtri server + deep link.
7. DOC-38: PO-BOOT-02 + PO-BOOT-06 → implementati.

**Criterio di fatto:** hard refresh Home non scarica più l’intero catalogo grasso prima del first paint; vetrina popolata dallo shelf.

**Stato:** Implementato 2026-07-31 — gate `isLoadingManifest` rimosso da Home `/`; `buildHomeShelf` (proiezione client); CatalogRest = `getFullManifestAsync` non-blocking; props morte `featuredCities`/`destinationCities` rimosse; loading locale solo `citySlug` irrisolto / `isBuildingVirtual`.  
**Prerequisito:** S.2 (gate Config già non-blocking).  
**Policy filtri/ricerca:** **PO-BOOT-06** — policy chiusa; in S.4 Hero filtra su CatalogRest progressivo (stesso fetch). Endpoint query server dedicato = residuale esplicito.

---

## S.5 Registro approvazione PO

| Piano | Approvato | Data | Note PO |
|-------|-----------|------|---------|
| S.1 Design Snapshot | ☑ | 2026-07-30 | Avvio implementazione STEP |
| S.2 Bootstrap | ☑ | 2026-07-30 | **Implementato** STEP S.2 |
| S.3 Bundle Audit | ☑ (piano) | 2026-07-30 | Non ancora in coding |
| S.4 Manifest HomeShelf | ☑ | 2026-07-31 | **Implementato** STEP S.4 (gate off; HomeShelf client; PO-BOOT-06 server query residuale) |

### Chiusura fase di progettazione

**2026-07-30 — DECISIONE DEL PRODUCT OWNER:** con Vision, Principles, Roadmap Architetturale, piani §S e **PO-BOOT-06**, la fase di **progettazione/architettura bootstrap** è **chiusa**. Le attività successive sono **implementazioni STEP** (S.1 → …) senza riaprire il disegno salvo supersessione esplicita in DOC-38.

---

# 14. Changelog conoscenza (append-only)

| Data | Rev | Autore | Sintesi |
|------|-----|--------|---------|
| 2026-07-30 | A | AI + PO (chat audit) | Prima consolidazione conoscenza Config / Design / Manifest / gate / TAC / decisioni PO-BOOT-01..04 (testo in chat; file non ancora in repo) |
| 2026-07-30 | B | AI + PO | Creazione DOC-38 in repo. Aggiunti: protocollo evoluzione; **PO-BOOT-05 Design Snapshot** (§6.5); Manifest futuro rafforzato (no criterio “4 città”); piano Bundle Audit + progetto strumentazione (§9.4–9.5); template §13; schede props morte |
| 2026-07-30 | C | AI + PO | Aggiunti capitoli **§V Bootstrap Vision**, **§P Bootstrap Principles**, **§R Roadmap Architetturale** (macro-aree UX/Data/Runtime/Governance). Nessuna implementazione. WF-PERF-01 ristretto a ruolo operativo → DOC-38 |
| 2026-07-30 | D | AI + PO | **§S Piani di sviluppo definitivi** (S.1 Design Snapshot, S.2 Bootstrap, S.3 Bundle Audit, S.4 Manifest HomeShelf): ciascuno un solo STEP futuro; pre-approvazione PO; nessun codice/workflow esecutivo |
| 2026-07-30 | E | AI + PO | **PO-BOOT-06**: Ricerca/Filtri server-side on-demand; HomeShelf solo vetrina; chiusura fase progettazione; avvio STEP S.1 |
| 2026-07-30 | F | AI | **STEP S.1 implementato**: Design Snapshot in `design_system_snapshot`; Config non attende Design remoto; publish Snapshot su save Admin; override remoto su diff fingerprint |
| 2026-07-30 | G | AI | **STEP S.2 implementato**: gate Config fullscreen eliminato; `isShellReady` ≠ `isConfigFullyLoaded`; `usePartnerIntegrations.loading` non più proxy layout; Manifest/S.3/S.4 intatti |
| 2026-07-31 | H | AI | **STEP S.3 implementato**: strumenti diagnostici temporanei `_bundle_audit_build.mjs`, `_bundle_audit_report.mjs`, `_bundle_import_trace.mjs` + npm `bundle:audit*`; **nessuna** ottimizzazione runtime / code splitting / modifica comportamento app |
| 2026-07-31 | I | AI | **STEP S.4 implementato**: gate Manifest Home eliminato; `buildHomeShelf`; CatalogRest non-blocking; cleanup props morte; loading locale citySlug; PO-BOOT-06 endpoint server residuale |
| 2026-08-01 | J | AI | **Puntatore MP-03**: piano COME `MASTERPLANS/MP_03_HOME_BOOTSTRAP_BARREL_OPTIMIZATION.md`; PO-BOOT-04 aggiornato con riferimento piano (implementazione non avviata) |
| 2026-08-01 | K | AI | **Nota PO-BOOT-04**: motivazione architetturale nascita MP-03 (dipendenze statiche barrel/import vs solo peso asset); confini COSA=DOC-38 / COME=MP-03; nessun dettaglio STEP in DOC-38 |

---

## Riferimenti incrociati

| Documento | Relazione |
|-----------|-----------|
| `AI_DEV_WORKFLOW/WORKFLOWS/WF_PERF_01_PERFORMANCE_OPTIMIZATION.md` | Workflow operativo performance — punta a DOC-38 per conoscenza bootstrap |
| `AI_DEV_WORKFLOW/MASTERPLANS/MP_03_HOME_BOOTSTRAP_BARREL_OPTIMIZATION.md` | Piano COME — eliminazione dipendenze statiche non necessarie al first paint (PO-BOOT-04 §9.3); **non** SoT Vision/Principles |
| `AI_CONTEXT/32_DESIGN_SYSTEM_FOUNDATION.md` | SoT Design di prodotto/editor — **non** sostituisce PO-BOOT-05; Snapshot runtime = STEP S.1 (`design_system_snapshot`) |
| Chat audit 2026-07-30 | Origine misure TAC e revisioni avversarie — consolidate qui |

---

**FINE DOC-38 — ogni nuova evidenza sul bootstrap aggiorna questo file.**
