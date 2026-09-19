import { supabase } from '../supabaseClient';

export type GuestOtpSendResult = {
  email: string;
};

/**
 * Guest OTP — Supabase Auth nativo (§42.12, D85).
 * Email usata solo per verifica identità segnalante.
 */
export async function sendGuestReportOtp(email: string): Promise<GuestOtpSendResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    throw new Error('Inserisci un indirizzo email valido.');
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: {
      shouldCreateUser: true,
    },
  });
  if (error) throw error;

  return { email: normalized };
}

export async function verifyGuestReportOtp(email: string, token: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const otp = token.trim();
  if (!normalized || !otp) {
    throw new Error('Email e codice OTP obbligatori.');
  }

  const { error } = await supabase.auth.verifyOtp({
    email: normalized,
    token: otp,
    type: 'email',
  });
  if (error) throw error;
}

export async function getVerifiedGuestReporterEmail(): Promise<string | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  return user?.email_confirmed_at ? (user.email ?? null) : null;
}
