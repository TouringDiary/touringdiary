
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://iyncirtysrjrmqwfmkbm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_12o2VzkveewDpHKYRUPiaQ_ZzkI3cyl';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findBusinessUsers() {
    const { data, error } = await supabase
        .from('sponsors')
        .select('owner_id, company_name, id')
        .limit(5);
    
    if (error) {
        console.error(error);
        return;
    }
    
    console.log(JSON.stringify(data, null, 2));
}

findBusinessUsers();
