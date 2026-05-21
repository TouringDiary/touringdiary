import { Router } from 'express';
import { supabaseAdmin } from '../supabaseAdmin';

const router = Router();

// GET CURRENT USER PROFILE (Bypass RLS using Service Role)
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: "No authorization header" });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: "No token provided" });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, error: "Supabase Admin not initialized" });
    }

    // 1. Get user from token (Validates JWT)
    console.log("[api/user/me] Verifying token...");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error("[api/user/me] Auth Error:", authError);
      return res.status(401).json({ success: false, error: authError?.message || "Invalid token" });
    }

    console.log(`[api/user/me] Token valid for userId: ${user.id}`);

    // 2. Fetch profile with service role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[api/user/me] Profile Error:", profileError);
      return res.status(500).json({ success: false, error: "Failed to fetch profile" });
    }

    if (!profile) {
      console.warn(`[api/user/me] Profile not found for userId: ${user.id}. Check RLS or profile creation.`);
      return res.status(404).json({ success: false, error: "Profile not found" });
    }

    console.log(`[api/user/me] Profile found: ${profile.name} (${profile.role})`);
    res.json({ success: true, user: profile });

  } catch (e: any) {
    console.error("[api/user/me] Crash:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
