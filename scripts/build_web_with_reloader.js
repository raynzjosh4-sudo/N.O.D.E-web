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

console.log('🛡️ [3/4] Injecting anti-caching, SEO metadata, JSON-LD & crawler fallback into index.html ...');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');

  // Complete SEO, OpenGraph, JSON-LD, and Google Identity meta tags
  const seoAndCacheTags = `
    <!-- Anti-cache meta headers for instant web app updates -->
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <meta name="app-build-time" content="${now}" />

    <!-- Search Engine Optimization (SEO) & Web Crawler Indexing -->
    <meta name="title" content="N.O.D.E. Wholesale — National Online Distribution &amp; Enterprise | Uganda B2B Wholesale Marketplace" />
    <meta name="description" content="N.O.D.E. (National Online Distribution &amp; Enterprise) connects retailers, institutions, and traders across Uganda directly with verified wholesale suppliers, manufacturers, and importers in Kampala. Access bulk tier pricing, verified inventory, escrow protection, and minimum order quantities." />
    <meta name="keywords" content="NODE, N.O.D.E., NODE Wholesale, National Online Distribution and Enterprise, wholesale Uganda, Kampala wholesale, bulk buying, B2B wholesale marketplace, verified suppliers, wholesale prices, trading terms, escrow, electronics wholesale, solar wholesale, apparel wholesale, Kampala distributors" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta name="googlebot" content="index, follow" />
    <meta name="google-site-verification" content="uteCDPNtn4l-xAMk1xTZ1qOP8zDoABq96chhXfdMqKc" />
    <link rel="canonical" href="https://node.crimchart.com" />

    <!-- Google Identity Services SDK for instant Google Sign-In -->
    <script src="https://accounts.google.com/gsi/client" async defer></script>

    <!-- Open Graph / Facebook / WhatsApp Preview -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="N.O.D.E. Wholesale — National Online Distribution &amp; Enterprise" />
    <meta property="og:url" content="https://node.crimchart.com" />
    <meta property="og:title" content="N.O.D.E. Wholesale — National Online Distribution &amp; Enterprise | Uganda B2B Wholesale Marketplace" />
    <meta property="og:description" content="Connect directly with verified wholesale suppliers, manufacturers, and importers in Kampala, Uganda. Bulk tier pricing, verified stock, and escrow protection." />
    <meta property="og:image" content="https://node.crimchart.com/nodeicon_full.png" />
    <meta property="og:image:width" content="512" />
    <meta property="og:image:height" content="512" />
    <meta property="og:image:alt" content="N.O.D.E. Wholesale Marketplace Icon" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="N.O.D.E. Wholesale — National Online Distribution &amp; Enterprise | Uganda B2B Marketplace" />
    <meta name="twitter:description" content="Uganda's verified B2B wholesale platform connecting retail businesses with manufacturers and wholesale distributors." />
    <meta name="twitter:image" content="https://node.crimchart.com/nodeicon_full.png" />

    <!-- Schema.org Structured Data JSON-LD for Google & Search Crawlers -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": "https://node.crimchart.com/#website",
          "url": "https://node.crimchart.com",
          "name": "N.O.D.E. Wholesale",
          "alternateName": ["N.O.D.E.", "NODE Wholesale", "National Online Distribution & Enterprise"],
          "description": "N.O.D.E. (National Online Distribution & Enterprise) connects retailers, institutions, and traders across Uganda directly with verified wholesale suppliers, manufacturers, and importers in Kampala. Access bulk tier pricing, verified inventory, escrow protection, and minimum order quantities.",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://node.crimchart.com/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        },
        {
          "@type": "Organization",
          "@id": "https://node.crimchart.com/#organization",
          "name": "N.O.D.E. Wholesale Network",
          "alternateName": "National Online Distribution & Enterprise",
          "url": "https://node.crimchart.com",
          "logo": "https://node.crimchart.com/nodeicon_full.png",
          "image": "https://node.crimchart.com/nodeicon_full.png",
          "description": "B2B wholesale distribution platform linking retail businesses with manufacturers and wholesale distributors across Uganda.",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Kampala",
            "addressCountry": "Uganda"
          }
        },
        {
          "@type": "SoftwareApplication",
          "name": "N.O.D.E. Wholesale App",
          "operatingSystem": "Web, Android, iOS",
          "applicationCategory": "BusinessApplication",
          "applicationSubCategory": "ShoppingApplication",
          "image": "https://node.crimchart.com/nodeicon_full.png",
          "description": "Official wholesale marketplace application for National Online Distribution & Enterprise (N.O.D.E.).",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "UGX"
          }
        },
        {
          "@type": "ItemList",
          "name": "N.O.D.E. Wholesale Categories & Services",
          "itemListElement": [
            { "@type": "SiteNavigationElement", "position": 1, "name": "Explore Wholesale Products", "url": "https://node.crimchart.com/explore" },
            { "@type": "SiteNavigationElement", "position": 2, "name": "Verified Suppliers Directory", "url": "https://node.crimchart.com/suppliers" },
            { "@type": "SiteNavigationElement", "position": 3, "name": "Wholesale Trading Terms & MOQs", "url": "https://node.crimchart.com/terms" },
            { "@type": "SiteNavigationElement", "position": 4, "name": "Privacy Policy & Escrow Guarantee", "url": "https://node.crimchart.com/privacy" }
          ]
        }
      ]
    }
    </script>
  `;

  // Replace default bare title with full rich SEO title
  html = html.replace(/<title>.*?<\/title>/i, '<title>N.O.D.E. Wholesale — National Online Distribution &amp; Enterprise | Uganda B2B Wholesale Marketplace</title>');

  if (html.includes('<head>')) {
    html = html.replace('<head>', `<head>${seoAndCacheTags}`);
  }

  // Replace empty noscript with rich crawlable semantic fallback for search engine bots
  const crawlableNoscript = `
    <noscript>
      <div style="max-width: 960px; margin: 40px auto; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E6EDF3; background-color: #0D1117; border-radius: 12px; border: 1px solid #30363D;">
        <header style="border-bottom: 1px solid #30363D; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="color: #58A6FF; font-size: 26px; margin: 0 0 8px 0;">N.O.D.E. Wholesale — National Online Distribution &amp; Enterprise</h1>
          <p style="font-size: 16px; color: #8B949E; margin: 0;">Uganda's Leading B2B Wholesale Marketplace &amp; Verified Importers Network</p>
        </header>

        <section style="margin-bottom: 28px;">
          <h2 style="color: #FFFFFF; font-size: 20px;">Direct Wholesale Buying in Kampala &amp; Across Uganda</h2>
          <p style="line-height: 1.7; color: #C9D1D9;">
            <strong>National Online Distribution &amp; Enterprise (N.O.D.E.)</strong> connects retail shops, enterprises, institutions, and independent traders across Uganda directly with verified manufacturers, importers, and bulk distributors based in Kampala (including Kikuubo Commercial District, Nalukolongo, and Central Kampala warehouses).
          </p>
          <p style="line-height: 1.7; color: #C9D1D9;">
            Buyers benefit from transparent wholesale price tiers in Ugandan Shillings (UGX), verified warehouse stock quantities, minimum order quantities (MOQs), secure escrow payment protection, and same-day warehouse clearance.
          </p>
        </section>

        <section style="margin-bottom: 28px;">
          <h2 style="color: #FFFFFF; font-size: 20px;">Wholesale Catalog Categories</h2>
          <ul style="line-height: 1.8; color: #C9D1D9;">
            <li><strong>Electronics &amp; Commercial Appliances:</strong> Commercial food blenders, television screens, soundbars, audio equipment, kitchen appliances, and replacement parts.</li>
            <li><strong>Solar Energy &amp; Electrical Supplies:</strong> Monocrystalline solar panels, hybrid inverters, deep-cycle lithium batteries, solar home kits, and commercial wiring.</li>
            <li><strong>Computing, IT &amp; Office Equipment:</strong> Wholesale business laptops, desktops, computer accessories, monitors, and networking gear.</li>
            <li><strong>Fashion, Shoes &amp; Textiles:</strong> Men's and women's apparel, footwear, wholesale fabric rolls, denier textiles, and accessories.</li>
            <li><strong>Wholesale Groceries &amp; Fast-Moving Goods (FMCG):</strong> Bulk rice, cooking oil, grains, and non-perishable packaged consumer goods.</li>
          </ul>
        </section>

        <section style="margin-bottom: 28px;">
          <h2 style="color: #FFFFFF; font-size: 20px;">Platform Features &amp; Protections</h2>
          <ul style="line-height: 1.8; color: #C9D1D9;">
            <li><strong>Escrow Guarantee:</strong> Buyer funds are safely held in escrow until inventory is inspected and confirmed at the supplier warehouse.</li>
            <li><strong>Direct Supplier Invoicing:</strong> Official downloadable PDF order specification sheets and pro-forma invoices generated automatically upon order placement.</li>
            <li><strong>Volume Price Tiers:</strong> Verified wholesale discounts configured per carton, box, or bulk quantity threshold.</li>
          </ul>
        </section>

        <footer style="border-top: 1px solid #30363D; padding-top: 18px; margin-top: 32px;">
          <h3 style="color: #FFFFFF; font-size: 16px;">Browse N.O.D.E. Wholesale Navigation</h3>
          <p style="line-height: 2;">
            <a href="https://node.crimchart.com/explore" style="color: #58A6FF; margin-right: 18px;">Explore Products</a>
            <a href="https://node.crimchart.com/suppliers" style="color: #58A6FF; margin-right: 18px;">Verified Suppliers Directory</a>
            <a href="https://node.crimchart.com/terms" style="color: #58A6FF; margin-right: 18px;">Wholesale Trading Terms</a>
            <a href="https://node.crimchart.com/privacy" style="color: #58A6FF; margin-right: 18px;">Privacy Policy &amp; Escrow</a>
            <a href="https://node.crimchart.com/login" style="color: #58A6FF; margin-right: 18px;">Supplier / Buyer Sign In</a>
            <a href="https://node.crimchart.com/signup" style="color: #58A6FF;">Register Business</a>
          </p>
          <p style="color: #8B949E; font-size: 13px; margin-top: 12px;">&copy; 2026 N.O.D.E. Wholesale (National Online Distribution &amp; Enterprise). Kampala, Uganda.</p>
        </footer>
      </div>
    </noscript>
  `;

  if (html.includes('<noscript>')) {
    html = html.replace(/<noscript>[\s\S]*?<\/noscript>/i, crawlableNoscript);
  } else if (html.includes('<body>')) {
    html = html.replace('<body>', `<body>${crawlableNoscript}`);
  }

  // Inject immediate animated skeleton shimmer inside #root with crawler-indexed semantic outline
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
        .crawler-context {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
      </style>
      <div class="crawler-context">
        <h1>N.O.D.E. Wholesale — National Online Distribution &amp; Enterprise Uganda</h1>
        <p>B2B wholesale marketplace connecting retailers, traders, and institutions in Uganda directly with verified manufacturers, importers, and suppliers in Kampala. Bulk tier pricing, verified warehouse stock, escrow protection, and wholesale order specification sheet PDF downloads.</p>
      </div>
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
