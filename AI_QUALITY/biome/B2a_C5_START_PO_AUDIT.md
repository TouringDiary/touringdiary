# B2a Batch C5 — Audit di avvio (Product Owner)

> **Stato:** **ACCETTATO — batch chiuso** (2026-08-07, ACCETTO PO formale).  
> Perimetro live **8** → **0** (`SuggestionModal` + `suggestionService`).  
> Metodologia: SoT Parte 5 **§21 / §21.1 / §22**.  
> SoT: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md) · Indice C: [`B2a_BATCH_C_INDEX.md`](./B2a_BATCH_C_INDEX.md) · Dettaglio tecnico: [`B2a_C5_COMMUNITY_AUDIT.md`](./B2a_C5_COMMUNITY_AUDIT.md)  
> Predecessore: **C4 — Services** **ACCETTATO**. Successore operativo: **C6** (chiuso) → **C1**.

---

## Verdetto (dopo §22)

| Domanda | Risposta |
|----|----|
| **Punto di partenza** | **C5 — Community** (Suggestion UI + `suggestionService`) |
| **Suddivisione in mini-batch?** | **No** — unico batch |
| **Forma** | **Un unico batch omogeneo C5** — perimetro live **8** `noExplicitAny` / **2** file |
| **Perché** | Vertical slice Suggestion end-to-end (modal ↔ service); stesso contratto di dominio; un solo ciclo review → smoke → ACCETTO |
| **Ordine interno (non è suddivisione)** | tipi Suggestion esistenti → service mapper/API → cast UI modal. **Un solo** ACCETTO PO a fine batch |
| **Bonifica codice** | **Completata e ACCETTATA** — 8 → 0 |

### Rivalutazione mini-batch (risposte esplicite)

1. **Esiste una motivazione architetturale che obbliga a dividere C5?**  
   **No.** Modal e service condividono lo stesso payload Suggestion. Separarli creerebbe due ACCETTO sullo stesso contratto.

2. **C5 può essere un unico batch a rischio ancora accettabile?**  
   **Sì.** 8 hit / 2 file; rischio **Medio**; smoke Suggestion pubblico + Admin review.

3. **Quando una suddivisione diventerebbe legittima?**  
   Solo se in implementazione emergesse un touch obbligatorio fuori perimetro (es. rifattorizzare tutto Community) — **fermare e chiedere al PO**.

4. **Cosa NON giustifica la frantumazione**  
   - Classificazione storica «2 hit» (obsoleta: live = 8).  
   - «Modal vs service» come menu diversi (stesso dominio).  
   - Tabella storica C5-M1/M2 — **non** piano obbligatorio.

---

# A) Visione funzionale (UI e dominio)

## A.1 Di cosa stiamo parlando

Gli utenti segnalano miglioramenti alla guida (nuovo luogo / correzione info). Gli Admin moderano le segnalazioni (approva / rifiuta / in lavorazione).

Il gruppo **C5** tipizza i punti in cui quel flusso usa ancora `any` sul payload Suggestion — **senza** cambiare regole di moderazione, XP, flag feature o layout.

## A.2 Dove si trova (superfici prodotto)

| Area prodotto | Voce / percorso (etichette UI reali) |
|----|----|
| Pubblico — scheda città | Azione **«Migliora la Guida»** / **«Segnala Servizio»** → modal Suggestion |
| Account utente | Area contributi / overview segnalazioni utente (lista da `getUserSuggestionsAsync`) |
| Admin — Community | Moderazione segnalazioni → modal **Suggestion Review** (usa `updateSuggestionStatus` / `applySuggestion`) |

## A.3 Flusso completo (prodotto)

```text
[1] Utente apre SuggestionModal da scheda città
        ↓
[2] Compila titolo / categoria / descrizione (e tipi errore se edit_info)
        ↓
[3] ★ C5 ★ addSuggestion → insert tabella suggestions (status pending)
        ↓
[4] Admin apre review → approve / reject / processing
        ↓
[5] ★ C5 ★ updateSuggestionStatus / applySuggestion aggiornano status + details
        ↓
[6] Liste utente/admin rileggono getAllSuggestionsAsync / getUserSuggestionsAsync
```

## A.4 Impatto sul prodotto

| Se la bonifica è corretta | Se è errata |
|----|----|
| Invio segnalazione invariato | Submit fallisce o payload incompleto |
| Stesse categorie selezionabili | Cast categoria rifiuta valori validi |
| Moderazione Admin invariata | Approve/reject non aggiorna status/notes |
| Liste segnalazioni invariate | Mapping DB→`SuggestionRequest` perde campi |

## A.5 Rischi di una modifica errata

| Rischio | Sintomo in UI |
|----|----|
| `addSuggestion` troppo stretto | Modal success ma riga DB incompleta / errore insert |
| Categoria union troppo stretta | Select categoria non inviabile |
| Mapper list (`s: any`) errato | Liste Admin/utente vuote o campi `undefined` |
| `updateSuggestionStatus` / `applySuggestion` | Review Admin non persiste notes/details |

## A.6 Dipendenze con gli altri gruppi C

| Gruppo | Relazione con C5 |
|----|----|
| **C3 (chiuso)** | Esistono già `SuggestionRequest`, `SuggestionType`, union `details.category` — **riuso obbligatorio** |
| **C4 (chiuso)** | Nessuna dipendenza operativa |
| **C1 AI** | **Fuori scope** |
| **C6 Utils** | **Fuori scope** |
| **Residuo B** `interactionService.ts` | **Fuori perimetro C5** (file separato classificato B; non co-locato) |

## A.7 Lacune dichiarate (§21.1)

| Cosa | Stato |
|----|----|
| Click esatto Home → città → «Migliora la Guida» | Usare il percorso già noto al PO dagli smoke pubblici; se sconosciuto → **fermare e chiedere** |
| Voce menu Admin esatta per review suggestion | Verificare etichetta reale in Pannello Admin (Community / Moderazione); lacuna se rename recente |
| Feature flag `MODERATION_SUGGESTIONS` | Smoke richiede flag **enabled** in ambiente di test |
| Account utente non-guest | Serve utente autenticato UUID valido |

## A.8 Percorso QA primario — Invio suggestion (obbligatorio)

**Prerequisito:** utente autenticato; flag suggestions abilitato; **CITTÀ_TEST**.

1. Aprire TouringDiary (ambiente di test).  
2. Accedere come utente **non-guest**.  
3. Aprire scheda **CITTÀ_TEST**.  
4. Avviare **«Migliora la Guida»** (o equivalente già usato).  
5. Compilare titolo + categoria + descrizione; inviare.  
6. Verificare messaggio di successo (nessun errore a schermo).  
7. (Opzionale) ripetere flusso **edit_info** su POI esistente se disponibile.

## A.9 Percorso QA secondario — Moderazione Admin (obbligatorio per ACCETTO)

| # | Percorso | Cosa verificare |
|---:|----|----|
| S1 | Admin → elenco segnalazioni pending | La nuova segnalazione compare (o lista carica senza crash) |
| S2 | Aprire review di una pending | Modal review si apre con titolo/categoria/descrizione |
| S3 | Impostare **processing** (se disponibile) | Status aggiornato senza errore |
| S4 | **Reject** con nota (ambiente test) | Status rejected; nota visibile |
| S5 | **Approve** solo su dato di test | Status approved; nessun crash |

Se S3–S5 non eseguibili per mancanza dati: annotare; ACCETTO resta basato su **A.8 + S1–S2** + lacune dichiarate.

## A.10 Schermate coperte dal batch unico C5

| Superficie UI | File C5 |
|----|----|
| Modal **Migliora la Guida** | `SuggestionModal.tsx` |
| Service Suggestion (API) | `suggestionService.ts` (via `communityService` re-export) |
| Review Admin (consumer, **non** in perimetro hit se 0 any) | `SuggestionReviewModal.tsx` — smoke only |

---

# B) Visione tecnica (codice)

> Per implementatori. Il PO può ignorare questa sezione.

## B.1 Perché un solo batch è architetturalmente sano (§22)

| Criterio | Valutazione |
|----|----|
| Pattern | Omogeneo: payload Suggestion / map DB row / cast categoria UI |
| Accoppiamento | Modal → `addSuggestion`; Admin → `update`/`apply`; liste → mapper |
| Dipendenza interna | Tipi C3 già presenti → service → UI cast |
| Dimensione | **8** hit / **2** file — inferiore a C3/C4 |
| Beneficio di spezzare | Nessuno dimostrabile |

## B.2 Perimetro batch unico **C5** (live, operativo)

| File | Hit live | Note |
|----|---:|----|
| `src/components/modals/SuggestionModal.tsx` | **1** | `category: formData.category as any` (classif. C) |
| `src/services/community/suggestionService.ts` | **7** | `addSuggestion` (C) + 6 leftover **B** co-locati (mapper ×2, details/rejectionMeta/payload, applySuggestion) |
| **Totale** | **8** | |

### Esclusi (esplicito)

| File | Hit | Motivo |
|----|---:|----|
| `src/services/community/interactionService.ts` | 1 | Residuo **B**, file separato — non espandere C5 (stesso criterio C4 vs residui B fuori file) |
| C1 / C4 / C6 / ImportStatsBar | — | Fuori gruppo |

Classificazione storica C5 = **2** hit — **obsoleta** per il perimetro operativo.

## B.3 Tipi da riusare (C3) — non duplicare

| Tipo esistente | Uso previsto |
|----|----|
| `SuggestionRequest` (`types/models/Media.ts`) | Shape lista + base insert |
| `SuggestionType` | `type` suggestion |
| `SuggestionRequest['details']` / union category | Cast categoria modal; details tipizzati |
| `Json` (database/supabase) | `details_json` / payload update se serve confine JSON |

## B.4 Quality Delta proposti (solo dopo ACCETTO — non applicati in questo audit)

| # | Delta | Rischio | Note |
|---:|----|----|----|
| QD1 | `addSuggestion(suggestion: Omit<SuggestionRequest, 'id'\|'status'\|'date'> \| …)` o DTO input dedicato **solo se** Omit non basta per campi opzionali runtime | Basso–Medio | Preferire riuso `SuggestionRequest` |
| QD2 | Mapper `(s: any)` → row tipizzata / `Database` suggestions row | Basso | Stesso mapping attuale |
| QD3 | `details` / `rejectionMeta` / `payload` → tipi locali o `Json` + campi noti | Basso | Nessun cambio runtime |
| QD4 | Modal: narrow `formData.category` verso `SuggestionRequest['details']['category']` senza `as any` | Basso | Type guard o union sul select |

**Vietato in bonifica:** suppressioni Biome; cast di fuga; toccare C1; tipizzare `interactionService`; cambiare comportamento feature flag / XP.

## B.5 Piano di lavoro (dopo ACCETTO perimetro)

1. Tipizzare `suggestionService` (7 hit) riusando `SuggestionRequest` / `Json`.  
2. Tipizzare cast categoria in `SuggestionModal` (1 hit).  
3. `typecheck` (attesi solo 3 save-hook baseline) + Biome any=0 sui 2 file.  
4. Smoke A.8–A.9.  
5. SoT chiusura (−8 any attesi → `noExplicitAny` **136**, progetto **1817** se nessun drift).  
6. ACCETTO PO chiusura C5.

## B.6 Chiusura

1. **ACCETTO PO** ricevuto — batch C5 chiuso.  
2. SoT sincronizzata con C6 (stesso ciclo).  
3. Prossimo: **C1 — AI / Gemini** (PO: [`B2a_C1_START_PO_AUDIT.md`](./B2a_C1_START_PO_AUDIT.md)).
