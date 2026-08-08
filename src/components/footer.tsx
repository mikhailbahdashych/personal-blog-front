import type { SiteConfig } from '@/lib/types';

export function Footer({ config }: { config: SiteConfig }) {
  return (
    <footer className="site-footer">
      <div className="footer-links">
        {config.socialLinks.map((link) => (
          <a key={link.url} href={link.url} rel="me noopener" target="_blank">
            {link.label}
          </a>
        ))}
      </div>
      <span>{config.footerText}</span>
    </footer>
  );
}
