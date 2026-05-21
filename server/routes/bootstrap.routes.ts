import { Router } from 'express';
import { supabaseAdmin } from '../supabaseAdmin';

const router = Router();

// BOOTSTRAP ENDPOINT
router.get("/all", async (req, res) => {
  console.log("[Bootstrap] Inizializzazione richiesta da:", req.headers.origin);
  
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, error: "Supabase Admin client not initialized" });
    }

    const [settingsRes, designRes] = await Promise.all([
      supabaseAdmin.from('global_settings').select('key, value'),
      supabaseAdmin.from('design_system_rules').select('*')
    ]);

    if (settingsRes.error) throw settingsRes.error;
    if (designRes.error) throw designRes.error;

    console.log(`[Bootstrap] Successo: ${settingsRes.data?.length} settings e ${designRes.data?.length} design rules`);

    res.setHeader("Cache-Control", "no-store");
    res.json({
      success: true,
      settings: settingsRes.data || [],
      designSystem: designRes.data || [],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("[Bootstrap] Errore critico:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: "Il client dovrebbe usare il fallback Supabase" 
    });
  }
});

// CITY MANIFEST BOOTSTRAP ENDPOINT
router.get("/cities", async (req, res) => {
  console.log("[Bootstrap-Cities] Richiesta manifest da:", req.headers.origin);
  
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, error: "Supabase Admin client not initialized" });
    }

    const { data, error } = await supabaseAdmin
      .from('seo_city_routes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    if (data && data.length > 0) {
      console.log("[Bootstrap-Cities]", data.length, Object.keys(data[0] || {}));
    }

    console.log(`[Bootstrap-Cities] Manifest inviato: ${data?.length} città (struttura view SEO)`);

    res.setHeader("Cache-Control", "no-store");
    res.json({
      success: true,
      data: data || [],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("[Bootstrap-Cities] Errore manifest:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// SYSTEM MESSAGES BOOTSTRAP ENDPOINT
router.get("/messages", async (req, res) => {
  console.log("[Bootstrap-Messages] Richiesta da:", req.headers.origin);
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, error: "Supabase Admin client not initialized" });
    }

    const { data, error } = await supabaseAdmin
      .from('system_messages')
      .select('*')
      .order('label', { ascending: true });

    if (error) throw error;

    console.log(`[Bootstrap-Messages] Inviati: ${data?.length} messaggi`);
    res.setHeader("Cache-Control", "no-store");
    res.json({ success: true, data: data || [] });

  } catch (error: any) {
    console.error("[Bootstrap-Messages] Errore:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PROFILES BOOTSTRAP ENDPOINT
router.get("/profiles", async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, error: "Supabase Admin client not initialized" });
    }
    const { data, error } = await supabaseAdmin.from('profiles').select('*');
    if (error) throw error;

    // Logging diagnostico richiesto dall'utente
    console.log("[Bootstrap-Profiles] rows:", data?.length);

    res.setHeader("Cache-Control", "no-store");
    res.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error("[Bootstrap-Profiles] Errore:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// LEVELS BOOTSTRAP ENDPOINT
router.get("/levels", async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, error: "Supabase Admin client not initialized" });
    }
    const { data, error } = await supabaseAdmin.from('gamification_levels').select('*').order('level', { ascending: true });
    if (error) throw error;
    res.setHeader("Cache-Control", "no-store");
    res.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error("[Bootstrap-Levels] Errore:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// SPONSORS BOOTSTRAP ENDPOINT
router.get("/sponsors", async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, error: "Supabase Admin client not initialized" });
    }
    const { data, error } = await supabaseAdmin.from('sponsors').select('*');
    if (error) throw error;
    res.setHeader("Cache-Control", "no-store");
    res.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error("[Bootstrap-Sponsors] Errore:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
