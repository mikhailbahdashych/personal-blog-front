import type { Metadata } from 'next';

/**
 * The holding page the middleware sends everyone to while maintenance mode is
 * on (or the API is unreachable mid-deploy). Lives outside the (site) group on
 * purpose: it must render with zero API involvement — see the root layout.
 */

export const metadata: Metadata = {
  title: { absolute: 'Back soon · Mikhail Bahdashych' },
  robots: { index: false },
};

/** The resident, off duty. */
const PET = ' /\\_/\\\n( -.- ) zZ\n > ^ <';

export default function MaintenancePage() {
  return (
    <div className="shell">
      <main className="status-page status-page-tall">
        <pre className="status-art" aria-hidden="true">
          {PET}
        </pre>
        <p className="status-code">*** maintenance in progress ***</p>
        <h1 className="status-title">Back soon</h1>
        <p className="status-text">
          The blog is getting a fresh deploy. It should only take a few minutes — thanks for your
          patience.
        </p>
      </main>
    </div>
  );
}
