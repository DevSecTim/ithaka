"use client";

import type { Trip } from "@/lib/types";

export function ScrapbookStrip({ trips, onOpenPin }: { trips: Trip[]; onOpenPin: (pinId: string) => void }) {
  return (
    <aside
      className="sheet"
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 16,
        padding: "1rem",
        borderRadius: 20,
        zIndex: 3,
        maxHeight: 280,
        overflow: "auto",
      }}
    >
      <p className="sans" style={{ margin: "0 0 0.6rem", letterSpacing: "0.12em", fontSize: 11 }}>
        THIS YEAR · THE JOURNAL
      </p>
      {trips.length === 0 ? (
        <p style={{ margin: 0, color: "var(--ink-soft)" }}>Visited pins will collect here as scrapbook pages.</p>
      ) : (
        <div style={{ display: "flex", gap: 12, overflowX: "auto" }}>
          {trips.map((trip) => (
            <button
              key={trip.id}
              type="button"
              onClick={() => onOpenPin(trip.pinId)}
              style={{
                minWidth: 180,
                background: "var(--paper)",
                border: "1px solid var(--rule)",
                borderRadius: 16,
                padding: 0,
                overflow: "hidden",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  height: 110,
                  background: trip.coverUrl
                    ? `center / cover url(${trip.coverUrl})`
                    : "linear-gradient(135deg, #d8ccb8, #c45c3e33)",
                }}
              />
              <div style={{ padding: "0.65rem 0.75rem 0.8rem" }}>
                <strong>{trip.pin?.placeName ?? "A trip"}</strong>
                <div className="sans" style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                  {trip.startDate ?? "Undated"} · {trip.photos.length} photos
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
