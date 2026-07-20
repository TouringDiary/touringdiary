-- MSG-SOT (DL-P13): seed Message Template DB + message_key su flag che ne erano privi.
-- Catalogo TS resta solo bootstrap/seed editor — SoT runtime = system_messages.

INSERT INTO public.system_messages (key, type, label, title_template, body_template, device_target, updated_at)
VALUES
  (
    'ai_disabled_user',
    'internal',
    'AI disabilitata (utente)',
    'AI non disponibile',
    'I servizi AI per gli utenti sono temporaneamente disattivati.',
    'all',
    now()
  ),
  (
    'ai_disabled_admin',
    'internal',
    'AI disabilitata (admin all)',
    'AI admin sospesa',
    'Gli strumenti AI per Admin All sono temporaneamente disattivati.',
    'all',
    now()
  ),
  (
    'ai_disabled_admin_limited',
    'internal',
    'AI disabilitata (admin limited)',
    'AI admin limitata sospesa',
    'Gli strumenti AI per Admin Limited sono temporaneamente disattivati.',
    'all',
    now()
  ),
  (
    'ai_emergency_notice',
    'internal',
    'Stop emergenza AI',
    'Emergenza AI',
    'I servizi AI sono sospesi per emergenza operativa.',
    'all',
    now()
  ),
  (
    'ai_maintenance_notice',
    'internal',
    'AI in manutenzione (ACC)',
    'Manutenzione AI',
    'I servizi AI sono temporaneamente disattivati per manutenzione.',
    'all',
    now()
  ),
  (
    'credits_purchase_paused',
    'internal',
    'Acquisto crediti in pausa',
    'Acquisto crediti sospeso',
    'L’acquisto di crediti AI è temporaneamente non disponibile.',
    'all',
    now()
  ),
  (
    'subscriptions_paused',
    'internal',
    'Abbonamenti premium in pausa',
    'Abbonamenti sospesi',
    'L’upgrade agli abbonamenti premium non è temporaneamente disponibile.',
    'all',
    now()
  ),
  (
    'comms_partner_chat_disabled',
    'internal',
    'Chat Admin↔Partner disabilitata',
    'Chat non disponibile',
    'La messaggistica Admin↔Partner è temporaneamente disabilitata.',
    'all',
    now()
  ),
  (
    'comms_user_sponsor_disabled',
    'internal',
    'Chat Utente↔Sponsor disabilitata',
    'Chat non disponibile',
    'La chat Utente↔Sponsor non è ancora attiva.',
    'all',
    now()
  ),
  (
    'comms_notifications_paused',
    'internal',
    'Notifiche in-app sospese',
    'Notifiche sospese',
    'Il centro notifiche in-app è temporaneamente non disponibile.',
    'all',
    now()
  ),
  (
    'sponsor_applications_paused',
    'internal',
    'Candidature Sponsor sospese',
    'Candidature sospese',
    'Le nuove candidature Sponsor sono temporaneamente sospese. Riprova più tardi.',
    'all',
    now()
  ),
  (
    'moderation_reviews_paused',
    'internal',
    'Recensioni sospese',
    'Recensioni sospese',
    'L’invio di nuove recensioni è temporaneamente disabilitato.',
    'all',
    now()
  ),
  (
    'moderation_photos_paused',
    'internal',
    'Upload foto sospeso',
    'Caricamento foto sospeso',
    'Il caricamento foto è temporaneamente disabilitato.',
    'all',
    now()
  ),
  (
    'moderation_suggestions_paused',
    'internal',
    'Segnalazioni sospese',
    'Segnalazioni sospese',
    'Le segnalazioni sono temporaneamente disabilitate.',
    'all',
    now()
  ),
  (
    'moderation_community_posts_paused',
    'internal',
    'Post community sospesi',
    'Post community sospesi',
    'I post community sono temporaneamente disabilitati.',
    'all',
    now()
  ),
  (
    'maintenance_ticker_message',
    'internal',
    'Messaggio manutenzione (News Bar)',
    'Manutenzione',
    'Piattaforma in manutenzione programmata. Alcune funzioni possono essere limitate.',
    'all',
    now()
  ),
  (
    'registration_closed',
    'internal',
    'Registrazione chiusa',
    'Registrazioni chiuse',
    'Le nuove registrazioni sono temporaneamente sospese.',
    'all',
    now()
  ),
  (
    'sponsor_crm_disclosure',
    'internal',
    'Disclosure CRM Sponsor (D18)',
    'Privacy conversazioni CRM',
    'Le conversazioni CRM tra Admin e Partner possono essere consultate dagli amministratori della piattaforma per finalità di supporto e moderazione.',
    'all',
    now()
  )
ON CONFLICT (key) DO NOTHING;

-- Collega message_key ai flag che ne erano privi
UPDATE public.platform_feature_flags
SET message_key = 'comms_notifications_paused',
    updated_at = now()
WHERE key = 'feature.comms.notifications'
  AND (message_key IS NULL OR message_key = '');

UPDATE public.platform_feature_flags
SET message_key = 'moderation_photos_paused',
    updated_at = now()
WHERE key = 'feature.moderation.photos'
  AND (message_key IS NULL OR message_key = '');

UPDATE public.platform_feature_flags
SET message_key = 'moderation_suggestions_paused',
    updated_at = now()
WHERE key = 'feature.moderation.suggestions'
  AND (message_key IS NULL OR message_key = '');

UPDATE public.platform_feature_flags
SET message_key = 'moderation_community_posts_paused',
    updated_at = now()
WHERE key = 'feature.moderation.community_posts'
  AND (message_key IS NULL OR message_key = '');
