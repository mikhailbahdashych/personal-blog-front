import Link from 'next/link';
import { JsonLd } from '@/components/json-ld';
import { TocCard } from '@/components/toc-card';
import { getSiteConfig } from '@/lib/api';
import { fmtDate, fmtYear } from '@/lib/format';
import { renderMarkdown } from '@/lib/markdown';
import { personJsonLd, siteUrl } from '@/lib/seo';
import type { Post } from '@/lib/types';

/** Shared template for article and project detail pages (mockup screen 4b). */
export async function PostDetail({ post }: { post: Post }) {
  const [{ html, toc }, config] = await Promise.all([
    renderMarkdown(post.contentMd),
    getSiteConfig(),
  ]);
  const isArticle = post.type === 'article';
  const url = `${siteUrl()}/${isArticle ? 'blog' : 'projects'}/${post.slug}`;
  const author = personJsonLd(config.socialLinks);

  const jsonLd = isArticle
    ? {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        author,
        url,
        mainEntityOfPage: url,
        ...(post.heroUrl ? { image: post.heroUrl } : {}),
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'SoftwareSourceCode',
        name: post.title,
        description: post.excerpt,
        url,
        author,
        ...(post.repoUrl ? { codeRepository: post.repoUrl } : {}),
      };

  return (
    <article>
      <JsonLd data={jsonLd} />
      <div className="post-meta-row">
        {isArticle ? (
          <>
            <span>{fmtDate(post.publishedAt)}</span>
            <span>·</span>
            <span>{post.readingTimeMin} min read</span>
          </>
        ) : (
          <>
            <span>{fmtYear(post.publishedAt)}</span>
            {post.repoUrl && (
              <>
                <span>·</span>
                <a href={post.repoUrl} rel="noopener" target="_blank">
                  github ↗
                </a>
              </>
            )}
          </>
        )}
        {post.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>

      <h1 className="post-h1">{post.title}</h1>
      <TocCard toc={toc} />
      <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />

      <footer className="post-footer">
        <Link href={isArticle ? '/blog' : '/projects'}>
          ↑ {isArticle ? 'All posts' : 'All projects'}
        </Link>
      </footer>
    </article>
  );
}
