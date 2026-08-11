/**
 * Where a request should be redirected given the maintenance flag, or null to
 * let it through. Pure so the middleware's routing decision is unit-testable:
 * maintenance on sends every page to /maintenance; maintenance off sends
 * anyone still parked on /maintenance back home.
 */
export function maintenanceRedirect(pathname: string, enabled: boolean): string | null {
  const onMaintenancePage = pathname === '/maintenance';
  if (enabled && !onMaintenancePage) {
    return '/maintenance';
  }
  if (!enabled && onMaintenancePage) {
    return '/';
  }
  return null;
}
