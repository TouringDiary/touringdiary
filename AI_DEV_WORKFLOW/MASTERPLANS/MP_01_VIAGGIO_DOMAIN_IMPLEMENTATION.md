# MP-01 — Masterplan di implementazione: Dominio Viaggio

> **COME** portare il dominio Viaggio congelato nel prodotto.
> **Non** ridefinisce il dominio (COSA).
>
> | Layer | Documento |
> |-------|-----------|
> | Regole | `AI_CONTEXT/34A_DOMAIN_DESIGN_RULES.md` |
> | Struttura dominio | `AI_CONTEXT/37_VIAGGIO_DOMAIN.md` |
> | Visione MySpace | `AI_CONTEXT/35_MYSPACE_PRODUCT_VISION.md` |
> | Ordine capacità prodotto | `AI_CONTEXT/36_MYSPACE_PRODUCT_MASTERPLAN.md` |
> | Collaborazione | `AI_CONTEXT/28_COLLABORATION_WORKSPACE_SYSTEM.md` (Parte A = target) |
> | Packing | `AI_CONTEXT/31_PACKING_SUITCASE_SYSTEM.md` (Parte A = target) |
>
> Massimo **5 STEP** principali. I batch operativi nascono solo **dopo** l’apertura del relativo Workflow.
>
> **WF-04** è **Sospeso** (`PO-OV-002`): non è piano esecutivo.  
> Qualsiasi implementazione del dominio Viaggio parte da **questo Masterplan** e da nuovi Workflow — mai da WF-04.

**Versione:** 1.4.1  
**Data:** 2026-07-27  
**Stato:** Masterplan ufficiale — **STEP-1…4 Completati**; **STEP-5** → WF-09 (**In verifica PO**). Termina con STEP-5; chiusura Masterplan post-ACCETTO; **no WF-10 automatico**.  
**Prerequisito prodotto:** Macrofase 1 MyWorld/shell MySpace **completata** (WF-03)

---

## Governance — Masterplan ↔ Workflow

Questo Masterplan è la **SoT del COME** (implementazione). Ogni Workflow implementa **uno e un solo STEP** di questo Masterplan. Se uno STEP è troppo grande, può essere suddiviso in più Workflow successivi sullo **stesso** STEP. Nessun Workflow può estendersi su STEP differenti del Masterplan.

---

## Principi operativi

1. Correttezza del dominio > preservazione dell’as-is (prodotto non online).
2. Nessuna nuova Product Vision; nessuna nuova sezione del Viaggio fuori da DOC 37.
3. Stereotipi obbligatori: **Resource · Library · View** (DOC 34A / DOC 37). L’**AI non è una sezione**.
4. Se emerge contraddizione reale con DOC 34A/37 → **fermare** e chiedere al PO.
5. Ogni STEP può generare un Workflow dedicato; non anticipare STEP successivi senza gate.
6. `AI_DELETED_CODE_REVIEW.md` secondo WF-RV-01 quando si tocca codice.
7. Vietato ricostruire l’alias storico in cui l’unità patrimonio coincideva col Diario/`itineraries`.

---

## Copertura dominio → STEP

| Elemento dominio (DOC 37) | Stereotipo | STEP primario |
|---------------------------|------------|---------------|
| Viaggio (identità, empty, owner) | Aggregate Root | STEP-1 |
| Diario[] + Diario attivo | Resource | STEP-1 (modello) · STEP-3 (operativo) |
| Valigia[] (≠ Strumenti) | Resource | STEP-3 |
| Roadbook (snapshot da Diario) | Library | STEP-3 |
| Ricordi (Foto, Video, Note/giorno) | Resource | STEP-5 |
| Allegati del Viaggio | Resource | STEP-5 |
| Mappa | View | STEP-5 |
| Riepilogo (+ annotazioni leggere) | View | STEP-5 |
| Catalogo / cartella MySpace | UX DOC 35 | STEP-2 |
| WS copie + WS-da-Viaggio | DOC 28 Parte A | STEP-4 |

---

## Panoramica dei 5 STEP

```text
STEP-1  Fondazione persistenza Viaggio / Diario
   ↓
STEP-2  MySpace: catalogo e cartella sul Viaggio
   ↓
STEP-3  Risorse operative (Diario, Valigia, Roadbook library)
   ↓
STEP-4  Collaborazione (copie + WS-da-Viaggio)
   ↓
STEP-5  Ricordi · Allegati · Mappa · Riepilogo + chiusura gate
```

| STEP | Capacità DOC 36 | Obiettivo sintetico | Autonomia |
|------|-----------------|---------------------|-----------|
| 1 | C1 | Entità Viaggio reale, distinta dal Diario | Dopo WF-03 |
| 2 | C2 | Catalogo / cartella MySpace sul Viaggio | Dopo STEP-1 |
| 3 | C3 | Diario multi+attivo, Valigia-viaggio, Roadbook library | Dopo STEP-1+2 |
| 4 | C4 | Share a copie + Workspace da Viaggio | Dopo STEP-1; STEP-3 per risorse copiabili |
| 5 | C5 | Ricordi, Allegati, Mappa, Riepilogo; gate chiusura | Dopo STEP-1+2; STEP-3 utile per dati |

---

# STEP-1 — Fondazione persistenza Viaggio / Diario

### Obiettivo

Introdurre il **Viaggio** come Aggregate Root persistente e scollegare l’identità del patrimonio dal Diario.

### Motivazioni

Senza persistenza reale, ogni UI “cartella viaggio” resta un alias di `itineraries` / Diario e ricostruisce debito.

### Dipendenze

- WF-03 completato (shell MySpace).
- DOC 34A / 37 congelati.
- Nessuna dipendenza da Preferiti / Ricordi / Mappa / Collaborazione.

### Aree codice (indicative)

- Contesti / servizi itinerari e salvataggio personale (`ItineraryContext`, servizi `itineraries`)
- Tipi dominio viaggio/diario
- Schema Supabase / RLS (nuove tabelle o split concettuale)
- Punti che oggi usano `itinerary.id` come id “viaggio”

### Documenti coinvolti

DOC 37 · DOC 34A · DOC 35 (confine MySpace) · aggiornamento MASTER schema quando verificato sul codice

### Rischi

| Rischio | Mitigazione |
|---------|-------------|
| Migrazione dati personali incompleta | Piano cutover esplicito; prodotto non online → preferire modello corretto |
| Doppia SoT in runtime durante la transizione | Feature boundary chiaro; vietare nuove feature sull’alias storico |
| `active_diary` null | Policy CTA da DOC 37 (empty / scegli Diario) |

### Criteri di completamento

- [x] Esiste entità Viaggio con metadati propri (titolo, destinazione, periodo, copertina, owner) — **WF-05**
- [x] Diario è risorsa collegata (0..N); non è l’identità del Viaggio — **WF-05**
- [x] Empty Viaggio ammesso (dati) — **WF-05**
- [x] Diario attivo modellato; delete attivo senza auto-promote — **WF-05**
- [x] Nessun nuovo codice assume che patrimonio = Diario / `itineraries` — **WF-05**

### Ordine di esecuzione interno

1. Modello dati / invarianti  
2. Servizi di dominio  
3. Adattamento lettori critici (Home/save) al minimo per non rompere  
4. Verifica gate STEP-1 → **Completato** (WF-05); catalogo MySpace = STEP-2 (WF-06)

### Esecuzione

| Campo | Valore |
|-------|--------|
| Workflow | WF-05 — Completato (archiviato) |
| Path | `WORKFLOWS/_archive/WF_05_MP01_STEP1_VIAGGIO_PERSISTENCE.md` |

---

# STEP-2 — MySpace: catalogo e cartella sul Viaggio

### Obiettivo

Far sì che **I miei Viaggi** elenchi e apra **Viaggi** (non diari mascherati), con navigazione a cartella.

### Motivazioni

È il cuore UX della casa; deve parlare il dominio vero (DOC 35 / DOC 36 C2).

### Dipendenze

- STEP-1 completato (o gate PO che autorizza UI su API già stabili).

### Aree codice (indicative)

- Shell MySpace / root «I miei Viaggi»
- Catalogo (liste personali / ex tab Viaggi Account)
- Cartella Viaggio: copertina, breadcrumb, nav sezioni del modello DOC 37 (anche empty):  
  Diario · Valigia · Ricordi · Allegati · Roadbook · Mappa · Riepilogo
- Routing / session `mySpace`

### Documenti coinvolti

DOC 35 (I miei Viaggi, breadcrumb) · DOC 36 C2 · DOC 37 diagramma

### Rischi

| Rischio | Mitigazione |
|---------|-------------|
| Dual-entry Account tab vs MySpace | Non rimuovere tab Account prima di audit migrazione |
| Empty intimidatorio | Empty silenzioso (visione accettata) |

### Criteri di completamento

- [x] Catalogo mostra **Viaggi** *(impl. — attesa Verifica PO)*
- [x] Apertura cartella con sezioni del modello DOC 37 (anche vuote)
- [x] Breadcrumb fino al Viaggio
- [x] Copertina base secondo visione
- [x] MyWorld / altre root MySpace non regressi
- [x] Empty Viaggio ammissibile in UI

### Ordine

1. Catalogo su SoT Viaggio  
2. Cartella + breadcrumb  
3. Nav sezioni (shell)  
4. Smoke orientamento

### Esecuzione

| Campo | Valore |
|-------|--------|
| Workflow | **WF-06** — **Completato** (archiviato) |
| Path | `WORKFLOWS/_archive/WF_06_MP01_STEP2_MYSPACE_VIAGGIO_CATALOG.md` |
| Governance | Un solo STEP = MP-01 STEP-2; checklist interna; no STOP PO intermedi |

---

# STEP-3 — Risorse operative (Diario, Valigia, Roadbook library)

### Obiettivo

Operare Diario (multi + attivo), Valigia del viaggio e libreria Roadbook **dentro** il Viaggio.

### Motivazioni

Nucleo quotidiano di pianificazione e recupero artefatti (DOC 36 C3 · DOC 37 · DOC 31 Parte A).

### Dipendenze

- STEP-1 (relazioni) e STEP-2 (nav cartella).

### Aree codice (indicative)

- `TravelDiary` / salvataggio diario; selezione / cambio Diario attivo
- Packing: associazione Valigia → Viaggio (oggi tipicamente legata a itinerario); DOC 31 Parte A vs Strumenti
- Roadbook: generazione da Diario; snapshot immutabile; indice libreria sul Viaggio; metadati minimi (ref Diario, ref Viaggio, nome, data)

### Documenti coinvolti

DOC 37 §§ Diario, Roadbook, Valigia · DOC 31 Parte A · pricing/AI esistenti (crediti artifact)

### Rischi

| Rischio | Mitigazione |
|---------|-------------|
| Roadbook immutabile vs edit Diario | Snapshot; edit Diario non muta artifact già creato |
| Delete Diario con Roadbook a pagamento | Policy entitlement esplicita in fase tecnica (non contraddice il dominio) |
| Collasso Valigia↔Strumenti | Due case UI/dati (DOC 31 / DOC 35) |

### Criteri di completamento

- [x] Multi-diario + attivo nel Viaggio; no auto-promote su delete attivo
- [x] Valigia del viaggio (0..N) distinta da Strumenti
- [x] Roadbook in libreria Viaggio; generato da Diario; immutabile post-creazione/acquisto
- [x] Metadati minimi artifact presenti (DOC 37)
- [x] Generazione Roadbook usa un Diario del Viaggio (attivo o selezionato in UX)

### Ordine

1. Diario multi + attivo  
2. Valigia-viaggio  
3. Roadbook library + gen  
4. Smoke operativo

### Esecuzione

| Campo | Valore |
|-------|--------|
| Workflow | **WF-07** — **Completato** (archiviato) |
| Path | `WORKFLOWS/_archive/WF_07_MP01_STEP3_VIAGGIO_OPERATIVE_RESOURCES.md` |
| Governance | Un solo STEP = MP-01 STEP-3; checklist interna; no STOP PO intermedi |

---

# STEP-4 — Collaborazione allineata

### Obiettivo

Allineare Workspace al dominio (DOC 28 Parte A): sole copie; introdurre **Workspace da Viaggio** (shell isomorfa); mantenere share per risorsa.

### Motivazioni

Estensione del modello collaborative senza condividere il Viaggio originale (DOC 34A).

### Dipendenze

- STEP-1 (identità Viaggio / risorse)  
- STEP-3 almeno per Diario/Valigia copiabili in modo significativo

### Aree codice (indicative)

- `src/services/collaboration/`, `materializeWorkspaceComposition`
- Wizard `CollaborationShareModal` — entry da Viaggio (selezione risorse → copie)
- Hub `GlobalWorkspacePanel` — morfologia shell-Viaggio vs flat (legacy)
- Rimozione / neutralizzazione di percorsi non più di prodotto (collaborazione sull’istanza personale)
- Allegati Workspace vs Allegati del Viaggio (chiarezza UX; ownership distinta)

### Documenti coinvolti

DOC 28 Parte A (target) · DOC 34A (MySpace ≠ Workspace) · DOC 37 § Collaborazione  
*Parte B DOC 28 = fotografia runtime da migrare, non SoT di prodotto.*

### Rischi

| Rischio | Mitigazione |
|---------|-------------|
| Dual-mode WS (flat + shell) | Due entry UX chiare; stessa regola copie (accettato come estensione) |
| Sezioni vuote shell | Preferenza implementativa: slot lazy (non decisione di dominio) |
| Viste Mappa/Riepilogo su copie parziali | Atteso; non bloccare |

### Criteri di completamento

- [x] Nessun share del Viaggio originale
- [x] Share risorse = sempre copia (nuovo ID)
- [x] WS-da-Viaggio: selezione → copie → shell struttura DOC 37; sezioni non copiate = vuote
- [x] Legacy share Diario / Valigia / Template ancora funzionante
- [x] Delete MySpace ↛ delete copie WS (e viceversa) rispettato
- [x] Validazione PO finale (WF-08)

### Ordine

1. Hardening modello copie  
2. Wizard da Viaggio  
3. Shell hub  
4. Smoke collaborazione

### Esecuzione

| Campo | Valore |
|-------|--------|
| Workflow | **WF-08** — **Completato** (archiviato) |
| Path | `WORKFLOWS/_archive/WF_08_MP01_STEP4_COLLABORATION_ALIGNED.md` |
| Governance | Un solo STEP = MP-01 STEP-4; checklist interna; no STOP PO intermedi |

---

# STEP-5 — Ricordi · Allegati · Mappa · Riepilogo + chiusura

### Obiettivo

Completare patrimonio e viste del Viaggio; chiudere i gate di uscita prodotto (DOC 36 C5).

### Motivazioni

Chiude il modello DOC 37 senza riaprire il dominio; valorizza il patrimonio nel tempo.

### Dipendenze

- STEP-1–2 obbligatori  
- STEP-3 utile (POI Diario, periodo, geo da media)

### Aree codice (indicative)

- Media / storage Foto-Video → ownership sul Viaggio
- Struttura giorni Ricordi (periodo Viaggio **oppure** timeline Diario selezionato)
- Note per giorno (≠ note Diario ≠ annotazioni Riepilogo — glossario DOC 37)
- Allegati del Viaggio (Resource; ≠ allegati Workspace)
- Mappa: unione di tutto il geolocalizzato del Viaggio
- Riepilogo: vista calcolata + annotazioni leggere (non Resource CRUD)
- Root MySpace restanti (Preferiti / Esploratore / Strumenti / Inviti) e bridge Account — **solo quanto richiesto dal gate di uscita**, senza nuove Product Vision

### Documenti coinvolti

DOC 37 §§ Ricordi, Allegati, Mappa, Riepilogo · DOC 35 root · DOC 36 C5 · DOC 34A (AI non sezione)

### Rischi

| Rischio | Mitigazione |
|---------|-------------|
| Polisemìa “Note” | Naming UI da glossario DOC 37 |
| Qualità Mappa | Requisito prodotto (DOC 37); non stub eterno |
| Scope “tutti i diari” vs filtro | Default unione; filtri = UX |

### Criteri di completamento

- [x] Ricordi: Foto/Video/Note-giorno; due modalità struttura giorni
- [x] Allegati del Viaggio navigabili e distinti da allegati Workspace
- [x] Mappa: unione geo del Viaggio
- [x] Riepilogo: vista + annotazioni; non Resource CRUD peer
- [x] Stereotipi Resource / Library / View rispettati in UI; nessuna sezione AI
- [x] Gate prodotto: MySpace → Viaggio senza alias storico patrimonio=Diario
- [ ] Validazione PO finale (WF-09 Verifica PO)
- [ ] Documentazione MASTER aggiornata su evidenza codice (post-ACCETTO / quando certificata)

### Ordine

1. Ricordi  
2. Allegati  
3. Mappa  
4. Riepilogo  
5. Root restanti / Account bridge (gate)  
6. Gate chiusura MP-01

### Esecuzione

| Campo | Valore |
|-------|--------|
| Workflow | **WF-09** — Attivo — **In verifica PO** |
| Path | `WORKFLOWS/WF_09_MP01_STEP5_RICORDI_ALLEGATI_MAPPA_RIEPILOGO.md` |
| Governance | Un solo STEP = MP-01 STEP-5; checklist interna; no STOP PO intermedi |
| Chiusura programma | STEP-5 chiude MP-01; **no WF-10 automatico** — nuovo Masterplan o decisione PO |

---

## Fuori da MP-01 (esplicitamente)

- Nuove sezioni del Viaggio non presenti in DOC 37
- Desiderata WOW (Rivivere, Ricordami, …) salvo nuova decisione PO
- Ripresa o continuazione di **WF-04** (sospeso; archivio storico)
- Feature Flag collaborazione come toggle Centro di Controllo
- Promuovere Mappa / Riepilogo a Resource CRUD
- Condivisione del Viaggio originale

---

## Tracciamento Workflow

| STEP MP | Workflow | Stato |
|---------|----------|--------|
| 1 | WF-05 (`WORKFLOWS/_archive/WF_05_MP01_STEP1_VIAGGIO_PERSISTENCE.md`) | Completato (archiviato) |
| 2 | WF-06 (`WORKFLOWS/_archive/WF_06_MP01_STEP2_MYSPACE_VIAGGIO_CATALOG.md`) | Completato (archiviato) |
| 3 | WF-07 (`WORKFLOWS/_archive/WF_07_MP01_STEP3_VIAGGIO_OPERATIVE_RESOURCES.md`) | Completato (archiviato) |
| 4 | WF-08 (`WORKFLOWS/_archive/WF_08_MP01_STEP4_COLLABORATION_ALIGNED.md`) | Completato (archiviato) |
| 5 | WF-09 (`WORKFLOWS/WF_09_MP01_STEP5_RICORDI_ALLEGATI_MAPPA_RIEPILOGO.md`) | Attivo — In verifica PO |

Alla chiusura formale di WF-09: chiudere anche questo Masterplan. **Non esiste automaticamente un WF-10.** Lavori futuri → nuovo Masterplan o decisione PO.

Aprire l’esecuzione di WF-09 era consentita solo su ordine esplicito del PO (`Avvia WF-09`). Un Workflow = un solo STEP.

---

## Cronologia

| Versione | Data | Note |
|----------|------|------|
| 1.0.0 | 2026-07-26 | Masterplan iniziale 5 STEP post-freeze dominio |
| 1.1.0 | 2026-07-26 | Completezza: Allegati in STEP-5; AI non-sezione; PO-OV-002/WF-04; mappa dominio→STEP; DOC 28/31 Parte A |
| 1.1.1 | 2026-07-26 | STEP-1 Completato (WF-05); STEP-2 → WF-06 |
| 1.1.2 | 2026-07-26 | Governance Masterplan↔Workflow; tracciamento WF allineato |
| 1.1.3 | 2026-07-26 | STEP-2 implementato (WF-06) → In verifica PO; STEP-3 non aperto |
| 1.2.0 | 2026-07-26 | STEP-2 Completato (WF-06); STEP-3 → WF-07 Attivo |
| 1.2.1 | 2026-07-26 | STEP-3 implementato (WF-07) → In verifica PO; STEP-4 non aperto |
| 1.3.0 | 2026-07-26 | STEP-3 Completato (WF-07); STEP-4 → WF-08 (doc avvio; nessun codice) |
| 1.3.1 | 2026-07-27 | STEP-4 implementato (WF-08) → In verifica PO; STEP-5 / WF-09 non aperti |
| 1.4.0 | 2026-07-27 | STEP-4 Completato (WF-08 archiviato); STEP-5 → WF-09 (Pronto per implementazione) |
| 1.4.1 | 2026-07-27 | STEP-5 implementato (WF-09) → In verifica PO; nota chiusura MP-01 / no WF-10 |
