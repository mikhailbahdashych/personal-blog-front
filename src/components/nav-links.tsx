'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/blog', label: 'Blog' },
  { href: '/projects', label: 'Projects' },
  { href: '/about', label: 'About' },
] as const;

export function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className="nav-link"
          aria-current={pathname === href || pathname.startsWith(`${href}/`) ? 'page' : undefined}
        >
          {label}
        </Link>
      ))}
    </>
  );
}
