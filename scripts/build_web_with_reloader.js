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

  // Inject immediate animated skeleton shimmer inside #root so users NEVER see a blank black page while JS loads
  const shimmerSkeleton = `
    <div id="root"><div class="node-boot-shimmer">
      <style>
        .node-boot-shimmer {
          width: 100%;
          max-width: 960px;
          margin: 0 auto;
          padding: 16px;
          box-sizing: border-box;
          background-color: #0D1117;
          min-height: 100vh;
        }
        .shimmer-pulse {
          background: linear-gradient(90deg, #161B22 0%, #222933 50%, #161B22 100%);
          background-size: 200% 100%;
          animation: nodeShimmer 1.3s infinite ease-in-out;
          border-radius: 8px;
        }
        @keyframes nodeShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .shimmer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-top: 8px;
        }
        .shimmer-logo { width: 110px; height: 32px; border-radius: 16px; }
        .shimmer-avatar { width: 38px; height: 38px; border-radius: 19px; }
        .shimmer-search { width: 100%; height: 46px; border-radius: 23px; margin-bottom: 18px; }
        .shimmer-banner { width: 100%; height: 160px; border-radius: 16px; margin-bottom: 20px; }
        .shimmer-row { display: flex; gap: 14px; margin-bottom: 24px; overflow: hidden; }
        .shimmer-circle { width: 56px; height: 56px; border-radius: 28px; flex-shrink: 0; }
        .shimmer-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .shimmer-card { height: 220px; border-radius: 14px; }
      </style>
      <div class="shimmer-header">
        <div class="shimmer-pulse shimmer-logo"></div>
        <div class="shimmer-pulse shimmer-avatar"></div>
      </div>
      <div class="shimmer-pulse shimmer-search"></div>
      <div class="shimmer-pulse shimmer-banner"></div>
      <div class="shimmer-row">
        <div class="shimmer-pulse shimmer-circle"></div>
        <div class="shimmer-pulse shimmer-circle"></div>
        <div class="shimmer-pulse shimmer-circle"></div>
        <div class="shimmer-pulse shimmer-circle"></div>
        <div class="shimmer-pulse shimmer-circle"></div>
      </div>
      <div class="shimmer-grid">
        <div class="shimmer-pulse shimmer-card"></div>
        <div class="shimmer-pulse shimmer-card"></div>
        <div class="shimmer-pulse shimmer-card"></div>
        <div class="shimmer-pulse shimmer-card"></div>
      </div>
    </div></div>
  `;

  if (html.includes('<div id="root"></div>')) {
    html = html.replace('<div id="root"></div>', shimmerSkeleton);
  } else if (/<div id="root"[^>]*><\/div>/i.test(html)) {
    html = html.replace(/<div id="root"[^>]*><\/div>/i, shimmerSkeleton);
  }

  fs.writeFileSync(indexPath, html);
  // Duplicate to 404.html for Expo Router SPA routing on GitHub Pages
  fs.writeFileSync(notFoundPath, html);
}

console.log('🌐 [4/4] Writing CNAME & .nojekyll ...');
fs.writeFileSync(cnamePath, 'node.crimchart.com');
fs.writeFileSync(nojekyllPath, '');

console.log('✅ Web build ready with auto-reloader & cache-busting headers!');
