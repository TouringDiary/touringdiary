
import { supabase } from '../src/services/supabaseClient';

async function migrateGallery() {
    console.log("Starting gallery migration...");

    // 1. Fetch all cities with gallery
    const { data: cities, error: cityError } = await supabase
        .from('cities')
        .select('id, name, gallery');

    if (cityError) {
        console.error("Error fetching cities:", cityError);
        return;
    }

    console.log(`Found ${cities.length} cities.`);

    let totalImported = 0;
    let totalSkipped = 0;

    for (const city of cities) {
        if (!city.gallery || city.gallery.length === 0) continue;

        console.log(`Processing ${city.name} (${city.gallery.length} photos)...`);

        for (const url of city.gallery) {
            const normalizedUrl = url.trim();

            // Check if URL already exists in photo_submissions
            const { data: existing } = await supabase
                .from('photo_submissions')
                .select('id')
                .eq('image_url', normalizedUrl)
                .maybeSingle();

            if (existing) {
                // If it exists, ensure it has the correct city_id
                await supabase
                    .from('photo_submissions')
                    .update({ city_id: city.id })
                    .eq('id', existing.id);
                
                totalSkipped++;
                continue;
            }

            // Insert as official photo
            const { error: insertError } = await supabase
                .from('photo_submissions')
                .insert({
                    user_id: null, // Evita violazioni FK verso auth.users
                    user_name: 'Official',
                    location_name: city.name,
                    description: `Foto ufficiale di ${city.name}`,
                    image_url: normalizedUrl,
                    status: 'approved',
                    city_id: city.id,
                    likes: 0
                });

            if (insertError) {
                console.error(`Error importing ${url}:`, insertError);
            } else {
                totalImported++;
            }
        }
    }

    console.log("Migration finished.");
    console.log(`Imported: ${totalImported}`);
    console.log(`Matched/Updated: ${totalSkipped}`);
}

migrateGallery().catch(console.error);
