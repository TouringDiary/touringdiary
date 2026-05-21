import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const body = await req.json()
    const { packageId } = body

    if (!packageId) throw new Error('Package ID is required')

    // 1. Lettura pacchetto crediti
    const { data: pkg, error: pkgError } = await supabaseClient
      .from('extra_credit_packages')
      .select('*')
      .eq('id', packageId)
      .single()

    if (pkgError || !pkg) throw new Error('Package not found')

    // 2. Determinazione Ambiente Stripe
    const stripeMode = Deno.env.get('STRIPE_MODE') || 'local'

    // 2.1 Safety Rule per LOCAL mode
    if (stripeMode === 'local') {
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
        
        const isAdmin = profile?.role === 'admin_all' || profile?.role === 'admin_limited'
        if (!isAdmin) {
            throw new Error('LOCAL_MODE_DISABLED_FOR_PUBLIC')
        }
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const stripe = new Stripe(stripeKey || '', {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // 3. Logica LOCAL (Bypass Stripe)
    if (stripeMode === 'local') {
      console.log("[STRIPE LOCAL] Simulating checkout for package:", pkg.name)
      
      // Creiamo transazione fittizia
      const { data: tx } = await supabaseClient
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

      return new Response(
        JSON.stringify({ 
          checkoutUrl: `${Deno.env.get('FRONTEND_URL')}/checkout-success?session_id=${tx.provider_session_id}&mock=true`,
          mode: 'local'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Creazione Stripe Checkout Session (TEST/PROD)
    const priceId = stripeMode === 'prod' ? pkg.stripe_price_id_prod : pkg.stripe_price_id_test
    
    if (!priceId && stripeMode !== 'local') {
      throw new Error(`Stripe Price ID missing for mode: ${stripeMode}`)
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${Deno.env.get('FRONTEND_URL')}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('FRONTEND_URL')}/buy-credits`,
      client_reference_id: user.id,
      metadata: {
        package_id: pkg.id,
        user_id: user.id
      }
    })

    // 5. Salvataggio transazione pending
    await supabaseClient
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
