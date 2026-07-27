# AI_DEV_WORKFLOW — TouringDiary

> **Punto di ingresso del layer operativo** — dove siamo e come lavoriamo.  
> **Non** descrive l’architettura di prodotto. **Non** sostituisce gli SSOT in `AI_CONTEXT/`.

---

## Percorso di ingresso (< 30 s)

```text
Nuovo sviluppatore / nuova AI
        ↓
AI_CONTEXT/README_AI.md          ← architettura e SSOT
        ↓
AI_DEV_WORKFLOW/03_PROJECT_STATUS.md   ← dove siamo ora
        ↓
Workflow attivo (path nello status)
        ↓
SSOT necessari (solo se serve decisione di dominio)
        ↓
Codice
```

Dettaglio ordine di lettura → sezione sotto.

---

## I tre layer

| Layer | Percorso | Domanda |
|-------|----------|---------|
| Architettura / dominio | `AI_CONTEXT/` | *Cosa è il sistema?* |
| Vista consolidata | `AI_CONTEXT_MASTER/` | *Come è fatto nel complesso?* |
| Sviluppo operativo | `AI_DEV_WORKFLOW/` | *Come lo sviluppiamo e dove siamo?* |

Confini e aggiornamento a cascata → `00_DEVELOPMENT_PROTOCOL.md` · `02_GOVERNANCE.md`.

---

## Struttura di questa cartella

| Path | Ruolo |
|------|--------|
| `00_DEVELOPMENT_PROTOCOL.md` | Metodo di lavoro (permanente) |
| `01_EXECUTION_ROADMAP.md` | Indice Workflow + Masterplan + dipendenze |
| `02_GOVERNANCE.md` | Stati, sequenza, PO Override, naming |
| `03_PROJECT_STATUS.md` | Dashboard live (< 10 s) |
| `WORKFLOWS/` | Un file per macro-iniziativa (`WF_XX_*.md`) |
| `MASTERPLANS/` | Piani di implementazione (COME) — es. MP-01 |
| `WORKFLOWS/_TEMPLATE_WORKFLOW.md` | Scaffold nuovo Workflow |
| `WORKFLOWS/_archive/` | Workflow completati archiviati |

Processi permanenti e SoT di collaudo specifici vivono nei rispettivi file sotto `WORKFLOWS/` (es. WF-RV-01, Audit B).

---

## Ordine di lettura

### Boot (umano o AI)

1. `AI_CONTEXT/README_AI.md` — architettura  
2. **`03_PROJECT_STATUS.md`** — dove siamo  
3. Workflow / Masterplan indicati nello status  
4. SSOT in `AI_CONTEXT/` — solo se serve una decisione di dominio  

### Nuova macro-iniziativa

Protocollo + Governance → template WF → registrazione in Roadmap + Status.  
Se l’iniziativa deriva da un Masterplan: partire da `MASTERPLANS/`, non da un WF sospeso.

### Lavoro quotidiano

`03_PROJECT_STATUS.md` → file WF attivo → SSOT/Masterplan solo a bisogno.

---

## Collegamenti utili (riferimenti)

| Documento | Quando |
|-----------|--------|
| `03_PROJECT_STATUS.md` | Sempre per lo stato corrente |
| `01_EXECUTION_ROADMAP.md` | Indice WF / MP / dipendenze |
| `WORKFLOWS/WF_09_MP01_STEP5_RICORDI_ALLEGATI_MAPPA_RIEPILOGO.md` | WF attivo — MP-01 STEP-5 (In verifica PO) |
| `WORKFLOWS/_archive/WF_08_MP01_STEP4_COLLABORATION_ALIGNED.md` | MP-01 STEP-4 chiuso |
| `WORKFLOWS/_archive/WF_07_MP01_STEP3_VIAGGIO_OPERATIVE_RESOURCES.md` | MP-01 STEP-3 chiuso |
| `WORKFLOWS/_archive/WF_06_MP01_STEP2_MYSPACE_VIAGGIO_CATALOG.md` | MP-01 STEP-2 chiuso |
| `WORKFLOWS/_archive/WF_05_MP01_STEP1_VIAGGIO_PERSISTENCE.md` | MP-01 STEP-1 chiuso |
| `MASTERPLANS/MP_01_VIAGGIO_DOMAIN_IMPLEMENTATION.md` | Implementazione dominio Viaggio (5 STEP) |
| `AI_CONTEXT/34A_DOMAIN_DESIGN_RULES.md` · `37_VIAGGIO_DOMAIN.md` | Costituzione e struttura Viaggio |
| `AI_CONTEXT/06_CHANGE_IMPACT_RULES.md` | Prima di modificare codice |

Elenco completo SSOT di dominio → `AI_CONTEXT/README_AI.md`.  
Report operativo a fine attività → `00_DEVELOPMENT_PROTOCOL.md` §15.

---

## Aggiornamento documentale

Al termine di ogni attività, aggiornare i layer in base al **tipo di modifica** (non tutto per default).  
Matrice e ordine operativo → questa sezione; regole di report → `00_DEVELOPMENT_PROTOCOL.md` §15 (e principio §2.8 *Documentazione vivente*).

| Tipo di modifica | `AI_CONTEXT` | `AI_CONTEXT_MASTER` | `AI_DEV_WORKFLOW` |
|------------------|:------------:|:-------------------:|:-----------------:|
| Solo avanzamento lavori (stato, checklist, nessun cambio architettura) | — | — | **Sì** |
| Decisione architetturale di dominio, gate, DoD SSOT | **Sì** | Valutare | **Sì** |
| Nuovo modulo o pipeline verificata nel codice | **Sì** | Valutare | **Sì** |
| Sintesi cross-dominio consolidata e certificata | Valutare | **Sì** | — |
| Apertura / chiusura / sospensione Workflow | — | — | **Sì** (`01`, `03`, file `WORKFLOWS/`) |
| Solo refactor interno senza cambio comportamento né architettura documentata | — | — | **Sì** (nota chiusura) |

**Legenda:** **Sì** = obbligatorio se la riga si applica · **—** = non richiesto · **Valutare** = solo se impatta la vista consolidata.

---

## Versione framework

| Campo | Valore |
|-------|--------|
| **Versione** | 1.3.0 |
| **Data** | 2026-07-27 |
| **Stato** | WF-09 (MP-01 STEP-5) **In verifica PO**; MP-01 da chiudere post-ACCETTO; no WF-10 automatico |
