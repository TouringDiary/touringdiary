
# 🧠 DOC 02: PROJECT LOGIC_MAP (v39.0 - PERFORMANCE BOOST)

## 1. AUTOMAZIONE & AI TASK RUNNER
Il cuore delle operazioni massive (Import, Bonifica, Generazione) è l'`useAiTaskRunner`.
...

## 12. PERFORMANCE DATA LAYER (Novità v39.0)
Per garantire fluidità con database di grandi dimensioni:

1.  **Lightweight Staging:**
    *   Le liste di staging (importazione OSM) scaricano **solo le colonne essenziali** (`id`, `name`, `status`, `rating`).
    *   I dettagli completi (JSON pesanti) vengono caricati solo on-demand o durante il processo di pubblicazione.

2.  **Server-Side Ranking (RPC):**
    *   L'ordinamento e il filtraggio delle città nelle classifiche ("Top Mix", "Community", "AI") è spostato su **Supabase RPC** (`get_ranked_cities`).
    *   Questo evita di scaricare l'intero database sul client per calcolare l'algoritmo di ranking pesato.
    *   La paginazione è gestita nativamente dal database.

---
*Manuale Logico Aggiornato al 19/12/2025*
