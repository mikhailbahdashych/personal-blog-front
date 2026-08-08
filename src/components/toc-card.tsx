import type { TocEntry } from '@/lib/markdown';

export function TocCard({ toc }: { toc: TocEntry[] }) {
  if (toc.length === 0) {
    return null;
  }

  return (
    <nav className="toc-card" aria-label="Contents">
      <span className="micro-label">Contents</span>
      <div className="toc-list">
        {toc.map((entry) => (
          <a key={entry.id} href={`#${entry.id}`}>
            {entry.text}
          </a>
        ))}
      </div>
    </nav>
  );
}
