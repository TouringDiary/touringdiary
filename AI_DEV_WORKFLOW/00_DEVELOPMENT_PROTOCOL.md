# 00 — Development Protocol (TouringDiary)

> **Documento permanente.** Definisce **come** si sviluppa su TouringDiary.
> **Non** descrive feature, architettura né stato avanzamento.
> Per *dove siamo* → `03_PROJECT_STATUS.md`. Per *cosa costruire* → SSOT in `AI_CONTEXT`.

---

## 1. Scopo e perimetro

Questo protocollo è il **metodo ufficiale** applicato a ogni Workflow, STEP e Fase.

| In scope | Fuori scope |
|----------|-------------|
| Macro-ciclo di sviluppo | Definizione architetturale di dominio |
| Prerequisiti prima del codice | Gate di dominio (definiti negli SSOT) |
| Checkpoint Product Owner | Stato progetto (dashboard) |
| DoD **generica** (template) | DoD **di dominio** (nei Masterplan) |
| Chiusura formale fasi/STEP | Implementazione tecnica dettagliata |

---

## 2. Principi generali

1. **Evidenza prima del codice** — Nessuna implementazione senza analisi e, se esiste, gate SSOT soddisfatto.
2. **SSOT separato** — Architettura in `AI_CONTEXT`; avanzamento in `AI_DEV_WORKFLOW`. Mai mescolare.
3. **Un focus consigliato** — Un Workflow **Attivo** per default; eccezioni solo con PO Override (`02_GOVERNANCE.md`).
4. **Documentazione prima della chiusura** — Stato e SSOT aggiornati prima di dichiarare una fase Completata.
5. **Triade allineata** — Per modifiche significative: Utente (PO), ChatGPT, Gemini allineati (`AI_CONTEXT/07_AI_WORKFLOW.md`).
6. **Nessun workaround architetturale** — Se il sistema blocca (es. 403), si corregge l'architettura, non si aggira (`06_CHANGE_IMPACT_RULES.md`).
7. **Sicurezza by default** — In assenza di competenza tecnica PO per disambiguare, prevale la soluzione più sicura (`02_GOVERNANCE.md` §10).
8. **Documentazione vivente** — Ogni attività conclusa (analisi, implementazione, bugfix, refactoring, manutenzione o aggiornamento documentale) deve verificare se aggiornare `AI_CONTEXT`, `AI_CONTEXT_MASTER` e `AI_DEV_WORKFLOW`. L'aggiornamento è **incrementale**: mantenere il contenuto ancora valido; modificare solo le sezioni realmente impattate; evitare riscritture massive; preservare continuità e storico (matrice → `README.md` § *Aggiornamento documentale a fine sviluppo*).

---

## 3. Ruoli (in fase di sviluppo)

| Ruolo | Responsabilità nel processo |
|-------|----------------------------|
| **Product Owner** | Obiettivi, priorità, validazione funzionale/UI, override espliciti, chiusura STEP |
| **Sviluppo / tecnico** | Analisi, implementazione, review tecnica, test, aggiornamento documentazione operativa |
| **ChatGPT** | Architettura, strategia, query DB, impatto (`07_AI_WORKFLOW.md`) |
| **Gemini / AI IDE** | Codice reale, dipendenze, esecuzione modifiche (`07_AI_WORKFLOW.md`) |

---

## 4. Gerarchia operativa

```
Workflow (WF)     → macro-iniziativa (file in WORKFLOWS/)
  └── STEP        → traguardo intermedio misurabile
        └── Fase  → istanza del macro-ciclo sotto (es. Analisi, Sviluppo, …)
```

Ogni Fase segue le sezioni 5–12 di questo protocollo in forma ridotta (checklist nel file Workflow).

---

## 5. Macro-ciclo obbligatorio (ogni Fase)

```
① Intake obiettivo
② Analisi (leggere SSOT coinvolti — non copiarli)
③ Definizione obiettivo e perimetro della Fase
④ Pianificazione (checklist, DoD della Fase)
⑤ Verifica Gate (dominio da SSOT + esecuzione da Workflow)
⑥ Implementazione (solo se gate OK)
⑦ Review tecnica
⑧ Test
⑨ Verifica PO (funzionale + UI)
⑩ Correzioni eventuali
⑪ Aggiornamento documentazione (SSOT se architettura cambia; sempre WF + 03_PROJECT_STATUS)
⑫ Chiusura formale Fase
```

**Vietato** saltare ⑨ per fasi che producono incremento verificabile dal PO.

---

## 6. Prerequisiti prima di avviare un Workflow

- [ ] Obiettivo approvato dal PO (anche verbale, registrato nel file WF)
- [ ] SSOT di dominio identificati e linkati nel Workflow
- [ ] Workflow precedente chiuso **oppure** PO Override registrato (`02_GOVERNANCE.md`)
- [ ] `03_PROJECT_STATUS.md` aggiornato con nuovo WF o transizione stato
- [ ] Letti: `06_CHANGE_IMPACT_RULES.md`, SSOT pertinenti

---

## 7. Prerequisiti prima di scrivere codice o migration

- [ ] Fase corrente = **Pronto per implementazione** (se il dominio prevede questo stato nel SSOT)
- [ ] Gate di dominio rilevanti = ☑ nel Workflow (tracciamento; definizione nel Masterplan)
- [ ] Analisi impatto completata (`06_CHANGE_IMPACT_RULES.md`)
- [ ] Nessun blocco aperto in `03_PROJECT_STATUS.md` sul WF senza override PO

---

## 8. Pianificazione

- Ogni STEP nel Workflow ha: obiettivo, DoD STEP, elenco Fasi.
- Ogni Fase ha: checklist operativa (non architetturale).
- Le Fasi usano gli **stati** definiti in `02_GOVERNANCE.md`.

---

## 9. Implementazione

- Rispettare SSOT di dominio e `06_CHANGE_IMPACT_RULES.md`.
- Non duplicare logica documentata altrove: implementare nel codice, aggiornare SSOT se l'architettura **cambia**.
- Avanzamento (stato Fase) → solo in `AI_DEV_WORKFLOW`.

---

## 10. Review tecnica

Minimo prima di uscire da «In review tecnica»:

- [ ] Diff coerente con SSOT e obiettivo Fase
- [ ] Nessun workaround di sicurezza non approvato nel Masterplan
- [ ] Tipi / policy / RPC allineati dove applicabile
- [ ] Esito review documentato (una riga nel Workflow)

### Verifica tecnica obbligatoria post-implementazione (tutti i Workflow)

**Subito dopo** ogni implementazione, **prima** di presentare i file per review architetturale o dichiarare una Fase conclusa:

1. Completare l'implementazione nel perimetro della Fase.
2. Eseguire **subito** controllo TypeScript e linter **su tutti i file modificati** (e sui consumer diretti se impattati dai tipi).
3. Se esistono errori TS, import rotti, simboli non usati o signature incoerenti → **risolverli prima** di procedere.
4. Presentare i file definitivi per review **solo quando puliti**.

**Vietato:**

- lasciare errori TS «da sistemare dopo» nei file toccati;
- workaround, hack, `@ts-ignore`, cast inutili o suppressioni per far compilare;
- import rotti o riferimenti a codice rimosso.

**Se emerge un problema architetturale** (es. narrowing, contratto RPC, tipo condiviso): correggerlo nel modo giusto, anche se richiede un aggiustamento minimo dell'implementazione della Fase corrente.

**Ordine minimo di verifica:** linter/IDE sui file modificati → `tsc` / build di progetto (se applicabile al deliverable) → smoke sul percorso toccato.

---

## 11. Test

Minimo prima di «In verifica PO»:

- [ ] Percorso felice verificato
- [ ] Regressione su aree toccate (smoke)
- [ ] Per domini critici (Sponsor, AI, pagamenti): criteri aggiuntivi dal rispettivo SSOT **se già definiti lì**

---

## 12. Checkpoint Product Owner (obbligatorio)

Prima di impostare una Fase su **Completato**:

| # | Verifica | ☐ |
|---|----------|---|
| 1 | Review tecnica completata | |
| 2 | Verifica **funzionale** (comportamento vs obiettivo / SSOT) | |
| 3 | Verifica **UI** (percorsi, schermate, messaggi utente se pertinente) | |
| 4 | Correzioni richieste implementate **oppure** accettate come debito documentato | |
| 5 | SSOT di dominio aggiornato (solo se l'architettura è cambiata) | |
| 6 | `WORKFLOWS/WF_XX` aggiornato (stato Fase/STEP) | |
| 7 | `03_PROJECT_STATUS.md` aggiornato | |
| 8 | **Validazione PO esplicita** (data + esito: Approvato / Approvato con riserve) | |

Senza riga 8 nessuna Fase si considera Completata.

---

## 13. Definition of Done — template generico (Fase)

Applicare nel file Workflow; **non** sostituisce DoD di dominio nei Masterplan.

| Criterio | Soddisfatto |
|----------|-------------|
| Obiettivo della Fase raggiunto | ☐ |
| Gate di dominio referenziati ☑ (se applicabili) | ☐ |
| Review + test completati | ☐ |
| Checkpoint PO (§12) completato | ☐ |
| Documentazione operativa aggiornata | ☐ |
| Nessun blocco aperto non gestito | ☐ |

---

## 14. Chiusura STEP e Workflow

### STEP chiuso quando

- Tutte le Fasi del STEP = **Completato**
- DoD del STEP (nel file WF) soddisfatta
- Validazione PO sul STEP registrata

### Workflow chiuso quando

- Tutti gli STEP chiusi
- Tutti i gate di dominio del perimetro = ☑ (tracciati nel WF)
- Validazione PO finale sul Workflow
- File spostabile in `WORKFLOWS/_archive/` (opzionale, raccomandato dopo stabilizzazione)
- `01_EXECUTION_ROADMAP.md` e `03_PROJECT_STATUS.md` aggiornati

---

## 15. Report operativo finale (obbligatorio)

### Ambito

Questa convenzione vale per **ogni** conclusione di attività:

- sviluppo, manutenzione, bugfix, refactoring;
- aggiornamento documentale;
- chiusura di Fase, STEP o Workflow.

Il report deve comparire:

1. **Nel file Workflow** (e in `03_PROJECT_STATUS.md` se cambia il focus) — per chiusure formali di Fase/STEP/WF.
2. **In ogni output operativo** destinato al Product Owner, ad altre AI o ad altri strumenti di sviluppo — **sempre come ultima sezione**.

Il Product Owner deve capire **immediatamente**: dove siamo, **quale livello è stato concluso** (Fase / STEP / Workflow), prossimo checkpoint, prossimo passo, allineamento documentazione.

**Avanzamento in questa attività** — valori ammessi:

| Valore | Significato |
|--------|-------------|
| `Nessuna fase conclusa` | Attività utile ma nessuna Fase/STEP/WF chiuso formalmente |
| `Fase conclusa` | Almeno una Fase del Workflow = Completato (§12) |
| `STEP concluso` | Intero STEP chiuso (§14) |
| `Workflow concluso` | Intero Workflow chiuso (§14) |

### Titolo sezione standard (risposte)

Ogni risposta operativa deve terminare con:

```markdown
## Report operativo
```

### Contenuto obbligatorio

| Campo | Descrizione |
|-------|-------------|
| **Workflow corrente** | `WF-XX — nome` oppure `Nessun Workflow attivo` |
| **STEP corrente** | `STEP-N — nome` oppure `—` |
| **Fase corrente** | Nome fase (`02_GOVERNANCE.md`) oppure `—` |
| **Stato corrente** | Stato **Fase** o **Workflow** vigente (enum `02_GOVERNANCE.md`) |
| **Avanzamento in questa attività** | Punto esatto raggiunto — **uno solo** dei valori: `Nessuna fase conclusa` · `Fase conclusa` · `STEP concluso` · `Workflow concluso` |
| **Prossima fase da eseguire** | Nome della prossima Fase concreta da avviare (es. `Fase 1.1 — Chiusura analisi DOC 29`) oppure `—` se nessuna Fase è ancora in coda |
| **Prossimo checkpoint previsto** | Prossimo momento di verifica esplicito (es. Review PO, Test, Chiusura STEP, Chiusura Workflow) |
| **Prossima attività consigliata** | Azione concreta successiva |

### Verifica documentazione (obbligatoria)

Per ciascun layer dichiarare **una** delle due opzioni:

| Layer | Formato |
|-------|---------|
| **AI_CONTEXT** | `Aggiornato` — [file/path] · oppure `Non necessario` — [motivazione] |
| **AI_CONTEXT_MASTER** | `Aggiornato` — [file/path] · oppure `Non necessario` — [motivazione] |
| **AI_DEV_WORKFLOW** | `Aggiornato` — [file/path] · oppure `Non necessario` — [motivazione] |

Matrice per tipo di modifica → `README.md` § *Aggiornamento documentale a fine sviluppo*.

**Regola:** se un layer è «non necessario» ma conteneva informazioni rese obsolete dall'attività, il report è **invalido** — aggiornare e correggere.

### Template — risposta operativa (copiabile)

```markdown
## Report operativo

| Campo | Valore |
|-------|--------|
| **Workflow corrente** | |
| **STEP corrente** | |
| **Fase corrente** | |
| **Stato corrente** | |
| **Avanzamento in questa attività** | Nessuna fase conclusa / Fase conclusa / STEP concluso / Workflow concluso |
| **Prossima fase da eseguire** | |
| **Prossimo checkpoint previsto** | |
| **Prossima attività consigliata** | |

### Documentazione

| Layer | Esito |
|-------|--------|
| **AI_CONTEXT** | Aggiornato — … / Non necessario — … |
| **AI_CONTEXT_MASTER** | Aggiornato — … / Non necessario — … |
| **AI_DEV_WORKFLOW** | Aggiornato — … / Non necessario — … |
```

### Template — chiusura formale (file Workflow)

Per chiusura registrata nel file `WORKFLOWS/WF_XX_*.md`, usare lo stesso schema aggiungendo:

```markdown
## Report operativo

| Campo | Valore |
|-------|--------|
| **Workflow corrente** | |
| **STEP corrente** | |
| **Fase corrente** | |
| **Stato corrente** | |
| **Avanzamento in questa attività** | Nessuna fase conclusa / Fase conclusa / STEP concluso / Workflow concluso |
| **Prossima fase da eseguire** | |
| **Prossimo checkpoint previsto** | |
| **Prossima attività consigliata** | |

**Validazione PO:** [Approva / Approva con riserve] — [data]
```

---

## 16. Riferimenti (non duplicare contenuto)

| Documento | Uso |
|-----------|-----|
| `AI_DEV_WORKFLOW/01_EXECUTION_ROADMAP.md` | Indice Workflow |
| `AI_DEV_WORKFLOW/02_GOVERNANCE.md` | Stati, override, sequenza |
| `AI_DEV_WORKFLOW/03_PROJECT_STATUS.md` | Dashboard |
| `AI_CONTEXT/06_CHANGE_IMPACT_RULES.md` | Sicurezza modifiche |
| `AI_CONTEXT/07_AI_WORKFLOW.md` | Triade collaborativa |
| `AI_DEV_WORKFLOW/README.md` | Boot operativo + matrice aggiornamento documentale |

---

## Cronologia protocollo

| Versione | Data | Modifiche |
|----------|------|-----------|
| 1.0.0 | 2026-07-13 | Creazione framework AI_DEV_WORKFLOW |
| 1.0.1 | 2026-07-13 | §15 Report di chiusura obbligatorio |
| 1.0.2 | 2026-07-13 | §15 esteso: report operativo in ogni risposta; chiusura Fase/STEP/WF esplicita |
| 1.0.3 | 2026-07-14 | §2 principio Documentazione vivente; §15 Avanzamento + Prossimo checkpoint previsto |
| 1.0.4 | 2026-07-14 | §15 rimosso campo duplicato Chiusura in questa attività |
| 1.0.5 | 2026-07-14 | §15 campo **Prossima fase da eseguire** (tabella, template risposta, template chiusura WF) |
