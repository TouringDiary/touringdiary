# 34A — Domain Design Rules (TouringDiary)

> **Costituzione del dominio** — regole permanenti e invarianti.
> **Non** è Product Vision UX.
> **Non** è roadmap, Workflow, Masterplan di implementazione o specifica tecnica (API, schema, RLS).
> Ogni evoluzione di prodotto o codice **deve** rispettare queste regole.
> Dettaglio del modello Viaggio → `37_VIAGGIO_DOMAIN.md`.
> Visione MySpace / MyWorld → `35_MYSPACE_PRODUCT_VISION.md`.
> Collaborazione → `28_COLLABORATION_WORKSPACE_SYSTEM.md`.
> Packing → `31_PACKING_SUITCASE_SYSTEM.md`.

**Versione:** 1.0.0  
**Data:** 2026-07-26  
**Stato:** Congelato — Source of Truth delle regole di dominio  
**Origine:** Review architetturale dominio Viaggio (chiusa 2026-07-26)

---

## 1. Aggregate Root

1. Il **Viaggio** è sempre l’**Aggregate Root** del patrimonio personale.
2. Nessuna risorsa del patrimonio personale può usurpare il ruolo di unità primaria al posto del Viaggio.
3. Il **Diario** non è il Viaggio. Il Diario è una risorsa del Viaggio.
4. L’identità del patrimonio (titolo, destinazione, periodo, copertina, proprietario, metadati) appartiene al **Viaggio**, non al Diario.

---

## 2. Test di appartenenza (obbligatorio)

Prima di aggiungere qualsiasi funzionalità al prodotto, rispondere:

> Appartiene al **patrimonio di un Viaggio**?

| Risposta | Collocazione |
|----------|--------------|
| Sì | Sezione del Viaggio (Resource, Library o View) oppure sotto-risorsa di una sezione esistente |
| No | Fuori dal Viaggio (es. Preferiti globali, Strumenti, Account, Community pubblica, Workspace operativo) — con motivazione esplicita |

È vietato introdurre sezioni root o parallele che duplicano materia già prevista nel modello Viaggio.

---

## 3. Stereotipi nel Viaggio: Resource · Library · View

Ogni elemento sotto il Viaggio appartiene a **uno solo** di questi stereotipi:

| Stereotipo | Significato | Esempi |
|------------|-------------|--------|
| **Resource** | Entità di patrimonio con lifecycle proprio (creabile, eliminabile, eventualmente condividibile come copia) | Diario, Valigia, Foto, Video, Allegato, Note-giorno Ricordi |
| **Library** | Indice di artefatti persistenti generati/acquistati, recuperabili nel tempo | Sezione Roadbook (libreria di snapshot) |
| **View** | Vista calcolata o modalità di navigazione; non è entità CRUD peer delle Resource | Mappa, Riepilogo |

Regole:

1. Non promuovere una View a Resource senza decisione formale di dominio.
2. Non nascondere ownership di un artefatto dietro una sola etichetta UI: generatore e libreria possono differire (es. Roadbook).
3. L’AI **non** è una sezione del Viaggio: è capacità trasversale; gli artefatti prodotti diventano Resource (o Library items) nella sezione appropriata.

---

## 4. MySpace ≠ Workspace

| Mondo | Ruolo |
|-------|--------|
| **MySpace** | Casa del patrimonio personale. Contiene i **Viaggi** (originali). |
| **Workspace** | Banco collaborativo. Contiene **sole copie** di risorse (e, se creato da un Viaggio, uno shell isomorfo al modello Viaggio). |

Regole:

1. MySpace e Workspace non condividono mai lo stesso oggetto (stesso id).
2. Il **Viaggio originale** non viene mai condiviso direttamente.
3. La collaborazione opera sempre su **copie** indipendenti (nuovo id, nessun sync con l’originale).
4. Eliminare in MySpace non elimina le copie Workspace; eliminare Workspace/copie non elimina gli originali MySpace.

---

## 5. Ownership

1. Il proprietario del Viaggio è il proprietario del patrimonio personale di quel Viaggio.
2. Foto, Video, Allegati e Valigie del viaggio appartengono al **Viaggio**.
3. Il Diario appartiene al Viaggio; il Roadbook **artefatto** è generato da un Diario e conservato nel patrimonio del Viaggio (libreria), con riferimento al Diario sorgente.
4. Le Note della sezione Ricordi appartengono al giorno della struttura Ricordi del Viaggio.
5. Le Valigie/Template in **Strumenti** appartengono all’utente **senza** appartenere a un Viaggio.

---

## 6. Collaborazione e condivisione

1. Restano ammesse le condivisioni per risorsa (Diario, Valigia, Template, future risorse condividibili) tramite Workspace dedicato a quella risorsa.
2. È ammesso creare un Workspace **partendo da un Viaggio**: selezione risorse → copie → shell con la stessa struttura logica del Viaggio; sezioni non copiate = vuote.
3. Questa modalità **estende** il modello; non sostituisce le condivisioni per singola risorsa.
4. Autosave, lock, realtime e ACL collaborativi operano sulla **copia**, mai sull’originale MySpace.
5. Non esiste (e non va introdotto) un kind collaborativo che condivida il Viaggio originale.

---

## 7. Cardinalità e Diario attivo

1. Un Viaggio può contenere **0..N Diari**. Il modello dati non impone un massimo.
2. Al più un **Diario attivo** per Viaggio (riferimento operativo per Home, pianificazione, generazione Roadbook, AI operativa, ecc.).
3. Se il Diario attivo viene eliminato, **nessun** altro Diario diventa attivo automaticamente: sceglie l’utente.
4. Un Viaggio può esistere **senza** alcuna risorsa (empty): è un contenitore legittimo.

---

## 8. Estendibilità (anti–debito)

1. Nuove dimensioni del Viaggio solo se superano il test di appartenenza e la regola anti–tab (non duplicare Diario / Ricordi / Allegati / Valigia).
2. Preferiti = stato globale dell’oggetto, **non** sezione del Viaggio.
3. Supporto, wallet, impostazioni = **Account**, non MySpace.
4. Community pubblica ≠ patrimonio MySpace: la pubblicazione parte tipicamente da un **Diario**, non dal Viaggio come unità collaborativa.
5. Vietato reintrodurre l’equivalenza «Diario = Viaggio» in UI, dominio o persistenza concettuale.

---

## 9. Linguaggio ufficiale

1. Nella documentazione **funzionale** e di dominio usare sempre **Viaggio** (non “Trip”).
2. Distinguere sempre: **Viaggio** (patrimonio) · **Diario** (racconto/piano) · **Workspace** (copie collaborative).
3. Distinguere le “note”: Note Diario ≠ Note Ricordi (per giorno) ≠ annotazioni Riepilogo.

---

## 10. Confine con implementazione

Queste regole vincolano ogni Masterplan, Workflow e implementazione.  
Dettaglio strutturale del Viaggio → `37_VIAGGIO_DOMAIN.md`.  
Come implementare → Masterplan di sviluppo in `AI_DEV_WORKFLOW/` (mai in questo file).

---

## Cronologia

| Versione | Data | Note |
|----------|------|------|
| 1.0.0 | 2026-07-26 | Costituzione iniziale post-freeze dominio Viaggio |
