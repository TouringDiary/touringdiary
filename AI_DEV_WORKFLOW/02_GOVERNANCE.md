# 02 — Governance (TouringDiary)

> **Regole del processo** — stati, sequenza Workflow, PO Override, convenzioni.
> **Non** contiene stato corrente del progetto → `03_PROJECT_STATUS.md`.
> **Non** contiene dettaglio singolo Workflow → `WORKFLOWS/WF_XX_*.md`.

---

## 1. Stati — Fase (interno a uno STEP)

Ogni Fase segue `00_DEVELOPMENT_PROTOCOL.md`.

| Stato | Significato |
|-------|-------------|
| **Non iniziato** | Fase non avviata |
| **In analisi** | Studio, SSOT, decisioni — **nessun codice** |
| **Pronto per implementazione** | Gate dominio soddisfatti (se applicabile); autorizzato a codificare |
| **In sviluppo** | Codice / migration in corso |
| **In review tecnica** | Code review, audit |
| **In test** | Verifica funzionale automatizzata/manuale |
| **In verifica PO** | Checkpoint PO in corso |
| **Completato** | Fase chiusa con validazione PO |
| **Sospeso** | Pausa — solo con PO Override |

**Transizioni:** preferire ordine lineare; salti indietro ammessi (es. da Test a Sviluppo) con nota nel Workflow.

---

## 2. Stati — Workflow (macro-iniziativa)

| Stato | Significato |
|-------|-------------|
| **Non iniziato** | WF registrato ma non avviato |
| **Attivo** | Almeno una Fase in corso |
| **Sospeso** | In pausa — richiede PO Override `suspend` |
| **Bloccato** | Impedimento non pianificato; attesa decisione |
| **Completato** | Tutti STEP chiusi + PO finale |
| **Annullato** | Abbandonato — decisione PO documentata |

---

## 3. Regola di sequenza Workflow (default)

1. Il **Workflow WF-(N+1)** inizia solo quando **WF-N** è **Completato** formalmente.
2. **Chiusura formale** = tutti STEP Completati + DoD WF + gate dominio ☑ + validazione PO finale + `03_PROJECT_STATUS` aggiornato.
3. Eccezione **solo** tramite **PO Override** (§5).

**Obiettivo:** evitare molte macro-iniziative aperte senza decisione esplicita.

---

## 4. Gate — due tipi (non duplicare definizioni)

| Tipo | Dove è **definito** | Dove è **tracciato** |
|------|---------------------|----------------------|
| **Gate di dominio** | Masterplan SSOT (`AI_CONTEXT`, es. DOC 29, 30) | Tabella nel file `WORKFLOWS/WF_XX`; sintesi in `03_PROJECT_STATUS` |
| **Gate di esecuzione** | File Workflow (es. «PO approva wireframe») | Stesso Workflow |

**Regola:** `AI_DEV_WORKFLOW` **non ridefinisce** testo, condizioni o impatto dei gate di dominio. Solo: ID, link SSOT, ☐/☑, evidenza una riga.

**Regola sicurezza:** PO Override **non** invalida un gate di dominio senza aggiornamento del Decision Log nel Masterplan SSOT proprietario.

---

## 5. PO Override — registro

Override = deroga **esplicita** alla sequenza o ai prerequisiti **operativi**.

### Formato voce (immutabile dopo pubblicazione)

| Campo | Obbligatorio | Descrizione |
|-------|--------------|-------------|
| **ID** | Sì | `PO-OV-XXX` |
| **Data** | Sì | |
| **Tipo** | Sì | Vedi tabella sotto |
| **Workflow coinvolti** | Sì | Es. WF-01, WF-02 |
| **Motivazione** | Sì | |
| **Condizioni / rischi accettati** | Sì | |
| **Scadenza review** | Sì | Data rivalutazione obbligatoria |
| **Approvato da** | Sì | PO |

### Tipi

| Tipo | Effetto |
|------|---------|
| `parallel_start` | Avvio WF successivo prima della chiusura completa del precedente |
| `suspend` | WF → **Sospeso** |
| `resume` | Ripresa da **Sospeso** |
| `reorder` | Cambio ordine esecuzione WF (aggiornare `01_EXECUTION_ROADMAP`) |
| `skip_prerequisite` | Salta prerequisito **operativo** (non gate di sicurezza SSOT) |

### Registro

*(Vuoto alla creazione del framework.)*

| ID | Data | Tipo | WF | Motivazione | Scadenza review | Stato |
|----|------|------|-----|-------------|-----------------|-------|
| — | — | — | — | — | — | — |

Override attivi devono comparire in `03_PROJECT_STATUS.md`.

---

## 6. Percentuale completamento

Indicatore **convenzionale**, non metrica di progetto.

```
% WF = (Fasi Completate / Fasi totali pianificate nel WF) × 100
```

- Arrotondamento intero.
- Fasi aggiunte in corso d'opera aggiornano il denominatore (nota nel Workflow).
- `01_EXECUTION_ROADMAP` **non** riporta %; solo `03_PROJECT_STATUS` e file WF.

---

## 7. Convenzioni naming

| Elemento | Regola |
|----------|--------|
| Cartella | `AI_DEV_WORKFLOW/` |
| Workflow file | `WORKFLOWS/WF_XX_<SLUG_MAIUSCOLO>.md` |
| Workflow ID | `WF-XX` (due cifre) |
| STEP | `STEP-N` sequenziale nel file WF |
| Override | `PO-OV-XXX` sequenziale in questo registro |

**Slug:** `SNAKE_CASE` descrittivo, es. `SPONSOR_DOMAIN`, `CENTRO_CONTROLLO`.

---

## 8. Archivio Workflow completati

Workflow **Completati** da tempo possono essere spostati in:

`WORKFLOWS/_archive/WF_XX_<NOME>.md`

- `01_EXECUTION_ROADMAP` → stato **Completato (archiviato)** + link
- `03_PROJECT_STATUS` → sezione «Completati di recente» o link archivio
- Il file archiviato **non** si modifica salvo correzioni storiche con nota

---

## 9. Log decisioni — operativo vs SSOT

| Tipo | Dove |
|------|------|
| Decisione **architetturale** di dominio | Decision Log del Masterplan SSOT (`AI_CONTEXT`) |
| Decisione **operativa** (ordine, priorità, eccezioni) | Log in fondo al file Workflow o PO Override qui |

---

## 10. Regola sicurezza by default (PO — permanente)

Quando il Product Owner **non possiede competenze tecniche sufficienti** per scegliere tra più soluzioni implementative, la decisione ricade **automaticamente** sulla soluzione che garantisce il **massimo livello di sicurezza** possibile per:

- utenti e dati personali;
- integrità e disponibilità della piattaforma;
- infrastruttura e confini di trust (client, API, database);
- conformità normativa applicabile (inclusi GDPR e normative vigenti nel perimetro del progetto).

**Non prevalgono** sulla regola: semplicità implementativa, minor effort, velocità di consegna — salvo **decisione esplicita contraria** del Product Owner registrata nel Decision Log SSOT o nel Workflow.

**Applicazione:** triade AI (`AI_CONTEXT/07_AI_WORKFLOW.md`); scelte architetturali ambigue in analisi; proposte con trade-off sicurezza vs velocità.

**Registrazione:** se il PO deroga esplicitamente a favore di velocità/semplicità, obbligatoria voce DL con rischi accettati.

---

## 11. Operazioni irreversibili (PO — permanente)

**Tutte le operazioni irreversibili** spettano **esclusivamente** ad **`admin_all`**, salvo diversa decisione esplicitamente documentata nel Decision Log SSOT del dominio interessato.

**Esempi nel perimetro attuale:**

- Terminazione / cancellazione contratto Sponsor (DL-034 DOC 29);
- Eliminazione bulk record Sponsor;
- Modifica ruoli e privilegi (**Utenti & Ruoli**);
- Deroghe che compromettono controllo piattaforma.

`admin_limited` **non** esegue operazioni irreversibili salvo DL esplicito contrario.

**Applicazione:** matrici permessi SSOT; guard RPC; visibilità pulsanti UI admin.

---

## Cronologia governance

| Versione | Data | Modifiche |
|----------|------|-----------|
| 1.0.0 | 2026-07-13 | Creazione framework |
| 1.0.1 | 2026-07-14 | §10 Regola sicurezza by default (review PO) |
| 1.0.2 | 2026-07-14 | §11 Operazioni irreversibili solo admin_all |
