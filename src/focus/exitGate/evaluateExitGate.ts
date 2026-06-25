import type { DocumentSavePhase } from '@/domain/save/documentSaveTypes';
import { getDocumentExitGates, type ExitIntent } from './documentExitRegistry';

export type { ExitIntent };

export type ExitResolution = 'proceed' | 'cancelled' | 'needs_confirm';

export interface ExitGateDecision {
  resolution: ExitResolution;
  /** Gates that blocked or need user confirmation */
  blockingPhases: Array<{ id: string; label: string; phase: DocumentSavePhase }>;
}

/**
 * Evaluates whether an app exit can proceed immediately.
 * Does NOT show UI — callers show UnsavedChangesModal when resolution is needs_confirm.
 */
export async function evaluateExitGate(intent: ExitIntent): Promise<ExitGateDecision> {
  const gates = getDocumentExitGates();
  const blocking: ExitGateDecision['blockingPhases'] = [];

  for (const gate of gates) {
    await gate.awaitInFlight();
    let phase = gate.getPhase();
    if (phase === 'saving') {
      await gate.awaitInFlight();
      phase = gate.getPhase();
    }
    if (phase === 'synced' || phase === 'never_saved') continue;
    blocking.push({ id: gate.id, label: gate.label, phase: gate.getPhase() });
  }

  if (blocking.length === 0) {
    return { resolution: 'proceed', blockingPhases: [] };
  }

  const hasError = blocking.some((b) => b.phase === 'error');
  const hasDirty = blocking.some((b) => b.phase === 'dirty');

  if (hasError || hasDirty) {
    return { resolution: 'needs_confirm', blockingPhases: blocking };
  }

  return { resolution: 'proceed', blockingPhases: blocking };
}

/**
 * Attempts flush-then-exit for dirty synced documents (autosave path).
 */
export async function flushAllDocumentsForExit(): Promise<boolean> {
  const gates = getDocumentExitGates();
  for (const gate of gates) {
    const phase = gate.getPhase();
    if (phase === 'dirty' && !gate.isGuest) {
      const result = await gate.flush();
      if (result === null && gate.getPhase() === 'error') {
        return false;
      }
    }
  }
  return true;
}
