export type PostType = 'article' | 'project';

export interface PostListItem {
  slug: string;
  type: PostType;
  title: string;
  excerpt: string;
  tags: string[];
  publishedAt: string | null;
  readingTimeMin: number;
  repoUrl: string | null;
  heroUrl: string | null;
}

export interface PostList {
  items: PostListItem[];
  total: number;
  page: number;
  per: number;
}

export interface Post extends Omit<PostListItem, 'heroUrl'> {
  contentMd: string;
  updatedAt: string;
  seoTitle: string | null;
  seoDescription: string | null;
  heroUrl: string | null;
}

export interface SiteConfig {
  heroTitle: string;
  heroIntroMd: string;
  socialLinks: { label: string; url: string }[];
  seoDefaultTitle: string;
  seoDefaultDescription: string;
  footerText: string;
}

export interface CvPosition {
  id: string;
  company: string;
  companyUrl: string | null;
  title: string;
  description: string;
  location: string;
  logoUrl: string | null;
  startDate: string;
  endDate: string | null;
  bullets: string[];
  skills: string[];
}

export interface CvEducation {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  logoUrl: string | null;
  startDate: string;
  endDate: string | null;
  notes: string;
}

export interface CvCertification {
  id: string;
  name: string;
  issuer: string;
  description: string;
  logoUrl: string | null;
  issuedDate: string;
  expiresDate: string | null;
  credentialUrl: string | null;
}

export interface About {
  fullName: string;
  profileMd: string;
  location: string;
  contactEmail: string;
  seoTitle: string | null;
  seoDescription: string | null;
  avatarUrl: string | null;
  positions: CvPosition[];
  education: CvEducation[];
  certifications: CvCertification[];
}

export interface SearchResultItem {
  slug: string;
  type: PostType;
  tags: string[];
  publishedAt: string;
  titleHtml: string;
  snippetHtml: string;
}

export interface SearchResults {
  items: SearchResultItem[];
  total: number;
  page: number;
  per: number;
}

export interface SlugEntry {
  slug: string;
  type: PostType;
  updatedAt: string;
}
