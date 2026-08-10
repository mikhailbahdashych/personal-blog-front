import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Block, LsEntry } from './commands';
import type { FileContent } from './vfs';

/**
 * Blocks → JSX. Anything with a site route becomes a real link, which is what
 * keeps the boot transcript crawlable and the whole thing usable without
 * typing a single command.
 */

function LsRow({ entry }: { entry: LsEntry }) {
  const body = (
    <>
      <span className={entry.kind === 'dir' ? 'term-dir' : 'term-file'}>{entry.name}</span>
      <span className="term-ls-title">{entry.title}</span>
      <span className="term-ls-meta">{entry.meta}</span>
    </>
  );
  if (entry.href) {
    return (
      <Link href={entry.href} className="term-ls-row" prefetch={false}>
        {body}
      </Link>
    );
  }
  return <span className="term-ls-row">{body}</span>;
}

function FileView({ file }: { file: FileContent }) {
  switch (file.kind) {
    case 'readme':
      return (
        <div className="term-fileview">
          <p className="term-title">{file.title}</p>
          <p className="term-para">{file.intro}</p>
          <p className="term-hint">featured work lives in articles/ and projects/</p>
        </div>
      );
    case 'post': {
      const { post } = file;
      const meta =
        post.type === 'article'
          ? `${post.date} · ${post.readingTimeMin} min read`
          : `${post.date.slice(0, 4)} · project`;
      const href = post.type === 'article' ? `/blog/${post.slug}` : `/projects/${post.slug}`;
      return (
        <div className="term-fileview">
          <p>
            <span className="term-strong">{post.title}</span>
            <span className="term-ls-meta">{`  ${meta}`}</span>
          </p>
          {post.tags.length > 0 && (
            <p className="term-hint">{post.tags.map((tag) => `[${tag}]`).join(' ')}</p>
          )}
          <p className="term-para">{post.excerpt}</p>
          <p>
            <Link href={href} className="term-link" prefetch={false}>
              → read it on the site
            </Link>
            {post.repoUrl && (
              <>
                {'   '}
                <a
                  className="term-link"
                  href={post.repoUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  repo ↗
                </a>
              </>
            )}
          </p>
        </div>
      );
    }
    case 'about':
      return (
        <div className="term-fileview">
          <p className="term-para">{file.para}</p>
          <p>
            <Link href="/about" className="term-link" prefetch={false}>
              → the full story: /about
            </Link>
          </p>
        </div>
      );
    case 'contact':
      return (
        <div className="term-fileview">
          <p>
            <span className="term-dim">email </span>
            <a className="term-link" href={`mailto:${file.email}`}>
              {file.email}
            </a>
          </p>
          {file.links.map((link) => (
            <p key={link.url}>
              <span className="term-dim">{`${link.label.toLowerCase().padEnd(6)} `}</span>
              <a className="term-link" href={link.url} rel="me noopener" target="_blank">
                {link.url}
              </a>
            </p>
          ))}
        </div>
      );
    case 'plan':
      return (
        <div className="term-fileview">
          <p>
            1. build the blog{'          '}
            <span className="term-ok">[done]</span>
          </p>
          <p>
            2. write more{'              '}
            <span className="term-amber">[in progress]</span>
          </p>
          <p>
            3. touch grass{'             '}
            <span className="term-dim">[blocked on 2]</span>
          </p>
        </div>
      );
  }
}

const PALETTE = [
  '#1c1c1a',
  '#e5534b',
  '#57ab5a',
  '#d29922',
  '#6cb6ff',
  '#b083f0',
  '#39c5cf',
  '#cfccc0',
];

function Neofetch({ art, rows }: { art: string[]; rows: [string, string][] }) {
  return (
    <div className="term-neofetch">
      <pre className="term-neofetch-art" aria-hidden="true">
        {art.join('\n')}
      </pre>
      <div className="term-neofetch-info">
        {rows.map(([key, value]) => (
          <p key={key}>
            <span className="term-neofetch-key">{key.padEnd(8)}</span>
            {value}
          </p>
        ))}
        <p className="term-neofetch-palette" aria-hidden="true">
          {PALETTE.map((color) => (
            <span key={color} style={{ background: color }} />
          ))}
        </p>
      </div>
    </div>
  );
}

export function renderBlock(block: Block, key: number): ReactNode {
  switch (block.kind) {
    case 'lines':
      return (
        <div key={key}>
          {block.lines.map((line, i) => (
            <p key={i} className={line.tone ? `term-${line.tone}` : undefined}>
              {line.text === '' ? ' ' : line.text}
            </p>
          ))}
        </div>
      );
    case 'ls':
      return (
        <div key={key} className="term-ls">
          {block.entries.length === 0 && <p className="term-dim">(nothing here yet)</p>}
          {block.entries.map((entry) => (
            <LsRow key={entry.name} entry={entry} />
          ))}
          {block.footer && (
            <Link href={block.footer.href} className="term-ls-footer term-link" prefetch={false}>
              {block.footer.text} →
            </Link>
          )}
        </div>
      );
    case 'file':
      return <FileView key={key} file={block.file} />;
    case 'neofetch':
      return <Neofetch key={key} art={block.art} rows={block.rows} />;
    case 'help':
      return (
        <div key={key} className="term-help">
          {block.rows.map(([command, description]) => (
            <p key={command}>
              <span className="term-help-cmd">{command}</span>
              <span className="term-dim">{description}</span>
            </p>
          ))}
          <p className="term-hint">{block.footer}</p>
        </div>
      );
    case 'completions':
      return (
        <p key={key} className="term-completions term-dim">
          {block.items.join('   ')}
        </p>
      );
  }
}
