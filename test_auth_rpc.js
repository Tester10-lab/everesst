const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mxvawuawegujcehjypcm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14dmF3dWF3ZWd1amNlaGp5cGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0MjI0MTEsImV4cCI6MjEwNzk5ODQxMX0.i1Du68gVsd3TaNla0MHmCRk040D0ccvJML4uaVsclmk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  console.log('Testing app_login with admin / lalitpurholidays...');
  const { data: adminLogin, error: adminErr } = await supabase.rpc('app_login', {
    p_username: 'admin',
    p_password: 'lalitpurholidays'
  });
  console.log('Admin login response:', adminLogin, adminErr);

  console.log('\nTesting app_login with staff / batuwatrip...');
  const { data: staffLogin, error: staffErr } = await supabase.rpc('app_login', {
    p_username: 'staff',
    p_password: 'batuwatrip'
  });
  console.log('Staff login response:', staffLogin, staffErr);

  if (adminLogin && adminLogin.token) {
    console.log('\nTesting app_verify_session with token...');
    const { data: sessionData, error: sessionErr } = await supabase.rpc('app_verify_session', {
      p_token: adminLogin.token
    });
    console.log('Verify session response:', sessionData, sessionErr);
  }
}

test();
