// SEO helpers for programmatic location pages.
import { CATEGORIES, PROVINCES } from "./mockData";

export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const SITE_URL =
  typeof window !== "undefined" ? window.location.origin : "https://sjoh.co.za";

export const categoryFromSlug = (slug: string) =>
  CATEGORIES.find((c) => c.slug === slug);

export const provinceFromSlug = (slug: string): string | undefined =>
  PROVINCES.find((p) => slugify(p) === slug);

// Cities aren't a fixed list — they come from the DB. We just title-case the slug.
export const titleFromSlug = (slug: string): string =>
  slug
    .split("-")
    .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w.toUpperCase()))
    .join(" ");

export interface CityRecord {
  city: string;
  province: string;
  count: number;
}

export const buildLocationCanonical = (
  categorySlug: string,
  provinceSlug?: string,
  citySlug?: string,
): string => {
  let path = `/${categorySlug}`;
  if (provinceSlug) path += `/${provinceSlug}`;
  if (citySlug) path += `/${citySlug}`;
  return SITE_URL + path;
};

/**
 * Map category slugs to the search-friendly noun real people type
 * (e.g. someone Googles "plumber Cape Town", not "plumbing Cape Town").
 * Used in <title>, <h1>, and meta descriptions on programmatic pages.
 */
export const CATEGORY_KEYWORD_MAP: Record<string, string> = {
  plumbing: "Plumber",
  electrical: "Electrician",
  handyman: "Handyman",
  roofing: "Roofer",
  painting: "Painter",
  carpentry: "Carpenter",
  "appliance-repair": "Appliance Repair Technician",
  "home-cleaning": "Home Cleaner",
  "deep-cleaning": "Deep Cleaning Service",
  "carpet-cleaning": "Carpet Cleaner",
  "laundry-ironing": "Laundry & Ironing Service",
  "window-cleaning": "Window Cleaner",
  "post-construction-cleaning": "Post-Construction Cleaner",
  "lawn-mowing": "Lawn Mowing Service",
  "garden-services": "Gardener",
  "tree-felling": "Tree Feller",
  landscaping: "Landscaper",
  irrigation: "Irrigation Specialist",
  "pool-maintenance": "Pool Maintenance Service",
  "mobile-car-wash": "Mobile Car Wash",
  mechanics: "Mechanic",
  "panel-beating": "Panel Beater",
  "tire-services": "Tyre Fitter",
  "vehicle-detailing": "Car Detailer",
  "roadside-assistance": "Roadside Assistance",
  builders: "Builder",
  renovations: "Renovation Contractor",
  tiling: "Tiler",
  bricklaying: "Bricklayer",
  paving: "Paver",
  "steelwork-fabrication": "Steel Fabricator",
  "event-planning": "Event Planner",
  catering: "Caterer",
  "decor-hiring": "Decor & Hiring Service",
  photography: "Photographer",
  "djs-entertainment": "DJ",
  "kids-party-services": "Kids Party Service",
  "web-design": "Web Designer",
  "graphic-design": "Graphic Designer",
  "social-media-management": "Social Media Manager",
  copywriting: "Copywriter",
  "virtual-assistants": "Virtual Assistant",
  "it-support": "IT Support Specialist",
  "personal-training": "Personal Trainer",
  "hair-beauty": "Hair & Beauty Specialist",
  "makeup-artists": "Makeup Artist",
  "life-coaching": "Life Coach",
  tutoring: "Tutor",
};

export const categoryKeyword = (slug: string | undefined): string => {
  if (!slug) return "Service Provider";
  if (CATEGORY_KEYWORD_MAP[slug]) return CATEGORY_KEYWORD_MAP[slug];
  const cat = categoryFromSlug(slug);
  return cat?.name ?? titleFromSlug(slug);
};

/**
 * Reserved top-level slugs that must NOT be matched by the programmatic
 * SEO category route. Keep in sync with the routes in App.tsx.
 */
export const RESERVED_TOP_LEVEL_SLUGS = new Set<string>([
  "directory",
  "business",
  "opportunities",
  "requests",
  "leads",
  "quote",
  "unsubscribe",
  "preview-home",
  "terms",
  "privacy",
  "pricing",
  "list",
  "dashboard",
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "auth",
  "email-preferences",
  "api",
  "admin",
  "assets",
  "static",
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
]);

export const isReservedSlug = (slug: string | undefined): boolean =>
  !!slug && RESERVED_TOP_LEVEL_SLUGS.has(slug.toLowerCase());

export interface BusinessForJsonLd {
  id: string;
  name: string;
  city: string;
  province: string;
  rating: number;
  review_count: number;
  address?: string | null;
  website?: string | null;
  slug: string;
}

export const buildLocationJsonLd = (
  categoryName: string,
  cityName: string,
  provinceName: string,
  businesses: BusinessForJsonLd[],
) => {
  const itemList = {
    "@type": "ItemList",
    itemListElement: businesses.slice(0, 20).map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LocalBusiness",
        "@id": `${SITE_URL}/business/${b.slug}`,
        name: b.name,
        url: `${SITE_URL}/business/${b.slug}`,
        // Deliberately omit telephone — we don't expose phone numbers
        // in structured data to prevent bot scraping.
        address: {
          "@type": "PostalAddress",
          streetAddress: b.address ?? undefined,
          addressLocality: b.city,
          addressRegion: b.province,
          addressCountry: "ZA",
        },
        aggregateRating:
          b.review_count > 0
            ? {
                "@type": "AggregateRating",
                ratingValue: b.rating,
                reviewCount: b.review_count,
              }
            : undefined,
      },
    })),
  };

  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: categoryName,
    areaServed: {
      "@type": "City",
      name: cityName,
      containedInPlace: { "@type": "AdministrativeArea", name: provinceName },
    },
    provider: itemList,
  };

  return service;
};
