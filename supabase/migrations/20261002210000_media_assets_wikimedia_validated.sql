-- Flag sull'asset, non un nuovo asset_status.
-- La colonna resta nullable: NULL è il valore delle origini non Wikimedia e delle righe già presenti.
-- Il contratto delle righe nuove è il trigger in 20261002212000:
-- origine non Wikimedia → NULL; nuova Wikimedia → false; true solo dalla RPC Admin.

ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS wikimedia_validated boolean;

COMMENT ON COLUMN public.media_assets.wikimedia_validated IS
  'Validazione Wikimedia dell''asset. NULL se l''origine non è wikimedia. false = DA VALIDARE. true = VALIDATA, solo dalla RPC Admin. Non sostituisce asset_status e non accende il toggle pubblico.';
