"use client";

import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, session, router]);

  useEffect(() => {
    api
      .circles()
      .then(({ circles }) => {
        if (circles[0]) router.replace("/map");
      })
      .catch(() => undefined);
  }, [router]);

  async function createCircle(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const { circle } = await api.createCircle(name);
      localStorage.setItem("ithaka.circleId", circle.id);
      router.replace("/map");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create that circle");
    } finally {
      setPending(false);
    }
  }

  async function joinCircle(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const slug = token.trim().split("/").pop() ?? token;
      const { circle } = await api.acceptInvite(slug);
      localStorage.setItem("ithaka.circleId", circle.id);
      router.replace("/map");
    } catch (err) {
      setError(err instanceof Error ? err.message : "That invite did not work");
    } finally {
      setPending(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem 1rem" }}>
      <div style={{ width: "min(720px, 100%)", display: "grid", gap: "1rem" }}>
        <p className="sans" style={{ letterSpacing: "0.14em", fontSize: 12, margin: 0 }}>
          ITHAKA
        </p>
        <h1 style={{ margin: 0, fontSize: "2.4rem" }}>Name the circle, or join one.</h1>
        <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
          Family is a story you can tell. The circle is whoever belongs on this map.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
          <form className="sheet" onSubmit={createCircle} style={{ padding: "1.4rem", borderRadius: 22, display: "grid", gap: "0.9rem" }}>
            <h2 style={{ margin: 0 }}>Create a circle</h2>
            <label className="field sans">
              <span>What do you call yourselves?</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="The Riveras, Just us two…" required />
            </label>
            <button className="ui-btn terra sans" disabled={pending}>
              Open a blank map
            </button>
          </form>
          <form className="sheet" onSubmit={joinCircle} style={{ padding: "1.4rem", borderRadius: 22, display: "grid", gap: "0.9rem" }}>
            <h2 style={{ margin: 0 }}>I have an invite</h2>
            <label className="field sans">
              <span>Invite link or code</span>
              <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="inv_…" required />
            </label>
            <button className="ui-btn ghost sans" disabled={pending}>
              Join this circle
            </button>
          </form>
        </div>
        {error && (
          <p className="sans" style={{ color: "var(--terracotta-deep)" }}>
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
