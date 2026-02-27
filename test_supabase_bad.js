require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    console.log('Sending bad request to tasks...');
    const { data, error } = await supabase.from('tasks').upsert({
        id: 'test-bad-id',
        created_at: new Date().toISOString() // This column DOES NOT EXIST!
    });
    console.log('Error:', error);
}

test();
