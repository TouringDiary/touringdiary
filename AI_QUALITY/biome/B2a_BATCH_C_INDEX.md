# B2a Batch C — Indice audit specialistico

> **Obiettivo:** classificazione fine delle **143** occorrenze livello C (`noExplicitAny`) per abilitare batch omogenei.  
> SoT: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md) · Audit B2a: [`B2a_noExplicitAny_AUDIT.md`](./B2a_noExplicitAny_AUDIT.md) · Inventario 446: [`B2a_noExplicitAny_INVENTORY_446.md`](./B2a_noExplicitAny_INVENTORY_446.md)  
> **Metodologia audit:** SoT Parte 5 **§21 / §21.1** e **§22**.  
> **Stato:** **Batch C completo** — **C1–C6 ACCETTATI** (chiusi). C1 live **71→0**.

---

## Panoramica

| Gruppo | File audit | Occorrenze | Stato |
|----|----|---:|----|
| **C1 — AI / Gemini** | [`B2a_C1_AI_AUDIT.md`](./B2a_C1_AI_AUDIT.md) (P1) · [`B2a_C1_AI_AUDIT_P2.md`](./B2a_C1_AI_AUDIT_P2.md) (P2) · PO: [`B2a_C1_START_PO_AUDIT.md`](./B2a_C1_START_PO_AUDIT.md) | **67** classif. → **71** live → **0** | **ACCETTATO** (chiuso) |
| **C2 — Parsers** | [`B2a_C2_PARSERS_AUDIT.md`](./B2a_C2_PARSERS_AUDIT.md) | **7** | **ACCETTATO** (chiuso) |
| **C3 — Domain** | [`B2a_C3_DOMAIN_AUDIT.md`](./B2a_C3_DOMAIN_AUDIT.md) · PO: [`B2a_C3_START_PO_AUDIT.md`](./B2a_C3_START_PO_AUDIT.md) | **45** censiti → **0** residui context | **ACCETTATO** (chiuso) |
| **C4 — Services** | [`B2a_C4_SERVICES_AUDIT.md`](./B2a_C4_SERVICES_AUDIT.md) | **13** classif. → **15** live → **0** | **ACCETTATO** (chiuso) |
| **C5 — Community** | [`B2a_C5_COMMUNITY_AUDIT.md`](./B2a_C5_COMMUNITY_AUDIT.md) · PO: [`B2a_C5_START_PO_AUDIT.md`](./B2a_C5_START_PO_AUDIT.md) | **2** classif. → **8** live → **0** | **ACCETTATO** (chiuso) |
| **C6 — Utils** | [`B2a_C6_UTILS_AUDIT.md`](./B2a_C6_UTILS_AUDIT.md) | **9** classif. → **15** live → **0** | **ACCETTATO** (chiuso) |
| **Totale C (classificazione)** | — | **143** | Foto classificazione invariata |

Verifica classificazione: 67+7+45+13+2+9 = **143**.  
Residuo SoT `noExplicitAny` corrente: vedi [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md) (**0**).  
Residuo progetto corrente (SoT 2026-08-08): **1432** (snapshot post-C / pre-R50 storici: es. **1671** — solo History).  
Residui post-C: piano R50 → [`B2a_R50_RESIDUAL_ANY_AUDIT.md`](./B2a_R50_RESIDUAL_ANY_AUDIT.md) (**R1 + RP-* + RP-Residual ACCETTATI**; residuo live **0**; **B2a COMPLETATO**; L2 corrente = **B2b IN CORSO**).

### Residuo vivo gruppi chiusi

| Gruppo | File perimetro | Hit |
|----|----|---:|
| C2–C6 | rispettivi perimetri live | **0** |

### Perimetro live C1 (operativo proposto)

| File | Hit |
|----|---:|
| 18 file AI classificazione storica | **67** |
| `src/hooks/useCityGenerator.ts` (facade — leftover B co-locato al flusso) | **4** |
| **Totale C1 proposto** | **71** / **19** file |

---

## Dipendenze tra gruppi

| Da | Verso | Motivo |
|----|----|----|
| C1 AI | C3 Domain | DTO/generatori spesso finiscono in tipi City/context |
| C2 Parsers | C3 Domain | Output parser = modelli City (**C2 chiuso**) |
| C4 Services | C3 Domain / C2 | Mapping e payload (**C4 chiuso**) |
| C5 Community | C3 Domain | `SuggestionRequest` / `SuggestionType` (**chiuso**) |
| C6 Utils | C3 Domain | Undo/rankings (**chiuso**) |

---

## Cronologia esecuzione Batch C

1. ~~C2 unico batch~~ — **ACCETTATO**.  
2. ~~C3 unico batch~~ — **ACCETTATO**.  
3. ~~C4 unico batch~~ — **ACCETTATO**.  
4. ~~C5 unico batch~~ — **ACCETTATO**.  
5. ~~C6 unico batch~~ — **ACCETTATO**.  
6. ~~C1 unico batch~~ — **ACCETTATO** (71→0).  
7. ~~Batch C completo~~ — **C1–C6 ACCETTATI**. Prossimo: residui B / altri L2.

---

## Criteri di suddivisione usati

- **C1** path/tag AI·Gemini·generator·useAi·AdminAi + facade `useCityGenerator` (contratto flusso)  
- **C2** `src/services/city/parsers/**`  
- **C3** `types` / `context` / `constants` + UI domain City/Sponsor  
- **C4** `src/services/**` esclusi AI/parsers/community  
- **C5** community / suggestion (`SuggestionModal` + `suggestionService`; leftover B co-locati)  
- **C6** undo packing C, rankings, ImportStatsBar  

Fonte righe: inventario classificazione B2a (livello **C** only) + rivalidazione live per esecuzione + leftover B co-locati al contratto (criterio C4/C5).
