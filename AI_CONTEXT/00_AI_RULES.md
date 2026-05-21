# 🛑 DOC 00: AI RULES / PREMESSE — REGOLE INTOCCABILI (v45.0 — ARCHITETTURA CERTIFICATA)

Questo documento definisce le regole fondamentali del sistema TouringDiary.

Serve per garantire:

• coerenza architetturale
• sicurezza delle modifiche
• allineamento tra documentazione e codice reale
• collaborazione coordinata tra Utente, ChatGPT e Gemini


---

# 🧠 1. REGOLA DEL CERVELLO (CRITICA)

TouringDiary utilizza Gemini tramite Supabase Edge Functions.

Pipeline reale verificata da codice:

Frontend  
→ Edge Function  
→ RPC consume_ai_credits  
→ Gemini API  
→ RPC log_ai_usage_tokens  
→ risposta frontend


DESCRIZIONE SEMPLICE

Quando l’utente usa l’AI:

il sistema verifica i crediti nel database  
poi esegue la richiesta  
poi registra il consumo reale  


IMPORTANTE

Nessuna funzione AI deve:

• bypassare Edge Functions
• bypassare RPC consume_ai_credits
• bypassare RPC log_ai_usage_tokens


---

# 🧭 2. REGOLA DI ARCHITETTURA COORDINATA

TouringDiary è progettato tramite architettura coordinata tra tre ruoli.


UTENTE

Ruolo:

• mente strategica del progetto
• coordinatore architetturale
• supervisore evoluzione sistema
• approvatore finale modifiche


CHATGPT

Ruolo:

• architetto tecnico
• consigliere architetturale
• consulente Supabase
• analista pipeline sistema
• generatore query investigative
• suggeritore effetti “wow” con effort stimato


GEMINI

Ruolo:

• architetto tecnico lato codice
• analista dipendenze tra file
• validatore compatibilità modifiche
• operatore modifiche file


REGOLA FONDAMENTALE

Nessuna modifica viene applicata finché:

Utente  
ChatGPT  
Gemini  

non sono allineati sulla soluzione tecnica.


---

# 🧾 3. REGOLA EVIDENZA DOCUMENTALE OBBLIGATORIA

AI_CONTEXT può essere aggiornato solo con evidenze verificabili da:

• file codice
• Edge Functions
• schema Supabase
• RPC database
• types Supabase
• services runtime


DESCRIZIONE SEMPLICE

La documentazione non deve contenere ipotesi.

Solo ciò che esiste realmente nel codice può essere documentato.


---

# 💾 4. DATABASE SUPABASE = FONTE DI VERITÀ

Prima di scrivere codice:

consultare sempre:

src/types/supabase.ts


Se serve una nuova colonna:

1. dichiararlo esplicitamente
2. fornire query SQL
3. aggiornare i types


---

# 🤝 5. REGOLA CONSIGLI ARCHITETTURALI ATTIVI

ChatGPT e Gemini devono:

• proporre miglioramenti possibili
• segnalare incoerenze architetturali
• prevenire regressioni
• suggerire ottimizzazioni UX
• proporre effetti “wow”
• stimare effort implementativo


---

# 🚀 6. REGOLA SUGGERIMENTI WOW CON EFFORT

Ogni suggerimento deve includere:

• livello effort
• file coinvolti
• rischio regressioni
• impatto architetturale


Effort livelli:

LOW  
MEDIUM  
HIGH


---

# 🧭 7. REGOLA SPIEGAZIONE A DOPPIO LIVELLO

Ogni spiegazione deve seguire:

1. spiegazione semplice
2. spiegazione tecnica (se necessaria)


---

# 🔒 8. COMPONENTI CONSOLIDATI

Non modificabili senza analisi impatto:

• TravelDiary.tsx
• AppCoordinator.tsx
• ModalManager.tsx
• NavigationContext.tsx
• aiUsageService.ts
• Supabase client
• ConfigContext


---

# 🧠 9. SISTEMA CREDITI AI (STRUTTURA CERTIFICATA)

Tabelle reali:

• user_ai_credits
• credit_transactions
• ai_global_usage
• extra_credit_packages


RPC reali:

• consume_ai_credits
• log_ai_usage_tokens