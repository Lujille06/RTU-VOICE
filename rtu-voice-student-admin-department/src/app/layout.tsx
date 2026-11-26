import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/Toast";
import "@/styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.rtuvoice.site"),
  title: { default: "RTU VOICE", template: "%s · RTU VOICE" },
  description: "Report campus concerns, track their progress, and see them resolved. For RTU–Pasig students.",
  openGraph: {
    type: "website",
    siteName: "RTU VOICE",
    title: "RTU VOICE: your concern, heard and tracked",
    description: "Report campus concerns, track their progress, and see them resolved.",
    url: "/",
    locale: "en_PH",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#12224a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}