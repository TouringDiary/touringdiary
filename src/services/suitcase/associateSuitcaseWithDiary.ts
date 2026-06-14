import { Suitcase } from '@/types/suitcase';
import { AssociationCase } from '@/utils/suitcaseAssociation';

export class SuitcaseAssociationError extends Error {
  constructor(
    message: string,
    public readonly step: 'save-diary' | 'persist-suitcase' | 'link'
  ) {
    super(message);
    this.name = 'SuitcaseAssociationError';
  }
}

export interface AssociationDeps {
  saveDiary: (name: string) => Promise<string>;
  persistGuestSuitcase: (userId: string, title?: string) => Promise<Suitcase>;
  linkSuitcaseToTrip: (
    itineraryId: string,
    suitcaseId: string,
    userId: string
  ) => Promise<void>;
}

export interface ExecuteAssociationInput {
  associationCase: AssociationCase;
  userId: string;
  itineraryId: string | null;
  suitcaseId: string;
  diaryName?: string;
  suitcaseName?: string;
  deps: AssociationDeps;
}

export interface AssociationResult {
  itineraryId: string;
  suitcaseId: string;
}

/**
 * Pipeline esplicita: salva diario → salva valigia → collega.
 * Nessun link parziale: fallisce al primo errore.
 */
export const executeSuitcaseDiaryAssociation = async (
  input: ExecuteAssociationInput
): Promise<AssociationResult> => {
  const { associationCase, userId, deps } = input;
  let itineraryId = input.itineraryId;
  let suitcaseId = input.suitcaseId;

  const requireDiaryName = () => {
    const name = input.diaryName?.trim();
    if (!name) {
      throw new SuitcaseAssociationError(
        'Inserisci un nome per il diario di viaggio.',
        'save-diary'
      );
    }
    return name;
  };

  const requireSuitcaseName = () => {
    const name = input.suitcaseName?.trim();
    if (!name) {
      throw new SuitcaseAssociationError(
        'Inserisci un nome per la valigia.',
        'persist-suitcase'
      );
    }
    return name;
  };

  const saveDiaryStep = async () => {
    try {
      const savedId = await deps.saveDiary(requireDiaryName());
      if (!savedId) {
        throw new SuitcaseAssociationError(
          'Impossibile salvare il diario. Riprova.',
          'save-diary'
        );
      }
      itineraryId = savedId;
    } catch (error) {
      if (error instanceof SuitcaseAssociationError) throw error;
      throw new SuitcaseAssociationError(
        'Errore durante il salvataggio del diario.',
        'save-diary'
      );
    }
  };

  const persistSuitcaseStep = async () => {
    try {
      const persisted = await deps.persistGuestSuitcase(
        userId,
        associationCase === 'C' || associationCase === 'D'
          ? requireSuitcaseName()
          : undefined
      );
      if (!persisted?.id) {
        throw new SuitcaseAssociationError(
          'Impossibile salvare la valigia. Riprova.',
          'persist-suitcase'
        );
      }
      suitcaseId = persisted.id;
    } catch (error) {
      if (error instanceof SuitcaseAssociationError) throw error;
      throw new SuitcaseAssociationError(
        'Errore durante il salvataggio della valigia.',
        'persist-suitcase'
      );
    }
  };

  const linkStep = async () => {
    if (!itineraryId) {
      throw new SuitcaseAssociationError(
        'Diario non disponibile per l\'associazione.',
        'link'
      );
    }
    try {
      await deps.linkSuitcaseToTrip(itineraryId, suitcaseId, userId);
    } catch {
      throw new SuitcaseAssociationError(
        'Impossibile collegare la valigia al diario.',
        'link'
      );
    }
  };

  switch (associationCase) {
    case 'A':
      if (!itineraryId) {
        throw new SuitcaseAssociationError(
          'Diario non disponibile per l\'associazione.',
          'link'
        );
      }
      await linkStep();
      break;
    case 'B':
      await saveDiaryStep();
      await linkStep();
      break;
    case 'C':
      await persistSuitcaseStep();
      await linkStep();
      break;
    case 'D':
      await saveDiaryStep();
      await persistSuitcaseStep();
      await linkStep();
      break;
    default:
      throw new SuitcaseAssociationError('Caso di associazione non valido.', 'link');
  }

  return { itineraryId: itineraryId!, suitcaseId };
};
