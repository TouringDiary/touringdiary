# Macrofase 2 — Segnala abuso / suggerimenti centralizzati

> **Ultimo aggiornamento:** 2026-09-16 (D88; moderazione upload Community fuori scope — §32.7)

> ## ⚠️ REGOLA OBBLIGATORIA — LETTURA CONGIUNTA
>
> Consultare **insieme**: Master Plan + Audit + **questo file**. MF2 **solo dopo** TEST MF1.

---

## Obiettivo macrofase

- Hub Segnalazioni **funzionante** (Community, Patrono, Personaggio, micro-tab)
- Modale pubblico **Segnala abuso** unificato (tipologia Immagine/Personaggio, note obbligatorie)
- **Modello B** doppia segnalazione — righe separate Personaggio/Patrono **e** Foto, gestibili indipendentemente
- **Sospensione automatica** alla ricezione (§34.4–§34.7): oggetto segnalato → **SUSPENDED**; solo Foto → **non** sospende entità; Patrono SUSPENDED → **SUGGERISCI**
- **`entity_image_assignments`** + report su **assignment**
- **Evidenza fotografica immutabile** (D70): foto esatta segnalata conservata **permanentemente** — implementazione **§42.5** (bucket `report-evidence`, RPC `capture_report_evidence`, RLS admin-only) — **MF2**
- **Alert Admin** altri utilizzi (§38.X)
- **Guest OTP (D85):** email **nel modale** → OTP → verifica → INVIA; **Supabase Auth OTP nativo** (**§42.12**); **nessuna** email pubblica (**D88**)
- **Abuso Foto Community** (FOTO LIVE / FOTO GALLERIA CITTÀ) — segnalazioni su foto **già pubblicate** (`content_reports`) — **IN SCOPE MF2**
- Stati operativi segnalazioni: NUOVO / IN VERIFICA / OK / KO / TUTTE
- **Errori segnalati** — dropdown POI obbligatorio
- Migrazione funzioni da `AdminFamousPeopleManager` → hub

**Prerequisito:** Macrofase 1 completata (TEST OK).

---

## Canale segnalazioni (D88, §31.10 — definitivo)

| Regola | Dettaglio |
|--------|-----------|
| Canale unico | Modale **Segnala abuso** — **nessuna** email pubblica, contatto esterno o opzione Admin alternativa |
| Utente loggato | Apre il modale; **non** reinserisce la propria email |
| Guest | Email obbligatoria **nel modale** → OTP → verifica → **INVIA**; **no** SMS; **no** telefono; **no** registrazione obbligatoria |
| Email guest | Solo identificazione/verifica del segnalante — **≠** email pubblica |
| Flusso Admin | **NUOVO → IN VERIFICA → OK/KO** (§31.8); gestione **indipendente** entità vs immagine/associazione (§34.6–§34.7) |

*(Q20/D36 superate — sostituite da D88. Vedi Master Plan §31.10.)*

---

## Fuori scope MF2 — moderazione upload Community

**Verifica repository chiusa (Master Plan §32.7):** **Foto & Moderazione** (`PhotoModeration.tsx`, `photo_submissions`) = moderazione **upload** Community — **flusso distinto** dalle segnalazioni abuso. **Non** è perimetro MF2: **non** modificare, ricollocare o integrare nel hub Segnalazioni in questo progetto.

---

## SVILUPPO → TEST → E2E

| Fase | Contenuto |
|------|-----------|
| **TEST** | `npm run check`; unit servizi report; RPC transition stati; RLS report; capture/read evidence |
| **E2E** | Solo Foto → entità resta **PUBLISHED**; solo Personaggio → **SUSPENDED**; Personaggio+Foto → 2 righe + entità **SUSPENDED**; Patrono casi §34.7; evidence consultabile; guest OTP |
| **Regressioni** | Segnala abuso Personaggio/Patrono esistente; **PoiClaimModal** invariato |

**Criterio completamento:** modello B E2E; **evidenza fotografica esatta verificabile e consultabile** dall'Admin; alert utilizzi presente.

---

## File da CREARE

| File | Motivo |
|------|--------|
| `src/components/modals/ReportAbuseModal.tsx` | Modale unificato Segnala abuso (§7 Master) |
| `src/components/admin/reports/ReportAdminDetailPanel.tsx` | Gestione singola segnalazione + alert utilizzi |
| `src/components/admin/reports/ReportOtherUsagesAlert.tsx` | UI alert D61 |
| `src/services/reports/contentReportService.ts` | CRUD + modello B (2 righe + collegamento) |
| `src/services/reports/reportEvidenceService.ts` | Capture/read **evidenza immutabile** |
| `src/services/reports/reportContextService.ts` | Wrapper RPC context utilizzi |
| `src/services/auth/guestOtpService.ts` | Guest OTP — Supabase `signInWithOtp` (**§42.12**) |
| `supabase/migrations/YYYYMMDD_entity_image_assignments.sql` | Tabella assignments |
| `supabase/migrations/YYYYMMDD_content_reports.sql` | Report + group_id + evidence columns |
| `supabase/migrations/YYYYMMDD_report_rpcs.sql` | RPC context, transition, evidence capture, **auto-SUSPEND** on submit |
| `supabase/migrations/YYYYMMDD_report_evidence_storage_policy.sql` | Storage privato bucket **`report-evidence`** (§42.5 — scelta tecnica chiusa) |

---

## File da MODIFICARE

| File | Motivo |
|------|--------|
| `src/components/modals/ReportFamousPersonPhotoAbuseModal.tsx` | Deprecare → ReportAbuseModal o wrapper |
| `src/components/modals/ReportPatronPhotoAbuseModal.tsx` | Allineamento modale unificato |
| `src/components/modals/CultureCornerModal.tsx` | Integrazione nuovo modale |
| `src/components/modals/SuggestionModal.tsx` | Dropdown POI obbligatorio errori segnalati |
| `src/services/famousPerson/famousPersonPhotoReportService.ts` | Migrare verso contentReportService |
| `src/services/patron/patronPhotoReportService.ts` | Idem |
| `src/components/admin/reports/AdminReports*.tsx` | Sostituire placeholder MF1 con micro-tab reali |
| `src/components/admin/AdminFamousPeopleManager.tsx` | Estrarre logiche → hub |
| `src/components/admin/SuggestionManager.tsx` | Deprecazione completa post-migrazione |
| `src/components/admin/AdminDashboard.tsx` | Rimozione view `famous_people` standalone (post-migrazione) |
| `src/components/admin/layout/AdminSidebar.tsx` | Rimuovere voce `famous_people` (post-migrazione) — **non** toccare voce `photos` / Foto & Moderazione (fuori scope) |
| `src/services/media/imageAssignmentDualWriteService.ts` | Dual-write §42.15 via RPC — **implementato 2026-09-18** |
| `src/services/entitiesService.ts` | Dual-write assignment + legacy columns — **§42.15** — **implementato** |
| `src/services/photoService.ts` | Dual-write `photo_submission` — **implementato** |
| `src/services/patron/cityPatronGalleryService.ts` | Dual-write galleria Patrono + enrich `assignmentId` — **implementato** |
| `src/services/city/cityWriteService.ts` | Dual-write Patrono primary on save — **implementato** |
| `supabase/migrations/20260918120000_entity_image_assignment_dual_write_rpc.sql` | RPC client dual-write — **implementato** |

---

## Dual-write §42.15 — stato implementazione (2026-09-18)

| Writer | Legacy | `media_assets` + assignment | Stato |
|--------|--------|----------------------------|-------|
| `uploadCommunityPhoto` / approve | `photo_submissions` | ✅ RPC dual-write | Implementato |
| `getOrCreatePhotoSubmissionForUrl` (create) | idem | ✅ | Implementato |
| `saveCityPerson` (image) | `city_people.image_url` | ✅ | Implementato |
| `cityPatronGalleryService` add/approve | `city_patron_gallery` | ✅ role=gallery | Implementato |
| `saveCityDetails` (Patrono primary image) | `patron_details` JSON | ✅ role=primary | Implementato |

Fallback RPC lazy al submit resta attivo quando assignment assente (transizione dati pre-esistenti).

**Nota (D90 / §42.16):** il dual-write MF2 (**§42.15**) allinea legacy e `entity_image_assignments` ma **non** garantisce atomicità end-to-end quando entità e assignment sono aggiornati da boundary diversi (es. `saveCityDetails`: API server + RPC client). Requisito definitivo e timing: Master Plan **§42.16**; evidenza Audit **§41**. Perimetro MF2 invariato.

---

## Santo Patrono — SUSPENDED/CANCELED (decisione 2026-09-18)

Stati **SUSPENDED** e **CANCELED** di `patron_editorial_status` sono gestiti **esclusivamente** dal workflow Segnalazioni → Santo Patrono (auto-suspend + transizioni Admin). L'editor Edit Città consente **solo** DRAFT/PUBLISHED. Vedi MF1_FILES sezione dedicata.

---

## Modello B — vincoli invariati

- Submit utente con Immagine + Personaggio → **2 righe/report** distinti, **collegati** (`report_group_id` / riferimento reciproco).
- Admin gestisce **indipendentemente** ciascuna riga.
- Chiusura una riga **non** chiude automaticamente l'altra.
- Regole visibilità KO/OK: Master §35.1.

---

## Sospensione automatica alla ricezione (D33, D73, D74)

Alla **submit** valida della segnalazione (prima di qualsiasi azione Admin):

| Caso | Oggetto → SUSPENDED | Entità resta PUBLISHED? | Visibilità pubblica |
|------|---------------------|-------------------------|---------------------|
| **Solo Foto** (Personaggio/Patrono) | **Associazione/foto** segnalata | ✅ Sì | Entità visibile; foto sospesa non mostrata; **placeholder** se previsto |
| **Solo Personaggio** | **Personaggio** | ❌ No (→ SUSPENDED) | Personaggio e **immagini** non visibili |
| **Personaggio + Foto** | Personaggio **e** associazione/foto | ❌ No (Personaggio SUSPENDED) | Personaggio non visibile; immagini non visibili (prevale entità) |
| **Solo Patrono** | **Patrono** (`patron_editorial_status`) | ❌ No | Patrono non visibile; immagini nascoste; **SUGGERISCI** |
| **Solo Foto Patrono** | **Associazione/foto** | ✅ Sì | Patrono visibile; foto sospesa non mostrata |
| **Patrono + Foto** | Patrono **e** associazione/foto | ❌ No (Patrono SUSPENDED) | **SUGGERISCI**; immagini nascoste (prevale Patrono) |

**Invarianti:**
- **SUSPENDED ≠ CANCELED** — la segnalazione **non** porta automaticamente a CANCELED.
- Sospensione su **associazione** → **non** invalida altri utilizzi dello stesso `media_asset` (D76).
- Gestione Admin separata delle componenti **non** modifica la regola pubblica: entità **SUSPENDED** → contenuto e immagini non visibili.

---

## Evidenza segnalazione (D70)

| Requisito | Dettaglio |
|-----------|-----------|
| Permanenza | Evidenza resta **per sempre** con la segnalazione |
| Immutabilità | Non dipende da URL live né da file sostituito/rimosso |
| Consultazione Admin | UI mostra sempre foto **esatta** segnalata |
| Tecnica | Bucket **`report-evidence`** + RPC `capture_report_evidence` al submit (§42.5 — chiusa); hash/metadati in `content_reports` |

---

## DB / RPC / RLS / Storage

| Tipo | Dettaglio |
|------|-----------|
| **Tabelle** | `entity_image_assignments`, `content_reports` (+ colonne evidence) |
| **Q19 / §42.4** | Schema `content_reports` — decisione tecnica **chiusa**; implementazione MF2 — **non** «rimandato» |
| **RPC** | `get_report_admin_context`, `create_content_report_group`, `transition_report_status`, `capture_report_evidence` |
| **RLS** | Report: insert autenticato/guest verificato; read/update admin; **evidenza privata** (solo Admin). Asset: gestione Admin; **lettura public** per immagini validamente pubblicate (D77) |
| **Storage** | Bucket privato **`report-evidence`** (§42.5 — scelta tecnica **chiusa**; implementazione MF2) |

---

## Dipendenze

- MF1 hub shell + `media_assets` base
- Audit §38.B–E, H, L, V, X; D69–D70
- Master §33–§35, §39

---

*Fine Macrofase 2 — perimetro file 2026-09-16*
