# AI_DEV_WORKFLOW — TouringDiary

> **Layer operativo di sviluppo** — come costruiamo il sistema e dove siamo nel percorso.
> **Non** descrive l'architettura. **Non** duplica gli SSOT di dominio.

---

## I tre layer documentali

| Layer | Percorso | Responsabilità | Domanda a cui risponde |
|-------|----------|----------------|------------------------|
| **Architettura / SSOT dominio** | `AI_CONTEXT/` | Verità tecnica per dominio (Masterplan, mappe, regole) | *Cosa è il sistema?* |
| **Vista consolidata** | `AI_CONTEXT_MASTER/` | Sintesi certificata dell'intero sistema | *Come è fatto nel complesso?* |
| **Sviluppo operativo** | `AI_DEV_WORKFLOW/` | Protocollo, roadmap, stato avanzamento | *Come lo sviluppiamo e dove siamo?* |

### Regole di confine (obbligatorie)

1. **Nessuna duplicazione** — Gate, DoD di dominio e architettura vivono negli SSOT (`AI_CONTEXT`). Qui si **referenziano** e si **traccia** lo stato.
2. **Gate di dominio** — Definiti esclusivamente nei Masterplan (es. DOC 29, DOC 30). I Workflow registrano solo ☐/☑ ed evidenza.
3. **AI_CONTEXT non è roadmap** — Non spostare piani di sviluppo o stati avanzamento negli SSOT.
4. **Aggiornamento a cascata** — Chiusura fase → aggiornare il Workflow → aggiornare `03_PROJECT_STATUS.md`.

---

## Contenuto di questa cartella

| File / cartella | Responsabilità unica |
|-----------------|----------------------|
| `00_DEVELOPMENT_PROTOCOL.md` | **Come lavoriamo** — metodo ufficiale (permanente) |
| `01_EXECUTION_ROADMAP.md` | **Indice Workflow** — ordine, dipendenze, SSOT collegati |
| `02_GOVERNANCE.md` | **Regole** — stati, sequenza, PO Override, convenzioni |
| `03_PROJECT_STATUS.md` | **Dashboard** — sintesi < 10 secondi (nessun dettaglio) |
| `WORKFLOWS/` | Un file per macro-iniziativa (`WF_XX_*.md`) |
| `WORKFLOWS/WF_02_AUDIT_B_CENTRO_CONTROLLO.md` | **SoT collaudo Audit B** — stati test, bug, UX, audit, decisioni PO (STEP-3) |
| `WORKFLOWS/_TEMPLATE_WORKFLOW.md` | Scaffold per nuovi Workflow |
| `WORKFLOWS/_archive/` | Workflow completati (spostati per leggibilità) |

---

## Ordine di lettura

### Prima attività sul progetto (umano o AI)

1. `AI_CONTEXT/README_AI.md` — boot architetturale
2. **`AI_DEV_WORKFLOW/03_PROJECT_STATUS.md`** — dove siamo ora
3. Workflow attivo in `WORKFLOWS/` (quando esisterà)
4. SSOT di dominio in `AI_CONTEXT` — solo per decisioni architetturali

### Avvio di una nuova macro-iniziativa

1. `00_DEVELOPMENT_PROTOCOL.md`
2. `02_GOVERNANCE.md` (stati e override)
3. Copiare `WORKFLOWS/_TEMPLATE_WORKFLOW.md` → `WORKFLOWS/WF_XX_<NOME>.md`
4. Registrare il Workflow in `01_EXECUTION_ROADMAP.md`
5. Aggiungere riga in `03_PROJECT_STATUS.md`

### Durante lo sviluppo quotidiano

1. `03_PROJECT_STATUS.md` → focus attuale
2. `WORKFLOWS/WF_XX_*.md` → STEP, Fase, checklist correnti
3. Masterplan SSOT → solo se serve verità architetturale o gate di dominio

---

## Convenzioni naming

| Elemento | Pattern | Esempio |
|----------|---------|---------|
| Workflow (file) | `WF_XX_<SLUG>.md` | `WF_01_SPONSOR_DOMAIN.md` |
| Workflow (ID) | `WF-XX` | `WF-01` |
| STEP | `STEP-N` (dentro il WF) | `STEP-2` |
| PO Override | `PO-OV-XXX` | `PO-OV-001` |

`XX` = due cifre. Dettaglio in `02_GOVERNANCE.md`.

---

## Collegamenti architetturali (solo riferimenti)

| Documento | Ruolo |
|-----------|--------|
| `AI_CONTEXT/06_CHANGE_IMPACT_RULES.md` | Prerequisito prima di modificare codice |
| `AI_CONTEXT/07_AI_WORKFLOW.md` | Ruoli Utente / ChatGPT / Gemini (triade) |
| `AI_CONTEXT/29_SPONSOR_SECURITY_MASTERPLAN.md` | SSOT dominio Sponsor |
| `AI_CONTEXT/30_PLATFORM_SETTINGS_MASTERPLAN.md` | SSOT Centro di Controllo |

---

## Versione framework

| Campo | Valore |
|-------|--------|
| **Versione** | 1.0.2 |
| **Data** | 2026-07-13 |
| **Stato** | Framework consolidato — nessun Workflow specifico ancora creato |

---

## Aggiornamento documentale a fine sviluppo (obbligatorio)

Al termine di ogni Fase, STEP o Workflow — e prima di dichiarare **Completato** — verificare quale layer aggiornare in base al **tipo di modifica**, non aggiornare tutto per default.

| Tipo di modifica | `AI_CONTEXT` | `AI_CONTEXT_MASTER` | `AI_DEV_WORKFLOW` |
|------------------|:------------:|:-------------------:|:-----------------:|
| Solo avanzamento lavori (stato, checklist, nessun cambio architettura) | — | — | **Sì** |
| Decisione architetturale di dominio, gate, DoD SSOT | **Sì** (Masterplan / doc dominio) | Valutare | **Sì** |
| Nuovo modulo o pipeline verificata nel codice | **Sì** (doc dominio o mappa) | Valutare | **Sì** |
| Sintesi cross-dominio consolidata e certificata | Valutare | **Sì** | — |
| Apertura / chiusura / sospensione Workflow | — | — | **Sì** (`01`, `03`, file `WORKFLOWS/`) |
| Solo refactor interno senza cambio comportamento né architettura documentata | — | — | **Sì** (nota chiusura) |

**Legenda:** **Sì** = aggiornamento obbligatorio se la riga si applica · **—** = non richiesto · **Valutare** = aggiornare solo se la modifica impatta la vista consolidata o il perimetro documentato.

### Ordine operativo consigliato

1. Aggiornare verità architetturale in **`AI_CONTEXT`** (se applicabile) — con evidenza da codice/DB (`06_CHANGE_IMPACT_RULES.md`).
2. Allineare **`AI_CONTEXT_MASTER`** solo se la modifica richiede aggiornamento della sintesi certificata.
3. Aggiornare **`AI_DEV_WORKFLOW`**: file Workflow → `03_PROJECT_STATUS.md` → `01_EXECUTION_ROADMAP.md` (se nuovo WF o dipendenze).
4. Emettere **report operativo finale** (formato in `00_DEVELOPMENT_PROTOCOL.md` §15) — **ultima sezione** di ogni risposta operativa.

Se un layer **non** viene aggiornato, il report operativo deve dichiararlo con motivazione.

### Convenzione risposte (permanente)

Ogni attività di sviluppo, manutenzione, bugfix, refactoring o aggiornamento documentale termina con la sezione **`## Report operativo`** — vedi `00_DEVELOPMENT_PROTOCOL.md` §15.
