# B2a Batch C1 — AI / Gemini (Parte 2/2)

> Audit specialistico **Batch C** — sottogruppo tematico.  
> **Nessuna bonifica codice** in questo documento.  
> Fonte classificazione: [`B2a_noExplicitAny_AUDIT.md`](./B2a_noExplicitAny_AUDIT.md) · Inventario storico: [`B2a_noExplicitAny_INVENTORY_446.md`](./B2a_noExplicitAny_INVENTORY_446.md)  
> Indice: [`B2a_BATCH_C_INDEX.md`](./B2a_BATCH_C_INDEX.md)  
> Dominio: Contratti AI, hook admin AI, generatori, analytics Gemini, planner  
> Stato: **ACCETTATO** (classificazione storica chiusa). PO live: [`B2a_C1_START_PO_AUDIT.md`](./B2a_C1_START_PO_AUDIT.md)  
> **Parte 1/2:** [`B2a_C1_AI_AUDIT.md`](./B2a_C1_AI_AUDIT.md) (C-1_AI-1 … C-1_AI-40 + Perimetro)

---

## Continuazione occorrenze

> Classificazione storica invariata: **67** occorrenze / **18** file / **7** cartelle (totale su Parte 1 + Parte 2).  
> Perimetro live (71/19/+ `useCityGenerator`) → solo [`B2a_C1_START_PO_AUDIT.md`](./B2a_C1_START_PO_AUDIT.md).

> **Questa parte:** schede **C-1_AI-41** … **C-1_AI-67** + **Statistiche** finali.

---

## 2. Occorrenze (dettaglio, continua)

### C-1_AI-41 — `src/hooks/admin/useAiTargetedSearch.ts:61`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiTargetedSearch.ts` |
| **Riga** | 61 |
| **Snippet** | `category: correctCategory as any,` |
| **Motivo classificazione C** | Cast su output modello / schema AI (contesto: as any su risposta AI/Gemini) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem |

### C-1_AI-42 — `src/hooks/admin/useAiTaskRunner.ts:40`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiTaskRunner.ts` |
| **Riga** | 40 |
| **Snippet** | `const savedSession = getStorageItem<any>(SESSION_KEY, null);` |
| **Motivo classificazione C** | Parametro di tipo any in generic (contesto: generic Promise/Array/Record<any>) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem |

### C-1_AI-43 — `src/hooks/admin/useAiValidation.ts:153`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiValidation.ts` |
| **Riga** | 153 |
| **Snippet** | `category: verified.category as any,` |
| **Motivo classificazione C** | Cast su output modello / schema AI (contesto: as any su risposta AI/Gemini) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem |

### C-1_AI-44 — `src/hooks/admin/useAiValidation.ts:154`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiValidation.ts` |
| **Riga** | 154 |
| **Snippet** | `subCategory: verified.subCategory as any,` |
| **Motivo classificazione C** | Cast su output modello / schema AI (contesto: as any su risposta AI/Gemini) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem |

### C-1_AI-45 — `src/services/ai/aiPlanner.ts:76`

| Campo | Valore |
|----|----|
| **File** | `src/services/ai/aiPlanner.ts` |
| **Riga** | 76 |
| **Snippet** | `availablePois: any[],` |
| **Motivo classificazione C** | Payload dinamico tipizzato any (contesto: parametro data/response : any) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem,JSON |

### C-1_AI-46 — `src/services/ai/aiPlanner.ts:77`

| Campo | Valore |
|----|----|
| **File** | `src/services/ai/aiPlanner.ts` |
| **Riga** | 77 |
| **Snippet** | `config: any,` |
| **Motivo classificazione C** | Payload dinamico tipizzato any (contesto: parametro data/response : any) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem,JSON |

### C-1_AI-47 — `src/services/ai/aiPlanner.ts:84`

| Campo | Valore |
|----|----|
| **File** | `src/services/ai/aiPlanner.ts` |
| **Riga** | 84 |
| **Snippet** | `(p: any) =>` |
| **Motivo classificazione C** | Payload dinamico tipizzato any (contesto: parametro data/response : any) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem,JSON |

### C-1_AI-48 — `src/services/ai/aiPlanner.ts:95`

| Campo | Valore |
|----|----|
| **File** | `src/services/ai/aiPlanner.ts` |
| **Riga** | 95 |
| **Snippet** | `const dayLog = dailyLogs.find((l: any) => l.dayIndex === i) \ |
| **Motivo classificazione C** | Payload dinamico tipizzato any (contesto: parametro data/response : any) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem,JSON |

### C-1_AI-49 — `src/services/ai/aiPlanner.ts:187`

| Campo | Valore |
|----|----|
| **File** | `src/services/ai/aiPlanner.ts` |
| **Riga** | 187 |
| **Snippet** | `return data.map((day: any) => ({` |
| **Motivo classificazione C** | Payload dinamico tipizzato any (contesto: parametro data/response : any) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem,JSON |

### C-1_AI-50 — `src/services/ai/aiPlanner.ts:197`

| Campo | Valore |
|----|----|
| **File** | `src/services/ai/aiPlanner.ts` |
| **Riga** | 197 |
| **Snippet** | `availablePois: any[],` |
| **Motivo classificazione C** | Payload dinamico tipizzato any (contesto: parametro data/response : any) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem,JSON |

### C-1_AI-51 — `src/services/ai/aiPlanner.ts:209`

| Campo | Valore |
|----|----|
| **File** | `src/services/ai/aiPlanner.ts` |
| **Riga** | 209 |
| **Snippet** | `.map((p: any) => 'ID:${p.id}\ |
| **Motivo classificazione C** | Payload dinamico tipizzato any (contesto: parametro data/response : any) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem,JSON |

### C-1_AI-52 — `src/services/ai/generators/listGenerator.ts:15`

| Campo | Valore |
|----|----|
| **File** | `src/services/ai/generators/listGenerator.ts` |
| **Riga** | 15 |
| **Snippet** | `): Promise<any[]> => {` |
| **Motivo classificazione C** | Parametro di tipo any in generic (contesto: generic Promise/Array/Record<any>) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem |

### C-1_AI-53 — `src/services/ai/generators/listGenerator.ts:50`

| Campo | Valore |
|----|----|
| **File** | `src/services/ai/generators/listGenerator.ts` |
| **Riga** | 50 |
| **Snippet** | `return items.map((item: any) => ({` |
| **Motivo classificazione C** | Payload dinamico tipizzato any (contesto: parametro data/response : any) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem,JSON |

### C-1_AI-54 — `src/services/ai/generators/listGenerator.ts:64`

| Campo | Valore |
|----|----|
| **File** | `src/services/ai/generators/listGenerator.ts` |
| **Riga** | 64 |
| **Snippet** | `export const refineServiceData = async (cityName: string, draftData: any): Promise<any> => {` |
| **Motivo classificazione C** | Payload dinamico tipizzato any (contesto: parametro data/response : any) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem,JSON |

### C-1_AI-55 — `src/services/ai/generators/listGenerator.ts:64`

| Campo | Valore |
|----|----|
| **File** | `src/services/ai/generators/listGenerator.ts` |
| **Riga** | 64 |
| **Snippet** | `export const refineServiceData = async (cityName: string, draftData: any): Promise<any> => {` |
| **Motivo classificazione C** | Payload dinamico tipizzato any (contesto: parametro data/response : any) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem,JSON |

### C-1_AI-56 — `src/services/ai/generators/listGenerator.ts:87`

| Campo | Valore |
|----|----|
| **File** | `src/services/ai/generators/listGenerator.ts` |
| **Riga** | 87 |
| **Snippet** | `export const analyzeEventInterest = async (eventName: string, cityName: string): Promise<any> => {` |
| **Motivo classificazione C** | Parametro di tipo any in generic (contesto: generic Promise/Array/Record<any>) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem |

### C-1_AI-57 — `src/services/ai/generators/peopleGenerator.ts:11`

| Campo | Valore |
|----|----|
| **File** | `src/services/ai/generators/peopleGenerator.ts` |
| **Riga** | 11 |
| **Snippet** | `): Promise<any[]> => {` |
| **Motivo classificazione C** | Parametro di tipo any in generic (contesto: generic Promise/Array/Record<any>) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem |

### C-1_AI-58 — `src/services/ai/generators/peopleGenerator.ts:35`

| Campo | Valore |
|----|----|
| **File** | `src/services/ai/generators/peopleGenerator.ts` |
| **Riga** | 35 |
| **Snippet** | `export const enrichPersonData = async (personName: string, cityName: string): Promise<any> => {` |
| **Motivo classificazione C** | Parametro di tipo any in generic (contesto: generic Promise/Array/Record<any>) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem |

### C-1_AI-59 — `src/services/ai/generators/poiGenerator.ts:61`

| Campo | Valore |
|----|----|
| **File** | `src/services/ai/generators/poiGenerator.ts` |
| **Riga** | 61 |
| **Snippet** | `existingPois: any[],` |
| **Motivo classificazione C** | Payload dinamico tipizzato any (contesto: parametro data/response : any) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem,JSON |

### C-1_AI-60 — `src/services/ai/generators/poiGenerator.ts:73`

| Campo | Valore |
|----|----|
| **File** | `src/services/ai/generators/poiGenerator.ts` |
| **Riga** | 73 |
| **Snippet** | `let aiResults: any[] = [];` |
| **Motivo classificazione C** | Payload dinamico tipizzato any (contesto: parametro data/response : any) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem,JSON |

### C-1_AI-61 — `src/services/ai/generators/poiGenerator.ts:81`

| Campo | Valore |
|----|----|
| **File** | `src/services/ai/generators/poiGenerator.ts` |
| **Riga** | 81 |
| **Snippet** | `return aiResults.map((item: any) => {` |
| **Motivo classificazione C** | Payload dinamico tipizzato any (contesto: parametro data/response : any) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem,JSON |

### C-1_AI-62 — `src/services/ai/generators/poiGenerator.ts:120`

| Campo | Valore |
|----|----|
| **File** | `src/services/ai/generators/poiGenerator.ts` |
| **Riga** | 120 |
| **Snippet** | `): Promise<any[]> => {` |
| **Motivo classificazione C** | Parametro di tipo any in generic (contesto: generic Promise/Array/Record<any>) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem |

### C-1_AI-63 — `src/services/ai/generators/poiGenerator.ts:155`

| Campo | Valore |
|----|----|
| **File** | `src/services/ai/generators/poiGenerator.ts` |
| **Riga** | 155 |
| **Snippet** | `candidates: any[],` |
| **Motivo classificazione C** | Payload dinamico tipizzato any (contesto: parametro data/response : any) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem,JSON |

### C-1_AI-64 — `src/services/ai/generators/poiGenerator.ts:158`

| Campo | Valore |
|----|----|
| **File** | `src/services/ai/generators/poiGenerator.ts` |
| **Riga** | 158 |
| **Snippet** | `): Promise<any[]> => {` |
| **Motivo classificazione C** | Parametro di tipo any in generic (contesto: generic Promise/Array/Record<any>) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem |

### C-1_AI-65 — `src/services/ai/generators/poiGenerator.ts:176`

| Campo | Valore |
|----|----|
| **File** | `src/services/ai/generators/poiGenerator.ts` |
| **Riga** | 176 |
| **Snippet** | `return safeResults.map((r: any) => {` |
| **Motivo classificazione C** | Payload dinamico tipizzato any (contesto: parametro data/response : any) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem,JSON |

### C-1_AI-66 — `src/services/ai/generators/poiGenerator.ts:191`

| Campo | Valore |
|----|----|
| **File** | `src/services/ai/generators/poiGenerator.ts` |
| **Riga** | 191 |
| **Snippet** | `export const regeneratePoiData = async (poiName: string, cityName: string): Promise<any> => {` |
| **Motivo classificazione C** | Parametro di tipo any in generic (contesto: generic Promise/Array/Record<any>) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem |

### C-1_AI-67 — `src/services/ai/generators/qualityGenerator.ts:71`

| Campo | Valore |
|----|----|
| **File** | `src/services/ai/generators/qualityGenerator.ts` |
| **Riga** | 71 |
| **Snippet** | `return rawResults.map((r: any) => ({` |
| **Motivo classificazione C** | Payload dinamico tipizzato any (contesto: parametro data/response : any) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem,JSON |


---

## Statistiche

### Statistiche generali

| Metrica | Valore |
|----|----:|
| Occorrenze analizzate | **67** |
| File coinvolti | **18** |
| Cartelle coinvolte | **7** |
| Tipi condivisi probabilmente da introdurre | **67** (flag `newT` sì) |
| Contratti di dominio coinvolti | **67** (stima per occorrenza in perimetro) |
| API/servizi coinvolti | **67** (stima per occorrenza in perimetro) |
| Livello di rischio complessivo | **Alto** |

### Distribuzione per tipologia

| Tipologia | Occorrenze | File |
|-----------|-----------:|-----:|
| Payload JSON | 0 | 0 |
| Parser | 0 | 0 |
| Gemini / AI | 67 | 18 |
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
| `src/hooks/admin/useAiMagicCity.ts` | 16 | Alta | Classificazione C — review dominio |
| `src/components/admin/economics/AdminAiAnalyticsV4.tsx` | 8 | Alta | Classificazione C — review dominio |
| `src/services/ai/generators/poiGenerator.ts` | 8 | Alta | Classificazione C — review dominio |
| `src/services/ai/aiPlanner.ts` | 7 | Media | Classificazione C — review dominio |
| `src/hooks/admin/useAiCompleteCity.ts` | 5 | Media | Classificazione C — review dominio |
| `src/services/ai/generators/listGenerator.ts` | 5 | Media | Classificazione C — review dominio |
| `src/components/modals/cityInfo/ServiceAiHunter.tsx` | 2 | Media | Classificazione C — review dominio |
| `src/data/ai/prompts.ts` | 2 | Media | Classificazione C — review dominio |
| `src/hooks/admin/people/usePeopleAI.ts` | 2 | Normale | Classificazione C — review dominio |
| `src/hooks/admin/useAiFlashSearch.ts` | 2 | Normale | Classificazione C — review dominio |
| `src/hooks/admin/useAiValidation.ts` | 2 | Normale | Classificazione C — review dominio |
| `src/services/ai/generators/peopleGenerator.ts` | 2 | Normale | Classificazione C — review dominio |
| `src/components/aiPlanner/AiPlannerTimeline.tsx` | 1 | Normale | Classificazione C — review dominio |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsPanel.tsx` | 1 | Normale | Classificazione C — review dominio |
| `src/data/ai/eventTaxonomy.ts` | 1 | Normale | Classificazione C — review dominio |
| `src/hooks/admin/useAiTargetedSearch.ts` | 1 | Normale | Classificazione C — review dominio |
| `src/hooks/admin/useAiTaskRunner.ts` | 1 | Normale | Classificazione C — review dominio |
| `src/services/ai/generators/qualityGenerator.ts` | 1 | Normale | Classificazione C — review dominio |

### Distribuzione per rischio

| Rischio | Occorrenze |
|----------|-----------:|
| Basso | 0 |
| Medio | 0 |
| Alto | 67 |

### Stima di suddivisione (futuri mini-batch)

> Dati oggettivi per priorità future — **non** è un piano di bonifica autorizzato.

| Mini-batch | File coinvolti | Occorrenze | Rischio | Dipendenze | Ordine consigliato |
|----|----|---:|----|----|---:|
| C1-M1 | `src/hooks/admin/useAiMagicCity.ts` | 16 | Alto | Locale al file | 1 |
| C1-M2 | `src/components/admin/economics/AdminAiAnalyticsV4.tsx` | 8 | Alto | Locale al file | 2 |
| C1-M3 | `src/services/ai/generators/poiGenerator.ts` | 8 | Alto | Locale al file | 3 |
| C1-M4 | `src/services/ai/aiPlanner.ts` | 7 | Alto | Locale al file | 4 |
| C1-M5 | `src/hooks/admin/useAiCompleteCity.ts` | 5 | Alto | Locale al file | 5 |
| C1-M6 | `src/services/ai/generators/listGenerator.ts` | 5 | Alto | Locale al file | 6 |
| C1-M7 | `src/components/modals/cityInfo/ServiceAiHunter.tsx` | 2 | Alto | Locale al file | 7 |
| C1-M8 | `src/data/ai/prompts.ts` | 2 | Alto | Locale al file | 8 |
| C1-Mrest | `src/hooks/admin/people/usePeopleAI.ts`, `src/hooks/admin/useAiFlashSearch.ts`, `src/hooks/admin/useAiValidation.ts`, `src/services/ai/generators/peopleGenerator.ts`, `src/components/aiPlanner/AiPlannerTimeline.tsx`, `src/components/features/diary/packing_list/suitcase/AiSuggestionsPanel.tsx`, `src/data/ai/eventTaxonomy.ts`, `src/hooks/admin/useAiTargetedSearch.ts`, `src/hooks/admin/useAiTaskRunner.ts`, `src/services/ai/generators/qualityGenerator.ts` | 14 | Medio | Dopo i mini ad alta concentrazione | 9 |
