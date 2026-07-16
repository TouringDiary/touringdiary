# 33 — Modello ID Dual-Family (TouringDiary)

> **SSOT trasversale** — modello di Primary Key e generazione ID.
> **Non** è un Masterplan di implementazione.
> **Non** apre un Workflow.
> **Non** autorizza migrazioni di schema verso un unico tipo di ID.

**Versione:** 1.0.0  
**Data:** 2026-07-16  
**Stato:** Registrazione architetturale — **nessuna macrofase approvata**

---

## Origine

Durante l’analisi del bug di attivazione Sponsor (`activate_sponsor_from_request` → INSERT su `pois` senza `id`, errore 23502), è stata eseguita una **ricognizione architetturale approfondita** sulla gestione degli ID nel progetto (schema live, tipi, write path, RPC, dipendenze FK).

Questa ricognizione **non** ha interrotto i Workflow pianificati (WF-02). Il lavoro prioritario resta il bugfix Sponsor (soluzione A: la RPC valorizza ID text coerenti col dominio POI/Shop) e la prosecuzione delle Fasi STEP-2.

---

## Modello dual-family (confermato)

Il progetto segue **due famiglie** di Primary Key, ritenute **architetturalmente coerenti** con i rispettivi domini:

| Famiglia | Ambito | Tipo PK | Chi genera (tipico) | Esempi |
|----------|--------|---------|---------------------|--------|
| **Territoriale / applicativo** | Città, POI, Shop, prodotti shop | **`text`**, spesso **senza DEFAULT** | Applicazione / registry / pipeline (OSM, AI draft) | `city_…`, `poi_…`, `osm_…`, `shop_…` |
| **Piattaforma** | Profili, Sponsor (contratto), requests, subscriptions, guide, tour operator, collab, packing, economia | **`uuid`**, spesso **con DEFAULT** `gen_random_uuid()` | Database e/o `randomUUID()` client (`src/utils/runtimeId.ts`) | UUID standard |

Il ponte tipico è la tabella `sponsors`: PK contratto **uuid**, FK verso risorse territoriali **text** (`poi_id`, `shop_id`) e verso guide/operator **uuid**.

### Decisioni esplicite (2026-07-16 — PO)

1. Il modello dual-family è **coerente** e **non** va sostituito da un modello unico (né “tutto UUID”, né “tutto text”) senza una nuova decisione formale.
2. **Non** è approvata alcuna migrazione di modello dati verso unificazione degli ID.
3. Eventuali interventi futuri sulla *governance* delle regole (non sul tipo di PK) sono **rimandati** — vedi sotto.

---

## Macrofase futura possibile: «ID Governance»

| Campo | Valore |
|-------|--------|
| **Nome indicativo** | ID Governance |
| **Stato** | **Non approvata** — solo traccia documentale |
| **Scopo ammesso (se un giorno approvata)** | Consolidare **regole e governance** dei due modelli (documentazione, allineamento RPC/generatori, riduzione drift), **senza** modificare il modello dati dual-family |
| **Scopo vietato (salvo nuova decisione)** | Migrare cities/pois/shops a UUID; unificare forzatamente tutti gli ID |

### Gate obbligatorio prima di qualsiasi avvio

Prima di iniziare «ID Governance» è **obbligatoria** una **nuova ricognizione architetturale** congiunta (Product Owner, ChatGPT e l’AI utilizzata nello sviluppo) sullo stato **reale** del codice in quel momento, rivalutando almeno:

- effort aggiornato;
- benefici reali;
- eventuali nuovi domini e generatori di ID;
- impatto sui Workflow già completati;
- opportunità di una **Governance Light** oppure una **Governance Completa**.

La decisione **non** è presa oggi e **non** deve essere considerata già approvata.

Riferimento operativo (anticipazione, non Workflow aperto): `AI_DEV_WORKFLOW/01_EXECUTION_ROADMAP.md` §6.

---

## Evidenze principali della ricognizione (2026-07-16)

- Live/OpenAPI: `pois.id` / `shops.id` = **text** PK required, **senza DEFAULT**.
- Live: `city_guides` / `city_tour_operators` = **uuid** con `gen_random_uuid()`.
- Write path POI: `src/services/city/poi/poiWrite.ts` genera `poi_…` (non UUID).
- RPC `activate_sponsor_from_request`: INSERT su `pois` (e analogo rischio su `shops`) **senza** valorizzare `id` → causa del 23502.
- Fix operativo (soluzione A, 2026-07-16): migration `supabase/migrations/20260716162000_activate_sponsor_resource_text_ids.sql` — la RPC genera `poi_…` / `shop_…` all'INSERT. **Non** è Governance ID né cambio modello.

Dettaglio WBS / effort della eventuale macrofase: **non** è piano vincolante; **non costituisce piano approvato** fino a nuova ricognizione.

---

## Cronologia

| Versione | Data | Modifiche |
|----------|------|-----------|
| 1.0.0 | 2026-07-16 | Registrazione ricognizione; dual-family; ID Governance non approvata + gate di rivalutazione |
