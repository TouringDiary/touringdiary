# B2a Batch C3 — Audit di avvio (Product Owner)

> **Stato aggiornato:** **ACCETTATO — batch chiuso** (2026-08-06).  
> Residui vivi context: **0** (`ModalContext` / `ConfigContext` / `CityEditorContext`).  
> Metodologia: SoT Parte 5 **§21 / §21.1 / §22**.  
> SoT: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md) · Indice C: [`B2a_BATCH_C_INDEX.md`](./B2a_BATCH_C_INDEX.md) · Dettaglio tecnico: [`B2a_C3_DOMAIN_AUDIT.md`](./B2a_C3_DOMAIN_AUDIT.md)  
> Predecessore: **C2 — Parsers** **ACCETTATO** (chiuso). Successore: **C4 — Services** (audit PO).

---

## Verdetto (dopo §22) — stato reale

| Domanda | Risposta |
|----|----|
| **Punto di partenza** | **C3 — Domain Types** (tipi shared, context, constants e UI che mutano contratti City / Sponsor / configurazione) |
| **Suddivisione in mini-batch?** | **No** — unico batch |
| **Forma** | **Un unico batch omogeneo C3** (censimento **45** / **26** file; residui vivi context **0**) |
| **Perché** | Stesso obiettivo di qualità; un solo ciclo review → smoke → ACCETTO. La vecchia lista C3-M1…M9 resta solo inventario storico |
| **Ordine interno (non è suddivisione)** | tipi shared → context → consumer UI. **Un solo** ACCETTO PO a fine batch |
| **Bonifica codice** | **Completata** — `ModalPropsBag` + Modal/Config/CityEditor tipizzati; consumer Modal allineati |

### Rivalutazione mini-batch (risposte esplicite)

1. **Esiste una motivazione architetturale che obbliga a dividere C3?**  
   **No, non a priori.** Non c’è una dipendenza che impedisca di tipizzare insieme i punti del gruppo: condividono il ruolo di “contratto di dominio / stato condiviso / cast UI verso quel contratto”. Separare per singola schermata Admin era un approccio **più frammentato**, non una necessità di dominio.

2. **C3 può essere un unico batch a rischio ancora accettabile?**  
   **Sì, con smoke multi-superficie strutturato** (sotto). Il rischio è **alto** (più superfici di C2), ma **gestibile** in un ciclo se la checklist QA copre tutti i percorsi reali. Non è “non gestibile in un unico smoke” nel senso di §22.

3. **Quando una suddivisione diventerebbe legittima?**  
   Solo se, in implementazione, emergerà una prova concreta (es. cambio di `City.ts` / `Sponsor.ts` che obbliga touch fuori perimetro C3, o regressione non isolabile). In quel caso: **fermarsi e chiedere al PO** — non spezzare preventivamente.

4. **Cosa NON giustifica la frantumazione**  
   - “Sono 26 file / 45 hit” (dimensione ≠ motivo architetturale).  
   - “Gamification e Sponsor sono menu diversi” (vero in UI, ma stesso tipo di debito: cast/contratto di dominio).  
   - La tabella storica C3-M1…Mrest in [`B2a_C3_DOMAIN_AUDIT.md`](./B2a_C3_DOMAIN_AUDIT.md) — utile come inventario, **non** come piano obbligatorio.

---

# A) Visione funzionale (UI e dominio)

## A.1 Di cosa stiamo parlando

Nel prodotto, molte schermate Admin e alcune viste pubbliche lavorano su **contratti di dominio**: cosa è una città, uno sponsor, una valutazione, un servizio, un filtro, un’icona news, un premio gamification, un utente creato, ecc.

Il gruppo **C3** raccoglie i punti in cui quel contratto è ancora descritto in modo troppo largo (`any`). La bonifica futura rende i contratti più rigorosi **senza** cambiare layout, testi o regole di business, se i dati già validi restano validi.

## A.2 Dove si trova (superfici prodotto)

Non è una sola voce di menu. Tocca **più aree Admin** e **una superficie pubblica**:

| Area prodotto | Voce / percorso (etichette UI reali) |
|----|----|
| Territorio — città | Sidebar **«Manager POI - DB»** → editor città |
| Territorio — audit POI | **«Manager POI - DB»** → **«Aree Geografiche»** → **«CERCA POI»** |
| Territorio — osservatorio | **«Manager POI - DB»** → **«Osservatorio Dati»** → tab **«Anomalie»** |
| Territorio — import | Sidebar **«Manager & Import POI»** |
| Community | Sidebar **«Gamification»**, **«News Ticker»** |
| Business | Sidebar **«Attività & Sponsor»** → tab **«Dashboard»** |
| Sistema | Sidebar **«Impostazioni Globali»** (super-admin) |
| Utenti | Footer Admin **«Utenti & Ruoli»** → **«Crea»** |
| Dashboard | Footer **«Dashboard Generale»** |
| Pubblico | Scheda città → tab categoria (**«Destinazioni»**, **«Sapori»**, …) |
| Account business | Avatar **«Account»** → area attività business (tab di dashboard business) |

## A.3 Flusso completo (prodotto)

```text
[1] L’operatore apre una schermata Admin (o l’utente una scheda città)
        ↓
[2] L’app carica / mostra dati già strutturati (città, sponsor, filtri, liste…)
        ↓
[3] ★ CONTRATTI DI DOMINIO C3 ★ (tipi, context, cast UI ↔ dominio)
        ↓
[4] L’UI consente modifica, filtro, salvataggio, anteprima
        ↓
[5] Verifica: stessi valori / stesse liste / nessun errore a schermo
```

C3 interviene al passo **[3]** (e nei punti in cui la UI forza un valore verso il dominio).

## A.4 Impatto sul prodotto

| Se la bonifica è corretta | Se è errata |
|----|----|
| Nessuna differenza visibile per operatori/utenti | Valutazioni che non si aggiornano o mostrano vuoto |
| Stesse liste eventi/guide/servizi/operatori | Liste Info & Guide vuote o non salvabili |
| Stessi filtri sponsor / news / gamification | Filtri che non applicano o icone/categorie perse |
| Creazione utente e import invariati | Modal «Nuova Utenza» o import che falliscono in silenzio |
| Tab categorie città pubbliche invariati | Filtri categoria pubblici che “non rispondono” |

## A.5 Rischi di una modifica errata

| Rischio | Sintomo in UI |
|----|----|
| Contratto City indebolito/troppo stretto | Editor città: tab **Valutazioni** / **Info & Guide** inconsistenti |
| Contratto Sponsor / geo | **Attività & Sponsor** → **Dashboard**: filtri o riepiloghi sbagliati |
| Context editor / preview | Anteprima o liste servizi in editor che non si aggiornano |
| Modal / config globali | Modali che non aprono dati; **Impostazioni Globali** che non mostrano oggetti annidati |
| Cast enum/status | Filtri import, categorie POI, icone news ticker errate |

## A.6 Dipendenze con gli altri gruppi C

| Gruppo | Relazione con C3 |
|----|----|
| **C2 (chiuso)** | I parser producono già entità tipizzate; C3 tipizza i **contratti** e i consumer Admin/pubblici |
| **C4 Services** | I servizi mappano payload verso gli stessi tipi — **fuori scope** ora; non modificarli in C3 |
| **C1 AI** | Generatori AI possono finire nei tipi City — **fuori scope** |
| **C5 / C6** | Suggestion / undo / rankings — **fuori scope** |

## A.7 Lacune dichiarate (§21.1)

| Cosa | Stato |
|----|----|
| Click Home unico per aprire una città | **Non** fissato come etichetta universale (card/ricerca). Per lo smoke pubblico: usare il metodo già noto al PO; se sconosciuto → **fermare e chiedere** |
| Etichette annidate in **Impostazioni Globali** / `ObjectRenderer` | Sono **chiavi JSON** di configurazione, non voci di menu fisse — verificare che gli oggetti annidati si espandano ancora, senza inventare nomi di campo |
| Controllo edit da **Osservatorio → Anomalie** | Apre il modal POI con **icona** (title non sempre testo italiano fisso) — lacuna parziale; preferire apertura da editor **Punti Interesse** → **Modifica** / **Nuovo POI** |
| `EditorRatings.tsx` vs tab **Valutazioni** | Il tab wired è **«Valutazioni»** (`TabRatings`). `EditorRatings` è sibling nello stesso dominio ratings — includerlo nel batch codice, ma nello smoke PO verificare il tab **Valutazioni** |
| Città / sponsor / utente di test | Placeholder **CITTÀ_TEST**, account Admin (e super-admin per Impostazioni), eventuali dati sponsor già presenti |

## A.8 Percorso QA primario — Editor città (obbligatorio)

**Prerequisito:** Admin; **CITTÀ_TEST** popolata (valutazioni + almeno un blocco Info & Guide).

1. Aprire TouringDiary (ambiente di test).  
2. Accedere come **Admin**.  
3. Header → **«Pannello Admin»**.  
4. Sidebar → **«Manager POI - DB»**.  
5. Aprire **CITTÀ_TEST** (azione **Edit** / modifica città come già usata nello smoke C2).  
6. Tab **«Valutazioni»**: annotare i valori mostrati; spostare **una** barra di una categoria e verificare che il numero a schermo cambi (poi ripristinare o non salvare se lo smoke è read-only — **dichiarare** se il salvataggio non viene eseguito).  
7. Tab **«Info & Guide»**: verificare sezioni **«Guide»**, **«Eventi»**, **«Tour Operator & Agenzie»**, **«Servizi Essenziali»** (presenza elenchi come pre-bonifica).  
8. Tab **«Punti Interesse»** → **«Nuovo POI»** o **«Modifica»** su un POI → tab modal **«Info Base»**: aprire e chiudere senza errore.  
9. Chiudere l’editor e riaprire **CITTÀ_TEST**: i valori annotati al passo 6–7 devono coincidere (se non si è salvato di proposito).

## A.9 Percorsi QA secondari — altre superfici Admin (obbligatori per ACCETTO unico C3)

Eseguire **dopo** A.8 sulla stessa sessione Admin. Annotare «OK / KO / non eseguibile + motivo».

| # | Percorso (click) | Cosa verificare |
|---:|----|----|
| S1 | Sidebar **«Dashboard Generale»** | Pagina stats carica; tab **«Overview»** (e se usato in test: **«Matrice Territoriale»**) senza crash |
| S2 | **«Manager POI - DB»** → **«Aree Geografiche»** → sulla riga città **«CERCA POI»** | Si apre il modal di audit/ricerca POI; chiudere senza errore |
| S3 | **«Manager POI - DB»** → **«Osservatorio Dati»** → **«Anomalie»** | Pannello **«Ispettore Anomalie»** visibile; filtri città non rompono la vista |
| S4 | Sidebar **«Manager & Import POI»** | Console importazione si apre; **non** lanciare un import distruttivo — solo apertura UI / filtri visibili |
| S5 | Community → **«Gamification»** | Pagina **«Gamification & Premi»**; aprire modifica di un premio se presente (categoria selezionabile) |
| S6 | Community → **«News Ticker»** | Lista/form news; selezione icona in creazione/modifica non perde il valore a schermo |
| S7 | Business → **«Attività & Sponsor»** → tab **«Dashboard»** | Overview sponsor carica; click su un filtro dashboard (chip/filtro presente in pagina) non crasha |
| S8 | Footer **«Utenti & Ruoli»** → **«Lista Utenti»** → **«Crea»** | Modal **«Nuova Utenza»** si apre; **non** creare utenti reali in produzione — chiudere o usare ambiente di test |
| S9 | Sistema → **«Impostazioni Globali»** (serve super-admin) | Tab che mostra oggetti annidati (es. area categorie/strutture POI): gli oggetti si espandono ancora. Se non si è super-admin: annotare **«S9 non eseguibile — ruolo»** |
| S10 | (Opzionale business) Avatar **«Account»** → sezione attività business | Se l’account di test **non** è business: **«S10 non eseguibile — ruolo»** |

## A.10 Percorso QA pubblico (parziale)

1. Aprire la scheda di **CITTÀ_TEST** dalla Home con il metodo già usato negli smoke precedenti (**lacuna** se il click esatto non è noto → chiedere, non inventare).  
2. Cliccare un tab categoria tra: **«Destinazioni»**, **«Sapori»**, **«Alloggi»**, **«Shopping»**, **«Svago»**, **«Natura»**, **«Novità»**.  
3. Verificare che l’elenco/filtro della categoria resti popolato come prima (niente schermata vuota improvvisa).

Se A.10 non è eseguibile nel tempo dello smoke: annotarlo; l’ACCETTO C3 resta basato su **A.8 + S1–S9** (con lacune ruolo dichiarate).

## A.11 Schermate coperte dal batch unico C3

| Superficie UI | File / area C3 tipica |
|----|----|
| Tab **Valutazioni** | `TabRatings`, `EditorRatings` |
| **Info & Guide** (Guide/Eventi/Operatori/Servizi) | `ServiceGuides`, `ServiceEvents`, `ServiceOperators`, `ServiceGeneric`, `CityEditorContext` |
| **Punti Interesse** / Info Base | `PoiInfoTab`, taxonomy via **Tassonomia** |
| Modal **CERCA POI** | `CityAuditModal` |
| **Osservatorio → Anomalie** | `AnomalyInspector` |
| **Gamification**, **News Ticker** | `AdminGamification`, `NewsTickerManager` |
| **Attività & Sponsor → Dashboard** | `SponsorDashboardOverview` + tipi `Sponsor.ts` |
| **Utenti & Ruoli → Crea** | `CreateUserModal` |
| **Dashboard Generale** | `AdminStatsDashboard` |
| **Impostazioni Globali** | `ObjectRenderer`, `ConfigContext` |
| Tab categoria città pubblica | `CityCategoryTab` |
| Contratti shared (non una schermata) | `City.ts`, `Sponsor.ts`, `subscriptions.ts`, `constants/services.ts`, `ModalContext`, `BusinessContext` |

---

# B) Visione tecnica (codice)

> Per implementatori. Il PO può ignorare questa sezione.

## B.1 Perché un solo batch è architetturalmente sano (§22)

| Criterio | Valutazione |
|----|----|
| Pattern | Omogeneo: `any` su contratti di dominio, context, cast UI→union, JSON settings tipizzato largo |
| Accoppiamento | Stesso “strato contratto”; superfici UI diverse ma **stesso tipo di debito** |
| Dipendenza interna | Tipi shared → context → UI: ordine di lavoro, **non** mini-batch ACCETTO separati |
| Dimensione | 45 hit / 26 file — superiore a C2, ancora un ciclo se lo smoke multi-path è eseguito |
| Beneficio di spezzare a priori | Solo più cicli ACCETTO; **nessuna** prova che il rischio sia ingestibile in un smoke strutturato |

## B.2 Perimetro batch unico **C3**

- Tutti i file/occorrenze in [`B2a_C3_DOMAIN_AUDIT.md`](./B2a_C3_DOMAIN_AUDIT.md) (45 / 26).  
- **Fuori scope:** C1, C2 (già chiuso), C4, C5, C6; servizi di mapping non in lista C3; refactor UI; cambi funzionali.

## B.3 Piano di lavoro (stato: **chiuso**)

1. ~~Shared types/constants + consumer UI~~ — **fatto**.  
2. ~~Tipizzare i 3 context (8 hit) + consumer Modal~~ — **fatto** (`ModalPropsBag`, narrowing locale, producer Shop corretto).  
3. ~~`typecheck` + `build`~~ — OK (soli 3 errori TS save-hook baseline).  
4. ~~Gate STEP 5~~ — Biome snapshot + audit `noExplicitAny` dominio C3 = **0**; wiring Modal verificato.  
5. ~~ACCETTO PO~~ — **dato** (chiusura C3).  
6. ~~Aggiornamento SoT di chiusura~~ — **fatto**.

## B.4 Post-chiusura

1. C3 **chiuso** — non riaprire salvo regressione dimostrata.  
2. Prossimo: audit PO **C4 — Services**.  
3. Smoke UI interattivo Admin (A.8–A.10) resta raccomandato in ambiente di test se non già eseguito dal PO sulla sessione corrente.
