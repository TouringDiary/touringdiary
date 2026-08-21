# ⛪ DOC 22: PATRON SAINT SYSTEM (v2.0 — Gallery dedicata)

Questo documento descrive il sistema Santo Patrono, la foto principale, la gallery Patrono/Festa e le segnalazioni community.

---

## DESCRIZIONE SEMPLICE

Il modulo presenta il Santo Patrono della città (nome, data festa, storia/culto), la **foto principale** e una **gallery ufficiale** Patrono/Festa Patronale separata dalla galleria fotografica generale della città.

---

## ARCHITETTURA DATI (SoT)

| Concetto | Persistenza | Note |
|----------|-------------|------|
| Testo patrono (nome, data, storia) | `cities.patron_details` JSON | Invariato |
| Foto principale città | `patron_details.imageUrl` | Fallback visivo: Patrono Master |
| Patrono Master (globale) | `global_settings.default_patron_image` | **Non** copiato in `imageUrl` città |
| Gallery ufficiale Patrono/Festa | **`city_patron_gallery`** | Separata da `cities.gallery` |
| Didascalia foto gallery | **`city_patron_gallery.caption`** | Opzionale (`TEXT NULL`); timestamp creazione = `created_at` |
| Suggerimenti foto utente | **`patron_photo_suggestions`** + **`patron_photo_suggestion_items`** | Workflow moderazione sotto |
| Segnalazioni abuso | **`patron_photo_reports`** | Workflow **distinto** (vedi sotto) |

**NON usare** per la gallery Patrono/Festa: `cities.gallery`, `photo_submissions`, dominio `Photograph`, `patron_details.festGallery[]`.

### Workflow PHOTO SUGGESTIONS (`patron_photo_suggestions.status`)

| Status DB | Label admin | Significato |
|-----------|-------------|-------------|
| `pending` | Da gestire | Backlog non ancora preso in carico |
| `in_review` | In revisione | Presa in carico; accertamenti in corso |
| `accepted` | Accettata | Tutte le foto item accettate → gallery |
| `rejected` | Rifiutata | Rifiuto (intera o parziale a livello suggestion) |

Transizioni: `pending → in_review | accepted | rejected`; `in_review → accepted | rejected`. Stati finali: `accepted` / `rejected`.

**Item** (`patron_photo_suggestion_items.status`): restano `pending | approved | rejected` (moderazione per foto; valori DB item distinti dalla suggestion). Se non tutte le foto sono accettate, la suggestion diventa `rejected` pur avendo item `approved` in gallery.

Note: `notes` = utente; `admin_notes` = admin (rifiuto/moderazione). Non mischiare.

### Workflow PHOTO REPORTS (`patron_photo_reports.status`)

| Status DB | Label admin | Significato |
|-----------|-------------|-------------|
| `pending` | Da gestire | Backlog |
| `in_review` | In revisione | Presa in carico |
| `photo_blocked` | Foto bloccata | Foto rimossa dalla gallery ufficiale |
| `rejected` | Segnalazione rifiutata | Segnalazione chiusa; **foto resta** in gallery |

Transizioni: `pending → in_review | photo_blocked | rejected`; `in_review → photo_blocked | rejected`. Stati finali: `photo_blocked` / `rejected`.

---

## FALLBACK FOTO PRINCIPALE

```
città con patron_details.imageUrl → mostra foto propria
città senza imageUrl              → Patrono Master (default_patron_image)
admin rimuove foto città          → torna immediatamente al Master
admin modifica Master             → aggiorna fallback di tutte le città senza foto propria
```

Utility: `resolvePatronDisplayImageUrl`, hook `usePatronMasterImageUrl`.

### Framing foto principale (admin ↔ UI)

| Layer | Contratto |
|-------|-----------|
| UI pubblica / anteprima admin | `aspect-[16/9]` (mobile) · `aspect-[21/9]` da `md` in su · `object-cover` · `object-position: center` |
| Costanti / utility | `PATRON_MAIN_PHOTO_ASPECT_RATIO` + `computeObjectCoverCropRect` in `src/domain/patron/resolvePatronDisplayImageUrl.ts` |
| Editor `AdminPhotoInspector` + `viewportGuide` | Area **primary/ambra** = crop principale (desktop **21:9**). Area **secondaria/bianca** = sola guida di inquadratura mobile **16:9**, contenuta *dentro* il primary |
| Salvataggio con `viewportGuide` | Export JPEG = **solo** ritaglio primary (elimina bande/canvas esterne). La guida secondaria **non** è un secondo export e **non** modifica il file salvato: preview di ciò che resta visibile in UI mobile via `object-cover` |

Dopo un ritaglio in Photo Studio, **ri-salvare** la foto città per allineare file già esportati col vecchio contratto (canvas intero).

---

## STORAGE (`public-media`)

| Cartella | Uso |
|----------|-----|
| `admin_assets/` | Patrono Master (Asset Globali) |
| `admin_uploads/` | Foto principale patrono città (admin) |
| `city_patron_gallery/{cityId}/` | Gallery ufficiale Patrono/Festa |
| `patron_photo_suggestions/{userId}/` | Upload segnalazioni utente (pre-moderazione) |

---

## SERVIZI

* `src/services/patron/cityPatronGalleryService.ts` — list, add (con `caption?`), delete, reorder; copy da suggestion con caption
* `src/services/patron/patronPhotoSuggestionService.ts` — create, list admin, `mark…InReview`, accept/reject (da `pending`\|`in_review`)
* `src/services/patron/patronPhotoReportService.ts` — create, list admin, `mark…InReview`, `reject`, `block…AndRemovePhoto`

---

## UI

* **Utente — percorso contribuzione foto**: Home → Città → pulsante **Patrono** (`CityHeader`) → `PatronSaintModal` → `PatronFestGalleryStrip` → **Suggerisci foto** → `SuggestPatronPhotoModal` → `createPatronPhotoSuggestion` / RPC `submit_patron_photo_suggestion` (diritti obbligatori). Disponibile anche con gallery già popolata.
* **Utente — gallery**: click foto → selezione + `GalleryLightbox` (didascalia se presente); **Segnala abuso** solo con foto selezionata → `ReportPatronPhotoAbuseModal`
* **Admin città**: `CulturePatron` → `CulturePatronMainPhotoSection` + `CulturePatronFestGallerySection` (DB + didascalia opzionale all’upload)
* **Admin Territorio**: `AdminPatronSaintManager`
  * Segnalazioni foto: Da gestire / In revisione / Accettata / Rifiutata
  * Segnalazioni abuso: Da gestire / In revisione / Foto bloccata / Segnalazione rifiutata

Il menu **+ Contribuisci** nelle tab categoria città (`CityCategoryTab`) gestisce solo **Nuovo Luogo** / **Modifica Luogo** (dominio suggestion POI), non il flusso Patron Gallery.

---

## MIGRATION

* Base: `supabase/migrations/20260819120000_city_patron_gallery_and_suggestions.sql`
* Caption: `supabase/migrations/20260820163000_city_patron_gallery_caption.sql` (`caption TEXT NULL`)
* Status definitivi: `supabase/migrations/20260820180000_patron_moderation_status_rename.sql`

---

## NOTE LEGALI (UI)

Testi diritti/licenza nel modale «Suggerisci foto» e informativa sotto gallery pubblica: copy funzionale — **validazione legale** consigliata prima del go-live.
