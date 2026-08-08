import type { ReactNode } from 'react';
import { fmtMonthYear, fmtYear, fmtYearMonth } from '@/lib/format';
import type { CvCertification, CvEducation, CvPosition } from '@/lib/types';

/** Bullets like "Detection engineering: built …" get their label bolded, per the mockup. */
function Bullet({ text }: { text: string }) {
  const match = /^([^:]{2,60}):\s+(.*)$/s.exec(text);
  if (!match) {
    return <li>{text}</li>;
  }
  return (
    <li>
      <strong>{match[1]}:</strong> {match[2]}
    </li>
  );
}

function LogoBox({
  logoUrl,
  alt,
  className,
  fallback,
}: {
  logoUrl: string | null;
  alt: string;
  className: string;
  fallback: ReactNode;
}) {
  return (
    <span className={className}>
      {logoUrl ? <img src={logoUrl} alt={alt} loading="lazy" /> : fallback}
    </span>
  );
}

const GradCapIcon = (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M22 10L12 5 2 10l10 5 10-5z" />
    <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
  </svg>
);

export function PositionEntry({ position }: { position: CvPosition }) {
  const range = `${fmtMonthYear(position.startDate)} — ${
    position.endDate ? fmtMonthYear(position.endDate) : 'Present'
  }`;

  return (
    <div className="timeline-entry">
      <div className="timeline-icon-col">
        <LogoBox
          logoUrl={position.logoUrl}
          alt={position.company}
          className="logo-box"
          fallback="logo"
        />
        <span className="connector" />
      </div>
      <div className="timeline-body">
        <div className="entry-head">
          <span className="role-line">
            {position.title} ·{' '}
            {position.companyUrl ? (
              <a href={position.companyUrl} rel="noopener" target="_blank">
                {position.company} ↗
              </a>
            ) : (
              position.company
            )}
          </span>
          <span className="entry-meta">
            {position.location} · {range}
          </span>
        </div>
        {position.description && <p className="role-blurb">{position.description}</p>}
        {position.bullets.length > 0 && (
          <ul className="entry-bullets">
            {position.bullets.map((bullet) => (
              <Bullet key={bullet} text={bullet} />
            ))}
          </ul>
        )}
        {position.skills.length > 0 && (
          <div className="tag-row skill-row">
            {position.skills.map((skill) => (
              <span key={skill} className="tag">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function EducationEntry({ entry }: { entry: CvEducation }) {
  const range = `${fmtYear(entry.startDate)} — ${entry.endDate ? fmtYear(entry.endDate) : 'Present'}`;

  return (
    <div className="timeline-entry education">
      <div className="timeline-icon-col">
        <LogoBox
          logoUrl={entry.logoUrl}
          alt={entry.institution}
          className="logo-box edu-box"
          fallback={GradCapIcon}
        />
        <span className="connector" />
      </div>
      <div className="timeline-body">
        <div className="entry-head">
          <span className="degree-line">
            {entry.degree} {entry.field} · {entry.institution}
          </span>
          <span className="entry-meta">
            {entry.location} · {range}
          </span>
        </div>
        {entry.notes && <p className="edu-notes">{entry.notes}</p>}
      </div>
    </div>
  );
}

export function CertificationTile({ cert }: { cert: CvCertification }) {
  const expiry = cert.expiresDate ? `Expires ${fmtYearMonth(cert.expiresDate)}` : 'No expiration';

  return (
    <div className="cert-tile">
      <div className="cert-head">
        <LogoBox logoUrl={cert.logoUrl} alt={cert.issuer} className="cert-icon" fallback="cert" />
        <span className="cert-name">
          {cert.credentialUrl ? (
            <a href={cert.credentialUrl} rel="noopener" target="_blank">
              {cert.name}
            </a>
          ) : (
            cert.name
          )}
        </span>
      </div>
      {cert.description && <p className="cert-desc">{cert.description}</p>}
      <span className="cert-foot">
        Issued {fmtYearMonth(cert.issuedDate)} · {expiry}
      </span>
    </div>
  );
}
