# B2a Batch C3 — Domain / Context / Types

> Audit specialistico **Batch C** — sottogruppo tematico.  
> **Nessuna bonifica codice** in questo documento.  
> Fonte classificazione: [`B2a_noExplicitAny_AUDIT.md`](./B2a_noExplicitAny_AUDIT.md) · Inventario storico: [`B2a_noExplicitAny_INVENTORY_446.md`](./B2a_noExplicitAny_INVENTORY_446.md)  
> Indice: [`B2a_BATCH_C_INDEX.md`](./B2a_BATCH_C_INDEX.md)  
> Dominio: Tipi shared, context, constants e UI che mutano contratti City/Sponsor  
> Stato: **ACCETTATO (chiuso)** — censimento storico **45**; residui vivi context **0**.  
> Avvio PO: [`B2a_C3_START_PO_AUDIT.md`](./B2a_C3_START_PO_AUDIT.md) · Unico batch (§22).  
> Nota §22: la tabella «Stima di suddivisione» in fondo è inventario storico — **non** piano obbligatorio di mini-batch.

---

## 1. Perimetro

| Metrica | Valore |
|----|----:|
| Occorrenze in questo gruppo | **45** |
| File coinvolti | **26** |
| Cartelle (prefisso) | **10** |

---

## 2. Occorrenze (dettaglio)

### C-3_DOMAIN-1 — `src/components/admin/AdminGamification.tsx:636`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/AdminGamification.tsx` |
| **Riga** | 636 |
| **Snippet** | `setEditingReward({ ...editingReward, category: e.target.value as any })` |
| **Motivo classificazione C** | Cast esplicito per forzare compatibilità (contesto: as any generico) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |

### C-3_DOMAIN-2 — `src/components/admin/AdminStatsDashboard.tsx:60`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/AdminStatsDashboard.tsx` |
| **Riga** | 60 |
| **Snippet** | `const cityStats: Record<string, any> = {};` |
| **Motivo classificazione C** | Contenitore JSON/dinamico tipizzato any (contesto: generic any su struttura JSON) |
| **Tipologia any** | Payload JSON |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | JSON |

### C-3_DOMAIN-3 — `src/components/admin/AdminTaxonomyManager.tsx:50`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/AdminTaxonomyManager.tsx` |
| **Riga** | 50 |
| **Snippet** | `const poiStructure = getCachedSetting<Record<string, any>>(SETTINGS_KEYS.POI_STRUCTURE);` |
| **Motivo classificazione C** | Contenitore JSON/dinamico tipizzato any (contesto: generic any su struttura JSON) |
| **Tipologia any** | Payload JSON |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | JSON |

### C-3_DOMAIN-4 — `src/components/admin/cities/CityAuditModal.tsx:137`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/cities/CityAuditModal.tsx` |
| **Riga** | 137 |
| **Snippet** | `category: (finalCategory \ |
| **Motivo classificazione C** | Cast stringa UI verso union di dominio (contesto: as any su union/enum/status) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | union/enum già nel dominio (se presente) o da introdurre |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Riutilizzare tipi esistenti se presenti |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |

### C-3_DOMAIN-5 — `src/components/admin/cities/CityAuditModal.tsx:138`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/cities/CityAuditModal.tsx` |
| **Riga** | 138 |
| **Snippet** | `subCategory: finalSubCategory as any,` |
| **Motivo classificazione C** | Cast stringa UI verso union di dominio (contesto: as any su union/enum/status) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | union/enum già nel dominio (se presente) o da introdurre |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Riutilizzare tipi esistenti se presenti |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |

### C-3_DOMAIN-6 — `src/components/admin/cityEditor/EditorRatings.tsx:162`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/cityEditor/EditorRatings.tsx` |
| **Riga** | 162 |
| **Snippet** | `(currentRatings as any)[category] = value;` |
| **Motivo classificazione C** | Cast stringa UI verso union di dominio (contesto: as any su union/enum/status) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | union/enum già nel dominio (se presente) o da introdurre |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Riutilizzare tipi esistenti se presenti |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |

### C-3_DOMAIN-7 — `src/components/admin/cityEditor/EditorRatings.tsx:248`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/cityEditor/EditorRatings.tsx` |
| **Riga** | 248 |
| **Snippet** | `<span className="text-white">{(city.details.ratings as any)[key] \ |
| **Motivo classificazione C** | Cast esplicito per forzare compatibilità (contesto: as any generico) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |

### C-3_DOMAIN-8 — `src/components/admin/cityEditor/EditorRatings.tsx:254`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/cityEditor/EditorRatings.tsx` |
| **Riga** | 254 |
| **Snippet** | `value={(city.details.ratings as any)[key] \ |
| **Motivo classificazione C** | Cast stringa UI verso union di dominio (contesto: as any su union/enum/status) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | union/enum già nel dominio (se presente) o da introdurre |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Riutilizzare tipi esistenti se presenti |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |

### C-3_DOMAIN-9 — `src/components/admin/cityEditor/services/ServiceEvents.tsx:20`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/cityEditor/services/ServiceEvents.tsx` |
| **Riga** | 20 |
| **Snippet** | `const [eventsList, setEventsList] = useState<any[]>([]);` |
| **Motivo classificazione C** | State/ref React con any (contesto: useState<any…>) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | React |

### C-3_DOMAIN-10 — `src/components/admin/cityEditor/services/ServiceEvents.tsx:24`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/cityEditor/services/ServiceEvents.tsx` |
| **Riga** | 24 |
| **Snippet** | `const [discoveryResults, setDiscoveryResults] = useState<any[]>([]);` |
| **Motivo classificazione C** | State/ref React con any (contesto: useState<any…>) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | React |

### C-3_DOMAIN-11 — `src/components/admin/cityEditor/services/ServiceGeneric.tsx:27`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/cityEditor/services/ServiceGeneric.tsx` |
| **Riga** | 27 |
| **Snippet** | `const [servicesList, setServicesList] = useState<any[]>([]);` |
| **Motivo classificazione C** | State/ref React con any (contesto: useState<any…>) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | React |

### C-3_DOMAIN-12 — `src/components/admin/cityEditor/services/ServiceGeneric.tsx:32`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/cityEditor/services/ServiceGeneric.tsx` |
| **Riga** | 32 |
| **Snippet** | `const [serviceResults, setServiceResults] = useState<any[]>([]);` |
| **Motivo classificazione C** | State/ref React con any (contesto: useState<any…>) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | React |

### C-3_DOMAIN-13 — `src/components/admin/cityEditor/services/ServiceGuides.tsx:12`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/cityEditor/services/ServiceGuides.tsx` |
| **Riga** | 12 |
| **Snippet** | `const [guidesList, setGuidesList] = useState<any[]>([]);` |
| **Motivo classificazione C** | State/ref React con any (contesto: useState<any…>) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | React |

### C-3_DOMAIN-14 — `src/components/admin/cityEditor/services/ServiceGuides.tsx:17`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/cityEditor/services/ServiceGuides.tsx` |
| **Riga** | 17 |
| **Snippet** | `const [discoveryResults, setDiscoveryResults] = useState<any[]>([]);` |
| **Motivo classificazione C** | State/ref React con any (contesto: useState<any…>) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | React |

### C-3_DOMAIN-15 — `src/components/admin/cityEditor/services/ServiceOperators.tsx:21`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/cityEditor/services/ServiceOperators.tsx` |
| **Riga** | 21 |
| **Snippet** | `const [discoveryResults, setDiscoveryResults] = useState<any[]>([]);` |
| **Motivo classificazione C** | State/ref React con any (contesto: useState<any…>) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | React |

### C-3_DOMAIN-16 — `src/components/admin/cityEditor/tabs/TabRatings.tsx:158`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/cityEditor/tabs/TabRatings.tsx` |
| **Riga** | 158 |
| **Snippet** | `(currentRatings as any)[category] = value;` |
| **Motivo classificazione C** | Cast stringa UI verso union di dominio (contesto: as any su union/enum/status) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | union/enum già nel dominio (se presente) o da introdurre |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Riutilizzare tipi esistenti se presenti |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |

### C-3_DOMAIN-17 — `src/components/admin/cityEditor/tabs/TabRatings.tsx:244`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/cityEditor/tabs/TabRatings.tsx` |
| **Riga** | 244 |
| **Snippet** | `<span className="text-white">{(city.details.ratings as any)[key] \ |
| **Motivo classificazione C** | Cast esplicito per forzare compatibilità (contesto: as any generico) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |

### C-3_DOMAIN-18 — `src/components/admin/cityEditor/tabs/TabRatings.tsx:250`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/cityEditor/tabs/TabRatings.tsx` |
| **Riga** | 250 |
| **Snippet** | `value={(city.details.ratings as any)[key] \ |
| **Motivo classificazione C** | Cast stringa UI verso union di dominio (contesto: as any su union/enum/status) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | union/enum già nel dominio (se presente) o da introdurre |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Riutilizzare tipi esistenti se presenti |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |

### C-3_DOMAIN-19 — `src/components/admin/NewsTickerManager.tsx:205`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/NewsTickerManager.tsx` |
| **Riga** | 205 |
| **Snippet** | `icon: newItemIcon as any,` |
| **Motivo classificazione C** | Cast esplicito per forzare compatibilità (contesto: as any generico) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |

### C-3_DOMAIN-20 — `src/components/admin/NewsTickerManager.tsx:251`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/NewsTickerManager.tsx` |
| **Riga** | 251 |
| **Snippet** | `icon: editItemIcon as any,` |
| **Motivo classificazione C** | Cast esplicito per forzare compatibilità (contesto: as any generico) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |

### C-3_DOMAIN-21 — `src/components/admin/observatory/AnomalyInspector.tsx:237`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/observatory/AnomalyInspector.tsx` |
| **Riga** | 237 |
| **Snippet** | `? 'Città: ${getCityNameForPoi({ cityId: geoFilter.city } as any)}'` |
| **Motivo classificazione C** | Cast stringa UI verso union di dominio (contesto: as any su union/enum/status) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | union/enum già nel dominio (se presente) o da introdurre |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Riutilizzare tipi esistenti se presenti |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |

### C-3_DOMAIN-22 — `src/components/admin/poiModal/PoiInfoTab.tsx:58`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/poiModal/PoiInfoTab.tsx` |
| **Riga** | 58 |
| **Snippet** | `const advancedStructure = getCachedSetting<Record<string, any[]>>(` |
| **Motivo classificazione C** | Contenitore JSON/dinamico tipizzato any (contesto: generic any su struttura JSON) |
| **Tipologia any** | Payload JSON |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | JSON |

### C-3_DOMAIN-23 — `src/components/admin/settings/ObjectRenderer.tsx:6`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/settings/ObjectRenderer.tsx` |
| **Riga** | 6 |
| **Snippet** | `data: Record<string, any>;` |
| **Motivo classificazione C** | Contenitore JSON/dinamico tipizzato any (contesto: generic any su struttura JSON) |
| **Tipologia any** | Payload JSON |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | JSON |

### C-3_DOMAIN-24 — `src/components/admin/SponsorDashboardOverview.tsx:137`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/SponsorDashboardOverview.tsx` |
| **Riga** | 137 |
| **Snippet** | `onClick={() => setSponsorFilter(f.id as any)}` |
| **Motivo classificazione C** | Cast stringa UI verso union di dominio (contesto: as any su union/enum/status) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | union/enum già nel dominio (se presente) o da introdurre |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Riutilizzare tipi esistenti se presenti |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |

### C-3_DOMAIN-25 — `src/components/admin/userManager/CreateUserModal.tsx:48`

| Campo | Valore |
|----|----|
| **File** | `src/components/admin/userManager/CreateUserModal.tsx` |
| **Riga** | 48 |
| **Snippet** | `const result = await (registerUser as any)({` |
| **Motivo classificazione C** | Cast esplicito per forzare compatibilità (contesto: as any generico) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |

### C-3_DOMAIN-26 — `src/components/city/tabs/CityCategoryTab.tsx:136`

| Campo | Valore |
|----|----|
| **File** | `src/components/city/tabs/CityCategoryTab.tsx` |
| **Riga** | 136 |
| **Snippet** | `status: 'all' as any,` |
| **Motivo classificazione C** | Cast stringa UI verso union di dominio (contesto: as any su union/enum/status) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | union/enum già nel dominio (se presente) o da introdurre |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Riutilizzare tipi esistenti se presenti |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | React |

### C-3_DOMAIN-27 — `src/constants/services.ts:17`

| Campo | Valore |
|----|----|
| **File** | `src/constants/services.ts` |
| **Riga** | 17 |
| **Snippet** | `const ICON_MAP: Record<string, any> = {` |
| **Motivo classificazione C** | Contenitore JSON/dinamico tipizzato any (contesto: generic any su struttura JSON) |
| **Tipologia any** | Payload JSON |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | JSON |

### C-3_DOMAIN-28 — `src/context/BusinessContext.tsx:71`

| Campo | Valore |
|----|----|
| **File** | `src/context/BusinessContext.tsx` |
| **Riga** | 71 |
| **Snippet** | `const isBizTab = Object.values(BIZ_DASHBOARD_TABS).includes(firstSegmentAfterDashboard as any);` |
| **Motivo classificazione C** | Cast esplicito per forzare compatibilità (contesto: as any generico) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |

### C-3_DOMAIN-29 — `src/context/CityEditorContext.tsx:99`

| Campo | Valore |
|----|----|
| **File** | `src/context/CityEditorContext.tsx` |
| **Riga** | 99 |
| **Snippet** | `items?: any[];` |
| **Motivo classificazione C** | Stato/context React tipizzato any (contesto: context value/param any) |
| **Tipologia any** | Shared Types |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | React |

### C-3_DOMAIN-30 — `src/context/CityEditorContext.tsx:121`

| Campo | Valore |
|----|----|
| **File** | `src/context/CityEditorContext.tsx` |
| **Riga** | 121 |
| **Snippet** | `triggerPreview: (type: PreviewType, title?: string, items?: any[]) => void;` |
| **Motivo classificazione C** | Stato/context React tipizzato any (contesto: context value/param any) |
| **Tipologia any** | Shared Types |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | React |

### C-3_DOMAIN-31 — `src/context/CityEditorContext.tsx:281`

| Campo | Valore |
|----|----|
| **File** | `src/context/CityEditorContext.tsx` |
| **Riga** | 281 |
| **Snippet** | `const triggerPreview = useCallback((type: PreviewType, title?: string, items?: any[]) => {` |
| **Motivo classificazione C** | Stato/context React tipizzato any (contesto: context value/param any) |
| **Tipologia any** | Shared Types |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | React |

### C-3_DOMAIN-32 — `src/context/ConfigContext.tsx:26`

| Campo | Valore |
|----|----|
| **File** | `src/context/ConfigContext.tsx` |
| **Riga** | 26 |
| **Snippet** | `[key: string]: any;` |
| **Motivo classificazione C** | Stato/context React tipizzato any (contesto: context value/param any) |
| **Tipologia any** | Shared Types |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | React |

### C-3_DOMAIN-33 — `src/context/ModalContext.tsx:5`

| Campo | Valore |
|----|----|
| **File** | `src/context/ModalContext.tsx` |
| **Riga** | 5 |
| **Snippet** | `modalProps: any;` |
| **Motivo classificazione C** | Stato/context React tipizzato any (contesto: context value/param any) |
| **Tipologia any** | Shared Types |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | React |

### C-3_DOMAIN-34 — `src/context/ModalContext.tsx:6`

| Campo | Valore |
|----|----|
| **File** | `src/context/ModalContext.tsx` |
| **Riga** | 6 |
| **Snippet** | `openModal: (type: string, props?: any) => void;` |
| **Motivo classificazione C** | Stato/context React tipizzato any (contesto: context value/param any) |
| **Tipologia any** | Shared Types |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | React |

### C-3_DOMAIN-35 — `src/context/ModalContext.tsx:14`

| Campo | Valore |
|----|----|
| **File** | `src/context/ModalContext.tsx` |
| **Riga** | 14 |
| **Snippet** | `const [modalProps, setModalProps] = useState<any>({});` |
| **Motivo classificazione C** | State/ref React con any (contesto: useState<any…>) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | React |

### C-3_DOMAIN-36 — `src/context/ModalContext.tsx:16`

| Campo | Valore |
|----|----|
| **File** | `src/context/ModalContext.tsx` |
| **Riga** | 16 |
| **Snippet** | `const openModal = useCallback((type: string, props: any = {}) => {` |
| **Motivo classificazione C** | Stato/context React tipizzato any (contesto: context value/param any) |
| **Tipologia any** | Shared Types |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | React |

### C-3_DOMAIN-37 — `src/hooks/admin/import/useImportActions.ts:89`

| Campo | Valore |
|----|----|
| **File** | `src/hooks/admin/import/useImportActions.ts` |
| **Riga** | 89 |
| **Snippet** | `status: filtersContext.statusFilter as any,` |
| **Motivo classificazione C** | Cast stringa UI verso union di dominio (contesto: as any su union/enum/status) |
| **Tipologia any** | Domain Model |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | union/enum già nel dominio (se presente) o da introdurre |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Riutilizzare tipi esistenti se presenti |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |

### C-3_DOMAIN-38 — `src/types/models/City.ts:219`

| Campo | Valore |
|----|----|
| **File** | `src/types/models/City.ts` |
| **Riga** | 219 |
| **Snippet** | `metadata?: any;` |
| **Motivo classificazione C** | Contratto di dominio espone any (contesto: tipo shared con any) |
| **Tipologia any** | Payload JSON |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | tipi in src/types/models/City.ts (estendere) |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | JSON |

### C-3_DOMAIN-39 — `src/types/models/City.ts:299`

| Campo | Valore |
|----|----|
| **File** | `src/types/models/City.ts` |
| **Riga** | 299 |
| **Snippet** | `historySections?: any[];` |
| **Motivo classificazione C** | Contratto di dominio espone any (contesto: tipo shared con any) |
| **Tipologia any** | Shared Types |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | tipi in src/types/models/City.ts (estendere) |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |

### C-3_DOMAIN-40 — `src/types/models/Sponsor.ts:257`

| Campo | Valore |
|----|----|
| **File** | `src/types/models/Sponsor.ts` |
| **Riga** | 257 |
| **Snippet** | `continents: any[];` |
| **Motivo classificazione C** | Contratto di dominio espone any (contesto: tipo shared con any) |
| **Tipologia any** | Shared Types |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | tipi Sponsor + tipi geo |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |

### C-3_DOMAIN-41 — `src/types/models/Sponsor.ts:258`

| Campo | Valore |
|----|----|
| **File** | `src/types/models/Sponsor.ts` |
| **Riga** | 258 |
| **Snippet** | `nations: any[];` |
| **Motivo classificazione C** | Contratto di dominio espone any (contesto: tipo shared con any) |
| **Tipologia any** | Shared Types |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | tipi Sponsor + tipi geo |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |

### C-3_DOMAIN-42 — `src/types/models/Sponsor.ts:259`

| Campo | Valore |
|----|----|
| **File** | `src/types/models/Sponsor.ts` |
| **Riga** | 259 |
| **Snippet** | `adminRegions: any[];` |
| **Motivo classificazione C** | Contratto di dominio espone any (contesto: tipo shared con any) |
| **Tipologia any** | Shared Types |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | tipi Sponsor + tipi geo |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |

### C-3_DOMAIN-43 — `src/types/models/Sponsor.ts:260`

| Campo | Valore |
|----|----|
| **File** | `src/types/models/Sponsor.ts` |
| **Riga** | 260 |
| **Snippet** | `zones: any[];` |
| **Motivo classificazione C** | Contratto di dominio espone any (contesto: tipo shared con any) |
| **Tipologia any** | Shared Types |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | tipi Sponsor + tipi geo |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |

### C-3_DOMAIN-44 — `src/types/models/Sponsor.ts:261`

| Campo | Valore |
|----|----|
| **File** | `src/types/models/Sponsor.ts` |
| **Riga** | 261 |
| **Snippet** | `cities: any[];` |
| **Motivo classificazione C** | Contratto di dominio espone any (contesto: tipo shared con any) |
| **Tipologia any** | Shared Types |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | tipi Sponsor + tipi geo |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |

### C-3_DOMAIN-45 — `src/types/subscriptions.ts:22`

| Campo | Valore |
|----|----|
| **File** | `src/types/subscriptions.ts` |
| **Riga** | 22 |
| **Snippet** | `ai_limits: any;` |
| **Motivo classificazione C** | Contratto di dominio espone any (contesto: tipo shared con any) |
| **Tipologia any** | Shared Types |
| **Rischio modifica** | Alto |
| **Contratto coinvolto** | City / Sponsor / Context value |
| **Dato atteso** | da verificare nel file |
| **Strategia consigliata** | Estendere tipi in `src/types` / context; propagare senza `any` nei consumer |
| **Dipendenze** | Tipi/consumer dello stesso file; eventuale shared in `src/types` |
| **Tipi condivisi da creare** | Probabile (vedi colonna newT audit B2a) |
| **Batch meccanico?** | Necessita revisione architetturale / contratto |
| **Origini (tag audit)** | — |


---

## Statistiche

### Statistiche generali

| Metrica | Valore |
|----|----:|
| Occorrenze analizzate | **45** |
| File coinvolti | **26** |
| Cartelle coinvolte | **10** |
| Tipi condivisi probabilmente da introdurre | **35** (flag `newT` sì) |
| Contratti di dominio coinvolti | **45** (stima per occorrenza in perimetro) |
| API/servizi coinvolti | **0** (stima per occorrenza in perimetro) |
| Livello di rischio complessivo | **Alto** |

### Distribuzione per tipologia

| Tipologia | Occorrenze | File |
|-----------|-----------:|-----:|
| Payload JSON | 6 | 6 |
| Parser | 0 | 0 |
| Gemini / AI | 0 | 0 |
| Supabase | 0 | 0 |
| Domain Model | 25 | 16 |
| Shared Types | 14 | 6 |
| Utility | 0 | 0 |
| Mapper | 0 | 0 |
| Service | 0 | 0 |
| Altro | 0 | 0 |

### Distribuzione per file

| File | Occorrenze | Priorità | Note |
|------|-----------:|----------|------|
| `src/types/models/Sponsor.ts` | 5 | Alta | Classificazione C — review dominio |
| `src/context/ModalContext.tsx` | 4 | Alta | Classificazione C — review dominio |
| `src/components/admin/cityEditor/EditorRatings.tsx` | 3 | Alta | Classificazione C — review dominio |
| `src/components/admin/cityEditor/tabs/TabRatings.tsx` | 3 | Media | Classificazione C — review dominio |
| `src/context/CityEditorContext.tsx` | 3 | Media | Classificazione C — review dominio |
| `src/components/admin/cities/CityAuditModal.tsx` | 2 | Media | Classificazione C — review dominio |
| `src/components/admin/cityEditor/services/ServiceEvents.tsx` | 2 | Media | Classificazione C — review dominio |
| `src/components/admin/cityEditor/services/ServiceGeneric.tsx` | 2 | Media | Classificazione C — review dominio |
| `src/components/admin/cityEditor/services/ServiceGuides.tsx` | 2 | Normale | Classificazione C — review dominio |
| `src/components/admin/NewsTickerManager.tsx` | 2 | Normale | Classificazione C — review dominio |
| `src/types/models/City.ts` | 2 | Normale | Classificazione C — review dominio |
| `src/components/admin/AdminGamification.tsx` | 1 | Normale | Classificazione C — review dominio |
| `src/components/admin/AdminStatsDashboard.tsx` | 1 | Normale | Classificazione C — review dominio |
| `src/components/admin/AdminTaxonomyManager.tsx` | 1 | Normale | Classificazione C — review dominio |
| `src/components/admin/cityEditor/services/ServiceOperators.tsx` | 1 | Normale | Classificazione C — review dominio |
| `src/components/admin/observatory/AnomalyInspector.tsx` | 1 | Normale | Classificazione C — review dominio |
| `src/components/admin/poiModal/PoiInfoTab.tsx` | 1 | Normale | Classificazione C — review dominio |
| `src/components/admin/settings/ObjectRenderer.tsx` | 1 | Normale | Classificazione C — review dominio |
| `src/components/admin/SponsorDashboardOverview.tsx` | 1 | Normale | Classificazione C — review dominio |
| `src/components/admin/userManager/CreateUserModal.tsx` | 1 | Normale | Classificazione C — review dominio |
| `src/components/city/tabs/CityCategoryTab.tsx` | 1 | Normale | Classificazione C — review dominio |
| `src/constants/services.ts` | 1 | Normale | Classificazione C — review dominio |
| `src/context/BusinessContext.tsx` | 1 | Normale | Classificazione C — review dominio |
| `src/context/ConfigContext.tsx` | 1 | Normale | Classificazione C — review dominio |
| `src/hooks/admin/import/useImportActions.ts` | 1 | Normale | Classificazione C — review dominio |
| `src/types/subscriptions.ts` | 1 | Normale | Classificazione C — review dominio |

### Distribuzione per rischio

| Rischio | Occorrenze |
|----------|-----------:|
| Basso | 0 |
| Medio | 0 |
| Alto | 45 |

### Stima di suddivisione (futuri mini-batch)

> Dati oggettivi per priorità future — **non** è un piano di bonifica autorizzato.

| Mini-batch | File coinvolti | Occorrenze | Rischio | Dipendenze | Ordine consigliato |
|----|----|---:|----|----|---:|
| C3-M1 | `src/types/models/Sponsor.ts` | 5 | Alto | Locale al file | 1 |
| C3-M2 | `src/context/ModalContext.tsx` | 4 | Alto | Locale al file | 2 |
| C3-M3 | `src/components/admin/cityEditor/EditorRatings.tsx` | 3 | Alto | Locale al file | 3 |
| C3-M4 | `src/components/admin/cityEditor/tabs/TabRatings.tsx` | 3 | Alto | Locale al file | 4 |
| C3-M5 | `src/context/CityEditorContext.tsx` | 3 | Alto | Locale al file | 5 |
| C3-M6 | `src/components/admin/cities/CityAuditModal.tsx` | 2 | Alto | Locale al file | 6 |
| C3-M7 | `src/components/admin/cityEditor/services/ServiceEvents.tsx` | 2 | Alto | Locale al file | 7 |
| C3-M8 | `src/components/admin/cityEditor/services/ServiceGeneric.tsx` | 2 | Alto | Locale al file | 8 |
| C3-Mrest | `src/components/admin/cityEditor/services/ServiceGuides.tsx`, `src/components/admin/NewsTickerManager.tsx`, `src/types/models/City.ts`, `src/components/admin/AdminGamification.tsx`, `src/components/admin/AdminStatsDashboard.tsx`, `src/components/admin/AdminTaxonomyManager.tsx`, `src/components/admin/cityEditor/services/ServiceOperators.tsx`, `src/components/admin/observatory/AnomalyInspector.tsx`, `src/components/admin/poiModal/PoiInfoTab.tsx`, `src/components/admin/settings/ObjectRenderer.tsx`, `src/components/admin/SponsorDashboardOverview.tsx`, `src/components/admin/userManager/CreateUserModal.tsx`, `src/components/city/tabs/CityCategoryTab.tsx`, `src/constants/services.ts`, `src/context/BusinessContext.tsx`, `src/context/ConfigContext.tsx`, `src/hooks/admin/import/useImportActions.ts`, `src/types/subscriptions.ts` | 21 | Medio | Dopo i mini ad alta concentrazione | 9 |
