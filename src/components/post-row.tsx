import Link from 'next/link';
import type { CSSProperties } from 'react';
import { fmtDate, fmtYear } from '@/lib/format';
import type { PostListItem } from '@/lib/types';

export function PostRow({ post, index = 0 }: { post: PostListItem; index?: number }) {
  const href = post.type === 'article' ? `/blog/${post.slug}` : `/projects/${post.slug}`;

  return (
    // --i drives the stagger in the reveal animation (see globals.css).
    <article className="post-row reveal" style={{ '--i': index } as CSSProperties}>
      <div>
        <Link href={href} className="post-title">
          {post.title}
        </Link>
        <p className="post-desc">{post.excerpt}</p>
        {post.tags.length > 0 && (
          <div className="tag-row">
            {post.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <span className="post-meta">
        {post.type === 'article' ? (
          <>
            {fmtDate(post.publishedAt)} · {post.readingTimeMin} min
          </>
        ) : (
          <>
            {fmtYear(post.publishedAt)}
            {post.repoUrl && (
              <>
                {' · '}
                <a href={post.repoUrl} rel="noopener" target="_blank">
                  github ↗
                </a>
              </>
            )}
          </>
        )}
      </span>
    </article>
  );
}
