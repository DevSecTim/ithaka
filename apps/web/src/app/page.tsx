import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "2.5rem 1.4rem 5rem" }}>
      <header
        className="sans"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <strong style={{ letterSpacing: "0.08em", fontSize: "0.92rem" }}>ITHAKA</strong>
        <nav style={{ display: "flex", gap: "0.6rem" }}>
          <Link href="/login" className="ui-btn ghost">
            Sign in
          </Link>
          <Link href="/signup" className="ui-btn terra">
            Start a circle
          </Link>
        </nav>
      </header>

      <section style={{ padding: "5.5rem 0 3rem", maxWidth: 720 }}>
        <p className="sans" style={{ letterSpacing: "0.16em", textTransform: "uppercase", fontSize: 12, color: "var(--ink-soft)" }}>
          ITH-uh-kuh · a map you keep with your people
        </p>
        <h1 style={{ fontSize: "clamp(2.6rem, 7vw, 5.2rem)", lineHeight: 0.95, fontWeight: 600, margin: "0.8rem 0 1.2rem" }}>
          Keep Ithaka always in your mind.
        </h1>
        <p style={{ fontSize: "1.25rem", lineHeight: 1.55, maxWidth: 560, color: "var(--ink-soft)" }}>
          Wishlist pins are the island. The map and the scrapbook are the journey. One circle, one world, two kinds of pin.
        </p>
        <div className="sans" style={{ display: "flex", gap: "0.7rem", marginTop: "1.8rem", flexWrap: "wrap" }}>
          <Link href="/signup" className="ui-btn terra">
            Open the map
          </Link>
          <Link href="/login" className="ui-btn ghost">
            I already have a circle
          </Link>
        </div>
      </section>

      <section
        className="sheet"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1px",
          background: "var(--rule)",
          overflow: "hidden",
          borderRadius: 22,
        }}
      >
        {[
          ["Wishlist", "Outline pins for Tokyo, the zoo, somewhere with snow. Anyone in the circle can drop a wish."],
          ["Visited", "A filled pin becomes a small photograph. The map turns into a collage as you travel."],
          ["Scrapbook", "Dates, who went, a handful of photos, a short note. Polaroids, not a dump."],
        ].map(([title, copy]) => (
          <article key={title} style={{ background: "var(--cream)", padding: "1.5rem 1.4rem 1.7rem" }}>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.4rem" }}>{title}</h2>
            <p className="sans" style={{ margin: 0, color: "var(--ink-soft)", lineHeight: 1.5 }}>
              {copy}
            </p>
          </article>
        ))}
      </section>

      <blockquote style={{ margin: "4rem 0 0", maxWidth: 540, fontSize: "1.2rem", fontStyle: "italic", color: "var(--ink-soft)" }}>
        “Ithaka gave you the marvelous journey. Without her you would not have set out.”
        <footer className="sans" style={{ marginTop: "0.8rem", fontStyle: "normal", fontSize: 13, letterSpacing: "0.08em" }}>
          C.P. CAVAFY
        </footer>
      </blockquote>
    </main>
  );
}
