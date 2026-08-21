import { Router } from 'express';
import { supabaseAdmin } from '../supabaseAdmin';

const router = Router();

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type SettingsValueRow = {
  value: Json;
};

type PartnerRecord = {
  id?: string;
  [key: string]: Json | undefined;
};

// PARTNER INTEGRATIONS ENDPOINT
router.get('/partner-integrations', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res
        .status(500)
        .json({ success: false, error: 'Supabase Admin client not initialized' });
    }

    const { data, error } = await supabaseAdmin
      .from('global_settings')
      .select('value')
      .eq('key', 'partner_integrations')
      .single();

    if (error) {
      console.error('[PartnerIntegrations] Fetch Error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    const rawData = (data as SettingsValueRow | null)?.value || {};

    let responseData: Json = rawData;
    if (Array.isArray(rawData)) {
      responseData = rawData.reduce<Record<string, PartnerRecord>>((acc, partner) => {
        const item = partner as PartnerRecord;
        if (item?.id) {
          acc[item.id] = item;
        }
        return acc;
      }, {});
    }

    res.setHeader('Cache-Control', 'no-store');
    res.json(responseData);
  } catch (e: unknown) {
    console.error('[PartnerIntegrations] Crash:', e);
    res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
  }
});

// CONTENT BOOTSTRAP ENDPOINT
router.get('/bootstrap/content', async (req, res) => {
  console.log('[Bootstrap-Content] Richiesta da:', req.headers.origin);
  try {
    if (!supabaseAdmin) {
      return res
        .status(500)
        .json({ success: false, error: 'Supabase Admin client not initialized' });
    }

    const [tickerRes, tickerConfigRes, tipsRes] = await Promise.all([
      supabaseAdmin.from('news_ticker').select('*').order('order_index', { ascending: true }),
      supabaseAdmin
        .from('global_settings')
        .select('value')
        .eq('key', 'ticker_config')
        .maybeSingle(),
      supabaseAdmin.from('loading_tips').select('*').order('order_index', { ascending: true }),
    ]);

    console.log(
      `[Bootstrap-Content] Ticker: ${tickerRes.data?.length}, Tips: ${tipsRes.data?.length}`,
    );
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      success: true,
      ticker: tickerRes.data || [],
      tickerConfig: (tickerConfigRes.data as SettingsValueRow | null)?.value || null,
      loadingTips: tipsRes.data || [],
    });
  } catch (error: unknown) {
    console.error('[Bootstrap-Content] Errore:', error);
    res
      .status(500)
      .json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

export default router;
