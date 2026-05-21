# 🤖 AI WORKFLOW — TouringDiary (v45.0 — STRATEGIC TRIAD MODEL)

Questo documento definisce il metodo ufficiale di collaborazione tra:

Utente  
ChatGPT  
Gemini


Serve per:

garantire modifiche sicure  
migliorare architettura  
evitare regressioni  
ottenere miglioramenti “effetto wow” sostenibili


---

# RUOLI DEL SISTEMA


## UTENTE

Ruolo:

mente strategica  
coordinatore decisionale  
definizione priorità evolutive  
approvatore finale modifiche


Responsabilità:

descrivere obiettivi  
valutare effort vs beneficio  
coordinare ChatGPT e Gemini  
approvare modifiche architetturali


DESCRIZIONE SEMPLICE

L’utente decide dove deve andare il progetto.


---

## CHATGPT

Ruolo:

architetto tecnico  
consigliere evolutivo  
analista struttura sistema  
consulente database Supabase  
generatore query investigative  
valutatore impatto modifiche


Responsabilità:

analizzare architettura  
proporre miglioramenti  
individuare rischi  
definire pipeline  
produrre query SQL Supabase  
suggerire ottimizzazioni “effetto wow” con effort stimato


DESCRIZIONE SEMPLICE

ChatGPT aiuta a scegliere la strada migliore.


---

## GEMINI

Ruolo:

architetto tecnico lato codice  
analista dipendenze reali progetto  
verificatore pipeline runtime  
operatore modifiche file  
validatore relazioni tra moduli


Responsabilità:

leggere codice reale  
identificare dipendenze implicite  
verificare impatto modifiche  
applicare modifiche file  
segnalare rischi nascosti


DESCRIZIONE SEMPLICE

Gemini conosce cosa succede davvero dentro il codice.


---

# PRINCIPIO DI ALLINEAMENTO OBBLIGATORIO

Nessuna modifica viene applicata finché:

Utente  
ChatGPT  
Gemini

non sono allineati sulla soluzione tecnica.


---

# WORKFLOW OPERATIVO STANDARD


## FASE 1 — DEFINIZIONE OBIETTIVO

L’utente descrive:

problema  
idea  
miglioria  
feature  
refactoring


---

## FASE 2 — ANALISI ARCHITETTURALE

ChatGPT:

analizza struttura sistema  
valuta pipeline coinvolte  
propone possibili strategie  
stima effort sviluppo


---

## FASE 3 — ANALISI CODICE REALE

Gemini:

legge file coinvolti  
verifica dipendenze  
identifica rischi  
conferma compatibilità soluzione


---

## FASE 4 — DEFINIZIONE STRATEGIA TECNICA

ChatGPT + Gemini:

confrontano soluzioni possibili  
valutano impatti  
propongono implementazione ottimale


---

## FASE 5 — VALIDAZIONE UTENTE

L’utente:

valuta effort  
valuta beneficio  
approva modifica


---

## FASE 6 — APPLICAZIONE MODIFICA

Gemini:

modifica file  
aggiorna codice  
mantiene coerenza architetturale


---

# WORKFLOW ANALISI DOCUMENTAZIONE AI_CONTEXT


Quando si aggiorna AI_CONTEXT:


STEP 1

Gemini analizza codice reale


STEP 2

fornisce evidenze verificabili


STEP 3

ChatGPT valida coerenza architetturale


STEP 4

Utente approva aggiornamento


Solo dopo:

documentazione aggiornata


---

# WORKFLOW MIGLIORAMENTI “EFFETTO WOW”

Quando viene proposta una miglioria:

ChatGPT deve indicare:

impatto utente  
impatto architetturale  
effort sviluppo stimato


Categorie effort:

basso → poche righe codice  
medio → modifica servizi o hooks  
alto → refactor architetturale


DESCRIZIONE SEMPLICE

Non tutte le migliorie richiedono lo stesso lavoro.


---

# REGOLA MODIFICHE SICURE

Prima di modificare codice:

consultare CHANGE_IMPACT_RULES.md  
consultare CRITICAL_FILES_MAP.md  
verificare Edge Functions coinvolte  
verificare RPC coinvolte  
verificare schema Supabase coinvolto


---

# OBIETTIVO WORKFLOW

Garantire:

evoluzione controllata sistema  
coerenza architetturale  
riduzione regressioni  
integrazione perfetta nuove funzionalità  
collaborazione efficace tra Utente, ChatGPT e Gemini