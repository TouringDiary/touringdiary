# AI Biome History

Archivio storico **principale** della bonifica Biome full-project TouringDiary.

> **Non** è la Source of Truth operativa.
> SoT viva (stato corrente, dashboard, roadmap aperta, workflow, regole): [AI_BIOME_AUDIT.md](./AI_BIOME_AUDIT.md).
> Questo file conserva cronologia, decisioni, contabilità e riferimenti di ciò che è concluso.
> Il dettaglio congelato (cataloghi hit-per-hit, elenchi file, testo L0/L1/L2–L4 pre-split) vive in [`AI_BIOME_HISTORY_LEGACY.md`](./AI_BIOME_HISTORY_LEGACY.md).
> **Nessuna informazione eliminata** negli split 2026-08-04 (SoT/History) e 2026-08-06 (History/Legacy): solo separazione per manutenibilità.

| Documento | Ruolo |
|-----------|--------|
| [AI_BIOME_AUDIT.md](./AI_BIOME_AUDIT.md) | SoT operativa viva |
| [AI_BIOME_HISTORY.md](./AI_BIOME_HISTORY.md) (questo file) | Archivio storico **principale** |
| [AI_BIOME_HISTORY_LEGACY.md](./AI_BIOME_HISTORY_LEGACY.md) | Dettaglio congelato / appendici |
| [AI_BIOME_AUDIT_35_FILES_HISTORY.md](./AI_BIOME_AUDIT_35_FILES_HISTORY.md) | Storico audit parziale 35 file |
| [AI_QUALITY/README.md](./AI_QUALITY/README.md) | Dettaglio per categoria (supporto) |

---

# Indice archivio

1. [Diario avanzamento (completo)](#diario-avanzamento-completo)
2. [Registro delle decisioni (completo)](#registro-delle-decisioni-completo)
3. [Contabilità storica A–D + indice AI_QUALITY](#contabilità-storica-ad--indice-ai_quality)
4. [Categorie chiuse (estratto snapshot)](#categorie-chiuse-estratto-snapshot)
5. [Dettaglio batch conclusi L0 + L1 (sintesi)](#dettaglio-batch-conclusi-l0--l1)
6. [Testo pre-split L2 / L3 / L4 (puntatore)](#testo-pre-split-l2--l3--l4-congelato)
7. [Snapshot intermedi severity / confronto](#snapshot-intermedi-severity--confronto)
8. [Esito validazione batch L0 (chiuso)](#esito-validazione-batch-l0-chiuso)
9. [Gerarchia documentale](#gerarchia-documentale)
10. [Documenti correlati](#documenti-correlati)

> Dettaglio Legacy: [`AI_BIOME_HISTORY_LEGACY.md`](./AI_BIOME_HISTORY_LEGACY.md)

---

# Diario avanzamento (completo)

> Spostato dalla SoT viva. Gli eventi storici chiusi restano qui; lo stato corrente del piano vive in AI_BIOME_AUDIT.md Parte 4.

| Data | Evento | Residue | Note |
|----|----|---:|----|
| 2026-08-03 | Baseline ufficiale | 6232 | Prima fotografia full-project |
| 2026-08-04 | Snapshot + livelli L0–L4 | 6157 | −75 vs baseline; nessuna correzione codice |
| 2026-08-04 | Workflow di governance | 6157 | Livelli dinamici, stati operativi, Registro, ciclo SoT |
| 2026-08-04 | Validazione post-bonifica | 6157 | Gate check → typecheck → build → smoke PO → accettazione → SoT |
| 2026-08-04 | **Esecuzione batch L0** | ~3358 | Bonifica meccanica; SoT non aggiornata fino ad accettazione |
| 2026-08-04 | **ACCETTO PO L0 + chiusura SoT** | **3358** | L0 **COMPLETATO** (−2801 L0; residuo format×1). Sezione Avanzamento per livello istituita |
| 2026-08-04 | **Audit strategico L1** | **3358** | 9/9 schede; chiusura classificazione **non** chiusa (punti aperti A/B/C) |
| 2026-08-04 | **Iniziali per livello congelati** | **3358** | Regola permanente: Iniziali L0–L4 immutabili (2802/1233/1764/350/8); baseline progetto 6232 |
| 2026-08-04 | **Verifica chiusura L1 + piano A/B/C** | **3358** | Solo Gruppo A (8 diag.) già promuovibile; B=1207 da chiudere; C=18 fuori massa |
| 2026-08-04 | **Catalogo operativo Gruppo B CHIUSA** | **3358** | 1207/1207 → L0 Batch pronto; 0 L4/D da B. Classificazione L1 formale **CHIUSA**. 1215 totali L0-pronti (A+B); 18 → L4 (C) |
| 2026-08-04 | **ACCETTO PO B1a/B1b/B1c + chiusura SoT** | **2134** | −1215 L0 ex-L1 (+ collaterali). 7 cat. Chiusa. Prossimo = **B2a** (`noExplicitAny` 446) |
| 2026-08-04 | **Split documentale SoT / History** | **2134** | `AI_BIOME_AUDIT.md` = SoT viva; `AI_BIOME_HISTORY.md` = archivio concluso; zero perdita info |
| 2026-08-05 | **B2a Batch A ACCETTATO** | **2011** | −123 `noExplicitAny`; 7 collaterali `noGlobalIsNan` accettate (non riproposte) |
| 2026-08-05 | **B2a Batch B in review finale** | **2011** SoT | Codice B + Quality Delta; review aperta (stato superseduto dall’ACCETTO del 2026-08-06) |
| 2026-08-06 | **B2a Batch B ACCETTATO — batch chiuso** | **1967** | ACCETTO PO; review architetturale completata; nessuna regressione; nessun nuovo debito tecnico; Quality Delta applicati; SoT aggiornata (snapshot Biome post-ACCETTO) |
| 2026-08-06 | **Split documentale History / Legacy** | **1967** | Dettaglio L0/L1 + appendici + testo pre-split L2–L4 → `AI_BIOME_HISTORY_LEGACY.md`; History resta archivio consultabile |
| 2026-08-06 | **Riconciliazione drift L0 post-B** | **1892** | −75 meccaniche (`format`/`organizeImports`/`useImportType`); escluso `format`×1 `index.css` bloccato da `parse` |
| 2026-08-06 | **Regola permanente audit UI/dominio (§21)** | **1892** | Audit architetturali: A UI/dominio + B codice; avvio Batch C documentato (C2, nessun fix) |
| 2026-08-06 | **§21.1 percorsi QA reali + §22 anti-frammentazione** | **1892** | C2 rivalutato: unico batch omogeneo consigliato |
| 2026-08-06 | **B2a Batch C2 ACCETTATO — batch chiuso** | **1885** | −7 `noExplicitAny`; Quality Delta + smoke OK; prossimo = audit PO C3 |
| 2026-08-06 | **B2a Batch C3 — bonifica parziale (doc sync)** | **1851** | −35 `noExplicitAny` già in codice; 8 residui context; SoT riallineata; C3 non chiuso |
| 2026-08-06 | **B2a Batch C3 ACCETTATO — batch chiuso** | **1840** | Context Modal/Config/CityEditor tipizzati (−8 any); `ModalPropsBag`; Quality Delta OK; typecheck = 3 save-hook baseline; build OK; prossimo = C4 |
| 2026-08-07 | **B2a Batch C4 ACCETTATO — batch chiuso** | **1825** | ACCETTO PO formale; Services (−15 any / 7 file → 0); riuso `GeoIdNameOption`/`ContactInfo`/`Json`; Quality Delta OK; typecheck = 3 save-hook baseline; prossimo = C5 |
| 2026-08-07 | **B2a Batch C5 — audit PO avvio** | **1825** | Perimetro live **8** hit / **2** file; unico batch (§22); `interactionService` escluso (B file separato); nessun fix codice |
| 2026-08-07 | **B2a Batch C5 ACCETTATO — batch chiuso** | — | Community (−8 any / 2 file → 0); leftover B co-locati; sync SoT con C6 |
| 2026-08-07 | **B2a Batch C6 ACCETTATO — batch chiuso** | **1799** | Utils/Undo/Rankings (−15 any / 5 file → 0); QD FullRankingsModal/ImportStatsBar; residual B packing escluso; `noExplicitAny` **121**; prossimo = C1 |
| 2026-08-07 | **B2a Batch C1 — audit PO avvio** | **1799** | Perimetro live **71**/19 (incluso `useCityGenerator`); piano boundary-first; nessun fix |
| 2026-08-07 | **B2a Batch C1 — bonifica completata** | **1714** | −71 any / 19 file → 0; boundary-first; typecheck/build OK; attende ACCETTO chiusura |
| 2026-08-07 | **B2a Batch C1 ACCETTATO — Batch C completo** | **1714** | ACCETTO PO; C1–C6 chiusi; `noExplicitAny` **50**; audit residui R50 |
| 2026-08-07 | **B2a R50 — audit residui** | **1714** | Inventario **50**/28; piano mini-batch R1–R10; nessun fix in audit |
| 2026-08-07 | **B2a R50 R1 ACCETTATO — mini-batch chiuso** | **1704** | −10 any / 1 file → 0; Quality Delta OK; `noExplicitAny` **40**; prossimo = ACCETTO R4 |
| 2026-08-07 | **B2a R50 — revisione piano RP-* ACCETTATA** | **1704** | Accorpamenti operativi (9→8 aperti); inventario invariato; prossimo = ACCETTO RP-Photo |
| 2026-08-07 | **B2a R50 RP-Photo — bonifica completata** | **1698** | −6 any / 4 file → 0; `noExplicitAny` **34**; attende ACCETTO chiusura |
| 2026-08-07 | **B2a R50 RP-Photo ACCETTATO — mini-batch chiuso** | **1698** | ACCETTO PO; smoke/QG OK; prossimo = RP-Pricing |
| 2026-08-07 | **B2a R50 RP-Pricing — bonifica completata** | **1692** | −6 any / 2 file → 0; `noExplicitAny` **28**; attende ACCETTO chiusura |
| 2026-08-07 | **B2a R50 RP-Pricing ACCETTATO — mini-batch chiuso** | **1692** | ACCETTO PO; smoke/QG/QD OK; `noExplicitAny` **28**; prossimo = audit residuo R50 |
| 2026-08-07 | **B2a R50 — audit residuo → RP-Mech** | **1689** live | Audit residuo su residui any: prossimo mini-batch = **RP-Mech** (7 hit / 7 file) |
| 2026-08-07 | **B2a R50 RP-Mech — bonifica completata** | **1682** | −7 any / 7 file → 0; `noExplicitAny` **21**; attende ACCETTO chiusura |
| 2026-08-07 | **B2a R50 RP-Mech ACCETTATO — mini-batch chiuso** | **1682** | ACCETTO PO; smoke/QG OK; `noExplicitAny` **21**; prossimo = bonifica RP-Settings |
| 2026-08-07 | **B2a R50 RP-Settings — bonifica completata** | **1671** | −10 any / 6 file → 0; content.routes, GlobalSettingsPanel, settingsService, SocialPreviewConfig, CampaignsPanel, useSocialTemplates; `noExplicitAny` **11**; attende ACCETTO PO chiusura |
| 2026-08-07 | **B2a R50 RP-Settings ACCETTATO — mini-batch chiuso** | **1671** | ACCETTO PO; smoke/QG OK; QD type guards GlobalSettingsPanel; `noExplicitAny` **11**; errors=1157, warnings=514; prossimo = audit PO RP-EventsAI |
| 2026-08-07 | **B2a R50 — fusione piano RP-Residual** | **1671** | EventsAI+Undo+Core+CityRoad → **RP-Residual** (In audit PO al momento; bonifica **10**/8); Roadbook deferred; live allora **11**/9; **superseduta** da ACCETTO Residual / B2a chiuso |
| 2026-08-07 | **B2a R50 RP-Residual ACCETTATO — B2a chiuso** | **1660** | −10 any / 8 file → 0; QD Events/Suggestion; ultimo hit Roadbook tipizzato (`RoadbookSummary`); `noExplicitAny` **0**; errors=1157, warnings=503; prossimo = audit PO **B2b** |
| 2026-08-08 | **B2b — tranche BASSO completata + audit residuo** | **1432** | Live `biome check --reporter=json`: progetto **1660→1432** (Δ **−228**); B2b **769→547** (Δ **−222** diagnostiche); `noExplicitAny` resta **0**; severity E932/W500; file con diag. **425**. Tranche B2b BASSO (labels native, ARIA statici minori, Sidebar city rows, SmartFilterDrawer backdrop, ecc.) bonificata in codice. Residuo B2b **547**/181 file auditato; famiglie: modali/overlay/drawer ~297, admin 57, hero 34, suitcase 31, sidebar/nav 16, gallery 14, other 98. Prossimo sottoperimetro = **modali/overlay/drawer** (backdrop sibling; candidati shell-like ~227 hit / ~60 file) — dopo ACCETTO PO; B2c/B3 non aperti. |
| 2026-08-09 | **B2b A1 ACCETTATO PO** | **1430** (intermedio post-A1) | ACCETTO PO su `BaseFullscreenModalShell` (contratto A1). Overlay: presentation + dismiss button mouse-only. **2 hit residui** panel `stopPropagation` restano debito B2b fuori A1. |
| 2026-08-09 | **B2b Tranche A low-risk — bonifica eseguita (review PO)** | **1316** | Live: progetto **1432→1316** (Δ **−116**); B2b **547→431**; E816/W500; `noExplicitAny` **0**; file **424**. Micro-batch: A2/A3/A4/A5-auth/A6/A7-presentation/direct/busy/days/target. **Non** ACCETTATA PO. Esclusi: A5-attempt, A7-attempt, PreviewHero/MEDIO/ALTO. |
| 2026-08-13 | **Riconciliazione snapshot live (non ACCETTO PO)** | **1213** | Live: **1213** (E745/W468); file **414**; cat. **27**; B2b **389**; B2c **471**; L3 **318**; L0 `format`×7. Δ vs 1316 = **−103** (working tree / Quality Delta, **non** batch B2b nominato). `useHookAtTopLevel` a 0. Tranche low-risk A resta **in attesa ACCETTO PO**. |
| 2026-08-15 | **B2b low-risk A ACCETTATA PO** | **1213*** | ACCETTO PO formale su A2–A7* (esclusi attempt; **114** hit già in codice). Nessuna ripresa codice. Snapshot numerico ufficiale resta **1213** / B2b **389** (*). B2c non aperto. |
| 2026-08-15 | **B2b A5/A7-attempt ESEGUITI** | **1213*** | Bonifica target **4→0** in codice (`AdminPoiModal` / `ReviewModal`). Comportamenti PO congelati preservati. **Attende ACCETTO PO** file definitivi. Snapshot SoT invariato (*). B2c non aperto. |
| 2026-08-16 | **B2b C-P3a ESEGUITO (ACCETTO PO)** | **1213*** | Micro-batch C-P3a: **3** `noLabelWithoutControl` → **0** (Autore/Descrizione + Preferred Partners). Solo htmlFor/id. **Non** riconciliato nei contatori 1213/389 (*). B2c non aperto. |

---

# Registro delle decisioni (completo)

> Archivio integrale. La SoT viva mantiene solo le decisioni **ancora rilevanti** operativamente, con link a questo archivio.

Campi obbligatori per riga: Data · Categoria · Decisione · Motivazione · Livello finale · Sottocategorie.

### Registro storico completo

| Data | Categoria | Decisione | Motivazione | Livello finale | Sottocategorie |
|----|----|----|----|----|----|
| 2026-08-04 | **Batch L0 (17 categorie)** | **ACCETTO PO — batch chiuso** | Bonifica meccanica eseguita (−2801). Build OK; smoke UI accettato. `check`/`typecheck` ROSSI per 3 errori TS **preesistenti** (non introdotti da L0) — eccezione PO esplicita alla chiusura. Residuo `format`×1 su `src/index.css` bloccato da `parse` (L3). | L0 **COMPLETATO** | — |
| 2026-08-04 | `format` | Residuo accettato come bloccato | Non chiudibile a 0 finché `parse` su `index.css` non è risolto in L3 | L0 (Batch completato, 1 residuo) | — |
| 2026-08-04 | L0 meccaniche (16 cat.) | Chiusura formale (0 occorrenze) | Eliminate dal batch L0 accettato | L0 / Chiusa | — |
| 2026-08-04 | **L1 — 9 categorie** | Audit **strategico** fatto; chiusura classificazione **NON** chiusa | Schede complete; punti aperti espliciti (split/esclusioni/spot-check/hit-by-hit). Batch massivi L1 **non** autorizzati | L1 | vedi Gruppi A/B/C |
| 2026-08-04 | `noSwitchDeclarations`, `noDoubleEquals` | **Gruppo A** — candidati L0 senza ulteriore audit | Schede chiuse senza punti aperti (6+2=8 diagnostiche) | L1 → candidato L0 | — |
| 2026-08-04 | `noUnusedImports`, `useButtonType`, `noGlobalIsNan`, `noSvgWithoutTitle`, `noPrototypeBuiltins` | **Gruppo B** — split/chiusura tecnica obbligatoria prima di L0 | Liste/esclusioni/spot-check/verifica target ancora aperte (1207 diagnostiche) | L1 | vedi Parte 2 L1 Gruppo B |
| 2026-08-04 | `noAutofocus`, `noDescendingSpecificity` | **Gruppo C** — fuori batch massivi L0 | UX ALTO / cascade CSS → L4 o D (18 diagnostiche) | L1 → L4/D | — |
| 2026-08-04 | `lint/complexity/noBannedTypes` | Nuova categoria assegnata a L4 | Emersa post-L0 (1 hit, `{}` type); casi singoli | L4 | — |
| 2026-08-04 | **Avanzamento per livello** | Iniziali L0–L4 **congelati** sulla fotografia iniziale | L0=2802, L1=1233, L2=1764, L3=350, L4=8 (immutabili). Baseline progetto resta 6232. Cambiano solo Risolte/Residue/%/Stato | — | — |
| 2026-08-04 | **Gruppo B (5 regole)** | **Catalogo hit-per-hit CHIUSA** — 1207/1207 batch; 0 manuali; 0 D | Analisi completa di tutte le diagnostiche residue | L0 Batch pronto | B1c-svg-dec, B1c-svg-inf |
| 2026-08-04 | L1 A+B (7 cat.) | **Riclassificazione formale → L0** | 1215 diagnostiche | L0 | — |
| 2026-08-04 | `noAutofocus`, `noDescendingSpecificity` | **Riclassificazione formale → L4** | Gruppo C fuori massa (18) | L4 | — |
| 2026-08-04 | **Classificazione operativa L1** | **CHIUSA** | L1 residue = 0; batch massivi sulle 1215 diag. autorizzati come L0 Batch pronto (non eseguiti) | — | — |
| 2026-08-04 | **B1a + B1b + B1c (7 cat. L0)** | **ACCETTO PO — batch chiuso** | Esecuzione 1215 diag. (useButtonType, noUnusedImports, noGlobalIsNan, noSvgWithoutTitle, noPrototypeBuiltins, noSwitchDeclarations, noDoubleEquals). Quality Delta applicati; review architetturale + smoke OK; type safety verificata; nessun nuovo debito. `check`/`typecheck` restano ROSSI per **3 errori TS preesistenti** (eccezione già registrata). Residue progetto **2134**. | L0 **Chiusa** (7 cat.) | — |
| 2026-08-04 | **Prossimo batch** | **B2a** autorizzato come focus | Audit specialistico `noExplicitAny` (446 / 173 file) — nessuna implementazione avviata in questa chiusura | L2 | — |
| 2026-08-04 | **Split documentale** | SoT viva / History | `AI_BIOME_AUDIT.md` = operativa; `AI_BIOME_HISTORY.md` = archivio concluso; zero perdita info | — | — |
| 2026-08-04 | `noExplicitAny` | **Audit B2a classificazione CHIUSA** | 446 hit: A=123, B=180, C=143, D=0. Inventario in `B2a_noExplicitAny_AUDIT.md` | L2 Classificata | — |
| 2026-08-05 | `noExplicitAny` | **B2a Batch A ACCETTATO** | −123. Residue SoT `noExplicitAny` **323**; progetto **2011**. Piano: macro-batch A/B/C (B→B-1…B-4) | L2 In corso | A chiuso |
| 2026-08-05 | `noGlobalIsNan` | **7 collaterali ACCETTATE (non riproposte)** | Bonifiche `isNaN`→`Number.isNaN` emerse in Batch A, fuori perimetro A, accettate col batch. Non rientrano in B/C. File: `ensureNumber.ts`, `NumberInput.tsx`, `LoadingTipsManager.tsx`, `ServiceEvents.tsx`, `ServiceGuides.tsx`, `usePeopleData.ts`, `CitiesListTab.tsx` | L0 Chiusa | — |
| 2026-08-05 | `noExplicitAny` | **B2a Batch B — in review finale PO** | Codice B + Quality Delta applicati; SoT numerica B non aggiornata fino ad ACCETTO (stato superseduto dall’ACCETTO del 2026-08-06) | L2 In corso | B in review (chiuso il 2026-08-06) |
| 2026-08-06 | `noExplicitAny` | **B2a Batch B ACCETTATO — batch chiuso** | ACCETTO PO; review architetturale completata; nessuna regressione rilevata; nessun nuovo debito tecnico introdotto; Quality Delta applicati; macro-batch B (B-1…B-4) concluso. Prossimo focus: audit specialistico Batch C (nessuna bonifica codice fino a piano mini-batch). | L2 In corso | A+B chiusi |
| 2026-08-06 | **Documentazione Biome** | **Split History / Legacy** | `AI_BIOME_HISTORY.md` = archivio principale; `AI_BIOME_HISTORY_LEGACY.md` = dettaglio congelato; zero perdita info | — | — |
| 2026-08-06 | L0 drift post-B | **Riconciliazione meccanica −75** | Autofix Biome: organizeImports + useImportType + format (49). Escluso: `src/index.css` format×1 (`parse` L3). Residue **1892**. | L0 Completato | — |
| 2026-08-06 | **Audit architetturali** | **Regola permanente SoT §21** | UI/dominio prima del codice; sezioni A+B obbligatorie. Documento avvio: `B2a_C_START_PO_AUDIT.md` (partenza C2). | — | Batch C |
| 2026-08-06 | **Audit architetturali** | **SoT §21.1 + §22** | Script QA eseguibili; non spezzare i gruppi C senza motivo architetturale. C2 = unico batch. | — | Batch C |
| 2026-08-06 | `noExplicitAny` | **B2a Batch C2 ACCETTATO — batch chiuso** | ACCETTO PO; parsers City (−7); Quality Delta + smoke OK; nessun nuovo debito. SoT: `noExplicitAny` **202**; progetto **1885**. Prossimo: audit PO C3 (unico batch proposto). | L2 In corso | A+B+C2 chiusi |
| 2026-08-06 | `noExplicitAny` | **B2a Batch C3 — bonifica parziale (doc sync)** | Perimetro unico batch accettato; codice avanzato (−35); residui **8** nei context trasversali (Modal/Config/CityEditor). Snapshot: `noExplicitAny` **167**; progetto **1851**. C3 **non chiuso** — non avviare C4. | L2 In corso | C3 parziale |
| 2026-08-06 | `noExplicitAny` | **B2a Batch C3 ACCETTATO — batch chiuso** | ACCETTO PO / STEP 5 gate: context tipizzati (−8 any); `ModalPropsBag`; consumer Modal allineati; Quality Delta OK; typecheck = 3 save-hook baseline; build OK. SoT: `noExplicitAny` **159**; progetto **1840**. Prossimo: audit PO **C4**. | L2 In corso | A+B+C2+C3 chiusi |
| 2026-08-07 | `noExplicitAny` | **B2a Batch C4 ACCETTATO — batch chiuso** | ACCETTO PO formale; Services (−15 any / 7 file → 0); Quality Delta OK. SoT: `noExplicitAny` **144**; progetto **1825**. Prossimo: audit PO **C5**. | L2 In corso | A+B+C2+C3+C4 chiusi |
| 2026-08-07 | `noExplicitAny` | **B2a Batch C5 — audit PO avvio** | Perimetro live **8**/2; unico batch proposto; nessun fix. | L2 In audit | C5 audit |
| 2026-08-07 | `noExplicitAny` | **B2a Batch C5 ACCETTATO — batch chiuso** | Community (−8 → 0); leftover B co-locati. | L2 In corso | A+B+C2–C5 |
| 2026-08-07 | `noExplicitAny` | **B2a Batch C6 ACCETTATO — batch chiuso** | Utils (−15 → 0); SoT **121** / **1799**; prossimo C1. | L2 In corso | A+B+C2–C6 |
| 2026-08-07 | `noExplicitAny` | **B2a Batch C1 — audit PO avvio** | Perimetro **71**/19 + facade; piano boundary-first. | L2 In audit | C1 audit |
| 2026-08-07 | `noExplicitAny` | **B2a Batch C1 ACCETTATO — Batch C completo** | ACCETTO PO; C1–C6 chiusi; SoT **50** / **1714**. | L2 In corso | A+B+C chiusi |
| 2026-08-07 | `noExplicitAny` | **B2a R50 — audit residui** | Inventario live **50**/28; mini-batch R1–R10. | L2 In audit | R50 piano |
| 2026-08-07 | `noExplicitAny` | **B2a R50 R1 ACCETTATO — mini-batch chiuso** | `useServiceRegeneration` 10→0; QD: Object.assign + cast SaveCity* lasciati. SoT **40** / **1704**. Prossimo: ACCETTO R4. | L2 In corso | A+B+C+R1 |
| 2026-08-07 | `noExplicitAny` | **B2a R50 — revisione piano RP-* ACCETTATA** | Piano operativo 8 batch (RP-Photo…RP-CityRoad); Settings=R5+R3; Mech=R7+3; CityRoad=cache+poi+Roadbook. Inventario/classificazioni invariati. | L2 In corso | R50 RP-* |
| 2026-08-07 | `noExplicitAny` | **B2a R50 RP-Photo — bonifica completata** | Photo pipeline 6→0; `DbPhotoSubmission` / filter unions / blurPoints. SoT **34** / **1698**. Attende ACCETTO chiusura. | L2 In corso | R1+RP-Photo |
| 2026-08-07 | `noExplicitAny` | **B2a R50 RP-Photo ACCETTATO — mini-batch chiuso** | ACCETTO PO; review/smoke/QG OK. SoT **34** / **1698**. Prossimo: RP-Pricing. | L2 In corso | R1+RP-Photo chiusi |
| 2026-08-07 | `noExplicitAny` | **B2a R50 RP-Pricing — bonifica completata** | Pricing 6→0; `PricingAiLimits` / `PricingManagerVersion`. SoT **28** / **1692**. Attende ACCETTO chiusura. | L2 In corso | RP-Pricing bonifica |
| 2026-08-07 | `noExplicitAny` | **B2a R50 RP-Pricing ACCETTATO — mini-batch chiuso** | ACCETTO PO; review/smoke/QG/QD OK. SoT **28** / **1692**. Prossimo: audit residuo R50. | L2 In corso | R1+RP-Photo+RP-Pricing chiusi |
| 2026-08-07 | `noExplicitAny` | **B2a R50 — audit residuo → RP-Mech** | Audit residuo: prossimo = **RP-Mech** (7/7; rischio basso). Nessun fix in audit. | L2 In audit | R50 residuo |
| 2026-08-07 | `noExplicitAny` | **B2a R50 RP-Mech — bonifica completata** | Mech 7→0 (SmartFilterDrawer, Sidebar, useImportData, LoadingTipsManager, CityServicesTab, interactionService, useUserDashboardData). Live **21** / **1682**. Attende ACCETTO chiusura. | L2 In corso | RP-Mech bonifica |
| 2026-08-07 | `noExplicitAny` | **B2a R50 RP-Mech ACCETTATO — mini-batch chiuso** | ACCETTO PO; review/smoke/QG OK. SoT live **21** / **1682** (errors=1157, warnings=525). Prossimo: bonifica RP-Settings. | L2 In corso | R1+RP-Photo+RP-Pricing+RP-Mech chiusi |
| 2026-08-07 | `noExplicitAny` | **B2a R50 RP-Settings — bonifica completata** | Settings 10→0 (content.routes, GlobalSettingsPanel, settingsService, SocialPreviewConfig, CampaignsPanel, useSocialTemplates). Live **11** / **1671**. Attende ACCETTO PO chiusura. | L2 In corso | RP-Settings bonifica |
| 2026-08-07 | `noExplicitAny` | **B2a R50 RP-Settings ACCETTATO — mini-batch chiuso** | ACCETTO PO; review/smoke/QG OK; QD type guards GlobalSettingsPanel. SoT live **11** / **1671** (errors=1157, warnings=514). Prossimo: audit PO perimetro RP-EventsAI. | L2 In corso | R1+RP-Photo+RP-Pricing+RP-Mech+RP-Settings chiusi |
| 2026-08-07 | `noExplicitAny` | **B2a R50 — fusione piano RP-Residual** | Direzione PO: aperti EventsAI+Undo+Core+CityRoad fusi in **RP-Residual**. Bonifica scope **10**/8; live resta **11**/9. `RoadbookDocument.tsx` (L259) **escluso** — bug funzionale preesistente (summaryData vs citiesInfo → NaN/zero budget PDF); deferred audit Roadbook/PDF post tipaggio residuale. Stato al momento della fusione: **In audit PO**. Contatori allora **11**/1671. **Superseduta** dalla riga successiva (ACCETTO RP-Residual → B2a chiuso / `noExplicitAny` 0). | L2 In audit (storico) | RP-Residual |
| 2026-08-07 | `noExplicitAny` | **B2a R50 RP-Residual ACCETTATO — B2a COMPLETATO** | ACCETTO PO + bonifica 10→0 / 8 file; QD Events/Suggestion; ultimo hit Roadbook tipizzato (`RoadbookSummary`, SoT `computeRoadbookSummary`). Live **0** / **1660** (E1157/W503). Fix funzionale summary Roadbook **fuori** roadmap Biome (non apre batch nuovi). Prossimo L2: audit PO **B2b**. | L2 In corso | B2a chiuso |
| 2026-08-08 | a11y B2b | **B2b tranche BASSO + audit residuo** | Progetto **1660→1432** (Δ **−228**); B2b **769→547** (Δ **−222**); `noExplicitAny` **0**. Residuo B2b auditato; prossimo sottoperimetro **modali/overlay/drawer**. | L2 In corso | B2b IN CORSO |
| 2026-08-09 | a11y B2b | **A1 ACCETTATO PO** | Contratto shell overlay accettato; panel stopPropagation resta fuori A1. | L2 In corso | B2b A1 chiuso |
| 2026-08-09 | a11y B2b | **Tranche A low-risk eseguita — review PO** | A2–A7* (no attempt) per contratti congelati; live **1316** / B2b **431**; non dichiarata ACCETTATA. | L2 In corso | B2b IN CORSO |
| 2026-08-13 | a11y B2b / SoT | **Riconciliazione snapshot live — non ACCETTO PO** | Progetto **1213**; B2b **389**; E745/W468; file **414**. Δ **−103** vs 1316 = drift working tree, non batch nominato. Low-risk A resta in review PO. | L2 In corso | B2b IN CORSO |
| 2026-08-15 | a11y B2b | **B2b low-risk A ACCETTATA PO** | ACCETTO PO formale A2–A7* (esclusi attempt). Nessuna ripresa codice. Contatori SoT restano **1213** / **389**. | L2 In corso | B2b — low-risk A chiusa |
| 2026-08-15 | a11y B2b | **A5/A7-attempt ESEGUITI — attende ACCETTO PO** | Codice **4→0** (`AdminPoiModal` / `ReviewModal`); comportamenti congelati preservati; file definitivi **non** ancora ACCETTATI PO. Numeri SoT non riconciliati. | L2 In corso | B2b attempt |
| 2026-08-16 | a11y B2b | **C-P3a ESEGUITO + ACCETTO PO (non in snapshot)** | 3 label nativi htmlFor/id; contatori ufficiali restano **1213** / B2b **389**. | L2 In corso | B2b C-P3a |

> Le assegnazioni iniziali L0–L4 del 2026-08-04 (pre-bonifica) costituiscono la **classificazione di partenza** del piano.  
> Le **decisioni** successive si aggiungono come nuove righe; non si cancellano le righe precedenti.

---

# Contabilità storica A–D + indice AI_QUALITY

> Snapshot/conti legacy al momento dello split. I numeri operativi correnti vivono solo in AI_BIOME_AUDIT.md.

### Contabilità storica per sicurezza correzione (A–D)

> Mappa legacy usata nei documenti `AI_QUALITY/biome/*`. **Non** è più la guida primaria della bonifica (sostituita da L0–L4). Conservata per riconciliazione.

| Livello storico | Diagnostiche (snapshot storico) | Note |
|----|---:|----|
| **A** | **1** | ≈ L0 residuo (`format`) |
| **A/B + B + C ripartiti** | **3357** | L1+L2+L3+L4 correnti |
| **D** | **0** | Policy / FP dichiarati |
| **Totale** | **3358** | |

---

## Indice documenti di dettaglio (AI_QUALITY)

| Doc | Livello storico | Occ. baseline doc | Note |
|----|----|---:|----|
| [`A_format.md`](./AI_QUALITY/biome/A_format.md) | A → L0 | 964 | Corrente: format **1** (residuo index.css) |
| [`A_organizeImports.md`](./AI_QUALITY/biome/A_organizeImports.md) | A → L0 | 786 | **Chiusa** (0) |
| [`A_useImportType.md`](./AI_QUALITY/biome/A_useImportType.md) | A → L0 | 862 | **Chiusa** (0) |
| [`A_mechanical_style_small.md`](./AI_QUALITY/biome/A_mechanical_style_small.md) | A → L0 | 211 | **Chiuse** (0) |
| [`AB_noUnusedImports.md`](./AI_QUALITY/biome/AB_noUnusedImports.md) | A/B → L1 | 328 | Corrente: **326** — audit L1 fatto |
| [`AB_useButtonType.md`](./AI_QUALITY/biome/AB_useButtonType.md) | A/B → L1 | 852 | Corrente: **851** — audit L1 fatto |
| [`AB_suspicious_and_switch_small.md`](./AI_QUALITY/biome/AB_suspicious_and_switch_small.md) | A/B → L1 | 31 | Audit L1 fatto |
| [`B_noUnusedVariables.md`](./AI_QUALITY/biome/B_noUnusedVariables.md) | B → L2 | 204 | Corrente: **199** |
| [`B_noUnusedFunctionParameters.md`](./AI_QUALITY/biome/B_noUnusedFunctionParameters.md) | B → L2 | 121 | Corrente: **119** |
| [`B_useOptionalChain.md`](./AI_QUALITY/biome/B_useOptionalChain.md) | B → L2 | 84 | Corrente: **84** |
| [`B_a11y_click_and_static_interactions.md`](./AI_QUALITY/biome/B_a11y_click_and_static_interactions.md) | B → L2 | 504 | Corrente: **502** |
| [`B_a11y_labels_and_forms.md`](./AI_QUALITY/biome/B_a11y_labels_and_forms.md) | B → L1/L2 | 257 | labels L2; autofocus L1 |
| [`B_a11y_aria_semantic_media.md`](./AI_QUALITY/biome/B_a11y_aria_semantic_media.md) | B → L1/L2/L4 | 44 | ripartito |
| [`B_suspicious_iterable_shadow_assign.md`](./AI_QUALITY/biome/B_suspicious_iterable_shadow_assign.md) | B → L2/L4 | 62 | ripartito |
| [`B_noArrayIndexKey.md`](./AI_QUALITY/biome/B_noArrayIndexKey.md) | B → L2 | 82 | Corrente: **81** |
| [`C_noExplicitAny.md`](./AI_QUALITY/biome/C_noExplicitAny.md) | C → L2 | 473 | Corrente: **452** |
| [`C_useExhaustiveDependencies.md`](./AI_QUALITY/biome/C_useExhaustiveDependencies.md) | C → L3 | 204 | Corrente: **202** |
| [`C_noNonNullAssertion.md`](./AI_QUALITY/biome/C_noNonNullAssertion.md) | C → L3 | 128 | Corrente: **114** |
| [`C_hooks_security_parse_tsignore.md`](./AI_QUALITY/biome/C_hooks_security_parse_tsignore.md) | C → L3 | 35 | Corrente: **34** |
| [`D_policy_and_false_positives.md`](./AI_QUALITY/biome/D_policy_and_false_positives.md) | D | 0 | Registro FP / non-correggibili |

Indice: [`AI_QUALITY/README.md`](./AI_QUALITY/README.md)

---

# Categorie chiuse (estratto snapshot)

> Righe a 0 occorrenze dallo snapshot post ACCETTO B1a/B1b/B1c. Non compaiono più nella tabella categorie vive della SoT.

| Categoria | Occ. | Err | Warn | Info | File | Livello | Stato op. | Δ vs baseline |
|----|---:|---:|---:|---:|---:|----|----|---:|
| ~~`lint/a11y/useButtonType`~~ | 0 | — | — | — | — | L0 | **Chiusa** | **−852** |
| ~~`lint/correctness/noUnusedImports`~~ | 0 | — | — | — | — | L0 | **Chiusa** | **−328** |
| ~~`lint/suspicious/noGlobalIsNan`~~ | 0 | — | — | — | — | L0 | **Chiusa** | **−17** |
| ~~`lint/a11y/noSvgWithoutTitle`~~ | 0 | — | — | — | — | L0 | **Chiusa** | **−9** |
| ~~`lint/correctness/noSwitchDeclarations`~~ | 0 | — | — | — | — | L0 | **Chiusa** | **−6** |
| ~~`lint/suspicious/noPrototypeBuiltins`~~ | 0 | — | — | — | — | L0 | **Chiusa** | **−5** |
| ~~`lint/suspicious/noDoubleEquals`~~ | 0 | — | — | — | — | L0 | **Chiusa** | **−2** |
| ~~`lint/a11y/useAltText`~~ | 0 | — | — | — | — | — | Chiusa | **−3 (eliminata)** |
| ~~L0 meccaniche (16 categorie)~~ | 0 | — | — | — | — | L0 | **Chiusa** | eliminate dal batch L0 |

---

# Dettaglio batch conclusi (L0 + L1)

> **Sintesi operativa.** Il testo integrale (stato L0, cataloghi hit-per-hit Gruppo B, piano A/B/C, riclassificazione formale, appendix elenchi file 205/230) è in [`AI_BIOME_HISTORY_LEGACY.md`](./AI_BIOME_HISTORY_LEGACY.md) § Dettaglio batch conclusi.

| Livello / batch | Stato | Residue al momento della chiusura | Dove il dettaglio |
|----|----|----|----|
| **L0** (17 cat. meccaniche) | **COMPLETATO** (ACCETTO PO 2026-08-04) | 1 × `format` (bloccato da `parse` L3) | [Legacy § L0](./AI_BIOME_HISTORY_LEGACY.md#livello-0--batch-certificato--completato) |
| **L1** classificazione | **CHIUSA** | 0 in L1 (A+B → L0 eseguiti; C → L4) | [Legacy § L1](./AI_BIOME_HISTORY_LEGACY.md#livello-1--classificazione-operativa-chiusa) |
| **B1a / B1b / B1c** | **COMPLETATO** | −1215 diag. ex-L1 | Legacy + Registro / Diario sopra |
| Appendici file | Archiviate | useButtonType×205, noUnusedImports×230 | [Legacy appendici](./AI_BIOME_HISTORY_LEGACY.md#appendix--elenco-file-usebuttontype-205) |

---

# Testo pre-split L2 / L3 / L4 (congelato)

> Fotografia testuale delle sezioni L2/L3/L4 **prima** dello split SoT/History.  
> **Conteggi operativi correnti** solo in [`AI_BIOME_AUDIT.md`](./AI_BIOME_AUDIT.md).  
> Testo integrale → [`AI_BIOME_HISTORY_LEGACY.md`](./AI_BIOME_HISTORY_LEGACY.md) § Testo pre-split L2 / L3 / L4.


# Snapshot intermedi severity / confronto

> Colonne e confronti presenti nella SoT pre-split; la SoT viva mantiene solo Baseline vs Attuale.  
> La colonna «Post ACCETTO B1a/B1b/B1c» è uno **snapshot storico** (non lo stato corrente del progetto).

| Severity | Baseline (2026-08-03) | Pre-L0 (6157) | Pre ex-L1 (3358) | Post ACCETTO B1a/B1b/B1c (2134) | Δ vs baseline |
|----|---:|---:|---:|---:|---:|
| **error** | 3795 | 3776 | 2036 | **1165** | −2630 |
| **warning** | 2259 | 2205 | 1322 | **969** | −1290 |
| **info** | 178 | 176 | 0 | **0** | −178 |
| **Totale** | 6232 | 6157 | 3358 | **2134** | **−4098** |

| Metrica | Baseline | Pre-L0 | Pre ex-L1 | Post ACCETTO B1a/B1b/B1c | Δ vs baseline |
|----|---:|---:|---:|---:|---:|
| Totale diagnostiche | 6232 | 6157 | 3358 | **2134** | **−4098** |
| Categorie vive | 51 | 50 | 35 | **28** | −23 chiuse +1 (`noBannedTypes`) |
| File con diagnostiche | 1043 | 1040 | 581 | **509** | −534 |

**Miglioramento principale (nota storica):** batch L0 meccanico (−2801) + batch L0 ex-L1 A+B (**−1215**) + Quality Delta collaterali (−9 su L2).

Snapshot method notes (storico):
- Baseline: 2026-08-03 · 6232 · errors=3795, warnings=2259, infos=178
- Snapshot pre-L0: 2026-08-04 · 6157 · errors=3776, warnings=2205, infos=176
- Snapshot post-L0 + classificazione L1: 2026-08-04 · 3358 · errors=2036, warnings=1322, infos=0
- Snapshot post ACCETTO B1a/B1b/B1c: 2026-08-04 · **2134** · errors=1165, warnings=969, infos=0

---

# Esito validazione batch L0 (chiuso)

### Esito validazione batch L0 (chiuso)

| Passo | Esito | Nota |
|----|----|----|
| `npm run check` | **FAIL** | Si ferma su typecheck |
| `npm run typecheck` | **FAIL** | 3 errori TS preesistenti (save hooks / controller) — prova: non introdotti da L0 |
| `npm run build` | **OK** | — |
| Smoke PO | **OK / accettato** | Checklist UI |
| Accettazione PO | **SÌ** | Eccezione esplicita su check/typecheck rossi preesistenti |

---

## Documenti correlati

| Documento | Ruolo |
|-----------|--------|
| [AI_BIOME_AUDIT.md](./AI_BIOME_AUDIT.md) | **SoT operativa** |
| [AI_BIOME_HISTORY.md](./AI_BIOME_HISTORY.md) (questo file) | Archivio storico **principale** |
| [AI_BIOME_HISTORY_LEGACY.md](./AI_BIOME_HISTORY_LEGACY.md) | Dettaglio congelato (L0/L1, appendici, pre-split L2–L4) |
| [AI_BIOME_AUDIT_35_FILES_HISTORY.md](./AI_BIOME_AUDIT_35_FILES_HISTORY.md) | Storico audit parziale 35 file |
| [AI_QUALITY/README.md](./AI_QUALITY/README.md) | Indice dettaglio per categoria |
| [AI_DEV_WORKFLOW/WORKFLOWS/WF_QUAL_01_QUALITY_TOOLCHAIN_SOT.md](./AI_DEV_WORKFLOW/WORKFLOWS/WF_QUAL_01_QUALITY_TOOLCHAIN_SOT.md) | SoT toolchain qualità |

---

# Gerarchia documentale

Ruoli stabili per consultazione a mesi di distanza. **Zero perdita info:** ogni dettaglio vive in uno (e un solo) posto canonico.

| Documento | Ruolo | Cosa contiene | Cosa non contiene |
|-----------|--------|---------------|-------------------|
| [`AI_BIOME_AUDIT.md`](./AI_BIOME_AUDIT.md) | **SoT operativa viva** | Dashboard, residue correnti, roadmap aperta, workflow, regole, decisioni ancora rilevanti, avanzamento per livello | Cataloghi hit-by-hit chiusi, elenchi file millimetrici, testo congelato pre-split |
| [`AI_BIOME_HISTORY.md`](./AI_BIOME_HISTORY.md) (questo file) | **Archivio storico principale** | Diario, Registro decisioni, contabilità storica, categorie chiuse, snapshot intermedi, esiti validazione, indici e link | Appendici estese, elenchi completi file, cataloghi hit-per-hit, testo L0/L1/L2–L4 congelato di dettaglio |
| [`AI_BIOME_HISTORY_LEGACY.md`](./AI_BIOME_HISTORY_LEGACY.md) | **Legacy / dettaglio congelato** | Dettaglio integrale batch L0+L1, appendix file, testo pre-split L2/L3/L4 | Stato operativo corrente (mai aggiornare i conti “vivi” qui) |
| [`AI_BIOME_AUDIT_35_FILES_HISTORY.md`](./AI_BIOME_AUDIT_35_FILES_HISTORY.md) | Storico **parziale** 35 file | Campagna storica limitata | Non sostituisce la SoT full-project |
| [`AI_QUALITY/*`](./AI_QUALITY/README.md) | Schede / audit per **categoria** | Dettaglio regola, B2a audit, Batch C tematici, inventario 446 | Non è SoT numerica di progetto |
| [`AI_QUALITY/biome/B2a_noExplicitAny_AUDIT.md`](./AI_QUALITY/biome/B2a_noExplicitAny_AUDIT.md) | Audit operativo B2a | Classificazione A/B/C/D, roadmap macro-batch, riepiloghi | Inventario hit-per-hit 446 (appendice dedicata) |
| [`AI_QUALITY/biome/B2a_noExplicitAny_INVENTORY_446.md`](./AI_QUALITY/biome/B2a_noExplicitAny_INVENTORY_446.md) | Appendice inventario B2a | 446 occorrenze classificate | Stato esecuzione corrente |
| [`AI_QUALITY/biome/B2a_BATCH_C_INDEX.md`](./AI_QUALITY/biome/B2a_BATCH_C_INDEX.md) (+ C1…C6) | Archivio storico Batch C (concluso) | Indice/cronologia C1–C6 ACCETTATI | Non è audit operativo in corso |
| [`AI_QUALITY/biome/B2a_R50_RESIDUAL_ANY_AUDIT.md`](./AI_QUALITY/biome/B2a_R50_RESIDUAL_ANY_AUDIT.md) | Audit storico post-C / post-chiusura B2a | Inventario iniziale 50 + piano **RP-*** eseguito | **R1+RP-*+RP-Residual ACCETTATI**; residuo live **0**; **B2a COMPLETATO**; L2 corrente = **B2b** |

### Regola di navigazione

1. Domanda sul **debito attuale** → SoT (`AI_BIOME_AUDIT.md`).  
2. Domanda su **cosa è stato deciso / quando** → History (questo file).  
3. Domanda su **elenco file / hit-by-hit / testo congelato** → Legacy o `AI_QUALITY/*`.  
4. Non duplicare numeri operativi fuori dalla SoT.

