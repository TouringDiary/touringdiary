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

**Versione:** 2.1.0  
**Data:** 2026-07-27  
**Stato:** Ordine di prodotto ufficiale post-freeze dominio Viaggio (+ allineamento MySpace 2026-07-27)

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
| Marcatore Preferiti | **Segnalibro**; Preferiti = **vista trasversale**, non dominio |
| Cover Viaggio | **Una**, solo **manuale**; preview in catalogo |
| Collaborazione | Solo copie; WS da Viaggio = estensione |
| Filosofia | Silenziosa + **Ricordami** ufficiale (cartella Viaggio) |
| Navigazione | Memoria punto MySpace dopo apertura risorsa |

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
| Include | Catalogo (thumb città + titolo/periodo + **preview cover**); cartella **compatta**; breadcrumb; sezioni; empty silenzioso; **Ricordami** in cartella |
| Dipendenze | C1 |
| Criterio | Orientamento chiaro e spazio verticale per i contenuti |

### C3 — Risorse operative del Viaggio

| Campo | Valore |
|-------|--------|
| Obiettivo | Diario (multi + attivo), Valigia (create/link/reopen UX), libreria Roadbook |
| Motivazione | Nucleo quotidiano di pianificazione e recupero artefatti |
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
| Obiettivo | Ricordi (libreria viaggio/giorno), **Mappa embedded**, Riepilogo; Preferiti (vista), Esploratore (archivio), Strumenti, Inviti; **memoria navigazione** MySpace |
| Motivazione | Completa patrimonio e casa senza violare MySpace≠Workspace |
| Dipendenze | C1–C2; C3 utile per Diario/geo |
| Criterio | Stereotipi corretti; root DOC 35 a profondità visione |

---

## 4. Fuori da questo ordine (desiderata)

- Modalità **Rivivere** (≠ sezione)
- **On This Day** / Preferiti intelligenti avanzati
- Nuove sezioni Viaggio (solo se DOC 34A/37)

**Ricordami** non è più desiderata → DOC 35 §6.5 / C2.

---

## 5. Relazione con implementazione

| Layer | Documento |
|-------|-----------|
| Visione | DOC 35 |
| Dominio | DOC 34A · DOC 37 |
| Ordine capacità (questo file) | DOC 36 |
| Piano post–MP-01 (max 3 STEP) | **MP-02** in `AI_DEV_WORKFLOW/MASTERPLANS/` |
| Esecuzione | Workflow derivati da MP-02 (non WF-04 sull’alias Diario≡Viaggio) |

**Nota:** WF-04 resta **sospeso**. **MP-01** è **concluso**.

---

## Cronologia

| Versione | Data | Note |
|----------|------|------|
| 1.x | 2026-07-24/25 | 4 macrofasi pre-freeze |
| 2.0.0 | 2026-07-26 | Riscrittura: ordine capacità su dominio Viaggio; implementazione separata in MP-01 |
| 2.1.0 | 2026-07-27 | Cover/catalogo/Ricordami/Preferiti-vista/Mappa/memoria; punta a MP-02 |
