# B2a Batch C5 — Community

> Audit specialistico **Batch C** — sottogruppo tematico.  
> **Nessuna bonifica codice** in questo documento.  
> Fonte classificazione: [`B2a_noExplicitAny_AUDIT.md`](./B2a_noExplicitAny_AUDIT.md) · Inventario storico: [`B2a_noExplicitAny_INVENTORY_446.md`](./B2a_noExplicitAny_INVENTORY_446.md)  
> Indice: [`B2a_BATCH_C_INDEX.md`](./B2a_BATCH_C_INDEX.md) · **PO avvio:** [`B2a_C5_START_PO_AUDIT.md`](./B2a_C5_START_PO_AUDIT.md)  
> Dominio: Suggestion / community (modal + suggestionService)  
> Stato: **ACCETTATO — batch chiuso** (2026-08-07, ACCETTO PO formale). Perimetro operativo live: **8** `noExplicitAny` / **2** file → **0**. `interactionService` escluso (residuo B). C1 non toccato.

---

## 1. Perimetro operativo live (SoT esecuzione)

> La classificazione storica censiva **2** hit C. Il perimetro **operativo** include leftover **B** co-locati in `suggestionService.ts` (criterio C4).

| Metrica | Classificazione storica | Live operativo |
|----|----:|----:|
| Occorrenze | **2** | **8** |
| File | **2** | **2** |

| File | Hit live | Origine |
|----|---:|----|
| `src/components/modals/SuggestionModal.tsx` | 1 | C |
| `src/services/community/suggestionService.ts` | 7 | 1×C + 6×B co-locati |
| **Totale** | **8** | |

### Esclusi

| File | Hit | Motivo |
|----|---:|----|
| `src/services/community/interactionService.ts` | 1 | Residuo B, file separato — fuori C5 |

---

## 2. Occorrenze (dettaglio live)

### C-5_COMMUNITY-1 — `SuggestionModal.tsx:194`

| Campo | Valore |
|----|----|
| **Snippet** | `category: formData.category as any,` |
| **Tipologia** | Cast UI → union dominio |
| **Rischio** | Medio |
| **Strategia** | Narrow verso `SuggestionRequest['details']['category']` (già in C3) |
| **Batch meccanico?** | No — contratto dominio |

### C-5_COMMUNITY-2 — `suggestionService.ts:32`

| Campo | Valore |
|----|----|
| **Snippet** | `(data \|\| []).map((s: any) => ({` (`getAllSuggestionsAsync`) |
| **Tipologia** | Mapper row DB → `SuggestionRequest` |
| **Rischio** | Medio |
| **Origine classif.** | B (co-locato) |

### C-5_COMMUNITY-3 — `suggestionService.ts:61`

| Campo | Valore |
|----|----|
| **Snippet** | `(data \|\| []).map((s: any) => ({` (`getUserSuggestionsAsync`) |
| **Tipologia** | Mapper row DB → `SuggestionRequest` |
| **Rischio** | Medio |
| **Origine classif.** | B (co-locato) |

### C-5_COMMUNITY-4 — `suggestionService.ts:80`

| Campo | Valore |
|----|----|
| **Snippet** | `addSuggestion = async (suggestion: any)` |
| **Tipologia** | Parametro service |
| **Rischio** | Medio |
| **Origine classif.** | **C** |
| **Strategia** | Riuso `SuggestionRequest` / DTO input derivato |

### C-5_COMMUNITY-5 — `suggestionService.ts:119`

| Campo | Valore |
|----|----|
| **Snippet** | `details?: any` (`updateSuggestionStatus`) |
| **Tipologia** | Parametro payload |
| **Rischio** | Medio |
| **Origine classif.** | B (co-locato) |

### C-5_COMMUNITY-6 — `suggestionService.ts:120`

| Campo | Valore |
|----|----|
| **Snippet** | `rejectionMeta?: any` |
| **Tipologia** | Parametro payload |
| **Rischio** | Medio |
| **Origine classif.** | B (co-locato) |

### C-5_COMMUNITY-7 — `suggestionService.ts:123`

| Campo | Valore |
|----|----|
| **Snippet** | `const payload: any = { status, admin_notes: adminNotes }` |
| **Tipologia** | Payload update Supabase |
| **Rischio** | Medio |
| **Origine classif.** | B (co-locato) |

### C-5_COMMUNITY-8 — `suggestionService.ts:145`

| Campo | Valore |
|----|----|
| **Snippet** | `applySuggestion = async (id: string, data: any, months: number)` |
| **Tipologia** | Parametro service |
| **Rischio** | Medio |
| **Origine classif.** | B (co-locato) |

---

## Statistiche (live operativo)

| Metrica | Valore |
|----|----:|
| Occorrenze live | **8** |
| File | **2** |
| Rischio complessivo | **Medio** |
| Tipi condivisi da creare | **0** (riuso C3) |
| Unico batch (§22) | **Sì** |

### Distribuzione per file

| File | Occorrenze | Priorità |
|------|-----------:|----------|
| `src/services/community/suggestionService.ts` | 7 | Alta |
| `src/components/modals/SuggestionModal.tsx` | 1 | Alta |

### Distribuzione per rischio

| Rischio | Occorrenze |
|----------|-----------:|
| Basso | 0 |
| Medio | 8 |
| Alto | 0 |

> **Nota:** non esiste piano mini-batch obbligatorio. Inventario storico C5-M1/M2 superseduto da [`B2a_C5_START_PO_AUDIT.md`](./B2a_C5_START_PO_AUDIT.md) (unico batch).
