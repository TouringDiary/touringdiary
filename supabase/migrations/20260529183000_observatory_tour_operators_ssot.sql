-- Observatory Tour Operator SSOT

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'city_services_no_tour_operator_types'
  ) THEN
    ALTER TABLE public.city_services
      ADD CONSTRAINT city_services_no_tour_operator_types
      CHECK (type NOT IN ('tour_operator', 'agency'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_detailed_city_stats()
RETURNS TABLE (
  city_id text,
  city_name text,
  zone_name text,
  admin_region text,
  nation text,
  continent text,
  city_status text,
  visitors integer,
  quality_score integer,
  total_pois integer,
  photo_coverage integer,
  text_coverage integer,
  avg_rating double precision,
  poi_top integer,
  poi_medium integer,
  poi_low integer,
  guides_count integer,
  tour_ops_count integer,
  svc_airport integer,
  svc_train integer,
  svc_bus integer,
  svc_taxi integer,
  svc_maritime integer,
  svc_other integer,
  svc_emergency integer,
  svc_pharmacy integer,
  events_count integer,
  people_count integer,
  sponsor_silver integer,
  sponsor_gold integer,
  shop_gusto integer,
  shop_cantina integer,
  shop_artigianato integer,
  shop_moda integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id AS city_id,
    c.name AS city_name,
    COALESCE(c.zone, '') AS zone_name,
    COALESCE(c.admin_region, '') AS admin_region,
    COALESCE(c.nation, '') AS nation,
    COALESCE(c.continent, '') AS continent,
    COALESCE(c.status, 'missing') AS city_status,
    COALESCE(c.visitors, 0)::integer AS visitors,
    CASE
      WHEN COALESCE(poi_stats.total_pois, 0) = 0 THEN 0
      WHEN COALESCE(poi_stats.total_pois, 0) < 5 THEN 20
      ELSE 100
    END AS quality_score,
    COALESCE(poi_stats.total_pois, 0)::integer AS total_pois,
    COALESCE(poi_stats.photo_coverage, 0)::integer AS photo_coverage,
    COALESCE(poi_stats.text_coverage, 0)::integer AS text_coverage,
    COALESCE(poi_stats.avg_rating, 0)::double precision AS avg_rating,
    COALESCE(poi_stats.poi_top, 0)::integer AS poi_top,
    COALESCE(poi_stats.poi_medium, 0)::integer AS poi_medium,
    COALESCE(poi_stats.poi_low, 0)::integer AS poi_low,
    COALESCE((
      SELECT count(*)::int
      FROM city_guides cg
      WHERE cg.city_id = c.id
    ), 0) AS guides_count,
    COALESCE((
      SELECT count(*)::int
      FROM city_tour_operators cto
      WHERE cto.city_id = c.id
    ), 0) AS tour_ops_count,
    COALESCE((
      SELECT count(*)::int
      FROM city_services cs
      WHERE cs.city_id = c.id
        AND cs.type = 'airport'
    ), 0) AS svc_airport,
    COALESCE((
      SELECT count(*)::int
      FROM city_services cs
      WHERE cs.city_id = c.id
        AND cs.type = 'train'
    ), 0) AS svc_train,
    COALESCE((
      SELECT count(*)::int
      FROM city_services cs
      WHERE cs.city_id = c.id
        AND cs.type = 'bus'
    ), 0) AS svc_bus,
    COALESCE((
      SELECT count(*)::int
      FROM city_services cs
      WHERE cs.city_id = c.id
        AND cs.type = 'taxi'
    ), 0) AS svc_taxi,
    COALESCE((
      SELECT count(*)::int
      FROM city_services cs
      WHERE cs.city_id = c.id
        AND cs.type = 'maritime'
    ), 0) AS svc_maritime,
    COALESCE((
      SELECT count(*)::int
      FROM city_services cs
      WHERE cs.city_id = c.id
        AND cs.type NOT IN (
          'airport', 'train', 'bus', 'taxi', 'maritime',
          'emergency', 'pharmacy', 'hospital', 'police', 'fire',
          'tour_operator', 'agency'
        )
    ), 0) AS svc_other,
    COALESCE((
      SELECT count(*)::int
      FROM city_services cs
      WHERE cs.city_id = c.id
        AND cs.type IN ('emergency', 'hospital', 'police', 'fire')
    ), 0) AS svc_emergency,
    COALESCE((
      SELECT count(*)::int
      FROM city_services cs
      WHERE cs.city_id = c.id
        AND cs.type = 'pharmacy'
    ), 0) AS svc_pharmacy,
    COALESCE((
      SELECT count(*)::int
      FROM city_events ce
      WHERE ce.city_id = c.id
    ), 0) AS events_count,
    COALESCE((
      SELECT count(*)::int
      FROM city_people cp
      WHERE cp.city_id = c.id
    ), 0) AS people_count,
    COALESCE((
      SELECT count(*)::int
      FROM sponsors s
      WHERE s.city_id = c.id
        AND s.status = 'approved'
        AND lower(COALESCE(s.tier, '')) = 'silver'
    ), 0) AS sponsor_silver,
    COALESCE((
      SELECT count(*)::int
      FROM sponsors s
      WHERE s.city_id = c.id
        AND s.status = 'approved'
        AND lower(COALESCE(s.tier, '')) = 'gold'
    ), 0) AS sponsor_gold,
    COALESCE((
      SELECT count(*)::int
      FROM shops sh
      WHERE sh.city_id = c.id
        AND sh.category = 'gusto'
    ), 0) AS shop_gusto,
    COALESCE((
      SELECT count(*)::int
      FROM shops sh
      WHERE sh.city_id = c.id
        AND sh.category = 'cantina'
    ), 0) AS shop_cantina,
    COALESCE((
      SELECT count(*)::int
      FROM shops sh
      WHERE sh.city_id = c.id
        AND sh.category = 'artigianato'
    ), 0) AS shop_artigianato,
    COALESCE((
      SELECT count(*)::int
      FROM shops sh
      WHERE sh.city_id = c.id
        AND sh.category = 'moda'
    ), 0) AS shop_moda
  FROM cities c
  LEFT JOIN LATERAL (
    SELECT
      count(*)::integer AS total_pois,
      CASE
        WHEN count(*) = 0 THEN 0
        ELSE round((count(*) FILTER (WHERE coalesce(p.image_url, '') <> ''))::numeric / count(*) * 100)::integer
      END AS photo_coverage,
      CASE
        WHEN count(*) = 0 THEN 0
        ELSE round((count(*) FILTER (WHERE length(trim(coalesce(p.description, ''))) > 50))::numeric / count(*) * 100)::integer
      END AS text_coverage,
      coalesce(round(avg(p.rating) FILTER (WHERE p.rating IS NOT NULL AND p.rating > 0), 1), 0)::double precision AS avg_rating,
      count(*) FILTER (WHERE p.tourism_interest = 'high')::integer AS poi_top,
      count(*) FILTER (WHERE p.tourism_interest = 'medium')::integer AS poi_medium,
      count(*) FILTER (WHERE p.tourism_interest = 'low')::integer AS poi_low
    FROM pois p
    WHERE p.city_id = c.id
  ) poi_stats ON true
  ORDER BY c.name;
$$;
