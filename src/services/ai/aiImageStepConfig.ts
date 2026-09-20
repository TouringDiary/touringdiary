import type { AssignmentEntityType } from '@/constants/governance';

/** Entità supportate dall'architettura AI comune (§36). */
export type AiImageEntityKind = Extract<AssignmentEntityType, 'city_person' | 'patron' | 'poi'>;

export type AiImageStepChoice = 'yes' | 'no';

/** Default obbligatori D50/D51/D63 — Personaggio SI, Patrono NO, POI NO. */
export const AI_IMAGE_STEP_DEFAULT_BY_ENTITY: Record<AiImageEntityKind, AiImageStepChoice> = {
  city_person: 'yes',
  patron: 'no',
  poi: 'no',
};

export function getDefaultAiImageStepForEntity(entityType: AiImageEntityKind): AiImageStepChoice {
  return AI_IMAGE_STEP_DEFAULT_BY_ENTITY[entityType];
}

export function isAiImageGenerationAllowed(
  entityType: AiImageEntityKind,
  adminChoice: AiImageStepChoice | null | undefined,
): boolean {
  const choice = adminChoice ?? getDefaultAiImageStepForEntity(entityType);
  return choice === 'yes';
}

export const AI_IMAGE_STEP_MODAL_COPY =
  "Se non viene trovata o resa disponibile un'immagine Admin o una fotografia reale verificata, vuoi consentire al sistema di generare un'immagine illustrativa tramite Intelligenza Artificiale?";
