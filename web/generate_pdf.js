const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Helper to convert image to base64
function toBase64(filePath) {
    try {
        const img = fs.readFileSync(filePath);
        return `data:image/png;base64,${img.toString('base64')}`;
    } catch (err) {
        console.error(`Error reading file ${filePath}:`, err);
        return ''; // Return empty string or placeholder if file missing
    }
}

(async () => {
    console.log('📄 Generating Project Appendix PDF (Base64 Mode)...');

    // Paths to images
    const artifactsDir = '/Users/susp3kt/.gemini/antigravity/brain/ad336312-4669-412e-9aa4-82b00f024a1f';

    // Load images as Base64
    const loginFailSrc = toBase64(path.join(artifactsDir, 'login_step2.png'));
    const loginCleanSrc = toBase64(path.join(artifactsDir, 'login_clean.png'));
    const erdSrc = toBase64(path.join(artifactsDir, 'erd_diagram.png'));
    const flowSrc = toBase64(path.join(artifactsDir, 'flow_diagram.png'));

    // Create HTML Content
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
            h1 { color: #006400; text-align: center; border-bottom: 2px solid #006400; padding-bottom: 10px; }
            h2 { color: #2E8B57; margin-top: 30px; border-bottom: 1px solid #ccc; }
            h3 { color: #555; }
            p { line-height: 1.6; }
            .img-container { text-align: center; margin: 20px 0; border: 1px solid #ddd; padding: 10px; box-shadow: 2px 2px 10px rgba(0,0,0,0.1); }
            img { max-width: 90%; height: auto; border-radius: 4px; }
            .code-block { background: #f4f4f4; padding: 10px; border-left: 4px solid #006400; font-family: monospace; overflow-x: auto; }
            .footer { text-align: center; font-size: 12px; color: #888; margin-top: 50px; }
        </style>
    </head>
    <body>
        <h1>MyFleet Project - Technical Appendix</h1>
        <p style="text-align: center;">Technical Documentation, Testing Evidence, and Architecture</p>

        <!-- SECURITY SECTION -->
        <h2>1. Security & API Architecture</h2>
        <p>This project implements robust security measures to protect user data and ensure secure communication.</p>
        
        <h3>Authentication Flow (JWT)</h3>
        <p>All private API endpoints are protected using <strong>JSON Web Tokens (JWT)</strong>. When a user logs in:</p>
        <ol>
            <li>Client sends credentials (<code>personalId</code>, <code>password</code>) via HTTPS.</li>
            <li>Backend validates credentials against the PostgreSQL database.</li>
            <li>If valid, a signed JWT is issued (expires in 7 days).</li>
            <li>Client stores the token securely (httpOnly cookies or secure storage) and attaches it to the <code>Authorization: Bearer</code> header for subsequent requests.</li>
        </ol>

        <h3>Password Protection</h3>
        <p>Passwords are never stored in plain text. We use <strong>Bcrypt</strong> for hashing with a configured salt round, ensuring that even if the database is compromised, user credentials remain secure.</p>
        
        <div class="code-block">
            // Example of bcrypt usage in Auth Controller<br>
            const isValidPassword = await bcrypt.compare(password, user.password);<br>
            if (!isValidPassword) throw new Error('Invalid credentials');
        </div>

        <!-- TESTING SECTION -->
        <h2 style="page-break-before: always;">2. Testing & Quality Assurance</h2>
        <p>We employ automated End-to-End (E2E) testing using <strong>Puppeteer</strong> to verify critical user flows.</p>
        
        <h3>Login Validation Test</h3>
        <p>The system prevents unauthorized access by validating credentials against the database.</p>
        
        <div class="img-container">
            <img src="${loginFailSrc}" alt="Login Failed Error">
            <p><em>Figure 2.1: System correctly rejecting invalid credentials with an error message.</em></p>
        </div>

        <!-- VISUALS SECTION -->
        <h2 style="page-break-before: always;">3. Interface & Architecture</h2>
        
        <h3>Web Administration</h3>
        <p>The Admin Dashboard provides a clean, responsive interface for managing the fleet.</p>
        <div class="img-container">
            <img src="${loginCleanSrc}" alt="Login Page">
            <p><em>Figure 3.1: Secure Login Portal for Administrators.</em></p>
        </div>

        <h3>Database Structure (ERD)</h3>
        <p>The application is backed by a relational PostgreSQL database managed via Prisma ORM.</p>
        <div class="img-container">
            <img src="${erdSrc}" alt="ERD Diagram">
            <p><em>Figure 3.2: Entity Relationship Diagram showing multi-tenant architecture.</em></p>
        </div>

        <h3>System Flow</h3>
        <div class="img-container">
            <img src="${flowSrc}" alt="Flow Diagram">
            <p><em>Figure 3.3: High-level data flow between components.</em></p>
        </div>

        <div class="footer">
            Generated automatically for MyFleet Documentation
        </div>
    </body>
    </html>
    `;

    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfPath = path.join(artifactsDir, 'PROJECT_APPENDIX.pdf');
    await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' }
    });

    await browser.close();
    console.log(`PDF Generated at: ${pdfPath}`);
})();
