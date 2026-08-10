import Link from 'next/link';
import type { CSSProperties } from 'react';
import { PostRow } from '@/components/post-row';
import { Terminal } from '@/components/terminal/terminal';
import { buildTerminalData } from '@/components/terminal/vfs';
import { getAbout, getFeatured, getSiteConfig, getSlugs } from '@/lib/api';
import { siteUrl } from '@/lib/seo';
import '@/styles/terminal.css';

/** The resident. Decoration only, hence aria-hidden where it is rendered. */
const PET = ' /\\_/\\\n( o.o )\n > ^ <';

export default async function HomePage() {
  const [config, about, articles, projects, slugs] = await Promise.all([
    getSiteConfig(),
    getAbout(),
    getFeatured('article'),
    getFeatured('project'),
    getSlugs(),
  ]);

  // The little shell beside the hero. It shares this page's data — nothing in
  // it is fetched separately or hardcoded beyond the jokes.
  const terminalData = buildTerminalData({
    host: new URL(siteUrl()).hostname,
    config,
    about,
    articles,
    projects,
    slugs,
    now: Date.now(),
  });

  return (
    <div className="home-grid">
      <div className="home-main">
        <h1 className="hero-title reveal">{config.heroTitle}</h1>
        <div className="hero-lede reveal" style={{ '--i': 1 } as CSSProperties}>
          <pre className="hero-pet" aria-hidden="true">
            {PET}
          </pre>
          <p className="hero-intro">{config.heroIntroMd}</p>
        </div>

        <Terminal data={terminalData} />
      </div>

      <aside className="home-side">
        <section className="home-section reveal" style={{ '--i': 3 } as CSSProperties}>
          <div className="section-row">
            <h2 className="micro-label">Featured articles</h2>
            <Link href="/blog" className="all-link">
              All articles →
            </Link>
          </div>
          <div className="post-list">
            {articles.items.map((post) => (
              <PostRow key={post.slug} post={post} />
            ))}
          </div>
        </section>

        <section className="home-section">
          <div className="section-row">
            <h2 className="micro-label">Featured projects</h2>
            <Link href="/projects" className="all-link">
              All projects →
            </Link>
          </div>
          <div className="post-list">
            {projects.items.map((post) => (
              <PostRow key={post.slug} post={post} />
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
