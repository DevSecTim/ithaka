"use client";

import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .invite(token)
      .then(({ invite }) => setName(invite.circle.name))
      .catch((err) => setError(err instanceof Error ? err.message : "Invite not found"));
  }, [token]);

  async function accept() {
    const { circle } = await api.acceptInvite(token);
    localStorage.setItem("ithaka.circleId", circle.id);
    router.replace("/map");
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <div className="sheet" style={{ width: "min(440px, 100%)", padding: "2rem", borderRadius: 24 }}>
        <p className="sans" style={{ letterSpacing: "0.14em", fontSize: 12 }}>
          ITHAKA
        </p>
        <h1 style={{ fontSize: "2rem", marginTop: 0 }}>You are invited in.</h1>
        {error && <p className="sans">{error}</p>}
        {name && (
          <p>
            Join <em>{name}</em> — their map, their scrapbook, their wishes.
          </p>
        )}
        {!isPending && !session && (
          <div className="sans" style={{ display: "flex", gap: "0.6rem" }}>
            <Link className="ui-btn terra" href={`/signup?next=/invite/${token}`}>
              Create an account
            </Link>
            <Link className="ui-btn ghost" href={`/login?next=/invite/${token}`}>
              Sign in
            </Link>
          </div>
        )}
        {session && (
          <button className="ui-btn terra sans" onClick={() => void accept()}>
            Join this circle
          </button>
        )}
      </div>
    </main>
  );
}
