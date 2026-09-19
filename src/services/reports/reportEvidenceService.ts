import { supabase } from '../supabaseClient';

const EVIDENCE_BUCKET = 'report-evidence';

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session?.access_token) {
    throw new Error('Sessione richiesta per cattura evidenza.');
  }
  return session.access_token;
}

/**
 * Avvia cattura evidenza immutabile via API server.
 * Il server risolve la sorgente dallo snapshot del report — nessuna URL client-side.
 */
export async function captureReportEvidence(reportId: string): Promise<void> {
  const token = await getAccessToken();
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reports/capture-evidence`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reportId }),
  });

  const payload = (await response.json()) as { success?: boolean; error?: string };
  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? 'Cattura evidenza non riuscita.');
  }
}

/** @deprecated Usare captureReportEvidence(reportId) — mantenuto per compatibilità call-site in migrazione. */
export async function captureReportEvidenceFromUrl(
  reportId: string,
  _sourceUrl: string,
  _entityType: string,
  _entityId: string,
): Promise<void> {
  return captureReportEvidence(reportId);
}

export async function getReportEvidenceSignedUrl(
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error) throw error;
  return data?.signedUrl ?? null;
}

export { EVIDENCE_BUCKET };
