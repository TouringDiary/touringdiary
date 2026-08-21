-- WF: Q&A Local — risposte persistenti, follow automatico owner, fan-out notifiche follower.
-- Necessità: community_posts_update_own consente UPDATE solo all'autore → i non-autori
-- non possono appendere a community_posts.replies (jsonb). Serve tabella replies + RPC.
-- Notifiche: nessuna policy INSERT utente su notifications → fan-out in SECURITY DEFINER.
-- Identità autore reply: da public.profiles (name, role), mai dal client.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) community_replies
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts (id) ON DELETE CASCADE,
  parent_reply_id uuid NULL REFERENCES public.community_replies (id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_role text NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_replies_text_not_blank CHECK (char_length(trim(text)) > 0)
);

CREATE INDEX IF NOT EXISTS community_replies_post_id_created_at_idx
  ON public.community_replies (post_id, created_at ASC);

CREATE INDEX IF NOT EXISTS community_replies_parent_reply_id_idx
  ON public.community_replies (parent_reply_id)
  WHERE parent_reply_id IS NOT NULL;

COMMENT ON TABLE public.community_replies IS
  'Risposte Q&A Local. SoT delle replies; community_posts.replies jsonb resta legacy/non scritto.';

ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;

-- Lettura pubblica (come community_posts).
DROP POLICY IF EXISTS community_replies_public_read ON public.community_replies;
CREATE POLICY community_replies_public_read
  ON public.community_replies
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin: SELECT/UPDATE/DELETE solo. Nessun INSERT diretto (write path = RPC).
DROP POLICY IF EXISTS community_replies_admin_all ON public.community_replies;
DROP POLICY IF EXISTS community_replies_admin_select ON public.community_replies;
CREATE POLICY community_replies_admin_select
  ON public.community_replies
  FOR SELECT
  TO authenticated
  USING (public.is_td_admin(auth.uid()));

DROP POLICY IF EXISTS community_replies_admin_update ON public.community_replies;
CREATE POLICY community_replies_admin_update
  ON public.community_replies
  FOR UPDATE
  TO authenticated
  USING (public.is_td_admin(auth.uid()))
  WITH CHECK (public.is_td_admin(auth.uid()));

DROP POLICY IF EXISTS community_replies_admin_delete ON public.community_replies;
CREATE POLICY community_replies_admin_delete
  ON public.community_replies
  FOR DELETE
  TO authenticated
  USING (public.is_td_admin(auth.uid()));

DROP POLICY IF EXISTS community_replies_service_role ON public.community_replies;
CREATE POLICY community_replies_service_role
  ON public.community_replies
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Nessuna policy INSERT per authenticated/anon → INSERT diretto client impossibile (RLS).
-- Default ACL schema (verificato live): anon/authenticated/service_role = arwdDxtm su nuove tabelle
-- (come community_posts). Least privilege esplicito dopo CREATE:
--   anon: SELECT only
--   authenticated: SELECT + UPDATE/DELETE (solo per policy admin is_td_admin)
--   nessun INSERT/TRUNCATE/REFERENCES/TRIGGER per anon|authenticated
-- Unico write path INSERT applicativo = RPC add_community_reply (SECURITY DEFINER).

REVOKE ALL ON TABLE public.community_replies FROM PUBLIC;
REVOKE ALL ON TABLE public.community_replies FROM anon, authenticated;
GRANT SELECT ON TABLE public.community_replies TO anon, authenticated;
GRANT UPDATE, DELETE ON TABLE public.community_replies TO authenticated;
GRANT ALL ON TABLE public.community_replies TO service_role;

-- ---------------------------------------------------------------------------
-- 2) Index fan-out follow su user_interactions
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS user_interactions_target_follow_idx
  ON public.user_interactions (target_id, interaction_type)
  WHERE interaction_type = 'follow';

-- ---------------------------------------------------------------------------
-- 3) Auto-follow owner alla creazione domanda
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_community_post_owner_autofollow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.author_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- NEW.id è l'UUID assegnato dal DEFAULT gen_random_uuid() (o dal client se UUID valido).
  INSERT INTO public.user_interactions (user_id, target_id, target_type, interaction_type)
  VALUES (NEW.author_id, NEW.id::text, 'community_post', 'follow')
  ON CONFLICT (user_id, target_id, interaction_type) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_community_post_owner_autofollow ON public.community_posts;
CREATE TRIGGER on_community_post_owner_autofollow
  AFTER INSERT ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_community_post_owner_autofollow();

REVOKE ALL ON FUNCTION public.trigger_community_post_owner_autofollow() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trigger_community_post_owner_autofollow() FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4) Dopo insert reply: incrementa count + notifica follower (non l'autore reply)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_community_reply_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_city_name text;
BEGIN
  -- Eseguito solo AFTER INSERT riuscito sulla riga reply.
  UPDATE public.community_posts
  SET replies_count = COALESCE(replies_count, 0) + 1
  WHERE id = NEW.post_id;

  SELECT city_name INTO v_city_name
  FROM public.community_posts
  WHERE id = NEW.post_id;

  -- Solo follower attivi (interaction_type = 'follow').
  -- Owner riceve notifica SSE e solo se ha ancora il follow (stessa query).
  -- Autore della reply escluso (ui.user_id IS DISTINCT FROM NEW.author_id).
  -- Una sola esecuzione per INSERT → un destinatario non riceve duplicati per la stessa reply.
  INSERT INTO public.notifications (user_id, type, title, message, date, is_read, link_data)
  SELECT
    ui.user_id::text,
    'reply_qa',
    'Nuova risposta!',
    NEW.author_name || ' ha risposto a una discussione' ||
      CASE
        WHEN v_city_name IS NOT NULL AND length(trim(v_city_name)) > 0
          THEN ' su ' || v_city_name
        ELSE ''
      END,
    now(),
    false,
    jsonb_build_object(
      'section', 'community',
      'tab', 'qa',
      'targetId', NEW.post_id::text
    )
  FROM public.user_interactions ui
  WHERE ui.target_id = NEW.post_id::text
    AND ui.target_type = 'community_post'
    AND ui.interaction_type = 'follow'
    AND ui.user_id IS NOT NULL
    AND ui.user_id IS DISTINCT FROM NEW.author_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_community_reply_created ON public.community_replies;
CREATE TRIGGER on_community_reply_created
  AFTER INSERT ON public.community_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_community_reply_after_insert();

REVOKE ALL ON FUNCTION public.trigger_community_reply_after_insert() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trigger_community_reply_after_insert() FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5) RPC add_community_reply — regole dominio
--    - root reply: vietata all'owner del post
--    - nested reply: parent deve appartenere allo stesso post (profondità illimitata)
--    - author_id / author_name / author_role da auth.uid() + public.profiles
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.add_community_reply(uuid, text, text, text, uuid);

CREATE OR REPLACE FUNCTION public.add_community_reply(
  p_post_id uuid,
  p_text text,
  p_parent_reply_id uuid DEFAULT NULL
)
RETURNS public.community_replies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_post public.community_posts%ROWTYPE;
  v_parent public.community_replies%ROWTYPE;
  v_row public.community_replies%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_text text := trim(COALESCE(p_text, ''));
  v_name text;
  v_role text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '42501';
  END IF;

  IF p_post_id IS NULL OR v_text = '' THEN
    RAISE EXCEPTION 'INVALID_INPUT' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PROFILE_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  v_name := trim(COALESCE(v_profile.name, ''));
  IF v_name = '' THEN
    RAISE EXCEPTION 'PROFILE_NAME_REQUIRED' USING ERRCODE = '22023';
  END IF;

  v_role := NULLIF(trim(COALESCE(v_profile.role, '')), '');

  SELECT * INTO v_post
  FROM public.community_posts
  WHERE id = p_post_id
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'POST_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF p_parent_reply_id IS NULL THEN
    -- Risposta diretta alla domanda: vietata all'owner
    IF v_post.author_id IS NOT DISTINCT FROM v_user_id THEN
      RAISE EXCEPTION 'OWNER_CANNOT_REPLY_TO_OWN_QUESTION' USING ERRCODE = '42501';
    END IF;
  ELSE
    SELECT * INTO v_parent
    FROM public.community_replies
    WHERE id = p_parent_reply_id
    FOR SHARE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PARENT_REPLY_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;

    IF v_parent.post_id IS DISTINCT FROM p_post_id THEN
      RAISE EXCEPTION 'PARENT_REPLY_POST_MISMATCH' USING ERRCODE = '22023';
    END IF;
    -- Nessun limite di profondità: ogni reply può avere figli sullo stesso post.
  END IF;

  INSERT INTO public.community_replies (
    post_id,
    parent_reply_id,
    author_id,
    author_name,
    author_role,
    text
  )
  VALUES (
    p_post_id,
    p_parent_reply_id,
    v_user_id,
    v_name,
    v_role,
    v_text
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.add_community_reply(uuid, text, uuid) IS
  'Inserisce una risposta Q&A Local. Identità da profiles; owner non può rispondere alla root; nesting illimitato sullo stesso post. Fan-out notifiche via trigger.';

REVOKE ALL ON FUNCTION public.add_community_reply(uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_community_reply(uuid, text, uuid) TO authenticated;

COMMIT;
