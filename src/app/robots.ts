import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/search' },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
