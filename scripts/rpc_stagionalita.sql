CREATE OR REPLACE FUNCTION get_dynamic_seasonal_ranking(p_city_ids uuid[], target_season text)
RETURNS TABLE (
    city_id uuid,
    seasonal_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH base_cities AS (
        SELECT 
            c.id,
            c.city_types,
            c.ratings,
            c.classification_explainability
        FROM cities c
        WHERE c.status = 'published'
          AND (p_city_ids IS NULL OR c.id = ANY(p_city_ids))
    ),
    event_counts AS (
        SELECT 
            ce.city_id,
            count(*) as active_events
        FROM city_events ce
        WHERE (p_city_ids IS NULL OR ce.city_id = ANY(p_city_ids))
        GROUP BY ce.city_id
    ),
    service_counts AS (
        SELECT 
            cs.city_id,
            count(*) as active_services
        FROM city_services cs
        WHERE (p_city_ids IS NULL OR cs.city_id = ANY(p_city_ids))
        GROUP BY cs.city_id
    )
    SELECT 
        b.id as city_id,
        (
            -- 1. Base Ratings
            COALESCE((b.ratings->>'overall')::numeric, 5.0) * 0.5 +
            
            -- 2. Stagionalità Categorica Semplice (può essere espansa)
            CASE 
                WHEN target_season = 'estate' AND 'mare' = ANY(b.city_types) THEN 3.0
                WHEN target_season = 'inverno' AND 'montagna' = ANY(b.city_types) THEN 3.0
                WHEN target_season = 'primavera' AND 'borghi' = ANY(b.city_types) THEN 3.0
                WHEN target_season = 'autunno' AND 'cultura' = ANY(b.city_types) THEN 3.0
                ELSE 0.0
            END +

            -- 3. Eventi Disponibili (Bonus)
            LEAST(COALESCE(e.active_events, 0) * 0.5, 3.0) +

            -- 4. Servizi Disponibili (Bonus)
            LEAST(COALESCE(s.active_services, 0) * 0.2, 2.0)
        ) as seasonal_score
    FROM base_cities b
    LEFT JOIN event_counts e ON b.id = e.city_id
    LEFT JOIN service_counts s ON b.id = s.city_id
    ORDER BY seasonal_score DESC;
END;
$$;
