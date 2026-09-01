"use client";

import type { Pin } from "@/lib/types";
import { useMemo, useState } from "react";

export function ListView({ pins, onSelect }: { pins: Pin[]; onSelect: (id: string) => void }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => pins.filter((pin) => pin.placeName.toLowerCase().includes(q.toLowerCase())),
    [pins, q],
  );

  return (
    <aside
      className="sheet"
      style={{
        position: "absolute",
        left: 16,
        top: 132,
        width: "min(360px, calc(100% - 32px))",
        maxHeight: "calc(100vh - 160px)",
        overflow: "auto",
        padding: "0.9rem",
        borderRadius: 18,
        zIndex: 3,
      }}
    >
      <input
        className="sans"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search this circle’s pins"
        style={{ width: "100%", border: "1px solid var(--rule)", borderRadius: 10, padding: "0.6rem 0.7rem" }}
      />
      <ul style={{ listStyle: "none", padding: 0, margin: "0.6rem 0 0" }}>
        {filtered.map((pin) => (
          <li key={pin.id}>
            <button
              type="button"
              onClick={() => onSelect(pin.id)}
              style={{
                width: "100%",
                display: "flex",
                gap: 10,
                alignItems: "center",
                background: "transparent",
                border: 0,
                padding: "0.55rem 0.2rem",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: pin.coverUrl ? `center / cover url(${pin.coverUrl})` : "transparent",
                  border: pin.status === "visited" ? "2px solid var(--terracotta)" : "2px dashed var(--sea)",
                  flex: "0 0 auto",
                }}
              />
              <span>
                <strong>{pin.placeName}</strong>
                <div className="sans" style={{ fontSize: 12, color: "var(--ink-soft)", textTransform: "capitalize" }}>
                  {pin.status}
                </div>
              </span>
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <p className="sans" style={{ color: "var(--ink-soft)" }}>
            No pins match that.
          </p>
        )}
      </ul>
    </aside>
  );
}
