import { Router } from 'express';
import { supabaseAdmin } from '../supabaseAdmin';
import {
  persistCityDetails,
  updateCityStatus,
  patchCityManifestFields,
  patchCityBadge,
  patchCityHomeOrder,
  type CityWritePayload,
  type CityManifestPatch,
} from '../services/cityAdminService';

const router = Router();

router.post("/create-user", async (req, res) => {
  try {
    const { email, password, firstName, lastName, name, role, isTestAccount } = req.body;

    console.log("[AdminCreateUser] Payload ricevuto:", JSON.stringify({ 
      email, 
      hasPassword: !!password, 
      firstName, 
      lastName, 
      name, 
      role 
    }, null, 2));

    // Validazione flessibile: richiediamo email, password e almeno un formato di nome
    const hasName = (firstName && lastName) || name;
    if (!email || !password || !hasName) {
      console.warn("[AdminCreateUser] Validazione fallita: campi mancanti");
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields (email, password, and a name format)" 
      });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, error: "Supabase Admin client not initialized" });
    }

    // Normalizziamo il nome completo
    const safeName = (name || `${firstName} ${lastName}`).trim();

    // 0️⃣ Controllo preventivo: esiste già un profilo con questa email?
    // Può capitare se l'utente Auth è stato rimosso ma il profilo SQL è rimasto (orfano).
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id,email")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      console.warn("[AdminCreateUser] Existing profile detected by email:", existingProfile);
    }

    console.log("[AdminCreateUser] Attempting to create auth user:", email);

    // 1️⃣ Crea utente in Auth con metadata espansi
    const { data: userData, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: safeName,
          firstName,
          lastName,
          role: role || 'user'
        }
      });

    if (createError || !userData?.user) {
      console.error(
        "[AdminCreateUser] Auth Error FULL:",
        JSON.stringify(createError, null, 2)
      );

      // Distinguiamo tra errore 409 (conflitto email) e 500 (trigger/database)
      const isConflict = createError?.status === 409 || createError?.message?.includes("already registered");
      
      return res.status(isConflict ? 409 : 400).json({
        success: false,
        error: createError?.message || "User creation failed"
      });
    }

    const referralCode =
      (safeName.split(' ')[0] + Math.floor(Math.random() * 1000)).toLowerCase();

    console.log("[AdminCreateUser] Creating profile for:", userData.user.id);

    // 2️⃣ Insert profile (safe even if trigger already created it)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: userData.user.id,
          email,
          name: safeName,
          role: role || 'user',
          status: 'active',
          is_test_account: isTestAccount || false,
          referral_code: referralCode,
          xp: 0
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.error("[AdminCreateUser] Profile Error:", profileError);
    }

    console.log(
      `[AdminCreateUser] SUCCESS: Created active user ${email} with ID ${userData.user.id}`
    );

    res.json({
      success: true,
      user: {
        id: userData.user.id,
        email,
        name: safeName
      }
    });

  } catch (e: any) {
    console.error("[AdminCreateUser] Crash:", e);
    res.status(500).json({
      success: false,
      error: e.message
    });
  }
});

/** Aggiornamento stato città (draft / published / needs_check) — evaluate & admin. */
router.patch("/cities/:cityId/status", async (req, res) => {
  try {
    const { cityId } = req.params;
    const { status } = req.body as { status?: string };

    if (!status) {
      return res.status(400).json({ success: false, error: 'Missing status' });
    }

    const data = await updateCityStatus(cityId, status);

    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[Admin] city status crash:', message);
    res.status(500).json({ success: false, error: message });
  }
});

/** Persistenza editor — UPDATE esplicito (INSERT solo se riga assente). */
router.patch("/cities/:cityId/details", async (req, res) => {
  try {
    const { cityId } = req.params;
    const payload = req.body as CityWritePayload;

    const data = await persistCityDetails(cityId, payload);

    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[Admin] city details crash:', message);
    res.status(500).json({ success: false, error: message });
  }
});

/** Aggiornamento minimale manifest (name, zone, status). */
router.patch("/cities/:cityId/manifest", async (req, res) => {
  try {
    const { cityId } = req.params;
    const patch = req.body as CityManifestPatch;

    const data = await patchCityManifestFields(cityId, patch);

    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[Admin] city manifest crash:', message);
    res.status(500).json({ success: false, error: message });
  }
});

/** Aggiornamento special_badge. */
router.patch("/cities/:cityId/badge", async (req, res) => {
  try {
    const { cityId } = req.params;
    const { badge } = req.body as { badge?: string | null };

    const data = await patchCityBadge(cityId, badge ?? null);

    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[Admin] city badge crash:', message);
    res.status(500).json({ success: false, error: message });
  }
});

/** Aggiornamento home_order. */
router.patch("/cities/:cityId/home-order", async (req, res) => {
  try {
    const { cityId } = req.params;
    const { home_order } = req.body as { home_order?: number | null };

    const data = await patchCityHomeOrder(cityId, home_order ?? null);

    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[Admin] city home-order crash:', message);
    res.status(500).json({ success: false, error: message });
  }
});

/** Evita che richieste admin non gestite cadano nel middleware Vite (PATCH/GET pendenti). */
router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Admin route not found: ${req.method} ${req.path}`,
  });
});

export default router;