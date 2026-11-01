import type { Metadata } from 'next';
import { requireEnv } from './env';

export const SITE_NAME = 'Mikhail Bahdashych';

/** Site-wide share image (public/og.png, 1200×630); posts with a hero image use that instead. */
const DEFAULT_OG_IMAGE = '/og.png';

export function siteUrl(): string {
  return requireEnv('NEXT_PUBLIC_SITE_URL');
}

/**
 * Canonical plus the RSS link. Next replaces `alternates` per page rather than
 * merging it, so every page that sets its canonical has to repeat the feed.
 */
export function pageAlternates(path: string): Metadata['alternates'] {
  return { canonical: path, types: { 'application/rss+xml': '/rss.xml' } };
}

/** Page 1 is the bare listing; later pages are canonical to themselves, not to page 1. */
export function listingCanonical(basePath: string, page: number): string {
  return page > 1 ? `${basePath}?page=${page}` : basePath;
}

/**
 * Base metadata shared by every route. Open Graph and Twitter carry no title,
 * description or url on purpose: Next fills og:title/description from each
 * page's own metadata (and Twitter from Open Graph), whereas values set here
 * would leak the home page's onto every page that doesn't override them.
 */
export function baseMetadata(config: {
  seoDefaultTitle: string;
  seoDefaultDescription: string;
}): Metadata {
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: config.seoDefaultTitle,
      template: `%s · ${SITE_NAME}`,
    },
    description: config.seoDefaultDescription,
    alternates: pageAlternates('/'),
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: { card: 'summary_large_image' },
    // No `icons` override: src/app/icon.svg is picked up by Next's file
    // convention and linked with a content hash. Naming a path here pointed at
    // /favicon.svg, which does not exist — every page 404'd and shipped no icon.
  };
}

/**
 * Per-post metadata. A page-level `openGraph` replaces the layout's whole
 * object, so siteName and the image fallback are repeated here. Twitter is left
 * to the layout's card, filled from Open Graph by Next.
 */
export function postMetadata(post: {
  type: 'article' | 'project';
  slug: string;
  title: string;
  seoTitle: string | null;
  seoDescription: string | null;
  excerpt: string;
  heroUrl: string | null;
  publishedAt: string | null;
  updatedAt: string;
}): Metadata {
  const path = `/${post.type === 'article' ? 'blog' : 'projects'}/${post.slug}`;
  const title = post.seoTitle ?? post.title;
  const description = post.seoDescription ?? post.excerpt;

  return {
    title,
    description,
    alternates: pageAlternates(path),
    openGraph: {
      type: post.type === 'article' ? 'article' : 'website',
      siteName: SITE_NAME,
      url: path,
      title,
      description,
      images: [post.heroUrl ?? DEFAULT_OG_IMAGE],
      ...(post.type === 'article' && post.publishedAt
        ? { publishedTime: post.publishedAt, modifiedTime: post.updatedAt }
        : {}),
    },
  };
}

/**
 * The site owner as a schema.org Person: the About page's main entity and every
 * post's author. `sameAs` ties the social profiles to the same person, which is
 * what search engines build name results from.
 */
export function personJsonLd(socialLinks: { url: string }[]): Record<string, unknown> {
  return {
    '@type': 'Person',
    name: SITE_NAME,
    url: `${siteUrl()}/about`,
    sameAs: socialLinks.map((link) => link.url),
  };
}
