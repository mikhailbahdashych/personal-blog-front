import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { requireEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Called by the API after admin mutations to invalidate the affected cache
 * tags. Guarded by a shared secret (constant-time compared).
 */
export async function POST(request: NextRequest) {
  let body: { secret?: unknown; tags?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body.secret !== 'string' || !safeEqual(body.secret, requireEnv('REVALIDATE_SECRET'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!Array.isArray(body.tags) || !body.tags.every((tag) => typeof tag === 'string')) {
    return NextResponse.json({ error: 'tags must be a string array' }, { status: 400 });
  }

  for (const tag of body.tags as string[]) {
    revalidateTag(tag);
  }
  return NextResponse.json({ revalidated: body.tags });
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
