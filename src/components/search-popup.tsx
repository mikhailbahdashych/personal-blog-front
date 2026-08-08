'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { searchPosts } from '@/lib/client-search';
import { fmtDate } from '@/lib/format';
import { keepOnlyMarkTags } from '@/lib/sanitize';
import type { SearchResultItem } from '@/lib/types';
import { MagnifierIcon } from './icons';

const POPUP_RESULTS = 8;
const DEBOUNCE_MS = 200;

function resultHref(item: SearchResultItem): string {
  return item.type === 'article' ? `/blog/${item.slug}` : `/projects/${item.slug}`;
}

export function SearchPopup() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SearchResultItem[]>([]);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setActive(-1);
  }, []);

  // Open on `/` anywhere outside a form field; close on Escape.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const inField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable;
      if (event.key === '/' && !inField && !open) {
        event.preventDefault();
        setOpen(true);
      } else if (event.key === 'Escape' && open) {
        close();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  // Focus the input and lock body scroll while open.
  useEffect(() => {
    if (!open) {
      return;
    }
    inputRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Debounced typeahead.
  useEffect(() => {
    if (!open) {
      return;
    }
    const q = query.trim();
    if (q.length < 2) {
      setItems([]);
      setActive(-1);
      return;
    }
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      searchPosts(q, POPUP_RESULTS, controller.signal)
        .then((results) => {
          setItems(results.items);
          setActive(-1);
        })
        .catch((err: Error) => {
          if (err.name !== 'AbortError') {
            throw err;
          }
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, open]);

  const go = (href: string) => {
    close();
    setQuery('');
    setItems([]);
    router.push(href);
  };

  const onInputKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((current) => Math.min(current + 1, items.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((current) => Math.max(current - 1, -1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (active >= 0 && items[active]) {
        go(resultHref(items[active]));
      } else if (query.trim().length >= 2) {
        go(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  // The search results page has its own input — no button there (per mockup).
  if (pathname === '/search') {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="search-btn"
        aria-label="Search"
        onClick={() => setOpen(true)}
      >
        <MagnifierIcon size={11} />
        <span>Search</span>
        <kbd className="search-kbd">/</kbd>
      </button>

      {open && (
        <div className="search-overlay" onClick={close} role="presentation">
          <div
            className="search-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="search-input-row">
              <MagnifierIcon size={14} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                placeholder="Search articles and projects…"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                role="combobox"
                aria-expanded={items.length > 0}
                aria-controls="search-popup-results"
                aria-activedescendant={active >= 0 ? `search-result-${active}` : undefined}
              />
            </div>

            {items.length > 0 && (
              <div id="search-popup-results" role="listbox" className="search-results-list">
                {items.map((item, index) => (
                  <button
                    type="button"
                    key={`${item.type}-${item.slug}`}
                    id={`search-result-${index}`}
                    role="option"
                    aria-selected={index === active}
                    className={index === active ? 'search-row active' : 'search-row'}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => go(resultHref(item))}
                  >
                    <span
                      className="search-row-title"
                      dangerouslySetInnerHTML={{ __html: keepOnlyMarkTags(item.titleHtml) }}
                    />
                    <span className="search-row-meta">
                      {fmtDate(item.publishedAt)} · {item.tags.join(', ')}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="search-panel-footer">
              <span>↵ all results</span>
              <span>esc close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
