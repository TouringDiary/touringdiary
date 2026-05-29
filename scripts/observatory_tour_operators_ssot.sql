-- Observatory Tour Operator SSOT — SQL Editor helper
-- Full migration: supabase/migrations/20260529183000_observatory_tour_operators_ssot.sql

-- PRE-FLIGHT
SELECT COUNT(*) AS legacy_city_services_tour_ops
FROM public.city_services
WHERE type IN ('tour_operator', 'agency');

-- POST-FLIGHT (run after migration)
SELECT COUNT(*) AS legacy_city_services_tour_ops
FROM public.city_services
WHERE type IN ('tour_operator', 'agency');

SELECT
  s.city_name,
  s.tour_ops_count AS rpc_tour_ops,
  (
    SELECT count(*)::int
    FROM public.city_tour_operators cto
    WHERE cto.city_id = s.city_id
  ) AS db_tour_ops
FROM public.get_detailed_city_stats() s
WHERE s.tour_ops_count <> (
  SELECT count(*)::int
  FROM public.city_tour_operators cto
  WHERE cto.city_id = s.city_id
);

SELECT city_name, tour_ops_count
FROM public.get_detailed_city_stats()
WHERE tour_ops_count > 0
ORDER BY tour_ops_count DESC, city_name;
