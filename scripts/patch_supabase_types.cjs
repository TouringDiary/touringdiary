const fs = require('fs');
const path = require('path');

const typesPath = path.resolve(__dirname, '../src/types/supabase.ts');
let content = fs.readFileSync(typesPath, 'utf8');

// 1. Add columns to cities
if (!content.includes('slug?: string | null')) {
    content = content.replace(
        /(cities:\s*\{\s*Row:\s*\{)/g,
        '$1\n          slug: string | null\n          region_id: string | null\n          tourist_zone_id: string | null'
    );
    content = content.replace(
        /(cities:\s*\{\s*Row:\s*\{[\s\S]*?Insert:\s*\{)/g,
        '$1\n          slug?: string | null\n          region_id?: string | null\n          tourist_zone_id?: string | null'
    );
    content = content.replace(
        /(cities:\s*\{\s*Row:\s*\{[\s\S]*?Update:\s*\{)/g,
        '$1\n          slug?: string | null\n          region_id?: string | null\n          tourist_zone_id?: string | null'
    );
}

// 2. Add columns to tourist_zones
if (!content.includes('slug: string | null') && content.includes('tourist_zones: {')) {
    content = content.replace(
        /(tourist_zones:\s*\{\s*Row:\s*\{)/g,
        '$1\n          slug: string | null\n          region_id: string | null'
    );
    content = content.replace(
        /(tourist_zones:\s*\{\s*Row:\s*\{[\s\S]*?Insert:\s*\{)/g,
        '$1\n          slug?: string | null\n          region_id?: string | null'
    );
    content = content.replace(
        /(tourist_zones:\s*\{\s*Row:\s*\{[\s\S]*?Update:\s*\{)/g,
        '$1\n          slug?: string | null\n          region_id?: string | null'
    );
}

// 2.5 Add image_url to city_services
console.log('Checking city_services...');
// Cerchiamo il blocco city_services e verifichiamo se contiene image_url PRIMA della fine del blocco Row
const cityServicesBlock = content.match(/city_services:\s*\{[\s\S]*?Row:\s*\{[\s\S]*?\}/);
if (cityServicesBlock && !cityServicesBlock[0].includes('image_url:')) {
    console.log('Found city_services block without image_url. Patching...');
    // Inserimento in Row
    content = content.replace(
        /(city_services:[\s\S]*?Row:\s*\{)/,
        '$1\n          image_url: string | null'
    );
    // Inserimento in Insert
    content = content.replace(
        /(city_services:[\s\S]*?Insert:\s*\{)/,
        '$1\n          image_url?: string | null\n        '
    );
    // Inserimento in Update
    content = content.replace(
        /(city_services:[\s\S]*?Update:\s*\{)/,
        '$1\n          image_url?: string | null\n        '
    );
} else {
    console.log('city_services block already has image_url or not found.');
}

// 2.6 Add columns to sponsors
console.log('Checking sponsors...');
const sponsorsBlock = content.match(/sponsors:\s*\{[\s\S]*?Row:\s*\{[\s\S]*?\}/);
if (sponsorsBlock && !sponsorsBlock[0].includes('poi_id:')) {
    console.log('Found sponsors block without rel columns. Patching...');
    const columns = `
          poi_id: string | null
          shop_id: string | null
          guide_id: string | null
          operator_id: string | null
          request_id: string | null
          admin_notes_last_updated: string | null`;
    
    const insertColumns = `
          poi_id?: string | null
          shop_id?: string | null
          guide_id?: string | null
          operator_id?: string | null
          request_id?: string | null
          admin_notes_last_updated?: string | null`;

    content = content.replace(/(sponsors:[\s\S]*?Row:\s*\{)/, `$1${columns}`);
    content = content.replace(/(sponsors:[\s\S]*?Insert:\s*\{)/, `$1${insertColumns}`);
    content = content.replace(/(sponsors:[\s\S]*?Update:\s*\{)/, `$1${insertColumns}`);
} else {
    console.log('sponsors block already has poi_id or not found.');
}

// 3. Add tables continents, nations, regions
const newTables = `
      continents: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
      }
      nations: {
        Row: {
          id: string
          continent_id: string | null
          name: string
          slug: string
        }
        Insert: {
          id?: string
          continent_id?: string | null
          name: string
          slug: string
        }
        Update: {
          id?: string
          continent_id?: string | null
          name?: string
          slug?: string
        }
      }
      regions: {
        Row: {
          id: string
          nation_id: string | null
          name: string
          slug: string
        }
        Insert: {
          id?: string
          nation_id?: string | null
          name: string
          slug: string
        }
        Update: {
          id?: string
          nation_id?: string | null
          name?: string
          slug?: string
        }
      }
      cities_registry: {
        Row: {
          id: string
          name: string
          region: string
          slug: string | null
        }
        Insert: {
          id: string
          name: string
          region: string
          slug?: string | null
        }
        Update: {
          id?: string
          name?: string
          region?: string
          slug?: string | null
        }
      }
`;

if (!content.includes('continents: {')) {
    content = content.replace(
        /(Tables:\s*\{)/g,
        `$1${newTables}`
    );
}

fs.writeFileSync(typesPath, content, 'utf8');
console.log('Successfully patched supabase.ts');
