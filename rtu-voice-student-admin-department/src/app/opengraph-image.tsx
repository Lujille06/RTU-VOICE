import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "RTU VOICE: student concern and feedback system for Rizal Technological University–Pasig";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#104595";
const GOLD_TEXT = "#b8860b"; // deeper than the gear gold, so "VOICE" stays readable when the preview is small
const GOLD_BRAND = "#d6a323";

// The font is optional: if the file is missing, the image still renders with the default font.
async function readOptional(path: string) {
  try {
    return await readFile(join(process.cwd(), path));
  } catch {
    return null;
  }
}

export default async function OpenGraphImage() {
  const logoFile = await readFile(join(process.cwd(), "public/images/rtu-voice-logo.png")); // the cropped logo (413 x 371)
  const logoSrc = `data:image/png;base64,${logoFile.toString("base64")}`;
  const fontFile = await readOptional("public/fonts/LiberationSerif-Bold.ttf");

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#ffffff" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={367} height={330} alt="" />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginLeft: 64,
              fontFamily: fontFile ? "Liberation Serif" : "serif",
              fontWeight: 700,
              fontSize: 150,
              lineHeight: 0.9, // raise toward 1 for more space between RTU and VOICE
            }}
          >
            <div style={{ color: NAVY }}>RTU</div>
            <div style={{ color: GOLD_TEXT }}>VOICE</div>
          </div>
        </div>
        <div style={{ display: "flex", height: 14 }}>
          <div style={{ width: 300, background: GOLD_BRAND }} />
          <div style={{ flex: 1, background: NAVY }} />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontFile ? [{ name: "Liberation Serif", data: fontFile, weight: 700 as const, style: "normal" as const }] : undefined,
    },
  );
}