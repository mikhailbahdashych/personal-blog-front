import Link from 'next/link';
import { JsonLd } from '@/components/json-ld';
import { TocCard } from '@/components/toc-card';
import { requireEnv } from '@/lib/env';
import { fmtDate, fmtYear } from '@/lib/format';
import { renderMarkdown } from '@/lib/markdown';
import type { Post } from '@/lib/types';

/** Shared template for article and project detail pages (mockup screen 4b). */
export async function PostDetail({ post }: { post: Post }) {
  const { html, toc } = await renderMarkdown(post.contentMd);
  const siteUrl = requireEnv('NEXT_PUBLIC_SITE_URL');
  const isArticle = post.type === 'article';
  const url = `${siteUrl}/${isArticle ? 'blog' : 'projects'}/${post.slug}`;

  const jsonLd = isArticle
    ? {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        author: { '@type': 'Person', name: 'Mikhail Bahdashych', url: siteUrl },
        url,
        ...(post.heroUrl ? { image: post.heroUrl } : {}),
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: post.title,
        description: post.excerpt,
        url,
        author: { '@type': 'Person', name: 'Mikhail Bahdashych', url: siteUrl },
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
