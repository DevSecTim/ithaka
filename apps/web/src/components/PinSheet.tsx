"use client";

import { api } from "@/lib/api";
import type { Circle, Pin } from "@/lib/types";
import { useState } from "react";

export function PinSheet({
  pin,
  circle,
  userId,
  onClose,
  onChange,
  onDeleted,
}: {
  pin: Pin;
  circle: Circle;
  userId: string;
  onClose: () => void;
  onChange: () => Promise<void>;
  onDeleted: () => Promise<void>;
}) {
  const latest = pin.trips?.[0];
  const [note, setNote] = useState(latest?.note ?? pin.note ?? "");
  const [startDate, setStartDate] = useState(latest?.startDate ?? "");
  const [endDate, setEndDate] = useState(latest?.endDate ?? "");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const wanted = pin.wishes?.some((w) => w.userId === userId);

  async function saveTrip() {
    if (!latest) return;
    setBusy(true);
    await api.updateTrip(latest.id, { note, startDate: startDate || null, endDate: endDate || null });
    await onChange();
    setBusy(false);
  }

  return (
    <aside
      className="sheet"
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        width: "min(420px, calc(100% - 32px))",
        maxHeight: "calc(100vh - 32px)",
        overflow: "auto",
        padding: "1.2rem 1.2rem 1.4rem",
        borderRadius: 22,
        zIndex: 4,
        display: "grid",
        gap: "0.85rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div>
          <p className="sans" style={{ margin: 0, letterSpacing: "0.12em", fontSize: 11, color: "var(--ink-soft)" }}>
            {pin.status === "visited" ? "VISITED" : "WISHLIST"}
            {pin.countryCode ? ` · ${pin.countryCode}` : ""}
          </p>
          <h2 style={{ margin: "0.2rem 0 0", fontSize: "1.8rem" }}>{pin.placeName}</h2>
        </div>
        <button className="ui-btn ghost sans" style={{ padding: "0.3rem 0.7rem", height: 36 }} onClick={onClose}>
          Close
        </button>
      </div>

      {pin.status === "wishlist" && (
        <>
          <p className="sans" style={{ margin: 0, color: "var(--ink-soft)" }}>
            {pin.wishes?.length
              ? `${pin.wishes.map((w) => w.name).join(", ")} want to go.`
              : "No one has said they want to go yet."}
          </p>
          <div className="sans" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="ui-btn ghost" onClick={() => void api.toggleWish(pin.id).then(onChange)}>
              {wanted ? "I no longer want this" : "I want to go"}
            </button>
            <button
              className="ui-btn terra"
              onClick={() => void api.visitPin(pin.id, { note, travelerIds: [userId] }).then(onChange)}
            >
              We went
            </button>
          </div>
        </>
      )}

      {latest && (
        <section style={{ display: "grid", gap: "0.7rem" }}>
          <h3 style={{ margin: 0 }}>Scrapbook</h3>
          <div className="sans" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <label className="field">
              <span>From</span>
              <input type="date" value={startDate ?? ""} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label className="field">
              <span>Until</span>
              <input type="date" value={endDate ?? ""} onChange={(e) => setEndDate(e.target.value)} />
            </label>
          </div>
          <p className="sans" style={{ margin: 0, color: "var(--ink-soft)", fontSize: 14 }}>
            Who went:{" "}
            {latest.travelers.length
              ? latest.travelers.map((t) => t.name).join(", ")
              : "Add people from this circle later."}
          </p>
          <div className="sans" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {circle.members.map((member) => {
              const here = latest.travelers.some((t) => t.userId === member.userId);
              return (
                <button
                  key={member.userId}
                  className={here ? "ui-btn" : "ui-btn ghost"}
                  style={{ padding: "0.3rem 0.7rem" }}
                  onClick={() => {
                    const travelerIds = here
                      ? latest.travelers.filter((t) => t.userId !== member.userId).map((t) => t.userId)
                      : [...latest.travelers.map((t) => t.userId), member.userId];
                    void api.updateTrip(latest.id, { travelerIds }).then(onChange);
                  }}
                >
                  {member.name}
                </button>
              );
            })}
          </div>
          <label className="field sans">
            <span>A short note</span>
            <textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Best bit?" />
          </label>
          <button className="ui-btn ghost sans" disabled={busy} onClick={() => void saveTrip()}>
            Save the page
          </button>

          {latest.photos[0] && (
            <img
              src={latest.coverUrl ?? latest.photos[0].url}
              alt=""
              style={{ width: "100%", borderRadius: 16, aspectRatio: "4 / 3", objectFit: "cover" }}
            />
          )}
          <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
            {latest.photos.map((photo) => (
              <figure key={photo.id} style={{ margin: 0, minWidth: 92 }}>
                <img
                  src={photo.url}
                  alt={photo.caption ?? ""}
                  style={{ width: 92, height: 92, objectFit: "cover", borderRadius: 10, background: "var(--paper)" }}
                />
                {photo.caption && (
                  <figcaption className="sans" style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                    {photo.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
          <label className="field sans">
            <span>Add a photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setBusy(true);
                await api.uploadPhoto(latest.id, file, caption || undefined);
                setCaption("");
                await onChange();
                setBusy(false);
              }}
            />
          </label>
          <label className="field sans">
            <span>Caption for the next photo</span>
            <input value={caption} onChange={(e) => setCaption(e.target.value)} />
          </label>
        </section>
      )}

      {(pin.trips?.length ?? 0) > 1 && (
        <section className="sans">
          <p style={{ letterSpacing: "0.1em", fontSize: 11 }}>OLDER VISITS</p>
          {pin.trips?.slice(1).map((trip) => (
            <p key={trip.id} style={{ margin: "0.3rem 0" }}>
              {trip.startDate ?? "Another trip"} · {trip.photos.length} photos
            </p>
          ))}
        </section>
      )}

      <button
        className="ui-btn ghost sans"
        onClick={async () => {
          if (!confirm("Remove this pin from the map?")) return;
          await api.deletePin(pin.id);
          await onDeleted();
        }}
      >
        Remove pin
      </button>
    </aside>
  );
}
