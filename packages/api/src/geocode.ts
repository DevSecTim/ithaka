export type PlaceSuggestion = {
  placeName: string;
  lat: number;
  lng: number;
  countryCode?: string;
};

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const token = process.env.MAPBOX_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (token) {
    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
    );
    url.searchParams.set("access_token", token);
    url.searchParams.set("limit", "6");
    url.searchParams.set("types", "place,locality,region,country,poi");
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as {
      features?: Array<{
        place_name: string;
        center: [number, number];
        context?: Array<{ id: string; short_code?: string }>;
        properties?: { short_code?: string };
      }>;
    };
    return (data.features ?? []).map((feature) => {
      const country = feature.context?.find((c) => c.id.startsWith("country"));
      const code = country?.short_code ?? feature.properties?.short_code;
      return {
        placeName: feature.place_name,
        lng: feature.center[0],
        lat: feature.center[1],
        countryCode: code?.replace("US-", "").slice(-2).toUpperCase(),
      };
    });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "6");
  url.searchParams.set("addressdetails", "1");
  const res = await fetch(url, {
    headers: { "User-Agent": "Ithaka/0.1 (https://github.com/DevSecTim/ithaka)" },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
    address?: { country_code?: string };
  }>;
  return data.map((place) => ({
    placeName: place.display_name,
    lat: Number(place.lat),
    lng: Number(place.lon),
    countryCode: place.address?.country_code?.toUpperCase(),
  }));
}

export async function reverseGeocode(lat: number, lng: number): Promise<PlaceSuggestion | null> {
  const token = process.env.MAPBOX_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (token) {
    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`);
    url.searchParams.set("access_token", token);
    url.searchParams.set("limit", "1");
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      features?: Array<{
        place_name: string;
        text?: string;
        context?: Array<{ id: string; short_code?: string }>;
      }>;
    };
    const feature = data.features?.[0];
    if (!feature) return { placeName: "Dropped pin", lat, lng };
    const country = feature.context?.find((c) => c.id.startsWith("country"));
    return {
      placeName: feature.text ?? feature.place_name,
      lat,
      lng,
      countryCode: country?.short_code?.slice(-2).toUpperCase(),
    };
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "jsonv2");
  const res = await fetch(url, {
    headers: { "User-Agent": "Ithaka/0.1 (https://github.com/DevSecTim/ithaka)" },
  });
  if (!res.ok) return { placeName: "Dropped pin", lat, lng };
  const data = (await res.json()) as {
    name?: string;
    display_name?: string;
    address?: { country_code?: string; city?: string; town?: string; village?: string };
  };
  return {
    placeName:
      data.name ||
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.display_name ||
      "Dropped pin",
    lat,
    lng,
    countryCode: data.address?.country_code?.toUpperCase(),
  };
}
