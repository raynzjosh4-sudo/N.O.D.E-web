import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1.00001, viewport-fit=cover"
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
