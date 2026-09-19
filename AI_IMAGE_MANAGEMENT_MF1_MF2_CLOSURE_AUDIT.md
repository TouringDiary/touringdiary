# AI Image Management — MF1 + MF2 Closure Audit (post-correzioni)

**Data:** 2026-09-18  
**Tipo:** audit + implementazione P0; verifica statica codice  
**Criterio:** risultato finale Master Plan — **non** sequenza storica macrofasi

---

# 1. VERDETTO FINALE

## 🟡 MF1 + MF2 — CODICE PRONTO PER CHIUSURA (verifica E2E/migration remota pendente)

**Sintesi:** tutti i **P0** identificati nel closure audit precedente sono stati **implementati nel codice** con architettura coerente al Master Plan. Nessun rollback; nessuna seconda fonte di verità client-side.

**MF1:** completa a livello codice (inclusa UI `patron_editorial_status` ordinaria + decisione funzionale Patrono).

**MF2:** dual-write §42.15, gate assignment, Patron gallery, guest OTP Culture Corner, evidenza Community, visibilità post-sospensione assignment — **implementati**.

**Non dichiarate formalmente chiuse** finché non risultano verificati:
- applicazione migration `20260918120000_entity_image_assignment_dual_write_rpc.sql` su Supabase target;
- smoke E2E browser (OTP reale, evidence Storage remoto);
- `npm run check` completo (typecheck ✅; lint repo contiene issue pre-esistenti su script temporanei non toccati).

Dopo verifica operativa sopra → **🟢 MF1 + MF2 CONCLUSE — avvio MF3**.

---

# 2. COSA È CORRETTO (mantenuto)

Tutto quanto già validato nel closure audit precedente resta **corretto e mantenuto**:

- Schema DB MF1/MF2 (`media_assets`, `entity_image_assignments`, `content_reports`, RPC report/evidence)
- `AdminReportsHub` funzionale (anticipato rispetto a scheletro MF1 — **accettato**)
- `ReportAbuseModal` + Model B + guest OTP service
- Auto-suspend e transizioni RPC
- Separazione PhotoModeration / content_reports
- Gate Patrono pubblico D49
- Route legacy transitorie (`famous_people`)

---

# 3. CORREZIONI ESEGUITE (P0)

## P0-01 — Dual-write §42.15

| Campo | Dettaglio |
|-------|-----------|
| **Problema** | Writer applicativi non materializzavano `media_assets` + `entity_image_assignments`. |
| **Causa** | RLS admin-only su tabelle MF2; nessun RPC client-callable per dual-write. |
| **Soluzione** | RPC `upsert_entity_image_assignment_dual_write` (SECURITY DEFINER, auth admin o owner `photo_submission`) + servizio `imageAssignmentDualWriteService.ts`. Integrato in: `photoService` (upload, create, approve), `entitiesService.saveCityPerson`, `cityPatronGalleryService`, `cityWriteService` (Patrono primary). Rollback legacy su fallimento dual-write dove insert appena creato. |
| **File** | `supabase/migrations/20260918120000_entity_image_assignment_dual_write_rpc.sql`, `src/services/media/imageAssignmentDualWriteService.ts`, writer sopra |
| **Coerenza** | Master §42.15; riusa `ensure_media_asset_from_source` internamente via stessa logica insert assignment |
| **Ref** | §42.15, D71 transitorio |

## P0-02 — Gate client `assignmentId`

| Campo | Dettaglio |
|-------|-----------|
| **Problema** | Client bloccava image abuse senza `assignmentId`, rendendo irraggiungibile fallback RPC. |
| **Causa** | Validazione troppo restrittiva in `useReportAbuseSubmit` e `ReportAbuseModal`. |
| **Soluzione** | `hasReportableImageTarget()`: accetta `assignmentId` **oppure** `imageUrl` **oppure** `storageBucket`+`storagePath`. RPC esegue `ensure_current_image_assignment` quando assignment assente. |
| **File** | `src/hooks/reports/useReportAbuseSubmit.ts`, `src/components/modals/ReportAbuseModal.tsx` |
| **Coerenza** | Model B invariato; fail-closed solo se nessuna sorgente risolvibile |
| **Ref** | §42.15 fallback RPC |

## P0-03 — Patron gallery `assignmentId`

| Campo | Dettaglio |
|-------|-----------|
| **Problema** | `assignmentId` mai popolato in galleria Patrono. |
| **Causa** | `mapRow` senza enrich; nessun dual-write on add. |
| **Soluzione** | Dual-write `assignment_role=gallery` on add/approve/update; `attachPatronGalleryAssignmentIds` on list per match `source_storage_path` / `source_image_url`. |
| **File** | `src/services/patron/cityPatronGalleryService.ts`, `src/hooks/patron/useCityPatronGallery.ts` |
| **Coerenza** | `entity_type=patron`, `entity_id=city_id` (D72); `sourceContext=patron_gallery` invariato |
| **Ref** | MF2 patron gallery |

## P0-04 — Guest OTP Culture Corner

| Campo | Dettaglio |
|-------|-----------|
| **Problema** | Guest reindirizzato a login. |
| **Causa** | Gate `onOpenAuth()` in `openReportAbuse`. |
| **Soluzione** | Rimosso gate guest; modale unificato gestisce OTP. Lookup `assignmentId` best-effort (non bloccante). |
| **File** | `src/components/modals/CultureCornerModal.tsx` |
| **Coerenza** | D85, D88 — stesso contratto `ReportAbuseModal` |
| **Ref** | D88 |

## P0-05 — Evidenza D70 Community

| Campo | Dettaglio |
|-------|-----------|
| **Problema** | Bucket `community-photos` non in allowlist; path non propagato. |
| **Causa** | Hardcoded `public-media` in modale; target senza storage meta. |
| **Soluzione** | `parseStorageLocationFromPublicUrl`; campi `storageBucket`/`storagePath` su `PhotoSubmission`; propagazione LiveFeed/CityGallery; allowlist server `community-photos` + parser URL. |
| **File** | `src/utils/storagePathFromPublicUrl.ts`, `src/services/photoService.ts`, `CommunityPhotoAbuseModal.tsx`, `LiveFeedTab.tsx`, `CityGallery.tsx`, `server/routes/reports.routes.ts` |
| **Coerenza** | D70 — bytes da bucket reale, bucket privato `report-evidence` invariato |
| **Ref** | D70, §42.5 |

## P0-06 — Visibilità post-sospensione assignment

| Campo | Dettaglio |
|-------|-----------|
| **Problema** | Legacy `image_url` ignorava assignment SUSPENDED/REMOVED. |
| **Causa** | Read path senza consulto `entity_image_assignments`. |
| **Soluzione** | `imageAssignmentVisibilityService.ts`: batch query; mascheramento Personaggi/POI in `cityReadService` (public); filtro galleria Patrono; hero Patrono via `resolvePatronPrimaryImageUrl`. Regola: **nessun assignment → legacy OK**; **assignment non-active → nascondi**. |
| **File** | `src/services/media/imageAssignmentVisibilityService.ts`, `cityReadService.ts`, `PatronSaintModal.tsx`, `cityPatronGalleryService.ts` |
| **Coerenza** | D86 transizione; entità PUBLISHED + foto SUSPENDED → entità visibile, foto no |
| **Ref** | §34.5–§34.7, D86 |

## P0-07 — UI Admin `patron_editorial_status`

| Campo | Dettaglio |
|-------|-----------|
| **Problema** | Nessun controllo Admin per stato editoriale Patrono. |
| **Causa** | UI non implementata in Edit Città. |
| **Soluzione** | Sezione in `CulturePatron.tsx`: select **solo DRAFT/PUBLISHED**; SUSPENDED/CANCELED read-only con redirect a Segnalazioni. Costanti `PATRON_ORDINARY_EDITORIAL_STATUS_VALUES` / `PATRON_MODERATION_EDITORIAL_STATUS_VALUES` in `governance.ts`. |
| **File** | `src/components/admin/cityEditor/culture/CulturePatron.tsx`, `src/constants/governance.ts` |
| **Coerenza** | D72 colonna dedicata; decisione funzionale 2026-09-18 (vedi § C) |
| **Ref** | D72, D49 |

---

# 4. COSE GIÀ ANTICIPATE MA CORRETTE (invariate)

Vedi closure audit precedente §4 — **nessun rollback** eseguito.

---

# 5. NUOVA DECISIONE — SANTO PATRONO (2026-09-18)

**Campo:** `cities.patron_editorial_status` (D72) — stati: DRAFT · PUBLISHED · SUSPENDED · CANCELED

## Stato editoriale ordinario (DRAFT ↔ PUBLISHED)

**Percorso UI:** Admin Panel → Manager POI-DB → Edit Città → Storia → Santo Patrono

L'Admin modifica manualmente **solo** DRAFT e PUBLISHED.

## Stato di moderazione/segnalazione (SUSPENDED · CANCELED)

**Percorso UI:** Admin Panel → Segnalazioni → Santo Patrono

- **SUSPENDED:** tutela immediata post-segnalazione valida
- **CANCELED:** decisione definitiva Admin su segnalazione entità
- Collegati a storico segnalazione e transizioni RPC esistenti

**Vincoli:** un solo campo; niente `patron_details`; niente bypass editor ordinario verso SUSPENDED/CANCELED.

Documentato anche in: `AI_IMAGE_MANAGEMENT_MACROFASE_1_FILES.md`, `AI_IMAGE_MANAGEMENT_MACROFASE_2_FILES.md`, `AI_IMAGE_MANAGEMENT_MASTER_PLAN.md` (D72 nota operativa).

---

# 6. COMPATIBILITÀ MF3–MF5

| Area | Esito |
|------|-------|
| `entity_image_history` MF4 | ✅ Compatibile — assignments con chain |
| Lifecycle `media_assets` MF3 | ✅ Estensione additiva prevista |
| Backfill MF5 | ✅ Dual-write attivo su nuovi dati riduce debito |
| Cutover MF5 | ⚠️ Richiede E2E + migration RPC applicata |
| Resolver D86 completo MF3 | 🟡 Base transitoria implementata; resolver unificato resta MF3 |

Nessuna anticipazione distruttiva di cutover o drop legacy.

---

# 7. VERIFICA E2E

| Flusso | Esito codice | Verifica runtime |
|--------|--------------|------------------|
| A–D Segnalazione foto (Community/Patron/Personaggio) | 🟢 Contratto corretto | ⚪ NON VERIFICATO browser |
| F Segnalazione solo entità | 🟢 | ⚪ |
| G Model B entity+image | 🟢 | ⚪ |
| H Guest OTP (incluso Culture Corner) | 🟢 | ⚪ OTP reale |
| I Evidence Community | 🟢 Server allowlist | ⚪ Storage remoto |
| J Auto-suspend RPC | 🟢 (pre-esistente) | ⚪ |
| K–M Admin transitions | 🟢 (pre-esistente) | ⚪ |
| P Regressioni MF1 / Rivendica POI | 🟢 Nessuna modifica a PoiClaimModal | ⚪ |

---

# 8. DECISIONE OPERATIVA

## Completato in codice

- Tutti i P0-01 … P0-07
- Decisione Patrono documentata
- TypeScript (`npm run typecheck`) ✅
- Biome su file modificati ✅

## Prima di avviare MF3

1. Applicare migration `20260918120000_entity_image_assignment_dual_write_rpc.sql`
2. Smoke E2E: tabella §7 (minimo Patrono A–G del controllo utente)
3. Confermare `npm run check` in CI/environment pulito

## Non toccare

- Architettura ReportAbuseModal / Model B / RPC report
- Hub Admin funzionale
- Legacy transitorio MF5

---

# A. FUNZIONALITÀ GIÀ CORRETTE (pre-P0)

Elenco completo nel closure audit 2026-09-18 (mattina) §2 — confermato valido.

# B. PUNTI NON RISOLTI / NON VERIFICATI

| Punto | Stato |
|-------|-------|
| POI segnalazione pubblica (modale) | ⚪ Fuori scope P0 — Admin tab only |
| `other_person_cities` stub in RPC context | 🟡 P1 — non blocker MF3 |
| OK transition `is_current` su assignment removed | 🟡 P1 — MF3/MF4 |
| E2E browser + DB remoto | ⚪ NON VERIFICATO questa sessione |

---

*Fine audit post-correzioni — 2026-09-18*
