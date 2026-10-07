-- SOSPESO ADMIN è un blocco globale del file, non uno stato.
-- Non modifica asset_status e non modifica gli assignment.

ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS admin_blocked boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.media_assets.admin_blocked IS
  'Blocco Admin globale del file. true = nascosto in ogni utilizzo. Non cambia assignment_status.';

CREATE OR REPLACE FUNCTION public.guard_admin_blocked_write()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.admin_blocked IS NOT FALSE THEN
      RAISE EXCEPTION 'Un nuovo media asset nasce con admin_blocked = false.';
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.admin_blocked IS NOT DISTINCT FROM OLD.admin_blocked THEN
    RETURN NEW;
  END IF;
  IF current_setting('td.admin_block_write', true) = '1' THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'admin_blocked modificabile solo dalla RPC di blocco Admin.';
END;
$$;

DROP TRIGGER IF EXISTS media_assets_guard_admin_blocked ON public.media_assets;
CREATE TRIGGER media_assets_guard_admin_blocked
  BEFORE INSERT OR UPDATE OF admin_blocked ON public.media_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_admin_blocked_write();

CREATE OR REPLACE FUNCTION public.set_media_asset_admin_block(
  p_media_asset_id uuid,
  p_blocked boolean,
  p_admin_rationale text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid;
  v_asset_status public.image_asset_status;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL OR NOT public.is_td_admin(v_uid) THEN
    RAISE EXCEPTION 'Non autorizzato.';
  END IF;
  IF char_length(trim(COALESCE(p_admin_rationale, ''))) = 0 THEN
    RAISE EXCEPTION 'Motivazione obbligatoria.';
  END IF;

  SELECT asset_status INTO v_asset_status
  FROM public.media_assets
  WHERE id = p_media_asset_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'media_asset non trovato.';
  END IF;

  PERFORM set_config('td.admin_block_write', '1', true);

  UPDATE public.media_assets
  SET admin_blocked = p_blocked, updated_at = now()
  WHERE id = p_media_asset_id;

  PERFORM public.append_entity_image_history(
    'admin_note',
    p_media_asset_id,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    v_asset_status,
    v_asset_status,
    NULL,
    NULL,
    trim(p_admin_rationale),
    false,
    jsonb_build_object(
      'source', 'set_media_asset_admin_block',
      'admin_blocked', p_blocked
    )
  );

  RETURN p_blocked;
END;
$$;

REVOKE ALL ON FUNCTION public.set_media_asset_admin_block(uuid, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_media_asset_admin_block(uuid, boolean, text) TO authenticated;
