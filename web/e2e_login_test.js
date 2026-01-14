const puppeteer = require('puppeteer');

(async () => {
    console.log('🎭 Starting E2E Login Error Test...');

    // Launch browser (headless by default, set headless: false to see it)
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Navigate to Login Page
    const loginUrl = 'http://localhost:3000'; // Root is login page
    console.log(`Navigation to: ${loginUrl}`);
    await page.goto(loginUrl);

    // Take screenshot before
    await page.screenshot({ path: 'step1_login_page.png' });

    // Type Credentials
    // Selectors might need adjustment based on your actual code
    const idSelector = 'input[type="text"]'; // Assuming Personal ID input
    const passSelector = 'input[type="password"]';
    const submitSelector = 'button[type="submit"]';

    console.log('Typing invalid credentials...');
    await page.waitForSelector(idSelector);
    await page.type(idSelector, 'BD6111');

    await page.type(passSelector, 'wrong_password_101');

    // Click Login
    console.log('Clicking login...');
    await page.click(submitSelector);

    // Wait for error message
    // Assuming the error is shown in a toast or specific element. 
    // I will wait for network idle or a specific timeout
    await new Promise(r => setTimeout(r, 2000));

    // Take screenshot after
    await page.screenshot({ path: 'step2_login_failed.png' });

    console.log('Checking for error message...');
    const content = await page.content();

    if (content.includes('Invalid credentials') || content.includes('Credențiale invalide')) {
        console.log('✅ TEST PASSED: Error message found on page.');
    } else {
        console.log('❌ TEST FAILED: Error message NOT found.');
        console.log('Page content preview: ', content.substring(0, 500));
    }

    await browser.close();
    console.log('Browser closed.');
})();
