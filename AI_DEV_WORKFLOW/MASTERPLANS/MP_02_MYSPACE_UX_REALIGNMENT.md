# MP-02 — MySpace UX Realignment (post–MP-01)

> **COME** allineare MySpace alle decisioni UX/dominio congelate in DOC 35 / 37 (+ 28 / 12).  
> **Non** ridefinisce il dominio (COSA). **Non** viola MySpace = originali / Workspace = copie.
>
> | Layer | Documento |
> |-------|-----------|
> | Visione | `AI_CONTEXT/35_MYSPACE_PRODUCT_VISION.md` (v2.2.1+) |
> | Ordine capacità | `AI_CONTEXT/36_MYSPACE_PRODUCT_MASTERPLAN.md` |
> | Dominio | `AI_CONTEXT/34A_DOMAIN_DESIGN_RULES.md` · `AI_CONTEXT/37_VIAGGIO_DOMAIN.md` (v1.2.1+) |
> | Notifiche / CC | `AI_CONTEXT/12_NOTIFICATION_SYSTEM.md` · `AI_CONTEXT/30_PLATFORM_SETTINGS_MASTERPLAN.md` |
> | Collaborazione | `AI_CONTEXT/28_COLLABORATION_WORKSPACE_SYSTEM.md` |
>
> Massimo **3 STEP**. I Workflow si aprono **dopo** approvazione PO di questo Masterplan.  
> **Nessuna** implementazione da questo file finché non esiste un WF dedicato.

**Versione:** 1.2.0  
**Data:** 2026-07-28  
**Stato:** **Completato** — STEP-1…3 chiusi (WF-10…WF-12 archiviati). **Nessun Workflow successivo automatico.** Ripresa solo su decisione PO.  
**Prerequisito:** MP-01 **Completato**; WF-04 resta **Sospeso**

---

## Perché tre STEP (ordine anti-rifare)

1. Prima **catalogo + cartella + cover + Ricordami + memoria + delete** — altrimenti sezioni e root rifatte sul chrome vecchio andrebbero rifatte.
2. Poi **sezioni Viaggio** (Ricordi, Mappa clustering, polish Valigia; Diario/Allegati/Roadbook/Riepilogo = verifica) — sul chrome stabile.
3. Infine **root trasversali** (Preferiti, Esploratore, Strumenti, Inviti) + smoke responsive complessivo.

```text
STEP-1  Catalogo · cartella · cover · Ricordami · memoria path · delete
   ↓
STEP-2  Ricordi · Mappa (Maps + clustering) · polish/verifica sezioni
   ↓
STEP-3  Preferiti · Esploratore · Strumenti · Inviti Workspace
```

**Workspace (confine DOC 28):** non è uno STEP di rebuild. Invarianti (originali ↛ sync copie; delete originale ↛ delete copia) sono **vincoli** di tutti gli STEP; Inviti = ponte in STEP-3; entry «Workspace da Viaggio» già da MP-01 resta in cartella (STEP-1 chrome).

---

## Governance

Ogni Workflow implementa **uno e un solo STEP** di MP-02.  
Contraddizione con DOC 34A/37/35/28/12 → **fermare** e chiedere al PO.  
`AI_DELETED_CODE_REVIEW.md` secondo WF-RV-01 quando si tocca codice.

---

## Copertura SSOT → STEP

| Tema (DOC 35 / 37 / 12 / 28) | STEP |
|-----------------------------|------|
| Catalogo Prossimi/Passati, sort persistente, nascondi vuoti, riga cover/thumb | 1 |
| Cover unica manuale; «+» → selettore diretto; no fascia in cartella | 1 |
| Cartella compatta; breadcrumb ogni livello cliccabile | 1 |
| Memoria navigazione = **breadcrumb completo** | 1 |
| Ricordami (UI, CC/UI sospesa, persistenza, delete cascade, N notifiche + deep link) | 1 |
| Delete Viaggio (modale + checkbox consapevolezza) | 1 |
| Densità desktop chrome / responsive shell | 1 |
| Ricordi libreria viaggio∪giorno; media multi-giorno = link logici; delete solo TD | 2 |
| Mappa Google Maps embedded + clustering (solo view) + pin → pagina POI | 2 |
| Diario: **non** cambiare Salva / Salva con nome / Auto Save | 2 (verifica) |
| Valigia UX create/link/reopen; Allegati/Roadbook/Riepilogo verifica | 2 |
| Preferiti vista (no cartelle; Città / Altri / Recap) | 3 |
| Esploratore archivio (città visitate auto; delete Viaggio ↛ città) | 3 |
| Strumenti autonomi; Inviti WS | 3 |
| Responsive root / smoke end-to-end | 3 |

---

# STEP-1 — Shell: catalogo, cartella, cover, Ricordami, memoria, delete

### Obiettivo

Allineare il **contenitore** «I miei Viaggi» e la **cartella** alle decisioni definitive DOC 35, senza rifare le sezioni interne.

### Include

**Catalogo**
- Ordinamento: default **Ultima modifica**; scelta utente **persistente**.
- Gruppi **Prossimi Viaggi** / **Viaggi Passati**; se un gruppo è vuoto → **non** mostrare intestazione.
- Layout: orizzontale Desktop/Tablet; verticale Mobile.
- Riga: thumb città (1 città → apre; più → collage **prime 4** + selezione) · titolo/periodo · **preview cover**.
- Cover assente: riquadro **«+»**; click → **selettore immagini diretto** (nessuna finestra intermedia).

**Cover**
- Una sola, solo manuale (carica / sostituisci / elimina); non Ricordo / non media; non auto-generata.
- Nessuna fascia cover alta in cartella.

**Cartella**
- Chrome: indietro · titolo · Workspace (entry esistente) · tab sezioni · **Ricordami**.
- Breadcrumb: **ogni livello cliccabile**.

**Ricordami** (DOC 35 §6.5 · DOC 12 · DOC 30)
- Persistenza su Viaggio; default ON / 12 mesi; autosave; gate `feature.comms.notifications` + **UI sospesa**.
- Delete Viaggio → elimina anche la preferenza Ricordami di quel Viaggio.
- Emissione: **N notifiche indipendenti** (nessun raggruppamento) con deep link alla **cartella** del Viaggio.

**Memoria di navigazione**
- Persistenza dell’**intero percorso** (breadcrumb completo), non solo sezione.
- Esempio: MySpace → Viaggio → Ricordi → Foto Giorno X; reopen MyWorld → stesso punto.

**Eliminazione Viaggio**
- Modale + checkbox consapevolezza (viaggio, diario, ricordi, foto, video, allegati, documenti, dati collegati); conferma solo dopo spunta.
- Non elimina copie Workspace (DOC 28).

**Responsive**
- Densità desktop del chrome; coerenza tablet/mobile della shell catalogo/cartella.

### Esclude

- Redesign Ricordi / Mappa / Preferiti / Esploratore / Strumenti (STEP-2/3).
- Modifiche al sistema di salvataggio Diario.

### Dipendenze

- MP-01 concluso; flag CC `feature.comms.notifications`.

### Deliverable dati (indicativi)

- Campi Ricordami su Viaggio se assenti; preferenza sort catalogo utente; upload cover su `cover_image`.

### Criterio di completamento

Catalogo e cartella allineati DOC 35; cover «+» diretto; Ricordami + CC + delete cascade + notifiche indipendenti con deep link; memoria path completo; delete con checkbox.

### Rischi

| Rischio | Mitigazione |
|---------|-------------|
| `closeModal()` azzera path | Persistenza percorso **prima** della chiusura; restore su MyWorld |
| Scheduler Ricordami | Incluso in STEP-1; N notifiche separate, no batch-merge |
| Cover storage | Riusare pattern media esistenti; no multi-cover |

---

# STEP-2 — Sezioni Viaggio: Ricordi, Mappa, polish/verifica

### Obiettivo

Allineare le **sezioni** del Viaggio (DOC 37) sul chrome STEP-1.

### Include

**Ricordi**
- UX: giorni \| FOTO / VIDEO (viaggio intero vs giorno selezionato).
- Media: appartengono al Viaggio; giorni = **link logici**; contenuto unico; multi-giorno; spostamento; delete **solo** dal Viaggio (non telefono/cloud).

**Mappa**
- Google Maps **embedded**.
- **Clustering** marker (solo visualizzazione: no nuove entità, no cambio dominio/POI/dati).
- Pin singolo → **pagina completa del POI**.

**Diario**
- **Verifica UX**; **non** modificare Salva / Salva con nome / Auto Save; nessuna cronologia versioni.

**Valigia**
- Miglioramento UX: creazione, collegamento, riapertura.

**Allegati / Roadbook / Riepilogo**
- Verifica allineamento DOC 37; fix solo se gap reale.

**Responsive**
- Smoke tablet/mobile delle sezioni.

### Esclude

- Root Preferiti / Esploratore / Strumenti / Inviti (STEP-3).
- Nuove sezioni Viaggio; strutture dati dedicate al clustering.

### Dipendenze

- STEP-1 completato; credenziali/quota Maps (gate tecnico).

### Criterio di completamento

Ricordi navigabili come libreria viaggio∪giorno; Mappa clustered + POI full page; Diario save invariato; Valigia più naturale; sezioni legacy verificate.

### Rischi

| Rischio | Mitigazione |
|---------|-------------|
| Note-giorno vs FOTO/VIDEO | Decisione layout in WF senza secondo sistema Resource |
| Performance media / pin | Lazy/paginazione; clustering solo client-side |
| Tentazione di cambiare save Diario | Vietato esplicitamente (VD-021 / PV-002) |

---

# STEP-3 — Root MySpace: Preferiti, Esploratore, Strumenti, Inviti

### Obiettivo

Profondità delle **root** canoniche (DOC 35), senza confondere domini né violare DOC 28.

### Include

**Preferiti**
- Attributo trasversale (no entità/copie/raccolte/cartelle).
- Layout: **Città Preferite** · **Altri Preferiti** · **Recap** POI (Continente / Nazione / Regione / Zona).
- Città preferibile anche se non visitata; segnalibro + icone categoria (TO **🎫**).

**Esploratore**
- Solo archivio personale (≠ ricerca / Scopri / feed / community).
- Città visitate: aggiunta automatica; rimozione manuale; delete Viaggio **↛** delete città visitata.

**Strumenti**
- Elementi autonomi indipendenti dai Viaggi (valigie/template; slot futuri).

**Inviti Workspace**
- Ricevuti / inviati / pendenti; ponte verso DOC 28 (copie, no sync originali).

**Responsive**
- Smoke end-to-end Desktop / Tablet / Mobile delle root.

### Esclude

- Rebuild Workspace; share dell’originale; Rivivere / On This Day.

### Dipendenze

- STEP-1–2; motore collaborazione per Inviti (già in prodotto).

### Criterio di completamento

Root non placeholder; Preferiti e Esploratore allineati DOC 35; Inviti operativi; invarianti WS rispettati.

### Rischi

| Rischio | Mitigazione |
|---------|-------------|
| Preferiti packing ≠ globali | Modello «stato Preferito» trasversale |
| Scope Esploratore | Slice MVP città visitate; resto Futura |

---

## Fuori da MP-02

- Rivivere, On This Day avanzato, AI come sezione.
- Qualsiasi ripresa di WF-04 sull’alias Diario≡Viaggio.
- Condivisione dell’originale Viaggio.
- Nuove sezioni del Viaggio oltre DOC 37.

---

## Cronologia

| Versione | Data | Note |
|----------|------|------|
| 1.0.0 | 2026-07-27 | Prima stesura da decisioni PO UX MySpace (solo doc) |
| 1.1.0 | 2026-07-27 | Riallineamento a DOC 35 v2.2.1 / 37 v1.2.1 / 12 / 28: catalogo completo, delete, memoria path, Ricordami N notifiche, Ricordi link logici, Mappa clustering, Preferiti/Esploratore |
| 1.1.1 | 2026-07-27 | STEP-1 Completato (WF-10); STEP-2 aperto (WF-11) |
| 1.1.2 | 2026-07-28 | STEP-2 Completato (WF-11 ACCETTO PO); STEP-3 aperto (WF-12) |
| 1.2.0 | 2026-07-28 | STEP-3 Completato (WF-12 archiviato); **MP-02 concluso**; nessun WF successivo automatico |
