import Link from 'next/link';
import { PostRow } from '@/components/post-row';
import { getFeatured, getSiteConfig } from '@/lib/api';

export default async function HomePage() {
  const [config, articles, projects] = await Promise.all([
    getSiteConfig(),
    getFeatured('article'),
    getFeatured('project'),
  ]);

  return (
    <>
      <h1 className="hero-title">{config.heroTitle}</h1>
      <p className="hero-intro">{config.heroIntroMd}</p>

      <section className="home-section">
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
    </>
  );
}
