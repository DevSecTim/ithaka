"use client";

import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import type { Circle, Pin, Place, Trip } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleChrome } from "./CircleChrome";
import { ListView } from "./ListView";
import { MapCanvas } from "./MapCanvas";
import { PinComposer } from "./PinComposer";
import { PinSheet } from "./PinSheet";
import { PlaceSearch } from "./PlaceSearch";
import { ScrapbookStrip } from "./ScrapbookStrip";

type Filter = "all" | "wishlist" | "visited";

export function MapApp({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [circleId, setCircleId] = useState<string | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [mine, setMine] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Pin | null>(null);
  const [draft, setDraft] = useState<Place | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const circle = circles.find((c) => c.id === circleId) ?? null;

  const loadCircles = useCallback(async () => {
    const { circles: next } = await api.circles();
    setCircles(next);
    if (!next.length) {
      router.replace("/onboarding");
      return;
    }
    const stored = localStorage.getItem("ithaka.circleId");
    const current = next.find((c) => c.id === stored) ?? next[0];
    if (current) {
      setCircleId(current.id);
      localStorage.setItem("ithaka.circleId", current.id);
    }
  }, [router]);

  const loadPins = useCallback(async () => {
    if (!circleId) return;
    const [{ pins: next }, scrap] = await Promise.all([
      api.pins(circleId, { status: filter, mine }),
      api.scrapbook(circleId),
    ]);
    setPins(next);
    setTrips(scrap.trips);
  }, [circleId, filter, mine]);

  useEffect(() => {
    void loadCircles().catch((err) => setError(err instanceof Error ? err.message : "Could not load circles"));
  }, [loadCircles]);

  useEffect(() => {
    void loadPins().catch((err) => setError(err instanceof Error ? err.message : "Could not load pins"));
  }, [loadPins]);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    void api
      .pin(selectedId)
      .then(({ pin }) => setSelected(pin))
      .catch(() => setSelected(null));
  }, [selectedId]);

  const visiblePins = useMemo(() => pins, [pins]);

  async function refreshSelected(pinId: string) {
    const { pin } = await api.pin(pinId);
    setSelected(pin);
    await loadPins();
  }

  return (
    <div style={{ height: "100vh", position: "relative", overflow: "hidden", background: "var(--paper-deep)" }}>
      <MapCanvas
        pins={visiblePins}
        selectedId={selectedId}
        draft={draft}
        onSelect={(id) => {
          setDraft(null);
          setSelectedId(id);
          setJournalOpen(false);
        }}
        onDrop={async (lat, lng) => {
          const { place } = await api.reverseGeocode(lat, lng);
          setSelectedId(null);
          setDraft(place ?? { placeName: "Dropped pin", lat, lng });
        }}
      />

      <CircleChrome
        circles={circles}
        circle={circle}
        userName={userName}
        filter={filter}
        mine={mine}
        listOpen={listOpen}
        journalOpen={journalOpen}
        onFilter={setFilter}
        onMine={setMine}
        onToggleList={() => setListOpen((v) => !v)}
        onToggleJournal={() => {
          setJournalOpen((v) => !v);
          setSelectedId(null);
        }}
        onSwitch={(id) => {
          setCircleId(id);
          localStorage.setItem("ithaka.circleId", id);
          setSelectedId(null);
        }}
        onInvite={async (role) => {
          if (!circle) return "";
          const { invite } = await api.createInvite(circle.id, role);
          await navigator.clipboard.writeText(invite.url);
          return invite.url;
        }}
        onSignOut={async () => {
          await authClient.signOut();
          router.replace("/");
        }}
        countries={new Set(pins.filter((p) => p.status === "visited" && p.countryCode).map((p) => p.countryCode)).size}
        onCreateCircle={() => router.push("/onboarding")}
      />

      <PlaceSearch
        onPick={(place) => {
          setSelectedId(null);
          setDraft(place);
        }}
      />

      {pins.length === 0 && !draft && !selected && (
        <div
          className="sheet sans"
          style={{
            position: "absolute",
            left: "50%",
            top: "38%",
            transform: "translate(-50%, -50%)",
            padding: "1.4rem 1.6rem",
            borderRadius: 22,
            maxWidth: 360,
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <p style={{ letterSpacing: "0.12em", fontSize: 11, margin: "0 0 0.4rem" }}>THIS CIRCLE</p>
          <h2 style={{ fontFamily: "Source Serif 4, serif", margin: "0 0 0.4rem" }}>
            Where does this circle want to go?
          </h2>
          <p style={{ margin: 0, color: "var(--ink-soft)" }}>Search a place, or click the map to drop a pin.</p>
        </div>
      )}

      {listOpen && (
        <ListView
          pins={visiblePins}
          onSelect={(id) => {
            setSelectedId(id);
            setListOpen(false);
          }}
        />
      )}

      {journalOpen && (
        <ScrapbookStrip
          trips={trips}
          onOpenPin={(pinId) => {
            setJournalOpen(false);
            setSelectedId(pinId);
          }}
        />
      )}

      {draft && circle && (
        <PinComposer
          place={draft}
          onClose={() => setDraft(null)}
          onSave={async (input) => {
            const { pin } = await api.createPin(circle.id, input);
            setDraft(null);
            setSelectedId(pin.id);
            await loadPins();
          }}
        />
      )}

      {selected && circle && (
        <PinSheet
          pin={selected}
          circle={circle}
          userId={userId}
          onClose={() => setSelectedId(null)}
          onChange={() => refreshSelected(selected.id)}
          onDeleted={async () => {
            setSelectedId(null);
            await loadPins();
          }}
        />
      )}

      {error && (
        <p
          className="sans"
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            background: "var(--cream)",
            padding: "0.6rem 0.8rem",
            borderRadius: 10,
            color: "var(--terracotta-deep)",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
