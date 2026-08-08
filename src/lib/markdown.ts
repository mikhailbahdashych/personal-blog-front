import rehypeShiki from '@shikijs/rehype';
import type { Element, ElementContent, Root, RootContent } from 'hast';
import { toString as hastToString } from 'hast-util-to-string';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { visit, SKIP } from 'unist-util-visit';
import type { VFile } from 'vfile';

/**
 * THE markdown pipeline. The admin panel vendors a copy of this configuration
 * for its live preview (personal-blog-admin: src/lib/markdown.ts) — keep the
 * two in sync when changing plugins or conventions.
 *
 * Conventions on top of GFM + math:
 * - A standalone image becomes <figure>; its quoted title becomes the caption:
 *   ![alt](url "Figure 1 — caption")
 * - A paragraph starting with "Table: " directly after a table becomes the
 *   table's <caption> (rendered below it), and every table is wrapped in a
 *   horizontally scrollable container.
 * - H2 headings define the table of contents (slug ids from rehype-slug).
 * - Raw HTML is NOT rendered — it stays escaped text.
 */

export interface TocEntry {
  id: string;
  text: string;
}

export interface RenderedMarkdown {
  html: string;
  toc: TocEntry[];
}

const isElement = (node: ElementContent | RootContent | undefined, tag?: string): node is Element =>
  !!node && node.type === 'element' && (tag === undefined || node.tagName === tag);

const isWhitespace = (node: ElementContent | RootContent | undefined): boolean =>
  !!node && node.type === 'text' && node.value.trim() === '';

/** `![alt](url "Caption")` alone in a paragraph -> <figure><img/><figcaption/></figure> */
function rehypeFigures() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'p' || !parent || index === undefined) {
        return;
      }
      const meaningful = node.children.filter((child) => !isWhitespace(child));
      if (meaningful.length !== 1 || !isElement(meaningful[0], 'img')) {
        return;
      }

      const img = meaningful[0];
      img.properties.loading = 'lazy';
      const title = typeof img.properties.title === 'string' ? img.properties.title : '';
      delete img.properties.title;

      const children: ElementContent[] = [img];
      if (title) {
        children.push({
          type: 'element',
          tagName: 'figcaption',
          properties: {},
          children: [{ type: 'text', value: title }],
        });
      }
      parent.children[index] = { type: 'element', tagName: 'figure', properties: {}, children };
      return SKIP;
    });
  };
}

/** A "Table: …" paragraph following a table -> <caption> inside that table. */
function rehypeTableCaptions() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'table' || !parent || index === undefined) {
        return;
      }

      let nextIndex = index + 1;
      while (isWhitespace(parent.children[nextIndex])) {
        nextIndex += 1;
      }
      const next = parent.children[nextIndex];
      if (!isElement(next, 'p')) {
        return;
      }
      const [first, ...rest] = next.children;
      if (!first || first.type !== 'text' || !first.value.startsWith('Table:')) {
        return;
      }

      const caption: Element = {
        type: 'element',
        tagName: 'caption',
        properties: {},
        children: [
          { type: 'text', value: first.value.slice('Table:'.length).trimStart() },
          ...rest,
        ],
      };
      node.children.unshift(caption);
      parent.children.splice(nextIndex, 1);
    });
  };
}

/** Wrap tables so wide content scrolls inside the 716px column. */
function rehypeTableWrap() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'table' || !parent || index === undefined) {
        return;
      }
      if (isElement(parent as Element) && (parent as Element).tagName === 'div') {
        const className = (parent as Element).properties.className;
        if (Array.isArray(className) && className.includes('table-wrap')) {
          return;
        }
      }
      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-wrap'] },
        children: [node],
      };
      return SKIP;
    });
  };
}

/** Collect H2 {id, text} into vfile.data.toc (ids come from rehype-slug). */
function collectToc() {
  return (tree: Root, file: VFile) => {
    const toc: TocEntry[] = [];
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'h2' && typeof node.properties.id === 'string') {
        toc.push({ id: node.properties.id, text: hastToString(node) });
      }
    });
    file.data.toc = toc;
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeKatex)
  .use(rehypeShiki, {
    theme: 'github-dark-default',
    fallbackLanguage: 'text',
  })
  .use(rehypeTableCaptions)
  .use(rehypeTableWrap)
  .use(rehypeFigures)
  .use(collectToc)
  .use(rehypeStringify);

export async function renderMarkdown(markdown: string): Promise<RenderedMarkdown> {
  const file = await processor.process(markdown);
  return { html: String(file), toc: (file.data.toc as TocEntry[] | undefined) ?? [] };
}
