import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'
import { assignCredits } from '../_shared/credits.ts'

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
const stripe = new Stripe(stripeKey || '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const stripeMode = Deno.env.get('STRIPE_MODE') || 'local'

  let event;

  try {
    const body = await req.text()

    // 1. Validazione Signature (Solo in TEST/PROD)
    if (stripeMode !== 'local') {
      if (!signature || !stripeWebhookSecret) throw new Error('Missing stripe signature or secret')
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret)
    } else {
      // In LOCAL accettiamo il body direttamente (simulazione)
      event = JSON.parse(body)
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Handling Evento: checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const sessionId = session.id
      const userId = session.client_reference_id || session.metadata?.user_id

      console.log(`[STRIPE WEBHOOK] Payment completed for session: ${sessionId}, user: ${userId}`)

      // A. Trova la transazione pending
      const { data: tx, error: txError } = await supabaseAdmin
        .from('credit_transactions')
        .select('*')
        .eq('provider_session_id', sessionId)
        .single()

      if (txError || !tx) {
          console.error("Transaction not found for session:", sessionId)
          return new Response('Transaction not found', { status: 404 })
      }

      if (tx.status === 'completed') {
          return new Response('Already processed', { status: 200 })
      }

      // B. Usa logica condivisa per completare transazione e accreditare crediti
      if (!userId) throw new Error('Missing userId in session')

      await assignCredits(
        supabaseAdmin,
        userId,
        tx.flash_credits_assigned ?? 0,
        tx.pro_credits_assigned ?? 0,
        tx.id,
        sessionId
      )

      console.log(`[STRIPE WEBHOOK] Credits assigned successfully to user ${userId}`)
    }

    return new Response(JSON.stringify({ received: true }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
    })

  } catch (err) {
    console.error(`[STRIPE WEBHOOK ERROR] ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})
