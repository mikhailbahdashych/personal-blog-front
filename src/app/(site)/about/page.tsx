import type { Metadata } from 'next';
import { CertificationTile, EducationEntry, PositionEntry } from '@/components/cv';
import { getAbout, getSiteConfig } from '@/lib/api';
import { renderMarkdown } from '@/lib/markdown';
import '@/styles/about.css';

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAbout();
  return {
    // The site layout's title template already appends the name, so this is
    // the page part only — 'About — <name>' here rendered it twice.
    title: about.seoTitle ?? 'About',
    description: about.seoDescription ?? undefined,
    // Without this the page inherits the layout's canonical ('/') and tells
    // search engines it is a duplicate of the home page.
    alternates: { canonical: '/about' },
  };
}

function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toLowerCase())
    .join('');
}

export default async function AboutPage() {
  const [about, config] = await Promise.all([getAbout(), getSiteConfig()]);
  const profile = await renderMarkdown(about.profileMd);
  const firstName = about.fullName.split(/\s+/)[0];

  return (
    <>
      {/* Avatar and greeting share a row; the profile runs full width beneath
          it, which keeps the text column readable down to phone widths. */}
      <div className="about-head">
        <span className="avatar">
          {about.avatarUrl ? (
            <img src={about.avatarUrl} alt={about.fullName} />
          ) : (
            initials(about.fullName)
          )}
        </span>
        <h1 className="about-h1">Hello, World! I&apos;m {firstName} 👋</h1>
      </div>

      <div className="about-lede" dangerouslySetInnerHTML={{ __html: profile.html }} />

      <div className="contact-line">
        <span className="contact-muted">{about.location}</span>
        <span className="sep">|</span>
        <a href={`mailto:${about.contactEmail}`}>Email</a>
        {config.socialLinks.map((link) => (
          <span key={link.url} className="contact-social">
            <span className="sep">|</span>
            <a href={link.url} rel="me noopener" target="_blank">
              {link.label.charAt(0).toUpperCase() + link.label.slice(1)}
            </a>
          </span>
        ))}
      </div>

      {about.positions.length > 0 && (
        <>
          <div className="section-head">
            <h2>Work history</h2>
          </div>
          <div className="timeline">
            {about.positions.map((position) => (
              <PositionEntry key={position.id} position={position} />
            ))}
          </div>
        </>
      )}

      {about.education.length > 0 && (
        <>
          <div className="section-head">
            <h2>Education</h2>
          </div>
          <div className="timeline">
            {about.education.map((entry) => (
              <EducationEntry key={entry.id} entry={entry} />
            ))}
          </div>
        </>
      )}

      {about.certifications.length > 0 && (
        <>
          <div className="section-head">
            <h2>Certifications</h2>
          </div>
          <div className="cert-grid">
            {about.certifications.map((cert) => (
              <CertificationTile key={cert.id} cert={cert} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
