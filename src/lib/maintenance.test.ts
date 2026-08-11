import { describe, expect, it } from 'vitest';
import { maintenanceRedirect } from './maintenance';

describe('maintenanceRedirect', () => {
  it('sends every page to /maintenance while enabled', () => {
    expect(maintenanceRedirect('/', true)).toBe('/maintenance');
    expect(maintenanceRedirect('/blog', true)).toBe('/maintenance');
    expect(maintenanceRedirect('/blog/some-post', true)).toBe('/maintenance');
    expect(maintenanceRedirect('/no-such-page', true)).toBe('/maintenance');
  });

  it('leaves /maintenance alone while enabled', () => {
    expect(maintenanceRedirect('/maintenance', true)).toBeNull();
  });

  it('lets normal traffic through when disabled', () => {
    expect(maintenanceRedirect('/', false)).toBeNull();
    expect(maintenanceRedirect('/blog/some-post', false)).toBeNull();
  });

  it('sends /maintenance visitors home when disabled', () => {
    expect(maintenanceRedirect('/maintenance', false)).toBe('/');
  });
});
