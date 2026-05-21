import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Starting migration...');
  
  // 1. Get all regions
  const { data: regions, error: regionsError } = await supabase.from('regions').select('id, name');
  if (regionsError) {
    console.error('Error fetching regions:', regionsError);
    return;
  }
  
  console.log(`Found ${regions.length} regions.`);

  // 2. Get all cities that need update
  const { data: cities, error: citiesError } = await supabase.from('cities').select('id, admin_region, region_id').is('region_id', null);
  if (citiesError) {
    console.error('Error fetching cities:', citiesError);
    return;
  }
  
  console.log(`Found ${cities.length} cities to process.`);

  let updatedCount = 0;
  for (const city of cities) {
    if (!city.admin_region) continue;
    
    const matchingRegion = regions.find(r => r.name.toLowerCase() === city.admin_region.toLowerCase());
    
    if (matchingRegion) {
      const { error: updateError } = await supabase
        .from('cities')
        .update({ region_id: matchingRegion.id })
        .eq('id', city.id);
        
      if (updateError) {
        console.error(`Failed to update city ${city.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }
  
  console.log(`Successfully updated ${updatedCount} cities with region_id.`);
}

run().catch(console.error);
