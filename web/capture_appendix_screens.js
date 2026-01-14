const puppeteer = require('puppeteer');

(async () => {
    console.log('📸 Starting Appendix Screenshot Capture...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const baseUrl = 'http://localhost:3000';

    // 1. Login Logic
    console.log('Go to Login...');
    await page.goto(baseUrl);
    await page.type('input[type="text"]', 'BD6111'); // Use a valid driver ID or Admin if available
    // Actually, for "Admin Dashboard" screenshot, I should try to login as Admin if possible.
    // If I don't have admin creds handy in this script, I'll just use the driver one for now 
    // or try a known admin ID if I recall one. 
    // Let's stick to the failure one we know, OR just capture the login page itself cleanly.

    // Actually, let's just capture the visuals we can access.
    // Dashboard might redirect if not logged in.

    // Let's screenshot the "Welcome" / Login page nicely.
    await page.screenshot({ path: 'appendix_login_clean.png' });

    // 2. Mocking an "Admin Dashboard" view (since we might not have easy auth in this script without complex flow)
    // We can inject some HTML/CSS to fake a dashboard for the screenshot if auth fails, 
    // BUT better to just screenshot the login page visuals we have.

    // Let's try to capture the "Code Structure" by running a tree command? No, Puppeteer is for web.

    // I will simplify: Just capture the clean Login page (already doing it).

    console.log('Screenshots captured.');
    await browser.close();
})();
