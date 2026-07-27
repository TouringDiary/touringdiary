# 35 — MySpace Product Vision (TouringDiary)

> **Single source of truth di prodotto** per **MyWorld / MySpace**.
> Dominio Viaggio (struttura, ownership, stereotipi) → `37_VIAGGIO_DOMAIN.md`.
> Regole permanenti di dominio → `34A_DOMAIN_DESIGN_RULES.md`.
> Collaborazione → `28_COLLABORATION_WORKSPACE_SYSTEM.md`.
> Packing → `31_PACKING_SUITCASE_SYSTEM.md`.
> Ordine capacità prodotto → `36_MYSPACE_PRODUCT_MASTERPLAN.md`.
> Implementazione → Masterplan in `AI_DEV_WORKFLOW/MASTERPLANS/`.
>
> **Non** è roadmap tecnica, Workflow, schema DB, API o RLS.
> **Non** autorizza implementazione da questo file.

**Versione:** 2.0.0  
**Data:** 2026-07-26  
**Stato:** Product Vision ufficiale — allineata al dominio Viaggio congelato

---

## 0. Scopo

Definisce **cosa** è MySpace / MyWorld per il viaggiatore: casa personale, confini con Workspace e Account, root, filosofia UX.

Il dettaglio strutturale del **Viaggio** non è duplicato qui: vive in DOC 37.

| Amesso | Vietato |
|--------|---------|
| Guida di visione e linguaggio prodotto | Backlog implementativo |
| Allineare UX copy e naming | Progettare schema, API, RLS |
| Desiderata WOW come ispirazione | Trattare desiderata come impegni |

---

## 1. MyWorld

Il contenitore di ingresso si chiama **MyWorld**.

```text
MyWorld
├── MySpace     ← casa del viaggiatore (originali)
└── Workspace   ← mondo collaborativo (copie)
```

Sono filosofie opposte e non confondibili.

---

## 2. MySpace = la casa

> **MySpace = la casa di tutto ciò che appartiene al viaggiatore.**

Qui l’utente conserva, organizza, riscopre e valorizza il proprio patrimonio.

MySpace **non** è: workspace rinominato, social, feed, hub di collaborazione, sostituto dell’Account.

MySpace è **privato per natura**. La condivisione è un atto consapevole che porta **copie** in Workspace. L’originale resta in MySpace.

### 2.1 MySpace ≠ Account

| Mondo | Contiene |
|-------|----------|
| **MySpace** | Viaggi, Preferiti, Strumenti, Inviti Workspace, Esploratore |
| **Account** | Identità, impostazioni, sicurezza, wallet, abbonamenti, supporto |

### 2.2 Promessa

> Il viaggio si pianifica nel prodotto.  
> Ciò che appartiene al viaggiatore resta in MySpace.  
> L’unità della storia è il **Viaggio**.

---

## 3. Principi di prodotto (MySpace)

1. **Personale ≠ Condiviso** — casa chiara: MySpace oppure Workspace.
2. **MySpace = solo originali** — mai copie Workspace vive.
3. **Workspace = solo copie** — nuovo ID; mai gli originali.
4. **Viaggio = cuore della storia** — Aggregate Root; dettaglio → DOC 37.
5. **Diario ≠ Viaggio** — il Diario è una risorsa del Viaggio.
6. **Preferito = stato globale** — non sezione dentro il Viaggio.
7. **Allegati viaggio ≠ Allegati Workspace**.
8. **Strumenti ≠ Valigia del Viaggio**.
9. **Nessuna collaborazione implicita** in MySpace.
10. **Filosofia silenziosa** — no feed, no gamification, no classifiche in MySpace (eccezione opt-in «Ricordami» se attivata).
11. **Anti–tab explosion** — nuove sezioni del Viaggio solo se superano il test di appartenenza (DOC 34A / DOC 37).
12. **Condividi (UX)** — l’utente vede «Condividi»; la copia è dettaglio interno. Vietato «Condividi Originale».

---

## 4. MySpace ↔ Workspace

| Aspetto | MySpace | Workspace |
|---------|---------|-----------|
| Ownership | Solo originali | Solo copie di lavoro |
| Collaboratori | Nessuno | Sì |
| Unità primaria | **Viaggio** | Workspace / risorse in collaborazione |
| Allegati | Del Viaggio | Di workspace |
| Autosave / Lock / Realtime / ACL | Sull’originale personale | Sulla copia |

**Ponte:** Condividi → crea sempre copia → collabora sulla copia.  
Eliminare in MySpace non elimina le copie WS; viceversa.

Estensione: creare Workspace **da un Viaggio** (selezione risorse → copie → shell isomorfa). Dettaglio → DOC 28.

---

## 5. Root MySpace (canonica)

| # | Sezione | Ruolo |
|---|---------|--------|
| 1 | **I miei Viaggi** | Cuore — catalogo dei Viaggi |
| 2 | **Esploratore** | Statistiche aggregate sulla storia personale |
| 3 | **Preferiti** | Raccolta globale (stato oggetti) |
| 4 | **Strumenti** | Valigie e template permanenti |
| 5 | **Inviti Workspace** | Bacheca personale inviti |

### Fuori dalla root

| Elemento | Dove |
|----------|------|
| Allegati personali come root | Non esistono — stanno nel Viaggio |
| Ricordi come root | Non esistono — sezione del Viaggio |
| Preferiti dentro il Viaggio | Non esistono |
| Supporto | Account |

```text
MyWorld
├── MySpace
│     ├── I miei Viaggi
│     │     └── [Viaggio]     ← struttura → DOC 37
│     ├── Esploratore
│     ├── Preferiti
│     │     ├── Città
│     │     ├── POI (vista a filtri)
│     │     ├── Sponsor
│     │     └── Negozi
│     ├── Strumenti
│     │     ├── Le mie Valigie
│     │     └── I miei Template
│     └── Inviti Workspace
└── Workspace
```

---

## 6. I miei Viaggi

Ogni viaggio è una **cartella** con copertina (automatica e/o manuale; eventuale carosello silenzioso).

Aprendo un Viaggio si navigano le sezioni del dominio (DOC 37):

| Sezione | Stereotipo | Ruolo prodotto |
|---------|------------|----------------|
| Diario | Resource | Piano / narrazione (0..N; Diario attivo) |
| Valigia | Resource | Packing di quel viaggio |
| Ricordi | Resource | Foto, Video, Note per giorno |
| Allegati | Resource | File personali del viaggio |
| Roadbook | Library | Snapshot AI acquistati / generati |
| Mappa | View | Esplorazione geografica del patrimonio |
| Riepilogo | View | Sintesi calcolata + annotazioni leggere |

Breadcrumb cliccabile (linea guida UX), es.:  
`MyWorld > MySpace > I miei Viaggi > Parigi 2026 > Ricordi`.

---

## 7. Preferiti

> Diario = vissuto / pianificato nel viaggio.  
> Preferiti = scelto di conservare nella casa.

- Marcatore canonico: **Segnalibro** (non cuore, non stella).
- POI Preferiti: vista a **filtri** (Continente, Nazione, Regione, Zona, Città, Categoria) — non albero profondo.
- Sottosezioni: Città · POI · Sponsor · Negozi.

---

## 8. Esploratore

Valorizzazione **aggregata** della storia personale (naming canonico).  
Distinto dal **Riepilogo** del singolo Viaggio (DOC 37).

---

## 9. Strumenti

Casa delle risorse permanenti **non** legate a un Viaggio (valigie riutilizzabili, template).  
La valigia di un viaggio vive **dentro** quel Viaggio.

---

## 10. Inviti Workspace

Bacheca personale degli inviti. L’invito si **risolve** nel mondo Workspace.

---

## 11. Linee guida UX

### Salvataggio

Messaggi di conferma di elementi importanti ricordano che l’elemento è ritrovabile in MySpace.

### Orientamento

Breadcrumb sempre presente e cliccabile nei livelli MyWorld / MySpace.

### Operazioni di dominio (visione)

| Area | Regola |
|------|--------|
| Eliminazione | (A) elimina Viaggio intero → solo patrimonio personale; (B) elimina singole risorse senza cancellare il Viaggio |
| Creazione | MySpace è anche centro di creazione (Nuovo Viaggio / risorse) |
| Account Dashboard | Tab legacy restano finché migrazione funzionale completa senza regressioni |

---

## 12. Desiderata (non impegni)

Idee WOW da DOC 34 / appendici storiche (es. Ricordami questo viaggio, Rivivere, On This Day) restano **desiderata**: non obbligano sezioni nuove del Viaggio e non alterano DOC 37.

---

## 13. Riferimenti

| Documento | Responsabilità |
|-----------|----------------|
| `34A_DOMAIN_DESIGN_RULES.md` | Costituzione / regole permanenti |
| `37_VIAGGIO_DOMAIN.md` | Struttura e lifecycle del Viaggio |
| `36_MYSPACE_PRODUCT_MASTERPLAN.md` | Ordine capacità di prodotto |
| `28_COLLABORATION_WORKSPACE_SYSTEM.md` | Workspace e condivisione |
| `31_PACKING_SUITCASE_SYSTEM.md` | Packing |
| `34_PRODUCT_VISION_FUTURE_IDEAS.md` | Patrimonio visionario generale |

---

## Cronologia

| Versione | Data | Note |
|----------|------|------|
| 1.x | 2026-07-24/25 | Visioni precedenti MySpace (pre-freeze dominio) |
| 2.0.0 | 2026-07-26 | Riscrittura completa su dominio Viaggio congelato; no Diario≡Viaggio |
