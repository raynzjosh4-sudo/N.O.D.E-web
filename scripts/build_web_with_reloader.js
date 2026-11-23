const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 [1/4] Exporting Expo Web build to dist/ ...');
execSync('npx expo export --platform web --output-dir dist', { stdio: 'inherit' });

const distDir = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');
const notFoundPath = path.join(distDir, '404.html');
const versionPath = path.join(distDir, 'version.json');
const cnamePath = path.join(distDir, 'CNAME');
const nojekyllPath = path.join(distDir, '.nojekyll');

const now = Date.now();
const versionData = {
  version: '1.0.0',
  buildTimestamp: now,
  buildTimeISO: new Date(now).toISOString(),
};

console.log(`📦 [2/4] Generating version.json with buildTimestamp: ${now} ...`);
fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));

console.log('🛡️ [3/4] Injecting anti-caching & reloader meta tags into index.html ...');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');

  // Anti-caching tags
  const cacheTags = `
    <!-- Anti-cache meta headers for instant web app updates -->
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <meta name="app-build-time" content="${now}" />
  `;

  if (html.includes('<head>')) {
    html = html.replace('<head>', `<head>${cacheTags}`);
  }

  fs.writeFileSync(indexPath, html);
  // Duplicate to 404.html for Expo Router SPA routing on GitHub Pages
  fs.writeFileSync(notFoundPath, html);
}

console.log('🌐 [4/4] Writing CNAME & .nojekyll ...');
fs.writeFileSync(cnamePath, 'node.crimchart.com');
fs.writeFileSync(nojekyllPath, '');

console.log('✅ Web build ready with auto-reloader & cache-busting headers!');
