import type { ReactNode } from 'react';

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-shrug">{'¯\\_(ツ)_/¯'}</span>
      <p className="empty-text">{children}</p>
    </div>
  );
}
