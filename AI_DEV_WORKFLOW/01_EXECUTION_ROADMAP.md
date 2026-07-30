# 01 — Execution Roadmap (TouringDiary)

> **Indice esecutivo** — Workflow e Masterplan di implementazione: ordine e dipendenze.
> **Stato live** (%, fase corrente) → `03_PROJECT_STATUS.md`.
> **Regole / stati / Override** → `02_GOVERNANCE.md`.
> **Gate di dominio** → SSOT in `AI_CONTEXT` (non ridefiniti qui).

---

## 1. Scopo

Risponde a:

1. Quali **Workflow** esistono e in che **stato** (attivo / completato / sospeso)?
2. Quali **Masterplan di implementazione** (`MASTERPLANS/`) orientano i Workflow futuri?
3. Qual è l’ordine / dipendenza tra iniziative?

**Regola indice Workflow:** una riga in §3 solo se esiste `WORKFLOWS/WF_XX_*.md` e l’iniziativa è stata aperta ufficialmente.  
**Regola Masterplan:** un Masterplan può esistere **prima** dei Workflow che lo eseguono; non è un Workflow.

---

## 2. Legenda rapida

| Tipo | Dove | Eseguibile? |
|------|------|-------------|
| **Workflow Attivo** | §3.1 | Sì — STEP/Fasi nel file WF |
| **Workflow Completato** | §3.2 (o `_archive/`) | No — archivio |
| **Workflow Sospeso** | §3.3 | **No** — non riprendere senza Override `resume` + piano vigente |
| **Masterplan** | §4 | No codice da solo — genera Workflow su ordine PO |
| **Anticipazione** | §6 | Non aperta — solo memoria di prodotto |

---

## 3. Indice Workflow

### 3.1 Attivi / aperti

| WF | Nome | File | SSOT / Masterplan | Dipende da | Nota stato |
|----|------|------|-------------------|------------|------------|
| WF-PERF-01 | Ottimizzazione performance applicativa | `WORKFLOWS/WF_PERF_01_PERFORMANCE_OPTIMIZATION.md` | Audit perf 2026-07-28; layer/focus/context | — (parallelo a WF-02 hold) | **Attivo** — STEP 3 Completato; STEP 4 In verifica PO |
| WF-02 | Implementation Masterplan | `WORKFLOWS/WF_02_IMPLEMENTATION_MASTERPLAN.md` | DOC 29, 30, 31 (vincoli), 32 (vincoli) | WF-01 | Hold STEP-4 |

### 3.2 Completati

| WF | Nome | File | Nota |
|----|------|------|------|
| WF-13 | Associazione / creazione Resource e Salva con nome (decisioni 1–8) | `WORKFLOWS/_archive/WF_13_RESOURCE_ASSOCIATION_CREATE_SAVEAS.md` | Completato (archiviato) 2026-07-28 — STEP 1+2 |
| WF-01 | Migrazione documentale completa | `WORKFLOWS/_archive/WF_01_DOCUMENTATION_MIGRATION.md` | Archiviato |
| WF-03 | MySpace Macrofase 1 — MyWorld & shell | `WORKFLOWS/WF_03_MYSPACE_MACROFASE_1.md` | Macrofase 1 chiusa |
| WF-05 | MP-01 STEP-1 — Fondazione persistenza Viaggio / Diario | `WORKFLOWS/_archive/WF_05_MP01_STEP1_VIAGGIO_PERSISTENCE.md` | Completato (archiviato) 2026-07-26 |
| WF-06 | MP-01 STEP-2 — MySpace catalogo e cartella sul Viaggio | `WORKFLOWS/_archive/WF_06_MP01_STEP2_MYSPACE_VIAGGIO_CATALOG.md` | Completato (archiviato) 2026-07-26 |
| WF-07 | MP-01 STEP-3 — Risorse operative Viaggio | `WORKFLOWS/_archive/WF_07_MP01_STEP3_VIAGGIO_OPERATIVE_RESOURCES.md` | Completato (archiviato) 2026-07-26 |
| WF-08 | MP-01 STEP-4 — Collaborazione allineata | `WORKFLOWS/_archive/WF_08_MP01_STEP4_COLLABORATION_ALIGNED.md` | Completato (archiviato) 2026-07-27 |
| WF-09 | MP-01 STEP-5 — Ricordi · Allegati · Mappa · Riepilogo | `WORKFLOWS/_archive/WF_09_MP01_STEP5_RICORDI_ALLEGATI_MAPPA_RIEPILOGO.md` | Completato (archiviato) 2026-07-27 — **MP-01 concluso** |
| WF-10 | MP-02 STEP-1 — MySpace shell UX | `WORKFLOWS/_archive/WF_10_MP02_STEP1_MYSPACE_SHELL.md` | Completato (archiviato) 2026-07-27 — **MP-02 STEP-1** |
| WF-11 | MP-02 STEP-2 — Sezioni Viaggio | `WORKFLOWS/_archive/WF_11_MP02_STEP2_VIAGGIO_SECTIONS.md` | Completato (archiviato) 2026-07-28 — **MP-02 STEP-2** |
| WF-12 | MP-02 STEP-3 — Root MySpace | `WORKFLOWS/_archive/WF_12_MP02_STEP3_MYSPACE_ROOTS.md` | Completato (archiviato) 2026-07-28 — **MP-02 concluso** |

### 3.3 Sospesi

| WF | Nome | File | Override | Motivo |
|----|------|------|----------|--------|
| WF-04 | MySpace Macrofase 2 — I miei Viaggi | `WORKFLOWS/WF_04_MYSPACE_MACROFASE_2.md` | **PO-OV-002** | Alias non più valido; MP-01 concluso; non riprendere sull’alias |

---

## 4. Masterplan di implementazione

> Separati dai Workflow. Descrivono il **COME** a macro-STEP.  
> I Workflow esecutivi si aprono **da** un Masterplan (o da SSOT dominio), non viceversa.

| ID | File | Relazione | Stato |
|----|------|-----------|-------|
| **MP-01** | `MASTERPLANS/MP_01_VIAGGIO_DOMAIN_IMPLEMENTATION.md` | 5 STEP → WF-05…WF-09. **Completato.** **No WF-10 automatico.** | **Completato** 2026-07-27 |
| **MP-02** | `MASTERPLANS/MP_02_MYSPACE_UX_REALIGNMENT.md` | 3 STEP UX MySpace → WF-10…WF-12. **Completato.** **Nessun WF successivo automatico.** | **Completato** 2026-07-28 |

```text
Dominio (AI_CONTEXT: 34A / 37 / 35 / 36 / 28 Parte A)
        ↓
   MP-01 (COME — 5 STEP) — COMPLETATO
        └──► WF-05…WF-09 ── tutti Completati (archiviati)
        ↓
   MP-02 (COME — 3 STEP UX MySpace) — COMPLETATO
        ├── STEP-1 → WF-10 (Completato / archiviato)
        ├── STEP-2 → WF-11 (Completato / archiviato)
        └── STEP-3 → WF-12 (Completato / archiviato)
```

---

## 5. Diagramma dipendenze

```text
WF-01 Completato
    └──► WF-02 Attivo (hold STEP-4)
              │
              │ PO-OV-001 parallel_start
              ▼
         WF-03 Completato (MyWorld / shell MySpace)
              │
              ├─► WF-04 Sospeso (PO-OV-002) ── non eseguibile
              │
              └─► MP-01 ── COMPLETATO
                    ├──► WF-05…WF-09 ── Completati (archiviati)
                    └──► MP-02 ── COMPLETATO
                          ├──► WF-10 Completato (archiviato)
                          ├──► WF-11 Completato (archiviato)
                          └──► WF-12 Completato (archiviato)
                                │
                                └─► WF-13 Completato (archiviato) — decisioni 1–8 create/associa/Salva con nome

WF-PERF-01 Attivo (STEP 4 In verifica PO; STEP 3 Completato; STEP 1–2 In verifica PO) — parallelo a WF-02 hold; esclusioni cartografia
```

---

## 6. Anticipazioni (non aperte)

| Tema | Dipende da | Note |
|------|------------|------|
| — | — | MP-02 concluso; **WF-13** Completato; **WF-PERF-01** attivo (performance). |
| Privacy avanzata | WF-02 | DL-P09 DOC 30 |
| Messaggistica unificata | WF-02 + review UI G-MSG-1 | G-MSG-1 step 5, DOC 29 |
| ID Governance | — | Non approvata. DOC 33 / DL-035 |
| Sponsor ↔ POI attach-or-create | — | Non approvata. DL-036 DOC 29 |

---

## 7. Procedura — aprire un Workflow

1. Assegnare ID `WF-XX` (prossimo libero).
2. Se deriva da Masterplan: citare `MASTERPLANS/MP_XX_…` e lo STEP di origine nei metadati WF.
3. Copiare `WORKFLOWS/_TEMPLATE_WORKFLOW.md` → `WORKFLOWS/WF_XX_<SLUG>.md`.
4. Compilare metadati e link SSOT.
5. Aggiornare §3 (e §4 se apre/chiude uno STEP Masterplan).
6. Aggiornare diagramma §5 se serve.
7. Aggiornare `03_PROJECT_STATUS.md`.

Dettaglio stati / Override → `02_GOVERNANCE.md`.

---

## Cronologia roadmap

| Versione | Data | Modifiche |
|----------|------|-----------|
| 1.3.0 | 2026-07-26 | WF-06 Completato; apertura WF-07 |
| 1.4.0 | 2026-07-26 | WF-07 Completato (archiviato); apertura **WF-08** (MP-01 STEP-4) — solo doc |
| 1.5.0 | 2026-07-27 | WF-08 STEP-4 implementato → **In verifica PO**; WF-09 non aperto |
| 1.6.0 | 2026-07-27 | WF-08 Completato (archiviato); apertura doc **WF-09** (MP-01 STEP-5) — Pronto per implementazione |
| 1.7.0 | 2026-07-27 | WF-09 STEP-5 implementato → **In verifica PO**; chiusura MP-01 post-ACCETTO; no WF-10 auto |
| 1.8.0 | 2026-07-27 | WF-09 Completato (archiviato); **MP-01 concluso**; no WF-10 automatico |
| 1.9.0 | 2026-07-27 | DOC MySpace allineati; **MP-02** aggiunto (3 STEP UX); WF non aperti |
| 1.10.0 | 2026-07-27 | MP-02 approvato; **WF-10** (STEP-1) implementato → In verifica PO |
| 1.11.0 | 2026-07-27 | WF-10 Completato (archiviato); apertura **WF-11** (MP-02 STEP-2) |
| 1.11.1 | 2026-07-27 | WF-11 implementato → In verifica PO |
| 1.12.0 | 2026-07-28 | WF-11 Completato (archiviato); apertura **WF-12** (MP-02 STEP-3) |
| 1.13.0 | 2026-07-28 | WF-12 Completato (archiviato); **MP-02 concluso**; nessuna ripresa automatica |
| 1.14.0 | 2026-07-28 | Apertura piano **WF-13** (decisioni 1–8 create/associa/Salva con nome) — **solo 2 STEP**; Non iniziato |
| 1.15.0 | 2026-07-28 | **WF-13 Completato** (STEP 2 consolidamento + archivio); decisioni 1–8 operative e hardenizzate |
| 1.16.0 | 2026-07-28 | Apertura **WF-PERF-01** (4 STEP performance; no cartografia); avvio STEP 1 Context |
| 1.17.0 | 2026-07-29 | **WF-PERF-01 STEP 2** implementato (bundle TipTap/Export/manualChunks) → In verifica PO |
| 1.18.0 | 2026-07-29 | **WF-PERF-01 STEP 3** Completato (ACCETTO PO — ModalManager idle / FocusIdleBoundary / Sidebar mobile) |
| 1.19.0 | 2026-07-29 | **WF-PERF-01 STEP 4** implementato (virtual Suitcase+PoiList, sizes/LCP, Around Me batch, polling, benchmark) → In verifica PO; WF resta Attivo |
