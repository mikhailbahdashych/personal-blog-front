import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('renders GFM tables with a caption from a "Table: " paragraph, wrapped for overflow', async () => {
    const { html } = await renderMarkdown(
      ['| Col A | Col B |', '| --- | --- |', '| 1 | 2 |', '', 'Table: Comparison of things.'].join(
        '\n',
      ),
    );
    expect(html).toContain('<div class="table-wrap"><table>');
    expect(html).toContain('<caption>Comparison of things.</caption>');
    expect(html).not.toContain('Table:');
    expect(html).toContain('<th>Col A</th>');
  });

  it('leaves ordinary paragraphs after tables alone', async () => {
    const { html } = await renderMarkdown(
      ['| A |', '| --- |', '| 1 |', '', 'Just a normal paragraph.'].join('\n'),
    );
    expect(html).not.toContain('<caption>');
    expect(html).toContain('<p>Just a normal paragraph.</p>');
  });

  it('turns standalone images with titles into figures with captions', async () => {
    const { html } = await renderMarkdown('![An alt](https://example.com/x.png "Figure 1 — flow")');
    expect(html).toContain('<figure>');
    expect(html).toContain('<figcaption>Figure 1 — flow</figcaption>');
    expect(html).toContain('loading="lazy"');
    expect(html).not.toContain('title=');
  });

  it('wraps untitled standalone images in figures without captions', async () => {
    const { html } = await renderMarkdown('![Just alt](https://example.com/x.png)');
    expect(html).toContain('<figure>');
    expect(html).not.toContain('<figcaption>');
  });

  it('renders inline and display math with KaTeX', async () => {
    // Display math must be fenced on its own lines; single-line $$x$$ parses as inline.
    const { html } = await renderMarkdown(
      'Inline $E = mc^2$ and display:\n\n$$\n\\int_0^1 x\\,dx\n$$',
    );
    expect(html).toContain('katex');
    expect(html).toContain('katex-display');
  });

  it('highlights fenced code with Shiki and leaves inline code plain', async () => {
    const { html } = await renderMarkdown(
      'Inline `code` here.\n\n```ts\nconst x: number = 1;\n```',
    );
    expect(html).toContain('<pre class="shiki');
    expect(html).toMatch(/<span style="color:#/);
    expect(html).toContain('<code>code</code>');
  });

  it('falls back gracefully for unknown code fence languages', async () => {
    const { html } = await renderMarkdown('```notareallang\nhello\n```');
    expect(html).toContain('<pre class="shiki');
  });

  it('collects an H2 table of contents with slug ids', async () => {
    const { html, toc } = await renderMarkdown(
      '## First Section\n\ntext\n\n## Second: The Sequel\n\nmore\n\n### Sub (not in toc)',
    );
    expect(toc).toEqual([
      { id: 'first-section', text: 'First Section' },
      { id: 'second-the-sequel', text: 'Second: The Sequel' },
    ]);
    expect(html).toContain('<h2 id="first-section">');
  });

  it('renders blockquotes and links', async () => {
    const { html } = await renderMarkdown('> A quote.\n\n[link](https://example.com)');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('<a href="https://example.com">link</a>');
  });

  it('never renders raw HTML from markdown (XSS regression)', async () => {
    // remark-rehype without allowDangerousHtml drops raw HTML nodes entirely.
    const { html } = await renderMarkdown('hello <script>alert(1)</script> <img src=x onerror=y>');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('<img');
    expect(html).toContain('hello');
  });
  it('strips executable URL schemes from links and images (XSS regression)', async () => {
    // Raw HTML is dropped by remark-rehype, but markdown link syntax reaches the
    // href untouched — rehypeSafeUrls is what stops `javascript:` there.
    for (const md of [
      '[c](javascript:alert(1))',
      '[c](JaVaScRiPt:alert(1))',
      '[c](  javascript:alert(1))',
      '[c](vbscript:msgbox(1))',
      '[c](data:text/html;base64,PHNjcmlwdD4=)',
      '![i](javascript:alert(1))',
    ]) {
      const { html } = await renderMarkdown(md);
      expect(html).not.toContain('javascript:');
      expect(html).not.toContain('vbscript:');
      expect(html).not.toContain('data:text/html');
      expect(html).not.toMatch(/<(a|img)[^>]*\s(href|src)=/);
    }
  });

  it('keeps the URLs a post legitimately needs', async () => {
    const { html } = await renderMarkdown(
      '[a](https://example.com) [b](/blog/post) [c](#anchor) [d](mailto:x@y.co)\n\n' +
        '![e](https://bucket.s3.eu-central-1.amazonaws.com/uploads/2026/08/a-b_c.png)',
    );
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('href="/blog/post"');
    expect(html).toContain('href="#anchor"');
    expect(html).toContain('href="mailto:x@y.co"');
    expect(html).toContain(
      'src="https://bucket.s3.eu-central-1.amazonaws.com/uploads/2026/08/a-b_c.png"',
    );
  });
});
