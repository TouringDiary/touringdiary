-- Negozio Digitale: invarianti prodotto definitivi (nome, descrizione, immagine, prezzo > 0).
-- Nessuna cancellazione automatica di dati.
-- Pre-check esplicito: se esistono righe incompatibili la migration fallisce con messaggio chiaro.
-- Risolvere manualmente i dati prima di riapplicare (NOT NULL + CHECK).

DO $$
DECLARE
  incompatible_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO incompatible_count
  FROM public.shop_products
  WHERE name IS NULL
     OR btrim(name) = ''
     OR description IS NULL
     OR btrim(description) = ''
     OR image_url IS NULL
     OR btrim(image_url) = ''
     OR price IS NULL
     OR price <= 0;

  IF incompatible_count > 0 THEN
    RAISE EXCEPTION
      'shop_products: % row(s) violate ecommerce invariants (name/description/image_url/price > 0). Resolve incompatible rows manually before applying NOT NULL + CHECK.',
      incompatible_count;
  END IF;
END $$;

ALTER TABLE public.shop_products
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN image_url SET NOT NULL,
  ALTER COLUMN price SET NOT NULL;

ALTER TABLE public.shop_products
  DROP CONSTRAINT IF EXISTS shop_products_ecommerce_invariants;

ALTER TABLE public.shop_products
  ADD CONSTRAINT shop_products_ecommerce_invariants
  CHECK (
    btrim(name) <> ''
    AND btrim(description) <> ''
    AND btrim(image_url) <> ''
    AND price > 0
  );

COMMENT ON CONSTRAINT shop_products_ecommerce_invariants ON public.shop_products IS
  'Negozio Digitale: nome, descrizione, immagine e prezzo > 0 obbligatori.';
