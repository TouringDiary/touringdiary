const fs = require('fs');
const path = 'c:/TouringDiary/src/types/supabase.ts';
let content = fs.readFileSync(path, 'utf8');

// Update city_guides
content = content.replace(
    /(city_guides: \{\s+Row: \{[\s\S]*?order_index: number \| null)(\s+\})/,
    '$1\n          description: string | null$2'
);

// Update city_tour_operators
const tourOperatorRow = `        Row: {
          id: string
          city_id: string
          name: string
          description: string | null
          image_url: string | null
          coords_lat: number | null
          coords_lng: number | null
          address: string | null
          opening_hours: Json | null
          created_at?: string
          updated_at?: string | null
        }`;

content = content.replace(
    /city_tour_operators: \{\s+Row: \{ \[key: string\]: any \}/,
    `city_tour_operators: {\n  ${tourOperatorRow.trim()}`
);

fs.writeFileSync(path, content);
console.log('Update successful');
