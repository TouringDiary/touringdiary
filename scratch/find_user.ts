
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://iyncirtysrjrmqwfmkbm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_12o2VzkveewDpHKYRUPiaQ_ZzkI3cyl';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findUserEmail() {
    const { data, error } = await supabase
        .from('profiles')
        .select('email, id')
        .eq('id', '06242e25-a0e9-41ef-b13e-f10ea6ff50d4')
        .single();
    
    if (error) {
        console.error(error);
        return;
    }
    
    console.log(JSON.stringify(data, null, 2));
}

findUserEmail();
