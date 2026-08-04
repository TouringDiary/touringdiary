# MP-03 — Home Bootstrap Barrel Optimization

> **COME** rimuovere dal bootstrap sync della Home le dipendenze inutili introdotte da barrel / import statici non necessari al first paint.  
> **Non** ridefinisce Vision/Principles bootstrap (COSA → `AI_CONTEXT/38_BOOTSTRAP_ARCHITECTURE_SOT.md`).  
> **Non** cambia UX, dominio, contratti Context, né introduce astrazioni di prodotto.
>
> | Layer | Documento |
> |-------|-----------|
> | Architettura bootstrap (COSA) | `AI_CONTEXT/38_BOOTSTRAP_ARCHITECTURE_SOT.md` (DOC-38) |
> | Piano implementativo (COME) | **questo file (MP-03)** |
> | Workflow esecutivo | da aprire **dopo** ACCETTO PO di MP-03 (non automatico) |
>
> Massimo **2 STEP**. Nessuna implementazione da questo file finché non esiste WF dedicato + ACCETTO PO.

**Versione:** 1.0.0  
**Data:** 2026-08-01  
**Stato:** **Approvato** — STEP 1 **Completato** (ACCETTO PO); **STEP 2 implementato → In verifica PO**  
**Prerequisito conoscenza:** DOC-38 (PO-BOOT-03, PO-BOOT-04); strumenti `bundle:audit*` (DOC-38 §9.5)  
**Metodo evidenza:** lettura codice + grafo import statico `node scripts/_bundle_import_trace.mjs` (entry `src/index.tsx`)

---

## Legenda classificazione (obbligatoria)

| Etichetta | Significato |
|-----------|-------------|
| **VERIFICATO** | Codice letto e/o arco presente nel grafo import statico; affermazione ripetibile |
| **DA VERIFICARE** | Serve audit mirato prima di implementare quel punto; decisione bloccata |

Nel documento **non** compaiono asserzioni non classificate.

---

## 1. Obiettivo Masterplan

| Campo | Contenuto | Classificazione |
|-------|-----------|-----------------|
| Obiettivo | Ridurre il JS sync del bootstrap Home eliminando dipendenze non necessarie al first paint | **VERIFICATO** (intento Masterplan) |
| Invariante | Comportamento runtime, UX, dominio e contratti funzionali **invariati** | Vincolo PO (non misura codice) |
| Fuori scope | Lazy “di tutto”; split strutturale `AppProviders`; PO-BOOT-06 endpoint search; refactor estetici; astrazioni premature | **VERIFICATO** (confine Masterplan) |

Allineamento DOC-38: BP-03 / PO-BOOT-03 (solo necessario al first paint); PO-BOOT-04 (intervento bundle solo con effort/beneficio dimostrato — questo MP è il piano COME).

---

## 2. Motivazione (fatti)

| Fatto | Evidenza | Classificazione |
|-------|----------|-----------------|
| Il bootstrap sync raggiunge ~280 file sotto `src/` dal grafo statico depth 14 | Output `scripts/_tmp_boot_audit.txt` generato da `_bundle_import_trace.mjs` | **VERIFICATO** |
| Quattro cluster barrel/import contaminano il bootstrap oltre il bisogno Home | Sezioni §3 | **VERIFICATO** |
| Panel Workspace/MyWorld/Valigia e shell modali Feature/Core/Admin sono già fuori dal sync via `import()` | Codice `WorkspaceHost.tsx`, `ModalManager.tsx`, attività precedenti | **VERIFICATO** |

---

## 3. Analisi architetturale — quattro cluster

### 3.1 Sponsor barrel

| Domanda | Risposta | Classificazione |
|---------|----------|-----------------|
| Problema esiste? | **Sì.** `sponsorService.ts` = `export * from "./sponsors"`. `sponsors/index.ts` riesporta tutti i sotto-servizi. | **VERIFICATO** |
| Import Home | `Sidebar.tsx` e `HomeContent.tsx` importano **solo** `fetchActiveSponsorsResolvedAsync`, `convertSponsorToPoi` da `@/services/sponsorService`. | **VERIFICATO** |
| Catena grafo | `… → Sidebar → sponsorService → sponsors/index → sponsorDashboardService` (e requests/activation/admin/messages/rating/stats/legacy) | **VERIFICATO** |
| Path parallelo già pulito | `BusinessContext` importa `getSponsorsByOwner` da `sponsors/sponsorContractsService` (non dal barrel index) | **VERIFICATO** |
| Dove vivono i simboli Home | `fetchActiveSponsorsResolvedAsync` in `sponsorContractsService.ts`; `convertSponsorToPoi` in `sponsorResolvers.ts` (**non** riesportato da contracts) | **VERIFICATO** |
| Resta nel bootstrap | contracts + resolvers (vetrina) | **VERIFICATO** |
| Esce dal path Home | dashboard, admin stubs, messages, rating, stats, activation, legacy, requests (oggi entrano solo via `sponsors/index`) | **VERIFICATO** |
| Split | Nessun nuovo servizio: retarget import consumer Home | **VERIFICATO** |
| Rischio | Basso — stessi simboli, path diversi | **VERIFICATO** (superficie API) |

### 3.2 aiText barrel

| Domanda | Risposta | Classificazione |
|---------|----------|-----------------|
| Problema esiste? | **Sì.** `aiText.ts` definisce `generateChatReply` e fa `export *` di cityContent/list/people/poi generators. | **VERIFICATO** |
| Unico consumer diretto di `aiText` | `hooks/ui/useHeroLogic.ts` importa `generateChatReply` | **VERIFICATO** (grep repo) |
| `services/ai.ts` nel bootstrap? | **No** — assente dal grafo sync | **VERIFICATO** |
| Catena grafo generators Hero | `… → useHeroLogic → aiText → listGenerator` / `peopleGenerator` / `cityContentGenerator` | **VERIFICATO** |
| Comportamento chat | `generateChatReply` chiama `aiGateway.generateChat` con wrapping errori | **VERIFICATO** |
| Resta | Path chat (`generateChatReply` o equivalente byte-identico → `aiGateway`) + import già separati in Hero: `aiEdgeErrors`, `aiRuntimeStatus` | **VERIFICATO** |
| Esce | I quattro generators **dal path Hero** (quando Hero non importa più `aiText` con `export *`) | **VERIFICATO** |
| Nota seconda via | `poiGenerator` entra **anche** via `cityService → lifecycle → staging` (cluster city) | **VERIFICATO** |
| Rischio | Basso su chat se wrapper invariato; Admin usa `services/ai` (fuori bootstrap) | **VERIFICATO** |

### 3.3 cityService + write path (cluster city)

| Domanda | Risposta | Classificazione |
|---------|----------|-----------------|
| Problema barrel esiste? | **Sì.** `cityService.ts` riesporta cache/read/poi/entities/write/lifecycle/update/tourOperator. | **VERIFICATO** |
| Importer bootstrap del barrel | `useAppInitialization` (`getFullManifestAsync`); `NavigationContext` (`buildVirtualCity`, `getPoisByCityId`); `InteractionContext` (`votePoiAsync`); `useCityData` (`getCityDetails`) | **VERIFICATO** |
| Catena write→staging→AI via barrel | `NavigationContext → cityService → cityWriteService → cityLifecycleService → stagingService → poiGenerator/qualityGenerator` | **VERIFICATO** |
| `cityRead` tira write POI? | `cityReadService` importa da `./poiService` che fa `export *` di `poiRead` **e** `poiWrite` | **VERIFICATO** |
| Simboli read — file reali | `getFullManifestAsync`, `buildVirtualCity`, `getCityDetails` ∈ `cityReadService`; `getPoisByCityId` ∈ `poi/poiRead` | **VERIFICATO** |
| `votePoiAsync` | ∈ `poi/poiWrite.ts`; **non** chiama `evaluateAndUpdateCityStatus`; il file ha però import statico di `cityUpdateService` (usato da save/delete POI nello stesso modulo) | **VERIFICATO** |
| **Path indipendente che tiene write/staging anche senza barrel** | `InteractionContext → photoService` importa staticamente `saveCityDetails` da `cityWriteService` (usato in `propagatePhotoRemoval`, `syncPhotoDescriptionToCity`). `photoService → mediaService`; `mediaService` importa `saveCityDetails` **senza usarlo** (solo riga import). | **VERIFICATO** |
| Conclusione tecnica | Retarget dei soli 4 importer di `cityService` **non basta** a far uscire `cityWrite`/`lifecycle`/`staging` dal bootstrap. Serve anche spezzare l’import statico write in `photoService` (+ import morto in `mediaService`). | **VERIFICATO** |
| Resta | Read/manifest/virtual/details; like foto (`togglePhotoLikeRPC` / `fetchUserPhotoLikes`); `votePoiAsync` (e, finché vive in `poiWrite.ts`, `cityUpdateService` via import di modulo) | **VERIFICATO** |
| Esce (obiettivo STEP 1.C completo) | `cityWriteService`, `cityLifecycleService`, `stagingService` e generators staging dal grafo sync Home | **VERIFICATO** (obiettivo misurabile su grafo) |
| Rischio | Medio — navigation/manifest/vote/foto; più alto se si altera la semantica di `saveCityDetails` invece del solo momento di load | **VERIFICATO** (superficie) |

**Decisione STEP:** non si crea uno STEP separato per `photoService`. Motivo **concreto**: stesso cluster contaminante (city write → lifecycle → staging). Scope STEP 1 “city” = **uscita write/lifecycle/staging dal bootstrap**, non solo rinomina import del barrel.

### 3.4 communityService

| Domanda | Risposta | Classificazione |
|---------|----------|-----------------|
| Problema esiste? | **Sì.** `communityService.ts` riesporta itinerary/post/interaction/suggestion/review/businessStats. | **VERIFICATO** |
| Importer bootstrap del barrel | `itineraryStorageManager.ts` **e** `InteractionContext.tsx` | **VERIFICATO** |
| Simboli usati | Storage: `saveUserDraft`, `getAccessibleDiariesForUser`, `deleteUserDraft`. Interaction: `saveUnifiedReview`. | **VERIFICATO** |
| Via collab | `itineraryService` importa staticamente `permissionService`, `diaryCollaborationService`, `viaggioService` (`createViaggio`, `ensureViaggioForPersonalDiary`, `setActiveDiary`, `updateViaggio`) | **VERIFICATO** |
| Uso collab in funzioni | `canUserModifyResource` in ramo collab di `saveUserDraft`; `fetchCollaborativeDiaryIdsForMember` in `getAccessibleDiariesForUser`; viaggio in `resolveSaveUserDraftViaggio` / save cloud | **VERIFICATO** |
| Guest LS | `ItineraryStorageManager.loadProjects/saveProject` per guest usa solo `storageService` (non chiama cloud); il **parse** di `itineraryService` avviene comunque perché l’import del barrel/modulo è statico | **VERIFICATO** |
| Dipendenza da `cityService` barrel? | **No.** `reviewService` importa `city/cityCache`. `itineraryService` non importa `cityService`. | **VERIFICATO** |
| Dipendenza inversa city→community? | Nessun import `community` sotto `src/services/city/` | **VERIFICATO** |
| Resta (funzione) | Draft diary + review | **VERIFICATO** |
| Esce (parse Home) | Albero collaboration/viaggio e moduli community non usati tirati dal barrel (`post`, `suggestion`, …) | **VERIFICATO** (presenza attuale); **meccanica** di defer → §5.2 audit |
| Rischio | Alto — Diario cloud, ACL, Viaggio | **VERIFICATO** (superficie) |

---

## 4. Classificazione A / B / C (servizi)

| Modulo | Classe | Motivazione | Classificazione |
|--------|--------|-------------|-----------------|
| `sponsorContractsService` + `sponsorResolvers` | **A** DEVE RESTARE | Simboli vetrina Home | **VERIFICATO** |
| Path Home → `sponsors/index` | **B** PUÒ USCIRE | Solo aggregatore Admin/extra | **VERIFICATO** |
| Chat Hero (`generateChatReply` / `aiGateway`) | **A** | UX Hero | **VERIFICATO** |
| Generators via `aiText` `export *` sul path Hero | **B** | Non usati da `useHeroLogic` oltre al barrel | **VERIFICATO** |
| `aiText.ts` (chat + generators nello stesso entry) | **C** VA SPLITTATO (load path) | Un entry forza generators | **VERIFICATO** |
| `cityRead` + `cityCache` + `poiRead` | **A** | Manifest / virtual / details | **VERIFICATO** |
| `cityWrite` / `lifecycle` / `staging` sul bootstrap | **B** | Non first paint; entrano via barrel **e** `photoService` | **VERIFICATO** |
| `poiService` barrel usato da `cityRead` | **C** | Read non deve importare write | **VERIFICATO** |
| `votePoiAsync` | **A** finché Interaction globale | Comportamento voto | **VERIFICATO** |
| `photoService` like API | **A** | Usata da Interaction al boot user | **VERIFICATO** |
| Import statico `saveCityDetails` in `photoService` | **B/C** | Defer load write | **VERIFICATO** |
| Import inutilizzato `saveCityDetails` in `mediaService` | **B** | Nessun uso nel file | **VERIFICATO** |
| `reviewService` / draft API | **A** (funzione) | Comportamento | **VERIFICATO** |
| `communityService` barrel sul path Home | **B** | Riesporta troppo | **VERIFICATO** |
| Import statici collab/viaggio in `itineraryService` | **C** | Parse collab anche per guest | **VERIFICATO** |
| Collaboration/viaggio albero sync Home | **B** | Non first paint | **VERIFICATO** |

---

## 5. Suddivisione STEP (confermata)

### 5.1 Perché due STEP (non tre)

| Ipotesi | Esito | Classificazione |
|---------|-------|-----------------|
| Separare `photoService` in STEP proprio | **Rifiutata** — stesso cluster city write/staging; un terzo STEP senza confine di rischio diverso | **VERIFICATO** |
| Mettere community in STEP 1 | **Rifiutata** — rischio Diario alto; indipendente da city barrel; smoke dedicati | **VERIFICATO** |
| Sponsor + aiText + city (incluso photo write edge) in STEP 1 | **Confermata** — tre interventi indipendenti; city ampliato per completezza grafo | **VERIFICATO** |

```text
STEP 1  Sponsor + aiText + city write/staging fuori bootstrap
   ↓  (ACCETTO PO STEP 1)
STEP 2  communityService / itinerary load-time
```

### 5.2 Dipendenze tra STEP

| Relazione | Fatto | Classificazione |
|-----------|-------|-----------------|
| STEP 2 richiede STEP 1? | **No** per correttezza dipendenze moduli (community ↛ cityService barrel) | **VERIFICATO** |
| Ordine consigliato STEP 1 → STEP 2 | Sì — riduce variabili e chiude unused JS prima del lavoro ad alto rischio Diario | Criterio di piano (non dipendenza codice) |
| city richiede community? | **No** | **VERIFICATO** |

---

# STEP 1 — Sponsor + aiText + city (write/staging)

### Scopo

Far uscire dal grafo sync Home: sotto-servizi sponsor non-vetrina; generators AI del path Hero; `cityWrite` / `lifecycle` / `staging` (e generators staging).

### Cosa entra

1. **Sponsor:** retarget import in `Sidebar.tsx`, `HomeContent.tsx`.  
2. **aiText:** `useHeroLogic` non importa più `aiText` con `export *` generators; mantiene comportamento `generateChatReply`.  
3. **city:** retarget 4 importer `cityService`; `cityRead` → `poi/poiRead`; defer/remove import statico `saveCityDetails` in `photoService` / `mediaService`.

### Cosa NON entra

- `communityService`, `itineraryService`, collaboration, Viaggio load-time  
- Split `AppProviders`  
- Lazy UI non legate ai tre cluster  
- Modifiche Admin consumer del barrel `cityService` / `sponsorService` (restano validi fuori Home)

### Perché insieme

Interventi a rischio basso/medio, **senza** dipendenze reciproche di codice; smoke disgiunti; un solo checkpoint PO.

### Impatto bootstrap (atteso, misurabile post-implementazione)

| Misura | Criterio | Classificazione pre-codice |
|--------|----------|----------------------------|
| Grafo | Assenti: `sponsors/index` children non-vetrina dal path Sidebar/Home; generators da `aiText` via Hero; `stagingService`, `cityLifecycleService` | Obiettivo STEP — **DA VERIFICARE** post-patch con trace |
| Bundle / Lighthouse Unused JS | Riduzione vs baseline pre-STEP 1 | **DA VERIFICARE** post-build |

### Rischio STEP 1

| Area | Livello | Note |
|------|---------|------|
| Sponsor | Basso | Solo specifier import |
| aiText | Basso | Un consumer diretto |
| city read retarget | Medio | Manifest / virtual / details |
| photo write defer | Medio | Solo se si altera semantica save invece del load |

### Benefici attesi

Unused JS / parse bootstrap: rimozione cluster sponsor Admin, generators Hero, staging/AI city.

### Strategia implementazione (senza codice in questo documento)

**1.A Sponsor** — In Sidebar/HomeContent: import `fetchActiveSponsorsResolvedAsync` da `sponsorContractsService`; `convertSponsorToPoi` da `sponsorResolvers`. Non modificare `sponsors/index.ts` (Admin).

**1.B aiText** — Far sì che Hero non carichi i generators: es. spostare `generateChatReply` in modulo senza `export *` generators, oppure far chiamare a Hero lo stesso wrapping verso `aiGateway` senza importare `aiText`. Lasciare `services/ai.ts` → generators per Admin.

**1.C city**  
1. `useAppInitialization` / `NavigationContext` / `useCityData` → `cityReadService` / `poi/poiRead` per i simboli read.  
2. `InteractionContext` → `votePoiAsync` da `poi/poiWrite` (non da `cityService`).  
3. `cityReadService`: import POI da `./poi/poiRead` (+ mapper), non da `./poiService`.  
4. `photoService`: nessun import statico top-level di `cityWriteService`; load di `saveCityDetails` solo dentro le funzioni che lo chiamano (`propagatePhotoRemoval`, `syncPhotoDescriptionToCity`).  
5. `mediaService`: rimuovere import inutilizzato di `saveCityDetails`.

### File coinvolti STEP 1 (elenco completo previsto)

| File | Intervento |
|------|------------|
| `src/components/layout/Sidebar.tsx` | 1.A |
| `src/components/home/HomeContent.tsx` | 1.A |
| `src/hooks/ui/useHeroLogic.ts` | 1.B |
| `src/services/ai/aiText.ts` e/o **eventuale** nuovo file solo per `generateChatReply` | 1.B |
| `src/services/ai.ts` | 1.B solo se serve mantenere re-export Admin |
| `src/hooks/core/useAppInitialization.ts` | 1.C |
| `src/context/NavigationContext.tsx` | 1.C |
| `src/context/InteractionContext.tsx` | 1.C |
| `src/hooks/useCityData.ts` | 1.C |
| `src/services/city/cityReadService.ts` | 1.C |
| `src/services/photoService.ts` | 1.C |
| `src/services/mediaService.ts` | 1.C |

`cityService.ts` / `sponsorService.ts` / `sponsors/index.ts`: **non obbligatori** da modificare (facade legacy).

### Smoke test STEP 1

1. Cold load `/` guest — Home senza errori nuovi  
2. Hero filtri/search  
3. Hero AI chat (available / unavailable) — stesso wrapping errori  
4. Griglia + apertura città  
5. Sidebar senza/con città + sponsor  
6. Card sponsor Home  
7. Around Me / virtual city  
8. Voto POI (utente)  
9. Like foto (utente)  
10. Path Admin: sponsor dashboard; save city details; una generate AI Admin  
11. Trace import post-patch + (consigliato) `bundle:audit`

### Criteri di accettazione STEP 1

- Smoke § sopra OK (comportamento invariato)  
- Grafo: `stagingService` e `cityLifecycleService` assenti dal bootstrap sync  
- Grafo: `sponsorDashboardService` / `sponsorAdminStubs` / `sponsorMessagesService` / `sponsorRatingService` assenti dal path Home  
- Grafo: `listGenerator` / `peopleGenerator` / `cityContentGenerator` non raggiungibili da `useHeroLogic`  
- Nessun cambio contratto Context

### Criteri di rollback STEP 1

Revert git dei soli file STEP 1; rieseguire smoke; nessuna migration DB.

### Audit STEP 1

| Stato | Audit |
|-------|-------|
| **Conclusi** | Barrel sponsor + simboli Home; BusinessContext contracts; aiText unico consumer + assenza `services/ai` dal grafo; 4 importer cityService; cityRead→poiService; votePoiAsync vs cityUpdate; photoService→cityWrite; mediaService import morto; indipendenza da community |
| **Ancora necessari prima di chiudere STEP 1 (post-codice)** | Trace + bundle dopo patch (accettazione misura) — non bloccano l’**inizio** codice |
| **Ancora necessari prima di iniziare STEP 1** | **Nessuno** |

---

# STEP 2 — communityService

### Scopo

Far uscire dal parse sync Home l’albero collaboration/viaggio e i moduli community non usati, mantenendo draft Diario e `saveUnifiedReview`.

### Cosa entra

- Retarget `InteractionContext` → `reviewService`  
- Retarget `itineraryStorageManager` fuori dal barrel completo  
- Eliminazione import **statici top-level** collab/viaggio da `itineraryService` (o equivalente load on-demand nelle funzioni cloud) senza cambiare regole ACL/Viaggio

### Cosa NON entra

- Sponsor / aiText / city STEP 1  
- Redesign dominio Viaggio/collab  
- Split AppProviders

### Perché isolato

Rischio Diario alto; smoke dedicati; indipendenza moduli da city barrel.

### Impatto bootstrap

Uscita dal sync di `services/collaboration/*`, parti `viaggio/*` caricate oggi da `itineraryService`, e `post`/`suggestion`/… via barrel — **DA VERIFICARE** post-patch su grafo.

### Rischio

**Alto** (save/load cloud, collab, Viaggio, ghost delete).

### Benefici attesi

Riduzione unused JS collaboration sul boot guest/Home.

### Strategia (alto livello; dettaglio tecnico dopo audit §)

1. Import puntuali review/draft.  
2. Nessun `export *` community sul path Home.  
3. Collab/viaggio non valutati al parse modulo per il solo mount provider — load nelle funzioni che li usano.

### File coinvolti STEP 2 (elenco previsto)

| File | Note |
|------|------|
| `src/context/InteractionContext.tsx` | `saveUnifiedReview` da `reviewService` |
| `src/services/itineraryStorageManager.ts` | Import draft non via barrel completo |
| `src/services/community/itineraryService.ts` | Cuore defer collab/viaggio |
| Eventuale file split diary-cloud | **Solo se** l’audit § lo impone come unica via a comportamento identico |
| `src/services/communityService.ts` | Opzionale (resta facade non-Home) |

### Smoke test STEP 2

1. Guest: CRUD Diario LS + reload  
2. User: load bozze accessibili; save; Salva con nome / ensure Viaggio  
3. Diario collaborativo: permessi invariati  
4. Delete draft + ghost IDs  
5. Review POI  
6. Path community non-Home (explorer/Q&A/suggestion) OK  
7. Trace: collaboration non nel sync guest Home (o solo dopo azione che li carica)

### Criteri di accettazione / rollback STEP 2

Come smoke; grafo senza albero collab in sync Home; revert solo file STEP 2.

### Audit STEP 2

| Stato | Dettaglio |
|-------|-----------|
| **Conclusi** | Barrel community; due importer bootstrap; simboli usati; import statici collab/viaggio; call-site principali in save/getAccessible; indipendenza da cityService barrel; guest LS non chiama cloud ma parse comunque |
| **Ancora necessari PRIMA di implementare STEP 2** | Vedi sotto |

#### Audit ancora necessari (bloccano solo STEP 2, non STEP 1)

| ID | Perché serve | File da verificare | Decisione che dipende |
|----|--------------|--------------------|------------------------|
| **A2-1** | Elenco completo call-site di `createViaggio`, `ensureViaggioForPersonalDiary`, `setActiveDiary`, `updateViaggio`, `canUserModifyResource`, `fetchCollaborativeDiaryIdsForMember` per scegliere dynamic import per-funzione senza lasciare import statici residui | `community/itineraryService.ts` (intero) | Forma esatta del defer load |
| **A2-2** | Verificare se altri importer sync (oltre storage/Interaction) tirano `communityService` o `itineraryService` dopo i retarget previsti | grafo post-ipotesi / grep consumer | Scope file STEP 2 |
| **A2-3** | Confermare che `reviewService` non importa collaboration | `community/reviewService.ts` (già: solo supabase/types/cityCache — **parzialmente VERIFICATO**; riesecuzione checklist in A2) | Sicurezza retarget Interaction |

---

## 6. Ordine di implementazione consigliato

```text
PO: ACCETTO MP-03
    ↓
Aprire WF esecutivo (1 STEP MP = 1 WF o fasi interne WF — decisione PO)
    ↓
STEP 1.A Sponsor → smoke + trace
STEP 1.B aiText → smoke Hero/Admin AI + trace
STEP 1.C city (+ photo/media write edge) → smoke Home/nav/vote/foto + Admin city + trace
    ↓
ACCETTO PO STEP 1
    ↓
Audit A2-1…A2-3
    ↓
STEP 2 → smoke Diario + trace
    ↓
ACCETTO PO STEP 2 / chiusura MP-03
```

---

## 7. Criteri globali Masterplan

1. Zero regressioni funzionali/UX sui smoke  
2. Solo rimozione dipendenze bootstrap inutili  
3. Ogni chiusura STEP: trace (+ bundle consigliato) con etichetta **VERIFICATO** post-codice  
4. Rollback per-STEP  
5. DOC-38 aggiornato solo con puntatori/fatti; conoscenza architetturale non duplicata qui

---

## 8. Gate: inizio STEP 1

| Domanda | Risposta |
|---------|----------|
| Masterplan completo su evidenze STEP 1? | **Sì** |
| Audit bloccanti pre-STEP 1? | **Nessuno** |
| Pronto per iniziare STEP 1? | **Sì, dopo ACCETTO PO di MP-03** e apertura WF esecutivo |
| Pronto per STEP 2? | **No** — completare A2-1…A2-3 dopo STEP 1 (o in parallelo analisi, non codice) |

---

## 9. Riferimenti evidenza

| Artefatto | Uso |
|-----------|-----|
| `scripts/_bundle_import_trace.mjs` | Grafo statico |
| `scripts/_tmp_boot_audit.txt` | Snapshot trace usato per questo MP (rigenerabile) |
| DOC-38 §9.5 | Strumenti bundle audit |
| Codice file citati in §3 | Lettura diretta 2026-08-01 |

---

## 10. Changelog MP-03

| Data | Ver | Nota |
|------|-----|------|
| 2026-08-01 | 1.0.0 | Prima edizione SoT implementativa; cluster photoService→cityWrite incluso in STEP 1; audit A2-* per STEP 2 |
| 2026-08-01 | 1.1.0 | **STEP 1 implementato**: Sponsor import puntuali; `aiChat` per Hero; city read/poiRead + `saveCityDetails` demand-load in photo; media import morto rimosso. Trace: staging/lifecycle/cityWrite/aiText generators/sponsor Admin **assenti** dal bootstrap sync. |
| 2026-08-01 | 1.2.0 | **STEP 2 implementato** (A2-1…A2-3 chiusi): Interaction→`reviewService`; storage→`itineraryService`; collab/viaggio via `import()` on-demand. Trace: `communityService` barrel, post/suggestion, collaboration/*, viaggioService **assenti** dal sync bootstrap. |
