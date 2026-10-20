const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mxvawuawegujcehjypcm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14dmF3dWF3ZWd1amNlaGp5cGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0MjI0MTEsImV4cCI6MjEwNzk5ODQxMX0.i1Du68gVsd3TaNla0MHmCRk040D0ccvJML4uaVsclmk';

async function testAuth() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log('Testing signInWithPassword for admin@lalitpurholidays.com...');
  const { data: adminData, error: adminErr } = await supabase.auth.signInWithPassword({
    email: 'admin@lalitpurholidays.com',
    password: 'lalitpurholidays'
  });
  console.log('Admin login error:', adminErr ? adminErr.message : 'None');
  console.log('Admin session user id:', adminData?.user?.id);

  console.log('\nTesting signInWithPassword for staff@batuwatrip.com...');
  const { data: staffData, error: staffErr } = await supabase.auth.signInWithPassword({
    email: 'staff@batuwatrip.com',
    password: 'batuwatrip'
  });
  console.log('Staff login error:', staffErr ? staffErr.message : 'None');
  console.log('Staff session user id:', staffData?.user?.id);
}

testAuth();
