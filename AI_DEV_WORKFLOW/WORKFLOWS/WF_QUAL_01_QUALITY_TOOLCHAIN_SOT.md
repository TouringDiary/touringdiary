# WF-QUAL-01 — Quality Toolchain Source of Truth

> **Workflow esecutivo** — Source of Truth dell’intera toolchain di qualità di TouringDiary.
>
> Derivato dall’audit architetturale toolchain (2026-08-02) e dal design SoT approvato dal PO.
>
> **Struttura fissa:** questo Workflow ha **esattamente 4 STEP**.  
> Vietato introdurre ulteriori STEP o mischiare ambiti tra STEP.  
> Ogni STEP lascia il repo usabile e deve essere verificabile prima del successivo.
>
> **Non** è un Workflow di dominio prodotto (Viaggio / MySpace / Photo).  
> **Non** sostituisce SoT di dominio (`AI_CONTEXT/*`).  
> **Non** sostituisce DOC-38 bootstrap.

---

## Principio SoT (invariante)

| Domanda | Autorità |
|---------|----------|
| Il progetto è qualitativamente accettabile? | **`npm run check`** (CLI del repository) |
| Tipi TypeScript dell’app (`src`, project di default) | **`npm run typecheck`** |
| Tipi di project satelliti (scripts, packing, futuri) | **`npm run typecheck:<scope>`** — **non** equivalenti a `typecheck` né a `check` finché non entrano nel contratto |
| Lint / format | **Biome** (`biome.json`) — unica SoT; invocata da `npm run lint` |
| Layering z-index TD? | **`npm run lint:layers`** |
| Edge Deno? | Toolchain Deno su `supabase/functions` (fuori da `check` fino a decisione esplicita del PO registrata qui) |

**Doppia SoT (stesso contratto, due forme):**

| Forma | Artefatto | Ruolo |
|-------|-----------|--------|
| **Normativa** | Questo file WF | Definisce semantica, composizione, evoluzione, responsabilità |
| **Eseguibile** | Script in `package.json` (+ config tool referenziate) | Implementa il contratto |

Se normativa ed eseguibile divergono: **prevale questo Workflow**; gli artefatti eseguibili del contratto (`package.json`, `biome.json`, tsconfig o altri coinvolti) devono essere riallineati.  
Non è ammessa una terza autorità (IDE, Studio, agente, CI custom).

**Allineamento obbligatorio (cambio toolchain):** qualsiasi modifica ai comandi documentati del contratto (`typecheck`, `typecheck:*`, `lint`, `lint:layers`, `check`, …), alla **composizione** del gate, o al comportamento di `package.json` che impatti quel contratto, deve aggiornare **contestualmente** questo Workflow.  
- `package.json` aggiornato senza questo file → **regressione documentale**.  
- Questo Workflow aggiornato senza successivo allineamento di `package.json` → **regressione implementativa**.

**Regola:** VS Code, Firebase Studio, Gemini e altri tool **non** sono Source of Truth.  
Devono **consumare** le stesse configurazioni del repository. In caso di dubbio: eseguire `npm run check`.

---

## Metadati

| Campo | Valore |
|-------|--------|
| **ID** | WF-QUAL-01 |
| **Nome** | Quality Toolchain Source of Truth |
| **Stato Workflow** | Attivo |
| **Masterplan** | — (design SoT qualità 2026-08-02) |
| **SSOT correlate** | `package.json` (script gate) · `biome.json` · tsconfig* |
| **Owner** | PO (decisioni) · AI/dev (esecuzione contratto) |
| **Creato** | 2026-08-02 |
| **Ultimo aggiornamento** | 2026-08-02 |
| **Aggiornato da** | AI — STEP 4 Completato (hardening TS) → In verifica PO |
| **Workflow precedenti** | Nessuno obbligatorio |
| **Workflow successivo** | — |

---

## Obiettivo generale

Quando uno sviluppatore, Gemini, Firebase Studio o qualsiasi altro strumento esegue:

```bash
npm run check
```

ottiene l’**unico verdetto ufficiale** sullo stato qualitativo del progetto applicativo (`typecheck` + Biome `lint` + `lint:layers`; ulteriori componenti solo per decisione PO / STEP futuri).

---

## Ambito

| Incluso | STEP |
|---------|------|
| Nomenclatura comandi CLI (`typecheck`, `check`, alias) | 1 |
| Gate composito `check` senza cambiare i tool sottostanti | 1 |
| Introduzione linter/formatter unico (Biome, salvo problemi) | 2 |
| Allineamento editor / Studio / istruzioni agente alla config repo | 3 |
| Hardening TypeScript progressivo (`strict` e correlate) | 4 |

---

## Esclusioni (invarianti)

- Refactor di dominio / feature prodotto
- Ottimizzazioni performance runtime (WF-PERF-*)
- Introdurre una seconda SoT lint parallela (vietato)
- Attivare `strict` in blocco senza STEP 4
- Workaround per far risultare verde un gate senza correggere cause
- Far passare per “qualità OK” un tool editor/CI che **non** esegue `npm run check`
- Assorbire silenziosamente in `check` test, build, Deno, project satelliti o altri gate senza aggiornare questo contratto

---

## Responsabilità

| Ruolo | Decide / fa | Non fa |
|-------|-------------|--------|
| **PO** | Approva composizione/evoluzione di `check`; eccezioni e debito accettato; chiusura STEP; OK ad avviare STEP successivi | Implementare config parallele “per comodità” |
| **AI / sviluppatore** | Mantiene allineati questo file e `package.json`; esegue `check` come verdetto; aggiorna evidenze STEP | Inventare SoT locale; rimuovere alias o gate senza decisione registrata qui |
| **CI (quando presente)** | Invoca **`npm run check`** per il verdetto qualità di questo WF | Ridefinire regole lint/types diverse dal repo |
| **Editor / Studio / Gemini** | Consumano config del repository | Possedere regole o “verdetti” alternativi |

---

## Prerequisiti

| Prerequisito | Stato | Nota |
|--------------|-------|------|
| Audit toolchain completato (solo analisi) | ☑ | 2026-08-02 |
| Design SoT + 4 STEP approvati dal PO | ☑ | Richiesta formalizzazione WF |
| `01_EXECUTION_ROADMAP` / `03_PROJECT_STATUS` aggiornabili | ☑ | |

---

## Gate tracciati

| Gate | Definizione | Stato | Evidenza |
|------|-------------|-------|----------|
| G-QUAL-01-S1 | Script `typecheck*` / `check` / alias `lint*`; nessun cambio tool sottostante; STEP 2 non avviato | ☑ Completato (ACCETTO PO) | Implementazione + ACCETTO PO 2026-08-02 |
| G-QUAL-01-S2 | Linter unico Biome; `lint` = `biome check`; `check` include lint; ESLint rimosso | ☑ Completato (ACCETTO PO / avvio STEP 3) | `biome.json` + `package.json` + verifiche CLI 2026-08-02 |
| G-QUAL-01-S3 | Editor / Studio / agente consumano solo config repo | ☑ Completato (ACCETTO PO / avvio STEP 4) | `.vscode/*` · `.idx/dev.nix` · `.cursor/rules/wf-qual-01-quality-sot.mdc` · `GEMINI.md` |
| G-QUAL-01-S4 | Hardening TS progressivo senza big-bang | ☐ In verifica PO | `tsconfig.app.json` (`strict` + correlate) · `npm run typecheck` verde 2026-08-02 |
| G-QUAL-01-WF | `npm run check` = unico verdetto ufficiale qualità app | ☐ Aperto | Dipende da chiusura STEP 1–4 |

---

## Risultati attesi (Workflow)

| Esito | Criterio |
|-------|----------|
| SoT CLI | `npm run check` è l’autorità; IDE/AI non divergono |
| Semantica comandi | `typecheck` = tipi app; `lint` = Biome (`biome check`); `check` = gate composito versionato qui |
| Una sola config | Nessuna regola “locale” parallela in VS Code / Studio / Gemini |
| CI allineata | Stesso `npm run check` del locale per il verdetto qualità |
| Strict controllato | Opzioni TS abilitate per roadmap STEP 4, senza interrompere lo sviluppo |

---

## Roadmap (ordine di esecuzione)

```text
STEP 1  Infrastruttura della Source of Truth (comandi CLI)
   ↓
STEP 2  Linter moderno (Biome, salvo blocco)
   ↓
STEP 3  Allineamento strumenti (CLI = editor = Studio = Gemini)
   ↓
STEP 4  Hardening TypeScript (strict progressivo)
```

| STEP | Focus | Dipende da | Rischio |
|------|--------|------------|---------|
| **1** | Semantica script + `check` | — | Quasi nullo |
| **2** | Biome SoT lint/format | STEP 1 | Medio |
| **3** | Editor / Studio / agente | STEP 1–2 | Basso-medio |
| **4** | `strict` progressivo | STEP 1–3 | Medio-alto (controllato) |

---

## Regole anti-regressione

1. Un solo STEP alla volta; non anticipare codice degli STEP successivi.
2. Nessun workaround / doppia SoT.
3. `npm run lint` è Biome (`biome check`); non reintrodurre alias a `typecheck` né un secondo linter.
4. WF-RV-01 su file toccati in review codice.
5. Ogni STEP aggiorna questo file (stato + evidenze).
6. Ogni cambiamento alla **composizione** di `check` o al **ruolo** di uno script del contratto va registrato qui **prima o contestualmente** all’implementazione in `package.json`.
7. Script satelliti (`typecheck:*`, smoke, audit bundle, ecc.) non diventano parte del verdetto ufficiale se non elencati nella composizione vigente di `check`.
8. Unica config lint/format: `biome.json`. Vietato reintrodurre ESLint/Prettier come SoT parallela.

---

## Contratto comandi CLI (vigente)

### Semantica stabile (ruoli — non dipendono dallo STEP)

| Comando | Ruolo invariante |
|---------|------------------|
| `npm run typecheck` | SoT tipi del **project app di default** |
| `npm run typecheck:<scope>` | SoT tipi di un **project satellite** (`scripts`, `packing`, …) |
| `npm run lint` | SoT **lint + format + organize imports** del repo (Biome) |
| `npm run lint:layers` | SoT layering z-index TD |
| **`npm run check`** | **Unico verdetto ufficiale** di qualità per lo scope definito da questo WF |

### Implementazione corrente (STEP 2)

| Comando | Comportamento eseguibile |
|---------|--------------------------|
| `npm run typecheck` | `tsc -p tsconfig.app.json --noEmit` |
| `npm run typecheck:scripts` | `tsc -p tsconfig.scripts.json --noEmit` |
| `npm run typecheck:packing` | `tsc -p tsconfig.packing.json --noEmit` |
| `npm run lint` | `biome check .` (config: `biome.json`) |
| `npm run lint:layers` | `tsx scripts/check-layers.ts` |
| **`npm run check`** | `typecheck` && `lint` && `lint:layers` |

**Rimossi in STEP 2:** alias `lint`/`lint:scripts`/`lint:packing` → `typecheck*`; dipendenza `eslint` (orfana, senza config).

### Composizione vigente di `check`

| Incluso oggi | Non incluso oggi (finché non deciso esplicitamente) |
|--------------|-----------------------------------------------------|
| `typecheck` (app) | `typecheck:scripts`, `typecheck:packing`, altri `typecheck:*` |
| `lint` (Biome — lint + format + assist) | — |
| `lint:layers` | Test automatici (unit/e2e/…) |
| | `vite build` / preview / bundle audit |
| | Toolchain Deno (`supabase/functions`) |
| | Smoke script di dominio (`*:smoke`) |

**Nota baseline (2026-08-02, aggiornata STEP 4):** `npm run typecheck` è **verde** con `strict` + `noFallthroughCasesInSwitch` + `noImplicitOverride` in `tsconfig.app.json`. `lint` (Biome) e `lint:layers` possono ancora risultare **non verdi** per debito preesistente (diagnostiche Biome su scripts/config, z-index numerici) — fuori scope STEP 4; non indebolire il gate.

---

## Evoluzione di `check` (governance)

`check` è un **gate composito versionato da questo WF**, non un alias libero.

1. **Espansioni già pianificate** nei 4 STEP (es. inclusione del linter in STEP 2) si applicano **solo** nello STEP indicato, dopo OK/ACCETTO previsti.
2. **Ogni altra** aggiunta, rimozione o sostituzione di un componente di `check` richiede:
   - decisione PO (o log decisioni in questo file);
   - aggiornamento della tabella «Composizione vigente»;
   - allineamento di `package.json`.
3. Preferire evoluzione **additiva** e esplicita. La rimozione di un gate già in `check` è eccezione e va motivata.
4. Comandi satelliti restano utilizzabili in isolamento; **non** equivalgono a `check`.
5. Vietato introdurre un secondo script “check completo” / “check:ci” / “check:strict” con regole diverse senza decisione PO che aggiorni questo contratto. Se serve uno scope più ampio in futuro, si **estende** `check` oppure si documenta qui un nome distinto con ruolo non ambiguo (mai come SoT parallela nascosta).

---

## Check locale e check CI

| Ambiente | Obbligo |
|----------|---------|
| Locale (dev, AI, Studio) | Il verdetto qualità è **`npm run check`** |
| CI (quando introdotta) | Il job di qualità di questo WF deve eseguire **lo stesso** `npm run check` (stesso repo, stesse config) |

**Definizioni:**

- **Verdetto qualità (questo WF)** = exit code di `npm run check`.
- **Pipeline CI** può avere job aggiuntivi (build, deploy, e2e, security scan, …). Essi **non** sostituiscono `check` e **non** entrano automaticamente nel verdetto di questo WF.
- Un job CI “verde” ottenuto bypassando `check` o con config lint/types diverse dal repository è **non conforme** a WF-QUAL-01.
- Obiettivo di allineamento: stesso comando → stesso esito su macchina locale e su CI (a parità di checkout e toolchain installata).

---

## Test automatici (fuori dai 4 STEP)

I 4 STEP di WF-QUAL-01 **non** introducono né obbligano una suite di test.

| Stato | Regola |
|-------|--------|
| Oggi | I test (se presenti o futuri) **non** fanno parte di `check` |
| Futuro | L’inclusione in `check` richiede decisione PO + aggiornamento del contratto composizione |
| Ambito ampio | Se nasce una toolchain di test sostanziale, può richiedere iniziativa dedicata; **non** si aggiungono STEP a questo WF per assorbirla in silenzio |

Fino a decisione esplicita: successo/fallimento dei test **non** altera il significato di `npm run check`.

---

## Nuovi project TypeScript

| Evento | Procedura obbligatoria |
|--------|------------------------|
| Nuovo `tsconfig` / package tipizzato nel monorepo | Introdurre `typecheck:<scope>` (o equivalente documentato) |
| Uso quotidiano del satellite | Consentito via script dedicato |
| Promozione nel verdetto ufficiale | Solo se il PO include lo script nella **composizione vigente di `check`** (e, se serve, in un allargamento documentato di `typecheck`) |

**Vietato:** far sì che `npm run typecheck` (default) o `npm run check` inizino a tipizzare nuovi alberi “di nascosto” senza aggiornare questo file.

---

## Retrocompatibilità degli script

1. Da STEP 2 in poi: `npm run lint` **non** è più alias di `typecheck`. Usare `npm run typecheck` / `typecheck:*` per i tipi.
2. Gli script `lint:scripts` e `lint:packing` sono **rimossi** (erano alias fuorvianti a `typecheck:*`).
3. Rinominare o rimuovere uno script del contratto senza aggiornare questo WF è una **regressione di SoT**.
4. Tool e agenti devono preferire i nomi **semantici** (`typecheck`, `lint`, `check`).

---

## Casi limite e definizioni esplicite

| Caso | Definizione / comportamento atteso |
|------|-------------------------------------|
| Exit code di `check` | ≠ 0 ⇒ verdetto **non accettabile** secondo il contratto vigente |
| Short-circuit (`&&`) | Se un componente fallisce, i successivi possono non eseguirsi; il verdetto resta negativo. Non è un bug. |
| Debito noto (check rosso) | `check` deve restare **veritiero**. Il debito si sanisce o si accetta esplicitamente dal PO; non si indebolisce il gate per “farlo passare”. |
| “Accettabile per continuare a sviluppare” vs “check verde” | Sono concetti distinti. Solo il PO può dichiarare debito accettato a tempo; ciò non rende verde un `check` rosso. |
| IDE senza errori / IDE con errori diversi da `tsc` | Irrilevante per il verdetto ufficiale. Conta solo la CLI del repo. |
| Format vs regole lint | Entrambi sono sotto Biome (`biome check` via `npm run lint`). Non usare Prettier/ESLint. Preferenze editor → STEP 3. |
| Edge / Deno | Fuori da `check` finché il PO non li include nel contratto. |
| Smoke / audit ad hoc | Utili localmente; **non** sono `check` salvo promozione esplicita. |

---

## STEP 1 — Infrastruttura della Source of Truth

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Chiarire la nomenclatura CLI; introdurre `typecheck` e `check` come SoT; **non** cambiare il comportamento dei tool sottostanti (`tsc` / `check-layers`) |
| **Stato STEP** | **Completato** (ACCETTO PO 2026-08-02) |
| **DoD STEP** | Script presenti; `lint` alias di `typecheck`; `check` = typecheck + lint:layers; comportamento `tsc`/`check-layers` invariato; WF + roadmap + status aggiornati; STEP 2 non avviato |

### Fasi

| Fase | Stato | Inizio | Fine | PO ✓ |
|------|-------|--------|------|------|
| Analisi | Completato | 2026-08-02 | 2026-08-02 | ☑ |
| Pronto per implementazione | Completato | 2026-08-02 | 2026-08-02 | ☑ |
| Sviluppo | Completato | 2026-08-02 | 2026-08-02 | ☑ |
| Review tecnica | Completato | 2026-08-02 | 2026-08-02 | ☑ |
| Test | Completato | 2026-08-02 | 2026-08-02 | ☑ |
| Verifica PO | Completato | 2026-08-02 | 2026-08-02 | ☑ |

### Checklist chiusura STEP 1

- [x] Nomenclatura `typecheck` / `check` introdotta
- [x] Alias legacy `lint` → typecheck (superseduto da STEP 2)
- [x] Nessuna modifica tsconfig / nessuna introduzione linter (in STEP 1)
- [x] Documentazione WF + indici aggiornati
- [x] STEP 2 non avviato (in STEP 1)
- [x] ACCETTO PO su STEP 1

---

## STEP 2 — Linter moderno

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Una sola SoT per lint e formatting (Biome); eliminare ESLint orfano e l’alias `lint` → `typecheck` |
| **Stato STEP** | **Completato** (ACCETTO PO 2026-08-02 / avvio STEP 3) |
| **DoD STEP** | Linter unico in repo; `npm run lint` = Biome; `check` include lint; ESLint rimosso; nessuna doppia SoT; STEP 3 non avviato |

### Fasi

| Fase | Stato | Inizio | Fine | PO ✓ |
|------|-------|--------|------|------|
| Analisi | Completato | 2026-08-02 | 2026-08-02 | ☑ |
| Pronto per implementazione | Completato | 2026-08-02 | 2026-08-02 | ☑ |
| Sviluppo | Completato | 2026-08-02 | 2026-08-02 | ☑ |
| Review tecnica | Completato | 2026-08-02 | 2026-08-02 | ☑ |
| Test | Completato | 2026-08-02 | 2026-08-02 | ☑ |
| Verifica PO | Completato | 2026-08-02 | 2026-08-02 | ☑ |

### Deliverable

- `biome.json` — SoT lint + format (preset recommended, domain `react`, scope app/scripts/server/config)
- `package.json` — `lint` = `biome check .`; `check` = typecheck && lint && lint:layers; `@biomejs/biome` 2.5.6; `eslint` rimosso
- Suppressions ESLint convertite in `biome-ignore` dove ancora intenzionali
- Questo file WF + indici roadmap/status/README

### Verifiche eseguite (2026-08-02)

| Controllo | Exit | Esito STEP 2 |
|-----------|------|----------------|
| `npm run lint` | 1 | Esegue `biome check .` (non più typecheck); ~3986 errori / ~2365 warning (debito Biome preesistente lint/format) |
| `npm run typecheck` | 2 | Invariato (tsc); debito TS preesistente |
| `npm run check` | 2 | Composito `typecheck && lint && lint:layers`; si ferma su typecheck (`&&`) |
| `npm ls eslint` | empty | Nessuna dipendenza ESLint residua |
| Dipendenza `eslint` | — | **Rimossa** da `package.json` / lockfile |
| Config ESLint | — | **Assente** (già assente); nessuna config parallela |
| STEP 3 editor/Studio | — | **Non** avviato |

**Regressione STEP 2:** nessuna sul contratto. Biome espone debito lint/format reale; non si indeboliscono le regole per ottenere un verde fittizio.

### Checklist chiusura STEP 2

- [x] Biome installato e configurato (`biome.json`)
- [x] `npm run lint` = `biome check .`
- [x] `npm run check` include `lint`
- [x] ESLint rimosso; nessuna doppia SoT
- [x] Commenti `eslint-disable` obsoleti convertiti o rimossi
- [x] Documentazione WF + indici aggiornati
- [x] STEP 3 / STEP 4 non avviati (al momento della chiusura implementativa STEP 2)
- [x] ACCETTO PO su STEP 2 (avvio STEP 3 autorizzato)

---

## STEP 3 — Allineamento degli strumenti

| Campo | Valore |
|-------|--------|
| **Obiettivo** | CLI, VS Code, Firebase Studio, Gemini consumano la stessa configurazione del repository; nessun tool con regole “proprie” |
| **Stato STEP** | **Completato** (ACCETTO PO 2026-08-02 / avvio STEP 4) |
| **DoD STEP** | Editor settings / recommendations allineati; istruzioni agente esplicite (`check` = SoT); checklist Studio documentata; contratto `check` invariato |

### Fasi

| Fase | Stato | Inizio | Fine | PO ✓ |
|------|-------|--------|------|------|
| Analisi | Completato | 2026-08-02 | 2026-08-02 | ☑ |
| Pronto per implementazione | Completato | 2026-08-02 | 2026-08-02 | ☑ |
| Sviluppo | Completato | 2026-08-02 | 2026-08-02 | ☑ |
| Review tecnica | Completato | 2026-08-02 | 2026-08-02 | ☑ |
| Test | Completato | 2026-08-02 | 2026-08-02 | ☑ |
| Verifica PO | Completato | 2026-08-02 | 2026-08-02 | ☑ |

### Deliverable

| Artefatto | Ruolo |
|-----------|--------|
| `.vscode/settings.json` | Biome come formatter (solo se esiste `biome.json`); ESLint/Prettier editor disabilitati; TS SDK workspace invariato |
| `.vscode/extensions.json` | Recommend `biomejs.biome` + Deno; unwanted ESLint/Prettier |
| `.idx/dev.nix` | Firebase Studio / IDX: estensioni Biome + Deno (rimosse Svelte/Vue fuori scope) |
| `.cursor/rules/wf-qual-01-quality-sot.mdc` | Agenti Cursor: `npm run check` = SoT |
| `GEMINI.md` | Gemini / AI: stesso contratto CLI |

### Checklist Firebase Studio / IDX (operativa)

- [x] Estensioni workspace = Biome + Deno (nessun linter parallelo)
- [x] Preview `npm run dev` invariata
- [x] Verdetto qualità = `npm run check` (non le diagnostiche IDE)
- [x] Lint/format = solo `biome.json` del repo (`biome.requireConfiguration` in VS Code)

### Verifiche eseguite (2026-08-02)

| Controllo | Esito |
|-----------|--------|
| Contratto `package.json` / `npm run check` | **Invariato** (nessuna modifica script/gate) |
| `biome.json` | **Invariato** |
| Settings editor: no `biome.inlineConfig` | ☑ (niente SoT parallela) |
| STEP 4 (strict TS) | Avviato dopo ACCETTO / istruzione PO STEP 4 |

### Checklist chiusura STEP 3

- [x] VS Code allineato a Biome + TS workspace
- [x] IDX / Firebase Studio estensioni allineate
- [x] Istruzioni agente / Gemini (`check` = SoT)
- [x] Nessuna seconda SoT; nessun cambio gate CLI
- [x] Documentazione WF + indici aggiornati
- [x] ACCETTO PO / avvio STEP 4 autorizzato (istruzione PO implementazione STEP 4)

---

## STEP 4 — Hardening TypeScript

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Introdurre progressivamente opzioni TypeScript (`strict` e correlate) senza interrompere lo sviluppo |
| **Stato STEP** | **Completato** (implementazione 2026-08-02) → In verifica PO |
| **DoD STEP** | Flag abilitati in `tsconfig.app.json`; incompatibilità reali corrette senza workaround; `npm run typecheck` verde; debiti residui documentati; nessun indebolimento regole; contratto `check` invariato |

### Fasi

| Fase | Stato | Inizio | Fine | PO ✓ |
|------|-------|--------|------|------|
| Analisi | Completato | 2026-08-02 | 2026-08-02 | ☑ |
| Pronto per implementazione | Completato | 2026-08-02 | 2026-08-02 | ☑ |
| Sviluppo | Completato | 2026-08-02 | 2026-08-02 | ☐ |
| Review tecnica | Completato | 2026-08-02 | 2026-08-02 | ☐ |
| Test | Completato | 2026-08-02 | 2026-08-02 | ☐ |
| Verifica PO | In corso | 2026-08-02 | | ☐ |

### Opzioni TypeScript abilitate (`tsconfig.app.json`)

| Opzione | Stato | Nota |
|---------|-------|------|
| `strict` | **Abilitata** | Include `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, ecc. |
| `noFallthroughCasesInSwitch` | **Abilitata** | Correlata strict / qualità switch |
| `noImplicitOverride` | **Abilitata** | Richiede `override` esplicito sulle subclass |

### Opzioni rimandate (debito residuo intenzionale)

| Opzione | Motivazione |
|---------|-------------|
| `noUncheckedIndexedAccess` | Impatto stimato ~+420 errori su accessi indexed; richiede refactor ampio (array/record indexing) oltre lo scope controllato di STEP 4. Candidato per intervento dedicato futuro, senza abbassare `strict`. |

### Verifiche eseguite (2026-08-02)

| Controllo | Esito |
|-----------|--------|
| `npm run typecheck` | **Verde** (0 errori) |
| Contratto `package.json` / `npm run check` | **Invariato** |
| `biome.json` | **Invariato** |
| Workarounds (`any` / `@ts-ignore` / disable strict) | **Nessuno introdotto** |
| Type safety | **Non ridotta** (solo narrowing / null→undefined / `override` / sanitizzazione media) |

### Debito residuo (fuori STEP 4 / non bloccante per chiusura implementativa)

- `noUncheckedIndexedAccess` non abilitata (vedi tabella sopra).
- `npm run lint` / `lint:layers` possono restare non verdi per debito Biome/layer preesistente (scripts, line endings, z-index) — non sanato in STEP 4.
- Allineamenti dominio più ampi (es. tipi Supabase vs mapper) restano miglioramenti continui, non regressioni STEP 4.

### Checklist chiusura STEP 4

- [x] Opzioni TS coerenti abilitate in `tsconfig.app.json`
- [x] Incompatibilità reali corrette senza hack
- [x] `npm run typecheck` verde
- [x] Debiti residui documentati (no workaround)
- [x] Gate CLI / Biome invariati
- [x] Documentazione WF + indici aggiornati
- [ ] ACCETTO PO su STEP 4 (chiusura formale WF-QUAL-01)

---

## Log decisioni operative

| Data | Decisione | Chi |
|------|-----------|-----|
| 2026-08-02 | Apertura WF-QUAL-01 con 4 STEP; SoT = CLI `npm run check` | PO |
| 2026-08-02 | Linter target = Biome (salvo blocco in STEP 2) | PO (design) |
| 2026-08-02 | STEP 1: `check` = `typecheck` && `lint:layers`; `lint` alias di `typecheck` fino a STEP 2 | AI + contratto WF |
| 2026-08-02 | STEP 2 non parte senza OK PO | PO |
| 2026-08-02 | Governance SoT: composizione `check` versionata qui; CI = stesso comando; test/project satelliti fuori da `check` finché non promossi; responsabilità PO vs AI/CI/editor esplicitate | AI (review architetturale documento; STEP invariati) |
| 2026-08-02 | STEP 1 ACCETTO PO; avvio STEP 2 autorizzato | PO |
| 2026-08-02 | STEP 2: Biome 2.5.6 SoT lint/format; `lint`=`biome check .`; `check`+=lint; ESLint rimosso; alias lint→typecheck eliminati | AI |
| 2026-08-02 | STEP 2 chiuso (avvio STEP 3); STEP 3: VS Code / IDX / Cursor rule / GEMINI.md consumano solo config repo; gate CLI invariato | AI + PO |
| 2026-08-02 | STEP 3 chiuso (avvio STEP 4); STEP 4: `strict` + `noFallthroughCasesInSwitch` + `noImplicitOverride`; `typecheck` verde; `noUncheckedIndexedAccess` rimandata | AI + PO |

---

## Criterio di successo del Workflow

1. Chiunque esegua `npm run check` ottiene l’**unico** verdetto ufficiale di qualità per lo scope del contratto vigente.
2. CI (quando presente) usa lo **stesso** comando e le **stesse** config del repository per quel verdetto.
3. Nessun editor, Studio o agente produce un verdetto alternativo basato su regole proprie.
4. La composizione di `check` è sempre leggibile in questo file e allineata a `package.json`.

---

## Chiusura Workflow

| Campo | Valore |
|-------|--------|
| **Data chiusura** | — |
| **Validazione PO finale** | — |
| **Archiviato in** | `WORKFLOWS/_archive/` (se applicabile) |

---

## Cronologia stato

Una riga = una fotografia coerente (niente doppioni «In verifica PO» + «ACCETTO» per lo stesso STEP).

| Data | STEP | Fase | Stato | Nota |
|------|------|------|-------|------|
| 2026-08-02 | — | — | Attivo | Apertura WF |
| 2026-08-02 | — | — | Attivo | Review governance documento SoT (nessun cambio STEP / nessun cambio `package.json`) |
| 2026-08-02 | STEP 1 | — | Completato (ACCETTO PO) | Infrastruttura CLI; Gate G-QUAL-01-S1 chiuso |
| 2026-08-02 | STEP 2 | — | Completato (ACCETTO PO / avvio STEP 3) | Biome SoT; ESLint rimosso; Gate G-QUAL-01-S2 chiuso |
| 2026-08-02 | STEP 3 | — | Completato (ACCETTO PO / avvio STEP 4) | Editor/Studio/agente allineati; Gate G-QUAL-01-S3 chiuso |
| 2026-08-02 | STEP 4 | Verifica PO | Implementazione Completata → In verifica PO | Hardening TS; `typecheck` verde; `noUncheckedIndexedAccess` debito residuo; attende ACCETTO PO (chiusura formale WF) |
