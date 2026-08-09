import { EmptyState } from '@/components/empty-state';
import { Pagination } from '@/components/pagination';
import { PostRow } from '@/components/post-row';
import { getPosts } from '@/lib/api';
import { PER_PAGE_OPTIONS } from '@/lib/format';
import type { PostType } from '@/lib/types';

/**
 * ?page=&per= come from the address bar, so anything malformed simply falls
 * back to defaults instead of erroring.
 */
export function parseListingParams(params: { page?: string; per?: string }): {
  page: number;
  per: number;
} {
  const page = Number(params.page);
  const per = Number(params.per);
  return {
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    per: (PER_PAGE_OPTIONS as readonly number[]).includes(per) ? per : 10,
  };
}

interface Props {
  type: PostType;
  title: string;
  basePath: string;
  page: number;
  per: number;
}

export async function Listing({ type, title, basePath, page, per }: Props) {
  const list = await getPosts(type, page, per);

  return (
    <>
      <h1 className="page-title">{title}</h1>
      {list.total === 0 ? (
        <EmptyState>Nothing here yet.</EmptyState>
      ) : (
        <>
          <div className="post-list listing reveal">
            {list.items.map((post) => (
              <PostRow key={post.slug} post={post} />
            ))}
          </div>
          <Pagination basePath={basePath} total={list.total} page={page} per={per} />
        </>
      )}
    </>
  );
}
