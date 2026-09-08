# AI_BIOME_UNUSED_AUDIT — Investigazione `noUnusedVariables` / `noUnusedFunctionParameters`

> **Documento persistente** di audit investigativo (non è SoT globale Biome).
> SoT globale residuo Biome: [`AI_BIOME_AUDIT.md`](./AI_BIOME_AUDIT.md).
> Storia aggregata: [`AI_BIOME_HISTORY.md`](./AI_BIOME_HISTORY.md).

---

## Metadata

| Campo | Valore |
| ----- | ------ |
| **Data audit iniziale** | 2026-08-24 |
| **Ultima scansione** | 2026-08-26 |
| **Scope** | Solo `lint/correctness/noUnusedVariables` + `lint/correctness/noUnusedFunctionParameters` |
| **Conteggio baseline (2026-08-24)** | **263** = 168 variables + 95 function parameters |
| **Dopo bonifica chirurgica 🟢 (2026-08-24)** | **161** = 107 variables + 54 function parameters (Δ **−102**) |
| **Conteggio live (scansione 2026-08-26)** | **148** = 97 variables + 51 function parameters (Δ **−13** vs 161) |
| **Metodo ultima scansione** | `npx @biomejs/biome check --reporter=json --max-diagnostics=100000 .` filtrato ai 2 cluster |
| **Modifiche codice in questo aggiornamento documentale** | **Nessuna** (solo questo artefatto) |
| **Distinzione** | `AI_BIOME_AUDIT.md` = panorama completo Biome; **questo file** = indagine funzionale unused-only |

### Premessa metodologica

`unused` ≠ codice morto. Ogni caso è classificato solo con evidenza repo in:

| Tag | Significato |
| --- | ----------- |
| 🔴 ROTTO / SGANCIATO | Doveva ancora avere un ruolo; wiring perso/rotto |
| 🟢 SOSTITUITO | Superato da altra implementazione (evidenza) |
| 🟡 PARZIALE | Feature iniziata, non terminata |
| ⚪ ALTRO / NON DETERMINABILE | Binding lint / firma API / evidenza insufficiente |
| ✅ RISOLTO | Non più presente nella scansione Biome corrente (scheda storica conservata) |

### Snapshot operativo 2026-08-26

| Metrica | Valore |
| ------- | -----: |
| Occorrenze Biome aperte (2 cluster) | **148** |
| di cui noUnusedVariables | 97 |
| di cui noUnusedFunctionParameters | 51 |
| Schede storiche UNUSED-001…263 ancora **aperte** (match Biome) | 148 |
| Schede storiche marcate **RISOLTO** (catch-up + delta post-bonifica) | 115 |
| Nuovi unused non presenti nelle schede storiche | **0** |
| Δ vs residuo post-bonifica (161) | **−13** |

> Nota naming: il documento persistente unused è **questo file** (`AI_BIOME_UNUSED_AUDIT.md`). Non esiste un `biome_unused.txt` separato nel repository; non crearne uno duplicato.

---

## Riepilogo numerico

> **Nota:** le tabelle di classificazione/azioni sotto restano la fotografia dell’audit iniziale (**263** casi, 2026-08-24). Lo stato operativo corrente è nella Metadata / Snapshot **148** aperti. Le schede individuali portano **Stato** ✅ RISOLTO o 🔓 APERTO.

### Classificazione

| Classificazione | Occorrenze |
| --------------- | ---------: |
| 🔴 Rotto / sganciato | 18 |
| 🟢 Sostituito → eliminabile | 105 |
| 🟡 Parziale / non completato | 46 |
| ⚪ Altro / non determinabile | 94 |
| **Totale** | **263** |

### Azioni consigliate

| Azione consigliata | Occorrenze |
| ------------------ | ---------: |
| Eliminare | 188 |
| Riparare / riagganciare | 4 |
| Completare | 36 |
| Analizzare manualmente | 28 |
| Non toccare per ora | 7 |
| **Totale** | **263** |

### Indicatori operativi

| Indicatore | Valore |
| ---------- | -----: |
| Codice eliminabile a basso rischio (stima massiva sicura) | ~166 |
| Codice da riparare (🔴 + azione RIP) | 18 (di cui RIP esplicite: 4) |
| Codice da completare (azione COMP) | 36 |
| Revisione manuale (ANAL) | 28 |

---

## Mass-Bonification Assessment

### Verdetto: 🟡 BONIFICA MASSIVA PARZIALE + REVISIONE

**Non** è consigliata una bonifica massiva unica su tutte le 263.

### 🟢 Massiva sicura (sottoinsieme)

Circa **166** occorrenze con profilo:

- binding `catch (e)` / `err` inutilizzati (catch da mantenere);
- indici `.map` inutilizzati;
- destructuring leftover con evidenza di sostituzione (es. outer `SuitcaseFloatingPanelBody` ×22, TabServices regen ×10, Hero setters, undo stub params);
- helper morti con evidenza (`readFromStorage`, `normalizePoiCategory`, lazy `TravelDiary`);
- type param / import docx unused.

**Perché sicure:** non rimuovono pipeline runtime; al massimo snelliscono firme/binding. **Non** usare autofix Biome come prova di sicurezza: ogni batch va rieseguito con `npm run check` e smoke UI Valigia/Admin Info&Guide.

### 🟡 Massiva parziale

Automatizzare/scriptare solo il sottoinsieme 🟢+⚪ ELIM ad alta confidenza; lasciare:

- tutto 🔴 (City header GPS, Showcase, DiaryDay, Mobile rankings, SafeArt);
- tutto 🟡 COMP (prompt AI non interpolati, cityCache TTL, Referral redeem, RegionalAnalysis logs, SafeArt correlati);
- ANAL (props contratto ambigue).

### 🔴 Non massiva (su tutto il cluster)

Il rischio di trattare unused = dead è troppo alto su prop React ancora passate dal parent, prompt AI, e UI gutted (SafeArt).

---

## UI da verificare (priorità)

1. **Admin → Design/Asset → Safe-Art** — Generate disabilitato (🔴 UNUSED-046…049).
2. **User Dashboard → Referral → Riscatta** — redeem con TODO + `setIsRedeeming` mai chiamato (🟡 UNUSED-172).
3. **Home → città → header / tab categoria / Showcase** — props GPS/surroundings/suggestion (🔴).
4. **Diario → Valigia** — smoke dopo cleanup Body outer (🟢 ma alto volume).
5. **Admin → Edit città → Info & Guide** — regen via EditorInfo; leftover TabServices (🟢).
6. **Admin → Analisi regionale** — log/count non mostrati (🟡).
7. **Admin → Import POI toolbar** — progress non mostrato (🟡).
8. **MySpace → Viaggio → Ricordami** — `yearlyValue` (🟡).
9. **Mobile bottom nav** — rankings (🔴 UNUSED-154).

---

## Casi caso-per-caso (UNUSED-001 … UNUSED-263)


### UNUSED-001 — `rule`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `scripts/_gen_biome_project_sot.cjs`
- **Percorso completo:** `scripts/_gen_biome_project_sot.cjs`
- **Riga:** 720
- **Nome:** `rule`
- **Tipo:** parametro
- **Cosa fa:** Parametro `rule` in `renderOccurrenceAnalysis` dello script SoT Biome.
- **Perché è unused:** Firma riceve `rule` ma il body non lo usa.
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** `scripts/_gen_biome_project_sot.cjs` — reportistica, non runtime app.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo script audit)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-002 — `cont`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `scripts/seed_geo.js`
- **Percorso completo:** `scripts/seed_geo.js`
- **Riga:** 35
- **Nome:** `cont`
- **Tipo:** destructuring
- **Cosa fa:** Risultato Supabase continents (`cont`) in seed geo.
- **Perché è unused:** Destructuring di data non consumato; si controlla solo errore.
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** `scripts/seed_geo.js` one-shot.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-003 — `req`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `server/routes/auth.routes.ts`
- **Percorso completo:** `server/routes/auth.routes.ts`
- **Riga:** 96
- **Nome:** `req`
- **Tipo:** parametro
- **Cosa fa:** Handler Express: firma `(req, res)` obbligatoria; solo `res` usato.
- **Perché è unused:** Endpoint non legge body/query/params da `req`.
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Convenzione Express; rimuovere `req` rompe la firma del handler.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** Non rimuovere il parametro: usare `_req` se si vuole spegnere il lint.
- **Azione consigliata:** NON TOCCARE PER ORA
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** NON TOCCARE firma; eventuale `_req`.

### UNUSED-004 — `req`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `server/routes/bootstrap.routes.ts`
- **Percorso completo:** `server/routes/bootstrap.routes.ts`
- **Riga:** 113
- **Nome:** `req`
- **Tipo:** parametro
- **Cosa fa:** Handler Express: firma `(req, res)` obbligatoria; solo `res` usato.
- **Perché è unused:** Endpoint non legge body/query/params da `req`.
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Convenzione Express; rimuovere `req` rompe la firma del handler.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** Non rimuovere il parametro: usare `_req` se si vuole spegnere il lint.
- **Azione consigliata:** NON TOCCARE PER ORA
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** NON TOCCARE firma; eventuale `_req`.

### UNUSED-005 — `req`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `server/routes/bootstrap.routes.ts`
- **Percorso completo:** `server/routes/bootstrap.routes.ts`
- **Riga:** 137
- **Nome:** `req`
- **Tipo:** parametro
- **Cosa fa:** Handler Express: firma `(req, res)` obbligatoria; solo `res` usato.
- **Perché è unused:** Endpoint non legge body/query/params da `req`.
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Convenzione Express; rimuovere `req` rompe la firma del handler.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** Non rimuovere il parametro: usare `_req` se si vuole spegnere il lint.
- **Azione consigliata:** NON TOCCARE PER ORA
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** NON TOCCARE firma; eventuale `_req`.

### UNUSED-006 — `req`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `server/routes/bootstrap.routes.ts`
- **Percorso completo:** `server/routes/bootstrap.routes.ts`
- **Riga:** 160
- **Nome:** `req`
- **Tipo:** parametro
- **Cosa fa:** Handler Express: firma `(req, res)` obbligatoria; solo `res` usato.
- **Perché è unused:** Endpoint non legge body/query/params da `req`.
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Convenzione Express; rimuovere `req` rompe la firma del handler.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** Non rimuovere il parametro: usare `_req` se si vuole spegnere il lint.
- **Azione consigliata:** NON TOCCARE PER ORA
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** NON TOCCARE firma; eventuale `_req`.

### UNUSED-007 — `req`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `server/routes/content.routes.ts`
- **Percorso completo:** `server/routes/content.routes.ts`
- **Riga:** 18
- **Nome:** `req`
- **Tipo:** parametro
- **Cosa fa:** Handler Express: firma `(req, res)` obbligatoria; solo `res` usato.
- **Perché è unused:** Endpoint non legge body/query/params da `req`.
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Convenzione Express; rimuovere `req` rompe la firma del handler.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** Non rimuovere il parametro: usare `_req` se si vuole spegnere il lint.
- **Azione consigliata:** NON TOCCARE PER ORA
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** NON TOCCARE firma; eventuale `_req`.

### UNUSED-008 — `req`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `server/routes/health.routes.ts`
- **Percorso completo:** `server/routes/health.routes.ts`
- **Riga:** 5
- **Nome:** `req`
- **Tipo:** parametro
- **Cosa fa:** Handler Express: firma `(req, res)` obbligatoria; solo `res` usato.
- **Perché è unused:** Endpoint non legge body/query/params da `req`.
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Convenzione Express; rimuovere `req` rompe la firma del handler.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** Non rimuovere il parametro: usare `_req` se si vuole spegnere il lint.
- **Azione consigliata:** NON TOCCARE PER ORA
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** NON TOCCARE firma; eventuale `_req`.

### UNUSED-009 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/AdminCommunications.tsx`
- **Percorso completo:** `src/components/admin/AdminCommunications.tsx`
- **Riga:** 72
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-010 — `previewPoi`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/AdminPoiManager.tsx`
- **Percorso completo:** `src/components/admin/AdminPoiManager.tsx`
- **Riga:** 40
- **Nome:** `previewPoi`
- **Tipo:** state
- **Cosa fa:** Stato `previewPoi` per anteprima POI in AdminPoiManager.
- **Perché è unused:** `setPreviewPoi` esiste; `previewPoi` non letto in UI.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** Stato scritto mai letto → UI preview incompleta o rimossa.
- **UI verificabile:** **Sì** — `Admin → Manager POI-DB → Edit città → tab POI`
- **Cosa dovrei vedere:** lista POI; eventuale modal preview assente
- **Cosa succede se lo eliminiamo:** rischiamo di perdere una funzionalità (preview) se si toglie senza decidere
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-011 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/AdminTaxonomyManager.tsx`
- **Percorso completo:** `src/components/admin/AdminTaxonomyManager.tsx`
- **Riga:** 166
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-012 — `customDates`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/admin/affiliations/AffiliateAnalyticsTab.tsx`
- **Percorso completo:** `src/components/admin/affiliations/AffiliateAnalyticsTab.tsx`
- **Riga:** 36
- **Nome:** `customDates`
- **Tipo:** parametro
- **Cosa fa:** Prop `customDates` verso AffiliateAnalyticsTab.
- **Perché è unused:** Date locali draft usate; prop parent non consumata.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** Possibile desync parent/child sul range date.
- **UI verificabile:** **Sì** — `Admin → Affiliazioni → Analytics`
- **Cosa dovrei vedere:** filtri data analytics
- **Cosa succede se lo eliminiamo:** non determinabile senza verificare sync parent
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-013 — `i`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/admin/affiliations/AffiliateAnalyticsTab.tsx`
- **Percorso completo:** `src/components/admin/affiliations/AffiliateAnalyticsTab.tsx`
- **Riga:** 246
- **Nome:** `i`
- **Tipo:** parametro map
- **Cosa fa:** Indice `i` in `.map` non usato.
- **Perché è unused:** Solo elemento usato.
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** map index unused
- **UI verificabile:** **Sì** — `Admin → Affiliazioni → Analytics`
- **Cosa dovrei vedere:** grafici/liste
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-014 — `i`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/admin/affiliations/AffiliateAnalyticsTab.tsx`
- **Percorso completo:** `src/components/admin/affiliations/AffiliateAnalyticsTab.tsx`
- **Riga:** 272
- **Nome:** `i`
- **Tipo:** parametro map
- **Cosa fa:** Indice `i` in `.map` non usato.
- **Perché è unused:** Solo elemento usato.
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** map index unused
- **UI verificabile:** **Sì** — `Admin → Affiliazioni → Analytics`
- **Cosa dovrei vedere:** grafici/liste
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-015 — `customDates`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/admin/affiliations/AffiliateOverviewCard.tsx`
- **Percorso completo:** `src/components/admin/affiliations/AffiliateOverviewCard.tsx`
- **Riga:** 32
- **Nome:** `customDates`
- **Tipo:** parametro
- **Cosa fa:** Prop `customDates` su AffiliateOverviewCard.
- **Perché è unused:** Stesso pattern del tab analytics.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** Prop dichiarata non usata nel body.
- **UI verificabile:** **Sì** — `Admin → Affiliazioni → Overview`
- **Cosa dovrei vedere:** card overview
- **Cosa succede se lo eliminiamo:** non determinabile
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-016 — `isExporting`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/cities/CitiesListTab.tsx`
- **Percorso completo:** `src/components/admin/cities/CitiesListTab.tsx`
- **Riga:** 120
- **Nome:** `isExporting`
- **Tipo:** destructuring
- **Cosa fa:** Export CSV taxonomy/POI e flag `isExporting` da `useAdminExport`.
- **Perché è unused:** Hook espone funzioni; CitiesListTab non monta bottoni export.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** `useAdminExport` ancora vivo; UI export non in questo tab (o spostata).
- **UI verificabile:** **Sì** — `Admin → Manager POI-DB → lista città`
- **Cosa dovrei vedere:** toolbar lista; assenza bottoni export CSV
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto (solo destructuring); verificare se export esiste altrove
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-017 — `exportTaxonomyCsv`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/cities/CitiesListTab.tsx`
- **Percorso completo:** `src/components/admin/cities/CitiesListTab.tsx`
- **Riga:** 120
- **Nome:** `exportTaxonomyCsv`
- **Tipo:** destructuring
- **Cosa fa:** Export CSV taxonomy/POI e flag `isExporting` da `useAdminExport`.
- **Perché è unused:** Hook espone funzioni; CitiesListTab non monta bottoni export.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** `useAdminExport` ancora vivo; UI export non in questo tab (o spostata).
- **UI verificabile:** **Sì** — `Admin → Manager POI-DB → lista città`
- **Cosa dovrei vedere:** toolbar lista; assenza bottoni export CSV
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto (solo destructuring); verificare se export esiste altrove
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-018 — `exportGlobalPoisCsv`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/cities/CitiesListTab.tsx`
- **Percorso completo:** `src/components/admin/cities/CitiesListTab.tsx`
- **Riga:** 120
- **Nome:** `exportGlobalPoisCsv`
- **Tipo:** destructuring
- **Cosa fa:** Export CSV taxonomy/POI e flag `isExporting` da `useAdminExport`.
- **Perché è unused:** Hook espone funzioni; CitiesListTab non monta bottoni export.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** `useAdminExport` ancora vivo; UI export non in questo tab (o spostata).
- **UI verificabile:** **Sì** — `Admin → Manager POI-DB → lista città`
- **Cosa dovrei vedere:** toolbar lista; assenza bottoni export CSV
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto (solo destructuring); verificare se export esiste altrove
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-019 — `existingCityNames`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/admin/cities/RegionalAnalysisModal.tsx`
- **Percorso completo:** `src/components/admin/cities/RegionalAnalysisModal.tsx`
- **Riga:** 73
- **Nome:** `existingCityNames`
- **Tipo:** parametro
- **Cosa fa:** `existingCityNames` passato al modal analisi regionale.
- **Perché è unused:** Selezione usa `dbCitiesMap`; prop non referenziata.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** RegionalAnalysisModal props vs uso interno.
- **UI verificabile:** **Sì** — `Admin → Manager POI-DB → Analisi regionale/zona`
- **Cosa dovrei vedere:** modal analisi
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto se parent smette di passare la prop
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-020 — `onMagicGenerate`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/admin/cities/RegionalAnalysisModal.tsx`
- **Percorso completo:** `src/components/admin/cities/RegionalAnalysisModal.tsx`
- **Riga:** 75
- **Nome:** `onMagicGenerate`
- **Tipo:** parametro
- **Cosa fa:** Callback opzionale `onMagicGenerate`.
- **Perché è unused:** Mai invocata nel modal.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** Prop opzionale morta; Magic generate esiste altrove (`useAiMagicCity`).
- **UI verificabile:** **Sì** — `Admin → Manager POI-DB → Analisi regionale`
- **Cosa dovrei vedere:** azioni generate/magic nel modal
- **Cosa succede se lo eliminiamo:** rischiamo di perdere un aggancio previsto se si elimina senza verificare UX
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-021 — `importLogs`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/cities/RegionalAnalysisModal.tsx`
- **Percorso completo:** `src/components/admin/cities/RegionalAnalysisModal.tsx`
- **Riga:** 101
- **Nome:** `importLogs`
- **Tipo:** state
- **Cosa fa:** `importLogs` accumulati durante import.
- **Perché è unused:** `setImportLogs` scrive; valore mai renderizzato.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** Stato aggiornato senza UI log.
- **UI verificabile:** **Sì** — `Admin → Manager POI-DB → Analisi regionale → import`
- **Cosa dovrei vedere:** assenza pannello log import
- **Cosa succede se lo eliminiamo:** rischiamo di perdere una funzionalità (log) se eliminiamo stato+setter
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-022 — `autoUpdateCount`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/cities/RegionalAnalysisModal.tsx`
- **Percorso completo:** `src/components/admin/cities/RegionalAnalysisModal.tsx`
- **Riga:** 184
- **Nome:** `autoUpdateCount`
- **Tipo:** state
- **Cosa fa:** Contatore `autoUpdateCount`.
- **Perché è unused:** Incrementato, non mostrato.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** L184–197 increment; no JSX
- **UI verificabile:** **Sì** — `Admin → Analisi regionale`
- **Cosa dovrei vedere:** contatore auto-update assente
- **Cosa succede se lo eliminiamo:** perdita metrica UI se si voleva mostrarla
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-023 — `discardedCount`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/cities/RegionalAnalysisModal.tsx`
- **Percorso completo:** `src/components/admin/cities/RegionalAnalysisModal.tsx`
- **Riga:** 349
- **Nome:** `discardedCount`
- **Tipo:** variabile
- **Cosa fa:** `discardedCount` durante filtraggio.
- **Perché è unused:** Calcolato, non mostrato.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** ~L349
- **UI verificabile:** **Sì** — `Admin → Analisi regionale`
- **Cosa dovrei vedere:** conteggio scartati
- **Cosa succede se lo eliminiamo:** perdita metrica UI
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-024 — `onImportMissing`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/admin/cities/ZoneCard.tsx`
- **Percorso completo:** `src/components/admin/cities/ZoneCard.tsx`
- **Riga:** 58
- **Nome:** `onImportMissing`
- **Tipo:** parametro
- **Cosa fa:** `onImportMissing` su ZoneCard.
- **Perché è unused:** Callback non collegata a bottone nella card.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** Prop in interface; nessun onClick.
- **UI verificabile:** **Sì** — `Admin → Manager POI-DB → zone strategiche`
- **Cosa dovrei vedere:** ZoneCard senza CTA import missing
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto; parent può ancora passare callback morta
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-025 — `showToast`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/CitiesManager.tsx`
- **Percorso completo:** `src/components/admin/CitiesManager.tsx`
- **Riga:** 111
- **Nome:** `showToast`
- **Tipo:** destructuring
- **Cosa fa:** `showToast` da context in CitiesManager.
- **Perché è unused:** Mai chiamato in questo shell.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** Destructuring inutilizzato
- **UI verificabile:** **Sì** — `Admin → Manager POI-DB`
- **Cosa dovrei vedere:** shell manager
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-026 — `currentUser`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/admin/cityEditor/culture/CulturePeople.tsx`
- **Percorso completo:** `src/components/admin/cityEditor/culture/CulturePeople.tsx`
- **Riga:** 41
- **Nome:** `currentUser`
- **Tipo:** parametro
- **Cosa fa:** `currentUser` in CulturePeople.
- **Perché è unused:** Prop ricevuta non usata (permessi? AI?).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Altri hook people usano user altrove.
- **UI verificabile:** **Sì** — `Admin → Edit città → Cultura → People`
- **Cosa dovrei vedere:** gestione personaggi
- **Cosa succede se lo eliminiamo:** non determinabile (potrebbe servire per gate futuro)
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Bassa
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-027 — `i`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/admin/cityEditor/culture/CulturePeople.tsx`
- **Percorso completo:** `src/components/admin/cityEditor/culture/CulturePeople.tsx`
- **Riga:** 681
- **Nome:** `i`
- **Tipo:** parametro map
- **Cosa fa:** indice `i` inutilizzato in map
- **Perché è unused:** solo item usato
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** map index
- **UI verificabile:** **Sì** — `Admin → Cultura → People`
- **Cosa dovrei vedere:** lista
- **Cosa succede se lo eliminiamo:** nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-028 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/cityEditor/EditorCulture.tsx`
- **Percorso completo:** `src/components/admin/cityEditor/EditorCulture.tsx`
- **Riga:** 228
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **Sì** — `Admin → Manager POI-DB → Edit città → Culture/General`
- **Cosa dovrei vedere:** Editor città
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-029 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/cityEditor/EditorCulture.tsx`
- **Percorso completo:** `src/components/admin/cityEditor/EditorCulture.tsx`
- **Riga:** 247
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **Sì** — `Admin → Manager POI-DB → Edit città → Culture/General`
- **Cosa dovrei vedere:** Editor città
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-030 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/cityEditor/EditorGeneral.tsx`
- **Percorso completo:** `src/components/admin/cityEditor/EditorGeneral.tsx`
- **Riga:** 146
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **Sì** — `Admin → Manager POI-DB → Edit città → Culture/General`
- **Cosa dovrei vedere:** Editor città
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-031 — `isHeroImageValid`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/cityEditor/EditorMedia.tsx`
- **Percorso completo:** `src/components/admin/cityEditor/EditorMedia.tsx`
- **Riga:** 25
- **Nome:** `isHeroImageValid`
- **Tipo:** variabile
- **Cosa fa:** `isHeroImageValid` in EditorMedia.
- **Perché è unused:** Calcolata/derivata non usata per gate UI.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** Possibile validazione hero incompleta.
- **UI verificabile:** **Sì** — `Admin → Edit città → Media`
- **Cosa dovrei vedere:** upload hero
- **Cosa succede se lo eliminiamo:** non determinabile
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-032 — `setCityDirectly`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/cityEditor/EditorRatings.tsx`
- **Percorso completo:** `src/components/admin/cityEditor/EditorRatings.tsx`
- **Riga:** 85
- **Nome:** `setCityDirectly`
- **Tipo:** destructuring
- **Cosa fa:** `setCityDirectly` / `updateField` da editor context in EditorRatings.
- **Perché è unused:** Ratings usa altro path di update.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** Destructuring non referenziato
- **UI verificabile:** **Sì** — `Admin → Edit città → Ratings`
- **Cosa dovrei vedere:** slider ratings
- **Cosa succede se lo eliminiamo:** nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-033 — `updateField`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/cityEditor/EditorRatings.tsx`
- **Percorso completo:** `src/components/admin/cityEditor/EditorRatings.tsx`
- **Riga:** 87
- **Nome:** `updateField`
- **Tipo:** destructuring
- **Cosa fa:** `setCityDirectly` / `updateField` da editor context in EditorRatings.
- **Perché è unused:** Ratings usa altro path di update.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** Destructuring non referenziato
- **UI verificabile:** **Sì** — `Admin → Edit città → Ratings`
- **Cosa dovrei vedere:** slider ratings
- **Cosa succede se lo eliminiamo:** nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-034 — `onOpenTaxonomy`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/admin/cityEditor/services/EditorInfo.tsx`
- **Percorso completo:** `src/components/admin/cityEditor/services/EditorInfo.tsx`
- **Riga:** 23
- **Nome:** `onOpenTaxonomy`
- **Tipo:** parametro
- **Cosa fa:** `onOpenTaxonomy` in EditorInfo.
- **Perché è unused:** EditorInfo apre taxonomy con stato locale; ignora callback parent.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** TabServices passa `onOpenTaxonomy` ma EditorInfo non lo chiama; overlay TabServices irraggiungibile da EditorInfo.
- **UI verificabile:** **Sì** — `Admin → Edit città → Info & Guide (TabServices)`
- **Cosa dovrei vedere:** tassonomia da EditorInfo (locale), non overlay TabServices
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto; cleanup prop+overlay TabServices
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-035 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/cityEditor/tabs/TabGeneral.tsx`
- **Percorso completo:** `src/components/admin/cityEditor/tabs/TabGeneral.tsx`
- **Riga:** 144
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **Sì** — `Admin → Manager POI-DB → Edit città → Culture/General`
- **Cosa dovrei vedere:** Editor città
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-036 — `reloadCurrentCity`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/cityEditor/tabs/TabServices.tsx`
- **Percorso completo:** `src/components/admin/cityEditor/tabs/TabServices.tsx`
- **Riga:** 10
- **Nome:** `reloadCurrentCity`
- **Tipo:** state/destructuring
- **Cosa fa:** Stato/props regen massiva lasciati in TabServices dopo spostamento in EditorInfo.
- **Perché è unused:** Commento esplicito L26–30: regen delegata a EditorInfo / useServiceRegeneration.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** State generating/genStatus/confirm/success + reloadCurrentCity + regenMsg mai usati; EditorInfo gestisce UI regen.
- **UI verificabile:** **Sì** — `Admin → Manager POI-DB → Edit città → tab Info & Guide`
- **Cosa dovrei vedere:** barra regen in EditorInfo funzionante; stati TabServices morti
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente se si rimuovono i leftover TabServices
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-037 — `generating`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/cityEditor/tabs/TabServices.tsx`
- **Percorso completo:** `src/components/admin/cityEditor/tabs/TabServices.tsx`
- **Riga:** 13
- **Nome:** `generating`
- **Tipo:** state/destructuring
- **Cosa fa:** Stato/props regen massiva lasciati in TabServices dopo spostamento in EditorInfo.
- **Perché è unused:** Commento esplicito L26–30: regen delegata a EditorInfo / useServiceRegeneration.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** State generating/genStatus/confirm/success + reloadCurrentCity + regenMsg mai usati; EditorInfo gestisce UI regen.
- **UI verificabile:** **Sì** — `Admin → Manager POI-DB → Edit città → tab Info & Guide`
- **Cosa dovrei vedere:** barra regen in EditorInfo funzionante; stati TabServices morti
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente se si rimuovono i leftover TabServices
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-038 — `setGenerating`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/cityEditor/tabs/TabServices.tsx`
- **Percorso completo:** `src/components/admin/cityEditor/tabs/TabServices.tsx`
- **Riga:** 13
- **Nome:** `setGenerating`
- **Tipo:** state/destructuring
- **Cosa fa:** Stato/props regen massiva lasciati in TabServices dopo spostamento in EditorInfo.
- **Perché è unused:** Commento esplicito L26–30: regen delegata a EditorInfo / useServiceRegeneration.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** State generating/genStatus/confirm/success + reloadCurrentCity + regenMsg mai usati; EditorInfo gestisce UI regen.
- **UI verificabile:** **Sì** — `Admin → Manager POI-DB → Edit città → tab Info & Guide`
- **Cosa dovrei vedere:** barra regen in EditorInfo funzionante; stati TabServices morti
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente se si rimuovono i leftover TabServices
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-039 — `genStatus`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/cityEditor/tabs/TabServices.tsx`
- **Percorso completo:** `src/components/admin/cityEditor/tabs/TabServices.tsx`
- **Riga:** 14
- **Nome:** `genStatus`
- **Tipo:** state/destructuring
- **Cosa fa:** Stato/props regen massiva lasciati in TabServices dopo spostamento in EditorInfo.
- **Perché è unused:** Commento esplicito L26–30: regen delegata a EditorInfo / useServiceRegeneration.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** State generating/genStatus/confirm/success + reloadCurrentCity + regenMsg mai usati; EditorInfo gestisce UI regen.
- **UI verificabile:** **Sì** — `Admin → Manager POI-DB → Edit città → tab Info & Guide`
- **Cosa dovrei vedere:** barra regen in EditorInfo funzionante; stati TabServices morti
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente se si rimuovono i leftover TabServices
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-040 — `setGenStatus`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/cityEditor/tabs/TabServices.tsx`
- **Percorso completo:** `src/components/admin/cityEditor/tabs/TabServices.tsx`
- **Riga:** 14
- **Nome:** `setGenStatus`
- **Tipo:** state/destructuring
- **Cosa fa:** Stato/props regen massiva lasciati in TabServices dopo spostamento in EditorInfo.
- **Perché è unused:** Commento esplicito L26–30: regen delegata a EditorInfo / useServiceRegeneration.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** State generating/genStatus/confirm/success + reloadCurrentCity + regenMsg mai usati; EditorInfo gestisce UI regen.
- **UI verificabile:** **Sì** — `Admin → Manager POI-DB → Edit città → tab Info & Guide`
- **Cosa dovrei vedere:** barra regen in EditorInfo funzionante; stati TabServices morti
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente se si rimuovono i leftover TabServices
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-041 — `showConfirmRegen`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/cityEditor/tabs/TabServices.tsx`
- **Percorso completo:** `src/components/admin/cityEditor/tabs/TabServices.tsx`
- **Riga:** 15
- **Nome:** `showConfirmRegen`
- **Tipo:** state/destructuring
- **Cosa fa:** Stato/props regen massiva lasciati in TabServices dopo spostamento in EditorInfo.
- **Perché è unused:** Commento esplicito L26–30: regen delegata a EditorInfo / useServiceRegeneration.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** State generating/genStatus/confirm/success + reloadCurrentCity + regenMsg mai usati; EditorInfo gestisce UI regen.
- **UI verificabile:** **Sì** — `Admin → Manager POI-DB → Edit città → tab Info & Guide`
- **Cosa dovrei vedere:** barra regen in EditorInfo funzionante; stati TabServices morti
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente se si rimuovono i leftover TabServices
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-042 — `setShowConfirmRegen`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/cityEditor/tabs/TabServices.tsx`
- **Percorso completo:** `src/components/admin/cityEditor/tabs/TabServices.tsx`
- **Riga:** 15
- **Nome:** `setShowConfirmRegen`
- **Tipo:** state/destructuring
- **Cosa fa:** Stato/props regen massiva lasciati in TabServices dopo spostamento in EditorInfo.
- **Perché è unused:** Commento esplicito L26–30: regen delegata a EditorInfo / useServiceRegeneration.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** State generating/genStatus/confirm/success + reloadCurrentCity + regenMsg mai usati; EditorInfo gestisce UI regen.
- **UI verificabile:** **Sì** — `Admin → Manager POI-DB → Edit città → tab Info & Guide`
- **Cosa dovrei vedere:** barra regen in EditorInfo funzionante; stati TabServices morti
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente se si rimuovono i leftover TabServices
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-043 — `successMessage`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/cityEditor/tabs/TabServices.tsx`
- **Percorso completo:** `src/components/admin/cityEditor/tabs/TabServices.tsx`
- **Riga:** 16
- **Nome:** `successMessage`
- **Tipo:** state/destructuring
- **Cosa fa:** Stato/props regen massiva lasciati in TabServices dopo spostamento in EditorInfo.
- **Perché è unused:** Commento esplicito L26–30: regen delegata a EditorInfo / useServiceRegeneration.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** State generating/genStatus/confirm/success + reloadCurrentCity + regenMsg mai usati; EditorInfo gestisce UI regen.
- **UI verificabile:** **Sì** — `Admin → Manager POI-DB → Edit città → tab Info & Guide`
- **Cosa dovrei vedere:** barra regen in EditorInfo funzionante; stati TabServices morti
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente se si rimuovono i leftover TabServices
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-044 — `setSuccessMessage`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/cityEditor/tabs/TabServices.tsx`
- **Percorso completo:** `src/components/admin/cityEditor/tabs/TabServices.tsx`
- **Riga:** 16
- **Nome:** `setSuccessMessage`
- **Tipo:** state/destructuring
- **Cosa fa:** Stato/props regen massiva lasciati in TabServices dopo spostamento in EditorInfo.
- **Perché è unused:** Commento esplicito L26–30: regen delegata a EditorInfo / useServiceRegeneration.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** State generating/genStatus/confirm/success + reloadCurrentCity + regenMsg mai usati; EditorInfo gestisce UI regen.
- **UI verificabile:** **Sì** — `Admin → Manager POI-DB → Edit città → tab Info & Guide`
- **Cosa dovrei vedere:** barra regen in EditorInfo funzionante; stati TabServices morti
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente se si rimuovono i leftover TabServices
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-045 — `regenMsg`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/cityEditor/tabs/TabServices.tsx`
- **Percorso completo:** `src/components/admin/cityEditor/tabs/TabServices.tsx`
- **Riga:** 22
- **Nome:** `regenMsg`
- **Tipo:** state/destructuring
- **Cosa fa:** Stato/props regen massiva lasciati in TabServices dopo spostamento in EditorInfo.
- **Perché è unused:** Commento esplicito L26–30: regen delegata a EditorInfo / useServiceRegeneration.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** State generating/genStatus/confirm/success + reloadCurrentCity + regenMsg mai usati; EditorInfo gestisce UI regen.
- **UI verificabile:** **Sì** — `Admin → Manager POI-DB → Edit città → tab Info & Guide`
- **Cosa dovrei vedere:** barra regen in EditorInfo funzionante; stati TabServices morti
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente se si rimuovono i leftover TabServices
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-046 — `setGenPrompt`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/design/SafeArtPanel.tsx`
- **Percorso completo:** `src/components/admin/design/SafeArtPanel.tsx`
- **Riga:** 31
- **Nome:** `setGenPrompt`
- **Tipo:** setter/state
- **Cosa fa:** Setter e state per prompt/stile Safe-Art Generator.
- **Perché è unused:** UI di input/style gutted (commenti stub); `genPrompt` resta `""` → Generate sempre disabled.
- **Classificazione:** 🔴 ROTTO / SGANCIATO
- **Evidenza:** SafeArtPanel: `!genPrompt.trim()` disabilita bottone; setGenPrompt/setStyleMode/setCurrentInstruction mai chiamati; STYLES stub.
- **UI verificabile:** **Sì** — `Admin → Asset Globali / Design → Safe-Art / Hero generator`
- **Cosa dovrei vedere:** pannello Safe-Art con Generate disabilitato, nessun campo prompt/stile
- **Cosa succede se lo eliminiamo:** rischiamo di lasciare una pipeline ancora più rotta; meglio RIPARARE UI
- **Azione consigliata:** RIPARARE / RIAGGANCIARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-047 — `styleMode`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/design/SafeArtPanel.tsx`
- **Percorso completo:** `src/components/admin/design/SafeArtPanel.tsx`
- **Riga:** 32
- **Nome:** `styleMode`
- **Tipo:** setter/state
- **Cosa fa:** Setter e state per prompt/stile Safe-Art Generator.
- **Perché è unused:** UI di input/style gutted (commenti stub); `genPrompt` resta `""` → Generate sempre disabled.
- **Classificazione:** 🔴 ROTTO / SGANCIATO
- **Evidenza:** SafeArtPanel: `!genPrompt.trim()` disabilita bottone; setGenPrompt/setStyleMode/setCurrentInstruction mai chiamati; STYLES stub.
- **UI verificabile:** **Sì** — `Admin → Asset Globali / Design → Safe-Art / Hero generator`
- **Cosa dovrei vedere:** pannello Safe-Art con Generate disabilitato, nessun campo prompt/stile
- **Cosa succede se lo eliminiamo:** rischiamo di lasciare una pipeline ancora più rotta; meglio RIPARARE UI
- **Azione consigliata:** RIPARARE / RIAGGANCIARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-048 — `setStyleMode`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/design/SafeArtPanel.tsx`
- **Percorso completo:** `src/components/admin/design/SafeArtPanel.tsx`
- **Riga:** 32
- **Nome:** `setStyleMode`
- **Tipo:** setter/state
- **Cosa fa:** Setter e state per prompt/stile Safe-Art Generator.
- **Perché è unused:** UI di input/style gutted (commenti stub); `genPrompt` resta `""` → Generate sempre disabled.
- **Classificazione:** 🔴 ROTTO / SGANCIATO
- **Evidenza:** SafeArtPanel: `!genPrompt.trim()` disabilita bottone; setGenPrompt/setStyleMode/setCurrentInstruction mai chiamati; STYLES stub.
- **UI verificabile:** **Sì** — `Admin → Asset Globali / Design → Safe-Art / Hero generator`
- **Cosa dovrei vedere:** pannello Safe-Art con Generate disabilitato, nessun campo prompt/stile
- **Cosa succede se lo eliminiamo:** rischiamo di lasciare una pipeline ancora più rotta; meglio RIPARARE UI
- **Azione consigliata:** RIPARARE / RIAGGANCIARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-049 — `setCurrentInstruction`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/design/SafeArtPanel.tsx`
- **Percorso completo:** `src/components/admin/design/SafeArtPanel.tsx`
- **Riga:** 33
- **Nome:** `setCurrentInstruction`
- **Tipo:** setter/state
- **Cosa fa:** Setter e state per prompt/stile Safe-Art Generator.
- **Perché è unused:** UI di input/style gutted (commenti stub); `genPrompt` resta `""` → Generate sempre disabled.
- **Classificazione:** 🔴 ROTTO / SGANCIATO
- **Evidenza:** SafeArtPanel: `!genPrompt.trim()` disabilita bottone; setGenPrompt/setStyleMode/setCurrentInstruction mai chiamati; STYLES stub.
- **UI verificabile:** **Sì** — `Admin → Asset Globali / Design → Safe-Art / Hero generator`
- **Cosa dovrei vedere:** pannello Safe-Art con Generate disabilitato, nessun campo prompt/stile
- **Cosa succede se lo eliminiamo:** rischiamo di lasciare una pipeline ancora più rotta; meglio RIPARARE UI
- **Azione consigliata:** RIPARARE / RIAGGANCIARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-050 — `setPeriodFilter`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/GlobalEventsManager.tsx`
- **Percorso completo:** `src/components/admin/GlobalEventsManager.tsx`
- **Riga:** 46
- **Nome:** `setPeriodFilter`
- **Tipo:** setter
- **Cosa fa:** `setPeriodFilter` per filtro periodo eventi globali.
- **Perché è unused:** `periodFilter` inviato ad API ma nessun controllo UI chiama il setter.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** GlobalEventsManager
- **UI verificabile:** **Sì** — `Admin → Eventi Globali`
- **Cosa dovrei vedere:** filtro periodo assente o fisso
- **Cosa succede se lo eliminiamo:** perdita filtro se previsto
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-051 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/GlobalEventsManager.tsx`
- **Percorso completo:** `src/components/admin/GlobalEventsManager.tsx`
- **Riga:** 132
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **Sì** — `Admin → Eventi Globali`
- **Cosa dovrei vedere:** lista eventi
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-052 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/GlobalEventsManager.tsx`
- **Percorso completo:** `src/components/admin/GlobalEventsManager.tsx`
- **Riga:** 179
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **Sì** — `Admin → Eventi Globali`
- **Cosa dovrei vedere:** lista eventi
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-053 — `MONTHS`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/GlobalEventsManager.tsx`
- **Percorso completo:** `src/components/admin/GlobalEventsManager.tsx`
- **Riga:** 186
- **Nome:** `MONTHS`
- **Tipo:** const
- **Cosa fa:** Costante `MONTHS` (etichette mesi).
- **Perché è unused:** Dichiarata, mai usata (vecchio picker?).
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** GlobalEventsManager
- **UI verificabile:** **Sì** — `Admin → Eventi Globali`
- **Cosa dovrei vedere:** filtri data
- **Cosa succede se lo eliminiamo:** nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-054 — `analysisProgress`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/admin/import/components/ImportActionToolbar.tsx`
- **Percorso completo:** `src/components/admin/import/components/ImportActionToolbar.tsx`
- **Riga:** 45
- **Nome:** `analysisProgress`
- **Tipo:** parametro
- **Cosa fa:** `analysisProgress` / `publishProgress` in ImportActionToolbar.
- **Perché è unused:** Ricevuti dal parent, mai mostrati nella toolbar.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** Import flow completo; progress UI mancante.
- **UI verificabile:** **Sì** — `Admin → Manager & Import POI → toolbar azioni`
- **Cosa dovrei vedere:** assenza progress bar analisi/publish
- **Cosa succede se lo eliminiamo:** perdita feedback progress se si elimina senza UI alternativa
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-055 — `publishProgress`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/admin/import/components/ImportActionToolbar.tsx`
- **Percorso completo:** `src/components/admin/import/components/ImportActionToolbar.tsx`
- **Riga:** 46
- **Nome:** `publishProgress`
- **Tipo:** parametro
- **Cosa fa:** `analysisProgress` / `publishProgress` in ImportActionToolbar.
- **Perché è unused:** Ricevuti dal parent, mai mostrati nella toolbar.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** Import flow completo; progress UI mancante.
- **UI verificabile:** **Sì** — `Admin → Manager & Import POI → toolbar azioni`
- **Cosa dovrei vedere:** assenza progress bar analisi/publish
- **Cosa succede se lo eliminiamo:** perdita feedback progress se si elimina senza UI alternativa
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-056 — `type`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/admin/import/ImportOsmModal.tsx`
- **Percorso completo:** `src/components/admin/import/ImportOsmModal.tsx`
- **Riga:** 49
- **Nome:** `type`
- **Tipo:** parametro
- **Cosa fa:** Parametro `type` in ImportOsmModal.
- **Perché è unused:** Non usato nel body.
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** firma residua
- **UI verificabile:** **Sì** — `Admin → Import OSM`
- **Cosa dovrei vedere:** modal OSM
- **Cosa succede se lo eliminiamo:** nessun impatto con `_type`
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-057 — `isLoading`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/NewsTickerManager.tsx`
- **Percorso completo:** `src/components/admin/NewsTickerManager.tsx`
- **Riga:** 182
- **Nome:** `isLoading`
- **Tipo:** state
- **Cosa fa:** `isLoading` NewsTickerManager.
- **Perché è unused:** Flag non usato per spinner.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** loading senza UI
- **UI verificabile:** **Sì** — `Admin → News Ticker`
- **Cosa dovrei vedere:** lista ticker
- **Cosa succede se lo eliminiamo:** UX loading incompleta
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-058 — `activeCount`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/observatory/ObservatoryFilterDrawer.tsx`
- **Percorso completo:** `src/components/admin/observatory/ObservatoryFilterDrawer.tsx`
- **Riga:** 89
- **Nome:** `activeCount`
- **Tipo:** variabile
- **Cosa fa:** `activeCount` filtri Observatory.
- **Perché è unused:** Calcolato, non badge.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** ObservatoryFilterDrawer
- **UI verificabile:** **Sì** — `Admin → Observatory → filtri`
- **Cosa dovrei vedere:** badge conteggio filtri
- **Cosa succede se lo eliminiamo:** perdita badge
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-059 — `e`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/admin/observatory/ObservatoryLayout.tsx`
- **Percorso completo:** `src/components/admin/observatory/ObservatoryLayout.tsx`
- **Riga:** 38
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **Sì** — `Admin → Observatory`
- **Cosa dovrei vedere:** layout
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-060 — `e`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/admin/observatory/ObservatoryLayout.tsx`
- **Percorso completo:** `src/components/admin/observatory/ObservatoryLayout.tsx`
- **Riga:** 39
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **Sì** — `Admin → Observatory`
- **Cosa dovrei vedere:** layout
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-061 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/photos/PhotoRow.tsx`
- **Percorso completo:** `src/components/admin/photos/PhotoRow.tsx`
- **Riga:** 42
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-062 — `isCatWorking`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/poiManager/BulkFixProgressModal.tsx`
- **Percorso completo:** `src/components/admin/poiManager/BulkFixProgressModal.tsx`
- **Riga:** 147
- **Nome:** `isCatWorking`
- **Tipo:** variabile
- **Cosa fa:** `isCatWorking` in BulkFixProgressModal.
- **Perché è unused:** Derivato non usato per UI categoria.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** Bulk fix POI
- **UI verificabile:** **Sì** — `Admin → POI Manager → Bulk fix progress`
- **Cosa dovrei vedere:** progress per categoria
- **Cosa succede se lo eliminiamo:** UX progress parziale
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-063 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/settings/PartnerIntegrationsPanel.tsx`
- **Percorso completo:** `src/components/admin/settings/PartnerIntegrationsPanel.tsx`
- **Riga:** 134
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-064 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/social/AiBackgroundPanel.tsx`
- **Percorso completo:** `src/components/admin/social/AiBackgroundPanel.tsx`
- **Riga:** 57
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-065 — `showSuccessModal`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/social/SocialPreviewConfig.tsx`
- **Percorso completo:** `src/components/admin/social/SocialPreviewConfig.tsx`
- **Riga:** 13
- **Nome:** `showSuccessModal`
- **Tipo:** state/ref
- **Cosa fa:** `showSuccessModal` / `fileInputRef` in SocialPreviewConfig.
- **Perché è unused:** Preparati, non collegati a flusso upload/success.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** Social Studio config
- **UI verificabile:** **Sì** — `Admin → Social Studio → Preview config`
- **Cosa dovrei vedere:** upload/success modal
- **Cosa succede se lo eliminiamo:** feature incompleta
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-066 — `fileInputRef`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/social/SocialPreviewConfig.tsx`
- **Percorso completo:** `src/components/admin/social/SocialPreviewConfig.tsx`
- **Riga:** 16
- **Nome:** `fileInputRef`
- **Tipo:** state/ref
- **Cosa fa:** `showSuccessModal` / `fileInputRef` in SocialPreviewConfig.
- **Perché è unused:** Preparati, non collegati a flusso upload/success.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** Social Studio config
- **UI verificabile:** **Sì** — `Admin → Social Studio → Preview config`
- **Cosa dovrei vedere:** upload/success modal
- **Cosa succede se lo eliminiamo:** feature incompleta
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-067 — `isLoading`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/SponsorManager.tsx`
- **Percorso completo:** `src/components/admin/SponsorManager.tsx`
- **Riga:** 58
- **Nome:** `isLoading`
- **Tipo:** state
- **Cosa fa:** `isLoading` SponsorManager.
- **Perché è unused:** Non guida spinner.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** Sponsor admin
- **UI verificabile:** **Sì** — `Admin → Sponsors`
- **Cosa dovrei vedere:** lista sponsor
- **Cosa succede se lo eliminiamo:** UX loading
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-068 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/userManager/EditUserModal.tsx`
- **Percorso completo:** `src/components/admin/userManager/EditUserModal.tsx`
- **Riga:** 70
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-069 — `currentUserId`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/admin/userManager/UserTable.tsx`
- **Percorso completo:** `src/components/admin/userManager/UserTable.tsx`
- **Riga:** 49
- **Nome:** `currentUserId`
- **Tipo:** parametro
- **Cosa fa:** `currentUserId` in UserTable (self-protect?).
- **Perché è unused:** Prop non usata per disabilitare azioni su sé stessi.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** UserTable
- **UI verificabile:** **Sì** — `Admin → Utenti & Ruoli → tabella`
- **Cosa dovrei vedere:** azioni su utente corrente
- **Cosa succede se lo eliminiamo:** possibile gap sicurezza UX
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-070 — `onExport`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/admin/userManager/UserTable.tsx`
- **Percorso completo:** `src/components/admin/userManager/UserTable.tsx`
- **Riga:** 54
- **Nome:** `onExport`
- **Tipo:** parametro
- **Cosa fa:** `onExport` opzionale UserTable.
- **Perché è unused:** Mai chiamato.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** export utenti altrove o mai fatto
- **UI verificabile:** **Sì** — `Admin → Utenti`
- **Cosa dovrei vedere:** export
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-071 — `getLegend`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/admin/userManager/UserTable.tsx`
- **Percorso completo:** `src/components/admin/userManager/UserTable.tsx`
- **Riga:** 60
- **Riga storica audit 2026-08-24:** 61
- **Nome:** `getLegend`
- **Tipo:** variabile
- **Cosa fa:** `getLegend` da useSystemMessage.
- **Perché è unused:** Caricato, mai mostrato.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** UserTable
- **UI verificabile:** **Sì** — `Admin → Utenti`
- **Cosa dovrei vedere:** legend ruoli
- **Cosa succede se lo eliminiamo:** perdita legend
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-072 — `filteredCount`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/admin/userManager/UserToolbar.tsx`
- **Percorso completo:** `src/components/admin/userManager/UserToolbar.tsx`
- **Riga:** 25
- **Nome:** `filteredCount`
- **Tipo:** parametro
- **Cosa fa:** `filteredCount` in UserToolbar.
- **Perché è unused:** Non mostrato.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** toolbar
- **UI verificabile:** **Sì** — `Admin → Utenti → toolbar`
- **Cosa dovrei vedere:** conteggio filtrati
- **Cosa succede se lo eliminiamo:** nessun impatto se non c’era UI
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — era ancora aperto dopo la bonifica −102 del 2026-08-24; ora assente da Biome (fix successivi al batch 🟢)

### UNUSED-073 — `onUserUpdate`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/admin/views/UserManagementView.tsx`
- **Percorso completo:** `src/components/admin/views/UserManagementView.tsx`
- **Riga:** 15
- **Nome:** `onUserUpdate`
- **Tipo:** parametro
- **Cosa fa:** `onUserUpdate` in UserManagementView.
- **Perché è unused:** Dashboard passa callback; view non propaga.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** AdminModals/UserManagementView
- **UI verificabile:** **Sì** — `Admin → Utenti`
- **Cosa dovrei vedere:** refresh dopo edit
- **Cosa succede se lo eliminiamo:** verificare se update utenti si riflette comunque
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — era ancora aperto dopo la bonifica −102 del 2026-08-24; ora assente da Biome (fix successivi al batch 🟢)

### UNUSED-074 — `onBack`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/city/CityDetailContent.tsx`
- **Percorso completo:** `src/components/city/CityDetailContent.tsx`
- **Riga:** 153
- **Nome:** `onBack`
- **Tipo:** parametro
- **Cosa fa:** `onBack` / `onRemoveFromItinerary` su CityDetailContent.
- **Perché è unused:** Ancora nel contratto props; body non li usa (chrome altrove?).
- **Classificazione:** 🔴 ROTTO / SGANCIATO
- **Evidenza:** Parent può ancora passarli; UI back/remove non in questo componente.
- **UI verificabile:** **Sì** — `Home → apri città (CityDetail)`
- **Cosa dovrei vedere:** back e rimuovi da itinerario (header/sidebar?)
- **Cosa succede se lo eliminiamo:** rischiamo di perdere wiring se parent dipendeva da questi
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-075 — `onRemoveFromItinerary`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/city/CityDetailContent.tsx`
- **Percorso completo:** `src/components/city/CityDetailContent.tsx`
- **Riga:** 156
- **Nome:** `onRemoveFromItinerary`
- **Tipo:** parametro
- **Cosa fa:** `onBack` / `onRemoveFromItinerary` su CityDetailContent.
- **Perché è unused:** Ancora nel contratto props; body non li usa (chrome altrove?).
- **Classificazione:** 🔴 ROTTO / SGANCIATO
- **Evidenza:** Parent può ancora passarli; UI back/remove non in questo componente.
- **UI verificabile:** **Sì** — `Home → apri città (CityDetail)`
- **Cosa dovrei vedere:** back e rimuovi da itinerario (header/sidebar?)
- **Cosa succede se lo eliminiamo:** rischiamo di perdere wiring se parent dipendeva da questi
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-076 — `onOpenSurroundings`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/city/CityHeader.tsx`
- **Percorso completo:** `src/components/city/CityHeader.tsx`
- **Riga:** 46
- **Nome:** `onOpenSurroundings`
- **Tipo:** parametro
- **Cosa fa:** Surroundings/GPS props su CityHeader.
- **Perché è unused:** Parent CityDetailContent ancora li passa; header non li consuma.
- **Classificazione:** 🔴 ROTTO / SGANCIATO
- **Evidenza:** `onOpenSurroundings`, `onToggleLocation`, `isLocationActive` sganciati dall’header.
- **UI verificabile:** **Sì** — `Home → città → header città`
- **Cosa dovrei vedere:** pulsanti dintorni / GPS location
- **Cosa succede se lo eliminiamo:** rischiamo di perdere CTA header se erano previsti lì
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-077 — `onToggleLocation`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/city/CityHeader.tsx`
- **Percorso completo:** `src/components/city/CityHeader.tsx`
- **Riga:** 51
- **Nome:** `onToggleLocation`
- **Tipo:** parametro
- **Cosa fa:** Surroundings/GPS props su CityHeader.
- **Perché è unused:** Parent CityDetailContent ancora li passa; header non li consuma.
- **Classificazione:** 🔴 ROTTO / SGANCIATO
- **Evidenza:** `onOpenSurroundings`, `onToggleLocation`, `isLocationActive` sganciati dall’header.
- **UI verificabile:** **Sì** — `Home → città → header città`
- **Cosa dovrei vedere:** pulsanti dintorni / GPS location
- **Cosa succede se lo eliminiamo:** rischiamo di perdere CTA header se erano previsti lì
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-078 — `isLocationActive`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/city/CityHeader.tsx`
- **Percorso completo:** `src/components/city/CityHeader.tsx`
- **Riga:** 52
- **Nome:** `isLocationActive`
- **Tipo:** parametro
- **Cosa fa:** Surroundings/GPS props su CityHeader.
- **Perché è unused:** Parent CityDetailContent ancora li passa; header non li consuma.
- **Classificazione:** 🔴 ROTTO / SGANCIATO
- **Evidenza:** `onOpenSurroundings`, `onToggleLocation`, `isLocationActive` sganciati dall’header.
- **UI verificabile:** **Sì** — `Home → città → header città`
- **Cosa dovrei vedere:** pulsanti dintorni / GPS location
- **Cosa succede se lo eliminiamo:** rischiamo di perdere CTA header se erano previsti lì
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-079 — `idx`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/city/CityHeader.tsx`
- **Percorso completo:** `src/components/city/CityHeader.tsx`
- **Riga:** 431
- **Nome:** `idx`
- **Tipo:** parametro map
- **Cosa fa:** `idx` in map CityHeader
- **Perché è unused:** indice non usato
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** map
- **UI verificabile:** **Sì** — `Home → città → header`
- **Cosa dovrei vedere:** chip/badge
- **Cosa succede se lo eliminiamo:** nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-080 — `onToggleLocation`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/city/tabs/CityCategoryTab.tsx`
- **Percorso completo:** `src/components/city/tabs/CityCategoryTab.tsx`
- **Riga:** 138
- **Riga storica audit 2026-08-24:** 119
- **Nome:** `onToggleLocation`
- **Tipo:** parametro
- **Cosa fa:** `onToggleLocation` in CityCategoryTab.
- **Perché è unused:** Prop GPS non usata nel tab categorie.
- **Classificazione:** 🔴 ROTTO / SGANCIATO
- **Evidenza:** stesso tema location sganciata
- **UI verificabile:** **Sì** — `Home → città → tab categoria POI`
- **Cosa dovrei vedere:** toggle location nel tab
- **Cosa succede se lo eliminiamo:** CTA GPS potenzialmente mancante
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-081 — `getSortLabel`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/city/tabs/CityCategoryTab.tsx`
- **Percorso completo:** `src/components/city/tabs/CityCategoryTab.tsx`
- **Riga:** 400
- **Nome:** `getSortLabel`
- **Tipo:** funzione locale
- **Cosa fa:** `getSortLabel` helper.
- **Perché è unused:** Definita, UI sort non la chiama (label hardcode?).
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** CityCategoryTab
- **UI verificabile:** **Sì** — `Home → città → categoria → sort`
- **Cosa dovrei vedere:** etichette ordinamento
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-082 — `city`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/city/tabs/CityShowcaseTab.tsx`
- **Percorso completo:** `src/components/city/tabs/CityShowcaseTab.tsx`
- **Riga:** 78
- **Nome:** `city`
- **Tipo:** parametro
- **Cosa fa:** `city` / `onOpenSuggestion` in CityShowcaseTab.
- **Perché è unused:** Props non usate nel tab vetrina.
- **Classificazione:** 🔴 ROTTO / SGANCIATO
- **Evidenza:** suggerimenti/vetrina potenzialmente incompleti
- **UI verificabile:** **Sì** — `Home → città → tab Showcase/Vetrina`
- **Cosa dovrei vedere:** contenuto vetrina e CTA suggerimento
- **Cosa succede se lo eliminiamo:** feature vetrina potenzialmente sganciata
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-083 — `onOpenSuggestion`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/city/tabs/CityShowcaseTab.tsx`
- **Percorso completo:** `src/components/city/tabs/CityShowcaseTab.tsx`
- **Riga:** 84
- **Nome:** `onOpenSuggestion`
- **Tipo:** parametro
- **Cosa fa:** `city` / `onOpenSuggestion` in CityShowcaseTab.
- **Perché è unused:** Props non usate nel tab vetrina.
- **Classificazione:** 🔴 ROTTO / SGANCIATO
- **Evidenza:** suggerimenti/vetrina potenzialmente incompleti
- **UI verificabile:** **Sì** — `Home → città → tab Showcase/Vetrina`
- **Cosa dovrei vedere:** contenuto vetrina e CTA suggerimento
- **Cosa succede se lo eliminiamo:** feature vetrina potenzialmente sganciata
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-084 — `endDate`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/city/WeatherWidget.tsx`
- **Percorso completo:** `src/components/city/WeatherWidget.tsx`
- **Riga:** 10
- **Nome:** `endDate`
- **Tipo:** parametro
- **Cosa fa:** `endDate` in WeatherWidget.
- **Perché è unused:** API meteo potrebbe usare solo start; endDate ignorato.
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** WeatherWidget props
- **UI verificabile:** **Sì** — `Home → città → widget meteo (se presente)`
- **Cosa dovrei vedere:** range date meteo
- **Cosa succede se lo eliminiamo:** non determinabile
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Bassa
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-085 — `day`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/DiaryDay.tsx`
- **Percorso completo:** `src/components/features/diary/DiaryDay.tsx`
- **Riga:** 61
- **Nome:** `day`
- **Tipo:** parametro
- **Cosa fa:** `day` / `onAddNote` in DiaryDay.
- **Perché è unused:** Cell giorno riceve day e callback note non usati nel body.
- **Classificazione:** 🔴 ROTTO / SGANCIATO
- **Evidenza:** note flow potrebbe essere in altro componente
- **UI verificabile:** **Sì** — `MySpace / Diario → apri viaggio → giorno diario`
- **Cosa dovrei vedere:** aggiungi nota sul giorno
- **Cosa succede se lo eliminiamo:** rischio perdita add-note se previsto qui
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-086 — `onAddNote`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/DiaryDay.tsx`
- **Percorso completo:** `src/components/features/diary/DiaryDay.tsx`
- **Riga:** 74
- **Nome:** `onAddNote`
- **Tipo:** parametro
- **Cosa fa:** `day` / `onAddNote` in DiaryDay.
- **Perché è unused:** Cell giorno riceve day e callback note non usati nel body.
- **Classificazione:** 🔴 ROTTO / SGANCIATO
- **Evidenza:** note flow potrebbe essere in altro componente
- **UI verificabile:** **Sì** — `MySpace / Diario → apri viaggio → giorno diario`
- **Cosa dovrei vedere:** aggiungi nota sul giorno
- **Cosa succede se lo eliminiamo:** rischio perdita add-note se previsto qui
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-087 — `isMobile`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/DiaryMemoCard.tsx`
- **Percorso completo:** `src/components/features/diary/DiaryMemoCard.tsx`
- **Riga:** 29
- **Nome:** `isMobile`
- **Tipo:** parametro
- **Cosa fa:** `isMobile` in DiaryMemoCard.
- **Perché è unused:** Prop layout non usata.
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** responsive gestito altrove
- **UI verificabile:** **Sì** — `Diario → memo card`
- **Cosa dovrei vedere:** layout memo
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-088 — `endMinDateStr`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/header/DiaryHeaderDateRange.tsx`
- **Percorso completo:** `src/components/features/diary/header/DiaryHeaderDateRange.tsx`
- **Riga:** 45
- **Nome:** `endMinDateStr`
- **Tipo:** variabile
- **Cosa fa:** `endMinDateStr` per vincolo date range.
- **Perché è unused:** Calcolata, non applicata al date picker end.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** DiaryHeaderDateRange
- **UI verificabile:** **Sì** — `Diario → header → range date`
- **Cosa dovrei vedere:** min date su data fine
- **Cosa succede se lo eliminiamo:** validazione date incompleta
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-089 — `deleteTargetTitle`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/notes/DiaryNotesPanel.tsx`
- **Percorso completo:** `src/components/features/diary/notes/DiaryNotesPanel.tsx`
- **Riga:** 44
- **Nome:** `deleteTargetTitle`
- **Tipo:** variabile
- **Cosa fa:** `deleteTargetTitle` per confirm delete note.
- **Perché è unused:** Preparato, non mostrato nel dialog.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** DiaryNotesPanel
- **UI verificabile:** **Sì** — `Diario → pannello note → elimina`
- **Cosa dovrei vedere:** titolo target in confirm
- **Cosa succede se lo eliminiamo:** UX confirm povera
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-090 — `onLinkBuildSearch`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/suitcase/AffiliateSuggestionBox.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/suitcase/AffiliateSuggestionBox.tsx`
- **Riga:** 37
- **Nome:** `onLinkBuildSearch`
- **Tipo:** parametro
- **Cosa fa:** `onLinkBuildSearch` in AffiliateSuggestionBox.
- **Perché è unused:** Fallback search usa `buildAffiliateLink` locale, non la prop.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** commento search fallback; `onLinkBuild` ancora usato per URL
- **UI verificabile:** **Sì** — `Diario → Valigia → editor → suggerimenti affiliate`
- **Cosa dovrei vedere:** link build search
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto; o RIPARARE fallback
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — prop `onLinkBuildSearch` rimossa da AffiliateSuggestionBox; search affiliate via `buildAffiliateLink` (contratto partner). Consumer Dashboard non la passa più; Editor/ItemRow/CategorySuggestionPanel la mantengono dove ancora usata

### UNUSED-091 — `loading`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/packing_list/suitcase/AffiliateSuggestionBox.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/suitcase/AffiliateSuggestionBox.tsx`
- **Riga:** 42
- **Nome:** `loading`
- **Tipo:** variabile
- **Cosa fa:** `loading` da usePartnerIntegrations.
- **Perché è unused:** Nessuno spinner UI.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** AffiliateSuggestionBox
- **UI verificabile:** **Sì** — `Diario → Valigia → affiliate box`
- **Cosa dovrei vedere:** loading partner
- **Cosa succede se lo eliminiamo:** UX loading
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — `loading` sostituito da `partnersLoading` + prop `isLoadingAffiliateTriggers` (stato loading UI reale)

### UNUSED-092 — `categoryMap`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/suitcase/CategorySuggestionPanel.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/suitcase/CategorySuggestionPanel.tsx`
- **Riga:** 37
- **Nome:** `categoryMap`
- **Tipo:** parametro
- **Cosa fa:** `categoryMap` / `placeholders` in CategorySuggestionPanel.
- **Perché è unused:** Passati; panel usa itemMap/overrides/globalMap; AffiliateSuggestionBox invece usa categoryMap/placeholders.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** parity incompleta sidebar vs box
- **UI verificabile:** **Sì** — `Diario → Valigia → editor → pannello suggerimenti categoria`
- **Cosa dovrei vedere:** suggerimenti e-commerce per categoria
- **Cosa succede se lo eliminiamo:** parity affiliate incompleta
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-093 — `placeholders`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/suitcase/CategorySuggestionPanel.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/suitcase/CategorySuggestionPanel.tsx`
- **Riga:** 40
- **Nome:** `placeholders`
- **Tipo:** parametro
- **Cosa fa:** `categoryMap` / `placeholders` in CategorySuggestionPanel.
- **Perché è unused:** Passati; panel usa itemMap/overrides/globalMap; AffiliateSuggestionBox invece usa categoryMap/placeholders.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** parity incompleta sidebar vs box
- **UI verificabile:** **Sì** — `Diario → Valigia → editor → pannello suggerimenti categoria`
- **Cosa dovrei vedere:** suggerimenti e-commerce per categoria
- **Cosa succede se lo eliminiamo:** parity affiliate incompleta
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-094 — `onSaveTitle`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/suitcase/SuitcaseDashboard.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/suitcase/SuitcaseDashboard.tsx`
- **Riga:** 300
- **Nome:** `onSaveTitle`
- **Tipo:** parametro
- **Cosa fa:** Props Dashboard (save title/template, flags link) non inoltrate alla lista.
- **Perché è unused:** Title/save-as vivono in Header; link usa onRequestAssociate; flags sostituiti da savedSuitcases/tripSuitcases.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** Body ancora passa alcune props; Dashboard non le usa. `onLinkSuitcase`: verificare vs onRequestAssociate.
- **UI verificabile:** **Sì** — `Diario → apri Valigia/SuitcaseFloatingPanel → dashboard lista`
- **Cosa dovrei vedere:** salva titolo/template/collega valigia
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto; ANALIZZARE onLinkSuitcase prima di delete massivo
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-095 — `onSaveAsTemplate`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/suitcase/SuitcaseDashboard.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/suitcase/SuitcaseDashboard.tsx`
- **Riga:** 307
- **Nome:** `onSaveAsTemplate`
- **Tipo:** parametro
- **Cosa fa:** Props Dashboard (save title/template, flags link) non inoltrate alla lista.
- **Perché è unused:** Title/save-as vivono in Header; link usa onRequestAssociate; flags sostituiti da savedSuitcases/tripSuitcases.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** Body ancora passa alcune props; Dashboard non le usa. `onLinkSuitcase`: verificare vs onRequestAssociate.
- **UI verificabile:** **Sì** — `Diario → apri Valigia/SuitcaseFloatingPanel → dashboard lista`
- **Cosa dovrei vedere:** salva titolo/template/collega valigia
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto; ANALIZZARE onLinkSuitcase prima di delete massivo
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-096 — `hasSavedSuitcases`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/suitcase/SuitcaseDashboard.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/suitcase/SuitcaseDashboard.tsx`
- **Riga:** 319
- **Nome:** `hasSavedSuitcases`
- **Tipo:** parametro
- **Cosa fa:** Props Dashboard (save title/template, flags link) non inoltrate alla lista.
- **Perché è unused:** Title/save-as vivono in Header; link usa onRequestAssociate; flags sostituiti da savedSuitcases/tripSuitcases.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** Body ancora passa alcune props; Dashboard non le usa. `onLinkSuitcase`: verificare vs onRequestAssociate.
- **UI verificabile:** **Sì** — `Diario → apri Valigia/SuitcaseFloatingPanel → dashboard lista`
- **Cosa dovrei vedere:** salva titolo/template/collega valigia
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto; ANALIZZARE onLinkSuitcase prima di delete massivo
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-097 — `hasSuitcaseLinkedToDiary`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/suitcase/SuitcaseDashboard.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/suitcase/SuitcaseDashboard.tsx`
- **Riga:** 320
- **Nome:** `hasSuitcaseLinkedToDiary`
- **Tipo:** parametro
- **Cosa fa:** Props Dashboard (save title/template, flags link) non inoltrate alla lista.
- **Perché è unused:** Title/save-as vivono in Header; link usa onRequestAssociate; flags sostituiti da savedSuitcases/tripSuitcases.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** Body ancora passa alcune props; Dashboard non le usa. `onLinkSuitcase`: verificare vs onRequestAssociate.
- **UI verificabile:** **Sì** — `Diario → apri Valigia/SuitcaseFloatingPanel → dashboard lista`
- **Cosa dovrei vedere:** salva titolo/template/collega valigia
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto; ANALIZZARE onLinkSuitcase prima di delete massivo
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-098 — `onLinkSuitcase`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/suitcase/SuitcaseDashboard.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/suitcase/SuitcaseDashboard.tsx`
- **Riga:** 323
- **Nome:** `onLinkSuitcase`
- **Tipo:** parametro
- **Cosa fa:** Props Dashboard (save title/template, flags link) non inoltrate alla lista.
- **Perché è unused:** Title/save-as vivono in Header; link usa onRequestAssociate; flags sostituiti da savedSuitcases/tripSuitcases.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** Body ancora passa alcune props; Dashboard non le usa. `onLinkSuitcase`: verificare vs onRequestAssociate.
- **UI verificabile:** **Sì** — `Diario → apri Valigia/SuitcaseFloatingPanel → dashboard lista`
- **Cosa dovrei vedere:** salva titolo/template/collega valigia
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto; ANALIZZARE onLinkSuitcase prima di delete massivo
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-099 — `onUpdateSuitcaseLocal`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/suitcase/SuitcaseEditorView.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/suitcase/SuitcaseEditorView.tsx`
- **Riga:** 134
- **Nome:** `onUpdateSuitcaseLocal`
- **Tipo:** parametro
- **Cosa fa:** `onUpdateSuitcaseLocal` in SuitcaseEditorView.
- **Perché è unused:** Editor usa `onUpdateSuitcase`; local update altrove.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** Body passa prop; Editor non legge
- **UI verificabile:** **Sì** — `Diario → Valigia → editor`
- **Cosa dovrei vedere:** update categorie
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-100 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/packing_list/suitcase/tabs/OverrideTab.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/suitcase/tabs/OverrideTab.tsx`
- **Riga:** 55
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **Sì** — `Diario → Valigia → Override tab`
- **Cosa dovrei vedere:** tab override affiliate
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-101 — `onDeleteSuitcase`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/suitcase/TripSuitcaseSection.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/suitcase/TripSuitcaseSection.tsx`
- **Riga:** 31
- **Nome:** `onDeleteSuitcase`
- **Tipo:** parametro
- **Cosa fa:** `onDeleteSuitcase` in TripSuitcaseSection.
- **Perché è unused:** Card usano unlink; delete e unlink puntano a onUnlinkSuitcase.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** removeAction=unlink by design
- **UI verificabile:** **Sì** — `Diario → Valigia → tab viaggio`
- **Cosa dovrei vedere:** unlink valigia (non hard delete)
- **Cosa succede se lo eliminiamo:** nessun impatto (by design)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-102 — `updateItem`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts`
- **Riga:** 38
- **Nome:** `updateItem`
- **Tipo:** parametro
- **Cosa fa:** DI surface di `useFloatingPanelUndoIntegration` — hook shell che ritorna solo `stack`.
- **Perché è unused:** Body: `return stack;`; undo reale in `useSuitcaseUndo`.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** File intero è no-op wrapper; call chain composition → handlers → stub.
- **UI verificabile:** **Sì** — `Diario → Valigia → header Undo/Redo`
- **Cosa dovrei vedere:** Undo/Redo funzionanti via useSuitcaseUndo (non via questo hook)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale se si collassa la catena stub; non rimuovere useSuitcaseUndo
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-103 — `addItem`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts`
- **Riga:** 39
- **Nome:** `addItem`
- **Tipo:** parametro
- **Cosa fa:** DI surface di `useFloatingPanelUndoIntegration` — hook shell che ritorna solo `stack`.
- **Perché è unused:** Body: `return stack;`; undo reale in `useSuitcaseUndo`.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** File intero è no-op wrapper; call chain composition → handlers → stub.
- **UI verificabile:** **Sì** — `Diario → Valigia → header Undo/Redo`
- **Cosa dovrei vedere:** Undo/Redo funzionanti via useSuitcaseUndo (non via questo hook)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale se si collassa la catena stub; non rimuovere useSuitcaseUndo
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-104 — `deleteItem`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts`
- **Riga:** 40
- **Nome:** `deleteItem`
- **Tipo:** parametro
- **Cosa fa:** DI surface di `useFloatingPanelUndoIntegration` — hook shell che ritorna solo `stack`.
- **Perché è unused:** Body: `return stack;`; undo reale in `useSuitcaseUndo`.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** File intero è no-op wrapper; call chain composition → handlers → stub.
- **UI verificabile:** **Sì** — `Diario → Valigia → header Undo/Redo`
- **Cosa dovrei vedere:** Undo/Redo funzionanti via useSuitcaseUndo (non via questo hook)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale se si collassa la catena stub; non rimuovere useSuitcaseUndo
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-105 — `fetchUserSuitcases`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts`
- **Riga:** 41
- **Nome:** `fetchUserSuitcases`
- **Tipo:** parametro
- **Cosa fa:** DI surface di `useFloatingPanelUndoIntegration` — hook shell che ritorna solo `stack`.
- **Perché è unused:** Body: `return stack;`; undo reale in `useSuitcaseUndo`.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** File intero è no-op wrapper; call chain composition → handlers → stub.
- **UI verificabile:** **Sì** — `Diario → Valigia → header Undo/Redo`
- **Cosa dovrei vedere:** Undo/Redo funzionanti via useSuitcaseUndo (non via questo hook)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale se si collassa la catena stub; non rimuovere useSuitcaseUndo
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-106 — `setHighlightItemId`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts`
- **Riga:** 42
- **Nome:** `setHighlightItemId`
- **Tipo:** parametro
- **Cosa fa:** DI surface di `useFloatingPanelUndoIntegration` — hook shell che ritorna solo `stack`.
- **Perché è unused:** Body: `return stack;`; undo reale in `useSuitcaseUndo`.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** File intero è no-op wrapper; call chain composition → handlers → stub.
- **UI verificabile:** **Sì** — `Diario → Valigia → header Undo/Redo`
- **Cosa dovrei vedere:** Undo/Redo funzionanti via useSuitcaseUndo (non via questo hook)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale se si collassa la catena stub; non rimuovere useSuitcaseUndo
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-107 — `activeTabId`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts`
- **Riga:** 43
- **Nome:** `activeTabId`
- **Tipo:** parametro
- **Cosa fa:** DI surface di `useFloatingPanelUndoIntegration` — hook shell che ritorna solo `stack`.
- **Perché è unused:** Body: `return stack;`; undo reale in `useSuitcaseUndo`.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** File intero è no-op wrapper; call chain composition → handlers → stub.
- **UI verificabile:** **Sì** — `Diario → Valigia → header Undo/Redo`
- **Cosa dovrei vedere:** Undo/Redo funzionanti via useSuitcaseUndo (non via questo hook)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale se si collassa la catena stub; non rimuovere useSuitcaseUndo
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-108 — `showToast`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts`
- **Riga:** 44
- **Nome:** `showToast`
- **Tipo:** parametro
- **Cosa fa:** DI surface di `useFloatingPanelUndoIntegration` — hook shell che ritorna solo `stack`.
- **Perché è unused:** Body: `return stack;`; undo reale in `useSuitcaseUndo`.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** File intero è no-op wrapper; call chain composition → handlers → stub.
- **UI verificabile:** **Sì** — `Diario → Valigia → header Undo/Redo`
- **Cosa dovrei vedere:** Undo/Redo funzionanti via useSuitcaseUndo (non via questo hook)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale se si collassa la catena stub; non rimuovere useSuitcaseUndo
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-109 — `handleStateSync`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts`
- **Riga:** 45
- **Nome:** `handleStateSync`
- **Tipo:** parametro
- **Cosa fa:** DI surface di `useFloatingPanelUndoIntegration` — hook shell che ritorna solo `stack`.
- **Perché è unused:** Body: `return stack;`; undo reale in `useSuitcaseUndo`.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** File intero è no-op wrapper; call chain composition → handlers → stub.
- **UI verificabile:** **Sì** — `Diario → Valigia → header Undo/Redo`
- **Cosa dovrei vedere:** Undo/Redo funzionanti via useSuitcaseUndo (non via questo hook)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale se si collassa la catena stub; non rimuovere useSuitcaseUndo
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-110 — `checkDuplicateItem`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts`
- **Riga:** 46
- **Nome:** `checkDuplicateItem`
- **Tipo:** parametro
- **Cosa fa:** DI surface di `useFloatingPanelUndoIntegration` — hook shell che ritorna solo `stack`.
- **Perché è unused:** Body: `return stack;`; undo reale in `useSuitcaseUndo`.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** File intero è no-op wrapper; call chain composition → handlers → stub.
- **UI verificabile:** **Sì** — `Diario → Valigia → header Undo/Redo`
- **Cosa dovrei vedere:** Undo/Redo funzionanti via useSuitcaseUndo (non via questo hook)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale se si collassa la catena stub; non rimuovere useSuitcaseUndo
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-111 — `handleDeleteItemConfirmed`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseEditorLogic.ts`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseEditorLogic.ts`
- **Riga:** 42
- **Nome:** `handleDeleteItemConfirmed`
- **Tipo:** parametro
- **Cosa fa:** `handleDeleteItemConfirmed` in useSuitcaseEditorLogic props.
- **Perché è unused:** Confirm delete passa da SuitcaseModals → itemActions.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** onDeleteItem apre modal only
- **UI verificabile:** **Sì** — `Diario → Valigia → editor → elimina item`
- **Cosa dovrei vedere:** confirm delete
- **Cosa succede se lo eliminiamo:** nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-112 — `name`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseItemActions.ts`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseItemActions.ts`
- **Riga:** 721
- **Nome:** `name`
- **Tipo:** parametro
- **Cosa fa:** `name` in `handleRemoveFromBlacklist`.
- **Perché è unused:** Body usa solo `rejectionId`.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** firma API ridondante
- **UI verificabile:** **Sì** — `Diario → Valigia → blacklist`
- **Cosa dovrei vedere:** rimozione blacklist
- **Cosa succede se lo eliminiamo:** nessun impatto aggiornando caller
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-113 — `activeTabId`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseLifecycle.ts`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseLifecycle.ts`
- **Riga:** 21
- **Nome:** `activeTabId`
- **Tipo:** parametro
- **Cosa fa:** Parametri tab/view di `useSuitcaseLifecycle` dopo delega a `useSuitcasePanelData`.
- **Perché è unused:** Commento/delega: solo itineraryId/user per linked IDs.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** activeTabId/viewMode/sourceTab setters accettati non usati
- **UI verificabile:** **Sì** — `Diario → Valigia`
- **Cosa dovrei vedere:** lifecycle panel / tab
- **Cosa succede se lo eliminiamo:** nessun impatto se si snellisce API hook
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-114 — `setActiveTabId`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseLifecycle.ts`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseLifecycle.ts`
- **Riga:** 22
- **Nome:** `setActiveTabId`
- **Tipo:** parametro
- **Cosa fa:** Parametri tab/view di `useSuitcaseLifecycle` dopo delega a `useSuitcasePanelData`.
- **Perché è unused:** Commento/delega: solo itineraryId/user per linked IDs.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** activeTabId/viewMode/sourceTab setters accettati non usati
- **UI verificabile:** **Sì** — `Diario → Valigia`
- **Cosa dovrei vedere:** lifecycle panel / tab
- **Cosa succede se lo eliminiamo:** nessun impatto se si snellisce API hook
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-115 — `viewMode`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseLifecycle.ts`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseLifecycle.ts`
- **Riga:** 23
- **Nome:** `viewMode`
- **Tipo:** parametro
- **Cosa fa:** Parametri tab/view di `useSuitcaseLifecycle` dopo delega a `useSuitcasePanelData`.
- **Perché è unused:** Commento/delega: solo itineraryId/user per linked IDs.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** activeTabId/viewMode/sourceTab setters accettati non usati
- **UI verificabile:** **Sì** — `Diario → Valigia`
- **Cosa dovrei vedere:** lifecycle panel / tab
- **Cosa succede se lo eliminiamo:** nessun impatto se si snellisce API hook
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-116 — `setViewMode`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseLifecycle.ts`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseLifecycle.ts`
- **Riga:** 24
- **Nome:** `setViewMode`
- **Tipo:** parametro
- **Cosa fa:** Parametri tab/view di `useSuitcaseLifecycle` dopo delega a `useSuitcasePanelData`.
- **Perché è unused:** Commento/delega: solo itineraryId/user per linked IDs.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** activeTabId/viewMode/sourceTab setters accettati non usati
- **UI verificabile:** **Sì** — `Diario → Valigia`
- **Cosa dovrei vedere:** lifecycle panel / tab
- **Cosa succede se lo eliminiamo:** nessun impatto se si snellisce API hook
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-117 — `sourceTab`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseLifecycle.ts`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseLifecycle.ts`
- **Riga:** 25
- **Nome:** `sourceTab`
- **Tipo:** parametro
- **Cosa fa:** Parametri tab/view di `useSuitcaseLifecycle` dopo delega a `useSuitcasePanelData`.
- **Perché è unused:** Commento/delega: solo itineraryId/user per linked IDs.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** activeTabId/viewMode/sourceTab setters accettati non usati
- **UI verificabile:** **Sì** — `Diario → Valigia`
- **Cosa dovrei vedere:** lifecycle panel / tab
- **Cosa succede se lo eliminiamo:** nessun impatto se si snellisce API hook
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-118 — `setSourceTab`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseLifecycle.ts`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseLifecycle.ts`
- **Riga:** 26
- **Nome:** `setSourceTab`
- **Tipo:** parametro
- **Cosa fa:** Parametri tab/view di `useSuitcaseLifecycle` dopo delega a `useSuitcasePanelData`.
- **Perché è unused:** Commento/delega: solo itineraryId/user per linked IDs.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** activeTabId/viewMode/sourceTab setters accettati non usati
- **UI verificabile:** **Sì** — `Diario → Valigia`
- **Cosa dovrei vedere:** lifecycle panel / tab
- **Cosa succede se lo eliminiamo:** nessun impatto se si snellisce API hook
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-119 — `setSelectedItemName`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseLifecycle.ts`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseLifecycle.ts`
- **Riga:** 27
- **Nome:** `setSelectedItemName`
- **Tipo:** parametro
- **Cosa fa:** Parametri tab/view di `useSuitcaseLifecycle` dopo delega a `useSuitcasePanelData`.
- **Perché è unused:** Commento/delega: solo itineraryId/user per linked IDs.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** activeTabId/viewMode/sourceTab setters accettati non usati
- **UI verificabile:** **Sì** — `Diario → Valigia`
- **Cosa dovrei vedere:** lifecycle panel / tab
- **Cosa succede se lo eliminiamo:** nessun impatto se si snellisce API hook
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-120 — `setIsLoadingAi`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseSuggestions.ts`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseSuggestions.ts`
- **Riga:** 198
- **Nome:** `setIsLoadingAi`
- **Tipo:** setter
- **Cosa fa:** `setIsLoadingAi` in useSuitcaseSuggestions.
- **Perché è unused:** `isLoadingAi` esportato; setter mai chiamato.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** loading AI suggestions incompleto
- **UI verificabile:** **Sì** — `Diario → Valigia → suggerimenti AI`
- **Cosa dovrei vedere:** spinner AI
- **Cosa succede se lo eliminiamo:** UX loading AI
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-121 — `actions`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Riga:** 42
- **Nome:** `actions`
- **Tipo:** destructuring
- **Cosa fa:** Destructuring `composition` nell’outer `SuitcaseFloatingPanelBody`.
- **Perché è unused:** Dopo split Body/BodyContent, outer passa `composition` intero a Content che ridestruttura e USA i campi. Outer usa solo data/showLoadingShell/suitcaseDocumentSave.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** L39–66 unused; L140–169 Content usa actions/itemActions/undo/modals/AI handlers.
- **UI verificabile:** **Sì** — `Diario → Valigia (SuitcaseFloatingPanel) → dashboard/editor`
- **Cosa dovrei vedere:** modals, undo, affiliate, AI accept — funzionanti via BodyContent
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo cleanup destructuring outer)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-122 — `itemActions`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Riga:** 43
- **Nome:** `itemActions`
- **Tipo:** destructuring
- **Cosa fa:** Destructuring `composition` nell’outer `SuitcaseFloatingPanelBody`.
- **Perché è unused:** Dopo split Body/BodyContent, outer passa `composition` intero a Content che ridestruttura e USA i campi. Outer usa solo data/showLoadingShell/suitcaseDocumentSave.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** L39–66 unused; L140–169 Content usa actions/itemActions/undo/modals/AI handlers.
- **UI verificabile:** **Sì** — `Diario → Valigia (SuitcaseFloatingPanel) → dashboard/editor`
- **Cosa dovrei vedere:** modals, undo, affiliate, AI accept — funzionanti via BodyContent
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo cleanup destructuring outer)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-123 — `editorLogic`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Riga:** 44
- **Nome:** `editorLogic`
- **Tipo:** destructuring
- **Cosa fa:** Destructuring `composition` nell’outer `SuitcaseFloatingPanelBody`.
- **Perché è unused:** Dopo split Body/BodyContent, outer passa `composition` intero a Content che ridestruttura e USA i campi. Outer usa solo data/showLoadingShell/suitcaseDocumentSave.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** L39–66 unused; L140–169 Content usa actions/itemActions/undo/modals/AI handlers.
- **UI verificabile:** **Sì** — `Diario → Valigia (SuitcaseFloatingPanel) → dashboard/editor`
- **Cosa dovrei vedere:** modals, undo, affiliate, AI accept — funzionanti via BodyContent
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo cleanup destructuring outer)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-124 — `hiddenCategories`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Riga:** 45
- **Nome:** `hiddenCategories`
- **Tipo:** destructuring
- **Cosa fa:** Destructuring `composition` nell’outer `SuitcaseFloatingPanelBody`.
- **Perché è unused:** Dopo split Body/BodyContent, outer passa `composition` intero a Content che ridestruttura e USA i campi. Outer usa solo data/showLoadingShell/suitcaseDocumentSave.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** L39–66 unused; L140–169 Content usa actions/itemActions/undo/modals/AI handlers.
- **UI verificabile:** **Sì** — `Diario → Valigia (SuitcaseFloatingPanel) → dashboard/editor`
- **Cosa dovrei vedere:** modals, undo, affiliate, AI accept — funzionanti via BodyContent
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo cleanup destructuring outer)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-125 — `handleConfirmAssociation`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Riga:** 47
- **Nome:** `handleConfirmAssociation`
- **Tipo:** destructuring
- **Cosa fa:** Destructuring `composition` nell’outer `SuitcaseFloatingPanelBody`.
- **Perché è unused:** Dopo split Body/BodyContent, outer passa `composition` intero a Content che ridestruttura e USA i campi. Outer usa solo data/showLoadingShell/suitcaseDocumentSave.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** L39–66 unused; L140–169 Content usa actions/itemActions/undo/modals/AI handlers.
- **UI verificabile:** **Sì** — `Diario → Valigia (SuitcaseFloatingPanel) → dashboard/editor`
- **Cosa dovrei vedere:** modals, undo, affiliate, AI accept — funzionanti via BodyContent
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo cleanup destructuring outer)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-126 — `handleSaveOnly`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Riga:** 48
- **Nome:** `handleSaveOnly`
- **Tipo:** destructuring
- **Cosa fa:** Destructuring `composition` nell’outer `SuitcaseFloatingPanelBody`.
- **Perché è unused:** Dopo split Body/BodyContent, outer passa `composition` intero a Content che ridestruttura e USA i campi. Outer usa solo data/showLoadingShell/suitcaseDocumentSave.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** L39–66 unused; L140–169 Content usa actions/itemActions/undo/modals/AI handlers.
- **UI verificabile:** **Sì** — `Diario → Valigia (SuitcaseFloatingPanel) → dashboard/editor`
- **Cosa dovrei vedere:** modals, undo, affiliate, AI accept — funzionanti via BodyContent
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo cleanup destructuring outer)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-127 — `handleLogin`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Riga:** 49
- **Nome:** `handleLogin`
- **Tipo:** destructuring
- **Cosa fa:** Destructuring `composition` nell’outer `SuitcaseFloatingPanelBody`.
- **Perché è unused:** Dopo split Body/BodyContent, outer passa `composition` intero a Content che ridestruttura e USA i campi. Outer usa solo data/showLoadingShell/suitcaseDocumentSave.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** L39–66 unused; L140–169 Content usa actions/itemActions/undo/modals/AI handlers.
- **UI verificabile:** **Sì** — `Diario → Valigia (SuitcaseFloatingPanel) → dashboard/editor`
- **Cosa dovrei vedere:** modals, undo, affiliate, AI accept — funzionanti via BodyContent
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo cleanup destructuring outer)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-128 — `associationFlow`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Riga:** 50
- **Nome:** `associationFlow`
- **Tipo:** destructuring
- **Cosa fa:** Destructuring `composition` nell’outer `SuitcaseFloatingPanelBody`.
- **Perché è unused:** Dopo split Body/BodyContent, outer passa `composition` intero a Content che ridestruttura e USA i campi. Outer usa solo data/showLoadingShell/suitcaseDocumentSave.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** L39–66 unused; L140–169 Content usa actions/itemActions/undo/modals/AI handlers.
- **UI verificabile:** **Sì** — `Diario → Valigia (SuitcaseFloatingPanel) → dashboard/editor`
- **Cosa dovrei vedere:** modals, undo, affiliate, AI accept — funzionanti via BodyContent
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo cleanup destructuring outer)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-129 — `handleLinkBuild`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Riga:** 51
- **Nome:** `handleLinkBuild`
- **Tipo:** destructuring
- **Cosa fa:** Destructuring `composition` nell’outer `SuitcaseFloatingPanelBody`.
- **Perché è unused:** Dopo split Body/BodyContent, outer passa `composition` intero a Content che ridestruttura e USA i campi. Outer usa solo data/showLoadingShell/suitcaseDocumentSave.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** L39–66 unused; L140–169 Content usa actions/itemActions/undo/modals/AI handlers.
- **UI verificabile:** **Sì** — `Diario → Valigia (SuitcaseFloatingPanel) → dashboard/editor`
- **Cosa dovrei vedere:** modals, undo, affiliate, AI accept — funzionanti via BodyContent
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo cleanup destructuring outer)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-130 — `handleLinkBuildSearch`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Riga:** 52
- **Nome:** `handleLinkBuildSearch`
- **Tipo:** destructuring
- **Cosa fa:** Destructuring `composition` nell’outer `SuitcaseFloatingPanelBody`.
- **Perché è unused:** Dopo split Body/BodyContent, outer passa `composition` intero a Content che ridestruttura e USA i campi. Outer usa solo data/showLoadingShell/suitcaseDocumentSave.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** L39–66 unused; L140–169 Content usa actions/itemActions/undo/modals/AI handlers.
- **UI verificabile:** **Sì** — `Diario → Valigia (SuitcaseFloatingPanel) → dashboard/editor`
- **Cosa dovrei vedere:** modals, undo, affiliate, AI accept — funzionanti via BodyContent
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo cleanup destructuring outer)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-131 — `performUndo`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Riga:** 53
- **Nome:** `performUndo`
- **Tipo:** destructuring
- **Cosa fa:** Destructuring `composition` nell’outer `SuitcaseFloatingPanelBody`.
- **Perché è unused:** Dopo split Body/BodyContent, outer passa `composition` intero a Content che ridestruttura e USA i campi. Outer usa solo data/showLoadingShell/suitcaseDocumentSave.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** L39–66 unused; L140–169 Content usa actions/itemActions/undo/modals/AI handlers.
- **UI verificabile:** **Sì** — `Diario → Valigia (SuitcaseFloatingPanel) → dashboard/editor`
- **Cosa dovrei vedere:** modals, undo, affiliate, AI accept — funzionanti via BodyContent
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo cleanup destructuring outer)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-132 — `performRedo`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Riga:** 54
- **Nome:** `performRedo`
- **Tipo:** destructuring
- **Cosa fa:** Destructuring `composition` nell’outer `SuitcaseFloatingPanelBody`.
- **Perché è unused:** Dopo split Body/BodyContent, outer passa `composition` intero a Content che ridestruttura e USA i campi. Outer usa solo data/showLoadingShell/suitcaseDocumentSave.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** L39–66 unused; L140–169 Content usa actions/itemActions/undo/modals/AI handlers.
- **UI verificabile:** **Sì** — `Diario → Valigia (SuitcaseFloatingPanel) → dashboard/editor`
- **Cosa dovrei vedere:** modals, undo, affiliate, AI accept — funzionanti via BodyContent
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo cleanup destructuring outer)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-133 — `canUndo`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Riga:** 55
- **Nome:** `canUndo`
- **Tipo:** destructuring
- **Cosa fa:** Destructuring `composition` nell’outer `SuitcaseFloatingPanelBody`.
- **Perché è unused:** Dopo split Body/BodyContent, outer passa `composition` intero a Content che ridestruttura e USA i campi. Outer usa solo data/showLoadingShell/suitcaseDocumentSave.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** L39–66 unused; L140–169 Content usa actions/itemActions/undo/modals/AI handlers.
- **UI verificabile:** **Sì** — `Diario → Valigia (SuitcaseFloatingPanel) → dashboard/editor`
- **Cosa dovrei vedere:** modals, undo, affiliate, AI accept — funzionanti via BodyContent
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo cleanup destructuring outer)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-134 — `canRedo`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Riga:** 56
- **Nome:** `canRedo`
- **Tipo:** destructuring
- **Cosa fa:** Destructuring `composition` nell’outer `SuitcaseFloatingPanelBody`.
- **Perché è unused:** Dopo split Body/BodyContent, outer passa `composition` intero a Content che ridestruttura e USA i campi. Outer usa solo data/showLoadingShell/suitcaseDocumentSave.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** L39–66 unused; L140–169 Content usa actions/itemActions/undo/modals/AI handlers.
- **UI verificabile:** **Sì** — `Diario → Valigia (SuitcaseFloatingPanel) → dashboard/editor`
- **Cosa dovrei vedere:** modals, undo, affiliate, AI accept — funzionanti via BodyContent
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo cleanup destructuring outer)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-135 — `handleBackToSelector`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Riga:** 57
- **Nome:** `handleBackToSelector`
- **Tipo:** destructuring
- **Cosa fa:** Destructuring `composition` nell’outer `SuitcaseFloatingPanelBody`.
- **Perché è unused:** Dopo split Body/BodyContent, outer passa `composition` intero a Content che ridestruttura e USA i campi. Outer usa solo data/showLoadingShell/suitcaseDocumentSave.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** L39–66 unused; L140–169 Content usa actions/itemActions/undo/modals/AI handlers.
- **UI verificabile:** **Sì** — `Diario → Valigia (SuitcaseFloatingPanel) → dashboard/editor`
- **Cosa dovrei vedere:** modals, undo, affiliate, AI accept — funzionanti via BodyContent
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo cleanup destructuring outer)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-136 — `handleDiscardAndExit`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Riga:** 58
- **Nome:** `handleDiscardAndExit`
- **Tipo:** destructuring
- **Cosa fa:** Destructuring `composition` nell’outer `SuitcaseFloatingPanelBody`.
- **Perché è unused:** Dopo split Body/BodyContent, outer passa `composition` intero a Content che ridestruttura e USA i campi. Outer usa solo data/showLoadingShell/suitcaseDocumentSave.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** L39–66 unused; L140–169 Content usa actions/itemActions/undo/modals/AI handlers.
- **UI verificabile:** **Sì** — `Diario → Valigia (SuitcaseFloatingPanel) → dashboard/editor`
- **Cosa dovrei vedere:** modals, undo, affiliate, AI accept — funzionanti via BodyContent
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo cleanup destructuring outer)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-137 — `handleCancelUnsavedChanges`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Riga:** 59
- **Nome:** `handleCancelUnsavedChanges`
- **Tipo:** destructuring
- **Cosa fa:** Destructuring `composition` nell’outer `SuitcaseFloatingPanelBody`.
- **Perché è unused:** Dopo split Body/BodyContent, outer passa `composition` intero a Content che ridestruttura e USA i campi. Outer usa solo data/showLoadingShell/suitcaseDocumentSave.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** L39–66 unused; L140–169 Content usa actions/itemActions/undo/modals/AI handlers.
- **UI verificabile:** **Sì** — `Diario → Valigia (SuitcaseFloatingPanel) → dashboard/editor`
- **Cosa dovrei vedere:** modals, undo, affiliate, AI accept — funzionanti via BodyContent
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo cleanup destructuring outer)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-138 — `forceClose`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Riga:** 60
- **Nome:** `forceClose`
- **Tipo:** destructuring
- **Cosa fa:** Destructuring `composition` nell’outer `SuitcaseFloatingPanelBody`.
- **Perché è unused:** Dopo split Body/BodyContent, outer passa `composition` intero a Content che ridestruttura e USA i campi. Outer usa solo data/showLoadingShell/suitcaseDocumentSave.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** L39–66 unused; L140–169 Content usa actions/itemActions/undo/modals/AI handlers.
- **UI verificabile:** **Sì** — `Diario → Valigia (SuitcaseFloatingPanel) → dashboard/editor`
- **Cosa dovrei vedere:** modals, undo, affiliate, AI accept — funzionanti via BodyContent
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo cleanup destructuring outer)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-139 — `handleConfirmAssociateSaved`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Riga:** 61
- **Nome:** `handleConfirmAssociateSaved`
- **Tipo:** destructuring
- **Cosa fa:** Destructuring `composition` nell’outer `SuitcaseFloatingPanelBody`.
- **Perché è unused:** Dopo split Body/BodyContent, outer passa `composition` intero a Content che ridestruttura e USA i campi. Outer usa solo data/showLoadingShell/suitcaseDocumentSave.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** L39–66 unused; L140–169 Content usa actions/itemActions/undo/modals/AI handlers.
- **UI verificabile:** **Sì** — `Diario → Valigia (SuitcaseFloatingPanel) → dashboard/editor`
- **Cosa dovrei vedere:** modals, undo, affiliate, AI accept — funzionanti via BodyContent
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo cleanup destructuring outer)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-140 — `handleActivateOptionalCategory`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Riga:** 62
- **Nome:** `handleActivateOptionalCategory`
- **Tipo:** destructuring
- **Cosa fa:** Destructuring `composition` nell’outer `SuitcaseFloatingPanelBody`.
- **Perché è unused:** Dopo split Body/BodyContent, outer passa `composition` intero a Content che ridestruttura e USA i campi. Outer usa solo data/showLoadingShell/suitcaseDocumentSave.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** L39–66 unused; L140–169 Content usa actions/itemActions/undo/modals/AI handlers.
- **UI verificabile:** **Sì** — `Diario → Valigia (SuitcaseFloatingPanel) → dashboard/editor`
- **Cosa dovrei vedere:** modals, undo, affiliate, AI accept — funzionanti via BodyContent
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo cleanup destructuring outer)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-141 — `handleAcceptAiSuggestion`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Riga:** 63
- **Nome:** `handleAcceptAiSuggestion`
- **Tipo:** destructuring
- **Cosa fa:** Destructuring `composition` nell’outer `SuitcaseFloatingPanelBody`.
- **Perché è unused:** Dopo split Body/BodyContent, outer passa `composition` intero a Content che ridestruttura e USA i campi. Outer usa solo data/showLoadingShell/suitcaseDocumentSave.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** L39–66 unused; L140–169 Content usa actions/itemActions/undo/modals/AI handlers.
- **UI verificabile:** **Sì** — `Diario → Valigia (SuitcaseFloatingPanel) → dashboard/editor`
- **Cosa dovrei vedere:** modals, undo, affiliate, AI accept — funzionanti via BodyContent
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo cleanup destructuring outer)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-142 — `handleRejectAiSuggestion`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Percorso completo:** `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- **Riga:** 64
- **Nome:** `handleRejectAiSuggestion`
- **Tipo:** destructuring
- **Cosa fa:** Destructuring `composition` nell’outer `SuitcaseFloatingPanelBody`.
- **Perché è unused:** Dopo split Body/BodyContent, outer passa `composition` intero a Content che ridestruttura e USA i campi. Outer usa solo data/showLoadingShell/suitcaseDocumentSave.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** L39–66 unused; L140–169 Content usa actions/itemActions/undo/modals/AI handlers.
- **UI verificabile:** **Sì** — `Diario → Valigia (SuitcaseFloatingPanel) → dashboard/editor`
- **Cosa dovrei vedere:** modals, undo, affiliate, AI accept — funzionanti via BodyContent
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo cleanup destructuring outer)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-143 — `setContinent`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/home/HeroSection.tsx`
- **Percorso completo:** `src/components/home/HeroSection.tsx`
- **Riga:** 35
- **Nome:** `setContinent`
- **Tipo:** destructuring
- **Cosa fa:** Setter raw da hook filtri Hero.
- **Perché è unused:** UI usa handle*Change/reset*; setter grezzi non referenziati.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** HeroSection
- **UI verificabile:** **Sì** — `Home → Hero (filtri continente/nazione/regione/città/stagione)`
- **Cosa dovrei vedere:** filtri Hero funzionanti via handler
- **Cosa succede se lo eliminiamo:** nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-144 — `setNation`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/home/HeroSection.tsx`
- **Percorso completo:** `src/components/home/HeroSection.tsx`
- **Riga:** 37
- **Nome:** `setNation`
- **Tipo:** destructuring
- **Cosa fa:** Setter raw da hook filtri Hero.
- **Perché è unused:** UI usa handle*Change/reset*; setter grezzi non referenziati.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** HeroSection
- **UI verificabile:** **Sì** — `Home → Hero (filtri continente/nazione/regione/città/stagione)`
- **Cosa dovrei vedere:** filtri Hero funzionanti via handler
- **Cosa succede se lo eliminiamo:** nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-145 — `setRegion`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/home/HeroSection.tsx`
- **Percorso completo:** `src/components/home/HeroSection.tsx`
- **Riga:** 39
- **Nome:** `setRegion`
- **Tipo:** destructuring
- **Cosa fa:** Setter raw da hook filtri Hero.
- **Perché è unused:** UI usa handle*Change/reset*; setter grezzi non referenziati.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** HeroSection
- **UI verificabile:** **Sì** — `Home → Hero (filtri continente/nazione/regione/città/stagione)`
- **Cosa dovrei vedere:** filtri Hero funzionanti via handler
- **Cosa succede se lo eliminiamo:** nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-146 — `setSelectedCity`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/home/HeroSection.tsx`
- **Percorso completo:** `src/components/home/HeroSection.tsx`
- **Riga:** 41
- **Nome:** `setSelectedCity`
- **Tipo:** destructuring
- **Cosa fa:** Setter raw da hook filtri Hero.
- **Perché è unused:** UI usa handle*Change/reset*; setter grezzi non referenziati.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** HeroSection
- **UI verificabile:** **Sì** — `Home → Hero (filtri continente/nazione/regione/città/stagione)`
- **Cosa dovrei vedere:** filtri Hero funzionanti via handler
- **Cosa succede se lo eliminiamo:** nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-147 — `setSelectedSeason`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/home/HeroSection.tsx`
- **Percorso completo:** `src/components/home/HeroSection.tsx`
- **Riga:** 81
- **Nome:** `setSelectedSeason`
- **Tipo:** destructuring
- **Cosa fa:** Setter raw da hook filtri Hero.
- **Perché è unused:** UI usa handle*Change/reset*; setter grezzi non referenziati.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** HeroSection
- **UI verificabile:** **Sì** — `Home → Hero (filtri continente/nazione/regione/città/stagione)`
- **Cosa dovrei vedere:** filtri Hero funzionanti via handler
- **Cosa succede se lo eliminiamo:** nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-148 — `TravelDiary`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/layout/AppRouter.tsx`
- **Percorso completo:** `src/components/layout/AppRouter.tsx`
- **Riga:** 28
- **Nome:** `TravelDiary`
- **Tipo:** import lazy
- **Cosa fa:** Lazy import `TravelDiary` in AppRouter.
- **Perché è unused:** Mai montato in Routes; diario vive in Sidebar/ShopPage/focus.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** `const TravelDiary = React.lazy...` mai `<TravelDiary/>`
- **UI verificabile:** **Sì** — `Home → apri Diario (sidebar/focus) — NON via AppRouter route`
- **Cosa dovrei vedere:** TravelDiary montato altrove
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-149 — `userLocation`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/layout/AppRouter.tsx`
- **Percorso completo:** `src/components/layout/AppRouter.tsx`
- **Riga:** 52
- **Nome:** `userLocation`
- **Tipo:** destructuring
- **Cosa fa:** `userLocation`, `handleMainScroll`, `handleAroundMeTrigger`, `handleSmartDrop` in MainContent.
- **Perché è unused:** Presi da context ma non usati in questo file (gestiti altrove / passati selettivamente).
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** AppRouter MainContent
- **UI verificabile:** **Sì** — `Home / navigazione / Around me / drop diario`
- **Cosa dovrei vedere:** funzionalità ancora presenti fuori AppRouter
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto (cleanup destructuring)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-150 — `handleMainScroll`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/layout/AppRouter.tsx`
- **Percorso completo:** `src/components/layout/AppRouter.tsx`
- **Riga:** 53
- **Nome:** `handleMainScroll`
- **Tipo:** destructuring
- **Cosa fa:** `userLocation`, `handleMainScroll`, `handleAroundMeTrigger`, `handleSmartDrop` in MainContent.
- **Perché è unused:** Presi da context ma non usati in questo file (gestiti altrove / passati selettivamente).
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** AppRouter MainContent
- **UI verificabile:** **Sì** — `Home / navigazione / Around me / drop diario`
- **Cosa dovrei vedere:** funzionalità ancora presenti fuori AppRouter
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto (cleanup destructuring)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-151 — `handleAroundMeTrigger`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/layout/AppRouter.tsx`
- **Percorso completo:** `src/components/layout/AppRouter.tsx`
- **Riga:** 69
- **Nome:** `handleAroundMeTrigger`
- **Tipo:** destructuring
- **Cosa fa:** `userLocation`, `handleMainScroll`, `handleAroundMeTrigger`, `handleSmartDrop` in MainContent.
- **Perché è unused:** Presi da context ma non usati in questo file (gestiti altrove / passati selettivamente).
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** AppRouter MainContent
- **UI verificabile:** **Sì** — `Home / navigazione / Around me / drop diario`
- **Cosa dovrei vedere:** funzionalità ancora presenti fuori AppRouter
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto (cleanup destructuring)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-152 — `handleSmartDrop`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/layout/AppRouter.tsx`
- **Percorso completo:** `src/components/layout/AppRouter.tsx`
- **Riga:** 81
- **Nome:** `handleSmartDrop`
- **Tipo:** destructuring
- **Cosa fa:** `userLocation`, `handleMainScroll`, `handleAroundMeTrigger`, `handleSmartDrop` in MainContent.
- **Perché è unused:** Presi da context ma non usati in questo file (gestiti altrove / passati selettivamente).
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** AppRouter MainContent
- **UI verificabile:** **Sì** — `Home / navigazione / Around me / drop diario`
- **Cosa dovrei vedere:** funzionalità ancora presenti fuori AppRouter
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto (cleanup destructuring)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-153 — `isUiVisible`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/layout/AppShell.tsx`
- **Percorso completo:** `src/components/layout/AppShell.tsx`
- **Riga:** 31
- **Nome:** `isUiVisible`
- **Tipo:** parametro
- **Cosa fa:** `isUiVisible` in AppShell.
- **Perché è unused:** Prop layout visibility non usata.
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** chrome visibility gestita altrove?
- **UI verificabile:** **Sì** — `App shell globale`
- **Cosa dovrei vedere:** show/hide UI
- **Cosa succede se lo eliminiamo:** non determinabile
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Bassa
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-154 — `onOpenRankings`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/layout/MobileNavBar.tsx`
- **Percorso completo:** `src/components/layout/MobileNavBar.tsx`
- **Riga:** 19
- **Nome:** `onOpenRankings`
- **Tipo:** parametro
- **Cosa fa:** `onOpenRankings` in MobileNavBar.
- **Perché è unused:** CTA rankings rimossa/mossa; prop ancora nel contratto.
- **Classificazione:** 🔴 ROTTO / SGANCIATO
- **Evidenza:** MobileNavBar
- **UI verificabile:** **Sì** — `Mobile → bottom nav`
- **Cosa dovrei vedere:** pulsante rankings
- **Cosa succede se lo eliminiamo:** CTA rankings potenzialmente mancante
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-155 — `AdminDashboard`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/layout/modals/AdminModals.tsx`
- **Percorso completo:** `src/components/layout/modals/AdminModals.tsx`
- **Riga:** 10
- **Nome:** `AdminDashboard`
- **Tipo:** import
- **Cosa fa:** Import `AdminDashboard` in AdminModals.
- **Perché è unused:** Non referenziato (lazy/altrove).
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** AdminModals.tsx
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-156 — `onUserUpdate`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/layout/modals/AdminModals.tsx`
- **Percorso completo:** `src/components/layout/modals/AdminModals.tsx`
- **Riga:** 40
- **Nome:** `onUserUpdate`
- **Tipo:** parametro
- **Cosa fa:** `onUserUpdate` / `onNavigate` in AdminModals.
- **Perché è unused:** Ricevuti, non inoltrati a tutte le view.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** simile UserManagementView
- **UI verificabile:** **Sì** — `Admin modals`
- **Cosa dovrei vedere:** navigate/update dopo azioni
- **Cosa succede se lo eliminiamo:** verificare refresh admin
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-157 — `onNavigate`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/layout/modals/AdminModals.tsx`
- **Percorso completo:** `src/components/layout/modals/AdminModals.tsx`
- **Riga:** 41
- **Nome:** `onNavigate`
- **Tipo:** parametro
- **Cosa fa:** `onUserUpdate` / `onNavigate` in AdminModals.
- **Perché è unused:** Ricevuti, non inoltrati a tutte le view.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** simile UserManagementView
- **UI verificabile:** **Sì** — `Admin modals`
- **Cosa dovrei vedere:** navigate/update dopo azioni
- **Cosa succede se lo eliminiamo:** verificare refresh admin
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-158 — `exitScale`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/layout/OnboardingWizard.tsx`
- **Percorso completo:** `src/components/layout/OnboardingWizard.tsx`
- **Riga:** 74
- **Nome:** `exitScale`
- **Tipo:** state
- **Cosa fa:** `exitScale` in OnboardingWizard.
- **Perché è unused:** `setExitScale` chiamato ma scale usa `isExiting ? 0.1 : 1`.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** stato ridondante
- **UI verificabile:** **Sì** — `Onboarding wizard (primo accesso)`
- **Cosa dovrei vedere:** animazione exit
- **Cosa succede se lo eliminiamo:** nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-159 — `setLoading`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/modals/AiItineraryModal.tsx`
- **Percorso completo:** `src/components/modals/AiItineraryModal.tsx`
- **Riga:** 51
- **Nome:** `setLoading`
- **Tipo:** setter
- **Cosa fa:** `setLoading` in AiItineraryModal.
- **Perché è unused:** Setter non usato; loading UI potenzialmente statica.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** AiItineraryModal
- **UI verificabile:** **Sì** — `Home/Diario → genera itinerario AI (modal)`
- **Cosa dovrei vedere:** stato loading generazione
- **Cosa succede se lo eliminiamo:** UX loading
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-160 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/modals/PoiClaimModal.tsx`
- **Percorso completo:** `src/components/modals/PoiClaimModal.tsx`
- **Riga:** 100
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-161 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/modals/sponsor/SponsorForm.tsx`
- **Percorso completo:** `src/components/modals/sponsor/SponsorForm.tsx`
- **Riga:** 208
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-162 — `selectedPlan`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/modals/SponsorModal.tsx`
- **Percorso completo:** `src/components/modals/SponsorModal.tsx`
- **Riga:** 32
- **Nome:** `selectedPlan`
- **Tipo:** variabile
- **Cosa fa:** `selectedPlan` in SponsorModal.
- **Perché è unused:** Dal hook, non usato in UI selezione piano.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** SponsorModal
- **UI verificabile:** **Sì** — `Modal Sponsor (CTA sponsor)`
- **Cosa dovrei vedere:** selezione piano
- **Cosa succede se lo eliminiamo:** flusso piano incompleto?
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-163 — `selectedVersionId`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/modals/UserUpgradeModal.tsx`
- **Percorso completo:** `src/components/modals/UserUpgradeModal.tsx`
- **Riga:** 27
- **Nome:** `selectedVersionId`
- **Tipo:** state
- **Cosa fa:** `selectedVersionId` in UserUpgradeModal.
- **Perché è unused:** Dichiarato; flusso upgrade incompleto.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** UserUpgradeModal
- **UI verificabile:** **Sì** — `User Dashboard → Upgrade modal`
- **Cosa dovrei vedere:** scelta versione piano
- **Cosa succede se lo eliminiamo:** upgrade incompleto
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-164 — `yearlyValue`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/myspace/ViaggioRicordamiControl.tsx`
- **Percorso completo:** `src/components/myspace/ViaggioRicordamiControl.tsx`
- **Riga:** 116
- **Nome:** `yearlyValue`
- **Tipo:** variabile
- **Cosa fa:** `yearlyValue` prezzo Ricordami.
- **Perché è unused:** Calcolato, non mostrato.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** ViaggioRicordamiControl
- **UI verificabile:** **Sì** — `MySpace → I miei Viaggi → apri viaggio → controllo Ricordami`
- **Cosa dovrei vedere:** prezzo annuale
- **Cosa succede se lo eliminiamo:** UX pricing
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-165 — `onBack`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/shop/ShopDetailView.tsx`
- **Percorso completo:** `src/components/shop/ShopDetailView.tsx`
- **Riga:** 23
- **Nome:** `onBack`
- **Tipo:** parametro
- **Cosa fa:** `onBack` / `onAddToItinerary` ShopDetailView.
- **Perché è unused:** Contratto props; chrome parent.
- **Classificazione:** 🔴 ROTTO / SGANCIATO
- **Evidenza:** Shop detail
- **UI verificabile:** **Sì** — `Home → Shop / Partner shop detail`
- **Cosa dovrei vedere:** back e aggiungi a itinerario
- **Cosa succede se lo eliminiamo:** CTA potenzialmente altrove
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-166 — `onAddToItinerary`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/shop/ShopDetailView.tsx`
- **Percorso completo:** `src/components/shop/ShopDetailView.tsx`
- **Riga:** 27
- **Nome:** `onAddToItinerary`
- **Tipo:** parametro
- **Cosa fa:** `onBack` / `onAddToItinerary` ShopDetailView.
- **Perché è unused:** Contratto props; chrome parent.
- **Classificazione:** 🔴 ROTTO / SGANCIATO
- **Evidenza:** Shop detail
- **UI verificabile:** **Sì** — `Home → Shop / Partner shop detail`
- **Cosa dovrei vedere:** back e aggiungi a itinerario
- **Cosa succede se lo eliminiamo:** CTA potenzialmente altrove
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-167 — `onBack`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/user/BusinessShopManager.tsx`
- **Percorso completo:** `src/components/user/BusinessShopManager.tsx`
- **Riga:** 29
- **Nome:** `onBack`
- **Tipo:** parametro
- **Cosa fa:** `onBack` BusinessShopManager.
- **Perché è unused:** Prop non usata.
- **Classificazione:** 🔴 ROTTO / SGANCIATO
- **Evidenza:** user business shop
- **UI verificabile:** **Sì** — `User Dashboard → Business shop manager`
- **Cosa dovrei vedere:** back
- **Cosa succede se lo eliminiamo:** navigazione back
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-168 — `productsSliderRef`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/user/BusinessShopManager.tsx`
- **Percorso completo:** `src/components/user/BusinessShopManager.tsx`
- **Riga:** 42
- **Nome:** `productsSliderRef`
- **Tipo:** ref
- **Cosa fa:** `productsSliderRef` mai attached.
- **Perché è unused:** Ref creato, nessun `ref={}`.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** BusinessShopManager
- **UI verificabile:** **Sì** — `User Dashboard → Business → prodotti slider`
- **Cosa dovrei vedere:** slider prodotti
- **Cosa succede se lo eliminiamo:** feature slider incompleta
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-169 — `user`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/user/dashboard/UserMessagesTab.tsx`
- **Percorso completo:** `src/components/user/dashboard/UserMessagesTab.tsx`
- **Riga:** 28
- **Nome:** `user`
- **Tipo:** parametro
- **Cosa fa:** `user` in UserMessagesTab.
- **Perché è unused:** Prop non usata (fetch via altro id?).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Messages tab
- **UI verificabile:** **Sì** — `User Dashboard → Messaggi`
- **Cosa dovrei vedere:** lista messaggi
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-170 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/user/dashboard/UserMessagesTab.tsx`
- **Percorso completo:** `src/components/user/dashboard/UserMessagesTab.tsx`
- **Riga:** 76
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-171 — `onUpdateUser`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/user/dashboard/UserReferralTab.tsx`
- **Percorso completo:** `src/components/user/dashboard/UserReferralTab.tsx`
- **Riga:** 52
- **Nome:** `onUpdateUser`
- **Tipo:** parametro
- **Cosa fa:** `onUpdateUser` in UserReferralTab.
- **Perché è unused:** Dopo redeem dovrebbe refresh user; TODO redeem.
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** handleRedeem ha TODO re-enable
- **UI verificabile:** **Sì** — `User Dashboard → Referral`
- **Cosa dovrei vedere:** redeem codice
- **Cosa succede se lo eliminiamo:** legato a flusso redeem incompleto
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Bassa
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-172 — `setIsRedeeming`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/user/dashboard/UserReferralTab.tsx`
- **Percorso completo:** `src/components/user/dashboard/UserReferralTab.tsx`
- **Riga:** 57
- **Nome:** `setIsRedeeming`
- **Tipo:** setter
- **Cosa fa:** `setIsRedeeming` — UI legge `isRedeeming` ma setter mai chiamato.
- **Perché è unused:** `handleRedeem` ha TODO; disabled/spinner redeem non si attivano mai.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** UserReferralTab L199 TODO + L395–398 usano `isRedeeming` sempre false
- **UI verificabile:** **Sì** — `User Dashboard → Referral → inserisci codice → Riscatta`
- **Cosa dovrei vedere:** bottone redeem senza loading reale; flusso redeem sospeso
- **Cosa succede se lo eliminiamo:** rischiamo di perdere pezzo di un flusso da completare
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-173 — `setSettingsConfig`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/user/dashboard/UserSettingsTab.tsx`
- **Percorso completo:** `src/components/user/dashboard/UserSettingsTab.tsx`
- **Riga:** 72
- **Nome:** `setSettingsConfig`
- **Tipo:** setter
- **Cosa fa:** `setSettingsConfig` in UserSettingsTab.
- **Perché è unused:** Config read-only; toggle disabled/noop.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** settings WIP
- **UI verificabile:** **Sì** — `User Dashboard → Impostazioni`
- **Cosa dovrei vedere:** toggle settings non editabili
- **Cosa succede se lo eliminiamo:** settings incompleti
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-174 — `activeBusinessId`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/user/dashboard/UserSidebar.tsx`
- **Percorso completo:** `src/components/user/dashboard/UserSidebar.tsx`
- **Riga:** 41
- **Nome:** `activeBusinessId`
- **Tipo:** destructuring
- **Cosa fa:** `activeBusinessId` / `switchBusiness` in UserSidebar.
- **Perché è unused:** Solo lista businesses usata; switch non in sidebar.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** UserSidebar
- **UI verificabile:** **Sì** — `User Dashboard → sidebar`
- **Cosa dovrei vedere:** switch business
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-175 — `switchBusiness`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/components/user/dashboard/UserSidebar.tsx`
- **Percorso completo:** `src/components/user/dashboard/UserSidebar.tsx`
- **Riga:** 41
- **Nome:** `switchBusiness`
- **Tipo:** destructuring
- **Cosa fa:** `activeBusinessId` / `switchBusiness` in UserSidebar.
- **Perché è unused:** Solo lista businesses usata; switch non in sidebar.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** UserSidebar
- **UI verificabile:** **Sì** — `User Dashboard → sidebar`
- **Cosa dovrei vedere:** switch business
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-176 — `userSuitcases`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/components/user/UserDashboard.tsx`
- **Percorso completo:** `src/components/user/UserDashboard.tsx`
- **Riga:** 75
- **Nome:** `userSuitcases`
- **Tipo:** parametro
- **Cosa fa:** `userSuitcases` in UserDashboard shell.
- **Perché è unused:** Prop non usata nel dashboard shell.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** valigie gestite altrove
- **UI verificabile:** **Sì** — `User Dashboard`
- **Cosa dovrei vedere:** lista valigie (altrove)
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-177 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/config/env.ts`
- **Percorso completo:** `src/config/env.ts`
- **Riga:** 23
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-178 — `currentOwner`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/context/BusinessContext.tsx`
- **Percorso completo:** `src/context/BusinessContext.tsx`
- **Riga:** 129
- **Nome:** `currentOwner`
- **Tipo:** variabile
- **Cosa fa:** `currentOwner` / `urlIsLegacy` in BusinessContext URL normalizer.
- **Perché è unused:** Calcolati per validazione/redirect; non usati.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** BusinessContext
- **UI verificabile:** **Sì** — `URL business / partner legacy`
- **Cosa dovrei vedere:** redirect legacy URL
- **Cosa succede se lo eliminiamo:** normalizzazione URL incompleta
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-179 — `urlIsLegacy`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/context/BusinessContext.tsx`
- **Percorso completo:** `src/context/BusinessContext.tsx`
- **Riga:** 143
- **Nome:** `urlIsLegacy`
- **Tipo:** variabile
- **Cosa fa:** `currentOwner` / `urlIsLegacy` in BusinessContext URL normalizer.
- **Perché è unused:** Calcolati per validazione/redirect; non usati.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** BusinessContext
- **UI verificabile:** **Sì** — `URL business / partner legacy`
- **Cosa dovrei vedere:** redirect legacy URL
- **Cosa succede se lo eliminiamo:** normalizzazione URL incompleta
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-180 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/context/ItineraryContext.tsx`
- **Percorso completo:** `src/context/ItineraryContext.tsx`
- **Riga:** 210
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-181 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/context/ItineraryContext.tsx`
- **Percorso completo:** `src/context/ItineraryContext.tsx`
- **Riga:** 253
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-182 — `existingCities`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/data/ai/prompts.ts`
- **Percorso completo:** `src/data/ai/prompts.ts`
- **Riga:** 48
- **Nome:** `existingCities`
- **Tipo:** parametro
- **Cosa fa:** `existingCities` in `buildZoneAnalysisPrompt`.
- **Perché è unused:** Parametro NON interpolato nel template string.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** prompts.ts L45–57: existingCities in firma, assente nel body template
- **UI verificabile:** **Sì** — `Admin → Analisi zona / Magic city AI`
- **Cosa dovrei vedere:** output AI che dovrebbe evitare città esistenti
- **Cosa succede se lo eliminiamo:** rischiamo di lasciare prompt incompleto se eliminiamo solo il param
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-183 — `retryInstruction`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/data/ai/prompts.ts`
- **Percorso completo:** `src/data/ai/prompts.ts`
- **Riga:** 75
- **Nome:** `retryInstruction`
- **Tipo:** parametro
- **Cosa fa:** `retryInstruction` in `buildSuggestNewPoisPrompt`.
- **Perché è unused:** Non interpolato (`instruction` sì).
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** L70–82
- **UI verificabile:** **Sì** — `Admin → AI suggest new POI`
- **Cosa dovrei vedere:** retry AI con istruzione extra
- **Cosa succede se lo eliminiamo:** retry instruction ignorata dal modello
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-184 — `allowedSubcategories`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/data/ai/prompts.ts`
- **Percorso completo:** `src/data/ai/prompts.ts`
- **Riga:** 77
- **Nome:** `allowedSubcategories`
- **Tipo:** parametro
- **Cosa fa:** `allowedSubcategories` in suggest prompts.
- **Perché è unused:** Non interpolato nei template.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** buildSuggestNewPoisPrompt + buildSuggestItemsPrompt
- **UI verificabile:** **Sì** — `Admin → AI suggest POI/items`
- **Cosa dovrei vedere:** vincolo sottocategorie in output AI
- **Cosa succede se lo eliminiamo:** filtro sottocategorie non applicato al prompt
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-185 — `allowedSubcategories`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/data/ai/prompts.ts`
- **Percorso completo:** `src/data/ai/prompts.ts`
- **Riga:** 96
- **Nome:** `allowedSubcategories`
- **Tipo:** parametro
- **Cosa fa:** `allowedSubcategories` in suggest prompts.
- **Perché è unused:** Non interpolato nei template.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** buildSuggestNewPoisPrompt + buildSuggestItemsPrompt
- **UI verificabile:** **Sì** — `Admin → AI suggest POI/items`
- **Cosa dovrei vedere:** vincolo sottocategorie in output AI
- **Cosa succede se lo eliminiamo:** filtro sottocategorie non applicato al prompt
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-186 — `intent`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/focus/exitGate/evaluateExitGate.ts`
- **Percorso completo:** `src/focus/exitGate/evaluateExitGate.ts`
- **Riga:** 18
- **Nome:** `intent`
- **Tipo:** parametro
- **Cosa fa:** `intent` in `evaluateExitGate`.
- **Perché è unused:** API riceve ExitIntent ma valuta tutti i gate registrati.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** focus/exitGate — filtro intent non implementato
- **UI verificabile:** **Sì** — `Focus mode → exit gate (chiudi overlay)`
- **Cosa dovrei vedere:** gate di uscita per intent specifico
- **Cosa succede se lo eliminiamo:** filtro intent incompleto
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-187 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/hooks/admin/import/useImportActions.ts`
- **Percorso completo:** `src/hooks/admin/import/useImportActions.ts`
- **Riga:** 96
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **Sì** — `Admin → Manager & Import POI → azioni import`
- **Cosa dovrei vedere:** analisi / publish / dedupe
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-188 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/hooks/admin/import/useImportActions.ts`
- **Percorso completo:** `src/hooks/admin/import/useImportActions.ts`
- **Riga:** 114
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **Sì** — `Admin → Manager & Import POI → azioni import`
- **Cosa dovrei vedere:** analisi / publish / dedupe
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-189 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/hooks/admin/import/useImportActions.ts`
- **Percorso completo:** `src/hooks/admin/import/useImportActions.ts`
- **Riga:** 147
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **Sì** — `Admin → Manager & Import POI → azioni import`
- **Cosa dovrei vedere:** analisi / publish / dedupe
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-190 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/hooks/admin/import/useImportActions.ts`
- **Percorso completo:** `src/hooks/admin/import/useImportActions.ts`
- **Riga:** 160
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **Sì** — `Admin → Manager & Import POI → azioni import`
- **Cosa dovrei vedere:** analisi / publish / dedupe
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-191 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/hooks/admin/import/useImportActions.ts`
- **Percorso completo:** `src/hooks/admin/import/useImportActions.ts`
- **Riga:** 173
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **Sì** — `Admin → Manager & Import POI → azioni import`
- **Cosa dovrei vedere:** analisi / publish / dedupe
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-192 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/hooks/admin/import/useImportActions.ts`
- **Percorso completo:** `src/hooks/admin/import/useImportActions.ts`
- **Riga:** 229
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **Sì** — `Admin → Manager & Import POI → azioni import`
- **Cosa dovrei vedere:** analisi / publish / dedupe
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-193 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/hooks/admin/people/usePeopleAI.ts`
- **Percorso completo:** `src/hooks/admin/people/usePeopleAI.ts`
- **Riga:** 87
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **Sì** — `Admin → Edit città → Cultura → People`
- **Cosa dovrei vedere:** AI people
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-194 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/hooks/admin/people/usePeopleAI.ts`
- **Percorso completo:** `src/hooks/admin/people/usePeopleAI.ts`
- **Riga:** 216
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **Sì** — `Admin → Edit città → Cultura → People`
- **Cosa dovrei vedere:** AI people
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-195 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/hooks/admin/people/usePeopleData.ts`
- **Percorso completo:** `src/hooks/admin/people/usePeopleData.ts`
- **Riga:** 97
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **Sì** — `Admin → Edit città → Cultura → People`
- **Cosa dovrei vedere:** AI people
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-196 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/hooks/admin/people/usePeopleData.ts`
- **Percorso completo:** `src/hooks/admin/people/usePeopleData.ts`
- **Riga:** 119
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **Sì** — `Admin → Edit città → Cultura → People`
- **Cosa dovrei vedere:** AI people
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-197 — `err`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/hooks/admin/useAiCompleteCity.ts`
- **Percorso completo:** `src/hooks/admin/useAiCompleteCity.ts`
- **Riga:** 229
- **Nome:** `err`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-198 — `user`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/hooks/admin/useAiFlashSearch.ts`
- **Percorso completo:** `src/hooks/admin/useAiFlashSearch.ts`
- **Riga:** 18
- **Nome:** `user`
- **Tipo:** parametro
- **Cosa fa:** `user` in useAiFlashSearch.
- **Perché è unused:** Firma legacy; body non usa user.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** altri AI hooks usano user per verify
- **UI verificabile:** **Sì** — `Admin → AI Flash search`
- **Cosa dovrei vedere:** ricerca flash
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-199 — `cityCenterCoords`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/hooks/admin/useAiMagicCity.ts`
- **Percorso completo:** `src/hooks/admin/useAiMagicCity.ts`
- **Riga:** 122
- **Nome:** `cityCenterCoords`
- **Tipo:** variabile
- **Cosa fa:** `cityCenterCoords` in useAiMagicCity.
- **Perché è unused:** Assegnato, non passato downstream al generate.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** geo center calcolato poi ignorato
- **UI verificabile:** **Sì** — `Admin → Magic Generate città`
- **Cosa dovrei vedere:** generate con centro geo
- **Cosa succede se lo eliminiamo:** geo bias AI incompleto
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-200 — `err`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/hooks/admin/useAiMagicCity.ts`
- **Percorso completo:** `src/hooks/admin/useAiMagicCity.ts`
- **Riga:** 177
- **Nome:** `err`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-201 — `user`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/hooks/admin/useAiTargetedSearch.ts`
- **Percorso completo:** `src/hooks/admin/useAiTargetedSearch.ts`
- **Riga:** 17
- **Nome:** `user`
- **Tipo:** parametro
- **Cosa fa:** `user` in useAiTargetedSearch.
- **Perché è unused:** come flash search
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** param unused
- **UI verificabile:** **Sì** — `Admin → AI Targeted search`
- **Cosa dovrei vedere:** search
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-202 — `cityList`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/hooks/admin/useDuplicateFinder.ts`
- **Percorso completo:** `src/hooks/admin/useDuplicateFinder.ts`
- **Riga:** 16
- **Nome:** `cityList`
- **Tipo:** parametro
- **Cosa fa:** `cityList` in useDuplicateFinder.
- **Perché è unused:** Caller comment: passato ma unused.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** Observatory duplicates
- **UI verificabile:** **Sì** — `Admin → Observatory → Duplicates`
- **Cosa dovrei vedere:** finder duplicati
- **Cosa succede se lo eliminiamo:** nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-203 — `handleDelete`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/hooks/admin/useDuplicateFinder.ts`
- **Percorso completo:** `src/hooks/admin/useDuplicateFinder.ts`
- **Riga:** 146
- **Nome:** `handleDelete`
- **Tipo:** funzione/param
- **Cosa fa:** `handleDelete` stub + `victim`/`pairId`.
- **Perché è unused:** Merge-only policy; delete vuoto.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** useDuplicateFinder comments
- **UI verificabile:** **Sì** — `Admin → Observatory → Duplicates`
- **Cosa dovrei vedere:** merge only (no delete)
- **Cosa succede se lo eliminiamo:** nessun impatto (stub intenzionale da rimuovere)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-204 — `victim`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/hooks/admin/useDuplicateFinder.ts`
- **Percorso completo:** `src/hooks/admin/useDuplicateFinder.ts`
- **Riga:** 146
- **Nome:** `victim`
- **Tipo:** funzione/param
- **Cosa fa:** `handleDelete` stub + `victim`/`pairId`.
- **Perché è unused:** Merge-only policy; delete vuoto.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** useDuplicateFinder comments
- **UI verificabile:** **Sì** — `Admin → Observatory → Duplicates`
- **Cosa dovrei vedere:** merge only (no delete)
- **Cosa succede se lo eliminiamo:** nessun impatto (stub intenzionale da rimuovere)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-205 — `pairId`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/hooks/admin/useDuplicateFinder.ts`
- **Percorso completo:** `src/hooks/admin/useDuplicateFinder.ts`
- **Riga:** 146
- **Nome:** `pairId`
- **Tipo:** funzione/param
- **Cosa fa:** `handleDelete` stub + `victim`/`pairId`.
- **Perché è unused:** Merge-only policy; delete vuoto.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** useDuplicateFinder comments
- **UI verificabile:** **Sì** — `Admin → Observatory → Duplicates`
- **Cosa dovrei vedere:** merge only (no delete)
- **Cosa succede se lo eliminiamo:** nessun impatto (stub intenzionale da rimuovere)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-206 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/hooks/admin/usePoiActions.ts`
- **Percorso completo:** `src/hooks/admin/usePoiActions.ts`
- **Riga:** 80
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-207 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/hooks/admin/usePoiActions.ts`
- **Percorso completo:** `src/hooks/admin/usePoiActions.ts`
- **Riga:** 106
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-208 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/hooks/admin/usePoiActions.ts`
- **Percorso completo:** `src/hooks/admin/usePoiActions.ts`
- **Riga:** 131
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-209 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/hooks/admin/useSocialTemplates.ts`
- **Percorso completo:** `src/hooks/admin/useSocialTemplates.ts`
- **Riga:** 103
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-210 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/hooks/core/useAppInitialization.ts`
- **Percorso completo:** `src/hooks/core/useAppInitialization.ts`
- **Riga:** 122
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-211 — `itineraryId`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/hooks/suitcase/useSuitcaseCrud.ts`
- **Percorso completo:** `src/hooks/suitcase/useSuitcaseCrud.ts`
- **Riga:** 135
- **Nome:** `itineraryId`
- **Tipo:** parametro
- **Cosa fa:** `itineraryId` in useCloneSuitcase.
- **Perché è unused:** Clone non associa più al diario; association flow separato.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** useSuitcaseCrud
- **UI verificabile:** **Sì** — `Diario → Valigia → clona`
- **Cosa dovrei vedere:** clone senza auto-link
- **Cosa succede se lo eliminiamo:** nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-212 — `shareToLive`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/hooks/useCityGallery.ts`
- **Percorso completo:** `src/hooks/useCityGallery.ts`
- **Riga:** 135
- **Nome:** `shareToLive`
- **Tipo:** parametro
- **Cosa fa:** `shareToLive` in useCityGallery.
- **Perché è unused:** Flag API non usato nel handler share.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** gallery share
- **UI verificabile:** **Sì** — `Città → gallery → share`
- **Cosa dovrei vedere:** share to live
- **Cosa succede se lo eliminiamo:** share mode incompleto
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-213 — `setRefreshingIds`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/hooks/useCityList.ts`
- **Percorso completo:** `src/hooks/useCityList.ts`
- **Riga:** 18
- **Nome:** `setRefreshingIds`
- **Tipo:** state
- **Cosa fa:** `refreshingIds` / `setRefreshingIds` in useCityList.
- **Perché è unused:** Stato refresh per-città non collegato a UI.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** useCityList
- **UI verificabile:** **Sì** — `liste città (admin/home refresh)`
- **Cosa dovrei vedere:** spinner per riga città
- **Cosa succede se lo eliminiamo:** UX refresh
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-214 — `refreshingIds`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/hooks/useCityList.ts`
- **Percorso completo:** `src/hooks/useCityList.ts`
- **Riga:** 18
- **Nome:** `refreshingIds`
- **Tipo:** state
- **Cosa fa:** `refreshingIds` / `setRefreshingIds` in useCityList.
- **Perché è unused:** Stato refresh per-città non collegato a UI.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** useCityList
- **UI verificabile:** **Sì** — `liste città (admin/home refresh)`
- **Cosa dovrei vedere:** spinner per riga città
- **Cosa succede se lo eliminiamo:** UX refresh
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-215 — `prevTitle`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/hooks/useDocumentTitle.ts`
- **Percorso completo:** `src/hooks/useDocumentTitle.ts`
- **Riga:** 12
- **Nome:** `prevTitle`
- **Tipo:** variabile
- **Cosa fa:** `prevTitle` in useDocumentTitle.
- **Perché è unused:** Restore title in cleanup intenzionalmente commentato (SPA flicker).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** commento nel file
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** NON TOCCARE comportamento title; al massimo `_prevTitle`
- **Azione consigliata:** NON TOCCARE PER ORA
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-216 — `cityName`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/hooks/usePoiManager.ts`
- **Percorso completo:** `src/hooks/usePoiManager.ts`
- **Riga:** 7
- **Nome:** `cityName`
- **Tipo:** parametro
- **Cosa fa:** `cityName` in usePoiManager.
- **Perché è unused:** Firma hook leftover.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** usePoiManager
- **UI verificabile:** **Sì** — `gestione POI città`
- **Cosa dovrei vedere:** poi manager
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-217 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/hooks/useSystemMessage.ts`
- **Percorso completo:** `src/hooks/useSystemMessage.ts`
- **Riga:** 52
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-218 — `isContextLoading`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/hooks/useUserDashboardData.ts`
- **Percorso completo:** `src/hooks/useUserDashboardData.ts`
- **Riga:** 29
- **Nome:** `isContextLoading`
- **Tipo:** destructuring
- **Cosa fa:** `isContextLoading` / `activeSponsors` in useUserDashboardData.
- **Perché è unused:** Presi/fetchati non esposti/usati dal consumer hook return path.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** useUserDashboardData
- **UI verificabile:** **Sì** — `User Dashboard`
- **Cosa dovrei vedere:** loading/sponsors
- **Cosa succede se lo eliminiamo:** verificare se sponsors dovevano apparire in dashboard
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-219 — `activeSponsors`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/hooks/useUserDashboardData.ts`
- **Percorso completo:** `src/hooks/useUserDashboardData.ts`
- **Riga:** 128
- **Nome:** `activeSponsors`
- **Tipo:** destructuring
- **Cosa fa:** `isContextLoading` / `activeSponsors` in useUserDashboardData.
- **Perché è unused:** Presi/fetchati non esposti/usati dal consumer hook return path.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** useUserDashboardData
- **UI verificabile:** **Sì** — `User Dashboard`
- **Cosa dovrei vedere:** loading/sponsors
- **Cosa succede se lo eliminiamo:** verificare se sponsors dovevano apparire in dashboard
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — era ancora aperto dopo la bonifica −102 del 2026-08-24; ora assente da Biome (fix successivi al batch 🟢)

### UNUSED-220 — `configError`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/ai/aiVision.ts`
- **Percorso completo:** `src/services/ai/aiVision.ts`
- **Riga:** 22
- **Nome:** `configError`
- **Tipo:** variabile
- **Cosa fa:** `configError` in aiVision.
- **Perché è unused:** Assegnato in fallback path, non propagato.
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** aiVision
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto binding
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-221 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/ai/aiVision.ts`
- **Percorso completo:** `src/services/ai/aiVision.ts`
- **Riga:** 89
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-222 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/ai/aiVision.ts`
- **Percorso completo:** `src/services/ai/aiVision.ts`
- **Riga:** 122
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-223 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/ai/aiVision.ts`
- **Percorso completo:** `src/services/ai/aiVision.ts`
- **Riga:** 159
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-224 — `existingCities`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/services/ai/generators/cityContentGenerator.ts`
- **Percorso completo:** `src/services/ai/generators/cityContentGenerator.ts`
- **Riga:** 304
- **Nome:** `existingCities`
- **Tipo:** parametro
- **Cosa fa:** `existingCities` in cityContentGenerator.
- **Perché è unused:** Ricevuto poi forzato a `[]` verso buildZoneAnalysisPrompt.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** doppia disconnessione con prompts.ts
- **UI verificabile:** **Sì** — `Admin → AI zone/city content`
- **Cosa dovrei vedere:** dedupe città in generate
- **Cosa succede se lo eliminiamo:** pipeline AI incompleta
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-225 — `subLower`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/ai/utils/taxonomyUtils.ts`
- **Percorso completo:** `src/services/ai/utils/taxonomyUtils.ts`
- **Riga:** 33
- **Nome:** `subLower`
- **Tipo:** variabile
- **Cosa fa:** `subLower` in taxonomyUtils.
- **Perché è unused:** Poi si usa `normalizeSubCategory(subCategory)`.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** sostituito da normalize
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-226 — `ttl`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/services/city/cityCache.ts`
- **Percorso completo:** `src/services/city/cityCache.ts`
- **Riga:** 24
- **Nome:** `ttl`
- **Tipo:** parametro
- **Cosa fa:** `ttl` in `setInCache` cityCache.
- **Perché è unused:** Accettato ma non memorizzato; `getFromCache` usa solo CACHE_TTL globale.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** cityCache.ts
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** TTL per-key incompleto — non eliminare senza decidere design
- **Azione consigliata:** COMPLETARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-227 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/city/cityLifecycleService.ts`
- **Percorso completo:** `src/services/city/cityLifecycleService.ts`
- **Riga:** 89
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-228 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/city/cityLifecycleService.ts`
- **Percorso completo:** `src/services/city/cityLifecycleService.ts`
- **Riga:** 113
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-229 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/city/cityLifecycleService.ts`
- **Percorso completo:** `src/services/city/cityLifecycleService.ts`
- **Riga:** 125
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-230 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/city/cityLifecycleService.ts`
- **Percorso completo:** `src/services/city/cityLifecycleService.ts`
- **Riga:** 141
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-231 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/city/cityLifecycleService.ts`
- **Percorso completo:** `src/services/city/cityLifecycleService.ts`
- **Riga:** 149
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-232 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/city/cityLifecycleService.ts`
- **Percorso completo:** `src/services/city/cityLifecycleService.ts`
- **Riga:** 186
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-233 — `err`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/city/cityLifecycleService.ts`
- **Percorso completo:** `src/services/city/cityLifecycleService.ts`
- **Riga:** 232
- **Nome:** `err`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-234 — `cat`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/services/city/poi/poiMapper.ts`
- **Percorso completo:** `src/services/city/poi/poiMapper.ts`
- **Riga:** 50
- **Nome:** `cat`
- **Tipo:** parametro
- **Cosa fa:** `cat` in `inferResourceType` poiMapper.
- **Perché è unused:** Inference da sub only.
- **Classificazione:** 🟡 PARZIALE / SVILUPPO NON COMPLETATO
- **Evidenza:** poiMapper
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** mapping resource type potrebbe ignorare categoria
- **Azione consigliata:** ANALIZZARE MANUALMENTE
- **Confidenza:** Media
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)

### UNUSED-235 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/community/itineraryService.ts`
- **Percorso completo:** `src/services/community/itineraryService.ts`
- **Riga:** 719
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-236 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/contentService.ts`
- **Percorso completo:** `src/services/contentService.ts`
- **Riga:** 96
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-237 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/contentService.ts`
- **Percorso completo:** `src/services/contentService.ts`
- **Riga:** 105
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-238 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/gamificationService.ts`
- **Percorso completo:** `src/services/gamificationService.ts`
- **Riga:** 449
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-239 — `parseError`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/importService.ts`
- **Percorso completo:** `src/services/importService.ts`
- **Riga:** 147
- **Nome:** `parseError`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-240 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/importService.ts`
- **Percorso completo:** `src/services/importService.ts`
- **Riga:** 236
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-241 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/importService.ts`
- **Percorso completo:** `src/services/importService.ts`
- **Riga:** 326
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-242 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/mediaService.ts`
- **Percorso completo:** `src/services/mediaService.ts`
- **Riga:** 17
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-243 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/mediaService.ts`
- **Percorso completo:** `src/services/mediaService.ts`
- **Riga:** 131
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-244 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/partnerIntegrationService.ts`
- **Percorso completo:** `src/services/partnerIntegrationService.ts`
- **Riga:** 102
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-245 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/photoService.ts`
- **Percorso completo:** `src/services/photoService.ts`
- **Riga:** 163
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-246 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/photoService.ts`
- **Percorso completo:** `src/services/photoService.ts`
- **Riga:** 188
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-247 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/rankingService.ts`
- **Percorso completo:** `src/services/rankingService.ts`
- **Riga:** 225
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-248 — `normalizePoiCategory`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/shopService.ts`
- **Percorso completo:** `src/services/shopService.ts`
- **Riga:** 254
- **Nome:** `normalizePoiCategory`
- **Tipo:** funzione locale
- **Cosa fa:** `normalizePoiCategory` in shopService.
- **Perché è unused:** Definita, mai chiamata (altro mapper).
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** shopService dead helper
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-249 — `status`

- **Cluster:** `noUnusedFunctionParameters`
- **Regola Biome:** `lint/correctness/noUnusedFunctionParameters`
- **File:** `src/services/sponsors/sponsorRequestsService.ts`
- **Percorso completo:** `src/services/sponsors/sponsorRequestsService.ts`
- **Riga:** 174
- **Nome:** `status`
- **Tipo:** parametro
- **Cosa fa:** `status` in sponsorRequestsService approve.
- **Perché è unused:** Typed waiting_payment ma RPC ignore.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** approve_sponsor_request
- **UI verificabile:** **Sì** — `Admin → Sponsor requests approve`
- **Cosa dovrei vedere:** approve
- **Cosa succede se lo eliminiamo:** probabilmente nessun impatto (RPC)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Media
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-250 — `readFromStorage`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/storageService.ts`
- **Percorso completo:** `src/services/storageService.ts`
- **Riga:** 27
- **Nome:** `readFromStorage`
- **Tipo:** funzione locale
- **Cosa fa:** `readFromStorage` helper dentro `getStorageItem`.
- **Perché è unused:** Definita per astrarre Storage vs memory; body usa direttamente localStorage/memoryStore.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** storageService L27–35 never called — refactor incompleto dell helper, storage path funziona comunque
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (helper morto)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-251 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/storageService.ts`
- **Percorso completo:** `src/services/storageService.ts`
- **Riga:** 80
- **Riga storica audit 2026-08-24:** 72
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-252 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/storageService.ts`
- **Percorso completo:** `src/services/storageService.ts`
- **Riga:** 110
- **Riga storica audit 2026-08-24:** 90
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-253 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/storageService.ts`
- **Percorso completo:** `src/services/storageService.ts`
- **Riga:** 122
- **Riga storica audit 2026-08-24:** 120
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-254 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/storageService.ts`
- **Percorso completo:** `src/services/storageService.ts`
- **Riga:** 137
- **Riga storica audit 2026-08-24:** 132
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-255 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/storageService.ts`
- **Percorso completo:** `src/services/storageService.ts`
- **Riga:** 149
- **Riga storica audit 2026-08-24:** 147
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-256 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/storageService.ts`
- **Percorso completo:** `src/services/storageService.ts`
- **Riga:** 160
- **Riga storica audit 2026-08-24:** 159
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-257 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/storageService.ts`
- **Percorso completo:** `src/services/storageService.ts`
- **Riga:** 175
- **Riga storica audit 2026-08-24:** 170
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-258 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/storageService.ts`
- **Percorso completo:** `src/services/storageService.ts`
- **Riga:** 185
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-259 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/services/userService.ts`
- **Percorso completo:** `src/services/userService.ts`
- **Riga:** 389
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-260 — `This type parameter T is unused.`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/types/models/Sponsor.ts`
- **Percorso completo:** `src/types/models/Sponsor.ts`
- **Riga:** 274
- **Nome:** `This type parameter T is unused.`
- **Tipo:** type parameter
- **Cosa fa:** `T` in `SortConfig<T>` Sponsor types.
- **Perché è unused:** Type param non usato nel type body.
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** Sponsor.ts compat alias
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto runtime
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

### UNUSED-261 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/utils/affiliateNetwork.ts`
- **Percorso completo:** `src/utils/affiliateNetwork.ts`
- **Riga:** 87
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** 🔓 APERTO (confermato scansione 2026-08-26)
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-262 — `e`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/utils/exportGenerators.ts`
- **Percorso completo:** `src/utils/exportGenerators.ts`
- **Riga:** 53
- **Nome:** `e`
- **Tipo:** variabile catch
- **Cosa fa:** Binding dell'errore in `catch`; il blocco catch esiste ed è intenzionale.
- **Perché è unused:** Si cattura l'errore ma non si legge `e` (toast generico, ignore, o nessun log).
- **Classificazione:** ⚪ ALTRO / NON DETERMINABILE
- **Evidenza:** Pattern `catch (e)` senza uso di `e` — non indica di per sé una feature sganciata.
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto funzionale evidente (solo binding; **tenere** il `catch`)
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused
- **Nota:** ELIMINARE solo il binding (`catch { }` / `_e`); non rimuovere il catch.

### UNUSED-263 — `Header`

- **Cluster:** `noUnusedVariables`
- **Regola Biome:** `lint/correctness/noUnusedVariables`
- **File:** `src/utils/exportGenerators.ts`
- **Percorso completo:** `src/utils/exportGenerators.ts`
- **Riga:** 91
- **Nome:** `Header`
- **Tipo:** import
- **Cosa fa:** `Header` da docx in exportGenerators.
- **Perché è unused:** Importato, non usato (Footer forse sì).
- **Classificazione:** 🟢 SOSTITUITO
- **Evidenza:** exportGenerators
- **UI verificabile:** **No** — UI: non direttamente verificabile
- **Cosa dovrei vedere:** n/d (service/script/infra)
- **Cosa succede se lo eliminiamo:** nessun impatto
- **Azione consigliata:** ELIMINARE
- **Confidenza:** Alta
- **Stato:** ✅ RISOLTO (scansione 2026-08-26) — non più segnalato da Biome sui 2 cluster unused

---

## Strategia consigliata

> **Aggiornamento strategia 2026-08-26:** la struttura a batch A–D resta valida. Il residuo aperto è **148** (non più 161). Molti leftover SuitcaseFloatingPanelBody / TabServices / Hero del Batch B risultano già assenti da Biome (schede ✅ RISOLTO). Restano prioritari: Batch A catch/`req`, Batch C SafeArt/prompt/Referral, Batch D props City*. Non trattare autofix Biome come prova di rimozione sicura.

1. **Batch A (lint meccanico):** catch bindings + map index + Express `_req` (senza cambiare comportamento).
2. **Batch B (refactor leftover):** SuitcaseFloatingPanelBody outer destructure; TabServices regen state; undo integration stub; Hero setters; TravelDiary lazy.
3. **Batch C (decisioni prodotto):** SafeArt RIPARARE; prompt AI COMPLETARE o documentare deprecazione; Referral redeem; RegionalAnalysis metrics UI.
4. **Batch D (contratti props):** CityHeader/Detail/Showcase/DiaryDay/Shop — ANAL + click path prima di ELIMINARE.

## Rischio residuo

Anche dopo Batch A+B restano falsi “dead code” su firme richieste e feature incomplete. Eliminare prop ancora passate dal parent senza snellire il parent lascia rumore TypeScript/Biome spostato.

## Verifiche post-bonifica

- `npm run check` (SoT qualità).
- Smoke: Home Hero; City header; Diario Valigia undo/modals; Admin Info&Guide regen; SafeArt; User Referral.
- Rigenerare conteggi Biome unused e aggiornare **Audit History** sotto.

---

## Audit History

| Data | Occorrenze unused (2 cluster) | Δ vs prec. | Note |
| ---- | ----------------------------: | ---------- | ---- |
| 2026-08-24 | 263 (168+95) | — (baseline focused audit) | Prima indagine completa caso-per-caso; nessun fix applicato. |
| 2026-08-24 | **161** (107+54) | **−102** | Bonifica chirurgica dei **102** casi 🟢 certificati. **Non** toccati: UNUSED-072 (`filteredCount`), UNUSED-073 (`onUserUpdate` in UserManagementView), UNUSED-219 (`activeSponsors`). I 3 restano in Biome. Nessuna riclassificazione dei 3 in questo step. |
| 2026-08-26 | **148** (97+51) | **-13** | Scansione Biome JSON full-repo sui 2 cluster. Catch-up schede: **115** casi storici non più in Biome marcati ✅ RISOLTO (include i 3 lasciati aperti nel −102: UNUSED-072/073/219, più fix successivi tra cui AffiliateSuggestionBox UNUSED-090/091). **Nuovi unused:** 0. Nessuna riclassificazione aggressiva “eliminabile” senza evidenza. Schede aperte rimanenti: 148. |

### Template per audit futuri

1. Rieseguire Biome JSON sui due cluster.
2. Diffare ID per file:riga:nome vs questa baseline.
3. Aggiornare tabella History: resolved / reclassified / new / remaining uncertainty.
4. Non creare un nuovo file: aggiornare **questo** documento.

---

*Audit iniziale 2026-08-24 — 263/263 classificati. Aggiornamento scansione 2026-08-26: 148 unused aperti (97+51); storico schede conservato.*
