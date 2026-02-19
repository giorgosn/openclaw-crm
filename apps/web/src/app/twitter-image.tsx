import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "OpenClaw CRM - The CRM your AI agent already knows how to use";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #0c0c12 0%, #0e1018 50%, #0c0c14 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)",
            top: "10%",
            left: "35%",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            marginBottom: 24,
          }}
        >
          <span style={{ fontSize: 72, fontWeight: 700, color: "#f0f0f5" }}>
            openclaw
          </span>
          <span
            style={{
              fontSize: 72,
              fontWeight: 700,
              background: "linear-gradient(135deg, #818cf8, #6366f1, #4f46e5)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            CRM
          </span>
        </div>

        {/* Tagline */}
        <p style={{ fontSize: 28, color: "#9ca3af", margin: 0 }}>
          The CRM your AI agent already knows how to use.
        </p>

        {/* Pills */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 40,
          }}
        >
          {["Agent Integration", "Self-Hosted", "AI Built In", "REST API"].map(
            (label) => (
              <div
                key={label}
                style={{
                  padding: "8px 20px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.03)",
                  color: "#9ca3af",
                  fontSize: 18,
                }}
              >
                {label}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
