import type { Circle, Photo, Pin, Place, Trip } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  circles: () => request<{ circles: Circle[] }>("/api/circles"),
  createCircle: (name: string) => request<{ circle: Circle }>("/api/circles", { method: "POST", body: JSON.stringify({ name }) }),
  circle: (id: string) => request<{ circle: Circle }>(`/api/circles/${id}`),
  createInvite: (circleId: string, role: string) =>
    request<{ invite: { url: string; token: string; role: string } }>(`/api/circles/${circleId}/invites`, {
      method: "POST",
      body: JSON.stringify({ role }),
    }),
  invite: (token: string) => request<{ invite: { token: string; role: string; circle: { id: string; name: string } } }>(`/api/invites/${token}`),
  acceptInvite: (token: string) => request<{ circle: Circle }>(`/api/invites/${token}/accept`, { method: "POST" }),
  pins: (circleId: string, query?: { status?: string; mine?: boolean }) => {
    const params = new URLSearchParams();
    if (query?.status && query.status !== "all") params.set("status", query.status);
    if (query?.mine) params.set("mine", "true");
    const suffix = params.toString() ? `?${params}` : "";
    return request<{ pins: Pin[] }>(`/api/circles/${circleId}/pins${suffix}`);
  },
  pin: (pinId: string) => request<{ pin: Pin }>(`/api/pins/${pinId}`),
  createPin: (circleId: string, body: Partial<Pin> & { lat: number; lng: number; placeName: string }) =>
    request<{ pin: Pin }>(`/api/circles/${circleId}/pins`, { method: "POST", body: JSON.stringify(body) }),
  updatePin: (pinId: string, body: Record<string, unknown>) =>
    request<{ pin: Pin }>(`/api/pins/${pinId}`, { method: "PATCH", body: JSON.stringify(body) }),
  deletePin: (pinId: string) => request<{ ok: boolean }>(`/api/pins/${pinId}`, { method: "DELETE" }),
  toggleWish: (pinId: string) => request<{ pin: Pin }>(`/api/pins/${pinId}/wish`, { method: "POST" }),
  visitPin: (pinId: string, body: Record<string, unknown>) =>
    request<{ pin: Pin }>(`/api/pins/${pinId}/visit`, { method: "POST", body: JSON.stringify(body) }),
  scrapbook: (circleId: string) => request<{ trips: Trip[] }>(`/api/circles/${circleId}/scrapbook`),
  updateTrip: (tripId: string, body: Record<string, unknown>) =>
    request<{ trip: Trip }>(`/api/trips/${tripId}`, { method: "PATCH", body: JSON.stringify(body) }),
  searchPlaces: (q: string) => request<{ places: Place[] }>(`/api/places?q=${encodeURIComponent(q)}`),
  reverseGeocode: (lat: number, lng: number) =>
    request<{ place: Place | null }>(`/api/places/reverse?lat=${lat}&lng=${lng}`),
  async uploadPhoto(tripId: string, file: File, caption?: string): Promise<Photo> {
    const signed = await request<{ uploadUrl: string; method: "PUT"; storageKey: string }>(
      "/api/photos/sign",
      { method: "POST", body: JSON.stringify({ tripId, contentType: file.type || "image/jpeg" }) },
    );
    const put = await fetch(signed.uploadUrl, {
      method: signed.method,
      credentials: "include",
      headers: { "Content-Type": file.type || "image/jpeg" },
      body: file,
    });
    if (!put.ok) throw new Error("Could not upload that photo");
    const created = await request<{ photo: Photo }>("/api/photos", {
      method: "POST",
      body: JSON.stringify({
        tripId,
        storageKey: signed.storageKey,
        caption,
        contentType: file.type,
      }),
    });
    return created.photo;
  },
};
