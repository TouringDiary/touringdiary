# B2a Batch C4 — Services (non-AI)

> Audit specialistico **Batch C** — sottogruppo tematico.  
> **Nessuna bonifica codice** in questo documento.  
> Fonte classificazione: [`B2a_noExplicitAny_AUDIT.md`](./B2a_noExplicitAny_AUDIT.md) · Inventario storico: [`B2a_noExplicitAny_INVENTORY_446.md`](./B2a_noExplicitAny_INVENTORY_446.md)  
> Indice: [`B2a_BATCH_C_INDEX.md`](./B2a_BATCH_C_INDEX.md)  
> Dominio: Servizi applicativi fuori AI/parsers/community (geo, import, partner, POI, …)  
> Stato: **ACCETTATO — batch chiuso** (2026-08-07, ACCETTO PO formale). Perimetro operativo live: **15** `noExplicitAny` / **7** file → **0**. ImportStatsBar escluso (C6). C1 non toccato.

---

## 1. Perimetro

| Metrica | Valore |
|----|----:|
| Occorrenze in questo gruppo | **13** |
| File coinvolti | **7** |
| Cartelle (prefisso) | **7** |

---

## 2. Occorrenze (dettaglio)

### C-4_SERVICES-1 — `src/services/affiliateTrackingService.ts:15`

| Campo | Valore |
|----|----|
| **File** | `src/services/affiliateTrackingService.ts` |
| **Riga** | 15 |
| **Snippet** | `metadata?: Record<string, any>;` |
| **Motivo classificazione C** | Contenitore JSON/dinamico tipizzato any (contesto: generic any su struttura JSON) |
| **Tipologia any** | Payload JSON |
| **Rischio modifica** | Medio |
| **Contratto coinvolto** | Service API / row mapping |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Tipizzare payload servizio e return type; allineare a Database/City dove possibile |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | JSON |

### C-4_SERVICES-2 — `src/services/city/poi/poiMapper.ts:103`

| Campo | Valore |
|----|----|
| **File** | `src/services/city/poi/poiMapper.ts` |
| **Riga** | 103 |
| **Snippet** | `const dbContact = db.contact_info as Record<string, any> \ |
| **Motivo classificazione C** | Contenitore JSON/dinamico tipizzato any (contesto: generic any su struttura JSON) |
| **Tipologia any** | Payload JSON |
| **Rischio modifica** | Medio |
| **Contratto coinvolto** | Service API / row mapping |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Tipizzare payload servizio e return type; allineare a Database/City dove possibile |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | JSON |

### C-4_SERVICES-3 — `src/services/geo.ts:35`

| Campo | Valore |
|----|----|
| **File** | `src/services/geo.ts` |
| **Riga** | 35 |
| **Snippet** | `export const getContinents = async (): Promise<any[]> => {` |
| **Motivo classificazione C** | API geo senza tipo riga (contesto: Promise<any[]> geo service) |
| **Tipologia any** | Service |
| **Rischio modifica** | Medio |
| **Contratto coinvolto** | Service API / row mapping |
| **Dato atteso** | tipi geo/continent/nation/zone se presenti |
| **Strategia consigliata** | Tipizzare payload servizio e return type; allineare a Database/City dove possibile |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Supa |

### C-4_SERVICES-4 — `src/services/geo.ts:46`

| Campo | Valore |
|----|----|
| **File** | `src/services/geo.ts` |
| **Riga** | 46 |
| **Snippet** | `export const getNations = async (continentId: string): Promise<any[]> => {` |
| **Motivo classificazione C** | API geo senza tipo riga (contesto: Promise<any[]> geo service) |
| **Tipologia any** | Service |
| **Rischio modifica** | Medio |
| **Contratto coinvolto** | Service API / row mapping |
| **Dato atteso** | tipi geo/continent/nation/zone se presenti |
| **Strategia consigliata** | Tipizzare payload servizio e return type; allineare a Database/City dove possibile |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Supa |

### C-4_SERVICES-5 — `src/services/geo.ts:58`

| Campo | Valore |
|----|----|
| **File** | `src/services/geo.ts` |
| **Riga** | 58 |
| **Snippet** | `export const getAdminRegions = async (nationId: string): Promise<any[]> => {` |
| **Motivo classificazione C** | API geo senza tipo riga (contesto: Promise<any[]> geo service) |
| **Tipologia any** | Service |
| **Rischio modifica** | Medio |
| **Contratto coinvolto** | Service API / row mapping |
| **Dato atteso** | tipi geo/continent/nation/zone se presenti |
| **Strategia consigliata** | Tipizzare payload servizio e return type; allineare a Database/City dove possibile |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Supa |

### C-4_SERVICES-6 — `src/services/geo.ts:70`

| Campo | Valore |
|----|----|
| **File** | `src/services/geo.ts` |
| **Riga** | 70 |
| **Snippet** | `export const getZones = async (adminRegionId: string): Promise<any[]> => {` |
| **Motivo classificazione C** | API geo senza tipo riga (contesto: Promise<any[]> geo service) |
| **Tipologia any** | Service |
| **Rischio modifica** | Medio |
| **Contratto coinvolto** | Service API / row mapping |
| **Dato atteso** | tipi geo/continent/nation/zone se presenti |
| **Strategia consigliata** | Tipizzare payload servizio e return type; allineare a Database/City dove possibile |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Supa |

### C-4_SERVICES-7 — `src/services/geo.ts:82`

| Campo | Valore |
|----|----|
| **File** | `src/services/geo.ts` |
| **Riga** | 82 |
| **Snippet** | `export const getCitiesByZone = async (zoneId: string): Promise<any[]> => {` |
| **Motivo classificazione C** | API geo senza tipo riga (contesto: Promise<any[]> geo service) |
| **Tipologia any** | Service |
| **Rischio modifica** | Medio |
| **Contratto coinvolto** | Service API / row mapping |
| **Dato atteso** | tipi geo/continent/nation/zone se presenti |
| **Strategia consigliata** | Tipizzare payload servizio e return type; allineare a Database/City dove possibile |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Supa |

### C-4_SERVICES-8 — `src/services/globalEventsService.ts:119`

| Campo | Valore |
|----|----|
| **File** | `src/services/globalEventsService.ts` |
| **Riga** | 119 |
| **Snippet** | `flatData.sort((a: any, b: any) => {` |
| **Motivo classificazione C** | API service con any (contesto: parametro/servizio : any) |
| **Tipologia any** | Payload JSON |
| **Rischio modifica** | Medio |
| **Contratto coinvolto** | Service API / row mapping |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Tipizzare payload servizio e return type; allineare a Database/City dove possibile |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | JSON |

### C-4_SERVICES-9 — `src/services/globalEventsService.ts:119`

| Campo | Valore |
|----|----|
| **File** | `src/services/globalEventsService.ts` |
| **Riga** | 119 |
| **Snippet** | `flatData.sort((a: any, b: any) => {` |
| **Motivo classificazione C** | API service con any (contesto: parametro/servizio : any) |
| **Tipologia any** | Payload JSON |
| **Rischio modifica** | Medio |
| **Contratto coinvolto** | Service API / row mapping |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Tipizzare payload servizio e return type; allineare a Database/City dove possibile |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | JSON |

### C-4_SERVICES-10 — `src/services/globalEventsService.ts:139`

| Campo | Valore |
|----|----|
| **File** | `src/services/globalEventsService.ts` |
| **Riga** | 139 |
| **Snippet** | `export const updateEventMetadata = async (eventId: string, metadata: any) => {` |
| **Motivo classificazione C** | Payload dinamico tipizzato any (contesto: parametro data/response : any) |
| **Tipologia any** | Payload JSON |
| **Rischio modifica** | Medio |
| **Contratto coinvolto** | Service API / row mapping |
| **Dato atteso** | Database types generati |
| **Strategia consigliata** | Tipizzare payload servizio e return type; allineare a Database/City dove possibile |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | Supa,JSON |

### C-4_SERVICES-11 — `src/services/importService.ts:389`

| Campo | Valore |
|----|----|
| **File** | `src/services/importService.ts` |
| **Riga** | 389 |
| **Snippet** | `return mappedItems as any[];` |
| **Motivo classificazione C** | Cast esplicito per forzare compatibilità (contesto: as any generico) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Medio |
| **Contratto coinvolto** | Service API / row mapping |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Tipizzare payload servizio e return type; allineare a Database/City dove possibile |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |

### C-4_SERVICES-12 — `src/services/partnerIntegrationService.ts:143`

| Campo | Valore |
|----|----|
| **File** | `src/services/partnerIntegrationService.ts` |
| **Riga** | 143 |
| **Snippet** | `const rawValue = (data as any).value \ |
| **Motivo classificazione C** | Cast esplicito per forzare compatibilità (contesto: as any generico) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Medio |
| **Contratto coinvolto** | Service API / row mapping |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Tipizzare payload servizio e return type; allineare a Database/City dove possibile |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |

### C-4_SERVICES-13 — `src/services/sponsors/sponsorStatsService.ts:30`

| Campo | Valore |
|----|----|
| **File** | `src/services/sponsors/sponsorStatsService.ts` |
| **Riga** | 30 |
| **Snippet** | `) as any;` |
| **Motivo classificazione C** | Cast esplicito per forzare compatibilità (contesto: as any generico) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Medio |
| **Contratto coinvolto** | Service API / row mapping |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Tipizzare payload servizio e return type; allineare a Database/City dove possibile |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |


---

## Statistiche

### Statistiche generali

| Metrica | Valore |
|----|----:|
| Occorrenze analizzate | **13** |
| File coinvolti | **7** |
| Cartelle coinvolte | **7** |
| Tipi condivisi probabilmente da introdurre | **13** (flag `newT` sì) |
| Contratti di dominio coinvolti | **0** (stima per occorrenza in perimetro) |
| API/servizi coinvolti | **13** (stima per occorrenza in perimetro) |
| Livello di rischio complessivo | **Medio** |

### Distribuzione per tipologia

| Tipologia | Occorrenze | File |
|-----------|-----------:|-----:|
| Payload JSON | 5 | 3 |
| Parser | 0 | 0 |
| Gemini / AI | 0 | 0 |
| Supabase | 0 | 0 |
| Domain Model | 3 | 3 |
| Shared Types | 0 | 0 |
| Utility | 0 | 0 |
| Mapper | 0 | 0 |
| Service | 5 | 1 |
| Altro | 0 | 0 |

### Distribuzione per file

| File | Occorrenze | Priorità | Note |
|------|-----------:|----------|------|
| `src/services/geo.ts` | 5 | Alta | Classificazione C — review dominio |
| `src/services/globalEventsService.ts` | 3 | Alta | Classificazione C — review dominio |
| `src/services/affiliateTrackingService.ts` | 1 | Alta | Classificazione C — review dominio |
| `src/services/city/poi/poiMapper.ts` | 1 | Media | Classificazione C — review dominio |
| `src/services/importService.ts` | 1 | Media | Classificazione C — review dominio |
| `src/services/partnerIntegrationService.ts` | 1 | Media | Classificazione C — review dominio |
| `src/services/sponsors/sponsorStatsService.ts` | 1 | Media | Classificazione C — review dominio |

### Distribuzione per rischio

| Rischio | Occorrenze |
|----------|-----------:|
| Basso | 0 |
| Medio | 13 |
| Alto | 0 |
