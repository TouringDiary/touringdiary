# Implementation Plan: Sistema Editoriale Foto (is_official)

## 1. Visione Editoriale e Governance
Touring Diary evolve verso una struttura a due livelli di contenuti visivi, garantendo un'estetica premium per la presentazione delle città e un coinvolgimento autentico della community.

### Layer 1: Touring Diary Official
- **Scopo**: Identità visiva, Hero backgrounds, vetrina città, dati per AI.
- **Origine**: Caricamenti admin, contenuti generati/importati dal sistema, promozioni dalla community.
- **Governance**: Definito esplicitamente dal flag `is_official: true`.

### Layer 2: Community
- **Scopo**: Racconto spontaneo, live feed, varietà di prospettive.
- **Origine**: Caricamenti utenti (UGC).
- **Governance**: Flag `is_official: false`. Ordinamento guidato dai like per premiare la qualità organica.

---

## 2. Decisioni Architetturali Consolidate

### Source of Truth (SSoT)
- La colonna `is_official` nella tabella `photo_submissions` è la verità definitiva.
- **Fallback Legacy**: Per garantire la continuità con i record storici, il sistema considera "Official" anche i contenuti appartenenti al `SYSTEM_USER_ID` (`0000...0000`), ma solo come paracadute temporaneo.

### Relazioni e Integrità
- Una foto può essere promossa da Community a Official senza duplicare il record o perdere l'engagement (like).
- Il campo `city_id` deve diventare gradualmente obbligatorio per tutte le foto ufficiali per eliminare la dipendenza dal nome testuale (`locationName`).

---

## 3. Roadmap Implementativa (Step-by-Step)

### FASE 1: Hardening Infrastrutturale (CORRENTE)
**Obiettivo**: Allineare tipi e servizi alla nuova colonna senza cambiare la UI.
1. **Types Alignment**: Aggiornamento `supabase.ts` e domain types.
2. **Interface Update**: `PhotoSubmission` (Frontend) riceve `isOfficial` come campo non opzionale.
3. **Mapper Refactor**: `mapDbPhotoToSubmission` implementa la logica "Native First".
4. **Write Operations**: Aggiornamento `uploadCommunityPhoto` e `getOrCreatePhotoSubmissionForUrl` per gestire il flag.

### FASE 2: Governance Admin & Moderation
**Obiettivo**: Fornire gli strumenti di controllo editoriale.
1. **Admin Toggle**: Aggiunta selettore "Ufficiale / Community" nel form di upload admin.
2. **Promotion Tool**: Implementazione pulsante "Promuovi a Ufficiale" nella tabella moderazione.
3. **Normalizzazione Geografica**: Forzare il `city_id` durante le operazioni di promozione.

### FASE 3: Refactor UX City Experience
**Obiettivo**: Separare visivamente i layer editoriale e social.
1. **Tab System**: Galleria città divisa in "Official" e "Community".
2. **Default Logic**: Tab "Official" di default se N > 5, altrimenti "Community".
3. **Hero Enforcement**: Le sezioni Hero caricano esclusivamente contenuti `is_official`.
4. **Top Gallery Partition**: Separazione della Top 10 in Editoriale e Community.

---

## 4. File Coinvolti e Impatti

| File | Responsabilità | Modifica |
| :--- | :--- | :--- |
| `src/types/supabase.ts` | Schema DB | Aggiunta `is_official` a Row/Insert/Update. |
| `src/types/domain/index.ts` | Domain Types | Pulizia estensioni "ghost". |
| `src/types/models/Media.ts` | UI Interface | Hardening `PhotoSubmission`. |
| `src/services/photoService.ts` | Business Logic | Mapper, Upload, Promotion. |
| `src/hooks/useCityGallery.ts` | Orchestrazione | Separazione array Official/Community. |
| `src/components/city/gallery/GalleryGrid.tsx` | UI Gallery | Implementazione Tab e Switcher. |
| `src/components/modals/sectionPreview/PreviewHero.tsx` | UI Hero | Filtro rigoroso su Official. |

---

## 5. Rischi e Mitigazioni
- **Rischio Regressione UI**: Foto che spariscono dalle gallery. 
  - **Mitigazione**: Fallback `is_official ?? (userId === SYSTEM_ID)` sempre attivo nel mapper.
- **Rischio Prestazionale**: Lentezza nel filtraggio gallery.
  - **Mitigazione**: Indice parziale su `(city_id, is_official)` già creato a livello DB.
- **Rischio Dati**: Foto ufficiali senza `city_id`.
  - **Mitigazione**: Audit continuo e forzatura ID durante il salvataggio dei contenuti editoriali.

---

## 6. TODO e Cleanup Futuri
- [ ] Eliminare definitivamente il controllo su `SYSTEM_USER_ID` una volta completata la migrazione di tutti i record.
- [ ] Rimuovere il fallback su `locationName` a favore del solo `city_id`.
- [ ] Implementare slideshow automatico per Hero con multiple foto ufficiali.
