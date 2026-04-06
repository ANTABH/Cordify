const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mpecdphsvtxwmlppwcbl.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wZWNkcGhzdnR4d21scHB3Y2JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzU4MTgsImV4cCI6MjA4OTUxMTgxOH0.oRKHOA6fEKd5F5nZYhRYdMo23Lx7asGMnvjT__j_L-s';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuery() {
  const { data, error } = await supabase
    .from('stringer_profiles')
    .select(`
      id,
      type,
      lat,
      lng,
      sports,
      profiles:profiles!stringer_profiles_id_fkey (
        first_name,
        last_name,
        avatar_url
      )
    `);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success, found records:', data.length);
    console.log(JSON.stringify(data, null, 2));
  }
}

testQuery();
