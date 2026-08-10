import { describe, expect, it } from 'vitest';
import { Block, Context, complete, listDir, run } from './commands';
import { initialEntries } from './transcript';
import {
  TermPost,
  TerminalData,
  buildTerminalData,
  buildVfs,
  formatCwd,
  getNode,
  plainText,
  resolvePath,
  uptime,
} from './vfs';

function post(slug: string, type: 'article' | 'project', title: string): TermPost {
  return {
    slug,
    type,
    title,
    excerpt: `About ${title}.`,
    date: '2026-07-14',
    readingTimeMin: 7,
    tags: ['zeek', 'dns'],
    repoUrl: type === 'project' ? `https://github.com/x/${slug}` : null,
  };
}

const DATA: TerminalData = {
  host: 'mikhailbahdashych.me',
  heroTitle: 'Security engineering notes.',
  heroIntro: 'Detection, cloud, and the occasional write-up.',
  aboutPara: 'I work on detection engineering.',
  location: 'Kraków, Poland',
  email: 'hi@example.com',
  socialLinks: [{ label: 'github', url: 'https://github.com/x' }],
  role: 'Security Engineer · Acme',
  uptime: '6y 5m',
  topSkills: ['AWS', 'Zeek'],
  articles: [
    post('dns-tunnels', 'article', 'Detecting DNS tunnels'),
    post('dns-exfil', 'article', 'DNS exfil notes'),
  ],
  projects: [post('zeek-kit', 'project', 'Zeek kit')],
  articleTotal: 64,
  projectTotal: 1,
  lastActivityIso: '2026-08-01T12:00:00Z',
};

function ctx(overrides: Partial<Context> = {}): Context {
  return {
    data: DATA,
    root: buildVfs(DATA),
    cwd: [],
    theme: 'dark',
    history: [],
    ...overrides,
  };
}

function textOf(block: Block): string {
  if (block.kind !== 'lines') {
    throw new Error(`Expected a lines block, got '${block.kind}'`);
  }
  return block.lines.map((l) => l.text).join('\n');
}

describe('vfs paths', () => {
  it('resolves relative, absolute, dot and dot-dot segments', () => {
    expect(resolvePath(['articles'], 'dns-tunnels.md')).toEqual(['articles', 'dns-tunnels.md']);
    expect(resolvePath(['articles'], '..')).toEqual([]);
    expect(resolvePath(['articles'], '../projects/./zeek-kit.md')).toEqual([
      'projects',
      'zeek-kit.md',
    ]);
    expect(resolvePath(['articles'], '~')).toEqual([]);
    expect(resolvePath(['articles'], '/projects')).toEqual(['projects']);
    expect(resolvePath([], '../../..')).toEqual([]);
  });

  it('walks the tree and refuses to walk through files', () => {
    const root = buildVfs(DATA);
    expect(getNode(root, ['articles', 'dns-tunnels.md'])?.kind).toBe('file');
    expect(getNode(root, ['articles', 'missing.md'])).toBeNull();
    expect(getNode(root, ['README.md', 'nope'])).toBeNull();
  });

  it('hides dotfiles unless asked', () => {
    const root = buildVfs(DATA);
    const plain = listDir(root, false);
    const all = listDir(root, true);
    if (plain.kind !== 'ls' || all.kind !== 'ls') {
      throw new Error('expected ls blocks');
    }
    expect(plain.entries.map((e) => e.name)).not.toContain('.plan');
    expect(all.entries.map((e) => e.name)).toContain('.plan');
  });

  it('formats the cwd like a shell would', () => {
    expect(formatCwd([])).toBe('~');
    expect(formatCwd(['articles'])).toBe('~/articles');
  });
});

describe('buildTerminalData', () => {
  const about = {
    fullName: 'Mikhail Bahdashych',
    profileMd: 'I work on **detection**.\n\nSecond paragraph.',
    location: 'Kraków, Poland',
    contactEmail: 'hi@example.com',
    seoTitle: null,
    seoDescription: null,
    avatarUrl: null,
    positions: [
      {
        id: '1',
        company: 'Acme',
        companyUrl: null,
        title: 'Security Engineer',
        description: '',
        location: 'Kraków',
        logoUrl: null,
        startDate: '2023-01-01',
        endDate: null,
        bullets: [],
        skills: ['AWS', 'Zeek'],
      },
      {
        id: '2',
        company: 'Beta',
        companyUrl: null,
        title: 'Analyst',
        description: '',
        location: 'Warsaw',
        logoUrl: null,
        startDate: '2020-03-01',
        endDate: '2022-12-31',
        bullets: [],
        skills: ['AWS'],
      },
    ],
    education: [],
    certifications: [],
  };

  it('derives role, career start, skills and totals', () => {
    const data = buildTerminalData({
      host: 'x.me',
      config: {
        heroTitle: 'T',
        heroIntroMd: 'I',
        socialLinks: [],
        seoDefaultTitle: '',
        seoDefaultDescription: '',
        footerText: '',
      },
      about,
      articles: { items: [], total: 0, page: 1, per: 10 },
      projects: { items: [], total: 0, page: 1, per: 10 },
      slugs: [
        { slug: 'a', type: 'article', updatedAt: '2026-01-01T00:00:00Z' },
        { slug: 'b', type: 'article', updatedAt: '2026-03-01T00:00:00Z' },
        { slug: 'p', type: 'project', updatedAt: '2026-02-01T00:00:00Z' },
      ],
      now: Date.UTC(2026, 7, 9),
    });
    expect(data.role).toBe('Security Engineer · Acme');
    // Career started 2020-03 (the older, closed position counts).
    expect(data.uptime).toBe('6y 5m');
    expect(data.topSkills).toEqual(['AWS', 'Zeek']);
    expect(data.articleTotal).toBe(2);
    expect(data.projectTotal).toBe(1);
    expect(data.lastActivityIso).toBe('2026-03-01T00:00:00Z');
    expect(data.aboutPara).toBe('I work on detection.');
  });

  it('strips markdown links but keeps their text', () => {
    expect(plainText('See [the repo](https://x) and ![img](y).')).toBe('See the repo and img.');
  });
});

describe('run', () => {
  it('lists the home directory with the curated order', () => {
    const [block] = run(ctx(), 'ls').blocks;
    if (block.kind !== 'ls') {
      throw new Error('expected ls');
    }
    expect(block.entries.map((e) => e.name)).toEqual([
      'README.md',
      'about.md',
      'contact.md',
      'articles/',
      'projects/',
    ]);
  });

  it('links archive footers only when there is more than what is listed', () => {
    const result = run(ctx(), 'ls articles');
    const [articles] = result.blocks;
    if (articles.kind !== 'ls') {
      throw new Error('expected ls');
    }
    expect(articles.footer).toEqual({ text: '+ 62 more in the archive', href: '/blog' });

    const [projects] = run(ctx(), 'ls projects').blocks;
    if (projects.kind !== 'ls') {
      throw new Error('expected ls');
    }
    expect(projects.footer).toBeNull();
  });

  it('rejects unknown flags the way ls would', () => {
    expect(textOf(run(ctx(), 'ls -z').blocks[0])).toBe("ls: invalid option -- 'z'");
    const hidden = run(ctx(), 'ls -la').blocks[0];
    if (hidden.kind !== 'ls') {
      throw new Error('expected ls');
    }
    expect(hidden.entries.map((e) => e.name)).toContain('.plan');
  });

  it('changes directory, errors on files and missing paths', () => {
    expect(run(ctx(), 'cd articles').cwd).toEqual(['articles']);
    expect(textOf(run(ctx(), 'cd README.md').blocks[0])).toBe('cd: not a directory: README.md');
    expect(textOf(run(ctx(), 'cd nowhere').blocks[0])).toBe(
      'cd: no such file or directory: nowhere',
    );
    expect(run(ctx({ cwd: ['articles'] }), 'cd').cwd).toEqual([]);
  });

  it('prints a fake but honest pwd', () => {
    expect(textOf(run(ctx({ cwd: ['articles'] }), 'pwd').blocks[0])).toBe('/home/guest/articles');
  });

  it('cats posts from any directory', () => {
    const [block] = run(ctx({ cwd: ['projects'] }), 'cat ../articles/dns-tunnels.md').blocks;
    if (block.kind !== 'file' || block.file.kind !== 'post') {
      throw new Error('expected a post file');
    }
    expect(block.file.post.title).toBe('Detecting DNS tunnels');
    expect(textOf(run(ctx(), 'cat articles').blocks[0])).toBe('cat: articles: Is a directory');
  });

  it('opens posts and directories that have a home on the site', () => {
    expect(run(ctx(), 'open articles/dns-tunnels.md').effect).toEqual({
      kind: 'navigate',
      href: '/blog/dns-tunnels',
    });
    expect(run(ctx(), 'open projects').effect).toEqual({ kind: 'navigate', href: '/projects' });
    expect(run(ctx(), 'open about.md').effect).toEqual({ kind: 'navigate', href: '/about' });
    expect(run(ctx(), 'open README.md').effect).toBeUndefined();
  });

  it('toggles and sets the theme', () => {
    expect(run(ctx({ theme: 'dark' }), 'theme').effect).toEqual({ kind: 'theme', mode: 'light' });
    expect(run(ctx({ theme: 'light' }), 'theme').effect).toEqual({ kind: 'theme', mode: 'dark' });
    expect(run(ctx(), 'theme dark').effect).toEqual({ kind: 'theme', mode: 'dark' });
    expect(run(ctx(), 'theme blue').effect).toBeUndefined();
  });

  it('computes uptime in years and months', () => {
    expect(uptime('2020-03-01', Date.UTC(2026, 7, 9))).toBe('6y 5m');
    expect(uptime('2026-08-01', Date.UTC(2026, 7, 9))).toBe('0y 0m');
  });

  it('builds neofetch rows from real data', () => {
    const [block] = run(ctx(), 'neofetch').blocks;
    if (block.kind !== 'neofetch') {
      throw new Error('expected neofetch');
    }
    const rows = Object.fromEntries(block.rows);
    expect(rows.user).toBe('guest@mikhailbahdashych.me');
    expect(rows.role).toBe('Security Engineer · Acme');
    expect(rows.uptime).toBe('6y 5m');
    expect(rows.posts).toBe('64 articles · 1 projects');
    // No theme row: the boot transcript pre-runs this block server-side,
    // where the visitor's theme is unknowable.
    expect(rows.theme).toBeUndefined();
    expect(run(ctx(), 'fastfetch').blocks[0].kind).toBe('neofetch');
  });

  it('keeps the eggs in character', () => {
    expect(textOf(run(ctx(), 'sudo make me a sandwich').blocks[0])).toContain('not in the sudoers');
    expect(textOf(run(ctx(), 'rm -rf /').blocks[0])).toContain('read-only file system');
    expect(textOf(run(ctx(), 'vim').blocks[0])).toContain('no editors');
    expect(run(ctx(), 'exit').effect).toEqual({ kind: 'exit' });
    expect(run(ctx(), 'clear').effect).toEqual({ kind: 'clear' });
  });

  it('handles echo, whoami, history and nonsense', () => {
    expect(textOf(run(ctx(), 'echo hello there').blocks[0])).toBe('hello there');
    expect(textOf(run(ctx(), 'whoami').blocks[0])).toContain('guest');
    expect(textOf(run(ctx({ history: ['ls', 'help'] }), 'history').blocks[0])).toContain('help');
    expect(textOf(run(ctx(), 'frobnicate').blocks[0])).toBe('zsh: command not found: frobnicate');
    expect(run(ctx(), '   ').blocks).toEqual([]);
  });
});

describe('complete', () => {
  it('completes commands on the first word', () => {
    expect(complete(ctx(), 'neo')).toEqual({ value: 'neofetch ', options: [] });
    const many = complete(ctx(), 'c');
    expect(many.options).toEqual(['cat', 'cd', 'clear']);
    expect(many.value).toBeNull();
  });

  it('completes paths, appending / to directories', () => {
    expect(complete(ctx(), 'cat R')).toEqual({ value: 'cat README.md ', options: [] });
    expect(complete(ctx(), 'ls art')).toEqual({ value: 'ls articles/', options: [] });
    expect(complete(ctx(), 'cat articles/dns-t')).toEqual({
      value: 'cat articles/dns-tunnels.md ',
      options: [],
    });
  });

  it('extends to the longest common prefix and lists candidates', () => {
    // 'dns-tunnels.md' and 'dns-exfil.md' share 'dns-': the input grows to
    // the shared prefix while both stay on offer.
    const extended = complete(ctx(), 'cat articles/dns');
    expect(extended.value).toBe('cat articles/dns-');
    expect(extended.options).toEqual(['dns-tunnels.md', 'dns-exfil.md']);

    // 'about.md' vs 'articles/' share only the 'a' already typed.
    const ambiguous = complete(ctx(), 'cat a');
    expect(ambiguous.value).toBeNull();
    expect(ambiguous.options).toEqual(['about.md', 'articles/']);
  });

  it('only offers directories to cd', () => {
    const result = complete(ctx(), 'cd ');
    expect(result.options).toEqual(['articles/', 'projects/']);
  });

  it('offers dotfiles only when the prefix asks for them', () => {
    expect(complete(ctx(), 'cat .p')).toEqual({ value: 'cat .plan ', options: [] });
  });
});

describe('initialEntries', () => {
  it('boots small: a motd line and a pre-run neofetch', () => {
    const entries = initialEntries(DATA);
    expect(entries.map((e) => e.prompt?.text)).toEqual([undefined, 'neofetch']);
    expect(textOf(entries[0].blocks[0])).toContain('Last login: 2026-08-01');
    expect(entries[1].blocks[0].kind).toBe('neofetch');
  });

  it('skips the motd when nothing has ever been published', () => {
    const entries = initialEntries({ ...DATA, lastActivityIso: null });
    expect(entries.map((e) => e.prompt?.text)).toEqual(['neofetch']);
  });
});
