# AI_QUALITY — Qualita progetto (Biome)

Struttura documentale dedicata alla bonifica Biome dell'**intero progetto**.

- Dashboard / SoT principale: [`../AI_BIOME_AUDIT.md`](../AI_BIOME_AUDIT.md)
- Storico audit parziale 35 file: [`../AI_BIOME_AUDIT_35_FILES_HISTORY.md`](../AI_BIOME_AUDIT_35_FILES_HISTORY.md)
- Dettagli per categoria/gruppo: [`biome/`](./biome/)

## Principio

L'obiettivo **non** e zero warning. L'obiettivo e:

1. impedire nuovo debito tecnico;
2. ridurre progressivamente il debito legacy;
3. correggere ogni categoria secondo il livello di rischio definito (A, A/B, B, C, D);
4. evitare workaround, hack e suppressioni;
5. mantenere stabilita e assenza di regressioni.

## Indice documenti Biome

| Documento | Livello | Occorrenze | Note |
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
| [`B_a11y_click_and_static_interactions.md`](./biome/B_a11y_click_and_static_interactions.md) | B | 504 | |
| [`B_a11y_labels_and_forms.md`](./biome/B_a11y_labels_and_forms.md) | B | 257 | |
| [`B_a11y_aria_semantic_media.md`](./biome/B_a11y_aria_semantic_media.md) | B | 44 | |
| [`B_suspicious_iterable_shadow_assign.md`](./biome/B_suspicious_iterable_shadow_assign.md) | B | 62 | |
| [`B_noArrayIndexKey.md`](./biome/B_noArrayIndexKey.md) | B | 82 | |
| [`C_noExplicitAny.md`](./biome/C_noExplicitAny.md) | C | 473 | |
| [`C_useExhaustiveDependencies.md`](./biome/C_useExhaustiveDependencies.md) | C | 204 | |
| [`C_noNonNullAssertion.md`](./biome/C_noNonNullAssertion.md) | C | 128 | |
| [`C_hooks_security_parse_tsignore.md`](./biome/C_hooks_security_parse_tsignore.md) | C | 35 | |
| [`D_policy_and_false_positives.md`](./biome/D_policy_and_false_positives.md) | D | 0 | |

## Baseline

| Campo | Valore |
|----|----|
| **Data baseline full-project** | 2026-08-03 |
| **Diagnostiche totali** | **6232** |
| **File unici con diagnostiche** | **1043** |
| **Categorie Biome** | **51** |
