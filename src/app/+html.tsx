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

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{
          __html: `
            html, body, #root {
              height: 100%;
              width: 100%;
              background-color: #0D1117 !important;
              color: #C9D1D9;
              overscroll-behavior-y: none;
              -webkit-font-smoothing: antialiased;
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
