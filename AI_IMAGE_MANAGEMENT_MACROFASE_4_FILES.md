# Macrofase 4 — Fotografie reali + Wikidata + Media Library + history

> **Ultimo aggiornamento:** 2026-09-16

> ## ⚠️ REGOLA OBBLIGATORIA — LETTURA CONGIUNTA
>
> Master Plan + Audit + **questo file**. MF4 **solo dopo TEST MF3.**

---

## Obiettivo macrofase

- Pipeline **Wikidata** → proposta → **conferma Admin** → Commons verify (D64)
- Fotografie **reali**: solo **CC BY 4.0** auto-path (**D79**); altre licenze manuale Admin; pipeline §6.1 completa
- **Media Library** catalogo relazionale (utilizzi entità)
- **History** assignment / audit trail
- **Safe archive** asset in uso
- Arricchimento consultazione/storico segnalazioni OK (su modello evidenza **MF2** e schema **`content_reports`** — Q19/§42.4 chiuso in MF2, **non** rimandato)
- **Publish gate** (§4.5): immagine utilizzabile per pubblicazione = Admin · foto reale verificata · AI · placeholder — **non** obbligatoria fotografia reale (dettaglio Master Plan)

**Evidenza segnalazione (D70):** conservazione **permanente** implementata in **MF2**. MF4: consultazione arricchita, viste storiche, audit trail collegato — **non** prima introduzione della retention.

---

## SVILUPPO → TEST → E2E

| Fase | Contenuto |
|------|-----------|
| **TEST** | Parser licenza Commons; quarantine dubbia; block delete in-use |
| **E2E** | Admin conferma Wikidata → foto verificata o coda verify; Media Library utilizzi; history sostituzione; evidenza MF2 consultabile |
| **Regressioni** | Import personaggi; Libreria Storage listing |

---

## File da CREARE

| File | Motivo |
|------|--------|
| `src/services/wikimedia/wikidataLookupService.ts` | Discovery Q-id / P18 |
| `src/services/wikimedia/commonsLicenseParser.ts` | CC BY verify |
| `src/services/wikimedia/commonsDownloadPipeline.ts` | Download → Storage → media_assets |
| `src/services/media/mediaCatalogService.ts` | Catalogo + paginazione |
| `src/components/admin/media/MediaAssetDetailPanel.tsx` | Drill-down utilizzi entità |
| `src/components/admin/wikimedia/WikidataConfirmModal.tsx` | Conferma Admin esplicita |
| `supabase/migrations/YYYYMMDD_entity_image_history.sql` | Storico immagini append-only (D84 / §42.6 — **richiesto**, non opzionale) |
| `supabase/migrations/YYYYMMDD_media_catalog_views.sql` | View aggregata utilizzi |
| `supabase/migrations/YYYYMMDD_safe_archive_media_rpc.sql` | Block delete in-use |

---

## File da MODIFICARE

| File | Motivo |
|------|--------|
| `src/components/admin/AdminAssetLibrary.tsx` | Catalogo DB-driven vs solo Storage |
| `src/services/mediaService.ts` | Paginazione; deprecare URL-only usage map |
| `src/hooks/admin/people/usePeopleAI.ts` | Integrazione Wikidata step |
| `src/hooks/admin/useAiCompleteCity.ts` | Idem |
| `src/components/admin/import/*` | Staging foto reali |
| `src/services/reports/contentReportService.ts` | Audit trail OK arricchito (non prima implementazione evidence) |

---

## File da VERIFICARE

| File | Motivo |
|------|--------|
| `src/services/settingsService.ts` | Pattern global_settings |
| Policy licenze Master Plan | **D79** CC BY 4.0 auto; **D78** AI CC BY 4.0 |
| `entity_image_history` | Storico consultabile Admin (**D84**, **§42.6**) |

---

## DB / RPC / RLS / Storage

| Tipo | Dettaglio |
|------|-----------|
| **Tabelle** | `entity_image_history` (append-only) |
| **View** | `media_assets_with_usage_count` |
| **RPC** | `safe_archive_media_asset` |
| **Storage** | Cartella import Wikimedia; evidenza segnalazioni — retention definita in **MF2**, non ridefinita qui |
| **RLS** | Catalogo admin-only write |

---

## Note architetturali — Provenienza ≠ verifica

**Wikimedia** è una sorgente/provenienza dell'immagine, ma `origin_type = wikimedia` **non** costituisce da solo prova di foto reale verificata. La classificazione come foto reale verificata avviene solo dopo il processo MF4 previsto per Wikidata/Commons (Wikidata → proposta → conferma Admin → Commons → verifica licenza/provenenza → import/gestione dell'asset), con verifica della provenienza/licenza e conferma Admin dove richiesta.

- **MF3** prepara e conserva la provenienza strutturata su `media_assets`; **MF3 non** deve considerare automaticamente Wikimedia come `verified real`.
- **MF4** completa il processo di verifica Wikimedia; dopo la verifica MF4 l'immagine può partecipare al publish/resolver flow delle immagini ufficiali delle entità secondo il Master Plan.

**Foto Community:** upload utenti per superfici Community. La moderazione/approvazione della foto Community **non** equivale a verifica di provenienza, copyright o licenza e **non** trasforma l'immagine in una «foto reale verificata» del resolver delle entità. Le segnalazioni di abuso sulle foto Community seguono il flusso Segnala abuso già definito in MF2. Le Community photo restano un flusso autonomo: non confonderle con la pipeline Wikimedia né con il tier «foto reale verificata».

---

## Dipendenze

- MF3 stati + provenance + verify queue
- MF2 modello evidenza permanente (prerequisito)
- Audit §38.F, J, K, T
- Master §8.3, §13, §16

---

*Fine Macrofase 4 — perimetro file 2026-09-15*
Aggiornato al 19.09.2026
