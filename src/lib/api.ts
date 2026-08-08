import { notFound } from 'next/navigation';
import { requireEnv } from './env';
import type { About, Post, PostList, PostType, SiteConfig, SlugEntry } from './types';

/**
 * Server-side API access. Every route is rendered dynamically (see the root
 * layout), but these fetches use Next's data cache: entries live until the API
 * invalidates their tag via /api/revalidate, with a 1h staleness fallback.
 */
async function apiFetch<T>(path: string, tags: string[], revalidate = 3600): Promise<T> {
  const res = await fetch(`${requireEnv('API_INTERNAL_URL')}/api${path}`, {
    next: { tags, revalidate },
  });
  if (res.status === 404) {
    notFound();
  }
  if (!res.ok) {
    throw new Error(`API ${path} responded ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function getSiteConfig(): Promise<SiteConfig> {
  return apiFetch('/config', ['config']);
}

export function getFeatured(type: PostType): Promise<PostList> {
  return apiFetch(`/posts?type=${type}&featured=true&page=1&per=10`, ['posts']);
}

export function getPosts(type: PostType, page: number, per: number): Promise<PostList> {
  return apiFetch(`/posts?type=${type}&page=${page}&per=${per}`, ['posts']);
}

export function getPost(slug: string): Promise<Post> {
  return apiFetch(`/posts/${encodeURIComponent(slug)}`, [`post:${slug}`]);
}

export function getAbout(): Promise<About> {
  return apiFetch('/about', ['about']);
}

export function getSlugs(): Promise<SlugEntry[]> {
  return apiFetch('/posts/slugs', ['posts']);
}
