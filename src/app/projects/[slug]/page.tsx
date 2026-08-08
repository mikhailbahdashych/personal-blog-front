import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostDetail } from '@/components/post-detail';
import { getPost } from '@/lib/api';
import 'katex/dist/katex.min.css';
import '@/styles/prose.css';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (post.type !== 'project') {
    notFound();
  }
  return <PostDetail post={post} />;
}
