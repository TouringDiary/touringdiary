# City Delete — Orphan, Relink e visibilità globale contenuti

> **Stato documento:** Piano progettuale / audit consolidato  
> **Data:** 2026-09-30  
> **Scope:** Documentazione e pianificazione **ONLY** — nessuna implementazione in questo documento  
> **Separazione processo:** Questo lavoro è **distinto** dalla validazione dei deliverable Fase 2 già sviluppati (INT-09 migration, Wikimedia, UI delete, ecc.)

---

## Legenda stati

| Etichetta | Significato |
|-----------|-------------|
| **DECISIONE CHIUSA** | Vincolo di prodotto/architettura già approvato — non modificare senza nuova decisione |
| **PROPOSTA** | Direzione in valutazione, non approvata per implementazione |
| **IPOTESI DA VALIDARE** | Da confermare con audit tecnico / prodotto |
| **PROBLEMA RISCONTRATO** | Gap o non-conformità rilevata nel repo |
| **DECISIONE ANCORA DA PRENDERE** | Richiede workshop prodotto |

---

## 1. Contesto

**DECISIONE CHIUSA (processo):** Fase 2 Image Management include sviluppo INT-09 (`delete_city_admin`, FK, soft-delete, relink città) e altri deliverable. La **validazione** di quei file procede **prima** di qualsiasi refactor per visibilità globale.

**PROPOSTA:** Separare lo **stato editoriale/moderativo** del contenuto dalla **pubblicabilità** derivata da:
- contesto città (published vs draft vs deleted_orphan);
- scelta CONSERVA + **ONLINE ON/OFF** per categoria al city delete;
- regole esistenti (MF2, assignment, D-22, sospensioni).

**PROBLEMA RISCONTRATO:** INT-09 attuale (file in validazione) imposta `photo_submissions.status = 'city_deleted'` su CONSERVA media, mentre POI/personaggi/patrono non mutano status. Non esiste un layer unificato «city non pubblica ⇒ blocca accesso pubblico» su tutti gli entry point.

---

## 2. Problema attuale

| # | Problema | Evidenza |
|---|----------|----------|
| P1 | Stato contenuto usato anche come proxy di orfanità (`city_deleted`) | Migration INT-09 L281–283; `governance.ts` PHOTO_SUBMISSION_STATUS_VALUES |
| P2 | Relink non ripristina stati contenuto (by design INT-09) ma `city_deleted` resta se non cambiato | `relink_orphaned_city_content` — solo riga `cities` |
| P3 | **Deep link città** non rispetta draft / deleted_orphan | `server/routes/city.routes.ts`; `getCityDetails` — nessun gate |
| P4 | Manifest filtra `deleted_orphan` solo lato client | `cityReadService.getFullManifestAsync` L526; bootstrap `/api/bootstrap/cities` **senza** filtro |
| P5 | Modello modale Fase 2 = 3 boolean (`keepUserPhotos`, `keepPOIs`, `keepPeople`) — **non** CONSERVA/CANCELLA globale + ONLINE per categoria | `DeleteCityOptionsModal.tsx`, `types/core.ts` |
| P6 | Eventi/servizi/guide/operatori **sempre DELETE** in INT-09 | Migration L363–366 — **non** allineato a PROPOSTA CONSERVA estesa |
| P7 | ONLINE ON «ovunque tranne city page» richiede mappa entry point per categoria — **assente** | Audit sotto §11 |

---

## 3. Decisioni già chiuse (da preservare)

| ID | Decisione | Fonte |
|----|-----------|--------|
| D-CONS-07 | CONSERVA ORFANO: `city_id` invariato, relink stesso ID | Master Plan Appendice H; Execution §36–§37.4 |
| D-CONS-20 / §38.6 | Personaggi: CONSERVA/CANCELLA in modale (implementazione Fase 2: 3 flag) | Master Plan J.5 |
| MF2 | `content_reports`: **mai DELETE**; storico/evidence | Execution §37.4; INT-09 migration |
| IM | `entity_image_history` append-only; assignment storici; RESTRICT FK su delete city | Execution §37.4 B |
| D90 | CANCELLA Person/POI/Patron gallery via RPC dedicate — **non** sostituire con DELETE naive | Migration D90 |
| DL-022 / O7 | Sponsor **non** cancellati al delete city; detach + relink | `20260714180000_sponsor_phase4_contracts_shop_city.sql`; AI_CONTEXT 29 §DL-022 |
| INT-09 ruolo | Delete city solo **admin_all** (RPC guard) | Execution §30.10, §37.4 E |
| Relink città | Post soft-delete: `deleted_at` NULL; da `deleted_orphan` → **`draft`** (non auto-publish) | **DECISIONE CHIUSA** (prompt 2026-09-30) — da allineare in SSOT §37.4 D («status live» ambiguo) |
| **City non pubblica** | `draft` e `deleted_orphan` = **non raggiungibili pubblicamente**, inclusi deep link / ID diretto | **DECISIONE CHIUSA** (prompt 2026-09-30) — **PROBLEMA RISCONTRATO:** non implementato ovunque |
| Admin | **admin_all** mantiene accesso gestionale completo (draft, orphan, contenuti OFF) | **DECISIONE CHIUSA** (prompt 2026-09-30) |

---

## 4. Decisioni nuove emerse (da validare)

| # | Testo | Stato |
|---|--------|--------|
| N1 | Non mutare status editoriali/moderativi al CONSERVA se evitabile | **PROPOSTA** |
| N2 | CONSERVA/CANCELLA globale + per categoria **ONLINE ON/OFF** | **PROPOSTA** (modale futuro §18) |
| N3 | ONLINE ON = raggiungibile da **tutte** le superfici pubbliche previste per la categoria, **eccetto** city page se città non pubblica | **PROPOSTA** |
| N4 | ONLINE OFF = conservato in DB, solo admin, messaggio «temporaneamente non disponibile» su accesso pubblico | **PROPOSTA** |
| N5 | Gerarchia pubblicabilità vs MF2/IM | **DECISIONE ANCORA DA PRENDERE** (analisi §9 doc) |

---

## 5. Principio CONSERVA / CANCELLA (modale futuro)

**PROPOSTA — struttura:**

1. **COSA VUOI FARE?** → `[ CANCELLA ]` | `[ CONSERVA ]`
2. Se **CONSERVA** → elenco categorie (inventario §14) con toggle **ONLINE ON/OFF** per categoria.

**DECISIONE CHIUSA (Fase 2 in validazione):** implementazione attuale = matrice §37.4 ridotta a 3 flag + shops sempre cancellati + eventi/servizi/guide/operatori sempre DELETE (INT-09). **Non** confondere con PROPOSTA modale futuro.

---

## 6. Principio ONLINE ON / OFF

| | ONLINE ON | ONLINE OFF |
|---|-----------|------------|
| **Conservazione dati** | Sì | Sì |
| **Admin** | Gestione piena | Gestione piena |
| **City page (città non pubblica)** | Contenuto **non** via city page | No |
| **Altre superfici pubbliche** | Sì, se regole MF2/IM/editoriale lo permettono | **No** — messaggio indisponibilità |
| **Storage URL diretto** | **IPOTESI DA VALIDARE** — oggi bucket public (§23) | Richiede policy/architettura dedicata |

---

## 7. Stato contenuto vs pubblicabilità

**PROPOSTA — dimensioni separate:**

| Dim | Esempi |
|-----|--------|
| A. Città pubblica? | `published` + `deleted_at IS NULL` + non `deleted_orphan` |
| B. Contenuto conservato? | Riga esiste, `city_id` invariato |
| C. Visibilità pubblica categoria? | Future: flag/scelta ONLINE ON/OFF al delete |
| D. Stato editoriale | POI `published`, photo `approved`, person `published`, patron_editorial_status |
| E. Image Management | assignment_status, asset_status, is_current |
| F. Segnalazioni | content_reports.status, transizioni MF2 |

**PROBLEMA RISCONTRATO:** oggi D e C sono **fusi** su foto via `city_deleted`.

---

## 8. Regola draft / deleted_orphan (città)

**DECISIONE CHIUSA:**

- `published` → città **pubblicamente raggiungibile** (subject to catalog rules).
- `draft` → **non** pubblicamente raggiungibile.
- `deleted_orphan` (+ `deleted_at`) → **non** pubblicamente raggiungibile.
- Vale per deep link, API pubbliche, route, endpoint — **non** aggirabile conoscendo `city_id`.

**PROBLEMA RISCONTRATO — conformità attuale:**

| Entry point | Rispetta? | Note |
|-------------|-----------|------|
| `getFullManifestAsync(onlyPublished=true)` | **Parziale** | Filtra `published` + esclude `deleted_orphan` |
| Bootstrap `GET /api/bootstrap/cities` | **No** | Tutte le righe view; filtro solo client |
| `GET /api/city/:id/details` | **No** | Restituisce città orphan/draft se id noto |
| `getCityDetails` (fallback Supabase) | **No** | Stesso |
| `useCityData` → pagina città | **No** | Carica qualsiasi id |
| `AppRouter` + slug/id | **No** | Se id risolto, mostra `CityDetailContent` |
| Admin `getCityDetails(..., admin)` | **N/A (pubblico)** | Admin **deve** vedere — OK |

**Cache:** `city_details_${cityId}_*`, manifest TTL — invalidare su delete/relink (**DECISIONE ANCORA DA PRENDERE** su policy cache orphan).

---

## 9. Regola admin_all

**DECISIONE CHIUSA:** Il blocco pubblico **non** applica ad admin. Admin deve vedere draft, deleted_orphan, contenuti CONSERVA, ONLINE OFF, ORFANE, MF2, IM.

**Evidenza:** `CitiesListTab`, `AdminCityEditor`, `PhotoModeration`, `AdminReportsHub`, RPC guarded ma invocabili da admin autenticato.

---

## 10. Inventario categorie (modale / city delete)

Legenda colonne: **Cons/Canc** = oggi INT-09; **Pub senza city*** = altre superfici oltre city page; **IM/MF2/D90**.

| Categoria modale (label proposta) | Tabelle / oggetti | city_id | Cons/Canc oggi | Pub senza city* | ONLINE ON possibile?* | IM | MF2 | Note |
|----------------------------------|-------------------|---------|----------------|-----------------|----------------------|----|-----|------|
| Foto Community | `photo_submissions`, assignment `photo_submission` | Sì | keepUserPhotos | Galleria città, liste globali moderazione pubblica | **IPOTESI** — galleria + eventuali ranking | Sì | Sì | `city_deleted` oggi |
| POI | `pois`, reviews, suggestions | Sì | keepPOIs | Deep link POI, Around Me, sponsor-POI, itinerari, modali | **IPOTESI** — molti entry point | Sì | Sì | D90 se CANCELLA |
| Personaggi | `city_people`, categories links | Sì NOT NULL | keepPeople | Schede cultura, Around Me merge | **IPOTESI** | Sì | Sì | D90 se CANCELLA |
| Patrono | `cities.patron_*`, `city_patron_gallery`, assignment patron | city_id | Legato keepUserPhotos (media) | Modale patrono, sezioni cultura | **IPOTESI** | Sì | Sì (MF2 patron) | editorial_status separato |
| Hero / Media città | `cities` hero, assignment `entity_type=city` | — | Implicito CONSERVA city row | Manifest hero, card, D-22 | **IPOTESI** — card via manifest | Sì | — | Città non pub ⇒ hero off manifest |
| Eventi | `city_events` | Sì | **SEMPRE DELETE** INT-09 | City page tabs | ⚠️ **DECISIONE PRODOTTO NECESSARIA** | No | — | §15 |
| Servizi | `city_services` | Sì | **SEMPRE DELETE** | City page | ⚠️ idem | No | — | §15 |
| Guide | `city_guides` | Sì | **SEMPRE DELETE** | City page, itinerari? | ⚠️ idem | No | — | §15 |
| Tour operator | `city_tour_operators` | Sì | **SEMPRE DELETE** | City page | ⚠️ idem | No | — | §15 |
| Sponsor | `sponsors` | Nullable | **Detach** sempre | Liste sponsor, shop, Around Me | ⚠️ **Conflitto** con ONLINE ON/OFF — §18 | Parziale | — | DL-022 |
| Negozi | `shops` | NOT NULL | **SEMPRE DELETE** (INT-09 attuale — invariato in questa fase) | Shop deep link, sponsor (se shop esiste) | ⚠️ **DECISIONE PRODOTTO NECESSARIA** — verificare se Negozi rientrano nel futuro modello CONSERVA/CANCELLA e, in caso di CONSERVA, nella futura scelta ONLINE ON/OFF | — | — | Oggi: Execution §37.4 «sempre cancella»; PROPOSTA modale futura: **da validare** |
| Segnalazioni MF2 | `content_reports` | Sì (SET NULL hard) | **Mai DELETE** | **N/A — solo area amministrativa** (non superficie pubblica del contenuto) | **N/A — non applicabile** (non contenuto pubblico; hub Admin MF2) | Indiretto | **DECISIONE CHIUSA** (MF2: mai DELETE; city delete non rende report pubblici) | |
| Assignment / history / assets | `entity_image_assignments`, `entity_image_history`, `media_assets` | city_id su assignment | CONSERVA: no DELETE | Via entità | Segue entità + IM | **DECISIONE CHIUSA** | | |
| Staging OSM | staging tables (client) | tag | `orphanCityStaging` | Import admin | N/A | — | — | |
| Visite / preferiti | `user_visited_cities`, `user_favorites` | Sì | Hard delete visited | MySpace? | **IPOTESI** | — | — | |
| Legacy report foto | `patron_photo_*`, `famous_person_*` | Sì | DELETE path CANCELLA | — | Decommission INT-REP | — | — | |
| Contenuti community POI | `suggestions` (domain) | poi/city | DELETE con POI | Modali community | **IPOTESI** | — | Parziale | |
| Affiliate | `affiliate_clicks` | SET NULL | Non INT-09 core | Analytics | N/A | — | — | |

\* «Possibile» = tecnicamente/project — **non** decisione chiusa.

---

## 11. Inventario punti di accesso pubblici

| Superficie | File / servizio | Entità tipiche | Gate città oggi? | Gate contenuto oggi? |
|------------|-----------------|----------------|------------------|----------------------|
| Manifest / home shelf | `getFullManifestAsync`, `buildHomeShelf`, bootstrap cities | Città | Parziale | N/A |
| City page | `useCityData`, `CityDetailContent`, API details | Tutto aggregato | **No** | POI: UI published; people: fetch public |
| City gallery | `useCityGallery`, `listPhotographs` | Foto | No | approved / pending owner; no city_deleted |
| Deep link POI | `NavigationContext` | POI | No (carica POI by cityId) | No status filter on find |
| Deep link shop | `NavigationContext` | Shop | Naviga city | Shop deleted on city delete |
| Around Me / virtual city | `buildVirtualCity`, manifest published only | POI, eventi, guide | Manifest | POI all statuses in fetch |
| Itinerari | `ItineraryDetail` getCityDetails public | Città, POI | **No** | Parziale |
| AI Planner | `AiPlannerTimeline` | Città | Manifest | Parziale |
| Sponsor UI | `useSponsorLogic`, fetch by city | Sponsor, POI | Manifest cities | Sponsor approved |
| Rankings / search | `useRankingsLogic` | Cities, photos, pois | Parziale | Varie |
| PDF export | `pdfUtils` getCityDetails public | Città | **No** | Parziale |
| MySpace minimal city | `cityMinimalRead` | Nome città | **No** | N/A |
| Storage CDN | `getPublicUrl`, bucket public-media | File | **No** | **No** |
| Patron modal pubblico | `PatronSaintModal` | Patrono | No | patron_editorial_status |
| QA Forum | `QaForumTab` + manifest | city name | Manifest | — |

---

## 12. Photo submissions / `city_deleted`

| Aspetto | Dettaglio |
|---------|-----------|
| **Chi scrive** | INT-09 `delete_city_admin` (CONSERVA media); legacy `flagPhotosAsCityDeleted` in `photoService.ts` (**nessun caller** attivo da `deleteCity` RPC) |
| **Chi legge** | `useCityGallery` (esclude implicitamente non approved); admin `usePhotoModeration` filtro; `PhotoRow` UI |
| **Governance** | `PHOTO_SUBMISSION_STATUS_VALUES`, `Media.ts` type |
| **Necessario?** | **DECISIONE ANCORA DA PRENDERE** — oggi usato come marker orphan **e** esclusione galleria |
| **Se INT-09 non lo usasse** | Admin filtro ORFANE (§13) perderebbe senso; galleria mostrerebbe `approved` orphan se manca city gate; serve sostituto (visibility flag o city gate) |
| **Alternativa coerente PROPOSTA** | Mantenere `approved` + gate città + future ONLINE OFF |

---

## 13. Admin «ORFANE» — identificazione precisa

| # | Risposta |
|---|----------|
| 1–2 | **Non** route URL dedicata — Admin SPA view `photos` |
| 3 | `src/components/admin/PhotoModeration.tsx` |
| 4–5 | Hook `src/hooks/admin/usePhotoModeration.ts`; filtri `src/components/admin/photos/PhotoFilters.tsx`; righe `PhotoRow.tsx` |
| 6 | Menu: **Community → «Foto & Moderazione»** — `AdminSidebar.tsx` id `photos` → `AdminDashboard.tsx` case `'photos'` |
| 7 | Admin vede griglia moderazione: pending default, filtri status/città/origine |
| 8 | Filtro status **`city_deleted`** — label tab **«ORFANE»** in `PhotoFilters.tsx` L12 |
| 9–10 | **Schermata generale moderazione foto**, non pagina orphan-only; ORFANE è **un filtro status** |
| 11 | Approve/reject/delete/upload/metadata (admin_all per operazioni sensibili) — `usePhotoModeration` |
| 12 | **Altre entità orphan admin:** città `deleted_orphan` in Cities Manager (lista); sponsor «da ricollegare» (dashboard sponsor); **non** filtro unificato cross-entity |

**Nota:** `PhotoRow` L62: `isOrphan = !cityInfo && photo.status === 'city_deleted'` — orphan UI **mescola** assenza città in manifest e status.

---

## 14–18. Patrono, Eventi, Servizi, Guide, Operatori

### Patrono (§16)

- **Componenti:** `CulturePatron*`, `city_patron_gallery`, assignment `entity_type=patron`, `patron_editorial_status` su `cities`.
- **CONSERVA (INT-09):** gallery + assignments se keepUserPhotos; primary non revocato.
- **Pubblico:** `isPatronPublicContentHidden` — **non** guard città orphan.
- **ONLINE ON/OFF:** **DECISIONE ANCORA DA PRENDERE** per ogni superficie (modale patrono, tab cultura).
- **MF2:** report patron — **DECISIONE CHIUSA** non DELETE al city delete.

### Eventi / Servizi / Guide / Operatori (§15)

**Decisione precedente (INT-09 / §37.4 F):** «DELETE (oggi sempre)» per eventi, servizi, guide, operatori — **DECISIONE CHIUSA per Fase 2 INT-09 implementato**, non per PROPOSTA modale futura.

⚠️ **DECISIONE PRODOTTO NECESSARIA:** PROPOSTA CONSERVA + ONLINE ON/OFF **confligge** con DELETE sistematico migration L363–366. Fonte: Execution §37.4 tabella F; migration file in validazione.

---

## 19. Sponsor — decisione storica (§12 prompt)

| Domanda | Risposta |
|---------|----------|
| Perché scollegati? | FK `city_id` nullable; contratto sponsor **non** terminato quando città sparisce (**DL-022**) |
| Decisione prodotto | **DECISIONE CHIUSA** — «Da ricollegare», mai DELETE involontario (`AI_CONTEXT/29_SPONSOR_SECURITY_MASTERPLAN.md`; migration comment) |
| Conservati? | Riga sponsor + `last_city_id` |
| Relink | `relink_orphaned_sponsors_to_city(p_city_id, p_city_name)` + `reclaimOrphanedItems` in `cityLifecycleService.ts` |
| Chiusa? | **Sì** per detach/relink pattern |
| Compatibile ONLINE ON/OFF? | **DECISIONE ANCORA DA PRENDERE** (vedi §32) |

**Chiarimento (DL-022 / O7 — decisione storica chiusa):**

- La logica **detach + relink**, contratto **non** cancellato al city delete, e RPC `handle_city_deleted_for_sponsors` / `relink_orphaned_sponsors_to_city` restano **DECISIONE STORICA CHIUSA** — **non** modificate in questa fase di audit/piano.
- **Non** si decide ora se gli sponsor debbano entrare nel futuro modello generale CONSERVA/CANCELLA + ONLINE ON/OFF.
- In fase di progettazione successiva (post-validazione Fase 2) occorrerà **solo verificare** come conciliare DL-022/O7 con quel modello **PROPOSTA** — senza anticipare soluzioni tecniche o modifiche a migration/servizi sponsor.

---

## 20–21. Image Management e content_reports

**DECISIONE CHIUSA:** CONSERVA non DELETE assignment/history/assets; revoke solo path CANCELLA / D90.

**PROPOSTA:** IM invariato al delete; pubblicabilità = layer sopra (city + ONLINE + MF2).

**content_reports:** **DECISIONE CHIUSA** — mai DELETE; city delete non altera status report (soft); hard SET NULL `city_id` only.

**Conflitto potenziale:** POI `published` + ONLINE ON + report `in_verifica` — **DECISIONE ANCORA DA PRENDERE** (precedenza MF2 > ONLINE > city).

---

## 22. Storage (§13 prompt)

| Oggi | Valutazione |
|------|-------------|
| Bucket `public-media` — URL pubblici | Fruizione **indipendente** da status DB |
| ONLINE OFF «via sito» | Realistico con gate applicativi + non esporre URL in UI |
| Blocco accesso diretto file | **Architetturale** (signed URL, bucket private, CDN rules) — **non** semplice |
| IM | Revoke assignment ≠ rimuove file; asset condiviso resta |

**DECISIONE ANCORA DA PRENDERE:** requisito minimo solo «no UI» vs «no URL diretto».

---

## 23–29. Cache, deep link, manifest, search, diari

| Area | Rischio ONLINE OFF / city gate |
|------|--------------------------------|
| Cache manifest | Città orphan esclusa dopo refresh; stale fino a TTL |
| Cache `city_details_*` | Deep link può servire snapshot pre-delete |
| Deep link POI | `NavigationContext` — no gate |
| Search / rankings | `useRankingsLogic` — dati aggregati — **audit incompleto** → follow-up |
| Diari / itinerari | `ItineraryDetail` carica città public — **no gate** |
| Realtime | Nessun uso critico rilevato su city lifecycle |
| Bootstrap | Raw manifest — consumer deve filtrare |

---

## 30. Rischi

1. Deep link bypass (city, POI, itinerari, PDF).
2. `city_deleted` removal senza sostituto → foto approved visibili.
3. PROPOSTA ONLINE ON multi-superficie → explosion of gate points.
4. Storage URL leak.
5. Conflitto PROPOSTA CONSERVA eventi vs INT-09 DELETE.
6. Sponsor detach vs ONLINE ON semantics.
7. Cache stale.
8. Governance types: `deleted_orphan` fuori `CITY_STATUS_VALUES`.

---

## 31. Gap

- Helper centralizzato «isCityPubliclyAccessible» / «isContentPubliclyVisible(category, context)» — **assente**.
- Persistenza scelta ONLINE ON/OFF al delete — **schema non definito** ( **DECISIONE ANCORA DA PRENDERE** — no implementazione in questa fase).
- Mappa completa search/myspace — **parziale** in questo documento.

---

## 32. Decisioni da prendere

1. ⚠️ CONSERVA eventi/servizi/guide/operatori vs INT-09 DELETE (comportamento **attuale** INT-09: DELETE — invariato fino a decisione).
2. ⚠️ **Negozi** — verificare se rientrano nel futuro modello CONSERVA/CANCELLA e, in caso di CONSERVA, nella futura scelta ONLINE ON/OFF. **Non** implica che debbano essere conservati, cancellati o avere ONLINE ON/OFF: solo **DECISIONE PRODOTTO NECESSARIA** (oggi INT-09: **SEMPRE DELETE**).
3. ⚠️ Modello dati ONLINE ON/OFF (colonna? JSON su cities? tabella delete_options?) — **PROPOSTA**, non approvato.
4. ⚠️ Precedenza MF2 / IM / ONLINE / city / editorial — **PROPOSTA**, non approvata.
5. ⚠️ **Sponsor** — verificare come conciliare la decisione storica **DL-022/O7** (detach + relink, contratto non cancellato) con il futuro modello **PROPOSTA** CONSERVA/CANCELLA + ONLINE ON/OFF. **Nessuna modifica approvata** in questa fase; DL-022/O7 **non** viene modificata salvo futura revisione esplicita.
6. ⚠️ Storage: blocco URL diretto in scope? — **DECISIONE ANCORA DA PRENDERE**.
7. ⚠️ Abbandono `city_deleted` — sì/no e migrazione dati — **DECISIONE ANCORA DA PRENDERE**.
8. ⚠️ City gate globale (implementazione su API/deep link/cache) — **DECISIONE ANCORA DA PRENDERE**; distinto dalla regola prodotto **DECISIONE CHIUSA** «draft / deleted_orphan non pubblicamente raggiungibili» (§8), la cui implementazione non è ancora approvata come soluzione tecnica.
9. ⚠️ Modello CONSERVA/CANCELLA globale e significato definitivo di ONLINE ON / ONLINE OFF — **PROPOSTA**, da validare.
10. Allineare SSOT §37.4 D «status live» vs **draft** relink (**DECISIONE CHIUSA** prodotto 2026-09-30 — documentazione SSOT, non implementazione).

---

## 33. File da rivalutare dopo validazione Fase 2

| File | Motivo | Dipendenza |
|------|--------|------------|
| `supabase/migrations/20260929100000_image_management_phase2_int09_city_delete.sql` | `city_deleted`, DELETE eventi, sponsor flow | Validazione INT-09 prima |
| `src/services/city/cityLifecycleService.ts` | RPC options shape, reclaim | INT-09 |
| `src/components/admin/cities/DeleteCityOptionsModal.tsx` | UI 3-flag vs PROPOSTA modale | Prodotto |
| `src/services/city/cityReadService.ts` | Manifest gate vs getCityDetails | City gate |
| `server/routes/city.routes.ts` | API pubblica | City gate |
| `server/routes/bootstrap.routes.ts` | Manifest raw | City gate |
| `src/hooks/useCityData.ts` | Public city load | City gate |
| `src/context/NavigationContext.tsx` | Deep link POI/shop | Content visibility |
| `src/hooks/useCityGallery.ts` | Foto approved | ONLINE + city |
| `src/services/photoService.ts` | city_deleted, listPhotographs | Photo policy |
| `src/components/admin/photos/PhotoFilters.tsx` | ORFANE filter | Admin orphan UX |
| `src/hooks/admin/usePhotoModeration.ts` | Moderation | Admin |
| `src/constants/governance.ts` | CITY_STATUS, photo statuses | Types |
| `src/types/core.ts` | CityDeleteOptions | Modale |
| `src/components/city/CityDetailContent.tsx` | POI published filter | City gate |
| `src/components/itineraries/ItineraryDetail.tsx` | Public city fetch | Cross-surface |

**Non modificare** fino a chiusura validazione Fase 2 + decisioni §32.

---

## 34. Dipendenze dalla validazione Fase 2

```text
[Fase 2 deliverable] → validazione → test → E2E → chiusura
        ↓
Decisioni §32 + RFC visibilità
        ↓
Implementazione (INT-09 bis / INT-VIS-* / migration follow-up)
```

INT-09 in validazione resta **scope chiuso** su decisioni §37.4 Fase 2; questo piano **non** annulla la validazione corrente.

---

## 35. Prossimo passo (progettuale)

1. Workshop prodotto su §32 (max 2 sessioni).
2. Inventory gate completamento (search, myspace, rankings) — task audit follow-up.
3. Aggiornare Execution §37.4 con PROPOSTA modale **solo dopo** decisioni.
4. RFC tecnico: city public gate minimale (deep link + API) **prima** di ONLINE ON/OFF per categoria.
5. **Non** iniziare implementazione finché Fase 2 validation non è chiusa.

---

*Fine documento — riferimento ufficiale pianificazione City Delete / Orphan / Visibility (2026-09-30)*
