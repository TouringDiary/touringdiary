# TouringDiary — istruzioni qualità (Gemini / AI)

## Source of Truth

L’unico verdetto ufficiale sulla qualità del progetto applicativo è:

```bash
npm run check
```

| Domanda | Comando / artefatto |
|---------|---------------------|
| Tipi TypeScript (app) | `npm run typecheck` |
| Lint + format | `npm run lint` → **Biome** (`biome.json`) |
| Layering z-index | `npm run lint:layers` |
| Contratto completo | `AI_DEV_WORKFLOW/WORKFLOWS/WF_QUAL_01_QUALITY_TOOLCHAIN_SOT.md` |

## Regole

- Non introdurre ESLint, Prettier o regole lint/format parallele.
- Non trattare le diagnostiche dell’IDE come autorità: conta la CLI del repository.
- Editor e Studio devono **consumare** `biome.json` e i `tsconfig` del repo, non ridefinirli.
- Edge Deno (`supabase/functions`) resta sulla toolchain Deno dedicata; non fa parte di `npm run check` finché il Workflow non lo promuove.
