-- ==========================================
-- WF-02 STEP-3 — Feature Flag AI Guest
-- Date: 2026-07-22
-- Adds feature.ai.guest (+ message template) for unauthenticated guest users.
-- AI Utente remains for registered non-admin users only.
-- ==========================================

BEGIN;

INSERT INTO public.platform_feature_flags (
    key, category, label, value_type, default_value,
    supports_schedule, supports_audience, manual_override, message_key
) VALUES (
    'feature.ai.guest',
    'ai',
    'AI Guest',
    'boolean',
    'true'::jsonb,
    true,
    true,
    NULL,
    'ai_disabled_guest'
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.system_messages (key, type, label, title_template, body_template, device_target, updated_at)
SELECT
    'ai_disabled_guest',
    'internal',
    'AI disabilitata (guest)',
    'AI non disponibile',
    'I servizi AI per gli utenti guest sono temporaneamente disattivati.',
    'all',
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.system_messages WHERE key = 'ai_disabled_guest'
);

COMMIT;
