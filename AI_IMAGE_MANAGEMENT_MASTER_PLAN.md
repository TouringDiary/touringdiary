# AI Image Management — Master Plan

> **Documento di riferimento permanente** per la gestione immagini di Personaggi famosi e POI in Touring Diary.  
> **Tipo:** decisioni approvate, obiettivi futuri, policy progettuali.  
> **Non descrive** lo stato implementativo del codice — per quello vedere `AI_IMAGE_MANAGEMENT_AUDIT.md`.  
> **Ultimo aggiornamento:** 2026-09-16 (D78 §23; §27 titolo; coerenza decisioni chiuse)

> ## ⚠️ REGOLA OBBLIGATORIA — LETTURA CONGIUNTA
>
> **PRIMA DI QUALSIASI SVILUPPO** relativo alla gestione immagini devono essere consultati **insieme**:
>
> 1. `AI_IMAGE_MANAGEMENT_MASTER_PLAN.md`
> 2. `AI_IMAGE_MANAGEMENT_AUDIT.md`
> 3. Il file **`AI_IMAGE_MANAGEMENT_MACROFASE_N_FILES.md`** della macrofase corrente
>
> I tre documenti devono essere **interpretati congiuntamente**.
> - Il **Master Plan** definisce decisioni e obiettivi approvati.
> - L'**Audit** descrive lo stato tecnico reale del repository e la progettazione preliminare.
> - Il file **MACROFASE_N_FILES** definisce file e ambiti tecnici della macrofase corrente.
>
> **Nessuno dei tre documenti deve essere interpretato isolatamente.**
>
> **Workflow pre-sviluppo:** (1) leggere i tre documenti → (2) technical design della macrofase → (3) verificare DB/RPC/RLS/Storage → (4) verificare perimetro file → (5) presentare cosa si intende modificare → (6) **attendere approvazione** → (7) solo dopo iniziare **SVILUPPO**. Ogni macrofase: **SVILUPPO** → **TEST** → E2E; non passare alla macrofase successiva senza TEST accettabile della precedente.

---

## 1. Scopo del documento

Questo documento cristallizza in modo permanente:

- il ragionamento architetturale e di policy sulla gestione immagini;
- le **decisioni già approvate** dal team di progetto;
- gli **obiettivi futuri** concreti;
- i **principi** che ogni implementazione futura dovrà rispettare.

Esiste perché la gestione immagini di Touring Diary tocca simultaneamente:

- UX pubblica (modali, Culture Corner, schede POI, Community, Galleria);
- **infrastruttura centrale** segnalazioni abuso e suggerimenti (§32–§33);
- automazione AI (ritratti rappresentativi, recovery, coda VERIFICARE IMMAGINE AI — §36);
- recupero automatico di fotografie reali (futuro);
- governance Admin (hub Segnalazioni, Libreria Media, moderazione, storico);
- rischio legale e di diritti (copyright, licenze, diritti di immagine, beni culturali).

**Fonte di verità per:** cosa vogliamo costruire e perché.  
**Non è fonte di verità per:** cosa esiste già nel codice (vedi Audit).

---

## 2. Obiettivo generale

Costruire un sistema di gestione immagini per **Personaggi famosi** e **POI / luoghi / monumenti** che sia:

| Requisito | Descrizione |
|-----------|-------------|
| **Automatizzato** | Pipeline end-to-end il più possibile automatica, con intervento Admin solo sui casi dubbi o eccezionali |
| **Conservativo** | Preferenza sistematica per il falso negativo rispetto al falso positivo |
| **Tracciabile** | Provenienza, licenza, attribuzione, date operative, storico modifiche |
| **Trasparente** | Fonte e natura dell'immagine visibili nel modale (reale vs AI vs placeholder) |
| **Robusto** | Download locale in Storage, indipendenza da link esterni, fallback a cascata |
| **Amministrabile** | Admin con controllo finale e priorità assoluta |
| **Coerente** | Allineato all'architettura esistente (Presentation Media, bucket `public-media`, filtri territoriali) |

**Regola progettuale fondamentale:**

> **MEGLIO NON AVERE UNA FOTO CHE UTILIZZARE UNA FOTO DUBBIA.**

Il sistema deve preferire un falso negativo ad un falso positivo:

- se una foto probabilmente è utilizzabile ma non possiamo verificarlo sufficientemente → **NON** utilizzarla automaticamente;
- se una licenza è ambigua → **NON** utilizzarla automaticamente;
- se la provenienza è ambigua → **NON** utilizzarla automaticamente;
- se esistono dubbi su copyright, diritto di utilizzo, diritto di immagine o altre restrizioni → **NON** utilizzarla automaticamente;
- la foto dubbia deve essere **accantonata** e resa disponibile all'Admin per valutazione/validazione manuale;
- il sistema **non deve cercare di "indovinare"** che una foto sia legalmente utilizzabile.

**Nota importante:** questa è una **policy tecnica e gestionale conservativa**. Non deve essere descritta come garanzia giuridica assoluta. L'obiettivo è **minimizzare il rischio** attraverso controlli predefiniti, non eliminare ogni possibile controversia legale.

---

## 3. Principi fondamentali

### 3.1 Meglio nessuna foto che una foto dubbia

Vedi regola sopra. Ogni pipeline automatica deve fallire in modo **sicuro** (fail-closed).

### 3.2 Policy conservativa

- Nessuna licenza, fonte o generazione AI garantisce da sola "zero problemi legali".
- CC BY verificata ≠ assenza automatica di diritti di immagine, privacy, marchi, restrizioni sui beni raffigurati.
- P18 / Wikimedia Commons ≠ immagine automaticamente libera.
- Persona defunta ≠ assenza automatica di diritti (es. Maradona).
- Data di pubblicazione ≠ prova di titolarità del copyright.

### 3.3 Automazione

Obiettivo: pipeline end-to-end automatica per quanto possibile, con escalation all'Admin solo per casi dubbi, scartati o su richiesta esplicita.

### 3.4 Tracciabilità

Ogni immagine attiva o archiviata deve permettere di rispondere internamente a:

- Da dove arriva?
- Chi l'ha creata?
- Qual è la licenza?
- Quando è stata recuperata/pubblicata/rimossa?
- Chi ha eseguito l'ultima operazione Admin?

### 3.5 Trasparenza

Nel modale pubblico e nell'interfaccia Admin devono essere visibili, quando applicabili:

- fonte e attribuzione (foto reali);
- dicitura AI standard (immagini generate);
- indicazione placeholder (quando rilevante);
- accesso alla segnalazione di problemi sull'immagine visualizzata (§31).

La segnalazione **non** equivale a prova di violazione: avvia un processo di verifica (§31.1).

### 3.6 Admin priority (D16 — selezione vs moderazione)

**A. Priorità di selezione dell'immagine (D16):** tra le immagini **utilizzabili** associate a un'entità, l'immagine caricata o assegnata manualmente dall'Admin ha **priorità assoluta** rispetto a fotografie reali trovate/verificate automaticamente, immagini AI e placeholder.

Esempio: il sistema trova una foto reale o genera un'immagine AI; successivamente l'Admin carica manualmente un'immagine → l'immagine Admin diventa quella **prioritaria** nel frontend; le altre possono restare storicamente registrate ma **non** hanno priorità visiva finché esiste un'immagine Admin valida e utilizzabile.

**B. Stati di moderazione (invariante):** la priorità Admin **NON** autorizza a bypassare **SUSPENDED**, **RIMOSSO**, altri stati di moderazione o una segnalazione ancora da gestire (NUOVO / IN VERIFICA). L'Admin gestisce le segnalazioni nel flusso **NUOVO → IN VERIFICA → OK/KO** (§31.8). Se un'immagine è sospesa/rimossa e l'Admin vuole sostituirla, carica una **nuova** immagine distinta, gestita come sostitutiva secondo stati e cronologia (§41); la cronologia dell'immagine precedente **non** viene cancellata.

**Non** usare «Admin override» (**D82**, §6.5) per intendere un bypass della moderazione: **D82** riguarda solo la **decisione amministrativa esplicita e registrata** nel percorso di verifica automatica delle foto reali (superare un blocco pipeline), non l'ignorare stati post-segnalazione.

### 3.7 Distinzione tipi immagine

| Tipo | Descrizione |
|------|-------------|
| **Admin** | Caricata/scelta/esplicitamente assegnata dall'Admin |
| **Foto reale verificata** | Recuperata automaticamente da fonte esterna, superati tutti i controlli policy |
| **Foto reale Admin** | Caricata/gestita dall'Admin (upload o URL assegnato manualmente) |
| **AI rappresentativa** | Generata con Intelligenza Artificiale, non fotorealistica, con dicitura obbligatoria |
| **Placeholder** | Asset generico predefinito, non rappresentante una persona/luogo specifico |

### 3.8 Marcatura strutturale origine immagine (decisione approvata — revisione 2026-09-13)

La distinzione tra i tipi di immagine **non deve essere solamente descrittiva** nel documento o nell'interfaccia: deve essere disponibile come **dato/metadata strutturale** dell'immagine, in modo che il sistema possa determinare in modo **semplice e affidabile** quale avviso o informazione mostrare nel frontend.

Il sistema deve poter distinguere almeno:

| Valore concettuale `image_origin` (o equivalente) | Significato | Effetto UX atteso |
|---------------------------------------------------|-------------|-------------------|
| `external_verified` | Foto reale recuperata automaticamente da fonte esterna e verificata | Fonte, attribuzione, licenza nel modale |
| `admin_upload` / `admin_assigned` | Foto reale caricata o assegnata dall'Admin | Provenienza Admin; attribuzione se disponibile |
| `ai_generated` | Immagine generata con Intelligenza Artificiale | Dicitura AI obbligatoria (§12) |
| `placeholder` | Placeholder generico macro-categoria | Indicazione placeholder quando rilevante |
| *(altri valori futuri)* | Community, cross-city reuse, ecc. | Da modellare — vedi §27 |

**Requisiti:**

- Per le immagini **AI** deve essere possibile riconoscere **senza ambiguità** che si tratta di un'immagine generata con Intelligenza Artificiale — tramite metadata persistito (es. flag `generated_by_ai` + `image_origin`), non solo euristiche sull'URL.
- Il frontend deve poter **derivare** la dicitura/modale corretta dal metadata, non da inferenze fragili.
- Lo **schema tecnico definitivo** per metadata immagine è **`media_assets`** + associazioni (`entity_image_assignments`) — decisioni **chiuse** (D75–D76, §41); dettaglio DDL in Macrofasi 1–2 (Q2 — scelta tecnica, non nuova decisione funzionale).

### 3.9 Regola di progettazione e sviluppo (decisione approvata — revisione 2026-09-15)

**Obbligo per ogni futura implementazione** relativa a immagini, segnalazioni, suggerimenti e verifiche AI.

Prima di scrivere codice:

1. **Comprendere** completamente il funzionamento attuale (leggere `AI_IMAGE_MANAGEMENT_AUDIT.md` + codice coinvolto).
2. **Audit reale** del repository — file, tabelle, enum, RPC, migration, RLS, trigger, servizi.
3. **Individuare** tutti i file coinvolti.
4. **Definire** il comportamento futuro (allineato a questo Master Plan — **nessuna decisione autonoma** che lo contraddica).
5. **Definire** come implementarlo — file esatti, DB, dipendenze, ordine.
6. **Suddividere** in **5 MACROFASI** ufficiali (§38 — approvate).
7. Ogni macrofase in due **MICROFASI**: **SVILUPPO** → **TEST** (TEST solo dopo SVILUPPO completato).
8. Alla fine di ogni macrofase: **test E2E pratici** del processo realmente impattato — reali, verificabili, click-per-click, comprensibili senza conoscenze di programmazione, basati sul codice effettivamente sviluppato.
9. I test **non** devono ricreare artificialmente elementi già presupposti esistenti (es. se si modifica un pulsante su POI esistente, il test parte dal POI già presente).
10. I test devono coprire l'**intero processo** impattato, non solo il singolo componente tecnico.

**Lettura obbligatoria prima di ogni macrofase:**

- `AI_IMAGE_MANAGEMENT_MASTER_PLAN.md`
- `AI_IMAGE_MANAGEMENT_AUDIT.md`

**Mappatura obbligatoria** per ogni intervento importante (dettaglio operativo in Audit §36): COSA · COME · FILE · DB · RPC · DIPENDENZE · MACROFASE · TEST E2E.

---

## 4. Personaggi famosi

### 4.1 Flusso desiderato (target)

```
Personaggio (city_people, per città)
    ↓
[1] Admin ha già assegnato immagine? → USA Admin (priorità assoluta)
    ↓ no
[2] Ricerca foto reale automatica (Wikidata P18 → Commons → metadati → policy)
    ↓ tutti i controlli OK?
    SI → download → Storage → metadati → attribuzione → immagine attiva
    NO/DUBBIO → accantona → disponibile Admin
    ↓ nessuna foto reale utilizzabile
[3] Generazione AI rappresentativa (non fotorealistica)
    ↓ successo?
    SI → upload Storage → metadato AI → dicitura modale → immagine attiva
    NO → placeholder macro-categoria
```

### 4.2 Discovery / import (contesto attuale da evolvere)

Il flusso attuale di discovery/import AI dovrà integrarsi con la pipeline sopra senza bypassare i controlli futuri sulle foto reali.

### 4.3 Community "Importa + Foto"

Le foto community accettate restano un percorso valido, ma devono rientrare nella governance unificata (provenienza, storico, priorità Admin).

### 4.4 Cross-city reuse

Eventuale riuso di ritratti tra città (stesso personaggio) dovrà rispettare la policy di provenienza e non riutilizzare URL dubbi o non verificati.

### 4.5 Publish gate

Un Personaggio **pubblicabile** richiede che **esista un'immagine utilizzabile** associata al Personaggio — **non** è obbligatoria una fotografia reale.

**«Immagine valida»** ai fini della pubblicazione significa semplicemente: *esiste un'immagine utilizzabile associata al Personaggio*, indipendentemente dall'origine:

| Origine ammessa | Esempi |
|-----------------|--------|
| Immagine caricata dall'Admin | Upload o URL assegnato manualmente |
| Fotografia reale verificata/approvata | Pipeline §6–§8, conferma Admin quando prevista |
| Immagine generata tramite AI | Secondo regole §11–§12 e scelta SI/NO in creazione |
| Placeholder previsto dal sistema | Macro-categoria o generale (§13) |

**Distinzioni obbligatorie:**

- **Requisito di pubblicazione:** almeno un'immagine utilizzabile (gerarchia di risoluzione §3.2–§3.6).
- **Origine dell'immagine:** Admin / foto reale verificata / AI / placeholder — tracciata strutturalmente (§3.8).
- **Gestione post-segnalazione:** un'immagine può diventare **SOSPESO** o **RIMOSSO**; la visibilità segue §34.5–§34.7. Un report **solo sull'immagine/associazione** **non** sospende automaticamente il Personaggio; un report sul Personaggio sospende il Personaggio; un report su entrambi sospende entrambi, ciascuno secondo il proprio stato; la gestione Admin avviene **indipendentemente** per entità e immagine (§34.6–§34.7, §35).

---

## 5. POI

### 5.1 Flusso desiderato (target)

Identico nella struttura a Personaggi, con adattamenti:

- placeholder POI **esistenti** per macro-categoria (riutilizzo, non duplicazione);
- attenzione specifica a **beni culturali italiani** (monumenti, musei, siti archeologici);
- generazione AI POI cover **non attiva** nella configurazione predefinita (**default NO**, **D51/D63**); l'opzione è **tecnicamente predisposta** e può essere attivata dall'Admin nel singolo processo di creazione tramite SI/NO — **non** esiste alcuna decisione funzionale aperta su questo punto (stesso principio di Santo Patrono).

```
POI (pois, per città)
    ↓
[1] Admin image → priorità assoluta
    ↓
[2] Foto reale verificata (stessa pipeline conservativa)
    ↓
[3] AI rappresentativa illustrativa del luogo (solo se Admin ha scelto SI in creazione — default NO)
    ↓
[4] Placeholder categoria POI (esistente)
```

### 5.2 Presentation Media vs Photograph domain

I POI usano **Presentation Media** (`pois.image_url`) — separato dal dominio **Photograph** (`photo_submissions`). Questa separazione architetturale va mantenuta.

### 5.3 Obiettivo futuro POI — completare, non rifare (decisione approvata — revisione 2026-09-13)

Per i POI l'obiettivo **non** è ricostruire da zero ciò che già funziona, ma **completare e migliorare** il sistema di gestione immagini secondo la stessa filosofia conservativa adottata per i Personaggi:

| Area | Obiettivo |
|------|-----------|
| Provenienza | Tracciamento strutturale origine immagine |
| Verifica | Policy conservativa su foto reali automatiche (futuro) |
| Diritti / licenza | Metadati completi e verificabili |
| Metadata | Origine, stato, attribuzione quando applicabile |
| Storage | Download locale foto verificate; indipendenza da URL esterni |
| Attribuzione | Visibile nel modale pubblico quando pertinente |
| Stato | Distinzione real / AI / placeholder quando pertinente |
| Gestione Admin | Priorità Admin; governance centralizzata |
| Storico | **D84**, **§20**, **§42.6** — MF3/MF4 |

**Placeholder POI:** i placeholder **esistono già**, sono **funzionanti** e **NON devono essere ricostruiti né sostituiti** (vedi §14). L'obiettivo futuro sui POI **non include** rifare i placeholder POI.

---

## 6. Foto reali

> **Principio fondamentale (D2, D80):** *«Meglio non avere una foto che utilizzare una foto dubbia.»*  
> **CC BY 4.0** è l'**unica** licenza ammessa dal percorso di **approvazione automatica** (D79), ma **non è sufficiente da sola** per la pubblicazione automatica.

### 6.1 Pipeline di verifica — checklist tracciabile (D80)

Per ogni fotografia candidata il sistema registra l'esito di **ogni step** applicabile. **Non** basta un unico esito finale «OK/KO».

**Esiti ammessi per step** (nomenclatura tecnica in §42.13):

| Esito funzionale | Significato |
|------------------|-------------|
| **VERIFICATO** | Controllo superato con affidabilità sufficiente |
| **NON VERIFICATO** | Dato non ottenibile con affidabilità sufficiente |
| **DUBBIO** | Elementi contraddittori o insufficienti |
| **BLOCCATO** | Controllo impedisce approvazione automatica |
| **NON APPLICABILE** | Controllo non pertinente a questa fotografia |

**Checklist funzionale** (raggruppamento tecnico §42.13 — **tutti** i controlli devono essere coperti):

| Gruppo | Controlli |
|--------|-----------|
| **Identità file** | Identificazione esatta file/fotografia; identificativo stabile asset; conservazione evidenze |
| **Fonte e provenienza** | Fonte; URL originale; attendibilità fonte; provenienza; coerenza foto-fonte-licenza |
| **Diritti e licenza** | Autore/creatore; titolare diritti/licenziante; licenza dichiarata; versione esatta licenza; URL licenza; validità licenza (**CC BY 4.0** per auto-path); condizioni utilizzo; copyright; obblighi attribuzione; completezza dati attribuzione |
| **Utilizzo TD** | Diritto di utilizzo previsto da Touring Diary; restrizioni ulteriori; uso commerciale vs altri usi quando rilevante |
| **Soggetti e contenuto** | Persone riconoscibili; diritti immagine/personality/publicity; privacy; marchi/loghi; opere/contenuti terzi incorporati |
| **Contesto territoriale/culturale** | Restrizioni bene/luogo/proprietà; beni culturali |
| **Affidabilità** | Informazioni contraddittorie; segnali fonte non titolare/licenziante; segnali copia/ripubblicazione non autorizzata |
| **Storico piattaforma** | Precedenti segnalazioni/rimozioni/problemi noti sulla stessa immagine |

**Regola di esito complessivo:**

- Se un controllo **fondamentale** è **BLOCCATO**, **DUBBIO** o **NON VERIFICATO** → **nessuna** pubblicazione automatica.
- Registrare: step bloccante, esito, motivazione, dati/evidenze usati, altri step non ancora verificabili, esito complessivo.
- Fotografia **non** distrutta: provenienza conservata; percorso Admin/placeholder (§19).

**Override Admin (D82):** l'Admin può superare un blocco con **APPROVAZIONE MANUALE / OVERRIDE** + motivazione obbligatoria — tracciata separatamente dalla **motivazione AI** (§6.4).

### 6.2 Quando ammessa

- Download obbligatorio in Supabase Storage
- Nessuna dipendenza permanente dal link esterno
- Conservazione completa metadati (vedi sezione 17)
- Attribuzione **sempre** mostrata nel modale (decisione progettuale TD, indipendentemente da requisiti minimi licenza)

### 6.3 Quando scartata/accantonata o in VERIFICARE IMMAGINE AI

- Conservata come candidata non approvata — **non** distrutta (D79)
- Altre licenze **registrate** in provenance e mostrate all'Admin
- Stato **VERIFICARE IMMAGINE AI** se candidata reale dubbia (D81)
- Placeholder finché non esiste immagine valida e pubblicabile

### 6.4 Motivazione AI vs motivazione Admin (D81)

| Tipo | Contenuto | Chi |
|------|-----------|-----|
| **Motivazione AI / sistema** | Perché il sistema **non** ha approvato automaticamente (step bloccante, esito, evidenze) | Pipeline automatica |
| **Motivazione Admin** | Perché l'Admin ha approvato manualmente, rifiutato, override, rimosso | Operatore Admin |

Entrambe **separate**, **obbligatorie** quando applicabili, **storicizzate** permanentemente.

### 6.5 Override Admin (D82)

L'Admin **può** superare un **blocco automatico della pipeline di verifica foto reali** (§6.1–§6.3). Registrato come **APPROVAZIONE MANUALE / OVERRIDE** con motivazione obbligatoria — decisione amministrativa **esplicita, separata dalla motivazione AI** (§6.4), **loggata** e ricostruibile: controlli automatici → blocco → decisione Admin → nuovo stato.

**NON** equivale a bypassare stati di moderazione post-segnalazione (**SOSPESO**, **RIMOSSO**, segnalazione **NUOVO/IN VERIFICA**) — vedi §3.6.B.

---

## 7. Licenze

### 7.1 Allowlist approvazione automatica (D79 — definitiva)

| Licenza | Percorso automatico |
|---------|---------------------|
| **CC BY 4.0** | ✅ **Unica** licenza che può entrare nel percorso di approvazione automatica **sotto il profilo licenza** |
| CC BY-SA, CC BY-NC, CC BY-ND, CC BY-NC-SA, CC BY-NC-ND, altre | ❌ **Non** auto-approvate |

**Altre licenze — comportamento obbligatorio (D79):**

- **Riconosciute** e **registrate** in provenance quando identificabili
- **Conservate** nello storico; **visibili** all'Admin
- **Valutazione manuale** Admin (eventuale override D82)
- **Placeholder** mentre l'entità deve restare visualizzabile
- **Non** interpretare «solo CC BY 4.0 automatico» come «ignorare altre fotografie»

### 7.2 CC BY 4.0 necessaria ma non sufficiente (D80)

**CC BY 4.0** è requisito di licenza per l'auto-path; la pubblicazione automatica richiede il superamento dell'**intera** pipeline §6.1.

**Non scrivere:** «CC BY = automaticamente sicura sotto ogni profilo».

### 7.3 CC BY 4.0 ≠ utilizzo sempre consentito

Anche CC BY 4.0 chiaramente verificata copre solo gli aspetti **della licenza fotografica**. Restano possibili:

- diritti di immagine della persona raffigurata;
- privacy;
- marchi;
- restrizioni sul bene raffigurato;
- regole sui beni culturali;
- altre restrizioni legali non coperte dalla licenza del file.

La policy deve prevedere **ulteriori verifiche** quando necessarie.

---

## 8. Wikidata / P18 / Wikimedia Commons

### 8.1 Ruolo di P18

P18 (proprietà Wikidata "immagine") è identificato come **strumento utile** per trovare automaticamente un'immagine associata a un elemento Wikidata (personaggio o POI con Q-id).

### 8.2 P18 NON equivale a libertà d'uso

**Decisione approvata:** P18 indica un file associato, **non** garantisce che il file sia utilizzabile secondo la policy Touring Diary.

### 8.3 Flusso concettuale desiderato

**Stato attuale:** integrazione Wikidata/P18 **non esistente** nel codice — attività **futura da costruire** (§38 **Macrofase 4**). Non va trattata come funzionalità già implementata.

**Flusso progettuale approvato (D64 — conferma Admin obbligatoria):**

```
Personaggio o POI
    → ricerca automatica Wikidata (Q-id / P18)     ← discovery, NON pubblicazione
    → proposta candidato all'Admin
    → **conferma esplicita Admin**                 ← solo dopo: associazione definitiva
    → individuazione file effettivo (Commons)
    → verifica fonte / metadati (autore, licenza)
    → applicazione controlli conservativi (§6, §7, §9, §10)
    → se tutto OK: download → Storage → media_assets → assignment
    → se dubbio: stato VERIFICARE IMMAGINE AI + coda Admin (§10)
    → altrimenti: scarto → fallback AI (se consentito) → placeholder
```

**Wikidata/P18 non autorizza automaticamente la pubblicazione dell'immagine.**

**Principio ribadito:** P18 è un **meccanismo di discovery** per trovare un candidato associato a un elemento Wikidata. **NON** è una garanzia di licenza, **NON** è una garanzia di sicurezza legale, **NON** sostituisce i controlli policy Touring Diary.

**Scope MVP:** **§42.9** — lookup se Q-id presente; conferma Admin obbligatoria.

---

## 9. Copyright / diritto di utilizzo / diritto di immagine

### 9.1 Concetti distinti (decisione approvata)

| Concetto | Significato operativo |
|----------|----------------------|
| **Copyright** | Diritti sul contenuto fotografico in sé |
| **Licenza** | Condizioni espresse sotto cui il titolare consente certi usi |
| **Diritto di utilizzo** | Valutazione complessiva se l'uso previsto da TD è ammissibile |
| **Diritto di immagine** | Diritti della persona raffigurata (vivente o meno — non assumere assenza per defunti) |
| **Provenienza** | Catena identificabile fonte → file → metadati |

Il sistema automatico deve verificare **tutti i controlli applicabili** alla categoria di contenuto. Nessuno sostituisce gli altri.

### 9.2 Persona vivente vs defunta

**NON** assumere: `defunto = nessun problema legale`.

Esempio discusso: Maradona — la morte non elimina automaticamente diritti di immagine o altre restrizioni.

La policy TD deve essere **più conservativa** della semplice distinzione vivente/defunto.

---

## 10. Beni culturali

### 10.1 Problema

Per beni culturali italiani (monumenti, musei, siti UNESCO, ecc.) **non** assumere che una licenza fotografica libera risolva ogni questione.

Possibili vincoli aggiuntivi:

- regole specifiche sui beni culturali;
- condizioni dell'ente/istituzione gestore;
- condizioni d'uso specifiche;
- diritti o restrizioni ulteriori;
- differenze uso commerciale vs non commerciale;
- differenze tra semplice fotografia e riproduzione del bene.

### 10.2 Approccio (decisione approvata)

- Automatizzare i controlli il più possibile;
- Se verifica insufficientemente affidabile → **NON utilizzare automaticamente**;
- Accantonare e rendere disponibile all'Admin;
- **Non** trasformare incertezza giuridica in "OK" automatico.

---

## 11. AI rappresentativa

### 11.1 Decisione approvata

> **"AI rappresentativa, non fotorealistica, non pensata per simulare una fotografia autentica della persona."**

### 11.2 Personaggi famosi — regole

- Evitare ritratti fotorealistici del **personaggio**
- Evitare riproduzione intesa come **fotografia autentica** del personaggio
- Evitare copia o imitazione di una **fotografia specifica** esistente
- Evitare riproduzione realistica del **volto**
- Evitare somiglianza facciale precisa
- Privilegiare figure viste di spalle
- Utilizzare silhouette quando opportuno
- Rappresentazioni illustrative prudenti, contestuali (epoca, ruolo, professione)
- Evocare il personaggio senza simulare fotografia autentica
- Non riprodurre stile di fotografi specifici
- Non usare AI per ricreare foto esistenti

### 11.2.1 Eccezione — città/ambientazione sullo sfondo (decisione approvata — revisione 2026-09-13)

Quando nella scena è rappresentata anche una **città o ambientazione pertinente** al personaggio, è ammesso utilizzare sullo **sfondo** una rappresentazione **realistica e riconoscibile** della città/luogo, mentre il **personaggio in primo piano** deve continuare a rispettare tutte le regole prudenti del §11.2.

**Esempio concettuale:**

- **Primo piano:** rappresentazione illustrativa e non fotorealistica del personaggio — senza riprodurre fedelmente il volto né una fotografia specifica del personaggio.
- **Sfondo:** città reale pertinente al personaggio, rappresentata realisticamente come ambientazione/contesto.

**Formulazione giuridicamente prudente (non semplificare):**

- La città in quanto **luogo** non viene trattata come una **persona** soggetta a diritto all'immagine.
- **Tuttavia** singoli elementi presenti nella scena possono comunque essere soggetti ad **altri diritti o restrizioni** — per esempio: opere d'arte, beni culturali, marchi, copyright di fotografie specifiche, restrizioni su riproduzioni.
- L'AI **non deve** copiare una fotografia specifica esistente.
- L'AI **non deve** riprodurre intenzionalmente un'opera protetta in modo problematico.

Questa precisazione **non** introduce un nuovo progetto autonomo: rende più precisa la policy AI già approvata per i Personaggi.

### 11.3 POI — regole (target)

- Rappresentazione originale e contestuale del luogo/monumento
- Non imitare fotografia specifica esistente
- Evitare elementi non necessari che introducano rischi
- Immagine illustrativa del luogo

### 11.4 Limiti

Immagine AI-generated **non** equivale automaticamente a "zero problemi legali". La policy AI deve prevedere ulteriori paletti.

---

## 12. Dicitura AI

### 12.1 Testo standard e licenza riuso terzi (D78)

**Dicitura modale pubblica (invariata):**

> **"Immagine generata con Intelligenza Artificiale - Rappresentazione illustrativa, non fotografia reale."**

**Licenza riuso terzi — decisione definitiva (D78):**

Le immagini AI generate da Touring Diary e pubblicate secondo questa policy possono essere **riutilizzate da terzi** con licenza **CC BY 4.0**.

L'utilizzatore deve:

- fornire **attribuzione appropriata a Touring Diary**;
- indicare la licenza **CC BY 4.0**;
- mantenere il **collegamento alla fonte originale** quando appropriato;
- rendere l'attribuzione sufficientemente chiara da identificare **fonte e licenza**.

**Non** descrivere questa decisione come «licenza da valutare». **Non** proporre licenze alternative come opzione aperta.

### 12.2 Dove deve comparire

1. **Modale immagine** — visibile all'utente **quando appropriato** (immagine con origine AI)
2. **Metadato interno** — conservato nel sistema di governance in modo strutturale (§3.8)

La dicitura deve essere **derivabile in modo affidabile** dal metadata `image_origin` / `generated_by_ai`, non da supposizioni sull'URL o sul percorso Storage.

### 12.3 Metadati aggiuntivi (target)

Valutare conservazione di: modello AI, timestamp generazione, prompt hash/versione, feature tag, operatore (se manuale).

**Requisito minimo approvato:** il sistema deve permettere di identificare senza ambiguità un'immagine come **generata con AI** — sia per mostrare la dicitura §12.1, sia per audit interno.

---

## 13. Placeholder Personaggi

### 13.1 Decisione approvata — **CHIUSA (Q9)**

Sistema di **placeholder generici per macro-categoria/ambito** — NON per persona specifica.

**Stato decisionale:** la scelta funzionale è **definitiva e chiusa**. La creazione e il caricamento del materiale grafico dei nuovi asset è un'**attività operativa di sviluppo** (Macrofase 1), **non** una decisione ancora da prendere.

**Placeholder già presenti** in **Admin Panel → Asset Globali** (POI, piattaforma, ecc.): **DEVONO RIMANERE** e **NON DEVONO ESSERE MODIFICATI** da questo intervento.

### 13.1.1 Dove gestirli — Asset Globali (decisione approvata — revisione 2026-09-13)

I placeholder dei Personaggi famosi **NON** devono essere gestiti in una **nuova area amministrativa separata**.

Devono essere gestiti nell'attuale percorso Admin:

```
Admin Panel → Asset Globali
```

all'interno di una **nuova sezione dedicata** specificamente ai placeholder dei Personaggi famosi.

**Principi gestionali:**

| Principio | Dettaglio |
|-----------|-----------|
| Riutilizzo | Seguire, per quanto tecnicamente possibile e sensato, lo **stesso identico modello gestionale** già utilizzato dagli altri placeholder funzionanti in Asset Globali |
| Codice esistente | Riutilizzare componenti, pattern e logiche esistenti (`AdminHeaderManager`, `PlaceholderSection`, registry placeholder) quando appropriato |
| No duplicazioni | Evitare duplicazioni inutili e seconda modalità gestionale parallela |
| Estensione sicura | Estendere il modello esistente in modo sicuro — **non** rompere i placeholder POI già funzionanti |
| No area separata | Non creare un pannello Admin autonomo solo per placeholder Personaggi se è possibile estendere Asset Globali |

**Riferimento implementativo esistente (da riutilizzare, non duplicare):** placeholder POI in `global_settings.category_placeholders`; placeholder piattaforma in Asset Globali / `platformPlaceholderOrigin.ts`.

**Placeholder dinamici per macro-categoria (D65, D89 — revisione 2026-09-16):**

- In **Asset Globali** (stesso percorso e modello gestionale degli altri placeholder — **no** gestione parallela, **no** nuova sezione Admin autonoma): aggiungere (1) un placeholder **specifico per ciascuna categoria** di Personaggio Famoso attualmente prevista dal sistema; (2) un placeholder **«Personaggio Generico»** per categorie future non ancora coperte.
- Obbligatorio anche **PLACEHOLDER GENERALE PERSONAGGI FAMOSI** (fallback di secondo livello — D65).
- Risoluzione fallback: (1) placeholder specifico categoria se configurato → (2) altrimenti placeholder generale / Personaggio Generico → (3) **mai** personaggio senza immagine di fallback.

### 13.2 Cosa NON deve essere

- Finto ritratto di persona
- Rappresentazione di Leonardo, Maradona, attore specifico
- Persona riconoscibile
- Nuova generazione AI del personaggio fallito

### 13.3 Cosa deve essere

Asset **predefinito e statico** per macro-categoria:

| Macro-categoria | Esempio placeholder |
|-----------------|---------------------|
| Attore | Set cinematografico generico |
| Regista | Ambiente cinematografico generico |
| Calciatore | Campo da calcio generico |
| Musicista | Palco/strumenti generici |
| Pittore | Atelier/cavalletto generico |
| Scienziato | Laboratorio generico |
| Scrittore | Biblioteca/ambiente scrittura generico |
| Politico | Ambiente istituzionale generico |

### 13.4 Fallback finale

Placeholder = ultimo livello della cascata. Se AI fallisce, **non** richiedere nuova generazione AI del placeholder.

---

## 14. Placeholder POI

**Decisione approvata:** i placeholder POI **esistono già**, sono **funzionanti** e devono essere considerati una **funzionalità esistente da preservare**.

Implementazione attuale: mappa `category_placeholders` in `global_settings`, runtime via `resolvePoiDisplayImageUrl` / `ImageWithFallback`.

**Obiettivi espliciti:**

- **Riutilizzarli** — non crearne di nuovi in duplicazione.
- **NON ricostruirli** — non sostituirli con un nuovo sistema parallelo.
- **NON romperli** — ogni evoluzione del sistema immagini POI (§5.3) deve preservare il comportamento placeholder attuale.

L'obiettivo futuro sui POI è completare provenienza, verifica, metadata, attribuzione e governance Admin — **senza** rifare i placeholder POI.

---

## 15. Priorità immagini

**Gerarchia approvata (identica per Personaggi e POI):**

```
1. IMMAGINE GESTITA/CARICATA/SCELTA DALL'ADMIN
2. FOTO REALE RECUPERATA AUTOMATICAMENTE E SUPERATA DA TUTTI I CONTROLLI
3. IMMAGINE AI RAPPRESENTATIVA
4. PLACEHOLDER
```

**Regole Admin:**

- Può sostituire l'immagine attiva in qualsiasi momento
- Può rimuovere l'immagine attiva (senza necessariamente distruggere il file fisico)
- L'immagine Admin prevale sempre su automatica, AI e placeholder

---

## 16. Libreria Media

### 16.1 Obiettivo — catalogo amministrativo completo (decisione approvata — revisione 2026-09-13)

La Libreria Media deve essere considerata un **vero catalogo amministrativo delle immagini**, **non** una semplice visualizzazione di una cartella Storage.

L'Admin deve avere una **gestione centrale e chiara** di tutte le immagini del sistema, incluse:

- immagini attive per Personaggi e POI;
- immagini AI generate;
- immagini reali verificate con metadati;
- immagini scartate/accantonate *(quando la gestione sarà affrontata — §19, §27)*;
- storico/archivio (**D84**, **§42.6**);
- filtri territoriali integrati.

**Per i Personaggi**, deve essere possibile arrivare alla **gestione completa delle immagini**, con:

| Requisito catalogo | Descrizione |
|--------------------|-------------|
| Copertura | Tutte le immagini rilevanti — non solo una sottocartella Storage |
| Provenienza | Origine strutturale (§3.8) |
| Stato | Stato verifica, attivo/archiviato/scartato quando modellato |
| Associazione entità | Personaggio / POI / città collegati |
| Metadata | Campi disponibili per origine, AI, licenza, ecc. |
| Fonte / attribuzione | Quando applicabile — sempre per foto reali verificate |
| Filtri territoriali | Continente → Nazione → Regione → Zona turistica → Città (§21) |

### 16.2 Evoluzione, non ricostruzione da zero

**Principio approvato:** se esistono già funzionalità nella Libreria Media (`AdminAssetLibrary`, tab Storage, overlay `getAssetUsageMap`, filtri In Uso/Inutilizzati), esse **NON devono essere rimosse** solo per introdurre la nuova gestione.

Devono essere:

- **mantenute**;
- **verificate**;
- **corrette** se non funzionanti;
- **estese** solo dove mancano funzionalità necessarie al catalogo completo.

Il Master Plan esprime come obiettivo una **Libreria Media completa e funzionante** — **senza assumere** che sia necessario costruirla da zero.

### 16.3 Stato attuale (riferimento Audit)

Oggi esiste la sezione Admin **"Libreria Media"** (`AdminAssetLibrary`) con tab per cartelle Storage. **Non** equivale ancora al catalogo amministrativo completo sopra — vedi Audit (PEOPLE PORTRAITS ≠ galleria completa personaggi).

### 16.4 Prima di aggiungere tab "Personaggi"

Verificare se PEOPLE PORTRAITS o altri tab coprono già parzialmente la funzione (Audit: attualmente **no** per copertura completa). Estendere, non duplicare.

---

## 17. Provenienza e attribuzione

### 17.1 Dati da conservare (foto reali verificate)

Quando disponibili:

| Campo | Descrizione |
|-------|-------------|
| `author` / `creator` | Autore/creatore |
| `source` | Fonte |
| `original_url` | URL originale |
| `license` | Licenza (es. CC BY) |
| `license_url` | URL pagina licenza |
| `attribution_text` | Testo attribuzione |
| `copyright_info` | Informazioni copyright aggiuntive |
| `retrieved_at` | Data recupero |
| `verification_status` | Stato verifica policy |
| `image_origin` | Origine (es. wikimedia_commons, admin_upload, community) |
| `notes` | Note operative |
| `wikidata_id` | Q-id Wikidata |
| `commons_file_id` | Identificativo file Commons |

### 17.2 Visibilità

- **Modale pubblico:** fonte **sempre** mostrata per immagini reali (decisione TD)
- **Admin:** pannello completo provenienza + motivo ammissibilità automatica

### 17.3 Immagini non gestite come semplici URL (decisione approvata — revisione 2026-09-13)

Le immagini **non devono essere gestite come semplici URL esterni** quando entrano nel sistema Touring Diary come contenuti ufficiali.

Quando un'immagine viene recuperata e utilizzata, devono essere conservati — **quando pertinenti e realmente disponibili** — i dati necessari a ricostruirne la **provenienza** e a **tutelare** Touring Diary.

**Campi da considerare** (oltre a quelli già elencati in §17.1):

- URL originale
- Fonte
- Autore / creatore
- Licenza e URL della licenza
- Testo di attribuzione
- Copyright
- Data di recupero (`retrieved_at`)
- Identificativi e provenance disponibili (Wikidata, Commons, ecc.)
- Stato della verifica
- Informazioni sulle condizioni di utilizzo quando disponibili
- Eventuale **data di pubblicazione** sul sito Touring Diary (§22)
- Dati utili a ricostruire la **storia** dell'immagine (versioni, sostituzioni, rimozioni — quando lo storico sarà affrontato)

**Principio di conservazione:** non conservare dati inutili indiscriminatamente, ma conservare i dati **realmente utili** a dimostrare internamente:

1. Da dove è stata recuperata l'immagine
2. Quando è stata recuperata
3. In quale stato di verifica si trovava
4. Quali condizioni/licenza risultavano associate
5. Quando Touring Diary l'ha eventualmente pubblicata
6. Quale versione/stato è stata utilizzata
7. Eventuali successive modifiche, sostituzioni o rimozioni

**Scopo della traccia documentale:** creare una base probatoria **il più completa possibile** — particolarmente importante per tutelarsi da contestazioni fraudolente o da soggetti che possano successivamente sostenere **falsamente** che Touring Diary si sia appropriata dell'immagine.

**Limite esplicito:** la conservazione di questi dati **NON garantisce** automaticamente l'esito favorevole in una controversia legale. Il loro scopo è la **tracciabilità e documentazione interna**, non una certificazione giuridica assoluta.

### 17.4 Centralizzazione provenienza — direzione architetturale (decisione approvata — revisione 2026-09-13)

Le precauzioni relative a:

- provenienza;
- licenza;
- autore;
- copyright;
- attribuzione;
- stato di verifica;
- fonte;
- metadata;
- eventuali diritti/restrizioni;

devono essere pensate, **fin dove possibile**, come una **capacità centralizzata e riutilizzabile** sia per **Personaggi** sia per **POI**.

**Decisione approvata (direzione, non schema):**

> **Centralizzare ciò che è realmente comune, evitando di duplicare la logica tra Personaggi e POI.**

**Schema tecnico:** **chiuso** — `media_assets` + provenance centralizzata (**D76**, **§42.1–§42.3**). Migrazione additiva da campi POI/personaggi legacy in MF3–MF5.

---

## 18. Download nel nostro Storage

**Decisione approvata:**

Quando immagine reale giudicata utilizzabile:

1. Verifica diritti/policy **PRIMA** dell'attivazione
2. Download in Supabase Storage (`public-media` o bucket dedicato futuro)
3. Conservazione metadati e riferimento URL originale
4. **Non** dipendere permanentemente dal sito esterno

**Distinzione esplicita:**

- "Abbiamo scaricato il file" ≠ "abbiamo il diritto di utilizzarlo"
- Il diritto va verificato **prima** dell'attivazione

---

## 19. Immagini scartate/accantonate

### 19.1 Concetto

Foto che non supera controlli automatici:

- **NON** diventa immagine attiva
- **NON** viene necessariamente distrutta
- Conservata come: scartata / accantonata / candidata non approvata
- Disponibile all'Admin per validazione manuale

### 19.2 Aree logiche distinte

1. Immagini POI scartate/accantonate
2. Immagini Personaggi famosi scartate/accantonate

Filtrabili dalla gestione del relativo oggetto (POI manager / Personaggi manager) e, quando opportuno, dalla Libreria Media (archivio/storico).

---

## 20. Storico immagini rimosse

### 20.1 Decisioni approvate

Quando Admin rimuove immagine dall'utilizzo attivo:

| Requisito | Dettaglio |
|-----------|-----------|
| Conservazione fisica | Non necessariamente eliminare il file |
| Storico | Mantenere associazione a Personaggio/POI e città |
| Distinzione | Distinguibile dall'immagine attiva |
| Motivazione | **Obbligatoria** al momento della rimozione |
| Modifica motivazione | Modificabile successivamente da Admin autorizzato |
| Audit trail | Admin/utenza, data/ora, motivazione, stato precedente/nuovo |

### 20.2 Metadati storico

Conservare quando possibile: Admin operatore, timestamp, motivazione, immagine, città, Personaggio/POI, fonte, licenza, origine, stato precedente, nuovo stato.

---

## 21. Filtri territoriali

**Decisione approvata:** riutilizzare filtri territoriali **già esistenti**, non introdurre sistema parallelo.

Gerarchia:

```
Continente → Nazione → Regione → Zona turistica → Città
```

Esempi d'uso futuro:

- Napoli → Personaggi → immagini rimosse/accantonate
- Roma → POI → immagini rimosse/accantonate

---

## 22. Data di pubblicazione

### 22.1 Esigenza

Conservare la **data di pubblicazione dell'immagine sul sito** — strumento di tracciabilità/provenienza temporale.

### 22.2 Distinzioni concettuali

| Concetto | Descrizione |
|----------|-------------|
| Data creazione file | Quando il file è stato creato alla fonte |
| Data recupero | Quando TD ha recuperato/scaricato |
| Data upload Storage | Quando salvato nel nostro Storage |
| Data assegnazione | Quando associato a Personaggio/POI |
| **Data pubblicazione** | Quando reso visibile sul sito |

### 22.3 Campi (decisione tecnica chiusa)

Su **`entity_image_assignments`**: `published_at`, `first_published_at`, `removed_at` (**§42.7**).

### 22.4 Limiti

**NON** presentare come garanzia giuridica di titolarità copyright o prova legale assoluta.

Obiettivo interno: dimostrare che *questa specifica immagine era già presente/pubblicata su Touring Diary a partire da questa data*.

---

## 23. Immagini AI riutilizzabili da terzi (D78 — chiusa)

**Decisione funzionale definitiva (D78, §12.1):** le immagini AI generate da Touring Diary e pubblicate secondo questa policy possono essere **riutilizzate da terzi** con licenza **CC BY 4.0**, con **attribuzione a Touring Diary**, indicazione della licenza CC BY 4.0 e collegamento alla fonte originale quando appropriato.

**Implementazione repository:** metadati licenza/attribuzione su asset AI, disclosure pubblica e persistenza strutturale — **gap implementativo** (Audit §23); roadmap Macrofasi 3–4. **Non** riaprire la scelta di licenza: è **chiusa** con D78.

---

## 24. Automazione end-to-end

### 24.1 Pipeline completa desiderata

```
PERSONAGGIO / POI
        ↓
Admin ha immagine assegnata? ──SI──→ IMMAGINE ADMIN (fine)
        ↓ NO
Ricerca immagine reale automatica
        ↓
Identificazione fonte + autore
        ↓
Recupero metadati licenza
        ↓
Verifica copyright
        ↓
Verifica licenza (allowlist CC BY v1)
        ↓
Verifica diritto di utilizzo
        ↓
Verifica diritti persona (se applicabile)
        ↓
Verifica restrizioni specifiche
        ↓
Verifica regole beni culturali (se applicabile)
        ↓
Verifica attribuzione disponibile
        ↓
Verifica policy Touring Diary
        ↓
    TUTTO OK?
    ↓ SI                    ↓ NO / DUBBIO
Download                  Accantona/scarta
    ↓                         ↓
Supabase Storage          Disponibile Admin
    ↓
Metadati + attribuzione
    ↓
IMMAGINE REALE ATTIVA
        ↓ (se nessuna foto reale utilizzabile)
Generazione AI rappresentativa
        ↓
    Successo?
    ↓ SI                    ↓ NO
Metadato AI + dicitura    PLACEHOLDER
IMMAGINE AI ATTIVA
        ↓
ADMIN: può sempre sostituire (priorità assoluta)
```

---

## 25. Admin governance

L'Admin deve poter:

| Azione | Descrizione |
|--------|-------------|
| Caricare immagine | Upload o URL con tracciamento provenienza |
| Assegnare | Associare a Personaggio/POI |
| Sostituire | Cambiare immagine attiva |
| Rimuovere | Con motivazione obbligatoria, storico preservato |
| Visualizzare storico | Tutte le versioni/precedenti |
| Vedere fonte/licenza/provenienza | Pannello metadati completo |
| Vedere scartate/accantonate | Filtri per territorio e tipo oggetto |
| Validare manualmente | Foto precedentemente accantonata (se policy consente) |
| Vedere audit trail | Chi ha eseguito operazioni, quando, perché |

**Priorità Admin (selezione):** tra immagini utilizzabili, l'immagine Admin prevale su automatica, AI e placeholder (§3.6.A) — **senza** bypassare stati di moderazione (§3.6.B).

---

## 26. Decisioni già prese

| # | Decisione | Stato |
|---|-----------|-------|
| D1 | Gerarchia immagini: Admin → foto reale verificata → AI → placeholder | ✅ Approvata |
| D2 | Policy conservativa: meglio nessuna foto che foto dubbia | ✅ Approvata |
| D3 | Allowlist licenze auto v1: solo **CC BY 4.0** (→ D79) | ✅ Approvata — aggiornata 2026-09-16 |
| D4 | CC BY-SA esclusa dalla v1 (ShareAlike) | ✅ Approvata |
| D5 | P18 utile ma NON garanzia libertà | ✅ Approvata |
| D6 | AI rappresentativa, non fotorealistica | ✅ Approvata |
| D7 | Dicitura AI standard obbligatoria | ✅ Approvata |
| D8 | Placeholder Personaggi: macro-categoria generica, asset predefinito | ✅ Approvata |
| D9 | Placeholder POI: riutilizzare esistenti | ✅ Approvata |
| D10 | Download foto reali verificate in Storage | ✅ Approvata |
| D11 | Metadati provenienza completi per foto reali | ✅ Approvata |
| D12 | Fonte sempre visibile nel modale (foto reali) | ✅ Approvata |
| D13 | Immagini scartate accantonate, non distrutte | ✅ Approvata |
| D14 | Storico rimozioni con motivazione obbligatoria | ✅ Approvata |
| D15 | Filtri territoriali esistenti riutilizzati | ✅ Approvata |
| D16 | **Priorità selezione** immagine Admin su automatica/AI/placeholder — **≠** bypass moderazione (§3.6) | ✅ Approvata — chiarita 2026-09-16 |
| D17 | Beni culturali: approccio conservativo dedicato | ✅ Approvata |
| D18 | Defunto ≠ automaticamente libero da diritti | ✅ Approvata |
| D19 | Migration `upsert_city_person_with_category_links` validata e applicata | ✅ Approvata |
| D20 | Correzioni flusso AI personaggi (aiVision, usePeopleAI, ecc.) verificate | ✅ Approvata |
| D21 | Marcatura strutturale origine immagine (real verified / admin / AI / placeholder) | ✅ Approvata — revisione 2026-09-13 |
| D22 | Placeholder Personaggi in Asset Globali — estendere modello esistente, no area separata | ✅ Approvata — revisione 2026-09-13 |
| D23 | Placeholder POI: preservare esistenti — non ricostruire | ✅ Approvata — revisione 2026-09-13 |
| D24 | Libreria Media = catalogo admin completo; evolvere esistente, non ricostruire da zero | ✅ Approvata — revisione 2026-09-13 |
| D25 | Centralizzazione provenienza/licenza/metadata comune Personaggi+POI (direzione) | ✅ Approvata — revisione 2026-09-13 |
| D26 | AI Personaggi: sfondo città realistico ammesso; personaggio resta illustrativo/prudente | ✅ Approvata — revisione 2026-09-13 |
| D27 | Traccia documentale provenance/tutela — non garanzia legale assoluta | ✅ Approvata — revisione 2026-09-13 |
| D28 | RPC upsert: esistenza ed esposizione PostgREST verificate | ✅ Approvata — revisione 2026-09-13 |
| D29 | Infrastruttura centrale segnalazioni/suggerimenti — riutilizzare ed evolvere l'esistente, non duplicare | ✅ Approvata — aggiornata 2026-09-15 |
| D30 | Terminologia UX: mantenere **"Segnala abuso"** — **non** introdurre "Segnala immagine" | ✅ Approvata — **correzione** revisione 2026-09-15 *(sostituisce direzione 2026-09-14)* |
| D31 | Segnalazione legata alla specifica immagine + anteprima modale | ✅ Approvata — revisione 2026-09-14 |
| D32 | Guest: segnalazione senza registrazione; verifica email OTP — funzionale (**D85**); tecnica **§42.12** | ✅ Chiusa — aggiornata 2026-09-16 |
| D33 | Sospensione **immediata** dell'**oggetto effettivamente segnalato** (entità **oppure** associazione immagine — regole §34.4–§34.7) | ✅ Approvata — aggiornata 2026-09-15 |
| D34 | Stati segnalazione unificati: NUOVO · IN VERIFICA · OK · KO · TUTTE | ✅ Approvata — revisione 2026-09-15 |
| D35 | Segnalazione conservata sempre; storico completo (**D84**, **§42.6**) | ✅ Approvata — aggiornata 2026-09-16 |
| D36 | ~~Email contatto pubblica opzionale~~ | ❌ **SUPERATA** — sostituita da **D88** (2026-09-16) |
| D37 | Admin Panel → **Segnalazioni** = hub centrale (4 macro-tab: Community · Santo Patrono · Personaggio Famoso · AI) | ✅ Approvata — revisione 2026-09-15 |
| D38 | Segnalazione collegabile a metadati provenienza quando disponibili | ✅ Approvata — revisione 2026-09-14 |
| D39 | Stati entità unificati: **DRAFT · PUBLISHED · SUSPENDED · NEEDS_CHECK · CANCELED** — vocabolario comune; NEEDS_CHECK **solo POI** (§34.2) | ✅ Chiusa — revisione 2026-09-15 |
| D40 | Stati immagine unificati: ATTIVO · SOSPESO · RIPRISTINATO · SOSTITUITO · RIMOSSO · VERIFICARE IMMAGINE AI | ✅ Approvata — revisione 2026-09-15 |
| D41 | Priorità visibilità: **stato entità > stato immagine** | ✅ Approvata — revisione 2026-09-15 |
| D42 | Modale Segnala abuso: tipologia Immagine/Personaggio (zero preselezione; entrambe ammesse) + motivazione + **note sempre obbligatorie** | ✅ Approvata — revisione 2026-09-15 |
| D43 | Segnalazione abuso ≠ Suggerimento foto — flussi distinti, infrastruttura condivisa dove possibile | ✅ Approvata — revisione 2026-09-15 |
| D44 | Categorie Personaggio spostate in Manager POI-DB → Edit Città → Storia (pulsante come Tassonomia) | ✅ Approvata — revisione 2026-09-15 |
| D45 | Rimozione voce menu Admin **Personaggi Famosi** quando tutte le funzioni migrate | ✅ Approvata — revisione 2026-09-15 |
| D46 | Community Abuso Foto: unico sistema con classificazione FOTO LIVE / FOTO GALLERIA CITTÀ | ✅ Approvata — revisione 2026-09-15 |
| D47 | Errori segnalati: modale pubblico con tendina POI obbligatoria (iniziale "---") | ✅ Approvata — revisione 2026-09-15 |
| D48 | Abuso POI: modello centrale Segnala abuso — **non** rompere flusso Rivendica/sponsor | ✅ Approvata — revisione 2026-09-15 |
| D49 | Santo Patrono **DRAFT** o **SUSPENDED**: pagina pubblica → pulsante **SUGGERISCI** (non contenuto Patrono) | ✅ Chiusa — revisione 2026-09-15 |
| D50 | AI attiva oggi solo Personaggio Famoso; stessa architettura predisposta per Patrono e POI | ✅ Approvata — revisione 2026-09-15 |
| D51 | Modale SI/NO generazione AI in creazione; default SI Personaggi · NO Patrono · NO POI | ✅ Approvata — revisione 2026-09-15 |
| D52 | Foto dubbia AI → VERIFICARE IMMAGINE AI + coda Admin + notifica (solo questo stato) | ✅ Approvata — revisione 2026-09-15 |
| D53 | Dicitura AI pubblica obbligatoria (testo standard §12) | ✅ Approvata — confermata 2026-09-15 |
| D54 | Sviluppo in macrofasi (max 5) con microfasi SVILUPPO/TEST + E2E | ✅ Approvata — revisione 2026-09-15 |
| D55 | Caso doppia segnalazione Immagine+Personaggio — regole KO/OK + **modello B** (due righe collegate) §35 | ✅ Approvata — aggiornata 2026-09-15 |
| D56 | Segnalazione OK = chiusura amministrativa, **non** cancellazione — registrazione storica permanente §31.9 | ✅ Approvata — revisione 2026-09-15 |
| D57 | Fotografia esatta segnalata **ricostruibile/consultabile** anche dopo sostituzione/rimozione — snapshot stabile §31.9 | ✅ Approvata — revisione 2026-09-15 |
| D58 | **5 macrofasi** ufficiali approvate — §38 | ✅ Approvata — revisione 2026-09-15 |
| D59 | **Fotografia autonoma** — oggetto di dominio distinto dall'entità; non semplice proprietà casuale | ✅ Approvata — revisione 2026-09-15 |
| D60 | **Associazione fotografia ↔ entità** esplicita; segnalazione agisce sulla **singola associazione** | ✅ Approvata — revisione 2026-09-15 |
| D61 | **Alert Admin** altri utilizzi (stesso personaggio altre città; stessa foto altre associazioni) — informativo, non azione automatica | ✅ Approvata — revisione 2026-09-15 |
| D62 | ~~Nessuna licenza prodotto AI~~ **SUPERATA** — sostituita da **D78** (CC BY 4.0 riuso terzi) | ✅ Superata 2026-09-16 |
| D63 | **AI generazione immagine** esclusa per POI e Santo Patrono oggi; architettura comune predisposta | ✅ Confermata — revisione 2026-09-15 |
| D64 | **Wikidata:** ricerca automatica + proposta + **conferma Admin**; P18 ≠ autorizzazione automatica | ✅ Approvata — revisione 2026-09-15 |
| D65 | **Placeholder Personaggi:** specifico per macro-categoria + **PLACEHOLDER GENERALE** fallback dinamico | ✅ Approvata — revisione 2026-09-15 |
| D66 | Distinzione esplicita **foto reale / AI / placeholder** — integrare `image_is_placeholder` o equivalente strutturale | ✅ Approvata — revisione 2026-09-15 |
| D67 | **Media Library** = catalogo immagini + relazioni utilizzo entità | ✅ Approvata — revisione 2026-09-15 |
| D68 | File perimetro macrofase obbligatori e **aggiornabili** durante sviluppo — `AI_IMAGE_MANAGEMENT_MACROFASE_N_FILES.md` | ✅ Approvata — revisione 2026-09-15 |
| D72 | **Santo Patrono — status editoriale:** colonna dedicata su tabella **`cities`**; **NON** in `patron_details` JSON; **NON** nuova tabella entità | ✅ Chiusa — revisione 2026-09-15 |
| D72-UI | **Sede UI stati Patrono (2026-09-18):** **DRAFT/PUBLISHED** → Edit Città → Storia → Santo Patrono; **SUSPENDED/CANCELED** → solo Segnalazioni → Santo Patrono (workflow report). Un solo campo `patron_editorial_status`. | ✅ Operativa — 2026-09-18 |
| D73 | Segnalazione **solo Foto** (Personaggio/Patrono): sospende **associazione/foto**; entità resta **PUBLISHED** se non segnalata (§34.6–§34.7) | ✅ Chiusa — revisione 2026-09-15 |
| D74 | Segnalazione **solo entità** (Personaggio/Patrono): entità → **SUSPENDED**; immagini non visibili; Patrono → **SUGGERISCI** | ✅ Chiusa — revisione 2026-09-15 |
| D75 | **media_asset:** identità immutabile per file/contenuto; sostituzione = nuovo asset (§41.1) | ✅ Chiusa — revisione 2026-09-15 |
| D76 | **Cronologia asset** permanente; **provenance** centralizzata su `media_assets`; **associazione** con stato proprio (§41.2–§41.4) | ✅ Chiusa — revisione 2026-09-15 |
| D77 | **RLS/accesso:** gestione asset Admin; lettura public secondo pubblicazione/associazione; evidenza segnalazione privata (§41.5) | ✅ Chiusa — revisione 2026-09-15 |
| D69 | **Guest OTP** — funzionalità approvata (email + OTP guest senza registrazione manuale); implementazione tecnica demandata (Supabase nativo preferito) | ✅ Chiusa funzionalmente — revisione 2026-09-15 |
| D70 | **Evidenza fotografica segnalata** — conservazione **permanente** insieme alla segnalazione; immagine esatta sempre consultabile; **non** solo URL | ✅ Chiusa funzionalmente — revisione 2026-09-15 |
| D71 | **Backfill legacy** — necessario con strategia **tecnicamente più sicura**; batch/lazy/dual-write = dettaglio progettazione, non scelta Paolo | ✅ Chiusa funzionalmente — revisione 2026-09-15 |
| D78 | **Licenza immagini AI generate da TD:** riuso terzi consentito sotto **CC BY 4.0**; attribuzione a **Touring Diary** + indicazione licenza + link fonte quando appropriato (§12.1) | ✅ Chiusa — 2026-09-16 |
| D79 | **Foto reali — auto-approvazione licenza:** solo **CC BY 4.0** ammette percorso automatico; altre licenze **registrate**, **non scartate**, valutazione **manuale** Admin + placeholder (§7, §6) | ✅ Chiusa — 2026-09-16 |
| D80 | **Pipeline verifica foto reali:** checklist **per-step** tracciabile (OK/VERIFICATO · NON VERIFICATO · DUBBIO · BLOCCATO · NON APPLICABILE); CC BY 4.0 **necessaria ma non sufficiente**; risultato finale derivato dagli step (§6.3) | ✅ Chiusa — 2026-09-16 |
| D81 | **VERIFICARE IMMAGINE AI:** foto reale dubbia → stato dedicato; **motivazione AI** separata da **motivazione Admin**; coda Admin → Segnalazioni → AI (§36.4–§36.5) | ✅ Chiusa — 2026-09-16 |
| D82 | **Override Admin (pipeline verifica):** può superare blocco automatico foto reali con **APPROVAZIONE MANUALE / OVERRIDE** + motivazione obbligatoria; **≠** bypass stati moderazione (§3.6, §6.5) | ✅ Chiusa — 2026-09-16 |
| D83 | **Segnalazione OK su immagine:** immagine → **RIMOSSO**; storico permanente + placeholder fino a sostituto valido (§31.8, §20) | ✅ Chiusa — 2026-09-16 |
| D84 | **Storico immagini Admin consultabile** con gerarchia geografica e metadati completi (§20, §21, §42.6) | ✅ Chiusa — 2026-09-16 |
| D85 | **Guest segnalazioni:** stesso modale Segnala abuso; email obbligatoria → OTP → verifica → INVIA; **no** SMS, **no** telefono, **no** registrazione (§33.6) | ✅ Chiusa — 2026-09-16 |
| D86 | **Visibilità combinata** entità + immagine/associazione — matrice §34.5 (PUBLISHED + SOSPESO → entità visibile, immagine no) | ✅ Chiusa — 2026-09-16 |
| D88 | **Segnalazioni:** canale **unico** = modale **Segnala abuso**; **nessuna** email pubblica/contatto esterno/configurabile Admin (§31.10); guest: email **nel modale** + OTP = identificazione segnalante (**D85**) | ✅ Chiusa — 2026-09-16 |
| D89 | **Placeholder Personaggi (Q9):** decisione funzionale **chiusa** — estendere **Asset Globali** (placeholder esistenti **invariati** + categoria + Personaggio Generico); materiale grafico = sviluppo MF1 (§13) | ✅ Chiusa — 2026-09-16 |
| D90 | **Atomicità end-to-end** aggiornamento entità + associazioni immagine nella **stessa operazione applicativa** — requisito architetturale definitivo; **≠** dual-write §42.15; soluzione **post-MF5** salvo approvazione esplicita di anticipo (§42.16) | ✅ Chiusa (requisito) — 2026-09-19 |

---

## 27. Stato delle decisioni, questioni storiche e scelte tecniche

> **Regola documentale (2026-09-16):** ogni tema con decisione funzionale **chiusa** (§26, D78–D89) **non** compare più come «da decidere». Le scelte puramente tecniche sono in **§42** — già prese e motivate. Le **verifiche post-sviluppo** restano esplicitamente indicate come tali (⚪).

### 27.1 Tabella questioni — stato vigente

| # | Tema | Stato | Decisione / riferimento vigente |
|---|------|-------|----------------------------------|
| Q1 | Licenza riuso immagini AI terzi | ✅ **CHIUSA** | **D78** — CC BY 4.0 + attribuzione Touring Diary |
| Q2 | Modello dati immagini (DDL) | 🔧 **Tecnica chiusa** | **§42.1–§42.2** |
| Q3 | AI cover POI / Santo Patrono | ✅ **CHIUSA** | **D51/D63/D50** — default **OFF** POI e Patrono · **ON** Personaggio; SI/NO in creazione; Admin può attivare nel singolo processo — architettura predisposta, **nessuna** decisione funzionale aperta |
| Q4 | Allowlist licenze foto reali | ✅ **CHIUSA** | **D79** |
| Q5 | Campi date pubblicazione/rimozione | 🔧 **Tecnica chiusa** | **§42.7** |
| Q6 | Bucket foto reali verificate | 🔧 **Tecnica chiusa** | **§42.8** |
| Q7 | Scope Wikidata MVP | 🔧 **Tecnica chiusa** | **§42.9** |
| Q8 | Override Admin | ✅ **CHIUSA** | **D82** |
| Q9 | Set placeholder Personaggi | ✅ **CHIUSA** | **D89** — Asset Globali; placeholder esistenti invariati + categoria + Personaggio Generico; materiale grafico = sviluppo MF1 |
| Q10 | Smoke test POST E2E RPC | ⚪ **VERIFICA POST-SVILUPPO** | Staging MF5 — **non** decisione funzionale |
| Q11 | Storico immagini | ✅ **CHIUSA** | **D84**, **§42.6** |
| Q12 | Immagini rimosse/accantonate | ✅ **CHIUSA** | **D83**, **§19–§20** |
| Q13 | Motivazione rimozione | ✅ **CHIUSA** | **D14**, **D82** |
| Q14 | Audit trail immagini | ✅ **CHIUSA** | **§42.6** |
| Q15 | `people_portraits` | 🔧 **Tecnica chiusa** | **§42.10** |
| Q16 | `image_is_placeholder` | 🔧 **Tecnica chiusa** | **§42.11** |
| Q17 | Esempi pratici E2E | 📝 **Documentazione** | Matrice MF5 |
| Q18 | Centralizzazione provenance | ✅ **CHIUSA** | **D76**, **§42.3** |
| Q19 | Schema segnalazioni | 🔧 **Tecnica chiusa** | **§42.4** |
| Q20 | ~~Email contatto pubblica~~ | ✅ **SUPERATA** | **D88** — canale unico modale Segnala abuso; **nessuna** email pubblica |
| Q21 | SMS/telefono guest | ✅ **SUPERATA** | **Rifiutata** — **D85** |
| Q22 | Struttura Admin Segnalazioni | ✅ **CHIUSA** | **§32** |
| Q23 | Modello B doppia segnalazione | ✅ **CHIUSA** | **§35.2** |
| Q24 | Evidenza immutabile | 🔧 **Tecnica chiusa** | **§42.5** — MF2 |
| Q25 | Micro-tab AI | ✅ **CHIUSA** | **§32 macro-tab AI**, **§36** |
| Q26 | OTP guest | 🔧 **Tecnica chiusa** | **§42.12** |
| Q27 | Macrofasi | ✅ **CHIUSA** | **§38** |
| Q28 | Atomicità entità + assignment (operazione applicativa) | 🔧 **Tecnica chiusa (requisito)** | **D90**, **§42.16** — implementazione definitiva **post-MF5** (o anticipo **solo** con approvazione) |

**Legenda:** ✅ chiusa funzionale · 🔧 tecnica §42 · ⚪ **VERIFICA POST-SVILUPPO** (test/verifica dopo sviluppo — **non** decisione funzionale) · 📝 doc operativa

### 27.2 Question superate (storico)

| Vecchia formulazione | SUPERATA — sostituita da |
|---------------------|--------------------------|
| Q1 «Non decidere CC» | **D78** |
| Q4 «Espansione allowlist» | **D79** |
| Q21 «SMS futuro» | **D85** — escluso |
| Q20 / D36 «Email pubblica segnalazioni» | **D88** — **eliminata definitivamente** |
| D62 «Nessuna licenza AI» | **D78** |
| D87 / ricollocazione Foto & Moderazione | **Revocata** — verifica repository **chiusa** §32.7: flussi **distinti**; moderazione upload **fuori scope** progetto |
| §27.1 lista «rimandati» | Tabella §27.1 |

---

## 28. Obiettivi futuri

> **Roadmap ufficiale:** le **5 MACROFASI** approvate sono in **§38**.  
> La numerazione **Fase A / B / C / D** (e A-bis) è **superata** — obiettivi cumulativi mappati sotto senza rimozione.

### 28.1 Mappatura obiettivi cumulativi → Macrofasi

| Obiettivo cumulativo (sempre valido) | Macrofase |
|--------------------------------------|-----------|
| Hub Admin → Segnalazioni, stati, categorie personaggio, Rivendica intatto | **1** |
| Segnala abuso unificato, suggerimenti, Community/POI/Patrono/Personaggio, modello B, guest OTP | **2** |
| Stati immagine, provenienza, AI, VERIFICARE IMMAGINE AI, coda, notifiche, disclosure AI | **3** |
| Wikidata/P18, Commons, foto reali CC BY, Media Library, storico, snapshot immagine segnalata | **4** |
| Consolidamento, regressioni, E2E, findExistingPortrait, Biome, Design System | **5** |

### 28.2 Elenco obiettivi (non rimossi — riferimento trasversale)

1. Modello dati unificato metadati immagine (Q2) — Macrofasi 1–4
2. Tracciamento `image_origin` strutturale (§3.8)
3. Flag AI + dicitura modale (§12)
4. Placeholder Personaggi in Asset Globali (§13.1.1)
5. Storico immagini + motivazione rimozione (**D84**, **§42.6**) — Macrofase 3–4
6. Admin upload Personaggi
7. Orphan cleanup `people_portraits` (Q15) — Macrofase 5
8. Libreria Media catalogo completo (§16) — Macrofase 4
9. Provenienza centralizzata Personaggi+POI (§17.4) — Macrofase 3–4
10. Wikidata P18 → Commons, CC BY, download Storage — Macrofase 4
11. Controlli beni culturali, diritti persona, `published_at` — Macrofase 3–4
12. Consolidamento AI cover (default OFF POI/Patrono — **D51/D63**), regressioni, E2E — Macrofase 5 (**Q10** verifica post-sviluppo)
13. **Atomicità end-to-end** operazioni che modificano entità e assignment insieme (**D90**, **§42.16**) — soluzione architetturale definitiva **dopo MF5** (salvo approvazione anticipo)

---

## 29. Regole da non violare

1. **Non implementare bypass automatici** della policy conservativa
2. **Non trattare licenze/fonti/AI come garanzia legale assoluta**
3. **Non unificare** Presentation Media POI con Photograph domain
4. **Non duplicare** filtri territoriali — riutilizzare esistenti
5. **Non generare placeholder Personaggi via AI** al fallimento AI ritratto
5b. **Non creare area Admin separata** per placeholder Personaggi — usare Asset Globali (§13.1.1)
5c. **Non ricostruire/sostituire** placeholder POI esistenti (§14)
6. **Non includere CC BY-SA** nella allowlist v1 senza decisione esplicita
7. **Non assumere P18 = libero**
8. **Non assumere defunto = libero**
9. **Non eliminare fisicamente** immagini rimosse/scartate senza policy esplicita
10. **Non omettere motivazione** su rimozione Admin
11. **Priorità selezione Admin** (§3.6.A) sempre rispettata nel resolver immagine attiva — **senza** bypassare stati di moderazione (§3.6.B)
12. **Non modificare prompt AI** senza review esplicita della policy immagine
13. **Tracciabilità** obbligatoria per ogni immagine attiva
14. **Separare** stato attuale (Audit) da obiettivi (Master Plan) nei documenti
15. **Migration RPC** `upsert_city_person_with_category_links` — non ricreare; già validata

---

## 30. Stato migration RPC

### Migration

**File:** `supabase/migrations/20260910180000_upsert_city_person_with_category_links.sql`

### Funzione

```sql
public.upsert_city_person_with_category_links(
  p_person jsonb,
  p_specific_category_ids uuid[] DEFAULT ARRAY[]::uuid[]
)
RETURNS uuid
```

### Stato (decisione approvata — aggiornato 2026-09-13)

| Aspetto | Stato |
|---------|-------|
| Migration presente nel repository | ✅ |
| Migration verificata e coerente con `entitiesService.ts` | ✅ |
| Migration accettata | ✅ |
| Migration pushata/applicata al DB remoto | ✅ |
| Esistenza funzione nel database remoto | ✅ Verificata |
| Schema `public` | ✅ Verificato |
| Firma `p_person jsonb, p_specific_category_ids uuid[] DEFAULT ARRAY[]::uuid[]` | ✅ Verificata |
| Return type `uuid` | ✅ Verificato |
| Esposizione PostgREST (OPTIONS, Allow: GET, HEAD, POST, OPTIONS) | ✅ Verificata — risposta HTTP 200 |
| Smoke test POST end-to-end via flusso applicativo reale | ⚪ **Ancora da eseguire** |

**Formulazione ufficiale:** esistenza ed esposizione PostgREST **verificate**; smoke test reale di salvataggio end-to-end **ancora da eseguire**. **Non** dichiarare che il POST applicativo sia già stato eseguito e validato.

### Comportamento atteso

- Richiede autenticazione admin o service role
- Valida payload
- Salva/aggiorna `city_people`
- Preserva dati esistenti negli update
- Sostituisce collegamenti `city_person_category_links` in transazione
- Restituisce UUID personaggio
- Coerente con `replacePersonCategoryLinks` lato client

**Non creare o modificare questa migration** — intervento concluso.

---

## 31. Sistema di segnalazione e gestione abusi (decisione approvata — cumulativo 2026-09-14, aggiornato 2026-09-15)

> **Coerenza:** integra §3.5, §17, §20, §25, **§32–§37**.  
> **Stato implementativo:** `AI_IMAGE_MANAGEMENT_AUDIT.md` §35–§36.  
> **Correzione 2026-09-15:** terminologia definitiva **"Segnala abuso"** (D30) — la direzione "Segnala immagine" (2026-09-14) è **superata** e non va implementata.

### 31.1 Principio generale

Touring Diary deve offrire un meccanismo **semplice, accessibile e senza obbligo di registrazione** per segnalare problemi relativi alle immagini.

Finalità della segnalazione (esempi non esaustivi):

- possibili problemi di copyright;
- problemi relativi alla licenza;
- problemi relativi alla provenienza;
- uso non corretto;
- contestazioni sui diritti;
- altre problematiche relative alla **specifica immagine**.

**Principi:**

- La segnalazione **NON** è prova automatica di violazione.
- La segnalazione **avvia** un processo di verifica.
- Il sistema deve essere coerente con la strategia generale di provenienza (§17.3) e con la tutela documentale — **senza** promettere immunità legale.

### 31.2 Riutilizzo del sistema esistente — Personaggi Famosi

Per i Personaggi Famosi esiste già un sistema/modale **"Segnala abuso"** (`ReportFamousPersonPhotoAbuseModal`, tabella `famous_person_photo_reports`, gestione Admin in `AdminFamousPeopleManager`).

**Decisione approvata:** **NON** costruire un secondo sistema indipendente.

Direzione:

- **riutilizzare** il sistema esistente;
- **adeguarlo** alla gestione specifica delle immagini (copyright, licenza, provenienza, diritti, ecc.);
- **estenderlo** ai POI (§31.11);
- mantenere il più possibile componenti, logiche e infrastruttura esistenti;
- **evitare duplicazioni**.

### 31.3 Terminologia UX — Segnala abuso (decisione definitiva 2026-09-15)

| Elemento | Direzione approvata | Note |
|----------|---------------------|------|
| Pulsante / comando | **"Segnala abuso"** | Nome modello centrale — **non** sostituire con "Segnala immagine" |
| Modale | Contesto esplicativo del problema (immagine, personaggio, POI, foto Community) | Adattabile al sistema traduzione; il **nome comando** resta "Segnala abuso" |

*(Oggi nel codice: titolo modale "Segnala abuso" in `ReportFamousPersonPhotoAbuseModal`, `ReportPatronPhotoAbuseModal` — Audit §36.)*

### 31.4 Immagine specifica segnalata

Requisito **fondamentale:** la segnalazione deve essere sempre associata alla **SPECIFICA IMMAGINE** selezionata dall'utente.

Il sistema **non** deve limitarsi a:

> "segnalazione sul Personaggio X"

Deve sapere:

> "segnalazione relativa all'immagine Y utilizzata dal Personaggio X"

Lo stesso principio vale per i **POI**.

**Requisiti UI e dati:**

- Nel modale l'utente deve vedere l'**anteprima** dell'immagine segnalata.
- L'utente deve poter verificare: *"questa è esattamente l'immagine che sto segnalando"*.
- La segnalazione deve conservare il riferimento all'immagine specifica (snapshot URL/path o identificativo asset) **anche se** l'immagine viene successivamente sostituita, sospesa o rimossa.

*(Parzialmente presente oggi per Personaggi — snapshot `person_image_url` + `person_image_storage_path`; vedi Audit §35.)*

### 31.5 Utente autenticato

Se l'utente è autenticato:

- può utilizzare il flusso di segnalazione esistente (evoluto);
- il sistema associa automaticamente la segnalazione al suo account;
- **non** deve essere costretto a reinserire un recapito già disponibile e verificato dal sistema.

### 31.6 Utente non autenticato e OTP

L'utente **NON** deve essere obbligato a registrarsi per segnalare.

**Requisiti:**

1. Email obbligatoria
2. Verifica tramite **OTP/codice**
3. Invio segnalazione **solo dopo** verifica
4. **Nessuna** registrazione obbligatoria

**Scelta tecnica:** non fissata nel Master Plan — regole §33.6 (verifica Supabase; scelta autonoma in sviluppo se nativo insufficiente).

**Estensione futura (non ora):** SMS/telefono.

**Limite:** verifica recapito ≠ prova titolarità diritti contestati.

*(Oggi: login obbligatorio — gap Audit §36.6.)*

### 31.7 Sospensione immediata dopo segnalazione valida (aggiornato 2026-09-15)

**Decisione approvata (D33):** alla ricezione, l'**oggetto effettivamente segnalato** → **SUSPENDED** immediato — regole per casi §34.4–§34.7.

| Aspetto | Regola |
|---------|--------|
| Natura | **NON** cancellazione definitiva (**CANCELED** solo dopo OK/decisione definitiva) |
| Significato | Tutela temporanea — **non** prova di violazione |
| Solo Foto | Sospende **associazione/foto** — **non** automaticamente l'entità (Personaggio/Patrono) |
| Solo entità | Entità **SUSPENDED**; immagini non visibili |
| Stesso `media_asset` | **Non** sospende altri utilizzi |

```
SEGNALAZIONE VALIDA RICEVUTA
    → SUSPENDED sull'oggetto segnalato
    → segnalazione NUOVO
    → coda Admin → IN VERIFICA → OK/KO
```

*(Oggi: insert report senza sospensione — gap Audit §39.)*

### 31.8 Decisione Admin — stati OK / KO (aggiornato 2026-09-15)

Flusso Admin unificato (dettaglio §34.1):

1. **NUOVO** → Admin clic **IN VERIFICA** → esce da coda Nuove
2. **IN VERIFICA** → **OK** (motivazione obbligatoria) o **KO** (motivazione obbligatoria)

**KO:** ripristino secondo regole §35 (immagine/associazione RIPRISTINATO; entità torna **PUBLISHED** se applicabile).

**OK:** conferma contestazione — immagine/associazione → **RIMOSSO** (D83); entità **CANCELED** se segnalazione entità — §35. Fotografia **storicizzata** permanentemente; placeholder fino a sostituto valido.

Segnalazione **mai cancellata** — storico completo (**D84**, **D35**, **§42.4–§42.6**); implementazione MF2/MF3 secondo roadmap.

### 31.9 Conservazione permanente della segnalazione (decisione approvata — aggiornata 2026-09-15)

> **Principio (D56):** *"Una segnalazione chiusa è una registrazione storica permanente del problema e della decisione amministrativa; non viene cancellata perché il problema è stato risolto."*

**OK** indica che la segnalazione è stata **accettata/chiusa** amministrativamente — **NON** che i dati vengono eliminati.

La segnalazione **NON** deve essere cancellata quando:

- l'immagine viene ripristinata, sostituita o rimossa;
- l'entità torna **PUBLISHED** o passa a **CANCELED**;
- la segnalazione passa a **OK** o **KO**.

**Per ogni segnalazione chiusa (OK o KO) devono restare consultabili:**

- oggetto originale coinvolto;
- dati originali dell'entità al momento della segnalazione;
- dati originali dell'immagine al momento della segnalazione (se applicabile);
- segnalazione ricevuta, motivazione utente, note utente;
- recapito verificato (email/identificativo) secondo privacy e sicurezza;
- snapshot necessari;
- stato precedente e successivo;
- decisione Admin, motivazione obbligatoria, Admin decisore, data/ora;
- azioni conseguenti;
- collegamenti a entità, immagine, segnalazioni correlate (es. modello B §35.2).

**Stessa regola** per Personaggio, POI, Foto, Santo Patrono e altri oggetti del sistema centrale.

#### 31.9.1 Fotografia esatta segnalata (D57, D70 — chiusa)

**Decisione funzionale definitiva:** la fotografia **esatta** segnalata dall'utente deve rimanere **conservata permanentemente** insieme alla relativa segnalazione e deve restare **consultabile** dall'Admin anche se l'immagine live viene sostituita, rimossa, sospesa, ripristinata o se cambia l'associazione.

- **Non** è sufficiente conservare solo un URL (può mutare o non essere più disponibile).
- Serve **evidenza immutabile** della precisa immagine segnalata (copia/snapshot/hash + metadati identificativi).
- **Meccanismo tecnico** (Storage, bucket, RPC): progettazione e implementazione in **Macrofase 2** (Q24 — scelta tecnica, non decisione Paolo). **MF4** può arricchire consultazione/storico — **non** introdurre per la prima volta la retention.

Quando sarà progettato lo **storico completo** (Q11–Q14, Q19), la relazione dovrà consentire di ricostruire almeno:

```
immagine
  → entità (Personaggio / POI)
  → fonte / provenienza (quando disponibile — §17)
  → pubblicazione (quando modellata — §22)
  → segnalazione
  → recapito verificato del segnalante (se applicabile)
  → data/ora
  → motivo segnalazione
  → sospensione automatica
  → verifica Admin
  → decisione Admin
  → eventuale ripristino
  oppure
  → eventuale rimozione confermata
  → motivazioni e successive integrazioni
```

**Storico completo:** decisione funzionale **chiusa** (**D84**, **§42.6**).

### 31.10 Canale segnalazioni — esclusivamente modale (D88 — definitivo)

**Decisione funzionale definitiva:** il sistema di segnalazione funziona **ESCLUSIVAMENTE** tramite il modale **Segnala abuso**. **Non** deve esistere alcuna «email pubblica per le segnalazioni», né come requisito, né come opzione Admin, né come canale alternativo.

| Utente | Comportamento |
|--------|---------------|
| **Registrato e loggato** | Apre il modale; **non** reinserisce la propria email — identità/account già disponibili |
| **Non registrato / non loggato (guest)** | **Email obbligatoria nel modale** → verifica **OTP** → **INVIA**; **no** registrazione obbligatoria; **no** SMS/telefono (**D85**, §33.6) |

**Escluso definitivamente:**

- email pubblica di contatto per segnalazioni;
- email esterna alternativa;
- email configurabile dall'Admin come canale pubblico;
- qualsiasi formulazione che suggerisca segnalazione tramite email esterna.

> **Distinzione obbligatoria:** la email del guest inserita **nel modale** è esclusivamente un dato di **identificazione/verifica del segnalante** — **NON** è una «email pubblica per le segnalazioni».

*(Q20 e D36 superate — sostituite da D88.)*

### 31.11 Pulsante di segnalazione nel modale immagine

Deve essere previsto accesso **diretto** dalla visualizzazione dell'immagine (quando tecnicamente pertinente) al modale **Segnala abuso** — **unico** canale di segnalazione (**D88**).

L'utente segnala l'immagine che sta **visualizzando**, senza identificarla manualmente.

Se esiste già **"Segnala abuso"**, la direzione è **evolverlo/riutilizzarlo** — **non** crearne uno parallelo (§31.2).

### 31.12 Segnalazioni POI

**Stesso impianto concettuale** dei Personaggi Famosi:

- verificare prima cosa esiste (Audit §35);
- se esiste gestione equivalente POI → riutilizzarla e adeguarla;
- se **non** esiste → **estendere** il sistema Personaggi, **non** duplicare il motore.

**Gestione Admin — direzione concettuale:**

```
Admin Panel → Segnalazioni (hub centrale — §32)
  ├── COMMUNITY
  ├── SANTO PATRONO
  ├── PERSONAGGIO FAMOSO
  └── AI
```

La UI può adattarsi alla struttura reale (`AdminFamousPeopleManager` o evoluzione dedicata), ma il principio è **gestione amministrativa coerente e centralizzata**, non due sistemi completamente separati.

*(Segnalazioni POI immagine: **obiettivo** — non verificato come esistente; Audit §35.)*

### 31.13 Tutela documentale e collegamento provenienza

Il sistema di segnalazione deve essere coerente con §17 (provenienza e tutela).

La segnalazione deve poter essere collegata, quando disponibili, ai dati dell'immagine:

- fonte; URL originale; autore; licenza; URL licenza; attribuzione; copyright;
- data di recupero; stato di verifica; identificativi provenienza;
- data di pubblicazione; eventuali modifiche/sostituzioni/rimozioni.

**Obiettivo:** ricostruire in futuro cosa Touring Diary conosceva, quando, da quale fonte, e come ha gestito una contestazione.

**NON** descrivere come garanzia di immunità legale — tracciabilità e documentazione utile alla tutela (§17.3, D27).

### 31.14 Coerenza con decisioni già presenti

| Area Master Plan | Collegamento segnalazioni |
|------------------|---------------------------|
| §3.8 Marcatura origine | Tipo immagine determina anche cosa mostrare post-segnalazione |
| §6 Foto reali | Segnalazione può contestare esito verifica automatica |
| §12 AI | Segnalazione distinta da dicitura AI |
| §19 Scartate/accantonate | Candidati non auto-approvati — distinti da sospensione post-segnalazione |
| §20 Storico rimozioni | **D83/D84** — RIMOSSO + storico permanente |
| §22 Data pubblicazione | Utile nella ricostruzione contestazione |

---

## 32. Admin Panel → Segnalazioni — hub centrale (decisione approvata — 2026-09-15)

**ADMIN PANEL → SEGNALAZIONI** diventa il **centro unico** di gestione segnalazioni, suggerimenti e code correlate.

### 32.1 Macro-tab

| # | Macro-tab | Contenuto gestionale |
|---|-----------|---------------------|
| 1 | **COMMUNITY** | Luoghi suggeriti · Errori segnalati · Abuso POI · Abuso foto Community |
| 2 | **SANTO PATRONO** | Abuso personaggio · Abuso foto · Suggerimento foto · Suggerimento personaggio |
| 3 | **PERSONAGGIO FAMOSO** | Abuso personaggio · Abuso foto · Suggerimento foto · Suggerimento personaggio |
| 4 | **AI** | Code VERIFICARE IMMAGINE AI — predisposto Patrono / Personaggio / POI |

### 32.2 COMMUNITY — micro-tab

| Micro-tab | Contenuto |
|-----------|-----------|
| **LUOGHI SUGGERITI** | Suggerimenti nuovo luogo (`new_place`) |
| **ERRORI SEGNALATI** | Segnalazioni errore su POI/esistenti (`edit_info`, `history_culture`, errori da modale pubblico) |
| **ABUSO POI** | Segnalazioni abuso sul POI — modello centrale §33; **non** confondere con Rivendica |
| **ABUSO FOTO COMMUNITY** | Unico sistema; sotto-classificazione: |

**ABUSO FOTO COMMUNITY** — micro-tab interni:

| Micro-tab | Provenienza segnalazione |
|-----------|-------------------------|
| **FOTO LIVE** | Fotografie Community da HOME → COMMUNITY |
| **FOTO GALLERIA CITTÀ** | Galleria città; anche accessi da tre tasti **Esplora** Home quando conducono a contenuti fotografici; segnalazione anche su fotografia aperta |

**Principio:** un **unico** motore segnalazione abuso foto Community con campo/classificazione **provenienza** (LIVE vs GALLERIA CITTÀ) — **non** due sistemi indipendenti.

### 32.7 Moderazione upload Community vs Abuso Foto Community (verifica repository — chiusa 2026-09-16)

**Verdetto definitivo:** sono **due flussi distinti**. Non confonderli.

| Flusso | Scopo | Stato oggi | Perimetro AI Image Management |
|--------|-------|------------|-------------------------------|
| **Moderazione upload Community** | Approvare/rifiutare **upload** utente su tabella `photo_submissions` **prima/durante** la pubblicazione (`pending` → `approved`/`rejected`) | 🟢 Esiste — `PhotoModeration.tsx`, route Admin `photos` | **FUORI SCOPE** — prodotto pre-esistente; **non** sviluppare, ricollocare o integrare nel hub Segnalazioni in questo progetto |
| **Abuso Foto Community** | Segnalazione **abuso** su foto Community **già pubblicate** (FOTO LIVE / FOTO GALLERIA CITTÀ) | 🔴 Non implementato | **IN SCOPE** — MF2 (`content_reports`, modale Segnala abuso unificato) |

**Percorso reale moderazione upload (sintesi):** utente carica da **Home → Community** (`LiveFeedTab` + `useCommunityPhotoPublish`) o **pagina città → Galleria** (`CityGallery`) → `uploadCommunityPhoto` → riga `photo_submissions` (di default `pending`; può essere `approved` subito se Admin o se AI safety passa) → Admin gestisce in **Foto & Moderazione** → se `approved`, foto visibile in Live Feed (`listPhotographs` status `approved`) e Galleria città.

**Abuso foto Community:** oggi **assente** su Live Feed e Galleria — nessun modale/servizio di segnalazione abuso su `photo_submissions` pubblicate. Target MF2: **Segnalazioni → COMMUNITY → ABUSO FOTO COMMUNITY** (micro-tab FOTO LIVE / FOTO GALLERIA CITTÀ).

### 32.3 COMMUNITY → Errori segnalati

Due concetti distinti:

- **A.** Gestione Admin (micro-tab ERRORI SEGNALATI)
- **B.** Modale pubblico utente (non Admin)

**Modale pubblico — requisito:**

- Tendina **"POI interessato"**
- Valore iniziale: `---`
- Nessun POI preselezionato
- Campo **obbligatorio** — invio impedito senza selezione

*(Oggi `SuggestionModal` non ha tendina POI obbligatoria per tutti i tipi — gap Audit §36.)*

### 32.4 COMMUNITY → Abuso POI

- Utilizza modello centrale **Segnala abuso** (§33).
- **Vincolo assoluto:** non modificare/rompere flusso **Rivendica** POI → modale sponsor (`PoiClaimModal` tab Gold/Silver/Bottega).
- Ogni modifica al sistema segnalazioni deve essere verificata per **regressioni** su Rivendica.

### 32.5 SANTO PATRONO — micro-tab

| Micro-tab | Riceve |
|-----------|--------|
| ABUSO PERSONAGGIO | Segnalazioni abuso sul Santo Patrono |
| ABUSO FOTO | Segnalazioni abuso foto Patrono |
| SUGGERIMENTO FOTO | Suggerimenti fotografie |
| SUGGERIMENTO PERSONAGGIO | Suggerimenti completi Patrono *(nome "personaggio" = scelta funzionale concordata)* |

Stesso livello gestionale generale dei Personaggi Famosi, con differenze di dominio.

### 32.6 PERSONAGGIO FAMOSO — micro-tab

| Micro-tab | Riceve |
|-----------|--------|
| ABUSO PERSONAGGIO | Segnalazioni abuso sul Personaggio |
| ABUSO FOTO | Segnalazioni abuso foto ufficiale |
| SUGGERIMENTO FOTO | Suggerimenti fotografie |
| SUGGERIMENTO PERSONAGGIO | Suggerimenti personaggio |

### 32.8 Migrazione da Admin → Personaggi Famosi (§37)

- Funzioni attuali di `AdminFamousPeopleManager` (segnalazioni/suggerimenti) → nuova struttura §32.
- **Categorie personaggio** → Manager POI-DB → Edit Città → Storia — pulsante **CATEGORIA PERSONAGGIO** (modello Tassonomia POI).
- Voce menu **Personaggi Famosi** rimossa **solo** quando nessuna funzione resta lì (verificare riferimenti/route/import).

### 32.9 Legenda stati Admin

La pagina Segnalazioni deve includere **legenda permanente** con pallini colorati:

- significato NUOVO · IN VERIFICA · OK · KO · TUTTE
- cosa può fare l'Admin in ciascuno stato
- distinzione chiara tra stati **segnalazione**, stati **entità** e stati **immagine** (§34)

---

## 33. Modello centrale "Segnala abuso" (decisione approvata — 2026-09-15)

### 33.1 Principio

**Un'infrastruttura comune** utilizzabile per:

- Personaggi Famosi
- Santo Patrono
- POI
- Fotografie Community (Live + Galleria Città)

Differenze minime solo dove il tipo di contenuto lo richiede. **Non** creare quattro sistemi separati.

**Base riutilizzabile oggi (Audit §36):** `ReportFamousPersonPhotoAbuseModal`, `ReportPatronPhotoAbuseModal`, `famous_person_photo_reports`, `patron_photo_reports`, servizi correlati — da **generalizzare/evolvere**, non duplicare.

### 33.2 Punti di accesso UI

Dove manca, introdurre **Segnala abuso** in:

- fotografie Community (Live)
- contenuti raggiunti dai tre tasti Esplora Home (fotografici)
- Galleria Città + fotografia aperta (lightbox)
- Personaggio Famoso · Santo Patrono · POI (dove applicabile)

*(File esatti: Audit §36 — molti punti **mancanti** oggi.)*

### 33.3 Modale — Tipologia segnalazione

| Campo | Valori | Regole |
|-------|--------|--------|
| **TIPOLOGIA SEGNALAZIONE** | Immagine · Personaggio | Zero preselezione; Immagine sola · Personaggio solo · **entrambe** ammesse |
| Invio con zero selezioni | — | **Non consentito** — messaggio comprensibile |

Adattare alle entità non-personaggio (POI, foto Community): tipologia equivalente al contesto.

### 33.4 Motivazione segnalazione

| Motivazione |
|-------------|
| Violazione del copyright |
| Violazione di altri diritti |
| Contenuto utilizzato senza autorizzazione |
| Altro |

*(Allineabile agli enum esistenti `copyright`, `other_rights`, `unauthorized`, `other` — mapping in implementazione.)*

### 33.5 Note — sempre obbligatorie

- **Sempre** obbligatorie — non solo per "Altro"
- Placeholder: *"Aiutaci a capire la motivazione della tua segnalazione"*
- Sempre conservate nello storico

*(Oggi note **opzionali** nei modali abuso — gap.)*

### 33.6 Utenti loggati / guest — OTP email (D85 — definitivo)

**Stesso modale** `Segnala abuso` per utente registrato e guest.

| Utente | Flusso |
|--------|--------|
| **Registrato** | Già riconosciuto → compila modale → **INVIA** (no re-input email) |
| **Guest** | Stesso modale → **email obbligatoria** → sistema invia **OTP** → guest inserisce OTP → **solo dopo verifica** pulsante **INVIA** attivo → submit |

```
EMAIL → OTP → VERIFICA → INVIA
```

**Escluso esplicitamente:** SMS, numero di telefono, registrazione obbligatoria.

**Implementazione tecnica:** **§42.12** — Supabase Auth OTP nativo (preferito). *(Repository oggi: OTP guest non implementato — Audit §36.6.)*

### 33.7 Dati conservati nella segnalazione

Quando pertinente: `city_id`, `person_id`, patron entity id, `poi_id`, `image_id`, snapshot/anteprima, URL/path, provenienza disponibile, utente/email, data/ora, tipologia, motivazione, note, stato segnalazione, decisione Admin, motivazione decisione.

La segnalazione resta legata alla **specifica immagine** anche dopo sostituzione.

### 33.8 Segnalazione abuso vs Suggerimento foto

| Flusso | Significato |
|--------|-------------|
| **Suggerimento foto** | "Ti propongo questa fotografia" |
| **Segnala abuso** | "Questo contenuto/foto non dovrebbe essere utilizzato" |

Possono condividere infrastruttura Admin, stati, storico — **non** confonderli nel modale utente.

---

## 34. Stati unificati — segnalazioni, entità, immagini (decisione approvata — 2026-09-15)

### 34.1 Stati segnalazione / suggerimento

| Stato | Significato |
|-------|-------------|
| **NUOVO** | Nuova segnalazione o suggerimento |
| **IN VERIFICA** | Admin ha preso in carico da NUOVO (esce dalla coda Nuove) — **non** è decisione finale |
| **OK** | Accettato/chiuso — **motivazione obbligatoria**; dati **conservati** permanentemente (§31.9 — OK ≠ cancellazione) |
| **KO** | Rifiutato/chiuso — **motivazione obbligatoria**; dati **conservati** permanentemente |
| **TUTTE** | Vista completa filtrabile; gestione da questa vista |

**POI — distinzione aggiuntiva in NUOVO:**

- **NUOVO POI** vs **MODIFICA POI**

**Regole POI suggerimenti:**

- OK su NUOVO POI → accettazione → POI in **DRAFT** (Admin può modificare dati)
- OK su MODIFICA POI → modifica applicata (Admin può modificare)
- KO → rifiuto

*(Oggi stati diversi: `pending`/`in_review`/`photo_blocked`/`rejected` su report foto; `pending`/`approved`/`rejected` su suggestions — **migration/mapping** necessario — Audit §36.)*

### 34.2 Stati entità — modello comune (definitivo — D39)

**Vocabolario canonico** (identico concettualmente per Personaggio Famoso, POI, Santo Patrono). **Non** usare sinonimi: `CANCELLED`, `ARCHIVED`, `IN_REVIEW`, né equivalenti italiani obsoleti (BOZZA/PUBBLICATO/ANNULLATO) come modello definitivo.

| Stato | Significato | Personaggio | POI | Santo Patrono |
|-------|-------------|-------------|-----|---------------|
| **DRAFT** | Non pronto o riportato in bozza; bonifica Admin/AI **esistente** — **non modificare** flussi bonifica | ✅ | ✅ | ✅ |
| **PUBLISHED** | Coerente e online | ✅ | ✅ | ✅ |
| **SUSPENDED** | Non visibile; sospensione automatica alla segnalazione (oggetto segnalato) o manuale Admin | ✅ | ✅ | ✅ |
| **NEEDS_CHECK** | AI/dati incompleti — **solo POI**, non online | — | ✅ | — |
| **CANCELED** | Decisione definitiva (OK segnalazione o Admin) — non online | ✅ | ✅ | ✅ |

**Persistenza (strutture separate — nessuna tabella entità comune):**

| Entità | Struttura | Colonna/i stato |
|--------|-----------|-----------------|
| Personaggio Famoso | `city_people` | `status` |
| POI | `pois` | `status` |
| Santo Patrono | `cities` | **colonna dedicata** `patron_editorial_status` (D72) — **NON** in `patron_details` JSON |

*(Oggi: valori parziali `draft`/`published`/`needs_check`; Patrono **senza** colonna status — gap Audit §39.)*

**Santo Patrono DRAFT o SUSPENDED (D49):** frontend pubblico → pulsante **SUGGERISCI** al posto del contenuto Patrono; immagini non visibili.

### 34.3 Stati immagine

| Stato | Significato |
|-------|-------------|
| **ATTIVO** | Utilizzabile/visibile se entità contenitore lo consente |
| **SOSPESO** | Temporaneamente non visibile per segnalazione |
| **RIPRISTINATO** | Era sospesa; resa disponibile dopo KO segnalazione |
| **SOSTITUITO** | Sostituita da nuova immagine |
| **RIMOSSO** | Non più utilizzata; storia conservata |
| **VERIFICARE IMMAGINE AI** | Proposta AI/reale non certa abbastanza per uso automatico — richiede Admin |

**Non** usare "IN VERIFICA" per questo stato immagine AI — nome definitivo: **VERIFICARE IMMAGINE AI**.

*(Oggi `pois.image_status` usa enum `media_status`: `real`|`placeholder`|`missing` (+ drift `ai_generated`|`needs_review` in governance) — **estensione/migration** necessaria.)*

### 34.4 Regola generale: segnalazione → SUSPENDED (D33)

Alla **ricezione** di una segnalazione valida:

1. L'**oggetto effettivamente segnalato** → **SUSPENDED** **immediatamente** (senza attendere Admin).
2. Oggetto **non visibile** online finché non ripristinato (KO) o gestito definitivamente.
3. **SUSPENDED ≠ CANCELED** — la segnalazione ricevuta **non** porta automaticamente a **CANCELED**.
4. Sospensione di un'**associazione** immagine-entità **non** sospende automaticamente altre entità/associazioni che usano lo stesso `media_asset`.

### 34.5 Visibilità combinata entità + immagine (D41, D86)

Lo **stato entità** è il **primo livello** di visibilità. **PUBLISHED** sull'entità **non** rende automaticamente visibile un'immagine **SOSPESA** o **RIMOSSA**.

| Entità | Immagine/associazione | Visibilità pubblica |
|--------|----------------------|---------------------|
| **PUBLISHED** | **ATTIVO** (o RIPRISTINATO/SOSTITUITO pubblicabile) | ✅ Immagine pubblicabile |
| **PUBLISHED** | **SOSPESO** | Entità visibile; **quella** immagine **no** (placeholder se previsto) |
| **PUBLISHED** | **RIMOSSO** | Entità visibile; **quella** immagine **no** |
| **SUSPENDED** / **CANCELED** / **DRAFT** / **NEEDS_CHECK** (POI) | qualsiasi | Entità **non** visibile; immagini **non** mostrate via quell'entità |

*Esempio:* Personaggio **SUSPENDED** + immagine **RIPRISTINATA** → immagine **non** online. Personaggio **PUBLISHED** + immagine **SOSPESA** → personaggio visibile, foto no.

### 34.6 Personaggio Famoso — segnalazione Personaggio / Foto (D73, D74)

Modello B: due componenti gestibili **separatamente** (§35.2).

| Caso | Effetto immediato alla segnalazione |
|------|-------------------------------------|
| **Solo Personaggio** | Personaggio → **SUSPENDED**; non visibile; **immagini non mostrate** |
| **Solo Foto** | **Associazione/foto** segnalata → **SUSPENDED**; Personaggio resta **PUBLISHED** e visibile; **placeholder** se foto non disponibile |
| **Personaggio + Foto** | Personaggio → **SUSPENDED**; foto/associazione → **SUSPENDED**; **due decisioni Admin indipendenti** |

Se Personaggio **SUSPENDED**, le immagini **non** devono essere mostrate pubblicamente **anche se** la componente Foto viene gestita separatamente.

### 34.7 Santo Patrono — segnalazione Patrono / Foto (D72, D49)

Status editoriale su **`cities.patron_editorial_status`** (D72). Stati applicabili: DRAFT, PUBLISHED, SUSPENDED, CANCELED — **non** NEEDS_CHECK.

| Caso | Effetto immediato |
|------|-------------------|
| **Solo Foto** | Foto/associazione → **SUSPENDED**; Patrono resta **PUBLISHED** e visibile; foto sospesa non mostrata |
| **Solo Patrono** | Patrono → **SUSPENDED**; non visibile; immagini non mostrate; pubblico → **SUGGERISCI** |
| **Patrono + Foto** | Patrono → **SUSPENDED**; foto → **SUSPENDED**; gestione Admin **indipendente**; pubblico → **SUGGERISCI** finché Patrono **SUSPENDED** |

**Regola pubblica:** Patrono **SUSPENDED** prevale — contenuto e immagini non visibili, compare **SUGGERISCI** — **anche** se la segnalazione iniziale includeva Patrono + Foto e le due componenti vengono poi gestite separatamente.

---

## 35. Segnalazione doppia Immagine + Personaggio (decisione definitiva — 2026-09-15)

### 35.1 Regole KO/OK (invariate)

Quando l'utente seleziona **entrambe** le tipologie, valgono:

| # | Decisione Admin | Effetto |
|---|-----------------|---------|
| 1 | **KO** segnalazione **PERSONAGGIO** | Personaggio → **PUBLISHED**; **placeholder** se foto non risolta |
| 2 | **KO** segnalazione **IMMAGINE** | Associazione/foto → **RIPRISTINATO**; visibile solo se entità **PUBLISHED** |
| 3 | **OK** segnalazione **PERSONAGGIO** | Personaggio → **CANCELED**; immagine gestione **indipendente** |
| 4 | **OK** segnalazione **IMMAGINE** | Immagine/associazione → **RIMOSSO** |

Stesse regole concettuali per **Santo Patrono** (componenti Patrono / Foto) — §34.7.

**Principio invariante:** stato entità > stato immagine per visibilità finale (§34.5).

### 35.2 Modello B — rappresentazione Admin (decisione definitiva — Q23 chiusa)

Una segnalazione utente con **Immagine + Personaggio** deve essere rappresentata all'Admin come **DUE elementi/righe collegati**:

| Requisito | Dettaglio |
|-----------|-----------|
| Righe separate | Una riga **Abuso immagine** · una riga **Abuso personaggio** |
| Gestione indipendente | Admin decide **quale gestire per prima**; può chiudere/portare in lavorazione una senza l'altra |
| Stati indipendenti | Stato/decisione di una riga **non** chiude automaticamente l'altra (salvo regole visibilità §35.1) |
| Collegamento consultabile | Riferimento reciproco e alla **segnalazione originaria** sempre visibile |
| Storia indipendente | Ogni riga mantiene propria cronologia decisionale |

**La separazione amministrativa NON elimina la relazione logica** tra le due parti.

**Esempio concreto:** segnalazione "Immagine + Personaggio". L'Admin apre la riga **Abuso immagine**, la porta in **OK** e rimuove la fotografia. La riga **Abuso personaggio** resta **NUOVA** o **IN VERIFICA**. Successivamente l'Admin gestisce autonomamente il personaggio.

*(Implementazione: Audit §36.14 — oggi **una sola riga** per report foto; gap modello B.)*

---

## 36. AI — macro-tab, gerarchia, coda VERIFICARE IMMAGINE AI (decisione approvata — 2026-09-15)

### 36.1 Macro-tab AI

Predisposto per: **Santo Patrono · Personaggio Famoso · POI**

| Entità | Generazione AI immagini oggi |
|--------|------------------------------|
| Personaggio Famoso | **Attiva** (`generateHistoricalPortrait`) |
| Santo Patrono | **Non attiva** |
| POI | **Non attiva** |

**Un'unica architettura** — Patrono e POI: generazione AI **disattivata di default** (**D51/D63**), **tecnicamente predisposta** e attivabile dall'Admin nel singolo processo tramite SI/NO; **nessuna** decisione funzionale aperta su questo punto.

### 36.2 Modale SI/NO all'avvio creazione

Prima del processo (Personaggio / Patrono / POI), modale equivalente a:

> *"Se non viene trovata o resa disponibile un'immagine Admin o una fotografia reale verificata, vuoi consentire al sistema di generare un'immagine illustrativa tramite Intelligenza Artificiale?"*

| Opzione | Default |
|---------|---------|
| SI | Personaggi Famosi |
| NO | Santo Patrono |
| NO | POI |

Modificabile dall'Admin. **Un'architettura** con flag configurazione per processo — **non** tre flussi indipendenti.

### 36.3 Gerarchia immagini

**Personaggi Famosi:** Admin → foto reale verificata → AI → placeholder

**Santo Patrono e POI (oggi):** Admin → foto reale verificata → *(AI non attiva)* → placeholder — architettura comune con skip step AI via SI/NO.

### 36.4 Foto dubbia / AI non certa

Se foto reale potenzialmente utilizzabile ma **non verificabile con sufficiente sicurezza**:

1. **NON** usarla automaticamente
2. Metterla da parte
3. Stato **VERIFICARE IMMAGINE AI**
4. Notifica Admin + coda macro-tab AI
5. Indicare entità + territorio (continente → nazione → regione → zona turistica → città)
6. Filtri territoriali Admin

### 36.5 Informazioni Admin per VERIFICARE IMMAGINE AI (D81, D80)

**Percorso UI:** Admin Panel → **Segnalazioni → AI** → sotto-tab (Patrono / Personaggio / POI).

L'Admin deve vedere almeno: immagine candidata, `media_asset`, entità, gerarchia geo (continente → città), provenienza completa, **griglia di OGNI step** della checklist §6.1 con esito (VERIFICATO / NON VERIFICATO / DUBBIO / BLOCCATO / NON APPLICABILE), evidenze per step, **motivazione AI** (perché non auto-approvata), step bloccante identificato, segnalazioni collegate.

| Tipo motivazione | Contenuto | Obbligatorietà |
|------------------|-----------|----------------|
| **Motivazione AI / sistema** | Esito pipeline, step bloccante, evidenze | Sempre in coda verify |
| **Motivazione Admin** | Decisione manuale, eventuale **OVERRIDE** (D82) | Obbligatoria su azione Admin |

**Non** mostrare solo «verification failed» — indicare **quale step** e **perché**.

### 36.6 Notifiche AI

- Conteggio **solo** immagini in **VERIFICARE IMMAGINE AI** (escluse già gestite)
- Badge: menu Admin accanto a Segnalazioni; vicino macro-tab AI
- Riutilizzare infrastruttura badge esistente (`CountBadge`, `AdminDashboard.refreshCounts`) — uniformare stile/dimensione/posizione

### 36.7 Dicitura AI pubblica

Testo obbligatorio in UX pubblica:

> *"Immagine generata con Intelligenza Artificiale - Rappresentazione illustrativa, non fotografia reale."*

*(Oggi assente in modale pubblico — gap Audit.)*

### 36.8 findExistingPortrait

Direzione confermata: lookup **PERSONAGGIO + CITTÀ** (`city_id`), non globale per nome.

*(Oggi `findExistingPortrait` in `mediaService.ts` — query globale `ilike` nome, `limit(1)` — gap Audit §36.)*

---

## 37. Riorganizzazione Admin e categorie personaggio (decisione approvata — 2026-09-15)

| Da | A |
|----|---|
| Admin → Personaggi Famosi → Categorie | Manager POI-DB → Edit Città → **Storia** → pulsante **CATEGORIA PERSONAGGIO** |
| Pattern apertura | Come **TASSONOMIA** in `EditorInfo.tsx` (overlay + componente esistente) |
| Componente riutilizzato | `AdminFamousPeopleCategoriesManager` — **non** seconda gestione |
| Segnalazioni/suggerimenti Personaggi | Admin → Segnalazioni → macro-tab PERSONAGGIO FAMOSO |

**Prima di rimuovere** voce menu Personaggi Famosi: grep riferimenti a `famous_people`, route `/admin/famous_people`, import `AdminFamousPeopleManager`.

---

## 38. Macrofasi di sviluppo — piano ufficiale (approvato — 2026-09-15, Q27 chiusa)

**Perimetro file per macrofase:** `AI_IMAGE_MANAGEMENT_MACROFASE_1_FILES.md` … `AI_IMAGE_MANAGEMENT_MACROFASE_5_FILES.md`.

**5 MACROFASI** approvate. Ognuna:

1. **SVILUPPO**
2. **TEST** — solo dopo SVILUPPO completato; esito accettabile obbligatorio prima della macrofase successiva
3. **Test E2E** documentati sul processo realmente impattato (§3.9)

I test E2E partono dallo **stato reale** già esistente nell'applicazione — senza ricreare artificialmente prerequisiti.

### MACROFASE 1 — STRUTTURA ADMIN + STATI + CATEGORIE

- **Shell** hub **Admin Panel → Segnalazioni** (routing, navigazione, 4 macro-tab scheletro)
- **Non** implementare in MF1 il sistema completo segnalazioni (modello B, OTP, evidence, stati operativi report → **MF2**)
- Progettazione/allineamento **stati entità** (DRAFT/PUBLISHED/SUSPENDED/CANCELED; NEEDS_CHECK solo POI) + colonna **`cities.patron_editorial_status`** (D72) — schema **additivo** non distruttivo
- Schema base **`media_assets`** (predisposizione architetturale — **non** assignments/report completi)
- Categorie personaggio → Edit Città → Storia (pulsante CATEGORIA PERSONAGGIO)
- Placeholder Personaggi in Asset Globali
- **Mantenere** `AdminFamousPeopleManager` fino a migrazione funzioni in **MF2**
- **Mantenimento intatto** flusso POI **Rivendica** (§32.4, §37)

### MACROFASE 2 — SEGNALAZIONI, SUGGERIMENTI E FLUSSI CENTRALI

- Modello centrale **SEGNALA ABUSO** (§33)
- Segnalazioni Community (Luoghi · Errori · Abuso POI · Abuso foto Live/Galleria)
- POI · Santo Patrono · Personaggio Famoso
- Suggerimenti foto e personaggio
- **Modello B** doppia segnalazione Immagine + Personaggio (§35.2)
- Guest/login e verifica OTP (§33.6, D69 — requisito chiuso; implementazione tecnica Supabase preferita)
- Conservazione permanente evidenza fotografica esatta + segnalazioni OK (§31.9, D70)
- Adeguamento UI pubbliche necessarie

### MACROFASE 3 — STATI IMMAGINI + PROVENIENZA + AI + CODE + NOTIFICHE

- Stati immagine completi e filtrabili
- Provenienza strutturata
- Gestione immagini AI · stato **VERIFICARE IMMAGINE AI**
- Coda Admin macro-tab AI
- Notifiche (solo VERIFICARE IMMAGINE AI)
- Regole priorità entità > immagine
- Disclosure AI pubblica
- Gestione uniforme Patrono · Personaggio · POI
- Modale SI/NO generazione AI per tipo creazione (§36.2)

### MACROFASE 4 — FOTO REALI + WIKIDATA/COMMONS + MEDIA LIBRARY + STORICO

- Discovery Wikidata/P18 · verifica file Commons
- Pipeline fotografia reale verificata · allowlist **CC BY 4.0** (**D79**) + checklist §6.1
- Provenance completa
- Media Library evoluta
- Storico immagini
- Arricchimento consultazione evidenza segnalazioni già conservata in **MF2** (D57, Q24) — **non** prima introduzione retention
- Gestione completa immagini e metadati

### MACROFASE 5 — CONSOLIDAMENTO + REGRESSIONI + E2E FINALE

- Consolidamento architetturale
- Regressioni (incluso Rivendica POI)
- Responsive · accessibilità · Biome
- Coerenza Design System
- Verifica dipendenze e vecchie funzioni
- **findExistingPortrait** PERSONAGGIO+CITTÀ (§36.8)
- E2E finale flussi principali

*(Dettaglio file-per-file: `AI_IMAGE_MANAGEMENT_MACROFASE_1_FILES.md` … `_5_FILES.md` + Audit §38.)*

---

## 39. Modello fotografia autonoma, associazioni e alert utilizzi (decisione approvata — 2026-09-15)

> **Progettazione tecnica preliminare:** Audit §38. **Non** descrive implementazione attuale.

### 39.1 Fotografia come oggetto autonomo (D59)

La **fotografia** è un elemento di dominio **autonomo**, con:

- identificativo stabile;
- provenienza, licenza, origine, stato propri;
- eventuale storia e governance indipendenti dall'entità che la utilizza.

**Non** è una semplice proprietà casuale incollata su Personaggio/POI/Patrono.

*(Oggi: `image_url` + opzionale `image_storage_path` **embedded** su `city_people` / `pois` / patron JSON — gap Audit §38.A–B.)*

### 39.2 Associazione fotografia ↔ entità (D60)

Ogni utilizzo di una fotografia su un'entità/contesto è un'**associazione esplicita** governata.

La **segnalazione abuso** agisce sulla **singola associazione** segnalata — **non** automaticamente su tutti gli altri utilizzi della stessa fotografia o dello stesso personaggio altrove.

### 39.3 Alert informativo altri utilizzi (D61)

Nel pannello/modal Admin di gestione segnalazione deve comparire un **alert informativo** (non blocca azioni automatiche su altri contesti):

- altre città/contesti dello **stesso Personaggio** (es. *"Attenzione: questo Personaggio è presente anche nelle città Y, Z, W"*);
- altre **associazioni** che usano la **stessa fotografia** (es. *"Questa fotografia è utilizzata anche per: Personaggio X → Città Y; POI A → Città W"*).

L'Admin deve vedere chiaramente:

1. quale associazione sta gestendo;
2. altre associazioni del personaggio;
3. altre associazioni della stessa foto;
4. città/contesti;
5. stati rilevanti delle associazioni.

**Esempio:** segnalata Foto A su Personaggio X → Roma → agisce su quella associazione; alert mostra Napoli/Milano se presenti; **non** modifica Napoli/Milano automaticamente.

### 39.4 Direzione tecnica (DDL definitivo — §42)

Concetti approvati per implementazione progressiva (Macrofasi 1–2):

| Concetto | Ruolo |
|----------|--------|
| Registro fotografia (`media_assets` o nome equivalente) | Fotografia autonoma: storage path, hash, origine, licenza, stato globale asset |
| Associazione (`entity_image_assignments` o equivalente) | Collegamento foto ↔ entità/contesto; **stato associazione**; target segnalazione |
| Evidenza segnalazione (`report_evidence` / snapshot immutabile) | Copia consultabile foto **esatta** segnalata (D57) |
| Report collegati (modello B) | Due righe/report figli + `parent_report_id` / gruppo origine |

Dettaglio DDL, indici, RLS: Audit §38 + Macrofase 2.

### 39.5 Coerenza con decisioni esistenti

- Modello B doppia segnalazione §35.2
- Conservazione OK permanente §31.9
- Priorità entità > immagine §34.5
- Segnala abuso §33
- findExistingPortrait → lookup per **persona + città** (Macrofase 5), non URL globale

---

## 41. media_assets — decisioni architetturali definitive (D75–D77)

### 41.1 Identità dell'asset (D75)

Un **`media_asset`** = uno **specifico** contenuto/file immagine. Sostituzione (Foto B al posto di Foto A) = **nuovo** asset B; A resta distinto; storia di A **non** distrutta; associazione entità aggiornata.

### 41.2 Cronologia permanente (D76)

Cronologia stati/decisioni asset conservata **permanentemente** (es. ATTIVO → SOSPESO → RIPRISTINATO; ATTIVO → SOSTITUITO). Implementazione: assignment chain + history (MF3/MF4).

### 41.3 Provenance centralizzata (D76)

Provenance strutturata su `media_assets`: fonte, autore, URL originale, licenza, URL licenza, attribuzione, copyright, data recupero, stato verifica, identificativi — **non** distribuita arbitrariamente quando riguarda lo stesso asset.

### 41.4 Associazione immagine ↔ entità (D60, D76)

`entity_image_assignments` (o equivalente): identità e **stato propri** indipendenti dall'asset. Segnalazione/sospensione sul **contesto segnalato** — **non** invalida automaticamente altri utilizzi dello stesso `media_asset`.

### 41.5 RLS e accesso (D77)

| Livello | Regola |
|---------|--------|
| **Gestione asset** | Solo Admin (strumenti amministrativi) |
| **Lettura pubblica** | Consentita per immagini **validamente pubblicate** secondo entità/associazione **PUBLISHED** |
| **Evidenza segnalazione** | **Privata** — solo Admin; **non** esposta al frontend pubblico (MF2 introduce; MF4 arricchisce consultazione) |

**Nota:** "solo Admin" riguarda **gestione/modifica** asset — **non** divieto assoluto di lettura public delle immagini pubblicate.

---

## 42. Scelte tecniche definitive (2026-09-16)

> **Regola:** decisioni **puramente tecniche** prese dopo verifica repository — **non** questioni aperte per Paolo. Implementazione per macrofase indicata.

### 42.1 Tabella `media_assets`

| Colonna | Tipo | Note |
|---------|------|------|
| `id` | uuid PK | Identità immutabile asset |
| `storage_bucket`, `storage_path` | text | Riferimento file |
| `content_hash` | text nullable | sha256 — dedup/audit |
| `origin_type` | enum | `admin_upload`, `ai_generated`, `wikimedia`, `community`, `placeholder`, … |
| `license_code` | text nullable | es. `CC-BY-4.0` |
| `license_url`, `source_url`, `attribution_text`, `copyright_notice` | text | Provenance |
| `author_name`, `rights_holder` | text nullable | |
| `retrieved_at`, `license_verified_at` | timestamptz | |
| `generated_by_ai`, `is_placeholder` | boolean | D66 |
| `asset_status` | enum | ATTIVO, SOSPESO, …, VERIFICARE IMMAGINE AI |
| `metadata` | jsonb | Estensioni non breaking |
| `created_at`, `updated_at` | timestamptz | |

**Motivazione:** PK stabile; sostituzione = nuovo asset (D75). **MF1** schema minimo; **MF3** enum stati completi.

### 42.2 Tabella `entity_image_assignments`

| Colonna | Tipo | Note |
|---------|------|------|
| `id` | uuid PK | Identità associazione |
| `media_asset_id` | uuid FK | |
| `entity_type` | enum | `city_person`, `poi`, `patron`, `photo_submission` |
| `entity_id`, `city_id` | uuid | Contesto |
| `assignment_role` | enum | `primary`, `gallery`, … |
| `assignment_status` | enum | `active`, `suspended`, `removed`, `replaced` |
| `is_current` | boolean | Resolver public |
| `replaced_by_assignment_id` | uuid nullable | Chain sostituzione |
| `first_published_at`, `published_at`, `removed_at` | timestamptz | Q5 chiuso |
| `created_at`, `updated_at` | timestamptz | |

**Motivazione:** segnalazione/sospensione sul **contesto** (D60). **MF2**.

### 42.3 Provenance

Centralizzata su **`media_assets`** (+ join opzionale `media_asset_provenance_snapshots` append-only per audit run). POI `image_credit`/`image_license` migrati in backfill MF5. **MF3** resolver priorità §12.

### 42.4 Tabella `content_reports`

Tabella unificata (sostituisce crescita parallela di N tabelle — **Q19 chiuso**):

- `report_group_id`, `parent_report_id`, `report_kind` (`entity_abuse` | `image_abuse` | …)
- `assignment_id`, `entity_type`, `entity_id`, `city_id`
- `status`: `nuovo`, `in_verifica`, `ok`, `ko` (mapping da legacy)
- `reporter_user_id` nullable, `reporter_email_verified`, `guest_verification_id`
- colonne evidence: `evidence_storage_path`, `evidence_content_hash`, `evidence_captured_at`
- motivazioni utente/Admin separate

Tabelle legacy (`famous_person_photo_reports`, …) migrate/read compat in MF2. **MF2**.

### 42.5 Evidenza segnalazione

- Bucket Storage privato **`report-evidence`** (RLS admin-only)
- RPC `capture_report_evidence` copia bytes/hash al submit
- **MF2** introduce retention permanente (D70)

### 42.6 Storico immagini

- `entity_image_history` append-only: evento, assignment_id, asset_id, stato precedente/nuovo, admin_id, `ai_rationale`, `admin_rationale`, `override_flag`, geo snapshot
- Vista Admin Media Library + filtri §21
- UI consultazione completa **MF4**; schema **MF3/MF4**

### 42.7 Date pubblicazione

Campi su **`entity_image_assignments`**: `first_published_at`, `published_at`, `removed_at` — non su URL legacy.

### 42.8 Storage foto reali verificate

Sottocartella **`public-media/verified/`** (bucket esistente) — evita nuovo bucket MF4; path immutabile per asset verificato.

### 42.9 Wikidata MVP

- Se entità ha **Q-id** → lookup P18 → proposta Admin (D64)
- Ricerca automatica opzionale MF4; **mai** auto-publish
- Dubbio → VERIFICARE IMMAGINE AI

### 42.10 `people_portraits`

Bucket **mantenuto** per compatibilità AI esistente; ogni nuovo file registrato anche in `media_assets`. Orphan cleanup script MF5 (`cleanup_orphan_storage.ts`). **Non** eliminare bucket in MF1–4.

### 42.11 `image_is_placeholder`

Dual-write MF1–2: `media_assets.is_placeholder` = SoT; colonna `city_people.image_is_placeholder` letta fino a cutover MF5. **Non** drop colonna senza E2E.

### 42.12 Guest OTP

**Scelta:** Supabase Auth **`signInWithOtp({ email })`** + sessione guest limitata; email verificata salvata su report. Tabella `guest_report_verifications` solo se Auth nativo insufficiente (fallback Edge Function). **MF2**.

### 42.13 Pipeline verifica — schema DB

- `image_verification_runs`: id, media_asset_id, overall_outcome, blocking_step_code, ai_summary, created_at
- `image_verification_steps`: run_id, step_code (01–32 mappati §6.1), step_order, outcome (`verified`|`unverified`|`doubt`|`blocked`|`not_applicable`), rationale, evidence_json

Enum outcome allineato a D80. UI Admin mostra griglia step (es. §6 esempio concettuale). **MF3/MF4**.

### 42.14 Indici consigliati

- `media_assets(content_hash)`, `entity_image_assignments(media_asset_id, is_current)`, `entity_image_assignments(entity_type, entity_id, is_current)`, `content_reports(status, entity_type)`, `image_verification_steps(run_id, step_order)`

### 42.15 Backfill legacy (D71)

1. **MF2:** dual-write — ogni nuova immagine crea `media_assets` + assignment; legacy columns restano
2. **MF5:** script batch incrementale (`scripts/backfill_media_assets_from_legacy.ts`) con **dry-run default**, batch 100, pausa tra batch
3. **MF5:** cutover read da assignment; drop colonne legacy **solo** post-E2E + approvazione
4. **Mai** UPDATE distruttivo massivo in MF1

> **Distinzione obbligatoria (A vs B):** §42.15 governa la **migrazione** dal modello legacy al modello `media_assets` + `entity_image_assignments` (scrittura parallela, backfill, cutover read). **Non** implica né garantisce **atomicità end-to-end** delle singole operazioni applicative che oggi possono aggiornare entità e assignment in boundary separati. Per (B) vedere **§42.16** e **D90**.

### 42.16 Atomicità operazioni applicative entità + immagine (D90)

**Problema (verificato nel repository, 2026-09-19):** in MF1–MF2 alcune operazioni utente/Admin modificano i **dati dell'entità** (o colonne/JSON legacy) e la **relativa associazione immagine** (`entity_image_assignments` / RPC dual-write) tramite **percorsi distinti** — es. salvataggio città via API server (`PATCH /api/admin/cities/:id/details` → `persistCityDetails` su `cities`) seguito da dual-write/revoca assignment dal client Supabase. Non esiste oggi un **unico confine transazionale** che garantisca «tutto o niente» tra (A) aggiornamento entità/legacy e (B) creazione/sostituzione/revoca assignment.

**Requisito futuro:** a valle del completamento della **Macrofase 5**, quando un'operazione applicativa modifica **contemporaneamente** entità (o dati legacy ancora in transizione) e associazioni immagine pertinenti, il sistema deve garantire **consistenza atomica end-to-end** (commit unico o rollback completo equivalente).

**Soluzione (da progettare e implementare — non in MF1–MF2 come pezza client):** confine **server-side** preferito (es. stessa transazione PostgreSQL / stesso handler che invoca aggiornamento entità + RPC assignment con service role), o meccanismo **equivalente** che garantisca realmente atomicità — non la sola riduzione del rischio.

**Vincolo — NON soluzione definitiva:** try/catch client; retry; compensating update; doppie chiamate client; ordine delle chiamate; dual-write §42.15 da solo; altre strategie che mitigano il rischio senza garantire consistenza.

**Timing:** pianificare l'intervento definitivo **dopo MF5**, salvo che un'approvazione esplicita decida di **anticiparlo** (es. se un obiettivo di MF3/MF4 risultasse **bloccato** dall'assenza di atomicità — **nessun anticipo autonomo**).

**Perimetro macrofasi:** MF1–MF4 restano valide con dual-write transitorio §42.15 e gestione errori fail-loud; l'assenza di atomicità end-to-end **non** invalida il raggiungimento degli obiettivi già chiusi, ma deve essere risolta prima di considerare chiuso il percorso di **consolidamento operativo** oltre MF5 (**§42.16** come follow-up architetturale).

**Evidenza di riferimento (Audit §41):** `saveCityDetails` → `callCityAdminApi` → `server/services/cityAdminService.persistCityDetails`; MF2 dual-write separato in `cityWriteService` / `imageAssignmentDualWriteService`.

---

## Appendice A — Correzioni applicative già verificate (contesto)

Prima di questo Master Plan, sono state verificate e accettate correzioni su:

- `aiVision.ts`
- `aiEdgeErrors.ts`
- `peopleCompletenessPipeline.ts`
- `entitiesService.ts`
- `usePeopleAI.ts`
- `gemini-task/index.ts`

Verifiche completate: TypeScript, Biome, gestione image-only, MIME, Base64, quota errors, retry prevention, RPC/fallback, categorie, cache invalidation, flusso discovery/import/recovery.

---

## Appendice B — Riferimenti documentali correlati

| Documento | Contenuto |
|-----------|-----------|
| `AI_IMAGE_MANAGEMENT_AUDIT.md` | Stato attuale verificato nel repository |
| `AI_CONTEXT/16_CITY_MEDIA_MANAGEMENT.md` | Architettura media città (Presentation vs Photograph) |
| `AI_DEV_WORKFLOW/WORKFLOWS/WF_02_PHOTO_DOMAIN_REFACTORING.md` | Refactoring dominio foto |

---

*Fine Master Plan*

---

## Appendice C — Integrazione audit forense cumulativo (2026-09-12)

> **Scopo:** registrare nel Master Plan l'esito del **secondo passaggio di audit forense** integrale del repository, senza modificare decisioni già documentate nelle sezioni 1–30.  
> **Dettaglio tecnico completo:** `AI_IMAGE_MANAGEMENT_AUDIT.md` — **Sezione 34** (A–I).  
> **Regola:** contenuto **cumulativo** — nulla delle sezioni precedenti è stato rimosso.

### C.1 Sintesi verifiche forensi aggiuntive

Le verifiche del secondo passaggio **confermano e rafforzano** le decisioni già cristallizzate nel Master Plan, aggiungendo precisione operativa su cosa esiste **oggi** nel codice:

| Area | Esito forense | Implicazione per Master Plan |
|------|---------------|------------------------------|
| Libreria Media PEOPLE PORTRAITS | Legge **solo** Storage `people_portraits/` (max 100 file); **non** legge `city_people` | Conferma §16: Libreria Media target ≠ implementazione attuale; **non** esiste galleria completa personaggi |
| `people_portraits` | Scritto **solo** da `generateHistoricalPortrait`; 2 file sorgente totali nel repo | Conferma §4 pipeline AI; orphan cleanup (§28 obiettivo 7) resta necessario |
| `findExistingPortrait` | Globale, `ilike` nome, `limit(1)` senza ORDER BY | Rischio cross-city documentato in Audit §34.4; future identity key da progettare (Q7/Q8) |
| Prompt portrait | 3 variabili only; anti-volto nel fallback; **no** is_living/date/bio | Conferma §11 policy AI parzialmente presente; gap metadati/dicitura (§12) resta obiettivo |
| POI metadati | credit/license/status su DB; **no** modale pubblico attribuzione | Conferma §17 obiettivo fonte sempre visibile |
| Wikidata/P18 | **Zero** codice applicativo | Conferma §8 flusso futuro; nessuna implementazione parziale nascosta |
| Placeholder Personaggi | **Non esiste** dedicato; fallback `discovery` | Conferma §13 obiettivo asset macro-categoria |
| Community foto | Cartella `famous_person_photo_suggestions/` **non** in tab Libreria | Da includere in visione §16 Libreria evoluta |
| Infrastruttura riutilizzabile | Moderation RPC, POI MediaAsset, usage map, GeoCascadingFilters | Conferma approccio evolutivo — non duplicare (allineato §29 regola riuso) |

### C.2 Conferme esplicite su domande architetturali

**Domanda:** Abbiamo già una galleria di tutti i personaggi in Libreria Media?  
**Risposta verificata:** **NO.** PEOPLE PORTRAITS ≠ indice `city_people`; è un browser di una sottocartella Storage.

**Domanda:** `city_people.image_url` compare automaticamente in PEOPLE PORTRAITS?  
**Risposta verificata:** **NO**, salvo coincidenza che l'URL punti a un file fisico in `people_portraits/` presente nel listing (top 100).

**Domanda:** Esiste già integrazione P18/Wikidata?  
**Risposta verificata:** **NO** — nessun file applicativo.

**Domanda:** Esiste placeholder Personaggi famosi?  
**Risposta verificata:** **NO** placeholder dedicato; solo fallback generico categoria `discovery` via `ImageWithFallback`.

### C.3 Elementi emersi utili per obiettivi futuri (§28) — aggiunte cumulative

Obiettivi già in §28; qui si aggiungono **affinamenti** emersi dall'audit forense:

| # | Affinamento | Motivo forense |
|---|-------------|----------------|
| A1 | Esporre tab Libreria per `famous_person_photo_suggestions/` | Foto community accettate non visibili in PEOPLE PORTRAITS |
| A2 | Allineare `MEDIA_STATUS_VALUES` (`governance.ts`) con enum DB prima di usarli su Personaggi | Drift `ai_generated`/`needs_review` verificato |
| A3 | Deprecare o collegare `image_is_placeholder` su `city_people` | Colonna esiste; app non imposta `true` |
| A4 | Risolvere duplicato `uploadPublicMedia` in `photoService.ts` vs `mediaService.ts` | Due implementazioni parallele |
| A5 | `findExistingPortrait`: aggiungere ORDER BY deterministico + criteri qualità URL | `limit(1)` indeterminato oggi |
| A6 | Tab Libreria per `admin_uploads/` (POI upload) vs confusione con ADMIN ASSETS | POI upload in cartella non tabbed |

### C.4 Verifiche operative residue (non decisioni funzionali aperte)

| # | Verifica | Stato | Nota |
|---|----------|-------|------|
| V1 | Runtime DB `ai_configs.vision_portrait_historical` | ⚪ | Verifica ambiente |
| V2 | RLS Storage `people_portraits/` | ⚪ | Verifica migration |
| V3 | SoT upload `mediaService` vs `photoService` | 🔧 | Consolidamento MF5 — non blocca MF1 |
| V4 | Tab Libreria community folders | 🔧 | MF4 Media Library |

> **SUPERATA** la vecchia etichetta «Questioni aperte cumulo §27» — decisioni funzionali in **§27.1** e **§42**.

### C.5 Riferimento incrociato obbligatorio

Per il report strutturato **A–I** (Libreria Media, Personaggi, Prompt AI, POI, Provenienza, Esistente, Mancante, Rischi, Mappe flusso) vedere:

**`AI_IMAGE_MANAGEMENT_AUDIT.md` → Sezione 34.14**

---

*Fine Appendice C — integrazione cumulativa audit forense 2026-09-12*

---

## Appendice D — Revisione incrementale decisioni (2026-09-13)

> **Scopo:** registrare nel Master Plan le decisioni espresse nell'ultima revisione (Paolo), **senza riscrivere** il documento e **senza rimuovere** contenuto precedente.  
> **Regola:** contenuto **cumulativo**.

### D.1 Riepilogo decisioni recepite

| # | Tema | Sezione aggiornata | Tipo |
|---|------|-------------------|------|
| 1 | Marcatura strutturale AI / reali / placeholder | §3.8, §12 | Decisione approvata |
| 2 | Placeholder Personaggi in Asset Globali | §13.1.1 | Decisione approvata |
| 3 | Placeholder POI — preservare, non ricostruire | §14, §5.3 | Conferma rafforzata |
| 4 | Libreria Media = catalogo admin; evolvere esistente | §16 | Decisione approvata |
| 5 | Provenienza / tutela documentale | §17.3 | Decisione approvata |
| 6 | AI Personaggi — sfondo città realistico | §11.2.1 | Decisione approvata |
| 7 | POI — completare sistema, non rifare placeholder | §5.3 | Obiettivo futuro |
| 8 | Wikidata/P18 — futuro, discovery non garanzia | §8.3 | Conferma |
| 9 | Centralizzazione provenienza comune | §17.4, D25 | Direzione approvata |
| 10 | Temi rimandati — traccia obbligatoria | §27.1 | Nessuna cancellazione |
| 11 | RPC PostgREST verificata; POST E2E pending | §30, Q10, D28 | Aggiornamento stato |

### D.2 Coerenza verificata post-revisione

- ✅ Nessuna decisione futura cancellata (§27.1)
- ✅ Dettagli non messi in discussione preservati
- ✅ Nuove decisioni coerenti con filosofia "meglio nessuna foto che foto dubbia"
- ✅ Distinzione mantenuta: stato attuale (Audit) vs obiettivi vs verifiche post-sviluppo (Q10)
- ✅ Nessuna nuova architettura tecnica definitiva introdotta oltre direzione §17.4

---

*Fine Appendice D — revisione incrementale 2026-09-13*

---

## Appendice E — Sistema segnalazione / abuso (cumulativo 2026-09-14, aggiornato 2026-09-15)

> **Scopo:** traccia cumulativa decisioni segnalazioni. Dettaglio implementativo: Audit §35–§36.  
> **Correzione 2026-09-15:** "Segnala immagine" (E.1 revisione 2026-09-14) **superato** da D30 "Segnala abuso".

### E.1 Decisioni recepite (sintesi aggiornata)

| Tema | Decisione vigente |
|------|-------------------|
| Base tecnica | Evolvere modali/servizi esistenti — infrastruttura centrale §33 |
| UX | **"Segnala abuso"** — modello centrale |
| Hub Admin | 4 macro-tab §32 |
| Target | Immagine/personaggio specifici + anteprima |
| Modale | Tipologia Immagine/Personaggio + motivazione + note **sempre** obbligatorie |
| Guest | Email + OTP; no registrazione |
| Post-segnalazione | Sospensione **immediata** immagine e/o entità §31.7 |
| Stati | NUOVO · IN VERIFICA · OK · KO · TUTTE §34 |
| Admin | OK/KO con motivazione obbligatoria |
| Doppia segnalazione | Modello B — due righe collegate §35.2 |
| OK = conservazione permanente | §31.9, D56 |
| Snapshot foto esatta | §31.9.1, D57 |
| AI | Coda VERIFICARE IMMAGINE AI §36 |
| Macrofasi | **5 approvate** §38 + regola §3.9 |
| OTP guest | Requisito §33.6 — tecnologia in sviluppo |

### E.2 Distinzione stato / obiettivo

| Capacità | Stato |
|----------|-------|
| Hub Segnalazioni 4 macro-tab | 🔴 Obiettivo — oggi `SuggestionManager` + manager separati |
| Modale unificato Segnala abuso | 🟡 Parziale — modali separati Personaggio/Patrono |
| Sospensione immediata | 🔴 Non implementato |
| Stati NUOVO/OK/KO unificati | 🔴 Enum legacy diversi |
| Guest OTP | 🔴 Non implementato client |
| Community foto abuso | 🔴 Assente |
| Legenda Admin | 🔴 Assente |

### E.3 Coerenza verificata

- ✅ Decisioni precedenti preservate (corrette dove superseded)
- ✅ Argomenti rimandati §27.1 intatti
- ✅ Placeholder POI non messi in discussione

---

*Fine Appendice E — aggiornamento 2026-09-15*

---

## Appendice F — Revisione infrastruttura centrale (2026-09-15)

> **Scopo:** indice rapido delle **nuove sezioni** introdotte in questa revisione.

| Sezione | Contenuto |
|---------|-----------|
| §3.9 | Regola progettazione/sviluppo + macro/microfasi + E2E |
| §32 | Admin Segnalazioni — 4 macro-tab + micro-tab |
| §33 | Modello centrale Segnala abuso |
| §34 | Stati segnalazione / entità / immagine |
| §35 | Doppia segnalazione Immagine+Personaggio |
| §36 | AI macro-tab, SI/NO, VERIFICARE IMMAGINE AI, notifiche |
| §37 | Migrazione categorie + rimozione menu Personaggi Famosi |
| §38 | 5 macrofasi ufficiali approvate |
| D39–D58 | Decisioni revisione 2026-09-15 |
| Q22, Q23, Q27 | Chiuse |
| Q24, Q26 | Scelte **tecniche** in implementazione (MF2) — requisiti funzionali D69/D70 **chiusi** |

**Audit operativo corrispondente:** `AI_IMAGE_MANAGEMENT_AUDIT.md` §36.

---

*Fine Appendice F — revisione 2026-09-15*
Aggiornato al 19.09.2026
