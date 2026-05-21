# Modal Layering Contract — Touring Diary

## Overview

Il sistema modali di Touring Diary utilizza uno stacking deterministico centralizzato basato su costanti globali per garantire coerenza visiva e prevenire conflitti di layering.

### Regole Fondamentali
– Tutti i modal fullscreen utilizzano `createPortal(..., document.body)` per evitare problemi di overflow parent.
– Tutti gli overlay utilizzano la classe base `td-modal-overlay`.
– È vietato l'uso di z-index hardcoded inline (es. `z-[100]`) per la gestione dei layer principali.
– I livelli di profondità sono definiti centralmente in `src/constants/zIndex.ts`.

---

## Stacking Levels

### Z_OVERLAY = 10000
**Layer:** Global Backdrop Overlay
**Uso:** Classe `td-modal-overlay`.
Fornisce il backdrop semi-trasparente e blocca le interazioni con il contenuto sottostante.

### Z_MODAL = 11000
**Layer:** Standard Fullscreen Modal Content
**Uso:** Componenti principali dell'applicazione.
- CityInfoModal
- SuggestionModal
- ItinerariesModal
- GlobalSectionView
- SponsorModal

### Z_MODAL_NESTED = 12000
**Layer:** Nested Confirmation Modal
**Uso:** Modali di conferma o flussi annidati.
- DeleteConfirmationModal
- Dialog di conferma associazione
- Flussi annidati interni ad altri modali

### Z_ADMIN_MODAL = 13000
**Layer:** Admin Super-Layer Modal
**Uso:** Strumenti amministrativi critici.
- AdminPhotoInspector
- CampaignsPanel
- PricingManager
- AdminCreditPackages
- PartnerDetailModal

**Descrizione:** Questo layer è intenzionalmente posizionato sopra l'intero stack applicativo per garantire che gli strumenti di gestione siano sempre accessibili e visibili.

---

## Overlay Contract

La classe `td-modal-overlay` definisce il posizionamento ma NON contiene un background di default.
Ogni modal deve dichiarare esplicitamente lo stile dell'overlay desiderato.

**Esempi Standard:**
- `td-modal-overlay bg-black/90 backdrop-blur-sm`
- `td-modal-overlay bg-slate-950/95 backdrop-blur-md`

---

## Portal Contract

Tutti i modal fullscreen devono utilizzare il portale verso il body:
`createPortal(..., document.body)`

**Eccezione Documentata:**
- `PoiDetailModal`: Utilizza un overlay custom locale per permettere l'animazione di flip 3D integrata nel layout della pagina.

---

## ESC Handling Contract

La gestione del tasto ESC è centralizzata per prevenire chiusure accidentali di stack multipli:
- Utilizzo dell'hook `useGlobalModalEscape` (attivo nella capture phase).
- Utilizzo del componente `CloseButton`.

L'implementazione di listener manuali (`document.addEventListener`) per il tasto ESC non è consentita nei nuovi componenti.

---

## Admin Super Layer Contract

I componenti definiti come **admin-super-layer** devono riportare la seguente annotazione obbligatoria sopra il root modal container:

`// admin-super-layer modal | intentionally rendered above global modal stack (z-13000)`

**Componenti Certificati:**
- AdminPhotoInspector
- CampaignsPanel
- PricingManager
- AdminCreditPackages
- PartnerDetailModal

## Tailwind z-index Policy

Il progetto Touring Diary non utilizza classi Tailwind dinamiche per lo z-index (es. `z-[${Z_MODAL}]`).

**Motivo:**
Tailwind JIT non garantisce la generazione deterministica di classi dinamiche in runtime conditionale o basate su variabili JavaScript non analizzabili staticamente durante la build.

Per questo motivo, tutti i layer modali devono utilizzare l'attributo style:
`style={{ zIndex: Z_* }}`

Dove le costanti (`Z_OVERLAY`, `Z_MODAL`, `Z_MODAL_NESTED`, `Z_ADMIN_MODAL`) sono importate da:
`src/constants/zIndex.ts`

Questa regola è obbligatoria per prevenire regressioni visive e comportamenti di stacking non deterministici in produzione.
