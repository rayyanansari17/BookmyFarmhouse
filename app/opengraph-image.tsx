import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "BookMyFarmhouse — Premium Farmhouse & Event Venues";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1c1917 0%, #292524 60%, #1c1917 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle top-left glow */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -120,
            width: 400,
            height: 400,
            background: "radial-gradient(circle, rgba(234,88,12,0.25) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 24 }}>
          <div
            style={{
              width: 80,
              height: 80,
              background: "#ea580c",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
            }}
          >
            🏡
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <span style={{ color: "#ffffff", fontSize: 52, fontWeight: 900, lineHeight: 1.1 }}>
              BookMy
              <span style={{ color: "#fb923c" }}>Farmhouse</span>
            </span>
            <span style={{ color: "#78716c", fontSize: 18, marginTop: 4 }}>
              bookmyfarmhouse.app
            </span>
          </div>
        </div>

        {/* Tagline */}
        <p
          style={{
            color: "#d6d3d1",
            fontSize: 26,
            margin: "0 0 0 0",
            maxWidth: 720,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Discover &amp; Book Premium Farmhouses and Event Venues Across India
        </p>

        {/* Tags */}
        <div style={{ display: "flex", gap: 16, marginTop: 48 }}>
          {["Weddings", "Parties", "Corporate Events", "Birthdays"].map((tag) => (
            <div
              key={tag}
              style={{
                background: "rgba(234,88,12,0.15)",
                border: "1px solid rgba(234,88,12,0.5)",
                borderRadius: 999,
                padding: "10px 26px",
                color: "#fb923c",
                fontSize: 17,
                fontWeight: 600,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
