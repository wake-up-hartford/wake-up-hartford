// The site's public address, used in page metadata, the sitemap and the plan PDF.
// Set VITE_SITE_URL for each environment, without a trailing slash:
// the Netlify address while testing, https://hartford.wakeupwednesday.org at cut-over.
// Until it's set, the live Lovable address is used, so lovable.app keeps working.
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://wake-up-hartford.lovable.app"
).replace(/\/+$/, "");

// Host name only, for places that show the address as text.
export const SITE_HOST = new URL(SITE_URL).host;

// Full address for a path on this site, such as siteUrl("/auth").
export function siteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
