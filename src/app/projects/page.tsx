import type { Metadata } from 'next';
import { Listing, parseListingParams } from '@/components/listing';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Security tooling and infrastructure projects.',
};

interface Props {
  searchParams: Promise<{ page?: string; per?: string }>;
}

export default async function ProjectsPage({ searchParams }: Props) {
  const { page, per } = parseListingParams(await searchParams);
  return <Listing type="project" title="Projects" basePath="/projects" page={page} per={per} />;
}
