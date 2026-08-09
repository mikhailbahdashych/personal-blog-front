import type { TocEntry } from '@/lib/markdown';

export function TocCard({ toc }: { toc: TocEntry[] }) {
  if (toc.length === 0) {
    return null;
  }

  return (
    <nav className="toc-card" aria-label="Contents">
      <span className="micro-label">Contents</span>
      <div className="toc-list">
        {toc.map((entry, index) => (
          <a key={entry.id} href={`#${entry.id}`}>
            {/* Numbering mirrors the counter on .prose h2 — both walk the H2s
                in document order, so they stay in step. */}
            <span className="toc-num">{index + 1}.</span>
            {entry.text}
          </a>
        ))}
      </div>
    </nav>
  );
}
