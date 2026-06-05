import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'
import { assignCredits } from '../_shared/credits.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) throw new Error('Unauthorized')

    const body = await req.json()
    const { action } = body

    // --- AZIONE: FINALIZE (Solo per MOCK in LOCAL mode) ---
    if (action === 'finalize') {
      const { sessionId } = body
      if (!sessionId) throw new Error('Session ID is required')

      const stripeMode = Deno.env.get('STRIPE_MODE') || 'local'
      if (stripeMode !== 'local') {
        throw new Error('Finalize action only available in local mode')
      }

      // Sicurezza: Solo admin possono finalizzare mock
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      const isAdmin = profile?.role === 'admin_all' || profile?.role === 'admin_limited'
      if (!isAdmin) throw new Error('Unauthorized: Admin only')

      // Verifica che sia una sessione mock
      if (!sessionId.startsWith('mock_session_')) {
        throw new Error('Invalid mock session ID')
      }

      // Trova transazione
      const { data: tx, error: txError } = await supabaseAdmin
        .from('credit_transactions')
        .select('*')
        .eq('provider_session_id', sessionId)
        .eq('user_id', user.id)
        .single()

      if (txError || !tx) throw new Error('Transaction not found')
      if (tx.status === 'completed') return new Response(JSON.stringify({ success: true, already_processed: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      // Accredito crediti via logica condivisa
      await assignCredits(
        supabaseAdmin,
        user.id,
        tx.flash_credits_assigned ?? 0,
        tx.pro_credits_assigned ?? 0,
        tx.id,
        sessionId
      )

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- AZIONE DEFAULT: CREATE CHECKOUT SESSION ---
    const { packageId, origin } = body
    if (!packageId) throw new Error('Package ID is required')
    if (!origin) throw new Error('Origin is required')

    const { data: pkg, error: pkgError } = await supabaseClient
      .from('extra_credit_packages')
      .select('*')
      .eq('id', packageId)
      .single()

    if (pkgError || !pkg) throw new Error('Package not found')

    const stripeMode = Deno.env.get('STRIPE_MODE') || 'local'

    // Safety Rule per LOCAL mode
    if (stripeMode === 'local') {
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
        
        const isAdmin = profile?.role === 'admin_all' || profile?.role === 'admin_limited'
        if (!isAdmin) throw new Error('LOCAL_MODE_DISABLED_FOR_PUBLIC')
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const stripe = new Stripe(stripeKey || '', {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    if (stripeMode === 'local') {
      const { data: tx, error: txError } = await supabaseAdmin
        .from('credit_transactions')
        .insert({
         user_id: user.id,
         package_id: pkg.id,
         amount_eur: pkg.price_eur,
         status: 'pending',
         provider_session_id: 'mock_session_' + crypto.randomUUID(),
         flash_credits_assigned: pkg.flash_credits,
         pro_credits_assigned: pkg.pro_credits
       })
       .select()
       .single()

       if (txError || !tx) throw new Error('Failed to create transaction')

       return new Response(
         JSON.stringify({ 
           checkoutUrl: `${origin}/checkout-success?session_id=${tx.provider_session_id}&mock=true`,
           mode: 'local'
         }),
         { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       )
    }

    const priceId = stripeMode === 'prod' ? pkg.stripe_price_id_prod : pkg.stripe_price_id_test
    if (!priceId) throw new Error(`Stripe Price ID missing for mode: ${stripeMode}`)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      success_url: `${origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/buy-credits`,
      client_reference_id: user.id,
      metadata: { package_id: pkg.id, user_id: user.id }
    })

    await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        package_id: pkg.id,
        amount_eur: pkg.price_eur,
        status: 'pending',
        provider_session_id: session.id,
        flash_credits_assigned: pkg.flash_credits,
        pro_credits_assigned: pkg.pro_credits
      })

    return new Response(
      JSON.stringify({ checkoutUrl: session.url, mode: stripeMode }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
