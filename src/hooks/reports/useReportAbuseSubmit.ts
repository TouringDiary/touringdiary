import { useCallback, useState } from 'react';
import type {
  ContentReportEntityType,
  ContentReportReason,
  ContentReportSourceContext,
} from '@/constants/governance';
import {
  getVerifiedGuestReporterEmail,
  sendGuestReportOtp,
  verifyGuestReportOtp,
} from '@/services/auth/guestOtpService';
import { submitContentReportGroup } from '@/services/reports/contentReportService';
import { captureReportEvidence } from '@/services/reports/reportEvidenceService';
import { supabase } from '@/services/supabaseClient';
import type { User } from '@/types/users';

export type ReportAbuseTarget = {
  entityType: ContentReportEntityType;
  entityId: string;
  cityId: string;
  entityName: string;
  imageUrl: string | null;
  storageBucket?: string | null;
  storagePath?: string | null;
  sourceContext: ContentReportSourceContext | null;
  assignmentId?: string | null;
};

/** Target immagine segnalabile: assignment canonico oppure sorgente legacy risolvibile dal RPC §42.15. */
export function hasReportableImageTarget(
  target: Pick<ReportAbuseTarget, 'assignmentId' | 'imageUrl' | 'storageBucket' | 'storagePath'>,
): boolean {
  if (target.assignmentId?.trim()) return true;
  if (target.imageUrl?.trim()) return true;
  const bucket = target.storageBucket?.trim();
  const path = target.storagePath?.trim();
  return Boolean(bucket && path);
}

type SubmitParams = {
  target: ReportAbuseTarget;
  reason: ContentReportReason;
  userNotes: string;
  includeEntityAbuse: boolean;
  includeImageAbuse: boolean;
  user: User | null;
  otpPhase: 'idle' | 'sent' | 'verified';
};

export function useReportAbuseSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = useCallback(async (email: string) => {
    setError(null);
    await sendGuestReportOtp(email);
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    setError(null);
    await verifyGuestReportOtp(email, token);
  }, []);

  const submit = useCallback(async (params: SubmitParams): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const isGuest = !params.user || params.user.role === 'guest';
      let reporterUserName: string | null = null;

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authUser?.id) {
        throw new Error('Autenticazione richiesta.');
      }
      if (!authUser.email_confirmed_at) {
        throw new Error('Email non verificata. Completa la verifica OTP prima di inviare.');
      }

      if (isGuest) {
        if (params.otpPhase !== 'verified') {
          throw new Error('Verifica il codice OTP prima di inviare.');
        }
        const verifiedEmail = await getVerifiedGuestReporterEmail();
        if (!verifiedEmail) {
          throw new Error('Sessione guest non valida dopo verifica OTP.');
        }
      } else {
        reporterUserName = params.user?.name?.trim() || null;
      }

      if (params.includeImageAbuse && !hasReportableImageTarget(params.target)) {
        throw new Error(
          'Immagine non disponibile per la segnalazione foto (manca assignment o sorgente legacy).',
        );
      }

      const result = await submitContentReportGroup({
        cityId: params.target.cityId,
        entityType: params.target.entityType,
        entityId: params.target.entityId,
        entityName: params.target.entityName,
        includeEntityAbuse: params.includeEntityAbuse,
        includeImageAbuse: params.includeImageAbuse,
        reason: params.reason,
        userNotes: params.userNotes,
        reporterUserName,
        sourceContext: params.target.sourceContext,
        imageUrl: params.target.imageUrl,
        storageBucket: params.target.storageBucket ?? null,
        storagePath: params.target.storagePath ?? null,
        assignmentId: params.target.assignmentId ?? null,
      });

      if (params.includeImageAbuse && result.imageReportId) {
        try {
          await captureReportEvidence(result.imageReportId);
        } catch (evidenceErr) {
          const detail =
            evidenceErr instanceof Error
              ? evidenceErr.message
              : 'Acquisizione evidenza non completata.';
          throw new Error(
            `Segnalazione creata (${result.imageReportId}) ma acquisizione evidenza non completata: ${detail}`,
          );
        }
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore invio segnalazione.';
      setError(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    isSubmitting,
    error,
    setError,
    sendOtp,
    verifyOtp,
    submit,
    getVerifiedGuestReporterEmail,
  };
}
