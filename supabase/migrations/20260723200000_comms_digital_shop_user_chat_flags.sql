-- ==========================================
-- Comunicazioni — Chat Negozio Digitale ↔ Utente
-- Date: 2026-07-23
--
-- Due Feature Flag (pattern Admin↔Partner / Partner↔Admin):
--   feature.comms.digital_shop_user  — lato Negozio Digitale (default OFF)
--   feature.comms.user_digital_shop  — lato Utente (default OFF)
--
-- Message OFF + disclosure per-direzione (configurazioni CC distinte).
-- Depreca legacy Info Globali: system_messages.sponsor_crm_disclosure
-- (zero consumer runtime; sostituito dalle disclosure digitali shop).
-- Motore chat NON incluso in questo lotto.
-- ==========================================

BEGIN;

INSERT INTO public.platform_feature_flags (
    key, category, label, value_type, default_value,
    supports_schedule, supports_audience, manual_override, message_key, audit_required
) VALUES
(
    'feature.comms.digital_shop_user',
    'comms',
    'Chat Negozio Digitale↔Utente',
    'boolean',
    'false'::jsonb,
    true,
    true,
    NULL,
    'comms_digital_shop_user_disabled',
    true
),
(
    'feature.comms.user_digital_shop',
    'comms',
    'Chat Utente↔Negozio Digitale',
    'boolean',
    'false'::jsonb,
    true,
    true,
    NULL,
    'comms_user_digital_shop_disabled',
    true
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.system_messages (key, type, label, title_template, body_template, device_target, updated_at)
VALUES
(
    'comms_digital_shop_user_disabled',
    'internal',
    'Chat Negozio Digitale↔Utente disabilitata',
    'Chat non disponibile',
    'La messaggistica del Negozio Digitale verso gli utenti è temporaneamente non disponibile.',
    'all',
    now()
),
(
    'comms_user_digital_shop_disabled',
    'internal',
    'Chat Utente↔Negozio Digitale disabilitata',
    'Chat non disponibile',
    'La messaggistica verso il Negozio Digitale è temporaneamente non disponibile.',
    'all',
    now()
),
(
    'comms_digital_shop_user_disclosure',
    'internal',
    'Disclosure Negozio Digitale↔Utente',
    'Privacy conversazioni Negozio Digitale',
    'Le conversazioni CRM tra Negozio Digitale ed Utente possono essere consultate dagli amministratori della piattaforma per finalità di supporto e moderazione.',
    'all',
    now()
),
(
    'comms_user_digital_shop_disclosure',
    'internal',
    'Disclosure Utente↔Negozio Digitale',
    'Privacy conversazioni Negozio Digitale',
    'Le conversazioni CRM tra Negozio Digitale ed Utente possono essere consultate dagli amministratori della piattaforma per finalità di supporto e moderazione.',
    'all',
    now()
)
ON CONFLICT (key) DO NOTHING;

-- Legacy Info Globali — deprecato (nessun consumer; sostituito dalle disclosure per-direzione)
DELETE FROM public.system_messages
WHERE key = 'sponsor_crm_disclosure';

COMMIT;
