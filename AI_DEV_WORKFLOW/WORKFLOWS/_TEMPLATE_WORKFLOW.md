# WF-XX — [NOME WORKFLOW]

> **Template** — copiare questo file in `WORKFLOWS/WF_XX_<SLUG>.md` e rimuovere il blocco istruzioni.
> **Non** duplicare architettura, Gate o DoD di dominio dagli SSOT.

---

<!-- ISTRUZIONI: eliminare questa sezione nel file reale -->

**Come usare:**

1. Rinominare: `WF_XX_<SLUG>.md` (es. `WF_01_SPONSOR_DOMAIN.md`)
2. Compilare Metadati e link SSOT
3. Definire STEP e Fasi (stati da `02_GOVERNANCE.md`)
4. Tracciare Gate con link al Masterplan — non copiare testo gate
5. Registrare in `01_EXECUTION_ROADMAP.md` e `03_PROJECT_STATUS.md`

---

## Metadati

| Campo | Valore |
|-------|--------|
| **ID** | WF-XX |
| **Nome** | |
| **Stato Workflow** | Non iniziato |
| **SSOT** | *(link, es. `AI_CONTEXT/29_SPONSOR_SECURITY_MASTERPLAN.md`)* |
| **Owner** | |
| **Creato** | YYYY-MM-DD |
| **Ultimo aggiornamento** | YYYY-MM-DD |
| **Aggiornato da** | |

---

## Obiettivo

*(2–4 righe: risultato atteso della macro-iniziativa.)*

---

## Motivazione

*(Perché questo Workflow ora; perché in questo ordine.)*

---

## Prerequisiti

| Prerequisito | Stato | Nota |
|--------------|-------|------|
| Workflow precedente chiuso o PO Override | ☐ | |
| SSOT letti | ☐ | |
| `03_PROJECT_STATUS` allineato | ☐ | |

---

## Gate tracciati (definizione solo negli SSOT)

| Gate | SSOT | Sezione / ID | Stato | Evidenza (1 riga) |
|------|------|--------------|-------|-------------------|
| | | | ☐ | |

---

## STEP-1 — [Nome STEP]

| Campo | Valore |
|-------|--------|
| **Obiettivo** | |
| **Stato STEP** | Non iniziato |
| **DoD STEP** | *(operativo; referenziare DoD dominio SSOT se esiste)* |

### Fasi

| Fase | Stato | Inizio | Fine | PO ✓ |
|------|-------|--------|------|------|
| Analisi | Non iniziato | | | ☐ |
| Pronto per implementazione | — | | | ☐ |
| Sviluppo | — | | | ☐ |
| Review tecnica | — | | | ☐ |
| Test | — | | | ☐ |
| Verifica PO | — | | | ☐ |

### Checklist fase corrente

- [ ] *(compilare al avvio)*

---

## STEP-2 — [Nome STEP]

*(Duplicare struttura STEP-1 per ogni STEP.)*

---

## Log decisioni operative

| Data | Decisione | Chi |
|------|-----------|-----|
| | | |

*Solo esecuzione. Decisioni architetturali → Decision Log del Masterplan SSOT.*

---

## Chiusura Workflow

| Campo | Valore |
|-------|--------|
| **Data chiusura** | |
| **Validazione PO finale** | |
| **Archiviato in** | `WORKFLOWS/_archive/` (se applicabile) |

**Report operativo obbligatorio** → `00_DEVELOPMENT_PROTOCOL.md` §15 (ultima sezione di ogni risposta; stesso schema in chiusura WF).

---

## Cronologia stato (opzionale)

| Data | STEP | Fase | Stato | Nota |
|------|------|------|-------|------|
| | | | | |
