/**
 * Sezioni cartella Viaggio (DOC 37) — shell STEP-2.
 * Contenuti funzionali = STEP-3…5; qui solo nav + placeholder.
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

export const VIAGGIO_FOLDER_DEFAULT_SECTION: ViaggioFolderSectionId = 'diario';

export interface ViaggioFolderSectionDefinition {
  id: ViaggioFolderSectionId;
  label: string;
  /** Empty silenzioso — niente feature STEP-3…5. */
  placeholder: string;
}

export const VIAGGIO_FOLDER_SECTIONS: readonly ViaggioFolderSectionDefinition[] = [
  { id: 'diario', label: 'Diario', placeholder: 'Qui troverai i diari di questo viaggio.' },
  { id: 'valigia', label: 'Valigia', placeholder: 'Qui troverai le valigie di questo viaggio.' },
  { id: 'ricordi', label: 'Ricordi', placeholder: 'Qui troverai i ricordi di questo viaggio.' },
  { id: 'allegati', label: 'Allegati', placeholder: 'Qui troverai gli allegati di questo viaggio.' },
  { id: 'roadbook', label: 'Roadbook', placeholder: 'Qui troverai i roadbook di questo viaggio.' },
  { id: 'mappa', label: 'Mappa', placeholder: 'Qui troverai la mappa di questo viaggio.' },
  { id: 'riepilogo', label: 'Riepilogo', placeholder: 'Qui troverai il riepilogo di questo viaggio.' },
] as const;

export function getViaggioFolderSection(
  id: ViaggioFolderSectionId,
): ViaggioFolderSectionDefinition {
  return VIAGGIO_FOLDER_SECTIONS.find((s) => s.id === id) ?? VIAGGIO_FOLDER_SECTIONS[0];
}
