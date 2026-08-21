# B2a Batch C6 — Utils / Undo / Rankings

> Audit specialistico **Batch C** — sottogruppo tematico.  
> Fonte classificazione: [`B2a_noExplicitAny_AUDIT.md`](./B2a_noExplicitAny_AUDIT.md) · Inventario storico: [`B2a_noExplicitAny_INVENTORY_446.md`](./B2a_noExplicitAny_INVENTORY_446.md)  
> Indice: [`B2a_BATCH_C_INDEX.md`](./B2a_BATCH_C_INDEX.md)  
> Dominio: Hook undo packing, rankings, ImportStatsBar (UI filter tipizzata)  
> Stato: **ACCETTATO — batch chiuso** (2026-08-07, ACCETTO PO formale). Perimetro operativo live: **15** `noExplicitAny` / **5** file → **0**. C1 non toccato.

---

## 1. Perimetro operativo live (SoT esecuzione)

> La classificazione storica censiva **9** hit / **6** file. Il perimetro **operativo** rivalidato pre-bonifica era **15** hit / **5** file (`useRankingsLogic` densità maggiore; `useDiaryUndo` escluso: **0** hit live).

| Metrica | Classificazione storica | Live operativo (pre) | Post-chiusura |
|----|----:|----:|----:|
| Occorrenze | **9** | **15** | **0** |
| File | **6** | **5** | **5** (puliti) |

| File | Hit pre | Post | Note |
|----|---:|---:|----|
| `src/hooks/useRankingsLogic.ts` | 10 | 0 | `RankingsClientItem` + helper sort |
| `src/components/admin/import/components/ImportStatsBar.tsx` | 2 | 0 | `ImportFilterStatus`; QD `currentFilter` |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts` | 1 | 0 | `Promise<SuitcaseItem \| undefined>` |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseEditorLogic.ts` | 1 | 0 | idem |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseUndoHandlers.ts` | 1 | 0 | idem |
| **Totale** | **15** | **0** | |

### Esclusi

| File | Hit | Motivo |
|----|---:|----|
| `src/hooks/useDiaryUndo.ts` | 0 | Storico C; **0** hit live — fuori bonifica |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelOptimisticUpdates.ts` | 1 | Residuo **Livello B** (inventario 446 riga 172: parametro hook). Batch B già **ACCETTATO**. Non C6. Vedi residuali B post-chiusura. |

### Consumer Quality Delta (fuori hit C6, tipizzazione collaterale)

| File | Esito |
|----|----|
| `src/components/modals/FullRankingsModal.tsx` | Narrowing locale; cast `as unknown as` rimossi; DEBUG log rimosso |
| `useRankingsLogic` case `visitors` | Cast locali **mantenuti di proposito** (non debito C6). `PhotoSubmission` / `PointOfInterest` non espongono `visitors`; il sort `visitors` è solo sul ramo Cities (server-side). Estendere `RankingsClientItem` con `visitors?: number` avrebbe alterato il modello di dominio. I cast restano scelta progettuale per correttezza di dominio. |

---

## 2. Chiusura

| Campo | Valore |
|----|----|
| ACCETTO PO | 2026-08-07 |
| Gate any perimetro | **0** |
| Suppressioni / hack | Nessuno |
| Nuovo debito Biome | Nessuno |
| Prossimo | **C1 — AI / Gemini** |

Dettaglio storico occorrenze classificazione (C-6_UTILS-1…9) resta nell’inventario 446; non ripetuto qui dopo chiusura.
