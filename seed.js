const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mpecdphsvtxwmlppwcbl.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wZWNkcGhzdnR4d21scHB3Y2JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzU4MTgsImV4cCI6MjA4OTUxMTgxOH0.oRKHOA6fEKd5F5nZYhRYdMo23Lx7asGMnvjT__j_L-s';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  console.log('Seeding fake stringers...');

  // User 1: Boutique Stringer
  let res1 = await supabase.auth.signUp({
    email: 'boutique1@cordify.fr',
    password: 'password123',
  });
  
  if (res1.error) console.error('Error creating user 1:', res1.error.message);
  
  if (res1.data?.user) {
    const userId1 = res1.data.user.id;
    // Update profile
    await supabase.from('profiles').update({
      role: 'stringer',
      first_name: 'Pro',
      last_name: 'Cordage',
      club: 'Tennis Club de Paris',
    }).eq('id', userId1);

    // Create stringer_profile
    await supabase.from('stringer_profiles').insert({
      id: userId1,
      type: 'boutique',
      description: 'Boutique spécialisée avec plus de 10 ans d\'expérience.',
      address: '15 Rue de Rivoli, Paris',
      lat: 48.8566,
      lng: 2.3522,
      sports: ['badminton', 'tennis'],
    });
    console.log('Created Boutique Stringer:', userId1);
  }

  // User 2: Independant Stringer
  let res2 = await supabase.auth.signUp({
    email: 'independant1@cordify.fr',
    password: 'password123',
  });
  
  if (res2.error) console.error('Error creating user 2:', res2.error.message);

  if (res2.data?.user) {
    const userId2 = res2.data.user.id;
    // Update profile
    await supabase.from('profiles').update({
      role: 'stringer',
      first_name: 'Jean',
      last_name: 'Dupont',
      club: 'BC Lyon',
    }).eq('id', userId2);

    // Create stringer_profile
    await supabase.from('stringer_profiles').insert({
      id: userId2,
      type: 'independant',
      description: 'Passionné et méticuleux, certifié ERSA.',
      address: '10 Place Bellecour, Lyon',
      lat: 45.7578,
      lng: 4.8320,
      sports: ['badminton'],
    });
    console.log('Created Independant Stringer:', userId2);
  }

  console.log('Done!');
}

seed();
