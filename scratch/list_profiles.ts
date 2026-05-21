
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://iyncirtysrjrmqwfmkbm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_12o2VzkveewDpHKYRUPiaQ_ZzkI3cyl';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listProfiles() {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role')
        .limit(10);
    
    if (error) {
        console.error(error);
        return;
    }
    
    console.log(JSON.stringify(data, null, 2));
}

listProfiles();
