import type { ImageVerificationStepOutcomeDb } from './governance';

/** Checklist funzionale §6.1 — codici step per griglia Admin (MF3). */
export const IMAGE_VERIFICATION_STEP_DEFINITIONS = [
  { code: 'file_identity', order: 1, label: 'Identità file / asset stabile' },
  { code: 'source_provenance', order: 2, label: 'Fonte e provenienza' },
  { code: 'source_trust', order: 3, label: 'Attendibilità fonte' },
  { code: 'license_declared', order: 4, label: 'Licenza dichiarata' },
  { code: 'license_version', order: 5, label: 'Versione licenza (CC BY 4.0 auto-path)' },
  { code: 'license_url', order: 6, label: 'URL licenza verificabile' },
  { code: 'attribution_complete', order: 7, label: 'Attribuzione completa' },
  { code: 'copyright_notice', order: 8, label: 'Copyright / titolare diritti' },
  { code: 'usage_rights_td', order: 9, label: 'Diritto utilizzo Touring Diary' },
  { code: 'personality_rights', order: 10, label: 'Diritti immagine persona' },
  { code: 'privacy_content', order: 11, label: 'Privacy / contenuto sensibile' },
  { code: 'trademark_logo', order: 12, label: 'Marchi / loghi' },
  { code: 'third_party_works', order: 13, label: 'Opere terze incorporate' },
  { code: 'cultural_heritage', order: 14, label: 'Beni culturali / restrizioni luogo' },
  { code: 'contradictions', order: 15, label: 'Informazioni contraddittorie' },
  { code: 'platform_history', order: 16, label: 'Precedenti segnalazioni piattaforma' },
] as const;

export type ImageVerificationStepCode =
  (typeof IMAGE_VERIFICATION_STEP_DEFINITIONS)[number]['code'];

export type VerificationStepGridRow = {
  stepCode: ImageVerificationStepCode;
  stepOrder: number;
  label: string;
  outcome: ImageVerificationStepOutcomeDb;
  aiRationale?: string | null;
  adminRationale?: string | null;
  adminOverride?: boolean;
};
