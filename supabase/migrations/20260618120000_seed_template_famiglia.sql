-- Template TD Famiglia: abilita Bambini e Animali nel category_setup.
INSERT INTO public.suitcases (id, user_id, title, icon, ui_state, is_user_template)
SELECT
  gen_random_uuid(),
  NULL,
  'Template Famiglia',
  '👨‍👩‍👧',
  jsonb_build_object(
    'hidden_category_ids', '[]'::jsonb,
    'dismissed_category_ids', '[]'::jsonb,
    'category_display_order', '[]'::jsonb,
    'category_setup', jsonb_build_object(
      'clothing', jsonb_build_object('enabled', true, 'seeded', true),
      'hygiene', jsonb_build_object('enabled', true, 'seeded', true),
      'documents', jsonb_build_object('enabled', true, 'seeded', true),
      'electronics', jsonb_build_object('enabled', true, 'seeded', true),
      'meds', jsonb_build_object('enabled', true, 'seeded', true),
      'accessories', jsonb_build_object('enabled', true, 'seeded', true),
      'extra', jsonb_build_object('enabled', true, 'seeded', true),
      'kids', jsonb_build_object('enabled', true, 'seeded', true),
      'pets', jsonb_build_object('enabled', true, 'seeded', true)
    )
  ),
  false
WHERE NOT EXISTS (
  SELECT 1
  FROM public.suitcases
  WHERE user_id IS NULL
    AND title ILIKE 'Template Famiglia'
);

-- Item specifici opzionali (stesso set base di un viaggio urbano familiare).
INSERT INTO public.packing_template_items (template_id, category, name, sort_order, is_active)
SELECT
  s.id,
  v.category,
  v.name,
  v.sort_order,
  true
FROM public.suitcases s
CROSS JOIN (
  VALUES
    ('Accessori', 'Ombrello pieghevole', 10),
    ('Extra', 'Snack per bambini', 20),
    ('Farmaci', 'Termometro digitale', 30),
    ('Animali', 'Tappetino viaggio pet', 40)
) AS v(category, name, sort_order)
WHERE s.user_id IS NULL
  AND s.title ILIKE 'Template Famiglia'
ON CONFLICT (template_id, category, name) DO NOTHING;
