import { ImageResponse } from "next/og";

// Satori rules: inline styles only, explicit display:flex on multi-child divs,
// bundled font only (no fetching — build must work offline).
export const alt = "CrownWager — Data-Driven Sports Betting Analytics";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#05080f",
          backgroundImage:
            "radial-gradient(circle at 12% 8%, rgba(16,185,129,0.25), transparent 55%), " +
            "radial-gradient(circle at 88% 4%, rgba(6,182,212,0.22), transparent 55%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {/* Logomark (mirrors src/app/icon.svg) */}
          <svg width="112" height="112" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#34d399" />
                <stop offset="1" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <rect x="1.5" y="1.5" width="37" height="37" rx="11" fill="#0b1120" stroke="url(#g)" strokeWidth="2" />
            <path
              d="M10 26.5L17 19.5L21.5 24L30 13.5"
              stroke="url(#g)"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="30" cy="13.5" r="2.6" fill="url(#g)" />
          </svg>
          <div style={{ display: "flex", fontSize: 104, fontWeight: 800, letterSpacing: -4 }}>
            <span
              style={{
                backgroundImage: "linear-gradient(135deg, #34d399, #06b6d4)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Crown
            </span>
            <span style={{ color: "#fff" }}>Wager</span>
          </div>
        </div>
        <div style={{ marginTop: 32, fontSize: 34, color: "#94a3b8" }}>
          Find the edge. Bet with numbers, not vibes.
        </div>
      </div>
    ),
    { ...size }
  );
}
