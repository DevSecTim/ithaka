"use client";

import { api } from "@/lib/api";
import type { Place } from "@/lib/types";
import { useState } from "react";

export function PlaceSearch({ onPick }: { onPick: (place: Place) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);

  async function search(value: string) {
    setQ(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    const { places } = await api.searchPlaces(value.trim());
    setResults(places);
    setOpen(true);
  }

  return (
    <div style={{ position: "absolute", top: 76, left: 16, width: "min(360px, calc(100% - 32px))", zIndex: 2 }}>
      <input
        className="sans"
        value={q}
        onChange={(e) => void search(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        placeholder="Search a place…"
        style={{
          width: "100%",
          border: "1px solid var(--rule)",
          background: "var(--cream)",
          borderRadius: 14,
          padding: "0.75rem 0.9rem",
          boxShadow: "var(--shadow)",
        }}
      />
      {open && results.length > 0 && (
        <ul
          className="sheet sans"
          style={{ listStyle: "none", margin: "6px 0 0", padding: 6, borderRadius: 14 }}
        >
          {results.map((place) => (
            <li key={`${place.lat}-${place.lng}-${place.placeName}`}>
              <button
                type="button"
                onClick={() => {
                  onPick(place);
                  setQ(place.placeName);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  border: 0,
                  padding: "0.65rem 0.7rem",
                  borderRadius: 10,
                }}
              >
                {place.placeName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
