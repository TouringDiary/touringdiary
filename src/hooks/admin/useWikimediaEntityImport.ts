import { useCallback, useState } from 'react';
import {
  buildManualWikimediaProposalsForPoi,
  importWikimediaProposalForPoi,
  type WikimediaManualDiscoveryResult,
} from '../../services/poi/poiRealImageDiscoveryService';
import type { WikimediaStorageObjectFacts } from '../../services/wikimedia/commonsDownloadPipeline';
import type { WikidataP18Proposal } from '../../services/wikimedia/wikidataLookupService';

export type WikimediaStorageDecisionState = {
  proposal: WikidataP18Proposal;
  decision: 'identical' | 'different';
  existing: WikimediaStorageObjectFacts;
  incoming: WikimediaStorageObjectFacts;
};

export function useWikimediaEntityImport(poiId: string, cityId: string, cityName?: string | null) {
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discovery, setDiscovery] = useState<WikimediaManualDiscoveryResult | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [sessionImportMessages, setSessionImportMessages] = useState<Record<string, string>>({});
  const [storageDecision, setStorageDecision] = useState<WikimediaStorageDecisionState | null>(
    null,
  );

  const discover = useCallback(async () => {
    const trimmedPoi = poiId.trim();
    const trimmedCity = cityId.trim();
    if (!trimmedPoi || !trimmedCity) {
      setError('Salva il POI prima di usare API WIKIMEDIA.');
      return null;
    }
    setLoading(true);
    setError(null);
    setImportMessage(null);
    try {
      const result = await buildManualWikimediaProposalsForPoi(
        trimmedPoi,
        trimmedCity,
        cityName ?? null,
      );
      setDiscovery(result);
      if (result.error && result.proposals.length === 0) {
        setError(result.error);
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ricerca Wikimedia fallita.';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [cityId, cityName, poiId]);

  const applyImportOutcome = useCallback(
    (
      proposal: WikidataP18Proposal,
      outcome: Awaited<ReturnType<typeof importWikimediaProposalForPoi>>,
      keepDecisionOnFailure = false,
    ) => {
      if (outcome.ok === 'storage_decision') {
        setStorageDecision({
          proposal,
          decision: outcome.decision,
          existing: outcome.existing,
          incoming: outcome.incoming,
        });
        return outcome;
      }
      if (outcome.ok === false) {
        setError(`${outcome.stage}: ${outcome.message}`);
        if (!keepDecisionOnFailure) setStorageDecision(null);
        return outcome;
      }
      setStorageDecision(null);
      setImportMessage(outcome.message);
      setSessionImportMessages((current) => ({
        ...current,
        [proposal.qid]: outcome.message,
      }));
      return outcome;
    },
    [],
  );

  const importProposal = useCallback(
    async (proposal: WikidataP18Proposal) => {
      const trimmedPoi = poiId.trim();
      const trimmedCity = cityId.trim();
      if (!trimmedPoi || !trimmedCity) {
        const outcome = {
          ok: false as const,
          stage: 'input',
          message: 'POI non salvato.',
        };
        setError(`${outcome.stage}: ${outcome.message}`);
        return outcome;
      }
      setProcessing(true);
      setError(null);
      setImportMessage(null);
      try {
        const outcome = await importWikimediaProposalForPoi(trimmedPoi, trimmedCity, proposal);
        return applyImportOutcome(proposal, outcome);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Import Wikimedia fallito.';
        setError(message);
        return { ok: false as const, stage: 'import', message };
      } finally {
        setProcessing(false);
      }
    },
    [applyImportOutcome, cityId, poiId],
  );

  const resolveStorageDecision = useCallback(
    async (resolution: 'reuse_existing' | 'import_new') => {
      const pending = storageDecision;
      const trimmedPoi = poiId.trim();
      const trimmedCity = cityId.trim();
      if (!pending || !trimmedPoi || !trimmedCity) return;
      setProcessing(true);
      setError(null);
      try {
        const outcome = await importWikimediaProposalForPoi(
          trimmedPoi,
          trimmedCity,
          pending.proposal,
          resolution,
        );
        return applyImportOutcome(pending.proposal, outcome, true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Import Wikimedia fallito.';
        setError(message);
        return { ok: false as const, stage: 'import', message };
      } finally {
        setProcessing(false);
      }
    },
    [applyImportOutcome, cityId, poiId, storageDecision],
  );

  const dismissStorageDecision = useCallback(() => {
    setStorageDecision(null);
  }, []);

  const dismissProposal = useCallback((qid: string) => {
    const trimmed = qid.trim();
    if (!trimmed) return;
    setDiscovery((current) => {
      if (!current) return current;
      return {
        ...current,
        proposals: current.proposals.filter((row) => row.candidate.qid !== trimmed),
      };
    });
  }, []);

  const reset = useCallback(() => {
    setDiscovery(null);
    setError(null);
    setImportMessage(null);
    setSessionImportMessages({});
    setStorageDecision(null);
  }, []);

  return {
    loading,
    processing,
    error,
    discovery,
    importMessage,
    sessionImportMessages,
    storageDecision,
    discover,
    importProposal,
    resolveStorageDecision,
    dismissStorageDecision,
    dismissProposal,
    reset,
  };
}
