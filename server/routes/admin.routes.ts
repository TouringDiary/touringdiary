import { Router } from 'express';
import { supabaseAdmin } from '../supabaseAdmin';

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

export default router;