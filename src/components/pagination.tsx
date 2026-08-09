'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { PER_PAGE_OPTIONS } from '@/lib/format';

/** 1 … around-current … last, per the mockup's pagination bar. */
function pageNumbers(totalPages: number, current: number): (number | '…')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const wanted = new Set([1, totalPages, current - 1, current, current + 1]);
  const pages: (number | '…')[] = [];
  let previous = 0;
  for (let n = 1; n <= totalPages; n += 1) {
    if (!wanted.has(n)) {
      continue;
    }
    if (n - previous > 1) {
      pages.push('…');
    }
    pages.push(n);
    previous = n;
  }
  return pages;
}

interface Props {
  basePath: string;
  total: number;
  page: number;
  per: number;
}

export function Pagination({ basePath, total, page, per }: Props) {
  const router = useRouter();
  // Changing the page size is a server round trip. Without a pending state the
  // bar looks inert — and on a short list, where the row count does not visibly
  // change, it looks like the control did nothing at all.
  const [pending, startTransition] = useTransition();
  const totalPages = Math.max(1, Math.ceil(total / per));
  const href = (p: number, perValue = per) => `${basePath}?page=${p}&per=${perValue}`;

  return (
    <div className={pending ? 'pagination is-pending' : 'pagination'} aria-busy={pending}>
      <label className="per-select">
        <span>per page</span>
        <span className="per-chip">
          <select
            value={per}
            aria-label="Results per page"
            onChange={(event) => {
              const next = Number(event.target.value);
              startTransition(() => router.push(href(1, next)));
            }}
          >
            {PER_PAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <svg
            width="9"
            height="9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </label>

      <nav className="page-nav" aria-label="Pagination">
        {page > 1 ? (
          <Link className="page-btn" href={href(page - 1)} aria-label="Previous page">
            ‹
          </Link>
        ) : (
          <span className="page-btn disabled" aria-hidden="true">
            ‹
          </span>
        )}
        {pageNumbers(totalPages, page).map((n, i) =>
          n === '…' ? (
            <span key={`gap-${i}`} className="page-ellipsis">
              …
            </span>
          ) : (
            <Link
              key={n}
              className={n === page ? 'page-btn active' : 'page-btn'}
              href={href(n)}
              aria-current={n === page ? 'page' : undefined}
            >
              {n}
            </Link>
          ),
        )}
        {page < totalPages ? (
          <Link className="page-btn" href={href(page + 1)} aria-label="Next page">
            ›
          </Link>
        ) : (
          <span className="page-btn disabled" aria-hidden="true">
            ›
          </span>
        )}
      </nav>
    </div>
  );
}
