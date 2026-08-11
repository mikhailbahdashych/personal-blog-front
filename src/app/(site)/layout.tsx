import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { getSiteConfig } from '@/lib/api';
import { baseMetadata } from '@/lib/seo';

/** The whole public site: config-driven metadata and the header/footer shell. */

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  return baseMetadata(config);
}

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const config = await getSiteConfig();

  return (
    <div className="shell">
      <Header />
      <main>{children}</main>
      <Footer config={config} />
    </div>
  );
}
