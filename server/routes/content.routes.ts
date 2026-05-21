import { Router } from 'express';
import { supabaseAdmin } from '../supabaseAdmin';

const router = Router();

// PARTNER INTEGRATIONS ENDPOINT
router.get("/partner-integrations", async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, error: "Supabase Admin client not initialized" });
    }

    const { data, error } = await supabaseAdmin
      .from('global_settings')
      .select('value')
      .eq('key', 'partner_integrations')
      .single();

    if (error) {
      console.error("[PartnerIntegrations] Fetch Error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    const rawData = (data as any)?.value || {};

    let responseData = rawData;
    if (Array.isArray(rawData)) {
      responseData = rawData.reduce((acc: any, partner: any) => {
        if (partner && partner.id) {
          acc[partner.id] = partner;
        }
        return acc;
      }, {});
    }

    res.setHeader("Cache-Control", "no-store");
    res.json(responseData);

  } catch (e: any) {
    console.error("[PartnerIntegrations] Crash:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// CONTENT BOOTSTRAP ENDPOINT
router.get("/bootstrap/content", async (req, res) => {
  console.log("[Bootstrap-Content] Richiesta da:", req.headers.origin);
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, error: "Supabase Admin client not initialized" });
    }

    const [tickerRes, tickerConfigRes, tipsRes] = await Promise.all([
      supabaseAdmin.from('news_ticker').select('*').order('order_index', { ascending: true }),
      supabaseAdmin.from('global_settings').select('value').eq('key', 'ticker_config').maybeSingle(),
      supabaseAdmin.from('loading_tips').select('*').order('order_index', { ascending: true })
    ]);

    console.log(`[Bootstrap-Content] Ticker: ${tickerRes.data?.length}, Tips: ${tipsRes.data?.length}`);
    res.setHeader("Cache-Control", "no-store");
    res.json({
      success: true,
      ticker: tickerRes.data || [],
      tickerConfig: (tickerConfigRes.data as any)?.value || null,
      loadingTips: tipsRes.data || []
    });

  } catch (error: any) {
    console.error("[Bootstrap-Content] Errore:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
