-- ==========================================
-- WF-02 STEP-3 — Repurpose feature.moderation.community_posts → Q&A Local
-- Date: 2026-07-22
-- Key invariata. Label CC + message template aggiornati.
-- Dominio fotografico: solo feature.moderation.photos (codice app).
-- ==========================================

BEGIN;

UPDATE public.platform_feature_flags
SET
    label = 'Q&A Local',
    updated_at = now()
WHERE key = 'feature.moderation.community_posts';

UPDATE public.system_messages
SET
    label = 'Q&A Local sospeso',
    title_template = 'Q&A Local sospeso',
    body_template = 'Le domande e risposte locali sono temporaneamente disabilitate.',
    updated_at = now()
WHERE key = 'moderation_community_posts_paused';

COMMIT;
