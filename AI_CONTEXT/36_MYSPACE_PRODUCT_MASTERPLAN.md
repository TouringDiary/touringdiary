# 36 — MySpace Product Capability Order (TouringDiary)

> **Ordine strategico delle capacità di prodotto** per MyWorld / MySpace sul dominio Viaggio congelato.
> **Cosa** costruire e in che **ordine di valore utente** — non come implementarlo.
>
> Visione → `35_MYSPACE_PRODUCT_VISION.md`.  
> Dominio → `37_VIAGGIO_DOMAIN.md` · `34A_DOMAIN_DESIGN_RULES.md`.  
> **Implementazione (COME)** → `AI_DEV_WORKFLOW/MASTERPLANS/MP_01_VIAGGIO_DOMAIN_IMPLEMENTATION.md`.
>
> **Non** è Workflow, checklist operativa, schema DB, API o stima effort.  
> **Non** autorizza codice da questo file.

**Versione:** 2.0.0  
**Data:** 2026-07-26  
**Stato:** Ordine di prodotto ufficiale post-freeze dominio Viaggio

---

## 0. Come usare questo documento

1. Leggere DOC 35 (visione) e DOC 37 (dominio).
2. Usare questo file per capire **quale capacità di prodotto** viene prima e perché.
3. Per eseguire lo sviluppo, aprire il **Masterplan di implementazione** (MP-01) e i Workflow che ne deriveranno.
4. **Non** inventare nuove root MySpace, sezioni Viaggio o Product Vision.

---

## 1. Decisioni di prodotto già chiuse

| Decisione | Valore |
|-----------|--------|
| Ingresso | **MyWorld** → MySpace \| Workspace |
| Casa | **MySpace** = originali |
| Unità storia | **Viaggio** (Aggregate Root) |
| Diario | Resource del Viaggio (0..N + attivo) |
| Root MySpace | Viaggi → Esploratore → Preferiti → Strumenti → Inviti |
| Marcatore Preferiti | **Segnalibro** |
| Collaborazione | Solo copie; WS da Viaggio = estensione |
| Filosofia | Silenziosa |

---

## 2. Principio di sequenza

```text
Contenitore mentale (già consegnato: Macrofase 1 / WF-03)
        ↓
Fondazione dominio Viaggio (persistenza + mental model)
        ↓
Cuore navigabile: catalogo e cartella Viaggio
        ↓
Risorse operative (Diario, Valigia, Roadbook library)
        ↓
Collaborazione allineata (copie + WS-da-Viaggio)
        ↓
Memoria e viste (Ricordi, Mappa, Riepilogo) + root restanti
```

Macrofase 1 (**MyWorld & shell MySpace**) è **completata** (WF-03).  
Le capacità successive **non** riprendono l’alias Diario≡Viaggio.

---

## 3. Capacità di prodotto (ordine)

### C0 — Contenitore MyWorld / shell MySpace *(consegnata)*

| Campo | Valore |
|-------|--------|
| Obiettivo | MyWorld, chooser MySpace/Workspace, root MySpace riconoscibili, breadcrumb |
| Stato | Completata (WF-03) |
| Dipendenze | — |
| Gate | Utente distingue casa personale da Workspace e da Account |

### C1 — Fondazione del Viaggio

| Campo | Valore |
|-------|--------|
| Obiettivo | Il prodotto conosce il **Viaggio** come entità distinta dal Diario |
| Motivazione | Senza questo, ogni UI “cartella viaggio” mente al dominio |
| Include (prodotto) | Identità Viaggio; empty Viaggio; relazione 0..N Diari; Diario attivo |
| Esclude | Preferiti, Esploratore profondi, Rivivere, AI come sezione |
| Dipendenze | C0 |
| Criterio di completamento | Utente può creare/vedere un Viaggio senza che sia “un Diario rinominato” |

### C2 — Cuore «I miei Viaggi»

| Campo | Valore |
|-------|--------|
| Obiettivo | Catalogo e cartella Viaggio navigabile in MySpace |
| Include | Copertina, breadcrumb fino al Viaggio, ingresso sezioni, empty silenzioso |
| Dipendenze | C1 |
| Criterio | Da MySpace → I miei Viaggi → Viaggio l’utente sa dove si trova |

### C3 — Risorse operative del Viaggio

| Campo | Valore |
|-------|--------|
| Obiettivo | Diario (multi + attivo), Valigia del viaggio, libreria Roadbook |
| Motivazione | Sono il nucleo quotidiano di pianificazione e recupero artefatti |
| Dipendenze | C2 |
| Criterio | Operare su Diario/Valigia/Roadbook **dentro** il Viaggio senza collasso identitario |

### C4 — Collaborazione allineata al dominio

| Campo | Valore |
|-------|--------|
| Obiettivo | Share risorse (legacy) + creazione Workspace da Viaggio (shell, copie) |
| Motivazione | Estende DOC 28 senza condividere il Viaggio originale |
| Dipendenze | C1–C3 (almeno Diario/Valigia copiabili) |
| Criterio | Nessun percorso «Condividi Originale»; WS-da-Viaggio rispettoso della struttura |

### C5 — Memoria, viste e root restanti

| Campo | Valore |
|-------|--------|
| Obiettivo | Ricordi (Foto/Video/Note-giorno), Mappa, Riepilogo; poi Preferiti / Esploratore / Strumenti / Inviti a profondità visione |
| Motivazione | Completa il patrimonio e la valorizzazione senza aprire nuove dispute di dominio |
| Dipendenze | C1–C2 (struttura); C3 utile per dati Diario/geo |
| Criterio | Sezioni View/Library/Resource usate correttamente; root MySpace coerenti con DOC 35 |

---

## 4. Fuori da questo ordine (desiderata)

- Ricordami questo viaggio (Feature Flag CC)
- Modalità Rivivere
- On This Day / Preferiti intelligenti
- Nuove sezioni Viaggio (solo se DOC 34A/37)

---

## 5. Relazione con implementazione

| Layer | Documento |
|-------|-----------|
| Visione | DOC 35 |
| Dominio | DOC 34A · DOC 37 |
| Ordine capacità (questo file) | DOC 36 |
| Piano implementativo (max 5 STEP) | **MP-01** in `AI_DEV_WORKFLOW/MASTERPLANS/` |
| Esecuzione | Workflow futuri (non WF-04 sull’alias Diario≡Viaggio) |

**Nota:** WF-04 Macrofase 2 basato sull’alias `Viaggio ≡ Diario` è **sospeso** e non riprendibile su quel presupposto.

---

## Cronologia

| Versione | Data | Note |
|----------|------|------|
| 1.x | 2026-07-24/25 | 4 macrofasi pre-freeze |
| 2.0.0 | 2026-07-26 | Riscrittura: ordine capacità su dominio Viaggio; implementazione separata in MP-01 |
