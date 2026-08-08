import type { SearchResults } from './types';

/**
 * Browser-side search calls (popup typeahead). NEXT_PUBLIC_* values are inlined
 * at build time, so the literal reference below is required.
 */
export function publicApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_API_URL');
  }
  return url;
}

export async function searchPosts(
  query: string,
  per: number,
  signal?: AbortSignal,
): Promise<SearchResults> {
  const params = new URLSearchParams({ q: query, per: String(per), page: '1' });
  const res = await fetch(`${publicApiUrl()}/api/search?${params}`, { signal });
  if (!res.ok) {
    throw new Error(`Search responded ${res.status}`);
  }
  return res.json() as Promise<SearchResults>;
}
