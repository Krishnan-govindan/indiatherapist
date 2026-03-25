import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const APP_URL = "https://www.indiatherapist.com";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const name = searchParams.get("name") ?? "India Therapist";
  const specialty = searchParams.get("specialty") ?? "NRI Mental Health";
  const languages = searchParams.get("languages") ?? "Hindi, Tamil, Telugu";
  const rate = searchParams.get("rate") ?? "39";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #F8F5FF 0%, #E0D5FF 100%)",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top: Branding */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              background: "#7B5FB8",
              borderRadius: "12px",
              padding: "8px 16px",
              color: "white",
              fontSize: "16px",
              fontWeight: 700,
              letterSpacing: "0.5px",
            }}
          >
            India Therapist
          </div>
          <span style={{ color: "#7B5FB8", fontSize: "16px" }}>
            Online Therapy for NRIs
          </span>
        </div>

        {/* Middle: Therapist info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: "52px",
              fontWeight: 800,
              color: "#1a1a2e",
              lineHeight: 1.1,
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: "26px",
              color: "#7B5FB8",
              fontWeight: 600,
            }}
          >
            {specialty}
          </div>
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {languages.split(",").map((lang) => (
              <div
                key={lang.trim()}
                style={{
                  background: "rgba(123, 95, 184, 0.12)",
                  borderRadius: "999px",
                  padding: "6px 16px",
                  color: "#6B4AA0",
                  fontSize: "18px",
                  fontWeight: 500,
                }}
              >
                {lang.trim()}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Rate + URL */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ color: "#6b7280", fontSize: "16px" }}>
              Session rate
            </span>
            <span
              style={{
                fontSize: "36px",
                fontWeight: 800,
                color: "#1a1a2e",
              }}
            >
              ${rate}
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 400,
                  color: "#6b7280",
                  marginLeft: "4px",
                }}
              >
                /session
              </span>
            </span>
          </div>
          <div
            style={{
              color: "#9CA3AF",
              fontSize: "18px",
            }}
          >
            {APP_URL}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
