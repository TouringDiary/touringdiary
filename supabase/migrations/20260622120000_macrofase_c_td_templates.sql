-- Macrofase C: garantisce 7 template TD con category_setup corretto

INSERT INTO public.suitcases (user_id, title, icon, ui_state, is_user_template)
SELECT
  NULL,
  'Template Mare',
  '🎒',
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
      'kids', jsonb_build_object('enabled', false, 'seeded', false),
      'pets', jsonb_build_object('enabled', false, 'seeded', false)
    )
  ),
  false
WHERE NOT EXISTS (
  SELECT 1 FROM public.suitcases WHERE user_id IS NULL AND title ILIKE 'Template Mare'
);

INSERT INTO public.suitcases (user_id, title, icon, ui_state, is_user_template)
SELECT
  NULL,
  'Template Fiumi & Laghi',
  '🎒',
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
      'kids', jsonb_build_object('enabled', false, 'seeded', false),
      'pets', jsonb_build_object('enabled', false, 'seeded', false)
    )
  ),
  false
WHERE NOT EXISTS (
  SELECT 1 FROM public.suitcases WHERE user_id IS NULL AND title ILIKE 'Template Fiumi & Laghi'
);

INSERT INTO public.suitcases (user_id, title, icon, ui_state, is_user_template)
SELECT
  NULL,
  'Template Montagna',
  '🎒',
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
      'kids', jsonb_build_object('enabled', false, 'seeded', false),
      'pets', jsonb_build_object('enabled', false, 'seeded', false)
    )
  ),
  false
WHERE NOT EXISTS (
  SELECT 1 FROM public.suitcases WHERE user_id IS NULL AND title ILIKE 'Template Montagna'
);

INSERT INTO public.suitcases (user_id, title, icon, ui_state, is_user_template)
SELECT
  NULL,
  'Template Cultura',
  '🎒',
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
      'kids', jsonb_build_object('enabled', false, 'seeded', false),
      'pets', jsonb_build_object('enabled', false, 'seeded', false)
    )
  ),
  false
WHERE NOT EXISTS (
  SELECT 1 FROM public.suitcases WHERE user_id IS NULL AND title ILIKE 'Template Cultura'
);

INSERT INTO public.suitcases (user_id, title, icon, ui_state, is_user_template)
SELECT
  NULL,
  'Template Business',
  '🎒',
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
      'kids', jsonb_build_object('enabled', false, 'seeded', false),
      'pets', jsonb_build_object('enabled', false, 'seeded', false)
    )
  ),
  false
WHERE NOT EXISTS (
  SELECT 1 FROM public.suitcases WHERE user_id IS NULL AND title ILIKE 'Template Business'
);

INSERT INTO public.suitcases (user_id, title, icon, ui_state, is_user_template)
SELECT
  NULL,
  'Template Weekend',
  '🎒',
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
      'kids', jsonb_build_object('enabled', false, 'seeded', false),
      'pets', jsonb_build_object('enabled', false, 'seeded', false)
    )
  ),
  false
WHERE NOT EXISTS (
  SELECT 1 FROM public.suitcases WHERE user_id IS NULL AND title ILIKE 'Template Weekend'
);

INSERT INTO public.suitcases (user_id, title, icon, ui_state, is_user_template)
SELECT
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
  SELECT 1 FROM public.suitcases WHERE user_id IS NULL AND title ILIKE 'Template Famiglia'
);
