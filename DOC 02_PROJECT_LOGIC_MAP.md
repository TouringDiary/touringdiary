
# 🧠 DOC 02: PROJECT LOGIC_MAP (v36.2 - MOBILE SCROLL NATURAL)

## 1. AUTOMAZIONE & AI TASK RUNNER
Il cuore delle operazioni massive (Import, Bonifica, Generazione) è l'`useAiTaskRunner`.
...

## 7. ARCHITETTURA DIARIO 2.0 (RESOURCES & MEMOS & DRAG)
Il diario supporta ora 3 tipologie di elementi distinti e una logica di inserimento rigorosa:
...

## 8. MOBILE EXPERIENCE (SCROLL & LAYOUT)
Per massimizzare lo spazio utile sugli schermi piccoli:
1.  **Scrollbar Invisibile:** Sulle viste mobili (`< 768px`), la barra di scorrimento verticale è nascosta (`display: none`) tramite la classe utility `.scrollbar-hide-mobile` definita in `index.html`. Lo scorrimento touch rimane attivo.
2.  **Card POI Espanse:** Nascondendo la barra di scorrimento, i contenitori delle liste POI guadagnano circa 6-12px di larghezza orizzontale, permettendo alle card di respirare meglio.
3.  **UI a Scomparsa (Natural Scroll):**
    *   Gli elementi di controllo interni (Tab Navigazione, Filtri, Search Bar) **NON sono più sticky** su mobile. Scrollano via naturalmente insieme al contenuto per lasciare spazio alla lettura full-screen.
    *   L'unico elemento che rimane fisso in alto è l'Header principale dell'App (`AppShell`).
    *   La barra di navigazione inferiore (`MobileNavBar`) scompare scrollando in basso e riappare scrollando in alto.
    *   Quando la barra scompare, appare un **FAB (Floating Action Button)** giallo/ambra in basso a destra (icona Diario) che permette di richiamare il menu.

## 9. DESKTOP EXPERIENCE (STRICT LAYOUT)
Strategia di layout rigida per garantire la visibilità degli sponsor e la coerenza della navigazione:

1.  **CityDetailContent (Container Principale):**
    *   Impostato a `h-full overflow-hidden`. Non scrolla l'intera pagina.
    *   Header (`CityHeader`) è `shrink-0` e rimane sempre visibile in alto (non scrolla via).
    *   Il contenuto sotto l'header (Tabs + Grid) riempie lo spazio rimanente (`flex-1`).

2.  **Sponsor Columns (Laterali):**
    *   Sono renderizzate dentro **tutti** i tab principali: `CityCategoryTab` (Liste), `CityShowcaseTab` (Novità, Community, Natura).
    *   Hanno `h-full overflow-hidden`.
    *   Sono fisse e non scrollano mai.
    *   Contengono 3 slot (Gold-Gold-Silver) che ruotano automaticamente ma non richiedono interazione di scroll.

3.  **Lista POI / Contenuto Centrale:**
    *   È l'unico elemento che scrolla (`overflow-y-auto`).
    *   Si trova nella colonna centrale della griglia.
    *   La toolbar dei filtri (Cerca, Ordina, ecc.) è `sticky top-0` all'interno di questa colonna o fissa sopra di essa.
    *   La barra di ricerca è geometricamente centrata rispetto a questa colonna per simmetria visiva.

4.  **Struttura Grid:**
    *   **LG (Standard):** 3 Colonne [Sponsor (16rem) | Content (Flex) | Sponsor (19rem)].
    *   **XL (Wide):** 5 Colonne [Sponsor (19rem) | Sponsor (19rem) | Content (Flex) | Sponsor (19rem) | Sponsor (19rem)].

---
*Manuale Logico Aggiornato al 19/12/2025*
