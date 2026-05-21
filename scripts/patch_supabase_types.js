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
