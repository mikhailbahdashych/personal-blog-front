import type { Metadata } from 'next';
import { Listing, parseListingParams } from '@/components/listing';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Security engineering write-ups: detection engineering, cloud security, incident notes.',
  // Without this the page inherits the layout's canonical ('/') and tells
  // search engines it is a duplicate of the home page.
  alternates: { canonical: '/blog' },
};

interface Props {
  searchParams: Promise<{ page?: string; per?: string }>;
}

export default async function BlogPage({ searchParams }: Props) {
  const { page, per } = parseListingParams(await searchParams);
  return <Listing type="article" title="Blog" basePath="/blog" page={page} per={per} />;
}
