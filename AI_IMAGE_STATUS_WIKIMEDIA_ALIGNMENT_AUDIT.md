# Image status / Wikimedia — stato AS-IS

Aggiornato: 2026-10-06.

Come leggere lo stato di ogni affermazione:

| Marchio | Significato |
| --- | --- |
| **DOCUMENTATO** | Il comportamento risulta dal codice, da una migration o da un test presente nel repository. Non significa che sia stato eseguito. |
| **VERIFICATO** | C'è una verifica concreta, indicata nel punto. |
| **NON VERIFICATO** | Manca una verifica concreta sufficiente. |
| **PROPOSTA / NON IMPLEMENTATA** | Non fa parte dell'implementazione attuale. Questo documento non ne introduce. |

La presenza di una funzione nel codice non è una verifica di esecuzione. L'unica verifica nuova sul database, in questo aggiornamento, è `npx supabase migration list` del 2026-10-06. Per ogni versione citata nella sezione 13, Local e Remote coincidono. Questo verifica la registrazione della migration, non il comportamento di RPC, policy, Storage, UI o dati.

Non sono stati eseguiti RPC, contract test, smoke, browser, né una lettura delle righe toccate dai blocchi `DO`.

## 1. Modello

Due livelli principali, tenuti separati: il file e l'utilizzo. Sul file stanno anche proprietà globali. Non sono un terzo livello di entità e non sono lo stato dell'utilizzo.

| | Dove | Cosa rappresenta |
| --- | --- | --- |
| File | `media_assets` | Vita del file (`asset_status`) |
| Utilizzo | `entity_image_assignments` | Un uso del file su un'entità, con il proprio `assignment_status` |
| Proprietà globale del file | `media_assets.admin_blocked` | Blocco Admin: nasconde il file in ogni utilizzo, senza riscrivere gli assignment |
| Stato di validazione Wikimedia | `media_assets.wikimedia_validated` | Il file Wikimedia è VALIDATA solo se il valore è `true` |

Un file può avere più assignment: più POI, un personaggio, un patrono, una submission. Sostituire, sospendere, ripristinare o rimuovere un utilizzo non cambia gli altri utilizzi e non cancella la riga `media_assets`.

CANCELLA FOTO è un'altra operazione: cancella righe, non cambia `assignment_status`. È descritta nella sezione 9.

## 2. Stati

`assignment_status`, etichette in `ASSIGNMENT_STATUS_LABELS`:

| Valore | Etichetta | Lettura pubblica |
| --- | --- | --- |
| `active` | ATTIVO | visibile, se il resto delle condizioni vale |
| `suspended` | SOSPESO | nascosto |
| `restored` | RIPRISTINATO | visibile, se il resto delle condizioni vale |
| `removed` | RIMOSSO | nascosto |
| `replaced` | SOSTITUITO | nascosto |

`asset_status`, etichette in `IMAGE_ASSET_STATUS_LABELS`:

| Valore | Etichetta | Pubblicabile come file |
| --- | --- | --- |
| `active` | ATTIVO | sì |
| `suspended` | SOSPESO | no |
| `restored` | RIATTIVATO | sì |
| `replaced` | SOSTITUITO | no |
| `removed` | RIMOSSO | no |
| `verify_ai_image` | VERIFICARE IMMAGINE AI | no |

RIATTIVATO è lo stato di vita del file. RIPRISTINATO è lo stato dell'utilizzo. Non sono la stessa etichetta.

## 3. RIPRISTINATO

`restored` è lo stato corrente dell'assignment dopo il KO di una segnalazione immagine.

Segnalazione → l'utilizzo diventa `suspended`. KO → quell'utilizzo diventa `restored`. Non torna ad `active`. Non viene ricopiato uno snapshot precedente.

Se sullo stesso assignment resta un'altra segnalazione `image_abuse` in `nuovo` o `in_verifica`, diversa da quella che si sta chiudendo, il KO non cambia l'utilizzo: resta `suspended`.

Le letture pubbliche trattano come visibili `active` e `restored` (`PUBLICLY_VISIBLE_ASSIGNMENT_STATUSES`), quando il file non è bloccato e le altre condizioni di visibilità sono soddisfatte.

## 4. SOSPESO ADMIN

Non è uno stato di assignment. È `media_assets.admin_blocked boolean NOT NULL DEFAULT false`.

Acceso: la foto è nascosta in ogni utilizzo. Gli assignment non vengono riscritti. `active` resta `active`, `restored` resta `restored`.

Spento: si aggiorna solo il booleano. Un utilizzo `suspended` resta nascosto. Un utilizzo `active` o `restored` torna visibile se il resto delle condizioni vale.

L'RPC è `set_media_asset_admin_block`. Un update diretto della colonna, fuori da quella RPC, è rifiutato dal trigger `guard_admin_blocked_write` nella migration `20261002217000`.

Etichetta funzionale Wikimedia quando il flag è acceso: **SOSPESO ADMIN** (`wikimediaFunctionalStatusLabel`). Non si usa per l'utilizzo RIPRISTINATO.

La history `admin_note` del blocco non registra il POI da cui il blocco è stato attivato. La UI non può nominare quel POI.

## 5. SOSTITUITO

`replaced` appartiene solo all'assignment che viene sostituito.

Le quattro RPC di upsert marcano quell'assignment come `replaced` e `is_current = false`. Non chiamano `transition_media_asset_status(..., 'replaced')` solo perché non resta un altro utilizzo `active`.

Funzioni nella migration `20261002219000`:

- `upsert_entity_image_assignment_dual_write`
- `upsert_patron_primary_image_assignment`
- `upsert_poi_primary_image_assignment`
- `upsert_entity_primary_image_assignment`

Le quattro upsert rifiutano la sostituzione di un utilizzo corrente `suspended` o `removed`. Un utilizzo `active` o `restored` diventa `replaced` solo sulla riga di quell'entità. Il file non passa a `asset_status = replaced`.

## 6. RIMOSSO

L'OK di una segnalazione immagine porta quell'assignment a `removed` e compila `removed_at`. Il file non viene cancellato. Gli altri assignment non cambiano. Se ogni utilizzo è rimosso, la riga `media_assets` resta.

Questa è la rimozione da segnalazione. Non è CANCELLA FOTO.

## 7. Segnalazioni

`create_content_report_group`, per `image_abuse`, porta l'assignment segnalato a `assignment_status = suspended`. Non cambia `asset_status` e non accende `admin_blocked`.

`transition_report_status`:

- KO immagine → `restored`, salvo un'altra segnalazione aperta sullo stesso assignment;
- OK immagine → `removed`.

Lo stato del file passato allo storico è quello letto.

Dopo `SELECT ... FOR UPDATE` sull'assignment, se esiste già una `image_abuse` in `nuovo` o `in_verifica` sullo stesso `assignment_id`, la RPC solleva `Questa immagine è già stata segnalata.` L'indice unico parziale `content_reports_one_open_image_abuse_idx` (`20261002218000`) impedisce a due insert concorrenti di riuscire entrambi.

Un utilizzo `restored` può essere segnalato di nuovo. Il rifiuto per stato non segnalabile vale solo fuori da `active` e `restored`. Il controllo non è solo nel client.

## 8. Import, DA VALIDARE, VALIDATA, quarantena

L'INSERT di una Wikimedia nuova scrive `wikimedia_validated = false`. Se l'inserimento omette la colonna, il trigger la normalizza a `false`. L'INSERT con `true` è rifiutato. L'INSERT non Wikimedia resta `NULL`. Il flag di sessione `td.wikimedia_validation_write` non autorizza l'INSERT.

Nessun percorso di import nel client imposta `true`. L'unica chiamata `set_wikimedia_validation` con `p_validated: true` è in `completeWikimediaValidation`.

Stato funzionale (`wikimediaFunctionalStatusLabel`):

- `admin_blocked` → **SOSPESO ADMIN**;
- file `removed` o `replaced` → nessuna etichetta funzionale;
- `wikimedia_validated === true` e file `active` o `restored` → **VALIDATA**;
- altrimenti → **DA VALIDARE**.

`null` e `false` restano non validate. La lettura pubblica è fail-closed: entra solo `true`.

`set_wikimedia_validation(true)` è eseguibile da un admin (`is_td_admin`). La motivazione è obbligatoria. Il run usato è l'ultimo il cui insieme di `step_code` è esattamente `canonical_image_verification_step_codes()`, senza codici extra. Un run più recente ma incompleto non viene usato. Se non esiste un run completo, la validazione fallisce. Sugli step `blocked`, `doubt` e `unverified` di quel run la nota admin è obbligatoria. Il trigger rifiuta un update della colonna senza il flag di sessione impostato dentro la RPC. Un passaggio da `true` a `false` è rifiutato.

La migration `20261002212000` dichiarava che quella RPC non cambiava `asset_status`. La migration successiva `20261005123000_wikimedia_validation_lifts_quarantine.sql` sostituisce la funzione: se `p_validated` è true e `asset_status` è `suspended`, chiama `transition_media_asset_status` verso `active` con la nota di uscita dalla quarantena. Non accende `pois.wikimedia_public_enabled` e non cambia gli assignment. Lo stesso file, nel blocco `DO`, porta ad `active` le Wikimedia già `wikimedia_validated = true`, ancora `suspended` e non `admin_blocked`.

- Implementazione nel repository: **DOCUMENTATA** (file della migration letto).
- Registrazione sul database: **VERIFICATA** il 2026-10-06 con `supabase migration list`. Local e Remote sono `20261005123000`.
- Effetto del blocco `DO` sulle righe già presenti: **NON VERIFICATO**. La lista non dice quante righe siano state aggiornate.

SALVA BOZZA scrive le note e non alza il flag. VALIDA chiama la RPC sopra. Il modale è `WikimediaValidationModal`, sui 16 step di `IMAGE_VERIFICATION_STEP_DEFINITIONS`.

`wikimedia_validated` e `pois.wikimedia_public_enabled` restano distinti. Il toggle, `set_poi_wikimedia_public_enabled`, aggiorna solo quella colonna.

## 9. Validazione massiva

Nel tab Punti di interesse, `PoiList` apre `WikimediaBulkValidationDialog` con il pulsante **Valida Wikimedia**. La motivazione è obbligatoria.

Per ogni POI selezionato, in sequenza:

1. `loadPoiWikimediaAssetSummary`;
2. se non c'è una Wikimedia pertinente, il POI è saltato;
3. se manca la nota su uno step che la richiede, la stessa motivazione viene scritta solo su quegli step vuoti, con `save_wikimedia_validation_notes`;
4. `completeWikimediaValidation` chiama la stessa RPC della validazione singola.

Il dialogo elenca validate, saltate e non riuscite. Un fallimento non interrompe gli altri POI.

Il ciclo è per POI, non per file. Non cerca gli altri POI che usano la stessa fotografia. Se la stessa foto è su tre POI selezionati, la validazione viene eseguita tre volte. Il flag sta sul file: la seconda chiamata trova `wikimedia_validated` già `true` e la RPC è idempotente su `true`. Non è una deduplica.

## 10. D-22

Ordine e condizioni sono **DOCUMENTATI** nel resolver. Una esecuzione pubblica di questa cascata, in questo aggiornamento, è **NON VERIFICATA**.

Ordine in `POI_D22_TIER_ORDER`:

Sponsor → Admin → Real/Wikimedia → Community → AI → Placeholder.

Il resolver puro è `resolvePoiPublicImageByD22`. L'applicazione alle letture città e POI è `applyPoiD22PublicDisplayImages`, che sostituisce `poi.imageUrl` con l'URL vincitore.

Una Wikimedia entra solo se:

- `wikimedia_validated === true` (`isWikimediaValidationGranted`);
- `wikimediaPublicEnabled` è true, altrimenti `tierForOrigin` scarta l'origine `wikimedia`;
- `admin_blocked` è false;
- assignment `is_current` e `active` oppure `restored`;
- `asset_status` è `active` o `restored`;
- l'URL pubblico non è vuoto.

`verified_real` sta nello stesso gradino Real/Wikimedia e non dipende dal toggle. `admin_blocked` esclude il file e la cascata prosegue. Il placeholder di categoria è l'ultimo gradino, fuori dagli assignment.

`is_media_asset_publicly_usable` (`20260924183100`) guarda `asset_status` `active` o `restored`, bucket, path e `archived_at`. Non conosce `admin_blocked` né `wikimedia_validated`. Non è il resolver D-22. Le upsert patrono la usano ancora come gate di rientro.

`media_assets_with_usage_count` conta `active_usage_count` solo sugli assignment `is_current` e `assignment_status = active`. Un RIPRISTINATO non entra in quel conteggio. È il catalogo admin, non il resolver pubblico. Il modale CANCELLA FOTO non usa questa vista: conta le righe restituite da `listMediaAssetUsages`, senza filtro di stato.

## 11. Wikimedia e verifica AI

`record_image_verification_run` non mette un'origine `wikimedia` in `verify_ai_image`. La coda VERIFICARE IMMAGINE AI e la validazione Wikimedia restano separate. `20261002170000` corregge il tipo `city_id` della coda AI. Non è la coda Wikimedia.

Un run Wikimedia deve contenere tutti i codici di `canonical_image_verification_step_codes()`. Un run AI può restare parziale. Un run Wikimedia parziale non viene registrato e non può essere validato.

## 12. CANCELLA FOTO

Il comportamento di questa sezione è **DOCUMENTATO** nel codice e nella migration. Non è il cestino **Elimina POI** dell'header di `AdminPoiModal`, che chiama `deleteSinglePoi`.

La migration `20261005143000_hard_delete_media_photo.sql` è **APPLICATA**. È stata applicata con `supabase db push`. Lo stato remoto è **VERIFICATO**: il 2026-10-06 `supabase migration list` mostra Local e Remote allineati su `20261005143000`. Questa verifica riguarda la registrazione della versione. Non è l'esecuzione del contract test e non è una CANCELLA FOTO di prova.

### Chi può

Il cestino foto è mostrato solo se `canHardDeletePhotos` è true. Lo impostano `AdminPoiManager` e `AdminModals` quando `role === 'admin_all'`. Admin Limited non riceve il pulsante.

La RPC `hard_delete_media_photo` rifiuta chiunque non passi `is_admin_all` (`profiles.role = 'admin_all'`). `is_admin_all` è `SECURITY DEFINER`, `REVOKE ALL FROM PUBLIC`, senza `GRANT` a `authenticated`. La usano le funzioni dello stesso owner.

### UI

In `PoiMediaTab` il cestino è solo icona, in alto a destra sulla card, `aria-label` e `title` «Cancella foto». Compare su Sponsor, Admin, Wikimedia, Community e AI. La sezione Placeholder non ha il cestino.

Il dialogo è `HardDeleteMediaPhotoModal`, titolo **CANCELLA FOTO**. Elenca gli utilizzi da `listMediaAssetUsages` (ogni riga di assignment, qualunque stato, con etichetta e «non corrente» se `is_current` è false).

- **Cancella da questo punto** chiama `hardDeletePhotoAssignment` (`p_assignment_id` valorizzato).
- **Cancella da tutti i punti**, dopo una seconda conferma, chiama `hardDeletePhotoAsset` (`p_assignment_id` null).

### Database

Il testo che segue è il contenuto **DOCUMENTATO** di `20261005143000_hard_delete_media_photo.sql`, la cui registrazione Local/Remote è **VERIFICATA** come sopra. L'esecuzione di questi rami su dati reali, in questo aggiornamento, è **NON VERIFICATA**.

`p_assignment_id` valorizzato cancella solo quell'assignment, se appartiene all'asset. `NULL` cancella tutti gli assignment dell'asset.

L'asset viene cancellato solo se dopo quella cancellazione non resta nessuna riga in `entity_image_assignments` per quell'asset. Una riga `removed` o `replaced` è un utilizzo residuo: tiene in vita l'asset. Lo stato non viene riscritto in `removed` o `replaced`: la riga scelta viene eliminata.

Nella stessa transazione, per gli assignment cancellati:

- i `content_reports` collegati vengono cancellati, dopo aver azzerato `parent_report_id` interno a quell'insieme;
- lo storico `entity_image_history` di quegli assignment, dei rimpiazzi che li citano, e dell'asset se l'asset viene cancellato, viene eliminato sospendendo il trigger `entity_image_history_append_only` e riattivandolo prima della fine della funzione. Il trigger, fuori da questa sospensione, rifiuta UPDATE e DELETE con il messaggio che contiene `append-only`.

`photo_submissions` e `city_patron_gallery` non hanno FK verso `media_assets` e la funzione non le modifica. Un assignment la cui entità è una submission può essere cancellato come utilizzo; la riga `photo_submissions` resta.

Il placeholder è rifiutato (`is_placeholder` oppure `origin_type` placeholder).

Se l'asset va cancellato e un altro `media_assets` ha lo stesso bucket e path, la funzione annulla l'operazione.

I run di verifica hanno FK `ON DELETE CASCADE` verso `media_assets` (`20260919140200`). Spariscono con l'asset. Non vengono cancellati se l'asset resta.

La RPC non cancella il file Storage. Restituisce il path solo se l'asset è stato cancellato e bucket e path sono presenti. Restituisce anche l'evidence il cui path non è tenuto da un report sopravvissuto.

### Autorizzazione Storage

Policy, ticket e ordine RPC-poi-Storage sono **DOCUMENTATI**. Una DELETE Storage di prova non è stata eseguita: comportamento runtime **NON VERIFICATO**.

Tabella `media_hard_delete_objects`: un ticket per utente, bucket e path, `expires_at` a un'ora da quell'operazione. La foto non scade. Scade solo il permesso di DELETE Storage.

All'inizio la funzione cancella solo i ticket scaduti di chi avvia l'operazione. Dopo la cancellazione delle righe, cancella i ticket di tutti gli utenti sui path appena liberati (file dell'asset, se l'asset è stato cancellato, ed evidence esclusiva), poi inserisce il ticket del chiamante. `ON CONFLICT` aggiorna `expires_at`: un ticket scaduto non blocca una nuova operazione.

La policy `media_hard_delete_authorized_delete` è `DELETE` su `storage.objects` per `authenticated`, con `media_hard_delete_object_authorized`: Admin ALL, ticket non scaduto, nessun `media_assets` vivo su quel path, nessun `content_reports` vivo su quel path.

Il client (`hardDeleteMediaPhotoService`) chiama prima la RPC e poi `supabase.storage.remove`. Il rilascio (`release_media_hard_delete_objects`) avviene solo per gli oggetti rimossi con successo. Se lo Storage fallisce, il database è già aggiornato: il modale mostra l'errore e **Riprova rimozione file** riusa i ticket ancora validi.

Se la RPC solleva un'eccezione, la sua transazione non conferma le DELETE SQL. Il client non cancella lo Storage prima di quella conferma. Un fallimento Storage successivo non è un rollback del database.

### Dopo la cancellazione, nel form Admin

Il flusso qui sotto è **DOCUMENTATO** nel client. La sua esecuzione nel browser, in questo aggiornamento, resta **NON VERIFICATA**.

`onDatabaseDeleted` in `PoiMediaTab`:

- toglie dalla lista locale le card degli assignment cancellati (`assignmentId` preciso, oppure tutti quelli dell'asset se la cancellazione è globale);
- se l'URL del form coincide con una foto tolta e con nessuna foto rimasta, `releaseAdminImageUrl` svuota `imageUrl` e mette `image_status` a `missing` sia nello stato visibile sia nello snapshot usato per il dirty del form;
- incrementa il reload del sommario Wikimedia;
- chiama `invalidateCityCache(cityId)`;
- emette `refresh-city-data` con quel `cityId`.

`usePoiForm` non mette nel campo Admin l'URL pubblico D-22 né il placeholder di categoria. `adminOwnedImageUrl` tiene solo path `admin_uploads` / `admin_assets` o un `http`/`https` esterno. Il form non viene ricalcolato dal prop `poi` finché quel prop non cambia: lo svuotamento dell'anteprima Admin è `releaseAdminImageUrl`.

`useCityData` ascolta `refresh-city-data`. La rilettura della città passa da `applyPoiD22PublicDisplayImages`. Non c'è un ramo che forza Wikimedia. Se l'assignment Admin non c'è più e una Wikimedia resta eleggibile (validata, toggle acceso, non bloccata, corrente, `active` o `restored`), il resolver può sceglierla al ricaricamento. `CityDetailContent`, quando riceve `preloadedCity`, non sottoscrive `useCityData`: quel caso non riceve l'evento. Anche questo è **DOCUMENTATO**, non osservato nel browser.

## 13. Migration nel repository

Presenti, in ordine di nome, per questo modello. Il ruolo è quello **DOCUMENTATO** nel file. La registrazione Local/Remote è un fatto a parte, sotto la tabella.

| File | Ruolo nel testo della migration |
| --- | --- |
| `20260916120200_media_assets_schema.sql` | Tabella file |
| `20260916130000_entity_image_assignments.sql` | Tabella utilizzi |
| `20260916130100_content_reports.sql` | Segnalazioni |
| `20260919140000_image_asset_status_enum.sql` | Enum `asset_status` |
| `20260919140200_image_verification_pipeline.sql` | Run e step, cascade sull'asset |
| `20260920120000_entity_image_history.sql` | Storico append-only |
| `20260924183100_media_asset_public_usable_sql.sql` | `is_media_asset_publicly_usable` |
| `20261001200000_set_poi_wikimedia_public_enabled.sql` | Toggle pubblico del POI |
| `20261002170000_list_ai_verify_queue_city_id_text.sql` | Coda AI, `city_id` testuale |
| `20261002210000_media_assets_wikimedia_validated.sql` | Colonna `wikimedia_validated` |
| `20261002212000_wikimedia_validation_rpcs.sql` | RPC di validazione. Non alza il file dalla quarantena |
| `20261002213000_report_ko_preserves_asset_status.sql` | KO → `restored`, OK → `removed` |
| `20261002215000_wikimedia_skips_verify_ai_queue.sql` | Wikimedia fuori dalla coda AI |
| `20261002217000_media_assets_admin_blocked.sql` | `admin_blocked` e trigger |
| `20261002218000_open_image_report_guard.sql` | Una segnalazione immagine aperta |
| `20261002219000_replaced_assignment_does_not_retire_asset.sql` | La sostituzione non ritira il file |
| `20261005123000_wikimedia_validation_lifts_quarantine.sql` | VALIDA porta il file `suspended` ad `active`. Registrazione Local/Remote **VERIFICATA** il 2026-10-06. Effetto del `DO` sulle righe: **NON VERIFICATO** |
| `20261005143000_hard_delete_media_photo.sql` | CANCELLA FOTO. **APPLICATA** con `supabase db push`. Local e Remote **VERIFICATI** allineati il 2026-10-06 |

Assenti dal repository, come già nella versione precedente. Non risultano nemmeno nella lista del 2026-10-06:

- `20261002211000_image_asset_status_suspended_admin.sql`
- `20261002214000_wikimedia_quarantine_data_alignment.sql`

Registrazione. Il 2026-10-06 `npx supabase migration list` ha mostrato Local e Remote uguali per ogni versione della tabella sopra, non solo per le due del 5 ottobre. Questo **VERIFICA** che quelle versioni sono registrate. Non verifica il comportamento delle funzioni, delle policy o dei dati. Le righe diverse da `20261005143000` e `20261005123000` non vanno lette come «comportamento provato»: la lista non esegue le RPC.

Storico. La versione del 2026-10-05 affermava insieme che le migration fino a `20261002219000` erano sul remoto e che `admin_blocked` non esisteva. La seconda affermazione è superata dalla lista del 2026-10-06, che registra `20261002217000`. Non è stata rifatta una `SELECT` sulla colonna.

## 14. Test

I file qui sotto sono **DOCUMENTATI** come presenti nel repository. La loro esecuzione, in questo aggiornamento, è **NON VERIFICATA**:

- `npm run mf3:smoke`
- `npm run mf4:smoke`
- `scripts/smoke-image-mgmt-phase1-unit.ts`
- `supabase/tests/hard_delete_media_photo_contract.sql`

Il contract test è uno script `BEGIN` … `ROLLBACK`, non una migration. Il suo header dice che le DELETE su `storage.objects` verificano la RLS SQL, non l'API Storage, e che `storage.allow_delete_query` è solo di quello script. Esito del contract test: **NON VERIFICATO**. Non risulta, in questo aggiornamento, una esecuzione dello script.

La versione del 2026-10-05 registrava smoke, unit e Biome come passati, e `tsc -p tsconfig.app.json` come fallito su errori già presenti. Quei risultati non sono stati ripetuti qui.

Browser, smoke, contract test e lettura delle righe (una `SELECT` sulle tabelle) in questo aggiornamento: **NON VERIFICATI**. La lista delle migration della sezione 13 è l'unica verifica di database fatta qui, e riguarda solo la registrazione delle versioni.

## 15. Decisioni ancora valide nel codice

- Il flag Wikimedia è sulla riga del file. Validare il POI A valida quel file anche per un POI B che lo usa. Non si cerca il POI B.
- La motivazione massiva riempie solo le note obbligatorie ancora vuote, poi usa la stessa RPC della validazione singola.
- `asset_status = restored` resta nel vocabolario ed è etichettato RIATTIVATO.
- Il placeholder non è un bersaglio di CANCELLA FOTO.
- L'ordine D-22 non è stato cambiato da CANCELLA FOTO. La cascata si ricalcola perché l'assignment cancellato non è più candidato.
