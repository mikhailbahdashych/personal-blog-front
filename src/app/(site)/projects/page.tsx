import type { Metadata } from 'next';
import { Listing, parseListingParams } from '@/components/listing';
import { listingCanonical, pageAlternates } from '@/lib/seo';

interface Props {
  searchParams: Promise<{ page?: string; per?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page } = parseListingParams(await searchParams);
  return {
    title: 'Projects',
    description: 'Security tooling and infrastructure projects.',
    alternates: pageAlternates(listingCanonical('/projects', page)),
  };
}

export default async function ProjectsPage({ searchParams }: Props) {
  const { page, per } = parseListingParams(await searchParams);
  return <Listing type="project" title="Projects" basePath="/projects" page={page} per={per} />;
}
