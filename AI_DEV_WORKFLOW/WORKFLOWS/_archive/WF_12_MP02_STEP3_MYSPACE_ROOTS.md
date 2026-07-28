# WF-12 — MP-02 STEP-3: Root MySpace (Preferiti, Esploratore, Strumenti, Inviti)

> **Workflow esecutivo** — esegue **esclusivamente** lo **STEP-3** di MP-02.
> Masterplan → `AI_DEV_WORKFLOW/MASTERPLANS/MP_02_MYSPACE_UX_REALIGNMENT.md` § STEP-3.
> SoT → DOC 35 · DOC 37 · DOC 34A · DOC 28 · DOC 31.
>
> **Archiviato** in `WORKFLOWS/_archive/` — 2026-07-28.  
> **Non** eseguire. Storico ufficiale di MP-02 STEP-3 — **MP-02 concluso**.
>
> **Governance:** lo STEP ufficiale è **MP-02 STEP-3**. Non esistono micro-STEP di avanzamento.
> **Non** rebuild Workspace; **non** share dell’originale; **non** riprende WF-04.  
> Prerequisito chiuso → `WORKFLOWS/_archive/WF_11_MP02_STEP2_VIAGGIO_SECTIONS.md`.

---

## Metadati

| Campo | Valore |
|-------|--------|
| **ID** | WF-12 |
| **Nome** | MP-02 STEP-3 — Root MySpace |
| **Stato Workflow** | **Completato** |
| **Masterplan** | `MASTERPLANS/MP_02_MYSPACE_UX_REALIGNMENT.md` — **STEP-3** |
| **SSOT** | DOC 35 · DOC 37 · DOC 34A · DOC 28 · DOC 31 |
| **Owner** | PO + AI |
| **Creato** | 2026-07-28 |
| **Ultimo aggiornamento** | 2026-07-28 |
| **Aggiornato da** | AI — review codice STEP-3 conclusa → Completato (archiviato); **MP-02 concluso** |
| **Workflow precedenti** | WF-11 Completato (archiviato) |
| **Workflow successivo** | — (nessuno automatico; ripresa solo su decisione PO) |

---

## Obiettivo

Profondità delle root canoniche MySpace (Preferiti vista trasversale, Esploratore archivio città visitate, Strumenti autonomi, Inviti Workspace) secondo DOC 35, senza violare DOC 28.

---

## Prerequisiti

| Prerequisito | Stato | Nota |
|--------------|-------|------|
| WF-11 / MP-02 STEP-2 Completato | ☑ | ACCETTO PO |
| SSOT letti | ☑ | |
| Motore collaborazione Inviti | ☑ | già in prodotto |

---

## Gate uscita (= MP-02 STEP-3)

- [x] Preferiti: attributo trasversale; layout Città · Altri · Recap; Segnalibro; città anche non visitata
- [x] Esploratore: archivio personale; città visitate auto + rimozione manuale; delete Viaggio ↛ città
- [x] Strumenti: valigie/template indipendenti dai Viaggi
- [x] Inviti Workspace: ricevuti / inviati / pendenti
- [x] Responsive smoke root Desktop / Tablet / Mobile
- [x] Audit STEP-3 vs SSOT; invarianti WS; no regressioni STEP-1/2 — **review codice conclusa (PO)**

---

# STEP — MP-02 STEP-3

| Campo | Valore |
|-------|--------|
| **Obiettivo** | Root MySpace allineate DOC 35 |
| **Stato STEP** | Completato |
| **DoD STEP** | Criterio di completamento MP-02 STEP-3 |

### Fasi

| Fase | Stato | Inizio | Fine | PO ✓ |
|------|-------|--------|------|------|
| Analisi | Completato | 2026-07-28 | 2026-07-28 | ☐ |
| Pronto per implementazione | Completato | 2026-07-28 | 2026-07-28 | ☐ |
| Sviluppo | Completato | 2026-07-28 | 2026-07-28 | ☐ |
| Review tecnica | Completato | 2026-07-28 | 2026-07-28 | ☐ |
| Test | Completato | 2026-07-28 | 2026-07-28 | ☐ |
| Verifica PO | Completato | 2026-07-28 | 2026-07-28 | ☑ review codice |

---

## Deliverable implementati (sintesi)

| Area | Note |
|------|------|
| Preferiti | Tabella `user_favorites`; UI Città · Altri · Recap; ricerca città; Segnalibro su POI detail |
| Esploratore | Tabella `user_visited_cities`; sync auto da Viaggi; rimozione manuale; no FK verso `viaggi` |
| Strumenti | Lista valigie/template permanenti → `openModal('packingList')` |
| Inviti | Tab Pendenti / Ricevuti / Inviati; accept → apre Workspace |
| Ops | Migration `20260728120000_…`; smoke `mp02:step3:smoke` |

---

## Schema DB — query di verifica (pre-migrazione)

```sql
-- Confermare cities.id (text) e assenza tabelle Preferiti/Esploratore
SELECT data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'cities' AND column_name = 'id';

SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_favorites', 'user_visited_cities');

SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'workspace_invites'
ORDER BY ordinal_position;
```

Verificato via tipi generati (`cities.id: string` / FK text su altre migration) + assenza tabelle nel catalogo migration → create idempotenti.

---

## Log decisioni operative

| Data | Decisione | Chi |
|------|-----------|-----|
| 2026-07-28 | PO: ACCETTO WF-11; aprire STEP-3 e implementare interamente | PO |
| 2026-07-28 | WF-12 = MP-02 STEP-3; nessun micro-step di avanzamento | AI |
| 2026-07-28 | Preferiti = attributo (`user_favorites`), non dominio; Esploratore indipendente da `viaggi` | AI |
| 2026-07-28 | Inviti MySpace = solo `workspace_invites` (ponte DOC 28) | AI |
| 2026-07-28 | Review codice STEP-3 conclusa; chiusura formale WF-12 + MP-02; nessun WF successivo automatico | PO |

---

## Archiviazione

| Campo | Valore |
|-------|--------|
| **Archiviato in** | `WORKFLOWS/_archive/WF_12_MP02_STEP3_MYSPACE_ROOTS.md` |
| **Data** | 2026-07-28 |

---

## Cronologia stato

| Data | STEP | Fase | Stato | Nota |
|------|------|------|-------|------|
| 2026-07-28 | MP-02 STEP-3 | Sviluppo | Attivo | Apertura WF-12 |
| 2026-07-28 | MP-02 STEP-3 | Verifica PO | Attivo | Implementazione completa → In verifica PO |
| 2026-07-28 | MP-02 STEP-3 | — | Completato | Review codice conclusa; archiviato; **MP-02 concluso** |
