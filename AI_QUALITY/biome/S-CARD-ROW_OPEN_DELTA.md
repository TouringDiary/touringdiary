# S-CARD-ROW — OPEN DELTA

## 1. Scopo

Questo documento contiene **esclusivamente** il lavoro ancora aperto del cluster `S-CARD-ROW`.

Lo storico completo (decisioni PO, percorsi UI, contratto §11, consuntivo bonifica, motivazioni di chiusura) è in:

[`S-CARD-ROW_HISTORY.md`](./S-CARD-ROW_HISTORY.md)

Hub / alias SoT: [`AUDIT_S_CARD_ROW_32.md`](./AUDIT_S_CARD_ROW_32.md)

**Regola:** non copiare qui le schede delle CARD già chiuse. Usare riferimenti allo History.

---

## 2. Stato generale

| Stato | CARD |
|-------|------|
| Chiuse / bonificate / verify OK | **01–26, 29, 31** (+ dettaglio in History §11.7) |
| Congelate / escluse | **27, 28** |
| Dead code rimosso | **30** |
| Deferred — prossimo capitolo | **32** |
| Altro lavoro aperto (bonifica surface) | **NESSUNO** |

**Residuo Biome accettato (non lavoro aperto):** CARD-19 — hit `noStaticElementInteractions` sullo shell `SuitcaseItemRow` per `onDragOver` / `onDragLeave` / `onDrop` = drop-target HTML5 legittimo. Non silenziare. Storia: History §2ter / §11.7 / deep-dive CARD-19.

---

## 3. Lavoro residuo reale

> **NESSUN ALTRO LAVORO RESIDUO** rispetto alla bonifica surface S-CARD-ROW.
>
> Tutte le CARD operative precedenti sono state bonificate o verificate.  
> CARD-27/28 sono congelate.  
> CARD-30 è stata rimossa.  
> Rimane **CARD-32** come prossimo capitolo (più smoke UI manuali consigliati sotto).

### Indice sintetico chiusure (non riaprire)

| CARD | Stato | Storia |
|------|-------|--------|
| 01–06, 09, 12–16, 18–19, 22–24, 26, 29, 31 | IMPLEMENTATO | [`S-CARD-ROW_HISTORY.md`](./S-CARD-ROW_HISTORY.md) |
| 07, 08, 10, 11, 17, 20, 21, 25 | VERIFY OK | idem |
| 19 (hit drop shell) | IMPLEMENTATO + residuo legittimo | idem §11.7 |
| 27, 28 | CONGELATE | idem note strategia città |
| 30 | DEAD CODE RIMOSSO | idem |

---

## 4. CARD-32 — PROSSIMO CAPITOLO

### CARD-32 — `ImageWithFallback`

| Campo | Valore |
|-------|--------|
| **File** | `src/components/common/ImageWithFallback.tsx` |
| **STATO** | **DEFERRED / PROSSIMO CAPITOLO — DA APRIRE** |
| **Nota** | Esplicitamente rimandata alla fine dell’audit S-CARD-ROW. Da analizzare **separatamente** dopo la riconciliazione del delta residuo. Utility condivisa: non inclusa nella bonifica precedente per scelta deliberata. |

**NON** analizzare o risolvere CARD-32 in questo documento finché non viene avviato esplicitamente un giro dedicato.

Dettaglio storico minimo (se presente): History §3 CARD-32 / §11.3 CARD-32.

---

## 5. Verifiche residue

### A. Completate (non ripetere come task aperti)

Pattern surface/simple, CARD-04 demote, CARD-06 ActionRow, CARD-14 ShopHero, CARD-18 MOVE_ITEM, CARD-19 vincoli deep-dive — vedi History §11.7 checklist A.

### B. Smoke UI manuale PO — consigliato, non ancora certificato in registro

| Area | Stato |
|------|--------|
| Valigia reorder / swipe / qty / Amazon | Consigliato — non certificato |
| Diario Salva Contatto | Consigliato — non certificato |
| Gallery like | Consigliato — non certificato |
| Favorite CityCard | Consigliato — non certificato |

Queste smoke **non** riaprono le CARD; sono solo verifica UX post-bonifica opzionale.

### C. Documentazione esterna (fuori da S-CARD-ROW code)

Se ancora citano dead code / baseline pre-bonifica (History §10):

- `AI_CONTEXT/21_CITY_HISTORY_SYSTEM.md`
- `AI_CONTEXT_MASTER/04_TERRITORIAL_ENGINE.md`
- follow-up Biome 101 / schede a11y

Aggiornare **solo** se il contratto documentato è realmente obsoleto — non per markup interno.

---

## 6. Changelog del DELTA

| Data | Nota |
|------|------|
| 2026-08-20 | Creazione OPEN DELTA. Separazione da History. Nessun lavoro residuo di bonifica oltre CARD-32 deferred + smoke consigliati. Nessun codice applicativo. |

---

*Documento operativo — aggiornare solo questo file per i prossimi giri S-CARD-ROW aperti.*
