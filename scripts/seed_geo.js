import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const toSlug = (str) => str.toLowerCase().replace(/[\s&]+/g, '-').replace(/[^a-z0-9\-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');

async function seedGeo() {
  console.log('Fetching geo_options...');
  const { data: settings } = await supabase.from('global_settings').select('value').eq('key', 'geo_options').single();
  const geo = settings?.value;
  if (!geo) {
    console.error('No geo_options found in global_settings!');
    return;
  }
  
  // 1. Continents
  for (const c of geo.continents) {
      const name = typeof c === 'string' ? c : (c.label || c.value);
      const slug = toSlug(name);
      
      const { data: cont, error: errC } = await supabase.from('continents').insert({ name, slug }).select('id').single();
      if (errC) {
          if (errC.code !== '23505') console.error('Error inserting continent:', name, errC);
      } else {
          console.log(`Inserted continent ${name}`);
      }
  }

  const { data: allContinents } = await supabase.from('continents').select('id, name');
  const getContId = (name) => allContinents.find(c => c.name === name)?.id;
  
  // 2. Nations
  for (const n of geo.nations) {
      const name = typeof n === 'string' ? n : (n.label || n.value);
      const continentName = typeof geo.continents[0] === 'string' ? geo.continents[0] : (geo.continents[0].label || geo.continents[0].value); // Default
      const slug = toSlug(name);
      
      const { error: errN } = await supabase.from('nations').insert({ name, slug, continent_id: getContId(continentName) }).select('id').single();
      if (errN) {
          if (errN.code !== '23505') console.error('Error inserting nation:', name, errN);
      } else {
          console.log(`Inserted nation ${name}`);
      }
  }

  const { data: allNations } = await supabase.from('nations').select('id, name');
  const getNationId = (name) => allNations.find(n => n.name === name)?.id;

  // 3. Regions
  const regionsList = geo.admin_regions || geo.regions;
  for (const r of regionsList) {
      const name = typeof r === 'string' ? r : (r.label || r.value);
      const nationName = typeof geo.nations[0] === 'string' ? geo.nations[0] : (geo.nations[0].label || geo.nations[0].value); // Default
      const slug = toSlug(name);
      
      const { error: errR } = await supabase.from('regions').insert({ name, slug, nation_id: getNationId(nationName) }).select('id').single();
      if (errR) {
          if (errR.code !== '23505') console.error('Error inserting region:', name, errR);
      } else {
          console.log(`Inserted region ${name}`);
      }
  }
  console.log('Seed Geo completed.');
}

seedGeo().catch(console.error);
