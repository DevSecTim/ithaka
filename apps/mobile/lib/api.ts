import { authClient } from "./auth";
import { API_URL } from "./config";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const cookie = await authClient.getCookie();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
    throw new Error(data.error ?? data.message ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}
