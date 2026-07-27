import type { ViaggioFolderSectionId } from './viaggioFolderSections';
import { VIAGGIO_FOLDER_DEFAULT_SECTION } from './viaggioFolderSections';

/** Vista locale root «I miei Viaggi» — non è routing URL / modal. */
export type MySpaceTripsView =
  | { kind: 'catalog' }
  | { kind: 'folder'; viaggioId: string; section: ViaggioFolderSectionId };

export const MY_SPACE_TRIPS_CATALOG: MySpaceTripsView = { kind: 'catalog' };

export function openTripsFolder(
  viaggioId: string,
  section: ViaggioFolderSectionId = VIAGGIO_FOLDER_DEFAULT_SECTION,
): MySpaceTripsView {
  return { kind: 'folder', viaggioId, section };
}
