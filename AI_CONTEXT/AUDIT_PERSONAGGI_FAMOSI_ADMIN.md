# AUDIT — Personaggi famosi (Admin) — Contratto implementazione

> **Tipo:** Decisioni consolidate · requisiti definitivi · architettura · punti pronti allo sviluppo  
> **Data:** 2026-08-28 (audit **ciclo 4** — verifica evidenze + classificazione reale)  
> **Scope:** Admin Panel → Manager POI → DB → Edit Città → Storia → **Personaggi famosi** (+ allineamento flussi città correlati)  
> **Stato implementazione codice:** **NON AVVIATA**  
> **Evidenze / flussi reali:** [`AUDIT_PERSONAGGI_FAMOSI_ADMIN_INVESTIGATION.md`](./AUDIT_PERSONAGGI_FAMOSI_ADMIN_INVESTIGATION.md)

---

## ⛔ Regola di processo (bloccante)

**NON È CONSENTITO AVVIARE L'IMPLEMENTAZIONE FINCHÉ TUTTI I PUNTI NECESSARI ALL'INTERVENTO NON HANNO RAGGIUNTO RISCHIO BASSO E FIGURANO NELLA SEZIONE «PUNTI PRONTI ALLO SVILUPPO».**

«RISCHIO BASSO» = evidenze di codice + design verificato sufficienti per implementare **senza improvvisare**.  
**Non** significa «abbiamo scritto una possibile soluzione».

---

# Regole permanenti

1. Codice corretto, tipizzato, manutenibile, accessibile, Biome, coerente col repo.
2. Obbligatori: TypeScript · Biome · React · ARIA · focus · `inert` · responsive · mobile · manutenibilità · testabilità.
3. **Vietato:** hack · workaround · magic numbers · duplicazioni evitabili · config AI duplicate · codice morto · `any` non necessari · cast per aggirare tipi · `@ts-ignore` · `@ts-expect-error` · soppressioni Biome · warning nascosti.
4. SoT esistenti: `famousPersonCompleteness.ts` (publish gate).
5. Output AI = non affidabile fino a parser/validazione dominio.
6. Errore di fase **non** cancella lavoro già persistito.
7. **Mai** cancellare automaticamente personaggi esistenti (solo delete manuale admin, o delete città intera).
8. **Mai** inventare dati per riempire quantità o campi.
9. Salvataggio = persistenza di dati già prodotti — **mai** nuova chiamata AI per salvare.
10. Gate qualità: `npm run check` (WF-QUAL-01).

---

# Concetti SEPARATI (verificati nel codice — ciclo 4)

| Concetto | Cosa è oggi | Dove | Tocca personaggi? | Cancella personaggi? |
|----------|-------------|------|-------------------|----------------------|
| **Magic Fix (personaggio)** | `wipeAndRewritePerson` / batch | `CulturePeople.tsx` → `usePeopleAI.ts` | Sì, uno o N | **No** (upsert stesso `id`) |
| **RIGENERA PAGINA (Storia)** | Rigenera Cultura | `TabCulture.tsx` + `editorCultureRegeneration.ts` | Sì | **Sì** (replace: insert nuovi → delete vecchi) |
| **Completa Città (AI)** | Complete City | `CitiesListTab` → `useAiCompleteCity.ts` | Sì | **Sì** (delete-all se prepared>0) |
| **+ Città (AI) / Genera Tutto** | Magic Add (= «Magic City» in audit) | `CityGeneratorModal` → `useAiMagicCity.ts` | Sì (insert) | **No** |
| **RIGENERA PAGINA (altri tab)** | Generali / Valutazioni / Info | `TabGeneral`, `TabRatings`, `EditorInfo` | No | No |

**Non esiste** un pulsante editor «Rigenera tutto» che attraversa Generali→…→Log.  
L’orchestrazione multi-tab più vicina è **Completa Città (AI)** (lista città), non Magic Fix personaggio.

**Correzione ciclo 3:** non rinominare Magic Fix in «Rigenera tutto (avanzato)» — confonderebbe con **Genera Tutto** (Magic Add) e con **RIGENERA PAGINA**.

### Destino Magic Fix (decisione ciclo 4)

- **Magic Fix personaggio** resta come comando Admin Personaggi famosi.
- Implementazione default: **gap-driven** (`analyzePersonGaps` + fix mirato).
- `wipeAndRewritePerson` monolitico: **sostituito** come default; eventuale «Riscrivi tutti i dati (distruttivo)» solo con conferma esplicita e label **distinta** da Genera Tutto / Rigenera Pagina / Completa Città.
- **Non toccare** i comandi città Completa Città / Genera Tutto / RIGENERA PAGINA (tab), salvo allineamento people: **no delete automatico** + esclusioni + count SoT.

---

# Requisiti funzionali definitivi

| ID | Requisito |
|----|-----------|
| RF-01 | Count discovery **1 / 3 / 5 / 10** — no 15, no 20 |
| RF-02 | SoT unica count + esclusioni su tutti gli entry point people |
| RF-03 | «Fino a N» famosi reali — **non inventare** per riempire |
| RF-04 | One-click F1→F2→F3→F4; errore su persona C **non** blocca D,E; C salvata parziale |
| RF-05 | Biografia: solo verificabile; conflitto irrisolto → omettere; personaggio può restare non pubblicabile |
| RF-06 | `bio` derivata da `fullBio`; niente `bio ?? fullBio` |
| RF-07 | Coda discovery + scarti persistiti; importati **restano** in coda come `imported` (storico + esclusione) |
| RF-08 | Esclusioni: presenti + scartati + pending + imported + duplicati |
| RF-09 | Import non elimina altri pending |
| RF-10 | Checkpoint post-fase = `saveCityPerson` / upsert discovery — **zero** AI call sul save |
| RF-11 | Magic Fix gap-driven (vedi sopra) |
| RF-12 | Fallimento immagine non blocca testo; retry solo ritratto |
| RF-13 | Publish gate invariato |
| RF-14 | Diagnostica publish rossa per campo + `aria-describedby` |
| RF-15 | Citazione opzionale; assente → nessun box |
| RF-16 | Premi/opere sinistra: **tutti** i validi (UI scrollabile); no limite dominio «max 2»; no filler; contributo da fullBio solo se derivabile |
| RF-17 | Luoghi: validità **semantica**, no soglia caratteri notes; 0 → no sezione |
| RF-18 | Layout sinistra/destra; scroll bio/luoghi indipendenti; nascita/morte restano |
| RF-19 | `city_id` obbligatorio su `city_people` (già OK) |
| RF-20 | Bootstrap messages incluso nell’intervento |
| RF-21 | Complete City / Rigenera Cultura / Magic Add: **mai** delete automatico people; escludere anche scarti |

---

# Architettura consolidata (ciclo 4 — corretta)

## A. Moduli

| Modulo | Path | Ruolo |
|--------|------|-------|
| Count + esclusioni + normalize | `src/domain/city/famousPersonDiscovery.ts` | SoT count, exclusion list |
| Bio / contributo | `src/domain/city/famousPersonBio.ts` | `deriveBioTeaser`, `deriveNotabilityLine` |
| Luoghi | `src/domain/city/famousPersonRelatedPlaces.ts` | validazione semantica + dedupe + ID stabili |
| Gaps | `src/domain/city/famousPersonGaps.ts` | `analyzePersonGaps` |
| Completeness + messaggi | `famousPersonCompleteness.ts` | SoT publish + `getFamousPersonFieldBlockMessage` |
| Modelli people | `src/services/ai/aiModelConfig.ts` | vedi §E |
| Parser AI | `src/services/ai/parsers/famousPersonAiParser.ts` | unico confine AI→dominio |
| Discovery DB | `src/services/city/famousPersonDiscoveryService.ts` | CRUD items |
| Bio F2 | `personBiographyGenerator.ts` | ricerca profonda |
| Pipeline | `famousPersonPipeline.ts` | one-click + resume + continue-on-error |
| Gap fix | `famousPersonGapFix.ts` | Magic Fix |
| Inert | `src/focus/setInert.ts` | React 18 |

## B. Tabella `city_people_discovery_items` (una sola — sufficiente)

Colonne: `id`, `city_id` FK CASCADE, `normalized_name`, `display_name`, `status` (`pending`\|`discarded`\|`imported`), `discovery_payload` jsonb, `source_query`, `discovery_run_id`, `imported_person_id` FK SET NULL, timestamps.

- `UNIQUE (city_id, normalized_name)`
- Indice `(city_id, status)`
- RLS admin come `famous_person_suggestions`
- **Imported non si cancella** dalla coda: resta `imported` per esclusione/storico
- Re-discovery: skip se status ∈ {discarded, imported}; upsert payload solo se `pending`

Flussi: F1 upsert pending → Import/pipeline → `imported` + link person → Admin scarta → `discarded` → ripristino → `pending` → enrich scarto = F2/F3 su payload senza cambiare status finché non importato.

## C. Pipeline one-click

```
F1 discovery → persist pending
FOR EACH candidate (sequenziale, throttle 5s):
  try:
    F2 → parse → validate → saveCityPerson (checkpoint)
    F3 → derive bio + luoghi + completeness non inventiva → save
    F4 → portrait se manca imageUrl → save o skip classificato
    mark discovery imported
  catch (personError):
    save partial già prodotto; log gap; CONTINUE next person
```

Stato persona = dati + `analyzePersonGaps`.  
Resume: skip fasi/gap già soddisfatti — **nessuna** AI call se gap assente.

## D. Anti-invenzione (assoluta)

- Prompt: blocco condiviso (discovery + F2 + completeness + dates + Magic Fix).
- Parser: rifiuta filler; omette campi dubbi; array discovery `length <= count`.
- Completeness / Magic Fix: se AI non restituisce dato verificabile → **campo resta mancante** → non pubblicabile. **Niente** inventare per chiudere il gate.
- Rimuovere `bio ?? fullBio` in `toDraftFromInput`.
- Admin può correggere manualmente e pubblicare.

## E. Modelli AI people (SoT — IDs **provati nel repo**)

```typescript
// aiModelConfig.ts — people only
export const AI_MODEL_PEOPLE_TEXT = 'gemini-3.6-flash';      // già usato in suggestCityPeople
export const AI_MODEL_PEOPLE_IMAGE = 'gemini-2.5-flash-image'; // già usato in generateHistoricalPortrait + SafeArt/social
```

**Correzione ciclo 3:** non adottare `gemini-3.6-flash-image` senza prova live — **non compare** nel codebase; l’ID immagine già operativo è `gemini-2.5-flash-image`.

Migrare a SoT: `peopleGenerator` enrich (oggi 2.5-flash testo), `peopleCompletenessPipeline`, `aiVision` portrait path.  
**Fuori scope:** POI / planner / cityContent / Edge default 2.0.

## F. Count SoT

`PEOPLE_DISCOVERY_COUNTS = [1,3,5,10]` + `assertPeopleDiscoveryCount` / `nearestPeopleDiscoveryCount` (15→10).

Entry point: CulturePeople, usePeopleAI, TabCulture, EditorCulture (legacy), editorCultureRegeneration, CompleteCityModal+useAiCompleteCity, useAiMagicCity.

## G. Delete people — inventario completo

| Path | Tipo | Azione intervento |
|------|------|-------------------|
| `useAiCompleteCity` delete-all | AI automatico | **Rimuovere** |
| `TabCulture` / `EditorCulture` `removeCityPeopleByIds` | AI automatico | **Rimuovere** |
| `editorCultureRegeneration` rollback insert fallito | rollback tecnici nuovi ID | OK (solo creati in questa run) |
| `usePeopleData.deletePerson` | Manuale admin | **Conservare** |
| `deleteCity` → delete by city_id | Delete città | **Conservare** |
| `famousPersonSuggestionService` rollback accept | rollback | OK |
| Magic Fix upsert | overwrite campi | → gap-driven, no wipe |
| Magic Add | insert only | OK + esclusioni |

## H. Magic Fix gap matrix

Gap: `name` \| `fullBio` \| `bio` \| `imageUrl` \| `categories` \| `dates` \| `relatedPlaces` \| `invalidRelatedPlaces`.  
Opzionali non-gap-publish: quote, awards, famousWorks, careerStats.

- `bio` da `deriveBioTeaser` se fullBio ok (no AI).
- Categorie: solo UI.
- Merge: solo campi del gap; vietato `...enrichedData` sull’intero person.

## I. Checkpoint

`AI → parse → validate → saveCityPerson/discoveryService`.  
Save **non** richiama AI. Resume legge DB e `analyzePersonGaps`.

## J. Bio breve

`deriveBioTeaser(fullBio, { maxChars: 280 })`. Fallback AI bio solo se fullBio assente.

## K. Luoghi

Valido se: name + address non vuoti, coords finite (rifiuta stub `(0,0)` senza address reale), significato biografico (prompt + filtro stub vuoti).  
**Nessuna** soglia `notes.length >= 10`.  
Dedupe + ID stabile in parser. UI: 0/N, scroll.

## L. Premi / opere / contributo

No nuova colonna DB.  
Persistire **tutti** awards/famousWorks validi trovati.  
UI sinistra: scroll orizzontale/verticale compatto — **no** truncate dominio a 2.  
Se assenti: `deriveNotabilityLine(fullBio)` solo se non generico; altrimenti nascondi blocco.

## M. Layout + careerStats

**Layout target (definitivo):**

- Sinistra: foto · premi/opere/contributo · nome · categoria · nascita · morte se applicabile  
- Destra: citazione (se c’è) · bio scroll · luoghi scroll  

**careerStats (verificato ciclo 4):**

- Colonna DB `career_stats` + parse + save: **vivi**
- Schema prompt people: **non** richiesto oggi → raramente popolato
- Render pubblico: `CultureCornerModal` griglia se `length > 0`
- Admin: non editabile

**Decisione tecnica:** non eliminare colonna/dati.  
Includere `careerStats` opzionale in schema F2 (solo verificati).  
UI: se presenti, fascia **compatta** `shrink-0` tra citazione e bio (non dentro lo scroll bio; non nella sinistra premi/opere). Se vuoti → non mostrare.

## N. Diagnostica publish

Estendere SoT con messaggi per gap; UI rossa + `aria-describedby`. Gate invariato.

## O. Parser AI → dominio

Unico confine `famousPersonAiParser`.  
Eliminare cast `as PersonEnrichmentResult`.  
`parsePerson` sanitizza `related_places` / `career_stats` al load.

## P. React key

Causa: `place.id` vuoto/duplicato; `careerStats` label:value duplicabili.  
Fix: ID/dedupe in parser prima del render.

## Q. Immagini / errori

Oggi `generateHistoricalPortrait` **inghiotte** errori → `null` (nessuna classificazione al caller).

Target: Result tipizzato `{ ok, url? } | { ok:false, class: 'QUOTA'|'TRANSIENT'|'OTHER', message }`.  
Heuristics su messaggio + `AiEdgeError` dove disponibile.  
`withRetry` oggi collassa 429+quota in `QUOTA_EXCEEDED_DAILY` — migliorare dove possibile; se ambiguo: 1 retry TRANSIENT, no loop.  
Pipeline: save testo prima di F4; F4 fail → draft; `regeneratePortrait` già esiste — migliorare feedback.

## R. Performance / ripresa

Affidabilità > velocità. Skip fasi/gap già ok. Throttle 5s. Budget ~35–60 call/10 persone accettabile.

---

# ## Punti pronti allo sviluppo — RISCHIO BASSO

Elenco **solo** punti con evidenza + design verificato (ciclo 4).  
Numero = esito audit, non target prefissato.

| # | Punto | Stato | Nota minima |
|---|-------|-------|-------------|
| 1 | Coda discovery + scarti | **PRONTO / BASSO** | Tabella unica; imported persistito; flussi F1/import/scarto/ripristino/esclusione definiti |
| 2 | Pipeline one-click | **PRONTO / BASSO** | Continue-on-person-error; stati via gaps; F1–F4 |
| 3 | Biografia + anti-invenzione | **PRONTO / BASSO** | Prompt+parser+no invent per publish; rimuovere bio??fullBio |
| 4 | Modelli AI people | **PRONTO / BASSO** | SoT: text `3.6-flash`, image `2.5-flash-image` (IDs già in uso nel repo) |
| 5 | Mai delete automatico people | **PRONTO / BASSO** | Inventario path completo; fix Complete City + Rigenera Cultura |
| 6 | Count SoT 1/3/5/10 | **PRONTO / BASSO** | 7+ entry point mappati |
| 7 | Fino a N | **PRONTO / BASSO** | Prompt + validazione `length<=count` |
| 8 | Esclusioni (presenti+scarti+pending+imported) | **PRONTO / BASSO** | `buildPeopleDiscoveryExclusionList` |
| 9 | Magic Fix gap-driven | **PRONTO / BASSO** | Distinto da Genera Tutto / Completa Città / RIGENERA PAGINA |
| 10 | Salvataggio progressivo | **PRONTO / BASSO** | Checkpoint = save post-validate; zero AI sul save |
| 11 | Bio breve da fullBio | **PRONTO / BASSO** | `deriveBioTeaser` |
| 12 | Luoghi significativi | **PRONTO / BASSO** | Validità semantica; no soglia notes; no max count |
| 13 | Premi/opere/contributo | **PRONTO / BASSO** | No colonna nuova; no max 2; UI scroll |
| 14 | Layout + careerStats | **PRONTO / BASSO** | Layout confermato; careerStats preservato, fascia tra quote e bio |
| 15 | Diagnostica publish | **PRONTO / BASSO** | SoT + messaggi rossi + ARIA |
| 16 | AI JSON → dominio | **PRONTO / BASSO** | Parser unico; cast da eliminare |
| 17 | React key | **PRONTO / BASSO** | Fix dati/ID in parser |
| 18 | Immagini / 429 / quota | **PRONTO / BASSO** | Result tipizzato; F4 non bloccante; regeneratePortrait |
| 19 | Performance + ripresa | **PRONTO / BASSO** | Skip gap; continue; throttle |

**Punti NON pronti:** nessuno tra i 19 sopra.  
**Decisioni prodotto aperte:** nessuna bloccante (vedi Investigation per checklist pre-deploy non bloccante).

---

# Criteri di accettazione (sintesi)

1. SoT count + fino-a-N + esclusioni su tutti gli entry point.  
2. One-click; errore persona non ferma le altre; resume senza rifare fasi ok.  
3. Discovery/scarti/imported persistiti.  
4. No delete-all AI su people.  
5. Magic Fix gap-driven; comandi città intatti salvo people-safe.  
6. Anti-invenzione end-to-end.  
7. Layout + scroll; careerStats non distruttivo.  
8. Publish diagnostica; `npm run check`; no warning key/inert sul flusso.

---

# Riferimenti

| Documento | Ruolo |
|-----------|--------|
| [`AUDIT_PERSONAGGI_FAMOSI_ADMIN_INVESTIGATION.md`](./AUDIT_PERSONAGGI_FAMOSI_ADMIN_INVESTIGATION.md) | Evidenze, flussi reali, correzioni ciclo 3→4 |
| [`17_CITY_CULTURE_SYSTEM.md`](./17_CITY_CULTURE_SYSTEM.md) | SoT descrittivo (aggiornare a implementazione) |

---

# Changelog

| Data | Nota |
|------|------|
| 2026-08-28 | Ciclo 1–2: split contratto/investigation |
| 2026-08-28 | Ciclo 3: design tecnico (alcune ipotesi non verificate) |
| 2026-08-28 | **Ciclo 4:** verifica codice; separazione Magic Fix vs Genera Tutto vs Completa Città vs RIGENERA PAGINA; correzione model image; careerStats; luoghi/premi senza limiti artificiali; sezione Punti pronti 19/19 |
