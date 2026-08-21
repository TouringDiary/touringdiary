# AI_QUALITY — Qualita progetto (Biome)

Struttura documentale dedicata alla bonifica Biome dell'**intero progetto**.

> **Numeriche correnti (uniche):** esclusivamente in [`../AI_BIOME_AUDIT.md`](../AI_BIOME_AUDIT.md).  
> Questo README è un **indice** dei documenti di dettaglio — **non** una dashboard né una seconda Source of Truth numerica.

- SoT operativa: [`../AI_BIOME_AUDIT.md`](../AI_BIOME_AUDIT.md)
- Archivio storico principale: [`../AI_BIOME_HISTORY.md`](../AI_BIOME_HISTORY.md)
- Legacy (dettaglio congelato): [`../AI_BIOME_HISTORY_LEGACY.md`](../AI_BIOME_HISTORY_LEGACY.md)
- Storico audit parziale 35 file: [`../AI_BIOME_AUDIT_35_FILES_HISTORY.md`](../AI_BIOME_AUDIT_35_FILES_HISTORY.md)
- Dettagli per categoria/gruppo: [`biome/`](./biome/)
- Audit B2a `noExplicitAny`: [`biome/B2a_noExplicitAny_AUDIT.md`](./biome/B2a_noExplicitAny_AUDIT.md)
- Riconciliazione delta 473→446: [`biome/B2a_noExplicitAny_DELTA_RECONCILE.md`](./biome/B2a_noExplicitAny_DELTA_RECONCILE.md)
- Pattern audit B2b Tranche A: [`biome/B2b_A_TRANCHE_A_PATTERN_AUDIT.md`](./biome/B2b_A_TRANCHE_A_PATTERN_AUDIT.md) (inventario A; **Tranche A CHIUSA / ACCETTATA PO** — **non** dashboard numerica)
- Audit residuo B2b 389: [`biome/B2b_389_RESIDUAL_PATTERN_AUDIT.md`](./biome/B2b_389_RESIDUAL_PATTERN_AUDIT.md) (**snapshot / classificazione storica** al **389** — **non** è il residuo B2b corrente; numeriche vive → SoT)
- Review manuale 101 location static + follow-up CARD/shield/specials: [`biome/B_a11y_click_and_static_interactions.md`](./biome/B_a11y_click_and_static_interactions.md) · [`biome/BIOME_101_FOLLOWUP_AUDIT_CARD_STOPPROP_SPECIALS.md`](./biome/BIOME_101_FOLLOWUP_AUDIT_CARD_STOPPROP_SPECIALS.md) (review qualitativa — **non** nuova baseline)
- Registro audit comportamentale S-CARD-ROW (32): [`biome/AUDIT_S_CARD_ROW_32.md`](./biome/AUDIT_S_CARD_ROW_32.md) (percorsi UI + decisioni PO — **nessun fix**)
- Registro FP intenzionali (18): [`biome/D_policy_and_false_positives.md`](./biome/D_policy_and_false_positives.md)

## Principio

L'obiettivo **non** e zero warning. L'obiettivo e:

1. impedire nuovo debito tecnico;
2. ridurre progressivamente il debito legacy;
3. correggere ogni categoria secondo il livello di rischio definito (A, A/B, B, C, D);
4. evitare workaround, hack e suppressioni;
5. mantenere stabilita e assenza di regressioni.

## Indice documenti Biome

> Colonna **Baseline documento** = occorrenze tipiche al momento della redazione della scheda (fotografia storica del documento).  
> Le schede in `biome/` possono restare **intenzionalmente non allineate** alla SoT numerica corrente: servono come contesto di categoria, non come conti vivi.  
> Residue / avanzamento → esclusivamente [`AI_BIOME_AUDIT.md`](../AI_BIOME_AUDIT.md).

| Documento | Livello | Baseline documento | Note |
|----|----|---:|----|
| [`A_format.md`](./biome/A_format.md) | A | 964 | |
| [`A_organizeImports.md`](./biome/A_organizeImports.md) | A | 786 | |
| [`A_useImportType.md`](./biome/A_useImportType.md) | A | 862 | |
| [`A_mechanical_style_small.md`](./biome/A_mechanical_style_small.md) | A | 211 | |
| [`AB_noUnusedImports.md`](./biome/AB_noUnusedImports.md) | A/B | 328 | |
| [`AB_useButtonType.md`](./biome/AB_useButtonType.md) | A/B | 852 | |
| [`AB_suspicious_and_switch_small.md`](./biome/AB_suspicious_and_switch_small.md) | A/B | 31 | |
| [`B_noUnusedVariables.md`](./biome/B_noUnusedVariables.md) | B | 204 | |
| [`B_noUnusedFunctionParameters.md`](./biome/B_noUnusedFunctionParameters.md) | B | 121 | |
| [`B_useOptionalChain.md`](./biome/B_useOptionalChain.md) | B | 84 | |
| [`B_a11y_click_and_static_interactions.md`](./biome/B_a11y_click_and_static_interactions.md) | B | 504 | Baseline storica scheda; snapshot scheda 480; review 101 = qualitativa (non baseline) |
| [`B_a11y_labels_and_forms.md`](./biome/B_a11y_labels_and_forms.md) | B | 257 | |
| [`B_a11y_aria_semantic_media.md`](./biome/B_a11y_aria_semantic_media.md) | B | 44 | |
| [`B_suspicious_iterable_shadow_assign.md`](./biome/B_suspicious_iterable_shadow_assign.md) | B | 62 | |
| [`B_noArrayIndexKey.md`](./biome/B_noArrayIndexKey.md) | B | 82 | |
| [`C_noExplicitAny.md`](./biome/C_noExplicitAny.md) | C | 473 | |
| [`C_useExhaustiveDependencies.md`](./biome/C_useExhaustiveDependencies.md) | C | 204 | |
| [`C_noNonNullAssertion.md`](./biome/C_noNonNullAssertion.md) | C | 128 | |
| [`C_hooks_security_parse_tsignore.md`](./biome/C_hooks_security_parse_tsignore.md) | C | 35 | |
| [`D_policy_and_false_positives.md`](./biome/D_policy_and_false_positives.md) | D | 18 FP intenzionali | `noStaticElementInteractions` drag/pointer/contentEditable — warning **attivi di proposito** |
| [`BIOME_101_FOLLOWUP_AUDIT_CARD_STOPPROP_SPECIALS.md`](./biome/BIOME_101_FOLLOWUP_AUDIT_CARD_STOPPROP_SPECIALS.md) | B2b review | — | Esito finale review STEP C/D/E (non piano aperto) |
| [`AUDIT_S_CARD_ROW_32.md`](./biome/AUDIT_S_CARD_ROW_32.md) | B2b audit UI | 32 | Registro percorsi UI S-CARD-ROW + decisioni PO (nessun fix) |

## Baseline storica di progetto (riferimento)

> Fotografia iniziale del piano full-project — **non** stato corrente.  
> Stato numerico corrente → [`../AI_BIOME_AUDIT.md`](../AI_BIOME_AUDIT.md).

| Campo | Valore |
|----|----|
| **Data baseline full-project** | 2026-08-03 |
| **Diagnostiche totali (baseline)** | **6232** |
| **File unici con diagnostiche (baseline)** | **1043** |
| **Categorie Biome (baseline)** | **51** |
