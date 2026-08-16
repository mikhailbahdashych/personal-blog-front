import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { maintenanceAction } from '@/lib/maintenance';

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

/**
 * How long crawlers (and browsers) are told to wait before retrying. A deploy
 * takes a couple of minutes; an hour is a safe upper bound that keeps search
 * engines from hammering the origin, and it costs nothing when the flag is
 * flipped back sooner — the very next request is served normally.
 */
const RETRY_AFTER_SECONDS = 3600;

export async function middleware(request: NextRequest) {
  const action = maintenanceAction(request.nextUrl.pathname, await maintenanceEnabled());

  if (!action) {
    return NextResponse.next();
  }
  if (action.kind === 'redirect') {
    return NextResponse.redirect(new URL(action.to, request.url));
  }

  // Serve the holding page's markup at whatever URL was requested, under a 503
  // rather than a redirect, so the address stays put and search engines treat
  // the outage as temporary. See lib/maintenance.ts.
  return NextResponse.rewrite(new URL('/maintenance', request.url), {
    status: 503,
    headers: { 'Retry-After': String(RETRY_AFTER_SECONDS) },
  });
}
