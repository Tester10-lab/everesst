const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mxvawuawegujcehjypcm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14dmF3dWF3ZWd1amNlaGp5cGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0MjI0MTEsImV4cCI6MjEwNzk5ODQxMX0.i1Du68gVsd3TaNla0MHmCRk040D0ccvJML4uaVsclmk';

async function runTests() {
  console.log('=== TEST 1: Signed-Out (Anon) User Cannot Read Any Data ===');
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const { data: anonCusts, error: anonCustErr } = await anonClient.from('customers').select('*');
  console.log('Anon customers query count:', anonCusts ? anonCusts.length : 0, 'error:', anonCustErr ? anonCustErr.message : 'none');
  
  const { data: anonDeps, error: anonDepErr } = await anonClient.from('departures').select('*');
  console.log('Anon departures query count:', anonDeps ? anonDeps.length : 0, 'error:', anonDepErr ? anonDepErr.message : 'none');

  const { data: anonPkgs, error: anonPkgErr } = await anonClient.from('packages').select('*');
  console.log('Anon packages query count:', anonPkgs ? anonPkgs.length : 0, 'error:', anonPkgErr ? anonPkgErr.message : 'none');

  if ((anonCusts?.length || 0) === 0 && (anonDeps?.length || 0) === 0) {
    console.log('>>> PASSED: Signed-out user gets ZERO data rows from Supabase tables.');
  } else {
    console.error('>>> FAILED: Signed-out user was able to read data!');
  }

  console.log('\n=== TEST 2: Staff User Signs In ===');
  const staffClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: staffAuth, error: staffAuthErr } = await staffClient.auth.signInWithPassword({
    email: 'staff@batuwatrip.com',
    password: 'batuwatrip'
  });
  if (staffAuthErr) {
    console.error('Staff login error:', staffAuthErr);
    return;
  }
  console.log('Staff logged in:', staffAuth.user.email);

  // Check role from profiles table
  const { data: staffProfile, error: profErr } = await staffClient.from('profiles').select('*').eq('id', staffAuth.user.id).single();
  console.log('Staff profile in DB:', staffProfile);

  console.log('\n=== TEST 3: Staff Can SELECT Bookings ===');
  const { data: staffReadCusts, error: readErr } = await staffClient.from('customers').select('*');
  console.log('Staff read customers count:', staffReadCusts ? staffReadCusts.length : 0, 'error:', readErr ? readErr.message : 'none');

  console.log('\n=== TEST 4: Staff Can INSERT A New Customer ===');
  const testCustId = 'c-staff-test-' + Date.now();
  const { data: insertData, error: insertErr } = await staffClient.from('customers').insert({
    id: testCustId,
    departure_id: 'dep-mustang-kartik5',
    name: 'Staff Booking Test',
    phone: '9800000000',
    pax: 1,
    agency_name: 'Batuwa Trip',
    paid: 15500,
    remaining: 0,
    note: 'Created by staff test'
  }).select();
  console.log('Staff insert success:', !insertErr, 'error:', insertErr ? insertErr.message : 'none');

  console.log('\n=== TEST 5: Staff Direct API Call to UPDATE Customer (MUST BE REJECTED) ===');
  // Attempt to edit customer directly via Supabase API as staff
  const targetCust = staffReadCusts && staffReadCusts[0] ? staffReadCusts[0].id : testCustId;
  const { data: updateData, error: updateErr } = await staffClient
    .from('customers')
    .update({ name: 'Hacked By Staff', remaining: 0 })
    .eq('id', targetCust)
    .select();
  
  console.log('Staff update response data:', updateData, 'error:', updateErr ? updateErr.message : 'none');
  if (!updateData || updateData.length === 0 || updateErr) {
    console.log('>>> PASSED: Staff update was rejected by Row Level Security (0 rows updated or blocked)!');
  } else {
    console.error('>>> FAILED: Staff was able to update customer record!');
  }

  console.log('\n=== TEST 6: Staff Direct API Call to DELETE Customer (MUST BE REJECTED) ===');
  const { data: deleteData, error: deleteErr } = await staffClient
    .from('customers')
    .delete()
    .eq('id', targetCust)
    .select();
  
  console.log('Staff delete response data:', deleteData, 'error:', deleteErr ? deleteErr.message : 'none');
  if (!deleteData || deleteData.length === 0 || deleteErr) {
    console.log('>>> PASSED: Staff delete was rejected by Row Level Security (0 rows deleted or blocked)!');
  } else {
    console.error('>>> FAILED: Staff was able to delete customer record!');
  }

  console.log('\n=== TEST 7: Staff Direct API Call to UPDATE Departure / Driver (MUST BE REJECTED) ===');
  const { data: depUpdateData, error: depUpdateErr } = await staffClient
    .from('departures')
    .update({ driver_name: 'Staff Rogue Driver' })
    .eq('id', 'dep-mustang-kartik5')
    .select();
  
  console.log('Staff departure update response data:', depUpdateData, 'error:', depUpdateErr ? depUpdateErr.message : 'none');
  if (!depUpdateData || depUpdateData.length === 0 || depUpdateErr) {
    console.log('>>> PASSED: Staff departure/driver update was rejected by Row Level Security!');
  } else {
    console.error('>>> FAILED: Staff was able to update departure!');
  }

  console.log('\n=== TEST 8: Admin User Signs In & Performs Authorized Update ===');
  const adminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: adminAuth, error: adminAuthErr } = await adminClient.auth.signInWithPassword({
    email: 'admin@lalitpurholidays.com',
    password: 'lalitpurholidays'
  });
  console.log('Admin logged in:', adminAuth?.user?.email);

  const { data: adminProfile } = await adminClient.from('profiles').select('*').eq('id', adminAuth.user.id).single();
  console.log('Admin profile in DB:', adminProfile);

  // Admin can update remaining price or details
  const { data: adminUpdateData, error: adminUpdateErr } = await adminClient
    .from('customers')
    .update({ note: 'Admin updated at ' + new Date().toLocaleTimeString() })
    .eq('id', 'c-ujwal-1')
    .select();
  console.log('Admin update success:', !adminUpdateErr && adminUpdateData?.length > 0, 'error:', adminUpdateErr ? adminUpdateErr.message : 'none');

  // Clean up the test customer created in test 4 (Admin can delete)
  const { error: cleanupErr } = await adminClient.from('customers').delete().eq('id', testCustId);
  console.log('Admin cleanup test customer success:', !cleanupErr);
}

runTests();
