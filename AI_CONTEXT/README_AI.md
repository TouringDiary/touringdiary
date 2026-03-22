# 🧠 AI BOOT DOCUMENT — TouringDiary

Questo documento è il punto di ingresso per qualsiasi AI che lavori sul progetto TouringDiary.

Il suo scopo è permettere di comprendere rapidamente:

• architettura del progetto
• regole operative
• workflow di sviluppo

---

# ORDINE DI LETTURA OBBLIGATORIO

Prima di analizzare il codice del progetto, l'AI deve leggere questi documenti nell'ordine indicato.

1️⃣ AI_CONTEXT/00_AI_RULES.md
2️⃣ AI_CONTEXT/01_PROJECT_MAP.md
3️⃣ AI_CONTEXT/02_PROJECT_TECH_MAP.md
4️⃣ AI_CONTEXT/03_PROJECT_LOGIC_MAP.md
5️⃣ AI_CONTEXT/05_CRITICAL_FILES_MAP.md
6️⃣ AI_CONTEXT/06_CHANGE_IMPACT_RULES.md
7️⃣ AI_CONTEXT/07_AI_WORKFLOW.md

Solo dopo questa lettura è possibile procedere con l'analisi del codice.

---

# SCOPO DELLA DOCUMENTAZIONE

La documentazione AI_CONTEXT esiste per:

• fornire contesto architetturale alle AI
• ridurre errori nelle modifiche al codice
• evitare regressioni nel sistema
• mantenere coerenza nello sviluppo

---

# REGOLE OPERATIVE

Durante il lavoro sul progetto:

• non modificare file senza analisi dell'impatto
• rispettare il workflow definito in `07_AI_WORKFLOW.md`
• prestare particolare attenzione ai file indicati in `05_CRITICAL_FILES_MAP.md`

---

# NOTE

TouringDiary è un'applicazione React + Vite con integrazione Supabase e funzionalità AI.

Il progetto contiene diverse dipendenze tra:

• UI components
• stato globale (context)
• servizi backend
• sistemi AI

Per questo motivo ogni modifica deve essere eseguita con attenzione.

---