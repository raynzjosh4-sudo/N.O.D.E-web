import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

const APP_NAME = "N.O.D.E. Wholesale";
const APP_FULL_NAME = "National Order and Distribution Exchanges";
const APP_TITLE = `${APP_NAME} — ${APP_FULL_NAME} | Uganda B2B Wholesale Marketplace`;
const APP_DESC = "N.O.D.E. (National Order and Distribution Exchanges) connects retailers, institutions, and traders across Uganda directly with verified wholesale suppliers, manufacturers, and importers in Kampala. Access bulk tier pricing, verified inventory, escrow protection, and minimum order quantities.";
const APP_URL = "https://node.crimchart.com";
const APP_ICON = `${APP_URL}/nodeicon_full.png`;

export default function Root({ children }: PropsWithChildren) {
  const schemaOrg = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${APP_URL}/#website`,
        "url": APP_URL,
        "name": APP_NAME,
        "alternateName": ["N.O.D.E.", "NODE Wholesale", APP_FULL_NAME],
        "description": APP_DESC,
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${APP_URL}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Organization",
        "@id": `${APP_URL}/#organization`,
        "name": "N.O.D.E. Wholesale Network",
        "alternateName": APP_FULL_NAME,
        "url": APP_URL,
        "logo": APP_ICON,
        "image": APP_ICON,
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
        "image": APP_ICON,
        "screenshot": APP_ICON,
        "description": "Official wholesale marketplace application for National Order and Distribution Exchanges (N.O.D.E.).",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "UGX"
        }
      },
      {
        "@type": "ItemList",
        "name": "N.O.D.E. Wholesale Navigation",
        "itemListElement": [
          {
            "@type": "SiteNavigationElement",
            "position": 1,
            "name": "Explore Wholesale Products",
            "url": `${APP_URL}/explore`
          },
          {
            "@type": "SiteNavigationElement",
            "position": 2,
            "name": "Verified Suppliers Directory",
            "url": `${APP_URL}/suppliers`
          },
          {
            "@type": "SiteNavigationElement",
            "position": 3,
            "name": "Wholesale Trading Terms & MOQs",
            "url": `${APP_URL}/terms`
          },
          {
            "@type": "SiteNavigationElement",
            "position": 4,
            "name": "Privacy Policy & Legal Portal",
            "url": "https://raynzjosh4-sudo.github.io/N.O.D.E.T/"
          }
        ]
      }
    ]
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1.00001, viewport-fit=cover"
        />

        <title>{APP_TITLE}</title>
        <meta name="title" content={APP_TITLE} />
        <meta name="description" content={APP_DESC} />
        <meta name="google-site-verification" content="uteCDPNtn4l-xAMk1xTZ1qOP8zDoABq96chhXfdMqKc" />
        <meta name="keywords" content="NODE, N.O.D.E., NODE Wholesale, National Order and Distribution Exchanges, wholesale Uganda, Kampala wholesale, bulk buying, B2B wholesale marketplace, verified suppliers, wholesale prices, trading terms, escrow" />
        <link rel="canonical" href={APP_URL} />

        {/* Google Identity Services SDK for instant Google Sign-In */}
        <script src="https://accounts.google.com/gsi/client" async defer></script>

        {/* Favicons & App Icons */}
        <link rel="icon" type="image/png" href="/nodeicon_full.png" />
        <link rel="apple-touch-icon" href="/nodeicon_full.png" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Open Graph / Facebook / WhatsApp */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={`${APP_NAME} — ${APP_FULL_NAME}`} />
        <meta property="og:url" content={APP_URL} />
        <meta property="og:title" content={APP_TITLE} />
        <meta property="og:description" content={APP_DESC} />
        <meta property="og:image" content={APP_ICON} />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        <meta property="og:image:alt" content="N.O.D.E. Wholesale Icon" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={APP_TITLE} />
        <meta name="twitter:description" content={APP_DESC} />
        <meta name="twitter:image" content={APP_ICON} />

        {/* Google Schema.org JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
        />

        {/* Android Chrome Theme Color & Navigation Bar Color */}
        <meta name="theme-color" content="#0D1117" />
        {/* iOS Web App Status Bar Style */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{
          __html: `
            /* Comic Relief Font from Dart Flutter App */
            @font-face {
              font-family: 'Comic Relief';
              src: url('/fonts/Comic_Relief/ComicRelief-Regular.ttf') format('truetype');
              font-weight: normal;
              font-style: normal;
              font-display: swap;
            }
            @font-face {
              font-family: 'Comic Relief';
              src: url('/fonts/Comic_Relief/ComicRelief-Bold.ttf') format('truetype');
              font-weight: 700;
              font-style: normal;
              font-display: swap;
            }

            /* React Native Web font aliases to Google Fonts */
            @font-face {
              font-family: 'Outfit_400Regular';
              src: local('Outfit'), url('https://fonts.googleapis.com/css2?family=Outfit:wght@400');
              font-weight: 400;
            }
            @font-face {
              font-family: 'Outfit_500Medium';
              src: local('Outfit Medium'), local('Outfit');
              font-weight: 500;
            }
            @font-face {
              font-family: 'Outfit_600SemiBold';
              src: local('Outfit SemiBold'), local('Outfit');
              font-weight: 600;
            }
            @font-face {
              font-family: 'Outfit_700Bold';
              src: local('Outfit Bold'), local('Outfit');
              font-weight: 700;
            }
            @font-face {
              font-family: 'Outfit_800ExtraBold';
              src: local('Outfit ExtraBold'), local('Outfit');
              font-weight: 800;
            }
            @font-face {
              font-family: 'Outfit_900Black';
              src: local('Outfit Black'), local('Outfit');
              font-weight: 900;
            }
            @font-face {
              font-family: 'PlusJakartaSans_400Regular';
              src: local('Plus Jakarta Sans'), local('PlusJakartaSans');
              font-weight: 400;
            }
            @font-face {
              font-family: 'PlusJakartaSans_500Medium';
              src: local('Plus Jakarta Sans Medium'), local('PlusJakartaSans');
              font-weight: 500;
            }
            @font-face {
              font-family: 'PlusJakartaSans_600SemiBold';
              src: local('Plus Jakarta Sans SemiBold'), local('PlusJakartaSans');
              font-weight: 600;
            }
            @font-face {
              font-family: 'PlusJakartaSans_700Bold';
              src: local('Plus Jakarta Sans Bold'), local('PlusJakartaSans');
              font-weight: 700;
            }

            /* Default Typography matching Dart/Flutter app */
            html, body, #root, input, textarea, button, select {
              height: 100%;
              width: 100%;
              background-color: #0D1117 !important;
              color: #C9D1D9;
              font-family: 'Plus Jakarta Sans', 'Outfit', 'Comic Relief', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              overscroll-behavior-y: none;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
            }
          `,
        }} />
      </head>
      <body style={{ backgroundColor: '#0D1117', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
