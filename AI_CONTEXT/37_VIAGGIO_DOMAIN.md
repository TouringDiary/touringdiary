# 37 — Viaggio Domain (Source of Truth)

> **SSOT strutturale del dominio Viaggio** — Aggregate Root del patrimonio personale.
> Regole permanenti → `34A_DOMAIN_DESIGN_RULES.md`.
> Visione MySpace / MyWorld → `35_MYSPACE_PRODUCT_VISION.md`.
> Collaborazione → `28_COLLABORATION_WORKSPACE_SYSTEM.md`.
> Packing → `31_PACKING_SUITCASE_SYSTEM.md`.
> **Non** contiene roadmap, Workflow, schema DB, API, RLS né piano di implementazione.
> Implementazione dominio base → `AI_DEV_WORKFLOW/MASTERPLANS/MP_01_VIAGGIO_DOMAIN_IMPLEMENTATION.md` (**concluso**).  
> Allineamento UX MySpace post–MP-01 → `AI_DEV_WORKFLOW/MASTERPLANS/MP_02_MYSPACE_UX_REALIGNMENT.md`.

**Versione:** 1.2.1  
**Data:** 2026-07-27  
**Stato:** Congelato — Source of Truth del dominio  
**Origine:** Decisioni PO + review architetturale finale (chiusa 2026-07-26); aggiornamenti MySpace/Ricordi/Mappa 2026-07-27

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
- preferenza **Ricordami** (abilitato + intervallo mesi) — metadato di prodotto sul Viaggio; UI in cartella (DOC 35 §6.5), non nella Resource Ricordi
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

### 4.4 Persistenza (invariata)

Il sistema di salvataggio del Diario resta quello già prodotto: **Salva**, **Salva con nome**, **Auto Save** (toggle).  
Nessuna cronologia versioni. Nessuna modifica architetturale a questo comportamento.

---

## 5. Roadbook (Library)

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
Distinti dagli **Allegati Workspace** (gruppo).  
Non esistono come sezione root di MySpace.

---

## 8. Valigia (del Viaggio)

Packing list appartenente a **quel** Viaggio.  
Distinta dalle valigie / template permanenti in MySpace → **Strumenti**.  
Dettaglio packing → `31_PACKING_SUITCASE_SYSTEM.md`.

---

## 9. Mappa (View)

Vista geografica **interattiva** del patrimonio del Viaggio.

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
| Strumenti (valigie/template permanenti) | MySpace root |
| Account / Supporto / Wallet | Account |
| Community pubblica | Pubblicazione tipicamente da un **Diario**, non share del Viaggio |
| Workspace | Copie collaborative — mai il Viaggio originale |

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
| **Strumenti** | Valigie/template permanenti fuori dal Viaggio |
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
| VD-016 | Ricordami = preferenza su Viaggio (cartella), non Resource Ricordi | Congelato 2026-07-27 |
| VD-017 | Mappa = Google Maps embedded + pin/POI | Congelato 2026-07-27 · **raffinato** da VD-019 |
| VD-018 | Ricordi: libreria viaggio ∪ filtro giorno (FOTO/VIDEO) | Congelato 2026-07-27 |
| VD-019 | Mappa: clustering marker (solo view); pin singolo → pagina completa POI. Non crea entità né strutture dati dedicate | Congelato 2026-07-27 · precisato 1.2.1 |
| VD-020 | Ricordi media: multi-giorno; spostamento; delete solo da Viaggio (non telefono/cloud). Giorni = link logici; contenuto unico sul Viaggio | Congelato 2026-07-27 · precisato 1.2.1 |
| VD-021 | Diario: Salva / Salva con nome / Auto Save; no version history | Congelato 2026-07-27 (as-is) |
| VD-022 | Originali ↛ sync copie WS; delete originale ↛ delete copia | Congelato 2026-07-27 (riaffermazione) |
| VD-023 | Delete Viaggio → elimina anche preferenza Ricordami di quel Viaggio | Congelato 2026-07-27 |

---

## 17. Diagramma MySpace → Viaggio

```text
MyWorld
├── MySpace
│     └── I miei Viaggi
│           └── [Viaggio]
│                 ├── Diario[] (+ attivo)
│                 ├── Valigia[]
│                 ├── Ricordi (Foto · Video · Note/giorno)
│                 ├── Allegati[]
│                 ├── Roadbook (library)
│                 ├── Mappa (view)
│                 └── Riepilogo (view)
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
