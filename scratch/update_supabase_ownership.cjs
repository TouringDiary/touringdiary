const fs = require('fs');
const path = 'c:/TouringDiary/src/types/supabase.ts';
let content = fs.readFileSync(path, 'utf8');

// Update city_guides Row
content = content.replace(
    /(city_guides: \{\s+Row: \{[\s\S]*?description: string \| null)(\s+\})/,
    '$1\n          owner_id: string | null$2'
);

// Update city_tour_operators Row
content = content.replace(
    /(city_tour_operators: \{\s+Row: \{[\s\S]*?updated_at\?: string \| null)(\s+\})/,
    '$1\n          owner_id: string | null$2'
);

// Update shops Row
content = content.replace(
    /(shops: \{\s+Row: \{[\s\S]*?updated_at: string \| null)(\s+\})/,
    '$1\n          owner_id: string | null$2'
);

// Update sponsors Row
content = content.replace(
    /(sponsors: \{\s+Row: \{[\s\S]*?updated_at: string \| null)(\s+\})/,
    '$1\n          owner_id: string | null\n          profile_id: string | null$2'
);

fs.writeFileSync(path, content);
console.log('Global Source of Truth updated with owner_id fields');
