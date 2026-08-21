# B2a Batch C1 — AI / Gemini (Parte 1/2)

> Audit specialistico **Batch C** — sottogruppo tematico.  
> **Nessuna bonifica codice** in questo documento.  
> Fonte classificazione: [`B2a_noExplicitAny_AUDIT.md`](./B2a_noExplicitAny_AUDIT.md) · Inventario storico: [`B2a_noExplicitAny_INVENTORY_446.md`](./B2a_noExplicitAny_INVENTORY_446.md)  
> Indice: [`B2a_BATCH_C_INDEX.md`](./B2a_BATCH_C_INDEX.md)  
> Dominio: Contratti AI, hook admin AI, generatori, analytics Gemini, planner  
> Stato: **ACCETTATO** (classificazione storica chiusa). PO live: [`B2a_C1_START_PO_AUDIT.md`](./B2a_C1_START_PO_AUDIT.md)  
> **Parte 2/2:** [`B2a_C1_AI_AUDIT_P2.md`](./B2a_C1_AI_AUDIT_P2.md) (C-1_AI-41 … C-1_AI-67 + Statistiche)

---

## 1. Perimetro

> Questo documento inventaria la **classificazione storica** del gruppo C1 (fotografia audit). Non è il perimetro live di esecuzione.

| Metrica | Valore |
|----|----:|
| Occorrenze | **67** |
| File coinvolti | **18** |
| Cartelle (prefisso) | **7** |

> Il perimetro **live** di esecuzione (**71** occorrenze / **19** file / **8** cartelle, inclusa la facade `src/hooks/useCityGenerator.ts`) è documentato esclusivamente in [`B2a_C1_START_PO_AUDIT.md`](./B2a_C1_START_PO_AUDIT.md). Non modifica questa classificazione storica e **non** compare nelle schede seguenti.

> **Questa parte:** schede **C-1_AI-1** … **C-1_AI-40** (componenti, data AI, hook admin fino a `useAiMagicCity`).

---

## 2. Occorrenze (dettaglio)

### C-1_AI-1 — `src/components/admin/economics/AdminAiAnalyticsV4.tsx:16`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/economics/AdminAiAnalyticsV4.tsx` |
| **Riga** | 16 |
| **Snippet** | `const [data, setData] = useState<any>(null);` |
| **Motivo classificazione C** | State/ref React con any (contesto: useState<any…>) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem,React |

### C-1_AI-2 — `src/components/admin/economics/AdminAiAnalyticsV4.tsx:76`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/economics/AdminAiAnalyticsV4.tsx` |
| **Riga** | 76 |
| **Snippet** | `?.reduce((acc: any, s: any) => acc + s.request_count, 0)` |
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

### C-1_AI-3 — `src/components/admin/economics/AdminAiAnalyticsV4.tsx:76`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/economics/AdminAiAnalyticsV4.tsx` |
| **Riga** | 76 |
| **Snippet** | `?.reduce((acc: any, s: any) => acc + s.request_count, 0)` |
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

### C-1_AI-4 — `src/components/admin/economics/AdminAiAnalyticsV4.tsx:106`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/economics/AdminAiAnalyticsV4.tsx` |
| **Riga** | 106 |
| **Snippet** | `{data.feature_stats?.map((s: any) => (` |
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

### C-1_AI-5 — `src/components/admin/economics/AdminAiAnalyticsV4.tsx:153`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/economics/AdminAiAnalyticsV4.tsx` |
| **Riga** | 153 |
| **Snippet** | `{data.user_type_stats?.map((s: any) => {` |
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

### C-1_AI-6 — `src/components/admin/economics/AdminAiAnalyticsV4.tsx:198`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/economics/AdminAiAnalyticsV4.tsx` |
| **Riga** | 198 |
| **Snippet** | `{data.daily_trends?.map((t: any, i: number) => {` |
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

### C-1_AI-7 — `src/components/admin/economics/AdminAiAnalyticsV4.tsx:199`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/economics/AdminAiAnalyticsV4.tsx` |
| **Riga** | 199 |
| **Snippet** | `const maxCost = Math.max(...data.daily_trends.map((d: any) => d.cost)) \ |
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

### C-1_AI-8 — `src/components/admin/economics/AdminAiAnalyticsV4.tsx:225`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/economics/AdminAiAnalyticsV4.tsx` |
| **Riga** | 225 |
| **Snippet** | `const KpiCard = ({ title, value, sub, icon: Icon, color }: any) => {` |
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

### C-1_AI-9 — `src/components/aiPlanner/AiPlannerTimeline.tsx:78`

| Campo | Valore |
|----|----|
| **File** | `src/components/aiPlanner/AiPlannerTimeline.tsx` |
| **Riga** | 78 |
| **Snippet** | `let availablePois: any[] = [];` |
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

### C-1_AI-10 — `src/components/features/diary/packing_list/suitcase/AiSuggestionsPanel.tsx:5`

| Campo | Valore |
|----|----|
| **File** | `src/components/features/diary/packing_list/suitcase/AiSuggestionsPanel.tsx` |
| **Riga** | 5 |
| **Snippet** | `suggestions: any[];` |
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

### C-1_AI-11 — `src/components/modals/cityInfo/ServiceAiHunter.tsx:13`

| Campo | Valore |
|----|----|
| **File** | `src/components/modals/cityInfo/ServiceAiHunter.tsx` |
| **Riga** | 13 |
| **Snippet** | `serviceResults: any[];` |
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

### C-1_AI-12 — `src/components/modals/cityInfo/ServiceAiHunter.tsx:14`

| Campo | Valore |
|----|----|
| **File** | `src/components/modals/cityInfo/ServiceAiHunter.tsx` |
| **Riga** | 14 |
| **Snippet** | `onImport: (item: any) => void;` |
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

### C-1_AI-13 — `src/data/ai/eventTaxonomy.ts:6`

| Campo | Valore |
|----|----|
| **File** | `src/data/ai/eventTaxonomy.ts` |
| **Riga** | 6 |
| **Snippet** | `return getCachedSetting<any[]>(SETTINGS_KEYS.EVENT_CANONICAL_LIST) \ |
| **Motivo classificazione C** | Setting cache JSON tipizzato any (contesto: getCachedSetting<any…>) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem,JSON |

### C-1_AI-14 — `src/data/ai/prompts.ts:59`

| Campo | Valore |
|----|----|
| **File** | `src/data/ai/prompts.ts` |
| **Riga** | 59 |
| **Snippet** | `export const buildVerifyPoisPrompt = (cityName: string, candidates: any[]) => '` |
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

### C-1_AI-15 — `src/data/ai/prompts.ts:123`

| Campo | Valore |
|----|----|
| **File** | `src/data/ai/prompts.ts` |
| **Riga** | 123 |
| **Snippet** | `export const buildRefineServicePrompt = (cityName: string, draftData: any) => '` |
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

### C-1_AI-16 — `src/hooks/admin/people/usePeopleAI.ts:35`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/people/usePeopleAI.ts` |
| **Riga** | 35 |
| **Snippet** | `const [discoveryResults, setDiscoveryResults] = useState<any[]>([]);` |
| **Motivo classificazione C** | State/ref React con any (contesto: useState<any…>) |
| **Tipologia any** | Gemini / AI |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | Risposta Gemini / DTO generator / analytics AI |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Introdurre schema/parser risposta AI; vietato cast cieco; tipizzare state con DTO generatore |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Gem,React |

### C-1_AI-17 — `src/hooks/admin/people/usePeopleAI.ts:52`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/people/usePeopleAI.ts` |
| **Riga** | 52 |
| **Snippet** | `const importDiscoveryPerson = async (person: any) => {` |
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

### C-1_AI-18 — `src/hooks/admin/useAiCompleteCity.ts:55`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiCompleteCity.ts` |
| **Riga** | 55 |
| **Snippet** | `verifyDraftsBatch: any, // Type passed from parent` |
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

### C-1_AI-19 — `src/hooks/admin/useAiCompleteCity.ts:257`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiCompleteCity.ts` |
| **Riga** | 257 |
| **Snippet** | `const savePromises: Promise<any>[] = [];` |
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

### C-1_AI-20 — `src/hooks/admin/useAiCompleteCity.ts:259`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiCompleteCity.ts` |
| **Riga** | 259 |
| **Snippet** | `refinedData.guides.forEach((g: any, i: number) =>` |
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

### C-1_AI-21 — `src/hooks/admin/useAiCompleteCity.ts:273`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiCompleteCity.ts` |
| **Riga** | 273 |
| **Snippet** | `refinedData.tour_operators.forEach((op: any) =>` |
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

### C-1_AI-22 — `src/hooks/admin/useAiCompleteCity.ts:277`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiCompleteCity.ts` |
| **Riga** | 277 |
| **Snippet** | `refinedData.services.forEach((s: any, i: number) =>` |
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

### C-1_AI-23 — `src/hooks/admin/useAiFlashSearch.ts:48`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiFlashSearch.ts` |
| **Riga** | 48 |
| **Snippet** | `(pData.category as any) \ |
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

### C-1_AI-24 — `src/hooks/admin/useAiFlashSearch.ts:55`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiFlashSearch.ts` |
| **Riga** | 55 |
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

### C-1_AI-25 — `src/hooks/admin/useAiMagicCity.ts:37`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiMagicCity.ts` |
| **Riga** | 37 |
| **Snippet** | `verifyDraftsBatch: any, // Type passed from parent` |
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

### C-1_AI-26 — `src/hooks/admin/useAiMagicCity.ts:56`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiMagicCity.ts` |
| **Riga** | 56 |
| **Snippet** | `let rawServicesData: any = {};` |
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

### C-1_AI-27 — `src/hooks/admin/useAiMagicCity.ts:157`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiMagicCity.ts` |
| **Riga** | 157 |
| **Snippet** | `let generalData: any = {},` |
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

### C-1_AI-28 — `src/hooks/admin/useAiMagicCity.ts:158`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiMagicCity.ts` |
| **Riga** | 158 |
| **Snippet** | `statsData: any = {},` |
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

### C-1_AI-29 — `src/hooks/admin/useAiMagicCity.ts:159`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiMagicCity.ts` |
| **Riga** | 159 |
| **Snippet** | `historyData: any = {},` |
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

### C-1_AI-30 — `src/hooks/admin/useAiMagicCity.ts:160`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiMagicCity.ts` |
| **Riga** | 160 |
| **Snippet** | `ratingsData: any = {},` |
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

### C-1_AI-31 — `src/hooks/admin/useAiMagicCity.ts:161`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiMagicCity.ts` |
| **Riga** | 161 |
| **Snippet** | `patronData: any = {};` |
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

### C-1_AI-32 — `src/hooks/admin/useAiMagicCity.ts:162`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiMagicCity.ts` |
| **Riga** | 162 |
| **Snippet** | `let guides: any[] = [],` |
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

### C-1_AI-33 — `src/hooks/admin/useAiMagicCity.ts:163`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiMagicCity.ts` |
| **Riga** | 163 |
| **Snippet** | `events: any[] = [],` |
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

### C-1_AI-34 — `src/hooks/admin/useAiMagicCity.ts:164`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiMagicCity.ts` |
| **Riga** | 164 |
| **Snippet** | `services: any[] = [],` |
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

### C-1_AI-35 — `src/hooks/admin/useAiMagicCity.ts:277`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiMagicCity.ts` |
| **Riga** | 277 |
| **Snippet** | `const peoplePromises: Promise<any>[] = [];` |
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

### C-1_AI-36 — `src/hooks/admin/useAiMagicCity.ts:336`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiMagicCity.ts` |
| **Riga** | 336 |
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

### C-1_AI-37 — `src/hooks/admin/useAiMagicCity.ts:371`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiMagicCity.ts` |
| **Riga** | 371 |
| **Snippet** | `const savePromises: Promise<any>[] = [];` |
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

### C-1_AI-38 — `src/hooks/admin/useAiMagicCity.ts:374`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiMagicCity.ts` |
| **Riga** | 374 |
| **Snippet** | `refinedData.guides.forEach((g: any, i: number) =>` |
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

### C-1_AI-39 — `src/hooks/admin/useAiMagicCity.ts:392`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiMagicCity.ts` |
| **Riga** | 392 |
| **Snippet** | `refinedData.tour_operators.forEach((op: any) =>` |
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

### C-1_AI-40 — `src/hooks/admin/useAiMagicCity.ts:396`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/useAiMagicCity.ts` |
| **Riga** | 396 |
| **Snippet** | `refinedData.services.forEach((s: any, i: number) =>` |
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
