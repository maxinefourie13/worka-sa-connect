// Public sitemap generator. No auth required.
// Builds entries from verified businesses grouped by (category_slug, province, city).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SITE_URL = Deno.env.get("PUBLIC_SITE_URL") ?? "https://sjoh.co.za";

const STATIC_ROUTES = ["/", "/directory", "/opportunities", "/pricing", "/list"];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase
    .from("businesses")
    .select("slug,category_slug,province,city,updated_at")
    .eq("is_verified", true)
    .limit(5000);

  if (error) {
    return new Response(`<?xml version="1.0"?><error>${escape(error.message)}</error>`, {
      status: 500,
      headers: { "content-type": "application/xml" },
    });
  }

  const now = new Date().toISOString();
  const urls: { loc: string; lastmod: string }[] = [];

  for (const route of STATIC_ROUTES) {
    urls.push({ loc: SITE_URL + route, lastmod: now });
  }

  // Group by (category, province, city)
  const seen = new Map<string, string>(); // key -> max updated_at
  const provSeen = new Map<string, string>();
  const catSeen = new Map<string, string>();

  for (const b of data ?? []) {
    if (!b.category_slug) continue;
    catSeen.set(
      b.category_slug,
      max(catSeen.get(b.category_slug), b.updated_at as string),
    );
    if (b.province) {
      const provKey = `${b.category_slug}/${slugify(b.province)}`;
      provSeen.set(provKey, max(provSeen.get(provKey), b.updated_at as string));
      if (b.city) {
        const key = `${b.category_slug}/${slugify(b.province)}/${slugify(b.city)}`;
        seen.set(key, max(seen.get(key), b.updated_at as string));
      }
    }
    // Individual business page
    if (b.slug) {
      urls.push({ loc: `${SITE_URL}/business/${b.slug}`, lastmod: (b.updated_at as string) ?? now });
    }
  }

  for (const [k, lastmod] of catSeen) urls.push({ loc: `${SITE_URL}/${k}`, lastmod });
  for (const [k, lastmod] of provSeen) urls.push({ loc: `${SITE_URL}/${k}`, lastmod });
  for (const [k, lastmod] of seen) urls.push({ loc: `${SITE_URL}/${k}`, lastmod });

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url><loc>${escape(u.loc)}</loc><lastmod>${u.lastmod}</lastmod><changefreq>weekly</changefreq></url>`,
      )
      .join("\n") +
    `\n</urlset>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=600, s-maxage=3600",
    },
  });
});

function max(a: string | undefined, b: string | undefined): string {
  if (!a) return b ?? new Date().toISOString();
  if (!b) return a;
  return a > b ? a : b;
}
