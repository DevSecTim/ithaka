"use client";

import { MapApp } from "@/components/MapApp";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MapPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, session, router]);

  if (isPending || !session) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <p className="sans">Opening the map…</p>
      </main>
    );
  }

  return <MapApp userId={session.user.id} userName={session.user.name} />;
}
