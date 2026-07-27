/**
 * Sezioni cartella Viaggio (DOC 37) — stereotipi Resource / Library / View.
 * AI non è una sezione (DOC 34A / DOC 37 §11).
 */

export const VIAGGIO_FOLDER_SECTION_IDS = [
  'diario',
  'valigia',
  'ricordi',
  'allegati',
  'roadbook',
  'mappa',
  'riepilogo',
] as const;

export type ViaggioFolderSectionId = (typeof VIAGGIO_FOLDER_SECTION_IDS)[number];

export type ViaggioSectionStereotype = 'Resource' | 'Library' | 'View';

export const VIAGGIO_FOLDER_DEFAULT_SECTION: ViaggioFolderSectionId = 'diario';

export interface ViaggioFolderSectionDefinition {
  id: ViaggioFolderSectionId;
  label: string;
  stereotype: ViaggioSectionStereotype;
  /** Empty silenzioso quando la sezione non ha ancora dati. */
  placeholder: string;
}

export const VIAGGIO_FOLDER_SECTIONS: readonly ViaggioFolderSectionDefinition[] = [
  {
    id: 'diario',
    label: 'Diario',
    stereotype: 'Resource',
    placeholder: 'Qui troverai i diari di questo viaggio.',
  },
  {
    id: 'valigia',
    label: 'Valigia',
    stereotype: 'Resource',
    placeholder: 'Qui troverai le valigie di questo viaggio.',
  },
  {
    id: 'ricordi',
    label: 'Ricordi',
    stereotype: 'Resource',
    placeholder: 'Qui troverai i ricordi di questo viaggio.',
  },
  {
    id: 'allegati',
    label: 'Allegati',
    stereotype: 'Resource',
    placeholder: 'Qui troverai gli allegati di questo viaggio.',
  },
  {
    id: 'roadbook',
    label: 'Roadbook',
    stereotype: 'Library',
    placeholder: 'Qui troverai i roadbook di questo viaggio.',
  },
  {
    id: 'mappa',
    label: 'Mappa',
    stereotype: 'View',
    placeholder: 'Qui troverai la mappa di questo viaggio.',
  },
  {
    id: 'riepilogo',
    label: 'Riepilogo',
    stereotype: 'View',
    placeholder: 'Qui troverai il riepilogo di questo viaggio.',
  },
] as const;

export function getViaggioFolderSection(
  id: ViaggioFolderSectionId,
): ViaggioFolderSectionDefinition {
  return VIAGGIO_FOLDER_SECTIONS.find((s) => s.id === id) ?? VIAGGIO_FOLDER_SECTIONS[0];
}

/** Invariante dominio: nessuna sezione AI nella cartella Viaggio. */
export function viaggioFolderHasAiSection(): boolean {
  return VIAGGIO_FOLDER_SECTIONS.some((s) => s.id === ('ai' as ViaggioFolderSectionId));
}
