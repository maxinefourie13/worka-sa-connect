// Shared helpers for Google Places API integration.

const PLACES_BASE = "https://places.googleapis.com/v1";

export interface PlaceDetails {
  placeId: string;
  name: string;
  rating: number | null;
  userRatingCount: number | null;
  googleMapsUri: string | null;
  reviews: Array<{
    authorName: string;
    authorPhotoUrl: string | null;
    rating: number;
    text: string | null;
    relativePublishTimeDescription: string | null;
    publishTime: string | null;
    languageCode: string | null;
  }>;
}

/** Resolve any Google Maps URL (including short maps.app.goo.gl links) to a Place ID. */
export async function resolvePlaceIdFromUrl(rawUrl: string, apiKey: string): Promise<string> {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) throw new Error("Invalid URL");

  // Follow short URL redirects to get the canonical URL.
  if (/maps\.app\.goo\.gl|goo\.gl\/maps/i.test(url)) {
    const r = await fetch(url, { method: "GET", redirect: "follow" });
    url = r.url || url;
  }

  // 1) /place/.../!1s<PLACE_ID> (FTID-style, looks like 0x...:0x...)
  const ftidMatch = url.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i);
  if (ftidMatch) {
    return await resolveFromFtid(ftidMatch[1], apiKey);
  }

  // 2) Direct ChIJ-prefixed place_id in URL
  const placeIdMatch = url.match(/[?&]place_id=([A-Za-z0-9_-]+)/);
  if (placeIdMatch) return placeIdMatch[1];

  // 3) Fall back to text search using the place name + coords from URL
  const nameMatch = url.match(/\/place\/([^/]+)\//);
  const coordsMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (nameMatch) {
    const query = decodeURIComponent(nameMatch[1].replace(/\+/g, " "));
    return await searchPlaceId(query, coordsMatch ? { lat: Number(coordsMatch[1]), lng: Number(coordsMatch[2]) } : undefined, apiKey);
  }

  throw new Error("Could not extract a Place ID from this URL. Please paste the full Google Maps link to your business listing.");
}

async function resolveFromFtid(ftid: string, apiKey: string): Promise<string> {
  // Google's older FTID can be exchanged via a Place Details lookup using the legacy Places API.
  // The newer Places API doesn't expose FTID lookup directly, so we use the legacy endpoint.
  const r = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?ftid=${encodeURIComponent(ftid)}&fields=place_id&key=${apiKey}`,
  );
  const data = await r.json();
  if (data.status !== "OK" || !data.result?.place_id) {
    throw new Error(`Google rejected the listing lookup: ${data.error_message || data.status}`);
  }
  return data.result.place_id as string;
}

async function searchPlaceId(query: string, bias: { lat: number; lng: number } | undefined, apiKey: string): Promise<string> {
  const body: Record<string, unknown> = { textQuery: query, pageSize: 1 };
  if (bias) {
    body.locationBias = {
      circle: { center: { latitude: bias.lat, longitude: bias.lng }, radius: 5000 },
    };
  }
  const r = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id",
    },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok || !data.places?.[0]?.id) {
    throw new Error(`Google search failed: ${data.error?.message || r.statusText}`);
  }
  return data.places[0].id as string;
}

/** Fetch place details + up to 5 most recent reviews. */
export async function fetchPlaceDetails(placeId: string, apiKey: string): Promise<PlaceDetails> {
  const fieldMask = [
    "id",
    "displayName",
    "rating",
    "userRatingCount",
    "googleMapsUri",
    "reviews",
  ].join(",");

  const r = await fetch(`${PLACES_BASE}/places/${encodeURIComponent(placeId)}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask,
    },
  });
  const data = await r.json();
  if (!r.ok) {
    throw new Error(`Google details failed: ${data.error?.message || r.statusText}`);
  }

  return {
    placeId: data.id,
    name: data.displayName?.text ?? "Unknown",
    rating: typeof data.rating === "number" ? data.rating : null,
    userRatingCount: typeof data.userRatingCount === "number" ? data.userRatingCount : null,
    googleMapsUri: data.googleMapsUri ?? null,
    reviews: Array.isArray(data.reviews)
      ? data.reviews.slice(0, 5).map((r: any) => ({
          authorName: r.authorAttribution?.displayName ?? "Anonymous",
          authorPhotoUrl: r.authorAttribution?.photoUri ?? null,
          rating: Number(r.rating) || 0,
          text: r.text?.text ?? r.originalText?.text ?? null,
          relativePublishTimeDescription: r.relativePublishTimeDescription ?? null,
          publishTime: r.publishTime ?? null,
          languageCode: r.text?.languageCode ?? r.originalText?.languageCode ?? null,
        }))
      : [],
  };
}
