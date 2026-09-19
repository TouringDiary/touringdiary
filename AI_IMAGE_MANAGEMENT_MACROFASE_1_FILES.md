# Macrofase 1 — Struttura Admin + stati + categorie

> **Ultimo aggiornamento:** 2026-09-16 (D72 patron_editorial_status; PatronSaintModal gate MF1; §42.1 media_assets)

> ## ⚠️ REGOLA OBBLIGATORIA — LETTURA CONGIUNTA
>
> **PRIMA DI QUALSIASI SVILUPPO** consultare **insieme**:
> 1. `AI_IMAGE_MANAGEMENT_MASTER_PLAN.md`
> 2. `AI_IMAGE_MANAGEMENT_AUDIT.md`
> 3. **`AI_IMAGE_MANAGEMENT_MACROFASE_1_FILES.md`**
>
> **Workflow:** leggere i tre documenti → **progettazione tecnica MF1** → approvazione Paolo → verificare DB/RPC/RLS/Storage → **SVILUPPO** → **TEST** → E2E MF1. Solo dopo TEST accettabile → Macrofase 2.

---

## Obiettivo macrofase (perimetro funzionale)

MF1 costruisce lo **scheletro** dell'area **Admin Panel → Segnalazioni** e le basi architetturali minime. **Non** anticipa il sistema completo di segnalazioni.

| In scope MF1 | Fuori scope MF1 (→ MF2 o oltre) |
|--------------|----------------------------------|
| Hub shell: routing, navigazione, 4 macro-tab **scheletro** | Modello centralizzato segnalazioni completo |
| Punto di ingresso futuro (`AdminReportsHub`) | Modello B (Image + Personaggio separati) |
| Categorie Personaggio in Edit città → Storia | Stati operativi report NUOVO/IN VERIFICA/OK/KO/TUTTE |
| Placeholder Personaggi in Asset Globali (**Q9/D89 chiusa** — esistenti invariati + categoria + Personaggio Generico) | Guest OTP |
| Stati entità (D39) + colonna `cities.patron_editorial_status` (D72) | Evidenza immutabile fotografia segnalata (D70 → **MF2**) |
| Schema base `media_assets` (**predisposizione**) | `entity_image_assignments`, `content_reports` |
| | Wikidata, Media Library catalogo, AI queue |

### Chiarimento hub vs vecchi manager

- `AdminReportsHub.tsx` e le macro-tab MF1 sono **scheletro** e **punto di ingresso** della futura gestione centralizzata.
- **Non** devono diventare una seconda implementazione parallela dei vecchi manager.
- Durante MF1 restano **operativi** `SuggestionManager`, `AdminFamousPeopleManager` e le route esistenti (`suggestions`, `famous_people`).
- In **MF2** le funzioni verranno **ricondotte** alla nuova struttura; rimozione `AdminFamousPeopleManager` **solo dopo** migrazione completa (Master Plan §37).

---

## “Prepare DB” — stati entità (significato esplicito)

Quando questo documento parla di **prepare DB** per gli stati entità **non** significa:

- introdurre migration distruttiva;
- convertire immediatamente tutti i dati esistenti;
- modificare dati reali prima dell'approvazione della progettazione e dell'avvio SVILUPPO.

Significa invece:

1. **Verificare** lo schema reale (oggi `city_people.status`: `draft` | `published` — migration `set_famous_person_editorial_status`).
2. **Progettare** estensione **additiva** verso **DRAFT/PUBLISHED/SUSPENDED/CANCELED** (mapping DB lowercase: `draft`, `published`, `suspended`, `canceled`; **NEEDS_CHECK**/`needs_check` **solo POI**).
3. **Mantenere compatibilità** con dati e RPC esistenti (`upsert_city_person_with_category_links`).
4. **Determinare** in technical design la migration più sicura (CHECK/enum esteso, **senza** UPDATE massivo in MF1).
5. Eseguire migration e backfill stati **solo** in SVILUPPO MF1 approvato — eventuale backfill dati come passo controllato e reversibile dove possibile.

---

## `media_assets` in MF1 — solo base architetturale

In MF1 la tabella `media_assets` è **predisposizione tecnica** per il modello fotografia autonoma (Master §39):

- colonne minime: id, storage_bucket, storage_path, origin_type, is_placeholder, generated_by_ai, created_at;
- **senza** lifecycle completo stati immagine (→ MF3);
- **senza** assignments (→ MF2);
- **senza** integrazione report/evidence (→ MF2);
- **senza** dual-write obbligatorio su `city_people.image_url` in MF1 (→ MF2/MF5).

---

## SVILUPPO → TEST → E2E

| Fase | Contenuto |
|------|-----------|
| **SVILUPPO** | Solo dopo approvazione progettazione § sotto |
| **TEST** | `npm run check`; hub navigabile; categorie da Edit città; placeholder salvati; vecchi manager ancora funzionanti |
| **E2E MF1** | Admin → Segnalazioni → 4 macro-tab visibili (contenuto placeholder); Edit città → Storia → CATEGORIA PERSONAGGIO; Asset Globali → placeholder personaggio + generale; Patrono DRAFT/SUSPENDED → **SUGGERISCI** (no contenuto Patrono) |
| **Regressioni** | `PoiClaimModal` / Rivendica invariato; save personaggio RPC; `AdminFamousPeopleManager` ancora raggiungibile |

**Criterio completamento:** TEST verde + E2E MF1 + nessuna regressione su flussi esistenti. **Non** richiede funzionalità segnalazioni MF2.

---

## File da CREARE

| File | Motivo | Tipo MF1 |
|------|--------|----------|
| `src/components/admin/reports/AdminReportsHub.tsx` | Shell hub: layout + 4 macro-tab | Scheletro |
| `src/components/admin/reports/AdminReportsCommunityTab.tsx` | Placeholder UI ("contenuto in Macrofase 2") | Scheletro |
| `src/components/admin/reports/AdminReportsPatronTab.tsx` | Idem | Scheletro |
| `src/components/admin/reports/AdminReportsFamousPersonTab.tsx` | Idem + link transitorio a manager legacy se utile | Scheletro |
| `src/components/admin/reports/AdminReportsAiTab.tsx` | Idem | Scheletro |
| `src/components/admin/adminHeaderManager/FamousPersonPlaceholdersSection.tsx` | UI placeholder categoria + generale (pattern `PlaceholderSection`) | Funzionale MF1 |
| `supabase/migrations/YYYYMMDD_media_assets_schema.sql` | Tabella `media_assets` minima + RLS base admin | Predisposizione |
| `supabase/migrations/YYYYMMDD_entity_status_prepare.sql` | Estensione status **additiva** su `city_people`, `pois` | Predisposizione |
| `supabase/migrations/YYYYMMDD_cities_patron_editorial_status.sql` | Colonna **`cities.patron_editorial_status`** (D72) — **NON** in `patron_details` | Predisposizione |

**Non creare in MF1:** `mediaAssetService.ts` completo, servizi report, modale Segnala abuso unificato, bucket `report-evidence`.

---

## File da MODIFICARE

| File | Motivo | Cosa NON fare |
|------|--------|---------------|
| `src/components/admin/AdminDashboard.tsx` | Route `suggestions` → `AdminReportsHub` (shell); mantenere `famous_people` → legacy manager | Non rimuovere case `famous_people` |
| `src/components/admin/layout/AdminSidebar.tsx` | Label **Segnalazioni** coerente; **mantenere** voce Personaggi Famosi fino a MF2 | Non eliminare `famous_people` |
| `src/components/admin/SuggestionManager.tsx` | Re-export/redirect verso `AdminReportsHub` **oppure** deprecazione commentata | Non duplicare logiche segnalazioni |
| `src/components/admin/cityEditor/culture/CulturePeople.tsx` | Pulsante **CATEGORIA PERSONAGGIO** + overlay (pattern Tassonomia `EditorInfo.tsx`) | — |
| `src/components/admin/AdminFamousPeopleCategoriesManager.tsx` | Supporto modal overlay con `cityId` opzionale | Non rimuovere uso embedded in manager legacy |
| `src/components/admin/AdminHeaderManager.tsx` | Integrare `FamousPersonPlaceholdersSection` | Non rompere placeholder POI |
| `src/services/settingsService.ts` | Chiavi `famous_person_category_placeholders`, `famous_person_general_placeholder` | Riutilizzare pattern `category_placeholders` |
| `src/context/ConfigContext.tsx` | Esporre placeholder personaggi nel bootstrap | — |
| `src/constants/governance.ts` | Vocabolario **DRAFT/PUBLISHED/SUSPENDED/CANCELED** (+ NEEDS_CHECK POI) | Non breaking change runtime |
| `src/services/city/cityPayloadMapper.ts` | Leggere/scrivere **`cities.patron_editorial_status`** (D72) | Migration MF1 solo post-approvazione Paolo |
| `src/services/city/cityReadService.ts` | Esporre `patron_editorial_status` da colonna dedicata (D72) | Idem |
| `src/components/modals/PatronSaintModal.tsx` | Gate pubblico **SUGGERISCI** se `patron_editorial_status` = DRAFT/SUSPENDED (D49) — **implementazione MF1** | Contenuto Patrono e immagini nascosti; non dipende da MF2 |
| `src/components/admin/cityEditor/culture/CulturePatron.tsx` | UI stato editoriale ordinario Patrono (**DRAFT/PUBLISHED** only) — **implementato 2026-09-18** | **NON** permettere SUSPENDED/CANCELED da questo editor |

---

## Stato editoriale Santo Patrono — sede UI (decisione 2026-09-18)

Campo: **`cities.patron_editorial_status`** (D72). Stati: DRAFT · PUBLISHED · SUSPENDED · CANCELED.

| Stati | Sede Admin | Note |
|-------|------------|------|
| **DRAFT / PUBLISHED** | Edit Città → Storia → Santo Patrono | Stato editoriale ordinario |
| **SUSPENDED / CANCELED** | Segnalazioni → Santo Patrono | Solo workflow segnalazioni; **non** modificabili dall'editor città |

**Implementato:** `CulturePatron.tsx` + costanti `PATRON_ORDINARY_EDITORIAL_STATUS_VALUES` in `governance.ts`.

---

## File da VERIFICARE (non modificare salvo necessità approvata)

| File | Motivo |
|------|--------|
| `src/components/modals/PoiClaimModal.tsx` | Rivendica — **vietato** modificare in MF1 |
| `src/services/entitiesService.ts` | RPC `upsert_city_person_with_category_links` |
| `src/components/admin/AdminFamousPeopleManager.tsx` | Resta operativo; audit migrazione MF2 |
| `supabase/migrations/20260910180000_upsert_city_person_with_category_links.sql` | RPC verificata |

---

## File da ELIMINARE

| File | Quando |
|------|--------|
| — | **Nessuna eliminazione in MF1** |

---

## DB / RPC / RLS / Storage

| Tipo | MF1 |
|------|-----|
| **Migration `media_assets`** | Schema minimo; gestione Admin; policy lettura public (asset pubblicati) in MF2 (D77); no uso app obbligatorio in MF1 |
| **Migration stati entità** | Progettata additiva; esecuzione solo post-approvazione |
| **RPC nuove** | Nessuna obbligatoria MF1 |
| **Storage** | Upload placeholder su bucket asset globali esistente (come POI) |
| **RPC esistente** | `upsert_city_person_with_category_links`: **DB + PostgREST verificati**; **POST E2E applicativo reale non eseguito** (eviterebbe modifica dati reali) |

---

## Dipendenze

- Master Plan §32, §37, §38 (MF1), §39
- Audit §38.A, §38.M
- **Blocca MF2:** hub shell navigabile

---

## Progettazione tecnica MF1 (in attesa approvazione Paolo)

> Verifica repository eseguita 2026-09-15. **Nessun codice modificato. Nessun dato reale modificato.**

### 1. Hub Segnalazioni (shell)

**Cosa cambia:** la route `/admin/suggestions` (già etichettata "Segnalazioni" in `AdminDashboard`) renderizza `AdminReportsHub` invece di `SuggestionManager` diretto.

**Perché:** creare il punto di ingresso unico futuro senza implementare MF2.

**Come funziona:**
- `AdminReportsHub`: header "Segnalazioni", tab bar orizzontale (Community | Santo Patrono | Personaggio Famoso | AI).
- Ogni tab mostra contenuto **placeholder** (testo + eventuale link "Gestione attuale" verso `/admin/famous_people` o moduli legacy dove esiste già funzionalità).
- **Nessuna** query report, **nessun** badge conteggio reale (→ MF2/MF3).

**Dipendenze:** pattern tab simile ad altri manager Admin; lazy import in `AdminDashboard`.

**Rischi/regressioni:** utenti Admin abituati a `SuggestionManager` — mitigare con link esplicito alla gestione legacy dove serve.

---

### 2. Sidebar e route

**Cosa cambia:** voce sidebar `suggestions` resta; opzionale sottotitolo "Hub segnalazioni". Voce `famous_people` **resta** con badge esistente (`getPendingFamousPeopleAdminCount`).

**Perché:** MF2 migrerà funzioni; MF1 non deve rompere workflow correnti.

**Rischi:** doppia voce (Segnalazioni + Personaggi Famosi) temporanea — accettabile fino a MF2.

---

### 3. Categorie Personaggio in Edit città

**Cosa cambia:** in `CulturePeople.tsx` (tab Storia), pulsante **CATEGORIA PERSONAGGIO** accanto alle azioni esistenti, stile pulsante Tassonomia in `EditorInfo.tsx`.

**Perché:** Master §37 — categorie non più solo in Admin → Personaggi Famosi.

**Come funziona:**
- Click → overlay/modal full-screen o pannello con `AdminFamousPeopleCategoriesManager` (prop `embedded` già supportata).
- Taxonomy resta globale (non per-city) — coerente con modello attuale `famous_person_categories`.

**Dipendenze:** `AdminFamousPeopleCategoriesManager.tsx`, `loadFamousPersonTaxonomy`.

**Rischi:** nessuno su save personaggio; categorie già usate in card personaggio.

---

### 4. Placeholder Personaggi in Asset Globali (Q9/D89 — decisione chiusa)

**Decisione funzionale definitiva (Master Plan §13, D89):** la scelta è **chiusa**. La creazione e il caricamento del materiale grafico è **attività operativa MF1**, non una decisione da prendere.

**Invarianti obbligatori:**

| Regola | Dettaglio |
|--------|-----------|
| Placeholder **già esistenti** in Asset Globali (POI, piattaforma, ecc.) | **DEVONO RIMANERE** — **NON** modificare |
| Nuovi asset Personaggi | Placeholder **specifico per ciascuna categoria** attualmente prevista + **«Personaggio Generico»** (fallback categorie future non coperte) |
| Percorso gestionale | **Admin Panel → Asset Globali** — stesso modello upload/gestione degli altri placeholder |
| Vietato | Gestione parallela; nuova sezione Admin autonoma solo Personaggi |

**Cosa cambia:** nuova sezione in `AdminHeaderManager.tsx` (view `design_assets` = Asset Globali), accanto a `PlaceholderSection` POI.

**Perché:** D65/D89 — placeholder per macro-categoria + **PLACEHOLDER GENERALE PERSONAGGI FAMOSI** + Personaggio Generico.

**Come funziona:**
- Caricare categorie master da `loadFamousPersonTaxonomy` (dinamico).
- Salvare in `global_settings`: `famous_person_category_placeholders` (Record&lt;categoryId, url&gt;) e `famous_person_general_placeholder` (string url/path).
- L'Admin carica le immagini **nello stesso modo** degli altri asset globali (`handleFileUpload` / pattern `PlaceholderSection`).
- Resolver runtime (MF1: solo persistenza + ConfigContext; uso publico completo → MF3): categoria specifica → Personaggio Generico → generale.

**Dipendenze:** `settingsService.ts`, `ConfigContext.tsx`.

**Rischi:** non toccare chiave `category_placeholders` POI né altri placeholder esistenti.

---

### 5. Stati entità — constants + progettazione migration

**Stato reale verificato:**
- `city_people.status`: valori operativi `draft`, `published` (RPC `set_famous_person_editorial_status` accetta solo questi).
- `PERSON_STATUS_VALUES` in `governance.ts`: `['published', 'draft']`.

**Cosa cambia in MF1 (app):**
- Aggiungere in `governance.ts` vocabolario canonico **DRAFT/PUBLISHED/SUSPENDED/CANCELED** (+ **NEEDS_CHECK** solo POI).
- Helper mapping DB (`draft`, `published`, `suspended`, `canceled`, `needs_check`).

**Progettazione migration (non eseguita finché non approvata):**
- `city_people.status`, `pois.status`: valori additivi `suspended`, `canceled`.
- **`cities.patron_editorial_status`**: DRAFT/PUBLISHED/SUSPENDED/CANCELED — **colonna dedicata** (D72); **NON** campo in `patron_details` JSON.
- **Nessun** UPDATE massivo in migration iniziale.

**Rischi:** RPC upsert e editorial status devono accettare o ignorare nuovi valori — verificare in SVILUPPO prima del push.

---

### 5b. Patrono pubblico — gate SUGGERISCI (D49, D72) — **MF1**

**Decisione funzionale (chiusa):** se `patron_editorial_status` è **DRAFT** o **SUSPENDED**, la pagina/modale pubblica **non** mostra il contenuto del Patrono né le relative immagini; mostra il pulsante **SUGGERISCI**.

**Collocazione tecnica:** **Macrofase 1** — dipende da `cities.patron_editorial_status` (migration MF1) e da `cityReadService`/`PatronSaintModal.tsx`. **Non** rimandare a MF2: MF2 gestisce segnalazioni e sospensioni da report, ma il gate pubblico su status editoriale è attivabile non appena la colonna è leggibile.

**Cosa cambia:** `PatronSaintModal.tsx` (e componenti pubblici Patrono collegati) leggono `patron_editorial_status` e applicano il gate prima del render del contenuto.

**Fuori scope MF1:** flussi segnalazione/sospensione automatica post-report (MF2).

---

### 6. `media_assets` — schema minimo

**Cosa cambia:** una migration crea tabella vuota/usabile con PK uuid.

**Perché:** evitare debito architetturale; MF2 aggiunge assignments e collegamenti.

**Schema minimo MF1 (derivato da §42.1 — scelta tecnica chiusa):** `id`, `storage_bucket`, `storage_path`, `origin_type`, `is_placeholder`, `generated_by_ai`, `created_at`, `updated_at`. Lifecycle completo, provenance e stati asset → MF3/MF4.

**Escluso MF1:** `asset_status` lifecycle completo, FK da entità, trigger sync.

**Rischi:** tabella unused fino a MF2 — accettabile. **RLS (D77):** gestione/modifica Admin; lettura public consentita per asset validamente pubblicati (view/policy MF2); evidenza segnalazione privata (MF2).

---

### 7. Cosa NON si tocca

| Area | Motivo |
|------|--------|
| `PoiClaimModal.tsx` | Rivendica Gold/Silver/Bottega — fuori perimetro |
| `AdminFamousPeopleManager.tsx` | Rimozione solo MF2 post-migrazione |
| Modali report esistenti | MF2 |
| `findExistingPortrait` | MF5 |
| OTP / guest auth | MF2 |

---

### 8. File aggiuntivi eventualmente necessari (fuori perimetro attuale)

| File | Motivo | Azione |
|------|--------|--------|
| `src/domain/city/personStatus.ts` | Helper mapping stati | Aggiungere a MF1_FILES **solo se** approvato — evita gonfiare `governance.ts` |

**Non modificati automaticamente** — richiedono approvazione ampliamento perimetro.

---

## Regola aggiornamento perimetro

Se emerge un file non elencato: verificare necessità → aggiornare questo documento → **attendere approvazione** → procedere.

---

*Fine Macrofase 1 — perimetro e progettazione tecnica 2026-09-15. **SVILUPPO non avviato.***
