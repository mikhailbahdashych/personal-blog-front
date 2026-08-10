import type { About, PostList, SiteConfig, SlugEntry } from '@/lib/types';
import { fmtDate } from '@/lib/format';

/**
 * The home-page terminal's world: a tiny read-only filesystem built from the
 * same data the old home page rendered as sections. Everything in this module
 * is pure and serializable — the server builds `TerminalData`, the client
 * builds the tree from it, and the command layer only ever walks the tree.
 */

export interface TermPost {
  slug: string;
  type: 'article' | 'project';
  title: string;
  excerpt: string;
  /** Preformatted YYYY-MM-DD so no date logic runs on the client. */
  date: string;
  readingTimeMin: number;
  tags: string[];
  repoUrl: string | null;
}

export interface TerminalData {
  /** Hostname only, e.g. 'mikhailbahdashych.me' — used in prompt and titles. */
  host: string;
  heroTitle: string;
  heroIntro: string;
  aboutPara: string;
  location: string;
  email: string;
  socialLinks: { label: string; url: string }[];
  /** 'Title · Company' of the current position; null when no positions exist. */
  role: string | null;
  /**
   * "6y 5m" since the earliest position started; null when no positions
   * exist. Precomputed on the server so the boot transcript needs no clock —
   * the client would otherwise hydrate a different string across a month
   * boundary.
   */
  uptime: string | null;
  topSkills: string[];
  articles: TermPost[];
  projects: TermPost[];
  articleTotal: number;
  projectTotal: number;
  /** Most recent content update — powers the "Last login" motd line. */
  lastActivityIso: string | null;
}

export type FileContent =
  | { kind: 'readme'; title: string; intro: string }
  | { kind: 'post'; post: TermPost }
  | { kind: 'about'; para: string }
  | { kind: 'contact'; email: string; links: { label: string; url: string }[] }
  | { kind: 'plan' };

export interface VfsFile {
  kind: 'file';
  name: string;
  hidden?: boolean;
  content: FileContent;
  /** Site route `open` navigates to; null means there is nowhere to go. */
  href: string | null;
}

export interface VfsDir {
  kind: 'dir';
  name: string;
  hidden?: boolean;
  children: VfsNode[];
  href: string | null;
  /** How many published posts exist beyond the featured ones listed here. */
  extraTotal: number;
}

export type VfsNode = VfsFile | VfsDir;

/** Markdown → plain text, good enough for a one-paragraph terminal bio. */
export function plainText(md: string): string {
  return md
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>]/g, '')
    .trim();
}

function toTermPost(post: PostList['items'][number]): TermPost {
  return {
    slug: post.slug,
    type: post.type,
    title: post.title,
    excerpt: post.excerpt,
    date: fmtDate(post.publishedAt),
    readingTimeMin: post.readingTimeMin,
    tags: post.tags,
    repoUrl: post.repoUrl,
  };
}

/** 'Title · Company' of the open-ended position, else the most recent one. */
function currentRole(about: About): string | null {
  const sorted = [...about.positions].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const open = sorted.find((p) => p.endDate === null);
  const position = open ?? sorted[0];
  if (!position) {
    return null;
  }
  return `${position.title} · ${position.company}`;
}

/** "3y 4m" from the earliest position start to `now`. */
export function uptime(startIso: string, now: number): string {
  const start = new Date(`${startIso.slice(0, 10)}T00:00:00Z`);
  const months = Math.max(
    0,
    (new Date(now).getUTCFullYear() - start.getUTCFullYear()) * 12 +
      (new Date(now).getUTCMonth() - start.getUTCMonth()),
  );
  return `${Math.floor(months / 12)}y ${months % 12}m`;
}

/** Most frequent skills across all positions, ties broken by first appearance. */
function topSkills(about: About, limit: number): string[] {
  const counts = new Map<string, number>();
  for (const position of about.positions) {
    for (const skill of position.skills) {
      counts.set(skill, (counts.get(skill) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([skill]) => skill);
}

export function buildTerminalData(input: {
  host: string;
  config: SiteConfig;
  about: About;
  articles: PostList;
  projects: PostList;
  slugs: SlugEntry[];
  now: number;
}): TerminalData {
  const { host, config, about, articles, projects, slugs, now } = input;
  const starts = about.positions.map((p) => p.startDate).sort();
  const updates = slugs.map((s) => s.updatedAt).sort();

  return {
    host,
    heroTitle: config.heroTitle,
    heroIntro: config.heroIntroMd,
    aboutPara: plainText(about.profileMd.split(/\n\s*\n/)[0]),
    location: about.location,
    email: about.contactEmail,
    socialLinks: config.socialLinks,
    role: currentRole(about),
    uptime: starts.length === 0 ? null : uptime(starts[0], now),
    topSkills: topSkills(about, 4),
    articles: articles.items.map(toTermPost),
    projects: projects.items.map(toTermPost),
    articleTotal: slugs.filter((s) => s.type === 'article').length,
    projectTotal: slugs.filter((s) => s.type === 'project').length,
    lastActivityIso: updates[updates.length - 1] ?? null,
  };
}

export function postHref(post: TermPost): string {
  return post.type === 'article' ? `/blog/${post.slug}` : `/projects/${post.slug}`;
}

function postFile(post: TermPost): VfsFile {
  return {
    kind: 'file',
    name: `${post.slug}.md`,
    content: { kind: 'post', post },
    href: postHref(post),
  };
}

export function buildVfs(data: TerminalData): VfsDir {
  return {
    kind: 'dir',
    name: '~',
    href: null,
    extraTotal: 0,
    children: [
      {
        kind: 'file',
        name: 'README.md',
        content: { kind: 'readme', title: data.heroTitle, intro: data.heroIntro },
        href: null,
      },
      {
        kind: 'file',
        name: 'about.md',
        content: { kind: 'about', para: data.aboutPara },
        href: '/about',
      },
      {
        kind: 'file',
        name: 'contact.md',
        content: { kind: 'contact', email: data.email, links: data.socialLinks },
        href: null,
      },
      {
        kind: 'dir',
        name: 'articles',
        href: '/blog',
        extraTotal: Math.max(0, data.articleTotal - data.articles.length),
        children: data.articles.map(postFile),
      },
      {
        kind: 'dir',
        name: 'projects',
        href: '/projects',
        extraTotal: Math.max(0, data.projectTotal - data.projects.length),
        children: data.projects.map(postFile),
      },
      {
        kind: 'file',
        name: '.plan',
        hidden: true,
        content: { kind: 'plan' },
        href: null,
      },
    ],
  };
}

/**
 * Lexical path resolution — `~` and `/` both mean home, `..` walks up and
 * stops there, `.` is a no-op. Returns the path as segments; whether anything
 * lives at that path is `getNode`'s business.
 */
export function resolvePath(cwd: string[], raw: string): string[] {
  const absolute = raw.startsWith('~') || raw.startsWith('/');
  const path = absolute ? [] : [...cwd];
  for (const segment of raw.split('/')) {
    if (segment === '' || segment === '.' || segment === '~') {
      continue;
    }
    if (segment === '..') {
      path.pop();
    } else {
      path.push(segment);
    }
  }
  return path;
}

export function getNode(root: VfsDir, path: string[]): VfsNode | null {
  let node: VfsNode = root;
  for (const segment of path) {
    if (node.kind !== 'dir') {
      return null;
    }
    const child: VfsNode | undefined = node.children.find((c) => c.name === segment);
    if (!child) {
      return null;
    }
    node = child;
  }
  return node;
}

export function visibleChildren(dir: VfsDir, showHidden: boolean): VfsNode[] {
  return dir.children.filter((child) => showHidden || child.hidden !== true);
}

export function formatCwd(path: string[]): string {
  return path.length === 0 ? '~' : `~/${path.join('/')}`;
}
