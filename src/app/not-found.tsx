import Link from 'next/link';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { getSiteConfig } from '@/lib/api';

/**
 * Catches both unmatched URLs and notFound() from the (site) routes. It sits
 * at the root, above the (site) layout, so it builds the shell itself — by the
 * time a 404 can render at all, the middleware has already vouched for the API
 * being reachable.
 */

// Absolute: this renders both above and below the (site) layout's title
// template, so opting out of templates entirely is the only consistent shape.
export const metadata = { title: { absolute: '404 · Mikhail Bahdashych' } };

/** The resident, equally unable to find that page. */
const PET = ' /\\_/\\\n( o.O )?\n > ^ <';

export default async function NotFound() {
  const config = await getSiteConfig();

  return (
    <div className="shell">
      <Header />
      <main className="status-page">
        <pre className="status-art" aria-hidden="true">
          {PET}
        </pre>
        <p className="status-code">zsh: no such file or directory</p>
        <h1 className="status-title">404</h1>
        <p className="status-text">
          Nothing lives at this address. Head <Link href="/">home</Link> or browse{' '}
          <Link href="/blog">all posts</Link>.
        </p>
      </main>
      <Footer config={config} />
    </div>
  );
}
