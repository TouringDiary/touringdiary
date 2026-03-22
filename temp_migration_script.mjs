
import { createClient } from '@supabase/supabase-js';

// Hardcoded credentials from src/services/supabaseClient.ts
const SUPABASE_URL = 'https://iyncirtysrjrmqwfmkbm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5bmNpcnR5c3Jqcm1xd2Zta2JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyODEyMTAsImV4cCI6MjA4MTg1NzIxMH0.jUb0olX8fe-vC_XUpX_QRcA-zorVIcbFBbkWM-DXPFg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getDesignRules() {
    // 1. Fetch data and count
    const { data, error, count } = await supabase
        .from('design_system_rules')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error fetching design rules:", error);
        return;
    }

    // 2. Output total rows
    console.log("--- TOTAL ROWS ---");
    console.log(count);

    // 3. Output first 10 records
    console.log("\n--- FIRST 10 RECORDS ---");
    console.log(JSON.stringify(data.slice(0, 10), null, 2));
}

getDesignRules();
