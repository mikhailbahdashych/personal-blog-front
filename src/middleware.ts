import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { maintenanceRedirect } from '@/lib/maintenance';

/**
 * Maintenance gate. Every page request asks the API for the flag — uncached
 * and with a short timeout, so flipping the admin switch takes effect on the
 * next request. An unreachable or broken API also counts as maintenance: that
 * is the mid-deploy state the page exists for, and it heals itself on the
 * first healthy response.
 */

// Pages only: skip Next internals, the revalidate route, and anything with a
// file extension (icon.svg, robots.txt, sitemap.xml, rss.xml).
export const config = {
  matcher: ['/((?!api/|_next/|.*\\..*).*)'],
};

async function maintenanceEnabled(): Promise<boolean> {
  const api = process.env.API_INTERNAL_URL;
  if (!api) {
    throw new Error('Missing required environment variable: API_INTERNAL_URL');
  }
  try {
    const res = await fetch(`${api}/api/maintenance`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) {
      return true;
    }
    const { enabled } = (await res.json()) as { enabled: boolean };
    return enabled === true;
  } catch {
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const target = maintenanceRedirect(request.nextUrl.pathname, await maintenanceEnabled());
  return target ? NextResponse.redirect(new URL(target, request.url)) : NextResponse.next();
}
