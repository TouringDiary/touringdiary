# Audit orari e giorni di apertura

Data dell'audit originale: 2026-10-01. Fotografia AS-IS riletta sul codice: 2026-10-06.

Questo documento non applica il modello canonico. Il modello della sezione 15 resta **PROPOSTA / NON IMPLEMENTATA**.

Il passthrough Admin di orari e sottocategoria è implementato nel salvataggio del form. Non unifica i modelli e non migra i dati. È comportamento attuale, descritto nella sezione 5 bis.

Questo aggiornamento non ha riletto il database. I conteggi e l'elenco delle stringhe della versione 2026-10-01 restano una fotografia storica: **NON RIVERIFICATI**.

## 1. Executive Summary

TouringDiary non ha un solo modello di orario. Nel codice ne convive almeno quattro.

| Modello | Dove | Cosa rappresenta |
| --- | --- | --- |
| Oggetto `{ days, morning, afternoon, evening?, isEstimated }` | Dominio `OpeningHours`, form admin POI, staging, lettura pubblica | Giorni `Lun`–`Dom` più fino a tre fasce testuali uguali per tutti i giorni selezionati |
| Stringa libera in `pois.opening_hours` | Fotografia remota del 2026-10-01: 19 POI. Conteggio **NON RIVERIFICATO** | Una o due fasce, 24 ore, testo («Aperto su prenotazione») |
| `null` | Fotografia remota del 2026-10-01: 297 POI. Conteggio **NON RIVERIFICATO** | Orario assente |
| Stringa `LUN, MAR … 09:00 - 20:00` | Modale sponsor, non persistita | Giorni maiuscoli e una sola coppia apertura/chiusura |

Il validator admin e lo staging pretendono i sette giorni e almeno una fascia, quando il loro gate è attivo. La UI admin permette di spegnere un giorno. Il dettaglio pubblico sa disegnare un giorno spento, ma solo se l'oggetto è arrivato dal mapper. Il mapper scarta stringhe e oggetti incompleti, quindi quei POI in lettura diventano «Orari non disponibili».

Il form Admin, se l'utente non modifica gli orari, reinvia il jsonb originale. Gli altri writer non usano questo passthrough.

Non esiste un flusso di rivendicazione che scriva gli orari del POI. Il modale sponsor raccoglie un orario e non lo invia al backend.

Gravità complessiva del disallineamento: 🔴 DA RIVEDERE come modello. Il passthrough admin è una protezione del salvataggio form, non la chiusura di questo audit.

## 2. Modello attuale

Tipo di dominio in `src/types/shared/primitives.ts`:

```ts
type OpeningHours = {
  days: string[];
  morning: string | null;
  afternoon: string | null;
  evening?: string | null;
  isEstimated: boolean | null;
};
```

Regole reali, non scritte nel tipo:

- I giorni attesi sono esattamente `Lun`, `Mar`, `Mer`, `Gio`, `Ven`, `Sab`, `Dom` (`CANONICAL_POI_OPENING_DAYS` in `src/types/write/poiForm.ts`).
- `hasRequiredOpeningHours` è vero solo se l'array contiene tutti e sette e almeno una tra mattina, pomeriggio e sera, dopo `trim`, non è vuota.
- Nessun parser controlla `HH:MM`, spazi o trattino. `09:00 - 13:00`, `09:00-13:00` e `aperto` sono tutti fasce valide per il gate.
- Le fasce sono condivise da tutti i giorni selezionati. Non esiste un orario diverso per il martedì.
- Un giorno assente dall'array è l'unico modo di dire «chiuso quel giorno». Il form di modifica lo consente. Il validator, se gli orari non sono pristine, no.
- `evening` è nel modello e nel serializer. Il form admin non ha il campo.

Colonna database `pois.opening_hours`: `jsonb`, nullable. Può contenere un oggetto, una stringa JSON, oppure null. Nel repository non risulta un check constraint sul formato.

## 3. Tutte le sorgenti degli orari

| Sorgente | UI o servizio | Formato prodotto | Inviato al backend | Salvato | Validazione |
| --- | --- | --- | --- | --- | --- |
| Creazione admin | `mapPoiToFormData(null)` + `PoiInfoTab` | Oggetto; giorni già tutti e sette; fasce vuote | `serializeOpeningHours` dentro `save_poi_with_image_assignment` | jsonb oggetto, oppure blocco se manca la fascia | Sette giorni (precompilati) + fascia non vuota. Il passthrough non si applica: l'id è vuoto |
| Modifica admin | `PoiInfoTab` | Stesso oggetto. Se il DB non passa il parser, il form parte vuoto | Se gli orari sono pristine, il jsonb originale. Se l'utente li modifica, l'oggetto serializzato | jsonb originale, oppure oggetto nuovo | Il gate dei sette giorni scatta solo se gli orari non sono pristine |
| AI arricchimento | `useAiValidation.ts` | `openingHoursFromAi` costruisce l'oggetto (stringa AI → solo `morning`) | `saveSinglePoi` senza `adminOpeningHoursWrite` | `serializeOpeningHours` del risultato. Non è il passthrough | `hasRequiredOpeningHours`. Se fallisce e il POI mappato non ha un oggetto valido, il payload diventa `null` |
| Staging / promote | `requireOpeningHoursFromEnrichment` in `stagingService.ts` | Giorni + stringa in `morning` | `promote_staging_poi` | jsonb oggetto | Gate duro: giorni incompleti o fascia vuota bloccano la promozione |
| Import regionale | `RegionalAnalysisModal.tsx` | `morning: verified.openingHours`, `afternoon: null` | `saveSinglePoi` | jsonb del payload di quel salvataggio | Dipende dall'oggetto prima del save. Non passa da `isAdminOpeningHoursPristine` |
| Community / suggerimento | `suggestionService.ts`, `SuggestionReviewModal.tsx` | Stringa | Resta nel payload del suggerimento | Non è `pois.opening_hours` finché un admin non lo ricopia | Solo «è una stringa» |
| Sponsor | `OpeningHoursSelector` in `SponsorForm.tsx` | `LUN, MAR, … 09:00 - 20:00` | Non incluso in `submitSponsorRequest` | Non salvato | Nessuna oltre alla UI |
| Tour operator | `tourOperatorService.ts` | Campo dell'entità, jsonb in `city_tour_operators` | upsert operatore | jsonb della tabella operatore | Nessun gate `hasRequiredOpeningHours` |
| Shop | colonna `shops.opening_hours` | jsonb libero | non passa dal form POI | jsonb shop | Nessuna nel form POI |

## 4. Tutti i writer

- `src/services/city/poi/poiWrite.ts` → RPC `save_poi_with_image_assignment`. Se `poi.adminOpeningHoursWrite` è presente, `opening_hours` del payload è quel valore. Altrimenti è `serializeOpeningHours(poi.openingHours)`. `serializeOpeningHours` di null scrive null. Le migration `20260928210000_save_poi_skip_primary_image_update.sql` e `20260923153000_poi_d90_save_with_image_assignment.sql` usano `COALESCE` verso `'null'` sul jsonb ricevuto. Nessun confronto con `updated_at`.
- `src/utils/jsonSerialization.ts` `serializeOpeningHours`: se l'orario di dominio è null, scrive null. Altrimenti `{ days, morning, afternoon, evening, isEstimated }`. Perde chiavi extra.
- `stagingService.ts` e le RPC `promote_staging_poi` (`20260909150000`, `20260924182000`): scrivono il jsonb dell'oggetto di arricchimento.
- `tourOperatorService.ts`: scrive `city_tour_operators.opening_hours`.
- Lo sponsor non scrive orari.
- Nessuna RPC dedicata «aggiorna solo gli orari».

## 5. Tutti i reader

Tutti questi si aspettano l'oggetto, non la stringa. Se il mapper ha scartato il valore, vedono orario assente.

| Consumer | File | Cosa legge |
| --- | --- | --- |
| Dettaglio POI | `src/components/modals/poiDetail/PoiInfoSection.tsx` | `days`, `morning`, `afternoon`. Cerca «chiuso permanentemente» dentro la fascia. Ignora `evening` |
| Analisi qualità | `src/utils/scheduleUtils.ts` `analyzeSchedule` | Matrice Lun–Dom. Se ci sono fasce e zero giorni, assume 7/7 |
| Admin modifica | `src/components/admin/poiModal/PoiInfoTab.tsx` | `days`, `morning`, `afternoon` |
| Export CSV | `src/hooks/useAdminExport.ts` | giorni, mattina, pomeriggio, sera |
| Osservatorio | `AnomalyInspector.tsx` | `isEstimated` |
| Card / elenco | passano dal POI già mappato | stesso oggetto o null |
| PDF | non formatta gli orari in un parser proprio | eredita il POI mappato |
| Sponsor join | `src/services/sponsors/sponsorResolvers.ts` | seleziona `pois.opening_hours` e assegna `openingHours: null` |
| AI validazione | `openingHoursFromAi` | se il nuovo dato non passa il gate, tiene `existing`, che è l'oggetto già mappato o null, non il jsonb grezzo |

`parseOpeningHoursFromDb` (`src/services/city/poi/poiMapper.ts`) è l'unico ingresso dal jsonb POI verso il dominio. Scarta: null, stringa, array, oggetto senza i sette giorni, oggetto senza fascia. Accanto, il mapper conserva il jsonb grezzo in `openingHoursSource` e mette `openingHoursSourceLoaded: true`. Quel grezzo non è l'orario mostrato. Serve solo al passthrough del form.

## 5 bis. Passthrough Admin — AS-IS

Vale solo per il salvataggio che passa da `normalizePoiFormData`. Non è una migrazione del modello.

`isAdminOpeningHoursPristine` è vero solo se tutte e tre valgono:

- `formData.id` non è vuoto (è una modifica, non una creazione);
- `openingHoursSourceLoaded` è true (il mapper ha letto la riga);
- `openingHoursEdited` è false.

`openingHoursEdited` diventa true solo in `usePoiForm.updateField`, quando il campo aggiornato è `openingHours`. `PoiInfoTab` lo fa al toggle di un giorno e alla scrittura di mattina o pomeriggio. Non c'è un confronto col valore precedente: il primo tocco basta, anche se l'utente riporta il testo com'era.

Quando è pristine, `normalizePoiFormData` non applica `hasRequiredOpeningHours`. Mette l'orario di dominio a null e `adminOpeningHoursWrite` a `{ mode: 'preserve', value: openingHoursSource }`. `poiWrite` invia quel value. È il jsonb letto dal database: stringa, oggetto o null.

Quando non è pristine, il gate dei sette giorni e di una fascia è obbligatorio. Il payload è `serializeOpeningHours` dell'oggetto del form. Il jsonb originale viene sostituito.

| Situazione | Cosa parte | Cosa viene scritto |
| --- | --- | --- |
| Creazione | id vuoto, source non loaded, giorni precompilati, fasce vuote | Oggetto serializzato, se c'è almeno una fascia. Altrimenti il validate blocca |
| Modifica, orari non toccati, colonna stringa legacy | Il form mostra giorni e fasce vuoti, perché il parser scarta la stringa. `openingHoursSource` tiene la stringa | La stringa originale |
| Modifica, orari non toccati, colonna null | Form vuoto. Source null | null |
| Modifica, orari non toccati, oggetto che passa il parser | Il form mostra giorni e fasce. Source è l'oggetto grezzo, chiavi extra comprese | L'oggetto grezzo, non una riserializzazione |
| Modifica, orari non toccati, oggetto incompleto scartato dal parser | Form vuoto. Source è quell'oggetto | Quell'oggetto |
| Modifica, l'utente tocca un giorno o una fascia | `openingHoursEdited` true | Oggetto `{ days, morning, afternoon, evening, isEstimated }`. La stringa o l'oggetto precedente è sostituito. `evening` resta quello già nello stato del form: il campo non è in UI, lo spread lo copia |
| Modifica di altri campi, orari non toccati | Il flag orari resta false | Il jsonb originale, anche se nel frattempo cambia nome, descrizione o categoria |
| Modifica della sottocategoria, orari non toccati | I due flag sono indipendenti | La sottocategoria segue il suo passthrough. Gli orari restano il jsonb originale |
| Modifica di orari e sottocategoria | Entrambi i flag true | Entrambi sostituiti |

La sottocategoria ha lo stesso meccanismo. `isAdminSubCategoryPristine` richiede id non vuoto, `subCategorySourceLoaded` e `subCategoryEdited` false. `subCategoryEdited` si accende solo su `updateField('subCategory')`. In preserve, `poiWrite` invia `subCategorySource` (testo o null della colonna). In replace, invia il testo trimmato, oppure null se è vuoto. Cambiare la categoria non accende da solo il flag della sottocategoria. In creazione la sottocategoria è obbligatoria: il passthrough non si applica.

`useAiValidation` chiama `saveSinglePoi` con un `PointOfInterest` che non ha `adminOpeningHoursWrite`. Quindi serializza `openingHoursFromAi`. Lo stesso salvataggio non usa `adminSubCategoryWrite`: scrive `subCategory` del risultato AI.

### Punto di attenzione — percorso AI

**ATTUALE PUNTO DI ATTENZIONE / RISCHIO DA TENERE SOTTO CONTROLLO.** Non è un bug da correggere adesso. La rifondazione degli orari resta fuori scope: è la sezione 15, **PROPOSTA / NON IMPLEMENTATA**.

Tre fatti distinti, tutti già nel codice:

- I valori legacy (stringa libera, e l'oggetto che il parser scarta) restano nel jsonb finché un writer non li sostituisce.
- Il passthrough Admin, se l'utente non modifica gli orari, reinvia quel jsonb. La stringa legacy sopravvive a un salvataggio del form che tocca altri campi.
- `parseOpeningHoursFromDb` non riconosce la stringa. Per il dominio l'orario è assente: `openingHours` diventa null. Il grezzo resta solo in `openingHoursSource`, usato dal form e non dal percorso AI.

Il percorso AI non legge `openingHoursSource`. Se l'orario proposto dall'AI non passa `hasRequiredOpeningHours`, `openingHoursFromAi` tiene `existing`, cioè il valore di dominio. Su una stringa legacy quel valore è null, e `serializeOpeningHours(null)` scrive null: la stringa può essere sostituita da null. Se invece l'orario AI passa il gate, la stringa è sostituita dall'oggetto nuovo. Nessuna delle due uscite è il passthrough.

## 6. AI

Schema in `src/services/ai/generators/poiGenerator.ts`, `ENRICHMENT_SCHEMA`:

- `openingHours`: stringa. Esempio nel prompt: `09:00 - 13:00, 15:00 - 19:00`. Istruzione: non inventare se sconosciuto. Il campo è comunque `required`.
- `openingDays`: array di enum `Lun`…`Dom`. Descrizione: «Tutti e 7 i giorni quando il POI ha orari noti.»
- `isEstimated`: booleano.

Coerenza, ancora nel codice:

- Il prompt chiede una stringa che può contenere due fasce separate da virgola. Il TypeScript di arrivo è `string`, non `OpeningHours`.
- `openingHoursFromAi` mette l'intera stringa in `morning` e, sull'oggetto nuovo, copia `afternoon` e `evening` dal POI già mappato. La seconda fascia dell'AI non diventa `afternoon`.
- Due fasce nello stesso giorno sono quindi un testo unico, non due campi.
- Giorni diversi per giorno: lo schema non li prevede.
- «Chiuso» un giorno: l'AI può omettere quel giorno dall'array, ma il gate rifiuta l'array se non è di sette elementi e in quel caso torna `existing`.
- «Su prenotazione», «24 ore», «su eventi»: possono stare nella stringa. Il gate le accetta come fascia non vuota. Non hanno uno stato dedicato.
- Mezzanotte (`19:00-02:00`): resta testo.

🔴 DA RIVEDERE il contratto AI rispetto al modello a fasce. ⚪ FUORI SCOPE di questo audit: i prompt non sono stati modificati da questo aggiornamento documentale.

## 7. Admin

`PoiInfoTab.tsx`:

- Giorni in due righe, feriali e weekend. Ogni giorno è un toggle.
- Campi «Mattina / Continuato» e «Pomeriggio». Placeholder `Es. 09:00 - 13:00` e `Es. 16:00 - 20:00`.
- Testo: «Per orario continuato, compila solo il primo campo.»
- Nessun campo sera, nessun «chiuso», nessun «24 ore», nessun «su prenotazione».
- Il formato mostrato non è imposto. Qualsiasi testo non vuoto supera il validator, se i sette giorni ci sono.
- La versione del 2026-10-01 citava l'oggetto del POI `poi_1771421758130` come unico oggetto nel database. Quel record non è stato riletto il 2026-10-06. **NON RIVERIFICATO**.

Creazione: i sette giorni sono già selezionati. Modifica di un POI il cui jsonb non passa il parser: giorni vuoti e fasce vuote. L'utente vede i controlli, non la stringa del database. Finché non tocca i controlli, il salvataggio conserva quella stringa (sezione 5 bis).

Informazioni nel DB che la UI non rappresenta, finché l'utente non riscrive gli orari:

- la stringa originale;
- quale giorno era aperto, se non è nell'oggetto di dominio;
- una chiusura settimanale espressa solo togliendo un giorno, che il validator rifiuta appena gli orari non sono più pristine;
- `evening` se presente sull'oggetto valido (il form la tiene in stato ma non la mostra);
- testo «Aperto su eventi».

## 8. Sponsor

`OpeningHoursSelector` in `src/components/modals/sponsor/SponsorForm.tsx`:

- Giorni `LUN`…`DOM` (maiuscolo, diverso da `Lun`).
- Default: tutti i giorni se la stringa non contiene già quelle sigle.
- Una sola apertura e una sola chiusura, select ogni 30 minuti, default `09:00`–`20:00`.
- Produce una stringa: `LUN, MAR, MER, GIO, VEN, SAB, DOM 09:00 - 20:00`.
- Non rappresenta due fasce, il dopo-mezzanotte come caso a parte, 24 ore, prenotazione, eventi.

`useSponsorFormLogic.ts` tiene `openingHours` nello stato. `submitSponsorRequest` non riceve quel campo. Il campo è obbligatorio in UI e viene scartato all'invio.

Lo sponsor non legge né scrive `pois.opening_hours`. Il join in `sponsorResolvers.ts` seleziona la colonna del POI e il mapping assegna `openingHours: null`.

Conclusione: sponsor e POI non condividono il modello, e il modello sponsor non è una fonte di verità perché non viene salvato. 🔴 DA RIVEDERE come debito di prodotto. ⚪ FUORI SCOPE di questo aggiornamento: il modale non è stato modificato.

## 9. Claim / rivendicazione

Cercati, nell'audit del 2026-10-01, `claim`, `rivendic`, `date_claimed`, flussi proprietario/gestore. Una ripassata dei nomi nel codice di salvataggio orari non ha mostrato un writer nuovo.

- `date_claimed` è una colonna sponsor, non un editor di orari.
- `reclaimOrphanedItems` / `reclaimStagingByCityName` riassegnano staging e POI orfani a una città. Non risultano modificare `opening_hours`.
- I «claims» Wikimedia sono il claim P18 di Wikidata (file immagine), non un orario.
- Il suggerimento community può proporre una stringa oraria dentro il dettaglio della segnalazione. Non aggiorna da solo la riga `pois`.

Nessun flusso di soggetto rivendicante, nel codice letto, scrive giorni, apertura o chiusura sul POI. 🟢 ACCETTABILE come assenza nel codice attuale. 🟡 DA REVISIONARE se in futuro il claim dovrà editare l'orario: oggi non ha il modello canonico su cui appoggiarsi. Una ricerca esaustiva di ogni RPC del repository non è stata ripetuta il 2026-10-06 oltre ai writer della sezione 4.

## 10. Database

`pois.opening_hours jsonb null`. Introdotto e riscritto dalle RPC di save/promote citate sopra. Nessuna migration successiva, tra quelle lette per questo aggiornamento, cambia il tipo o aggiunge un check di formato.

Altre colonne jsonb omonime, fonti distinte:

- `shops.opening_hours`
- `city_tour_operators.opening_hours`
- `pois_staging` (payload di promote, stesso nome)

Non risulta `open_time` / `close_time` sulle tabelle POI nel codice di save letto.

Conteggio remoto della versione 2026-10-01. **NON RIVERIFICATO** il 2026-10-06:

| Forma | Righe |
| --- | --- |
| null | 297 |
| stringa | 19 |
| oggetto | 1 |

Non c'è una sola fonte di verità applicativa. La colonna POI è la fonte del POI. Shop e tour operator sono entità diverse con la stessa parola.

## 11. Formati della fotografia 2026-10-01

Elenco storico. **NON RIVERIFICATO** sul database attuale.

Stringhe POI (19), nessuna conteneva il giorno:

- una fascia `HH:MM-HH:MM` senza spazi: `09:00-13:00` (2), `08:00-13:30`, `08:00-22:00`, `08:30-19:00`, `09:00-16:00`, `09:00-18:00`, `09:00-19:00`, `10:00-13:00`, `16:00-23:00`;
- due fasce: `08:00-12:00, 16:30-20:00`, `12:30-14:30, 19:30-22:30`;
- copertura o notte: `00:00-24:00` (2), `19:00-02:00`;
- testo: `Aperto 24 ore` (2), `Aperto su eventi`, `Aperto su prenotazione`.

Oggetto unico citato allora: giorni completi, `morning: "09:00 - 13:00"`, `afternoon: "15:00 - 19:00"`, senza `evening` e senza `isEstimated`.

Sponsor, se fosse salvato: `LUN, … DOM HH:MM - HH:MM`.

AI: stringa libera più array di giorni.

## 12. Incoerenze

1. 🔴 Il dominio e il validator descrivono un oggetto a sette giorni. La fotografia del 2026-10-01 conteneva soprattutto null e stringhe. Il conteggio non è stato rifatto.
2. 🔴 La UI admin di modifica lascia spegnere un giorno. Il validator, se l'utente modifica gli orari, li vuole tutti.
3. 🔴 Il placeholder `09:00 - 13:00` non è il formato delle stringhe legacy della fotografia storica e non è un formato controllato dal codice.
4. 🔴 L'AI può restituire due fasce in una stringa; `openingHoursFromAi` ne tiene una sola in `morning`.
5. 🔴 Lo sponsor usa sigle diverse (`LUN` vs `Lun`), una sola fascia, e non persiste.
6. 🟡 `evening` esiste in tipo, serializer, export e non nel form.
7. 🟡 `scheduleUtils` tratta «fascia presente e giorni vuoti» come aperto tutta la settimana. Il mapper, al contrario, scarta quel caso. I due lettori non concordano, e il secondo non vede le stringhe.
8. 🟡 Il dettaglio pubblico cerca «chiuso permanentemente» dentro la fascia, stato che il form non offre. `scheduleUtils` cerca anche «temporaneamente chiuso».
9. 🟢 La colonna è jsonb: può ospitare sia l'oggetto sia la stringa senza migration di tipo.
10. 🟢 Non risulta un writer claim parallelo nei percorsi della sezione 4.
11. 🟡 **ATTUALE PUNTO DI ATTENZIONE / RISCHIO DA TENERE SOTTO CONTROLLO**, non un intervento aperto da questo audit. Il passthrough protegge la stringa nel salvataggio del form. Il mapper la tratta come assenza. Il percorso AI, se il dato non passa il gate, può riscrivere quella assenza come null; se passa il gate, la sostituisce con l'oggetto. La canonicalizzazione resta **PROPOSTA / NON IMPLEMENTATA**.

## 13. Rischi

- 🟡 Se l'utente tocca un giorno o una fascia, vale l'oggetto strutturato e la stringa viene sostituita. Il rischio è legato all'edit, non al salvataggio degli altri campi del form.
- 🟡 **ATTUALE PUNTO DI ATTENZIONE / RISCHIO DA TENERE SOTTO CONTROLLO.** La validazione AI non usa `adminOpeningHoursWrite`. Una stringa legacy, scartata dal mapper e quindi vista come null, può essere riscritta come null se l'orario AI non passa il gate, oppure come oggetto se lo passa. Non è un bug da correggere in questo audit. La rifondazione del modello resta fuori scope.
- 🔴 I null restano «non disponibili» in pubblico. Non vanno inventati. Il numero 297 è la fotografia del 2026-10-01, non un conteggio nuovo.
- 🟡 Due admin: l'upsert D90 non confronta `updated_at`. Vale per tutto il POI, non solo per gli orari.
- 🟡 Shop e tour operator possono divergere dal POI omonimo senza che nessuno li riconcili.
- ⚪ Migration automatica delle stringhe legacy: fuori da questo audit. Perderebbe i giorni (nelle stringhe della fotografia storica non c'erano) e il testo libero.

## 14. Casi d'uso che il modello attuale non rappresenta

| Caso | Oggi |
| --- | --- |
| Aperto tutti i giorni, una fascia | Sì, se i sette giorni sono selezionati e la fascia è in mattina |
| Aperto solo alcuni giorni | La UI lo disegna. Il validator della modifica lo rifiuta appena gli orari non sono pristine. Lo staging lo rifiuta |
| Giorno chiuso | Solo come giorno tolto dall'array, quindi stesso rifiuto |
| Due fasce nello stesso giorno | Due campi, stessa coppia per ogni giorno selezionato. La stringa `08:00-12:00, 16:30-20:00` non viene spezzata in lettura |
| Orario diverso da un giorno all'altro | Non rappresentabile |
| Orario continuato | Sì, solo il primo campo, come dice la nota UI |
| Dopo mezzanotte | Solo come testo `19:00-02:00`. Nessun legame al giorno successivo |
| 24 ore | Solo come testo. Non è un booleano |
| Su prenotazione / su eventi | Solo come testo. Il dettaglio non ha uno stato |
| Non noto | `null` o oggetto scartato. Il pubblico dice «Orari non disponibili». Nel form, null e stringa si conservano solo finché gli orari restano pristine |
| Più di due fasce | Il modello ha tre slot ma la UI due. Una terza fascia storica in `evening` non si modifica da schermo; se l'utente modifica mattina o pomeriggio, lo spread la include nell'oggetto nuovo |

## 15. Modello canonico proposto

**PROPOSTA / NON IMPLEMENTATA.**

Nessuna parte di questo stato è nel tipo `OpeningHours`, nel parser, nel form o nelle RPC di save. Il passthrough della sezione 5 bis non è questo modello: reinvia il jsonb già presente, non lo classifica come `unknown`, `textual` o `weekly`.

Un orario POI, nella proposta, è uno di questi stati, espliciti:

1. `unknown` — non noto. È il null di oggi. Non si inventano giorni.
2. `textual` — frase che non è una fascia: `Aperto 24 ore`, `Aperto su prenotazione`, `Aperto su eventi`, `chiuso permanentemente`. Resta testo, con un codice di stato (`always_open`, `on_request`, `on_event`, `closed`, `note`) più la frase originale.
3. `weekly` — struttura:
   - per ogni giorno `Lun`…`Dom`: `closed` oppure una lista ordinata di intervalli `{ start: "HH:MM", end: "HH:MM" }`;
   - intervallo che passa la mezzanotte consentito (`19:00` → `02:00`) senza spostarlo al giorno dopo in silenzio;
   - lista vuota di intervalli = giorno chiuso;
   - un giorno omesso = non noto, diverso da chiuso;
   - 24 ore = un intervallo `00:00`–`24:00` oppure lo stato `always_open`, non una stringa ambigua.

Una fascia continuata è un solo intervallo. Due fasce sono due intervalli dello stesso giorno. Non servono i campi fissi `morning` / `afternoon` / `evening`: sono un'interpretazione UI di una lista.

Finché i giorni della stringa legacy non esistono, quella stringa resta `textual` o «fasce senza calendario», mai convertita d'ufficio in `Lun`–`Dom`.

## 16. Matrice attuale → desiderato

La colonna Desiderato è la proposta. Non è implementata.

| Sorgente | Attuale | Desiderato (proposta) |
| --- | --- | --- |
| DB POI | jsonb misto | jsonb dello stato `unknown` / `textual` / `weekly`. Le stringhe restano leggibili finché non c'è una migration dedicata e reversibile |
| Admin | due campi + toggle giorni + gate a sette giorni se l'utente modifica; passthrough del jsonb se non modifica | editor dello stato `weekly`, con giorno chiuso valido; il testo legacy mostrato e non riscritto finché l'utente non conferma |
| AI | stringa + sette giorni obbligatori; il save serializza e non usa il passthrough | stesso stato: può dire `unknown`, `on_request`, oppure intervalli per i giorni che conosce, senza riempire i giorni mancanti |
| Staging | promote bloccato senza sette giorni | promote di `unknown` consentito; promote di `weekly` incompleto rifiutato, senza inventare i giorni |
| Sponsor | stringa a una fascia, non salvata | decidere se lo sponsor compila lo stesso `weekly`, oppure se l'orario non fa parte della domanda. Oggi la UI promette un dato che l'invio butta |
| Claim | assente nei writer letti | quando esisterà, deve scrivere lo stesso stato del POI, non un quinto formato |
| Lettura pubblica | oggetto o «non disponibili» | mostra giorni chiusi, due intervalli, stati testuali, e «non noto» senza trattare la stringa come assenza |

## 17. Impatto architetturale

Il punto di convergenza del modello attuale è `OpeningHours` più `parseOpeningHoursFromDb` e `serializeOpeningHours`. Toccarli cambia admin, AI, staging, dettaglio, export e `scheduleUtils` insieme. Shop e tour operator stanno fuori finché non si decide che condividono il POI.

Il passthrough admin è il ponte già nel codice: il jsonb originale sopravvive al salvataggio degli altri campi del form. Non sopravvive a un edit degli orari e non sopravvive al save della validazione AI. Il modello canonico può arrivare dopo, senza una migration obbligatoria nel mezzo. Questa frase è una constatazione, non un incarico.

## 18. Eventuali migration necessarie

Nessuna è stata aggiunta da questo audit per proteggere i dati. Una migration futura, separata, può:

- lasciare `jsonb`;
- non convertire `Aperto su prenotazione` in giorni;
- non assegnare `Lun`–`Dom` alle stringhe che non li contengono;
- opzionalmente avvolgere la stringa in `{ "state": "legacy_text", "text": "..." }` solo con una revisione dei reader già pronta.

⚪ FUORI SCOPE. **PROPOSTA / NON IMPLEMENTATA.**

## 19. Eventuali modifiche UI necessarie

Quando si adotterà il modello: mostrare la stringa legacy in sola lettura; permettere il giorno chiuso senza errore; allineare o ritirare il selettore sponsor; mostrare `evening` o sostituire i tre campi con la lista di intervalli. Non fanno parte dello stato attuale.

## 20. Eventuali modifiche ai prompt AI necessarie

Il prompt deve poter rispondere «non noto», deve poter omettere un giorno senza fallire, e deve restituire intervalli strutturati se si abbandona la stringa unica. Finché lo schema richiede `openingHours` e «tutti e 7 i giorni», l'AI continuerà a produrre dati che il gate scarta o schiaccia in `morning`. ⚪ FUORI SCOPE di questo aggiornamento: i prompt non sono stati modificati.

## 21. Piano di allineamento consigliato

Resta un piano. Non è stato eseguito. Il punto 1 dell'audit originale (il modello canonico) non è implementato.

1. Il passthrough del form c'è già. Non migra le stringhe. Non copre il save AI.
2. Decidere il prodotto sugli 11 casi della sezione 14, in particolare «giorno chiuso» e «non noto».
3. Introdurre il tipo stato in lettura, accettando ancora l'oggetto attuale e la stringa come legacy.
4. Allineare admin e AI allo stato, insieme, così non nasce un sesto formato.
5. Decidere lo sponsor: stesso stato, oppure togliere il campo dalla domanda finché non viene salvato.
6. Solo dopo, eventuale migration dei casi `HH:MM-HH:MM` in intervalli senza giorni, marcati come calendario sconosciuto.

Classificazione del piano: 🟡 DA REVISIONARE prima di qualsiasi codice sul modello orari.

Il modello canonico resta **PROPOSTA / NON IMPLEMENTATA**.
