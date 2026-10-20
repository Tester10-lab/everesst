const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mxvawuawegujcehjypcm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14dmF3dWF3ZWd1amNlaGp5cGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0MjI0MTEsImV4cCI6MjEwNzk5ODQxMX0.i1Du68gVsd3TaNla0MHmCRk040D0ccvJML4uaVsclmk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSignUp() {
  console.log('Testing signUp for admin@lalitpurholidays.com...');
  const res = await supabase.auth.signUp({
    email: 'admin@lalitpurholidays.com',
    password: 'lalitpurholidays'
  });
  console.log('SignUp result:', res);
}

testSignUp();
