import {
  type ImageAssetStatusDb,
  type ImageVerificationStepOutcomeDb,
  parseImageAssetStatusDb,
} from '@/constants/governance';
import { mf3Rpc } from '@/services/media/mf3DbClient';

export type TransitionMediaAssetStatusInput = {
  mediaAssetId: string;
  targetStatus: ImageAssetStatusDb;
  adminRationale?: string | null;
};

export async function transitionMediaAssetStatus(
  input: TransitionMediaAssetStatusInput,
): Promise<ImageAssetStatusDb> {
  const { data, error } = await mf3Rpc<string>('transition_media_asset_status', {
    p_media_asset_id: input.mediaAssetId,
    p_target_status: input.targetStatus,
    p_admin_rationale: input.adminRationale?.trim() ?? null,
  });

  if (error) {
    throw new Error(`Transizione stato asset fallita: ${error.message}`);
  }
  if (typeof data !== 'string') {
    throw new Error('Transizione stato asset: risposta RPC non valida.');
  }
  return parseImageAssetStatusDb(data);
}

export async function markMediaAssetVerifyAiQueue(
  mediaAssetId: string,
  aiSummary: string,
  steps: Array<{
    stepCode: string;
    stepOrder: number;
    outcome: ImageVerificationStepOutcomeDb;
    aiRationale?: string;
  }>,
): Promise<string> {
  const { data, error } = await mf3Rpc<string>('record_image_verification_run', {
    p_media_asset_id: mediaAssetId,
    p_ai_summary: aiSummary,
    p_mark_verify_queue: true,
    p_steps: steps.map((s) => ({
      step_code: s.stepCode,
      step_order: s.stepOrder,
      outcome: s.outcome,
      ai_rationale: s.aiRationale ?? null,
    })),
  });

  if (error) {
    throw new Error(`Registrazione pipeline verifica fallita: ${error.message}`);
  }
  if (typeof data !== 'string' || data.trim().length === 0) {
    throw new Error('Registrazione pipeline verifica: run id assente.');
  }
  return data;
}

export type AiVerifyAdminDecision = 'approve' | 'reject' | 'override_approve';

export async function completeAiVerifyAdminDecision(input: {
  mediaAssetId: string;
  decision: AiVerifyAdminDecision;
  adminRationale: string;
  overrideStepCode?: string | null;
}): Promise<ImageAssetStatusDb> {
  const { data, error } = await mf3Rpc<string>('complete_ai_verify_admin_decision', {
    p_media_asset_id: input.mediaAssetId,
    p_decision: input.decision,
    p_admin_rationale: input.adminRationale.trim(),
    p_override_step_code: input.overrideStepCode?.trim() ?? null,
  });

  if (error) {
    throw new Error(`Decisione Admin coda verify fallita: ${error.message}`);
  }
  if (typeof data !== 'string') {
    throw new Error('Decisione Admin coda verify: risposta RPC non valida.');
  }
  return parseImageAssetStatusDb(data);
}
