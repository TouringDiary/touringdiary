import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://iyncirtysrjrmqwfmkbm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5bmNpcnR5c3Jqcm1xd2Zta2JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyODEyMTAsImV4cCI6MjA4MTg1NzIxMH0.jUb0olX8fe-vC_XUpX_QRcA-zorVIcbFBbkWM-DXPFg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  const userId = '123e4567-e89b-12d3-a456-426614174001';
  const { error: err1 } = await supabase.from('users').insert({ id: userId, email: 'test@test.com', name: 'test' });
  console.log("User insert error:", err1);
  
  const { data, error } = await supabase.from('itineraries').upsert({
    id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: userId,
    title: 'test',
    description: 'test',
    duration_days: 1,
    type: 'personal',
    status: 'draft',
    main_city: 'Test',
    items_json: {}
  });
  console.log("Error:", error);
}
test();
