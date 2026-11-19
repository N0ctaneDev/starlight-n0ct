/**
 * Prefix root-relative internal links with Astro's configured base URL.
 * Astro exposes base through import.meta.env.BASE_URL at build time.
 */
export function resolveBasePathHref(href: string, baseUrl: string): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href;

  const base = baseUrl.replace(/\/+$/, '');
  if (!base || base === '/') return href;

  // Avoid duplicating the base when a caller already supplied it.
  if (
    href === base ||
    href.startsWith(`${base}/`) ||
    href.startsWith(`${base}?`) ||
    href.startsWith(`${base}#`)
  ) {
    return href;
  }

  return `${base}${href}`;
}
