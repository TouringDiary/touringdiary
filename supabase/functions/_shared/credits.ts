import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

export async function assignCredits(
  supabaseAdmin: SupabaseClient,
  userId: string,
  flashCredits: number,
  proCredits: number,
  transactionId: string,
  sessionId: string
) {
  // 1. Aggiorna Transazione
  const { error: txError } = await supabaseAdmin
    .from('credit_transactions')
    .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString() 
    })
    .eq('id', transactionId)

  if (txError) throw txError

  // 2. Accredito Crediti (Nuovo pacchetto con scadenza 365gg)
  const { error: creditError } = await supabaseAdmin
    .from('user_ai_credits')
    .insert({
        user_id: userId,
        flash_remaining: flashCredits,
        pro_remaining: proCredits,
        source: 'purchase',
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
            transaction_id: transactionId,
            stripe_session_id: sessionId
        }
    })

  if (creditError) throw creditError

  return { success: true }
}
