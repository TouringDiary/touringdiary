import { useCallback, useState } from 'react';
import {
  buildManualWikimediaProposalsForPoi,
  importWikimediaProposalForPoi,
  type WikimediaManualDiscoveryResult,
} from '../../services/poi/poiRealImageDiscoveryService';
import type { WikidataP18Proposal } from '../../services/wikimedia/wikidataLookupService';

export function useWikimediaEntityImport(poiId: string, cityId: string, cityName?: string | null) {
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discovery, setDiscovery] = useState<WikimediaManualDiscoveryResult | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

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

  const importProposal = useCallback(
    async (proposal: WikidataP18Proposal) => {
      const trimmedPoi = poiId.trim();
      const trimmedCity = cityId.trim();
      if (!trimmedPoi || !trimmedCity) return { ok: false as const, message: 'POI non salvato.' };
      setProcessing(true);
      setError(null);
      setImportMessage(null);
      try {
        const outcome = await importWikimediaProposalForPoi(trimmedPoi, trimmedCity, proposal);
        if (!outcome.ok) {
          setError(outcome.message);
          return outcome;
        }
        setImportMessage(outcome.message);
        return outcome;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Import Wikimedia fallito.';
        setError(message);
        return { ok: false as const, message };
      } finally {
        setProcessing(false);
      }
    },
    [cityId, poiId],
  );

  const reset = useCallback(() => {
    setDiscovery(null);
    setError(null);
    setImportMessage(null);
  }, []);

  return {
    loading,
    processing,
    error,
    discovery,
    importMessage,
    discover,
    importProposal,
    reset,
  };
}
