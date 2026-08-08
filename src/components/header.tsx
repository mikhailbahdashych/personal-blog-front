import Link from 'next/link';
import { NavLinks } from './nav-links';
import { SearchPopup } from './search-popup';
import { ThemeToggle } from './theme-toggle';

export function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="wordmark">
        Mikhail Bahdashych
      </Link>
      <nav className="site-nav" aria-label="Main">
        <NavLinks />
        <SearchPopup />
        <ThemeToggle />
      </nav>
    </header>
  );
}
