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
  //
  // The control is also locked while that request is in flight. Starting a
  // second navigation before the first lands leaves two of them racing to
  // commit, and the loser can be the one that matches the address bar.
  const [pending, startTransition] = useTransition();
  const totalPages = Math.max(1, Math.ceil(total / per));
  const href = (p: number, perValue = per) => `${basePath}?page=${p}&per=${perValue}`;

  // While a navigation is in flight, page links become inert spans so a second
  // one cannot be started on top of it.
  const navLink = (p: number, label: string, extra = '') =>
    pending ? (
      <span key={label + p} className={`page-btn disabled ${extra}`.trim()}>
        {label}
      </span>
    ) : (
      <Link key={label + p} className={`page-btn ${extra}`.trim()} href={href(p)}>
        {label}
      </Link>
    );

  return (
    <div className={pending ? 'pagination is-pending' : 'pagination'} aria-busy={pending}>
      <label className="per-select">
        <span>per page</span>
        <span className="per-chip">
          <select
            value={per}
            aria-label="Results per page"
            disabled={pending}
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
          navLink(page - 1, '\u2039')
        ) : (
          <span className="page-btn disabled" aria-hidden="true">
            &lsaquo;
          </span>
        )}
        {pageNumbers(totalPages, page).map((n, i) =>
          n === '…' ? (
            <span key={`gap-${i}`} className="page-ellipsis">
              …
            </span>
          ) : n === page ? (
            <span key={n} className="page-btn active" aria-current="page">
              {n}
            </span>
          ) : (
            navLink(n, String(n))
          ),
        )}
        {page < totalPages ? (
          navLink(page + 1, '\u203a')
        ) : (
          <span className="page-btn disabled" aria-hidden="true">
            &rsaquo;
          </span>
        )}
      </nav>
    </div>
  );
}
