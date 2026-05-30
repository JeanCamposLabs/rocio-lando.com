/**
 * Prefixes root-absolute paths with the configured base path so the site works
 * both at the domain root (production: rocio-lando.com) and under a sub-path
 * (staging: jeancamposlabs.github.io/rocio-lando.com/).
 *
 * import.meta.env.BASE_URL is "/" in production and "/rocio-lando.com/" in staging.
 */
const RAW_BASE = import.meta.env.BASE_URL || '/';
const BASE = RAW_BASE.endsWith('/') ? RAW_BASE.slice(0, -1) : RAW_BASE;

export function withBase(path: string): string {
  if (!path) return path;
  // leave external / special / in-page links untouched
  if (/^(https?:|data:|mailto:|tel:|#)/.test(path)) return path;
  if (!path.startsWith('/')) return path;
  return BASE + path;
}
