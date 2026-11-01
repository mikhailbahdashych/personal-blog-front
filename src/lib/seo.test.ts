import { describe, expect, it } from 'vitest';
import { baseMetadata, listingCanonical, postMetadata } from './seo';

// Module level: describe bodies below run at collection time, before any hook.
process.env.NEXT_PUBLIC_SITE_URL = 'https://example.test';

const post = {
  type: 'article' as const,
  slug: 'hello',
  title: 'Hello',
  seoTitle: null,
  seoDescription: null,
  excerpt: 'Excerpt',
  heroUrl: null,
  publishedAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-02T00:00:00.000Z',
};

describe('baseMetadata', () => {
  const base = baseMetadata({ seoDefaultTitle: 'Home', seoDefaultDescription: 'Desc' });

  it("doesn't pin the home page's share tags onto every page", () => {
    // Next fills og:title/description per page; a url/title here leaked the
    // home page's onto /about, /blog and /projects.
    expect(base.openGraph).not.toHaveProperty('url');
    expect(base.openGraph).not.toHaveProperty('title');
    expect(base.openGraph).not.toHaveProperty('description');
    expect(base.twitter).not.toHaveProperty('title');
  });

  it('ships a share image and the RSS link', () => {
    expect(base.openGraph?.images).toEqual(['/og.png']);
    expect(base.alternates?.types).toEqual({ 'application/rss+xml': '/rss.xml' });
  });
});

describe('postMetadata', () => {
  it('falls back to the site image and keeps siteName and the feed link', () => {
    const meta = postMetadata(post);
    expect(meta.openGraph?.images).toEqual(['/og.png']);
    expect(meta.openGraph?.siteName).toBe('Mikhail Bahdashych');
    expect(meta.alternates).toEqual({
      canonical: '/blog/hello',
      types: { 'application/rss+xml': '/rss.xml' },
    });
  });

  it('prefers the hero image when there is one', () => {
    const meta = postMetadata({ ...post, heroUrl: 'https://cdn.test/hero.png' });
    expect(meta.openGraph?.images).toEqual(['https://cdn.test/hero.png']);
  });
});

describe('listingCanonical', () => {
  it('keeps page 1 bare and makes later pages self-canonical', () => {
    expect(listingCanonical('/blog', 1)).toBe('/blog');
    expect(listingCanonical('/blog', 3)).toBe('/blog?page=3');
  });
});
