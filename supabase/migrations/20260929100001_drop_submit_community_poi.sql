-- Fase 2 D-CONS-36 — rimuove RPC orphan submit_community_poi (flusso attivo = suggestions)

DROP FUNCTION IF EXISTS public.submit_community_poi(
  text,
  text,
  text,
  text,
  jsonb
);
