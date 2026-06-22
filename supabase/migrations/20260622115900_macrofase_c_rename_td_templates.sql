-- Macrofase C: rinomina template TD legacy ai titoli canonici del dominio
-- Eseguire prima di macrofase_c_td_templates (M1).

UPDATE public.suitcases
SET title = 'Template Cultura', updated_at = now()
WHERE user_id IS NULL
  AND title ILIKE 'Template Città'
  AND NOT EXISTS (
    SELECT 1 FROM public.suitcases
    WHERE user_id IS NULL AND title ILIKE 'Template Cultura'
  );

UPDATE public.suitcases
SET title = 'Template Business', updated_at = now()
WHERE user_id IS NULL
  AND title ILIKE 'Template Lavoro'
  AND NOT EXISTS (
    SELECT 1 FROM public.suitcases
    WHERE user_id IS NULL AND title ILIKE 'Template Business'
  );
