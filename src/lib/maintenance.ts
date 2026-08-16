/**
 * What to do with a request given the maintenance flag. Pure so the
 * middleware's routing decision is unit-testable.
 *
 * While maintenance is on, every page — including /maintenance itself — is
 * served as "temporarily unavailable" at the URL that was asked for. It is
 * deliberately not a redirect: a search engine following one to a holding page
 * learns that the real URL moved, and pages start dropping out of the index if
 * the outage lasts. A 503 at the original URL says "come back later" instead,
 * which is exactly what this is.
 *
 * With the flag off, anyone still parked on /maintenance is sent home.
 */
export type MaintenanceAction = { kind: 'unavailable' } | { kind: 'redirect'; to: string } | null;

export function maintenanceAction(pathname: string, enabled: boolean): MaintenanceAction {
  if (enabled) {
    return { kind: 'unavailable' };
  }
  if (pathname === '/maintenance') {
    return { kind: 'redirect', to: '/' };
  }
  return null;
}
