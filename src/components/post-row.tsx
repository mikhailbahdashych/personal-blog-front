import Link from 'next/link';
import { fmtDate, fmtYear } from '@/lib/format';
import type { PostListItem } from '@/lib/types';

export function PostRow({ post }: { post: PostListItem }) {
  const href = post.type === 'article' ? `/blog/${post.slug}` : `/projects/${post.slug}`;

  return (
    <article className="post-row">
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
