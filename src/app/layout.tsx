import { IBM_Plex_Sans, IBM_Plex_Serif, JetBrains_Mono } from 'next/font/google';
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

const serif = IBM_Plex_Serif({
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const sans = IBM_Plex_Sans({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
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
