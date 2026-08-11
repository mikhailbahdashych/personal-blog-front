import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState } from '@/components/empty-state';
import { SearchInput } from '@/components/search-input';
import { searchServer } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import { keepOnlyMarkTags } from '@/lib/sanitize';

export const metadata: Metadata = {
  title: 'Search',
  robots: { index: false },
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q ?? '').trim().slice(0, 100);
  const results = query.length >= 2 ? await searchServer(query, 1, 50) : null;

  return (
    <>
      <div className="search-page-head">
        <SearchInput initialQuery={query} />
        {results && (
          <p className="result-count">
            {results.total} result{results.total === 1 ? '' : 's'}
          </p>
        )}
      </div>

      {results && results.total === 0 && (
        <EmptyState>
          Nothing here. Try a different query, or browse <Link href="/blog">all posts</Link>.
        </EmptyState>
      )}

      {results && results.total > 0 && (
        <div className="post-list search-page-results">
          {results.items.map((item) => (
            <article className="post-row" key={`${item.type}-${item.slug}`}>
              <div>
                <Link
                  href={item.type === 'article' ? `/blog/${item.slug}` : `/projects/${item.slug}`}
                  className="post-title search-result-title"
                  dangerouslySetInnerHTML={{ __html: keepOnlyMarkTags(item.titleHtml) }}
                />
                <p
                  className="post-desc"
                  dangerouslySetInnerHTML={{ __html: keepOnlyMarkTags(item.snippetHtml) }}
                />
              </div>
              <span className="post-meta">{fmtDate(item.publishedAt)}</span>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
