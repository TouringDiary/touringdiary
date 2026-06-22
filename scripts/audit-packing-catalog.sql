-- Macrofase C: audit pre/post migration
-- Eseguire in Supabase SQL Editor prima e dopo le migration 20260622120000–20260622120400

-- 1. Template TD
SELECT id, title, icon,
       ui_state->'category_setup'->'kids' AS kids_setup,
       ui_state->'category_setup'->'pets' AS pets_setup
FROM suitcases
WHERE user_id IS NULL
ORDER BY title;

-- 2. Conteggi standard attivi per categoria
SELECT category, COUNT(*) AS n
FROM packing_standard_items
WHERE is_active = true
GROUP BY category
ORDER BY category;

-- 3. Conteggi template items per template
SELECT s.title, COUNT(*) AS n
FROM packing_template_items p
JOIN suitcases s ON s.id = p.template_id
WHERE p.is_active = true
GROUP BY s.title
ORDER BY s.title;

-- 4. Conteggi AI per categoria
SELECT category, COUNT(*) AS n
FROM packing_ai_catalog
WHERE is_active = true
GROUP BY category
ORDER BY category;

-- 5. City template map
SELECT c.city_type, s.title, c.priority
FROM city_template_map c
JOIN suitcases s ON s.id = c.template_id
ORDER BY c.city_type;

-- 6. Totali attesi post-migration
-- standard: 65 | template: 627 | AI: 225 | TD templates: 7 | city_map: 8 righe
