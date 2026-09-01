"use client";

import type { PinStatus, Place } from "@/lib/types";
import { useState } from "react";

export function PinComposer({
  place,
  onClose,
  onSave,
}: {
  place: Place;
  onClose: () => void;
  onSave: (input: Place & { status: PinStatus; note?: string }) => Promise<void>;
}) {
  const [placeName, setPlaceName] = useState(place.placeName);
  const [status, setStatus] = useState<PinStatus>("wishlist");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <aside
      className="sheet"
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        width: "min(380px, calc(100% - 32px))",
        maxHeight: "calc(100vh - 32px)",
        overflow: "auto",
        padding: "1.2rem",
        borderRadius: 22,
        zIndex: 4,
        display: "grid",
        gap: "0.8rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 style={{ margin: 0, fontSize: "1.6rem" }}>Place a pin</h2>
        <button className="ui-btn ghost sans" style={{ padding: "0.3rem 0.7rem" }} onClick={onClose}>
          Close
        </button>
      </div>
      <label className="field sans">
        <span>Place</span>
        <input value={placeName} onChange={(e) => setPlaceName(e.target.value)} />
      </label>
      <div className="sans" style={{ display: "flex", gap: 8 }}>
        {(["wishlist", "visited"] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={status === value ? "ui-btn" : "ui-btn ghost"}
            onClick={() => setStatus(value)}
          >
            {value === "wishlist" ? "Wishlist" : "Visited"}
          </button>
        ))}
      </div>
      <label className="field sans">
        <span>A note, if you want one</span>
        <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      {error && (
        <p className="sans" style={{ color: "var(--terracotta-deep)", margin: 0 }}>
          {error}
        </p>
      )}
      <button
        className="ui-btn terra sans"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            await onSave({
              ...place,
              placeName,
              status,
              note: note || undefined,
            });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save that pin");
            setPending(false);
          }
        }}
      >
        {pending ? "Saving…" : "Drop pin"}
      </button>
    </aside>
  );
}
