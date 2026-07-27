# WF-05 — MP-01 STEP-1: Fondazione persistenza Viaggio / Diario

> **Workflow esecutivo** — esegue **esclusivamente** lo **STEP-1** di MP-01.
> Masterplan → `AI_DEV_WORKFLOW/MASTERPLANS/MP_01_VIAGGIO_DOMAIN_IMPLEMENTATION.md` § STEP-1.
> SoT dominio → `AI_CONTEXT/34A_DOMAIN_DESIGN_RULES.md` · `AI_CONTEXT/37_VIAGGIO_DOMAIN.md`.
> Confine visione → `AI_CONTEXT/35_MYSPACE_PRODUCT_VISION.md` (solo confini; non catalogo MySpace).
>
> **Governance:** lo STEP ufficiale è **MP-01 STEP-1**. Non esistono STEP WF intermedi.
> Batch B1…B6 / C1…C3 = checklist operativa interna (non unità di avanzamento, non STOP PO).
>
> **Archiviato** in `WORKFLOWS/_archive/` — 2026-07-26.  
> **Non** eseguire. Storico ufficiale di MP-01 STEP-1.
>
> **Non** esegue MP-01 STEP-2…5.  
> **Non** riprende WF-04 (Sospeso — PO-OV-002).  
> Successore esecutivo STEP-2 → `WORKFLOWS/WF_06_MP01_STEP2_MYSPACE_VIAGGIO_CATALOG.md`.

---

## Metadati

| Campo | Valore |
|-------|--------|
| **ID** | WF-05 |
| **Nome** | MP-01 STEP-1 — Fondazione persistenza Viaggio / Diario |
| **Stato Workflow** | **Completato** |
| **Masterplan** | `MASTERPLANS/MP_01_VIAGGIO_DOMAIN_IMPLEMENTATION.md` — **STEP-1** |
| **SSOT dominio** | DOC 34A · DOC 37 · DOC 35 (confine) |
| **Owner** | PO + AI |
| **Creato** | 2026-07-26 |
| **Ultimo aggiornamento** | 2026-07-26 |
| **Aggiornato da** | PO — STEP-1 approvato; chiusura formale + archiviazione |
| **Capacità prodotto** | DOC 36 **C1** |
| **Workflow successivi MP-01** | **WF-06** (STEP-2) — aperto post-chiusura |

---

## Stato avanzamento (ricostruzione rapida)

| Campo | Valore corrente |
|-------|-----------------|
| **Workflow** | WF-05 — **Completato** (archiviato) |
| **STEP** | **MP-01 STEP-1** — Fondazione persistenza Viaggio / Diario |
| **Fase** | **Completata** (Verifica PO ☑) |
| **% convenzionale** | 100 % |
| **Progresso operativo interno** | Checklist B1…B6 + C1…C3 **completata** |
| **Codice applicativo** | M1+M2+M3 · tipi · `viaggioService` · `itineraryService` · Context · smoke · lettori minimi |

**Baseline tecnica:** Specifica ST-0…ST-9 (PO 2026-07-26).

**Chiusura:** PO 2026-07-26 — gate MP-01 STEP-1 soddisfatto.

---

## Obiettivo

Introdurre il **Viaggio** come Aggregate Root **persistente** e scollegare l’identità del patrimonio dal Diario, secondo i criteri di completamento di **MP-01 STEP-1**.

Risultato atteso: esiste un’entità Viaggio con metadati propri; il Diario è risorsa collegata (0..N) con Diario attivo modellato (no auto-promote); empty Viaggio ammesso nei dati; nessun nuovo codice assume patrimonio = Diario / `itineraries`.

---

## Motivazione

- Dominio congelato (DOC 34A / 37); MP-01 è il piano ufficiale di implementazione (5 STEP).
- As-is: UI «Viaggio» ≡ `itineraries.id` (`type='personal'`) — debito da eliminare ora.
- WF-03 chiuso; WF-04 sospeso.
- Catalogo MySpace, Valigia→Viaggio, Roadbook library, WS, Ricordi = STEP successivi MP-01.

---

## Governance di questo Workflow

| Regola | Applicazione |
|--------|--------------|
| Unità di avanzamento | Solo **MP-01 STEP-1** (questo WF = esecuzione di quello STEP) |
| Fasi ufficiali | Analisi → Pronto → Sviluppo → Review → Test → **Verifica PO** (unica approvazione formale) |
| Checklist B1…B6 / C1…C3 | Piano operativo interno; ordine consigliato; **non** richiedono approvazione PO per batch |
| STOP intermedi | **Eliminati** — lo STEP si esegue integralmente, poi Verifica PO |
| Approvazione PO | Solo in chiusura STEP / gate uscita WF-05 (= MP-01 STEP-1) |

---

## Confini

### Incluso

| # | Incluso |
|---|---------|
| I1 | Modello dati / invarianti Viaggio + relazione Diario (0..N) + Diario attivo |
| I2 | Metadati identità sul Viaggio (titolo, destinazione, periodo, copertina, owner) |
| I3 | Empty Viaggio ammesso a livello dati |
| I4 | Delete Diario attivo senza auto-promote |
| I5 | Servizi di dominio minimi Viaggio + collegamento Diari |
| I6 | Adattamento **minimo** lettori critici (Home / save) |
| I7 | Anti–alias storico nel codice nuovo |
| I8 | Cutover dati personali cloud (+ regola guest) |

### Escluso (esplicitamente)

| # | Escluso | Dove vive |
|---|---------|-----------|
| E1 | Catalogo «I miei Viaggi» MySpace / cartella / breadcrumb cartella | MP-01 STEP-2 |
| E2 | UI multi-diario completa / Valigia-viaggio / Roadbook library | MP-01 STEP-3 |
| E3 | Collaborazione / WS-da-Viaggio / rewrite share | MP-01 STEP-4 |
| E4 | Ricordi · Allegati · Mappa · Riepilogo | MP-01 STEP-5 |
| E5 | Preferiti / Esploratore / Strumenti profondi | DOC 36 C5 |
| E6 | Nuove sezioni dominio / nuova Product Vision | Vietato |
| E7 | Ripresa WF-04 | Vietato |
| E8 | Migrazione FK `itinerary_suitcases` → Viaggio | MP-01 STEP-3 |
| E9 | Cambiare `shared_resources.resource_id` dei diary esistenti | Vietato in STEP-1 (stabilità id Diario) |

---

## Prerequisiti

| Prerequisito | Stato | Nota |
|--------------|-------|------|
| MP-01 STEP-1 letto | ☑ | |
| DOC 34A / DOC 37 congelati | ☑ | |
| WF-03 Completato | ☑ | |
| WF-04 non ripreso | ☑ | PO-OV-002 |
| Specifica tecnica ST-0…ST-9 | ☑ | Approvata PO 2026-07-26 |
| `06_CHANGE_IMPACT_RULES.md` prima del codice applicativo | ☑ | Applicato in Sviluppo |

---

## Gate tracciati

| Gate | Dove definito | Stato | Evidenza |
|------|---------------|-------|----------|
| Criteri completamento MP-01 STEP-1 | MP-01 § STEP-1 | ☑ | PO 2026-07-26 |
| Dominio non riaperto | DOC 34A / 37 | ☑ | |
| Nessun anticipo MP-01 STEP-2…5 | Confini E* | ☑ | Nessun catalogo MySpace / packing migrate / collab rewrite |
| Specifica tecnica → implementazione | ST-0…ST-9 | ☑ | PO 2026-07-26 |
| Verifica PO finale STEP-1 | Chiusura WF-05 | ☑ | PO 2026-07-26 |

### Gate uscita WF-05 (= MP-01 STEP-1)

- [x] Entità Viaggio con metadati propri (titolo, destinazione, periodo, copertina, owner) — tabella `viaggi` + service
- [x] Diario risorsa collegata (0..N); non identità del Viaggio — `itineraries.viaggio_id` + `Itinerary.viaggioId`
- [x] Empty Viaggio ammesso (dati) — `createEmptyViaggio` / `active_diary_id` NULL
- [x] Diario attivo modellato; delete attivo senza auto-promote — FK SET NULL + `clearActiveDiary`
- [x] Nessun nuovo codice assume patrimonio = Diario / `itineraries` — Context `activeViaggioId`; anti-alias UI

---

# SPECIFICA TECNICA CONGELATA (baseline MP-01 STEP-1)

> **Stato:** **APPROVATA dal PO (2026-07-26)** — baseline ufficiale STEP-1.  
> Implementazione tramite checklist operativa interna (B1…B6, C1…C3); **nessun STOP PO** tra voci della checklist.

---

## ST-0. As-is verificato (fatti)

```text
UI "Viaggio" / UserTripsTab / packing "trip" / share kind=diary
        │
        ▼
itineraries.id   (type = 'personal')     ← unica identità patrimonio oggi
        │
        ├── items_json = { items, startDate, endDate, dayStyles, diaryNotes, roadbook }
        ├── title, cover_image (cover spesso null sui personal save)
        ├── itinerary_suitcases.itinerary_id → suitcases
        └── shared_resources.resource_id (kind='diary')
```

| Fatto | Evidenza |
|-------|----------|
| Nessuna tabella Viaggio / `tripId` | Schema + `src/` |
| Date viaggio nel Diario | `items_json.startDate` / `endDate` via `saveUserDraft` |
| Catalogo Account = lista diari | `UserTripsTab` ← `savedProjects` |
| MySpace «I miei Viaggi» | Solo placeholder shell (WF-03) |
| Collab diary id = `itineraries.id` | `shared_resources` + RLS phase6 |

---

## ST-1. Modello dati definitivo Viaggio ↔ Diario

### Principi (da DOC 37 — non negoziabili)

1. **Viaggio** = Aggregate Root; metadati di identità sul Viaggio.  
2. **Diario** = Resource; corpo narrativo resta su `itineraries` (+ `items_json`).  
3. Cardinalità **0..N** Diari per Viaggio; al più un **Diario attivo**.  
4. Delete Diario attivo → `active_diary_id = NULL` (**no auto-promote**).  
5. Empty Viaggio ammesso (`viaggio_id` assente su diari; zero righe diary).  
6. **Stabilità id Diario:** `itineraries.id` **non** cambia al cutover (preserva packing + collab).

### Diagramma target

```text
viaggi (NEW)                          itineraries (EXISTING, estesa)
─────────────                         ─────────────────────────────
id (PK)                               id (PK)  ← STABILE (Diario)
user_id                               user_id
title                                 title          (nome Diario; può ≠ title Viaggio)
destination                           type           ('personal' | …)
period_start / period_end             status
cover_image                           items_json     (corpo Diario — INVARIATO strutturalmente)
active_diary_id → itineraries.id      viaggio_id → viaggi.id   (NEW, NULL per non-personal)
metadata jsonb                        …
created_at / updated_at
```

### Tabella `public.viaggi` (NEW)

| Colonna | Tipo | Vincoli | Note |
|---------|------|---------|------|
| `id` | `uuid` | PK, `gen_random_uuid()` | |
| `user_id` | `uuid` | NOT NULL → `profiles` | Owner patrimonio |
| `title` | `text` | NOT NULL | Identità |
| `destination` | `text` | NULL | Label libera in STEP-1 (geo strutturato = futuro) |
| `period_start` | `date` | NULL | |
| `period_end` | `date` | NULL | |
| `cover_image` | `text` | NULL | |
| `active_diary_id` | `uuid` | NULL → `itineraries(id)` **ON DELETE SET NULL** | Diario attivo |
| `metadata` | `jsonb` | NOT NULL DEFAULT `{}` | Estensioni opzionali — non campi funzionali di dominio |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` | |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT `now()` | Trigger auto-update: follow-up in Sviluppo se assente |

Indici: `(user_id)`, `(user_id, created_at DESC)`, `(active_diary_id)` dove not null.

### Alter `public.itineraries`

| Colonna | Tipo | Vincoli | Note |
|---------|------|---------|------|
| `viaggio_id` | `uuid` | NULL → `viaggi(id)` **ON DELETE CASCADE** | Solo diari personali post-cutover; CASCADE = delete Viaggio elimina suoi Diari |

Indice: `(viaggio_id)` dove not null.

**Invarianti applicative / trigger consigliato:**

- Se `type = 'personal'` e riga persistita cloud post-cutover → `viaggio_id` NOT NULL (eccetto finestra migrazione).  
- Se `active_diary_id` valorizzato → quel diario ha `viaggio_id = viaggi.id` e `type = 'personal'`.  
- Tipi `official` / `community` / `ai` → `viaggio_id` sempre NULL.

### Ownership

| Entità | Owner |
|--------|--------|
| `viaggi` | `viaggi.user_id` |
| Diario personale | `itineraries.user_id` (= owner Viaggio in STEP-1; collab resta su diary id) |
| Packing link | resta su `itinerary_suitcases.itinerary_id` (Diario) fino a MP-01 STEP-3 |
| Share diary | resta `shared_resources.kind='diary'` + `resource_id = itineraries.id` |

### RLS (direzione)

- `viaggi`: owner CRUD (`auth.uid() = user_id`).  
- Nessuna policy collab su `viaggi` in STEP-1 (Viaggio originale non si condivide — DOC 28/34A).  
- Policy esistenti su `itineraries` (owner + collab diary) **restano**; non riscrivere collab in STEP-1.

---

## ST-2. Campi che migrano dall’attuale modello

Per ogni riga `itineraries` con `type = 'personal'` e `user_id` not null:

| Campo target `viaggi` | Sorgente as-is |
|-----------------------|----------------|
| `title` | `itineraries.title` (fallback `'Viaggio'` se vuoto) |
| `destination` | Heuristica: `main_city` se utile, altrimenti NULL (STEP-1) |
| `period_start` | `items_json.startDate` (se stringa data valida) |
| `period_end` | `items_json.endDate` |
| `cover_image` | `itineraries.cover_image` |
| `user_id` | `itineraries.user_id` |
| `active_diary_id` | `itineraries.id` (1:1 iniziale) |
| `itineraries.viaggio_id` | nuovo `viaggi.id` |

**Restano sul Diario (non migrano via):** contenuto `items_json` (items, dayStyles, diaryNotes, roadbook), `last_modified_by`, link packing, share.

**Nota:** le date restano anche nel Diario (timeline). Sul Viaggio sono metadati di patrimonio (DOC 37). Possibile divergenza futura se multi-diario — accettata; STEP-1 copia iniziale allineata.

---

## ST-3. Migration necessarie

| # | Migration (nome proposto) | Contenuto |
|---|---------------------------|-----------|
| M1 | `YYYYMMDDHHMMSS_create_viaggi.sql` | CREATE `viaggi` + indici + RLS owner + grant |
| M2 | `YYYYMMDDHHMMSS_itineraries_viaggio_id.sql` | ADD `viaggio_id` FK + indice |
| M3 | `YYYYMMDDHHMMSS_cutover_personal_itineraries_to_viaggi.sql` | Backfill: 1 Viaggio per ogni personal diary; set `viaggio_id` + `active_diary_id` |

Opzionale stessa release: trigger/check `active_diary` appartiene al Viaggio.  
**Tipi TypeScript:** rigenerare / aggiornare `src/types/supabase.ts` dopo M1–M2.

---

## ST-4. Strategia di cutover

### Cloud (registered)

1. Deploy M1 → M2 (schema vuoto).  
2. Deploy M3 (backfill idempotente):  
   - per ogni personal senza `viaggio_id` → INSERT `viaggi` + UPDATE diary.  
3. Deploy codice servizi che **richiedono** `viaggio_id` sui nuovi save.  
4. Verifica: count personal = count con `viaggio_id`; ogni `viaggi` ha `active_diary_id` puntato correttamente **oppure** (futuro) empty senza diary.

**Prodotto non online:** preferire cutover completo in una finestra; niente dual-write prolungato.

### Guest (LocalStorage)

- Chiave attuale: `saved_itineraries` (`itineraryStorageManager`).  
- **STEP-1:** al primo save cloud, creare sempre coppia Viaggio+Diario.  
- In LS guest: opzionale `viaggioId` sintetico locale; **non** obbligatorio riscrivere tutto il guest in STEP-1 se il cloud path è corretto.  
- **Congelato:** guest può restare diary-list in LS; sync cloud materializza Viaggio.

### Delete

| Azione | Comportamento STEP-1 |
|--------|----------------------|
| Delete Diario (non unico / non attivo) | DELETE itinerary; se era `active_diary_id` → SET NULL (FK ON DELETE SET NULL) |
| Delete Diario attivo | `active_diary_id` NULL; **nessun** altro diario promosso |
| Delete Viaggio | CASCADE diari personali di quel Viaggio; packing pivot segue CASCADE diary; **copie WS invariate** (id diversi) |

---

## ST-5. Servizi da modificare / creare

| Servizio | Azione STEP-1 |
|----------|---------------|
| **NEW** `src/services/viaggio/viaggioService.ts` (o `src/services/community/viaggioService.ts`) | CRUD Viaggio; set/clear active diary; list by user; create empty |
| `src/services/community/itineraryService.ts` | `saveUserDraft`: assicurare `viaggio_id` (create Viaggio se assente); `getUserDrafts` / map: includere `viaggio_id`; non rompere unpack `items_json` |
| `src/services/itineraryStorageManager.ts` | Cloud path consapevole del Viaggio; guest: regola ST-4 |
| `src/services/suitcase/suitcaseLinkingService.ts` | **NON migrare FK**; resta su diary id (compat) |
| Collaboration services | **NON** cambiare resource_id model in STEP-1 |

---

## ST-6. Context, hook, componenti coinvolti

### Da adattare (minimo)

| File | Perché |
|------|--------|
| `src/types/models/Itinerary.ts` (+ eventuale **NEW** `Viaggio.ts`) | Tipo Viaggio; `Itinerary.viaggioId` |
| `src/types/supabase.ts` | Generato/aggiornato post-migration |
| `src/context/ItineraryContext.tsx` | Tenere `activeViaggioId` (o equivalente); `savedProjects` resta lista Diari accessibili ma **non** è più Aggregate Root; API create/save che creano Viaggio |
| `src/hooks/save/useDiaryDocumentSave.ts` | Save passa da path che garantisce Viaggio |
| `src/hooks/useDiaryLogic.ts` | Solo se necessario al save/load |
| `src/components/features/diary/TravelDiary.tsx` | Compat: editor Diario; non catalogo |
| `src/components/user/dashboard/UserTripsTab.tsx` | **Touch minimo:** continua a listare diari/progetti ma copy/commenti interni non devono affermare Diario≡Viaggio; UI catalogo ricca = STEP-2 |

### Compatibilità temporanea (ammessa in STEP-1)

| Pattern | Regola |
|---------|--------|
| `savedProjects` = lista Diari | OK fino a STEP-2; ogni diary personale ha `viaggioId` |
| Packing `itinerary_suitcases` | Resta su diary id |
| Share `kind=diary` | Resta su diary id |
| UserTripsTab «I Miei Viaggi» | Può ancora aprire diari; **non** implementare cartella MySpace |
| Home / sidebar apre TravelDiary | OK; patrimonio = Viaggio padre in context |

### Punti di rottura da evitare

1. Rinominare/rigenerare UUID dei diari esistenti → rompe share + packing.  
2. Mettere collab ACL su `viaggi` in STEP-1.  
3. Migrare `itinerary_suitcases` a `viaggio_id` in STEP-1.  
4. Costruire catalogo MySpace / cartella (STEP-2).  
5. Dual-write infinito senza cutover (prodotto offline → cutover netto).  
6. Auto-promote Diario attivo.  
7. Riaprire Vision / aggiungere sezioni DOC 37.

---

## ST-7. File che NON devono essere modificati (STEP-1)

| Area | Path / glob |
|------|-------------|
| MySpace / MyWorld UI | `src/myspace/**`, `src/components/myspace/**`, `src/components/myworld/**`, `src/hooks/useOpenMyWorld.ts`, `src/myworld/**` |
| Collaboration rewrite | `src/services/collaboration/**` (salvo bugfix bloccante non legato a Viaggio), `CollaborationShareModal.tsx` |
| Packing migrate | redesign `suitcaseLinkingService` / panel association beyond keep-alive |
| Admin itinerary catalog | `ItineraryManager`, explorer ufficiale — no rewrite |
| WF-04 / MP-01 file | Non modificare Masterplan; non riprendere WF-04 |
| SSOT dominio 34A/37/35 | Non modificare in questo STEP |
| Ricordi / media / mappe | Qualsiasi nuovo dominio memoria |

---

## ST-8. Checklist operativa interna (ordine consigliato)

> **Non** sono STEP di workflow. **Non** richiedono approvazione PO.  
> Ordine consigliato per ridurre rischio; lo STEP avanza solo alle **Fasi** ufficiali e si chiude in **Verifica PO**.

| Voce | Contenuto | Criterio | Stato |
|------|-----------|----------|-------|
| **B1** | Migration M1+M2 (schema `viaggi` + `itineraries.viaggio_id` + RLS owner) | Schema applicabile in locale/CI | ☑ |
| **B2** | Tipi dominio `Viaggio` + tipi DB; **NEW** `viaggioService` CRUD + empty + setActiveDiary (no auto-promote) | Unit/smoke service | ☑ |
| **B3** | `itineraryService`: save/load con `viaggio_id`; create Viaggio on first personal save; map `viaggioId` | Save nuovo diary crea Viaggio | ☑ |
| **B4** | Migration M3 cutover backfill personal esistenti | Tutti i personal hanno `viaggio_id`; `active_diary_id` 1:1 | ☑ |
| **B5** | `ItineraryContext` + `itineraryStorageManager`: `activeViaggioId`, create/load, delete diary → clear active | Context non tratta diary come root | ☑ |
| **B6** | Test fondazione: empty Viaggio; 0..N link; delete active → null; anti-alias path nuovi | Checklist I1–I5 | ☑ |
| **C1** | Adattamento minimo lettori (`TravelDiary` save path, header se necessario, `UserTripsTab` anti-alias) | Lettori critici allineati | ☑ |
| **C2** | Smoke / regressione critica (save, load, delete diary attivo, packing ancora su diary id) | Regressione OK | ☑ |
| **C3** | Checklist gate MP-01 STEP-1 + aggiornamento status/roadmap chiusura | Gate pronto per Verifica PO | ☑ |

**Cutover B4 (vincolo trigger M2):** (1) INSERT `viaggi` con `active_diary_id` NULL → (2) UPDATE `itineraries.viaggio_id` → (3) UPDATE `viaggi.active_diary_id`.

**Deliverable STEP-1:**

| File | Ruolo |
|------|-------|
| `supabase/migrations/20260726180000_create_viaggi.sql` | M1 |
| `supabase/migrations/20260726180100_itineraries_viaggio_id.sql` | M2 |
| `supabase/migrations/20260726180200_cutover_personal_itineraries_to_viaggi.sql` | M3 |
| `src/types/models/Viaggio.ts` · `src/types/supabase.ts` · `src/types/domain` | Tipi |
| `src/services/viaggio/*` | CRUD Viaggio |
| `src/services/community/itineraryService.ts` | Link save/load |
| `src/context/ItineraryContext.tsx` · `itineraryStorageManager.ts` | Context |
| `scripts/smoke-viaggio-domain.ts` · `npm run viaggio:smoke` | Smoke fondazione |

---

## ST-9. Decisioni tecniche operative (log)

| ID | Decisione | Stato |
|----|-----------|-------|
| T1 | Tabella `viaggi` (nome DB allineato al dominio; non `trips`) | Congelata |
| T2 | Diario resta `itineraries`; ADD `viaggio_id` | Congelata |
| T3 | Id Diario immutati al cutover | Congelata |
| T4 | Packing + collab restano agganciati al Diario in STEP-1 | Congelata |
| T5 | `destination` testo libero in STEP-1 | Congelata |
| T6 | Cutover 1 Viaggio : 1 Diario personal iniziale; empty supportato dal modello | Congelata |
| T7 | Guest LS: materializzazione Viaggio al save cloud | Congelata |
| T8 | ON DELETE CASCADE diary←viaggio; active_diary SET NULL | Congelata |

---

# STEP — MP-01 STEP-1 — Fondazione persistenza Viaggio / Diario

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Completare i criteri di MP-01 STEP-1 (persistenza Viaggio / Diario + lettori critici minimi) |
| **Stato STEP** | **Completato** |
| **DoD STEP** | Gate uscita WF-05 ☑; checklist B1…B6 + C1…C3 ☑; **Verifica PO** ☑ |

### Fasi

| Fase | Stato | Inizio | Fine | PO ✓ |
|------|-------|--------|------|------|
| Analisi | Completata | 2026-07-26 | 2026-07-26 | ☑ (baseline ST) |
| Pronto per implementazione | Completata | 2026-07-26 | 2026-07-26 | ☑ |
| Sviluppo | Completata | 2026-07-26 | 2026-07-26 | ☐ (non richiesto per batch) |
| Review tecnica | Completata | 2026-07-26 | 2026-07-26 | ☐ |
| Test | Completata | 2026-07-26 | 2026-07-26 | ☐ (`npm run viaggio:smoke` OK) |
| Verifica PO | Completata | 2026-07-26 | 2026-07-26 | ☑ |

> **PO ✓ obbligatorio** solo su **Verifica PO** (chiusura formale STEP-1 / WF-05).

### Checklist operativa (completata)

- [x] Specifica ST-0…ST-9 approvata
- [x] B1 — schema M1+M2
- [x] B2 — tipi + `viaggioService`
- [x] B3 — `itineraryService` link Viaggio
- [x] B4 — cutover M3
- [x] B5 — Context + storage manager
- [x] B6 — test fondazione
- [x] C1 — lettori critici minimi
- [x] C2 — smoke / regressione
- [x] C3 — gate checklist → **Verifica PO**

---

## Log decisioni operative

| Data | Decisione | Chi |
|------|-----------|-----|
| 2026-07-26 | Apertura WF-05; WF-04 non ripreso | PO |
| 2026-07-26 | Specifica ST-0…ST-9 approvata — baseline STEP-1 | PO |
| 2026-07-26 | B1 eseguito (M1+M2) | AI |
| 2026-07-26 | **Riallineamento governance:** eliminati STEP WF-1/2/3 e STOP PO intermedi; un solo STEP = **MP-01 STEP-1**; B/C = checklist interna | PO |
| 2026-07-26 | Implementazione continua B2…C3 completata; STEP in Verifica PO | AI |
| 2026-07-26 | Verifica PO positiva; WF-05 Completato e archiviato; successore WF-06 | PO |

*Decisioni di dominio → DOC 34A / 37. Non riaprire Vision.*

---

## Chiusura Workflow

| Campo | Valore |
|-------|--------|
| **Data chiusura** | 2026-07-26 |
| **Validazione PO finale** | **Approvato** |
| **Gate MP-01 STEP-1** | ☑ |
| **Archiviato in** | `WORKFLOWS/_archive/WF_05_MP01_STEP1_VIAGGIO_PERSISTENCE.md` |
| **Successivo** | **WF-06** — MP-01 STEP-2 |

**Report operativo obbligatorio** → `00_DEVELOPMENT_PROTOCOL.md` §15.

---

## Cronologia stato

| Data | STEP | Fase | Stato | Nota |
|------|------|------|-------|------|
| 2026-07-26 | — | — | Non iniziato | File creato |
| 2026-07-26 | MP-01 STEP-1 | Analisi / Pronto | Attivo | ST-0…ST-9 approvata PO |
| 2026-07-26 | MP-01 STEP-1 | In sviluppo | Attivo | B1 (M1+M2) fatto |
| 2026-07-26 | MP-01 STEP-1 | In sviluppo | Attivo | Governance riallineata: no STEP WF, no STOP batch |
| 2026-07-26 | MP-01 STEP-1 | In verifica PO | Attivo | B2…C3 implementati; attesa approvazione PO |
| 2026-07-26 | MP-01 STEP-1 | Completata | Completato | PO ✓; archiviato; WF-06 aperto |
