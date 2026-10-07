import type { ImageVerificationStepOutcomeDb } from '@/constants/governance';
import type { CommonsLicenseStepOutcome } from '@/services/wikimedia/commonsLicenseParser';
import type { WikimediaProposalPreview } from '@/services/wikimedia/rankWikimediaProposals';

/**
 * Presentazione dei controlli già prodotti dalla pipeline.
 * Non ricalcola matching, soglia, licenza o importabilità.
 */

export type WikimediaCheckTone = 'passed' | 'review' | 'failed' | 'not_applicable';

export type WikimediaCheckView = {
  id: string;
  label: string;
  tone: WikimediaCheckTone;
  statusLabel: string;
  rationale: string | null;
};

export type WikimediaTechnicalField = {
  label: string;
  value: string;
};

/** Significato dei controlli già eseguiti. Non aggiunge una verifica. */
export const WIKIMEDIA_CHECK_LEGEND: ReadonlyArray<{
  label: string;
  meaning: string;
}> = [
  {
    label: 'Superato',
    meaning:
      'Il passo ha esito verified, oppure il risultato contiene l’elemento controllato (proposta Wikidata o file P18).',
  },
  {
    label: 'Da verificare manualmente',
    meaning: 'Il passo ha esito doubt oppure unverified.',
  },
  {
    label: 'Non superato',
    meaning: 'Il passo ha esito blocked, oppure il file P18 manca.',
  },
  {
    label: 'Non applicabile',
    meaning: 'Il passo ha esito not_applicable.',
  },
  {
    label: 'Matching Wikidata',
    meaning:
      'La ricerca ha prodotto una proposta. La motivazione in elenco è la nota Discovery Wikidata (Q-id e score). Verificare che l’entità sia questo POI.',
  },
  {
    label: 'Immagine P18',
    meaning:
      'Il risultato riporta il file Commons scelto dalla proprietà P18. Verificare che quel file sia l’immagine dell’entità.',
  },
  {
    label: 'Licenza dichiarata',
    meaning:
      'Legge LicenseShortName e License. È superato solo se quei campi dichiarano CC BY 4.0. Un’altra licenza resta in dubbio per la revisione Admin. Verificare la licenza nei metadati.',
  },
  {
    label: 'Versione licenza',
    meaning:
      'Controlla la versione CC BY 4.0 del percorso automatico. Un’altra licenza non è ammessa a quel percorso. Verificare la versione nei campi licenza.',
  },
  {
    label: 'URL licenza',
    meaning:
      'Controlla che l’URL sia presente e coerente con la dichiarazione. Se la licenza non è CC BY 4.0, l’URL resta in dubbio. Verificare l’URL.',
  },
  {
    label: 'Attribuzione',
    meaning:
      'Controlla autore e testo di attribuzione. Verificare che autore e attribuzione siano presenti.',
  },
  {
    label: 'Avviso di copyright',
    meaning:
      'Controlla il campo Copyrighted. Se c’è, il passo è superato. Se manca, è non applicabile e non è una prova obbligatoria per CC BY 4.0. Leggere l’avviso quando è presente.',
  },
  {
    label: 'Provenienza',
    meaning:
      'Controlla che l’URL sorgente sia una pagina Commons o Wikimedia. Verificare quella pagina.',
  },
  {
    label: 'Percorso automatico',
    meaning:
      'È il flag del percorso CC BY 4.0: superato solo se i passi richiesti sono verified. Se non è ammesso, resta in dubbio per la revisione Admin e non è un esito bloccante.',
  },
];

const TONE_LABEL: Record<WikimediaCheckTone, string> = {
  passed: 'Superato',
  review: 'Da verificare manualmente',
  failed: 'Non superato',
  not_applicable: 'Non applicabile',
};

const STEP_LABEL: Record<CommonsLicenseStepOutcome['stepCode'], string> = {
  license_declared: 'Licenza dichiarata',
  license_version: 'Versione licenza',
  license_url: 'URL licenza',
  attribution_complete: 'Attribuzione',
  copyright_notice: 'Avviso di copyright',
  source_provenance: 'Provenienza',
};

const EVIDENCE_LABEL: Record<string, string> = {
  licenseShortName: 'Nome breve licenza',
  licenseField: 'Campo licenza',
  licenseUrl: 'URL',
  attributionText: 'Testo attribuzione',
  copyrightNotice: 'Testo avviso',
  sourcePageUrl: 'URL sorgente',
  fileTitle: 'File',
  normalizedLicenseCode: 'Codice normalizzato',
  hasAuthor: 'Autore presente',
  authorName: 'Autore',
};

const CONFIDENCE_LABEL = {
  high: 'Alta',
  medium: 'Media',
  low: 'Bassa',
} as const;

function toneForOutcome(outcome: ImageVerificationStepOutcomeDb): WikimediaCheckTone {
  if (outcome === 'verified') return 'passed';
  if (outcome === 'blocked') return 'failed';
  if (outcome === 'not_applicable') return 'not_applicable';
  return 'review';
}

function check(
  id: string,
  label: string,
  tone: WikimediaCheckTone,
  rationale: string | null,
): WikimediaCheckView {
  return { id, label, tone, statusLabel: TONE_LABEL[tone], rationale };
}

function presentOrAbsent(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : 'Assente';
}

function evidenceValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'Sì' : 'No';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return presentOrAbsent(value);
  if (value === null || value === undefined) return 'Assente';
  return 'Assente';
}

/** Controlli immediati: matching e P18 dal risultato lookup, passi licenza e percorso automatico dal parser. */
export function buildWikimediaProposalChecks(
  preview: WikimediaProposalPreview,
): WikimediaCheckView[] {
  const proposal = preview.proposal;
  const license = preview.license;
  const checks: WikimediaCheckView[] = [
    check(
      'matching',
      'Matching Wikidata',
      proposal ? 'passed' : 'review',
      proposal
        ? (proposal.lookupNotes.find((note) => note.startsWith('Discovery Wikidata:')) ??
            'Corrispondenza accettata dalla ricerca.')
        : preview.validityNote,
    ),
    check(
      'p18',
      'Immagine P18',
      proposal?.commonsFileTitle?.trim() ? 'passed' : 'failed',
      proposal?.commonsFileTitle?.trim() ? proposal.commonsFileTitle.trim() : preview.validityNote,
    ),
  ];

  if (license) {
    for (const step of license.stepOutcomes) {
      checks.push(
        check(
          step.stepCode,
          STEP_LABEL[step.stepCode],
          toneForOutcome(step.outcome),
          step.rationale,
        ),
      );
    }
    checks.push(
      check(
        'auto_path',
        'Percorso automatico',
        license.isCcBy40AutoPathEligible ? 'passed' : 'review',
        license.isCcBy40AutoPathEligible
          ? 'Metadati ammessi al percorso automatico CC BY 4.0.'
          : 'Percorso automatico CC BY 4.0 non ammesso. La verifica resta all’Admin.',
      ),
    );
  } else {
    checks.push(
      check(
        'license_unread',
        'Licenza',
        'review',
        preview.validityNote || 'Metadati licenza non disponibili in questo risultato.',
      ),
    );
    checks.push(
      check(
        'auto_path',
        'Percorso automatico',
        'review',
        'Percorso automatico non valutato: metadati licenza assenti in questo risultato.',
      ),
    );
  }

  return checks;
}

/** Valori grezzi già restituiti da parser e proposta, con etichette italiane. */
export function buildWikimediaProposalTechnicalFields(
  preview: WikimediaProposalPreview,
): WikimediaTechnicalField[] {
  const license = preview.license;
  const proposal = preview.proposal;
  const fields: WikimediaTechnicalField[] = [
    { label: 'Etichetta', value: preview.candidate.label },
    { label: 'Q-id', value: preview.candidate.qid },
    { label: 'Descrizione', value: presentOrAbsent(preview.candidate.description) },
    { label: 'Punteggio nel risultato', value: String(preview.candidate.matchScore) },
    { label: 'Nota di validità', value: presentOrAbsent(preview.validityNote) },
    {
      label: 'Licenza dichiarata',
      value: presentOrAbsent(license?.licenseShortName),
    },
    {
      label: 'Codice licenza normalizzato',
      value: presentOrAbsent(license?.normalizedLicenseCode),
    },
    { label: 'URL licenza', value: presentOrAbsent(license?.licenseUrl) },
    { label: 'Attribuzione', value: presentOrAbsent(license?.attributionText) },
    { label: 'Avviso di copyright', value: presentOrAbsent(license?.copyrightNotice) },
    { label: 'Autore', value: presentOrAbsent(license?.authorName) },
    { label: 'Titolare dei diritti', value: presentOrAbsent(license?.rightsHolder) },
    { label: 'Provenienza', value: presentOrAbsent(license?.sourcePageUrl) },
    {
      label: 'Motivi bloccanti',
      value:
        license && license.blockingReasons.length > 0
          ? license.blockingReasons.join(' · ')
          : 'Nessuno',
    },
    {
      label: 'File Commons',
      value: presentOrAbsent(proposal?.commonsFileTitle),
    },
    {
      label: 'Confidenza lookup',
      value: proposal ? CONFIDENCE_LABEL[proposal.confidence] : 'Assente',
    },
    {
      label: 'Conferma admin richiesta dal lookup',
      value: proposal ? (proposal.requiresAdminConfirm ? 'Sì' : 'No') : 'Assente',
    },
    {
      label: 'Note lookup',
      value:
        proposal && proposal.lookupNotes.length > 0 ? proposal.lookupNotes.join(' · ') : 'Nessuna',
    },
  ];

  if (license) {
    for (const step of license.stepOutcomes) {
      const evidence = Object.entries(step.evidence)
        .map(([key, value]) => `${EVIDENCE_LABEL[key] ?? key}: ${evidenceValue(value)}`)
        .join(' · ');
      if (evidence) {
        fields.push({
          label: `Evidenza — ${STEP_LABEL[step.stepCode]}`,
          value: evidence,
        });
      }
    }
  }

  return fields;
}

/** Disponibilità Importa: legge solo il flag già calcolato, non lo ricalcola. */
export function wikimediaImportAvailability(preview: WikimediaProposalPreview): {
  enabled: boolean;
  reason: string;
} {
  const enabled = Boolean(preview.proposal) && preview.isImportable;
  return {
    enabled,
    reason: preview.validityNote,
  };
}
