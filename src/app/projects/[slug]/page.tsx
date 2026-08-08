import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostDetail } from '@/components/post-detail';
import { getPost } from '@/lib/api';
import { postMetadata } from '@/lib/seo';
import 'katex/dist/katex.min.css';
import '@/styles/prose.css';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  return postMetadata(post);
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (post.type !== 'project') {
    notFound();
  }
  return <PostDetail post={post} />;
}
