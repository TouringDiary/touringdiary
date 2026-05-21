# 🖼️ DOC 16: CITY MEDIA MANAGEMENT (v1.0 — CERTIFIED)

Questo documento descrive la pipeline di gestione, ottimizzazione e propagazione degli asset multimediali delle città.

---

## DESCRIZIONE TECNICA
Il sistema gestisce il ciclo di vita delle immagini (Hero, Card, Gallery) assicurando la coerenza tra il database e lo storage. Include una logica di propagazione automatica delle modifiche e un sistema di audit per tracciare l'utilizzo di ogni asset in tutto il sistema.

## DESCRIZIONE SEMPLICE
È il sistema che gestisce le foto delle città e dei luoghi, assicurandosi che quando una foto viene cambiata o cancellata, l'app si aggiorni ovunque per non mostrare link rotti.

---

## PIPELINE RUNTIME: MEDIA PROPAGATION
1. **Trigger**: Un admin aggiorna o elimina una foto dalla `community_posts` o dalla galleria di una città.
2. **Hook**: `useCityGallery.ts` gestisce lo stato della galleria e attiva le chiamate al service.
3. **Service**: `mediaService.ts` esegue funzioni come `propagatePhotoRemoval` o `syncPhotoDescriptionToCity`.
4. **Logic**: Il sistema cerca in tutto il database (Cities, POIs, People, Shops) dove quell'URL è utilizzato.
5. **Update Database**: Aggiornamento atomico di tutti i record coinvolti per sostituire l'URL con un fallback o rimuoverlo.
6. **Audit**: `getAssetUsageMap` genera una mappa completa di dove ogni immagine è usata (Single Source of Truth).
7. **Risposta UI**: L'interfaccia si aggiorna in tempo reale senza immagini mancanti.

---

## COMPONENTI COINVOLTI
*   **File**: `mediaService.ts`, `useCityGallery.ts`, `cityReadService.ts`, `cityWriteService.ts`.
*   **Storage Buckets**: `community-photos`, `public-media`.
*   **Tabelle**: `cities`, `pois`, `photo_submissions`, `city_people`, `shops`, `city_events`, `city_guides`.

## INTEGRAZIONE CON ALTRI SISTEMI
*   **Community Media**: Gestione dell'approvazione e promozione delle foto utenti a "Hero Image" della città.
*   **Staging Pipeline**: Assegnazione automatica di immagini ai nuovi POI importati.
*   **Design System**: Supporto per le immagini di background dei template social.
