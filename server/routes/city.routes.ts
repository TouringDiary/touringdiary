import { Router } from 'express';
import { supabaseAdmin } from '../supabaseAdmin';

const router = Router();

// CITY DETAILS ENDPOINT
router.get("/:cityId/details", async (req, res) => {
  const { cityId } = req.params;
  console.log(`[API-City] Dettagli richiesti per cityId: ${cityId}`);
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, error: "Supabase Admin client not initialized" });
    }

    const [cityRes, poisRes, eventsRes, servicesRes, guidesRes, tourOperatorsRes, peopleRes] = await Promise.all([
      supabaseAdmin.from('cities').select('*').eq('id', cityId).maybeSingle(),
      supabaseAdmin.from('pois').select('*').eq('city_id', cityId),
      supabaseAdmin.from('city_events').select('*').eq('city_id', cityId).order('order_index', { ascending: true }),
      supabaseAdmin.from('city_services').select('*').eq('city_id', cityId).order('order_index', { ascending: true }),
      supabaseAdmin.from('city_guides').select('*').eq('city_id', cityId).order('order_index', { ascending: true }),
      supabaseAdmin.from('city_tour_operators').select('*').eq('city_id', cityId).order('name', { ascending: true }),
      supabaseAdmin.from('city_people').select('*').eq('city_id', cityId).order('order_index', { ascending: true })
    ]);

    if (!cityRes.data) {
      return res.status(404).json({ success: false, error: "Città non trovata" });
    }

    console.log("[City Details Endpoint]", cityId, cityRes.data?.name);
    console.log(`[API-City] Caricati: ${poisRes.data?.length} POI, ${eventsRes.data?.length} eventi, ${tourOperatorsRes.data?.length ?? 0} tour operator`);
    res.setHeader("Cache-Control", "no-store");
    res.json({
      success: true,
      city: cityRes.data,
      pois: poisRes.data || [],
      events: eventsRes.data || [],
      services: servicesRes.data || [],
      guides: guidesRes.data || [],
      tour_operators: tourOperatorsRes.data || [],
      people: peopleRes.data || []
    });

  } catch (error: any) {
    console.error(`[API-City] Errore per ${cityId}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
