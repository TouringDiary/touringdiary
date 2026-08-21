# B2a Batch C — Audit di avvio (Product Owner) — **C2 (storico)**

> **Stato:** perimetro **C2 ACCETTATO e CHIUSO** (2026-08-06).  
> Documento conservato come audit di avvio storico.  
> **Prossimo avvio PO:** [`B2a_C3_START_PO_AUDIT.md`](./B2a_C3_START_PO_AUDIT.md).  
> Metodologia: SoT Parte 5 **§21 / §21.1 / §22**.  
> SoT: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md) · Indice C: [`B2a_BATCH_C_INDEX.md`](./B2a_BATCH_C_INDEX.md)

---

## Verdetto aggiornato (dopo §22)

| Domanda | Risposta |
|----|----|
| **Punto di partenza** | **C2 — Parsers City** (invariato) |
| **Suddivisione in mini-batch?** | **No** — non obbligatoria |
| **Forma consigliata** | **Un unico batch omogeneo C2** (tutti e 7 i punti / 6 traduttori) |
| **Perché** | Stesso pattern, stesso momento del flusso “apri scheda città”, stesso tipo di rischio, una sola checklist QA Admin sufficiente |
| **Bonifica codice** | **Non autorizzata** finché il PO non ACCETTA questo perimetro |

### Rivalutazione mini-batch (risposte esplicite)

1. **Esiste una motivazione architetturale che obbliga a dividere C2?**  
   **No.** Non c’è dipendenza che impedisca di tipizzare insieme i traduttori: condividono lo stesso ruolo (dati grezzi → scheda città), lo stesso momento di caricamento e lo stesso ordine di grandezza di rischio. Separare “solo valutazioni” era un approccio **più conservativo**, non una necessità di dominio.

2. **C2 può essere un unico batch a rischio ancora accettabile?**  
   **Sì.** Equilibrio migliore tra sicurezza, semplicità e produttività: **un** ciclo review/test/accettazione invece di 5–6. Il rischio resta medio e gestibile con smoke Admin strutturato (sotto).

3. **Se si proponessero ancora più mini-batch, sarebbero indispensabili?**  
   **No** — non li proponiamo. Esempi che **non** giustificano la frantumazione: “i rating sono un file e la galleria un altro” (vero tecnicamente, ma **stesso** percorso prodotto: aprire la stessa città in Admin e controllare tab diverse); “è più prudente” (vietato da §22 senza prova di rischio distinto).

4. **Piano unico + checklist QA**  
   Vedi sezioni A.7–A.8 e B.3.

---

# A) Visione funzionale (UI e dominio)

## A.1 Di cosa stiamo parlando

Quando l’app mostra una **città**, i contenuti (valutazioni, galleria, eventi, servizi, guide, tour operator) arrivano da dati grezzi e vengono **tradotti** in scheda usabile **prima** di comparire a schermo.  
Il gruppo **C2** è l’insieme di questi traduttori. La bonifica futura li rende più rigorosi **senza** cambiare layout o testi, se i dati in database sono già validi.

## A.2 Dove si trova

Non è una voce di menu. Alimenta:

- Editor Admin della città (tab dedicate — percorso QA primario sotto).
- Scheda città e anteprime pubbliche che riusano gli stessi dati (percorso pubblico: vedi lacuna dichiarata in A.7).

## A.3 Flusso completo (prodotto)

```text
[1] Qualcuno apre una città (Admin o pubblico)
        ↓
[2] L’app carica i dati grezzi
        ↓
[3] ★ TRADUZIONE C2 ★ (valutazioni, galleria, eventi, servizi, guide, tour operator)
        ↓
[4] L’UI mostra tab / sezioni
        ↓
[5] L’operatore o l’utente verifica i contenuti
```

C2 interviene solo al passo **[3]**.

## A.4 Conseguenze di una modifica errata

| Area | Sintomo in UI |
|----|----|
| Valutazioni | Numeri assenti, a zero, o diversi da prima |
| Galleria (Media) | Foto mancanti o lista vuota |
| Eventi / Guide / Servizi / Tour operator (Info & Guide) | Elenchi vuoti o schede incomplete |

## A.5 Lacune dichiarate (onestà QA)

| Cosa | Stato |
|----|----|
| Etichetta esatta del pulsante Home per aprire una città / “Esplora” generico | **Non confermata** in questo audit come click unico universale (home ha più griglie/card). Per il batch C2 il percorso **Admin** sotto è sufficiente e verificabile. |
| Nome preciso di ogni sottosezione dentro «Info & Guide» in UI | Usare i blocchi visibili tipici: guide, eventi, operatori, servizi generici — se l’etichetta locale differisce, annotarla in smoke e non inventarla. |
| Città di test | Indicare una città **reale popolata** (es. una già usata in smoke precedenti) oppure «città di test indicata dal PO». Sotto: placeholder **«CITTÀ_TEST»**. |

## A.6 Percorso QA primario — Admin (completamente navigabile)

> Questo è lo script da eseguire **prima** e **dopo** la futura bonifica C2. Stessa città, stessi passi.

**Prerequisito:** utente con accesso Admin; città **CITTÀ_TEST** con contenuti popolati (valutazioni, almeno alcune foto, e se possibile eventi/guide/servizi/operatori).

1. Aprire TouringDiary nell’ambiente di test concordato.  
2. Accedere con un account **Admin**.  
3. Nella barra laterale Admin, cliccare la voce **«Manager POI - DB»**.  
4. Nella lista città, cercare **CITTÀ_TEST** (campo di ricerca / elenco).  
5. Cliccare la riga (o azione di modifica) per aprire l’**editor città**.  
6. Cliccare il tab **«Valutazioni»**.  
7. Annotare il punteggio complessivo mostrato e i valori delle singole barre/categorie visibili (foto o appunti).  
8. Cliccare il tab **«Media»**.  
9. Nella sezione **«Galleria Fotografica»**, contare le foto / verificare che le miniature carichino (annotare il conteggio).  
10. Cliccare il tab **«Info & Guide»**.  
11. Verificare che siano presenti (se la città li ha) i blocchi di **guide**, **eventi**, **tour operator / operatori**, **servizi** — senza errori a schermo e senza liste improvvisamente vuote rispetto al “prima”.  
12. (Opzionale) Cliccare **«Generali»** solo per conferma che l’editor è stabile; non è il focus C2.  
13. Chiudere l’editor / tornare alla lista **«Manager POI - DB»**.  
14. Riaprire **la stessa** **CITTÀ_TEST** e ripetere i passi 6–11: i valori devono coincidere con le annotazioni del primo passaggio.

**Esito atteso post-bonifica:** identico al pre-bonifica su contenuti e conteggi. Qualsiasi differenza senza cambio dati in database → batch **non accettabile**.

## A.7 Percorso QA secondario — pubblico (parziale / lacuna)

Obiettivo: vedere che la scheda pubblica della stessa città non “rompe” galleria o anteprime.

**Limitazione dichiarata:** non è stato fissato in questo documento un unico click Home etichettato «Esplora» valido per tutti i layout. Usare il modo operativo già noto al PO per aprire una scheda città (card in home / ricerca / flusso abituale di test).

1. Dalla Home, aprire la scheda della città **CITTÀ_TEST** con il metodo di navigazione già usato nei smoke precedenti (se il metodo esatto non è noto al tester: **fermare e chiedere al team il click Home corretto** — non inventare).  
2. Verificare che la galleria / immagini principali della città siano ancora presenti.  
3. Se nel flusso di test si apre un’anteprima sezione che mostra **«Valutazioni Esperienziali»**, confrontare i numeri con quelli annotati nel tab Admin **«Valutazioni»**.  
4. Se quel percorso anteprima **non** è raggiungibile nel tempo dello smoke: annotare «percorso pubblico anteprima non eseguito» e basare l’ACCETTO sul percorso Admin A.6 (sufficiente per C2).

## A.8 Schermate coperte dal batch unico C2

| Tab / area Admin | Traduttore C2 |
|----|----|
| **Valutazioni** | ratings |
| **Media → Galleria Fotografica** | gallery |
| **Info & Guide** (guide, eventi, operatori, servizi) | guide / event / tour operator / service |

---

# B) Visione tecnica (codice)

> Per implementatori. Il PO può ignorare questa sezione.

## B.1 Perché un solo batch è architetturalmente sano

| Criterio | Valutazione |
|----|----|
| Pattern | Stesso: ingresso grezzo troppo largo → uscita già tipizzata verso modelli città/media |
| Momento runtime | Stesso caricamento scheda città |
| Accoppiamento UI | Stesso editor Admin, tab diverse dello **stesso** oggetto |
| Dimensione | 7 hit / 6 file — gestibile in un ciclo |
| Beneficio di spezzare | Solo più cicli ACCETTO; **nessuna** dipendenza che obblighi sequenze separate |

## B.2 Perimetro batch unico **C2**

- Tutti i file sotto `src/services/city/parsers/**` già elencati in [`B2a_C2_PARSERS_AUDIT.md`](./B2a_C2_PARSERS_AUDIT.md)  
- Fuori scope: AI (C1), tipi shared (C3), altri servizi (C4), community (C5), undo/rankings (C6), UI Admin/React salvo effetti collaterali involontari

## B.3 Piano di lavoro (dopo ACCETTO PO — non ora)

1. Tipizzare gli ingressi grezzi in modo omogeneo su tutti i traduttori C2 (stessa strategia di narrowing).  
2. `typecheck` sui file toccati.  
3. Smoke **A.6** (obbligatorio) + **A.7** se disponibile.  
4. Un solo ACCETTO PO per l’intero C2.  
5. Aggiornamento SoT numerica solo dopo accettazione.

## B.4 Cosa chiede al PO

1. ACCETTO (o rifiuto) di partire da **C2**.  
2. ACCETTO di trattare C2 come **un unico batch** (non mini-batch ratings-only).  
3. Indicazione di **CITTÀ_TEST**.  
4. **Nessuna** scrittura codice finché non c’è ACCETTO esplicito.
