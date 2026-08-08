import type { Metadata } from 'next';
import { requireEnv } from './env';

export function siteUrl(): string {
  return requireEnv('NEXT_PUBLIC_SITE_URL');
}

/**
 * Base metadata shared by every route: absolute-URL resolution, canonical,
 * and the Open Graph + Twitter card defaults. Per-page metadata merges on top.
 */
export function baseMetadata(config: {
  seoDefaultTitle: string;
  seoDefaultDescription: string;
}): Metadata {
  const url = siteUrl();
  return {
    metadataBase: new URL(url),
    title: {
      default: config.seoDefaultTitle,
      template: '%s · Mikhail Bahdashych',
    },
    description: config.seoDefaultDescription,
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      siteName: 'Mikhail Bahdashych',
      url,
      title: config.seoDefaultTitle,
      description: config.seoDefaultDescription,
    },
    twitter: {
      card: 'summary_large_image',
      title: config.seoDefaultTitle,
      description: config.seoDefaultDescription,
    },
    icons: { icon: '/favicon.svg' },
  };
}

/** Per-post metadata: canonical path, article/website OG, optional hero image. */
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
  const images = post.heroUrl ? [{ url: post.heroUrl }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: post.type === 'article' ? 'article' : 'website',
      url: path,
      title,
      description,
      images,
      ...(post.type === 'article' && post.publishedAt
        ? { publishedTime: post.publishedAt, modifiedTime: post.updatedAt }
        : {}),
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title,
      description,
      images: post.heroUrl ? [post.heroUrl] : undefined,
    },
  };
}
