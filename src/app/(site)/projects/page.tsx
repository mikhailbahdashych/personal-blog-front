import type { Metadata } from 'next';
import { Listing, parseListingParams } from '@/components/listing';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Security tooling and infrastructure projects.',
  // Without this the page inherits the layout's canonical ('/') and tells
  // search engines it is a duplicate of the home page.
  alternates: { canonical: '/projects' },
};

interface Props {
  searchParams: Promise<{ page?: string; per?: string }>;
}

export default async function ProjectsPage({ searchParams }: Props) {
  const { page, per } = parseListingParams(await searchParams);
  return <Listing type="project" title="Projects" basePath="/projects" page={page} per={per} />;
}
