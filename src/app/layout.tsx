import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import '@/styles/globals.css';

/**
 * Deliberately API-free: fonts, theme and global styles only. Everything that
 * needs the API (site config, header, footer) lives in the (site) layout, so
 * routes outside that group — /maintenance above all — still render while the
 * API is down mid-deploy.
 */

// Every route renders on request; data comes from Next's tag-invalidated fetch
// cache (see lib/api.ts), so builds never require a running API.
export const dynamic = 'force-dynamic';

// Self-hosted (latin subsets vendored in src/fonts): next/font/google fetches
// from fonts.gstatic.com at build time, which the CI docker build cannot rely
// on — Google throttles runner IPs and the whole image build fails.
const serif = localFont({
  src: [
    { path: '../fonts/ibm-plex-serif-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/ibm-plex-serif-latin-400-italic.woff2', weight: '400', style: 'italic' },
    { path: '../fonts/ibm-plex-serif-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/ibm-plex-serif-latin-500-italic.woff2', weight: '500', style: 'italic' },
    { path: '../fonts/ibm-plex-serif-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/ibm-plex-serif-latin-600-italic.woff2', weight: '600', style: 'italic' },
  ],
  variable: '--font-serif',
  display: 'swap',
});

const sans = localFont({
  src: [
    { path: '../fonts/ibm-plex-sans-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/ibm-plex-sans-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/ibm-plex-sans-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
});

const mono = localFont({
  src: [
    { path: '../fonts/jetbrains-mono-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/jetbrains-mono-latin-400-italic.woff2', weight: '400', style: 'italic' },
    { path: '../fonts/jetbrains-mono-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/jetbrains-mono-latin-500-italic.woff2', weight: '500', style: 'italic' },
    { path: '../fonts/jetbrains-mono-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../fonts/jetbrains-mono-latin-700-italic.woff2', weight: '700', style: 'italic' },
  ],
  variable: '--font-mono',
  display: 'swap',
});

// Runs before first paint: resolves the persisted or system theme, so there is
// no flash of the wrong theme.
const THEME_SCRIPT = `(function(){var t;try{t=localStorage.getItem('theme')}catch(e){}if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)})()`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {children}
      </body>
    </html>
  );
}
