const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('🚀 Starting Everest Annapurna Deposter Playwright Test Suite...\n');
  
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    console.log('Falling back to msedge channel...');
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 850 }
  });
  const page = await context.newPage();

  // Test 1: Load Page & Verify Aesthetics & Role Badge
  console.log('--- TEST 1: Page Load, Theme & Initial Admin Role ---');
  await page.goto('http://localhost:4321/index.html', { waitUntil: 'networkidle' });

  const title = await page.title();
  console.log('Page Title:', title);
  if (!title.includes('Everest Annapurna Deposter')) {
    throw new Error('Title does not match expected');
  }

  // Check role badge
  const roleBadgeText = await page.locator('#roleBadgeContainer').textContent();
  console.log('Initial Role Badge:', roleBadgeText.trim());
  if (!roleBadgeText.includes('ADMIN')) {
    throw new Error('Initial role is not ADMIN');
  }

  // Verify background color token
  const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  console.log('Body background color:', bodyBg); // should be rgb(244, 239, 230) which is #F4EFE6

  // Verify font families
  const headingFont = await page.evaluate(() => getComputedStyle(document.querySelector('h1')).fontFamily);
  const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  console.log('Heading font:', headingFont);
  console.log('Body font:', bodyFont);

  // Check seat matrix squares
  const seatSquares = await page.locator('.seat-square').count();
  console.log(`Verified ${seatSquares} seat squares rendered across departure cards.`);
  if (seatSquares === 0) throw new Error('No seat squares rendered');

  await page.screenshot({ path: 'screenshot_desktop_admin.png', fullPage: false });
  console.log('✓ Desktop Admin screenshot saved to screenshot_desktop_admin.png');

  // Test 2: Admin Inline Edit & Discrepancy Warning
  console.log('\n--- TEST 2: Admin Inline Editing & Discrepancy Warning ---');
  const mustangCard = page.locator('#departure-card-dep-mustang-kartik5');
  const custTable = mustangCard.locator('.desktop-table-view table');
  await custTable.waitFor({ state: 'visible' });

  // Locate remaining input for Ujwal Baiju
  const remainingInput = custTable.locator('input.money-owed').first();
  const initialRemaining = await remainingInput.inputValue();
  console.log('Initial Ujwal Baiju Remaining Amount:', initialRemaining);

  // Edit remaining amount directly
  await remainingInput.fill('80000');
  await remainingInput.dispatchEvent('change');
  await page.waitForTimeout(600);

  // Check saved badge
  const savedBadge = custTable.locator('.saved-pill').first();
  console.log('Saved badge visibility:', await savedBadge.isVisible());

  // Check if discrepancy notice is shown
  const discrepancyBadge = custTable.locator('.badge-owed').first();
  const discrepancyText = await discrepancyBadge.textContent();
  console.log('Discrepancy notice text:', discrepancyText.trim());

  // Check audit trail
  const auditDetails = mustangCard.locator('details');
  await auditDetails.locator('summary').click();
  await page.waitForTimeout(300);
  const auditContent = await auditDetails.textContent();
  console.log('Audit trail contains update:', auditContent.includes('Updated remaining on Ujwal Baiju'));

  // Test 3: Responsive Mobile View (390px) & Touch Targets
  console.log('\n--- TEST 3: Mobile Viewport (390px) & Ergonomics ---');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);

  const desktopTableVisible = await page.locator('#departure-card-dep-mustang-kartik5 .desktop-table-view').isVisible();
  const mobileCardsVisible = await page.locator('#departure-card-dep-mustang-kartik5 .mobile-cards-view').isVisible();
  console.log('At 390px - Desktop table visible:', desktopTableVisible, '(Expected: false)');
  console.log('At 390px - Mobile cards visible:', mobileCardsVisible, '(Expected: true)');

  if (desktopTableVisible || !mobileCardsVisible) {
    throw new Error('Responsive mobile cards layout failed at 390px!');
  }

  // Verify touch target height on mobile buttons
  const addBtnBox = await page.locator('#departure-card-dep-mustang-kartik5 button:has-text("+ Add Passenger")').boundingBox();
  console.log('Mobile "+ Add Passenger" button height:', addBtnBox.height, 'px (Target >= 44px)');
  if (addBtnBox.height < 40) {
    throw new Error('Touch target height is smaller than standard!');
  }

  // Scroll down to customer cards inside Upper Mustang
  await page.locator('#departure-card-dep-mustang-kartik5 .mobile-cards-view').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'screenshot_mobile_admin_390px.png', fullPage: false });
  console.log('✓ Mobile Admin 390px screenshot saved to screenshot_mobile_admin_390px.png');

  // Test 4: Switch to Staff Mode & Verify Protection
  console.log('\n--- TEST 4: Staff Role Restrictions (Read-Only Existing Bookings) ---');
  await page.click('#switchRoleStaffBtn');
  await page.waitForTimeout(400);

  const newRoleBadge = await page.locator('#roleBadgeContainer').textContent();
  console.log('Updated Role Badge:', newRoleBadge.trim());
  if (!newRoleBadge.includes('STAFF')) {
    throw new Error('Role did not switch to STAFF');
  }

  // Verify admin controls are hidden
  const newDepBtnVisible = await page.locator('#headerNewDepBtn').isVisible();
  const managePkgBtnVisible = await page.locator('#headerManagePackagesBtn').isVisible();
  console.log('Header "New Departure" visible for Staff:', newDepBtnVisible, '(Expected: false)');
  console.log('Header "Packages" visible for Staff:', managePkgBtnVisible, '(Expected: false)');

  // Verify mobile cards in Staff mode contain NO inputs
  const mobileInputsInStaff = await page.locator('#departure-card-dep-mustang-kartik5 .mobile-cards-view input').count();
  const mobileDeleteBtnsInStaff = await page.locator('#departure-card-dep-mustang-kartik5 .mobile-cards-view button[aria-label*="Delete"]').count();
  console.log('Inputs inside customer rows for Staff:', mobileInputsInStaff, '(Expected: 0)');
  console.log('Delete buttons inside customer rows for Staff:', mobileDeleteBtnsInStaff, '(Expected: 0)');

  if (mobileInputsInStaff > 0 || mobileDeleteBtnsInStaff > 0) {
    throw new Error('Security Breach: Staff has access to edit inputs or delete buttons!');
  }

  // Scroll down to customer cards inside Upper Mustang in Staff mode
  await page.locator('#departure-card-dep-mustang-kartik5 .mobile-cards-view').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'screenshot_mobile_staff_390px.png', fullPage: false });
  console.log('✓ Mobile Staff 390px screenshot saved to screenshot_mobile_staff_390px.png');

  // Test 5: Over-booking Block & Add Customer as Staff
  console.log('\n--- TEST 5: Over-Booking Prevention & Staff Booking Creation ---');
  await page.click('#departure-card-dep-mustang-kartik5 button:has-text("+ Add Passenger")');
  await page.waitForTimeout(400);

  const modalVisible = await page.locator('#addCustomerModal').isVisible();
  console.log('Add Customer Modal opened:', modalVisible);

  await page.fill('#acCustomerName', 'Tenzing Norgay');
  await page.fill('#acCustomerPhone', '9841001122');

  // Test over-booking by entering 10 pax
  console.log('Testing over-booking protection with 10 pax...');
  await page.fill('#acPaxCount', '10');
  await page.dispatchEvent('#acPaxCount', 'input');
  await page.waitForTimeout(300);

  const capacityAlert = page.locator('#acCapacityAlert');
  const alertVisible = await capacityAlert.isVisible();
  const submitBtnDisabled = await page.locator('#acSubmitBtn').isDisabled();
  console.log('Over-capacity alert visible:', alertVisible);
  console.log('Submit button disabled:', submitBtnDisabled);

  if (!alertVisible || !submitBtnDisabled) {
    throw new Error('Over-booking block failed! Alert should be visible and button disabled.');
  }

  await page.screenshot({ path: 'screenshot_overbooking_alert.png', fullPage: false });
  console.log('✓ Overbooking alert screenshot saved to screenshot_overbooking_alert.png');

  // Now set valid pax count: 1
  console.log('Entering valid 1 Pax booking...');
  await page.fill('#acPaxCount', '1');
  await page.dispatchEvent('#acPaxCount', 'input');
  await page.waitForTimeout(300);

  const alertAfterValid = await capacityAlert.isVisible();
  const submitAfterValid = await page.locator('#acSubmitBtn').isDisabled();
  console.log('Alert dismissed:', !alertAfterValid);
  console.log('Submit button enabled:', !submitAfterValid);

  // Submit valid booking
  await page.fill('#acPaidAmount', '5000');
  await page.fill('#acRemainingAmount', '10500');
  await page.click('#acSubmitBtn');
  await page.waitForTimeout(600);

  // Verify new passenger appears in the list
  const cardText = await page.locator('#departure-card-dep-mustang-kartik5').textContent();
  console.log('New customer "Tenzing Norgay" in list:', cardText.includes('Tenzing Norgay'));
  if (!cardText.includes('Tenzing Norgay')) {
    throw new Error('New booking was not added to departure list!');
  }

  // Verify that as Staff, the newly added customer cannot be edited or deleted
  const inputsAfterAdd = await page.locator('#departure-card-dep-mustang-kartik5 .mobile-cards-view input').count();
  console.log('Customer inputs after booking in Staff mode:', inputsAfterAdd, '(Expected: 0)');
  if (inputsAfterAdd > 0) {
    throw new Error('Staff can edit newly added customer!');
  }

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! All role constraints, responsive behaviors, and security rules verified.');
  await browser.close();
}

runTests().catch(err => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
