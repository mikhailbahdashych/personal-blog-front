import type { Metadata } from 'next';
import { Listing, parseListingParams } from '@/components/listing';
import { listingCanonical, pageAlternates } from '@/lib/seo';

interface Props {
  searchParams: Promise<{ page?: string; per?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page } = parseListingParams(await searchParams);
  return {
    title: 'Blog',
    description:
      'Write-ups on security engineering: GRC and compliance, security operations and AI security.',
    alternates: pageAlternates(listingCanonical('/blog', page)),
  };
}

export default async function BlogPage({ searchParams }: Props) {
  const { page, per } = parseListingParams(await searchParams);
  return <Listing type="article" title="Blog" basePath="/blog" page={page} per={per} />;
}
