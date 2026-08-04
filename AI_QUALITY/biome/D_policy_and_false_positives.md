# Livello D — Policy, falsi positivi e decisioni di prodotto

> Documento di policy della baseline Biome full-project (2026-08-03).  
> Dashboard: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md)

## Scopo

Il **Livello D** raccoglie diagnostiche che **non vanno corrette** (o non ora), perche:

- falsi positivi rispetto al dominio;
- warning discutibili / rumore;
- decisioni di prodotto consapevoli;
- pattern che oggi e corretto mantenere.

## Stato baseline (full project)

| Campo | Valore |
|----|----|
| **Diagnostiche classificate D alla baseline** | **0** |
| **Categorie intere in D** | nessuna |
| **Ultimo aggiornamento** | 2026-08-03 |

Alla data della baseline ufficiale **nessuna categoria intera** e stata messa in D a priori.  
I candidati tipici (da promuovere a D **solo dopo review puntuale**) includono:

| Candidato | Categoria Biome | Motivo potenziale D |
|----|----|----|
| Key su slot dominio statici | `lint/suspicious/noArrayIndexKey` | Lista fissa non riordinabile; key=indice puo essere accettabile se documentata |
| autofocus in modal critici | `lint/a11y/noAutofocus` | UX intenzionale accessibilita/prodotti |
| HTML trustato admin-only | `lint/security/noDangerouslySetInnerHtml` | Se sanitizzato e threat model accettato (altrimenti resta C) |

## Registro decisioni D (append-only)

| Data | File | Categoria | Occorrenze | Motivo | Decisione |
|----|----|----|---:|----|----|
| — | — | — | 0 | Baseline: nessun caso D registrato | — |

## Regola operativa

1. Default: correggere secondo il livello della categoria (A–C).
2. Solo dopo review esplicita un hit puo passare a D.
3. Ogni promozione a D aggiorna questa tabella **e** ricalcola i totali in `AI_BIOME_AUDIT.md` (identita A+A/B+B+C+D = totale progetto).
