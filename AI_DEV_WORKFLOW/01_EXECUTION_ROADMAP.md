# 01 — Execution Roadmap (TouringDiary)

> **Indice esecutivo** — quali Workflow esistono, in che ordine, da cosa dipendono.
> **Non** contiene dettaglio STEP/Fasi → `WORKFLOWS/WF_XX_*.md`.
> **Non** contiene stato «live» → `03_PROJECT_STATUS.md`.
> **Non** definisce Gate → Masterplan SSOT in `AI_CONTEXT`.

---

## 1. Scopo

Questo documento risponde a:

- Quali **macro-iniziative** (Workflow) sono **ufficialmente aperti**?
- Qual è l'**ordine** e le **dipendenze** tra Workflow creati?
- Quali **SSOT** governa ciascun Workflow (link nel file WF)?

Per *dove siamo oggi* aprire sempre prima `03_PROJECT_STATUS.md`.

**Regola:** un Workflow compare in questa roadmap **solo** quando il file `WORKFLOWS/WF_XX_*.md` è stato creato e la macro-iniziativa è stata **ufficialmente aperta** (registrata qui e in `03_PROJECT_STATUS.md`). Nessuna voce «pianificata» o «prevista».

---

## 2. Regole

1. Ogni riga della tabella §3 corrisponde a **un file** in `WORKFLOWS/` (quando creato).
2. Aggiungere un Workflow = nuovo file da `_TEMPLATE_WORKFLOW.md` + riga qui + riga in `03_PROJECT_STATUS.md`.
3. **Un Workflow Attivo** per default (salvo PO Override).
4. Le percentuali di avanzamento **non** si duplicano qui — solo in `03_PROJECT_STATUS` e nel file WF.

---

## 3. Indice Workflow

| WF | Nome | File | SSOT principali | Dipende da | Stato |
|----|------|------|-----------------|------------|-------|
| WF-01 | Migrazione documentale completa | `WORKFLOWS/WF_01_DOCUMENTATION_MIGRATION.md` | `AI_CONTEXT/` (DOC 16, 28, 31, 32) | — | Completato |
| WF-02 | Implementation Masterplan | `WORKFLOWS/WF_02_IMPLEMENTATION_MASTERPLAN.md` | DOC 29, 30, 31 (vincoli), 32 (vincoli) | WF-01 | Attivo |

---

## 4. Diagramma dipendenze

```
WF-01 (Completato) ──► WF-02 (Attivo)
```

---

## 5. Procedura — aprire un Workflow

1. Assegnare ID `WF-XX` (prossimo numero libero).
2. Copiare `WORKFLOWS/_TEMPLATE_WORKFLOW.md` → `WORKFLOWS/WF_XX_<SLUG>.md`.
3. Compilare metadati e link SSOT nel nuovo file.
4. Aggiungere riga in §3 (tabella indice).
5. Aggiornare diagramma §4 se serve.
6. Aggiornare `03_PROJECT_STATUS.md`.

---

## 6. Anticipazioni post-WF-02 (non ancora aperte formalmente)

*Non compare in §3 finché non esiste `WORKFLOWS/WF_XX_*.md` e apertura ufficiale.*

| WF previsto | Nome | Stato decisione | Note |
|-------------|------|-----------------|------|
| **WF-03** | Privacy avanzata | Anticipazione | Gestione compliance estesa — DL-P09 DOC 30. Dipende da: WF-02. |
| *(da definire)* | Messaggistica unificata | Anticipazione | Dominio autonomo — G-MSG-1 step 5, DOC 29. Dipende da: WF-02 + review UI G-MSG-1. |
| *(da definire)* | ID Governance | Anticipazione (non approvata) | Consolidare **regole** del modello dual-family (text territoriale / UUID piattaforma) — **senza** migrare a un modello unico. SSOT: `AI_CONTEXT/33_ID_MODEL_DUAL_FAMILY.md` (DL-035 DOC 29). Nessuna dipendenza formale oggi; **non** interrompe WF-02. Prima dell’avvio: **nuova ricognizione obbligatoria** (Product Owner, ChatGPT e l’AI utilizzata nello sviluppo) su effort, benefici, nuovi domini/generatori, impatto WF completati, Governance Light vs Completa. |

---

## Cronologia roadmap

| Versione | Data | Modifiche |
|----------|------|-----------|
| 1.0.0 | 2026-07-13 | Creazione framework; indice vuoto |
| 1.0.1 | 2026-07-13 | Roadmap neutra — solo Workflow ufficialmente aperti |
| 1.0.2 | 2026-07-14 | WF-01 Completato; apertura WF-02 Implementation Masterplan |
| 1.0.3 | 2026-07-14 | §6 Anticipazioni WF-03 Privacy (DL-P09) |
| 1.0.4 | 2026-07-16 | §6 anticipazione ID Governance (non approvata; gate rivalutazione) |
| 1.0.5 | 2026-07-16 | §6 tabella anticipazioni uniforme; formulazione rivalutazione ID Governance stabilizzata |
