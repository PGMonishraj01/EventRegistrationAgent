const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'js', 'config.js');

console.log('--- Vercel Build-time Environment Injection (Frontend Scope) ---');
console.log('Target config file:', configPath);

if (fs.existsSync(configPath)) {
    let content = fs.readFileSync(configPath, 'utf8');
    const apiUrl = process.env.API_BASE_URL || '';
    
    if (apiUrl) {
        // Strip trailing slash if present
        const sanitizedUrl = apiUrl.replace(/\/$/, "");
        content = content.replaceAll('__API_BASE_URL__', sanitizedUrl);
        fs.writeFileSync(configPath, content, 'utf8');
        console.log(`Successfully injected API_BASE_URL: "${sanitizedUrl}"`);
    } else {
        console.log('Warning: No API_BASE_URL environment variable found. Using defaults.');
    }
} else {
    console.error('Error: config.js not found at', configPath);
    process.exit(1);
}
