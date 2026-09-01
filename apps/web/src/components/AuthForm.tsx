"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result =
      mode === "signup"
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });
    setPending(false);
    if (result.error) {
      setError(result.error.message ?? "Could not sign you in");
      return;
    }
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next || (mode === "signup" ? "/onboarding" : "/map"));
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem 1rem" }}>
      <form
        className="sheet"
        onSubmit={onSubmit}
        style={{ width: "min(420px, 100%)", padding: "2rem 1.6rem", borderRadius: 24, display: "grid", gap: "1rem" }}
      >
        <p className="sans" style={{ letterSpacing: "0.14em", fontSize: 12, margin: 0 }}>
          ITHAKA
        </p>
        <h1 style={{ margin: 0, fontSize: "2rem" }}>{mode === "signup" ? "Start a circle" : "Welcome back"}</h1>
        <p className="sans" style={{ margin: 0, color: "var(--ink-soft)" }}>
          {mode === "signup"
            ? "A circle can be a household, two friends, or a class trip."
            : "Open the map your people have been keeping."}
        </p>
        {mode === "signup" && (
          <label className="field sans">
            <span>Your name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
          </label>
        )}
        <label className="field sans">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label className="field sans">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </label>
        {error && (
          <p className="sans" style={{ color: "var(--terracotta-deep)", margin: 0 }}>
            {error}
          </p>
        )}
        <button className="ui-btn terra sans" disabled={pending} type="submit">
          {pending ? "One moment…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
        <p className="sans" style={{ margin: 0, fontSize: 14 }}>
          {mode === "signup" ? (
            <>
              Already here? <Link href="/login">Sign in</Link>
            </>
          ) : (
            <>
              New? <Link href="/signup">Create an account</Link>
            </>
          )}
        </p>
      </form>
    </main>
  );
}
