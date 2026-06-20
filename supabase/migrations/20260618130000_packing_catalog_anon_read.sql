-- Guest / anon: lettura catalogo packing attivo per composizione template TD runtime.
-- Le policy esistenti coprivano solo il ruolo authenticated.

CREATE POLICY "Anon can read active packing standard items"
ON public.packing_standard_items FOR SELECT TO anon
USING (is_active = true);

CREATE POLICY "Anon can read active packing template items"
ON public.packing_template_items FOR SELECT TO anon
USING (is_active = true);

CREATE POLICY "Anon can read active packing ai catalog"
ON public.packing_ai_catalog FOR SELECT TO anon
USING (is_active = true);
