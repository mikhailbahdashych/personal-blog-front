import Link from 'next/link';
import { NavLinks } from './nav-links';
import { SearchButton } from './search-button';
import { ThemeToggle } from './theme-toggle';

export function Header({ showSearch = true }: { showSearch?: boolean }) {
  return (
    <header className="site-header">
      <Link href="/" className="wordmark">
        Mikhail Bahdashych
      </Link>
      <nav className="site-nav" aria-label="Main">
        <NavLinks />
        {showSearch && <SearchButton />}
        <ThemeToggle />
      </nav>
    </header>
  );
}
