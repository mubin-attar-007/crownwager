import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Recreates src/app/icon.svg (apple touch icons need a solid background).
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#05080f",
        }}
      >
        <svg width="164" height="164" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      </div>
    ),
    { ...size }
  );
}
