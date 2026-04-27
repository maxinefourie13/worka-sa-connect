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
  let path = `/services/${categorySlug}`;
  if (provinceSlug) path += `/${provinceSlug}`;
  if (citySlug) path += `/${citySlug}`;
  return SITE_URL + path;
};

export interface BusinessForJsonLd {
  id: string;
  name: string;
  city: string;
  province: string;
  rating: number;
  review_count: number;
  phone?: string | null;
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
        telephone: b.phone ?? undefined,
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
