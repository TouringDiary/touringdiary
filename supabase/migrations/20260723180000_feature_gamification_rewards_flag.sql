-- ==========================================
-- Gamification Freeze — feature.gamification.rewards
-- Date: 2026-07-23
--
-- ON  = premi catalogo sbloccabili/riscattabili
-- OFF = freeze premi (XP e livelli restano attivi; Export PDF fuori scope)
-- Default OFF: freeze operativo fino a riattivazione esplicita.
-- ==========================================

BEGIN;

INSERT INTO public.platform_feature_flags (
    key, category, label, value_type, default_value,
    supports_schedule, supports_audience, manual_override, message_key, audit_required
) VALUES (
    'feature.gamification.rewards',
    'platform',
    'Premi Gamification',
    'boolean',
    'false'::jsonb,
    true,
    false,
    NULL,
    'gamification_rewards_frozen',
    true
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.system_messages (key, type, label, title_template, body_template, device_target, updated_at)
SELECT
    'gamification_rewards_frozen',
    'internal',
    'Premi Gamification congelati',
    'Premio disponibile prossimamente',
    'Continua ad accumulare XP: quando la Gamification sarà attivata, potrai utilizzare automaticamente tutti i punti già guadagnati.',
    'all',
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.system_messages WHERE key = 'gamification_rewards_frozen'
);

COMMIT;
