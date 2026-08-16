import { getPosts, getSiteConfig } from '@/lib/api';
import { siteUrl } from '@/lib/seo';

const escapeXml = (value: string): string =>
  value.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      default:
        return '&quot;';
    }
  });

export async function GET() {
  const base = siteUrl();
  // The blog feed covers articles; projects are portfolio items, not feed posts.
  const [{ items }, config] = await Promise.all([getPosts('article', 1, 50), getSiteConfig()]);

  const entries = items
    .map((post) => {
      const url = `${base}/blog/${post.slug}`;
      const date = post.publishedAt ? new Date(post.publishedAt).toUTCString() : '';
      return [
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        date ? `      <pubDate>${date}</pubDate>` : '',
        `      <description>${escapeXml(post.excerpt)}</description>`,
        ...post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`),
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(config.seoDefaultTitle)}</title>
    <link>${base}</link>
    <description>${escapeXml(config.seoDefaultDescription)}</description>
    <language>en</language>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml" />
${entries}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
