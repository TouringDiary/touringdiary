# AUDIT — Sistema Recensioni e Rating

> **Tipo:** Audit tecnico forense (sola lettura)  
> **Data:** 2026-07-23  
> **Scope:** Recensioni utenti, rating POI/listing, Feature Flag, moderazione, strumenti admin post-segnalazione, ordinamento «Valutazione»  
> **Regola:** nessuna implementazione in questa attività. Ogni conclusione è dimostrata da codice e/o interrogazione DB remoto.  
> **DB remoto interrogato:** progetto linked `Touring Diary` (`iyncirtysrjrmqwfmkbm`) — policy RLS, colonne, trigger, grant, publication Realtime, elenco tabelle blacklist.

---

## 1. Executive Summary

Il sistema recensioni **esiste** e **persiste** su tabella centralizzata `public.reviews` (POI e itinerari). Il Feature Toggle Centro di Controllo **esiste ed è cablato**. Il modello operativo attuale è **moderazione preventiva** (`status = 'pending'` all’insert): le recensioni **non** sono pubblicate immediatamente agli altri utenti.

Il rating mostrato nei listing POI e usato dall’ordinamento «Valutazione» **non deriva dalle recensioni**. Deriva dal campo statico `pois.rating`, scritto solo in salvataggio POI (editor/AI/admin). **Nessun** codice applicativo, **nessun** trigger SQL e **nessuna** RPC aggiornano `pois.rating` a partire da `reviews`.

Modifica/eliminazione lato autore **non sono implementate** end-to-end (manca service UPDATE contenuto; UI POI senza edit/delete; RLS senza policy UPDATE/DELETE per l’autore). Gli admin (`admin_all` e `admin_limited`) possono eliminare e cambiare status via policy RLS «Admin full access to reviews».

L’alert soglia rating Sponsor **esiste** come evidenziazione UI su recensioni `approved`, **non** come notifica automatica alla pubblicazione sotto soglia. Non esiste Blacklist utenti/email di piattaforma. Sospendere/eliminare utenti è presente in UI Admin, ma RLS su `profiles` consente solo UPDATE del proprio profilo (nessuna policy admin UPDATE/DELETE).

| # | Tema | Verdetto |
|---|------|----------|
| 0 | Feature Toggle inserimento recensioni | **ESISTE completo** (`feature.moderation.reviews`) |
| 1 | Modifica/eliminazione autore | **ASSENTE / rotto** (UI+service+RLS) |
| 2 | Eliminazione admin Limited/All | **FUNZIONA via RLS** (UI ItineraryManager) |
| 3 | Rating listing POI errato/non aggiornato | **ROOT CAUSE CERTA:** disaccoppiamento `reviews` ↔ `pois.rating` |
| 4 | No approvazione preventiva + alert soglia | **NON allineato:** oggi pending→approve; alert soglia solo UI Sponsor |
| 5 | Strumenti admin post-segnalazione + blacklist | **Parziale:** suspend/delete UI sì, RLS profiles no; blacklist **assente** |
| 6 | Ordina → Valutazione non cambia ordine | **ROOT CAUSE CERTA:** sort su `poi.rating` statico (stesso gap del punto 3) |

---

## 2. Architettura del sistema recensioni

### 2.1 Modello dati (due famiglie)

| Famiglia | Persistenza | Entità | Stato |
|----------|-------------|---------|-------|
| **Unificata** | Tabella `public.reviews` | POI (`poi_id`), Itinerari (`itinerary_id`) | Pipeline completa insert + moderazione admin |
| **JSON locale** | Colonna `reviews` (jsonb) su `shops`, `city_guides`, `city_tour_operators` | Shop, Guide, Tour operator | Feedback in-modal / locale; **non** passa da `reviews` |

Vincolo DB su `reviews`: esattamente uno tra `poi_id` e `itinerary_id` (`review_target_check`).

### 2.2 Pipeline runtime POI (codice)

```
UI: PoiDetailModal / PoiImageSection → openModal('review')
  → FeatureModals → ReviewModal
    → onSubmit → InteractionContext.submitReview
      → evaluateCachedFeatureFlag(feature.moderation.reviews)
      → saveUnifiedReview (reviewService)
        → supabase.from('reviews').insert({ status: 'pending', criteria, rating, ... })
```

Successo UI: solo dopo insert OK → `onSubmitSuccess` → `openModal('reviewSuccess')` (`FeatureModals.tsx`).

### 2.3 Pipeline runtime itinerari

```
ItineraryReviews → ReviewModal
  → saveUnifiedReview({ itineraryId, status pending })
  → lista: approved per tutti; pending solo se author === user.name
```

### 2.4 Moderazione admin

```
AdminDashboard → ItineraryManager (tab Recensioni)
  → getUnifiedReviews()
  → updateUnifiedReviewStatus(id, approved|rejected)
  → deleteReviewAsAdmin(id)
  → (su approve) addNotification XP claim lato client
```

### 2.5 Repository / RPC

- **Repository:** accesso diretto PostgREST (`supabase.from('reviews')`) in `reviewService.ts`. **Nessuna** RPC dedicata a create/update/delete/list reviews.
- **Realtime:** tabella `reviews` **non** presente in `pg_publication_tables` (nessuna subscription Realtime sul dominio recensioni).
- **Cache:** `saveUnifiedReview` **non** invalida `cityCache` / rating POI.

---

## 3. Architettura del sistema rating

### 3.1 Tre concetti distinti (non unificati)

| Concetto | Dove vive | Chi lo scrive | Chi lo legge |
|----------|-----------|---------------|--------------|
| **Voto singola recensione** | `reviews.rating` (+ `reviews.criteria`) | `saveUnifiedReview` / UI criteri | Moderazione, dettaglio recensione, media Sponsor |
| **Rating scheda POI** | `pois.rating` (+ `pois.votes`) | `poiWrite.saveSinglePoi` (editor/AI/admin) | Listing città, card, sort «Valutazione», dettaglio POI header |
| **Rating città aggregato** | `cities.rating` da `details.ratings` | `cityPayloadMapper.calculateDerivedRating` | CityCard / editor TabRatings — **non** da recensioni utente |

### 3.2 Calcolo media di una recensione

1. UI: `ReviewModal` → `computeReviewAverageRating(criteriaRatings)`.
2. Service: se `criteria` presenti, `rating` ricalcolato da criteri; altrimenti usa `review.rating`.
3. Persistenza: colonna `reviews.rating` (numeric 0–5, check DB).

### 3.3 Media usata per alert Sponsor

`sponsorRatingService.enrichSponsorsWithRatings`:

- SELECT `reviews.poi_id, rating` dove `status = 'approved'` e `poi_id IN (...)`.
- Media aritmetica client-side, 1 decimale.
- Confronto con `threshold.sponsor_rating_alert_stars` (fallback `CRITICAL_RATING_THRESHOLD = 3`).

**Non aggiorna** `pois.rating`.

### 3.4 Assenza di ricalcolo POI

Dimostrato:

- Grep applicativo: unico `.update` con `rating` aggregato è nello Sponsor enrich (oggetto in-memory), non su `pois`.
- DB remoto: **zero** trigger su `pois` legati a review/rating.
- DB remoto: funzioni pubbliche con nome `%review%` / `%rating%` → solo `handle_review_approval_xp` (XP, non rating).
- `poiWrite.updatePoiVotes` aggiorna solo `votes`, non `rating`.

---

## 4. File coinvolti

### 4.1 Core recensioni

| File | Ruolo |
|------|-------|
| `src/services/community/reviewService.ts` | Insert, list, update status, delete |
| `src/services/communityService.ts` | Barrel re-export |
| `src/context/InteractionContext.tsx` | `submitReview` + guard Feature Flag |
| `src/components/modals/ReviewModal.tsx` | UI insert/edit form + guard flag |
| `src/components/layout/modals/FeatureModals.tsx` | Apertura review POI, submit, success |
| `src/components/modals/poiDetail/PoiImageSection.tsx` | Listing recensioni **approved** + rating da `poi.rating` |
| `src/components/itineraries/ItineraryReviews.tsx` | Recensioni itinerario + «edit» (insert duplicato) |
| `src/components/admin/ItineraryManager.tsx` | Moderazione approve/reject/delete |

### 4.2 Feature Flag / CC

| File | Ruolo |
|------|-------|
| `src/constants/platformFeatureFlags.ts` | Chiavi `feature.moderation.reviews`, messaggio `moderation_reviews_paused` |
| `src/services/platformControl/platformControlMapper.ts` | Mapping flag → UI CC |
| `src/components/admin/platformControl/PlatformControlCenter.tsx` | Tab `moderation` |
| Migration seed | `supabase/migrations/20260717160000_platform_control_phase1_configuration_source.sql` |
| Migration criteria | `supabase/migrations/20260723140000_reviews_add_criteria.sql` |

### 4.3 Rating POI / sort città

| File | Ruolo |
|------|-------|
| `src/services/city/poi/poiMapper.ts` | `rating: db.rating \|\| 0` |
| `src/services/city/poi/poiWrite.ts` | Persiste `pois.rating` / `votes` |
| `src/components/city/tabs/CityCategoryTab.tsx` | Sort client `sortBy === 'rating'` su `poi.rating` |
| `src/components/city/tabs/CityGuide.tsx` | Render lista ordinata |
| `src/components/city/ShowcaseCards.tsx` | Stelle da `poi.rating` |
| `src/components/common/StarRating.tsx` | Visualizzazione stelle |

### 4.4 Sponsor soglia / admin utenti / POI lifecycle

| File | Ruolo |
|------|-------|
| `src/services/sponsors/sponsorRatingService.ts` | Media approved + threshold |
| `src/hooks/useSponsorLogic.ts` | Filtro «sotto soglia» |
| `src/components/admin/sponsor/SponsorTable.tsx` | Badge «Sotto soglia» |
| `src/components/admin/AdminUserManager.tsx` | Suspend / delete utenti (UI) |
| `src/services/userService.ts` | `updateUser` / `deleteUser` su `profiles` |
| `src/components/admin/AdminPoiManager.tsx` | Bulk draft/published + delete POI |
| `src/services/city/cityLifecycleService.ts` | Delete reviews by `poi_id` in lifecycle città |

### 4.5 Documentazione correlata (stato pre-audit)

| Doc | Nota |
|-----|------|
| `AI_CONTEXT/27_USER_REVIEW_SYSTEM.md` | Descrive pending + moderazione; **allineato allo stato attuale**, **non** al target PO (no approvazione) |
| `AI_CONTEXT/30_PLATFORM_SETTINGS_MASTERPLAN.md` | Catalogo flag + soglia |
| `AI_CONTEXT/29_SPONSOR_SECURITY_MASTERPLAN.md` | DL-021 / DL-030 alert umano |

---

## 5. Tabelle coinvolte

| Tabella | Ruolo nel dominio |
|---------|-------------------|
| `public.reviews` | SoT recensioni POI/itinerari |
| `public.pois` | `rating`, `votes`, `status` (listing/sort/display) |
| `public.profiles` | Autore (`author_id`), XP trigger, suspend status |
| `public.platform_feature_flags` | `feature.moderation.reviews`, `threshold.sponsor_rating_alert_stars` |
| `public.system_messages` | Template `moderation_reviews_paused` |
| `public.notifications` | Notifica client post-approve |
| `public.shops` / `city_guides` / `city_tour_operators` | Campo JSON `reviews` (ramo parallelo) |
| `public.cities` | `rating` / `ratings` (dominio città, non user reviews) |

**Colonne `reviews` (remoto, 2026-07-23):**  
`id`, `author_name`, `author_id`, `poi_id`, `itinerary_id`, `rating`, `comment`, `status`, `created_at`, `approved_at`, `criteria`.

**Constraint:** PK; FK `author_id → profiles` ON DELETE SET NULL; check target XOR; check rating 0–5; check status ∈ {pending, approved, rejected}.  
**Nessun** UNIQUE `(author_id, poi_id)` → più recensioni dello stesso utente sullo stesso POI ammesse a livello schema.

---

## 6. RPC coinvolte

| RPC | Ruolo rispetto a recensioni |
|-----|-----------------------------|
| **Nessuna** RPC create/update/delete/list reviews | CRUD diretto PostgREST |
| `mutate_platform_feature_flag` | Mutazione flag CC (incluso reviews / soglia) |
| Observatorio (`get_observatory_stats`, `get_detailed_city_stats`) | Metriche aggregate (es. `avg_rating` città) — **non** pipeline user review → POI |

---

## 7. Policy RLS coinvolte (`public.reviews` — remoto)

RLS **abilitata** (`relrowsecurity = true`, `relforcerowsecurity = false`).

| Policy | Comando | USING / WITH CHECK | Effetto dimostrato |
|--------|---------|--------------------|--------------------|
| `Admin full access to reviews` | **ALL** | `profiles.id = auth.uid()` AND role ∈ (`admin_all`,`admin_limited`) | Admin Limited **e** Admin All: SELECT/INSERT/UPDATE/DELETE |
| `Enable insert for authenticated users only` | INSERT | WITH CHECK `true` | Insert autenticato senza vincolo `author_id` |
| `Public Insert Reviews` | INSERT | WITH CHECK `true` | Insert pubblico (anche anon, se grant lo consente) |
| `Users can create reviews` | INSERT | WITH CHECK `auth.uid() = author_id` | Insert scoped all’autore |
| `Public Read Reviews` | SELECT | `true` | Legge **tutte** le status |
| `Public read approved reviews` | SELECT | `status = 'approved'` | Ridondante rispetto alla policy sopra (policy permissive OR) |

**Assente (dimostrato):**

- Policy **UPDATE** per autore (`author_id = auth.uid()`).
- Policy **DELETE** per autore.

**Grant tabella:** `anon` e `authenticated` hanno SELECT/INSERT/UPDATE/DELETE a livello GRANT; il vincolo effettivo per UPDATE/DELETE non-admin è l’**assenza di policy RLS**.

---

## 8. Trigger coinvolti (`public.reviews` — remoto)

| Trigger | Evento | Funzione | Effetto |
|---------|--------|----------|---------|
| `on_review_approved_give_xp` | AFTER INSERT OR UPDATE | `handle_review_approval_xp()` | Se diventa `approved`: +10 o +20 XP su `profiles` (parole commento) |
| `on_review_approved_insert` | AFTER INSERT WHEN `status=approved` | `award_xp_for_action()` | +20 XP fisso |
| `on_review_approved_update` | AFTER UPDATE WHEN passa ad `approved` | `award_xp_for_action()` | +20 XP fisso |

**Effetto collaterale dimostrato:** su approve via UPDATE, partono **entrambi** `handle_review_approval_xp` e `award_xp_for_action` → XP duplicati (10/20 + 20).  
**Nessun** trigger aggiorna `pois.rating` / `pois.votes`.

---

## 9. Flusso completo delle recensioni

### 9.1 Creazione POI

1. Utente autenticato apre dettaglio POI → «Scrivi Recensione».
2. `ReviewModal` verifica `feature.moderation.reviews` (fail-open UI: `enabled ?? true`; service fail-closed se flag presente e OFF).
3. Submit calcola media criteri → `submitReview` → `saveUnifiedReview`.
4. Insert con `status: 'pending'`.
5. Modal successo. XP UI success = claim marketing; XP reale solo a approval (trigger).

### 9.2 Visibilità pubblica

`PoiImageSection` carica `getUnifiedReviews()` e filtra `r.poiId === poi.id && r.status === 'approved'`.  
Le `pending` **non** compaiono agli altri utenti nel pannello recensioni POI.

### 9.3 Moderazione

Admin apre **Itinerari & Recensioni** → tab Recensioni → Approve/Reject/Delete.  
Approve: `updateUnifiedReviewStatus` setta `status` + `approved_at`; notifica client; trigger XP.

### 9.4 Rami non unificati

- **Guide / Tour operator:** stato locale React (`localReviews`) + JSON entity; `saveUnifiedReview` **non** chiamato nel percorso guide analizzato.
- **Shop:** lettura `shop.reviews` JSON; nessuna write unificata nel percorso `ShopReviews`.

---

## 10. Flusso completo del calcolo rating (listing / sort)

```
Editor/AI/Admin salva POI
  → poiWrite.saveSinglePoi scrive pois.rating
  → poiRead/poiMapper espone PointOfInterest.rating
  → CityCategoryTab / ShowcaseCards / PoiImageSection leggono poi.rating

PARALLELAMENTE (isolato):
  User scrive review → reviews.rating (pending)
  Admin approva → reviews.status=approved
  Sponsor UI → AVG(reviews.rating) approved per poi_id  [solo CRM Sponsor]
```

**Non esiste** passo che sincronizzi `AVG(reviews)` → `pois.rating`.

---

## 11. Analisi per punto richiesto

### 11.0 Feature Toggle Centro di Controllo

| Domanda | Risposta dimostrata |
|---------|---------------------|
| Esiste? | **Sì**, completo |
| Chiave | `feature.moderation.reviews` (label UI «Recensioni utenti») |
| Dove in CC | Tab **Moderazione** (`PlatformControlCenter` case `moderation`) |
| Messaggio OFF | `moderation_reviews_paused` |
| Consumer | `ReviewModal` (UI blocco), `InteractionContext.submitReview` (throw se OFF) |
| Dove andrebbe inserito se mancasse | N/A — già presente; eventuale hardening: guard anche su path itinerari (`ItineraryReviews.handleAddReview` oggi **non** valuta il flag) |

**Gap parziale:** `ItineraryReviews` chiama `saveUnifiedReview` senza `evaluateCachedFeatureFlag` / `useFeatureFlag`. Con flag OFF, il path itinerari può ancora tentare l’insert (il modal mostra comunque overlay se embedded in `ReviewModal` che controlla il flag — e in itinerari usa `ReviewModal`, quindi UI OFF è attiva; manca solo guard service-side su quel path).

---

### 11.1 Modifica / eliminazione da parte dell’autore

| Layer | Stato |
|-------|-------|
| **UI POI** | Nessun `existingReview`, nessun pulsante elimina; solo «Scrivi Recensione» |
| **UI Itinerario** | Pulsante Edit presente; **nessun** Delete |
| **Service update contenuto** | **Assente** — solo `updateUnifiedReviewStatus` (status) e `insert` |
| **Edit itinerario** | `handleAddReview` richiama `saveUnifiedReview` → **nuovo INSERT** (duplicato), non UPDATE |
| **RLS UPDATE autore** | **Assente** |
| **RLS DELETE autore** | **Assente** |

**Root cause CERTA:** assenza end-to-end di (a) API update/delete contenuto, (b) wiring UI POI, (c) policy RLS author UPDATE/DELETE. Anche aggiungendo solo UI, il DB rifiuterebbe UPDATE/DELETE non-admin.

---

### 11.2 Eliminazione admin (Limited + All)

| Layer | Stato |
|-------|-------|
| **UI** | `ItineraryManager.confirmDelete` → `deleteReviewAsAdmin` — **nessun** check ruolo in componente |
| **Service** | `supabase.from('reviews').delete().eq('id', id)` |
| **RLS** | Policy ALL per `admin_all` **e** `admin_limited` |
| **RPC** | Nessuna |

**Verdetto:** entrambi i ruoli admin **possono** eliminare a livello DB se autenticati con quel `profiles.role`. Accesso UI tramite Admin panel (voce «Itinerari & Recensioni» visibile a entrambi).

**Limitazione:** delete admin **non** ricalcola `pois.rating` (irrilevante finché rating POI non è derivato dalle reviews).

---

### 11.3 Rating listing POI — ROOT CAUSE CERTA

**Sintomo:** stelle/media in listing non riflettono (o non aggiornano dopo) le recensioni.

**Catena dimostrata:**

1. Display: `PoiImageSection` / card usano `poi.rating`.
2. Origine `poi.rating`: colonna `pois.rating` via `poiMapper`.
3. Scrittura `pois.rating`: solo `saveSinglePoi` (e flussi editor/AI che lo chiamano).
4. Insert/approve review: tocca solo `reviews.*`.
5. Nessun trigger/RPC/cache invalidation collega i due.

**Root cause CERTA:** il listing mostra un campo denormalizzato **mai sincronizzato** con la tabella recensioni. Non è un bug di cache Realtime (reviews non è in publication) né un bug di arrotondamento UI.

Contributi secondari (non sostitutivi della root cause):

- Visibilità pubblica solo `approved` → anche se si calcolasse media da reviews, le pending non entrerebbero.
- `votes` aggiornato da like/vote path separato (`updatePoiVotes`), confondibile con «numero recensioni».

---

### 11.4 Approvazione preventiva vs alert soglia

| Aspetto | Stato attuale | Target richiesto |
|---------|---------------|------------------|
| Status all’insert | `pending` hard-coded in `saveUnifiedReview` | Pubblicazione immediata |
| Visibilità | Solo `approved` in `PoiImageSection` | Subito visibile |
| Workflow admin | Coda pending in `ItineraryManager` + approve/reject | **Nessuna** approvazione obbligatoria |
| Alert soglia | Media approved su Sponsor CRM + badge/filtro | Segnalazione admin quando media sotto soglia CC |
| Soglia CC | `threshold.sponsor_rating_alert_stars` | Esiste |
| Notifica automatica «recensione sotto soglia» | **Assente** (nessun insert notification/trigger su soglia) | Richiesta funzionale |

**Verdetto:** il sistema è un **workflow di moderazione preventiva**. L’alert qualità Sponsor è **solo UI di consultazione** su media approved, non un workflow di segnalazione alla pubblicazione.

**Cosa deve cambiare (solo descrizione):**

1. Insert con `status = 'approved'` (o rimozione del gating status in lettura).
2. Rimozione/riqualifica UI approve obbligatoria; mantenere strumenti admin di intervento (delete, etc.).
3. Job/hook post-write: ricalcolo media POI; se media < soglia → notifica/badge admin (senza auto-sospensione — allineato DL-021).
4. Allineare trigger XP a «pubblicazione immediata» (oggi legati ad approved).

---

### 11.5 Strumenti admin post-segnalazione + Blacklist

| Capacità richiesta | Esiste? | Dove | Gap |
|--------------------|---------|------|-----|
| Sospendere utenza | UI sì | `AdminUserManager.handleStatusToggle` → `profiles.status` | RLS `profiles`: solo `profiles_update_own` → admin **non** può aggiornare altri profili via client anon |
| Eliminare utenza | UI sì | `deleteUser` → `profiles.delete` | **Nessuna** policy DELETE su `profiles` |
| Mettere POI in bozza | Sì | `AdminPoiManager` bulk `draft`/`published` | Disponibile, ma **non** collegato al flusso recensione segnalata |
| Eliminare POI | Sì | `AdminPoiManager` delete | Idem |
| Eliminare recensione | Sì | `ItineraryManager` | Non collegato a «segnalazione soglia» |
| Aprire profilo autore da review | No wiring dedicato | — | Manca deep-link review → User Manager |
| Blacklist utenti/email | **No** | Nessuna tabella `*blacklist*/*ban*/*blocked*/*denied*` in `public` | Da introdurre se PO conferma |

**Impatto architetturale blacklist (se introdotta):**

- Nuova tabella (es. `registration_email_blacklist` / `user_sanctions`) + RLS admin-only.
- Hook su signup (`auth` / `profiles` insert) per rifiutare email/domain.
- UI in Utenti & Ruoli o Centro di Controllo.
- Distinguere da blacklist valigia AI (`suitcase_rejections`) — dominio diverso.

**Nota permessi:** `ROLE_PERMISSIONS.admin_limited` include `ADM-USR-VIEW` (view) non `ADM-USR-FULL`; la UI suspend/delete non consulta `hasPermission` — usa solo gerarchia ruolo. Anche con fix RLS, va allineata ACL.

---

### 11.6 Ordina → Valutazione — ROOT CAUSE CERTA

**UI:** `CityCategoryTab` menu Ordina → `SortItem id="rating" label="Valutazione"`.

**Logica sort (client):**

```ts
case 'rating': return ((a.rating || 0) - (b.rating || 0)) * multiplier;
```

`filteredList` è passato a `CityGuide` → l’ordinamento **è applicato** alla lista renderizzata.

**Dati:** `a.rating` / `b.rating` = `pois.rating` statico (stesso campo del punto 3).

**Root cause CERTA:** l’ordinamento per «Valutazione» confronta valori **non alimentati** dalle recensioni utente. Se i POI di una categoria condividono lo stesso `pois.rating` (es. tutti `0`, o tutti seed AI uguali), l’ordine **non cambia** in modo percepibile. Non è un bug del click handler del menu.

**Non è** un problema di query server: il sort è 100% client su `sourceList` già caricato.

---

## 12. Problemi individuati (catalogo)

| ID | Problema | Severità |
|----|----------|----------|
| P-01 | `pois.rating` disaccoppiato da `reviews` (listing + sort) | Critica funzionale |
| P-02 | Moderazione preventiva (`pending`) vs target pubblicazione immediata | Critica prodotto |
| P-03 | Autore non può modificare/eliminare (UI+service+RLS) | Alta |
| P-04 | «Edit» itinerario crea INSERT duplicato | Alta |
| P-05 | Path itinerari senza guard Feature Flag a livello service | Media |
| P-06 | Policy INSERT `WITH CHECK true` (duplicati / anon) | Alta sicurezza |
| P-07 | SELECT pubblico di tutte le status (policy `Public Read Reviews`) | Media privacy/moderazione |
| P-08 | XP duplicato su approve (due trigger) | Media |
| P-09 | Alert soglia: solo UI Sponsor, nessuna segnalazione automatica | Alta vs target |
| P-10 | Admin suspend/delete utenti bloccati da RLS `profiles` | Alta operativa |
| P-11 | Blacklist email/utenti assente | Gap prodotto |
| P-12 | Nessuna invalidazione cache città su nuova review | Media (dopo sync rating) |
| P-13 | Nessun UNIQUE author+target → spam multi-review | Media |
| P-14 | Rami Shop/Guide fuori tabella `reviews` | Debito architetturale |
| P-15 | Policy/tabelle `reviews` **assenti** dalle migration repo (solo `criteria` ADD) | Drift schema |

---

## 13. Root Cause CERTA per ogni problema

| ID | Root Cause (prova) |
|----|--------------------|
| P-01 | `saveUnifiedReview` non scrive `pois`; nessun trigger/RPC; display/sort leggono `poi.rating` |
| P-02 | `status: 'pending'` in insert + filter `approved` in `PoiImageSection` + UI approve in `ItineraryManager` |
| P-03 | Nessun metodo update contenuto; FeatureModals senza `existingReview`/delete; RLS senza author UPDATE/DELETE |
| P-04 | `ItineraryReviews.handleAddReview` → sempre `saveUnifiedReview` (INSERT) anche con `editingReview` |
| P-05 | Solo `InteractionContext` e `ReviewModal` valutano il flag; `handleAddReview` itinerario no |
| P-06 | Policy remote `Public Insert Reviews` / `Enable insert…` con `WITH CHECK true` |
| P-07 | Policy remote `Public Read Reviews` USING `true` |
| P-08 | Trigger `on_review_approved_give_xp` + `on_review_approved_update` entrambi su passaggio ad approved |
| P-09 | `enrichSponsorsWithRatings` + `SponsorTable` badge; nessun writer notification su soglia |
| P-10 | Uniche policy profiles: read pubblica/own, insert own, **update own**; zero DELETE |
| P-11 | Query `information_schema.tables` senza match blacklist/ban/blocked/denied |
| P-12 | `invalidateCityCache` chiamato da `poiWrite`, non da `reviewService` |
| P-13 | Constraint list remota: solo PK/FK/check — no unique author+poi |
| P-14 | Guide/Shop usano JSON locale; DOC 27 già classifica PARZIALE |
| P-15 | Grep migrations: CREATE TABLE/POLICY reviews assenti; solo ALTER criteria |

---

## 14. Soluzioni consigliate (solo descrizione — nessuna implementazione)

### 14.0 Feature Toggle

Mantenere `feature.moderation.reviews` come interruttore globale insert. Aggiungere la stessa guard service-side su **tutti** i path di scrittura (incluso itinerari). Opzionale: estendere il significato a «blocco totale UX recensioni» anche su listing (oggi blocca solo insert).

### 14.1 Edit / Delete autore

1. Service: `updateUnifiedReview(id, payload)` e `deleteOwnReview(id)` con check `author_id`.
2. RLS: policy UPDATE/DELETE `author_id = auth.uid()` (e opzionalmente solo se non locked da admin).
3. UI POI: caricare review esistente dell’utente; passare `existingReview`; pulsante Elimina.
4. UI Itinerario: sostituire INSERT-on-edit con UPDATE; aggiungere Elimina.
5. UNIQUE opzionale `(author_id, poi_id)` / `(author_id, itinerary_id)` per una review per target.

### 14.2 Delete admin

Mantenere policy admin ALL. Opzionale: RPC `admin_delete_review` per audit trail. Collegare azione da schermata alert soglia (deep-link).

### 14.3 Rating listing + sort (P-01 / P-06 sort)

Scegliere **una** Source of Truth:

- **Opzione A (consigliata):** colonna denormalizzata `pois.rating` + `pois.review_count` aggiornata da trigger/RPC su INSERT/UPDATE/DELETE di `reviews` (solo status pubblicati).
- **Opzione B:** listing/sort calcolano media da query aggregata `reviews` (più costoso).

In entrambi i casi: invalidare `cityCache` dopo mutazione; allineare `CityCategoryTab` sort allo stesso campo.

### 14.4 No approvazione + alert soglia

1. Insert `approved` (o abolire status per user reviews).
2. Riqualificare tab Recensioni admin: coda «segnalazioni qualità» invece di pending approval.
3. Dopo scrittura/ricalcolo media: se media POI (o sponsor collegato) < `threshold.sponsor_rating_alert_stars` → creare notifica/admin badge (senza auto-ban).
4. Unificare trigger XP su evento «review pubblicata» (un solo trigger).

### 14.5 Strumenti admin + blacklist

1. Fix RLS/RPC admin su `profiles` (UPDATE status / DELETE) allineato a `admin_all` / `admin_limited` + `ROLE_PERMISSIONS`.
2. Da alert rating: azioni contestuali → sospendi utente, elimina utente, draft/delete POI, elimina review.
3. Se PO conferma blacklist: nuova tabella + enforcement signup + UI gestione; non riusare blacklist valigia.

### 14.6 Hardening sicurezza collaterale

- Revocare/restringere INSERT `WITH CHECK true`.
- Restringere SELECT pubblico a status pubblicati (+ own pending se ancora usati).
- Portare policy `reviews` in migration repo (chiudere drift P-15).

---

## 15. Matrice «cosa modificare successivamente» (file prioritari)

| Priorità | Area | File / oggetti DB |
|----------|------|-------------------|
| P0 | Sync rating | Trigger/RPC + `reviewService` + `poiWrite`/`poiMapper` |
| P0 | Pubblicazione immediata | `reviewService` status; `PoiImageSection` filter; `ItineraryManager` workflow |
| P0 | Author edit/delete | `reviewService` + RLS policies + `FeatureModals` + `ItineraryReviews` |
| P1 | Alert soglia | Hook post-media + notifications/admin badge; riuso `sponsorRatingService` |
| P1 | Profiles admin RLS/RPC | policy/RPC + `userService` / `AdminUserManager` ACL |
| P2 | Flag itinerari | `ItineraryReviews` |
| P2 | XP singolo trigger | funzioni SQL remote |
| P2 | Migration repo sync | dump policy `reviews` → migration |
| P3 | Blacklist (se PO sì) | nuova tabella + signup + UI |
| P3 | Unificazione Shop/Guide | fuori scope minimo |

---

## 16. Non-scope / esplicitamente verificato assente

- Realtime su `reviews`: **assente** dalla publication.
- RPC CRUD reviews: **assente**.
- Cache dedicata reviews: **assente** (solo city cache lato POI write).
- Tabella blacklist piattaforma: **assente**.

---

## 17. Metodo di prova (tracciabilità)

| Fonte | Uso |
|-------|-----|
| Codice TypeScript/React elencato §4 | Flussi UI→service |
| `src/types/supabase.ts` | Shape tabelle |
| `supabase db query --linked` (2026-07-23) | Policy RLS reviews/profiles, colonne, trigger, grant, publication, tabelle blacklist |
| DOC 27 / 29 / 30 | Contesto prodotto e flag |

---

*Fine audit forense iniziale. Implementazione P0 autorizzata PO 2026-07-23 — vedi §18.*

---

## 18. Decisioni PO e stato implementazione (P0)

> **Approvazione PO:** 2026-07-23  
> **Scope implementazione:** solo punti elencati sotto. Tutto il resto resta rimandato.

### 18.1 Decisioni approvate

| # | Decisione | Azione |
|---|----------|--------|
| 0 | Feature Toggle `feature.moderation.reviews` | **Nessuna modifica** — confermato corretto |
| 1 | Una sola recensione per utente per POI | **IMPLEMENTARE** — UPDATE se esiste |
| 2 | Modifica autore (testo/voto/criteri) | **IMPLEMENTARE** — vero UPDATE |
| 3 | Eliminazione autore | **IMPLEMENTARE** — UI + service + RLS |
| 4 | Data ultima modifica «Modificata il …» | **IMPLEMENTARE** |
| 5 | Delete admin da UI recensioni POI | **IMPLEMENTARE** — icona Cestino (admin) |
| 6 | Rating POI = media recensioni (SoT unica) | **IMPLEMENTARE** — sync su `pois.rating` |
| 7 | Ordina → Valutazione sul rating reale | **IMPLEMENTARE** (segue #6) |
| 8 | Pubblicazione immediata (no approvazione) | **IMPLEMENTARE** |
| 9 | Alert soglia → coda Segnalazioni in Itinerari & Recensioni | **IMPLEMENTARE** |
| 10 | Storico permanente recensioni admin + sort | **IMPLEMENTARE** |

### 18.2 Decisioni rimandate (NON implementare in P0)

- Blacklist utenti/email
- Fix RLS suspend/delete `profiles` (admin)
- Hardening policy INSERT `WITH CHECK true` (salvo quanto necessario al P0)
- Unificazione Shop/Guide sulla tabella `reviews`
- Altri gap audit non elencati in §18.1

### 18.3 Stato implementazione

| Area | Stato |
|------|-------|
| Migration DB P0 | **Completata** — `20260723160000_reviews_p0_publish_rating_alerts.sql` applicata su remoto |
| Service / RLS client | **Completata** |
| UI utente (edit/delete/modificata) | **Completata** |
| UI admin (cestino POI, segnalazioni, storico) | **Completata** |
| Rating SoT + sort | **Completata** (sort usa già `poi.rating`; sync trigger alimenta SoT) |
| DOC 27 / MASTER 06 / coverage map | **Aggiornati** |

### 18.4 Note architetturali scelte in P0

- **SoT rating:** `pois.rating` denormalizzato, aggiornato da trigger SQL su mutazioni `reviews` (`sync_poi_rating_from_reviews`).
- **Coda admin:** tabella `review_rating_alerts` (open/acknowledged/resolved) — distinta dallo storico `reviews` (che non viene cancellato dalle segnalazioni).
- **Status review:** insert/update con `approved` immediato; coda pending rimossa dall’UI admin.
- **Delete admin su POI:** icona Cestino in `PoiImageSection` per `admin_all` / `admin_limited` (oltre a Storico in ItineraryManager).
- **Feature Toggle:** nessuna modifica (decisione #0).
- **Post-P0 cleanup (2026-07-23):** `deleteItineraryReview` → `deleteReviewAsAdmin`; `PoiImageSection` legge solo `reviews` + `pois.rating` (niente merge `poi.reviews`, niente media client-side).

### 18.5 Punti aperti post-P0

- Blacklist utenti/email (rimandato)
- Hardening INSERT RLS `WITH CHECK true` (rimandato)
- Unificazione Shop/Guide su `reviews` (rimandato)
- Fix RLS admin su `profiles` suspend/delete (rimandato)
- Deep-link da segnalazione alert → dettaglio POI / User Manager (non richiesto in P0)
