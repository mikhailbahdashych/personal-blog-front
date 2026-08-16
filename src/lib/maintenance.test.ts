import { describe, expect, it } from 'vitest';
import { maintenanceAction } from './maintenance';

describe('maintenanceAction', () => {
  it('marks every page unavailable while enabled', () => {
    expect(maintenanceAction('/', true)).toEqual({ kind: 'unavailable' });
    expect(maintenanceAction('/blog', true)).toEqual({ kind: 'unavailable' });
    expect(maintenanceAction('/blog/some-post', true)).toEqual({ kind: 'unavailable' });
    expect(maintenanceAction('/no-such-page', true)).toEqual({ kind: 'unavailable' });
  });

  it('serves the holding page in place rather than redirecting to it', () => {
    // A redirect would teach crawlers that the real URL moved; the outage has
    // to be reported at the URL that was asked for.
    expect(maintenanceAction('/blog/some-post', true)).not.toHaveProperty('to');
  });

  it('reports /maintenance itself as unavailable too', () => {
    expect(maintenanceAction('/maintenance', true)).toEqual({ kind: 'unavailable' });
  });

  it('lets normal traffic through when disabled', () => {
    expect(maintenanceAction('/', false)).toBeNull();
    expect(maintenanceAction('/blog/some-post', false)).toBeNull();
  });

  it('sends stale /maintenance visitors home when disabled', () => {
    expect(maintenanceAction('/maintenance', false)).toEqual({ kind: 'redirect', to: '/' });
  });
});
