# B2a Batch C2 — Parsers City

> Audit specialistico **Batch C** — sottogruppo tematico.  
> **Nessuna bonifica codice** in questo documento.  
> Fonte classificazione: [`B2a_noExplicitAny_AUDIT.md`](./B2a_noExplicitAny_AUDIT.md) · Inventario storico: [`B2a_noExplicitAny_INVENTORY_446.md`](./B2a_noExplicitAny_INVENTORY_446.md)  
> Indice: [`B2a_BATCH_C_INDEX.md`](./B2a_BATCH_C_INDEX.md)  
> Dominio: Parser contenuti/entità/media City (`src/services/city/parsers/**`)  
> Stato: **ACCETTATO / CHIUSO** (2026-08-06) — bonifica completata; Quality Delta + smoke OK

---

## 1. Perimetro

| Metrica | Valore |
|----|----:|
| Occorrenze in questo gruppo | **7** |
| File coinvolti | **6** |
| Cartelle (prefisso) | **1** |

---

## 2. Occorrenze (dettaglio)

### C-2_PARSERS-1 — `src/services/city/parsers/content/parseRatings.ts:6`

| Campo | Valore |
|----|----|
| **File** | `src/services/city/parsers/content/parseRatings.ts` |
| **Riga** | 6 |
| **Snippet** | `export const parseRatings = (raw: any): Record<string, number> => {` |
| **Motivo classificazione C** | API service con any (contesto: parametro/servizio : any) |
| **Tipologia any** | Payload JSON |
| **Rischio modifica** | Medio |
| **Contratto coinvolto** | Raw JSON → entity City |
| **Dato atteso** | parser helpers + tipi City/entity |
| **Strategia consigliata** | Tipizzare input parser (`unknown` + narrowing) e output con tipi City esistenti |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | JSON |

### C-2_PARSERS-2 — `src/services/city/parsers/entities/parseEvent.ts:9`

| Campo | Valore |
|----|----|
| **File** | `src/services/city/parsers/entities/parseEvent.ts` |
| **Riga** | 9 |
| **Snippet** | `export const parseEvent = (raw: any): CityEvent => {` |
| **Motivo classificazione C** | API service con any (contesto: parametro/servizio : any) |
| **Tipologia any** | Payload JSON |
| **Rischio modifica** | Medio |
| **Contratto coinvolto** | Raw JSON → entity City |
| **Dato atteso** | parser helpers + tipi City/entity |
| **Strategia consigliata** | Tipizzare input parser (`unknown` + narrowing) e output con tipi City esistenti |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | JSON |

### C-2_PARSERS-3 — `src/services/city/parsers/entities/parseGuide.ts:10`

| Campo | Valore |
|----|----|
| **File** | `src/services/city/parsers/entities/parseGuide.ts` |
| **Riga** | 10 |
| **Snippet** | `export const parseGuide = (raw: any): CityGuide => {` |
| **Motivo classificazione C** | API service con any (contesto: parametro/servizio : any) |
| **Tipologia any** | Payload JSON |
| **Rischio modifica** | Medio |
| **Contratto coinvolto** | Raw JSON → entity City |
| **Dato atteso** | parser helpers + tipi City/entity |
| **Strategia consigliata** | Tipizzare input parser (`unknown` + narrowing) e output con tipi City esistenti |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | JSON |

### C-2_PARSERS-4 — `src/services/city/parsers/entities/parseService.ts:8`

| Campo | Valore |
|----|----|
| **File** | `src/services/city/parsers/entities/parseService.ts` |
| **Riga** | 8 |
| **Snippet** | `export const parseService = (raw: any): CityService => {` |
| **Motivo classificazione C** | API service con any (contesto: parametro/servizio : any) |
| **Tipologia any** | Payload JSON |
| **Rischio modifica** | Medio |
| **Contratto coinvolto** | Raw JSON → entity City |
| **Dato atteso** | parser helpers + tipi City/entity |
| **Strategia consigliata** | Tipizzare input parser (`unknown` + narrowing) e output con tipi City esistenti |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | JSON |

### C-2_PARSERS-5 — `src/services/city/parsers/entities/parseTourOperator.ts:10`

| Campo | Valore |
|----|----|
| **File** | `src/services/city/parsers/entities/parseTourOperator.ts` |
| **Riga** | 10 |
| **Snippet** | `export const parseTourOperator = (raw: any): CityTourOperator => {` |
| **Motivo classificazione C** | API service con any (contesto: parametro/servizio : any) |
| **Tipologia any** | Payload JSON |
| **Rischio modifica** | Medio |
| **Contratto coinvolto** | Raw JSON → entity City |
| **Dato atteso** | parser helpers + tipi City/entity |
| **Strategia consigliata** | Tipizzare input parser (`unknown` + narrowing) e output con tipi City esistenti |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | JSON |

### C-2_PARSERS-6 — `src/services/city/parsers/media/parseGallery.ts:10`

| Campo | Valore |
|----|----|
| **File** | `src/services/city/parsers/media/parseGallery.ts` |
| **Riga** | 10 |
| **Snippet** | `export const parseGallery = (raw: any): MediaAsset[] => {` |
| **Motivo classificazione C** | API service con any (contesto: parametro/servizio : any) |
| **Tipologia any** | Payload JSON |
| **Rischio modifica** | Medio |
| **Contratto coinvolto** | Raw JSON → entity City |
| **Dato atteso** | parser helpers + tipi City/entity |
| **Strategia consigliata** | Tipizzare input parser (`unknown` + narrowing) e output con tipi City esistenti |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | JSON |

### C-2_PARSERS-7 — `src/services/city/parsers/media/parseGallery.ts:14`

| Campo | Valore |
|----|----|
| **File** | `src/services/city/parsers/media/parseGallery.ts` |
| **Riga** | 14 |
| **Snippet** | `rawArray.forEach((item: any, index: number) => {` |
| **Motivo classificazione C** | API service con any (contesto: parametro/servizio : any) |
| **Tipologia any** | Payload JSON |
| **Rischio modifica** | Medio |
| **Contratto coinvolto** | Raw JSON → entity City |
| **Dato atteso** | parser helpers + tipi City/entity |
| **Strategia consigliata** | Tipizzare input parser (`unknown` + narrowing) e output con tipi City esistenti |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | JSON |


---

## Statistiche

### Statistiche generali

| Metrica | Valore |
|----|----:|
| Occorrenze analizzate | **7** |
| File coinvolti | **6** |
| Cartelle coinvolte | **1** |
| Tipi condivisi probabilmente da introdurre | **7** (flag `newT` sì) |
| Contratti di dominio coinvolti | **0** (stima per occorrenza in perimetro) |
| API/servizi coinvolti | **0** (stima per occorrenza in perimetro) |
| Livello di rischio complessivo | **Medio** |

### Distribuzione per tipologia

| Tipologia | Occorrenze | File |
|-----------|-----------:|-----:|
| Payload JSON | 7 | 6 |
| Parser | 0 | 0 |
| Gemini / AI | 0 | 0 |
| Supabase | 0 | 0 |
| Domain Model | 0 | 0 |
| Shared Types | 0 | 0 |
| Utility | 0 | 0 |
| Mapper | 0 | 0 |
| Service | 0 | 0 |
| Altro | 0 | 0 |

### Distribuzione per file

| File | Occorrenze | Priorità | Note |
|------|-----------:|----------|------|
| `src/services/city/parsers/media/parseGallery.ts` | 2 | Alta | Classificazione C — review dominio |
| `src/services/city/parsers/content/parseRatings.ts` | 1 | Alta | Classificazione C — review dominio |
| `src/services/city/parsers/entities/parseEvent.ts` | 1 | Alta | Classificazione C — review dominio |
| `src/services/city/parsers/entities/parseGuide.ts` | 1 | Media | Classificazione C — review dominio |
| `src/services/city/parsers/entities/parseService.ts` | 1 | Media | Classificazione C — review dominio |
| `src/services/city/parsers/entities/parseTourOperator.ts` | 1 | Media | Classificazione C — review dominio |

### Distribuzione per rischio

| Rischio | Occorrenze |
|----------|-----------:|
| Basso | 0 |
| Medio | 7 |
| Alto | 0 |

### Stima di suddivisione (futuri mini-batch)

> Dati oggettivi per priorità future — **non** è un piano di bonifica autorizzato.

| Mini-batch | File coinvolti | Occorrenze | Rischio | Dipendenze | Ordine consigliato |
|----|----|---:|----|----|---:|
| C2-M1 | `src/services/city/parsers/media/parseGallery.ts` | 2 | Medio | Locale al file | 1 |
| C2-M2 | `src/services/city/parsers/content/parseRatings.ts` | 1 | Medio | Locale al file | 2 |
| C2-M3 | `src/services/city/parsers/entities/parseEvent.ts` | 1 | Medio | Locale al file | 3 |
| C2-M4 | `src/services/city/parsers/entities/parseGuide.ts` | 1 | Medio | Locale al file | 4 |
| C2-M5 | `src/services/city/parsers/entities/parseService.ts` | 1 | Medio | Locale al file | 5 |
| C2-M6 | `src/services/city/parsers/entities/parseTourOperator.ts` | 1 | Medio | Locale al file | 6 |
