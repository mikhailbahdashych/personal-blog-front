import type { MetadataRoute } from 'next';
import { getSlugs } from '@/lib/api';
import { siteUrl } from '@/lib/seo';

// Depends on the API (post slugs); render on request, not at build time.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const slugs = await getSlugs();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/projects`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.6 },
  ];

  const postRoutes: MetadataRoute.Sitemap = slugs.map((entry) => ({
    url: `${base}/${entry.type === 'article' ? 'blog' : 'projects'}/${entry.slug}`,
    lastModified: entry.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...postRoutes];
}
