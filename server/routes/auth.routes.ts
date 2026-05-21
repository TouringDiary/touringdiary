import { Router } from 'express';
import { supabaseAdmin, supabaseClient } from '../supabaseAdmin';

const router = Router();

// DEV LOGIN ENDPOINT (Bypass password via Service Role & OTP)
// ACCESSIBILE SOLO IN DEVELOPMENT
if (process.env.NODE_ENV !== "production") {
  router.post("/login", async (req, res) => {
    try {
      const { email } = req.body;
      console.log("[AuthRoutes] Received dev/login request for:", email);

      if (!email) {
        return res.status(400).json({ success: false, error: "Email is required" });
      }

      if (!supabaseAdmin) {
        console.error("[devLogin] ERRORE: SUPABASE_SERVICE_ROLE_KEY non trovata.");
        return res.status(500).json({ success: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY." });
      }

      // 1. Verifica preventiva (limitata alla prima pagina di listUsers)
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const userInPage1 = users.find(u => u.email === email);

      if (!userInPage1) {
        console.log(`[devLogin] Utente ${email} non trovato in pagina 1, verifico/creo...`);
        // 2. Crea utente auth: se esiste già (es. in pagina 2), l'errore sarà ignorato.
        const { data: createdData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true
        });

        if (createError && createError.code !== "email_exists" && !createError.message.includes("Database error")) {
          console.error("[devLogin] Errore creazione utente:", createError);
          return res.status(500).json({ success: false, error: createError.message });
        }
        
        console.log(`[devLogin] Stato utente per ${email}: ${createError?.code === "email_exists" ? "Esistente" : "Creato (" + createdData.user?.id + ")"}`);
      }

      // 3. Genera Magic Link (OTP) via Admin
      console.log(`[devLogin] Generazione magiclink per ${email}...`);
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email
      });

      if (linkError || !linkData.properties?.email_otp) {
        console.error(`[devLogin] Link generation error for ${email}:`, linkError);
        const errorMessage = linkError?.message || "Link generation failed";
        return res.status(500).json({ success: false, error: errorMessage });
      }

      // 4. Scambio OTP -> Sessione reale via Anon Client
      const { data: sessionData, error: verifyError } = await supabaseClient.auth.verifyOtp({
        email,
        token: linkData.properties.email_otp,
        type: "magiclink"
      });

      if (verifyError || !sessionData.session) {
        console.error("[devLogin] OTP Verification error:", verifyError);
        return res.status(500).json({ success: false, error: "Verification failed" });
      }

      console.log(`[devLogin] Success: Session obtained for ${email}`);

      // 5. Response compatibile con frontend setSession()
      return res.json({
        success: true,
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        user: sessionData.session.user
      });

    } catch (e: any) {
      console.error("[devLogin] Critical error:", e);
      res.status(500).json({ success: false, error: e.message });
    }
  });
} else {
  // In produzione, se l'endpoint viene chiamato per errore, ritorna 403 Forbidden
  router.post("/login", (req, res) => {
    res.status(403).json({ success: false, error: "Endpoint non disponibile in produzione." });
  });
}

export default router;
