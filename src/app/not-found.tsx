import Link from 'next/link';
import { EmptyState } from '@/components/empty-state';

export const metadata = { title: '404' };

export default function NotFound() {
  return (
    <>
      <h1 className="page-title">404</h1>
      <EmptyState>
        Nothing here. This page doesn&apos;t exist — head <Link href="/">home</Link> or browse{' '}
        <Link href="/blog">all posts</Link>.
      </EmptyState>
    </>
  );
}
