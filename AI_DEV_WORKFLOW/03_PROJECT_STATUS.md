# 03 — Project Status (Dashboard)

> **Sintesi operativa** — lettura target **< 10 secondi**.
> **Nessun dettaglio** STEP/Fasi/checklist (→ `WORKFLOWS/WF_XX_*.md` / `MASTERPLANS/`).
> **Nessuna definizione Gate** (→ SSOT in `AI_CONTEXT`).

**Ultimo aggiornamento:** 2026-08-07 — **Aggiornato da:** AI — **Bonifica Biome:** **B2a `noExplicitAny` COMPLETATO** (0); residue **1660** (errors=1157, warnings=503); R50 + RP-Residual ACCETTATI. Prossimo: **audit PO B2b** (a11y). **WF-QUAL-01:** STEP 4 ancora in attesa ACCETTO PO formale

---

## In sintesi

- **Bonifica Biome (SoT `AI_BIOME_AUDIT.md`):** **B2a `noExplicitAny` COMPLETATO** (A+B+C + R50 + **RP-Residual ACCETTATI**; ultimo hit Roadbook tipizzato). Residue Biome **1660** (baseline 6232 → −4572; avanzamento **73,36%**; errors=1157, warnings=503). `noExplicitAny` corrente **0**. **Prossimo focus:** **audit PO B2b** (a11y ~769) — non auto-bonifica.
- **WF-QUAL-01:** **Attivo** esclusivamente perché manca l’**ACCETTO PO formale** di chiusura. Il lavoro tecnico è **completamente implementato** (STEP 1–3 chiusi con ACCETTO PO; STEP 4 implementato: `strict` + `noFallthroughCasesInSwitch` + `noImplicitOverride`; `noUncheckedIndexedAccess` debito residuo documentato). **Non è prevista alcuna ulteriore attività di sviluppo.** Dopo l’ACCETTO PO il Workflow passerà direttamente a **Completato**. Doc: `WORKFLOWS/WF_QUAL_01_QUALITY_TOOLCHAIN_SOT.md`. Gate ufficiale: `npm run check`.
- **WF-PERF-02:** **Attivo** — STEP 1–2 **IMPLEMENTATI** (Fonts trim zero-uso, priority Home, touch 44px, AI lazy submit, breakpoint SoT) → In verifica PO. Doc: `WORKFLOWS/WF_PERF_02_HIGH_ROI_OPTIMIZATION.md`.
- **WF-PERF-01:** **Attivo** — STEP 3 Completato; STEP 4 In verifica PO; User-scalable ancora **IN DECISIONE PO**. Trim Fonts zero-uso assorbito da WF-PERF-02.
- **MP-01 / MP-02:** **Completati**.
- **MP-03:** **Approvato** — STEP 1 **Completato**; **STEP 2 In verifica PO**.
- **WF-13…WF-05:** **Completati** (archiviati).
- **WF-02:** Attivo — hold STEP-4; **PO-OV-001**.
- **WF-04:** **Sospeso** (`PO-OV-002`).

**Prossima attività (bonifica Biome):** **audit PO B2b** (a11y click/static/labels/ARIA) — **non** auto-bonifica; live `noExplicitAny` **0** / progetto **1660** — [`AI_BIOME_AUDIT.md`](../AI_BIOME_AUDIT.md).  
**Prossima attività (WF formali):** ACCETTO PO su **WF-QUAL-01 STEP 4** (chiusura formale Workflow).  
**SoT:** `03_PROJECT_STATUS.md` · `AI_BIOME_AUDIT.md` (viva) · `AI_BIOME_HISTORY.md` (archivio principale) · `AI_BIOME_HISTORY_LEGACY.md` (dettaglio congelato) · `WORKFLOWS/WF_QUAL_01_QUALITY_TOOLCHAIN_SOT.md` · `tsconfig.app.json` · `biome.json` · `GEMINI.md` · `WORKFLOWS/WF_PERF_02_HIGH_ROI_OPTIMIZATION.md`

---

## Workflow

| WF | Nome | Stato WF | STEP corrente | Fase corrente | % | Blocco |
|----|------|----------|---------------|---------------|---|--------|
| WF-QUAL-01 | Quality Toolchain Source of Truth | Attivo (impl. STEP 4 fatta; manca solo ACCETTO PO) | STEP 4 | In verifica PO | 95 | ACCETTO PO STEP 4 (chiusura WF) |
| WF-PERF-02 | Ottimizzazioni alto ROI (Fonts/LCP/Touch/AI/BP) | Attivo | STEP 1–2 | In verifica PO | 85 | Smoke + ACCETTO PO |
| WF-PERF-01 | Ottimizzazione performance applicativa | Attivo | STEP 4 | In verifica PO | 90 | User-scalable IN DECISIONE PO |
| WF-02 | Implementation Masterplan | Attivo | STEP-3 | Post-3.4 — hold | 99 | Audit A + Validazione STEP-3 |
| WF-03 | MySpace Macrofase 1 | Completato | — | — | 100 | — |
| WF-04 | MySpace Macrofase 2 | Sospeso | — | — | — | PO-OV-002 |
| WF-05 | MP-01 STEP-1 | Completato | — | — | 100 | Archiviato |
| WF-06 | MP-01 STEP-2 | Completato | — | — | 100 | Archiviato |
| WF-07 | MP-01 STEP-3 | Completato | — | — | 100 | Archiviato |
| WF-08 | MP-01 STEP-4 Collaborazione allineata | Completato | — | — | 100 | Archiviato |
| WF-09 | MP-01 STEP-5 Ricordi · Allegati · Mappa · Riepilogo | Completato | — | — | 100 | Archiviato |
| WF-10 | MP-02 STEP-1 MySpace shell | Completato | — | — | 100 | Archiviato |
| WF-11 | MP-02 STEP-2 Sezioni Viaggio | Completato | — | — | 100 | Archiviato |
| WF-12 | MP-02 STEP-3 Root MySpace | Completato | — | — | 100 | Archiviato |
| WF-13 | Associazione / creazione Resource e Salva con nome (decisioni 1–8) | Completato | — | — | 100 | Archiviato |

---

## Gate aperti (riferimento)

| Gate | SoT | Owner WF | Stato |
|------|-----|----------|-------|
| Gate MP-01 STEP-5 / chiusura MP-01 | MP-01 / WF-09 | WF-09 | ☑ Completato |
| Gate MP-02 STEP-1 / WF-10 | MP-02 / DOC 35 | WF-10 | ☑ Completato (ACCETTO PO) |
| Gate MP-02 STEP-2 / WF-11 | MP-02 / DOC 37 | WF-11 | ☑ Completato (ACCETTO PO) |
| Gate MP-02 STEP-3 / WF-12 | MP-02 / DOC 35 | WF-12 | ☑ Completato (review codice) |
| Gate chiusura formale STEP-3 WF-02 | WF-02 / DOC 28–30 | WF-02 | ☐ Audit A + Validazione |
| Gate avvio STEP-4 WF-02 | WF-02 | WF-02 | ☐ hold PO |
| Gate STEP 1 WF-13 | DOC 35/37/31 · WF-13 | WF-13 | ☑ Completato (ACCETTO PO) |
| Gate chiusura WF-13 (STEP 2) | WF-13 | WF-13 | ☑ Completato |
| Gate WF-PERF-01 STEP 3 | WF-PERF-01 | WF-PERF-01 | ☑ Completato (ACCETTO PO) |
| Gate WF-PERF-01 STEP 4 + benchmark | WF-PERF-01 | WF-PERF-01 | ☐ In verifica PO |
| Gate WF-QUAL-01 STEP 1 (CLI SoT) | WF-QUAL-01 | WF-QUAL-01 | ☑ Completato (ACCETTO PO) |
| Gate WF-QUAL-01 STEP 2 (Biome) | WF-QUAL-01 | WF-QUAL-01 | ☑ Completato (avvio STEP 3) |
| Gate WF-QUAL-01 STEP 3 (tool alignment) | WF-QUAL-01 | WF-QUAL-01 | ☑ Completato (avvio STEP 4) |
| Gate WF-QUAL-01 STEP 4 (TS hardening) | WF-QUAL-01 | WF-QUAL-01 | ☐ In verifica PO |

---

## Dipendenze / blocchi

| Da | A | Motivo | Stato |
|----|---|--------|-------|
| WF-12 | Chiusura MP-02 | Sequenza | **Risolta** — WF-12 Completato; **MP-02 concluso** |
| Ambiente MySpace (post MP-02) | WF-13 | Prerequisito funzionale create/associa | **Risolta** — WF-13 Completato |
| WF-11 | WF-12 | Sequenza MP-02 | **Risolta** — WF-11 Completato |
| WF-10 | WF-11 | Sequenza MP-02 | **Risolta** — WF-10 Completato |
| WF-09 | Chiusura MP-01 | Sequenza | **Risolta** — MP-01 concluso |
| WF-02 Audit A | Chiusura formale STEP-3 WF-02 | Sequenza | Aperta (hold) |

---

## Overrule PO attivi

| ID | Tipo | Nota |
|----|------|------|
| PO-OV-001 | hold | WF-02 hold STEP-4 |
| PO-OV-002 | `suspend` | WF-04 sospeso; non riprendere sull’alias Diario≡Viaggio (MP-01 concluso) |

---

## Cronologia breve

| Data | Nota |
|------|------|
| 2026-08-07 | **B2a COMPLETATO** — RP-Residual ACCETTATO (−10 any) + ultimo hit Roadbook tipizzato; `noExplicitAny` **0**; residue **1660** (errors=1157, warnings=503; **73,36%**). Prossimo: **audit PO B2b**. SoT: `AI_BIOME_AUDIT.md` |
| 2026-08-07 | **B2a R50 — fusione piano RP-Residual** — EventsAI+Undo+Core+CityRoad → **RP-Residual** (In audit PO; bonifica **10**/8); Roadbook deferred; live **11**/9; residue **1671**. Prossimo: **ACCETTO PO RP-Residual**. SoT: `AI_BIOME_AUDIT.md` |
| 2026-08-07 | **B2a R50 RP-Settings ACCETTATO** — mini-batch chiuso (−10 any / 6 file → 0; QD type guards GlobalSettingsPanel). Residue **1671** (errors=1157, warnings=514); `noExplicitAny` **11**. Prossimo: **audit PO RP-EventsAI**. SoT: `AI_BIOME_AUDIT.md` |
| 2026-08-07 | **B2a R50 RP-Settings bonifica** — −10 any / 6 file → 0. Residue **1671**; `noExplicitAny` **11**. Attende ACCETTO PO chiusura. SoT: `AI_BIOME_AUDIT.md` |
| 2026-08-07 | **B2a R50 RP-Mech ACCETTATO** — mini-batch chiuso (−7 any / 7 file → 0). Residue **1682**; `noExplicitAny` **21**. Prossimo: **bonifica RP-Settings**. SoT: `AI_BIOME_AUDIT.md` |
| 2026-08-07 | **B2a R50 RP-Pricing ACCETTATO** — mini-batch chiuso. Residue **1692**; `noExplicitAny` **28**. Prossimo: audit residuo R50. SoT: `AI_BIOME_AUDIT.md` |
| 2026-08-07 | **B2a R50 RP-Pricing bonifica** — −6 any / 2 file → 0. Residue **1692**; `noExplicitAny` **28**. Attende ACCETTO chiusura. SoT: `AI_BIOME_AUDIT.md` |
| 2026-08-07 | **B2a R50 RP-Photo ACCETTATO** — mini-batch chiuso. Residue **1698**; `noExplicitAny` **34**. Prossimo: **RP-Pricing**. SoT: `AI_BIOME_AUDIT.md` |
| 2026-08-07 | **B2a R50 RP-Photo bonifica** — −6 any / 4 file → 0. Residue **1698**; `noExplicitAny` **34**. SoT: `AI_BIOME_AUDIT.md` |
| 2026-08-07 | **B2a R50 piano RP-* ACCETTATO** — revisione operativa (8 batch aperti; somma **40** hit). SoT: `B2a_R50_RESIDUAL_ANY_AUDIT.md` |
| 2026-08-07 | **B2a R50 R1 ACCETTATO** — mini-batch chiuso (−10 any / `useServiceRegeneration`→0). Residue **1704**; `noExplicitAny` **40**. SoT: `AI_BIOME_AUDIT.md` · `B2a_R50_RESIDUAL_ANY_AUDIT.md` |
| 2026-08-07 | **B2a Batch C1 ACCETTATO** — Batch C **completo** (C1–C6). Residue allora **1714**; `noExplicitAny` **50**; perimetro C1 **71→0**. SoT: `AI_BIOME_AUDIT.md` |
| 2026-08-07 | **C5 audit PO avvio**. Perimetro live **8**/2; unico batch proposto; in attesa ACCETTO. SoT: `B2a_C5_START_PO_AUDIT.md` |
| 2026-08-07 | **B2a Batch C4 ACCETTATO** (PO formale). Residue **1825**; `noExplicitAny` **144**; 0 residui nei 7 service C4. Focus: **C5**. SoT: `AI_BIOME_AUDIT.md` |
| 2026-08-06 | **B2a Batch C3 ACCETTATO**. Residue **1840**; `noExplicitAny` **159**; 0 residui context. Focus: audit PO **C4**. SoT: `AI_BIOME_AUDIT.md` |
| 2026-08-06 | **C3 parziale (doc sync)** *(storico)*. Residue **1851**; `noExplicitAny` **167**; 8 residui context. |
| 2026-08-06 | **B2a Batch C2 ACCETTATO**. Residue **1885**; `noExplicitAny` **202**. Focus: audit PO **C3**. SoT: `AI_BIOME_AUDIT.md` |
| 2026-08-06 | **Drift L0 riconciliato** (−75). Residue **1892**; escluso `format`×1 `index.css`. SoT: `AI_BIOME_AUDIT.md` |
| 2026-08-06 | **Bonifica Biome B2a Batch A+B ACCETTATI**. Residue allora **1967**; `noExplicitAny` **209**. Focus: audit **Batch C**. SoT: `AI_BIOME_AUDIT.md` |
| 2026-08-04 | **Bonifica Biome B1a/B1b/B1c** ACCETTATI (1215 diag. L0 ex-L1 → 0). Residue allora **2134**. Focus successivo era **B2a**. SoT: `AI_BIOME_AUDIT.md` |
| 2026-08-02 | **WF-QUAL-01 STEP 4** hardening TS (`strict` + correlate; `typecheck` verde; `noUncheckedIndexedAccess` rimandata) → In verifica PO |
| 2026-08-02 | **WF-QUAL-01 STEP 3** allineamento VS Code / IDX / Cursor / Gemini Completato (avvio STEP 4); gate CLI invariato |
| 2026-08-02 | **WF-QUAL-01 STEP 2** Biome SoT (`lint`=`biome check`, ESLint rimosso, `check` include lint) Completato; avvio STEP 3 |
| 2026-08-02 | **WF-QUAL-01** aperto; **STEP 1** infrastruttura CLI (`typecheck` / `check`) Completato → In verifica PO; STEP 2 attende OK PO |
| 2026-07-29 | **WF-PERF-01 STEP 4** implementato (virtual / immagini / Around Me batch / polling / benchmark) → In verifica PO |
| 2026-07-29 | **WF-PERF-01 STEP 3** Completato (ACCETTO PO — overlay idle / freeze); WF resta Attivo (4 STEP) |
| 2026-07-29 | **WF-PERF-01 STEP 2** implementato (bundle) → In verifica PO |
| 2026-07-28 | **WF-PERF-01** aperto (4 STEP performance); avvio **STEP 1** Context |
| 2026-07-28 | **WF-13 Completato** (STEP 2 consolidamento + archivio) |
| 2026-07-28 | **WF-13 STEP 1 Completato** (ACCETTO PO — file accettati) |
| 2026-07-28 | **WF-13 STEP 1** implementato → **In verifica PO** (decisioni 1–8) |
| 2026-07-28 | Apertura piano **WF-13** (decisioni 1–8 create/associa/Salva con nome) — **solo 2 STEP** |
| 2026-07-28 | WF-12 **Completato** (archiviato); **MP-02 concluso** |
| 2026-07-27 | WF-10 / WF-11 / allineamento DOC MySpace + MP-02 |
| 2026-07-26 | WF-07 **Completato**; apertura WF-08 |
