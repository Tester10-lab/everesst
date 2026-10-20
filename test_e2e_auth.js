const { chromium } = require('playwright');
const path = require('path');

async function testAuthAndRoles() {
  console.log('=== Starting E2E Playwright Browser Test ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  // Listen to console messages and page errors
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('Security Rule') || msg.text().includes('Auth')) {
      console.log(`[Browser ${msg.type()}]:`, msg.text());
    }
  });

  try {
    // 1. Visit App
    console.log('\n--- 1. Testing Initial Unauthenticated Load ---');
    await page.goto('http://localhost:4321/index.html');
    await page.waitForTimeout(1000);

    // Check login view visible, dashboard hidden
    const isLoginVisible = await page.locator('#loginView').isVisible();
    const isDashboardHidden = !(await page.locator('#dashboardAppView').isVisible());
    console.log('Login view is visible:', isLoginVisible);
    console.log('Dashboard view is hidden for signed-out user:', isDashboardHidden);

    if (!isLoginVisible || !isDashboardHidden) {
      throw new Error('Signed-out user should only see the login page, dashboard must be hidden!');
    }

    // Check auto config from config.js
    const configCheck = await page.evaluate(() => {
      return {
        hasConfig: !!window.DEPOSTER_CONFIG,
        url: window.DEPOSTER_CONFIG?.SUPABASE_URL,
        hasKey: !!window.DEPOSTER_CONFIG?.SUPABASE_ANON_KEY
      };
    });
    console.log('window.DEPOSTER_CONFIG auto-loaded:', configCheck);

    await page.screenshot({ path: 'screenshot_login_view.png' });
    console.log('Saved screenshot_login_view.png');

    // 2. Test Admin Login
    console.log('\n--- 2. Testing Admin Login Flow ---');
    // Click Admin demo quick fill
    await page.locator("button:has-text('admin@lalitpurholidays.com')").click();
    await page.waitForTimeout(300);

    // Click Sign In
    await page.locator('#loginSubmitBtn').click();
    
    // Wait for dashboard to become visible
    await page.waitForSelector('#dashboardAppView', { state: 'visible', timeout: 8000 });
    console.log('Successfully signed in to Dashboard as Admin!');

    // Verify Admin Role Badge
    const roleBadgeText = await page.locator('#roleBadgeContainer').innerText();
    console.log('Verified Role Badge:', roleBadgeText.trim());
    if (!roleBadgeText.includes('ADMIN')) {
      throw new Error('Expected ADMIN role badge in header!');
    }

    // Verify Admin Controls Visible
    const isNewDepVisible = await page.locator('#headerNewDepBtn').isVisible();
    const isPkgVisible = await page.locator('#headerManagePackagesBtn').isVisible();
    const isStaffBtnVisible = await page.locator('#headerStaffManagementBtn').isVisible();
    console.log('Admin controls visible (New Dep, Packages, Staff):', { isNewDepVisible, isPkgVisible, isStaffBtnVisible });

    // Open Staff Management Modal (Modal 6)
    await page.locator('#headerStaffManagementBtn').click();
    await page.waitForSelector('#staffModal', { state: 'visible' });
    await page.waitForTimeout(1200);

    const staffTableContent = await page.locator('#staffAccountsTableBody').innerText();
    console.log('Staff Modal Accounts Table preview:\n', staffTableContent.trim().split('\n').slice(0, 4).join('\n'));
    await page.screenshot({ path: 'screenshot_admin_staff_modal.png' });

    // Close Staff modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    await page.screenshot({ path: 'screenshot_admin_dashboard.png' });
    console.log('Saved screenshot_admin_dashboard.png');

    // 3. Test Sign Out
    console.log('\n--- 3. Testing Sign Out ---');
    // Set up dialog handler for confirm()
    page.once('dialog', async dialog => {
      console.log('Sign Out Dialog:', dialog.message());
      await dialog.accept();
    });
    await page.locator('#headerSignOutBtn').click();
    await page.waitForSelector('#loginView', { state: 'visible', timeout: 5000 });
    console.log('Sign out successful! Returned to login view.');

    // 4. Test Staff Login with "Admin" Selector Intent (Role Authority Verification)
    console.log('\n--- 4. Testing Role Authority (Selecting Admin with Staff Account) ---');
    // Intentionally click "Admin Dispatcher" portal selector
    await page.locator('#loginTabAdmin').click();
    await page.waitForTimeout(200);

    // Fill staff credentials
    await page.locator('#loginEmail').fill('staff@batuwatrip.com');
    await page.locator('#loginPassword').fill('batuwatrip');

    // Submit
    await page.locator('#loginSubmitBtn').click();
    await page.waitForSelector('#dashboardAppView', { state: 'visible', timeout: 8000 });

    // Verify that user is signed in as STAFF despite selecting Admin tab!
    const staffRoleBadgeText = await page.locator('#roleBadgeContainer').innerText();
    console.log('Role Badge after staff login:', staffRoleBadgeText.trim());
    if (!staffRoleBadgeText.includes('STAFF')) {
      throw new Error('Security failure: Staff user should have STAFF badge, never ADMIN!');
    }

    // Verify Admin Controls are HIDDEN for Staff
    const staffNewDepVisible = await page.locator('#headerNewDepBtn').isVisible();
    const staffPkgVisible = await page.locator('#headerManagePackagesBtn').isVisible();
    const staffBtnVisible = await page.locator('#headerStaffManagementBtn').isVisible();
    console.log('Admin controls hidden for staff user:', {
      newDepHidden: !staffNewDepVisible,
      packagesHidden: !staffPkgVisible,
      staffMgmtHidden: !staffBtnVisible
    });

    if (staffNewDepVisible || staffPkgVisible || staffBtnVisible) {
      throw new Error('Security failure: Admin buttons must not be visible to staff!');
    }

    // Verify Staff can open Add Passenger modal
    console.log('\n--- 5. Testing Staff Add Passenger Modal ---');
    const addPaxBtn = page.locator("button:has-text('+ Add Passenger')").first();
    await addPaxBtn.click();
    await page.waitForSelector('#addCustomerModal', { state: 'visible', timeout: 3000 });
    console.log('Add Passenger modal opened successfully for Staff booking!');
    await page.screenshot({ path: 'screenshot_staff_dashboard.png' });

    console.log('\n>>> ALL BROWSER E2E TESTS PASSED SUCCESSFULLY! <<<');
  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testAuthAndRoles();
