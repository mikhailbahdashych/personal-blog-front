/** '2026-07-14T09:00:00Z' -> '2026-07-14'. Published content must have a date. */
export function fmtDate(iso: string | null): string {
  if (!iso) {
    throw new Error('Expected a publish date on published content');
  }
  return iso.slice(0, 10);
}

export function fmtYear(iso: string | null): string {
  return fmtDate(iso).slice(0, 4);
}

/** '2026-07-01' -> 'Jul 2026' (CV timeline ranges). */
export function fmtMonthYear(iso: string): string {
  const [year, month] = iso.split('-');
  const names = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const index = Number(month) - 1;
  if (!year || index < 0 || index > 11) {
    throw new Error(`Invalid date: '${iso}'`);
  }
  return `${names[index]} ${year}`;
}

/** '2026-03-01' -> '2026-03' (certification issue/expiry lines). */
export function fmtYearMonth(iso: string): string {
  return iso.slice(0, 7);
}
