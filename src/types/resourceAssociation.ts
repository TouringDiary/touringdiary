/** Scelta associazione Viaggio in creazione / Salva con nome (DOC 35 §9.5–9.8). */
export type ViaggioAssociationChoice = 'none' | 'existing' | 'new';

export interface SaveAsViaggioOptions {
  viaggioChoice: ViaggioAssociationChoice;
  existingViaggioId?: string | null;
}

/** Opzioni Viaggio per saveUserDraft (Salva con nome esteso). */
export type SaveUserDraftViaggioOptions = SaveAsViaggioOptions;

export interface CreateDiaryInput {
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
  viaggioChoice: ViaggioAssociationChoice;
  existingViaggioId?: string | null;
  /** Imposto quando si crea dal dettaglio Viaggio (associazione obbligatoria). */
  fixedViaggioId?: string | null;
}

export interface CreateSuitcaseInput {
  userId: string;
  name: string;
  viaggioChoice: ViaggioAssociationChoice;
  existingViaggioId?: string | null;
  fixedViaggioId?: string | null;
  icon?: string;
}

export type DiaryAssociationConflict =
  | { type: 'none' }
  | { type: 'other_viaggio'; currentViaggioId: string };

export type SuitcaseLinkConflict =
  | { type: 'none' }
  | { type: 'other_viaggio' }
  | { type: 'linked_to_diary_or_viaggio' };

export class SuitcaseLinkConflictError extends Error {
  readonly conflict: Exclude<SuitcaseLinkConflict, { type: 'none' }>;

  constructor(conflict: Exclude<SuitcaseLinkConflict, { type: 'none' }>) {
    super('Suitcase link conflict');
    this.name = 'SuitcaseLinkConflictError';
    this.conflict = conflict;
  }
}

/** Errore di dominio Resource Association (messaggio utente stabile; non infrastrutturale). */
export class ResourceAssociationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResourceAssociationError';
  }
}
