# Riconciliazione delta `noExplicitAny`: baseline 473 → B2a 446

> Verifica contabile. Nessuna modifica codice.  
> Baseline doc: [`C_noExplicitAny.md`](./C_noExplicitAny.md) (473 / 183)  
> Audit B2a: [`B2a_noExplicitAny_AUDIT.md`](./B2a_noExplicitAny_AUDIT.md) (446 / 173)  
> Metodo: confronto inventario per-file baseline vs snapshot Biome corrente + `git show` / Biome su revisioni pre-fix.

---

## Verdetto

Il delta **−27 occorrenze / −10 file** e **reale e 100% giustificato** a livello di inventario documentale:

```text
473 − 27 = 446
183 − 10 = 173
```

- **0** file con conteggio parzialmente ridotto (solo sparizioni totali a 0).
- **0** file nuovi con `noExplicitAny` rispetto alla baseline.
- **0** contributo da B1a / B1b / B1c (useButtonType / noUnusedImports / isNaN·svg·proto·switch·==).
- **0** file rimossi o rinominati (i 10 file esistono ancora; sono a **0** hit Biome).
- **0** cambio scope / comando / regole Biome rilevato tra i due conteggi (stessa regola `lint/suspicious/noExplicitAny`, stesso reporter JSON).

Scomposizione delle **27** occorrenze documentate:

| Fonte | Occorrenze | File |
|-------|----------:|-----:|
| Commit `8989490` (2026-08-04) — tipizzazione in quality toolchain | **21** | 9 |
| Working tree — Quality Delta `OnboardingVisualEditor` (+ `UiConfig.bgImage`) | **6** | 1 |
| **Totale delta** | **27** | **10** |

---

## Identita file-level (completa)

File presenti in baseline con N>0 e assenti (0 hit) nell'audit B2a. Somma N = **27**.

| File | Occ. baseline doc | Occ. B2a | Delta |
|------|------------------:|---------:|------:|
| `src/components/admin/cityEditor/EditorCulture.tsx` | 4 | 0 | −4 |
| `src/components/admin/communications/AiChatAssistant.tsx` | 2 | 0 | −2 |
| `src/components/admin/marketing/PricingHistoryPanel.tsx` | 5 | 0 | −5 |
| `src/components/admin/marketing/PricingPlansPanel.tsx` | 4 | 0 | −4 |
| `src/components/admin/onboarding/OnboardingVisualEditor.tsx` | 6 | 0 | −6 |
| `src/components/admin/userManager/EditUserModal.tsx` | 1 | 0 | −1 |
| `src/components/features/diary/DiaryResourceCard.tsx` | 1 | 0 | −1 |
| `src/components/modals/AuthModal.tsx` | 1 | 0 | −1 |
| `src/components/modals/BuyCreditsModal.tsx` | 1 | 0 | −1 |
| `src/services/community/itineraryService.ts` | 2 | 0 | −2 |
| **Totale** | **27** | **0** | **−27** |

Tutti gli altri **173** file dell'inventario baseline hanno lo **stesso** conteggio in B2a (delta per-file = 0).

---

## Dettaglio occorrenze eliminate (righe da revisione pre-fix)

Revisioni di riferimento:

- Pre-fix tipizzazione (9 file): `git show 71ceaf5:<file>` (parent di `8989490`), conteggio Biome 2.5.6 verificato dove indicato.
- `OnboardingVisualEditor`: `HEAD` (ancora 6 hit) → working tree (0 hit).

Batch: **altro** (mai B1a/B1b/B1c).

### 1) `EditorCulture.tsx` — 4 — commit `8989490`

| Riga (pre) | Snippet eliminato | Modifica concreta |
|---:|----|----|
| 20 | `useState<any[]>([])` (discoveryResults) | → `useState<AiPersonSuggestion[]>([])` |
| 119 | `catch (e: any)` | → `catch (e: unknown)` (e analoghi) |
| 170 | `person: any` in `handleImportPerson` | → `person: AiPersonSuggestion` |
| 195 | `value: any` in `handleUpdatePerson` | tipizzazione campo dominio |

### 2) `AiChatAssistant.tsx` — 2 in baseline doc / **5** Biome su `71ceaf5`

| Riga (pre) | Snippet | Verso il delta 27? |
|---:|----|----|
| 9 | `currentContext: any` | sì (parte del file a 0) |
| 9 | `onApply: any` | **extra vs baseline doc** |
| 9 | `onClose: any` | **extra vs baseline doc** |
| 10 | `useState<any[]>` | sì / incluso nel file |
| 48 | `catch (error: any)` | → `catch (error: unknown)` |

Modifica concreta post-`8989490`: props tipizzate (`currentContext: { subject?; body?; target? }`, handler tipizzati), messages tipizzati, `catch (error: unknown)`.

**Errore baseline:** il doc elencava **2** occorrenze; Biome su `71ceaf5` ne misura **5** (righe 9×3, 10, 48). I **+3** non sono nel totale documentale 473; non alterano 473−27=446, ma segnalano sottocontabilizzazione per-file nella tabella baseline.

### 3) `PricingHistoryPanel.tsx` — 5 — commit `8989490`

| Riga (pre) | Snippet eliminato |
|---:|----|
| 7 | `versions: any[]` |
| 8 | `campaigns: any[]` |
| 21 | `getStatusBadge = (ver: any)` |
| 71 | `(ver.ai_limits as any)?.models?.flash` |
| 74 | `(ver.ai_limits as any)?.models?.pro` |

Modifica: props/helper tipizzati sul dominio pricing (niente `any` / `as any`).

### 4) `PricingPlansPanel.tsx` — 4 in baseline doc / **5** Biome su `71ceaf5`

| Riga (pre) | Snippet |
|---:|----|
| 7 | `plansData: any[]` |
| 8 | `data?: any` in `onAction` |
| 13 | `getStatusInfo = (ver: any)` |
| 53 | `(v: any)` nel filter |
| 53 | `(ver: any)` nel map — **extra vs baseline doc (+1)** |

**Errore baseline:** doc **4**, Biome parent **5**.

### 5) `OnboardingVisualEditor.tsx` — 6 — Quality Delta (working tree, non B1)

| Riga (HEAD) | Snippet eliminato | Modifica concreta |
|---:|----|----|
| 113 | `(desktop as any)?.bgImage` | → accesso tipizzato `bgImage?: string` su `PositionConfig` / `UiConfig` |
| 113 | `(uiConfig as any).bgImage` | idem (2° `as any` stessa riga) |
| 114 | `(mobile as any)?.bgImage` | idem |
| 160 | `fullConfig: any` | → tipo strutturato |
| 236 | `catch (error: any)` | → `catch (error: unknown)` |
| 246 | `icon?: any` | → `icon?: LucideIcon` |

Batch: **altro — Quality Delta collaterale** (comunicationService / onboarding), **non** B1a/B1b/B1c.

### 6) `EditUserModal.tsx` — 1 — commit `8989490`

| Riga (pre) | Snippet | Modifica |
|---:|----|----|
| 34 | `catch (error: any)` | → `unknown` / narrowing |

### 7) `DiaryResourceCard.tsx` — 1 — commit `8989490`

| Riga (pre) | Snippet | Modifica |
|---:|----|----|
| 11 | `onViewDetail: (poi: any) => void` | → tipo POI di dominio |

### 8) `AuthModal.tsx` — 1 — commit `8989490`

| Riga (pre) | Snippet | Modifica |
|---:|----|----|
| 243 | `catch (e: any)` | → senza `any` / `unknown` |

### 9) `BuyCreditsModal.tsx` — 1 — commit `8989490`

| Riga (pre) | Snippet | Modifica |
|---:|----|----|
| 103 | `catch (err: any)` | → senza `any` / `unknown` |

### 10) `itineraryService.ts` — 2 — commit `8989490`

| Riga (pre) | Snippet | Modifica |
|---:|----|----|
| 429 | `catch (e: any)` | → senza `any` / `unknown` |
| 539 | `catch (e: any)` | → senza `any` / `unknown` |

---

## Esclusioni verificate (non applicabili)

| Ipotesi | Esito |
|---------|--------|
| Cambio scope Biome | **No** — stessi path `src/` + `server/` in entrambi gli inventari |
| Esclusione file da config | **No** — i 10 file sono ancora nel perimetro; hit = 0 |
| Modifica regola `noExplicitAny` | **No** — evidenza assente; conteggi overlapping file invariati |
| Differenza comando | **No** — stessa famiglia `biome check --reporter=json` |
| File rimossi/rinominati | **No** — tutti e 10 esistono |
| B1a / B1b / B1c | **No** — 0 hit `noExplicitAny` rimossi da quelle regole |

---

## Errore baseline (fuori dal delta 27, ma documentato)

Verifica Biome 2.5.6 sul contenuto `71ceaf5` (pre-`8989490`):

| File | Occ. in `C_noExplicitAny.md` | Occ. Biome su `71ceaf5` | Delta doc |
|------|-----------------------------:|------------------------:|----------:|
| `AiChatAssistant.tsx` | 2 | **5** | doc −3 |
| `PricingPlansPanel.tsx` | 4 | **5** | doc −1 |
| Altri 8 file del delta | = Biome | = Biome | 0 |

Questi **+4** sono **errore / sottocontabilizzazione per-file nella baseline**, non parte del delta documentale 473→446.  
Se si ricostruisse il debito “fisico” pre-`8989490` solo su questi 10 file si otterrebbe **31** hit eliminate in codice (21 doc + 4 undercount + 6 Onboarding), mentre il ledger documentale resta **27**.

---

## Tabella conclusiva (delta documentale 473 → 446)

| Causa | Occorrenze |
|--------|-----------:|
| realmente bonificate (commit `8989490`, tipizzazione) | **21** |
| realmente bonificate (Quality Delta Onboarding / UiConfig) | **6** |
| file rimossi/rinominati | **0** |
| cambio scope | **0** |
| differenze di configurazione / comando / regola | **0** |
| B1a / B1b / B1c | **0** |
| altro | **0** |
| **Totale delta** | **27** |

Identita: `21 + 6 + 0 + 0 + 0 + 0 + 0 = 27`. **Riconciliazione conclusa.**

---

## Nota operativa

- `C_noExplicitAny.md` resta **fotografia storica 473** con inventario per-file **parzialmente stale** (include ancora i 10 file gia a 0 e sottoconta AiChat/PricingPlans).  
- SoT numerica corrente: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md) + audit [`B2a_noExplicitAny_AUDIT.md`](./B2a_noExplicitAny_AUDIT.md) (**446**).
