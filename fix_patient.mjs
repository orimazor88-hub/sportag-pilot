// Fix script - deletes and re-invites the patient user properly
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fhntkzxwmdqzwtpoxwrt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZobnRrenh3bWRxend0cG94d3J0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTAxODAyMSwiZXhwIjoyMDk2NTk0MDIxfQ.NTJQ_6j6aNcLWjA0Eh8KnMhOjod39bSxvS149KZnv10';
const PATIENT_EMAIL = 'orimazor88@gmail.com';
const PATIENT_PASSWORD = 'Sportag2024!';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function fixPatient() {
  console.log('🔍 Looking up user...');

  // 1. Find existing user
  const { data: { users }, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) { console.error('Error listing users:', listErr); return; }
  
  const existing = users.find(u => u.email === PATIENT_EMAIL);
  
  if (existing) {
    console.log(`✅ Found user: ${existing.id}`);
    
    // 2. Delete old auth user
    console.log('🗑️  Deleting old auth user...');
    const { error: delErr } = await admin.auth.admin.deleteUser(existing.id);
    if (delErr) { console.error('Error deleting:', delErr); return; }
    console.log('✅ Old auth user deleted');
    
    // 3. Delete old profile too
    await admin.from('profiles').delete().eq('email', PATIENT_EMAIL);
    console.log('✅ Old profile deleted');
  } else {
    console.log('ℹ️  User not found in auth, will create fresh');
  }

  // 4. Create fresh user with proper password via Admin API
  console.log('👤 Creating fresh user...');
  const { data: newUserData, error: createErr } = await admin.auth.admin.createUser({
    email: PATIENT_EMAIL,
    password: PATIENT_PASSWORD,
    email_confirm: true,
    user_metadata: { name: 'אורי מזור', role: 'patient' }
  });

  if (createErr) { console.error('Error creating user:', createErr); return; }
  const newId = newUserData.user.id;
  console.log(`✅ New user created: ${newId}`);

  // 5. Insert profile
  const { error: profileErr } = await admin.from('profiles').insert({
    id: newId,
    email: PATIENT_EMAIL,
    name: 'אורי מזור',
    role: 'patient',
    is_lower_limb: true,
    avatar: '🦵',
    can_switch_role: true,
    sport: 'כללי'
  });

  if (profileErr) { console.error('Error inserting profile:', profileErr); return; }
  console.log('✅ Profile created');

  console.log('\n🎉 Done! Login credentials:');
  console.log(`   Email:    ${PATIENT_EMAIL}`);
  console.log(`   Password: ${PATIENT_PASSWORD}`);
  console.log(`   URL:      https://sportag-pilot.vercel.app`);
}

fixPatient();
