'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MagnifierIcon } from './icons';

export function SearchInput({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  return (
    <div className="search-page-input">
      <MagnifierIcon size={14} />
      <input
        type="text"
        value={query}
        autoFocus={initialQuery === ''}
        placeholder="Search articles and projects…"
        aria-label="Search"
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && query.trim().length >= 2) {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
          }
        }}
      />
    </div>
  );
}
