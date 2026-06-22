-- Macrofase C: seed city_template_map

DELETE FROM public.city_template_map
WHERE city_type IN ('mare', 'lago', 'laghi_fiumi', 'montagna', 'cultura', 'business', 'weekend', 'famiglia');


INSERT INTO public.city_template_map (city_type, template_id, priority)
SELECT 'mare', s.id, 0
FROM public.suitcases s
WHERE s.user_id IS NULL AND s.title ILIKE 'Template Mare';

INSERT INTO public.city_template_map (city_type, template_id, priority)
SELECT 'lago', s.id, 0
FROM public.suitcases s
WHERE s.user_id IS NULL AND s.title ILIKE 'Template Fiumi & Laghi';

INSERT INTO public.city_template_map (city_type, template_id, priority)
SELECT 'laghi_fiumi', s.id, 0
FROM public.suitcases s
WHERE s.user_id IS NULL AND s.title ILIKE 'Template Fiumi & Laghi';

INSERT INTO public.city_template_map (city_type, template_id, priority)
SELECT 'montagna', s.id, 0
FROM public.suitcases s
WHERE s.user_id IS NULL AND s.title ILIKE 'Template Montagna';

INSERT INTO public.city_template_map (city_type, template_id, priority)
SELECT 'cultura', s.id, 0
FROM public.suitcases s
WHERE s.user_id IS NULL AND s.title ILIKE 'Template Cultura';

INSERT INTO public.city_template_map (city_type, template_id, priority)
SELECT 'business', s.id, 0
FROM public.suitcases s
WHERE s.user_id IS NULL AND s.title ILIKE 'Template Business';

INSERT INTO public.city_template_map (city_type, template_id, priority)
SELECT 'weekend', s.id, 0
FROM public.suitcases s
WHERE s.user_id IS NULL AND s.title ILIKE 'Template Weekend';

INSERT INTO public.city_template_map (city_type, template_id, priority)
SELECT 'famiglia', s.id, 0
FROM public.suitcases s
WHERE s.user_id IS NULL AND s.title ILIKE 'Template Famiglia';
