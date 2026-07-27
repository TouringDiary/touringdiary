# WF-09 — MP-01 STEP-5: Ricordi · Allegati · Mappa · Riepilogo + gate finale

> **Workflow esecutivo** — esegue **esclusivamente** lo **STEP-5** di MP-01.
> Masterplan → `AI_DEV_WORKFLOW/MASTERPLANS/MP_01_VIAGGIO_DOMAIN_IMPLEMENTATION.md` § STEP-5.
> SoT dominio → `AI_CONTEXT/34A_DOMAIN_DESIGN_RULES.md` · `AI_CONTEXT/37_VIAGGIO_DOMAIN.md` §§ Ricordi, Allegati, Mappa, Riepilogo.
> Visione / capacità → `AI_CONTEXT/35_MYSPACE_PRODUCT_VISION.md` · `AI_CONTEXT/36_MYSPACE_PRODUCT_MASTERPLAN.md` **C5**.
> Prerequisito chiuso → `WORKFLOWS/_archive/WF_08_MP01_STEP4_COLLABORATION_ALIGNED.md` (MP-01 STEP-4 Completato).
>
> **Governance:** lo STEP ufficiale è **MP-01 STEP-5**. Non esistono STEP WF intermedi.
> Checklist / batch tecnici = piano operativo interno (non unità di avanzamento, non STOP PO).
>
> **Non** riprende WF-04 (Sospeso — PO-OV-002).  
> **Non** riapre il dominio (DOC 34A / 37 congelati).  
> Autorizzazione PO ad avviare Sviluppo ricevuta via `Avvia WF-09` (2026-07-27).
>
> ### Chiusura programma MP-01
>
> **MP-01 termina con lo STEP-5.** Al completamento di WF-09 dovrà essere chiuso anche il Masterplan MP-01.  
> **Non esiste automaticamente un WF-10.** Eventuali lavori futuri nasceranno da un **nuovo Masterplan** oppure da una **nuova decisione del PO**.  
> Obiettivo: rendere esplicita la chiusura del programma di implementazione del dominio Viaggio.

---

## Metadati

| Campo | Valore |
|-------|--------|
| **ID** | WF-09 |
| **Nome** | MP-01 STEP-5 — Ricordi · Allegati · Mappa · Riepilogo + gate finale |
| **Stato Workflow** | **Attivo** |
| **Masterplan** | `MASTERPLANS/MP_01_VIAGGIO_DOMAIN_IMPLEMENTATION.md` — **STEP-5** |
| **SSOT dominio** | DOC 34A · DOC 37 §§ Ricordi / Allegati / Mappa / Riepilogo · DOC 35 · DOC 36 **C5** |
| **Owner** | PO + AI |
| **Creato** | 2026-07-27 |
| **Ultimo aggiornamento** | 2026-07-27 |
| **Aggiornato da** | AI — implementazione continua STEP-5 → Verifica PO |
| **Capacità prodotto** | DOC 36 **C5** |
| **Workflow precedenti** | WF-08 Completato (archiviato) · WF-07…WF-05 Completati |
| **Workflow successivi MP-01** | Nessuno — STEP-5 chiude MP-01 (no WF-10 automatico) |

---

## Stato avanzamento (ricostruzione rapida)

| Campo | Valore corrente |
|-------|-----------------|
| **Workflow** | WF-09 — **Attivo** |
| **STEP** | **MP-01 STEP-5** — Ricordi · Allegati · Mappa · Riepilogo + gate finale |
| **Fase** | **In verifica PO** |
| **% convenzionale** | 90 % |
| **Progresso operativo interno** | T1…T8 eseguiti; smoke `viaggio:step5:smoke` OK |
| **Codice applicativo** | Ricordi · Allegati · Mappa · Riepilogo; stereotipi nav; gate MySpace→Viaggio |

**Prompt ripresa (chiusura):** review PO / `ACCETTO` sui deliverable STEP-5  
**Attesa:** unica approvazione formale di chiusura (Verifica PO). Alla chiusura: chiudere anche MP-01; **non** aprire WF-10 automaticamente.

---

## Obiettivo

Completare patrimonio e viste del Viaggio (Ricordi, Allegati, Mappa, Riepilogo) e chiudere i gate di uscita prodotto (DOC 36 C5 / MP-01).

Risultato atteso (criteri MP-01 STEP-5 / DOC 36 C5): Ricordi (Foto/Video/Note-giorno; due modalità struttura giorni); Allegati del Viaggio navigabili e distinti da allegati Workspace; Mappa = unione geo del Viaggio; Riepilogo = vista + annotazioni leggere (non Resource CRUD); stereotipi Resource / Library / View rispettati; nessuna sezione AI; gate MySpace → Viaggio senza alias storico patrimonio=Diario.

---

## Motivazione

- STEP-1…4 hanno reso persistente il Viaggio, catalogo/cartella MySpace, risorse operative e collaborazione allineata.
- Restano patrimonio (Ricordi, Allegati) e viste (Mappa, Riepilogo) più il gate di chiusura MP-01.
- WF-04 resta sospeso; questo WF non lo riprende.

---

## Governance di questo Workflow

| Regola | Applicazione |
|--------|--------------|
| Unità di avanzamento | Solo **MP-01 STEP-5** |
| Fasi ufficiali | Analisi → Pronto → Sviluppo → Review → Test → **Verifica PO** |
| Checklist / batch tecnici | Piano operativo interno; **non** richiedono approvazione PO |
| STOP intermedi | **Non previsti** — esecuzione lineare dell’intero STEP-5, poi Verifica PO |
| Approvazione PO avvio codice | Ricevuta via `Avvia WF-09` (2026-07-27) |
| Approvazione PO chiusura | Solo in **Verifica PO** |
| Interruzione in Sviluppo | Solo: decisione architetturale non coperta · modifica SSOT · alternative equivalenti PO · blocco tecnico reale |

---

## Modalità di esecuzione dello STEP

1. **MP-01 STEP-5** = singola unità di lavoro ufficiale.
2. Le checklist **T1…T8** sono solo organizzazione interna.
3. Esecuzione continua dopo `Avvia WF-09` fino a Verifica PO.
4. **Non** creati stop artificiali tra T*.
5. Interruzione solo nei casi già previsti dalla governance — nessuno in questa esecuzione.

---

## Confini

### Incluso

| # | Incluso | Stato |
|---|---------|-------|
| I1 | Ricordi: Foto / Video / Note-giorno; due modalità struttura giorni | ☑ |
| I2 | Allegati del Viaggio navigabili; ownership ≠ allegati Workspace | ☑ |
| I3 | Mappa: unione di tutto il geolocalizzato del Viaggio | ☑ |
| I4 | Riepilogo: vista calcolata + annotazioni leggere (non Resource CRUD) | ☑ |
| I5 | Stereotipi Resource / Library / View rispettati in UI; nessuna sezione AI | ☑ |
| I6 | Gate prodotto: MySpace → Viaggio senza alias storico patrimonio=Diario | ☑ |
| I7 | Root MySpace restanti / bridge Account — solo quanto richiesto dal gate di uscita | ☑ (root DOC 35 presenti; Account dual-entry documentato) |
| I8 | Documentazione operativa aggiornata su evidenza codice | ☑ (WF / status / MP-01; MASTER = valutare post-ACCETTO) |
| I9 | Smoke / verifica gate chiusura MP-01 | ☑ `npm run viaggio:step5:smoke` |

### Escluso (esplicitamente)

| # | Escluso | Dove vive |
|---|---------|-----------|
| E1 | Nuove sezioni dominio / nuova Product Vision | Vietato |
| E2 | Desiderata WOW (Rivivere, Ricordami, …) salvo nuova decisione PO | Fuori MP-01 |
| E3 | Ripresa WF-04 | Vietato |
| E4 | Promuovere Mappa / Riepilogo a Resource CRUD | Vietato (dominio) |
| E5 | Condivisione del Viaggio originale | Vietato (dominio) |
| E6 | Preferiti / Esploratore / Strumenti profondi oltre gate uscita | DOC 36 oltre C5 / nuovo Masterplan |
| E7 | Riapertura collaborazione STEP-4 / schema fondazione salvo bug bloccante STEP-5 | STEP-1…4 chiusi |
| E8 | WF-10 automatico | Vietato — nuovo Masterplan o decisione PO |

---

## Prerequisiti

| Prerequisito | Stato | Nota |
|--------------|-------|------|
| MP-01 STEP-5 letto | ☑ | |
| DOC 34A / 37 / 35 / 36 C5 | ☑ | Congelati / target |
| WF-08 Completato (STEP-4) | ☑ | Archiviato |
| WF-04 non ripreso | ☑ | PO-OV-002 |
| `06_CHANGE_IMPACT_RULES.md` prima del codice | ☑ | Dichiarato in T1 |
| Autorizzazione PO ad avviare Sviluppo | ☑ | `Avvia WF-09` 2026-07-27 |

---

## Gate tracciati

| Gate | Dove definito | Stato | Evidenza |
|------|---------------|-------|----------|
| Criteri completamento MP-01 STEP-5 | MP-01 § STEP-5 | ☑ implementativi | Checklist Gate uscita |
| DOC 36 C5 | DOC 36 | ☑ implementativo | Patrimonio + viste |
| Dominio non riaperto | DOC 34A / 37 | ☑ | Nessuna modifica SSOT |
| Gate chiusura MP-01 | MP-01 / DOC 36 | ☐ | Dopo ACCETTO PO + chiusura Masterplan |
| Verifica PO finale STEP-5 | Chiusura WF-09 | ☐ | **In corso** |

### Gate uscita WF-09 (= MP-01 STEP-5)

- [x] Ricordi: Foto/Video/Note-giorno; due modalità struttura giorni
- [x] Allegati del Viaggio navigabili e distinti da allegati Workspace
- [x] Mappa: unione geo del Viaggio
- [x] Riepilogo: vista + annotazioni; non Resource CRUD peer
- [x] Stereotipi Resource / Library / View rispettati in UI; nessuna sezione AI
- [x] Gate prodotto: MySpace → Viaggio senza alias storico patrimonio=Diario
- [x] Smoke `viaggio:step5:smoke` OK
- [ ] **Validazione PO finale** (unica)
- [ ] Chiusura formale Masterplan MP-01 (dopo ACCETTO)

---

## Dichiarazione impatto (DOC 06) — T1

| Campo | Valore |
|-------|--------|
| **Problema** | Completare Ricordi · Allegati · Mappa · Riepilogo e chiudere gate MP-01 (DOC 36 C5) |
| **Impattato** | Cartella MySpace Viaggio; servizi `viaggio/*`; schema Supabase STEP-5; storage buckets privati; smoke |
| **Non impattato** | Stripe, packing core, collaborazione STEP-4 (salvo shell nav condivisa), community photoService, SSOT dominio |
| **Nuove decisioni di dominio** | Nessuna |
| **Modifica SSOT** | Nessuna |

---

## Checklist operativa interna (ordine consigliato)

> **Non** sono STEP di workflow. **Non** richiedono approvazione PO.

| Voce | Contenuto | Criterio | Stato |
|------|-----------|----------|-------|
| **T1** | Lettura `06_CHANGE_IMPACT_RULES` + mappa codice Ricordi/Allegati/Mappa/Riepilogo | Impatto chiaro | ☑ |
| **T2** | Ricordi: Foto/Video/Note-giorno; struttura giorni (due modalità) | Patrimonio media | ☑ |
| **T3** | Allegati del Viaggio (Resource; ≠ Workspace) | Navigabili | ☑ |
| **T4** | Mappa: unione geo del Viaggio | View coerente | ☑ |
| **T5** | Riepilogo: vista + annotazioni leggere | Non Resource CRUD | ☑ |
| **T6** | Stereotipi UI + gate MySpace→Viaggio (no alias Diario) | Gate prodotto | ☑ |
| **T7** | Root restanti / Account bridge (solo gate) + smoke chiusura | Gate MP-01 praticabile | ☑ |
| **T8** | Aggiornamento status/roadmap/MP-01 → Verifica PO | Doc chiusura | ☑ |

---

# STEP — MP-01 STEP-5 — Ricordi · Allegati · Mappa · Riepilogo + gate finale

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Completare i criteri di MP-01 STEP-5 e chiudere i gate di uscita prodotto |
| **Stato STEP** | **Attivo** — implementato; **In verifica PO** |
| **DoD STEP** | Gate uscita WF-09 (implementativi ☑); checklist T1…T8 ☑; **Verifica PO** ☐ |

### Fasi

| Fase | Stato | Inizio | Fine | PO ✓ |
|------|-------|--------|------|------|
| Analisi | Completata | 2026-07-27 | 2026-07-27 | ☑ |
| Pronto per implementazione | Completata | 2026-07-27 | 2026-07-27 | ☑ (`Avvia WF-09`) |
| Sviluppo | Completata | 2026-07-27 | 2026-07-27 | — |
| Review tecnica | Completata | 2026-07-27 | 2026-07-27 | — |
| Test | Completata | 2026-07-27 | 2026-07-27 | — smoke OK |
| Verifica PO | **In corso** | 2026-07-27 | | ☐ |

### Deliverable tecnici (sintesi)

| Area | Deliverable |
|------|-------------|
| Schema | `viaggio_ricordi_media` · `viaggio_ricordi_day_notes` · `viaggio_attachments` · `viaggio_riepilogo_annotations` + buckets |
| Ricordi | `viaggioRicordiService` + day structure · `ViaggioRicordiSection` (due modalità) |
| Allegati | `viaggioAttachmentService` · `ViaggioAllegatiSection` + nota ownership ≠ WS |
| Mappa | `viaggioMappaUnion` / `listViaggioMapPins` · `ViaggioMappaSection` (View) |
| Riepilogo | `computeViaggioRiepilogo` + annotazioni · `ViaggioRiepilogoSection` (View) |
| Stereotipi | `stereotype` su `VIAGGIO_FOLDER_SECTIONS`; `data-stereotype` sezioni; no AI |
| Smoke | `npm run viaggio:step5:smoke` |

---

## Log decisioni operative

| Data | Decisione | Chi |
|------|-----------|-----|
| 2026-07-27 | Chiusura WF-08; apertura documentale WF-09; nota chiusura programma MP-01 (no WF-10 auto) | PO |
| 2026-07-27 | `Avvia WF-09` — esecuzione continua T1…T8 → Verifica PO | PO |
| 2026-07-27 | Mappa = View aggregata (lista pin + dettaglio + Maps esterno); canvas libreria mappa deferito senza stub eterno di dati | AI |
| 2026-07-27 | Root Preferiti/Esploratore/… restano a profondità visione (placeholder DOC 35); gate C5 = stereotipi + MySpace→Viaggio | AI |
| 2026-07-27 | Allineamento `src/types/supabase.ts` alle 4 tabelle STEP-5; trigger `set_viaggio_updated_at`; CHECK trim su path/mime/day_key | AI |

*Decisioni di dominio → DOC 34A / 37 / 35 / 36. Non riaprire Vision.*

---

## Review tecnica (sintesi)

- Nessuna contraddizione SSOT rilevata; nessun blocco tecnico.
- Allegati Viaggio e Workspace restano tabelle/bucket distinti.
- Mappa / Riepilogo esposti come View (`data-stereotype="View"`); annotazioni Riepilogo non promuovono Resource CRUD.
- Tipi Supabase: 4 tabelle STEP-5 aggiunte a `src/types/supabase.ts` (causa reale degli errori TS — tabelle assenti dal Database typing).
- Migration: `set_viaggio_updated_at` + CHECK `length(trim(...)) > 0` su day_key / storage_path / mime_type / file_name; RLS owner-only invariata (coerente MySpace personale; Workspace resta su copie/entry separate).
- Lint/TS STEP-5: nessun errore residuo sui service Resource/View STEP-5; errori TS residui del progetto sono preesistenti (admin/ranking/dataService/photos).
- Smoke `viaggio:step5:smoke` OK.

---

## Criticità note

| Criticità | Impatto | Nota |
|-----------|---------|------|
| Mappa senza canvas libreria dedicata | Basso–medio | Unione dati reale + dettaglio pin + open Maps; canvas interattivo = depth futura |
| Preferiti / Esploratore / Strumenti profondi | Fuori gate minimo | Root presenti; profondità = nuovo Masterplan / decisione PO |
| Errori TS preesistenti fuori STEP-5 | Fuori scope | `dataService` deep instantiation, ranking RPC, admin POI, photos — non introdotti da WF-09 |

---

## Chiusura Workflow

| Campo | Valore |
|-------|--------|
| **Data chiusura** | |
| **Validazione PO finale** | **In attesa** |
| **Gate MP-01 STEP-5** | ☐ (implementativi ☑) |
| **Gate chiusura MP-01** | ☐ (dopo ACCETTO + chiusura Masterplan) |
| **Archiviato in** | `WORKFLOWS/_archive/` (dopo ACCETTO PO) |
| **Successivo** | Chiusura MP-01 — **nessun WF-10 automatico** |

**Report operativo obbligatorio** → `00_DEVELOPMENT_PROTOCOL.md` §15.

---

## Cronologia stato

| Data | STEP | Fase | Stato | Nota |
|------|------|------|-------|------|
| 2026-07-27 | — | — | Non iniziato | File creato |
| 2026-07-27 | MP-01 STEP-5 | Pronto per implementazione | Aperto | Doc avvio; attesa `Avvia WF-09` |
| 2026-07-27 | MP-01 STEP-5 | Sviluppo → Review → Test | Attivo | Esecuzione continua T1…T8 |
| 2026-07-27 | MP-01 STEP-5 | **In verifica PO** | Attivo | Smoke OK; MP-01 da chiudere post-ACCETTO |
