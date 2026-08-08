import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Serif, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { getSiteConfig } from '@/lib/api';
import '@/styles/globals.css';

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

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  return {
    title: {
      default: config.seoDefaultTitle,
      template: '%s · Mikhail Bahdashych',
    },
    description: config.seoDefaultDescription,
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const config = await getSiteConfig();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <div className="shell">
          <Header />
          <main>{children}</main>
          <Footer config={config} />
        </div>
      </body>
    </html>
  );
}
