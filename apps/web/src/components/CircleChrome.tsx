"use client";

import type { Circle } from "@/lib/types";
import { useState } from "react";

export function CircleChrome({
  circles,
  circle,
  userName,
  filter,
  mine,
  listOpen,
  journalOpen,
  onFilter,
  onMine,
  onToggleList,
  onToggleJournal,
  onSwitch,
  onInvite,
  onSignOut,
  onCreateCircle,
  countries,
}: {
  circles: Circle[];
  circle: Circle | null;
  userName: string;
  filter: "all" | "wishlist" | "visited";
  mine: boolean;
  listOpen: boolean;
  journalOpen: boolean;
  onFilter: (filter: "all" | "wishlist" | "visited") => void;
  onMine: (mine: boolean) => void;
  onToggleList: () => void;
  onToggleJournal: () => void;
  onSwitch: (id: string) => void;
  onInvite: (role: string) => Promise<string>;
  onSignOut: () => void;
  onCreateCircle: () => void;
  countries: number;
}) {
  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  return (
    <>
      <div
        className="sheet sans"
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,
          display: "flex",
          gap: 8,
          alignItems: "center",
          padding: "0.55rem 0.65rem",
          borderRadius: 18,
          zIndex: 2,
          flexWrap: "wrap",
        }}
      >
        <button
          className="ui-btn ghost"
          style={{ padding: "0.45rem 0.75rem" }}
          onClick={() => setMenu((v) => !v)}
        >
          {circle?.name ?? "Circle"}
          <span style={{ opacity: 0.55 }}>({circle?.members.length ?? 0})</span>
        </button>
        {(["all", "wishlist", "visited"] as const).map((value) => (
          <button
            key={value}
            className={filter === value ? "ui-btn" : "ui-btn ghost"}
            style={{ padding: "0.4rem 0.75rem", textTransform: "capitalize" }}
            onClick={() => onFilter(value)}
          >
            {value}
          </button>
        ))}
        <button
          className={mine ? "ui-btn" : "ui-btn ghost"}
          style={{ padding: "0.4rem 0.75rem" }}
          onClick={() => onMine(!mine)}
        >
          My pins
        </button>
        {circle && (
          <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
            {circle.members.length} here
            {countries > 0 ? ` · ${countries} ${countries === 1 ? "country" : "countries"}` : ""}
          </span>
        )}
        <span style={{ flex: 1 }} />
        <button className={listOpen ? "ui-btn" : "ui-btn ghost"} style={{ padding: "0.4rem 0.75rem" }} onClick={onToggleList}>
          List
        </button>
        <button
          className={journalOpen ? "ui-btn" : "ui-btn ghost"}
          style={{ padding: "0.4rem 0.75rem" }}
          onClick={onToggleJournal}
        >
          Journal
        </button>
      </div>

      {menu && circle && (
        <div
          className="sheet sans"
          style={{
            position: "absolute",
            top: 72,
            left: 16,
            width: 320,
            padding: "1rem",
            borderRadius: 18,
            zIndex: 3,
            display: "grid",
            gap: "0.7rem",
          }}
        >
          <p style={{ margin: 0, letterSpacing: "0.1em", fontSize: 11 }}>CIRCLES</p>
          {circles.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSwitch(item.id);
                setMenu(false);
              }}
              style={{
                textAlign: "left",
                background: item.id === circle.id ? "var(--paper)" : "transparent",
                border: "1px solid var(--rule)",
                borderRadius: 12,
                padding: "0.65rem 0.75rem",
              }}
            >
              <strong>{item.name}</strong>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                {item.members.map((m) => m.name).join(", ") || item.role}
              </div>
            </button>
          ))}
          <button className="ui-btn ghost" onClick={onCreateCircle}>
            New circle
          </button>
          {circle.role !== "child" && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["member", "child"].map((role) => (
                <button
                  key={role}
                  className="ui-btn ghost"
                  onClick={async () => {
                    const url = await onInvite(role);
                    setCopied(url);
                  }}
                >
                  Invite {role}
                </button>
              ))}
            </div>
          )}
          {copied && (
            <p style={{ margin: 0, fontSize: 12 }}>
              Invite copied: {copied}
            </p>
          )}
          <p style={{ margin: 0, fontSize: 12, color: "var(--ink-soft)" }}>Signed in as {userName}</p>
          <button className="ui-btn ghost" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      )}
    </>
  );
}
