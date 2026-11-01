import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  // No `Disallow: /search`: a blocked page is never fetched, so crawlers would
  // never see its noindex and could index the bare URL from links. No `Host:`
  // either — it's non-standard and Google ignores it.
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
